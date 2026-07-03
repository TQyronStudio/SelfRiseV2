import 'react-native-get-random-values';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

// Import i18n configuration to initialize internationalization
import '../src/config/i18n';
import { RootProvider } from '../src/contexts';
import { useTheme } from '../src/contexts/ThemeContext';
import { useI18n } from '../src/hooks/useI18n';

// Initialize Monthly Progress Integration for challenge tracking
import '../src/services';

// Tutorial System
import { TutorialProvider, TutorialOverlay } from '../src/components/tutorial';

// Notification Lifecycle
import { useNotificationLifecycle } from '../src/hooks/useNotificationLifecycle';

// Firebase Analytics with ATT
import { useFirebaseAnalytics } from '../src/hooks/useFirebaseAnalytics';

// AdMob UMP (GDPR) consent + ads initialization
import { initializeAdsWithConsent } from '../src/services/adConsentService';

// SQLite Database
import { initializeDatabase } from '../src/services/database/init'; // ENABLED: Development build ready
import { initHaptics } from '../src/services/hapticsService';

// Dev-only warning suppressions — keep this list SHORT and justified (audit N22).
// Removed SDK 53-era entries (ExpoLinearGradient view config, ViewPropTypes,
// componentWillReceiveProps, expo-router route/layout noise): the underlying
// warnings no longer exist on SDK 55 / RN 0.83 / React 19, and blanket
// suppressions can hide real errors.
LogBox.ignoreLogs([
  // Known-harmless RN core Animated noise (particle/celebration animations).
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  // Notifications run a mock implementation until the native rebuild
  // (NOTIFICATION_REBUILD_GUIDE.md) — remove after the rebuild ships.
  'Cannot find native module \'ExpoPushTokenManager\'',
]);

function LayoutContent() {
  // Initialize notification lifecycle management (unconditional hook)
  // Mock implementation active - requires native rebuild for full functionality
  useNotificationLifecycle();

  // Initialize Firebase Analytics with ATT (App Tracking Transparency)
  // Requests ATT permission on iOS 14+, then logs 'app_open' event
  useFirebaseAnalytics();

  // Run UMP (GDPR) consent flow, then initialize AdMob.
  // Separate from ATT above: ATT = Apple tracking; UMP = Google ad-personalization consent.
  useEffect(() => {
    initializeAdsWithConsent();
  }, []);

  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <TutorialProvider>
      <TutorialOverlay>
            <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="achievements" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="journal-history" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="journal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="habit-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="goal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="levels-overview" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="reorder-habits" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" translucent={true} />
      </TutorialOverlay>
    </TutorialProvider>
  );
}

// Shown when SQLite cannot be initialized even after retries. The entire data
// layer depends on the database — continuing without it would cascade errors
// through every storage call and risk silent data loss, so we stop here and
// let the user retry instead. (Rendered before RootProvider, so no ThemeContext.
// i18n works here: useI18n binds to the global i18next instance initialized by
// the `src/config/i18n` module import above, and re-renders once it's ready.)
function DatabaseErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <View style={dbErrorStyles.container}>
      <Text style={dbErrorStyles.title}>{t('errors.database.title')}</Text>
      <Text style={dbErrorStyles.message}>{t('errors.database.message')}</Text>
      <TouchableOpacity
        style={dbErrorStyles.button}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={t('errors.database.retry')}
      >
        <Text style={dbErrorStyles.buttonText}>{t('errors.database.retry')}</Text>
      </TouchableOpacity>
      <Text style={dbErrorStyles.hint}>{t('errors.database.hint')}</Text>
    </View>
  );
}

const dbErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07051A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#C7C5D9',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#6E6B85',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 24,
  },
});

const DB_INIT_MAX_ATTEMPTS = 3;

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbInitFailed, setDbInitFailed] = useState(false);

  // CRITICAL: Database must initialize BEFORE RootProvider (which contains
  // GratitudeProvider and other storage consumers). Retries with backoff;
  // on persistent failure shows an explicit error screen instead of letting
  // the app run with a dead data layer ("continue anyway" caused every
  // subsequent storage call to throw).
  const initDatabase = useCallback(async () => {
    setDbInitFailed(false);
    for (let attempt = 1; attempt <= DB_INIT_MAX_ATTEMPTS; attempt++) {
      try {
        await initializeDatabase();
        console.log('✅ SQLite database ready');
        setDbInitialized(true);
        return;
      } catch (error) {
        console.error(
          `❌ SQLite initialization failed (attempt ${attempt}/${DB_INIT_MAX_ATTEMPTS}):`,
          error
        );
        if (attempt < DB_INIT_MAX_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        }
      }
    }
    setDbInitFailed(true);
  }, []);

  useEffect(() => {
    initDatabase();
    // Haptics are non-critical — never block startup or trigger the error UI.
    initHaptics().catch(error => {
      console.warn('Haptics initialization failed (non-critical):', error);
    });
  }, [initDatabase]);

  if (dbInitFailed) {
    return <DatabaseErrorScreen onRetry={initDatabase} />;
  }

  if (!loaded || !dbInitialized) {
    // Wait for fonts AND database before showing app
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootProvider>
        <LayoutContent />
      </RootProvider>
    </GestureHandlerRootView>
  );
}
