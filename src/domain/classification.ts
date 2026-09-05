import {DomainRuleViolation} from './errors';
import type {ClassifiedMeaningNodeKind, MeaningNodeKind} from './types';

export function isClassifiedMeaningNodeKind(
  kind: MeaningNodeKind,
): kind is ClassifiedMeaningNodeKind {
  return kind !== 'unclassified';
}

export function assertClassificationTransition(
  fromKind: MeaningNodeKind,
  toKind: MeaningNodeKind,
): asserts toKind is ClassifiedMeaningNodeKind {
  if (fromKind !== 'unclassified') {
    throw new DomainRuleViolation(
      'MEANING_NODE_ALREADY_CLASSIFIED',
      '분류된 의미 카드는 다른 종류로 직접 변경할 수 없습니다.',
    );
  }

  if (toKind === 'unclassified') {
    throw new DomainRuleViolation(
      'MEANING_NODE_CLASSIFICATION_REQUIRED',
      '분류 이벤트의 대상 종류는 분류된 종류여야 합니다.',
    );
  }
}
