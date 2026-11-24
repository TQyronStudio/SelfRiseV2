/**
 * A level's rank title in the user's language (migration E9, decision E9/1):
 * 20 ranks × five steps (I–V) — "Lehrling II". The English list in
 * levelCalculation.getLevelTitle stays the internal one; the screens show this.
 * Tested in __tests__/rankTitle.test.ts.
 */
export const RANKS = [
  'novice', 'beginner', 'learner', 'apprentice', 'adept', 'seeker', 'adventurer',
  'practitioner', 'pathfinder', 'specialist', 'veteran', 'expert', 'guardian', 'warden',
  'challenger', 'master', 'elite', 'champion', 'grandmaster', 'mythic',
] as const;

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

/** The rank id and its step for a level 1–100 (beyond: the last rank, step V). */
export function rankOf(level: number): { rank: (typeof RANKS)[number]; step: string } {
  const index = Math.min(Math.max(1, Math.floor(level)), RANKS.length * 5) - 1;
  return { rank: RANKS[Math.floor(index / 5)]!, step: ROMAN[index % 5]! };
}

export function rankTitle(level: number, t: (key: string) => string): string {
  const { rank, step } = rankOf(level);
  return `${t(`gamification.levels.rank.${rank}`)} ${step}`;
}
