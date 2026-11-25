/**
 * Home: today's habits (migration E11b, from the Design Lab's HomeConcept).
 *
 * Only the habits PLANNED today — the same list and the same "done" the hero's
 * "x/y" counts and the Habits tab's Today card show (splitHabits / doneToday in
 * habitListLogic.ts). Habits off today's plan are not here: a check outside the
 * plan is a bonus or a make-up, and that choice lives on the Habits tab, where
 * its rules are shown. The count is not repeated in the title — once on the
 * screen is enough (P60).
 *
 * A check: the row warms up, the icon gives one small bounce, and the XP layer
 * flies the gain from the check (registerXpOrigin, E7) — the number is the one
 * storage credited, never a constant here.
 */
import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useDesign } from '@/src/contexts/ThemeContext';
import { getHabitIonicon } from '@/src/constants/habitIcons';
import { motion, radius, space } from '@/src/design/tokens';
import { registerXpOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import { HabitColor, HabitIcon } from '@/src/types/common';
import {
  AppText,
  CheckButton,
  Divider,
  IconBadge,
  Surface,
} from '@/src/components/ui';

export interface TodayHabitItem {
  id: string;
  name: string;
  icon: HabitIcon;
  color: HabitColor;
  schedule: string;
  done: boolean;
}

interface TodayHabitsProps {
  title: string;
  habits: TodayHabitItem[];
  onToggle: (habitId: string) => void;
}

export function TodayHabits({
  title,
  habits,
  onToggle,
}: TodayHabitsProps) {
  if (habits.length === 0) return null;
  return (
    <View>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <Surface style={styles.list}>
        {habits.map((habit, i) => (
          <View key={habit.id}>
            {i > 0 && <Divider style={styles.divider} />}
            <HabitRow {...habit} onToggle={onToggle} />
          </View>
        ))}
      </Surface>
    </View>
  );
}

interface HabitRowProps extends TodayHabitItem {
  onToggle: (habitId: string) => void;
}

/** Re-renders only when its own habit changed (the callback is stable). */
const HabitRow = memo(function HabitRow({
  id,
  name,
  icon,
  color,
  schedule,
  done,
  onToggle,
}: HabitRowProps) {
  const { c } = useDesign();
  const checkRef = useRef<View>(null);
  const glow = useSharedValue(done ? 1 : 0);
  const bounce = useSharedValue(1);
  const mounted = useRef(false);

  useEffect(() => {
    glow.value = withTiming(done ? 1 : 0, { duration: motion.base });
    // The bounce answers a check, not the first render of a done habit.
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

  const check = () => {
    // Where the sparks start; the gain itself arrives once storage wrote it.
    checkRef.current?.measureInWindow((x, y, w, h) =>
      registerXpOrigin(
        { source: 'habit', sourceId: id },
        { x: x + w / 2, y: y + h / 2 }
      )
    );
    onToggle(id);
  };

  return (
    <View style={styles.row}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.glow,
          { backgroundColor: c.successSoft },
          glowStyle,
        ]}
      />
      <Animated.View style={badgeStyle}>
        <IconBadge icon={getHabitIonicon(icon)} color={c.habit[color]} />
      </Animated.View>
      <Animated.View style={[styles.text, nameStyle]}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.schedule}>
          {schedule}
        </AppText>
      </Animated.View>
      <View ref={checkRef} collapsable={false}>
        <CheckButton
          done={done}
          label={name}
          onToggle={check}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  title: {
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  list: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  divider: {
    // Starts under the name, not under the icon.
    marginLeft: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
  },
  glow: {
    top: 4,
    bottom: 4,
    borderRadius: radius.sm,
  },
  text: {
    flex: 1,
    marginLeft: space.md,
  },
  schedule: {
    marginTop: 2,
  },
});
