/**
 * Card → detail continuity (premium-design-plan.md, F1, kolo 6): tapping the journal
 * card grows it into the journal screen instead of cutting to a new page. Closing
 * shrinks it back into the card. Mock content only.
 *
 * The frame animates its rectangle (one view, ~0.4 s, only while opening/closing);
 * the content inside is laid out once at full size and is uncovered as the frame
 * grows, so nothing reflows mid-animation. Android back closes it.
 *
 * In the real app this would be the shared-element transition into the Journal tab
 * — a navigation-level change, so it needs Petr's decision first (plan R-4).
 *
 * GOING LIVE (1:1): "card grows into the screen" is a navigation change (Journal
 * tab) — decision R-4 first. Close button sits in the badge row (lesson 10).
 */
import React, { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { selection } from '@/src/services/hapticsService';
import { Chip, LabText, PressableScale, useLab } from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { MOCK_COPY, MOCK_STATS } from './mockCopy';
import { StreakFlame } from './StreakFlame';

export interface DetailRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const OPEN_SPRING = {
  damping: 24,
  stiffness: 210,
  mass: 1,
  overshootClamping: true,
};
const CLOSE_MS = 320;

interface JournalDetailProps {
  /** The card's rectangle inside the page — where the detail grows from and returns to. */
  origin: DetailRect;
  /** The page size — the detail's final rectangle. */
  size: { width: number; height: number };
  bottomInset: number;
  onClosed: () => void;
}

export function JournalDetailConcept({
  origin,
  size,
  bottomInset,
  onClosed,
}: JournalDetailProps) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(1, OPEN_SPRING);
  }, [p]);

  const close = () => {
    selection();
    p.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) },
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
    // `close` only touches the shared value and the stable onClosed callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const frameStyle = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [origin.x, 0]),
    top: interpolate(p.value, [0, 1], [origin.y, 0]),
    width: interpolate(p.value, [0, 1], [origin.width, size.width]),
    height: interpolate(p.value, [0, 1], [origin.height, size.height]),
    borderRadius: interpolate(p.value, [0, 1], [labRadius.lg, 0]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.3, 0.85], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(p.value, [0.3, 1], [10, 0], 'clamp') },
    ],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 0.28 * p.value }));

  const week = [3, 4, 3, 5, 3, 1, 2];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000' },
          scrimStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.frame,
          { backgroundColor: c.surface, borderColor: c.border },
          frameStyle,
        ]}
      >
        <Animated.View
          style={[{ width: size.width, height: size.height }, contentStyle]}
        >
          <ScrollView
            contentContainerStyle={{
              padding: labSpace.xl,
              paddingTop: labSpace.sm,
              paddingBottom: bottomInset + labSpace.xxl,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar: the level badge stays pinned on the left, close sits on the right. */}
            <View
              style={[
                styles.headerRow,
                { height: 48, justifyContent: 'flex-end' },
              ]}
            >
              <PressableScale
                onPress={close}
                haptic={null}
                pressScale={0.9}
                accessibilityLabel={copy.detail.close}
                style={[
                  styles.close,
                  { backgroundColor: c.surfaceRaised, borderColor: c.border },
                ]}
              >
                <Ionicons name="close" size={20} color={c.text} />
              </PressableScale>
            </View>
            <LabText variant="display" style={{ marginTop: labSpace.md }}>
              {copy.detail.title}
            </LabText>

            <View style={styles.streakRow}>
              <StreakFlame
                state="fire"
                onStateChange={() => undefined}
                size={72}
                label={copy.streakActive}
              />
              <View style={{ marginLeft: labSpace.md }}>
                <LabText
                  variant="display"
                  style={{ fontSize: 56, lineHeight: 62 }}
                >
                  {MOCK_STATS.journalStreak}
                </LabText>
                <LabText variant="label" tone="muted">
                  {copy.days}
                </LabText>
              </View>
              <View style={{ flex: 1 }} />
              <Chip
                icon="checkmark-circle"
                label={copy.streakActive}
                tone="success"
              />
            </View>

            <LabText variant="title" style={{ marginTop: labSpace.xxl }}>
              {copy.detail.today}
            </LabText>
            {copy.detail.entries.map((entry, i) => (
              <View
                key={entry}
                style={[
                  styles.entry,
                  { backgroundColor: c.surfaceRaised, borderColor: c.border },
                ]}
              >
                <View
                  style={[
                    styles.entryNumber,
                    { backgroundColor: c.primarySoft },
                  ]}
                >
                  <LabText variant="caption" tone="primary">
                    {i + 1}
                  </LabText>
                </View>
                <LabText variant="body" style={{ flex: 1 }}>
                  {entry}
                </LabText>
              </View>
            ))}
            <View
              style={[
                styles.entry,
                styles.emptyEntry,
                { borderColor: c.textFaint },
              ]}
            >
              <View style={[styles.entryNumber, { backgroundColor: c.track }]}>
                <LabText variant="caption" tone="muted">
                  3
                </LabText>
              </View>
              <LabText variant="body" tone="muted" italic style={{ flex: 1 }}>
                {copy.detail.emptySlot}
              </LabText>
            </View>

            <LabText variant="titleSm" style={{ marginTop: labSpace.xxl }}>
              {copy.detail.week}
            </LabText>
            <View style={styles.weekRow}>
              {week.map((entries, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <View
                    style={[
                      styles.weekDot,
                      { backgroundColor: entries >= 3 ? c.primary : c.track },
                    ]}
                  />
                  <LabText
                    variant="caption"
                    tone="muted"
                    style={{ marginTop: 6 }}
                  >
                    {copy.weekdays[i]}
                  </LabText>
                </View>
              ))}
            </View>

            <PressableScale
              style={styles.cta}
              accessibilityLabel={copy.writeEntry}
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
                name="create-outline"
                size={18}
                color={c.onPrimary}
                style={{ marginRight: labSpace.sm }}
              />
              <LabText variant="bodyStrong" tone="onPrimary">
                {copy.writeEntry}
              </LabText>
            </PressableScale>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xl,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.md,
    marginTop: labSpace.md,
    padding: labSpace.lg,
    borderRadius: labRadius.md,
    borderWidth: 1,
  },
  emptyEntry: {
    borderStyle: 'dashed',
  },
  entryNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: labSpace.md,
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.xxl,
    paddingVertical: labSpace.lg,
    borderRadius: labRadius.pill,
    overflow: 'hidden',
  },
});
