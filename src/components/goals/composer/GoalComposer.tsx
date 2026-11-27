/**
 * The goal composer — ONE sheet for creating AND editing a goal (migration E15
 * point 1, from the Design Lab's GoalComposerConcept, kolo 22). Replaces the
 * old GoalModal + GoalForm, the three-step date modal with its "no deadline?"
 * confirm, and the separate templates modal.
 *
 * - A LIVE PREVIEW of the card at the top: the category's icon and colour, the
 *   name, "Category · by 31 Dec", the target, and what the deadline means
 *   ("That's about 0.5 books a week").
 * - "Start from an idea" (create only) — the app's templates (useGoalTemplates).
 * - Target (decimals allowed) + unit with the usual units as chips; category.
 * - DEADLINE in one tap: 1 / 3 / 6 months, end of year, no deadline — or "Pick a
 *   date" opens a month calendar right here (past days off).
 * - Rules: goalFormRules.ts. An error shakes the name field and says why.
 * - The main button rides on top of the keyboard and clears the banner. Saving
 *   keeps the sheet open until the storage answered: a failure stays in the
 *   sheet with the user's input.
 * The "measure" kind (start value, either direction) comes with E16.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, fonts, radius, space, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { goalLook } from '@/src/constants/goalLook';
import { useGoalTemplates } from '@/src/constants/goalTemplates';
import { CreateGoalInput, Goal, GoalCategory, UpdateGoalInput } from '@/src/types/goal';
import { DateString } from '@/src/types/common';
import { daysBetween, parseDate } from '@/src/utils/date';
import { goalDate } from '@/src/utils/goalCalculations';
import { contentColumn } from '@/src/utils/layout';
import {
  AppText,
  IconBadge,
  PressableScale,
  Surface,
  typeStyle,
  useKeyboardLift,
  useOverlayBack,
  useOverlayCover,
} from '@/src/components/ui';
import { monthRows } from '@/src/screens/journal/journalHistoryLogic';
import { formatGoalNumber, GOAL_MILESTONES } from '@/src/screens/goals/goalsPageLogic';
import {
  DEADLINE_PRESETS,
  DeadlinePreset,
  GOAL_DESCRIPTION_MAX,
  GOAL_TITLE_MAX,
  GOAL_UNIT_MAX,
  goalFormErrors,
  parseGoalNumber,
  presetDeadline,
  weeklyPace,
} from '../goalFormRules';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SHEET_TOP = 64;
const CATEGORIES: GoalCategory[] = [
  GoalCategory.PERSONAL,
  GoalCategory.HEALTH,
  GoalCategory.LEARNING,
  GoalCategory.CAREER,
  GoalCategory.FINANCIAL,
  GoalCategory.OTHER,
];
const UNIT_KEYS = ['books', 'hours', 'kg', 'currency', 'minutes', 'lessons'];

export interface GoalComposerProps {
  /** The goal to edit; undefined = a new one. */
  goal: Goal | undefined;
  today: DateString;
  /** Banner room the bottom bar must clear. */
  bottomInset: number;
  /** Stores the goal; throws when it could not be stored. */
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => Promise<void>;
  /** The sheet is gone (after cancel or a successful save). */
  onClosed: () => void;
}

export function GoalComposer({ goal, today, bottomInset, onSubmit, onClosed }: GoalComposerProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  useOverlayCover();
  const templates = useGoalTemplates();
  const editing = !!goal;
  const locale = t('common.locale');
  const existingDeadline = goalDate(goal?.targetDate);

  const [title, setTitle] = useState(goal?.title ?? '');
  const [targetText, setTargetText] = useState(goal ? String(goal.targetValue) : '');
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [category, setCategory] = useState<GoalCategory>(goal?.category ?? GoalCategory.PERSONAL);
  const [description, setDescription] = useState(goal?.description ?? '');
  // A new goal starts at 3 months: a deadline makes the pace readable; one tap removes it.
  const [preset, setPreset] = useState<DeadlinePreset>(
    editing ? (existingDeadline ? 'pick' : 'none') : 'm3'
  );
  const [picked, setPicked] = useState<DateString | null>(existingDeadline);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const deadline = preset === 'pick' ? picked : presetDeadline(preset, today);
  const target = parseGoalNumber(targetText);
  const look = goalLook(category);
  const color = c.habit[look.color];
  const current = goal?.currentValue ?? 0;
  const perWeek = weeklyPace(target - current, deadline, today);
  const trimmed = title.trim();
  const valid =
    Object.keys(goalFormErrors({ title, unit, targetValue: target, description })).length === 0;

  // --- Sheet in / out ------------------------------------------------------------
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(1, { damping: 24, stiffness: 230, overshootClamping: true });
  }, [p]);
  const closing = useRef(false);
  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    p.value = withTiming(0, { duration: 260 }, finished => {
      if (finished) scheduleOnRN(onClosed);
    });
  };
  useOverlayBack(() => {
    if (!saving) dismiss();
  });
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.35 * p.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 900 }] }));

  // --- Feedback -------------------------------------------------------------------
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const badgePop = useSharedValue(1);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgePop.value }] }));
  const pop = () => {
    badgePop.value = withSequence(withSpring(1.12, { damping: 9, stiffness: 420 }), withSpring(1));
  };
  const ready = useSharedValue(valid ? 1 : 0);
  useEffect(() => {
    ready.value = withTiming(valid ? 1 : 0, { duration: 220 });
  }, [valid, ready]);
  const createStyle = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * ready.value }));

  // --- Keyboard: the button rides on top of it; a focused field stays above the bar.
  const rootRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const barHeight = useRef(0);
  const titleRef = useRef<TextInput>(null);
  const targetRef = useRef<TextInput>(null);
  const unitRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const { lift, keyboardTop } = useKeyboardLift(rootRef, bottomInset);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value }] }));
  const reveal = (node: TextInput | null) => {
    setTimeout(() => {
      const top = keyboardTop.current;
      if (top === null || !node) return;
      node.measureInWindow((_x, y, _w, h) => {
        const limit = top - (barHeight.current - bottomInset) - space.md;
        if (y + h > limit) {
          scrollRef.current?.scrollTo({ y: scrollYRef.current + (y + h - limit), animated: true });
        }
      });
    }, 320);
  };

  const fail = (text: string) => {
    setError(text);
    feel('invalid');
    shake.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 70 }),
      withTiming(-5, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const save = async () => {
    if (saving) return;
    const errors = goalFormErrors({ title, unit, targetValue: target, description });
    const first = errors.title ?? errors.unit ?? errors.targetValue ?? errors.description;
    if (first) return fail(t(first));
    setSaving(true);
    try {
      await onSubmit({
        title: trimmed,
        unit: unit.trim(),
        targetValue: target,
        category,
        // Always sent: an emptied description and "No deadline" must clear the old ones.
        description: description.trim(),
        targetDate: deadline ?? undefined,
      });
      feel('saved');
      dismiss();
    } catch {
      setSaving(false);
      fail(t('goals.errors.saveFailed'));
    }
  };

  const shortDate = (date: DateString) =>
    parseDate(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const presetLabel = (key: DeadlinePreset) =>
    key === 'm1'
      ? t('goals.composer.presetMonths', { count: 1 })
      : key === 'm3'
        ? t('goals.composer.presetMonths', { count: 3 })
        : key === 'm6'
          ? t('goals.composer.presetMonths', { count: 6 })
          : key === 'year'
            ? t('goals.composer.presetYear')
            : key === 'none'
              ? t('goals.card.noDeadline')
              : t('goals.composer.presetPick');
  const unitLabel = unit.trim();
  const targetLabel = Number.isFinite(target) && target > 0 ? formatGoalNumber(target, locale) : '—';
  const fraction = editing && target > 0 ? Math.min(1, current / target) : 0;
  const mainLabel = editing ? t('common.save') : t('goals.composer.create');

  return (
    <View ref={rootRef} style={StyleSheet.absoluteFill} collapsable={false}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => !saving && dismiss()}
        accessibilityLabel={t('common.close')}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fixed.black }, scrimStyle]} />
      </Pressable>

      <Animated.View
        style={[styles.sheet, { top: SHEET_TOP, backgroundColor: c.canvas, borderColor: c.border }, sheetStyle]}
      >
        <View style={[styles.grabber, { backgroundColor: c.track }]} />
        <View style={[contentColumn, styles.titleRow]}>
          <AppText variant="title" style={styles.flex}>
            {editing ? t('goals.editGoal') : t('goals.composer.title')}
          </AppText>
          <PressableScale
            onPress={() => !saving && dismiss()}
            pressScale={0.9}
            accessibilityLabel={t('common.close')}
            style={[styles.close, { backgroundColor: c.surface, borderColor: c.border }]}
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
          contentContainerStyle={[contentColumn, styles.body, { paddingBottom: bottomInset + 100 }]}
        >
          {/* Live preview */}
          <Animated.View entering={FadeInDown.delay(80).duration(260)}>
            <Surface style={styles.preview}>
              <View style={styles.previewHead}>
                <Animated.View style={badgeStyle}>
                  <IconBadge icon={look.icon} color={color} size={44} />
                </Animated.View>
                <View style={styles.previewText}>
                  <AppText variant="bodyStrong" tone={trimmed ? 'text' : 'faint'} numberOfLines={2}>
                    {trimmed || t('goals.composer.previewTitle')}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {`${t(`goals.category.${category}`)} · ${
                      deadline ? t('goals.card.by', { date: shortDate(deadline) }) : t('goals.card.noDeadline')
                    }`}
                  </AppText>
                </View>
              </View>
              <AppText variant="label" tone="muted" style={styles.previewValue}>
                {`${formatGoalNumber(current, locale)} / ${targetLabel}${unitLabel ? ` ${unitLabel}` : ''}`}
              </AppText>
              <View style={[styles.previewTrack, { backgroundColor: c.track }]}>
                {fraction > 0 && (
                  <View style={[styles.previewFill, { width: `${fraction * 100}%`, backgroundColor: color }]} />
                )}
                {GOAL_MILESTONES.map(m => (
                  <View
                    key={m}
                    style={[
                      styles.previewNotch,
                      { left: `${m}%`, backgroundColor: fraction * 100 >= m ? color : c.textFaint, borderColor: c.surface },
                    ]}
                  />
                ))}
              </View>
              {perWeek !== null && (
                <Animated.View key={`${deadline}-${targetText}`} entering={FadeIn.duration(220)}>
                  <AppText variant="caption" style={[styles.paceHint, { color }]}>
                    {t('goals.composer.paceHint', { amount: formatGoalNumber(perWeek, locale), unit: unitLabel })}
                  </AppText>
                </Animated.View>
              )}
            </Surface>
          </Animated.View>

          {/* Name — the shake sits on an inner view (entering + transform on one view fight, P40). */}
          <Animated.View entering={FadeInDown.delay(130).duration(260)}>
            <Animated.View style={shakeStyle}>
              <View
                style={[
                  styles.titleBox,
                  { backgroundColor: c.surface, borderColor: error ? c.missed : c.border },
                ]}
              >
                <TextInput
                  ref={titleRef}
                  onFocus={() => reveal(titleRef.current)}
                  value={title}
                  onChangeText={value => {
                    setTitle(value);
                    setError(null);
                  }}
                  placeholder={t('goals.form.placeholders.title')}
                  placeholderTextColor={c.textFaint}
                  maxLength={GOAL_TITLE_MAX}
                  maxFontSizeMultiplier={1.4}
                  accessibilityLabel={t('goals.form.title')}
                  style={[typeStyle('title', c.text), styles.titleInput]}
                />
                <Text style={typeStyle('caption', c.textFaint)} maxFontSizeMultiplier={1.3}>
                  {`${trimmed.length}/${GOAL_TITLE_MAX}`}
                </Text>
              </View>
              {error && (
                <Text accessibilityLiveRegion="polite" style={[typeStyle('caption', c.missed), styles.error]}>
                  {error}
                </Text>
              )}
            </Animated.View>
          </Animated.View>

          {/* Ideas — the app's templates, only for a new goal */}
          {!editing && (
            <Animated.View entering={FadeInDown.delay(170).duration(260)}>
              <Label text={t('goals.composer.ideas')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideas}>
                {templates.map(idea => (
                  <PressableScale
                    key={idea.id}
                    pressScale={0.94}
                    accessibilityLabel={idea.title}
                    onPress={() => {
                      setTitle(idea.title);
                      setUnit(idea.unit);
                      setCategory(idea.category);
                      setTargetText(String(idea.suggestedTargetValue));
                      setError(null);
                      pop();
                    }}
                    style={[styles.idea, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <Ionicons
                      name={idea.icon as IoniconName}
                      size={16}
                      color={c.habit[goalLook(idea.category).color]}
                    />
                    <AppText variant="label" style={styles.ideaText}>
                      {idea.title}
                    </AppText>
                  </PressableScale>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Target and unit */}
          <Animated.View entering={FadeInDown.delay(210).duration(260)}>
            <View style={styles.numbers}>
              <View style={styles.flex}>
                <AppText variant="caption" tone="muted" style={styles.fieldLabel} numberOfLines={1}>
                  {t('goals.form.targetValue')}
                </AppText>
                <TextInput
                  ref={targetRef}
                  onFocus={() => reveal(targetRef.current)}
                  value={targetText}
                  onChangeText={value => {
                    setTargetText(value.replace(/[^0-9.,\s]/g, ''));
                    setError(null);
                  }}
                  keyboardType="decimal-pad"
                  maxLength={18}
                  placeholder={t('goals.form.placeholders.targetValue')}
                  placeholderTextColor={c.textFaint}
                  accessibilityLabel={t('goals.form.targetValue')}
                  style={[typeStyle('bodyStrong', c.text), styles.field, { backgroundColor: c.surface, borderColor: c.border }]}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="caption" tone="muted" style={styles.fieldLabel} numberOfLines={1}>
                  {t('goals.form.unit')}
                </AppText>
                <TextInput
                  ref={unitRef}
                  onFocus={() => reveal(unitRef.current)}
                  value={unit}
                  onChangeText={value => {
                    setUnit(value);
                    setError(null);
                  }}
                  maxLength={GOAL_UNIT_MAX}
                  placeholder={t('goals.units.kg')}
                  placeholderTextColor={c.textFaint}
                  accessibilityLabel={t('goals.form.unit')}
                  style={[typeStyle('bodyStrong', c.text), styles.field, { backgroundColor: c.surface, borderColor: c.border }]}
                />
              </View>
            </View>
            <View style={styles.chips}>
              {UNIT_KEYS.map(key => {
                const label = t(`goals.units.${key}`);
                const on = unitLabel === label;
                return (
                  <PressableScale
                    key={key}
                    feel="tap"
                    pressScale={0.94}
                    accessibilityLabel={label}
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      setUnit(label);
                      setError(null);
                    }}
                    style={[styles.unitChip, { backgroundColor: on ? c.primarySoft : c.track }]}
                  >
                    <AppText variant="caption" tone={on ? 'primary' : 'muted'} style={styles.semibold}>
                      {label}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Category — gives the goal its icon and colour */}
          <Animated.View entering={FadeInDown.delay(250).duration(260)}>
            <Label text={t('goals.form.category')} />
            <View style={styles.chips}>
              {CATEGORIES.map(key => {
                const on = key === category;
                const keyLook = goalLook(key);
                const keyColor = c.habit[keyLook.color];
                return (
                  <PressableScale
                    key={key}
                    feel="tap"
                    pressScale={0.94}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(`goals.category.${key}`)}
                    onPress={() => {
                      setCategory(key);
                      pop();
                    }}
                    style={[
                      styles.category,
                      { backgroundColor: on ? withAlpha(keyColor, 0.13) : c.surface, borderColor: on ? keyColor : c.border },
                    ]}
                  >
                    <Ionicons name={keyLook.icon} size={15} color={keyColor} />
                    <AppText variant="label" style={[styles.categoryText, on && styles.semibold]}>
                      {t(`goals.category.${key}`)}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Deadline */}
          <Animated.View entering={FadeInDown.delay(290).duration(260)}>
            <Label text={t('goals.composer.deadline')} />
            <View style={styles.chips}>
              {DEADLINE_PRESETS.map(key => {
                const on = key === preset;
                return (
                  <PressableScale
                    key={key}
                    feel="tap"
                    pressScale={0.94}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={presetLabel(key)}
                    onPress={() => {
                      setPreset(key);
                      if (key === 'pick' && !picked) setPicked(presetDeadline('m3', today));
                    }}
                    style={[
                      styles.preset,
                      { backgroundColor: on ? c.primary : c.surface, borderColor: on ? c.primary : c.border },
                    ]}
                  >
                    {key === 'pick' && (
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={on ? c.onPrimary : c.textMuted}
                        style={styles.presetIcon}
                      />
                    )}
                    <AppText variant="label" style={[styles.semibold, { color: on ? c.onPrimary : c.text }]}>
                      {presetLabel(key)}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
            {preset === 'pick' && (
              <Animated.View entering={FadeInDown.duration(240)}>
                <DeadlineCalendar value={picked} today={today} onChange={setPicked} />
              </Animated.View>
            )}
            {deadline && (
              <View style={[styles.deadlineLine, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="flag" size={15} color={c.primary} />
                <AppText variant="label" tone="primary" style={styles.deadlineText}>
                  {`${parseDate(deadline).toLocaleDateString(locale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })} · ${t('goals.composer.inDays', { count: Math.max(0, daysBetween(today, deadline)) })}`}
                </AppText>
              </View>
            )}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(330).duration(260)}>
            <Label text={t('goals.form.description')} />
            <TextInput
              ref={descriptionRef}
              onFocus={() => reveal(descriptionRef.current)}
              value={description}
              onChangeText={setDescription}
              maxLength={GOAL_DESCRIPTION_MAX}
              multiline
              maxFontSizeMultiplier={1.5}
              placeholder={t('goals.form.placeholders.description')}
              placeholderTextColor={c.textFaint}
              accessibilityLabel={t('goals.form.description')}
              style={[typeStyle('body', c.text), styles.description, { backgroundColor: c.surface, borderColor: c.border }]}
            />
          </Animated.View>
        </ScrollView>

        {/* The main button — above the banner, and on top of the keyboard when it is up. */}
        <Animated.View
          onLayout={e => {
            barHeight.current = e.nativeEvent.layout.height;
          }}
          style={[
            styles.createBar,
            { paddingBottom: bottomInset + space.sm, backgroundColor: c.canvas, borderTopColor: c.border },
            barStyle,
          ]}
        >
          <Animated.View style={[contentColumn, createStyle]}>
            <PressableScale
              onPress={save}
              feel={null}
              pressScale={0.97}
              accessibilityLabel={mainLabel}
              accessibilityState={{ busy: saving } as never}
              style={styles.create}
            >
              <LinearGradient
                colors={c.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, styles.createFill]}
              />
              <Ionicons name={editing ? 'checkmark' : 'flag'} size={18} color={c.onPrimary} style={styles.createIcon} />
              <AppText variant="bodyStrong" tone="onPrimary">
                {mainLabel}
              </AppText>
            </PressableScale>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <AppText variant="overline" tone="muted" style={styles.label}>
      {text}
    </AppText>
  );
}

// ---------------------------------------------------------------------------
// Deadline calendar — one month at a time, past days off
// ---------------------------------------------------------------------------

function DeadlineCalendar({
  value,
  today,
  onChange,
}: {
  value: DateString | null;
  today: DateString;
  onChange: (date: DateString) => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const [month, setMonth] = useState(() => {
    const base = parseDate(value ?? today);
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const rows = useMemo(() => monthRows(month.year, month.month), [month]);
  const letters = useMemo(() => {
    // A known Monday, then six days on — the locale's narrow weekday letters.
    return Array.from({ length: 7 }, (_, i) =>
      new Date(2026, 0, 5 + i).toLocaleDateString(locale, { weekday: 'narrow' })
    );
  }, [locale]);
  const todayDate = parseDate(today);
  const canBack =
    month.year > todayDate.getFullYear() ||
    (month.year === todayDate.getFullYear() && month.month > todayDate.getMonth());
  const go = (step: number) => {
    feel('tap');
    setMonth(m => {
      const d = new Date(m.year, m.month + step, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };
  const title = new Date(month.year, month.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Surface style={styles.calendar}>
      <View style={styles.calHead}>
        <PressableScale
          {...(canBack ? { onPress: () => go(-1) } : null)}
          feel={null}
          pressScale={0.88}
          accessibilityLabel={t('habits.detail.previousMonth')}
          style={[styles.calStep, { backgroundColor: c.track, opacity: canBack ? 1 : 0.35 }]}
        >
          <Ionicons name="chevron-back" size={18} color={c.text} />
        </PressableScale>
        <AppText variant="titleSm" style={styles.calTitle}>
          {title}
        </AppText>
        <PressableScale
          onPress={() => go(1)}
          feel={null}
          pressScale={0.88}
          accessibilityLabel={t('habits.detail.nextMonth')}
          style={[styles.calStep, { backgroundColor: c.track }]}
        >
          <Ionicons name="chevron-forward" size={18} color={c.text} />
        </PressableScale>
      </View>
      <View style={styles.calWeek}>
        {letters.map((letter, i) => (
          <AppText key={i} variant="caption" tone="faint" style={styles.calLetter}>
            {letter}
          </AppText>
        ))}
      </View>
      <Animated.View key={`${month.year}-${month.month}`} entering={FadeIn.duration(200)}>
        {rows.map((row, r) => (
          <View key={r} style={styles.calRow}>
            {row.map((date, i) => {
              if (!date) return <View key={i} style={styles.calCell} />;
              const past = date < today;
              const on = date === value;
              const isToday = date === today;
              return (
                <PressableScale
                  key={date}
                  feel={null}
                  pressScale={0.86}
                  accessibilityLabel={parseDate(date).toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  accessibilityState={{ selected: on }}
                  {...(past
                    ? null
                    : {
                        onPress: () => {
                          feel('tap');
                          onChange(date);
                        },
                      })}
                  style={styles.calCell}
                >
                  <View style={[styles.calDay, on && { backgroundColor: c.primary }]}>
                    <AppText
                      variant="label"
                      style={{
                        color: on ? c.onPrimary : past ? c.textFaint : c.text,
                        fontFamily: on || isToday ? fonts.bold : fonts.medium,
                        textDecorationLine: past ? 'line-through' : 'none',
                      }}
                    >
                      {parseDate(date).getDate()}
                    </AppText>
                  </View>
                  {isToday && !on && <View style={[styles.calToday, { backgroundColor: c.primary }]} />}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  semibold: { fontFamily: fonts.semibold },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, marginTop: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.xl, paddingTop: space.md },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: space.xl, paddingTop: space.lg },
  preview: { padding: space.lg, borderRadius: radius.lg },
  previewHead: { flexDirection: 'row', alignItems: 'center' },
  previewText: { flex: 1, marginLeft: space.md },
  previewValue: { marginTop: space.md },
  previewTrack: {
    height: 10,
    borderRadius: radius.pill,
    marginTop: space.sm,
    justifyContent: 'center',
  },
  previewFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
  previewNotch: {
    position: 'absolute',
    width: 10,
    height: 10,
    marginLeft: -5,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  paceHint: { marginTop: space.sm, fontFamily: fonts.semibold },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  titleInput: { flex: 1, padding: 0, marginRight: space.sm },
  error: { marginTop: 6, marginLeft: space.xs },
  label: { marginTop: space.xxl, marginBottom: space.md },
  ideas: { gap: space.sm },
  idea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  ideaText: { marginLeft: 6 },
  numbers: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  fieldLabel: { marginBottom: 6 },
  field: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: 0,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  unitChip: { paddingHorizontal: space.md, paddingVertical: 5, borderRadius: radius.pill },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryText: { marginLeft: 6 },
  preset: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  presetIcon: { marginRight: 5 },
  deadlineLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  deadlineText: { marginLeft: space.sm, flex: 1 },
  description: {
    minHeight: 88,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  calendar: { marginTop: space.md, padding: space.md },
  calHead: { flexDirection: 'row', alignItems: 'center' },
  calTitle: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  calStep: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWeek: { flexDirection: 'row', marginTop: space.md },
  calLetter: { flex: 1, textAlign: 'center' },
  calRow: { flexDirection: 'row' },
  calCell: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  calDay: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calToday: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: radius.pill },
  createBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.md,
    paddingHorizontal: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  create: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  createFill: { borderRadius: radius.pill },
  createIcon: { marginRight: 6 },
});
