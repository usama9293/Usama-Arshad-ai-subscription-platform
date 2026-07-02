import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';

export enum BundleTier {
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum BundleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export const TIER_QUOTAS: Record<BundleTier, number | null> = {
  [BundleTier.BASIC]: 10,
  [BundleTier.PRO]: 100,
  [BundleTier.ENTERPRISE]: null,
};

@Entity('subscription_bundles')
export class SubscriptionBundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: BundleTier })
  tier: BundleTier;

  @Column({ type: 'enum', enum: BillingCycle })
  billingCycle: BillingCycle;

  @Column({ type: 'int', nullable: true })
  maxMessages: number | null;

  @Column({ type: 'int', default: 0 })
  messagesUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ type: 'enum', enum: BundleStatus, default: BundleStatus.ACTIVE })
  status: BundleStatus;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'timestamptz' })
  renewalDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  hasRemainingQuota(): boolean {
    if (this.status !== BundleStatus.ACTIVE) return false;
    if (this.maxMessages === null) return true;
    return this.messagesUsed < this.maxMessages;
  }

  remainingQuota(): number | null {
    if (this.maxMessages === null) return null;
    return this.maxMessages - this.messagesUsed;
  }

  deductOne(): void {
    if (!this.hasRemainingQuota()) {
      throw new Error('Cannot deduct: bundle has no remaining quota');
    }
    this.messagesUsed += 1;
  }
}
