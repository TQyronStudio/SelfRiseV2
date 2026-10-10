// Monthly challenge texts must be TRANSLATED, never raw i18n keys
//
// WHY THIS EXISTS (tester screenshot 2026-10-10): the 25 % milestone modal
// showed "help.challenges.templates.habits_consistency_master.title" as the
// challenge name. Root cause: the lifecycle manager — the path that generates
// the challenge on startup and at the month boundary — passed a MOCK t
// `(key) => key` into generation, so the persisted title/description/
// requirements were raw keys. Only some screens healed them at render time.

// utils/i18n pulls in notifications → native Expo modules; not under test here
jest.mock('../notifications/notificationScheduler', () => ({ notificationScheduler: {} }));
jest.mock('../../config/i18n', () => {
  const i18nextModule = require('i18next');
  return { __esModule: true, default: i18nextModule.default ?? i18nextModule };
});

import i18next from 'i18next';
import en from '../../locales/en';
import de from '../../locales/de';
import { MonthlyChallengeLifecycleManager } from '../monthlyChallengeLifecycleManager';
import { translateIfKey } from '../../utils/i18n';
import {
  getChallengeTitle,
  getChallengeDescription,
  getRequirementDescription,
  FALLBACK_TEMPLATE_PREFIX,
  __resetChallengeTextCache,
} from '../challengeDisplayText';

const TITLE_KEY = 'help.challenges.templates.habits_consistency_master.title';

beforeAll(async () => {
  await i18next.init({
    resources: { en: { translation: en }, de: { translation: de } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
});

afterEach(async () => {
  await i18next.changeLanguage('en');
});

describe('MonthlyChallengeLifecycleManager translation function', () => {
  const getT = () => (MonthlyChallengeLifecycleManager as any).getTranslationFunction();

  test('resolves template keys to text, not to the key itself', () => {
    const title = getT()(TITLE_KEY);
    expect(title).not.toBe(TITLE_KEY);
    expect(title).toBe((en as any).help.challenges.templates.habits_consistency_master.title);
  });

  test('uses the current language at call time', async () => {
    const t = getT();
    await i18next.changeLanguage('de');
    expect(t(TITLE_KEY)).toBe((de as any).help.challenges.templates.habits_consistency_master.title);
  });

  test('keeps interpolation and plurals (journal_consistency_writer.descriptionDynamic)', () => {
    const text = getT()('help.challenges.templates.journal_consistency_writer.descriptionDynamic', { count: 3 });
    expect(text).toContain('3');
    expect(text).not.toContain('help.challenges');
  });
});

describe('translateIfKey — heals challenges already stored with a raw key', () => {
  test('a stored title key renders as the translated title (milestone / failure modal)', () => {
    expect(translateIfKey(TITLE_KEY)).toBe((en as any).help.challenges.templates.habits_consistency_master.title);
  });

  test('already translated text passes through unchanged', () => {
    expect(translateIfKey('Consistency Master')).toBe('Consistency Master');
  });
});

describe('challengeDisplayText — challenge texts follow the CURRENT language', () => {
  // Generated in English, then the user switches the app to German mid-month
  const enTemplates = (en as any).help.challenges.templates;
  const deTemplates = (de as any).help.challenges.templates;

  const storedInEnglish = {
    templateId: 'habits_consistency_master',
    title: enTemplates.habits_consistency_master.title,
    description: enTemplates.habits_consistency_master.description,
    starLevel: 2,
  };

  beforeEach(() => __resetChallengeTextCache());

  test('title and description switch language with the app', async () => {
    expect(getChallengeTitle(storedInEnglish)).toBe(enTemplates.habits_consistency_master.title);

    await i18next.changeLanguage('de');
    expect(getChallengeTitle(storedInEnglish)).toBe(deTemplates.habits_consistency_master.title);
    expect(getChallengeDescription(storedInEnglish)).toBe(deTemplates.habits_consistency_master.description);
  });

  test('requirement descriptions switch language (matched by trackingKey)', async () => {
    await i18next.changeLanguage('de');
    const text = getRequirementDescription(storedInEnglish, {
      trackingKey: 'scheduled_habit_completions',
      description: enTemplates.habits_consistency_master.requirement,
    });
    expect(text).toBe(deTemplates.habits_consistency_master.requirement);
  });

  test('star-dependent description keeps its count in the new language', async () => {
    await i18next.changeLanguage('de');
    const text = getChallengeDescription({
      templateId: 'journal_consistency_writer',
      title: enTemplates.journal_consistency_writer.title,
      starLevel: 3,
    });
    expect(text).toBe(deTemplates.journal_consistency_writer.descriptionDynamic_other.replace('{{count}}', '3'));
  });

  test('fallback challenge keeps its prefix and suffix in the new language', async () => {
    await i18next.changeLanguage('de');
    const source = { templateId: `${FALLBACK_TEMPLATE_PREFIX}habits_consistency_master`, title: 'Fallback: x', description: 'x' };
    expect(getChallengeTitle(source)).toBe(
      `${(de as any).monthlyChallenge.fallback.titlePrefix}: ${deTemplates.habits_consistency_master.title}`
    );
    expect(getChallengeDescription(source)).toContain((de as any).monthlyChallenge.fallback.descriptionSuffix);
  });

  test('no template (marketing demo) → stored text; stored raw key → healed', () => {
    expect(getChallengeTitle({ title: 'Balanced Momentum' })).toBe('Balanced Momentum');
    expect(getChallengeTitle({ templateId: 'marketing-balanced-month', title: 'Balanced Momentum' })).toBe('Balanced Momentum');
    expect(getChallengeTitle({ title: TITLE_KEY })).toBe(enTemplates.habits_consistency_master.title);
  });
});
