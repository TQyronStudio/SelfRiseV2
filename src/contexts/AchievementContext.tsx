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
import { useModalQueue, ModalPriority } from './ModalQueueContext';
import { postTrophyNote } from '../services/moments/noteBus';
import { XPSourceType } from '../types/gamification';
import { routeTrophyBatch } from '../services/moments/trophyBatch';
import { chapterOfAction } from '../services/moments/momentRules';
import { LEVEL_TIERS } from '../services/levels/levelsJourney';
import { markChapterShown } from '../services/moments/chapterShown';
import { GamificationService } from '../services/gamificationService';
import i18n from '../config/i18n';

/** The trophies of one action arrive within this window (one loop in the service). */
const BATCH_WINDOW_MS = 400;
/** The batch's XP (one addXP) may come this long before its first unlock event. */
const CREDIT_JOIN_MS = 1500;

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
  // Centralized Modal Queue - achievements are enqueued, queue handles priority
  const { enqueue: enqueueModal } = useModalQueue();
  const enqueueModalRef = useRef(enqueueModal);
  enqueueModalRef.current = enqueueModal;

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
  
  // Celebration system states - kept for interface compatibility but queue is now centralized
  const [celebrationQueue] = useState<Array<{ achievement: Achievement; xpAwarded: number }>>([]);
  const [showingCelebration] = useState(false);
  const [currentCelebrationIndex] = useState(-1);

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

  // ========================================
  // ONE ACTION, ONE MOMENT (migration E8, R-29)
  // ========================================
  // The service reports unlocks one by one (`achievementUnlocked` per trophy) and
  // pays their XP in ONE addXP. The events of one instant are collected into a
  // batch and become ONE moment (routeTrophyBatch): epic / legendary → one window
  // for the rarest with the others inside; otherwise one quiet note at the badge.
  // A trophy combo the batch switched on rides inside the same moment (boost).
  const batch = useRef<Achievement[]>([]);
  const batchCredited = useRef(0);
  const lastCreditAt = useRef(0);
  const batchBoost = useRef<{ factor: string; hours: number } | undefined>(undefined);
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(async () => {
    batchTimer.current = null;
    const items = batch.current;
    const credited =
      Date.now() - lastCreditAt.current <= CREDIT_JOIN_MS + BATCH_WINDOW_MS ? batchCredited.current : 0;
    const boost = batchBoost.current;
    batch.current = [];
    batchCredited.current = 0;
    batchBoost.current = undefined;
    const { isTutorialActive } = await import('./TutorialContext');
    const onboarding = await isTutorialActive();
    const moment = routeTrophyBatch(
      items.map(a => ({ id: a.id, rarity: a.rarity, xp: a.xpReward, achievement: a })),
      onboarding
    );
    if (!moment) return;
    const shown = moment.kind === 'big' ? [moment.headliner, ...moment.also] : moment.items;
    // The number shown is what was really CREDITED (caps, a running multiplier),
    // not the catalogue — the same XP that flies into the badge.
    const xp = credited > 0 ? credited : shown.reduce((sum, item) => sum + item.xp, 0);
    // L-8: the trophies' XP opened a new chapter — ONE window, the chapter, with
    // the trophies inside (their XP flies from its button). The level-up event
    // of the same XP skips this chapter once (chapterShown).
    if (!onboarding && credited > 0) {
      const total = await GamificationService.getTotalXP();
      const chapter = chapterOfAction(total - credited, credited);
      if (chapter) {
        // The level-up events come one level at a time: the one that opens the
        // tier is its FIRST level (a jump 10 → 12 opens at 11, not 12).
        const entry = LEVEL_TIERS.find(t => t.id === chapter.tier)?.from ?? chapter.level;
        markChapterShown(entry);
        enqueueModalRef.current({
          type: 'level_up',
          priority: ModalPriority.LEVEL_UP,
          props: { level: chapter.level, tier: chapter.tier, also: shown.map(item => item.achievement), xp },
        });
        return;
      }
    }
    if (moment.kind === 'big') {
      enqueueModalRef.current({
        type: 'achievement',
        priority: ModalPriority.ACHIEVEMENT,
        props: {
          achievement: moment.headliner.achievement,
          xpAwarded: xp,
          also: moment.also.map(item => item.achievement),
          ...(boost ? { boost } : {}),
        },
      });
    } else {
      postTrophyNote({
        items: moment.items.map(item => ({
          id: item.id,
          rarity: item.rarity,
          icon: item.achievement.icon,
          nameKey: item.achievement.nameKey,
        })),
        xp,
        ...(boost ? { boost } : {}),
      });
    }
  }, []);

  /** One trophy of the current instant. */
  const addToCelebrationQueue = useCallback(async (achievement: Achievement, _xpAwarded?: number) => {
    batch.current.push(achievement);
    if (batchTimer.current) clearTimeout(batchTimer.current);
    batchTimer.current = setTimeout(() => {
      flushBatch().catch(err => console.error('Error showing the trophy moment:', err));
    }, BATCH_WINDOW_MS);
  }, [flushBatch]);

  useEffect(() => {
    const subs = [
      // What the batch really paid (one addXP for all of it).
      DeviceEventEmitter.addListener('xpGained', (e: { amount?: number; source?: string }) => {
        // It arrives just BEFORE the unlock events (the service pays first), so
        // it is kept for a moment and joins the batch that follows.
        if (e?.source === XPSourceType.ACHIEVEMENT_UNLOCK && (e.amount ?? 0) > 0) {
          const now = Date.now();
          const recent = now - lastCreditAt.current <= CREDIT_JOIN_MS;
          batchCredited.current = (recent ? batchCredited.current : 0) + (e.amount ?? 0);
          lastCreditAt.current = now;
        }
      }),
      // A combo the batch switched on is told inside the moment (L-11).
      DeviceEventEmitter.addListener('xpMultiplierActivated', (e: { source?: string; multiplier?: number; duration?: number }) => {
        if (e?.source === 'achievement' && batch.current.length > 0 && e.multiplier && e.duration) {
          const factor = new Intl.NumberFormat(i18n.language).format(e.multiplier);
          batchBoost.current = { factor, hours: e.duration };
        }
      }),
    ];
    return () => {
      subs.forEach(sub => sub.remove());
      if (batchTimer.current) clearTimeout(batchTimer.current);
    };
  }, []);

  // showNextCelebration and closeCelebrationModal are no-ops now - queue handles everything
  const showNextCelebration = useCallback(() => {}, []);
  const closeCelebrationModal = useCallback(() => {
    DeviceEventEmitter.emit('achievementCelebrationClosed');
  }, []);

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

        // Into the batch of this instant (one action → one moment)
        addToCelebrationQueue(eventData.achievement);

        // Refresh achievements data
        refreshAchievements();
      }
    );

    // Listen for multiple achievements unlocked
    const multipleAchievementsListener = DeviceEventEmitter.addListener(
      'multipleAchievementsUnlocked',
      (eventData: { count: number; totalXP: number; achievements: Achievement[] }) => {
        console.log(`🎉 Multiple achievements unlocked: ${eventData.count} achievements`);
        
        // Every trophy of it also came as its own `achievementUnlocked` — the batch
        // collector has them already (enqueueing here showed each one twice).
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
      {/* AchievementCelebrationModal removed - now rendered by ModalQueueContext */}
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