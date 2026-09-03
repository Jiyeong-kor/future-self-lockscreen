# Future Self PRD v1.0

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

`WHY_GRAPH.md`, `REFLECTION_MODEL.md`, `SYNTHESIS_MODEL.md`, `BLOCK_CANVAS.md`, `PRODUCT_RULES_V04.md`, 레드팀 문서는 설계 과정과 의사결정의 근거를 보존하는 참고 문서이다. 위 세 기준 문서와 충돌하면 기준 문서를 따른다.

이 제품은 핵심 가설만 빠르게 검증하기 위한 축소형 MVP를 목표로 하지 않는다. 처음부터 수년간 데이터가 누적되어도 의미와 이력을 잃지 않는 제품 구조를 설계한다. 다만 구현은 의존성 순서에 따라 단계적으로 진행한다.

---

## 1. 제품 정의

Future Self는 사용자가 평소의 생각, 경험, 후회, 잘한 선택, 새롭게 생긴 욕망과 깨달음을 기록하고, 시간이 지난 뒤 서로 연결하거나 종합하여 자신의 목표와 행동이 왜 중요한지 이해하도록 돕는 개인 의미 관리 앱이다.

사용자가 행동의 의미를 잊었을 때에는 최초의 기록과 이후의 의미 변화를 다시 추적할 수 있어야 한다. 사용자가 계속 기억하고 싶은 행동 원칙은 사용자가 직접 승인한 공개용 문장으로 변환하여 잠금화면에서 반복적으로 볼 수 있게 한다.

잠금화면은 제품 전체가 아니라 의미 그래프에서 선택된 원칙을 일상에 투영하는 출력 지점이다.

## 2. 제품이 해결하는 문제

사람의 목표와 행동은 하나의 이유로 설명되지 않는다.

예를 들어 하나의 재정 목표는 안정적인 생활, 선택권, 비교 심리, 미래 계획 등 여러 동기와 동시에 연결될 수 있다. 하나의 미래상도 건강 관리, 생활 역량, 재정 관리 등 여러 목표로 이어질 수 있다.

또한 다음 문제가 발생한다.

- 중요한 생각을 기록했지만 시간이 지나 다시 보지 않는다.
- 처음에는 이유가 명확하지 않았던 기록들이 나중에 함께 보았을 때 하나의 패턴으로 보일 수 있다.
- 목표를 오래 수행하다 보면 처음 왜 시작했는지 잊는다.
- 과거의 이유가 더 이상 현재의 가치관과 맞지 않을 수 있다.
- 과거에 잘했던 선택과 유지해야 할 방식은 후회 중심 회고에서 빠지기 쉽다.
- 잠금화면처럼 반복적으로 보는 곳에 개인적인 원문을 그대로 노출하면 프라이버시 문제가 생긴다.

Future Self는 현재 목표 목록만 저장하지 않는다. 사용자가 어떤 기록에서 어떤 해석을 거쳐 어떤 목표와 원칙에 도달했는지의 시간적 경로를 보존한다.

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

기록을 나중에 수정하더라도 과거 인사이트가 어떤 문장을 근거로 만들어졌는지는 바뀌면 안 된다. 모든 출처 연결은 당시 revision을 가리킨다.

### 3.6 모든 인사이트를 행동으로 강제하지 않는다

SynthesisInsight는 기록으로만 남아도 된다. 사용자가 필요하다고 판단한 경우에만 Motive, Vision, Goal, Practice, Commitment로 연결한다.

### 3.7 정리는 목적이 아니다

그래프를 예쁘게 만들거나 모든 기록을 분류하는 것이 제품의 성공 조건이 아니다. 기록되지 않은 연결, 미분류 기록, 고립된 노드는 정상 상태이다.

### 3.8 잠금화면은 명시적으로 공개 승인된 문장만 사용한다

민감한 내부 Why Graph 원문은 잠금화면으로 자동 복사하지 않는다.

### 3.9 종료는 실패가 아니다

목표와 동기를 종료하는 이유에는 달성, 가치관 변화, 상황 변화, 대체, 보류 등이 있을 수 있다. 종료 이유를 이력으로 보존한다.

---

## 4. 핵심 도메인

정확한 필드와 무결성 규칙은 `DOMAIN_SCHEMA.md`를 따른다.

### 4.1 CaptureEntry

평소 한 문장으로 빠르게 남기는 가장 낮은 마찰의 기록이다.

### 4.2 ReflectionSession / ReflectionItem

특정 기간을 돌아보는 회고와 회고 안의 개별 기록이다.

ReflectionItem은 다음 종류를 지원한다.

- `regret`
- `win`
- `desire`
- `discovery`
- `turning_point`
- `insight`

### 4.3 SynthesisInsight

여러 기록이나 기존 인사이트를 함께 보면서 나중에 새롭게 발견한 해석이다.

예시 흐름:

```text
기록 A
기록 B
기록 C
→ 함께 보기
→ "나는 당일 의지보다 전날 환경을 준비할 때 실행이 안정된다."
```

### 4.4 MeaningNode

사용자의 현재 의미 구조를 이루는 안정적인 식별자이다.

종류:

- `motive`: 왜 중요한가
- `vision`: 어떤 삶이나 사람이 되고 싶은가
- `goal`: 어떤 결과를 만들고 싶은가
- `practice`: 반복해서 무엇을 할 것인가
- `commitment`: 어떤 기준으로 행동할 것인가

### 4.5 MeaningRelation

MeaningNode 사이의 다대다 관계이다.

대표 관계:

- `motivated_by`
- `contributes_to`
- `serves`
- `supports`
- `conflicts_with`
- `supersedes`

출처 관계는 MeaningRelation에 넣지 않고 Provenance로 분리한다.

### 4.6 Provenance

현재 의미가 어떤 과거 기록 또는 인사이트에서 나왔는지를 보존한다.

Provenance는 단순 객체 ID가 아니라 당시의 불변 revision 또는 불변 event를 가리킨다.

### 4.7 OriginMoment

목표, 동기, 미래상, 실천, 원칙 또는 관계가 처음 형성된 시점의 스냅샷이다.

### 4.8 MeaningCheckIn

사용자가 나중에 노드 또는 특정 관계의 의미를 다시 평가한 사건이다.

상태 예시:

- `reaffirmed`
- `reframed`
- `weakened`
- `retired`
- `uncertain`

### 4.9 Why Trail

현재 행동에서 시작해 이유, 미래상, 최초 기록, 이후 의미 변화까지 거슬러 올라가는 읽기 화면이다.

### 4.10 LockscreenProjection

내부 Commitment와 잠금화면 공개 문장을 분리하는 투영 모델이다.

Projection은 특정 Commitment revision을 기준으로 만들어지고 사용자가 명시적으로 승인한다.

---

## 5. 기본 사용자 경험

### 5.1 홈

앱의 기본 진입점은 빠른 기록 중심 홈이다.

우선순위는 다음과 같다.

1. 현재 대표 잠금화면 문장
2. 한 줄 빠른 기록
3. 최근 기록
4. 다시 볼 필요가 있는 원칙 최대 소수
5. 회고 진입점

홈을 미처리 작업 대시보드처럼 만들지 않는다.

### 5.2 빠른 기록

사용자는 내용 한 줄만으로 CaptureEntry를 저장할 수 있다.

앱은 저장 직후 다음을 강제하지 않는다.

- 태그
- 종류 분류
- 목표 연결
- 행동 계획
- 잠금화면 문장

### 5.3 회고

회고는 연말에만 사용할 수 있는 기능이 아니다. 사용자는 연도, 프로젝트 기간, 특정 시기 등 자유 범위로 회고 세션을 만들 수 있다.

기본 질문 영역:

- 바꾸고 싶은 것
- 유지하고 싶은 것
- 새롭게 알게 된 것
- 새롭게 원하는 것
- 방향이 바뀐 계기
- 지금도 유효한 깨달음

모든 질문에 답할 필요는 없다.

### 5.4 기록 모아보기와 Synthesis

사용자는 CaptureEntry, ReflectionItem, 기존 SynthesisInsight 등을 여러 개 선택해 `같이 보기` 작업 공간으로 보낼 수 있다.

사용자는 다음 질문에 답할 수 있다.

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

연결 슬롯 예시:

- `왜?`
- `어떤 미래를 위해?`
- `무엇을 위해?`
- `어디서 시작됐지?`

유효하지 않은 타입은 스냅되지 않는다.

Drag and Drop은 편의 기능이며 유일한 입력 방식이 아니다. VoiceOver, Switch Control, 키보드 입력을 포함한 접근성 대체 흐름을 제공한다.

### 5.7 Why Trail

모든 Goal, Practice, Commitment는 `왜 시작했지?` 진입점을 제공한다.

Why Trail은 전체 그래프를 한 번에 펼치지 않고 현재 항목을 기준으로 단계적으로 보여준다.

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

## 6. 대표 잠금화면 문장 규칙

### 6.1 activeAnchor는 자동으로 바꾸지 않는다

1차 제품에서 대표 잠금화면 문장 `activeAnchor`는 사용자가 명시적으로 선택할 때만 바뀐다.

다음 행동은 대표 문장을 자동으로 바꾸지 않는다.

- 새 Commitment 생성
- Review Queue 확인
- Commitment 수정
- 새 Synthesis 생성
- 우선순위 변경
- FocusWindow 진입

사용자가 `대표 문장으로 설정`을 선택해야만 activeAnchor가 변경된다.

향후 자동 전환 기능을 검토할 수 있지만, 기본값은 수동이며 자동 전환을 도입하더라도 사전 승인된 Projection만 사용할 수 있다.

### 6.2 잠금화면 승인

내부 Commitment와 공개용 문장은 별도이다.

Projection은 다음 조건을 만족해야 잠금화면 후보가 된다.

- 특정 Commitment revision을 기준으로 생성됨
- 사용자가 공개 문장을 직접 확인함
- `approved` 상태임

Commitment나 Projection 문구가 수정되면 새 Projection revision을 만든다. 새 revision은 기본적으로 미승인 상태이다.

기존에 승인된 과거 Projection은 사용자가 교체하기 전까지 그대로 유지할 수 있다. 따라서 내부 원칙을 수정했다고 해서 잠금화면에 승인하지 않은 새 문장이 노출되지 않는다.

### 6.3 출력별 문장

필요하면 다음을 분리한다.

- 내부 Commitment 본문
- `publicSafeMessage`
- `widgetMessage`
- `wallpaperMessage`

사용자는 동일 문장을 재사용할 수 있지만 저장 구조는 별도로 유지한다.

---

## 7. Review Resurfacing

한 문장만 잠금화면에 표시하기 때문에 다른 중요한 원칙이 장기간 가려질 수 있다.

이를 해결하기 위해 앱 내부에 다시 볼 후보를 계산한다.

### 7.1 미처리함으로 만들지 않는다

Review는 할 일 Inbox가 아니다.

규칙:

- 홈에는 한 번에 최대 3개만 보여준다.
- 전체 미확인 개수 배지를 강조하지 않는다.
- `당분간 묻지 않기`를 지원한다.
- 사용자가 확인하지 않아도 실패로 기록하지 않는다.

### 7.2 Review 동작

사용자는 다음을 선택할 수 있다.

- 여전히 중요함
- 지금의 말로 다시 쓰기
- 이유가 달라짐
- 당분간 묻지 않기
- 종료

Review 결과가 activeAnchor를 자동 변경하지 않는다.

---

## 8. 관계와 충돌

### 8.1 다대다 연결

하나의 Goal, Practice, Commitment는 여러 Motive와 연결될 수 있다.

### 8.2 충돌은 오류가 아니다

상충하는 욕망이나 목표는 `conflicts_with` 관계로 동시에 보존할 수 있다.

예시:

```text
장기 저축을 최대화하고 싶다
↔
현재 경험을 위해 여행에 돈을 쓰고 싶다
```

앱은 자동으로 어느 쪽이 옳다고 판단하지 않는다.

### 8.3 관계 의미의 변화

특정 노드 전체가 아니라 하나의 관계만 약해지거나 재해석될 수 있다. MeaningCheckIn은 노드와 관계를 모두 대상으로 한다.

---

## 9. 수정과 이력

화면에서 사용자는 기록과 의미를 수정할 수 있다. 그러나 저장소에서는 기존 원문을 덮어쓰지 않는다.

규칙:

- 수정은 새 revision 생성이다.
- 객체의 stable ID는 유지한다.
- 화면에는 최신 revision을 보여준다.
- Provenance와 SynthesisSource는 당시 사용한 revision을 가리킨다.
- Why Trail에서는 현재 표현과 당시 근거 표현을 구분해 볼 수 있다.

따라서 과거의 결론이 현재 수정 때문에 소급해서 바뀌지 않는다.

---

## 10. 인과 그래프 무결성

Synthesis와 MeaningNode가 서로 출처가 될 수 있으므로 개별 테이블 수준의 DAG 검사만으로 충분하지 않다.

모든 `근거 → 새 해석 또는 의미` 관계를 하나의 causal provenance graph로 본다.

새 SynthesisSource 또는 Provenance를 추가할 때 전체 인과 그래프에서 순환이 생기지 않는지 검사한다.

금지 예시:

```text
Goal A
→ Synthesis X의 근거
→ Synthesis X에서 다시 같은 Goal A가 도출됨
```

더 긴 간접 순환도 동일하게 금지한다.

의미 관계인 `supports`, `conflicts_with`는 인과 Provenance와 별개이며 해당 DAG 규칙의 직접 대상이 아니다.

---

## 11. 중복과 병합

장기간 사용하면 같은 의미의 노드가 여러 개 생기는 것을 정상 상황으로 본다.

병합 시 현재 대표 노드를 하나 정하지만 과거 노드를 삭제하거나 과거 관계의 endpoint를 강제로 재작성하지 않는다.

규칙:

- source node는 `merged` 상태가 된다.
- `mergedIntoNodeId`로 canonical node를 가리킨다.
- 과거 관계와 OriginMoment는 기존 node ID를 유지한다.
- 현재 조회와 새 연결에서는 canonical node로 resolve한다.
- 병합 순환은 허용하지 않는다.

이 방식으로 과거 의미 구조를 보존하면서 현재 UI에서는 중복을 정리한다.

---

## 12. 종료와 삭제

### 12.1 종료

종료는 데이터 삭제가 아니다.

종료 이유:

- `achieved`
- `no_longer_wanted`
- `values_changed`
- `superseded`
- `deferred`
- `context_changed`
- `other`

종료 시점의 사용자 메모를 남길 수 있다.

### 12.2 완전 삭제

사용자가 명시적으로 완전 삭제를 선택하면 역사 보존 원칙보다 삭제 요청을 우선한다.

완전 삭제는 관련 텍스트와 revision을 제거하며, 관련 출처 링크와 관계도 `DATA_LIFECYCLE_SECURITY.md`에 정의된 트랜잭션 규칙에 따라 정리한다.

파생된 다른 객체는 사용자가 별도로 선택하지 않는 한 자동 삭제하지 않는다. 단, 삭제된 출처를 가리키는 링크는 제거한다.

---

## 13. 데이터 보안과 프라이버시

정확한 저장·삭제·백업 정책은 `DATA_LIFECYCLE_SECURITY.md`를 따른다.

핵심 원칙:

- 서버 전송 없음
- 광고 SDK 없음
- 행동 분석 SDK 없음
- 사용자 원문 로그 금지
- 개인 원문 DB와 Widget 공유 데이터 분리
- 사용자 원문 파일은 iOS 강한 Data Protection 적용
- 앱이 비활성화될 때 App Switcher 스냅샷에 민감한 화면이 남지 않도록 privacy cover 적용
- 잠금화면에는 명시적으로 승인한 문장만 사용
- 자동 클라우드 백업 제외
- 수동 백업은 암호화 컨테이너 사용

현재 저장소는 Public이므로 실제 개인 데이터, 실제 export, 실제 SQLite DB, 개인 원문 fixture, 개인 텍스트가 보이는 스크린샷을 커밋하지 않는다.

---

## 14. iOS WidgetKit 계약

### 14.1 Widget 설치

앱은 잠금화면 위젯을 자동 설치할 수 있다고 가정하지 않는다. 사용자가 iOS 잠금화면 사용자화 흐름에서 위젯을 추가하도록 안내한다.

### 14.2 공유 데이터

App Group에는 승인된 Projection의 최소 데이터만 둔다.

예시:

- projection revision ID
- public-safe widget message
- 표시 설정
- generation
- updatedAt

개인 Why Graph DB 전체를 App Group에 저장하지 않는다.

### 14.3 업데이트는 eventual consistency이다

앱이 Projection을 변경하면 다음을 수행한다.

1. App Group projection을 원자적으로 갱신한다.
2. generation을 증가시킨다.
3. `WidgetCenter`에 timeline reload를 요청한다.

그러나 앱 UI는 `위젯 적용 완료`라고 보장하지 않는다.

사용자에게는 `위젯 업데이트를 요청했습니다. iOS가 반영 시점을 결정합니다.`와 같은 의미로 안내한다.

WidgetKit의 timeline 날짜와 reload 요청은 정확한 즉시 갱신을 보장하지 않는다는 플랫폼 제약을 제품 계약에 반영한다.

### 14.4 시간 기반 자동 anchor 변경 금지

1차 제품에서는 FocusWindow 또는 날짜 경계가 activeAnchor를 자동 변경하지 않으므로 특정 시각에 Widget이 반드시 다른 문장으로 바뀌어야 하는 요구사항을 두지 않는다.

---

## 15. 잠금화면 이미지

사용자는 승인된 Projection을 기반으로 단색 또는 사진 배경의 잠금화면 이미지를 생성할 수 있다.

이미지 저장과 실제 배경화면 적용은 별개이다.

iOS에서는 생성 이미지를 사진 보관함에 저장하고 사용자가 시스템 배경화면 설정 흐름에서 적용한다.

사진 보관함에 저장된 이미지는 사용자의 iCloud Photos 또는 다른 사진 동기화 정책의 영향을 받을 수 있음을 안내한다.

---

## 16. 백업과 복원

장기 사용 데이터를 보호하기 위해 데이터 모델이 안정된 뒤 수동 암호화 백업과 복원을 구현한다.

1차 복원 정책은 `병합`이 아니라 `전체 교체`이다.

복원 절차:

1. 백업 무결성 검증
2. 포맷 및 schema version 확인
3. 임시 저장소에서 migration 실행
4. 전체 무결성 검사
5. 성공한 경우에만 현재 DB와 원자적으로 교체
6. 실패하면 기존 DB 유지

비어 있지 않은 DB에 복원하는 경우 현재 DB를 교체한다는 점을 명확히 안내한다.

서로 다른 데이터 세트를 자동 병합하는 import 기능은 별도 기능으로 다룬다.

---

## 17. 접근성

- VoiceOver 레이블
- Dynamic Type 고려
- 색상만으로 의미를 구분하지 않음
- 충분한 터치 영역
- Drag and Drop과 동등한 탭 기반 연결 경로
- 모션 감소 설정 고려
- 햅틱 없이도 연결 성공과 실패를 이해할 수 있는 텍스트 피드백

---

## 18. 구현 단계

단계는 기능을 축소하기 위한 우선순위가 아니라 의존성과 데이터 안정성을 관리하기 위한 순서이다.

### Phase 1. 기반과 무결성

- React Native 프로젝트 초기화
- iOS 네이티브 타깃 구성
- 로컬 DB 선택과 migration 기반
- canonical domain schema 구현
- revision 모델
- causal cycle validator
- transaction boundary
- 보안 저장소와 로그 정책

### Phase 2. 기록과 회고

- 빠른 기록
- ReflectionSession / ReflectionItem
- revision UI
- 최근 기록
- 검색과 기본 필터

### Phase 3. 의미 그래프

- MeaningNode
- MeaningRelation
- Provenance
- OriginMoment
- MeaningCheckIn
- 종료와 병합 기반
- Why Trail

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

### Phase 7. 장기 사용

- Review resurfacing
- 중복 병합 UI
- 암호화 백업과 복원
- FocusWindow
- 전체 Meaning Map

### Phase 8. Android

- 공통 도메인 검증 후 Android 지원
- Kotlin 네이티브 모듈
- 잠금화면 이미지 직접 적용 가능성 및 기기별 예외 처리

---

## 19. 테스트 요구사항

### 19.1 revision / provenance

- 기록 수정 후 과거 Synthesis가 기존 revision을 계속 가리키는지
- Why Trail에서 현재 revision과 과거 revision이 구분되는지

### 19.2 causal cycle

- 직접 순환 거부
- Synthesis와 MeaningNode를 여러 단계 거치는 간접 순환 거부
- 정상 DAG 연결 허용

### 19.3 관계

- directed relation 방향성
- symmetric relation 중복 방지
- 관계 종료 후 과거 조회
- MeaningCheckIn이 relation target을 참조

### 19.4 병합

- canonical resolve
- 병합된 노드의 과거 관계 보존
- 병합 순환 거부
- activeAnchor / Projection 관련 노드 병합 처리

### 19.5 삭제

- 객체별 hard delete transaction
- 관련 projection 제거
- activeAnchor 제거 또는 안전한 fallback
- 삭제된 revision을 가리키는 provenance 제거
- 파생 객체의 독립 생존

### 19.6 복원

- 잘못된 암호 또는 손상 백업 실패
- schema migration 실패 시 기존 DB 유지
- 정상 복원 후 전체 관계 무결성

### 19.7 Widget

- 승인되지 않은 Projection 미노출
- 승인 revision 변경 후 재승인 필요
- activeAnchor 수동 변경
- shared projection generation 증가
- reload 요청 이후 eventual update 안내
- 긴 widgetMessage 처리

### 19.8 프라이버시

- 로그에 원문 없음
- App Group에 민감 원문 없음
- 앱 전환기 스냅샷 privacy cover
- 잠금 상태에서 Private Store 접근 실패를 안전하게 처리

---

## 20. 완료 기준

제품을 제대로 구현했다고 판단하려면 다음이 모두 가능해야 한다.

- 사용자가 한 문장 기록부터 장기 회고까지 자유롭게 기록할 수 있다.
- 사용자가 기록 당시 결론을 내리지 않아도 된다.
- 여러 기록을 나중에 종합하여 새 인사이트를 만들 수 있다.
- 하나의 목표나 행동에 여러 이유를 연결할 수 있다.
- 과거 원문과 현재 표현을 모두 복원할 수 있다.
- 의미가 변한 시점을 노드 또는 관계 단위로 기록할 수 있다.
- 의미 그래프의 인과 출처에 순환이 생기지 않는다.
- 중복 의미를 병합해도 과거 역사가 보존된다.
- 목표를 종료한 이유를 다시 확인할 수 있다.
- 잠금화면에는 승인한 공개용 문장만 표시된다.
- 내부 원칙 수정이 승인하지 않은 잠금화면 변경으로 이어지지 않는다.
- 사용자가 직접 대표 문장을 선택한다.
- 중요한 다른 원칙은 부담을 주지 않는 방식으로 다시 만날 수 있다.
- 개인 데이터가 외부 서버나 Public Git 저장소로 유출되지 않는다.
- 장기 데이터를 암호화하여 백업하고 안전하게 복원할 수 있다.

## 21. 비차단 구현 결정

다음 항목은 제품 구조를 바꾸지 않으므로 해당 구현 단계에서 최신 상태를 확인해 확정한다.

- 실제 앱 표시 이름
- React Native용 로컬 SQLite 라이브러리
- 암호화 백업의 구체 알고리즘 및 키 파생 라이브러리
- widgetMessage / wallpaperMessage의 UX 길이 제한값
- 전체 Meaning Map의 그래프 렌더링 라이브러리

이 결정들은 canonical schema와 데이터 이력 규칙을 위반해서는 안 된다.
