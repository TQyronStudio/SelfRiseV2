/**
 * Home: For you — ONE suggestion at a time (migration E11e, from the Design Lab's
 * HomeSectionsConcept). Replaces PersonalizedRecommendations' row of cards.
 *
 * - The suggestions are the app's own: RecommendationEngine.generateRecommendations
 *   (up to 4, by priority) with its texts (titleKey, descriptionKey, promptKey,
 *   actionKey). No suggestion, no card.
 * - The button DOES the suggestion where the app can (decided in E11e, the data
 *   map left it open): a new habit / goal opens its composer, a journal
 *   suggestion opens writing (self-praise for "try self-praise"); the rest opens
 *   its tab, as before. Opening one particular habit or goal is not a route yet.
 * - "Another suggestion" goes round the list; the position says where you are.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useGoals } from '@/src/contexts/GoalsContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import {
  PersonalizedRecommendation,
  RecommendationEngine,
} from '@/src/services/recommendationEngine';
import {
  AppText,
  IconBadge,
  PressableScale,
  Surface,
} from '@/src/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Where the button takes the user (the `?quickAction` links the tabs listen to). */
export function actionRoute(r: PersonalizedRecommendation): string {
  switch (r.type) {
    case 'new_habit':
      return '/(tabs)/habits?quickAction=addHabit';
    case 'habit_schedule':
    case 'habit_adjustment':
      return '/(tabs)/habits';
    case 'journal_prompt':
    case 'streak_motivation':
    case 'milestone_celebration':
      return r.titleKey.includes('trySelfPraise')
        ? '/(tabs)/journal?quickAction=addSelfPraise'
        : '/(tabs)/journal?quickAction=addGratitude';
    case 'new_goal':
      return '/(tabs)/goals?quickAction=addGoal';
    default:
      return '/(tabs)/goals';
  }
}

export function ForYouCard() {
  const { c } = useDesign();
  const { t } = useI18n();
  const router = useRouter();
  const { habits, completions } = useHabitsData();
  const { state: goalsState } = useGoals();
  const { state: gratitudeState } = useGratitude();
  const [list, setList] = useState<PersonalizedRecommendation[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    RecommendationEngine.generateRecommendations(
      habits,
      completions,
      goalsState.goals,
      gratitudeState.gratitudes
    )
      .then(result => {
        if (alive) setList(result);
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, [habits, completions, goalsState.goals, gratitudeState.gratitudes]);

  if (list.length === 0) return null;
  const at = index % list.length;
  const current = list[at]!;
  const look: { icon: IconName; color: string } = current.type.startsWith('journal') ||
    current.type === 'streak_motivation' ||
    current.type === 'milestone_celebration'
    ? { icon: 'sparkles', color: c.successText }
    : current.type.includes('goal')
      ? { icon: 'flag-outline', color: c.flame }
      : { icon: 'calendar-outline', color: c.primary };
  const prompt = 'promptKey' in current && current.promptKey ? t(current.promptKey) : null;
  const action =
    'actionKey' in current && current.actionKey
      ? t(current.actionKey)
      : t('home.forYou.write');

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <AppText variant="overline" tone="primary" style={styles.flex}>
          {t('home.forYou.title')}
        </AppText>
        {list.length > 1 && (
          <AppText variant="caption" tone="faint">
            {t('home.forYou.position', { index: at + 1, count: list.length })}
          </AppText>
        )}
      </View>
      <View style={styles.suggestion}>
        <IconBadge icon={look.icon} color={look.color} size={44} />
        <View style={styles.text}>
          <AppText variant="titleSm">{t(current.titleKey)}</AppText>
          <AppText variant="label" tone="muted" style={styles.body}>
            {t(current.descriptionKey, current.descriptionParams ?? {})}
          </AppText>
        </View>
      </View>
      {prompt && (
        <View style={[styles.prompt, { backgroundColor: c.surfaceRaised }]}>
          <AppText variant="body" italic>
            {prompt}
          </AppText>
        </View>
      )}
      <View style={styles.actions}>
        <PressableScale
          onPress={() => router.push(actionRoute(current) as never)}
          accessibilityLabel={action}
          style={[styles.primary, { backgroundColor: c.primarySoft }]}
        >
          <AppText variant="bodyStrong" tone="primary">
            {action}
          </AppText>
        </PressableScale>
        {list.length > 1 && (
          <PressableScale
            onPress={() => {
              feel('tap');
              setIndex(i => i + 1);
            }}
            feel={null}
            accessibilityLabel={t('home.forYou.another')}
            pressScale={0.92}
            style={[styles.next, { borderColor: c.border }]}
          >
            <Ionicons name="refresh" size={18} color={c.textMuted} />
          </PressableScale>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.lg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: space.xs,
  },
  text: {
    flex: 1,
    marginLeft: space.md,
  },
  body: {
    marginTop: 2,
  },
  prompt: {
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  primary: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
