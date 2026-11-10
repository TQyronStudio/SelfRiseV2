/**
 * New / edit goal (kolo 22) — one sheet with a live preview, like the habit
 * composer (Petr: "nemám co vytknout").
 *
 * Against today's GoalForm + TargetDateStepSelectionModal + GoalTemplatesModal:
 * - Ideas = the app's own templates (goalTemplates.ts), inside the sheet (R-19).
 * - KIND: "Count up" (books, money, hours) or "Measure" (a reading from now to a
 *   target, either direction — weight 84.6 → 78 kg) (R-16).
 * - DEADLINE in one tap: 1 / 3 / 6 months, end of year, no deadline — or "Pick a
 *   date" opens a month calendar right here (past days off). Today: a modal with
 *   three steps, year → month → day (R-18; technical-guides:Goals.md describes
 *   that modal, so the guide changes with it).
 * - The sheet says what the deadline MEANS: "That's about 0.5 books a week".
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Validation and texts stay GoalForm's (title 2–100, unit 1–20, target > 0 and
 *   ≤ MAX_GOAL_VALUE, description ≤ 300) — share, do not copy.
 * - Templates via useGoalTemplates() (it localises units); the list below only
 *   mirrors its keys because the lab has its own language switch.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  IconBadge,
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { addDays, dateKey, weekdayIndex } from './habitsMock';
import {
  CATEGORY_LOOK,
  daysBetween,
  fmt,
  GoalCategoryKey,
  GoalKind,
  groupTyped,
  LabGoal,
  MAX_GOAL_VALUE,
  NewGoal,
  useLabGoals,
} from './goalsMock';
import { dangerColor, useJournalT, useKeyboardLift } from './journalParts';
import { shortDate } from './goalParts';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SHEET_TOP = 64;
const CATEGORIES: GoalCategoryKey[] = [
  'personal',
  'health',
  'learning',
  'career',
  'financial',
  'other',
];

/** Mirrors src/constants/goalTemplates.ts (keys, targets, icons). */
export const IDEAS: {
  id: string;
  title: string;
  unit: string;
  target: number;
  icon: IoniconName;
  category: GoalCategoryKey;
  kind: GoalKind;
}[] = [
  {
    id: 'lose_weight',
    title: 'loseWeight',
    unit: 'kg',
    target: 10,
    icon: 'fitness',
    category: 'health',
    kind: 'measure',
  },
  {
    id: 'save_money',
    title: 'saveMoney',
    unit: 'currency',
    target: 5000,
    icon: 'card',
    category: 'financial',
    kind: 'count',
  },
  {
    id: 'pay_debt',
    title: 'payDebt',
    unit: 'currency',
    target: 2000,
    icon: 'cash',
    category: 'financial',
    kind: 'count',
  },
  {
    id: 'read_books',
    title: 'readBooks',
    unit: 'books',
    target: 12,
    icon: 'book',
    category: 'learning',
    kind: 'count',
  },
  {
    id: 'learn_language',
    title: 'learnLanguage',
    unit: 'hours',
    target: 100,
    icon: 'language',
    category: 'learning',
    kind: 'count',
  },
  {
    id: 'online_course',
    title: 'onlineCourse',
    unit: 'lessons',
    target: 30,
    icon: 'laptop',
    category: 'learning',
    kind: 'count',
  },
  {
    id: 'job_applications',
    title: 'jobApplications',
    unit: 'applications',
    target: 20,
    icon: 'briefcase',
    category: 'career',
    kind: 'count',
  },
  {
    id: 'networking',
    title: 'networking',
    unit: 'connections',
    target: 50,
    icon: 'people',
    category: 'career',
    kind: 'count',
  },
  {
    id: 'meditation',
    title: 'meditation',
    unit: 'minutes',
    target: 365,
    icon: 'leaf',
    category: 'personal',
    kind: 'count',
  },
  {
    id: 'art_projects',
    title: 'artProjects',
    unit: 'projects',
    target: 12,
    icon: 'color-palette',
    category: 'other',
    kind: 'count',
  },
  {
    id: 'cooking_recipes',
    title: 'cookingRecipes',
    unit: 'recipes',
    target: 50,
    icon: 'restaurant',
    category: 'other',
    kind: 'count',
  },
];
const UNIT_KEYS = ['books', 'hours', 'kg', 'currency', 'minutes', 'lessons'];

/** One-tap amounts for a new count goal, by the size of its target. */
export function suggestQuick(target: number): number[] {
  if (target <= 30) return [1];
  if (target <= 200) return [1, 5];
  if (target <= 2000) return [10, 50];
  return [50, 100, 250];
}

type Preset = 'm1' | 'm3' | 'm6' | 'year' | 'none' | 'pick';

function presetDate(preset: Preset, today: Date): Date | null {
  const months = (n: number) =>
    new Date(today.getFullYear(), today.getMonth() + n, today.getDate());
  switch (preset) {
    case 'm1':
      return months(1);
    case 'm3':
      return months(3);
    case 'm6':
      return months(6);
    case 'year': {
      const end = new Date(today.getFullYear(), 11, 31);
      return daysBetween(today, end) < 14
        ? new Date(today.getFullYear() + 1, 11, 31)
        : end;
    }
    default:
      return null;
  }
}

function parseNumber(text: string): number {
  return Number(text.replace(',', '.').replace(/\s/g, ''));
}

export function GoalComposerConcept({
  editing,
  bottomInset,
  onClose,
  onSave,
}: {
  editing: LabGoal | null;
  bottomInset: number;
  onClose: () => void;
  onSave: (goal: NewGoal, editingId: string | null) => void;
}) {
  const { c, lang, mode } = useLab();
  const copy = MOCK_COPY[lang];
  const g = copy.goals;
  const t = useJournalT();
  const { today } = useLabGoals();

  const [title, setTitle] = useState(editing?.title[lang] ?? '');
  const [kind, setKind] = useState<GoalKind>(editing?.kind ?? 'count');
  const [startText, setStartText] = useState(
    editing && editing.kind === 'measure' ? String(editing.start) : ''
  );
  const [targetText, setTargetText] = useState(
    editing ? String(editing.target) : ''
  );
  const [unit, setUnit] = useState(editing?.unit[lang] ?? '');
  const [category, setCategory] = useState<GoalCategoryKey>(
    editing?.category ?? 'personal'
  );
  const [icon, setIcon] = useState<string>(
    editing?.icon ?? CATEGORY_LOOK.personal.icon
  );
  const [description, setDescription] = useState('');
  const [preset, setPreset] = useState<Preset>(
    editing ? (editing.targetDate ? 'pick' : 'none') : 'm3'
  );
  const [picked, setPicked] = useState<Date | null>(
    editing?.targetDate ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const deadline = preset === 'pick' ? picked : presetDate(preset, today);
  const target = parseNumber(targetText);
  const start = kind === 'measure' ? parseNumber(startText) : 0;
  const span = Math.abs(target - start);
  const color = c.habit[CATEGORY_LOOK[category].color];
  const weeks = deadline ? Math.max(1, daysBetween(today, deadline)) / 7 : null;
  const perWeek =
    weeks && span > 0 && Number.isFinite(span) ? span / weeks : null;

  // --- Sheet in / out (as the habit composer) ----------------------------------------
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, {
      damping: 24,
      stiffness: 230,
      overshootClamping: true,
    });
  }, [p]);
  const dismiss = (after: () => void) => {
    p.value = withTiming(0, { duration: 260 }, finished => {
      if (finished) scheduleOnRN(after);
    });
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss(onClose);
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.35 * p.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * 900 }],
  }));
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));
  const badgePop = useSharedValue(1);
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePop.value }],
  }));
  const pop = () => {
    badgePop.value = withSequence(
      withSpring(1.12, { damping: 9, stiffness: 420 }),
      withSpring(1)
    );
  };

  // --- Keyboard: the Create bar rides on top of it; a focused field is kept
  // above the bar (scrolled into view once the keyboard is up).
  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const barHeight = useRef(0);
  const titleRef = useRef<TextInput>(null);
  const startRef = useRef<TextInput>(null);
  const targetRef = useRef<TextInput>(null);
  const unitRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const { lift, keyboardTop } = useKeyboardLift(rootRef, bottomInset);
  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));
  const reveal = (node: TextInput | null) => {
    setTimeout(() => {
      const top = keyboardTop.current;
      if (top === null || !node) return;
      node.measureInWindow((_x, y, _w, h) => {
        const limit = top - (barHeight.current - bottomInset) - labSpace.md;
        if (y + h > limit) {
          scrollRef.current?.scrollTo({
            y: scrollYRef.current + (y + h - limit),
            animated: true,
          });
        }
      });
    }, 320);
  };

  const save = () => {
    // GoalForm.validateForm — same rules, same texts.
    const trimmed = title.trim();
    const u = unit.trim();
    let message: string | null = null;
    if (!trimmed) message = t('goals.form.errors.titleRequired');
    else if (trimmed.length < 2) message = t('goals.form.errors.titleTooShort');
    else if (trimmed.length > 100)
      message = t('goals.form.errors.titleTooLong');
    else if (!u) message = t('goals.form.errors.unitRequired');
    else if (u.length > 20) message = t('goals.form.errors.unitTooLong');
    // Count: the target must be above 0 (you cannot count up to nothing).
    // Measure: any two different values ≥ 0 — a debt goes down to 0 (kolo 23).
    else if (kind === 'count' && !(target > 0))
      message = t('goals.form.errors.targetValueRequired');
    else if (
      kind === 'measure' &&
      (startText.trim() === '' || !Number.isFinite(start) || start === target)
    )
      message = g.startRequired;
    else if (
      kind === 'measure' &&
      (targetText.trim() === '' || !Number.isFinite(target))
    )
      message = g.targetRequired;
    else if (target > MAX_GOAL_VALUE || start > MAX_GOAL_VALUE)
      message = g.tooLarge;
    else if (description.length > 300)
      message = t('goals.form.errors.descriptionTooLong');
    if (message) {
      setError(message);
      notification(NotificationFeedbackType.Warning);
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 70 }),
        withTiming(-5, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      return;
    }
    notification(NotificationFeedbackType.Success);
    const goal: NewGoal = {
      title: { en: trimmed, de: trimmed },
      category,
      icon,
      unit: { en: u, de: u },
      kind,
      start,
      target,
      targetDate: deadline,
      quick: kind === 'count' ? suggestQuick(target) : [],
    };
    dismiss(() => onSave(goal, editing?.id ?? null));
  };

  const fieldBox = [
    styles.field,
    { backgroundColor: c.surface, borderColor: c.border },
  ];

  return (
    <View ref={rootRef} style={StyleSheet.absoluteFill} collapsable={false}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismiss(onClose)}
        accessibilityLabel={t('common.close')}
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
          { top: SHEET_TOP, backgroundColor: c.canvas, borderColor: c.border },
          sheetStyle,
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: c.track }]} />
        <View style={[contentColumn, styles.titleRow]}>
          <LabText variant="title" style={{ flex: 1 }}>
            {editing ? t('goals.editGoal') : t('goals.addGoal')}
          </LabText>
          <PressableScale
            onPress={() => dismiss(onClose)}
            pressScale={0.9}
            accessibilityLabel={t('common.close')}
            style={[
              styles.close,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Ionicons name="close" size={20} color={c.text} />
          </PressableScale>
        </View>

        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={e => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          contentContainerStyle={[
            contentColumn,
            styles.body,
            { paddingBottom: bottomInset + 100 },
          ]}
        >
          {/* Live preview */}
          <Animated.View entering={FadeInDown.delay(80).duration(260)}>
            <Surface style={styles.preview}>
              <View style={styles.previewHead}>
                <Animated.View style={badgeStyle}>
                  <IconBadge
                    icon={icon as IoniconName}
                    color={color}
                    size={44}
                  />
                </Animated.View>
                <View style={{ flex: 1, marginLeft: labSpace.md }}>
                  <LabText
                    variant="bodyStrong"
                    tone={title.trim() ? 'text' : 'faint'}
                    numberOfLines={2}
                  >
                    {title.trim() || g.previewTitle}
                  </LabText>
                  <LabText variant="caption" tone="muted">
                    {[
                      t(`goals.category.${category}`),
                      deadline
                        ? g.by(shortDate(deadline, copy.locale))
                        : g.noDeadline,
                    ].join(' · ')}
                  </LabText>
                </View>
              </View>
              <LabText
                variant="label"
                tone="muted"
                style={{ marginTop: labSpace.md }}
              >
                {kind === 'measure'
                  ? `${groupTyped(startText.replace(',', '.'), copy.locale) || '—'} → ${groupTyped(targetText.replace(',', '.'), copy.locale) || '—'} ${unit}`
                  : `0 / ${groupTyped(targetText.replace(',', '.'), copy.locale) || '—'} ${unit}`}
              </LabText>
              <View style={[styles.previewTrack, { backgroundColor: c.track }]}>
                {[25, 50, 75].map(m => (
                  <View
                    key={m}
                    style={[
                      styles.previewNotch,
                      {
                        left: `${m}%`,
                        backgroundColor: c.textFaint,
                        borderColor: c.surface,
                      },
                    ]}
                  />
                ))}
              </View>
              {perWeek !== null && (
                <Animated.View
                  key={`${preset}-${targetText}-${startText}`}
                  entering={FadeIn.duration(220)}
                >
                  <LabText
                    variant="caption"
                    style={{ marginTop: labSpace.sm, color }}
                  >
                    {g.paceHint(fmt(perWeek, copy.locale), unit || '')}
                  </LabText>
                </Animated.View>
              )}
            </Surface>
          </Animated.View>

          {/* Title — the shake lives on an inner view: a layout animation (entering)
              and an animated transform on one view fight (Reanimated warning). */}
          <Animated.View entering={FadeInDown.delay(130).duration(260)}>
            <Animated.View style={shakeStyle}>
              <View
                style={[
                  styles.titleBox,
                  {
                    backgroundColor: c.surface,
                    borderColor: error ? dangerColor(mode) : c.border,
                  },
                ]}
              >
                <TextInput
                  ref={titleRef}
                  onFocus={() => reveal(titleRef.current)}
                  value={title}
                  onChangeText={v => {
                    setTitle(v);
                    setError(null);
                  }}
                  placeholder={t('goals.form.placeholders.title')}
                  placeholderTextColor={c.textFaint}
                  maxLength={100}
                  maxFontSizeMultiplier={1.4}
                  style={[typeStyle('title', c.text), styles.titleInput]}
                />
                <Text
                  style={typeStyle('caption', c.textFaint)}
                  maxFontSizeMultiplier={1.3}
                >
                  {`${title.trim().length}/100`}
                </Text>
              </View>
              {error && (
                <Text
                  style={[
                    typeStyle('caption', dangerColor(mode)),
                    { marginTop: 6, marginLeft: labSpace.xs },
                  ]}
                >
                  {error}
                </Text>
              )}
            </Animated.View>
          </Animated.View>

          {/* Ideas — the app's templates */}
          {!editing && (
            <Animated.View entering={FadeInDown.delay(170).duration(260)}>
              <Label text={g.ideas} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: labSpace.sm }}
              >
                {IDEAS.map(idea => {
                  const ideaColor = c.habit[CATEGORY_LOOK[idea.category].color];
                  return (
                    <PressableScale
                      key={idea.id}
                      pressScale={0.94}
                      accessibilityLabel={t(`goals.templates.${idea.title}`)}
                      onPress={() => {
                        setTitle(t(`goals.templates.${idea.title}`));
                        setUnit(t(`goals.units.${idea.unit}`));
                        setCategory(idea.category);
                        setIcon(idea.icon);
                        setKind(idea.kind);
                        if (idea.kind === 'measure') {
                          setStartText('');
                          setTargetText('');
                        } else {
                          setTargetText(String(idea.target));
                        }
                        setError(null);
                        pop();
                      }}
                      style={[
                        styles.idea,
                        { backgroundColor: c.surface, borderColor: c.border },
                      ]}
                    >
                      <Ionicons name={idea.icon} size={16} color={ideaColor} />
                      <LabText variant="label" style={{ marginLeft: 6 }}>
                        {t(`goals.templates.${idea.title}`)}
                      </LabText>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Kind */}
          <Animated.View entering={FadeInDown.delay(210).duration(260)}>
            <View style={styles.kinds}>
              {(['count', 'measure'] as GoalKind[]).map(k => {
                const on = k === kind;
                return (
                  <PressableScale
                    key={k}
                    pressScale={0.96}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={
                      k === 'count' ? g.kindCount : g.kindMeasure
                    }
                    onPress={() => {
                      setKind(k);
                      setError(null);
                    }}
                    style={[
                      styles.kind,
                      {
                        backgroundColor: c.surface,
                        borderColor: on ? c.primary : c.border,
                      },
                      on && { borderWidth: 2 },
                    ]}
                  >
                    <Ionicons
                      name={k === 'count' ? 'add-circle-outline' : 'pulse'}
                      size={20}
                      color={on ? c.primary : c.textMuted}
                    />
                    <LabText
                      variant="bodyStrong"
                      style={{ marginTop: labSpace.sm }}
                    >
                      {k === 'count' ? g.kindCount : g.kindMeasure}
                    </LabText>
                    <LabText variant="caption" tone="muted" numberOfLines={2}>
                      {k === 'count' ? g.kindCountHint : g.kindMeasureHint}
                    </LabText>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Numbers */}
          <Animated.View entering={FadeInDown.delay(250).duration(260)}>
            <View style={styles.numbers}>
              {kind === 'measure' && (
                <NumberField
                  inputRef={startRef}
                  onFocus={() => reveal(startRef.current)}
                  label={g.now}
                  value={startText}
                  onChange={v => {
                    setStartText(v);
                    setError(null);
                  }}
                  placeholder="85"
                />
              )}
              <NumberField
                inputRef={targetRef}
                onFocus={() => reveal(targetRef.current)}
                label={t('goals.form.targetValue')}
                value={targetText}
                onChange={v => {
                  setTargetText(v);
                  setError(null);
                }}
                placeholder={t('goals.form.placeholders.targetValue')}
              />
              <View style={{ flex: 1 }}>
                <LabText
                  variant="caption"
                  tone="muted"
                  style={{ marginBottom: 6 }}
                >
                  {t('goals.form.unit')}
                </LabText>
                <TextInput
                  ref={unitRef}
                  onFocus={() => reveal(unitRef.current)}
                  value={unit}
                  onChangeText={v => {
                    setUnit(v);
                    setError(null);
                  }}
                  maxLength={20}
                  placeholder="kg"
                  placeholderTextColor={c.textFaint}
                  style={[typeStyle('bodyStrong', c.text), fieldBox]}
                />
              </View>
            </View>
            <View style={styles.unitChips}>
              {UNIT_KEYS.map(key => {
                const label = t(`goals.units.${key}`);
                const on = unit === label;
                return (
                  <PressableScale
                    key={key}
                    haptic={null}
                    pressScale={0.94}
                    accessibilityLabel={label}
                    onPress={() => {
                      selection();
                      setUnit(label);
                    }}
                    style={[
                      styles.unitChip,
                      { backgroundColor: on ? c.primarySoft : c.track },
                    ]}
                  >
                    <LabText
                      variant="caption"
                      tone={on ? 'primary' : 'muted'}
                      style={{ fontFamily: labFonts.semibold }}
                    >
                      {label}
                    </LabText>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(290).duration(260)}>
            <Label text={t('goals.form.category')} />
            <View style={styles.categories}>
              {CATEGORIES.map(key => {
                const on = key === category;
                const look = CATEGORY_LOOK[key];
                const col = c.habit[look.color];
                return (
                  <PressableScale
                    key={key}
                    haptic={null}
                    pressScale={0.94}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(`goals.category.${key}`)}
                    onPress={() => {
                      selection();
                      setCategory(key);
                      // A template's own icon (book, piggy bank…) stays; a category icon follows.
                      if (
                        Object.values(CATEGORY_LOOK).some(l => l.icon === icon)
                      )
                        setIcon(look.icon);
                      pop();
                    }}
                    style={[
                      styles.category,
                      {
                        backgroundColor: on ? `${col}22` : c.surface,
                        borderColor: on ? col : c.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={look.icon as IoniconName}
                      size={15}
                      color={col}
                    />
                    <LabText
                      variant="label"
                      style={{
                        marginLeft: 6,
                        fontFamily: on ? labFonts.semibold : labFonts.medium,
                      }}
                    >
                      {t(`goals.category.${key}`)}
                    </LabText>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Deadline */}
          <Animated.View entering={FadeInDown.delay(330).duration(260)}>
            <Label text={g.deadline} />
            <View style={styles.presets}>
              {(['m1', 'm3', 'm6', 'year', 'none', 'pick'] as Preset[]).map(
                key => {
                  const on = key === preset;
                  return (
                    <PressableScale
                      key={key}
                      haptic={null}
                      pressScale={0.94}
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={g.presets[key]}
                      onPress={() => {
                        selection();
                        setPreset(key);
                        if (key === 'pick' && !picked)
                          setPicked(presetDate('m3', today));
                      }}
                      style={[
                        styles.preset,
                        {
                          backgroundColor: on ? c.primary : c.surface,
                          borderColor: on ? c.primary : c.border,
                        },
                      ]}
                    >
                      {key === 'pick' && (
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={on ? c.onPrimary : c.textMuted}
                          style={{ marginRight: 5 }}
                        />
                      )}
                      <LabText
                        variant="label"
                        style={{
                          color: on ? c.onPrimary : c.text,
                          fontFamily: labFonts.semibold,
                        }}
                      >
                        {g.presets[key]}
                      </LabText>
                    </PressableScale>
                  );
                }
              )}
            </View>
            {preset === 'pick' && (
              <Animated.View entering={FadeInDown.duration(240)}>
                <DeadlineCalendar value={picked} onChange={d => setPicked(d)} />
              </Animated.View>
            )}
            {deadline && (
              <View
                style={[
                  styles.deadlineLine,
                  { backgroundColor: c.primarySoft },
                ]}
              >
                <Ionicons name="flag" size={15} color={c.primary} />
                <LabText
                  variant="label"
                  tone="primary"
                  style={{ marginLeft: labSpace.sm, flex: 1 }}
                >
                  {`${deadline.toLocaleDateString(copy.locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} · ${g.inDays(daysBetween(today, deadline))}`}
                </LabText>
              </View>
            )}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(370).duration(260)}>
            <Label text={t('goals.form.description')} />
            <TextInput
              ref={descriptionRef}
              onFocus={() => reveal(descriptionRef.current)}
              value={description}
              onChangeText={setDescription}
              maxLength={300}
              multiline
              placeholder={t('goals.form.placeholders.description')}
              placeholderTextColor={c.textFaint}
              style={[typeStyle('body', c.text), fieldBox, styles.description]}
            />
          </Animated.View>
        </ScrollView>

        {/* Rides on top of the keyboard (kolo 25, Petr: with the keyboard up there
            was no Create button). */}
        <Animated.View
          onLayout={e => {
            barHeight.current = e.nativeEvent.layout.height;
          }}
          style={[
            styles.createBar,
            {
              backgroundColor: c.canvas,
              borderColor: c.border,
              paddingBottom: bottomInset + labSpace.md,
            },
            barStyle,
          ]}
        >
          <View style={contentColumn}>
            <PressableScale
              onPress={save}
              haptic={null}
              accessibilityLabel={
                editing ? t('common.save') : t('common.create')
              }
              style={styles.create}
            >
              <LinearGradient
                colors={c.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons
                name={editing ? 'checkmark' : 'flag'}
                size={18}
                color={c.onPrimary}
                style={{ marginRight: labSpace.sm }}
              />
              <LabText variant="bodyStrong" tone="onPrimary">
                {editing ? t('common.save') : t('common.create')}
              </LabText>
            </PressableScale>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <LabText
      variant="overline"
      tone="muted"
      style={{ marginTop: labSpace.xl, marginBottom: labSpace.sm }}
    >
      {text}
    </LabText>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  inputRef,
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputRef: React.RefObject<TextInput | null>;
  onFocus: () => void;
}) {
  const { c } = useLab();
  return (
    <View style={{ flex: 1 }}>
      <LabText
        variant="caption"
        tone="muted"
        style={{ marginBottom: 6 }}
        numberOfLines={1}
      >
        {label}
      </LabText>
      <TextInput
        ref={inputRef}
        onFocus={onFocus}
        value={value}
        onChangeText={v => onChange(v.replace(/[^0-9.,]/g, ''))}
        keyboardType="decimal-pad"
        maxLength={18}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        style={[
          typeStyle('bodyStrong', c.text),
          styles.field,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Deadline calendar — one month at a time, past days off
// ---------------------------------------------------------------------------

function DeadlineCalendar({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const { today } = useLabGoals();
  const [month, setMonth] = useState(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = weekdayIndex(month);
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => addDays(month, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const canBack = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const go = (step: number) => {
    selection();
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + step, 1));
  };
  const selectedKey = value ? dateKey(value) : null;

  return (
    <Surface style={styles.calendar}>
      <View style={styles.calHead}>
        <PressableScale
          {...(canBack ? { onPress: () => go(-1) } : null)}
          haptic={null}
          pressScale={0.88}
          accessibilityLabel="‹"
          style={[
            styles.calStep,
            { backgroundColor: c.track, opacity: canBack ? 1 : 0.35 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={c.text} />
        </PressableScale>
        <LabText
          variant="titleSm"
          style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}
        >
          {month.toLocaleDateString(copy.locale, {
            month: 'long',
            year: 'numeric',
          })}
        </LabText>
        <PressableScale
          onPress={() => go(1)}
          haptic={null}
          pressScale={0.88}
          accessibilityLabel="›"
          style={[styles.calStep, { backgroundColor: c.track }]}
        >
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </PressableScale>
      </View>
      <View style={styles.calWeek}>
        {copy.weekdays.map((letter, i) => (
          <LabText
            key={i}
            variant="caption"
            tone="faint"
            style={styles.calLetter}
          >
            {letter}
          </LabText>
        ))}
      </View>
      <Animated.View
        key={month.getTime()}
        entering={FadeIn.duration(200)}
        style={styles.calGrid}
      >
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.calCell} />;
          const past = d < today;
          const on = dateKey(d) === selectedKey;
          const isToday = dateKey(d) === dateKey(today);
          return (
            <PressableScale
              key={i}
              haptic={null}
              pressScale={0.86}
              accessibilityLabel={d.toLocaleDateString(copy.locale)}
              accessibilityState={{ selected: on }}
              {...(past
                ? null
                : {
                    onPress: () => {
                      selection();
                      onChange(d);
                    },
                  })}
              style={styles.calCell}
            >
              <View
                style={[styles.calDay, on && { backgroundColor: c.primary }]}
              >
                <LabText
                  variant="label"
                  style={{
                    color: on ? c.onPrimary : past ? c.textFaint : c.text,
                    fontFamily: on || isToday ? labFonts.bold : labFonts.medium,
                    textDecorationLine: past ? 'line-through' : 'none',
                  }}
                >
                  {d.getDate()}
                </LabText>
              </View>
              {isToday && !on && (
                <View
                  style={[styles.calToday, { backgroundColor: c.primary }]}
                />
              )}
            </PressableScale>
          );
        })}
      </Animated.View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: labSpace.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.xl,
    paddingTop: labSpace.md,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: labSpace.xl,
    paddingTop: labSpace.lg,
  },
  preview: {
    padding: labSpace.lg,
    borderRadius: labRadius.md + 6,
  },
  previewHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTrack: {
    height: 10,
    borderRadius: 5,
    marginTop: labSpace.sm,
    justifyContent: 'center',
  },
  previewNotch: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: 5,
    borderWidth: 2,
  },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.lg,
    paddingVertical: labSpace.md,
    borderRadius: labRadius.md,
    borderWidth: 1.5,
  },
  titleInput: {
    flex: 1,
    padding: 0,
    marginRight: labSpace.sm,
  },
  idea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  kinds: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.xl,
  },
  kind: {
    flex: 1,
    padding: labSpace.md,
    borderRadius: labRadius.md,
    borderWidth: 1,
  },
  numbers: {
    flexDirection: 'row',
    gap: labSpace.md,
    marginTop: labSpace.lg,
  },
  field: {
    height: 48,
    borderRadius: labRadius.sm,
    borderWidth: 1,
    paddingHorizontal: labSpace.md,
    paddingVertical: 0,
  },
  unitChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  unitChip: {
    paddingHorizontal: labSpace.md,
    paddingVertical: 5,
    borderRadius: labRadius.pill,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    height: 38,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
  },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    height: 38,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  deadlineLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.md,
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.sm,
    borderRadius: labRadius.sm,
  },
  description: {
    height: 88,
    paddingTop: labSpace.md,
    textAlignVertical: 'top',
  },
  calendar: {
    marginTop: labSpace.md,
    padding: labSpace.md,
  },
  calHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWeek: {
    flexDirection: 'row',
    marginTop: labSpace.md,
  },
  calLetter: {
    flex: 1,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: labSpace.xs,
  },
  calCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calToday: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  createBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: labSpace.md,
    paddingHorizontal: labSpace.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  create: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: labSpace.lg,
    borderRadius: labRadius.pill,
    overflow: 'hidden',
  },
});
