import {DomainRuleViolation} from '../domain';
import type {
  CaptureEntry,
  CaptureEntryKind,
  CaptureEntryRevision,
} from '../domain';
import {getPrivateDatabase} from '../database/privateDatabase';
import type {SqlDatabase, SqlValue} from '../database/types';
import {generateUuidV4} from '../security/secureRandom';

export interface CreateCaptureInput {
  content: string;
  kind?: CaptureEntryKind;
  occurredAt?: string;
  tags?: string[];
}

export interface CaptureRecord {
  entry: CaptureEntry;
  revision: CaptureEntryRevision;
}

export interface CaptureSummary {
  id: string;
  currentRevisionId: string;
  kind: CaptureEntryKind;
  content: string;
  occurredAt?: string;
  createdAt: string;
}

export interface CaptureRepository {
  create(input: CreateCaptureInput): Promise<CaptureRecord>;
  getRecent(limit: number): Promise<CaptureSummary[]>;
}

export interface CaptureRepositoryDependencies {
  database?: SqlDatabase;
  databaseProvider?: () => Promise<SqlDatabase>;
  idGenerator?: () => string;
  now?: () => string;
}

function normalizeTags(tags: readonly string[] | undefined): string[] {
  if (tags === undefined) {
    return [];
  }

  return [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))];
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

export class SqlCaptureRepository implements CaptureRepository {
  private readonly database?: SqlDatabase;
  private readonly databaseProvider: () => Promise<SqlDatabase>;
  private readonly idGenerator: () => string;
  private readonly now: () => string;

  constructor(dependencies: CaptureRepositoryDependencies = {}) {
    this.database = dependencies.database;
    this.databaseProvider = dependencies.databaseProvider ?? getPrivateDatabase;
    this.idGenerator = dependencies.idGenerator ?? generateUuidV4;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async getDatabase(): Promise<SqlDatabase> {
    return this.database ?? this.databaseProvider();
  }

  async create(input: CreateCaptureInput): Promise<CaptureRecord> {
    if (input.content.trim().length === 0) {
      throw new DomainRuleViolation(
        'CAPTURE_CONTENT_EMPTY',
        '기록 내용은 비어 있을 수 없습니다.',
      );
    }

    const database = await this.getDatabase();
    const entryId = this.idGenerator();
    const revisionId = this.idGenerator();
    const createdAt = this.now();
    const kind = input.kind ?? 'thought';
    const tags = normalizeTags(input.tags);

    const entry: CaptureEntry = {
      id: entryId,
      currentRevisionId: revisionId,
      createdAt,
    };
    const revision: CaptureEntryRevision = {
      id: revisionId,
      entryId,
      revision: 1,
      kind,
      content: input.content,
      occurredAt: input.occurredAt,
      tags,
      createdAt,
    };

    await database.transaction(async transaction => {
      await transaction.execute(
        `INSERT INTO capture_entry(id, current_revision_id, created_at)
         VALUES (?, ?, ?)`,
        [entry.id, entry.currentRevisionId, entry.createdAt],
      );

      await transaction.execute(
        `INSERT INTO capture_entry_revision(
           id,
           entry_id,
           revision,
           kind,
           content,
           occurred_at,
           created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          revision.id,
          revision.entryId,
          revision.revision,
          revision.kind,
          revision.content,
          revision.occurredAt ?? null,
          revision.createdAt,
        ],
      );

      for (const tag of tags) {
        await transaction.execute(
          `INSERT INTO capture_entry_revision_tag(revision_id, tag)
           VALUES (?, ?)`,
          [revision.id, tag],
        );
      }
    });

    return {entry, revision};
  }

  async getRecent(limit: number): Promise<CaptureSummary[]> {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Recent capture limit must be a positive integer.');
    }

    const database = await this.getDatabase();
    const result = await database.execute(
      `SELECT
         e.id AS entry_id,
         e.current_revision_id,
         e.created_at AS entry_created_at,
         r.kind,
         r.content,
         r.occurred_at
       FROM capture_entry e
       JOIN capture_entry_revision r ON r.id = e.current_revision_id
       ORDER BY e.created_at DESC
       LIMIT ?`,
      [limit],
    );

    return result.rows.map(row => ({
      id: requireString(row.entry_id, 'entry_id'),
      currentRevisionId: requireString(
        row.current_revision_id,
        'current_revision_id',
      ),
      kind: requireString(row.kind, 'kind') as CaptureEntryKind,
      content: requireString(row.content, 'content'),
      occurredAt: optionalString(row.occurred_at),
      createdAt: requireString(row.entry_created_at, 'entry_created_at'),
    }));
  }
}
