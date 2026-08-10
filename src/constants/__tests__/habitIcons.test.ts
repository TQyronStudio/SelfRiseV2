// Habit icons — Regression Suite
//
// WHY THIS EXISTS (July 2026, reported by a tester): picking the moon icon in Habits
// showed a BED on Home. The 14-icon map had been copy-pasted into five components and
// one copy drifted (`[HabitIcon.SLEEP]: 'bed-outline'`). Nothing — not tsc, not a test —
// noticed, because each copy was internally valid.
//
// The fix was structural: one shared map (HABIT_ICON_MAP) that every screen imports, so
// "different icon on Home than in the picker" is no longer expressible. These tests
// guard the properties that map must keep.

import { HabitIcon } from '../../types/common';
import { HABIT_ICON_MAP, getHabitIonicon } from '../habitIcons';

// The raw glyph map (plain JSON) rather than the <Ionicons> component: importing the
// component would drag Expo's native modules into Jest, and all we need are the names.
const glyphMap = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const IONICON_NAMES = new Set(Object.keys(glyphMap));

describe('HABIT_ICON_MAP', () => {
  it('covers every HabitIcon — a new enum member cannot ship without an icon', () => {
    for (const icon of Object.values(HabitIcon)) {
      expect(HABIT_ICON_MAP[icon]).toBeDefined();
    }
    expect(Object.keys(HABIT_ICON_MAP)).toHaveLength(Object.values(HabitIcon).length);
  });

  it('maps only to REAL Ionicons names (a typo renders a blank icon, not an error)', () => {
    for (const [icon, name] of Object.entries(HABIT_ICON_MAP)) {
      expect(IONICON_NAMES.has(name)).toBe(true);
      // Guards the failure mode of DailyHabitTracker, which passed the raw enum value
      // ('sleep', 'meditation', …) straight to <Ionicons> — only 4 of 14 are real names.
      expect(name).not.toBe(icon);
    }
  });

  it('THE BUG: sleep is the moon, never a bed', () => {
    expect(HABIT_ICON_MAP[HabitIcon.SLEEP]).toBe('moon-outline');
  });

  it('has the dumbbell the testers asked for, distinct from the fitness icon', () => {
    expect(HABIT_ICON_MAP[HabitIcon.DUMBBELL]).toBe('barbell-outline');
    expect(HABIT_ICON_MAP[HabitIcon.DUMBBELL]).not.toBe(HABIT_ICON_MAP[HabitIcon.FITNESS]);
  });

  it('gives every icon a distinct glyph — two habits must stay tellable apart', () => {
    const names = Object.values(HABIT_ICON_MAP);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('getHabitIonicon', () => {
  it('returns the mapped glyph for a known icon', () => {
    expect(getHabitIonicon(HabitIcon.SLEEP)).toBe('moon-outline');
  });

  it('falls back to a real glyph for an unknown stored value', () => {
    // Habits saved by an older/newer build can hold an icon this build does not know;
    // passing that through to <Ionicons> would draw nothing at all.
    const fallback = getHabitIonicon('icon-from-the-future');
    expect(IONICON_NAMES.has(fallback)).toBe(true);
  });
});
