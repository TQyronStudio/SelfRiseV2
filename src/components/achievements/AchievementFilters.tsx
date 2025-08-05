import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
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

const CATEGORIES = [
  { key: 'all' as const, label: 'All Categories', icon: '🏆' },
  { key: AchievementCategory.HABITS, label: 'Habits', icon: '🏃‍♂️' },
  { key: AchievementCategory.JOURNAL, label: 'Journal', icon: '📝' },
  { key: AchievementCategory.GOALS, label: 'Goals', icon: '🎯' },
  { key: AchievementCategory.CONSISTENCY, label: 'Consistency', icon: '⚔️' },
  { key: AchievementCategory.MASTERY, label: 'Mastery', icon: '👑' },
  { key: AchievementCategory.SPECIAL, label: 'Special', icon: '✨' },
];

const RARITIES = [
  { key: 'all' as const, label: 'All Rarities', color: Colors.gray },
  { key: AchievementRarity.COMMON, label: 'Common', color: '#9E9E9E' },
  { key: AchievementRarity.RARE, label: 'Rare', color: '#2196F3' },
  { key: AchievementRarity.EPIC, label: 'Epic', color: '#9C27B0' },
  { key: AchievementRarity.LEGENDARY, label: 'Legendary', color: '#FFD700' },
];

const SORT_OPTIONS = [
  { key: 'category' as const, label: 'Category', icon: '📂' },
  { key: 'rarity' as const, label: 'Rarity', icon: '💎' },
  { key: 'unlock_date' as const, label: 'Recent', icon: '📅' },
  { key: 'alphabetical' as const, label: 'A-Z', icon: '🔤' },
];

export const AchievementFilters: React.FC<AchievementFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}) => {
  const updateFilters = (update: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...update });
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search achievements..."
          value={filters.searchQuery}
          onChangeText={(text) => updateFilters({ searchQuery: text })}
          placeholderTextColor={Colors.textSecondary}
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
              🔓 Unlocked Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupTitle}>Category</Text>
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
          <Text style={styles.filterGroupTitle}>Rarity</Text>
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
          <Text style={styles.filterGroupTitle}>Sort By</Text>
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
          Showing {filteredCount} of {totalCount} achievements
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 8,
  },
  
  filterButton: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  
  filterButtonTextActive: {
    color: Colors.white,
  },
  
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  
  filterChipIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  
  filterChipTextActive: {
    color: Colors.white,
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
    backgroundColor: Colors.backgroundSecondary,
  },
  
  resultsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});