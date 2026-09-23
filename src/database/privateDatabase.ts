import {isSQLCipher, open} from '@op-engineering/op-sqlite';

import {databaseKeyStore, type DatabaseKeyStore} from '../security/databaseKeyStore';
import {createPrivateStoragePort} from '../security/privateStorage';
import {DatabaseSession} from './DatabaseSession';
import {DatabaseEncryptionUnavailableError} from './errors';
import {ProtectedDataAccess, protectDatabaseAccess} from './ProtectedDataAccess';
import {openEncryptedDatabase} from './openEncryptedDatabase';
import {migrations, runMigrations} from './migrations';
import {adaptOpSqlite} from './opSqliteAdapter';
import type {SqlDatabase} from './types';

const DATABASE_NAME = 'future-self.sqlite';
let protection: ProtectedDataAccess | null | undefined;

function getProtection(): ProtectedDataAccess | null {
  if (protection === undefined) {
    const port = createPrivateStoragePort();
    protection = port === null ? null : new ProtectedDataAccess(port, () => session.close());
  }
  return protection;
}

// 공유 세션만 원시 핸들을 열어 보호 감시와 연결 수명이 분리되지 않도록 한다.
async function openPrivateDatabase(
  keyStore: DatabaseKeyStore = databaseKeyStore,
): Promise<SqlDatabase> {
  if (!isSQLCipher()) { throw new DatabaseEncryptionUnavailableError(); }
  const access = getProtection();
  const generation = await access?.prepare();
  return openEncryptedDatabase({
    isEncryptionAvailable: isSQLCipher,
    keyStore,
    openWithKey: key => {
      const raw = adaptOpSqlite(open({name: DATABASE_NAME, encryptionKey: key}));
      return access === null || generation === undefined ? raw :
        protectDatabaseAccess(raw, access, generation);
    },
    initialize: async database => {
      await database.execute('PRAGMA foreign_keys = ON');
      await database.execute('PRAGMA temp_store = MEMORY');
      await database.execute('PRAGMA mmap_size = 0');
      await database.execute('PRAGMA journal_mode = WAL');
      await database.execute('PRAGMA synchronous = FULL');
      await database.execute('PRAGMA busy_timeout = 5000');
      // 새 WAL/SHM도 migration의 쓰기 전에 보호하고, 이후 다시 검증한다.
      if (access !== null && generation !== undefined) { await access.verifyFiles(generation); }
      await runMigrations(database, migrations);
      if (access !== null && generation !== undefined) { await access.verifyFiles(generation); }
    },
  });
}

const session = new DatabaseSession(() => openPrivateDatabase());

export async function getPrivateDatabase(): Promise<SqlDatabase> {
  const access = getProtection();
  const generation = await access?.assertAvailable();
  const database = await session.get();
  if (access !== null && generation !== undefined) { await access.assertAvailable(generation); }
  return database;
}

export function closePrivateDatabase(): Promise<void> {
  return session.close();
}
