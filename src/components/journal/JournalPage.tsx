/**
 * My Journal in the new look — the page (migration E12, from the Design Lab's
 * JournalConcept). Top to bottom (technical-guides:My-Journal.md):
 *   1. the top row: History and Statistics on the right (only there — P35);
 *   2. the date, the title, a quiet line;
 *   3. TODAY — the count, three segments, the flame, the bonus road (TodayCard);
 *   4. write — two tiles; a frozen streak locks them BEFORE typing and offers the
 *      warm-up right here (R-14, the shared useStreakWarmUp — no copy of it);
 *   5. the daily inspiration, always above today's entries;
 *   6. today's entries, 1..N, "⋯" = edit / delete.
 * Writing and editing is one sheet (EntryComposer). XP is the storage's; the
 * save path keeps its debt gate (journalWritingGate). A failed save keeps the
 * sheet open with the text and shows a calm note (7.9).
 */
import React, {
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
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useJournalFlame } from '@/src/hooks/useJournalFlame';
import { useStreakWarmUp } from '@/src/hooks/useStreakWarmUp';
import { space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { Gratitude } from '@/src/types/gratitude';
import { parseDate, today as todayString } from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import { blockingDebtDays } from '@/src/screens/journal/journalWritingGate';
import { JOURNAL_DAILY_GOAL } from '@/src/utils/journalXp';
import {
  AppText,
  ConfirmSheet,
  HelpHost,
  HelpLink,
  IntroProvider,
  Rise,
  RollingNumber,
  RoundButton,
  ScrollCard,
  ScrollFrameProvider,
  Surface,
  TopRow,
  useIntro,
  usePageScrollFrame,
  useProblemNote,
  useScrollRest,
} from '@/src/components/ui';
import { WarmUpControls } from '@/src/components/home/JournalStreakCard';
import { EmptyDay, QuoteCard, WriteTile } from './JournalBlocks';
import { EntryActionsSheet, EntryCard, EntryType } from './EntryCard';
import { ComposerMode, EntryComposer } from './EntryComposer';
import { TodayCard } from './TodayCard';

const SCREEN_PADDING = space.xl;

interface JournalPageProps {
  bottomInset: number;
  /** A quick action from Home asked to write (null = nothing to open). */
  openWrite: { type: EntryType; key: number } | null;
  /** A new entry was stored; `count` = today's entries after it. */
  onAdded: (count: number) => void;
}

export function JournalPage(props: JournalPageProps) {
  return (
    <IntroProvider kind="settle" playKey={0}>
      <JournalContent {...props} />
    </IntroProvider>
  );
}

function JournalContent({ bottomInset, openWrite, onAdded }: JournalPageProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const router = useRouter();
  const { timeline } = useIntro();
  const { state, actions } = useGratitude();
  const { showProblem } = useProblemNote();
  const streak = state.streakInfo;
  const flame = useJournalFlame(streak);
  const warmUp = useStreakWarmUp();
  const rest = useScrollRest();
  const { frame, onScroll, onLayout } = usePageScrollFrame(bottomInset, true);

  const today = todayString();
  const entries = useMemo(
    () =>
      state.gratitudes
        .filter(g => g.date === today)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [state.gratitudes, today]
  );
  const count = entries.length;
  // Writing waits while the streak is frozen — and while the flame catches.
  const locked = flame.state === 'ice' || flame.state === 'warming';

  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const [actionsFor, setActionsFor] = useState<Gratitude | null>(null);
  const [deleting, setDeleting] = useState<Gratitude | null>(null);
  const [freshConfirm, setFreshConfirm] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);

  const startWriting = useCallback(
    (type: EntryType) => {
      if (locked) {
        feel('invalid');
        return;
      }
      setComposer({ kind: 'new', type });
    },
    [locked]
  );

  // A quick action from Home (Gratitude / Self-praise) opens the sheet.
  useEffect(() => {
    if (openWrite) startWriting(openWrite.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWrite?.key]);

  // A new or edited entry: bring its card into view once it is there — except
  // the day's third entry: then the Today card at the top completes the day
  // (R-13), and scrolling away would hide that moment.
  const scrollToFresh = useRef(true);
  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef<View>(null);
  const entryRefs = useRef(new Map<string, View | null>());
  useEffect(() => {
    if (!freshId || !scrollToFresh.current) return undefined;
    const id = setTimeout(() => {
      const root = pageRef.current;
      const card = entryRefs.current.get(freshId);
      if (!root || !card) return;
      root.measureInWindow((_px, py, _pw, ph) => {
        card.measureInWindow((_x, y, _w, h) => {
          const bottomLimit = py + ph - bottomInset - space.lg;
          if (y >= py && y + h <= bottomLimit) return;
          scrollRef.current?.scrollTo({
            y: Math.max(0, frame.getScrollY() + y + h - bottomLimit),
            animated: true,
          });
        });
      });
    }, 900);
    return () => clearTimeout(id);
  }, [freshId, bottomInset, frame]);

  // Runs after the sheet has closed. A failure reopens it with the text.
  const save = async (mode: ComposerMode, type: EntryType, text: string) => {
    const reopen = (message: string) => {
      showProblem({ message });
      setComposer(
        mode.kind === 'edit' ? { ...mode, text } : { kind: 'new', type, text }
      );
    };
    try {
      if (mode.kind === 'edit') {
        await actions.updateGratitude(mode.id, { content: text });
        scrollToFresh.current = true;
        setFreshId(null);
        setTimeout(() => setFreshId(mode.id), 0);
        return;
      }
      // The authoritative gate (the tiles are only UX on top of it).
      if ((await blockingDebtDays()) > 0) {
        showProblem({ message: t('journal.writingLocked') });
        await actions.refreshStats();
        return;
      }
      const entry = await actions.createGratitude({ content: text, date: today, type });
      scrollToFresh.current = count + 1 !== JOURNAL_DAILY_GOAL;
      setFreshId(entry.id);
      onAdded(count + 1);
    } catch (error) {
      console.error('Journal entry not saved:', error);
      reopen(t('common.errors.gratitude.failedToSave'));
    }
  };

  const confirmDelete = async (entry: Gratitude) => {
    try {
      // The storage takes back the XP of the day's last position and renumbers.
      await actions.deleteGratitude(entry.id);
    } catch (error) {
      console.error('Journal entry not deleted:', error);
      showProblem({ message: t('journal.errors.deleteFailed') });
    }
  };

  const more = useCallback(
    (id: string) => setActionsFor(entries.find(e => e.id === id) ?? null),
    [entries]
  );

  const locale = t('common.locale');
  const dateLine = parseDate(today).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeOf = (g: Gratitude) =>
    new Date(g.createdAt).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  const sectionWindow = (i: number) =>
    timeline.sections[Math.min(i, timeline.sections.length - 1)] ??
    timeline.hero;

  const progress = warmUp.progress;
  const days = Math.max(progress?.total ?? streak?.frozenDays ?? 0, 1);
  const paid =
    flame.state === 'warming' ? days : Math.min(progress?.paid ?? 0, days);

  return (
    <View style={[styles.flex, { backgroundColor: c.canvas }]}>
      <TopRow>
        <RoundButton
          icon="calendar-outline"
          label={t('journal.history')}
          onPress={() => router.push('/journal-history')}
        />
        <RoundButton
          icon="stats-chart-outline"
          label={t('journal.statistics')}
          onPress={() => router.push('/journal-stats')}
        />
      </TopRow>
      <View ref={pageRef} collapsable={false} style={styles.page}>
        {/* Help sheets open at the page's level, not inside their card. */}
        <HelpHost bottomInset={bottomInset}>
          <ScrollFrameProvider value={frame}>
            <RNAnimated.ScrollView
              ref={scrollRef}
              style={styles.flex}
              onLayout={onLayout}
              onScroll={onScroll}
              scrollEventThrottle={16}
              {...rest.handlers}
              keyboardShouldPersistTaps="handled"
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
                  {t('journal.title')}
                </AppText>
                <AppText
                  variant="body"
                  tone="muted"
                  italic
                  style={styles.subline}
                >
                  {t('journal.subline')}
                </AppText>
              </Rise>

              {/* Today */}
              <ScrollCard variant="hero">
                <Rise window={timeline.hero} scaleFrom={0.97}>
                  <TodayCard
                    count={count}
                    streak={streak?.currentStreak ?? 0}
                    longest={streak?.longestStreak ?? 0}
                    flame={flame.state}
                    onWarmed={flame.onWarmed}
                    frozen={flame.state === 'ice'}
                    stars={streak?.starCount ?? 0}
                    flames={streak?.flameCount ?? 0}
                    crowns={streak?.crownCount ?? 0}
                    onOpenStats={() => router.push('/journal-stats')}
                    rest={rest.signal}
                    bottomInset={bottomInset}
                  />
                </Rise>
              </ScrollCard>

              {/* Write — or warm up first (R-14) */}
              <ScrollCard>
                <Rise window={sectionWindow(0)}>
                  {locked && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                      <Surface
                        style={[
                          styles.frozen,
                          {
                            backgroundColor: c.iceSoft,
                            borderColor: c.iceRing,
                          },
                        ]}
                      >
                        <View style={styles.frozenHead}>
                          <Ionicons name="snow" size={20} color={c.ice} />
                          <AppText
                            variant="titleSm"
                            style={[styles.frozenTitle, { color: c.ice }]}
                          >
                            {t('journal.warmUp.title')}
                          </AppText>
                          <View style={styles.flex} />
                          <HelpLink topic="frozen" bottomInset={bottomInset} />
                        </View>
                        <AppText variant="body" style={styles.frozenText}>
                          {t('journal.warmUp.frozenMessage', {
                            count: Math.max(days - paid, 0),
                          })}
                        </AppText>
                        <WarmUpControls
                          days={days}
                          paid={paid}
                          busy={
                            warmUp.isWatchingAd || flame.state === 'warming'
                          }
                          onWarmUp={() => void warmUp.watchAd()}
                          onStartFresh={() => setFreshConfirm(true)}
                        />
                        <AppText
                          variant="caption"
                          tone="muted"
                          italic
                          style={styles.lockNote}
                        >
                          {t('journal.writingLocked')}
                        </AppText>
                      </Surface>
                    </Animated.View>
                  )}
                  <View style={styles.tiles}>
                    {(['gratitude', 'self-praise'] as EntryType[]).map(type => (
                      <WriteTile
                        key={type}
                        type={type}
                        nextPosition={count + 1}
                        locked={locked}
                        onPress={() => startWriting(type)}
                      />
                    ))}
                  </View>
                </Rise>
              </ScrollCard>

              {/* Daily inspiration — always above today's entries */}
              <ScrollCard>
                <Rise window={sectionWindow(1)}>
                  <QuoteCard today={today} />
                </Rise>
              </ScrollCard>

              {/* Today's entries */}
              <ScrollCard>
                <Rise window={sectionWindow(2)}>
                  <View style={styles.sectionTitle}>
                    <AppText variant="title" style={styles.flex}>
                      {t('journal.today')}
                    </AppText>
                    <RollingNumber
                      text={t('journal.entryCount', { count })}
                      variant="label"
                      tone="muted"
                    />
                  </View>
                  {count === 0 ? (
                    <EmptyDay />
                  ) : (
                    entries.map((entry, i) => (
                      <Animated.View
                        key={entry.id}
                        ref={(node: View | null) => {
                          entryRefs.current.set(entry.id, node);
                        }}
                        collapsable={false}
                        entering={FadeInDown.duration(320)}
                        exiting={FadeOut.duration(180)}
                        layout={LinearTransition.duration(260)}
                        style={styles.entryGap}
                      >
                        <EntryCard
                          id={entry.id}
                          type={
                            entry.type === 'self-praise'
                              ? 'self-praise'
                              : 'gratitude'
                          }
                          text={entry.content}
                          time={timeOf(entry)}
                          position={i + 1}
                          fresh={freshId === entry.id}
                          onMore={more}
                        />
                      </Animated.View>
                    ))
                  )}
                </Rise>
              </ScrollCard>
            </RNAnimated.ScrollView>
          </ScrollFrameProvider>

          {composer && (
            <EntryComposer
              mode={composer}
              nextPosition={count + 1}
              bottomInset={bottomInset}
              onClosed={() => setComposer(null)}
              onSave={(type, text) => void save(composer, type, text)}
            />
          )}
          {actionsFor && (
            <EntryActionsSheet
              text={actionsFor.content}
              bottomInset={bottomInset}
              onClosed={() => setActionsFor(null)}
              onEdit={() =>
                setComposer({
                  kind: 'edit',
                  id: actionsFor.id,
                  type:
                    actionsFor.type === 'self-praise'
                      ? 'self-praise'
                      : 'gratitude',
                  text: actionsFor.content,
                })
              }
              onDelete={() => setDeleting(actionsFor)}
            />
          )}
          {deleting && (
            <ConfirmSheet
              title={t('journal.deleteConfirm.title')}
              message={t('journal.deleteConfirm.message', {
                type:
                  deleting.type === 'self-praise'
                    ? t('journal.deleteConfirm.selfPraise')
                    : t('journal.deleteConfirm.gratitude'),
              })}
              confirm={t('common.delete')}
              cancel={t('common.cancel')}
              icon="trash-outline"
              bottomInset={bottomInset}
              onClosed={() => setDeleting(null)}
              onConfirm={() => void confirmDelete(deleting)}
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
              onClosed={() => setFreshConfirm(false)}
              onConfirm={() => void warmUp.startFresh()}
            />
          )}
        </HelpHost>
      </View>
    </View>
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
  title: {
    marginTop: space.sm,
  },
  subline: {
    marginTop: 2,
  },
  frozen: {
    marginTop: space.lg,
  },
  frozenHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frozenTitle: {
    marginLeft: space.sm,
  },
  frozenText: {
    marginTop: space.sm,
  },
  lockNote: {
    marginTop: space.sm,
    textAlign: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xxl,
  },
  entryGap: {
    marginTop: space.md,
  },
});
