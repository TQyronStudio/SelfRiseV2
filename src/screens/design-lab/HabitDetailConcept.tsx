/**
 * Habit detail — the calendar that explains itself (Design Lab, kolo 13).
 *
 * Grows out of the habit card (same continuity as the journal card), shows the
 * habit's month with every kind of day the app knows (technical-guides:Habits.md):
 * done, MAKE-UP (green ↺), real BONUS (gold ★), MISSED, COVERED (a missed day that
 * a make-up rescued), PAUSED (⏸ — never counted as missed), planned, today.
 *
 * The make-up system is shown as a RELATION, not just a colour: a thin green arch
 * links each make-up day to the missed day it covers, drawn in when the month
 * appears. Tapping a day says in words what happened ("Wed 22 · Missed — made up
 * on Thu 23"). The legend uses the app's real calendar texts.
 *
 * GOING LIVE (1:1) — decision R-11, then update technical-guides:Habits.md
 * "UI Display Rules" in the same commit:
 * - Missed = red × on a neutral tile WITHOUT a ring (a red habit's rescued day is a
 *   ring); bonus = habit colour + ★; symbols via onHabitColor() (lesson 20c).
 * - Overlapping make-up pairs: arches above / below the row, never crossing.
 * - The app's help text "golden checkmark = make-up" is wrong — fix it (lesson 28).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  DashPathEffect,
  Path,
  Skia,
  Circle,
} from '@shopify/react-native-skia';
import i18n from '@/src/config/i18n';
import { selection } from '@/src/services/hapticsService';
import {
  IconBadge,
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import {
  labFonts,
  LabPalette,
  labRadius,
  labSpace,
  onHabitColor,
} from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { RollingNumber } from './RollingNumber';
import {
  addDays,
  dateKey,
  DayKind,
  DayStatus,
  LabHabit,
  mondayOf,
  startOfDay,
  statusesFor,
  useLabToday,
} from './habitsMock';
import { DetailRect } from './JournalDetailConcept';

const OPEN_SPRING = {
  damping: 24,
  stiffness: 210,
  mass: 1,
  overshootClamping: true,
};
const CLOSE_MS = 320;
const GRID_PAD = labSpace.lg;

interface HabitDetailProps {
  habit: LabHabit;
  origin: DetailRect;
  size: { width: number; height: number };
  bottomInset: number;
  onClosed: () => void;
}

export function HabitDetailConcept({
  habit,
  origin,
  size,
  bottomInset,
  onClosed,
}: HabitDetailProps) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const h = copy.habits;
  const t = useMemo(() => i18n.getFixedT(lang), [lang]);
  const { done } = useLabToday();
  const today = useMemo(() => startOfDay(new Date()), []);
  const habitColor = c.habit[habit.color];

  // --- Frame: grows from the card, shrinks back ---------------------------------
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, OPEN_SPRING);
  }, [p]);
  const close = () => {
    selection();
    p.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) scheduleOnRN(onClosed);
      }
    );
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // `close` touches only the shared value and the stable onClosed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const frameStyle = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [origin.x, 0]),
    top: interpolate(p.value, [0, 1], [origin.y, 0]),
    width: interpolate(p.value, [0, 1], [origin.width, size.width]),
    height: interpolate(p.value, [0, 1], [origin.height, size.height]),
    borderRadius: interpolate(p.value, [0, 1], [20, 0]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.3, 0.85], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(p.value, [0.3, 1], [10, 0], 'clamp') },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.28 * p.value }));

  // --- Month ------------------------------------------------------------------
  const [monthOffset, setMonthOffset] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const firstAllowed = addDays(today, -habit.createdDaysAgo);
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    1
  );
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  );
  const canGoBack =
    new Date(monthStart.getFullYear(), monthStart.getMonth(), 0) >=
    startOfDay(
      new Date(firstAllowed.getFullYear(), firstAllowed.getMonth(), 1)
    );
  const canGoForward = monthOffset < 0;

  const statuses = useMemo(
    () => statusesFor(habit, monthStart, monthEnd, today, !!done[habit.id]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habit, monthOffset, today, done[habit.id]]
  );

  // Last 30 days for the completion rate (covered = completed via make-up).
  const rate = useMemo(() => {
    const st = statusesFor(
      habit,
      addDays(today, -29),
      today,
      today,
      !!done[habit.id]
    );
    let ok = 0;
    let all = 0;
    for (let i = 0; i < 30; i++) {
      const s = st.get(dateKey(addDays(today, -i)));
      if (!s) continue;
      if (s.kind === 'done' || s.kind === 'covered') {
        ok++;
        all++;
      } else if (s.kind === 'missed') all++;
    }
    return all === 0 ? 100 : Math.round((ok / all) * 100);
  }, [habit, today, done]);

  const [selected, setSelected] = useState<string | null>(null);
  const formatDay = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y!, m! - 1, d!).toLocaleDateString(copy.locale, {
      weekday: 'short',
      day: 'numeric',
    });
  };
  const describe = (key: string) => {
    const s = statuses.get(key);
    if (!s) return '';
    const day = formatDay(key);
    switch (s.kind) {
      case 'done':
        return `${day} · ${h.status.done}`;
      case 'makeup':
        return `${day} · ${h.status.makeup(s.pairKey ? formatDay(s.pairKey) : '')}`;
      case 'covered':
        return `${day} · ${h.status.covered(s.pairKey ? formatDay(s.pairKey) : '')}`;
      case 'bonus':
        return `${day} · ${h.status.bonus}`;
      case 'missed':
        return `${day} · ${h.status.missed}`;
      case 'paused':
        return `${day} · ${h.status.paused}`;
      case 'planned':
        return `${day} · ${h.status.planned}`;
      case 'todayOpen':
        return `${day} · ${h.status.todayOpen}`;
      default:
        return `${day} · ${h.status.none}`;
    }
  };

  const scheduleText =
    habit.days.length === 7
      ? lang === 'de'
        ? 'Jeden Tag'
        : 'Every day'
      : habit.days
          .map(d =>
            addDays(mondayOf(today), d).toLocaleDateString(copy.locale, {
              weekday: 'short',
            })
          )
          .join(' · ');

  const gridWidth = Math.min(size.width, 640) - labSpace.xl * 2 - GRID_PAD * 2;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000' },
          scrimStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.frame,
          { backgroundColor: c.canvas, borderColor: c.border },
          frameStyle,
        ]}
      >
        <Animated.View
          style={[{ width: size.width, height: size.height }, contentStyle]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: bottomInset + labSpace.xxl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar: the level badge stays pinned on the left, close sits on the right. */}
            <View style={styles.topBar}>
              <PressableScale
                onPress={close}
                haptic={null}
                pressScale={0.9}
                accessibilityLabel={copy.detail.close}
                style={[
                  styles.close,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                <Ionicons name="close" size={20} color={c.text} />
              </PressableScale>
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <IconBadge
                icon={habit.icon as never}
                color={habitColor}
                size={52}
              />
              <View style={{ flex: 1, marginLeft: labSpace.md }}>
                <LabText variant="title" numberOfLines={2}>
                  {habit.name[lang]}
                </LabText>
                <LabText
                  variant="caption"
                  tone="muted"
                  style={{ marginTop: 2 }}
                >
                  {scheduleText}
                </LabText>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatTile
                icon="flame"
                tint={c.flame}
                label={h.currentStreak}
                value={`${habit.streak}`}
              />
              <StatTile
                icon="trophy"
                tint={c.rewardText}
                label={h.bestStreak}
                value={`${habit.best}`}
              />
              <StatTile
                icon="pie-chart"
                tint={c.primary}
                label={h.rate}
                value={`${rate}%`}
              />
            </View>

            {/* Calendar */}
            <Surface style={{ marginTop: labSpace.lg, padding: GRID_PAD }}>
              <View style={styles.monthRow}>
                <MonthButton
                  icon="chevron-back"
                  enabled={canGoBack}
                  onPress={() => {
                    setDirection(-1);
                    setSelected(null);
                    setMonthOffset(o => o - 1);
                  }}
                />
                <LabText
                  variant="titleSm"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {monthStart.toLocaleDateString(copy.locale, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </LabText>
                <MonthButton
                  icon="chevron-forward"
                  enabled={canGoForward}
                  onPress={() => {
                    setDirection(1);
                    setSelected(null);
                    setMonthOffset(o => o + 1);
                  }}
                />
              </View>

              <View style={styles.weekHeader}>
                {copy.weekdays.map((d, i) => (
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
                entering={(direction === 1 ? FadeInRight : FadeInLeft).duration(
                  260
                )}
              >
                <MonthGrid
                  monthStart={monthStart}
                  statuses={statuses}
                  today={today}
                  width={gridWidth}
                  habitColor={habitColor}
                  selected={selected}
                  onSelect={key => {
                    selection();
                    setSelected(prev => (prev === key ? null : key));
                  }}
                />
              </Animated.View>

              {/* What happened on the tapped day */}
              <View style={[styles.info, { backgroundColor: c.surfaceRaised }]}>
                <Animated.View
                  key={selected ?? 'hint'}
                  entering={FadeIn.duration(180)}
                >
                  <LabText
                    variant="label"
                    tone={selected ? 'text' : 'faint'}
                    style={{ textAlign: 'center' }}
                  >
                    {selected ? describe(selected) : h.tapHint}
                  </LabText>
                </Animated.View>
              </View>
            </Surface>

            {/* Legend — the app's own words */}
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
            </View>

            {/* How make-up works */}
            <Surface style={{ marginTop: labSpace.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    styles.explainIcon,
                    { backgroundColor: c.successSoft },
                  ]}
                >
                  <Ionicons name="refresh" size={18} color={c.successText} />
                </View>
                <LabText
                  variant="titleSm"
                  style={{ marginLeft: labSpace.md, flex: 1 }}
                >
                  {h.explainTitle}
                </LabText>
              </View>
              <LabText
                variant="body"
                tone="muted"
                style={{ marginTop: labSpace.sm }}
              >
                {h.explainBody}
              </LabText>
            </Surface>
          </ScrollView>
        </Animated.View>
      </Animated.View>
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
      <Ionicons name={icon} size={18} color={tint} />
      <View style={{ marginTop: labSpace.sm }}>
        <RollingNumber
          text={value}
          variant="number"
          style={{ fontSize: 26, lineHeight: 32 }}
          delay={250}
        />
      </View>
      <LabText variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </LabText>
    </Surface>
  );
}

function MonthButton({
  icon,
  enabled,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  enabled: boolean;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={() => {
        if (enabled) onPress();
      }}
      haptic={enabled ? 'selection' : null}
      pressScale={0.9}
      accessibilityLabel={
        icon === 'chevron-back' ? 'Previous month' : 'Next month'
      }
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

const CELL_GAP = 6;

function MonthGrid({
  monthStart,
  statuses,
  today,
  width,
  habitColor,
  selected,
  onSelect,
}: {
  monthStart: Date;
  statuses: Map<string, DayStatus>;
  today: Date;
  width: number;
  habitColor: string;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const colW = width / 7;
  const cell = Math.min(40, colW - CELL_GAP);
  // Room between rows for the make-up arches (above and below a row).
  const rowH = cell + 20;
  const lead = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0
  ).getDate();
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const todayKey = dateKey(today);

  const centerOf = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    if (y !== monthStart.getFullYear() || m! - 1 !== monthStart.getMonth())
      return null;
    const index = lead + d! - 1;
    return {
      x: (index % 7) * colW + colW / 2,
      y: Math.floor(index / 7) * rowH + rowH / 2,
    };
  };

  // Arches from each make-up day to the missed day it covers (same week = same row).
  // Arches from each make-up day to the missed day it covers (same week = same row).
  // Kolo 16: pairs that overlap in one week (Thu rescues Mon, Sat rescues Wed) take
  // different lanes — the first above the days, the next below — so they never
  // cross and never seem to touch the days in between.
  const arches = useMemo(() => {
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
    const laneEnds = new Map<number, number[]>();
    const list: {
      path: ReturnType<typeof Skia.Path.Make>;
      end: { x: number; y: number };
    }[] = [];
    pairs.forEach(({ a, b }) => {
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
      const below = lane % 2 === 1;
      const dir = below ? 1 : -1;
      const edge = (dir * cell) / 2;
      // Peak a few points past the cell edge — stays in the gap between rows.
      const bow = 2 * (4 + Math.floor(lane / 2) * 3 + (to - from) * 0.02);
      const path = Skia.Path.Make();
      path.moveTo(a.x, a.y + edge);
      path.quadTo((a.x + b.x) / 2, a.y + edge + dir * bow, b.x, b.y + edge);
      list.push({ path, end: { x: b.x, y: b.y + edge } });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, colW, rowH, cell, monthStart]);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withDelay(
      320,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [draw, statuses]);

  return (
    <View style={{ width, height: rows * rowH, marginTop: labSpace.sm }}>
      {Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          i + 1
        );
        const key = dateKey(d);
        const index = lead + i;
        const status = statuses.get(key) ?? { kind: 'none' as DayKind };
        return (
          <View
            key={key}
            style={{
              position: 'absolute',
              left: (index % 7) * colW + (colW - cell) / 2,
              top: Math.floor(index / 7) * rowH + (rowH - cell) / 2,
            }}
          >
            <DayCell
              day={i + 1}
              kind={status.kind}
              isToday={key === todayKey}
              selected={selected === key}
              size={cell}
              habitColor={habitColor}
              onPress={() => onSelect(key)}
            />
          </View>
        );
      })}
      <Canvas
        style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}
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
 * Day look. Kolo 15: done and make-up are the habit's own colour (identity); the
 * rescued day is a hollow ring in it. Kolo 17 (Petr): missed is a SATURATED RED
 * ring with ×, bonus = the habit's colour with a GOLD rim and ★ (kolo 18) — red and
 * gold are reserved, no habit colour comes within ΔE2000 20 of them, and each
 * carries a symbol too (never colour alone).
 * Proposal R-11/R-12: technical-guides:Habits.md still says green make-up.
 */
function cellLook(kind: DayKind, c: LabPalette, habitColor: string) {
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
      // A red × on a neutral tile — no ring, so a red habit's rescued day (a ring)
      // can never look like a missed one (kolo 19).
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
  onPress,
}: {
  day: number;
  kind: DayKind;
  isToday: boolean;
  selected: boolean;
  size: number;
  habitColor: string;
  onPress: () => void;
}) {
  const { c } = useLab();
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
      haptic={null}
      pressScale={0.88}
      onPress={onPress}
      accessibilityLabel={`${day}`}
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
              {
                fontFamily: isToday ? labFonts.bold : labFonts.semibold,
                fontSize: 13,
              },
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
  const { c } = useLab();
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
      <LabText variant="caption" tone="muted">
        {label}
      </LabText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    padding: labSpace.xl,
    paddingTop: labSpace.sm,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: labSpace.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.xl,
  },
  statTile: {
    flex: 1,
    padding: labSpace.lg,
    borderRadius: labRadius.md + 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    marginTop: labSpace.lg,
  },
  weekHeaderCell: {
    textAlign: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  info: {
    marginTop: labSpace.md,
    paddingVertical: labSpace.md,
    paddingHorizontal: labSpace.lg,
    borderRadius: labRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.md,
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
