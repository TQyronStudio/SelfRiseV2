/**
 * A progress entry only takes a real date, today or earlier (live bug,
 * 2026-11-24: any text was saved).
 */
import { progressDateError } from '../progressEntryRules';

const TODAY = '2026-11-24';

describe('progressDateError()', () => {
  it.each(['2026-11-24', '2026-01-01', ' 2026-11-20 '])('takes %p', date => {
    expect(progressDateError(date, TODAY)).toBeNull();
  });

  it.each(['', 'tomorrow', '2026-13-45', '2026-02-30', '24.11.2026', '2026-1-5'])(
    'refuses %p as not a date',
    date => {
      expect(progressDateError(date, TODAY)).toBe('format');
    }
  );

  it('refuses a future day', () => {
    expect(progressDateError('2026-11-25', TODAY)).toBe('future');
  });
});
