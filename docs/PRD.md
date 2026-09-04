# Future Self PRD v1.1

- 상태: 구현 기준선 확정
- 최근 갱신: 2026-09-04
- 저장소: `Jiyeong-kor/future-self-lockscreen`
- 1차 플랫폼: iOS
- 클라이언트: React Native Community CLI + TypeScript
- 네이티브 확장: Swift/WidgetKit, 후속 Android Kotlin 모듈

## 0. 문서 권위

이 문서는 제품 요구사항의 단일 기준 문서이다.

구현 시 규칙의 권위는 다음 순서로 둔다.

1. `docs/PRD.md`
2. `docs/DOMAIN_SCHEMA.md`
3. `docs/DATA_LIFECYCLE_SECURITY.md`

기존 설계 문서와 레드팀 문서는 설계 과정과 의사결정의 근거를 보존하는 참고 자료이다. 위 세 기준 문서와 충돌하면 기준 문서를 따른다.

이 제품은 축소형 MVP를 목표로 하지 않는다. 처음부터 수년간 데이터가 누적되어도 의미와 이력을 잃지 않는 제품 구조를 설계한다. 구현은 기능 축소가 아니라 의존성, 데이터 무결성, 보안과 사용성 검증 순서에 따라 단계적으로 진행한다.

---

## 1. 제품 정의

Future Self는 사용자가 평소의 생각, 경험, 후회, 잘한 선택, 새롭게 생긴 욕망과 깨달음을 기록하고, 시간이 지난 뒤 서로 연결하거나 종합하여 자신의 목표와 행동이 왜 중요한지 이해하도록 돕는 개인 의미 관리 앱이다.

사용자가 행동의 의미를 잊었을 때에는 최초의 기록과 이후의 의미 변화를 다시 추적할 수 있어야 한다. 사용자가 계속 기억하고 싶은 행동 원칙은 사용자가 직접 승인한 공개용 문장으로 변환하여 잠금화면에서 반복적으로 볼 수 있게 한다.

잠금화면은 제품 전체가 아니라 의미 그래프에서 선택된 원칙을 일상에 투영하는 출력 지점이다.

Future Self의 핵심 역할은 `무엇을 해야 하는가`를 관리하는 것이 아니라 `나는 무엇을 왜 중요하게 생각하는가`와 `그 이유가 시간이 지나 어떻게 변했는가`를 보존하고 다시 꺼내보게 하는 것이다.

## 2. 제품이 해결하는 문제

사람의 목표와 행동은 하나의 이유로 설명되지 않는다.

하나의 재정 목표는 안정적인 생활, 선택권, 비교 심리, 미래 계획 등 여러 동기와 동시에 연결될 수 있다. 하나의 미래상도 건강 관리, 생활 역량, 재정 관리 등 여러 목표로 이어질 수 있다.

또한 다음 문제가 발생한다.

- 중요한 생각을 기록했지만 시간이 지나 다시 보지 않는다.
- 처음에는 이유가 명확하지 않았던 기록들이 나중에 함께 보았을 때 하나의 패턴으로 보일 수 있다.
- 목표를 오래 수행하다 보면 처음 왜 시작했는지 잊는다.
- 과거의 이유가 더 이상 현재의 가치관과 맞지 않을 수 있다.
- 과거에 잘했던 선택과 유지해야 할 방식은 후회 중심 회고에서 빠지기 쉽다.
- 기록이 수년간 쌓이면 과거 생각을 다시 찾기 어렵다.
- 과거 문장을 수정하면 당시 어떤 생각을 근거로 결론을 내렸는지가 사라질 수 있다.
- 잠금화면처럼 반복적으로 보는 곳에 개인적인 원문을 그대로 노출하면 프라이버시 문제가 생긴다.
- 생각을 정리하는 행위 자체가 새로운 부담이 되면 실제 행동을 돕는다는 목적을 잃을 수 있다.

Future Self는 현재 목표 목록만 저장하지 않는다. 사용자가 어떤 기록에서 어떤 해석을 거쳐 어떤 목표와 원칙에 도달했는지의 시간적 경로를 보존한다.

---

## 3. 핵심 제품 원칙

### 3.1 기록할 때 결론을 요구하지 않는다

사용자는 한 문장만 기록하고 끝낼 수 있다. 분류, 연결, 목표화, 행동화는 모두 선택 사항이다.

### 3.2 후회만 기록하지 않는다

회고는 다음을 동일하게 중요하게 다룬다.

- 바꾸고 싶은 것
- 유지하고 싶은 것
- 새롭게 원하는 것
- 새롭게 발견한 것
- 방향을 바꾼 사건
- 새롭게 얻은 통찰

### 3.3 하나의 행동에는 여러 이유가 있을 수 있다

Goal, Practice, Commitment는 여러 Motive와 연결될 수 있다. 하나의 Motive와 Vision 역시 여러 Goal과 연결될 수 있다.

### 3.4 의미는 변할 수 있다

현재의 판단이 과거의 판단을 덮어쓰지 않는다. 과거에 어떤 이유가 중요했는지와 현재 그 이유를 어떻게 생각하는지를 구분한다.

### 3.5 원문과 출처는 시점까지 보존한다

기록을 나중에 수정하더라도 과거 인사이트가 어떤 문장을 근거로 만들어졌는지는 바뀌면 안 된다. 모든 출처 연결은 당시의 불변 revision 또는 event를 가리킨다.

### 3.6 모든 인사이트를 행동으로 강제하지 않는다

SynthesisInsight는 기록으로만 남아도 된다. 사용자가 필요하다고 판단한 경우에만 Motive, Vision, Goal, Practice, Commitment로 연결한다.

### 3.7 정리는 목적이 아니다

그래프를 예쁘게 만들거나 모든 기록을 분류하는 것이 제품의 성공 조건이 아니다. 미분류 기록, 고립된 노드, 아직 행동으로 연결되지 않은 생각은 정상 상태이다.

### 3.8 잠금화면은 명시적으로 공개 승인된 문장만 사용한다

민감한 내부 Why Graph 원문은 잠금화면으로 자동 복사하지 않는다.

### 3.9 종료는 실패가 아니다

목표와 동기를 종료하는 이유에는 달성, 가치관 변화, 상황 변화, 대체, 보류 등이 있을 수 있다. 종료 이유를 이력으로 보존한다.

### 3.10 검색과 재발견은 기록만큼 중요하다

장기적으로 쌓인 데이터를 다시 찾고 이해할 수 없다면 기록의 가치도 떨어진다. 검색, 필터, 과거 시점 탐색을 장기 사용의 핵심 기능으로 본다.

### 3.11 실행 관리 앱으로 확장하지 않는다

Future Self는 습관 체크, 연속 기록, 일일 완료율, 할 일 목록을 핵심 기능으로 만들지 않는다. Practice는 의미 그래프의 일부로 저장할 수 있지만 실제 일정과 반복 실행 관리는 필요할 때 외부 실행 도구와 연결한다.

---

## 4. 핵심 도메인

정확한 필드와 무결성 규칙은 `DOMAIN_SCHEMA.md`를 따른다.

### 4.1 CaptureEntry

평소 한 문장으로 빠르게 남기는 가장 낮은 마찰의 기록이다.

### 4.2 ReflectionSession / ReflectionItem

특정 기간을 돌아보는 회고와 회고 안의 개별 기록이다.

ReflectionItem 종류:

- `regret`
- `win`
- `desire`
- `discovery`
- `turning_point`
- `insight`

### 4.3 SynthesisInsight

여러 기록이나 기존 인사이트를 함께 보면서 나중에 새롭게 발견한 해석이다.

```text
기록 A
기록 B
기록 C
→ 같이 보기
→ 새롭게 발견한 공통 인사이트
```

### 4.4 MeaningNode

사용자의 현재 의미 구조를 이루는 안정적인 식별자이다.

- `motive`: 왜 중요한가
- `vision`: 어떤 삶이나 사람이 되고 싶은가
- `goal`: 어떤 결과를 만들고 싶은가
- `practice`: 반복해서 무엇을 할 것인가
- `commitment`: 어떤 기준으로 행동할 것인가

### 4.5 MeaningRelation

MeaningNode 사이의 다대다 관계이다.

- `motivated_by`
- `contributes_to`
- `serves`
- `supports`
- `conflicts_with`
- `supersedes`

출처 관계는 MeaningRelation에 넣지 않고 Provenance로 분리한다.

### 4.6 Provenance

현재 의미가 어떤 과거 기록 또는 인사이트에서 나왔는지를 보존한다. Provenance는 단순 객체 ID가 아니라 당시의 불변 revision 또는 event를 가리킨다.

### 4.7 OriginMoment

목표, 동기, 미래상, 실천, 원칙 또는 관계가 처음 형성된 시점의 스냅샷이다.

### 4.8 MeaningCheckIn

사용자가 나중에 노드 또는 특정 관계의 의미를 다시 평가한 사건이다.

- `reaffirmed`
- `reframed`
- `weakened`
- `retired`
- `uncertain`

### 4.9 Why Trail

현재 행동에서 시작해 이유, 미래상, 최초 기록, 이후 의미 변화까지 거슬러 올라가는 읽기 화면이다.

### 4.10 LockscreenProjection

내부 Commitment와 잠금화면 공개 문장을 분리하는 투영 모델이다. Projection은 특정 Commitment revision을 기준으로 만들어지고 사용자가 명시적으로 승인한다.

---

## 5. 기본 사용자 경험

### 5.1 홈

앱의 기본 진입점은 빠른 기록 중심 홈이다.

1. 현재 대표 잠금화면 문장
2. 한 줄 빠른 기록
3. 최근 기록
4. 다시 볼 필요가 있는 원칙 최대 소수
5. 회고 진입점

홈을 미처리 작업 대시보드처럼 만들지 않는다.

### 5.2 빠른 기록

사용자는 내용 한 줄만으로 CaptureEntry를 저장할 수 있다.

저장 직후 다음을 강제하지 않는다.

- 태그
- 종류 분류
- 목표 연결
- 행동 계획
- 잠금화면 문장

### 5.3 회고

회고는 연말에만 사용하는 기능이 아니다. 사용자는 연도, 프로젝트 기간, 특정 시기 등 자유 범위로 회고 세션을 만들 수 있다.

질문 영역:

- 바꾸고 싶은 것
- 유지하고 싶은 것
- 새롭게 알게 된 것
- 새롭게 원하는 것
- 방향이 바뀐 계기
- 지금도 유효한 깨달음

모든 질문에 답할 필요는 없다.

### 5.4 기록 모아보기와 Synthesis

사용자는 CaptureEntry, ReflectionItem, 기존 SynthesisInsight 등을 여러 개 선택해 `같이 보기` 작업 공간으로 보낼 수 있다.

앱은 다음 질문을 제공한다.

- 이 기록들을 같이 보니 어떤 공통점이 보이는가
- 이전에는 따로 보였지만 지금은 무엇으로 연결되어 보이는가
- 이 생각이 앞으로의 선택에 영향을 줄 필요가 있는가

저장된 답은 SynthesisInsight가 된다.

### 5.5 의미 연결

사용자는 기록 또는 인사이트에서 Motive, Vision, Goal, Practice, Commitment를 만들거나 기존 항목에 연결할 수 있다.

모든 연결은 탭 기반 흐름으로 만들 수 있어야 한다.

### 5.6 블록 기반 연결

Drag and Drop은 스크래치의 스냅 개념을 차용하지만 시각 디자인은 성인용 개인 기록 제품으로 유지한다.

휴대전화에서는 현재 선택한 블록을 중심으로 연결 슬롯을 보여주는 Focus Board를 기본으로 한다.

- `왜?`
- `어떤 미래를 위해?`
- `무엇을 위해?`
- `어디서 시작됐지?`

유효하지 않은 타입은 스냅되지 않는다. Drag and Drop은 편의 기능이며 유일한 입력 방식이 아니다.

### 5.7 Why Trail

Goal, Practice, Commitment는 `왜 시작했지?` 진입점을 제공한다.

표시 내용:

- 현재 항목
- 연결된 이유
- 연결된 미래상
- 관련 목표와 실천
- 최초 기록
- 해당 시점의 원문 revision
- 이후 MeaningCheckIn
- 종료 또는 재해석 이력

---

## 6. 검색과 재발견

### 6.1 통합 검색

사용자는 다음 데이터의 현재 표현을 한 검색창에서 찾을 수 있어야 한다.

- CaptureEntry
- ReflectionItem
- SynthesisInsight
- Motive
- Vision
- Goal
- Practice
- Commitment

기본 검색은 최신 revision을 대상으로 한다.

### 6.2 검색 필터

최소 다음 필터를 지원한다.

- 기간
- 객체 종류
- 태그
- 현재 상태
- 연결 여부
- 회고 세션
- 종료된 항목
- 아직 의미 그래프에 연결되지 않은 기록

### 6.3 이력 검색

사용자가 명시적으로 `과거 표현까지 검색`을 켠 경우 revision history도 검색할 수 있다.

검색 결과는 현재 표현과 과거 revision을 시각적으로 구분한다.

### 6.4 검색 인덱스 프라이버시

검색 인덱스는 Private Store의 일부로 취급한다. 개인 원문을 iOS Spotlight나 외부 시스템 검색 인덱스에 자동 공개하지 않는다.

---

## 7. 시간 여행과 의미 변화 탐색

revision과 lifecycle event를 단순 무결성 장치로만 사용하지 않는다. 사용자가 자신의 과거 상태를 이해할 수 있는 제품 기능으로 제공한다.

### 7.1 특정 시점 보기

지원 대상 객체에서는 사용자가 특정 날짜 또는 revision 시점의 표현과 연결 상태를 볼 수 있어야 한다.

예시 질문:

- 이 목표를 처음 만들었을 때 나는 무엇이라고 적었는가
- 이 동기를 그만두기 전에는 무엇과 연결되어 있었는가
- 특정 시점에는 어떤 이유를 중요하게 생각했는가

### 7.2 현재와 과거 비교

현재 revision과 선택한 과거 revision을 나란히 비교할 수 있다.

### 7.3 삭제 한계

사용자가 hard delete한 데이터는 시간 여행을 위해 별도로 보존하지 않는다. 삭제 요청은 역사 보존보다 우선한다.

---

## 8. 대표 잠금화면 문장 규칙

### 8.1 activeAnchor는 자동으로 바꾸지 않는다

대표 잠금화면 문장 `activeAnchor`는 사용자가 명시적으로 선택할 때만 바뀐다.

다음 행동은 대표 문장을 자동으로 바꾸지 않는다.

- 새 Commitment 생성
- Review 확인
- Commitment 수정
- 새 Synthesis 생성
- 우선순위 변경
- FocusWindow 진입

사용자가 `대표 문장으로 설정`을 선택해야만 activeAnchor가 변경된다.

### 8.2 잠금화면 승인

Projection은 다음 조건을 만족해야 잠금화면 후보가 된다.

- 특정 Commitment revision을 기준으로 생성됨
- 사용자가 공개 문장을 직접 확인함
- 승인 event가 존재함

Commitment나 공개 문구가 수정되면 새 Projection revision을 만든다. 새 revision은 자동 승인되지 않는다.

### 8.3 출력별 문장

- 내부 Commitment 본문
- `publicSafeMessage`
- `widgetMessage`
- `wallpaperMessage`

동일 문장을 재사용할 수 있지만 저장 구조는 분리한다.

---

## 9. Review Resurfacing

한 문장만 잠금화면에 표시하기 때문에 다른 중요한 원칙이 장기간 가려질 수 있다. 앱 내부에서 다시 볼 후보를 계산한다.

### 9.1 미처리함으로 만들지 않는다

- 홈에는 한 번에 최대 3개만 보여준다.
- 전체 미확인 개수 배지를 강조하지 않는다.
- `당분간 묻지 않기`를 지원한다.
- 확인하지 않아도 실패로 기록하지 않는다.

### 9.2 왜 지금 보여주는지 설명한다

Review 카드에는 재노출 이유를 짧게 표시한다.

예시:

- 오랫동안 다시 확인하지 않은 중요한 원칙
- 최근 연결된 이유가 수정된 원칙
- 사용자가 지정한 재검토 시점이 된 원칙

Review 알고리즘이 이유를 설명할 수 없는 경우 해당 사유로 자동 노출하지 않는다.

### 9.3 Review 동작

- 여전히 중요함
- 지금의 말로 다시 쓰기
- 이유가 달라짐
- 당분간 묻지 않기
- 종료

Review 결과가 activeAnchor를 자동 변경하지 않는다.

---

## 10. 관계, 수정, 인과 무결성

### 10.1 다대다와 충돌

하나의 Goal, Practice, Commitment는 여러 Motive와 연결될 수 있다. 상충하는 욕망이나 목표는 `conflicts_with` 관계로 동시에 보존할 수 있다.

앱은 자동으로 어느 쪽이 옳다고 판단하지 않는다.

### 10.2 관계 의미 변화

특정 노드 전체가 아니라 하나의 관계만 약해지거나 재해석될 수 있다. MeaningCheckIn은 노드와 관계를 모두 대상으로 한다.

### 10.3 수정은 새 revision이다

화면에서는 기존 항목을 편집하는 것처럼 보이지만 저장소에서는 기존 원문을 덮어쓰지 않는다.

- 객체의 stable ID 유지
- 새 revision 생성
- 화면에는 최신 revision 표시
- 과거 Provenance는 당시 revision 유지

### 10.4 causal provenance graph

모든 `근거 → 새 해석 또는 의미 revision` 관계를 하나의 causal provenance graph로 보고 순환을 금지한다.

의미 관계인 `supports`, `conflicts_with`는 causal graph와 분리한다.

---

## 11. 중복, 병합, 종료, 삭제

### 11.1 중복과 병합

장기간 사용하면 같은 의미의 노드가 여러 개 생기는 것을 정상 상황으로 본다.

- source node는 merged 상태
- canonical target 유지
- 과거 relation endpoint와 OriginMoment는 재작성하지 않음
- 현재 조회와 새 연결만 canonical node로 resolve
- merge cycle 금지

### 11.2 종료

종료는 삭제가 아니다.

- `achieved`
- `no_longer_wanted`
- `values_changed`
- `superseded`
- `deferred`
- `context_changed`
- `other`

종료 당시의 메모를 남길 수 있다.

### 11.3 완전 삭제

사용자가 명시적으로 hard delete하면 역사 보존보다 삭제 요청을 우선한다. 세부 트랜잭션 규칙은 `DATA_LIFECYCLE_SECURITY.md`를 따른다.

---

## 12. 온보딩과 Progressive Disclosure

### 12.1 첫 사용에서 그래프 개념을 교육하지 않는다

첫 화면에서 Motive, Vision, Provenance, Synthesis 등의 용어를 설명하지 않는다.

첫 사용자가 이해해야 하는 것은 다음 두 가지뿐이다.

1. 생각을 한 줄로 적을 수 있다.
2. 계속 기억하고 싶은 문장은 잠금화면에 둘 수 있다.

### 12.2 기능은 데이터가 쌓일 때 발견하게 한다

- 기록이 하나뿐이면 연결을 요구하지 않는다.
- 관련 기록이 여러 개 생기면 `같이 보기`를 소개할 수 있다.
- 의미 노드가 생기면 `왜 시작했지?`를 소개할 수 있다.
- 연결이 늘어나면 Focus Board를 소개한다.
- 과거 revision이 생기면 시간 여행 기능을 소개한다.

### 12.3 언제든 건너뛸 수 있다

교육 카드, 분류, 연결 제안은 건너뛸 수 있어야 한다.

---

## 13. 앱 잠금과 개인 화면 보호

사용자는 앱 자체에 선택적 잠금을 켤 수 있다.

### 13.1 인증 방식

1차 iOS 구현은 `LocalAuthentication`을 이용하여 Face ID, Touch ID 또는 시스템이 제공하는 기기 인증 정책을 사용한다.

앱은 생체 정보 자체에 접근하거나 저장하지 않는다.

### 13.2 잠금 정책

사용자 설정으로 다음을 지원할 수 있다.

- 앱을 다시 열 때마다 인증
- 백그라운드 전환 후 일정 시간이 지나면 인증
- 앱 잠금 사용 안 함

잠금이 켜져 있어도 이미 사용자가 공개 승인한 잠금화면 Projection은 Widget에서 계속 표시될 수 있다. Private Store와 public-safe Projection의 경계를 유지한다.

### 13.3 실패 처리

인증 실패나 취소로 개인 원문 화면이 잠깐이라도 노출되어서는 안 된다.

---

## 14. iOS WidgetKit 계약

### 14.1 Widget 설치

앱은 잠금화면 위젯을 자동 설치할 수 있다고 가정하지 않는다. 사용자가 iOS 잠금화면 사용자화 흐름에서 위젯을 추가하도록 안내한다.

### 14.2 공유 데이터

App Group에는 승인된 Projection의 최소 데이터만 둔다.

- projection revision ID
- public-safe widget message
- 표시 설정
- generation
- updatedAt

### 14.3 업데이트는 eventual consistency이다

Projection 변경 후 App Group을 갱신하고 `WidgetCenter`에 reload를 요청한다. 앱은 실제 위젯 반영 완료를 보장하지 않는다.

### 14.4 시간 기반 자동 anchor 변경 금지

1차 제품에서는 FocusWindow 또는 날짜 경계가 activeAnchor를 자동 변경하지 않는다.

---

## 15. 잠금화면 이미지

사용자는 승인된 Projection을 기반으로 단색 또는 사진 배경의 잠금화면 이미지를 생성할 수 있다.

iOS에서는 생성 이미지를 사진 보관함에 저장하고 사용자가 시스템 배경화면 설정 흐름에서 적용한다.

사진 보관함에 저장된 이미지는 사용자의 사진 동기화 정책의 영향을 받을 수 있음을 안내한다.

---

## 16. 데이터 보안과 프라이버시

정확한 저장, 삭제, 백업 정책은 `DATA_LIFECYCLE_SECURITY.md`를 따른다.

핵심 원칙:

- 서버 전송 없음
- 광고 SDK 없음
- 행동 분석 SDK 없음
- 사용자 원문 로그 금지
- 개인 원문 DB와 Widget 공유 데이터 분리
- 사용자 원문 파일에 iOS 강한 Data Protection 적용
- App Switcher privacy cover
- 선택적 앱 잠금
- 잠금화면에는 명시적으로 승인한 문장만 사용
- 자동 클라우드 백업 제외
- 수동 백업은 암호화 컨테이너 사용
- 검색 인덱스도 Private Content로 취급

현재 저장소는 Public이므로 실제 개인 데이터, 실제 export, 실제 SQLite DB, 개인 원문 fixture, 개인 텍스트가 보이는 스크린샷을 커밋하지 않는다.

---

## 17. 백업, 복원, 데이터 이동권

### 17.1 암호화 백업

장기 사용 데이터를 보호하기 위해 수동 암호화 백업과 복원을 제공한다.

복원은 임시 저장소에서 migration과 전체 무결성 검증이 성공한 경우에만 현재 DB를 원자적으로 교체한다.

### 17.2 사람이 읽을 수 있는 내보내기

암호화 백업과 별도로 사용자가 자신의 데이터를 앱 밖에서 읽을 수 있는 선택적 내보내기를 제공한다.

사용자는 범위를 직접 선택한다.

- 특정 회고 세션
- 특정 Why Trail
- 특정 Goal 또는 Commitment와 연결된 기록
- 선택한 기간의 기록

초기 human-readable 포맷은 Markdown을 기본 후보로 둔다. PDF는 후속 표현 포맷으로 추가할 수 있다.

### 17.3 내보내기 보안

human-readable export는 평문일 수 있으므로 생성 전에 다음을 명확히 안내한다.

- 파일을 받은 앱이나 저장 위치에서는 Future Self의 Private Store 보호가 적용되지 않는다.
- 앱 잠금이 켜진 경우 export 전에 재인증을 요구한다.
- export 완료 후 app-private 임시 평문 파일을 정리한다.

암호화 백업과 사람이 읽는 export를 같은 기능으로 취급하지 않는다.

---

## 18. 앱 밖 빠른 기록

빠른 기록의 마찰을 줄이기 위해 iOS App Intents / App Shortcuts 기반 진입점을 후속 플랫폼 통합으로 제공한다.

지원 후보:

- Shortcuts
- Siri
- Spotlight의 앱 액션
- 지원 기기의 Action Button

### 18.1 시스템에 공개하는 것은 액션이다

기본 정책은 개인 기록 원문이나 Why Graph 엔티티를 Spotlight에 인덱싱하는 것이 아니라 `Future Self에 기록하기`, `빠른 기록 열기` 같은 액션을 노출하는 것이다.

### 18.2 실행 전후 프라이버시

앱 밖에서 원문을 입력받는 App Intent를 추가할 경우 OS 표면에 내용이 남을 수 있는 범위를 별도로 검토한다. 민감 원문의 시스템 노출이 불분명한 경우 해당 Intent는 앱의 입력 화면을 여는 방식으로 제한한다.

---

## 19. 외부 실행 도구와의 경계

Future Self는 할 일 앱이나 습관 추적 앱을 대체하지 않는다.

Practice 또는 Goal에 실제 실행 일정이 필요하면 사용자가 명시적으로 선택한 경우 외부 실행 도구와 연결할 수 있다.

후속 통합 후보:

- Apple Reminders
- Apple Calendar
- Shortcuts

원칙:

- Future Self는 의미와 이유의 소스 오브 트루스이다.
- 완료 체크, 반복 일정, 알림 실행은 외부 도구가 담당할 수 있다.
- 외부 도구의 완료 여부를 Future Self의 가치 판단 점수로 자동 변환하지 않는다.
- 외부 전송 전에 사용자가 어떤 텍스트가 전달되는지 확인한다.

---

## 20. 알림 정책

알림은 사용자가 직접 켜는 선택 기능이다.

허용 목적:

- 사용자가 지정한 회고 시점
- 사용자가 지정한 의미 재검토 시점
- 암호화 백업이 오래되지 않았음을 알려주는 선택적 보안 리마인더

금지 방향:

- 죄책감 유발
- 실패 횟수 강조
- 미처리 개수 압박
- 앱 사용 빈도를 높이기 위한 무관한 푸시

알림 빈도는 사용자가 제어할 수 있어야 한다.

---

## 21. 접근성

- VoiceOver 레이블
- Dynamic Type 고려
- 색상만으로 의미를 구분하지 않음
- 충분한 터치 영역
- Drag and Drop과 동등한 탭 기반 연결 경로
- 모션 감소 설정 고려
- 햅틱 없이도 연결 성공과 실패를 이해할 수 있는 텍스트 피드백
- 검색, 시간 여행, 앱 잠금도 VoiceOver로 완전 조작 가능해야 함

---

## 22. 장기 데이터 규모와 성능 요구사항

Future Self는 장기 개인 아카이브를 전제로 설계한다.

### 22.1 검증 데이터셋 목표

성능과 migration 테스트에서 최소 다음 규모의 합성 데이터를 다룰 수 있도록 설계한다.

- source record 50,000개 이상
- MeaningNode 10,000개 이상
- MeaningRelation 50,000개 이상
- revision/event 합계 100,000개 이상

이 수치는 사용자에게 노출하는 제한이 아니라 개발 검증 기준이다.

### 22.2 성능 설계 목표

대표적인 최신 지원 기기에서 합성 데이터셋 기준으로 다음을 목표로 한다.

- 한 줄 빠른 기록 저장: 체감상 즉시 완료
- 일반 검색 첫 결과: 500ms 이내 목표
- Why Trail 첫 화면: 700ms 이내 목표
- 홈 진입 시 전체 그래프 메모리 적재 금지
- Meaning Map은 viewport 또는 필요한 서브그래프만 로드

정확한 수치는 실제 구현 벤치마크로 조정할 수 있지만 전체 그래프를 매번 전부 읽는 구조는 허용하지 않는다.

### 22.3 검색 인덱스

검색 인덱스는 재생성 가능한 파생 데이터로 취급한다. 원본 revision과 무결성의 소스 오브 트루스가 되어서는 안 된다.

---

## 23. 구현 단계

단계는 기능 축소를 위한 우선순위가 아니라 의존성과 데이터 안정성을 관리하기 위한 순서이다.

### Phase 1. 기반과 무결성

- React Native 프로젝트 초기화
- iOS 네이티브 타깃 구성
- 로컬 DB 선택과 migration 기반
- canonical domain schema
- revision 모델
- causal cycle validator
- transaction boundary
- 보안 저장소와 로그 정책
- private search index 기반

### Phase 2. 기록, 회고, 검색

- 빠른 기록
- ReflectionSession / ReflectionItem
- revision UI
- 최근 기록
- 통합 검색과 기본 필터
- Progressive Disclosure 온보딩 기반

### Phase 3. 의미 그래프와 시간 여행

- MeaningNode
- MeaningRelation
- Provenance
- OriginMoment
- MeaningCheckIn
- 종료와 병합 기반
- Why Trail
- revision 비교
- 특정 시점 보기

### Phase 4. 종합

- 여러 기록 선택
- SynthesisInsight
- SynthesisSource
- causal graph 검증
- Synthesis에서 MeaningNode 생성 및 연결

### Phase 5. 연결 UX

- 탭 기반 연결
- Focus Board
- Block Tray
- Drag and Drop 스냅
- Undo
- 접근성 대체 동작

### Phase 6. 잠금화면 출력

- Commitment Projection
- 승인 revision
- activeAnchor 수동 설정
- App Group 최소 projection
- WidgetKit
- 이미지 생성
- 사진 저장

### Phase 7. 장기 사용과 보안 UX

- Review resurfacing 및 설명 가능성
- 선택적 앱 잠금
- 중복 병합 UI
- 암호화 백업과 복원
- human-readable export
- FocusWindow
- 전체 Meaning Map

### Phase 8. iOS 시스템 통합

- App Intents / App Shortcuts 빠른 기록
- Action Button / Siri / Shortcuts 진입점 검증
- Reminders / Calendar 연동 검토
- 민감 데이터의 시스템 표면 노출 검토

### Phase 9. Android

- 공통 도메인 검증 후 Android 지원
- Kotlin 네이티브 모듈
- 잠금화면 이미지 직접 적용 가능성 및 기기별 예외 처리

### Phase 10. 공개 배포 준비

공개 배포를 결정한 경우에만 진행한다.

- 개인정보 처리방침
- App Store 개인정보 고지 검토
- 접근성 실기기 검증
- export와 삭제 동작 검증
- 샘플 데이터 완전 가상화
- 스토어 스크린샷에 개인 데이터 없음 확인

---

## 24. 테스트 요구사항

### 24.1 revision / provenance

- 기록 수정 후 과거 Synthesis가 기존 revision을 계속 가리키는지
- Why Trail에서 현재 revision과 과거 revision이 구분되는지
- 특정 시점 보기가 lifecycle과 relation validity를 올바르게 재구성하는지

### 24.2 causal cycle

- 직접 순환 거부
- Synthesis와 MeaningNode를 여러 단계 거치는 간접 순환 거부
- 정상 DAG 연결 허용

### 24.3 검색

- 최신 revision 기본 검색
- 과거 revision 검색 opt-in
- 태그, 기간, 상태, 종류 필터
- hard delete 후 검색 인덱스에서 제거
- search index 재생성

### 24.4 관계와 병합

- directed relation 방향성
- symmetric relation 중복 방지
- 관계 종료 후 과거 조회
- relation 대상 MeaningCheckIn
- canonical resolve
- 병합 순환 거부
- 병합 후 과거 관계 보존

### 24.5 삭제와 복원

- 객체별 hard delete transaction
- 관련 projection 제거
- activeAnchor 안전한 해제
- 삭제된 revision을 가리키는 provenance 제거
- 잘못된 암호 또는 손상 백업 실패
- schema migration 실패 시 기존 DB 유지
- 정상 복원 후 전체 관계 무결성

### 24.6 Widget

- 승인되지 않은 Projection 미노출
- 새 Projection revision 재승인 필요
- activeAnchor 수동 변경
- shared projection generation 증가
- reload 요청 이후 eventual update 안내
- 긴 widgetMessage 처리

### 24.7 프라이버시와 앱 잠금

- 로그에 원문 없음
- App Group에 민감 원문 없음
- 앱 전환기 privacy cover
- 잠금 상태에서 Private Store 접근 실패 안전 처리
- 앱 잠금 활성화 후 인증 전 개인 화면 미노출
- 인증 취소와 실패 처리
- export 재인증 및 임시 평문 정리

### 24.8 접근성과 DnD

- Drag and Drop 없이 모든 관계 생성 가능
- VoiceOver에서 검색, Why Trail, Review, 시간 여행, 잠금 설정 사용 가능
- Reduce Motion 환경에서 핵심 상태 전달

### 24.9 장기 데이터

- 대규모 합성 DB migration
- 검색 성능
- Why Trail 지연 로딩
- 전체 그래프를 메모리에 적재하지 않는지 확인

---

## 25. 완료 기준

제품을 제대로 구현했다고 판단하려면 다음이 모두 가능해야 한다.

- 사용자가 한 문장 기록부터 장기 회고까지 자유롭게 기록할 수 있다.
- 기록 당시 결론을 내리지 않아도 된다.
- 여러 기록을 나중에 종합하여 새 인사이트를 만들 수 있다.
- 하나의 목표나 행동에 여러 이유를 연결할 수 있다.
- 과거 원문과 현재 표현을 모두 복원할 수 있다.
- 특정 시점의 의미와 연결 상태를 다시 볼 수 있다.
- 오래된 기록을 검색과 필터로 다시 찾을 수 있다.
- 의미가 변한 시점을 노드 또는 관계 단위로 기록할 수 있다.
- causal provenance에 순환이 생기지 않는다.
- 중복 의미를 병합해도 과거 역사가 보존된다.
- 목표를 종료한 이유를 다시 확인할 수 있다.
- 잠금화면에는 승인한 공개용 문장만 표시된다.
- 내부 원칙 수정이 승인하지 않은 잠금화면 변경으로 이어지지 않는다.
- 사용자가 직접 대표 문장을 선택한다.
- Review에서 왜 다시 보여주는지 이해할 수 있다.
- 사용자가 원하면 앱 자체를 시스템 인증으로 잠글 수 있다.
- 장기 데이터를 암호화하여 백업하고 안전하게 복원할 수 있다.
- 선택한 데이터를 사람이 읽을 수 있는 형태로 내보낼 수 있다.
- 개인 원문이 외부 시스템 검색이나 Public Git 저장소에 자동 노출되지 않는다.
- Future Self가 할 일/습관 관리 앱으로 변하지 않고 의미와 이유의 소스 오브 트루스로 유지된다.

## 26. 비차단 구현 결정

다음 항목은 제품 구조를 바꾸지 않으므로 해당 구현 단계에서 최신 상태를 확인해 확정한다.

- 실제 앱 표시 이름
- React Native용 로컬 SQLite 라이브러리
- 암호화 백업의 구체 알고리즘 및 키 파생 라이브러리
- widgetMessage / wallpaperMessage의 UX 길이 제한값
- 전체 Meaning Map의 그래프 렌더링 라이브러리
- 검색 인덱스 구현 라이브러리
- App Intents에서 허용할 입력 범위
- human-readable export의 PDF 지원 시점

이 결정들은 canonical schema, 프라이버시 경계, 데이터 이력 규칙을 위반해서는 안 된다.
