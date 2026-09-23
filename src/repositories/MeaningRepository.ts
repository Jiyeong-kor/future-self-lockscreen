import {DomainRuleViolation} from '../domain';
import type {MeaningNode, MeaningNodeRevision} from '../domain';
import type {SqlDatabase, SqlValue} from '../database/types';
import {generateUuidV4} from '../security/secureRandom';

export interface CreateUnclassifiedMeaningInput {
  title: string;
  description?: string;
  sourceCaptureRevisionId?: string;
}

export interface MeaningRecord {
  node: MeaningNode;
  revision: MeaningNodeRevision;
}

export interface MeaningSummary {
  id: string;
  kind: MeaningNode['kind'];
  status: MeaningNode['status'];
  currentRevisionId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface MeaningCursor {
  createdAt: string;
  id: string;
}

export interface MeaningPage {
  items: MeaningSummary[];
  nextCursor?: MeaningCursor;
}

export interface MeaningCaptureSource {
  revisionId: string;
  entryId: string;
  revision: number;
  content: string;
  createdAt: string;
  occurredAt?: string;
}

export interface MeaningRepository {
  createUnclassified(input: CreateUnclassifiedMeaningInput): Promise<MeaningRecord>;
  getCurrent(limit: number): Promise<MeaningSummary[]>;
  getPage(limit: number, cursor?: MeaningCursor): Promise<MeaningPage>;
  getCaptureSources(nodeRevisionId: string): Promise<MeaningCaptureSource[]>;
}

export interface MeaningRepositoryDependencies {
  database?: SqlDatabase;
  databaseProvider?: () => Promise<SqlDatabase>;
  idGenerator?: () => string;
  now?: () => string;
}

async function defaultDatabaseProvider(): Promise<SqlDatabase> {
  const {getPrivateDatabase} = await import('../database/privateDatabase');
  return getPrivateDatabase();
}

function requireString(value: SqlValue | undefined, column: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${column} to be a string.`);
  }
  return value;
}

function optionalString(value: SqlValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toSummary(row: Record<string, SqlValue>): MeaningSummary {
  return {
    id: requireString(row.node_id, 'node_id'),
    kind: requireString(row.kind, 'kind') as MeaningNode['kind'],
    status: requireString(row.status, 'status') as MeaningNode['status'],
    currentRevisionId: requireString(row.current_revision_id, 'current_revision_id'),
    title: requireString(row.title, 'title'),
    description: optionalString(row.description),
    createdAt: requireString(row.node_created_at, 'node_created_at'),
  };
}

export class SqlMeaningRepository implements MeaningRepository {
  private readonly database?: SqlDatabase;
  private readonly databaseProvider: () => Promise<SqlDatabase>;
  private readonly idGenerator: () => string;
  private readonly now: () => string;

  constructor(dependencies: MeaningRepositoryDependencies = {}) {
    this.database = dependencies.database;
    this.databaseProvider = dependencies.databaseProvider ?? defaultDatabaseProvider;
    this.idGenerator = dependencies.idGenerator ?? generateUuidV4;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async getDatabase(): Promise<SqlDatabase> {
    return this.database ?? this.databaseProvider();
  }

  async createUnclassified(input: CreateUnclassifiedMeaningInput): Promise<MeaningRecord> {
    const title = input.title.trim();
    if (title.length === 0) {
      throw new DomainRuleViolation('MEANING_TITLE_EMPTY', '의미 카드의 내용을 입력해 주세요.');
    }

    const database = await this.getDatabase();
    const nodeId = this.idGenerator();
    const revisionId = this.idGenerator();
    const originMomentId = this.idGenerator();
    const createdAt = this.now();
    const node: MeaningNode = {
      id: nodeId,
      kind: 'unclassified',
      status: 'active',
      currentRevisionId: revisionId,
      createdAt,
    };
    const revision: MeaningNodeRevision = {
      id: revisionId,
      nodeId,
      revision: 1,
      title,
      description: input.description?.trim() || undefined,
      createdAt,
    };

    await database.transaction(async transaction => {
      // 출처 확인과 카드 저장을 같은 트랜잭션에서 처리한다.
      // 최신 원문을 다시 선택하지 않고 사용자가 선택했던 revision을 유지한다.
      if (input.sourceCaptureRevisionId !== undefined) {
        const source = await transaction.execute(
          'SELECT id FROM capture_entry_revision WHERE id = ?',
          [input.sourceCaptureRevisionId],
        );
        if (source.rows.length !== 1) {
          throw new DomainRuleViolation(
            'MEANING_SOURCE_NOT_FOUND',
            '연결할 원본 기록을 찾을 수 없습니다. 입력한 내용은 그대로 두었습니다.',
          );
        }
      }

      await transaction.execute(
        `INSERT INTO meaning_node(
           id, kind, status, current_revision_id, merged_into_node_id, created_at
         ) VALUES (?, 'unclassified', 'active', ?, NULL, ?)`,
        [node.id, node.currentRevisionId, node.createdAt],
      );
      await transaction.execute(
        `INSERT INTO meaning_node_revision(
           id, node_id, revision, title, description, created_at
         ) VALUES (?, ?, 1, ?, ?, ?)`,
        [revision.id, revision.nodeId, revision.title, revision.description ?? null, createdAt],
      );
      await transaction.execute(
        `INSERT INTO origin_moment(
           id, subject_type, subject_id, subject_revision_id, original_text, context, captured_at
         ) VALUES (?, 'node', ?, ?, ?, ?, ?)`,
        [originMomentId, node.id, revision.id, revision.title, revision.description ?? null, createdAt],
      );

      if (input.sourceCaptureRevisionId !== undefined) {
        // 새 결과 revision에는 출발 간선이 없으므로 이 생성 명령은 순환을 만들지 않는다.
        // 기존 객체 사이의 연결 편집은 별도의 전체 인과 그래프 검증이 필요하다.
        await transaction.execute(
          `INSERT INTO causal_evidence_link(
             id, evidence_type, evidence_id, derived_revision_type, derived_revision_id, note, created_at
           ) VALUES (?, 'capture_revision', ?, 'meaning_node_revision', ?, NULL, ?)`,
          [this.idGenerator(), input.sourceCaptureRevisionId, revision.id, createdAt],
        );
      }

      await transaction.execute(
        `INSERT INTO search_fts(document_type, object_id, revision_id, title, body, tags)
         VALUES ('meaning_node', ?, ?, ?, ?, '')`,
        [node.id, revision.id, revision.title, revision.description ?? ''],
      );
    });

    return {node, revision};
  }

  async getCurrent(limit: number): Promise<MeaningSummary[]> {
    return (await this.getPage(limit)).items;
  }

  async getPage(limit: number, cursor?: MeaningCursor): Promise<MeaningPage> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Meaning page size must be an integer between 1 and 100.');
    }
    if (cursor !== undefined && (!cursor.id || !Number.isFinite(Date.parse(cursor.createdAt)))) {
      throw new Error('Invalid meaning page cursor.');
    }

    const database = await this.getDatabase();
    const boundary = cursor === undefined ? '' :
      'AND (n.created_at < ? OR (n.created_at = ? AND n.id < ?))';
    const params: SqlValue[] = cursor === undefined ? [] :
      [cursor.createdAt, cursor.createdAt, cursor.id];
    const result = await database.execute(
      `SELECT n.id AS node_id, n.kind, n.status, n.current_revision_id,
         n.created_at AS node_created_at, r.title, r.description
       FROM meaning_node n
       JOIN meaning_node_revision r ON r.id = n.current_revision_id AND r.node_id = n.id
       WHERE n.status IN ('active', 'paused') ${boundary}
       ORDER BY n.created_at DESC, n.id DESC LIMIT ?`,
      [...params, limit + 1],
    );
    const items = result.rows.slice(0, limit).map(toSummary);
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: result.rows.length > limit && last !== undefined ?
        {createdAt: last.createdAt, id: last.id} : undefined,
    };
  }

  async getCaptureSources(nodeRevisionId: string): Promise<MeaningCaptureSource[]> {
    if (nodeRevisionId.trim().length === 0) {
      throw new Error('A meaning revision ID is required.');
    }
    const database = await this.getDatabase();
    const result = await database.execute(
      `SELECT r.id, r.entry_id, r.revision, r.content, r.created_at, r.occurred_at
       FROM causal_evidence_link l
       JOIN capture_entry_revision r ON r.id = l.evidence_id
       JOIN meaning_node_revision m ON m.id = l.derived_revision_id
       WHERE l.evidence_type = 'capture_revision'
         AND l.derived_revision_type = 'meaning_node_revision'
         AND m.id = ?
       ORDER BY l.created_at ASC, l.id ASC`,
      [nodeRevisionId],
    );
    return result.rows.map(row => {
      if (typeof row.revision !== 'number' || !Number.isInteger(row.revision)) {
        throw new Error('Invalid capture revision number.');
      }
      return {
        revisionId: requireString(row.id, 'id'),
        entryId: requireString(row.entry_id, 'entry_id'),
        revision: row.revision,
        content: requireString(row.content, 'content'),
        createdAt: requireString(row.created_at, 'created_at'),
        occurredAt: optionalString(row.occurred_at),
      };
    });
  }
}
