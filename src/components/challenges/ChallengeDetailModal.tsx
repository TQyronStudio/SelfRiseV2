// Challenge Detail Modal - Show detailed challenge information and progress
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled due to view config issues
import { WeeklyChallenge, ChallengeProgress, AchievementCategory } from '../../types/gamification';

interface ChallengeDetailModalProps {
  challenge: WeeklyChallenge | null;
  progress: ChallengeProgress | null;
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  challenge,
  progress,
  visible,
  onClose
}) => {
  if (!challenge || !progress) return null;

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

  const getDifficultyName = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Easy';
      case 3: return 'Moderate';
      case 4: return 'Hard';
      case 5: return 'Expert';
      default: return 'Unknown';
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

  const getTimeRemaining = () => {
    const endDate = new Date(challenge.endDate + 'T23:59:59');
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Expired';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 7) return `${diffDays} days left`;
    return `${diffDays} days left`;
  };

  const categoryColor = getCategoryColor(challenge.category);
  const completedRequirements = challenge.requirements.filter(req => 
    (progress.progress[req.trackingKey] || 0) >= req.target
  ).length;
  
  const totalRequirements = challenge.requirements.length;
  const overallProgress = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
  const isCompleted = progress.isCompleted || overallProgress >= 100;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View 
          style={[styles.header, { backgroundColor: categoryColor }]}
        >
          <View style={styles.headerContent}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
            
            <View style={styles.headerMain}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(challenge.category)}</Text>
              <View style={styles.headerText}>
                <Text style={styles.title}>{challenge.title}</Text>
                <Text style={styles.category}>
                  {challenge.category.toUpperCase()} • {getDifficultyName(challenge.difficultyLevel)}
                </Text>
                <Text style={styles.difficulty}>
                  {getDifficultyStars(challenge.difficultyLevel)}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerBadges}>
              <View style={styles.xpBadge}>
                <Text style={styles.xpText}>+{challenge.xpReward} XP</Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓ Completed</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Challenge Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Challenge Description</Text>
            <Text style={styles.description}>{challenge.description}</Text>
          </View>

          {/* Time Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Remaining</Text>
            <View style={styles.timeCard}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeRemaining}>{getTimeRemaining()}</Text>
                <Text style={styles.timeDetails}>
                  Ends on {new Date(challenge.endDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Overall Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressPercent}>
                  {Math.round(overallProgress)}%
                </Text>
                <Text style={styles.progressText}>
                  {completedRequirements} of {totalRequirements} completed
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${overallProgress}%`,
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Requirements Detail */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {challenge.requirements.map((requirement, index) => {
              const currentProgress = progress.progress[requirement.trackingKey] || 0;
              const progressPercent = Math.min(100, (currentProgress / requirement.target) * 100);
              const isRequirementCompleted = currentProgress >= requirement.target;

              return (
                <View key={index} style={styles.requirementCard}>
                  <View style={styles.requirementHeader}>
                    <View style={styles.requirementIcon}>
                      <Text style={[
                        styles.requirementStatus,
                        { color: isRequirementCompleted ? categoryColor : '#9CA3AF' }
                      ]}>
                        {isRequirementCompleted ? '✓' : '○'}
                      </Text>
                    </View>
                    
                    <View style={styles.requirementContent}>
                      <Text style={[
                        styles.requirementText,
                        isRequirementCompleted && styles.completedRequirementText
                      ]}>
                        {requirement.description}
                      </Text>
                      
                      <View style={styles.requirementProgress}>
                        <Text style={[
                          styles.requirementNumbers,
                          { color: isRequirementCompleted ? categoryColor : '#6B7280' }
                        ]}>
                          {currentProgress} / {requirement.target}
                        </Text>
                        <Text style={styles.requirementPercent}>
                          ({Math.round(progressPercent)}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.requirementProgressBar}>
                    <View 
                      style={[
                        styles.requirementProgressFill,
                        { 
                          width: `${progressPercent}%`,
                          backgroundColor: isRequirementCompleted ? categoryColor : '#D1D5DB'
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Challenge Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips for Success</Text>
            <View style={styles.tipsCard}>
              {getChallengerTips(challenge.category).map((tip, index) => (
                <View key={index} style={styles.tip}>
                  <Text style={styles.tipIcon}>💡</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reward Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reward</Text>
            <View style={[styles.rewardCard, { borderColor: categoryColor + '30' }]}>
              <View style={[styles.rewardIcon, { backgroundColor: categoryColor + '20' }]}>
                <Text style={[styles.rewardIconText, { color: categoryColor }]}>🎁</Text>
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>
                  {challenge.xpReward} Experience Points
                </Text>
                <Text style={styles.rewardDescription}>
                  Complete all requirements to earn this XP reward and boost your level progress!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const getChallengerTips = (category: AchievementCategory): string[] => {
  switch (category) {
    case 'habits':
      return [
        'Start your day by completing your most important habits',
        'Set reminders to help maintain consistency',
        'Focus on quality over quantity when building new habits'
      ];
    case 'journal':
      return [
        'Write your entries at the same time each day for consistency',
        'Focus on specific things you\'re grateful for, not general statements',
        'Take time to really reflect on why you\'re grateful for each item'
      ];
    case 'goals':
      return [
        'Break large goals into smaller, manageable daily tasks',
        'Track your progress regularly to stay motivated',
        'Celebrate small wins along the way to your bigger goals'
      ];
    case 'consistency':
      return [
        'Use all three features (habits, journal, goals) each day for best results',
        'Set aside dedicated time each day for your self-improvement activities',
        'Build momentum by maintaining your streaks'
      ];
    case 'mastery':
      return [
        'Challenge yourself to exceed minimum requirements',
        'Focus on quality and depth in your activities',
        'Use this challenge to push your limits and grow'
      ];
    default:
      return [
        'Stay consistent with your daily activities',
        'Track your progress regularly',
        'Don\'t give up - small daily actions lead to big results'
      ];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  difficulty: {
    fontSize: 16,
    color: '#FED7AA',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeRemaining: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  timeDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  requirementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  requirementStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 22,
  },
  completedRequirementText: {
    color: '#059669',
    fontWeight: '500',
  },
  requirementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementNumbers: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementPercent: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  requirementProgressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  requirementProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardIconText: {
    fontSize: 20,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default ChallengeDetailModal;