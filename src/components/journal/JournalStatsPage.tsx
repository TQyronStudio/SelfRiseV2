/**
 * Journal statistics (migration E13, from the Design Lab's JournalStatsConcept):
 *   1. the streak — the flame, the number, the best run (or "start today");
 *   2. four numbers: entries, active days, daily average, milestones;
 *   3. the last 30 days — days at the goal, one bar per day on a ghost track,
 *      a dashed line at the goal; tap or slide = the day's number;
 *   4. entry types — gratitude vs self-praise as one split bar;
 *   5. ⭐ 🔥 👑 — what each is and how many;
 *   6. the encouragement (the app's own texts).
 * Totals, active days and the average are the app's (GratitudeContext stats,
 * read live); the 30 days and the types are counted from the entries
 * (journalStatsLogic). The chart colours are the token chart palette.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useDesign } from '@/src/contexts/ThemeContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useJournalFlame } from '@/src/hooks/useJournalFlame';
import { chart, fonts, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { parseDate, today as todayString } from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import { JOURNAL_DAILY_GOAL, JournalMilestone } from '@/src/utils/journalXp';
import {
  CHART_DAYS,
  CHART_SCALE_MAX,
  chartSummary,
  lastDaysCounts,
  milestoneOfCount,
  streakNote,
  typeSplit,
} from '@/src/screens/journal/journalStatsLogic';
import {
  AppText,
  IconBadge,
  InlineIcon,
  PageTopBar,
  RollingNumber,
  SignatureIcon,
  StreakFlame,
  Surface,
} from '@/src/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function JournalStatsPage({
  bottomInset,
  topInset,
  onClose,
}: {
  bottomInset: number;
  topInset: number;
  onClose: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { state } = useGratitude();
  const locale = t('common.locale');
  const stats = state.stats;
  const streak = state.streakInfo;
  const flame = useJournalFlame(streak);
  const current = streak?.currentStreak ?? 0;
  const longest = streak?.longestStreak ?? 0;
  const stars = streak?.starCount ?? 0;
  const flames = streak?.flameCount ?? 0;
  const crowns = streak?.crownCount ?? 0;
  const note = streakNote(current, longest);
  const number = (n: number, digits = 0) =>
    n.toLocaleString(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  return (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        contentColumn,
        {
          paddingTop: topInset,
          paddingHorizontal: space.xl,
          paddingBottom: bottomInset + space.xxl,
        },
      ]}
    >
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <AppText variant="overline" tone="muted" style={styles.overline}>
        {t('journal.title')}
      </AppText>
      <AppText variant="display" style={styles.title}>
        {t('journal.stats.title')}
      </AppText>

      {/* The streak */}
      <Surface style={styles.hero}>
        <StreakFlame
          state={flame.state}
          onWarmed={flame.onWarmed}
          size={76}
          label={t('journal.currentStreak')}
        />
        <View style={styles.heroText}>
          <AppText variant="overline" tone="flame">
            {t('journal.stats.currentStreak')}
          </AppText>
          <View style={styles.heroNumber}>
            <RollingNumber text={`${current}`} variant="streak" />
            <AppText variant="label" tone="muted" style={styles.unit}>
              {t('journal.streakDaysUnit', { count: current })}
            </AppText>
          </View>
          <AppText
            variant="caption"
            tone={note === 'personalBest' ? 'reward' : 'muted'}
          >
            {note === 'personalBest'
              ? t('journal.stats.personalBest')
              : note === 'startToday'
                ? t('journal.stats.startToday')
                : t('journal.stats.best', { count: longest })}
          </AppText>
        </View>
      </Surface>

      {/* Four numbers */}
      <View style={styles.tiles}>
        <StatTile
          icon="document-text-outline"
          color={c.primary}
          label={t('journal.stats.totalEntries')}
          value={number(stats?.totalGratitudes ?? 0)}
          sub={t('journal.stats.allTime')}
        />
        <StatTile
          icon="calendar-outline"
          color={c.habit.teal}
          label={t('journal.stats.activeDays')}
          value={number(stats?.totalDays ?? 0)}
          sub={t('journal.stats.daysWithEntries', {
            count: stats?.totalDays ?? 0,
          })}
        />
      </View>
      <View style={styles.tiles}>
        <StatTile
          icon="analytics-outline"
          color={c.habit.purple}
          label={t('journal.stats.dailyAverage')}
          value={number(stats?.averagePerDay ?? 0, 1)}
          sub={t('journal.stats.entriesPerDay')}
        />
        <StatTile
          icon="trophy-outline"
          color={c.rewardText}
          label={t('journal.stats.milestoneBadges')}
          value={number(stars + flames + crowns)}
          subLabel={`${stars} ${t('journal.iconNames.star')}, ${flames} ${t('journal.iconNames.flame')}, ${crowns} ${t('journal.iconNames.crown')}`}
          sub={
            <>
              <InlineIcon name="star" /> {stars}
              {'   '}
              <InlineIcon name="flame" /> {flames}
              {'   '}
              <InlineIcon name="crown" /> {crowns}
            </>
          }
        />
      </View>

      <Last30 locale={locale} />
      <TypeSplit />

      {/* ⭐ 🔥 👑 */}
      <Surface style={styles.card}>
        <AppText variant="titleSm">
          {t('journal.stats.milestoneBadges')}
        </AppText>
        <View style={styles.medals}>
          {(
            [
              ['star', stars, 'journal.stats.milestoneStar'],
              ['flame', flames, 'journal.stats.milestoneFlame'],
              ['crown', crowns, 'journal.stats.milestoneCrown'],
            ] as [JournalMilestone, number, string][]
          ).map(([kind, n, meaning]) => (
            <View key={kind} style={styles.medal}>
              <View
                style={[styles.medalDisc, { backgroundColor: c.rewardSoft }]}
              >
                <SignatureIcon name={kind} size={28} />
              </View>
              <RollingNumber
                text={`${n}`}
                variant="numberSm"
                style={styles.medalCount}
              />
              <AppText variant="caption" tone="muted" style={styles.centerText}>
                {t(meaning)}
              </AppText>
            </View>
          ))}
        </View>
      </Surface>

      {/* Encouragement */}
      <Surface style={styles.card}>
        <AppText variant="overline" tone="primary">
          {t('journal.stats.motivationTitle')}
        </AppText>
        <AppText variant="title" italic style={styles.motivation}>
          {current === 0
            ? t('journal.stats.motivationNoStreak')
            : current === 1
              ? t('journal.stats.motivationDay1')
              : t('journal.stats.motivationDays', { days: current })}
        </AppText>
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
  subLabel,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  sub: React.ReactNode;
  /** Spoken form of `sub` when it holds icon glyphs. */
  subLabel?: string;
}) {
  return (
    <Surface style={styles.tile}>
      <IconBadge icon={icon} color={color} size={36} />
      <AppText
        variant="caption"
        tone="muted"
        numberOfLines={2}
        style={styles.tileLabel}
      >
        {label}
      </AppText>
      <RollingNumber text={value} variant="number" />
      <AppText
        variant="caption"
        tone="faint"
        numberOfLines={2}
        {...(subLabel ? { accessibilityLabel: subLabel } : null)}
      >
        {sub}
      </AppText>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Last 30 days
// ---------------------------------------------------------------------------

const PLOT_H = 128;
const HEADROOM = 18;
const TIP_ROW = 46;
const TIP_W = 150;

function Last30({ locale }: { locale: string }) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const { state } = useGratitude();
  const colors = chart[mode];
  const today = todayString();
  const days = useMemo(
    () => lastDaysCounts(state.gratitudes, today),
    [state.gratitudes, today]
  );
  const data = days.map(d => d.count);
  const n = data.length;
  const { atGoal, average } = chartSummary(data);
  const avg = average.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const last = useRef<number | null>(null);
  const toggleOff = useRef(false);
  const moved = useRef(false);
  const colW = width / n;
  const barW = Math.max(4, Math.min(10, colW * 0.6));
  const unit = PLOT_H / CHART_SCALE_MAX;
  const dateOf = (i: number) => parseDate(days[i]!.date);
  const indexAt = (x: number) =>
    Math.max(0, Math.min(n - 1, Math.floor(x / Math.max(1, colW))));
  const pick = (i: number) => {
    if (last.current !== i) feel('tap');
    last.current = i;
    setSelected(i);
  };

  const selCount = selected === null ? 0 : (data[selected] ?? 0);
  const selKind = milestoneOfCount(selCount);
  const tipLeft =
    selected === null
      ? 0
      : Math.max(
          0,
          Math.min(width - TIP_W, colW * (selected + 0.5) - TIP_W / 2)
        );
  // Monday labels under the plot; none too close to "Today" on the right.
  const mondays = data
    .map((_, i) => i)
    .filter(i => i > 0 && i < n - 5 && dateOf(i).getDay() === 1);
  const title = t('journal.stats.lastDays', { count: CHART_DAYS });

  return (
    <Surface style={styles.card}>
      <AppText variant="titleSm">{title}</AppText>
      <View style={styles.chartHeadline}>
        <RollingNumber text={`${atGoal}`} variant="number" />
        <AppText variant="label" tone="muted" style={styles.chartHeadlineText}>
          {t('journal.stats.chartAtGoal', { total: n })}
        </AppText>
      </View>
      <AppText variant="caption" tone="faint">
        {t('journal.stats.chartAvg', { avg })}
      </AppText>

      {/* Tooltip row: the tapped day, or the hint */}
      <View style={styles.tipRow}>
        {selected === null ? (
          <View style={styles.hint}>
            <Ionicons name="hand-left-outline" size={14} color={c.textFaint} />
            <AppText variant="caption" tone="faint" style={styles.hintText}>
              {t('journal.stats.chartHint')}
            </AppText>
          </View>
        ) : (
          <Animated.View
            key={selected}
            entering={FadeIn.duration(120)}
            style={[
              styles.tip,
              { left: tipLeft, width: TIP_W, backgroundColor: c.text },
            ]}
          >
            <AppText
              variant="caption"
              style={[styles.tipDate, { color: c.canvas }]}
              numberOfLines={1}
            >
              {dateOf(selected).toLocaleDateString(locale, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </AppText>
            <AppText
              variant="bodyStrong"
              style={{ color: c.canvas }}
              numberOfLines={1}
              accessibilityLabel={`${t('journal.entryCount', { count: selCount })}${
                selKind ? `, ${t(`journal.iconNames.${selKind}`)}` : ''
              }`}
            >
              {t('journal.entryCount', { count: selCount })}
              {selKind ? (
                <>
                  {'  '}
                  <InlineIcon name={selKind} />
                </>
              ) : null}
            </AppText>
          </Animated.View>
        )}
      </View>

      {/* The plot — one touch surface; everything inside ignores touches. */}
      <View
        style={styles.plot}
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
        accessibilityLabel={`${title}: ${atGoal} ${t('journal.stats.chartAtGoal', { total: n })}`}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {width > 0 &&
            data.map((_, i) =>
              i > 0 && dateOf(i).getDay() === 1 ? (
                <View
                  key={`w${i}`}
                  style={[
                    styles.weekGuide,
                    { left: colW * i, backgroundColor: c.border },
                  ]}
                />
              ) : null
            )}
          <View
            style={[
              styles.goal,
              { bottom: JOURNAL_DAILY_GOAL * unit, borderColor: c.textFaint },
            ]}
          />
          {width > 0 &&
            data.map((count, i) => (
              <Bar
                key={days[i]!.date}
                count={count}
                left={colW * i + (colW - barW) / 2}
                width={barW}
                unit={unit}
                delay={150 + i * 18}
                dim={selected !== null && selected !== i}
              />
            ))}
          {selected !== null && width > 0 && (
            <View
              style={[
                styles.pointer,
                {
                  left: colW * (selected + 0.5) - 0.5,
                  height:
                    PLOT_H +
                    HEADROOM -
                    Math.min(selCount, CHART_SCALE_MAX) * unit -
                    4,
                  backgroundColor: c.textFaint,
                },
              ]}
            />
          )}
        </View>
      </View>
      <View style={[styles.baseline, { backgroundColor: c.border }]} />

      {/* Axis: Mondays + today */}
      <View style={styles.axis}>
        {width > 0 &&
          mondays.map(i => (
            <AppText
              key={i}
              variant="micro"
              tone="faint"
              style={[styles.axisLabel, { left: colW * i }]}
            >
              {dateOf(i).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
              })}
            </AppText>
          ))}
        {width > 0 && (
          <View
            style={[
              styles.todayDot,
              { left: colW * (n - 0.5) - 2, backgroundColor: c.primary },
            ]}
          />
        )}
        <AppText variant="micro" tone="primary" style={styles.todayLabel}>
          {t('journal.today')}
        </AppText>
      </View>

      <View style={styles.legend}>
        <LegendItem
          color={colors.done}
          label={t('journal.calendar.legendComplete', {
            goal: JOURNAL_DAILY_GOAL,
          })}
        />
        <LegendItem
          color={colors.bonus}
          label={t('journal.calendar.legendBonus')}
        />
        <LegendItem
          color={c.textFaint}
          label={t('journal.calendar.legendPartial')}
        />
        <LegendItem
          color={c.textFaint}
          label={`${t('journal.stats.dailyGoal')} (${JOURNAL_DAILY_GOAL})`}
          line
        />
      </View>
    </Surface>
  );
}

/**
 * One day: a ghost track at full height, the bar rising out of the baseline —
 * the goal part, a 2 px surface gap, the bonus part. Rounded at the data end.
 */
function Bar({
  count,
  left,
  width,
  unit,
  delay,
  dim,
}: {
  count: number;
  left: number;
  width: number;
  unit: number;
  delay: number;
  dim: boolean;
}) {
  const { c, mode } = useDesign();
  const colors = chart[mode];
  const shown = Math.min(count, CHART_SCALE_MAX);
  const height = shown * unit;
  const base = Math.min(count, JOURNAL_DAILY_GOAL) * unit;
  const bonus = Math.max(0, shown - JOURNAL_DAILY_GOAL) * unit;
  const met = count >= JOURNAL_DAILY_GOAL;
  const capped = count > CHART_SCALE_MAX;

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
  const corners = {
    borderTopLeftRadius: width / 2,
    borderTopRightRadius: width / 2,
    borderBottomLeftRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  };

  return (
    <View style={[styles.column, { left, width, opacity: dim ? 0.32 : 1 }]}>
      <View
        style={[
          styles.ghost,
          corners,
          { height: PLOT_H, backgroundColor: c.track },
        ]}
      />
      {count > 0 && (
        <View
          style={[styles.clip, corners, { height: Math.max(width, height) }]}
        >
          <Animated.View style={[styles.stack, growStyle]}>
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
                backgroundColor: met ? colors.done : c.textFaint,
              }}
            />
          </Animated.View>
        </View>
      )}
      {capped && (
        <AppText
          variant="micro"
          tone="muted"
          style={[styles.capLabel, { bottom: PLOT_H + 1 }]}
        >
          {`${count}`}
        </AppText>
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
        <View style={[styles.legendLine, { borderColor: color }]} />
      ) : (
        <View style={[styles.swatch, { backgroundColor: color }]} />
      )}
      <AppText variant="caption" tone="muted" style={styles.legendLabel}>
        {label}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Gratitude vs self-praise
// ---------------------------------------------------------------------------

function TypeSplit() {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const { state } = useGratitude();
  const colors = chart[mode];
  const split = useMemo(() => typeSplit(state.gratitudes), [state.gratitudes]);
  const total = Math.max(1, split.gratitude + split.selfPraise);
  const share = split.gratitude / total;
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
      color: colors.done,
      n: split.gratitude,
      icon: 'heart' as const,
    },
    {
      key: 's',
      label: t('journal.input.typeSelfPraise'),
      color: colors.selfPraise,
      n: split.selfPraise,
      icon: 'sparkles' as const,
    },
  ];
  return (
    <Surface style={styles.card}>
      <AppText variant="titleSm">{t('journal.stats.entryTypes')}</AppText>
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
            { backgroundColor: colors.done, borderRightColor: c.surface },
            leftStyle,
          ]}
        />
      </View>
      {rows.map(row => (
        <View key={row.key} style={styles.splitRow}>
          <View style={[styles.swatch, { backgroundColor: row.color }]} />
          <Ionicons
            name={row.icon}
            size={14}
            color={c.textMuted}
            style={styles.splitIcon}
          />
          <AppText variant="body" style={styles.splitLabel}>
            {row.label}
          </AppText>
          <AppText variant="bodyStrong" style={styles.semibold}>
            {`${row.n}`}
          </AppText>
          <AppText variant="label" tone="muted" style={styles.splitShare}>
            {`${Math.round((row.n / total) * 100)} %`}
          </AppText>
        </View>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  semibold: {
    fontFamily: fonts.semibold,
  },
  centerText: {
    textAlign: 'center',
  },
  overline: {
    marginTop: space.sm,
  },
  title: {
    marginTop: space.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xxl,
  },
  heroText: {
    marginLeft: space.md,
    flex: 1,
  },
  heroNumber: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  unit: {
    marginLeft: space.sm,
    marginBottom: 10,
  },
  tiles: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.md,
  },
  tile: {
    flex: 1,
    padding: space.lg,
  },
  tileLabel: {
    marginTop: space.md,
  },
  card: {
    marginTop: space.lg,
  },
  medals: {
    flexDirection: 'row',
    marginTop: space.lg,
    gap: space.sm,
  },
  medal: {
    flex: 1,
    alignItems: 'center',
  },
  medalDisc: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalCount: {
    marginTop: space.sm,
  },
  motivation: {
    marginTop: space.sm,
  },
  chartHeadline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.md,
  },
  chartHeadlineText: {
    marginLeft: space.sm,
    marginBottom: 8,
    flexShrink: 1,
  },
  tipRow: {
    height: TIP_ROW,
    marginTop: space.md,
  },
  hint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    marginLeft: 6,
  },
  tip: {
    position: 'absolute',
    top: 0,
    height: TIP_ROW - 6,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  tipDate: {
    opacity: 0.75,
  },
  plot: {
    height: PLOT_H + HEADROOM,
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
    marginTop: space.xs,
  },
  axisLabel: {
    position: 'absolute',
    top: 4,
  },
  todayDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: radius.pill,
  },
  todayLabel: {
    position: 'absolute',
    right: 0,
    top: 4,
    fontFamily: fonts.semibold,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLabel: {
    marginLeft: 6,
  },
  legendLine: {
    width: 14,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: radius.xs,
  },
  split: {
    height: 14,
    borderRadius: radius.xs + 1,
    marginTop: space.lg,
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
    marginTop: space.md,
  },
  splitIcon: {
    marginLeft: space.sm,
  },
  splitLabel: {
    marginLeft: 6,
    flex: 1,
  },
  splitShare: {
    width: 52,
    textAlign: 'right',
  },
});
