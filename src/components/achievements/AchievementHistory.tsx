import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Achievement, AchievementRarity, UserAchievements } from '@/src/types/gamification';
import { useTheme } from '@/src/contexts/ThemeContext';

interface AchievementHistoryProps {
  userAchievements: UserAchievements;
  allAchievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
}

interface HistoryItemProps {
  achievement: Achievement;
  unlockIndex: number;
  totalUnlocked: number;
  onPress?: () => void;
}

const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case AchievementRarity.COMMON: return '#9E9E9E';
    case AchievementRarity.RARE: return '#2196F3';
    case AchievementRarity.EPIC: return '#9C27B0';
    case AchievementRarity.LEGENDARY: return '#FFD700';
    default: return colors.primary;
  }
};

const getTimeAgo = (index: number, total: number): string => {
  // Simulate realistic unlock timing based on position in array
  // More recent unlocks (higher index) show as more recent
  const position = index / total;
  
  if (position > 0.9) return 'Just now';
  if (position > 0.8) return 'Today';
  if (position > 0.7) return 'Yesterday'; 
  if (position > 0.5) return 'This week';
  if (position > 0.3) return 'Last week';
  if (position > 0.1) return 'This month';
  return 'A while ago';
};

const HistoryItem: React.FC<HistoryItemProps> = ({
  achievement,
  unlockIndex,
  totalUnlocked,
  onPress
}) => {
  const { colors } = useTheme();
  const rarityColor = getRarityColor(achievement.rarity);
  const timeAgo = getTimeAgo(unlockIndex, totalUnlocked);
  const isRecent = unlockIndex >= totalUnlocked * 0.8;

  const styles = StyleSheet.create({
    historyItem: {
      flexDirection: 'row',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    historyItemRecent: {
      backgroundColor: 'rgba(0, 122, 255, 0.05)',
      marginHorizontal: -8,
      paddingHorizontal: 8,
      borderRadius: 8,
    },

    timelineContainer: {
      alignItems: 'center',
      marginRight: 12,
      position: 'relative',
    },

    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      zIndex: 1,
    },

    timelineLine: {
      position: 'absolute',
      top: 12,
      width: 2,
      height: 40,
      backgroundColor: colors.border,
      zIndex: 0,
    },

    historyContentContainer: {
      flex: 1,
    },

    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },

    achievementInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    achievementIcon: {
      fontSize: 20,
      marginRight: 8,
    },

    achievementText: {
      flex: 1,
    },

    achievementName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },

    achievementCategory: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    historyMeta: {
      alignItems: 'flex-end',
    },

    rarityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: 4,
    },

    rarityText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.white,
      textTransform: 'uppercase',
    },

    timeAgo: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    achievementDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },

    rewardContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    rewardText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },

    newBadge: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });

  return (
    <TouchableOpacity 
      style={[
        styles.historyItem,
        isRecent && styles.historyItemRecent
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Timeline dot */}
      <View style={styles.timelineContainer}>
        <View style={[styles.timelineDot, { backgroundColor: rarityColor }]} />
        {unlockIndex > 0 && <View style={styles.timelineLine} />}
      </View>
      
      {/* Achievement info */}
      <View style={styles.historyContentContainer}>
        <View style={styles.historyHeader}>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementText}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementCategory}>
                {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.historyMeta}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
              <Text style={styles.rarityText}>
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Text>
            </View>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>
        
        <Text style={styles.achievementDescription} numberOfLines={2}>
          {achievement.description}
        </Text>
        
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardText}>+{achievement.xpReward} XP</Text>
          {isRecent && <Text style={styles.newBadge}>NEW</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const AchievementHistory: React.FC<AchievementHistoryProps> = ({
  userAchievements,
  allAchievements,
  onAchievementPress,
}) => {
  const { colors } = useTheme();

  // Get unlocked achievements in reverse order (most recent first)
  const unlockedAchievements = userAchievements.unlockedAchievements
    .map(id => allAchievements.find(a => a.id === id))
    .filter(Boolean) as Achievement[];

  const recentUnlocks = unlockedAchievements.slice().reverse().slice(0, 10); // Show last 10 unlocks

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

    historyList: {
      maxHeight: 400,
    },

    historyContent: {
      padding: 16,
    },

    moreContainer: {
      alignItems: 'center',
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },

    moreText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
    },

    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
      opacity: 0.5,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },

    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  if (recentUnlocks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>No Trophies Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete habits, write journal entries, and achieve goals to unlock your first trophies!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Recent Victories</Text>
        <Text style={styles.headerSubtitle}>
          Your latest {recentUnlocks.length} achievement{recentUnlocks.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.historyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.historyContent}
      >
        {recentUnlocks.map((achievement, index) => (
          <HistoryItem
            key={achievement.id}
            achievement={achievement}
            unlockIndex={unlockedAchievements.length - 1 - index} // Reverse index for time calculation
            totalUnlocked={unlockedAchievements.length}
            onPress={() => onAchievementPress?.(achievement)}
          />
        ))}
        
        {unlockedAchievements.length > 10 && (
          <View style={styles.moreContainer}>
            <Text style={styles.moreText}>
              And {unlockedAchievements.length - 10} more achievements in your collection...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};