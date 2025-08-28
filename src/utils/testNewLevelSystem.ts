/**
 * Test utility for verifying the new level system with rarity-based naming
 * Tests key milestone levels to ensure proper naming and functionality
 */

import { GamificationService } from '../services/gamificationService';
import { getLevelInfo } from '../services/levelCalculation';

/**
 * Test the new level system by checking key milestone levels
 */
export async function testNewLevelSystem(): Promise<void> {
  console.log('🎯 Testing New Rarity-Based Level System');
  console.log('==========================================');
  
  // Test key levels from each rarity tier
  const testLevels = [
    { level: 1, expectedRarity: 'Common (Grey)', expectedName: 'Novice I' },
    { level: 10, expectedRarity: 'Common (Grey) - MILESTONE', expectedName: 'Beginner V' },
    { level: 21, expectedRarity: 'Rare (Blue)', expectedName: 'Adept I' },
    { level: 25, expectedRarity: 'Rare (Blue) - MILESTONE', expectedName: 'Practitioner V' },
    { level: 41, expectedRarity: 'Epic (Purple)', expectedName: 'Pathfinder I' },
    { level: 50, expectedRarity: 'Epic (Purple) - MILESTONE', expectedName: 'Veteran V' },
    { level: 61, expectedRarity: 'Legendary (Gold)', expectedName: 'Guardian I' },
    { level: 75, expectedRarity: 'Legendary (Gold) - MILESTONE', expectedName: 'Master V' },
    { level: 81, expectedRarity: 'Mythic (Red)', expectedName: 'Elite I' },
    { level: 100, expectedRarity: 'Mythic (Red) - MILESTONE', expectedName: 'Mythic V' }
  ];

  console.log('Testing Level Naming System:');
  console.log('');

  let allTestsPassed = true;

  for (const test of testLevels) {
    try {
      const levelInfo = getLevelInfo(test.level);
      const isCorrectName = levelInfo.title === test.expectedName;
      const status = isCorrectName ? '✅' : '❌';
      
      console.log(`${status} Level ${test.level}: "${levelInfo.title}" (${test.expectedRarity})`);
      
      if (!isCorrectName) {
        console.log(`   Expected: "${test.expectedName}", Got: "${levelInfo.title}"`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log(`❌ Level ${test.level}: ERROR - ${error instanceof Error ? error.message : error}`);
      allTestsPassed = false;
    }
  }

  console.log('');
  console.log('Testing Milestone Detection:');
  console.log('');

  // Test milestone levels
  const milestones = [10, 25, 50, 75, 100];
  for (const level of milestones) {
    try {
      const levelInfo = getLevelInfo(level);
      const isMilestone = levelInfo.isMilestone;
      const status = isMilestone ? '✅' : '❌';
      
      console.log(`${status} Level ${level}: Milestone Detection = ${isMilestone}`);
      
      if (!isMilestone) {
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Level ${level}: Milestone test failed - ${error instanceof Error ? error.message : error}`);
      allTestsPassed = false;
    }
  }

  console.log('');
  console.log('==========================================');
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! New level system is working correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED! Please check the implementation.');
  }
  console.log('==========================================');
}

/**
 * Quick test function that can be called externally
 */
export async function quickLevelTest(): Promise<boolean> {
  try {
    await testNewLevelSystem();
    return true;
  } catch (error) {
    console.error('Level system test failed:', error);
    return false;
  }
}