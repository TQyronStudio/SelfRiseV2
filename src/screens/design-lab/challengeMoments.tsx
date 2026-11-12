/**
 * The moments around a monthly challenge (kola 37–38, decisions R-37 and R-38).
 * Today the app has up to five windows for one challenge; here there are three
 * moments, and each is ONE thing:
 *
 * - A milestone (25/50/75 %) is a quiet note at the level badge — its XP flies
 *   home, nothing covers the screen (celebrationDirector.tsx → PlainNote).
 * - The challenge is finished: ONE window. The new star arrives inside it (today
 *   a second window follows half a second later), with what was earned and the
 *   multiplier the app switches on. XP is credited on "Continue".
 * - The month ended unfinished: ONE calm window, "your month" — how far the user
 *   got, what it means for the star level (kept, or one less after the second
 *   miss in a row), and straight away the new challenge. No XP is mentioned,
 *   because none is paid; the milestones on the way already paid theirs.
 *
 * All three go through the lab's one line of moments (R-29), so nothing stacks.
 * The star rules are the app's own (challengeLogic.ts → starAfter).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces MonthlyChallengeMilestoneModal (→ quiet note),
 *   MonthlyChallengeCompletionModal + StarLevelChangeModal for a promotion (→ one
 *   window), MonthlyChallengeFailureModal + StarLevelChangeModal for a demotion
 *   (→ one window). Windows stay in ModalQueueContext; the note is not a window.
 * - Triggers: `monthly_milestone_reached`, completion, `monthly_challenge_failed`
 *   and `star_level_changed` — the last one must be folded into the window of the
 *   same month instead of queueing its own (also the pending demotion on startup).
 * - The multiplier line only when the app really switched it on (it does not when
 *   another multiplier runs or the cooldown is on).
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  impact,
  ImpactFeedbackStyle,
  notification,
  NotificationFeedbackType,
} from '@/src/services/hapticsService';
import { useLabMoments } from './celebrationDirector';
import {
  CHALLENGE_MILESTONES,
  challengeReward,
  challengeShare,
  COMPLETION_MULTIPLIER,
  starAfter,
  StarLevel,
} from './challengeLogic';
import {
  CHALLENGE_LEVELS,
  LabChallenge,
  STAR_NAMES,
  useChallengeText,
  useLabChallenge,
} from './challengeMock';
import { Ring } from './GoalDetailConcept';
import { useJournalT } from './journalParts';
import { useLabCover } from './labCover';
import {
  Divider,
  LabText,
  PressableScale,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { formatThousands, MOCK_COPY } from './mockCopy';
import { useLabXpAward } from './xpFlight';

const GOLD: readonly [string, string] = ['#FFD36B', '#F4A93F'];
/** When the star changes inside a window (ms after it opened). */
const STAR_BEAT = 750;

function useStarName() {
  const t = useJournalT();
  return useCallback(
    (stars: StarLevel) =>
      t(`monthlyChallenge.starLevels.${STAR_NAMES[stars - 1]}`),
    [t]
  );
}

// ---------------------------------------------------------------------------
// Lab triggers — in the app these are events of the challenge services
// ---------------------------------------------------------------------------

/** A finished month that was not completed, for the recap window. */
const UNFINISHED: LabChallenge = {
  templateId: 'consistency_triple_master',
  category: 'consistency',
  stars: 2,
  warmUp: false,
  requirements: [{ done: 14, target: 18 }],
  day: 31,
  days: 31,
  daily: [],
  streakBefore: 2,
};
const FINISHED: LabChallenge = {
  templateId: 'habits_consistency_master',
  category: 'habits',
  stars: 3,
  warmUp: false,
  requirements: [{ done: 62, target: 62 }],
  day: 27,
  days: 31,
  daily: [],
  streakBefore: 3,
};
/** The next month's challenge: another category, at that category's own level. */
const NEXT = {
  templateId: 'journal_reflection_expert',
  category: 'journal',
} as const;

export type ChallengeMomentKind = 'milestone' | 'finish' | 'kept' | 'lost';

export function useChallengeMoments(): (kind: ChallengeMomentKind) => void {
  const { lang } = useLab();
  const copy = MOCK_COPY[lang];
  const { showNote, showWindow } = useLabMoments();
  const { challenge } = useLabChallenge();
  const words = useChallengeText(challenge);
  return useCallback(
    (kind: ChallengeMomentKind) => {
      if (kind === 'milestone') {
        // The next milestone ahead of the challenge on screen (the last one if
        // all are behind it).
        const percent = challengeShare(challenge.requirements) * 100;
        const milestone =
          CHALLENGE_MILESTONES.find(m => m.at > percent) ??
          CHALLENGE_MILESTONES[CHALLENGE_MILESTONES.length - 1]!;
        showNote({
          icon: 'flag',
          overline: copy.challengeOverline,
          title: copy.challenge.milestoneNote(milestone.at, words.title),
          xp: milestone.xp,
        });
      } else if (kind === 'finish') {
        showWindow(done => (
          <ChallengeDoneWindow challenge={FINISHED} onClosed={done} />
        ));
      } else {
        showWindow(done => (
          <MonthRecapWindow
            challenge={
              kind === 'kept'
                ? UNFINISHED
                : { ...UNFINISHED, requirements: [{ done: 9, target: 18 }] }
            }
            // "lost": the month before was a miss too.
            failuresBefore={kind === 'kept' ? 0 : 1}
            onClosed={done}
          />
        ));
      }
    },
    [challenge, copy, words.title, showNote, showWindow]
  );
}

// ---------------------------------------------------------------------------
// Shared: the window's frame and its stars
// ---------------------------------------------------------------------------

const LEAVE_MS = 240;

function useWindowMotion(onClosed: () => void, announcement: string) {
  const p = useSharedValue(0);
  const leaving = useRef(false);
  const closed = useRef(false);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    p.value = withSpring(1, { damping: 16, stiffness: 170, mass: 0.9 });
    AccessibilityInfo.announceForAccessibility(announcement);
    return () => {
      if (fallback.current) clearTimeout(fallback.current);
    };
    // Once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave = useCallback(
    (before?: () => void) => {
      if (leaving.current) return;
      leaving.current = true;
      before?.();
      const finish = () => {
        if (closed.current) return;
        closed.current = true;
        onClosed();
      };
      p.value = withTiming(0, { duration: LEAVE_MS }, finished => {
        if (finished) scheduleOnRN(finish);
      });
      // The line of moments must move on even if the animation is cut short —
      // a window that never reports "closed" would block everything behind it.
      fallback.current = setTimeout(finish, LEAVE_MS + 200);
    },
    [p, onClosed]
  );
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * Math.min(1, p.value),
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.4),
    transform: [
      { translateY: (1 - p.value) * 60 },
      { scale: 0.9 + 0.1 * p.value },
    ],
  }));
  return { leave, scrimStyle, cardStyle };
}

/**
 * Five stars where one changes in front of the user: `from` are lit, then the
 * star at `to` either pops in (one more) or goes out (one less).
 */
function ChangingStars({ from, to }: { from: StarLevel; to: StarLevel }) {
  const { c } = useLab();
  const beat = useSharedValue(0);
  useEffect(() => {
    if (from === to) return;
    beat.value = withDelay(
      STAR_BEAT,
      to > from
        ? withSequence(
            withTiming(1.45, {
              duration: 180,
              easing: Easing.out(Easing.quad),
            }),
            withTiming(0.9, { duration: 120 }),
            withTiming(1, { duration: 120 })
          )
        : withTiming(1, { duration: 520, easing: Easing.inOut(Easing.cubic) })
    );
  }, [from, to, beat]);
  // One more: the new star grows in from nothing.
  const arriving = useAnimatedStyle(() => ({
    opacity: Math.min(1, beat.value * 2),
    transform: [{ scale: beat.value }],
  }));
  // One less: the last star lets go of its colour.
  const leaving = useAnimatedStyle(() => ({
    opacity: 1 - beat.value,
    transform: [{ scale: 1 - 0.35 * beat.value }],
  }));
  const changing = to > from ? to : from;
  return (
    <View style={styles.stars} accessible accessibilityLabel={`${to} / 5`}>
      {[1, 2, 3, 4, 5].map(i => {
        const lit = i <= Math.min(from, to);
        const changes = from !== to && i === changing;
        return (
          <View key={i} style={styles.star}>
            <Ionicons
              name={lit ? 'star' : 'star-outline'}
              size={30}
              color={lit ? c.reward : c.textFaint}
            />
            {changes && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.starOver,
                  to > from ? arriving : leaving,
                ]}
              >
                <Ionicons name="star" size={30} color={c.reward} />
              </Animated.View>
            )}
          </View>
        );
      })}
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
  buttonRef?: React.RefObject<View | null>;
}) {
  const { c } = useLab();
  return (
    <View ref={buttonRef} collapsable={false}>
      <PressableScale
        onPress={onPress}
        haptic={null}
        accessibilityLabel={label}
        style={styles.button}
      >
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: labRadius.pill }]}
        />
        <LabText variant="bodyStrong" tone="onPrimary">
          {label}
        </LabText>
      </PressableScale>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Finished — one window, the new star inside it
// ---------------------------------------------------------------------------

export function ChallengeDoneWindow({
  challenge,
  onClosed,
}: {
  challenge: LabChallenge;
  onClosed: () => void;
}) {
  const { c, lang, mode } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.challenge;
  const words = useChallengeText(challenge);
  const starName = useStarName();
  const award = useLabXpAward();
  const buttonRef = useRef<View>(null);
  const { leave, scrimStyle, cardStyle } = useWindowMotion(
    onClosed,
    `${text.completeOverline}. ${words.title}`
  );

  const months = challenge.streakBefore + 1;
  const reward = challengeReward(challenge.stars, challenge.warmUp, months);
  // A warm-up never changes the stars.
  const after = challenge.warmUp
    ? challenge.stars
    : starAfter(challenge.stars, 100, 0).stars;
  const xp = (value: number) =>
    `${formatThousands(value, copy.thousandsSeparator)} XP`;
  const gold = mode === 'light' ? c.rewardText : c.reward;

  const ring = useSharedValue(0);
  useEffect(() => {
    notification(NotificationFeedbackType.Success);
    ring.value = withDelay(
      200,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
    if (after === challenge.stars) return undefined;
    // The new star lands with a beat of its own.
    const id = setTimeout(() => impact(ImpactFeedbackStyle.Heavy), STAR_BEAT);
    return () => clearTimeout(id);
  }, [ring, after, challenge.stars]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 0.9 + 1.2 * ring.value }],
  }));
  const medalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + 0.6 * Math.min(1, ring.value * 1.6) }],
  }));

  const close = useCallback(() => {
    const node = buttonRef.current;
    // XP is credited now, from the button into the badge.
    if (!node) leave(() => award(reward.total));
    else {
      node.measureInWindow((x, y, w, h) =>
        leave(() => award(reward.total, { x: x + w / 2, y: y + h / 2 }))
      );
    }
  }, [award, leave, reward.total]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <View style={styles.medalBox}>
            <Animated.View
              style={[styles.medalRing, { borderColor: GOLD[1] }, ringStyle]}
            />
            <Animated.View style={medalStyle}>
              <LinearGradient
                colors={GOLD}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.medal}
              >
                <Ionicons name="trophy" size={40} color="#4A2F00" />
              </LinearGradient>
            </Animated.View>
          </View>

          <LabText variant="overline" tone="reward" style={styles.centered}>
            {text.completeOverline}
          </LabText>
          <LabText
            variant="title"
            style={[styles.centered, { marginTop: labSpace.xs }]}
          >
            {words.title}
          </LabText>

          <ChangingStars from={challenge.stars} to={after} />
          <LabText
            variant="label"
            tone="muted"
            style={[styles.centered, { marginTop: labSpace.sm }]}
          >
            {challenge.warmUp
              ? text.warmUp
              : after > challenge.stars
                ? text.starUp(
                    text.categoryName[challenge.category],
                    after,
                    starName(after)
                  )
                : text.topLevel}
          </LabText>

          <View style={[styles.earned, { backgroundColor: c.surfaceRaised }]}>
            <View style={styles.row}>
              <LabText variant="label" tone="muted" style={styles.flexText}>
                {text.starChallenge(challenge.stars)}
              </LabText>
              <LabText variant="numberSm">{xp(reward.base)}</LabText>
            </View>
            {reward.streakBonus > 0 && (
              <View style={styles.row}>
                <LabText variant="label" tone="muted" style={styles.flexText}>
                  {text.streak(months, Math.round(reward.streakShare * 100))}
                </LabText>
                <LabText variant="numberSm">{`+${xp(reward.streakBonus)}`}</LabText>
              </View>
            )}
            <Divider style={{ marginVertical: labSpace.xs }} />
            <View style={styles.row}>
              <LabText variant="bodyStrong" style={styles.flexText}>
                {text.total}
              </LabText>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[
                  typeStyle('title', gold),
                  { fontFamily: labFonts.bold, fontVariant: ['tabular-nums'] },
                ]}
              >
                {xp(reward.total)}
              </Text>
            </View>
          </View>
          {/* The app switches it on only after a full challenge. */}
          {!challenge.warmUp && (
            <View style={styles.multiplier}>
              <Ionicons name="flash" size={14} color={gold} />
              <LabText
                variant="caption"
                tone="muted"
                style={{ marginLeft: labSpace.xs, flexShrink: 1 }}
              >
                {text.multiplier(
                  COMPLETION_MULTIPLIER.factor.toLocaleString(copy.locale),
                  COMPLETION_MULTIPLIER.hours
                )}
              </LabText>
            </View>
          )}

          <PrimaryButton
            label={text.continue}
            onPress={close}
            buttonRef={buttonRef}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// The month ended unfinished — one calm window, and the next challenge
// ---------------------------------------------------------------------------

export function MonthRecapWindow({
  challenge,
  failuresBefore,
  onClosed,
}: {
  /** The month that ended. */
  challenge: LabChallenge;
  /** Months in a row without a full finish before it. */
  failuresBefore: number;
  onClosed: () => void;
}) {
  const { c, lang } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.challenge;
  const words = useChallengeText(challenge);
  const t = useJournalT();
  const starName = useStarName();
  const share = challengeShare(challenge.requirements);
  const percent = Math.round(share * 100);
  const { leave, scrimStyle, cardStyle } = useWindowMotion(
    onClosed,
    `${text.recapTitle(percent)} ${words.title}`
  );
  const outcome = starAfter(challenge.stars, percent, failuresBefore);
  const lost = outcome.change === 'down';
  const first = challenge.requirements[0];
  const categoryName = text.categoryName[challenge.category];
  // Stars are per category: the next challenge comes from another one and has
  // that category's level — not the level this month just changed.
  const nextStars = CHALLENGE_LEVELS[NEXT.category];
  const next = challengeReward(nextStars, false, 1);

  useEffect(() => {
    impact(ImpactFeedbackStyle.Light);
    if (!lost) return undefined;
    const id = setTimeout(
      () => notification(NotificationFeedbackType.Warning),
      STAR_BEAT
    );
    return () => clearTimeout(id);
  }, [lost]);

  const close = useCallback(() => leave(), [leave]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <LabText variant="overline" tone="muted" style={styles.centered}>
            {copy.challengeOverline}
          </LabText>
          <View style={styles.recapRing}>
            <Ring fraction={share} color={c.primary} />
          </View>
          <LabText variant="title" style={styles.centered}>
            {text.recapTitle(percent)}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={[styles.centered, { marginTop: labSpace.xs }]}
          >
            {first
              ? `${words.title} · ${text.count(first.done, first.target)}`
              : words.title}
          </LabText>

          <ChangingStars from={challenge.stars} to={outcome.stars} />
          <LabText
            variant="label"
            tone="muted"
            style={[styles.centered, { marginTop: labSpace.sm }]}
          >
            {lost
              ? text.starLost(
                  categoryName,
                  outcome.stars,
                  starName(outcome.stars)
                )
              : text.starKept(
                  categoryName,
                  outcome.stars,
                  starName(outcome.stars)
                )}
            {challenge.streakBefore > 0 ? ` ${text.streakReset}` : ''}
          </LabText>

          {/* Straight to what is next: the miss is the start of a month, not its end. */}
          <View style={[styles.next, { backgroundColor: c.primarySoft }]}>
            <LabText variant="overline" tone="primary">
              {text.newChallenge}
            </LabText>
            <LabText variant="titleSm" style={{ marginTop: labSpace.xs }}>
              {t(`help.challenges.templates.${NEXT.templateId}.title`)}
            </LabText>
            <LabText variant="caption" tone="muted" style={{ marginTop: 2 }}>
              {`${text.starChallenge(nextStars)} · ${formatThousands(next.base, copy.thousandsSeparator)} XP`}
            </LabText>
          </View>

          <PrimaryButton label={text.recapButton} onPress={close} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: '#000000',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: labSpace.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: labSpace.xxl,
    paddingTop: labSpace.xxxl,
  },
  centered: {
    textAlign: 'center',
  },
  medalBox: {
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: labSpace.lg,
  },
  medal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: labSpace.xs,
    marginTop: labSpace.lg,
  },
  star: {
    width: 30,
    height: 30,
  },
  starOver: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  earned: {
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.lg,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.md,
  },
  row: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexText: {
    flex: 1,
    marginRight: labSpace.md,
  },
  multiplier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.md,
  },
  recapRing: {
    alignItems: 'center',
    marginTop: labSpace.lg,
    marginBottom: labSpace.lg,
  },
  next: {
    marginTop: labSpace.xl,
    padding: labSpace.lg,
    borderRadius: labRadius.md,
  },
  button: {
    height: 52,
    marginTop: labSpace.xl,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
