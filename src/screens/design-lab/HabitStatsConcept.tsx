/**
 * Home's habit statistics as ONE card with three periods (kolo 41, lab debt L-2).
 * Replaces today's three charts under one toggle (WeeklyHabitChart,
 * Monthly30DayChart, YearlyHabitOverview) and the lab's old "This week" card.
 *
 * What the user reads:
 * - the headline: the rate of the period, and one sentence that says what it
 *   means — better or lower than the period before (a chart without a "so what"
 *   is decoration);
 * - 7 and 30 days as bars: what was planned stands behind as a quiet column,
 *   what was done fills it, bonuses sit on top in gold. A missed day is simply a
 *   column left unfilled — no red (lessons 17–20: kind tone, never colour alone);
 * - the year as a calendar of shades, one hue, light → dark;
 * - a tap on a day says its numbers below the chart (the lab's "hover layer").
 *
 * Chart rules (skill `dataviz`, lesson 32): bars grow from the baseline, only the
 * top end is rounded, 2 px of surface between stacked parts, the text never wears
 * the series colour, a legend whenever there are two series. The colours are the
 * chart palette, validated by the skill's script for both surfaces — not the UI
 * gold, which fails as a fill on white.
 *
 * Nothing animates per bar when the card appears (lessons 42, 44).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces src/components/home/{HabitStatsDashboard,WeeklyHabitChart,
 *   Monthly30DayChart,YearlyHabitOverview}.tsx. The per-day counts stay exactly
 *   as those components compute them (Smart Bonus Conversion, covered days);
 *   homeChartsLogic.ts only totals and scales them.
 * - Chart colours go into the tokens as the chart palette (with the journal's).
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import { selection } from '@/src/services/hapticsService';
import {
  activeDays,
  barScale,
  bestWeekday,
  compareRates,
  heatLevel,
  totalsOf,
} from './homeChartsLogic';
import { LabDay, mockYear } from './homeChartsMock';
import { Divider, LabText, typeStyle, useLab } from './labPrimitives';
import { labFonts, LabMode, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';

type Period = 'week' | 'month' | 'year';
const PERIODS: Period[] = ['week', 'month', 'year'];
const LENGTH: Record<Period, number> = { week: 7, month: 30, year: 365 };

const PLOT_HEIGHT = 104;
const BAR_RADIUS = 4;
/** Surface showing between a bar's stacked parts. */
const PART_GAP = 2;

/**
 * The chart palette. Validated with the dataviz skill's validate_palette.js:
 * the two series as a categorical pair, the year's shades as an ordinal ramp —
 * each against its own surface.
 */
function chartColors(mode: LabMode) {
  return mode === 'light'
    ? {
        done: '#0A62D8',
        bonus: '#B97F0E',
        ramp: ['#86AFEF', '#5A92EA', '#2E76E2', '#0A55C2'],
      }
    : {
        done: '#3F86F0',
        bonus: '#BE8A1A',
        // On a dark surface "more" is the lighter end.
        ramp: ['#2F5FAF', '#3F7BDD', '#6EA3F5', '#A9CCFF'],
      };
}

export function HabitStatsCard({
  todayDone,
  todayScheduled,
}: {
  /** Today's live numbers — ticking a habit on Home moves the last bar. */
  todayDone: number;
  todayScheduled: number;
}) {
  const { c, lang, mode } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.homeStats;
  const colors = chartColors(mode);
  const [period, setPeriod] = useState<Period>('week');
  /** Index into the period's days; null = the last day (today). */
  const [picked, setPicked] = useState<number | null>(null);

  const year = useMemo(
    () => mockYear(todayDone, todayScheduled),
    [todayDone, todayScheduled]
  );
  const length = LENGTH[period];
  const days = year.slice(-length);
  const totals = totalsOf(days);
  const change =
    period === 'year'
      ? null
      : compareRates(
          totals.rate,
          totalsOf(year.slice(-2 * length, -length)).rate
        );
  const best = bestWeekday(days);
  const weekdayName = (weekday: number, form: 'long' | 'short') =>
    // 2024-01-01 was a Monday.
    new Date(2024, 0, 1 + weekday).toLocaleDateString(copy.locale, {
      weekday: form,
    });

  const choose = (next: Period) => {
    if (next === period) return;
    selection();
    setPeriod(next);
    setPicked(null);
  };

  const summary = `${text.title}, ${text.periods[period]}: ${
    totals.rate ?? 0
  } %. ${text.completed} ${text.ofPlanned(totals.done, totals.scheduled)}. ${text.bonusCount(totals.bonus)}.`;

  return (
    <View>
      <View style={styles.header}>
        <LabText variant="titleSm" style={{ flex: 1 }}>
          {text.title}
        </LabText>
        <View style={[styles.switch, { backgroundColor: c.surfaceRaised }]}>
          {PERIODS.map(option => {
            const active = option === period;
            return (
              <Pressable
                key={option}
                onPress={() => choose(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={text.periods[option]}
                hitSlop={6}
                style={[
                  styles.switchOption,
                  active && { backgroundColor: c.primarySoft },
                ]}
              >
                <LabText
                  variant="caption"
                  tone={active ? 'primary' : 'muted'}
                  style={active ? { fontFamily: labFonts.semibold } : null}
                >
                  {text.periods[option]}
                </LabText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* The headline: the number, and what it means. */}
      <View style={styles.headline}>
        <LabText variant="number">{`${totals.rate ?? 0} %`}</LabText>
        <LabText
          variant="label"
          tone="muted"
          style={styles.headlineNote}
          numberOfLines={2}
        >
          {period === 'year'
            ? text.activeDays(activeDays(days), days.length)
            : change
              ? text.vsPrevious(change.trend, change.points, period)
              : text.ofPlanned(totals.done + totals.bonus, totals.scheduled)}
        </LabText>
      </View>

      <View accessible accessibilityLabel={summary}>
        {period === 'year' ? (
          <YearHeat days={days} ramp={colors.ramp} />
        ) : (
          <Bars
            days={days}
            dense={period === 'month'}
            picked={picked ?? days.length - 1}
            onPick={index => {
              selection();
              setPicked(index);
            }}
            doneColor={colors.done}
            bonusColor={colors.bonus}
            weekdayName={weekdayName}
          />
        )}
      </View>

      {/* Two series → a legend; the names wear text colours, the swatch the series. */}
      {period === 'year' ? (
        <View style={styles.legend}>
          <LabText variant="caption" tone="muted">
            {text.less}
          </LabText>
          <View style={[styles.swatch, { backgroundColor: c.track }]} />
          {colors.ramp.map(color => (
            <View
              key={color}
              style={[styles.swatch, { backgroundColor: color }]}
            />
          ))}
          <LabText variant="caption" tone="muted">
            {text.more}
          </LabText>
        </View>
      ) : (
        <View style={styles.legend}>
          <Key color={colors.done} label={text.completed} />
          <Key color={colors.bonus} label={text.bonus} />
          <Key color={c.track} label={text.planned} />
        </View>
      )}

      <Divider style={{ marginTop: labSpace.md }} />
      <View style={styles.facts}>
        <Fact
          label={text.completed}
          value={text.ofPlanned(totals.done, totals.scheduled)}
        />
        <Fact label={text.bonus} value={`${totals.bonus}`} />
        <Fact
          label={text.bestDay}
          value={best === null ? '–' : weekdayName(best, 'short')}
        />
      </View>
    </View>
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
  weekdayName,
}: {
  days: LabDay[];
  /** 30 days: thin bars, a label only now and then. */
  dense: boolean;
  picked: number;
  onPick: (index: number) => void;
  doneColor: string;
  bonusColor: string;
  weekdayName: (weekday: number, form: 'long' | 'short') => string;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.homeStats;
  const scale = barScale(days);
  const unit = PLOT_HEIGHT / scale;
  const last = days.length - 1;
  const day = days[picked] ?? days[last]!;

  return (
    <View>
      <View style={[styles.plot, { gap: dense ? 2 : labSpace.sm }]}>
        {days.map((d, i) => {
          const doneHeight = d.done * unit;
          const bonusHeight = d.bonus > 0 ? d.bonus * unit - PART_GAP : 0;
          const top = {
            borderTopLeftRadius: BAR_RADIUS,
            borderTopRightRadius: BAR_RADIUS,
          };
          return (
            <Pressable
              key={i}
              onPress={() => onPick(i)}
              style={styles.column}
              accessibilityLabel={`${d.date.toLocaleDateString(copy.locale, {
                day: 'numeric',
                month: 'short',
              })}: ${text.ofPlanned(d.done, d.scheduled)}`}
            >
              <View style={[styles.bar, !dense && styles.barWide]}>
                {/* What was planned stands behind, from the baseline. */}
                <View
                  style={[
                    styles.planned,
                    top,
                    { height: d.scheduled * unit, backgroundColor: c.track },
                  ]}
                />
                {bonusHeight > 0 && (
                  <View
                    style={[
                      top,
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
                      bonusHeight > 0 ? null : top,
                      { height: doneHeight, backgroundColor: doneColor },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* The baseline, then the day labels: every day for a week, weekly for 30. */}
      <View style={[styles.baseline, { backgroundColor: c.border }]} />
      <View style={[styles.axis, { gap: dense ? 2 : labSpace.sm }]}>
        {days.map((d, i) => {
          const labelled = dense ? (last - i) % 7 === 0 : true;
          const chosen = i === picked;
          return (
            <View key={i} style={styles.axisCell}>
              {(labelled || chosen) && (
                <Text
                  maxFontSizeMultiplier={1.2}
                  numberOfLines={1}
                  style={[
                    typeStyle('caption', chosen ? c.text : c.textFaint),
                    styles.axisLabel,
                    chosen && { fontFamily: labFonts.semibold },
                  ]}
                >
                  {dense ? d.date.getDate() : (copy.weekdays[d.weekday] ?? '')}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* The tapped day, in words. */}
      <View style={[styles.detail, { backgroundColor: c.surfaceRaised }]}>
        <LabText variant="label" style={{ flex: 1 }} numberOfLines={1}>
          {picked === last
            ? text.today
            : `${weekdayName(day.weekday, 'long')} ${day.date.toLocaleDateString(
                copy.locale,
                { day: 'numeric', month: 'short' }
              )}`}
        </LabText>
        <LabText variant="numberSm">
          {day.scheduled === 0 && day.bonus === 0
            ? text.restDay
            : `${text.ofPlanned(day.done, day.scheduled)}${
                day.bonus > 0 ? ` · ${text.bonusCount(day.bonus)}` : ''
              }`}
        </LabText>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// The year — a calendar of shades, one canvas
// ---------------------------------------------------------------------------

const HEAT_GAP = 2;

function YearHeat({ days, ramp }: { days: LabDay[]; ramp: string[] }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const [width, setWidth] = useState(0);

  // Columns are weeks (Monday on top); the first column starts mid-week.
  const lead = days[0]?.weekday ?? 0;
  const columns = Math.ceil((lead + days.length) / 7);
  const cell =
    width > 0 ? Math.floor((width - (columns - 1) * HEAT_GAP) / columns) : 0;
  const step = cell + HEAT_GAP;
  const height = cell * 7 + HEAT_GAP * 6;

  // A month's name sits over the column in which its first day falls.
  const months = useMemo(() => {
    const labels: { column: number; name: string }[] = [];
    days.forEach((d, i) => {
      if (d.date.getDate() !== 1) return;
      const column = Math.floor((lead + i) / 7);
      const previous = labels[labels.length - 1];
      // Skip a label that would run into the one before it.
      if (previous && column - previous.column < 4) return;
      labels.push({
        column,
        name: d.date.toLocaleDateString(copy.locale, { month: 'short' }),
      });
    });
    return labels;
  }, [days, lead, copy.locale]);

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
                key={i}
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
      <LabText variant="caption" tone="muted">
        {label}
      </LabText>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <LabText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </LabText>
      <LabText variant="numberSm" numberOfLines={1} style={{ marginTop: 2 }}>
        {value}
      </LabText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: labRadius.pill,
  },
  switchOption: {
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
  headline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: labSpace.md,
    marginBottom: labSpace.lg,
  },
  headlineNote: {
    flex: 1,
    marginLeft: labSpace.md,
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
    marginTop: labSpace.xs,
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
    marginTop: labSpace.sm,
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.sm,
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
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  key: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: labSpace.sm,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  facts: {
    flexDirection: 'row',
    marginTop: labSpace.md,
  },
  fact: {
    flex: 1,
  },
});
