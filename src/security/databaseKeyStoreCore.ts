import {DatabaseKeyAccessError} from '../database/errors';

export const DATABASE_KEY_USERNAME = 'future-self-private-db';
export const CONFIRMED_SERVICE = 'future-self.private-db-key.v1';
export const PENDING_SERVICE = 'future-self.private-db-key.pending.v1';

export interface DatabaseKeyStore {
  getConfirmed(): Promise<string | null>;
  getOrCreatePending(): Promise<string>;
  promotePending(key: string): Promise<void>;
  clearPending(): Promise<void>;
}

export interface KeyCredentials {
  username: string;
  password: string;
}

export interface DatabaseKeyBackend {
  read(service: string): Promise<KeyCredentials | null>;
  write(service: string, credentials: KeyCredentials): Promise<void>;
  remove(service: string): Promise<void>;
}

export function assertDatabaseKey(key: string): void {
  if (typeof key !== 'string' || !/^[0-9a-f]{64}$/.test(key)) {
    throw new DatabaseKeyAccessError();
  }
}

/** 키 작업은 순서대로 실행하며, 검증된 키를 다른 키로 덮어쓰지 않는다. */
export function createDatabaseKeyStore(
  backend: DatabaseKeyBackend,
  generateKey: () => string,
): DatabaseKeyStore {
  let tail: Promise<void> = Promise.resolve();

  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    const result = tail.then(work).catch((error: unknown) => {
      throw error instanceof DatabaseKeyAccessError
        ? error
        : new DatabaseKeyAccessError(error);
    });
    tail = result.then(() => undefined, () => undefined);
    return result;
  }

  async function read(service: string): Promise<string | null> {
    const credentials = await backend.read(service);
    if (credentials === null) {
      return null;
    }
    if (credentials.username !== DATABASE_KEY_USERNAME) {
      throw new DatabaseKeyAccessError();
    }
    assertDatabaseKey(credentials.password);
    return credentials.password;
  }

  async function writeAndVerify(service: string, key: string): Promise<void> {
    assertDatabaseKey(key);
    await backend.write(service, {username: DATABASE_KEY_USERNAME, password: key});
    if ((await read(service)) !== key) {
      throw new DatabaseKeyAccessError();
    }
  }

  async function removeAndVerifyPending(): Promise<void> {
    await backend.remove(PENDING_SERVICE);
    if ((await read(PENDING_SERVICE)) !== null) {
      throw new DatabaseKeyAccessError();
    }
  }

  return {
    getConfirmed: () => exclusive(() => read(CONFIRMED_SERVICE)),

    getOrCreatePending: () => exclusive(async () => {
      // 다른 초기화가 먼저 끝났다면 새 후보를 만들지 않는다.
      if ((await read(CONFIRMED_SERVICE)) !== null) {
        throw new DatabaseKeyAccessError();
      }
      const existing = await read(PENDING_SERVICE);
      if (existing !== null) {
        return existing;
      }
      const key = generateKey();
      await writeAndVerify(PENDING_SERVICE, key);
      return key;
    }),

    promotePending: key => exclusive(async () => {
      assertDatabaseKey(key);
      const confirmed = await read(CONFIRMED_SERVICE);
      if (confirmed !== null && confirmed !== key) {
        throw new DatabaseKeyAccessError();
      }
      const pending = await read(PENDING_SERVICE);
      if (confirmed === key && pending === null) {
        return;
      }
      if (pending !== key) {
        throw new DatabaseKeyAccessError();
      }
      if (confirmed === null) {
        await writeAndVerify(CONFIRMED_SERVICE, key);
      }
      // 확정 키를 다시 읽어 확인한 뒤에만 후보 키를 제거한다.
      if ((await read(CONFIRMED_SERVICE)) !== key) {
        throw new DatabaseKeyAccessError();
      }
      await removeAndVerifyPending();
    }),

    clearPending: () => exclusive(async () => {
      const pending = await read(PENDING_SERVICE);
      if (pending === null) {
        return;
      }
      // 초기화 도중 유일하게 남아 있는 복구용 후보를 제거하지 않는다.
      if ((await read(CONFIRMED_SERVICE)) !== pending) {
        throw new DatabaseKeyAccessError();
      }
      await removeAndVerifyPending();
    }),
  };
}
