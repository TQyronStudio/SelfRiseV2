/**
 * The remaining celebrations in the new language (kolo 39): a new level tier, a
 * journal streak length, and the XP multiplier switching on. Rules: momentRules.ts.
 *
 * - NEW CHAPTER — the only level-up that gets a window. Entering a tier changes
 *   the stage's name and colour (five times ever); every other level-up stays the
 *   badge's own burst and its "LEVEL UP" tag (R-29). The window shows the journey
 *   strip of the levels overview with the new part lit — it is the same road.
 * - JOURNAL STREAK — the app celebrates 17 lengths, every one with a window. Here
 *   the first week and the big lengths (30, 100, 365, 1000) keep a window with the
 *   living flame; the others are a quiet note at the level badge. Five lengths
 *   pay XP (7/21/30/100/365 — the app's own table, paid since 2026-11-14); the
 *   moment shows it and it flies home when the moment ends. The others show none.
 * - MULTIPLIER — one window when the user switches the harmony multiplier on.
 *
 * All go through the one line of moments (celebrationDirector.tsx), so they never
 * stack with trophies or challenge moments.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - New chapter replaces the level-up CelebrationModal (today at every level-up);
 *   trigger from the `levelUp` event when the tier changed.
 * - Streak moments replace CelebrationModal type `streak_milestone`; texts stay
 *   the app's (journalStreakMilestones.ts), the quiet ones use the title only.
 * - Multiplier window replaces MultiplierActivationModal.
 * - Windows stay in ModalQueueContext; notes are not windows.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '@/src/config/i18n';
import { XP_MULTIPLIERS } from '@/src/constants/gamification';
import {
  notification,
  NotificationFeedbackType,
} from '@/src/services/hapticsService';
import { getLevelInfo } from '@/src/services/levelCalculation';
import { getJournalStreakReward } from '@/src/utils/journalStreakMilestones';
import {
  LabTrophy,
  useLabCelebrate,
  useLabMoments,
} from './celebrationDirector';
import { Medal } from './AchievementCelebrationConcept';
import {
  momentStyles,
  PrimaryButton,
  useWindowMotion,
} from './challengeMoments';
import { useJournalT } from './journalParts';
import { useLabCover } from './labCover';
import { LabText, typeStyle, useLab } from './labPrimitives';
import { labFonts, labSpace, labTier, LabTierId } from './labTokens';
import { LEVEL_TIERS, tierFill, tierOf } from './levelsJourney';
import { LabLang, MOCK_COPY } from './mockCopy';
import { chapterOfAction, streakMomentSize, tierEntered } from './momentRules';
import { StreakFlame } from './StreakFlame';
import { useLabXpAward } from './xpFlight';

const GOLD: readonly [string, string] = ['#FFD36B', '#F4A93F'];

/** The app's own words for a streak length, without the trailing emoji. */
function streakWords(days: number, lang: LabLang) {
  const t = i18n.getFixedT(lang);
  const own = `journal.streakMilestone${days}`;
  const has = i18n.exists(`${own}_title`, { lng: lang });
  const clean = (text: string) =>
    text.replace(/[\s️]*\p{Extended_Pictographic}+[\s️]*$/u, '').trim();
  return {
    title: clean(
      t(has ? `${own}_title` : 'journal.streakMilestone_generic_title')
    ),
    message: has
      ? t(`${own}_text`)
      : t('journal.streakMilestone_generic_text', { days }),
  };
}

// ---------------------------------------------------------------------------
// Lab triggers — in the app: the levelUp event, the journal streak, the button
// ---------------------------------------------------------------------------

export function useOtherMoments() {
  const { lang } = useLab();
  const text = MOCK_COPY[lang].moments;
  const { showNote, showWindow } = useLabMoments();
  const celebrate = useLabCelebrate();
  // Chapters already shown with the action that opened them: the level-up that
  // follows when the XP lands must not show the same chapter again.
  const chaptersShown = useRef(new Set<number>());
  return useMemo(
    () => ({
      /** A level-up from `previous` to `level`: a window only for a new tier. */
      levelUp(previous: number, level: number) {
        const tier = tierEntered(previous, level);
        if (!tier) return;
        // Already shown with the action whose XP opened it: this level-up is
        // that same XP landing. Skip it once — a later level-up shows again.
        if (chaptersShown.current.delete(level)) return;
        showWindow(done => (
          <ChapterWindow level={level} tier={tier} onClosed={done} />
        ));
      },
      journalStreak(days: number) {
        const size = streakMomentSize(days);
        if (size === 'window') {
          showWindow(done => <StreakWindow days={days} onClosed={done} />);
        } else if (size === 'quiet') {
          showNote({
            icon: 'flame',
            overline: text.streakOverline,
            title: text.streakDays(days),
            xp: getJournalStreakReward(days),
            tone: 'flame',
          });
        }
      },
      /**
       * What one action unlocked, when its XP may open a new chapter (kolo 46,
       * L-8): then ONE window — the chapter, with the trophies inside it.
       * Otherwise the trophy rules as before (celebrationDirector.momentFor).
       */
      action(batch: LabTrophy[], xpBefore: number) {
        const xp = batch.reduce((sum, item) => sum + item.xp, 0);
        const chapter = chapterOfAction(xpBefore, xp);
        if (!chapter) {
          celebrate(batch);
          return;
        }
        chaptersShown.current.add(chapter.level);
        showWindow(done => (
          <ChapterWindow
            level={chapter.level}
            tier={chapter.tier}
            also={batch}
            onClosed={done}
          />
        ));
      },
      multiplier() {
        showWindow(done => <MultiplierWindow onClosed={done} />);
      },
    }),
    [showNote, showWindow, celebrate, text]
  );
}

function useBackToClose(close: () => void) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);
}

/** The disc at the top of a window, with a ring that spreads once. */
function Emblem({
  ringColor,
  children,
}: {
  ringColor: string;
  children: React.ReactNode;
}) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withDelay(
      200,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
  }, [ring]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 0.9 + 1.2 * ring.value }],
  }));
  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + 0.6 * Math.min(1, ring.value * 1.6) }],
  }));
  return (
    <View style={momentStyles.medalBox}>
      <Animated.View
        style={[momentStyles.medalRing, { borderColor: ringColor }, ringStyle]}
      />
      <Animated.View style={discStyle}>{children}</Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// New chapter — entering a tier
// ---------------------------------------------------------------------------

export function ChapterWindow({
  level,
  tier,
  also = [],
  onClosed,
}: {
  level: number;
  tier: LabTierId;
  /** Trophies of the same action ride inside (kolo 46); their XP flies from the button. */
  also?: LabTrophy[];
  onClosed: () => void;
}) {
  const { c, lang, mode } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.moments;
  const t = useJournalT();
  const look = labTier[tier];
  const range = tierOf(level);
  const name = t(`gamification.levels.overview.rarity.${tier}`);
  const xp = also.reduce((sum, item) => sum + item.xp, 0);
  const award = useLabXpAward();
  const buttonRef = useRef<View>(null);
  const { leave, scrimStyle, cardStyle } = useWindowMotion(
    onClosed,
    `${text.chapterOverline}. ${name}. ${copy.level(level)}${
      also.length
        ? `. ${copy.celebrate.alsoUnlocked}: ${also.map(item => t(item.nameKey)).join(', ')}. +${xp} XP`
        : ''
    }`
  );
  // The trophies' XP is credited now, from the button into the badge — as in
  // the trophy window.
  const close = useCallback(() => {
    const node = buttonRef.current;
    if (xp === 0 || !node) leave(() => award(xp));
    else
      node.measureInWindow((x, y, w, h) =>
        leave(() => award(xp, { x: x + w / 2, y: y + h / 2 }))
      );
  }, [award, leave, xp]);
  useBackToClose(close);
  useEffect(() => {
    notification(NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[StyleSheet.absoluteFill, momentStyles.scrim, scrimStyle]}
      />
      <View style={momentStyles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            momentStyles.card,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <Emblem ringColor={look.fill[1]}>
            {/* Solid, the darker stop: the number must stay readable (labTier.on). */}
            <View
              style={[momentStyles.medal, { backgroundColor: look.fill[1] }]}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={[
                  typeStyle('number', look.on),
                  { fontFamily: labFonts.bold },
                ]}
              >
                {level}
              </Text>
            </View>
          </Emblem>

          <Text
            maxFontSizeMultiplier={1.4}
            style={[
              typeStyle('overline', look.text[mode]),
              momentStyles.centered,
            ]}
          >
            {text.chapterOverline}
          </Text>
          <LabText
            variant="display"
            style={[momentStyles.centered, { marginTop: labSpace.xs }]}
          >
            {name}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={[momentStyles.centered, { marginTop: labSpace.xs }]}
          >
            {`${copy.level(level)} · ${getLevelInfo(level).title}`}
          </LabText>

          {/* The road of the levels overview, with the new part just begun. */}
          <View style={styles.strip}>
            {LEVEL_TIERS.map(part => (
              <View
                key={part.id}
                style={[
                  styles.stripPart,
                  { flex: part.to - part.from + 1, backgroundColor: c.track },
                ]}
              >
                <LinearGradient
                  colors={labTier[part.id].fill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    // The first level of a tier would be a sliver: show it.
                    width: `${Math.max(part.id === tier ? 0.12 : 0, tierFill(part, level)) * 100}%`,
                    height: '100%',
                  }}
                />
              </View>
            ))}
          </View>
          <LabText
            variant="label"
            tone="muted"
            style={[momentStyles.centered, { marginTop: labSpace.md }]}
          >
            {text.chapterLine(range.from, range.to)}
          </LabText>

          {also.length > 0 && (
            <View style={[styles.also, { borderColor: c.border }]}>
              <LabText variant="caption" tone="muted">
                {copy.celebrate.alsoUnlocked}
              </LabText>
              <View style={styles.alsoRow}>
                {also.map(item => (
                  <View key={item.id} style={styles.alsoItem}>
                    <Medal trophy={item} size={28} />
                    <LabText
                      variant="label"
                      numberOfLines={1}
                      style={{ marginLeft: labSpace.sm, flexShrink: 1 }}
                    >
                      {t(item.nameKey)}
                    </LabText>
                  </View>
                ))}
              </View>
              <View style={[styles.reward, { backgroundColor: c.rewardSoft }]}>
                <Ionicons name="sparkles" size={14} color={c.rewardText} />
                <LabText
                  variant="bodyStrong"
                  tone="reward"
                  style={{ marginLeft: 6 }}
                >
                  {`+${xp} XP`}
                </LabText>
              </View>
            </View>
          )}

          <PrimaryButton
            label={copy.challenge.continue}
            onPress={close}
            buttonRef={buttonRef}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Journal streak — the big lengths
// ---------------------------------------------------------------------------

export function StreakWindow({
  days,
  onClosed,
}: {
  days: number;
  onClosed: () => void;
}) {
  const { c, lang } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.moments;
  const words = useMemo(() => streakWords(days, lang), [days, lang]);
  const xp = getJournalStreakReward(days);
  const award = useLabXpAward();
  const buttonRef = useRef<View>(null);
  const { leave, scrimStyle, cardStyle } = useWindowMotion(
    onClosed,
    `${text.streakDays(days)}. ${words.title}`
  );
  // The reward (if this length has one) is shown as it leaves the button.
  const close = useCallback(() => {
    const node = buttonRef.current;
    if (xp === 0 || !node) leave(() => award(xp));
    else {
      node.measureInWindow((x, y, w, h) =>
        leave(() => award(xp, { x: x + w / 2, y: y + h / 2 }))
      );
    }
  }, [award, leave, xp]);
  useBackToClose(close);
  useEffect(() => {
    notification(NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[StyleSheet.absoluteFill, momentStyles.scrim, scrimStyle]}
      />
      <View style={momentStyles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            momentStyles.card,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <View style={styles.flame}>
            <StreakFlame
              state="fire"
              onStateChange={() => undefined}
              size={104}
              label={text.streakDays(days)}
            />
          </View>
          <LabText
            variant="overline"
            tone="flame"
            style={momentStyles.centered}
          >
            {text.streakOverline}
          </LabText>
          <LabText
            variant="display"
            style={[momentStyles.centered, styles.streakNumber]}
          >
            {days}
          </LabText>
          <LabText
            variant="title"
            style={[momentStyles.centered, { marginTop: labSpace.xs }]}
          >
            {words.title}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={[momentStyles.centered, { marginTop: labSpace.sm }]}
          >
            {words.message}
          </LabText>
          {xp > 0 && (
            <View style={[styles.reward, { backgroundColor: c.rewardSoft }]}>
              <Ionicons name="sparkles" size={14} color={c.rewardText} />
              <LabText
                variant="bodyStrong"
                tone="reward"
                style={{ marginLeft: 6 }}
              >
                {`+${xp} XP`}
              </LabText>
            </View>
          )}
          <PrimaryButton
            label={copy.challenge.continue}
            onPress={close}
            buttonRef={buttonRef}
          />
        </Animated.View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// XP multiplier switched on
// ---------------------------------------------------------------------------

export function MultiplierWindow({ onClosed }: { onClosed: () => void }) {
  const { c, lang } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const text = copy.moments;
  const factor = XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER.toLocaleString(
    copy.locale
  );
  const title = text.multiplierTitle(
    factor,
    XP_MULTIPLIERS.HARMONY_STREAK_DURATION
  );
  const { leave, scrimStyle, cardStyle } = useWindowMotion(onClosed, title);
  const close = useCallback(() => leave(), [leave]);
  useBackToClose(close);
  useEffect(() => {
    notification(NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        style={[StyleSheet.absoluteFill, momentStyles.scrim, scrimStyle]}
      />
      <View style={momentStyles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            momentStyles.card,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <Emblem ringColor={GOLD[1]}>
            <LinearGradient
              colors={GOLD}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={momentStyles.medal}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                style={[
                  typeStyle('number', '#4A2F00'),
                  { fontFamily: labFonts.bold },
                ]}
              >
                {`${factor}×`}
              </Text>
            </LinearGradient>
          </Emblem>
          <LabText
            variant="overline"
            tone="reward"
            style={momentStyles.centered}
          >
            {text.multiplierOverline(
              XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED
            )}
          </LabText>
          <LabText
            variant="title"
            style={[momentStyles.centered, { marginTop: labSpace.xs }]}
          >
            {title}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={[momentStyles.centered, { marginTop: labSpace.sm }]}
          >
            {text.multiplierLine}
          </LabText>
          <PrimaryButton label={text.letsGo} onPress={close} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: 3,
    marginTop: labSpace.xl,
  },
  stripPart: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  flame: {
    alignItems: 'center',
    marginBottom: labSpace.md,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: 999,
  },
  also: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: labSpace.lg,
    paddingTop: labSpace.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alsoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: labSpace.md,
    marginTop: labSpace.sm,
  },
  alsoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  streakNumber: {
    fontSize: 56,
    lineHeight: 62,
    marginTop: labSpace.xs,
  },
});
