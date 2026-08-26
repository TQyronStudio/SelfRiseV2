import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  AccessibilityInfo
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { XPSourceType } from '../../types/gamification';
import { useI18n } from '../../hooks/useI18n';
import { scaleFont } from '../../utils/responsive';
import {
  XP_POPUP_OPACITY,
  XP_POPUP_SCALE,
  XP_POPUP_TOTAL_DURATION,
  XP_POPUP_TRANSLATE_Y,
} from './xpPopupTimeline';

interface XpPopupAnimationProps {
  visible: boolean;
  amount: number;
  source: XPSourceType;
  position?: { x: number; y: number };
  onAnimationComplete?: () => void;
}

export const XpPopupAnimation: React.FC<XpPopupAnimationProps> = ({
  visible,
  amount,
  source,
  position = { x: 0, y: 0 },
  onAnimationComplete,
}) => {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();

  // Starts at 0, so the very FIRST painted frame is already the correct opening
  // state (invisible, scale 0.5). The old code seeded scale at 0.8 and only
  // corrected it to 0.5 from an effect — one frame late, in a size that appears
  // nowhere in the intended animation.
  const progress = useRef(new Animated.Value(0)).current;

  // Timeline lives in `xpPopupTimeline.ts` so it can be unit-tested; the
  // component only feeds the driver into it.
  const scale = progress.interpolate(XP_POPUP_SCALE);
  const opacity = progress.interpolate(XP_POPUP_OPACITY);
  const translateY = progress.interpolate(XP_POPUP_TRANSLATE_Y);

  // Get source-specific colors and icons
  const getSourceStyle = () => {
    // For negative amounts, use red colors regardless of source
    if (amount < 0) {
      return {
        color: '#F44336',
        icon: '💸',
        shadowColor: '#F44336',
      };
    }

    switch (source) {
      case XPSourceType.HABIT_COMPLETION:
      case XPSourceType.HABIT_BONUS:
        return {
          color: '#4CAF50',
          icon: '🏃‍♂️',
          shadowColor: '#4CAF50',
        };
      case XPSourceType.JOURNAL_ENTRY:
      case XPSourceType.JOURNAL_BONUS:
        return {
          color: '#2196F3',
          icon: '📝',
          shadowColor: '#2196F3',
        };
      case XPSourceType.GOAL_PROGRESS:
      case XPSourceType.GOAL_COMPLETION:
        return {
          color: '#FF9800',
          icon: '🎯',
          shadowColor: '#FF9800',
        };
      case XPSourceType.HABIT_STREAK_MILESTONE:
      case XPSourceType.JOURNAL_STREAK_MILESTONE:
        return {
          color: '#9C27B0',
          icon: '🔥',
          shadowColor: '#9C27B0',
        };
      case XPSourceType.ACHIEVEMENT_UNLOCK:
        return {
          color: '#FFD700',
          icon: '🏆',
          shadowColor: '#FFD700',
        };
      case XPSourceType.JOURNAL_BONUS_MILESTONE:
        return {
          color: '#2196F3',
          icon: '⭐',
          shadowColor: '#2196F3',
        };
      case XPSourceType.GOAL_MILESTONE:
        return {
          color: '#FF9800',
          icon: '🎯',
          shadowColor: '#FF9800',
        };
      case XPSourceType.MONTHLY_CHALLENGE:
        return {
          color: '#673AB7',
          icon: '📅',
          shadowColor: '#673AB7',
        };
      case XPSourceType.XP_MULTIPLIER_BONUS:
        return {
          color: '#E91E63',
          icon: '⚡',
          shadowColor: '#E91E63',
        };
      default:
        return {
          color: colors.primary,
          icon: '✨',
          shadowColor: colors.primary,
        };
    }
  };

  const sourceStyle = getSourceStyle();

  // Generate accessibility announcement
  const getAccessibilityAnnouncement = (): string => {
    const sourceName = (() => {
      switch (source) {
        case XPSourceType.HABIT_COMPLETION:
          return t('gamification.xp.sources.habit_completion');
        case XPSourceType.HABIT_BONUS:
          return t('gamification.xp.sources.habit_bonus');
        case XPSourceType.JOURNAL_ENTRY:
          return t('gamification.xp.sources.journal_entry');
        case XPSourceType.JOURNAL_BONUS:
          return t('gamification.xp.sources.journal_bonus');
        case XPSourceType.GOAL_PROGRESS:
          return t('gamification.xp.sources.goal_progress');
        case XPSourceType.GOAL_COMPLETION:
          return t('gamification.xp.sources.goal_completion');
        case XPSourceType.HABIT_STREAK_MILESTONE:
          return t('gamification.xp.sources.habit_streak_milestone');
        case XPSourceType.JOURNAL_STREAK_MILESTONE:
          return t('gamification.xp.sources.journal_streak_milestone');
        case XPSourceType.ACHIEVEMENT_UNLOCK:
          return t('gamification.xp.sources.achievement_unlock');
        case XPSourceType.JOURNAL_BONUS_MILESTONE:
          return t('gamification.xp.sources.journal_bonus_milestone');
        case XPSourceType.GOAL_MILESTONE:
          return t('gamification.xp.sources.goal_milestone');
        case XPSourceType.MONTHLY_CHALLENGE:
          return t('gamification.xp.sources.monthly_challenge');
        case XPSourceType.XP_MULTIPLIER_BONUS:
          return t('gamification.xp.sources.xp_multiplier_bonus');
        default:
          return t('gamification.xp.sources.general_activity');
      }
    })();

    // Ensure sourceName is always a string to prevent .slice() errors
    const safeSourceName = (sourceName || t('gamification.xp.sources.general_activity')).toString();

    if (amount >= 0) {
      return t('gamification.xp.popup.gained', { amount, source: safeSourceName });
    } else {
      return t('gamification.xp.popup.lost', { amount: Math.abs(amount), source: safeSourceName });
    }
  };

  // Announce to screen readers when popup becomes visible
  useEffect(() => {
    if (visible) {
      const announcement = getAccessibilityAnnouncement();
      // Only announce for meaningful amounts (to avoid spam for small changes)
      if (Math.abs(amount) >= 5) {
        AccessibilityInfo.announceForAccessibility(announcement);
      }
    }
  }, [visible, amount, source]);

  // Kept in a ref so a changing callback identity can never restart the
  // animation half-way through.
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  onAnimationCompleteRef.current = onAnimationComplete;

  useEffect(() => {
    if (!visible) {
      return;
    }

    // No setValue() anywhere: every popup is a fresh mount with its own key, so
    // there is nothing to reset — and a setValue racing the start() is exactly
    // the kind of JS/native ordering gap that stranded the bubble at 0.5.
    // Easing must be linear: the shaping lives in the timeline keyframes, and
    // the default inOut easing would stretch every one of them.
    Animated.timing(progress, {
      toValue: 1,
      duration: XP_POPUP_TOTAL_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onAnimationCompleteRef.current?.();
      }
    });
  }, [visible, progress]);

  if (!visible) {
    return null;
  }

  const styles = createStyles(colors, isDark);
  const accessibilityLabel = getAccessibilityAnnouncement();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          // Order matters: transforms apply right-to-left, so anything listed
          // AFTER scale gets multiplied by it. With translateX last, the bubble
          // slid sideways as it grew (50px at scale 0.5 but 57px at 1.15) — the
          // small and large screenshots sit at visibly different x positions.
          // Both offsets now sit outside the scale and stay put.
          transform: [
            { translateX: position.x },
            { translateY },
            { scale },
          ],
          top: position.y,
        },
      ]}
      pointerEvents="none"
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      importantForAccessibility={Math.abs(amount) >= 5 ? "yes" : "no-hide-descendants"}
    >
      <View
        style={[styles.popup, isDark ? null : { shadowColor: sourceStyle.shadowColor }]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
      >
        <Text
          style={styles.icon}
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={t(`gamification.sources.${source}.icon_description`)}
        >
          {sourceStyle.icon}
        </Text>
        <Text
          style={[styles.xpText, { color: sourceStyle.color }]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={t('gamification.xp.popup.amount_label', {
            amount: Math.abs(amount),
            sign: amount >= 0 ? 'plus' : 'minus'
          })}
        >
          {amount >= 0 ? '+' : ''}{amount} XP
        </Text>
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  popup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackgroundElevated,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    // The bubble used to receive only `shadowColor` — with no opacity, radius
    // or elevation, that is dead code and nothing was ever drawn. On Android it
    // left a flat rectangle that read as a rendering glitch rather than a
    // reward. Light mode only: dark mode bans shadows AND elevation.
    ...(isDark
      ? {}
      : Platform.select({
          ios: {
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
          },
          android: { elevation: 8 },
          default: {},
        })),
  },
  // Sized with scaleFont like the rest of the app. Raw 16pt made the bubble
  // look shrunken next to scaled-up UI on wide Android screens.
  icon: {
    fontSize: scaleFont(18),
    marginRight: 6,
  },
  xpText: {
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});