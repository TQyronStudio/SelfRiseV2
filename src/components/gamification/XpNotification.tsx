import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
  AccessibilityInfo
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../hooks/useI18n';
import { useAccessibility } from '../../hooks/useAccessibility';
import { scaleFont } from '../../utils/responsive';
import {
  batchXpGains,
  type BatchedNotification,
  type BatchedSource,
  type XpGainInput,
} from './xpNotificationBatching';

const { width: screenWidth } = Dimensions.get('window');

// Timing is CONSTANT on purpose. The old build sped the animation up and cut
// the display time short once more than three gains piled up, which made a
// productive minute feel frantic instead of rewarding. The only legitimate
// reason to shorten motion is the system "Reduce Motion" switch.
const ENTRANCE_DURATION = 300;
const ENTRANCE_DURATION_REDUCED = 150;
const EXIT_DURATION = 250;
const EXIT_DURATION_REDUCED = 150;
/** Sliding window: the bar leaves this long after the LAST gain, not the first. */
const DISMISS_DELAY = 2500;

/** 0 = fully gone, 1 = fully present. Every visual channel derives from this. */
const HIDDEN = 0;
const SHOWN = 1;

type Phase = 'hidden' | 'shown' | 'leaving';

interface XpNotificationProps {
  visible: boolean;
  xpGains: XpGainInput[];
  onAnimationComplete?: () => void;
  onDismiss?: () => void;
}

export const XpNotification: React.FC<XpNotificationProps> = React.memo(({
  visible,
  xpGains,
  onAnimationComplete,
}) => {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { isReduceMotionEnabled } = useAccessibility();
  const insets = useSafeAreaInsets();

  // ONE driver instead of three separate values.
  //
  // The bar used to hold fadeAnim / translateYAnim / scaleAnim and reset all
  // three with setValue() immediately before starting three animations at once
  // — the same JS/native ordering gap we removed from the XP bubble. With a
  // single presence value there is nothing to reset: showing means animating
  // towards 1, leaving means animating towards 0, and XP landing mid-exit just
  // retargets the same value back to 1 from wherever it happens to be.
  const presence = useRef(new Animated.Value(HIDDEN)).current;

  // Derived, not stored. While this was state fed by an effect, every parent
  // render produced a fresh object, the animation effect depended on it, and
  // the bar replayed its entrance — the "flickering" the tester reported.
  const batchedData = useMemo<BatchedNotification | null>(
    () => (xpGains.length > 0 ? batchXpGains(xpGains) : null),
    [xpGains]
  );

  // Changes only when a NEW gain lands, so it can drive the dismiss timer
  // without ever restarting the entrance animation.
  const contentKey = batchedData?.timestamp ?? 0;

  const phaseRef = useRef<Phase>('hidden');
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  // ========================================
  // ANIMATED STYLE — built ONCE
  // ========================================

  // The entrance easing overshoots past 1, which gives scale and translateY a
  // small spring settle for free. Opacity must be clamped so it cannot exceed 1.
  const opacity = useMemo(
    () => presence.interpolate({ inputRange: [HIDDEN, SHOWN], outputRange: [0, 1], extrapolate: 'clamp' }),
    [presence]
  );
  const translateY = useMemo(
    () => presence.interpolate({ inputRange: [HIDDEN, SHOWN], outputRange: [-50, 0] }),
    [presence]
  );
  const scale = useMemo(
    () => presence.interpolate({ inputRange: [HIDDEN, SHOWN], outputRange: [0.9, 1] }),
    [presence]
  );

  const styles = useMemo(
    () => createStyles(colors, insets.top, isDark),
    [colors, insets.top, isDark]
  );

  // CRITICAL: this identity must survive a content update. Rebuilding the style
  // array (or re-running StyleSheet.create) on every render makes React Native
  // detach and re-attach the native animated nodes, and doing that mid-flight
  // is visible as a stutter. New XP arrives several times a second while the
  // bar is on screen, so this is the difference between smooth and jerky.
  const animatedStyle = useMemo(
    () => [styles.container, { opacity, transform: [{ translateY }, { scale }] }],
    [styles, opacity, translateY, scale]
  );

  // ========================================
  // HELPERS
  // ========================================

  // Noun only (no verb) — used when several kinds of activity are listed
  // together, where a shared verb cannot agree with every noun.
  const getSourceName = (nameKey: string, count: number): string => {
    const key = count === 1
      ? `gamification.xp.xpNotification.sources_one.${nameKey}`
      : `gamification.xp.xpNotification.sources.${nameKey}`;
    return t(key as any);
  };

  // Whole sentence, phrased per language: "2 habits completed",
  // "3 journal entries written", "Goal completed".
  const getSummary = (source: BatchedSource): string => {
    const key = source.count === 1
      ? `gamification.xp.xpNotification.summaries.${source.nameKey}.one`
      : `gamification.xp.xpNotification.summaries.${source.nameKey}.other`;
    return t(key as any, { count: source.count });
  };

  const generateAccessibilityAnnouncement = (data: BatchedNotification): string => {
    const netXP = data.totalXP;

    if (netXP <= 0) {
      if (netXP === 0) {
        return t('gamification.xp.xpNotification.announcements.balanced', { xp: Math.abs(netXP) });
      }
      return t('gamification.xp.xpNotification.announcements.decreased', { xp: Math.abs(netXP) });
    }

    if (data.sources.length === 1) {
      const source = data.sources[0]!;
      const sourceName = getSourceName(source.nameKey, source.count);
      const key = source.count === 1
        ? 'gamification.xp.xpNotification.announcements.single'
        : 'gamification.xp.xpNotification.announcements.multipleSame';
      return t(key, { xp: netXP, count: source.count, source: sourceName });
    }

    return t('gamification.xp.xpNotification.announcements.multipleMixed', {
      xp: netXP,
      sourceCount: data.sources.length,
    });
  };

  const generateNotificationText = (data: BatchedNotification): string => {
    const netXP = data.totalXP;

    if (netXP <= 0) {
      if (netXP === 0) {
        return `📊 ${t('gamification.xp.xpNotification.messages.balanced')}`;
      }
      return `📉 ${t('gamification.xp.xpNotification.messages.reversed')}`;
    }

    if (data.sources.length === 0) {
      return `📊 ${t('gamification.xp.xpNotification.messages.updated')}`;
    }

    if (data.sources.length === 1) {
      const source = data.sources[0]!;
      return `${source.icon} ${getSummary(source)}`;
    }

    // Mixed activity: list the nouns and let the XP chip carry the reward.
    // No trailing verb — "2 habits and 3 journal entries completed" was wrong
    // in English and ungrammatical in German and Spanish.
    const parts = data.sources.map(
      source => `${source.icon} ${source.count} ${getSourceName(source.nameKey, source.count)}`
    );

    const and = t('gamification.xp.xpNotification.messages.and');
    if (parts.length === 2) {
      return `🎉 ${parts.join(` ${and} `)}`;
    }
    const last = parts.pop();
    return `🎉 ${parts.join(', ')}, ${and} ${last ?? ''}`;
  };

  // Built once per content change rather than on every render, so a re-render
  // caused by something else costs nothing.
  const texts = useMemo(
    () => (batchedData
      ? {
          message: generateNotificationText(batchedData),
          announcement: generateAccessibilityAnnouncement(batchedData),
        }
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batchedData, t]
  );

  // ========================================
  // ANIMATIONS
  // ========================================

  // Announce to screen readers when XP is gained
  useEffect(() => {
    if (visible && texts) {
      AccessibilityInfo.announceForAccessibility(texts.announcement);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, contentKey]);

  // Once the bar is out of the tree, put the driver back to its opening state
  // so the next batch gets a real entrance. Nothing is on screen at this point,
  // so this cannot be seen.
  useEffect(() => {
    if (visible) {
      return;
    }
    presence.stopAnimation();
    presence.setValue(HIDDEN);
    phaseRef.current = 'hidden';
  }, [visible, presence]);

  useEffect(() => {
    if (!visible || !batchedData) {
      return () => {};
    }

    const entranceDuration = isReduceMotionEnabled ? ENTRANCE_DURATION_REDUCED : ENTRANCE_DURATION;
    const exitDuration = isReduceMotionEnabled ? EXIT_DURATION_REDUCED : EXIT_DURATION;

    if (phaseRef.current !== 'shown') {
      // Covers BOTH the first appearance and new XP landing mid-exit. In the
      // second case the driver simply turns around from wherever it is, instead
      // of the bar vanishing mid-sentence or snapping back to the top.
      phaseRef.current = 'shown';
      Animated.timing(presence, {
        toValue: SHOWN,
        duration: entranceDuration,
        easing: isReduceMotionEnabled ? Easing.out(Easing.quad) : Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }

    // Sliding auto-dismiss: re-armed by each new gain, so rapid tapping keeps
    // the bar alive instead of restarting its animation.
    const dismissTimer = setTimeout(() => {
      phaseRef.current = 'leaving';
      Animated.timing(presence, {
        toValue: HIDDEN,
        duration: exitDuration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && phaseRef.current === 'leaving') {
          onAnimationCompleteRef.current?.();
        }
      });
    }, DISMISS_DELAY);

    return () => clearTimeout(dismissTimer);
    // `contentKey` re-arms the timer; `batchedData` itself deliberately does not
    // appear here, because a re-render must not be able to replay the entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, contentKey, isReduceMotionEnabled, presence]);

  // ========================================
  // RENDER
  // ========================================

  if (!visible || !batchedData || !texts) {
    return null;
  }

  return (
    <Animated.View
      style={animatedStyle}
      pointerEvents="none"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={texts.announcement}
      accessibilityLiveRegion="assertive"
      importantForAccessibility="yes"
    >
      <View
        style={styles.notification}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={texts.announcement}
      >
        {/* Notification Text */}
        <Text
          style={styles.messageText}
          numberOfLines={2}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.xpNotification.accessibility.notification', { message: texts.message })}
        >
          {texts.message}
        </Text>

        {/* XP Amount */}
        <View
          style={[
            styles.xpContainer,
            batchedData.totalXP < 0 && styles.xpContainerNegative,
            batchedData.totalXP === 0 && styles.xpContainerNeutral
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.xpNotification.accessibility.amount', {
            amount: batchedData.totalXP,
            type: batchedData.totalXP > 0
              ? t('gamification.xp.xpNotification.accessibility.typeGained')
              : batchedData.totalXP < 0
                ? t('gamification.xp.xpNotification.accessibility.typeLost')
                : t('gamification.xp.xpNotification.accessibility.typeBalanced')
          })}
        >
          <Text
            style={[
              styles.xpLabel,
              batchedData.totalXP < 0 && styles.xpLabelNegative,
              batchedData.totalXP === 0 && styles.xpLabelNeutral
            ]}
            importantForAccessibility="no"
          >
            {batchedData.totalXP > 0 ? '+' : ''}{batchedData.totalXP}
          </Text>
          <Text
            style={[
              styles.xpSuffix,
              batchedData.totalXP < 0 && styles.xpSuffixNegative,
              batchedData.totalXP === 0 && styles.xpSuffixNeutral
            ]}
            importantForAccessibility="no"
          >{t('gamification.xp.xpNotification.unit')}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

XpNotification.displayName = 'XpNotification';

// ========================================
// STYLES
// ========================================

const createStyles = (colors: any, topInset: number, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: topInset + 10,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  notification: {
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: screenWidth - 32,
    minWidth: 280,
    // Depth in light mode only. Dark mode gets it from the elevated background
    // plus the border — shadows (elevation included) are banned there.
    ...(isDark
      ? {}
      : Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
          },
          android: { elevation: 6 },
          default: {},
        })),
  },
  messageText: {
    flex: 1,
    fontSize: scaleFont(15),
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
    lineHeight: scaleFont(20),
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  xpContainerNegative: {
    backgroundColor: colors.error + '15',
  },
  xpContainerNeutral: {
    backgroundColor: colors.textSecondary + '15',
  },
  xpLabel: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    color: colors.primary,
  },
  xpLabelNegative: {
    color: colors.error,
  },
  xpLabelNeutral: {
    color: colors.textSecondary,
  },
  xpSuffix: {
    fontSize: scaleFont(12),
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 2,
    opacity: 0.8,
  },
  xpSuffixNegative: {
    color: colors.error,
  },
  xpSuffixNeutral: {
    color: colors.textSecondary,
  },
});
