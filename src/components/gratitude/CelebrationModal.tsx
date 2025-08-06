import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';
import { ParticleEffects } from '../gamification/ParticleEffects';
import { useXpFeedback } from '../../contexts/XpAnimationContext';

const { width: screenWidth } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'daily_complete' | 'streak_milestone' | 'bonus_milestone' | 'level_up';
  title?: string | undefined;
  message?: string | undefined;
  streakDays?: number | undefined;
  bonusCount?: number | undefined;
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
  levelUpData,
  disableXpAnimations = false,
}: CelebrationModalProps) {
  const { t } = useI18n();
  
  // Conditionally use XP feedback hooks only if not disabled
  let triggerHapticFeedback: ((type: 'light' | 'medium' | 'heavy') => Promise<void>) | undefined;
  let playSoundEffect: ((type: 'xp_gain' | 'level_up' | 'milestone') => Promise<void>) | undefined;
  
  if (!disableXpAnimations) {
    const xpFeedback = useXpFeedback();
    triggerHapticFeedback = xpFeedback.triggerHapticFeedback;
    playSoundEffect = xpFeedback.playSoundEffect;
  }
  const [showParticles, setShowParticles] = useState(false);

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

      // Delay particle effects slightly for better visual flow
      const particleDelay = setTimeout(() => {
        setShowParticles(true);
      }, 200);
      
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
            if (triggerHapticFeedback) await triggerHapticFeedback('light');
            if (playSoundEffect) await playSoundEffect('xp_gain');
            break;
          default:
            if (triggerHapticFeedback) await triggerHapticFeedback('light');
            break;
        }
      };

      triggerEffects();
      
      return () => {
        clearTimeout(particleDelay);
      };
    } else {
      setShowParticles(false);
      return undefined;
    }
  }, [visible, type, levelUpData?.isMilestone, streakDays, triggerHapticFeedback, playSoundEffect]);

  const getDefaultContent = () => {
    switch (type) {
      case 'daily_complete':
        return {
          title: 'Congratulations! 🎉',
          message: 'You\'ve completed your daily journal practice!',
          emoji: '🎉',
        };
      case 'streak_milestone':
        // Použít speciální texty pro klíčové milníky nebo generický text
        const hasSpecialMilestone = [21, 100, 365, 1000].includes(streakDays || 0);
        const milestoneKey = hasSpecialMilestone ? `streakMilestone${streakDays}` : 'streakMilestone_generic';
        
        return {
          title: t(`journal.${milestoneKey}_title`),
          message: hasSpecialMilestone 
            ? t(`journal.${milestoneKey}_text`)
            : t('journal.streakMilestone_generic_text').replace('{days}', String(streakDays)),
          emoji: '🏆',
        };
      case 'bonus_milestone':
        const bonusEmoji = bonusCount === 1 ? '⭐' : bonusCount === 5 ? '🔥' : '👑';
        const bonusCountSafe = bonusCount || 1; // Fallback to 1 if null
        return {
          title: t(`journal.bonusMilestone${bonusCountSafe}_title`) || `Bonus Milestone ${bonusEmoji}`,
          message: t(`journal.bonusMilestone${bonusCountSafe}_text`) || `You've reached ${bonusCountSafe} bonus entries today!`,
          emoji: bonusEmoji,
        };
      case 'level_up':
        if (!levelUpData) {
          return {
            title: 'Level Up! 🎉',
            message: 'Congratulations on reaching a new level!',
            emoji: '🎉',
          };
        }
        
        const levelEmoji = levelUpData.isMilestone ? '🏆' : '⬆️';
        const milestoneText = levelUpData.isMilestone ? ' Milestone!' : '';
        
        return {
          title: `Level ${levelUpData.newLevel}${milestoneText} ${levelEmoji}`,
          message: levelUpData.levelDescription || `You've unlocked ${levelUpData.levelTitle}!`,
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

  // Get particle effect type based on celebration type
  const getParticleType = (): 'level_up' | 'milestone' | 'achievement' | 'celebration' => {
    switch (type) {
      case 'level_up':
        return levelUpData?.isMilestone ? 'milestone' : 'level_up';
      case 'streak_milestone':
        return 'milestone';
      case 'bonus_milestone':
        return 'achievement';
      default:
        return 'celebration';
    }
  };

  const getParticleIntensity = (): 'low' | 'medium' | 'high' => {
    switch (type) {
      case 'level_up':
        return levelUpData?.isMilestone ? 'high' : 'medium';
      case 'streak_milestone':
        return (streakDays && streakDays >= 100) ? 'high' : 'medium';
      default:
        return 'low';
    }
  };

  const modalAccessibilityLabel = (() => {
    switch (type) {
      case 'daily_complete':
        return t('journal.celebration.daily_complete_modal') || 'Daily journal completion celebration';
      case 'streak_milestone':
        return t('journal.celebration.streak_milestone_modal', { days: streakDays }) || `${streakDays} day streak milestone celebration`;
      case 'bonus_milestone':
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
        {/* Particle Effects */}
        <ParticleEffects
          visible={showParticles}
          type={getParticleType()}
          intensity={getParticleIntensity()}
          duration={3000}
          onComplete={() => setShowParticles(false)}
        />
        <View 
          style={styles.modal}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={modalAccessibilityLabel}
        >
          <Text 
            style={styles.emoji}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={t(`gamification.celebration.emoji.${type}`) || `${content.emoji} celebration emoji`}
          >
            {content.emoji}
          </Text>
          
          <Text 
            style={styles.title}
            accessible={true}
            accessibilityRole="header"
          >
            {content.title}
          </Text>
          
          <Text 
            style={styles.message}
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
              style={styles.streakBadge}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={t('journal.celebration.bonus_badge_accessibility', { count: bonusCount }) || `${bonusCount} bonus ${bonusCount !== 1 ? 'entries' : 'entry'} achievement badge`}
            >
              <Text 
                style={styles.streakNumber}
                importantForAccessibility="no"
              >
                {bonusCount}
              </Text>
              <Text 
                style={styles.streakLabel}
                importantForAccessibility="no"
              >
                BONUS{bonusCount !== 1 ? 'ES' : ''}
              </Text>
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
                    {t('gamification.celebration.rewards_title') || 'New Rewards:'}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Fonts.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  message: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  streakBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  streakNumber: {
    fontSize: Fonts.sizes.xxl || 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  streakLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.xl,
    minWidth: 120,
  },
  buttonText: {
    color: Colors.white,
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
    backgroundColor: '#FFD700', // Gold color for milestone levels
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  levelTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  rewardsContainer: {
    backgroundColor: Colors.background || '#F8F9FA',
    borderRadius: 8,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
    width: '100%',
  },
  rewardsTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  rewardItem: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
});