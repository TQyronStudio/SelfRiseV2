import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { ProgressHistoryList } from '@/src/components/goals/ProgressHistoryList';
import { GoalStatsCard } from '@/src/components/goals/GoalStatsCard';
import { ProgressTrendAnalysis } from '@/src/components/goals/ProgressTrendAnalysis';
import { GoalCompletionPredictions } from '@/src/components/goals/GoalCompletionPredictions';
import { GoalSharingModal } from '@/src/components/goals/GoalSharingModal';
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
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'trends' | 'predictions'>('stats');

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
        <TouchableOpacity style={styles.shareButton} onPress={() => setShowSharingModal(true)}>
          <Ionicons name="share-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            {t('goals.stats.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
          onPress={() => setActiveTab('trends')}
        >
          <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>
            {t('goals.stats.trends')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
          onPress={() => setActiveTab('predictions')}
        >
          <Text style={[styles.tabText, activeTab === 'predictions' && styles.activeTabText]}>
            {t('goals.stats.predictions')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' && (
          <>
            <GoalStatsCard goal={goal} stats={stats} />
            <ProgressHistoryList
              progress={progress}
              goalUnit={goal.unit}
              onDeleteProgress={handleDeleteProgress}
            />
          </>
        )}
        
        {activeTab === 'trends' && (
          <ProgressTrendAnalysis goal={goal} progressHistory={progress} />
        )}
        
        {activeTab === 'predictions' && (
          <GoalCompletionPredictions goal={goal} stats={stats} progressHistory={progress} />
        )}
      </ScrollView>

      <ErrorModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={t('common.error')}
        message={errorMessage}
      />

      {/* Sharing Modal */}
      {showSharingModal && (
        <GoalSharingModal
          visible={showSharingModal}
          goal={goal}
          stats={stats}
          progressHistory={progress}
          onClose={() => setShowSharingModal(false)}
        />
      )}
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
  shareButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.white,
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