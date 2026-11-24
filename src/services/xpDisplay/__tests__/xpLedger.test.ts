/**
 * The XP display ledger (E7): shown + in flight + held = the real total, always.
 */
import { XPSourceType } from '@/src/types/gamification';
import {
  displayedXP,
  expireHeld,
  HOLD_FALLBACK_MS,
  holdKindOf,
  landFlight,
  ledgerTotal,
  LedgerState,
  receiveGain,
  releaseHeld,
  splitGain,
  syncLedger,
} from '../xpLedger';

const habit = {
  amount: 25,
  source: XPSourceType.HABIT_COMPLETION,
  sourceId: 'h1',
};
const trophy = {
  amount: 100,
  source: XPSourceType.ACHIEVEMENT_UNLOCK,
  sourceId: 'first-habit',
};

describe('the books always balance', () => {
  it('through a run of gains, landings, releases, a safety flight and a take-back', () => {
    let real = 1000;
    let s: LedgerState = syncLedger(real);
    const step = (next: LedgerState, delta = 0) => {
      real += delta;
      s = next;
      expect(ledgerTotal(s)).toBe(real);
    };
    step(receiveGain(s, habit, 0, true), 25);
    step(receiveGain(s, trophy, 10, false), 100);
    step(landFlight(s, s.flights[0]!.id));
    step(releaseHeld(s, 'trophy'));
    step(landFlight(s, s.flights[0]!.id));
    step(
      receiveGain(
        s,
        { amount: 250, source: XPSourceType.GOAL_COMPLETION },
        20,
        false
      ),
      250
    );
    step(expireHeld(s, 20 + HOLD_FALLBACK_MS, new Set()));
    step(
      receiveGain(
        s,
        { amount: -25, source: XPSourceType.HABIT_COMPLETION },
        30,
        false
      ),
      -25
    );
    expect(s.flights.every(f => f.amount > 0)).toBe(true);
  });
});

describe('receiveGain()', () => {
  it('flies an ordinary gain from the action, or from the centre', () => {
    expect(receiveGain(syncLedger(0), habit, 0, true).flights[0]?.from).toBe(
      'action'
    );
    expect(receiveGain(syncLedger(0), habit, 0, false).flights[0]?.from).toBe(
      'center'
    );
  });

  it("holds a trophy's XP for its moment", () => {
    const s = receiveGain(syncLedger(0), trophy, 5, true);
    expect(s.flights).toEqual([]);
    expect(s.held).toEqual([
      expect.objectContaining({ amount: 100, kind: 'trophy', at: 5 }),
    ]);
  });

  it('sends nothing for XP taken back — the ring only shrinks, never drawn below 0', () => {
    const s = receiveGain(
      syncLedger(10),
      { amount: -25, source: XPSourceType.HABIT_COMPLETION },
      0,
      true
    );
    expect(s.flights).toEqual([]);
    expect(displayedXP(s)).toBe(0);
  });
});

describe('what is held, and how much', () => {
  it('holds trophies, a finished challenge, a finished goal and the journal streak reward', () => {
    expect(holdKindOf(trophy)).toBe('trophy');
    expect(
      holdKindOf({ amount: 1, source: XPSourceType.GOAL_COMPLETION })
    ).toBe('goal');
    expect(
      holdKindOf({ amount: 1, source: XPSourceType.JOURNAL_STREAK_MILESTONE })
    ).toBe('streak');
    expect(
      holdKindOf({
        amount: 1,
        source: XPSourceType.MONTHLY_CHALLENGE,
        metadata: { type: 'monthly_challenge_completion' },
      })
    ).toBe('challenge');
  });

  it('lets a challenge milestone and everyday XP fly at once', () => {
    expect(
      holdKindOf({
        amount: 1,
        source: XPSourceType.MONTHLY_CHALLENGE,
        metadata: { type: 'monthly_challenge_milestone' },
      })
    ).toBeNull();
    expect(holdKindOf(habit)).toBeNull();
    expect(
      holdKindOf({ amount: 1, source: XPSourceType.JOURNAL_ENTRY })
    ).toBeNull();
  });

  it('splits a ⭐🔥👑 entry: the base flies, the milestone part waits — from the amount credited', () => {
    // 20 base + 25 milestone, credited ×2 by a running multiplier = 90.
    const gain = {
      amount: 90,
      source: XPSourceType.JOURNAL_BONUS_MILESTONE,
      metadata: { baseXp: 20, milestoneXp: 25 },
    };
    expect(splitGain(gain)).toEqual({ now: 40, held: 50, kind: 'bonusEntry' });
  });

  it('lets a milestone source without the split fly whole', () => {
    expect(
      splitGain({ amount: 30, source: XPSourceType.JOURNAL_BONUS_MILESTONE })
    ).toEqual({
      now: 30,
      held: 0,
      kind: null,
    });
  });
});

describe('releaseHeld() and expireHeld()', () => {
  const held = receiveGain(syncLedger(0), trophy, 1000, false);

  it('releases only the moment that was acknowledged, from its button', () => {
    const other = releaseHeld(held, 'goal');
    expect(other.held).toHaveLength(1);
    const released = releaseHeld(held, 'trophy');
    expect(released.held).toEqual([]);
    expect(released.flights[0]).toEqual(
      expect.objectContaining({ amount: 100, from: 'moment' })
    );
  });

  it('never keeps XP forever: no moment within 2 s → it flies from the centre', () => {
    expect(
      expireHeld(held, 1000 + HOLD_FALLBACK_MS - 1, new Set()).held
    ).toHaveLength(1);
    const flown = expireHeld(held, 1000 + HOLD_FALLBACK_MS, new Set());
    expect(flown.held).toEqual([]);
    expect(flown.flights[0]?.from).toBe('center');
  });

  it('keeps waiting while its moment is queued or on screen', () => {
    expect(
      expireHeld(held, 1000 + 10 * HOLD_FALLBACK_MS, new Set(['trophy'])).held
    ).toHaveLength(1);
  });
});
