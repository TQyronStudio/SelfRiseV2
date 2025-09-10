import { MonthlyChallengeService } from '../monthlyChallengeService';
import { MonthlyProgressTracker } from '../monthlyProgressTracker';
import { AchievementCategory } from '../../types';

describe('Perfect Month Challenge', () => {
  beforeAll(() => {
    // Mock storage for test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    MonthlyProgressTracker.clearAllProgressCache();
  });

  test('should have Perfect Month template with correct structure', () => {
    const allTemplates = MonthlyChallengeService.getAllTemplates();
    const consistencyTemplates = allTemplates[AchievementCategory.CONSISTENCY];
    
    const perfectMonthTemplate = consistencyTemplates.find(t => t.id === 'consistency_perfect_month');
    
    expect(perfectMonthTemplate).toBeDefined();
    expect(perfectMonthTemplate?.title).toBe('Perfect Month');
    expect(perfectMonthTemplate?.description).toBe('Achieve daily minimums (1+ habits, 3+ journal entries) consistently');
    expect(perfectMonthTemplate?.baselineMetricKey).toBe('perfectDays');
    expect(perfectMonthTemplate?.requirementTemplates[0].trackingKey).toBe('perfect_days');
    expect(perfectMonthTemplate?.baselineMultiplierRange).toEqual([1.15, 1.35]);
    expect(perfectMonthTemplate?.starLevelRequirements.minLevel).toBe(3);
    expect(perfectMonthTemplate?.priority).toBe(90);
  });

  test('should recognize perfect_days as daily streak key', () => {
    const isDailyStreak = (MonthlyChallengeService as any).isDailyStreakTrackingKey('perfect_days');
    expect(isDailyStreak).toBe(true);
  });

  test('should have complex tracking key handling for perfect_days', () => {
    // Test that perfect_days matches all XP sources (marked as complex analysis)
    const mockRequirement = { trackingKey: 'perfect_days' };
    
    // Mock challenge with perfect_days requirement
    const mockChallenge = {
      requirements: [mockRequirement],
      id: 'test_challenge',
      title: 'Test Perfect Month'
    } as any;
    
    const relevantReqs = (MonthlyProgressTracker as any).getRelevantRequirements(mockChallenge, 'habit_completion');
    const hasPerfectReq = relevantReqs.some((r: any) => r.trackingKey === 'perfect_days');
    
    expect(hasPerfectReq).toBe(true); // perfect_days should match all sources (complex analysis)
  });

  test('should return 0 for perfect_days in calculateProgressIncrement', () => {
    const mockRequirement = { trackingKey: 'perfect_days' };
    
    const increment = (MonthlyProgressTracker as any).calculateProgressIncrement(
      mockRequirement,
      'habit_completion',
      25
    );
    
    expect(increment).toBe(0); // Should return 0 for complex tracking keys
  });

  test('should handle perfect_days in recalculateComplexTrackingKeys method', async () => {
    // Mock snapshots with perfect days
    const mockSnapshots = [
      { challengeId: 'test_challenge', isPerfectDay: true, date: '2025-01-01' },
      { challengeId: 'test_challenge', isPerfectDay: false, date: '2025-01-02' },
      { challengeId: 'test_challenge', isPerfectDay: true, date: '2025-01-03' },
      { challengeId: 'other_challenge', isPerfectDay: true, date: '2025-01-04' } // Different challenge
    ];
    
    // Mock the getAllSnapshots method properly as a static method
    const originalGetAllSnapshots = (MonthlyProgressTracker as any).getAllSnapshots;
    (MonthlyProgressTracker as any).getAllSnapshots = jest.fn().mockResolvedValue(mockSnapshots);
    
    const mockChallenge = {
      id: 'test_challenge',
      title: 'Test Perfect Month',
      requirements: [{ trackingKey: 'perfect_days' }]
    } as any;
    
    const mockProgress = {
      progress: { 'perfect_days': 0 }
    } as any;
    
    try {
      await (MonthlyProgressTracker as any).recalculateComplexTrackingKeys(mockChallenge, mockProgress);
      
      // Should count 2 perfect days for this challenge (excluding other challenge)
      expect(mockProgress.progress['perfect_days']).toBe(2);
    } finally {
      // Restore original method
      (MonthlyProgressTracker as any).getAllSnapshots = originalGetAllSnapshots;
    }
  });

  test('should distinguish Perfect Month requirements from Triple Master', () => {
    const allTemplates = MonthlyChallengeService.getAllTemplates();
    const consistencyTemplates = allTemplates[AchievementCategory.CONSISTENCY];
    
    const perfectMonthTemplate = consistencyTemplates.find(t => t.id === 'consistency_perfect_month');
    const tripleMasterTemplate = consistencyTemplates.find(t => t.id === 'consistency_triple_master');
    
    // Perfect Month should be higher level (more advanced)
    expect(perfectMonthTemplate?.starLevelRequirements.minLevel).toBe(3);
    expect(tripleMasterTemplate?.starLevelRequirements.minLevel).toBe(2);
    
    // Different tracking keys
    expect(perfectMonthTemplate?.requirementTemplates[0].trackingKey).toBe('perfect_days');
    expect(tripleMasterTemplate?.requirementTemplates[0].trackingKey).toBe('triple_feature_days');
    
    // Different baseline metrics
    expect(perfectMonthTemplate?.baselineMetricKey).toBe('perfectDays');
    expect(tripleMasterTemplate?.baselineMetricKey).toBe('tripleFeatureDays');
  });

  test('should have appropriate bonus XP conditions', () => {
    const allTemplates = MonthlyChallengeService.getAllTemplates();
    const consistencyTemplates = allTemplates[AchievementCategory.CONSISTENCY];
    
    const perfectMonthTemplate = consistencyTemplates.find(t => t.id === 'consistency_perfect_month');
    
    expect(perfectMonthTemplate?.bonusXPConditions).toContain('Perfect day achievement (+50 XP per day)');
    expect(perfectMonthTemplate?.bonusXPConditions).toContain('Perfect week bonus (+200 XP per week)');
    expect(perfectMonthTemplate?.bonusXPConditions).toContain('Flawless month (+500 XP for 100%)');
    expect(perfectMonthTemplate?.baseXPReward).toBe(675);
  });
});