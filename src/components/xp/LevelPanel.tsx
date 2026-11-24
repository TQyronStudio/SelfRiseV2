/**
 * The level panel (migration E9, R-31; from the Design Lab's levelPanel.tsx,
 * kolo 34 / 44). A tap on the level badge and the level's detail grows out of
 * it: the rank, total XP, what is missing to the next level, today's XP, the XP
 * multiplier in its three states and the way to all levels.
 *
 * - ONE value drives everything (`progress`, 0 = badge alone … 1 = open): the dim,
 *   the card growing from the badge's centre and the badge growing into the
 *   panel's big ring. The badge is never copied — the ring in the panel IS the
 *   badge, so XP landing while it is open still lands.
 * - Closes by a tap beside it, a tap on the ring, Android back, a tab switch, or a
 *   drag that scrubs the same value (can be let go halfway to stay — R-33).
 * - Only on the five tabs, not over a sheet / detail, not during a moment; a
 *   moment that arrives puts it away. Rules: levelPanelLogic.ts (tested).
 * - The dim ends above the tab bar and the ad banner — never covers them.
 * - RN Animated with the native driver: the drag is a handful of setValue calls.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated as RNAnimated,
  BackHandler,
  Easing,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, radius, space, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { GamificationService } from '@/src/services/gamificationService';
import { getXPProgress } from '@/src/services/levelCalculation';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { addAppEventListener } from '@/src/utils/appEvents';
import { contentColumn } from '@/src/utils/layout';
import {
  badgeTapAction,
  dragDismisses,
  dragProgress,
  timeLeftParts,
} from '@/src/services/levels/levelPanelLogic';
import { rankTitle } from '@/src/services/levels/rankTitle';
import { AppText, Divider, HelpLink, PressableScale, ProgressBar } from '@/src/components/ui';
import { TOP_ROW_HEIGHT } from '@/src/components/ui/TopRow';
import type { MultiplierState } from './useMultiplierState';

export const LEVEL_BADGE_OPEN_SCALE = 1.25;
export const LEVEL_BADGE_OPEN_DROP = 8;
const BADGE = TOP_ROW_HEIGHT;
/** Where the badge sits in the layer's row (XpDisplay: paddingHorizontal space.lg, centred in 48). */
const PIN = { top: 0, left: space.lg } as const;
const PAD = space.md;
const RING = BADGE * LEVEL_BADGE_OPEN_SCALE;
const CARD_LEFT = PIN.left - PAD;
const CARD_TOP = PIN.top + LEVEL_BADGE_OPEN_DROP - PAD;
const ORIGIN_X = PIN.left + BADGE / 2 - CARD_LEFT;
const ORIGIN_Y = PIN.top + BADGE / 2 - CARD_TOP;
const CARD_MAX_WIDTH = 440;
const [GOLD, GOLD_DEEP] = fixed.gold;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface LevelPanelControl {
  shown: boolean;
  progress: RNAnimated.Value;
  onBadgePress: () => void;
  close: () => void;
  grab: () => void;
  drag: (dy: number) => void;
  drop: (dy: number, vy: number) => void;
}

export function useLevelPanel({
  closeKey,
  covered,
  moment,
  openNote,
}: {
  /** Changing it (the active tab) closes the panel. */
  closeKey: unknown;
  covered: boolean;
  moment: 'quiet' | 'big' | null;
  /** The quiet note's own tap — while a note is out, a tap on the badge is the note's. */
  openNote: () => void;
}): LevelPanelControl {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new RNAnimated.Value(0)).current;
  const [shown, setShown] = useState(false);
  const wanted = useRef(false);
  const blocked = useRef(false);
  blocked.current = !!moment || covered;
  const grabbedAt = useRef<number | null>(null);

  const settle = useCallback(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    RNAnimated.spring(progress, {
      toValue: 1,
      damping: 19,
      stiffness: 230,
      mass: 0.9,
      // Rest early: until the spring rests the ring is resampled and looks soft.
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.1,
      useNativeDriver: true,
    }).start();
  }, [progress, reducedMotion]);

  const open = useCallback(() => {
    wanted.current = true;
    Keyboard.dismiss();
    setShown(true);
    settle();
  }, [settle]);

  const close = useCallback(() => {
    if (!wanted.current) return;
    wanted.current = false;
    const unmount = () => {
      if (!wanted.current) setShown(false);
    };
    if (reducedMotion) {
      progress.setValue(0);
      unmount();
      return;
    }
    RNAnimated.timing(progress, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) unmount();
    });
  }, [progress, reducedMotion]);

  const grab = useCallback(() => {
    if (!blocked.current) wanted.current = true;
    grabbedAt.current = null;
    progress.stopAnimation(value => {
      grabbedAt.current = Math.min(1, value);
    });
  }, [progress]);

  const drag = useCallback(
    (dy: number) => {
      if (grabbedAt.current === null) return;
      progress.setValue(dragProgress(dy, grabbedAt.current));
    },
    [progress]
  );

  const drop = useCallback(
    (dy: number, vy: number) => {
      const closedMeanwhile = !wanted.current;
      if (closedMeanwhile || dragDismisses(dy, vy)) {
        if (!closedMeanwhile) feel('tap');
        wanted.current = true;
        close();
      } else {
        settle();
      }
    },
    [close, settle]
  );

  const onBadgePress = useCallback(() => {
    const action = badgeTapAction({ shown: wanted.current, covered, moment });
    if (action === 'none') return;
    feel('tap');
    if (action === 'open') open();
    else if (action === 'close') close();
    else openNote();
  }, [covered, moment, open, close, openNote]);

  useEffect(() => {
    if (moment || covered) close();
  }, [moment, covered, close]);
  useEffect(() => {
    close();
  }, [closeKey, close]);
  useEffect(() => {
    if (!shown) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [shown, close]);

  return { shown, progress, onBadgePress, close, grab, drag, drop };
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export function LevelPanel({
  panel,
  shownXp,
  multiplier,
  topInset,
  bottomChrome,
  onOpenLevels,
  onHelp,
  onActivate,
}: {
  panel: LevelPanelControl;
  /** The XP the badge shows (sparks landed). */
  shownXp: number;
  multiplier: MultiplierState;
  topInset: number;
  /** Tab bar + banner: the dim ends above them. */
  bottomChrome: number;
  onOpenLevels: () => void;
  /** The help sheet opens after the panel went away. */
  onHelp: () => void;
  /** Switch the harmony multiplier on (the activation window follows). */
  onActivate: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const reducedMotion = useReducedMotion();
  const { progress } = panel;
  const fmt = useCallback((n: number) => new Intl.NumberFormat(locale).format(n), [locale]);

  const now = getXPProgress(Math.max(0, shownXp));
  const level = now.currentLevel;
  const title = rankTitle(level, t);
  const toNext = t('gamification.progress.xpToLevel', { xp: fmt(now.xpToNextLevel), level: level + 1 });

  // "Today": the one source the Home chip uses (O-9).
  const [xpToday, setXpToday] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => GamificationService.getTodayXP().then(v => alive && setXpToday(v));
    void load();
    const sub = addAppEventListener('xpGained', () => setTimeout(() => void load(), 400));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${t('onboarding.done.statLevel', { level })}. ${title}. ${toNext}`);
    // Once, when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const control = useRef(panel);
  control.current = panel;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => control.current.grab(),
      onPanResponderMove: (_e, g) => control.current.drag(g.dy),
      onPanResponderRelease: (_e, g) => control.current.drop(g.dy, g.vy),
      onPanResponderTerminate: () => control.current.drop(0, 0),
    })
  ).current;

  const { scrim, cardOpacity, cardScale, contentOpacity, contentRise } = useMemo(
    () => ({
      scrim: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
      cardOpacity: progress.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
      cardScale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
      contentOpacity: progress.interpolate({ inputRange: [0.5, 0.95], outputRange: [0, 1], extrapolate: 'clamp' }),
      contentRise: progress.interpolate({ inputRange: [0.5, 1], outputRange: [8, 0], extrapolate: 'clamp' }),
    }),
    [progress]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityViewIsModal onAccessibilityEscape={panel.close}>
      <RNAnimated.View
        style={[styles.scrim, { bottom: bottomChrome, backgroundColor: withAlpha(fixed.black, 0.32), opacity: scrim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={panel.close}
          accessibilityRole="button"
          accessibilityLabel={t('gamification.levelPanel.close')}
        />
      </RNAnimated.View>

      <View style={[styles.pin, { top: topInset + CARD_TOP }]} pointerEvents="box-none">
        <View style={[contentColumn, styles.column]} pointerEvents="box-none">
          <RNAnimated.View
            {...(reducedMotion ? null : pan.panHandlers)}
            style={[
              styles.card,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <RNAnimated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentRise }] }}>
              {/* The ring on the left is the badge itself, drawn above the card. */}
              <View style={styles.header}>
                <AppText variant="overline" tone="muted" numberOfLines={1}>
                  {t('onboarding.done.statLevel', { level })}
                </AppText>
                <AppText variant="title" numberOfLines={1}>
                  {title}
                </AppText>
              </View>

              <View style={styles.body}>
                <ProgressBar progress={now.xpProgress / 100} colors={fixed.gold} delay={140} />
                <View style={styles.underBar}>
                  <AppText variant="numberSm" numberOfLines={1}>
                    {t('gamification.xp.amount', { xp: fmt(Math.max(0, shownXp)) })}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.toNext}>
                    {toNext}
                  </AppText>
                </View>

                <Divider style={styles.dividerTop} />
                <View style={styles.row}>
                  <AppText variant="label" tone="muted">
                    {t('common.dates.today')}
                  </AppText>
                  {xpToday !== null && (
                    <AppText variant="numberSm" tone="reward">
                      {`${xpToday < 0 ? '−' : '+'}${t('gamification.xp.amount', { xp: fmt(Math.abs(xpToday)) })}`}
                    </AppText>
                  )}
                </View>
                <Divider />
                <MultiplierPart
                  multiplier={multiplier}
                  onHelp={() => {
                    panel.close();
                    onHelp();
                  }}
                  onActivate={() => {
                    panel.close();
                    onActivate();
                  }}
                />
                <PressableScale
                  onPress={() => {
                    panel.close();
                    onOpenLevels();
                  }}
                  accessibilityRole="link"
                  accessibilityLabel={t('gamification.levelPanel.allLevels')}
                  style={[styles.link, { backgroundColor: c.primarySoft }]}
                >
                  <AppText variant="bodyStrong" tone="primary">
                    {t('gamification.levelPanel.allLevels')}
                  </AppText>
                  <Ionicons name="arrow-forward" size={18} color={c.primary} style={styles.linkIcon} />
                </PressableScale>
              </View>
            </RNAnimated.View>
          </RNAnimated.View>
        </View>
      </View>
    </View>
  );
}

/**
 * Running: the factor and the time left. Ready: the seven days and the one gold
 * button. Building: the seven days, today's three and what a harmony day is.
 */
function MultiplierPart({
  multiplier,
  onActivate,
  onHelp,
}: {
  multiplier: MultiplierState;
  onActivate: () => void;
  onHelp: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { status, today, print } = multiplier;
  if (!status) return null;

  if (status.kind === 'running') {
    const left = timeLeftParts(status.minutesLeft);
    return (
      <View style={styles.row}>
        <AppText variant="label" tone="muted" numberOfLines={1} style={styles.rowLabel}>
          {t('gamification.levelPanel.multiplier', { factor: print(status.factor) })}
        </AppText>
        <AppText variant="numberSm">
          {t(left.unit === 'h' ? 'gamification.levelPanel.timeLeftHours' : 'gamification.levelPanel.timeLeftMinutes', {
            count: left.value,
          })}
        </AppText>
      </View>
    );
  }

  const required = XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED;
  const days = status.kind === 'ready' ? required : status.days;
  const factor = print(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER);
  const daysText = t('gamification.levelPanel.harmonyDays', { done: days, required });
  const parts = [
    { key: 'habits', label: t('gamification.levelPanel.partHabits'), done: today.habits },
    { key: 'journal', label: t('gamification.levelPanel.partJournal'), done: today.journal },
    { key: 'goals', label: t('gamification.levelPanel.partGoals'), done: today.goals },
  ];
  const harmonyLabel = t('gamification.multiplier.harmonyStreak');

  return (
    <View style={styles.harmony}>
      <View style={styles.row}>
        <AppText variant="label" tone="muted" numberOfLines={1} style={styles.rowLabel}>
          {harmonyLabel}
        </AppText>
        <HelpLink topic="multiplier" bottomInset={0} onOpen={onHelp} />
        <View style={styles.flex} />
        <AppText variant="numberSm" numberOfLines={1}>
          {status.kind === 'building' && status.cooldownDays > 0
            ? t('gamification.levelPanel.harmonyNext', { count: status.cooldownDays })
            : daysText}
        </AppText>
      </View>
      <View style={styles.segments} accessible accessibilityLabel={`${harmonyLabel}: ${daysText}`}>
        {Array.from({ length: required }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < days ? GOLD_DEEP : c.track }]} />
        ))}
      </View>

      {status.kind === 'ready' ? (
        <PressableScale
          onPress={onActivate}
          accessibilityRole="button"
          accessibilityLabel={t('gamification.levelPanel.switchOn', {
            factor,
            hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION,
          })}
          style={styles.switchOn}
        >
          <LinearGradient colors={[GOLD, GOLD_DEEP]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, styles.pill]} />
          <Ionicons name="flash" size={16} color={fixed.goldInk} style={styles.switchIcon} />
          <AppText variant="bodyStrong" style={{ color: fixed.goldInk }}>
            {t('gamification.levelPanel.switchOn', { factor, hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION })}
          </AppText>
        </PressableScale>
      ) : (
        <>
          <View style={styles.parts}>
            {parts.map(part => (
              <View
                key={part.key}
                style={styles.part}
                accessible
                accessibilityLabel={t(part.done ? 'gamification.levelPanel.partDone' : 'gamification.levelPanel.partOpen', {
                  part: part.label,
                })}
              >
                <Ionicons
                  name={part.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={part.done ? c.successText : c.textFaint}
                />
                <AppText variant="caption" tone={part.done ? 'text' : 'muted'} numberOfLines={1} style={styles.partLabel}>
                  {part.label}
                </AppText>
              </View>
            ))}
          </View>
          <AppText variant="caption" tone="faint" style={styles.hint}>
            {t('gamification.levelPanel.harmonyHint')}
          </AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  pin: { position: 'absolute', left: 0, right: 0 },
  column: { paddingHorizontal: CARD_LEFT },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    padding: PAD,
    borderRadius: radius.lg,
    borderWidth: 1,
    boxShadow: `0px 18px 44px ${withAlpha(fixed.black, 0.2)}`,
    transformOrigin: [ORIGIN_X, ORIGIN_Y, 0],
  },
  header: { height: RING, paddingLeft: RING + space.md, justifyContent: 'center' },
  body: { marginTop: space.lg, paddingHorizontal: space.xs },
  underBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  toNext: { flexShrink: 1, marginLeft: space.md, textAlign: 'right' },
  dividerTop: { marginTop: space.lg },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { flexShrink: 1, marginRight: space.xs },
  harmony: { paddingBottom: space.md },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: radius.pill },
  parts: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  part: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  partLabel: { marginLeft: 4, flexShrink: 1 },
  hint: { marginTop: space.xs },
  switchOn: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  pill: { borderRadius: radius.pill },
  switchIcon: { marginRight: space.sm },
  link: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
    borderRadius: radius.pill,
  },
  linkIcon: { marginLeft: space.sm },
});
