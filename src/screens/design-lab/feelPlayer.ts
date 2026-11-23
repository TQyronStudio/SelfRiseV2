/**
 * Plays a moment of the feel vocabulary (labFeel.ts): its taps through the app's
 * haptics service (which already honours the user's switch) and its sound.
 *
 * SOUND: expo-audio, in the build since E0 (2026-11-22). One player per sound,
 * made on first use, volume 0.6, mixed with other audio, silent switch wins.
 * On an older build without the native module the lab stays silent (logs only).
 * The candidate sounds are in assets/sounds/ (see the README there).
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

// --- Sound (expo-audio, in the build since E0, 2026-11-22) -----------------------
const SOURCES: Record<SoundId, number> = {
  celebrate: require('../../../assets/sounds/celebrate.m4a'),
  chapter: require('../../../assets/sounds/chapter.m4a'),
  complete: require('../../../assets/sounds/complete.m4a'),
  boost: require('../../../assets/sounds/boost.m4a'),
};
/** Quiet: a sound under the moment, never over the user's music. */
const VOLUME = 0.6;

type Player = {
  volume: number;
  play: () => void;
  seekTo: (s: number) => Promise<void>;
};
let audio:
  | {
      createAudioPlayer: (source: number) => Player;
      setAudioModeAsync: (mode: object) => Promise<void>;
    }
  | null
  | undefined;
const players: Partial<Record<SoundId, Player>> = {};

/**
 * The player is loaded on first use, inside a try: on a build without
 * expo-audio (anything older than E0) the lab stays silent instead of crashing.
 */
function audioModule() {
  if (audio !== undefined) return audio;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audio = require('expo-audio');
    // Mix with whatever plays (no ducking, no pause); the silent switch wins.
    void audio!
      .setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
      })
      .catch(() => undefined);
  } catch {
    audio = null;
  }
  return audio;
}

function playSound(sound: SoundId): void {
  const module = audioModule();
  if (!module) {
    if (__DEV__)
      console.log(`[feel] sound (no player in this build): ${sound}`);
    return;
  }
  try {
    let player = players[sound];
    if (!player) {
      player = module.createAudioPlayer(SOURCES[sound]);
      player.volume = VOLUME;
      players[sound] = player;
    }
    // From the start every time (the same sound may come twice in a row).
    const p = player;
    p.seekTo(0)
      .catch(() => undefined)
      .then(() => p.play())
      // A sound that fails to start must not surface as an unhandled rejection.
      .catch(error => {
        if (__DEV__) console.warn('[feel] sound failed', sound, error);
      });
  } catch (error) {
    // A sound must never break the moment it belongs to.
    if (__DEV__) console.warn('[feel] sound failed', sound, error);
  }
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
