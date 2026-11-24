/**
 * The rules of a habit's form — ONE copy for the composer sheet (E6) and the old
 * HabitForm (plan E6 point 2: "share the validation, do not copy it"). Pure,
 * tested in __tests__/habitFormRules.test.ts. Returns i18n KEYS; the screen
 * translates them.
 */
import { DayOfWeek } from '@/src/types/common';

export const HABIT_NAME_MIN = 2;
export const HABIT_NAME_MAX = 50;
export const HABIT_DESCRIPTION_MAX = 200;

export type HabitFormField = 'name' | 'scheduledDays' | 'description';

export function habitFormErrors(data: {
  name: string;
  scheduledDays: DayOfWeek[];
  description?: string | undefined;
}): Partial<Record<HabitFormField, string>> {
  const errors: Partial<Record<HabitFormField, string>> = {};
  const name = data.name.trim();
  if (!name) errors.name = 'habits.form.errors.nameRequired';
  else if (name.length < HABIT_NAME_MIN) errors.name = 'habits.form.errors.nameTooShort';
  else if (name.length > HABIT_NAME_MAX) errors.name = 'habits.form.errors.nameTooLong';
  if (data.scheduledDays.length === 0) errors.scheduledDays = 'habits.form.errors.daysRequired';
  if (data.description && data.description.length > HABIT_DESCRIPTION_MAX) {
    errors.description = 'habits.form.errors.descriptionTooLong';
  }
  return errors;
}
