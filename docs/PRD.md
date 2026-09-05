# Future Self PRD v1.2

- 상태: 구현 기준선 확정
- 최근 갱신: 2026-09-05
- 저장소: `Jiyeong-kor/future-self-lockscreen`
- 1차 플랫폼: iOS
- 클라이언트: React Native Community CLI + TypeScript
- 네이티브 확장: Swift/WidgetKit, 후속 Android Kotlin 모듈

## 0. 문서 권위

이 문서는 제품 요구사항의 최상위 기준 문서이다.

구현 시 규칙의 권위는 다음 순서로 둔다.

1. `docs/PRD.md`
2. `docs/DOMAIN_SCHEMA.md`
3. `docs/DATA_LIFECYCLE_SECURITY.md`

UX 구현은 다음 문서를 함께 따른다.

- `docs/INFORMATION_ARCHITECTURE.md`
- `docs/USER_FLOWS.md`
- `docs/SCREEN_STATES.md`
- `docs/LOCKSCREEN_APPROVAL_POLICY.md`
- `docs/RETURN_AND_RESURFACING_POLICY.md`

기술 구현 결정은 해당 설계 문서를 따른다. 현재 로컬 DB 결정은 `docs/LOCAL_DATABASE_DECISION.md`에 있다.

기존 레드팀과 v0.x 문서는 설계 과정과 의사결정 근거를 보존하는 참고 자료이다. 기준 문서와 충돌하면 기준 문서를 따른다.

이 제품은 축소형 MVP를 목표로 하지 않는다. 수년간 기록과 revision/event가 누적되어도 의미와 이력을 잃지 않는 구조를 처음부터 설계한다. 구현 단계는 기능을 임의로 줄이기 위한 것이 아니라 의존성, 무결성, 보안, 사용성을 안전하게 검증하기 위한 순서이다.

---

## 1. 제품 정의와 포지셔닝

Future Self의 외부 포지셔닝 중심 문장은 다음과 같다.

> 내가 무엇을 해야 하는지가 아니라, 왜 그걸 하기로 했는지를 잊지 않게 해주는 앱

Future Self는 사용자가 평소의 생각, 경험, 후회, 잘한 선택, 욕망, 발견과 깨달음을 기록하고, 시간이 지난 뒤 서로 연결하거나 종합하여 자신이 무엇을 왜 중요하게 생각했는지를 다시 이해하도록 돕는 개인 의미 관리 앱이다.

핵심 가치는 단순히 기록을 저장하거나 그래프를 만드는 것이 아니다.

Future Self는 다음을 보존한다.

- 어떤 기록에서 생각이 시작됐는가
- 당시 어떤 이유가 중요했는가
- 여러 이유가 하나의 목표나 원칙에 어떻게 연결됐는가
- 시간이 지나 그 이유와 관계가 어떻게 달라졌는가
- 현재의 내가 과거의 판단을 어떻게 다시 생각하게 됐는가

잠금화면은 제품 전체가 아니라 사용자가 직접 선택한 원칙을 일상에 투영하는 출력 지점이다.

## 2. 제품 경계

Future Self는 다음 제품이 아니다.

- 할 일 관리 앱
- 습관 체크 또는 스트릭 앱
- 완료율 기반 생산성 앱
- 범용 문서/웹페이지/논문 PKM
- 자동 코칭 앱
- 사용자의 동기나 정체성을 판정하는 앱
- AI가 사용자의 의미를 대신 만드는 앱

Future Self의 소스 오브 트루스는 `무엇을 실행했는가`보다 `무엇을 왜 중요하게 생각했는가`이다.

필요하면 Practice 또는 Goal을 외부 Reminders, Calendar, Shortcuts로 보낼 수 있지만 Future Self 자체가 실행 체크 시스템으로 확장되지는 않는다.

---

## 3. 제품이 해결하는 문제

사람의 목표와 행동은 하나의 이유로 설명되지 않는다.

하나의 목표에는 안정, 선택권, 인정 욕구, 호기심, 미래 계획처럼 서로 다른 이유가 동시에 존재할 수 있다. 반대로 하나의 이유가 여러 목표와 실천을 지지할 수도 있다.

시간이 지나면 다음 문제가 발생한다.

- 중요한 생각을 기록했지만 다시 찾지 않는다.
- 목표를 오래 수행하면서 처음 왜 시작했는지 잊는다.
- 처음에는 따로 보였던 기록이 나중에 하나의 패턴으로 보인다.
- 과거에 중요했던 이유가 현재는 약해지거나 달라진다.
- 과거 문장을 수정하면서 당시의 근거가 사라진다.
- 장기 기록이 쌓이면 다시 찾기 어렵다.
- 서로 충돌하는 목표나 욕망을 한쪽으로 지워버리게 된다.
- 기록을 정리하고 분류하는 행위 자체가 새로운 부담이 된다.
- 잠금화면에 개인 원문을 그대로 노출하면 프라이버시 문제가 생긴다.
- 한동안 앱을 쓰지 않았을 때 복귀 자체가 또 다른 과제로 느껴질 수 있다.

Future Self는 현재 목표 목록만 저장하지 않는다. 사용자가 어떤 기록에서 어떤 해석을 거쳐 어떤 의미, 목표, 실천, 원칙에 도달했는지의 시간적 경로를 보존한다.

---

## 4. 핵심 제품 원칙

### 4.1 기록할 때 결론을 요구하지 않는다

사용자는 한 문장만 기록하고 끝낼 수 있다.

다음은 모두 선택 사항이다.

- 태그
- 분류
- 의미 연결
- 목표화
- 행동화
- 잠금화면 문장화

저장 완료 자체가 정상적인 사용 결과이다.

### 4.2 행동 결정을 압박하지 않는다

기록과 Synthesis는 어떤 행동으로 연결되지 않아도 완결된 상태이다.

기본 UX에서 다음과 같은 압박형 질문을 사용하지 않는다.

- `그래서 무엇을 할 건가요?`
- `가장 작은 행동은 무엇인가요?`
- `목표로 만들어볼까요?`

사용자가 원할 때만 Practice 생성이나 외부 실행 도구 연결을 연다.

### 4.3 후회만 기록하지 않는다

회고는 다음을 동등하게 다룬다.

- 바꾸고 싶은 것
- 잘했던 것
- 유지하고 싶은 것
- 새롭게 원하는 것
- 새롭게 발견한 것
- 방향을 바꾼 사건
- 새롭게 얻은 통찰

### 4.4 사용자는 자신의 생각을 정리할 의무가 없다

그래프를 예쁘게 만들거나 모든 기록을 연결하고 분류하는 것이 제품 성공 조건이 아니다.

다음은 모두 정상 상태이다.

- 분류되지 않은 Meaning Card
- 아무 관계도 없는 카드
- 행동으로 연결되지 않은 Synthesis
- 출처가 하나뿐인 Why Trail
- 해결되지 않은 갈등
- 오랫동안 다시 열지 않은 기록

제품은 다음을 성취 지표로 만들지 않는다.

- 연결 개수
- 노드 개수
- 미분류 개수
- 그래프 완성도
- Inbox Zero
- 연속 사용 일수

### 4.5 하나의 행동에는 여러 이유가 있을 수 있다

Goal, Practice, Commitment는 여러 Motive와 연결될 수 있다. Motive와 Vision 역시 여러 Goal을 지지할 수 있다.

### 4.6 의미는 변할 수 있다

현재 판단이 과거 판단을 덮어쓰지 않는다.

과거에 어떤 이유가 중요했는지와 현재 그 이유를 어떻게 생각하는지를 구분한다.

### 4.7 원문과 출처는 시점까지 보존한다

모든 causal provenance는 당시의 immutable revision 또는 immutable event를 가리킨다.

나중에 원문이 수정돼도 과거 Synthesis가 근거로 삼았던 revision은 바뀌지 않는다.

### 4.8 사용자의 자기해석을 제품이 교정하지 않는다

사용자가 자신을 어떤 문장으로 표현하든 제품은 그것을 도덕적으로 평가하거나 정체성 표현을 수정하려 하지 않는다.

사용자가 원하면 반대 기록, 다른 관점, 과거 표현을 직접 탐색할 수 있지만 이를 기본 질문이나 교정 흐름으로 강제하지 않는다.

### 4.9 종료는 실패가 아니다

Goal, Motive, Vision, Practice, Commitment의 종료는 달성, 가치 변화, 상황 변화, 대체, 보류 등 다양한 이유를 가질 수 있다.

종료 이유와 당시 의미를 보존한다.

### 4.10 검색과 재발견은 기록만큼 중요하다

장기 데이터를 다시 찾고 이해할 수 없다면 기록의 가치도 떨어진다.

검색, 필터, revision 비교, 특정 시점 탐색을 핵심 기능으로 본다.

---

## 5. 핵심 도메인

정확한 필드와 무결성 규칙은 `DOMAIN_SCHEMA.md`를 따른다.

### 5.1 CaptureEntry

평소 한 문장으로 남기는 가장 낮은 마찰의 기록이다.

### 5.2 ReflectionSession / ReflectionItem

특정 기간이나 사건을 돌아보는 회고와 그 안의 개별 기록이다.

ReflectionItem 종류:

- `regret`
- `win`
- `desire`
- `discovery`
- `turning_point`
- `insight`

### 5.3 SynthesisInsight

여러 기록이나 기존 인사이트를 함께 보면서 나중에 새로 발견한 해석이다.

```text
기록 A
기록 B
기록 C
→ 같이 보기
→ 현재 시점에서 새롭게 발견한 생각
```

SynthesisInsight는 `객관적 진실`이 아니라 사용자가 당시 만든 해석이다.

그 해석을 행동, 목표, 의미 카드로 전환하지 않아도 된다.

### 5.4 MeaningNode / Meaning Card

사용자 화면에서는 `의미 카드`를 기본 표현으로 사용한다.

MeaningNode kind:

- `unclassified`: 분류 없음
- `motive`: 이유
- `vision`: 미래상
- `goal`: 목표
- `practice`: 실천
- `commitment`: 원칙

`unclassified`는 임시 실패 상태가 아니라 영구적으로 유지할 수 있는 정상 상태이다.

사용자가 원하면 나중에 `unclassified → typed kind`로 분류할 수 있다. 분류를 재촉하거나 미분류 카드 수를 경고하지 않는다.

분류된 카드의 근본 정체성이 달라졌다면 kind를 임의 변경하지 않고 새 node를 만든 뒤 필요하면 `supersedes`로 연결한다.

### 5.5 MeaningRelation

MeaningNode 사이의 다대다 의미 관계이다.

- `motivated_by`
- `contributes_to`
- `serves`
- `supports`
- `conflicts_with`
- `supersedes`

출처 관계는 MeaningRelation에 넣지 않고 causal provenance로 분리한다.

### 5.6 TradeoffReflection

`conflicts_with` 관계를 사용자가 원할 때 다시 살펴보는 immutable event이다.

선택적으로 남길 수 있다.

- 둘 다 원하는 이유
- 현재 우선순위
- 선택에 따른 비용
- 다시 보고 싶은 시점
- 자유 메모

결론을 내리지 않거나 `undecided`로 남기는 것도 정상 상태이다.

앱은 어느 쪽이 옳은지 결정하지 않는다.

### 5.7 Provenance

현재 해석이나 의미 revision이 어떤 과거 revision/event에서 나왔는지 보존한다.

### 5.8 OriginMoment

노드 또는 관계가 처음 형성된 시점과 당시 표현을 보존한다.

### 5.9 MeaningCheckIn

사용자가 나중에 노드 또는 관계를 다시 생각해본 immutable event이다.

- `reaffirmed`
- `reframed`
- `weakened`
- `retired`
- `uncertain`

### 5.10 Why Trail

현재 Goal, Practice, Commitment 또는 의미 카드에서 시작해 이유, 미래상, 최초 기록, 의미 변화를 따라가는 읽기 중심 화면이다.

### 5.11 LockscreenProjection

내부 Commitment와 공개용 잠금화면 문장을 분리한다.

Projection은 특정 Commitment revision을 기준으로 만들어지고 문구 내용은 사용자가 직접 확인해 승인한다.

---

## 6. 정보 구조

최상위 하단 탐색은 네 영역으로 둔다.

```text
홈 | 기록 | 의미 | 설정
```

### 6.1 홈

- 현재 잠금화면 문장
- 한 줄 빠른 기록
- 최근 기록
- 안전하게 재노출 가능한 Review 후보 최대 3개
- 필요한 경우에만 선택적 `이전 맥락 다시 보기`
- 회고 진입점

홈을 대시보드나 미처리 작업판으로 만들지 않는다.

### 6.2 기록

- 시간순 기록
- 통합 검색
- CaptureEntry
- Reflection
- Synthesis
- 필터
- 여러 기록 `같이 보기`
- 과거 표현 검색 opt-in

### 6.3 의미

- Meaning Card 목록
- 분류 없음 포함 종류 필터
- 카드 상세
- 관계 상세
- Why Trail
- Focus Board
- Block Tray
- 갈등 검토
- 후속 전체 Meaning Map

### 6.4 설정

- 앱 잠금
- 알림
- Widget 안내
- 백업/복원
- human-readable export
- resurfacing 제외 설정
- 시스템 통합
- 개인정보 및 제품 정보

회고, Synthesis, 시간 여행, 전체 Meaning Map을 최상위 탭으로 만들지 않는다.

---

## 7. 기본 사용자 경험

### 7.1 빠른 기록

필수 입력은 본문뿐이다.

```text
홈
→ 한 줄 입력
→ 저장
→ 홈
```

저장 뒤 분류나 연결 화면을 자동으로 띄우지 않는다.

### 7.2 기록을 의미 카드로 남기기

사용자가 원할 때만 기록 또는 Synthesis를 의미 카드로 만든다.

기본 생성 kind는 `unclassified`를 허용한다.

### 7.3 Synthesis

사용자가 여러 기록을 직접 선택해 `같이 보기`로 보낸다.

저장된 Synthesis는 그 자체로 완성된 결과이다.

### 7.4 Focus Board

휴대전화에서 구조적 연결을 만드는 기본 작업 공간이다.

Drag and Drop은 스크래치의 snap interaction을 차용하지만 시각 디자인은 성인용 개인 기록 제품으로 유지한다.

DnD와 동일한 탭 기반 연결을 제공한다.

### 7.5 Why Trail

전체 그래프를 먼저 보여주지 않는다.

현재 사용자가 보고 있는 항목에서 필요한 이유와 출처 경로를 먼저 보여준다.

### 7.6 갈등 검토

`conflicts_with`를 만들었다고 TradeoffReflection을 자동으로 요구하지 않는다.

사용자가 관계 상세에서 원할 때만 연다.

---

## 8. 검색과 시간 여행

### 8.1 통합 검색

기본 검색 대상:

- CaptureEntry
- ReflectionItem
- SynthesisInsight
- Meaning Card

기본은 최신 revision을 검색한다.

필터:

- 기간
- 객체 종류
- 태그
- 현재 상태
- 연결 여부
- 회고 세션
- 종료된 항목
- 분류 없음

### 8.2 과거 표현 검색

사용자가 명시적으로 `과거 표현까지 검색`을 켠 경우 revision history를 검색한다.

현재 표현과 과거 표현을 명확히 구분한다.

### 8.3 특정 시점 보기

revision, lifecycle event, relation validity를 이용해 특정 시점의 표현과 연결 상태를 재구성한다.

### 8.4 현재와 과거 비교

현재 revision과 선택한 과거 revision을 나란히 비교할 수 있다.

### 8.5 삭제 한계

hard delete한 데이터는 시간 여행을 위해 별도로 보존하지 않는다.

---

## 9. Review와 재노출 안전

Review는 task queue가 아니라 계산된 소수 resurfacing이다.

### 9.1 기본 규칙

- 홈 최대 3개
- 전체 미확인 개수 배지 없음
- `당분간 묻지 않기`
- 확인하지 않아도 실패 기록 없음
- activeAnchor 자동 변경 없음

### 9.2 설명 가능한 이유

Review 카드에는 왜 지금 보이는지 설명한다.

예:

- 사용자가 지정한 재검토 시점
- 최근 관련 이유가 변경됨
- 다시 봐도 되는 중요한 원칙을 오래 확인하지 않음

설명할 수 없는 기준으로 자동 노출하지 않는다.

### 9.3 민감한 과거 보호

일반 CaptureEntry, ReflectionItem, SynthesisInsight를 단순히 오래됐다는 이유로 무작위 재노출하지 않는다.

사용자는 특정 MeaningNode를 automatic resurfacing 대상에서 제외할 수 있다.

`On This Day`식 무차별 회상은 기본 기능으로 두지 않는다.

---

## 10. 장기간 미사용 후 복귀

앱을 오랫동안 사용하지 않아도 실패가 아니다.

기본 복귀 흐름:

```text
앱 실행
→ 평소 홈
```

다음 UX를 사용하지 않는다.

- 미사용 일수 강조
- 밀린 회고 개수
- 미처리 Review backlog
- 스트릭 복구
- 강제 복귀 마법사

안전한 과거 맥락이 있을 때 홈에 작은 `이전 맥락 다시 보기` 진입점을 제공할 수 있다.

사용자가 눌렀을 때만 이전 activeAnchor 또는 명시적으로 재노출 가능한 의미를 보여준다.

---

## 11. 잠금화면 공개 승인과 의미 재확인

### 11.1 activeAnchor

대표 잠금화면 문장은 사용자의 명시적 선택으로만 바뀐다.

다음은 자동 변경 사유가 아니다.

- 새 Commitment
- 새 Synthesis
- Review
- Commitment 수정
- FocusWindow
- 우선순위 변화

### 11.2 공개 승인

문구 내용이 달라지면 새 ProjectionRevision을 만들고 다시 공개 승인한다.

승인되지 않은 revision은 activeAnchor가 될 수 없다.

### 11.3 스타일 변경

텍스트가 그대로라면 다음 변경은 공개 재승인을 요구하지 않는다.

- 배경
- 위치
- 정렬
- 글자 크기
- 여백
- 줄바꿈
- 레이아웃 프리셋

### 11.4 의미 재확인

`이 문장은 아직 나에게 중요하다`는 기록은 MeaningCheckIn으로 남길 수 있다.

이는 공개 승인과 완전히 별개이다.

- 정기적으로 요구하지 않는다.
- 재확인 기한을 만들지 않는다.
- 재확인하지 않아도 기존 승인 문장을 유지할 수 있다.

---

## 12. revision, provenance, lifecycle, merge

### 12.1 수정

화면에서는 편집처럼 보여도 저장소에서는 기존 내용을 덮어쓰지 않는다.

- stable ID 유지
- 새 revision 생성
- currentRevisionId 변경
- 과거 revision 유지

### 12.2 causal provenance

근거에서 새로운 Synthesis/MeaningNode revision으로 이어지는 인과 연결은 하나의 revision/event DAG로 본다.

- self edge 금지
- 직접 cycle 금지
- 여러 객체를 거치는 간접 cycle 금지
- transaction에서 여러 edge를 넣는 경우 최종 그래프 기준 검증

MeaningRelation은 causal provenance와 별개이다.

### 12.3 lifecycle

pause, resume, retire, reactivate, archive는 immutable event로 보존한다.

### 12.4 merge

중복 MeaningNode 병합 시:

- source를 merged 상태로 보존
- canonical target 지정
- merge cycle 금지
- 과거 relation endpoint 재작성 금지
- 현재 조회와 새 연결만 canonical target으로 resolve

---

## 13. 데이터 보안과 앱 잠금

정확한 규칙은 `DATA_LIFECYCLE_SECURITY.md`를 따른다.

기본 원칙:

- local-first
- 개인 원문 서버 전송 없음
- 광고 SDK 없음
- 행동 분석 SDK 없음
- 원문 로그 금지
- Private Store와 Widget App Group 분리
- SQLCipher 기반 private DB 암호화
- 검색 인덱스도 private 데이터로 취급
- iOS DB/WAL/SHM/temp에 강한 Data Protection 적용
- App Switcher privacy cover
- 선택적 앱 잠금
- 암호화 백업

### 13.1 앱 잠금

1차 iOS는 LocalAuthentication을 사용한다.

- Face ID
- Touch ID
- 시스템 인증 fallback

앱은 생체 정보 자체를 저장하지 않는다.

인증 전 private UI를 먼저 렌더링한 뒤 가리는 방식은 허용하지 않는다. 인증이 끝나기 전에는 private 화면을 생성하지 않는다.

이미 승인된 public-safe Widget 문장은 앱 잠금과 별개이다.

---

## 14. iOS WidgetKit과 잠금화면 이미지

### 14.1 Widget 설치

앱은 Widget을 자동 설치할 수 있다고 가정하지 않는다.

사용자가 iOS 잠금화면 사용자화에서 Widget을 추가하도록 안내한다.

### 14.2 App Group

공유하는 것은 현재 승인된 public-safe projection의 표시용 데이터뿐이다.

Private DB, 검색 인덱스, Why Trail, 개인 기록을 App Group에 두지 않는다.

### 14.3 업데이트

WidgetCenter reload 요청은 eventual consistency이다.

앱은 `즉시 반영 완료`를 보장하지 않는다.

### 14.4 잠금화면 이미지

승인된 Projection으로 이미지를 만들 수 있다.

iOS에서는 이미지 생성과 실제 배경화면 적용을 분리한다. 사용자가 시스템 설정 흐름에서 직접 적용한다.

---

## 15. 백업, 복원, 데이터 이동권

### 15.1 암호화 백업

machine recovery 용도이다.

- 암호화/authentication 적용
- live DB와 별도 포맷
- plaintext JSON을 기본 백업으로 사용하지 않음

복원:

```text
backup 선택
→ 임시 저장소 복호화
→ schema migration
→ 전체 무결성 검증
→ 성공한 경우에만 live store 원자 교체
```

실패하면 기존 live store를 유지한다.

### 15.2 human-readable export

사용자 소유권과 이동권을 위한 별도 기능이다.

범위 예:

- 특정 회고 세션
- 특정 Why Trail
- 선택한 Goal/Commitment와 연결된 기록
- 선택 기간

초기 포맷은 Markdown을 기본 후보로 둔다.

앱 잠금이 켜져 있다면 export 직전에 재인증한다.

완료/취소 후 app-private 임시 평문을 정리한다.

앱 밖으로 나간 복사본은 Future Self가 삭제하거나 보호할 수 없음을 안내한다.

---

## 16. 시스템 통합과 실행 관리 경계

### 16.1 App Intents / App Shortcuts

후속 iOS 통합 후보:

- Shortcuts
- Siri
- Spotlight app actions
- 지원 기기의 Action Button

시스템에 노출하는 기본 대상은 private 엔티티가 아니라 `빠른 기록 열기` 같은 액션이다.

민감 원문이 Siri/Shortcuts 표면에 남을 수 있는 직접 입력 방식은 노출 범위를 확인한 뒤 결정한다.

### 16.2 외부 실행 도구

Practice 또는 Goal에 일정이 필요하면 사용자가 명시적으로 선택한 경우에만 다음으로 보낼 수 있다.

- Apple Reminders
- Apple Calendar
- Shortcuts

전송 전에 어떤 텍스트와 날짜가 외부로 나가는지 미리 보여준다.

Motive, Reflection, MeaningCheckIn 원문을 자동 포함하지 않는다.

외부 완료 데이터를 가치 점수나 도덕적 평가로 자동 변환하지 않는다.

---

## 17. AI 정책

**현재 제품에는 AI 기능을 사용하지 않는다.**

포함하지 않는 기능:

- AI 요약
- AI 검색 보조
- AI 유사 기록 추천
- AI 관계 추천
- AI 질문 생성
- AI Motive/Vision/Goal/Practice/Commitment 생성

검색, 필터, Synthesis, 관계 탐색은 사용자 데이터와 명시적 규칙으로 동작한다.

향후 AI 도입은 단순 구현 변경이 아니라 제품 철학 변경으로 다시 결정한다.

---

## 18. 수익화 정책

**현재 Future Self는 완전 무료로 운영한다.**

- 무료 체험 종료 없음
- 일회성 구매 없음
- 구독 없음
- 기능별 유료 잠금 없음
- 광고 없음
- 사용자 데이터 판매 없음

향후 수익화가 필요해지면 그 시점에 별도 제품 결정으로 검토한다.

---

## 19. 멀티디바이스 방향

현재 구현은 local-first 단일 기기에서 시작하지만 장기적으로 멀티디바이스를 지원한다.

동기화 기술을 지금 제품 철학으로 고정하지 않는다.

기술 선택 우선순위:

1. 프라이버시와 사용자 데이터 소유권
2. revision/event 충돌 안전성
3. 오프라인 사용
4. 기기 교체 시 데이터 손실 방지

현재 schema와 event 모델은 후속 동기화를 막는 단일 기기 전용 구조로 설계하지 않는다.

---

## 20. 알림 정책

알림은 opt-in이다.

허용 목적:

- 사용자가 지정한 회고 시점
- 사용자가 지정한 의미 재검토 시점
- 선택적 백업 상태 안내

금지 방향:

- 죄책감 유발
- 실패 횟수
- 미처리 개수 압박
- 연속 사용 유지용 푸시
- 무관한 engagement 알림

---

## 21. 접근성

- VoiceOver 레이블
- Dynamic Type
- 색상만으로 의미 구분 금지
- 충분한 터치 영역
- DnD와 동등한 탭 기반 연결
- Reduce Motion 고려
- 햅틱 없이도 상태 전달
- 검색, Why Trail, Review, 시간 여행, 앱 잠금 완전 조작 가능

---

## 22. 장기 데이터와 성능

장기 합성 데이터 검증 목표:

- source record 50,000개 이상
- MeaningNode 10,000개 이상
- MeaningRelation 50,000개 이상
- revision/event 합계 100,000개 이상

사용자 제한값이 아니라 개발 검증 데이터셋이다.

성능 설계 목표:

- 한 줄 빠른 기록 저장은 체감상 즉시
- 일반 검색 첫 결과 500ms 이내 목표
- Why Trail 첫 화면 700ms 이내 목표
- 홈에서 전체 graph 메모리 적재 금지
- Meaning Map viewport/subgraph 로딩

정확한 수치는 실제 지원 기기 벤치마크로 조정할 수 있다.

검색 인덱스는 재생성 가능한 파생 데이터이며 source of truth가 아니다.

---

## 23. 구현 단계

### Phase 1. 기반과 무결성

- React Native 프로젝트
- iOS 네이티브 기반
- local SQLCipher DB
- migration
- canonical schema
- revision/event 타입
- causal cycle validator
- merge validator
- transaction boundary
- secure DB key store
- private FTS5 기반
- iOS file protection 검증

### Phase 2. 기록, 회고, 검색

- 홈
- 빠른 기록 persistence
- 최근 기록
- ReflectionSession / ReflectionItem
- revision UI
- 통합 검색과 필터
- Progressive Disclosure 기반

### Phase 3. Meaning Card와 시간 여행

- unclassified Meaning Card
- typed classification
- MeaningRelation
- Provenance
- OriginMoment
- MeaningCheckIn
- retire/merge
- Why Trail
- revision 비교
- 특정 시점 보기

### Phase 4. Synthesis

- 여러 기록 선택
- 같이 보기 workspace
- SynthesisInsight
- causal evidence 연결
- 사용자가 원할 때 Meaning Card 연결

### Phase 5. 연결 UX와 갈등

- 탭 기반 연결
- Focus Board
- Block Tray
- DnD snap
- Undo
- 접근성 대체 동작
- conflict detail
- optional TradeoffReflection

### Phase 6. 잠금화면 출력

- Commitment Projection
- Projection revision
- approval events
- manual activeAnchor
- App Group minimal projection
- WidgetKit
- 스타일 편집
- 이미지 생성과 사진 저장

### Phase 7. 장기 사용과 보안 UX

- explainable Review
- resurfacing exclusion
- hiatus-proof return
- 선택적 앱 잠금
- merge UI
- 암호화 backup/restore
- human-readable export
- FocusWindow
- full Meaning Map

### Phase 8. iOS 시스템 통합

- App Intents / App Shortcuts
- Action Button / Siri / Shortcuts 진입
- Reminders / Calendar 평가
- OS surface privacy 검토

### Phase 9. 멀티디바이스

- privacy-preserving sync 기술 결정
- revision/event conflict model 검증
- offline-first 동기화
- 기기 교체 흐름

### Phase 10. Android

- 공통 domain 안정화 후 지원
- Kotlin 네이티브 확장
- Android 잠금화면 출력 가능성 및 기기별 예외 처리

### Phase 11. 공개 배포 준비

공개 배포를 결정한 경우:

- 개인정보 처리방침
- App Store privacy disclosure
- 접근성 실기기 검증
- export/delete 검증
- 완전 가상 sample data
- 개인 데이터 없는 store screenshot

---

## 24. 테스트 요구사항

### 24.1 revision / provenance

- 수정 후 과거 Synthesis가 기존 revision 유지
- current/past revision 구분
- 특정 시점 relation/lifecycle 재구성

### 24.2 Meaning Card classification

- `unclassified` 영구 유지
- `unclassified → typed` 정상 분류
- typed → typed 직접 변경 거부
- typed → unclassified 회귀 거부
- 과거 시점에서 분류 전 상태 복원

### 24.3 causal graph

- self cycle 거부
- 직접 cycle 거부
- 간접 cycle 거부
- 정상 DAG 허용
- batch edge 최종 cycle 검사

### 24.4 relation / conflict

- relation 방향성
- conflict symmetric canonicalization
- active conflict 중복 방지
- unclassified generic relation 허용
- typed relation kind 적격성
- TradeoffReflection 무결성
- undecided 저장 허용

### 24.5 merge

- canonical resolve
- merge cycle 거부
- 과거 endpoint 보존

### 24.6 검색

- current revision 기본 검색
- historical opt-in
- 필터
- hard delete 후 index 제거
- index 재생성

### 24.7 삭제와 복원

- hard delete cascade
- activeAnchor 안전 해제
- provenance cleanup
- 잘못된 백업 비밀번호 실패
- migration 실패 시 live DB 유지
- validation 실패 시 live DB 유지
- 정상 atomic restore

### 24.8 Projection / Widget

- 미승인 Projection 미노출
- 새 텍스트 revision 재승인
- 스타일 변경은 승인 유지
- activeAnchor 수동 변경
- revoke 시 anchor 해제
- Widget eventual update
- active 없음에서 임의 fallback 금지

### 24.9 privacy / app lock

- 원문 로그 없음
- App Group private data 없음
- app switcher cover
- 인증 전 private UI 없음
- 인증 실패/취소 안전
- export 재인증과 temp cleanup
- SQLCipher DB open
- Keychain/Keystore key recovery behavior
- DB/WAL/SHM file protection

### 24.10 Review / return

- 이유 없는 resurfacing 금지
- excluded node 자동 후보 제외
- snooze 존중
- 장기 미사용 후 normal Home
- backlog 생성 금지

### 24.11 accessibility

- DnD 없이 관계 생성
- VoiceOver 전체 핵심 흐름
- Reduce Motion에서도 상태 이해 가능

### 24.12 장기 데이터

- 대규모 migration
- quick capture latency
- search latency
- Why Trail lazy loading
- full graph 전량 메모리 적재 금지

---

## 25. 완료 기준

제품이 구현 기준을 충족하려면 다음이 가능해야 한다.

- 한 줄 기록만 하고 종료할 수 있다.
- 기록 당시 결론을 내리지 않아도 된다.
- 분류되지 않은 Meaning Card를 영구적으로 둘 수 있다.
- 여러 기록을 나중에 Synthesis할 수 있다.
- Synthesis를 행동으로 연결하지 않아도 된다.
- 하나의 목표/실천/원칙에 여러 이유를 연결할 수 있다.
- 갈등을 보존하고 해결하지 않은 채 둘 수 있다.
- 사용자가 원할 때 갈등의 당시 선택 맥락을 기록할 수 있다.
- 과거 원문과 현재 표현을 모두 복원할 수 있다.
- 특정 시점의 의미와 관계를 볼 수 있다.
- 오래된 기록을 검색할 수 있다.
- 의미 변화가 node/relation 단위로 보존된다.
- causal provenance cycle이 생기지 않는다.
- merge 후에도 과거 역사가 보존된다.
- 종료 이유를 다시 확인할 수 있다.
- 잠금화면에는 승인한 public-safe 문장만 표시된다.
- 문장 내용 변경과 스타일 변경의 승인 정책이 구분된다.
- 의미 재확인을 강요하지 않는다.
- Review가 backlog가 되지 않는다.
- 민감한 과거를 임의로 다시 꺼내지 않는다.
- 오래 앱을 쓰지 않아도 복귀에 불이익이 없다.
- 선택적 앱 잠금을 사용할 수 있다.
- 장기 데이터를 암호화 백업하고 검증 후 복원할 수 있다.
- 선택 데이터를 사람이 읽을 수 있는 형태로 내보낼 수 있다.
- private 원문이 Spotlight, Public Git, 로그, App Group에 자동 노출되지 않는다.
- 제품에 AI가 들어가지 않는다.
- 현재 제품 기능을 무료로 사용할 수 있다.
- Future Self가 할 일/습관/범용 PKM으로 변하지 않는다.

## 26. 구현 단계에서 정하는 비차단 항목

현재 사용자 결정을 기다리지 않고 해당 단계에서 기술적으로 확정한다.

- 암호화 backup cipher/KDF 및 라이브러리
- Widget / wallpaper 문장 길이 정책
- full Meaning Map 렌더링 라이브러리
- App Intents의 안전한 입력 범위
- PDF export 추가 시점
- 멀티디바이스 sync 기술

현재 이미 확정된 기술 결정:

- React Native 0.87 계열 기반
- OP-SQLite + SQLCipher + FTS5 local DB
- OS secure key storage로 DB key 분리

아직 사용자에게 남아 있는 비차단 제품 결정은 실제 앱의 한국어/영어 표시 이름이다.
