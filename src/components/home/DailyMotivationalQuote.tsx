import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/src/hooks/useI18n';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Layout, Typography } from '@/src/constants';
import { getDailyQuote, getRandomQuoteFromCategory, getContextualQuote, MotivationalQuote } from '@/src/data/motivationalQuotes';
import { today } from '@/src/utils/date';

export function DailyMotivationalQuote() {
  const { t, currentLanguage } = useI18n();
  const { colors } = useTheme();

  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(() =>
    getDailyQuote(today(), currentLanguage)
  );

  // Update quote when language changes
  useEffect(() => {
    setCurrentQuote(getDailyQuote(today(), currentLanguage));
  }, [currentLanguage]);

  const handleRefreshQuote = () => {
    // Get a random quote from a random category for variety
    const categories: MotivationalQuote['category'][] = [
      'motivation', 'gratitude', 'habits', 'goals', 'achievement', 'level', 'streak', 'consistency', 'growth'
    ];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    if (randomCategory) {
      const newQuote = getRandomQuoteFromCategory(randomCategory, currentLanguage);
      setCurrentQuote(newQuote);
    }
  };

  const getCategoryIcon = (category: MotivationalQuote['category']) => {
    switch (category) {
      case 'motivation':
        return 'flash';
      case 'gratitude':
        return 'heart';
      case 'habits':
        return 'checkmark-circle';
      case 'goals':
        return 'flag';
      case 'achievement':
        return 'trophy';
      case 'level':
        return 'trending-up';
      case 'streak':
        return 'flame';
      case 'consistency':
        return 'checkmark-circle';
      case 'growth':
        return 'leaf';
      default:
        return 'star';
    }
  };

  const getCategoryColor = (category: MotivationalQuote['category']) => {
    switch (category) {
      case 'motivation':
        return colors.primary;
      case 'gratitude':
        return colors.success;
      case 'habits':
        return colors.secondary;
      case 'goals':
        return '#FF6B35';
      case 'achievement':
        return '#FFD700';
      case 'level':
        return '#3B82F6';
      case 'streak':
        return '#FF6B35';
      case 'consistency':
        return '#10B981';
      case 'growth':
        return '#8B5CF6';
      default:
        return colors.primary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: Layout.borderRadius.lg,
      padding: Layout.spacing.md,
      marginHorizontal: Layout.spacing.md,
      marginBottom: Layout.spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Layout.spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      ...Typography.subheading,
      color: colors.text,
      marginLeft: Layout.spacing.xs,
    },
    refreshButton: {
      padding: Layout.spacing.xs,
      borderRadius: Layout.borderRadius.sm,
    },
    quoteContainer: {
      paddingVertical: Layout.spacing.sm,
    },
    quoteText: {
      ...Typography.body,
      color: colors.text,
      fontStyle: 'italic',
      lineHeight: 22,
      textAlign: 'center',
    },
    authorText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: Layout.spacing.xs,
      fontWeight: '500',
    },
    categoryTag: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Layout.spacing.xs,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: Layout.spacing.xs,
    },
    categoryText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={getCategoryIcon(currentQuote.category)}
            size={20}
            color={getCategoryColor(currentQuote.category)}
          />
          <Text style={styles.title}>{t('home.dailyQuote')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshQuote}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
        {currentQuote.author && (
          <Text style={styles.authorText}>— {currentQuote.author}</Text>
        )}
      </View>

      <View style={styles.categoryTag}>
        <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(currentQuote.category) }]} />
        <Text style={styles.categoryText}>
          {t(`home.quoteCategories.${currentQuote.category}`)}
        </Text>
      </View>
    </View>
  );
}