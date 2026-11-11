export class MissingEnvironmentVariableError extends Error {
  constructor(variableName: string) {
    super(`${variableName} is required`);
    this.name = 'MissingEnvironmentVariableError';
  }
}
