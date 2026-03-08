// Monthly Challenge Failure Modal - Shown when month ends without 100% completion
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
import { MonthlyChallengeFailureResult, AchievementCategory } from '../../types/gamification';
import { StarRatingDisplay } from '../gamification/StarRatingDisplay';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

interface MonthlyChallengeFailureModalProps {
  visible: boolean;
  failureResult: MonthlyChallengeFailureResult | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MonthlyChallengeFailureModal: React.FC<MonthlyChallengeFailureModalProps> = ({
  visible,
  failureResult,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t, currentLanguage } = useI18n();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && failureResult) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeInAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      slideUpAnim.setValue(50);
      fadeInAnim.setValue(0);
    }
  }, [visible, failureResult]);

  if (!visible || !failureResult) return null;

  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'habits': return '#22C55E';
      case 'journal': return '#3B82F6';
      case 'goals': return '#F59E0B';
      case 'consistency': return '#8B5CF6';
      default: return '#6B7280';
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

  const categoryColor = getCategoryColor(failureResult.category);
  const percentage = Math.round(failureResult.completionPercentage);
  const isPartial = failureResult.failureType === 'partial';

  const getStarImpactText = () => {
    if (failureResult.starLevelChanged) {
      return t('monthlyChallenge.failureModal.starImpact.demotion', {
        oldStars: failureResult.oldStarLevel,
        newStars: failureResult.newStarLevel,
      });
    }
    if (failureResult.consecutiveFailures >= 1 && !isPartial) {
      return t('monthlyChallenge.failureModal.starImpact.warning');
    }
    return t('monthlyChallenge.failureModal.starImpact.noChange', {
      stars: failureResult.oldStarLevel,
    });
  };

  const getMonthLabel = (month: string) => {
    const parts = month.split('-');
    const year = parseInt(parts[0] || '2026');
    const monthNum = parseInt(parts[1] || '1');
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString(currentLanguage, { month: 'long', year: 'numeric' });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 20,
      maxHeight: screenHeight * 0.85,
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
    headerEmoji: {
      fontSize: 56,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    challengeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    challengeIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    challengeDetails: {
      flex: 1,
    },
    challengeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    challengeCategory: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    message: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 24,
    },
    // Progress section
    progressSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressLabel: {
      fontSize: 16,
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
    // Star impact section
    starSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: failureResult.starLevelChanged ? '#FECACA' : '#FDE68A',
    },
    starTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: failureResult.starLevelChanged ? '#991B1B' : '#92400E',
      textAlign: 'center',
      marginBottom: 12,
    },
    starContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: 12,
    },
    starItem: {
      alignItems: 'center',
    },
    starLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    starArrow: {
      fontSize: 24,
      color: failureResult.starLevelChanged ? '#DC2626' : '#D97706',
      fontWeight: 'bold',
    },
    starDescription: {
      fontSize: 14,
      color: failureResult.starLevelChanged ? '#7F1D1D' : '#92400E',
      textAlign: 'center',
      lineHeight: 20,
    },
    // Streak reset section
    streakResetSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#FECACA',
      alignItems: 'center',
    },
    streakResetTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#991B1B',
      marginBottom: 8,
    },
    streakResetDescription: {
      fontSize: 14,
      color: '#7F1D1D',
      textAlign: 'center',
    },
    // Motivation section
    motivationSection: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#DBEAFE',
    },
    motivationTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1E40AF',
      textAlign: 'center',
      marginBottom: 8,
    },
    motivationMessage: {
      fontSize: 14,
      color: '#1E3A8A',
      textAlign: 'center',
      lineHeight: 20,
    },
    // Button
    actionButtons: {
      padding: 24,
      paddingTop: 0,
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
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
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
              <Text style={styles.headerEmoji}>
                {isPartial ? '😤' : '💪'}
              </Text>
              <Text style={styles.headerTitle}>
                {t('monthlyChallenge.failureModal.title')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t('monthlyChallenge.failureModal.subtitle')} • {getMonthLabel(failureResult.month)}
              </Text>
            </View>

            {/* Challenge Info */}
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeIcon}>{getCategoryIcon(failureResult.category)}</Text>
              <View style={styles.challengeDetails}>
                <Text style={styles.challengeTitle}>{failureResult.challengeTitle}</Text>
                <Text style={[styles.challengeCategory, { color: categoryColor }]}>
                  {t(`monthlyChallenge.categories.${failureResult.category}`)}
                </Text>
              </View>
            </View>

            {/* Message */}
            <Text style={styles.message}>
              {t(`monthlyChallenge.failureModal.messages.${failureResult.failureType}`, {
                percentage,
                category: t(`monthlyChallenge.categories.${failureResult.category}`),
              })}
            </Text>

            {/* Progress Summary */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {t('monthlyChallenge.failureModal.progressStats.completion')}
                </Text>
                <Text style={[styles.progressPercentage, { color: categoryColor }]}>
                  {percentage}%
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: categoryColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>
                    {failureResult.requirementsCompleted}/{failureResult.totalRequirements}
                  </Text>
                  <Text style={styles.progressStatLabel}>
                    {t('monthlyChallenge.failureModal.progressStats.requirements')}
                  </Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={styles.progressStatValue}>{failureResult.activeDays}</Text>
                  <Text style={styles.progressStatLabel}>
                    {t('monthlyChallenge.failureModal.progressStats.activeDays')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Star Impact */}
            <View style={styles.starSection}>
              <Text style={styles.starTitle}>
                {t('monthlyChallenge.failureModal.starImpact.title')}
              </Text>

              {failureResult.starLevelChanged && (
                <View style={styles.starContainer}>
                  <View style={styles.starItem}>
                    <Text style={styles.starLabel}>{t('monthlyChallenge.completionModal.starProgression.previous')}</Text>
                    <StarRatingDisplay
                      category={failureResult.category}
                      starLevel={failureResult.oldStarLevel}
                      size="medium"
                      showLabel={false}
                    />
                  </View>
                  <Text style={styles.starArrow}>→</Text>
                  <View style={styles.starItem}>
                    <Text style={styles.starLabel}>{t('monthlyChallenge.completionModal.starProgression.newLevel')}</Text>
                    <StarRatingDisplay
                      category={failureResult.category}
                      starLevel={failureResult.newStarLevel}
                      size="medium"
                      showLabel={false}
                    />
                  </View>
                </View>
              )}

              <Text style={styles.starDescription}>
                {getStarImpactText()}
              </Text>
            </View>

            {/* Streak Reset - only show if user had a streak */}
            {failureResult.previousStreak > 0 && (
              <View style={styles.streakResetSection}>
                <Text style={styles.streakResetTitle}>
                  {t('monthlyChallenge.failureModal.streakReset.title')}
                </Text>
                <Text style={styles.streakResetDescription}>
                  {t('monthlyChallenge.failureModal.streakReset.description', {
                    previousStreak: failureResult.previousStreak,
                  })}
                </Text>
              </View>
            )}

            {/* Motivation */}
            <View style={styles.motivationSection}>
              <Text style={styles.motivationTitle}>
                {t('monthlyChallenge.failureModal.motivation.title')}
              </Text>
              <Text style={styles.motivationMessage}>
                {t('monthlyChallenge.failureModal.motivation.message')}
              </Text>
            </View>
          </ScrollView>

          {/* Button */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.continueButton, { backgroundColor: categoryColor }]}
              onPress={onClose}
            >
              <Text style={styles.continueButtonText}>
                {t('monthlyChallenge.failureModal.button')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MonthlyChallengeFailureModal;
