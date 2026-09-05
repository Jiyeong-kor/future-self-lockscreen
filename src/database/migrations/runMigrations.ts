import type {SqlDatabase} from '../types';
import type {Migration} from './types';

const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migration (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT
`.trim();

function assertMigrationOrder(migrations: readonly Migration[]): void {
  let previous = 0;
  const versions = new Set<number>();

  for (const migration of migrations) {
    if (!Number.isInteger(migration.version) || migration.version <= 0) {
      throw new Error(`Invalid migration version: ${migration.version}`);
    }
    if (versions.has(migration.version)) {
      throw new Error(`Duplicate migration version: ${migration.version}`);
    }
    if (migration.version <= previous) {
      throw new Error('Migrations must be ordered by increasing version.');
    }
    versions.add(migration.version);
    previous = migration.version;
  }
}

export async function runMigrations(
  database: SqlDatabase,
  migrations: readonly Migration[],
  now: () => string = () => new Date().toISOString(),
): Promise<void> {
  assertMigrationOrder(migrations);
  await database.execute(MIGRATION_TABLE_SQL);

  const appliedResult = await database.execute(
    'SELECT version FROM schema_migration ORDER BY version ASC',
  );
  const appliedVersions = new Set(
    appliedResult.rows.map(row => Number(row.version)),
  );

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    await database.transaction(async transaction => {
      for (const statement of migration.statements) {
        await transaction.execute(statement);
      }
      await transaction.execute(
        `INSERT INTO schema_migration(version, name, applied_at)
         VALUES (?, ?, ?)`,
        [migration.version, migration.name, now()],
      );
    });
  }
}
