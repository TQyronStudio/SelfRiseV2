/**
 * Which sections Home shows and in what order (kolo 42, lab debt L-2), free of
 * React Native so it can be tested.
 *
 * The hero of the day is fixed on top (R-4b). Everything below is the user's:
 * each section can be hidden and moved. The new Home has seven sections; the
 * app's ten are folded into them:
 *
 *   app today            → new Home
 *   xpProgressBar        → gone (the pinned level badge and its panel, R-31)
 *   xpMultiplier         → gone (the multiplier lives on the badge, O-4)
 *   streakHistory        → gone (the same chart is in Journal statistics)
 *   habitPerformance  ┐
 *   habitTrends       ┘  → insights (one card instead of two)
 *   quickActions, journalStreak, monthlyChallenges, habitStats, recommendations → unchanged
 *   —                    → todayHabits (new: today's habits right on Home)
 *
 * GOING LIVE (1:1): `migrateHomeSections` is the rule for stored customisation
 * (HomeCustomizationContext / homePreferencesStorage); the order the user chose
 * survives, hidden stays hidden.
 */

export type HomeSectionId =
  | 'quickActions'
  | 'todayHabits'
  | 'journalStreak'
  | 'monthlyChallenges'
  | 'habitStats'
  | 'insights'
  | 'recommendations';

export interface HomeSection {
  id: HomeSectionId;
  visible: boolean;
}

export const DEFAULT_HOME_SECTIONS: readonly HomeSection[] = [
  { id: 'quickActions', visible: true },
  { id: 'todayHabits', visible: true },
  { id: 'journalStreak', visible: true },
  { id: 'monthlyChallenges', visible: true },
  { id: 'habitStats', visible: true },
  { id: 'insights', visible: true },
  { id: 'recommendations', visible: true },
];

/** Ids of the sections to draw, top to bottom. */
export function visibleSections(
  sections: readonly HomeSection[]
): HomeSectionId[] {
  return sections.filter(s => s.visible).map(s => s.id);
}

export function toggleSection(
  sections: readonly HomeSection[],
  id: HomeSectionId
): HomeSection[] {
  return sections.map(s => (s.id === id ? { ...s, visible: !s.visible } : s));
}

/** The same sections in a new order; ids the order does not name keep their place at the end. */
export function reorderSections(
  sections: readonly HomeSection[],
  order: readonly HomeSectionId[]
): HomeSection[] {
  const byId = new Map(sections.map(s => [s.id, s]));
  const named = order.flatMap(id => {
    const section = byId.get(id);
    byId.delete(id);
    return section ? [section] : [];
  });
  return [...named, ...byId.values()];
}

const MERGED_INTO: Record<string, HomeSectionId | null> = {
  xpProgressBar: null,
  xpMultiplier: null,
  streakHistory: null,
  habitPerformance: 'insights',
  habitTrends: 'insights',
  quickActions: 'quickActions',
  journalStreak: 'journalStreak',
  monthlyChallenges: 'monthlyChallenges',
  habitStats: 'habitStats',
  recommendations: 'recommendations',
};

/**
 * Stored customisation of the old Home → the new seven sections.
 * - The user's order is kept; a merged section takes the place of the first of
 *   its parts and is visible if ANY part was.
 * - Sections that are gone are dropped; unknown ids are ignored.
 * - A section the old Home did not have (today's habits) goes where the default
 *   puts it: right after quick actions, wherever the user moved those.
 */
export function migrateHomeSections(
  stored: readonly { id: string; visible: boolean }[]
): HomeSection[] {
  const result: HomeSection[] = [];
  for (const old of stored) {
    // Own keys only: a stored "constructor" must not resolve to Object's.
    const id = Object.prototype.hasOwnProperty.call(MERGED_INTO, old.id)
      ? MERGED_INTO[old.id]
      : null;
    if (!id) continue;
    const existing = result.find(s => s.id === id);
    if (existing) existing.visible = existing.visible || old.visible;
    else result.push({ id, visible: old.visible });
  }
  for (const section of DEFAULT_HOME_SECTIONS) {
    if (result.some(s => s.id === section.id)) continue;
    if (section.id === 'todayHabits') {
      const after = result.findIndex(s => s.id === 'quickActions');
      result.splice(after + 1, 0, { ...section });
    } else {
      result.push({ ...section });
    }
  }
  return result;
}
