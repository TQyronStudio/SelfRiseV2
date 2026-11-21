/**
 * "How SelfRise works" (kolo 47, lab debt L-3) — the one page that explains what
 * happens out of sight. Replaces src/screens/help/HowItWorksScreen.tsx.
 *
 * Why a new page and not a restyle:
 * - Today's page is wrong in places: the journal streak "tracks habits, goals and
 *   journal" (it is the journal only), the XP text points at a progress bar that
 *   is gone (R-31), goal "predictions" are a fortune teller that the lab replaced
 *   by pace in words. And the rules people ask about most are missing: the XP
 *   multiplier, the challenge stars, the ⭐ 🔥 👑 entries.
 * - It is a wall of marketing sentences with emoji. Here every rule is a short
 *   title and one or two plain sentences — what happens, and what you can do.
 *
 * What it does:
 * - Only the hidden mechanics (the intro says so); what the screen shows is not
 *   repeated. Seven sections, in the order a user meets them.
 * - Every number that can change is the app's own constant passed into the text
 *   (fixed design facts — 1 to 5 stars, entries 4 / 8 / 13 — are words), so the
 *   page cannot drift from the rules (XP_REWARDS, XP_MULTIPLIERS, CHALLENGE_MILESTONES,
 *   KEEP_LEVEL_SHARE, ACHIEVEMENT_XP_REWARDS, JOURNAL_STREAK_REWARDS).
 * - Four small, still pictures where a picture explains faster than a sentence
 *   (the make-up week, the bonus road, the seven harmony days, the six chapters).
 *   They are decoration for the screen reader — the sentence carries the meaning.
 * - No entrance per section: the page slides in, that is the motion.
 *
 * GOING LIVE (1:1) — see PREVOD.md: app/how-it-works.tsx renders this; texts into
 * src/locales EN/DE/ES with the numbers as interpolation; the `?` tooltips keep
 * their own short texts (helpTopics.ts) — this page no longer renders them, so the
 * i18n guard test for HOW_IT_WORKS_SECTIONS moves to the new keys.
 */
import React, { useRef } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { XP_MULTIPLIERS, XP_REWARDS } from '@/src/constants/gamification';
import { ACHIEVEMENT_XP_REWARDS } from '@/src/constants/achievements';
import { AchievementRarity } from '@/src/types/gamification';
import { JOURNAL_STREAK_REWARDS } from '@/src/utils/journalStreakMilestones';
import { MAX_GOAL_TRANSACTIONS_PER_DAY } from '@/src/services/gamification/xpLimits';
import { contentColumn } from '@/src/utils/layout';
import {
  CHALLENGE_MILESTONES,
  KEEP_LEVEL_SHARE,
  WARMUPS_FOR_STEP_DOWN,
} from './challengeLogic';
import { PageTopBar, useJournalT } from './journalParts';
import {
  Divider,
  IconBadge,
  LabText,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labRadius, labSpace, labTier } from './labTokens';
import { LEVEL_TIERS } from './levelsJourney';
import { MOCK_COPY } from './mockCopy';
import { formatFactor } from './multiplierLogic';
import { SignatureIcon, SignatureName } from './SignatureIcon';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Below this many active days a user gets warm-up challenges (Monthly-Challenges.md). */
const WARM_UP_ACTIVE_DAYS = 20;
/** Missed journal days that can be paid back (My-Journal.md, AUTO_RESET_PROTECTION). */
const MAX_DEBT_DAYS = 3;
/** The page slides in this long before it scrolls to a focused section. */
const FOCUS_AFTER_MS = 320;

export type RuleId =
  | 'makeUp'
  | 'habitXp'
  | 'three'
  | 'bonus'
  | 'frozen'
  | 'long'
  | 'goalXp'
  | 'goalMilestones'
  | 'pace'
  | 'badge'
  | 'chapters'
  | 'harmony'
  | 'made'
  | 'stars'
  | 'warmUp'
  | 'challengeXp'
  | 'rarity';

export type SectionId =
  | 'habits'
  | 'journal'
  | 'goals'
  | 'levels'
  | 'multiplier'
  | 'challenge'
  | 'trophies';

export interface Rule {
  id: RuleId;
  title: string;
  text: string;
  picture?: React.ReactNode;
}

export interface RulesSection {
  key: SectionId;
  icon: IoniconName;
  color: string;
  title: string;
  rules: Rule[];
}

/**
 * The rules, once — the page shows them all, the in-place help (labHelp.tsx) shows
 * the one or two that belong where the user is. One text, two places.
 */
export function useHowItWorksSections(): RulesSection[] {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.howItWorks;
  const J = XP_REWARDS.JOURNAL;
  const G = XP_REWARDS.GOALS;
  const M = XP_MULTIPLIERS;
  const decimal = (1.5).toLocaleString(copy.locale).charAt(1);
  const milestoneXp = CHALLENGE_MILESTONES.map(m => m.xp);
  const streakDays = Object.keys(JOURNAL_STREAK_REWARDS).map(Number);
  const list = (items: number[]) => {
    const parts = items.map(String);
    const last = parts.pop();
    const and = lang === 'de' ? 'und' : 'and';
    return parts.length ? `${parts.join(', ')} ${and} ${last}` : (last ?? '');
  };

  return [
    {
      key: 'habits',
      icon: 'checkmark-done',
      color: c.habit.green,
      title: text.habits,
      rules: [
        {
          id: 'makeUp',
          title: text.makeUpTitle,
          text: text.makeUp,
          picture: <MakeUpWeek />,
        },
        {
          id: 'habitXp',
          title: text.habitXpTitle,
          text: text.habitXp(
            XP_REWARDS.HABIT.SCHEDULED_COMPLETION,
            XP_REWARDS.HABIT.BONUS_COMPLETION
          ),
        },
      ],
    },
    {
      key: 'journal',
      icon: 'create-outline',
      color: c.habit.pink,
      title: text.journal,
      rules: [
        {
          id: 'three',
          title: text.threeTitle,
          text: text.three(J.FIRST_ENTRY),
        },
        {
          id: 'bonus',
          title: text.bonusTitle,
          text: text.bonus(
            J.FIRST_BONUS_MILESTONE,
            J.FIFTH_BONUS_MILESTONE,
            J.TENTH_BONUS_MILESTONE,
            J.BONUS_ENTRY
          ),
          picture: <BonusRoad />,
        },
        {
          id: 'frozen',
          title: text.frozenTitle,
          text: text.frozen(MAX_DEBT_DAYS),
        },
        {
          id: 'long',
          title: text.longTitle,
          text: text.long(list(streakDays)),
        },
      ],
    },
    {
      key: 'goals',
      icon: 'flag-outline',
      color: c.habit.orange,
      title: text.goals,
      rules: [
        {
          id: 'goalXp',
          title: text.goalXpTitle,
          text: text.goalXp(G.PROGRESS_ENTRY, MAX_GOAL_TRANSACTIONS_PER_DAY),
        },
        {
          id: 'goalMilestones',
          title: text.goalMilestonesTitle,
          text: text.goalMilestones(
            G.MILESTONE_25_PERCENT,
            G.MILESTONE_50_PERCENT,
            G.MILESTONE_75_PERCENT,
            G.GOAL_COMPLETION
          ),
        },
        { id: 'pace', title: text.paceTitle, text: text.pace },
      ],
    },
    {
      key: 'levels',
      icon: 'ribbon-outline',
      color: c.rewardText,
      title: text.levels,
      rules: [
        { id: 'badge', title: text.badgeTitle, text: text.badge },
        {
          id: 'chapters',
          title: text.chaptersTitle,
          text: text.chapters,
          picture: <Chapters />,
        },
      ],
    },
    {
      key: 'multiplier',
      icon: 'flash',
      color: c.rewardText,
      title: text.harmony,
      rules: [
        {
          id: 'harmony',
          title: text.harmonyTitle(
            formatFactor(M.HARMONY_STREAK_MULTIPLIER, decimal),
            M.HARMONY_STREAK_DAYS_REQUIRED
          ),
          text: text.harmonyText(
            M.HARMONY_STREAK_DAYS_REQUIRED,
            M.HARMONY_STREAK_DURATION,
            Math.round(M.HARMONY_STREAK_COOLDOWN / 24)
          ),
          picture: <HarmonyDays days={M.HARMONY_STREAK_DAYS_REQUIRED} />,
        },
      ],
    },
    {
      key: 'challenge',
      icon: 'calendar-outline',
      color: c.primary,
      title: text.challenge,
      rules: [
        { id: 'made', title: text.madeTitle, text: text.made },
        {
          id: 'stars',
          title: text.starsTitle,
          text: text.stars(Math.round(KEEP_LEVEL_SHARE * 100)),
        },
        {
          id: 'warmUp',
          title: text.warmUpTitle,
          text: text.warmUp(WARM_UP_ACTIVE_DAYS, WARMUPS_FOR_STEP_DOWN),
        },
        {
          id: 'challengeXp',
          title: text.challengeXpTitle,
          text: text.challengeXp(
            milestoneXp[0] ?? 0,
            milestoneXp[1] ?? 0,
            milestoneXp[2] ?? 0
          ),
        },
      ],
    },
    {
      key: 'trophies',
      icon: 'trophy-outline',
      color: c.rewardText,
      title: text.trophies,
      rules: [
        {
          id: 'rarity',
          title: text.rarityTitle,
          text: text.rarity(
            ACHIEVEMENT_XP_REWARDS[AchievementRarity.COMMON],
            ACHIEVEMENT_XP_REWARDS[AchievementRarity.RARE],
            ACHIEVEMENT_XP_REWARDS[AchievementRarity.EPIC],
            ACHIEVEMENT_XP_REWARDS[AchievementRarity.LEGENDARY]
          ),
        },
      ],
    },
  ];
}

export function HowItWorksConcept({
  bottomInset,
  onClose,
  focus = null,
}: {
  bottomInset: number;
  onClose: () => void;
  /** Open at this section (from the in-place help). */
  focus?: SectionId | null;
}) {
  const { lang } = useLab();
  const text = MOCK_COPY[lang].howItWorks;
  const t = useJournalT();
  const reducedMotion = useReducedMotion();
  const sections = useHowItWorksSections();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Partial<Record<SectionId, number>>>({});
  const scrolled = useRef(false);
  const scrollToFocus = () => {
    if (!focus || scrolled.current) return;
    const y = offsets.current[focus];
    if (y === undefined) return;
    scrolled.current = true;
    // After the page has slid in: a scroll during the slide reads as a jump.
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, y - labSpace.lg),
          animated: !reducedMotion,
        }),
      reducedMotion ? 0 : FOCUS_AFTER_MS
    );
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        contentColumn,
        {
          paddingHorizontal: labSpace.xl,
          paddingBottom: bottomInset + labSpace.xxl,
        },
      ]}
    >
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <View accessibilityRole="header">
        <LabText variant="display" style={{ marginTop: labSpace.sm }}>
          {text.title}
        </LabText>
      </View>
      <LabText
        variant="body"
        tone="muted"
        style={{ marginTop: labSpace.sm, marginBottom: labSpace.sm }}
      >
        {text.intro}
      </LabText>

      {sections.map(section => (
        <View
          key={section.key}
          onLayout={e => {
            offsets.current[section.key] = e.nativeEvent.layout.y;
            if (section.key === focus) scrollToFocus();
          }}
        >
          <Surface style={styles.section}>
            <View style={styles.sectionHead} accessibilityRole="header">
              <IconBadge icon={section.icon} color={section.color} size={36} />
              <LabText variant="titleSm" style={styles.sectionTitle}>
                {section.title}
              </LabText>
            </View>
            {section.rules.map((rule, i) => (
              <View key={rule.title}>
                {i > 0 && <Divider style={{ marginVertical: labSpace.md }} />}
                <View style={i === 0 ? { marginTop: labSpace.md } : null}>
                  <LabText variant="bodyStrong">{rule.title}</LabText>
                  <LabText
                    variant="label"
                    tone="muted"
                    style={{ marginTop: labSpace.xs }}
                  >
                    {rule.text}
                  </LabText>
                  {rule.picture && (
                    <View
                      style={styles.picture}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      {rule.picture}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Surface>
        </View>
      ))}

      <LabText
        variant="caption"
        tone="faint"
        style={{ textAlign: 'center', marginTop: labSpace.xl }}
      >
        {text.footer}
      </LabText>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// The four pictures — still, small, in the app's own shapes
// ---------------------------------------------------------------------------

/** A Mon–Sun week: Tuesday was extra, so missed Monday turned golden. */
function MakeUpWeek() {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  // A Monday (2026-11-16) and the six days after it.
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 10, 16 + i).toLocaleDateString(copy.locale, {
      weekday: 'narrow',
    })
  );
  const state: ('covered' | 'extra' | 'done' | 'off')[] = [
    'covered',
    'extra',
    'done',
    'off',
    'done',
    'off',
    'off',
  ];
  return (
    <View style={styles.week}>
      {days.map((day, i) => {
        const s = state[i]!;
        const bg =
          s === 'covered'
            ? c.rewardSoft
            : s === 'done'
              ? c.successSoft
              : s === 'extra'
                ? c.primarySoft
                : c.track;
        return (
          <View key={i} style={styles.weekDay}>
            <View style={[styles.weekDot, { backgroundColor: bg }]}>
              {s === 'covered' && (
                <Ionicons name="checkmark" size={14} color={c.rewardText} />
              )}
              {s === 'done' && (
                <Ionicons name="checkmark" size={14} color={c.successText} />
              )}
              {s === 'extra' && (
                <Ionicons name="add" size={14} color={c.primary} />
              )}
            </View>
            <LabText variant="caption" tone="faint" style={{ marginTop: 2 }}>
              {day}
            </LabText>
          </View>
        );
      })}
    </View>
  );
}

/** Thirteen entries of a day: three keep the streak, 4 / 8 / 13 add the bonus. */
function BonusRoad() {
  const { c } = useLab();
  const marks: Record<number, SignatureName> = {
    4: 'star',
    8: 'flame',
    13: 'crown',
  };
  return (
    <View style={styles.road}>
      {Array.from({ length: 13 }, (_, i) => {
        const position = i + 1;
        const mark = marks[position];
        return (
          <View key={position} style={styles.roadStop}>
            {mark ? (
              <SignatureIcon name={mark} size={18} />
            ) : (
              <View
                style={[
                  styles.roadDot,
                  {
                    backgroundColor: position <= 3 ? c.primary : c.track,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Seven harmony days in a row — the same segments as the level panel. */
function HarmonyDays({ days }: { days: number }) {
  return (
    <View style={styles.segments}>
      {Array.from({ length: days }, (_, i) => (
        <LinearGradient
          key={i}
          colors={['#FFD36B', '#F4A93F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.segment}
        />
      ))}
    </View>
  );
}

/** The six chapters as the levels overview draws them, each as long as its levels. */
function Chapters() {
  const { mode } = useLab();
  const t = useJournalT();
  return (
    <View>
      <View style={styles.strip}>
        {LEVEL_TIERS.map(part => (
          <LinearGradient
            key={part.id}
            colors={labTier[part.id].fill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.stripPart, { flex: part.to - part.from + 1 }]}
          />
        ))}
      </View>
      <View style={styles.stripLabels}>
        {[LEVEL_TIERS[0]!, LEVEL_TIERS[LEVEL_TIERS.length - 1]!].map(part => (
          <Text
            key={part.id}
            maxFontSizeMultiplier={1.3}
            style={typeStyle('caption', labTier[part.id].text[mode])}
          >
            {t(`gamification.levels.overview.rarity.${part.id}`)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: labSpace.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    marginLeft: labSpace.md,
  },
  picture: {
    marginTop: labSpace.md,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    width: 32,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  road: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roadStop: {
    width: 18,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  strip: {
    flexDirection: 'row',
    gap: 3,
  },
  stripPart: {
    height: 8,
    borderRadius: labRadius.pill,
  },
  stripLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: labSpace.xs,
  },
});
