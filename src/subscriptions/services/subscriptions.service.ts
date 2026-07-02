import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import {
  SubscriptionBundle,
  BillingCycle,
  BundleStatus,
  TIER_QUOTAS,
} from '../domain/entities/subscription-bundle.entity';
import { TIER_PRICING } from '../domain/pricing';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async createSubscription(
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionBundle> {
    const now = new Date();
    const endDate = this.calculateEndDate(now, dto.billingCycle);

    const bundle = new SubscriptionBundle();
    bundle.userId = dto.userId;
    bundle.tier = dto.tier;
    bundle.billingCycle = dto.billingCycle;
    bundle.maxMessages = TIER_QUOTAS[dto.tier];
    bundle.messagesUsed = 0;
    bundle.price = TIER_PRICING[dto.tier][dto.billingCycle];
    bundle.autoRenew = dto.autoRenew ?? true;
    bundle.status = BundleStatus.ACTIVE;
    bundle.startDate = now;
    bundle.endDate = endDate;
    bundle.renewalDate = endDate;

    return this.subscriptionRepo.save(bundle);
  }

  async cancelSubscription(bundleId: string): Promise<SubscriptionBundle> {
    const bundle = await this.subscriptionRepo.findById(bundleId);
    if (!bundle) throw new NotFoundException('Subscription not found');

    if (bundle.status === BundleStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    bundle.autoRenew = false;
    bundle.status = BundleStatus.CANCELLED;

    return this.subscriptionRepo.save(bundle);
  }

  async getUserSubscriptions(userId: string): Promise<SubscriptionBundle[]> {
    return this.subscriptionRepo.findActiveByUser(userId);
  }

  private calculateEndDate(start: Date, cycle: BillingCycle): Date {
    const end = new Date(start);
    if (cycle === BillingCycle.MONTHLY) {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }
}
