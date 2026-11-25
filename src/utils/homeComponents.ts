import type { HomeScreenComponent } from '../types/homeCustomization';

/**
 * Stored sections of the old Home that the new Home folded or removed
 * (migration E11e, plan 3b; the table is the Design Lab's homeLayoutLogic):
 * null = gone, a string = merged into that section.
 *   xpProgressBar → gone (the pinned level badge and its panel, R-31)
 *   xpMultiplier  → gone (the multiplier lives on the badge, O-4)
 *   streakHistory → gone (the 30-day chart moves to Journal statistics, E13)
 *   habitPerformance + habitTrends → insights (one card instead of two)
 */
export const LEGACY_HOME_SECTIONS: Readonly<Record<string, string | null>> = {
  xpProgressBar: null,
  xpMultiplier: null,
  streakHistory: null,
  habitPerformance: 'insights',
  habitTrends: 'insights',
};

/**
 * A section the user never had placed follows this one, wherever the user put
 * it: today's habits used to be the bottom row of the quick actions card.
 */
const FOLLOWS: Readonly<Record<string, string>> = {
  todayHabits: 'quickActions',
};

const own = (map: object, key: string) =>
  Object.prototype.hasOwnProperty.call(map, key);

/**
 * Combine the app's current Home sections with what the user has stored — the
 * ONE rule for stored Home customisation (no second filter elsewhere).
 *
 * - The section list always comes from `defaults`: a section removed from the
 *   app disappears even if it is still stored (e.g. `dailyQuote`, moved to the
 *   Journal 2026-10-04), and a new section appears.
 * - Old ids are translated first (LEGACY_HOME_SECTIONS): a merged section is
 *   visible if ANY of its parts was, and takes the place of the first part.
 * - Visibility is always the user's.
 * - Order is the user's ONLY if they reordered (`hasCustomOrder`). Without it
 *   they get the current default order, so an app update can rearrange Home for
 *   everyone who never touched it. With it, sections they never placed go to
 *   the end in default order — except one that FOLLOWS another (today's habits
 *   right after the quick actions).
 *
 * Before 2026-10-04 the order was always taken from defaults, so a saved custom
 * order was silently thrown away on the next load.
 */
export function mergeHomeComponents(
  defaults: readonly HomeScreenComponent[],
  stored: readonly HomeScreenComponent[] | undefined,
  hasCustomOrder: boolean
): HomeScreenComponent[] {
  if (!stored) return defaults.map(component => ({ ...component }));

  const inApp = new Set(defaults.map(component => component.id));
  // The stored list in the user's order, old ids translated, parts merged.
  const placed: string[] = [];
  const visibleById = new Map<string, boolean>();
  const sortedStored = [...stored].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const old of sortedStored) {
    const id = inApp.has(old.id)
      ? old.id
      : own(LEGACY_HOME_SECTIONS, old.id)
        ? LEGACY_HOME_SECTIONS[old.id]
        : null;
    if (!id || !inApp.has(id)) continue;
    if (visibleById.has(id)) {
      visibleById.set(id, visibleById.get(id)! || old.visible);
    } else {
      visibleById.set(id, old.visible);
      placed.push(id);
    }
  }

  const merged = defaults.map(component =>
    visibleById.has(component.id)
      ? { ...component, visible: visibleById.get(component.id)! }
      : { ...component }
  );
  if (!hasCustomOrder) return merged;

  // The user's order, then what they never placed.
  const order = [...placed];
  const byDefault = [...defaults].sort((a, b) => a.order - b.order);
  for (const component of byDefault) {
    if (order.includes(component.id)) continue;
    const after = own(FOLLOWS, component.id)
      ? order.indexOf(FOLLOWS[component.id]!)
      : -1;
    if (after >= 0) order.splice(after + 1, 0, component.id);
    else order.push(component.id);
  }
  const byId = new Map(merged.map(component => [component.id, component]));
  return order.map((id, index) => ({ ...byId.get(id)!, order: index + 1 }));
}
