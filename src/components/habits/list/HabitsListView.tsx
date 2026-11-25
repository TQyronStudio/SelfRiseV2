/**
 * The Habits list in the new look (migration E5, pilot of the conversion; from
 * the Design Lab's HabitsConcept). Top to bottom:
 *   1. the date, the title and a quiet line;
 *   2. THE WEEK — seven rings, how much of each day's plan was kept;
 *   3. TODAY — the count, "+N XP" from habits today, one segment per habit;
 *   4. today's habits — cards with a mini week and the check;
 *   5. BONUS — habits not on today's plan (a check is bonus XP or a make-up);
 *   6. PAUSED — quiet, with Resume and "⋯".
 * The "⋯" sheet holds the old list's four row buttons (R-4c).
 *
 * Data and actions are the app's own (data map: design-migration-datamaps.md, E5):
 * statuses from getHabitCompletionsWithConversion() (Smart Bonus Conversion),
 * the plan from the schedule history, XP from GamificationService. Nothing here
 * decides a rule — habitListLogic.ts only reads them.
 *
 * Not on the card: the habit streak. The app counts it in calendar days, so a
 * Mon/Wed/Fri habit would never show more than 1 (and 0 every morning) — the old
 * list did not show it either.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated as RNAnimated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useTutorial } from '@/src/contexts/TutorialContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { GamificationService } from '@/src/services/gamificationService';
import { Habit } from '@/src/types/habit';
import { addAppEventListener } from '@/src/utils/appEvents';
import {
  parseDate,
  today as todayString,
} from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import {
  AppText,
  Chip,
  chipColors,
  DetailRect,
  IntroProvider,
  ProgressBar,
  Rise,
  RollingNumber,
  ScrollCard,
  ScrollFrameProvider,
  Surface,
  useIntro,
  usePageScrollFrame,
} from '@/src/components/ui';
import {
  dayStatuses,
  doneToday,
  pausedDays,
  scheduleLabel,
  splitHabits,
  weekFractions,
  weekOf,
} from '@/src/screens/habits/habitListLogic';
import { HabitActionsSheet } from './HabitActionsSheet';
import { HabitCard } from './HabitCard';
import { PausedHabitCard } from './PausedHabitCard';
import { WeekDay, WeekStrip } from './WeekStrip';

const SCREEN_PADDING = space.xl;

interface HabitsListViewProps {
  /** Room kept at the bottom for the ad banner. */
  bottomInset: number;
  /** A habit just created: its card glows as it arrives. */
  freshId: string | null;
  /** Resolves when the check is stored — a second tap waits for it. */
  onToggleCompletion: (
    habitId: string,
    date: string,
    isBonus: boolean
  ) => Promise<void>;
  /** Opens the habit's detail; `origin` = the card's rectangle in the window (null if unknown). */
  onOpenStats: (habitId: string, origin: DetailRect | null) => void;
  onEdit: (habit: Habit) => void;
  onToggleActive: (habitId: string, isActive: boolean) => void;
  onDelete: (habitId: string) => void;
}

export function HabitsListView(props: HabitsListViewProps) {
  // The entrance plays when the list mounts: on the tab's first visit (R-32: tabs
  // stay mounted) and again after reorder mode, which shows the old drag list.
  return (
    <IntroProvider kind="settle" playKey={0}>
      <HabitsListContent {...props} />
    </IntroProvider>
  );
}

function HabitsListContent({
  bottomInset,
  freshId,
  onToggleCompletion,
  onOpenStats,
  onEdit,
  onToggleActive,
  onDelete,
}: HabitsListViewProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { timeline } = useIntro();
  const { habits, completions, isLoading, getHabitCompletionsWithConversion } =
    useHabitsData();
  const { state: tutorialState, onboardingHabitId } = useTutorial();
  const locale = t('common.locale');
  const today = todayString();
  const days = useMemo(() => weekOf(today), [today]);

  const letters = useMemo(
    () =>
      days.map(day =>
        parseDate(day).toLocaleDateString(locale, { weekday: 'narrow' })
      ),
    [days, locale]
  );
  const sections = useMemo(() => splitHabits(habits, today), [habits, today]);

  // Each habit's week. The pairing is week-local, so a habit's week only changes
  // when the habit itself or ITS checks in this week change: one check recomputes
  // one habit, not all of them (20+ habits on a slower Android). The cards also
  // compare their own week, so only the card that changed re-renders.
  const weekCache = useRef(
    new Map<
      string,
      { habit: Habit; sig: string; statuses: ReturnType<typeof dayStatuses> }
    >()
  );
  const weeks = useMemo(() => {
    const first = days[0] ?? today;
    const last = days[days.length - 1] ?? today;
    const inWeek = new Map<string, string[]>();
    for (const c of completions) {
      if (c.date < first || c.date > last) continue;
      const list = inWeek.get(c.habitId) ?? [];
      list.push(`${c.date}:${c.completed ? 1 : 0}${c.isBonus ? 'b' : ''}`);
      inWeek.set(c.habitId, list);
    }
    const out = new Map<string, ReturnType<typeof dayStatuses>>();
    const cache = weekCache.current;
    for (const habit of habits) {
      const sig = `${today}|${(inWeek.get(habit.id) ?? []).sort().join(',')}`;
      const hit = cache.get(habit.id);
      if (hit && hit.habit === habit && hit.sig === sig) {
        out.set(habit.id, hit.statuses);
        continue;
      }
      const statuses = dayStatuses(
        habit,
        getHabitCompletionsWithConversion(habit.id),
        days,
        today
      );
      cache.set(habit.id, { habit, sig, statuses });
      out.set(habit.id, statuses);
    }
    return out;
  }, [habits, completions, days, today, getHabitCompletionsWithConversion]);

  const weekDays: WeekDay[] = useMemo(() => {
    const fractions = weekFractions([...weeks.values()], days);
    return days.map((day, i) => ({
      key: day,
      letter: letters[i] ?? '',
      date: parseDate(day).getDate(),
      fraction: fractions[i] ?? 0,
      isToday: day === today,
      future: day > today,
    }));
  }, [weeks, days, letters, today]);

  const plannedDone = sections.planned.filter(h =>
    doneToday(h.id, completions, today)
  ).length;

  // "+N XP" from habits today (option a, Petr 2026-11-23): the app's own record,
  // refreshed whenever XP is credited.
  const [habitXP, setHabitXP] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      GamificationService.getTodayHabitXP().then(xp => {
        if (alive) setHabitXP(xp);
      });
    void load();
    // The XP is stored a moment after the check: read on the event, and once
    // more shortly after, so a cached read never leaves the chip behind.
    let later: ReturnType<typeof setTimeout> | null = null;
    const sub = addAppEventListener('xpGained', () => {
      void load();
      if (later) clearTimeout(later);
      later = setTimeout(() => void load(), 400);
    });
    return () => {
      alive = false;
      sub.remove();
      if (later) clearTimeout(later);
    };
  }, []);

  // Onboarding: screen 3 names one habit, and only its check pulses. When that
  // habit is unknown (no id, or deleted), every unticked check pulses — as before.
  const onboardingHabitExists =
    onboardingHabitId !== null && habits.some(h => h.id === onboardingHabitId);
  const asking = tutorialState.onboardingScreen === 3;

  // --- Actions (stable, so the memoized cards stay still) ---------------------------
  const latest = useRef({
    onToggleCompletion,
    onOpenStats,
    onToggleActive,
    today,
  });
  latest.current = { onToggleCompletion, onOpenStats, onToggleActive, today };
  // One check at a time per habit: a second tap while the first is being stored
  // is ignored (the storage toggle reads, then writes — two at once could store
  // twice or give the XP twice). The old list had the same guard.
  const inFlight = useRef(new Set<string>());
  const toggle = useCallback((id: string, kind: 'planned' | 'bonus') => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    latest.current
      .onToggleCompletion(id, latest.current.today, kind === 'bonus')
      .finally(() => inFlight.current.delete(id));
  }, []);
  // Where each card is, so its detail grows out of it (DetailFrame).
  const cardRefs = useRef(new Map<string, View | null>());
  const openFromCard = useCallback((id: string) => {
    const card = cardRefs.current.get(id);
    if (!card) {
      latest.current.onOpenStats(id, null);
      return;
    }
    card.measureInWindow((x, y, width, height) =>
      latest.current.onOpenStats(
        id,
        width > 0 ? { x, y, width, height } : null
      )
    );
  }, []);
  const open = useCallback(
    (id: string) => {
      feel('tap');
      openFromCard(id);
    },
    [openFromCard]
  );
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const more = useCallback((id: string) => setSheetFor(id), []);
  const resume = useCallback(
    (id: string) => latest.current.onToggleActive(id, true),
    []
  );
  const sheetHabit = sheetFor ? habits.find(h => h.id === sheetFor) : undefined;

  // --- Scroll (native-driven, scrollChoreography) ------------------------------------
  const { frame, onScroll, onLayout } = usePageScrollFrame(bottomInset, true);

  const dateLine = parseDate(today).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;

  const scheduleText = (habit: Habit) =>
    scheduleLabel(habit, today, locale, t('habits.schedule.everyDay'));

  const renderCard = (habit: Habit, kind: 'planned' | 'bonus') => {
    const week = weeks.get(habit.id);
    const statuses = days.map(
      day => week?.get(day) ?? { kind: 'none' as const }
    );
    const todayStatus = week?.get(today);
    const makeupText =
      todayStatus?.kind === 'makeup' && todayStatus.pairKey
        ? t('habits.list.makeupCovers', {
            day: parseDate(todayStatus.pairKey).toLocaleDateString(locale, {
              weekday: 'short',
            }),
          })
        : null;
    const done = doneToday(habit.id, completions, today);
    return (
      <View
        key={habit.id}
        style={styles.cardGap}
        ref={view => {
          cardRefs.current.set(habit.id, view);
        }}
        collapsable={false}
      >
        <HabitCard
          id={habit.id}
          name={habit.name}
          icon={habit.icon}
          color={c.habit[habit.color]}
          schedule={scheduleText(habit)}
          kind={kind}
          done={done}
          days={days}
          week={statuses}
          today={today}
          letters={letters}
          makeupText={makeupText}
          bonusLabel={t('habits.bonus')}
          moreLabel={t('habits.list.more')}
          checkLabel={habit.name}
          checkActionLabel={t(
            done
              ? 'habits.accessibility.markIncomplete'
              : 'habits.accessibility.markComplete'
          )}
          highlight={
            asking && (!onboardingHabitExists || onboardingHabitId === habit.id)
          }
          fresh={freshId === habit.id}
          onToggle={toggle}
          onOpen={open}
          onMore={more}
        />
      </View>
    );
  };

  if (!isLoading && habits.length === 0) {
    return (
      <View style={[styles.empty, { paddingBottom: bottomInset }]}>
        <Ionicons name="leaf-outline" size={40} color={c.textFaint} />
        <AppText variant="title" style={styles.emptyTitle}>
          {t('habits.emptyStateWithCompletion.title')}
        </AppText>
        <AppText variant="body" tone="muted" style={styles.center}>
          {t('habits.emptyStateWithCompletion.subtitle')}
        </AppText>
      </View>
    );
  }

  const { planned, bonus, paused } = sections;

  return (
    <ScrollFrameProvider value={frame}>
      <RNAnimated.ScrollView
        style={styles.flex}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          contentColumn,
          {
            paddingHorizontal: SCREEN_PADDING,
            paddingBottom: bottomInset + space.xxl,
          },
        ]}
      >
        <Rise window={timeline.header}>
          <AppText variant="overline" tone="muted">
            {dateLine}
          </AppText>
          <AppText variant="display" style={styles.title}>
            {t('tabs.habits')}
          </AppText>
          <AppText variant="body" tone="muted" italic style={styles.subline}>
            {t('habits.list.subline')}
          </AppText>
        </Rise>

        {/* The week */}
        <ScrollCard variant="hero">
          <Rise window={timeline.hero} scaleFrom={0.97}>
            <Surface style={styles.weekCard}>
              <AppText
                variant="overline"
                tone="primary"
                style={styles.weekLabel}
              >
                {t('habits.list.week')}
              </AppText>
              <WeekStrip days={weekDays} />
            </Surface>
          </Rise>
        </ScrollCard>

        {/* Today */}
        <ScrollCard>
          <Rise window={sectionWindow(0)}>
            <Surface style={styles.todayCard}>
              <View style={styles.todayRow}>
                <View style={styles.todayCount}>
                  <RollingNumber text={`${plannedDone}`} variant="number" />
                  <AppText variant="title" tone="faint" style={styles.todayOf}>
                    /{planned.length}
                  </AppText>
                </View>
                <View style={styles.todayText}>
                  <AppText variant="overline" tone="primary">
                    {t('common.dates.today')}
                  </AppText>
                  <AppText
                    variant="label"
                    tone="muted"
                    style={styles.todayDone}
                  >
                    {t('habits.list.doneOf', {
                      count: plannedDone,
                      total: planned.length,
                    })}
                  </AppText>
                </View>
                <Chip icon="sparkles" tone="reward">
                  <RollingNumber
                    text={`+${habitXP} XP`}
                    variant="caption"
                    style={{
                      color: chipColors(c, 'reward').fg,
                      fontFamily: fonts.semibold,
                    }}
                  />
                </Chip>
              </View>
              {planned.length > 0 && (
                <View style={styles.segments}>
                  {planned.map(habit => (
                    <ProgressBar
                      key={habit.id}
                      progress={doneToday(habit.id, completions, today) ? 1 : 0}
                      colors={[c.habit[habit.color], c.habit[habit.color]]}
                      height={8}
                      style={styles.flex}
                    />
                  ))}
                </View>
              )}
            </Surface>
          </Rise>
        </ScrollCard>

        {/* Today's habits */}
        {planned.length > 0 && (
          <ScrollCard>
            <Rise window={sectionWindow(1)}>
              <SectionTitle
                title={t('common.dates.today')}
                trailing={`${plannedDone}/${planned.length}`}
              />
              {planned.map(habit => renderCard(habit, 'planned'))}
            </Rise>
          </ScrollCard>
        )}

        {/* Bonus */}
        {bonus.length > 0 && (
          <ScrollCard>
            <Rise window={sectionWindow(2)}>
              <SectionTitle title={t('habits.list.bonusSection')} gold />
              <AppText variant="caption" tone="muted" style={styles.bonusHint}>
                {t('habits.list.bonusHint')}
              </AppText>
              {bonus.map(habit => renderCard(habit, 'bonus'))}
            </Rise>
          </ScrollCard>
        )}

        {/* Paused */}
        {paused.length > 0 && (
          <ScrollCard>
            <Rise window={sectionWindow(3)}>
              <SectionTitle title={t('habits.calendar.legendPaused')} />
              {paused.map(habit => (
                <PausedHabitCard
                  key={habit.id}
                  id={habit.id}
                  name={habit.name}
                  icon={habit.icon}
                  pausedText={t('habits.list.pausedFor', {
                    count: pausedDays(habit, today),
                  })}
                  resumeLabel={t('habits.list.resume')}
                  moreLabel={t('habits.list.more')}
                  onResume={resume}
                  onMore={more}
                />
              ))}
            </Rise>
          </ScrollCard>
        )}
      </RNAnimated.ScrollView>

      {sheetHabit && (
        <HabitActionsSheet
          name={sheetHabit.name}
          paused={!sheetHabit.isActive}
          bottomInset={bottomInset}
          onClose={() => setSheetFor(null)}
          onCalendar={() => openFromCard(sheetHabit.id)}
          onEdit={() => onEdit(sheetHabit)}
          onTogglePause={() =>
            onToggleActive(sheetHabit.id, !sheetHabit.isActive)
          }
          onDelete={() => onDelete(sheetHabit.id)}
        />
      )}
    </ScrollFrameProvider>
  );
}

function SectionTitle({
  title,
  trailing,
  gold,
}: {
  title: string;
  trailing?: string;
  gold?: boolean;
}) {
  const { c } = useDesign();
  return (
    <View style={styles.sectionTitle}>
      {gold && (
        <Ionicons
          name="star"
          size={14}
          color={c.reward}
          style={styles.goldStar}
        />
      )}
      <AppText variant="title" style={styles.flex} numberOfLines={2}>
        {title}
      </AppText>
      {trailing && <RollingNumber text={trailing} tone="muted" />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    marginTop: space.sm,
  },
  subline: {
    marginTop: 2,
  },
  weekCard: {
    marginTop: space.xxl,
    paddingHorizontal: space.md,
  },
  weekLabel: {
    marginLeft: space.sm,
  },
  todayCard: {
    marginTop: space.lg,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayCount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  todayOf: {
    marginLeft: 2,
    marginBottom: 4,
  },
  todayText: {
    flex: 1,
    marginLeft: space.lg,
  },
  todayDone: {
    marginTop: 2,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.lg,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  goldStar: {
    marginRight: 6,
  },
  bonusHint: {
    marginTop: -space.sm,
  },
  cardGap: {
    marginTop: space.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxxl,
  },
  emptyTitle: {
    marginTop: space.lg,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
