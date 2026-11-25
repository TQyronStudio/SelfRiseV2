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
 *
 * Moved 1:1 from the Design Lab in migration E11 prep (2026-11-24; the lab keeps
 * its copy — O-6). E11e: the section list is the app's (defaultHomeComponents)
 * and the stored-layout rule is mergeHomeComponents — migrateHomeSections calls it.
 */
import { mergeHomeComponents } from '@/src/utils/homeComponents';

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

/**
 * Stored customisation of the old Home → the new seven sections. Since E11e
 * this is the app's own rule, mergeHomeComponents (src/utils/homeComponents.ts),
 * applied as for a user who reordered (the stored order is kept) — so these
 * tests guard the code that really runs, not a copy of it.
 * - The user's order is kept; a merged section takes the place of the first of
 *   its parts and is visible if ANY part was.
 * - Sections that are gone are dropped; unknown ids are ignored.
 * - A section the old Home did not have (today's habits) goes right after quick
 *   actions, wherever the user moved those.
 */
export function migrateHomeSections(
  stored: readonly { id: string; visible: boolean }[]
): HomeSection[] {
  const asComponent = (id: string, visible: boolean, order: number) => ({
    id,
    name: id,
    visible,
    order,
    configurable: true,
  });
  return mergeHomeComponents(
    DEFAULT_HOME_SECTIONS.map((s, i) => asComponent(s.id, s.visible, i + 1)),
    stored.map((s, i) => asComponent(s.id, s.visible, i + 1)),
    true
  ).map(c => ({ id: c.id as HomeSectionId, visible: c.visible }));
}
