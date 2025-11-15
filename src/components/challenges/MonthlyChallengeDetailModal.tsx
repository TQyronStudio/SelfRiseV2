// Monthly Challenge Detail Modal - Show detailed monthly challenge information and progress
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../../types/gamification';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';
import MonthlyProgressCalendar from './MonthlyProgressCalendar';
import { BeginnerTargetFixer } from '../../utils/fixBeginnerTargetText';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface MonthlyChallengeDetailModalProps {
  challenge: MonthlyChallenge | null;
  progress: MonthlyChallengeProgress | null;
  visible: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'calendar' | 'tips';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MonthlyChallengeDetailModal: React.FC<MonthlyChallengeDetailModalProps> = ({
  challenge,
  progress: initialProgress,
  visible,
  onClose
}) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [progress, setProgress] = useState<MonthlyChallengeProgress | null>(initialProgress);

  // Initialize progress state when props change
  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  // Fix "Beginner-friendly target" text in stored challenge data when modal opens
  useEffect(() => {
    if (visible && challenge) {
      BeginnerTargetFixer.fixBeginnerTargetText().catch(console.error);
    }
  }, [visible, challenge?.id]);

  // Modal now receives real-time progress updates from parent (home screen)
  // No need for separate listener - parent manages the real-time updates
  useEffect(() => {
    if (visible && progress) {
      console.log(`🔄 [MODAL] Progress received from parent:`, {
        completionPercentage: progress.completionPercentage,
        daysActive: progress.daysActive,
        progressKeys: Object.keys(progress.progress || {})
      });
    }
  }, [visible, progress?.completionPercentage, progress?.daysActive]);

  if (!challenge || !progress) return null;

  // Clean up any "Beginner-friendly target" text from challenge requirements
  const cleanedChallenge = {
    ...challenge,
    requirements: challenge.requirements.map(req => ({
      ...req,
      description: req.description
        .replace(/\(?\s*beginner-?friendly\s+target\s*\)?/gi, '')
        .replace(/\(?\s*beginner\s+friendly\s+target\s*\)?/gi, '')
        .replace(/beginner-?friendly\s+target/gi, 'target')
        .replace(/beginner\s+friendly\s+target/gi, 'target')
        .replace(/\s+/g, ' ')
        .trim()
    }))
  };

  // Use cleaned challenge for display
  const displayChallenge = cleanedChallenge;

  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
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
      default: return '📋';
    }
  };

  const getDaysRemaining = () => {
    const endDate = new Date(displayChallenge.endDate + 'T23:59:59');
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 0;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTotalDays = () => {
    const startDate = new Date(displayChallenge.startDate);
    const endDate = new Date(displayChallenge.endDate);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getMilestoneProgress = () => {
    return [
      {
        percentage: 25,
        reached: progress.milestonesReached[25]?.reached || false,
        timestamp: progress.milestonesReached[25]?.timestamp,
        xpAwarded: progress.milestonesReached[25]?.xpAwarded || 0,
      },
      {
        percentage: 50,
        reached: progress.milestonesReached[50]?.reached || false,
        timestamp: progress.milestonesReached[50]?.timestamp,
        xpAwarded: progress.milestonesReached[50]?.xpAwarded || 0,
      },
      {
        percentage: 75,
        reached: progress.milestonesReached[75]?.reached || false,
        timestamp: progress.milestonesReached[75]?.timestamp,
        xpAwarded: progress.milestonesReached[75]?.xpAwarded || 0,
      },
    ];
  };


  const categoryColor = getCategoryColor(displayChallenge.category);
  const starColor = getStarColor(displayChallenge.starLevel);
  const daysRemaining = getDaysRemaining();
  const totalDays = getTotalDays();
  const isCompleted = progress.isCompleted || progress.completionPercentage >= 100;

  const completedRequirements = displayChallenge.requirements.filter(req =>
    (progress.progress[req.trackingKey] || 0) >= req.target
  ).length;

  // Create inline styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
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
      color: colors.cardBackgroundElevated,
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
      color: colors.cardBackgroundElevated,
      marginBottom: 8,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    category: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    headerBadges: {
      flexDirection: 'row',
      gap: 12,
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
      backgroundColor: 'rgba(34, 197, 94, 0.9)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    completedBadgeText: {
      color: colors.cardBackgroundElevated,
      fontSize: 14,
      fontWeight: 'bold',
    },
    tabContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabScrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    tabButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.border,
    },
    activeTabButton: {
      // backgroundColor will be set dynamically
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabButtonText: {
      // color will be set dynamically
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
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    timeCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },
    timeItem: {
      alignItems: 'center',
    },
    timeNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    timeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    timeDetails: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    requirementCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
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
      color: colors.textSecondary,
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
      marginBottom: 6,
    },
    requirementNumbers: {
      fontSize: 14,
      fontWeight: '600',
    },
    requirementPercent: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    requirementProgressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    requirementProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    tipsCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
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
      color: colors.textSecondary,
      lineHeight: 20,
    },
    strategyCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    strategyText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    strategyHighlight: {
      fontWeight: '600',
    },
    rewardCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
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
      color: colors.text,
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 4,
    },
    rewardBonus: {
      fontSize: 12,
      color: '#F59E0B',
      fontWeight: '600',
    },
  });

  const renderTabButton = (tab: TabType, label: string) => (
    <Pressable
      key={tab}
      style={[
        styles.tabButton,
        activeTab === tab && [styles.activeTabButton, { backgroundColor: categoryColor + '20' }]
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && [styles.activeTabButtonText, { color: categoryColor }]
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderOverviewTab = () => (
    <View>
      {/* Challenge Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionDescription')}</Text>
        <Text style={styles.description}>{displayChallenge.description}</Text>
      </View>

      {/* Time Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionTimeline')}</Text>
        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{daysRemaining}</Text>
              <Text style={styles.timeLabel}>{t('challenges.detail.labelDaysRemaining')}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{progress.daysActive}</Text>
              <Text style={styles.timeLabel}>{t('challenges.detail.labelActiveDays')}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{totalDays}</Text>
              <Text style={styles.timeLabel}>{t('challenges.detail.labelTotalDays')}</Text>
            </View>
          </View>
          <Text style={styles.timeDetails}>
            {new Date(displayChallenge.startDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric'
            })} - {new Date(displayChallenge.endDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

      {/* Requirements Progress (moved from Progress tab) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionRequirements')}</Text>
        {displayChallenge.requirements.map((requirement, index) => {
          const currentProgress = progress.progress[requirement.trackingKey] || 0;
          const progressPercent = Math.min(100, (currentProgress / requirement.target) * 100);
          const isRequirementCompleted = currentProgress >= requirement.target;

          return (
            <View key={index} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <View style={styles.requirementIcon}>
                  <Text style={[
                    styles.requirementStatus,
                    { color: isRequirementCompleted ? categoryColor : colors.textSecondary }
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
                      { color: isRequirementCompleted ? categoryColor : colors.textSecondary }
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
                      backgroundColor: isRequirementCompleted ? categoryColor : colors.border
                    }
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

    </View>
  );


  const renderCalendarTab = () => (
    <View>
      <MonthlyProgressCalendar
        challenge={displayChallenge}
        progress={progress}
        compact={false}
      />
    </View>
  );

  const renderTipsTab = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionTips')}</Text>
        <View style={styles.tipsCard}>
          {getMonthlyChallengeTips(displayChallenge.category).map((tip, index) => (
            <View key={index} style={styles.tip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Challenge Strategy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionStrategy')}</Text>
        <View style={styles.strategyCard}>
          <Text style={styles.strategyText}>
            This is a <Text style={[styles.strategyHighlight, { color: starColor }]}>
              {getStarRarity(displayChallenge.starLevel)} ({displayChallenge.starLevel}★)
            </Text> difficulty challenge designed to help you grow consistently.
          </Text>
          <Text style={styles.strategyText}>
            Complete this challenge to advance to the next star level and unlock higher XP rewards!
          </Text>
        </View>
      </View>

      {/* Reward Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('challenges.detail.sectionRewards')}</Text>
        <View style={[styles.rewardCard, { borderColor: categoryColor + '30' }]}>
          <View style={[styles.rewardIcon, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.rewardIconText, { color: categoryColor }]}>🎁</Text>
          </View>
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle}>
              {displayChallenge.baseXPReward} Experience Points
            </Text>
            <Text style={styles.rewardDescription}>
              {t('challenges.detail.rewardDescription')}
            </Text>
            {progress.currentStreak > 0 && (
              <Text style={styles.rewardBonus}>
                🔥 Streak Bonus: +{progress.currentStreak * 100} XP for {progress.currentStreak} month streak
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'calendar':
        return renderCalendarTab();
      case 'tips':
        return renderTipsTab();
      default:
        return renderOverviewTab();
    }
  };

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
              <Text style={styles.categoryIcon}>{getCategoryIcon(displayChallenge.category)}</Text>
              <View style={styles.headerText}>
                <Text style={styles.title}>{displayChallenge.title}</Text>
                <View style={styles.headerMeta}>
                  <Text style={styles.category}>
                    {displayChallenge.category.toUpperCase()}
                  </Text>
                  <StarRatingDisplay
                    category={displayChallenge.category}
                    starLevel={displayChallenge.starLevel}
                    size="medium"
                    showLabel={true}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.headerBadges}>
              <View style={[styles.xpBadge, { backgroundColor: starColor + '20' }]}>
                <Text style={[styles.xpText, { color: colors.cardBackgroundElevated }]}>
                  +{displayChallenge.baseXPReward} XP
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{t('challenges.detail.completed')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {renderTabButton('overview', t('challenges.detail.tabOverview'))}
            {renderTabButton('calendar', t('challenges.detail.tabCalendar'))}
            {renderTabButton('tips', t('challenges.detail.tabTips'))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const getMonthlyChallengeTips = (category: AchievementCategory): string[] => {
  switch (category) {
    case 'habits':
      return [
        'Focus on consistency over perfection - aim to complete your habits daily',
        'Use habit stacking: link new habits to existing routines',
        'Track your progress daily to maintain momentum throughout the month',
        'Prepare for obstacles by having backup plans for difficult days',
        'Celebrate small wins along the way to stay motivated'
      ];
    case 'journal':
      return [
        'Write your entries at the same time each day to build consistency',
        'Be specific in your gratitude - focus on particular moments and people',
        'Use the bonus entries to explore deeper reflections and insights',
        'Keep your journal accessible so you can write whenever inspiration strikes',
        'Review past entries weekly to see your growth and patterns'
      ];
    case 'goals':
      return [
        'Break down monthly goals into weekly and daily milestones',
        'Set aside dedicated time each day for goal-related activities',
        'Track your progress regularly to stay on course',
        'Adjust your approach if you\'re falling behind - flexibility is key',
        'Connect with your deeper "why" to maintain motivation'
      ];
    case 'consistency':
      return [
        'Use all three features (habits, journal, goals) each day for maximum impact',
        'Create a daily routine that incorporates all your self-improvement activities',
        'Set up reminders and notifications to maintain consistency',
        'Build streaks gradually - focus on not breaking the chain',
        'Plan for weekends and holidays to maintain your routine'
      ];
    default:
      return [
        'Stay consistent with your daily activities throughout the month',
        'Track your progress regularly and adjust your approach as needed',
        'Don\'t give up if you have a bad day - get back on track immediately',
        'Focus on building sustainable habits rather than short-term bursts',
        'Remember that small daily actions lead to significant monthly results'
      ];
  }
};

export default MonthlyChallengeDetailModal;