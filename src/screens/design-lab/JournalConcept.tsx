/**
 * My Journal concept for the Design Lab (premium-design-plan.md, F1, kolo 20).
 *
 * Composition, top to bottom (the order of today's screen, technical-guides:
 * My-Journal.md — the Daily Inspiration stays above today's entries, always):
 *   1. Title + quiet actions (History = calendar, Statistics) — the level badge sits
 *      pinned on the left.
 *   2. TODAY — the count, three segments for the daily three, the streak flame.
 *      The third entry completes the day IN PLACE (no "congratulations" modal):
 *      the segments turn green, the card glows once, the streak number rolls on.
 *      After three, the BONUS ROAD opens: positions 4–13 with ⭐ 🔥 👑 on it.
 *   3. Write — two tiles (gratitude, self-praise), each showing what the next entry
 *      earns. A frozen streak locks them BEFORE typing (today's app lets you write,
 *      then throws the text away on save) and offers the warm-up right here.
 *   4. Daily Inspiration — the app's own quotes.
 *   5. Today's entries — numbered 1..N, ⋯ = edit / delete; a deletion renumbers
 *      the day (the numbers roll) and takes back the LAST position's XP.
 *
 * Tap the flame for the frozen-streak preview (2 days of debt) — the warm-up plays
 * simulated ads; "Start Fresh" resets the streak to 0.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Data and rules from GratitudeContext / SQLiteGratitudeStorage, never from
 *   journalMock. XP from the storage layer (it already awards it on create).
 * - The debt gate stays authoritative in the save path (Math.max of saved and
 *   calculated frozen days) — the locked tiles are UX on top, not a replacement.
 * - Daily-complete modal → in-place moment, and the warm-up inside the journal:
 *   both are behaviour changes → decision R-13 / R-14 first.
 * - Keep the ad banner hidden while the keyboard is up (journal.tsx does it).
 * - Native-driven scroll (lesson 1); entry cards transform only (lesson 2).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  getDailyQuote,
  getRandomQuoteFromCategory,
  MotivationalQuote,
} from '@/src/data/motivationalQuotes';
import {
  Divider,
  IconBadge,
  LabText,
  PressableScale,
  ProgressBar,
  Rise,
  Surface,
  useLab,
} from './labPrimitives';
import { labFonts, LabPalette, labRadius, labSpace } from './labTokens';
import { useIntro } from './introTimeline';
import { ScrollCard, ScrollFrameProvider } from './scrollChoreography';
import { RollingNumber } from './RollingNumber';
import { MOCK_COPY } from './mockCopy';
import { useLabXpAward } from './xpFlight';
import { FlameState, StreakFlame } from './StreakFlame';
import { dateKey } from './habitsMock';
import {
  DAILY_GOAL,
  entryXp,
  EntryType,
  LabEntry,
  milestoneAt,
  MilestoneKind,
  milestoneXp,
  useLabJournal,
} from './journalMock';
import {
  AdSimulation,
  ComposerMode,
  ConfirmSheet,
  EntryActionsSheet,
  EntryCard,
  EntryComposer,
  iceColors,
  MILESTONE_EMOJI,
  MilestoneMoment,
  SlidePage,
  typeLook,
  useJournalT,
} from './journalParts';
import { JournalHistoryConcept } from './JournalHistoryConcept';
import { JournalStatsConcept } from './JournalStatsConcept';

const SCREEN_PADDING = labSpace.xl;
const FROZEN_PREVIEW_DAYS = 2;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function JournalConcept({ bottomInset }: { bottomInset: number }) {
  const { lang, crown } = useLab();
  const { timeline } = useIntro();
  const copy = MOCK_COPY[lang];
  const t = useJournalT();
  const journal = useLabJournal();
  const award = useLabXpAward();
  const reducedMotion = useReducedMotion();
  const todayKey = dateKey(journal.today);
  const todays = journal.entriesOn(todayKey);
  const count = todays.length;

  const [freshId, setFreshId] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const [actionsFor, setActionsFor] = useState<{
    entry: LabEntry;
    position: number;
  } | null>(null);
  const [deleting, setDeleting] = useState<LabEntry | null>(null);
  const [moment, setMoment] = useState<{
    kind: MilestoneKind;
    xp: number;
  } | null>(null);
  const [page, setPage] = useState<'history' | 'stats' | null>(null);
  const [ad, setAd] = useState(false);
  const [confirmFresh, setConfirmFresh] = useState(false);
  const [flame, setFlame] = useState<FlameState>('fire');
  /** "Start Fresh" preview: the streak starts again from 0. */
  const [freshStart, setFreshStart] = useState(false);

  const frozen = journal.frozen;
  const streak = freshStart
    ? count >= DAILY_GOAL
      ? 1
      : 0
    : journal.stats.currentStreak;

  // --- Native-driven scroll (see scrollChoreography.tsx for why) -------------------
  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef<View>(null);
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

  // A new or edited entry: bring its card into view once the XP has landed.
  const entryRefs = useRef(new Map<string, View | null>());
  useEffect(() => {
    if (!freshId) return undefined;
    const id = setTimeout(() => {
      const root = pageRef.current;
      const card = entryRefs.current.get(freshId);
      if (!root || !card) return;
      root.measureInWindow((_px, py, _pw, ph) => {
        card.measureInWindow((_x, y, _w, h) => {
          const bottomLimit = py + ph - bottomInset - labSpace.lg;
          if (y >= py && y + h <= bottomLimit) return; // already visible
          scrollRef.current?.scrollTo({
            y: Math.max(0, lastScrollY.current + y + h - bottomLimit),
            animated: true,
          });
        });
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [freshId, bottomInset]);

  // --- Actions ----------------------------------------------------------------------
  const startWriting = (type: EntryType) => {
    if (frozen) {
      notification(NotificationFeedbackType.Warning);
      return;
    }
    setComposer({ kind: 'new', type });
  };

  const saveEntry = (
    mode: ComposerMode,
    type: EntryType,
    text: string,
    from: { x: number; y: number } | undefined
  ) => {
    if (mode.kind === 'edit') {
      journal.edit(mode.entry.id, text);
      setFreshId(null);
      setTimeout(() => setFreshId(mode.entry.id), 0);
      return;
    }
    const { id, position } = journal.add(type, text);
    const xp = entryXp(position);
    if (xp > 0) award(xp, from);
    setFreshId(id);
    const kind = milestoneAt(position);
    if (kind) {
      const bonusXp = milestoneXp(position);
      setTimeout(() => setMoment({ kind, xp: bonusXp }), 1500);
    }
  };

  const confirmDelete = (entry: LabEntry) => {
    // Takes back the value of the day's LAST position (the day renumbers 1..N-1).
    const back = journal.remove(entry.id);
    if (back > 0) award(-back);
  };

  const onFlame = (next: FlameState) => {
    if (next === 'ice') {
      setFreshStart(false);
      journal.setFrozen({ days: FROZEN_PREVIEW_DAYS, paid: 0 });
      setFlame('ice');
    } else if (next === 'fire') {
      journal.setFrozen(null);
      setFlame('fire');
    }
    // 'warming' from a tap on the ice is ignored: only paying warms the streak.
  };

  const adWatched = () => {
    setAd(false);
    if (!frozen) return;
    const paid = frozen.paid + 1;
    journal.setFrozen({ ...frozen, paid });
    if (paid >= frozen.days) {
      if (reducedMotion) onFlame('fire');
      else setFlame('warming');
    }
  };

  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;
  const dateLine = journal.today.toLocaleDateString(copy.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
                icon="calendar-outline"
                label={t('journal.history')}
                onPress={() => setPage('history')}
              />
              <TopButton
                icon="stats-chart-outline"
                label={t('journal.statistics')}
                onPress={() => setPage('stats')}
              />
            </Rise>
          </View>
          <Rise window={timeline.header}>
            <LabText variant="overline" tone="muted">
              {dateLine}
            </LabText>
            <LabText variant="display" style={{ marginTop: labSpace.sm }}>
              {t('journal.title')}
            </LabText>
            <LabText
              variant="body"
              tone="muted"
              italic
              style={{ marginTop: 2 }}
            >
              {copy.journal.subline}
            </LabText>
          </Rise>

          {/* Today */}
          <ScrollCard variant="hero">
            <Rise window={timeline.hero} scaleFrom={0.97}>
              <TodayCard
                count={count}
                streak={streak}
                longest={journal.stats.longestStreak}
                flame={flame}
                frozen={!!frozen}
                onFlame={onFlame}
                onOpenStats={() => setPage('stats')}
              />
            </Rise>
          </ScrollCard>

          {/* Write — or warm up first */}
          <ScrollCard>
            <Rise window={sectionWindow(0)}>
              {frozen && (
                <FrozenCard
                  days={frozen.days}
                  paid={frozen.paid}
                  warming={flame === 'warming'}
                  onWarmUp={() => setAd(true)}
                  onStartFresh={() => setConfirmFresh(true)}
                />
              )}
              <View style={styles.tiles}>
                {(['gratitude', 'self-praise'] as EntryType[]).map(type => (
                  <WriteTile
                    key={type}
                    type={type}
                    nextPosition={count + 1}
                    locked={!!frozen}
                    onPress={() => startWriting(type)}
                  />
                ))}
              </View>
            </Rise>
          </ScrollCard>

          {/* Daily inspiration — always, above today's entries (guide, 2026-10-04) */}
          <ScrollCard>
            <Rise window={sectionWindow(1)}>
              <QuoteCard dateKeyToday={todayKey} />
            </Rise>
          </ScrollCard>

          {/* Today's entries */}
          <ScrollCard>
            <Rise window={sectionWindow(2)}>
              <View style={styles.sectionTitle}>
                <LabText variant="title" style={{ flex: 1 }}>
                  {t('journal.today')}
                </LabText>
                <RollingNumber
                  text={copy.journal.entries(count)}
                  variant="label"
                  tone="muted"
                />
              </View>
              {count === 0 ? (
                <EmptyDay />
              ) : (
                todays.map((entry, i) => (
                  <Animated.View
                    key={entry.id}
                    ref={(node: View | null) => {
                      entryRefs.current.set(entry.id, node);
                    }}
                    collapsable={false}
                    entering={FadeInDown.duration(320)}
                    exiting={FadeOut.duration(180)}
                    layout={LinearTransition.duration(260)}
                    style={{ marginTop: labSpace.md }}
                  >
                    <EntryCard
                      entry={entry}
                      position={i + 1}
                      fresh={freshId === entry.id}
                      onMore={() => {
                        selection();
                        setActionsFor({ entry, position: i + 1 });
                      }}
                    />
                  </Animated.View>
                ))
              )}
            </Rise>
          </ScrollCard>
        </RNAnimated.ScrollView>

        {page && pageSize.width > 0 && (
          <SlidePage
            key={page}
            width={pageSize.width}
            onClosed={() => setPage(null)}
          >
            {close =>
              page === 'history' ? (
                <JournalHistoryConcept
                  bottomInset={bottomInset}
                  onClose={close}
                  onEntryMore={(entry, position) => {
                    selection();
                    setActionsFor({ entry, position });
                  }}
                />
              ) : (
                <JournalStatsConcept
                  bottomInset={bottomInset}
                  onClose={close}
                />
              )
            }
          </SlidePage>
        )}

        {composer && (
          <EntryComposer
            mode={composer}
            nextPosition={count + 1}
            bottomInset={bottomInset}
            onClosed={() => setComposer(null)}
            onSave={(type, text, from) => saveEntry(composer, type, text, from)}
          />
        )}

        {actionsFor && (
          <EntryActionsSheet
            entry={actionsFor.entry}
            bottomInset={bottomInset}
            onClosed={() => setActionsFor(null)}
            onEdit={() =>
              setComposer({
                kind: 'edit',
                entry: actionsFor.entry,
                position: actionsFor.position,
              })
            }
            onDelete={() => setDeleting(actionsFor.entry)}
          />
        )}

        {deleting && (
          <ConfirmSheet
            title={t('journal.deleteConfirm.title')}
            message={t('journal.deleteConfirm.message', {
              type:
                deleting.type === 'gratitude'
                  ? t('journal.deleteConfirm.gratitude')
                  : t('journal.deleteConfirm.selfPraise'),
            })}
            confirm={t('common.delete')}
            icon="trash-outline"
            bottomInset={bottomInset}
            onClosed={() => setDeleting(null)}
            onConfirm={() => confirmDelete(deleting)}
          />
        )}

        {confirmFresh && (
          <ConfirmSheet
            title={t('journal.warmUp.startFresh.title')}
            message={t('journal.warmUp.startFresh.message')}
            confirm={t('common.startFresh')}
            icon="refresh"
            bottomInset={bottomInset}
            onClosed={() => setConfirmFresh(false)}
            onConfirm={() => {
              journal.setFrozen(null);
              setFlame('fire');
              setFreshStart(true);
            }}
          />
        )}

        {ad && <AdSimulation onDone={adWatched} />}

        {moment && (
          <MilestoneMoment
            kind={moment.kind}
            xp={moment.xp}
            onClosed={() => setMoment(null)}
          />
        )}
      </View>
    </ScrollFrameProvider>
  );
}

// ---------------------------------------------------------------------------
// Today
// ---------------------------------------------------------------------------

function TodayCard({
  count,
  streak,
  longest,
  flame,
  frozen,
  onFlame,
  onOpenStats,
}: {
  count: number;
  streak: number;
  longest: number;
  flame: FlameState;
  frozen: boolean;
  onFlame: (next: FlameState) => void;
  onOpenStats: () => void;
}) {
  const { c, lang, mode } = useLab();
  const t = useJournalT();
  const { stats } = useLabJournal();
  const complete = count >= DAILY_GOAL;
  const ice = iceColors(mode);

  // The third entry completes the day here, in place: one glow, one haptic.
  const glow = useSharedValue(0);
  const prev = useRef(count);
  useEffect(() => {
    if (prev.current < DAILY_GOAL && count >= DAILY_GOAL) {
      notification(NotificationFeedbackType.Success);
      glow.value = withSequence(
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.cubic) })
      );
    }
    prev.current = count;
  }, [count, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const status =
    count < DAILY_GOAL
      ? t('journal.progress.entriesNeeded', { count: DAILY_GOAL - count })
      : count === DAILY_GOAL
        ? t('journal.progress.dailyComplete')
        : t('journal.progress.bonusAmazing');

  return (
    <Surface style={{ marginTop: labSpace.xxl, overflow: 'hidden' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: c.successSoft },
          glowStyle,
        ]}
      />
      <View style={styles.todayRow}>
        <View style={{ flex: 1 }}>
          <LabText variant="overline" tone="primary">
            {t('journal.today')}
          </LabText>
          <View style={styles.countRow}>
            <RollingNumber text={`${count}`} variant="number" />
            <LabText
              variant="title"
              tone="faint"
              style={{ marginLeft: 2, marginBottom: 4 }}
            >
              {`/${DAILY_GOAL}`}
            </LabText>
            {count > DAILY_GOAL && (
              <View
                style={[styles.plusChip, { backgroundColor: c.rewardSoft }]}
              >
                <RollingNumber
                  text={`+${count - DAILY_GOAL}`}
                  variant="caption"
                  tone="reward"
                  style={{ fontFamily: labFonts.bold }}
                />
              </View>
            )}
          </View>
          <LabText
            variant="label"
            tone={complete ? 'success' : 'muted'}
            style={{ marginTop: 2 }}
          >
            {status}
          </LabText>
        </View>
        <View style={styles.streakBox}>
          <StreakFlame
            state={flame}
            onStateChange={onFlame}
            size={60}
            label={MOCK_COPY[lang].flameHint}
          />
          <View style={{ alignItems: 'flex-end' }}>
            <RollingNumber
              text={`${streak}`}
              variant="number"
              style={frozen ? { color: ice.fg } : undefined}
            />
            <LabText
              variant="caption"
              style={{ color: frozen ? ice.fg : c.textMuted }}
            >
              {frozen ? t('journal.frozenStreak') : t('journal.currentStreak')}
            </LabText>
          </View>
        </View>
      </View>

      <View style={styles.segments}>
        {Array.from({ length: DAILY_GOAL }, (_, i) => (
          <ProgressBar
            key={i}
            progress={count > i ? 1 : 0}
            colors={complete ? [c.success, c.success] : c.primaryGradient}
            height={10}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      {complete && <BonusRoad count={count} />}

      <LabText
        variant="caption"
        tone="faint"
        style={{ marginTop: labSpace.md }}
      >
        {`${t('journal.longestStreak')} · ${longest} · ${MOCK_COPY[lang].flameHint}`}
      </LabText>

      <Divider style={{ marginTop: labSpace.lg }} />
      <PressableScale
        onPress={onOpenStats}
        pressScale={0.98}
        accessibilityLabel={t('journal.stats.milestoneBadges')}
        style={styles.badgesRow}
      >
        <LabText variant="caption" tone="muted" style={{ flex: 1 }}>
          {t('journal.stats.milestoneBadges')}
        </LabText>
        {(
          [
            ['star', stats.stars],
            ['flame', stats.flames],
            ['crown', stats.crowns],
          ] as const
        ).map(([kind, n]) => (
          <View key={kind} style={styles.badge}>
            <LabText variant="body">{MILESTONE_EMOJI[kind]}</LabText>
            <RollingNumber
              text={`${n}`}
              variant="caption"
              style={{ fontFamily: labFonts.semibold, marginLeft: 3 }}
            />
          </View>
        ))}
        <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
      </PressableScale>
    </Surface>
  );
}

/** Positions 4–13 after the daily three: ⭐ at 4, 🔥 at 8, 👑 at 13. */
function BonusRoad({ count }: { count: number }) {
  const { c, lang } = useLab();
  const j = MOCK_COPY[lang].journal;
  const positions = Array.from({ length: 10 }, (_, i) => i + 4);
  const next = [4, 8, 13].find(m => m > count);
  const nextKind = next ? milestoneAt(next) : null;
  const filledTo = Math.min(count, 13);
  const progress = (filledTo - 3) / 10;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.road}>
      <View style={styles.roadHead}>
        <LabText variant="overline" tone="reward" style={{ flex: 1 }}>
          {j.bonusRoad}
        </LabText>
        <LabText variant="caption" tone="muted">
          {next && nextKind
            ? j.toNextMilestone(next - count, MILESTONE_EMOJI[nextKind])
            : j.allMilestones}
        </LabText>
      </View>
      <View style={styles.roadTrackBox}>
        <View style={[styles.roadTrack, { backgroundColor: c.track }]} />
        <RoadFill progress={progress} color={c.reward} />
        <View style={styles.roadNodes}>
          {positions.map(pos => {
            const kind = milestoneAt(pos);
            const reached = count >= pos;
            if (kind) {
              return (
                <View
                  key={pos}
                  style={[
                    styles.roadMilestone,
                    {
                      backgroundColor: reached ? c.rewardSoft : c.surface,
                      borderColor: reached ? c.reward : c.track,
                    },
                  ]}
                >
                  <LabText
                    variant="caption"
                    style={{ opacity: reached ? 1 : 0.45, fontSize: 13 }}
                  >
                    {MILESTONE_EMOJI[kind]}
                  </LabText>
                </View>
              );
            }
            return (
              <View
                key={pos}
                style={[
                  styles.roadDot,
                  {
                    backgroundColor: reached ? c.reward : c.surface,
                    borderColor: reached ? c.reward : c.track,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

function RoadFill({ progress, color }: { progress: number; color: string }) {
  const width = useSharedValue(0);
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(progress, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, fill]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (fill.value - 1) * width.value }],
  }));
  return (
    <View
      style={styles.roadFillClip}
      onLayout={e => {
        width.value = e.nativeEvent.layout.width;
      }}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

function WriteTile({
  type,
  nextPosition,
  locked,
  onPress,
}: {
  type: EntryType;
  nextPosition: number;
  locked: boolean;
  onPress: () => void;
}) {
  const { c, lang } = useLab();
  const t = useJournalT();
  const j = MOCK_COPY[lang].journal;
  const look = typeLook(c, type);
  const xp = entryXp(nextPosition) + milestoneXp(nextPosition);
  const kind = milestoneAt(nextPosition);
  return (
    <PressableScale
      onPress={onPress}
      haptic={locked ? null : 'selection'}
      pressScale={0.97}
      accessibilityLabel={
        type === 'gratitude'
          ? t('journal.input.addGratitudeTitle')
          : t('journal.input.addSelfPraiseTitle')
      }
      style={{ flex: 1 }}
    >
      <Surface style={[styles.tile, locked && { opacity: 0.5 }]}>
        <View style={styles.tileHead}>
          <IconBadge
            icon={locked ? 'lock-closed' : look.icon}
            color={look.fill}
            size={40}
          />
          <View style={{ flex: 1 }} />
          {!locked && xp > 0 && (
            <LabText
              variant="caption"
              tone="reward"
              style={{ fontFamily: labFonts.semibold }}
            >
              {`+${xp}${kind ? ` ${MILESTONE_EMOJI[kind]}` : ''}`}
            </LabText>
          )}
        </View>
        <LabText
          variant="bodyStrong"
          style={{ marginTop: labSpace.md }}
          numberOfLines={1}
        >
          {type === 'gratitude'
            ? t('journal.input.typeGratitude')
            : t('journal.input.typeSelfPraise')}
        </LabText>
        <LabText variant="caption" tone="muted" numberOfLines={2}>
          {type === 'gratitude' ? j.gratitudeHint : j.selfPraiseHint}
        </LabText>
      </Surface>
    </PressableScale>
  );
}

function FrozenCard({
  days,
  paid,
  warming,
  onWarmUp,
  onStartFresh,
}: {
  days: number;
  paid: number;
  warming: boolean;
  onWarmUp: () => void;
  onStartFresh: () => void;
}) {
  const { c, lang, mode } = useLab();
  const t = useJournalT();
  const ice = iceColors(mode);
  const left = days - paid;
  const done = left <= 0;
  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Surface
        style={{
          marginTop: labSpace.lg,
          backgroundColor: ice.soft,
          borderColor: ice.ring,
        }}
      >
        <View style={styles.frozenHead}>
          <Ionicons name="snow" size={20} color={ice.fg} />
          <LabText
            variant="titleSm"
            style={{ marginLeft: labSpace.sm, color: ice.fg }}
          >
            {t('journal.warmUp.title')}
          </LabText>
        </View>
        <LabText variant="body" style={{ marginTop: labSpace.sm }}>
          {t('journal.warmUp.frozenMessage', { count: days, adsNeeded: left })}
        </LabText>
        <View style={styles.debtRow}>
          {Array.from({ length: days }, (_, i) => {
            const warm = i < paid;
            return (
              <View
                key={i}
                style={[
                  styles.debtDay,
                  {
                    backgroundColor: warm ? c.rewardSoft : c.surface,
                    borderColor: warm ? c.reward : ice.ring,
                  },
                ]}
              >
                <Ionicons
                  name={warm ? 'sunny' : 'snow'}
                  size={14}
                  color={warm ? c.rewardText : ice.fg}
                />
              </View>
            );
          })}
          <View style={{ flex: 1 }} />
          <LabText variant="caption" style={{ color: ice.fg }}>
            {t('journal.warmUp.adsProgress', { watched: paid, total: days })}
          </LabText>
        </View>
        <PressableScale
          {...(done || warming ? null : { onPress: onWarmUp })}
          accessibilityLabel={t('journal.warmUp.warmUpButton', {
            current: paid,
            total: days,
          })}
          style={styles.warmButton}
        >
          <LinearGradient
            colors={done ? [c.reward, c.reward] : [ice.fg, ice.ring]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: labRadius.pill }]}
          />
          <Ionicons
            name={done ? 'checkmark' : 'play'}
            size={16}
            color="#FFFFFF"
            style={{ marginRight: labSpace.sm }}
          />
          <LabText variant="bodyStrong" style={{ color: '#FFFFFF' }}>
            {done
              ? t('journal.warmUp.warmUpComplete')
              : t('journal.warmUp.warmUpButton', {
                  current: paid,
                  total: days,
                })}
          </LabText>
        </PressableScale>
        {!done && (
          <PressableScale
            onPress={onStartFresh}
            accessibilityLabel={t('common.startFresh')}
            style={styles.freshButton}
          >
            <LabText variant="label" tone="muted">
              {t('common.startFresh')}
            </LabText>
          </PressableScale>
        )}
        <LabText
          variant="caption"
          tone="muted"
          italic
          style={{ marginTop: labSpace.sm, textAlign: 'center' }}
        >
          {MOCK_COPY[lang].journal.writingLocked}
        </LabText>
      </Surface>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Daily inspiration
// ---------------------------------------------------------------------------

const QUOTE_CATEGORIES: MotivationalQuote['category'][] = [
  'motivation',
  'gratitude',
  'habits',
  'goals',
  'achievement',
  'level',
  'streak',
  'consistency',
  'growth',
];

function quoteLook(
  c: LabPalette,
  category: MotivationalQuote['category']
): { icon: IoniconName; color: string } {
  switch (category) {
    case 'gratitude':
      return { icon: 'heart', color: c.habit.pink };
    case 'habits':
    case 'consistency':
      return { icon: 'checkmark-circle', color: c.habit.green };
    case 'goals':
      return { icon: 'flag', color: c.habit.orange };
    case 'achievement':
      return { icon: 'trophy', color: c.rewardText };
    case 'level':
      return { icon: 'trending-up', color: c.primary };
    case 'streak':
      return { icon: 'flame', color: c.flame };
    case 'growth':
      return { icon: 'leaf', color: c.habit.teal };
    default:
      return { icon: 'flash', color: c.habit.purple };
  }
}

function QuoteCard({ dateKeyToday }: { dateKeyToday: string }) {
  const { c, lang } = useLab();
  const t = useJournalT();
  const [quote, setQuote] = useState(() => getDailyQuote(dateKeyToday, lang));
  useEffect(() => {
    setQuote(getDailyQuote(dateKeyToday, lang));
  }, [dateKeyToday, lang]);
  const look = quoteLook(c, quote.category);

  return (
    <Surface style={{ marginTop: labSpace.lg }}>
      <View style={styles.quoteHead}>
        <Ionicons name={look.icon} size={16} color={look.color} />
        <LabText
          variant="overline"
          tone="muted"
          style={{ marginLeft: labSpace.sm, flex: 1 }}
        >
          {t('home.dailyQuote')}
        </LabText>
        <PressableScale
          pressScale={0.85}
          accessibilityLabel={MOCK_COPY[lang].journal.anotherQuote}
          onPress={() => {
            const category =
              QUOTE_CATEGORIES[
                Math.floor(Math.random() * QUOTE_CATEGORIES.length)
              ] ?? 'motivation';
            setQuote(getRandomQuoteFromCategory(category, lang));
          }}
          style={[styles.quoteRefresh, { backgroundColor: c.track }]}
        >
          <Ionicons name="refresh" size={15} color={c.textMuted} />
        </PressableScale>
      </View>
      <Animated.View key={quote.id} entering={FadeIn.duration(360)}>
        <LabText
          variant="display"
          style={[styles.quoteMark, { color: look.color }]}
        >
          “
        </LabText>
        <LabText variant="title" italic style={{ marginTop: -18 }}>
          {quote.text}
        </LabText>
        {quote.author && (
          <LabText
            variant="label"
            tone="muted"
            style={{ marginTop: labSpace.sm }}
          >
            {`— ${quote.author}`}
          </LabText>
        )}
        <View
          style={[styles.categoryTag, { backgroundColor: `${look.color}1F` }]}
        >
          <LabText
            variant="caption"
            style={{ color: look.color, fontFamily: labFonts.semibold }}
          >
            {t(`home.quoteCategories.${quote.category}`)}
          </LabText>
        </View>
      </Animated.View>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function EmptyDay() {
  const { c } = useLab();
  const t = useJournalT();
  return (
    <View style={[styles.empty, { borderColor: c.textFaint }]}>
      <LabText variant="title" italic>
        {t('journal.empty.title')}
      </LabText>
      <LabText variant="body" tone="muted" style={{ marginTop: labSpace.sm }}>
        {t('journal.empty.body')}
      </LabText>
    </View>
  );
}

function TopButton({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      pressScale={0.92}
      style={[
        styles.topButton,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={c.textMuted} />
    </PressableScale>
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
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  plusChip: {
    marginLeft: labSpace.sm,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: labRadius.pill,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: labSpace.lg,
  },
  road: {
    marginTop: labSpace.lg,
  },
  roadHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadTrackBox: {
    height: 26,
    marginTop: labSpace.sm,
    justifyContent: 'center',
  },
  roadTrack: {
    position: 'absolute',
    left: 11,
    right: 11,
    height: 3,
    borderRadius: 1.5,
  },
  roadFillClip: {
    position: 'absolute',
    left: 11,
    right: 11,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  roadNodes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  roadMilestone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: labSpace.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: labSpace.md,
  },
  tiles: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.lg,
  },
  tile: {
    padding: labSpace.lg,
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  frozenHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  debtDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmButton: {
    flexDirection: 'row',
    height: 48,
    marginTop: labSpace.lg,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  freshButton: {
    alignSelf: 'center',
    paddingVertical: labSpace.sm,
    paddingHorizontal: labSpace.lg,
    marginTop: labSpace.xs,
  },
  quoteHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteRefresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteMark: {
    fontSize: 56,
    lineHeight: 64,
    marginTop: labSpace.xs,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    marginTop: labSpace.md,
    paddingHorizontal: labSpace.sm,
    paddingVertical: 3,
    borderRadius: labRadius.pill,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xxl,
  },
  empty: {
    marginTop: labSpace.md,
    padding: labSpace.xl,
    borderRadius: labRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
