import type {ReviewState} from './types';

export function isAutoResurfacingEligible(
  state: ReviewState | undefined,
  now: string,
): boolean {
  if (state === undefined) {
    return true;
  }

  if (state.isResurfacingExcluded === true) {
    return false;
  }

  if (state.snoozedUntil !== undefined && state.snoozedUntil > now) {
    return false;
  }

  return true;
}
