import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/src/hooks/useI18n';
import { Colors, Layout, Typography } from '@/src/constants';
import { getDailyQuote, getRandomQuoteFromCategory, MotivationalQuote } from '@/src/data/motivationalQuotes';
import { today } from '@/src/utils/date';

export function DailyMotivationalQuote() {
  const { t, i18n } = useI18n();
  const currentLanguage = i18n.language as 'en' | 'de' | 'es';
  
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(() => 
    getDailyQuote(today(), currentLanguage)
  );

  const handleRefreshQuote = () => {
    // Get a random quote from a random category for variety
    const categories: MotivationalQuote['category'][] = ['motivation', 'gratitude', 'habits', 'goals'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const newQuote = getRandomQuoteFromCategory(randomCategory, currentLanguage);
    setCurrentQuote(newQuote);
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
      default:
        return 'star';
    }
  };

  const getCategoryColor = (category: MotivationalQuote['category']) => {
    switch (category) {
      case 'motivation':
        return Colors.primary;
      case 'gratitude':
        return Colors.success;
      case 'habits':
        return Colors.secondary;
      case 'goals':
        return '#FF6B35';
      default:
        return Colors.primary;
    }
  };

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
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: Colors.text,
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
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  authorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
});