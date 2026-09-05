# Future Self canonical domain schema

- 상태: 구현 기준선
- 최근 갱신: 2026-09-05
- 상위 문서: `docs/PRD.md`

이 문서는 데이터 모델, revision, lifecycle event, 관계, provenance, 병합, 잠금화면 projection의 정합성 규칙을 정의한다.

## 1. 공통 원칙

1. 사용자에게 보이는 객체는 stable ID를 가진다.
2. 수정 가능한 의미와 텍스트는 기존 값을 덮어쓰지 않고 새 revision을 만든다.
3. 과거 결론의 출처와 결과는 당시의 immutable revision 또는 immutable event를 가리킨다.
4. 상태 변화 이력이 중요한 객체는 lifecycle event를 별도로 저장한다.
5. MeaningNode 사이의 의미 관계와 기록에서 의미가 도출된 causal provenance를 분리한다.
6. 사용자 삭제 요청은 역사 보존보다 우선한다.
7. 여러 테이블을 함께 변경하는 의미 있는 동작은 반드시 하나의 DB transaction으로 실행한다.
8. 현재 상태 조회와 과거 상태 조회를 구분한다.
9. 같은 stable node가 시간이 지나 revision될 수 있지만 node의 근본 정체성이 달라지는 변경은 새 node로 분리한다.
10. 분류되지 않은 MeaningNode는 미완료 상태가 아니라 정상적인 영구 상태이다.

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

초기 구현에서는 ReflectionItem 생성 후 다른 session으로 이동하지 않는다. session 이동이 필요해지면 별도 이력 모델을 추가한다.

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

Synthesis의 의미 변경은 revision으로 관리한다. status의 장기 변화 이력이 제품에 필요해지면 lifecycle event를 추가하되 revision 원문을 수정하지 않는다.

## 6. MeaningNode

```ts
export type MeaningNodeKind =
  | 'unclassified'
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

`unclassified`는 정상적인 MeaningNode kind이며 기간 제한 없이 유지할 수 있다.

종류별 detail은 revision ID와 1:1로 저장한다. `unclassified` revision은 종류별 detail을 요구하지 않는다.

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

### 6.1 MeaningNode classification

사용자는 MeaningNode를 `unclassified`로 생성하고 영구적으로 그대로 둘 수 있다.

나중에 사용자가 원하면 같은 stable node를 한 번 분류할 수 있다.

```ts
export type ClassifiedMeaningNodeKind = Exclude<
  MeaningNodeKind,
  'unclassified'
>;

export type MeaningNodeClassificationEvent = {
  id: string;
  nodeId: string;
  fromKind: 'unclassified';
  toKind: ClassifiedMeaningNodeKind;
  createdAt: string;
};
```

분류 transaction:

1. 현재 kind가 `unclassified`인지 확인
2. 선택한 typed kind의 필수 detail 검증
3. 필요하면 새 MeaningNodeRevision 생성
4. MeaningNodeClassificationEvent 저장
5. `MeaningNode.kind` current-state cache 갱신

규칙:

- `unclassified → typed`는 허용한다.
- 분류하지 않고 계속 `unclassified`로 유지하는 것도 정상 상태이다.
- typed kind에서 다른 typed kind로 직접 변경하지 않는다.
- typed kind를 다시 `unclassified`로 되돌리지 않는다.
- typed kind의 근본 정체성이 달라졌다면 새 MeaningNode를 만들고 필요하면 `supersedes`로 연결한다.
- 분류 전 과거 시점에서는 해당 node를 `unclassified`로 재구성할 수 있어야 한다.

### 6.2 MeaningNode lifecycle

pause, resume, retire, reactivate, archive처럼 반복될 수 있는 상태 변화는 단일 `retiredAt` 필드로 역사 전체를 표현하지 않는다.

```ts
export type MeaningNodeLifecycleEventType =
  | 'paused'
  | 'resumed'
  | 'retired'
  | 'reactivated'
  | 'archived'
  | 'unarchived';

export type MeaningNodeLifecycleEvent = {
  id: string;
  nodeId: string;
  type: MeaningNodeLifecycleEventType;
  retirementReason?: RetirementReason;
  note?: string;
  createdAt: string;
};
```

`MeaningNode.status`는 빠른 현재 조회를 위한 current-state cache이다. lifecycle event를 기록하는 transaction 안에서 함께 갱신한다.

`merged`는 일반 lifecycle 재활성화 대상이 아니다. 병합은 `NodeMergeEvent`로 별도 보존한다.

### 6.3 node identity 경계

revision은 같은 개념의 표현이나 세부 내용을 갱신할 때 사용한다.

정체성이 달라졌다면 새 MeaningNode를 만들고 필요하면 `supersedes` 관계를 연결한다.

`merge`는 동일하거나 사실상 같은 개념이 중복 생성된 경우에만 사용한다.

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

`unclassified` MeaningNode는 generic semantic relation인 `supports`, `conflicts_with`, `supersedes`에 참여할 수 있다. kind 의미가 필요한 typed relation은 분류 이후에만 생성한다.

### 7.1 conflicts_with canonicalization

두 endpoint ID를 정렬하여 하나의 canonical pair로 저장하고 활성 pair unique constraint를 둔다.

### 7.2 관계 변경

endpoint 또는 kind가 달라지면 기존 관계를 retire하고 새 관계를 만든다. note 변경은 새 MeaningRelationRevision을 만든다.

retire된 관계를 다시 활성화하는 대신 새 MeaningRelation을 만들어 새로운 연결 시점을 명확히 한다.

### 7.3 Trade-off Reflection

`conflicts_with` 관계는 해결을 요구하지 않는다. 사용자가 원할 때만 당시의 선택 맥락을 별도 immutable event로 남길 수 있다.

```ts
export type TradeoffPriority =
  | 'from'
  | 'to'
  | 'balanced'
  | 'undecided';

export type TradeoffReflection = {
  id: string;
  conflictRelationId: string;
  conflictRelationRevisionId: string;
  whyBothMatter?: string;
  currentPriority?: TradeoffPriority;
  tradeoffCost?: string;
  revisitAt?: string;
  note?: string;
  createdAt: string;
};
```

규칙:

- 대상 relation은 `conflicts_with`여야 한다.
- 모든 본문 필드는 선택 사항이다.
- `undecided` 또는 currentPriority 미지정도 정상 저장 상태이다.
- 앱은 `from` 또는 `to` 중 하나를 필수 선택하게 하지 않는다.
- 같은 갈등 관계에 여러 TradeoffReflection을 시간순으로 남길 수 있다.
- 과거 Reflection은 수정하지 않는다. 새 판단은 새 event로 남긴다.

## 8. Revision-level causal provenance

인과 출처 그래프는 stable object가 아니라 immutable revision/event 사이의 그래프이다.

```ts
export type EvidenceType =
  | 'capture_revision'
  | 'reflection_revision'
  | 'synthesis_revision'
  | 'meaning_node_revision'
  | 'meaning_relation_revision'
  | 'origin_moment'
  | 'meaning_check_in'
  | 'tradeoff_reflection';

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

같은 stable Goal의 이전 revision이 새 revision의 근거가 되는 것을 허용한다.

### 8.1 causal cycle 검증

모든 revision/event를 causal vertex로 본다.

새 edge `A → B`를 삽입하기 전에 B에서 A로 도달 가능한 경로가 있으면 거부한다.

추가 규칙:

- self edge 금지
- derived revision은 evidence보다 논리적으로 이전일 수 없음
- 하나의 transaction에서 여러 edge를 추가하면 transaction 후 전체 그래프를 검사
- 여러 Synthesis와 MeaningNode revision을 거치는 간접 cycle 금지

MeaningRelation 그래프 자체는 causal graph와 별개이다. 특정 MeaningRelationRevision 또는 TradeoffReflection을 Synthesis 근거로 사용한 경우에만 causal evidence가 된다.

## 9. OriginMoment

```ts
export type OriginMoment = {
  id: string;
  subjectType: 'node' | 'relation';
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

OriginMoment과 snapshot은 immutable이다.

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
  isResurfacingExcluded?: boolean;
  updatedAt: string;
};
```

홈에는 후보를 최대 3개만 노출한다.

`isResurfacingExcluded=true`인 node는 자동 Review 후보와 복귀 Snapshot 후보에서 제외한다. 사용자가 검색이나 명시적 탐색으로 직접 여는 것은 허용한다.

## 12. Lockscreen Projection

공개용 문장 revision 자체는 immutable이다. 승인과 철회는 별도 event로 저장한다.

```ts
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
  createdAt: string;
};

export type ProjectionApprovalEventType = 'approved' | 'revoked';

export type ProjectionApprovalEvent = {
  id: string;
  projectionRevisionId: string;
  type: ProjectionApprovalEventType;
  approvalDigest: string;
  createdAt: string;
};
```

### 12.1 승인 상태 계산

ProjectionRevision은 생성 직후 승인 event가 없으므로 draft로 취급한다.

현재 승인 상태는 해당 revision의 가장 최근 ApprovalEvent로 계산한다.

- latest `approved` → 승인됨
- latest `revoked` → 철회됨
- event 없음 → 미승인

승인 시 canonical serialized projection payload의 digest를 저장한다.

Projection 내용 변경은 기존 revision 수정이 아니라 새 revision 생성이다. 새 revision에는 승인 event가 없으므로 자동으로 재승인이 필요하다.

Commitment가 새 revision으로 바뀌어도 과거 approved ProjectionRevision은 자동 변경되지 않는다.

## 13. activeAnchor

```ts
export type LockscreenState = {
  singletonId: 'lockscreen_state';
  activeProjectionRevisionId?: string;
  setAt?: string;
};
```

- latest ApprovalEvent 기준으로 승인된 ProjectionRevision만 active 가능
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
5. source status를 `merged` 처리
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
- MeaningNode는 `unclassified`로 생성 가능하고 영구 유지 가능
- MeaningNode kind 변경은 `unclassified → typed` 1회 분류만 허용
- typed kind에서 다른 typed kind로 직접 변경 금지
- typed kind에서 `unclassified`로 회귀 금지
- MeaningNode classification event와 current kind 갱신은 같은 transaction
- identity-changing 변경은 새 node + 필요 시 supersedes
- MeaningNode.status 변경과 lifecycle event 기록은 같은 transaction
- typed detail은 해당 MeaningNode kind와 일치해야 함
- typed relation은 필요한 kind가 분류된 뒤에만 생성
- TradeoffReflection 대상은 `conflicts_with` relation만 허용
- TradeoffReflection은 결론 또는 우선순위 필수 아님
- activeAnchor는 최신 ApprovalEvent 기준 approved ProjectionRevision만 참조
- revoke된 active Projection은 같은 transaction에서 anchor 해제
- merged node는 mergedIntoNodeId 필수
- merge cycle 금지
- relation self edge 기본 금지
- active `conflicts_with` canonical pair unique
- causal provenance cycle 금지
- derived revision의 causal source는 미래 revision/event일 수 없음
- retired relation은 현재 graph traversal 기본 결과에서 제외
- resurfacing excluded node는 자동 Review/복귀 후보에서 제외

## 19. transaction이 필요한 대표 동작

- revision 추가 + currentRevisionId 변경
- MeaningNode `unclassified → typed` classification event + current kind 변경
- node lifecycle event 추가 + current status 변경
- relation retire + 대체 relation 생성
- node merge
- Projection approval/revoke event 처리
- revoke와 activeAnchor 정리
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
- MeaningNode classification transition validation
- node lifecycle transition validation
- relation kind compatibility validation
- canonical node resolve
- merge cycle validation
- Projection approval validation
- activeAnchor validation
- resurfacing exclusion validation
