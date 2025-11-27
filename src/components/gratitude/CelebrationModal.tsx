import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Fonts, Layout } from '@/src/constants';
import { useXpFeedback } from '../../hooks/useXpFeedback';

const { width: screenWidth } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'daily_complete' | 'streak_milestone' | 'bonus_milestone' | 'level_up';
  title?: string | undefined;
  message?: string | undefined;
  streakDays?: number | undefined;
  bonusCount?: number | undefined;
  xpAmount?: number | undefined; // XP amount for bonus milestones
  // Level-up specific props
  levelUpData?: {
    previousLevel: number;
    newLevel: number;
    levelTitle: string;
    levelDescription?: string;
    rewards?: string[];
    isMilestone: boolean;
  };
  // Optional flag to disable XP animation hooks (for GamificationContext usage)
  disableXpAnimations?: boolean;
}

export default function CelebrationModal({
  visible,
  onClose,
  type,
  title,
  message,
  streakDays,
  bonusCount,
  xpAmount,
  levelUpData,
  disableXpAnimations = false,
}: CelebrationModalProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  // Conditionally use XP feedback hooks only if not disabled
  let triggerHapticFeedback: ((type: 'light' | 'medium' | 'heavy') => Promise<void>) | undefined;
  let playSoundEffect: ((type: 'xp_gain' | 'level_up' | 'milestone') => Promise<void>) | undefined;

  if (!disableXpAnimations) {
    const xpFeedback = useXpFeedback();
    triggerHapticFeedback = xpFeedback.triggerHapticFeedback;
    playSoundEffect = xpFeedback.playSoundEffect;
  }
  


  // Enhanced celebration effects with better timing
  useEffect(() => {
    if (visible) {
      // Announce celebration to screen readers
      const celebrationAnnouncement = (() => {
        switch (type) {
          case 'daily_complete':
            return t('journal.celebration.daily_complete_announcement') || 'Congratulations! You have completed your daily journal practice!';
          case 'streak_milestone':
            return t('journal.celebration.streak_milestone_announcement', { days: streakDays }) || `Amazing! You have reached a ${streakDays} day streak milestone!`;
          case 'bonus_milestone':
            // Epic crown celebration announcement for 10th bonus
            if (bonusCount === 10) {
              return t('journal.celebration.epic_crown_announcement') || 'Legendary achievement! You have reached the ultimate 10th bonus milestone with royal crown celebration!';
            }
            return t('journal.celebration.bonus_milestone_announcement', { count: bonusCount || 0 }) || `Excellent! You have completed ${bonusCount || 0} bonus journal entries!`;
          case 'level_up':
            return t('gamification.celebration.level_up_announcement', { 
              level: levelUpData?.newLevel,
              title: levelUpData?.levelTitle,
              isMilestone: levelUpData?.isMilestone
            }) || `Congratulations! You have reached level ${levelUpData?.newLevel}${levelUpData?.isMilestone ? ', a milestone level' : ''}!`;
          default:
            return t('common.celebration.general_announcement') || 'Congratulations on your achievement!';
        }
      })();

      AccessibilityInfo.announceForAccessibility(celebrationAnnouncement);


      
      // Trigger haptic feedback based on celebration type with proper timing
      const triggerEffects = async () => {
        // Initial immediate feedback
        switch (type) {
          case 'level_up':
            if (levelUpData?.isMilestone) {
              if (triggerHapticFeedback) await triggerHapticFeedback('heavy');
              // Second burst for milestone
              setTimeout(async () => {
                if (triggerHapticFeedback) await triggerHapticFeedback('medium');
              }, 300);
              if (playSoundEffect) await playSoundEffect('milestone');
            } else {
              if (triggerHapticFeedback) await triggerHapticFeedback('medium');
              if (playSoundEffect) await playSoundEffect('level_up');
            }
            break;
          case 'streak_milestone':
            if (triggerHapticFeedback) await triggerHapticFeedback('medium');
            // Extended celebration for long streaks
            if (streakDays && streakDays >= 100) {
              setTimeout(async () => {
                if (triggerHapticFeedback) await triggerHapticFeedback('light');
              }, 400);
            }
            if (playSoundEffect) await playSoundEffect('milestone');
            break;
          case 'bonus_milestone':
            // Epic crown celebration (10th bonus) gets enhanced haptic feedback
            if (bonusCount === 10) {
              // Royal crown celebration - triple haptic burst
              if (triggerHapticFeedback) {
                await triggerHapticFeedback('heavy');
                setTimeout(async () => {
                  if (triggerHapticFeedback) await triggerHapticFeedback('medium');
                }, 200);
                setTimeout(async () => {
                  if (triggerHapticFeedback) await triggerHapticFeedback('medium');
                }, 400);
              }
              if (playSoundEffect) await playSoundEffect('milestone');
            } else {
              // Standard bonus celebrations
              if (triggerHapticFeedback) await triggerHapticFeedback('light');
              if (playSoundEffect) await playSoundEffect('xp_gain');
            }
            break;
          default:
            if (triggerHapticFeedback) await triggerHapticFeedback('light');
            break;
        }
      };

      triggerEffects();
    } else {
      return undefined;
    }
  }, [visible, type, levelUpData?.isMilestone, streakDays, triggerHapticFeedback, playSoundEffect]);

  const getDefaultContent = () => {
    switch (type) {
      case 'daily_complete':
        return {
          title: t('journal.daily_complete_title'),
          message: t('journal.daily_complete_message'),
          emoji: '🎉',
        };
      case 'streak_milestone':
        // Použít speciální texty pro klíčové milníky nebo generický text
        const hasSpecialMilestone = [7, 14, 21, 100, 365, 1000].includes(streakDays || 0);
        const milestoneKey = hasSpecialMilestone ? `streakMilestone${streakDays}` : 'streakMilestone_generic';
        
        return {
          title: t(`journal.${milestoneKey}_title`),
          message: hasSpecialMilestone 
            ? t(`journal.${milestoneKey}_text`)
            : t('journal.streakMilestone_generic_text').replace('{days}', String(streakDays)),
          emoji: '🏆',
        };
      case 'bonus_milestone':
        // Bonus count system: 1st⭐, 5th🔥, 10th👑
        const bonusEmoji = bonusCount === 1 ? '⭐' : bonusCount === 5 ? '🔥' : '👑';
        const bonusCountSafe = bonusCount || 1; // Fallback to 1 if null
        const milestoneNameMap = { 1: 'milestone_first', 5: 'milestone_fifth', 10: 'milestone_tenth' };
        const milestoneName = t(`journal.celebration.${milestoneNameMap[bonusCountSafe as keyof typeof milestoneNameMap] || 'milestone_first'}`) || 'Bonus';

        return {
          title: t(`journal.bonusMilestone${bonusCountSafe}_title`) || `${milestoneName} Bonus Entry!`,
          message: t(`journal.bonusMilestone${bonusCountSafe}_text`) || `Amazing! You've written ${bonusCountSafe} bonus ${bonusCountSafe === 1 ? 'entry' : 'entries'} today!`,
          emoji: bonusEmoji,
        };
      case 'level_up':
        if (!levelUpData) {
          return {
            title: t('journal.celebration.level_up_title') || 'Level Up! 🎉',
            message: t('journal.celebration.level_up_message') || 'Congratulations on reaching a new level!',
            emoji: '🎉',
          };
        }

        const levelEmoji = levelUpData.isMilestone ? '🏆' : '⬆️';
        const milestoneText = levelUpData.isMilestone ? t('journal.celebration.milestone_suffix') : '';

        return {
          title: `Level ${levelUpData.newLevel}${milestoneText} ${levelEmoji}`,
          message: levelUpData.levelDescription || `${t('journal.celebration.unlocked_prefix')} ${levelUpData.levelTitle}!`,
          emoji: levelEmoji,
        };
      default:
        return {
          title: 'Congratulations!',
          message: 'Great job!',
          emoji: '✨',
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    message: message || getDefaultContent().message,
    emoji: getDefaultContent().emoji,
  };


  const modalAccessibilityLabel = (() => {
    switch (type) {
      case 'daily_complete':
        return t('journal.celebration.daily_complete_modal') || 'Daily journal completion celebration';
      case 'streak_milestone':
        return t('journal.celebration.streak_milestone_modal', { days: streakDays }) || `${streakDays} day streak milestone celebration`;
      case 'bonus_milestone':
        // Epic crown celebration modal accessibility
        if (bonusCount === 10) {
          return t('journal.celebration.epic_crown_modal') || 'Epic royal crown celebration for 10th bonus milestone achievement';
        }
        return t('journal.celebration.bonus_milestone_modal', { count: bonusCount || 0 }) || `${bonusCount || 0} bonus entries celebration`;
      case 'level_up':
        return t('gamification.celebration.level_up_modal', {
          level: levelUpData?.newLevel,
          isMilestone: levelUpData?.isMilestone
        }) || `Level ${levelUpData?.newLevel} achievement${levelUpData?.isMilestone ? ' milestone' : ''} celebration`;
      default:
        return t('common.celebration.modal') || 'Achievement celebration';
    }
  })();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    modal: {
      backgroundColor: colors.backgroundSecondary, // Modal background
      borderRadius: 20,
      paddingVertical: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.85,
      width: '100%',
      // Removed all shadows for AMOLED-friendly design
    },
    emoji: {
      fontSize: 64,
      marginBottom: Layout.spacing.md,
    },
    title: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    message: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Layout.spacing.lg,
    },
    streakBadge: {
      backgroundColor: colors.primary, // Keep vibrant primary color
      borderRadius: 50,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      marginBottom: Layout.spacing.lg,
    },
    streakNumber: {
      fontSize: Fonts.sizes.xxl || 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    streakLabel: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    button: {
      backgroundColor: colors.primary, // Keep vibrant primary color
      borderRadius: 12,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.xl,
      minWidth: 120,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    // Level-up specific styles
    levelUpContainer: {
      alignItems: 'center',
      marginBottom: Layout.spacing.lg,
    },
    milestoneBadge: {
      backgroundColor: '#FFD700', // Keep vibrant gold for milestone
      // Removed shadows
    },
    levelTitle: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginTop: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    rewardsContainer: {
      backgroundColor: colors.cardBackgroundElevated, // Elevated card
      borderRadius: 8,
      padding: Layout.spacing.md,
      marginTop: Layout.spacing.sm,
      width: '100%',
    },
    rewardsTitle: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.sm,
      textAlign: 'center',
    },
    rewardItem: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 2,
    },
    // XP Badge styles
    xpBadge: {
      backgroundColor: colors.success, // Keep vibrant success color
      borderRadius: 12,
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.md,
      alignItems: 'center',
      marginTop: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
      // Removed shadows
    },
    xpLabel: {
      fontSize: Fonts.sizes.sm,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    xpAmount: {
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },

    // EPIC CROWN CELEBRATION STYLES FOR 10TH BONUS (bonusCount === 10)
    epicModal: {
      backgroundColor: colors.backgroundSecondary, // Modal background
      borderRadius: 24, // More rounded for premium feel
      paddingVertical: Layout.spacing.xl * 1.5,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      maxWidth: screenWidth * 0.9, // Slightly wider for epic impact
      width: '100%',
      borderWidth: 3,
      borderColor: '#FFD700', // Keep royal golden border
      // Removed shadows
    },

    epicEmoji: {
      fontSize: 80, // Larger crown emoji for epic celebration
      marginBottom: Layout.spacing.lg,
      textShadowColor: '#FFD700',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },

    epicTitle: {
      fontSize: Fonts.sizes.xxl || 28,
      fontWeight: 'bold',
      color: '#B8860B', // Keep darker gold for readability
      textAlign: 'center',
      marginBottom: Layout.spacing.md,
      textShadowColor: 'rgba(255, 215, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    epicMessage: {
      fontSize: Fonts.sizes.lg,
      color: '#DAA520', // Keep royal gold text
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: Layout.spacing.xl,
      fontWeight: '600',
    },

    epicBadge: {
      backgroundColor: '#FFD700', // Keep pure gold background
      borderRadius: 60,
      paddingVertical: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.xl,
      alignItems: 'center',
      marginBottom: Layout.spacing.xl,
      borderWidth: 2,
      borderColor: '#FFA500', // Keep orange gold border
      // Removed shadows
    },

    epicBadgeNumber: {
      fontSize: 42, // Larger number for epic badge
      fontWeight: 'bold',
      color: '#8B4513', // Keep dark brown for contrast on gold
      textShadowColor: 'rgba(255, 255, 255, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },

    epicBadgeLabel: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: '#8B4513', // Keep dark brown for contrast on gold
      letterSpacing: 2,
      textShadowColor: 'rgba(255, 255, 255, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },

    epicXpBadge: {
      backgroundColor: '#FFD700', // Keep royal gold XP badge
      borderRadius: 16,
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.lg,
      alignItems: 'center',
      marginTop: Layout.spacing.md,
      marginBottom: Layout.spacing.lg,
      borderWidth: 2,
      borderColor: '#FFA500',
      // Removed shadows
    },

    epicXpLabel: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: '#8B4513', // Keep dark brown for contrast
      marginBottom: 4,
      textShadowColor: 'rgba(255, 255, 255, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },

    epicXpAmount: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: '#8B4513', // Keep dark brown for contrast
      textShadowColor: 'rgba(255, 255, 255, 0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={modalAccessibilityLabel}
      accessibilityViewIsModal={true}
    >
      <View 
        style={styles.overlay}
        accessible={true}
        accessibilityRole="none"
        accessibilityElementsHidden={false}
      >
        
        <View 
          style={[
            styles.modal,
            type === 'bonus_milestone' && bonusCount === 10 && styles.epicModal, // Epic royal styling for 10th bonus
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={modalAccessibilityLabel}
        >
          <Text 
            style={[
              styles.emoji,
              type === 'bonus_milestone' && bonusCount === 10 && styles.epicEmoji, // Epic crown animation
            ]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={t(`gamification.celebration.emoji.${type}`) || `${content.emoji} celebration emoji`}
          >
            {content.emoji}
          </Text>
          
          <Text 
            style={[
              styles.title,
              type === 'bonus_milestone' && bonusCount === 10 && styles.epicTitle, // Epic royal title
            ]}
            accessible={true}
            accessibilityRole="header"
          >
            {content.title}
          </Text>
          
          <Text 
            style={[
              styles.message,
              type === 'bonus_milestone' && bonusCount === 10 && styles.epicMessage, // Epic royal message
            ]}
            accessible={true}
            accessibilityRole="text"
          >
            {content.message}
          </Text>
          
          {type === 'streak_milestone' && streakDays && (
            <View 
              style={styles.streakBadge}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={t('journal.celebration.streak_badge_accessibility', { days: streakDays }) || `${streakDays} day streak achievement badge`}
            >
              <Text 
                style={styles.streakNumber}
                importantForAccessibility="no"
              >
                {streakDays}
              </Text>
              <Text 
                style={styles.streakLabel}
                importantForAccessibility="no"
              >
                DAY{streakDays !== 1 ? 'S' : ''}
              </Text>
            </View>
          )}
          
          {type === 'bonus_milestone' && bonusCount && (
            <View 
              style={[
                styles.streakBadge,
                bonusCount === 10 && styles.epicBadge, // Epic royal badge for crown achievement
              ]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={t('journal.celebration.bonus_badge_accessibility', { count: bonusCount }) || `${bonusCount} bonus ${bonusCount !== 1 ? 'entries' : 'entry'} achievement badge`}
            >
              <Text 
                style={[
                  styles.streakNumber,
                  bonusCount === 10 && styles.epicBadgeNumber, // Epic styling for crown number
                ]}
                importantForAccessibility="no"
              >
                {bonusCount}
              </Text>
              <Text 
                style={[
                  styles.streakLabel,
                  bonusCount === 10 && styles.epicBadgeLabel, // Epic styling for crown label
                ]}
                importantForAccessibility="no"
              >
                BONUS{bonusCount !== 1 ? 'ES' : ''}
              </Text>
            </View>
          )}

          {/* XP amount display for bonus milestones */}
          {type === 'bonus_milestone' && xpAmount && (
            <View style={[
              styles.xpBadge,
              bonusCount === 10 && styles.epicXpBadge, // Epic royal XP badge for crown
            ]}>
              <Text style={[
                styles.xpLabel,
                bonusCount === 10 && styles.epicXpLabel, // Epic XP label styling
              ]}>{t('journal.celebration.xp_earned')}</Text>
              <Text style={[
                styles.xpAmount,
                bonusCount === 10 && styles.epicXpAmount, // Epic XP amount styling
              ]}>+{xpAmount}</Text>
            </View>
          )}
          
          {type === 'level_up' && levelUpData && (
            <View 
              style={styles.levelUpContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={t('gamification.celebration.level_up_section_accessibility', { 
                level: levelUpData.newLevel,
                title: levelUpData.levelTitle,
                isMilestone: levelUpData.isMilestone
              }) || `Level ${levelUpData.newLevel} achievement${levelUpData.isMilestone ? ' milestone' : ''} details`}
            >
              <View 
                style={[styles.streakBadge, levelUpData.isMilestone && styles.milestoneBadge]}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={t('gamification.celebration.level_badge_accessibility', { 
                  level: levelUpData.newLevel,
                  isMilestone: levelUpData.isMilestone
                }) || `Level ${levelUpData.newLevel}${levelUpData.isMilestone ? ' milestone' : ''} badge`}
              >
                <Text 
                  style={styles.streakNumber}
                  importantForAccessibility="no"
                >
                  {levelUpData.newLevel}
                </Text>
                <Text 
                  style={styles.streakLabel}
                  importantForAccessibility="no"
                >
                  LEVEL
                </Text>
              </View>
              
              <Text 
                style={styles.levelTitle}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={t('gamification.celebration.level_title_accessibility', { title: levelUpData.levelTitle }) || `Level title: ${levelUpData.levelTitle}`}
              >
                {levelUpData.levelTitle}
              </Text>
              
              {levelUpData.rewards && levelUpData.rewards.length > 0 && (
                <View 
                  style={styles.rewardsContainer}
                  accessible={true}
                  accessibilityRole="list"
                  accessibilityLabel={t('gamification.celebration.rewards_section_accessibility', { 
                    count: levelUpData.rewards.length
                  }) || `New rewards list with ${levelUpData.rewards.length} items`}
                >
                  <Text
                    style={styles.rewardsTitle}
                    accessible={true}
                    accessibilityRole="header"
                  >
                    {t('gamification.celebration.rewards_title') || t('journal.celebration.rewards_title') || 'New Rewards:'}
                  </Text>
                  {levelUpData.rewards.map((reward, index) => (
                    <Text 
                      key={index} 
                      style={styles.rewardItem}
                      accessible={true}
                      accessibilityRole="text"
                      accessibilityLabel={t('gamification.celebration.reward_item_accessibility', { 
                        index: index + 1,
                        reward
                      }) || `Reward ${index + 1}: ${reward}`}
                    >
                      • {reward}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('gamification.celebration.continue_button_accessibility') || 'Continue and close celebration'}
            accessibilityHint={t('gamification.celebration.continue_button_hint') || 'Tap to close this celebration and return to the app'}
          >
            <Text 
              style={styles.buttonText}
              accessible={false}
            >
              {t('common.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}