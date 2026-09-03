# Future Self canonical domain schema

- 상태: 구현 기준선
- 최근 갱신: 2026-09-04
- 상위 문서: `docs/PRD.md`

이 문서는 데이터 모델, revision, 관계, provenance, 병합, 잠금화면 projection의 정합성 규칙을 정의한다.

## 1. 공통 원칙

1. 사용자에게 보이는 객체는 stable ID를 가진다.
2. 수정 가능한 의미와 텍스트는 기존 값을 덮어쓰지 않고 새 revision을 만든다.
3. 과거 결론의 출처와 결과는 모두 당시의 immutable revision 또는 immutable event를 가리킨다.
4. MeaningNode 사이의 의미 관계와 기록에서 의미가 도출된 causal provenance를 분리한다.
5. 사용자 삭제 요청은 역사 보존보다 우선한다.
6. 여러 테이블을 함께 변경하는 의미 있는 동작은 반드시 하나의 DB transaction으로 실행한다.
7. 현재 상태 조회와 과거 상태 조회를 구분한다.
8. 같은 stable node가 시간이 지나 revision될 수 있지만 node의 근본 정체성이 달라지는 변경은 새 node로 분리한다.

## 2. 공통 식별자와 시각

모든 ID는 기기 밖으로 내보내도 안정적인 UUID 계열 문자열을 사용한다.

모든 저장 시각은 UTC 기반 ISO-8601 또는 DB 정수 epoch로 저장한다. 화면 표시만 사용자 timezone으로 변환한다.

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

기존 revision은 수정하지 않는다.

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

ReflectionItem을 다른 ReflectionSession으로 이동하는 기능을 제공할 경우 `sessionId` 변경도 이력으로 보존해야 한다. 초기 구현에서는 생성 이후 session 이동을 허용하지 않고, 필요하면 새 ReflectionItem을 만들거나 별도 migration 동작을 사용한다.

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

하나의 새 SynthesisInsightRevision이 여러 evidence revision/event를 근거로 가질 수 있다.

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

종류별 detail은 revision ID와 1:1로 저장한다.

```ts
export type MotiveRevisionDetail = { nodeRevisionId: string };
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

### 6.1 node identity 경계

revision은 같은 개념의 표현이나 세부 내용을 갱신할 때 사용한다.

사용자가 `사실 이것은 예전 목표와 다른 목표다`라고 판단할 만큼 정체성이 달라졌다면 기존 node를 억지로 revision하지 않는다.

- 새 MeaningNode 생성
- 필요하면 `supersedes` 관계 연결
- 기존 node는 유지 또는 retire

`merge`는 사실상 같은 개념이 중복 생성된 경우에만 사용한다. `supersedes`와 `merge`를 같은 의미로 사용하지 않는다.

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

Directed:

- `motivated_by`
- `contributes_to`
- `serves`
- `supports`
- `supersedes`

Symmetric:

- `conflicts_with`

### 7.1 conflicts_with canonicalization

두 endpoint ID를 정렬하여 하나의 canonical pair로 저장하고 활성 pair unique constraint를 둔다. A→B와 B→A 두 행을 만들지 않는다.

### 7.2 관계 변경

endpoint 또는 kind가 달라지면 기존 관계를 retire하고 새 관계를 만든다. note 변경은 새 MeaningRelationRevision을 만든다.

## 8. Revision-level causal provenance

인과 출처 그래프는 stable object가 아니라 immutable revision/event 사이의 그래프이다.

이 구조를 사용하면 같은 Goal의 이전 revision을 근거로 새 revision을 재정의하는 정상적인 의미 변화도 시간 순서대로 표현할 수 있다.

```ts
export type EvidenceType =
  | 'capture_revision'
  | 'reflection_revision'
  | 'synthesis_revision'
  | 'meaning_node_revision'
  | 'meaning_relation_revision'
  | 'origin_moment'
  | 'meaning_check_in';

export type DerivedRevisionType =
  | 'synthesis_revision'
  | 'meaning_node_revision';

export type CausalEvidenceLink = {
  id: string;
  evidenceType: EvidenceType;
  evidenceId: string;
  derivedRevisionType: DerivedRevisionType;
  derivedRevisionId: string;
  note?: string;
  createdAt: string;
};
```

예시:

```text
CaptureEntryRevision A
ReflectionItemRevision B
→ SynthesisInsightRevision X1
→ GoalRevision G1

GoalRevision G1
MeaningCheckIn C
→ GoalRevision G2
```

G2가 같은 stable Goal의 새 revision이어도 G1보다 뒤의 사건이므로 정상적인 인과 흐름이다.

### 8.1 causal cycle 검증

모든 revision/event를 causal vertex로 본다.

새 edge `A → B`를 삽입하기 전에 B에서 A로 이미 도달 가능한 경로가 있는지 검사한다. 존재하면 insert를 거부한다.

추가 규칙:

- A와 B가 같은 revision/event이면 금지
- derived revision은 생성 시각이 evidence보다 논리적으로 이전일 수 없음
- transaction 안에서 여러 edge를 추가할 때는 transaction 후 그래프 전체를 기준으로 검사
- 여러 Synthesis와 MeaningNode revision을 거치는 간접 cycle도 금지

MeaningRelation의 의미 연결 자체는 causal provenance와 다른 그래프이다. 단, 특정 MeaningRelationRevision을 사용자가 Synthesis 근거로 선택한 경우에는 그 revision이 causal evidence가 될 수 있다.

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

OriginMoment과 snapshot은 생성 후 수정하지 않는다.

## 10. MeaningCheckIn

```ts
export type MeaningCheckInType =
  | 'reaffirmed'
  | 'reframed'
  | 'weakened'
  | 'retired'
  | 'uncertain';

export type MeaningCheckIn = {
  id: string;
  subjectType: 'node' | 'relation';
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

CheckIn은 immutable event이다.

## 11. Review 상태

Review는 영구 task queue가 아니라 계산된 resurfacing이다.

```ts
export type ReviewState = {
  subjectNodeId: string;
  lastReviewedAt?: string;
  snoozedUntil?: string;
  updatedAt: string;
};
```

홈에는 후보를 최대 3개만 노출한다.

## 12. Lockscreen Projection

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

승인은 ProjectionRevision 단위이다.

새 ProjectionRevision은 항상 `draft`로 시작한다. 승인 시 canonical payload digest를 저장한다. Commitment가 새 revision으로 바뀌어도 과거 approved Projection은 자동 변경되지 않는다.

## 13. activeAnchor

```ts
export type LockscreenState = {
  singletonId: 'lockscreen_state';
  activeProjectionRevisionId?: string;
  setAt?: string;
};
```

- approved ProjectionRevision만 active 가능
- 사용자 명시 동작만 변경 가능
- 새 Commitment, Review, Synthesis, FocusWindow는 자동 변경 금지
- active Projection revoke/hard delete 시 같은 transaction에서 anchor 비움
- 임의 fallback 자동 선택 금지

## 14. Widget 공유 projection

```ts
export type WidgetProjection = {
  projectionRevisionId: string;
  widgetMessage: string;
  generation: number;
  updatedAt: string;
};
```

App Group에는 이 최소 공개 데이터만 둔다.

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

1. source/target 존재 확인
2. 동일 node 금지
3. target canonical resolve
4. merge cycle 검사
5. source를 `merged` 처리
6. mergedIntoNodeId 설정
7. NodeMergeEvent 저장

과거 relation endpoint는 rewrite하지 않는다. 새 현재 관계만 canonical target을 사용한다.

## 16. FocusWindow

```ts
export type FocusWindow = {
  id: string;
  subjectNodeId: string;
  startDate: string;
  endDate: string;
  recurrence: 'none' | 'yearly';
};
```

1차 제품에서는 Review 후보와 홈 강조에만 사용한다. activeAnchor 자동 변경에 사용하지 않는다.

## 17. Canvas placement

```ts
export type CanvasPlacement = {
  id: string;
  canvasId: string;
  objectType:
    | 'meaning_node'
    | 'capture_entry'
    | 'reflection_item'
    | 'synthesis_insight';
  objectId: string;
  x: number;
  y: number;
  updatedAt: string;
};
```

시각적 위치와 도메인 관계를 분리한다.

## 18. 최소 DB 무결성 제약

- currentRevisionId는 동일 stable object의 revision만 참조
- revision 번호는 object별 unique 및 단조 증가
- MeaningNode kind 생성 후 변경 금지
- identity-changing 변경은 새 node + 필요 시 supersedes
- activeAnchor는 approved ProjectionRevision만 참조
- merged node는 mergedIntoNodeId 필수
- merge cycle 금지
- relation self edge 기본 금지
- active `conflicts_with` canonical pair unique
- causal provenance cycle 금지
- derived revision의 causal source는 미래 revision/event일 수 없음
- retired relation은 현재 graph traversal 기본 결과에서 제외

## 19. transaction이 필요한 대표 동작

- revision 추가 + currentRevisionId 변경
- relation retire + 대체 relation 생성
- node retire + retirement metadata
- node merge
- Projection approve
- activeAnchor 변경
- hard delete cascade
- backup restore DB swap

Widget shared container는 DB commit 이후 갱신한다. App Group write 실패 시 Private DB를 rollback하지 않고 재동기화 상태를 남긴다.

## 20. repository/service 경계

- `CaptureRepository`
- `ReflectionRepository`
- `SynthesisRepository`
- `MeaningGraphRepository`
- `CausalEvidenceRepository`
- `LockscreenProjectionRepository`
- `ReviewRepository`
- `BackupRepository`

다음 규칙은 UI가 아니라 domain/service 계층에서 강제한다.

- causal cycle validation
- revision ordering
- canonical node resolve
- merge cycle validation
- Projection approval validation
- activeAnchor validation
