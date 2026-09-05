import type {
  SqlDatabase,
  SqlQueryResult,
  SqlTransaction,
  SqlValue,
} from '../../types';
import {initialMigration} from '../0001_initial';
import {runMigrations} from '../runMigrations';
import type {Migration} from '../types';

class MigrationFakeDatabase implements SqlDatabase {
  readonly directSql: string[] = [];
  readonly transactionSql: string[] = [];
  appliedVersions: number[] = [];
  transactionCount = 0;

  async execute(sql: string, _params?: SqlValue[]): Promise<SqlQueryResult> {
    this.directSql.push(sql);
    if (sql.includes('SELECT version FROM schema_migration')) {
      return {
        rowsAffected: 0,
        rows: this.appliedVersions.map(version => ({version})),
      };
    }
    return {rowsAffected: 0, rows: []};
  }

  async transaction<T>(
    work: (transaction: SqlTransaction) => Promise<T>,
  ): Promise<T> {
    this.transactionCount += 1;
    return work({
      execute: async (sql, params) => {
        this.transactionSql.push(sql);
        if (sql.includes('INSERT INTO schema_migration')) {
          this.appliedVersions.push(Number(params?.[0]));
        }
        return {rowsAffected: 1, rows: []};
      },
    });
  }

  close(): void {}

  getPath(): string {
    return '/private/future-self.sqlite';
  }
}

describe('runMigrations', () => {
  it('creates migration metadata and applies unapplied migrations atomically', async () => {
    const database = new MigrationFakeDatabase();
    const migration: Migration = {
      version: 1,
      name: 'test',
      statements: ['CREATE TABLE one(id TEXT) STRICT', 'CREATE TABLE two(id TEXT) STRICT'],
    };

    await runMigrations(
      database,
      [migration],
      () => '2026-09-05T07:00:00.000Z',
    );

    expect(database.directSql[0]).toContain('CREATE TABLE IF NOT EXISTS schema_migration');
    expect(database.transactionCount).toBe(1);
    expect(database.transactionSql).toEqual([
      'CREATE TABLE one(id TEXT) STRICT',
      'CREATE TABLE two(id TEXT) STRICT',
      expect.stringContaining('INSERT INTO schema_migration'),
    ]);
    expect(database.appliedVersions).toEqual([1]);
  });

  it('does not reapply an already recorded migration', async () => {
    const database = new MigrationFakeDatabase();
    database.appliedVersions = [1];

    await runMigrations(database, [initialMigration]);

    expect(database.transactionCount).toBe(0);
  });

  it('rejects duplicate or unordered versions before touching schema', async () => {
    const duplicate: Migration[] = [
      {version: 2, name: 'first', statements: []},
      {version: 2, name: 'duplicate', statements: []},
    ];
    const unordered: Migration[] = [
      {version: 2, name: 'second', statements: []},
      {version: 1, name: 'first', statements: []},
    ];

    const duplicateDb = new MigrationFakeDatabase();
    await expect(runMigrations(duplicateDb, duplicate)).rejects.toThrow(
      'Duplicate migration version',
    );
    expect(duplicateDb.directSql).toHaveLength(0);

    const unorderedDb = new MigrationFakeDatabase();
    await expect(runMigrations(unorderedDb, unordered)).rejects.toThrow(
      'ordered by increasing version',
    );
    expect(unorderedDb.directSql).toHaveLength(0);
  });

  it('initial migration contains the canonical safety primitives', () => {
    const sql = initialMigration.statements.join('\n');

    expect(sql).toContain("'unclassified'");
    expect(sql).toContain('CREATE TABLE tradeoff_reflection');
    expect(sql).toContain('CREATE TABLE causal_evidence_link');
    expect(sql).toContain('CREATE VIRTUAL TABLE search_fts USING fts5');
    expect(sql).toContain('CREATE UNIQUE INDEX ux_active_conflict_pair');
    expect(sql).toContain('STRICT');
  });
});
