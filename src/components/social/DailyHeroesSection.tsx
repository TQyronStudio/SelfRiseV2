// Daily Heroes Section - Anonymous Achievement Showcase
// Social Features Foundation - Motivational anonymous showcase

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialSharingService, DailyHeroEntry } from '../../services/socialSharingService';
import { Layout } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';

// ========================================
// INTERFACES
// ========================================

interface DailyHeroesSectionProps {
  onHeroPress?: (hero: DailyHeroEntry) => void;
  compact?: boolean;
  maxVisible?: number;
}

interface HeroCardProps {
  hero: DailyHeroEntry;
  onPress?: () => void;
  compact?: boolean;
}

// ========================================
// HERO CARD COMPONENT
// ========================================

const HeroCard: React.FC<HeroCardProps> = ({ hero, onPress, compact = false }) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const getRarityColor = (rarity: string) => {
    const rarityColors = {
      'Common': '#9E9E9E',
      'Rare': '#2196F3',
      'Epic': '#9C27B0',
      'Legendary': '#FFD700'
    };
    return rarityColors[rarity as keyof typeof rarityColors] || '#9E9E9E';
  };

  const getRarityEmoji = (rarity: string) => {
    const emojis = {
      'Common': '⭐',
      'Rare': '🌟',
      'Epic': '💫',
      'Legendary': '✨'
    };
    return emojis[rarity as keyof typeof emojis] || '🏆';
  };

  const getTimeDisplay = (timestamp: string) => {
    const displayKeys: Record<string, string> = {
      'today': 'social.dailyHeroes.today',
      'yesterday': 'social.dailyHeroes.yesterday',
      'recent': 'social.dailyHeroes.recent'
    };
    const key = displayKeys[timestamp] || 'social.dailyHeroes.recent';
    return t(key);
  };

  const { width: screenWidth } = Dimensions.get('window');

  const styles = StyleSheet.create({
    heroCard: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
      borderWidth: 1,
      borderColor: colors.border + '40',
    },
    heroCardCompact: {
      width: screenWidth * 0.75,
      marginBottom: 0,
      marginRight: Layout.spacing.md,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Layout.spacing.md,
    },
    heroEmoji: {
      fontSize: 20,
    },
    heroMetrics: {
      flex: 1,
    },
    heroLevel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    heroLevelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 4,
    },
    heroDaysActive: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    heroAchievementInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: Layout.spacing.sm,
    },
    heroAchievementName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginRight: Layout.spacing.sm,
    },
    heroRarityBadge: {
      paddingHorizontal: Layout.spacing.sm,
      paddingVertical: 2,
      borderRadius: Layout.borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
    },
    heroRarityText: {
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    heroContext: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: Layout.spacing.sm,
      fontStyle: 'italic',
    },
    heroFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Layout.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    heroTimestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    inspirationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.sm,
      paddingVertical: 2,
      borderRadius: Layout.borderRadius.sm,
      backgroundColor: 'rgba(255, 107, 107, 0.08)', // Semi-transparent red overlay (AMOLED-friendly)
    },
    inspirationText: {
      fontSize: 10,
      color: '#FF6B6B', // Keep vibrant red accent for inspiration
      fontWeight: '500',
      marginLeft: 2,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.heroCard, compact && styles.heroCardCompact]}
      onPress={onPress}
      accessibilityLabel={t('social.dailyHeroes.heroAccessibilityLabel', { achievement: hero.achievementName })}
      accessibilityHint={t('accessibility.hints.tapForInspiration')}
    >
      {/* Achievement Icon & Rarity */}
      <View style={styles.heroHeader}>
        <View style={[styles.heroIcon, { backgroundColor: getRarityColor(hero.achievementRarity) + '15' }]}>
          <Text style={styles.heroEmoji}>{getRarityEmoji(hero.achievementRarity)}</Text>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.heroLevel}>
            <Ionicons name="trending-up" size={14} color={colors.primary} />
            <Text style={styles.heroLevelText}>Level {hero.level}</Text>
          </View>
          <Text style={styles.heroDaysActive}>{t('social.dailyHeroes.daysActive', { days: hero.daysActive })}</Text>
        </View>
      </View>

      {/* Achievement Name & Rarity */}
      <View style={styles.heroAchievementInfo}>
        <Text style={styles.heroAchievementName} numberOfLines={compact ? 1 : 2}>
          {hero.achievementName}
        </Text>
        <View style={styles.heroRarityBadge}>
          <Text
            style={[
              styles.heroRarityText,
              { color: getRarityColor(hero.achievementRarity) }
            ]}
          >
            {hero.achievementRarity.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Motivational Context */}
      {!compact && (
        <Text style={styles.heroContext} numberOfLines={2}>
          {hero.motivationalContext}
        </Text>
      )}

      {/* Timestamp */}
      <View style={styles.heroFooter}>
        <Text style={styles.heroTimestamp}>{getTimeDisplay(hero.anonymizedTimestamp)}</Text>
        <View style={styles.inspirationBadge}>
          <Ionicons name="heart" size={12} color="#FF6B6B" />
          <Text style={styles.inspirationText}>{t('social.dailyHeroes.inspiring')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

export const DailyHeroesSection: React.FC<DailyHeroesSectionProps> = ({
  onHeroPress,
  compact = false,
  maxVisible = 5
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [heroes, setHeroes] = useState<DailyHeroEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      marginVertical: Layout.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: Layout.spacing.lg,
      marginBottom: Layout.spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    refreshButton: {
      padding: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.md,
      backgroundColor: colors.cardBackgroundElevated,
      marginTop: -Layout.spacing.sm,
    },
    refreshing: {
      opacity: 0.6,
    },
    heroesContainer: {
      paddingHorizontal: Layout.spacing.lg,
    },
    heroesContainerHorizontal: {
      flexDirection: 'row',
      gap: Layout.spacing.md,
    },
    inspirationFooter: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
      backgroundColor: 'rgba(255, 165, 0, 0.08)', // Semi-transparent orange overlay (AMOLED-friendly)
      marginHorizontal: Layout.spacing.lg,
      marginTop: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.md,
    },
    inspirationIcon: {
      marginRight: Layout.spacing.sm,
      marginTop: 2,
    },
    inspirationFooterText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    loadingContainer: {
      paddingVertical: Layout.spacing.xl,
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorContainer: {
      paddingVertical: Layout.spacing.xl,
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.md,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.md,
    },
    retryButtonText: {
      color: colors.cardBackgroundElevated,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      paddingVertical: Layout.spacing.xl,
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 4,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    loadDailyHeroes();
  }, []);

  const loadDailyHeroes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const heroesData = await SocialSharingService.createDailyHeroes(maxVisible);
      setHeroes(heroesData);

    } catch (error) {
      console.error('DailyHeroesSection.loadDailyHeroes error:', error);
      setError(t('social.dailyHeroes.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDailyHeroes(true);
  };

  const handleHeroPress = (hero: DailyHeroEntry) => {
    if (onHeroPress) {
      onHeroPress(hero);
    }
  };

  if (loading && heroes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('social.dailyHeroes.title')} 🦸‍♀️</Text>
          <Text style={styles.subtitle}>{t('social.dailyHeroes.subtitle')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('social.dailyHeroes.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('social.dailyHeroes.title')} 🦸‍♀️</Text>
          <Text style={styles.subtitle}>{t('social.dailyHeroes.subtitle')}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadDailyHeroes()}>
            <Text style={styles.retryButtonText}>{t('social.dailyHeroes.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (heroes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('social.dailyHeroes.title')} 🦸‍♀️</Text>
          <Text style={styles.subtitle}>{t('social.dailyHeroes.subtitle')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('social.dailyHeroes.noHeroes')}</Text>
          <Text style={styles.emptySubtext}>{t('social.dailyHeroes.noHeroesSubtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t('social.dailyHeroes.title')} 🦸‍♀️</Text>
          <Text style={styles.subtitle}>
            {t('social.dailyHeroes.subtitle')} ({heroes.length})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          accessibilityLabel={t('accessibility.refreshDailyHeroes')}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={colors.primary}
            style={refreshing ? styles.refreshing : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Heroes List */}
      <ScrollView
        horizontal={compact}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.heroesContainer,
          compact && styles.heroesContainerHorizontal
        ]}
        refreshControl={
          compact ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          )
        }
      >
        {heroes.map((hero) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            compact={compact}
            onPress={() => handleHeroPress(hero)}
          />
        ))}
      </ScrollView>

      {/* Inspiration Footer */}
      <View style={styles.inspirationFooter}>
        <View style={styles.inspirationIcon}>
          <Ionicons name="bulb" size={16} color="#FFA500" />
        </View>
        <Text style={styles.inspirationFooterText}>
          {t('social.dailyHeroes.footer')}
        </Text>
      </View>
    </View>
  );
};