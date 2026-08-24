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
import { HOW_IT_WORKS_SECTIONS, allHowItWorksTopicKeys } from '../../constants/helpTopics';

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

/**
 * The "How SelfRise works" screen builds itself from HOW_IT_WORKS_SECTIONS, so a
 * key renamed in the locales — or a section added without its heading — shows up
 * as a raw key string on screen and nothing else notices. The tooltip scan above
 * cannot catch it: these keys live in a constant, not in a `helpKey=` prop.
 */
describe('how-it-works screen keys', () => {
  it('has sections and topics to check', () => {
    // A guard on the guard: an emptied constant would make everything below
    // pass while asserting nothing.
    expect(HOW_IT_WORKS_SECTIONS.length).toBeGreaterThanOrEqual(3);
    expect(allHowItWorksTopicKeys().length).toBeGreaterThanOrEqual(6);
  });

  it('never lists the same topic twice', () => {
    const keys = allHowItWorksTopicKeys();
    expect(keys).toEqual([...new Set(keys)]);
  });

  for (const [name, locale] of Object.entries({ en, de, es } as Record<string, any>)) {
    describe(name, () => {
      it('has a heading for every section', () => {
        const broken = HOW_IT_WORKS_SECTIONS.filter(section => {
          const heading = resolve(locale, section.titleKey);
          return typeof heading !== 'string' || !heading.trim();
        }).map(section => section.titleKey);
        expect(broken).toEqual([]);
      });

      it('has a title and content for every topic', () => {
        const broken = allHowItWorksTopicKeys().filter(key => {
          const entry = resolve(locale, key);
          return (
            !entry ||
            typeof entry.title !== 'string' ||
            typeof entry.content !== 'string' ||
            !entry.title.trim() ||
            !entry.content.trim()
          );
        });
        expect(broken).toEqual([]);
      });

      it('has the screen intro', () => {
        expect(typeof locale.help?.howItWorksIntro).toBe('string');
        expect(locale.help?.howItWorksIntro?.trim()).toBeTruthy();
      });
    });
  }
});
