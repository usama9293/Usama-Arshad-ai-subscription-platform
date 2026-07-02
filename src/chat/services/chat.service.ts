import { Injectable } from '@nestjs/common';
import { MockOpenAiService } from './mock-openai.service';
import { MonthlyUsageRepository } from '../repositories/monthly-usage.repository';
import { ChatMessageRepository } from '../repositories/chat-message.repository';
import { SubscriptionRepository } from '../../subscriptions/repositories/subscription.repository';
import {
  ChatMessage,
  UsageSource,
} from '../domain/entities/chat-message.entity';
import { QuotaExceededException } from '../domain/errors/quota-exceeded.exception';
import { AskQuestionDto } from '../dto/ask-question.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly mockOpenAi: MockOpenAiService,
    private readonly monthlyUsageRepo: MonthlyUsageRepository,
    private readonly chatMessageRepo: ChatMessageRepository,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async askQuestion(dto: AskQuestionDto): Promise<ChatMessage> {
    const { userId, question } = dto;

    const deductionPlan = await this.resolveDeductionSource(userId);
    const aiResponse = await this.mockOpenAi.getCompletion(question);

    await this.applyDeduction(deductionPlan);

    const message = new ChatMessage();
    message.userId = userId;
    message.question = question;
    message.answer = aiResponse.answer;
    message.tokensUsed = aiResponse.tokensUsed;
    message.source = deductionPlan.source;
    message.bundleId =
      deductionPlan.source === UsageSource.BUNDLE
        ? (deductionPlan.bundleId ?? null)
        : null;

    return this.chatMessageRepo.save(message);
  }

  private async resolveDeductionSource(userId: string): Promise<DeductionPlan> {
    const freeUsage =
      await this.monthlyUsageRepo.findOrCreateForCurrentMonth(userId);

    if (freeUsage.hasRemainingFreeQuota()) {
      return { source: UsageSource.FREE_QUOTA, freeUsage };
    }
    const bundles =
      await this.subscriptionRepo.findActiveByUserOrderedByRenewalDateDesc(
        userId,
      );
    const usableBundle = bundles.find((bundle) => bundle.hasRemainingQuota());

    if (usableBundle) {
      return { source: UsageSource.BUNDLE, bundle: usableBundle };
    }

    throw new QuotaExceededException(userId);
  }

  private async applyDeduction(plan: DeductionPlan): Promise<void> {
    if (plan.source === UsageSource.FREE_QUOTA) {
      plan.freeUsage.deductOne();
      await this.monthlyUsageRepo.save(plan.freeUsage);
    } else {
      plan.bundle.deductOne();
      await this.subscriptionRepo.save(plan.bundle);
    }
  }
}

type DeductionPlan =
  | {
      source: UsageSource.FREE_QUOTA;
      freeUsage: import('../domain/entities/monthly-usage.entity').MonthlyFreeUsage;
    }
  | {
      source: UsageSource.BUNDLE;
      bundle: import('../../subscriptions/domain/entities/subscription-bundle.entity').SubscriptionBundle;
      bundleId?: never;
    };
