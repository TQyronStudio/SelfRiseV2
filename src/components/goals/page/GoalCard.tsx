/**
 * A goal card in the new look (migration E14, from the Design Lab's goalParts
 * GoalCard / GoalTrack / PaceChip). Top to bottom:
 *   - the goal's icon and colour (its category, goalLook), name, "Health · by 31 Dec"
 *     and "⋯" (detail / edit / delete — the old card's four buttons, R-4c);
 *   - the value, "/ target unit", the percent (numbers roll only on a change, P44);
 *   - the track: fill, the 25 / 50 / 75 % notches (lit once reached), and a tick
 *     where the plan line is today;
 *   - the pace in words (goalCalculations.paceOf — one rule, P37): on pace / N days
 *     ahead / N days behind (warm, never red) / deadline passed, and the days left;
 *   - one-tap amounts (quickAmounts from the target) and "Other" (the log sheet).
 * Memoised: a log re-renders only its own card (P42); it reads no data context.
 */
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space, withAlpha } from '@/src/design/tokens';
import { goalLook } from '@/src/constants/goalLook';
import { Goal } from '@/src/types/goal';
import { DateString } from '@/src/types/common';
import { fractionOf, goalDate, Pace, paceOf, quickAmounts } from '@/src/utils/goalCalculations';
import { parseDate } from '@/src/utils/date';
import { registerXpOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import { feel } from '@/src/services/feelService';
import {
  AppText,
  Chip,
  IconBadge,
  PressableScale,
  RollingNumber,
  Surface,
} from '@/src/components/ui';
import { formatGoalNumber, GOAL_MILESTONES } from '@/src/screens/goals/goalsPageLogic';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** The card's actions — one stable object from the page (P42). */
export interface GoalCardActions {
  open: (goal: Goal) => void;
  more: (goal: Goal) => void;
  /** One-tap log of a usual amount. */
  quick: (goal: Goal, amount: number) => void;
  /** The log sheet (another amount, subtract, set, a note, an earlier date). */
  other: (goal: Goal) => void;
}

/** "by 31 Dec" / "No deadline". */
export function deadlineText(
  targetDate: string | undefined,
  t: ReturnType<typeof useI18n>['t']
): string {
  const date = goalDate(targetDate);
  if (!date) return t('goals.card.noDeadline');
  return t('goals.card.by', {
    date: parseDate(date).toLocaleDateString(t('common.locale'), {
      day: 'numeric',
      month: 'short',
    }),
  });
}

// ---------------------------------------------------------------------------
// Pace chip — kind words, a shape for each state
// ---------------------------------------------------------------------------

export function PaceChip({ pace }: { pace: Pace }) {
  const { t } = useI18n();
  switch (pace.state) {
    case 'ahead':
      return (
        <Chip tone="success" icon="trending-up" label={t('goals.pace.ahead', { count: pace.days })} />
      );
    case 'behind':
      return (
        <Chip tone="flame" icon="time-outline" label={t('goals.pace.behind', { count: -pace.days })} />
      );
    case 'overdue':
      return <Chip tone="flame" icon="flag-outline" label={t('goals.pace.overdue')} />;
    case 'onPace':
      return <Chip tone="primary" icon="checkmark-circle" label={t('goals.pace.onPace')} />;
    case 'done':
      return <Chip tone="reward" icon="trophy" label={t('goals.completion.statusCompleted')} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Progress track: fill, milestone notches, today's plan tick
// ---------------------------------------------------------------------------

const TRACK_HEIGHT = 12;

export function GoalTrack({
  fraction,
  expected,
  color,
  height = TRACK_HEIGHT,
}: {
  fraction: number;
  /** The plan line today (0..1), null = no tick. */
  expected: number | null;
  color: string;
  height?: number;
}) {
  const { c } = useDesign();
  const filled = Math.min(1, fraction);
  // Native driver: a log fills this while React commits and sparks fly.
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useRef(new RNAnimated.Value(filled)).current;
  const first = useRef(true);
  useEffect(() => {
    if (trackWidth === 0) return;
    if (first.current) {
      // Opening the page: the bar stands where it is (P44).
      first.current = false;
      fill.setValue(filled);
      return;
    }
    RNAnimated.timing(fill, {
      toValue: filled,
      duration: 700,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filled, fill, trackWidth]);
  const translateX = useMemo(
    () => fill.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth, 0] }),
    [fill, trackWidth]
  );

  return (
    <View style={{ height: height + 14, justifyContent: 'center' }}>
      <View
        style={[styles.track, { height, borderRadius: height / 2, backgroundColor: c.track }]}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <RNAnimated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: color, borderRadius: height / 2, transform: [{ translateX }] },
            ]}
          />
        )}
      </View>
      {GOAL_MILESTONES.map(m => (
        <Notch key={m} percent={m} reached={filled * 100 >= m} color={color} />
      ))}
      {expected !== null && (
        <View
          pointerEvents="none"
          style={[
            styles.planTick,
            { left: `${expected * 100}%`, backgroundColor: c.text, height: height + 12 },
          ]}
        />
      )}
    </View>
  );
}

function Notch({ percent, reached, color }: { percent: number; reached: boolean; color: string }) {
  const { c } = useDesign();
  const pop = useRef(new RNAnimated.Value(1)).current;
  const was = useRef(reached);
  useEffect(() => {
    if (reached && !was.current) {
      RNAnimated.sequence([
        RNAnimated.spring(pop, { toValue: 1.8, damping: 6, stiffness: 300, useNativeDriver: true }),
        RNAnimated.spring(pop, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }),
      ]).start();
    }
    was.current = reached;
  }, [reached, pop]);
  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.notch,
        {
          left: `${percent}%`,
          backgroundColor: reached ? c.surface : c.track,
          borderColor: c.surface,
          transform: [{ scale: pop }],
        },
      ]}
    >
      <View style={[styles.notchDot, { backgroundColor: reached ? color : c.textFaint }]} />
    </RNAnimated.View>
  );
}

// ---------------------------------------------------------------------------
// Goal card
// ---------------------------------------------------------------------------

interface GoalCardProps {
  goal: Goal;
  today: DateString;
  /** Just created or edited: glows twice in its colour as it arrives. */
  fresh: boolean;
  actions: GoalCardActions;
}

function GoalCardView({ goal, today, fresh, actions }: GoalCardProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const look = goalLook(goal.category);
  const color = c.habit[look.color];
  const pace = paceOf(goal, today);
  const fraction = fractionOf(goal);
  const percent = Math.round(fraction * 100);
  const done = pace.state === 'done';
  const unit = goal.unit.trim();
  const quick = quickAmounts(goal.targetValue);

  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      380,
      withSequence(
        withTiming(1, { duration: 260 }),
        withTiming(0.2, { duration: 320 }),
        withTiming(1, { duration: 260 }),
        withTiming(0, { duration: 700 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  const meta = `${t(`goals.category.${goal.category}`)} · ${deadlineText(goal.targetDate, t)}`;

  return (
    <PressableScale
      pressScale={0.985}
      feel={null}
      pressDelay={110}
      onPress={() => actions.open(goal)}
      accessibilityLabel={`${goal.title}, ${percent} %`}
      // On iOS an accessible card hides its buttons: they are its actions.
      accessibilityActions={[
        ...(done
          ? []
          : [
              ...quick.map(amount => ({ name: `quick:${amount}`, label: `+${formatGoalNumber(amount, locale)}` })),
              { name: 'other', label: t('goals.card.other') },
            ]),
        { name: 'more', label: t('habits.list.more') },
      ]}
      onAccessibilityAction={e => {
        const name = e.nativeEvent.actionName;
        if (name === 'more') actions.more(goal);
        else if (name === 'other') actions.other(goal);
        else if (name.startsWith('quick:')) actions.quick(goal, Number(name.slice(6)));
      }}
    >
      <Surface style={styles.card}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            { borderColor: color, backgroundColor: withAlpha(color, 0.12) },
            arriveStyle,
          ]}
        />
        <View style={styles.head}>
          <IconBadge icon={look.icon} color={color} size={42} />
          <View style={styles.headText}>
            <AppText variant="bodyStrong" numberOfLines={2}>
              {goal.title}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {meta}
            </AppText>
          </View>
          <PressableScale
            onPress={() => actions.more(goal)}
            feel={null}
            pressScale={0.85}
            accessibilityLabel={t('habits.list.more')}
            style={styles.more}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
          </PressableScale>
        </View>

        <View style={styles.valueRow}>
          <RollingNumber
            text={formatGoalNumber(goal.currentValue, locale)}
            variant="numberMd"
            rollIn={false}
          />
          <AppText variant="label" tone="muted" numberOfLines={1} style={styles.target}>
            {`/ ${formatGoalNumber(goal.targetValue, locale)}${unit ? ` ${unit}` : ''}`}
          </AppText>
          <View style={styles.flex} />
          <RollingNumber
            text={`${percent} %`}
            variant="label"
            tone="muted"
            rollIn={false}
            style={styles.percent}
          />
        </View>

        <GoalTrack fraction={fraction} expected={pace.expected} color={color} />

        <View style={styles.paceRow}>
          <PaceChip pace={pace} />
          {pace.daysLeft !== null && (
            <AppText variant="caption" tone="muted" style={styles.daysLeft}>
              {t('goals.pace.daysLeft', { count: pace.daysLeft })}
            </AppText>
          )}
        </View>

        {!done && (
          <View style={styles.quickRow}>
            {quick.map(amount => (
              <QuickButton
                key={amount}
                label={`+${formatGoalNumber(amount, locale)}`}
                color={color}
                goalId={goal.id}
                onPress={() => actions.quick(goal, amount)}
              />
            ))}
            <QuickButton
              label={t('goals.card.other')}
              icon="keypad-outline"
              color={c.textMuted}
              quiet
              onPress={() => actions.other(goal)}
            />
          </View>
        )}
      </Surface>
    </PressableScale>
  );
}

export const GoalCard = memo(GoalCardView);

function QuickButton({
  label,
  icon,
  color,
  quiet = false,
  goalId,
  onPress,
}: {
  label: string;
  icon?: IoniconName;
  color: string;
  quiet?: boolean;
  /** Set on an amount button: its sparks start here (xpOriginRegistry). */
  goalId?: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  const ref = useRef<View>(null);
  const press = () => {
    feel('tap');
    if (goalId && ref.current) {
      ref.current.measureInWindow((x, y, w, h) =>
        registerXpOrigin({ source: 'goal_progress', sourceId: goalId }, { x: x + w / 2, y: y + h / 2 })
      );
    }
    onPress();
  };
  return (
    <View ref={ref} collapsable={false}>
      <PressableScale
        feel={null}
        pressScale={0.92}
        accessibilityLabel={label}
        onPress={press}
        style={[
          styles.quick,
          {
            backgroundColor: quiet ? c.track : withAlpha(color, 0.12),
            borderColor: quiet ? c.track : withAlpha(color, 0.33),
          },
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={15} color={quiet ? c.textMuted : c.text} style={styles.quickIcon} />
        )}
        <AppText variant="label" numberOfLines={1} style={styles.quickLabel}>
          {label}
        </AppText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    padding: space.lg,
    borderRadius: radius.lg,
  },
  cardGlow: {
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headText: {
    flex: 1,
    marginLeft: space.md,
  },
  more: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.md,
  },
  target: {
    marginLeft: 6,
    marginBottom: 5,
    flexShrink: 1,
  },
  percent: {
    fontFamily: fonts.semibold,
  },
  track: {
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  planTick: {
    position: 'absolute',
    width: 2,
    marginLeft: -1,
    borderRadius: radius.xs,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.sm,
  },
  daysLeft: {
    marginLeft: space.sm,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  quickIcon: {
    marginRight: 6,
  },
  quickLabel: {
    fontFamily: fonts.semibold,
  },
});
