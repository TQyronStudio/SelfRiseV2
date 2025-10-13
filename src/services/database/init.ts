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
      category TEXT NOT NULL,
      description TEXT,
      difficulty TEXT NOT NULL,
      target_type TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived);
    CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);

    -- ========================================
    -- HABIT COMPLETIONS
    -- ========================================
    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      value INTEGER,
      bonus INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date, time)
    );

    CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date DESC);

    -- ========================================
    -- HABIT SCHEDULES
    -- ========================================
    CREATE TABLE IF NOT EXISTS habit_schedules (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      frequency TEXT NOT NULL,
      daily_target INTEGER,
      days_of_week TEXT,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_schedules_habit ON habit_schedules(habit_id);

    -- ========================================
    -- GOALS
    -- ========================================
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      current_value INTEGER NOT NULL DEFAULT 0,
      target_value INTEGER NOT NULL,
      unit TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'archived')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
    CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);

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
      value INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      note TEXT,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_progress_goal_time ON goal_progress(goal_id, timestamp DESC);

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

  console.log('✅ Tables and views created successfully');
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
