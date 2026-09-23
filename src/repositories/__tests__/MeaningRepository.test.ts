import type {SqlDatabase, SqlQueryResult, SqlTransaction, SqlValue} from '../../database/types';
import {initialMigration} from '../../database/migrations/0001_initial';
import {SqlMeaningRepository} from '../MeaningRepository';

type Binding = string | number | null;
interface NativeStatement {
  all(...params: Binding[]): Array<Record<string, SqlValue>>;
  run(...params: Binding[]): {changes: number | bigint};
}
interface NativeDatabase {
  exec(sql: string): void;
  prepare(sql: string): NativeStatement;
  close(): void;
}

// CI의 Node 22가 제공하는 실제 SQLite를 사용한다. SQLCipher 네이티브 테스트는 별도이다.
const {DatabaseSync} = jest.requireActual('node:sqlite') as {
  DatabaseSync: new (path: string) => NativeDatabase;
};

class TestDatabase implements SqlDatabase {
  readonly native = new DatabaseSync(':memory:');
  failSql?: string;

  constructor() {
    this.native.exec('PRAGMA foreign_keys = ON');
    for (const sql of initialMigration.statements) {
      this.native.exec(sql);
    }
  }

  async execute(sql: string, params: SqlValue[] = []): Promise<SqlQueryResult> {
    if (this.failSql !== undefined && sql.includes(this.failSql)) {
      this.failSql = undefined;
      throw new Error('Injected storage failure');
    }
    const bindings = params.map(value => {
      if (value === null || typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      throw new Error('Unsupported test binding');
    });
    const statement = this.native.prepare(sql);
    if (/^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql)) {
      return {rowsAffected: 0, rows: statement.all(...bindings)};
    }
    return {rowsAffected: Number(statement.run(...bindings).changes), rows: []};
  }

  async transaction<T>(work: (transaction: SqlTransaction) => Promise<T>): Promise<T> {
    this.native.exec('BEGIN IMMEDIATE');
    try {
      const result = await work(this);
      this.native.exec('COMMIT');
      return result;
    } catch (error) {
      this.native.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void { this.native.close(); }
  getPath(): string { return ':memory:'; }
}

const now = '2026-01-01T00:00:00.000Z';

describe('SqlMeaningRepository SQLite integration', () => {
  let database: TestDatabase;
  let repository: SqlMeaningRepository;

  beforeEach(() => {
    database = new TestDatabase();
    let sequence = 0;
    repository = new SqlMeaningRepository({
      database,
      now: () => now,
      idGenerator: () => `id-${String(++sequence).padStart(6, '0')}`,
    });
  });

  afterEach(() => database.close());

  async function count(table: string): Promise<number> {
    const result = await database.execute(`SELECT COUNT(*) AS count FROM ${table}`);
    return result.rows[0].count as number;
  }

  async function seedCapture(): Promise<void> {
    await database.transaction(async transaction => {
      await transaction.execute(
        'INSERT INTO capture_entry VALUES (?, ?, ?)', ['capture-1', 'capture-r1', now],
      );
      await transaction.execute(
        'INSERT INTO capture_entry_revision VALUES (?, ?, 1, ?, ?, NULL, ?)',
        ['capture-r1', 'capture-1', 'thought', '처음 남긴 생각', now],
      );
    });
  }

  it('분류와 행동 없이 카드, 최초 기록, 검색 색인을 함께 저장한다', async () => {
    const result = await repository.createUnclassified({
      title: ' 중요한 생각 ', description: ' 자유로운 메모 ',
    });
    expect(result.node.kind).toBe('unclassified');
    expect(result.revision.title).toBe('중요한 생각');
    expect(result.revision.description).toBe('자유로운 메모');
    for (const table of ['meaning_node', 'meaning_node_revision', 'origin_moment', 'search_fts']) {
      expect(await count(table)).toBe(1);
    }
    expect(await count('meaning_node_classification_event')).toBe(0);
    expect(await count('causal_evidence_link')).toBe(0);
    expect(await count('lockscreen_projection')).toBe(0);
    const indexed = await database.execute(
      "SELECT object_id FROM search_fts WHERE search_fts MATCH '중요한'",
    );
    expect(indexed.rows[0].object_id).toBe(result.node.id);
  });

  it('공백 내용은 아무 데이터도 만들지 않는다', async () => {
    await expect(repository.createUnclassified({title: ' \n '}))
      .rejects.toMatchObject({code: 'MEANING_TITLE_EMPTY'});
    expect(await count('meaning_node')).toBe(0);
  });

  it('존재하지 않는 원본 버전은 연결하지 않는다', async () => {
    await expect(repository.createUnclassified({
      title: '작성 중인 생각', sourceCaptureRevisionId: 'missing',
    })).rejects.toMatchObject({code: 'MEANING_SOURCE_NOT_FOUND'});
    for (const table of ['meaning_node', 'meaning_node_revision', 'origin_moment', 'causal_evidence_link', 'search_fts']) {
      expect(await count(table)).toBe(0);
    }
  });

  it('원문이 수정된 뒤에도 선택 당시의 버전을 보여준다', async () => {
    await seedCapture();
    const result = await repository.createUnclassified({
      title: '다시 읽고 발견한 생각', sourceCaptureRevisionId: 'capture-r1',
    });
    await database.transaction(async transaction => {
      await transaction.execute(
        'INSERT INTO capture_entry_revision VALUES (?, ?, 2, ?, ?, NULL, ?)',
        ['capture-r2', 'capture-1', 'thought', '나중에 달라진 생각', now],
      );
      await transaction.execute(
        'UPDATE capture_entry SET current_revision_id = ? WHERE id = ?',
        ['capture-r2', 'capture-1'],
      );
    });
    expect(await repository.getCaptureSources(result.revision.id)).toEqual([{
      revisionId: 'capture-r1', entryId: 'capture-1', revision: 1,
      content: '처음 남긴 생각', createdAt: now, occurredAt: undefined,
    }]);
    expect(await count('causal_evidence_link')).toBe(1);
  });

  it('출처 없는 카드도 오류 없이 조회한다', async () => {
    const result = await repository.createUnclassified({title: '그냥 남길 생각'});
    expect(await repository.getCaptureSources(result.revision.id)).toEqual([]);
  });

  it('검색 색인 저장이 실패하면 원문과 출처도 롤백한다', async () => {
    await seedCapture();
    database.failSql = 'INSERT INTO search_fts';
    await expect(repository.createUnclassified({
      title: '저장 실패 검증', sourceCaptureRevisionId: 'capture-r1',
    })).rejects.toThrow('Injected storage failure');
    for (const table of ['meaning_node', 'meaning_node_revision', 'origin_moment', 'causal_evidence_link', 'search_fts']) {
      expect(await count(table)).toBe(0);
    }
    expect(await count('capture_entry')).toBe(1);
    await expect(repository.createUnclassified({title: '재시도'})).resolves.toBeDefined();
  });

  it('같은 시각의 카드도 페이지 사이에서 누락되거나 중복되지 않는다', async () => {
    const ids: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      ids.push((await repository.createUnclassified({title: `생각 ${index}`})).node.id);
    }
    const first = await repository.getPage(3);
    const second = await repository.getPage(3, first.nextCursor);
    const third = await repository.getPage(3, second.nextCursor);
    expect([...first.items, ...second.items, ...third.items].map(item => item.id))
      .toEqual(ids.reverse());
    expect(third.nextCursor).toBeUndefined();
  });

  it('보관하거나 종료한 카드는 현재 목록에서 제외한다', async () => {
    const active = await repository.createUnclassified({title: '현재 생각'});
    const archived = await repository.createUnclassified({title: '보관한 생각'});
    await database.execute('UPDATE meaning_node SET status = ? WHERE id = ?', ['archived', archived.node.id]);
    expect((await repository.getCurrent(20)).map(item => item.id)).toEqual([active.node.id]);
  });

  it.each([0, -1, 1.5, 101])('잘못된 페이지 크기 %s를 거부한다', async limit => {
    await expect(repository.getPage(limit)).rejects.toThrow('page size');
  });
});
