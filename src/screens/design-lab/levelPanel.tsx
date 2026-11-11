/**
 * The level panel (R-31, kolo 34 — Petr's idea): a tap on the pinned level badge
 * and the level's detail grows out of it. It replaces the Level card on Home — the
 * badge already says the level on every screen, the panel says the rest:
 * the level's name, total XP, how much is missing to the next level, today's gain,
 * the running multiplier and the way to all levels.
 *
 * How it moves:
 * - ONE value drives everything (`progress`, 0 = badge alone … 1 = panel open): the
 *   dimmed page, the card growing from the badge's centre, the badge growing into
 *   the panel's big ring (xpFlight.tsx → LevelBadge). The badge is never copied —
 *   the ring in the panel IS the badge, so XP landing while it is open still lands.
 * - It closes by a tap beside it, a tap on the ring, Android back, or by dragging:
 *   the drag scrubs that same value, so the panel shrinks back under the finger
 *   and can be let go halfway to stay (R-33 — the first draggable window).
 *
 * Rules (levelPanelLogic.ts):
 * - One thing out of the badge at a time: while a quiet trophy note is out, a tap
 *   on the badge is a tap on the note; the "LEVEL UP" tag gives way to the panel.
 * - Only on the five main tabs: not over an open detail, sheet or page (labCover.ts),
 *   and a celebration that arrives puts the panel away.
 * - Switching tabs closes it.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Lives where the badge lives (above the tab screens, below the tab bar and the
 *   banner — the banner is never dimmed or covered).
 * - RN Animated with the native driver (lesson 46): the drag is a handful of
 *   `setValue` calls, not a Reanimated style.
 * - Numbers: the same XP the badge shows (settled, after the sparks land). "Today"
 *   must come from the one source the Home chip uses; the multiplier row only while
 *   a multiplier runs.
 * - The stored "Level" section of Home customisation needs a migration (R-31).
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { selection } from '@/src/services/hapticsService';
import { getLevelInfo, getXPProgress } from '@/src/services/levelCalculation';
import { contentColumn } from '@/src/utils/layout';
import { useCelebrationGate } from './celebrationDirector';
import { useLabCovered } from './labCover';
import {
  Divider,
  LabText,
  PressableScale,
  ProgressBar,
  useLab,
} from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import {
  badgeTapAction,
  dragDismisses,
  dragProgress,
  timeLeftParts,
} from './levelPanelLogic';
import { formatThousands, MOCK_COPY, MOCK_STATS } from './mockCopy';
import {
  LAB_START_XP,
  LEVEL_BADGE_OPEN_DROP,
  LEVEL_BADGE_OPEN_SCALE,
  LEVEL_BADGE_SIZE,
  LEVEL_GOLD,
  useLabXp,
} from './xpFlight';

// ---------------------------------------------------------------------------
// Geometry — the card is laid out around the badge, which never leaves its pin
// ---------------------------------------------------------------------------

/** Where the badge is pinned inside the content column (DesignLabScreen). */
export const LEVEL_BADGE_PIN = { top: labSpace.sm, left: labSpace.xl } as const;

const PAD = labSpace.md;
/** The badge while the panel is open. */
const RING = LEVEL_BADGE_SIZE * LEVEL_BADGE_OPEN_SCALE;
const CARD_LEFT = LEVEL_BADGE_PIN.left - PAD;
const CARD_TOP = LEVEL_BADGE_PIN.top + LEVEL_BADGE_OPEN_DROP - PAD;
/** The closed badge's centre, in the card's own frame: the card grows from there. */
const ORIGIN_X = LEVEL_BADGE_PIN.left + LEVEL_BADGE_SIZE / 2 - CARD_LEFT;
const ORIGIN_Y = LEVEL_BADGE_PIN.top + LEVEL_BADGE_SIZE / 2 - CARD_TOP;
const CARD_MAX_WIDTH = 440;

// ---------------------------------------------------------------------------
// State — owned by whoever renders the badge
// ---------------------------------------------------------------------------

export interface LevelPanelControl {
  /** The panel is mounted (also while it is still closing). */
  shown: boolean;
  /** 0 = badge alone … 1 = open. Native driver; the drag sets it directly. */
  progress: RNAnimated.Value;
  /** A tap on the badge or on its "LEVEL UP" tag. */
  onBadgePress: () => void;
  /** A tap would open the panel right now (nothing celebrating, nothing open). */
  canOpen: boolean;
  close: () => void;
  /** A finger took hold of the panel — also of one that was already leaving. */
  grab: () => void;
  /** The finger is `dy` px from where it took hold. */
  drag: (dy: number) => void;
  /** The finger let go (`vy` in px per ms): close, or back to fully open. */
  drop: (dy: number, vy: number) => void;
}

/** `closeKey` changing (the active tab) closes the panel. */
export function useLevelPanel(closeKey: unknown): LevelPanelControl {
  const reducedMotion = useReducedMotion();
  const covered = useLabCovered();
  const { moment, openNote } = useCelebrationGate();
  const progress = useRef(new RNAnimated.Value(0)).current;
  const [shown, setShown] = useState(false);
  /** What the user asked for last — `shown` stays true while the close plays. */
  const wanted = useRef(false);
  /** Something else has the stage: the panel may only leave. */
  const blocked = useRef(false);
  blocked.current = !!moment || covered;
  /** How open the panel was when the finger took it; null until that is known. */
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
      // Rest early (~0.45 s, not ~1 s): until the spring rests the ring sits a
      // fraction of a pixel off and its picture is resampled — it looked soft for
      // a second after the motion was already over (Petr, kolo 34).
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
      // Reopened while it was closing: it stays.
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
    // Caught on its way out: it is the user's again, and the release decides —
    // unless it was leaving because something else took the stage.
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
      // Closed from elsewhere while the finger held it (a celebration, a tab):
      // the drag stopped that close, so it is finished here.
      const closedMeanwhile = !wanted.current;
      if (closedMeanwhile || dragDismisses(dy, vy)) {
        if (!closedMeanwhile) selection();
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
    selection();
    if (action === 'open') open();
    else if (action === 'close') close();
    else openNote();
  }, [covered, moment, open, close, openNote]);

  // A celebration arrives, or something opens over the tab: the panel steps back.
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

  return {
    shown,
    progress,
    onBadgePress,
    canOpen: !moment && !covered,
    close,
    grab,
    drag,
    drop,
  };
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export function LevelPanel({
  panel,
  onOpenLevels,
}: {
  panel: LevelPanelControl;
  /** "All levels": the journey page (LevelsOverviewConcept.tsx). */
  onOpenLevels: () => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.levelPanel;
  const sep = copy.thousandsSeparator;
  const reducedMotion = useReducedMotion();
  const { progress } = panel;

  // The XP the user has seen arrive: it moves when a whole wave of sparks has
  // landed — so after a level up in flight the panel follows the ring a beat later.
  const { settledXp } = useLabXp();
  const now = getXPProgress(settledXp);
  const level = now.currentLevel;
  const title = getLevelInfo(level).title;
  const toNext = copy.toNext(
    formatThousands(now.xpToNextLevel, sep),
    level + 1
  );
  // Everything earned in this lab session went through the badge. (Home's chip
  // counts only habits in the mock — live, both read one source.)
  const xpToday = MOCK_STATS.xpToday + (settledXp - LAB_START_XP);
  const multiplier = MOCK_STATS.multiplier;
  const left = timeLeftParts(multiplier.minutesLeft);

  const announcement = `${copy.level(level)}. ${title}. ${toNext}`;
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(announcement);
    // Once, when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The drag scrubs the one value everything hangs on; the callbacks are read
  // through a ref so the responder is created once.
  const control = useRef(panel);
  control.current = panel;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => control.current.grab(),
      onPanResponderMove: (_e, g) => control.current.drag(g.dy),
      onPanResponderRelease: (_e, g) => control.current.drop(g.dy, g.vy),
      onPanResponderTerminate: () => control.current.drop(0, 0),
    })
  ).current;

  const openLevels = () => {
    panel.close();
    onOpenLevels();
  };

  // Built once: a re-render (XP landing while the panel is open) must not swap the
  // animated nodes under a running animation.
  const { scrim, cardOpacity, cardScale, contentOpacity, contentRise } =
    useMemo(
      () => ({
        scrim: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        cardOpacity: progress.interpolate({
          inputRange: [0, 0.4],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        // Not clamped: the opening spring overshoots a touch, and the card with it.
        cardScale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }),
        contentOpacity: progress.interpolate({
          inputRange: [0.5, 0.95],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
        contentRise: progress.interpolate({
          inputRange: [0.5, 1],
          outputRange: [8, 0],
          extrapolate: 'clamp',
        }),
      }),
      [progress]
    );

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      onAccessibilityEscape={panel.close}
    >
      <RNAnimated.View
        style={[StyleSheet.absoluteFill, styles.scrim, { opacity: scrim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={panel.close}
          accessibilityRole="button"
          accessibilityLabel={text.close}
        />
      </RNAnimated.View>

      <View style={styles.pin} pointerEvents="box-none">
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
            <RNAnimated.View
              style={{
                opacity: contentOpacity,
                transform: [{ translateY: contentRise }],
              }}
            >
              {/* The ring on the left is the badge itself, drawn above the card. */}
              <View style={styles.header}>
                <LabText variant="overline" tone="muted" numberOfLines={1}>
                  {copy.level(level)}
                </LabText>
                <LabText variant="title" numberOfLines={1}>
                  {title}
                </LabText>
              </View>

              <View style={styles.body}>
                <ProgressBar
                  progress={now.xpProgress / 100}
                  colors={LEVEL_GOLD}
                  delay={140}
                />
                <View style={styles.underBar}>
                  <LabText variant="numberSm" numberOfLines={1}>
                    {`${formatThousands(settledXp, sep)} XP`}
                  </LabText>
                  <LabText
                    variant="caption"
                    tone="muted"
                    numberOfLines={1}
                    style={styles.toNext}
                  >
                    {toNext}
                  </LabText>
                </View>

                <Divider style={{ marginTop: labSpace.lg }} />
                <View style={styles.row}>
                  <LabText variant="label" tone="muted">
                    {text.today}
                  </LabText>
                  <LabText variant="numberSm" tone="reward">
                    {`${xpToday < 0 ? '−' : '+'}${formatThousands(Math.abs(xpToday), sep)} XP`}
                  </LabText>
                </View>
                <Divider />
                <View style={styles.row}>
                  <LabText
                    variant="label"
                    tone="muted"
                    numberOfLines={1}
                    style={styles.rowLabel}
                  >
                    {text.multiplier(multiplier.factor)}
                  </LabText>
                  <LabText variant="numberSm">
                    {text.timeLeft(left.value, left.unit)}
                  </LabText>
                </View>
                {/* The lab's quiet button (Home → "Write an entry"), not a bare row. */}
                <PressableScale
                  onPress={openLevels}
                  accessibilityRole="link"
                  accessibilityLabel={text.allLevels}
                  style={[styles.link, { backgroundColor: c.primarySoft }]}
                >
                  <LabText variant="bodyStrong" tone="primary">
                    {text.allLevels}
                  </LabText>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={c.primary}
                    style={{ marginLeft: labSpace.sm }}
                  />
                </PressableScale>
              </View>
            </RNAnimated.View>
          </RNAnimated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  pin: {
    position: 'absolute',
    top: CARD_TOP,
    left: 0,
    right: 0,
  },
  column: {
    paddingHorizontal: CARD_LEFT,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    padding: PAD,
    borderRadius: labRadius.lg,
    borderWidth: 1,
    boxShadow: '0px 18px 44px rgba(0, 0, 0, 0.20)',
    transformOrigin: [ORIGIN_X, ORIGIN_Y, 0],
  },
  header: {
    height: RING,
    paddingLeft: RING + labSpace.md,
    justifyContent: 'center',
  },
  body: {
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.xs,
  },
  underBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: labSpace.sm,
  },
  toNext: {
    flexShrink: 1,
    marginLeft: labSpace.md,
    textAlign: 'right',
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    flexShrink: 1,
    marginRight: labSpace.md,
  },
  link: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.sm,
    borderRadius: labRadius.pill,
  },
});
