import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { DeviceEventEmitter } from 'react-native';

const STORAGE_KEY = '@haptics_enabled';
export const HAPTICS_CHANGED_EVENT = 'hapticsEnabledChanged';

let enabled = true; // default ON

/**
 * Load persisted preference. Call once at app startup.
 */
export async function initHaptics(): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value !== null) {
      enabled = value === 'true';
    }
  } catch (error) {
    console.error('[hapticsService] Failed to load preference:', error);
  }
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export async function setHapticsEnabled(value: boolean): Promise<void> {
  enabled = value;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
  } catch (error) {
    console.error('[hapticsService] Failed to persist preference:', error);
  }
  DeviceEventEmitter.emit(HAPTICS_CHANGED_EVENT, value);
}

// ========================================
// Wrappers — no-op when disabled
// ========================================

export function selection(): void {
  if (!enabled) return;
  Haptics.selectionAsync().catch(() => {});
}

export function impact(style: Haptics.ImpactFeedbackStyle): void {
  if (!enabled) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function notification(type: Haptics.NotificationFeedbackType): void {
  if (!enabled) return;
  Haptics.notificationAsync(type).catch(() => {});
}

// Re-export types for convenient consumption at call sites
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;
