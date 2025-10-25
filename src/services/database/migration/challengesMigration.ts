/**
 * ========================================
 * PHASE 3.2.1: Monthly Challenges Migration
 * ========================================
 *
 * Migrates active challenges, requirements, and user ratings from AsyncStorage to SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { MonthlyChallenge } from '../../../types/gamification';

// User challenge ratings type (from AsyncStorage)
interface UserChallengeRatings {
  [templateId: string]: {
    timesGenerated: number;
    timesCompleted: number;
    averageCompletionRate: number;
    lastGenerated: string; // DateString
    userPreference?: 'liked' | 'neutral' | 'disliked';
  };
}

/**
 * Migrate active challenges with their requirements
 */
async function migrateActiveChallenges(
  db: SQLite.SQLiteDatabase
): Promise<{ challenges: number; requirements: number }> {
  console.log('🔄 Migrating active challenges...');

  // Read from AsyncStorage
  const stored = await AsyncStorage.getItem('monthly_challenges');
  const challenges: MonthlyChallenge[] = stored ? JSON.parse(stored) : [];

  console.log(`📊 Found ${challenges.length} active challenges in AsyncStorage`);

  if (challenges.length === 0) {
    console.log('ℹ️  No challenges to migrate');
    return { challenges: 0, requirements: 0 };
  }

  await db.execAsync('BEGIN TRANSACTION');

  let totalRequirements = 0;

  try {
    for (const challenge of challenges) {
      // Extract month from startDate
      const month = challenge.startDate?.substring(0, 7) || new Date().toISOString().substring(0, 7);

      // Insert challenge
      await db.runAsync(
        `INSERT INTO monthly_challenges (
          id, month, category, template_id, title, description,
          star_level, base_xp_reward, status, progress,
          created_at, completed_at, expired_at, updated_at,
          generation_context, bonus_conditions, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          challenge.id,
          month,
          challenge.category,
          challenge.id, // Use id as template_id fallback
          challenge.title,
          challenge.description,
          challenge.starLevel,
          challenge.baseXPReward,
          challenge.isActive ? 'active' : 'expired',
          0, // progress - will be calculated from requirements
          challenge.createdAt ? new Date(challenge.createdAt).getTime() : Date.now(),
          null, // completed_at
          null, // expired_at
          Date.now(),
          JSON.stringify(challenge.userBaselineSnapshot || {}),
          JSON.stringify([]), // bonus_conditions (not in current type)
          JSON.stringify([]) // tags (not in current type)
        ]
      );

      // Insert requirements
      for (const req of challenge.requirements || []) {
        const requirementId = `${challenge.id}_${req.trackingKey}`;

        await db.runAsync(
          `INSERT INTO challenge_requirements (
            id, challenge_id, requirement_type, description,
            tracking_key, target_value, current_value,
            progress_percentage, weekly_target, daily_target,
            milestones, milestone_statuses, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            requirementId,
            challenge.id,
            req.type,
            req.description,
            req.trackingKey,
            req.target,
            0, // current_value - will be updated later
            0, // progress_percentage
            req.weeklyTarget || null,
            req.dailyTarget || null,
            JSON.stringify(req.progressMilestones || [0.25, 0.50, 0.75]),
            JSON.stringify([false, false, false]), // milestone_statuses
            Date.now()
          ]
        );

        totalRequirements++;
      }

      console.log(`  ✅ Migrated: ${challenge.title} (${challenge.requirements?.length || 0} requirements)`);
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${challenges.length} challenges + ${totalRequirements} requirements`);

    return { challenges: challenges.length, requirements: totalRequirements };

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Challenge migration failed:', error);
    throw new Error(`Challenge migration failed: ${error}`);
  }
}

/**
 * Migrate user challenge ratings
 */
async function migrateUserRatings(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  console.log('🔄 Migrating user challenge ratings...');

  // Read from AsyncStorage
  const stored = await AsyncStorage.getItem('user_challenge_ratings');
  const ratings: UserChallengeRatings = stored ? JSON.parse(stored) : {};

  const ratingKeys = Object.keys(ratings);
  console.log(`📊 Found ${ratingKeys.length} ratings in AsyncStorage`);

  if (ratingKeys.length === 0) {
    console.log('ℹ️  No ratings to migrate');
    return 0;
  }

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const [templateId, rating] of Object.entries(ratings)) {
      await db.runAsync(
        `INSERT INTO user_challenge_ratings (
          template_id, times_generated, times_completed,
          average_completion_rate, last_generated, user_preference, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          rating.timesGenerated,
          rating.timesCompleted,
          rating.averageCompletionRate,
          rating.lastGenerated,
          rating.userPreference || 'neutral',
          Date.now()
        ]
      );

      console.log(`  ✅ Rating: ${templateId} (${rating.timesGenerated} generated, ${rating.timesCompleted} completed)`);
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Migrated ${ratingKeys.length} ratings`);

    return ratingKeys.length;

  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('❌ Ratings migration failed:', error);
    throw new Error(`Ratings migration failed: ${error}`);
  }
}

/**
 * Main migration function for Phase 3.2.1
 */
export async function migrateChallenges321ToSQLite(): Promise<{
  success: boolean;
  summary: {
    challenges: number;
    requirements: number;
    ratings: number;
  };
  errors: string[];
}> {
  console.log('🚀 Starting Phase 3.2.1: Active Challenges Migration...\n');

  const errors: string[] = [];

  try {
    const { getDatabase } = await import('../init');
    const db = getDatabase();

    // Migrate challenges and requirements
    const { challenges, requirements } = await migrateActiveChallenges(db);

    // Migrate user ratings
    const ratings = await migrateUserRatings(db);

    console.log('\n✅ PHASE 3.2.1 MIGRATION COMPLETE!');
    console.log(`📊 Summary:`);
    console.log(`   Challenges: ${challenges}`);
    console.log(`   Requirements: ${requirements}`);
    console.log(`   Ratings: ${ratings}`);

    return {
      success: true,
      summary: {
        challenges,
        requirements,
        ratings
      },
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ MIGRATION FAILED:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      summary: {
        challenges: 0,
        requirements: 0,
        ratings: 0
      },
      errors
    };
  }
}
