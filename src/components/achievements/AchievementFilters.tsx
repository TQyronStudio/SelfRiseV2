import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { AchievementCategory, AchievementRarity } from '@/src/types/gamification';

export interface FilterOptions {
  showAll: boolean;
  unlockedOnly: boolean;
  selectedCategory: AchievementCategory | 'all';
  selectedRarity: AchievementRarity | 'all';
  searchQuery: string;
  sortBy: 'unlock_date' | 'rarity' | 'alphabetical' | 'category';
}

interface AchievementFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

export const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  const CATEGORIES = [
    { key: 'all' as const, label: t('social.achievements_filters.allCategories'), icon: '🏆' },
    { key: AchievementCategory.HABITS, label: t('social.achievements_filters.habitsCategory'), icon: '🏃‍♂️' },
    { key: AchievementCategory.JOURNAL, label: t('social.achievements_filters.journalCategory'), icon: '📝' },
    { key: AchievementCategory.GOALS, label: t('social.achievements_filters.goalsCategory'), icon: '🎯' },
    { key: AchievementCategory.CONSISTENCY, label: t('social.achievements_filters.consistencyCategory'), icon: '⚔️' },
  ];

  const SORT_OPTIONS = [
    { key: 'category' as const, label: t('social.achievements_filters.categoryLabel'), icon: '📂' },
    { key: 'rarity' as const, label: t('social.achievements_filters.rarityLabel'), icon: '💎' },
    { key: 'unlock_date' as const, label: t('social.achievements_filters.recentLabel'), icon: '📅' },
    { key: 'alphabetical' as const, label: t('social.achievements_filters.alphabeticalLabel'), icon: '🔤' },
  ];

  const RARITIES = [
    { key: 'all' as const, label: t('social.achievements_filters.allRarities'), color: colors.gray },
    { key: AchievementRarity.COMMON, label: t('social.achievements_filters.commonRarity'), color: '#9E9E9E' },
    { key: AchievementRarity.RARE, label: t('social.achievements_filters.rareRarity'), color: '#2196F3' },
    { key: AchievementRarity.EPIC, label: t('social.achievements_filters.epicRarity'), color: '#9C27B0' },
    { key: AchievementRarity.LEGENDARY, label: t('social.achievements_filters.legendaryRarity'), color: '#FFD700' },
  ];

  const updateFilters = (update: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...update });
  };

  // Styles - moved inside component to access colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      margin: 16,
      marginBottom: 8,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: colors.text,
    },
    searchIcon: {
      fontSize: 16,
      marginLeft: 8,
    },
    filtersScrollView: {
      maxHeight: 200,
    },
    filtersContent: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    filterGroup: {
      marginBottom: 12,
    },
    filterGroupTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    filterButton: {
      backgroundColor: colors.cardBackgroundElevated,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    filterButtonTextActive: {
      color: colors.white,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackgroundElevated,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipIcon: {
      fontSize: 12,
      marginRight: 4,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    filterChipTextActive: {
      color: colors.white,
    },
    rarityIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
    },
    resultsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.cardBackgroundElevated,
    },
    resultsText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('achievements.filter.searchPlaceholder')}
          value={filters.searchQuery}
          onChangeText={(text) => updateFilters({ searchQuery: text })}
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* Filter Controls */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersScrollView}
        contentContainerStyle={styles.filtersContent}
      >
        {/* Show/Hide Toggle */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filters.unlockedOnly && styles.filterButtonActive
            ]}
            onPress={() => updateFilters({ unlockedOnly: !filters.unlockedOnly })}
          >
            <Text style={[
              styles.filterButtonText,
              filters.unlockedOnly && styles.filterButtonTextActive
            ]}>
              🔓 {t('social.achievements_filters.unlockedOnlyLabel')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>{t('social.achievements_filters.categoryLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.filterChip,
                  filters.selectedCategory === category.key && styles.filterChipActive
                ]}
                onPress={() => updateFilters({ selectedCategory: category.key })}
              >
                <Text style={styles.filterChipIcon}>{category.icon}</Text>
                <Text style={[
                  styles.filterChipText,
                  filters.selectedCategory === category.key && styles.filterChipTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Rarity Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>{t('social.achievements_filters.rarityLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {RARITIES.map((rarity) => (
              <TouchableOpacity
                key={rarity.key}
                style={[
                  styles.filterChip,
                  filters.selectedRarity === rarity.key && styles.filterChipActive,
                  filters.selectedRarity === rarity.key && { borderColor: rarity.color }
                ]}
                onPress={() => updateFilters({ selectedRarity: rarity.key })}
              >
                <View 
                  style={[
                    styles.rarityIndicator, 
                    { backgroundColor: rarity.color }
                  ]} 
                />
                <Text style={[
                  styles.filterChipText,
                  filters.selectedRarity === rarity.key && styles.filterChipTextActive
                ]}>
                  {rarity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sort Options */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>{t('social.achievements_filters.sortByLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  filters.sortBy === option.key && styles.filterChipActive
                ]}
                onPress={() => updateFilters({ sortBy: option.key })}
              >
                <Text style={styles.filterChipIcon}>{option.icon}</Text>
                <Text style={[
                  styles.filterChipText,
                  filters.sortBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {t('achievements.trophyRoom.showingResults', { filtered: filteredCount, total: totalCount })}
        </Text>
      </View>
    </View>
  );
};