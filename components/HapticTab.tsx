import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { useRef, useEffect } from 'react';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';

export function HapticTab(props: BottomTabBarButtonProps & { nativeID?: string }) {
  const tabRef = useRef<any>(null);

  // Register as tutorial target if nativeID is provided
  const { registerTarget, unregisterTarget } = useTutorialTarget(
    props.nativeID || '',
    tabRef
  );

  useEffect(() => {
    if (props.nativeID) {
      registerTarget();
      console.log(`📍 [TUTORIAL] Registered tab target: ${props.nativeID}`);
    }

    return () => {
      if (props.nativeID) {
        unregisterTarget();
        console.log(`📍 [TUTORIAL] Unregistered tab target: ${props.nativeID}`);
      }
    };
  }, [props.nativeID, registerTarget, unregisterTarget]);

  return (
    <PlatformPressable
      {...props}
      ref={tabRef}
      nativeID={props.nativeID}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
