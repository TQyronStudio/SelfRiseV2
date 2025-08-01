/**
 * Test utility for simulating level-ups in development
 * This file helps test the level-up celebration system
 */

import { GamificationService } from '../services/gamificationService';
import { XPSourceType } from '../types/gamification';

/**
 * Add enough XP to trigger a level-up for testing
 */
export async function simulateLevelUp(): Promise<void> {
  try {
    console.log('>ê Starting level-up simulation...');
    
    // Get current stats
    const currentTotal = await GamificationService.getTotalXP();
    console.log(`Current XP: ${currentTotal}`);
    
    // Add a large amount of XP to trigger level-up
    const result = await GamificationService.addXP(500, {
      source: XPSourceType.JOURNAL_ENTRY,
      description: 'Test level-up simulation',
      skipLimits: true, // Skip daily limits for testing
    });
    
    console.log('Level-up simulation result:', {
      success: result.success,
      xpGained: result.xpGained,
      totalXP: result.totalXP,
      previousLevel: result.previousLevel,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      milestoneReached: result.milestoneReached,
      levelUpInfo: result.levelUpInfo,
    });
    
    if (result.leveledUp) {
      console.log('<‰ Level-up triggered successfully!');
      
      // Check level-up history
      const recentLevelUps = await GamificationService.getRecentLevelUps(3);
      console.log('Recent level-ups:', recentLevelUps);
    } else {
      console.log('9 No level-up occurred. Current level may be too high for 500 XP.');
    }
    
  } catch (error) {
    console.error('Error in level-up simulation:', error);
  }
}

/**
 * Reset XP to a low amount for testing level-ups
 */
export async function resetXPForTesting(): Promise<void> {
  try {
    console.log('>ù Resetting gamification data for testing...');
    await GamificationService.resetAllData();
    console.log(' Gamification data reset complete');
  } catch (error) {
    console.error('Error resetting XP:', error);
  }
}

/**
 * Add XP gradually to test multiple level-ups
 */
export async function simulateGradualProgress(): Promise<void> {
  try {
    console.log('=È Starting gradual progress simulation...');
    
    // Add XP in smaller increments to see multiple level-ups
    for (let i = 0; i < 5; i++) {
      const result = await GamificationService.addXP(200, {
        source: XPSourceType.HABIT_COMPLETION,
        description: `Gradual progress test ${i + 1}`,
        skipLimits: true,
      });
      
      if (result.leveledUp) {
        console.log(`<‰ Level-up ${i + 1}: ${result.previousLevel} ’ ${result.newLevel}`);
      }
      
      // Small delay between additions
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(' Gradual progress simulation complete');
  } catch (error) {
    console.error('Error in gradual progress simulation:', error);
  }
}