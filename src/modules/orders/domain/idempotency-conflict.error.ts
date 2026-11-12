export class IdempotencyConflictError extends Error {
  constructor() {
    super('Idempotency key conflict');
    this.name = 'IdempotencyConflictError';
  }
}
