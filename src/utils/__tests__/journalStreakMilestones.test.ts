// Every celebrated journal streak day must show real texts in every language
//
// WHY (tester screenshot 2026-10-19): the 75-day celebration showed
// "journal.streakMilestone75_title" / "_text". The journal celebrated 17 days,
// texts existed for 6, and `t(key) || generic` never fell back because t()
// returns the KEY (truthy) for a missing text. The generic text was broken
// too: code replaced '{days}' while the locale has '{{days}}'.

import i18next from 'i18next';
import en from '../../locales/en';
import de from '../../locales/de';
import es from '../../locales/es';
import {
  JOURNAL_STREAK_MILESTONES,
  getJournalStreakMilestoneTexts,
  isJournalStreakMilestone,
} from '../journalStreakMilestones';

beforeAll(async () => {
  await i18next.init({
    resources: { en: { translation: en }, de: { translation: de }, es: { translation: es } },
    lng: 'en',
    fallbackLng: false, // a missing DE/ES text must NOT be hidden by English
    interpolation: { escapeValue: false },
  });
});

describe.each(['en', 'de', 'es'])('journal streak milestones (%s)', (lang) => {
  beforeAll(async () => {
    await i18next.changeLanguage(lang);
  });

  test.each([...JOURNAL_STREAK_MILESTONES])('day %i has real title and message — no raw key, no placeholder', (days) => {
    const { title, message } = getJournalStreakMilestoneTexts(days);

    for (const text of [title, message]) {
      expect(text).not.toMatch(/journal\.|streakMilestone/);
      expect(text).not.toMatch(/[{}]/);
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('a day without own texts gets the generic texts WITH the day count', () => {
    const { message } = getJournalStreakMilestoneTexts(75);
    expect(message).toContain('75');
  });
});

describe('isJournalStreakMilestone', () => {
  test('celebrates exactly the listed days', () => {
    expect(isJournalStreakMilestone(75)).toBe(true);
    expect(isJournalStreakMilestone(7)).toBe(true);
    expect(isJournalStreakMilestone(8)).toBe(false);
    expect(isJournalStreakMilestone(0)).toBe(false);
  });
});
