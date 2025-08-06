// Weekly Challenge Card Component - Display individual challenge with progress
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled due to view config issues
import { WeeklyChallenge, ChallengeProgress, AchievementCategory } from '../../types/gamification';

interface WeeklyChallengeCardProps {
  challenge: WeeklyChallenge;
  progress: ChallengeProgress;
  onPress?: (challenge: WeeklyChallenge) => void;
  compact?: boolean;
}

const WeeklyChallengeCard: React.FC<WeeklyChallengeCardProps> = ({
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

  const getDifficultyStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
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

  const categoryColor = getCategoryColor(challenge.category);

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
            <Text style={styles.compactTitle} numberOfLines={1}>
              {challenge.title}
            </Text>
            <View style={styles.compactMeta}>
              <Text style={styles.compactXP}>+{challenge.xpReward} XP</Text>
              <Text style={styles.compactProgress}>
                {Math.round(overallProgress)}%
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(challenge.category)}</Text>
            <View>
              <Text style={styles.title}>{challenge.title}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: categoryColor }]}>
                  {challenge.category.toUpperCase()}
                </Text>
                <Text style={styles.difficulty}>
                  {getDifficultyStars(challenge.difficultyLevel)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.xpBadge, { backgroundColor: categoryColor + '20' }]}>
              <Text style={[styles.xpText, { color: categoryColor }]}>
                +{challenge.xpReward} XP
              </Text>
            </View>
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{challenge.description}</Text>

        {/* Requirements */}
        <View style={styles.requirementsSection}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          {challenge.requirements.map((requirement, index) => {
            const currentProgress = progress.progress[requirement.trackingKey] || 0;
            const progressPercent = Math.min(100, (currentProgress / requirement.target) * 100);
            const isRequirementCompleted = currentProgress >= requirement.target;

            return (
              <View key={index} style={styles.requirement}>
                <View style={styles.requirementHeader}>
                  <Text style={[
                    styles.requirementText,
                    isRequirementCompleted && styles.completedRequirementText
                  ]}>
                    {isRequirementCompleted ? '✓' : '○'} {requirement.description}
                  </Text>
                  <Text style={[
                    styles.requirementProgress,
                    isRequirementCompleted && { color: categoryColor }
                  ]}>
                    {currentProgress}/{requirement.target}
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${progressPercent}%`,
                          backgroundColor: isRequirementCompleted ? categoryColor : '#D1D5DB'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressTitle}>Overall Progress</Text>
            <Text style={[styles.overallProgressPercent, { color: categoryColor }]}>
              {Math.round(overallProgress)}%
            </Text>
          </View>
          <View style={styles.overallProgressBar}>
            <View 
              style={[
                styles.overallProgressFill,
                { 
                  width: `${overallProgress}%`,
                  backgroundColor: categoryColor
                }
              ]} 
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ends: {challenge.endDate}
          </Text>
          {isCompleted ? (
            <Text style={[styles.completedText, { color: categoryColor }]}>
              Completed! 🎉
            </Text>
          ) : (
            <Text style={styles.footerText}>
              {completedRequirements}/{totalRequirements} completed
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
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  difficulty: {
    fontSize: 14,
    color: '#F59E0B',
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  requirementsSection: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirement: {
    marginBottom: 12,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  completedRequirementText: {
    color: '#059669',
    fontWeight: '500',
  },
  requirementProgress: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  overallProgress: {
    marginBottom: 16,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  overallProgressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
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
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactXP: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  compactProgress: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default WeeklyChallengeCard;