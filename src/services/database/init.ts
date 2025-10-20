// SQLite Database Initialization
// This file sets up the database connection and creates all tables

import * as SQLite from 'expo-sqlite';

// Database instance (singleton)
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize SQLite database
 * Creates all tables if they don't exist
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  console.log('🗄️  Initializing SQLite database...');

  try {
    // Open database (creates if doesn't exist)
    db = await SQLite.openDatabaseAsync('selfrise.db');

    // Enable WAL mode for better concurrent access
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    console.log('✅ Database connection established');

    // Create tables (will be populated during migration)
    await createTables(db);

    console.log('✅ Database initialized successfully');
    return db;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database instance
 * Must call initializeDatabase() first
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Create all database tables
 * Safe to call multiple times (uses IF NOT EXISTS)
 */
async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  console.log('📋 Creating database tables...');

  // ========================================
  // GOALS TABLE MIGRATION
  // ========================================
  const goalsTableInfo = await database.getAllAsync(`PRAGMA table_info(goals)`);

  if (goalsTableInfo.length > 0) {
    const columns = new Set(goalsTableInfo.map((col: any) => col.name));

    if (!columns.has('order_index')) {
      console.log('🔄 Adding goals.order_index...');
      await database.execAsync(`ALTER TABLE goals ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_goals_order ON goals(order_index);`);
    }

    if (!columns.has('target_date')) {
      console.log('🔄 Adding goals.target_date...');
      await database.execAsync(`ALTER TABLE goals ADD COLUMN target_date TEXT;`);
    }

    if (!columns.has('description')) {
      console.log('🔄 Adding goals.description...');
      await database.execAsync(`ALTER TABLE goals ADD COLUMN description TEXT;`);
    }

    if (!columns.has('start_date')) {
      console.log('🔄 Adding goals.start_date...');
      await database.execAsync(`ALTER TABLE goals ADD COLUMN start_date TEXT;`);
      // Set start_date to created_at date for existing records
      await database.execAsync(`UPDATE goals SET start_date = date(created_at / 1000, 'unixepoch') WHERE start_date IS NULL;`);
    }

    console.log('✅ Goals table migration complete');
  }

  // ========================================
  // GOAL_PROGRESS TABLE MIGRATION - REBUILD REQUIRED
  // ========================================
  const progressTableInfo = await database.getAllAsync(`PRAGMA table_info(goal_progress)`);

  if (progressTableInfo.length > 0) {
    const columns = new Set(progressTableInfo.map((col: any) => col.name));

    // Check if table has old schema (timestamp column instead of date)
    const hasOldSchema = columns.has('timestamp') && !columns.has('date');

    if (hasOldSchema) {
      console.log('🔄 Rebuilding goal_progress table with new schema...');

      // Backup existing data
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS goal_progress_backup AS
        SELECT * FROM goal_progress;
      `);

      // Drop old table
      await database.execAsync(`DROP TABLE goal_progress;`);

      // Recreate with new schema (will be created below in main CREATE TABLE block)
      console.log('✅ Old goal_progress table dropped, will recreate with new schema');
    } else if (!columns.has('progress_type')) {
      // Partial migration for tables that need progress_type
      console.log('🔄 Adding goal_progress.progress_type...');
      await database.execAsync(`ALTER TABLE goal_progress ADD COLUMN progress_type TEXT NOT NULL DEFAULT 'add';`);
    }
  }

  await database.execAsync(`
    -- ========================================
    -- JOURNAL ENTRIES
    -- ========================================
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('gratitude', 'self-praise')),
      date TEXT NOT NULL,
      gratitude_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date DESC);
    CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries(type);
    CREATE INDEX IF NOT EXISTS idx_journal_date_type ON journal_entries(date, type);
    CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at DESC);

    -- ========================================
    -- STREAK STATE (Singleton)
    -- ========================================
    CREATE TABLE IF NOT EXISTS streak_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_entry_date TEXT,
      streak_start_date TEXT,
      frozen_days INTEGER NOT NULL DEFAULT 0,
      is_frozen INTEGER NOT NULL DEFAULT 0,
      can_recover_with_ad INTEGER NOT NULL DEFAULT 0,
      streak_before_freeze INTEGER,
      just_unfroze_today INTEGER NOT NULL DEFAULT 0,
      star_count INTEGER NOT NULL DEFAULT 0,
      flame_count INTEGER NOT NULL DEFAULT 0,
      crown_count INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    -- ========================================
    -- WARM UP PAYMENTS
    -- ========================================
    CREATE TABLE IF NOT EXISTS warm_up_payments (
      id TEXT PRIMARY KEY,
      missed_date TEXT NOT NULL,
      paid_at INTEGER NOT NULL,
      ads_watched INTEGER NOT NULL DEFAULT 1,
      is_complete INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_warmup_date ON warm_up_payments(missed_date);
    CREATE INDEX IF NOT EXISTS idx_warmup_paid_at ON warm_up_payments(paid_at DESC);

    -- Initialize singleton row in streak_state if not exists
    INSERT OR IGNORE INTO streak_state (id, updated_at)
    VALUES (1, strftime('%s', 'now') * 1000);

    -- ========================================
    -- HABITS
    -- ========================================
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      scheduled_days TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_habits_order ON habits(order_index);
    CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(is_archived);
    CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);

    -- ========================================
    -- HABIT SCHEDULE HISTORY (Timeline)
    -- ========================================
    CREATE TABLE IF NOT EXISTS habit_schedule_history (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      scheduled_days TEXT NOT NULL,
      effective_from_date TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_history_habit ON habit_schedule_history(habit_id, effective_from_date DESC);

    -- ========================================
    -- HABIT COMPLETIONS
    -- ========================================
    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      is_bonus INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      note TEXT,
      is_converted INTEGER NOT NULL DEFAULT 0,
      converted_from_date TEXT,
      converted_to_date TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_habit_date ON habit_completions(habit_id, date);
    CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_completions_bonus ON habit_completions(is_bonus, date DESC);

    -- ========================================
    -- GOALS
    -- ========================================
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      unit TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      target_date TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived', 'paused')),
      order_index INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
    CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
    CREATE INDEX IF NOT EXISTS idx_goals_order ON goals(order_index);

    -- ========================================
    -- GOAL MILESTONES
    -- ========================================
    CREATE TABLE IF NOT EXISTS goal_milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      value INTEGER NOT NULL,
      description TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_milestones_goal ON goal_milestones(goal_id);

    -- ========================================
    -- GOAL PROGRESS HISTORY
    -- ========================================
    CREATE TABLE IF NOT EXISTS goal_progress (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      value REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      progress_type TEXT NOT NULL DEFAULT 'add' CHECK(progress_type IN ('add', 'subtract', 'set')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_progress_goal_date ON goal_progress(goal_id, date DESC);

    -- ========================================
    -- PERFORMANCE VIEWS (Journal System)
    -- ========================================

    -- Today's entries count (cached query for performance)
    CREATE VIEW IF NOT EXISTS v_todays_entry_count AS
    SELECT COUNT(*) as count, date
    FROM journal_entries
    WHERE date = date('now')
    GROUP BY date;

    -- Completed dates for streak calculation (3+ entries)
    CREATE VIEW IF NOT EXISTS v_completed_dates AS
    SELECT DISTINCT date
    FROM journal_entries
    GROUP BY date
    HAVING COUNT(*) >= 3
    ORDER BY date DESC;

    -- Bonus dates (4+ entries per day)
    CREATE VIEW IF NOT EXISTS v_bonus_dates AS
    SELECT date, COUNT(*) as count
    FROM journal_entries
    GROUP BY date
    HAVING COUNT(*) > 3
    ORDER BY date DESC;
  `);

  // ========================================
  // GAMIFICATION & XP TABLES (Phase 2)
  // ========================================

  await database.execAsync(`
    -- XP Transactions (time-series data)
    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT,
      timestamp INTEGER NOT NULL,
      description TEXT,
      metadata TEXT  -- JSON
    );

    CREATE INDEX IF NOT EXISTS idx_xp_timestamp ON xp_transactions(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_xp_source ON xp_transactions(source);
    CREATE INDEX IF NOT EXISTS idx_xp_source_id ON xp_transactions(source_id);

    -- Daily XP Summary (pre-aggregated for fast queries)
    CREATE TABLE IF NOT EXISTS xp_daily_summary (
      date TEXT PRIMARY KEY,
      total_xp INTEGER NOT NULL DEFAULT 0,
      habit_xp INTEGER NOT NULL DEFAULT 0,
      journal_xp INTEGER NOT NULL DEFAULT 0,
      goal_xp INTEGER NOT NULL DEFAULT 0,
      achievement_xp INTEGER NOT NULL DEFAULT 0,
      transaction_count INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_xp_daily_date ON xp_daily_summary(date DESC);

    -- User XP State (singleton)
    CREATE TABLE IF NOT EXISTS xp_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_xp INTEGER NOT NULL DEFAULT 0,
      current_level INTEGER NOT NULL DEFAULT 1,
      last_activity INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Level Up History
    CREATE TABLE IF NOT EXISTS level_up_history (
      id TEXT PRIMARY KEY,
      level INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      total_xp_at_levelup INTEGER NOT NULL,
      is_milestone INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_levelup_timestamp ON level_up_history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_levelup_level ON level_up_history(level);

    -- Achievement Progress
    CREATE TABLE IF NOT EXISTS achievement_progress (
      achievement_id TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL DEFAULT 0,
      target_value INTEGER NOT NULL,
      unlocked INTEGER NOT NULL DEFAULT 0,
      unlocked_at INTEGER,
      xp_awarded INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_achievement_unlocked ON achievement_progress(unlocked);

    -- Achievement Unlock Events (history)
    CREATE TABLE IF NOT EXISTS achievement_unlock_events (
      id TEXT PRIMARY KEY,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      xp_awarded INTEGER NOT NULL,
      category TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_unlock_timestamp ON achievement_unlock_events(unlocked_at DESC);
    CREATE INDEX IF NOT EXISTS idx_unlock_category ON achievement_unlock_events(category);

    -- Achievement Statistics Cache
    CREATE TABLE IF NOT EXISTS achievement_stats_cache (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_unlocked INTEGER NOT NULL DEFAULT 0,
      total_xp_earned INTEGER NOT NULL DEFAULT 0,
      by_category TEXT NOT NULL,  -- JSON
      by_rarity TEXT NOT NULL,    -- JSON
      last_updated INTEGER NOT NULL
    );

    -- XP Multipliers
    CREATE TABLE IF NOT EXISTS xp_multipliers (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      multiplier REAL NOT NULL,
      activated_at INTEGER NOT NULL,
      expires_at INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_multiplier_active ON xp_multipliers(is_active, expires_at);

    -- Loyalty Tracking
    CREATE TABLE IF NOT EXISTS loyalty_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total_active_days INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      milestones_unlocked TEXT NOT NULL DEFAULT '[]',  -- JSON array
      updated_at INTEGER NOT NULL
    );

    -- Daily Activity Log (for harmony streak calculation)
    CREATE TABLE IF NOT EXISTS daily_activity_log (
      date TEXT PRIMARY KEY,
      has_habit_activity INTEGER NOT NULL DEFAULT 0,
      has_journal_activity INTEGER NOT NULL DEFAULT 0,
      has_goal_activity INTEGER NOT NULL DEFAULT 0,
      habit_completions INTEGER NOT NULL DEFAULT 0,
      journal_entries INTEGER NOT NULL DEFAULT 0,
      goal_progress_updates INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_activity_date ON daily_activity_log(date DESC);
  `);

  console.log('✅ Tables and views created successfully');

  // ========================================
  // RESTORE DATA FROM BACKUP IF EXISTS
  // ========================================
  const backupExists = await database.getAllAsync(`SELECT name FROM sqlite_master WHERE type='table' AND name='goal_progress_backup'`);

  if (backupExists.length > 0) {
    console.log('🔄 Restoring goal_progress data from backup...');

    // Migrate data from backup to new table
    await database.execAsync(`
      INSERT INTO goal_progress (id, goal_id, value, date, note, progress_type, created_at, updated_at)
      SELECT
        id,
        goal_id,
        value,
        date(timestamp / 1000, 'unixepoch') as date,
        note,
        'add' as progress_type,
        timestamp as created_at,
        timestamp as updated_at
      FROM goal_progress_backup;
    `);

    const restoredCount = await database.getFirstAsync<any>('SELECT COUNT(*) as count FROM goal_progress');
    console.log(`✅ Restored ${restoredCount?.count || 0} progress records`);

    // Drop backup table
    await database.execAsync(`DROP TABLE goal_progress_backup;`);
    console.log('✅ Backup table cleaned up');
  }
}

/**
 * Close database connection
 * Usually not needed, but available for testing
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('✅ Database connection closed');
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}
