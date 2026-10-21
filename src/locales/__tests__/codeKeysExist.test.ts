/**
 * Every translation key written in the code must exist in the locales.
 *
 * WHY (device test 2026-10-19): localeParity.test.ts only checks that EN, DE
 * and ES mirror EACH OTHER — a key used in code but defined nowhere passes it.
 * The onboarding first-goal screen asked for 'goals.form.unitPlaceholder'
 * (the text lives at 'goals.form.placeholders.unit') and showed the raw key
 * as the unit placeholder in every language.
 *
 * Scope: static keys — t('a.b.c'), i18n.t('…'), i18next.t('…'). Keys built at
 * runtime (t(`a.${x}`)) can't be checked here; they need their own domain test
 * (e.g. journalStreakMilestones.test.ts).
 *
 * If this fails, fix the key or add the text — never relax the test.
 */

import * as fs from 'fs';
import * as path from 'path';
import en from '../en';

const ROOT = path.resolve(__dirname, '../../..');
const SOURCE_DIRS = ['src', 'app'];

const flatten = (obj: Record<string, any>, prefix = '', out: Set<string> = new Set()) => {
  for (const [key, value] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    out.add(keyPath); // objects too — t(key, { returnObjects: true })
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, keyPath, out);
  }
  return out;
};

const EN_KEYS = flatten(en as Record<string, any>);
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

const existsInEn = (key: string) =>
  EN_KEYS.has(key) || PLURAL_SUFFIXES.some(suffix => EN_KEYS.has(`${key}${suffix}`));

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['__tests__', 'locales', 'node_modules'].includes(entry.name)) continue;
      sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Drop comments so documentation examples ("e.g. t('errors.saveFailed')") don't count. */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('translation keys used in code exist in the locales', () => {
  const files = SOURCE_DIRS.flatMap(dir => sourceFiles(path.join(ROOT, dir)));

  test('source scan found the app code', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  test('every static t() key exists in EN (DE/ES mirror EN via localeParity)', () => {
    const missing: string[] = [];
    const keyCall = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

    for (const file of files) {
      const code = stripComments(fs.readFileSync(file, 'utf8'));
      let match: RegExpExecArray | null;
      while ((match = keyCall.exec(code))) {
        const key = match[1]!;
        if (!key.includes('.')) continue; // not a namespaced translation key
        if (!existsInEn(key)) {
          const line = code.slice(0, match.index).split('\n').length;
          missing.push(`${path.relative(ROOT, file)}:${line} → ${key}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
