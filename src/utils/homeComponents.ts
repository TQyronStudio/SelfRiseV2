import type { HomeScreenComponent } from '../types/homeCustomization';

/**
 * Combine the app's current Home sections with what the user has stored.
 *
 * - The section list always comes from `defaults`: a section removed from the
 *   app disappears even if it is still stored (e.g. `dailyQuote`, moved to the
 *   Journal 2026-10-04), and a new section appears.
 * - Visibility is always the user's.
 * - Order is the user's ONLY if they reordered (`hasCustomOrder`). Without it
 *   they get the current default order, so an app update can rearrange Home for
 *   everyone who never touched it. Sections new since their reorder go to the
 *   end, in default order.
 *
 * Before 2026-10-04 the order was always taken from defaults, so a saved custom
 * order was silently thrown away on the next load.
 */
export function mergeHomeComponents(
  defaults: readonly HomeScreenComponent[],
  stored: readonly HomeScreenComponent[] | undefined,
  hasCustomOrder: boolean
): HomeScreenComponent[] {
  const storedById = new Map((stored ?? []).map(component => [component.id, component]));

  const merged = defaults.map(defaultComp => {
    const existing = storedById.get(defaultComp.id);
    return existing ? { ...defaultComp, visible: existing.visible } : { ...defaultComp };
  });

  if (!hasCustomOrder) {
    return merged;
  }

  const customised = merged
    .filter(component => storedById.has(component.id))
    .sort((a, b) => storedById.get(a.id)!.order - storedById.get(b.id)!.order);
  const added = merged
    .filter(component => !storedById.has(component.id))
    .sort((a, b) => a.order - b.order);

  return [...customised, ...added].map((component, index) => ({ ...component, order: index + 1 }));
}
