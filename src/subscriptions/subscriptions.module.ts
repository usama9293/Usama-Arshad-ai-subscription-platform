import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionBundle } from './domain/entities/subscription-bundle.entity';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionsService } from './services/subscriptions.service';
import { BillingSimulatorService } from './services/billing-simulator.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionBundle])],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionRepository,
    SubscriptionsService,
    BillingSimulatorService,
  ],
  exports: [SubscriptionRepository, SubscriptionsService],
})
export class SubscriptionsModule {}
