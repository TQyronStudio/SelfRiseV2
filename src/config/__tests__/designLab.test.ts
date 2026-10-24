/**
 * Design Lab is an internal tool on mock data. A store build (no __DEV__, no
 * opt-in flag) must never show its Settings entry or open its screen.
 */
import * as fs from 'fs';
import * as path from 'path';
import { isDesignLabEnabled } from '../designLab';

const ROOT = path.resolve(__dirname, '../../..');
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

describe('isDesignLabEnabled', () => {
  it('is hidden in a store build without the opt-in flag', () => {
    expect(isDesignLabEnabled(false, undefined)).toBe(false);
    expect(isDesignLabEnabled(false, '')).toBe(false);
    expect(isDesignLabEnabled(false, 'false')).toBe(false);
    expect(isDesignLabEnabled(false, 'TRUE')).toBe(false);
  });

  it('is shown when running from the dev server', () => {
    expect(isDesignLabEnabled(true, undefined)).toBe(true);
  });

  it('is shown when the local .env opts in', () => {
    expect(isDesignLabEnabled(false, 'true')).toBe(true);
  });
});

describe('Design Lab wiring', () => {
  it('Settings renders the entry only behind the gate', () => {
    const settings = read('app/(tabs)/settings.tsx');
    expect(settings).toMatch(/const SHOW_DESIGN_LAB = isDesignLabEnabled\(\);/);
    expect(settings).toMatch(/\{SHOW_DESIGN_LAB && \(/);
  });

  it('the route redirects away when the lab is disabled (deep links included)', () => {
    const route = read('app/design-lab.tsx');
    expect(route).toMatch(/if \(!isDesignLabEnabled\(\)\)/);
    expect(route).toMatch(/<Redirect /);
  });
});
