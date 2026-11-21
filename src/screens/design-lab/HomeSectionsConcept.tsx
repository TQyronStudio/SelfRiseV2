/**
 * The rest of Home (kolo 42, lab debt L-2): the insights card, the "For you"
 * card and the sheet that lets the user arrange Home.
 *
 * - INSIGHTS replaces two sections of today's Home (Performance and Trends).
 *   They said overlapping things in two places; here it is one card with at most
 *   three sentences that are not on the statistics card above: the direction over
 *   four weeks, the strongest habit, and the one worth a look — said kindly, in a
 *   warm colour, never red.
 * - FOR YOU replaces the row of recommendation cards: ONE suggestion at a time
 *   with one thing to do, and a quiet way to see another. The texts are the
 *   app's own (home.recommendationCards.*).
 * - CUSTOMISE: every section can be hidden and dragged to a new place; the hero
 *   of the day stays on top (R-4b). Rules and the migration of today's stored
 *   layout: homeLayoutLogic.ts.
 * - Not converted: "Streak history" — the same 30-day chart lives in Journal
 *   statistics; one place for one thing (lesson 35).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Insights: facts from the same calculations HabitPerformanceIndicators and
 *   HabitTrendAnalysis do today; show a row only when its fact exists.
 * - For you: RecommendationEngine.generateRecommendations (up to 4, by priority);
 *   the button does the recommendation's own action; hide the card when empty.
 * - Customise: HomeCustomizationContext (toggleComponentVisibility,
 *   reorderComponents, resetToDefaults); stored layouts go through
 *   migrateHomeSections.
 */
import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  ReorderableList,
  ReorderHandle,
} from '@/src/components/common/ReorderableList';
import { selection } from '@/src/services/hapticsService';
import {
  DEFAULT_HOME_SECTIONS,
  HomeSection,
  HomeSectionId,
  reorderSections,
  toggleSection,
} from './homeLayoutLogic';
import { BottomSheet, useJournalT } from './journalParts';
import {
  Divider,
  IconBadge,
  LabText,
  PressableScale,
  useLab,
} from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { MOCK_COPY, MOCK_HABITS } from './mockCopy';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ---------------------------------------------------------------------------
// Insights — what the last four weeks say
// ---------------------------------------------------------------------------

export function InsightsCard() {
  const { c, lang } = useLab();
  const text = MOCK_COPY[lang].homeSections;
  // Kulisy: the strongest and the weakest of the mock habits.
  const strongest = MOCK_HABITS[0];
  const weakest = MOCK_HABITS[MOCK_HABITS.length - 1];

  const rows: {
    icon: IoniconName;
    color: string;
    title: string;
    body: string;
  }[] = [
    {
      icon: 'trending-up',
      color: c.successText,
      title: text.trendUp(12),
      body: text.trendUpText,
    },
    ...(strongest
      ? [
          {
            icon: 'star' as IoniconName,
            color: c.rewardText,
            title: text.strongest,
            body: text.strongestText(strongest.name[lang], 96),
          },
        ]
      : []),
    ...(weakest
      ? [
          {
            // Kind, and in the warm colour: a nudge, not a failure.
            icon: 'compass-outline' as IoniconName,
            color: c.flame,
            title: text.focus,
            body: text.focusText(weakest.name[lang], 54),
          },
        ]
      : []),
  ];

  return (
    <View>
      <View style={styles.cardHeader}>
        <LabText variant="titleSm" style={{ flex: 1 }}>
          {text.insights}
        </LabText>
        <LabText variant="caption" tone="muted">
          {text.insightsPeriod}
        </LabText>
      </View>
      {rows.map((row, i) => (
        <View key={row.title}>
          {i > 0 && <Divider style={{ marginLeft: 52 }} />}
          <View style={styles.insight}>
            <IconBadge icon={row.icon} color={row.color} />
            <View style={styles.insightText}>
              <LabText variant="bodyStrong">{row.title}</LabText>
              <LabText variant="label" tone="muted" style={{ marginTop: 2 }}>
                {row.body}
              </LabText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// For you — one suggestion at a time
// ---------------------------------------------------------------------------

export function ForYouCard() {
  const { c, lang } = useLab();
  const text = MOCK_COPY[lang].homeSections;
  const t = useJournalT();
  const [index, setIndex] = useState(0);
  const habit = MOCK_HABITS[MOCK_HABITS.length - 1];

  // Kulisy in the engine's shape; the words are the app's.
  const suggestions: {
    icon: IoniconName;
    color: string;
    title: string;
    body: string;
    prompt?: string;
    action: string;
  }[] = [
    {
      icon: 'sparkles',
      color: c.successText,
      title: t('home.recommendationCards.journal.trySelfPraise.title'),
      body: t('home.recommendationCards.journal.trySelfPraise.description'),
      prompt: t('home.recommendationCards.journal.trySelfPraise.prompt'),
      action: text.write,
    },
    {
      icon: 'calendar-outline',
      color: c.primary,
      title: t('home.recommendationCards.habits.adjustSchedule.title'),
      body: t('home.recommendationCards.habits.adjustSchedule.description', {
        habitName: habit ? habit.name[lang] : '',
        completionRate: 54,
      }),
      action: t('home.recommendationCards.habits.adjustSchedule.action'),
    },
    {
      icon: 'flag-outline',
      color: c.flame,
      title: t('home.recommendationCards.goals.startProgress.title'),
      body: t('home.recommendationCards.goals.startProgress.description', {
        goalTitle: lang === 'de' ? 'Notgroschen' : 'Emergency fund',
      }),
      action: t('home.recommendationCards.goals.startProgress.action'),
    },
  ];
  const current = suggestions[index % suggestions.length]!;

  return (
    <View>
      <View style={styles.cardHeader}>
        <LabText variant="overline" tone="primary" style={{ flex: 1 }}>
          {text.forYou}
        </LabText>
        <LabText variant="caption" tone="faint">
          {text.position((index % suggestions.length) + 1, suggestions.length)}
        </LabText>
      </View>
      <View style={styles.suggestion}>
        <IconBadge icon={current.icon} color={current.color} size={44} />
        <View style={styles.insightText}>
          <LabText variant="titleSm">{current.title}</LabText>
          <LabText variant="label" tone="muted" style={{ marginTop: 2 }}>
            {current.body}
          </LabText>
        </View>
      </View>
      {current.prompt && (
        <View style={[styles.prompt, { backgroundColor: c.surfaceRaised }]}>
          <LabText variant="body" italic>
            {current.prompt}
          </LabText>
        </View>
      )}
      <View style={styles.actions}>
        <PressableScale
          accessibilityLabel={current.action}
          style={[styles.primaryAction, { backgroundColor: c.primarySoft }]}
        >
          <LabText variant="bodyStrong" tone="primary">
            {current.action}
          </LabText>
        </PressableScale>
        <PressableScale
          onPress={() => setIndex(i => i + 1)}
          accessibilityLabel={text.another}
          pressScale={0.92}
          style={[styles.nextAction, { borderColor: c.border }]}
        >
          <Ionicons name="refresh" size={18} color={c.textMuted} />
        </PressableScale>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Customise Home — hide, show, drag
// ---------------------------------------------------------------------------

export function HomeCustomizeSheet({
  sections,
  onChange,
  bottomInset,
  onClosed,
}: {
  sections: HomeSection[];
  onChange: (next: HomeSection[]) => void;
  bottomInset: number;
  onClosed: () => void;
}) {
  const { c, lang } = useLab();
  const text = MOCK_COPY[lang].homeSections;
  const t = useJournalT();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const nameOf = (id: HomeSectionId) =>
    id === 'todayHabits' || id === 'insights'
      ? text.names[id]
      : t(`home.customization.componentNames.${id}`);

  return (
    // Its rows are dragged themselves, so the sheet does not follow the finger.
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      draggable={false}
      label={t('common.close')}
    >
      {() => (
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.sheetScroll}
          showsVerticalScrollIndicator={false}
        >
          <LabText variant="title">{t('home.customization.title')}</LabText>
          <LabText
            variant="label"
            tone="muted"
            style={{ marginTop: 2, marginBottom: labSpace.md }}
          >
            {text.customizeHint}
          </LabText>
          <ReorderableList
            data={sections}
            keyExtractor={section => section.id}
            scrollableRef={scrollRef}
            onReorder={orders =>
              onChange(
                reorderSections(
                  sections,
                  [...orders]
                    .sort((a, b) => a.order - b.order)
                    .map(o => o.id as HomeSectionId)
                )
              )
            }
            renderItem={section => (
              <View
                style={[
                  styles.sectionRow,
                  { backgroundColor: c.surfaceRaised, borderColor: c.border },
                ]}
              >
                <ReorderHandle style={styles.handle}>
                  <Ionicons
                    name="reorder-three"
                    size={22}
                    color={c.textFaint}
                  />
                </ReorderHandle>
                <LabText
                  variant="bodyStrong"
                  tone={section.visible ? 'text' : 'muted'}
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {nameOf(section.id)}
                </LabText>
                <Switch
                  value={section.visible}
                  onValueChange={() => {
                    selection();
                    onChange(toggleSection(sections, section.id));
                  }}
                  trackColor={{ false: c.track, true: c.primary }}
                  accessibilityLabel={nameOf(section.id)}
                />
              </View>
            )}
          />
          <PressableScale
            onPress={() => onChange(DEFAULT_HOME_SECTIONS.map(s => ({ ...s })))}
            accessibilityLabel={t('home.customization.resetToDefaults')}
            style={styles.reset}
          >
            <LabText variant="label" tone="muted">
              {t('home.customization.resetToDefaults')}
            </LabText>
          </PressableScale>
        </Animated.ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: labSpace.sm,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.md,
  },
  insightText: {
    flex: 1,
    marginLeft: labSpace.md,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: labSpace.xs,
  },
  prompt: {
    marginTop: labSpace.md,
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.sm,
    marginTop: labSpace.lg,
  },
  primaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    maxHeight: 520,
    paddingHorizontal: labSpace.xl,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    marginBottom: labSpace.sm,
    paddingRight: labSpace.md,
    borderRadius: labRadius.md,
    borderWidth: 1,
  },
  handle: {
    paddingHorizontal: labSpace.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  reset: {
    alignSelf: 'center',
    paddingVertical: labSpace.md,
    paddingHorizontal: labSpace.lg,
  },
});
