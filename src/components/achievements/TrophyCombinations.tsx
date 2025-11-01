import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Achievement, AchievementCategory, AchievementRarity, UserAchievements } from '@/src/types/gamification';
import { TrophyCollectionCard3D } from './TrophyCollectionCard3D';
import { useTheme } from '../../contexts/ThemeContext';

interface TrophyCombinationsProps {
  userAchievements: UserAchievements;
  allAchievements: Achievement[];
  onCollectionPress?: (collection: TrophyCollection) => void;
}

interface TrophyCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredAchievements: string[];
  bonusXP: number;
  rarity: AchievementRarity;
  category?: AchievementCategory;
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

const TROPHY_COLLECTIONS: Omit<TrophyCollection, 'isCompleted' | 'completedCount' | 'totalCount'>[] = [
  // Category-based collections
  {
    id: 'habits-master',
    name: 'Habits Master',
    description: 'Complete all habit-related achievements',
    icon: '🏃‍♂️',
    requiredAchievements: ['first-habit', 'weekly-warrior', 'habit-collector', 'completion-machine'],
    bonusXP: 200,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.HABITS,
  },
  {
    id: 'journal-sage',
    name: 'Journal Sage',
    description: 'Master all aspects of reflective journaling',
    icon: '📖',
    requiredAchievements: ['first-journal', 'journal-streaker', 'journal-master'],
    bonusXP: 150,
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.JOURNAL,
  },
  {
    id: 'goal-champion',
    name: 'Goal Champion',
    description: 'Achieve mastery in goal setting and completion',
    icon: '🎯',
    requiredAchievements: ['first-goal', 'goal-achiever'],
    bonusXP: 100,
    rarity: AchievementRarity.RARE,
    category: AchievementCategory.GOALS,
  },
  
  // Rarity-based collections
  {
    id: 'legendary-collector',
    name: 'Legendary Collector',
    description: 'Collect all legendary achievements',
    icon: '👑',
    requiredAchievements: ['hundred-days', 'legendary-master'],
    bonusXP: 500,
    rarity: AchievementRarity.LEGENDARY,
  },
  {
    id: 'epic-hunter',
    name: 'Epic Hunter',
    description: 'Unlock all epic achievements',
    icon: '⚔️',
    requiredAchievements: ['monthly-master', 'completion-machine', 'journal-master', 'goal-achiever', 'perfect-week', 'weekend-warrior'],
    bonusXP: 300,
    rarity: AchievementRarity.EPIC,
  },
  
  // Special themed collections
  {
    id: 'first-steps',
    name: 'Foundation Builder',
    description: 'Take your first steps in all areas',
    icon: '🌱',
    requiredAchievements: ['first-habit', 'first-journal', 'first-goal'],
    bonusXP: 75,
    rarity: AchievementRarity.COMMON,
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Master the art of consistency',
    icon: '👑',
    requiredAchievements: ['weekly-warrior', 'monthly-master', 'journal-streaker'],
    bonusXP: 250,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.CONSISTENCY,
  },
  {
    id: 'time-master',
    name: 'Time Master',
    description: 'Excel in time-based achievements',
    icon: '⏰',
    requiredAchievements: ['early-bird', 'perfect-week', 'weekend-warrior'],
    bonusXP: 200,
    rarity: AchievementRarity.EPIC,
    category: AchievementCategory.CONSISTENCY,
  },
];

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return Colors.primary;
  }
};


export const TrophyCombinations: React.FC<TrophyCombinationsProps> = ({
  userAchievements,
  allAchievements,
  onCollectionPress,
}) => {
  const { colors } = useTheme();

  // Calculate collection progress
  const collectionsWithProgress: TrophyCollection[] = TROPHY_COLLECTIONS.map(collection => {
    const completedCount = collection.requiredAchievements.filter(achievementId =>
      userAchievements.unlockedAchievements.includes(achievementId)
    ).length;

    return {
      ...collection,
      isCompleted: completedCount === collection.requiredAchievements.length,
      completedCount,
      totalCount: collection.requiredAchievements.length,
    };
  });

  // Sort collections: completed first, then by rarity, then by progress
  const sortedCollections = collectionsWithProgress.sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return -1;
    if (!a.isCompleted && b.isCompleted) return 1;

    const rarityOrder = {
      [AchievementRarity.LEGENDARY]: 4,
      [AchievementRarity.EPIC]: 3,
      [AchievementRarity.RARE]: 2,
      [AchievementRarity.COMMON]: 1,
    };

    const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
    if (rarityDiff !== 0) return rarityDiff;

    return (b.completedCount / b.totalCount) - (a.completedCount / a.totalCount);
  });

  const completedCollections = collectionsWithProgress.filter(c => c.isCompleted);
  const totalBonusXP = completedCollections.reduce((sum, c) => sum + c.bonusXP, 0);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
    },

    headerContainer: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },

    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Summary stats
    summaryContainer: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    summaryCard: {
      flex: 1,
      alignItems: 'center',
    },

    summaryValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },

    summaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Collections list - removed maxHeight to allow full expansion

    collectionsContent: {
      padding: 16,
    },

    collectionCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      position: 'relative',
    },

    collectionCardCompleted: {
      backgroundColor: 'rgba(76, 175, 80, 0.05)',
      borderColor: '#4CAF50',
    },

    completionBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
    },

    completionText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.white,
    },

    collectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },

    collectionIcon: {
      fontSize: 24,
      marginRight: 12,
    },

    collectionInfo: {
      flex: 1,
    },

    collectionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },

    completedText: {
      color: '#4CAF50',
    },

    collectionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    rarityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 8,
    },

    rarityText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: colors.white,
    },

    bonusXP: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },

    collectionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },

    progressSection: {
      marginBottom: 8,
    },

    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },

    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    progressPercentage: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
    },

    progressFill: {
      height: '100%',
      borderRadius: 2,
    },

    statusContainer: {
      alignItems: 'center',
      marginTop: 8,
    },

    statusCompleted: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4CAF50',
    },

    statusIncomplete: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🏆 Trophy Collections</Text>
        <Text style={styles.headerSubtitle}>
          Complete themed sets for bonus rewards
        </Text>
      </View>

      {/* Summary stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{completedCollections.length}</Text>
          <Text style={styles.summaryLabel}>Collections</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalBonusXP.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Bonus XP</Text>
          <Text style={styles.summaryLabel}>Earned</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {Math.round((completedCollections.length / collectionsWithProgress.length) * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>Collection</Text>
          <Text style={styles.summaryLabel}>Rate</Text>
        </View>
      </View>

      {/* Collections list */}
      <View style={styles.collectionsContent}>
        {sortedCollections.map((collection) => (
          <TrophyCollectionCard3D
            key={collection.id}
            collection={collection}
            onPress={() => onCollectionPress?.(collection)}
          />
        ))}
      </View>
    </View>
  );
};