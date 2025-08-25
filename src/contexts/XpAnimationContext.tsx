import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as Haptics from 'expo-haptics';
import { XPSourceType } from '../types/gamification';
import CelebrationModal from '../components/gratitude/CelebrationModal';

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

interface LevelUpModalData {
  visible: boolean;
  level: number;
  title: string;
  description?: string;
  isMilestone: boolean;
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
  // Level-up celebration modal
  levelUpModal: LevelUpModalData;
  // Modal coordination system for priority management
  modalCoordination: {
    isPrimaryModalActive: boolean;  // Journal, habit, goal specific modals
    pendingSecondaryModals: Array<{
      type: 'levelUp' | 'achievement' | 'multiplier';
      data: any;
      timestamp: number;
    }>;
    currentPrimaryModalType?: 'journal' | 'habit' | 'goal' | null;
  };
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
  
  // Level-up celebration modal
  showLevelUpModal: (level: number, title: string, description?: string, isMilestone?: boolean) => void;
  hideLevelUpModal: () => void;
  
  // Modal coordination system
  notifyPrimaryModalStarted: (type: 'journal' | 'habit' | 'goal') => void;
  notifyPrimaryModalEnded: () => void;
  
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
    // Level-up celebration modal
    levelUpModal: {
      visible: false,
      level: 0,
      title: '',
      description: '',
      isMilestone: false,
      timestamp: 0,
    },
    // Modal coordination system
    modalCoordination: {
      isPrimaryModalActive: false,
      pendingSecondaryModals: [],
      currentPrimaryModalType: null,
    },
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
  
  // ========================================
  // LEVEL-UP MODAL MANAGEMENT (defined early for useEffect dependencies)
  // ========================================

  const showLevelUpModal = useCallback((level: number, title: string, description?: string, isMilestone: boolean = false) => {
    console.log(`🎆 Showing level-up modal: Level ${level} (${title})`);
    
    setState(prev => ({
      ...prev,
      levelUpModal: {
        visible: true,
        level,
        title,
        description: description || '',
        isMilestone,
        timestamp: Date.now(),
      },
    }));
    
    // Trigger celebration effects (using direct Haptics calls to avoid dependency issues)
    if (state.isHapticsEnabled) {
      try {
        if (isMilestone) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (error) {
        console.log('Level-up haptic feedback not available:', error);
      }
    }
  }, [state.isHapticsEnabled, state.isSoundEnabled]);

  // ========================================
  // MODAL COORDINATION SYSTEM - Priority Management
  // ========================================
  
  const notifyPrimaryModalStarted = useCallback((type: 'journal' | 'habit' | 'goal') => {
    console.log(`🎯 Primary modal started: ${type}`);
    setState(prev => ({
      ...prev,
      modalCoordination: {
        ...prev.modalCoordination,
        isPrimaryModalActive: true,
        currentPrimaryModalType: type,
      }
    }));
  }, []);
  
  const notifyPrimaryModalEnded = useCallback(() => {
    console.log(`✅ Primary modal ended - processing secondary modals`);
    setState(prev => ({
      ...prev,
      modalCoordination: {
        ...prev.modalCoordination,
        isPrimaryModalActive: false,
        currentPrimaryModalType: null,
      }
    }));
    
    // Process any pending secondary modals after a short delay
    setTimeout(() => {
      processSecondaryModals();
    }, 300);
  }, []);
  
  const processSecondaryModals = useCallback(() => {
    setState(prev => {
      if (prev.modalCoordination.pendingSecondaryModals.length === 0) {
        return prev;
      }
      
      const nextModal = prev.modalCoordination.pendingSecondaryModals[0];
      if (!nextModal) return prev;
      
      const remainingModals = prev.modalCoordination.pendingSecondaryModals.slice(1);
      
      console.log(`🎭 Processing secondary modal: ${nextModal.type}`);
      
      // Handle different types of secondary modals
      if (nextModal.type === 'levelUp') {
        showLevelUpModal(
          nextModal.data.newLevel,
          nextModal.data.levelTitle,
          nextModal.data.levelDescription,
          nextModal.data.isMilestone || false
        );
      }
      
      return {
        ...prev,
        modalCoordination: {
          ...prev.modalCoordination,
          pendingSecondaryModals: remainingModals,
        }
      };
    });
  }, [showLevelUpModal]);

  const hideLevelUpModal = useCallback(() => {
    console.log(`💫 Hiding level-up modal`);
    
    setState(prev => ({
      ...prev,
      levelUpModal: {
        ...prev.levelUpModal,
        visible: false,
      },
    }));
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

    const handleBatchCommitted = (eventData: any) => {
      console.log('🎆 XpAnimationContext: Received xpBatchCommitted event', eventData);
      
      if (eventData && eventData.totalAmount && eventData.sources && showXpPopupRef.current) {
        // Show batched XP popup with primary source
        const primarySource = eventData.sources[0]?.source || 'batch';
        showXpPopupRef.current(eventData.totalAmount, primarySource, { x: 0, y: 0 });
        
        // Also trigger smart notification for batched XP
        showSmartNotification(eventData.totalAmount, primarySource);
      }
    };

    const handleLevelUp = (eventData: any) => {
      if (eventData && eventData.newLevel && eventData.levelTitle) {
        console.log(`🎉 Global Level-up celebration: Level ${eventData.newLevel} (${eventData.levelTitle})`);
        
        // PRIORITY SYSTEM: Check if primary modal is active
        if (state.modalCoordination.isPrimaryModalActive) {
          console.log(`⏸️ Level-up modal queued - primary modal active (${state.modalCoordination.currentPrimaryModalType})`);
          
          // Add to secondary modal queue
          setState(prev => ({
            ...prev,
            modalCoordination: {
              ...prev.modalCoordination,
              pendingSecondaryModals: [...prev.modalCoordination.pendingSecondaryModals, {
                type: 'levelUp',
                data: {
                  newLevel: eventData.newLevel,
                  levelTitle: eventData.levelTitle,
                  levelDescription: eventData.levelDescription,
                  isMilestone: eventData.isMilestone || false
                },
                timestamp: Date.now()
              }]
            }
          }));
        } else {
          // No primary modal active - show immediately
          console.log(`⚡ Level-up modal showing immediately - no primary modal active`);
          showLevelUpModal(
            eventData.newLevel,
            eventData.levelTitle,
            eventData.levelDescription,
            eventData.isMilestone || false
          );
        }
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
  }, [showSmartNotification, showLevelUpModal]);

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
    // Level-up modal management
    showLevelUpModal,
    hideLevelUpModal,
    // Modal coordination system
    notifyPrimaryModalStarted,
    notifyPrimaryModalEnded,
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
      
      {/* Level-up Celebration Modal */}
      <CelebrationModal
        visible={state.levelUpModal.visible}
        onClose={hideLevelUpModal}
        type="level_up"
        levelUpData={{
          previousLevel: state.levelUpModal.level - 1,
          newLevel: state.levelUpModal.level,
          levelTitle: state.levelUpModal.title,
          ...(state.levelUpModal.description && { levelDescription: state.levelUpModal.description }),
          isMilestone: state.levelUpModal.isMilestone,
        }}
        disableXpAnimations={false} // Enable XP animation feedback
      />
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