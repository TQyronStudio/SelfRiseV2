/**
 * Design Lab — an internal screen for tuning the app's look on mock data
 * (premium-design-plan.md, F1). It must never be reachable in a store build.
 *
 * Shown in development (`__DEV__`, i.e. running from `npm start`) or when the
 * local `.env` sets `EXPO_PUBLIC_ENABLE_DESIGN_LAB=true`, the same opt-in the
 * marketing demo tools use. Store builds have neither.
 *
 * The defaults are read here so callers stay one-liners; tests pass both values
 * explicitly. `process.env.EXPO_PUBLIC_*` must stay a literal member access —
 * Expo inlines it at build time only in that form.
 */
export function isDesignLabEnabled(
  isDev: boolean = __DEV__,
  flag: string | undefined = process.env.EXPO_PUBLIC_ENABLE_DESIGN_LAB
): boolean {
  return isDev || flag === 'true';
}
