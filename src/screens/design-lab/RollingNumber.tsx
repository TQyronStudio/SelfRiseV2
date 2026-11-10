/**
 * RollingNumber — digits roll like an odometer instead of counting or jumping
 * (premium-design-plan.md, F1, kolo 6). The same idea as iOS's numeric content
 * transition: only the digits that change move, each one in its own column.
 *
 * - Each digit is a column 0–9 that slides (translateY) — transform only, UI thread.
 * - Columns are keyed from the right, so "145" → "170" rolls the tens and ones
 *   and leaves the hundreds still.
 * - Tabular figures (Figtree) keep every column the same width: nothing shifts.
 * - `source` (single digit only) drives the column continuously from another
 *   animation — the day count rolls exactly with the sun.
 * - Inside a ScrollCard the first roll waits until the card is on screen.
 * - Reduce motion: springs jump to the final digit (Reanimated default).
 *
 * GOING LIVE (1:1): shared component as is. Digits need tabular figures (Figtree);
 * Fraunces has none — never roll a serif number.
 */
import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated as RNAnimated,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import { LabTone, toneColor, typeStyle, useLab } from './labPrimitives';
import { labType, LabTypeVariant } from './labTokens';
import { seenDelay, useCardSeen } from './scrollChoreography';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ROLL_SPRING = { damping: 17, stiffness: 150, mass: 0.9 };
/** Columns further left start a beat later — the roll reads right to left like a counter. */
const COLUMN_STAGGER = 45;

interface RollingNumberProps {
  /** The full text, e.g. "+145 XP today", "16,512 XP", "3/5". Only digits roll. */
  text: string;
  variant?: LabTypeVariant;
  tone?: LabTone;
  /** Planned start of the first roll (ms after mount). */
  delay?: number;
  /** Continuous driver for a single-digit number (e.g. sun × habits). */
  source?: SharedValue<number>;
  /**
   * false = the first value just stands there; only later changes roll. For lists
   * of many numbers (goal cards): 30 springs at once on opening a tab stutter.
   */
  rollIn?: boolean;
  style?: StyleProp<TextStyle>;
}

export function RollingNumber({
  text,
  variant = 'numberSm',
  tone = 'text',
  delay = 0,
  source,
  rollIn = true,
  style,
}: RollingNumberProps) {
  const { c } = useLab();
  const { fontScale } = useWindowDimensions();
  const t = labType[variant];
  // Margins belong to the whole number, not to each digit: inside a digit's
  // clipped column a margin shifts the digit out of view (kolo 20 — "9" showed
  // as a sliver under the ⭐). Split them off onto the row.
  const {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    marginStart,
    marginEnd,
    ...ownText
  } = StyleSheet.flatten([typeStyle(variant, toneColor(c, tone)), style]);
  const rowMargins = {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    marginStart,
    marginEnd,
  };
  const textStyle = ownText;
  // Column height follows the system text size, capped like the text itself.
  const flat = ownText;
  const lineHeight =
    (flat.lineHeight ?? t.lineHeight) * Math.min(fontScale, t.maxScale);

  const chars = Array.from(text);
  let digitIndexFromRight = 0;
  const columns = chars
    .map((ch, i) => ({ ch, keyFromRight: chars.length - 1 - i }))
    .reverse()
    .map(col => {
      const isDigit = /[0-9]/.test(col.ch);
      const order = isDigit ? digitIndexFromRight++ : -1;
      return { ...col, isDigit, order };
    })
    .reverse();

  return (
    <View style={[styles.row, rowMargins]} accessible accessibilityLabel={text}>
      {columns.map(col =>
        col.isDigit ? (
          <DigitColumn
            key={`d${col.keyFromRight}`}
            digit={Number(col.ch)}
            height={lineHeight}
            textStyle={textStyle}
            maxScale={t.maxScale}
            delay={delay + col.order * COLUMN_STAGGER}
            source={source && chars.length === 1 ? source : undefined}
            rollIn={rollIn}
          />
        ) : (
          <Text
            key={`c${col.keyFromRight}`}
            style={[textStyle, { lineHeight }]}
            maxFontSizeMultiplier={t.maxScale}
            importantForAccessibility="no"
          >
            {col.ch}
          </Text>
        )
      )}
    </View>
  );
}

function DigitColumn({
  digit,
  height,
  textStyle,
  maxScale,
  delay,
  source,
  rollIn,
}: {
  digit: number;
  height: number;
  textStyle: StyleProp<TextStyle>;
  maxScale: number;
  delay: number;
  source: SharedValue<number> | undefined;
  rollIn: boolean;
}) {
  const digits = DIGITS.map(d => (
    <Text
      key={d}
      style={[textStyle, { height, lineHeight: height, textAlign: 'center' }]}
      maxFontSizeMultiplier={maxScale}
    >
      {d}
    </Text>
  ));

  return (
    <View
      style={{ height, overflow: 'hidden' }}
      importantForAccessibility="no-hide-descendants"
    >
      {/* Reserves one tabular digit's width. */}
      <Text
        style={[textStyle, { lineHeight: height, opacity: 0 }]}
        maxFontSizeMultiplier={maxScale}
      >
        8
      </Text>
      {source ? (
        <SourceStrip source={source} height={height}>
          {digits}
        </SourceStrip>
      ) : (
        <SpringStrip
          digit={digit}
          height={height}
          delay={delay}
          rollIn={rollIn}
        >
          {digits}
        </SpringStrip>
      )}
    </View>
  );
}

/** Driven frame by frame by another animation (the sun on Home) — Reanimated. */
function SourceStrip({
  source,
  height,
  children,
}: {
  source: SharedValue<number>;
  height: number;
  children: ReactNode;
}) {
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -source.value * height }],
  }));
  return (
    <Animated.View style={[styles.strip, stripStyle]}>{children}</Animated.View>
  );
}

/**
 * An ordinary roll: RN Animated with the native driver (kolo 27). No ShadowTree
 * commits, and a React commit cannot pause it — with Reanimated, every digit also
 * stayed in the props map that each React commit has to re-apply.
 * The target lives in a JS ref: never read a shared value from JS (lesson 45).
 */
function SpringStrip({
  digit,
  height,
  delay,
  rollIn,
  children,
}: {
  digit: number;
  height: number;
  delay: number;
  rollIn: boolean;
  children: ReactNode;
}) {
  const { seen, seenAfter } = useCardSeen();
  const reducedMotion = useReducedMotion();
  const position = useRef(new RNAnimated.Value(rollIn ? 0 : digit)).current;
  const target = useRef(rollIn ? 0 : digit);
  const startIn = seenDelay(seenAfter, delay);

  useEffect(() => {
    if (!seen || target.current === digit) return;
    target.current = digit;
    if (reducedMotion) {
      position.setValue(digit);
      return;
    }
    RNAnimated.spring(position, {
      toValue: digit,
      ...ROLL_SPRING,
      delay: startIn,
      useNativeDriver: true,
    }).start();
  }, [digit, seen, startIn, position, reducedMotion]);

  const translateY = useMemo(
    () => RNAnimated.multiply(position, -height),
    [position, height]
  );
  return (
    <RNAnimated.View style={[styles.strip, { transform: [{ translateY }] }]}>
      {children}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  strip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
