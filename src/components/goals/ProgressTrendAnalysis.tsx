import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Goal, GoalProgress } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants/dimensions';

interface ProgressTrendAnalysisProps {
  goal: Goal;
  progressHistory: GoalProgress[];
}

interface TrendData {
  date: string;
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export function ProgressTrendAnalysis({ goal, progressHistory }: ProgressTrendAnalysisProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const trendData = useMemo(() => {
    if (!progressHistory || progressHistory.length === 0) return [];

    // Sort by date and create cumulative values
    const sortedProgress = [...progressHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeValue = 0;
    const data: TrendData[] = [];

    sortedProgress.forEach((progress, index) => {
      // Calculate cumulative value based on progress type
      if (progress.progressType === 'set') {
        cumulativeValue = progress.value;
      } else if (progress.progressType === 'add') {
        cumulativeValue += progress.value;
      } else if (progress.progressType === 'subtract') {
        cumulativeValue -= progress.value;
      }

      // Calculate percentage
      const percentage = goal.targetValue > 0 ? (cumulativeValue / goal.targetValue) * 100 : 0;
      
      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (index > 0 && data[index - 1]) {
        const prevPercentage = data[index - 1]?.percentage ?? 0;
        if (percentage > prevPercentage) trend = 'up';
        else if (percentage < prevPercentage) trend = 'down';
      }

      data.push({
        date: new Date(progress.date).toLocaleDateString(),
        value: cumulativeValue,
        percentage: Math.max(0, Math.min(100, percentage)),
        trend,
      });
    });

    return data;
  }, [progressHistory, goal.targetValue]);

  const chartData = useMemo(() => {
    if (trendData.length === 0) return [];

    const maxValue = Math.max(...trendData.map(d => d.percentage));
    const chartHeight = 120;

    return trendData.map((data, index) => ({
      ...data,
      x: index,
      y: chartHeight - (data.percentage / Math.max(maxValue, 100)) * chartHeight,
      height: (data.percentage / Math.max(maxValue, 100)) * chartHeight,
    }));
  }, [trendData]);

  const getAnalysisInsights = () => {
    if (trendData.length === 0) return [];

    const insights = [];
    const latestData = trendData[trendData.length - 1];
    const firstData = trendData[0];
    
    if (!latestData || !firstData) return [];
    
    // Progress rate
    const totalProgress = latestData.percentage - firstData.percentage;
    const daysCount = trendData.length;
    const avgDailyProgress = totalProgress / daysCount;

    if (avgDailyProgress > 0.01) { // Only show if meaningful change
      const rateValue = avgDailyProgress.toFixed(1);
      insights.push({
        type: 'positive',
        text: t('goals.analysis.positiveProgress', { rate: rateValue }),
      });
    } else if (avgDailyProgress < -0.01) { // Only show if meaningful change
      const rateValue = Math.abs(avgDailyProgress).toFixed(1);
      insights.push({
        type: 'negative',
        text: t('goals.analysis.negativeProgress', { rate: rateValue }),
      });
    }

    // Trend analysis
    const recentTrends = trendData.slice(-5);
    const upTrends = recentTrends.filter(d => d.trend === 'up').length;
    const downTrends = recentTrends.filter(d => d.trend === 'down').length;

    if (upTrends > downTrends) {
      insights.push({
        type: 'positive',
        text: t('goals.analysis.upwardTrend'),
      });
    } else if (downTrends > upTrends) {
      insights.push({
        type: 'negative',
        text: t('goals.analysis.downwardTrend'),
      });
    }

    // Completion prediction
    if (avgDailyProgress > 0) {
      const remainingProgress = 100 - latestData.percentage;
      const estimatedDaysToCompletion = remainingProgress / avgDailyProgress;
      
      if (estimatedDaysToCompletion <= 30) {
        insights.push({
          type: 'info',
          text: t('goals.analysis.completionPrediction', { days: Math.ceil(estimatedDaysToCompletion) }),
        });
      }
    }

    return insights;
  };

  const insights = getAnalysisInsights();

  const SimpleChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>100%</Text>
          <Text style={styles.axisLabel}>75%</Text>
          <Text style={styles.axisLabel}>50%</Text>
          <Text style={styles.axisLabel}>25%</Text>
          <Text style={styles.axisLabel}>0%</Text>
        </View>

        {/* Chart bars */}
        <View style={styles.chartBars}>
          {chartData.map((data, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.bar,
                    { 
                      height: data.height,
                      backgroundColor: data.trend === 'up' ? colors.success : 
                                     data.trend === 'down' ? colors.error : colors.primary
                    }
                  ]} 
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {data.date.split('/').slice(0, 2).join('/')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  if (trendData.length === 0) {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: Layout.spacing.lg,
        textAlign: 'center',
      },
      emptyState: {
        backgroundColor: colors.cardBackgroundElevated,
        borderRadius: 12,
        padding: Layout.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Layout.spacing.md,
      },
      emptyStateText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
      },
    });

    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('goals.analysis.progressTrend')}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('goals.analysis.noData')}</Text>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: Layout.spacing.lg,
      textAlign: 'center',
    },
    section: {
      marginBottom: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Layout.spacing.md,
    },
    chartContainer: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
    },
    chartArea: {
      flexDirection: 'row',
      height: 140,
    },
    yAxisLabels: {
      width: 40,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingRight: Layout.spacing.sm,
    },
    axisLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    chartBars: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingBottom: 20,
    },
    barContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 1,
    },
    barBackground: {
      width: '100%',
      height: 120,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: {
      width: '80%',
      minHeight: 2,
      borderRadius: 2,
    },
    barLabel: {
      fontSize: 8,
      color: colors.textSecondary,
      marginTop: Layout.spacing.xs,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Layout.spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: Layout.spacing.md,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Layout.spacing.xs,
    },
    insightCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
      borderLeftWidth: 4,
    },
    insightText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    progressItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
    },
    progressItemLeft: {
      flex: 1,
    },
    progressDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    progressValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    progressItemRight: {
      alignItems: 'flex-end',
    },
    progressPercentage: {
      fontSize: 16,
      fontWeight: '600',
    },
    trendIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: Layout.spacing.xs,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('goals.analysis.progressTrend')}</Text>

      {/* Progress Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('goals.analysis.progressChart')}</Text>
        <SimpleChart />
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('goals.analysis.statistics')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trendData.length}</Text>
            <Text style={styles.statLabel}>{t('goals.analysis.totalEntries')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {trendData.length > 0 && trendData[trendData.length - 1] ? trendData[trendData.length - 1]?.percentage?.toFixed(1) ?? '0' : '0'}%
            </Text>
            <Text style={styles.statLabel}>{t('goals.analysis.currentProgress')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {trendData.length > 1 && trendData[trendData.length - 1] && trendData[0] ?
                (((trendData[trendData.length - 1]?.percentage ?? 0) - (trendData[0]?.percentage ?? 0)) / trendData.length).toFixed(1) :
                '0'
              }%
            </Text>
            <Text style={styles.statLabel}>{t('goals.analysis.avgDaily')}</Text>
          </View>
        </View>
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('goals.analysis.insights')}</Text>
          {insights.map((insight, index) => (
            <View key={index} style={[styles.insightCard, {
              borderLeftColor:
                insight.type === 'positive' ? colors.success :
                insight.type === 'negative' ? colors.error : colors.info
            }]}>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('goals.analysis.recentProgress')}</Text>
        {trendData.slice(-5).reverse().map((data, index) => (
          <View key={index} style={styles.progressItem}>
            <View style={styles.progressItemLeft}>
              <Text style={styles.progressDate}>{data.date}</Text>
              <Text style={styles.progressValue}>{data.value} {goal.unit}</Text>
            </View>
            <View style={styles.progressItemRight}>
              <Text style={[styles.progressPercentage, {
                color: data.trend === 'up' ? colors.success :
                       data.trend === 'down' ? colors.error : colors.textSecondary
              }]}>
                {data.percentage.toFixed(1)}%
              </Text>
              <View style={[styles.trendIndicator, {
                backgroundColor: data.trend === 'up' ? colors.success :
                                 data.trend === 'down' ? colors.error : colors.textSecondary
              }]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}