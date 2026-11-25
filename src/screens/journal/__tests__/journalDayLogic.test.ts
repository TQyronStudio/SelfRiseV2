import {
  completedTheDay,
  dayStatusKey,
  nextMilestone,
  roadProgress,
} from '../journalDayLogic';

describe('completedTheDay (R-13: the third entry, in place)', () => {
  it('the third entry completes the day', () => {
    expect(completedTheDay(2, 3)).toBe(true);
  });
  it('not on the first render, nor when entries load after launch', () => {
    expect(completedTheDay(null, 3)).toBe(false);
    expect(completedTheDay(0, 3)).toBe(false);
    expect(completedTheDay(0, 5)).toBe(false);
  });
  it('not for a bonus entry, nor a deletion', () => {
    expect(completedTheDay(3, 4)).toBe(false);
    expect(completedTheDay(4, 3)).toBe(false);
  });
});

describe('bonus road', () => {
  it('names the next milestone and how many are left', () => {
    expect(nextMilestone(3)).toEqual({ kind: 'star', left: 1 });
    expect(nextMilestone(4)).toEqual({ kind: 'flame', left: 4 });
    expect(nextMilestone(12)).toEqual({ kind: 'crown', left: 1 });
    expect(nextMilestone(13)).toBeNull();
  });
  it('fills from the third entry to the thirteenth', () => {
    expect(roadProgress(3)).toBe(0);
    expect(roadProgress(8)).toBe(0.5);
    expect(roadProgress(20)).toBe(1);
  });
});

describe('the status line', () => {
  it('counts what is needed, then the calm sentences', () => {
    expect(dayStatusKey(1)).toEqual({ key: 'journal.progress.entriesNeeded', count: 2 });
    expect(dayStatusKey(3)).toEqual({ key: 'journal.progress.dailyComplete' });
    expect(dayStatusKey(5)).toEqual({ key: 'journal.progress.bonusAmazing' });
  });
});
