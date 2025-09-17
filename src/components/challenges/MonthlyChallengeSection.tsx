// Monthly Challenge Section Component - Display monthly challenges on Home screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { MonthlyChallengeService } from '../../services/monthlyChallengeService';
import { MonthlyProgressTracker } from '../../services/monthlyProgressTracker';
import { StarRatingService } from '../../services/starRatingService';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../../types/gamification';
import MonthlyChallengeCard from './MonthlyChallengeCard';
import MonthlyChallengeCompletionModal from './MonthlyChallengeCompletionModal';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';

interface MonthlychallengeSectionProps {
  onChallengePress?: (challenge: MonthlyChallenge) => void;
  onViewAllPress?: () => void;
  compact?: boolean;
}

const MonthlyChallengeSection: React.FC<MonthlychallengeSectionProps> = ({
  onChallengePress,
  onViewAllPress,
  compact = false
}) => {
  const [challenge, setChallenge] = useState<MonthlyChallenge | null>(null);
  const [progress, setProgress] = useState<MonthlyChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStarRatings, setUserStarRatings] = useState<Record<AchievementCategory, number>>({
    habits: 1,
    journal: 1,
    goals: 1,
    consistency: 1,
    mastery: 1,
    special: 1,
  });

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  useEffect(() => {
    loadMonthlyChallenge();
    loadUserStarRatings();
  }, []);

  // Real-time progress updates listener
  useEffect(() => {
    if (!challenge) return;
    
    console.log(`🔄 Setting up real-time progress listener for challenge: ${challenge.id}`);
    
    const progressUpdateListener: EmitterSubscription = DeviceEventEmitter.addListener(
      'monthly_progress_updated',
      async (eventData: any) => {
        console.log(`📈 Monthly progress update event received:`, eventData);
        
        // Only update if event is for our current challenge
        if (eventData.challengeId === challenge.id) {
          try {
            // Refresh progress data
            const updatedProgress = await MonthlyProgressTracker.getChallengeProgress(challenge.id);
            if (updatedProgress) {
              console.log(`✅ Real-time progress updated: ${updatedProgress.completionPercentage}%`);
              setProgress(updatedProgress);
            }
          } catch (error) {
            console.error('Failed to refresh progress on real-time update:', error);
          }
        }
      }
    );

    // Cleanup listener on unmount or challenge change
    return () => {
      console.log(`🛑 Cleaning up progress listener for challenge: ${challenge.id}`);
      progressUpdateListener.remove();
    };
  }, [challenge?.id]); // Re-setup listener when challenge changes

  // Completion event listener
  useEffect(() => {
    const completionListener: EmitterSubscription = DeviceEventEmitter.addListener(
      'monthly_challenge_completed',
      (eventData: any) => {
        console.log('🎉 Monthly challenge completed event received:', eventData);

        // Show completion modal
        setCompletionResult(eventData);
        setShowCompletionModal(true);

        // Refresh progress and star ratings
        if (challenge && eventData.challengeId === challenge.id) {
          loadUserStarRatings();
          MonthlyProgressTracker.getChallengeProgress(challenge.id).then(updatedProgress => {
            if (updatedProgress) setProgress(updatedProgress);
          });
        }
      }
    );

    return () => {
      completionListener.remove();
    };
  }, [challenge?.id]);

  const loadUserStarRatings = async () => {
    try {
      const ratingsData = await StarRatingService.getCurrentStarRatings();
      const ratings = {
        habits: ratingsData.habits,
        journal: ratingsData.journal,
        goals: ratingsData.goals,
        consistency: ratingsData.consistency,
        mastery: ratingsData.mastery || 1,
        special: ratingsData.special || 1,
      };
      setUserStarRatings(ratings);
    } catch (error) {
      console.error('MonthlyChallengeSection.loadUserStarRatings error:', error);
      // Use defaults on error
    }
  };

  const loadMonthlyChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current month's challenge
      let currentChallenge = await MonthlyChallengeService.getCurrentChallenge();

      // If no active challenge found, check for completed challenges from this month
      if (!currentChallenge) {
        const currentMonth = new Date().toISOString().substring(0, 7);
        console.log('🔍 No active monthly challenge found, checking for completed challenges...');
        currentChallenge = await MonthlyChallengeService.getChallengeForMonthIncludingCompleted(currentMonth);

        if (currentChallenge) {
          console.log(`✅ Found completed monthly challenge: ${currentChallenge.title}`);
        }
      }

      // Generate if none exists at all
      if (!currentChallenge) {
        console.log('🗓️ No monthly challenge found (active or completed), generating new one...');
        // Create generation context
        const currentMonth = new Date().toISOString().substring(0, 7);
        const context = {
          month: currentMonth,
          userId: 'local_user',
          userBaseline: {} as any, // Will be populated by service
          currentStarRatings: {
            habits: 1,
            journal: 1,
            goals: 1,
            consistency: 1,
            mastery: 1,
            special: 1,
            history: [],
            lastUpdated: new Date(),
          },
          recentCategoryHistory: [],
          isFirstMonth: true,
        };

        const generationResult = await MonthlyChallengeService.generateMonthlyChallenge(context);
        if (generationResult.success) {
          currentChallenge = generationResult.challenge;
        } else {
          throw new Error(generationResult.error || 'Failed to generate monthly challenge');
        }
      }
      
      // Get progress for the challenge
      const challengeProgress = await MonthlyProgressTracker.getChallengeProgress(currentChallenge.id);
      
      setChallenge(currentChallenge);
      setProgress(challengeProgress);
      
      console.log(`✅ Loaded monthly challenge: ${currentChallenge.title}`);
    } catch (error) {
      console.error('MonthlyChallengeSection.loadMonthlyChallenge error:', error);
      setError('Failed to load monthly challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadMonthlyChallenge();
  };

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    }
  };

  const handleChallengePress = () => {
    if (challenge && onChallengePress) {
      onChallengePress(challenge);
    }
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    
    const endDate = new Date(challenge.endDate + 'T23:59:59');
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 0;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMonthName = () => {
    if (!challenge) return '';
    
    return new Date(challenge.startDate).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Challenge</Text>
          <Text style={styles.subtitle}>Loading challenge...</Text>
        </View>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>🗓️ Preparing your monthly challenge...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Challenge</Text>
          <Text style={styles.subtitle}>Error loading challenge</Text>
        </View>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!challenge || !progress) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Challenge</Text>
          <Text style={styles.subtitle}>No active challenge</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>⏳ Challenge preparing</Text>
        </View>
      </View>
    );
  }

  const daysRemaining = getDaysRemaining();
  const monthName = getMonthName();
  const isCompleted = progress.isCompleted || progress.completionPercentage >= 100;
  
  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const categoryColor = getCategoryColor(challenge.category);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <View>
            <Text style={styles.compactTitle}>Monthly Challenge</Text>
            <Text style={styles.compactMonth}>{monthName}</Text>
          </View>
          <Pressable style={styles.compactViewAll} onPress={handleViewAll}>
            <Text style={styles.compactViewAllText}>View</Text>
          </Pressable>
        </View>
        
        <MonthlyChallengeCard
          challenge={challenge}
          progress={progress}
          onPress={handleChallengePress}
          compact={true}
        />
        
        <View style={styles.compactStats}>
          <View style={styles.compactStat}>
            <Text style={styles.compactStatNumber}>{Math.round(progress.completionPercentage)}%</Text>
            <Text style={styles.compactStatLabel}>Complete</Text>
          </View>
          <View style={styles.compactStat}>
            <Text style={styles.compactStatNumber}>{daysRemaining}</Text>
            <Text style={styles.compactStatLabel}>Days Left</Text>
          </View>
          <View style={styles.compactStat}>
            <StarRatingDisplay
              category={challenge.category}
              starLevel={challenge.starLevel}
              size="small"
              showLabel={false}
            />
            <Text style={styles.compactStatLabel}>{challenge.starLevel}★ Level</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Monthly Challenge</Text>
          <Text style={styles.subtitle}>
            {monthName} • {Math.round(progress.completionPercentage)}% complete
          </Text>
        </View>
        
      </View>

      {/* Main Challenge Card */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengeContainer}
        style={styles.challengeScrollView}
      >
        <MonthlyChallengeCard
          challenge={challenge}
          progress={progress}
          onPress={handleChallengePress}
          compact={false}
        />
      </ScrollView>

      {/* Monthly Progress Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Monthly Progress</Text>
          <Text style={[
            styles.summaryPercent,
            { color: isCompleted ? '#22C55E' : categoryColor }
          ]}>
            {Math.round(progress.completionPercentage)}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${progress.completionPercentage}%`,
                backgroundColor: isCompleted ? '#22C55E' : categoryColor
              }
            ]} 
          />
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{progress.daysActive}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{daysRemaining}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: categoryColor }]}>
              {challenge.baseXPReward}
            </Text>
            <Text style={styles.statLabel}>Max XP</Text>
          </View>
        </View>

        {/* Milestone Progress */}
        <View style={styles.milestoneTracker}>
          <Text style={styles.milestoneTitle}>Milestones</Text>
          <View style={styles.milestoneRow}>
            {[25, 50, 75].map(milestone => {
              const reached = progress.milestonesReached[milestone as keyof typeof progress.milestonesReached]?.reached || false;
              return (
                <View key={milestone} style={styles.milestoneItem}>
                  <View 
                    style={[
                      styles.milestoneCircle,
                      { 
                        backgroundColor: reached ? categoryColor : '#E5E7EB',
                        borderColor: reached ? categoryColor : '#D1D5DB'
                      }
                    ]}
                  >
                    {reached && <Text style={styles.milestoneCheck}>✓</Text>}
                  </View>
                  <Text style={[
                    styles.milestoneLabel,
                    { color: reached ? categoryColor : '#9CA3AF' }
                  ]}>
                    {milestone}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Current Streak */}
        {progress.currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {progress.currentStreak} Month Streak</Text>
          </View>
        )}
      </View>

      {/* Star Level Display for All Categories */}
      <View style={styles.starRatingOverview}>
        <Text style={styles.starRatingTitle}>Your Challenge Levels</Text>
        <View style={styles.starRatingGrid}>
          {Object.entries(userStarRatings).map(([category, stars]) => (
            <View key={category} style={styles.starRatingItem}>
              <Text style={styles.starRatingCategory}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              <StarRatingDisplay
                category={category as AchievementCategory}
                starLevel={stars}
                size="small"
                showLabel={false}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Completion Modal */}
      <MonthlyChallengeCompletionModal
        visible={showCompletionModal}
        challenge={challenge}
        completionResult={completionResult}
        onClose={() => {
          setShowCompletionModal(false);
          setCompletionResult(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  challengeScrollView: {
    marginBottom: 16,
  },
  challengeContainer: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryPercent: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  milestoneTracker: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  milestoneCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  starRatingOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  starRatingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  starRatingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  starRatingItem: {
    alignItems: 'center',
    minWidth: '22%',
  },
  starRatingCategory: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackingText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Compact styles
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  compactMonth: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactViewAll: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  compactViewAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  compactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  compactStat: {
    alignItems: 'center',
  },
  compactStatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
});

export default MonthlyChallengeSection;