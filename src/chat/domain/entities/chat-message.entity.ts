import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { SubscriptionBundle } from '../../../subscriptions/domain/entities/subscription-bundle.entity';

export enum UsageSource {
  FREE_QUOTA = 'FREE_QUOTA',
  BUNDLE = 'BUNDLE',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'int' })
  tokensUsed: number;

  @Column({ type: 'enum', enum: UsageSource })
  source: UsageSource;

  @Column({ nullable: true })
  bundleId: string | null;

  @ManyToOne(() => SubscriptionBundle, { nullable: true })
  @JoinColumn({ name: 'bundleId' })
  bundle: SubscriptionBundle | null;

  @CreateDateColumn()
  createdAt: Date;
}
