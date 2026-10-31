// Trophy collection bonus — pays each completed collection's bonus XP exactly once.
//
// DESIGN (October 2026): the Trophy Room always promised this bonus, but nothing
// paid it. Called from AchievementService.updateUserAchievements, the one place all
// unlock paths go through, so a user who finished a collection long ago gets the
// bonus at the next achievement check.
//
// EXACTLY ONCE: a collection counts as paid when its XP transaction exists
// (source_id `trophy_collection:<id>`). There is no separate "paid" flag that could
// drift from the XP: the record IS the payment, written atomically with it, and a
// data reset removes both. Calls run one after another, so overlapping checks
// cannot pay twice; a refused grant writes nothing, so the next check retries.
//
// skipLimits: the bonus is a promised, one-time amount (1 775 XP over all eight
// collections, before an active XP multiplier, which applies as it does to trophies)
// and must not be trimmed by daily caps. Never throws: a bonus must not break an
// unlock.

import { DeviceEventEmitter } from 'react-native';
import { TROPHY_COLLECTIONS } from '../constants/trophyCollections';
import { XPSourceType } from '../types/gamification';
import { getDatabase } from './database/init';
import { GamificationService } from './gamificationService';
import { getLevelInfo } from './levelCalculation';

const SOURCE_PREFIX = 'trophy_collection:';

async function paidCollections(): Promise<Set<string>> {
  const rows = await getDatabase().getAllAsync<{ source_id: string }>(
    'SELECT source_id FROM xp_transactions WHERE source_id LIKE ?',
    [`${SOURCE_PREFIX}%`]
  );
  return new Set(rows.map(row => row.source_id.slice(SOURCE_PREFIX.length)));
}

async function payOnce(unlockedAchievements: string[]): Promise<number> {
  const unlocked = new Set(unlockedAchievements);
  const paid = await paidCollections();
  const due = TROPHY_COLLECTIONS.filter(
    collection =>
      !paid.has(collection.id) &&
      collection.requiredAchievements.every(id => unlocked.has(id))
  );

  let total = 0;
  let firstLevel: number | undefined;
  let lastLevel: number | undefined;
  for (const collection of due) {
    // skipNotification: the same as trophy XP — no popup over the trophy modal.
    const result = await GamificationService.addXP(collection.bonusXP, {
      source: XPSourceType.ACHIEVEMENT_UNLOCK,
      sourceId: `${SOURCE_PREFIX}${collection.id}`,
      description: `Trophy collection bonus: ${collection.id}`,
      skipNotification: true,
      skipLimits: true,
    });
    if (!result.success) continue;
    total += result.xpGained;
    if (result.leveledUp) {
      firstLevel ??= result.previousLevel;
      lastLevel = result.newLevel;
    }
  }

  if (total > 0) {
    DeviceEventEmitter.emit('xpGained', {
      amount: total,
      source: XPSourceType.ACHIEVEMENT_UNLOCK,
      timestamp: Date.now(),
    });
  }
  if (firstLevel !== undefined && lastLevel !== undefined) {
    for (let level = firstLevel + 1; level <= lastLevel; level++) {
      const info = getLevelInfo(level);
      DeviceEventEmitter.emit('levelUp', {
        newLevel: level,
        previousLevel: level - 1,
        levelTitle: info.title,
        levelDescription: info.description || '',
        isMilestone: info.isMilestone,
        timestamp: Date.now() + (level - firstLevel - 1) * 100,
      });
    }
  }
  return total;
}

let queue: Promise<unknown> = Promise.resolve();

export const TrophyCollectionService = {
  /** Pays every completed, unpaid collection. Returns the XP granted. Never throws. */
  payCompletedCollections(unlockedAchievements: string[]): Promise<number> {
    const run = queue.then(() =>
      payOnce(unlockedAchievements).catch(error => {
        console.error('TrophyCollectionService.payCompleted error:', error);
        return 0;
      })
    );
    queue = run;
    return run;
  },
};
