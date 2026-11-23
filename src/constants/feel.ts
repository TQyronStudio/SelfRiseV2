/**
 * The feel of SelfRise — one vocabulary of touch and sound (R-35, O-12: haptics
 * everywhere, a few gentle sounds at the big moments, sounds can be switched off).
 * Moved 1:1 from the Design Lab (labFeel.ts) in migration stage E2; the lab keeps
 * its copy while it exists (a fix goes to both, O-6). Free of React Native so it
 * can be tested (src/constants/__tests__/feel.test.ts).
 *
 * Converted screens never call impact()/notification()/selection() by hand: they
 * call feel('<moment>') from src/services/feelService.ts, and the moment's name
 * decides the pattern and the sound.
 *
 * Rules (tested):
 * - Sound only at the big moments — windows that happen rarely. Anything that
 *   happens every day (a check, an entry, a finished day) stays silent: a daily
 *   sound turns into noise within a week.
 * - At most one heavy tap per pattern, and a pattern is over in 400 ms: touch
 *   answers, it does not perform.
 * - Warnings are a single soft pattern, never with sound.
 * - The user's switches win: haptics off = no touch, sounds off = no sound; the
 *   phone's silent mode silences sound too (the player respects it).
 */

export type Tap =
  'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning';

export type SoundId = 'celebrate' | 'chapter' | 'complete' | 'boost';

export type FeelMoment =
  /** A toggle, a tab, a choice in a list — and PressableScale's default press. */
  | 'tap'
  /** A firmer button press (light impact), where a tick is too little. */
  | 'press'
  /** A habit checked off (CheckButton) — a firmer answer than a press. */
  | 'check'
  /** A check taken back. */
  | 'uncheck'
  /** Something was saved or added: a habit, a goal, an entry, a log. */
  | 'saved'
  /** The input cannot be saved as it is (validation at the field). */
  | 'invalid'
  /** A quiet note slides out of the level badge. */
  | 'note'
  /** The day is complete (all habits, or the journal's three). */
  | 'dayDone'
  /** The streak's ice melts and the flame catches again. */
  | 'ignite'
  /** Calm news that is not good: a star kept by a hair, a step down, a lost star. */
  | 'gentleWarning'
  /** The big trophy window (epic, legendary). */
  | 'trophyWindow'
  /** A journal streak window (7, 30, 100, 365, 1000 days). */
  | 'streakWindow'
  /** A new chapter of levels — five times in an account's life. */
  | 'chapter'
  /** The monthly challenge finished. */
  | 'challengeDone'
  /** The XP multiplier switched on. */
  | 'multiplierOn'
  /** A destructive choice confirmed (delete, start fresh). */
  | 'confirm'
  /** An ordinary level up: the badge's LEVEL UP tag, no window. */
  | 'levelUp'
  /** A new challenge star lands in its window. */
  | 'starUp'
  /** ⭐ 🔥 👑 — a bonus entry of the day (4th, 8th, 13th). */
  | 'bonusEntry'
  /** A goal reached its target — its own moment, rare. */
  | 'goalDone';

export interface Feel {
  /** Taps with their start time in ms. */
  pattern: { at: number; tap: Tap }[];
  sound: SoundId | null;
}

export const FEEL: Record<FeelMoment, Feel> = {
  tap: { pattern: [{ at: 0, tap: 'selection' }], sound: null },
  press: { pattern: [{ at: 0, tap: 'light' }], sound: null },
  check: { pattern: [{ at: 0, tap: 'medium' }], sound: null },
  uncheck: { pattern: [{ at: 0, tap: 'light' }], sound: null },
  saved: { pattern: [{ at: 0, tap: 'success' }], sound: null },
  invalid: { pattern: [{ at: 0, tap: 'warning' }], sound: null },
  note: { pattern: [{ at: 0, tap: 'light' }], sound: null },
  dayDone: { pattern: [{ at: 0, tap: 'success' }], sound: null },
  ignite: {
    pattern: [
      { at: 0, tap: 'light' },
      { at: 120, tap: 'success' },
    ],
    sound: null,
  },
  gentleWarning: { pattern: [{ at: 0, tap: 'warning' }], sound: null },
  trophyWindow: {
    pattern: [
      { at: 0, tap: 'medium' },
      { at: 140, tap: 'success' },
    ],
    sound: 'celebrate',
  },
  streakWindow: { pattern: [{ at: 0, tap: 'success' }], sound: 'celebrate' },
  // Rising: three steps up, the last one the heaviest.
  chapter: {
    pattern: [
      { at: 0, tap: 'light' },
      { at: 110, tap: 'medium' },
      { at: 220, tap: 'heavy' },
    ],
    sound: 'chapter',
  },
  challengeDone: { pattern: [{ at: 0, tap: 'success' }], sound: 'complete' },
  multiplierOn: {
    pattern: [
      { at: 0, tap: 'light' },
      { at: 90, tap: 'success' },
    ],
    sound: 'boost',
  },
  confirm: { pattern: [{ at: 0, tap: 'medium' }], sound: null },
  levelUp: { pattern: [{ at: 0, tap: 'success' }], sound: null },
  starUp: { pattern: [{ at: 0, tap: 'heavy' }], sound: null },
  // Daily-ish (a busy writer gets one most days): no sound.
  bonusEntry: { pattern: [{ at: 0, tap: 'success' }], sound: null },
  goalDone: {
    pattern: [
      { at: 0, tap: 'medium' },
      { at: 120, tap: 'success' },
    ],
    sound: 'complete',
  },
};

/** The moments that may make a sound: the rare windows. */
export const SOUND_MOMENTS: readonly FeelMoment[] = [
  'trophyWindow',
  'streakWindow',
  'chapter',
  'challengeDone',
  'multiplierOn',
  'goalDone',
];

/** What actually plays, after the user's switches. */
export function feelFor(
  moment: FeelMoment,
  switches: { haptics: boolean; sounds: boolean }
): Feel {
  const feel = FEEL[moment];
  return {
    pattern: switches.haptics ? feel.pattern : [],
    sound: switches.sounds ? feel.sound : null,
  };
}

/** The longest a pattern may last (ms). */
export const MAX_PATTERN_MS = 400;
