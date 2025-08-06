import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Particle Effects */}
        <ParticleEffects
          visible={showParticles}
          type={getParticleType()}
          intensity={getParticleIntensity()}
          duration={3000}
          onComplete={() => setShowParticles(false)}
        />
        <View style={styles.modal}>
          <Text style={styles.emoji}>{content.emoji}</Text>
          
          <Text style={styles.title}>{content.title}</Text>
          
          <Text style={styles.message}>{content.message}</Text>
          
          {type === 'streak_milestone' && streakDays && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{streakDays}</Text>
              <Text style={styles.streakLabel}>DAY{streakDays !== 1 ? 'S' : ''}</Text>
            </View>
          )}
          
          {type === 'bonus_milestone' && bonusCount && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{bonusCount}</Text>
              <Text style={styles.streakLabel}>BONUS{bonusCount !== 1 ? 'ES' : ''}</Text>
            </View>
          )}
          
          {type === 'level_up' && levelUpData && (
            <View style={styles.levelUpContainer}>
              <View style={[styles.streakBadge, levelUpData.isMilestone && styles.milestoneBadge]}>
                <Text style={styles.streakNumber}>{levelUpData.newLevel}</Text>
                <Text style={styles.streakLabel}>LEVEL</Text>
              </View>
              
              <Text style={styles.levelTitle}>{levelUpData.levelTitle}</Text>
              
              {levelUpData.rewards && levelUpData.rewards.length > 0 && (
                <View style={styles.rewardsContainer}>
                  <Text style={styles.rewardsTitle}>New Rewards:</Text>
                  {levelUpData.rewards.map((reward, index) => (
                    <Text key={index} style={styles.rewardItem}>
                      • {reward}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>
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