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
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';
import { MonthlyChallenge, MonthlyChallengeProgress, AchievementCategory } from '../../types/gamification';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';
import { MonthlyProgressTracker } from '../../services/monthlyProgressTracker';
import MonthlyProgressCalendar from './MonthlyProgressCalendar';

interface MonthlyChallengeDetailModalProps {
  challenge: MonthlyChallenge | null;
  progress: MonthlyChallengeProgress | null;
  visible: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'progress' | 'calendar' | 'tips';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MonthlyChallengeDetailModal: React.FC<MonthlyChallengeDetailModalProps> = ({
  challenge,
  progress: initialProgress,
  visible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [progress, setProgress] = useState<MonthlyChallengeProgress | null>(initialProgress);

  // Initialize progress state when props change
  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  // Real-time progress updates listener
  useEffect(() => {
    if (!challenge || !visible) return;
    
    console.log(`🔄 [MODAL] Setting up real-time progress listener for challenge: ${challenge.id}`);
    
    const progressUpdateListener: EmitterSubscription = DeviceEventEmitter.addListener(
      'monthly_progress_updated',
      async (eventData: any) => {
        console.log(`📈 [MODAL] Monthly progress update event received:`, eventData);
        
        // Only update if event is for our current challenge
        if (eventData.challengeId === challenge.id) {
          try {
            // Refresh progress data from MonthlyProgressTracker
            const updatedProgress = await MonthlyProgressTracker.getChallengeProgress(challenge.id);
            if (updatedProgress) {
              console.log(`✅ [MODAL] Real-time progress updated: ${updatedProgress.completionPercentage}%`);
              setProgress(updatedProgress);
            }
          } catch (error) {
            console.error('[MODAL] Failed to refresh progress on real-time update:', error);
          }
        }
      }
    );

    // Cleanup listener on unmount or challenge/visibility change
    return () => {
      console.log(`🛑 [MODAL] Cleaning up progress listener for challenge: ${challenge.id}`);
      progressUpdateListener.remove();
    };
  }, [challenge?.id, visible]); // Re-setup listener when challenge or visibility changes

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

  const getTotalDays = () => {
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
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

  const getWeeklyBreakdown = () => {
    const weeks = [
      { name: 'Week 1', data: progress.weeklyProgress.week1 },
      { name: 'Week 2', data: progress.weeklyProgress.week2 },
      { name: 'Week 3', data: progress.weeklyProgress.week3 },
      { name: 'Week 4', data: progress.weeklyProgress.week4 },
    ];

    if (progress.weeklyProgress.week5) {
      weeks.push({ name: 'Week 5', data: progress.weeklyProgress.week5 });
    }

    return weeks;
  };

  const categoryColor = getCategoryColor(challenge.category);
  const starColor = getStarColor(challenge.starLevel);
  const daysRemaining = getDaysRemaining();
  const totalDays = getTotalDays();
  const isCompleted = progress.isCompleted || progress.completionPercentage >= 100;

  const completedRequirements = challenge.requirements.filter(req => 
    (progress.progress[req.trackingKey] || 0) >= req.target
  ).length;

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
        <Text style={styles.sectionTitle}>Challenge Description</Text>
        <Text style={styles.description}>{challenge.description}</Text>
      </View>

      {/* Time Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timeCard}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{daysRemaining}</Text>
              <Text style={styles.timeLabel}>Days Remaining</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{progress.daysActive}</Text>
              <Text style={styles.timeLabel}>Active Days</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.timeNumber}>{totalDays}</Text>
              <Text style={styles.timeLabel}>Total Days</Text>
            </View>
          </View>
          <Text style={styles.timeDetails}>
            {new Date(challenge.startDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric'
            })} - {new Date(challenge.endDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
      </View>

    </View>
  );

  const renderProgressTab = () => (
    <View>
      {/* Requirements Detail */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements Progress</Text>
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

      {/* Weekly Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
        <View style={styles.weeklyCard}>
          {getWeeklyBreakdown().map((week, index) => {
            const weekTotal = Object.values(week.data).reduce((sum, val) => sum + (val || 0), 0);
            const hasData = weekTotal > 0;

            return (
              <View key={week.name} style={styles.weeklyItem}>
                <View style={styles.weeklyHeader}>
                  <Text style={styles.weeklyName}>{week.name}</Text>
                  <Text style={[
                    styles.weeklyTotal,
                    { color: hasData ? categoryColor : '#9CA3AF' }
                  ]}>
                    {weekTotal > 0 ? `${weekTotal} contributions` : 'No activity'}
                  </Text>
                </View>
                <View style={styles.weeklyData}>
                  {Object.entries(week.data).map(([key, value]) => (
                    <View key={key} style={styles.weeklyDataItem}>
                      <Text style={styles.weeklyDataKey}>{key.replace('_', ' ')}</Text>
                      <Text style={styles.weeklyDataValue}>{value || 0}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderCalendarTab = () => (
    <View>
      <MonthlyProgressCalendar
        challenge={challenge}
        progress={progress}
        compact={false}
      />
    </View>
  );

  const renderTipsTab = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Success</Text>
        <View style={styles.tipsCard}>
          {getMonthlyChallengeTips(challenge.category).map((tip, index) => (
            <View key={index} style={styles.tip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Challenge Strategy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Strategy</Text>
        <View style={styles.strategyCard}>
          <Text style={styles.strategyText}>
            This is a <Text style={[styles.strategyHighlight, { color: starColor }]}>
              {getStarRarity(challenge.starLevel)} ({challenge.starLevel}★)
            </Text> difficulty challenge designed to help you grow consistently.
          </Text>
          <Text style={styles.strategyText}>
            Complete this challenge to advance to the next star level and unlock higher XP rewards!
          </Text>
        </View>
      </View>

      {/* Reward Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rewards</Text>
        <View style={[styles.rewardCard, { borderColor: categoryColor + '30' }]}>
          <View style={[styles.rewardIcon, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.rewardIconText, { color: categoryColor }]}>🎁</Text>
          </View>
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle}>
              {challenge.baseXPReward} Experience Points
            </Text>
            <Text style={styles.rewardDescription}>
              Complete all requirements to earn this XP reward. Perfect completion (100%) earns bonus XP!
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
      case 'progress':
        return renderProgressTab();
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
              <Text style={styles.categoryIcon}>{getCategoryIcon(challenge.category)}</Text>
              <View style={styles.headerText}>
                <Text style={styles.title}>{challenge.title}</Text>
                <View style={styles.headerMeta}>
                  <Text style={styles.category}>
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
            
            <View style={styles.headerBadges}>
              <View style={[styles.xpBadge, { backgroundColor: starColor + '20' }]}>
                <Text style={[styles.xpText, { color: '#FFFFFF' }]}>
                  +{challenge.baseXPReward} XP
                </Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓ Completed</Text>
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
            {renderTabButton('overview', 'Overview')}
            {renderTabButton('progress', 'Progress')}
            {renderTabButton('calendar', 'Calendar')}
            {renderTabButton('tips', 'Tips')}
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
    case 'mastery':
      return [
        'Challenge yourself to exceed the minimum requirements',
        'Focus on quality and depth rather than just quantity',
        'Use this month to push your limits and discover new capabilities',
        'Document your learning process and insights',
        'Share your progress with others for accountability'
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
  },
  activeTabButton: {
    // backgroundColor will be set dynamically
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  progressStatLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  milestoneMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 11,
    color: '#9CA3AF',
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
    marginBottom: 6,
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
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  weeklyItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  weeklyTotal: {
    fontSize: 12,
    fontWeight: '500',
  },
  weeklyData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weeklyDataItem: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  weeklyDataKey: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  weeklyDataValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
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
  strategyCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  strategyText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    marginBottom: 8,
  },
  strategyHighlight: {
    fontWeight: '600',
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
    marginBottom: 4,
  },
  rewardBonus: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});

export default MonthlyChallengeDetailModal;