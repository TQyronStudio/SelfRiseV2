import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { AchievementCard } from './AchievementCard';
import { Achievement, UserAchievements } from '@/src/types/gamification';

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievements;
  onAchievementPress?: (achievement: Achievement) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = 150;
const spacing = 8; // marginHorizontal: 4 * 2
const numColumns = Math.floor((screenWidth - 32) / (cardWidth + spacing));

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  userAchievements,
  onAchievementPress,
}) => {
  const renderAchievementCard = ({ item: achievement }: { item: Achievement }) => {
    const isUnlocked = userAchievements.unlockedAchievements.includes(achievement.id);

    return (
      <View style={styles.cardWrapper}>
        <AchievementCard
          achievement={achievement}
          isUnlocked={isUnlocked}
          onPress={() => onAchievementPress?.(achievement)}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={achievements}
      renderItem={renderAchievementCard}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Achievement grid"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  cardWrapper: {
    marginBottom: 8,
  },
});