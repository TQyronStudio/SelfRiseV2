/**
 * Shared pieces of the Goals concept (kolo 22): the goal card with its progress
 * track, the pace chip, the log sheet with its own number pad, the undo toast,
 * the "⋯" sheet and the completion moment.
 *
 * What changes against today's app (proposals, plan R-16 – R-19):
 * - LOGGING IN ONE TAP. A count goal carries its usual amounts on the card
 *   (+1 book, +50 $, +1 h): tap = logged, the number rolls, XP flies from the
 *   button, and an Undo toast replaces the confirm dialog. "Other" opens the sheet.
 *   Today: card → modal → type (Add / Subtract / Set) → keyboard → note → save.
 * - A measure goal (weight) logs TODAY'S READING; the app works out the progress.
 * - THE TRACK TELLS THE STORY: 25 / 50 / 75 % notches light up when their XP is
 *   paid (today they pay silently), and a tick shows where the plan is today.
 * - PACE IN WORDS on every card: on pace / 6 days ahead / 10 days behind —
 *   today it hides in a stats tab with five prediction methods.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Logging goes through useGoalsData → SQLiteGoalStorage.addProgress (it pays
 *   the XP, the milestones and the completion). Keep the 3-XP-logs-a-day rule.
 * - Undo = deleting the progress entry (existing delete path, XP reversal included).
 * - Measure goals need a data change (start value + direction) → R-16 first.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  StyleSheet,
  Text,
  TextInput,
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
  selection,
} from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  Chip,
  IconBadge,
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { useLabCover } from './labCover';
import { labFonts, LabPalette, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { RollingNumber } from './RollingNumber';
import { useLabXpAward } from './xpFlight';
import {
  CATEGORY_LOOK,
  completionXp,
  currentValue,
  fmt,
  fractionOf,
  groupTyped,
  LabGoal,
  MAX_GOAL_VALUE,
  MILESTONES,
  stepFor,
  Pace,
  paceOf,
  useLabGoals,
} from './goalsMock';
import { BottomSheet, dangerColor, Point, useJournalT } from './journalParts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function goalColor(c: LabPalette, goal: LabGoal): string {
  return c.habit[CATEGORY_LOOK[goal.category].color];
}

export function shortDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Pace chip — kind words, a shape for each state
// ---------------------------------------------------------------------------

export function PaceChip({ pace }: { pace: Pace }) {
  const { lang } = useLab();
  const g = MOCK_COPY[lang].goals;
  const t = useJournalT();
  switch (pace.state) {
    case 'ahead':
      return (
        <Chip tone="success" icon="trending-up" label={g.ahead(pace.days)} />
      );
    case 'behind':
      return (
        <Chip tone="flame" icon="time-outline" label={g.behind(-pace.days)} />
      );
    case 'onPace':
      return <Chip tone="primary" icon="checkmark-circle" label={g.onPace} />;
    case 'done':
      return (
        <Chip
          tone="reward"
          icon="trophy"
          label={t('goals.completion.statusCompleted')}
        />
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Progress track: fill, milestone notches, today's plan tick
// ---------------------------------------------------------------------------

export function GoalTrack({
  goal,
  pace,
  trackRef,
  height = 12,
}: {
  goal: LabGoal;
  pace: Pace;
  trackRef?: React.RefObject<View | null>;
  height?: number;
}) {
  const { c } = useLab();
  const color = goalColor(c, goal);
  const fraction = Math.min(1, fractionOf(goal));
  // Native driver (kolo 27): a log fills this while React commits and sparks fly.
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    if (trackWidth === 0) return;
    RNAnimated.timing(fill, {
      toValue: fraction,
      duration: 700,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fraction, fill, trackWidth]);
  const translateX = useMemo(
    () =>
      fill.interpolate({ inputRange: [0, 1], outputRange: [-trackWidth, 0] }),
    [fill, trackWidth]
  );

  return (
    <View style={{ height: height + 14, justifyContent: 'center' }}>
      <View
        ref={trackRef}
        collapsable={false}
        style={[
          styles.track,
          { height, borderRadius: height / 2, backgroundColor: c.track },
        ]}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {trackWidth > 0 && (
          <RNAnimated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: color,
                borderRadius: height / 2,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
      </View>
      {/* Milestone notches — a ring until reached, then filled */}
      {MILESTONES.map(m => {
        const reached = goal.paid.includes(m) || fraction * 100 >= m;
        return <Notch key={m} percent={m} reached={reached} color={color} />;
      })}
      {/* Where the plan is today */}
      {pace.expected !== null && pace.state !== 'done' && (
        <View
          pointerEvents="none"
          style={[
            styles.planTick,
            {
              left: `${pace.expected * 100}%`,
              backgroundColor: c.text,
              height: height + 12,
            },
          ]}
        />
      )}
    </View>
  );
}

function Notch({
  percent,
  reached,
  color,
}: {
  percent: number;
  reached: boolean;
  color: string;
}) {
  const { c } = useLab();
  const pop = useRef(new RNAnimated.Value(1)).current;
  const was = useRef(reached);
  useEffect(() => {
    if (reached && !was.current) {
      RNAnimated.sequence([
        RNAnimated.spring(pop, {
          toValue: 1.8,
          damping: 6,
          stiffness: 300,
          useNativeDriver: true,
        }),
        RNAnimated.spring(pop, {
          toValue: 1,
          damping: 10,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    was.current = reached;
  }, [reached, pop]);
  return (
    <RNAnimated.View
      pointerEvents="none"
      style={[
        styles.notch,
        {
          left: `${percent}%`,
          backgroundColor: reached ? c.surface : c.track,
          borderColor: c.surface,
          transform: [{ scale: pop }],
        },
      ]}
    >
      <View
        style={[
          styles.notchDot,
          { backgroundColor: reached ? color : c.textFaint },
        ]}
      />
    </RNAnimated.View>
  );
}

// ---------------------------------------------------------------------------
// Goal card
// ---------------------------------------------------------------------------

export function GoalCard({
  goal,
  fresh = false,
  onOpen,
  onMore,
  onQuick,
  onOther,
  trackRef,
  today,
}: {
  goal: LabGoal;
  fresh?: boolean;
  onOpen: () => void;
  onMore: () => void;
  /** One-tap log of a usual amount; `from` = where the tap happened. */
  onQuick: (amount: number, from: Point | undefined) => void;
  /** The log sheet (other amount, or a reading). */
  onOther: () => void;
  trackRef?: React.RefObject<View | null>;
  today: Date;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  // `today` comes as a prop: reading the goals context here would re-render
  // every card on every log (the memo in GoalsConcept would not help).
  const color = goalColor(c, goal);
  const pace = paceOf(goal, today);
  const value = currentValue(goal);
  const unit = goal.unit[lang];
  const percent = Math.round(fractionOf(goal) * 100);
  const done = pace.state === 'done';

  const arrive = useSharedValue(0);
  useEffect(() => {
    if (!fresh) return;
    arrive.value = withDelay(
      380,
      withSequence(
        withTiming(1, { duration: 260 }),
        withTiming(0.2, { duration: 320 }),
        withTiming(1, { duration: 260 }),
        withTiming(0, { duration: 700 })
      )
    );
  }, [fresh, arrive]);
  const arriveStyle = useAnimatedStyle(() => ({ opacity: arrive.value }));

  const meta = [
    t(`goals.category.${goal.category}`),
    goal.targetDate
      ? g.by(shortDate(goal.targetDate, copy.locale))
      : g.noDeadline,
  ].join(' · ');

  return (
    <PressableScale
      pressScale={0.985}
      haptic={null}
      pressDelay={110}
      onPress={onOpen}
      accessibilityLabel={goal.title[lang]}
    >
      <Surface style={styles.card}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.cardGlow,
            { borderColor: color, backgroundColor: `${color}1F` },
            arriveStyle,
          ]}
        />
        <View style={styles.cardHead}>
          <IconBadge icon={goal.icon as IoniconName} color={color} size={42} />
          <View style={{ flex: 1, marginLeft: labSpace.md }}>
            <LabText variant="bodyStrong" numberOfLines={2}>
              {goal.title[lang]}
            </LabText>
            <LabText variant="caption" tone="muted" numberOfLines={1}>
              {meta}
            </LabText>
          </View>
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
        </View>

        <View style={styles.valueRow}>
          <RollingNumber
            text={fmt(value, copy.locale)}
            variant="number"
            rollIn={false}
            style={{ fontSize: 30, lineHeight: 36 }}
          />
          <LabText
            variant="label"
            tone="muted"
            style={{ marginLeft: 6, marginBottom: 5, flexShrink: 1 }}
            numberOfLines={1}
          >
            {goal.kind === 'measure'
              ? `${unit} → ${fmt(goal.target, copy.locale)} ${unit}`
              : `/ ${fmt(goal.target, copy.locale)} ${unit}`}
          </LabText>
          <View style={{ flex: 1 }} />
          <RollingNumber
            text={`${percent} %`}
            variant="label"
            tone="muted"
            rollIn={false}
            style={{ fontFamily: labFonts.semibold }}
          />
        </View>

        <GoalTrack
          goal={goal}
          pace={pace}
          {...(trackRef ? { trackRef } : null)}
        />

        <View style={styles.paceRow}>
          <PaceChip pace={pace} />
          {pace.state !== 'done' && pace.daysLeft !== null && (
            <LabText
              variant="caption"
              tone="muted"
              style={{ marginLeft: labSpace.sm }}
            >
              {g.daysLeft(pace.daysLeft)}
            </LabText>
          )}
          {pace.state === 'none' && (
            <LabText variant="caption" tone="faint">
              {g.noDeadline}
            </LabText>
          )}
        </View>

        {!done && (
          <View style={styles.quickRow}>
            {goal.kind === 'count' ? (
              <>
                {goal.quick.map(amount => (
                  <QuickButton
                    key={amount}
                    label={`+${fmt(amount, copy.locale)}${amount === 1 && goal.quick.length === 1 ? ` ${unit}` : ''}`}
                    color={color}
                    onPress={from => onQuick(amount, from)}
                  />
                ))}
                <QuickButton
                  label={g.otherAmount}
                  icon="keypad-outline"
                  color={c.textMuted}
                  quiet
                  onPress={() => onOther()}
                />
              </>
            ) : (
              <QuickButton
                label={g.logReading}
                icon="create-outline"
                color={color}
                wide
                onPress={() => onOther()}
              />
            )}
          </View>
        )}
      </Surface>
    </PressableScale>
  );
}

function QuickButton({
  label,
  icon,
  color,
  quiet = false,
  wide = false,
  onPress,
}: {
  label: string;
  icon?: IoniconName;
  color: string;
  quiet?: boolean;
  wide?: boolean;
  onPress: (from: Point | undefined) => void;
}) {
  const { c } = useLab();
  const ref = useRef<View>(null);
  return (
    <View ref={ref} collapsable={false} style={wide ? { flex: 1 } : null}>
      <PressableScale
        haptic={null}
        pressScale={0.92}
        accessibilityLabel={label}
        onPress={() => {
          impact(ImpactFeedbackStyle.Light);
          const node = ref.current;
          if (!node) return onPress(undefined);
          node.measureInWindow((x, y, w, h) =>
            onPress({ x: x + w / 2, y: y + h / 2 })
          );
        }}
        style={[
          styles.quick,
          {
            backgroundColor: quiet ? c.track : `${color}1F`,
            borderColor: quiet ? 'transparent' : `${color}55`,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={15}
            color={quiet ? c.textMuted : c.text}
            style={{ marginRight: 6 }}
          />
        )}
        <LabText
          variant="label"
          style={{ fontFamily: labFonts.semibold, color: c.text }}
          numberOfLines={1}
        >
          {label}
        </LabText>
      </PressableScale>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Log sheet — own number pad, no system keyboard for the number
// ---------------------------------------------------------------------------

type LogMode = 'add' | 'subtract' | 'set';

export function LogSheet({
  goal,
  bottomInset,
  onClosed,
  onSave,
}: {
  goal: LabGoal;
  bottomInset: number;
  onClosed: () => void;
  /** The value to store: COUNT = the delta, MEASURE = the reading. */
  onSave: (value: number, note: string, from: Point | undefined) => void;
}) {
  const { c, lang, mode: labMode } = useLab();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  const color = goalColor(c, goal);
  const unit = goal.unit[lang];
  const value = currentValue(goal);
  const measure = goal.kind === 'measure';
  const [mode, setMode] = useState<LogMode>('add');
  const [text, setText] = useState(measure ? String(value) : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saveRef = useRef<View>(null);
  const amount = Number(text.replace(',', '.')) || 0;
  const step = stepFor(goal);

  const after = measure
    ? amount
    : mode === 'add'
      ? value + amount
      : mode === 'subtract'
        ? Math.max(0, value - amount)
        : amount;
  const delta = measure ? amount : after - value;
  const percentAfter = Math.round(fractionOf(goal, after) * 100);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const press = (key: string) => {
    selection();
    setError(null);
    setText(prev => {
      if (key === '⌫') return prev.slice(0, -1);
      if (key === '.') return prev.includes('.') ? prev : (prev || '0') + '.';
      if (prev.replace('.', '').length >= 13) return prev;
      return prev === '0' ? key : prev + key;
    });
  };
  const nudge = (step: number) => {
    selection();
    setError(null);
    setText(prev => {
      const next = Math.max(0, (Number(prev) || 0) + step);
      return String(Math.round(next * 10) / 10);
    });
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
          // A reading may be 0 (the debt is paid); an amount to add may not.
          const message = (measure ? text.trim() === '' : amount <= 0)
            ? t('goals.progress.form.errors.valueRequired')
            : amount > MAX_GOAL_VALUE
              ? g.tooLarge
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
          const stored = measure ? amount : delta;
          const node = saveRef.current;
          if (!node)
            return dismiss(() => onSave(stored, note.trim(), undefined));
          node.measureInWindow((x, y, w, h) => {
            const from = { x: x + w / 2, y: y + h / 2 };
            dismiss(() => onSave(stored, note.trim(), from));
          });
        };

        return (
          <>
            <View style={styles.sheetHead}>
              <IconBadge
                icon={goal.icon as IoniconName}
                color={color}
                size={36}
              />
              <LabText
                variant="titleSm"
                numberOfLines={1}
                style={{ marginLeft: labSpace.md, flex: 1 }}
              >
                {goal.title[lang]}
              </LabText>
            </View>

            {!measure && (
              <View style={[styles.segment, { backgroundColor: c.track }]}>
                {(['add', 'subtract', 'set'] as LogMode[]).map(m => {
                  const on = m === mode;
                  return (
                    <PressableScale
                      key={m}
                      pressScale={0.95}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={t(`goals.progress.form.types.${m}`)}
                      onPress={() => setMode(m)}
                      style={[
                        styles.segmentItem,
                        on && { backgroundColor: c.surface },
                      ]}
                    >
                      <LabText
                        variant="caption"
                        style={{
                          fontFamily: labFonts.semibold,
                          color: on ? c.text : c.textMuted,
                        }}
                      >
                        {t(`goals.progress.form.types.${m}`)}
                      </LabText>
                    </PressableScale>
                  );
                })}
              </View>
            )}

            {/* The number */}
            <Animated.View style={[styles.display, shakeStyle]}>
              {measure && (
                <PressableScale
                  onPress={() => nudge(-step)}
                  haptic={null}
                  pressScale={0.88}
                  accessibilityLabel={`−${fmt(step, copy.locale)}`}
                  style={[styles.nudge, { backgroundColor: c.track }]}
                >
                  <LabText
                    variant="caption"
                    style={{ fontFamily: labFonts.bold }}
                  >
                    {`−${fmt(step, copy.locale)}`}
                  </LabText>
                </PressableScale>
              )}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <LabText variant="overline" tone="muted">
                  {measure ? g.reading : t(`goals.progress.form.types.${mode}`)}
                </LabText>
                <Text
                  style={[
                    typeStyle('display', text ? c.text : c.textFaint),
                    styles.bigNumber,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {`${mode === 'subtract' && !measure ? '−' : mode === 'add' && !measure ? '+' : ''}${groupTyped(text, copy.locale) || '0'}`}
                  <Text
                    style={typeStyle('title', c.textMuted)}
                  >{` ${unit}`}</Text>
                </Text>
                <LabText variant="caption" tone="muted">
                  {`${fmt(value, copy.locale)} → ${fmt(after, copy.locale)} ${unit} · ${percentAfter} %`}
                </LabText>
              </View>
              {measure && (
                <PressableScale
                  onPress={() => nudge(step)}
                  haptic={null}
                  pressScale={0.88}
                  accessibilityLabel={`+${fmt(step, copy.locale)}`}
                  style={[styles.nudge, { backgroundColor: c.track }]}
                >
                  <LabText
                    variant="caption"
                    style={{ fontFamily: labFonts.bold }}
                  >
                    {`+${fmt(step, copy.locale)}`}
                  </LabText>
                </PressableScale>
              )}
            </Animated.View>
            {error && (
              <LabText
                variant="caption"
                style={{ color: dangerColor(labMode), textAlign: 'center' }}
              >
                {error}
              </LabText>
            )}

            {/* Quick amounts */}
            {!measure && goal.quick.length > 0 && (
              <View style={styles.quickAmounts}>
                {goal.quick.map(q => (
                  <PressableScale
                    key={q}
                    pressScale={0.92}
                    accessibilityLabel={`${q}`}
                    onPress={() => setText(String(q))}
                    style={[
                      styles.amountChip,
                      { backgroundColor: `${color}1F` },
                    ]}
                  >
                    <LabText
                      variant="label"
                      style={{ fontFamily: labFonts.semibold }}
                    >
                      {fmt(q, copy.locale)}
                    </LabText>
                  </PressableScale>
                ))}
              </View>
            )}

            <NumberPad onPress={press} />

            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={200}
              placeholder={t('goals.progress.form.placeholders.note')}
              placeholderTextColor={c.textFaint}
              style={[
                typeStyle('body', c.text),
                styles.note,
                { backgroundColor: c.canvas, borderColor: c.border },
              ]}
            />

            <View ref={saveRef} collapsable={false}>
              <PressableScale
                onPress={save}
                haptic={null}
                accessibilityLabel={t('goals.progress.form.submit')}
                style={styles.saveButton}
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
                  {t('goals.progress.form.submit')}
                </LabText>
              </PressableScale>
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

function NumberPad({ onPress }: { onPress: (key: string) => void }) {
  const { c } = useLab();
  return (
    <View style={styles.pad}>
      {PAD.map(key => (
        <PressableScale
          key={key}
          haptic={null}
          pressScale={0.9}
          accessibilityLabel={key === '⌫' ? 'Delete' : key}
          onPress={() => onPress(key)}
          style={[styles.padKey, { backgroundColor: c.track }]}
        >
          {key === '⌫' ? (
            <Ionicons name="backspace-outline" size={20} color={c.text} />
          ) : (
            <LabText variant="title">{key}</LabText>
          )}
        </PressableScale>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Undo toast — sits above the banner, leaves after a few seconds
// ---------------------------------------------------------------------------

export function UndoToast({
  message,
  bottomInset,
  onUndo,
  onGone,
}: {
  message: string;
  bottomInset: number;
  /** Null for a message without undo (e.g. a milestone). */
  onUndo: (() => void) | null;
  onGone: () => void;
}) {
  const { c, lang } = useLab();
  const gone = useRef(onGone);
  gone.current = onGone;
  // Native driver, not a layout animation (kolo 27): it arrives in the same second
  // as the fill, the roll and the sparks.
  const p = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.spring(p, {
      toValue: 1,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
    const id = setTimeout(() => {
      RNAnimated.timing(p, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => gone.current());
    }, 4200);
    return () => clearTimeout(id);
  }, [message, p]);
  const translateY = useMemo(
    () => p.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
    [p]
  );
  return (
    <RNAnimated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrap,
        {
          bottom: bottomInset + labSpace.md,
          opacity: p,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[contentColumn, styles.toastColumn]}
        pointerEvents="box-none"
      >
        <View style={[styles.toast, { backgroundColor: c.text }]}>
          <LabText
            variant="label"
            style={{ color: c.canvas, flex: 1 }}
            numberOfLines={2}
          >
            {message}
          </LabText>
          {onUndo && (
            <PressableScale
              onPress={onUndo}
              accessibilityLabel={MOCK_COPY[lang].goals.undo}
              style={styles.undo}
            >
              <LabText
                variant="label"
                style={{ color: c.canvas, fontFamily: labFonts.bold }}
              >
                {MOCK_COPY[lang].goals.undo}
              </LabText>
            </PressableScale>
          )}
        </View>
      </View>
    </RNAnimated.View>
  );
}

// ---------------------------------------------------------------------------
// "⋯" on a goal
// ---------------------------------------------------------------------------

export function GoalActionsSheet({
  goal,
  bottomInset,
  onClosed,
  onDetail,
  onEdit,
  onDelete,
}: {
  goal: LabGoal;
  bottomInset: number;
  onClosed: () => void;
  onDetail: () => void;
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
      icon: 'stats-chart-outline',
      label: t('goals.stats.overview'),
      color: c.primary,
      run: onDetail,
    },
    {
      icon: 'create-outline',
      label: t('goals.editGoal'),
      color: c.text,
      run: onEdit,
    },
    {
      icon: 'trash-outline',
      label: t('goals.deleteGoal'),
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
          <LabText variant="titleSm" style={{ marginBottom: labSpace.sm }}>
            {goal.title[lang]}
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
// The goal is reached — one modal, XP after "Continue"
// ---------------------------------------------------------------------------

export function GoalDoneMoment({
  goal,
  onClosed,
}: {
  goal: LabGoal;
  onClosed: () => void;
}) {
  const { c, lang } = useLab();
  useLabCover();
  const copy = MOCK_COPY[lang];
  const t = useJournalT();
  const award = useLabXpAward();
  const { today } = useLabGoals();
  const color = goalColor(c, goal);
  const xp = completionXp(goal);
  const buttonRef = useRef<View>(null);
  const leaving = useRef(false);
  const p = useSharedValue(0);
  const ring = useSharedValue(0);
  const days = Math.max(
    1,
    Math.round((today.getTime() - goal.startDate.getTime()) / 86400000)
  );
  const message = useMemo(
    () => t(`goals.completion.message${1 + (goal.id.length % 5)}`),
    [t, goal.id]
  );

  useEffect(() => {
    notification(NotificationFeedbackType.Success);
    p.value = withSpring(1, { damping: 16, stiffness: 170, mass: 0.9 });
    ring.value = withDelay(
      200,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
  }, [p, ring]);

  const close = () => {
    if (leaving.current) return;
    leaving.current = true;
    const fly = (from?: Point) => {
      award(xp, from);
      p.value = withTiming(0, { duration: 240 }, finished => {
        if (finished) scheduleOnRN(onClosed);
      });
    };
    const node = buttonRef.current;
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
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 0.9 + 1.2 * ring.value }],
  }));
  const medalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + 0.6 * Math.min(1, ring.value * 1.6) }],
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
            <Animated.View
              style={[styles.medalRing, { borderColor: color }, ringStyle]}
            />
            <Animated.View style={medalStyle}>
              <LinearGradient
                colors={[`${color}33`, color]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.medal}
              >
                <Ionicons
                  name={goal.icon as IoniconName}
                  size={42}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Animated.View>
          </View>
          <LabText
            variant="overline"
            tone="reward"
            style={{ textAlign: 'center', marginTop: labSpace.lg }}
          >
            {t('goals.completion.title')}
          </LabText>
          <LabText
            variant="title"
            style={{ textAlign: 'center', marginTop: labSpace.xs }}
          >
            {goal.title[lang]}
          </LabText>
          <LabText
            variant="body"
            tone="muted"
            style={{ textAlign: 'center', marginTop: labSpace.sm }}
          >
            {message}
          </LabText>
          <LabText
            variant="caption"
            tone="faint"
            style={{ textAlign: 'center', marginTop: labSpace.xs }}
          >
            {`${fmt(goal.target, copy.locale)} ${goal.unit[lang]} · ${copy.goals.doneIn(days)}`}
          </LabText>
          <View style={[styles.bonus, { backgroundColor: c.rewardSoft }]}>
            <Ionicons name="sparkles" size={14} color={c.rewardText} />
            <LabText
              variant="bodyStrong"
              tone="reward"
              style={{ marginLeft: 6 }}
            >
              {`${t('goals.completion.bonus')} +${xp} XP`}
            </LabText>
          </View>
          <View ref={buttonRef} collapsable={false}>
            <PressableScale
              onPress={close}
              haptic={null}
              accessibilityLabel={t('goals.completion.continue')}
              style={[styles.saveButton, { marginTop: labSpace.xl }]}
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
                {t('goals.completion.continue')}
              </LabText>
            </PressableScale>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: labSpace.lg,
    borderRadius: labRadius.md + 6,
  },
  cardGlow: {
    borderRadius: labRadius.md + 5,
    borderWidth: 2,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  more: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -labSpace.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: labSpace.md,
  },
  track: {
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planTick: {
    position: 'absolute',
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
  },
  paceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: labSpace.lg,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: labRadius.pill,
    padding: 3,
    marginTop: labSpace.lg,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: labRadius.pill,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.lg,
  },
  bigNumber: {
    fontSize: 44,
    lineHeight: 52,
  },
  nudge: {
    minWidth: 52,
    height: 48,
    paddingHorizontal: labSpace.sm,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  amountChip: {
    paddingHorizontal: labSpace.lg,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: labSpace.sm,
    marginTop: labSpace.md,
  },
  padKey: {
    width: '31.5%',
    height: 46,
    borderRadius: labRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    marginTop: labSpace.md,
    height: 44,
    borderRadius: labRadius.sm,
    borderWidth: 1,
    paddingHorizontal: labSpace.md,
    paddingVertical: 0,
  },
  saveButton: {
    height: 50,
    marginTop: labSpace.md,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  toastColumn: {
    paddingHorizontal: labSpace.xl,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: labRadius.md,
    paddingLeft: labSpace.lg,
    paddingRight: labSpace.xs,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.25)',
  },
  undo: {
    paddingHorizontal: labSpace.md,
    height: 44,
    justifyContent: 'center',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
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
  bonus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
});
