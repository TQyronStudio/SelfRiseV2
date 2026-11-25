/**
 * A goal's icon and colour, from its category (migration E14; the Design Lab's
 * CATEGORY_LOOK, moved out of the stage scenery). The card, the deadline line,
 * the completion window and the detail read this one map.
 *
 * Colours are names from the habit palette (`c.habit[...]` in both themes), so
 * the symbol on them stays readable through onHabitColor() — the palette's
 * contrast test (src/design/__tests__/contrast.test.ts) covers every one.
 */
import { GoalCategory } from '@/src/types/goal';
import type { HabitColorName } from '@/src/design/tokens';
import type { IoniconName } from './habitIcons';

export interface GoalLook {
  color: HabitColorName;
  icon: IoniconName;
}

export const GOAL_CATEGORY_LOOK: Record<GoalCategory, GoalLook> = {
  [GoalCategory.HEALTH]: { color: 'pink', icon: 'heart' },
  [GoalCategory.FINANCIAL]: { color: 'teal', icon: 'wallet' },
  [GoalCategory.LEARNING]: { color: 'blue', icon: 'school' },
  [GoalCategory.CAREER]: { color: 'purple', icon: 'briefcase' },
  [GoalCategory.PERSONAL]: { color: 'orange', icon: 'person' },
  [GoalCategory.OTHER]: { color: 'green', icon: 'sparkles' },
};

/** The look of a category; an unknown one (old data) looks like "other". */
export function goalLook(category: GoalCategory | string | undefined): GoalLook {
  return (
    GOAL_CATEGORY_LOOK[category as GoalCategory] ??
    GOAL_CATEGORY_LOOK[GoalCategory.OTHER]
  );
}
