// Monthly challenge texts in the CURRENT language
//
// A challenge's title/description/requirements are persisted as text in the
// language that was active when it was generated. Switching the app language
// mid-month would leave them in the old language. Every challenge from a
// template stores its `templateId`, so the texts are rebuilt here from the
// template in the current language instead.
//
// Without a template (marketing demo, rows from before templateId existed)
// the stored text is used, healed through translateIfKey (raw i18n keys
// stored by the pre-October-2026 lifecycle manager).
//
// RULE: every place that renders a challenge title, description or
// requirement description goes through this module.

import i18next, { TFunction } from 'i18next';
import { AchievementCategory, MonthlyChallengeTemplate } from '../types/gamification';
import { MonthlyChallengeService } from './monthlyChallengeService';
import { translateIfKey } from '../utils/i18n';

/**
 * templateId prefix of a fallback challenge (generated when normal generation
 * failed) — same template, plus the fallback title prefix / description suffix.
 */
export const FALLBACK_TEMPLATE_PREFIX = 'fallback:';

/** Template whose description depends on the star level (count per day). */
const STAR_DYNAMIC_DESCRIPTION_TEMPLATE = 'journal_consistency_writer';

const TEMPLATE_CATEGORIES: AchievementCategory[] = [
  AchievementCategory.HABITS,
  AchievementCategory.JOURNAL,
  AchievementCategory.GOALS,
  AchievementCategory.CONSISTENCY,
];

export interface ChallengeTextSource {
  templateId?: string | undefined;
  title: string;
  description?: string | undefined;
  starLevel?: number | undefined;
}

// Templates resolved per language — building them runs ~90 t() calls
let cachedLanguage: string | null = null;
let cachedTemplates = new Map<string, MonthlyChallengeTemplate>();

function t(...args: Parameters<TFunction>): string {
  return i18next.t(...args) as string;
}

function getTemplate(templateId: string): MonthlyChallengeTemplate | undefined {
  if (cachedLanguage !== i18next.language) {
    cachedTemplates = new Map();
    for (const category of TEMPLATE_CATEGORIES) {
      for (const template of MonthlyChallengeService.getTemplatesForCategory(category, t as TFunction)) {
        cachedTemplates.set(template.id, template);
      }
    }
    cachedLanguage = i18next.language;
  }
  return cachedTemplates.get(templateId);
}

function resolve(source: { templateId?: string | undefined }): { template?: MonthlyChallengeTemplate; isFallback: boolean } {
  if (!source.templateId) return { isFallback: false };
  const isFallback = source.templateId.startsWith(FALLBACK_TEMPLATE_PREFIX);
  const id = isFallback ? source.templateId.slice(FALLBACK_TEMPLATE_PREFIX.length) : source.templateId;
  const template = getTemplate(id);
  return template ? { template, isFallback } : { isFallback: false };
}

export function getChallengeTitle(source: ChallengeTextSource): string {
  const { template, isFallback } = resolve(source);
  if (!template) return translateIfKey(source.title);
  return isFallback ? `${t('monthlyChallenge.fallback.titlePrefix')}: ${template.title}` : template.title;
}

export function getChallengeDescription(source: ChallengeTextSource): string {
  const { template, isFallback } = resolve(source);
  if (!template) return translateIfKey(source.description ?? '');

  const description = template.id === STAR_DYNAMIC_DESCRIPTION_TEMPLATE && source.starLevel && !isFallback
    ? t('help.challenges.templates.journal_consistency_writer.descriptionDynamic', { count: source.starLevel })
    : template.description;
  return isFallback ? `${description}\n\n${t('monthlyChallenge.fallback.descriptionSuffix')}` : description;
}

export function getRequirementDescription(
  source: { templateId?: string | undefined },
  requirement: { trackingKey: string; description: string }
): string {
  const { template } = resolve(source);
  const fromTemplate = template?.requirementTemplates.find(r => r.trackingKey === requirement.trackingKey)?.description;
  return fromTemplate ?? translateIfKey(requirement.description);
}

/** Test seam — drop the per-language template cache. */
export function __resetChallengeTextCache(): void {
  cachedLanguage = null;
  cachedTemplates = new Map();
}
