/**
 * The tab bar of the new look (migration E3; from the Design Lab's BottomChrome):
 * the app's own icons (the icon font, one shape in both states), the open tab in
 * the app's blue with a gold core, the others muted, and a soft pill that glides
 * under the open tab.
 *
 * Wired into expo-router's <Tabs tabBar={…}>. Presses follow React Navigation's
 * contract: `tabPress` is always emitted (a screen may scroll to the top on a
 * second press), and only an unfocused tab navigates.
 *
 * The bar spans the full width; its icons sit in the content column on a tablet
 * (technical-guides:Large-Screens.md). It stays in the layout flow, so every
 * screen ends above it — the ad banner of each screen sits right on top of it.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useDesign } from '@/src/contexts/ThemeContext';
import { fonts, radius } from '@/src/design/tokens';
import { contentColumn } from '@/src/utils/layout';
import { AppText, PressableScale } from './primitives';
import { SignatureIcon } from './SignatureIcon';
import { pressTab, tabIcon } from './tabBarLogic';

export const TAB_BAR_HEIGHT = 60;
const PILL_WIDTH = 52;
const PILL_HEIGHT = 30;
const PILL_TOP = 8;
const ICON_SIZE = 23;
const GLIDE = { damping: 18, stiffness: 220, mass: 0.8 };

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { c } = useDesign();
  const insets = useSafeAreaInsets();
  const tabWidth = useSharedValue(0);
  const indicatorX = useSharedValue(state.index);

  // Follows the open tab from any source (a tap, a link, the tutorial).
  useEffect(() => {
    indicatorX.value = withSpring(state.index, GLIDE);
  }, [state.index, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    // Hidden until measured, or it would flash at the left edge.
    opacity: tabWidth.value > 0 ? 1 : 0,
    transform: [
      {
        translateX:
          indicatorX.value * tabWidth.value + (tabWidth.value - PILL_WIDTH) / 2,
      },
    ],
  }));

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.tabBar,
          borderTopColor: c.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View
        style={[contentColumn, styles.row]}
        onLayout={e => {
          tabWidth.value = e.nativeEvent.layout.width / state.routes.length;
        }}
      >
        <Animated.View
          style={[
            styles.pill,
            styles.indicator,
            { backgroundColor: c.primarySoft },
            indicatorStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const label = options?.title ?? route.name;
          const icon = tabIcon(route.name);
          return (
            <PressableScale
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              pressScale={0.92}
              onPress={() => pressTab(navigation, route, focused)}
              style={styles.tab}
            >
              <View style={styles.pill}>
                <SignatureIcon
                  name={icon}
                  size={ICON_SIZE}
                  tones={
                    focused
                      ? [c.primary, c.accentWarm]
                      : [c.textFaint, c.textFaint]
                  }
                />
              </View>
              <AppText
                variant="caption"
                tone={focused ? 'primary' : 'muted'}
                numberOfLines={1}
                style={[
                  styles.label,
                  focused && { fontFamily: fonts.semibold },
                ]}
              >
                {label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: PILL_TOP,
  },
  label: {
    marginTop: 2,
  },
});
