/**
 * Reorder mode for the Habits concept (Design Lab, kolo 14).
 *
 * Uses the app's own ReorderableList (react-native-sortables), so it behaves by the
 * rules in technical-guides:Habits.md → "Řazení": only the handle picks an item up,
 * it lifts at once, the page keeps scrolling everywhere else and auto-scrolls at the
 * edges, haptics only with vibrations on, nothing is saved when nothing moved.
 *
 * What the premium look adds: the cards slim down to rows with an order number, a
 * clear "Done", and after a drop the numbers ROLL to their new places — you see
 * the new order settle. The order is lab state and shows on the Habits list at once.
 *
 * GOING LIVE (1:1): already uses the app's ReorderableList — its rules stay as they
 * are (handle only, no delay, scroll ref). Only the row look and rolling numbers
 * are new.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ReorderableList,
  ReorderHandle,
} from '@/src/components/common/ReorderableList';
import {
  notification,
  NotificationFeedbackType,
} from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  IconBadge,
  LabText,
  PressableScale,
  Surface,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { RollingNumber } from './RollingNumber';
import { MOCK_COPY } from './mockCopy';
import { addDays, LabHabit, mondayOf, startOfDay } from './habitsMock';

interface ReorderProps {
  habits: LabHabit[];
  bottomInset: number;
  onReorder: (ids: string[]) => void;
  onDone: () => void;
}

export function HabitsReorderConcept({
  habits,
  bottomInset,
  onReorder,
  onDone,
}: ReorderProps) {
  const { c, lang } = useLab();
  const h = MOCK_COPY[lang].habits;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const ids = habits.map(x => x.id);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={[
        contentColumn,
        {
          paddingHorizontal: labSpace.xl,
          paddingBottom: bottomInset + labSpace.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar: the level badge stays pinned on the left. */}
      <View style={styles.topBar}>
        <PressableScale
          onPress={() => {
            notification(NotificationFeedbackType.Success);
            onDone();
          }}
          haptic={null}
          pressScale={0.94}
          accessibilityLabel={h.reorderDone}
          style={styles.done}
        >
          <LinearGradient
            colors={c.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: labRadius.pill }]}
          />
          <Ionicons
            name="checkmark"
            size={18}
            color={c.onPrimary}
            style={{ marginRight: 6 }}
          />
          <LabText variant="bodyStrong" tone="onPrimary">
            {h.reorderDone}
          </LabText>
        </PressableScale>
      </View>

      <Animated.View entering={FadeInDown.duration(260)}>
        <LabText variant="display">{h.reorderTitle}</LabText>
        <LabText
          variant="body"
          tone="muted"
          italic
          style={{ marginTop: 2, marginBottom: labSpace.xl }}
        >
          {h.reorderHint}
        </LabText>
      </Animated.View>

      <ReorderableList
        data={habits}
        keyExtractor={x => x.id}
        scrollableRef={scrollRef}
        onReorder={orders => {
          const next = [...orders]
            .sort((a, b) => a.order - b.order)
            .map(o => o.id);
          onReorder(next);
        }}
        renderItem={habit => (
          <ReorderRow habit={habit} index={ids.indexOf(habit.id)} />
        )}
      />
    </Animated.ScrollView>
  );
}

function ReorderRow({ habit, index }: { habit: LabHabit; index: number }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const monday = mondayOf(startOfDay(new Date()));
  const schedule =
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
  const paused = habit.pausedDaysAgo !== undefined;

  // Rows enter one after another when the mode opens (first mount only — a drop
  // re-renders the row, it does not remount it).
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 40).duration(280)}>
      <Surface style={[styles.row, { marginBottom: labSpace.sm }]}>
        <View style={[styles.number, { backgroundColor: c.surfaceRaised }]}>
          <RollingNumber
            text={`${index + 1}`}
            variant="caption"
            style={{ fontFamily: labFonts.bold }}
          />
        </View>
        <View style={{ opacity: paused ? 0.5 : 1 }}>
          <IconBadge
            icon={habit.icon as never}
            color={paused ? c.textMuted : c.habit[habit.color]}
            size={36}
          />
        </View>
        <View style={{ flex: 1, marginLeft: labSpace.md }}>
          <LabText
            variant="bodyStrong"
            numberOfLines={1}
            tone={paused ? 'muted' : 'text'}
          >
            {habit.name[lang]}
          </LabText>
          <LabText variant="caption" tone="faint" numberOfLines={1}>
            {paused ? `⏸ ${copy.habits.pausedSection}` : schedule}
          </LabText>
        </View>
        <ReorderHandle style={{ marginRight: -labSpace.sm }}>
          <View style={[styles.grip, { backgroundColor: c.surfaceRaised }]}>
            <Ionicons
              name="reorder-three-outline"
              size={20}
              color={c.textMuted}
            />
          </View>
        </ReorderHandle>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 48,
    marginTop: labSpace.sm,
    marginBottom: labSpace.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.lg,
    paddingVertical: labSpace.sm + 2,
    borderRadius: labRadius.pill,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.sm,
    paddingLeft: labSpace.md,
    paddingRight: labSpace.md,
    borderRadius: labRadius.md,
  },
  number: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: labSpace.md,
  },
  grip: {
    width: 36,
    height: 32,
    borderRadius: labRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
