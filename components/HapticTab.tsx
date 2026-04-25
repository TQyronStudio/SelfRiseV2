import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useRef, useEffect } from 'react';
import { useTutorialTarget } from '@/src/utils/TutorialTargetHelper';
import { impact as hapticImpact, ImpactFeedbackStyle } from '@/src/services/hapticsService';

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
    }

    return () => {
      if (props.nativeID) {
        unregisterTarget();
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
          hapticImpact(ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
