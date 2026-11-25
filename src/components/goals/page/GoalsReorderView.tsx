/**
 * Reorder mode of the Goals screen in the new look (migration E14 point 4) —
 * the same as the habits' (HabitsReorderView): the RULES are the shared
 * ReorderableList (only the handle picks a row up, the page scrolls everywhere
 * else and at the edges, nothing is saved when nothing moved); new is the look —
 * slim rows with an order number that rolls after a drop. "Done" is the top
 * row's button (GoalsScreen).
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space } from '@/src/design/tokens';
import { goalLook } from '@/src/constants/goalLook';
import { ReorderableList, ReorderHandle } from '@/src/components/common/ReorderableList';
import { Goal } from '@/src/types/goal';
import { contentColumn } from '@/src/utils/layout';
import { AppText, IconBadge, RollingNumber, Surface } from '@/src/components/ui';
import { deadlineText } from './GoalCard';

interface GoalsReorderViewProps {
  goals: Goal[];
  bottomInset: number;
  onReorder: (orders: { id: string; order: number }[]) => void;
}

export function GoalsReorderView({ goals, bottomInset, onReorder }: GoalsReorderViewProps) {
  const { t } = useI18n();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const ordered = useMemo(() => [...goals].sort((a, b) => a.order - b.order), [goals]);
  const ids = ordered.map(g => g.id);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[contentColumn, styles.content, { paddingBottom: bottomInset + space.xxl }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(260)}>
        <AppText variant="display">{t('goals.actions.reorder')}</AppText>
        <AppText variant="body" tone="muted" italic style={styles.hint}>
          {t('habits.reorderMode.hint')}
        </AppText>
      </Animated.View>

      <ReorderableList
        data={ordered}
        keyExtractor={g => g.id}
        scrollableRef={scrollRef}
        onReorder={onReorder}
        renderItem={goal => <ReorderRow goal={goal} index={ids.indexOf(goal.id)} />}
      />
    </Animated.ScrollView>
  );
}

function ReorderRow({ goal, index }: { goal: Goal; index: number }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const look = goalLook(goal.category);
  // Rows enter one after another when the mode opens (first mount only).
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 40).duration(280)}>
      <Surface style={styles.row}>
        <View style={[styles.number, { backgroundColor: c.surfaceRaised }]} accessibilityLabel={`${index + 1}`}>
          <RollingNumber text={`${index + 1}`} variant="caption" style={{ fontFamily: fonts.bold }} />
        </View>
        <IconBadge icon={look.icon} color={c.habit[look.color]} size={36} />
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {goal.title}
          </AppText>
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {deadlineText(goal.targetDate, t)}
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
  text: { flex: 1, marginLeft: space.md },
  handle: { marginRight: -space.sm },
  grip: { width: 36, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
