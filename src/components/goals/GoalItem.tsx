import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Goal, GoalStatus } from '../../types/goal';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { ConfirmationModal } from '../common';

interface GoalItemProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onViewStats: () => void;
  onAddProgress: () => void;
  onDrag?: () => void;
  isDragging?: boolean;
  isEditMode: boolean;
}

export const GoalItem = React.memo(({ goal, onEdit, onDelete, onViewStats, onAddProgress, onDrag, isDragging, isEditMode }: GoalItemProps) => {
  const { t } = useI18n();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Wiggle animace pro edit mode
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isEditMode) {
      // Náhodný delay pro každou položku (0-500ms)
      const randomDelay = Math.random() * 500;
      setTimeout(() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(-1, { duration: 150 }), // Mírně doleva
            withTiming(1, { duration: 150 }),  // Mírně doprava
            withTiming(0, { duration: 150 })   // Zpět na střed
          ),
          -1, // Nekonečné opakování
          true // Povolí obrácení sekvence pro plynulejší smyčku
        );
      }, randomDelay);
    } else {
      // Když režim úprav skončí, vrátíme rotaci na nulu
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [isEditMode, rotation]);

  // Animovaný styl pro wiggle efekt
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.COMPLETED:
        return Colors.success;
      case GoalStatus.ACTIVE:
        return Colors.primary;
      case GoalStatus.PAUSED:
        return Colors.warning;
      case GoalStatus.ARCHIVED:
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusText = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.COMPLETED:
        return t('goals.completed');
      case GoalStatus.ACTIVE:
        return 'Active';
      case GoalStatus.PAUSED:
        return 'Paused';
      case GoalStatus.ARCHIVED:
        return 'Archived';
      default:
        return status;
    }
  };

  const progressPercentage = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const isCompleted = goal.status === GoalStatus.COMPLETED;

  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={[styles.status, { color: getStatusColor(goal.status) }]}>
            {getStatusText(goal.status)}
          </Text>
        </View>
        <View style={styles.actions}>
          {onDrag && (
            <TouchableOpacity style={styles.actionButton} onLongPress={onDrag}>
              <Ionicons name="reorder-three-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={onAddProgress}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onViewStats}>
            <Ionicons name="stats-chart" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {goal.description && (
        <Text style={styles.description}>{goal.description}</Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: isCompleted ? Colors.success : Colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {goal.targetDate && (
        <Text style={styles.targetDate}>
          Target: {goal.targetDate}
        </Text>
      )}

      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>{t('goals.form.category')}: </Text>
        <Text style={styles.categoryValue}>{t(`goals.category.${goal.category.toLowerCase()}`)}</Text>
      </View>

      <ConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title={t('goals.deleteGoal')}
        message={t('goals.deleteMessage')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetDate: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  categoryValue: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
});