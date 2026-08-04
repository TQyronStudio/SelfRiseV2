import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useRef } from 'react';
import { impact as hapticImpact, ImpactFeedbackStyle } from '@/src/services/hapticsService';

export function HapticTab(props: BottomTabBarButtonProps & { nativeID?: string }) {
  // `nativeID` used to let the tutorial overlay locate this tab on screen. The
  // overlay is gone; the prop is kept because it is still a valid DOM/native id
  // and callers pass it.
  const tabRef = useRef<any>(null);

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
