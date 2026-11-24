/**
 * The habit composer — ONE sheet for creating AND editing a habit (migration E6
 * point 2, from the Design Lab's HabitComposerConcept, kolo 17 + 25).
 *
 * - A LIVE PREVIEW of the card at the top: name, colour, icon and days change it
 *   as you go.
 * - A big name field; "Start from an idea" (create only) — the app's presets
 *   (habitPresets.ts): one tap fills name, icon and colour.
 * - Colours from the habit palette, icons only from HABIT_ICON_MAP, days as round
 *   toggles + quick picks (every day / weekdays / weekends).
 * - The rules are habitFormRules.ts — the same copy the old HabitForm uses; an
 *   error shakes the field and says why, no dialog.
 * - The main button rides on top of the keyboard and clears the banner.
 * - Saving keeps the sheet open until the storage answered: a failure stays in
 *   the sheet with the user's input (submitFailed), success settles it away.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
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
import { fixed, fonts, onHabitColor, radius, space, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { HABIT_ICON_MAP, getHabitIonicon } from '@/src/constants/habitIcons';
import { ALL_DAYS, HABIT_PRESETS } from '@/src/constants/habitPresets';
import { DayOfWeek, HabitColor, HabitIcon } from '@/src/types/common';
import { CreateHabitInput, Habit } from '@/src/types/habit';
import { parseDate, today as todayString } from '@/src/utils/date';
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
import { weekOf } from '@/src/screens/habits/habitListLogic';
import { HABIT_DESCRIPTION_MAX, HABIT_NAME_MAX, habitFormErrors } from '../habitFormRules';

/** The palette in the lab's order (red stays: the missed mark is a × on grey, never a colour alone). */
export const COMPOSER_COLORS: HabitColor[] = [
  HabitColor.BLUE,
  HabitColor.TEAL,
  HabitColor.GREEN,
  HabitColor.YELLOW,
  HabitColor.ORANGE,
  HabitColor.RED,
  HabitColor.PINK,
  HabitColor.PURPLE,
];
const ICONS = Object.keys(HABIT_ICON_MAP) as HabitIcon[];
const WEEKDAYS: DayOfWeek[] = ALL_DAYS.slice(0, 5);
const WEEKEND: DayOfWeek[] = ALL_DAYS.slice(5);
const SHEET_TOP = 64;

export interface HabitComposerProps {
  /** The habit to edit; undefined = a new one. */
  habit: Habit | undefined;
  /** Banner room the bottom bar must clear. */
  bottomInset: number;
  /** Stores the habit; throws when it could not be stored. */
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  /** The sheet is gone (after cancel or a successful save). */
  onClosed: () => void;
}

export function HabitComposer({ habit, bottomInset, onSubmit, onClosed }: HabitComposerProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  useOverlayCover();
  const editing = !!habit;
  const locale = t('common.locale');
  const week = weekOf(todayString());
  const letters = week.map(day => parseDate(day).toLocaleDateString(locale, { weekday: 'narrow' }));

  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState<HabitColor>(habit?.color ?? HabitColor.BLUE);
  const [icon, setIcon] = useState<HabitIcon>(habit?.icon ?? HabitIcon.FITNESS);
  // A new habit starts every day: one tap creates it, a day is easy to take away.
  const [days, setDays] = useState<DayOfWeek[]>(habit?.scheduledDays ?? [...ALL_DAYS]);
  const [description, setDescription] = useState(habit?.description ?? '');
  const [error, setError] = useState<{ field: 'name' | 'days' | 'submit'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const valid = Object.keys(habitFormErrors({ name, scheduledDays: days, description })).length === 0;
  const ordered = ALL_DAYS.filter(d => days.includes(d));
  const color6 = c.habit[color];

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
  const nameRef = useRef<TextInput>(null);
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

  const fail = (field: 'name' | 'days' | 'submit', text: string) => {
    setError({ field, text });
    feel('invalid');
    shake.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 70 }),
      withTiming(-5, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const save = async () => {
    if (saving) return;
    const errors = habitFormErrors({ name, scheduledDays: days, description });
    if (errors.name) return fail('name', t(errors.name));
    if (errors.scheduledDays) return fail('days', t(errors.scheduledDays));
    if (errors.description) return fail('submit', t(errors.description));
    setSaving(true);
    try {
      await onSubmit({
        name: trimmed,
        color,
        icon,
        scheduledDays: ordered,
        // Always sent: an emptied description must clear the old one when editing.
        description: description.trim(),
      } as CreateHabitInput);
      feel('saved');
      dismiss();
    } catch {
      setSaving(false);
      fail('submit', t('habits.form.errors.submitFailed'));
    }
  };

  const scheduleText =
    ordered.length === 7
      ? t('habits.schedule.everyDay')
      : ordered.length === 0
        ? '—'
        : ordered
            .map(d => parseDate(week[ALL_DAYS.indexOf(d)]!).toLocaleDateString(locale, { weekday: 'short' }))
            .join(' · ');

  const setQuick = (next: DayOfWeek[]) => {
    feel('tap');
    setDays(next);
    setError(null);
  };
  const mainLabel = editing ? t('common.save') : t('habits.composer.create');

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
            {editing ? t('habits.composer.editTitle') : t('habits.composer.title')}
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
              <Animated.View style={badgeStyle}>
                <IconBadge icon={getHabitIonicon(icon)} color={color6} size={48} />
              </Animated.View>
              <View style={styles.previewText}>
                <AppText variant="bodyStrong" tone={trimmed ? 'text' : 'faint'} numberOfLines={2}>
                  {trimmed || t('habits.composer.previewName')}
                </AppText>
                <AppText variant="caption" tone="muted" style={styles.previewSchedule}>
                  {scheduleText}
                </AppText>
                <View style={styles.previewDots}>
                  {ALL_DAYS.map((d, i) => {
                    const on = days.includes(d);
                    return (
                      <View key={d} style={styles.previewDay}>
                        <View
                          style={[
                            styles.previewDot,
                            { borderColor: on ? color6 : c.track, backgroundColor: on ? withAlpha(color6, 0.2) : 'transparent' },
                          ]}
                        />
                        <Text maxFontSizeMultiplier={1.2} style={[typeStyle('micro', c.textFaint), styles.previewLetter]}>
                          {letters[i]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={[styles.previewCheck, { borderColor: c.textFaint }]} />
            </Surface>
          </Animated.View>

          {/* Name — the shake sits on an inner view (entering + transform on one view fight). */}
          <Animated.View entering={FadeInDown.delay(130).duration(260)}>
            <Animated.View style={error?.field === 'name' ? shakeStyle : undefined}>
              <View
                style={[
                  styles.nameBox,
                  { backgroundColor: c.surface, borderColor: error?.field === 'name' ? c.missed : c.border },
                ]}
              >
                <TextInput
                  ref={nameRef}
                  onFocus={() => reveal(nameRef.current)}
                  value={name}
                  onChangeText={value => {
                    setName(value);
                    setError(null);
                  }}
                  placeholder={t('habits.composer.placeholder')}
                  placeholderTextColor={c.textFaint}
                  maxLength={HABIT_NAME_MAX}
                  returnKeyType="done"
                  maxFontSizeMultiplier={1.4}
                  accessibilityLabel={t('habits.form.name')}
                  style={[typeStyle('title', c.text), styles.nameInput]}
                />
                <Text style={typeStyle('caption', c.textFaint)} maxFontSizeMultiplier={1.3}>
                  {`${trimmed.length}/${HABIT_NAME_MAX}`}
                </Text>
              </View>
              {error && error.field !== 'days' && (
                <Text accessibilityLiveRegion="polite" style={[typeStyle('caption', c.missed), styles.error]}>
                  {error.text}
                </Text>
              )}
            </Animated.View>
          </Animated.View>

          {/* Ideas — only for a new habit */}
          {!editing && (
            <Animated.View entering={FadeInDown.delay(180).duration(260)}>
              <Label text={t('habits.composer.ideas')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideas}>
                {HABIT_PRESETS.map(preset => (
                  <PressableScale
                    key={preset.id}
                    pressScale={0.94}
                    accessibilityLabel={t(preset.nameKey)}
                    onPress={() => {
                      setName(t(preset.nameKey));
                      setIcon(preset.icon);
                      setColor(preset.color);
                      setError(null);
                      pop();
                    }}
                    style={[styles.idea, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <Ionicons name={getHabitIonicon(preset.icon)} size={16} color={c.habit[preset.color]} />
                    <AppText variant="label" style={styles.ideaText}>
                      {t(preset.nameKey)}
                    </AppText>
                  </PressableScale>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Colour */}
          <Animated.View entering={FadeInDown.delay(230).duration(260)}>
            <Label text={t('habits.form.color')} />
            <View style={styles.swatches}>
              {COMPOSER_COLORS.map(key => (
                <Swatch
                  key={key}
                  color={c.habit[key]}
                  label={t(`habits.colors.${key}`)}
                  selected={color === key}
                  onPress={() => {
                    setColor(key);
                    pop();
                  }}
                />
              ))}
            </View>
          </Animated.View>

          {/* Icon */}
          <Animated.View entering={FadeInDown.delay(280).duration(260)}>
            <Label text={t('habits.form.icon')} />
            <View style={styles.icons}>
              {ICONS.map(key => {
                const on = icon === key;
                return (
                  <PressableScale
                    key={key}
                    pressScale={0.88}
                    accessibilityLabel={key}
                    accessibilityState={{ selected: on }}
                    onPress={() => {
                      setIcon(key);
                      pop();
                    }}
                    style={[
                      styles.iconCell,
                      { backgroundColor: on ? withAlpha(color6, 0.13) : c.surface, borderColor: on ? color6 : c.border },
                    ]}
                  >
                    <Ionicons name={HABIT_ICON_MAP[key]} size={22} color={on ? color6 : c.textMuted} />
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Days */}
          <Animated.View entering={FadeInDown.delay(330).duration(260)}>
            <Label text={t('habits.form.scheduledDays')} />
            <Animated.View style={[styles.days, error?.field === 'days' ? shakeStyle : undefined]}>
              {ALL_DAYS.map((d, i) => (
                <DayToggle
                  key={d}
                  letter={letters[i] ?? ''}
                  label={parseDate(week[i]!).toLocaleDateString(locale, { weekday: 'long' })}
                  on={days.includes(d)}
                  color={color6}
                  onPress={() => {
                    feel('press');
                    setError(null);
                    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));
                  }}
                />
              ))}
            </Animated.View>
            {error?.field === 'days' && (
              <Text accessibilityLiveRegion="polite" style={[typeStyle('caption', c.missed), styles.error]}>
                {error.text}
              </Text>
            )}
            <View style={styles.quick}>
              <QuickChip label={t('habits.schedule.everyDay')} onPress={() => setQuick([...ALL_DAYS])} />
              <QuickChip label={t('habits.schedule.weekdays')} onPress={() => setQuick([...WEEKDAYS])} />
              <QuickChip label={t('habits.schedule.weekends')} onPress={() => setQuick([...WEEKEND])} />
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(380).duration(260)}>
            <Label text={t('habits.form.description')} />
            <TextInput
              ref={descriptionRef}
              onFocus={() => reveal(descriptionRef.current)}
              value={description}
              onChangeText={setDescription}
              placeholder={t('habits.form.descriptionPlaceholder')}
              placeholderTextColor={c.textFaint}
              multiline
              maxLength={HABIT_DESCRIPTION_MAX}
              maxFontSizeMultiplier={1.5}
              accessibilityLabel={t('habits.form.description')}
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
              <Ionicons name={editing ? 'checkmark' : 'add'} size={20} color={c.onPrimary} style={styles.createIcon} />
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

function Swatch({
  color,
  label,
  selected,
  onPress,
}: {
  color: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 320 });
  }, [selected, s]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: s.value, transform: [{ scale: 0.8 + 0.2 * s.value }] }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.18 * s.value }] }));
  return (
    <PressableScale
      pressScale={0.9}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.swatchHit}
    >
      <Animated.View style={[styles.swatchRing, { borderColor: color }, ringStyle]} />
      <Animated.View style={[styles.swatch, { backgroundColor: color }, dotStyle]}>
        {selected && <Ionicons name="checkmark" size={18} color={onHabitColor(color)} />}
      </Animated.View>
    </PressableScale>
  );
}

function DayToggle({
  letter,
  label,
  on,
  color,
  onPress,
}: {
  letter: string;
  label: string;
  on: boolean;
  color: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  const s = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(on ? 1 : 0, { damping: 13, stiffness: 300 });
  }, [on, s]);
  const fillStyle = useAnimatedStyle(() => ({ opacity: s.value, transform: [{ scale: 0.6 + 0.4 * s.value }] }));
  return (
    <PressableScale
      feel={null}
      pressScale={0.88}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={styles.dayHit}
    >
      <View style={[styles.day, { borderColor: on ? color : c.border, backgroundColor: c.surface }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dayFill, { backgroundColor: color }, fillStyle]} />
        <Text style={[typeStyle('label', on ? onHabitColor(color) : c.textMuted), { fontFamily: fonts.bold }]}>
          {letter}
        </Text>
      </View>
    </PressableScale>
  );
}

function QuickChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useDesign();
  return (
    <PressableScale
      feel={null}
      pressScale={0.94}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.quickChip, { backgroundColor: c.primarySoft }]}
    >
      <AppText variant="caption" tone="primary" style={{ fontFamily: fonts.semibold }}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  preview: { flexDirection: 'row', alignItems: 'center', padding: space.lg, borderRadius: radius.md + 4 },
  previewText: { flex: 1, marginLeft: space.md },
  previewSchedule: { marginTop: 2 },
  previewDots: { flexDirection: 'row', gap: 4, marginTop: space.sm },
  previewDay: { alignItems: 'center', width: 14 },
  previewDot: { width: 9, height: 9, borderRadius: radius.pill, borderWidth: 1.5 },
  previewLetter: { marginTop: 2 },
  previewCheck: { width: 30, height: 30, borderRadius: radius.pill, borderWidth: 2, marginLeft: space.sm },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  nameInput: { flex: 1, padding: 0, marginRight: space.sm },
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
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatchHit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  swatchRing: { position: 'absolute', width: 46, height: 46, borderRadius: radius.pill, borderWidth: 2 },
  swatch: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayHit: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  day: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayFill: { borderRadius: radius.pill },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  quickChip: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  description: {
    minHeight: 84,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
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
