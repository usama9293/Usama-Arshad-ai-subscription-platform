import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain-exception';

export class SubscriptionNotFoundException extends DomainException {
  constructor(id: string) {
    super('SUBSCRIPTION_NOT_FOUND', `Subscription ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
