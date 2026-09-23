import {assertDatabaseKey, type DatabaseKeyStore} from '../security/databaseKeyStoreCore';
import {
  DatabaseCloseError,
  DatabaseEncryptionUnavailableError,
  DatabaseInitializationError,
  DatabaseKeyAccessError,
  DatabaseRecoveryRequiredError,
} from './errors';
import type {SqlDatabase} from './types';

export interface EncryptedDatabaseDependencies {
  isEncryptionAvailable(): boolean;
  keyStore: DatabaseKeyStore;
  openWithKey(key: string): SqlDatabase;
  initialize(database: SqlDatabase): Promise<void>;
}

/** 네이티브 구현과 분리된 초기화 순서. 실패 시 데이터나 키를 재생성하지 않는다. */
export async function openEncryptedDatabase(
  dependencies: EncryptedDatabaseDependencies,
): Promise<SqlDatabase> {
  if (!dependencies.isEncryptionAvailable()) {
    throw new DatabaseEncryptionUnavailableError();
  }

  let key: string;
  let isPending: boolean;
  try {
    const confirmed = await dependencies.keyStore.getConfirmed();
    isPending = confirmed === null;
    key = confirmed ?? await dependencies.keyStore.getOrCreatePending();
    assertDatabaseKey(key);
  } catch (error) {
    throw error instanceof DatabaseKeyAccessError ? error : new DatabaseKeyAccessError(error);
  }

  let database: SqlDatabase | undefined;
  try {
    try {
      database = dependencies.openWithKey(key);
      // SQLCipher는 실제 페이지를 읽을 때 잘못된 키를 검출한다.
      await database.execute('SELECT count(*) AS table_count FROM sqlite_master');
    } catch (error) {
      throw new DatabaseRecoveryRequiredError('개인 데이터베이스를 읽지 못했습니다. 기존 데이터를 초기화하지 않습니다.', error);
    }

    try {
      await dependencies.initialize(database);
    } catch (error) {
      // 설정 또는 migration 실패를 암호화 키 손상으로 오인하지 않는다.
      throw new DatabaseInitializationError(error);
    }

    if (isPending) {
      try {
        await dependencies.keyStore.promotePending(key);
      } catch (error) {
        throw error instanceof DatabaseKeyAccessError ? error : new DatabaseKeyAccessError(error);
      }
    }
    return database;
  } catch (error) {
    try {
      database?.close();
    } catch (cleanupError) {
      throw new DatabaseCloseError({initializationError: error, cleanupError});
    }
    throw error;
  }
}
