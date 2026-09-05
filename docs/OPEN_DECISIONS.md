# Future Self 결정 및 결함 상태

- 최근 갱신: 2026-09-05
- 상태: 구현을 막는 제품 결정 없음
- 제품 기준: `docs/PRD.md`
- 스키마 기준: `docs/DOMAIN_SCHEMA.md`
- 데이터/보안 기준: `docs/DATA_LIFECYCLE_SECURITY.md`

## 1. 확정된 제품 결정

- iOS 우선
- React Native Community CLI + TypeScript
- WidgetKit 포함
- 홈은 빠른 기록 중심
- 외부 포지셔닝의 중심 문장: `내가 무엇을 해야 하는지가 아니라, 왜 그걸 하기로 했는지를 잊지 않게 해주는 앱`
- 저널이나 범용 PKM이 아니라 개인 동기와 행동의 이유 및 그 변화 이력을 보존하는 제품으로 포지셔닝
- 회고는 regret뿐 아니라 win, desire, discovery, turning_point, insight 지원
- 기록 시점에 목표나 행동 연결을 강제하지 않음
- 행동으로 이어지지 않아도 기록이나 Synthesis 저장 자체로 완결된 정상 사용으로 취급
- `그래서 무엇을 할 건가요`, `가장 작은 행동`, `최소한 이것만`처럼 행동 결정을 압박하는 기본 UX 금지
- 여러 기록에서 SynthesisInsight 생성 가능
- Synthesis는 사용자의 현재 해석을 보존하며 제품이 사용자의 정체성 단정이나 자기해석을 교정하려 하지 않음
- 사용자가 원할 때만 다른 해석, 반례, 추가 연결 등을 탐색할 수 있음
- Motive, Vision, Goal, Practice, Commitment 다대다 연결
- 분류되지 않은 Meaning Card를 정상적인 영구 상태로 허용
- 미분류 Meaning Card를 미완료나 정리 대상처럼 표시하지 않음
- 모든 생각을 온톨로지에 맞춰 분류하도록 요구하지 않음
- Focus Board + Block Tray 제공
- Drag and Drop과 탭 기반 연결 동시 지원
- 그래프 완성도, 연결 개수, 미분류 개수, Inbox Zero를 성취 지표로 사용하지 않음
- 갈등 관계는 `conflicts_with`로 보존하고 사용자가 원할 때 선택적 Trade-off Reflection 제공
- Trade-off Reflection은 정답을 결정하지 않고 당시 우선순위와 선택 맥락만 보존
- 잠금화면 대표 문장은 사용자 명시 선택만으로 변경
- 잠금화면에는 승인된 공개용 Projection revision만 노출
- 공개 승인과 의미 재확인을 분리
- 같은 문장의 시각적 스타일 변경은 공개 재승인을 요구하지 않음
- 의미 재확인은 선택 사항이며 주기적으로 강제하지 않음
- Review는 task backlog가 아니라 소수 resurfacing 방식
- 일반 CaptureEntry나 민감한 과거를 임의로 다시 노출하지 않음
- 복귀 시 미사용 기간을 실패로 취급하지 않고 선택적으로 과거 맥락만 복구
- 장기간 앱을 사용하지 않아도 정상 사용으로 취급
- 자동 클라우드 백업 제외
- 수동 백업은 암호화 컨테이너
- 복원 기본 정책은 기존 데이터와 자동 병합이 아니라 전체 교체
- 장기적으로 멀티디바이스 사용을 지원하는 방향을 채택
- 초기에는 local-first를 유지하고 이후 프라이버시 보존형 동기화 방식을 검토
- Future Self는 할 일/습관 추적 앱으로 확장하지 않음
- 실제 실행 일정이 필요하면 사용자가 원할 때 Reminders, Calendar, Shortcuts 등 외부 실행 도구로 연결
- Android는 후속 지원

## 2. 사용자 결정 없이 기본안으로 진행할 항목

다음은 제품 철학에서 이미 방향이 나오므로 별도 사용자 결정을 요구하지 않는다.

### 2.1 첫날 경험

첫날에도 장기 데이터 없이 제품 가치를 이해할 수 있게 한다.

- 한 줄 기록만 하고 끝낼 수 있음
- 사용자가 원하면 중요한 문장 하나를 공개용 문장으로 만들어 잠금화면에 적용 가능
- 사용자가 이미 중요하게 생각하는 항목이 있으면 `왜 중요하지?`를 따라가며 간단한 Why Trail을 만들 수 있음
- 어느 흐름도 강제하지 않음

### 2.2 사용 주기

- 순간 사용: 빠른 기록, 현재 문장 확인
- 필요할 때: Why Trail, Synthesis, 의미 재확인, 갈등 검토
- 특정 시점: 회고, 시간 여행, 의미 구조 재검토

매일 접속을 성공 기준으로 사용하지 않는다.

### 2.3 1차 사용자

기본 설계 사용자는 다음 특성을 가진 사람으로 둔다.

- 장기 목표나 중요한 선택이 여러 개 있음
- 생각이나 회고를 기록하는 데 가치를 느낌
- 시간이 지나 목표를 시작한 이유를 잊은 경험이 있음
- 단순 완료 체크보다 `왜 하는가`를 중요하게 생각함

이 범주는 UI와 온보딩을 설계하기 위한 우선 사용자이며 앱 사용 자격을 제한하지 않는다.

### 2.4 제품 사용성 검증

개인용 검증 단계에서는 외부 Analytics SDK 없이 로컬에서만 필요한 진단 지표를 볼 수 있게 한다.

- 기록을 다시 열어본 비율
- Why Trail 사용
- Synthesis 재방문
- Review 또는 MeaningCheckIn 사용
- Projection 변경/재작성

이 지표는 사용자 점수나 성취로 노출하지 않는다.

### 2.5 멀티디바이스 구현 방식

멀티디바이스 제공 자체는 확정한다. 구체 방식은 구현 전 별도 기술 검토로 정한다.

기본 우선순위:

1. 프라이버시와 사용자 데이터 소유권
2. 충돌 없는 revision/event 동기화
3. 오프라인 사용 가능
4. 기기 교체 시 데이터 손실 방지

특정 클라우드 사업자나 동기화 기술은 이 단계에서 제품 결정으로 고정하지 않는다.

## 3. 아직 사용자가 결정하는 것이 적절한 전략 항목

이 항목들은 Phase 1 구현을 막지 않는다.

### D-01. AI 보조 기능 허용 범위

선택해야 할 제품 철학:

- A. AI를 제품에 사용하지 않음
- B. 검색, 비슷한 기록 후보, 요약 같은 보조 기능만 허용
- C. 질문이나 연결 후보까지 제안하도록 허용하되 사용자의 의미를 자동 확정하지 않음

어느 선택을 하더라도 AI가 사용자의 Motive, Vision, Goal, Commitment를 사용자 승인 없이 생성하거나 확정하는 구조는 기본안에서 제외한다.

### D-02. 공개 배포 시 수익 모델

공개 배포하기로 결정하는 시점에 선택한다.

후보:

- 완전 무료
- 일회성 유료 구매
- 기본 기능 무료 + 고급 기능 유료
- 구독

광고 SDK와 사용자 개인 데이터 판매는 현재 개인정보 철학과 충돌하므로 후보에서 제외한다.

### D-03. 실제 앱 표시 이름

저장소 이름 `future-self-lockscreen`과 실제 제품 이름은 분리할 수 있다.

이 결정은 정보 구조와 데이터 모델에는 영향을 주지 않지만 앱 아이콘, 온보딩, App Store 공개 전에 확정해야 한다.

## 4. 레드팀 결함 해결 상태

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

### 해결: 온톨로지가 사용자를 압박하는 문제

분류되지 않은 Meaning Card를 정상적인 영구 상태로 허용한다. 분류와 연결은 정리 의무가 아니다.

### 해결: 행동 연결이 부담이 되는 문제

기록과 Synthesis는 행동 노드로 연결하지 않아도 완결된 상태이다. 행동 제안은 사용자가 원할 때만 열 수 있는 선택 기능이다.

### 해결: 정체성 단정을 제품이 교정하려는 문제

사용자의 자기해석과 표현을 제품이 교정하거나 판정하지 않는다. 사용자가 원할 때만 다른 기록이나 대안 관점을 탐색할 수 있게 한다.

### 해결: 민감한 과거 재노출

임의의 과거 기록을 자동 resurfacing하지 않는다. 재노출 가능한 항목과 제외 규칙을 명시하고 이유 없는 자동 노출을 금지한다.

### 해결: 장기 미사용 후 복귀

미사용 기간을 실패로 취급하지 않는다. 복귀 시 밀린 작업을 만들지 않고 사용자가 원할 때만 이전 맥락을 복구한다.

### 해결: 갈등 저장만 하고 의사결정을 돕지 못함

선택적 Trade-off Reflection을 제공하여 당시 우선순위와 선택 맥락을 기록할 수 있게 한다. 앱은 어느 쪽이 옳은지 결정하지 않는다.

### 해결: 장기 단일 기기 한계

멀티디바이스 지원을 장기 제품 방향으로 확정했다. 초기 local-first 구조를 유지하되 동기화가 가능한 revision/event 모델을 훼손하지 않는다.

## 5. 비차단 구현 결정

다음은 제품 구조를 바꾸지 않으므로 해당 단계에서 최신 라이브러리와 플랫폼 상태를 확인해 확정한다.

- React Native 로컬 SQLite 라이브러리
- 암호화 백업의 구체 cipher/KDF 및 구현 라이브러리
- Widget과 wallpaper 문장 UX 길이 제한
- 전체 Meaning Map 렌더링 라이브러리
- 검색 인덱스 구현 라이브러리
- App Intents에서 허용할 입력 범위
- human-readable export의 PDF 지원 시점
- 멀티디바이스 동기화 기술 및 저장소

## 6. 구현 시작 조건

현재 제품 구조상 추가 사용자 결정 없이 Phase 1 구현을 시작할 수 있다.

D-01 AI, D-02 수익 모델, D-03 앱 표시 이름은 각 기능이나 공개 단계 전까지 결정하면 된다.

구현 중 새로운 도메인 요구가 생기면 먼저 canonical schema와 migration 영향을 검토한 뒤 코드에 반영한다.
