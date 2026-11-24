/**
 * "Something is open over the screen" — a counter every overlay of the new look
 * raises while it is mounted and showing (sheets, details that grew from a card,
 * confirm sheets). Moved from the Design Lab's labCover.ts in migration E4
 * (design-migration-plan.md kap. 6.0: sheets and details inside a tab are not
 * routes, so navigation does not know about them).
 *
 * The only reader is the level badge (E7/E9): its panel may open only on one of
 * the five tabs, with nothing open over it and no moment running (R-31).
 *
 * "On screen" = useIsFocused(): tabs stay mounted (R-32), so an overlay left open
 * in a hidden tab does not count and does not swallow Android back.
 *
 * Runs inside the NavigationContainer (outside a screen useIsFocused() is the
 * root's constant true — counted, back handled). A component test that renders
 * these parts needs jest.mock('@react-navigation/native').
 *
 * A module store, not a context: overlays live everywhere and nothing else must
 * re-render when a sheet opens.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

let covers = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function change(by: number) {
  covers = Math.max(0, covers + by);
  listeners.forEach(listener => listener());
}

/** The store itself — exported for tests only. */
export const overlayStore = {
  open: () => change(1),
  close: () => change(-1),
  covered: () => covers > 0,
  subscribe,
};

/** Call in every overlay; `active = false` for one that is mounted but not showing. */
export function useOverlayCover(active = true) {
  const onScreen = useIsFocused();
  const covering = active && onScreen;
  useEffect(() => {
    if (!covering) return undefined;
    change(1);
    return () => change(-1);
  }, [covering]);
}

/** True while at least one overlay is open over the screen. */
export function useOverlayCovered(): boolean {
  return useSyncExternalStore(subscribe, () => covers > 0);
}

/**
 * Android back for an overlay — only while its screen is focused. An overlay
 * left open in a hidden tab must not swallow the back press meant for the
 * screen the user is looking at.
 */
export function useOverlayBack(onBack: () => void) {
  const onScreen = useIsFocused();
  const latest = useRef(onBack);
  latest.current = onBack;
  useEffect(() => {
    if (!onScreen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      latest.current();
      return true;
    });
    return () => sub.remove();
  }, [onScreen]);
}
