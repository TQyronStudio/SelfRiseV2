import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { useI18n } from '../../hooks/useI18n';
import { getGratitudeStorageImpl } from '../../config/featureFlags';
import { DateString } from '../../types/common';

// Get storage implementation based on feature flag
const gratitudeStorage = getGratitudeStorageImpl();
import { 
  today, 
  subtractDays, 
  formatDateForDisplay,
} from '../../utils/date';

interface JournalPoint {
  date: DateString;
  count: number;
  isComplete: boolean; // 3+ entries
  hasBonus: boolean;   // 4+ entries
}

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_HEIGHT = 120;
const DAYS_TO_SHOW = 30;
const Y_AXIS_WIDTH = 30; // Width of Y-axis labels
const CONTAINER_PADDING = 16; // Container inner padding
const CONTAINER_MARGIN = 16; // Container horizontal margin
const SIDE_PADDING = 8; // Small padding on sides for better look
// Available width = screen - margins - container padding - Y-axis width - side padding
const AVAILABLE_WIDTH = screenWidth - (CONTAINER_MARGIN * 2) - (CONTAINER_PADDING * 2) - Y_AXIS_WIDTH - (SIDE_PADDING * 2);
const DAY_WIDTH = Math.max(6, Math.floor(AVAILABLE_WIDTH / DAYS_TO_SHOW)); // Min 6px per day for visibility

export function StreakHistoryGraph() {
  const { t } = useI18n();
  const [journalHistory, setJournalHistory] = useState<JournalPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(5); // Minimum 5 for nice scaling

  useEffect(() => {
    loadStreakHistory();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStreakHistory();
    }, [])
  );

  const loadStreakHistory = async () => {
    try {
      setIsLoading(true);
      
      // Get all journal entries
      const allJournalEntries = await gratitudeStorage.getAll();
      
      // Generate journal entries count history for the last 30 days
      const history: JournalPoint[] = [];
      const endDate = today();
      let currentMaxCount = 5; // Start with minimum for scaling
      
      for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
        const date = subtractDays(endDate, i);
        // BUG #3 FIX: Exclude fake entries created by debt recovery system
        const dayEntries = allJournalEntries.filter(entry => 
          entry.date === date && 
          !entry.content.includes('Streak recovery - Ad watched') // Exclude fake entries
        );
        const count = dayEntries.length;
        
        history.push({
          date,
          count,
          isComplete: count >= 3,
          hasBonus: count >= 4,
        });
        
        currentMaxCount = Math.max(currentMaxCount, count);
      }
      
      setJournalHistory(history);
      setMaxCount(currentMaxCount);
    } catch (error) {
      console.error('Failed to load journal history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointColor = (point: JournalPoint): string => {
    if (point.hasBonus) return Colors.gold; // 4+ entries - gold
    if (point.isComplete) return Colors.success; // 3 entries - green  
    return Colors.primary; // 0-2 entries - blue
  };

  const renderGraph = () => {
    if (journalHistory.length === 0) return null;
    
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graph}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{maxCount}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.yAxisLabel}>{Math.floor(maxCount / 2)}</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          
          {/* Graph area */}
          <View style={styles.graphArea}>
            {/* Grid lines */}
            <View style={styles.gridLines}>
              <View style={[styles.gridLine, { top: 0 }]} />
              <View style={[styles.gridLine, { top: '50%' }]} />
              <View style={[styles.gridLine, { bottom: 0 }]} />
            </View>
            
            {/* Bar chart */}
            <View style={styles.barsContainer}>
              {journalHistory.map((point, index) => {
                const x = index * DAY_WIDTH;
                const barHeight = (point.count / maxCount) * GRAPH_HEIGHT;
                const y = GRAPH_HEIGHT - barHeight;
                
                return (
                  <View
                    key={point.date}
                    style={[
                      styles.bar,
                      {
                        left: x,
                        top: y,
                        width: Math.max(DAY_WIDTH - 2, 2), // Responsive width with minimum gap
                        height: Math.max(barHeight, 2), // Minimum height for visibility
                        backgroundColor: getPointColor(point),
                      }
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>
        
        {/* X-axis with selected dates */}
        <View style={styles.xAxis}>
          {journalHistory
            .filter((_, index) => index % Math.ceil(DAYS_TO_SHOW / 6) === 0 || index === journalHistory.length - 1)
            .map((point) => {
              const originalIndex = journalHistory.findIndex(p => p.date === point.date);
              const x = originalIndex * DAY_WIDTH;
              
              return (
                <View
                  key={point.date}
                  style={[styles.xAxisLabel, { left: x }]}
                >
                  <Text style={styles.xAxisText}>
                    {formatDateForDisplay(point.date, 'short')}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('home.journalHistory')}</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.journalHistory')}</Text>
      <Text style={styles.subtitle}>
        {t('home.last30Days')}
      </Text>
      
      <View style={styles.graphWrapper}>
        {renderGraph()}
      </View>
      
      {/* Summary stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{journalHistory[journalHistory.length - 1]?.count || 0}</Text>
          <Text style={styles.summaryLabel}>{t('home.todayCount')}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{maxCount}</Text>
          <Text style={styles.summaryLabel}>{t('home.peakDay')}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {journalHistory.filter(p => p.isComplete).length}
          </Text>
          <Text style={styles.summaryLabel}>{t('home.completeDays')}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {journalHistory.filter(p => p.hasBonus).length}
          </Text>
          <Text style={styles.summaryLabel}>{t('home.bonusDays')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  graphWrapper: {
    width: '100%',
    paddingHorizontal: SIDE_PADDING,
    overflow: 'hidden',
  },
  loadingContainer: {
    height: GRAPH_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  graphContainer: {
    width: AVAILABLE_WIDTH + Y_AXIS_WIDTH,
    height: GRAPH_HEIGHT + 40,
  },
  graph: {
    flexDirection: 'row',
    height: GRAPH_HEIGHT,
    marginBottom: 20,
  },
  yAxis: {
    width: 30,
    height: GRAPH_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  graphArea: {
    flex: 1,
    height: GRAPH_HEIGHT,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  barsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.8,
  },
  xAxis: {
    position: 'relative',
    height: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    minWidth: 40,
  },
  xAxisText: {
    fontSize: 9,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});