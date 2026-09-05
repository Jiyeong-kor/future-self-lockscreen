export type SqlValue =
  | string
  | number
  | boolean
  | null
  | ArrayBuffer
  | ArrayBufferView;

export interface SqlQueryResult {
  rowsAffected: number;
  insertId?: number;
  rows: Array<Record<string, SqlValue>>;
}

export interface SqlExecutor {
  execute(sql: string, params?: SqlValue[]): Promise<SqlQueryResult>;
}

export interface SqlTransaction extends SqlExecutor {}

export interface SqlDatabase extends SqlExecutor {
  transaction<T>(work: (transaction: SqlTransaction) => Promise<T>): Promise<T>;
  close(): void;
  getPath(): string;
}
