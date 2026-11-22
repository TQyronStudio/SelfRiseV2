import { XP_MULTIPLIERS } from '../../../constants/gamification';
import {
  boostMoment,
  boostOf,
  badgeMark,
  formatFactor,
  multiplierStatus,
  shouldAnnounceReady,
} from '../multiplierLogic';

const idle = { harmonyDays: 0, running: null, cooldownHoursLeft: 0 };

describe('multiplierStatus', () => {
  it('shows a running multiplier above everything else', () => {
    const status = multiplierStatus(
      {
        harmonyDays: 7,
        running: { factor: 1.5, minutesLeft: 90 },
        cooldownHoursLeft: 0,
      },
      7
    );
    expect(status).toEqual({ kind: 'running', factor: 1.5, minutesLeft: 90 });
  });

  it('treats a multiplier with no time left as over', () => {
    const status = multiplierStatus(
      { ...idle, harmonyDays: 3, running: { factor: 2, minutesLeft: 0 } },
      7
    );
    expect(status.kind).toBe('building');
  });

  it('is ready after seven harmony days without a cooldown', () => {
    expect(multiplierStatus({ ...idle, harmonyDays: 7 }, 7)).toEqual({
      kind: 'ready',
    });
    expect(multiplierStatus({ ...idle, harmonyDays: 6 }, 7).kind).toBe(
      'building'
    );
  });

  it('is not ready during the cooldown, and says how many days are left', () => {
    const status = multiplierStatus(
      { ...idle, harmonyDays: 9, cooldownHoursLeft: 30 },
      7
    );
    expect(status).toEqual({
      kind: 'building',
      days: 7,
      required: 7,
      cooldownDays: 2,
    });
  });

  it('never lights more segments than there are', () => {
    const status = multiplierStatus(
      { ...idle, harmonyDays: 12, cooldownHoursLeft: 5 },
      7
    );
    expect(status.kind === 'building' && status.days).toBe(7);
  });
});

describe('badgeMark', () => {
  it('puts the tag on while running, a dot while ready, nothing otherwise', () => {
    expect(badgeMark({ kind: 'running', factor: 2, minutesLeft: 5 })).toBe(
      'tag'
    );
    expect(badgeMark({ kind: 'ready' })).toBe('dot');
    expect(
      badgeMark({ kind: 'building', days: 3, required: 7, cooldownDays: 0 })
    ).toBeNull();
  });
});

describe('shouldAnnounceReady', () => {
  const ready = { kind: 'ready' } as const;

  it('announces a readiness once, even when it arrived overnight', () => {
    expect(shouldAnnounceReady(ready, 'streak-2026-11-14', null)).toBe(true);
    expect(
      shouldAnnounceReady(ready, 'streak-2026-11-14', 'streak-2026-11-14')
    ).toBe(false);
  });

  it('announces the next readiness again', () => {
    expect(
      shouldAnnounceReady(ready, 'streak-2026-11-28', 'streak-2026-11-14')
    ).toBe(true);
  });

  it('never announces while it is not ready', () => {
    expect(
      shouldAnnounceReady(
        { kind: 'building', days: 6, required: 7, cooldownDays: 0 },
        'streak-2026-11-14',
        null
      )
    ).toBe(false);
  });
});

describe('formatFactor', () => {
  it('prints whole factors without decimals and others in the locale', () => {
    expect(formatFactor(2, '.')).toBe('2×');
    expect(formatFactor(1.5, '.')).toBe('1.5×');
    expect(formatFactor(2.5, ',')).toBe('2,5×');
  });
});

describe('multipliers that switch on by themselves (L-11)', () => {
  it("runs what the app's service sets", () => {
    expect(boostOf('achievement_combo')).toEqual({
      factor: XP_MULTIPLIERS.ACHIEVEMENT_COMBO_MULTIPLIER,
      hours: XP_MULTIPLIERS.ACHIEVEMENT_COMBO_DURATION,
    });
    expect(boostOf('challenge_completion')).toEqual({
      factor: XP_MULTIPLIERS.CHALLENGE_COMPLETION_MULTIPLIER,
      hours: XP_MULTIPLIERS.CHALLENGE_COMPLETION_DURATION,
    });
    expect(boostOf('inactive_user_return')).toEqual({ factor: 2, hours: 48 });
  });

  it('never gives an automatic multiplier a window of its own', () => {
    expect(boostMoment('harmony_streak')).toBe('ownWindow');
    expect(boostMoment('achievement_combo')).toBe('trophyMoment');
    expect(boostMoment('challenge_completion')).toBe('challengeWindow');
    expect(boostMoment('inactive_user_return')).toBe('welcomeNote');
  });
});
