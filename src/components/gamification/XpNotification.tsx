import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Platform 
} from 'react-native';
import { Colors } from '../../constants/colors';
import { XPSourceType } from '../../types/gamification';

const { width: screenWidth } = Dimensions.get('window');

interface XpGain {
  id: string;
  amount: number;
  source: XPSourceType;
  timestamp: number;
}

interface XpNotificationProps {
  visible: boolean;
  xpGains: XpGain[];
  onAnimationComplete?: () => void;
  onDismiss?: () => void;
}

interface BatchedNotification {
  totalXP: number;
  sources: { source: XPSourceType; count: number; totalXP: number }[];
  timestamp: number;
}

export const XpNotification: React.FC<XpNotificationProps> = ({
  visible,
  xpGains,
  onAnimationComplete,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const [batchedData, setBatchedData] = useState<BatchedNotification | null>(null);

  // ========================================
  // BATCHING LOGIC
  // ========================================

  const batchXpGains = (gains: XpGain[]): BatchedNotification => {
    const sourceMap = new Map<XPSourceType, { count: number; totalXP: number }>();
    let totalXP = 0;

    gains.forEach(gain => {
      totalXP += gain.amount;
      
      if (sourceMap.has(gain.source)) {
        const existing = sourceMap.get(gain.source)!;
        sourceMap.set(gain.source, {
          count: existing.count + 1,
          totalXP: existing.totalXP + gain.amount
        });
      } else {
        sourceMap.set(gain.source, {
          count: 1,
          totalXP: gain.amount
        });
      }
    });

    const sources = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      totalXP: data.totalXP
    }));

    return {
      totalXP,
      sources,
      timestamp: Math.max(...gains.map(g => g.timestamp))
    };
  };

  // Update batched data when xpGains change
  useEffect(() => {
    if (xpGains.length > 0) {
      setBatchedData(batchXpGains(xpGains));
    }
  }, [xpGains]);

  // ========================================
  // SOURCE STYLING
  // ========================================

  const getSourceInfo = (source: XPSourceType): { icon: string; name: string; color: string } => {
    switch (source) {
      case XPSourceType.HABIT_COMPLETION:
      case XPSourceType.HABIT_BONUS:
        return {
          icon: '🏃‍♂️',
          name: 'habits',
          color: '#4CAF50',
        };
      case XPSourceType.JOURNAL_ENTRY:
      case XPSourceType.JOURNAL_BONUS:
        return {
          icon: '📝',
          name: 'journal entries',
          color: '#2196F3',
        };
      case XPSourceType.GOAL_PROGRESS:
      case XPSourceType.GOAL_COMPLETION:
        return {
          icon: '🎯',
          name: 'goals',
          color: '#FF9800',
        };
      case XPSourceType.HABIT_STREAK_MILESTONE:
      case XPSourceType.JOURNAL_STREAK_MILESTONE:
        return {
          icon: '🔥',
          name: 'streaks',
          color: '#9C27B0',
        };
      case XPSourceType.ACHIEVEMENT_UNLOCK:
        return {
          icon: '🏆',
          name: 'achievements',
          color: '#FFD700',
        };
      default:
        return {
          icon: '✨',
          name: 'activities',
          color: Colors.primary,
        };
    }
  };

  // ========================================
  // NOTIFICATION TEXT GENERATION
  // ========================================

  const generateNotificationText = (data: BatchedNotification): string => {
    if (data.sources.length === 1) {
      const source = data.sources[0];
      const sourceInfo = getSourceInfo(source?.source || XPSourceType.HABIT_COMPLETION);
      
      if (source?.count === 1) {
        return `${sourceInfo.icon} ${sourceInfo.name.slice(0, -1)} completed`;
      } else {
        return `${sourceInfo.icon} ${source?.count || 0} ${sourceInfo.name} completed`;
      }
    } else {
      // Multiple sources - create summary
      const sourceTexts = data.sources.map(source => {
        const sourceInfo = getSourceInfo(source?.source || XPSourceType.HABIT_COMPLETION);
        const count = source?.count || 0;
        return `${count} ${count === 1 ? sourceInfo.name.slice(0, -1) : sourceInfo.name}`;
      });
      
      if (sourceTexts.length === 2) {
        return `🎉 ${sourceTexts.join(' and ')} completed`;
      } else {
        const lastSource = sourceTexts.pop();
        return `🎉 ${sourceTexts.join(', ')}, and ${lastSource || ''} completed`;
      }
    }
  };

  // ========================================
  // ANIMATIONS
  // ========================================

  useEffect(() => {
    if (visible && batchedData) {
      // Reset animations
      fadeAnim.setValue(0);
      translateYAnim.setValue(-50);
      scaleAnim.setValue(0.9);

      // Slide down and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const dismissTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -30,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished && onAnimationComplete) {
            onAnimationComplete();
          }
        });
      }, 3000);

      return () => clearTimeout(dismissTimer);
    }
    
    // Return empty cleanup function for other cases
    return () => {};
  }, [visible, batchedData, fadeAnim, translateYAnim, scaleAnim, onAnimationComplete]);

  // ========================================
  // RENDER
  // ========================================

  if (!visible || !batchedData) {
    return null;
  }

  const notificationText = generateNotificationText(batchedData);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.notification}>
        {/* Notification Text */}
        <Text style={styles.messageText} numberOfLines={2}>
          {notificationText}
        </Text>
        
        {/* XP Amount */}
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>+{batchedData.totalXP}</Text>
          <Text style={styles.xpSuffix}>XP</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  notification: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    maxWidth: screenWidth - 32,
    minWidth: 280,
  },
  messageText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
    lineHeight: 20,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  xpLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  xpSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 2,
    opacity: 0.8,
  },
});