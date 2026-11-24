/**
 * The big trophy window (migration E8 step 3; from the Design Lab's
 * AchievementCelebrationConcept, kolo 8 / 33 / 53). Epic and legendary only —
 * common and rare are a quiet note at the badge (trophyBatch.ts).
 *
 * A VIEW in the window layer (plan 6.0, layer 4), not an RN <Modal>: it can
 * never fight a native dialog, and the XP sparks fly over it. Still ONE window of
 * ModalQueueContext — the queue's order and "one at a time" are unchanged.
 *
 * The medal rises like the sun: the screen dims, a glow in the rarity's colour
 * blooms, the medal rises with a little overshoot, a ring of light closes around
 * it (flash, burst, haptic), the headline, the name word by word, the description,
 * "Also unlocked" (the rest of the action), the XP and a combo line. While open it
 * lives (rays turn, the medal floats, a sheen crosses). Continue: the XP leaves
 * from the button into the level badge (held until now — XpDisplay), the medal
 * flies up to the Trophy Room button and the panel settles away.
 *
 * Kept: rarity tier names stay English; haptic by rarity; the announcement with
 * the real texts; one entrance timeline on the UI thread; a tap during the
 * entrance skips to its end; reduce motion — everything in place, no loops.
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
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, radius, rarity as rarityTokens, space, withAlpha } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { registerMomentOrigin } from '@/src/services/xpDisplay/xpOriginRegistry';
import { Achievement } from '@/src/types/gamification';
import { getModalWidth } from '@/src/utils/layout';
import { AppText, PressableScale, RollingNumber, typeStyle } from '@/src/components/ui';

const TOTAL = 2000;
const EXIT_MS = 520;
const MEDAL = 132;
const RING_R = 80;
const CANVAS = 340;

function useWindow(t: SharedValue<number>, start: number, end: number, back = false) {
  return useDerivedValue(() => {
    const x = Math.min(1, Math.max(0, (t.value * TOTAL - start) / (end - start)));
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

type RarityKey = keyof typeof rarityTokens;
const tierOf = (r: string) => rarityTokens[(r as RarityKey) in rarityTokens ? (r as RarityKey) : 'common'];

export interface TrophyWindowProps {
  /** The rarest trophy of the action — it gets the stage. */
  achievement: Achievement;
  /** XP the whole moment stands for (really credited). */
  xpAwarded: number;
  /** Everything else the same action unlocked. */
  also?: Achievement[];
  /** The combo this action switched on (L-11) — one line here. */
  boost?: { factor: string; hours: number };
  onClose: () => void;
}

export function TrophyWindow({ achievement, xpAwarded, also = [], boost, onClose }: TrophyWindowProps) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const rarityName = String(achievement.rarity);
  const tier = tierOf(rarityName);
  const name = t(achievement.nameKey);
  const description = t(achievement.descriptionKey);
  const headline = t(`achievements.celebration.rarity_${rarityName}`);
  const panelWidth = getModalWidth(width, 0.88);
  const medalCy = Math.max(insets.top + 190, height * 0.33);
  const panelTop = medalCy + MEDAL / 2 - 36;

  const clock = useSharedValue(reducedMotion ? 1 : 0);
  const out = useSharedValue(0);
  const closing = useRef(false);
  const ctaRef = useRef<View>(null);

  useEffect(() => {
    if (!reducedMotion) clock.value = withTiming(1, { duration: TOTAL, easing: Easing.linear });
    AccessibilityInfo.announceForAccessibility(
      [achievement, ...also]
        .map(a =>
          t('achievements.celebration.announcement', {
            rarity: tierOf(String(a.rarity)).label,
            name: t(a.nameKey),
            xp: String(a === achievement ? xpAwarded : a.xpReward),
          })
        )
        .join(' ')
    );
    const id = setTimeout(() => feel('trophyWindow'), reducedMotion ? 0 : 1100);
    return () => clearTimeout(id);
    // One window = one entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (clock.value < 1) clock.value = withTiming(1, { duration: 220 });
  };

  const spin = useSharedValue(0);
  const float = useSharedValue(0);
  const sheen = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    spin.value = withRepeat(withTiming(1, { duration: 40000, easing: Easing.linear }), -1);
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
  }, [spin, float, sheen, reducedMotion]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    feel('tap');
    cancelAnimation(spin);
    cancelAnimation(float);
    cancelAnimation(sheen);
    // The held XP leaves from the button (XpDisplay takes this point on release).
    ctaRef.current?.measureInWindow((x, y, w, h) =>
      registerMomentOrigin('trophy', { x: x + w / 2, y: y + h / 2 })
    );
    out.value = withTiming(1, { duration: reducedMotion ? 160 : EXIT_MS, easing: Easing.inOut(Easing.cubic) }, finished => {
      if (finished) scheduleOnRN(onClose);
    });
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

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

  const center = CANVAS / 2;
  const rays = useMemo(() => buildRays(rarityName === 'legendary' ? 16 : 12, 72, 170), [rarityName]);
  const ringPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(Skia.XYWHRect(center - RING_R, center - RING_R, RING_R * 2, RING_R * 2), -90, 359.9);
    return p;
  }, [center]);
  const particles = useMemo(
    () =>
      Array.from({ length: tier.particles }, (_, i) => {
        const a = (i / tier.particles) * Math.PI * 2;
        const reach = i % 2 === 0 ? 132 : 108;
        return { x: center + Math.cos(a) * reach, y: center + Math.sin(a) * reach, r: i % 3 === 0 ? 3.4 : 2.4 };
      }),
    [tier.particles, center]
  );

  const glowR = useDerivedValue(() => 90 + 70 * bloom.value);
  const glowOpacity = useDerivedValue(() => 0.75 * bloom.value * (1 - out.value));
  const raysTransform = useDerivedValue(() => [{ rotate: spin.value * Math.PI * 2 }, { scale: 0.6 + 0.4 * bloom.value }]);
  const raysOpacity = useDerivedValue(() => 0.55 * bloom.value * (1 - out.value));
  const flashR = useDerivedValue(() => RING_R + 60 * burst.value);
  const flashOpacity = useDerivedValue(() => (burst.value <= 0 || burst.value >= 1 ? 0 : 0.7 * (1 - burst.value)));
  const burstTransform = useDerivedValue(() => [{ scale: 0.45 + 0.75 * burst.value }]);
  const burstOpacity = useDerivedValue(() => (burst.value <= 0 ? 0 : 1 - burst.value));
  const ringOpacity = useDerivedValue(() => 1 - out.value);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.78 * scrim.value * (1 - out.value) }));
  const canvasStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -4 * float.value }] }));
  // Exit: the medal flies up to the Trophy Room button (Home's top row, right).
  const flyX = width - 108 - width / 2;
  const flyY = insets.top + 24 - medalCy;
  const medalStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, rise.value * 1.4) * (1 - interpolate(out.value, [0.75, 1], [0, 1], 'clamp')),
    transform: [
      { translateX: flyX * out.value },
      { translateY: (1 - rise.value) * 90 - 4 * float.value + flyY * out.value },
      { scale: (0.55 + 0.45 * rise.value) * (1 - 0.82 * out.value) },
    ],
  }));
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-MEDAL, MEDAL]) }, { rotate: '20deg' }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineIn.value * (1 - out.value),
    transform: [{ translateY: (1 - headlineIn.value) * 14 - 10 * out.value }],
  }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, panelIn.value * 1.5) * (1 - out.value),
    transform: [{ translateY: (1 - panelIn.value) * 40 + 30 * out.value }, { scale: 0.96 + 0.04 * panelIn.value }],
  }));
  const chipStyle = useAnimatedStyle(() => ({ opacity: chipIn.value, transform: [{ scale: 0.85 + 0.15 * chipIn.value }] }));
  const descStyle = useAnimatedStyle(() => ({ opacity: descIn.value, transform: [{ translateY: (1 - descIn.value) * 8 }] }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonIn.value, transform: [{ translateY: (1 - buttonIn.value) * 12 }] }));

  const nameWords = name.split(' ');
  const rewardInk = mode === 'light' ? c.rewardText : c.reward;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable style={StyleSheet.absoluteFill} onPress={skip} accessibilityLabel={headline}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fixed.stage }, scrimStyle]} />
      </Pressable>

      {/* Light behind the medal */}
      <Animated.View
        pointerEvents="none"
        style={[styles.canvasWrap, { top: medalCy - CANVAS / 2, left: (width - CANVAS) / 2 }, canvasStyle]}
      >
        <Canvas style={styles.canvas}>
          <Circle cx={center} cy={center} r={glowR} opacity={glowOpacity}>
            <RadialGradient c={vec(center, center)} r={glowR} colors={[tier.glow, withAlpha(tier.glow, 0)]} />
          </Circle>
          <Group transform={raysTransform} origin={vec(center, center)} opacity={raysOpacity}>
            <Path path={rays} transform={[{ translateX: center }, { translateY: center }]}>
              <RadialGradient c={vec(0, 0)} r={170} colors={[tier.glow, withAlpha(tier.glow, 0)]} />
            </Path>
          </Group>
          <Path path={ringPath} style="stroke" strokeWidth={4} strokeCap="round" start={0} end={ring} opacity={ringOpacity}>
            <SkiaLinearGradient
              start={vec(center - RING_R, center - RING_R)}
              end={vec(center + RING_R, center + RING_R)}
              colors={[...tier.ring]}
            />
          </Path>
          <Circle cx={center} cy={center} r={flashR} opacity={flashOpacity}>
            <RadialGradient c={vec(center, center)} r={flashR} colors={[fixed.white, withAlpha(tier.glow, 0)]} />
          </Circle>
          <Group transform={burstTransform} origin={vec(center, center)} opacity={burstOpacity}>
            {particles.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={p.r} color={i % 2 === 0 ? tier.glow : fixed.white} />
            ))}
          </Group>
        </Canvas>
      </Animated.View>

      {/* Headline above the medal */}
      <Animated.View pointerEvents="none" style={[styles.headline, { top: medalCy - MEDAL / 2 - 78, width }, headlineStyle]}>
        <Text maxFontSizeMultiplier={1.3} style={[typeStyle('title', fixed.white, true), styles.center]}>
          {headline}
        </Text>
      </Animated.View>

      {/* The panel */}
      <Animated.View
        style={[
          styles.panel,
          { top: panelTop, width: panelWidth, left: (width - panelWidth) / 2, backgroundColor: c.surface, borderColor: c.border },
          panelStyle,
        ]}
      >
        <Animated.View style={[styles.chip, { backgroundColor: tier.chipBg[mode] }, chipStyle]}>
          <Ionicons name="star" size={12} color={tier.chipText[mode]} style={styles.chipIcon} />
          <Text style={[typeStyle('overline', tier.chipText[mode]), styles.chipText]}>{tier.label}</Text>
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
          <AppText variant="body" tone="muted" style={[styles.center, styles.description]}>
            {description}
          </AppText>
        </Animated.View>

        {also.length > 0 && (
          <Animated.View style={[styles.also, { borderColor: c.border }, descStyle]}>
            <AppText variant="caption" tone="muted">
              {t('achievements.celebration.alsoUnlocked')}
            </AppText>
            <View style={styles.alsoRow}>
              {also.map(item => (
                <View key={item.id} style={styles.alsoItem}>
                  <SmallMedal icon={item.icon} rarityName={String(item.rarity)} />
                  <AppText variant="label" numberOfLines={1} style={styles.alsoName}>
                    {t(item.nameKey)}
                  </AppText>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.xpRow, descStyle]}>
          <Ionicons name="sparkles" size={20} color={c.reward} style={styles.xpIcon} />
          <RollingNumber
            text={t('achievements.card.xpReward', { xp: xpAwarded })}
            variant="number"
            delay={reducedMotion ? 0 : 1450}
            style={{ color: rewardInk }}
          />
        </Animated.View>
        <AppText variant="caption" tone="muted" style={styles.center}>
          {t('achievements.celebration.xp_earned')}
        </AppText>
        {boost && (
          <Animated.View style={[styles.boostRow, descStyle]}>
            <Ionicons name="flash" size={14} color={rewardInk} />
            <AppText variant="caption" tone="muted" style={styles.boostText}>
              {t('gamification.multiplier.boostLine', { factor: boost.factor, count: boost.hours })}
            </AppText>
          </Animated.View>
        )}

        <Animated.View ref={ctaRef} collapsable={false} style={[styles.ctaWrap, buttonStyle]}>
          <PressableScale
            onPress={close}
            feel={null}
            accessibilityLabel={t('achievements.celebration.continue_button')}
            style={styles.cta}
          >
            <LinearGradient
              colors={c.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, styles.ctaFill]}
            />
            <AppText variant="bodyStrong" tone="onPrimary">
              {t('achievements.celebration.continue_button')}
            </AppText>
          </PressableScale>
        </Animated.View>
      </Animated.View>

      {/* The medal — above the panel, flies to the trophy room on close */}
      <Animated.View
        pointerEvents="none"
        style={[styles.medalWrap, { top: medalCy - MEDAL / 2, left: (width - MEDAL) / 2 }, medalStyle]}
      >
        <LinearGradient colors={tier.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.medalRing}>
          <View style={[styles.medalFace, { backgroundColor: c.surface }]}>
            <LinearGradient
              colors={[withAlpha(tier.glow, 0.2), withAlpha(tier.glow, 0)]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.medalIcon} maxFontSizeMultiplier={1}>
              {achievement.icon}
            </Text>
            {!reducedMotion && (
              <Animated.View style={[styles.sheen, sheenStyle]}>
                <LinearGradient
                  colors={[withAlpha(fixed.white, 0), withAlpha(fixed.white, 0.55), withAlpha(fixed.white, 0)]}
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

function NameWord({ word, clock, start }: { word: string; clock: SharedValue<number>; start: number }) {
  const p = useWindow(clock, start, start + 380);
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 14 }] }));
  return (
    <Animated.View style={style}>
      <AppText variant="display" style={styles.center}>
        {word}
      </AppText>
    </Animated.View>
  );
}

function SmallMedal({ icon, rarityName }: { icon: string; rarityName: string }) {
  const { c } = useDesign();
  const tier = tierOf(rarityName);
  return (
    <LinearGradient colors={tier.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.smallMedal}>
      <View style={[styles.smallFace, { backgroundColor: c.surface }]}>
        <Text maxFontSizeMultiplier={1} style={styles.smallIcon}>
          {icon}
        </Text>
      </View>
    </LinearGradient>
  );
}

const SMALL = 28;

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  canvasWrap: { position: 'absolute', width: CANVAS, height: CANVAS },
  canvas: { width: CANVAS, height: CANVAS },
  headline: { position: 'absolute', left: 0, paddingHorizontal: space.xxl },
  panel: {
    position: 'absolute',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingTop: 52,
    paddingHorizontal: space.xxl,
    paddingBottom: space.xxl,
    boxShadow: `0px 24px 60px ${withAlpha(fixed.black, 0.45)}`,
  },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 5, borderRadius: radius.pill },
  chipIcon: { marginRight: 6 },
  chipText: { letterSpacing: 1.6 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: space.md },
  description: { marginTop: space.sm },
  also: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alsoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md, marginTop: space.sm },
  alsoItem: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
  alsoName: { marginLeft: space.sm, flexShrink: 1 },
  boostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  boostText: { marginLeft: space.xs, flexShrink: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl },
  xpIcon: { marginRight: space.sm },
  ctaWrap: { alignSelf: 'stretch' },
  cta: {
    marginTop: space.xl,
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaFill: { borderRadius: radius.pill },
  medalWrap: { position: 'absolute', width: MEDAL, height: MEDAL },
  medalRing: {
    width: MEDAL,
    height: MEDAL,
    borderRadius: radius.pill,
    padding: 8,
    boxShadow: `0px 12px 30px ${withAlpha(fixed.black, 0.35)}`,
  },
  medalFace: { flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medalIcon: { fontSize: MEDAL * 0.41, lineHeight: MEDAL * 0.49 },
  sheen: { position: 'absolute', top: -MEDAL / 2, width: 34, height: MEDAL * 2 },
  smallMedal: { width: SMALL, height: SMALL, borderRadius: radius.pill, padding: 2 },
  smallFace: { flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  smallIcon: { fontSize: SMALL * 0.5, lineHeight: SMALL * 0.62 },
});
