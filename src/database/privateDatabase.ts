import {isSQLCipher, open} from '@op-engineering/op-sqlite';

import {databaseKeyStore, type DatabaseKeyStore} from '../security/databaseKeyStore';
import {DatabaseSession} from './DatabaseSession';
import {openEncryptedDatabase} from './openEncryptedDatabase';
import {migrations, runMigrations} from './migrations';
import {adaptOpSqlite} from './opSqliteAdapter';
import type {SqlDatabase} from './types';

const DATABASE_NAME = 'future-self.sqlite';

async function initializeOpenedDatabase(database: SqlDatabase): Promise<void> {
  await database.execute('PRAGMA foreign_keys = ON');
  await database.execute('PRAGMA journal_mode = WAL');
  await database.execute('PRAGMA synchronous = FULL');
  await database.execute('PRAGMA busy_timeout = 5000');
  await runMigrations(database, migrations);
}

export function openPrivateDatabase(
  keyStore: DatabaseKeyStore = databaseKeyStore,
): Promise<SqlDatabase> {
  return openEncryptedDatabase({
    isEncryptionAvailable: isSQLCipher,
    keyStore,
    openWithKey: key => adaptOpSqlite(open({name: DATABASE_NAME, encryptionKey: key})),
    initialize: initializeOpenedDatabase,
  });
}

const session = new DatabaseSession(() => openPrivateDatabase());

export function getPrivateDatabase(): Promise<SqlDatabase> {
  return session.get();
}

export function closePrivateDatabase(): Promise<void> {
  return session.close();
}
