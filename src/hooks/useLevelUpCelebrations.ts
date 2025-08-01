import { useState, useCallback } from 'react';
import { XPTransactionResult } from '../services/gamificationService';

export interface LevelUpCelebrationData {
  visible: boolean;
  levelUpData: {
    previousLevel: number;
    newLevel: number;
    levelTitle: string;
    levelDescription?: string;
    rewards?: string[];
    isMilestone: boolean;
  };
}

export const useLevelUpCelebrations = () => {
  const [celebrationState, setCelebrationState] = useState<LevelUpCelebrationData>({
    visible: false,
    levelUpData: {
      previousLevel: 0,
      newLevel: 0,
      levelTitle: '',
      isMilestone: false,
    },
  });

  const checkAndTriggerLevelUpCelebration = useCallback((xpResult: XPTransactionResult) => {
    if (xpResult.success && xpResult.leveledUp && xpResult.levelUpInfo) {
      setCelebrationState({
        visible: true,
        levelUpData: {
          previousLevel: xpResult.previousLevel,
          newLevel: xpResult.newLevel,
          levelTitle: xpResult.levelUpInfo.newLevelTitle,
          levelDescription: xpResult.levelUpInfo.newLevelDescription,
          ...(xpResult.levelUpInfo.rewards && { rewards: xpResult.levelUpInfo.rewards }),
          isMilestone: xpResult.levelUpInfo.isMilestone,
        },
      });
    }
  }, []);

  const hideCelebration = useCallback(() => {
    setCelebrationState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    celebrationState,
    checkAndTriggerLevelUpCelebration,
    hideCelebration,
  };
};