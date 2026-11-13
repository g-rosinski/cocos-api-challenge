export class InvalidEnvironmentVariableError extends Error {
  constructor(variableName: string) {
    super(`${variableName} is invalid`);
    this.name = 'InvalidEnvironmentVariableError';
  }
}
