import type {SqlDatabase, SqlTransaction} from './types';

export interface ProtectionState {
  available: boolean;
  generation: number;
}

export interface PrivateStoragePort {
  getState(): Promise<ProtectionState>;
  protectFiles(): Promise<void>;
  subscribe(listener: (state: ProtectionState) => void): () => void;
}

export class ProtectedDataUnavailableError extends Error {
  constructor() {
    super('잠금이 해제된 뒤 다시 시도해 주세요. 입력한 내용은 유지됩니다.');
    this.name = 'ProtectedDataUnavailableError';
  }
}

/** 이벤트는 연결 정리를 시작하며, 실제 작업은 네이티브 상태를 다시 확인한다. */
export class ProtectedDataAccess {
  private state: ProtectionState | null = null;
  private unsubscribe: (() => void) | null = null;
  private failure: unknown;
  private failed = false;

  constructor(
    private readonly port: PrivateStoragePort,
    private readonly closeDatabase: () => Promise<void>,
  ) {}

  private close(): void {
    // 이벤트 콜백에서 종료를 기다리면 실행 중인 트랜잭션과 교착될 수 있다.
    // 거부된 종료 Promise는 보존하고, 다음 접근에서도 실패를 숨기지 않는다.
    try {
      this.closeDatabase().catch(error => {
        this.failed = true;
        this.failure = error;
      });
    } catch (error) {
      this.failed = true;
      this.failure = error;
    }
  }

  private accept(next: ProtectionState): void {
    if (
      typeof next?.available !== 'boolean' ||
      !Number.isSafeInteger(next?.generation) || next.generation < 0
    ) {
      this.failed = true;
      this.failure = new Error('개인 저장소의 보호 상태를 확인하지 못했습니다.');
      this.close();
      throw this.failure;
    }
    if (this.state !== null && next.generation < this.state.generation) {
      return;
    }
    if (this.state !== null && next.generation === this.state.generation) {
      if (next.available !== this.state.available) {
        this.failed = true;
        this.failure = new Error('개인 저장소의 보호 상태가 일치하지 않습니다.');
        this.close();
        throw this.failure;
      }
      return;
    }
    const previous = this.state;
    this.state = next;
    if (!next.available || previous !== null) {
      // 잠금과 해제 이벤트를 놓쳤더라도 세대가 바뀐 기존 연결은 폐기한다.
      this.close();
    }
  }

  async assertAvailable(expectedGeneration?: number): Promise<number> {
    if (this.failed) { throw this.failure; }
    if (this.unsubscribe === null) {
      this.unsubscribe = this.port.subscribe(state => {
        try { this.accept(state); } catch { /* 다음 접근에서 보존한 오류를 반환한다. */ }
      });
    }
    let state: ProtectionState;
    try {
      state = await this.port.getState();
    } catch (error) {
      // 확인 실패를 잠금 해제로 간주하지 않으며, 기존 핸들도 정리한다.
      this.close();
      throw error;
    }
    this.accept(state);
    if (this.failed) { throw this.failure; }
    const current = this.state!;
    if (
      !current.available ||
      state.generation !== current.generation ||
      (expectedGeneration !== undefined && expectedGeneration !== current.generation)
    ) {
      throw new ProtectedDataUnavailableError();
    }
    return current.generation;
  }

  async prepare(): Promise<number> {
    const generation = await this.assertAvailable();
    await this.port.protectFiles();
    await this.assertAvailable(generation);
    return generation;
  }

  async verifyFiles(generation: number): Promise<void> {
    await this.assertAvailable(generation);
    await this.port.protectFiles();
    await this.assertAvailable(generation);
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.failed = true;
    this.failure = new Error('개인 저장소 보호 감시가 종료됐습니다.');
    this.close();
  }
}

/** 기존 세대의 연결은 잠금 해제 후에도 재사용하지 않는다. 롤백과 close는 차단하지 않는다. */
export function protectDatabaseAccess(
  raw: SqlDatabase,
  access: ProtectedDataAccess,
  generation: number,
): SqlDatabase {
  return {
    execute: async (sql, params) => {
      await access.assertAvailable(generation);
      return raw.execute(sql, params);
    },
    transaction: async <T>(work: (transaction: SqlTransaction) => Promise<T>) => {
      await access.assertAvailable(generation);
      return raw.transaction(async transaction => {
        let active = true;
        try {
          const result = await work({execute: async (sql, params) => {
            if (!active) { throw new ProtectedDataUnavailableError(); }
            await access.assertAvailable(generation);
            if (!active) { throw new ProtectedDataUnavailableError(); }
            return transaction.execute(sql, params);
          }});
          // 콜백 마지막 작업 후 잠금이 시작됐다면 COMMIT 대신 라이브러리의 롤백을 사용한다.
          await access.assertAvailable(generation);
          return result;
        } finally { active = false; }
      });
    },
    close: () => raw.close(),
    getPath: () => raw.getPath(),
  };
}
