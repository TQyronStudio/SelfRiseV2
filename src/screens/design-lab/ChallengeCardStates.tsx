/**
 * The monthly challenge card on Home before it has its challenge (kolo 45, lab
 * debt L-7): loading, preparing, and a failed load. Rules: challengeCardState in
 * challengeLogic.ts.
 *
 * - Every face keeps the card's shape: the overline with the month, a title, two
 *   lines and the bar's place — Home does not jump when the challenge arrives.
 * - LOADING is a still skeleton that waits SKELETON_DELAY_MS, so a fast load never
 *   flashes it. No shimmer: nothing on Home moves by itself except the sun (R-4).
 * - PREPARING says what is happening and that the card fills itself — no button,
 *   there is nothing for the user to do. The bar's place is a dashed outline.
 * - ERROR says what did not happen, that the progress is safe, and offers ONE way
 *   out. No raw error text, no warning emoji, no apology.
 * - When the challenge arrives the card's content fades in — the change answers
 *   the wait (it is the only motion here).
 *
 * GOING LIVE (1:1) — see PREVOD.md: MonthlyChallengeSection's loading / error /
 * "no challenge" branches. Known data always wins (a refresh never blanks the
 * card); "Try again" = loadMonthlyChallenge(); texts into the locales (today's
 * `monthlyChallenge.preparing` etc. carry emoji and, in German, cut words).
 */
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeCardState, SKELETON_DELAY_MS } from './challengeLogic';
import { LabText, PressableScale, Surface, useLab } from './labPrimitives';
import { labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';

export function ChallengeCardPlaceholder({
  state,
  retrying,
  onRetry,
}: {
  state: Exclude<ChallengeCardState, 'ready'>;
  retrying: boolean;
  onRetry: () => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.challenge;

  // The skeleton only after a beat: a quick load shows nothing but the card.
  const [skeleton, setSkeleton] = useState(false);
  useEffect(() => {
    if (state !== 'loading') {
      setSkeleton(false);
      return undefined;
    }
    const id = setTimeout(() => setSkeleton(true), SKELETON_DELAY_MS);
    return () => clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (state === 'error') {
      AccessibilityInfo.announceForAccessibility(text.errorTitle);
    }
  }, [state, text.errorTitle]);

  return (
    <View
      // Read as one: the skeleton has no words, the preparing card one message.
      accessible={state !== 'error'}
      accessibilityLabel={
        state === 'loading'
          ? text.loadingLabel
          : state === 'preparing'
            ? `${text.preparingTitle}. ${text.preparingText}`
            : undefined
      }
    >
      <Surface>
        <LabText variant="overline" tone="primary">
          {copy.challengeOverline}
        </LabText>

        {state === 'loading' && (
          <View style={{ opacity: skeleton ? 1 : 0 }}>
            <Bone width="62%" height={22} top={labSpace.sm} color={c.track} />
            <Bone width="94%" height={12} top={labSpace.md} color={c.track} />
            <Bone width="70%" height={12} top={labSpace.sm} color={c.track} />
            <Bone width="100%" height={8} top={labSpace.lg} color={c.track} />
          </View>
        )}

        {state === 'preparing' && (
          <>
            <View style={styles.titleRow}>
              <Ionicons name="calendar-outline" size={20} color={c.primary} />
              <LabText variant="title" style={styles.titleText}>
                {text.preparingTitle}
              </LabText>
            </View>
            <LabText
              variant="body"
              tone="muted"
              style={{ marginTop: labSpace.xs }}
            >
              {text.preparingText}
            </LabText>
            {/* Where the bar will be: an outline, nothing filled yet. */}
            <View style={[styles.dashed, { borderColor: c.border }]} />
          </>
        )}

        {state === 'error' && (
          <>
            <LabText variant="title" style={{ marginTop: labSpace.sm }}>
              {text.errorTitle}
            </LabText>
            <LabText
              variant="body"
              tone="muted"
              style={{ marginTop: labSpace.xs }}
            >
              {text.errorText}
            </LabText>
            <PressableScale
              {...(retrying ? null : { onPress: onRetry })}
              accessibilityRole="button"
              accessibilityLabel={retrying ? text.retrying : text.retry}
              style={[styles.retry, { backgroundColor: c.primarySoft }]}
            >
              <Ionicons
                name="refresh"
                size={17}
                color={c.primary}
                style={{ marginRight: labSpace.sm }}
              />
              <LabText variant="bodyStrong" tone="primary">
                {retrying ? text.retrying : text.retry}
              </LabText>
            </PressableScale>
          </>
        )}
      </Surface>
    </View>
  );
}

function Bone({
  width,
  height,
  top,
  color,
}: {
  width: `${number}%`;
  height: number;
  top: number;
  color: string;
}) {
  return (
    <View
      style={{
        width,
        height,
        marginTop: top,
        borderRadius: height / 2,
        backgroundColor: color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.sm,
  },
  titleText: {
    flexShrink: 1,
    marginLeft: labSpace.sm,
  },
  dashed: {
    height: 8,
    marginTop: labSpace.lg,
    borderRadius: labRadius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  retry: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: labSpace.lg,
    borderRadius: labRadius.pill,
  },
});
