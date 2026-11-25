/**
 * Habit detail in the new look (migration E6 point 1, from the Design Lab's
 * HabitDetailConcept, kolo 13–19). Grows out of the habit card (DetailFrame) and
 * shows the habit's month with every kind of day the app knows:
 * done ✓, make-up ↺, bonus ★ (gold rim), missed × (red on a neutral tile, no
 * ring), rescued (a ring in the habit's colour), paused ⏸, planned, today.
 *
 * - The make-up pairing is the APP's (Smart Bonus Conversion via
 *   getHabitCompletionsWithConversion) read by dayStatuses() — R-11. A dashed
 *   arch joins each make-up day to the day it rescued; overlapping pairs take the
 *   other side of the row, so arches never cross.
 * - Tapping a day says in words what happened.
 * - Streaks are counted in PLANNED days (planStreaks), the rate over the last 30
 *   days (keptRate) — both in habitListLogic.ts, tested.
 * - The make-up rule is a quiet "i" at the legend (help.rules.makeUp).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import {
  fonts,
  onHabitColor,
  Palette,
  radius,
  space,
} from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { getHabitIonicon } from '@/src/constants/habitIcons';
import { Habit } from '@/src/types/habit';
import { DateString } from '@/src/types/common';
import {
  getDateRange,
  parseDate,
  subtractDays,
  today as todayString,
} from '@/src/utils/date';
import {
  AppText,
  DetailFrame,
  DetailRect,
  DetailScroll,
  HelpHost,
  HelpLink,
  IconBadge,
  PageTopBar,
  PressableScale,
  RollingNumber,
  Surface,
  typeStyle,
} from '@/src/components/ui';
import {
  DayKind,
  DayStatus,
  dayStatuses,
  keptRate,
  monthLayout,
  planStreaks,
  scheduleLabel,
  weekOf,
} from '@/src/screens/habits/habitListLogic';

const GRID_PAD = space.lg;
const CELL_GAP = 6;
const MAX_WIDTH = 640;

interface HabitDetailProps {
  habit: Habit;
  origin: DetailRect;
  size: { width: number; height: number };
  bottomInset: number;
  onClosed: () => void;
}

export function HabitDetail({
  habit,
  origin,
  size,
  bottomInset,
  onClosed,
}: HabitDetailProps) {
  const { t } = useI18n();
  const { c } = useDesign();
  // The detail covers the whole page, the status bar too: its content starts below it.
  const insets = useSafeAreaInsets();
  return (
    <DetailFrame
      origin={origin}
      size={size}
      originRadius={20}
      onClosed={onClosed}
    >
      {(close, p) => (
        // Help sheets open at the detail's level, not inside the legend row.
        <HelpHost bottomInset={bottomInset}>
          <DetailScroll
            p={p}
            close={close}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + space.sm,
                paddingBottom: bottomInset + space.xxl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <PageTopBar onClose={close} label={t('common.close')} raised />
            <HabitDetailBody
              habit={habit}
              width={size.width}
              bottomInset={bottomInset}
            />
          </DetailScroll>
          {/* The content scrolls under the status bar: a strip keeps the clock readable. */}
          <View
            pointerEvents="none"
            style={[
              styles.statusStrip,
              { height: insets.top, backgroundColor: c.surface },
            ]}
          />
        </HelpHost>
      )}
    </DetailFrame>
  );
}

function HabitDetailBody({
  habit,
  width,
  bottomInset,
}: {
  habit: Habit;
  width: number;
  bottomInset: number;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { getHabitCompletionsWithConversion, completions } = useHabitsData();
  const locale = t('common.locale');
  const today = todayString();
  const habitColor = c.habit[habit.color];
  // The app's pairing; recomputed when the checks change.
  const converted = useMemo(
    () => getHabitCompletionsWithConversion(habit.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habit, completions, getHabitCompletionsWithConversion]
  );

  // --- Streaks and rate (planned days) -------------------------------------------
  const created = useMemo(() => {
    const at =
      habit.createdAt instanceof Date
        ? habit.createdAt
        : new Date(habit.createdAt);
    const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
    return key > today ? today : key;
  }, [habit.createdAt, today]);
  const { streak, rate } = useMemo(() => {
    const all = getDateRange(created, today);
    const statuses = dayStatuses(habit, converted, all, today);
    const last30 = getDateRange(subtractDays(today, 29), today);
    return {
      streak: planStreaks(all, statuses),
      rate: keptRate(last30, dayStatuses(habit, converted, last30, today)),
    };
  }, [habit, converted, created, today]);

  // --- Month ------------------------------------------------------------------
  const [monthOffset, setMonthOffset] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const todayDate = parseDate(today);
  const monthStart = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth() + monthOffset,
    1
  );
  const createdDate = parseDate(created);
  const canGoBack =
    monthStart.getFullYear() * 12 + monthStart.getMonth() >
    createdDate.getFullYear() * 12 + createdDate.getMonth();
  const canGoForward = monthOffset < 0;
  const { days: monthDays, lead } = useMemo(
    () => monthLayout(monthStart.getFullYear(), monthStart.getMonth()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [monthOffset, today]
  );
  const statuses = useMemo(
    () => dayStatuses(habit, converted, monthDays, today),
    [habit, converted, monthDays, today]
  );

  const [selected, setSelected] = useState<DateString | null>(null);
  const formatDay = (key: DateString) =>
    parseDate(key).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
    });
  const describe = (key: DateString) => {
    const s = statuses.get(key);
    if (!s) return '';
    const day = formatDay(key);
    const pair = s.pairKey ? formatDay(s.pairKey) : '';
    const what =
      s.kind === 'missed'
        ? t('habits.calendar.legendMissed')
        : s.kind === 'makeup' || s.kind === 'covered'
          ? t(`habits.dayStatus.${s.kind}`, { day: pair })
          : t(`habits.dayStatus.${s.kind}`);
    return `${day} · ${what}`;
  };

  const weekDays = weekOf(today);
  const scheduleText = scheduleLabel(
    habit,
    today,
    locale,
    t('habits.schedule.everyDay')
  );
  const weekLetters = weekDays.map(day =>
    parseDate(day).toLocaleDateString(locale, { weekday: 'narrow' })
  );

  const gridWidth = Math.min(width, MAX_WIDTH) - space.xl * 2 - GRID_PAD * 2;
  const changeMonth = (step: 1 | -1) => {
    setDirection(step);
    setSelected(null);
    setMonthOffset(o => o + step);
  };

  return (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <IconBadge
          icon={getHabitIonicon(habit.icon)}
          color={habitColor}
          size={52}
        />
        <View style={styles.headerText}>
          <AppText variant="title" numberOfLines={2}>
            {habit.name}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.schedule}>
            {scheduleText}
          </AppText>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile
          icon="flame"
          tint={c.flame}
          label={t('habits.detail.currentStreak')}
          value={`${streak.current}`}
        />
        <StatTile
          icon="trophy"
          tint={c.rewardText}
          label={t('habits.detail.bestStreak')}
          value={`${streak.best}`}
        />
        <StatTile
          icon="pie-chart"
          tint={c.primary}
          label={t('habits.detail.rate')}
          value={rate === null ? '–' : `${rate} %`}
        />
      </View>

      {/* Calendar */}
      <Surface style={styles.calendar}>
        <View style={styles.monthRow}>
          <MonthButton
            icon="chevron-back"
            enabled={canGoBack}
            label={t('habits.detail.previousMonth')}
            onPress={() => changeMonth(-1)}
          />
          <AppText variant="titleSm" style={styles.monthTitle}>
            {monthStart.toLocaleDateString(locale, {
              month: 'long',
              year: 'numeric',
            })}
          </AppText>
          <MonthButton
            icon="chevron-forward"
            enabled={canGoForward}
            label={t('habits.detail.nextMonth')}
            onPress={() => changeMonth(1)}
          />
        </View>

        <View style={styles.weekHeader}>
          {weekLetters.map((d, i) => (
            <Text
              key={i}
              maxFontSizeMultiplier={1.3}
              style={[
                typeStyle('caption', c.textMuted),
                styles.weekHeaderCell,
                { width: gridWidth / 7 },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>

        <Animated.View
          key={monthOffset}
          entering={(direction === 1 ? FadeInRight : FadeInLeft).duration(260)}
        >
          <MonthGrid
            days={monthDays}
            lead={lead}
            statuses={statuses}
            today={today}
            width={gridWidth}
            habitColor={habitColor}
            selected={selected}
            formatDay={formatDay}
            onSelect={key => {
              feel('tap');
              setSelected(prev => (prev === key ? null : key));
            }}
          />
        </Animated.View>

        {/* What happened on the tapped day */}
        <View
          style={[styles.info, { backgroundColor: c.surfaceRaised }]}
          accessibilityLiveRegion="polite"
        >
          <Animated.View
            key={selected ?? 'hint'}
            entering={FadeIn.duration(180)}
          >
            <AppText
              variant="label"
              tone={selected ? 'text' : 'faint'}
              style={styles.center}
            >
              {selected ? describe(selected) : t('habits.detail.tapHint')}
            </AppText>
          </Animated.View>
        </View>
      </Surface>

      {/* Legend — the app's own words, and the make-up rule behind the "i" */}
      <View style={styles.legend}>
        <LegendItem
          kind="done"
          label={t('habits.calendar.legendCompleted')}
          habitColor={habitColor}
        />
        <LegendItem
          kind="makeup"
          label={t('habits.calendar.legendMakeup')}
          habitColor={habitColor}
        />
        <LegendItem
          kind="bonus"
          label={t('habits.calendar.bonus')}
          habitColor={habitColor}
        />
        <LegendItem
          kind="missed"
          label={t('habits.calendar.legendMissed')}
          habitColor={habitColor}
        />
        <LegendItem
          kind="paused"
          label={t('habits.calendar.legendPaused')}
          habitColor={habitColor}
        />
        <LegendItem
          kind="planned"
          label={t('habits.calendar.legendScheduled')}
          habitColor={habitColor}
        />
        <HelpLink topic="makeUp" bottomInset={bottomInset} />
      </View>
    </View>
  );
}

function StatTile({
  icon,
  tint,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <Surface style={styles.statTile}>
      <View accessible accessibilityLabel={`${label}: ${value}`}>
        <Ionicons name={icon} size={18} color={tint} />
        <View style={styles.statValue}>
          <RollingNumber text={value} variant="number" delay={250} />
        </View>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {label}
        </AppText>
      </View>
    </Surface>
  );
}

function MonthButton({
  icon,
  enabled,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  enabled: boolean;
  label: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  return (
    <PressableScale
      onPress={() => {
        if (enabled) onPress();
      }}
      feel={enabled ? 'tap' : null}
      pressScale={0.9}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled } as never}
      style={[
        styles.monthButton,
        { backgroundColor: c.surfaceRaised, opacity: enabled ? 1 : 0.35 },
      ]}
    >
      <Ionicons name={icon} size={18} color={c.text} />
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// The month grid + the make-up arches
// ---------------------------------------------------------------------------

function MonthGrid({
  days,
  lead,
  statuses,
  today,
  width,
  habitColor,
  selected,
  formatDay,
  onSelect,
}: {
  days: DateString[];
  lead: number;
  statuses: Map<DateString, DayStatus>;
  today: DateString;
  width: number;
  habitColor: string;
  selected: DateString | null;
  formatDay: (key: DateString) => string;
  onSelect: (key: DateString) => void;
}) {
  const { t } = useI18n();
  const colW = width / 7;
  const cell = Math.min(40, colW - CELL_GAP);
  // Room between rows for the make-up arches (above and below a row).
  const rowH = cell + 20;
  const rows = Math.ceil((lead + days.length) / 7);

  const arches = useMemo(() => {
    const centerOf = (key: DateString) => {
      const index = days.indexOf(key);
      if (index < 0) return null;
      const at = lead + index;
      return {
        x: (at % 7) * colW + colW / 2,
        y: Math.floor(at / 7) * rowH + rowH / 2,
      };
    };
    const pairs: {
      a: { x: number; y: number };
      b: { x: number; y: number };
    }[] = [];
    statuses.forEach((s, key) => {
      if (s.kind !== 'makeup' || !s.pairKey) return;
      const a = centerOf(key);
      const b = centerOf(s.pairKey);
      if (a && b) pairs.push({ a, b });
    });
    pairs.sort(
      (p1, p2) =>
        p1.a.y - p2.a.y || Math.min(p1.a.x, p1.b.x) - Math.min(p2.a.x, p2.b.x)
    );
    // Pairs that overlap in one week take different lanes — the first above the
    // days, the next below — so they never cross (kolo 16).
    const laneEnds = new Map<number, number[]>();
    return pairs.map(({ a, b }) => {
      const from = Math.min(a.x, b.x);
      const to = Math.max(a.x, b.x);
      const ends = laneEnds.get(a.y) ?? [];
      let lane = ends.findIndex(e => e < from - 1);
      if (lane === -1) {
        lane = ends.length;
        ends.push(to);
      } else {
        ends[lane] = to;
      }
      laneEnds.set(a.y, ends);
      const dir = lane % 2 === 1 ? 1 : -1;
      const edge = (dir * cell) / 2;
      const bow = 2 * (4 + Math.floor(lane / 2) * 3 + (to - from) * 0.02);
      const path = Skia.Path.Make();
      path.moveTo(a.x, a.y + edge);
      path.quadTo((a.x + b.x) / 2, a.y + edge + dir * bow, b.x, b.y + edge);
      return { path, end: { x: b.x, y: b.y + edge } };
    });
  }, [statuses, days, lead, colW, rowH, cell]);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withDelay(
      320,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [draw, statuses]);

  return (
    <View style={{ width, height: rows * rowH, marginTop: space.sm }}>
      {days.map((key, i) => {
        const at = lead + i;
        const status = statuses.get(key) ?? { kind: 'none' as DayKind };
        const pair = status.pairKey ? formatDay(status.pairKey) : '';
        return (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: (at % 7) * colW + (colW - cell) / 2,
              top: Math.floor(at / 7) * rowH + (rowH - cell) / 2,
            }}
          >
            <DayCell
              day={i + 1}
              kind={status.kind}
              isToday={key === today}
              selected={selected === key}
              size={cell}
              habitColor={habitColor}
              accessibilityLabel={`${formatDay(key)}, ${
                status.kind === 'missed'
                  ? t('habits.calendar.legendMissed')
                  : status.kind === 'makeup' || status.kind === 'covered'
                    ? t(`habits.dayStatus.${status.kind}`, { day: pair })
                    : t(`habits.dayStatus.${status.kind}`)
              }`}
              onPress={() => onSelect(key)}
            />
          </View>
        );
      })}
      <Canvas
        style={[StyleSheet.absoluteFill, styles.visible]}
        pointerEvents="none"
      >
        {arches.map((a, i) => (
          <React.Fragment key={i}>
            <Path
              path={a.path}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              color={habitColor}
              start={0}
              end={draw}
            >
              <DashPathEffect intervals={[4, 4]} />
            </Path>
            <Circle
              cx={a.end.x}
              cy={a.end.y}
              r={2.5}
              color={habitColor}
              opacity={draw}
            />
          </React.Fragment>
        ))}
      </Canvas>
    </View>
  );
}

/**
 * Day look (kolo 15–19): done and make-up in the habit's own colour; the rescued
 * day a hollow ring in it; missed a red × on a neutral tile WITHOUT a ring (a red
 * habit's rescued day is a ring); bonus the habit's colour with a gold rim and ★.
 * Every status carries a symbol, never colour alone.
 */
export function cellLook(kind: DayKind, c: Palette, habitColor: string) {
  switch (kind) {
    case 'done':
      return {
        bg: habitColor,
        fg: onHabitColor(habitColor),
        border: 'transparent',
        icon: 'checkmark' as const,
      };
    case 'makeup':
      return {
        bg: habitColor,
        fg: onHabitColor(habitColor),
        border: 'transparent',
        icon: 'refresh' as const,
      };
    case 'bonus':
      return {
        bg: habitColor,
        fg: onHabitColor(habitColor),
        border: c.reward,
        icon: 'star' as const,
      };
    case 'covered':
      return {
        bg: 'transparent',
        fg: habitColor,
        border: habitColor,
        icon: null,
      };
    case 'missed':
      return {
        bg: c.track,
        fg: c.missed,
        border: 'transparent',
        icon: 'close' as const,
      };
    case 'paused':
      return {
        bg: c.track,
        fg: c.textMuted,
        border: 'transparent',
        icon: 'pause' as const,
      };
    case 'planned':
      return {
        bg: 'transparent',
        fg: c.textMuted,
        border: c.track,
        icon: null,
      };
    case 'todayOpen':
      return { bg: 'transparent', fg: c.text, border: c.textMuted, icon: null };
    default:
      return {
        bg: 'transparent',
        fg: c.textFaint,
        border: 'transparent',
        icon: null,
      };
  }
}

function DayCell({
  day,
  kind,
  isToday,
  selected,
  size,
  habitColor,
  accessibilityLabel,
  onPress,
}: {
  day: number;
  kind: DayKind;
  isToday: boolean;
  selected: boolean;
  size: number;
  habitColor: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  const look = cellLook(kind, c, habitColor);
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 300 });
  }, [selected, s]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.12 * s.value }],
  }));
  return (
    <PressableScale
      feel={null}
      pressScale={0.88}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: look.bg,
            borderColor: selected ? c.text : look.border,
            borderWidth: selected
              ? 1.5
              : look.border !== 'transparent'
                ? 2.5
                : 0,
          },
          style,
        ]}
      >
        {look.icon ? (
          <Ionicons name={look.icon} size={size * 0.42} color={look.fg} />
        ) : (
          <Text
            maxFontSizeMultiplier={1.2}
            style={[
              typeStyle('caption', look.fg),
              { fontFamily: isToday ? fonts.bold : fonts.semibold },
            ]}
          >
            {day}
          </Text>
        )}
        {isToday && kind !== 'todayOpen' && (
          <View style={[styles.todayDot, { backgroundColor: c.primary }]} />
        )}
      </Animated.View>
    </PressableScale>
  );
}

function LegendItem({
  kind,
  label,
  habitColor,
}: {
  kind: DayKind;
  label: string;
  habitColor: string;
}) {
  const { c } = useDesign();
  const look = cellLook(kind, c, habitColor);
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          {
            backgroundColor: look.bg,
            borderColor: look.border,
            borderWidth: look.border !== 'transparent' ? 1.5 : 0,
          },
        ]}
      >
        {look.icon && <Ionicons name={look.icon} size={9} color={look.fg} />}
      </View>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.xl,
    paddingTop: space.sm,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: space.md },
  schedule: { marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  statTile: { flex: 1, padding: space.lg, borderRadius: radius.md + 4 },
  statValue: { marginTop: space.sm },
  calendar: { marginTop: space.lg, padding: GRID_PAD },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { flex: 1, textAlign: 'center' },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: { flexDirection: 'row', marginTop: space.lg },
  weekHeaderCell: { textAlign: 'center' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: radius.pill,
  },
  info: {
    marginTop: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    paddingHorizontal: space.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visible: { overflow: 'visible' },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0 },
});
