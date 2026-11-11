import {
  buildJourney,
  JourneyItem,
  LEVEL_TIERS,
  MAX_LEVEL,
  nextMilestone,
  stateOf,
  tierFill,
  tierOf,
} from '../levelsJourney';
import type { LabTierId } from '../labTokens';

const levelsOf = (items: JourneyItem[], tier?: LabTierId) =>
  items.flatMap(item =>
    item.kind === 'level' && (!tier || item.tier.id === tier)
      ? [item.level]
      : []
  );

const chapter = (items: JourneyItem[], tier: LabTierId) => {
  const found = items.find(
    item => item.kind === 'chapter' && item.tier.id === tier
  );
  if (!found || found.kind !== 'chapter') throw new Error(`no chapter ${tier}`);
  return found;
};

const level = (items: JourneyItem[], n: number) => {
  const found = items.find(item => item.kind === 'level' && item.level === n);
  if (!found || found.kind !== 'level') throw new Error(`no level ${n}`);
  return found;
};

describe('levels journey: tiers', () => {
  it('covers levels 1–100 without a gap or an overlap', () => {
    expect(LEVEL_TIERS[0]!.from).toBe(1);
    expect(LEVEL_TIERS[LEVEL_TIERS.length - 1]!.to).toBe(MAX_LEVEL);
    LEVEL_TIERS.slice(1).forEach((tier, i) => {
      expect(tier.from).toBe(LEVEL_TIERS[i]!.to + 1);
    });
  });

  it('follows the guide’s colour boundaries', () => {
    const at = (n: number) => tierOf(n).id;
    expect([at(1), at(10)]).toEqual(['beginner', 'beginner']);
    expect([at(11), at(20)]).toEqual(['growing', 'growing']);
    expect([at(21), at(40)]).toEqual(['rare', 'rare']);
    expect([at(41), at(60)]).toEqual(['epic', 'epic']);
    expect([at(61), at(80)]).toEqual(['legendary', 'legendary']);
    expect([at(81), at(100)]).toEqual(['mythic', 'mythic']);
  });

  it('puts a user without a level at the first tier, and never past the last', () => {
    expect(tierOf(0).id).toBe('beginner');
    expect(tierOf(250).id).toBe('mythic');
  });

  it('fills each part of the strip by the levels reached in it', () => {
    const [beginner, growing, rare] = LEVEL_TIERS;
    expect(tierFill(beginner!, 16)).toBe(1);
    expect(tierFill(growing!, 16)).toBeCloseTo(0.6);
    expect(tierFill(rare!, 16)).toBe(0);
    expect(tierFill(beginner!, 0)).toBe(0);
  });
});

describe('levels journey: the rows for level 16', () => {
  const items = buildJourney(16, new Set<LabTierId>(['growing']));

  it('has six chapters in order', () => {
    expect(
      items.flatMap(item => (item.kind === 'chapter' ? [item.tier.id] : []))
    ).toEqual(['beginner', 'growing', 'rare', 'epic', 'legendary', 'mythic']);
  });

  it('folds the finished chapter to its one line', () => {
    expect(chapter(items, 'beginner')).toMatchObject({
      state: 'done',
      reached: 10,
      size: 10,
      open: false,
    });
    expect(levelsOf(items, 'beginner')).toEqual([]);
  });

  it('shows the chapter the user is in level by level', () => {
    expect(chapter(items, 'growing')).toMatchObject({
      state: 'current',
      reached: 6,
      open: true,
    });
    expect(levelsOf(items, 'growing')).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
    expect(level(items, 15).state).toBe('done');
    expect(level(items, 16).state).toBe('current');
    expect(level(items, 17).state).toBe('ahead');
  });

  it('shows only the milestones of the chapters ahead', () => {
    expect(levelsOf(items, 'rare')).toEqual([25]);
    expect(levelsOf(items, 'epic')).toEqual([50]);
    expect(levelsOf(items, 'legendary')).toEqual([75]);
    expect(levelsOf(items, 'mythic')).toEqual([100]);
    expect(level(items, 25)).toMatchObject({ milestone: true, state: 'ahead' });
  });

  it('runs the path only between neighbouring levels', () => {
    expect(level(items, 11)).toMatchObject({
      joinedAbove: false,
      joinedBelow: true,
    });
    expect(level(items, 16)).toMatchObject({
      joinedAbove: true,
      joinedBelow: true,
    });
    expect(level(items, 20)).toMatchObject({
      joinedAbove: true,
      joinedBelow: false,
    });
    expect(level(items, 25)).toMatchObject({
      joinedAbove: false,
      joinedBelow: false,
    });
  });
});

describe('levels journey: the chapter in focus', () => {
  it('starts one level behind the user and runs to the chapter’s end', () => {
    const items = buildJourney(16, new Set<LabTierId>(), 'growing');
    expect(levelsOf(items, 'growing')).toEqual([15, 16, 17, 18, 19, 20]);
    // Folded, with more to show — and the path starts at the first row.
    expect(chapter(items, 'growing').open).toBe(false);
    expect(level(items, 15)).toMatchObject({
      state: 'done',
      joinedAbove: false,
      joinedBelow: true,
    });
  });

  it('does not reach back into the chapter before', () => {
    const items = buildJourney(11, new Set<LabTierId>(), 'growing');
    expect(levelsOf(items, 'beginner')).toEqual([]);
    expect(levelsOf(items, 'growing')[0]).toBe(11);
  });

  it('shows the whole first chapter to a user without a level', () => {
    const items = buildJourney(0, new Set<LabTierId>(), 'beginner');
    expect(levelsOf(items, 'beginner')).toHaveLength(10);
  });

  it('leaves the other chapters as they are', () => {
    const items = buildJourney(16, new Set<LabTierId>(), 'growing');
    expect(levelsOf(items, 'beginner')).toEqual([]);
    expect(levelsOf(items, 'rare')).toEqual([25]);
  });
});

describe('levels journey: opening and folding', () => {
  it('opens any chapter on demand, finished ones too', () => {
    const items = buildJourney(
      16,
      new Set<LabTierId>(['beginner', 'growing', 'rare'])
    );
    expect(levelsOf(items, 'beginner')).toHaveLength(10);
    expect(levelsOf(items, 'rare')).toHaveLength(20);
  });

  it('never folds the user’s own level away', () => {
    const items = buildJourney(16, new Set<LabTierId>());
    expect(levelsOf(items, 'growing')).toEqual([16]);
    expect(level(items, 16).state).toBe('current');
  });

  it('leaves a gap in the path between rows that are not neighbours', () => {
    // Folded "rare": the user's level 22 and the milestone 25 stand alone.
    const items = buildJourney(22, new Set<LabTierId>());
    expect(levelsOf(items, 'rare')).toEqual([22, 25]);
    expect(level(items, 22).joinedBelow).toBe(false);
    expect(level(items, 25).joinedAbove).toBe(false);
  });

  it('does not list a milestone that is already behind the user', () => {
    const items = buildJourney(30, new Set<LabTierId>());
    expect(levelsOf(items, 'beginner')).toEqual([]);
    // 25 is done; the user's own level stays.
    expect(levelsOf(items, 'rare')).toEqual([30]);
  });
});

describe('levels journey: the ends', () => {
  it('starts a user without a level at an open road', () => {
    const items = buildJourney(0, new Set<LabTierId>(['beginner']));
    expect(chapter(items, 'beginner')).toMatchObject({
      state: 'current',
      reached: 0,
    });
    expect(level(items, 1).state).toBe('ahead');
    expect(stateOf(1, 0)).toBe('ahead');
  });

  it('marks everything below the top as done at level 100', () => {
    const items = buildJourney(100, new Set<LabTierId>(['mythic']));
    expect(chapter(items, 'legendary').state).toBe('done');
    expect(chapter(items, 'mythic')).toMatchObject({
      state: 'current',
      reached: 20,
    });
    expect(level(items, 100)).toMatchObject({
      state: 'current',
      milestone: true,
    });
  });

  it('names the next milestone, and none at the top', () => {
    expect(nextMilestone(16)).toBe(25);
    expect(nextMilestone(25)).toBe(50);
    expect(nextMilestone(0)).toBe(10);
    expect(nextMilestone(100)).toBeNull();
  });
});
