/**
 * Enhanced Gamification Hooks - GamificationService Integration
 * 
 * CRITICAL: Replacement for OptimizedGamificationContext with enhanced performance
 * Think Hard methodology - seamless migration with improved performance
 * 
 * Key Features:
 * - 60fps real-time XP counter using GamificationService.addXPOptimized()
 * - Optimistic updates with automatic error recovery
 * - Performance metrics monitoring and optimization
 * - Backward compatible API with existing components
 * - Thread-safe state management with debounced background sync
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { GamificationService, OptimizedXPAdditionOptions, OptimizedXPTransactionResult } from '../services/gamificationService';
import { GamificationStats, XPSourceType } from '../types/gamification';
import { getCurrentLevel, getXPProgress, getLevelInfo } from '../services/levelCalculation';

// ========================================
// ENHANCED GAMIFICATION STATE INTERFACE
// ========================================

interface EnhancedGamificationState {
  // Core stats (optimized for real-time updates)
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage
  
  // Performance tracking
  isLoading: boolean;
  isInitialized: boolean;
  lastUpdated: Date | null;
  updateSequence: number; // For batch operation tracking
  
  // Multiplier info  
  multiplierActive: boolean;
  multiplierEndTime?: Date | undefined;
  
  // Error handling
  error: string | null;
  
  // Level-up celebration modal (optimized)
  showLevelUpModal: boolean;
  levelUpData?: {
    previousLevel: number;
    newLevel: number;
    levelTitle: string;
    levelDescription?: string | undefined;
    rewards?: string[] | undefined;
    isMilestone: boolean;
  } | undefined;
  
  // Performance optimization: Level-up history tracking
  shownLevelUps: Set<number>;
  
  // Real-time optimization: Cached progress values
  progressCache: {
    lastTotalXP: number;
    lastProgress: number;
    lastLevel: number;
    cacheTime: number;
  };
}

// Enhanced Gamification Hook Return Type
interface EnhancedGamificationHook {
  // State
  state: EnhancedGamificationState;
  
  // Optimized core actions with GamificationService
  addXP: (amount: number, options: OptimizedXPAdditionOptions) => Promise<OptimizedXPTransactionResult>;
  subtractXP: (amount: number, options: OptimizedXPAdditionOptions) => Promise<OptimizedXPTransactionResult>;
  refreshStats: () => Promise<void>;
  
  // Data getters (cached)
  getFullStats: () => Promise<GamificationStats>;
  
  // Level utilities (memoized)
  getLevelInfo: (level?: number) => ReturnType<typeof getLevelInfo>;
  isLevelMilestone: (level?: number) => boolean;
  
  // Level-up modal handlers
  hideLevelUpModal: () => void;
  
  // Performance utilities
  getPerformanceMetrics: () => ReturnType<typeof GamificationService.getPerformanceMetrics>;
}

// Enhanced XP Hook Return Type
interface EnhancedXPHook {
  totalXP: number;
  addXP: (amount: number, options: OptimizedXPAdditionOptions) => Promise<OptimizedXPTransactionResult>;
  isLoading: boolean;
  error: string | null;
  updateSequence: number; // For tracking updates
}

// Enhanced Level Hook Return Type
interface EnhancedLevelHook {
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number;
  getLevelInfo: (level?: number) => ReturnType<typeof getLevelInfo>;
  isLevelMilestone: (level?: number) => boolean;
  isLoading: boolean;
  progressCache: {
    lastTotalXP: number;
    lastProgress: number;
    lastLevel: number;
    cacheTime: number;
  };
  updateSequence: number; // For animation triggering
}

// ========================================
// INITIAL STATE
// ========================================

const initialEnhancedState: EnhancedGamificationState = {
  totalXP: 0,
  currentLevel: 0,
  xpToNextLevel: 100,
  xpProgress: 0,
  isLoading: true,
  isInitialized: false,
  lastUpdated: null,
  updateSequence: 0,
  multiplierActive: false,
  error: null,
  showLevelUpModal: false,
  shownLevelUps: new Set<number>(),
  progressCache: {
    lastTotalXP: 0,
    lastProgress: 0,
    lastLevel: 0,
    cacheTime: 0
  }
};

// ========================================
// MAIN ENHANCED GAMIFICATION HOOK
// ========================================

/**
 * Main hook for enhanced gamification with GamificationService integration
 * 
 * This hook provides the same API as OptimizedGamificationContext but uses
 * the enhanced GamificationService with addXPOptimized for better performance
 */
export const useEnhancedGamification = (): EnhancedGamificationHook => {
  const [state, setState] = useState<EnhancedGamificationState>(initialEnhancedState);
  const updateCountRef = useRef(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // OPTIMISTIC UPDATE CALLBACK
  // ========================================

  const handleOptimisticUpdate = useCallback((optimisticTotalXP: number, optimisticLevel: number) => {
    const immediateLevel = optimisticLevel;
    const immediateProgress = getXPProgress(optimisticTotalXP);
    
    console.log(`⚡ ENHANCED optimistic update: totalXP=${optimisticTotalXP}, level=${immediateLevel}, progress=${immediateProgress.xpProgress}%`);
    
    setState(prevState => ({
      ...prevState,
      totalXP: optimisticTotalXP,
      currentLevel: immediateLevel,
      xpToNextLevel: immediateProgress.xpToNextLevel,
      xpProgress: immediateProgress.xpProgress,
      lastUpdated: new Date(),
      updateSequence: prevState.updateSequence + 1,
      isLoading: false,
      error: null,
      progressCache: {
        lastTotalXP: optimisticTotalXP,
        lastProgress: immediateProgress.xpProgress,
        lastLevel: immediateLevel,
        cacheTime: Date.now()
      }
    }));
  }, []);

  // ========================================
  // BACKGROUND COMPLETION CALLBACK
  // ========================================

  const handleBackgroundComplete = useCallback((actualResult: OptimizedXPTransactionResult) => {
    console.log(`📊 ENHANCED background complete: totalXP=${actualResult.totalXP}, leveledUp=${actualResult.leveledUp}`);
    
    setState(prevState => {
      const newState = {
        ...prevState,
        totalXP: actualResult.totalXP,
        currentLevel: actualResult.newLevel,
        xpToNextLevel: getXPProgress(actualResult.totalXP).xpToNextLevel,
        xpProgress: getXPProgress(actualResult.totalXP).xpProgress,
        lastUpdated: new Date(),
        updateSequence: prevState.updateSequence + 1,
        progressCache: {
          lastTotalXP: actualResult.totalXP,
          lastProgress: getXPProgress(actualResult.totalXP).xpProgress,
          lastLevel: actualResult.newLevel,
          cacheTime: Date.now()
        }
      };

      // Handle level-up modal
      if (actualResult.leveledUp && !prevState.shownLevelUps.has(actualResult.newLevel) && actualResult.levelUpInfo) {
        console.log(`🎉 ENHANCED Level-up modal: Level ${actualResult.newLevel}`);
        return {
          ...newState,
          showLevelUpModal: true,
          levelUpData: {
            previousLevel: actualResult.previousLevel,
            newLevel: actualResult.newLevel,
            levelTitle: actualResult.levelUpInfo.newLevelTitle,
            levelDescription: actualResult.levelUpInfo.newLevelDescription,
            rewards: actualResult.levelUpInfo.rewards,
            isMilestone: actualResult.levelUpInfo.isMilestone,
          },
          shownLevelUps: new Set([...prevState.shownLevelUps, actualResult.newLevel])
        };
      }

      return newState;
    });
  }, []);

  // ========================================
  // ENHANCED XP OPERATIONS
  // ========================================

  const addXP = useCallback(async (amount: number, options: OptimizedXPAdditionOptions): Promise<OptimizedXPTransactionResult> => {
    updateCountRef.current += 1;
    
    console.log(`🚀 ENHANCED addXP: ${amount} XP from ${options.source}`);
    
    // Use GamificationService.addXPOptimized with our callbacks
    const enhancedOptions: OptimizedXPAdditionOptions = {
      ...options,
      enableOptimistic: true,
      onOptimisticUpdate: handleOptimisticUpdate,
      onBackgroundComplete: (result) => handleBackgroundComplete(result as OptimizedXPTransactionResult),
    };

    try {
      const result = await GamificationService.addXPOptimized(amount, enhancedOptions);
      
      console.log(`✅ ENHANCED addXP completed: ${result.operationTime.toFixed(2)}ms total, optimistic: ${result.wasOptimistic}`);
      
      return result;
    } catch (error) {
      console.error('Enhanced addXP error:', error);
      
      // Update error state
      setState(prevState => ({
        ...prevState,
        error: error instanceof Error ? error.message : 'Failed to add XP',
        isLoading: false
      }));

      // Return error result
      const currentXP = await GamificationService.getTotalXP();
      return {
        success: false,
        xpGained: 0,
        totalXP: currentXP,
        previousLevel: getCurrentLevel(currentXP),
        newLevel: getCurrentLevel(currentXP),
        leveledUp: false,
        milestoneReached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        operationTime: 0,
        wasOptimistic: false,
      };
    }
  }, [handleOptimisticUpdate, handleBackgroundComplete]);

  const subtractXP = useCallback(async (amount: number, options: OptimizedXPAdditionOptions): Promise<OptimizedXPTransactionResult> => {
    console.log(`⚡ ENHANCED subtractXP: ${amount} XP`);
    
    // Use addXP with negative amount
    return addXP(-amount, options);
  }, [addXP]);

  // ========================================
  // DATA OPERATIONS
  // ========================================

  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      console.log(`🔄 ENHANCED refreshStats called`);
      setState(prevState => ({ ...prevState, isLoading: true, error: null }));
      
      const stats = await GamificationService.getGamificationStats();
      const progress = getXPProgress(stats.totalXP);
      
      console.log(`📊 ENHANCED refreshStats data: totalXP=${stats.totalXP}`);
      
      setState(prevState => ({
        ...prevState,
        totalXP: stats.totalXP,
        currentLevel: getCurrentLevel(stats.totalXP),
        xpToNextLevel: progress.xpToNextLevel,
        xpProgress: progress.xpProgress,
        multiplierActive: stats.multiplierActive,
        multiplierEndTime: stats.multiplierEndTime,
        lastUpdated: new Date(),
        updateSequence: prevState.updateSequence + 1,
        isLoading: false,
        error: null,
        progressCache: {
          lastTotalXP: stats.totalXP,
          lastProgress: progress.xpProgress,
          lastLevel: getCurrentLevel(stats.totalXP),
          cacheTime: Date.now()
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh stats';
      console.error('Enhanced refreshStats error:', error);
      setState(prevState => ({
        ...prevState,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, []);

  const getFullStats = useCallback(async (): Promise<GamificationStats> => {
    return await GamificationService.getGamificationStats();
  }, []);

  // ========================================
  // LEVEL UTILITIES
  // ========================================

  const getLevelInfoUtil = useCallback((level?: number) => {
    return getLevelInfo(level || state.currentLevel);
  }, [state.currentLevel]);

  const isLevelMilestone = useCallback((level?: number) => {
    const targetLevel = level || state.currentLevel;
    return targetLevel % 10 === 0 || targetLevel === 25 || targetLevel === 50 || targetLevel === 75 || targetLevel === 100;
  }, [state.currentLevel]);

  // ========================================
  // LEVEL-UP MODAL HANDLERS
  // ========================================

  const hideLevelUpModal = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      showLevelUpModal: false,
      levelUpData: undefined
    }));
  }, []);

  // ========================================
  // PERFORMANCE UTILITIES
  // ========================================

  const getPerformanceMetrics = useCallback(() => {
    return GamificationService.getPerformanceMetrics();
  }, []);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    if (!state.isInitialized) {
      console.log('⚡ Enhanced Gamification initializing...');
      refreshStats().then(() => {
        setState(prevState => ({ ...prevState, isInitialized: true }));
        console.log('⚡ Enhanced Gamification initialized successfully');
      });
    }
  }, [state.isInitialized, refreshStats]);

  // ========================================
  // CLEANUP
  // ========================================

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    addXP,
    subtractXP,
    refreshStats,
    getFullStats,
    getLevelInfo: getLevelInfoUtil,
    isLevelMilestone,
    hideLevelUpModal,
    getPerformanceMetrics,
  };
};

// ========================================
// SPECIALIZED HOOKS (OPTIMIZED)
// ========================================

/**
 * Enhanced hook for XP-specific operations
 * Compatible replacement for useOptimizedXP
 */
export const useEnhancedXP = (): EnhancedXPHook => {
  const { state, addXP } = useEnhancedGamification();
  
  return useMemo(() => ({
    totalXP: state.totalXP,
    addXP,
    isLoading: state.isLoading,
    error: state.error,
    updateSequence: state.updateSequence,
  }), [state.totalXP, addXP, state.isLoading, state.error, state.updateSequence]);
};

/**
 * Enhanced hook for level-specific operations with caching
 * Compatible replacement for useOptimizedLevel
 */
export const useEnhancedLevel = (): EnhancedLevelHook => {
  const { state, getLevelInfo, isLevelMilestone } = useEnhancedGamification();
  
  return useMemo(() => ({
    currentLevel: state.currentLevel,
    xpToNextLevel: state.xpToNextLevel,
    xpProgress: state.xpProgress,
    getLevelInfo,
    isLevelMilestone,
    isLoading: state.isLoading,
    progressCache: state.progressCache,
    updateSequence: state.updateSequence,
  }), [
    state.currentLevel,
    state.xpToNextLevel,
    state.xpProgress,
    getLevelInfo,
    isLevelMilestone,
    state.isLoading,
    state.progressCache,
    state.updateSequence
  ]);
};