/**
 * Writing and editing a journal entry — ONE sheet above the keyboard (migration
 * E12 point 2, from the Design Lab's journalParts). Replaces the inline
 * GratitudeInput and EditGratitudeModal.
 *
 * - New: a type switch (gratitude / self-praise), what this entry earns
 *   (journalPositionXp — the storage's own rule), a prompt in the guide's voice
 *   that can be shuffled, "Bonus entry (optional)" after the daily three.
 * - Edit: the same sheet with the entry's text.
 * - A field left empty or too short shakes and says why, at the field.
 * - Saving is the caller's (`onSave` resolves true when stored). If it fails,
 *   the sheet STAYS OPEN with the text and the caller shows a calm note (7.9) —
 *   nothing typed is lost. XP is the storage's; the sheet only tells the XP
 *   layer where the sparks start (the Add button).
 * Lengths as before: a new entry up to 200 characters, an edit up to 500.
 */
import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { registerXpOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import {
  journalMilestoneAt,
  journalPositionXp,
  JOURNAL_DAILY_GOAL,
} from '@/src/utils/journalXp';
import {
  AppText,
  BottomSheet,
  InlineIcon,
  PressableScale,
  typeStyle,
} from '@/src/components/ui';
import { EntryType, typeLook } from './EntryCard';

/** Shortest entry the journal takes (the error text shows this number). */
export const MIN_ENTRY_LENGTH = 3;
const MAX_NEW = 200;
const MAX_EDIT = 500;

export type ComposerMode =
  | { kind: 'new'; type: EntryType }
  | { kind: 'edit'; id: string; type: EntryType; text: string };

function usePrompts(type: EntryType) {
  const { t } = useI18n();
  return useMemo(() => {
    const list = t(
      type === 'gratitude'
        ? 'journal.input.gratitudePlaceholders'
        : 'journal.input.selfPraisePlaceholders',
      { returnObjects: true }
    ) as unknown;
    return Array.isArray(list) && list.length > 0
      ? (list as string[])
      : [t('journal.input.defaultPlaceholder')];
  }, [t, type]);
}

export function EntryComposer({
  mode,
  nextPosition,
  bottomInset,
  onClosed,
  onSave,
}: {
  mode: ComposerMode;
  /** For a new entry: the place it will take today (sets what it earns). */
  nextPosition: number;
  bottomInset: number;
  onClosed: () => void;
  /** Resolves true when stored; false keeps the sheet open with the text. */
  onSave: (type: EntryType, text: string) => Promise<boolean>;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const isNew = mode.kind === 'new';
  const [type, setType] = useState<EntryType>(mode.type);
  const [text, setText] = useState(mode.kind === 'edit' ? mode.text : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prompts = usePrompts(type);
  const [promptIndex, setPromptIndex] = useState(() =>
    Math.floor(Math.random() * 1000)
  );
  const prompt = prompts[promptIndex % prompts.length] ?? '';
  const saveRef = useRef<View>(null);
  const look = typeLook(c, type);
  const bonus = isNew && nextPosition > JOURNAL_DAILY_GOAL;
  const xp = journalPositionXp(nextPosition);
  const milestone = journalMilestoneAt(nextPosition);
  const max = isNew ? MAX_NEW : MAX_EDIT;

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));
  const promptFade = useSharedValue(1);
  const promptStyle = useAnimatedStyle(() => ({
    opacity: promptFade.value,
    transform: [{ translateY: (1 - promptFade.value) * 6 }],
  }));
  const nextPrompt = () => {
    promptFade.value = 0;
    promptFade.value = withTiming(1, { duration: 260 });
    setPromptIndex(i => i + 1);
  };

  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      keyboardAware
      label={t('common.cancel')}
    >
      {dismiss => {
        const save = () => {
          if (saving) return;
          const trimmed = text.trim();
          const message = !trimmed
            ? t('journal.input.emptyError')
            : trimmed.length < MIN_ENTRY_LENGTH
              ? t('journal.input.minLengthError', { min: MIN_ENTRY_LENGTH })
              : null;
          if (message) {
            setError(message);
            feel('invalid');
            shake.value = withSequence(
              withTiming(-8, { duration: 50 }),
              withTiming(8, { duration: 60 }),
              withTiming(-5, { duration: 60 }),
              withTiming(0, { duration: 50 })
            );
            return;
          }
          if (isNew) {
            saveRef.current?.measureInWindow((x, y, w, h) =>
              registerXpOrigin({ source: 'journal' }, { x: x + w / 2, y: y + h / 2 })
            );
          }
          setSaving(true);
          void onSave(type, trimmed).then(ok => {
            setSaving(false);
            if (ok) dismiss();
          });
        };

        return (
          <>
            {/* Type + what this entry earns */}
            <View style={styles.top}>
              {isNew ? (
                <View style={[styles.segment, { backgroundColor: c.track }]}>
                  {(['gratitude', 'self-praise'] as EntryType[]).map(kind => {
                    const on = kind === type;
                    const l = typeLook(c, kind);
                    const name =
                      kind === 'gratitude'
                        ? t('journal.input.typeGratitude')
                        : t('journal.input.typeSelfPraise');
                    return (
                      <PressableScale
                        key={kind}
                        pressScale={0.95}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={name}
                        onPress={() => {
                          if (on) return;
                          setType(kind);
                          nextPrompt();
                        }}
                        style={[styles.segmentItem, on && { backgroundColor: c.surface }]}
                      >
                        <Ionicons name={l.icon} size={14} color={on ? l.fg : c.textMuted} />
                        <AppText
                          variant="caption"
                          style={[styles.segmentText, { color: on ? l.fg : c.textMuted }]}
                        >
                          {name}
                        </AppText>
                      </PressableScale>
                    );
                  })}
                </View>
              ) : (
                <AppText variant="titleSm">{t('gratitude.edit.title')}</AppText>
              )}
              <View style={styles.flex} />
              {isNew && xp > 0 && (
                <View style={[styles.xpChip, { backgroundColor: c.rewardSoft }]}>
                  <Ionicons name="sparkles" size={12} color={c.rewardText} />
                  <AppText
                    variant="caption"
                    tone="reward"
                    style={styles.xpText}
                    accessibilityLabel={`${t('achievements.card.xpReward', { xp })}${
                      milestone ? ` ${t(`journal.iconNames.${milestone}`)}` : ''
                    }`}
                  >
                    {t('achievements.card.xpReward', { xp })}
                    {milestone ? (
                      <>
                        {' '}
                        <InlineIcon name={milestone} />
                      </>
                    ) : null}
                  </AppText>
                </View>
              )}
            </View>

            {/* The prompt — a question in the guide's own voice */}
            {isNew && (
              <View style={styles.promptRow}>
                <Animated.View style={[styles.flex, promptStyle]}>
                  <AppText variant="title" italic>
                    {prompt}
                  </AppText>
                  {bonus && (
                    <AppText variant="caption" tone="faint" style={styles.optional}>
                      {`${t('journal.bonusGratitude')} ${t('journal.input.optional')}`}
                    </AppText>
                  )}
                </Animated.View>
                <PressableScale
                  onPress={nextPrompt}
                  pressScale={0.88}
                  accessibilityLabel={t('journal.composer.anotherPrompt')}
                  style={[styles.roundSmall, { backgroundColor: c.track }]}
                >
                  <Ionicons name="shuffle" size={16} color={c.textMuted} />
                </PressableScale>
              </View>
            )}

            <Animated.View style={shakeStyle}>
              <TextInput
                value={text}
                onChangeText={v => {
                  setText(v);
                  if (error) setError(null);
                }}
                autoFocus
                multiline
                maxLength={max}
                placeholder={isNew ? '' : t('journal.editPlaceholder')}
                placeholderTextColor={c.textFaint}
                selectionColor={look.fill}
                cursorColor={look.fill}
                accessibilityLabel={isNew ? prompt : t('gratitude.edit.title')}
                style={[
                  typeStyle('body', c.text),
                  styles.input,
                  {
                    backgroundColor: c.canvas,
                    borderColor: error ? c.danger : look.soft,
                  },
                ]}
              />
            </Animated.View>
            {error && (
              <Animated.View entering={FadeIn.duration(160)}>
                <AppText variant="caption" style={[styles.error, { color: c.danger }]}>
                  {error}
                </AppText>
              </Animated.View>
            )}

            <View style={styles.foot}>
              <AppText variant="caption" tone={max - text.length <= 20 ? 'flame' : 'faint'}>
                {`${text.length}/${max}`}
              </AppText>
              <View style={styles.flex} />
              <PressableScale
                onPress={() => dismiss()}
                accessibilityLabel={t('common.cancel')}
                style={styles.textButton}
              >
                <AppText variant="bodyStrong" tone="muted">
                  {t('common.cancel')}
                </AppText>
              </PressableScale>
              <View ref={saveRef} collapsable={false}>
                <PressableScale
                  onPress={save}
                  feel={null}
                  accessibilityLabel={isNew ? t('common.add') : t('common.save')}
                  style={[styles.saveButton, saving && styles.saving]}
                >
                  <LinearGradient
                    colors={
                      type === 'gratitude'
                        ? c.primaryGradient
                        : ([c.success, c.success] as const)
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, styles.pill]}
                  />
                  <AppText variant="bodyStrong" tone="onPrimary">
                    {isNew ? t('common.add') : t('common.save')}
                  </AppText>
                </PressableScale>
              </View>
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 3,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  segmentText: {
    marginLeft: 6,
    fontFamily: fonts.semibold,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  xpText: {
    marginLeft: 4,
    fontFamily: fonts.semibold,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: space.lg,
  },
  optional: {
    marginTop: 2,
  },
  roundSmall: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.md,
  },
  input: {
    marginTop: space.md,
    minHeight: 104,
    maxHeight: 180,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: space.md,
    paddingTop: space.md,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: space.sm,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
  },
  textButton: {
    paddingHorizontal: space.md,
    height: 46,
    justifyContent: 'center',
    marginRight: space.xs,
  },
  saveButton: {
    height: 46,
    paddingHorizontal: space.xxl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  saving: {
    opacity: 0.6,
  },
  pill: {
    borderRadius: radius.pill,
  },
});
