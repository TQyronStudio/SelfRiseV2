// Monthly Challenge Completion Modal - Celebration for monthly challenge completion
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MonthlyChallenge,
  MonthlyChallengeCompletionResult,
  AchievementCategory
} from '../../types/gamification';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';
import { useXpAnimation } from '../../contexts/XpAnimationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface MonthlyChallengeCompletionModalProps {
  visible: boolean;
  challenge: MonthlyChallenge | null;
  completionResult: MonthlyChallengeCompletionResult | null;
  onClose: () => void;
  onContinue?: () => void;
}

interface ParticleProps {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
  delay: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MonthlyChallengeCompletionModal: React.FC<MonthlyChallengeCompletionModalProps> = ({
  visible,
  challenge,
  completionResult,
  onClose,
  onContinue
}) => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useI18n();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef<Animated.Value[]>([]).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // 4-Tier Modal Priority System Integration
  const { notifyMonthlyChallengeModalStarted, notifyMonthlyChallengeModalEnded } = useXpAnimation();

  // Modal coordination for 4-tier priority system
  useEffect(() => {
    if (visible) {
      console.log('🎯 Monthly Challenge Completion modal visible - notifying priority system');
      notifyMonthlyChallengeModalStarted();
    }

    return () => {
      if (!visible) {
        console.log('✅ Monthly Challenge Completion modal closed - releasing priority');
        notifyMonthlyChallengeModalEnded();
      }
    };
  }, [visible, notifyMonthlyChallengeModalStarted, notifyMonthlyChallengeModalEnded]);

  useEffect(() => {
    if (visible && challenge && completionResult) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Initialize particle animations
      initializeParticles();

      // Start animations
      startCelebrationAnimation();
    } else {
      // Reset animations
      resetAnimations();
    }
  }, [visible, challenge, completionResult]);

  const initializeParticles = () => {
    // Clear previous particles
    particleAnims.length = 0;
    
    // Create 20 particles
    for (let i = 0; i < 20; i++) {
      particleAnims.push(new Animated.Value(0));
    }
  };

  const startCelebrationAnimation = () => {
    const animations = [
      // Main modal scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // Slide up animation
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Fade in animation
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ];

    // Particle animations
    const particleAnimations = particleAnims.map((anim, index) => 
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel([
      ...animations,
      ...particleAnimations,
    ]).start();
  };

  const resetAnimations = () => {
    scaleAnim.setValue(0);
    slideUpAnim.setValue(50);
    fadeInAnim.setValue(0);
    particleAnims.forEach(anim => anim.setValue(0));
  };

  if (!visible || !challenge || !completionResult) {
    return null;
  }

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
      case 1: return '#9E9E9E';
      case 2: return '#2196F3';
      case 3: return '#9C27B0';
      case 4: return '#FF9800';
      case 5: return '#FFD700';
      default: return '#9E9E9E';
    }
  };

  const getStarRarity = (starLevel: number): string => {
    switch (starLevel) {
      case 1: return t('monthlyChallenge.rarity.common');
      case 2: return t('monthlyChallenge.rarity.rare');
      case 3: return t('monthlyChallenge.rarity.epic');
      case 4: return t('monthlyChallenge.rarity.legendary');
      case 5: return t('monthlyChallenge.rarity.master');
      default: return t('monthlyChallenge.rarity.unknown');
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

  const getCompletionEmoji = (completionPercentage: number) => {
    if (completionPercentage >= 100) return '🏆';
    if (completionPercentage >= 90) return '🌟';
    if (completionPercentage >= 80) return '✨';
    if (completionPercentage >= 70) return '🎯';
    return '📈';
  };

  const getCompletionTitle = (completionPercentage: number) => {
    if (completionPercentage >= 100) return t('monthlyChallenge.completionModal.titles.perfect');
    if (completionPercentage >= 90) return t('monthlyChallenge.completionModal.titles.outstanding');
    if (completionPercentage >= 80) return t('monthlyChallenge.completionModal.titles.great');
    if (completionPercentage >= 70) return t('monthlyChallenge.completionModal.titles.completed');
    return t('monthlyChallenge.completionModal.titles.progress');
  };

  const getCompletionMessage = (completionPercentage: number, starLevel: number, category: string) => {
    const rarityName = getStarRarity(starLevel);
    const categoryName = t(`monthlyChallenge.categories.${category}`);

    if (completionPercentage >= 100) {
      return t('monthlyChallenge.completionModal.messages.perfect', { rarity: rarityName, category: categoryName });
    }
    if (completionPercentage >= 90) {
      return t('monthlyChallenge.completionModal.messages.outstanding', { rarity: rarityName, category: categoryName });
    }
    if (completionPercentage >= 80) {
      return t('monthlyChallenge.completionModal.messages.great', { rarity: rarityName, category: categoryName });
    }
    if (completionPercentage >= 70) {
      return t('monthlyChallenge.completionModal.messages.completed', { rarity: rarityName, category: categoryName });
    }
    return t('monthlyChallenge.completionModal.messages.progress', { rarity: rarityName, category: categoryName });
  };

  const categoryColor = getCategoryColor(challenge.category);
  const starColor = getStarColor(challenge.starLevel);
  const completionPercentage = completionResult?.completionPercentage || 0;

  const renderParticle = (index: number) => {
    const colors = [categoryColor, starColor, '#FFD700', '#FF69B4', '#00CED1'];
    const color = colors[index % colors.length];
    
    const size = Math.random() * 8 + 4;
    const initialX = Math.random() * screenWidth;
    const initialY = screenHeight + 20;
    const targetX = Math.random() * screenWidth;
    const targetY = Math.random() * screenHeight * 0.3;
    
    const animatedStyle = {
      transform: [
        {
          translateX: particleAnims[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [initialX, targetX],
          }) || 0,
        },
        {
          translateY: particleAnims[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [initialY, targetY],
          }) || 0,
        },
        {
          scale: particleAnims[index]?.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 0],
          }) || 0,
        },
      ],
      opacity: particleAnims[index]?.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0, 1, 1, 0],
      }) || 0,
    };

    return (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      />
    );
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    particle: {
      position: 'absolute',
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      maxHeight: screenHeight * 0.9,
      width: screenWidth * 0.9,
      maxWidth: 400,
      elevation: 10,
    },
    scrollContent: {
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
      padding: 20,
      borderRadius: 16,
    },
    completionEmoji: {
      fontSize: 64,
      marginBottom: 12,
    },
    completionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    completionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    challengeInfo: {
      marginBottom: 24,
    },
    challengeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    challengeIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    challengeDetails: {
      flex: 1,
    },
    challengeName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    challengeMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    challengeCategory: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    completionMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      textAlign: 'center',
    },
    progressSummary: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    progressPercentage: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    progressBar: {
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 16,
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
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    progressStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    rewardsSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#BBF7D0',
    },
    rewardsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    rewardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    rewardLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    rewardValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    totalReward: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#D1D5DB',
    },
    totalRewardLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    totalRewardValue: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    starProgressSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    starProgressTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#92400E',
      textAlign: 'center',
      marginBottom: 16,
    },
    starProgressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 12,
    },
    starProgressItem: {
      alignItems: 'center',
    },
    starProgressLabel: {
      fontSize: 12,
      color: '#78350F',
      marginBottom: 8,
    },
    starProgressText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#78350F',
      marginTop: 4,
    },
    starProgressArrow: {
      fontSize: 24,
      color: '#D97706',
      fontWeight: 'bold',
    },
    starProgressDescription: {
      fontSize: 14,
      color: '#92400E',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    streakSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#FECACA',
      alignItems: 'center',
    },
    streakTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#991B1B',
      marginBottom: 8,
    },
    streakValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#DC2626',
      marginBottom: 8,
    },
    streakDescription: {
      fontSize: 14,
      color: '#7F1D1D',
      textAlign: 'center',
    },
    nextMonthSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#DBEAFE',
    },
    nextMonthTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1E40AF',
      marginBottom: 8,
      textAlign: 'center',
    },
    nextMonthDescription: {
      fontSize: 14,
      color: '#1E3A8A',
      textAlign: 'center',
      lineHeight: 20,
    },
    actionButtons: {
      padding: 24,
      paddingTop: 0,
      gap: 12,
    },
    continueButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    continueButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    closeButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Particles */}
        {particleAnims.map((_, index) => renderParticle(index))}

        {/* Main Modal */}
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideUpAnim },
              ],
              opacity: fadeInAnim,
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: categoryColor + '10' }]}>
              <Text style={styles.completionEmoji}>
                {getCompletionEmoji(completionPercentage)}
              </Text>
              <Text style={styles.completionTitle}>
                {getCompletionTitle(completionPercentage)}
              </Text>
              <Text style={styles.completionSubtitle}>
                {t('monthlyChallenge.completionModal.subtitle')} • {new Date(challenge.endDate + 'T00:00:00').toLocaleDateString(currentLanguage, {
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>

            {/* Challenge Info */}
            <View style={styles.challengeInfo}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeIcon}>{getCategoryIcon(challenge.category)}</Text>
                <View style={styles.challengeDetails}>
                  <Text style={styles.challengeName}>{challenge.title}</Text>
                  <View style={styles.challengeMeta}>
                    <Text style={[styles.challengeCategory, { color: categoryColor }]}>
                      {t(`monthlyChallenge.categories.${challenge.category}`)}
                    </Text>
                    <StarRatingDisplay
                      category={challenge.category}
                      starLevel={challenge.starLevel}
                      size="small"
                      showLabel={true}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.completionMessage}>
                {getCompletionMessage(completionPercentage, challenge.starLevel, challenge.category)}
              </Text>
            </View>

            {/* Progress Summary */}
            <View style={styles.progressSummary}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>{t('monthlyChallenge.completionModal.finalResults')}</Text>
                <Text style={[styles.progressPercentage, { color: categoryColor }]}>
                  {Math.round(completionPercentage)}%
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${completionPercentage}%`,
                      backgroundColor: categoryColor
                    }
                  ]}
                />
              </View>

              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>{completionResult?.requirementsCompleted || 0}</Text>
                  <Text style={styles.progressStatLabel}>{t('monthlyChallenge.completionModal.progressStats.requirements')}</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>{completionResult?.activeDays || 0}</Text>
                  <Text style={styles.progressStatLabel}>{t('monthlyChallenge.completionModal.progressStats.activeDays')}</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>{completionResult?.milestonesReached || 0}</Text>
                  <Text style={styles.progressStatLabel}>{t('monthlyChallenge.completionModal.progressStats.milestones')}</Text>
                </View>
              </View>
            </View>

            {/* XP Rewards Breakdown */}
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>{t('monthlyChallenge.completionModal.rewards.title')}</Text>

              <View style={styles.rewardItem}>
                <Text style={styles.rewardLabel}>{t('monthlyChallenge.completionModal.rewards.baseXP')}</Text>
                <Text style={[styles.rewardValue, { color: categoryColor }]}>
                  +{completionResult.baseXP || 0}
                </Text>
              </View>

              {(completionResult.bonusXP || 0) > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardLabel}>{t('monthlyChallenge.completionModal.rewards.completionBonus')}</Text>
                  <Text style={[styles.rewardValue, { color: '#22C55E' }]}>
                    +{completionResult.bonusXP}
                  </Text>
                </View>
              )}

              {(completionResult.streakBonus || 0) > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardLabel}>{t('monthlyChallenge.completionModal.rewards.streakBonus')}</Text>
                  <Text style={[styles.rewardValue, { color: '#F59E0B' }]}>
                    +{completionResult.streakBonus}
                  </Text>
                </View>
              )}

              {(completionResult.perfectCompletionBonus || 0) > 0 && (
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardLabel}>{t('monthlyChallenge.completionModal.rewards.perfectBonus')}</Text>
                  <Text style={[styles.rewardValue, { color: '#8B5CF6' }]}>
                    +{completionResult.perfectCompletionBonus}
                  </Text>
                </View>
              )}

              <View style={[styles.rewardItem, styles.totalReward]}>
                <Text style={styles.totalRewardLabel}>{t('monthlyChallenge.completionModal.rewards.totalEarned')}</Text>
                <Text style={[styles.totalRewardValue, { color: starColor }]}>
                  +{completionResult.totalXPEarned || 0} XP
                </Text>
              </View>
            </View>

            {/* Star Progression */}
            {completionResult.starLevelChanged && (
              <View style={styles.starProgressSection}>
                <Text style={styles.starProgressTitle}>{t('monthlyChallenge.completionModal.starProgression.title')}</Text>
                <View style={styles.starProgressContainer}>
                  <View style={styles.starProgressItem}>
                    <Text style={styles.starProgressLabel}>{t('monthlyChallenge.completionModal.starProgression.previous')}</Text>
                    <StarRatingDisplay
                      category={challenge.category}
                      starLevel={completionResult.oldStarLevel}
                      size="medium"
                      showLabel={false}
                    />
                    <Text style={styles.starProgressText}>
                      {getStarRarity(completionResult.oldStarLevel)}
                    </Text>
                  </View>

                  <Text style={styles.starProgressArrow}>→</Text>

                  <View style={styles.starProgressItem}>
                    <Text style={styles.starProgressLabel}>{t('monthlyChallenge.completionModal.starProgression.newLevel')}</Text>
                    <StarRatingDisplay
                      category={challenge.category}
                      starLevel={completionResult.newStarLevel}
                      size="medium"
                      showLabel={false}
                    />
                    <Text style={[styles.starProgressText, { color: getStarColor(completionResult.newStarLevel) }]}>
                      {getStarRarity(completionResult.newStarLevel)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.starProgressDescription}>
                  {t('monthlyChallenge.completionModal.starProgression.description')}
                </Text>
              </View>
            )}

            {/* Monthly Streak */}
            {(completionResult.monthlyStreak || 0) > 0 && (
              <View style={styles.streakSection}>
                <Text style={styles.streakTitle}>{t('monthlyChallenge.completionModal.streak.title')}</Text>
                <Text style={styles.streakValue}>
                  {completionResult.monthlyStreak} {t('monthlyChallenge.completionModal.streak.month', { count: completionResult.monthlyStreak })}
                </Text>
                <Text style={styles.streakDescription}>
                  {t('monthlyChallenge.completionModal.streak.description')}
                </Text>
              </View>
            )}

            {/* Next Month Preview */}
            {completionResult.nextMonthEligible && (
              <View style={styles.nextMonthSection}>
                <Text style={styles.nextMonthTitle}>{t('monthlyChallenge.completionModal.nextMonth.title')}</Text>
                <Text style={styles.nextMonthDescription}>
                  {completionResult.starLevelChanged
                    ? t('monthlyChallenge.completionModal.nextMonth.descriptionWithLevel')
                    : t('monthlyChallenge.completionModal.nextMonth.description')
                  }
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onContinue && (
              <Pressable
                style={[styles.continueButton, { backgroundColor: categoryColor }]}
                onPress={onContinue}
              >
                <Text style={styles.continueButtonText}>{t('monthlyChallenge.completionModal.nextMonth.continue')}</Text>
              </Pressable>
            )}

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                {onContinue ? t('common.close') : t('common.success')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MonthlyChallengeCompletionModal;