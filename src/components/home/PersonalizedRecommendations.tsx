import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useI18n } from '@/src/hooks/useI18n';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useGoals } from '@/src/contexts/GoalsContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Typography } from '@/src/constants';
import { RecommendationEngine, PersonalizedRecommendation } from '@/src/services/recommendationEngine';
import { HelpTooltip } from '@/src/components/common';

export function PersonalizedRecommendations() {
  const { t } = useI18n();
  const router = useRouter();
  const { colors } = useTheme();

  // Get data from contexts
  const { habits, completions } = useHabitsData();
  const { state: goalsState } = useGoals();
  const { state: gratitudeState } = useGratitude();

  // State for async recommendations
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);

  // Generate recommendations with error handling
  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        // Ensure all data is loaded before generating recommendations
        if (!habits || !completions || !goalsState || !gratitudeState) {
          setRecommendations([]);
          return;
        }

        const result = await RecommendationEngine.generateRecommendations(
          habits || [],
          completions || [],
          goalsState?.goals || [],
          gratitudeState?.gratitudes || []
        );
        setRecommendations(result);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations([]);
      }
    };

    generateRecommendations();
  }, [habits, completions, goalsState?.goals, gratitudeState?.gratitudes]);

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
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.primary;
      default:
        return colors.textSecondary;
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

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    title: {
      ...Typography.subheading,
      color: colors.text,
      flex: 1,
    },
    scrollContent: {
      paddingRight: Layout.spacing.md,
    },
    recommendationCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginRight: Layout.spacing.sm,
      width: 240,
      minHeight: 140,
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
      backgroundColor: colors.primary + '20',
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
      color: colors.text,
      marginBottom: Layout.spacing.xs,
    },
    recommendationDescription: {
      ...Typography.caption,
      color: colors.textSecondary,
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
      borderTopColor: colors.border,
    },
    actionText: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: '600',
    },
    promptContainer: {
      marginTop: Layout.spacing.xs,
      paddingTop: Layout.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    promptLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Layout.spacing.xs,
    },
    promptText: {
      ...Typography.caption,
      color: colors.text,
      fontStyle: 'italic',
      fontSize: 11,
      lineHeight: 14,
    },
    emptyState: {
      alignItems: 'center',
      padding: Layout.spacing.lg,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
    },
    emptyText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Layout.spacing.sm,
    },
  });

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('home.recommendations')}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          <Text style={styles.emptyText}>{t('home.noRecommendations')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('home.recommendations')}</Text>
        <HelpTooltip
          helpKey="home.recommendations"
          iconSize={16}
          maxWidth={300}
          variant="prominent"
        />
      </View>

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
                  color={colors.primary}
                />
              </View>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(recommendation.priority) }]} />
            </View>

            <Text style={styles.recommendationTitle} numberOfLines={2}>
              {t(recommendation.titleKey)}
            </Text>

            <Text style={styles.recommendationDescription} numberOfLines={3}>
              {t(recommendation.descriptionKey, recommendation.descriptionParams || {})}
            </Text>

            {(recommendation as any).actionKey && (
              <View style={styles.actionContainer}>
                <Text style={styles.actionText}>
                  {t((recommendation as any).actionKey)}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </View>
            )}

            {(recommendation as any).promptKey && (
              <View style={styles.promptContainer}>
                <Text style={styles.promptLabel}>{t('home.journalPrompt')}:</Text>
                <Text style={styles.promptText} numberOfLines={2}>
                  "{t((recommendation as any).promptKey)}"
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}