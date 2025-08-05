// Trophy Room Screen - Sub-checkpoint 4.5.5.A
// Navigation & Screen Structure implementation

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';
import { AchievementStorage } from '@/src/services/achievementStorage';
import { AchievementService } from '@/src/services/achievementService';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { 
  Achievement, 
  UserAchievements, 
  AchievementStats,
  AchievementCategory,
  AchievementRarity
} from '@/src/types/gamification';

const { width: screenWidth } = Dimensions.get('window');

// ========================================
// ACHIEVEMENTS SCREEN COMPONENT
// ========================================

export default function AchievementsScreen() {
  const { t } = useI18n();
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ========================================
  // DATA LOADING
  // ========================================
  
  const loadAchievementData = async (force: boolean = false) => {
    try {
      if (force) {
        setIsLoading(true);
      }
      
      setError(null);
      
      // Load user achievements and statistics in parallel
      const [userData, statsData] = await Promise.all([
        AchievementStorage.getUserAchievements(),
        AchievementService.getAchievementStats(),
      ]);
      
      setUserAchievements(userData);
      setAchievementStats(statsData);
      
    } catch (err) {
      console.error('Failed to load achievement data:', err);
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadAchievementData(true);
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      // Refresh data when screen comes into focus (but don't show loading)
      loadAchievementData(false);
    }, [])
  );
  
  // ========================================
  // COMPUTED DATA
  // ========================================
  
  const overviewStats = useMemo(() => {
    if (!userAchievements || !achievementStats) {
      return {
        unlockedCount: 0,
        totalCount: 0,
        completionRate: 0,
        totalXP: 0,
      };
    }
    
    return {
      unlockedCount: userAchievements.unlockedAchievements.length,
      totalCount: CORE_ACHIEVEMENTS.length,
      completionRate: achievementStats.completionRate,
      totalXP: userAchievements.totalXPFromAchievements,
    };
  }, [userAchievements, achievementStats]);
  
  const categoryStats = useMemo(() => {
    if (!achievementStats) return [];
    
    return Object.entries(achievementStats.categoryBreakdown).map(([category, data]) => ({
      category: category as AchievementCategory,
      name: t(`achievements.categories.${category}`),
      unlocked: data.unlocked,
      total: data.total,
      progress: data.totalProgress,
    }));
  }, [achievementStats, t]);
  
  const rarityStats = useMemo(() => {
    if (!achievementStats) return [];
    
    return Object.entries(achievementStats.rarityBreakdown).map(([rarity, data]) => ({
      rarity: rarity as AchievementRarity,
      name: t(`achievements.rarity.${rarity}`),
      unlocked: data.unlocked,
      total: data.total,
      completionRate: data.completionRate,
    }));
  }, [achievementStats, t]);
  
  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAchievementData(false);
  };
  
  // ========================================
  // RENDER METHODS
  // ========================================
  
  const renderOverviewStats = () => (
    <View 
      style={styles.overviewContainer}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Achievement overview: ${overviewStats.unlockedCount} of ${overviewStats.totalCount} achievements unlocked, ${Math.round(overviewStats.completionRate)}% complete, ${overviewStats.totalXP} total XP earned`}
    >
      <Text style={styles.overviewTitle}>{t('achievements.overview.unlockedCount')}</Text>
      <View style={styles.overviewStatsRow}>
        <View 
          style={styles.overviewStatItem}
          accessible={true}
          accessibilityLabel={`${overviewStats.unlockedCount} ${t('achievements.overview.unlockedCount')}`}
        >
          <Text style={styles.overviewStatNumber}>{overviewStats.unlockedCount}</Text>
          <Text style={styles.overviewStatLabel}>{t('achievements.overview.unlockedCount')}</Text>
        </View>
        
        <View style={styles.overviewStatDivider} />
        
        <View 
          style={styles.overviewStatItem}
          accessible={true}
          accessibilityLabel={`${overviewStats.totalCount} ${t('achievements.overview.totalCount')}`}
        >
          <Text style={styles.overviewStatNumber}>{overviewStats.totalCount}</Text>
          <Text style={styles.overviewStatLabel}>{t('achievements.overview.totalCount')}</Text>
        </View>
        
        <View style={styles.overviewStatDivider} />
        
        <View 
          style={styles.overviewStatItem}
          accessible={true}
          accessibilityLabel={`${Math.round(overviewStats.completionRate)}% ${t('achievements.overview.completionRate')}`}
        >
          <Text style={styles.overviewStatNumber}>{Math.round(overviewStats.completionRate)}%</Text>
          <Text style={styles.overviewStatLabel}>{t('achievements.overview.completionRate')}</Text>
        </View>
        
        <View style={styles.overviewStatDivider} />
        
        <View 
          style={styles.overviewStatItem}
          accessible={true}
          accessibilityLabel={`${overviewStats.totalXP} ${t('achievements.overview.totalXP')}`}
        >
          <Text style={styles.overviewStatNumber}>{overviewStats.totalXP}</Text>
          <Text style={styles.overviewStatLabel}>{t('achievements.overview.totalXP')}</Text>
        </View>
      </View>
    </View>
  );
  
  const renderCategoryBreakdown = () => (
    <View 
      style={styles.breakdownContainer}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel={t('achievements.stats.breakdown')}
    >
      <Text style={styles.breakdownTitle}>{t('achievements.stats.breakdown')}</Text>
      <View style={styles.categoryList}>
        {categoryStats.map((category) => {
          const progressPercentage = category.total > 0 ? (category.unlocked / category.total) * 100 : 0;
          return (
            <View 
              key={category.category} 
              style={styles.categoryItem}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={t('achievements.accessibility.categoryFilter', { 
                category: category.name 
              })}
              accessibilityValue={{ 
                text: `${category.unlocked} of ${category.total} achievements unlocked, ${Math.round(progressPercentage)}% complete` 
              }}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {category.unlocked}/{category.total}
                </Text>
              </View>
              <View 
                style={styles.categoryProgressBar}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={t('achievements.accessibility.progressBar', { 
                  progress: Math.round(progressPercentage) 
                })}
              >
                <View 
                  style={[
                    styles.categoryProgressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: getCategoryColor(category.category),
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
  
  const renderRarityDistribution = () => (
    <View 
      style={styles.breakdownContainer}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel={t('achievements.stats.rarityDistribution')}
    >
      <Text style={styles.breakdownTitle}>{t('achievements.stats.rarityDistribution')}</Text>
      <View style={styles.rarityList}>
        {rarityStats.map((rarity) => (
          <View 
            key={rarity.rarity} 
            style={styles.rarityItem}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('achievements.accessibility.rarityBadge', { 
              rarity: rarity.name 
            })}
            accessibilityValue={{ 
              text: `${rarity.unlocked} of ${rarity.total} achievements unlocked, ${Math.round(rarity.completionRate)}% complete` 
            }}
          >
            <View 
              style={[styles.rarityBadge, { backgroundColor: getRarityColor(rarity.rarity) }]}
              accessible={false}
            >
              <Text style={styles.rarityBadgeText}>{rarity.name}</Text>
            </View>
            <View style={styles.rarityStats} accessible={false}>
              <Text style={styles.rarityCount}>{rarity.unlocked}/{rarity.total}</Text>
              <Text style={styles.rarityPercentage}>{Math.round(rarity.completionRate)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t('achievements.empty.noAchievements')}</Text>
      <Text style={styles.emptySubtitle}>{t('achievements.empty.noAchievementsSubtitle')}</Text>
    </View>
  );
  
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );
  
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
  
  // ========================================
  // MAIN RENDER
  // ========================================
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        {renderErrorState()}
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View 
          style={styles.header}
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel={`${t('achievements.title')} - ${t('achievements.subtitle')}`}
        >
          <Text style={styles.headerTitle}>{t('achievements.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('achievements.subtitle')}</Text>
        </View>
        
        {/* Overview Statistics */}
        {renderOverviewStats()}
        
        {/* Category Breakdown */}
        {renderCategoryBreakdown()}
        
        {/* Rarity Distribution */}
        {renderRarityDistribution()}
        
        {/* Empty State */}
        {overviewStats.unlockedCount === 0 && renderEmptyState()}
        
        {/* TODO: Achievement Cards Grid will be added in next sub-checkpoint */}
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            🏆 Achievement Cards Grid Coming Soon 🏆
          </Text>
          <Text style={styles.placeholderSubtext}>
            Individual achievement cards with filtering and search will be implemented in the next phase.
          </Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const getCategoryColor = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '#4CAF50';
    case AchievementCategory.JOURNAL: return '#2196F3';
    case AchievementCategory.GOALS: return '#FF9800';
    case AchievementCategory.CONSISTENCY: return '#F44336';
    case AchievementCategory.MASTERY: return '#9C27B0';
    case AchievementCategory.SOCIAL: return '#00BCD4';
    case AchievementCategory.SPECIAL: return '#FFD700';
    default: return Colors.primary;
  }
};

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return Colors.primary;
  }
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textInverse,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Overview Statistics
  overviewContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  overviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  overviewStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  overviewStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  
  overviewStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  overviewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  
  // Breakdown Sections
  breakdownContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  
  // Category Breakdown
  categoryList: {
    gap: 12,
  },
  
  categoryItem: {
    marginBottom: 4,
  },
  
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  
  categoryProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Rarity Distribution
  rarityList: {
    gap: 12,
  },
  
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
  },
  
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
    textAlign: 'center',
  },
  
  rarityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  rarityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  
  rarityPercentage: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  
  // Placeholder
  placeholderContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});