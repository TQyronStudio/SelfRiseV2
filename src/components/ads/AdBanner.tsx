import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useTheme } from '@/src/contexts/ThemeContext';

/**
 * AdBanner Component
 *
 * Displays Google AdMob banner ads with theme support and error handling.
 * Optimized for minimal spacing to preserve screen real estate.
 *
 * @param adUnitId - AdMob Ad Unit ID (optional - uses test ID by platform)
 * @param size - Banner size (default: BANNER 320x50)
 */

// Test AdMob Banner Unit IDs (for development - always show ads)
const BANNER_AD_UNIT_IDS = {
  ios: 'ca-app-pub-3940256099942544/2934735716',
  android: 'ca-app-pub-3940256099942544/6300978111',
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use test ID based on platform
  const bannerAdUnitId = adUnitId || (
    Platform.OS === 'ios'
      ? BANNER_AD_UNIT_IDS.ios
      : BANNER_AD_UNIT_IDS.android
  );

  const handleAdLoaded = () => {
    setIsLoaded(true);
    setHasError(false);
    console.log('✅ AdMob banner loaded successfully');
  };

  const handleAdFailedToLoad = (error: Error) => {
    setIsLoaded(false);
    setHasError(true);
    console.error('❌ AdMob banner failed to load:', error.message);
  };

  // Don't render container if ad failed to load (preserves space)
  if (hasError) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={styles.bannerWrapper}>
        <BannerAd
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
