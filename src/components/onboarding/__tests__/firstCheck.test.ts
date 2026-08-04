/**
 * Stage F — knowing when the final card has done its job.
 *
 * The card exists for one moment: the user ticks their brand-new habit and
 * watches XP arrive. Getting the predicate wrong costs exactly that moment —
 * a card that vanishes before the user has done anything.
 *
 * The trap is the restart case. Rerunning onboarding from Settings in the
 * evening means today's habits may already be ticked, so "has anything been
 * checked today?" is true the instant the card mounts.
 */
import { countChecksOn, hasNewCheckSince, CompletionLike } from '../checkDetection';

const TODAY = '2026-08-02';
const YESTERDAY = '2026-08-01';

const check = (date: string, completed = true): CompletionLike => ({ date, completed });

describe('countChecksOn', () => {
  it('counts only today', () => {
    expect(countChecksOn([check(TODAY), check(YESTERDAY)], TODAY)).toBe(1);
  });

  it('ignores records that are switched off', () => {
    // Unchecking leaves a record behind with completed: false.
    expect(countChecksOn([check(TODAY, false)], TODAY)).toBe(0);
  });

  it('is zero for a fresh install', () => {
    expect(countChecksOn([], TODAY)).toBe(0);
  });
});

describe('hasNewCheckSince', () => {
  it('is false while nothing new has been ticked', () => {
    expect(hasNewCheckSince([], TODAY, 0)).toBe(false);
  });

  it('turns true on the first tick', () => {
    expect(hasNewCheckSince([check(TODAY)], TODAY, 0)).toBe(true);
  });

  it('ignores ticks that were already there when the card appeared', () => {
    // The restart case: two habits already done today, card mounts, nothing
    // new happens. The user must still get their moment.
    const existing = [check(TODAY), check(TODAY)];
    expect(hasNewCheckSince(existing, TODAY, 2)).toBe(false);
  });

  it('fires once the user adds a tick on top of the existing ones', () => {
    const existing = [check(TODAY), check(TODAY)];
    expect(hasNewCheckSince([...existing, check(TODAY)], TODAY, 2)).toBe(true);
  });

  it('is not fooled by yesterday', () => {
    expect(hasNewCheckSince([check(YESTERDAY)], TODAY, 0)).toBe(false);
  });

  it('does not fire when the user UNchecks something', () => {
    // Count falls below the baseline — that is not an achievement.
    expect(hasNewCheckSince([check(TODAY, false)], TODAY, 1)).toBe(false);
  });
});
