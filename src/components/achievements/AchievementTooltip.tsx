import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView
} from 'react-native';
import { Fonts, Layout } from '@/src/constants';
import { Achievement, AchievementRarity } from '@/src/types/gamification';
import { useI18n } from '@/src/hooks/useI18n';
import { useAccessibility, getHighContrastRarityColors } from '@/src/hooks/useAccessibility';
import { ProgressHint, CompletionInfo, SmartTooltip } from '@/src/utils/achievementPreviewUtils';
import { useTheme } from '@/src/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface AchievementTooltipProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement;
  isUnlocked: boolean;
  progressHint?: ProgressHint | undefined;
  completionInfo?: CompletionInfo | undefined;
  smartTooltip?: SmartTooltip | undefined;
}

const getRarityColor = (rarity: AchievementRarity, isHighContrast: boolean): string => {
  const colors = getHighContrastRarityColors(isHighContrast);
  
  switch (rarity) {
    case AchievementRarity.COMMON: return colors.common;
    case AchievementRarity.RARE: return colors.rare;
    case AchievementRarity.EPIC: return colors.epic;
    case AchievementRarity.LEGENDARY: return colors.legendary;
    default: return isHighContrast ? '#000000' : '#007AFF'; // Fallback primary color
  }
};

export const AchievementTooltip: React.FC<AchievementTooltipProps> = ({
  visible,
  onClose,
  achievement,
  isUnlocked,
  progressHint,
  completionInfo,
  smartTooltip
}) => {
  const { t } = useI18n();
  const { isHighContrastEnabled } = useAccessibility();
  const { colors } = useTheme();

  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 16,
      borderWidth: 2,
      paddingVertical: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.md,
      maxWidth: screenWidth * 0.9,
      maxHeight: '80%',
      width: '100%',
    },
    header: {
      alignItems: 'center',
      marginBottom: Layout.spacing.lg,
    },
    achievementIcon: {
      fontSize: 48,
      marginBottom: Layout.spacing.sm,
    },
    achievementName: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    rarityBadge: {
      borderRadius: 12,
      paddingVertical: Layout.spacing.xs,
      paddingHorizontal: Layout.spacing.sm,
    },
    rarityText: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: colors.white,
      letterSpacing: 1,
    },
    description: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },

    // Sections
    completionSection: {
      marginBottom: Layout.spacing.lg,
    },
    progressSection: {
      marginBottom: Layout.spacing.lg,
    },
    tipSection: {
      marginBottom: Layout.spacing.lg,
    },
    xpSection: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
      paddingVertical: Layout.spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
    },

    // Section Titles
    sectionTitle: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.sm,
    },

    // Completion Info
    completionDetails: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: Layout.spacing.sm,
    },
    accomplishmentText: {
      fontSize: Fonts.sizes.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    completionMeta: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      marginBottom: Layout.spacing.xs,
    },
    completionDate: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },

    // Progress Info
    requirementBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: Layout.spacing.sm,
      marginBottom: Layout.spacing.sm,
    },
    requirementTitle: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    requirementText: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      lineHeight: 20,
    },

    progressBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: Layout.spacing.sm,
      marginBottom: Layout.spacing.sm,
    },
    progressTitle: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    progressText: {
      fontSize: Fonts.sizes.md,
      fontWeight: '600',
      marginBottom: Layout.spacing.sm,
    },

    // Progress Bar
    progressBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.xs,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginRight: Layout.spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressPercentage: {
      fontSize: Fonts.sizes.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 35,
    },
    estimatedTime: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },

    // Action Hint
    actionHintBox: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: Layout.spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50', // Keep success green accent
    },
    actionHintTitle: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: colors.success,
      marginBottom: Layout.spacing.xs,
    },
    actionHintText: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      lineHeight: 20,
    },

    // Smart Tips
    primaryTip: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      marginBottom: Layout.spacing.xs,
      lineHeight: 20,
    },
    motivationalMessage: {
      fontSize: Fonts.sizes.md,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: Layout.spacing.xs,
      lineHeight: 20,
    },
    actionAdvice: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      marginBottom: Layout.spacing.xs,
      lineHeight: 18,
    },
    estimatedEffort: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },

    // XP Section
    xpLabel: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      marginRight: Layout.spacing.sm,
    },
    xpAmount: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
    },

    // Close Button
    closeButton: {
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      alignItems: 'center',
      marginTop: Layout.spacing.sm,
    },
    closeButtonText: {
      color: colors.white,
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { borderColor: rarityColor }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={[styles.achievementName, { color: rarityColor }]}>
                {t(achievement.nameKey)}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>
                  {t(`achievements.rarity.${achievement.rarity}`)}
                </Text>
              </View>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>
              {t(achievement.descriptionKey)}
            </Text>
            
            {/* Unlocked Achievement Info */}
            {isUnlocked && completionInfo && (
              <View style={styles.completionSection}>
                <Text style={styles.sectionTitle}>✅ {t('social.tooltip.completed')}</Text>
                <View style={styles.completionDetails}>
                  <Text style={styles.accomplishmentText}>
                    {completionInfo.accomplishment}
                  </Text>
                  <Text style={styles.completionMeta}>
                    {completionInfo.category} • {completionInfo.difficultyLevel}
                  </Text>
                  <Text style={styles.completionDate}>
                    {completionInfo.completionDate}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Locked Achievement Progress */}
            {!isUnlocked && progressHint && (
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>📊 {t('social.tooltip.progressAndRequirements')}</Text>

                {/* Requirements */}
                <View style={styles.requirementBox}>
                  <Text style={styles.requirementTitle}>{t('social.tooltip.requirement')}:</Text>
                  <Text style={styles.requirementText}>
                    {progressHint.requirementText}
                  </Text>
                </View>
                
                {/* Current Progress */}
                <View style={styles.progressBox}>
                  <Text style={styles.progressTitle}>{t('social.tooltip.currentProgress')}:</Text>
                  <Text style={[styles.progressText, { color: rarityColor }]}>
                    {progressHint.progressText}
                  </Text>
                  
                  {/* Visual Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressTrack}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${progressHint.progressPercentage}%`,
                            backgroundColor: rarityColor + '80' // Semi-transparent
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressPercentage}>
                      {Math.round(progressHint.progressPercentage)}%
                    </Text>
                  </View>
                  
                  {/* Estimated Time */}
                  {progressHint.estimatedDays && (
                    <Text style={styles.estimatedTime}>
                      {t('achievements.detail.estimatedDays', { days: progressHint.estimatedDays })}
                    </Text>
                  )}
                </View>
                
                {/* Action Hint */}
                <View style={styles.actionHintBox}>
                  <Text style={styles.actionHintTitle}>💡 {t('social.tooltip.nextSteps')}:</Text>
                  <Text style={styles.actionHintText}>
                    {progressHint.actionHint}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Smart Tooltip */}
            {smartTooltip && (
              <View style={styles.tipSection}>
                <Text style={styles.sectionTitle}>💡 {t('social.tooltip.smartTips')}</Text>
                <Text style={styles.primaryTip}>
                  {smartTooltip.primaryTip}
                </Text>
                <Text style={styles.motivationalMessage}>
                  {smartTooltip.motivationalMessage}
                </Text>
                <Text style={styles.actionAdvice}>
                  {smartTooltip.actionAdvice}
                </Text>
                {smartTooltip.estimatedEffort && (
                  <Text style={styles.estimatedEffort}>
                    ⏰ {smartTooltip.estimatedEffort}
                  </Text>
                )}
              </View>
            )}
            
            {/* XP Reward */}
            <View style={styles.xpSection}>
              <Text style={styles.xpLabel}>{t('achievements.detail.xpRewardLabel')}</Text>
              <Text style={[styles.xpAmount, { color: rarityColor }]}>
                +{achievement.xpReward} XP
              </Text>
            </View>
          </ScrollView>
          
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: rarityColor }]}
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.closeAchievementDetails')}
          >
            <Text style={styles.closeButtonText}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};