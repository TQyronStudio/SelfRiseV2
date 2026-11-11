/**
 * Monthly challenge — the detail as ONE page (kolo 36, decision R-36). It grows out
 * of the challenge card on Home and returns into it (the lab's detail pattern,
 * JournalDetailConcept.tsx). Replaces today's window with three tabs.
 *
 * What the user reads, top to bottom:
 * - which challenge this is, and its ring: how far, how many days are left;
 * - ONE sentence about the pace — on track, or what a day has to bring from now on.
 *   It replaces the generic "Tips" tab: the only tip that matters is what is left;
 * - what it takes: each requirement with its own bar, and the three milestones
 *   (25/50/75 %) as marks on the way with the XP they pay;
 * - the month as a calendar in four shades — no percent legend;
 * - what finishing pays (XP by stars, the month-streak bonus) and what happens next
 *   month; the user's star level in every category.
 *
 * The situations (on track / behind / warm-up / done) switch at the bottom of the
 * page — a lab control, not part of the design.
 *
 * Never shown (Monthly-Challenges.md, "UI Content Restrictions"): baselines,
 * scaling, "beginner-friendly" labels. Not shown either: the templates' "bonus"
 * lines (weekend bonus, +100 XP per month…) — the app does not pay them (lesson 49).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces MonthlyChallengeDetailModal.tsx (+ MonthlyProgressCalendar.tsx).
 * - Data: MonthlyChallengeService / MonthlyProgressTracker (daily snapshots), live
 *   updates on `monthly_progress_updated`; texts through challengeDisplayText.ts.
 * - The pace is new: one function next to the tracker (challengeLogic.ts).
 */
import React, { useEffect, useMemo } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '@/src/services/hapticsService';
import {
  CHALLENGE_MILESTONES,
  challengePace,
  challengeReward,
  challengeShare,
  dayLevel,
  DayLevel,
  requirementShare,
  StarLevel,
} from './challengeLogic';
import {
  CHALLENGE_LEVELS,
  CHALLENGE_MONTH,
  CHALLENGE_SCENARIOS,
  ChallengeCategory,
  LabChallenge,
  useLabChallenge,
} from './challengeMock';
import { Ring } from './GoalDetailConcept';
import { DetailRect } from './JournalDetailConcept';
import { useJournalT } from './journalParts';
import { useLabCover } from './labCover';
import {
  Chip,
  Divider,
  LabText,
  PressableScale,
  ProgressBar,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { formatThousands, MOCK_COPY } from './mockCopy';

const OPEN_SPRING = {
  damping: 24,
  stiffness: 210,
  mass: 1,
  overshootClamping: true,
};
const CLOSE_MS = 320;

const STAR_NAMES = [
  'novice',
  'explorer',
  'challenger',
  'expert',
  'master',
] as const;
const CATEGORIES: ChallengeCategory[] = [
  'habits',
  'journal',
  'goals',
  'consistency',
];

/** Texts of a challenge: the app's own, by template id. */
export function useChallengeText(challenge: LabChallenge) {
  const t = useJournalT();
  return useMemo(() => {
    const base = `help.challenges.templates.${challenge.templateId}`;
    const title = t(`${base}.title`);
    return {
      title: challenge.warmUp
        ? `${t('monthlyChallenge.warmUpPrefix')}: ${title}`
        : title,
      description: t(`${base}.description`),
      requirement: t(`${base}.requirement`),
      category: t(`monthlyChallenge.categories.${challenge.category}`),
      starName: t(
        `monthlyChallenge.starLevels.${STAR_NAMES[challenge.stars - 1]}`
      ),
    };
  }, [t, challenge]);
}

export function Stars({ count, size = 14 }: { count: number; size?: number }) {
  const { c } = useLab();
  return (
    <View
      style={{ flexDirection: 'row' }}
      accessible
      accessibilityLabel={`${count} / 5`}
    >
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= count ? 'star' : 'star-outline'}
          size={size}
          color={i <= count ? c.reward : c.textFaint}
          style={{ marginLeft: i === 1 ? 0 : 2 }}
        />
      ))}
    </View>
  );
}

interface ChallengeDetailProps {
  /** The card's rectangle inside the page — where the detail grows from and returns to. */
  origin: DetailRect;
  /** The page size — the detail's final rectangle. */
  size: { width: number; height: number };
  bottomInset: number;
  onClosed: () => void;
}

export function ChallengeDetailConcept({
  origin,
  size,
  bottomInset,
  onClosed,
}: ChallengeDetailProps) {
  const { c, lang } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.challenge;
  const sep = copy.thousandsSeparator;
  const t = useJournalT();
  const { challenge, scenario, setScenario } = useLabChallenge();
  const words = useChallengeText(challenge);

  const share = challengeShare(challenge.requirements);
  const pace = challengePace(
    challenge.requirements,
    challenge.day,
    challenge.days
  );
  const finished = pace.state === 'done';
  const months = challenge.streakBefore + 1;
  const reward = challengeReward(challenge.stars, challenge.warmUp, months);
  const xp = (value: number) => `${formatThousands(value, sep)} XP`;
  const paceLine = finished
    ? text.paceDone
    : pace.state === 'onTrack'
      ? text.paceOnTrack(pace.left, pace.daysLeft)
      : text.paceBehind(pace.left, pace.daysLeft, pace.perDay);

  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, OPEN_SPRING);
  }, [p]);

  const close = () => {
    selection();
    p.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) },
      done => {
        if (done) scheduleOnRN(onClosed);
      }
    );
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // `close` only touches the shared value and the stable onClosed callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameStyle = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [origin.x, 0]),
    top: interpolate(p.value, [0, 1], [origin.y, 0]),
    width: interpolate(p.value, [0, 1], [origin.width, size.width]),
    height: interpolate(p.value, [0, 1], [origin.height, size.height]),
    borderRadius: interpolate(p.value, [0, 1], [labRadius.lg, 0]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.3, 0.85], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(p.value, [0.3, 1], [10, 0], 'clamp') },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.28 * p.value }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000' },
          scrimStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.frame,
          { backgroundColor: c.surface, borderColor: c.border },
          frameStyle,
        ]}
      >
        <Animated.View
          style={[{ width: size.width, height: size.height }, contentStyle]}
        >
          <ScrollView
            contentContainerStyle={{
              padding: labSpace.xl,
              paddingTop: labSpace.sm,
              paddingBottom: bottomInset + labSpace.xxl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar: the level badge stays pinned on the left, close sits on the right. */}
            <View style={styles.topBar}>
              <PressableScale
                onPress={close}
                haptic={null}
                pressScale={0.9}
                accessibilityLabel={t('common.close')}
                style={[
                  styles.close,
                  { backgroundColor: c.surfaceRaised, borderColor: c.border },
                ]}
              >
                <Ionicons name="close" size={20} color={c.text} />
              </PressableScale>
            </View>

            <LabText
              variant="overline"
              tone="primary"
              style={{ marginTop: labSpace.md }}
            >
              {`${copy.challengeOverline} · ${words.category}`}
            </LabText>
            <LabText variant="display" style={{ marginTop: labSpace.xs }}>
              {words.title}
            </LabText>
            <LabText
              variant="body"
              tone="muted"
              style={{ marginTop: labSpace.xs }}
            >
              {words.description}
            </LabText>

            {/* How far, and how long there is */}
            <View style={styles.hero}>
              <Ring
                key={scenario}
                fraction={share}
                color={finished ? c.success : c.primary}
              />
              <View style={styles.heroSide}>
                <Stars count={challenge.stars} size={16} />
                <LabText variant="label" tone="muted" style={{ marginTop: 2 }}>
                  {words.starName}
                </LabText>
                <View style={{ marginTop: labSpace.md }}>
                  {finished ? (
                    <Chip
                      icon="checkmark-circle"
                      label={text.done}
                      tone="success"
                    />
                  ) : (
                    <Chip
                      icon="time-outline"
                      label={text.daysLeft(pace.daysLeft)}
                      tone="primary"
                    />
                  )}
                </View>
              </View>
            </View>

            {/* The one sentence that matters: the pace */}
            <LabText
              variant="titleSm"
              italic
              style={{ marginTop: labSpace.lg }}
            >
              {paceLine}
            </LabText>

            {/* What it takes */}
            <SectionTitle>{text.requirements}</SectionTitle>
            <View
              style={[
                styles.card,
                { backgroundColor: c.surfaceRaised, borderColor: c.border },
              ]}
            >
              {challenge.requirements.map((requirement, i) => (
                <View key={i} style={i > 0 && { marginTop: labSpace.lg }}>
                  <View style={styles.spaceBetween}>
                    <LabText variant="label" style={styles.flexText}>
                      {words.requirement}
                    </LabText>
                    <LabText variant="numberSm">
                      {text.count(
                        Math.min(requirement.done, requirement.target),
                        requirement.target
                      )}
                    </LabText>
                  </View>
                  <ProgressBar
                    key={scenario}
                    progress={requirementShare(requirement)}
                    colors={
                      finished ? [c.success, c.success] : c.primaryGradient
                    }
                    delay={250}
                    style={{ marginTop: labSpace.sm }}
                  />
                </View>
              ))}
              <Milestones share={share} />
            </View>

            {/* The month */}
            <SectionTitle>{text.calendar}</SectionTitle>
            <MonthCalendar challenge={challenge} />

            {/* What finishing pays */}
            <SectionTitle>{finished ? text.earned : text.reward}</SectionTitle>
            <View
              style={[
                styles.card,
                { backgroundColor: c.surfaceRaised, borderColor: c.border },
              ]}
            >
              <View style={styles.spaceBetween}>
                <View style={styles.flexText}>
                  <LabText variant="number" tone="reward">
                    {xp(reward.total)}
                  </LabText>
                </View>
                <Stars count={challenge.stars} />
              </View>
              <Divider style={{ marginTop: labSpace.md }} />
              <View style={styles.row}>
                <LabText variant="label" tone="muted" style={styles.flexText}>
                  {text.starChallenge(challenge.stars)}
                </LabText>
                <LabText variant="numberSm">{xp(reward.base)}</LabText>
              </View>
              <Divider />
              {reward.streakBonus > 0 ? (
                <View style={styles.row}>
                  <LabText variant="label" tone="muted" style={styles.flexText}>
                    {text.streak(months, Math.round(reward.streakShare * 100))}
                  </LabText>
                  <LabText variant="numberSm" tone="reward">
                    {`+${xp(reward.streakBonus)}`}
                  </LabText>
                </View>
              ) : (
                <View style={styles.row}>
                  <LabText variant="label" tone="muted" style={styles.flexText}>
                    {text.streakHint}
                  </LabText>
                </View>
              )}
              <LabText
                variant="caption"
                tone="muted"
                style={{ marginTop: labSpace.sm }}
              >
                {challenge.warmUp
                  ? text.warmUp
                  : challenge.stars >= 5
                    ? text.topLevel
                    : text.nextMonth(challenge.stars + 1)}
              </LabText>
            </View>

            {/* Star levels by category */}
            <SectionTitle>{text.levels}</SectionTitle>
            <View
              style={[
                styles.card,
                { backgroundColor: c.surfaceRaised, borderColor: c.border },
              ]}
            >
              {CATEGORIES.map((category, i) => (
                <View key={category}>
                  {i > 0 && <Divider />}
                  <LevelRow
                    category={category}
                    stars={
                      category === challenge.category && !challenge.warmUp
                        ? challenge.stars
                        : CHALLENGE_LEVELS[category]
                    }
                    current={category === challenge.category}
                  />
                </View>
              ))}
            </View>

            {/* Lab control — not part of the design, not converted. */}
            <LabText
              variant="overline"
              tone="faint"
              style={{ marginTop: labSpace.xxxl }}
            >
              {text.labScenario}
            </LabText>
            <View style={styles.scenarios}>
              {CHALLENGE_SCENARIOS.map(option => {
                const active = option === scenario;
                return (
                  <PressableScale
                    key={option}
                    onPress={() => setScenario(option)}
                    pressScale={0.95}
                    accessibilityLabel={text.scenarios[option]}
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.scenario,
                      {
                        backgroundColor: active ? c.primarySoft : 'transparent',
                        borderColor: active ? c.primary : c.border,
                      },
                    ]}
                  >
                    <LabText
                      variant="caption"
                      tone={active ? 'primary' : 'muted'}
                    >
                      {text.scenarios[option]}
                    </LabText>
                  </PressableScale>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <LabText variant="title" style={{ marginTop: labSpace.xxl }}>
      {children}
    </LabText>
  );
}

// ---------------------------------------------------------------------------
// Milestones — marks on the way, with what they pay
// ---------------------------------------------------------------------------

function Milestones({ share }: { share: number }) {
  const { c, lang, mode } = useLab();
  const text = MOCK_COPY[lang].challenge;
  const gold = mode === 'light' ? c.rewardText : c.reward;
  return (
    <View style={styles.milestones}>
      {CHALLENGE_MILESTONES.map(milestone => {
        const reached = share * 100 >= milestone.at;
        return (
          <View
            key={milestone.at}
            accessible
            accessibilityLabel={text.milestone(milestone.at, milestone.xp)}
            accessibilityState={{ checked: reached }}
            style={[
              styles.milestone,
              {
                backgroundColor: reached ? c.rewardSoft : 'transparent',
                borderColor: reached ? 'transparent' : c.border,
              },
            ]}
          >
            <Ionicons
              name={reached ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={reached ? gold : c.textFaint}
              style={{ marginRight: labSpace.xs }}
            />
            <Text
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              style={[
                typeStyle('caption', reached ? gold : c.textMuted),
                { fontFamily: labFonts.semibold },
              ]}
            >
              {text.milestone(milestone.at, milestone.xp)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// The month — four shades, no legend of percentages
// ---------------------------------------------------------------------------

const SHADE: Record<DayLevel, number> = {
  none: 0,
  some: 0.22,
  good: 0.5,
  full: 1,
};

function MonthCalendar({ challenge }: { challenge: LabChallenge }) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.challenge;
  const first = challenge.requirements[0];
  const dailyTarget = first ? first.target / challenge.days : 0;
  // Monday first, like the app's calendars.
  const offset =
    (new Date(CHALLENGE_MONTH.year, CHALLENGE_MONTH.month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: challenge.days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) =>
    cells.slice(w * 7, w * 7 + 7)
  );
  const fill = c.primaryGradient[1];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surfaceRaised, borderColor: c.border },
      ]}
    >
      <View style={styles.week}>
        {copy.weekdays.map((weekday, i) => (
          <View key={i} style={styles.weekdayCell}>
            <LabText variant="caption" tone="faint">
              {weekday}
            </LabText>
          </View>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((day, i) => {
            if (day === null) return <View key={i} style={styles.dayCell} />;
            const past = day <= challenge.day;
            const level = past
              ? dayLevel(challenge.daily[day - 1] ?? 0, dailyTarget)
              : 'none';
            const today = day === challenge.day;
            return (
              <View key={i} style={styles.dayCell}>
                <View
                  style={[
                    styles.day,
                    past && level === 'none' && { backgroundColor: c.track },
                    today && { borderWidth: 1.5, borderColor: c.primary },
                  ]}
                >
                  {level !== 'none' && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.dayShade,
                        { backgroundColor: fill, opacity: SHADE[level] },
                      ]}
                    />
                  )}
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={[
                      typeStyle(
                        'caption',
                        level === 'full'
                          ? c.onPrimary
                          : past
                            ? c.text
                            : c.textFaint
                      ),
                      level === 'full' && { fontFamily: labFonts.semibold },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <LabText variant="caption" tone="muted">
          {text.less}
        </LabText>
        {(['none', 'some', 'good', 'full'] as const).map(level => (
          <View
            key={level}
            style={[styles.swatch, { backgroundColor: c.track }]}
          >
            {level !== 'none' && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: fill, opacity: SHADE[level] },
                ]}
              />
            )}
          </View>
        ))}
        <LabText variant="caption" tone="muted">
          {text.more}
        </LabText>
      </View>
    </View>
  );
}

function LevelRow({
  category,
  stars,
  current,
}: {
  category: ChallengeCategory;
  stars: StarLevel;
  current: boolean;
}) {
  const t = useJournalT();
  return (
    <View style={styles.row}>
      <LabText
        variant="overline"
        tone={current ? 'primary' : 'muted'}
        style={styles.flexText}
      >
        {t(`monthlyChallenge.categories.${category}`)}
      </LabText>
      <Stars count={stars} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xl,
  },
  heroSide: {
    flex: 1,
    marginLeft: labSpace.xl,
    alignItems: 'flex-start',
  },
  card: {
    marginTop: labSpace.md,
    padding: labSpace.lg,
    borderRadius: labRadius.md,
    borderWidth: 1,
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexText: {
    flex: 1,
    marginRight: labSpace.md,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
    marginTop: labSpace.lg,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.sm,
    paddingVertical: labSpace.xs,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  week: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: labSpace.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayShade: {
    borderRadius: 10,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: labSpace.xs,
    marginTop: labSpace.md,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scenarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
    marginTop: labSpace.sm,
  },
  scenario: {
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
});
