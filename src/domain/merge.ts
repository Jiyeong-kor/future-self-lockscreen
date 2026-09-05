import {DomainRuleViolation} from './errors';

export type MergeMap = ReadonlyMap<string, string | undefined>;

export function resolveCanonicalNodeId(
  startNodeId: string,
  mergedInto: MergeMap,
): string {
  const visited = new Set<string>();
  let current = startNodeId;

  while (true) {
    if (visited.has(current)) {
      throw new DomainRuleViolation(
        'MEANING_NODE_MERGE_CYCLE',
        '의미 카드 병합 관계에 순환이 있습니다.',
      );
    }

    visited.add(current);
    const next = mergedInto.get(current);
    if (next === undefined) {
      return current;
    }
    current = next;
  }
}

export function assertMergeAllowed(
  sourceNodeId: string,
  targetNodeId: string,
  mergedInto: MergeMap,
): string {
  if (sourceNodeId === targetNodeId) {
    throw new DomainRuleViolation(
      'MEANING_NODE_MERGE_SELF',
      '의미 카드는 자기 자신으로 병합할 수 없습니다.',
    );
  }

  const canonicalTarget = resolveCanonicalNodeId(targetNodeId, mergedInto);
  if (canonicalTarget === sourceNodeId) {
    throw new DomainRuleViolation(
      'MEANING_NODE_MERGE_CYCLE',
      '이 병합은 의미 카드 병합 관계에 순환을 만듭니다.',
    );
  }

  return canonicalTarget;
}
