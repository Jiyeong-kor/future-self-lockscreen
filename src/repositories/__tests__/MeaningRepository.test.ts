import type {
  SqlDatabase,
  SqlQueryResult,
  SqlTransaction,
  SqlValue,
} from '../../database/types';
import {DomainRuleViolation} from '../../domain';
import {SqlMeaningRepository} from '../MeaningRepository';

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

describe('SqlMeaningRepository', () => {
  it('creates an unclassified card with an immutable origin moment', async () => {
    const database = new FakeDatabase();
    const ids = ['node-1', 'revision-1', 'origin-1'];
    const repository = new SqlMeaningRepository({
      database,
      idGenerator: () => ids.shift()!,
      now: () => '2026-09-05T08:10:00.000Z',
    });

    const result = await repository.createUnclassified({
      title: ' 중요한 선택은 미루지 않는다 ',
      description: ' 아직 이유인지 원칙인지 정하지 않았다 ',
    });

    expect(database.transactionCount).toBe(1);
    expect(database.transactionStatements).toHaveLength(3);
    expect(database.transactionStatements[0]?.sql).toContain(
      'INSERT INTO meaning_node',
    );
    expect(database.transactionStatements[1]?.sql).toContain(
      'INSERT INTO meaning_node_revision',
    );
    expect(database.transactionStatements[2]?.sql).toContain(
      'INSERT INTO origin_moment',
    );
    expect(result.node.kind).toBe('unclassified');
    expect(result.revision.title).toBe('중요한 선택은 미루지 않는다');
    expect(result.revision.description).toBe(
      '아직 이유인지 원칙인지 정하지 않았다',
    );
  });

  it('optionally preserves a capture revision as causal evidence', async () => {
    const database = new FakeDatabase();
    const ids = ['node-1', 'revision-1', 'origin-1', 'evidence-1'];
    const repository = new SqlMeaningRepository({
      database,
      idGenerator: () => ids.shift()!,
      now: () => '2026-09-05T08:10:00.000Z',
    });

    await repository.createUnclassified({
      title: '편입을 다시 생각한 이유',
      sourceCaptureRevisionId: 'capture-revision-7',
    });

    expect(database.transactionStatements).toHaveLength(4);
    const evidence = database.transactionStatements[3];
    expect(evidence?.sql).toContain('INSERT INTO causal_evidence_link');
    expect(evidence?.params).toEqual([
      'evidence-1',
      'capture-revision-7',
      'revision-1',
      '2026-09-05T08:10:00.000Z',
    ]);
  });

  it('does not require classification or evidence', async () => {
    const database = new FakeDatabase();
    const ids = ['node-1', 'revision-1', 'origin-1'];
    const repository = new SqlMeaningRepository({
      database,
      idGenerator: () => ids.shift()!,
    });

    await expect(
      repository.createUnclassified({title: '그냥 중요한 생각'}),
    ).resolves.toMatchObject({node: {kind: 'unclassified'}});
    expect(database.transactionStatements).toHaveLength(3);
  });

  it('rejects a blank title without writing', async () => {
    const database = new FakeDatabase();
    const repository = new SqlMeaningRepository({database});

    await expect(
      repository.createUnclassified({title: '   '}),
    ).rejects.toBeInstanceOf(DomainRuleViolation);
    expect(database.transactionCount).toBe(0);
  });

  it('lists current meaning cards without treating unclassified as an error', async () => {
    const database = new FakeDatabase();
    database.directResult = {
      rowsAffected: 0,
      rows: [
        {
          node_id: 'node-1',
          kind: 'unclassified',
          status: 'active',
          current_revision_id: 'revision-1',
          node_created_at: '2026-09-05T08:10:00.000Z',
          title: '아직 분류하지 않은 생각',
          description: null,
        },
      ],
    };
    const repository = new SqlMeaningRepository({database});

    await expect(repository.getCurrent(50)).resolves.toEqual([
      {
        id: 'node-1',
        kind: 'unclassified',
        status: 'active',
        currentRevisionId: 'revision-1',
        title: '아직 분류하지 않은 생각',
        description: undefined,
        createdAt: '2026-09-05T08:10:00.000Z',
      },
    ]);
  });
});
