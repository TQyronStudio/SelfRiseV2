import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout } from '@/src/constants/dimensions';
import { HelpTooltip } from '@/src/components/common';

interface GoalCompletionPredictionsProps {
  goal: Goal;
  stats: GoalStats | null;
  progressHistory: GoalProgress[];
  isLoading?: boolean;
}

interface PredictionData {
  method: string;
  estimatedDate: string;
  confidence: number;
  daysRemaining: number;
  accuracy: 'high' | 'medium' | 'low';
}

interface PredictionInsight {
  type: 'positive' | 'negative' | 'warning' | 'info';
  title: string;
  description: string;
  icon: string;
}

export function GoalCompletionPredictions({ goal, stats, progressHistory, isLoading = false }: GoalCompletionPredictionsProps) {
  const { t } = useI18n();
  const { colors } = useTheme();

  const predictions = useMemo(() => {
    // If no stats, return empty predictions
    if (!stats) {
      return [];
    }

    const today = new Date();
    const remainingValue = goal.targetValue - goal.currentValue;
    const results: PredictionData[] = [];

    // Check minimum data requirements
    const hasMinimumData = progressHistory.length >= 2;
    const hasRecentData = progressHistory.some(p => {
      const progressDate = new Date(p.date);
      const daysDiff = (today.getTime() - progressDate.getTime()) / (24 * 60 * 60 * 1000);
      return daysDiff <= 7; // At least one entry in last 7 days
    });

    // If insufficient data, show only basic linear prediction
    if (!hasMinimumData || !hasRecentData) {
      if (stats.averageDaily > 0 && remainingValue > 0) {
        const daysToComplete = Math.ceil(remainingValue / stats.averageDaily);
        if (daysToComplete > 0 && !isNaN(daysToComplete) && isFinite(daysToComplete)) {
          const estimatedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
          
          results.push({
            method: t('goals.predictions.basicMethod'),
            estimatedDate: estimatedDate.toLocaleDateString(),
            confidence: Math.min(70, Math.max(30, 85 - (daysToComplete * 0.3))),
            daysRemaining: daysToComplete,
            accuracy: daysToComplete <= 30 ? 'medium' : daysToComplete <= 90 ? 'low' : 'low',
          });
        }
      }
      return results;
    }

    // Method 1: Linear progression based on average daily progress
    if (stats.averageDaily > 0 && remainingValue > 0) {
      const daysToComplete = Math.ceil(remainingValue / stats.averageDaily);
      if (daysToComplete > 0 && !isNaN(daysToComplete) && isFinite(daysToComplete)) {
        const estimatedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        
        results.push({
          method: t('goals.predictions.linearMethod'),
          estimatedDate: estimatedDate.toLocaleDateString(),
          confidence: Math.min(90, Math.max(30, 100 - (daysToComplete * 0.5))),
          daysRemaining: daysToComplete,
          accuracy: daysToComplete <= 30 ? 'high' : daysToComplete <= 90 ? 'medium' : 'low',
        });
      }
    }

    // Method 2: Trend-based prediction (recent progress comparison)
    const recentProgress = progressHistory
      .filter(p => {
        const progressDate = new Date(p.date);
        const daysDiff = (today.getTime() - progressDate.getTime()) / (24 * 60 * 60 * 1000);
        return daysDiff <= 7;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Works with even 2 days of data - compare latest with previous average
    if (recentProgress.length >= 2) {
      // Get latest progress value
      const latestProgress = recentProgress[0];
      if (!latestProgress) return results;
      
      const latestValue = latestProgress.progressType === 'add' ? latestProgress.value : 
                         latestProgress.progressType === 'subtract' ? -latestProgress.value : 0;

      // Calculate average of previous entries (excluding latest)
      const previousEntries = recentProgress.slice(1);
      const previousAverage = previousEntries.reduce((sum, p) => {
        if (p.progressType === 'add') return sum + p.value;
        if (p.progressType === 'subtract') return sum - p.value;
        return sum;
      }, 0) / previousEntries.length;

      // Determine trend direction and use appropriate rate
      let dailyRate: number;
      if (latestValue > previousAverage) {
        // Upward trend - use latest value as it's higher
        dailyRate = latestValue;
      } else {
        // Downward or stable trend - use average of all recent data
        dailyRate = recentProgress.reduce((sum, p) => {
          if (p.progressType === 'add') return sum + p.value;
          if (p.progressType === 'subtract') return sum - p.value;
          return sum;
        }, 0) / recentProgress.length;
      }

      if (dailyRate > 0 && remainingValue > 0) {
        const trendDays = Math.ceil(remainingValue / dailyRate);
        if (trendDays > 0 && !isNaN(trendDays) && isFinite(trendDays)) {
          const trendDate = new Date(today.getTime() + trendDays * 24 * 60 * 60 * 1000);
          
          // Adjust confidence based on data quality and trend direction
          let baseConfidence = 70;
          if (latestValue > previousAverage) baseConfidence += 10; // Upward trend bonus
          if (recentProgress.length >= 3) baseConfidence += 5; // More data bonus
          
          results.push({
            method: t('goals.predictions.trendMethod'),
            estimatedDate: trendDate.toLocaleDateString(),
            confidence: Math.min(85, Math.max(40, baseConfidence - (trendDays * 0.5))),
            daysRemaining: trendDays,
            accuracy: trendDays <= 21 ? 'high' : trendDays <= 60 ? 'medium' : 'low',
          });
        }
      }
    }

    // Method 3: Target date comparison
    if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const daysToTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysToTarget > 0 && !isNaN(daysToTarget) && isFinite(daysToTarget) && remainingValue > 0) {
        const requiredDailyRate = remainingValue / daysToTarget;
        const achievabilityScore = stats.averageDaily > 0 && requiredDailyRate > 0 ? 
          Math.min(100, (stats.averageDaily / requiredDailyRate) * 100) : 0;
        
        results.push({
          method: t('goals.predictions.targetMethod'),
          estimatedDate: targetDate.toLocaleDateString(),
          confidence: Math.max(0, Math.min(100, achievabilityScore)),
          daysRemaining: daysToTarget,
          accuracy: achievabilityScore > 70 ? 'high' : achievabilityScore > 40 ? 'medium' : 'low',
        });
      }
    }

    // Method 4: Conservative Accelerated prediction (requires sufficient data)
    if (recentProgress.length >= 5) { // Increased minimum to 5 for better reliability
      // Split data more evenly for better comparison
      const midpoint = Math.floor(recentProgress.length / 2);
      const firstHalf = recentProgress.slice(midpoint);  // Older data (second half of array)
      const secondHalf = recentProgress.slice(0, midpoint); // Newer data (first half of array)
      
      const firstHalfAvg = firstHalf.reduce((sum, p) => {
        if (p.progressType === 'add') return sum + p.value;
        if (p.progressType === 'subtract') return sum - p.value;
        return sum;
      }, 0) / firstHalf.length;
      
      const secondHalfAvg = secondHalf.reduce((sum, p) => {
        if (p.progressType === 'add') return sum + p.value;
        if (p.progressType === 'subtract') return sum - p.value;
        return sum;
      }, 0) / secondHalf.length;
      
      // Check for meaningful acceleration (at least 20% improvement)
      if (secondHalfAvg > firstHalfAvg && firstHalfAvg > 0 && remainingValue > 0) {
        const accelerationFactor = secondHalfAvg / firstHalfAvg;
        
        // Cap acceleration factor to prevent unrealistic predictions
        const cappedAcceleration = Math.min(accelerationFactor, 2.0); // Max 2x acceleration
        
        // Use conservative base rate (recent trend rather than all-time average)
        const baseRate = recentProgress.reduce((sum, p) => {
          if (p.progressType === 'add') return sum + p.value;
          if (p.progressType === 'subtract') return sum - p.value;
          return sum;
        }, 0) / recentProgress.length;
        
        const acceleratedRate = baseRate * cappedAcceleration;
        
        // Only proceed if acceleration is significant (>20% improvement)
        if (acceleratedRate > baseRate * 1.2 && acceleratedRate > 0) {
          const acceleratedDays = Math.ceil(remainingValue / acceleratedRate);
          if (acceleratedDays > 0 && !isNaN(acceleratedDays) && isFinite(acceleratedDays)) {
            const acceleratedDate = new Date(today.getTime() + acceleratedDays * 24 * 60 * 60 * 1000);
            
            // Conservative confidence calculation based on data quality
            let confidence = 60; // Lower base confidence for predictions
            if (recentProgress.length >= 7) confidence += 10; // More data bonus
            if (cappedAcceleration < 1.5) confidence += 5; // Modest acceleration bonus
            
            results.push({
              method: t('goals.predictions.acceleratedMethod'),
              estimatedDate: acceleratedDate.toLocaleDateString(),
              confidence: Math.min(75, Math.max(30, confidence - (acceleratedDays * 0.4))),
              daysRemaining: acceleratedDays,
              accuracy: acceleratedDays <= 30 ? 'high' : acceleratedDays <= 60 ? 'medium' : 'low',
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }, [goal, stats, progressHistory, t]);

  const insights = useMemo(() => {
    const results: PredictionInsight[] = [];

    if (predictions.length === 0) {
      results.push({
        type: 'info',
        title: t('goals.predictions.noDataTitle'),
        description: t('goals.predictions.noDataDescription'),
        icon: 'information-circle',
      });
      return results;
    }

    const bestPrediction = predictions[0];
    const worstPrediction = predictions[predictions.length - 1];

    // Best case scenario
    if (bestPrediction && bestPrediction.accuracy === 'high') {
      results.push({
        type: 'positive',
        title: t('goals.predictions.highConfidenceTitle'),
        description: t('goals.predictions.highConfidenceDescription', {
          method: bestPrediction.method,
          date: bestPrediction.estimatedDate,
          confidence: bestPrediction.confidence.toFixed(0),
        }),
        icon: 'checkmark-circle',
      });
    }

    // Consistency check
    if (bestPrediction && worstPrediction) {
      const dateDifference = Math.abs(bestPrediction.daysRemaining - worstPrediction.daysRemaining);
      if (dateDifference > 30) {
        results.push({
          type: 'warning',
          title: t('goals.predictions.inconsistentTitle'),
          description: t('goals.predictions.inconsistentDescription', {
            difference: dateDifference,
          }),
          icon: 'warning',
        });
      }
    }

    // Target date comparison
    if (goal.targetDate && bestPrediction && bestPrediction.daysRemaining && !isNaN(bestPrediction.daysRemaining)) {
      const targetDate = new Date(goal.targetDate);
      const today = new Date();
      const bestEstimate = new Date(today.getTime() + bestPrediction.daysRemaining * 24 * 60 * 60 * 1000);
      
      if (bestEstimate > targetDate) {
        const daysBehind = Math.ceil((bestEstimate.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysBehind > 0) {
          results.push({
            type: 'negative',
            title: t('goals.predictions.behindScheduleTitle'),
            description: t('goals.predictions.behindScheduleDescription', {
              days: daysBehind,
            }),
            icon: 'time',
          });
        }
      } else {
        const daysAhead = Math.ceil((targetDate.getTime() - bestEstimate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysAhead > 0) {
          results.push({
            type: 'positive',
            title: t('goals.predictions.aheadScheduleTitle'),
            description: t('goals.predictions.aheadScheduleDescription', {
              days: daysAhead,
            }),
            icon: 'rocket',
          });
        }
      }
    }

    // Progress rate analysis
    if (stats && stats.averageDaily > 0) {
      const requiredRate = goal.targetDate ? 
        (goal.targetValue - goal.currentValue) / Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) :
        null;
      
      if (requiredRate && stats.averageDaily < requiredRate) {
        results.push({
          type: 'warning',
          title: t('goals.predictions.increaseRateTitle'),
          description: t('goals.predictions.increaseRateDescription', {
            current: stats.averageDaily.toFixed(1),
            required: requiredRate.toFixed(1),
            unit: goal.unit,
          }),
          icon: 'trending-up',
        });
      }
    }

    return results;
  }, [predictions, goal, stats, t]);

  // If stats are not available, show loading or no data message
  if (!stats) {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
      },
      loadingContainer: {
        backgroundColor: colors.cardBackgroundElevated,
        borderRadius: 8,
        padding: Layout.spacing.lg,
        alignItems: 'center',
      },
      loadingText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
      },
    });

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('goals.details.predictions')}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isLoading ? `${t('common.loading.default')}...` : 'No progress data yet. Add some progress to see predictions.'}
          </Text>
        </View>
      </View>
    );
  }

  // const today = new Date(); // Unused in render

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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    predictionCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    predictionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    predictionMethod: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    accuracyBadge: {
      paddingHorizontal: Layout.spacing.sm,
      paddingVertical: Layout.spacing.xs,
      borderRadius: 12,
    },
    accuracyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.white,
    },
    predictionDetails: {
      gap: Layout.spacing.sm,
    },
    predictionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Layout.spacing.sm,
    },
    predictionLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    predictionValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    confidenceBar: {
      marginTop: Layout.spacing.md,
    },
    confidenceBarBackground: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    confidenceBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    insightCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 8,
      padding: Layout.spacing.md,
      marginBottom: Layout.spacing.sm,
      borderLeftWidth: 4,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: Layout.spacing.sm,
    },
    insightDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('goals.predictions.title')}</Text>

      {/* Predictions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('goals.predictions.methods')}</Text>
          <HelpTooltip
            helpKey="goals.predictions"
            iconSize={16}
            maxWidth={320}
            variant="prominent"
          />
        </View>
        {predictions.map((prediction, index) => (
          <View key={index} style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionMethod}>{prediction.method}</Text>
              <View style={[styles.accuracyBadge, {
                backgroundColor: prediction.accuracy === 'high' ? colors.success :
                                prediction.accuracy === 'medium' ? colors.warning : colors.error
              }]}>
                <Text style={styles.accuracyText}>{t(`goals.predictions.${prediction.accuracy}`)}</Text>
              </View>
            </View>

            <View style={styles.predictionDetails}>
              <View style={styles.predictionItem}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={styles.predictionLabel}>{t('goals.predictions.estimatedDate')}</Text>
                <Text style={styles.predictionValue}>{prediction.estimatedDate}</Text>
              </View>

              <View style={styles.predictionItem}>
                <Ionicons name="time" size={16} color={colors.primary} />
                <Text style={styles.predictionLabel}>{t('goals.predictions.daysRemaining')}</Text>
                <Text style={styles.predictionValue}>{prediction.daysRemaining}</Text>
              </View>

              <View style={styles.predictionItem}>
                <Ionicons name="analytics" size={16} color={colors.primary} />
                <Text style={styles.predictionLabel}>{t('goals.predictions.confidence')}</Text>
                <Text style={styles.predictionValue}>{prediction.confidence.toFixed(0)}%</Text>
              </View>
            </View>

            <View style={styles.confidenceBar}>
              <View style={styles.confidenceBarBackground}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${prediction.confidence}%`,
                      backgroundColor: prediction.accuracy === 'high' ? colors.success :
                                      prediction.accuracy === 'medium' ? colors.warning : colors.error
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('goals.predictions.insights')}</Text>
        </View>
        {insights.map((insight, index) => (
          <View key={index} style={[styles.insightCard, {
            borderLeftColor: insight.type === 'positive' ? colors.success :
                            insight.type === 'negative' ? colors.error :
                            insight.type === 'warning' ? colors.warning : colors.info
          }]}>
            <View style={styles.insightHeader}>
              <Ionicons
                name={insight.icon as any}
                size={20}
                color={insight.type === 'positive' ? colors.success :
                       insight.type === 'negative' ? colors.error :
                       insight.type === 'warning' ? colors.warning : colors.info}
              />
              <Text style={styles.insightTitle}>{insight.title}</Text>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}