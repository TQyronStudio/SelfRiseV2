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
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { space } from '@/src/design/tokens';
import { AppText, PressableScale } from './primitives';
import { BottomSheet } from './sheets';

export type HelpTopic = 'makeUp';

/** Which rules a topic shows (keys under help.rules). */
export const HELP_TOPIC_RULES: Record<HelpTopic, string[]> = {
  makeUp: ['makeUp'],
};

export function HelpLink({
  topic,
  bottomInset,
}: {
  topic: HelpTopic;
  /** Room at the bottom the sheet must stay above (banner). */
  bottomInset: number;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale
        onPress={() => setOpen(true)}
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

function HelpSheet({
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
              <AppText variant="titleSm">{t(`help.rules.${id}.title`)}</AppText>
              <AppText variant="body" tone="muted" style={styles.text}>
                {t(`help.rules.${id}.text`)}
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
