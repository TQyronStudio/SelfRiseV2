/**
 * The XP DISPLAY ledger (migration E7, R-10) — pure, tested
 * (__tests__/xpLedger.test.ts).
 *
 * The app credits XP AT ONCE, in storage (GamificationService). The level badge
 * shows a DISPLAYED amount that catches up as the sparks land. This ledger keeps
 * the books of that display, and only of the display:
 *
 *     shown + in flight + held = the real total   (always)
 *
 * - A gain flies at once (from where the action was, or from the centre), or is
 *   HELD for its moment — the XP of a trophy, a finished challenge, a finished
 *   goal, a journal streak reward, and the milestone part of a ⭐🔥👑 entry — and
 *   flies when the user acknowledges that moment.
 * - Safety: a held gain whose moment is not queued or on screen within 2 s flies
 *   from the centre anyway (e.g. a trophy suppressed during onboarding). Nothing
 *   stays held forever.
 * - Negative XP sends nothing: the shown amount just drops.
 * - At app start and back from the background: shown = real, nothing in the air.
 *
 * It never touches real XP: GamificationService.addXP stays as it is.
 */
import { XPSourceType } from '@/src/types/gamification';

/** The moment a held gain waits for. */
export type HoldKind =
  'trophy' | 'challenge' | 'goal' | 'streak' | 'bonusEntry';

export interface XpGain {
  amount: number;
  source: XPSourceType | string;
  sourceId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface Flight {
  id: number;
  amount: number;
  /** Where it starts: the action's point (if registered), the centre, or the moment's button. */
  from: 'action' | 'center' | 'moment';
  source: XPSourceType | string;
  sourceId?: string | undefined;
}

export interface Held {
  id: number;
  amount: number;
  kind: HoldKind;
  /** When it arrived (ms) — for the 2 s safety. */
  at: number;
  source: XPSourceType | string;
  sourceId?: string | undefined;
}

export interface LedgerState {
  shown: number;
  flights: Flight[];
  held: Held[];
  nextId: number;
}

/** A held gain flies from the centre if its moment has not appeared by then. */
export const HOLD_FALLBACK_MS = 2000;

/** Start (and after the app comes back): the badge shows the real total. */
export function syncLedger(realTotal: number): LedgerState {
  return { shown: Math.max(0, realTotal), flights: [], held: [], nextId: 1 };
}

/** What the badge draws: the shown amount, never below zero. */
export function displayedXP(state: LedgerState): number {
  return Math.max(0, state.shown);
}

/** The real total the ledger accounts for: shown + in flight + held. */
export function ledgerTotal(state: LedgerState): number {
  return (
    state.shown +
    state.flights.reduce((sum, f) => sum + f.amount, 0) +
    state.held.reduce((sum, h) => sum + h.amount, 0)
  );
}

/** Which moment a gain waits for, if any. */
export function holdKindOf(gain: XpGain): HoldKind | null {
  switch (gain.source) {
    case XPSourceType.ACHIEVEMENT_UNLOCK:
      return 'trophy';
    case XPSourceType.GOAL_COMPLETION:
      return 'goal';
    case XPSourceType.JOURNAL_STREAK_MILESTONE:
      return 'streak';
    case XPSourceType.JOURNAL_BONUS_MILESTONE:
      return 'bonusEntry';
    case XPSourceType.MONTHLY_CHALLENGE:
      // Only the finished challenge has a window; a milestone flies at once.
      return gain.metadata?.type === 'monthly_challenge_milestone'
        ? null
        : 'challenge';
    default:
      return null;
  }
}

/**
 * How much of a gain flies now and how much waits. A ⭐🔥👑 entry is ONE
 * transaction carrying `baseXp` and `milestoneXp` (amounts before any
 * multiplier): the base flies from the Add button, the milestone part waits for
 * its moment — split in the same proportion from the amount really credited.
 */
export function splitGain(gain: XpGain): {
  now: number;
  held: number;
  kind: HoldKind | null;
} {
  if (gain.amount <= 0) return { now: gain.amount, held: 0, kind: null };
  const kind = holdKindOf(gain);
  if (!kind) return { now: gain.amount, held: 0, kind: null };
  if (kind === 'bonusEntry') {
    const base = Number(gain.metadata?.baseXp ?? 0);
    const milestone = Number(gain.metadata?.milestoneXp ?? 0);
    if (!(milestone > 0) || !(base + milestone > 0)) {
      return { now: gain.amount, held: 0, kind: null };
    }
    const held = Math.round((gain.amount * milestone) / (base + milestone));
    return { now: gain.amount - held, held, kind };
  }
  return { now: 0, held: gain.amount, kind };
}

/**
 * A gain arrives (an `xpGained` event). `hasOrigin`: the screen registered where
 * the action happened (xpOriginRegistry) — otherwise the spark starts at the centre.
 */
export function receiveGain(
  state: LedgerState,
  gain: XpGain,
  now: number,
  hasOrigin: boolean
): LedgerState {
  if (gain.amount <= 0) {
    // Taken back: no flight. First it cancels XP of the same thing that is still
    // held (a goal completed and un-completed before its window was seen — no
    // dip of the badge, no ghost flight later); the rest shrinks the ring. Not
    // clamped: a check undone while its spark still flies may take `shown` below
    // zero for a moment — the books balance, the badge draws displayedXP().
    let remaining = -gain.amount;
    const held: Held[] = [];
    for (const h of state.held) {
      if (
        remaining > 0 &&
        gain.sourceId !== undefined &&
        h.sourceId === gain.sourceId &&
        h.source === gain.source
      ) {
        const take = Math.min(h.amount, remaining);
        remaining -= take;
        if (h.amount - take > 0) held.push({ ...h, amount: h.amount - take });
      } else {
        held.push(h);
      }
    }
    return { ...state, held, shown: state.shown - remaining };
  }
  const split = splitGain(gain);
  let { nextId } = state;
  const flights = [...state.flights];
  const held = [...state.held];
  if (split.now > 0) {
    flights.push({
      id: nextId++,
      amount: split.now,
      from: hasOrigin ? 'action' : 'center',
      source: gain.source,
      sourceId: gain.sourceId,
    });
  }
  if (split.held > 0 && split.kind) {
    held.push({
      id: nextId++,
      amount: split.held,
      kind: split.kind,
      at: now,
      source: gain.source,
      sourceId: gain.sourceId,
    });
  }
  return { ...state, flights, held, nextId };
}

/** A spark hit the badge: its XP joins the shown amount. */
export function landFlight(state: LedgerState, flightId: number): LedgerState {
  const flight = state.flights.find(f => f.id === flightId);
  if (!flight) return state;
  return {
    ...state,
    shown: state.shown + flight.amount,
    flights: state.flights.filter(f => f.id !== flightId),
  };
}

/** The user acknowledged a moment: its held XP flies from the moment's button. */
export function releaseHeld(state: LedgerState, kind: HoldKind): LedgerState {
  const releasing = state.held.filter(h => h.kind === kind);
  if (releasing.length === 0) return state;
  let { nextId } = state;
  const flights = [
    ...state.flights,
    ...releasing.map(h => ({
      id: nextId++,
      amount: h.amount,
      from: 'moment' as const,
      source: h.source,
      sourceId: h.sourceId,
    })),
  ];
  return {
    ...state,
    flights,
    held: state.held.filter(h => h.kind !== kind),
    nextId,
  };
}

/**
 * The safety: a held gain older than HOLD_FALLBACK_MS whose kind of moment is
 * neither queued nor on screen flies from the centre.
 */
export function expireHeld(
  state: LedgerState,
  now: number,
  pendingKinds: ReadonlySet<HoldKind>
): LedgerState {
  const stale = state.held.filter(
    h => now - h.at >= HOLD_FALLBACK_MS && !pendingKinds.has(h.kind)
  );
  if (stale.length === 0) return state;
  let { nextId } = state;
  const flights = [
    ...state.flights,
    ...stale.map(h => ({
      id: nextId++,
      amount: h.amount,
      from: 'center' as const,
      source: h.source,
      sourceId: h.sourceId,
    })),
  ];
  const staleIds = new Set(stale.map(h => h.id));
  return {
    ...state,
    flights,
    held: state.held.filter(h => !staleIds.has(h.id)),
    nextId,
  };
}
