/**
 * First-launch language: a German or Spanish phone must open the app in its own
 * language, everything else in English.
 */
import * as fs from 'fs';
import * as path from 'path';
import { resolveDeviceLanguage, APP_LANGUAGES, FALLBACK_LANGUAGE } from '../deviceLanguage';

describe('resolveDeviceLanguage', () => {
  it.each([
    ['de', 'de'],
    ['es', 'es'],
    ['en', 'en'],
    ['DE', 'de'],
  ])('a %s phone gets %s', (languageCode, expected) => {
    expect(resolveDeviceLanguage([{ languageCode }])).toBe(expected);
  });

  it('falls back to English for a language the app does not ship', () => {
    expect(resolveDeviceLanguage([{ languageCode: 'cs' }])).toBe('en');
    expect(resolveDeviceLanguage([{ languageCode: 'fr' }, { languageCode: 'pl' }])).toBe('en');
  });

  it('walks the whole preference list, like the OS does', () => {
    expect(resolveDeviceLanguage([{ languageCode: 'cs' }, { languageCode: 'es' }])).toBe('es');
  });

  it('takes the first supported language, not the last', () => {
    expect(resolveDeviceLanguage([{ languageCode: 'de' }, { languageCode: 'en' }])).toBe('de');
  });

  it('survives missing or empty locale data', () => {
    expect(resolveDeviceLanguage([])).toBe(FALLBACK_LANGUAGE);
    expect(resolveDeviceLanguage(null)).toBe(FALLBACK_LANGUAGE);
    expect(resolveDeviceLanguage(undefined)).toBe(FALLBACK_LANGUAGE);
    expect(resolveDeviceLanguage([{ languageCode: null }, {}])).toBe(FALLBACK_LANGUAGE);
  });

  it('knows exactly the languages the app ships', () => {
    const shipped = fs
      .readdirSync(path.join(__dirname, '../../locales'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('__'))
      .map(entry => entry.name)
      .sort();
    expect([...APP_LANGUAGES].sort()).toEqual(shipped);
  });
});
