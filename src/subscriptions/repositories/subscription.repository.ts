import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { SubscriptionBundle, BundleStatus } from '../domain/entities/subscription-bundle.entity';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionBundle)
    private readonly repo: Repository<SubscriptionBundle>,
  ) {}

  async save(bundle: SubscriptionBundle): Promise<SubscriptionBundle> {
    return this.repo.save(bundle);
  }

  async findById(id: string): Promise<SubscriptionBundle | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveByUser(userId: string): Promise<SubscriptionBundle[]> {
    return this.repo.find({
      where: { userId, status: BundleStatus.ACTIVE },
    });
  }
  async findActiveByUserOrderedByRenewalDateDesc(userId: string): Promise<SubscriptionBundle[]> {
    return this.repo.find({
      where: { userId, status: BundleStatus.ACTIVE },
      order: { renewalDate: 'DESC' },
    });
  }

  async findDueForRenewal(asOf: Date): Promise<SubscriptionBundle[]> {
    return this.repo.find({
      where: {
        status: BundleStatus.ACTIVE,
        autoRenew: true,
        renewalDate: LessThanOrEqual(asOf),
      },
    });
  }
}
