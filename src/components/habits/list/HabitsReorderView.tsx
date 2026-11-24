/**
 * Reorder mode of the Habits screen in the new look (migration E6 point 3, from
 * the Design Lab's HabitsReorderConcept, kolo 14).
 *
 * The RULES are the app's own ReorderableList (react-native-sortables) and stay
 * exactly as they are — technical-guides:Habits.md "Řazení": only the handle
 * picks an item up, it lifts at once, the page keeps scrolling everywhere else
 * and auto-scrolls at the edges, nothing is saved when nothing moved.
 *
 * New is only the look: the cards slim down to rows with an order number, and
 * after a drop the numbers ROLL to their new places. "Done" is the top row's
 * button (HabitsScreen) — one place for it, as on every other screen.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space } from '@/src/design/tokens';
import { getHabitIonicon } from '@/src/constants/habitIcons';
import { ReorderableList, ReorderHandle } from '@/src/components/common/ReorderableList';
import { Habit } from '@/src/types/habit';
import { getDayOfWeekFromDateString, parseDate, today as todayString } from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import { AppText, IconBadge, RollingNumber, Surface } from '@/src/components/ui';
import { weekOf } from '@/src/screens/habits/habitListLogic';

interface HabitsReorderViewProps {
  habits: Habit[];
  bottomInset: number;
  onReorder: (orders: { id: string; order: number }[]) => void;
}

export function HabitsReorderView({ habits, bottomInset, onReorder }: HabitsReorderViewProps) {
  const { t } = useI18n();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const ordered = useMemo(() => [...habits].sort((a, b) => a.order - b.order), [habits]);
  const ids = ordered.map(h => h.id);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[contentColumn, styles.content, { paddingBottom: bottomInset + space.xxl }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(260)}>
        <AppText variant="display">{t('habits.reorder')}</AppText>
        <AppText variant="body" tone="muted" italic style={styles.hint}>
          {t('habits.reorderMode.hint')}
        </AppText>
      </Animated.View>

      <ReorderableList
        data={ordered}
        keyExtractor={h => h.id}
        scrollableRef={scrollRef}
        onReorder={onReorder}
        renderItem={habit => <ReorderRow habit={habit} index={ids.indexOf(habit.id)} />}
      />
    </Animated.ScrollView>
  );
}

function ReorderRow({ habit, index }: { habit: Habit; index: number }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const paused = !habit.isActive;
  const schedule =
    habit.scheduledDays.length === 7
      ? t('habits.schedule.everyDay')
      : weekOf(todayString())
          .filter(day => habit.scheduledDays.includes(getDayOfWeekFromDateString(day)))
          .map(day => parseDate(day).toLocaleDateString(locale, { weekday: 'short' }))
          .join(' · ');

  // Rows enter one after another when the mode opens (first mount only — a drop
  // re-renders a row, it does not remount it).
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 40).duration(280)}>
      <Surface style={styles.row}>
        <View
          style={[styles.number, { backgroundColor: c.surfaceRaised }]}
          accessibilityLabel={`${index + 1}`}
        >
          <RollingNumber text={`${index + 1}`} variant="caption" style={{ fontFamily: fonts.bold }} />
        </View>
        <View style={paused ? styles.dim : undefined}>
          <IconBadge icon={getHabitIonicon(habit.icon)} color={paused ? c.textMuted : c.habit[habit.color]} size={36} />
        </View>
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={1} tone={paused ? 'muted' : 'text'}>
            {habit.name}
          </AppText>
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {paused ? t('habits.calendar.legendPaused') : schedule}
          </AppText>
        </View>
        <ReorderHandle style={styles.handle}>
          <View style={[styles.grip, { backgroundColor: c.surfaceRaised }]}>
            <Ionicons name="reorder-three-outline" size={20} color={c.textMuted} />
          </View>
        </ReorderHandle>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl },
  hint: { marginTop: 2, marginBottom: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    marginBottom: space.sm,
  },
  number: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  dim: { opacity: 0.5 },
  text: { flex: 1, marginLeft: space.md },
  handle: { marginRight: -space.sm },
  grip: { width: 36, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
