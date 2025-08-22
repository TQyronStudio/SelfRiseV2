import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { AchievementCard } from './AchievementCard';
import { Achievement, AchievementCategory, UserAchievements } from '@/src/types/gamification';
import { UserStats } from '@/src/utils/achievementPreviewUtils';

interface CategorySectionProps {
  category: AchievementCategory;
  categoryName: string;
  achievements: Achievement[];
  userAchievements: UserAchievements;
  onAchievementPress: (achievement: Achievement) => void;
  userStats?: UserStats | undefined; // For achievement preview system
  showPreview?: boolean; // Enable preview functionality
}

const getCategoryIcon = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.HABITS: return '🏃‍♂️';
    case AchievementCategory.JOURNAL: return '📝';
    case AchievementCategory.GOALS: return '🎯';
    case AchievementCategory.CONSISTENCY: return '⚔️';
    case AchievementCategory.MASTERY: return '👑';
    case AchievementCategory.SPECIAL: return '✨';
    case AchievementCategory.SOCIAL: return '👥';
    default: return '🏆';
  }
};

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

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  categoryName,
  achievements,
  userAchievements,
  onAchievementPress,
  userStats,
  showPreview = true,
}) => {
  if (achievements.length === 0) {
    return null;
  }

  const unlockedCount = achievements.filter(achievement => 
    userAchievements.unlockedAchievements.includes(achievement.id)
  ).length;

  const screenWidth = Dimensions.get('window').width;
  const numColumns = Math.floor((screenWidth - 32) / 162); // card width + spacing
  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);

  // Group achievements into rows
  const rows: Achievement[][] = [];
  for (let i = 0; i < achievements.length; i += numColumns) {
    rows.push(achievements.slice(i, i + numColumns));
  }

  return (
    <View style={styles.container}>
      {/* Category Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
          </View>
          <View>
            <Text style={styles.categoryName}>{categoryName}</Text>
            <Text style={styles.categoryStats}>
              {unlockedCount} of {achievements.length} unlocked
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(unlockedCount / achievements.length) * 100}%`,
                  backgroundColor: categoryColor,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((unlockedCount / achievements.length) * 100)}%
          </Text>
        </View>
      </View>

      {/* Achievement Cards Grid */}
      <View style={styles.achievementsContainer}>
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
                    onPress={() => onAchievementPress(achievement)}
                    userStats={userStats}
                    showPreview={showPreview}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  categoryIcon: {
    fontSize: 16,
  },
  
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  
  categoryStats: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginRight: 8,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  
  achievementsContainer: {
    paddingHorizontal: 16,
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
});