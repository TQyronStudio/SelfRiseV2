/**
 * Language errors of the live app fixed 2026-11-24 (decisions in
 * design-migration-texts.md, "Rozhodnutí otázek"): no English slang in German
 * cards, the monthly challenge is not called a "goal", Spanish greets everyone.
 */
import de from '../de';
import es from '../es';

const strings = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(strings)
      : [];

it('German recommendation cards speak German', () => {
  const cards = strings(de.home?.recommendationCards).join('\n');
  expect(cards).not.toMatch(/on Fire|Streak|Level Up|Check\b/);
  expect(cards).not.toMatch(/Gewohnheit/);
});

it('German never calls the monthly challenge a goal', () => {
  expect(de.monthlyChallenge?.title).not.toMatch(/ziel/i);
  expect(de.home?.customization?.componentNames?.monthlyChallenges).not.toMatch(/ziel/i);
});

it('Spanish greets without a gendered "Bienvenido de nuevo"', () => {
  expect(strings(es).join('\n')).not.toMatch(/Bienvenido de nuevo/);
});
