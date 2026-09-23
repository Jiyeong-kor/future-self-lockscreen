import assert from 'node:assert/strict';
import {openEncryptedDatabase, type EncryptedDatabaseDependencies} from '../openEncryptedDatabase';
import {DatabaseCloseError, DatabaseEncryptionUnavailableError, DatabaseInitializationError, DatabaseKeyAccessError, DatabaseRecoveryRequiredError} from '../errors';
import type {SqlDatabase} from '../types';

const key = 'a'.repeat(64);
function setup(confirmed: string | null = key) {
  const events: string[] = [];
  const database: SqlDatabase = {
    async execute() { events.push('read'); return {rows: [], rowsAffected: 0}; },
    async transaction(work) { return work(database); },
    close() { events.push('close'); },
    getPath() { return '/virtual/private.sqlite'; },
  };
  const dependencies: EncryptedDatabaseDependencies = {
    isEncryptionAvailable: () => true,
    keyStore: {
      async getConfirmed() { events.push('confirmed'); return confirmed; },
      async getOrCreatePending() { events.push('pending'); return key; },
      async promotePending() { events.push('promote'); },
      async clearPending() { events.push('clear'); },
    },
    openWithKey(value) { assert.equal(value, key); events.push('open'); return database; },
    async initialize() { events.push('initialize'); },
  };
  return {events, database, dependencies};
}

describe('암호화 DB 초기화', () => {
  it('SQLCipher가 없으면 키 접근이나 평문 대체 없이 중단한다', async () => {
    const f = setup(); f.dependencies.isEncryptionAvailable = () => false;
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseEncryptionUnavailableError);
    assert.deepEqual(f.events, []);
  });
  it('확정 키로 페이지를 읽고 초기화한 뒤 연결을 반환한다', async () => {
    const f = setup();
    assert.equal(await openEncryptedDatabase(f.dependencies), f.database);
    assert.deepEqual(f.events, ['confirmed', 'open', 'read', 'initialize']);
  });
  it('후보 키는 초기화까지 성공한 뒤 확정한다', async () => {
    const f = setup(null); await openEncryptedDatabase(f.dependencies);
    assert.deepEqual(f.events, ['confirmed', 'pending', 'open', 'read', 'initialize', 'promote']);
  });
  it('확정 키 읽기가 실패하면 새 키나 새 연결을 만들지 않는다', async () => {
    const f = setup(); f.dependencies.keyStore.getConfirmed = async () => { throw new Error('locked'); };
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseKeyAccessError);
    assert.deepEqual(f.events, []);
  });
  it('잘못된 키 형식을 네이티브 모듈에 넘기지 않는다', async () => {
    const f = setup('bad');
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseKeyAccessError);
    assert.deepEqual(f.events, ['confirmed']);
  });
  it('후보 생성 실패 시 파일을 열지 않는다', async () => {
    const f = setup(null);
    f.dependencies.keyStore.getOrCreatePending = async () => { throw new Error('failed'); };
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseKeyAccessError);
    assert.deepEqual(f.events, ['confirmed']);
  });
  it('잘못된 키로 페이지 읽기에 실패하면 후보를 교체하지 않는다', async () => {
    const f = setup(null);
    f.database.execute = async () => { throw new Error('not a database'); };
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseRecoveryRequiredError);
    assert.deepEqual(f.events, ['confirmed', 'pending', 'open', 'close']);
  });
  it('설정 또는 migration 실패 시 후보를 유지하고 연결을 닫는다', async () => {
    const f = setup(null);
    f.dependencies.initialize = async () => { throw new Error('disk full'); };
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseInitializationError);
    assert.deepEqual(f.events, ['confirmed', 'pending', 'open', 'read', 'close']);
  });
  it('키 확정 실패 시 초기화된 연결을 외부에 제공하지 않는다', async () => {
    const f = setup(null);
    f.dependencies.keyStore.promotePending = async () => { throw new Error('Keychain failed'); };
    await assert.rejects(openEncryptedDatabase(f.dependencies), DatabaseKeyAccessError);
    assert.deepEqual(f.events, ['confirmed', 'pending', 'open', 'read', 'initialize', 'close']);
  });
  it('실패 정리 중 close까지 실패하면 두 원인을 보존한다', async () => {
    const f = setup(); const initial = new Error('migration failed'); const cleanup = new Error('close failed');
    f.dependencies.initialize = async () => { throw initial; };
    f.database.close = () => { throw cleanup; };
    await assert.rejects(openEncryptedDatabase(f.dependencies), (error: unknown) => {
      assert.ok(error instanceof DatabaseCloseError);
      const cause = error.causeValue as {initializationError: DatabaseInitializationError; cleanupError: unknown};
      assert.equal(cause.initializationError.causeValue, initial);
      assert.equal(cause.cleanupError, cleanup); return true;
    });
  });
});
