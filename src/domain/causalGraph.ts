import {DomainRuleViolation} from './errors';

export interface CausalEdge {
  from: string;
  to: string;
}

function hasPath(
  edges: readonly CausalEdge[],
  start: string,
  target: string,
): boolean {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const current = adjacency.get(edge.from) ?? [];
    current.push(edge.to);
    adjacency.set(edge.from, current);
  }

  const visited = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const vertex = stack.pop();
    if (vertex === undefined) {
      continue;
    }
    if (vertex === target) {
      return true;
    }
    if (visited.has(vertex)) {
      continue;
    }

    visited.add(vertex);
    for (const next of adjacency.get(vertex) ?? []) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }

  return false;
}

export function wouldCreateCausalCycle(
  existingEdges: readonly CausalEdge[],
  candidate: CausalEdge,
): boolean {
  if (candidate.from === candidate.to) {
    return true;
  }

  return hasPath(existingEdges, candidate.to, candidate.from);
}

export function assertCausalEdgesAcyclic(
  existingEdges: readonly CausalEdge[],
  additions: readonly CausalEdge[],
): void {
  const working = [...existingEdges];

  for (const edge of additions) {
    if (wouldCreateCausalCycle(working, edge)) {
      throw new DomainRuleViolation(
        'CAUSAL_PROVENANCE_CYCLE',
        '이 출처 연결은 causal provenance에 순환을 만듭니다.',
      );
    }
    working.push(edge);
  }
}
