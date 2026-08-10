// Type-only import: this module must stay free of Expo's native modules so it can be
// imported (and unit-tested) without a device/Jest native shim.
import type { Ionicons } from '@expo/vector-icons';
import { HabitIcon } from '../types/common';

/**
 * Habit icon → Ionicons glyph. THE single source of truth.
 *
 * WHY THIS FILE EXISTS (July 2026): this map used to be copy-pasted into five
 * components (IconPicker, HabitItem, HabitItemWithCompletion,
 * HabitStatsAccordionItem, QuickActionButtons). Nothing kept the copies in sync,
 * so one of them drifted: Home rendered SLEEP as a bed while the picker offered a
 * moon — a user picked 🌙 and got 🛏️. With one map that mismatch is now
 * impossible to express.
 *
 * RULES:
 * - Never inline a habit-icon map in a component. Import this one.
 * - Adding an icon = one entry here + one enum member in `HabitIcon`. The picker
 *   renders straight from this map, so a new entry shows up on its own.
 * - Values are typed as real Ionicons names, so a typo is a compile error rather
 *   than a silently blank icon.
 */
export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export const HABIT_ICON_MAP: Record<HabitIcon, IoniconName> = {
  [HabitIcon.FITNESS]: 'fitness-outline',
  [HabitIcon.DUMBBELL]: 'barbell-outline',
  [HabitIcon.BOOK]: 'book-outline',
  [HabitIcon.WATER]: 'water-outline',
  [HabitIcon.MEDITATION]: 'leaf-outline',
  [HabitIcon.MUSIC]: 'musical-notes-outline',
  [HabitIcon.FOOD]: 'restaurant-outline',
  [HabitIcon.SLEEP]: 'moon-outline',
  [HabitIcon.WORK]: 'briefcase-outline',
  [HabitIcon.HEALTH]: 'heart-outline',
  [HabitIcon.SOCIAL]: 'people-outline',
  [HabitIcon.CREATIVE]: 'color-palette-outline',
  [HabitIcon.LEARNING]: 'school-outline',
  [HabitIcon.FINANCE]: 'card-outline',
  [HabitIcon.HOME]: 'home-outline',
};

/**
 * Ionicons name for a habit icon, with a safe fallback.
 *
 * The fallback matters for stored data: a habit saved by an older/newer build can
 * hold an icon value this build does not know, and passing that straight to
 * <Ionicons> would render nothing at all.
 */
export function getHabitIonicon(icon: HabitIcon | string): IoniconName {
  return HABIT_ICON_MAP[icon as HabitIcon] ?? 'ellipse-outline';
}
