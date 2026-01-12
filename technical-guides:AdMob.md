# AdMob Integration Technical Guide

**SelfRise V2 - Advertising System Documentation**

*Last Updated: 2026-01-12*

---

## Table of Contents

1. [Overview](#overview)
2. [AdMob Account Structure](#admob-account-structure)
3. [Application IDs](#application-ids)
4. [Ad Unit IDs](#ad-unit-ids)
5. [Banner Placements](#banner-placements)
6. [Rewarded Ads System](#rewarded-ads-system)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Testing](#testing)
9. [Localization](#localization)

---

## Overview

SelfRise V2 integrates Google AdMob for monetization through:
- **Banner Ads**: Display advertising on key screens
- **Rewarded Ads**: User watches ad to restore journal streak (WarmUp system)

**Package**: `react-native-google-mobile-ads`
**Platforms**: iOS + Android
**AdMob Console**: [AdMob Dashboard](https://apps.admob.com/)

---

## AdMob Account Structure

```
📱 SelfRise V2 AdMob Account
│
├─ 🍎 iOS Application
│  ├─ App ID: [iOS_APP_ID]
│  ├─ Banner Ad Unit: [BANNER_UNIT_ID]
│  └─ Rewarded Ad Unit: [REWARDED_UNIT_ID]
│
└─ 🤖 Android Application
   ├─ App ID: [ANDROID_APP_ID]
   ├─ Banner Ad Unit: [BANNER_UNIT_ID]
   └─ Rewarded Ad Unit: [REWARDED_UNIT_ID]
```

**Note**: Ad Unit IDs are cross-platform and can be shared between iOS and Android.

---

## Application IDs

### Production IDs

| Platform | App ID | Bundle/Package ID | Status |
|----------|--------|-------------------|--------|
| **iOS** | `ca-app-pub-2983534520735805~8056003193` | `com.turage.SelfRiseV2` | ✅ Active |
| **Android** | `ca-app-pub-2983534520735805~5721661502` | `com.turage.SelfRiseV2` | ✅ Active |

### Test IDs (For Development)

| Platform | Test App ID |
|----------|-------------|
| **iOS** | `ca-app-pub-3940256099942544~1458002511` |
| **Android** | `ca-app-pub-3940256099942544~3347511713` |

**Configuration Location**: `app.json` → `expo.plugins`

---

## Ad Unit IDs

### Banner Ad Units

**Purpose**: Standard banner advertising displayed across multiple screens

| Environment | Platform | Ad Unit ID | Size | Status |
|-------------|----------|-----------|------|--------|
| **Production** | iOS | `ca-app-pub-2983534520735805/2803676517` | 320x50 (Standard) | ✅ Active |
| **Production** | Android | `ca-app-pub-2983534520735805/1782416491` | 320x50 (Standard) | ✅ Active |
| **Test** | iOS | `ca-app-pub-3940256099942544/2934735716` | 320x50 | ✅ For Dev |
| **Test** | Android | `ca-app-pub-3940256099942544/6300978111` | 320x50 | ✅ For Dev |

**Supported Banner Sizes**:
- **Standard** (320x50) - Default for most screens
- **Large** (320x100) - Optional for prominent placements
- **Medium Rectangle** (300x250) - Optional for content-rich screens

---

### Rewarded Ad Units

**Purpose**: User watches full ad to restore journal streak (WarmUp system)

| Environment | Platform | Ad Unit ID | Reward | Status |
|-------------|----------|-----------|--------|--------|
| **Production** | iOS | `ca-app-pub-2983534520735805/2719065972` | 1 Streak Restore | ✅ Active |
| **Production** | Android | `ca-app-pub-2983534520735805/5557832361` | 1 Streak Restore | ✅ Active |
| **Test** | iOS | `ca-app-pub-3940256099942544/1712485313` | 1 Streak Restore | ✅ For Dev |
| **Test** | Android | `ca-app-pub-3940256099942544/5224354917` | 1 Streak Restore | ✅ For Dev |

**Reward Logic**: See [WarmUp System Documentation](#rewarded-ads-system)

---

## Banner Placements

### Active Banner Locations

| Screen | Location | Banner Size | Visibility | Status |
|--------|----------|-------------|------------|--------|
| **Home Screen** | Bottom (above tab bar) | 320x50 | Always | ✅ Production |
| **Habits Screen** | Bottom (above tab bar) | 320x50 | Always | ✅ Production |
| **Journal Screen** | Bottom (above tab bar) | 320x50 | Always | ✅ Production |
| **Goals Screen** | Bottom (above tab bar) | 320x50 | Always | ✅ Production |
| **Settings Screen** | Bottom (above tab bar) | 320x50 | Always | ✅ Production |
| **Trophy Room** | Bottom | 320x50 | Always | ✅ Production |
| **Active Habits Stats** | Bottom | 320x50 | Always | ✅ Production |
| **Journal History** | Bottom | 320x50 | Always | ✅ Production |
| **Journal Statistics** | Bottom | 320x50 | Always | ✅ Production |
| **Goal Detail** | Bottom | 320x50 | Always | ✅ Production |

**Design Guidelines**:
- ✅ **Safe Area**: All banners respect safe area insets
- ✅ **Non-Intrusive**: Banners don't block primary content or CTAs
- ✅ **Theme-Aware**: Banner container adapts to Light/Dark theme
- ✅ **Minimal Spacing**: Only 4px vertical padding to preserve screen space
- ✅ **Fixed Positioning**: Banner stays at bottom, content scrolls above
- ❌ **No Overlap**: ScrollView has 80px bottom padding to prevent content overlap

**Component**: `src/components/ads/AdBanner.tsx`

**Implementation Status**: ✅ Banner component created and integrated into all major screens (PRODUCTION IDs active)

---

### Banner Placement Rules

All banners follow the same consistent pattern:
- **Position**: Fixed at bottom using absolute positioning
- **Display**: Always visible
- **Content Padding**: ScrollView/FlatList has 60-80px paddingBottom to prevent content overlap
- **Container Style**: Background matches theme (colors.backgroundSecondary)

#### Screen-Specific Notes:

1. **Tab Screens** (Home, Habits, Journal, Goals, Settings):
   - Banner appears above the tab navigation
   - SafeAreaView with edges={['bottom']} ensures proper spacing

2. **Modal Screens** (Journal History, Journal Stats, Habit Stats, Goal Detail, Trophy Room):
   - Banner appears at absolute bottom of screen
   - Content scrolls above the banner

---

## Rewarded Ads System

### WarmUp System Integration

**User Flow**:
```
User misses journal entry → Streak at risk
   ↓
User opens app next day
   ↓
StreakWarmUpModal appears with options:
   1. Pay with bonus entries (if available)
   2. Watch rewarded ad (always available)
   ↓
User selects "Watch Ad"
   ↓
Rewarded ad plays (15-30 seconds)
   ↓
On completion: Streak restored ✅
```

**Technical Implementation**:
- **Trigger**: `StreakWarmUpModal.tsx` component
- **Service**: `src/services/adService.ts`
- **Storage**: `src/services/storage/gratitudeStorage.ts` (WarmUp payment tracking)
- **Reward**: 1 streak restoration credit

**XP Integration**:
- Watching ad does **NOT** award XP (prevents abuse)
- Streak restoration is the only reward
- User still needs to complete 3 entries today to maintain streak

---

### Rewarded Ad Flow

```typescript
// Pseudocode
async function handleWatchAd() {
  // 1. Load rewarded ad
  const ad = await AdService.loadRewardedAd();

  // 2. Show ad
  const result = await ad.show();

  // 3. On completion
  if (result.rewarded) {
    await GratitudeStorage.addWarmUpPayment({
      date: today(),
      method: 'ad',
      cost: 0, // Free via ad
    });

    // Update streak calculation
    await GratitudeContext.recalculateStreak();

    // Show success modal
    showSuccessModal();
  }
}
```

**Error Handling**:
- Ad failed to load → Show retry option
- Ad dismissed early → No reward, allow retry
- Network offline → Graceful fallback message

**Localization**: All error messages and UI text support EN/DE/ES

**Implementation Status**: ✅ Rewarded ads fully implemented (PRODUCTION IDs active)
- `src/services/adService.ts` - Rewarded ad service with preloading
- `src/components/home/GratitudeStreakCard.tsx` - Integration point
- Translation keys added for all ad-related errors (EN/DE/ES)

---

## Implementation Guidelines

### Package Installation

```bash
npm install react-native-google-mobile-ads
```

### Configuration (`app.json`)

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "[ANDROID_APP_ID]",
          "iosAppId": "[IOS_APP_ID]"
        }
      ]
    ],
    "android": {
      "permissions": [
        "ACCESS_NETWORK_STATE",
        "INTERNET"
      ]
    }
  }
}
```

### AdBanner Component

```typescript
// src/components/ads/AdBanner.tsx
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  adUnitId: string;
  size?: BannerAdSize; // Default: BannerAdSize.BANNER (320x50)
}

export function AdBanner({ adUnitId, size = BannerAdSize.BANNER }: AdBannerProps) {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.backgroundSecondary }}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        onAdLoaded={() => console.log('Banner loaded')}
        onAdFailedToLoad={(error) => console.error('Banner failed', error)}
      />
    </View>
  );
}
```

### AdService (Rewarded Ads)

```typescript
// src/services/adService.ts
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

class AdService {
  private rewardedAd: RewardedAd | null = null;

  async loadRewardedAd(adUnitId: string): Promise<RewardedAd> {
    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId);
    await this.rewardedAd.load();
    return this.rewardedAd;
  }

  async showRewardedAd(): Promise<{ rewarded: boolean }> {
    if (!this.rewardedAd) throw new Error('Ad not loaded');

    return new Promise((resolve) => {
      this.rewardedAd!.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        resolve({ rewarded: true });
      });

      this.rewardedAd!.show();
    });
  }
}

export default new AdService();
```

---

## Testing

### Development Testing Strategy

1. **Use Test IDs** during development (see [Ad Unit IDs](#ad-unit-ids))
2. **Test Ad Loading**:
   - Fast network
   - Slow network (3G simulation)
   - Offline mode
3. **Test Ad Display**:
   - Light theme
   - Dark theme
   - Different screen sizes (iPhone SE, Pro Max, iPad)
4. **Test Rewarded Flow**:
   - Complete ad → Verify reward
   - Dismiss ad early → Verify no reward
   - Ad fails to load → Verify error handling

### Pre-Production Checklist

- [x] Replace all test IDs with production IDs ✅ (2026-01-12)
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Verify AdMob dashboard shows impressions
- [ ] Verify no console errors/warnings
- [ ] Test all 3 languages (EN/DE/ES)
- [ ] Test Light + Dark theme compatibility

---

## Localization

All AdMob-related UI text is fully localized (EN/DE/ES):

### Translation Keys

```typescript
// src/locales/en/index.ts
ads: {
  banner: {
    loading: 'Loading ad...',
    failed: 'Ad failed to load',
  },
  rewarded: {
    title: 'Restore Your Streak',
    description: 'Watch a short ad to restore your journal streak',
    buttonWatch: 'Watch Ad',
    buttonCancel: 'Not Now',
    loading: 'Loading ad...',
    playing: 'Ad is playing...',
    success: 'Streak Restored!',
    failed: 'Failed to load ad. Please try again.',
    dismissed: 'Ad was dismissed. No reward earned.',
  }
}
```

**Files**:
- English: `src/locales/en/index.ts`
- German: `src/locales/de/index.ts`
- Spanish: `src/locales/es/index.ts`

**Usage**:
```typescript
const { t } = useI18n();
<Text>{t('ads.rewarded.title')}</Text>
```

---

## Security & Privacy

### Data Collection

AdMob collects:
- Device information (model, OS version)
- Ad interaction data (views, clicks)
- Location (if user grants permission)

**Privacy Policy**: Must disclose AdMob data collection in app privacy policy

### GDPR Compliance (EU Users)

- Implement consent form before showing ads (if required by region)
- Use AdMob's User Messaging Platform (UMP) for consent management
- See: [AdMob GDPR Guide](https://support.google.com/admob/answer/10113207)

---

## Troubleshooting

### Common Issues

**Banner not showing**:
- Check App ID is correct in `app.json`
- Check Ad Unit ID is correct
- Verify network connection
- Check AdMob account status (not suspended)

**Rewarded ad not loading**:
- Check Ad Unit ID is correct
- Verify account has rewarded ads enabled
- Test with test Ad Unit ID first
- Check console for errors

**Low fill rate**:
- Normal for new apps (AdMob learns over time)
- Check AdMob dashboard for available ad inventory
- Consider enabling mediation partners

---

## Performance Considerations

### Banner Ads
- **Memory**: ~5-10MB per banner
- **Network**: ~100-500KB per ad load
- **Refresh**: Auto-refresh every 60s (configurable)

### Rewarded Ads
- **Memory**: ~10-20MB per ad
- **Network**: ~1-3MB per ad load
- **Preloading**: Load ad before user needs it (improves UX)

**Optimization**:
- Lazy load banners (only when screen visible)
- Preload rewarded ads on app launch
- Cache ads when possible

---

## Future Enhancements

### Planned Features
- [ ] Interstitial ads (optional, evaluate UX impact)
- [ ] Ad mediation (increase fill rate and revenue)
- [ ] A/B testing different banner placements
- [ ] Premium subscription (remove ads option)

### Not Planned
- ❌ Video ads in main screens (too intrusive)
- ❌ Banners in Journal entry screen (UX priority)
- ❌ Ads during level-up celebrations (UX priority)

---

## Related Documentation

- **WarmUp System Logic**: @technical-guides:My-Journal.md
- **Gamification System**: @technical-guides:Gamification-Core.md
- **Theme System**: @technical-guides.md (Theme & Color System section)
- **Localization Guidelines**: @technical-guides.md (i18n Guidelines section)

---

*This document is the single source of truth for all AdMob integration in SelfRise V2. Update this file when making changes to ad placements, IDs, or implementation.*
