# Future Self 결정 및 결함 상태

- 최근 갱신: 2026-09-05
- 상태: 구현을 막는 제품 결정 없음
- 구현 상태: IA 완료, Phase 1 기반 구현 진행 중
- 제품 기준: `docs/PRD.md`
- 스키마 기준: `docs/DOMAIN_SCHEMA.md`
- 데이터/보안 기준: `docs/DATA_LIFECYCLE_SECURITY.md`
- UX 기준: `docs/INFORMATION_ARCHITECTURE.md`, `docs/USER_FLOWS.md`, `docs/SCREEN_STATES.md`
- 수익화 정책: `docs/MONETIZATION_POLICY.md`

## 1. 확정된 제품 전략

### 포지셔닝

> 내가 무엇을 해야 하는지가 아니라, 왜 그걸 하기로 했는지를 잊지 않게 해주는 앱

Future Self는 범용 저널, PKM, 할 일 또는 습관 추적 앱으로 확장하지 않는다.

### 사용자 부담 원칙

- 기록 시 분류, 연결, 목표화, 행동화를 강제하지 않는다.
- 기록이나 Synthesis 저장 자체로 완결된 정상 사용이 될 수 있다.
- 행동 결정을 압박하는 기본 UX를 사용하지 않는다.
- 분류되지 않은 Meaning Card를 정상적인 영구 상태로 허용한다.
- 미분류 개수, 연결 개수, 그래프 완성도, Inbox Zero를 성취 지표로 사용하지 않는다.
- 사용자의 자기해석이나 정체성 단정을 제품이 교정하거나 판정하지 않는다.

### 의미와 관계

- Meaning Card는 `unclassified`, Motive, Vision, Goal, Practice, Commitment를 지원한다.
- `unclassified`는 영구 유지 가능하고 사용자가 원할 때만 typed kind로 분류한다.
- typed kind 사이의 직접 변경은 하지 않고 정체성이 달라지면 새 node를 만든다.
- 갈등은 `conflicts_with`로 보존한다.
- 사용자가 원할 때만 Trade-off Reflection으로 당시 우선순위와 선택 맥락을 기록한다.
- 결론 없음과 `undecided`도 정상 상태이다.
- 과거 의미와 현재 의미는 revision/event로 함께 보존한다.

### 재노출과 복귀

- 일반 CaptureEntry나 민감한 과거를 임의로 resurfacing하지 않는다.
- Review는 backlog가 아니라 소수의 설명 가능한 후보만 보여준다.
- resurfacing 제외 상태를 지원한다.
- 장기간 앱을 사용하지 않아도 실패로 취급하지 않는다.
- 복귀 시 밀린 작업을 만들지 않고 사용자가 원할 때만 이전 맥락을 복구한다.
- 공개 승인과 의미 재확인은 별개이다.
- 의미 재확인은 선택 사항이며 주기적으로 강제하지 않는다.

### 잠금화면

- 대표 문장은 사용자 명시 선택으로만 바뀐다.
- 승인된 공개용 Projection revision만 잠금화면에 노출한다.
- 문장 내용 변경은 새 공개 승인이 필요하다.
- 동일 문장의 시각적 스타일 변경은 재승인을 요구하지 않는다.

### 데이터와 플랫폼

- iOS 우선
- React Native Community CLI + TypeScript
- React Native 0.87.0 프로젝트 초기화 완료
- WidgetKit 포함
- local-first
- 수동 암호화 백업과 안전한 복원 제공
- 장기적으로 멀티디바이스 지원
- Android는 후속 지원

## 2. AI 결정

**제품에 AI 기능을 사용하지 않는다.**

- AI 요약 없음
- AI 검색 보조 없음
- AI 유사 기록 추천 없음
- AI 연결 추천 없음
- AI 질문 생성 없음
- AI Meaning Card 생성 없음

검색, 필터, 관계 탐색, Synthesis는 사용자 데이터와 명시적 규칙을 기반으로 동작한다.

## 3. 수익화 결정

**현재는 완전 무료로 운영한다.**

- 무료 체험 종료 후 결제 없음
- 일회성 구매 없음
- 구독 없음
- 기능별 유료 잠금 없음
- 광고 SDK 없음
- 사용자 데이터 판매 없음

향후 수익화가 필요해지면 그 시점에 별도 제품 결정으로 다시 검토한다.

## 4. UX 설계 완료 상태

### 정보 구조

하단 최상위 탐색을 다음 네 영역으로 확정했다.

```text
홈 | 기록 | 의미 | 설정
```

회고, Synthesis, Why Trail, 시간 여행, 잠금화면, 전체 Meaning Map은 필요한 순간에만 진입한다.

### 사용자 흐름

다음을 구현 기준으로 문서화했다.

- 한 줄 기록 후 바로 종료
- 기록을 의미 카드로 남기기
- 분류하지 않은 상태 유지 또는 나중에 분류
- 탭 / DnD 관계 연결
- 여러 기록 같이 보기와 Synthesis
- Synthesis 저장 후 아무 행동으로도 연결하지 않고 종료
- Why Trail
- 갈등 생성과 선택적 Trade-off Reflection
- 잠금화면 공개 승인 / activeAnchor / 스타일 편집 / 의미 재확인 분리
- Review와 장기 미사용 후 복귀
- 검색, revision 비교, 특정 시점 보기
- 수정, 종료, merge, hard delete
- 앱 잠금, 백업, 복원, export

### 화면 상태

empty, loading, error, privacy, lifecycle 상태를 정의했다.

특히 다음을 불변조건으로 둔다.

- 미분류와 미연결은 오류가 아니다.
- 인증 전 private content를 렌더링하지 않는다.
- Review와 복귀는 backlog를 만들지 않는다.
- Widget 갱신은 즉시 완료를 보장한다고 표현하지 않는다.
- destructive operation은 결과 범위를 명확히 보여준다.

## 5. Phase 1 구현 상태

완료:

- React Native 0.87.0 Community CLI 프로젝트 초기화
- iOS / Android 네이티브 골격
- TypeScript domain package 시작
- `DomainRuleViolation`
- MeaningNode / relation / causal / projection / Review 핵심 타입
- `unclassified → typed` 분류 전이 검증
- causal provenance cycle 검증
- semantic relation 적격성 및 self-edge 검증
- symmetric `conflicts_with` canonical pair
- node merge canonical resolve 및 merge cycle 검증
- Projection 승인 상태 계산과 active 적격성 검증
- resurfacing 제외 및 snooze 적격성 검증
- 단위 테스트
- typecheck script
- GitHub Actions CI

진행 중:

- CI 안정화
- dependency lockfile 고정

이어지는 작업:

1. 로컬 DB 라이브러리 기술 검토 및 확정
2. migration 기반 작성
3. repository/service transaction 경계 구현
4. CaptureEntry revision 저장 구현
5. 빠른 기록 홈 UI와 실제 persistence 연결
6. iOS private file protection 검증

## 6. 아직 사용자에게 남아 있는 결정

### 앱 표시 이름

아직 미정이다.

- 한국어 이름과 영어 이름을 함께 검토한다.
- 앱 아이콘, 온보딩, App Store 메타데이터 확정 전까지 결정하면 된다.
- 현재 구현에는 영향을 주지 않는다.

그 외 현재 구현을 막는 사용자 결정은 없다.

## 7. 비차단 구현 결정

해당 구현 단계에서 최신 상태를 확인해 기술적으로 확정한다.

- React Native 로컬 SQLite 라이브러리
- 암호화 백업 cipher/KDF 및 구현 라이브러리
- Widget / wallpaper 문장 UX 길이 제한
- 전체 Meaning Map 렌더링 라이브러리
- 검색 인덱스 구현 방식
- App Intents 입력 범위
- human-readable export의 PDF 지원 시점
- 멀티디바이스 동기화 기술 및 저장소

앱 이름은 브랜딩 작업 전까지 보류한다.
