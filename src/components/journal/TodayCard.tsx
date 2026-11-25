/**
 * The Journal's TODAY card (migration E12, from the Design Lab's JournalConcept):
 * the day's count against the daily three, three segments, the streak flame and
 * number, the bonus road after the third entry (⭐ 4, 🔥 8, 👑 13), the longest
 * streak and the milestone badges (they open the statistics).
 *
 * R-13: the third entry completes the day HERE — the segments turn green, the
 * card glows once, one success haptic — instead of a "congratulations" window.
 * Only a real third entry on the focused screen (completedTheDay), never the
 * entries arriving after launch. The rules: src/screens/journal/journalDayLogic.ts.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { journalMilestoneAt, JOURNAL_DAILY_GOAL } from '@/src/utils/journalXp';
import {
  completedTheDay,
  dayStatusKey,
  nextMilestone,
  ROAD_FIRST,
  ROAD_LAST,
  roadProgress,
} from '@/src/screens/journal/journalDayLogic';
import {
  AppText,
  Divider,
  FlameState,
  HelpLink,
  InlineIcon,
  PressableScale,
  ProgressBar,
  RestSignal,
  RollingNumber,
  SignatureIcon,
  StreakFlame,
  Surface,
} from '@/src/components/ui';

interface TodayCardProps {
  count: number;
  streak: number;
  longest: number;
  flame: FlameState;
  onWarmed: () => void;
  frozen: boolean;
  stars: number;
  flames: number;
  crowns: number;
  onOpenStats: () => void;
  rest: RestSignal;
  bottomInset: number;
}

export function TodayCard({
  count,
  streak,
  longest,
  flame,
  onWarmed,
  frozen,
  stars,
  flames,
  crowns,
  onOpenStats,
  rest,
  bottomInset,
}: TodayCardProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const focused = useIsFocused();
  const complete = count >= JOURNAL_DAILY_GOAL;

  // The third entry completes the day here, in place: one glow, one haptic.
  const glow = useSharedValue(0);
  const prev = useRef<number | null>(null);
  useEffect(() => {
    if (completedTheDay(prev.current, count) && focused) {
      feel('dayDone');
      glow.value = withSequence(
        withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.cubic) })
      );
    }
    prev.current = count;
    // `focused` is read, not followed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const status = dayStatusKey(count);
  const statusText =
    'count' in status ? t(status.key, { count: status.count }) : t(status.key);

  return (
    <Surface style={styles.card}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: c.successSoft }, glowStyle]}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <View style={styles.head}>
            <AppText variant="overline" tone="primary">
              {t('journal.today')}
            </AppText>
            {/* Three a day, ⭐ 🔥 👑 at 4 / 8 / 13. */}
            <View style={styles.help}>
              <HelpLink topic="journalDay" bottomInset={bottomInset} />
            </View>
          </View>
          <View style={styles.countRow}>
            <RollingNumber text={`${count}`} variant="number" />
            <AppText variant="title" tone="faint" style={styles.of}>
              {`/${JOURNAL_DAILY_GOAL}`}
            </AppText>
            {count > JOURNAL_DAILY_GOAL && (
              <View style={[styles.plusChip, { backgroundColor: c.rewardSoft }]}>
                <RollingNumber
                  text={`+${count - JOURNAL_DAILY_GOAL}`}
                  variant="caption"
                  tone="reward"
                  style={styles.bold}
                />
              </View>
            )}
          </View>
          <AppText variant="label" tone={complete ? 'success' : 'muted'} style={styles.status}>
            {statusText}
          </AppText>
        </View>
        <View style={styles.streakBox}>
          <StreakFlame
            state={flame}
            onWarmed={onWarmed}
            size={60}
            rest={rest}
            label={frozen ? t('journal.frozenStreak') : t('journal.currentStreak')}
          />
          <View style={styles.streakText}>
            <RollingNumber
              text={`${streak}`}
              variant="number"
              style={frozen ? { color: c.ice } : undefined}
            />
            <AppText variant="caption" style={{ color: frozen ? c.ice : c.textMuted }}>
              {frozen ? t('journal.frozenStreak') : t('journal.currentStreak')}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.segments}>
        {Array.from({ length: JOURNAL_DAILY_GOAL }, (_, i) => (
          <ProgressBar
            key={i}
            progress={count > i ? 1 : 0}
            colors={complete ? [c.success, c.success] : c.primaryGradient}
            height={10}
            style={styles.flex}
          />
        ))}
      </View>

      {complete && <BonusRoad count={count} />}

      <AppText variant="caption" tone="faint" style={styles.longest}>
        {`${t('journal.longestStreak')} · ${longest}`}
      </AppText>

      <Divider style={styles.divider} />
      <PressableScale
        onPress={onOpenStats}
        pressScale={0.98}
        accessibilityLabel={`${t('journal.stats.milestoneBadges')}: ${t('journal.iconNames.star')} ${stars}, ${t('journal.iconNames.flame')} ${flames}, ${t('journal.iconNames.crown')} ${crowns}`}
        style={styles.badges}
      >
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {t('journal.stats.milestoneBadges')}
        </AppText>
        {(
          [
            ['star', stars],
            ['flame', flames],
            ['crown', crowns],
          ] as const
        ).map(([kind, n]) => (
          <View key={kind} style={styles.badge}>
            <SignatureIcon name={kind} size={18} />
            <RollingNumber text={`${n}`} variant="caption" style={styles.badgeCount} />
          </View>
        ))}
        <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
      </PressableScale>
    </Surface>
  );
}

/** Positions 4–13 after the daily three: ⭐ at 4, 🔥 at 8, 👑 at 13. */
function BonusRoad({ count }: { count: number }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const positions = Array.from(
    { length: ROAD_LAST - ROAD_FIRST + 1 },
    (_, i) => i + ROAD_FIRST
  );
  const next = nextMilestone(count);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.road}>
      <View style={styles.roadHead}>
        <AppText variant="overline" tone="reward" style={styles.flex}>
          {t('journal.bonusRoad.title')}
        </AppText>
        <AppText
          variant="caption"
          tone="muted"
          {...(next
            ? {
                accessibilityLabel: `${t('journal.bonusRoad.toNext', { count: next.left })} ${t(`journal.iconNames.${next.kind}`)}`,
              }
            : null)}
        >
          {next ? (
            <>
              {t('journal.bonusRoad.toNext', { count: next.left })}{' '}
              <InlineIcon name={next.kind} />
            </>
          ) : (
            t('journal.bonusRoad.allCollected')
          )}
        </AppText>
      </View>
      <View style={styles.roadTrackBox}>
        <View style={[styles.roadTrack, { backgroundColor: c.track }]} />
        <RoadFill progress={roadProgress(count)} color={c.reward} />
        <View style={styles.roadNodes}>
          {positions.map(pos => {
            const kind = journalMilestoneAt(pos);
            const reached = count >= pos;
            return kind ? (
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
                <View style={{ opacity: reached ? 1 : 0.45 }}>
                  <SignatureIcon name={kind} size={15} />
                </View>
              </View>
            ) : (
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
    fill.value = withTiming(progress, { duration: 600, easing: Easing.out(Easing.cubic) });
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
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.xxl,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  help: {
    marginLeft: space.md,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  of: {
    marginLeft: 2,
    marginBottom: 4,
  },
  plusChip: {
    marginLeft: space.sm,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  status: {
    marginTop: 2,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    alignItems: 'flex-end',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.lg,
  },
  longest: {
    marginTop: space.md,
  },
  divider: {
    marginTop: space.lg,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: space.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: space.md,
  },
  badgeCount: {
    fontFamily: fonts.semibold,
    marginLeft: 3,
  },
  road: {
    marginTop: space.lg,
  },
  roadHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roadTrackBox: {
    height: 26,
    marginTop: space.sm,
    justifyContent: 'center',
  },
  roadTrack: {
    position: 'absolute',
    left: 11,
    right: 11,
    height: 3,
    borderRadius: radius.xs,
  },
  roadFillClip: {
    position: 'absolute',
    left: 11,
    right: 11,
    height: 3,
    borderRadius: radius.xs,
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
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  roadMilestone: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
