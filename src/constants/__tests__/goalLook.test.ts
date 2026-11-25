/**
 * Every goal category has its own icon (a real Ionicons name) and a colour from
 * the habit palette — the palette's contrast test then covers the symbol on it.
 */
import { GoalCategory } from '../../types/goal';
import { palettes } from '../../design/tokens';
import { GOAL_CATEGORY_LOOK, goalLook } from '../goalLook';

const glyphMap = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

describe('GOAL_CATEGORY_LOOK', () => {
  it('covers every category with a real icon and a palette colour', () => {
    for (const category of Object.values(GoalCategory)) {
      const look = GOAL_CATEGORY_LOOK[category];
      expect(look).toBeDefined();
      expect(glyphMap[look.icon]).toBeDefined();
      expect(palettes.light.habit[look.color]).toBeDefined();
      expect(palettes.dark.habit[look.color]).toBeDefined();
    }
  });
  it('categories are told apart by colour and icon', () => {
    const looks = Object.values(GOAL_CATEGORY_LOOK);
    expect(new Set(looks.map(l => l.color)).size).toBe(looks.length);
    expect(new Set(looks.map(l => l.icon)).size).toBe(looks.length);
  });
  it('an unknown category (old data) looks like "other"', () => {
    expect(goalLook('nonsense')).toBe(GOAL_CATEGORY_LOOK[GoalCategory.OTHER]);
  });
});
