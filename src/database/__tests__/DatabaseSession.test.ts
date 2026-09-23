import assert from 'node:assert/strict';
import {DatabaseSession} from '../DatabaseSession';
import {DatabaseCloseError, DatabaseSessionClosedError} from '../errors';
import type {SqlDatabase, SqlTransaction} from '../types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
}
function fakeDatabase(events: string[] = []): SqlDatabase {
  return {
    async execute(sql) { events.push(sql); return {rows: [], rowsAffected: 1}; },
    async transaction(work) { events.push('begin'); try { const value = await work(this); events.push('commit'); return value; } catch (error) { events.push('rollback'); throw error; } },
    close() { events.push('close'); },
    getPath() { return '/virtual/private.sqlite'; },
  };
}

describe('공유 DB 연결 수명', () => {
  it('여러 요청은 DB를 한 번만 열고 같은 보호 연결을 받는다', async () => {
    let opens = 0; const raw = fakeDatabase();
    const session = new DatabaseSession(async () => { opens += 1; return raw; });
    const connections = await Promise.all(Array.from({length: 30}, () => session.get()));
    assert.equal(opens, 1); assert.ok(connections.every(value => value === connections[0]));
    assert.notEqual(connections[0], raw); await session.close();
  });
  it('초기화 실패 후 명시적인 다음 요청으로 재시도한다', async () => {
    let opens = 0;
    const session = new DatabaseSession(async () => { if (++opens === 1) { throw new Error('locked'); } return fakeDatabase(); });
    await assert.rejects(session.get()); await session.get(); assert.equal(opens, 2); await session.close();
  });
  it('트랜잭션 중 다른 쿼리는 해당 트랜잭션 뒤에 실행한다', async () => {
    const events: string[] = []; const gate = deferred<void>(); const started = deferred<void>();
    const session = new DatabaseSession(async () => fakeDatabase(events)); const db = await session.get();
    const transaction = db.transaction(async tx => { await tx.execute('write'); started.resolve(); await gate.promise; return 7; });
    await started.promise;
    const read = db.execute('read'); assert.deepEqual(events, ['begin', 'write']);
    gate.resolve(); assert.equal(await transaction, 7); await read;
    assert.deepEqual(events, ['begin', 'write', 'commit', 'read']); await session.close();
  });
  it('종료 요청은 접수된 쓰기가 끝날 때까지 기다린다', async () => {
    const events: string[] = []; const gate = deferred<void>(); const started = deferred<void>();
    const session = new DatabaseSession(async () => fakeDatabase(events)); const db = await session.get();
    const transaction = db.transaction(async tx => { await tx.execute('write'); started.resolve(); await gate.promise; });
    await started.promise; const closing = session.close();
    await assert.rejects(db.execute('late'), DatabaseSessionClosedError);
    assert.equal(events.includes('close'), false); gate.resolve(); await transaction; await closing;
    assert.deepEqual(events, ['begin', 'write', 'commit', 'close']);
  });
  it('종료 전 접수된 대기 쿼리도 유실하지 않는다', async () => {
    const events: string[] = []; const session = new DatabaseSession(async () => fakeDatabase(events)); const db = await session.get();
    const first = db.execute('first'); const second = db.execute('second'); const closing = session.close();
    await Promise.all([first, second, closing]); assert.deepEqual(events, ['first', 'second', 'close']);
  });
  it('종료 중 새 요청은 이전 연결을 닫은 뒤 새 연결을 연다', async () => {
    const events: string[] = []; const gate = deferred<void>(); let opens = 0;
    const session = new DatabaseSession(async () => { events.push(`open${++opens}`); return fakeDatabase(events); });
    const db = await session.get(); const transaction = db.transaction(async () => gate.promise);
    const closing = session.close(); const next = session.get();
    gate.resolve(); await transaction; await closing; const newDb = await next;
    assert.notEqual(db, newDb); assert.deepEqual(events, ['open1', 'begin', 'commit', 'close', 'open2']);
    await assert.rejects(db.execute('stale'), DatabaseSessionClosedError); await session.close();
  });
  it('초기화 중 종료 요청이 오면 닫힐 연결을 반환하지 않는다', async () => {
    const events: string[] = []; const gate = deferred<SqlDatabase>();
    const session = new DatabaseSession(() => gate.promise);
    const pending = session.get(); const rejected = assert.rejects(pending, DatabaseSessionClosedError);
    const closing = session.close(); gate.resolve(fakeDatabase(events));
    await rejected; await closing; assert.deepEqual(events, ['close']);
  });
  it('중복 종료 요청은 네이티브 핸들을 한 번만 닫는다', async () => {
    const events: string[] = []; const session = new DatabaseSession(async () => fakeDatabase(events));
    await session.get(); const first = session.close(); const second = session.close();
    assert.equal(first, second); await Promise.all([first, second]); assert.deepEqual(events, ['close']);
  });
  it('열지 않은 연결의 종료는 새 DB를 만들지 않는다', async () => {
    let opens = 0; const session = new DatabaseSession(async () => { opens += 1; return fakeDatabase(); });
    await session.close(); assert.equal(opens, 0);
  });
  it('실패한 트랜잭션 뒤에도 다른 작업을 실행할 수 있다', async () => {
    const events: string[] = []; const session = new DatabaseSession(async () => fakeDatabase(events)); const db = await session.get();
    await assert.rejects(db.transaction(async () => { throw new Error('rollback'); }));
    await db.execute('read'); assert.deepEqual(events, ['begin', 'rollback', 'read']); await session.close();
  });
  it('트랜잭션 밖으로 유출된 실행기는 재사용하지 못한다', async () => {
    const session = new DatabaseSession(async () => fakeDatabase()); const db = await session.get();
    let escaped: SqlTransaction | undefined;
    await db.transaction(async tx => { escaped = tx; });
    await assert.rejects(escaped!.execute('late'), DatabaseSessionClosedError); await session.close();
  });
  it('네이티브 종료 실패 시 새 핸들을 열지 않는다', async () => {
    let opens = 0; const raw = fakeDatabase(); raw.close = () => { throw new Error('busy'); };
    const session = new DatabaseSession(async () => { opens += 1; return raw; }); await session.get();
    await assert.rejects(session.close(), DatabaseCloseError); await assert.rejects(session.get(), DatabaseCloseError);
    assert.equal(opens, 1);
  });
  it('초기화 실패 정리에서 핸들 종료가 실패해도 자동 재연결하지 않는다', async () => {
    let opens = 0; const session = new DatabaseSession(async () => { opens += 1; throw new DatabaseCloseError(); });
    await assert.rejects(session.get(), DatabaseCloseError); await assert.rejects(session.get(), DatabaseCloseError); assert.equal(opens, 1);
  });
  it('초기화 실패와 종료 요청이 겹쳐도 다음 연결을 막지 않는다', async () => {
    const gate = deferred<SqlDatabase>(); let opens = 0;
    const session = new DatabaseSession(async () => ++opens === 1 ? gate.promise : fakeDatabase());
    const pending = session.get(); const failed = assert.rejects(pending); const closing = session.close();
    gate.reject(new Error('locked')); await failed; await closing; await session.get(); assert.equal(opens, 2); await session.close();
  });
  it('보호 연결을 동기 close로 우회하지 못한다', async () => {
    const events: string[] = []; const session = new DatabaseSession(async () => fakeDatabase(events)); const db = await session.get();
    assert.throws(() => db.close(), /closePrivateDatabase/); assert.deepEqual(events, []); await session.close();
  });
});
