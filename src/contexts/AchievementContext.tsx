// Achievement Context - React Context for achievement system state management
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
  addToCelebrationQueue: (achievement: Achievement, xpAwarded: number) => void;
  showNextCelebration: () => void;
  closeCelebrationModal: () => void;
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
  // State management
  const [userAchievements, setUserAchievements] = useState<UserAchievements>({
    unlockedAchievements: [],
    achievementProgress: {},
    lastChecked: new Date().toISOString().split('T')[0] as string,
    totalXPFromAchievements: 0,
    rarityCount: { common: 0, rare: 0, epic: 0, legendary: 0 },
    categoryProgress: { habits: 0, journal: 0, goals: 0, consistency: 0, mastery: 0, social: 0, special: 0 },
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
      social: { unlocked: 0, total: 0 },
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
  // CELEBRATION QUEUE SYSTEM
  // ========================================

  /**
   * Add achievement to celebration queue
   */
  const addToCelebrationQueue = useCallback((achievement: Achievement, xpAwarded: number) => {
    setCelebrationQueue(prev => [...prev, { achievement, xpAwarded }]);
  }, []);

  /**
   * Show next celebration from queue
   */
  const showNextCelebration = useCallback(() => {
    if (!showingCelebration && celebrationQueue.length > 0) {
      setShowingCelebration(true);
      setCurrentCelebrationIndex(0);
    }
  }, [showingCelebration, celebrationQueue.length]);

  /**
   * Close current celebration modal and show next in queue
   */
  const closeCelebrationModal = useCallback(() => {
    setShowingCelebration(false);
    
    // Remove the first item from queue
    setCelebrationQueue(prev => prev.slice(1));
    
    // Show next celebration after 2 second delay
    setTimeout(() => {
      setCelebrationQueue(currentQueue => {
        if (currentQueue.length > 0) {
          setShowingCelebration(true);
          setCurrentCelebrationIndex(0);
        }
        return currentQueue;
      });
    }, 2000); // 2-second interval as specified in project plan
  }, []);

  // Auto-trigger next celebration when queue is updated
  useEffect(() => {
    if (!showingCelebration && celebrationQueue.length > 0) {
      showNextCelebration();
    }
  }, [celebrationQueue.length, showingCelebration, showNextCelebration]);

  // ========================================
  // EVENT LISTENERS
  // ========================================

  useEffect(() => {
    // Listen for achievement unlock events
    const achievementUnlockedListener = DeviceEventEmitter.addListener(
      'achievementUnlocked',
      (eventData: { achievement: Achievement; xpAwarded: number; timestamp: number }) => {
        console.log('🏆 Achievement unlocked notification received:', eventData.achievement.name);
        
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
        addToCelebrationQueue(eventData.achievement, eventData.xpAwarded);
        
        // Refresh achievements data
        refreshAchievements();
      }
    );

    // Listen for multiple achievements unlocked
    const multipleAchievementsListener = DeviceEventEmitter.addListener(
      'multipleAchievementsUnlocked',
      (eventData: { count: number; totalXP: number; achievements: Achievement[] }) => {
        console.log(`🎉 Multiple achievements unlocked: ${eventData.count} achievements`);
        
        // Add all achievements to celebration queue
        eventData.achievements.forEach(achievement => {
          addToCelebrationQueue(achievement, achievement.xpReward);
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
    closeCelebrationModal
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      
      {/* Achievement Celebration Modal */}
      <AchievementCelebrationModal
        visible={showingCelebration && celebrationQueue.length > 0}
        onClose={closeCelebrationModal}
        achievement={celebrationQueue.length > 0 && celebrationQueue[0] ? celebrationQueue[0].achievement : null}
        xpAwarded={celebrationQueue.length > 0 && celebrationQueue[0] ? celebrationQueue[0].xpAwarded : 0}
      />
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