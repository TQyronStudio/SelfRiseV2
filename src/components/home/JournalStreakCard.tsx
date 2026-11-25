/**
 * Home: the journal streak card in the new look (migration E11c, from the Design
 * Lab's HomeConcept; plan points 3 and 5c). Replaces GratitudeStreakCard.
 *
 * - The flame tells the story (useJournalFlame): fire; frozen = ice and the card
 *   turns icy; warmed up = the ice cracks and catches, once. Its loop rests while
 *   the page scrolls (`rest`).
 * - Frozen: the rescue is right here, no trip to the Journal and no window —
 *   one snowflake per missed day turns into a sun with each ad, the main button
 *   "Warm up (x/y)", a quiet "Start fresh" (asks first). Writing is hidden then:
 *   the Journal does not take entries while the streak is frozen.
 * - Otherwise: today's entries (three dots), ⭐🔥👑 and "Write an entry".
 * - Home and the Journal read ONE state (GratitudeContext): a day paid here is
 *   paid there at once (useStreakWarmUp refreshes after every payment).
 * - Each visit refreshes the streak (refreshStats), as the old card did: that is
 *   also where a debt of more than three days resets the streak.
 */
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { useJournalFlame } from '@/src/hooks/useJournalFlame';
import { useStreakWarmUp } from '@/src/hooks/useStreakWarmUp';
import { fixed, radius, space } from '@/src/design/tokens';
import { today as todayString } from '@/src/utils/date';
import {
  AppText,
  Chip,
  Divider,
  PressableScale,
  RestSignal,
  SignatureIcon,
  SignatureName,
  StreakFlame,
  Surface,
} from '@/src/components/ui';

/** Entries a day that keep the streak (the storage's rule: at least three). */
const DAILY_ENTRY_GOAL = 3;
const CARD_PRESS = 0.985;

interface JournalStreakCardProps {
  rest: RestSignal;
  onOpen: () => void;
  onWrite: () => void;
  /** Asks before "Start fresh"; `confirm` resets the streak. */
  onAskStartFresh: (confirm: () => void) => void;
}

export function JournalStreakCard({
  rest,
  onOpen,
  onWrite,
  onAskStartFresh,
}: JournalStreakCardProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const streak = state.streakInfo;
  const flame = useJournalFlame(streak);
  const warmUp = useStreakWarmUp();

  // Each visit: recalculate (midnight, entries from the Journal, auto-reset).
  useFocusEffect(
    useCallback(() => {
      void actions.refreshStats();
      // `actions` is rebuilt with every state change; refresh on focus only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const today = todayString();
  const todayCount = useMemo(
    () => state.gratitudes.filter(g => g.date === today).length,
    [state.gratitudes, today]
  );

  const current = streak?.currentStreak ?? 0;
  // The rescue stays while the flame catches: the suns and "Warm-up complete"
  // are what the warming confirms.
  const rescuing = flame.state === 'ice' || flame.state === 'warming';
  const progress = warmUp.progress;
  const days = Math.max(progress?.total ?? streak?.frozenDays ?? 0, 1);
  const paid =
    flame.state === 'warming' ? days : Math.min(progress?.paid ?? 0, days);
  const adsLeft = Math.max(days - paid, 0);

  const chip =
    flame.state === 'ice' ? (
      <Chip icon="snow" label={t('home.journalCard.frozen')} tone="primary" />
    ) : flame.state === 'warming' ? (
      <Chip icon="sunny" label={t('home.journalCard.warming')} tone="reward" />
    ) : current > 0 ? (
      <Chip
        icon="checkmark-circle"
        label={t('home.streakActive')}
        tone="success"
      />
    ) : (
      // No streak yet (or after Start fresh): no "active" that is not true.
      <Chip icon="time-outline" label={t('home.startToday')} tone="primary" />
    );

  const flameLabel =
    flame.state === 'ice'
      ? t('home.journalCard.frozen')
      : flame.state === 'warming'
        ? t('home.journalCard.warming')
        : t('home.journalStreak');

  // On iOS an accessible card hides the buttons inside it from a screen
  // reader: they are offered as the card's actions instead.
  const canWarm = rescuing && adsLeft > 0 && !warmUp.isWatchingAd;
  const a11yActions = rescuing
    ? [
        ...(canWarm
          ? [{ name: 'warmUp', label: t('journal.warmUp.warmUpButton', { current: paid, total: days }) }]
          : []),
        ...(adsLeft > 0
          ? [{ name: 'startFresh', label: t('common.startFresh') }]
          : []),
      ]
    : [{ name: 'write', label: t('home.journalCard.writeEntry') }];
  const askFresh = () => onAskStartFresh(() => void warmUp.startFresh());

  return (
    <PressableScale
      pressScale={CARD_PRESS}
      feel={null}
      onPress={onOpen}
      accessibilityLabel={`${t('home.journalStreak')}, ${current} ${t('journal.streakDaysUnit', { count: current })}`}
      accessibilityActions={a11yActions}
      onAccessibilityAction={e => {
        const name = e.nativeEvent.actionName;
        if (name === 'warmUp') void warmUp.watchAd();
        else if (name === 'startFresh') askFresh();
        else if (name === 'write') onWrite();
      }}
      style={styles.card}
    >
      <Surface
        style={
          rescuing
            ? { backgroundColor: c.iceSoft, borderColor: c.iceRing }
            : undefined
        }
      >
        <View style={styles.spaceBetween}>
          <AppText variant="titleSm">{t('home.journalStreak')}</AppText>
          <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
        </View>
        <View style={styles.streakRow}>
          <StreakFlame
            state={flame.state}
            onWarmed={flame.onWarmed}
            rest={rest}
            size={56}
            label={flameLabel}
          />
          <AppText
            variant="streak"
            style={rescuing ? { color: c.ice } : undefined}
          >
            {current}
          </AppText>
          <AppText variant="label" tone="muted" style={styles.unit}>
            {t('journal.streakDaysUnit', { count: current })}
          </AppText>
          <View style={styles.flex} />
          {chip}
        </View>

        {rescuing ? (
          <>
            <AppText variant="body" style={styles.message}>
              {t('journal.warmUp.frozenMessage', { count: adsLeft })}
            </AppText>
            <WarmUpControls
              days={days}
              paid={paid}
              busy={warmUp.isWatchingAd || flame.state === 'warming'}
              onWarmUp={() => void warmUp.watchAd()}
              onStartFresh={askFresh}
            />
          </>
        ) : (
          <>
            <Divider style={styles.divider} />
            <View style={styles.meta}>
              <View style={styles.dots}>
                {Array.from({ length: DAILY_ENTRY_GOAL }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i < todayCount ? c.primary : c.track,
                      },
                    ]}
                  />
                ))}
                <AppText variant="caption" tone="muted" style={styles.dotsText}>
                  {t('home.journalCard.entriesToday', {
                    count: todayCount,
                    goal: DAILY_ENTRY_GOAL,
                  })}
                </AppText>
              </View>
              <View style={styles.badges}>
                <Badge icon="star" count={streak?.starCount ?? 0} />
                <Badge icon="flame" count={streak?.flameCount ?? 0} />
                <Badge icon="crown" count={streak?.crownCount ?? 0} />
              </View>
            </View>
            <PressableScale
              onPress={onWrite}
              accessibilityLabel={t('home.journalCard.writeEntry')}
              style={[styles.write, { backgroundColor: c.primarySoft }]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={c.primary}
                style={styles.writeIcon}
              />
              <AppText variant="bodyStrong" tone="primary">
                {t('home.journalCard.writeEntry')}
              </AppText>
            </PressableScale>
          </>
        )}
      </Surface>
    </PressableScale>
  );
}

/**
 * The missed days (snow → sun as each is paid), the one main action (one ad =
 * one day) and a quiet "Start fresh". The Journal's frozen card uses the same
 * controls from E12.
 */
export function WarmUpControls({
  days,
  paid,
  busy,
  onWarmUp,
  onStartFresh,
}: {
  days: number;
  paid: number;
  /** An ad is playing, or the flame is catching: no second tap. */
  busy: boolean;
  onWarmUp: () => void;
  onStartFresh: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const done = days - paid <= 0;
  const buttonLabel = done
    ? t('journal.warmUp.warmUpComplete')
    : t('journal.warmUp.warmUpButton', { current: paid, total: days });
  return (
    <>
      <View style={styles.debtRow}>
        {Array.from({ length: days }, (_, i) => {
          const warm = i < paid;
          return (
            <View
              key={i}
              style={[
                styles.debtDay,
                {
                  backgroundColor: warm ? c.rewardSoft : c.surface,
                  borderColor: warm ? c.reward : c.iceRing,
                },
              ]}
            >
              <Ionicons
                name={warm ? 'sunny' : 'snow'}
                size={14}
                color={warm ? c.rewardText : c.ice}
              />
            </View>
          );
        })}
        <View style={styles.flex} />
        <AppText variant="caption" style={{ color: c.ice }}>
          {t('journal.warmUp.adsProgress', { watched: paid, total: days })}
        </AppText>
      </View>
      <PressableScale
        {...(done || busy ? null : { onPress: onWarmUp })}
        accessibilityLabel={buttonLabel}
        style={styles.warmButton}
      >
        <LinearGradient
          colors={done ? [c.reward, c.reward] : [c.ice, c.iceRing]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.pill]}
        />
        <Ionicons
          name={done ? 'checkmark' : 'play'}
          size={16}
          color={fixed.white}
          style={styles.warmIcon}
        />
        <AppText variant="bodyStrong" style={{ color: fixed.white }}>
          {buttonLabel}
        </AppText>
      </PressableScale>
      {!done && (
        <PressableScale
          onPress={onStartFresh}
          accessibilityLabel={t('common.startFresh')}
          style={styles.fresh}
        >
          <AppText variant="label" tone="muted">
            {t('common.startFresh')}
          </AppText>
        </PressableScale>
      )}
    </>
  );
}

function Badge({ icon, count }: { icon: SignatureName; count: number }) {
  return (
    <View style={styles.badge}>
      <SignatureIcon name={icon} size={16} />
      <AppText variant="numberSm" style={styles.badgeCount}>
        {count}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.lg,
  },
  flex: {
    flex: 1,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.sm,
  },
  unit: {
    marginLeft: space.sm,
    marginBottom: 10,
  },
  message: {
    marginTop: space.sm,
  },
  divider: {
    marginTop: space.lg,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: space.sm,
    marginTop: space.lg,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  dotsText: {
    marginLeft: space.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: space.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCount: {
    marginLeft: 4,
  },
  write: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
  },
  writeIcon: {
    marginRight: space.sm,
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  debtDay: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: space.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  pill: {
    borderRadius: radius.pill,
  },
  warmIcon: {
    marginRight: space.sm,
  },
  fresh: {
    alignSelf: 'center',
    marginTop: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
});
