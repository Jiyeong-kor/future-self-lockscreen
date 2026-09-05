export class DatabaseEncryptionUnavailableError extends Error {
  constructor() {
    super('SQLCipher support is not available in this build.');
    this.name = 'DatabaseEncryptionUnavailableError';
  }
}

export class DatabaseRecoveryRequiredError extends Error {
  readonly causeValue: unknown;

  constructor(message: string, causeValue?: unknown) {
    super(message);
    this.name = 'DatabaseRecoveryRequiredError';
    this.causeValue = causeValue;
  }
}
