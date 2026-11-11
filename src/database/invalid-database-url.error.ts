export class InvalidDatabaseUrlError extends Error {
  constructor() {
    super('DATABASE_URL must include a valid database name');
    this.name = 'InvalidDatabaseUrlError';
  }
}
