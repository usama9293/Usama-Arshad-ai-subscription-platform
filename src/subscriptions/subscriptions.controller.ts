import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SubscriptionsService } from './services/subscriptions.service';
import { BillingSimulatorService } from './services/billing-simulator.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingSimulator: BillingSimulatorService,
  ) {}

  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get('user/:userId')
  getUserSubscriptions(@Param('userId') userId: string) {
    return this.subscriptionsService.getUserSubscriptions(userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }

  @Post('billing/run')
  runBilling() {
    return this.billingSimulator.runBillingCycle();
  }
}
