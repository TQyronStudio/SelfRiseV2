import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';
import { getGratitudeStorageImpl } from '../../config/featureFlags';
import { DateString } from '../../types/common';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();
import {
  today,
  subtractDays,
  formatDateForDisplay,
  addDays
} from '../../utils/date';

interface StreakVisualizationProps {
  showDays?: number; // How many days to show (default 7)
}

export function StreakVisualization({ showDays = 7 }: StreakVisualizationProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [completedDates, setCompletedDates] = useState<DateString[]>([]);
  const [bonusDates, setBonusDates] = useState<DateString[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStreakData();
    }, [])
  );

  const loadStreakData = async () => {
    try {
      setIsLoading(true);
      const [completed, bonus] = await Promise.all([
        gratitudeStorage.getCompletedDates(),
        gratitudeStorage.getBonusDates(),
      ]);
      
      
      setCompletedDates(completed);
      setBonusDates(bonus);
    } catch (error) {
      console.error('Failed to load streak visualization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate array of dates to display (past to future)
  const generateDateRange = (): DateString[] => {
    const dates: DateString[] = [];
    const endDate = today();
    
    for (let i = showDays - 1; i >= 0; i--) {
      dates.push(subtractDays(endDate, i));
    }
    
    return dates;
  };

  const dateRange = generateDateRange();

  const getDayStatus = (date: DateString) => {
    const isCompleted = completedDates.includes(date);
    const hasBonus = bonusDates.includes(date);
    const isToday = date === today();

    return {
      isCompleted,
      hasBonus,
      isToday,
    };
  };

  // Move styles inside component for theme support
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackgroundElevated,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    title: {
      fontSize: 16,
      fontFamily: Fonts.semibold,
      color: colors.text,
      marginBottom: 12,
    },
    loadingDots: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
    },
    daysContainer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 4,
    },
    dayContainer: {
      alignItems: 'center',
      minWidth: 40,
    },
    dayLabel: {
      fontSize: 11,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
      marginBottom: 6,
      textAlign: 'center',
    },
    day: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    dayLoading: {
      opacity: 0.3,
    },
    dayCompleted: {
      backgroundColor: Colors.successLight,
      borderColor: Colors.success,
    },
    dayBonus: {
      backgroundColor: Colors.primary + '20',
      borderColor: Colors.primary,
    },
    dayToday: {
      borderColor: Colors.primary,
      borderStyle: 'dashed',
    },
    completedIndicator: {
      fontSize: 16,
      color: Colors.success,
      fontFamily: Fonts.bold,
    },
    bonusIndicator: {
      fontSize: 16,
    },
    todayIndicator: {
      fontSize: 20,
      color: Colors.primary,
      fontFamily: Fonts.bold,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    legendText: {
      fontSize: 11,
      fontFamily: Fonts.regular,
      color: colors.textSecondary,
    },
    legendEmoji: {
      fontSize: 8,
    },
    todayLegendIndicator: {
      fontSize: 12,
      color: Colors.primary,
      fontFamily: Fonts.bold,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingDots}>
          {Array.from({ length: showDays }).map((_, index) => (
            <View key={index} style={[styles.day, styles.dayLoading]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.recentActivity')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysContainer}
      >
        {dateRange.map((date) => {
          const status = getDayStatus(date);

          return (
            <View key={date} style={styles.dayContainer}>
              <Text style={styles.dayLabel}>
                {formatDateForDisplay(date, 'short')}
              </Text>

              <View
                style={[
                  styles.day,
                  status.isCompleted && styles.dayCompleted,
                  status.hasBonus && styles.dayBonus,
                  status.isToday && !status.isCompleted && styles.dayToday,
                ]}
              >
                {status.hasBonus && (
                  <Text style={styles.bonusIndicator}>⭐</Text>
                )}
                {status.isCompleted && !status.hasBonus && (
                  <Text style={styles.completedIndicator}>✓</Text>
                )}
                {status.isToday && !status.isCompleted && (
                  <Text style={styles.todayIndicator}>•</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dayCompleted]} />
          <Text style={styles.legendText}>{t('home.completed')}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dayBonus]}>
            <Text style={styles.legendEmoji}>⭐</Text>
          </View>
          <Text style={styles.legendText}>{t('home.bonus')}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.dayToday]}>
            <Text style={styles.todayLegendIndicator}>•</Text>
          </View>
          <Text style={styles.legendText}>{t('home.today')}</Text>
        </View>
      </View>
    </View>
  );
}