/**
 * Development sessions must not feed the real numbers.
 *
 * Development builds share the bundle id and the Firebase project with the store
 * app, so everything a developer does (the dev launcher screen, an emulator, fresh
 * onboarding runs, test crashes) lands in the same Analytics / Crashlytics data as
 * real users — weekly check 2026-10-31 found exactly that.
 *
 * A "development session" is JS served by Metro (`__DEV__`). In one, analytics and
 * crash reporting are switched OFF — unless the local `.env` opts in with
 * `EXPO_PUBLIC_ANALYTICS_IN_DEV=true`, which is how events or a test crash are
 * verified on purpose. Store and TestFlight builds run bundled JS (`__DEV__` is
 * false), so for real users nothing changes.
 *
 * The defaults are read here so callers stay one-liners; tests pass both values
 * explicitly. `process.env.EXPO_PUBLIC_*` must stay a literal member access —
 * Expo inlines it at build time only in that form.
 *
 * Import-free on purpose: it is used by services that must stay loadable in Jest.
 */
export function isDevelopmentSession(
  isDev: boolean = __DEV__,
  optIn: string | undefined = process.env.EXPO_PUBLIC_ANALYTICS_IN_DEV
): boolean {
  return isDev && optIn !== 'true';
}
