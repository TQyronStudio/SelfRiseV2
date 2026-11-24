/** One set of form rules for the composer and the old form (E6 point 2). */
import { DayOfWeek } from '@/src/types/common';
import { habitFormErrors } from '../habitFormRules';

const ok = { name: 'Read', scheduledDays: [DayOfWeek.MONDAY], description: '' };

describe('habitFormErrors()', () => {
  it('passes a valid habit', () => {
    expect(habitFormErrors(ok)).toEqual({});
  });
  it.each([
    ['', 'habits.form.errors.nameRequired'],
    ['   ', 'habits.form.errors.nameRequired'],
    ['A', 'habits.form.errors.nameTooShort'],
    ['x'.repeat(51), 'habits.form.errors.nameTooLong'],
  ])('name %p → %s', (name, key) => {
    expect(habitFormErrors({ ...ok, name }).name).toBe(key);
  });
  it('trims before measuring (" Go " is fine)', () => {
    expect(habitFormErrors({ ...ok, name: ' Go ' }).name).toBeUndefined();
  });
  it('needs at least one day', () => {
    expect(habitFormErrors({ ...ok, scheduledDays: [] }).scheduledDays).toBe(
      'habits.form.errors.daysRequired'
    );
  });
  it('caps the description at 200', () => {
    expect(habitFormErrors({ ...ok, description: 'x'.repeat(201) }).description).toBe(
      'habits.form.errors.descriptionTooLong'
    );
    expect(habitFormErrors({ ...ok, description: 'x'.repeat(200) })).toEqual({});
  });
});
