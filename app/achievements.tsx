// Trophy Room Screen - Sub-checkpoint 4.5.5.A
// Navigation & Screen Structure implementation

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { HelpTooltip } from '@/src/components/common';
// useOptimizedGamification removed - components use GamificationService directly
import { GamificationService } from '@/src/services/gamificationService';
import { AchievementStorage } from '@/src/services/achievementStorage';
import { AchievementService } from '@/src/services/achievementService';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { AchievementFilters, FilterOptions } from '@/src/components/achievements/AchievementFilters';
import { CategorySection } from '@/src/components/achievements/CategorySection';
import { AchievementCard } from '@/src/components/achievements/AchievementCard';
import { TrophyRoomStats } from '@/src/components/achievements/TrophyRoomStats';
import { AchievementHistory } from '@/src/components/achievements/AchievementHistory';
import { AchievementSpotlight } from '@/src/components/achievements/AchievementSpotlight';
import { TrophyCombinations } from '@/src/components/achievements/TrophyCombinations';
import { AchievementShareModal } from '@/src/components/social';
import { AchievementDetailModal } from '@/src/components/achievements/AchievementDetailModal';
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
  const { colors } = useTheme();

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Batch real-time data for performance
  const [realTimeProgressMap, setRealTimeProgressMap] = useState<Record<string, number>>({});
  const [batchUserStats, setBatchUserStats] = useState<any>(null);
  const [batchDataTimestamp, setBatchDataTimestamp] = useState<number>(0);
  
  // Cache duration: 30 seconds
  const BATCH_CACHE_DURATION = 30000;
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    showAll: true,
    unlockedOnly: false,
    selectedCategory: 'all',
    selectedRarity: 'all',
    searchQuery: '',
    sortBy: 'category',
  });
  
  // View mode state
  const [viewMode, setViewMode] = useState<'overview' | 'achievements'>('overview');
  
  // Social features state
  const [selectedAchievementForShare, setSelectedAchievementForShare] = useState<Achievement | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Detail modal state
  const [selectedAchievementForDetail, setSelectedAchievementForDetail] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  
  // ========================================
  // DATA LOADING - Performance Optimized
  // ========================================
  
  const loadAchievementData = async (force: boolean = false) => {
    try {
      if (force) {
        setIsLoading(true);
      }
      
      setError(null);
      
      // Load essential data first
      const [userData, statsData, gamificationData] = await Promise.all([
        AchievementStorage.getUserAchievements(),
        AchievementService.getAchievementStats(),
        GamificationService.getGamificationStats(),
      ]);
      
      setUserAchievements(userData);
      setAchievementStats(statsData);
      setCurrentLevel(gamificationData.currentLevel);
      
    } catch (err) {
      console.error('Failed to load achievement data:', err);
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Load batch real-time data for all achievements with caching
   * Called only when entering "Browse All" mode
   */
  const loadBatchRealTimeData = async (forceRefresh: boolean = false) => {
    try {
      // Check if cache is still valid
      const now = Date.now();
      const cacheAge = now - batchDataTimestamp;
      
      if (!forceRefresh && batchUserStats && cacheAge < BATCH_CACHE_DURATION) {
        console.log('📦 Using cached batch real-time data');
        return;
      }
      
      console.log('🔄 Loading batch real-time data for achievements...');
      
      // Get both progress map and user stats in parallel
      const [progressMap, userStats] = await Promise.all([
        AchievementService.calculateAllProgressRealTime(),
        AchievementService.getRealTimeUserStats()
      ]);
      
      // Batch state updates to avoid multiple re-renders  
      React.startTransition(() => {
        setRealTimeProgressMap(progressMap);
        
        // Convert to UserStats format for preview system
        setBatchUserStats({
        habitsCreated: userStats.habitsCreated,
        totalHabitCompletions: userStats.totalHabitCompletions,
        longestHabitStreak: userStats.longestHabitStreak,
        maxHabitsInOneDay: userStats.maxHabitsInOneDay,
        habitLevel: 0,
        journalEntries: userStats.journalEntries,
        totalJournalEntries: userStats.totalJournalEntries,
        currentJournalStreak: userStats.currentJournalStreak,
        longestJournalStreak: userStats.longestJournalStreak,
        bonusJournalEntries: userStats.bonusJournalEntries,
        starCount: userStats.starCount,
        flameCount: userStats.flameCount,
        crownCount: userStats.crownCount,
        bonusStreakDays: 0,
        goldenBonusStreakDays: 0,
        goalsCreated: userStats.goalsCreated,
        completedGoals: userStats.goalsCompleted,
        goalProgressStreak: 0,
        hasLargeGoal: false,
        currentLevel: userStats.currentLevel,
        totalXP: userStats.totalXP,
        xpFromHabits: userStats.xpFromHabits,
        totalAchievements: 0,
        unlockedAchievements: Object.values(userStats.progressMap).filter(p => p >= 100).length,
        appUsageStreak: 0,
        multiAreaDays: 0,
        totalActiveDays: userStats.loyaltyTotalActiveDays,
        recommendationsFollowed: 0,
        samedayHabitCreationCompletions: 0,
        activeHabitsSimultaneous: 0,
        comebackActivities: 0,
        perfectMonthDays: 0,
        hasTripleCrown: userStats.crownCount >= 3,
        dailyFeatureComboDays: 0,
        });
        
        // Update cache timestamp
        setBatchDataTimestamp(now);
      }); // End React.startTransition
      
      console.log('✅ Batch real-time data loaded successfully');
      
    } catch (error) {
      console.error('Failed to load batch real-time data:', error);
      React.startTransition(() => {
        setRealTimeProgressMap({});
        setBatchUserStats(null);
        setBatchDataTimestamp(0);
      });
    }
  };
  
  
  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadAchievementData(true);
  }, []);
  
  // Load batch real-time data when switching to "Browse All" mode
  useEffect(() => {
    if (viewMode === 'achievements' && userAchievements) {
      loadBatchRealTimeData();
    }
  }, [viewMode]); // Remove userAchievements to prevent interference with modal
  
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
  // FILTERING AND SORTING LOGIC
  // ========================================
  
  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = [...CORE_ACHIEVEMENTS];
    
    // Apply filters
    if (filters.unlockedOnly && userAchievements) {
      filtered = filtered.filter(achievement => 
        userAchievements.unlockedAchievements.includes(achievement.id)
      );
    }
    
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => 
        achievement.category === filters.selectedCategory
      );
    }
    
    if (filters.selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => 
        achievement.rarity === filters.selectedRarity
      );
    }
    
    // Search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(achievement => 
        achievement.name.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query)
      );
    }
    
    // Sort achievements
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        
        case 'rarity': {
          const rarityOrder = {
            [AchievementRarity.COMMON]: 1,
            [AchievementRarity.RARE]: 2,
            [AchievementRarity.EPIC]: 3,
            [AchievementRarity.LEGENDARY]: 4,
          };
          // 🎯 CRESCENDO EFFECT: Common first, Legendary last for escalating excitement
          return rarityOrder[a.rarity] - rarityOrder[b.rarity]; // Ascending order
        }
        
        case 'unlock_date': {
          if (!userAchievements) return 0;
          const aUnlocked = userAchievements.unlockedAchievements.includes(a.id);
          const bUnlocked = userAchievements.unlockedAchievements.includes(b.id);
          
          if (aUnlocked && bUnlocked) {
            // Both unlocked, sort by order in unlockedAchievements array (most recent first)
            const aIndex = userAchievements.unlockedAchievements.indexOf(a.id);
            const bIndex = userAchievements.unlockedAchievements.indexOf(b.id);
            return bIndex - aIndex; // Higher index = more recent
          } else if (aUnlocked && !bUnlocked) {
            return -1; // Unlocked first
          } else if (!aUnlocked && bUnlocked) {
            return 1; // Unlocked first
          }
          return 0; // Both locked, maintain original order
        }
        
        case 'category':
        default: {
          // 🎭 CRESCENDO CATEGORY ORDER: Strategic progression from foundation to mastery
          const categoryOrder = {
            [AchievementCategory.SPECIAL]: 1,      // Special achievements first (setup)
            [AchievementCategory.JOURNAL]: 2,      // Personal growth (foundation)
            [AchievementCategory.HABITS]: 3,       // Daily consistency (building)
            [AchievementCategory.GOALS]: 4,        // Concrete achievements (momentum)
            [AchievementCategory.CONSISTENCY]: 5,  // Long-term dedication (climax)
            [AchievementCategory.MASTERY]: 6,      // Ultimate mastery (finale)
          };
          const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
          if (categoryDiff !== 0) return categoryDiff;
          
          // Within same category, sort by rarity (ASCENDING - crescendo within category)
          const rarityOrder = {
            [AchievementRarity.COMMON]: 1,
            [AchievementRarity.RARE]: 2,
            [AchievementRarity.EPIC]: 3,
            [AchievementRarity.LEGENDARY]: 4,
          };
          return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
      }
    });
    
    return filtered;
  }, [filters, userAchievements]);
  
  // Group achievements by category for category display
  const achievementsByCategory = useMemo(() => {
    if (filters.sortBy !== 'category') return null;
    
    const categories = Object.values(AchievementCategory);
    const grouped: { [key in AchievementCategory]?: Achievement[] } = {};
    
    categories.forEach(category => {
      const categoryAchievements = filteredAndSortedAchievements.filter(
        achievement => achievement.category === category
      );
      if (categoryAchievements.length > 0) {
        grouped[category] = categoryAchievements;
      }
    });
    
    return grouped;
  }, [filteredAndSortedAchievements, filters.sortBy]);
  
  // ========================================
  // EVENT HANDLERS
  // ========================================
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAchievementData(false);
    
    // Force refresh batch data if in achievements mode
    if (viewMode === 'achievements') {
      loadBatchRealTimeData(true); // Force refresh
    }
  };


  const handleAchievementPress = (achievement: Achievement) => {
    // Always open detail modal (works for both locked and unlocked achievements)
    setSelectedAchievementForDetail(achievement);
    setShowDetailModal(true);
  };

  const handleShareFromDetail = (achievement: Achievement) => {
    // Close detail modal and open share modal
    setShowDetailModal(false);
    setSelectedAchievementForShare(achievement);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedAchievementForShare(null);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAchievementForDetail(null);
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
      <View style={styles.breakdownTitleRow}>
        <Text style={styles.breakdownTitle}>{t('achievements.stats.breakdown')}</Text>
      </View>
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
      <View style={styles.breakdownTitleRow}>
        <Text style={styles.breakdownTitle}>{t('achievements.stats.rarityDistribution')}</Text>
      </View>
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
      <View style={styles.loadingContent}>
        {/* Trophy icon with pulse animation */}
        <View style={styles.loadingIconContainer}>
          <Text style={styles.loadingIcon}>🏆</Text>
        </View>
        
        {/* Animated dots indicator */}
        <View style={styles.loadingDotsContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        
        <Text style={styles.loadingTitle}>Loading Trophy Room</Text>
        <Text style={styles.loadingText}>Polishing your achievements...</Text>
      </View>
    </View>
  );
  
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  // ========================================
  // STYLES - Inside component to access theme
  // ========================================

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // View mode toggle
    viewModeContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 4,
    },

    viewModeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },

    viewModeButtonActive: {
      backgroundColor: colors.primary,
    },

    viewModeText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },

    viewModeTextActive: {
      color: colors.white,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      paddingBottom: 100,
      paddingTop: 16,
    },

    // Achievement grid styles
    achievementHeaderContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },

    achievementHeaderTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },

    gridContainer: {
      paddingHorizontal: 16,
    },

    achievementsContainer: {
      paddingBottom: 24,
    },

    achievementRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 12,
    },

    cardWrapper: {
      marginHorizontal: 4,
      width: 150,
    },

    // No results state
    noResultsContainer: {
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },

    noResultsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    noResultsSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Overview Statistics
    overviewContainer: {
      backgroundColor: colors.white,
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
      color: colors.text,
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
      color: colors.primary,
      marginBottom: 4,
    },

    overviewStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    overviewStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },

    // Breakdown Sections
    breakdownContainer: {
      backgroundColor: colors.white,
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

    breakdownTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    breakdownTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
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
      color: colors.text,
    },

    categoryCount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    categoryProgressBar: {
      height: 6,
      backgroundColor: colors.border,
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
      color: colors.textInverse,
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
      color: colors.text,
    },

    rarityPercentage: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
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
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },

    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },

    // Enhanced Loading State
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      backgroundColor: colors.background,
    },

    loadingContent: {
      alignItems: 'center',
      maxWidth: 300,
    },

    loadingIconContainer: {
      marginBottom: 24,
    },

    loadingIcon: {
      fontSize: 56,
      textAlign: 'center',
    },

    loadingDotsContainer: {
      marginBottom: 20,
    },

    loadingTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
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
      color: colors.error,
      textAlign: 'center',
    },
  });

  // ========================================
  // MAIN RENDER
  // ========================================

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderLoadingState()}
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        {renderErrorState()}
      </View>
    );
  }
  
  const renderCategoryView = () => {
    if (!achievementsByCategory || !userAchievements) return null;

    return Object.entries(achievementsByCategory).map(([category, achievements]) => (
      <CategorySection
        key={category}
        category={category as AchievementCategory}
        categoryName={t(`achievements.categories.${category}`)}
        achievements={achievements}
        userAchievements={userAchievements}
        onAchievementPress={handleAchievementPress}
        showPreview={true}
        realTimeProgressMap={realTimeProgressMap}
        batchUserStats={batchUserStats}
      />
    ));
  };

  const renderGridView = () => {
    if (!userAchievements) return null;

    const numColumns = Math.floor((Dimensions.get('window').width - 32) / 158); // 150 (card) + 8 (margins)
    const rows: Achievement[][] = [];
    
    // Group achievements into rows
    for (let i = 0; i < filteredAndSortedAchievements.length; i += numColumns) {
      rows.push(filteredAndSortedAchievements.slice(i, i + numColumns));
    }

    return (
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.achievementRow}>
            {row.map((achievement) => {
              const isUnlocked = userAchievements.unlockedAchievements.includes(achievement.id);
              
              return (
                <View key={achievement.id} style={styles.cardWrapper}>
                  <AchievementCard
                    achievement={achievement}
                    isUnlocked={isUnlocked}
                    onPress={() => handleAchievementPress(achievement)}
                    showPreview={true}
                    {...(realTimeProgressMap[achievement.id] !== undefined && {
                      realTimeProgress: realTimeProgressMap[achievement.id]
                    })}
                    {...(batchUserStats && {
                      userStats: batchUserStats
                    })}
                  />
                </View>
              );
            })}
            
            {/* Fill empty spaces in the last row */}
            {row.length < numColumns && (
              Array.from({ length: numColumns - row.length }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.cardWrapper} />
              ))
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'overview' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('overview')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'overview' && styles.viewModeTextActive
        ]}>
          🏠 Trophy Room
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'achievements' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('achievements')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'achievements' && styles.viewModeTextActive
        ]}>
          🏆 Browse All
        </Text>
      </TouchableOpacity>
      
    </View>
  );

  const renderOverviewMode = () => {
    if (!userAchievements || !achievementStats) return null;
    
    return (
      <View>
        {/* Enhanced Trophy Room Statistics */}
        <TrophyRoomStats
          stats={achievementStats}
          totalAchievements={CORE_ACHIEVEMENTS.length}
          unlockedCount={overviewStats.unlockedCount}
          userLevel={currentLevel}
          userAchievements={userAchievements}
        />
        
        {/* Trophy Collections */}
        <TrophyCombinations
          userAchievements={userAchievements}
          allAchievements={CORE_ACHIEVEMENTS}
          onCollectionPress={(collection) => {
            console.log('Collection pressed:', collection.name);
            // TODO: Open collection detail modal
          }}
        />
        
      </View>
    );
  };


  const renderAchievementsMode = () => (
    <View>
      {/* Filters */}
      <AchievementFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={CORE_ACHIEVEMENTS.length}
        filteredCount={filteredAndSortedAchievements.length}
      />
      
      {/* Achievement Grid/List */}
      {filteredAndSortedAchievements.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsTitle}>No achievements found</Text>
          <Text style={styles.noResultsSubtitle}>
            Try adjusting your filters or search criteria
          </Text>
        </View>
      ) : (
        <View style={styles.achievementsContainer}>
          {filters.sortBy === 'category' ? renderCategoryView() : renderGridView()}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={['viewToggle', 'content']}
        keyExtractor={(item) => item}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => {
          if (item === 'viewToggle') {
            return renderViewModeToggle();
          }
          
          if (item === 'content') {
            if (viewMode === 'overview') {
              return renderOverviewMode();
            } else {
              return renderAchievementsMode();
            }
          }
          
          return null;
        }}
      />
      
      {/* Achievement Sharing Modal */}
      <AchievementShareModal
        visible={showShareModal}
        achievement={selectedAchievementForShare}
        onClose={handleCloseShareModal}
      />

      <AchievementDetailModal
        visible={showDetailModal}
        achievement={selectedAchievementForDetail}
        userAchievements={userAchievements}
        onClose={handleCloseDetailModal}
        onSharePress={handleShareFromDetail}
        batchUserStats={batchUserStats}
        realTimeProgress={selectedAchievementForDetail ? realTimeProgressMap[selectedAchievementForDetail.id] : undefined}
      />
    </View>
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
    case AchievementCategory.SPECIAL: return '#FFD700';
    default: return '#007AFF'; // Fallback color
  }
};

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return '#007AFF'; // Fallback color instead of Colors.primary
  }
};