import {isSQLCipher, open, type DB} from '@op-engineering/op-sqlite';

import {
  databaseKeyStore,
  type DatabaseKeyStore,
} from '../security/databaseKeyStore';
import {
  DatabaseEncryptionUnavailableError,
  DatabaseRecoveryRequiredError,
} from './errors';
import {migrations, runMigrations} from './migrations';
import {adaptOpSqlite} from './opSqliteAdapter';
import type {SqlDatabase} from './types';

const DATABASE_NAME = 'future-self.sqlite';

async function assertReadable(database: SqlDatabase): Promise<void> {
  await database.execute('SELECT count(*) AS table_count FROM sqlite_master');
}

async function configureRuntime(database: SqlDatabase): Promise<void> {
  await database.execute('PRAGMA foreign_keys = ON');
  await database.execute('PRAGMA journal_mode = WAL');
  await database.execute('PRAGMA synchronous = FULL');
  await database.execute('PRAGMA busy_timeout = 5000');
}

async function initializeOpenedDatabase(database: SqlDatabase): Promise<void> {
  await configureRuntime(database);
  await runMigrations(database, migrations);
}

function openWithKey(key: string): {raw: DB; database: SqlDatabase} {
  const raw = open({
    name: DATABASE_NAME,
    encryptionKey: key,
  });
  return {raw, database: adaptOpSqlite(raw)};
}

async function openUsingConfirmedKey(
  key: string,
): Promise<SqlDatabase> {
  let raw: DB | undefined;

  try {
    const opened = openWithKey(key);
    raw = opened.raw;
    await assertReadable(opened.database);
    await initializeOpenedDatabase(opened.database);
    return opened.database;
  } catch (error) {
    raw?.close();
    throw new DatabaseRecoveryRequiredError(
      'The private database could not be opened with the confirmed encryption key.',
      error,
    );
  }
}

async function openUsingPendingKey(
  keyStore: DatabaseKeyStore,
): Promise<SqlDatabase> {
  const pendingKey = await keyStore.getOrCreatePending();
  let raw: DB | undefined;

  try {
    const opened = openWithKey(pendingKey);
    raw = opened.raw;

    // A wrong SQLCipher key fails when the schema is actually read. Do this
    // before promoting a candidate key so an old database is never silently
    // replaced by a newly generated key.
    await assertReadable(opened.database);
    await keyStore.promotePending(pendingKey);
    await initializeOpenedDatabase(opened.database);
    return opened.database;
  } catch (error) {
    raw?.close();
    throw new DatabaseRecoveryRequiredError(
      'No confirmed database key exists and the pending key could not safely open the database.',
      error,
    );
  }
}

export async function openPrivateDatabase(
  keyStore: DatabaseKeyStore = databaseKeyStore,
): Promise<SqlDatabase> {
  if (!isSQLCipher()) {
    throw new DatabaseEncryptionUnavailableError();
  }

  const confirmedKey = await keyStore.getConfirmed();
  if (confirmedKey !== null) {
    return openUsingConfirmedKey(confirmedKey);
  }

  return openUsingPendingKey(keyStore);
}

let sharedDatabasePromise: Promise<SqlDatabase> | null = null;

export function getPrivateDatabase(): Promise<SqlDatabase> {
  if (sharedDatabasePromise === null) {
    sharedDatabasePromise = openPrivateDatabase().catch(error => {
      sharedDatabasePromise = null;
      throw error;
    });
  }
  return sharedDatabasePromise;
}

export async function closePrivateDatabase(): Promise<void> {
  if (sharedDatabasePromise === null) {
    return;
  }

  const database = await sharedDatabasePromise;
  database.close();
  sharedDatabasePromise = null;
}
