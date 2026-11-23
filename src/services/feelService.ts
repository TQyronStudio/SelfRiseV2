/**
 * Plays a moment of the feel vocabulary (src/constants/feel.ts): its taps through
 * hapticsService (which honours the "Haptic feedback" switch) and, at the rare big
 * moments, its sound. Moved from the Design Lab (feelPlayer.ts) in migration E2.
 *
 *   feel('saved');        // never impact()/notification() by hand in a converted screen
 *
 * SOUND: expo-audio (native module in the build since E0). One player per sound,
 * made on first use, volume 0.6, mixed with other audio, the phone's silent switch
 * wins. A sound never breaks the moment it belongs to: any failure is swallowed.
 * On a build without the native module the app stays silent instead of crashing.
 *
 * The sounds switch is stored like the haptics switch (same pattern as
 * setHapticsEnabled); its row in Settings comes with stage E20.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import {
  impact,
  ImpactFeedbackStyle,
  isHapticsEnabled,
  notification,
  NotificationFeedbackType,
  selection,
} from './hapticsService';
import { FeelMoment, feelFor, SoundId, Tap } from '../constants/feel';

// --- The sounds switch ------------------------------------------------------------

const STORAGE_KEY = '@sounds_enabled';
export const SOUNDS_CHANGED_EVENT = 'soundsEnabledChanged';

let soundsOn = true; // default ON

/** Load the persisted preference. Call once at app startup (next to initHaptics). */
export async function initSounds(): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value !== null) soundsOn = value === 'true';
  } catch (error) {
    console.error('[feelService] Failed to load the sounds preference:', error);
  }
}

export function isSoundsEnabled(): boolean {
  return soundsOn;
}

export async function setSoundsEnabled(value: boolean): Promise<void> {
  soundsOn = value;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error(
      '[feelService] Failed to persist the sounds preference:',
      error
    );
  }
  DeviceEventEmitter.emit(SOUNDS_CHANGED_EVENT, value);
}

// --- Touch ------------------------------------------------------------------------

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

// --- Sound ------------------------------------------------------------------------

const SOURCES: Record<SoundId, number> = {
  celebrate: require('../../assets/sounds/celebrate.m4a'),
  chapter: require('../../assets/sounds/chapter.m4a'),
  complete: require('../../assets/sounds/complete.m4a'),
  boost: require('../../assets/sounds/boost.m4a'),
};
/** Quiet: a sound under the moment, never over the user's music. */
const VOLUME = 0.6;

type Player = {
  volume: number;
  play: () => void;
  seekTo: (seconds: number) => Promise<void>;
};
type AudioModule = {
  createAudioPlayer: (source: number) => Player;
  setAudioModeAsync: (mode: object) => Promise<void>;
};

let audio: AudioModule | null | undefined;
const players: Partial<Record<SoundId, Player>> = {};

/**
 * Loaded on first use, inside a try: a build without expo-audio stays silent
 * instead of crashing at import time.
 */
function audioModule(): AudioModule | null {
  if (audio !== undefined) return audio;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('expo-audio') as AudioModule;
    audio = loaded;
    // Mix with whatever plays (no ducking, no pause); the silent switch wins.
    void loaded
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
  if (!module) return;
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
        if (__DEV__) console.warn('[feelService] sound failed', sound, error);
      });
  } catch (error) {
    // A sound must never break the moment it belongs to.
    if (__DEV__) console.warn('[feelService] sound failed', sound, error);
  }
}

// --- The one entry point ------------------------------------------------------------

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
