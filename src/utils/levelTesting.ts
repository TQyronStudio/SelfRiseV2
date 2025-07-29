// Level calculation testing utilities
import { 
  getXPRequiredForLevel, 
  getCurrentLevel, 
  getXPProgress, 
  getLevelInfo,
  validateProgressionTimeline,
  generateLevelPreview 
} from '../services/levelCalculation';

/**
 * Run comprehensive tests on the level calculation system
 * Use this to verify mathematical correctness and balance
 */
export function runLevelCalculationTests(): {
  success: boolean;
  results: any;
  errors: string[];
} {
  const errors: string[] = [];
  const results: any = {};

  try {
    console.log('🧪 Running Level Calculation Tests...\n');

    // Test 1: Basic XP requirements
    console.log('📊 Test 1: Basic XP Requirements');
    const basicLevels = [1, 2, 5, 10, 25, 50, 100];
    results.basicXPRequirements = {};
    
    basicLevels.forEach(level => {
      const xp = getXPRequiredForLevel(level);
      results.basicXPRequirements[level] = xp;
      console.log(`Level ${level}: ${xp.toLocaleString()} XP`);
    });

    // Test 2: Level progression consistency
    console.log('\n🔄 Test 2: Level Progression Consistency');
    for (let level = 1; level <= 20; level++) {
      const currentXP = getXPRequiredForLevel(level);
      const previousXP = getXPRequiredForLevel(level - 1);
      
      if (currentXP <= previousXP) {
        errors.push(`Level ${level} XP (${currentXP}) is not greater than level ${level-1} XP (${previousXP})`);
      }
    }
    console.log(errors.length === 0 ? '✅ All levels have increasing XP requirements' : `❌ ${errors.length} consistency errors`);

    // Test 3: Current level calculation
    console.log('\n🎯 Test 3: Current Level Calculation');
    const testXPValues = [0, 50, 100, 250, 500, 1000, 5000, 10000];
    results.levelCalculations = {};
    
    testXPValues.forEach(xp => {
      const level = getCurrentLevel(xp);
      const requiredForLevel = getXPRequiredForLevel(level);
      const requiredForNext = getXPRequiredForLevel(level + 1);
      
      results.levelCalculations[xp] = { level, requiredForLevel, requiredForNext };
      console.log(`${xp} XP → Level ${level} (needs ${requiredForLevel}, next at ${requiredForNext})`);
      
      // Validate that XP falls in correct range
      if (xp < requiredForLevel || (level > 0 && xp >= requiredForNext)) {
        errors.push(`XP ${xp} incorrectly mapped to level ${level}`);
      }
    });

    // Test 4: XP Progress calculation
    console.log('\n📊 Test 4: XP Progress Calculation');
    results.progressCalculations = {};
    
    [150, 300, 1000].forEach(xp => {
      const progress = getXPProgress(xp);
      results.progressCalculations[xp] = progress;
      console.log(`${xp} XP → Level ${progress.currentLevel}, ${progress.xpProgress}% to next, needs ${progress.xpToNextLevel} more`);
      
      // Validate progress percentage
      if (progress.xpProgress < 0 || progress.xpProgress > 100) {
        errors.push(`Invalid progress percentage: ${progress.xpProgress}% for ${xp} XP`);
      }
    });

    // Test 5: Phase transitions
    console.log('\n🔄 Test 5: Phase Transitions');
    const phaseTransitions = [10, 11, 25, 26, 50, 51]; // Around phase boundaries
    results.phaseTransitions = {};
    
    phaseTransitions.forEach(level => {
      const info = getLevelInfo(level);
      const xpFromPrevious = info.xpFromPrevious;
      results.phaseTransitions[level] = { 
        title: info.title, 
        phase: info.description, 
        xpFromPrevious,
        isMilestone: info.isMilestone 
      };
      console.log(`Level ${level}: ${info.title} (${xpFromPrevious} XP from previous) ${info.isMilestone ? '🏆' : ''}`);
    });

    // Test 6: Timeline validation
    console.log('\n⏱️ Test 6: 5-Year Timeline Validation');
    const timelineValidation = validateProgressionTimeline();
    results.timelineValidation = timelineValidation;
    
    console.log(`Validation: ${timelineValidation.isValid ? '✅ PASSED' : '❌ FAILED'}`);
    if (timelineValidation.issues.length > 0) {
      console.log('Issues found:');
      timelineValidation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
        errors.push(issue);
      });
    }
    
    console.log('\nUser Type Scenarios:');
    timelineValidation.scenarios.forEach(scenario => {
      console.log(`${scenario.userType}: Level ${scenario.levelAfter1Year} after 1 year, Level ${scenario.levelAfter5Years} after 5 years`);
      console.log(`  Time to Level 50: ${Math.round(scenario.timeToLevel50/365*10)/10} years, Level 100: ${Math.round(scenario.timeToLevel100/365*10)/10} years`);
    });

    // Test 7: Mathematical model validation
    console.log('\n🧮 Test 7: Mathematical Model Validation');
    
    // Check for reasonable growth rates
    const level10XP = getXPRequiredForLevel(10);
    const level20XP = getXPRequiredForLevel(20);
    const level50XP = getXPRequiredForLevel(50);
    
    const growth10to20 = level20XP / level10XP;
    const growth20to50 = level50XP / level20XP;
    
    results.growthRates = { growth10to20, growth20to50 };
    console.log(`Growth rate Level 10→20: ${growth10to20.toFixed(2)}x`);
    console.log(`Growth rate Level 20→50: ${growth20to50.toFixed(2)}x`);
    
    // Reasonable growth should be 2-10x per phase
    if (growth10to20 < 2 || growth10to20 > 10) {
      errors.push(`Unusual growth rate 10→20: ${growth10to20.toFixed(2)}x`);
    }
    if (growth20to50 < 2 || growth20to50 > 20) {
      errors.push(`Unusual growth rate 20→50: ${growth20to50.toFixed(2)}x`);
    }

    console.log('\n📋 Test Summary:');
    console.log(`Total Tests: 7`);
    console.log(`Errors Found: ${errors.length}`);
    console.log(`Status: ${errors.length === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Test execution failed: ${errorMessage}`);
    
    return {
      success: false,
      results: {},
      errors
    };
  }
}

/**
 * Generate a human-readable level progression table
 * Useful for documentation and balance review
 */
export function generateLevelTable(maxLevel: number = 30): string {
  const preview = generateLevelPreview(maxLevel);
  
  let table = 'Level | XP Required | XP from Prev | Title | Phase | Milestone\n';
  table += '------|-------------|--------------|-------|-------|----------\n';
  
  preview.forEach(level => {
    const milestone = level.isMilestone ? '🏆' : '';
    table += `${level.level.toString().padStart(5)} | ${level.xpRequired.toLocaleString().padStart(11)} | ${level.xpFromPrevious.toLocaleString().padStart(12)} | ${level.title.padEnd(12)} | ${level.phase.padEnd(8)} | ${milestone}\n`;
  });
  
  return table;
}

/**
 * Quick test function for development
 * Run this to quickly check if level calculations are working
 */
export function quickLevelTest(): void {
  console.log('🚀 Quick Level Test\n');
  
  // Test some key scenarios
  const scenarios = [
    { description: 'New user', xp: 0 },
    { description: 'First level', xp: 100 },
    { description: 'Active user (1 month)', xp: 1000 },
    { description: 'Regular user (3 months)', xp: 5000 },
    { description: 'Power user (1 year)', xp: 50000 },
  ];
  
  scenarios.forEach(scenario => {
    const level = getCurrentLevel(scenario.xp);
    const progress = getXPProgress(scenario.xp);
    const info = getLevelInfo(level);
    
    console.log(`${scenario.description}: ${scenario.xp} XP`);
    console.log(`  → Level ${level}: ${info.title}`);
    console.log(`  → Progress: ${progress.xpProgress}% to Level ${level + 1}`);
    console.log(`  → Needs: ${progress.xpToNextLevel} more XP`);
    console.log('');
  });
}