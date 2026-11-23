import * as fs from 'fs';
import * as path from 'path';
import { pressTab, TAB_ICON } from '../tabBarLogic';

const navigation = (prevented = false) => {
  const calls: string[] = [];
  return {
    calls,
    emit: (e: { type: string; target: string }) => {
      calls.push(`emit ${e.type} ${e.target}`);
      return { defaultPrevented: prevented };
    },
    navigate: (name: string) => {
      calls.push(`navigate ${name}`);
    },
  };
};

describe('pressTab()', () => {
  const route = { key: 'habits-1', name: 'habits' };

  it('emits tabPress and opens an unfocused tab', () => {
    const nav = navigation();
    pressTab(nav, route, false);
    expect(nav.calls).toEqual(['emit tabPress habits-1', 'navigate habits']);
  });

  it('only emits on the open tab (a screen may scroll to the top)', () => {
    const nav = navigation();
    pressTab(nav, route, true);
    expect(nav.calls).toEqual(['emit tabPress habits-1']);
  });

  it('does not navigate when a listener prevented it', () => {
    const nav = navigation(true);
    pressTab(nav, route, false);
    expect(nav.calls).toEqual(['emit tabPress habits-1']);
  });
});

describe('tab icons', () => {
  it('has an icon for every tab route in app/(tabs)', () => {
    const dir = path.resolve(__dirname, '../../../../app/(tabs)');
    const routes = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.tsx') && !f.startsWith('_'))
      .map(f => f.replace(/\.tsx$/, ''));
    expect(routes.length).toBe(5);
    for (const route of routes) expect(TAB_ICON[route]).toBeDefined();
  });
});
