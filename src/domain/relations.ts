import {DomainRuleViolation} from './errors';
import type {MeaningNode, MeaningRelationKind} from './types';

const CLASSIFICATION_REQUIRED_RELATIONS: ReadonlySet<MeaningRelationKind> =
  new Set(['motivated_by', 'contributes_to', 'serves']);

export function assertMeaningRelationAllowed(
  kind: MeaningRelationKind,
  fromNode: MeaningNode,
  toNode: MeaningNode,
): void {
  if (fromNode.id === toNode.id) {
    throw new DomainRuleViolation(
      'MEANING_RELATION_SELF_EDGE',
      '의미 카드는 자기 자신과 관계를 만들 수 없습니다.',
    );
  }

  if (
    CLASSIFICATION_REQUIRED_RELATIONS.has(kind) &&
    (fromNode.kind === 'unclassified' || toNode.kind === 'unclassified')
  ) {
    throw new DomainRuleViolation(
      'MEANING_RELATION_REQUIRES_CLASSIFICATION',
      '이 관계는 두 의미 카드의 종류가 정해진 뒤 만들 수 있습니다.',
    );
  }
}

export function canonicalConflictPair(
  firstNodeId: string,
  secondNodeId: string,
): readonly [string, string] {
  if (firstNodeId === secondNodeId) {
    throw new DomainRuleViolation(
      'MEANING_RELATION_SELF_EDGE',
      '갈등 관계는 자기 자신을 대상으로 만들 수 없습니다.',
    );
  }

  return firstNodeId < secondNodeId
    ? [firstNodeId, secondNodeId]
    : [secondNodeId, firstNodeId];
}
