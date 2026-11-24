import {
  registerXpOrigin,
  resetXpOrigins,
  takeXpOrigin,
} from '../xpOriginRegistry';

beforeEach(() => resetXpOrigins());

describe('xpOriginRegistry', () => {
  it('matches by sourceId and forgets the point once used', () => {
    registerXpOrigin(
      { source: 'habit_completion', sourceId: 'h1' },
      { x: 10, y: 20 },
      0
    );
    expect(
      takeXpOrigin({ source: 'habit_completion', sourceId: 'h1' }, 5000)
    ).toEqual({ x: 10, y: 20 });
    expect(
      takeXpOrigin({ source: 'habit_completion', sourceId: 'h1' }, 5000)
    ).toBeNull();
  });

  it('falls back to the kind of source only while the record is fresh (3 s)', () => {
    registerXpOrigin({ source: 'journal_entry' }, { x: 1, y: 2 }, 0);
    expect(
      takeXpOrigin({ source: 'journal_entry', sourceId: 'e9' }, 3001)
    ).toBeNull();
    registerXpOrigin({ source: 'journal_entry' }, { x: 3, y: 4 }, 10000);
    expect(
      takeXpOrigin({ source: 'journal_entry', sourceId: 'e9' }, 12000)
    ).toEqual({ x: 3, y: 4 });
  });

  it('matches the family: the Add button of the journal serves its 4th (bonus) entry too', () => {
    registerXpOrigin({ source: 'journal_entry' }, { x: 7, y: 8 }, 0);
    expect(
      takeXpOrigin({ source: 'journal_bonus_milestone', sourceId: 'e4' }, 500)
    ).toEqual({ x: 7, y: 8 });
    registerXpOrigin({ source: 'journal_entry' }, { x: 7, y: 8 }, 0);
    expect(takeXpOrigin({ source: 'habit_completion' }, 500)).toBeNull();
  });

  it('takes the newest touch of a kind', () => {
    registerXpOrigin({ source: 'goal_progress' }, { x: 1, y: 1 }, 0);
    registerXpOrigin({ source: 'goal_progress' }, { x: 2, y: 2 }, 100);
    expect(takeXpOrigin({ source: 'goal_progress' }, 200)).toEqual({
      x: 2,
      y: 2,
    });
  });

  it('returns null when nothing was registered — the spark starts from the centre', () => {
    expect(
      takeXpOrigin({ source: 'habit_completion', sourceId: 'x' }, 0)
    ).toBeNull();
  });
});
