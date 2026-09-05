# Future Self 로컬 데이터베이스 기술 결정

- 상태: Phase 1 구현 결정
- 결정일: 2026-09-05
- 대상: React Native 0.87 iOS 우선 구현
- 상위 기준: `docs/PRD.md`, `docs/DOMAIN_SCHEMA.md`, `docs/DATA_LIFECYCLE_SECURITY.md`

## 1. 결정

Future Self의 1차 로컬 데이터베이스는 다음 구성을 사용한다.

- SQLite binding: `@op-engineering/op-sqlite` 18.1.4
- database encryption: SQLCipher compilation target
- full-text search: FTS5
- database key storage: `react-native-keychain` 10.0.0
- secure random source: `react-native-get-random-values` 2.0.0

`package.json`에서 OP-SQLite를 다음처럼 컴파일한다.

```json
{
  "op-sqlite": {
    "sqlcipher": true,
    "fts5": true
  }
}
```

## 2. 선택 이유

Future Self는 단순 key-value 앱이 아니다.

필수 요구사항:

- revision/event가 장기간 누적되는 relational schema
- 여러 테이블을 묶는 강한 transaction boundary
- causal provenance와 merge 무결성
- 수만 개 이상의 source/node/relation 장기 성능 검증
- private full-text search
- DB 자체 암호화
- migration과 restore 시 raw SQL 제어
- 추후 멀티디바이스가 생겨도 local-first source of truth 유지

OP-SQLite는 raw SQLite API, transaction, SQLCipher compilation, FTS5, prepared statement, reactive query, native query interruption을 제공하므로 이 요구에 맞는다.

ORM은 1차 데이터 무결성 계층으로 채택하지 않는다. 필요해지면 repository 위 또는 아래에 제한적으로 도입할 수 있지만 canonical schema와 transaction 규칙을 ORM에 위임하지 않는다.

## 3. 제외한 방향

### react-native-sqlite-storage

현재 프로젝트의 React Native/New Architecture 기준에서 우선 선택하지 않는다.

### 범용 key-value store

revision, relation, provenance, historical reconstruction 요구를 표현하기 어렵기 때문에 source of truth로 사용하지 않는다.

### 원격 DB 우선 구조

제품의 local-first 및 private-by-default 원칙과 맞지 않는다. 멀티디바이스는 현재 로컬 모델을 보존한 상태에서 후속 설계한다.

## 4. SQLCipher 키 정책

DB 암호화 키는 데이터베이스 파일과 분리한다.

정책:

- 32바이트 CSPRNG 값을 생성하고 64자리 hex 문자열로 표현한다.
- iOS Keychain / Android Keystore를 통해 저장한다.
- 앱 로그, crash metadata, App Group, AsyncStorage, SQLite 내부에 키를 기록하지 않는다.
- iOS에서는 `WHEN_UNLOCKED_THIS_DEVICE_ONLY` 접근성을 기본으로 한다.
- Android에서는 최소 `SECURE_SOFTWARE` 보안 수준을 요구한다.
- 앱 잠금용 생체 인증과 DB key retrieval을 동일 개념으로 묶지 않는다.

DB key는 기기 로컬 암호화를 위한 키이다. 암호화 백업의 키 또는 비밀번호와 재사용하지 않는다.

## 5. 키 생성 중단 안전성

Keychain의 확정 키가 없는 상태에서 곧바로 새 키를 확정 저장하면 안 된다. 기존 DB가 있는데 Keychain만 유실된 상황에서 잘못된 새 키를 확정할 수 있기 때문이다.

초기화는 pending key를 이용한다.

```text
확정 DB key 조회
→ 없으면 pending key 조회
→ pending도 없으면 새 random key 생성 후 pending으로 저장
→ pending key로 SQLCipher DB open 및 readable 여부 검증
→ 성공 시 확정 key로 승격
→ pending 삭제
```

기존 암호화 DB가 있고 key가 유실되어 새 candidate로 열 수 없는 경우:

- 기존 DB를 삭제하지 않는다.
- 새 빈 DB로 자동 fallback하지 않는다.
- candidate를 확정 key로 승격하지 않는다.
- 복원 또는 명시적 데이터 초기화 흐름으로 보낸다.

앱이 fresh DB 생성 도중 종료된 경우에는 pending key로 다시 열어보고 성공하면 승격할 수 있다.

## 6. SQLite runtime policy

DB를 연 뒤 최소 다음을 명시적으로 설정하거나 검증한다.

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = FULL;
PRAGMA busy_timeout = 5000;
```

원칙:

- write는 transaction 안에서 수행한다.
- `journal_mode=MEMORY` 또는 `OFF` 같은 데이터 안전성 저하 설정을 사용하지 않는다.
- full graph를 매번 메모리에 적재하지 않는다.
- 가능한 일반 테이블은 SQLite `STRICT`를 사용한다.
- foreign key enforcement를 매 connection에서 명시적으로 켠다.

`synchronous=FULL`은 초기 안전 기본값이다. 장기 합성 데이터 벤치마크에서 quick capture latency가 문제가 될 경우 데이터 손상·유실 특성을 비교한 뒤 별도 결정으로 조정한다.

## 7. FTS5 정책

검색 인덱스는 같은 SQLCipher DB 안의 파생 데이터로 둔다.

- FTS5 index는 source of truth가 아니다.
- current revision 기본 검색과 historical opt-in 검색을 구분한다.
- hard delete 시 파생 검색 데이터도 제거한다.
- index 손상 또는 migration 시 canonical revision에서 재생성할 수 있어야 한다.
- 개인 원문을 Spotlight에 자동 복제하지 않는다.

## 8. iOS 파일 보호

SQLCipher만으로 iOS file protection 요구를 충족했다고 보지 않는다.

DB 본체와 sidecar를 모두 보호해야 한다.

대상:

- `.sqlite`
- `-wal`
- `-shm`
- temp database files
- private export staging files

목표 file protection은 `NSFileProtectionComplete`에 대응하는 강한 보호이다.

OP-SQLite의 실제 DB path를 기준으로 파일 속성 적용과 검증을 위한 작은 iOS native 보안 모듈을 별도로 구현한다.

## 9. migration 원칙

- migration은 단조 증가하는 정수 version을 가진다.
- 적용된 migration을 별도 table에 기록한다.
- 하나의 migration은 transaction으로 적용한다.
- 실패하면 해당 migration의 부분 적용을 남기지 않는다.
- application code는 현재 schema version보다 미래 schema인 DB를 자동 downgrade하지 않는다.
- restore는 migration 후 전체 domain integrity validation을 통과해야 live DB가 된다.

## 10. repository 경계

UI가 OP-SQLite를 직접 호출하지 않는다.

```text
UI / screen
→ use case / service
→ repository
→ database adapter
→ OP-SQLite
```

다음은 repository/service 계층에서 강제한다.

- revision 생성과 currentRevisionId 변경의 원자성
- classification event와 current kind 변경
- lifecycle event와 current status 변경
- causal cycle validation
- merge validation
- Projection approval / activeAnchor validation
- hard delete cascade

## 11. 테스트

Node/Jest 단위 테스트는 native SQLite 모듈 자체의 정확성을 증명하는 용도로 사용하지 않는다.

구분:

- pure domain tests: causal/merge/classification 등
- migration SQL tests: schema와 migration 순서
- repository tests: transaction boundary와 revision behavior
- iOS/Android integration tests: 실제 SQLCipher open, key retrieval, FTS5, WAL, file protection
- restore tests: staging validation과 atomic swap

## 12. 후속 작업

1. DB key store 구현
2. OP-SQLite connection adapter 구현
3. migration runner 구현
4. initial schema 작성
5. CaptureRepository 구현
6. quick capture persistence 연결
7. iOS file protection native module 구현 및 sidecar 검증
