/**
 * XP Feedback Hook - Haptic and Sound Feedback
 * Extracted to prevent circular dependency between XpAnimationContext and components
 */

import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';

export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection';

export type SoundEffect = 
  | 'xp_gain' 
  | 'level_up' 
  | 'achievement' 
  | 'milestone' 
  | 'success' 
  | 'celebration';

/**
 * Hook for haptic and sound feedback
 * Provides consistent feedback patterns across the app
 */
export const useXpFeedback = () => {
  const triggerHapticFeedback = async (type: HapticType) => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  const playSoundEffect = async (effect: SoundEffect) => {
    // TODO: Implement sound effects when audio system is ready
    // For now, provide haptic feedback as alternative
    switch (effect) {
      case 'xp_gain':
        await triggerHapticFeedback('light');
        break;
      case 'level_up':
        await triggerHapticFeedback('success');
        break;
      case 'achievement':
        await triggerHapticFeedback('success');
        break;
      case 'milestone':
        await triggerHapticFeedback('heavy');
        break;
      case 'success':
        await triggerHapticFeedback('success');
        break;
      case 'celebration':
        await triggerHapticFeedback('heavy');
        break;
      default:
        await triggerHapticFeedback('medium');
    }
  };

  return {
    triggerHapticFeedback,
    playSoundEffect,
  };
};

export default useXpFeedback;