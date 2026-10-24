/**
 * Achievement unlocked — the celebration, redesigned for the Design Lab
 * (premium-design-plan.md, F1, kolo 8). Look only: real achievement texts from the
 * locales (EN/DE), mock trigger from the lab toolbar.
 *
 * The story follows Home's: the medal RISES like the sun.
 *   1. the screen dims, a glow in the rarity's colour blooms where the medal will be
 *   2. the medal rises and settles with a little overshoot
 *   3. a ring of light draws around it and closes — flash, a burst of light, haptic
 *   4. the headline above, then the name word by word, the description, the XP rolls in
 *   While you look at it, it lives: rays turn slowly, the medal floats, a sheen
 *   crosses its face every few seconds.
 *   On "Continue" the medal flies up into the trophy button in Home's header — it
 *   went to your trophy room — and the panel settles away.
 *
 * Rules kept from the app (technical-guides:Gamification-UI.md, Achievements.md):
 * - rarity tier names stay English; rarity keeps its colour meaning;
 * - haptic strength per rarity (legendary: success + a second beat), screen-reader
 *   announcement with the real text;
 * - one timeline on the UI thread; a tap during the entrance skips to the end;
 * - reduce motion: everything appears in place, no loops;
 * - in the real app this is still ONE modal from ModalQueueContext — the lab draws
 *   it as an overlay only because the lab has no queue.
 *
 * GOING LIVE (1:1):
 * - Stays ONE modal from ModalQueueContext — the queue invariant ("the shown head
 *   is untouchable") must hold; never render it outside the queue.
 * - XP is awarded on Continue (from the button, into the badge) — not on unlock.
 * - Rarity tier labels stay English (technical-guides.md); texts from locales.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import i18n from '@/src/config/i18n';
import {
  impact,
  ImpactFeedbackStyle,
  notification,
  NotificationFeedbackType,
} from '@/src/services/hapticsService';
import { getModalWidth } from '@/src/utils/layout';
import { LabText, PressableScale, typeStyle, useLab } from './labPrimitives';
import {
  labFonts,
  labRadius,
  LabRarity,
  labRarity,
  labSpace,
} from './labTokens';
import { RollingNumber } from './RollingNumber';
import { useLabXp } from './xpFlight';

/** One real achievement per rarity, so all four variants can be judged. */
export const CELEBRATION_SAMPLES: Record<
  LabRarity,
  { key: string; icon: string; xp: number }
> = {
  common: { key: 'first_habit', icon: '🌱', xp: 50 },
  rare: { key: 'habit_builder', icon: '🏗️', xp: 100 },
  epic: { key: 'century_club', icon: '💯', xp: 200 },
  legendary: { key: 'consistency_king', icon: '👑', xp: 500 },
};

const TOTAL = 2000;
const EXIT_MS = 520;
const MEDAL = 132;
const RING_R = 80;
const CANVAS = 340;

/** 0 → 1 inside [start, end] ms of the entrance clock. Eased out, or out-back (overshoot). */
function useWindow(
  t: SharedValue<number>,
  start: number,
  end: number,
  back = false
) {
  return useDerivedValue(() => {
    const x = Math.min(
      1,
      Math.max(0, (t.value * TOTAL - start) / (end - start))
    );
    if (back) {
      const c1 = 1.4;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    return 1 - Math.pow(1 - x, 3);
  });
}

function buildRays(count: number, inner: number, outer: number) {
  const path = Skia.Path.Make();
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2;
    const half = 0.06;
    path.moveTo(Math.cos(a - half) * inner, Math.sin(a - half) * inner);
    path.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    path.lineTo(Math.cos(a + half) * inner, Math.sin(a + half) * inner);
    path.close();
  }
  return path;
}

interface CelebrationProps {
  rarity: LabRarity;
  onClosed: () => void;
}

export function AchievementCelebrationConcept({
  rarity,
  onClosed,
}: CelebrationProps) {
  const { c, mode, lang } = useLab();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const tier = labRarity[rarity];
  const sample = CELEBRATION_SAMPLES[rarity];
  const t = useMemo(() => i18n.getFixedT(lang), [lang]);
  const name = t(`achievements.${sample.key}.name`);
  const description = t(`achievements.${sample.key}.description`);
  const headline = t(`achievements.celebration.rarity_${rarity}`);
  const panelWidth = getModalWidth(width, 0.88);

  // Geometry: the medal sits at a third of the screen, the panel tucks under it.
  const medalCy = Math.max(insets.top + 190, height * 0.33);
  const panelTop = medalCy + MEDAL / 2 - 36;

  // --- One clock for the entrance, one for the exit ------------------------------
  const clock = useSharedValue(0);
  const out = useSharedValue(0);
  const closing = useRef(false);
  const ctaRef = useRef<View>(null);
  const { award } = useLabXp();

  useEffect(() => {
    clock.value = withTiming(1, { duration: TOTAL, easing: Easing.linear });
    AccessibilityInfo.announceForAccessibility(
      t('achievements.celebration.announcement', {
        rarity: tier.label,
        name,
        xp: String(sample.xp),
      })
    );
    // The reveal haptic lands with the ring closing (1.1 s), strength by rarity.
    const id = setTimeout(
      () => {
        if (rarity === 'legendary') {
          notification(NotificationFeedbackType.Success);
          setTimeout(() => impact(ImpactFeedbackStyle.Medium), 300);
        } else {
          impact(
            rarity === 'epic'
              ? ImpactFeedbackStyle.Heavy
              : rarity === 'rare'
                ? ImpactFeedbackStyle.Medium
                : ImpactFeedbackStyle.Light
          );
        }
      },
      reducedMotion ? 0 : 1100
    );
    return () => clearTimeout(id);
    // Mount-only: one celebration = one entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (clock.value < 1) clock.value = withTiming(1, { duration: 220 });
  };

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    impact(ImpactFeedbackStyle.Light);
    stopLoops();
    // The XP is credited only now, on confirmation — and it leaves from the button.
    ctaRef.current?.measureInWindow((x, y, w, h) =>
      award(sample.xp, { x: x + w / 2, y: y + h / 2 })
    );
    out.value = withTiming(
      1,
      { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) scheduleOnRN(onClosed);
      }
    );
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
    // `close` reads refs and shared values only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Windows of the entrance ---------------------------------------------------
  const scrim = useWindow(clock, 0, 260);
  const bloom = useWindow(clock, 100, 760);
  const rise = useWindow(clock, 140, 760, true);
  const ring = useWindow(clock, 520, 1100);
  const burst = useWindow(clock, 1100, 1900);
  const headlineIn = useWindow(clock, 980, 1320);
  const panelIn = useWindow(clock, 820, 1260, true);
  const chipIn = useWindow(clock, 1080, 1380);
  const descIn = useWindow(clock, 1380, 1720);
  const buttonIn = useWindow(clock, 1600, 1980);

  // --- Life while you look: rays turn, medal floats, sheen crosses ---------------
  const spin = useSharedValue(0);
  const float = useSharedValue(0);
  const sheen = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.linear }),
      -1
    );
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    sheen.value = withDelay(
      1300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 2600 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, [spin, float, sheen]);
  function stopLoops() {
    cancelAnimation(spin);
    cancelAnimation(float);
    cancelAnimation(sheen);
  }

  // --- Skia: glow, rays, ring, flash, burst --------------------------------------
  const center = CANVAS / 2;
  const rays = useMemo(
    () => buildRays(rarity === 'legendary' ? 16 : 12, 72, 170),
    [rarity]
  );
  const ringPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(
      Skia.XYWHRect(center - RING_R, center - RING_R, RING_R * 2, RING_R * 2),
      -90,
      359.9
    );
    return p;
  }, [center]);
  const particles = useMemo(
    () =>
      Array.from({ length: tier.particles }, (_, i) => {
        const a = (i / tier.particles) * Math.PI * 2;
        const reach = i % 2 === 0 ? 132 : 108;
        return {
          x: center + Math.cos(a) * reach,
          y: center + Math.sin(a) * reach,
          r: i % 3 === 0 ? 3.4 : 2.4,
        };
      }),
    [tier.particles, center]
  );

  const glowR = useDerivedValue(() => 90 + 70 * bloom.value);
  const glowOpacity = useDerivedValue(
    () => 0.75 * bloom.value * (1 - out.value)
  );
  const raysTransform = useDerivedValue(() => [
    { rotate: spin.value * Math.PI * 2 },
    { scale: 0.6 + 0.4 * bloom.value },
  ]);
  const raysOpacity = useDerivedValue(
    () => 0.55 * bloom.value * (1 - out.value)
  );
  const flashR = useDerivedValue(() => RING_R + 60 * burst.value);
  const flashOpacity = useDerivedValue(() =>
    burst.value <= 0 || burst.value >= 1 ? 0 : 0.7 * (1 - burst.value)
  );
  const burstTransform = useDerivedValue(() => [
    { scale: 0.45 + 0.75 * burst.value },
  ]);
  const burstOpacity = useDerivedValue(() =>
    burst.value <= 0 ? 0 : 1 - burst.value
  );
  const ringOpacity = useDerivedValue(() => 1 - out.value);

  // --- RN views -------------------------------------------------------------------
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: 0.78 * scrim.value * (1 - out.value),
  }));
  const canvasStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * float.value }],
  }));
  // Exit: the medal flies up into the trophy button in Home's header.
  const flyX = width - 108 - width / 2;
  const flyY = insets.top + 108 - medalCy;
  const medalStyle = useAnimatedStyle(() => ({
    opacity:
      Math.min(1, rise.value * 1.4) *
      (1 - interpolate(out.value, [0.75, 1], [0, 1], 'clamp')),
    transform: [
      { translateX: flyX * out.value },
      {
        translateY: (1 - rise.value) * 90 - 4 * float.value + flyY * out.value,
      },
      { scale: (0.55 + 0.45 * rise.value) * (1 - 0.82 * out.value) },
    ],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(sheen.value, [0, 1], [-MEDAL, MEDAL]) },
      { rotate: '20deg' },
    ],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineIn.value * (1 - out.value),
    transform: [{ translateY: (1 - headlineIn.value) * 14 - 10 * out.value }],
  }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, panelIn.value * 1.5) * (1 - out.value),
    transform: [
      { translateY: (1 - panelIn.value) * 40 + 30 * out.value },
      { scale: 0.96 + 0.04 * panelIn.value },
    ],
  }));
  const chipStyle = useAnimatedStyle(() => ({
    opacity: chipIn.value,
    transform: [{ scale: 0.85 + 0.15 * chipIn.value }],
  }));
  const descStyle = useAnimatedStyle(() => ({
    opacity: descIn.value,
    transform: [{ translateY: (1 - descIn.value) * 8 }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonIn.value,
    transform: [{ translateY: (1 - buttonIn.value) * 12 }],
  }));

  const nameWords = name.split(' ');

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={skip}
        accessibilityLabel={headline}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
        />
      </Pressable>

      {/* Light behind the medal */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.canvasWrap,
          { top: medalCy - CANVAS / 2, left: (width - CANVAS) / 2 },
          canvasStyle,
        ]}
      >
        <Canvas style={{ width: CANVAS, height: CANVAS }}>
          <Circle cx={center} cy={center} r={glowR} opacity={glowOpacity}>
            <RadialGradient
              c={vec(center, center)}
              r={glowR}
              colors={[tier.glow, `${tier.glow}00`]}
            />
          </Circle>
          <Group
            transform={raysTransform}
            origin={vec(center, center)}
            opacity={raysOpacity}
          >
            <Path
              path={rays}
              transform={[{ translateX: center }, { translateY: center }]}
            >
              <RadialGradient
                c={vec(0, 0)}
                r={170}
                colors={[tier.glow, `${tier.glow}00`]}
              />
            </Path>
          </Group>
          <Path
            path={ringPath}
            style="stroke"
            strokeWidth={4}
            strokeCap="round"
            start={0}
            end={ring}
            opacity={ringOpacity}
          >
            <SkiaLinearGradient
              start={vec(center - RING_R, center - RING_R)}
              end={vec(center + RING_R, center + RING_R)}
              colors={[...tier.ring]}
            />
          </Path>
          <Circle cx={center} cy={center} r={flashR} opacity={flashOpacity}>
            <RadialGradient
              c={vec(center, center)}
              r={flashR}
              colors={['#FFFFFF', `${tier.glow}00`]}
            />
          </Circle>
          <Group
            transform={burstTransform}
            origin={vec(center, center)}
            opacity={burstOpacity}
          >
            {particles.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r}
                color={i % 2 === 0 ? tier.glow : '#FFFFFF'}
              />
            ))}
          </Group>
        </Canvas>
      </Animated.View>

      {/* Headline above the medal — the guide's voice */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.headline,
          { top: medalCy - MEDAL / 2 - 78, width },
          headlineStyle,
        ]}
      >
        <Text
          maxFontSizeMultiplier={1.3}
          style={[typeStyle('title', '#FFFFFF', true), { textAlign: 'center' }]}
        >
          {headline}
        </Text>
      </Animated.View>

      {/* The panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            top: panelTop,
            width: panelWidth,
            left: (width - panelWidth) / 2,
            backgroundColor: c.surface,
            borderColor: c.border,
          },
          panelStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.chip,
            { backgroundColor: tier.chipBg[mode] },
            chipStyle,
          ]}
        >
          <Ionicons
            name="star"
            size={12}
            color={tier.chipText[mode]}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              typeStyle('overline', tier.chipText[mode]),
              { letterSpacing: 1.6 },
            ]}
          >
            {tier.label}
          </Text>
        </Animated.View>

        <View style={styles.nameRow}>
          {nameWords.map((word, i) => (
            <NameWord
              key={`${word}-${i}`}
              word={`${word}${i < nameWords.length - 1 ? ' ' : ''}`}
              clock={clock}
              start={1150 + i * 80}
            />
          ))}
        </View>

        <Animated.View style={descStyle}>
          <LabText
            variant="body"
            tone="muted"
            style={{ textAlign: 'center', marginTop: labSpace.sm }}
          >
            {description}
          </LabText>
        </Animated.View>

        <Animated.View style={[styles.xpRow, descStyle]}>
          <Ionicons
            name="sparkles"
            size={20}
            color={c.reward}
            style={{ marginRight: labSpace.sm }}
          />
          <RollingNumber
            text={`+${sample.xp} XP`}
            variant="number"
            delay={reducedMotion ? 0 : 1450}
            style={{
              color: mode === 'light' ? c.rewardText : c.reward,
              fontSize: 34,
              lineHeight: 40,
            }}
          />
        </Animated.View>
        <LabText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
          {t('achievements.celebration.xp_earned')}
        </LabText>

        <Animated.View
          ref={ctaRef}
          collapsable={false}
          style={[{ alignSelf: 'stretch' }, buttonStyle]}
        >
          <PressableScale
            onPress={close}
            haptic={null}
            accessibilityLabel={t('achievements.celebration.continue_button')}
            style={styles.cta}
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
            <LabText variant="bodyStrong" tone="onPrimary">
              {t('achievements.celebration.continue_button')}
            </LabText>
          </PressableScale>
        </Animated.View>
      </Animated.View>

      {/* The medal — above the panel, flies to the trophy room on close */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.medalWrap,
          { top: medalCy - MEDAL / 2, left: (width - MEDAL) / 2 },
          medalStyle,
        ]}
      >
        <LinearGradient
          colors={tier.ring}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.medalRing}
        >
          <View style={[styles.medalFace, { backgroundColor: c.surface }]}>
            <LinearGradient
              colors={[`${tier.glow}33`, `${tier.glow}00`]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.medalIcon} maxFontSizeMultiplier={1}>
              {sample.icon}
            </Text>
            {!reducedMotion && (
              <Animated.View style={[styles.sheen, sheenStyle]}>
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.55)',
                    'rgba(255,255,255,0)',
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

/** One word of the achievement name, rising in its own beat. */
function NameWord({
  word,
  clock,
  start,
}: {
  word: string;
  clock: SharedValue<number>;
  start: number;
}) {
  const p = useWindow(clock, start, start + 380);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 14 }],
  }));
  return (
    <Animated.View style={style}>
      <LabText variant="display" style={styles.nameText}>
        {word}
      </LabText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: '#05060C',
  },
  canvasWrap: {
    position: 'absolute',
    width: CANVAS,
    height: CANVAS,
  },
  headline: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: labSpace.xxl,
  },
  panel: {
    position: 'absolute',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingTop: 52,
    paddingHorizontal: labSpace.xxl,
    paddingBottom: labSpace.xxl,
    boxShadow: '0px 24px 60px rgba(0, 0, 0, 0.45)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: labSpace.md,
    paddingVertical: 5,
    borderRadius: labRadius.pill,
  },
  nameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: labSpace.md,
  },
  nameText: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: labFonts.display,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xl,
  },
  cta: {
    marginTop: labSpace.xl,
    paddingVertical: labSpace.lg,
    borderRadius: labRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medalWrap: {
    position: 'absolute',
    width: MEDAL,
    height: MEDAL,
  },
  medalRing: {
    width: MEDAL,
    height: MEDAL,
    borderRadius: MEDAL / 2,
    padding: 8,
    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.35)',
  },
  medalFace: {
    flex: 1,
    borderRadius: MEDAL / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medalIcon: {
    fontSize: 54,
    lineHeight: 64,
  },
  sheen: {
    position: 'absolute',
    top: -MEDAL / 2,
    width: 34,
    height: MEDAL * 2,
  },
});
