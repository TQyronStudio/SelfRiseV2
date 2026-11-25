/**
 * The remaining celebration windows in the new look (migration E10; from the
 * Design Lab's otherMoments.tsx, goalParts GoalDoneMoment, journalParts
 * MilestoneMoment, and challengeMoments' window parts).
 *
 * Views in the window layer (plan 6.0, layer 4) — no RN <Modal>. Each is still
 * ONE window of ModalQueueContext; the queue's order is unchanged.
 *
 * - NEW CHAPTER: the only level-up with a window, when a tier is entered
 *   (11/21/41/61/81). The trophies of the same action may ride inside (L-8).
 * - JOURNAL STREAK: a window for 7/30/100/365/1000 days (the others are a quiet
 *   note — journal screen), with the living flame; the app's own texts.
 * - MULTIPLIER (harmony): the factor and hours from XP_MULTIPLIERS; no bonus tile.
 * - GOAL DONE and ⭐🔥👑: one window each.
 * A window whose XP was held (goal, streak, bonus entry, trophies) registers its
 * button as the point the XP leaves from as it closes (registerMomentOrigin).
 */
import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, fonts, radius, space, tier as tierTokens, TierId, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { FeelMoment } from '@/src/constants/feel';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import { getHabitIonicon } from '@/src/constants/habitIcons';
import { registerMomentOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import { HoldKind } from '@/src/services/xpDisplay/xpLedger';
import { LEVEL_TIERS, tierFill, tierOf } from '@/src/services/levels/levelsJourney';
import { rankTitle } from '@/src/services/levels/rankTitle';
import { getJournalStreakMilestoneTexts, getJournalStreakReward } from '@/src/utils/journalStreakMilestones';
import { Achievement } from '@/src/types/gamification';
import { Goal } from '@/src/types/goal';
import { daysBetween, formatDateToString } from '@/src/utils/date';
import { AppText, PressableScale, SignatureIcon, StreakFlame, typeStyle } from '@/src/components/ui';

type AnimatedViewStyle = React.ComponentProps<typeof Animated.View>['style'];

const [GOLD, GOLD_DEEP] = fixed.gold;
const LEAVE_MS = 240;

// ---------------------------------------------------------------------------
// The shared frame
// ---------------------------------------------------------------------------

/**
 * Entrance, exit and the button's point: `close()` registers the button as the
 * point the held XP of `hold` leaves from, plays the exit and reports closed —
 * also if the animation is cut short (the queue must move on).
 */
function useMomentWindow(onClose: () => void, announcement: string, moment: FeelMoment, hold?: HoldKind) {
  const p = useSharedValue(0);
  const leaving = useRef(false);
  const closed = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRef = useRef<View>(null);
  useEffect(() => {
    p.value = withSpring(1, { damping: 16, stiffness: 170, mass: 0.9 });
    AccessibilityInfo.announceForAccessibility(announcement);
    feel(moment);
    return () => {
      if (fallback.current) clearTimeout(fallback.current);
    };
    // Once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    const finish = () => {
      if (closed.current) return;
      closed.current = true;
      onClose();
    };
    const go = () => {
      p.value = withTiming(0, { duration: LEAVE_MS }, finished => {
        if (finished) scheduleOnRN(finish);
      });
      fallback.current = setTimeout(finish, LEAVE_MS + 200);
    };
    const node = buttonRef.current;
    if (hold && node) {
      node.measureInWindow((x, y, w, h) => {
        registerMomentOrigin(hold, { x: x + w / 2, y: y + h / 2 });
        go();
      });
    } else go();
  }, [p, onClose, hold]);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.55 * Math.min(1, p.value) }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.4),
    transform: [{ translateY: (1 - p.value) * 60 }, { scale: 0.9 + 0.1 * p.value }],
  }));
  return { close, buttonRef, scrimStyle, cardStyle };
}

function Frame({
  scrimStyle,
  cardStyle,
  children,
}: {
  scrimStyle: AnimatedViewStyle;
  cardStyle: AnimatedViewStyle;
  children: ReactNode;
}) {
  const { c } = useDesign();
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fixed.black }, scrimStyle]} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, cardStyle]}>
          {children}
        </Animated.View>
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  buttonRef,
}: {
  label: string;
  onPress: () => void;
  buttonRef: React.RefObject<View | null>;
}) {
  const { c } = useDesign();
  return (
    <View ref={buttonRef} collapsable={false}>
      <PressableScale onPress={onPress} feel={null} accessibilityLabel={label} style={styles.button}>
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.pill]}
        />
        <AppText variant="bodyStrong" tone="onPrimary">
          {label}
        </AppText>
      </PressableScale>
    </View>
  );
}

/** The disc at the top of a window, with a ring that spreads once. */
function Emblem({ ringColor, children }: { ringColor: string; children: ReactNode }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withDelay(200, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [ring]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: 1 - ring.value, transform: [{ scale: 0.9 + 1.2 * ring.value }] }));
  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.4 + 0.6 * Math.min(1, ring.value * 1.6) }] }));
  return (
    <View style={styles.medalBox}>
      <Animated.View style={[styles.medalRing, { borderColor: ringColor }, ringStyle]} />
      <Animated.View style={discStyle}>{children}</Animated.View>
    </View>
  );
}

function Reward({ xp }: { xp: number }) {
  const { c } = useDesign();
  const { t } = useI18n();
  return (
    <View style={[styles.reward, { backgroundColor: c.rewardSoft }]}>
      <Ionicons name="sparkles" size={14} color={c.rewardText} />
      <AppText variant="bodyStrong" tone="reward" style={styles.rewardText}>
        {t('achievements.card.xpReward', { xp })}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// New chapter
// ---------------------------------------------------------------------------

export function ChapterWindow({
  level,
  tierId,
  also = [],
  xp = 0,
  onClose,
}: {
  level: number;
  tierId: TierId;
  /** Trophies of the same action (L-8); their XP flies from the button. */
  also?: Achievement[];
  xp?: number;
  onClose: () => void;
}) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const look = tierTokens[tierId];
  const range = tierOf(level);
  const name = t(`gamification.levels.overview.rarity.${tierId}`);
  const levelLine = `${t('onboarding.done.statLevel', { level })} · ${rankTitle(level, t)}`;
  const { close, buttonRef, scrimStyle, cardStyle } = useMomentWindow(
    onClose,
    `${t('gamification.chapter.overline')}. ${name}. ${levelLine}${
      also.length
        ? `. ${t('achievements.celebration.alsoUnlocked')}: ${also.map(a => t(a.nameKey)).join(', ')}. ${t('achievements.card.xpReward', { xp })}`
        : ''
    }`,
    'chapter',
    also.length ? 'trophy' : undefined
  );
  return (
    <Frame scrimStyle={scrimStyle} cardStyle={cardStyle}>
      <Emblem ringColor={look.fill[1]}>
        <View style={[styles.medal, { backgroundColor: look.fill[1] }]}>
          <Text maxFontSizeMultiplier={1.2} style={[typeStyle('number', look.on), styles.bold]}>
            {level}
          </Text>
        </View>
      </Emblem>
      <Text maxFontSizeMultiplier={1.4} style={[typeStyle('overline', look.text[mode]), styles.centered]}>
        {t('gamification.chapter.overline')}
      </Text>
      <AppText variant="display" style={[styles.centered, styles.gapXs]}>
        {name}
      </AppText>
      <AppText variant="body" tone="muted" style={[styles.centered, styles.gapXs]}>
        {levelLine}
      </AppText>
      <View style={styles.strip}>
        {LEVEL_TIERS.map(part => (
          <View key={part.id} style={[styles.stripPart, { flex: part.to - part.from + 1, backgroundColor: c.track }]}>
            <LinearGradient
              colors={tierTokens[part.id].fill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                // The first level of a tier would be a sliver: show it.
                width: `${Math.max(part.id === tierId ? 0.12 : 0, tierFill(part, level)) * 100}%`,
                height: '100%',
              }}
            />
          </View>
        ))}
      </View>
      <AppText variant="label" tone="muted" style={[styles.centered, styles.gapMd]}>
        {t('gamification.chapter.line', { from: range.from, to: range.to })}
      </AppText>
      {also.length > 0 && (
        <View style={[styles.also, { borderColor: c.border }]}>
          <AppText variant="caption" tone="muted">
            {t('achievements.celebration.alsoUnlocked')}
          </AppText>
          <View style={styles.alsoRow}>
            {also.map(item => (
              <View key={item.id} style={styles.alsoItem}>
                <Text maxFontSizeMultiplier={1} style={styles.alsoIcon}>
                  {item.icon}
                </Text>
                <AppText variant="label" numberOfLines={1} style={styles.alsoName}>
                  {t(item.nameKey)}
                </AppText>
              </View>
            ))}
          </View>
          {xp > 0 && <Reward xp={xp} />}
        </View>
      )}
      <PrimaryButton label={t('ui.continue')} onPress={close} buttonRef={buttonRef} />
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// Journal streak — the big lengths
// ---------------------------------------------------------------------------

export function StreakWindow({ days, onClose }: { days: number; onClose: () => void }) {
  const { t } = useI18n();
  const words = useMemo(() => getJournalStreakMilestoneTexts(days), [days]);
  const xp = getJournalStreakReward(days);
  const daysText = t('journal.streakMoment.days', { count: days });
  const { close, buttonRef, scrimStyle, cardStyle } = useMomentWindow(
    onClose,
    `${daysText}. ${words.title}`,
    'streakWindow',
    xp > 0 ? 'streak' : undefined
  );
  return (
    <Frame scrimStyle={scrimStyle} cardStyle={cardStyle}>
      <View style={styles.flame}>
        <StreakFlame state="fire" size={104} label={daysText} />
      </View>
      <AppText variant="overline" tone="flame" style={styles.centered}>
        {t('journal.streakMoment.overline')}
      </AppText>
      <AppText variant="display" style={[styles.centered, styles.gapXs]}>
        {`${days}`}
      </AppText>
      <AppText variant="title" style={[styles.centered, styles.gapXs]}>
        {words.title}
      </AppText>
      <AppText variant="body" tone="muted" style={[styles.centered, styles.gapSm]}>
        {words.message}
      </AppText>
      {xp > 0 && <Reward xp={xp} />}
      <PrimaryButton label={t('ui.continue')} onPress={close} buttonRef={buttonRef} />
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// The harmony multiplier switched on
// ---------------------------------------------------------------------------

export function MultiplierWindow({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const locale = t('common.locale');
  const factor = new Intl.NumberFormat(locale).format(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER);
  const title = t('gamification.multiplier.boostTitle', { factor, count: XP_MULTIPLIERS.HARMONY_STREAK_DURATION });
  const { close, buttonRef, scrimStyle, cardStyle } = useMomentWindow(onClose, title, 'multiplierOn');
  return (
    <Frame scrimStyle={scrimStyle} cardStyle={cardStyle}>
      <Emblem ringColor={GOLD_DEEP}>
        <LinearGradient colors={[GOLD, GOLD_DEEP]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.medal}>
          <Text maxFontSizeMultiplier={1.2} style={[typeStyle('number', fixed.goldInk), styles.bold]}>
            {`${factor}×`}
          </Text>
        </LinearGradient>
      </Emblem>
      <AppText variant="overline" tone="reward" style={styles.centered}>
        {t('gamification.multiplier.harmonyOverline', { count: XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED })}
      </AppText>
      <AppText variant="title" style={[styles.centered, styles.gapXs]}>
        {title}
      </AppText>
      <AppText variant="body" tone="muted" style={[styles.centered, styles.gapSm]}>
        {t('gamification.multiplier.activatedLine', { factor: `${factor}×` })}
      </AppText>
      <PrimaryButton label={t('onboarding.welcome.cta')} onPress={close} buttonRef={buttonRef} />
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// A goal reached
// ---------------------------------------------------------------------------

export function GoalDoneWindow({ goal, xp, onClose }: { goal: Goal; xp: number; onClose: () => void }) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const color = c.primary;
  const days = Math.max(1, daysBetween(goal.startDate, goal.completedDate ?? formatDateToString(new Date())));
  const message = useMemo(() => t(`goals.completion.message${1 + (goal.id.length % 5)}`), [t, goal.id]);
  const { close, buttonRef, scrimStyle, cardStyle } = useMomentWindow(
    onClose,
    `${t('goals.completion.title')}. ${goal.title}`,
    'goalDone',
    'goal'
  );
  return (
    <Frame scrimStyle={scrimStyle} cardStyle={cardStyle}>
      <Emblem ringColor={color}>
        <LinearGradient colors={[withAlpha(color, 0.2), color]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.medal}>
          <Ionicons name="flag" size={42} color={fixed.white} />
        </LinearGradient>
      </Emblem>
      <AppText variant="overline" tone="reward" style={styles.centered}>
        {t('goals.completion.title')}
      </AppText>
      <AppText variant="title" style={[styles.centered, styles.gapXs]}>
        {goal.title}
      </AppText>
      <AppText variant="body" tone="muted" style={[styles.centered, styles.gapSm]}>
        {message}
      </AppText>
      <AppText variant="caption" tone="faint" style={[styles.centered, styles.gapXs]}>
        {`${new Intl.NumberFormat(locale).format(goal.targetValue)} ${goal.unit} · ${t('goals.completion.doneIn', { count: days })}`}
      </AppText>
      <Reward xp={xp} />
      <PrimaryButton label={t('goals.completion.continue')} onPress={close} buttonRef={buttonRef} />
    </Frame>
  );
}

// ---------------------------------------------------------------------------
// ⭐ 🔥 👑 — a bonus milestone of the day (4th, 8th, 13th entry)
// ---------------------------------------------------------------------------

const RAYS = 12;

export function BonusEntryWindow({
  bonusCount,
  xp,
  onClose,
}: {
  /** 1 = ⭐, 5 = 🔥, 10 = 👑 */
  bonusCount: number;
  xp: number;
  onClose: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const icon = bonusCount >= 10 ? 'crown' : bonusCount >= 5 ? 'flame' : 'star';
  const burst = useSharedValue(0);
  useEffect(() => {
    burst.value = withDelay(180, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [burst]);
  const medalStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.3 + 0.7 * Math.min(1.08, burst.value * 1.15) }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: 1 - burst.value, transform: [{ scale: 0.8 + 1.1 * burst.value }] }));
  const { close, buttonRef, scrimStyle, cardStyle } = useMomentWindow(
    onClose,
    t(`journal.bonusMilestone${bonusCount}_title`),
    'bonusEntry',
    'bonusEntry'
  );
  return (
    <Frame scrimStyle={scrimStyle} cardStyle={cardStyle}>
      <View style={styles.medalBox}>
        {Array.from({ length: RAYS }, (_, i) => (
          <Ray key={i} angle={(360 / RAYS) * i} progress={burst} color={c.reward} />
        ))}
        <Animated.View style={[styles.medalRing, { borderColor: c.reward }, ringStyle]} />
        <Animated.View style={medalStyle}>
          <LinearGradient colors={[c.rewardSoft, c.reward]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.medal}>
            <SignatureIcon name={icon} size={48} tones={[fixed.white, fixed.goldWhite]} />
          </LinearGradient>
        </Animated.View>
      </View>
      <AppText variant="title" style={[styles.centered, styles.gapLg]}>
        {t(`journal.bonusMilestone${bonusCount}_title`)}
      </AppText>
      <AppText variant="body" tone="muted" style={[styles.centered, styles.gapSm]}>
        {t(`journal.bonusMilestone${bonusCount}_text`)}
      </AppText>
      {xp > 0 && <Reward xp={xp} />}
      <PrimaryButton label={t('achievements.celebration.continue_button')} onPress={close} buttonRef={buttonRef} />
    </Frame>
  );
}

function Ray({ angle, progress, color }: { angle: number; progress: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value > 0 && progress.value < 1 ? 1 - progress.value : 0,
    transform: [{ rotate: `${angle}deg` }, { translateY: -(40 + 34 * progress.value) }],
  }));
  return <Animated.View style={[styles.ray, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: space.xxl,
    paddingTop: space.xxxl,
  },
  centered: { textAlign: 'center' },
  bold: { fontFamily: fonts.bold },
  gapXs: { marginTop: space.xs },
  gapSm: { marginTop: space.sm },
  gapMd: { marginTop: space.md },
  gapLg: { marginTop: space.lg },
  medalBox: { height: 116, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  medal: { width: 96, height: 96, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  medalRing: { position: 'absolute', width: 96, height: 96, borderRadius: radius.pill, borderWidth: 3 },
  ray: { position: 'absolute', width: 4, height: 14, borderRadius: radius.pill },
  button: {
    height: 52,
    marginTop: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pill: { borderRadius: radius.pill },
  strip: { flexDirection: 'row', gap: 3, marginTop: space.xl },
  stripPart: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  flame: { alignItems: 'center', marginBottom: space.md },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  rewardText: { marginLeft: 6 },
  also: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alsoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, marginTop: space.sm },
  alsoItem: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
  alsoIcon: { ...typeStyle('label', fixed.ink) },
  alsoName: { marginLeft: space.sm, flexShrink: 1 },
});
