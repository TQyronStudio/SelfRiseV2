// Habit Schedule History — "MINULOST SE NEMĚNÍ" end-to-end regression suite
//
// WHY THIS EXISTS (super audit Fáze 4, N-4.1, July 2026): the immutability
// system was dead in the live path. SQLiteHabitStorage wrote schedule changes
// into habit_schedule_history but NOTHING ever read them back — rowToHabit
// left habit.scheduleHistory undefined, so getScheduledDaysForDate() silently
// fell back to the CURRENT scheduledDays for ALL historical dates. Changing a
// habit's days retroactively rewrote its entire history (completion rates,
// red/green calendar fields, bonus classification). The unit tests stayed
// green because they injected scheduleHistory manually — same pattern as the
// 2026-07-14 batch-truncation bug: units fine, wiring dead.
//
// These tests run the REAL storage against the in-memory SQLite (global jest
// setup): update() must persist the timeline (including the pre-change
// original schedule) and getAll()/getById() must return it attached.

import { SQLiteHabitStorage } from '../SQLiteHabitStorage';
import { DayOfWeek } from '../../../types/common';
import { getDatabase } from '../../database/init';
import { getScheduledDaysForDate } from '../../../utils/habitImmutability';
import { formatDateToString, subtractDays, today } from '../../../utils/date';

// Isolate from XP side effects — schedule history must not depend on gamification.
jest.mock('../../gamificationService', () => ({
  GamificationService: {
    addXP: jest.fn(async () => ({ success: true })),
    subtractXP: jest.fn(async () => ({ success: true })),
  },
}));

const storage = new SQLiteHabitStorage();

const ORIGINAL_DAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];
const NEW_DAYS = [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY];
const NEWER_DAYS = [DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];

async function createHabit(createdDaysAgo: number): Promise<string> {
  const habit = await storage.create({
    name: `Test habit ${Math.random().toString(36).slice(2)}`,
    color: 'blue' as any,
    icon: 'fitness' as any,
    scheduledDays: ORIGINAL_DAYS,
  });
  if (createdDaysAgo > 0) {
    const db = getDatabase();
    const createdAt = Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000;
    await db.runAsync(`UPDATE habits SET created_at = ? WHERE id = ?`, [createdAt, habit.id]);
  }
  return habit.id;
}

beforeEach(async () => {
  const db = getDatabase();
  await db.runAsync(`DELETE FROM habit_schedule_history`);
  await db.runAsync(`DELETE FROM habit_completions`);
  await db.runAsync(`DELETE FROM habits`);
});

describe('SQLiteHabitStorage schedule history (N-4.1)', () => {
  test('habit without schedule changes has no timeline (fallback = current schedule)', async () => {
    const id = await createHabit(14);

    const habit = await storage.getById(id);
    expect(habit).not.toBeNull();
    expect(habit!.scheduleHistory).toBeUndefined();

    const [fromGetAll] = await storage.getAll();
    expect(fromGetAll!.scheduleHistory).toBeUndefined();
  });

  test('first schedule change seeds the ORIGINAL schedule effective since creation', async () => {
    const id = await createHabit(14);

    await storage.update(id, { scheduledDays: NEW_DAYS });

    const habit = await storage.getById(id);
    expect(habit!.scheduledDays).toEqual(NEW_DAYS);
    expect(habit!.scheduleHistory?.entries).toHaveLength(2);

    const [seed, change] = habit!.scheduleHistory!.entries;
    expect(seed).toEqual({
      scheduledDays: ORIGINAL_DAYS,
      effectiveFromDate: subtractDays(today(), 14),
    });
    expect(change).toEqual({
      scheduledDays: NEW_DAYS,
      effectiveFromDate: today(),
    });
  });

  test('getAll attaches the same timeline as getById', async () => {
    const id = await createHabit(14);
    await storage.update(id, { scheduledDays: NEW_DAYS });

    const fromGetById = await storage.getById(id);
    const [fromGetAll] = await storage.getAll();

    expect(fromGetAll!.scheduleHistory).toEqual(fromGetById!.scheduleHistory);
  });

  test('history BEFORE the change resolves to the ORIGINAL schedule (the N-4.1 user scenario)', async () => {
    const id = await createHabit(14);
    await storage.update(id, { scheduledDays: NEW_DAYS });

    const habit = (await storage.getById(id))!;
    const lastWeek = subtractDays(today(), 7);

    // A week ago the habit was Mon-Fri — Tuesday WAS scheduled back then
    expect(getScheduledDaysForDate(habit, lastWeek)).toEqual(ORIGINAL_DAYS);
    // Today it is Mon/Wed/Fri
    expect(getScheduledDaysForDate(habit, today())).toEqual(NEW_DAYS);
  });

  test('second change on the same day replaces the entry instead of duplicating the date', async () => {
    const id = await createHabit(14);
    await storage.update(id, { scheduledDays: NEW_DAYS });
    await storage.update(id, { scheduledDays: NEWER_DAYS });

    const habit = (await storage.getById(id))!;
    expect(habit.scheduleHistory?.entries).toHaveLength(2); // seed + today (replaced)
    expect(habit.scheduleHistory!.entries[1]).toEqual({
      scheduledDays: NEWER_DAYS,
      effectiveFromDate: today(),
    });
    expect(getScheduledDaysForDate(habit, subtractDays(today(), 7))).toEqual(ORIGINAL_DAYS);
    expect(getScheduledDaysForDate(habit, today())).toEqual(NEWER_DAYS);
  });

  test('habit created today: first change writes no seed (no past to preserve)', async () => {
    const id = await createHabit(0);
    await storage.update(id, { scheduledDays: NEW_DAYS });

    const habit = (await storage.getById(id))!;
    expect(habit.scheduleHistory?.entries).toHaveLength(1);
    expect(habit.scheduleHistory!.entries[0]).toEqual({
      scheduledDays: NEW_DAYS,
      effectiveFromDate: today(),
    });
  });

  test('effective_from_date is the LOCAL calendar date, not UTC', async () => {
    const id = await createHabit(14);
    await storage.update(id, { scheduledDays: NEW_DAYS });

    const db = getDatabase();
    const row = await db.getFirstAsync<{ effective_from_date: string }>(
      `SELECT effective_from_date FROM habit_schedule_history
       WHERE habit_id = ? ORDER BY effective_from_date DESC LIMIT 1`,
      [id]
    );
    expect(row!.effective_from_date).toBe(formatDateToString(new Date()));
  });

  test('non-schedule updates do not touch the timeline', async () => {
    const id = await createHabit(14);
    await storage.update(id, { name: 'Renamed habit' });

    const habit = (await storage.getById(id))!;
    expect(habit.scheduleHistory).toBeUndefined();
  });
});
