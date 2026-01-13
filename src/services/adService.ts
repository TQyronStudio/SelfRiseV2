import { Platform } from 'react-native';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';

/**
 * AdService - Handles rewarded ads for the WarmUp system
 *
 * Used when users need to restore their journal streak by watching ads.
 */

// Test AdMob Rewarded Ad Unit IDs (for development - always show ads)
const REWARDED_AD_UNIT_IDS = {
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
};

// Get the correct ad unit ID based on platform
const getRewardedAdUnitId = (): string => {
  return Platform.OS === 'ios'
    ? REWARDED_AD_UNIT_IDS.ios
    : REWARDED_AD_UNIT_IDS.android;
};

export type AdResult = {
  success: boolean;
  rewarded: boolean;
  error?: string;
};

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private isLoading: boolean = false;

  /**
   * Preload a rewarded ad for faster display
   * Call this early (e.g., when WarmUp modal opens) to reduce wait time
   */
  async preloadRewardedAd(): Promise<boolean> {
    if (this.isLoading) {
      console.log('⏳ AdService: Already loading rewarded ad');
      return false;
    }

    try {
      this.isLoading = true;
      console.log('📺 AdService: Preloading rewarded ad...');

      const adUnitId = getRewardedAdUnitId();
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      return new Promise((resolve) => {
        if (!this.rewardedAd) {
          this.isLoading = false;
          resolve(false);
          return;
        }

        const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            console.log('✅ AdService: Rewarded ad preloaded successfully');
            this.isLoading = false;
            unsubscribeLoaded();
            resolve(true);
          }
        );

        const unsubscribeError = this.rewardedAd.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            console.error('❌ AdService: Failed to preload rewarded ad:', error);
            this.isLoading = false;
            this.rewardedAd = null;
            unsubscribeError();
            resolve(false);
          }
        );

        this.rewardedAd.load();
      });
    } catch (error) {
      console.error('❌ AdService: Error preloading rewarded ad:', error);
      this.isLoading = false;
      this.rewardedAd = null;
      return false;
    }
  }

  /**
   * Show a rewarded ad and wait for completion
   * Returns whether the user earned the reward (watched full ad)
   */
  async showRewardedAd(): Promise<AdResult> {
    console.log('📺 AdService: Attempting to show rewarded ad...');

    // If no ad is preloaded, load one now
    if (!this.rewardedAd) {
      console.log('📺 AdService: No preloaded ad, loading now...');
      const loaded = await this.preloadRewardedAd();
      if (!loaded) {
        return {
          success: false,
          rewarded: false,
          error: 'AD_LOAD_FAILED',
        };
      }
    }

    return new Promise((resolve) => {
      if (!this.rewardedAd) {
        resolve({
          success: false,
          rewarded: false,
          error: 'AD_NOT_READY',
        });
        return;
      }

      let hasRewarded = false;

      // Listen for reward earned
      const unsubscribeEarned = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          console.log('🎁 AdService: User earned reward:', reward);
          hasRewarded = true;
        }
      );

      // Listen for ad closed
      const unsubscribeClosed = this.rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('📺 AdService: Ad closed, rewarded:', hasRewarded);

          // Clean up listeners
          unsubscribeEarned();
          unsubscribeClosed();
          unsubscribeError();

          // Clear the ad reference so a new one will be loaded next time
          this.rewardedAd = null;

          if (hasRewarded) {
            resolve({
              success: true,
              rewarded: true,
            });
          } else {
            resolve({
              success: true,
              rewarded: false,
              error: 'AD_DISMISSED_EARLY',
            });
          }
        }
      );

      // Listen for errors during playback
      const unsubscribeError = this.rewardedAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.error('❌ AdService: Error during ad playback:', error);

          // Clean up listeners
          unsubscribeEarned();
          unsubscribeClosed();
          unsubscribeError();

          this.rewardedAd = null;

          resolve({
            success: false,
            rewarded: false,
            error: 'AD_PLAYBACK_ERROR',
          });
        }
      );

      // Show the ad
      this.rewardedAd.show().catch((error) => {
        console.error('❌ AdService: Failed to show ad:', error);

        // Clean up listeners
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();

        this.rewardedAd = null;

        resolve({
          success: false,
          rewarded: false,
          error: 'AD_SHOW_FAILED',
        });
      });
    });
  }

  /**
   * Check if a rewarded ad is ready to show
   */
  isAdReady(): boolean {
    return this.rewardedAd !== null && !this.isLoading;
  }

  /**
   * Check if an ad is currently loading
   */
  isAdLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Clear any cached ad (useful for cleanup)
   */
  clearAd(): void {
    this.rewardedAd = null;
    this.isLoading = false;
  }
}

// Export singleton instance
export const adService = new AdService();
export default adService;
