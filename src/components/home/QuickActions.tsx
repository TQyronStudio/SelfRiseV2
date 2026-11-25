/**
 * Home: the four quick actions (migration E11b, from the Design Lab's
 * HomeConcept). Each one opens the right sheet in its tab through the same
 * `?quickAction=…` links as before — the target tabs listen for them
 * (habits, journal ×2, goals). The old card's habit toggles moved into
 * Today's habits (TodayHabits.tsx).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { radius, space, withAlpha } from '@/src/design/tokens';
import { AppText, PressableScale } from '@/src/components/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function QuickActions() {
  const { c } = useDesign();
  const { t } = useI18n();
  const router = useRouter();
  return (
    <View style={styles.row}>
      <QuickTile
        icon="add"
        label={t('home.quickActions.addHabit')}
        tint={c.primary}
        background={c.primarySoft}
        onPress={() => router.push('/(tabs)/habits?quickAction=addHabit')}
      />
      <QuickTile
        icon="heart"
        label={t('home.quickActions.gratitude')}
        tint={c.habit.pink}
        background={withAlpha(c.habit.pink, 0.13)}
        onPress={() => router.push('/(tabs)/journal?quickAction=addGratitude')}
      />
      <QuickTile
        icon="star"
        label={t('home.quickActions.selfPraise')}
        tint={c.successText}
        background={c.successSoft}
        onPress={() => router.push('/(tabs)/journal?quickAction=addSelfPraise')}
      />
      <QuickTile
        icon="flag"
        label={t('home.quickActions.addGoal')}
        tint={c.flame}
        background={c.flameSoft}
        onPress={() => router.push('/(tabs)/goals?quickAction=addGoal')}
      />
    </View>
  );
}

function QuickTile({
  icon,
  label,
  tint,
  background,
  onPress,
}: {
  icon: IconName;
  label: string;
  tint: string;
  background: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      pressScale={0.95}
      style={[
        styles.tile,
        { backgroundColor: c.surface, borderColor: c.border, boxShadow: c.shadow },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <AppText variant="caption" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
    borderRadius: radius.md + 4,
    borderWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: space.sm,
    textAlign: 'center',
  },
});
