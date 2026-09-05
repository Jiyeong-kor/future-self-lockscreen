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

export interface MeaningRepository {
  createUnclassified(
    input: CreateUnclassifiedMeaningInput,
  ): Promise<MeaningRecord>;
  getCurrent(limit: number): Promise<MeaningSummary[]>;
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

export class SqlMeaningRepository implements MeaningRepository {
  private readonly database?: SqlDatabase;
  private readonly databaseProvider: () => Promise<SqlDatabase>;
  private readonly idGenerator: () => string;
  private readonly now: () => string;

  constructor(dependencies: MeaningRepositoryDependencies = {}) {
    this.database = dependencies.database;
    this.databaseProvider =
      dependencies.databaseProvider ?? defaultDatabaseProvider;
    this.idGenerator = dependencies.idGenerator ?? generateUuidV4;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async getDatabase(): Promise<SqlDatabase> {
    return this.database ?? this.databaseProvider();
  }

  async createUnclassified(
    input: CreateUnclassifiedMeaningInput,
  ): Promise<MeaningRecord> {
    const title = input.title.trim();
    if (title.length === 0) {
      throw new DomainRuleViolation(
        'MEANING_TITLE_EMPTY',
        '의미 카드 제목은 비어 있을 수 없습니다.',
      );
    }

    const database = await this.getDatabase();
    const nodeId = this.idGenerator();
    const revisionId = this.idGenerator();
    const originMomentId = this.idGenerator();
    const evidenceLinkId =
      input.sourceCaptureRevisionId === undefined
        ? undefined
        : this.idGenerator();
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
      await transaction.execute(
        `INSERT INTO meaning_node(
           id,
           kind,
           status,
           current_revision_id,
           merged_into_node_id,
           created_at
         ) VALUES (?, 'unclassified', 'active', ?, NULL, ?)`,
        [node.id, node.currentRevisionId, node.createdAt],
      );

      await transaction.execute(
        `INSERT INTO meaning_node_revision(
           id,
           node_id,
           revision,
           title,
           description,
           created_at
         ) VALUES (?, ?, 1, ?, ?, ?)`,
        [
          revision.id,
          revision.nodeId,
          revision.title,
          revision.description ?? null,
          revision.createdAt,
        ],
      );

      await transaction.execute(
        `INSERT INTO origin_moment(
           id,
           subject_type,
           subject_id,
           subject_revision_id,
           original_text,
           context,
           captured_at
         ) VALUES (?, 'node', ?, ?, ?, NULL, ?)`,
        [
          originMomentId,
          node.id,
          revision.id,
          revision.title,
          createdAt,
        ],
      );

      if (
        input.sourceCaptureRevisionId !== undefined &&
        evidenceLinkId !== undefined
      ) {
        await transaction.execute(
          `INSERT INTO causal_evidence_link(
             id,
             evidence_type,
             evidence_id,
             derived_revision_type,
             derived_revision_id,
             note,
             created_at
           ) VALUES (?, 'capture_revision', ?, 'meaning_node_revision', ?, NULL, ?)`,
          [
            evidenceLinkId,
            input.sourceCaptureRevisionId,
            revision.id,
            createdAt,
          ],
        );
      }
    });

    return {node, revision};
  }

  async getCurrent(limit: number): Promise<MeaningSummary[]> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Meaning card limit must be a positive integer.');
    }

    const database = await this.getDatabase();
    const result = await database.execute(
      `SELECT
         n.id AS node_id,
         n.kind,
         n.status,
         n.current_revision_id,
         n.created_at AS node_created_at,
         r.title,
         r.description
       FROM meaning_node n
       JOIN meaning_node_revision r ON r.id = n.current_revision_id
       WHERE n.status <> 'merged'
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [limit],
    );

    return result.rows.map(row => ({
      id: requireString(row.node_id, 'node_id'),
      kind: requireString(row.kind, 'kind') as MeaningNode['kind'],
      status: requireString(row.status, 'status') as MeaningNode['status'],
      currentRevisionId: requireString(
        row.current_revision_id,
        'current_revision_id',
      ),
      title: requireString(row.title, 'title'),
      description: optionalString(row.description),
      createdAt: requireString(row.node_created_at, 'node_created_at'),
    }));
  }
}
