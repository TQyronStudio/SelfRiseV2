/**
 * Ring — a progress circle with the percentage rolling in its middle (moved from
 * the Design Lab's GoalDetailConcept in migration E2; the lab keeps its copy).
 * The arc fills on the UI thread (Skia path `end`), the number rolls with
 * tabular figures. Reduce motion: the fill jumps to its end (Reanimated default).
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useDesign } from '@/src/contexts/ThemeContext';
import { AppText } from './primitives';
import { RollingNumber } from './RollingNumber';

const RING = 112;
const STROKE = 11;
const FILL_DELAY = 200;
const FILL_MS = 900;

export function Ring({ fraction, color }: { fraction: number; color: string }) {
  const { c } = useDesign();
  const end = useSharedValue(0);
  useEffect(() => {
    end.value = withDelay(
      FILL_DELAY,
      withTiming(Math.min(1, fraction), {
        duration: FILL_MS,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [fraction, end]);
  const arc = useMemo(() => {
    const p = Skia.Path.Make();
    const inset = STROKE / 2 + 1;
    p.addArc(
      Skia.XYWHRect(inset, inset, RING - inset * 2, RING - inset * 2),
      -90,
      359.9
    );
    return p;
  }, []);
  return (
    <View style={{ width: RING, height: RING }}>
      <Canvas style={{ width: RING, height: RING }} pointerEvents="none">
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={RING / 2 - STROKE / 2 - 1}
          style="stroke"
          strokeWidth={STROKE}
          color={c.track}
        />
        <Path
          path={arc}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          color={color}
          start={0}
          end={end}
        />
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <RollingNumber
          text={`${Math.round(fraction * 100)}`}
          variant="numberMd"
        />
        <AppText variant="caption" tone="muted" style={styles.percent}>
          %
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    marginTop: -4,
  },
});
