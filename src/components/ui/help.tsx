/**
 * In-place help (migration E6 for the habit detail; from the Design Lab's
 * labHelp.tsx, kolo 48). A quiet "i" next to a rule that is not visible on
 * screen opens a bottom sheet with the rule in words.
 *
 * - The "i" is in the text's own faint grey with a 44 pt hit area — not a "?"
 *   that reads like a question the user failed.
 * - The texts are the `help.rules.*` keys: the same ones the "How SelfRise
 *   works" page will show (E22, plan 7.10) — one text, two places. "All the
 *   rules" (`help.allRules`) joins the sheet when that page exists.
 * - Topics come one by one with their screens (7.10): makeUp now (E6).
 */
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { space } from '@/src/design/tokens';
import { MAX_DEBT_DAYS, XP_MULTIPLIERS, XP_REWARDS } from '@/src/constants/gamification';
import { AppText, PressableScale } from './primitives';
import { BottomSheet } from './sheets';

export type HelpTopic = 'makeUp' | 'multiplier' | 'journalDay' | 'frozen' | 'pace';

/** Which rules a topic shows (keys under help.rules). */
export const HELP_TOPIC_RULES: Record<HelpTopic, string[]> = {
  makeUp: ['makeUp'],
  // E9: the harmony multiplier (new host for the old home.xpSystem tooltip, 7.10)
  multiplier: ['harmony'],
  // E12: the journal day (new host for help.journal.selfRiseStreak) and the
  // frozen streak (new host for help.journal.debtRecovery), 7.10
  journalDay: ['three', 'bonus'],
  frozen: ['frozen'],
  // E15: a goal's pace (new host for help.goals.predictions, whose card goes), 7.10
  pace: ['pace'],
};

/** Numbers a rule's text prints — from the app's constants, never written into the text. */
function ruleParams(id: string): Record<string, string | number> {
  const J = XP_REWARDS.JOURNAL;
  switch (id) {
    case 'harmony':
      return {
        days: XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED,
        factor: `${XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER}×`,
        hours: XP_MULTIPLIERS.HARMONY_STREAK_DURATION,
        cooldownDays: Math.round(XP_MULTIPLIERS.HARMONY_STREAK_COOLDOWN / 24),
      };
    case 'three':
      return { perEntry: J.FIRST_ENTRY };
    case 'bonus':
      return {
        star: J.FIRST_BONUS_MILESTONE,
        flame: J.FIFTH_BONUS_MILESTONE,
        crown: J.TENTH_BONUS_MILESTONE,
        each: J.BONUS_ENTRY,
      };
    case 'frozen':
      return { maxDays: MAX_DEBT_DAYS };
    default:
      return {};
  }
}

/**
 * The page that hosts help sheets (E12 review fix). A BottomSheet is not a
 * portal: drawn next to the "i" it would be laid out against that small box
 * (and clipped by its card). Wrap a page's content in <HelpHost>: every
 * HelpLink inside opens ONE sheet at the page's level. Without a host the
 * link keeps drawing its own sheet (for a link whose parent is the page).
 */
const HelpHostContext = createContext<((topic: HelpTopic) => void) | null>(null);

export function HelpHost({
  bottomInset,
  children,
}: {
  bottomInset: number;
  children: ReactNode;
}) {
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  return (
    <HelpHostContext.Provider value={setTopic}>
      {children}
      {topic && (
        <HelpSheet topic={topic} bottomInset={bottomInset} onClosed={() => setTopic(null)} />
      )}
    </HelpHostContext.Provider>
  );
}

export function HelpLink({
  topic,
  bottomInset,
  onOpen,
}: {
  topic: HelpTopic;
  /** Room at the bottom the sheet must stay above (banner). */
  bottomInset: number;
  /**
   * The sheet is hosted elsewhere (the level panel closes first, then the badge
   * layer opens the sheet — one thing at a time).
   */
  onOpen?: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const host = useContext(HelpHostContext);
  return (
    <>
      <PressableScale
        onPress={() =>
          onOpen ? onOpen() : host ? host(topic) : setOpen(true)
        }
        pressScale={0.88}
        accessibilityLabel={t(`help.topics.${topic}`)}
        style={styles.link}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={c.textFaint}
        />
      </PressableScale>
      {open && (
        <HelpSheet
          topic={topic}
          bottomInset={bottomInset}
          onClosed={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function HelpSheet({
  topic,
  bottomInset,
  onClosed,
}: {
  topic: HelpTopic;
  bottomInset: number;
  onClosed: () => void;
}) {
  const { t } = useI18n();
  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.close')}
    >
      {() => (
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheet}
          showsVerticalScrollIndicator={false}
        >
          {HELP_TOPIC_RULES[topic].map((id, i) => (
            <View key={id} style={i > 0 ? styles.next : undefined}>
              <AppText variant="titleSm">{t(`help.rules.${id}.title`, ruleParams(id))}</AppText>
              <AppText variant="body" tone="muted" style={styles.text}>
                {t(`help.rules.${id}.text`, ruleParams(id))}
              </AppText>
            </View>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  link: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -12,
  },
  sheetScroll: {
    maxHeight: 480,
  },
  sheet: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  next: {
    marginTop: space.lg,
  },
  text: {
    marginTop: space.xs,
  },
});
