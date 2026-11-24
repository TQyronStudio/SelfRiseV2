/**
 * The week on the Habits screen (migration E5, from the Design Lab's WeekStrip):
 * seven days, each a small ring — how much of that day's plan was kept. Today is
 * lifted. Future days have an empty ring.
 *
 * All seven rings are drawn in ONE Skia canvas (card E5 point 2a — the lab drew
 * seven); each ring fills on the UI thread. The day letters and dates are text
 * on top, so they scale with the system font.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fonts, radius, space } from '@/src/design/tokens';
import { AppText } from '@/src/components/ui';

const RING = 30;
const STROKE = 3;

export interface WeekDay {
  key: string;
  letter: string;
  date: number;
  /** 0…1 of the day's plan kept. */
  fraction: number;
  isToday: boolean;
  future: boolean;
}

export function WeekStrip({ days }: { days: WeekDay[] }) {
  const { c } = useDesign();
  const [width, setWidth] = useState(0);
  // Where the rings sit: measured, because the day letter above them grows with
  // the system text size.
  const [ringTop, setRingTop] = useState<number | null>(null);
  const column = width / Math.max(days.length, 1);

  return (
    <View
      style={styles.row}
      onLayout={e => {
        const w = e.nativeEvent.layout.width;
        setWidth(prev => (prev === w ? prev : w));
      }}
    >
      {days.map((day, i) => (
        <View
          key={day.key}
          style={[
            styles.column,
            day.isToday && { backgroundColor: c.primarySoft },
          ]}
        >
          <AppText variant="caption" tone={day.isToday ? 'primary' : 'muted'}>
            {day.letter}
          </AppText>
          <View
            style={styles.ringBox}
            {...(i === 0
              ? {
                  onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
                    const y = e.nativeEvent.layout.y;
                    setRingTop(prev => (prev === y ? prev : y));
                  },
                }
              : null)}
          >
            <AppText
              variant="caption"
              tone={day.isToday ? 'primary' : day.future ? 'faint' : 'text'}
              style={{ fontFamily: day.isToday ? fonts.bold : fonts.semibold }}
            >
              {day.date}
            </AppText>
          </View>
        </View>
      ))}
      {width > 0 && ringTop !== null && (
        <Canvas
          style={[styles.canvas, { width, top: ringTop }]}
          pointerEvents="none"
        >
          {days.map((day, i) => (
            <DayRing
              key={day.key}
              cx={column * (i + 0.5)}
              fraction={day.fraction}
              future={day.future}
              delay={200 + i * 50}
              track={c.track}
              fill={day.fraction >= 1 ? c.success : c.primary}
            />
          ))}
        </Canvas>
      )}
    </View>
  );
}

/** One ring inside the shared canvas; fills from its last value to the new one. */
function DayRing({
  cx,
  fraction,
  future,
  delay,
  track,
  fill,
}: {
  cx: number;
  fraction: number;
  future: boolean;
  delay: number;
  track: string;
  fill: string;
}) {
  const progress = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    progress.value = first.current
      ? withDelay(
          delay,
          withTiming(fraction, {
            duration: 600,
            easing: Easing.out(Easing.cubic),
          })
        )
      : withTiming(fraction, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
    first.current = false;
  }, [fraction, delay, progress]);

  const arc = useMemo(() => {
    const p = Skia.Path.Make();
    const r = RING / 2 - STROKE;
    p.addArc(Skia.XYWHRect(cx - r, RING / 2 - r, r * 2, r * 2), -90, 359.9);
    return p;
  }, [cx]);

  return (
    <>
      <Circle
        cx={cx}
        cy={RING / 2}
        r={RING / 2 - STROKE}
        style="stroke"
        strokeWidth={STROKE}
        color={track}
      />
      {!future && <RingFill path={arc} end={progress} color={fill} />}
    </>
  );
}

function RingFill({
  path,
  end,
  color,
}: {
  path: ReturnType<typeof Skia.Path.Make>;
  end: SharedValue<number>;
  color: string;
}) {
  const clamped = useDerivedValue(() => Math.min(1, Math.max(0, end.value)));
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={STROKE}
      strokeCap="round"
      color={color}
      start={0}
      end={clamped}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: space.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  ringBox: {
    width: RING,
    height: RING,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'absolute',
    left: 0,
    height: RING,
  },
});
