/**
 * Shared pieces of the journal concept (kolo 20): the page that slides in (History,
 * Statistics), the bottom sheet that rides on the keyboard, the entry card, the
 * writing sheet, the confirm sheet, the simulated ad and the ⭐🔥👑 moment.
 *
 * Texts come from the app's own locales wherever a key exists (i18n.getFixedT), so
 * going live needs no new translations for them; the few new lines live in
 * mockCopy.ts → `journal`.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - The writing sheet replaces GratitudeInput + EditGratitudeModal (one component
 *   for new and edit). Validation stays the app's (empty, < 3 chars); the debt gate
 *   stays in front of the save — here it already locks the tiles BEFORE typing.
 * - Bottom sheets lift by the keyboard's real overlap with the page (measured), so
 *   they work whether Android resizes the window or not. Never a fixed offset.
 * - Entry XP flies from where it was earned (the Add button); a milestone's XP only
 *   after "Continue" (R-10). Taken-back XP flies nothing.
 * - The ⭐🔥👑 moment stays ONE modal from ModalQueueContext (Tier 1, activity).
 */
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SharedValue,
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
import i18n from '@/src/config/i18n';
import {
  impact,
  ImpactFeedbackStyle,
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import { LabText, PressableScale, typeStyle, useLab } from './labPrimitives';
import {
  labFonts,
  LabMode,
  LabPalette,
  labRadius,
  labSpace,
} from './labTokens';
import { LabLang, MOCK_COPY } from './mockCopy';
import { RollingNumber } from './RollingNumber';
import { useLabXpAward } from './xpFlight';
import {
  EntryType,
  LabEntry,
  milestoneAt,
  MilestoneKind,
  milestoneXp,
  entryXp,
} from './journalMock';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface Point {
  x: number;
  y: number;
}

/** The app's own texts, in the lab's language. */
export function useJournalT() {
  const { lang } = useLab();
  return useMemo(() => i18n.getFixedT(lang), [lang]);
}

export const MILESTONE_EMOJI: Record<MilestoneKind, string> = {
  star: '⭐',
  flame: '🔥',
  crown: '👑',
};

/** Ice of a frozen streak — the one cold colour of the journal. */
export function iceColors(mode: LabMode) {
  return mode === 'light'
    ? { fg: '#2477C4', soft: '#E4F1FC', ring: '#7DB9EC' }
    : { fg: '#8FD0FF', soft: 'rgba(143, 208, 255, 0.13)', ring: '#5FA9DF' };
}

export function dangerColor(mode: LabMode) {
  return mode === 'light' ? '#C8344A' : '#FF8A97';
}

/** Gratitude = our blue, self-praise = green — the app's existing identities. */
export function typeLook(c: LabPalette, type: EntryType) {
  return type === 'gratitude'
    ? {
        fg: c.primary,
        soft: c.primarySoft,
        fill: c.primary,
        icon: 'heart' as IoniconName,
      }
    : {
        fg: c.successText,
        soft: c.successSoft,
        fill: c.success,
        icon: 'sparkles' as IoniconName,
      };
}

export function formatDay(key: string, locale: string, long = false): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(locale, {
    weekday: long ? 'long' : 'short',
    day: 'numeric',
    month: long ? 'long' : 'short',
  });
}

// ---------------------------------------------------------------------------
// A page that slides in from the right (History, Statistics)
// ---------------------------------------------------------------------------

export function SlidePage({
  width,
  onClosed,
  children,
}: {
  width: number;
  onClosed: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const { c } = useLab();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(1, {
      damping: 26,
      stiffness: 230,
      overshootClamping: true,
    });
  }, [p]);

  const close = useCallback(() => {
    selection();
    Keyboard.dismiss();
    p.value = withTiming(
      0,
      { duration: 280, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) scheduleOnRN(onClosed);
      }
    );
  }, [p, onClosed]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.25 * p.value }));
  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - p.value) * (width + 24) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000' },
          scrimStyle,
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.page,
          { backgroundColor: c.canvas },
          pageStyle,
        ]}
      >
        {children(close)}
      </Animated.View>
    </View>
  );
}

/** Top bar of a page: the level badge stays pinned on the left, close on the right. */
export function PageTopBar({
  onClose,
  label,
}: {
  onClose: () => void;
  label: string;
}) {
  const { c } = useLab();
  return (
    <View style={styles.topBar}>
      <PressableScale
        onPress={onClose}
        haptic={null}
        pressScale={0.9}
        accessibilityLabel={label}
        style={[
          styles.roundButton,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Ionicons name="close" size={20} color={c.text} />
      </PressableScale>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet — rides on top of the keyboard when it has a text field
// ---------------------------------------------------------------------------

/**
 * How far something docked at the bottom of a page must rise so it sits on top of
 * the keyboard: the keyboard's REAL overlap with the page (measured), minus the
 * room already kept for the banner + tab bar. Correct whether the window resizes
 * for the keyboard (Android) or not (iOS). `keyboardTop` = the keyboard's top edge
 * in window coordinates while it is up (for scrolling a focused field into view).
 */
export function useKeyboardLift(
  rootRef: React.RefObject<View | null>,
  bottomInset: number,
  enabled = true
) {
  const lift = useSharedValue(0);
  const keyboardTop = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      ios ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        keyboardTop.current = e.endCoordinates.screenY;
        rootRef.current?.measureInWindow((_x, y, _w, h) => {
          const overlap = Math.max(0, y + h - e.endCoordinates.screenY);
          lift.value = withTiming(Math.max(0, overlap - bottomInset), {
            duration: e.duration || 240,
            easing: Easing.out(Easing.cubic),
          });
        });
      }
    );
    const hide = Keyboard.addListener(
      ios ? 'keyboardWillHide' : 'keyboardDidHide',
      e => {
        keyboardTop.current = null;
        lift.value = withTiming(0, {
          duration: e.duration || 220,
          easing: Easing.out(Easing.cubic),
        });
      }
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, bottomInset, lift, rootRef]);
  return { lift, keyboardTop };
}

export type Dismiss = (after?: () => void) => void;

export function BottomSheet({
  bottomInset,
  onClosed,
  keyboardAware = false,
  label,
  children,
}: {
  /** Banner + tab bar: the rows must sit above them. */
  bottomInset: number;
  onClosed: () => void;
  keyboardAware?: boolean;
  label: string;
  children: (dismiss: Dismiss) => ReactNode;
}) {
  const { c } = useLab();
  const rootRef = useRef<View>(null);
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(1, {
      damping: 22,
      stiffness: 260,
      overshootClamping: true,
    });
  }, [p]);

  const dismiss = useCallback<Dismiss>(
    after => {
      Keyboard.dismiss();
      const finish = () => {
        onClosed();
        after?.();
      };
      p.value = withTiming(0, { duration: 210 }, finished => {
        if (finished) scheduleOnRN(finish);
      });
    },
    [p, onClosed]
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [dismiss]);

  // The keyboard's real overlap with this page (measured) — see useKeyboardLift.
  const { lift } = useKeyboardLift(rootRef, bottomInset, keyboardAware);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.35 * p.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * 520 - lift.value }],
  }));

  return (
    <View ref={rootRef} style={StyleSheet.absoluteFill} collapsable={false}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismiss()}
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000000' },
            scrimStyle,
          ]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          contentColumn,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            paddingBottom: bottomInset + labSpace.lg,
          },
          panelStyle,
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.track }]} />
        {children(dismiss)}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Entry card
// ---------------------------------------------------------------------------

/** Text with the search term picked out (case-insensitive). */
function Highlighted({ text, term }: { text: string; term: string }) {
  const { c } = useLab();
  const needle = term.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const parts: { s: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at === -1) {
      parts.push({ s: text.slice(i), hit: false });
      break;
    }
    if (at > i) parts.push({ s: text.slice(i, at), hit: false });
    parts.push({ s: text.slice(at, at + needle.length), hit: true });
    i = at + needle.length;
  }
  return (
    <>
      {parts.map((part, k) =>
        part.hit ? (
          <Text
            key={k}
            style={{
              fontFamily: labFonts.semibold,
              color: c.primary,
              backgroundColor: c.primarySoft,
            }}
          >
            {part.s}
          </Text>
        ) : (
          <Text key={k}>{part.s}</Text>
        )
      )}
    </>
  );
}

export function EntryCard({
  entry,
  position,
  fresh = false,
  dateLabel,
  term = '',
  onMore,
}: {
  entry: LabEntry;
  /** 1-based place in its day — always 1..N. */
  position: number;
  /** Just written: the card glows twice in its type's colour as it arrives. */
  fresh?: boolean;
  /** Shown above the text (search results span many days). */
  dateLabel?: string;
  term?: string;
  onMore?: () => void;
}) {
  const { c, lang } = useLab();
  const t = useJournalT();
  const look = typeLook(c, entry.type);
  const bonus = position > 3;
  const milestone = milestoneAt(position);

  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      260,
      withSequence(
        withTiming(1, { duration: 240 }),
        withTiming(0.25, { duration: 300 }),
        withTiming(1, { duration: 240 }),
        withTiming(0, { duration: 700 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  return (
    <View
      style={[
        styles.entry,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.entryGlow,
          { borderColor: look.fill, backgroundColor: look.soft },
          arriveStyle,
        ]}
      />
      <View style={styles.entryHead}>
        <View
          style={[
            styles.number,
            { backgroundColor: look.soft },
            // Bonus entries wear a gold rim — a shape on top of the type colour.
            bonus && { borderWidth: 1.5, borderColor: c.reward },
          ]}
        >
          <RollingNumber
            text={`${position}`}
            variant="caption"
            style={{ color: look.fg, fontFamily: labFonts.bold }}
          />
        </View>
        <Ionicons
          name={look.icon}
          size={13}
          color={look.fg}
          style={{ marginLeft: labSpace.sm }}
        />
        <LabText
          variant="caption"
          style={{
            color: look.fg,
            fontFamily: labFonts.semibold,
            marginLeft: 4,
          }}
        >
          {entry.type === 'gratitude'
            ? t('journal.input.typeGratitude')
            : t('journal.input.typeSelfPraise')}
        </LabText>
        {bonus && (
          <View style={[styles.bonusTag, { backgroundColor: c.rewardSoft }]}>
            <LabText
              variant="caption"
              tone="reward"
              style={{ fontFamily: labFonts.semibold, fontSize: 10 }}
            >
              {milestone
                ? `${MILESTONE_EMOJI[milestone]} BONUS`
                : t('gratitude.bonus.label')}
            </LabText>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <LabText variant="caption" tone="faint">
          {entry.time}
        </LabText>
        {onMore && (
          <PressableScale
            onPress={onMore}
            haptic={null}
            pressScale={0.85}
            accessibilityLabel={`${t('common.edit')} / ${t('common.delete')}`}
            style={styles.more}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={c.textMuted}
            />
          </PressableScale>
        )}
      </View>
      {dateLabel && (
        <LabText
          variant="overline"
          tone="muted"
          style={{ marginTop: labSpace.sm }}
        >
          {dateLabel}
        </LabText>
      )}
      <LabText variant="body" style={{ marginTop: labSpace.sm }}>
        <Highlighted text={entry.text[lang]} term={term} />
      </LabText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// "⋯" on an entry → Edit / Delete
// ---------------------------------------------------------------------------

export function EntryActionsSheet({
  entry,
  bottomInset,
  onClosed,
  onEdit,
  onDelete,
}: {
  entry: LabEntry;
  bottomInset: number;
  onClosed: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { c, lang, mode } = useLab();
  const t = useJournalT();
  const rows: {
    icon: IoniconName;
    label: string;
    color: string;
    run: () => void;
  }[] = [
    {
      icon: 'create-outline',
      label: t('common.edit'),
      color: c.text,
      run: onEdit,
    },
    {
      icon: 'trash-outline',
      label: t('common.delete'),
      color: dangerColor(mode),
      run: onDelete,
    },
  ];
  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.cancel')}
    >
      {dismiss => (
        <>
          <LabText
            variant="body"
            tone="muted"
            numberOfLines={2}
            italic
            style={{ marginBottom: labSpace.sm }}
          >
            {`“${entry.text[lang]}”`}
          </LabText>
          {rows.map(row => (
            <PressableScale
              key={row.label}
              haptic={null}
              pressScale={0.98}
              accessibilityLabel={row.label}
              onPress={() => {
                selection();
                dismiss(row.run);
              }}
              style={[styles.sheetRow, { borderColor: c.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.color} />
              <LabText
                variant="bodyStrong"
                style={{ marginLeft: labSpace.md, color: row.color }}
              >
                {row.label}
              </LabText>
            </PressableScale>
          ))}
        </>
      )}
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Confirm (delete, start fresh)
// ---------------------------------------------------------------------------

export function ConfirmSheet({
  title,
  message,
  confirm,
  icon,
  bottomInset,
  onClosed,
  onConfirm,
}: {
  title: string;
  message: string;
  confirm: string;
  icon: IoniconName;
  bottomInset: number;
  onClosed: () => void;
  onConfirm: () => void;
}) {
  const { c, mode } = useLab();
  const t = useJournalT();
  const danger = dangerColor(mode);
  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.cancel')}
    >
      {dismiss => (
        <>
          <View
            style={[styles.confirmIcon, { backgroundColor: `${danger}1F` }]}
          >
            <Ionicons name={icon} size={22} color={danger} />
          </View>
          <LabText variant="title" style={{ marginTop: labSpace.md }}>
            {title}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={{ marginTop: labSpace.sm }}
          >
            {message}
          </LabText>
          <View style={styles.confirmRow}>
            <PressableScale
              accessibilityLabel={t('common.cancel')}
              onPress={() => dismiss()}
              style={[styles.pillButton, { backgroundColor: c.track, flex: 1 }]}
            >
              <LabText variant="bodyStrong">{t('common.cancel')}</LabText>
            </PressableScale>
            <PressableScale
              accessibilityLabel={confirm}
              haptic={null}
              onPress={() => {
                impact(ImpactFeedbackStyle.Medium);
                dismiss(onConfirm);
              }}
              style={[styles.pillButton, { backgroundColor: danger, flex: 1 }]}
            >
              <LabText variant="bodyStrong" style={{ color: '#FFFFFF' }}>
                {confirm}
              </LabText>
            </PressableScale>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// The writing sheet — new entry or edit
// ---------------------------------------------------------------------------

const MAX_LENGTH = 200;

export type ComposerMode =
  | { kind: 'new'; type: EntryType }
  | { kind: 'edit'; entry: LabEntry; position: number };

function usePrompts(type: EntryType, lang: LabLang) {
  const t = useJournalT();
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
    // `lang` changes `t`; kept for clarity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, type, lang]);
}

export function EntryComposer({
  mode,
  nextPosition,
  bottomInset,
  onClosed,
  onSave,
}: {
  mode: ComposerMode;
  /** For a new entry: the position it will take today (sets its XP). */
  nextPosition: number;
  bottomInset: number;
  onClosed: () => void;
  onSave: (type: EntryType, text: string, from: Point | undefined) => void;
}) {
  const { c, lang, mode: labMode } = useLab();
  const t = useJournalT();
  const isNew = mode.kind === 'new';
  const [type, setType] = useState<EntryType>(
    mode.kind === 'new' ? mode.type : mode.entry.type
  );
  const [text, setText] = useState(
    mode.kind === 'edit' ? mode.entry.text[lang] : ''
  );
  const [error, setError] = useState<string | null>(null);
  const prompts = usePrompts(type, lang);
  const [promptIndex, setPromptIndex] = useState(() =>
    Math.floor(Math.random() * 1000)
  );
  const prompt = prompts[promptIndex % prompts.length] ?? '';
  const saveRef = useRef<View>(null);
  const look = typeLook(c, type);
  const bonus = isNew && nextPosition > 3;
  const xp = entryXp(nextPosition) + milestoneXp(nextPosition);
  const milestone = milestoneAt(nextPosition);

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

  const remaining = MAX_LENGTH - text.length;

  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      keyboardAware
      label={t('common.cancel')}
    >
      {dismiss => {
        const save = () => {
          const trimmed = text.trim();
          const message = !trimmed
            ? t('journal.input.emptyError')
            : trimmed.length < 3
              ? t('journal.input.minLengthError')
              : null;
          if (message) {
            setError(message);
            notification(NotificationFeedbackType.Warning);
            shake.value = withSequence(
              withTiming(-8, { duration: 50 }),
              withTiming(8, { duration: 60 }),
              withTiming(-5, { duration: 60 }),
              withTiming(0, { duration: 50 })
            );
            return;
          }
          const node = saveRef.current;
          if (!node) {
            dismiss(() => onSave(type, trimmed, undefined));
            return;
          }
          node.measureInWindow((x, y, w, h) => {
            const from = { x: x + w / 2, y: y + h / 2 };
            dismiss(() => onSave(type, trimmed, from));
          });
        };

        return (
          <>
            {/* Type + what this entry earns */}
            <View style={styles.composerTop}>
              {isNew ? (
                <View style={[styles.segment, { backgroundColor: c.track }]}>
                  {(['gratitude', 'self-praise'] as EntryType[]).map(kind => {
                    const on = kind === type;
                    const l = typeLook(c, kind);
                    return (
                      <PressableScale
                        key={kind}
                        pressScale={0.95}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={
                          kind === 'gratitude'
                            ? t('journal.input.typeGratitude')
                            : t('journal.input.typeSelfPraise')
                        }
                        onPress={() => {
                          if (on) return;
                          setType(kind);
                          nextPrompt();
                        }}
                        style={[
                          styles.segmentItem,
                          on && { backgroundColor: c.surface },
                        ]}
                      >
                        <Ionicons
                          name={l.icon}
                          size={14}
                          color={on ? l.fg : c.textMuted}
                        />
                        <LabText
                          variant="caption"
                          style={{
                            marginLeft: 6,
                            fontFamily: labFonts.semibold,
                            color: on ? l.fg : c.textMuted,
                          }}
                        >
                          {kind === 'gratitude'
                            ? t('journal.input.typeGratitude')
                            : t('journal.input.typeSelfPraise')}
                        </LabText>
                      </PressableScale>
                    );
                  })}
                </View>
              ) : (
                <LabText variant="titleSm">{t('gratitude.edit.title')}</LabText>
              )}
              <View style={{ flex: 1 }} />
              {isNew && xp > 0 && (
                <View
                  style={[styles.xpChip, { backgroundColor: c.rewardSoft }]}
                >
                  <Ionicons name="sparkles" size={12} color={c.rewardText} />
                  <LabText
                    variant="caption"
                    tone="reward"
                    style={{ marginLeft: 4, fontFamily: labFonts.semibold }}
                  >
                    {`+${xp} XP${milestone ? ` ${MILESTONE_EMOJI[milestone]}` : ''}`}
                  </LabText>
                </View>
              )}
            </View>

            {/* The prompt — a question in the guide's own voice */}
            {isNew && (
              <View style={styles.promptRow}>
                <Animated.View style={[{ flex: 1 }, promptStyle]}>
                  <LabText variant="title" italic>
                    {prompt}
                  </LabText>
                  {bonus && (
                    <LabText
                      variant="caption"
                      tone="faint"
                      style={{ marginTop: 2 }}
                    >
                      {`${t('journal.bonusGratitude')} ${t('journal.input.optional')}`}
                    </LabText>
                  )}
                </Animated.View>
                <PressableScale
                  onPress={nextPrompt}
                  pressScale={0.88}
                  accessibilityLabel={MOCK_COPY[lang].journal.anotherPrompt}
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
                maxLength={MAX_LENGTH}
                placeholder={isNew ? '' : t('journal.editPlaceholder')}
                placeholderTextColor={c.textFaint}
                selectionColor={look.fill}
                cursorColor={look.fill}
                style={[
                  typeStyle('body', c.text),
                  styles.input,
                  {
                    backgroundColor: c.canvas,
                    borderColor: error ? dangerColor(labMode) : look.soft,
                  },
                ]}
              />
            </Animated.View>
            {error && (
              <Animated.View entering={FadeIn.duration(160)}>
                <LabText
                  variant="caption"
                  style={{
                    color: dangerColor(labMode),
                    marginTop: labSpace.sm,
                  }}
                >
                  {error}
                </LabText>
              </Animated.View>
            )}

            <View style={styles.composerFoot}>
              <LabText
                variant="caption"
                tone={remaining <= 20 ? 'flame' : 'faint'}
              >
                {`${text.length}/${MAX_LENGTH}`}
              </LabText>
              <View style={{ flex: 1 }} />
              <PressableScale
                onPress={() => dismiss()}
                accessibilityLabel={t('common.cancel')}
                style={styles.textButton}
              >
                <LabText variant="bodyStrong" tone="muted">
                  {t('common.cancel')}
                </LabText>
              </PressableScale>
              <View ref={saveRef} collapsable={false}>
                <PressableScale
                  onPress={save}
                  haptic={null}
                  accessibilityLabel={
                    isNew ? t('common.add') : t('common.save')
                  }
                  style={styles.saveButton}
                >
                  <LinearGradient
                    colors={
                      type === 'gratitude'
                        ? c.primaryGradient
                        : ([c.success, c.success] as const)
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: labRadius.pill },
                    ]}
                  />
                  <LabText variant="bodyStrong" tone="onPrimary">
                    {isNew ? t('common.add') : t('common.save')}
                  </LabText>
                </PressableScale>
              </View>
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Simulated rewarded ad (the warm-up) — lab only
// ---------------------------------------------------------------------------

const AD_MS = 1600;

export function AdSimulation({ onDone }: { onDone: () => void }) {
  const { c, lang } = useLab();
  const p = useSharedValue(0);
  // The latest callback, without restarting the "ad" when the parent re-renders.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const finish = () => done.current();
    p.value = withTiming(
      1,
      { duration: AD_MS, easing: Easing.linear },
      finished => {
        if (finished) scheduleOnRN(finish);
      }
    );
  }, [p]);
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: p.value }],
  }));
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      style={[StyleSheet.absoluteFill, styles.ad]}
    >
      <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.85)" />
      <LabText
        variant="bodyStrong"
        style={{ color: '#FFFFFF', marginTop: labSpace.md }}
      >
        {MOCK_COPY[lang].journal.adPlaying}
      </LabText>
      <View style={styles.adTrack}>
        <Animated.View
          style={[styles.adFill, { backgroundColor: c.reward }, barStyle]}
        />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// ⭐ 🔥 👑 — a bonus milestone of the day (4th, 8th, 13th entry)
// ---------------------------------------------------------------------------

const RAYS = 12;

export function MilestoneMoment({
  kind,
  xp,
  onClosed,
}: {
  kind: MilestoneKind;
  xp: number;
  onClosed: () => void;
}) {
  const { c } = useLab();
  const t = useJournalT();
  const award = useLabXpAward();
  const buttonRef = useRef<View>(null);
  const n = kind === 'star' ? 1 : kind === 'flame' ? 5 : 10;
  const p = useSharedValue(0);
  const burst = useSharedValue(0);
  const leaving = useRef(false);

  useEffect(() => {
    notification(NotificationFeedbackType.Success);
    p.value = withSpring(1, { damping: 16, stiffness: 180, mass: 0.9 });
    burst.value = withDelay(
      180,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, [p, burst]);

  const close = () => {
    if (leaving.current) return;
    leaving.current = true;
    const node = buttonRef.current;
    const fly = (from?: Point) => {
      award(xp, from);
      p.value = withTiming(0, { duration: 240 }, finished => {
        if (finished) scheduleOnRN(onClosed);
      });
    };
    if (!node) fly();
    else
      node.measureInWindow((x, y, w, h) => fly({ x: x + w / 2, y: y + h / 2 }));
  };

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
  const medalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.3 + 0.7 * Math.min(1.08, burst.value * 1.15) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - burst.value,
    transform: [{ scale: 0.8 + 1.1 * burst.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000' },
          scrimStyle,
        ]}
      />
      <View style={styles.momentCenter} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.momentCard,
            { backgroundColor: c.surface, borderColor: c.border },
            cardStyle,
          ]}
        >
          <View style={styles.medalBox}>
            {Array.from({ length: RAYS }, (_, i) => (
              <Ray key={i} angle={(360 / RAYS) * i} progress={burst} />
            ))}
            <Animated.View
              style={[styles.medalRing, { borderColor: c.reward }, ringStyle]}
            />
            <Animated.View style={medalStyle}>
              <LinearGradient
                colors={[c.rewardSoft, c.reward]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.medal}
              >
                <Text style={styles.medalEmoji}>{MILESTONE_EMOJI[kind]}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
          <LabText
            variant="title"
            style={{ textAlign: 'center', marginTop: labSpace.lg }}
          >
            {t(`journal.bonusMilestone${n}_title`)}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={{ textAlign: 'center', marginTop: labSpace.sm }}
          >
            {t(`journal.bonusMilestone${n}_text`)}
          </LabText>
          <View
            style={[
              styles.xpChip,
              {
                backgroundColor: c.rewardSoft,
                alignSelf: 'center',
                marginTop: labSpace.lg,
              },
            ]}
          >
            <Ionicons name="sparkles" size={14} color={c.rewardText} />
            <LabText
              variant="bodyStrong"
              tone="reward"
              style={{ marginLeft: 6 }}
            >
              {`+${xp} XP`}
            </LabText>
          </View>
          <View ref={buttonRef} collapsable={false}>
            <PressableScale
              onPress={close}
              haptic={null}
              accessibilityLabel={t('achievements.celebration.continue_button')}
              style={[styles.saveButton, styles.momentButton]}
            >
              <LinearGradient
                colors={c.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: labRadius.pill },
                ]}
              />
              <LabText variant="bodyStrong" tone="onPrimary">
                {t('achievements.celebration.continue_button')}
              </LabText>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function Ray({
  angle,
  progress,
}: {
  angle: number;
  progress: SharedValue<number>;
}) {
  const { c } = useLab();
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.15 ? progress.value * 6 : 1 - progress.value,
    transform: [
      { rotate: `${angle}deg` },
      { translateY: -40 - 34 * progress.value },
      { scaleY: 0.4 + 0.6 * (1 - progress.value) },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ray, { backgroundColor: c.reward }, style]}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    boxShadow: '-8px 0px 24px rgba(0, 0, 0, 0.12)',
  },
  topBar: {
    height: 48,
    marginTop: labSpace.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: labSpace.md,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: labSpace.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: labSpace.lg,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  entry: {
    padding: labSpace.lg,
    paddingTop: labSpace.md,
    borderRadius: labRadius.md + 4,
    borderWidth: 1,
  },
  entryGlow: {
    borderRadius: labRadius.md + 3,
    borderWidth: 2,
  },
  entryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusTag: {
    marginLeft: labSpace.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: labRadius.pill,
  },
  more: {
    width: 36,
    height: 36,
    marginRight: -labSpace.sm,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.xl,
  },
  pillButton: {
    height: 50,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: labRadius.pill,
    padding: 3,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: 5,
    borderRadius: labRadius.pill,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: labSpace.lg,
  },
  input: {
    marginTop: labSpace.md,
    minHeight: 104,
    maxHeight: 180,
    borderRadius: labRadius.md,
    borderWidth: 1.5,
    padding: labSpace.md,
    paddingTop: labSpace.md,
    textAlignVertical: 'top',
  },
  composerFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.md,
  },
  textButton: {
    paddingHorizontal: labSpace.md,
    height: 46,
    justifyContent: 'center',
    marginRight: labSpace.xs,
  },
  saveButton: {
    height: 46,
    paddingHorizontal: labSpace.xxl,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ad: {
    backgroundColor: 'rgba(5, 6, 12, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adTrack: {
    width: 200,
    height: 4,
    borderRadius: 2,
    marginTop: labSpace.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  adFill: {
    height: 4,
    width: 200,
    transformOrigin: 'left',
  },
  momentCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: labSpace.xl,
  },
  momentCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: labSpace.xxl,
    paddingTop: labSpace.xxxl,
  },
  medalBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEmoji: {
    fontSize: 46,
    lineHeight: 56,
  },
  medalRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
  },
  ray: {
    position: 'absolute',
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  momentButton: {
    marginTop: labSpace.xl,
    alignSelf: 'stretch',
  },
});
