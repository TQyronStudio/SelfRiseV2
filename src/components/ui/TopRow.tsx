/**
 * The top row of a tab screen (migration E3, P10, R-10): 48 pt under the safe
 * area, the screen's buttons on the RIGHT. The left 48 × 48 stays free for the
 * level badge, which is pinned there by the badge layer from stage E7 — until
 * then the place is simply empty.
 *
 * It has no background: the screen's own background shows through, up to the
 * status bar. On a tablet it follows the content column (technical-guides:
 * Large-Screens.md).
 */
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { radius, space } from '@/src/design/tokens';
import { contentColumn } from '@/src/utils/layout';
import { PressableScale } from './primitives';
import { SignatureIcon, SignatureName } from './SignatureIcon';

/** The row's height and the badge's square. */
export const TOP_ROW_HEIGHT = 48;

export function TopRow({ children }: { children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={[contentColumn, styles.row]}>
        {/* Reserved for the level badge (E7). */}
        <View style={styles.badgeSlot} />
        <View style={styles.actions}>{children}</View>
      </View>
    </View>
  );
}

/** A round 44 pt button of the top row: an icon, or a signature icon. */
export function RoundButton({
  icon,
  signature,
  tone = 'plain',
  label,
  onPress,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Draw this signature icon instead of the Ionicon. */
  signature?: SignatureName;
  /** 'reward' = the gold of the trophy room, 'plain' = a quiet surface button. */
  tone?: 'plain' | 'reward';
  label: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      pressScale={0.92}
      style={[
        styles.round,
        {
          backgroundColor: tone === 'reward' ? c.rewardSoft : c.surface,
          borderColor: c.border,
        },
      ]}
    >
      {signature ? (
        <SignatureIcon name={signature} size={22} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={c.textMuted} />
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    height: TOP_ROW_HEIGHT,
    marginTop: space.sm,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSlot: {
    width: TOP_ROW_HEIGHT,
    height: TOP_ROW_HEIGHT,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
