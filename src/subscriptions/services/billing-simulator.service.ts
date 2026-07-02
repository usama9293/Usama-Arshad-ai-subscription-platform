import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import {
  BillingCycle,
  BundleStatus,
  TIER_QUOTAS,
} from '../domain/entities/subscription-bundle.entity';

@Injectable()
export class BillingSimulatorService {
  private readonly logger = new Logger(BillingSimulatorService.name);

  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async runBillingCycle(asOf: Date = new Date()): Promise<{
    renewed: string[];
    failed: string[];
  }> {
    const due = await this.subscriptionRepo.findDueForRenewal(asOf);
    const renewed: string[] = [];
    const failed: string[] = [];

    for (const bundle of due) {
      const paymentSucceeded = this.simulatePayment();

      if (paymentSucceeded) {
        const cycleMonths = bundle.billingCycle === BillingCycle.MONTHLY ? 1 : 12;
        const newEnd = new Date(bundle.endDate);
        newEnd.setMonth(newEnd.getMonth() + cycleMonths);

        bundle.messagesUsed = 0;
        bundle.endDate = newEnd;
        bundle.renewalDate = newEnd;
        bundle.maxMessages = TIER_QUOTAS[bundle.tier];

        renewed.push(bundle.id);
      } else {
        bundle.status = BundleStatus.INACTIVE;
        failed.push(bundle.id);
      }

      await this.subscriptionRepo.save(bundle);
    }

    this.logger.log(`Billing cycle: 
        ${renewed.length} renewed, ${failed.length} failed`);
    return { renewed, failed };
  }

  private simulatePayment(): boolean {
    return Math.random() > 0.1;
  }
}
