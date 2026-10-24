/**
 * Habits screen concept for the Design Lab (premium-design-plan.md, F1, kolo 13).
 *
 * Composition, top to bottom:
 *   1. Title + quiet actions (add, reorder) — the level badge sits pinned on the left.
 *   2. THE WEEK — seven days, each a small ring: how much of that day's plan was
 *      kept. The rhythm of the week at a glance; today is lifted.
 *   3. TODAY — the count, and a bar made of one segment per habit planned today;
 *      each segment fills in its habit's own colour when checked.
 *   4. Habit cards for today: icon, name, streak, a mini week of 7 dots, the check.
 *   5. BONUS — habits not on today's plan. A gold check; if a missed day this week
 *      exists, the card says right away that it makes it up ("Make-up · covers Tue").
 *   6. PAUSED — quiet, with Resume; a paused day is never a missed day.
 * Tapping a card grows it into the habit's calendar (HabitDetailConcept). The four
 * per-row buttons of today's app live in a "⋯" sheet (plan R-4c).
 *
 * Checks, XP pops and sparks into the level badge work exactly like on Home; the
 * checks are shared with Home (habitsMock.tsx).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Statuses from useHabitsData / habitImmutability (the app's real pairing and
 *   pause logic), never from habitsMock. XP values from the app, not constants here.
 * - Keep the onboarding pulse (`highlight` on the first habit's check).
 * - Day status = SHAPE (● ○ ★ × ━), colour = the user's habit colour (lesson 18).
 * - Make-up pairs: bracket UNDER the dots, own lane per overlapping pair (lesson 22).
 * - "⋯" sheet replaces the 4 row buttons only after R-4c.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  withSequence,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { selection } from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  Chip,
  CheckButton,
  IconBadge,
  LabText,
  PressableScale,
  ProgressBar,
  Rise,
  Surface,
  chipColors,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { useIntro } from './introTimeline';
import { ScrollCard, ScrollFrameProvider } from './scrollChoreography';
import { RollingNumber } from './RollingNumber';
import { MOCK_COPY } from './mockCopy';
import { useLabXp, XpPop } from './xpFlight';
import {
  addDays,
  dateKey,
  DayKind,
  isPaused,
  isScheduled,
  LAB_HABITS,
  LabHabit,
  mondayOf,
  startOfDay,
  statusesFor,
  useLabToday,
} from './habitsMock';
import { HabitDetailConcept } from './HabitDetailConcept';
import { HabitsReorderConcept } from './HabitsReorderConcept';
import { HabitComposerConcept } from './HabitComposerConcept';
import { DetailRect } from './JournalDetailConcept';

const SCREEN_PADDING = labSpace.xl;
const XP_SCHEDULED = 25;
const XP_BONUS = 15;

interface HabitsConceptProps {
  bottomInset: number;
}

export function HabitsConcept({ bottomInset }: HabitsConceptProps) {
  const { c, lang, crown } = useLab();
  const { timeline } = useIntro();
  const copy = MOCK_COPY[lang];
  const h = copy.habits;
  const { done } = useLabToday();
  const today = useMemo(() => startOfDay(new Date()), []);
  const monday = mondayOf(today);

  // The user's order (reorder mode) applies to every list on the screen.
  const [order, setOrder] = useState<string[]>(() => LAB_HABITS.map(x => x.id));
  const [reordering, setReordering] = useState(false);
  // Habits created in the composer (lab state) — appended, like the app does.
  const [created, setCreated] = useState<LabHabit[]>([]);
  const [composing, setComposing] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const ordered = [...LAB_HABITS, ...created].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );
  const active = ordered.filter(x => !isPaused(x, today, today));
  const paused = ordered.filter(x => isPaused(x, today, today));
  const planned = active.filter(x => isScheduled(x, today));
  const bonus = active.filter(x => !isScheduled(x, today));
  const doneToday = planned.filter(x => done[x.id]).length;
  const xpToday =
    planned.filter(x => done[x.id]).length * XP_SCHEDULED +
    bonus.filter(x => done[x.id]).length * XP_BONUS;

  // --- Detail + action sheet ------------------------------------------------------
  const pageRef = useRef<View>(null);
  const cardRefs = useRef(new Map<string, View | null>());
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [detail, setDetail] = useState<{
    habit: LabHabit;
    origin: DetailRect;
  } | null>(null);
  const [sheetFor, setSheetFor] = useState<LabHabit | null>(null);

  const openDetail = (habit: LabHabit) => {
    const page = pageRef.current;
    const card = cardRefs.current.get(habit.id);
    if (!page || !card) return;
    page.measureInWindow((px, py) => {
      card.measureInWindow((x, y, width, height) => {
        selection();
        setDetail({ habit, origin: { x: x - px, y: y - py, width, height } });
      });
    });
  };

  // A new habit: bring its card into view once it is laid out.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!freshId) return undefined;
    const id = setTimeout(() => {
      const page = pageRef.current;
      const card = cardRefs.current.get(freshId);
      if (!page || !card) return;
      page.measureInWindow((_px, py, _pw, ph) => {
        card.measureInWindow((_x, y, _w, h) => {
          const delta = y + h / 2 - (py + ph * 0.4);
          scrollRef.current?.scrollTo({
            y: Math.max(0, lastScrollY.current + delta),
            animated: true,
          });
        });
      });
    }, 320);
    return () => clearTimeout(id);
  }, [freshId]);

  // --- Native-driven scroll (see scrollChoreography.tsx for why) -------------------
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

  const dateLine = today.toLocaleDateString(copy.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;

  const renderCard = (habit: LabHabit, kind: 'planned' | 'bonus') => (
    <View
      key={habit.id}
      ref={node => {
        cardRefs.current.set(habit.id, node);
      }}
      collapsable={false}
      style={{
        marginTop: labSpace.md,
        opacity: detail?.habit.id === habit.id ? 0 : 1,
      }}
    >
      <HabitCard
        habit={habit}
        fresh={freshId === habit.id}
        kind={kind}
        today={today}
        monday={monday}
        onOpen={() => openDetail(habit)}
        onMore={() => {
          selection();
          setSheetFor(habit);
        }}
      />
    </View>
  );

  return (
    <ScrollFrameProvider value={scrollFrame}>
      <View
        ref={pageRef}
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
        {reordering ? (
          <Animated.View
            key="reorder"
            entering={FadeIn.duration(220)}
            style={{ flex: 1 }}
          >
            <HabitsReorderConcept
              habits={ordered}
              bottomInset={bottomInset}
              onReorder={setOrder}
              onDone={() => setReordering(false)}
            />
          </Animated.View>
        ) : (
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
            {/* Title row — the level badge is pinned on the left by the lab screen. */}
            <View style={styles.topRow}>
              <Rise window={timeline.header} style={styles.topActions}>
                <TopButton
                  icon="swap-vertical"
                  label="Reorder"
                  onPress={() => setReordering(true)}
                />
                <TopButton
                  icon="add"
                  label="Add habit"
                  primary
                  onPress={() => setComposing(true)}
                />
              </Rise>
            </View>
            <Rise window={timeline.header}>
              <LabText variant="overline" tone="muted">
                {dateLine}
              </LabText>
              <LabText variant="display" style={{ marginTop: labSpace.sm }}>
                {h.title}
              </LabText>
              <LabText
                variant="body"
                tone="muted"
                italic
                style={{ marginTop: 2 }}
              >
                {h.subline}
              </LabText>
            </Rise>

            {/* The week */}
            <ScrollCard variant="hero">
              <Rise window={timeline.hero} scaleFrom={0.97}>
                <Surface
                  style={{
                    marginTop: labSpace.xxl,
                    paddingHorizontal: labSpace.md,
                  }}
                >
                  <LabText
                    variant="overline"
                    tone="primary"
                    style={{ marginLeft: labSpace.sm }}
                  >
                    {h.week}
                  </LabText>
                  <WeekStrip monday={monday} today={today} />
                </Surface>
              </Rise>
            </ScrollCard>

            {/* Today */}
            <ScrollCard>
              <Rise window={sectionWindow(0)}>
                <Surface style={{ marginTop: labSpace.lg }}>
                  <View style={styles.todayRow}>
                    <View style={styles.todayCount}>
                      <RollingNumber text={`${doneToday}`} variant="number" />
                      <LabText
                        variant="title"
                        tone="faint"
                        style={{ marginLeft: 2, marginBottom: 4 }}
                      >
                        /{planned.length}
                      </LabText>
                    </View>
                    <View style={{ flex: 1, marginLeft: labSpace.lg }}>
                      <LabText variant="overline" tone="primary">
                        {h.today}
                      </LabText>
                      <LabText
                        variant="label"
                        tone="muted"
                        style={{ marginTop: 2 }}
                      >
                        {h.doneOf(doneToday, planned.length)}
                      </LabText>
                    </View>
                    <Chip icon="sparkles" tone="reward">
                      <RollingNumber
                        text={`+${xpToday} XP`}
                        variant="caption"
                        style={{
                          color: chipColors(c, 'reward').fg,
                          fontFamily: labFonts.semibold,
                        }}
                      />
                    </Chip>
                  </View>
                  <View style={styles.segments}>
                    {planned.map(habit => (
                      <ProgressBar
                        key={habit.id}
                        progress={done[habit.id] ? 1 : 0}
                        colors={[c.habit[habit.color], c.habit[habit.color]]}
                        height={8}
                        style={{ flex: 1 }}
                      />
                    ))}
                  </View>
                </Surface>
              </Rise>
            </ScrollCard>

            {/* Today's habits */}
            <ScrollCard>
              <Rise window={sectionWindow(1)}>
                <SectionTitle
                  title={h.today}
                  trailing={`${doneToday}/${planned.length}`}
                />
                {planned.map(habit => renderCard(habit, 'planned'))}
              </Rise>
            </ScrollCard>

            {/* Bonus */}
            {bonus.length > 0 && (
              <ScrollCard>
                <Rise window={sectionWindow(2)}>
                  <SectionTitle title={h.bonusSection} gold />
                  <LabText
                    variant="caption"
                    tone="muted"
                    style={{ marginTop: -labSpace.sm }}
                  >
                    {h.bonusHint}
                  </LabText>
                  {bonus.map(habit => renderCard(habit, 'bonus'))}
                </Rise>
              </ScrollCard>
            )}

            {/* Paused */}
            {paused.length > 0 && (
              <ScrollCard>
                <Rise window={sectionWindow(3)}>
                  <SectionTitle title={h.pausedSection} />
                  {paused.map(habit => (
                    <PausedCard key={habit.id} habit={habit} />
                  ))}
                </Rise>
              </ScrollCard>
            )}
          </RNAnimated.ScrollView>
        )}

        {sheetFor && (
          <ActionSheet
            habit={sheetFor}
            bottomInset={bottomInset}
            onClose={() => setSheetFor(null)}
            onCalendar={() => {
              const habit = sheetFor;
              setSheetFor(null);
              setTimeout(() => openDetail(habit), 220);
            }}
          />
        )}

        {composing && (
          <HabitComposerConcept
            bottomInset={bottomInset}
            onClose={() => setComposing(false)}
            onCreate={habit => {
              setComposing(false);
              setCreated(prev => [...prev, habit]);
              setOrder(prev => [...prev, habit.id]);
              setFreshId(habit.id);
            }}
          />
        )}

        {detail && pageSize.width > 0 && (
          <HabitDetailConcept
            habit={detail.habit}
            origin={detail.origin}
            size={pageSize}
            bottomInset={bottomInset}
            onClosed={() => setDetail(null)}
          />
        )}
      </View>
    </ScrollFrameProvider>
  );
}

// ---------------------------------------------------------------------------
// The week
// ---------------------------------------------------------------------------

function WeekStrip({ monday, today }: { monday: Date; today: Date }) {
  const { lang } = useLab();
  const { done } = useLabToday();
  const copy = MOCK_COPY[lang];
  const todayKey = dateKey(today);

  const fractions = useMemo(() => {
    const perHabit = LAB_HABITS.map(habit =>
      statusesFor(habit, monday, addDays(monday, 6), today, !!done[habit.id])
    );
    return Array.from({ length: 7 }, (_, i) => {
      const key = dateKey(addDays(monday, i));
      let planned = 0;
      let kept = 0;
      perHabit.forEach(st => {
        const kind = st.get(key)?.kind;
        if (
          kind === 'done' ||
          kind === 'covered' ||
          kind === 'missed' ||
          kind === 'todayOpen' ||
          kind === 'planned'
        )
          planned++;
        if (kind === 'done' || kind === 'covered') kept++;
      });
      return planned === 0 ? 0 : kept / planned;
    });
  }, [monday, today, done]);

  return (
    <View style={styles.weekRow}>
      {fractions.map((f, i) => {
        const d = addDays(monday, i);
        const key = dateKey(d);
        const isToday = key === todayKey;
        const future = d > today;
        return (
          <DayColumn
            key={key}
            letter={copy.weekdays[i] ?? ''}
            date={d.getDate()}
            fraction={f}
            isToday={isToday}
            future={future}
            delay={200 + i * 50}
          />
        );
      })}
    </View>
  );
}

const RING = 30;

function DayColumn({
  letter,
  date,
  fraction,
  isToday,
  future,
  delay,
}: {
  letter: string;
  date: number;
  fraction: number;
  isToday: boolean;
  future: boolean;
  delay: number;
}) {
  const { c } = useLab();
  const progress = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    progress.value = first.current
      ? withDelay(
          delay,
          withTiming(fraction, {
            duration: 600,
            easing: Easing.out(Easing.cubic),
          })
        )
      : withTiming(fraction, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
    first.current = false;
  }, [fraction, delay, progress]);

  const arc = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(3, 3, RING - 6, RING - 6), -90, 359.9);
    return p;
  }, []);

  return (
    <View
      style={[styles.dayColumn, isToday && { backgroundColor: c.primarySoft }]}
    >
      <LabText variant="caption" tone={isToday ? 'primary' : 'muted'}>
        {letter}
      </LabText>
      <View style={styles.ringBox}>
        <Canvas style={{ width: RING, height: RING }} pointerEvents="none">
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RING / 2 - 3}
            style="stroke"
            strokeWidth={3}
            color={c.track}
          />
          {!future && (
            <Path
              path={arc}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
              color={fraction >= 1 ? c.success : c.primary}
              start={0}
              end={progress}
            />
          )}
        </Canvas>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.ringNumber}>
            <LabText
              variant="caption"
              tone={isToday ? 'primary' : future ? 'faint' : 'text'}
              style={{
                fontFamily: isToday ? labFonts.bold : labFonts.semibold,
              }}
            >
              {date}
            </LabText>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function HabitCard({
  habit,
  fresh,
  kind,
  today,
  monday,
  onOpen,
  onMore,
}: {
  habit: LabHabit;
  /** Just created: the card glows twice in its own colour as it arrives. */
  fresh: boolean;
  kind: 'planned' | 'bonus';
  today: Date;
  monday: Date;
  onOpen: () => void;
  onMore: () => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const h = copy.habits;
  const { done, toggle } = useLabToday();
  const { award } = useLabXp();
  const isDone = !!done[habit.id];
  const checkRef = useRef<View>(null);
  const [pops, setPops] = useState<{ key: number; amount: number }[]>([]);

  const week = useMemo(
    () => statusesFor(habit, monday, addDays(monday, 6), today, isDone),
    [habit, monday, today, isDone]
  );
  const todayStatus = week.get(dateKey(today));
  const makeupFor =
    todayStatus?.kind === 'makeup' && todayStatus.pairKey
      ? (() => {
          const [y, m, d] = todayStatus.pairKey.split('-').map(Number);
          return new Date(y!, m! - 1, d!).toLocaleDateString(copy.locale, {
            weekday: 'short',
          });
        })()
      : null;

  const glow = useSharedValue(isDone ? 1 : 0);
  useEffect(() => {
    glow.value = withTiming(isDone ? 1 : 0, { duration: 250 });
  }, [isDone, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      420,
      withSequence(
        withTiming(1, { duration: 260 }),
        withTiming(0.2, { duration: 320 }),
        withTiming(1, { duration: 260 }),
        withTiming(0, { duration: 600 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  const scheduleText =
    habit.days.length === 7
      ? lang === 'de'
        ? 'Jeden Tag'
        : 'Every day'
      : habit.days
          .map(d =>
            addDays(monday, d).toLocaleDateString(copy.locale, {
              weekday: 'short',
            })
          )
          .join(' · ');

  const xp = kind === 'bonus' ? XP_BONUS : XP_SCHEDULED;

  return (
    <PressableScale
      pressScale={0.985}
      haptic={null}
      onPress={onOpen}
      accessibilityLabel={habit.name[lang]}
    >
      <Surface style={styles.card}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            {
              // The habit's own colour, softly — identity, not a status colour.
              backgroundColor: `${c.habit[habit.color]}1A`,
            },
            glowStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            {
              borderWidth: 2,
              borderColor: c.habit[habit.color],
              backgroundColor: `${c.habit[habit.color]}26`,
            },
            arriveStyle,
          ]}
        />
        <View style={styles.cardRow}>
          <IconBadge
            icon={habit.icon as never}
            color={c.habit[habit.color]}
            size={44}
          />
          <View style={{ flex: 1, marginLeft: labSpace.md }}>
            <LabText variant="bodyStrong" numberOfLines={2}>
              {habit.name[lang]}
            </LabText>
            <View style={styles.metaRow}>
              {makeupFor ? (
                <>
                  <Ionicons
                    name="refresh"
                    size={12}
                    color={c.habit[habit.color]}
                  />
                  <LabText
                    variant="caption"
                    tone="text"
                    style={{ marginLeft: 4 }}
                  >
                    {h.makeupCovers(makeupFor)}
                  </LabText>
                </>
              ) : (
                <>
                  <Ionicons name="flame" size={12} color={c.flame} />
                  <LabText
                    variant="caption"
                    tone="muted"
                    style={{ marginLeft: 3 }}
                  >
                    {`${habit.streak} · ${scheduleText}`}
                  </LabText>
                  {kind === 'bonus' && (
                    <View
                      style={[
                        styles.bonusTag,
                        { backgroundColor: c.rewardSoft },
                      ]}
                    >
                      <LabText
                        variant="caption"
                        tone="reward"
                        style={{ fontFamily: labFonts.semibold }}
                      >
                        {h.bonusTag}
                      </LabText>
                    </View>
                  )}
                </>
              )}
            </View>
            <WeekDots
              week={week}
              monday={monday}
              today={today}
              color={c.habit[habit.color]}
            />
          </View>
          <PressableScale
            onPress={onMore}
            haptic={null}
            pressScale={0.85}
            accessibilityLabel="More"
            style={styles.more}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={c.textMuted}
            />
          </PressableScale>
          <View ref={checkRef} collapsable={false}>
            <CheckButton
              done={isDone}
              tone={kind === 'bonus' && !makeupFor ? 'reward' : 'success'}
              label={habit.name[lang]}
              onToggle={() => {
                const amount = isDone ? -xp : xp;
                toggle(habit.id);
                const key = Date.now();
                setPops(prev => [...prev, { key, amount }]);
                setTimeout(
                  () => setPops(prev => prev.filter(p => p.key !== key)),
                  1100
                );
                if (amount < 0) award(amount);
              }}
            />
            {pops.map(pop => (
              <View key={pop.key} style={styles.popAnchor} pointerEvents="none">
                <XpPop
                  amount={pop.amount}
                  onCrack={() =>
                    checkRef.current?.measureInWindow((x, y, w) =>
                      award(pop.amount, { x: x + w / 2, y: y - 12 })
                    )
                  }
                />
              </View>
            ))}
          </View>
        </View>
      </Surface>
    </PressableScale>
  );
}

/**
 * This week in seven dots. Kolo 15 (Petr: "a red habit is red when done AND when
 * missed, and the make-up pair is green though I track it in red"): the habit's
 * colour is only its IDENTITY; what happened that day is told by SHAPE —
 *   filled            = done (or the extra day that rescued a missed one)
 *   hollow ring       = the rescued missed day — joined to its rescuer by a line
 *   ★ star            = bonus (ripples once in gold when made today)
 *   × red cross       = missed (kolo 19: shape, so even a red habit stays clear)
 *   Kolo 19 (Petr): users keep any colour, red and yellow too — status is SHAPE.
 *   Red and gold are RESERVED — no habit colour comes within ΔE2000 20 of them.
 *   grey bar          = paused     neutral ring = planned / today still open
 * A letter under each dot names the day.
 */
const DOT_COL = 14;
const DOT_GAP = 4;
/** Mark box (12) + gap (2) + letter line (12). Brackets hang below this. */
const DOTS_HEIGHT = 26;
const LINK_LANE = 6;

type DotShape = 'dot' | 'ring' | 'star' | 'cross' | 'bar' | 'tiny';

/**
 * Kolo 19: every status has its own SHAPE, so any habit colour works — a yellow
 * habit's bonus, a red habit's missed day, all read the same way.
 */
function dotLook(
  kind: DayKind,
  color: string,
  c: ReturnType<typeof useLab>['c']
): { shape: DotShape; color: string } {
  switch (kind) {
    case 'done':
    case 'makeup':
      return { shape: 'dot', color };
    case 'covered':
      return { shape: 'ring', color };
    case 'bonus':
      return { shape: 'star', color };
    case 'missed':
      return { shape: 'cross', color: c.missed };
    case 'paused':
      return { shape: 'bar', color: c.textFaint };
    case 'todayOpen':
      return { shape: 'ring', color: c.textMuted };
    case 'planned':
      return { shape: 'ring', color: c.track };
    default:
      return { shape: 'tiny', color: c.track };
  }
}

function DotMark({ shape, color }: { shape: DotShape; color: string }) {
  if (shape === 'star') {
    return (
      <View style={styles.dotBox}>
        <Ionicons name="star" size={11} color={color} />
      </View>
    );
  }
  if (shape === 'cross') {
    return (
      <View style={styles.dotBox}>
        <Ionicons name="close" size={12} color={color} />
      </View>
    );
  }
  return (
    <View style={styles.dotBox}>
      <View
        style={
          shape === 'bar'
            ? [styles.bar, { backgroundColor: color }]
            : shape === 'ring'
              ? [styles.dot, { borderColor: color, borderWidth: 1.5 }]
              : shape === 'tiny'
                ? [
                    styles.dot,
                    { backgroundColor: color, transform: [{ scale: 0.5 }] },
                  ]
                : [styles.dot, { backgroundColor: color }]
        }
      />
    </View>
  );
}

/** A bonus just made today ripples once in gold — once, then rests (not a loop). */
function BonusRipple() {
  const { c } = useLab();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ scale: 1 + 1.4 * p.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ripple, { borderColor: c.reward }, style]}
    />
  );
}

function WeekDots({
  week,
  monday,
  today,
  color,
}: {
  week: Map<string, { kind: DayKind; pairKey?: string }>;
  monday: Date;
  today: Date;
  color: string;
}) {
  const { c, lang } = useLab();
  const todayKey = dateKey(today);
  const letters = MOCK_COPY[lang].weekdays;
  const keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));

  // Make-up pairs inside this week → a connector between the two dots.
  // Make-up pairs as brackets UNDER the dots (kolo 16): a line through the dots
  // would seem to include the days in between (Thu rescuing Mon would look like it
  // touches Wed). Overlapping pairs get their own row of brackets.
  const links: { from: number; to: number; lane: number }[] = [];
  keys.forEach((key, i) => {
    const s = week.get(key);
    if (s?.kind === 'makeup' && s.pairKey) {
      const j = keys.indexOf(s.pairKey);
      if (j >= 0)
        links.push({ from: Math.min(i, j), to: Math.max(i, j), lane: 0 });
    }
  });
  links.sort((a, b) => a.from - b.from);
  const laneEnds: number[] = [];
  links.forEach(l => {
    let lane = laneEnds.findIndex(end => end < l.from);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(l.to);
    } else {
      laneEnds[lane] = l.to;
    }
    l.lane = lane;
  });
  const centerX = (i: number) => i * (DOT_COL + DOT_GAP) + DOT_COL / 2;

  return (
    <View style={[styles.dots, { paddingBottom: laneEnds.length * LINK_LANE }]}>
      {links.map(l => (
        <View
          key={`${l.from}-${l.to}`}
          style={[
            styles.dotLink,
            {
              left: centerX(l.from) - 0.75,
              width: centerX(l.to) - centerX(l.from) + 1.5,
              top: DOTS_HEIGHT + 1 + l.lane * LINK_LANE,
              borderColor: color,
            },
          ]}
        />
      ))}
      {keys.map((key, i) => {
        const kind = week.get(key)?.kind ?? 'none';
        const look = dotLook(kind, color, c);
        const isToday = key === todayKey;
        return (
          <View key={key} style={styles.dotCol}>
            <DotMark shape={look.shape} color={look.color} />
            {isToday && kind === 'bonus' && (
              <BonusRipple key={`ripple-${key}`} />
            )}
            <LabText
              variant="caption"
              tone={isToday ? 'primary' : 'faint'}
              style={[
                styles.dotLetter,
                isToday && { fontFamily: labFonts.bold },
              ]}
            >
              {letters[i] ?? ''}
            </LabText>
          </View>
        );
      })}
    </View>
  );
}

function PausedCard({ habit }: { habit: LabHabit }) {
  const { c, lang } = useLab();
  const h = MOCK_COPY[lang].habits;
  return (
    <Surface style={[styles.card, { marginTop: labSpace.md, opacity: 0.85 }]}>
      <View style={styles.cardRow}>
        <View style={{ opacity: 0.5 }}>
          <IconBadge icon={habit.icon as never} color={c.textMuted} size={44} />
        </View>
        <View style={{ flex: 1, marginLeft: labSpace.md }}>
          <LabText variant="bodyStrong" tone="muted" numberOfLines={2}>
            {habit.name[lang]}
          </LabText>
          <View style={styles.metaRow}>
            <Ionicons name="pause" size={11} color={c.textFaint} />
            <LabText
              variant="caption"
              tone="faint"
              style={{ marginLeft: 4, flexShrink: 1 }}
            >
              {h.pausedFor(habit.pausedDaysAgo ?? 0)}
            </LabText>
          </View>
        </View>
        <PressableScale
          accessibilityLabel={h.resume}
          pressScale={0.92}
          style={[styles.resume, { backgroundColor: c.primarySoft }]}
        >
          <Ionicons
            name="play"
            size={12}
            color={c.primary}
            style={{ marginRight: 4 }}
          />
          <LabText
            variant="caption"
            tone="primary"
            style={{ fontFamily: labFonts.semibold }}
          >
            {h.resume}
          </LabText>
        </PressableScale>
      </View>
    </Surface>
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
  const { c } = useLab();
  return (
    <View style={styles.sectionTitle}>
      {gold && (
        <Ionicons
          name="star"
          size={14}
          color={c.reward}
          style={{ marginRight: 6 }}
        />
      )}
      <LabText variant="title" style={{ flex: 1 }} numberOfLines={2}>
        {title}
      </LabText>
      {trailing && <RollingNumber text={trailing} tone="muted" />}
    </View>
  );
}

function TopButton({
  icon,
  label,
  primary,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  primary?: boolean;
  onPress?: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      {...(onPress ? { onPress } : null)}
      accessibilityLabel={label}
      pressScale={0.92}
      style={[
        styles.topButton,
        {
          backgroundColor: primary ? c.primarySoft : c.surface,
          borderColor: c.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={primary ? c.primary : c.textMuted}
      />
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// "⋯" sheet — the four per-row buttons of today's app, in one place
// ---------------------------------------------------------------------------

function ActionSheet({
  habit,
  bottomInset,
  onClose,
  onCalendar,
}: {
  habit: LabHabit;
  /** Banner + tab bar: the sheet's rows must sit above them. */
  bottomInset: number;
  onClose: () => void;
  onCalendar: () => void;
}) {
  const { c, lang, mode } = useLab();
  const a = MOCK_COPY[lang].habits.actions;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, {
      damping: 22,
      stiffness: 260,
      overshootClamping: true,
    });
  }, [p]);
  const dismiss = (after?: () => void) => {
    p.value = withTiming(0, { duration: 200 }, finished => {
      if (finished) scheduleOnRN(after ?? onClose);
    });
  };
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.35 * p.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * 360 }],
  }));
  const danger = mode === 'light' ? '#C8344A' : '#FF8A97';

  const rows: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    color: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'calendar-outline',
      label: a.stats,
      color: c.primary,
      onPress: () => dismiss(onCalendar),
    },
    {
      icon: 'create-outline',
      label: a.edit,
      color: c.text,
      onPress: () => dismiss(),
    },
    {
      icon: 'pause-circle-outline',
      label: a.pause,
      color: c.text,
      onPress: () => dismiss(),
    },
    {
      icon: 'trash-outline',
      label: a.delete,
      color: danger,
      onPress: () => dismiss(),
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismiss()}
        accessibilityLabel={a.cancel}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000000' },
            scrimStyle,
          ]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          contentColumn,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            paddingBottom: bottomInset + labSpace.lg,
          },
          panelStyle,
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.track }]} />
        <LabText variant="titleSm" style={{ marginBottom: labSpace.sm }}>
          {habit.name[lang]}
        </LabText>
        {rows.map(row => (
          <PressableScale
            key={row.label}
            onPress={() => {
              selection();
              row.onPress();
            }}
            haptic={null}
            pressScale={0.98}
            accessibilityLabel={row.label}
            style={[styles.sheetRow, { borderColor: c.border }]}
          >
            <Ionicons name={row.icon} size={20} color={row.color} />
            <LabText
              variant="bodyStrong"
              style={{ marginLeft: labSpace.md, color: row.color }}
            >
              {row.label}
            </LabText>
          </PressableScale>
        ))}
      </Animated.View>
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
  topActions: {
    flexDirection: 'row',
    gap: labSpace.sm,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: labSpace.md,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.md,
  },
  ringBox: {
    width: RING,
    height: RING,
    marginTop: 6,
  },
  ringNumber: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayCount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: labSpace.lg,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xxl,
    marginBottom: labSpace.md,
  },
  card: {
    padding: labSpace.md,
    paddingLeft: labSpace.lg,
    borderRadius: labRadius.md + 4,
  },
  cardGlow: {
    borderRadius: labRadius.md + 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  bonusTag: {
    marginLeft: labSpace.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: labRadius.pill,
  },
  dots: {
    flexDirection: 'row',
    gap: DOT_GAP,
    marginTop: labSpace.sm,
  },
  dotCol: {
    width: DOT_COL,
    alignItems: 'center',
  },
  dotBox: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  bar: {
    width: 10,
    height: 3,
    borderRadius: 1.5,
  },
  ripple: {
    position: 'absolute',
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotLetter: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  // └──┘ : ticks only at the two days of the pair.
  dotLink: {
    position: 'absolute',
    height: 5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  more: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popAnchor: {
    position: 'absolute',
    bottom: '100%',
    right: -6,
    marginBottom: -6,
  },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: labSpace.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: labSpace.lg,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
