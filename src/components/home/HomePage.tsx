/**
 * Home in the new look — the page (migration E11b, from the Design Lab's
 * HomeConcept). Top to bottom:
 *   1. the top row (fixed, like every tab: level badge left, buttons right);
 *   2. the date, the greeting by time of day, a quiet line;
 *   3. THE HERO — today as the sun's path over the day: one marker per planned
 *      habit, the sun moves with every check, "+N XP today", one sentence;
 *   4. the user's sections in the user's order (HomeCustomization, R-4b).
 * Scrolling hands the greeting over to a compact bar (greeting, mini arc, x/y)
 * that slides out from under the top row — it slides, never fades (it holds a
 * Skia canvas, P1–P3).
 *
 * "Today" = the habits PLANNED today, the same list and the same "done" as the
 * Habits tab (splitHabits / doneToday). The count is said once — in the hero and
 * in the compact bar that replaces it (P60). The rules are pure and tested:
 * src/screens/home/homeHeroLogic.ts.
 *
 * Motion rules kept from the lab (technical-guides:Home.md):
 * - scroll-linked motion only through the native driver (usePageScrollFrame);
 * - the sun's ambient loops run only at rest, while the hero is on screen and
 *   while this tab is focused (tabs stay mounted, R-32);
 * - the encouragement keeps two lines of room, so the hero never changes height
 *   when the sentence does (P79);
 * - finishing the day plays the arc's flare and one success haptic — only on
 *   Home, never while another tab is in front.
 * Not here yet: the launch curtain's ticks (the launch intro comes in its own
 * stage); until then Home enters with the calm "settle" timeline.
 */
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import {
  fonts,
  getDaypart,
  motion,
  radius,
  sky,
  skyGold,
  space,
  sun as sunColors,
  type,
} from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { GamificationService } from '@/src/services/gamificationService';
import { addAppEventListener } from '@/src/utils/appEvents';
import { parseDate, today as todayString } from '@/src/utils/date';
import { contentColumn, getContentWidth } from '@/src/utils/layout';
import {
  doneToday,
  scheduleLabel,
  splitHabits,
} from '@/src/screens/habits/habitListLogic';
import {
  arcOrder,
  encouragementOf,
  finishedTheDay,
  greetingKey,
} from '@/src/screens/home/homeHeroLogic';
import {
  AppText,
  Chip,
  chipColors,
  ConfirmSheet,
  DayArc,
  Divider,
  IntroProvider,
  MiniArc,
  Rise,
  RollingNumber,
  ScrollCard,
  ScrollFrameProvider,
  Surface,
  TopRow,
  useIntro,
  useIntroWindow,
  usePageScrollFrame,
  useScrollRest,
} from '@/src/components/ui';
import { HabitStatsCard } from './HabitStatsCard';
import { HomeCustomizeSheet } from './HomeCustomizeSheet';
import { JournalStreakCard } from './JournalStreakCard';
import { QuickActions } from './QuickActions';
import { TodayHabitItem, TodayHabits } from './TodayHabits';

const SCREEN_PADDING = space.xl;
/** Scroll distance over which the large greeting hands over to the compact bar. */
const COLLAPSE_START = 8;
const COLLAPSE_END = 56;
/** Past this offset the hero is behind the compact bar — its loops can rest. */
const HERO_VISIBLE_UNTIL = 460;
/** Enough to hide the compact bar completely under the top row. */
const COMPACT_HEIGHT = 64;
/** The morning light behind the top of the screen. */
const GLOW_HEIGHT = 380;
/** Ids the page draws itself; every other section comes from `renderSection`. */
const OWN_SECTIONS = new Set([
  'quickActions',
  'todayHabits',
  'journalStreak',
  'habitStats',
]);

interface HomePageProps {
  /** The top row's buttons (right side; the level badge sits left). */
  actions: ReactNode;
  /** Visible section ids in the user's order. */
  sections: string[];
  /** Sections not yet in the new look (E11c–E11e replace them). */
  renderSection: (id: string) => ReactNode;
  /** Room kept at the bottom for the ad banner. */
  bottomInset: number;
  /** Stored check; a second tap on the same habit waits for it. */
  onToggleHabit: (habitId: string) => Promise<void>;
  onOpenJournal: () => void;
  onWriteEntry: () => void;
  /**
   * Scroll a section into view (a new `key` each time): the Journal sends a
   * frozen streak here, to its rescue on the streak card.
   */
  reveal?: { id: string; key: number } | null;
  /** The customise sheet is open (the top row's button). */
  customizing: boolean;
  onCustomizeClosed: () => void;
}

export function HomePage(props: HomePageProps) {
  // Tabs stay mounted (R-32): the entrance plays once, when Home first mounts.
  return (
    <IntroProvider kind="settle" playKey={0}>
      <HomeContent {...props} />
    </IntroProvider>
  );
}

function HomeContent({
  actions,
  sections,
  renderSection,
  bottomInset,
  onToggleHabit,
  onOpenJournal,
  onWriteEntry,
  reveal,
  customizing,
  onCustomizeClosed,
}: HomePageProps) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const { timeline } = useIntro();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const focused = useIsFocused();
  const { habits, completions } = useHabitsData();
  const locale = t('common.locale');
  const today = todayString();

  // --- Today's plan (the Habits tab's own rules) --------------------------------
  const planned = useMemo(
    () => splitHabits(habits, today).planned,
    [habits, today]
  );
  const everyDay = t('habits.schedule.everyDay');
  const todayItems: TodayHabitItem[] = useMemo(
    () =>
      planned.map(habit => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        schedule: scheduleLabel(habit, today, locale, everyDay),
        done: doneToday(habit.id, completions, today),
      })),
    [planned, completions, today, locale, everyDay]
  );
  const total = todayItems.length;
  const doneCount = todayItems.filter(h => h.done).length;

  // --- Time of day -----------------------------------------------------------------
  // Re-read on focus: a tab left open overnight greets the new morning.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (focused) setNow(new Date());
  }, [focused]);
  const hour = now.getHours();
  const daypart = getDaypart(hour);
  const greeting = t(`home.greeting.${greetingKey(hour)}`);
  const greetingWords = greeting.split(' ');
  const dateLine = parseDate(today).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // --- XP today (O-9): the app's own record, refreshed whenever XP moves ---------
  const [xpToday, setXpToday] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      GamificationService.getTodayXP().then(xp => {
        if (alive) setXpToday(xp);
      });
    void load();
    // The XP is stored a moment after the event: read once more shortly after,
    // so a cached read never leaves the chip behind (as the Habits tab does).
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

  // --- The sun: intro windows × today's progress -----------------------------------
  const sunIntro = useIntroWindow(timeline.sun);
  const drawIntro = useIntroWindow(timeline.arc, 'inOut');
  const share = total > 0 ? doneCount / total : 0;
  const dayProgress = useSharedValue(share);
  useEffect(() => {
    dayProgress.value = withTiming(share, {
      duration: motion.fill + 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [share, dayProgress]);
  const sunValue = useDerivedValue(() => sunIntro.value * dayProgress.value);
  const countSource = useDerivedValue(() => sunValue.value * total);
  const goldStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(dayProgress.value, 1.6),
  }));

  // The one real celebration: finishing the day, on this screen.
  const [celebrateKey, setCelebrateKey] = useState(0);
  const prevDay = useRef<{ done: number; planned: number } | null>(null);
  useEffect(() => {
    if (finishedTheDay(prevDay.current, doneCount, total) && focused) {
      feel('dayDone');
      setCelebrateKey(k => k + 1);
    }
    prevDay.current = { done: doneCount, planned: total };
    // `focused` is read, not followed: coming back to Home is not a new finish.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneCount, total]);

  const markerLabels = useMemo(
    () =>
      arcOrder(todayItems, h => h.done).map(h => ({
        name: h.name,
        done: h.done,
        status: t(h.done ? 'home.hero.markerDone' : 'home.hero.markerOpen'),
      })),
    [todayItems, t]
  );
  const encouragement = encouragementOf(total, doneCount);
  const encouragementText =
    'count' in encouragement
      ? t(encouragement.key, { count: encouragement.count })
      : t(encouragement.key);

  // --- Scroll (native-driven) and when the sun may breathe -------------------------
  const { frame, onScroll, onLayout } = usePageScrollFrame(bottomInset, true);
  const rest = useScrollRest();
  const ambient = useSharedValue(1);
  const moving = useRef({ dragging: false, gliding: false });
  const focusedRef = useRef(focused);
  const updateAmbient = useCallback(() => {
    const on =
      focusedRef.current &&
      !moving.current.dragging &&
      !moving.current.gliding &&
      frame.getScrollY() < HERO_VISIBLE_UNTIL;
    const next = on ? 1 : 0;
    if (ambient.value !== next) ambient.value = next;
  }, [ambient, frame]);
  useEffect(() => {
    focusedRef.current = focused;
    updateAmbient();
  }, [focused, updateAmbient]);
  const setMoving = (patch: Partial<{ dragging: boolean; gliding: boolean }>) => {
    Object.assign(moving.current, patch);
    updateAmbient();
    rest.update(patch);
  };

  const { scrollY } = frame;
  const bigHeaderStyle = useMemo(
    () => ({
      opacity: scrollY.interpolate({
        inputRange: [0, COLLAPSE_END - 20],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          // Drifts at 45 % of the scroll; clamped once it is invisible anyway.
          translateY: scrollY.interpolate({
            inputRange: [0, COLLAPSE_END],
            outputRange: [0, COLLAPSE_END * 0.45],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [scrollY]
  );
  const compactStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [COLLAPSE_START, COLLAPSE_END],
            outputRange: [-COMPACT_HEIGHT, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [scrollY]
  );
  // Where the compact bar starts on screen, so its light matches the page's.
  const [topRowHeight, setTopRowHeight] = useState(insets.top + 56);

  const arcWidth = Math.min(
    getContentWidth(windowWidth) - SCREEN_PADDING * 2 - space.xl * 2,
    300
  );
  const header = timeline.header;
  const wordSpan = (header[1] - header[0]) * 0.5;
  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;
  const glow = (
    <LinearGradient
      colors={[c.canvasGlow, 'transparent']}
      style={styles.glow}
      pointerEvents="none"
    />
  );

  // "Start fresh" asks first; the sheet covers the page, so it lives here.
  const [freshConfirm, setFreshConfirm] = useState<(() => void) | null>(null);

  // Scroll a section into view (the Journal's frozen-streak redirect).
  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef<View>(null);
  const sectionRefs = useRef(new Map<string, View | null>());
  useEffect(() => {
    if (!reveal) return;
    // After the tab switch has laid the page out.
    const id = setTimeout(() => {
      const section = sectionRefs.current.get(reveal.id);
      const page = pageRef.current;
      if (!section || !page) return;
      page.measureInWindow((_px, pageY) =>
        section.measureInWindow((_x, y) => {
          const target = Math.max(
            0,
            frame.getScrollY() + y - pageY - COMPACT_HEIGHT - space.lg
          );
          scrollRef.current?.scrollTo({ y: target, animated: true });
        })
      );
    }, 350);
    return () => clearTimeout(id);
    // `frame` is stable for the read it needs (getScrollY).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal?.key]);

  const renderOwn = (id: string) => {
    if (id === 'quickActions') return <QuickActions />;
    if (id === 'journalStreak')
      return (
        <JournalStreakCard
          rest={rest.signal}
          onOpen={onOpenJournal}
          onWrite={onWriteEntry}
          onAskStartFresh={confirm => setFreshConfirm(() => confirm)}
        />
      );
    if (id === 'habitStats') return <HabitStatsCard />;
    if (id === 'todayHabits')
      return (
        <TodayHabits
          title={t('home.todayHabits')}
          habits={todayItems}
          onToggle={onToggleHabit}
        />
      );
    return null;
  };

  return (
    <View style={[styles.flex, { backgroundColor: c.canvas }]}>
      {glow}
      <View
        onLayout={e => {
          const h = e.nativeEvent.layout.height;
          setTopRowHeight(prev => (prev === h ? prev : h));
        }}
      >
        <TopRow>{actions}</TopRow>
      </View>

      <View style={styles.page} ref={pageRef} collapsable={false}>
        <ScrollFrameProvider value={frame}>
          <RNAnimated.ScrollView
            ref={scrollRef}
            style={styles.flex}
            onLayout={onLayout}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setMoving({ dragging: true })}
            onScrollEndDrag={() => setMoving({ dragging: false })}
            onMomentumScrollBegin={() => setMoving({ gliding: true })}
            onMomentumScrollEnd={() => setMoving({ gliding: false })}
            contentContainerStyle={[
              contentColumn,
              {
                paddingHorizontal: SCREEN_PADDING,
                paddingBottom: bottomInset + space.xxl,
              },
            ]}
            nativeID="main-content"
          >
            {/* The greeting replaces the old coloured header bar. */}
            <RNAnimated.View style={bigHeaderStyle}>
              <Rise window={header}>
                <AppText variant="overline" tone="muted">
                  {dateLine}
                </AppText>
              </Rise>
              <View style={styles.greetingRow}>
                {greetingWords.map((word, i) => (
                  <Rise
                    key={`${word}-${i}`}
                    window={[
                      header[0] + i * 90,
                      header[0] + i * 90 + wordSpan + 160,
                    ]}
                    distance={18}
                  >
                    <AppText variant="display">
                      {`${word}${i < greetingWords.length - 1 ? ' ' : ''}`}
                    </AppText>
                  </Rise>
                ))}
              </View>
              <Rise window={[header[0] + 180, header[1] + 120]}>
                <AppText
                  variant="body"
                  tone="muted"
                  italic
                  style={styles.subline}
                >
                  {t('home.subline')}
                </AppText>
              </Rise>
            </RNAnimated.View>

            {/* HERO — today. The one main movement here is the sun on its arc. */}
            <ScrollCard variant="hero">
              <Rise window={timeline.hero} scaleFrom={0.96} distance={16}>
                <Surface gradient={sky[mode][daypart]} style={styles.hero}>
                  {/* The sky warms as the day fills (opacity changes on a check only). */}
                  <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, goldStyle]}
                  >
                    <LinearGradient
                      colors={skyGold[mode]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[StyleSheet.absoluteFill, styles.heroGold]}
                    />
                  </Animated.View>
                  <AppText variant="overline" tone="primary">
                    {t('home.today')}
                  </AppText>
                  <View style={styles.arc}>
                    <DayArc
                      sun={sunValue}
                      draw={drawIntro}
                      width={arcWidth}
                      sunColor={sunColors[mode][daypart]}
                      markers={total}
                      rays={daypart !== 'night'}
                      ambient={ambient}
                      celebrateKey={celebrateKey}
                      markerLabels={markerLabels}
                    >
                      {total > 0 && (
                        <View style={styles.countRow}>
                          {/* Rolls with the sun: digit and sun in one motion. */}
                          <RollingNumber
                            text={`${doneCount}`}
                            source={countSource}
                            variant="number"
                          />
                          <AppText
                            variant="title"
                            tone="faint"
                            style={styles.countOf}
                          >
                            /{total}
                          </AppText>
                        </View>
                      )}
                    </DayArc>
                  </View>
                  {total > 0 && (
                    <>
                      <AppText variant="label" tone="muted" style={styles.center}>
                        {t('home.hero.habitsDone', {
                          count: total,
                          done: doneCount,
                        })}
                      </AppText>
                      <AppText
                        variant="caption"
                        tone="faint"
                        style={styles.arcHint}
                      >
                        {t('home.hero.arcHint')}
                      </AppText>
                    </>
                  )}
                  <Rise
                    window={timeline.chips}
                    scaleFrom={0.9}
                    distance={6}
                    style={styles.chipRow}
                  >
                    {/* Only today's XP: the journal streak has its own card (P60, D-3). */}
                    <Chip icon="sparkles" tone="reward">
                      <RollingNumber
                        text={t('home.hero.xpToday', { xp: xpToday })}
                        variant="caption"
                        delay={timeline.chips[0]}
                        style={{
                          color: chipColors(c, 'reward').fg,
                          fontFamily: fonts.semibold,
                        }}
                      />
                    </Chip>
                  </Rise>
                  <Divider style={styles.heroDivider} />
                  <Encouragement text={encouragementText} />
                </Surface>
              </Rise>
            </ScrollCard>

            {/* Below the hero: the user's sections, in the user's order. */}
            {sections.map((id, i) => (
              <ScrollCard key={id}>
                <Rise window={sectionWindow(i)}>
                  <View
                    ref={view => {
                      sectionRefs.current.set(id, view);
                    }}
                    collapsable={false}
                  >
                    {OWN_SECTIONS.has(id) ? (
                      renderOwn(id)
                    ) : (
                      <View style={styles.legacy}>{renderSection(id)}</View>
                    )}
                  </View>
                </Rise>
              </ScrollCard>
            ))}
          </RNAnimated.ScrollView>
        </ScrollFrameProvider>

        {/* Compact bar: takes over from the greeting once it scrolls away. */}
        <RNAnimated.View
          pointerEvents="none"
          style={[
            styles.compact,
            { backgroundColor: c.canvas, borderBottomColor: c.border },
            compactStyle,
          ]}
        >
          {/* The same light as behind the page, placed where the bar sits. */}
          <View
            style={[StyleSheet.absoluteFill, styles.compactGlowClip]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[c.canvasGlow, 'transparent']}
              style={[styles.glow, { top: -topRowHeight }]}
            />
          </View>
          <View style={[contentColumn, styles.compactInner]}>
            <AppText variant="titleSm" numberOfLines={1} style={styles.flex}>
              {greeting}
            </AppText>
            {total > 0 && (
              <>
                <MiniArc sun={sunValue} sunColor={sunColors[mode][daypart]} />
                <View
                  style={[styles.compactPill, { backgroundColor: c.primarySoft }]}
                >
                  <RollingNumber
                    text={`${doneCount}/${total}`}
                    variant="caption"
                    tone="primary"
                    style={{ fontFamily: fonts.semibold }}
                  />
                </View>
              </>
            )}
          </View>
        </RNAnimated.View>

        {customizing && (
          <HomeCustomizeSheet
            bottomInset={bottomInset}
            onClosed={onCustomizeClosed}
          />
        )}
        {freshConfirm && (
          <ConfirmSheet
            title={t('journal.warmUp.startFresh.title')}
            message={t('journal.warmUp.startFresh.message')}
            confirm={t('common.startFresh')}
            cancel={t('common.cancel')}
            icon="refresh"
            bottomInset={bottomInset}
            onClosed={() => setFreshConfirm(null)}
            onConfirm={freshConfirm}
          />
        )}
      </View>
    </View>
  );
}

/** The guide's voice. Cross-fades when the sentence changes instead of jumping. */
function Encouragement({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  // Two lines always kept (P79): the last habit changes the sentence, and a hero
  // that grows by a line moves every card below it.
  const { fontScale } = useWindowDimensions();
  const twoLines =
    2 * type.titleSm.lineHeight * Math.min(fontScale, type.titleSm.maxScale);
  const opacity = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.value = withTiming(0, { duration: motion.fast });
    const id = setTimeout(() => {
      setShown(text);
      opacity.value = withDelay(30, withTiming(1, { duration: motion.base }));
    }, motion.fast);
    return () => clearTimeout(id);
  }, [text, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 4 }],
  }));

  return (
    <Animated.View style={[styles.encouragement, { minHeight: twoLines }, style]}>
      <AppText
        variant="titleSm"
        italic
        numberOfLines={2}
        style={styles.center}
      >
        {shown}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: GLOW_HEIGHT,
  },
  greetingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: space.sm,
  },
  subline: {
    marginTop: 2,
  },
  hero: {
    alignItems: 'center',
    marginTop: space.xxl,
  },
  heroGold: {
    borderRadius: radius.lg - 1,
  },
  arc: {
    marginTop: space.md,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  countOf: {
    marginLeft: 2,
    marginBottom: 4,
  },
  center: {
    textAlign: 'center',
  },
  arcHint: {
    textAlign: 'center',
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  heroDivider: {
    marginTop: space.xl,
  },
  encouragement: {
    marginTop: space.lg,
    justifyContent: 'center',
  },
  legacy: {
    // The old cards keep their own 16 pt side margin until E11c–E11e replace
    // them: pull them out to the edge the page's padding moved them from.
    marginHorizontal: -(SCREEN_PADDING - 16),
    marginTop: space.lg,
  },
  compact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COMPACT_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SCREEN_PADDING,
    justifyContent: 'center',
  },
  compactGlowClip: {
    overflow: 'hidden',
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactPill: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginLeft: space.md,
  },
});
