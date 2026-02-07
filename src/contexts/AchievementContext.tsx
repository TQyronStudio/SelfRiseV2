// Achievement Context - React Context for achievement system state management
import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  Achievement,
  UserAchievements,
  AchievementUnlockEvent,
  AchievementEvaluationResult,
  AchievementRarity,
  AchievementCategory
} from '../types/gamification';
import { AchievementService, AchievementUnlockResult } from '../services/achievementService';
import { AchievementStorage } from '../services/achievementStorage';
import { CORE_ACHIEVEMENTS } from '../constants/achievementCatalog';
import { AchievementCelebrationModal } from '../components/achievements/AchievementCelebrationModal';
import { useXpAnimation } from './XpAnimationContext';

// Achievement context state interface
interface AchievementContextState {
  // User achievements data
  userAchievements: UserAchievements;
  isLoading: boolean;
  
  // Achievement catalog
  allAchievements: Achievement[];
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  
  // Statistics
  unlockedCount: number;
  totalCount: number;
  completionPercentage: number;
  totalXPFromAchievements: number;
  
  // Recent activity
  recentUnlocks: AchievementUnlockEvent[];
  recentProgress: AchievementEvaluationResult[];
  
  // Filter states
  selectedCategory: AchievementCategory | undefined;
  selectedRarity: AchievementRarity | undefined;
  showOnlyUnlocked: boolean;
  
  // Celebration system
  celebrationQueue: Array<{ achievement: Achievement; xpAwarded: number }>;
  showingCelebration: boolean;
  currentCelebrationIndex: number;
}

// Achievement context actions interface
interface AchievementContextActions {
  // Data refresh
  refreshAchievements: () => Promise<void>;
  
  // Manual checks
  checkAllAchievements: () => Promise<AchievementUnlockResult>;
  checkSpecificAchievement: (achievementId: string) => Promise<AchievementUnlockResult>;
  
  // Filtering
  setSelectedCategory: (category?: AchievementCategory) => void;
  setSelectedRarity: (rarity?: AchievementRarity) => void;
  setShowOnlyUnlocked: (showOnly: boolean) => void;
  
  // Utilities
  getAchievementProgress: (achievementId: string) => number;
  isAchievementUnlocked: (achievementId: string) => boolean;
  getAchievementsByCategory: (category: AchievementCategory) => Achievement[];
  getAchievementsByRarity: (rarity: AchievementRarity) => Achievement[];
  
  // Statistics
  getStatsByCategory: () => Record<AchievementCategory, { unlocked: number; total: number }>;
  getStatsByRarity: () => Record<AchievementRarity, { unlocked: number; total: number }>;
  
  // Celebration system
  addToCelebrationQueue: (achievement: Achievement, xpAwarded: number) => Promise<void>;
  showNextCelebration: () => void;
  closeCelebrationModal: () => void;
  
  // Display sorting
  sortAchievementsForDisplay: (achievements: Achievement[]) => Achievement[];
}

// Combined context interface
interface AchievementContextValue extends AchievementContextState, AchievementContextActions {}

// Create context
const AchievementContext = createContext<AchievementContextValue | undefined>(undefined);

// Achievement context provider props
interface AchievementProviderProps {
  children: ReactNode;
}

/**
 * Achievement Context Provider
 * Manages achievement state and provides real-time updates
 */
export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  // 4-Tier Modal Priority System coordination
  const { notifyAchievementModalStarted, notifyAchievementModalEnded, state: xpAnimationState } = useXpAnimation();

  // Store modal state in ref to avoid re-renders and setState during render issues
  const xpAnimationStateRef = useRef(xpAnimationState);
  useEffect(() => {
    xpAnimationStateRef.current = xpAnimationState;
  }, [xpAnimationState]);

  // Helper function to check if higher priority modals are active (called from callbacks, not render)
  const isHigherPriorityModalActive = useCallback(() => {
    return xpAnimationStateRef.current.modalCoordination.isActivityModalActive ||
           xpAnimationStateRef.current.modalCoordination.isMonthlyChallengeModalActive;
  }, []);
  
  // State management
  const [userAchievements, setUserAchievements] = useState<UserAchievements>({
    unlockedAchievements: [],
    achievementProgress: {},
    lastChecked: new Date().toISOString().split('T')[0] as string,
    totalXPFromAchievements: 0,
    rarityCount: { common: 0, rare: 0, epic: 0, legendary: 0 },
    categoryProgress: { habits: 0, journal: 0, goals: 0, consistency: 0, mastery: 0, special: 0 },
    progressHistory: [],
    streakData: {}
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementUnlockEvent[]>([]);
  const [recentProgress, setRecentProgress] = useState<AchievementEvaluationResult[]>([]);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | undefined>();
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | undefined>();
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  
  // Celebration system states
  const [celebrationQueue, setCelebrationQueue] = useState<Array<{ achievement: Achievement; xpAwarded: number }>>([]);
  const [showingCelebration, setShowingCelebration] = useState(false);
  const [currentCelebrationIndex, setCurrentCelebrationIndex] = useState(-1);

  // Derived state
  const allAchievements = CORE_ACHIEVEMENTS;
  const unlockedAchievements = allAchievements.filter(a => 
    userAchievements.unlockedAchievements.includes(a.id)
  );
  const lockedAchievements = allAchievements.filter(a => 
    !userAchievements.unlockedAchievements.includes(a.id)
  );
  
  const unlockedCount = userAchievements.unlockedAchievements.length;
  const totalCount = allAchievements.length;
  const completionPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
  const totalXPFromAchievements = userAchievements.totalXPFromAchievements;

  // ========================================
  // DATA LOADING & REFRESH
  // ========================================

  /**
   * Load user achievements data
   */
  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await AchievementStorage.getUserAchievements();
      setUserAchievements(userData);
    } catch (error) {
      console.error('AchievementContext.loadAchievements error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh achievements data
   */
  const refreshAchievements = useCallback(async () => {
    await loadAchievements();
  }, [loadAchievements]);

  // ========================================
  // MANUAL ACHIEVEMENT CHECKS
  // ========================================

  /**
   * Check all achievements manually
   */
  const checkAllAchievements = useCallback(async (): Promise<AchievementUnlockResult> => {
    try {
      const result = await AchievementService.runBatchAchievementCheck({
        forceUpdate: true
      });
      
      if (result.unlocked.length > 0) {
        await refreshAchievements();
      }
      
      return result;
    } catch (error) {
      console.error('AchievementContext.checkAllAchievements error:', error);
      return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
    }
  }, [refreshAchievements]);

  /**
   * Check specific achievement manually
   */
  const checkSpecificAchievement = useCallback(async (achievementId: string): Promise<AchievementUnlockResult> => {
    try {
      const result = await AchievementService.forceCheckAchievement(achievementId);
      
      if (result.unlocked.length > 0) {
        await refreshAchievements();
      }
      
      return result;
    } catch (error) {
      console.error('AchievementContext.checkSpecificAchievement error:', error);
      return { unlocked: [], progress: [], xpAwarded: 0, leveledUp: false };
    }
  }, [refreshAchievements]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Get achievement progress percentage
   */
  const getAchievementProgress = useCallback((achievementId: string): number => {
    return userAchievements.achievementProgress[achievementId] || 0;
  }, [userAchievements.achievementProgress]);

  /**
   * Check if achievement is unlocked
   */
  const isAchievementUnlocked = useCallback((achievementId: string): boolean => {
    return userAchievements.unlockedAchievements.includes(achievementId);
  }, [userAchievements.unlockedAchievements]);

  /**
   * Get achievements by category
   */
  const getAchievementsByCategory = useCallback((category: AchievementCategory): Achievement[] => {
    return allAchievements.filter(a => a.category === category);
  }, [allAchievements]);

  /**
   * Get achievements by rarity
   */
  const getAchievementsByRarity = useCallback((rarity: AchievementRarity): Achievement[] => {
    return allAchievements.filter(a => a.rarity === rarity);
  }, [allAchievements]);

  /**
   * Get statistics by category
   */
  const getStatsByCategory = useCallback((): Record<AchievementCategory, { unlocked: number; total: number }> => {
    const stats: Record<AchievementCategory, { unlocked: number; total: number }> = {
      habits: { unlocked: 0, total: 0 },
      journal: { unlocked: 0, total: 0 },
      goals: { unlocked: 0, total: 0 },
      consistency: { unlocked: 0, total: 0 },
      mastery: { unlocked: 0, total: 0 },
      special: { unlocked: 0, total: 0 }
    };

    // Count totals
    for (const achievement of allAchievements) {
      stats[achievement.category].total++;
      if (userAchievements.unlockedAchievements.includes(achievement.id)) {
        stats[achievement.category].unlocked++;
      }
    }

    return stats;
  }, [allAchievements, userAchievements.unlockedAchievements]);

  /**
   * Get statistics by rarity
   */
  const getStatsByRarity = useCallback((): Record<AchievementRarity, { unlocked: number; total: number }> => {
    const stats: Record<AchievementRarity, { unlocked: number; total: number }> = {
      common: { unlocked: 0, total: 0 },
      rare: { unlocked: 0, total: 0 },
      epic: { unlocked: 0, total: 0 },
      legendary: { unlocked: 0, total: 0 }
    };

    // Count totals
    for (const achievement of allAchievements) {
      stats[achievement.rarity].total++;
      if (userAchievements.unlockedAchievements.includes(achievement.id)) {
        stats[achievement.rarity].unlocked++;
      }
    }

    return stats;
  }, [allAchievements, userAchievements.unlockedAchievements]);

  // ========================================
  // ACHIEVEMENT DISPLAY SORTING (CRESCENDO PSYCHOLOGY)
  // ========================================

  /**
   * Sort achievements for display using crescendo effect
   * Lower rarity achievements displayed first, building to legendary finale
   * Implementation based on technical-guides:Achievements.md
   */
  const sortAchievementsForDisplay = useCallback((achievements: Achievement[]): Achievement[] => {
    return [...achievements].sort((a, b) => {
      // 1. RARITY FIRST: Lower rarity displayed first (CRESCENDO EFFECT)
      const rarityOrder = { 
        [AchievementRarity.COMMON]: 1, 
        [AchievementRarity.RARE]: 2, 
        [AchievementRarity.EPIC]: 3, 
        [AchievementRarity.LEGENDARY]: 4 
      };
      if (a.rarity !== b.rarity) {
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      }
      
      // 2. CATEGORY IMPORTANCE: Strategic category ordering
      const categoryOrder = {
        [AchievementCategory.SPECIAL]: 1,      // Special achievements first (setup)
        [AchievementCategory.JOURNAL]: 2,      // Personal growth (foundation)
        [AchievementCategory.HABITS]: 3,       // Daily consistency (building)
        [AchievementCategory.GOALS]: 4,        // Concrete achievements (momentum)
        [AchievementCategory.CONSISTENCY]: 5,  // Long-term dedication (climax)
        [AchievementCategory.MASTERY]: 6,      // Ultimate mastery (finale)
      };
      if (a.category !== b.category) {
        return categoryOrder[a.category] - categoryOrder[b.category];
      }
      
      // 3. XP VALUE: Higher XP within same rarity = later display (crescendo within tier)
      return a.xpReward - b.xpReward;
    });
  }, []);

  // ========================================
  // CELEBRATION QUEUE SYSTEM
  // ========================================

  /**
   * Add achievement to celebration queue
   * Skip during tutorial EXCEPT for first-habit and first-goal achievements
   */
  const addToCelebrationQueue = useCallback(async (achievement: Achievement, xpAwarded: number) => {
    // Check if tutorial is active
    const { isTutorialActive } = await import('./TutorialContext');
    const tutorialActive = await isTutorialActive();

    // Allow first-habit and first-goal achievements to show during tutorial
    const isFirstStepAchievement = achievement.id === 'first-habit' || achievement.id === 'first-goal';

    if (tutorialActive && !isFirstStepAchievement) {
      console.log(`🎓 [TUTORIAL] Skipping achievement modal for "${achievement.id}" - tutorial is active`);
      // Achievement is still unlocked and XP awarded, just no modal during tutorial
      return;
    }

    if (tutorialActive && isFirstStepAchievement) {
      console.log(`🎓 [TUTORIAL] Showing achievement modal for "${achievement.id}" - first step achievement during tutorial`);
    }

    setCelebrationQueue(prev => {
      // Deduplicate: don't add if already in queue (single + batch events both fire)
      if (prev.some(item => item.achievement.id === achievement.id)) {
        return prev;
      }
      return [...prev, { achievement, xpAwarded }];
    });
  }, []);

  /**
   * Show next celebration from queue with 4-Tier Modal Priority System coordination
   */
  const showNextCelebration = useCallback(() => {
    // Don't show achievements if higher priority modals (Tier 1-2) are active
    if (isHigherPriorityModalActive()) {
      console.log('⏸️ Achievement modal delayed - higher priority modal active (Tier 1-2)');
      return;
    }

    if (!showingCelebration && celebrationQueue.length > 0) {
      console.log('🏆 Starting Achievement Celebration Modal (Tier 3)');
      notifyAchievementModalStarted('achievement');
      setShowingCelebration(true);
      setCurrentCelebrationIndex(0);
    }
  }, [showingCelebration, celebrationQueue.length, notifyAchievementModalStarted, isHigherPriorityModalActive]);

  /**
   * Close current celebration modal and show next in queue with 3-Tier Modal Priority System coordination
   */
  const closeCelebrationModal = useCallback(() => {
    console.log('✅ Closing Achievement Celebration Modal (Tier 3)');
    setShowingCelebration(false);

    // Remove the first item from queue and check if more achievements remain
    setCelebrationQueue(prev => {
      const remaining = prev.slice(1);

      if (remaining.length === 0) {
        console.log('🏁 All achievements shown - notifying Tier 3 ended, Tier 4 level-ups can start');
        // Schedule outside setState updater to avoid cross-component setState warning
        setTimeout(() => notifyAchievementModalEnded(), 0);
      } else {
        console.log(`📋 ${remaining.length} more achievement(s) in queue - keeping Tier 3 active`);
      }

      return remaining;
    });

    // Emit event for tutorial coordination - allows tutorial to advance after achievement modal closes
    DeviceEventEmitter.emit('achievementCelebrationClosed');

    // Show next celebration after short delay (just enough for close animation)
    setTimeout(() => {
      showNextCelebration();
    }, 400); // 400ms - snappy transition between achievement modals
  }, [notifyAchievementModalEnded, showNextCelebration]);

  // Auto-trigger next celebration when queue is updated OR higher priority modals end
  useEffect(() => {
    if (!showingCelebration && celebrationQueue.length > 0 && !isHigherPriorityModalActive()) {
      console.log('🎬 Auto-triggering achievement celebration (queue has items, no higher priority modals)');
      showNextCelebration();
    }
  }, [celebrationQueue.length, showingCelebration, showNextCelebration, isHigherPriorityModalActive,
      xpAnimationState.modalCoordination.isActivityModalActive,
      xpAnimationState.modalCoordination.isMonthlyChallengeModalActive]);

  // ========================================
  // EVENT LISTENERS
  // ========================================

  useEffect(() => {
    // Listen for achievement unlock events
    const achievementUnlockedListener = DeviceEventEmitter.addListener(
      'achievementUnlocked',
      (eventData: { achievement: Achievement; xpAwarded: number; timestamp: number }) => {
        console.log('🏆 Achievement unlocked notification received:', eventData.achievement.id);
        
        // Add to recent unlocks
        const unlockEvent: AchievementUnlockEvent = {
          achievementId: eventData.achievement.id,
          unlockedAt: new Date(eventData.timestamp),
          trigger: 'real_time' as any,
          xpAwarded: eventData.xpAwarded,
          previousProgress: 0,
          finalProgress: 100,
          context: { achievement: eventData.achievement }
        };
        
        setRecentUnlocks(prev => [unlockEvent, ...prev.slice(0, 9)]); // Keep last 10

        // Add to celebration queue
        addToCelebrationQueue(eventData.achievement, eventData.xpAwarded).catch(err =>
          console.error('Error adding achievement to celebration queue:', err)
        );

        // Refresh achievements data
        refreshAchievements();
      }
    );

    // Listen for multiple achievements unlocked
    const multipleAchievementsListener = DeviceEventEmitter.addListener(
      'multipleAchievementsUnlocked',
      (eventData: { count: number; totalXP: number; achievements: Achievement[] }) => {
        console.log(`🎉 Multiple achievements unlocked: ${eventData.count} achievements`);
        
        // 🎯 CRESCENDO EFFECT: Sort achievements from lowest to highest rarity
        // This creates escalating joy - starting with common, building to legendary finale
        const sortedAchievements = sortAchievementsForDisplay(eventData.achievements);
        
        console.log('🎭 Achievement display order (crescendo effect):',
          sortedAchievements.map(a => `${a.id} (${a.rarity.toUpperCase()}, ${a.xpReward} XP)`));
        
        // Add all achievements to celebration queue in crescendo order
        sortedAchievements.forEach(achievement => {
          addToCelebrationQueue(achievement, achievement.xpReward).catch(err =>
            console.error('Error adding achievement to celebration queue:', err)
          );
        });
        
        refreshAchievements();
      }
    );

    // Cleanup listeners
    return () => {
      achievementUnlockedListener?.remove();
      multipleAchievementsListener?.remove();
    };
  }, [refreshAchievements]);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: AchievementContextValue = {
    // State
    userAchievements,
    isLoading,
    allAchievements,
    unlockedAchievements,
    lockedAchievements,
    unlockedCount,
    totalCount,
    completionPercentage,
    totalXPFromAchievements,
    recentUnlocks,
    recentProgress,
    selectedCategory,
    selectedRarity,
    showOnlyUnlocked,
    
    // Celebration system state
    celebrationQueue,
    showingCelebration,
    currentCelebrationIndex,
    
    // Actions
    refreshAchievements,
    checkAllAchievements,
    checkSpecificAchievement,
    setSelectedCategory,
    setSelectedRarity,
    setShowOnlyUnlocked,
    getAchievementProgress,
    isAchievementUnlocked,
    getAchievementsByCategory,
    getAchievementsByRarity,
    getStatsByCategory,
    getStatsByRarity,
    
    // Celebration system actions
    addToCelebrationQueue,
    showNextCelebration,
    closeCelebrationModal,
    
    // Display sorting
    sortAchievementsForDisplay
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      
      {/* Achievement Celebration Modal - Only render when valid data exists */}
      {showingCelebration && celebrationQueue.length > 0 && celebrationQueue[0] && (
        <AchievementCelebrationModal
          visible={true}
          onClose={closeCelebrationModal}
          achievement={celebrationQueue[0].achievement}
          xpAwarded={celebrationQueue[0].xpAwarded}
        />
      )}
    </AchievementContext.Provider>
  );
};

// ========================================
// CUSTOM HOOKS
// ========================================

/**
 * Main achievement hook
 */
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

/**
 * Hook for achievement statistics
 */
export const useAchievementStats = () => {
  const {
    unlockedCount,
    totalCount,
    completionPercentage,
    totalXPFromAchievements,
    getStatsByCategory,
    getStatsByRarity
  } = useAchievements();

  return {
    unlockedCount,
    totalCount,
    completionPercentage,
    totalXPFromAchievements,
    categoryStats: getStatsByCategory(),
    rarityStats: getStatsByRarity()
  };
};

/**
 * Hook for filtered achievements
 */
export const useFilteredAchievements = () => {
  const {
    allAchievements,
    unlockedAchievements,
    lockedAchievements,
    selectedCategory,
    selectedRarity,
    showOnlyUnlocked
  } = useAchievements();

  const filteredAchievements = React.useMemo(() => {
    let achievements = showOnlyUnlocked ? unlockedAchievements : allAchievements;

    if (selectedCategory) {
      achievements = achievements.filter(a => a.category === selectedCategory);
    }

    if (selectedRarity) {
      achievements = achievements.filter(a => a.rarity === selectedRarity);
    }

    return achievements;
  }, [
    allAchievements,
    unlockedAchievements,
    selectedCategory,
    selectedRarity,
    showOnlyUnlocked
  ]);

  return {
    filteredAchievements,
    totalFiltered: filteredAchievements.length
  };
};

/**
 * Hook for specific achievement
 */
export const useAchievement = (achievementId: string) => {
  const {
    allAchievements,
    getAchievementProgress,
    isAchievementUnlocked,
    checkSpecificAchievement
  } = useAchievements();

  const achievement = allAchievements.find(a => a.id === achievementId);
  const progress = getAchievementProgress(achievementId);
  const isUnlocked = isAchievementUnlocked(achievementId);

  return {
    achievement,
    progress,
    isUnlocked,
    checkAchievement: () => checkSpecificAchievement(achievementId)
  };
};