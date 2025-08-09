// Star Progress Indicator Component  
// Shows progression history and trend analysis

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { AchievementCategory, StarRatingHistoryEntry } from '../../types/gamification';
import { StarRatingService, StarRatingAnalysis } from '../../services/starRatingService';
import StarRatingDisplay from './StarRatingDisplay';

// ========================================
// INTERFACES  
// ========================================

export interface StarProgressIndicatorProps {
  category?: AchievementCategory; // If undefined, shows all categories
  monthsToShow?: number;
  showAnalysis?: boolean;
  compactMode?: boolean;
  onCategoryPress?: (category: AchievementCategory) => void;
  style?: object;
}

interface ProgressTimelineProps {
  history: StarRatingHistoryEntry[];
  category?: AchievementCategory | undefined;
  compactMode: boolean;
}

interface AnalysisSummaryProps {
  analysis: StarRatingAnalysis;
  compactMode: boolean;
}

// ========================================
// PROGRESS TIMELINE COMPONENT
// ========================================

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ 
  history, 
  category,
  compactMode 
}) => {
  if (history.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {category 
            ? `No ${category} challenge history yet` 
            : 'No challenge history yet'}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          Complete monthly challenges to see your progress
        </Text>
      </View>
    );
  }

  // Sort history by date (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const renderHistoryItem = (entry: StarRatingHistoryEntry, index: number) => {
    const starInfo = StarRatingService.getStarDisplayInfo(entry.newStars);
    const isSuccess = entry.reason === 'success';
    const isFailure = entry.reason === 'double_failure';
    const isReset = entry.reason === 'reset';

    // Format month display
    const monthDate = new Date(entry.month + '-01');
    const monthDisplay = monthDate.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });

    // Get reason icon and color
    let reasonIcon = '○';
    let reasonColor = '#9E9E9E';
    
    if (isSuccess) {
      reasonIcon = '↗';
      reasonColor = '#4CAF50';
    } else if (isFailure) {
      reasonIcon = '↘';
      reasonColor = '#F44336';
    } else if (isReset) {
      reasonIcon = '↻';
      reasonColor = '#FF9800';
    }

    if (compactMode) {
      return (
        <View key={`${entry.category}-${entry.month}`} style={styles.compactHistoryItem}>
          <Text style={[styles.reasonIcon, { color: reasonColor }]}>
            {reasonIcon}
          </Text>
          <Text style={[styles.starLevel, { color: starInfo.color }]}>
            {entry.newStars}★
          </Text>
          <Text style={styles.compactCompletion}>
            {Math.round(entry.completionPercentage)}%
          </Text>
        </View>
      );
    }

    return (
      <View key={`${entry.category}-${entry.month}`} style={styles.historyItem}>
        {/* Timeline dot */}
        <View style={[styles.timelineDot, { backgroundColor: starInfo.color }]} />
        
        {/* Content */}
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={styles.monthText}>{monthDisplay}</Text>
            <View style={styles.progressBadge}>
              <Text style={[styles.reasonIcon, { color: reasonColor }]}>
                {reasonIcon}
              </Text>
              <Text style={[styles.starChange, { color: starInfo.color }]}>
                {entry.previousStars}★ → {entry.newStars}★
              </Text>
            </View>
          </View>
          
          <Text style={styles.categoryName}>
            {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
          </Text>
          
          <View style={styles.completionBar}>
            <View 
              style={[
                styles.completionFill,
                {
                  width: `${entry.completionPercentage}%`,
                  backgroundColor: entry.challengeCompleted ? '#4CAF50' : '#FF9800'
                }
              ]}
            />
          </View>
          
          <Text style={styles.completionText}>
            {Math.round(entry.completionPercentage)}% completed
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.timelineContainer}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {compactMode ? (
        <View style={styles.compactGrid}>
          {sortedHistory.slice(0, 12).map(renderHistoryItem)}
        </View>
      ) : (
        <View style={styles.timeline}>
          {sortedHistory.map(renderHistoryItem)}
        </View>
      )}
    </ScrollView>
  );
};

// ========================================
// ANALYSIS SUMMARY COMPONENT
// ========================================

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ 
  analysis, 
  compactMode 
}) => {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4CAF50';
      case 'declining': return '#F44336'; 
      default: return '#FF9800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '📊';
    }
  };

  if (compactMode) {
    return (
      <View style={styles.compactAnalysis}>
        <Text style={styles.compactOverallRating}>
          {analysis.overallRating.toFixed(1)}★
        </Text>
        <Text style={[styles.compactTrend, { color: getTrendColor(analysis.recentTrend) }]}>
          {getTrendIcon(analysis.recentTrend)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.analysisContainer}>
      <Text style={styles.analysisTitle}>Performance Analysis</Text>
      
      <View style={styles.analysisGrid}>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Overall Rating</Text>
          <Text style={styles.analysisValue}>{analysis.overallRating.toFixed(1)}★</Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Trend</Text>
          <View style={styles.trendContainer}>
            <Text style={styles.trendIcon}>{getTrendIcon(analysis.recentTrend)}</Text>
            <Text style={[styles.trendText, { color: getTrendColor(analysis.recentTrend) }]}>
              {analysis.recentTrend}
            </Text>
          </View>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Success Rate</Text>
          <Text style={styles.analysisValue}>
            {analysis.totalCompletions + analysis.totalFailures > 0
              ? Math.round((analysis.totalCompletions / (analysis.totalCompletions + analysis.totalFailures)) * 100)
              : 0}%
          </Text>
        </View>
        
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Strongest</Text>
          <Text style={[styles.analysisValue, styles.categoryValue]}>
            {analysis.strongestCategory}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

export const StarProgressIndicator: React.FC<StarProgressIndicatorProps> = ({
  category,
  monthsToShow = 6,
  showAnalysis = true,
  compactMode = false,
  onCategoryPress,
  style,
}) => {
  const [history, setHistory] = useState<StarRatingHistoryEntry[]>([]);
  const [analysis, setAnalysis] = useState<StarRatingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    loadData();
  }, [category, monthsToShow]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load history
      const historyData = await StarRatingService.getStarRatingHistory(category, monthsToShow);
      setHistory(historyData);
      
      // Load analysis if needed
      if (showAnalysis) {
        const analysisData = await StarRatingService.generateStarRatingAnalysis();
        setAnalysis(analysisData);
      }
    } catch (error) {
      console.error('Error loading star progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {category 
            ? `${category.charAt(0).toUpperCase() + category.slice(1)} Progress`
            : 'Star Progression'}
        </Text>
        {!compactMode && (
          <TouchableOpacity onPress={loadData} style={styles.refreshButton}>
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Analysis Summary */}
      {showAnalysis && analysis && (
        <AnalysisSummary analysis={analysis} compactMode={compactMode} />
      )}

      {/* Progress Timeline */}
      <ProgressTimeline 
        history={history} 
        category={category}
        compactMode={compactMode}
      />
    </View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  refreshButton: {
    padding: 4,
  },

  refreshText: {
    fontSize: 18,
    color: '#666666',
  },

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 14,
    color: '#666666',
  },

  // Analysis styles
  analysisContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },

  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },

  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  analysisItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 8,
  },

  analysisLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },

  analysisValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  categoryValue: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  trendIcon: {
    fontSize: 12,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  compactAnalysis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },

  compactOverallRating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  compactTrend: {
    fontSize: 14,
  },

  // Timeline styles
  timelineContainer: {
    maxHeight: 300,
  },

  timeline: {
    paddingLeft: 8,
  },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 16,
    position: 'relative',
  },

  timelineDot: {
    position: 'absolute',
    left: -4,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  historyContent: {
    flex: 1,
    marginLeft: 8,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  monthText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },

  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  reasonIcon: {
    fontSize: 12,
    fontWeight: '700',
  },

  starChange: {
    fontSize: 11,
    fontWeight: '600',
  },

  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    textTransform: 'capitalize',
  },

  completionBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },

  completionFill: {
    height: '100%',
    borderRadius: 2,
  },

  completionText: {
    fontSize: 10,
    color: '#666666',
  },

  // Compact mode styles
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  compactHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    minWidth: 60,
  },

  starLevel: {
    fontSize: 12,
    fontWeight: '700',
  },

  compactCompletion: {
    fontSize: 10,
    color: '#666666',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },

  emptyStateSubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

export default StarProgressIndicator;