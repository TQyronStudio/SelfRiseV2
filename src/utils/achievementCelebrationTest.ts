// Achievement Celebration System Test Utility
// Validates celebration modal functionality with different rarity types

import { DeviceEventEmitter } from 'react-native';
import { Achievement, AchievementRarity, AchievementCategory } from '../types/gamification';

// ========================================
// TEST ACHIEVEMENT SAMPLES
// ========================================

const TEST_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'test_common_habit',
    name: 'First Steps',
    description: 'Complete your first habit for the day',
    icon: '👟',
    rarity: AchievementRarity.COMMON,
    category: AchievementCategory.HABITS,
    xpReward: 50,
    isProgressive: false,
    condition: {
      type: 'count',
      target: 1,
      source: 'habit_completion',
      operator: 'gte'
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test_rare_journal',
    name: 'Gratitude Master',
    description: 'Write 10 journal entries in a single day',
    icon: '📝',
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.JOURNAL,
    xpReward: 100,
    isProgressive: false,
    condition: {
      type: 'count',
      target: 10,
      source: 'journal_entry',
      operator: 'gte',
      timeframe: 'daily'
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test_epic_consistency',
    name: 'Consistency Champion',
    description: 'Maintain a 30-day streak across all activities',
    icon: '🔥',
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.CONSISTENCY,
    xpReward: 200,
    isProgressive: false,
    condition: {
      type: 'streak',
      target: 30,
      source: 'all_activities',
      operator: 'gte'
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test_legendary_mastery',
    name: 'Life Transformation',
    description: 'Achieve mastery in all areas of personal growth',
    icon: '👑',
    rarity: AchievementRarity.LEGENDARY,
    category: AchievementCategory.MASTERY,
    xpReward: 500,
    isProgressive: false,
    condition: {
      type: 'value',
      target: 10000,
      source: 'total_xp',
      operator: 'gte'
    },
    isSecret: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ========================================
// TEST FUNCTIONS
// ========================================

/**
 * Test single achievement celebration modal
 */
export const testSingleAchievementCelebration = (rarity: AchievementRarity): void => {
  const testAchievement = TEST_ACHIEVEMENTS.find(a => a.rarity === rarity);
  
  if (!testAchievement) {
    console.error(`No test achievement found for rarity: ${rarity}`);
    return;
  }

  console.log(`🧪 Testing ${rarity} achievement celebration...`);
  
  // Emit achievement unlock event
  DeviceEventEmitter.emit('achievementUnlocked', {
    achievement: testAchievement,
    xpAwarded: testAchievement.xpReward,
    timestamp: Date.now()
  });
  
  console.log(`✅ Emitted event for: ${testAchievement.name} (${rarity})`);
};

/**
 * Test multiple achievements celebration queue
 */
export const testMultipleAchievementCelebrations = (): void => {
  console.log('🧪 Testing multiple achievement celebration queue...');
  
  const achievements = [
    TEST_ACHIEVEMENTS[0], // Common
    TEST_ACHIEVEMENTS[1], // Rare
    TEST_ACHIEVEMENTS[2]  // Epic
  ];
  
  // Emit multiple achievements event
  DeviceEventEmitter.emit('multipleAchievementsUnlocked', {
    count: achievements.length,
    totalXP: achievements.reduce((sum, a) => sum + (a?.xpReward || 0), 0),
    achievements
  });
  
  console.log(`✅ Emitted multiple achievements: ${achievements.length} achievements`);
};

/**
 * Test celebration queue with delay intervals
 */
export const testCelebrationQueueTiming = (): void => {
  console.log('🧪 Testing celebration queue timing (2-second intervals)...');
  
  // Emit achievements with staggered timing
  TEST_ACHIEVEMENTS.forEach((achievement, index) => {
    setTimeout(() => {
      DeviceEventEmitter.emit('achievementUnlocked', {
        achievement,
        xpAwarded: achievement.xpReward,
        timestamp: Date.now()
      });
      console.log(`⏰ Emitted ${achievement.rarity} achievement after ${index * 500}ms`);
    }, index * 500); // 500ms intervals for rapid testing
  });
};

/**
 * Test rarity-specific color theming
 */
export const testRarityColorTheming = (): void => {
  console.log('🧪 Testing rarity-based color theming...');
  
  const rarityColors = {
    [AchievementRarity.COMMON]: '#9E9E9E',    // Gray
    [AchievementRarity.RARE]: '#2196F3',     // Blue  
    [AchievementRarity.EPIC]: '#9C27B0',     // Purple
    [AchievementRarity.LEGENDARY]: '#FFD700' // Gold
  };
  
  Object.entries(rarityColors).forEach(([rarity, expectedColor]) => {
    console.log(`🎨 ${rarity}: Expected color ${expectedColor}`);
  });
  
  // Test each rarity with a 3-second delay between them
  Object.values(AchievementRarity).forEach((rarity, index) => {
    setTimeout(() => {
      testSingleAchievementCelebration(rarity);
      console.log(`🎨 Testing color theme for ${rarity} rarity`);
    }, index * 3000);
  });
};

/**
 * Test celebration modal accessibility features
 */
export const testCelebrationAccessibility = (): void => {
  console.log('🧪 Testing celebration modal accessibility...');
  
  // Test legendary achievement for maximum accessibility features
  const legendaryAchievement = TEST_ACHIEVEMENTS.find(a => a.rarity === AchievementRarity.LEGENDARY);
  
  if (!legendaryAchievement) {
    console.error('No legendary test achievement found');
    return;
  }
  
  DeviceEventEmitter.emit('achievementUnlocked', {
    achievement: legendaryAchievement,
    xpAwarded: legendaryAchievement.xpReward,
    timestamp: Date.now()
  });
  
  console.log('♿ Testing accessibility features:');
  console.log('   - Screen reader announcements');
  console.log('   - High contrast color support');
  console.log('   - Double haptic feedback for legendary');
  console.log('   - Milestone sound effect');
};

/**
 * Comprehensive test suite for achievement celebrations
 */
export const runComprehensiveAchievementCelebrationTest = (): void => {
  console.log('🚀 Starting comprehensive achievement celebration test suite...');
  console.log('');
  
  // Test 1: Individual rarity celebrations (immediate)
  console.log('=== Test 1: Individual Rarity Celebrations ===');
  testSingleAchievementCelebration(AchievementRarity.COMMON);
  
  // Test 2: Multiple achievements (after 5 seconds)
  setTimeout(() => {
    console.log('');
    console.log('=== Test 2: Multiple Achievement Queue ===');
    testMultipleAchievementCelebrations();
  }, 5000);
  
  // Test 3: Queue timing (after 10 seconds)
  setTimeout(() => {
    console.log('');
    console.log('=== Test 3: Celebration Queue Timing ===');
    testCelebrationQueueTiming();
  }, 10000);
  
  // Test 4: Color theming (after 15 seconds)
  setTimeout(() => {
    console.log('');
    console.log('=== Test 4: Rarity Color Theming ===');
    testRarityColorTheming();
  }, 15000);
  
  // Test 5: Accessibility (after 30 seconds)
  setTimeout(() => {
    console.log('');
    console.log('=== Test 5: Accessibility Features ===');
    testCelebrationAccessibility();
  }, 30000);
  
  console.log('');
  console.log('📋 Test suite scheduled. Watch console and UI for results.');
  console.log('⏱️  Total test duration: ~35 seconds');
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Validate celebration modal implementation
 */
export const validateCelebrationModalImplementation = (): { 
  isValid: boolean; 
  issues: string[]; 
  recommendations: string[] 
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check if DeviceEventEmitter is available
  if (!DeviceEventEmitter) {
    issues.push('DeviceEventEmitter not available');
  }
  
  // Validate test achievements
  const rarities = Object.values(AchievementRarity);
  const testRarities = TEST_ACHIEVEMENTS.map(a => a.rarity);
  
  rarities.forEach(rarity => {
    if (!testRarities.includes(rarity)) {
      issues.push(`Missing test achievement for ${rarity} rarity`);
    }
  });
  
  // Recommendations for complete testing
  recommendations.push('Test modal displays with actual achievement unlocks');
  recommendations.push('Verify rarity-based color theming matches design specs');
  recommendations.push('Test celebration queue with 2-second intervals');
  recommendations.push('Validate accessibility features work properly');
  recommendations.push('Check modal animations and haptic feedback');
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

/**
 * Console helper for manual testing
 */
export const celebrationTestHelpers = {
  common: () => testSingleAchievementCelebration(AchievementRarity.COMMON),
  rare: () => testSingleAchievementCelebration(AchievementRarity.RARE),
  epic: () => testSingleAchievementCelebration(AchievementRarity.EPIC),
  legendary: () => testSingleAchievementCelebration(AchievementRarity.LEGENDARY),
  multiple: testMultipleAchievementCelebrations,
  queue: testCelebrationQueueTiming,
  colors: testRarityColorTheming,
  accessibility: testCelebrationAccessibility,
  all: runComprehensiveAchievementCelebrationTest
};

export default {
  testSingleAchievementCelebration,
  testMultipleAchievementCelebrations,
  testCelebrationQueueTiming,
  testRarityColorTheming,
  testCelebrationAccessibility,
  runComprehensiveAchievementCelebrationTest,
  validateCelebrationModalImplementation,
  celebrationTestHelpers
};