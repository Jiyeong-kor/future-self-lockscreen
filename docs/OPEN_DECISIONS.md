# Future Self 결정 및 결함 상태

- 최근 갱신: 2026-09-04
- 상태: 구현을 막는 제품 결정 없음
- 제품 기준: `docs/PRD.md`
- 스키마 기준: `docs/DOMAIN_SCHEMA.md`
- 데이터/보안 기준: `docs/DATA_LIFECYCLE_SECURITY.md`

## 1. 확정된 제품 결정

- iOS 우선
- React Native Community CLI + TypeScript
- WidgetKit 포함
- 홈은 빠른 기록 중심
- 회고는 regret뿐 아니라 win, desire, discovery, turning_point, insight 지원
- 기록 시점에 목표나 행동 연결을 강제하지 않음
- 여러 기록에서 SynthesisInsight 생성 가능
- Motive, Vision, Goal, Practice, Commitment 다대다 연결
- Focus Board + Block Tray 제공
- Drag and Drop과 탭 기반 연결 동시 지원
- 잠금화면 대표 문장은 사용자 명시 선택만으로 변경
- 잠금화면에는 승인된 공개용 Projection revision만 노출
- Review는 task backlog가 아니라 소수 resurfacing 방식
- 자동 클라우드 백업 제외
- 수동 백업은 암호화 컨테이너
- 복원 기본 정책은 기존 데이터와 자동 병합이 아니라 전체 교체
- Android는 후속 지원

## 2. 레드팀 결함 해결 상태

### 해결: Commitment 소스 오브 트루스 충돌

공통 `MeaningNode`를 stable 원본으로 사용하고 종류별 revision detail을 둔다. 단일 `Commitment.reflectionItemId` 모델은 기준 스키마에서 사용하지 않는다.

### 해결: derived_from 스키마 불일치

출처와 의미 관계를 분리했다. 모든 인과 출처는 `CausalEvidenceLink`로 관리한다.

### 해결: 과거 원문 소급 변경

CaptureEntry, ReflectionItem, SynthesisInsight, MeaningNode는 revision을 사용한다. Evidence는 당시 revision을 고정한다.

### 해결: OriginMoment 관계 스냅샷 부족

`OriginRelationSnapshot`을 추가했다.

### 해결: 관계별 의미 변화 기록 불가

MeaningCheckIn은 `node | relation`을 모두 대상으로 한다.

### 해결: Synthesis와 MeaningNode 간 간접 인과 순환

전체 causal provenance graph에 cycle validation을 적용한다.

### 해결: activeAnchor 변경 규칙 미정

대표 문장은 사용자 명시 동작으로만 변경한다. Review, FocusWindow, 새 Commitment가 자동 변경하지 않는다.

### 해결: 잠금화면 승인 자동 승계 위험

승인은 `LockscreenProjectionRevision` 단위이다. 새 revision은 다시 승인해야 한다.

### 해결: 하나의 문장이 모든 출력 크기를 담당

내부 Commitment, publicSafeMessage, widgetMessage, wallpaperMessage를 분리 가능하게 설계했다.

### 해결: 상시 보존과 실제 노출 혼동

장기 보존, 잠금화면 적격성, 현재 대표 Projection을 분리했다.

### 해결: Review Queue가 미처리 Inbox가 될 위험

영구 task queue를 두지 않는다. 홈에 계산된 후보를 최대 3개만 보여주고 snooze를 지원한다.

### 해결: 중복 노드 병합 시 역사 손실

source node를 `merged` 상태로 보존하고 과거 relation endpoint를 재작성하지 않는다. 현재 조회만 canonical node로 resolve한다.

### 해결: 종료와 실패 혼동

RetirementReason을 구분하고 종료 시점의 의미를 보존한다.

### 해결: 삭제와 역사 불변성 충돌

명시적인 hard delete는 역사 보존보다 우선한다. 객체별 cascade와 transaction 규칙을 정의했다.

### 해결: restore merge 정책 미정

1차 restore는 staging validation 후 전체 DB 교체로 확정했다. 자동 merge import는 별도 기능이다.

### 해결: Private Store 보호 미정

iOS private 사용자 데이터에는 강한 File Protection을 적용하고 DB sidecar 파일까지 검증한다. App Group에는 승인된 최소 Projection만 둔다.

### 해결: App Switcher 스냅샷 노출

inactive/background 전환 시 privacy cover를 적용한다.

### 해결: Widget 즉시 갱신 가정

Widget은 eventual consistency로 정의한다. 앱은 reload를 요청하지만 즉시 렌더링 완료를 보장하지 않는다.

### 해결: 문서 권위 분산

`PRD.md`, `DOMAIN_SCHEMA.md`, `DATA_LIFECYCLE_SECURITY.md` 세 문서만 구현 기준으로 지정했다. 기존 v0.x 문서는 설계 이력이다.

### 해결: 축소 MVP 표현과 범위 논쟁

제품은 축소형 MVP를 목표로 하지 않는다. 구현 단계는 기능 삭제가 아니라 의존성과 데이터 무결성을 관리하기 위한 순서로 정의한다.

## 3. 비차단 구현 결정

다음은 제품 구조를 바꾸지 않으므로 해당 단계에서 최신 라이브러리와 플랫폼 상태를 확인해 확정한다.

- 실제 앱 표시 이름
- React Native 로컬 SQLite 라이브러리
- 암호화 백업의 구체 cipher/KDF 및 구현 라이브러리
- Widget과 wallpaper 문장 UX 길이 제한
- 전체 Meaning Map 렌더링 라이브러리

## 4. 구현 시작 조건

현재 제품 구조상 추가 사용자 결정 없이 Phase 1 구현을 시작할 수 있다.

구현 중 새로운 도메인 요구가 생기면 먼저 canonical schema와 migration 영향을 검토한 뒤 코드에 반영한다.
