/**
 * The rules of a goal's form (migration E15) — the composer sheet's ONE copy of
 * what the old GoalForm checked (plan E15 point 2: share, do not copy). Pure,
 * tested in __tests__/goalFormRules.test.ts. Errors are i18n KEYS; the screen
 * translates them.
 */
import { DateString } from '@/src/types/common';
import { MAX_GOAL_VALUE } from '@/src/constants/goals';
import { daysBetween, formatDateToString, parseDate } from '@/src/utils/date';

export const GOAL_TITLE_MIN = 2;
export const GOAL_TITLE_MAX = 100;
export const GOAL_UNIT_MAX = 20;
export const GOAL_DESCRIPTION_MAX = 300;

export type GoalFormField = 'title' | 'unit' | 'targetValue' | 'description';

export function goalFormErrors(data: {
  title: string;
  unit: string;
  targetValue: number;
  description?: string | undefined;
}): Partial<Record<GoalFormField, string>> {
  const errors: Partial<Record<GoalFormField, string>> = {};
  const title = data.title.trim();
  if (!title) errors.title = 'goals.form.errors.titleRequired';
  else if (title.length < GOAL_TITLE_MIN) errors.title = 'goals.form.errors.titleTooShort';
  else if (title.length > GOAL_TITLE_MAX) errors.title = 'goals.form.errors.titleTooLong';
  const unit = data.unit.trim();
  if (!unit) errors.unit = 'goals.form.errors.unitRequired';
  else if (unit.length > GOAL_UNIT_MAX) errors.unit = 'goals.form.errors.unitTooLong';
  if (!(data.targetValue > 0)) errors.targetValue = 'goals.form.errors.targetValueRequired';
  else if (data.targetValue > MAX_GOAL_VALUE) errors.targetValue = 'goals.form.errors.targetValueTooLarge';
  if (data.description && data.description.length > GOAL_DESCRIPTION_MAX) {
    errors.description = 'goals.form.errors.descriptionTooLong';
  }
  return errors;
}

/**
 * A typed number: "1 000,5" / "1000.5" → 1000.5; empty or nonsense → NaN.
 * (The old form used parseInt and silently cut 10.5 km to 10.)
 */
export function parseGoalNumber(text: string): number {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.');
  if (!cleaned || !/^\d*\.?\d*$/.test(cleaned) || cleaned === '.') return NaN;
  return Number(cleaned);
}

// ---------------------------------------------------------------------------
// Deadline presets
// ---------------------------------------------------------------------------

export type DeadlinePreset = 'm1' | 'm3' | 'm6' | 'year' | 'none' | 'pick';
export const DEADLINE_PRESETS: DeadlinePreset[] = ['m1', 'm3', 'm6', 'year', 'none', 'pick'];

/** The same day N months on; the 31st lands on the month's last day, never in the next month. */
export function addMonthsClamped(date: DateString, months: number): DateString {
  const d = parseDate(date);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return formatDateToString(target);
}

/** Within this many days of 31 December, "end of year" means next year's. */
const YEAR_END_MIN_DAYS = 14;

/** The date a preset stands for; null = no deadline (or "pick" — the calendar says). */
export function presetDeadline(preset: DeadlinePreset, today: DateString): DateString | null {
  switch (preset) {
    case 'm1':
      return addMonthsClamped(today, 1);
    case 'm3':
      return addMonthsClamped(today, 3);
    case 'm6':
      return addMonthsClamped(today, 6);
    case 'year': {
      const year = parseDate(today).getFullYear();
      const end = `${year}-12-31` as DateString;
      return daysBetween(today, end) < YEAR_END_MIN_DAYS ? (`${year + 1}-12-31` as DateString) : end;
    }
    default:
      return null;
  }
}

/** "That's about N a week": the span over the weeks to the deadline. */
export function weeklyPace(
  span: number,
  deadline: DateString | null,
  today: DateString
): number | null {
  if (!deadline || !(span > 0) || !Number.isFinite(span)) return null;
  const weeks = Math.max(1, daysBetween(today, deadline)) / 7;
  return span / weeks;
}
