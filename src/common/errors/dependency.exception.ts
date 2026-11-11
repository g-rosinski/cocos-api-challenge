export class DependencyException extends Error {
  constructor(readonly cause: unknown) {
    super('Dependency failure');
    this.name = 'DependencyException';
  }
}
