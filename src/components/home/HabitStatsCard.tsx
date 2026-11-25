/**
 * Home: habit statistics as ONE card with three periods (migration E11d, from
 * the Design Lab's HabitStatsConcept, kolo 41). Replaces HabitStatsDashboard and
 * its three charts (WeeklyHabitChart, Monthly30DayChart, YearlyHabitOverview).
 *
 * What the user reads:
 * - the headline: the period's rate and one sentence of what it means — better
 *   or lower than the period before (a chart without a "so what" is decoration);
 * - 7 and 30 days as bars: the plan stands behind as a quiet column, what was
 *   done fills it, bonuses sit on top in gold; a missed day is a column left
 *   unfilled — no red;
 * - the year as a calendar of shades (one Skia canvas);
 * - a tap on a day says its numbers under the chart.
 *
 * The numbers: each day is counted exactly as the old charts did (countDay in
 * homeChartsLogic.ts — Smart Bonus Conversion, make-ups, covered days); the rate
 * is the app's formula (all completions incl. bonuses / planned). Today's bar
 * follows a check at once (it is built from the live completions). The year is
 * counted only when it is chosen (365 days × habits), and is the last 365 days
 * at most — the old view took the whole history (data map E11).
 * Hidden until there is a planned day in the last 30 days (decision E11/2c).
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { chart, fonts, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { DateString } from '@/src/types/common';
import { Habit } from '@/src/types/habit';
import { parseDate, today as todayString } from '@/src/utils/date';
import {
  activeDays,
  barScale,
  bestWeekday,
  compareRates,
  comparable,
  countDay,
  DayStat,
  heatLevel,
  lastDays,
  totalsOf,
} from '@/src/screens/home/homeChartsLogic';
import { AppText, Divider, Surface, typeStyle } from '@/src/components/ui';
import { yearWindow } from './yearlyOverviewLogic';

type Period = 'week' | 'month' | 'year';
const PERIODS: Period[] = ['week', 'month', 'year'];
const LENGTH = { week: 7, month: 30 } as const;

const PLOT_HEIGHT = 104;
const BAR_RADIUS = 4;
/** Surface showing between a bar's stacked parts. */
const PART_GAP = 2;
const HEAT_GAP = 2;

type Day = DayStat & { weekday: number; date: DateString };

/** Counts the given dates with the old charts' rule. */
function useDays(dates: DateString[] | null): Day[] {
  const { habits, getHabitsByDate, getRelevantDatesForHabit } = useHabitsData();
  return useMemo(() => {
    if (!dates) return [];
    const existedOn = (habit: Habit, date: DateString) =>
      getRelevantDatesForHabit(habit, [date]).length > 0;
    return dates.map(date => ({
      ...countDay(date, habits, getHabitsByDate(date), existedOn),
      date,
    }));
    // getRelevantDatesForHabit is a plain function rebuilt every render; it
    // depends only on the habit, which `habits` covers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, habits, getHabitsByDate]);
}

export function HabitStatsCard() {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const { getDataDateRange } = useHabitsData();
  const colors = chart[mode];
  const locale = t('common.locale');
  const today = todayString();
  const [period, setPeriod] = useState<Period>('week');
  /** Index into the period's days; null = the last day (today). */
  const [picked, setPicked] = useState<number | null>(null);

  // 60 days cover the week and the month, each with the period before it.
  const recentDates = useMemo(() => lastDays(today, 2 * LENGTH.month), [today]);
  const recent = useDays(recentDates);
  // The year only when it is chosen: the data range, at most its last 365
  // days (yearWindow). The range is rebuilt each render — keyed by its ends.
  const range = getDataDateRange();
  const rangeKey = `${range[0] ?? ''}|${range.length}`;
  const yearDates = useMemo(
    () => (period === 'year' ? yearWindow(range) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period, rangeKey]
  );
  const year = useDays(yearDates);

  const month = recent.slice(-LENGTH.month);
  if (!month.some(d => d.scheduled > 0)) return null;

  const days =
    period === 'year' ? year : recent.slice(-LENGTH[period]);
  const totals = totalsOf(days);
  // Against the period before — only when that one lies wholly in the data.
  const previous =
    period === 'year'
      ? []
      : recent.slice(-2 * LENGTH[period], -LENGTH[period]);
  const change =
    period === 'year' || !comparable(previous[0]?.date, range[0])
      ? null
      : compareRates(totals.rate, totalsOf(previous).rate);
  const best = bestWeekday(days);
  const weekdayName = (weekday: number, form: 'long' | 'short' | 'narrow') =>
    // 2024-01-01 was a Monday.
    new Date(2024, 0, 1 + weekday).toLocaleDateString(locale, {
      weekday: form,
    });
  const periodLabel = (p: Period) =>
    p === 'year'
      ? t('home.stats.periodYear')
      : t('home.stats.periodDays', { count: LENGTH[p] });

  const headline = (() => {
    if (period === 'year')
      return t('home.stats.activeDays', {
        active: activeDays(days),
        count: days.length,
      });
    if (!change)
      return t('home.stats.ofPlanned', {
        done: totals.done + totals.bonus,
        planned: totals.scheduled,
      });
    const week = period === 'week';
    if (change.trend === 'same')
      return week
        ? t('home.stats.sameAsWeek')
        : t('home.stats.sameAsDays', { days: LENGTH.month });
    const key = change.trend === 'up' ? 'better' : 'lower';
    return week
      ? t(`home.stats.${key}ThanWeek`, { count: change.points })
      : t(`home.stats.${key}ThanDays`, {
          count: change.points,
          days: LENGTH.month,
        });
  })();

  const choose = (next: Period) => {
    if (next === period) return;
    feel('tap');
    setPeriod(next);
    setPicked(null);
  };

  const summary = `${t('home.stats.title')}, ${periodLabel(period)}: ${
    totals.rate ?? 0
  } %. ${t('home.stats.completed')} ${t('home.stats.ofPlanned', {
    done: totals.done,
    planned: totals.scheduled,
  })}. ${t('home.stats.bonusCount', { count: totals.bonus })}.`;

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <AppText variant="titleSm" style={styles.flex}>
          {t('home.stats.title')}
        </AppText>
        <View style={[styles.switch, { backgroundColor: c.surfaceRaised }]}>
          {PERIODS.map(option => {
            const active = option === period;
            return (
              <Pressable
                key={option}
                onPress={() => choose(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={periodLabel(option)}
                hitSlop={6}
                style={[
                  styles.switchOption,
                  active && { backgroundColor: c.primarySoft },
                ]}
              >
                <AppText
                  variant="caption"
                  tone={active ? 'primary' : 'muted'}
                  style={active ? styles.semibold : null}
                >
                  {periodLabel(option)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* The headline: the number, and what it means. */}
      <View style={styles.headline}>
        <AppText variant="number">{`${totals.rate ?? 0} %`}</AppText>
        <AppText
          variant="label"
          tone="muted"
          style={styles.headlineNote}
          numberOfLines={2}
        >
          {headline}
        </AppText>
      </View>

      <View accessible accessibilityLabel={summary}>
        {period === 'year' ? (
          <YearHeat days={days} ramp={colors.ramp} locale={locale} />
        ) : (
          <Bars
            days={days}
            dense={period === 'month'}
            picked={picked ?? days.length - 1}
            onPick={index => {
              feel('tap');
              setPicked(index);
            }}
            doneColor={colors.done}
            bonusColor={colors.bonus}
            locale={locale}
            weekdayName={weekdayName}
          />
        )}
      </View>

      {/* Two series → a legend; the names wear text colours, the swatch the series. */}
      {period === 'year' ? (
        <View style={styles.legend}>
          <AppText variant="caption" tone="muted">
            {t('home.stats.less')}
          </AppText>
          <View style={[styles.swatch, { backgroundColor: c.track }]} />
          {colors.ramp.map(color => (
            <View
              key={color}
              style={[styles.swatch, { backgroundColor: color }]}
            />
          ))}
          <AppText variant="caption" tone="muted">
            {t('home.stats.more')}
          </AppText>
        </View>
      ) : (
        <View style={styles.legend}>
          <Key color={colors.done} label={t('home.stats.completed')} />
          <Key color={colors.bonus} label={t('habits.bonus')} />
          <Key color={c.track} label={t('habits.dayStatus.planned')} />
        </View>
      )}

      <Divider style={styles.divider} />
      <View style={styles.facts}>
        <Fact
          label={t('home.stats.completed')}
          value={t('home.stats.ofPlanned', {
            done: totals.done,
            planned: totals.scheduled,
          })}
        />
        <Fact label={t('habits.bonus')} value={`${totals.bonus}`} />
        <Fact
          label={t('home.habitStats.bestDay')}
          value={best === null ? '–' : weekdayName(best, 'short')}
        />
      </View>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// 7 and 30 days — bars
// ---------------------------------------------------------------------------

function Bars({
  days,
  dense,
  picked,
  onPick,
  doneColor,
  bonusColor,
  locale,
  weekdayName,
}: {
  days: Day[];
  /** 30 days: thin bars, a label only now and then. */
  dense: boolean;
  picked: number;
  onPick: (index: number) => void;
  doneColor: string;
  bonusColor: string;
  locale: string;
  weekdayName: (weekday: number, form: 'long' | 'short' | 'narrow') => string;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const scale = barScale(days);
  const unit = PLOT_HEIGHT / scale;
  const last = days.length - 1;
  const day = days[picked] ?? days[last];
  const dayLabel = (d: Day) =>
    parseDate(d.date).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });

  return (
    <View>
      <View style={[styles.plot, { gap: dense ? 2 : space.sm }]}>
        {days.map((d, i) => {
          const doneHeight = d.done * unit;
          const bonusHeight = d.bonus > 0 ? d.bonus * unit - PART_GAP : 0;
          return (
            <Pressable
              key={d.date}
              onPress={() => onPick(i)}
              style={styles.column}
              accessibilityLabel={`${dayLabel(d)}: ${t('home.stats.ofPlanned', {
                done: d.done,
                planned: d.scheduled,
              })}`}
            >
              <View style={[styles.bar, !dense && styles.barWide]}>
                {/* What was planned stands behind, from the baseline. */}
                <View
                  style={[
                    styles.planned,
                    styles.top,
                    { height: d.scheduled * unit, backgroundColor: c.track },
                  ]}
                />
                {bonusHeight > 0 && (
                  <View
                    style={[
                      styles.top,
                      {
                        height: bonusHeight,
                        marginBottom: PART_GAP,
                        backgroundColor: bonusColor,
                      },
                    ]}
                  />
                )}
                {doneHeight > 0 && (
                  <View
                    style={[
                      bonusHeight > 0 ? null : styles.top,
                      { height: doneHeight, backgroundColor: doneColor },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* The baseline, then the labels: every day for a week, weekly for 30. */}
      <View style={[styles.baseline, { backgroundColor: c.border }]} />
      <View style={[styles.axis, { gap: dense ? 2 : space.sm }]}>
        {days.map((d, i) => {
          const labelled = dense ? (last - i) % 7 === 0 : true;
          const chosen = i === picked;
          return (
            <View key={d.date} style={styles.axisCell}>
              {(labelled || chosen) && (
                <Text
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                  style={[
                    typeStyle('caption', chosen ? c.text : c.textFaint),
                    styles.axisLabel,
                    chosen && styles.semibold,
                  ]}
                >
                  {dense
                    ? parseDate(d.date).getDate()
                    : weekdayName(d.weekday, 'narrow')}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* The tapped day, in words. */}
      {day && (
        <View style={[styles.detail, { backgroundColor: c.surfaceRaised }]}>
          <AppText variant="label" style={styles.flex} numberOfLines={1}>
            {picked === last
              ? t('common.dates.today')
              : `${weekdayName(day.weekday, 'long')} ${dayLabel(day)}`}
          </AppText>
          <AppText variant="numberSm">
            {day.scheduled === 0 && day.bonus === 0
              ? t('home.stats.restDay')
              : `${t('home.stats.ofPlanned', {
                  done: day.done,
                  planned: day.scheduled,
                })}${
                  day.bonus > 0
                    ? ` · ${t('home.stats.bonusCount', { count: day.bonus })}`
                    : ''
                }`}
          </AppText>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// The year — a calendar of shades, one canvas
// ---------------------------------------------------------------------------

function YearHeat({
  days,
  ramp,
  locale,
}: {
  days: Day[];
  ramp: readonly string[];
  locale: string;
}) {
  const { c } = useDesign();
  const [width, setWidth] = useState(0);

  // Columns are weeks (Monday on top); the first column starts mid-week.
  const lead = days[0]?.weekday ?? 0;
  const columns = Math.max(1, Math.ceil((lead + days.length) / 7));
  // A short year (new user) does not stretch into giant squares.
  const cell =
    width > 0
      ? Math.min(
          14,
          Math.floor((width - (columns - 1) * HEAT_GAP) / columns)
        )
      : 0;
  const step = cell + HEAT_GAP;
  const height = cell * 7 + HEAT_GAP * 6;

  // A month's name sits over the column in which its first day falls.
  const months = useMemo(() => {
    const labels: { column: number; name: string }[] = [];
    days.forEach((d, i) => {
      const date = parseDate(d.date);
      if (date.getDate() !== 1) return;
      const column = Math.floor((lead + i) / 7);
      const previous = labels[labels.length - 1];
      // Skip a label that would run into the one before it.
      if (previous && column - previous.column < 4) return;
      labels.push({
        column,
        name: date.toLocaleDateString(locale, { month: 'short' }),
      });
    });
    return labels;
  }, [days, lead, locale]);

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.months}>
        {cell > 0 &&
          months.map(m => (
            <Text
              key={`${m.column}-${m.name}`}
              maxFontSizeMultiplier={1.1}
              numberOfLines={1}
              style={[
                typeStyle('caption', c.textFaint),
                styles.month,
                { left: m.column * step },
              ]}
            >
              {m.name}
            </Text>
          ))}
      </View>
      {cell > 0 && (
        <Canvas style={{ width, height }} pointerEvents="none">
          {days.map((d, i) => {
            const slot = lead + i;
            const level = heatLevel(d);
            return (
              <RoundedRect
                key={d.date}
                x={Math.floor(slot / 7) * step}
                y={(slot % 7) * step}
                width={cell}
                height={cell}
                r={Math.min(2, cell / 3)}
                color={level > 0 ? ramp[level - 1]! : c.track}
                // A rest day is fainter than a planned day left empty.
                opacity={level === -1 ? 0.45 : 1}
              />
            );
          })}
        </Canvas>
      )}
    </View>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.key}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="numberSm" numberOfLines={1} style={styles.factValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.lg,
  },
  flex: {
    flex: 1,
  },
  semibold: {
    fontFamily: fonts.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: radius.pill,
  },
  switchOption: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.md,
    marginBottom: space.lg,
  },
  headlineNote: {
    flex: 1,
    marginLeft: space.md,
    marginBottom: 6,
  },
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    height: PLOT_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  barWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 28,
  },
  top: {
    borderTopLeftRadius: BAR_RADIUS,
    borderTopRightRadius: BAR_RADIUS,
  },
  planned: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  baseline: {
    height: StyleSheet.hairlineWidth,
  },
  axis: {
    flexDirection: 'row',
    marginTop: space.xs,
    height: 16,
  },
  axisCell: {
    flex: 1,
    alignItems: 'center',
  },
  // Wider than its thin bar, so a two-digit day number is never cut.
  axisLabel: {
    position: 'absolute',
    width: 28,
    textAlign: 'center',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  months: {
    height: 18,
  },
  month: {
    position: 'absolute',
    top: 0,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  key: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: space.sm,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: radius.xs,
  },
  divider: {
    marginTop: space.md,
  },
  facts: {
    flexDirection: 'row',
    marginTop: space.md,
  },
  factValue: {
    marginTop: 2,
  },
});
