/**
 * SQLite Challenge Storage
 *
 * Manages monthly challenges data in SQLite database
 * Replaces AsyncStorage for challenge operations
 */

import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../database/init';
import type {
  MonthlyChallenge,
  MonthlyChallengeRequirement,
  DailyProgressSnapshot,
  WeeklyProgressData,
  ChallengeLifecycleStatus,
  UserChallengeRatings
} from '../../types/monthlyChallenge';

// ========================================
// STORAGE INTERFACE
// ========================================

export interface SQLiteChallengeStorageInterface {
  // Active Challenges
  getActiveChallenges(): Promise<MonthlyChallenge[]>;
  saveActiveChallenge(challenge: MonthlyChallenge): Promise<void>;
  updateChallengeProgress(challengeId: string, progress: number): Promise<void>;
  updateChallengeStatus(challengeId: string, status: string): Promise<void>;
  deleteChallenge(challengeId: string): Promise<void>;

  // Requirements
  getRequirements(challengeId: string): Promise<MonthlyChallengeRequirement[]>;
  updateRequirement(challengeId: string, requirement: MonthlyChallengeRequirement): Promise<void>;

  // Daily Snapshots
  saveDailySnapshot(snapshot: DailyProgressSnapshot): Promise<void>;
  getDailySnapshots(challengeId: string): Promise<DailyProgressSnapshot[]>;
  getSnapshotForDate(challengeId: string, date: string): Promise<DailyProgressSnapshot | null>;

  // Weekly Breakdowns
  saveWeeklyBreakdown(challengeId: string, breakdown: WeeklyProgressData): Promise<void>;
  getWeeklyBreakdowns(challengeId: string): Promise<WeeklyProgressData[]>;

  // Lifecycle State
  getLifecycleState(month: string): Promise<ChallengeLifecycleStatus | null>;
  saveLifecycleState(month: string, state: ChallengeLifecycleStatus): Promise<void>;

  // User Ratings
  getUserRatings(): Promise<UserChallengeRatings>;
  updateRating(templateId: string, rating: any): Promise<void>;

  // History
  archiveChallenge(challenge: MonthlyChallenge): Promise<void>;
  getChallengeHistory(limit?: number): Promise<MonthlyChallenge[]>;
}

// ========================================
// SQLITE IMPLEMENTATION
// ========================================

class SQLiteChallengeStorage implements SQLiteChallengeStorageInterface {
  private get db(): SQLite.SQLiteDatabase {
    return getDatabase();
  }

  // ========================================
  // ACTIVE CHALLENGES
  // ========================================

  async getActiveChallenges(): Promise<MonthlyChallenge[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT
        c.*,
        json_group_array(
          json_object(
            'id', r.id,
            'type', r.requirement_type,
            'description', r.description,
            'trackingKey', r.tracking_key,
            'targetValue', r.target_value,
            'currentValue', r.current_value,
            'progressPercentage', r.progress_percentage,
            'weeklyTarget', r.weekly_target,
            'dailyTarget', r.daily_target,
            'progressMilestones', json(r.milestones),
            'milestoneStatuses', json(r.milestone_statuses)
          )
        ) as requirements_json
      FROM monthly_challenges c
      LEFT JOIN challenge_requirements r ON c.id = r.challenge_id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.created_at DESC`
    );

    return rows.map(row => this.rowToChallengeWithRequirements(row));
  }

  async saveActiveChallenge(challenge: MonthlyChallenge): Promise<void> {
    await this.db.execAsync('BEGIN TRANSACTION');

    try {
      // Insert/update challenge
      await this.db.runAsync(
        `INSERT OR REPLACE INTO monthly_challenges (
          id, month, category, template_id, title, description,
          star_level, base_xp_reward, status, progress,
          created_at, completed_at, expired_at, updated_at,
          generation_context, bonus_conditions, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          challenge.id,
          challenge.month,
          challenge.category,
          challenge.metadata?.templateId || challenge.id,
          challenge.title,
          challenge.description,
          challenge.starLevel,
          challenge.baseXPReward,
          challenge.status,
          challenge.progress || 0,
          new Date(challenge.createdAt).getTime(),
          challenge.completedAt ? new Date(challenge.completedAt).getTime() : null,
          challenge.expiredAt ? new Date(challenge.expiredAt).getTime() : null,
          Date.now(),
          JSON.stringify(challenge.metadata?.generationContext || {}),
          JSON.stringify(challenge.bonusXPConditions || []),
          JSON.stringify(challenge.tags || [])
        ]
      );

      // Insert/update requirements
      for (const req of challenge.requirements || []) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO challenge_requirements (
            id, challenge_id, requirement_type, description,
            tracking_key, target_value, current_value,
            progress_percentage, weekly_target, daily_target,
            milestones, milestone_statuses, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${challenge.id}_${req.trackingKey}`,
            challenge.id,
            req.type,
            req.description,
            req.trackingKey,
            req.targetValue,
            req.currentValue || 0,
            Math.round(((req.currentValue || 0) / req.targetValue) * 100),
            req.weeklyTarget || null,
            req.dailyTarget || null,
            JSON.stringify(req.progressMilestones || [0.25, 0.50, 0.75]),
            JSON.stringify(req.milestoneStatuses || [false, false, false]),
            Date.now()
          ]
        );
      }

      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  async updateChallengeProgress(challengeId: string, progress: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE monthly_challenges
       SET progress = ?, updated_at = ?
       WHERE id = ?`,
      [progress, Date.now(), challengeId]
    );
  }

  async updateChallengeStatus(challengeId: string, status: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE monthly_challenges
       SET status = ?, updated_at = ?
       WHERE id = ?`,
      [status, Date.now(), challengeId]
    );
  }

  async deleteChallenge(challengeId: string): Promise<void> {
    // CASCADE will auto-delete requirements, snapshots, weekly breakdowns
    await this.db.runAsync(
      'DELETE FROM monthly_challenges WHERE id = ?',
      [challengeId]
    );
  }

  // ========================================
  // REQUIREMENTS
  // ========================================

  async getRequirements(challengeId: string): Promise<MonthlyChallengeRequirement[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM challenge_requirements WHERE challenge_id = ? ORDER BY id',
      [challengeId]
    );

    return rows.map(row => this.rowToRequirement(row));
  }

  async updateRequirement(challengeId: string, requirement: MonthlyChallengeRequirement): Promise<void> {
    await this.db.runAsync(
      `UPDATE challenge_requirements
       SET current_value = ?,
           progress_percentage = ?,
           milestone_statuses = ?,
           updated_at = ?
       WHERE challenge_id = ? AND tracking_key = ?`,
      [
        requirement.currentValue,
        Math.round((requirement.currentValue / requirement.targetValue) * 100),
        JSON.stringify(requirement.milestoneStatuses),
        Date.now(),
        challengeId,
        requirement.trackingKey
      ]
    );
  }

  // ========================================
  // DAILY SNAPSHOTS
  // ========================================

  async saveDailySnapshot(snapshot: DailyProgressSnapshot): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO challenge_daily_snapshots (
        id, challenge_id, date,
        habits_completed, journal_entries, goal_progress_updates,
        xp_earned_today, balance_score, calculated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${snapshot.challengeId}_${snapshot.date}`,
        snapshot.challengeId,
        snapshot.date,
        snapshot.snapshot.habits_completed || 0,
        snapshot.snapshot.journal_entries || 0,
        snapshot.snapshot.goal_progress_updates || 0,
        snapshot.snapshot.xp_earned_today || 0,
        snapshot.snapshot.balance_score || 0,
        new Date(snapshot.calculatedAt).getTime()
      ]
    );
  }

  async getDailySnapshots(challengeId: string): Promise<DailyProgressSnapshot[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM challenge_daily_snapshots WHERE challenge_id = ? ORDER BY date ASC',
      [challengeId]
    );

    return rows.map(row => this.rowToSnapshot(row));
  }

  async getSnapshotForDate(challengeId: string, date: string): Promise<DailyProgressSnapshot | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM challenge_daily_snapshots WHERE challenge_id = ? AND date = ?',
      [challengeId, date]
    );

    return row ? this.rowToSnapshot(row) : null;
  }

  // ========================================
  // WEEKLY BREAKDOWNS
  // ========================================

  async saveWeeklyBreakdown(challengeId: string, breakdown: WeeklyProgressData): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO challenge_weekly_breakdown (
        id, challenge_id, week_number, start_date, end_date,
        progress, target_achieved, days_active, contributions, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${challengeId}_week${breakdown.weekNumber}`,
        challengeId,
        breakdown.weekNumber,
        breakdown.startDate,
        breakdown.endDate,
        breakdown.progress || 0,
        breakdown.targetAchieved ? 1 : 0,
        breakdown.daysActive || 0,
        JSON.stringify(breakdown.contributions || {}),
        Date.now()
      ]
    );
  }

  async getWeeklyBreakdowns(challengeId: string): Promise<WeeklyProgressData[]> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM challenge_weekly_breakdown WHERE challenge_id = ? ORDER BY week_number ASC',
      [challengeId]
    );

    return rows.map(row => this.rowToWeeklyBreakdown(row));
  }

  // ========================================
  // LIFECYCLE STATE
  // ========================================

  async getLifecycleState(month: string): Promise<ChallengeLifecycleStatus | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM challenge_lifecycle_state WHERE month = ?',
      [month]
    );

    if (!row) return null;

    // Get current challenge if exists
    let currentChallenge = null;
    if (row.current_challenge_id) {
      const challengeRows = await this.db.getAllAsync<any>(
        `SELECT c.*,
          json_group_array(
            json_object(
              'trackingKey', r.tracking_key,
              'currentValue', r.current_value,
              'targetValue', r.target_value
            )
          ) as requirements_json
        FROM monthly_challenges c
        LEFT JOIN challenge_requirements r ON c.id = r.challenge_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [row.current_challenge_id]
      );

      if (challengeRows.length > 0) {
        currentChallenge = this.rowToChallengeWithRequirements(challengeRows[0]);
      }
    }

    return {
      currentState: row.current_state,
      currentChallenge: currentChallenge,
      previewChallenge: null, // TODO: Implement preview loading if needed
      lastStateChange: new Date(row.last_state_change),
      stateHistory: JSON.parse(row.state_history || '[]'),
      pendingActions: JSON.parse(row.pending_actions || '[]'),
      errors: JSON.parse(row.error_log || '[]'),
      metrics: row.metrics ? JSON.parse(row.metrics) : {}
    };
  }

  async saveLifecycleState(month: string, state: ChallengeLifecycleStatus): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO challenge_lifecycle_state (
        month, current_state, current_challenge_id, preview_challenge_id,
        last_state_change, pending_actions, state_history, error_log, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        month,
        state.currentState,
        state.currentChallenge?.id || null,
        state.previewChallenge?.previewChallenge?.id || null,
        new Date(state.lastStateChange).getTime(),
        JSON.stringify(state.pendingActions || []),
        JSON.stringify(state.stateHistory || []),
        JSON.stringify(state.errors || []),
        Date.now()
      ]
    );
  }

  // ========================================
  // USER RATINGS
  // ========================================

  async getUserRatings(): Promise<UserChallengeRatings> {
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM user_challenge_ratings'
    );

    const ratings: UserChallengeRatings = {};

    for (const row of rows) {
      ratings[row.template_id] = {
        timesGenerated: row.times_generated,
        timesCompleted: row.times_completed,
        averageCompletionRate: row.average_completion_rate,
        lastGenerated: row.last_generated,
        userPreference: row.user_preference || 'neutral'
      };
    }

    return ratings;
  }

  async updateRating(templateId: string, rating: any): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO user_challenge_ratings (
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
  }

  // ========================================
  // HISTORY
  // ========================================

  async archiveChallenge(challenge: MonthlyChallenge): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO challenge_history (
        id, challenge_id, month, template_id, final_status,
        completion_rate, xp_earned, completed_at, archived_at, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `history_${challenge.id}`,
        challenge.id,
        challenge.month,
        challenge.metadata?.templateId || '',
        challenge.status,
        challenge.progress || 0,
        challenge.xpAwarded || 0,
        challenge.completedAt ? new Date(challenge.completedAt).getTime() : null,
        Date.now(),
        null
      ]
    );
  }

  async getChallengeHistory(limit: number = 10): Promise<MonthlyChallenge[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT c.* FROM monthly_challenges c
       JOIN challenge_history h ON c.id = h.challenge_id
       WHERE c.status IN ('completed', 'failed')
       ORDER BY h.archived_at DESC
       LIMIT ?`,
      [limit]
    );

    return rows.map(row => this.rowToChallengeWithRequirements(row));
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private rowToChallengeWithRequirements(row: any): MonthlyChallenge {
    const requirements = row.requirements_json
      ? JSON.parse(row.requirements_json).filter((r: any) => r.id !== null)
      : [];

    return {
      id: row.id,
      month: row.month,
      category: row.category,
      title: row.title,
      description: row.description,
      requirements: requirements.map((r: any) => ({
        type: r.type,
        description: r.description,
        trackingKey: r.trackingKey,
        targetValue: r.targetValue,
        currentValue: r.currentValue || 0,
        progressMilestones: r.progressMilestones || [0.25, 0.50, 0.75],
        weeklyTarget: r.weeklyTarget,
        dailyTarget: r.dailyTarget,
        milestoneStatuses: r.milestoneStatuses || [false, false, false]
      })),
      starLevel: row.star_level,
      baseXPReward: row.base_xp_reward,
      bonusXPConditions: JSON.parse(row.bonus_conditions || '[]'),
      status: row.status,
      progress: row.progress,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      expiredAt: row.expired_at ? new Date(row.expired_at) : undefined,
      metadata: {
        templateId: row.template_id,
        generationContext: JSON.parse(row.generation_context || '{}'),
        userBaseline: {},
        difficultyScore: 0
      },
      tags: JSON.parse(row.tags || '[]'),
      xpAwarded: 0 // Will be calculated when completed
    };
  }

  private rowToRequirement(row: any): MonthlyChallengeRequirement {
    return {
      type: row.requirement_type,
      description: row.description,
      trackingKey: row.tracking_key,
      targetValue: row.target_value,
      currentValue: row.current_value || 0,
      progressMilestones: JSON.parse(row.milestones),
      weeklyTarget: row.weekly_target,
      dailyTarget: row.daily_target,
      milestoneStatuses: JSON.parse(row.milestone_statuses)
    };
  }

  private rowToSnapshot(row: any): DailyProgressSnapshot {
    return {
      date: row.date,
      challengeId: row.challenge_id,
      snapshot: {
        habits_completed: row.habits_completed,
        journal_entries: row.journal_entries,
        goal_progress_updates: row.goal_progress_updates,
        xp_earned_today: row.xp_earned_today,
        balance_score: row.balance_score
      },
      calculatedAt: new Date(row.calculated_at)
    };
  }

  private rowToWeeklyBreakdown(row: any): WeeklyProgressData {
    return {
      weekNumber: row.week_number as 1 | 2 | 3 | 4 | 5,
      startDate: row.start_date,
      endDate: row.end_date,
      progress: row.progress,
      targetAchieved: row.target_achieved === 1,
      daysActive: row.days_active,
      contributions: JSON.parse(row.contributions)
    };
  }

  // ========================================
  // PREVIEW METHODS
  // ========================================

  async getPreview(month: string): Promise<any | null> {
    const row = await this.db.getFirstAsync<any>(
      'SELECT * FROM challenge_previews WHERE month = ?',
      [month]
    );

    if (!row) return null;

    return {
      month: row.month,
      generatedAt: new Date(row.generated_at),
      expires: new Date(row.expires_at),
      challenge: await this.getChallengeById(row.preview_challenge_id),
      baselineSnapshot: {} // TODO: Add baseline snapshot if needed
    };
  }

  async savePreview(month: string, preview: any): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO challenge_previews
       (month, generated_at, preview_challenge_id, expires_at, user_can_choose)
       VALUES (?, ?, ?, ?, ?)`,
      [
        month,
        preview.generatedAt.getTime(),
        preview.challenge?.id || '',
        preview.expires.getTime(),
        0
      ]
    );
  }

  private async getChallengeById(id: string): Promise<MonthlyChallenge | null> {
    const row = await this.db.getFirstAsync<any>(
      `SELECT
        c.*,
        json_group_array(
          json_object(
            'id', r.id,
            'type', r.requirement_type,
            'description', r.description,
            'trackingKey', r.tracking_key,
            'targetValue', r.target_value,
            'currentValue', r.current_value,
            'progressPercentage', r.progress_percentage,
            'weeklyTarget', r.weekly_target,
            'dailyTarget', r.daily_target,
            'progressMilestones', json(r.milestones),
            'milestoneStatuses', json(r.milestone_statuses)
          )
        ) as requirements_json
      FROM monthly_challenges c
      LEFT JOIN challenge_requirements r ON c.id = r.challenge_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );

    return row ? this.rowToChallengeWithRequirements(row) : null;
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const sqliteChallengeStorage = new SQLiteChallengeStorage();
