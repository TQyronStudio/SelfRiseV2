/**
 * Every `helpKey` used in the app must resolve to a real help entry — in all
 * three languages.
 *
 * WHY THE OTHER TESTS DO NOT COVER THIS: localeParity checks that DE and ES
 * mirror EN, so a key misspelt identically everywhere, or a helpKey pointing at
 * something that was never written, passes it happily. TypeScript does not help
 * either: `helpKey` is a plain string prop. The failure only shows up at
 * runtime as a tooltip rendering its own key, or nothing at all.
 *
 * This matters more since the 25-step tutorial was retired: help tooltips and
 * empty states are now the only place several features explain themselves.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import en from '../en';
import de from '../de';
import es from '../es';

const ROOT = join(__dirname, '../../..');
const SEARCH_DIRS = [join(ROOT, 'src'), join(ROOT, 'app')];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const usedKeys = new Set<string>();
for (const dir of SEARCH_DIRS) {
  for (const file of walk(dir)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/helpKey="([^"]+)"/g)) {
      usedKeys.add(match[1]!);
    }
  }
}

const resolve = (locale: any, key: string) =>
  key.split('.').reduce((node, part) => node?.[part], locale.help);

describe('help tooltip keys', () => {
  it('finds the tooltips that are actually wired up', () => {
    // A guard on the guard: if the scan silently matched nothing, every test
    // below would pass while checking absolutely nothing.
    expect(usedKeys.size).toBeGreaterThanOrEqual(10);
  });

  for (const [name, locale] of Object.entries({ en, de, es } as Record<string, any>)) {
    describe(name, () => {
      it('has a title and content for every key used in the app', () => {
        const broken: string[] = [];
        for (const key of usedKeys) {
          const entry = resolve(locale, key);
          if (!entry || typeof entry.title !== 'string' || typeof entry.content !== 'string') {
            broken.push(key);
          }
          if (entry && (!entry.title?.trim() || !entry.content?.trim())) {
            broken.push(`${key} (empty)`);
          }
        }
        expect(broken).toEqual([]);
      });
    });
  }
});
