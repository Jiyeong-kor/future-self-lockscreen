import assert from 'node:assert/strict';
import {ProtectedDataAccess, ProtectedDataUnavailableError, protectDatabaseAccess,
  type ProtectionState, type PrivateStoragePort} from '../ProtectedDataAccess';
import type {SqlDatabase, SqlTransaction} from '../types';

function fixture(initial: ProtectionState = {available: true, generation: 0}) {
  let current = initial;
  let listener: ((state: ProtectionState) => void) | undefined;
  const events: string[] = [];
  let closes = 0;
  const port: PrivateStoragePort = {
    async getState() { events.push('state'); return current; },
    async protectFiles() { events.push('files'); },
    subscribe(callback) { events.push('subscribe'); listener = callback; return () => { listener = undefined; }; },
  };
  const access = new ProtectedDataAccess(port, async () => { closes += 1; });
  const raw: SqlDatabase = {
    async execute() { events.push('execute'); return {rows: [], rowsAffected: 1}; },
    async transaction(work) {
      events.push('begin');
      try { const value = await work(raw); events.push('commit'); return value; }
      catch (error) { events.push('rollback'); throw error; }
    },
    close() { events.push('close'); },
    getPath() { return '/virtual/future-self.sqlite'; },
  };
  return {access, port, raw, events, closeCount: () => closes,
    set(next: ProtectionState, emit = true) { current = next; if (emit) { listener?.(next); } },
    emit(next: ProtectionState) { listener?.(next); }};
}

describe('iOS 보호 상태와 DB 접근', () => {
  it('이벤트를 먼저 구독하고 파일 보호 전후의 잠금 상태를 확인한다', async () => {
    const f = fixture(); assert.equal(await f.access.prepare(), 0);
    assert.deepEqual(f.events, ['subscribe', 'state', 'files', 'state']);
  });
  it('잠금 상태에서는 파일 생성과 보호 설정을 시작하지 않는다', async () => {
    const f = fixture({available: false, generation: 0});
    await assert.rejects(f.access.prepare(), ProtectedDataUnavailableError);
    assert.equal(f.events.includes('files'), false);
    assert.equal(f.closeCount(), 1);
  });
  it('파일 보호를 적용하는 동안 잠기면 연결 준비가 실패한다', async () => {
    const f = fixture(); f.port.protectFiles = async () => { f.set({available: false, generation: 1}); };
    await assert.rejects(f.access.prepare(), ProtectedDataUnavailableError);
  });
  it('파일 보호 실패를 무시하지 않는다', async () => {
    const f = fixture(); f.port.protectFiles = async () => { throw new Error('protection failed'); };
    await assert.rejects(f.access.prepare(), /protection failed/);
  });
  it('이벤트가 늦더라도 네이티브 상태를 읽어 잠금 중 쿼리를 거부한다', async () => {
    const f = fixture(); const generation = await f.access.prepare();
    f.set({available: false, generation: 1}, false);
    const database = protectDatabaseAccess(f.raw, f.access, generation);
    await assert.rejects(database.execute('SELECT 1'), ProtectedDataUnavailableError);
    assert.equal(f.events.includes('execute'), false);
  });
  it('잠금 해제 후 이전 세대의 핸들을 재사용하지 않는다', async () => {
    const f = fixture(); const generation = await f.access.prepare();
    f.set({available: false, generation: 1}); f.set({available: true, generation: 2});
    await assert.rejects(protectDatabaseAccess(f.raw, f.access, generation).execute('SELECT 1'), ProtectedDataUnavailableError);
    assert.equal(await f.access.prepare(), 2);
    await protectDatabaseAccess(f.raw, f.access, 2).execute('SELECT 1');
    assert.equal(f.events.filter(value => value === 'execute').length, 1);
  });
  it('이전 세대의 늦은 해제 이벤트는 현재 잠금을 해제하지 않는다', async () => {
    const f = fixture(); await f.access.prepare();
    f.set({available: false, generation: 3}); f.emit({available: true, generation: 2});
    await assert.rejects(f.access.assertAvailable(), ProtectedDataUnavailableError);
  });
  it('상태 조회 응답보다 최신 잠금 이벤트가 도착하면 오래된 응답을 거부한다', async () => {
    const f = fixture(); await f.access.prepare();
    f.port.getState = async () => { f.set({available: false, generation: 1}); return {available: true, generation: 0}; };
    await assert.rejects(f.access.assertAvailable(), ProtectedDataUnavailableError);
  });
  it('상태 조회 명령 실패 시 기존 연결 정리를 요청한다', async () => {
    const f = fixture(); await f.access.prepare();
    f.port.getState = async () => { throw new Error('native unavailable'); };
    await assert.rejects(f.access.assertAvailable(), /native unavailable/);
    assert.equal(f.closeCount(), 1);
  });
  it('동일 세대의 서로 다른 상태는 안전하지 않은 응답으로 거부한다', async () => {
    const f = fixture(); await f.access.prepare(); f.set({available: false, generation: 0});
    await assert.rejects(f.access.assertAvailable(), /일치하지/);
  });
  it('형식이 잘못된 네이티브 상태를 접근 허용으로 바꾸지 않는다', async () => {
    const f = fixture({available: true, generation: -1});
    await assert.rejects(f.access.prepare(), /보호 상태/);
  });
  it('트랜잭션 안에서 잠기면 후속 쓰기를 거부하고 롤백한다', async () => {
    const f = fixture(); const generation = await f.access.prepare();
    const database = protectDatabaseAccess(f.raw, f.access, generation);
    await assert.rejects(database.transaction(async tx => {
      await tx.execute('INSERT first'); f.set({available: false, generation: 1});
      await tx.execute('INSERT second');
    }), ProtectedDataUnavailableError);
    assert.equal(f.events.filter(value => value === 'execute').length, 1);
    assert.equal(f.events.includes('commit'), false);
    assert.equal(f.events.includes('rollback'), true);
  });
  it('마지막 SQL 후 잠금이 시작돼도 커밋 직전에 다시 검사한다', async () => {
    const f = fixture(); const generation = await f.access.prepare();
    await assert.rejects(protectDatabaseAccess(f.raw, f.access, generation).transaction(async tx => {
      await tx.execute('INSERT first'); f.set({available: false, generation: 1});
    }), ProtectedDataUnavailableError);
    assert.equal(f.events.includes('commit'), false);
    assert.equal(f.events.includes('rollback'), true);
  });
  it('실패 이후 롤백과 연결 종료를 잠금 검사로 막지 않는다', async () => {
    const f = fixture(); const generation = await f.access.prepare();
    const database = protectDatabaseAccess(f.raw, f.access, generation);
    f.set({available: false, generation: 1}); database.close();
    assert.equal(f.events.includes('close'), true);
  });
  it('완료된 트랜잭션의 실행기를 외부에서 재사용하지 않는다', async () => {
    const f = fixture(); const generation = await f.access.prepare(); let saved: SqlTransaction | undefined;
    const value = await protectDatabaseAccess(f.raw, f.access, generation).transaction(async tx => { saved = tx; return 7; });
    assert.equal(value, 7); assert.ok(saved);
    await assert.rejects(saved.execute('INSERT late'), ProtectedDataUnavailableError);
    assert.equal(f.events.includes('execute'), false);
  });
  it('연결 종료 실패는 해제 이벤트 이후에도 숨기지 않는다', async () => {
    const f = fixture(); const failure = new Error('close failed');
    const access = new ProtectedDataAccess(f.port, async () => { throw failure; });
    await access.prepare(); f.set({available: false, generation: 1});
    await Promise.resolve(); f.set({available: true, generation: 2});
    await assert.rejects(access.assertAvailable(), /close failed/);
  });
  it('보호 감시를 종료하면 이후 접근과 재구독을 허용하지 않는다', async () => {
    const f = fixture(); await f.access.prepare(); f.access.dispose();
    await assert.rejects(f.access.prepare(), /종료/);
    assert.equal(f.events.filter(value => value === 'subscribe').length, 1);
  });
});
