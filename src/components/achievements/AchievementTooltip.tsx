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
import { Colors, Fonts, Layout } from '@/src/constants';
import { Achievement, AchievementRarity } from '@/src/types/gamification';
import { useI18n } from '@/src/hooks/useI18n';
import { useAccessibility, getHighContrastRarityColors } from '@/src/hooks/useAccessibility';
import { ProgressHint, CompletionInfo, SmartTooltip } from '@/src/utils/achievementPreviewUtils';

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
    default: return isHighContrast ? '#000000' : Colors.primary;
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
  
  const rarityColor = getRarityColor(achievement.rarity, isHighContrastEnabled);
  
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
                {achievement.name}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>
                  {achievement.rarity.toUpperCase()}
                </Text>
              </View>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>
              {achievement.description}
            </Text>
            
            {/* Unlocked Achievement Info */}
            {isUnlocked && completionInfo && (
              <View style={styles.completionSection}>
                <Text style={styles.sectionTitle}>✅ Achievement Completed</Text>
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
                <Text style={styles.sectionTitle}>📊 Progress & Requirements</Text>
                
                {/* Requirements */}
                <View style={styles.requirementBox}>
                  <Text style={styles.requirementTitle}>Requirement:</Text>
                  <Text style={styles.requirementText}>
                    {progressHint.requirementText}
                  </Text>
                </View>
                
                {/* Current Progress */}
                <View style={styles.progressBox}>
                  <Text style={styles.progressTitle}>Current Progress:</Text>
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
                      ⏱️ Estimated: ~{progressHint.estimatedDays} days
                    </Text>
                  )}
                </View>
                
                {/* Action Hint */}
                <View style={styles.actionHintBox}>
                  <Text style={styles.actionHintTitle}>💡 Next Steps:</Text>
                  <Text style={styles.actionHintText}>
                    {progressHint.actionHint}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Smart Tooltip */}
            {smartTooltip && (
              <View style={styles.tipSection}>
                <Text style={styles.sectionTitle}>💡 Smart Tips</Text>
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
              <Text style={styles.xpLabel}>XP Reward:</Text>
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
            accessibilityLabel="Close achievement details"
          >
            <Text style={styles.closeButtonText}>
              {t('common.close') || 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
    maxWidth: screenWidth * 0.9,
    maxHeight: '80%',
    width: '100%',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    color: Colors.white,
    letterSpacing: 1,
  },
  description: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  
  // Completion Info
  completionDetails: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Layout.spacing.sm,
  },
  accomplishmentText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  completionMeta: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
  },
  completionDate: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Progress Info
  requirementBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  requirementTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  requirementText: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    lineHeight: 20,
  },
  
  progressBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  progressTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
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
    backgroundColor: Colors.border,
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
    color: Colors.textSecondary,
    minWidth: 35,
  },
  estimatedTime: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Action Hint
  actionHintBox: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: Layout.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  actionHintTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: Layout.spacing.xs,
  },
  actionHintText: {
    fontSize: Fonts.sizes.md,
    color: '#2E7D32',
    lineHeight: 20,
  },
  
  // Smart Tips
  primaryTip: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
    lineHeight: 20,
  },
  motivationalMessage: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
    lineHeight: 20,
  },
  actionAdvice: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.xs,
    lineHeight: 18,
  },
  estimatedEffort: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // XP Section
  xpLabel: {
    fontSize: Fonts.sizes.md,
    color: Colors.text,
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
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
});