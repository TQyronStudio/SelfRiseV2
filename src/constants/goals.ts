/**
 * The only upper limit on a goal's numbers: a guard against nonsense, not a rule.
 * People count in korunas, yen and forints — 5 000 000 is an ordinary amount there.
 * Until October 2026 the forms stopped at 999 999, for no technical reason (nothing
 * below the forms relied on it), which also made the trophies Mega Dreamer and
 * Million Achiever impossible to earn. trophyCollections.test.ts guards that.
 */
export const MAX_GOAL_VALUE = 1_000_000_000_000;
