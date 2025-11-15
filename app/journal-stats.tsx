import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useI18n } from '@/src/hooks/useI18n';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { GratitudeStats } from '@/src/types/gratitude';
import { Layout } from '@/src/constants';
import { useTheme } from '@/src/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import StatisticsCard from '@/src/components/gratitude/StatisticsCard';
import ExportModal from '@/src/components/gratitude/ExportModal';

export default function JournalStatsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();
  const { state, actions } = useGratitude();
  const [stats, setStats] = useState<GratitudeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [typeBreakdown, setTypeBreakdown] = useState<{ gratitude: number; selfPraise: number }>({ gratitude: 0, selfPraise: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Recalculate type breakdown when gratitudes change
    const gratitudeCount = state.gratitudes.filter(g => g.type === 'gratitude').length;
    const selfPraiseCount = state.gratitudes.filter(g => g.type === 'self-praise').length;
    
    setTypeBreakdown({
      gratitude: gratitudeCount,
      selfPraise: selfPraiseCount,
    });
  }, [state.gratitudes]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      await actions.refreshStats();
      setStats(state.stats);
      
      // Ensure we have the latest data
      await actions.loadGratitudes();
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakDescription = () => {
    if (!state.streakInfo) return '';

    const { currentStreak, longestStreak } = state.streakInfo;

    if (currentStreak === 0) {
      return longestStreak > 0 ? t('journal.stats.bestStreak', { days: longestStreak }) : t('journal.stats.startToday');
    }

    if (currentStreak === longestStreak) {
      return t('journal.stats.personalBest');
    }

    return t('journal.stats.best', { days: longestStreak });
  };

  const getBadgeTotal = () => {
    if (!state.streakInfo) return 0;
    return (state.streakInfo.starCount || 0) + 
           (state.streakInfo.flameCount || 0) + 
           (state.streakInfo.crownCount || 0);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getCompletionRate = () => {
    if (!stats || stats.totalDays === 0) return 0;
    // This is a simplified calculation - in a real app you'd calculate based on actual days since start
    return stats.totalDays > 0 ? 1 : 0;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.md,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: Layout.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      gap: Layout.spacing.xs,
    },
    headerButton: {
      padding: Layout.spacing.xs,
    },
    content: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    contentContainer: {
      flexGrow: 1,
    },
    statsGrid: {
      padding: Layout.spacing.md,
    },
    breakdownCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    breakdownTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Layout.spacing.md,
    },
    breakdownContent: {
      gap: Layout.spacing.sm,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownLabel: {
      fontSize: 16,
      color: colors.text,
    },
    breakdownValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    motivationCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.lg,
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    motivationIcon: {
      fontSize: 32,
      marginBottom: Layout.spacing.sm,
    },
    motivationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.sm,
    },
    motivationText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          presentation: 'card',
          animationTypeForReplace: 'push',
        }} 
      />
      <StatusBar style="light" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('journal.stats.title')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.headerButton}>
              <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={loadStats} style={styles.headerButton}>
              <IconSymbol name="arrow.clockwise" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsGrid}>
          {/* Total Entries */}
          <StatisticsCard
            title={t('journal.stats.totalEntries')}
            value={stats?.totalGratitudes || 0}
            subtitle={t('journal.stats.allTime')}
            icon="📝"
            color={colors.primary}
          />

          {/* Active Days */}
          <StatisticsCard
            title={t('journal.stats.activeDays')}
            value={stats?.totalDays || 0}
            subtitle={t('journal.stats.daysWithEntries', { count: stats?.totalDays || 0 })}
            icon="📅"
            color={colors.success}
          />

          {/* Current Streak */}
          <StatisticsCard
            title={t('journal.stats.currentStreak')}
            value={`${state.streakInfo?.currentStreak || 0} days`}
            subtitle={getStreakDescription()}
            icon="🔥"
            color={colors.habitOrange}
          />

          {/* Average Per Day */}
          <StatisticsCard
            title={t('journal.stats.dailyAverage')}
            value={stats?.averagePerDay ? stats.averagePerDay.toFixed(1) : '0.0'}
            subtitle={t('journal.stats.entriesPerDay')}
            icon="📊"
            color={colors.secondary || colors.primary}
          />

          {/* Milestone Badges */}
          <StatisticsCard
            title={t('journal.stats.milestoneBadges')}
            value={getBadgeTotal()}
            subtitle={`⭐ ${state.streakInfo?.starCount || 0} • 🔥 ${state.streakInfo?.flameCount || 0} • 👑 ${state.streakInfo?.crownCount || 0}`}
            icon="🏆"
            color={colors.gold || '#FFD700'}
          />

          {/* Gratitude vs Self-Praise Breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>📋 Entry Types</Text>
            <View style={styles.breakdownContent}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>🙏 Gratitude</Text>
                <Text style={[styles.breakdownValue, { color: colors.primary }]}>
                  {typeBreakdown.gratitude}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>💪 Self-Praise</Text>
                <Text style={[styles.breakdownValue, { color: colors.success }]}>
                  {typeBreakdown.selfPraise}
                </Text>
              </View>
            </View>
          </View>

          {/* Motivational Message */}
          <View style={styles.motivationCard}>
            <Text style={styles.motivationIcon}>🌟</Text>
            <Text style={styles.motivationTitle}>Keep Going!</Text>
            <Text style={styles.motivationText}>
              {state.streakInfo?.currentStreak === 0 
                ? "Every journey begins with a single step. Start your journaling streak today!"
                : state.streakInfo?.currentStreak === 1
                ? "Great start! One day down, many more to go. Keep up the momentum!"
                : `Amazing ${state.streakInfo?.currentStreak || 0}-day streak! You're building a powerful habit.`
              }
            </Text>
          </View>
        </View>
      </ScrollView>
        )}
      
      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
      </SafeAreaView>
    </>
  );
}