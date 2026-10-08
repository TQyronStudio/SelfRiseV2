// Habit pause periods — "a paused day is never a missed day"
//
// WHY THIS EXISTS (device audit 2026-10-08): pausing a habit was a bare
// is_active flag with no dates. After resuming, every scheduled day of the
// pause (a week of vacation…) showed RED in the habit calendar, pulled the
// completion rate and Home charts down, and soaked up bonus completions as
// "make-up" for days the user never owed.
//
// These tests run the REAL storage against the in-memory SQLite (global jest
// setup): pausing / resuming must record WHEN, getAll()/getById() must return
// the periods attached, and wasScheduledOnDate() must treat paused days as
// unscheduled while the resume day is a normal day again.

import { SQLiteHabitStorage } from '../SQLiteHabitStorage';
import { DayOfWeek } from '../../../types/common';
import { backfillHabitPausePeriods, getDatabase } from '../../database/init';
import { isHabitPausedOnDate, wasScheduledOnDate } from '../../../utils/habitImmutability';
import { getDayOfWeekFromDateString, subtractDays, today } from '../../../utils/date';

jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));

const storage = new SQLiteHabitStorage();

const EVERY_DAY = Object.values(DayOfWeek);

async function createHabit(createdDaysAgo: number): Promise<string> {
  const habit = await storage.create({
    name: `Test habit ${Math.random().toString(36).slice(2)}`,
    color: 'blue' as any,
    icon: 'fitness' as any,
    scheduledDays: EVERY_DAY,
  });
  const db = getDatabase();
  const createdAt = Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000;
  await db.runAsync(`UPDATE habits SET created_at = ? WHERE id = ?`, [createdAt, habit.id]);
  return habit.id;
}

/** Move the habit's open pause back in time — "paused N days ago". */
async function backdateOpenPause(habitId: string, daysAgo: number): Promise<void> {
  await getDatabase().runAsync(
    `UPDATE habit_pause_periods SET start_date = ? WHERE habit_id = ? AND end_date IS NULL`,
    [subtractDays(today(), daysAgo), habitId]
  );
}

function scheduled(habit: any, date: string): boolean {
  return wasScheduledOnDate(habit, date, getDayOfWeekFromDateString(date));
}

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync(`DELETE FROM habit_pause_periods`);
  await db.runAsync(`DELETE FROM habit_schedule_history`);
  await db.runAsync(`DELETE FROM habit_completions`);
  await db.runAsync(`DELETE FROM habits`);
});

describe('SQLiteHabitStorage pause periods', () => {
  test('pausing opens a period starting today, attached by getById and getAll', async () => {
    const id = await createHabit(30);
    await storage.update(id, { isActive: false });

    const habit = (await storage.getById(id))!;
    expect(habit.isActive).toBe(false);
    expect(habit.pausePeriods).toEqual([{ startDate: today() }]);

    const [fromGetAll] = await storage.getAll();
    expect(fromGetAll!.pausePeriods).toEqual(habit.pausePeriods);
  });

  // Petr's scenario: pause before a week of vacation, resume after it.
  test('a week-long pause: paused days are not scheduled, the resume day is', async () => {
    const id = await createHabit(30);
    await storage.update(id, { isActive: false });
    await backdateOpenPause(id, 7);
    await storage.update(id, { isActive: true });

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toEqual([{ startDate: subtractDays(today(), 7), endDate: today() }]);

    for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
      const date = subtractDays(today(), daysAgo);
      expect(isHabitPausedOnDate(habit, date)).toBe(true);
      expect(scheduled(habit, date)).toBe(false); // → never red, never counted
    }
    expect(scheduled(habit, subtractDays(today(), 8))).toBe(true); // before the pause
    expect(scheduled(habit, today())).toBe(true); // resume day counts again
  });

  test('pause and resume on the same day leaves no period behind', async () => {
    const id = await createHabit(30);
    await storage.update(id, { isActive: false });
    await storage.update(id, { isActive: true });

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toBeUndefined();
    expect(scheduled(habit, today())).toBe(true);
  });

  test('pausing after completing today starts the pause tomorrow — today stays a scheduled completion', async () => {
    const id = await createHabit(30);
    await storage.toggleCompletion(id, today(), false);
    await storage.update(id, { isActive: false });

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toEqual([{ startDate: subtractDays(today(), -1) }]);
    expect(scheduled(habit, today())).toBe(true);
  });

  test('pausing an already paused habit does not open a second period', async () => {
    const id = await createHabit(30);
    await storage.update(id, { isActive: false });
    await storage.update(id, { isActive: false, name: 'Renamed while paused' });

    const rows = await getDatabase().getAllAsync(`SELECT * FROM habit_pause_periods WHERE habit_id = ?`, [id]);
    expect(rows).toHaveLength(1);
  });

  test('two separate pauses are both kept — history does not change', async () => {
    const id = await createHabit(60);
    await storage.update(id, { isActive: false });
    await backdateOpenPause(id, 30);
    await getDatabase().runAsync(
      `UPDATE habit_pause_periods SET end_date = ? WHERE habit_id = ?`,
      [subtractDays(today(), 25), id]
    );
    await getDatabase().runAsync(`UPDATE habits SET is_active = 1 WHERE id = ?`, [id]);

    await storage.update(id, { isActive: false });
    await backdateOpenPause(id, 3);
    await storage.update(id, { isActive: true });

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toHaveLength(2);
    expect(scheduled(habit, subtractDays(today(), 28))).toBe(false); // first pause
    expect(scheduled(habit, subtractDays(today(), 10))).toBe(true); // between pauses
    expect(scheduled(habit, subtractDays(today(), 2))).toBe(false); // second pause
    expect(scheduled(habit, today())).toBe(true);
  });

  test('non-pause updates do not touch pause periods', async () => {
    const id = await createHabit(30);
    await storage.update(id, { name: 'Renamed habit' });

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toBeUndefined();
  });
});

describe('backfillHabitPausePeriods (habits paused before pause periods existed)', () => {
  async function pauseTheOldWay(id: string, pausedDaysAgo: number): Promise<void> {
    const pausedAt = Date.now() - pausedDaysAgo * 24 * 60 * 60 * 1000;
    await getDatabase().runAsync(
      `UPDATE habits SET is_active = 0, updated_at = ? WHERE id = ?`,
      [pausedAt, id]
    );
  }

  test('a paused habit without a period gets one starting on its last update', async () => {
    const id = await createHabit(30);
    await pauseTheOldWay(id, 5);

    await backfillHabitPausePeriods(getDatabase());

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toEqual([{ startDate: subtractDays(today(), 5) }]);
  });

  test('completed on the pause day → the backfilled pause starts the next day', async () => {
    const id = await createHabit(30);
    await getDatabase().runAsync(
      `INSERT INTO habit_completions (id, habit_id, date, completed, is_bonus, created_at, updated_at)
       VALUES (?, ?, ?, 1, 0, ?, ?)`,
      [`c-${id}`, id, subtractDays(today(), 5), Date.now(), Date.now()]
    );
    await pauseTheOldWay(id, 5);

    await backfillHabitPausePeriods(getDatabase());

    const habit = (await storage.getById(id))!;
    expect(habit.pausePeriods).toEqual([{ startDate: subtractDays(today(), 4) }]);
  });

  test('is idempotent and leaves active habits alone', async () => {
    const pausedId = await createHabit(30);
    const activeId = await createHabit(30);
    await pauseTheOldWay(pausedId, 5);

    await backfillHabitPausePeriods(getDatabase());
    await backfillHabitPausePeriods(getDatabase());

    const rows = await getDatabase().getAllAsync<{ habit_id: string }>(`SELECT habit_id FROM habit_pause_periods`);
    expect(rows.map(r => r.habit_id)).toEqual([pausedId]);
    expect((await storage.getById(activeId))!.pausePeriods).toBeUndefined();
  });
});
