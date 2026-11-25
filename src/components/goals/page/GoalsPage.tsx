/**
 * Goals in the new look — the page (migration E14, from the Design Lab's
 * GoalsConcept). Top to bottom (technical-guides:Goals.md):
 *   1. the date, the title, a quiet line;
 *   2. OVERVIEW — active / on pace (of those with a deadline) / done, and under it
 *      the DEADLINES line: today on the left, each goal a dot at its date;
 *   3. active goals — GoalCard: value, track (notches, plan tick), pace in words,
 *      one-tap amounts + "Other"; logging shows an Undo note instead of a dialog;
 *   4. completed goals — quiet rows.
 * The data actions (log, undo, delete) are the screen's (GoalsScreen): it keeps
 * the storage's rules and the completion window. This page draws and holds the
 * sheets and the undo note.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated as RNAnimated, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { onHabitColor, radius, space } from '@/src/design/tokens';
import { goalLook } from '@/src/constants/goalLook';
import { AddGoalProgressInput, Goal, GoalStatus, LoggedGoalProgress } from '@/src/types/goal';
import { DateString } from '@/src/types/common';
import { goalDate } from '@/src/utils/goalCalculations';
import { parseDate } from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import {
  AppText,
  IconBadge,
  IntroProvider,
  PressableScale,
  Rise,
  RollingNumber,
  ScrollCard,
  ScrollFrameProvider,
  Surface,
  UndoToast,
  useIntro,
  usePageScrollFrame,
} from '@/src/components/ui';
import {
  deadlineLayout,
  formatGoalNumber,
  loggedAmount,
  LogMode,
  logNoteParts,
  overviewOf,
} from '@/src/screens/goals/goalsPageLogic';
import { GoalCard, GoalCardActions } from './GoalCard';
import { GoalLogSheet } from './GoalLogSheet';
import { GoalActionsSheet } from './GoalActionsSheet';

const SCREEN_PADDING = space.xl;

export interface GoalsPageProps {
  goals: Goal[];
  today: DateString;
  bottomInset: number;
  /** A goal just created or edited: its card glows as it arrives. */
  freshId: string | null;
  /** Logs; resolves with what the storage did, or null when it was not saved. */
  onLog: (goal: Goal, input: AddGoalProgressInput) => Promise<LoggedGoalProgress | null>;
  /** Takes a just-logged entry back (the storage's delete path). */
  onUndo: (progressId: string) => void;
  onOpenDetail: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

interface Toast {
  key: number;
  message: string;
  undo: (() => void) | null;
}

export function GoalsPage(props: GoalsPageProps) {
  return (
    <IntroProvider kind="settle" playKey={0}>
      <GoalsContent {...props} />
    </IntroProvider>
  );
}

function GoalsContent({
  goals,
  today,
  bottomInset,
  freshId,
  onLog,
  onUndo,
  onOpenDetail,
  onEdit,
  onDelete,
}: GoalsPageProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const { timeline } = useIntro();
  const { frame, onScroll, onLayout } = usePageScrollFrame(bottomInset, true);

  const active = useMemo(() => goals.filter(g => g.status === GoalStatus.ACTIVE), [goals]);
  const completed = useMemo(() => goals.filter(g => g.status === GoalStatus.COMPLETED), [goals]);
  const overview = useMemo(() => overviewOf(goals, today), [goals, today]);

  const [logFor, setLogFor] = useState<Goal | null>(null);
  const [actionsFor, setActionsFor] = useState<Goal | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  // One log at a time, in the order tapped: two fast taps are two entries.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const log = (goal: Goal, input: AddGoalProgressInput, mode: LogMode) => {
    queue.current = queue.current.then(async () => {
      const logged = await latest.current.onLog(goal, input);
      if (!logged) return;
      // Only what the storage reports it did (E14c, D-4): the milestone this
      // log paid, or that the goal's XP for today is used up.
      const { noXp, milestone } = logNoteParts(mode, logged);
      const parts = [
        t('goals.log.logged', { amount: loggedAmount(mode, input.value, goal.unit, locale) }),
        ...(milestone !== null ? [t('goals.log.milestone', { percent: milestone })] : []),
        ...(noXp ? [t('goals.log.noXpLeft')] : []),
      ];
      setToast({
        key: Date.now(),
        message: parts.join(' · '),
        undo: () => {
          setToast(null);
          // In the same queue: a log still running must not write the goal's
          // value over the delete's recalculation.
          queue.current = queue.current.then(() => latest.current.onUndo(logged.id));
        },
      });
    });
  };

  // Stable actions for the memoised cards (P42): a log on one goal re-renders
  // that one card, not all of them.
  const latest = useRef({ onLog, onUndo, onOpenDetail, log });
  latest.current = { onLog, onUndo, onOpenDetail, log };
  const cardActions = useMemo<GoalCardActions>(
    () => ({
      open: goal => latest.current.onOpenDetail(goal),
      more: goal => setActionsFor(goal),
      quick: (goal, amount) =>
        latest.current.log(
          goal,
          { goalId: goal.id, value: amount, note: '', date: today, progressType: 'add' },
          'add'
        ),
      other: goal => setLogFor(goal),
    }),
    [today]
  );

  const dateLine = parseDate(today).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ?? timeline.hero;

  return (
    <View style={styles.page}>
      <ScrollFrameProvider value={frame}>
        <RNAnimated.ScrollView
          style={styles.flex}
          onLayout={onLayout}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            contentColumn,
            { paddingHorizontal: SCREEN_PADDING, paddingBottom: bottomInset + space.xxl },
          ]}
        >
          <Rise window={timeline.header}>
            <AppText variant="overline" tone="muted">
              {dateLine}
            </AppText>
            <AppText variant="display" style={styles.title}>
              {t('goals.title')}
            </AppText>
            <AppText variant="body" tone="muted" italic style={styles.subline}>
              {t('goals.subline')}
            </AppText>
          </Rise>

          {goals.length === 0 ? (
            <Rise window={timeline.hero}>
              <Surface style={styles.empty}>
                <Ionicons name="flag-outline" size={28} color={c.primary} />
                <AppText variant="bodyStrong" style={styles.emptyTitle}>
                  {t('goals.noGoals')}
                </AppText>
                <AppText variant="body" tone="muted" style={styles.centered}>
                  {t('goals.noGoalsHint')}
                </AppText>
              </Surface>
            </Rise>
          ) : (
            <>
              {/* Overview + deadlines */}
              <ScrollCard variant="hero">
                <Rise window={timeline.hero} scaleFrom={0.97}>
                  <Surface style={styles.overviewCard}>
                    <View style={styles.overview}>
                      <Stat value={overview.active} label={t('goals.dashboard.activeGoals')} />
                      <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                      <Stat
                        value={overview.onPace}
                        suffix={`/${overview.withDeadline}`}
                        label={t('goals.dashboard.onTrack')}
                        tone="primary"
                      />
                      <View style={[styles.statDivider, { backgroundColor: c.border }]} />
                      <Stat value={overview.completed} label={t('goals.dashboard.completedGoals')} />
                    </View>
                    <DeadlineLine goals={active} today={today} />
                  </Surface>
                </Rise>
              </ScrollCard>

              {/* Active goals */}
              {active.length > 0 && (
                <ScrollCard>
                  <Rise window={sectionWindow(0)}>
                    <View style={styles.sectionTitle}>
                      <AppText variant="title" style={styles.flex}>
                        {t('goals.sections.activeGoals')}
                      </AppText>
                      <RollingNumber text={`${active.length}`} variant="label" tone="muted" rollIn={false} />
                    </View>
                    {active.map(goal => (
                      <Animated.View
                        key={goal.id}
                        {...(freshId === goal.id ? { entering: FadeInDown.duration(300) } : null)}
                        style={styles.cardGap}
                      >
                        <GoalCard goal={goal} today={today} fresh={freshId === goal.id} actions={cardActions} />
                      </Animated.View>
                    ))}
                  </Rise>
                </ScrollCard>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <ScrollCard>
                  <Rise window={sectionWindow(1)}>
                    <View style={styles.sectionTitle}>
                      <Ionicons name="trophy" size={16} color={c.reward} style={styles.trophy} />
                      <AppText variant="title" style={styles.flex}>
                        {t('goals.sections.completedGoals')}
                      </AppText>
                    </View>
                    {completed.map(goal => (
                      <CompletedRow key={goal.id} goal={goal} today={today} onOpen={onOpenDetail} onMore={setActionsFor} />
                    ))}
                  </Rise>
                </ScrollCard>
              )}
            </>
          )}
        </RNAnimated.ScrollView>
      </ScrollFrameProvider>

      {logFor && (
        <GoalLogSheet
          goal={logFor}
          bottomInset={bottomInset}
          onClosed={() => setLogFor(null)}
          onSave={(input, mode) => log(logFor, input, mode)}
        />
      )}

      {actionsFor && (
        <GoalActionsSheet
          title={actionsFor.title}
          bottomInset={bottomInset}
          onClose={() => setActionsFor(null)}
          onDetail={() => onOpenDetail(actionsFor)}
          onEdit={() => onEdit(actionsFor)}
          onDelete={() => onDelete(actionsFor)}
        />
      )}

      {toast && (
        <UndoToast
          key={toast.key}
          message={toast.message}
          undoLabel={t('goals.log.undo')}
          bottomInset={bottomInset}
          onUndo={toast.undo}
          onGone={() => setToast(null)}
        />
      )}
    </View>
  );
}

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
    <View style={styles.stat} accessible accessibilityLabel={`${value}${suffix ?? ''} ${label}`}>
      <View style={styles.statValue}>
        <RollingNumber text={`${value}`} variant="number" tone={tone} rollIn={false} />
        {suffix ? (
          <AppText variant="title" tone="faint" style={styles.statSuffix}>
            {suffix}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted" numberOfLines={2} style={styles.centered}>
        {label}
      </AppText>
    </View>
  );
}

const LANE_H = 30;

/** Today on the left, the farthest deadline on the right; a dot per goal. */
function DeadlineLine({ goals, today }: { goals: Goal[]; today: DateString }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => deadlineLayout(goals, today, width), [goals, today, width]);
  if (layout.dots.length === 0) return null;
  const lanes = Math.max(1, layout.lanes);
  const short = (date: DateString) =>
    parseDate(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const monthLabel = (date: DateString) => {
    const d = parseDate(date);
    // January carries the year, so a far deadline reads right.
    return d.getMonth() === 0
      ? String(d.getFullYear())
      : d.toLocaleDateString(locale, { month: 'short' });
  };

  return (
    <View style={styles.deadlines}>
      <AppText variant="overline" tone="muted">
        {t('goals.dashboard.deadlines')}
      </AppText>
      <View
        style={{ height: LANE_H * lanes + 26, marginTop: space.md }}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <>
            <View style={[styles.axis, { backgroundColor: c.border, top: LANE_H * lanes + 2 }]} />
            {layout.months.map(m => (
              <View key={m.date} style={[styles.monthTick, { left: m.x, top: LANE_H * lanes - 2 }]}>
                <View style={[styles.monthMark, { backgroundColor: c.border }]} />
                <AppText variant="caption" tone="faint" numberOfLines={1}>
                  {monthLabel(m.date)}
                </AppText>
              </View>
            ))}
            <View style={[styles.todayMark, { top: LANE_H * lanes - 3, backgroundColor: c.primary }]} />
            {layout.dots.map(({ goal, date, x, lane }) => {
              const look = goalLook(goal.category);
              const color = c.habit[look.color];
              return (
                <View
                  key={goal.id}
                  style={[
                    styles.dot,
                    {
                      left: x - 13,
                      top: LANE_H * (lanes - 1 - lane),
                      backgroundColor: color,
                      borderColor: c.surface,
                    },
                  ]}
                  accessible
                  accessibilityLabel={`${goal.title} · ${short(date)}`}
                >
                  <Ionicons name={look.icon} size={13} color={onHabitColor(color)} />
                </View>
              );
            })}
          </>
        )}
      </View>
      {layout.next && (
        <AppText variant="label" style={styles.next}>
          {t('goals.deadlines.next', { title: layout.next.goal.title, count: layout.next.days })}
        </AppText>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// A completed goal — a quiet row
// ---------------------------------------------------------------------------

function CompletedRow({
  goal,
  today,
  onOpen,
  onMore,
}: {
  goal: Goal;
  today: DateString;
  onOpen: (goal: Goal) => void;
  onMore: (goal: Goal) => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const look = goalLook(goal.category);
  const doneOn = goalDate(goal.completedDate) ?? today;
  const unit = goal.unit.trim();
  return (
    <PressableScale
      pressScale={0.98}
      accessibilityLabel={`${goal.title}, ${t('goals.completion.statusCompleted')}`}
      accessibilityActions={[{ name: 'more', label: t('habits.list.more') }]}
      onAccessibilityAction={e => {
        if (e.nativeEvent.actionName === 'more') onMore(goal);
      }}
      onPress={() => onOpen(goal)}
      style={styles.cardGap}
    >
      <Surface style={styles.doneRow}>
        <IconBadge icon={look.icon} color={c.habit[look.color]} size={36} />
        <View style={styles.doneText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {`${formatGoalNumber(goal.targetValue, locale)}${unit ? ` ${unit}` : ''} · ${parseDate(doneOn).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`}
          </AppText>
        </View>
        <Ionicons name="checkmark-circle" size={22} color={c.success} />
        <PressableScale
          onPress={() => onMore(goal)}
          feel={null}
          pressScale={0.85}
          accessibilityLabel={t('habits.list.more')}
          style={styles.more}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
        </PressableScale>
      </Surface>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  flex: { flex: 1 },
  title: { marginTop: space.sm },
  subline: { marginTop: 2 },
  centered: { textAlign: 'center' },
  empty: {
    marginTop: space.xxl,
    alignItems: 'center',
    padding: space.xxl,
    gap: space.sm,
  },
  emptyTitle: { textAlign: 'center' },
  overviewCard: { marginTop: space.xxl },
  overview: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { flexDirection: 'row', alignItems: 'flex-end' },
  statSuffix: { marginBottom: 4 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: space.sm,
  },
  deadlines: { marginTop: space.xl },
  axis: {
    position: 'absolute',
    left: 14,
    right: 0,
    height: 2,
    borderRadius: radius.xs,
  },
  monthTick: {
    position: 'absolute',
    alignItems: 'center',
    width: 44,
    marginLeft: -22,
  },
  monthMark: { width: 1, height: 10, marginBottom: 2 },
  todayMark: {
    position: 'absolute',
    left: 9,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  dot: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: { marginTop: space.xs },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xxl,
  },
  trophy: { marginRight: 6 },
  cardGap: { marginTop: space.md },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    paddingLeft: space.lg,
    borderRadius: radius.md,
  },
  doneText: { flex: 1, marginLeft: space.md },
  more: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space.sm,
  },
});
