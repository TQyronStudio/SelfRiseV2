/**
 * StreakFlame — the journal streak as a living flame (premium-design-plan.md, F1,
 * kolo 6), made from the app's own Lottie animations that sat unused in
 * assets/animations since the 2026-07 dead-code sweep.
 *
 * It tells the real story of the journal streak (technical-guides:My-Journal.md):
 * active = fire; a missed day freezes the streak = ice; warming it up (ad / Start
 * Fresh in the real app) = the ice cracks, melts, steams and ignites again.
 * In the lab a tap walks through those states so the transition can be judged.
 *
 * Reduce motion: a still frame instead of a loop.
 *
 * GOING LIVE (1:1): the state comes from GratitudeContext (frozen streak = ice,
 * paid debt / Start Fresh = warming), NOT from a tap — the tap is lab-only.
 * Lottie needs lottie-react-native in the native build (it is, as of 7.0.2).
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import {
  notification,
  NotificationFeedbackType,
  selection,
} from '@/src/services/hapticsService';
import { PressableScale } from './labPrimitives';

const FIRE = require('../../../assets/animations/fire-effect.json');
const ICE = require('../../../assets/animations/ice-effect.json');
const ICE_TO_FIRE = require('../../../assets/animations/ice-to-fire-transition.json');

export type FlameState = 'fire' | 'ice' | 'warming';

interface StreakFlameProps {
  state: FlameState;
  onStateChange: (next: FlameState) => void;
  size?: number;
  label: string;
}

export function StreakFlame({
  state,
  onStateChange,
  size = 64,
  label,
}: StreakFlameProps) {
  const reducedMotion = useReducedMotion();
  // Remount on every state so each animation starts from its first frame.
  const [playKey, setPlayKey] = useState(0);

  const source = state === 'fire' ? FIRE : state === 'ice' ? ICE : ICE_TO_FIRE;
  const loop = state !== 'warming';

  return (
    <PressableScale
      haptic={null}
      pressScale={0.92}
      accessibilityLabel={label}
      onPress={() => {
        if (state === 'warming') return;
        selection();
        setPlayKey(k => k + 1);
        onStateChange(state === 'fire' ? 'ice' : 'warming');
      }}
      style={[styles.hit, { width: size, height: size }]}
    >
      <View pointerEvents="none" style={{ width: size, height: size }}>
        <LottieView
          key={`${state}-${playKey}`}
          source={source}
          autoPlay={!reducedMotion}
          loop={loop}
          {...(reducedMotion
            ? { progress: state === 'ice' ? 0.5 : 0.4 }
            : null)}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onAnimationFinish={isCancelled => {
            if (state === 'warming' && !isCancelled) {
              notification(NotificationFeedbackType.Success);
              onStateChange('fire');
            }
          }}
        />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
