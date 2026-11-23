/**
 * The pure rules of the tab bar (tested in __tests__/tabBarLogic.test.ts).
 */
import type { SignatureName } from '@/src/design/tokens';

/** The icon of each tab route (app/(tabs)/*). Every tab route must be here. */
export const TAB_ICON: Record<string, SignatureName> = {
  index: 'today',
  habits: 'habits',
  journal: 'journal',
  goals: 'goals',
  settings: 'settings',
};

export function tabIcon(routeName: string): SignatureName {
  return TAB_ICON[routeName] ?? 'today';
}

interface TabNavigation {
  emit: (event: {
    type: 'tabPress';
    target: string;
    canPreventDefault: true;
  }) => { defaultPrevented: boolean };
  navigate: (name: string, params?: object | undefined) => void;
}

/**
 * React Navigation's contract for a tab press: `tabPress` is always emitted (a
 * screen may scroll to the top on a second press), and only an unfocused tab
 * navigates — unless a listener prevented it.
 */
export function pressTab(
  navigation: TabNavigation,
  route: { key: string; name: string; params?: object | undefined },
  focused: boolean
): void {
  const event = navigation.emit({
    type: 'tabPress',
    target: route.key,
    canPreventDefault: true,
  });
  if (!focused && !event.defaultPrevented) {
    navigation.navigate(route.name, route.params);
  }
}
