import type {DB, QueryResult, Scalar, Transaction} from '@op-engineering/op-sqlite';

import type {
  SqlDatabase,
  SqlQueryResult,
  SqlTransaction,
  SqlValue,
} from './types';

function mapResult(result: QueryResult): SqlQueryResult {
  return {
    rowsAffected: result.rowsAffected,
    insertId: result.insertId,
    rows: result.rows as Array<Record<string, SqlValue>>,
  };
}

function mapTransaction(transaction: Transaction): SqlTransaction {
  return {
    async execute(sql: string, params?: SqlValue[]): Promise<SqlQueryResult> {
      const result = await transaction.execute(sql, params as Scalar[] | undefined);
      return mapResult(result);
    },
  };
}

export function adaptOpSqlite(database: DB): SqlDatabase {
  return {
    async execute(sql: string, params?: SqlValue[]): Promise<SqlQueryResult> {
      const result = await database.execute(sql, params as Scalar[] | undefined);
      return mapResult(result);
    },

    async transaction<T>(
      work: (transaction: SqlTransaction) => Promise<T>,
    ): Promise<T> {
      let value: T | undefined;
      let completed = false;

      await database.transaction(async transaction => {
        value = await work(mapTransaction(transaction));
        completed = true;
      });

      if (!completed) {
        throw new Error('Database transaction completed without a result.');
      }

      return value as T;
    },

    close(): void {
      database.close();
    },

    getPath(): string {
      return database.getDbPath();
    },
  };
}
