import { DayOfWeek, HabitColor, HabitIcon } from '../types/common';

/**
 * Ready-made habits offered on the first onboarding screen.
 *
 * WHY THESE EXIST: the old 25-step tutorial walked the user through the habit
 * form field by field — six steps to produce one habit, four of which only
 * explained fields that already have working defaults (`HabitForm.tsx:185-186`).
 * A preset collapses name + icon + colour into a single tap.
 *
 * A preset is a STARTING POINT, NOT A LOCK. The onboarding screen shows the
 * normal editable controls underneath, so the user can change the name, icon,
 * colour and days before creating anything.
 *
 * `nameKey` is resolved with `t()` at the moment of creation, so the habit is
 * stored in the language the user picked on the preferences screen. Switching
 * language later does not rewrite already-created habits — that is expected;
 * the name is the user's own data from that point on.
 *
 * Goal templates deliberately live elsewhere (`GoalTemplatesModal.tsx`) — they
 * already existed and are reused for onboarding screen 2 rather than duplicated.
 */
export interface HabitPreset {
  /** Stable id — used as React key and in tests, never shown to the user. */
  id: string;
  /** i18n key under `onboarding.habitPresets`. */
  nameKey: string;
  icon: HabitIcon;
  color: HabitColor;
}

export const ALL_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const HABIT_PRESETS: HabitPreset[] = [
  { id: 'water', nameKey: 'onboarding.habitPresets.water', icon: HabitIcon.WATER, color: HabitColor.BLUE },
  { id: 'exercise', nameKey: 'onboarding.habitPresets.exercise', icon: HabitIcon.FITNESS, color: HabitColor.RED },
  { id: 'read', nameKey: 'onboarding.habitPresets.read', icon: HabitIcon.BOOK, color: HabitColor.PURPLE },
  { id: 'meditate', nameKey: 'onboarding.habitPresets.meditate', icon: HabitIcon.MEDITATION, color: HabitColor.TEAL },
  { id: 'sleep', nameKey: 'onboarding.habitPresets.sleep', icon: HabitIcon.SLEEP, color: HabitColor.ORANGE },
  { id: 'eatHealthy', nameKey: 'onboarding.habitPresets.eatHealthy', icon: HabitIcon.FOOD, color: HabitColor.GREEN },
];

/**
 * Values applied when the user picks "Something else" and names the habit
 * themselves. `scheduledDays` is the important one: it is the only required
 * field with no default in the form (`HabitForm.tsx:206`), so leaving it empty
 * would block the user on a validation error during onboarding.
 */
export const CUSTOM_HABIT_DEFAULTS = {
  icon: HabitIcon.FITNESS,
  color: HabitColor.BLUE,
  scheduledDays: ALL_DAYS,
} as const;
