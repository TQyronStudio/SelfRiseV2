// Milestone levels promise nothing the app does not do — Regression Suite
//
// WHY THIS EXISTS (November 11, 2026): the level-up window listed "New Rewards" at
// levels 10/25/50/75/100 — "Custom Color Theme Unlock", "Prestige System Access",
// "Mentor Mode Unlock", "Hall of Fame Entry"… None of these features exists. A
// milestone is celebrated, nothing more. The list, its texts and the field that
// carried it were removed; this pins that they do not come back without a real
// reward behind them.

import { getLevelInfo } from '../levelCalculation';
import en from '../../locales/en';
import de from '../../locales/de';
import es from '../../locales/es';

describe('milestone levels: no promised rewards', () => {
  it.each([10, 25, 50, 75, 100])(
    'level %i is a milestone without a reward list',
    level => {
      const info = getLevelInfo(level);
      expect(info.isMilestone).toBe(true);
      expect(info).not.toHaveProperty('rewards');
    }
  );

  it.each([
    ['en', en],
    ['de', de],
    ['es', es],
  ] as const)('%s has no reward texts for levels', (_lang, locale) => {
    const gamification = locale.gamification as Record<string, unknown>;
    expect(gamification).not.toHaveProperty('milestoneRewards');
    expect(gamification.celebration).not.toHaveProperty('rewards_title');
    expect(JSON.stringify(gamification)).not.toMatch(
      /unique rewards|einzigartigen Belohnungen|recompensas únicas/
    );
  });
});
