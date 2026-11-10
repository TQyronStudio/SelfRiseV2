/**
 * Goals screen concept for the Design Lab (premium-design-plan.md, F1, kolo 22).
 *
 * Composition, top to bottom:
 *   1. Title + "+" (new goal) — the level badge sits pinned on the left.
 *   2. OVERVIEW — how many goals are active, how many are on pace, how many are
 *      done; under it the DEADLINES line: today on the left, every goal a dot at
 *      its date, so "what is due when" is one glance.
 *   3. Active goals — each card: value, the track (milestone notches, today's plan
 *      tick), pace in words, and one-tap logging (+1, +50 $, …; "Log a reading"
 *      for a measured goal). Undo instead of a confirm dialog.
 *   4. Completed — quiet rows.
 * Tapping a card slides in its detail (chart vs. plan, history); "⋯" = details /
 * edit / delete; "+" opens the composer with the deadline picker.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Data from useGoalsData; XP, milestones and completion stay in
 *   SQLiteGoalStorage. The completion modal stays ONE modal from ModalQueueContext.
 * - Today's 4 icon buttons per card → "⋯" sheet (same decision as habits, R-4c).
 * - Templates live inside the composer ("Start from an idea") — the separate
 *   "Use Template" button and modal go (R-19). Keep the onboarding target
 *   `add-goal-button` on the "+" button.
 * - Reorder stays the shared ReorderableList (technical-guides:Habits.md).
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  IconBadge,
  LabText,
  PressableScale,
  Rise,
  Surface,
  useLab,
} from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { useIntro } from './introTimeline';
import { ScrollCard, ScrollFrameProvider } from './scrollChoreography';
import { RollingNumber } from './RollingNumber';
import { MOCK_COPY } from './mockCopy';
import { useLabXpAward } from './xpFlight';
import { daysBetween, fmt, LabGoal, paceOf, useLabGoals } from './goalsMock';
import {
  GoalActionsSheet,
  GoalCard,
  goalColor,
  GoalDoneMoment,
  LogSheet,
  shortDate,
  UndoToast,
} from './goalParts';
import { ConfirmSheet, Point, SlidePage, useJournalT } from './journalParts';
import { measureLabPerf } from './labPerf';
import { GoalDetailConcept } from './GoalDetailConcept';
import { GoalComposerConcept } from './GoalComposerConcept';

const SCREEN_PADDING = labSpace.xl;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Toast {
  key: number;
  message: string;
  undo: (() => void) | null;
}

export function GoalsConcept({ bottomInset }: { bottomInset: number }) {
  const { c, lang, crown } = useLab();
  const { timeline } = useIntro();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  const goalsState = useLabGoals();
  const { goals, today } = goalsState;
  const award = useLabXpAward();

  const active = goals.filter(goal => !goal.completedOn);
  const completed = goals.filter(goal => goal.completedOn);
  const paces = active.map(goal => paceOf(goal, today));
  const onPace = paces.filter(
    p => p.state === 'ahead' || p.state === 'onPace'
  ).length;
  const withDeadline = paces.filter(p => p.state !== 'none').length;

  const [logFor, setLogFor] = useState<LabGoal | null>(null);
  const [actionsFor, setActionsFor] = useState<LabGoal | null>(null);
  const [deleting, setDeleting] = useState<LabGoal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [composer, setComposer] = useState<{ editing: LabGoal | null } | null>(
    null
  );
  const [doneId, setDoneId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const trackRefs = useRef(new Map<string, { current: View | null }>());
  const trackRefFor = (id: string) => {
    let ref = trackRefs.current.get(id);
    if (!ref) {
      ref = { current: null };
      trackRefs.current.set(id, ref);
    }
    return ref;
  };

  // Stable callbacks for the rows (kolo 23, Petr: "Goals se trochu seká"): a log on
  // one goal, or XP landing in the badge, re-renders that one card — not all of them.
  const latest = useRef<RowActions | null>(null);
  latest.current = {
    open: goal => {
      selection();
      setDetailId(goal.id);
    },
    more: goal => {
      selection();
      setActionsFor(goal);
    },
    quick: (goal, amount, from) => logProgress(goal, amount, from),
    other: goal => setLogFor(goal),
  };
  const rowActions = useMemo<RowActions>(
    () => ({
      open: goal => latest.current?.open(goal),
      more: goal => latest.current?.more(goal),
      quick: (goal, amount, from) => latest.current?.quick(goal, amount, from),
      other: goal => latest.current?.other(goal),
    }),
    []
  );

  // --- Native-driven scroll (see scrollChoreography.tsx for why) -------------------
  const scrollRef = useRef<ScrollView>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const lastScrollY = useRef(0);
  const listeners = useRef(new Set<(y: number) => void>());
  const [viewportHeight, setViewportHeight] = useState(0);
  const onScroll = useMemo(
    () =>
      RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          lastScrollY.current = e.nativeEvent.contentOffset.y;
          listeners.current.forEach(fn => fn(lastScrollY.current));
        },
      }),
    [scrollY]
  );
  const scrollFrame = useMemo(
    () => ({
      scrollY,
      getScrollY: () => lastScrollY.current,
      subscribe: (fn: (y: number) => void) => {
        listeners.current.add(fn);
        return () => {
          listeners.current.delete(fn);
        };
      },
      viewportHeight,
      bottomInset,
      enabled: crown,
    }),
    [scrollY, viewportHeight, bottomInset, crown]
  );

  // --- Logging ----------------------------------------------------------------------
  const logProgress = (
    goal: LabGoal,
    value: number,
    from: Point | undefined,
    note?: string
  ) => {
    const result = goalsState.log(goal.id, value, note);
    if (!result) return;
    measureLabPerf('goal log');
    if (result.xp > 0) award(result.xp, from);
    const unit = goal.unit[lang];
    const amount =
      goal.kind === 'measure'
        ? `${fmt(value, copy.locale)} ${unit}`
        : `${value > 0 ? '+' : '−'}${fmt(Math.abs(value), copy.locale)} ${unit}`;
    setToast({
      key: Date.now(),
      message:
        result.xp > 0
          ? g.logged(amount)
          : `${g.logged(amount)} · ${g.noXpLeft}`,
      undo: () => {
        const back = goalsState.removeEntry(goal.id, result.entryId);
        if (back > 0) award(-back);
        setToast(null);
      },
    });
    // Milestones light their notch and pay from there (once ever).
    if (result.milestones.length > 0) {
      const highest = Math.max(...result.milestones);
      setTimeout(() => {
        const track = trackRefs.current.get(goal.id)?.current;
        if (!track) return award(result.milestoneXp);
        track.measureInWindow((x, y, w, h) =>
          award(result.milestoneXp, {
            x: x + (w * highest) / 100,
            y: y + h / 2,
          })
        );
        setToast(prev =>
          prev
            ? { ...prev, message: `${prev.message} · ${g.milestone(highest)}` }
            : prev
        );
      }, 650);
    }
    if (result.completed) setTimeout(() => setDoneId(goal.id), 1100);
  };

  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;
  const dateLine = today.toLocaleDateString(copy.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const detailGoal = goals.find(goal => goal.id === detailId) ?? null;
  const doneGoal = goals.find(goal => goal.id === doneId) ?? null;

  return (
    <ScrollFrameProvider value={scrollFrame}>
      <View
        style={{ flex: 1, overflow: 'hidden' }}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setPageSize(prev =>
            prev.width === width && prev.height === height
              ? prev
              : { width, height }
          );
        }}
      >
        <RNAnimated.ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          onLayout={e => {
            const height = e.nativeEvent.layout.height;
            setViewportHeight(prev => (prev === height ? prev : height));
          }}
          contentContainerStyle={[
            contentColumn,
            {
              paddingHorizontal: SCREEN_PADDING,
              paddingBottom: bottomInset + labSpace.xxl,
            },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.topRow}>
            <Rise window={timeline.header}>
              <PressableScale
                onPress={() => setComposer({ editing: null })}
                accessibilityLabel={t('goals.addGoal')}
                pressScale={0.92}
                style={[
                  styles.topButton,
                  { backgroundColor: c.primarySoft, borderColor: c.border },
                ]}
              >
                <Ionicons name="add" size={22} color={c.primary} />
              </PressableScale>
            </Rise>
          </View>
          <Rise window={timeline.header}>
            <LabText variant="overline" tone="muted">
              {dateLine}
            </LabText>
            <LabText variant="display" style={{ marginTop: labSpace.sm }}>
              {t('goals.title')}
            </LabText>
            <LabText
              variant="body"
              tone="muted"
              italic
              style={{ marginTop: 2 }}
            >
              {g.subline}
            </LabText>
          </Rise>

          {/* Overview + deadlines */}
          <ScrollCard variant="hero">
            <Rise window={timeline.hero} scaleFrom={0.97}>
              <Surface style={{ marginTop: labSpace.xxl }}>
                <View style={styles.overview}>
                  <Stat
                    value={active.length}
                    label={t('goals.dashboard.activeGoals')}
                  />
                  <View
                    style={[styles.statDivider, { backgroundColor: c.border }]}
                  />
                  <Stat
                    value={onPace}
                    suffix={`/${withDeadline}`}
                    label={t('goals.dashboard.onTrack')}
                    tone="primary"
                  />
                  <View
                    style={[styles.statDivider, { backgroundColor: c.border }]}
                  />
                  <Stat
                    value={completed.length}
                    label={t('goals.dashboard.completedGoals')}
                  />
                </View>
                <DeadlineLine goals={active} />
              </Surface>
            </Rise>
          </ScrollCard>

          {/* Active goals */}
          <ScrollCard>
            <Rise window={sectionWindow(0)}>
              <View style={styles.sectionTitle}>
                <LabText variant="title" style={{ flex: 1 }}>
                  {t('goals.sections.activeGoals')}
                </LabText>
                <RollingNumber
                  text={`${active.length}`}
                  variant="label"
                  tone="muted"
                />
              </View>
              {active.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  fresh={freshId === goal.id}
                  trackRef={trackRefFor(goal.id)}
                  today={today}
                  actions={rowActions}
                />
              ))}
            </Rise>
          </ScrollCard>

          {/* Completed */}
          {completed.length > 0 && (
            <ScrollCard>
              <Rise window={sectionWindow(1)}>
                <View style={styles.sectionTitle}>
                  <Ionicons
                    name="trophy"
                    size={16}
                    color={c.reward}
                    style={{ marginRight: 6 }}
                  />
                  <LabText variant="title" style={{ flex: 1 }}>
                    {t('goals.sections.completedGoals')}
                  </LabText>
                </View>
                {completed.map(goal => (
                  <PressableScale
                    key={goal.id}
                    pressScale={0.98}
                    accessibilityLabel={goal.title[lang]}
                    onPress={() => setDetailId(goal.id)}
                    style={{ marginTop: labSpace.sm }}
                  >
                    <Surface style={styles.doneRow}>
                      <IconBadge
                        icon={goal.icon as IoniconName}
                        color={goalColor(c, goal)}
                        size={36}
                      />
                      <View style={{ flex: 1, marginLeft: labSpace.md }}>
                        <LabText variant="bodyStrong" numberOfLines={1}>
                          {goal.title[lang]}
                        </LabText>
                        <LabText variant="caption" tone="muted">
                          {`${fmt(goal.target, copy.locale)} ${goal.unit[lang]} · ${shortDate(goal.completedOn ?? today, copy.locale)}`}
                        </LabText>
                      </View>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={c.success}
                      />
                    </Surface>
                  </PressableScale>
                ))}
              </Rise>
            </ScrollCard>
          )}
        </RNAnimated.ScrollView>

        {detailGoal && pageSize.width > 0 && (
          <SlidePage
            key={detailGoal.id}
            width={pageSize.width}
            onClosed={() => setDetailId(null)}
          >
            {close => (
              <GoalDetailConcept
                goal={detailGoal}
                bottomInset={bottomInset}
                onClose={close}
                onLog={() => setLogFor(detailGoal)}
                onEdit={() => setComposer({ editing: detailGoal })}
                onDeleteEntry={entryId => {
                  const back = goalsState.removeEntry(detailGoal.id, entryId);
                  if (back > 0) award(-back);
                }}
              />
            )}
          </SlidePage>
        )}

        {logFor && (
          <LogSheet
            goal={logFor}
            bottomInset={bottomInset}
            onClosed={() => setLogFor(null)}
            onSave={(value, note, from) =>
              logProgress(logFor, value, from, note)
            }
          />
        )}

        {actionsFor && (
          <GoalActionsSheet
            goal={actionsFor}
            bottomInset={bottomInset}
            onClosed={() => setActionsFor(null)}
            onDetail={() => setDetailId(actionsFor.id)}
            onEdit={() => setComposer({ editing: actionsFor })}
            onDelete={() => setDeleting(actionsFor)}
          />
        )}

        {deleting && (
          <ConfirmSheet
            title={t('goals.deleteGoal')}
            message={t('goals.deleteMessage')}
            confirm={t('common.delete')}
            icon="trash-outline"
            bottomInset={bottomInset}
            onClosed={() => setDeleting(null)}
            onConfirm={() => {
              // XP earned by the goal stays (technical-guides:Goals.md).
              if (detailId === deleting.id) setDetailId(null);
              goalsState.remove(deleting.id);
            }}
          />
        )}

        {composer && (
          <GoalComposerConcept
            editing={composer.editing}
            bottomInset={bottomInset}
            onClose={() => setComposer(null)}
            onSave={(input, editingId) => {
              setComposer(null);
              if (editingId) {
                goalsState.update(editingId, input);
                setFreshId(null);
                setTimeout(() => setFreshId(editingId), 0);
              } else {
                const id = goalsState.create(input);
                setFreshId(id);
              }
            }}
          />
        )}

        {toast && (
          <UndoToast
            key={toast.key}
            message={toast.message}
            bottomInset={bottomInset}
            onUndo={toast.undo}
            onGone={() => setToast(null)}
          />
        )}

        {doneGoal && (
          <GoalDoneMoment goal={doneGoal} onClosed={() => setDoneId(null)} />
        )}
      </View>
    </ScrollFrameProvider>
  );
}

interface RowActions {
  open: (goal: LabGoal) => void;
  more: (goal: LabGoal) => void;
  quick: (goal: LabGoal, amount: number, from: Point | undefined) => void;
  other: (goal: LabGoal) => void;
}

/**
 * One card in the list. Memoised: it re-renders only when its own goal changes.
 * No layout animation on every row (each one makes every commit dearer); only a
 * newly created goal slides in.
 */
const GoalRow = React.memo(function GoalRow({
  goal,
  fresh,
  trackRef,
  today,
  actions,
}: {
  goal: LabGoal;
  fresh: boolean;
  trackRef: { current: View | null };
  today: Date;
  actions: RowActions;
}) {
  return (
    <Animated.View
      {...(fresh ? { entering: FadeInDown.duration(300) } : null)}
      style={{ marginTop: labSpace.md }}
    >
      <GoalCard
        goal={goal}
        fresh={fresh}
        trackRef={trackRef}
        today={today}
        onOpen={() => actions.open(goal)}
        onMore={() => actions.more(goal)}
        onQuick={(amount, from) => actions.quick(goal, amount, from)}
        onOther={() => actions.other(goal)}
      />
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function Stat({
  value,
  suffix,
  label,
  tone = 'text',
}: {
  value: number;
  suffix?: string;
  label: string;
  tone?: 'text' | 'primary';
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValue}>
        <RollingNumber text={`${value}`} variant="number" tone={tone} />
        {suffix && (
          <LabText variant="title" tone="faint" style={{ marginBottom: 4 }}>
            {suffix}
          </LabText>
        )}
      </View>
      <LabText
        variant="caption"
        tone="muted"
        numberOfLines={2}
        style={{ textAlign: 'center' }}
      >
        {label}
      </LabText>
    </View>
  );
}

const LANE_H = 30;

/**
 * Today on the left, the farthest deadline on the right; every goal with a date is
 * a dot in its colour with its icon. Dots that would touch go to a second lane.
 */
function DeadlineLine({ goals }: { goals: LabGoal[] }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const t = useJournalT();
  const { today } = useLabGoals();
  const [width, setWidth] = useState(0);
  const dated = goals
    .filter((goal): goal is LabGoal & { targetDate: Date } => !!goal.targetDate)
    .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  if (dated.length === 0) {
    return null;
  }
  const last = dated[dated.length - 1]!.targetDate;
  const span = Math.max(30, daysBetween(today, last));
  const xOf = (d: Date) =>
    (Math.max(0, daysBetween(today, d)) / span) * Math.max(1, width - 28) + 14;
  const lanes: number[] = [];
  const placed = dated.map(goal => {
    const x = xOf(goal.targetDate);
    let lane = lanes.findIndex(end => x - end > 30);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(x);
    } else {
      lanes[lane] = x;
    }
    return { goal, x, lane };
  });
  const next = dated[0]!;
  const months = Array.from(
    { length: 8 },
    (_, i) => new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
  ).filter(d => d <= last);

  return (
    <View style={{ marginTop: labSpace.xl }}>
      <LabText variant="overline" tone="muted">
        {t('goals.dashboard.deadlines')}
      </LabText>
      <View
        style={{
          height: LANE_H * Math.max(1, lanes.length) + 26,
          marginTop: labSpace.md,
        }}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <>
            <View
              style={[
                styles.lineAxis,
                { backgroundColor: c.border, top: LANE_H * lanes.length + 2 },
              ]}
            />
            {months.map(m => (
              <View
                key={m.getTime()}
                style={[
                  styles.monthTick,
                  { left: xOf(m), top: LANE_H * lanes.length - 2 },
                ]}
              >
                <View
                  style={[styles.monthTickMark, { backgroundColor: c.border }]}
                />
                <LabText
                  variant="caption"
                  tone="faint"
                  style={styles.monthLabel}
                >
                  {m.toLocaleDateString(copy.locale, { month: 'short' })}
                </LabText>
              </View>
            ))}
            <View
              style={[
                styles.todayMark,
                {
                  left: 14 - 5,
                  top: LANE_H * lanes.length - 3,
                  backgroundColor: c.primary,
                },
              ]}
            />
            {placed.map(({ goal, x, lane }) => (
              <View
                key={goal.id}
                style={[
                  styles.deadlineDot,
                  {
                    left: x - 13,
                    top: LANE_H * (lanes.length - 1 - lane),
                    backgroundColor: goalColor(c, goal),
                    borderColor: c.surface,
                  },
                ]}
                accessible
                accessibilityLabel={`${goal.title[lang]} · ${shortDate(goal.targetDate, copy.locale)}`}
              >
                <Ionicons
                  name={goal.icon as IoniconName}
                  size={13}
                  color="#FFFFFF"
                />
              </View>
            ))}
          </>
        )}
      </View>
      <LabText variant="label" style={{ marginTop: labSpace.xs }}>
        {copy.goals.nextDeadline(
          next.title[lang],
          daysBetween(today, next.targetDate)
        )}
      </LabText>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    height: 48,
    marginTop: labSpace.sm,
    marginBottom: labSpace.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: labSpace.sm,
  },
  lineAxis: {
    position: 'absolute',
    left: 14,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  monthTick: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
    marginLeft: -20,
  },
  monthTickMark: {
    width: 1,
    height: 10,
  },
  monthLabel: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  todayMark: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deadlineDot: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xxl,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: labSpace.md,
    paddingLeft: labSpace.lg,
    borderRadius: labRadius.md + 4,
  },
});
