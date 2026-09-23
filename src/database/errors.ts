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

export class DatabaseKeyAccessError extends Error {
  constructor(readonly causeValue?: unknown) {
    super('암호화 키를 안전하게 확인하지 못했습니다. 기존 키와 데이터는 초기화하지 않습니다.');
    this.name = 'DatabaseKeyAccessError';
  }
}

export class DatabaseInitializationError extends Error {
  constructor(readonly causeValue?: unknown) {
    super('개인 데이터베이스 초기화를 완료하지 못했습니다. 기존 데이터는 유지됩니다.');
    this.name = 'DatabaseInitializationError';
  }
}

export class DatabaseSessionClosedError extends Error {
  constructor() {
    super('데이터베이스 연결을 다시 요청해야 합니다.');
    this.name = 'DatabaseSessionClosedError';
  }
}

export class DatabaseCloseError extends Error {
  constructor(readonly causeValue?: unknown) {
    super('데이터베이스 종료를 확인하지 못했습니다. 새 연결을 만들지 않습니다.');
    this.name = 'DatabaseCloseError';
  }
}
