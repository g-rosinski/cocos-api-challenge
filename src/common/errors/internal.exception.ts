export class InternalException extends Error {
  constructor(readonly cause?: unknown) {
    super('Internal failure');
    this.name = 'InternalException';
  }
}
