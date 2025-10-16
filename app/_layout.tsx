import 'react-native-get-random-values';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { useEffect, useState } from 'react';

// Import i18n configuration to initialize internationalization
import '../src/config/i18n';
import { RootProvider } from '../src/contexts';
import { Colors } from '../src/constants/colors';

// Initialize Monthly Progress Integration for challenge tracking
import '../src/services';

// Tutorial System
import { TutorialProvider, TutorialOverlay } from '../src/components/tutorial';

// Notification Lifecycle
import { useNotificationLifecycle } from '../src/hooks/useNotificationLifecycle';

// SQLite Database
import { initializeDatabase } from '../src/services/database/init'; // ENABLED: Development build ready

// Suppress ExpoLinearGradient view config warnings
LogBox.ignoreLogs([
  'Unable to get the view config for',
  'ExpoLinearGradient',
  'ViewPropTypes will be removed',
  'componentWillReceiveProps has been renamed',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Route "./(tabs)/settings.tsx" is missing the required default export',
  '[Layout children]: Too many screens defined',
  'Cannot find native module \'ExpoPushTokenManager\'',
]);

function LayoutContent() {
  // Initialize notification lifecycle management (unconditional hook)
  // Mock implementation active - requires native rebuild for full functionality
  useNotificationLifecycle();

  return (
    <TutorialProvider>
      <TutorialOverlay>
            <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="achievements" 
            options={{ 
              headerShown: true,
              title: 'Trophy Room',
              headerBackTitle: 'Home',
              headerStyle: {
                backgroundColor: Colors.primary,
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              presentation: 'card' 
            }} 
          />
          <Stack.Screen name="journal-history" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="journal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="habit-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="goal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="levels-overview" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" translucent={true} />
      </TutorialOverlay>
    </TutorialProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [dbInitialized, setDbInitialized] = useState(false);

  // PHASE 1.1.2: SQLite initialization ENABLED (development build ready)
  // CRITICAL: Must initialize BEFORE RootProvider (which contains GratitudeProvider)
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log('✅ SQLite database ready');
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('❌ SQLite initialization failed:', error);
        setDbInitialized(true); // Continue anyway for now
      });
  }, []);

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
