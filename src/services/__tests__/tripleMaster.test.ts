import { MonthlyChallengeService } from '../monthlyChallengeService';
import { MonthlyProgressTracker } from '../monthlyProgressTracker';
import { AchievementCategory } from '../../types';

describe('Triple Master Challenge', () => {
  beforeAll(() => {
    // Mock storage for test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup
    MonthlyProgressTracker.clearAllProgressCache();
  });

  test('should have Triple Master template with correct structure', () => {
    const allTemplates = MonthlyChallengeService.getAllTemplates();
    const consistencyTemplates = allTemplates[AchievementCategory.CONSISTENCY];
    
    const tripleMasterTemplate = consistencyTemplates.find(t => t.id === 'consistency_triple_master');
    
    expect(tripleMasterTemplate).toBeDefined();
    expect(tripleMasterTemplate?.title).toBe('Triple Master');
    expect(tripleMasterTemplate?.description).toBe('Use all three features (habits, journal, goals) every day');
    expect(tripleMasterTemplate?.baselineMetricKey).toBe('tripleFeatureDays');
    expect(tripleMasterTemplate?.requirementTemplates[0].trackingKey).toBe('triple_feature_days');
    expect(tripleMasterTemplate?.baselineMultiplierRange).toEqual([1.05, 1.25]);
  });

  test('should recognize triple_feature_days as daily streak key', () => {
    const isDailyStreak = (MonthlyChallengeService as any).isDailyStreakTrackingKey('triple_feature_days');
    expect(isDailyStreak).toBe(true);
  });

  test('should have complex tracking key handling for triple_feature_days', () => {
    // Test that triple_feature_days matches all XP sources (marked as complex analysis)
    const mockRequirement = { trackingKey: 'triple_feature_days' };
    
    // Mock challenge with triple_feature_days requirement
    const mockChallenge = {
      requirements: [mockRequirement],
      id: 'test_challenge',
      title: 'Test Triple Master'
    } as any;
    
    const relevantReqs = (MonthlyProgressTracker as any).getRelevantRequirements(mockChallenge, 'habit_completion');
    const hasTripleReq = relevantReqs.some((r: any) => r.trackingKey === 'triple_feature_days');
    
    expect(hasTripleReq).toBe(true); // triple_feature_days should match all sources (complex analysis)
  });

  test('should return 0 for triple_feature_days in calculateProgressIncrement', () => {
    const mockRequirement = { trackingKey: 'triple_feature_days' };
    
    const increment = (MonthlyProgressTracker as any).calculateProgressIncrement(
      mockRequirement,
      'habit_completion',
      25
    );
    
    expect(increment).toBe(0); // Should return 0 for complex tracking keys
  });

  test('should have recalculateComplexTrackingKeys method', () => {
    const method = (MonthlyProgressTracker as any).recalculateComplexTrackingKeys;
    expect(method).toBeDefined();
    expect(typeof method).toBe('function');
  });
});