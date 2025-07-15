import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { ProgressHistoryList } from '@/src/components/goals/ProgressHistoryList';
import { GoalStatsCard } from '@/src/components/goals/GoalStatsCard';
import { useGoalsData } from '@/src/hooks/useGoalsData';
import { Colors } from '@/src/constants/colors';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal } from '@/src/components/common';

export function GoalStatsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { getGoalWithStats, getGoalProgress, actions } = useGoalsData();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [progress, setProgress] = useState<GoalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  const loadGoalData = async () => {
    if (!goalId) return;

    try {
      setIsLoading(true);
      const goalWithStats = getGoalWithStats(goalId);
      const progressEntries = getGoalProgress(goalId);
      
      if (goalWithStats) {
        const { stats, progress, ...goal } = goalWithStats;
        setGoal(goal);
        setStats(stats || null);
        setProgress(progressEntries);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load goal data');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    try {
      await actions.deleteProgress(progressId);
      await loadGoalData(); // Refresh data
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete progress');
      setShowError(true);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!goal || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Goal not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{goal.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <GoalStatsCard goal={goal} stats={stats} />
        <ProgressHistoryList
          progress={progress}
          goalUnit={goal.unit}
          onDeleteProgress={handleDeleteProgress}
        />
      </ScrollView>

      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
});