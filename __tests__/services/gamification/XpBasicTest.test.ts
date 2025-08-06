import { XPSourceType } from '../../../src/types/gamification';
import { GamificationService } from '../../../src/services/gamificationService';

describe('XP Basic Test', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
  });

  test('Simple XP addition should work', async () => {
    console.log('=== Starting simple XP test ===');
    
    const initialXP = await GamificationService.getTotalXP();
    console.log('Initial XP:', initialXP);
    
    const result = await GamificationService.addXP(50, { 
      source: XPSourceType.HABIT_COMPLETION,
      metadata: { skipBatching: true } // Skip batching for immediate result
    });
    
    console.log('Add XP result:', result);
    
    const finalXP = await GamificationService.getTotalXP();
    console.log('Final XP:', finalXP);
    
    expect(result.success).toBe(true);
    expect(result.xpGained).toBe(50);
    expect(finalXP).toBe(initialXP + 50);
  });

  test('Batched XP addition should work', async () => {
    console.log('=== Starting batched XP test ===');
    
    const initialXP = await GamificationService.getTotalXP();
    console.log('Initial XP:', initialXP);
    
    const result = await GamificationService.addXPWithBatching(30, { 
      source: XPSourceType.JOURNAL_ENTRY
    });
    
    console.log('Batched add XP result:', result);
    
    // Wait a bit for batch to potentially process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalXP = await GamificationService.getTotalXP();
    console.log('Final XP after batch:', finalXP);
    
    expect(result.success).toBe(true);
    expect(result.xpGained).toBe(30);
  });
});