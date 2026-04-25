/**
 * XP Feedback Hook - Haptic and Sound Feedback
 * Extracted to prevent circular dependency between XpAnimationContext and components
 */

import {
  selection as hapticSelection,
  impact as hapticImpact,
  notification as hapticNotification,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from '../services/hapticsService';

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
    switch (type) {
      case 'light':
        hapticImpact(ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        hapticImpact(ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        hapticImpact(ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        hapticNotification(NotificationFeedbackType.Success);
        break;
      case 'warning':
        hapticNotification(NotificationFeedbackType.Warning);
        break;
      case 'error':
        hapticNotification(NotificationFeedbackType.Error);
        break;
      case 'selection':
        hapticSelection();
        break;
      default:
        hapticImpact(ImpactFeedbackStyle.Medium);
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