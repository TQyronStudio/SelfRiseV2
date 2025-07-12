import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Fonts, Layout } from '@/src/constants';

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

  const getProgressColor = () => {
    if (hasBonus) return Colors.gold || '#FFD700';
    if (isComplete) return Colors.success || Colors.green;
    return Colors.primary;
  };

  const getProgressText = () => {
    if (hasBonus) {
      return `${currentCount}/3+ ${t('gratitude.bonusGratitude')}`;
    }
    if (isComplete) {
      return `${currentCount}/3 Complete ✓`;
    }
    return `${currentCount}/3`;
  };

  const getSubText = () => {
    if (hasBonus) {
      return 'Amazing! You\'ve added bonus gratitudes! 🌟';
    }
    if (isComplete) {
      return 'Daily gratitude complete! Keep your streak alive! 🔥';
    }
    const remaining = 3 - currentCount;
    return `${remaining} more gratitude${remaining !== 1 ? 's' : ''} needed`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Gratitude Progress</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: Colors.text,
  },
  progressText: {
    fontSize: Fonts.sizes.md,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: Layout.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  bonusIndicator: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold || '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  completeSubText: {
    color: Colors.success || Colors.green,
    fontWeight: '500',
  },
  bonusSubText: {
    color: Colors.gold || '#FFD700',
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
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  completedDot: {
    transform: [{ scale: 1.2 }],
  },
  bonusDot: {
    backgroundColor: Colors.gold || '#FFD700',
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
    color: Colors.white,
  },
});