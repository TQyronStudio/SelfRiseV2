/**
 * The log sheet of a goal (migration E14, from the Design Lab's goalParts
 * LogSheet) — "Other" on the card. Its own number pad (no system keyboard for
 * the number), Add / Subtract / Set to (the storage's progress types 1:1), the
 * value before → after with its percent, the card's usual amounts, the date
 * (Today / Yesterday / another day, the old form's date rule) and a note.
 *
 * Saving closes the sheet first and then logs (the page does the rest: undo note,
 * completion window). A wrong amount or date shakes and says why, in the sheet.
 */
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fonts, radius, space } from '@/src/design/tokens';
import { goalLook } from '@/src/constants/goalLook';
import { feel } from '@/src/services/feelService';
import { registerXpOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import { AddGoalProgressInput, Goal } from '@/src/types/goal';
import { DateString } from '@/src/types/common';
import { fractionOf, quickAmounts } from '@/src/utils/goalCalculations';
import { subtractDays, today as todayString } from '@/src/utils/date';
import { progressDateError } from '@/src/components/goals/progressEntryRules';
import {
  AppText,
  BottomSheet,
  IconBadge,
  PressableScale,
  PrimaryButton,
  typeStyle,
} from '@/src/components/ui';
import {
  formatGoalNumber,
  groupTyped,
  logAmountError,
  logInput,
  LogMode,
  typeKey,
  valueAfter,
} from '@/src/screens/goals/goalsPageLogic';

type DayChoice = 'today' | 'yesterday' | 'other';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];

export function GoalLogSheet({
  goal,
  bottomInset,
  onClosed,
  onSave,
}: {
  goal: Goal;
  bottomInset: number;
  onClosed: () => void;
  onSave: (input: AddGoalProgressInput, mode: LogMode) => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const locale = t('common.locale');
  const look = goalLook(goal.category);
  const color = c.habit[look.color];
  const unit = goal.unit.trim();
  const [mode, setMode] = useState<LogMode>('add');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState<DayChoice>('today');
  const [otherDate, setOtherDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saveRef = useRef<View>(null);
  const amount = Number(text) || 0;
  const after = valueAfter(goal.currentValue, mode, amount);
  const percentAfter = Math.round(fractionOf(goal, after) * 100);

  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const press = (key: string) => {
    feel('tap');
    setError(null);
    setText(prev => typeKey(prev, key));
  };

  const today = todayString();
  const dateOf = (): DateString =>
    day === 'today' ? today : day === 'yesterday' ? subtractDays(today, 1) : (otherDate.trim() as DateString);

  const sign = mode === 'add' ? '+' : mode === 'subtract' ? '−' : '';

  return (
    <BottomSheet bottomInset={bottomInset} onClosed={onClosed} keyboardAware label={t('common.cancel')}>
      {dismiss => {
        const save = () => {
          const amountError = logAmountError(amount);
          const dateError = day === 'other' ? progressDateError(otherDate, today) : null;
          const message = amountError
            ? t(`goals.progress.form.errors.${amountError}`)
            : dateError === 'format'
              ? t('goals.progress.form.errors.invalidDate')
              : dateError === 'future'
                ? t('goals.progress.form.errors.futureDate')
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
          const input = logInput(goal.id, mode, amount, note, dateOf());
          const node = saveRef.current;
          if (!node) return dismiss(() => onSave(input, mode));
          node.measureInWindow((x, y, w, h) => {
            registerXpOrigin({ source: 'goal_progress', sourceId: goal.id }, { x: x + w / 2, y: y + h / 2 });
            dismiss(() => onSave(input, mode));
          });
        };

        return (
          <>
            <View style={styles.head}>
              <IconBadge icon={look.icon} color={color} size={36} />
              <AppText variant="titleSm" numberOfLines={1} style={styles.title}>
                {goal.title}
              </AppText>
            </View>

            <View style={[styles.segment, { backgroundColor: c.track }]}>
              {(['add', 'subtract', 'set'] as LogMode[]).map(m => {
                const on = m === mode;
                return (
                  <PressableScale
                    key={m}
                    pressScale={0.95}
                    feel="tap"
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(`goals.progress.form.types.${m}`)}
                    onPress={() => {
                      setMode(m);
                      setError(null);
                    }}
                    style={[styles.segmentItem, on && { backgroundColor: c.surface }]}
                  >
                    <AppText variant="caption" style={[styles.semibold, { color: on ? c.text : c.textMuted }]}>
                      {t(`goals.progress.form.types.${m}`)}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>

            {/* The number */}
            <Animated.View style={[styles.display, shakeStyle]}>
              <AppText variant="overline" tone="muted">
                {t(`goals.progress.form.types.${mode}`)}
              </AppText>
              <Text
                style={typeStyle('number', text ? c.text : c.textFaint)}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityLiveRegion="polite"
              >
                {`${sign}${groupTyped(text, locale) || '0'}`}
                {unit ? <Text style={typeStyle('title', c.textMuted)}>{` ${unit}`}</Text> : null}
              </Text>
              <AppText variant="caption" tone="muted">
                {`${formatGoalNumber(goal.currentValue, locale)} → ${formatGoalNumber(after, locale)}${unit ? ` ${unit}` : ''} · ${percentAfter} %`}
              </AppText>
            </Animated.View>
            {error && (
              <AppText variant="caption" style={[styles.error, { color: c.danger }]}>
                {error}
              </AppText>
            )}

            {/* The card's usual amounts */}
            <View style={styles.amounts}>
              {quickAmounts(goal.targetValue).map(q => (
                <PressableScale
                  key={q}
                  pressScale={0.92}
                  feel="tap"
                  accessibilityLabel={formatGoalNumber(q, locale)}
                  onPress={() => {
                    setError(null);
                    setText(String(q));
                  }}
                  style={[styles.amountChip, { backgroundColor: c.track }]}
                >
                  <AppText variant="label" style={styles.semibold}>
                    {formatGoalNumber(q, locale)}
                  </AppText>
                </PressableScale>
              ))}
            </View>

            <View style={styles.pad}>
              {PAD.map(key => (
                <PressableScale
                  key={key}
                  feel={null}
                  pressScale={0.9}
                  accessibilityLabel={key === 'back' ? t('common.delete') : key}
                  onPress={() => press(key)}
                  style={[styles.padKey, { backgroundColor: c.track }]}
                >
                  {key === 'back' ? (
                    <Ionicons name="backspace-outline" size={20} color={c.text} />
                  ) : (
                    <AppText variant="title">{key === '.' ? (1.5).toLocaleString(locale).charAt(1) : key}</AppText>
                  )}
                </PressableScale>
              ))}
            </View>

            {/* When — today unless told otherwise (the old form's date rule) */}
            <View style={styles.days}>
              {(['today', 'yesterday', 'other'] as DayChoice[]).map(d => {
                const on = d === day;
                const label =
                  d === 'today'
                    ? t('common.dates.today')
                    : d === 'yesterday'
                      ? t('common.dates.yesterday')
                      : t('goals.log.otherDate');
                return (
                  <PressableScale
                    key={d}
                    pressScale={0.95}
                    feel="tap"
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={label}
                    onPress={() => {
                      setDay(d);
                      setError(null);
                    }}
                    style={[
                      styles.dayChip,
                      { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.primarySoft : 'transparent' },
                    ]}
                  >
                    <AppText variant="caption" style={[styles.semibold, { color: on ? c.primary : c.textMuted }]}>
                      {label}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
            {day === 'other' && (
              <TextInput
                value={otherDate}
                onChangeText={value => {
                  setOtherDate(value);
                  setError(null);
                }}
                placeholder={t('goals.progress.form.placeholders.date')}
                placeholderTextColor={c.textFaint}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                accessibilityLabel={t('goals.progress.form.date')}
                style={[typeStyle('body', c.text), styles.field, { backgroundColor: c.canvas, borderColor: c.border }]}
              />
            )}

            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={200}
              placeholder={t('goals.progress.form.placeholders.note')}
              placeholderTextColor={c.textFaint}
              accessibilityLabel={t('goals.progress.form.note')}
              style={[typeStyle('body', c.text), styles.field, { backgroundColor: c.canvas, borderColor: c.border }]}
            />

            <View style={styles.save}>
              <PrimaryButton label={t('goals.progress.form.submit')} onPress={save} buttonRef={saveRef} />
            </View>
          </>
        );
      }}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: space.md,
    flex: 1,
  },
  semibold: {
    fontFamily: fonts.semibold,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 3,
    marginTop: space.lg,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  display: {
    alignItems: 'center',
    marginTop: space.lg,
  },
  error: {
    textAlign: 'center',
    marginTop: space.xs,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.md,
  },
  amountChip: {
    paddingHorizontal: space.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.sm,
    marginTop: space.md,
  },
  padKey: {
    width: '31.5%',
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  dayChip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  field: {
    marginTop: space.sm,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: 0,
  },
  save: {
    marginTop: space.md,
  },
});
