import { flameStateOf } from '../useJournalFlame';

describe('flameStateOf', () => {
  const s = (isFrozen: boolean, justUnfrozeToday: boolean) => ({
    isFrozen,
    justUnfrozeToday,
  });

  it('a frozen streak is ice, whatever else is true', () => {
    expect(flameStateOf(s(true, false), false)).toBe('ice');
    expect(flameStateOf(s(true, true), false)).toBe('ice');
  });
  it('warmed up today: the warming plays once', () => {
    expect(flameStateOf(s(false, true), false)).toBe('warming');
  });
  it('…and never again that day (the flag stays true all day)', () => {
    expect(flameStateOf(s(false, true), true)).toBe('fire');
  });
  it('an ordinary streak is fire', () => {
    expect(flameStateOf(s(false, false), false)).toBe('fire');
  });
  it('no streak data yet is fire, not ice', () => {
    expect(flameStateOf(null, false)).toBe('fire');
  });
});
