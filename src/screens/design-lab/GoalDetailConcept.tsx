/**
 * One goal in detail (kolo 22) — replaces today's three tabs (Overview, Trends,
 * Predictions with five methods) by one page that answers three questions:
 *   1. Where am I?           — the ring, the value, pace in words.
 *   2. Will I make it?       — "You vs. the plan": your line against the straight
 *                              line from start to deadline, and where your pace
 *                              lands (dotted). Slide a finger along it to read it.
 *   3. What happened?        — milestones with the day they were reached, and
 *                              every log (delete = undo).
 *
 * Chart rules (dataviz skill): one series in the goal's colour (contrast ≥ 3:1 on
 * both surfaces, checked with the palette script), the plan as a dashed neutral
 * reference line, a legend for the two lines, labels in text colours.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces app/goal-stats.tsx (GoalStatsCard, ProgressTrendAnalysis,
 *   GoalCompletionPredictions). Pace from one function in src/utils/
 *   goalCalculations.ts (next to calculateTimelineStatus) — one source of truth.
 * - Deleting a log keeps today's rules (XP back, completion reversed < 100 %,
 *   milestones stay paid) — technical-guides:Goals.md.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { selection } from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import { LabText, PressableScale, Surface, useLab } from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { RollingNumber } from './RollingNumber';
import {
  currentValue,
  fmt,
  fractionOf,
  GoalEntry,
  LabGoal,
  MILESTONES,
  milestoneXp,
  completionXp,
  paceOf,
  useLabGoals,
} from './goalsMock';
import { goalColor, PaceChip, shortDate } from './goalParts';
import {
  ConfirmSheet,
  formatDay,
  PageTopBar,
  useJournalT,
} from './journalParts';
import { dateKey } from './habitsMock';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

/** The goal's value after each log, starting at the start value. */
function seriesOf(goal: LabGoal): { date: Date; value: number }[] {
  const points = [{ date: goal.startDate, value: goal.start }];
  let running = goal.start;
  goal.entries.forEach(e => {
    running =
      goal.kind === 'measure' ? e.value : Math.max(0, running + e.value);
    points.push({ date: parseKey(e.date), value: running });
  });
  return points;
}

export function GoalDetailConcept({
  goal,
  bottomInset,
  onClose,
  onLog,
  onEdit,
  onDeleteEntry,
}: {
  goal: LabGoal;
  bottomInset: number;
  onClose: () => void;
  onLog: () => void;
  onEdit: () => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  const { today } = useLabGoals();
  const color = goalColor(c, goal);
  const pace = paceOf(goal, today);
  const value = currentValue(goal);
  const unit = goal.unit[lang];
  const fraction = fractionOf(goal);
  const done = pace.state === 'done';
  const [deleting, setDeleting] = useState<GoalEntry | null>(null);

  const facts: { icon: IoniconName; text: string }[] = [];
  if (pace.daysLeft !== null)
    facts.push({ icon: 'calendar-outline', text: g.daysLeft(pace.daysLeft) });
  if (pace.neededPerWeek !== null)
    facts.push({
      icon: 'flag-outline',
      text: g.neededPerWeek(`${fmt(pace.neededPerWeek, copy.locale)} ${unit}`),
    });
  if (!done)
    facts.push({
      icon: 'speedometer-outline',
      text: g.yourPerWeek(`${fmt(pace.yourPerWeek, copy.locale)} ${unit}`),
    });
  if (pace.projected)
    facts.push({
      icon: 'flag',
      text: g.finish(shortDate(pace.projected, copy.locale)),
    });

  const history = [...goal.entries].reverse();

  return (
    <View style={{ flex: 1 }}>
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
        <View style={styles.overlineRow}>
          <Ionicons name={goal.icon as IoniconName} size={14} color={color} />
          <LabText variant="overline" tone="muted" style={{ marginLeft: 6 }}>
            {t(`goals.category.${goal.category}`)}
          </LabText>
        </View>
        <LabText variant="display" style={{ marginTop: labSpace.sm }}>
          {goal.title[lang]}
        </LabText>

        {/* Where am I */}
        <Surface style={[styles.hero, { marginTop: labSpace.xl }]}>
          <Ring fraction={fraction} color={color} />
          <View style={{ flex: 1, marginLeft: labSpace.lg }}>
            <View style={styles.valueRow}>
              <RollingNumber text={fmt(value, copy.locale)} variant="number" />
              <LabText
                variant="label"
                tone="muted"
                style={{ marginLeft: 6, marginBottom: 6 }}
              >
                {unit}
              </LabText>
            </View>
            <LabText variant="caption" tone="muted">
              {goal.kind === 'measure'
                ? `${fmt(goal.start, copy.locale)} → ${fmt(goal.target, copy.locale)} ${unit}`
                : `${t('goals.detailsCard.target')}: ${fmt(goal.target, copy.locale)} ${unit}`}
            </LabText>
            <View style={{ marginTop: labSpace.sm, alignSelf: 'flex-start' }}>
              <PaceChip pace={pace} />
            </View>
          </View>
        </Surface>
        {facts.length > 0 && (
          <View style={styles.facts}>
            {facts.map(f => (
              <View key={f.text} style={styles.fact}>
                <Ionicons name={f.icon} size={15} color={c.textMuted} />
                <LabText
                  variant="label"
                  style={{ marginLeft: labSpace.sm, flex: 1 }}
                >
                  {f.text}
                </LabText>
              </View>
            ))}
          </View>
        )}

        {!done && (
          <PressableScale
            onPress={onLog}
            accessibilityLabel={t('goals.progress.addProgress')}
            style={styles.logButton}
          >
            <LinearGradient
              colors={c.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: labRadius.pill },
              ]}
            />
            <Ionicons
              name="add"
              size={18}
              color={c.onPrimary}
              style={{ marginRight: 6 }}
            />
            <LabText variant="bodyStrong" tone="onPrimary">
              {goal.kind === 'measure'
                ? g.logReading
                : t('goals.progress.addProgress')}
            </LabText>
          </PressableScale>
        )}

        {/* Will I make it */}
        <PlanChart goal={goal} />

        {/* Milestones */}
        <Surface style={{ marginTop: labSpace.lg }}>
          <LabText variant="titleSm">{g.milestones}</LabText>
          <Milestones goal={goal} />
        </Surface>

        {/* History */}
        <Surface style={{ marginTop: labSpace.lg }}>
          <LabText variant="titleSm">
            {t('goals.progress.progressHistory')}
          </LabText>
          {history.length === 0 ? (
            <LabText
              variant="body"
              tone="muted"
              italic
              style={{ marginTop: labSpace.md }}
            >
              {t('goals.progress.noProgress')}
            </LabText>
          ) : (
            history.map((entry, i) => {
              const prevReading =
                goal.kind === 'measure'
                  ? (history[i + 1]?.value ?? goal.start)
                  : null;
              const main =
                goal.kind === 'measure'
                  ? `${fmt(entry.value, copy.locale)} ${unit}`
                  : `${entry.value >= 0 ? '+' : '−'}${fmt(Math.abs(entry.value), copy.locale)} ${unit}`;
              const sub =
                prevReading !== null
                  ? `${entry.value - prevReading <= 0 ? '−' : '+'}${fmt(Math.abs(entry.value - prevReading), copy.locale)} ${unit}`
                  : null;
              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(160)}
                  layout={LinearTransition.duration(220)}
                  style={[styles.historyRow, { borderColor: c.border }]}
                >
                  <View
                    style={[styles.historyDot, { backgroundColor: color }]}
                  />
                  <View style={{ flex: 1, marginLeft: labSpace.md }}>
                    <LabText variant="bodyStrong">{main}</LabText>
                    <LabText variant="caption" tone="muted" numberOfLines={2}>
                      {[formatDay(entry.date, copy.locale), sub, entry.note]
                        .filter(Boolean)
                        .join(' · ')}
                    </LabText>
                  </View>
                  {entry.xp > 0 && (
                    <LabText
                      variant="caption"
                      tone="reward"
                      style={{ fontFamily: labFonts.semibold }}
                    >
                      {`+${entry.xp} XP`}
                    </LabText>
                  )}
                  <PressableScale
                    onPress={() => {
                      selection();
                      setDeleting(entry);
                    }}
                    haptic={null}
                    pressScale={0.85}
                    accessibilityLabel={t('common.delete')}
                    style={styles.historyDelete}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={c.textFaint}
                    />
                  </PressableScale>
                </Animated.View>
              );
            })
          )}
        </Surface>

        <PressableScale
          onPress={onEdit}
          accessibilityLabel={t('goals.editGoal')}
          style={[styles.editButton, { backgroundColor: c.track }]}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={c.text}
            style={{ marginRight: 6 }}
          />
          <LabText variant="bodyStrong">{t('goals.editGoal')}</LabText>
        </PressableScale>
      </ScrollView>

      {deleting && (
        <ConfirmSheet
          title={t('goals.progress.confirmDelete')}
          message={t('goals.progress.deleteMessage')}
          confirm={t('common.delete')}
          icon="trash-outline"
          bottomInset={bottomInset}
          onClosed={() => setDeleting(null)}
          onConfirm={() => onDeleteEntry(deleting.id)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ring
// ---------------------------------------------------------------------------

const RING = 112;
const STROKE = 11;

export function Ring({ fraction, color }: { fraction: number; color: string }) {
  const { c } = useLab();
  const end = useSharedValue(0);
  useEffect(() => {
    end.value = withDelay(
      200,
      withTiming(Math.min(1, fraction), {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [fraction, end]);
  const arc = useMemo(() => {
    const p = Skia.Path.Make();
    const inset = STROKE / 2 + 1;
    p.addArc(
      Skia.XYWHRect(inset, inset, RING - inset * 2, RING - inset * 2),
      -90,
      359.9
    );
    return p;
  }, []);
  return (
    <View style={{ width: RING, height: RING }}>
      <Canvas style={{ width: RING, height: RING }} pointerEvents="none">
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RING / 2 - STROKE / 2 - 1}
          style="stroke"
          strokeWidth={STROKE}
          color={c.track}
        />
        <Path
          path={arc}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color={color}
          start={0}
          end={end}
        />
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>
        <RollingNumber
          text={`${Math.round(fraction * 100)}`}
          variant="number"
          style={{ fontSize: 30, lineHeight: 36 }}
        />
        <LabText variant="caption" tone="muted" style={{ marginTop: -4 }}>
          %
        </LabText>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// You vs. the plan
// ---------------------------------------------------------------------------

const CHART_H = 160;
const PAD_X = 6;
const PAD_Y = 14;

function PlanChart({ goal }: { goal: LabGoal }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  const { today } = useLabGoals();
  const color = goalColor(c, goal);
  const pace = paceOf(goal, today);
  const unit = goal.unit[lang];
  const [width, setWidth] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const last = useRef<number | null>(null);

  const series = useMemo(() => seriesOf(goal), [goal]);
  const startT = goal.startDate.getTime();
  const endDate = [goal.targetDate, pace.projected, today, goal.completedOn]
    .filter((d): d is Date => !!d)
    .reduce((a, b) => (b > a ? b : a), today);
  const endT = Math.max(endDate.getTime(), startT + 86400000);
  const values = [goal.start, goal.target, ...series.map(p => p.value)];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.08 || 1;
  const yLo = lo - (goal.kind === 'measure' ? pad : 0);
  const yHi = hi + pad;
  const plotW = Math.max(1, width - PAD_X * 2);
  const x = (d: Date) =>
    PAD_X + ((d.getTime() - startT) / (endT - startT)) * plotW;
  const y = (v: number) =>
    PAD_Y + (1 - (v - yLo) / (yHi - yLo)) * (CHART_H - PAD_Y * 2);

  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = 0;
    draw.value = withDelay(
      250,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
  }, [draw, width]);

  const paths = useMemo(() => {
    const you = Skia.Path.Make();
    series.forEach((p, i) => {
      const px = x(p.date);
      const py = y(p.value);
      if (i === 0) you.moveTo(px, py);
      else if (goal.kind === 'count') {
        // Steps: a count only changes when something is logged.
        you.lineTo(px, y(series[i - 1]!.value));
        you.lineTo(px, py);
      } else you.lineTo(px, py);
    });
    const current = series[series.length - 1]!;
    if (goal.kind === 'count' && !pace.projected)
      you.lineTo(x(today), y(current.value));
    const plan = Skia.Path.Make();
    if (goal.targetDate) {
      plan.moveTo(x(goal.startDate), y(goal.start));
      plan.lineTo(x(goal.targetDate), y(goal.target));
    }
    const projection = Skia.Path.Make();
    if (pace.projected) {
      projection.moveTo(x(today), y(current.value));
      projection.lineTo(x(pace.projected), y(goal.target));
    }
    const target = Skia.Path.Make();
    target.moveTo(PAD_X, y(goal.target));
    target.lineTo(PAD_X + plotW, y(goal.target));
    return { you, plan, projection, target };
    // x / y depend on width and the goal only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, width, goal, pace.projected, today]);

  const indexAt = (px: number) => {
    let best = 0;
    let bestD = Infinity;
    series.forEach((p, i) => {
      const d = Math.abs(x(p.date) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };
  const choose = (i: number) => {
    if (last.current !== i) selection();
    last.current = i;
    setPick(i);
  };
  const picked = pick === null ? null : (series[pick] ?? null);

  const ticks = [
    goal.startDate,
    today,
    ...(goal.targetDate ? [goal.targetDate] : []),
  ];

  return (
    <Surface style={{ marginTop: labSpace.lg }}>
      <LabText variant="titleSm">{g.paceTitle}</LabText>
      <View style={styles.readout}>
        {picked ? (
          <LabText variant="label" numberOfLines={1}>
            {`${formatDay(dateKey(picked.date), copy.locale)} · ${fmt(picked.value, copy.locale)} ${unit}`}
          </LabText>
        ) : (
          <LabText variant="caption" tone="faint">
            {copy.journal.chartHint}
          </LabText>
        )}
      </View>
      <View
        style={{ height: CHART_H }}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => true}
        onResponderGrant={e => choose(indexAt(e.nativeEvent.locationX))}
        onResponderMove={e => choose(indexAt(e.nativeEvent.locationX))}
        accessibilityLabel={g.paceTitle}
      >
        {width > 0 && (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path
              path={paths.target}
              style="stroke"
              strokeWidth={1}
              color={c.border}
            />
            {goal.targetDate && (
              <Path
                path={paths.plan}
                style="stroke"
                strokeWidth={1.5}
                color={c.textMuted}
              >
                <DashPathEffect intervals={[5, 5]} />
              </Path>
            )}
            {pace.projected && (
              <Path
                path={paths.projection}
                style="stroke"
                strokeWidth={2}
                color={color}
                opacity={0.6}
              >
                <DashPathEffect intervals={[1, 5]} />
              </Path>
            )}
            <Path
              path={paths.you}
              style="stroke"
              strokeWidth={2.5}
              strokeJoin="round"
              strokeCap="round"
              color={color}
              start={0}
              end={draw}
            />
            {/* Today */}
            <Circle
              cx={x(today)}
              cy={y(series[series.length - 1]!.value)}
              r={5}
              color={color}
            />
            <Circle
              cx={x(today)}
              cy={y(series[series.length - 1]!.value)}
              r={8}
              color={color}
              opacity={0.25}
            />
            {picked && (
              <>
                <Path
                  path={(() => {
                    const p = Skia.Path.Make();
                    p.moveTo(x(picked.date), PAD_Y / 2);
                    p.lineTo(x(picked.date), CHART_H - 2);
                    return p;
                  })()}
                  style="stroke"
                  strokeWidth={1}
                  color={c.textFaint}
                />
                <Circle
                  cx={x(picked.date)}
                  cy={y(picked.value)}
                  r={6}
                  color={c.surface}
                />
                <Circle
                  cx={x(picked.date)}
                  cy={y(picked.value)}
                  r={4}
                  color={color}
                />
              </>
            )}
          </Canvas>
        )}
        {width > 0 && (
          <LabText
            variant="caption"
            tone="muted"
            style={[styles.targetLabel, { top: y(goal.target) - 18 }]}
          >
            {`${fmt(goal.target, copy.locale)} ${unit}`}
          </LabText>
        )}
      </View>
      <View style={[styles.axis, { borderColor: c.border }]}>
        {width > 0 &&
          ticks.map((d, i) => (
            <LabText
              key={i}
              variant="caption"
              tone={d === today ? 'primary' : 'faint'}
              style={[
                styles.axisLabel,
                i === 0
                  ? { left: 0 }
                  : i === ticks.length - 1 && d !== today
                    ? { right: 0 }
                    : { left: Math.min(width - 60, Math.max(40, x(d) - 24)) },
              ]}
            >
              {d === today ? t('journal.today') : shortDate(d, copy.locale)}
            </LabText>
          ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: color }]} />
          <LabText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
            {g.you}
          </LabText>
        </View>
        {goal.targetDate && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDash, { borderColor: c.textMuted }]} />
            <LabText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
              {g.plan}
            </LabText>
          </View>
        )}
        {pace.projected && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDots, { borderColor: color }]} />
            <LabText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
              {g.finish(shortDate(pace.projected, copy.locale))}
            </LabText>
          </View>
        )}
      </View>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

function Milestones({ goal }: { goal: LabGoal }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const unit = goal.unit[lang];
  const series = seriesOf(goal);
  const steps = [...MILESTONES, 100];
  return (
    <View style={{ marginTop: labSpace.md }}>
      {steps.map(m => {
        const hit = series.find(p => fractionOf(goal, p.value) * 100 >= m);
        const reached = !!hit;
        const at = goal.start + ((goal.target - goal.start) * m) / 100;
        const xp = m === 100 ? completionXp(goal) : milestoneXp(m);
        return (
          <View key={m} style={styles.milestoneRow}>
            <View
              style={[
                styles.milestoneMark,
                reached
                  ? { backgroundColor: goalColor(c, goal) }
                  : { borderWidth: 1.5, borderColor: c.textFaint },
              ]}
            >
              {reached && (
                <Ionicons
                  name={m === 100 ? 'trophy' : 'checkmark'}
                  size={12}
                  color="#FFFFFF"
                />
              )}
            </View>
            <LabText
              variant="bodyStrong"
              style={{ width: 56, marginLeft: labSpace.md }}
            >
              {`${m} %`}
            </LabText>
            <LabText
              variant="caption"
              tone={reached ? 'muted' : 'faint'}
              style={{ flex: 1 }}
            >
              {reached && hit
                ? copy.goals.reached(shortDate(hit.date, copy.locale))
                : `${fmt(at, copy.locale)} ${unit}`}
            </LabText>
            <LabText
              variant="caption"
              tone={reached ? 'reward' : 'faint'}
              style={{ fontFamily: labFonts.semibold }}
            >
              {`+${xp} XP`}
            </LabText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  facts: {
    marginTop: labSpace.md,
    gap: labSpace.sm,
    paddingHorizontal: labSpace.xs,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButton: {
    flexDirection: 'row',
    height: 50,
    marginTop: labSpace.lg,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  readout: {
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: labSpace.sm,
  },
  targetLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
  },
  axis: {
    height: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  axisLabel: {
    position: 'absolute',
    top: 4,
    fontSize: 11,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.md,
    marginTop: labSpace.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
  },
  legendDash: {
    width: 16,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  legendDots: {
    width: 16,
    borderTopWidth: 2,
    borderStyle: 'dotted',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.sm,
  },
  milestoneMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: labSpace.xs,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDelete: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -labSpace.sm,
    marginLeft: labSpace.xs,
  },
  editButton: {
    flexDirection: 'row',
    height: 48,
    marginTop: labSpace.xl,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
