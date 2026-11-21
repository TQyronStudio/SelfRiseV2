/**
 * Plays a moment of the feel vocabulary (labFeel.ts): its taps through the app's
 * haptics service (which already honours the user's switch) and its sound.
 *
 * SOUND IN THE LAB: the app has no audio player yet — expo-audio is a native
 * module and must come with the E0 build (design-migration-plan.md). Until then
 * `playSound` is a no-op that logs in development, so the lab already calls it at
 * the right moments and the Settings switch already works. The candidate sounds
 * are in assets/sounds/ (see the README there).
 */
import { useSyncExternalStore } from 'react';
import {
  impact,
  ImpactFeedbackStyle,
  isHapticsEnabled,
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { FeelMoment, feelFor, SoundId, Tap } from './labFeel';

// --- The sounds switch (lab: in memory; live: next to the haptics setting) -----
let soundsOn = true;
const listeners = new Set<() => void>();
export function setLabSounds(on: boolean): void {
  soundsOn = on;
  listeners.forEach(fn => fn());
}
export function useLabSounds(): boolean {
  return useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => soundsOn
  );
}

function playTap(tap: Tap): void {
  switch (tap) {
    case 'selection':
      return selection();
    case 'light':
      return impact(ImpactFeedbackStyle.Light);
    case 'medium':
      return impact(ImpactFeedbackStyle.Medium);
    case 'heavy':
      return impact(ImpactFeedbackStyle.Heavy);
    case 'success':
      return notification(NotificationFeedbackType.Success);
    case 'warning':
      return notification(NotificationFeedbackType.Warning);
  }
}

function playSound(sound: SoundId): void {
  // No player until the E0 build (expo-audio). Live: one preloaded player per
  // sound, volume ~0.6, playsInSilentMode false.
  if (__DEV__) console.log(`[feel] sound: ${sound}`);
}

/** Feel a moment: its pattern of taps and, at the big moments, its sound. */
export function feel(moment: FeelMoment): void {
  const { pattern, sound } = feelFor(moment, {
    haptics: isHapticsEnabled(),
    sounds: soundsOn,
  });
  for (const step of pattern) {
    if (step.at === 0) playTap(step.tap);
    else setTimeout(() => playTap(step.tap), step.at);
  }
  if (sound) playSound(sound);
}
