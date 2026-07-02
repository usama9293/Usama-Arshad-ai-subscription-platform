import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

export const FREE_MESSAGES_PER_MONTH = 3;

@Entity('monthly_free_usage')
@Unique(['userId', 'yearMonth'])
export class MonthlyFreeUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  yearMonth: string;

  @Column({ type: 'int', default: 0 })
  messagesUsed: number;

  hasRemainingFreeQuota(): boolean {
    return this.messagesUsed < FREE_MESSAGES_PER_MONTH;
  }

  remainingFreeQuota(): number {
    return FREE_MESSAGES_PER_MONTH - this.messagesUsed;
  }

  deductOne(): void {
    if (!this.hasRemainingFreeQuota()) {
      throw new Error('Cannot deduct: no free quota remaining');
    }
    this.messagesUsed += 1;
  }
}
