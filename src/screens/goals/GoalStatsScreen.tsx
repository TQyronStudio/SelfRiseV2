import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Goal, GoalProgress, GoalStats } from '@/src/types/goal';
import { ProgressHistoryList } from '@/src/components/goals/ProgressHistoryList';
import { GoalStatsCard } from '@/src/components/goals/GoalStatsCard';
import { ProgressTrendAnalysis } from '@/src/components/goals/ProgressTrendAnalysis';
import { GoalCompletionPredictions } from '@/src/components/goals/GoalCompletionPredictions';
import { GoalSharingModal } from '@/src/components/goals/GoalSharingModal';
import { useGoalsData } from '@/src/hooks/useGoalsData';
import { useGoals } from '@/src/contexts/GoalsContext';
import { Fonts } from '@/src/constants/fonts';
import { useI18n } from '@/src/hooks/useI18n';
import { ErrorModal } from '@/src/components/common';
import { useTheme } from '@/src/contexts/ThemeContext';

export function GoalStatsScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { getGoalWithStats, getGoalProgress, actions, isLoading } = useGoalsData();
  const { actions: goalsActions } = useGoals();
  const insets = useSafeAreaInsets();
  
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'trends' | 'predictions'>('stats');

  // Get data directly from the global state via useGoalsData hook
  const goalWithStats = goalId ? getGoalWithStats(goalId) : null;
  const goal = goalWithStats ? { ...goalWithStats, stats: undefined, progress: undefined } : null;
  const stats = goalWithStats?.stats || null;
  const progress = goalId ? getGoalProgress(goalId) : [];

  const handleDeleteProgress = async (progressId: string) => {
    try {
      await goalsActions.deleteProgress(progressId);
      // No need to reload - the global state will automatically update
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete progress');
      setShowError(true);
    }
  };


  const handleBack = () => {
    router.back();
  };

  // Styles inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontFamily: Fonts.semibold,
      color: colors.white,
    },
    shareButton: {
      padding: 8,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
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
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontFamily: Fonts.medium,
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      marginBottom: 16,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('screens.goalStats.loading')}</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading.default')}</Text>
        </View>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('goals.error')}</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('goals.goalNotFound')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{goal.title}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={() => setShowSharingModal(true)}>
          <Ionicons name="share-outline" size={24} color={colors.white} />
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom }} showsVerticalScrollIndicator={false}>
        {activeTab === 'stats' && (
          <>
            <GoalStatsCard goal={goal} stats={stats} isLoading={isLoading} />
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
          <GoalCompletionPredictions goal={goal} stats={stats} progressHistory={progress} isLoading={isLoading} />
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
    </View>
  );
}