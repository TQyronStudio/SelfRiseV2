import { XP_REWARDS } from '../../constants/gamification';
import {
  journalEntryXp,
  journalMilestoneAt,
  journalMilestoneXp,
  journalPositionXp,
} from '../journalXp';

const J = XP_REWARDS.JOURNAL;

describe('journal XP by daily position', () => {
  it('the daily three', () => {
    expect([1, 2, 3].map(journalEntryXp)).toEqual([J.FIRST_ENTRY, J.SECOND_ENTRY, J.THIRD_ENTRY]);
  });
  it('bonus entries 4–13, nothing from 14', () => {
    expect(journalEntryXp(4)).toBe(J.BONUS_ENTRY);
    expect(journalEntryXp(13)).toBe(J.BONUS_ENTRY);
    expect(journalEntryXp(14)).toBe(J.FOURTEENTH_PLUS_ENTRY);
  });
  it('milestones ⭐ 4, 🔥 8, 👑 13 on top', () => {
    expect([4, 8, 13].map(journalMilestoneAt)).toEqual(['star', 'flame', 'crown']);
    expect(journalMilestoneAt(5)).toBeNull();
    expect(journalMilestoneXp(8)).toBe(J.FIFTH_BONUS_MILESTONE);
    expect(journalPositionXp(4)).toBe(J.BONUS_ENTRY + J.FIRST_BONUS_MILESTONE);
    expect(journalPositionXp(2)).toBe(J.SECOND_ENTRY);
  });
});
