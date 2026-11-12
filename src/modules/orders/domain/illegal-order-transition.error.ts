export class IllegalOrderTransitionError extends Error {
  constructor(readonly status: string) {
    super(`Illegal order transition: ${status}`);
    this.name = 'IllegalOrderTransitionError';
  }
}
