/**
 * New habit — the composer (Design Lab, kolo 17).
 *
 * One sheet, everything visible, nothing hidden behind steps:
 *   - a LIVE PREVIEW of the card at the top: name, colour, icon and days change it
 *     as you go, so the result is seen before it exists;
 *   - a big name field and "Start from an idea" — the app's real presets
 *     (habitPresets.ts, onboarding texts): one tap fills name, icon and colour;
 *   - colours from the habit palette only (red and gold are reserved for missed and
 *     bonus — kolo 17), icons from the app's one shared map (HABIT_ICON_MAP);
 *   - days as round toggles + quick picks (every day / weekdays / weekends);
 *   - the same validation as the app's HabitForm (2–50 characters, at least one
 *     day, description ≤ 200), with the app's own error texts; an error shakes
 *     the field instead of a dialog.
 * Create → the sheet settles away and the new card appears in the list.
 *
 * GOING LIVE (1:1): becomes HabitForm/HabitModal for create AND edit. Share the
 * validation with HabitForm (do not copy it twice); icons only via HABIT_ICON_MAP;
 * the sheet's bottom bar must clear the banner + tab bar (lesson 11).
 */
import React, { useEffect, useMemo, useState } from 'react';
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
import i18n from '@/src/config/i18n';
import { HABIT_ICON_MAP, IoniconName } from '@/src/constants/habitIcons';
import { HABIT_PRESETS } from '@/src/constants/habitPresets';
import {
  impact,
  ImpactFeedbackStyle,
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
import {
  labFonts,
  LabHabitColor,
  labRadius,
  labSpace,
  onHabitColor,
} from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { addDays, LabHabit, mondayOf, startOfDay } from './habitsMock';

const COLORS: LabHabitColor[] = [
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
];
const ICONS = Object.values(HABIT_ICON_MAP) as IoniconName[];
const SHEET_TOP = 64;

interface ComposerProps {
  bottomInset: number;
  onClose: () => void;
  onCreate: (habit: LabHabit) => void;
}

export function HabitComposerConcept({
  bottomInset,
  onClose,
  onCreate,
}: ComposerProps) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const k = copy.habits.composer;
  const t = useMemo(() => i18n.getFixedT(lang), [lang]);
  const monday = mondayOf(startOfDay(new Date()));

  const [name, setName] = useState('');
  const [color, setColor] = useState<LabHabitColor>('blue');
  const [icon, setIcon] = useState<IoniconName>(ICONS[0]!);
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const valid =
    trimmed.length >= 2 &&
    trimmed.length <= 50 &&
    days.length > 0 &&
    description.length <= 200;

  // --- Sheet in / out ---------------------------------------------------------------
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

  // --- Feedback ---------------------------------------------------------------------
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
  const ready = useSharedValue(valid ? 1 : 0);
  useEffect(() => {
    ready.value = withTiming(valid ? 1 : 0, { duration: 220 });
  }, [valid, ready]);
  const createStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + 0.55 * ready.value,
  }));

  const create = () => {
    // The app's own rules and texts (HabitForm.validateForm).
    let message: string | null = null;
    if (!trimmed) message = t('habits.form.errors.nameRequired');
    else if (trimmed.length < 2) message = t('habits.form.errors.nameTooShort');
    else if (trimmed.length > 50) message = t('habits.form.errors.nameTooLong');
    else if (days.length === 0) message = t('habits.form.errors.daysRequired');
    else if (description.length > 200)
      message = t('habits.form.errors.descriptionTooLong');
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
    const habit: LabHabit = {
      id: `new-${Date.now()}`,
      icon,
      color,
      name: { en: trimmed, de: trimmed },
      days: [...days].sort(),
      createdDaysAgo: 0,
      streak: 0,
      best: 0,
    };
    dismiss(() => onCreate(habit));
  };

  const scheduleText =
    days.length === 7
      ? k.everyDay
      : days.length === 0
        ? '—'
        : [...days]
            .sort()
            .map(d =>
              addDays(monday, d).toLocaleDateString(copy.locale, {
                weekday: 'short',
              })
            )
            .join(' · ');

  const setQuick = (next: number[]) => {
    selection();
    setDays(next);
    setError(null);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => dismiss(onClose)}
        accessibilityLabel={copy.detail.close}
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
            {k.title}
          </LabText>
          <PressableScale
            onPress={() => dismiss(onClose)}
            pressScale={0.9}
            accessibilityLabel={copy.detail.close}
            style={[
              styles.close,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Ionicons name="close" size={20} color={c.text} />
          </PressableScale>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            contentColumn,
            styles.body,
            { paddingBottom: bottomInset + 100 },
          ]}
        >
          {/* Live preview */}
          <Animated.View entering={FadeInDown.delay(80).duration(260)}>
            <Surface style={styles.preview}>
              <Animated.View style={badgeStyle}>
                <IconBadge icon={icon} color={c.habit[color]} size={48} />
              </Animated.View>
              <View style={{ flex: 1, marginLeft: labSpace.md }}>
                <LabText
                  variant="bodyStrong"
                  tone={trimmed ? 'text' : 'faint'}
                  numberOfLines={2}
                >
                  {trimmed || k.previewName}
                </LabText>
                <LabText
                  variant="caption"
                  tone="muted"
                  style={{ marginTop: 2 }}
                >
                  {scheduleText}
                </LabText>
                <View style={styles.previewDots}>
                  {copy.weekdays.map((letter, i) => {
                    const on = days.includes(i);
                    return (
                      <View key={i} style={{ alignItems: 'center', width: 14 }}>
                        <View
                          style={[
                            styles.previewDot,
                            {
                              borderColor: on ? c.habit[color] : c.track,
                              backgroundColor: on
                                ? `${c.habit[color]}33`
                                : 'transparent',
                            },
                          ]}
                        />
                        <LabText
                          variant="caption"
                          tone="faint"
                          style={styles.previewLetter}
                        >
                          {letter}
                        </LabText>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View
                style={[styles.previewCheck, { borderColor: c.textFaint }]}
              />
            </Surface>
          </Animated.View>

          {/* Name */}
          <Animated.View
            entering={FadeInDown.delay(130).duration(260)}
            style={shakeStyle}
          >
            <View
              style={[
                styles.nameBox,
                {
                  backgroundColor: c.surface,
                  borderColor: error ? c.missed : c.border,
                },
              ]}
            >
              <TextInput
                value={name}
                onChangeText={value => {
                  setName(value);
                  setError(null);
                }}
                placeholder={k.placeholder}
                placeholderTextColor={c.textFaint}
                maxLength={50}
                returnKeyType="done"
                maxFontSizeMultiplier={1.4}
                style={[typeStyle('title', c.text), styles.nameInput]}
              />
              <Text
                style={[typeStyle('caption', c.textFaint)]}
                maxFontSizeMultiplier={1.3}
              >
                {`${trimmed.length}/50`}
              </Text>
            </View>
            {error && (
              <Text
                style={[
                  typeStyle('caption', c.missed),
                  { marginTop: 6, marginLeft: labSpace.xs },
                ]}
              >
                {error}
              </Text>
            )}
          </Animated.View>

          {/* Ideas */}
          <Animated.View entering={FadeInDown.delay(180).duration(260)}>
            <Label text={k.ideas} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: labSpace.sm }}
            >
              {HABIT_PRESETS.map(preset => {
                const presetIcon = HABIT_ICON_MAP[preset.icon];
                const presetColor = preset.color as LabHabitColor;
                return (
                  <PressableScale
                    key={preset.id}
                    pressScale={0.94}
                    accessibilityLabel={t(preset.nameKey)}
                    onPress={() => {
                      setName(t(preset.nameKey));
                      setIcon(presetIcon);
                      setColor(presetColor);
                      setError(null);
                      pop();
                    }}
                    style={[
                      styles.idea,
                      { backgroundColor: c.surface, borderColor: c.border },
                    ]}
                  >
                    <Ionicons
                      name={presetIcon}
                      size={16}
                      color={c.habit[presetColor]}
                    />
                    <LabText variant="label" style={{ marginLeft: 6 }}>
                      {t(preset.nameKey)}
                    </LabText>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Colour */}
          <Animated.View entering={FadeInDown.delay(230).duration(260)}>
            <Label text={t('habits.form.color')} />
            <View style={styles.swatches}>
              {COLORS.map(key => (
                <Swatch
                  key={key}
                  color={c.habit[key]}
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
              {ICONS.map(name => {
                const on = icon === name;
                return (
                  <PressableScale
                    key={name}
                    pressScale={0.88}
                    accessibilityLabel={name}
                    onPress={() => {
                      setIcon(name);
                      pop();
                    }}
                    style={[
                      styles.iconCell,
                      {
                        backgroundColor: on ? `${c.habit[color]}22` : c.surface,
                        borderColor: on ? c.habit[color] : c.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={name}
                      size={22}
                      color={on ? c.habit[color] : c.textMuted}
                    />
                  </PressableScale>
                );
              })}
            </View>
          </Animated.View>

          {/* Days */}
          <Animated.View entering={FadeInDown.delay(330).duration(260)}>
            <Label text={t('habits.form.scheduledDays')} />
            <View style={styles.days}>
              {copy.weekdays.map((letter, i) => (
                <DayToggle
                  key={i}
                  letter={letter}
                  on={days.includes(i)}
                  color={c.habit[color]}
                  onPress={() => {
                    impact(ImpactFeedbackStyle.Light);
                    setError(null);
                    setDays(prev =>
                      prev.includes(i)
                        ? prev.filter(d => d !== i)
                        : [...prev, i]
                    );
                  }}
                />
              ))}
            </View>
            <View style={styles.quick}>
              <QuickChip
                label={k.everyDay}
                onPress={() => setQuick([0, 1, 2, 3, 4, 5, 6])}
              />
              <QuickChip
                label={k.weekdays}
                onPress={() => setQuick([0, 1, 2, 3, 4])}
              />
              <QuickChip label={k.weekends} onPress={() => setQuick([5, 6])} />
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(380).duration(260)}>
            <Label text={t('habits.form.description')} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('habits.form.descriptionPlaceholder')}
              placeholderTextColor={c.textFaint}
              multiline
              maxLength={200}
              maxFontSizeMultiplier={1.5}
              style={[
                typeStyle('body', c.text),
                styles.description,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            />
          </Animated.View>
        </ScrollView>

        {/* Create — fixed above the bottom chrome */}
        <View
          style={[
            styles.createBar,
            {
              paddingBottom: bottomInset + labSpace.sm,
              backgroundColor: c.canvas,
              borderTopColor: c.border,
            },
          ]}
        >
          <Animated.View style={[contentColumn, createStyle]}>
            <PressableScale
              onPress={create}
              haptic={null}
              pressScale={0.97}
              accessibilityLabel={k.create}
              style={styles.create}
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
              <Ionicons
                name="add"
                size={20}
                color={c.onPrimary}
                style={{ marginRight: 6 }}
              />
              <LabText variant="bodyStrong" tone="onPrimary">
                {k.create}
              </LabText>
            </PressableScale>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return (
    <LabText
      variant="overline"
      tone="muted"
      style={{ marginTop: labSpace.xxl, marginBottom: labSpace.md }}
    >
      {text}
    </LabText>
  );
}

function Swatch({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const s = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 320 });
  }, [selected, s]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: s.value,
    transform: [{ scale: 0.8 + 0.2 * s.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.18 * s.value }],
  }));
  return (
    <PressableScale
      pressScale={0.9}
      accessibilityLabel={color}
      onPress={onPress}
      style={styles.swatchHit}
    >
      <Animated.View
        style={[styles.swatchRing, { borderColor: color }, ringStyle]}
      />
      <Animated.View
        style={[styles.swatch, { backgroundColor: color }, dotStyle]}
      >
        {selected && (
          <Ionicons name="checkmark" size={18} color={onHabitColor(color)} />
        )}
      </Animated.View>
    </PressableScale>
  );
}

function DayToggle({
  letter,
  on,
  color,
  onPress,
}: {
  letter: string;
  on: boolean;
  color: string;
  onPress: () => void;
}) {
  const { c } = useLab();
  const s = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    s.value = withSpring(on ? 1 : 0, { damping: 13, stiffness: 300 });
  }, [on, s]);
  const fillStyle = useAnimatedStyle(() => ({
    opacity: s.value,
    transform: [{ scale: 0.6 + 0.4 * s.value }],
  }));
  return (
    <PressableScale
      haptic={null}
      pressScale={0.88}
      onPress={onPress}
      accessibilityLabel={letter}
      style={styles.dayHit}
    >
      <View
        style={[
          styles.day,
          { borderColor: on ? color : c.border, backgroundColor: c.surface },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.dayFill,
            { backgroundColor: color },
            fillStyle,
          ]}
        />
        <Text
          style={[
            typeStyle('label', on ? onHabitColor(color) : c.textMuted),
            { fontFamily: labFonts.bold },
          ]}
        >
          {letter}
        </Text>
      </View>
    </PressableScale>
  );
}

function QuickChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useLab();
  return (
    <PressableScale
      haptic={null}
      pressScale={0.94}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.quickChip, { backgroundColor: c.primarySoft }]}
    >
      <LabText
        variant="caption"
        tone="primary"
        style={{ fontFamily: labFonts.semibold }}
      >
        {label}
      </LabText>
    </PressableScale>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: labSpace.lg,
    borderRadius: labRadius.md + 4,
  },
  previewDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: labSpace.sm,
  },
  previewDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
  },
  previewLetter: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  previewCheck: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    marginLeft: labSpace.sm,
  },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.lg,
    paddingHorizontal: labSpace.lg,
    paddingVertical: labSpace.md,
    borderRadius: labRadius.md,
    borderWidth: 1.5,
  },
  nameInput: {
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
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
  },
  swatchHit: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: labRadius.sm + 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayHit: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayFill: {
    borderRadius: 20,
  },
  quick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
    marginTop: labSpace.md,
  },
  quickChip: {
    paddingHorizontal: labSpace.md,
    paddingVertical: 6,
    borderRadius: labRadius.pill,
  },
  description: {
    minHeight: 84,
    padding: labSpace.lg,
    borderRadius: labRadius.md,
    borderWidth: 1,
    textAlignVertical: 'top',
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
