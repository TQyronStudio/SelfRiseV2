/**
 * Regression tests: a day's journal entries must always be numbered 1..N with no
 * gaps and no duplicates.
 *
 * THE BUG (device test 2026-07-26, found by Petr): he wrote 5 entries, deleted the
 * 2nd from history, then wrote another one — and the list showed 1, 3, 4, 5, 5.
 * `create()` derived the new number from `COUNT(*) + 1`, but `delete()` left a gap,
 * so the count no longer matched the highest number in use and the new entry was
 * handed a number that already existed.
 *
 * `gratitude_number` is not a cosmetic label. `isBonus` is `number > 3`, base XP
 * comes from `getXPForJournalEntry(position)`, and the ⭐🔥👑 milestones fire at
 * exactly 4 / 8 / 13 — so a gap mis-classifies every entry after it.
 */

import { sqliteGratitudeStorage } from '../SQLiteGratitudeStorage';
import { getDatabase } from '../../database/init';
import { today } from '../../../utils/date';
import { DateString } from '../../../types/common';

const TODAY = today() as DateString;

const addEntry = (content: string) =>
  sqliteGratitudeStorage.create({
    content,
    date: TODAY,
    type: 'gratitude',
  });

/** The day's numbering, in list order. */
const numbering = async (): Promise<number[]> => {
  const entries = await sqliteGratitudeStorage.getByDate(TODAY);
  return entries.map(e => e.order);
};

describe('Journal entry numbering (gap/duplicate regression)', () => {
  beforeEach(async () => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM journal_entries');
  });

  it('numbers a fresh day 1..N', async () => {
    for (let i = 1; i <= 5; i++) await addEntry(`entry ${i}`);

    expect(await numbering()).toEqual([1, 2, 3, 4, 5]);
  });

  it('closes the gap when an entry is deleted', async () => {
    const created = [];
    for (let i = 1; i <= 5; i++) created.push(await addEntry(`entry ${i}`));

    await sqliteGratitudeStorage.delete(created[1]!.id); // delete #2

    // Pre-fix this was [1, 3, 4, 5].
    expect(await numbering()).toEqual([1, 2, 3, 4]);
  });

  it("reproduces Petr's exact scenario: 5 entries, delete the 2nd, add one more", async () => {
    const created = [];
    for (let i = 1; i <= 5; i++) created.push(await addEntry(`entry ${i}`));

    await sqliteGratitudeStorage.delete(created[1]!.id);
    await addEntry('the new one');

    // Pre-fix this was [1, 3, 4, 5, 5] — note the duplicate 5.
    expect(await numbering()).toEqual([1, 2, 3, 4, 5]);
  });

  it('never produces a duplicate number across many delete/add cycles', async () => {
    for (let i = 1; i <= 4; i++) await addEntry(`entry ${i}`);

    for (let cycle = 0; cycle < 5; cycle++) {
      const entries = await sqliteGratitudeStorage.getByDate(TODAY);
      await sqliteGratitudeStorage.delete(entries[1]!.id); // always remove the 2nd
      await addEntry(`replacement ${cycle}`);

      const numbers = await numbering();
      expect(new Set(numbers).size).toBe(numbers.length); // no duplicates
      expect(numbers).toEqual([1, 2, 3, 4]); // and no gaps
    }
  });

  it('re-classifies isBonus after renumbering (position drives the badge)', async () => {
    const created = [];
    for (let i = 1; i <= 4; i++) created.push(await addEntry(`entry ${i}`));

    let entries = await sqliteGratitudeStorage.getByDate(TODAY);
    expect(entries.map(e => e.isBonus)).toEqual([false, false, false, true]);

    await sqliteGratitudeStorage.delete(created[0]!.id); // delete #1

    // Three entries remain, so all three are part of the daily minimum — the
    // former bonus entry is now #3 and must no longer be flagged as a bonus.
    entries = await sqliteGratitudeStorage.getByDate(TODAY);
    expect(entries.map(e => e.order)).toEqual([1, 2, 3]);
    expect(entries.map(e => e.isBonus)).toEqual([false, false, false]);
  });

  it('heals a day that was already broken before this fix', async () => {
    // Simulate the state left on Petr's device: a gap written straight into the
    // table, exactly as the old delete() would have left it.
    const db = getDatabase();
    const ts = Date.now();
    const rows: Array<[string, number]> = [
      ['legacy-1', 1],
      ['legacy-3', 3],
      ['legacy-4', 4],
      ['legacy-5', 5],
    ];
    for (const [id, num] of rows) {
      await db.runAsync(
        'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, `legacy ${num}`, 'gratitude', TODAY, num, ts + num, ts + num]
      );
    }
    expect(await numbering()).toEqual([1, 3, 4, 5]);

    // Writing the next entry normalises the day first, so no duplicate appears.
    await addEntry('after the fix');

    expect(await numbering()).toEqual([1, 2, 3, 4, 5]);
  });

  it('leaves an explicitly supplied order alone (migration / demo data path)', async () => {
    await sqliteGratitudeStorage.create({
      content: 'explicit',
      date: TODAY,
      type: 'gratitude',
      order: 7,
    });

    const entries = await sqliteGratitudeStorage.getByDate(TODAY);
    expect(entries[0]!.order).toBe(7);
  });

  it('keeps days independent', async () => {
    const yesterday = '2026-07-25' as DateString;
    await sqliteGratitudeStorage.create({ content: 'y1', date: yesterday, type: 'gratitude' });
    await sqliteGratitudeStorage.create({ content: 'y2', date: yesterday, type: 'gratitude' });

    const t1 = await addEntry('t1');
    await addEntry('t2');

    await sqliteGratitudeStorage.delete(t1.id);

    expect((await sqliteGratitudeStorage.getByDate(yesterday)).map(e => e.order)).toEqual([1, 2]);
    expect(await numbering()).toEqual([1]);
  });
});
