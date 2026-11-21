import {
  DEFAULT_HOME_SECTIONS,
  migrateHomeSections,
  reorderSections,
  toggleSection,
  visibleSections,
} from '../homeLayoutLogic';

const ids = (sections: { id: string }[]) => sections.map(s => s.id);

describe('home layout: showing, hiding, moving', () => {
  it('draws the visible sections in their order', () => {
    expect(visibleSections(DEFAULT_HOME_SECTIONS)).toEqual([
      'quickActions',
      'todayHabits',
      'journalStreak',
      'monthlyChallenges',
      'habitStats',
      'insights',
      'recommendations',
    ]);
  });

  it('hides and shows one section without touching the others', () => {
    const hidden = toggleSection(DEFAULT_HOME_SECTIONS, 'insights');
    expect(visibleSections(hidden)).not.toContain('insights');
    expect(ids(hidden)).toEqual(ids([...DEFAULT_HOME_SECTIONS]));
    expect(visibleSections(toggleSection(hidden, 'insights'))).toContain(
      'insights'
    );
    // Showing one section must not bring back another the user hid.
    const twoHidden = toggleSection(hidden, 'habitStats');
    expect(visibleSections(toggleSection(twoHidden, 'insights'))).not.toContain(
      'habitStats'
    );
  });

  it('keeps a hidden section hidden when it is moved', () => {
    const hidden = toggleSection(DEFAULT_HOME_SECTIONS, 'habitStats');
    const moved = reorderSections(hidden, [
      'habitStats',
      'todayHabits',
      'quickActions',
      'journalStreak',
      'monthlyChallenges',
      'insights',
      'recommendations',
    ]);
    expect(ids(moved)[0]).toBe('habitStats');
    expect(moved[0]!.visible).toBe(false);
    expect(visibleSections(moved)[0]).toBe('todayHabits');
  });

  it('never loses a section when the new order forgets one', () => {
    const moved = reorderSections(DEFAULT_HOME_SECTIONS, [
      'recommendations',
      'insights',
    ]);
    expect(moved).toHaveLength(DEFAULT_HOME_SECTIONS.length);
    expect(ids(moved).slice(0, 2)).toEqual(['recommendations', 'insights']);
  });
});

describe('home layout: stored customisation of the old Home', () => {
  const OLD_DEFAULT = [
    'xpProgressBar',
    'xpMultiplier',
    'quickActions',
    'journalStreak',
    'streakHistory',
    'monthlyChallenges',
    'habitStats',
    'recommendations',
    'habitPerformance',
    'habitTrends',
  ].map(id => ({ id, visible: true }));

  it('turns the old default into the seven new sections', () => {
    expect(ids(migrateHomeSections(OLD_DEFAULT))).toEqual([
      'quickActions',
      'todayHabits',
      'journalStreak',
      'monthlyChallenges',
      'habitStats',
      'recommendations',
      'insights',
    ]);
  });

  it('drops the sections that are gone', () => {
    const result = ids(migrateHomeSections(OLD_DEFAULT));
    expect(result).not.toContain('xpProgressBar');
    expect(result).not.toContain('xpMultiplier');
    expect(result).not.toContain('streakHistory');
  });

  it('keeps the order the user chose', () => {
    const custom = [
      { id: 'habitTrends', visible: true },
      { id: 'monthlyChallenges', visible: true },
      { id: 'xpProgressBar', visible: true },
      { id: 'quickActions', visible: true },
      { id: 'habitPerformance', visible: true },
    ];
    expect(ids(migrateHomeSections(custom)).slice(0, 4)).toEqual([
      'insights',
      'monthlyChallenges',
      'quickActions',
      'todayHabits',
    ]);
  });

  it('keeps hidden sections hidden', () => {
    const custom = OLD_DEFAULT.map(s =>
      s.id === 'journalStreak' || s.id === 'recommendations'
        ? { ...s, visible: false }
        : s
    );
    const result = migrateHomeSections(custom);
    expect(result.find(s => s.id === 'journalStreak')!.visible).toBe(false);
    expect(result.find(s => s.id === 'recommendations')!.visible).toBe(false);
    expect(result.find(s => s.id === 'habitStats')!.visible).toBe(true);
  });

  it('shows the merged card if either of its two parts was shown', () => {
    const one = OLD_DEFAULT.map(s =>
      s.id === 'habitPerformance' ? { ...s, visible: false } : s
    );
    expect(
      migrateHomeSections(one).find(s => s.id === 'insights')!.visible
    ).toBe(true);
    const none = OLD_DEFAULT.map(s =>
      s.id === 'habitPerformance' || s.id === 'habitTrends'
        ? { ...s, visible: false }
        : s
    );
    expect(
      migrateHomeSections(none).find(s => s.id === 'insights')!.visible
    ).toBe(false);
  });

  it('adds what the old Home did not have, and ignores unknown ids', () => {
    const result = migrateHomeSections([
      { id: 'somethingElse', visible: true },
      { id: 'constructor', visible: true },
      { id: 'journalStreak', visible: true },
    ]);
    // Today's habits always follow quick actions, wherever those ended up.
    expect(ids(result)).toEqual([
      'journalStreak',
      'quickActions',
      'todayHabits',
      'monthlyChallenges',
      'habitStats',
      'insights',
      'recommendations',
    ]);
    expect(result).toHaveLength(DEFAULT_HOME_SECTIONS.length);
  });

  it('gives a new user the default', () => {
    expect(migrateHomeSections([])).toEqual(DEFAULT_HOME_SECTIONS);
  });
});
