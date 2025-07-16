import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/dimensions';

interface GoalCompletionPredictionsProps {
  goal: Goal;
  stats: GoalStats;
  progressHistory: GoalProgress[];
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

export function GoalCompletionPredictions({ goal, stats, progressHistory }: GoalCompletionPredictionsProps) {
  const { t } = useI18n();

  const predictions = useMemo(() => {
    const today = new Date();
    const remainingValue = goal.targetValue - goal.currentValue;
    const results: PredictionData[] = [];

    // Method 1: Linear progression based on average daily progress
    if (stats.averageDaily > 0) {
      const daysToComplete = Math.ceil(remainingValue / stats.averageDaily);
      const estimatedDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
      
      results.push({
        method: t('goals.predictions.linearMethod'),
        estimatedDate: estimatedDate.toLocaleDateString(),
        confidence: Math.min(90, Math.max(30, 100 - (daysToComplete * 0.5))),
        daysRemaining: daysToComplete,
        accuracy: daysToComplete <= 30 ? 'high' : daysToComplete <= 90 ? 'medium' : 'low',
      });
    }

    // Method 2: Trend-based prediction (recent 7 days)
    const recentProgress = progressHistory
      .filter(p => {
        const progressDate = new Date(p.date);
        const daysDiff = (today.getTime() - progressDate.getTime()) / (24 * 60 * 60 * 1000);
        return daysDiff <= 7;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (recentProgress.length >= 3) {
      const recentAverage = recentProgress.reduce((sum, p) => {
        if (p.progressType === 'add') return sum + p.value;
        if (p.progressType === 'subtract') return sum - p.value;
        return sum;
      }, 0) / recentProgress.length;

      if (recentAverage > 0) {
        const trendDays = Math.ceil(remainingValue / recentAverage);
        const trendDate = new Date(today.getTime() + trendDays * 24 * 60 * 60 * 1000);
        
        results.push({
          method: t('goals.predictions.trendMethod'),
          estimatedDate: trendDate.toLocaleDateString(),
          confidence: Math.min(85, Math.max(40, 100 - (trendDays * 0.8))),
          daysRemaining: trendDays,
          accuracy: trendDays <= 21 ? 'high' : trendDays <= 60 ? 'medium' : 'low',
        });
      }
    }

    // Method 3: Target date comparison
    if (goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const daysToTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysToTarget > 0) {
        const requiredDailyRate = remainingValue / daysToTarget;
        const achievabilityScore = stats.averageDaily > 0 ? 
          Math.min(100, (stats.averageDaily / requiredDailyRate) * 100) : 0;
        
        results.push({
          method: t('goals.predictions.targetMethod'),
          estimatedDate: targetDate.toLocaleDateString(),
          confidence: achievabilityScore,
          daysRemaining: daysToTarget,
          accuracy: achievabilityScore > 70 ? 'high' : achievabilityScore > 40 ? 'medium' : 'low',
        });
      }
    }

    // Method 4: Accelerated prediction (if recent progress is increasing)
    if (recentProgress.length >= 2) {
      const firstHalf = recentProgress.slice(recentProgress.length / 2);
      const secondHalf = recentProgress.slice(0, recentProgress.length / 2);
      
      const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
      
      if (secondHalfAvg > firstHalfAvg) {
        const accelerationFactor = secondHalfAvg / firstHalfAvg;
        const acceleratedRate = stats.averageDaily * accelerationFactor;
        const acceleratedDays = Math.ceil(remainingValue / acceleratedRate);
        const acceleratedDate = new Date(today.getTime() + acceleratedDays * 24 * 60 * 60 * 1000);
        
        results.push({
          method: t('goals.predictions.acceleratedMethod'),
          estimatedDate: acceleratedDate.toLocaleDateString(),
          confidence: Math.min(80, Math.max(35, 100 - (acceleratedDays * 0.6))),
          daysRemaining: acceleratedDays,
          accuracy: acceleratedDays <= 45 ? 'high' : acceleratedDays <= 90 ? 'medium' : 'low',
        });
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
    if (goal.targetDate && bestPrediction) {
      const targetDate = new Date(goal.targetDate);
      const today = new Date();
      const bestEstimate = new Date(today.getTime() + bestPrediction.daysRemaining * 24 * 60 * 60 * 1000);
      
      if (bestEstimate > targetDate) {
        results.push({
          type: 'negative',
          title: t('goals.predictions.behindScheduleTitle'),
          description: t('goals.predictions.behindScheduleDescription', {
            days: Math.ceil((bestEstimate.getTime() - targetDate.getTime()) / (24 * 60 * 60 * 1000)),
          }),
          icon: 'time',
        });
      } else {
        results.push({
          type: 'positive',
          title: t('goals.predictions.aheadScheduleTitle'),
          description: t('goals.predictions.aheadScheduleDescription', {
            days: Math.ceil((targetDate.getTime() - bestEstimate.getTime()) / (24 * 60 * 60 * 1000)),
          }),
          icon: 'rocket',
        });
      }
    }

    // Progress rate analysis
    if (stats.averageDaily > 0) {
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

  const today = new Date();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('goals.predictions.title')}</Text>
      
      {/* Predictions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('goals.predictions.methods')}</Text>
        {predictions.map((prediction, index) => (
          <View key={index} style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionMethod}>{prediction.method}</Text>
              <View style={[styles.accuracyBadge, {
                backgroundColor: prediction.accuracy === 'high' ? Colors.success :
                                prediction.accuracy === 'medium' ? Colors.warning : Colors.error
              }]}>
                <Text style={styles.accuracyText}>{t(`goals.predictions.${prediction.accuracy}`)}</Text>
              </View>
            </View>
            
            <View style={styles.predictionDetails}>
              <View style={styles.predictionItem}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
                <Text style={styles.predictionLabel}>{t('goals.predictions.estimatedDate')}</Text>
                <Text style={styles.predictionValue}>{prediction.estimatedDate}</Text>
              </View>
              
              <View style={styles.predictionItem}>
                <Ionicons name="time" size={16} color={Colors.primary} />
                <Text style={styles.predictionLabel}>{t('goals.predictions.daysRemaining')}</Text>
                <Text style={styles.predictionValue}>{prediction.daysRemaining}</Text>
              </View>
              
              <View style={styles.predictionItem}>
                <Ionicons name="analytics" size={16} color={Colors.primary} />
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
                      backgroundColor: prediction.accuracy === 'high' ? Colors.success :
                                      prediction.accuracy === 'medium' ? Colors.warning : Colors.error
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
        <Text style={styles.sectionTitle}>{t('goals.predictions.insights')}</Text>
        {insights.map((insight, index) => (
          <View key={index} style={[styles.insightCard, {
            borderLeftColor: insight.type === 'positive' ? Colors.success :
                            insight.type === 'negative' ? Colors.error :
                            insight.type === 'warning' ? Colors.warning : Colors.info
          }]}>
            <View style={styles.insightHeader}>
              <Ionicons 
                name={insight.icon as any} 
                size={20} 
                color={insight.type === 'positive' ? Colors.success :
                       insight.type === 'negative' ? Colors.error :
                       insight.type === 'warning' ? Colors.warning : Colors.info} 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  predictionCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: Colors.text,
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
    color: Colors.white,
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
    color: Colors.textSecondary,
    flex: 1,
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  confidenceBar: {
    marginTop: Layout.spacing.md,
  },
  confidenceBarBackground: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    borderLeftWidth: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Layout.spacing.sm,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});