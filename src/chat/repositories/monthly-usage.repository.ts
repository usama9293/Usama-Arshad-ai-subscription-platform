import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyFreeUsage } from '../domain/entities/monthly-usage.entity';

@Injectable()
export class MonthlyUsageRepository {
  constructor(
    @InjectRepository(MonthlyFreeUsage)
    private readonly repo: Repository<MonthlyFreeUsage>,
  ) {}

  async findOrCreateForCurrentMonth(userId: string): Promise<MonthlyFreeUsage> {
    const yearMonth = this.getCurrentYearMonth();
    let usage = await this.repo.findOne({ where: { userId, yearMonth } });

    if (!usage) {
      usage = this.repo.create({ userId, yearMonth, messagesUsed: 0 });
      usage = await this.repo.save(usage);
    }

    return usage;
  }

  async save(usage: MonthlyFreeUsage): Promise<MonthlyFreeUsage> {
    return this.repo.save(usage);
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }
}
