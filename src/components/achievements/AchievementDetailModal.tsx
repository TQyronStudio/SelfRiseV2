import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AccessibilityInfo,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Achievement, AchievementRarity, UserAchievements } from '@/src/types/gamification';
import { UserStats, ProgressHint, generateProgressHintAsync } from '@/src/utils/achievementPreviewUtils';
import { AchievementService } from '@/src/services/achievementService';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { useI18n } from '@/src/hooks/useI18n';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ========================================
// INTERFACES
// ========================================

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  userAchievements: UserAchievements | null;
  onSharePress?: (achievement: Achievement) => void;
  batchUserStats?: any; // Pre-loaded user stats for performance
  realTimeProgress?: number | undefined; // Real-time progress from batch system
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const getRarityColor = (rarity: AchievementRarity, isHighContrast: boolean): string => {
  if (isHighContrast) {
    // For high contrast in dark theme, use brighter, more visible colors
    switch (rarity) {
      case AchievementRarity.COMMON: return '#CCCCCC'; // Light gray instead of black
      case AchievementRarity.RARE: return '#4CB8FF'; // Bright blue instead of dark blue
      case AchievementRarity.EPIC: return '#E040FB'; // Bright purple instead of dark purple
      case AchievementRarity.LEGENDARY: return '#FFD700'; // Keep golden
      default: return '#CCCCCC';
    }
  }

  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return '#007AFF';
  }
};

const getRarityEmoji = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '🏆';
    case AchievementRarity.RARE: return '💎';
    case AchievementRarity.EPIC: return '🌟';
    case AchievementRarity.LEGENDARY: return '👑';
    default: return '🏆';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'habits': return '#4CAF50';
    case 'journal': return '#2196F3';
    case 'goals': return '#FF9800';
    case 'consistency': return '#F44336';
    default: return '#007AFF';
  }
};

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'habits': return 'fitness';
    case 'journal': return 'book';
    case 'goals': return 'flag';
    case 'consistency': return 'trending-up';
    default: return 'medal';
  }
};

const formatUnlockDate = (achievement: Achievement, t: any): string => {
  // For now, simulate unlock date - in real app this would come from user data
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  if (daysAgo === 1) return t('achievements.detail.unlockedYesterday');
  if (daysAgo <= 7) return t('achievements.detail.unlockedDaysAgo', { days: daysAgo });
  if (daysAgo <= 30) return t('achievements.detail.unlockedWeeksAgo', { weeks: Math.ceil(daysAgo / 7) });
  return t('achievements.detail.unlockedRecently');
};

// ========================================
// COMPONENT
// ========================================

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  achievement,
  userAchievements,
  onSharePress,
  batchUserStats,
  realTimeProgress,
}) => {
  const { colors } = useTheme();
  const { isHighContrastEnabled, isReduceMotionEnabled } = useAccessibility();
  const { t } = useI18n();
  const [progressHint, setProgressHint] = useState<ProgressHint | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Calculate values only if achievement exists
  const isUnlocked = achievement ? (userAchievements?.unlockedAchievements.includes(achievement.id) || false) : false;
  const rarityColor = achievement ? getRarityColor(achievement.rarity, isHighContrastEnabled) : colors.primary;
  const rarityEmoji = achievement ? getRarityEmoji(achievement.rarity) : '🏆';
  const categoryColor = achievement ? getCategoryColor(achievement.category) : colors.primary;
  const categoryIcon = achievement ? getCategoryIcon(achievement.category) : 'medal' as keyof typeof Ionicons.glyphMap;

  // Initialize batch user stats - component only renders when visible
  useEffect(() => {
    setUserStats(batchUserStats || null);
  }, [batchUserStats]);

  // Calculate progress using SAME PATTERN as AchievementCard
  const progress = realTimeProgress !== undefined 
    ? Number(realTimeProgress) || 0
    : achievement?.isProgressive 
      ? 0 
      : (isUnlocked ? 100 : 0);

  // Generate progress hint for locked achievements - component only renders when visible
  useEffect(() => {
    if (!isUnlocked) {
      setProgressHint({
        progressText: `${Math.round(progress)}% complete`,
        progressPercentage: progress,
        isCompleted: progress >= 100,
        requirementText: achievement?.description || t('achievements.detail.requirementFallback'),
        actionHint: t('achievements.detail.actionHint'),
        estimatedDays: progress < 100 ? Math.ceil((100 - progress) / 10) : 0
      });
    }
  }, [isUnlocked, progress, achievement?.description, t]);

  // Accessibility announcement for screen readers
  useEffect(() => {
    const announcement = isUnlocked 
      ? `Achievement details: ${achievement?.name || 'Achievement'}. This ${achievement?.rarity || 'common'} achievement is unlocked.`
      : `Achievement details: ${achievement?.name || 'Achievement'}. This ${achievement?.rarity || 'common'} achievement is locked. Progress information available.`;
    
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [achievement?.name, achievement?.rarity, isUnlocked]);

  const handleSharePress = () => {
    if (onSharePress && achievement && isUnlocked) {
      onSharePress(achievement);
    }
  };

  // Return nothing if modal not visible - allows smooth slide animation
  if (!visible) {
    return null;
  }

  // Return empty modal if no achievement
  if (!achievement) {
    return (
      <Modal
        visible={false}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View />
      </Modal>
    );
  }

  // Styles - moved inside component to access colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 2,
      backgroundColor: colors.cardBackgroundElevated,
      minHeight: 60,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.cardBackgroundElevated,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    achievementCard: {
      margin: 16,
      padding: 20,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      borderLeftWidth: 4,
    },
    achievementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconContainer: {
      position: 'relative',
      marginRight: 16,
    },
    achievementIcon: {
      fontSize: 48,
      textAlign: 'center',
    },
    achievementIconLocked: {
      opacity: 0.5,
    },
    statusBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusEmoji: {
      fontSize: 12,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    achievementNameLocked: {
      color: colors.textSecondary,
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    rarityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
      marginBottom: 4,
    },
    rarityText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
      marginBottom: 4,
    },
    categoryText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.white,
      marginLeft: 4,
    },
    xpReward: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 20,
    },
    unlockedContent: {
      marginTop: 8,
    },
    completionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    completionText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    achievementDetails: {
      marginTop: 8,
    },
    detailTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    lockedContent: {
      marginTop: 8,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressSection: {
      marginBottom: 16,
    },
    progressTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressTrack: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginRight: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      minWidth: 40,
    },
    guidanceSection: {
      marginTop: 8,
    },
    guidanceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    actionHint: {
      fontSize: 14,
      color: colors.primary,
      marginBottom: 8,
      lineHeight: 20,
    },
    estimatedTime: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    noProgressContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    lockedMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
    actionContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 12,
    },
    shareActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    shareButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
      marginLeft: 8,
    },
    closeActionButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header - přesun z ScrollView */}
        <View style={[styles.header, { borderBottomColor: rarityColor }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('achievements.detail.closeButton')}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            {isUnlocked ? t('achievements.detail.titleUnlocked') : t('achievements.detail.titleDetails')}
          </Text>
          
          {isUnlocked && onSharePress && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleSharePress}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('achievements.detail.shareButton')}
            >
              <Ionicons name="share-outline" size={24} color={rarityColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Main Content ScrollView */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            {/* Achievement Card */}
            <View style={[styles.achievementCard, { borderLeftColor: rarityColor }]}>
              {/* Achievement Icon and Status */}
              <View style={styles.achievementHeader}>
                <View style={styles.iconContainer}>
                  <Text style={[
                    styles.achievementIcon,
                    !isUnlocked && styles.achievementIconLocked
                  ]}>
                    {String(achievement?.icon || '🏆')}
                  </Text>
                  {isUnlocked && (
                    <View style={[styles.statusBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.statusEmoji}>{rarityEmoji}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementName,
                    !isUnlocked && styles.achievementNameLocked
                  ]}>
                    {achievement ? t(achievement.nameKey) : 'Achievement'}
                  </Text>
                  
                  <View style={styles.metaContainer}>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.rarityText}>
                        {t(`achievements.detail.rarity${(achievement?.rarity || 'common').charAt(0).toUpperCase() + (achievement?.rarity || 'common').slice(1)}`)}
                      </Text>
                    </View>

                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                      <Ionicons name={categoryIcon} size={12} color={colors.white} />
                      <Text style={styles.categoryText}>
                        {achievement?.category ?
                          t(`social.achievements_filters.${achievement.category}Category`) :
                          t('achievements.detail.categoryLabel')
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.xpReward}>+{achievement?.xpReward || 50} XP</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description}>
                {achievement ? t(achievement.descriptionKey) : 'Achievement description'}
              </Text>

              {/* Conditional Content */}
              {isUnlocked ? (
                /* Unlocked Achievement Content */
                <View style={styles.unlockedContent}>
                  <View style={styles.completionInfo}>
                    <Ionicons name="checkmark-circle" size={20} color={rarityColor} />
                    <Text style={styles.completionText}>
                      {achievement ? formatUnlockDate(achievement, t) : t('achievements.detail.recentlyUnlocked')}
                    </Text>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.achievementDetails}>
                    <Text style={styles.detailTitle}>{t('achievements.detail.detailsSection')}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('achievements.detail.categoryLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {achievement?.category ?
                          achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1) :
                          'Category'
                        }
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('achievements.detail.rarityLabel')}</Text>
                      <Text style={[styles.detailValue, { color: rarityColor }]}>
                        {achievement?.rarity || 'common'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('achievements.detail.xpRewardLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {achievement?.xpReward || 50} {t('achievements.detail.xpPointsUnit')}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* Locked Achievement Content */
                <View style={styles.lockedContent}>
                  {progressHint ? (
                    <>
                      <View style={styles.progressSection}>
                        <Text style={styles.progressTitle}>{t('achievements.detail.progressToUnlock')}</Text>
                        <Text style={styles.progressText}>
                          {progressHint?.progressText || t('achievements.detail.progressLoading')}
                        </Text>

                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Number(progressHint?.progressPercentage || 0)}%`,
                                  backgroundColor: rarityColor
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressPercentage}>
                            {Math.round(Number(progressHint?.progressPercentage || 0))}%
                          </Text>
                        </View>
                      </View>

                      <View style={styles.separator} />

                      <View style={styles.guidanceSection}>
                        <Text style={styles.guidanceTitle}>{t('achievements.detail.howToUnlock')}</Text>
                        <Text style={styles.requirementText}>
                          {progressHint?.requirementText || t('achievements.detail.requirementFallback')}
                        </Text>
                        <Text style={styles.actionHint}>
                          💡 {progressHint?.actionHint || t('achievements.detail.actionHint')}
                        </Text>
                        {progressHint?.estimatedDays && progressHint.estimatedDays > 0 && (
                          <Text style={styles.estimatedTime}>
                            📅 {t('achievements.detail.estimatedDays', { days: progressHint.estimatedDays })}
                          </Text>
                        )}
                      </View>
                    </>
                  ) : (
                    <View style={styles.noProgressContainer}>
                      <Ionicons name="lock-closed" size={32} color={colors.textSecondary} />
                      <Text style={styles.lockedMessage}>
                        {t('achievements.detail.lockedMessage')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

          </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};