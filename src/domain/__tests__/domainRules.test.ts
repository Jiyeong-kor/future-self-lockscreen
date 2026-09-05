import {
  assertCausalEdgesAcyclic,
  assertClassificationTransition,
  assertMeaningRelationAllowed,
  assertMergeAllowed,
  assertProjectionCanBeActive,
  canonicalConflictPair,
  DomainRuleViolation,
  isAutoResurfacingEligible,
  resolveCanonicalNodeId,
  resolveProjectionApprovalState,
} from '..';
import type {MeaningNode, ProjectionApprovalEvent, ReviewState} from '..';

function node(id: string, kind: MeaningNode['kind']): MeaningNode {
  return {
    id,
    kind,
    status: 'active',
    currentRevisionId: `${id}-r1`,
    createdAt: '2026-09-05T00:00:00Z',
  };
}

describe('MeaningNode classification', () => {
  it('allows unclassified to typed classification', () => {
    expect(() => assertClassificationTransition('unclassified', 'goal')).not.toThrow();
  });

  it('rejects changing an already classified node kind', () => {
    expect(() => assertClassificationTransition('goal', 'motive')).toThrow(
      DomainRuleViolation,
    );
  });

  it('rejects a no-op classification event', () => {
    expect(() =>
      assertClassificationTransition('unclassified', 'unclassified'),
    ).toThrow(DomainRuleViolation);
  });
});

describe('causal provenance', () => {
  it('allows a normal DAG edge', () => {
    expect(() =>
      assertCausalEdgesAcyclic(
        [
          {from: 'a', to: 'b'},
          {from: 'b', to: 'c'},
        ],
        [{from: 'c', to: 'd'}],
      ),
    ).not.toThrow();
  });

  it('rejects an indirect cycle', () => {
    expect(() =>
      assertCausalEdgesAcyclic(
        [
          {from: 'a', to: 'b'},
          {from: 'b', to: 'c'},
        ],
        [{from: 'c', to: 'a'}],
      ),
    ).toThrow(DomainRuleViolation);
  });

  it('rejects a cycle created inside a batch', () => {
    expect(() =>
      assertCausalEdgesAcyclic([], [
        {from: 'a', to: 'b'},
        {from: 'b', to: 'c'},
        {from: 'c', to: 'a'},
      ]),
    ).toThrow(DomainRuleViolation);
  });
});

describe('semantic relations', () => {
  it('allows generic conflict relations for unclassified cards', () => {
    expect(() =>
      assertMeaningRelationAllowed(
        'conflicts_with',
        node('a', 'unclassified'),
        node('b', 'goal'),
      ),
    ).not.toThrow();
  });

  it('rejects typed relations while either card is unclassified', () => {
    expect(() =>
      assertMeaningRelationAllowed(
        'motivated_by',
        node('a', 'goal'),
        node('b', 'unclassified'),
      ),
    ).toThrow(DomainRuleViolation);
  });

  it('canonicalizes symmetric conflict pairs', () => {
    expect(canonicalConflictPair('z', 'a')).toEqual(['a', 'z']);
  });

  it('rejects self relations', () => {
    const same = node('a', 'goal');
    expect(() => assertMeaningRelationAllowed('supports', same, same)).toThrow(
      DomainRuleViolation,
    );
  });
});

describe('node merge', () => {
  it('resolves a canonical target through a merge chain', () => {
    const mergedInto = new Map<string, string | undefined>([
      ['a', 'b'],
      ['b', 'c'],
    ]);

    expect(resolveCanonicalNodeId('a', mergedInto)).toBe('c');
  });

  it('rejects a merge that would create a cycle', () => {
    const mergedInto = new Map<string, string | undefined>([['b', 'a']]);
    expect(() => assertMergeAllowed('a', 'b', mergedInto)).toThrow(
      DomainRuleViolation,
    );
  });
});

describe('projection approval', () => {
  const approved: ProjectionApprovalEvent = {
    id: 'event-1',
    projectionRevisionId: 'projection-r1',
    type: 'approved',
    approvalDigest: 'digest',
    createdAt: '2026-09-05T01:00:00Z',
  };

  it('treats a projection without events as unapproved', () => {
    expect(resolveProjectionApprovalState([])).toBe('unapproved');
  });

  it('uses the latest approval event', () => {
    expect(
      resolveProjectionApprovalState([
        approved,
        {
          ...approved,
          id: 'event-2',
          type: 'revoked',
          createdAt: '2026-09-05T02:00:00Z',
        },
      ]),
    ).toBe('revoked');
  });

  it('only allows approved projections to become active', () => {
    expect(() => assertProjectionCanBeActive([approved])).not.toThrow();
    expect(() => assertProjectionCanBeActive([])).toThrow(DomainRuleViolation);
  });
});

describe('resurfacing eligibility', () => {
  const baseState: ReviewState = {
    subjectNodeId: 'node-1',
    updatedAt: '2026-09-05T00:00:00Z',
  };

  it('excludes explicitly excluded nodes', () => {
    expect(
      isAutoResurfacingEligible(
        {...baseState, isResurfacingExcluded: true},
        '2026-09-05T00:00:00Z',
      ),
    ).toBe(false);
  });

  it('respects snooze windows', () => {
    expect(
      isAutoResurfacingEligible(
        {...baseState, snoozedUntil: '2026-09-10T00:00:00Z'},
        '2026-09-05T00:00:00Z',
      ),
    ).toBe(false);
  });

  it('allows a node after snooze expires', () => {
    expect(
      isAutoResurfacingEligible(
        {...baseState, snoozedUntil: '2026-09-01T00:00:00Z'},
        '2026-09-05T00:00:00Z',
      ),
    ).toBe(true);
  });
});
