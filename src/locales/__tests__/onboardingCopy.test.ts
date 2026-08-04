/**
 * Keeps the onboarding copy short enough to stay onboarding.
 *
 * WHY THIS EXISTS: the 25-step tutorial being replaced had NINE steps that only
 * talked, and its welcome text ran to 244 characters — around eight lines,
 * which is how it ended up clipped on a real phone. Every one of those steps
 * started as a reasonable idea.
 *
 * The new flow allows exactly one talking screen. These caps are the executable
 * version of that decision: they leave comfortable room for German and Spanish
 * (which run longer than English) while making "let's also explain X here" fail
 * loudly instead of quietly costing users.
 *
 * If a cap is hit, the fix is to cut the text — not to raise the number.
 */
import en from '../en';
import de from '../de';
import es from '../es';

const locales = { en, de, es } as Record<string, any>;

/** Roughly one line, two lines, and four lines at the sizes these render at. */
const LIMITS: Record<string, number> = {
  'welcome.title': 40,
  'welcome.tagline': 70,
  'welcome.promise': 170,
  'welcome.cta': 25,
  'habit.title': 60,
  'habit.subtitle': 90,
  'goal.title': 60,
  'goal.subtitle': 110,
  'done.title': 40,
  'done.body': 130,
};

const read = (locale: any, path: string): string =>
  path.split('.').reduce((node, key) => node?.[key], locale.onboarding);

describe('onboarding copy length', () => {
  for (const [name, locale] of Object.entries(locales)) {
    describe(name, () => {
      for (const [path, limit] of Object.entries(LIMITS)) {
        it(`${path} stays under ${limit} characters`, () => {
          const value = read(locale, path);
          expect(typeof value).toBe('string');
          expect(value.length).toBeLessThanOrEqual(limit);
        });
      }
    });
  }

  it('keeps the whole welcome screen well under the old tutorial 244-char step', () => {
    for (const [name, locale] of Object.entries(locales)) {
      const total =
        read(locale, 'welcome.tagline').length + read(locale, 'welcome.promise').length;
      expect({ name, total }).toEqual({ name, total: expect.any(Number) });
      expect(total).toBeLessThanOrEqual(220);
    }
  });
});
