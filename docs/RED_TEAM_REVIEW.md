# PRD 레드팀 검토

- 검토일: 2026-09-04
- 대상: `docs/PRD.md`, `docs/WHY_GRAPH.md`, `docs/OPEN_DECISIONS.md`
- 목적: 구현 전에 제품, 데이터 모델, 장기 사용성, 개인정보, iOS 플랫폼 제약에서 실패할 가능성이 높은 지점을 찾는다.

## 요약

현재 제품 방향은 충분히 차별화되어 있지만, 그대로 구현하면 다음 위험이 크다.

1. PRD의 기존 단일 모델과 Why Graph 모델이 서로 충돌한다.
2. Why Graph 문서의 일부 관계는 현재 타입 정의로 저장 자체가 불가능하다.
3. 상시 노출과 단일 현재 메시지 정책 때문에 다수의 중요한 원칙이 영구적으로 가려질 수 있다.
4. 잠금화면 공개성과 개인 회고 데이터의 민감성이 충돌한다.
5. App Group에 어떤 데이터를 공유할지 보안 경계가 정의되지 않았다.
6. 수년간 데이터를 쌓는 제품인데 백업과 내보내기가 너무 늦게 배치되어 있다.
7. 연말의 후회만을 중심으로 하면 장기적으로 부정적인 회고 편향이 생기고, 잘한 것을 유지하는 학습이 빠진다.
8. 그래프가 커졌을 때 중복 노드, 충돌하는 동기, 관계 변화, 삭제와 병합 정책이 부족하다.
9. WidgetKit 갱신은 정확한 시각을 보장하지 않으므로 FocusWindow 같은 미래 기능이 위젯을 즉시 바꾼다고 가정하면 안 된다.
10. 저장소가 공개 상태이므로 실제 개인 기록이나 실제 사용자 데이터가 테스트 데이터나 문서에 들어가면 즉시 외부 공개된다.

---

# A. 구현 전에 반드시 해결해야 하는 Blocker

## B-01. `Commitment`의 소스 오브 트루스가 두 개다

### 문제

`PRD.md`에는 별도 `Commitment` 타입이 있고 `reflectionItemId`를 직접 가진다.

`WHY_GRAPH.md`에서는 `Commitment`를 `MeaningNode(kind='commitment')`의 한 종류로 취급한다.

두 모델이 동시에 유지되면 다음 문제가 생긴다.

- 어떤 테이블이 실제 Commitment의 원본인지 불명확하다.
- 제목, 상태, 생성 시각 등이 중복 저장될 수 있다.
- 하나의 Commitment가 여러 ReflectionItem, Motive, Goal에 연결되는 Why Graph의 목적과 `reflectionItemId` 단일 FK가 충돌한다.

### 권장 수정

`Commitment`를 별도 독립 엔티티로 두지 않고 다음 중 하나로 통합한다.

권장안:

- 공통 필드: `MeaningNode`
- 종류별 상세 필드: `CommitmentDetail`, `GoalDetail`, `PracticeDetail` 등 1:1 상세 테이블
- 모든 연결은 `MeaningRelation`으로 표현

즉, `Commitment.reflectionItemId`를 제거하고 회고 출처도 관계 또는 Provenance 모델로 표현한다.

---

## B-02. `derived_from` 관계를 현재 스키마로 저장할 수 없다

### 문제

관계 정의에서는 다음을 허용한다.

`Motive, Goal, Commitment -> ReflectionItem`

그러나 현재 `MeaningRelation`은 다음 필드만 가진다.

```ts
fromNodeId: string;
toNodeId: string;
```

두 끝점 모두 MeaningNode라고 가정한다. `ReflectionItem`은 MeaningNode가 아니므로 문서에 정의한 `derived_from`을 저장할 수 없다.

### 권장 수정

가장 단순한 방식은 출처를 일반 의미 관계와 분리하는 것이다.

```ts
ProvenanceLink {
  subjectNodeId: string;
  sourceType: 'reflection_item' | 'origin_moment' | 'meaning_check_in';
  sourceId: string;
  createdAt: string;
}
```

`MeaningRelation`은 MeaningNode 간 의미 관계만 담당한다.

---

## B-03. `OriginMoment` 문서 요구사항과 타입이 불일치한다

### 문제

문서에서는 최초 시점의 다음 데이터를 보존한다고 되어 있다.

- 최초 원문
- 당시 맥락
- 최초 연결 이유
- 최초 관계

하지만 실제 타입에는 관계 스냅샷이 없다.

따라서 이후 관계가 변경되면 최초 그래프가 어땠는지 복원할 수 없다.

### 권장 수정

`OriginMoment` 생성 시점의 관계 ID 또는 별도 Snapshot 구조를 저장한다.

단, 전체 그래프 JSON 복제보다는 `OriginRelationSnapshot[]`처럼 필요한 관계만 저장한다.

---

## B-04. `MeaningCheckIn`이 노드 단위라서 "어떤 이유가 변했는지" 알 수 없다

### 문제

예를 들어 `돈 모으기` Goal에 세 Motive가 연결되어 있을 수 있다.

- 미래 가정 준비
- 경제적 선택권
- 또래 비교

사용자가 "또래 비교라는 이유는 이제 중요하지 않다"라고 기록해도 현재 `MeaningCheckIn.subjectNodeId`는 `돈 모으기`만 가리킨다.

어느 관계가 약해졌는지 표현할 수 없다.

### 권장 수정

Check-In의 대상을 노드 또는 관계로 확장한다.

```ts
subjectType: 'node' | 'relation';
subjectId: string;
```

이렇게 해야 특정 Motive 연결만 약화, 재해석, 종료할 수 있다.

---

## B-05. PRD 구현 마일스톤에 Why Graph P0가 반영되지 않았다

### 문제

`WHY_GRAPH.md`는 다대다 관계, OriginMoment, MeaningCheckIn, Why Trail을 P0로 정의한다.

그러나 `PRD.md`의 Milestone 2, 3은 여전히 ReflectionItem과 단일 Commitment 중심이다.

문서대로 개발하면 데이터 구조를 단일 모델로 먼저 만든 뒤 다시 뜯어고칠 수 있다.

### 권장 수정

Milestone 1의 데이터 스키마 단계부터 다음을 포함한다.

- MeaningNode
- MeaningRelation
- ProvenanceLink
- OriginMoment
- MeaningCheckIn
- 관계 이력

UI는 단순하게 시작해도 데이터 구조는 처음부터 다대다를 지원한다.

---

# B. 제품 핵심 가치가 무너질 수 있는 위험

## P-01. 상시 노출인데 실제로는 하나만 보인다

### 문제

모든 Commitment를 `persistent`로 유지해도 잠금화면에는 하나만 표시한다.

따라서 "상시 보존"과 "상시 노출"이 실제로는 같은 뜻이 아니다.

낮은 우선순위 원칙은 몇 달 또는 몇 년 동안 한 번도 보이지 않을 수 있다.

### 현재 알고리즘의 추가 문제

동일 우선순위에서 `lastConfirmedAt`이 최근인 항목을 우선하면, 사용자가 최근에 본 항목이 다시 선택된다.

즉, 노출된 항목을 확인할수록 다시 노출되는 자기강화 루프가 생긴다.

### 권장 수정

세 개념을 분리한다.

1. `retained`: 계속 보존할 가치가 있는가
2. `eligibleForLockscreen`: 잠금화면 후보인가
3. `activeAnchor`: 현재 잠금화면 대표 문장인가

그리고 잠금화면은 `activeAnchor` 하나를 유지하되 앱 내부에는 별도의 `Review Queue`를 둔다.

Review Queue는 오랫동안 확인하지 않은 중요한 원칙을 주기적으로 다시 보여준다.

무작위 회전은 하지 않는다.

---

## P-02. 장기 노출의 가장 큰 리스크인 익숙해짐이 P1로 밀려 있다

### 문제

제품의 핵심이 "계속 보기"인데 장기 노출로 인한 시각적 익숙해짐은 제품 가치의 핵심 실패 조건이다.

현재는 재검토 기능이 P1이다.

### 권장 수정

P0에 최소한 다음 기능을 포함한다.

- 현재 문장 `다시 읽기`
- `아직 중요한가요?`
- `지금 표현으로 다시 쓰기`
- 마지막 의미 확인 시점 표시

정기 알림은 P1이어도 되지만, 사용자가 스스로 의미를 다시 잡을 수 있는 진입점은 P0에 있어야 한다.

---

## P-03. 연말 회고가 "후회"에 과도하게 편향되어 있다

### 문제

사용자가 실제로 유지해야 할 것은 후회에서 나온 변화만이 아니다.

예를 들어 다음도 중요한 학습이다.

- 올해 잘해서 계속 유지하고 싶은 것
- 예상보다 효과가 좋았던 습관
- 우연히 발견한 중요한 가치
- 자랑스럽게 느낀 선택
- 큰 사건 없이도 새롭게 생긴 욕망이나 미래상

현재 `ReflectionItem.regret` 중심 모델은 모든 의미의 출처를 부정적인 경험으로 밀어 넣는다.

### 권장 수정

`ReflectionItem`에 종류를 둔다.

```ts
kind:
  | 'regret'
  | 'lesson'
  | 'worked_well'
  | 'proud_moment'
  | 'turning_point'
  | 'new_desire'
  | 'freeform';
```

제품 철학은 "후회를 행동 변화에 활용한다"를 유지하되, 의미 그래프의 입력은 후회보다 넓게 허용한다.

---

## P-04. 목표를 종료하는 이유가 너무 단순하다

### 문제

현재 `retired`는 서로 다른 상태를 섞는다.

- 달성해서 끝남
- 더 이상 중요하지 않음
- 이유가 잘못됐다고 판단함
- 상황상 불가능해짐
- 나중으로 미룸
- 다른 목표로 대체됨

이 차이는 다음 회고에서 매우 중요하다.

### 권장 수정

종료 시 `closureReason`을 남긴다.

```ts
'achieved' | 'no_longer_matters' | 'superseded' | 'deferred' | 'cancelled' | 'other'
```

`retired`를 실패 의미로 사용하지 않는다.

---

## P-05. 서로 충돌하는 중요한 가치에 대한 UX가 없다

### 문제

`conflicts_with` 관계는 정의되어 있지만 무엇을 할지는 정의되어 있지 않다.

예:

- 돈을 모으고 싶다
- 지금 경험에도 돈을 쓰고 싶다
- 커리어를 우선하고 싶다
- 관계에도 시간을 쓰고 싶다

둘 중 하나가 틀린 것이 아닐 수 있다.

### 권장 수정

P1에 `Trade-off Check-In`을 추가한다.

사용자는 다음을 기록한다.

- 지금 어떤 두 가치가 충돌하는가
- 이번 상황에서는 어느 쪽을 더 우선했는가
- 그 이유는 무엇인가
- 이 결정이 영구 원칙인지 이번 상황만의 판단인지

---

## P-06. 의미 그래프의 노드 종류가 실제 사용자 생각과 완전히 분리되지 않는다

### 문제

다음 문장은 상황에 따라 여러 타입으로 해석될 수 있다.

`경제적으로 선택권이 있는 사람이 되고 싶다.`

- Vision으로 볼 수 있다.
- Motive로도 볼 수 있다.
- Commitment처럼 사용할 수도 있다.

사용자에게 노드 타입을 정확히 고르게 하면 기록 자체가 귀찮아질 수 있다.

### 권장 수정

내부적으로 타입을 유지하더라도 사용자 UI에서는 처음부터 `Motive`, `Vision` 같은 분류를 강요하지 않는다.

자연어 질문으로 입력받고 필요하면 나중에 분류하거나 재분류한다.

재분류가 데이터 ID나 연결을 깨뜨려서는 안 된다.

---

## P-07. 같은 의미가 중복 입력될 때 그래프가 파편화된다

### 문제

수년 동안 사용하면 다음이 각각 다른 노드로 생길 수 있다.

- 경제적 선택권
- 돈 때문에 선택을 포기하지 않는 삶
- 경제적으로 자유로운 사람

사용자에게는 같은 의미일 수 있다.

### 권장 수정

P1에 `병합 Merge` 기능을 둔다.

- 두 노드를 하나로 병합
- 이전 ID와 관계 이력 보존
- OriginMoment는 각각 유지
- 병합을 취소할 수 있는 이력 보존

AI 자동 병합은 하지 않는다.

---

## P-08. 편집 이력이 부족하다

### 문제

OriginMoment는 최초 상태만 보존한다.

그 이후 사용자가 Node 제목이나 설명을 여러 번 수정하면 `updatedAt`만 남고 중간 변화가 사라진다.

이 제품의 핵심이 "의미가 어떻게 변했는지"인데 일반 편집으로 의미가 바뀌면 그 역사가 소실된다.

### 권장 수정

모든 사소한 오타까지 버전 관리할 필요는 없다.

다만 사용자가 `의미를 바꿔 수정`을 선택한 경우 `MeaningRevision` 또는 `MeaningEvent`를 남긴다.

단순 오탈자 수정과 의미 변화 수정은 UX에서 구분할 수 있다.

---

## P-09. formal 회고가 아닌 순간의 깨달음을 넣는 경로가 없다

### 문제

사용자는 연말 회고 중이 아닐 때도 갑자기 다음을 깨달을 수 있다.

- 내가 이걸 왜 원하는지 알겠다.
- 예전 목표가 더 이상 중요하지 않다.
- 새로운 미래상을 발견했다.

현재 구조는 ReflectionSession 중심이라 즉시 캡처 경로가 약하다.

### 권장 수정

홈에 `지금 떠오른 생각 기록`을 제공한다.

이 기록은 회고 세션 없이도 OriginMoment 또는 별도 `InsightMoment`로 생성할 수 있다.

나중에 기존 Goal, Motive, Vision과 연결한다.

---

# C. 개인정보와 보안

## S-01. 잠금화면에 표시되는 문장은 사실상 공개 정보다

### 문제

잠금화면은 다른 사람이 볼 수 있다.

이 제품이 다루는 원문에는 관계, 신체, 돈, 진로, 후회 등 민감한 내용이 들어갈 수 있다.

Apple도 Lock Screen Widget에 민감 정보가 포함될 수 있으므로 `privacySensitive`와 redaction을 고려하라고 안내한다.

하지만 위젯 전체를 잠긴 상태에서 가리면 이 앱의 핵심 가치도 약해진다.

### 권장 수정

각 Commitment에 내부 원문과 별개로 `publicSafeMessage`를 둔다.

잠금화면에 처음 표시하기 전에 다음을 명시적으로 확인한다.

`이 문장은 휴대전화가 잠겨 있어도 주변 사람이 볼 수 있습니다.`

선택 모드:

1. 항상 보이는 공개 안전 문구
2. 잠겨 있을 때 가리는 민감 문구

Why Graph의 원문은 절대 기본 잠금화면 데이터로 사용하지 않는다.

참고:
- https://developer.apple.com/documentation/WidgetKit/Creating-a-Widget-Extension

---

## S-02. App Group에 전체 DB를 두면 안 된다

### 문제

Widget과 앱이 데이터를 공유하려고 전체 Why Graph DB를 App Group 컨테이너에 두면 민감 정보의 노출 경계가 넓어진다.

Apple은 사용자 개인 데이터 파일에는 강한 Data Protection을 적용하라고 권고한다.

### 권장 수정

두 저장 영역을 분리한다.

#### Private Store

앱 샌드박스 내부.

- Reflection
- Motive
- Vision
- Goal
- Practice
- 모든 OriginMoment
- MeaningCheckIn
- 관계 이력

가능한 강한 Data Protection 적용.

#### Widget Payload Store

App Group 공유 영역.

- 현재 `publicSafeMessage`
- 화면 표시용 최소 ID
- 업데이트 시각
- 필요한 최소 스타일 정보

전체 Why Graph DB를 Widget Extension과 공유하지 않는다.

참고:
- https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files
- https://developer.apple.com/documentation/WidgetKit/Developing-a-WidgetKit-strategy

---

## S-03. 앱 자체 잠금이 없다

### 문제

잠금화면에는 안전한 문장만 보여도 앱을 열면 매우 개인적인 기록 전체가 보인다.

### 권장 수정

공개 배포 전에 선택형 Face ID/Touch ID 앱 잠금을 검토한다.

본인 사용 MVP에서도 민감한 실제 데이터를 넣기 시작하면 P1보다 앞당길 가치가 있다.

---

## S-04. `JSON 내보내기`는 민감 데이터에 너무 약한 기본안이다

### 문제

몇 년간 쌓인 Why Graph를 평문 JSON으로 내보내면 Files, 메일, 메신저, 클라우드 드라이브 등에 그대로 남을 수 있다.

### 권장 수정

장기적으로는 `암호화된 내보내기 파일`을 기본으로 한다.

최소한 평문 JSON을 제공한다면 다음을 반드시 포함한다.

- 명시적인 민감 데이터 경고
- 사용자의 재확인
- 파일에 포함될 데이터 범위 미리보기

---

## S-05. 전체 삭제의 범위가 불명확하다

### 문제

`전체 앱 데이터 삭제`를 눌러도 다음은 앱 밖에 남을 수 있다.

- App Group Widget Payload
- Widget Timeline 캐시
- 생성해 사진 보관함에 저장한 이미지
- 현재 적용 중인 배경화면
- 이미 내보낸 백업 파일

### 권장 수정

삭제 UX에서 범위를 명확히 구분한다.

앱이 직접 지울 수 있는 항목은 모두 삭제하고 Widget Timeline을 갱신한다.

앱이 지울 수 없는 사진, 배경화면, 외부 백업은 별도로 안내한다.

---

## S-06. 현재 GitHub 저장소가 Public이다

### 문제

현재 `Jiyeong-kor/future-self-lockscreen` 저장소는 Public 상태이다.

PRD에는 실제 개인 경험에서 나온 예시가 이미 들어 있다.

향후 실제 테스트 데이터, 내보내기 파일, 스크린샷, 개인 회고 seed가 커밋되면 그대로 공개된다.

### 권장 수정

선택지는 두 가지이다.

1. 저장소 자체를 Private로 변경
2. 코드는 Public으로 유지하되 모든 문서와 fixture는 가상 예시만 사용하고 실제 개인 데이터는 절대 Git에 넣지 않음

최소 요구사항:

- 개인 export 파일 gitignore
- SQLite DB gitignore
- 사용자 사진 gitignore
- 실사용 스크린샷 검토
- 테스트 fixture는 합성 데이터만 사용

---

# D. iOS WidgetKit 현실 제약

## I-01. 사용자가 Widget을 직접 잠금화면에 추가해야 한다

앱 설치만으로 잠금화면 Widget이 자동 배치되는 것을 전제로 하면 안 된다.

Apple의 사용자 흐름상 잠금화면을 길게 누르고 사용자가 직접 Widget을 추가한다.

따라서 온보딩 완료 조건에 `위젯 추가 확인`을 포함하는 편이 좋다.

참고:
- https://support.apple.com/ko-kr/118610

---

## I-02. Widget 갱신은 정확한 시각을 보장하지 않는다

WidgetKit Timeline의 날짜는 정확한 실행 예약이 아니다. Apple은 Widget이 지정한 시각보다 늦게 갱신될 수 있다고 명시한다.

또한 각 Widget의 일일 Refresh 횟수에는 시스템 예산이 있다.

### 영향

P1의 `FocusWindow 시작 순간 정확히 현재 메시지를 변경한다`는 요구사항을 Widget에서 강하게 보장하면 안 된다.

### 권장 수정

- 앱에서 변경한 메시지는 `WidgetCenter.reloadTimelines`로 갱신 요청
- 예약된 미래 변경은 Timeline에 미리 넣을 수 있는 범위에서 준비
- 제품 문구는 `즉시 변경`이 아니라 `갱신`으로 표현
- 시간 민감도가 높은 알림 시스템으로 Widget을 사용하지 않음

참고:
- https://developer.apple.com/documentation/widgetkit/timeline
- https://developer.apple.com/documentation/widgetkit/timelineprovider

---

## I-03. Wallpaper용 문장과 accessoryRectangular 문장이 같은 길이일 수 없다

### 문제

현재 하나의 `lockscreenMessage`를 이미지와 Widget에서 공통 사용한다.

그러나 잠금화면 이미지에는 비교적 긴 문장을 넣을 수 있지만 `accessoryRectangular`은 표시 공간이 매우 작다.

### 권장 수정

문구를 분리한다.

```ts
fullMessage: string;
wallpaperMessage?: string;
widgetMessage: string;
```

사용자가 직접 각각 수정할 수 있게 하고, 앱은 최초 생성 시 같은 문장을 복사해 시작한다.

자동 요약은 MVP에서 하지 않는다.

---

## I-04. 사용자는 여러 잠금화면과 Focus를 쓸 수 있다

Apple은 여러 잠금화면을 만들고 특정 Focus와 연결할 수 있다.

앱은 특정 Widget이 항상 모든 잠금화면에 존재한다고 가정하면 안 된다.

P1에서는 `이 위젯을 어떤 잠금화면에서 사용하고 있는지 앱이 완전히 통제할 수 없다`는 제약을 문서화한다.

참고:
- https://support.apple.com/ko-kr/guide/iphone/iph4d0e6c351/ios

---

# E. 장기 데이터 축적에서 생기는 문제

## L-01. 수년간 사용할 제품인데 백업이 너무 늦다

### 문제

이 앱의 차별점은 시간이 지날수록 의미의 역사가 쌓인다는 것이다.

그런데 자동 백업은 제외하고 수동 내보내기는 P1이다.

초기 사용 중 기기 분실이나 앱 삭제가 발생하면 제품의 핵심 자산이 사라진다.

### 권장 수정

MVP 첫 사용 검증이 끝나는 즉시 `안전한 수동 백업`을 다음 안정화 마일스톤으로 올린다.

공개 출시 전에 복원 테스트까지 필수로 한다.

---

## L-02. 삭제와 그래프 참조 무결성 정책이 없다

노드를 삭제할 때 연결 관계, OriginMoment, MeaningCheckIn, ReflectionItem이 어떻게 되는지 정의가 필요하다.

### 권장 기본값

일반 UI의 `삭제`는 휴지통 또는 soft delete로 처리한다.

완전 삭제 시:

- 관련 MeaningRelation 제거
- 관련 Widget Payload 정리
- CheckIn과 OriginMoment 처리 여부를 사용자에게 명시
- 고립 노드 검출
- Why Trail 캐시 무효화

완전 삭제 정책은 테스트 항목으로 만든다.

---

## L-03. 노드 상태 이력이 없다

`MeaningNode.status`는 현재 상태만 보존한다.

`active -> paused -> active -> retired` 같은 변화의 시간축을 복원하기 어렵다.

### 권장 수정

`MeaningStatusEvent` 또는 일반 `MeaningEvent` 테이블을 둔다.

최소 기록:

- 대상
- 변경 전 상태
- 변경 후 상태
- 시각
- 선택적 이유

---

## L-04. 그래프 순환을 억지로 막는 규칙이 오히려 잘못될 수 있다

현재 문서에서는 `supports`, `conflicts_with`를 제외한 순환을 제한한다.

그러나 실제 의미 관계는 순환적으로 느껴질 수 있다.

예를 들어 좋은 건강이 업무 수행을 돕고, 안정된 업무가 다시 건강 관리 여력을 높일 수 있다.

### 권장 수정

데이터 저장 단계에서 모든 순환을 금지하기보다 Why Trail 탐색 시 `visited node` 집합으로 무한 순회를 막는다.

관계 타입별로 정말 금지해야 하는 직접 자기참조만 제한한다.

---

## L-05. 검색과 탐색 전략이 없다

몇 년만 사용해도 Motive, Goal, Practice, ReflectionItem이 늘어난다.

그래프 시각화만으로는 원하는 기록을 찾기 어렵다.

### 권장 수정

P1에 최소 다음을 포함한다.

- 전체 검색
- 종류 필터
- 활성/종료 필터
- 연도별 회고 필터
- 연결되지 않은 노드 보기
- 최근 의미 확인이 오래된 항목 보기

---

# F. UX 운영 위험

## U-01. 회고 작성 중단과 Draft 정책이 없다

질문형 회고는 여러 단계다. 사용자가 중간에 앱을 닫을 가능성이 높다.

### 권장 수정

- 각 단계 자동 저장
- Draft 상태
- 마지막 질문부터 이어하기
- 완료되지 않은 회고를 삭제하거나 계속할 수 있음

P0에 포함한다.

---

## U-02. 삭제 Undo가 없다

그래프 데이터는 한 항목을 삭제할 때 여러 연결에 영향을 준다.

즉시 물리 삭제하면 실수 비용이 크다.

### 권장 수정

기본 삭제는 휴지통 이동.

최종 삭제는 별도 확인 후 수행한다.

---

## U-03. "왜 시작했지?"가 순환하거나 너무 많은 갈래로 퍼질 수 있다

Why Trail에서 모든 상위 이유를 한꺼번에 보여주면 몇 년 뒤 읽기 어려워진다.

### 권장 수정

- 기본은 1단계만 펼침
- 사용자가 더 보기 선택
- active 관계 우선
- 사용자가 직접 `핵심 이유`를 하나 이상 표시할 수 있게 함
- 전체 그래프는 별도 화면

---

# G. 우선순위 재조정 권장안

## 구현 전에 즉시 수정

1. PRD와 Why Graph의 Commitment 모델 통합
2. `derived_from` 스키마 오류 수정
3. Node/Relation 대상 Check-In 지원
4. P0 마일스톤에 Why Graph 데이터 구조 반영
5. Private Store와 Widget Payload Store 분리
6. `publicSafeMessage` 또는 동등한 잠금화면 공개 문구 모델 추가

## P0에 추가

1. 회고 Draft 자동 저장
2. `왜 시작했지?` Why Trail
3. MeaningCheckIn
4. 최소 의미 재확인 UX
5. soft delete와 Undo
6. `ReflectionItem.kind`
7. `widgetMessage`와 긴 문장 분리

## MVP 직후 안정화로 승격

1. 안전한 내보내기와 복원
2. MeaningEvent 상태 이력
3. 검색
4. 노드 병합
5. 관계 충돌 검토

## P1 유지 가능

1. 전체 그래프 시각화
2. FocusWindow
3. Android 직접 잠금화면 적용
4. AI 연결 후보 제안

---

# H. 추가로 사용자 결정이 필요한 항목

현재 `OPEN_DECISIONS.md`는 핵심 결정을 모두 마쳤다고 쓰고 있지만 Why Graph 추가 후 다시 열어야 할 결정이 생겼다.

### D-12. 잠금화면 개인정보 기본 정책

권장:

- 기본은 `공개되어도 괜찮은 별도 문구`를 사용
- 사용자가 원하면 잠긴 상태에서 redaction되는 민감 모드 제공

### D-13. 회고 입력 범위

권장:

- 후회만이 아니라 `잘한 점, 배움, 전환점, 새 욕망`도 ReflectionItem으로 허용
- 제품의 진입 질문은 여전히 "반복하고 싶지 않은 후회"에서 시작 가능

### D-14. 장기 백업

권장:

- 자동 클라우드 백업은 계속 제외
- 단순 평문 JSON 대신 사용자 주도 안전한 내보내기를 조기에 제공

### D-15. 여러 원칙의 재노출 정책

권장:

- 잠금화면 대표 문장은 하나 유지
- 다른 persistent 원칙은 Review Queue에서 의도적으로 재검토
- 무작위 자동 회전은 사용하지 않음

---

# 결론

현재 PRD의 가장 큰 위험은 기능 부족이 아니다.

오히려 제품이 `잠금화면 문장 앱`에서 `개인 의미 그래프`로 확장되면서, 초기 데이터 모델과 구현 마일스톤이 그 변화를 완전히 따라오지 못한 것이 가장 큰 문제다.

먼저 소스 오브 트루스를 하나로 통합하고, 잠금화면 공개 데이터와 개인 원문을 보안적으로 분리한 뒤 구현해야 한다.

그 다음 핵심 제품 가치는 다음 두 질문으로 검증하는 것이 좋다.

1. 몇 달 뒤에도 사용자가 이 문장을 실제로 읽고 의미를 회복하는가?
2. 몇 년 뒤에도 사용자가 자신의 과거 이유와 현재 이유가 어떻게 달라졌는지 이해할 수 있는가?
