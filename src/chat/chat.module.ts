import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyFreeUsage } from './domain/entities/monthly-usage.entity';
import { ChatMessage } from './domain/entities/chat-message.entity';
import { ChatService } from './services/chat.service';
import { MockOpenAiService } from './services/mock-openai.service';
import { MonthlyUsageRepository } from './repositories/monthly-usage.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatController } from './chat.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyFreeUsage, ChatMessage]),
    SubscriptionsModule, // gives us access to SubscriptionRepository (it's exported there)
  ],
  controllers: [ChatController],
  providers: [ChatService, MockOpenAiService, MonthlyUsageRepository, ChatMessageRepository],
})
export class ChatModule {}
