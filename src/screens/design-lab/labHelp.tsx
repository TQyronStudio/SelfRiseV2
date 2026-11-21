/**
 * In-place help (kolo 48, lab debt L-4 — the `?` tooltips). Replaces HelpTooltip.
 *
 * Today there are eleven `?` icons. Three of them explain buttons that already say
 * what they do (quick actions, recommendations, "create any goal") — the app's own
 * admission test (helpTopics.ts) keeps those off the "How it works" page, so here
 * they go altogether. Two lose their host in the new design (the XP bar on Home,
 * the five-method predictions). What stays is help where a HIDDEN rule shows:
 *
 *   habit detail calendar   → make-up (the golden check)
 *   journal "Today" card    → three entries + ⭐ 🔥 👑
 *   journal frozen card     → the warm-up
 *   goal detail, pace       → pace in plain words
 *   level panel, harmony    → the XP multiplier          (was the XP bar's `?`)
 *   challenge detail, stars → stars per area + warm-ups
 *
 * - A quiet "i" in the text's own grey, with a 44 pt hit area — not a `?` that
 *   reads like a question the user failed.
 * - It opens a bottom sheet with THE SAME rule texts as the "How SelfRise works"
 *   page (useHowItWorksSections) — one text, two places, as helpTopics.ts asked —
 *   and "All the rules", which opens that page at the right section.
 * - The sheet is drawn above the tabs, so a link inside the level panel works too
 *   (the panel is put away first: one thing at a time).
 *
 * GOING LIVE (1:1) — see PREVOD.md: HelpTooltip becomes this link + sheet; the
 * topics' texts are the new `help.*` texts the page uses; the three dropped keys
 * and their tooltips go; the guard test checks the topic → rule mapping below.
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RuleId, SectionId, useHowItWorksSections } from './HowItWorksConcept';
import { BottomSheet, useJournalT } from './journalParts';
import { Divider, LabText, PressableScale, useLab } from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';

export type HelpTopic =
  'makeUp' | 'journalDay' | 'frozen' | 'pace' | 'multiplier' | 'stars';

/** Which rules a topic shows, and the page section "All the rules" opens. */
export const HELP_TOPICS: Record<
  HelpTopic,
  { rules: RuleId[]; section: SectionId }
> = {
  makeUp: { rules: ['makeUp'], section: 'habits' },
  journalDay: { rules: ['three', 'bonus'], section: 'journal' },
  frozen: { rules: ['frozen'], section: 'journal' },
  pace: { rules: ['pace'], section: 'goals' },
  multiplier: { rules: ['harmony'], section: 'multiplier' },
  stars: { rules: ['stars', 'warmUp'], section: 'challenge' },
};

const LabHelpContext = createContext<((topic: HelpTopic) => void) | null>(null);

export function LabHelpProvider({
  bottomInset,
  onOpenRules,
  children,
}: {
  bottomInset: number;
  onOpenRules: (section: SectionId) => void;
  children: ReactNode;
}) {
  const [topic, setTopic] = useState<HelpTopic | null>(null);
  const show = useCallback((next: HelpTopic) => setTopic(next), []);
  return (
    <LabHelpContext.Provider value={show}>
      {children}
      {topic && (
        <HelpSheet
          topic={topic}
          bottomInset={bottomInset}
          onClosed={() => setTopic(null)}
          onOpenRules={onOpenRules}
        />
      )}
    </LabHelpContext.Provider>
  );
}

export function useLabHelp(): (topic: HelpTopic) => void {
  const ctx = useContext(LabHelpContext);
  if (!ctx) throw new Error('useLabHelp must be used inside LabHelpProvider');
  return ctx;
}

/** The quiet "i" next to a rule that is not visible on screen. */
export function HelpLink({
  topic,
  before,
}: {
  topic: HelpTopic;
  /** Something to put away first (the level panel). */
  before?: () => void;
}) {
  const { c, lang } = useLab();
  const show = useLabHelp();
  return (
    <PressableScale
      onPress={() => {
        before?.();
        show(topic);
      }}
      pressScale={0.88}
      accessibilityRole="button"
      accessibilityLabel={MOCK_COPY[lang].help.label[topic]}
      style={styles.link}
    >
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={c.textFaint}
      />
    </PressableScale>
  );
}

function HelpSheet({
  topic,
  bottomInset,
  onClosed,
  onOpenRules,
}: {
  topic: HelpTopic;
  bottomInset: number;
  onClosed: () => void;
  onOpenRules: (section: SectionId) => void;
}) {
  const { c, lang } = useLab();
  const t = useJournalT();
  const sections = useHowItWorksSections();
  const { rules: ids, section } = HELP_TOPICS[topic];
  const rules = useMemo(
    () =>
      ids.flatMap(id =>
        sections.flatMap(s => s.rules.filter(rule => rule.id === id))
      ),
    [ids, sections]
  );

  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.close')}
    >
      {dismiss => (
        // Long rules (German, large text) scroll instead of pushing the sheet's
        // top off screen.
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheet}
          showsVerticalScrollIndicator={false}
        >
          {rules.map((rule, i) => (
            <View key={rule.id}>
              {i > 0 && <Divider style={{ marginVertical: labSpace.md }} />}
              <LabText variant="titleSm">{rule.title}</LabText>
              <LabText
                variant="body"
                tone="muted"
                style={{ marginTop: labSpace.xs }}
              >
                {rule.text}
              </LabText>
              {rule.picture && (
                <View
                  style={{ marginTop: labSpace.md }}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  {rule.picture}
                </View>
              )}
            </View>
          ))}
          <PressableScale
            onPress={() => dismiss(() => onOpenRules(section))}
            accessibilityRole="link"
            accessibilityLabel={MOCK_COPY[lang].help.allRules}
            style={[styles.all, { backgroundColor: c.primarySoft }]}
          >
            <LabText variant="bodyStrong" tone="primary">
              {MOCK_COPY[lang].help.allRules}
            </LabText>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={c.primary}
              style={{ marginLeft: labSpace.sm }}
            />
          </PressableScale>
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // 44 pt to hit, drawn as an 18 pt icon: the negative margin keeps the line's
  // layout as if the icon were small.
  link: {
    width: 44,
    height: 44,
    margin: -13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    maxHeight: 560,
  },
  sheet: {
    paddingTop: labSpace.sm,
  },
  all: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.xl,
    borderRadius: labRadius.pill,
  },
});
