# 🔧 Notification System - Native Rebuild Required

## ❌ Current Issue
`expo-notifications` package requires **native modules** that aren't available until you rebuild the app.

**Error**: `Cannot find native module 'ExpoPushTokenManager'`

## ✅ Solution: Native Rebuild

### Option 1: EAS Build (Recommended for Production)
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile development

# Build for Android
eas build --platform android --profile development
```

### Option 2: Local Development Build (Faster for Testing)
```bash
# iOS (requires Xcode and Mac)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android
```

## 📝 What Was Changed

### Files Modified:
1. **app.json** - Added expo-notifications plugin and Android permissions
2. **app/_layout.tsx** - Mock useNotificationLifecycle hook (no-op until rebuild)
3. **app/(tabs)/settings.tsx** - NotificationSettings component commented out
4. **Created Notification System**:
   - `src/services/notifications/notificationService.ts`
   - `src/services/notifications/notificationScheduler.ts`
   - `src/services/notifications/progressAnalyzer.ts`
   - `src/hooks/useNotificationLifecycle.ts` (mock version)
   - `src/hooks/useNotificationLifecycle.ts.disabled` (original backup)
   - `src/components/settings/NotificationSettings.tsx`

### After Rebuild - Re-enable Notifications:

**Step 1**: Replace mock with real implementation:
```bash
# Delete mock
rm src/hooks/useNotificationLifecycle.ts

# Restore original
mv src/hooks/useNotificationLifecycle.ts.disabled src/hooks/useNotificationLifecycle.ts
```

**Step 2**: Uncomment NotificationSettings in `app/(tabs)/settings.tsx`:
```typescript
// Remove comment from import
import { NotificationSettings } from '@/src/components/settings/NotificationSettings';

// Uncomment in render
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Notifications</Text>
  <NotificationSettings />
</View>
```

## 🚀 Testing Notifications

After rebuild, test:
1. Go to Settings tab
2. Enable "Afternoon Reminder" or "Evening Reminder"
3. Grant notification permissions when prompted
4. Notifications will be scheduled at configured times (16:00 / 20:00)

## 📚 Documentation
See `projectplan.md` Phase 7.1 for full implementation details.
