import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { JournalHistoryPage } from '@/src/components/journal/JournalHistoryPage';
import { useDesign } from '@/src/contexts/ThemeContext';

/** Room kept at the bottom for the ad banner. */
const BANNER_ROOM = 60;

/**
 * Journal history (migration E13: the page is JournalHistoryPage — a month
 * calendar, the selected day, search). The route stays; the ad banner keeps
 * its place above the home indicator.
 */
export default function JournalHistoryScreen() {
  const { c } = useDesign();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: c.canvas }]}>
      <JournalHistoryPage
        topInset={insets.top}
        bottomInset={BANNER_ROOM + insets.bottom}
        onClose={() => router.back()}
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
});
