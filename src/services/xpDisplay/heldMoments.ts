/**
 * Which window releases which held XP (migration E7 point 3) — pure, tested in
 * __tests__/heldMoments.test.ts. Until E10 converts the windows, a held gain
 * flies when its OLD window (ModalQueueContext) closes.
 */
import type { ModalType } from '@/src/contexts/ModalQueueContext';
import { HoldKind } from './xpLedger';

export function holdKindOfModal(type: ModalType): HoldKind | null {
  switch (type) {
    case 'achievement':
    // A new chapter may carry the trophies of its action (L-8).
    case 'level_up':
      return 'trophy';
    case 'goal_completion':
      return 'goal';
    case 'celebration_streak_milestone':
      return 'streak';
    case 'celebration_bonus_milestone':
      return 'bonusEntry';
    case 'monthly_challenge_completion':
      return 'challenge';
    default:
      return null;
  }
}

/** The kinds whose window is queued or showing — their XP keeps waiting. */
export function pendingHoldKinds(types: readonly ModalType[]): Set<HoldKind> {
  const kinds = new Set<HoldKind>();
  for (const type of types) {
    const kind = holdKindOfModal(type);
    if (kind) kinds.add(kind);
  }
  return kinds;
}

/**
 * The window that was on screen and is gone now: its kind is released. `before`
 * and `after` are the current window types (queue heads) of two renders.
 */
export function releasedKind(
  before: ModalType | null,
  after: ModalType | null,
  closedSameTypeAgain = false
): HoldKind | null {
  if (!before) return null;
  if (before === after && !closedSameTypeAgain) return null;
  return holdKindOfModal(before);
}
