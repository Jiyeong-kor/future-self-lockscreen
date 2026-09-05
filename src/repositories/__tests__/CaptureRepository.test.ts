import type {
  SqlDatabase,
  SqlQueryResult,
  SqlTransaction,
  SqlValue,
} from '../../database/types';
import {DomainRuleViolation} from '../../domain';
import {SqlCaptureRepository} from '../CaptureRepository';

interface ExecutedStatement {
  sql: string;
  params?: SqlValue[];
}

class FakeDatabase implements SqlDatabase {
  readonly transactionStatements: ExecutedStatement[] = [];
  readonly directStatements: ExecutedStatement[] = [];
  transactionCount = 0;
  directResult: SqlQueryResult = {rowsAffected: 0, rows: []};

  async execute(sql: string, params?: SqlValue[]): Promise<SqlQueryResult> {
    this.directStatements.push({sql, params});
    return this.directResult;
  }

  async transaction<T>(
    work: (transaction: SqlTransaction) => Promise<T>,
  ): Promise<T> {
    this.transactionCount += 1;
    return work({
      execute: async (sql, params) => {
        this.transactionStatements.push({sql, params});
        return {rowsAffected: 1, rows: []};
      },
    });
  }

  close(): void {}

  getPath(): string {
    return '/private/future-self.sqlite';
  }
}

describe('SqlCaptureRepository', () => {
  it('stores entry, first revision, and tags in one transaction', async () => {
    const database = new FakeDatabase();
    const ids = ['entry-id', 'revision-id'];
    const repository = new SqlCaptureRepository({
      database,
      idGenerator: () => ids.shift()!,
      now: () => '2026-09-05T07:00:00.000Z',
    });

    const result = await repository.create({
      content: '이 생각은 그냥 기록만 해둘래',
      tags: ['편입', ' 편입 ', '', '선택'],
    });

    expect(database.transactionCount).toBe(1);
    expect(database.transactionStatements).toHaveLength(4);
    expect(database.transactionStatements[0]?.sql).toContain(
      'INSERT INTO capture_entry',
    );
    expect(database.transactionStatements[1]?.sql).toContain(
      'INSERT INTO capture_entry_revision',
    );
    expect(database.transactionStatements[2]?.params).toEqual([
      'revision-id',
      '편입',
    ]);
    expect(database.transactionStatements[3]?.params).toEqual([
      'revision-id',
      '선택',
    ]);

    expect(result.entry).toEqual({
      id: 'entry-id',
      currentRevisionId: 'revision-id',
      createdAt: '2026-09-05T07:00:00.000Z',
    });
    expect(result.revision).toEqual({
      id: 'revision-id',
      entryId: 'entry-id',
      revision: 1,
      kind: 'thought',
      content: '이 생각은 그냥 기록만 해둘래',
      occurredAt: undefined,
      tags: ['편입', '선택'],
      createdAt: '2026-09-05T07:00:00.000Z',
    });
  });

  it('rejects blank content without touching the database', async () => {
    const database = new FakeDatabase();
    const repository = new SqlCaptureRepository({database});

    await expect(repository.create({content: '   '})).rejects.toBeInstanceOf(
      DomainRuleViolation,
    );
    expect(database.transactionCount).toBe(0);
  });

  it('maps recent current revisions without requiring tags', async () => {
    const database = new FakeDatabase();
    database.directResult = {
      rowsAffected: 0,
      rows: [
        {
          entry_id: 'entry-1',
          current_revision_id: 'revision-2',
          entry_created_at: '2026-09-05T07:00:00.000Z',
          kind: 'observation',
          content: '최근 기록',
          occurred_at: null,
        },
      ],
    };
    const repository = new SqlCaptureRepository({database});

    await expect(repository.getRecent(10)).resolves.toEqual([
      {
        id: 'entry-1',
        currentRevisionId: 'revision-2',
        kind: 'observation',
        content: '최근 기록',
        occurredAt: undefined,
        createdAt: '2026-09-05T07:00:00.000Z',
      },
    ]);
    expect(database.directStatements[0]?.params).toEqual([10]);
  });
});
