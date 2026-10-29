import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTutorial } from '@/src/contexts/TutorialContext';
import {
  isMarketingDemoModeEnabled,
  MARKETING_DEMO_MODE_CHANGED_EVENT,
} from '@/src/services/marketingDemoModeService';
import { useBannerRetry } from './useBannerRetry';

/**
 * AdBanner Component
 *
 * Displays Google AdMob banner ads with theme support and error handling.
 * A failed load is retried (no fill / network only) — see useBannerRetry.
 * Optimized for minimal spacing to preserve screen real estate.
 *
 * @param adUnitId - AdMob Ad Unit ID (optional - uses test ID by platform)
 * @param size - Banner size (default: BANNER 320x50)
 */

// AdMob Banner Unit IDs.
// In development (__DEV__) we use Google TEST IDs so that tapping your own ads
// during testing cannot trigger an "invalid traffic" AdMob ban.
// In release builds we use the real PRODUCTION IDs (see technical-guides:AdMob.md).
const BANNER_AD_UNIT_IDS = __DEV__
  ? {
      ios: 'ca-app-pub-3940256099942544/2934735716',
      android: 'ca-app-pub-3940256099942544/6300978111',
    }
  : {
      ios: 'ca-app-pub-2983534520735805/2803676517',
      android: 'ca-app-pub-2983534520735805/1782416491',
    };

interface AdBannerProps {
  adUnitId?: string;
  size?: BannerAdSize;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adUnitId,
  size = BannerAdSize.BANNER
}) => {
  const { colors } = useTheme();
  const { state: tutorialState } = useTutorial();
  const isFocused = useIsFocused();
  const retry = useBannerRetry(isFocused);
  const [isMarketingDemoMode, setIsMarketingDemoMode] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    isMarketingDemoModeEnabled()
      .then(enabled => {
        if (isMounted) {
          setIsMarketingDemoMode(enabled);
        }
      })
      .catch(error => {
        console.error('Failed to load marketing demo mode:', error);
      });

    const subscription = DeviceEventEmitter.addListener(
      MARKETING_DEMO_MODE_CHANGED_EVENT,
      (enabled: boolean) => setIsMarketingDemoMode(enabled)
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  // Use test ID based on platform
  const bannerAdUnitId = adUnitId || (
    Platform.OS === 'ios'
      ? BANNER_AD_UNIT_IDS.ios
      : BANNER_AD_UNIT_IDS.android
  );

  const handleAdLoaded = () => {
    retry.onLoaded();
    console.log('✅ AdMob banner loaded successfully');
  };

  const handleAdFailedToLoad = (error: Error) => {
    console.warn('AdMob banner failed to load:', error.message);
    retry.onFailed(error);
  };

  // Hide ads during tutorial, in marketing demo mode, and while waiting for a
  // retry / after giving up (no empty space)
  if (!retry.shouldRender || tutorialState.isActive || isMarketingDemoMode !== false) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.bannerWrapper}>
        <BannerAd
          key={retry.adKey}
          unitId={bannerAdUnitId}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false, // GDPR compliance - will be configurable
          }}
          onAdLoaded={handleAdLoaded}
          onAdFailedToLoad={handleAdFailedToLoad}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // Minimal padding - preserves screen space
    paddingVertical: 4,
  },
  bannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
