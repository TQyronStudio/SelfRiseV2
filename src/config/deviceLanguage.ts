/**
 * First-launch language: the first of the phone's preferred languages that the
 * app ships, else English.
 *
 * Walks the WHOLE preference list, the same way iOS and Android pick an app's
 * language: a Czech phone that also lists German gets German, not English.
 *
 * Only decides the very first launch. After that the saved choice wins (see the
 * detector in `i18n.ts`), and the onboarding language step still lets the user
 * change it — this only pre-selects the right answer.
 *
 * Import-free on purpose: `src/utils/i18n.ts` imports the i18n config, so the
 * config must not import back from there.
 */

/** Must match the resources registered in `i18n.ts` and `SUPPORTED_LANGUAGES`. */
export const APP_LANGUAGES = ['en', 'de', 'es'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: AppLanguage = 'en';

export function resolveDeviceLanguage(
  locales: ReadonlyArray<{ languageCode?: string | null }> | null | undefined
): AppLanguage {
  for (const locale of locales ?? []) {
    const code = locale?.languageCode?.toLowerCase();
    if (code && (APP_LANGUAGES as readonly string[]).includes(code)) return code as AppLanguage;
  }
  return FALLBACK_LANGUAGE;
}
