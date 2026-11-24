/**
 * One habit on the Habits screen (migration E5, from the Design Lab's HabitCard):
 * icon in the habit's colour, name, schedule, a mini week of seven dots, "⋯"
 * (the per-row actions in one sheet, R-4c) and the check.
 *
 * - A day's status is SHAPE (R-11): ● done / the day that rescued one · ○ the
 *   rescued day · ★ bonus · × missed · ━ paused · thin ring = planned/open.
 *   Make-up pairs are brackets UNDER the dots, overlapping pairs on their own
 *   lane (P22); a letter names each day (P23). Rules: habitListLogic.ts.
 * - The card gets ITS OWN state as props and is memoized: checking one habit
 *   re-renders only that card (P42, P47).
 * - Onboarding: the check pulses until it is ticked (the same condition as the
 *   old list — screen 3, the named habit).
 * - The XP of a check is still shown the old way (the XP bar) until E7; the
 *   check already measures its own position for the sparks of E7.
 */
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated as RNAnimated, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fonts, Palette, radius, space, withAlpha } from '@/src/design/tokens';
import {
  AppText,
  CheckButton,
  IconBadge,
  PressableScale,
  Surface,
} from '@/src/components/ui';
import { getHabitIonicon } from '@/src/constants/habitIcons';
import {
  DayStatus,
  DotShape,
  DotTone,
  dotLook,
  makeupLinks,
  sameCardProps,
} from '@/src/screens/habits/habitListLogic';

export interface HabitCardProps {
  id: string;
  name: string;
  icon: string;
  /** The habit's own colour (already resolved from the palette). */
  color: string;
  /** "Every day" or "Mon · Wed · Fri". */
  schedule: string;
  kind: 'planned' | 'bonus';
  done: boolean;
  /** Monday … Sunday of this week, and each day's status. */
  days: string[];
  week: DayStatus[];
  today: string;
  /** One-letter day names, Monday first. */
  letters: string[];
  /** Today's check rescued a missed day: "Make-up · covers Tue". */
  makeupText: string | null;
  bonusLabel: string;
  moreLabel: string;
  checkLabel: string;
  /** Screen reader action names: tick / untick, and the sheet. */
  checkActionLabel: string;
  /** Onboarding: the check pulses until it is ticked. */
  highlight: boolean;
  /** Just created: glows twice in its own colour as it arrives. */
  fresh: boolean;
  onToggle: (id: string, kind: 'planned' | 'bonus') => void;
  onOpen: (id: string) => void;
  onMore: (id: string) => void;
}

function HabitCardView(props: HabitCardProps) {
  const {
    id,
    name,
    icon,
    color,
    schedule,
    kind,
    done,
    days,
    week,
    today,
    letters,
    makeupText,
    bonusLabel,
    moreLabel,
    checkLabel,
    checkActionLabel,
    highlight,
    fresh,
    onToggle,
    onOpen,
    onMore,
  } = props;
  const { c } = useDesign();

  const glow = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    glow.value = withTiming(done ? 1 : 0, { duration: 250 });
  }, [done, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      420,
      withSequence(
        withTiming(1, { duration: 260 }),
        withTiming(0.2, { duration: 320 }),
        withTiming(1, { duration: 260 }),
        withTiming(0, { duration: 600 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  return (
    <PressableScale
      pressScale={0.985}
      feel={null}
      onPress={() => onOpen(id)}
      // On iOS the card's own label hides the check and "⋯" inside it, so they
      // are offered as actions of the card (VoiceOver: swipe up / down).
      accessibilityLabel={`${name}, ${makeupText ?? schedule}`}
      accessibilityState={{ checked: done }}
      accessibilityActions={[
        { name: 'check', label: checkActionLabel },
        { name: 'more', label: moreLabel },
      ]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'check') onToggle(id, kind);
        else if (e.nativeEvent.actionName === 'more') onMore(id);
      }}
    >
      <Surface style={styles.card}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            // The habit's own colour, softly — identity, not a status colour.
            { backgroundColor: withAlpha(color, 0.1) },
            glowStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            {
              borderWidth: 2,
              borderColor: color,
              backgroundColor: withAlpha(color, 0.15),
            },
            arriveStyle,
          ]}
        />
        <View style={styles.cardRow}>
          <IconBadge icon={getHabitIonicon(icon)} color={color} size={44} />
          <View style={styles.middle}>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {name}
            </AppText>
            <View style={styles.metaRow}>
              {makeupText ? (
                <>
                  <Ionicons name="refresh" size={12} color={color} />
                  <AppText
                    variant="caption"
                    tone="text"
                    style={styles.metaText}
                  >
                    {makeupText}
                  </AppText>
                </>
              ) : (
                <>
                  <AppText variant="caption" tone="muted">
                    {schedule}
                  </AppText>
                  {kind === 'bonus' && (
                    <View
                      style={[
                        styles.bonusTag,
                        { backgroundColor: c.rewardSoft },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        tone="reward"
                        style={{ fontFamily: fonts.semibold }}
                      >
                        {bonusLabel}
                      </AppText>
                    </View>
                  )}
                </>
              )}
            </View>
            <WeekDots
              days={days}
              week={week}
              today={today}
              letters={letters}
              color={color}
            />
          </View>
          <PressableScale
            onPress={() => onMore(id)}
            pressScale={0.85}
            accessibilityLabel={moreLabel}
            style={styles.more}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={c.textMuted}
            />
          </PressableScale>
          <View collapsable={false}>
            {highlight && !done && <CheckHalo color={c.primary} />}
            <CheckButton
              done={done}
              tone={kind === 'bonus' && !makeupText ? 'reward' : 'success'}
              label={checkLabel}
              onToggle={() => onToggle(id, kind)}
            />
          </View>
        </View>
      </Surface>
    </PressableScale>
  );
}

/** Re-renders only when this habit's own data changed (P42, P47). */
export const HabitCard = memo(HabitCardView, sameCardProps);

// ---------------------------------------------------------------------------
// The mini week
// ---------------------------------------------------------------------------

const DOT_COL = 14;
const DOT_GAP = 4;
/** Mark box (12) + gap (2) + letter line (12). Brackets hang below this. */
const DOTS_HEIGHT = 26;
const LINK_LANE = 6;

function toneColor(tone: DotTone, habitColor: string, c: Palette): string {
  switch (tone) {
    case 'habit':
      return habitColor;
    case 'missed':
      return c.missed;
    case 'faint':
      return c.textFaint;
    case 'muted':
      return c.textMuted;
    default:
      return c.track;
  }
}

function WeekDots({
  days,
  week,
  today,
  letters,
  color,
}: {
  days: string[];
  week: DayStatus[];
  today: string;
  letters: string[];
  color: string;
}) {
  const { c } = useDesign();
  const statuses = useMemo(
    () =>
      new Map(
        days.map((day, i) => [day, week[i] ?? { kind: 'none' as const }])
      ),
    [days, week]
  );
  const links = useMemo(() => makeupLinks(statuses, days), [statuses, days]);
  const lanes = links.reduce((n, l) => Math.max(n, l.lane + 1), 0);
  const centerX = (i: number) => i * (DOT_COL + DOT_GAP) + DOT_COL / 2;

  return (
    <View style={[styles.dots, { paddingBottom: lanes * LINK_LANE }]}>
      {links.map(l => (
        <View
          key={`${l.from}-${l.to}`}
          style={[
            styles.dotLink,
            {
              left: centerX(l.from) - 0.75,
              width: centerX(l.to) - centerX(l.from) + 1.5,
              top: DOTS_HEIGHT + 1 + l.lane * LINK_LANE,
              borderColor: color,
            },
          ]}
        />
      ))}
      {days.map((day, i) => {
        const kind = week[i]?.kind ?? 'none';
        const look = dotLook(kind);
        const isToday = day === today;
        return (
          <View key={day} style={styles.dotCol}>
            <DotMark
              shape={look.shape}
              color={toneColor(look.tone, color, c)}
            />
            {isToday && kind === 'bonus' && (
              <BonusRipple key={`ripple-${day}`} />
            )}
            <AppText
              variant="micro"
              tone={isToday ? 'primary' : 'faint'}
              style={[styles.dotLetter, isToday && { fontFamily: fonts.bold }]}
            >
              {letters[i] ?? ''}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function DotMark({ shape, color }: { shape: DotShape; color: string }) {
  if (shape === 'star') {
    return (
      <View style={styles.dotBox}>
        <Ionicons name="star" size={11} color={color} />
      </View>
    );
  }
  if (shape === 'cross') {
    return (
      <View style={styles.dotBox}>
        <Ionicons name="close" size={12} color={color} />
      </View>
    );
  }
  return (
    <View style={styles.dotBox}>
      <View
        style={
          shape === 'bar'
            ? [styles.bar, { backgroundColor: color }]
            : shape === 'ring'
              ? [styles.dot, { borderColor: color, borderWidth: 1.5 }]
              : shape === 'tiny'
                ? [
                    styles.dot,
                    { backgroundColor: color, transform: [{ scale: 0.5 }] },
                  ]
                : [styles.dot, { backgroundColor: color }]
        }
      />
    </View>
  );
}

/** A bonus just made today ripples once in gold — once, then rests (not a loop). */
function BonusRipple() {
  const { c } = useDesign();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ scale: 1 + 1.4 * p.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ripple, { borderColor: c.reward }, style]}
    />
  );
}

/**
 * Onboarding's pointer: the real check pulses (no overlay working out where it is).
 * Reduce motion: a still ring. The highlight may stop moving, it may not disappear.
 */
function CheckHalo({ color }: { color: string }) {
  const reducedMotion = useReducedMotion();
  const p = useRef(new RNAnimated.Value(0.4)).current;
  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(p, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        RNAnimated.timing(p, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [p, reducedMotion]);
  const scale = useMemo(
    () => p.interpolate({ inputRange: [0.4, 1], outputRange: [0.92, 1.12] }),
    [p]
  );
  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.halo,
        { borderColor: color, opacity: p, transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.md,
    paddingLeft: space.lg,
    borderRadius: radius.md + 4,
  },
  cardGlow: {
    borderRadius: radius.md + 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: space.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  metaText: {
    marginLeft: 4,
  },
  bonusTag: {
    marginLeft: space.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  dots: {
    flexDirection: 'row',
    gap: DOT_GAP,
    marginTop: space.sm,
  },
  dotCol: {
    width: DOT_COL,
    alignItems: 'center',
  },
  dotBox: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
  },
  bar: {
    width: 10,
    height: 3,
    borderRadius: radius.pill,
  },
  ripple: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  dotLetter: {
    marginTop: 2,
  },
  // └──┘ : ticks only at the two days of the pair.
  dotLink: {
    position: 'absolute',
    height: 5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  more: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: radius.pill,
    borderWidth: 3,
  },
});
