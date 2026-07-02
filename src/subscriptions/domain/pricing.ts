import {
  BundleTier,
  BillingCycle,
} from './entities/subscription-bundle.entity';

export const TIER_PRICING: Record<BundleTier, Record<BillingCycle, number>> = {
  [BundleTier.BASIC]: { [BillingCycle.MONTHLY]: 5, [BillingCycle.YEARLY]: 50 },
  [BundleTier.PRO]: { [BillingCycle.MONTHLY]: 20, [BillingCycle.YEARLY]: 200 },
  [BundleTier.ENTERPRISE]: {
    [BillingCycle.MONTHLY]: 100,
    [BillingCycle.YEARLY]: 1000,
  },
};
