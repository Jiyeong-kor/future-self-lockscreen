import {DatabaseCloseError, DatabaseSessionClosedError} from './errors';
import type {SqlDatabase, SqlTransaction} from './types';

interface Session {
  raw: SqlDatabase;
  guarded: SqlDatabase;
  tail: Promise<void>;
  closing: boolean;
}

/** 연결 수명과 쿼리 순서를 관리한다. 네이티브 잠금 감지는 별도 책임이다. */
export class DatabaseSession {
  private current: Session | null = null;
  private opening: Promise<Session> | null = null;
  private closing: Promise<void> | null = null;
  private closeFailure: DatabaseCloseError | null = null;
  private generation = 0;

  constructor(private readonly openDatabase: () => Promise<SqlDatabase>) {}

  async get(): Promise<SqlDatabase> {
    if (this.closeFailure !== null) {
      throw this.closeFailure;
    }
    if (this.closing !== null) {
      await this.closing;
      return this.get();
    }
    const generation = this.generation;
    if (this.current !== null) {
      return this.current.guarded;
    }
    if (this.opening === null) {
      this.opening = Promise.resolve().then(this.openDatabase).then(raw => {
        const session = this.makeSession(raw);
        this.current = session;
        return session;
      });
    }
    const opening = this.opening;
    let session: Session;
    try {
      session = await opening;
    } catch (error) {
      if (error instanceof DatabaseCloseError) {
        this.closeFailure = error;
      }
      throw error;
    } finally {
      if (this.opening === opening) {
        this.opening = null;
      }
    }
    if (generation !== this.generation || session.closing) {
      throw new DatabaseSessionClosedError();
    }
    return session.guarded;
  }

  close(): Promise<void> {
    if (this.closeFailure !== null) {
      return Promise.reject(this.closeFailure);
    }
    if (this.closing !== null) {
      return this.closing;
    }
    this.generation += 1;
    const opening = this.opening;
    const current = this.current;
    if (current !== null) {
      current.closing = true;
    }
    const close = async () => {
      let session = current;
      if (session === null && opening !== null) {
        try {
          session = await opening;
        } catch (error) {
          if (error instanceof DatabaseCloseError) {
            this.closeFailure = error;
            throw error;
          }
          // 초기화 함수가 실패 연결을 정리했다. 별도 연결은 만들지 않는다.
          return;
        }
      }
      if (session === null) {
        return;
      }
      session.closing = true;
      // 이미 접수한 쓰기와 트랜잭션이 정리된 다음에만 핸들을 닫는다.
      await session.tail;
      try {
        session.raw.close();
      } catch (error) {
        this.closeFailure = new DatabaseCloseError(error);
        throw this.closeFailure;
      }
      if (this.current === session) {
        this.current = null;
      }
    };
    this.closing = close().finally(() => { this.closing = null; });
    return this.closing;
  }

  private makeSession(raw: SqlDatabase): Session {
    const session = {raw, tail: Promise.resolve(), closing: false} as Session;
    const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
      if (session.closing || this.current !== session) {
        return Promise.reject(new DatabaseSessionClosedError());
      }
      const result = session.tail.then(work);
      session.tail = result.then(() => undefined, () => undefined);
      return result;
    };
    session.guarded = {
      execute: (sql, params) => enqueue(() => raw.execute(sql, params)),
      transaction: <T>(work: (transaction: SqlTransaction) => Promise<T>) =>
        enqueue(() => raw.transaction(async transaction => {
          let active = true;
          try {
            return await work({execute: (sql, params) => {
              if (!active) {
                return Promise.reject(new DatabaseSessionClosedError());
              }
              return transaction.execute(sql, params);
            }});
          } finally {
            active = false;
          }
        })),
      close: () => {
        throw new Error('공유 연결은 closePrivateDatabase()를 통해 종료해야 합니다.');
      },
      getPath: () => {
        if (session.closing || this.current !== session) {
          throw new DatabaseSessionClosedError();
        }
        return raw.getPath();
      },
    };
    return session;
  }
}
