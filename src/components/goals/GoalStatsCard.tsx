import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal, GoalStats, GoalStatus, GoalTimelineStatus } from '../../types/goal';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';

interface GoalStatsCardProps {
  goal: Goal;
  stats: GoalStats;
}

export function GoalStatsCard({ goal, stats }: GoalStatsCardProps) {
  const { t } = useI18n();

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

  const getTimelineStatusColor = (status: GoalTimelineStatus) => {
    switch (status) {
      case 'wayAhead':
        return Colors.primary; // Blue
      case 'ahead':
        return Colors.success; // Green
      case 'onTrack':
        return Colors.success; // Green
      case 'behind':
        return Colors.warning; // Orange/Yellow
      case 'wayBehind':
        return Colors.error; // Red
      default:
        return Colors.textSecondary;
    }
  };

  const getTimelineStatusText = (status: GoalTimelineStatus) => {
    switch (status) {
      case 'wayAhead':
        return t('goals.dashboard.wayAhead');
      case 'ahead':
        return t('goals.dashboard.ahead');
      case 'onTrack':
        return t('goals.dashboard.onTrack');
      case 'behind':
        return t('goals.dashboard.behind');
      case 'wayBehind':
        return t('goals.dashboard.wayBehind');
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Goal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goal Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, { color: getStatusColor(goal.status) }]}>
            {getStatusText(goal.status)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Progress:</Text>
          <Text style={styles.infoValue}>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{goal.category}</Text>
        </View>
        {goal.targetDate && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Date:</Text>
            <Text style={styles.infoValue}>{goal.targetDate}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.section}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Completion</Text>
            <Text style={styles.progressPercentage}>
              {stats.completionPercentage.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(stats.completionPercentage, 100)}%`,
                  backgroundColor: goal.status === GoalStatus.COMPLETED ? Colors.success : Colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.progressEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.daysActive}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageDaily.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getTimelineStatusColor(stats.timelineStatus || 'onTrack') }]}>
              {getTimelineStatusText(stats.timelineStatus || 'onTrack')}
            </Text>
            <Text style={styles.statLabel}>Timeline Status</Text>
          </View>
        </View>
      </View>

      {/* Predictions */}
      {stats.estimatedCompletionDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Predictions</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Completion:</Text>
            <Text style={styles.infoValue}>{stats.estimatedCompletionDate}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
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
  progressLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  progressPercentage: {
    fontSize: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
});