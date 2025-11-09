import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, GoalStatus, GoalCategory } from '@/src/types/goal';
import { useGoalsData } from '@/src/hooks/useGoalsData';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants/dimensions';

interface GoalPerformanceDashboardProps {
  onViewGoalStats?: (goalId: string) => void;
}

export function GoalPerformanceDashboard({ onViewGoalStats }: GoalPerformanceDashboardProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const {
    activeGoals,
    completedGoals,
    getOverdueGoals,
    getGoalsDueThisWeek,
    getGoalsDueThisMonth,
    getGoalsOnTrack,
    getGoalsBehindSchedule,
    getCompletionRate,
    getCategoryStats,
  } = useGoalsData();

  const overdueGoals = getOverdueGoals();
  const dueThisWeek = getGoalsDueThisWeek();
  const dueThisMonth = getGoalsDueThisMonth();
  const onTrackGoals = getGoalsOnTrack();
  const behindScheduleGoals = getGoalsBehindSchedule();
  const completionRate = getCompletionRate();
  const categoryStats = getCategoryStats();

  const StatCard = ({ title, value, color, icon, onPress }: {
    title: string;
    value: string | number;
    color: string;
    icon: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <Ionicons name={icon as any} size={20} color={color} />
          <Text style={styles.statCardTitle}>{title}</Text>
        </View>
        <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  const CategoryCard = ({ category, stats }: {
    category: GoalCategory;
    stats: { activeCount: number; completedCount: number; totalCount: number; completionRate: number };
  }) => {
    const getCategoryIcon = (category: GoalCategory): string => {
      switch (category) {
        case GoalCategory.HEALTH: return 'heart';
        case GoalCategory.CAREER: return 'briefcase';
        case GoalCategory.LEARNING: return 'school';
        case GoalCategory.PERSONAL: return 'person';
        case GoalCategory.FINANCIAL: return 'card';
        case GoalCategory.OTHER: return 'ellipsis-horizontal';
        default: return 'flag';
      }
    };

    const getCategoryColor = (category: GoalCategory): string => {
      switch (category) {
        case GoalCategory.HEALTH: return '#FF6B6B';
        case GoalCategory.CAREER: return '#4ECDC4';
        case GoalCategory.LEARNING: return '#45B7D1';
        case GoalCategory.PERSONAL: return '#96CEB4';
        case GoalCategory.FINANCIAL: return '#FFEAA7';
        case GoalCategory.OTHER: return '#BDC3C7';
        default: return Colors.primary;
      }
    };

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Ionicons 
            name={getCategoryIcon(category) as any} 
            size={24} 
            color={getCategoryColor(category)} 
          />
          <Text style={styles.categoryTitle}>{t(`goals.category.${category.toLowerCase()}`)}</Text>
        </View>
        <View style={styles.categoryStats}>
          <View style={styles.categoryStatItem}>
            <Text style={styles.categoryStatLabel}>{t('goals.dashboard.active')}</Text>
            <Text style={styles.categoryStatValue}>{stats.activeCount}</Text>
          </View>
          <View style={styles.categoryStatItem}>
            <Text style={styles.categoryStatLabel}>{t('goals.dashboard.completed')}</Text>
            <Text style={styles.categoryStatValue}>{stats.completedCount}</Text>
          </View>
          <View style={styles.categoryStatItem}>
            <Text style={styles.categoryStatLabel}>{t('goals.dashboard.completion')}</Text>
            <Text style={styles.categoryStatValue}>{Math.round(stats.completionRate)}%</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${stats.completionRate}%`, 
                  backgroundColor: getCategoryColor(category) 
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      padding: Layout.spacing.md,
    },
    section: {
      marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Layout.spacing.sm,
    },
    statCard: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      borderLeftWidth: 4,
    },
    statCardContent: {
      alignItems: 'center',
    },
    statCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    statCardTitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: Layout.spacing.xs,
      textAlign: 'center',
    },
    statCardValue: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    categoryCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: Layout.spacing.sm,
    },
    categoryStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Layout.spacing.md,
    },
    categoryStatItem: {
      alignItems: 'center',
    },
    categoryStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: Layout.spacing.xs,
    },
    categoryStatValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    progressBarContainer: {
      marginTop: Layout.spacing.sm,
    },
    progressBarBackground: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    quickActionsGrid: {
      gap: Layout.spacing.sm,
    },
    quickActionCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    quickActionTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    quickActionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: Layout.spacing.sm,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.dashboard.overview')}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title={t('goals.dashboard.activeGoals')}
              value={activeGoals.length}
              color={Colors.primary}
              icon="flag"
            />
            <StatCard
              title={t('goals.dashboard.completedGoals')}
              value={completedGoals.length}
              color={Colors.success}
              icon="checkmark-circle"
            />
            <StatCard
              title={t('goals.dashboard.completionRate')}
              value={`${Math.round(completionRate)}%`}
              color={Colors.warning}
              icon="pie-chart"
            />
            <StatCard
              title={t('goals.dashboard.onTrack')}
              value={onTrackGoals.length}
              color={Colors.success}
              icon="trending-up"
            />
          </View>
        </View>

        {/* Due Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.dashboard.deadlines')}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title={t('goals.dashboard.overdue')}
              value={overdueGoals.length}
              color={Colors.error}
              icon="warning"
            />
            <StatCard
              title={t('goals.dashboard.dueThisWeek')}
              value={dueThisWeek.length}
              color={Colors.warning}
              icon="calendar"
            />
            <StatCard
              title={t('goals.dashboard.dueThisMonth')}
              value={dueThisMonth.length}
              color={Colors.info}
              icon="calendar-outline"
            />
            <StatCard
              title={t('goals.dashboard.behindSchedule')}
              value={behindScheduleGoals.length}
              color={Colors.error}
              icon="trending-down"
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.dashboard.categories')}</Text>
          {categoryStats.map((stats, index) => (
            <CategoryCard key={stats.category} category={stats.category} stats={stats} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.dashboard.quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            {onTrackGoals.slice(0, 3).map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.quickActionCard}
                onPress={() => onViewGoalStats?.(goal.id)}
              >
                <Text style={styles.quickActionTitle} numberOfLines={1}>
                  {goal.title}
                </Text>
                <Text style={styles.quickActionSubtitle}>
                  {Math.round((goal.currentValue / goal.targetValue) * 100)}% {t('goals.dashboard.complete')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}