/**
 * "Something is open over the tab" — a counter every lab overlay raises while it is
 * mounted (details, composers, sheets, pages that slide in, full-screen moments).
 *
 * The level badge stays visible above all of them, but its panel may only open on
 * the five main tabs (R-31, kolo 34): a window never opens over another window.
 *
 * A module store, not a context: overlays live in every corner of the lab and the
 * only reader is the badge — nothing else must re-render when a sheet opens.
 *
 * GOING LIVE: lab scaffolding only. In the app the details are routes and modals of
 * their own, so "is a main tab on top?" comes from the navigation state instead.
 */
import { useEffect, useSyncExternalStore } from 'react';

let covers = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function change(by: number) {
  covers += by;
  listeners.forEach(listener => listener());
}

/** Call in every overlay; `active = false` for one that is mounted but not showing. */
export function useLabCover(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    change(1);
    return () => change(-1);
  }, [active]);
}

/** True while at least one overlay is open over the tab. */
export function useLabCovered(): boolean {
  return useSyncExternalStore(subscribe, () => covers > 0);
}
