/**
 * Home: Insights — what the last four weeks say (migration E11e, from the Design
 * Lab's HomeSectionsConcept). Replaces HabitPerformanceIndicators and
 * HabitTrendAnalysis: they said overlapping things in two places; this is one
 * card with at most three sentences that are not on the statistics card above —
 * the rise over four weeks, the strongest habit, and the one worth a look, said
 * kindly in the warm colour, never red. A row only when its fact exists; no
 * facts, no card. The facts: src/screens/home/homeInsightsLogic.ts (tested).
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useHabitsData } from '@/src/hooks/useHabitsData';
import { useI18n } from '@/src/hooks/useI18n';
import { space } from '@/src/design/tokens';
import { today as todayString } from '@/src/utils/date';
import {
  habitRates,
  hasInsights,
  INSIGHT_WEEKS,
  insightsOf,
  weeklyRates,
} from '@/src/screens/home/homeInsightsLogic';
import { AppText, Divider, IconBadge, Surface } from '@/src/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function InsightsCard() {
  const { c } = useDesign();
  const { t } = useI18n();
  const { habits, getHabitsByDate } = useHabitsData();
  const today = todayString();

  const insights = useMemo(
    () =>
      insightsOf(
        weeklyRates(habits, getHabitsByDate, today),
        habitRates(habits, getHabitsByDate, today)
      ),
    [habits, getHabitsByDate, today]
  );
  if (!hasInsights(insights)) return null;

  const rows: { icon: IconName; color: string; title: string; body: string }[] = [];
  if (insights.trendUp !== null)
    rows.push({
      icon: 'trending-up',
      color: c.successText,
      title: t('home.insights.trendUp', { count: insights.trendUp }),
      body: t('home.insights.trendUpText'),
    });
  if (insights.strongest)
    rows.push({
      icon: 'star',
      color: c.rewardText,
      title: t('home.insights.strongest'),
      body: t('home.insights.strongestText', insights.strongest),
    });
  if (insights.focus)
    rows.push({
      // Kind, and in the warm colour: a nudge, not a failure.
      icon: 'compass-outline',
      color: c.flame,
      title: t('home.insights.focus'),
      body: t('home.insights.focusText', insights.focus),
    });

  return (
    <Surface style={styles.card}>
      <View style={styles.header}>
        <AppText variant="titleSm" style={styles.flex}>
          {t('home.insights.title')}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('home.insights.period', { count: INSIGHT_WEEKS })}
        </AppText>
      </View>
      {rows.map((row, i) => (
        <View key={row.icon}>
          {i > 0 && <Divider style={styles.divider} />}
          <View style={styles.row}>
            <IconBadge icon={row.icon} color={row.color} />
            <View style={styles.text}>
              <AppText variant="bodyStrong">{row.title}</AppText>
              <AppText variant="label" tone="muted" style={styles.body}>
                {row.body}
              </AppText>
            </View>
          </View>
        </View>
      ))}
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
  divider: {
    marginLeft: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
  },
  text: {
    flex: 1,
    marginLeft: space.md,
  },
  body: {
    marginTop: 2,
  },
});
