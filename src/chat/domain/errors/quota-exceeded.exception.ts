import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain-exception';

export class QuotaExceededException extends DomainException {
  constructor(userId: string) {
    super(
      'QUOTA_EXCEEDED',
      `User ${userId} has exhausted their free quota and has no active subscription bundle with remaining messages.`,
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
