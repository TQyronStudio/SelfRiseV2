import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { XPSourceType } from '../types/gamification';
import { useModalQueue, ModalPriority } from './ModalQueueContext';

// Tutorial storage keys (duplicated here to avoid circular dependency with TutorialContext)
const TUTORIAL_COMPLETED_KEY = 'onboarding_tutorial_completed';
const TUTORIAL_SKIPPED_KEY = 'onboarding_tutorial_skipped';

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
  const { enqueue: enqueueModal } = useModalQueue();
  const enqueueModalRef = useRef(enqueueModal);
  enqueueModalRef.current = enqueueModal;

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
  // SMART NOTIFICATION SYSTEM WITH PERFORMANCE OPTIMIZATION
  // ========================================

  // Constants for smart batching and performance
  const BATCHING_WINDOW = 1500; // 1.5 seconds - faster feedback
  const COOLDOWN_PERIOD = 4000; // 4 seconds
  const MAX_SIMULTANEOUS_NOTIFICATIONS = 5; // Performance limit - prevents lag on budget devices
  const NOTIFICATION_QUEUE_PROCESSING_INTERVAL = 500; // Process queued notifications every 500ms
  const PERFORMANCE_THROTTLE_THRESHOLD = 3; // Start throttling animations after 3 notifications

  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationQueueRef = useRef<XpGain[]>([]); // Queue for excess notifications
  const queueProcessingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showSmartNotification = useCallback((amount: number, source: XPSourceType) => {
    const now = Date.now();
    
    // Create new XP gain
    const newGain: XpGain = {
      id: `xp_gain_${now}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      source,
      timestamp: now,
    };

    // PERFORMANCE OPTIMIZATION: Check notification limit
    const currentVisibleCount = state.pendingNotifications.length;
    
    if (currentVisibleCount >= MAX_SIMULTANEOUS_NOTIFICATIONS) {
      // Queue notification for later processing to prevent performance issues
      notificationQueueRef.current.push(newGain);
      console.log(`⚡ Notification queued (${notificationQueueRef.current.length} in queue) - performance limit reached`);
      
      // Still trigger haptic for immediate feedback
      if (state.isHapticsEnabled) {
        triggerHapticFeedback('light');
      }
      return;
    }
    
    // Check cooldown period to prevent spam
    if (now - state.lastNotificationTime < COOLDOWN_PERIOD && state.isNotificationVisible) {
      // Add to pending notifications during cooldown (if under limit)
      setState(prev => ({
        ...prev,
        pendingNotifications: [...prev.pendingNotifications, newGain],
      }));
      
      // Reset batch timeout to ensure latest changes are included
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      // Set new timeout for updated batch
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
      return;
    }

    // Add new XP gain to pending notifications (normal flow)
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
  }, [state.lastNotificationTime, state.isNotificationVisible, state.isHapticsEnabled, state.pendingNotifications.length]);

  // ========================================
  // NOTIFICATION QUEUE PROCESSING FOR PERFORMANCE
  // ========================================

  // Process notification queue to respect performance limits
  const processNotificationQueue = useCallback(() => {
    const currentVisibleCount = state.pendingNotifications.length;
    
    // Only process queue if we have room for more notifications
    if (currentVisibleCount < MAX_SIMULTANEOUS_NOTIFICATIONS && notificationQueueRef.current.length > 0) {
      const availableSlots = MAX_SIMULTANEOUS_NOTIFICATIONS - currentVisibleCount;
      const notificationsToProcess = notificationQueueRef.current.splice(0, availableSlots);
      
      if (notificationsToProcess.length > 0) {
        setState(prev => ({
          ...prev,
          pendingNotifications: [...prev.pendingNotifications, ...notificationsToProcess],
          isNotificationVisible: true,
          lastNotificationTime: Date.now()
        }));
        
        console.log(`📱 Processed ${notificationsToProcess.length} queued notifications (${notificationQueueRef.current.length} remaining)`);
      }
    }
  }, [state.pendingNotifications.length]);

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

    // Process queue immediately when notifications are dismissed (performance optimization)
    setTimeout(() => {
      processNotificationQueue();
    }, 100); // Small delay to allow state update
  }, [processNotificationQueue]);

  // Start queue processing interval
  useEffect(() => {
    if (queueProcessingIntervalRef.current) {
      clearInterval(queueProcessingIntervalRef.current);
    }
    
    queueProcessingIntervalRef.current = setInterval(processNotificationQueue, NOTIFICATION_QUEUE_PROCESSING_INTERVAL);
    
    return () => {
      if (queueProcessingIntervalRef.current) {
        clearInterval(queueProcessingIntervalRef.current);
      }
    };
  }, [processNotificationQueue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);
  
  // 4-Tier Modal Coordination System REMOVED - replaced by centralized ModalQueueContext
  // showLevelUpModal, hideLevelUpModal, processLevelUpModals, all notify* functions removed

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

    const handleBatchCommitted = (eventData: any) => {
      console.log('🎆 XpAnimationContext: Received xpBatchCommitted event', eventData);
      
      if (eventData && eventData.totalAmount && eventData.sources && showXpPopupRef.current) {
        // Show batched XP popup with primary source
        const primarySource = eventData.sources[0]?.source || 'batch';
        showXpPopupRef.current(eventData.totalAmount, primarySource, { x: 50, y: 130 });
        
        // Also trigger smart notification for batched XP
        showSmartNotification(eventData.totalAmount, primarySource);
      }
    };

    // achievementQueueStarting listener REMOVED - no longer needed with centralized ModalQueue
    // Each achievement is enqueued individually, queue handles priority ordering

    const handleLevelUp = async (eventData: any) => {
      try {
        if (eventData && eventData.newLevel && eventData.levelTitle) {
          // Suppress level-up modal during tutorial — XP and level are already saved
          // NOTE: Direct AsyncStorage check to avoid circular dependency with TutorialContext
          const tutorialCompleted = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
          const tutorialSkipped = await AsyncStorage.getItem(TUTORIAL_SKIPPED_KEY);
          const tutorialActive = tutorialCompleted !== 'true' && tutorialSkipped !== 'true';

          if (tutorialActive) {
            console.log(`🎓 [TUTORIAL] Suppressing level-up modal (Level ${eventData.newLevel}) - tutorial is active`);
            return;
          }

          console.log(`🎉 Level-up → ModalQueue: Level ${eventData.newLevel} (${eventData.levelTitle})`);

          // Enqueue to centralized modal queue - it handles priority and ordering
          enqueueModalRef.current({
            type: 'level_up',
            priority: ModalPriority.LEVEL_UP,
            props: {
              newLevel: eventData.newLevel,
              levelTitle: eventData.levelTitle,
              levelDescription: eventData.levelDescription,
              isMilestone: eventData.isMilestone || false,
            },
          });
        } else {
          console.warn(`⚠️ Invalid level-up event data received:`, eventData);
        }
      } catch (error) {
        console.error('🚨 Level-up modal enqueue failed:', error instanceof Error ? error.message : String(error));
      }
    };

    // Add event listeners for React Native using DeviceEventEmitter
    const xpGainedSubscription = DeviceEventEmitter.addListener('xpGained', handleXPGained);
    const smartNotificationSubscription = DeviceEventEmitter.addListener('xpSmartNotification', handleSmartNotification);
    const batchCommittedSubscription = DeviceEventEmitter.addListener('xpBatchCommitted', handleBatchCommitted);
    const levelUpSubscription = DeviceEventEmitter.addListener('levelUp', handleLevelUp);

    return () => {
      xpGainedSubscription?.remove();
      smartNotificationSubscription?.remove();
      batchCommittedSubscription?.remove();
      levelUpSubscription?.remove();
    };
  }, [showSmartNotification]);

  // ========================================
  // ANIMATION MANAGEMENT
  // ========================================

  const showXpPopup = useCallback((
    amount: number, 
    source: XPSourceType, 
    position = { x: 50, y: 130 } // Moved down further for better visibility
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
    }, 1400);
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
    // Settings and feedback
    toggleAnimations,
    toggleHaptics,
    toggleSounds,
    triggerHapticFeedback,
    playSoundEffect,
  };

  return (
    <XpAnimationContext.Provider value={contextValue}>
      {children}
      {/* Level-up CelebrationModal removed - now rendered by ModalQueueContext */}
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

// useXpFeedback hook moved to src/hooks/useXpFeedback.ts to prevent circular dependency

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