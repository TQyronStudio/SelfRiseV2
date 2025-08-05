import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import { GamificationService, XPTransactionResult, XPAdditionOptions } from '../services/gamificationService';
import { GamificationStats, XPSourceType, XPTransaction } from '../types/gamification';
import { getCurrentLevel, getXPProgress, getLevelInfo } from '../services/levelCalculation';
import CelebrationModal from '../components/gratitude/CelebrationModal';

// ========================================
// TYPES AND INTERFACES
// ========================================

interface GamificationState {
  // Core stats
  totalXP: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage
  
  // Status indicators
  isLoading: boolean;
  isInitialized: boolean;
  lastUpdated: Date | null;
  
  // Multiplier info
  multiplierActive: boolean;
  multiplierEndTime?: Date;
  
  // Error handling
  error: string | null;
  
  // Level-up celebration modal
  showLevelUpModal: boolean;
  levelUpData?: {
    previousLevel: number;
    newLevel: number;
    levelTitle: string;
    levelDescription?: string;
    rewards?: string[];
    isMilestone: boolean;
  };
  
  // Level-up history tracking (prevent duplicate modals)
  shownLevelUps: Set<number>;
}

interface GamificationContextValue {
  // State
  state: GamificationState;
  
  // Core actions
  addXP: (amount: number, options: XPAdditionOptions) => Promise<XPTransactionResult>;
  subtractXP: (amount: number, options: XPAdditionOptions) => Promise<XPTransactionResult>;
  refreshStats: () => Promise<void>;
  resetData: () => Promise<void>;
  
  // Data getters
  getFullStats: () => Promise<GamificationStats>;
  getTransactions: () => Promise<XPTransaction[]>;
  getXPBySource: () => Promise<Record<XPSourceType, number>>;
  
  // Level utilities
  getLevelInfo: (level?: number) => ReturnType<typeof getLevelInfo>;
  isLevelMilestone: (level?: number) => boolean;
  
  // Level-up celebration utilities
  checkForRecentLevelUps: () => Promise<any[]>;
  getRecentLevelUps: (count?: number) => Promise<any[]>;
  
  // Level-up modal handlers
  hideLevelUpModal: () => void;
}

// ========================================
// STATE MANAGEMENT
// ========================================

interface GamificationAction {
  type: 'SET_LOADING' | 'SET_ERROR' | 'UPDATE_STATS' | 'RESET_STATE' | 'SET_INITIALIZED' | 'SHOW_LEVEL_UP_MODAL' | 'HIDE_LEVEL_UP_MODAL';
  payload?: any;
}

const initialState: GamificationState = {
  totalXP: 0,
  currentLevel: 0,
  xpToNextLevel: 100,
  xpProgress: 0,
  isLoading: true,
  isInitialized: false,
  lastUpdated: null,
  multiplierActive: false,
  error: null,
  showLevelUpModal: false,
  shownLevelUps: new Set<number>(),
};

function gamificationReducer(state: GamificationState, action: GamificationAction): GamificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'UPDATE_STATS':
      const { totalXP, multiplierActive, multiplierEndTime } = action.payload;
      const currentLevel = getCurrentLevel(totalXP);
      const progress = getXPProgress(totalXP);
      
      console.log(`📊 UPDATE_STATS: totalXP=${totalXP}, currentLevel=${currentLevel} (was ${state.currentLevel}), progress=${progress.xpProgress}%`);
      
      return {
        ...state,
        totalXP,
        currentLevel,
        xpToNextLevel: progress.xpToNextLevel,
        xpProgress: progress.xpProgress,
        multiplierActive,
        multiplierEndTime,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'RESET_STATE':
      return { 
        ...initialState, 
        isInitialized: true,
        shownLevelUps: new Set<number>() // Clear level-up history on reset
      };
    
    case 'SHOW_LEVEL_UP_MODAL':
      const newShownLevelUps = new Set(state.shownLevelUps);
      newShownLevelUps.add(action.payload.newLevel);
      return { 
        ...state, 
        showLevelUpModal: true, 
        levelUpData: action.payload,
        shownLevelUps: newShownLevelUps
      };
    
    case 'HIDE_LEVEL_UP_MODAL':
      const { levelUpData, ...stateWithoutLevelUpData } = state;
      return { 
        ...stateWithoutLevelUpData, 
        showLevelUpModal: false, 
      };
    
    default:
      return state;
  }
}

// ========================================
// CONTEXT CREATION
// ========================================

const GamificationContext = createContext<GamificationContextValue | undefined>(undefined);

// ========================================
// PROVIDER COMPONENT
// ========================================

interface GamificationProviderProps {
  children: React.ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);

  // ========================================
  // CORE ACTIONS
  // ========================================

  // Define refreshStats first to avoid circular dependency
  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      console.log(`🔄 refreshStats called - current level: ${state.currentLevel}, totalXP: ${state.totalXP}`);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [totalXP, multiplierInfo] = await Promise.all([
        GamificationService.getTotalXP(),
        GamificationService.getActiveXPMultiplier(),
      ]);

      console.log(`📊 refreshStats data: totalXP=${totalXP} (was ${state.totalXP}), currentLevel calculation pending`);
      
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalXP,
          multiplierActive: multiplierInfo.isActive,
          multiplierEndTime: multiplierInfo.endTime,
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh stats';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const addXP = useCallback(async (amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> => {
    try {
      const result = await GamificationService.addXP(amount, options);
      
      // Update state immediately with result for instant UI feedback
      if (result.success) {
        console.log(`🔄 GamificationContext.addXP: ${amount} XP, leveledUp=${result.leveledUp}, newLevel=${result.newLevel}`);
        
        dispatch({
          type: 'UPDATE_STATS',
          payload: {
            totalXP: result.totalXP,
            multiplierActive: state.multiplierActive, // Keep current multiplier state
            multiplierEndTime: state.multiplierEndTime,
          }
        });
        
        // Check for level-up and show celebration modal (only if not shown before)
        console.log(`🔍 Level-up check: leveledUp=${result.leveledUp}, newLevel=${result.newLevel}, alreadyShown=${state.shownLevelUps.has(result.newLevel)}`);
        if (result.leveledUp && !state.shownLevelUps.has(result.newLevel)) {
          const levelInfo = getLevelInfo(result.newLevel);
          const isLevelMilestone = (level?: number) => {
            if (!level) return false;
            return level % 10 === 0 || level === 25 || level === 50 || level === 75 || level === 100;
          };
          
          console.log(`🎉 Level-up modal: Level ${result.newLevel} (first time)`);
          dispatch({
            type: 'SHOW_LEVEL_UP_MODAL',
            payload: {
              previousLevel: result.previousLevel,
              newLevel: result.newLevel,
              levelTitle: levelInfo.title,
              levelDescription: levelInfo.description,
              rewards: levelInfo.rewards,
              isMilestone: isLevelMilestone(result.newLevel),
            }
          });
        } else if (result.leveledUp) {
          console.log(`🚫 Level-up modal: Level ${result.newLevel} already shown`);
        }
        
        // Refresh full stats in background for accuracy - use immediate call for faster updates
        refreshStats();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add XP';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Return failed result
      return {
        success: false,
        xpGained: 0,
        totalXP: state.totalXP,
        previousLevel: state.currentLevel,
        newLevel: state.currentLevel,
        leveledUp: false,
        milestoneReached: false,
        error: errorMessage,
      };
    }
  }, [state.totalXP, state.currentLevel, state.multiplierActive, state.multiplierEndTime, refreshStats]);

  const subtractXP = useCallback(async (amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> => {
    try {
      const result = await GamificationService.subtractXP(amount, options);
      
      // Update state immediately with result for instant UI feedback
      if (result.success) {
        console.log(`🔄 GamificationContext.subtractXP: -${amount} XP, leveledUp=${result.leveledUp}, newLevel=${result.newLevel}`);
        
        dispatch({
          type: 'UPDATE_STATS',
          payload: {
            totalXP: result.totalXP,
            multiplierActive: state.multiplierActive, // Keep current multiplier state
            multiplierEndTime: state.multiplierEndTime,
          }
        });
        
        // Check for level-up even in subtractXP (level could increase after subtract due to background processes)
        console.log(`🔍 Level-up check (subtract): leveledUp=${result.leveledUp}, newLevel=${result.newLevel}, alreadyShown=${state.shownLevelUps.has(result.newLevel)}`);
        if (result.leveledUp && !state.shownLevelUps.has(result.newLevel)) {
          const levelInfo = getLevelInfo(result.newLevel);
          const isLevelMilestone = (level?: number) => {
            if (!level) return false;
            return level % 10 === 0 || level === 25 || level === 50 || level === 75 || level === 100;
          };
          
          console.log(`🎉 Level-up modal (from subtractXP): Level ${result.newLevel} (first time)`);
          dispatch({
            type: 'SHOW_LEVEL_UP_MODAL',
            payload: {
              previousLevel: result.previousLevel,
              newLevel: result.newLevel,
              levelTitle: levelInfo.title,
              levelDescription: levelInfo.description,
              rewards: levelInfo.rewards,
              isMilestone: isLevelMilestone(result.newLevel),
            }
          });
        }
        
        // Refresh full stats in background for accuracy - use immediate call for faster updates
        refreshStats();
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subtract XP';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Return failed result
      return {
        success: false,
        xpGained: 0,
        totalXP: state.totalXP,
        previousLevel: state.currentLevel,
        newLevel: state.currentLevel,
        leveledUp: false,
        milestoneReached: false,
        error: errorMessage,
      };
    }
  }, [state.totalXP, state.currentLevel, state.multiplierActive, state.multiplierEndTime, refreshStats]);

  const resetData = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await GamificationService.resetAllData();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset data';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // ========================================
  // DATA GETTERS
  // ========================================

  const getFullStats = useCallback(async (): Promise<GamificationStats> => {
    return await GamificationService.getGamificationStats();
  }, []);

  const getTransactions = useCallback(async (): Promise<XPTransaction[]> => {
    return await GamificationService.getAllTransactions();
  }, []);

  const getXPBySource = useCallback(async (): Promise<Record<XPSourceType, number>> => {
    return await GamificationService.getXPBySource();
  }, []);

  // ========================================
  // LEVEL UTILITIES
  // ========================================

  const getLevelInfoUtil = useCallback((level?: number) => {
    return getLevelInfo(level || state.currentLevel);
  }, [state.currentLevel]);

  const isLevelMilestone = useCallback((level?: number) => {
    const targetLevel = level || state.currentLevel;
    const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    return milestones.includes(targetLevel);
  }, [state.currentLevel]);

  // ========================================
  // LEVEL-UP CELEBRATION UTILITIES
  // ========================================

  const checkForRecentLevelUps = useCallback(async () => {
    try {
      // Get level-ups from the last 5 minutes to catch recent ones
      const recentLevelUps = await GamificationService.getRecentLevelUps(5);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Filter for very recent level-ups (within last 5 minutes)
      return recentLevelUps.filter(levelUp => 
        levelUp.timestamp > fiveMinutesAgo
      );
    } catch (error) {
      console.error('GamificationContext.checkForRecentLevelUps error:', error);
      return [];
    }
  }, []);

  const getRecentLevelUps = useCallback(async (count: number = 5) => {
    try {
      return await GamificationService.getRecentLevelUps(count);
    } catch (error) {
      console.error('GamificationContext.getRecentLevelUps error:', error);
      return [];
    }
  }, []);

  // ========================================
  // INITIALIZATION & AUTO-REFRESH
  // ========================================

  useEffect(() => {
    const initializeGamification = async () => {
      await refreshStats();
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    };

    if (!state.isInitialized) {
      initializeGamification();
    }
  }, [state.isInitialized, refreshStats]);

  // Auto-refresh disabled - real-time updates handle this now
  // useEffect(() => {
  //   if (!state.isInitialized) return;

  //   const intervalId = setInterval(() => {
  //     refreshStats();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(intervalId);
  // }, [state.isInitialized, refreshStats]);

  // ========================================
  // LEVEL-UP MODAL HANDLERS
  // ========================================

  const hideLevelUpModal = useCallback(() => {
    dispatch({ type: 'HIDE_LEVEL_UP_MODAL' });
  }, []);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const contextValue: GamificationContextValue = {
    state,
    addXP,
    subtractXP,
    refreshStats,
    resetData,
    getFullStats,
    getTransactions,
    getXPBySource,
    getLevelInfo: getLevelInfoUtil,
    isLevelMilestone,
    checkForRecentLevelUps,
    getRecentLevelUps,
    hideLevelUpModal,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
      
      {/* Level-up celebration modal */}
      {state.showLevelUpModal && state.levelUpData && (
        <CelebrationModal
          visible={state.showLevelUpModal}
          onClose={hideLevelUpModal}
          type="level_up"
          levelUpData={state.levelUpData}
          disableXpAnimations={true}
        />
      )}
    </GamificationContext.Provider>
  );
};

// ========================================
// HOOKS
// ========================================

/**
 * Main hook for accessing gamification context
 */
export const useGamification = (): GamificationContextValue => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

/**
 * Hook for XP-specific operations
 */
export const useXP = () => {
  const { state, addXP, getXPBySource } = useGamification();
  
  return {
    totalXP: state.totalXP,
    addXP,
    getXPBySource,
    isLoading: state.isLoading,
    error: state.error,
  };
};

/**
 * Hook for level-specific operations
 */
export const useLevel = () => {
  const { state, getLevelInfo, isLevelMilestone } = useGamification();
  
  return {
    currentLevel: state.currentLevel,
    xpToNextLevel: state.xpToNextLevel,
    xpProgress: state.xpProgress,
    getLevelInfo,
    isLevelMilestone,
    isLoading: state.isLoading,
  };
};

/**
 * Hook for multiplier information
 */
export const useXPMultiplier = () => {
  const { state } = useGamification();
  
  return {
    isActive: state.multiplierActive,
    endTime: state.multiplierEndTime,
    isLoading: state.isLoading,
  };
};

/**
 * Hook for achievements (placeholder for future implementation)
 */
export const useAchievements = () => {
  const { getFullStats } = useGamification();
  
  return {
    // Placeholder - will be implemented in achievement system
    unlockedCount: 0,
    totalCount: 0,
    getFullStats,
  };
};

// Export context for direct access if needed
export { GamificationContext };