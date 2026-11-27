import {
  addMonthsClamped,
  goalFormErrors,
  parseGoalNumber,
  presetDeadline,
  weeklyPace,
} from '../goalFormRules';

const valid = { title: 'Read books', unit: 'books', targetValue: 12, description: '' };

describe('goalFormErrors — the old GoalForm rules, one copy', () => {
  it('a valid goal has no errors', () => {
    expect(goalFormErrors(valid)).toEqual({});
  });
  it('title: required, 2 to 100', () => {
    expect(goalFormErrors({ ...valid, title: '  ' }).title).toBe('goals.form.errors.titleRequired');
    expect(goalFormErrors({ ...valid, title: 'A' }).title).toBe('goals.form.errors.titleTooShort');
    expect(goalFormErrors({ ...valid, title: 'x'.repeat(101) }).title).toBe('goals.form.errors.titleTooLong');
  });
  it('unit: required, at most 20', () => {
    expect(goalFormErrors({ ...valid, unit: '' }).unit).toBe('goals.form.errors.unitRequired');
    expect(goalFormErrors({ ...valid, unit: 'x'.repeat(21) }).unit).toBe('goals.form.errors.unitTooLong');
  });
  it('target: above 0, within the limit, not NaN', () => {
    expect(goalFormErrors({ ...valid, targetValue: 0 }).targetValue).toBe('goals.form.errors.targetValueRequired');
    expect(goalFormErrors({ ...valid, targetValue: NaN }).targetValue).toBe('goals.form.errors.targetValueRequired');
    expect(goalFormErrors({ ...valid, targetValue: 1e13 }).targetValue).toBe('goals.form.errors.targetValueTooLarge');
  });
  it('description: at most 300', () => {
    expect(goalFormErrors({ ...valid, description: 'x'.repeat(301) }).description).toBe(
      'goals.form.errors.descriptionTooLong'
    );
  });
});

describe('parseGoalNumber', () => {
  it('reads decimals and grouped numbers (the old form cut 10.5 to 10)', () => {
    expect(parseGoalNumber('10.5')).toBe(10.5);
    expect(parseGoalNumber('10,5')).toBe(10.5);
    expect(parseGoalNumber('1 000 000')).toBe(1000000);
    expect(parseGoalNumber('')).toBeNaN();
    expect(parseGoalNumber('abc')).toBeNaN();
  });
});

describe('deadline presets', () => {
  it('months keep the day; the 31st lands on the month’s last day', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
    expect(presetDeadline('m3', '2026-11-28')).toBe('2027-02-28');
    expect(presetDeadline('m6', '2026-05-10')).toBe('2026-11-10');
  });
  it('end of year — next year’s when it is under two weeks away', () => {
    expect(presetDeadline('year', '2026-06-01')).toBe('2026-12-31');
    expect(presetDeadline('year', '2026-12-20')).toBe('2027-12-31');
  });
  it('no deadline and the calendar give no preset date', () => {
    expect(presetDeadline('none', '2026-06-01')).toBeNull();
    expect(presetDeadline('pick', '2026-06-01')).toBeNull();
  });
  it('the weekly pace over the weeks left', () => {
    expect(weeklyPace(12, '2027-01-26', '2026-11-03')).toBeCloseTo(1); // 84 days = 12 weeks
    expect(weeklyPace(12, null, '2026-11-03')).toBeNull();
    expect(weeklyPace(NaN, '2027-01-26', '2026-11-03')).toBeNull();
  });
});
