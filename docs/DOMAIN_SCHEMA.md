# Future Self canonical domain schema

- 상태: 구현 기준선
- 최근 갱신: 2026-09-04
- 상위 문서: `docs/PRD.md`

이 문서는 데이터 모델, revision, 관계, provenance, 병합, 잠금화면 projection의 정합성 규칙을 정의한다.

## 1. 공통 원칙

1. 사용자에게 보이는 객체는 stable ID를 가진다.
2. 수정 가능한 텍스트는 기존 값을 덮어쓰지 않고 새 revision을 만든다.
3. 과거 결론의 출처는 당시 revision을 가리킨다.
4. MeaningNode 사이의 의미 관계와 기록에서 의미가 도출된 provenance를 분리한다.
5. 사용자 삭제 요청은 역사 보존보다 우선한다.
6. 여러 테이블을 함께 변경하는 의미 있는 동작은 반드시 하나의 DB transaction으로 실행한다.
7. 현재 상태 조회와 과거 상태 조회를 구분한다.

---

## 2. 공통 식별자와 시각

모든 ID는 충돌 가능성이 낮고 기기 밖으로 내보내도 안정적인 UUID 계열 문자열을 사용한다.

모든 저장 시각은 UTC 기반 ISO-8601 또는 DB 정수 epoch로 저장한다. 화면 표시만 사용자 timezone으로 변환한다.

---

## 3. 빠른 기록

```ts
export type CaptureEntry = {
  id: string;
  currentRevisionId: string;
  createdAt: string;
};

export type CaptureEntryKind =
  | 'thought'
  | 'event'
  | 'observation'
  | 'question'
  | 'quote_to_self';

export type CaptureEntryRevision = {
  id: string;
  entryId: string;
  revision: number;
  kind: CaptureEntryKind;
  content: string;
  occurredAt?: string;
  tags: string[];
  createdAt: string;
};
```

규칙:

- `CaptureEntry.currentRevisionId`는 최신 revision을 가리킨다.
- revision 번호는 entry별 단조 증가한다.
- 기존 revision은 수정하지 않는다.

---

## 4. 회고

```ts
export type ReflectionSession = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ReflectionItemKind =
  | 'regret'
  | 'win'
  | 'desire'
  | 'discovery'
  | 'turning_point'
  | 'insight';

export type ReflectionItem = {
  id: string;
  sessionId: string;
  currentRevisionId: string;
  createdAt: string;
};

export type ReflectionItemRevision = {
  id: string;
  itemId: string;
  revision: number;
  kind: ReflectionItemKind;
  title?: string;
  content: string;
  context?: string;
  cause?: string;
  consequence?: string;
  lesson?: string;
  tags: string[];
  occurredAt?: string;
  createdAt: string;
};
```

ReflectionSession 자체의 제목과 기간 변경은 provenance 의미를 바꾸지 않으므로 일반 update를 허용한다. ReflectionItem의 의미 원문은 revision을 사용한다.

---

## 5. Synthesis

```ts
export type SynthesisStatus = 'active' | 'uncertain' | 'retired';

export type SynthesisInsight = {
  id: string;
  currentRevisionId: string;
  status: SynthesisStatus;
  createdAt: string;
};

export type SynthesisInsightRevision = {
  id: string;
  insightId: string;
  revision: number;
  title?: string;
  statement: string;
  context?: string;
  createdAt: string;
};
```

Synthesis는 여러 근거를 가진다. 근거 연결은 `CausalEvidenceLink`로 통합한다.

---

## 6. MeaningNode

```ts
export type MeaningNodeKind =
  | 'motive'
  | 'vision'
  | 'goal'
  | 'practice'
  | 'commitment';

export type MeaningNodeStatus =
  | 'active'
  | 'paused'
  | 'retired'
  | 'merged'
  | 'archived';

export type RetirementReason =
  | 'achieved'
  | 'no_longer_wanted'
  | 'values_changed'
  | 'superseded'
  | 'deferred'
  | 'context_changed'
  | 'other';

export type MeaningNode = {
  id: string;
  kind: MeaningNodeKind;
  status: MeaningNodeStatus;
  currentRevisionId: string;
  retirementReason?: RetirementReason;
  retiredAt?: string;
  retirementNote?: string;
  mergedIntoNodeId?: string;
  createdAt: string;
};

export type MeaningNodeRevision = {
  id: string;
  nodeId: string;
  revision: number;
  title: string;
  description?: string;
  createdAt: string;
};
```

종류별 필드는 revision과 동일 시점의 detail row에 저장한다.

```ts
export type MotiveRevisionDetail = {
  nodeRevisionId: string;
};

export type VisionRevisionDetail = {
  nodeRevisionId: string;
  desiredState?: string;
};

export type GoalRevisionDetail = {
  nodeRevisionId: string;
  targetDescription?: string;
  targetDate?: string;
};

export type PracticeRevisionDetail = {
  nodeRevisionId: string;
  actionDescription?: string;
};

export type CommitmentRevisionDetail = {
  nodeRevisionId: string;
  actionRule: string;
};
```

초기 버전에서는 종류별 detail이 단순할 수 있지만, 공통 노드와 종류별 detail을 분리하는 구조를 유지한다.

---

## 7. MeaningRelation

```ts
export type MeaningRelationKind =
  | 'motivated_by'
  | 'contributes_to'
  | 'serves'
  | 'supports'
  | 'conflicts_with'
  | 'supersedes';

export type MeaningRelation = {
  id: string;
  kind: MeaningRelationKind;
  fromNodeId: string;
  toNodeId: string;
  currentRevisionId: string;
  activatedAt: string;
  retiredAt?: string;
};

export type MeaningRelationRevision = {
  id: string;
  relationId: string;
  revision: number;
  note?: string;
  createdAt: string;
};
```

### 7.1 방향 규칙

다음은 directed relation이다.

- `motivated_by`
- `contributes_to`
- `serves`
- `supports`
- `supersedes`

`conflicts_with`는 symmetric relation이다.

### 7.2 symmetric canonicalization

`conflicts_with`는 저장 전에 두 endpoint ID를 정렬해 canonical pair로 만든다.

```text
leftNodeId = min(nodeA, nodeB)
rightNodeId = max(nodeA, nodeB)
```

DB에서는 활성 `conflicts_with`에 대해 `(kind, leftNodeId, rightNodeId)` 유일성을 보장한다.

같은 충돌을 A→B, B→A 두 행으로 저장하지 않는다.

### 7.3 관계 변경

endpoint 또는 relation kind를 바꾸지 않는다. 의미 자체가 달라지면 기존 관계를 retire하고 새 관계를 만든다.

note만 수정할 때는 새 MeaningRelationRevision을 생성한다.

---

## 8. Evidence와 causal provenance

출처는 객체의 최신 상태가 아니라 당시 revision 또는 불변 event를 가리킨다.

```ts
export type EvidenceType =
  | 'capture_revision'
  | 'reflection_revision'
  | 'synthesis_revision'
  | 'meaning_node_revision'
  | 'origin_moment'
  | 'meaning_check_in';

export type DerivedObjectType =
  | 'synthesis_insight'
  | 'meaning_node';

export type CausalEvidenceLink = {
  id: string;
  evidenceType: EvidenceType;
  evidenceId: string;
  derivedObjectType: DerivedObjectType;
  derivedObjectId: string;
  note?: string;
  createdAt: string;
};
```

기존 `SynthesisSourceLink`와 `ProvenanceLink`는 논리적으로 이 모델에 통합한다.

UI나 repository 계층에서 convenience API를 둘 수 있지만 DB의 인과 출처 모델은 하나로 유지한다.

### 8.1 순환 검증

모든 SynthesisInsight와 MeaningNode를 causal vertex로 본다.

Evidence가 `synthesis_revision` 또는 `meaning_node_revision`인 경우 해당 stable object를 원본 vertex로 해석한다.

새 link `A → B`를 추가하기 전에 B에서 A로 이미 도달 가능한 경로가 있는지 검사한다.

도달 가능하면 insert를 거부한다.

금지:

- self cycle
- 2-hop cycle
- 여러 Synthesis와 MeaningNode를 거치는 간접 cycle

Capture/Reflection/Origin/CheckIn은 causal source로만 취급하며 자체적으로 derived vertex가 아니다.

---

## 9. OriginMoment

```ts
export type OriginSubjectType = 'node' | 'relation';

export type OriginMoment = {
  id: string;
  subjectType: OriginSubjectType;
  subjectId: string;
  subjectRevisionId: string;
  originalText?: string;
  context?: string;
  capturedAt: string;
};

export type OriginRelationSnapshot = {
  id: string;
  originMomentId: string;
  relationId: string;
  relationRevisionId: string;
  wasActive: boolean;
};
```

노드의 초심을 캡처할 때 당시 중요하게 연결되어 있던 관계 snapshot을 함께 남길 수 있다.

OriginMoment 생성 이후 기존 snapshot을 수정하지 않는다.

---

## 10. MeaningCheckIn

```ts
export type MeaningCheckInType =
  | 'reaffirmed'
  | 'reframed'
  | 'weakened'
  | 'retired'
  | 'uncertain';

export type MeaningCheckInSubjectType = 'node' | 'relation';

export type MeaningCheckIn = {
  id: string;
  subjectType: MeaningCheckInSubjectType;
  subjectId: string;
  subjectRevisionId: string;
  type: MeaningCheckInType;
  trigger?: string;
  doubt?: string;
  rememberedReason?: string;
  currentMeaning?: string;
  messageAtThatMoment?: string;
  createdAt: string;
};
```

CheckIn은 불변 event이다. 잘못 작성한 경우 기존 row를 수정하기보다 삭제 후 새 event를 작성하거나 별도 correction event를 둘 수 있다.

---

## 11. Review 상태

Review Queue 자체를 영구 task 목록으로 저장하지 않는다. 후보는 현재 상태에서 계산한다.

```ts
export type ReviewState = {
  subjectNodeId: string;
  lastReviewedAt?: string;
  snoozedUntil?: string;
  updatedAt: string;
};
```

후보 계산 예시 입력:

- retained/active 여부
- lastReviewedAt
- snoozedUntil
- node importance
- 최근 MeaningCheckIn

홈에는 계산된 후보 중 최대 3개만 노출한다.

---

## 12. 잠금화면 Projection

내부 Commitment revision과 공개 문장을 강하게 분리한다.

```ts
export type ProjectionApprovalStatus = 'draft' | 'approved' | 'revoked';

export type LockscreenProjection = {
  id: string;
  commitmentNodeId: string;
  currentRevisionId: string;
  createdAt: string;
};

export type LockscreenProjectionRevision = {
  id: string;
  projectionId: string;
  revision: number;
  commitmentRevisionId: string;
  publicSafeMessage: string;
  widgetMessage?: string;
  wallpaperMessage?: string;
  approvalStatus: ProjectionApprovalStatus;
  approvedAt?: string;
  approvalDigest?: string;
  createdAt: string;
};
```

### 12.1 승인 규칙

승인은 projection revision 단위이다.

- 새 projection revision 생성 시 `draft`
- 승인 시 그 revision의 canonical serialized payload를 hash하여 `approvalDigest` 저장
- payload가 바뀌면 새 revision을 만들므로 과거 승인을 재사용하지 않음
- Widget과 wallpaper는 `approved` revision만 사용

Commitment를 수정해 새 MeaningNodeRevision이 생겨도 기존 승인 ProjectionRevision은 자동 변경되지 않는다.

사용자가 새 내부 의미에 맞춰 잠금화면 문장을 바꾸고 싶을 때 새 ProjectionRevision을 작성하고 다시 승인한다.

---

## 13. activeAnchor

```ts
export type LockscreenState = {
  singletonId: 'lockscreen_state';
  activeProjectionRevisionId?: string;
  setAt?: string;
};
```

규칙:

- `activeProjectionRevisionId`는 반드시 approved projection revision이어야 한다.
- 사용자 명시 동작만 변경할 수 있다.
- 새 Commitment, 새 Review, 새 Synthesis, FocusWindow는 자동 변경하지 않는다.
- 활성 Projection이 revoke 또는 hard delete되면 같은 transaction에서 anchor를 비운다.
- 임의 fallback projection을 자동 선택하지 않는다.

---

## 14. Widget 공유 projection

Private DB와 별도 App Group 파일 또는 store에 다음 최소 projection을 쓴다.

```ts
export type WidgetProjection = {
  projectionRevisionId: string;
  widgetMessage: string;
  generation: number;
  updatedAt: string;
};
```

이 데이터에는 Motive, Vision, Goal, Reflection, Capture, Synthesis, CheckIn 원문이 포함되지 않는다.

activeAnchor transaction이 성공한 후 shared projection을 갱신하고 Widget reload를 요청한다.

---

## 15. 병합

```ts
export type NodeMergeEvent = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  note?: string;
  mergedAt: string;
};
```

병합 transaction:

1. source와 target 존재 확인
2. 동일 노드 병합 금지
3. target을 canonical resolve
4. target이 source로 resolve되는 cycle 금지
5. source 상태를 `merged`로 변경
6. source.mergedIntoNodeId = canonical target
7. NodeMergeEvent 저장

과거 MeaningRelation endpoint는 재작성하지 않는다.

새 현재 관계를 만들 때는 endpoint를 canonical node로 resolve한다.

현재 UI에서 source node를 조회하면 canonical target으로 안내하되 과거 화면에서는 source의 revision과 관계를 볼 수 있다.

---

## 16. FocusWindow

FocusWindow는 특정 시기의 중요도를 나타내는 보조 데이터이다.

```ts
export type FocusWindow = {
  id: string;
  subjectNodeId: string;
  startDate: string;
  endDate: string;
  recurrence: 'none' | 'yearly';
};
```

1차 제품에서 FocusWindow는 activeAnchor를 자동 변경하지 않는다. Review 후보나 홈 강조에만 사용할 수 있다.

---

## 17. Canvas placement

그래프 시각 배치는 도메인 의미와 분리한다.

```ts
export type CanvasObjectType =
  | 'meaning_node'
  | 'capture_entry'
  | 'reflection_item'
  | 'synthesis_insight';

export type CanvasPlacement = {
  id: string;
  canvasId: string;
  objectType: CanvasObjectType;
  objectId: string;
  x: number;
  y: number;
  updatedAt: string;
};
```

블록 위치를 바꿔도 Why Graph 의미 관계는 바뀌지 않는다.

---

## 18. DB 무결성 제약

최소 제약:

- stable object의 currentRevisionId는 동일 object의 revision만 참조
- revision 번호 object별 unique
- MeaningNode kind는 생성 후 변경 금지
- activeAnchor는 approved projection revision만 참조
- merged node는 mergedIntoNodeId 필수
- merge cycle 금지
- relation self edge는 원칙적으로 금지
- `conflicts_with` canonical pair active unique
- causal provenance cycle 금지
- retired relation을 현재 graph traversal 기본 결과에서 제외

---

## 19. transaction이 필요한 대표 동작

다음은 원자적으로 처리한다.

- 객체 revision 추가 + currentRevisionId 변경
- relation retire + 새 relation 생성이 하나의 사용자 변경인 경우
- node retire + retirement metadata 저장
- node merge
- projection approve
- activeAnchor 변경 + private state 변경
- hard delete cascade
- backup restore DB swap

Widget shared container 갱신은 Private DB transaction과 다른 파일 시스템 경계이므로 DB commit 이후 수행한다. shared projection 쓰기가 실패하면 Private DB는 유지하고 UI에서 재시도 가능한 동기화 상태를 표시한다.

---

## 20. repository 계층 권장 경계

구현 시 다음 책임을 분리한다.

- `CaptureRepository`
- `ReflectionRepository`
- `SynthesisRepository`
- `MeaningGraphRepository`
- `ProvenanceRepository`
- `LockscreenProjectionRepository`
- `ReviewRepository`
- `BackupRepository`

causal cycle validation, canonical node resolve, projection approval 검증은 UI가 아니라 domain/service 계층에서 강제한다.
