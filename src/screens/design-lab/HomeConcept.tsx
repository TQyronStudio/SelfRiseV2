/**
 * Home concept for the Design Lab — look only, mock data (premium-design-plan.md, F1).
 *
 * Hierarchy: one hero (today, as the sun's path over the day), then the next small
 * step (quick actions + today's habits), then the slower stats. The real Home keeps
 * the user's own order of sections; this is the proposed default (plan R-4b).
 *
 * Motion, in order of importance:
 * 1. The entrance follows the shared intro timeline (introTimeline.tsx): greeting
 *    word by word, the hero settles, the arc draws, the sun rises to today's
 *    progress and the count ticks with it.
 * 2. Checking a habit moves the sun; finishing the last one plays the one real
 *    celebration on this screen (flare at the end of the arc + success haptic).
 * 3. Scrolling: the large greeting drifts slower than the content and hands over
 *    to a compact header — the same idea as iOS large titles, identical on Android.
 *    The hero recedes and the day lives on as a mini arc in that header.
 *    Everything scroll-linked runs on React Native's native driver (Animated.event),
 *    not Reanimated — see scrollChoreography.tsx for why (kolo 5, smooth scrolling).
 * 4. Crown layer (✨, round 3): cards surface from the bottom and stack away at the
 *    top (scrollChoreography.tsx), one marker per habit on the arc lights up as the
 *    sun passes it, the sun's rays turn slowly, and during the app launch every
 *    finished habit the sun passes gives one soft haptic tick.
 *
 * 5. Round 6 ("vyšperkovat"): digits roll like an odometer (RollingNumber), the arc
 *    is touchable (tap a marker or slide along it to meet each habit), the journal
 *    streak is a living flame with the frozen → warm-up story, the journal card
 *    grows into its detail,
 *    and the hero sky warms up as the day fills. No haptics while scrolling: a tick
 *    with no tap behind it feels like an accidental press (Petr, kolo 7).
 *
 * Checking a habit here only changes local state. Nothing is saved anywhere.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Data from the real contexts (Habits, Gratitude, Goals, Gamification), not the
 *   mock; the user's own section order/visibility stays (HomeCustomization, R-4b).
 * - Keep: native-driven scroll (lesson 1), fills start when seen (lesson 5), no
 *   haptics while scrolling (lesson 7), compact header slides, never fades.
 * - The pinned level badge sits top-left → header buttons on the right (R-10).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { contentColumn, getContentWidth } from '@/src/utils/layout';
import {
  CheckButton,
  Chip,
  chipColors,
  DayArc,
  Divider,
  IconBadge,
  LabText,
  MiniArc,
  PressableScale,
  ProgressBar,
  Rise,
  Surface,
  useLab,
} from './labPrimitives';
import {
  getDaypart,
  labFonts,
  labMotion,
  labRadius,
  labSky,
  labSkyGold,
  labSpace,
  labSun,
} from './labTokens';
import { RollingNumber } from './RollingNumber';
import { FlameState, StreakFlame } from './StreakFlame';
import { DetailRect, JournalDetailConcept } from './JournalDetailConcept';
import { useLabXp, XpPop } from './xpFlight';
import { useLabToday } from './habitsMock';
import { getLevelInfo, getXPProgress } from '@/src/services/levelCalculation';
import { useIntro, useIntroWindow } from './introTimeline';
import {
  ScrollCard,
  ScrollFrameProvider,
  seenDelay,
  useCardSeen,
} from './scrollChoreography';
import {
  formatThousands,
  MOCK_COPY,
  MOCK_HABITS,
  MOCK_STATS,
  MockHabit,
} from './mockCopy';

const SCREEN_PADDING = labSpace.xl;
const XP_PER_HABIT = 25;
/** Scroll distance over which the large greeting hands over to the compact header. */
const COLLAPSE_START = 64;
const COLLAPSE_END = 112;
const CARD_PRESS = 0.985;
/** Past this scroll offset the hero is behind the compact header — its loops can rest. */
const HERO_VISIBLE_UNTIL = 520;
/** Enough to hide the compact header completely above the page. */
const COMPACT_HEADER_HEIGHT = 64;

interface HomeConceptProps {
  /** Space the fixed banner + tab bar take at the bottom. */
  bottomInset: number;
}

export function HomeConcept({ bottomInset }: HomeConceptProps) {
  const { c, lang, mode, crown } = useLab();
  const { t, timeline } = useIntro();
  const copy = MOCK_COPY[lang];
  const { width: windowWidth } = useWindowDimensions();
  // Today's checks are shared with the Habits concept (habitsMock.tsx).
  const { done, toggle } = useLabToday();
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [flame, setFlame] = useState<FlameState>('fire');
  const [detailOrigin, setDetailOrigin] = useState<DetailRect | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const pageRef = useRef<View>(null);
  const journalCardRef = useRef<View>(null);
  const doneCount = MOCK_HABITS.filter(h => done[h.id]).length;
  const total = MOCK_HABITS.length;
  const initialDone = MOCK_HABITS.filter(h => h.done).length;
  const xpToday = MOCK_STATS.xpToday + (doneCount - initialDone) * XP_PER_HABIT;
  const now = new Date();
  const daypart = getDaypart(now.getHours());
  const greetingWords = copy.greeting(now.getHours()).split(' ');
  const dateLine = now.toLocaleDateString(copy.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const arcWidth = Math.min(
    getContentWidth(windowWidth) - SCREEN_PADDING * 2 - labSpace.xl * 2,
    300
  );
  const sep = copy.thousandsSeparator;
  const xpWord = copy.xpChipWord;
  // The level card shows the same XP as the badge — it moves when a wave of sparks has landed.
  const { settledXp } = useLabXp();
  const progressNow = getXPProgress(settledXp);
  const levelNow = progressNow.currentLevel;
  const levelTitle = getLevelInfo(levelNow).title;
  const levelProgress = progressNow.xpProgress / 100;
  const sectionStart = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)]?.[0] ?? 0;

  // --- The day: intro windows × today's progress -------------------------------
  const sunIntro = useIntroWindow(timeline.sun);
  const drawIntro = useIntroWindow(timeline.arc, 'inOut');
  const dayProgress = useSharedValue(initialDone / total);
  useEffect(() => {
    dayProgress.value = withTiming(doneCount / total, {
      duration: labMotion.fill + 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [doneCount, total, dayProgress]);
  const sun = useDerivedValue(() => sunIntro.value * dayProgress.value);
  const countSource = useDerivedValue(() => sun.value * total);

  // Launch only: one soft tick for every finished habit the rising sun passes.
  const isLaunch = timeline.curtain;
  const tick = () => selection();
  useAnimatedReaction(
    () => Math.floor(sun.value * total + 0.0001),
    (current, previous) => {
      if (
        crown &&
        isLaunch &&
        previous !== null &&
        current > previous &&
        t.value < 1
      ) {
        scheduleOnRN(tick);
      }
    }
  );

  // The one real celebration: the user finishes the day (never on mount).
  const prevDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount === total && prevDone.current < total) {
      notification(NotificationFeedbackType.Success);
      setCelebrateKey(k => k + 1);
    }
    prevDone.current = doneCount;
  }, [doneCount, total]);

  // --- Scroll: parallax greeting → compact header ------------------------------
  // The offset lives in a native-driven Animated.Value: views follow it without JS
  // or commits per frame. JS only hears about the scroll for cheap one-off checks.
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const lastScrollY = useRef(0);
  const listeners = useRef(new Set<(y: number) => void>());
  const [viewportHeight, setViewportHeight] = useState(0);
  // The arc's ambient loops run only at rest and while the hero is on screen.
  const ambient = useSharedValue(1);
  const dragging = useRef(false);
  const gliding = useRef(false);
  const updateAmbient = () => {
    const on =
      !dragging.current &&
      !gliding.current &&
      lastScrollY.current < HERO_VISIBLE_UNTIL;
    const next = on ? 1 : 0;
    if (ambient.value !== next) ambient.value = next;
  };

  const onScroll = useMemo(
    () =>
      RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = e.nativeEvent.contentOffset.y;
          lastScrollY.current = y;
          listeners.current.forEach(fn => fn(y));
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
  // Slides down instead of fading: fading a view that holds a Skia canvas makes the
  // OS composite it off-screen on every frame of the scroll.
  const compactStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [COLLAPSE_START, COLLAPSE_END],
            outputRange: [-COMPACT_HEADER_HEIGHT, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [scrollY]
  );

  // The arc's markers: finished habits first, so the lit markers are the done ones.
  const arcLabels = [
    ...MOCK_HABITS.filter(h => done[h.id]),
    ...MOCK_HABITS.filter(h => !done[h.id]),
  ].map(h => ({
    name: h.name[lang],
    done: !!done[h.id],
    status: done[h.id] ? copy.markerDone : copy.markerOpen,
  }));
  const goldStyle = useAnimatedStyle(() => ({
    opacity: Math.pow(dayProgress.value, 1.6),
  }));

  const openJournal = () => {
    const page = pageRef.current;
    const card = journalCardRef.current;
    if (!page || !card) return;
    page.measureInWindow((pageX, pageY) => {
      card.measureInWindow((x, y, width, height) => {
        selection();
        setDetailOrigin({ x: x - pageX, y: y - pageY, width, height });
      });
    });
  };

  const headerWindow = timeline.header;
  const wordSpan = (headerWindow[1] - headerWindow[0]) * 0.5;

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
        <RNAnimated.ScrollView
          style={{ flex: 1 }}
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            setViewportHeight(prev => (prev === h ? prev : h));
          }}
          onScrollBeginDrag={() => {
            dragging.current = true;
            updateAmbient();
          }}
          onScrollEndDrag={() => {
            dragging.current = false;
            updateAmbient();
          }}
          onMomentumScrollBegin={() => {
            gliding.current = true;
            updateAmbient();
          }}
          onMomentumScrollEnd={() => {
            gliding.current = false;
            updateAmbient();
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
          {/* Morning light behind the top of the screen — static, scrolls away with the content. */}
          <LinearGradient
            colors={[c.canvasGlow, 'transparent']}
            style={styles.glow}
            pointerEvents="none"
          />

          {/* Greeting replaces the coloured header bar. */}
          <RNAnimated.View style={[styles.header, bigHeaderStyle]}>
            {/* Left of this row sits the level badge, pinned by the lab screen so it
                stays when the header scrolls away (it is on every screen). */}
            <View style={styles.topRow}>
              <Rise window={headerWindow} style={styles.headerButtons}>
                <RoundButton
                  icon="trophy"
                  tint={c.rewardText}
                  background={c.rewardSoft}
                  label="Trophies"
                />
                <RoundButton
                  icon="options-outline"
                  tint={c.textMuted}
                  background={c.surface}
                  label="Customize"
                />
              </Rise>
            </View>
            <View>
              <Rise window={headerWindow}>
                <LabText variant="overline" tone="muted">
                  {dateLine}
                </LabText>
              </Rise>
              <View style={styles.greetingRow}>
                {greetingWords.map((word, i) => (
                  <Rise
                    key={`${word}-${i}`}
                    window={[
                      headerWindow[0] + i * 90,
                      headerWindow[0] + i * 90 + wordSpan + 160,
                    ]}
                    distance={18}
                  >
                    <LabText variant="display">{`${word}${i < greetingWords.length - 1 ? ' ' : ''}`}</LabText>
                  </Rise>
                ))}
              </View>
              <Rise window={[headerWindow[0] + 180, headerWindow[1] + 120]}>
                <LabText
                  variant="body"
                  tone="muted"
                  italic
                  style={{ marginTop: 2 }}
                >
                  {copy.subline}
                </LabText>
              </Rise>
            </View>
          </RNAnimated.View>

          {/* HERO — today. The one main movement on the screen is the sun travelling the arc. */}
          <ScrollCard variant="hero">
            <Rise window={timeline.hero} scaleFrom={0.96} distance={16}>
              <Surface
                gradient={labSky[mode][daypart]}
                style={{ alignItems: 'center', marginTop: labSpace.xxl }}
              >
                {/* The sky warms as the day fills (opacity only changes on a check). */}
                <Animated.View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFill, goldStyle]}
                >
                  <LinearGradient
                    colors={labSkyGold[mode]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: labRadius.lg - 1 },
                    ]}
                  />
                </Animated.View>
                <LabText variant="overline" tone="primary">
                  {copy.today}
                </LabText>
                <View style={{ marginTop: labSpace.md }}>
                  <DayArc
                    sun={sun}
                    draw={drawIntro}
                    width={arcWidth}
                    sunColor={labSun[mode][daypart]}
                    markers={total}
                    rays={crown && daypart !== 'night'}
                    ambient={ambient}
                    celebrateKey={celebrateKey}
                    markerLabels={arcLabels}
                  >
                    <View style={styles.countRow}>
                      {/* Rolls continuously with the sun, digit and sun in one motion. */}
                      <RollingNumber
                        text={`${doneCount}`}
                        source={countSource}
                        variant="number"
                      />
                      <LabText
                        variant="title"
                        tone="faint"
                        style={{ marginLeft: 2, marginBottom: 4 }}
                      >
                        /{total}
                      </LabText>
                    </View>
                  </DayArc>
                </View>
                <LabText
                  variant="label"
                  tone="muted"
                  style={{ textAlign: 'center' }}
                >
                  {copy.habitsDone(doneCount, total)}
                </LabText>
                <LabText
                  variant="caption"
                  tone="faint"
                  style={{ textAlign: 'center', marginTop: 2 }}
                >
                  {copy.arcHint}
                </LabText>
                <Rise
                  window={timeline.chips}
                  scaleFrom={0.9}
                  distance={6}
                  style={styles.chipRow}
                >
                  <Chip
                    icon="flame"
                    label={copy.streakChip(MOCK_STATS.streakDays)}
                    tone="flame"
                  />
                  <Chip icon="sparkles" tone="reward">
                    <RollingNumber
                      text={`+${xpToday} XP ${xpWord}`}
                      variant="caption"
                      delay={timeline.chips[0]}
                      style={{
                        color: chipColors(c, 'reward').fg,
                        fontFamily: labFonts.semibold,
                      }}
                    />
                  </Chip>
                </Rise>
                <Divider style={{ marginTop: labSpace.xl }} />
                <Encouragement
                  text={copy.encouragement(total - doneCount, doneCount)}
                />
              </Surface>
            </Rise>
          </ScrollCard>

          {/* The next small step. */}
          <ScrollCard>
            <Rise
              window={timeline.sections[0] ?? timeline.hero}
              style={styles.quickRow}
            >
              <QuickTile
                icon="add"
                label={copy.quick.addHabit}
                tint={c.primary}
                background={c.primarySoft}
              />
              <QuickTile
                icon="heart"
                label={copy.quick.gratitude}
                tint={c.habit.pink}
                background={`${c.habit.pink}22`}
              />
              <QuickTile
                icon="star"
                label={copy.quick.selfPraise}
                tint={c.successText}
                background={c.successSoft}
              />
              <QuickTile
                icon="flag"
                label={copy.quick.addGoal}
                tint={c.flame}
                background={c.flameSoft}
              />
            </Rise>
          </ScrollCard>

          <ScrollCard>
            <Rise window={timeline.sections[1] ?? timeline.hero}>
              <SectionHeader
                title={copy.todaysHabits}
                trailing={
                  <RollingNumber text={`${doneCount}/${total}`} tone="muted" />
                }
              />
              <Surface
                style={{
                  paddingVertical: labSpace.sm,
                  paddingHorizontal: labSpace.md,
                }}
              >
                {MOCK_HABITS.map((habit, i) => (
                  <View key={habit.id}>
                    {i > 0 && <Divider style={{ marginLeft: 60 }} />}
                    <HabitRow
                      habit={habit}
                      done={!!done[habit.id]}
                      onToggle={() => toggle(habit.id)}
                    />
                  </View>
                ))}
              </Surface>
            </Rise>
          </ScrollCard>

          {/* Level */}
          <ScrollCard>
            <Rise window={timeline.sections[2] ?? timeline.hero}>
              <PressableScale
                pressScale={CARD_PRESS}
                accessibilityLabel={copy.level(levelNow)}
              >
                <Surface style={{ marginTop: labSpace.lg }}>
                  <View style={styles.levelRow}>
                    <LinearGradient
                      colors={c.tierGreen}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.levelBadge}
                    >
                      <LabText
                        variant="bodyStrong"
                        tone="onPrimary"
                        style={styles.levelNumber}
                      >
                        {levelNow}
                      </LabText>
                    </LinearGradient>
                    <View style={{ flex: 1, marginLeft: labSpace.md }}>
                      <LabText variant="overline" tone="muted">
                        {copy.level(levelNow)}
                      </LabText>
                      <LabText variant="title" numberOfLines={1}>
                        {levelTitle}
                      </LabText>
                    </View>
                    <RollingNumber
                      text={`${formatThousands(settledXp, sep)} XP`}
                      tone="muted"
                      delay={sectionStart(2) + 150}
                    />
                  </View>
                  <ProgressBar
                    progress={levelProgress}
                    colors={c.primaryGradient}
                    delay={sectionStart(2) + 150}
                    style={{ marginTop: labSpace.lg }}
                  />
                  <LabText
                    variant="caption"
                    tone="muted"
                    style={{ marginTop: labSpace.sm }}
                  >
                    {copy.toNext(
                      formatThousands(progressNow.xpToNextLevel, sep),
                      levelNow + 1
                    )}
                  </LabText>
                </Surface>
              </PressableScale>
            </Rise>
          </ScrollCard>

          {/* Journal streak */}
          <ScrollCard>
            <Rise window={timeline.sections[3] ?? timeline.hero}>
              {/* The original hides while its detail is open — one card, not two. */}
              <View
                ref={journalCardRef}
                collapsable={false}
                style={{
                  marginTop: labSpace.lg,
                  opacity: detailOrigin ? 0 : 1,
                }}
              >
                <PressableScale
                  pressScale={CARD_PRESS}
                  haptic={null}
                  onPress={openJournal}
                  accessibilityLabel={copy.journalStreak}
                >
                  <Surface>
                    <View style={styles.spaceBetween}>
                      <LabText variant="titleSm">{copy.journalStreak}</LabText>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={c.textFaint}
                      />
                    </View>
                    <View style={styles.streakRow}>
                      <StreakFlame
                        state={flame}
                        onStateChange={setFlame}
                        size={56}
                        label={copy.flameHint}
                      />
                      <LabText variant="display" style={styles.streakNumber}>
                        {MOCK_STATS.journalStreak}
                      </LabText>
                      <LabText
                        variant="label"
                        tone="muted"
                        style={{ marginLeft: labSpace.sm, marginBottom: 10 }}
                      >
                        {copy.days}
                      </LabText>
                      <View style={{ flex: 1 }} />
                      {flame === 'fire' && (
                        <Chip
                          icon="checkmark-circle"
                          label={copy.streakActive}
                          tone="success"
                        />
                      )}
                      {flame === 'ice' && (
                        <Chip
                          icon="snow"
                          label={copy.streakFrozen}
                          tone="primary"
                        />
                      )}
                      {flame === 'warming' && (
                        <Chip
                          icon="sunny"
                          label={copy.streakWarming}
                          tone="reward"
                        />
                      )}
                    </View>
                    <LabText
                      variant="caption"
                      tone="faint"
                      style={{ marginTop: 2 }}
                    >
                      {copy.flameHint}
                    </LabText>
                    <Divider style={{ marginTop: labSpace.lg }} />
                    <View style={styles.journalMeta}>
                      <View style={styles.dotsRow}>
                        {[0, 1, 2].map(i => (
                          <View
                            key={i}
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  i < MOCK_STATS.journalToday
                                    ? c.primary
                                    : c.track,
                              },
                            ]}
                          />
                        ))}
                        <LabText
                          variant="caption"
                          tone="muted"
                          style={{ marginLeft: labSpace.sm }}
                        >
                          {copy.entriesToday(MOCK_STATS.journalToday)}
                        </LabText>
                      </View>
                      <View style={styles.badgesRow}>
                        <Badge emoji="⭐" count={MOCK_STATS.stars} />
                        <Badge emoji="🔥" count={MOCK_STATS.flames} />
                        <Badge emoji="👑" count={MOCK_STATS.crowns} />
                      </View>
                    </View>
                    <PressableScale
                      style={[
                        styles.quietButton,
                        { backgroundColor: c.primarySoft },
                      ]}
                      accessibilityLabel={copy.writeEntry}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={c.primary}
                        style={{ marginRight: labSpace.sm }}
                      />
                      <LabText variant="bodyStrong" tone="primary">
                        {copy.writeEntry}
                      </LabText>
                    </PressableScale>
                  </Surface>
                </PressableScale>
              </View>
            </Rise>
          </ScrollCard>

          {/* Monthly challenge */}
          <ScrollCard>
            <Rise window={timeline.sections[4] ?? timeline.hero}>
              <PressableScale
                pressScale={CARD_PRESS}
                accessibilityLabel={copy.challengeTitle}
              >
                <Surface style={{ marginTop: labSpace.lg }}>
                  <View style={styles.spaceBetween}>
                    <LabText
                      variant="overline"
                      tone="primary"
                      style={{ flexShrink: 1 }}
                    >
                      {copy.challengeOverline}
                    </LabText>
                    <View style={{ flexDirection: 'row' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <Ionicons
                          key={i}
                          name={
                            i <= MOCK_STATS.challengeStars
                              ? 'star'
                              : 'star-outline'
                          }
                          size={14}
                          color={
                            i <= MOCK_STATS.challengeStars
                              ? c.reward
                              : c.textFaint
                          }
                          style={{ marginLeft: 2 }}
                        />
                      ))}
                    </View>
                  </View>
                  <LabText variant="title" style={{ marginTop: labSpace.sm }}>
                    {copy.challengeTitle}
                  </LabText>
                  <LabText
                    variant="body"
                    tone="muted"
                    style={{ marginTop: labSpace.xs }}
                  >
                    {copy.challengeGoal(MOCK_STATS.challengeTarget)}
                  </LabText>
                  <ProgressBar
                    progress={
                      MOCK_STATS.challengeDone / MOCK_STATS.challengeTarget
                    }
                    colors={c.primaryGradient}
                    delay={sectionStart(4) + 150}
                    style={{ marginTop: labSpace.lg }}
                  />
                  <View
                    style={[styles.spaceBetween, { marginTop: labSpace.sm }]}
                  >
                    <LabText variant="caption">
                      {copy.challengeProgress(
                        MOCK_STATS.challengeDone,
                        MOCK_STATS.challengeTarget
                      )}
                    </LabText>
                    <LabText variant="caption" tone="muted">
                      {copy.challengeDay(
                        MOCK_STATS.monthDay,
                        MOCK_STATS.monthDays
                      )}
                    </LabText>
                  </View>
                </Surface>
              </PressableScale>
            </Rise>
          </ScrollCard>

          {/* This week */}
          <ScrollCard>
            <Rise window={timeline.sections[5] ?? timeline.hero}>
              <Surface style={{ marginTop: labSpace.lg }}>
                <View style={styles.spaceBetween}>
                  <LabText variant="titleSm">{copy.thisWeek}</LabText>
                  <Chip tone="primary">
                    <RollingNumber
                      text={copy.consistent(73)}
                      variant="caption"
                      delay={sectionStart(5) + 150}
                      style={{
                        color: chipColors(c, 'primary').fg,
                        fontFamily: labFonts.semibold,
                      }}
                    />
                  </Chip>
                </View>
                <View style={styles.weekRow}>
                  {MOCK_STATS.week.map((value, i) => (
                    <WeekBar
                      key={i}
                      delay={sectionStart(5) + 150 + i * 45}
                      value={value}
                      max={MOCK_STATS.weekTotal}
                      label={copy.weekdays[i] ?? ''}
                      isToday={i === MOCK_STATS.todayIndex}
                    />
                  ))}
                </View>
              </Surface>
            </Rise>
          </ScrollCard>
        </RNAnimated.ScrollView>

        {/* Compact header: takes over from the large greeting once it scrolls away. */}
        <RNAnimated.View
          style={[
            styles.compactHeader,
            { backgroundColor: c.canvas, borderBottomColor: c.border },
            compactStyle,
          ]}
          pointerEvents="none"
        >
          <View style={[contentColumn, styles.compactInner]}>
            <LabText variant="titleSm" numberOfLines={1} style={{ flex: 1 }}>
              {copy.greeting(now.getHours())}
            </LabText>
            <MiniArc sun={sun} sunColor={labSun[mode][daypart]} />
            <View
              style={[styles.compactPill, { backgroundColor: c.primarySoft }]}
            >
              <RollingNumber
                text={`${doneCount}/${total}`}
                variant="caption"
                tone="primary"
                style={{ fontFamily: labFonts.semibold }}
              />
            </View>
          </View>
        </RNAnimated.View>

        {detailOrigin && pageSize.width > 0 && (
          <JournalDetailConcept
            origin={detailOrigin}
            size={pageSize}
            bottomInset={bottomInset}
            onClosed={() => setDetailOrigin(null)}
          />
        )}
      </View>
    </ScrollFrameProvider>
  );
}

// ---------------------------------------------------------------------------
// Section pieces
// ---------------------------------------------------------------------------

/** The guide's voice. Cross-fades when the sentence changes instead of jumping. */
function Encouragement({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const opacity = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.value = withTiming(0, { duration: labMotion.fast });
    const id = setTimeout(() => {
      setShown(text);
      opacity.value = withDelay(
        30,
        withTiming(1, { duration: labMotion.base })
      );
    }, labMotion.fast);
    return () => clearTimeout(id);
  }, [text, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * 4 }],
  }));

  return (
    <Animated.View style={[{ marginTop: labSpace.lg }, style]}>
      <LabText variant="titleSm" italic style={{ textAlign: 'center' }}>
        {shown}
      </LabText>
    </Animated.View>
  );
}

/** A habit: the row warms up when done and the icon gives a small, happy bounce. */
function HabitRow({
  habit,
  done,
  onToggle,
}: {
  habit: MockHabit;
  done: boolean;
  onToggle: () => void;
}) {
  const { c, lang } = useLab();
  const { award } = useLabXp();
  const checkRef = useRef<View>(null);
  const [pops, setPops] = useState<{ key: number; amount: number }[]>([]);
  const glow = useSharedValue(done ? 1 : 0);
  const bounce = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    glow.value = withTiming(done ? 1 : 0, { duration: labMotion.base });
    if (mounted.current && done) {
      bounce.value = withSequence(
        withSpring(1.14, { damping: 10, stiffness: 420 }),
        withSpring(1, { damping: 12, stiffness: 260 })
      );
    }
    mounted.current = true;
  }, [done, glow, bounce]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));
  const nameStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.25 * glow.value,
  }));

  return (
    <View style={styles.habitRow}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.habitGlow,
          { backgroundColor: c.successSoft },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View style={badgeStyle}>
        <IconBadge icon={habit.icon} color={c.habit[habit.color]} />
      </Animated.View>
      <Animated.View style={[{ flex: 1, marginLeft: labSpace.md }, nameStyle]}>
        <LabText variant="bodyStrong" numberOfLines={2}>
          {habit.name[lang]}
        </LabText>
        <LabText variant="caption" tone="muted" style={{ marginTop: 2 }}>
          {habit.schedule[lang]}
        </LabText>
      </Animated.View>
      <View ref={checkRef} collapsable={false}>
        <CheckButton
          done={done}
          label={habit.name[lang]}
          onToggle={() => {
            const amount = done ? -XP_PER_HABIT : XP_PER_HABIT;
            onToggle();
            const key = Date.now();
            setPops(prev => [...prev, { key, amount }]);
            setTimeout(
              () => setPops(prev => prev.filter(p => p.key !== key)),
              1100
            );
            // Taking XP back flies nothing — the badge's ring simply drains.
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
  );
}

function RoundButton({
  icon,
  tint,
  background,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  background: string;
  label: string;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      accessibilityLabel={label}
      pressScale={0.92}
      style={[
        styles.roundButton,
        { backgroundColor: background, borderColor: c.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={tint} />
    </PressableScale>
  );
}

function QuickTile({
  icon,
  label,
  tint,
  background,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  tint: string;
  background: string;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      accessibilityLabel={label}
      pressScale={0.95}
      style={[
        styles.quickTile,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          boxShadow: c.shadow,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <LabText
        variant="caption"
        numberOfLines={2}
        style={{ marginTop: labSpace.sm, textAlign: 'center' }}
      >
        {label}
      </LabText>
    </PressableScale>
  );
}

function SectionHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.spaceBetween,
        { marginTop: labSpace.xxl, marginBottom: labSpace.md },
      ]}
    >
      <LabText variant="title">{title}</LabText>
      {trailing}
    </View>
  );
}

function Badge({ emoji, count }: { emoji: string; count: number }) {
  return (
    <View style={styles.badge}>
      <LabText variant="label">{emoji}</LabText>
      <LabText variant="numberSm" style={{ marginLeft: 4 }}>
        {count}
      </LabText>
    </View>
  );
}

const BAR_HEIGHT = 84;

/** One day of the week. The bar slides up (translateY) inside its track — no squashed corners. */
function WeekBar({
  delay,
  value,
  max,
  label,
  isToday,
}: {
  delay: number;
  value: number | null;
  max: number;
  label: string;
  isToday: boolean;
}) {
  const { c } = useLab();
  const fill = useSharedValue(0);
  const target = value === null ? 0 : value / max;

  const { seen, seenAfter } = useCardSeen();
  const startIn = seenDelay(seenAfter, delay);

  useEffect(() => {
    if (!seen) return;
    fill.value = withDelay(
      startIn,
      withTiming(target, {
        duration: labMotion.slow + 100,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [target, startIn, fill, seen]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - fill.value) * BAR_HEIGHT }],
  }));

  return (
    <View style={styles.weekColumn}>
      <View style={[styles.weekTrack, { backgroundColor: c.track }]}>
        <Animated.View style={[StyleSheet.absoluteFill, barStyle]}>
          {isToday ? (
            <LinearGradient
              colors={c.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.weekFill}
            />
          ) : (
            <View
              style={[
                styles.weekFill,
                { backgroundColor: c.primary, opacity: 0.32 },
              ]}
            />
          )}
        </Animated.View>
      </View>
      <LabText
        variant="caption"
        tone={isToday ? 'primary' : 'muted'}
        style={[
          { marginTop: labSpace.sm },
          isToday && { fontFamily: labFonts.bold },
        ]}
      >
        {label}
      </LabText>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: -SCREEN_PADDING,
    right: -SCREEN_PADDING,
    height: 380,
  },
  header: {
    marginTop: labSpace.sm,
  },
  topRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: labSpace.md,
  },
  greetingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: labSpace.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: labSpace.sm,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: labSpace.sm,
    marginTop: labSpace.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.lg,
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: labSpace.lg,
    paddingHorizontal: labSpace.xs,
    borderRadius: labRadius.md + 4,
    borderWidth: 1,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.md,
    paddingHorizontal: labSpace.sm,
  },
  popAnchor: {
    position: 'absolute',
    bottom: '100%',
    right: -6,
    marginBottom: -6,
  },
  habitGlow: {
    top: 4,
    bottom: 4,
    borderRadius: labRadius.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontFamily: labFonts.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: labSpace.sm,
  },
  streakNumber: {
    fontSize: 52,
    lineHeight: 58,
  },
  journalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: labSpace.sm,
    marginTop: labSpace.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: labSpace.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quietButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.lg,
    paddingVertical: labSpace.md,
    borderRadius: labRadius.pill,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: labSpace.xl,
  },
  weekColumn: {
    alignItems: 'center',
    flex: 1,
  },
  weekTrack: {
    width: 22,
    height: BAR_HEIGHT,
    borderRadius: 11,
    overflow: 'hidden',
  },
  weekFill: {
    flex: 1,
    borderRadius: 11,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: labSpace.md,
  },
  compactInner: {
    flexDirection: 'row',
    alignItems: 'center',
    // Room for the pinned level badge on the left.
    paddingLeft: 60,
  },
  compactPill: {
    paddingHorizontal: labSpace.md,
    paddingVertical: 4,
    borderRadius: labRadius.pill,
    marginLeft: labSpace.md,
  },
});
