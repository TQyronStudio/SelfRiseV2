import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as Haptics from 'expo-haptics';
import { XPSourceType } from '../types/gamification';

// ========================================
// TYPES AND INTERFACES
// ========================================

interface XpPopupData {
  id: string;
  amount: number;
  source: XPSourceType;
  position: { x: number; y: number };
  timestamp: number;
}

interface XpGain {
  id: string;
  amount: number;
  source: XPSourceType;
  timestamp: number;
}

interface XpAnimationState {
  activePopups: XpPopupData[];
  pendingNotifications: XpGain[];
  isNotificationVisible: boolean;
  isAnimationEnabled: boolean;
  isHapticsEnabled: boolean;
  isSoundEnabled: boolean;
  lastNotificationTime: number;
}

interface XpAnimationContextValue {
  // State
  state: XpAnimationState;
  
  // Animation triggers
  showXpPopup: (amount: number, source: XPSourceType, position?: { x: number; y: number }) => void;
  clearPopup: (id: string) => void;
  clearAllPopups: () => void;
  
  // Smart notification system
  showSmartNotification: (amount: number, source: XPSourceType) => void;
  dismissNotification: () => void;
  
  // Settings
  toggleAnimations: (enabled: boolean) => void;
  toggleHaptics: (enabled: boolean) => void;
  toggleSounds: (enabled: boolean) => void;
  
  // Feedback methods
  triggerHapticFeedback: (type: 'light' | 'medium' | 'heavy') => Promise<void>;
  playSoundEffect: (type: 'xp_gain' | 'level_up' | 'milestone') => Promise<void>;
}

// ========================================
// CONTEXT CREATION
// ========================================

const XpAnimationContext = createContext<XpAnimationContextValue | undefined>(undefined);

// ========================================
// PROVIDER COMPONENT
// ========================================

interface XpAnimationProviderProps {
  children: React.ReactNode;
}

export const XpAnimationProvider: React.FC<XpAnimationProviderProps> = ({ children }) => {
  const [state, setState] = useState<XpAnimationState>({
    activePopups: [],
    pendingNotifications: [],
    isNotificationVisible: false,
    isAnimationEnabled: true,
    isHapticsEnabled: true,
    isSoundEnabled: true,
    lastNotificationTime: 0,
  });

  // Create a ref for the showXpPopup function to avoid dependency issues
  const showXpPopupRef = useRef<((amount: number, source: XPSourceType, position?: { x: number; y: number }) => void) | undefined>(undefined);

  // ========================================
  // SMART NOTIFICATION SYSTEM
  // ========================================

  // Constants for smart batching
  const BATCHING_WINDOW = 3000; // 3 seconds
  const COOLDOWN_PERIOD = 5000; // 5 seconds
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSmartNotification = useCallback((amount: number, source: XPSourceType) => {
    const now = Date.now();
    
    // Check cooldown period to prevent spam
    if (now - state.lastNotificationTime < COOLDOWN_PERIOD && state.isNotificationVisible) {
      // Add to pending notifications during cooldown
      const newGain: XpGain = {
        id: `xp_gain_${now}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        source,
        timestamp: now,
      };

      setState(prev => ({
        ...prev,
        pendingNotifications: [...prev.pendingNotifications, newGain],
      }));
      return;
    }

    // Add new XP gain to pending notifications
    const newGain: XpGain = {
      id: `xp_gain_${now}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      source,
      timestamp: now,
    };

    setState(prev => ({
      ...prev,
      pendingNotifications: [...prev.pendingNotifications, newGain],
    }));

    // Clear existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new batch timeout
    batchTimeoutRef.current = setTimeout(() => {
      setState(prev => {
        if (prev.pendingNotifications.length === 0) return prev;

        return {
          ...prev,
          isNotificationVisible: true,
          lastNotificationTime: now,
        };
      });
    }, BATCHING_WINDOW);

    // Trigger subtle haptic feedback
    if (state.isHapticsEnabled) {
      triggerHapticFeedback('light');
    }
  }, [state.lastNotificationTime, state.isNotificationVisible, state.isHapticsEnabled]);

  const dismissNotification = useCallback(() => {
    setState(prev => ({
      ...prev,
      isNotificationVisible: false,
      pendingNotifications: [], // Clear all pending notifications when dismissed
    }));

    // Clear any pending batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);
  
  // Listen for global XP animation events from GamificationService
  useEffect(() => {
    const handleXPGained = (eventData: any) => {
      if (eventData && eventData.amount && eventData.source && showXpPopupRef.current) {
        showXpPopupRef.current(eventData.amount, eventData.source, eventData.position);
      }
    };

    const handleSmartNotification = (eventData: any) => {
      if (eventData && eventData.amount && eventData.source) {
        showSmartNotification(eventData.amount, eventData.source);
      }
    };

    // Add event listeners for React Native using DeviceEventEmitter
    const xpGainedSubscription = DeviceEventEmitter.addListener('xpGained', handleXPGained);
    const smartNotificationSubscription = DeviceEventEmitter.addListener('xpSmartNotification', handleSmartNotification);

    return () => {
      xpGainedSubscription?.remove();
      smartNotificationSubscription?.remove();
    };
  }, [showSmartNotification]);

  // ========================================
  // ANIMATION MANAGEMENT
  // ========================================

  const showXpPopup = useCallback((
    amount: number, 
    source: XPSourceType, 
    position = { x: 0, y: 0 }
  ) => {
    if (!state.isAnimationEnabled) return;

    const id = `xp_popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const popupData: XpPopupData = {
      id,
      amount,
      source,
      position,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      activePopups: [...prev.activePopups, popupData],
    }));

    // Trigger haptic feedback for XP gains
    if (state.isHapticsEnabled) {
      triggerHapticFeedback('light');
    }

    // Play sound effect
    if (state.isSoundEnabled) {
      playSoundEffect('xp_gain');
    }

    // Auto-remove popup after animation completes
    setTimeout(() => {
      clearPopup(id);
    }, 2000);
  }, [state.isAnimationEnabled, state.isHapticsEnabled, state.isSoundEnabled]);

  // Update the ref whenever showXpPopup changes
  useEffect(() => {
    showXpPopupRef.current = showXpPopup;
  }, [showXpPopup]);

  const clearPopup = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activePopups: prev.activePopups.filter(popup => popup.id !== id),
    }));
  }, []);

  const clearAllPopups = useCallback(() => {
    setState(prev => ({
      ...prev,
      activePopups: [],
    }));
  }, []);

  // ========================================
  // SETTINGS MANAGEMENT
  // ========================================

  const toggleAnimations = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isAnimationEnabled: enabled,
    }));
    
    // Clear all popups if disabling animations
    if (!enabled) {
      clearAllPopups();
    }
  }, [clearAllPopups]);

  const toggleHaptics = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isHapticsEnabled: enabled,
    }));
  }, []);

  const toggleSounds = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      isSoundEnabled: enabled,
    }));
  }, []);

  // ========================================
  // FEEDBACK METHODS
  // ========================================

  const triggerHapticFeedback = useCallback(async (type: 'light' | 'medium' | 'heavy') => {
    if (!state.isHapticsEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, [state.isHapticsEnabled]);

  const playSoundEffect = useCallback(async (type: 'xp_gain' | 'level_up' | 'milestone') => {
    if (!state.isSoundEnabled) return;

    try {
      // Sound effects implementation will be added in future iterations
      // For now, we'll use haptic feedback as substitute
      switch (type) {
        case 'xp_gain':
          // Light feedback for regular XP gains
          break;
        case 'level_up':
          await triggerHapticFeedback('medium');
          break;
        case 'milestone':
          await triggerHapticFeedback('heavy');
          break;
      }
    } catch (error) {
      console.log('Sound effect not available:', error);
    }
  }, [state.isSoundEnabled, triggerHapticFeedback]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: XpAnimationContextValue = {
    state,
    showXpPopup,
    clearPopup,
    clearAllPopups,
    showSmartNotification,
    dismissNotification,
    toggleAnimations,
    toggleHaptics,
    toggleSounds,
    triggerHapticFeedback,
    playSoundEffect,
  };

  return (
    <XpAnimationContext.Provider value={contextValue}>
      {children}
    </XpAnimationContext.Provider>
  );
};

// ========================================
// HOOKS
// ========================================

/**
 * Main hook for accessing XP animation context
 */
export const useXpAnimation = (): XpAnimationContextValue => {
  const context = useContext(XpAnimationContext);
  if (context === undefined) {
    throw new Error('useXpAnimation must be used within a XpAnimationProvider');
  }
  return context;
};

/**
 * Hook for triggering XP popup animations
 */
export const useXpPopup = () => {
  const { showXpPopup, state } = useXpAnimation();
  
  return {
    showXpPopup,
    isEnabled: state.isAnimationEnabled,
    activePopups: state.activePopups,
  };
};

/**
 * Hook for haptic and sound feedback
 */
export const useXpFeedback = () => {
  const { triggerHapticFeedback, playSoundEffect, state } = useXpAnimation();
  
  return {
    triggerHapticFeedback,
    playSoundEffect,
    isHapticsEnabled: state.isHapticsEnabled,
    isSoundEnabled: state.isSoundEnabled,
  };
};

/**
 * Hook for smart notification system
 */
export const useXpNotification = () => {
  const { showSmartNotification, dismissNotification, state } = useXpAnimation();
  
  return {
    showSmartNotification,
    dismissNotification,
    pendingNotifications: state.pendingNotifications,
    isNotificationVisible: state.isNotificationVisible,
    isAnimationEnabled: state.isAnimationEnabled,
  };
};

// Export context for direct access if needed
export { XpAnimationContext };