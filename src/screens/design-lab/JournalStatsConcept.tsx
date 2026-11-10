/**
 * Journal statistics (kolo 20) — the numbers of today's screen, made legible:
 *   1. The streak — the flame, the number, the best run.
 *   2. Four numbers that count up: entries, active days, daily average, milestones.
 *   3. Last 30 days — the headline (days at the goal), one bar per day on a ghost
 *      track, a dashed line at the goal, week guides; tap or slide = a tooltip.
 *   4. Entry types — gratitude vs self-praise as one split bar.
 *   5. ⭐ 🔥 👑 — what each milestone is and how many there are.
 *   6. The encouragement (the app's own texts).
 *
 * Chart rules (dataviz skill, kolo 20): bars anchored to the baseline, rounded only
 * at the data end, 2 px surface gap between segments and bars, labels in text
 * colours (never the series colour), a legend for the 2+ series. The scale tops
 * out at 8 entries and a taller day carries its value ("13"), so one record day
 * does not squash the month (kolo 21). The chart colours are their own steps, validated by the
 * skill's palette script in both themes (lightness band, CVD separation ≥ 23,
 * contrast ≥ 3:1) — the UI gold #F4B63F fails as a mark on white (1.8:1).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces app/journal-stats.tsx. Numbers from GratitudeContext (stats +
 *   streakInfo), the 30 days from the entries; never from journalMock.
 * - The app's "Active days" subtitle is broken today: the locale uses ICU plural
 *   syntax, i18next has no ICU plugin → users read "{count, plural, …} with
 *   entries" in EN/DE/ES (lesson 30). Fix the key, do not copy the lab's text.
 * - Chart colours go into the design tokens as a separate chart palette (F2).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  AnimatedNumber,
  IconBadge,
  LabText,
  Surface,
  useLab,
} from './labPrimitives';
import { labFonts, LabMode, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { RollingNumber } from './RollingNumber';
import { StreakFlame } from './StreakFlame';
import { addDays, dateKey } from './habitsMock';
import { DAILY_GOAL, MilestoneKind, useLabJournal } from './journalMock';
import {
  formatDay,
  MILESTONE_EMOJI,
  PageTopBar,
  useJournalT,
} from './journalParts';

/** Validated with the dataviz palette script against each theme's surface. */
function chartColors(mode: LabMode) {
  return mode === 'light'
    ? { goal: '#0A62D8', bonus: '#B97F0E', selfPraise: '#1E9E5A' }
    : { goal: '#3F86F0', bonus: '#BE8A1A', selfPraise: '#22A062' };
}

export function JournalStatsConcept({
  bottomInset,
  onClose,
}: {
  bottomInset: number;
  onClose: () => void;
}) {
  const { c, lang } = useLab();
  const t = useJournalT();
  const j = MOCK_COPY[lang].journal;
  const { stats } = useLabJournal();
  const personalBest =
    stats.currentStreak > 0 && stats.currentStreak >= stats.longestStreak;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        contentColumn,
        {
          paddingHorizontal: labSpace.xl,
          paddingBottom: bottomInset + labSpace.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <LabText
        variant="overline"
        tone="muted"
        style={{ marginTop: labSpace.sm }}
      >
        {t('journal.title')}
      </LabText>
      <LabText variant="display" style={{ marginTop: labSpace.sm }}>
        {t('journal.stats.title')}
      </LabText>

      {/* The streak */}
      <Surface style={[styles.hero, { marginTop: labSpace.xxl }]}>
        <StreakFlame
          state="fire"
          onStateChange={() => undefined}
          size={76}
          label={t('journal.currentStreak')}
        />
        <View style={{ marginLeft: labSpace.md, flex: 1 }}>
          <LabText variant="overline" tone="flame">
            {t('journal.stats.currentStreak')}
          </LabText>
          <View style={styles.heroNumber}>
            <AnimatedNumber
              value={stats.currentStreak}
              format={v => {
                'worklet';
                return `${Math.round(v)}`;
              }}
              variant="number"
              delay={250}
              style={{ fontSize: 52, lineHeight: 58 }}
            />
            <LabText
              variant="label"
              tone="muted"
              style={{ marginLeft: labSpace.sm, marginBottom: 10 }}
            >
              {MOCK_COPY[lang].days}
            </LabText>
          </View>
          <LabText variant="caption" tone={personalBest ? 'reward' : 'muted'}>
            {personalBest
              ? t('journal.stats.personalBest')
              : t('journal.stats.best', { days: stats.longestStreak })}
          </LabText>
        </View>
      </Surface>

      {/* Four numbers */}
      <View style={styles.tiles}>
        <StatTile
          icon="document-text-outline"
          color={c.primary}
          label={t('journal.stats.totalEntries')}
          value={stats.totalEntries}
          sub={t('journal.stats.allTime')}
          delay={300}
        />
        <StatTile
          icon="calendar-outline"
          color={c.habit.teal}
          label={t('journal.stats.activeDays')}
          value={stats.activeDays}
          sub={j.activeDaysSub(stats.activeDays)}
          delay={360}
        />
      </View>
      <View style={styles.tiles}>
        <StatTile
          icon="analytics-outline"
          color={c.habit.purple}
          label={t('journal.stats.dailyAverage')}
          value={stats.averagePerActiveDay}
          decimals
          sub={t('journal.stats.entriesPerDay')}
          delay={420}
        />
        <StatTile
          icon="trophy-outline"
          color={c.rewardText}
          label={t('journal.stats.milestoneBadges')}
          value={stats.stars + stats.flames + stats.crowns}
          sub={`⭐ ${stats.stars} · 🔥 ${stats.flames} · 👑 ${stats.crowns}`}
          delay={480}
        />
      </View>

      <Last30 />
      <TypeSplit />

      {/* ⭐ 🔥 👑 */}
      <Surface style={{ marginTop: labSpace.lg }}>
        <LabText variant="titleSm">
          {t('journal.stats.milestoneBadges')}
        </LabText>
        <View style={styles.medals}>
          {(
            [
              ['star', stats.stars],
              ['flame', stats.flames],
              ['crown', stats.crowns],
            ] as [MilestoneKind, number][]
          ).map(([kind, n]) => (
            <View key={kind} style={styles.medal}>
              <View
                style={[styles.medalDisc, { backgroundColor: c.rewardSoft }]}
              >
                <LabText variant="title">{MILESTONE_EMOJI[kind]}</LabText>
              </View>
              <RollingNumber
                text={`${n}`}
                variant="numberSm"
                delay={500}
                style={{ marginTop: labSpace.sm }}
              />
              <LabText
                variant="caption"
                tone="muted"
                style={{ textAlign: 'center' }}
              >
                {j.milestoneMeaning[kind]}
              </LabText>
            </View>
          ))}
        </View>
      </Surface>

      {/* Encouragement */}
      <Surface style={{ marginTop: labSpace.lg }}>
        <LabText variant="overline" tone="primary">
          {t('journal.stats.motivationTitle')}
        </LabText>
        <LabText variant="title" italic style={{ marginTop: labSpace.sm }}>
          {stats.currentStreak === 0
            ? t('journal.stats.motivationNoStreak')
            : stats.currentStreak === 1
              ? t('journal.stats.motivationDay1')
              : t('journal.stats.motivationDays', {
                  days: stats.currentStreak,
                })}
        </LabText>
      </Surface>
    </ScrollView>
  );
}

function StatTile({
  icon,
  color,
  label,
  value,
  sub,
  decimals = false,
  delay,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  value: number;
  sub: string;
  decimals?: boolean;
  delay: number;
}) {
  return (
    <Surface style={styles.tile}>
      <IconBadge icon={icon} color={color} size={36} />
      <LabText
        variant="caption"
        tone="muted"
        numberOfLines={1}
        style={{ marginTop: labSpace.md }}
      >
        {label}
      </LabText>
      <AnimatedNumber
        value={value}
        format={
          decimals
            ? v => {
                'worklet';
                return v.toFixed(1);
              }
            : v => {
                'worklet';
                return `${Math.round(v)}`;
              }
        }
        variant="number"
        delay={delay}
      />
      <LabText variant="caption" tone="faint" numberOfLines={2}>
        {sub}
      </LabText>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Last 30 days
// ---------------------------------------------------------------------------

/** Plot height and the room above it for the value of a capped bar. */
const PLOT_H = 128;
const HEADROOM = 18;
/** Room for the tooltip above the plot. */
const TIP_ROW = 46;
/**
 * The scale tops out at 8 entries: one 13-entry day would otherwise squash every
 * normal day to a stub. A taller day reaches the top and carries its value
 * ("13") — the number keeps it honest.
 */
const SCALE_MAX = 8;

function Last30() {
  const { c, lang, mode } = useLab();
  const t = useJournalT();
  const copy = MOCK_COPY[lang];
  const j = copy.journal;
  const { stats, today } = useLabJournal();
  const colors = chartColors(mode);
  const data = stats.last30;
  const n = data.length;
  const atGoal = data.filter(v => v >= DAILY_GOAL).length;
  const avgRaw = (data.reduce((sum, v) => sum + v, 0) / n).toFixed(1);
  const avg = lang === 'de' ? avgRaw.replace('.', ',') : avgRaw;

  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const last = useRef<number | null>(null);
  const toggleOff = useRef(false);
  const moved = useRef(false);
  const colW = width / n;
  const barW = Math.max(4, Math.min(10, colW * 0.6));
  const unit = PLOT_H / SCALE_MAX;
  const dateOf = (i: number) => addDays(today, i - (n - 1));

  const indexAt = (x: number) =>
    Math.max(0, Math.min(n - 1, Math.floor(x / Math.max(1, colW))));
  const pick = (i: number) => {
    if (last.current !== i) selection();
    last.current = i;
    setSelected(i);
  };

  const sel = selected === null ? null : selected;
  const selCount = sel === null ? 0 : (data[sel] ?? 0);
  const selKind =
    selCount >= 13
      ? 'crown'
      : selCount >= 8
        ? 'flame'
        : selCount >= 4
          ? 'star'
          : null;
  const TIP_W = 150;
  const tipLeft =
    sel === null
      ? 0
      : Math.max(0, Math.min(width - TIP_W, colW * (sel + 0.5) - TIP_W / 2));

  // Monday labels under the plot; none too close to "Today" on the right.
  const mondays = data
    .map((_, i) => i)
    .filter(i => i > 0 && i < n - 5 && dateOf(i).getDay() === 1);

  return (
    <Surface style={{ marginTop: labSpace.lg }}>
      <LabText variant="titleSm">{j.last30}</LabText>
      <View style={chartStyles.headline}>
        <RollingNumber text={`${atGoal}`} variant="number" delay={300} />
        <LabText
          variant="label"
          tone="muted"
          style={{ marginLeft: labSpace.sm, marginBottom: 8, flexShrink: 1 }}
        >
          {j.chartAtGoal(atGoal, n)}
        </LabText>
      </View>
      <LabText variant="caption" tone="faint">
        {j.chartAvg(avg)}
      </LabText>

      {/* Tooltip row: the tapped day, or the hint */}
      <View style={{ height: TIP_ROW, marginTop: labSpace.md }}>
        {sel === null ? (
          <View style={chartStyles.hint}>
            <Ionicons name="hand-left-outline" size={14} color={c.textFaint} />
            <LabText variant="caption" tone="faint" style={{ marginLeft: 6 }}>
              {j.chartHint}
            </LabText>
          </View>
        ) : (
          <Animated.View
            key={sel}
            entering={FadeIn.duration(120)}
            style={[
              chartStyles.tip,
              { left: tipLeft, width: TIP_W, backgroundColor: c.text },
            ]}
          >
            <LabText
              variant="caption"
              style={{ color: c.canvas, opacity: 0.75 }}
              numberOfLines={1}
            >
              {formatDay(dateKey(dateOf(sel)), copy.locale)}
            </LabText>
            <LabText
              variant="bodyStrong"
              style={{ color: c.canvas }}
              numberOfLines={1}
            >
              {`${j.entries(selCount)}${selKind ? `  ${MILESTONE_EMOJI[selKind]}` : ''}`}
            </LabText>
          </Animated.View>
        )}
      </View>

      {/* The plot — one touch surface; everything inside ignores touches so
          locationX is always relative to the plot. */}
      <View
        style={{ height: PLOT_H + HEADROOM }}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => true}
        onResponderGrant={e => {
          const i = indexAt(e.nativeEvent.locationX);
          toggleOff.current = i === selected;
          moved.current = false;
          pick(i);
        }}
        onResponderMove={e => {
          const i = indexAt(e.nativeEvent.locationX);
          if (i !== last.current) moved.current = true;
          pick(i);
        }}
        onResponderRelease={() => {
          if (toggleOff.current && !moved.current) {
            setSelected(null);
            last.current = null;
          }
        }}
        accessibilityRole="adjustable"
        accessibilityLabel={`${j.last30}: ${atGoal} ${j.chartAtGoal(atGoal, n)}`}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Week guides (before each Monday) */}
          {width > 0 &&
            data.map((_, i) =>
              i > 0 && dateOf(i).getDay() === 1 ? (
                <View
                  key={`w${i}`}
                  style={[
                    chartStyles.weekGuide,
                    { left: colW * i, backgroundColor: c.border },
                  ]}
                />
              ) : null
            )}
          {/* Daily goal */}
          <View
            style={[
              chartStyles.goal,
              { bottom: DAILY_GOAL * unit, borderColor: c.textFaint },
            ]}
          />
          {width > 0 &&
            data.map((count, i) => (
              <Bar
                key={i}
                count={count}
                left={colW * i + (colW - barW) / 2}
                width={barW}
                unit={unit}
                delay={150 + i * 18}
                dim={sel !== null && sel !== i}
                colors={colors}
              />
            ))}
          {/* Hairline from the tooltip down to the chosen bar */}
          {sel !== null && width > 0 && (
            <View
              style={[
                chartStyles.pointer,
                {
                  left: colW * (sel + 0.5) - 0.5,
                  height:
                    PLOT_H +
                    HEADROOM -
                    Math.min(selCount, SCALE_MAX) * unit -
                    4,
                  backgroundColor: c.textFaint,
                },
              ]}
            />
          )}
        </View>
      </View>
      <View style={[chartStyles.baseline, { backgroundColor: c.border }]} />

      {/* Axis: Mondays + today */}
      <View style={chartStyles.axis}>
        {width > 0 &&
          mondays.map(i => (
            <LabText
              key={i}
              variant="caption"
              tone="faint"
              style={[chartStyles.axisLabel, { left: colW * i }]}
            >
              {dateOf(i).toLocaleDateString(copy.locale, {
                day: 'numeric',
                month: 'short',
              })}
            </LabText>
          ))}
        {width > 0 && (
          <View
            style={[
              chartStyles.todayDot,
              { left: colW * (n - 0.5) - 2, backgroundColor: c.primary },
            ]}
          />
        )}
        <LabText
          variant="caption"
          tone="primary"
          style={[chartStyles.todayLabel, { fontFamily: labFonts.semibold }]}
        >
          {t('journal.today')}
        </LabText>
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.goal} label={j.legend.complete} />
        <LegendItem color={colors.bonus} label={j.legend.bonus} />
        <LegendItem color={c.textFaint} label={j.legend.partial} />
        <LegendItem
          color={c.textFaint}
          label={`${j.goalLine} (${DAILY_GOAL})`}
          line
        />
      </View>
    </Surface>
  );
}

/**
 * One day: a ghost track at full height, the bar rising out of the baseline —
 * the goal part, a 2 px surface gap, the bonus part. Rounded at the data end only.
 */
function Bar({
  count,
  left,
  width,
  unit,
  delay,
  dim,
  colors,
}: {
  count: number;
  left: number;
  width: number;
  unit: number;
  delay: number;
  dim: boolean;
  colors: ReturnType<typeof chartColors>;
}) {
  const { c } = useLab();
  const shown = Math.min(count, SCALE_MAX);
  const height = shown * unit;
  const base = Math.min(count, DAILY_GOAL) * unit;
  const bonus = Math.max(0, shown - DAILY_GOAL) * unit;
  const met = count >= DAILY_GOAL;
  const capped = count > SCALE_MAX;

  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(
      delay,
      withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) })
    );
  }, [grow, delay]);
  const growStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - grow.value) * (height + 2) }],
  }));
  const radius = {
    borderTopLeftRadius: width / 2,
    borderTopRightRadius: width / 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  };

  return (
    <View
      style={[chartStyles.column, { left, width, opacity: dim ? 0.32 : 1 }]}
    >
      <View
        style={[
          chartStyles.ghost,
          radius,
          { height: PLOT_H, backgroundColor: c.track },
        ]}
      />
      {count > 0 && (
        <View
          style={[
            chartStyles.clip,
            radius,
            { height: Math.max(width, height) },
          ]}
        >
          <Animated.View style={[chartStyles.stack, growStyle]}>
            {bonus > 0 && (
              <View
                style={{ height: bonus - 1, backgroundColor: colors.bonus }}
              />
            )}
            {bonus > 0 && (
              <View style={{ height: 2, backgroundColor: c.surface }} />
            )}
            <View
              style={{
                height: Math.max(width, base) - (bonus > 0 ? 1 : 0),
                backgroundColor: met ? colors.goal : c.textFaint,
              }}
            />
          </Animated.View>
        </View>
      )}
      {capped && (
        <LabText
          variant="caption"
          tone="muted"
          style={[chartStyles.capLabel, { bottom: PLOT_H + 1 }]}
        >
          {`${count}`}
        </LabText>
      )}
    </View>
  );
}

function LegendItem({
  color,
  label,
  line = false,
}: {
  color: string;
  label: string;
  line?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      {line ? (
        <View style={[chartStyles.legendLine, { borderColor: color }]} />
      ) : (
        <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      )}
      <LabText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
        {label}
      </LabText>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: labSpace.md,
  },
  hint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tip: {
    position: 'absolute',
    top: 0,
    height: TIP_ROW - 6,
    borderRadius: labRadius.sm,
    paddingHorizontal: labSpace.md,
    justifyContent: 'center',
  },
  weekGuide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  goal: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  column: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  ghost: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  clip: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  stack: {
    justifyContent: 'flex-end',
  },
  capLabel: {
    position: 'absolute',
    left: -12,
    right: -12,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  pointer: {
    position: 'absolute',
    top: 0,
    width: 1,
  },
  baseline: {
    height: 1,
  },
  axis: {
    height: 22,
    marginTop: labSpace.xs,
  },
  axisLabel: {
    position: 'absolute',
    top: 4,
    fontSize: 11,
  },
  todayDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todayLabel: {
    position: 'absolute',
    right: 0,
    top: 4,
    fontSize: 11,
  },
  legendLine: {
    width: 14,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
});

// ---------------------------------------------------------------------------
// Gratitude vs self-praise
// ---------------------------------------------------------------------------

function TypeSplit() {
  const { c, mode } = useLab();
  const t = useJournalT();
  const { stats } = useLabJournal();
  const colors = chartColors(mode);
  const total = Math.max(1, stats.gratitude + stats.selfPraise);
  const share = stats.gratitude / total;
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(
      300,
      withTiming(share, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [fill, share]);
  const width = useSharedValue(0);
  const leftStyle = useAnimatedStyle(() => ({
    width: Math.max(0, fill.value * width.value - 1),
  }));

  const rows = [
    {
      key: 'g',
      label: t('journal.input.typeGratitude'),
      color: colors.goal,
      n: stats.gratitude,
      icon: 'heart' as const,
    },
    {
      key: 's',
      label: t('journal.input.typeSelfPraise'),
      color: colors.selfPraise,
      n: stats.selfPraise,
      icon: 'sparkles' as const,
    },
  ];

  return (
    <Surface style={{ marginTop: labSpace.lg }}>
      <LabText variant="titleSm">{t('journal.stats.entryTypes')}</LabText>
      <View
        style={[styles.split, { backgroundColor: colors.selfPraise }]}
        onLayout={e => {
          width.value = e.nativeEvent.layout.width;
        }}
      >
        {/* 2 px surface gap between the two parts */}
        <Animated.View
          style={[
            styles.splitLeft,
            { backgroundColor: colors.goal, borderRightColor: c.surface },
            leftStyle,
          ]}
        />
      </View>
      {rows.map(row => (
        <View key={row.key} style={styles.splitRow}>
          <View style={[styles.legendSwatch, { backgroundColor: row.color }]} />
          <Ionicons
            name={row.icon}
            size={14}
            color={c.textMuted}
            style={{ marginLeft: labSpace.sm }}
          />
          <LabText variant="body" style={{ marginLeft: 6, flex: 1 }}>
            {row.label}
          </LabText>
          <LabText
            variant="bodyStrong"
            style={{ fontFamily: labFonts.semibold }}
          >
            {`${row.n}`}
          </LabText>
          <LabText
            variant="label"
            tone="muted"
            style={{ width: 52, textAlign: 'right' }}
          >
            {`${Math.round((row.n / total) * 100)} %`}
          </LabText>
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroNumber: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tiles: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.md,
  },
  tile: {
    flex: 1,
    padding: labSpace.lg,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.md,
    marginTop: labSpace.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  split: {
    height: 14,
    borderRadius: 4,
    marginTop: labSpace.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  splitLeft: {
    height: 14,
    borderRightWidth: 2,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.md,
  },
  medals: {
    flexDirection: 'row',
    marginTop: labSpace.lg,
    gap: labSpace.sm,
  },
  medal: {
    flex: 1,
    alignItems: 'center',
  },
  medalDisc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
