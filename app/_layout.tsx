import 'react-native-get-random-values';

// Note: Console suppression for ExpoLinearGradient removed - no longer needed with react-native-linear-gradient

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';

// Import i18n configuration to initialize internationalization
import '../src/config/i18n';
import { RootProvider } from '../src/contexts';

// Note: ExpoLinearGradient warning suppression removed - 
// switched to react-native-linear-gradient to eliminate warning at source

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="journal-history" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="journal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="habit-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="goal-stats" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" translucent={true} />
      </RootProvider>
    </GestureHandlerRootView>
  );
}
