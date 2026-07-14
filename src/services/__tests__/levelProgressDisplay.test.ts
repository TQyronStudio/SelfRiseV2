// XP Progress Display — Regression Suite
//
// WHY THIS EXISTS (July 14, 2026): the Home XP bar showed "100/250 XP" next to an EMPTY
// bar reading "0.0%". Both halves came from different scales:
//
//   * the bar/percentage used the LEVEL-RELATIVE progress (xpInCurrentLevel / xpNeeded)
//   * the "x / y XP" label used LIFETIME totals (totalXP / (totalXP + xpToNextLevel))
//
// At exactly 100 lifetime XP the user has just reached level 1, so 0% is genuinely
// correct — but "100/250" reads as 40% and made the app look broken. The label now uses
// the same level-relative scale as the bar.
//
// These tests pin the invariant: whatever the label shows must agree with the bar.

import { getXPProgress } from '../levelCalculation';

/** Exactly what OptimizedXpProgressBar renders. */
function renderedProgress(totalXP: number) {
  const p = getXPProgress(totalXP);
  const xpInCurrentLevel = p.xpInCurrentLevel;
  const xpNeededForNextLevel = xpInCurrentLevel + p.xpToNextLevel;

  return {
    level: p.currentLevel,
    barPercent: p.xpProgress,
    label: { current: xpInCurrentLevel, total: xpNeededForNextLevel },
  };
}

describe('XP progress bar: label and bar must use the same scale', () => {
  const SAMPLES = [0, 25, 50, 99, 100, 101, 175, 249, 250, 500, 1000, 5000];

  it.each(SAMPLES)('totalXP=%i: label fraction matches the bar percentage', totalXP => {
    const { barPercent, label } = renderedProgress(totalXP);

    // The label must never imply a different fill than the bar draws.
    const labelPercent = label.total > 0 ? (label.current / label.total) * 100 : 100;

    // getXPProgress floors the percentage, so allow that single point of rounding.
    expect(Math.abs(labelPercent - barPercent)).toBeLessThan(1);
  });

  it.each(SAMPLES)('totalXP=%i: label never exceeds its own denominator', totalXP => {
    const { label } = renderedProgress(totalXP);

    expect(label.current).toBeGreaterThanOrEqual(0);
    expect(label.current).toBeLessThanOrEqual(label.total);
  });

  it('THE BUG: reaching a level exactly shows an empty bar AND a 0/x label (not 100/250)', () => {
    // 100 XP = exactly level 1 → you are at the very start of level 1.
    const { level, barPercent, label } = renderedProgress(100);

    expect(level).toBe(1);
    expect(barPercent).toBe(0); // bar is genuinely empty — this was always correct
    expect(label.current).toBe(0); // ...and the label must agree, instead of saying "100"
    expect(label.total).toBeGreaterThan(0);
  });

  it('progress inside a level fills both the bar and the label together', () => {
    const atLevelStart = renderedProgress(100);
    const midLevel = renderedProgress(175); // half-way through level 1 (100 → 250)

    expect(midLevel.level).toBe(1);
    expect(midLevel.barPercent).toBeGreaterThan(atLevelStart.barPercent);
    expect(midLevel.label.current).toBeGreaterThan(atLevelStart.label.current);
    expect(midLevel.label.total).toBe(atLevelStart.label.total); // same level → same denominator
  });
});
