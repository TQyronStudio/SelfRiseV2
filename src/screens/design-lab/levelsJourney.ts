/**
 * The levels overview as a journey (LevelsOverviewConcept.tsx, kolo 35): which rows
 * the screen shows for a given level. Free of React Native so it can be tested.
 *
 * Today's overview is a table of 100 nearly identical rows. A journey answers the
 * two things a user opens it for — where am I, what is ahead:
 * - six tiers are six chapters (technical-guides:Gamification-UI.md);
 * - the chapter the user is in starts in focus: from the level just behind them
 *   onward — what is done is folded, what is next is in view;
 * - finished chapters are folded to one line, chapters ahead show their milestones;
 * - any chapter opens fully on a tap; the user's own level never folds away.
 *
 * GOING LIVE (1:1): tier ranges must stay equal to the guide's colour system; the
 * milestone levels come from the app (LEVEL_PROGRESSION.MILESTONE_LEVELS).
 */
import { isLevelMilestone } from '@/src/services/levelCalculation';
import type { LabTierId } from './labTokens';

export const MAX_LEVEL = 100;

export interface LevelTier {
  id: LabTierId;
  from: number;
  to: number;
}

export const LEVEL_TIERS: readonly LevelTier[] = [
  { id: 'beginner', from: 1, to: 10 },
  { id: 'growing', from: 11, to: 20 },
  { id: 'rare', from: 21, to: 40 },
  { id: 'epic', from: 41, to: 60 },
  { id: 'legendary', from: 61, to: 80 },
  { id: 'mythic', from: 81, to: MAX_LEVEL },
];

export type StepState = 'done' | 'current' | 'ahead';

export type JourneyItem =
  | {
      kind: 'chapter';
      key: string;
      tier: LevelTier;
      state: StepState;
      /** Levels of this tier the user has reached. */
      reached: number;
      size: number;
      open: boolean;
    }
  | {
      kind: 'level';
      key: string;
      level: number;
      tier: LevelTier;
      state: StepState;
      milestone: boolean;
      /** The row above / below is the neighbouring level: the path runs through. */
      joinedAbove: boolean;
      joinedBelow: boolean;
    };

/** The tier a level belongs to; level 0 (no level yet) stands at the first one. */
export function tierOf(level: number): LevelTier {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, level));
  return LEVEL_TIERS.find(tier => clamped <= tier.to) ?? LEVEL_TIERS[0]!;
}

export function stateOf(level: number, current: number): StepState {
  if (level < current) return 'done';
  return level === current ? 'current' : 'ahead';
}

function chapterState(tier: LevelTier, current: number): StepState {
  if (current > tier.to) return 'done';
  return tierOf(current).id === tier.id ? 'current' : 'ahead';
}

/** How much of a tier is reached, 0..1 — the hero's six-part strip. */
export function tierFill(tier: LevelTier, current: number): number {
  const size = tier.to - tier.from + 1;
  return Math.min(size, Math.max(0, current - tier.from + 1)) / size;
}

/** The next milestone level above `current`, or null at the top. */
export function nextMilestone(current: number): number | null {
  for (let level = current + 1; level <= MAX_LEVEL; level++) {
    if (isLevelMilestone(level)) return level;
  }
  return null;
}

/**
 * The rows, top to bottom. `open` = the chapters shown level by level. A folded
 * chapter still shows the user's own level and the milestones not reached yet.
 * `focus` = the chapter shown from the level just behind the user onward (how the
 * user's own chapter starts, until they open it fully).
 */
export function buildJourney(
  current: number,
  open: ReadonlySet<LabTierId>,
  focus: LabTierId | null = null
): JourneyItem[] {
  const items: JourneyItem[] = [];
  for (const tier of LEVEL_TIERS) {
    const size = tier.to - tier.from + 1;
    const isOpen = open.has(tier.id);
    items.push({
      kind: 'chapter',
      key: `chapter-${tier.id}`,
      tier,
      state: chapterState(tier, current),
      reached: Math.round(tierFill(tier, current) * size),
      size,
      open: isOpen,
    });
    const levels: number[] = [];
    for (let level = tier.from; level <= tier.to; level++) {
      const state = stateOf(level, current);
      const pinned =
        state === 'current' || (isLevelMilestone(level) && state === 'ahead');
      const inFocus = focus === tier.id && level >= current - 1;
      if (isOpen || pinned || inFocus) levels.push(level);
    }
    levels.forEach((level, i) => {
      items.push({
        kind: 'level',
        key: `level-${level}`,
        level,
        tier,
        state: stateOf(level, current),
        milestone: isLevelMilestone(level),
        joinedAbove: i > 0 && levels[i - 1] === level - 1,
        joinedBelow: i < levels.length - 1 && levels[i + 1] === level + 1,
      });
    });
  }
  return items;
}
