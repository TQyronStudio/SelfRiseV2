import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Fonts, Layout } from '@/src/constants';
import { useTheme } from '@/src/contexts/ThemeContext';
import { HelpTooltip } from '@/src/components/common';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';

interface DailyGratitudeProgressProps {
  currentCount: number;
  isComplete: boolean;
  hasBonus: boolean;
}

export default function DailyGratitudeProgress({
  currentCount,
  isComplete,
  hasBonus
}: DailyGratitudeProgressProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { state } = useGratitude();

  const streakInfo = state.streakInfo;
  const progressRef = useRef<View>(null);

  // Register as tutorial target
  const { registerTarget, unregisterTarget } = useTutorialTarget(
    'todays-journal-progress',
    progressRef
  );

  useEffect(() => {
    registerTarget();

    return () => {
      unregisterTarget();
    };
  }, [registerTarget, unregisterTarget]);

  const getProgressColor = () => {
    if (hasBonus) return colors.gold || '#FFD700';
    if (isComplete) return colors.success || colors.green;
    return colors.primary;
  };

  const getProgressText = () => {
    if (hasBonus) {
      return `${currentCount}/3+ ${t('journal.bonusGratitude')}`;
    }
    if (isComplete) {
      return `${currentCount}/3 ${t('journal.progress.complete')}`;
    }
    return `${currentCount}/3`;
  };

  const getSubText = () => {
    if (hasBonus) {
      return t('journal.progress.bonusAmazing');
    }
    if (isComplete) {
      return t('journal.progress.dailyComplete');
    }
    const remaining = 3 - currentCount;
    return t('journal.progress.entriesNeeded', { count: remaining });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    title: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.text,
    },
    progressText: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: Layout.spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    bonusIndicator: {
      position: 'absolute',
      right: -4,
      top: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.gold || '#FFD700',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bonusText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    subText: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    completeSubText: {
      color: colors.success || colors.green,
      fontWeight: '500',
    },
    bonusSubText: {
      color: colors.gold || '#FFD700',
      fontWeight: '500',
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    completedDot: {
      transform: [{ scale: 1.2 }],
    },
    bonusDot: {
      backgroundColor: colors.gold || '#FFD700',
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    bonusDotText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    streakContainer: {
      marginTop: Layout.spacing.md,
      paddingTop: Layout.spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    streakHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    streakContent: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },
    streakItem: {
      alignItems: 'center',
      flex: 1,
    },
    streakNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    streakNumber: {
      fontSize: Fonts.sizes.xl,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    frozenStreakNumber: {
      color: '#4A90E2',
      textShadowColor: 'rgba(74, 144, 226, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    streakLabel: {
      fontSize: Fonts.sizes.xs,
      color: colors.textSecondary,
      textAlign: 'center',
      textTransform: 'uppercase',
      fontWeight: '500',
    },
    frozenStreakLabel: {
      color: '#4A90E2',
      fontWeight: 'bold',
    },
    streakDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
      marginHorizontal: Layout.spacing.md,
    },
  });

  return (
    <View ref={progressRef} style={styles.container} nativeID="todays-journal-progress">
      <View style={styles.header}>
        <Text style={styles.title}>{t('journal.progress.title')}</Text>
        <Text style={[styles.progressText, { color: getProgressColor() }]}>
          {getProgressText()}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${Math.min((currentCount / 3) * 100, 100)}%`,
              backgroundColor: getProgressColor(),
            }
          ]} 
        />
        {hasBonus && (
          <View style={styles.bonusIndicator}>
            <Text style={styles.bonusText}>+</Text>
          </View>
        )}
      </View>
      
      <Text style={[
        styles.subText,
        isComplete && styles.completeSubText,
        hasBonus && styles.bonusSubText,
      ]}>
        {getSubText()}
      </Text>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {[1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index <= currentCount && styles.completedDot,
              index <= currentCount && { backgroundColor: getProgressColor() },
            ]}
          />
        ))}
        {hasBonus && (
          <View style={[styles.dot, styles.bonusDot]}>
            <Text style={styles.bonusDotText}>+{currentCount - 3}</Text>
          </View>
        )}
      </View>
      
      {/* Streak Display */}
      {streakInfo && (
        <View style={styles.streakContainer}>
          <View style={styles.streakHeaderRow}>
            <View style={styles.streakContent}>
              <View style={styles.streakItem}>
                <View style={styles.streakNumberContainer}>
                  <Text style={[
                    styles.streakNumber,
                    streakInfo.isFrozen && styles.frozenStreakNumber
                  ]}>
                    {streakInfo.isFrozen ? '🧊 ' : ''}{streakInfo.currentStreak}
                  </Text>
                  {streakInfo.isFrozen && (
                    <HelpTooltip
                      helpKey="journal.debtRecovery"
                      iconSize={12}
                      maxWidth={280}
                    />
                  )}
                </View>
                <Text style={[
                  styles.streakLabel,
                  streakInfo.isFrozen && styles.frozenStreakLabel
                ]}>
                  {streakInfo.isFrozen ? t('journal.frozenStreak') : t('journal.currentStreak')}
                </Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <Text style={styles.streakNumber}>{streakInfo.longestStreak}</Text>
                <Text style={styles.streakLabel}>{t('journal.longestStreak')}</Text>
              </View>
            </View>
            <HelpTooltip
              helpKey="journal.selfRiseStreak"
              iconSize={16}
              maxWidth={300}
              variant="prominent"
            />
          </View>
        </View>
      )}
    </View>
  );
}