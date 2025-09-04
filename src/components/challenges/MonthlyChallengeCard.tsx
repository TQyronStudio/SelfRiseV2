// Monthly Challenge Card Component - Display individual monthly challenge with progress
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../../types/gamification';
import { StarRatingService } from '../../services/starRatingService';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';

interface MonthlyChallengeCardProps {
  challenge: MonthlyChallenge;
  progress: MonthlyChallengeProgress;
  onPress?: (challenge: MonthlyChallenge) => void;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const MonthlyChallengeCard: React.FC<MonthlyChallengeCardProps> = ({
  challenge,
  progress,
  onPress,
  compact = false
}) => {
  const completedRequirements = challenge.requirements.filter(req => 
    (progress.progress[req.trackingKey] || 0) >= req.target
  ).length;
  
  const totalRequirements = challenge.requirements.length;
  const overallProgress = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
  const isCompleted = progress.isCompleted || overallProgress >= 100;

  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      case 'mastery': return '#EF4444';
      case 'social': return '#06B6D4';
      case 'special': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const getStarColor = (starLevel: number) => {
    switch (starLevel) {
      case 1: return '#9E9E9E'; // Common/Gray
      case 2: return '#2196F3'; // Rare/Blue
      case 3: return '#9C27B0'; // Epic/Purple
      case 4: return '#FF9800'; // Legendary/Orange
      case 5: return '#FFD700'; // Master/Gold
      default: return '#9E9E9E';
    }
  };

  const getStarRarity = (starLevel: number): string => {
    switch (starLevel) {
      case 1: return 'Common';
      case 2: return 'Rare';
      case 3: return 'Epic';
      case 4: return 'Legendary';
      case 5: return 'Master';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '🎯';
      case 'journal': return '📝';
      case 'goals': return '🏆';
      case 'consistency': return '⚡';
      case 'mastery': return '👑';
      case 'social': return '👥';
      case 'special': return '✨';
      default: return '📋';
    }
  };

  const getDaysRemaining = () => {
    const endDate = new Date(challenge.endDate + 'T23:59:59');
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 0;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getMilestoneProgress = () => {
    const milestones = [25, 50, 75];
    return milestones.map(milestone => ({
      percentage: milestone,
      reached: progress.milestonesReached[milestone as keyof typeof progress.milestonesReached]?.reached || false
    }));
  };

  const categoryColor = getCategoryColor(challenge.category);
  const starColor = getStarColor(challenge.starLevel);
  const daysRemaining = getDaysRemaining();

  const handlePress = () => {
    if (onPress) {
      onPress(challenge);
    }
  };

  if (compact) {
    return (
      <Pressable 
        style={[styles.compactCard, isCompleted && styles.completedCard]}
        onPress={handlePress}
        android_ripple={{ color: categoryColor + '20' }}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>{getCategoryIcon(challenge.category)}</Text>
          <View style={styles.compactContent}>
            <View style={styles.compactTitleRow}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {challenge.title}
              </Text>
              <StarRatingDisplay
                category={challenge.category}
                starLevel={challenge.starLevel}
                size="small"
                showLabel={false}
              />
            </View>
            <View style={styles.compactMeta}>
              <Text style={[styles.compactXP, { color: starColor }]}>
                +{challenge.baseXPReward} XP
              </Text>
              <Text style={styles.compactProgress}>
                {Math.round(overallProgress)}%
              </Text>
              <Text style={styles.compactDays}>
                {daysRemaining}d left
              </Text>
            </View>
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.compactProgressBar}>
          <View 
            style={[
              styles.compactProgressFill, 
              { width: `${overallProgress}%`, backgroundColor: categoryColor }
            ]} 
          />
        </View>

      </Pressable>
    );
  }

  return (
    <Pressable 
      style={[styles.card, isCompleted && styles.completedCard]}
      onPress={handlePress}
      android_ripple={{ color: categoryColor + '20' }}
    >
      <View style={[styles.cardBackground, { backgroundColor: categoryColor + '08' }]}>
        {/* Header with Star Rating */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(challenge.category)}</Text>
            <View>
              <Text style={styles.title}>{challenge.title}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: categoryColor }]}>
                  {challenge.category.toUpperCase()}
                </Text>
                <StarRatingDisplay
                  category={challenge.category}
                  starLevel={challenge.starLevel}
                  size="medium"
                  showLabel={true}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.xpBadge, { backgroundColor: starColor + '20' }]}>
              <Text style={[styles.xpText, { color: starColor }]}>
                +{challenge.baseXPReward} XP
              </Text>
            </View>
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.completedBadgeText}>✓ Month Complete</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{challenge.description}</Text>



        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ends: {new Date(challenge.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          {isCompleted ? (
            <Text style={[styles.completedText, { color: categoryColor }]}>
              Monthly Challenge Completed! 🎉
            </Text>
          ) : (
            <Text style={[styles.footerText, { color: starColor }]}>
              {getStarRarity(challenge.starLevel)} Difficulty • {challenge.starLevel}★
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    minWidth: screenWidth * 0.85,
  },
  completedCard: {
    opacity: 0.85,
  },
  cardBackground: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  xpBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  completedText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Compact styles
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    minWidth: screenWidth * 0.8,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactXP: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactProgress: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactDays: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default MonthlyChallengeCard;