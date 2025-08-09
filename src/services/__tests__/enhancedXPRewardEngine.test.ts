// Enhanced XP Reward Engine - Comprehensive Test Suite
// Tests for sophisticated star-based XP reward calculation system (500-2532+ XP range)
// Covers completion bonuses, streak bonuses, milestone bonuses, and balance validation

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  EnhancedXPRewardEngine,
  EnhancedXPRewardResult,
  XPBonusBreakdown,
  MonthlyStreakData,
  XPBalanceValidation
} from '../enhancedXPRewardEngine';
import { 
  MonthlyChallenge,
  MonthlyChallengeProgress,
  AchievementCategory,
  XPSourceType
} from '../../types/gamification';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

// Mock GamificationService
jest.mock('../gamificationService', () => ({
  GamificationService: {
    getUserLevel: jest.fn().mockResolvedValue(15),
    getUserXP: jest.fn().mockResolvedValue(8450),
    addXP: jest.fn().mockResolvedValue({ success: true, xpGained: 1500 }),
    getXPBalance: jest.fn().mockResolvedValue(8450)
  }
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('EnhancedXPRewardEngine', () => {
  
  // ========================================
  // TEST SETUP & UTILITIES
  // ========================================

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any internal caches if needed
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  /**
   * Create mock monthly challenge for testing
   */
  const createMockChallenge = (overrides: Partial<MonthlyChallenge> = {}): MonthlyChallenge => ({
    id: 'enhanced_challenge_001',
    title: 'Enhanced Consistency Master',
    description: 'Complete your habits with enhanced XP rewards',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    category: AchievementCategory.HABITS,
    starLevel: 4, // 4-star challenge = 1556 base XP
    baseXPReward: 1556,
    scalingFormula: 'standard',
    generationReason: 'scheduled',
    userBaselineSnapshot: {
      month: '2025-08',
      analysisStartDate: '2025-07-01',
      analysisEndDate: '2025-07-31',
      dataQuality: 'complete',
      totalActiveDays: 28
    },
    requirements: [
      {
        type: 'habits',
        target: 75,
        description: 'Complete 75 habit tasks',
        trackingKey: 'scheduled_habit_completions',
        baselineValue: 55,
        scalingMultiplier: 1.36,
        progressMilestones: [0.25, 0.50, 0.75]
      }
    ],
    isActive: true,
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-01'),
    ...overrides
  });

  /**
   * Create mock progress object for testing
   */
  const createMockProgress = (overrides: Partial<MonthlyChallengeProgress> = {}): MonthlyChallengeProgress => ({
    challengeId: 'enhanced_challenge_001',
    userId: 'test_user_enhanced',
    progress: {
      scheduled_habit_completions: 75 // 100% completion by default
    },
    isCompleted: true,
    xpEarned: 0,
    weeklyProgress: {
      week1: { scheduled_habit_completions: 15 },
      week2: { scheduled_habit_completions: 15 },
      week3: { scheduled_habit_completions: 15 },
      week4: { scheduled_habit_completions: 15 },
      week5: { scheduled_habit_completions: 15 }
    },
    milestonesReached: {
      25: { reached: true, timestamp: new Date('2025-08-08'), xpAwarded: 100 },
      50: { reached: true, timestamp: new Date('2025-08-16'), xpAwarded: 150 },
      75: { reached: true, timestamp: new Date('2025-08-24'), xpAwarded: 200 }
    },
    completionPercentage: 100,
    daysActive: 31,
    daysRemaining: 0,
    projectedCompletion: 100,
    currentStreak: 3,
    longestStreak: 5,
    streakBonusEligible: true,
    dailyConsistency: 0.95,
    weeklyConsistency: 0.92,
    bestWeek: 1,
    // createdAt and updatedAt not in MonthlyChallengeProgress interface
    ...overrides
  });

  /**
   * Create mock streak info for testing
   */
  const createMockStreakInfo = (overrides: Partial<MonthlyStreakData> = {}): MonthlyStreakData => ({
    currentStreak: 3,
    longestStreak: 5,
    totalCompletedMonths: 8,
    lastCompletionMonth: '2025-07',
    streakBonusEligible: true,
    recentHistory: [
      { month: '2025-07', completed: true, completionPercentage: 95, starLevel: 4 },
      { month: '2025-06', completed: true, completionPercentage: 88, starLevel: 3 },
      { month: '2025-05', completed: true, completionPercentage: 92, starLevel: 4 }
    ],
    ...overrides
  });

  // ========================================
  // STAR-BASED XP CALCULATION TESTS
  // ========================================

  describe('Star-Based XP Calculation', () => {
    
    test('should calculate 1-star challenge XP correctly (500 XP base)', async () => {
      const challenge = createMockChallenge({ starLevel: 1, baseXPReward: 500 });
      const progress = createMockProgress({ completionPercentage: 100 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.baseXPReward).toBe(500);
      expect(result.totalXPAwarded).toBeGreaterThanOrEqual(500); // With completion bonus
      expect(result.starLevel).toBe(1);
      expect(result.completionBonus).toBeGreaterThan(0); // 20% completion bonus
    });

    test('should calculate 2-star challenge XP correctly (750 XP base)', async () => {
      const challenge = createMockChallenge({ starLevel: 2, baseXPReward: 750 });
      const progress = createMockProgress({ completionPercentage: 100 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.baseXPReward).toBe(750);
      expect(result.starLevel).toBe(2);
      expect(result.completionBonus).toBe(150); // 20% of 750
    });

    test('should calculate 5-star challenge XP correctly (2532 XP base)', async () => {
      const challenge = createMockChallenge({ starLevel: 5, baseXPReward: 2532 });
      const progress = createMockProgress({ completionPercentage: 100 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.baseXPReward).toBe(2532);
      expect(result.starLevel).toBe(5);
      expect(result.completionBonus).toBe(506); // 20% of 2532 (rounded)
      expect(result.totalXPAwarded).toBeGreaterThan(3000); // With all bonuses
    });
  });

  // ========================================
  // COMPLETION BONUS TESTS
  // ========================================

  describe('Completion Bonus System', () => {
    
    test('should award full 20% completion bonus for 100% completion', async () => {
      const challenge = createMockChallenge({ baseXPReward: 1000 });
      const progress = createMockProgress({ completionPercentage: 100 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.completionBonus).toBe(200); // 20% of 1000
    });

    test('should pro-rate completion bonus for 95% completion', async () => {
      const challenge = createMockChallenge({ baseXPReward: 1000 });
      const progress = createMockProgress({ completionPercentage: 95 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      // Pro-rated: 95% * 20% = 19% bonus = 190 XP
      expect(result.completionBonus).toBe(190);
    });

    test('should pro-rate completion bonus for 80% completion', async () => {
      const challenge = createMockChallenge({ baseXPReward: 1000 });
      const progress = createMockProgress({ completionPercentage: 80 });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      // Pro-rated: 80% * 20% = 16% bonus = 160 XP
      expect(result.completionBonus).toBe(160);
    });

    test('should give no completion bonus for under 70% completion', async () => {
      const challenge = createMockChallenge({ baseXPReward: 1000 });
      const progress = createMockProgress({ completionPercentage: 65, isCompleted: false });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.completionBonus).toBe(0);
    });
  });

  // ========================================
  // STREAK BONUS TESTS
  // ========================================

  describe('Consecutive Monthly Streak Bonus', () => {
    
    test('should calculate streak bonus for 3-month streak', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      const streakInfo = createMockStreakInfo({ currentStreak: 3 });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(300); // 3 months * 100 XP
    });

    test('should calculate streak bonus for 7-month streak', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      const streakInfo = createMockStreakInfo({ currentStreak: 7 });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(700); // 7 months * 100 XP
    });

    test('should cap streak bonus at maximum 12 months', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      const streakInfo = createMockStreakInfo({ currentStreak: 15 }); // Over cap
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(1200); // Capped at 12 months * 100 XP
    });

    test('should give no streak bonus for first month', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      const streakInfo = createMockStreakInfo({ currentStreak: 1, streakBonusEligible: false });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(0);
    });
  });

  // ========================================
  // MILESTONE BONUS TESTS
  // ========================================

  describe('Milestone Bonus System', () => {
    
    test('should calculate milestone bonus for all milestones reached', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress({
        milestonesReached: {
          25: { reached: true, timestamp: new Date(), xpAwarded: 75 },
          50: { reached: true, timestamp: new Date(), xpAwarded: 150 },
          75: { reached: true, timestamp: new Date(), xpAwarded: 225 }
        }
      });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.milestoneBonus).toBe(450); // 75 + 150 + 225
    });

    test('should calculate partial milestone bonus', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress({
        milestonesReached: {
          25: { reached: true, timestamp: new Date(), xpAwarded: 75 },
          50: { reached: true, timestamp: new Date(), xpAwarded: 150 },
          75: { reached: false }
        }
      });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.milestoneBonus).toBe(225); // 75 + 150
    });

    test('should give no milestone bonus if none reached', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress({
        milestonesReached: {
          25: { reached: false },
          50: { reached: false },
          75: { reached: false }
        }
      });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.milestoneBonus).toBe(0);
    });
  });

  // ========================================
  // COMPREHENSIVE SCENARIO TESTS
  // ========================================

  describe('Comprehensive Reward Scenarios', () => {
    
    test('should calculate maximum possible reward (5-star perfect + max bonuses)', async () => {
      const challenge = createMockChallenge({ starLevel: 5, baseXPReward: 2532 });
      const progress = createMockProgress({ 
        completionPercentage: 100,
        dailyConsistency: 0.98,
        weeklyConsistency: 0.96
      });
      const streakInfo = createMockStreakInfo({ currentStreak: 12 });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.totalXPAwarded).toBeGreaterThan(3000);
      expect(result.totalXPAwarded).toBeLessThan(6000); // Reasonable upper bound
    });

    test('should calculate minimum reward scenario (1-star 70% completion)', async () => {
      const challenge = createMockChallenge({ starLevel: 1, baseXPReward: 500 });
      const progress = createMockProgress({ 
        completionPercentage: 70,
        dailyConsistency: 0.65,
        weeklyConsistency: 0.60,
        milestonesReached: {
          25: { reached: false },
          50: { reached: false },
          75: { reached: false }
        }
      });
      const streakInfo = createMockStreakInfo({ currentStreak: 1, streakBonusEligible: false });
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(streakInfo));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.totalXPAwarded).toBeGreaterThan(500);
      expect(result.completionBonus).toBeGreaterThan(0);
      expect(result.streakBonus).toBe(0);
      expect(result.milestoneBonus).toBe(0);
    });
  });

  // ========================================
  // PERFORMANCE & EDGE CASES
  // ========================================

  describe('Performance & Edge Cases', () => {
    
    test('should handle missing streak data gracefully', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(0);
      expect(result.totalXPAwarded).toBeGreaterThan(0);
    });

    test('should handle invalid streak data gracefully', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      
      mockAsyncStorage.getItem.mockResolvedValue('invalid json{');
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.streakBonus).toBe(0);
      expect(result.totalXPAwarded).toBeGreaterThan(0);
    });

    test('should handle extreme values correctly', async () => {
      const challenge = createMockChallenge({ 
        baseXPReward: 10000 // Very high XP
      });
      const progress = createMockProgress({ 
        completionPercentage: 100
      });
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.totalXPAwarded).toBeGreaterThan(0);
      expect(result.totalXPAwarded).toBeLessThan(20000); // Reasonable upper bound
    });

    test('should handle concurrent calculations safely', async () => {
      const challenge = createMockChallenge();
      const progress1 = createMockProgress({ challengeId: 'challenge_1' });
      const progress2 = createMockProgress({ challengeId: 'challenge_2' });
      const progress3 = createMockProgress({ challengeId: 'challenge_3' });
      
      const promises = [
        EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress1),
        EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress2),
        EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress3)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.totalXPAwarded).toBeGreaterThan(0);
        expect(result.isBalanced).toBeDefined();
      });
    });
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  describe('Integration Tests', () => {
    
    test('should integrate with GamificationService correctly', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      
      const { GamificationService } = require('../gamificationService');
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.totalXPAwarded).toBeGreaterThan(0);
      expect(result.isBalanced).toBeDefined();
    });

    test('should handle GamificationService errors gracefully', async () => {
      const challenge = createMockChallenge();
      const progress = createMockProgress();
      
      const { GamificationService } = require('../gamificationService');
      GamificationService.getUserLevel.mockRejectedValue(new Error('Service error'));
      
      const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
      
      expect(result.totalXPAwarded).toBeGreaterThan(0);
    });
  });
});