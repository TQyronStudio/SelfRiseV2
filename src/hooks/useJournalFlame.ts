/**
 * The journal streak's flame state — one story for Home's streak card and (from
 * E12) the Journal (migration E11c; technical-guides:Home.md, My-Journal.md):
 *   frozen streak → ice; warmed up today and the warming not yet played → the
 *   ice cracks and catches (warming); otherwise → fire.
 *
 * `justUnfrozeToday` stays true for the WHOLE day (SQLiteGratitudeStorage), so
 * the app remembers that the warming was already played — otherwise every visit
 * to Home would melt the ice again. The memory is shared by every flame (one
 * streak, one warming: only the flame on the focused screen plays it, then all
 * show fire) and kept for the day in AsyncStorage, so a restart does not replay
 * it either.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FlameState } from '@/src/components/ui/StreakFlame';
import { DateString } from '@/src/types/common';
import { today as todayString } from '@/src/utils/date';

export const FLAME_WARMED_KEY = 'journal_flame_warmed_on';

/** Pure: which flame the streak shows. */
export function flameStateOf(
  streak: { isFrozen: boolean; justUnfrozeToday: boolean } | null,
  warmingPlayedToday: boolean
): FlameState {
  if (!streak) return 'fire';
  if (streak.isFrozen) return 'ice';
  if (streak.justUnfrozeToday && !warmingPlayedToday) return 'warming';
  return 'fire';
}

// --- The shared memory: the day the warming was last played -----------------
let warmedOn: DateString | null = null;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (!loading) {
    loading = AsyncStorage.getItem(FLAME_WARMED_KEY)
      .then(value => {
        // A mark set this session wins over the stored one.
        if (warmedOn === null) warmedOn = value;
      })
      .catch(() => undefined)
      .finally(() => {
        loaded = true;
        listeners.forEach(fn => fn());
      });
  }
  return loading;
}

function markWarmed(day: DateString) {
  warmedOn = day;
  listeners.forEach(fn => fn());
  AsyncStorage.setItem(FLAME_WARMED_KEY, day).catch(() => undefined);
}

/** For tests: forget the shared memory. */
export function resetFlameMemoryForTests() {
  warmedOn = null;
  loaded = false;
  loading = null;
}

export function useJournalFlame(
  streak: { isFrozen: boolean; justUnfrozeToday: boolean } | null
): { state: FlameState; onWarmed: () => void } {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump(n => n + 1);
    listeners.add(fn);
    void load();
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const today = todayString();
  // Until the memory is read, a warmed-up day shows fire: a restart must not
  // flash the ice once more before it knows the warming was already played.
  const played = !loaded || warmedOn === today;
  const state = flameStateOf(streak, played);
  const onWarmed = useCallback(() => markWarmed(todayString()), []);
  return { state, onWarmed };
}
