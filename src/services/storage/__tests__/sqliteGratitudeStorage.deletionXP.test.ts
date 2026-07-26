/**
 * Regression tests: deleting a journal entry must leave the day worth exactly
 * what its remaining number of entries is worth.
 *
 * THE MODEL (Petr's proposal, 2026-07-26): a day's journal XP depends on HOW MANY
 * entries it has, not on which row the user deleted. Positions 1-3 are worth
 * 20 XP each, 4-13 are worth 8, and the ⭐🔥👑 milestones land on 4 / 8 / 13.
 * Deleting any entry renumbers the survivors down, so the position that actually
 * disappears is always the LAST one — and that is what must be refunded.
 *
 * V(N) = value of a day holding N entries. The refund is V(N) − V(N−1), which by
 * construction equals base(N) + milestone(N).
 *
 * THE BUG this replaces: the refund used the DELETED row's position. Petr's
 * example — 4 entries = 93 XP; delete the 2nd and 3 entries remain, worth 60; the
 * old code refunded position 2 (20 XP) and left 73, i.e. 13 XP too many. Repeating
 * delete+add also re-earned the ⭐ milestone every cycle.
 */

import { sqliteGratitudeStorage } from '../SQLiteGratitudeStorage';
import { GamificationService } from '../../gamificationService';
import { getDatabase } from '../../database/init';
import { today } from '../../../utils/date';
import { DateString } from '../../../types/common';

const TODAY = today() as DateString;

/** What a day holding `n` entries is worth: 20/20/20, then 8 each, + ⭐🔥👑. */
const dayValue = (n: number): number => {
  let total = 0;
  for (let p = 1; p <= n; p++) {
    total += p <= 3 ? 20 : p <= 13 ? 8 : 0;
    if (p === 4) total += 25;
    if (p === 8) total += 50;
    if (p === 13) total += 100;
  }
  return total;
};

const addEntry = (content: string) =>
  sqliteGratitudeStorage.create({ content, date: TODAY, type: 'gratitude' });

const entries = () => sqliteGratitudeStorage.getByDate(TODAY);

describe('Journal deletion XP accounting', () => {
  beforeEach(async () => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM journal_entries');
    await GamificationService.clearAllData();
  });

  it('awards the documented amounts as entries accumulate', async () => {
    for (let n = 1; n <= 5; n++) {
      await addEntry(`entry ${n}`);
      expect(await GamificationService.getTotalXP()).toBe(dayValue(n));
    }
    // Sanity-check the fixture against the guide: 4 entries = 20*3 + 8 + 25 = 93.
    expect(dayValue(4)).toBe(93);
  });

  it("Petr's example: 4 entries, delete the 2nd → day is worth 3 entries", async () => {
    for (let n = 1; n <= 4; n++) await addEntry(`entry ${n}`);
    expect(await GamificationService.getTotalXP()).toBe(93);

    const all = await entries();
    await sqliteGratitudeStorage.delete(all[1]!.id); // the 2nd row

    // Old behaviour refunded position 2 (20 XP) and left 73.
    expect(await GamificationService.getTotalXP()).toBe(dayValue(3)); // 60
  });

  it('refunds the top position no matter which row is deleted', async () => {
    for (const victim of [0, 1, 2, 3]) {
      await getDatabase().runAsync('DELETE FROM journal_entries');
      await GamificationService.clearAllData();

      for (let n = 1; n <= 4; n++) await addEntry(`entry ${n}`);
      const all = await entries();
      await sqliteGratitudeStorage.delete(all[victim]!.id);

      expect(await GamificationService.getTotalXP()).toBe(dayValue(3));
    }
  });

  it('stays exact while deleting all the way down', async () => {
    for (let n = 1; n <= 5; n++) await addEntry(`entry ${n}`);

    for (let remaining = 4; remaining >= 0; remaining--) {
      const all = await entries();
      await sqliteGratitudeStorage.delete(all[0]!.id); // always the first row
      expect(await GamificationService.getTotalXP()).toBe(dayValue(remaining));
    }
  });

  it('closes the milestone re-earn leak: delete+add nets zero', async () => {
    for (let n = 1; n <= 4; n++) await addEntry(`entry ${n}`);
    const before = await GamificationService.getTotalXP();
    expect(before).toBe(93); // includes the ⭐ milestone

    for (let cycle = 0; cycle < 5; cycle++) {
      const all = await entries();
      await sqliteGratitudeStorage.delete(all[1]!.id);
      await addEntry(`replacement ${cycle}`);

      // Old behaviour gained +13 per cycle (refunded 20, re-awarded 8 + ⭐25).
      expect(await GamificationService.getTotalXP()).toBe(before);
    }
  });

  it('handles the 🔥 milestone position (8) symmetrically', async () => {
    for (let n = 1; n <= 8; n++) await addEntry(`entry ${n}`);
    expect(await GamificationService.getTotalXP()).toBe(dayValue(8));

    const all = await entries();
    await sqliteGratitudeStorage.delete(all[5]!.id); // a middle bonus entry

    // Releases position 8, which is worth 8 + 50 = 58.
    expect(await GamificationService.getTotalXP()).toBe(dayValue(7));
  });

  it('reverses the multiplied grant when a 2x multiplier is active', async () => {
    const spy = jest
      .spyOn(GamificationService, 'getActiveXPMultiplier')
      .mockResolvedValue({ isActive: true, multiplier: 2 });

    try {
      for (let n = 1; n <= 4; n++) await addEntry(`entry ${n}`);
      expect(await GamificationService.getTotalXP()).toBe(dayValue(4) * 2); // 186

      const all = await entries();
      await sqliteGratitudeStorage.delete(all[1]!.id);

      // The released position was granted at 2x, so 2x must come back.
      expect(await GamificationService.getTotalXP()).toBe(dayValue(3) * 2); // 120
    } finally {
      spy.mockRestore();
    }
  });

  it('reverses the full grant even after the multiplier expires', async () => {
    const spy = jest
      .spyOn(GamificationService, 'getActiveXPMultiplier')
      .mockResolvedValue({ isActive: true, multiplier: 2 });
    for (let n = 1; n <= 4; n++) await addEntry(`entry ${n}`);
    expect(await GamificationService.getTotalXP()).toBe(186);

    // Multiplier runs out before the user deletes anything.
    spy.mockResolvedValue({ isActive: false, multiplier: 1 });

    const all = await entries();
    await sqliteGratitudeStorage.delete(all[1]!.id);

    expect(await GamificationService.getTotalXP()).toBe(dayValue(3) * 2); // 120
    spy.mockRestore();
  });
});
