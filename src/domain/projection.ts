import {DomainRuleViolation} from './errors';
import type {ProjectionApprovalEvent} from './types';

export type ProjectionApprovalState = 'unapproved' | 'approved' | 'revoked';

export function resolveProjectionApprovalState(
  events: readonly ProjectionApprovalEvent[],
): ProjectionApprovalState {
  if (events.length === 0) {
    return 'unapproved';
  }

  const latest = [...events].sort((a, b) => {
    const byTime = a.createdAt.localeCompare(b.createdAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  })[events.length - 1];

  return latest.type === 'approved' ? 'approved' : 'revoked';
}

export function assertProjectionCanBeActive(
  events: readonly ProjectionApprovalEvent[],
): void {
  if (resolveProjectionApprovalState(events) !== 'approved') {
    throw new DomainRuleViolation(
      'PROJECTION_NOT_APPROVED',
      '공개 승인된 잠금화면 문장만 대표 문장으로 설정할 수 있습니다.',
    );
  }
}
