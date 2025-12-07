import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  AccessibilityInfo
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { XPSourceType } from '../../types/gamification';
import { useI18n } from '../../hooks/useI18n';

const { width: screenWidth } = Dimensions.get('window');

interface XpGain {
  id: string;
  amount: number;
  source: XPSourceType;
  timestamp: number;
}

interface XpNotificationProps {
  visible: boolean;
  xpGains: XpGain[];
  onAnimationComplete?: () => void;
  onDismiss?: () => void;
}

interface BatchedNotification {
  totalXP: number;
  sources: { source: XPSourceType; count: number; totalXP: number }[];
  timestamp: number;
}

export const XpNotification: React.FC<XpNotificationProps> = React.memo(({
  visible,
  xpGains,
  onAnimationComplete,
  onDismiss,
}) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const [batchedData, setBatchedData] = useState<BatchedNotification | null>(null);
  
  // Performance optimization: Detect if we should use reduced motion for many notifications
  const shouldUseReducedMotion = xpGains.length > 3;

  // ========================================
  // BATCHING LOGIC
  // ========================================

  const batchXpGains = (gains: XpGain[]): BatchedNotification => {
    const sourceMap = new Map<XPSourceType, { count: number; totalXP: number; positiveCount: number; negativeCount: number }>();
    let totalXP = 0;

    gains.forEach(gain => {
      // Calculate NET XP change (this is the critical fix)
      totalXP += gain.amount;
      
      if (sourceMap.has(gain.source)) {
        const existing = sourceMap.get(gain.source)!;
        sourceMap.set(gain.source, {
          count: existing.count + 1,
          totalXP: existing.totalXP + gain.amount,
          positiveCount: existing.positiveCount + (gain.amount > 0 ? 1 : 0),
          negativeCount: existing.negativeCount + (gain.amount < 0 ? 1 : 0)
        });
      } else {
        sourceMap.set(gain.source, {
          count: 1,
          totalXP: gain.amount,
          positiveCount: gain.amount > 0 ? 1 : 0,
          negativeCount: gain.amount < 0 ? 1 : 0
        });
      }
    });

    const sources = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      totalXP: data.totalXP
    }));

    return {
      totalXP, // This is now the correct NET XP change
      sources,
      timestamp: Math.max(...gains.map(g => g.timestamp))
    };
  };

  // Update batched data when xpGains change
  useEffect(() => {
    if (xpGains.length > 0) {
      setBatchedData(batchXpGains(xpGains));
    }
  }, [xpGains]);

  // ========================================
  // SOURCE STYLING
  // ========================================

  const getSourceInfo = (source: XPSourceType): { icon: string; nameKey: string; color: string } => {
    switch (source) {
      case XPSourceType.HABIT_COMPLETION:
      case XPSourceType.HABIT_BONUS:
        return {
          icon: '🏃‍♂️',
          nameKey: 'habits',
          color: '#4CAF50',
        };
      case XPSourceType.JOURNAL_ENTRY:
      case XPSourceType.JOURNAL_BONUS:
        return {
          icon: '📝',
          nameKey: 'journalEntries',
          color: '#2196F3',
        };
      case XPSourceType.JOURNAL_BONUS_MILESTONE:
        return {
          icon: '⭐',
          nameKey: 'journalMilestones',
          color: '#2196F3',
        };
      case XPSourceType.GOAL_PROGRESS:
      case XPSourceType.GOAL_COMPLETION:
        return {
          icon: '🎯',
          nameKey: 'goals',
          color: '#FF9800',
        };
      case XPSourceType.GOAL_MILESTONE:
        return {
          icon: '🎯',
          nameKey: 'goalMilestones',
          color: '#FF9800',
        };
      case XPSourceType.HABIT_STREAK_MILESTONE:
      case XPSourceType.JOURNAL_STREAK_MILESTONE:
        return {
          icon: '🔥',
          nameKey: 'streaks',
          color: '#9C27B0',
        };
      case XPSourceType.ACHIEVEMENT_UNLOCK:
        return {
          icon: '🏆',
          nameKey: 'achievements',
          color: '#FFD700',
        };
      case XPSourceType.MONTHLY_CHALLENGE:
        return {
          icon: '📅',
          nameKey: 'monthlyChallenges',
          color: '#673AB7',
        };
      case XPSourceType.XP_MULTIPLIER_BONUS:
        return {
          icon: '⚡',
          nameKey: 'multiplierBonuses',
          color: '#E91E63',
        };
      case XPSourceType.DAILY_LAUNCH:
        return {
          icon: '🌅',
          nameKey: 'dailyLaunches',
          color: '#00BCD4',
        };
      case XPSourceType.RECOMMENDATION_FOLLOW:
        return {
          icon: '💡',
          nameKey: 'recommendations',
          color: '#8BC34A',
        };
      default:
        return {
          icon: '✨',
          nameKey: 'activities',
          color: colors.primary,
        };
    }
  };

  // ========================================
  // ACCESSIBILITY SUPPORT
  // ========================================

  const generateAccessibilityAnnouncement = (data: BatchedNotification): string => {
    const netXP = data.totalXP;

    if (netXP <= 0) {
      if (netXP === 0) {
        return t('gamification.xp.xpNotification.announcements.balanced', { xp: Math.abs(netXP) });
      } else {
        return t('gamification.xp.xpNotification.announcements.decreased', { xp: Math.abs(netXP) });
      }
    }

    if (data.sources.length === 1) {
      const source = data.sources[0];
      const sourceInfo = getSourceInfo(source?.source || XPSourceType.HABIT_COMPLETION);
      const sourceName = t(`gamification.xp.xpNotification.sources.${sourceInfo.nameKey}`);

      if (source?.count === 1) {
        const singularSource = sourceName && sourceName.length > 1 ? sourceName.slice(0, -1) : sourceName;
        return t('gamification.xp.xpNotification.announcements.single', {
          xp: netXP,
          source: singularSource,
          count: 1
        });
      } else {
        return t('gamification.xp.xpNotification.announcements.multipleSame', {
          xp: netXP,
          count: source?.count || 0,
          source: sourceName
        });
      }
    } else {
      const positiveSourceCount = data.sources.filter(s => s.totalXP > 0).length;
      return t('gamification.xp.xpNotification.announcements.multipleMixed', {
        xp: netXP,
        sourceCount: positiveSourceCount
      });
    }
  };

  // Announce to screen readers when XP is gained
  useEffect(() => {
    if (visible && batchedData) {
      const announcement = generateAccessibilityAnnouncement(batchedData);
      
      // Use AccessibilityInfo to announce to screen readers
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [visible, batchedData]);

  // ========================================
  // NOTIFICATION TEXT GENERATION
  // ========================================

  const generateNotificationText = (data: BatchedNotification): string => {
    const netXP = data.totalXP;

    // Handle different XP outcomes with appropriate messaging
    if (netXP <= 0) {
      // For zero or negative net XP, show neutral/informative message
      if (netXP === 0) {
        return `📊 ${t('gamification.xp.xpNotification.messages.balanced')}`;
      } else {
        return `📉 ${t('gamification.xp.xpNotification.messages.reversed')}`;
      }
    }

    // Only show congratulatory messages for NET POSITIVE XP
    if (data.sources.length === 1) {
      const source = data.sources[0];
      const sourceInfo = getSourceInfo(source?.source || XPSourceType.HABIT_COMPLETION);
      const sourceName = t(`gamification.xp.xpNotification.sources.${sourceInfo.nameKey}`);

      if (source?.count === 1) {
        const singularName = sourceName && sourceName.length > 1 ? sourceName.slice(0, -1) : sourceName;
        return `${sourceInfo.icon} ${singularName} ${t('gamification.xp.xpNotification.messages.completed')}`;
      } else {
        return `${sourceInfo.icon} ${source?.count || 0} ${sourceName} ${t('gamification.xp.xpNotification.messages.completed')}`;
      }
    } else {
      // Multiple sources - create summary (only for positive gains)
      const sourceTexts = data.sources
        .filter(source => source.totalXP > 0) // Only include sources with positive contribution
        .map(source => {
          const sourceInfo = getSourceInfo(source?.source || XPSourceType.HABIT_COMPLETION);
          const sourceName = t(`gamification.xp.xpNotification.sources.${sourceInfo.nameKey}`);
          const count = source?.count || 0;
          const displayName = count === 1 && sourceName && sourceName.length > 1
            ? sourceName.slice(0, -1)
            : sourceName;
          return `${count} ${displayName}`;
        });

      if (sourceTexts.length === 0) {
        return `📊 ${t('gamification.xp.xpNotification.messages.updated')}`;
      } else if (sourceTexts.length === 1) {
        return `🎉 ${sourceTexts[0]} ${t('gamification.xp.xpNotification.messages.completed')}`;
      } else if (sourceTexts.length === 2) {
        return `🎉 ${sourceTexts.join(` ${t('gamification.xp.xpNotification.messages.and')} `)} ${t('gamification.xp.xpNotification.messages.completed')}`;
      } else {
        const lastSource = sourceTexts.pop();
        return `🎉 ${sourceTexts.join(', ')}, ${t('gamification.xp.xpNotification.messages.and')} ${lastSource || ''} ${t('gamification.xp.xpNotification.messages.completed')}`;
      }
    }
  };

  // ========================================
  // ANIMATIONS
  // ========================================

  useEffect(() => {
    if (visible && batchedData) {
      // Reset animations
      fadeAnim.setValue(0);
      translateYAnim.setValue(-50);
      scaleAnim.setValue(0.9);

      // Performance optimization: Use faster, simpler animations when many notifications
      const animationDuration = shouldUseReducedMotion ? 150 : 300;
      const springConfig = shouldUseReducedMotion 
        ? { tension: 150, friction: 10 } // Faster, less bouncy
        : { tension: 100, friction: 8 };  // Normal smooth animation

      // Slide down and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        shouldUseReducedMotion 
          ? Animated.timing(translateYAnim, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            })
          : Animated.spring(translateYAnim, {
              toValue: 0,
              ...springConfig,
              useNativeDriver: true,
            }),
        shouldUseReducedMotion
          ? Animated.timing(scaleAnim, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
            })
          : Animated.spring(scaleAnim, {
              toValue: 1,
              ...springConfig,
              useNativeDriver: true,
            }),
      ]).start();

      // Performance optimization: Shorter display time when many notifications
      const dismissDelay = shouldUseReducedMotion ? 2000 : 3000;
      const dismissDuration = shouldUseReducedMotion ? 150 : 250;

      // Auto-dismiss 
      const dismissTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: dismissDuration,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -30,
            duration: dismissDuration,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished && onAnimationComplete) {
            onAnimationComplete();
          }
        });
      }, dismissDelay);

      return () => clearTimeout(dismissTimer);
    }
    
    // Return empty cleanup function for other cases
    return () => {};
  }, [visible, batchedData, fadeAnim, translateYAnim, scaleAnim, onAnimationComplete, shouldUseReducedMotion]);

  // ========================================
  // RENDER
  // ========================================

  if (!visible || !batchedData) {
    return null;
  }

  const styles = createStyles(colors);
  const notificationText = generateNotificationText(batchedData);
  const accessibilityLabel = generateAccessibilityAnnouncement(batchedData);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="assertive"
      importantForAccessibility="yes"
    >
      <View
        style={styles.notification}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
      >
        {/* Notification Text */}
        <Text
          style={styles.messageText}
          numberOfLines={2}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.xpNotification.accessibility.notification', { message: notificationText })}
        >
          {notificationText}
        </Text>

        {/* XP Amount */}
        <View
          style={[
            styles.xpContainer,
            batchedData.totalXP < 0 && styles.xpContainerNegative,
            batchedData.totalXP === 0 && styles.xpContainerNeutral
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.xpNotification.accessibility.amount', {
            amount: batchedData.totalXP,
            type: batchedData.totalXP > 0
              ? t('gamification.xp.xpNotification.accessibility.typeGained')
              : batchedData.totalXP < 0
                ? t('gamification.xp.xpNotification.accessibility.typeLost')
                : t('gamification.xp.xpNotification.accessibility.typeBalanced')
          })}
        >
          <Text
            style={[
              styles.xpLabel,
              batchedData.totalXP < 0 && styles.xpLabelNegative,
              batchedData.totalXP === 0 && styles.xpLabelNeutral
            ]}
            importantForAccessibility="no"
          >
            {batchedData.totalXP > 0 ? '+' : ''}{batchedData.totalXP}
          </Text>
          <Text
            style={[
              styles.xpSuffix,
              batchedData.totalXP < 0 && styles.xpSuffixNegative,
              batchedData.totalXP === 0 && styles.xpSuffixNeutral
            ]}
            importantForAccessibility="no"
          >{t('gamification.xp.xpNotification.unit')}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

// ========================================
// STYLES
// ========================================

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  notification: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: screenWidth - 32,
    minWidth: 280,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
    lineHeight: 20,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  xpContainerNegative: {
    backgroundColor: colors.error + '15',
  },
  xpContainerNeutral: {
    backgroundColor: colors.textSecondary + '15',
  },
  xpLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  xpLabelNegative: {
    color: colors.error,
  },
  xpLabelNeutral: {
    color: colors.textSecondary,
  },
  xpSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 2,
    opacity: 0.8,
  },
  xpSuffixNegative: {
    color: colors.error,
  },
  xpSuffixNeutral: {
    color: colors.textSecondary,
  },
});