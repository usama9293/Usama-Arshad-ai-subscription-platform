import { IsEnum, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import {
  BundleTier,
  BillingCycle,
} from '../domain/entities/subscription-bundle.entity';

export class CreateSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsEnum(BundleTier)
  tier: BundleTier;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = true;
}
