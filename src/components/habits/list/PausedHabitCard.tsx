/**
 * A paused habit on the Habits screen (migration E5, from the Design Lab's
 * PausedCard): quiet, how long it has been paused ("never counted as missed"),
 * Resume — and "⋯" like every card, so a paused habit can still be edited or
 * deleted (Petr 2026-11-23: the old list could; its sheet shows Resume there).
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fonts, radius, space } from '@/src/design/tokens';
import {
  AppText,
  IconBadge,
  PressableScale,
  Surface,
} from '@/src/components/ui';
import { getHabitIonicon } from '@/src/constants/habitIcons';

interface PausedHabitCardProps {
  id: string;
  name: string;
  icon: string;
  /** "Paused for 3 days — never counted as missed". */
  pausedText: string;
  resumeLabel: string;
  moreLabel: string;
  onResume: (id: string) => void;
  onMore: (id: string) => void;
}

function PausedHabitCardView({
  id,
  name,
  icon,
  pausedText,
  resumeLabel,
  moreLabel,
  onResume,
  onMore,
}: PausedHabitCardProps) {
  const { c } = useDesign();
  return (
    <Surface style={styles.card}>
      <View style={styles.row}>
        <View style={styles.quiet}>
          <IconBadge
            icon={getHabitIonicon(icon)}
            color={c.textMuted}
            size={44}
          />
        </View>
        <View style={styles.middle}>
          <AppText variant="bodyStrong" tone="muted" numberOfLines={2}>
            {name}
          </AppText>
          <View style={styles.metaRow}>
            <Ionicons name="pause" size={11} color={c.textFaint} />
            <AppText variant="caption" tone="faint" style={styles.metaText}>
              {pausedText}
            </AppText>
          </View>
        </View>
        <PressableScale
          onPress={() => onMore(id)}
          pressScale={0.85}
          accessibilityLabel={moreLabel}
          style={styles.more}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
        </PressableScale>
        <PressableScale
          onPress={() => onResume(id)}
          accessibilityLabel={resumeLabel}
          pressScale={0.92}
          style={[styles.resume, { backgroundColor: c.primarySoft }]}
        >
          <Ionicons
            name="play"
            size={12}
            color={c.primary}
            style={styles.playIcon}
          />
          <AppText
            variant="caption"
            tone="primary"
            style={{ fontFamily: fonts.semibold }}
          >
            {resumeLabel}
          </AppText>
        </PressableScale>
      </View>
    </Surface>
  );
}

export const PausedHabitCard = memo(PausedHabitCardView);

const styles = StyleSheet.create({
  card: {
    marginTop: space.md,
    padding: space.md,
    paddingLeft: space.lg,
    borderRadius: radius.md + 4,
    // Quiet, but not a faded card: the card stays opaque (P2), its content is muted.
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quiet: {
    opacity: 0.5,
  },
  middle: {
    flex: 1,
    marginLeft: space.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    marginLeft: 4,
    flexShrink: 1,
  },
  more: {
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  playIcon: {
    marginRight: 4,
  },
});
