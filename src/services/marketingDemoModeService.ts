import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const MARKETING_DEMO_MODE_KEY = 'marketing_demo_mode_enabled';

export const MARKETING_DEMO_MODE_CHANGED_EVENT = 'marketing_demo_mode_changed';

export async function isMarketingDemoModeEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(MARKETING_DEMO_MODE_KEY);
  return stored === 'true';
}

export async function setMarketingDemoModeEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MARKETING_DEMO_MODE_KEY, enabled ? 'true' : 'false');
  DeviceEventEmitter.emit(MARKETING_DEMO_MODE_CHANGED_EVENT, enabled);
}
