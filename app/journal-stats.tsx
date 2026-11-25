import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { JournalStatsPage } from '@/src/components/journal/JournalStatsPage';
import { useDesign } from '@/src/contexts/ThemeContext';

/** Room kept at the bottom for the ad banner. */
const BANNER_ROOM = 60;

/**
 * Journal statistics (migration E13: the page is JournalStatsPage — the streak,
 * four numbers, the last 30 days, entry types, ⭐ 🔥 👑). The route stays.
 */
export default function JournalStatsScreen() {
  const { c } = useDesign();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: c.canvas }]}>
      <JournalStatsPage
        topInset={insets.top}
        bottomInset={BANNER_ROOM + insets.bottom}
        onClose={() => router.back()}
      />
      {/* The page scrolls under the status bar: a strip keeps the clock readable. */}
      <View
        pointerEvents="none"
        style={[styles.statusStrip, { height: insets.top, backgroundColor: c.canvas }]}
      />
      <View style={[styles.banner, { bottom: insets.bottom, backgroundColor: c.canvas }]}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  statusStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
