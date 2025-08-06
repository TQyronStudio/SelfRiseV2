// Challenge Section Component - Display weekly challenges on Home screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { WeeklyChallengeService } from '../../services/weeklyChallengeService';
import { WeeklyChallenge, ChallengeProgress } from '../../types/gamification';
import WeeklyChallengeCard from './WeeklyChallengeCard';

interface ChallengeSectionProps {
  onChallengePress?: (challenge: WeeklyChallenge) => void;
  onViewAllPress?: () => void;
}

const ChallengeSection: React.FC<ChallengeSectionProps> = ({
  onChallengePress,
  onViewAllPress
}) => {
  const [challenges, setChallenges] = useState<Array<WeeklyChallenge & { progress: ChallengeProgress }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate challenges if none exist
      const activeChallenges = await WeeklyChallengeService.getActiveChallenges();
      if (activeChallenges.length === 0) {
        console.log('🎯 No active challenges found, generating new ones...');
        await WeeklyChallengeService.generateWeeklyChallenge();
      }
      
      // Get challenges with progress
      const challengesWithProgress = await WeeklyChallengeService.getCurrentWeekChallenges();
      setChallenges(challengesWithProgress);
      
      console.log(`✅ Loaded ${challengesWithProgress.length} challenges`);
    } catch (error) {
      console.error('ChallengeSection.loadChallenges error:', error);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadChallenges();
  };

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    }
  };

  const handleChallengePress = (challenge: WeeklyChallenge) => {
    if (onChallengePress) {
      onChallengePress(challenge);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Challenges</Text>
          <Text style={styles.subtitle}>Loading challenges...</Text>
        </View>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>🎯 Preparing your challenges...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Challenges</Text>
          <Text style={styles.subtitle}>Error loading challenges</Text>
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

  if (challenges.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Challenges</Text>
          <Text style={styles.subtitle}>No active challenges</Text>
        </View>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>🎯 No challenges available this week</Text>
          <Pressable style={styles.generateButton} onPress={handleRefresh}>
            <Text style={styles.generateButtonText}>Generate Challenges</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const completedCount = challenges.filter(c => c.progress.isCompleted).length;
  const totalCount = challenges.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Weekly Challenges</Text>
          <Text style={styles.subtitle}>
            {completedCount}/{totalCount} completed ({Math.round(overallProgress)}%)
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengesList}
        style={styles.challengesScrollView}
      >
        {challenges.map((challengeWithProgress) => (
          <View key={challengeWithProgress.id} style={styles.challengeCardContainer}>
            <WeeklyChallengeCard
              challenge={challengeWithProgress}
              progress={challengeWithProgress.progress}
              onPress={handleChallengePress}
              compact={false}
            />
          </View>
        ))}
      </ScrollView>

      {/* Weekly Progress Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Weekly Progress</Text>
          <Text style={[
            styles.summaryPercent,
            { color: overallProgress >= 100 ? '#22C55E' : '#3B82F6' }
          ]}>
            {Math.round(overallProgress)}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${overallProgress}%`,
                backgroundColor: overallProgress >= 100 ? '#22C55E' : '#3B82F6'
              }
            ]} 
          />
        </View>
        
        <View style={styles.summaryStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{totalCount - completedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {challenges.reduce((total, c) => total + c.xpReward, 0)}
            </Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>
      </View>
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
  headerRight: {
    marginLeft: 16,
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
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  challengesScrollView: {
    marginBottom: 16,
  },
  challengesList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  challengeCardContainer: {
    width: 280,
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
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChallengeSection;