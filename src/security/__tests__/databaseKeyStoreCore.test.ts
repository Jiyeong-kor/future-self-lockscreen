import assert from 'node:assert/strict';
import {
  createDatabaseKeyStore, CONFIRMED_SERVICE, PENDING_SERVICE, DATABASE_KEY_USERNAME,
  type DatabaseKeyBackend, type KeyCredentials,
} from '../databaseKeyStoreCore';
import {DatabaseKeyAccessError} from '../../database/errors';

// 공개 저장소용 가상 키이며 실제 기기 키가 아니다.
const keyA = 'a'.repeat(64);
const keyB = 'b'.repeat(64);
function setup() {
  const data = new Map<string, KeyCredentials>();
  let generated = 0;
  const writes: string[] = [];
  const removes: string[] = [];
  const backend: DatabaseKeyBackend = {
    async read(service) { return data.get(service) ?? null; },
    async write(service, value) { writes.push(service); data.set(service, value); },
    async remove(service) { removes.push(service); data.delete(service); },
  };
  const store = createDatabaseKeyStore(backend, () => { generated += 1; return keyA; });
  const put = (service: string, key: string) => data.set(service, {username: DATABASE_KEY_USERNAME, password: key});
  return {data, backend, store, put, writes, removes, generated: () => generated};
}

describe('암호화 키 저장 수명', () => {
  it('동시 후보 요청은 동일한 키를 한 번만 생성한다', async () => {
    const f = setup();
    const keys = await Promise.all(Array.from({length: 20}, () => f.store.getOrCreatePending()));
    assert.deepEqual(keys, Array(20).fill(keyA));
    assert.equal(f.generated(), 1);
    assert.deepEqual(f.writes, [PENDING_SERVICE]);
  });
  it('기존 후보를 재사용하며 임의로 교체하지 않는다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyB);
    assert.equal(await f.store.getOrCreatePending(), keyB);
    assert.equal(f.generated(), 0);
  });
  it('키 읽기 실패를 키가 없는 상태로 간주하지 않는다', async () => {
    const f = setup();
    f.backend.read = async () => { throw new Error('기기 잠금'); };
    await assert.rejects(f.store.getConfirmed(), DatabaseKeyAccessError);
    await assert.rejects(f.store.getOrCreatePending(), DatabaseKeyAccessError);
    assert.equal(f.generated(), 0); assert.equal(f.writes.length, 0);
  });
  it('접근 실패가 해소되면 같은 저장소로 재시도할 수 있다', async () => {
    const f = setup(); const original = f.backend.read;
    f.backend.read = async () => { throw new Error('일시 오류'); };
    await assert.rejects(f.store.getConfirmed(), DatabaseKeyAccessError);
    f.backend.read = original; f.put(CONFIRMED_SERVICE, keyA);
    assert.equal(await f.store.getConfirmed(), keyA);
  });
  it('잘못된 사용자명과 잘못된 키 형식을 거부한다', async () => {
    for (const credentials of [
      {username: 'other', password: keyA},
      {username: DATABASE_KEY_USERNAME, password: ''},
      {username: DATABASE_KEY_USERNAME, password: 'plain-text'},
    ]) {
      const f = setup(); f.data.set(CONFIRMED_SERVICE, credentials);
      await assert.rejects(f.store.getConfirmed(), DatabaseKeyAccessError);
      assert.equal(f.generated(), 0);
    }
  });
  it('이미 확정 키가 있으면 새 후보를 만들지 않는다', async () => {
    const f = setup(); f.put(CONFIRMED_SERVICE, keyB);
    await assert.rejects(f.store.getOrCreatePending(), DatabaseKeyAccessError);
    assert.equal(f.generated(), 0);
  });
  it('후보 저장 후 다시 읽은 값이 다르면 성공으로 처리하지 않는다', async () => {
    const f = setup(); f.backend.write = async () => {};
    await assert.rejects(f.store.getOrCreatePending(), DatabaseKeyAccessError);
    assert.equal(f.data.size, 0);
  });
  it('다른 확정 키를 후보 키로 덮어쓰지 않는다', async () => {
    const f = setup(); f.put(CONFIRMED_SERVICE, keyB); f.put(PENDING_SERVICE, keyA);
    await assert.rejects(f.store.promotePending(keyA), DatabaseKeyAccessError);
    assert.equal(f.data.get(CONFIRMED_SERVICE)?.password, keyB);
    assert.equal(f.writes.length, 0); assert.equal(f.removes.length, 0);
  });
  it('확정 키 쓰기가 실패하면 후보를 유지한다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyA);
    f.backend.write = async () => { throw new Error('쓰기 실패'); };
    await assert.rejects(f.store.promotePending(keyA), DatabaseKeyAccessError);
    assert.equal(f.data.get(PENDING_SERVICE)?.password, keyA);
    assert.equal(f.removes.length, 0);
  });
  it('확정 키 읽기 검증이 실패해도 후보를 유지한다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyA);
    f.backend.write = async () => {};
    await assert.rejects(f.store.promotePending(keyA), DatabaseKeyAccessError);
    assert.equal(f.data.get(PENDING_SERVICE)?.password, keyA);
    assert.equal(f.removes.length, 0);
  });
  it('확정 후 후보 삭제 실패는 재시도할 수 있다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyA);
    const remove = f.backend.remove;
    f.backend.remove = async () => {};
    await assert.rejects(f.store.promotePending(keyA), DatabaseKeyAccessError);
    assert.equal(f.data.get(CONFIRMED_SERVICE)?.password, keyA);
    assert.equal(f.data.get(PENDING_SERVICE)?.password, keyA);
    f.backend.remove = remove;
    await f.store.promotePending(keyA);
    assert.equal(f.data.has(PENDING_SERVICE), false);
    await f.store.promotePending(keyA);
    assert.equal(f.data.get(CONFIRMED_SERVICE)?.password, keyA);
  });
  it('확정 키가 없는 후보는 정리 요청으로 삭제하지 않는다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyA);
    await assert.rejects(f.store.clearPending(), DatabaseKeyAccessError);
    assert.equal(f.data.get(PENDING_SERVICE)?.password, keyA);
    f.put(CONFIRMED_SERVICE, keyA); await f.store.clearPending();
    assert.equal(f.data.has(PENDING_SERVICE), false);
  });
  it('동시 확정 요청은 이미 검증한 키를 유지한다', async () => {
    const f = setup(); f.put(PENDING_SERVICE, keyA);
    await Promise.all([f.store.promotePending(keyA), f.store.promotePending(keyA)]);
    assert.equal(f.data.get(CONFIRMED_SERVICE)?.password, keyA);
    assert.deepEqual(f.writes, [CONFIRMED_SERVICE]);
  });
});
