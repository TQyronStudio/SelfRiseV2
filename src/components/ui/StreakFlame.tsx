/**
 * StreakFlame — the journal streak as a living flame, from the app's own Lottie
 * animations (moved from the Design Lab in migration E2; the lab keeps its copy).
 *
 * It tells the real story of the journal streak (technical-guides:My-Journal.md):
 * active = fire; a missed day freezes the streak = ice; warming it up (ad / Start
 * Fresh) = the ice cracks, melts, steams and ignites again. The state comes from
 * the caller (GratitudeContext), never from a tap — the lab's tap through the
 * states was for judging the transition only.
 *
 * - A flame nobody sees rests: tabs stay mounted when the user leaves (R-32), so
 *   only the focused screen plays — one ignition, one haptic (useIsFocused). It
 *   needs a navigation screen around it (useIsFocused throws outside one).
 * - A loop pauses while the page scrolls (`rest`, useScrollRest — P79); the
 *   warming plays through, it is a one-off the user started.
 * - Reduce motion: a still frame instead of a loop.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import { feel } from '@/src/services/feelService';
import type { RestSignal } from './scrollChoreography';

const FIRE = require('../../../assets/animations/fire-effect.json');
const ICE = require('../../../assets/animations/ice-effect.json');
const ICE_TO_FIRE = require('../../../assets/animations/ice-to-fire-transition.json');

export type FlameState = 'fire' | 'ice' | 'warming';

interface StreakFlameProps {
  state: FlameState;
  /**
   * The warming played to its end (the flame caught): the caller shows fire.
   * Under reduced motion it comes at once; an unfocused flame reports it after
   * its screen is focused again and the warming has played there.
   */
  onWarmed?: () => void;
  size?: number;
  /** What a screen reader says (e.g. "Streak active", "Streak frozen"). */
  label: string;
  /** The page's rest (useScrollRest): the loop pauses while it scrolls. */
  rest?: RestSignal;
}

export function StreakFlame({
  state,
  onWarmed,
  size = 64,
  label,
  rest,
}: StreakFlameProps) {
  const reducedMotion = useReducedMotion();
  const lottie = useRef<LottieView>(null);
  const onScreen = useIsFocused();
  const still = reducedMotion || !onScreen;

  const source = state === 'fire' ? FIRE : state === 'ice' ? ICE : ICE_TO_FIRE;
  const loop = state !== 'warming';

  // Reduced motion shows a still frame, so the warming would never reach its end
  // (no onAnimationFinish): the flame on the focused screen catches at once
  // instead — only that one, Home and the Journal share one streak. An unfocused
  // flame does it when its screen comes back into focus.
  useEffect(() => {
    if (state !== 'warming' || !reducedMotion || !onScreen) return;
    feel('ignite');
    onWarmed?.();
    // Once per warming; onWarmed's identity must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, reducedMotion, onScreen]);

  // A loop rests while the page scrolls: pause / resume, no remount.
  useEffect(() => {
    if (!rest || still || !loop) return undefined;
    return rest.subscribe(atRest => {
      if (atRest) lottie.current?.resume();
      else lottie.current?.pause();
    });
  }, [rest, still, loop, state]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.box, { width: size, height: size }]}
    >
      <LottieView
        ref={lottie}
        // Remount on every state so each animation starts from its first frame.
        key={`${state}-${still}`}
        source={source}
        autoPlay={!still}
        loop={loop}
        {...(still ? { progress: state === 'ice' ? 0.5 : 0.4 } : null)}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onAnimationFinish={isCancelled => {
          if (state === 'warming' && !isCancelled) {
            feel('ignite');
            onWarmed?.();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
