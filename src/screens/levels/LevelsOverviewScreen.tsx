import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '@/src/constants/fonts';
import { Layout } from '@/src/constants/dimensions';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { GamificationService } from '@/src/services/gamificationService';
import { getCurrentLevel, getLevelInfo } from '@/src/services/levelCalculation';

interface LevelData {
  level: number;
  name: string;
  xpRequired: number;
  isUnlocked: boolean;
  color: string;
  rarity: string;
}

export const LevelsOverviewScreen: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, []);

  const loadLevelData = async () => {
    try {
      // Get current user level
      const stats = await GamificationService.getGamificationStats();
      const userLevel = getCurrentLevel(stats.totalXP);
      setCurrentLevel(userLevel);

      // Generate all levels data (let's say up to level 100)
      const allLevels: LevelData[] = [];
      for (let level = 1; level <= 100; level++) {
        const levelInfo = getLevelInfo(level);
        const isUnlocked = level <= userLevel;

        // Get color and rarity based on level
        const color = getLevelColor(level);
        const rarity = getLevelRarity(level);

        allLevels.push({
          level,
          name: levelInfo.title,
          xpRequired: levelInfo.xpRequired,
          isUnlocked,
          color,
          rarity,
        });
      }

      setLevels(allLevels);
    } catch (error) {
      console.error('Failed to load level data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: number): string => {
    // Colors based on rarity tier - same as OptimizedXpProgressBar
    if (level >= 81) return '#F44336'; // Red (Mythic/Exotic) 81-100
    if (level >= 61) return '#FFD700'; // Gold (Legendary) 61-80
    if (level >= 41) return '#9C27B0'; // Purple (Epic) 41-60
    if (level >= 21) return '#2196F3'; // Blue (Rare) 21-40
    if (level >= 11) return '#4CAF50'; // Green (Growing) 11-20
    return '#9E9E9E'; // Grey (Beginner) 1-10
  };

  const getLevelRarity = (level: number): string => {
    if (level >= 81) return 'Mythic';
    if (level >= 61) return 'Legendary';
    if (level >= 41) return 'Epic';
    if (level >= 21) return 'Rare';
    if (level >= 11) return 'Growing';
    return 'Beginner';
  };

  const renderLevelItem = ({ item, index }: { item: LevelData; index: number }) => {
    const isCurrentLevel = item.level === currentLevel;
    const itemColor = item.isUnlocked ? item.color : colors.textSecondary;

    return (
      <View
        style={[
          styles.levelItem,
          !item.isUnlocked && styles.lockedLevel,
          isCurrentLevel && styles.currentLevel,
          item.isUnlocked && { borderColor: itemColor, borderWidth: 2 },
        ]}
      >
        <View style={styles.levelContent}>
          {/* Level number and status */}
          <View style={styles.levelHeader}>
            <View style={[styles.levelBadge, { backgroundColor: itemColor }]}>
              <Text style={styles.levelNumber}>{item.level}</Text>
            </View>
            {isCurrentLevel && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
            {!item.isUnlocked && (
              <Ionicons
                name="lock-closed"
                size={16}
                color={colors.textSecondary}
                style={styles.lockIcon}
              />
            )}
          </View>

          {/* Level info */}
          <View style={styles.levelInfo}>
            <Text
              style={[
                styles.levelName,
                { color: itemColor },
                !item.isUnlocked && styles.lockedText,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.levelRarity,
                { color: itemColor },
                !item.isUnlocked && styles.lockedText,
              ]}
            >
              {item.rarity}
            </Text>
            <Text
              style={[
                styles.xpRequired,
                !item.isUnlocked && styles.lockedText,
              ]}
            >
              {item.xpRequired.toLocaleString()} XP required
            </Text>
          </View>
        </View>

        {/* Progress indicator for unlocked levels */}
        {item.isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: itemColor }]} />
          </View>
        )}
      </View>
    );
  };

  const handleBack = () => {
    router.back();
  };

  // Styles moved inside component to access theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.md,
      paddingVertical: Layout.spacing.md,
      backgroundColor: colors.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: Fonts.sizes.lg,
      fontWeight: 'bold',
      color: colors.white,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    currentLevelSummary: {
      backgroundColor: colors.cardBackgroundElevated,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginVertical: Layout.spacing.sm,
      borderRadius: 12,
    },
    summaryTitle: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    summaryText: {
      fontSize: Fonts.sizes.md,
      color: colors.text,
      marginBottom: 4,
    },
    summarySubtext: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
    },
    listContainer: {
      paddingHorizontal: Layout.spacing.md,
      paddingBottom: Layout.spacing.xl,
    },
    levelItem: {
      backgroundColor: colors.cardBackgroundElevated,
      marginBottom: Layout.spacing.sm,
      borderRadius: 12,
      padding: Layout.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    lockedLevel: {
      opacity: 0.6,
    },
    currentLevel: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    levelContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    levelHeader: {
      alignItems: 'center',
      marginRight: Layout.spacing.md,
    },
    levelBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    levelNumber: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      color: colors.white,
    },
    currentBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    currentText: {
      fontSize: Fonts.sizes.xs,
      fontWeight: 'bold',
      color: colors.white,
    },
    lockIcon: {
      marginTop: 4,
    },
    levelInfo: {
      flex: 1,
    },
    levelName: {
      fontSize: Fonts.sizes.md,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    levelRarity: {
      fontSize: Fonts.sizes.sm,
      fontWeight: '500',
      marginBottom: 2,
    },
    xpRequired: {
      fontSize: Fonts.sizes.sm,
      color: colors.textSecondary,
    },
    lockedText: {
      color: colors.textSecondary,
    },
    progressContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: Fonts.sizes.md,
      color: colors.textSecondary,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Level Overview</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading levels...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Level Overview</Text>
        <View style={styles.headerSpacer} />
      </View>

        {/* Current level summary */}
        <View style={styles.currentLevelSummary}>
          <Text style={styles.summaryTitle}>Your Progress</Text>
          <Text style={styles.summaryText}>
            You're currently level {currentLevel} out of 100 levels
          </Text>
          <Text style={styles.summarySubtext}>
            Keep earning XP to unlock higher levels!
          </Text>
        </View>

        {/* Levels list */}
        <FlatList
          data={levels}
          renderItem={renderLevelItem}
          keyExtractor={(item) => item.level.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.max(0, currentLevel - 3)}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
        />
      </View>
  );
};