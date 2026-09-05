export type EntityId = string;
export type IsoDateTime = string;

export type MeaningNodeKind =
  | 'unclassified'
  | 'motive'
  | 'vision'
  | 'goal'
  | 'practice'
  | 'commitment';

export type ClassifiedMeaningNodeKind = Exclude<
  MeaningNodeKind,
  'unclassified'
>;

export type MeaningNodeStatus =
  | 'active'
  | 'paused'
  | 'retired'
  | 'merged'
  | 'archived';

export interface MeaningNode {
  id: EntityId;
  kind: MeaningNodeKind;
  status: MeaningNodeStatus;
  currentRevisionId: EntityId;
  mergedIntoNodeId?: EntityId;
  createdAt: IsoDateTime;
}

export interface MeaningNodeRevision {
  id: EntityId;
  nodeId: EntityId;
  revision: number;
  title: string;
  description?: string;
  createdAt: IsoDateTime;
}

export interface MeaningNodeClassificationEvent {
  id: EntityId;
  nodeId: EntityId;
  fromKind: 'unclassified';
  toKind: ClassifiedMeaningNodeKind;
  createdAt: IsoDateTime;
}

export type MeaningRelationKind =
  | 'motivated_by'
  | 'contributes_to'
  | 'serves'
  | 'supports'
  | 'conflicts_with'
  | 'supersedes';

export interface MeaningRelation {
  id: EntityId;
  kind: MeaningRelationKind;
  fromNodeId: EntityId;
  toNodeId: EntityId;
  currentRevisionId: EntityId;
  activatedAt: IsoDateTime;
  retiredAt?: IsoDateTime;
}

export type TradeoffPriority = 'from' | 'to' | 'balanced' | 'undecided';

export interface TradeoffReflection {
  id: EntityId;
  conflictRelationId: EntityId;
  conflictRelationRevisionId: EntityId;
  whyBothMatter?: string;
  currentPriority?: TradeoffPriority;
  tradeoffCost?: string;
  revisitAt?: IsoDateTime;
  note?: string;
  createdAt: IsoDateTime;
}

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

export interface CausalEvidenceLink {
  id: EntityId;
  evidenceType: EvidenceType;
  evidenceId: EntityId;
  derivedRevisionType: DerivedRevisionType;
  derivedRevisionId: EntityId;
  note?: string;
  createdAt: IsoDateTime;
}

export type ProjectionApprovalEventType = 'approved' | 'revoked';

export interface ProjectionApprovalEvent {
  id: EntityId;
  projectionRevisionId: EntityId;
  type: ProjectionApprovalEventType;
  approvalDigest: string;
  createdAt: IsoDateTime;
}

export interface ReviewState {
  subjectNodeId: EntityId;
  lastReviewedAt?: IsoDateTime;
  snoozedUntil?: IsoDateTime;
  isResurfacingExcluded?: boolean;
  updatedAt: IsoDateTime;
}
