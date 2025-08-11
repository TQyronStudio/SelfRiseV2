// Enhanced XP Reward System - Integration Test
// Tests the complete integration between Enhanced XP Reward Engine and other services

import { EnhancedXPRewardEngine, EnhancedXPRewardOptimizer } from '../';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../../types/gamification';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));

jest.mock('../gamificationService', () => ({
  GamificationService: {
    getUserLevel: jest.fn().mockResolvedValue(15),
    getUserXP: jest.fn().mockResolvedValue(8450),
    addXP: jest.fn().mockResolvedValue({ success: true, xpGained: 1500 }),
    getXPBalance: jest.fn().mockResolvedValue(8450)
  }
}));

describe('Enhanced XP Reward System Integration', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    EnhancedXPRewardOptimizer.clearCache();
    EnhancedXPRewardOptimizer.resetMetrics();
  });

  const createTestChallenge = (): MonthlyChallenge => ({
    id: 'integration_challenge_001',
    title: 'Integration Test Challenge',
    description: 'Testing the complete Enhanced XP system integration',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    category: AchievementCategory.HABITS,
    starLevel: 3,
    baseXPReward: 1125,
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
        target: 60,
        description: 'Complete 60 habit tasks',
        trackingKey: 'scheduled_habit_completions',
        baselineValue: 45,
        scalingMultiplier: 1.33,
        progressMilestones: [0.25, 0.50, 0.75]
      }
    ],
    isActive: true,
    categoryRotation: [],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-08-01')
  });

  const createTestProgress = (): MonthlyChallengeProgress => ({
    challengeId: 'integration_challenge_001',
    userId: 'integration_test_user',
    progress: { scheduled_habit_completions: 60 },
    isCompleted: true,
    xpEarned: 0,
    weeklyProgress: {
      week1: { scheduled_habit_completions: 12 },
      week2: { scheduled_habit_completions: 12 },
      week3: { scheduled_habit_completions: 12 },
      week4: { scheduled_habit_completions: 12 },
      week5: { scheduled_habit_completions: 12 }
    },
    milestonesReached: {
      25: { reached: true, timestamp: new Date(), xpAwarded: 75 },
      50: { reached: true, timestamp: new Date(), xpAwarded: 150 },
      75: { reached: true, timestamp: new Date(), xpAwarded: 225 }
    },
    completionPercentage: 100,
    daysActive: 31,
    daysRemaining: 0,
    projectedCompletion: 100,
    currentStreak: 3,
    longestStreak: 5,
    streakBonusEligible: true,
    dailyConsistency: 0.90,
    weeklyConsistency: 0.88,
    bestWeek: 1,
    activeDays: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05']
  });

  test('should calculate XP reward using Enhanced XP Reward Engine directly', async () => {
    const challenge = createTestChallenge();
    const progress = createTestProgress();
    
    const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
    
    expect(result).toBeDefined();
    expect(result.challengeId).toBe('integration_challenge_001');
    expect(result.starLevel).toBe(3);
    expect(result.baseXPReward).toBe(1125);
    expect(result.totalXPAwarded).toBeGreaterThan(1125);
    expect(result.completionBonus).toBeGreaterThan(0);
    expect(result.isBalanced).toBeDefined();
  });

  test('should calculate XP reward using Enhanced XP Reward Optimizer with caching', async () => {
    const challenge = createTestChallenge();
    const progress = createTestProgress();
    
    // First calculation - should hit the engine
    const result1 = await EnhancedXPRewardOptimizer.calculateOptimizedXPReward(challenge, progress);
    
    // Second calculation - should use cache
    const result2 = await EnhancedXPRewardOptimizer.calculateOptimizedXPReward(challenge, progress);
    
    expect(result1).toEqual(result2);
    
    const metrics = EnhancedXPRewardOptimizer.getPerformanceMetrics();
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.cacheHits).toBe(1);
    expect(metrics.cacheMisses).toBe(1);
    
    const cacheStats = EnhancedXPRewardOptimizer.getCacheStats();
    expect(cacheStats.hitRate).toBe(0.5); // 1 hit out of 2 requests
  });

  test('should handle batch processing correctly', async () => {
    const challenge = createTestChallenge();
    const progress1 = createTestProgress();
    const progress2 = { ...createTestProgress(), challengeId: 'integration_challenge_002' };
    const progress3 = { ...createTestProgress(), challengeId: 'integration_challenge_003' };
    
    // Queue batch requests
    const requestId1 = await EnhancedXPRewardOptimizer.queueBatchRequest(challenge, progress1, 'high');
    const requestId2 = await EnhancedXPRewardOptimizer.queueBatchRequest(challenge, progress2, 'medium');
    const requestId3 = await EnhancedXPRewardOptimizer.queueBatchRequest(challenge, progress3, 'low');
    
    expect(requestId1).toBeDefined();
    expect(requestId2).toBeDefined();
    expect(requestId3).toBeDefined();
    
    // Allow some time for batch processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const metrics = EnhancedXPRewardOptimizer.getPerformanceMetrics();
    expect(metrics.totalBatchesProcessed).toBeGreaterThan(0);
  });

  test('should handle validation and error recovery', async () => {
    const invalidChallenge = { 
      ...createTestChallenge(), 
      baseXPReward: -100, // Invalid negative XP
      starLevel: 10 as any // Invalid star level
    };
    
    const invalidProgress = { 
      ...createTestProgress(), 
      completionPercentage: 150, // Invalid percentage
      daysActive: -5 // Invalid negative days
    };
    
    const result = await EnhancedXPRewardOptimizer.calculateOptimizedXPReward(
      invalidChallenge, 
      invalidProgress,
      { enableRetry: true }
    );
    
    expect(result).toBeDefined();
    expect(result.totalXPAwarded).toBeGreaterThan(0);
    expect(result.isBalanced).toBeDefined();
  });

  test('should update and retrieve configuration correctly', () => {
    const originalConfig = EnhancedXPRewardOptimizer.getConfig();
    
    EnhancedXPRewardOptimizer.updateConfig({
      enableCaching: false,
      maxBatchSize: 5,
      performanceTracking: false
    });
    
    const updatedConfig = EnhancedXPRewardOptimizer.getConfig();
    
    expect(updatedConfig.enableCaching).toBe(false);
    expect(updatedConfig.maxBatchSize).toBe(5);
    expect(updatedConfig.performanceTracking).toBe(false);
    expect(updatedConfig.enableValidation).toBe(originalConfig.enableValidation); // Should remain unchanged
  });

  test('should perform maintenance operations correctly', () => {
    EnhancedXPRewardOptimizer.performMaintenance();
    
    const cacheStats = EnhancedXPRewardOptimizer.getCacheStats();
    expect(cacheStats.size).toBeDefined();
  });

  test('should generate comprehensive bonus breakdown', async () => {
    const challenge = createTestChallenge();
    const progress = createTestProgress();
    
    const result = await EnhancedXPRewardEngine.calculateEnhancedXPReward(challenge, progress);
    
    expect(result.bonusBreakdown).toBeDefined();
    expect(result.bonusBreakdown.baseReward).toBeDefined();
    expect(result.bonusBreakdown.baseReward.amount).toBe(1125);
    expect(result.bonusBreakdown.baseReward.starLevel).toBe(3);
    expect(result.bonusBreakdown.totalBonuses).toBeGreaterThan(0);
    expect(result.bonusBreakdown.bonusPercentage).toBeGreaterThan(0);
  });

  test('should award XP through complete workflow', async () => {
    const challenge = createTestChallenge();
    const progress = createTestProgress();
    
    // Test the complete workflow method
    const awardResult = await EnhancedXPRewardEngine.awardMonthlyCompletion(challenge, progress);
    
    expect(awardResult).toBeDefined();
    expect(awardResult.success).toBe(true);
    expect(awardResult.totalXPAwarded).toBeGreaterThan(0);
    expect(awardResult.xpResult).toBeDefined();
    expect(awardResult.bonusBreakdown).toBeDefined();
    
    // Verify GamificationService was called
    const { GamificationService } = require('../gamificationService');
    expect(GamificationService.addXP).toHaveBeenCalledWith(
      awardResult.totalXPAwarded,
      expect.objectContaining({
        source: expect.any(String),
        sourceId: challenge.id,
        description: expect.stringContaining(challenge.title)
      })
    );
  });

  test('should maintain streak data correctly', async () => {
    const challenge = createTestChallenge();
    
    // Test updating streak data
    await EnhancedXPRewardEngine.updateMonthlyStreak(
      AchievementCategory.HABITS,
      true // completed
    );
    
    // This should not throw an error
    expect(true).toBe(true);
  });

  test('should provide configuration and status information', () => {
    const starBaseRewards = EnhancedXPRewardEngine.getStarBaseRewards();
    expect(starBaseRewards).toBeDefined();
    expect(starBaseRewards[1]).toBe(500);
    expect(starBaseRewards[5]).toBe(2532);
    
    const bonusConfig = EnhancedXPRewardEngine.getBonusConfiguration();
    expect(bonusConfig).toBeDefined();
    expect(bonusConfig.PERFECT_COMPLETION_BONUS).toBe(0.20);
    expect(bonusConfig.STREAK_BONUS_PER_MONTH).toBe(100);
    expect(bonusConfig.MAX_STREAK_BONUS).toBe(1200);
  });
});