import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useGoals } from '@/src/contexts/GoalsContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { Colors, Layout, Typography } from '@/src/constants';
import { RecommendationEngine, PersonalizedRecommendation } from '@/src/services/recommendationEngine';

export function PersonalizedRecommendations() {
  const { t } = useI18n();
  const router = useRouter();
  
  // Get data from contexts
  const { habits, completions } = useHabitsData();
  const { state: goalsState } = useGoals();
  const { state: gratitudeState } = useGratitude();

  // Generate recommendations with error handling
  const recommendations = useMemo(() => {
    try {
      // Ensure all data is loaded before generating recommendations
      if (!habits || !completions || !goalsState || !gratitudeState) {
        return [];
      }

      return RecommendationEngine.generateRecommendations(
        habits || [],
        completions || [],
        goalsState?.goals || [],
        gratitudeState?.gratitudeEntries || []
      );
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }, [habits, completions, goalsState?.goals, gratitudeState?.gratitudeEntries]);

  const getRecommendationIcon = (recommendation: PersonalizedRecommendation) => {
    switch (recommendation.type) {
      case 'habit_schedule':
      case 'habit_adjustment':
        return 'time';
      case 'new_habit':
        return 'add-circle';
      case 'journal_prompt':
        return 'book';
      case 'streak_motivation':
        return 'flame';
      case 'milestone_celebration':
        return 'trophy';
      case 'goal_progress':
        return 'trending-up';
      case 'goal_adjustment':
        return 'settings';
      case 'new_goal':
        return 'flag';
      default:
        return 'bulb';
    }
  };

  const getPriorityColor = (priority: PersonalizedRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return Colors.error;
      case 'medium':
        return Colors.warning;
      case 'low':
        return Colors.info;
      default:
        return Colors.textSecondary;
    }
  };

  const handleRecommendationPress = (recommendation: PersonalizedRecommendation) => {
    switch (recommendation.type) {
      case 'new_habit':
      case 'habit_schedule':
      case 'habit_adjustment':
        router.push('/(tabs)/habits');
        break;
      case 'journal_prompt':
      case 'streak_motivation':
      case 'milestone_celebration':
        router.push('/(tabs)/journal');
        break;
      case 'new_goal':
      case 'goal_progress':
      case 'goal_adjustment':
        router.push('/(tabs)/goals');
        break;
    }
  };

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('home.recommendations')}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          <Text style={styles.emptyText}>{t('home.noRecommendations')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.recommendations')}</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((recommendation, index) => (
          <TouchableOpacity
            key={`${recommendation.type}-${index}`}
            style={styles.recommendationCard}
            onPress={() => handleRecommendationPress(recommendation)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={getRecommendationIcon(recommendation)} 
                  size={20} 
                  color={Colors.primary} 
                />
              </View>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(recommendation.priority) }]} />
            </View>

            <Text style={styles.recommendationTitle} numberOfLines={2}>
              {recommendation.title}
            </Text>
            
            <Text style={styles.recommendationDescription} numberOfLines={3}>
              {recommendation.description}
            </Text>

            {(recommendation as any).actionText && (
              <View style={styles.actionContainer}>
                <Text style={styles.actionText}>
                  {(recommendation as any).actionText}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </View>
            )}

            {(recommendation as any).prompt && (
              <View style={styles.promptContainer}>
                <Text style={styles.promptLabel}>{t('home.journalPrompt')}:</Text>
                <Text style={styles.promptText} numberOfLines={2}>
                  "{(recommendation as any).prompt}"
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  title: {
    ...Typography.subheading,
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  scrollContent: {
    paddingRight: Layout.spacing.md,
  },
  recommendationCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.sm,
    width: 240,
    minHeight: 140,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recommendationTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Layout.spacing.xs,
  },
  recommendationDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: Layout.spacing.sm,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: Layout.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  promptContainer: {
    marginTop: Layout.spacing.xs,
    paddingTop: Layout.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  promptLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.spacing.xs,
  },
  promptText: {
    ...Typography.caption,
    color: Colors.text,
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Layout.spacing.sm,
  },
});