# Future Self Lockscreen v0.4 2차 레드팀 검토

- 검토일: 2026-09-04
- 대상: `PRD.md`, `PRODUCT_RULES_V04.md`, `WHY_GRAPH.md`, `REFLECTION_MODEL.md`, `SYNTHESIS_MODEL.md`, `BLOCK_CANVAS.md`, `OPEN_DECISIONS.md`
- 목적: v0.4에서 1차 레드팀 수정 이후에도 남아 있는 구현 모순, 장기 데이터 무결성 문제, 개인정보 위험, 제품 실패 가능성을 찾는다.

## 결론

v0.4는 제품 방향이 상당히 정교해졌지만 아직 바로 전체 P0 구현에 들어가면 위험하다.

가장 큰 문제는 다음과 같다.

1. P0 범위가 MVP라 부르기 어려울 정도로 커졌다.
2. 기록 수정과 출처 보존 정책이 충돌한다.
3. Synthesis와 Provenance를 합치면 간접 순환이 생길 수 있다.
4. 현재 대표 문장 `activeAnchor`을 실제로 누가 어떻게 바꾸는지가 아직 정의되지 않았다.
5. 잠금화면 승인 문장은 내부 원칙이 바뀌어도 과거 승인이 그대로 살아남을 수 있다.
6. 민감 데이터의 App Group 경계는 정의됐지만 Private Store 자체의 iOS Data Protection, 앱 전환기 스냅샷 보호 등은 아직 없다.
7. 삭제, 병합, 복원 같은 파괴적 연산의 트랜잭션 규칙이 부족하다.
8. 여러 문서가 서로 덮어쓰는 구조라 구현 소스 오브 트루스가 다시 분산돼 있다.
9. 공개 저장소 규칙과 현재 문서에 들어간 실제 개인 경험 기반 예시가 충돌한다.
10. 제품이 행동을 돕는 도구가 아니라 자기분석과 그래프 정리 자체에 시간을 쓰는 도구로 변할 위험이 있다.

---

# A. 구현 전에 해결할 Blocker

## B2-01. P0 범위가 너무 크다

### 문제

현재 P0에는 다음이 동시에 포함된다.

- 빠른 기록
- 여러 종류의 회고
- Synthesis
- Why Graph
- MeaningNode 종류별 Detail
- Provenance
- OriginMoment
- MeaningCheckIn
- Focus Board
- Drag and Drop
- Why Trail
- Review Queue
- 잠금화면 공개 승인
- 이미지 생성
- WidgetKit

이는 하나의 제품 가설을 검증하는 MVP보다 플랫폼과 개인 지식 시스템을 동시에 구축하는 수준에 가깝다.

### 실패 가능성

- 잠금화면 반복 노출의 실제 효용을 검증하기 전에 그래프 엔진 개발에 많은 시간이 들어간다.
- 구현 중 도메인이 계속 변하면서 DB 마이그레이션 비용이 커진다.
- 사용자 한 명의 실제 사용 피드백을 받기 전에 UI가 과설계될 수 있다.

### 권장

P0를 세 개의 수직 슬라이스로 나눈다.

#### Slice A. 가장 짧은 가치 루프

`빠른 기록 또는 직접 Commitment 작성 → publicSafeMessage 승인 → iOS Widget 표시 → 의미 다시 확인`

#### Slice B. 의미 연결

`Capture/Reflection → Motive/Vision/Goal/Practice/Commitment → Why Trail`

#### Slice C. 축적과 종합

`여러 기록 → SynthesisInsight → 새 의미 노드`

DnD는 데이터 모델을 검증한 뒤 Slice B/C에 붙인다.

---

## B2-02. 수정 가능한 원문과 불변 Provenance가 충돌한다

### 문제

`CaptureEntry`, `ReflectionItem`, `SynthesisInsight`는 모두 수정 가능한 모델이다.

그러나 제품 철학은 다음을 요구한다.

- 그때 실제로 무엇을 적었는지 보존
- 어떤 기록을 근거로 어떤 인사이트를 만들었는지 복원

예를 들어 2026-09-04의 CaptureEntry를 근거로 Synthesis를 만든 뒤 CaptureEntry 본문을 수정하면, 나중에는 Synthesis가 실제로 어떤 문장을 근거로 만들어졌는지 알 수 없다.

### 권장

모든 출처 객체에 revision을 도입한다.

```ts
RecordRevision {
  id: string;
  objectType: 'capture_entry' | 'reflection_item' | 'synthesis_insight';
  objectId: string;
  revision: number;
  contentSnapshot: string;
  metadataSnapshot?: string;
  createdAt: string;
}
```

Provenance와 SynthesisSourceLink는 `sourceId`뿐 아니라 `sourceRevisionId`를 고정한다.

현재 화면에서는 최신 revision을 보여주고 Why Trail에서는 당시 사용된 revision을 보여줄 수 있어야 한다.

---

## B2-03. Synthesis와 Provenance를 합치면 간접 인과 순환이 가능하다

### 문제

현재 SynthesisSourceType에는 `meaning_node`가 포함될 수 있다.

또 MeaningNode는 SynthesisInsight를 Provenance source로 가질 수 있다.

따라서 다음이 문서상 가능하다.

```text
Goal A
→ Synthesis X의 근거
→ Synthesis X에서 Goal A가 도출됨
```

SynthesisInsight 사이의 DAG 검사만으로는 이 순환을 막지 못한다.

더 복잡하게는 여러 Node와 Synthesis를 거치는 순환도 가능하다.

### 권장

`causal provenance graph` 전체에 대해 순환을 금지한다.

출처 방향은 항상 과거 근거에서 새 결론 쪽으로만 흐르도록 한다.

새 Provenance/SynthesisSourceLink를 만들기 전에 대상에서 출처로 이미 도달 가능한 경로가 있는지 검사한다.

---

## B2-04. `activeAnchor` 선택 정책이 미완성이다

### 문제

v0.4는 최근 확인한 항목이 계속 이기는 자기강화 규칙을 폐기했다.

하지만 현재 대표 문장을 무엇으로 선택하고 언제 바꾸는지에 대한 새 규칙은 명확하지 않다.

남아 있는 질문:

- P0에서는 사용자가 직접 지정하는가?
- 우선순위가 높은 항목이 자동으로 대표가 되는가?
- Review Queue에서 재확인한 항목이 대표로 바뀌는가?
- 새 Commitment를 만들면 기존 대표를 대체하는가?
- FocusWindow가 나중에 대표 문장을 자동으로 바꿀 수 있는가?

### 권장

P0에서는 단순하게 한다.

- `activeAnchor` 변경은 사용자 명시 동작으로만 한다.
- 새 Commitment 생성은 후보만 추가한다.
- Review Queue는 대표 변경을 제안할 수 있지만 자동 변경하지 않는다.
- FocusWindow 자동 변경은 P1에서 별도 검증한다.

이렇게 해야 사용자가 승인한 잠금화면 문장이 예상치 못하게 바뀌지 않는다.

---

## B2-05. 잠금화면 승인에 버전 개념이 없다

### 문제

현재 `LockscreenProjection`에는 `approvedForLockscreen`, `approvedAt`만 있다.

내부 Commitment 의미가 크게 바뀌어도 과거 `publicSafeMessage`가 승인 상태로 계속 남을 수 있다.

또 publicSafeMessage 자체를 수정한 경우 어떤 버전에 사용자가 승인했는지 명시적 연결이 없다.

### 권장

승인을 내용 revision에 묶는다.

```ts
LockscreenProjection {
  commitmentNodeId: string;
  projectionRevision: number;
  publicSafeMessage: string;
  contentHash: string;
  approvedContentHash?: string;
  approvedAt?: string;
}
```

`contentHash !== approvedContentHash`이면 잠금화면 출력 불가 상태로 되돌린다.

내부 Commitment 수정이 publicSafeMessage와 의미적으로 독립적인 경우에는 자동 승인 취소 여부를 제품 규칙으로 별도 정의한다.

---

## B2-06. 민감 Private Store 보호 수준이 정의되지 않았다

### 문제

App Group에 최소 데이터만 넣는 결정은 맞다.

하지만 CaptureEntry, ReflectionItem, Motive, Vision, MeaningCheckIn 등 실제 민감 데이터 파일의 iOS 파일 보호 수준이 없다.

앱이 백그라운드로 가면 iOS는 앱 전환기에 보여줄 UI snapshot을 만든다. 민감한 회고 화면이 그대로 snapshot에 남을 수도 있다.

### 권장

P0 개인정보 요구사항에 다음을 넣는다.

- Private DB 파일은 가능한 가장 강한 iOS Data Protection 정책을 사용한다.
- 잠긴 상태에서 Private DB를 읽어야 하는 백그라운드 요구사항을 만들지 않는다.
- 앱이 비활성화되거나 백그라운드로 갈 때 민감 화면을 가려 app switcher snapshot에 원문이 남지 않게 한다.
- 잠금화면 Widget용 App Group Projection은 Private DB와 별도 파일로 둔다.
- 향후 선택형 Face ID 앱 잠금 여부를 검토한다.

---

## B2-07. 문서 소스 오브 트루스가 다시 분산되어 있다

### 문제

현재 구조는 다음과 같다.

- PRD v0.3
- PRODUCT_RULES_V04가 충돌 시 우선
- WHY_GRAPH가 도메인 상세 정의
- REFLECTION_MODEL이 ReflectionItem 정의
- SYNTHESIS_MODEL이 출처 구조를 확장
- BLOCK_CANVAS가 관계 가능 타입을 사실상 다시 정의

구현자가 어떤 필드와 불변 조건이 최신인지 여러 문서를 비교해야 한다.

### 권장

구현 시작 전에 다음으로 정리한다.

1. `PRD.md`를 v0.4로 실제 갱신한다.
2. `DOMAIN_SCHEMA.md`를 canonical schema로 만든다.
3. relation 허용 규칙과 invariant를 machine-readable에 가까운 표로 정의한다.
4. PRODUCT_RULES/RED_TEAM 문서는 결정 이력으로 남긴다.

`충돌 시 다른 문서를 우선한다`는 규칙은 개발 시작 전에 제거하는 것이 좋다.

---

## B2-08. 공개 저장소 정책이 현재 문서와 충돌한다

### 문제

v0.4는 Public 저장소에 실제 개인 회고 원문과 개인 데이터를 커밋하지 않는다고 확정했다.

하지만 현재 기획 문서에는 제품 아이디어의 실제 개인 경험에서 직접 나온 예시가 이미 여러 개 들어가 있다.

기술적으로 DB가 아니어도 개인적인 내용이 Public Git history에 남는다는 점은 동일하다.

### 권장

둘 중 하나를 선택한다.

- 저장소를 Private으로 전환한다.
- Public을 유지하려면 모든 문서 예시를 완전히 가상의 사례로 치환한다.

Git history에 이미 들어간 민감 예시는 파일에서 삭제하는 것만으로 완전히 사라지지 않는다는 점도 고려한다.

---

# B. 데이터 무결성에서 추가로 공격할 지점

## D2-01. OriginMoment 최초 관계 snapshot이 아직 명세되지 않았다

1차 레드팀에서는 `OriginMoment`가 최초 관계를 보존한다고 문서에 적혀 있지만 타입에는 관계 snapshot이 없다는 문제가 있었다.

v0.4에서 OriginMoment를 canonical 구조에 포함시켰지만 이 snapshot 요구를 실제 타입으로 해결한 명세는 아직 없다.

권장:

- 최초 연결 관계 revision 목록을 snapshot으로 남기거나
- OriginMoment 생성 시점의 immutable RelationRevision을 참조한다.

---

## D2-02. 관계 타입의 허용 행렬이 한 곳에 없다

BLOCK_CANVAS에는 슬롯 규칙이 있고 WHY_GRAPH에는 관계 타입이 있다.

하지만 DB validation에서 사용할 단일 허용 행렬이 없다.

예:

```text
Goal -> motivated_by -> Motive : 허용
Practice -> contributes_to -> Goal : 허용
Motive -> motivated_by -> Goal : 금지
```

이 규칙을 UI 코드에만 넣으면 import, migration, 테스트 코드에서 잘못된 관계가 들어올 수 있다.

권장:

- `RelationPolicy` 표를 canonical schema에 정의
- fromKind, relationKind, toKind 조합을 한 곳에서 검증

---

## D2-03. symmetric 관계의 canonical 표현이 없다

`conflicts_with`, 일부 `supports`는 사실상 양방향 의미일 수 있다.

A conflicts B와 B conflicts A를 두 행으로 저장할지 한 행으로 저장할지 정해지지 않았다.

정의하지 않으면 중복 관계와 의미 확인 기록이 갈라질 수 있다.

권장:

- symmetric relation은 정렬된 두 ID로 하나만 저장
- 방향 관계와 symmetric 관계를 명시적으로 구분

---

## D2-04. 병합은 단순 alias보다 훨씬 복잡하다

노드를 병합할 때 다음이 함께 처리되어야 한다.

- MeaningRelation 양 끝점 재연결
- Provenance 보존
- MeaningCheckIn 대상 재매핑 또는 과거 대상 유지
- LockscreenProjection 처리
- activeAnchor가 merged node인 경우 재지정
- 관계 중복 제거
- 병합으로 새 순환이 생기지 않는지 검사

따라서 merge는 여러 테이블을 한 트랜잭션에서 처리해야 한다.

P1 UI로 미뤄도 P0 스키마에서 이 가능성을 보장해야 한다.

---

## D2-05. 삭제와 이력 불변 원칙이 충돌한다

제품은 과거 이력을 보존하려 하지만 사용자는 전체 삭제 또는 특정 기록 완전 삭제를 요청할 수 있다.

정의해야 할 것:

- soft retire와 hard delete의 차이
- hard delete 시 OriginMoment/Revision/Provenance/SynthesisSourceLink의 처리
- 삭제된 출처를 사용한 Synthesis를 유지할지
- 백업 파일의 과거 데이터는 앱이 자동 삭제할 수 없다는 고지

권장:

`역사 보존`보다 사용자의 명시적 완전 삭제가 우선한다.

연결 객체는 orphan 상태로 남기기보다 사용자에게 영향을 설명한 뒤 cascade 또는 redacted tombstone 정책을 정의한다.

---

## D2-06. 시간 모델이 장기 이력에 비해 약하다

현재 필드가 대부분 `string` 날짜다.

하지만 장기 기록에서는 다음을 구분할 필요가 있다.

- 실제 사건의 현지 날짜
- 기록한 절대 시각
- 사용자가 날짜를 모르는 경우
- 시간대 이동
- 연말 회고의 대상 기간

권장:

- audit timestamp는 UTC instant
- 인간 의미가 있는 날짜는 LocalDate 계열 의미로 별도 저장
- timezone이 의미 있는 이벤트만 timezone을 보존

---

## D2-07. 백업 복원 방식이 없다

암호화 export 방향은 정했지만 복원 시 현재 DB에 데이터가 이미 있을 수 있다.

정해야 할 것:

- 전체 교체 restore
- 기존 데이터와 merge import
- 동일 UUID 충돌
- 더 높은 schema version 백업을 낮은 버전 앱에서 열었을 때
- 병합 후 alias ID 충돌

권장:

첫 버전은 `새 설치 또는 전체 교체 복원`만 지원하고 merge import는 나중으로 미룬다.

---

# C. 제품/UX 실패 가능성

## P2-01. 빠른 기록 중심 홈의 cold start가 약하다

처음 설치했을 때는 다음이 모두 비어 있다.

- 현재 대표 문장 없음
- 최근 기록 없음
- Review Queue 없음
- 그래프 없음

빠른 기록만 보여주면 사용자는 이 앱이 왜 일반 메모 앱보다 나은지 바로 알기 어렵다.

권장:

첫 사용에는 두 경로를 제공한다.

- `지금 잊고 싶지 않은 한 문장 만들기`: 1~2분 안에 첫 Widget 가치 경험
- `그냥 생각부터 기록하기`: 구조화 없이 시작

첫 가치 경험을 그래프 구축 뒤로 미루지 않는다.

---

## P2-02. Review Queue가 또 하나의 죄책감 Inbox가 될 수 있다

`오랫동안 확인하지 않은 중요한 원칙`이 계속 쌓이면 사용자는 미처리 할 일처럼 느낄 수 있다.

권장:

- badge count를 성과 지표처럼 강조하지 않는다.
- 한 번에 적은 수만 제시한다.
- `나중에 다시 보기`, `당분간 묻지 않기`를 제공한다.
- 미연결 CaptureEntry와 Review Queue를 미완료 업무로 표현하지 않는다.

---

## P2-03. 그래프 정리가 행동을 대신할 수 있다

제품이 정교해질수록 사용자가 실제 행동보다 다음 활동에 더 많은 시간을 쓸 수 있다.

- 노드 분류
- 관계 연결
- 카드 배치
- 문장 다듬기
- 그래프 정리

이는 자기이해 도구가 새로운 형태의 계획 procrastination이 되는 위험이다.

권장:

- 기본 흐름은 기록과 잠금화면에 집중한다.
- 그래프 편집은 필요할 때만 연다.
- 노드 분류를 완벽하게 해야 저장되는 UX를 금지한다.
- Synthesis 결과도 행동으로 만들도록 강제하지 않는다.

---

## P2-04. Motive/Vision/Goal/Practice/Commitment 구분은 사용자에게 애매할 수 있다

예를 들어 `경제적 선택권이 있는 삶`은 Vision으로도, Motive로도 표현될 수 있다.

사용자에게 타입 선택을 강제하면 생각을 기록하는 대신 분류 문제를 풀게 된다.

권장:

- 빠른 입력에서는 타입을 요구하지 않는다.
- 자연어 슬롯이 관계를 유도한다.
- MeaningNode kind는 이후 재분류 가능해야 한다.
- 재분류해도 stable ID와 과거 revision을 유지한다.

---

## P2-05. DnD가 모바일에서 핵심 조작이 되면 사용성이 깨질 수 있다

긴 누르기와 스크롤이 충돌하고 작은 화면에서는 정확한 드롭이 어렵다.

현재 탭 기반 대체 흐름을 둔 결정은 맞다.

권장:

실제 구현 우선순위는 탭 연결을 먼저 완성하고, DnD는 interaction prototype으로 검증한 뒤 붙인다.

스크래치의 상호작용 원칙을 차용하되 시각 스타일 자체를 아동용처럼 만들 필요는 없다.

---

## P2-06. 동기를 오래 노출하는 것이 항상 도움이 되는 것은 아니다

사용자가 직접 기록한 동기라도 다음과 같은 이유는 시간이 지나 부담이나 비교를 강화할 수 있다.

- 타인과의 비교
- 외모에 대한 불만
- 관계에서 인정받고 싶은 욕망

제품이 이를 자동으로 중요한 동기로 증폭해서는 안 된다.

권장:

- 감정 강도나 부정적 표현을 알고리즘 우선순위로 사용하지 않는다.
- `이 이유가 아직 나를 돕고 있나요?` MeaningCheckIn을 제공한다.
- 약화/종료를 실패로 표현하지 않는다.
- 사용자 동기를 앱이 도덕적으로 평가하지 않되 자동 강화도 하지 않는다.

---

## P2-07. 기록이 많아지면 Block Tray에 검색이 필수다

최근 블록만 보여주는 Tray는 데이터가 많아지면 연결할 과거 노드를 찾기 어렵다.

권장:

P0에서 최소 텍스트 검색을 제공한다.

전체 Meaning Map은 P1이어도 되지만 연결 대상 검색은 P0에 있어야 한다.

---

# D. 개인정보 및 iOS 플랫폼 공격

## S2-01. 잠금화면 승인 문장은 의도적으로 declassified된 데이터다

`publicSafeMessage`는 잠금 상태에서도 보이기 위해 사용자가 공개를 승인한 데이터이다.

따라서 Private DB와 동일한 파일 보호 정책을 쓰면 Widget의 핵심 경험과 충돌할 수 있다.

권장:

- Private Store와 Widget Projection의 데이터 보호 등급을 명시적으로 분리
- 기기 재부팅 후 첫 잠금 해제 전에는 placeholder가 보여도 허용
- 사용자에게 `잠금화면에서는 다른 사람이 볼 수 있음`을 승인 UI에 명확히 표시

---

## S2-02. app switcher snapshot 보호가 필요하다

iOS는 앱이 백그라운드로 전환될 때 UI snapshot을 만들어 app switcher에 표시할 수 있다.

회고와 Why Trail은 잠금화면보다 훨씬 민감한 원문을 포함한다.

권장:

- scene가 비활성화될 때 민감 화면을 blur 또는 privacy cover로 덮음
- foreground 복귀 시 복원
- 실제 기기에서 app switcher screenshot 검증을 보안 테스트에 포함

---

## S2-03. 화면 공유/녹화도 개인정보 경계에 포함해야 한다

사용자는 자신의 화면을 미러링하거나 녹화할 수 있다.

향후 공개 배포를 고려하면 민감한 상세 화면에서 화면 캡처 상태를 감지해 선택적으로 경고 또는 가림 처리를 검토할 가치가 있다.

P0 필수는 아니어도 보안 backlog에는 들어가야 한다.

---

## S2-04. Widget 업데이트를 즉시 반영된다고 가정하면 안 된다

WidgetKit의 timeline과 reload 요청은 시스템 예산과 스케줄링의 영향을 받는다.

사용자가 activeAnchor 또는 publicSafeMessage를 바꾼 직후 앱은 reload를 요청할 수 있지만 UI 문구에서 `즉시 잠금화면에 반영됨`을 보장해서는 안 된다.

FocusWindow가 P1에서 특정 시각에 문장을 바꾸더라도 정확한 시각 업데이트를 제품 계약으로 삼지 않는다.

---

## S2-05. Widget 설치 여부와 잠금 상태 표시 여부를 구분해야 한다

WidgetCenter는 사용자가 구성한 Widget 정보를 조회할 수 있으므로 설치/구성 확인에 활용할 수 있다.

하지만 사용자의 잠금화면 접근 설정이나 privacy redaction 때문에 실제 잠긴 화면에서 텍스트가 항상 보인다고 보장할 수는 없다.

온보딩은 다음을 구분한다.

- Widget이 구성되었는가
- 앱이 최신 projection을 만들었는가
- 시스템 설정에 따라 잠금 상태에서 내용이 가려질 수 있는가

---

# E. 구현 전 정리 권고

## 지금 바로 고칠 것

1. PRD를 v0.4로 통합
2. canonical `DOMAIN_SCHEMA.md` 작성
3. revision/sourceRevision 구조 추가
4. cross-domain causal cycle 방지 규칙 추가
5. P0 activeAnchor는 사용자 명시 변경으로 확정
6. LockscreenProjection approval revision 추가
7. Private Store Data Protection + app switcher privacy cover 명세
8. hard delete/merge/restore invariant 정의
9. Public 저장소의 실제 개인 경험 예시 처리 방침 결정
10. P0를 수직 Slice로 나눠 실제 MVP 범위 축소

## 구현 중 결정해도 되는 것

- 실제 앱 이름
- SQLite 계열 라이브러리 선택
- DnD 라이브러리
- 백업 암호화 구체 포맷
- Meaning Map 자동 레이아웃
- AI 기반 연결 후보 제안

## 최종 판정

v0.4의 도메인 방향 자체는 유지할 가치가 있다.

다만 지금 가장 위험한 것은 기능 부족이 아니라 **과설계된 P0, 출처 revision 부재, 여러 문서 간 소스 오브 트루스 분산**이다.

이 세 가지를 먼저 해결하면 구현 중 대규모 재작업 가능성을 크게 줄일 수 있다.
