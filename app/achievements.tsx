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

import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';
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
import { UserStatsCollector } from '@/src/utils/userStatsCollector';
import { UserStats } from '@/src/utils/achievementPreviewUtils';
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
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      
      // Load essential data first (excluding userStats for performance - lazy loaded when needed)
      const [userData, statsData, gamificationData] = await Promise.all([
        AchievementStorage.getUserAchievements(),
        AchievementService.getAchievementStats(),
        GamificationService.getGamificationStats(),
      ]);
      
      setUserAchievements(userData);
      setAchievementStats(statsData);
      setCurrentLevel(gamificationData.currentLevel);
      
      // UserStats are now lazy loaded - only when needed for preview system
      // This improves Trophy Room initial loading performance significantly
      
    } catch (err) {
      console.error('Failed to load achievement data:', err);
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  /**
   * Lazy loads userStats only when needed for preview system
   * Uses cached data when available for optimal performance
   */
  const loadUserStatsOnDemand = async () => {
    // Skip if already loaded and data is recent
    if (userStats) {
      console.log('UserStats already loaded, skipping lazy load');
      return;
    }
    
    try {
      console.log('Lazy loading UserStats for preview system...');
      const userStatsData = await UserStatsCollector.collectUserStats();
      setUserStats(userStatsData);
      console.log('UserStats lazy loaded successfully');
    } catch (error) {
      console.error('Failed to lazy load userStats:', error);
      // Don't throw error - preview system is optional
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
  
  // Lazy load userStats when switching to achievements mode where preview system is used
  useEffect(() => {
    if (viewMode === 'achievements' && !userStats) {
      console.log('Switching to achievements mode, triggering userStats lazy load');
      loadUserStatsOnDemand();
    }
  }, [viewMode, userStats]);
  
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
            [AchievementCategory.SOCIAL]: 7,       // Social achievements last
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
    
    // If userStats are loaded, force refresh them too (clear cache)
    if (userStats && viewMode === 'achievements') {
      console.log('Refreshing userStats cache due to pull-to-refresh');
      UserStatsCollector.clearCache();
      loadUserStatsOnDemand();
    }
  };


  const handleAchievementPress = async (achievement: Achievement) => {
    // Lazy load userStats if not available for preview system
    if (!userStats) {
      console.log('Achievement pressed, lazy loading userStats for preview...');
      await loadUserStatsOnDemand();
    }
    
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
      <View style={styles.loadingContent}>
        {/* Trophy icon with pulse animation */}
        <View style={styles.loadingIconContainer}>
          <Text style={styles.loadingIcon}>🏆</Text>
        </View>
        
        {/* Animated dots indicator */}
        <View style={styles.loadingDotsContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
        userStats={userStats || undefined}
        showPreview={true}
      />
    ));
  };

  const renderGridView = () => {
    if (!userAchievements) return null;

    const numColumns = Math.floor((Dimensions.get('window').width - 32) / 162);
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
              const userProgress = userAchievements.achievementProgress[achievement.id] || 0;
              
              return (
                <View key={achievement.id} style={styles.cardWrapper}>
                  <AchievementCard
                    achievement={achievement}
                    userProgress={userProgress}
                    isUnlocked={isUnlocked}
                    onPress={() => handleAchievementPress(achievement)}
                    userStats={userStats || undefined}
                    showPreview={true}
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
        
        {/* Achievement Spotlight */}
        <AchievementSpotlight
          userAchievements={userAchievements}
          allAchievements={CORE_ACHIEVEMENTS}
          onAchievementPress={handleAchievementPress}
        />
        
        {/* Achievement History */}
        <AchievementHistory
          userAchievements={userAchievements}
          allAchievements={CORE_ACHIEVEMENTS}
          onAchievementPress={handleAchievementPress}
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
            colors={[Colors.primary]}
            tintColor={Colors.primary}
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
        userStats={userStats || undefined}
        onClose={handleCloseDetailModal}
        onSharePress={handleShareFromDetail}
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
  
  // View mode toggle
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
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
    backgroundColor: Colors.primary,
  },
  
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  
  viewModeTextActive: {
    color: Colors.white,
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
    borderBottomColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  
  achievementHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
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
    width: 150, // Fixed width to maintain consistent spacing
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
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  noResultsSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  
  // Enhanced Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    backgroundColor: Colors.background,
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
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    color: Colors.error,
    textAlign: 'center',
  },
  
});