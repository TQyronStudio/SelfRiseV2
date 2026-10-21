import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { AchievementCard } from './AchievementCard';
import { Achievement, UserAchievements } from '@/src/types/gamification';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';
import { getColumnCount } from '../../utils/layout';

interface AchievementGridProps {
  achievements: Achievement[];
  userAchievements: UserAchievements;
  onAchievementPress?: (achievement: Achievement) => void;
}

const cardWidth = 150;
const spacing = 8; // marginHorizontal: 4 * 2

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  userAchievements,
  onAchievementPress,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = getColumnCount(windowWidth, 32, cardWidth + spacing);

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
      // FlatList can't change numColumns in place — a new key remounts it after rotation
      key={numColumns}
      data={achievements}
      renderItem={renderAchievementCard}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel={t('accessibility.achievementGrid')}
      windowSize={5}
      maxToRenderPerBatch={10}
      initialNumToRender={12}
    />
  );
};