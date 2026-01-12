import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '@/src/contexts/ThemeContext';

/**
 * AdBanner Component
 *
 * Displays Google AdMob banner ads with theme support and error handling.
 * Optimized for minimal spacing to preserve screen real estate.
 *
 * @param adUnitId - AdMob Ad Unit ID (optional - uses test ID if not provided)
 * @param size - Banner size (default: BANNER 320x50)
 */

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

  // Use test ID if no production ID provided
  const bannerAdUnitId = adUnitId || (
    Platform.OS === 'ios'
      ? TestIds.BANNER
      : TestIds.BANNER
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
