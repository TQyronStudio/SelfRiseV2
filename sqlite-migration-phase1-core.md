### 🎯 SEKCE 1: CORE DATA MIGRATION (Journal, Habits, Goals)

**Priority**: 🔴 **KRITICKÁ** - Řeší aktuální race condition problém v My Journal

**Affected Storage Services**:
- `src/services/storage/gratitudeStorage.ts` (21 AsyncStorage operations)
- `src/services/storage/habitStorage.ts` (14 AsyncStorage operations)
- `src/services/storage/goalStorage.ts` (15 AsyncStorage operations)

---

#### 📊 ČÁST 1.1: JOURNAL/GRATITUDE STORAGE ANALÝZA

**Current AsyncStorage Keys**:
- `GRATITUDES` - Array of journal entries (gratitude + self-praise)
- `GRATITUDE_STREAK` - Streak tracking object with frozen streak system

**Data Structures**:

```typescript
// Gratitude Entry
interface Gratitude {
  id: string;              // UUID
  text: string;            // Entry content
  type: 'gratitude' | 'self-praise';
  date: DateString;        // YYYY-MM-DD
  gratitudeNumber: number; // Position in day (1-based)
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Unix timestamp
}

// Streak State
interface GratitudeStreak {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: DateString | null;
  streakStartDate: DateString | null;

  // Frozen streak recovery system
  frozenDays: number;           // 0-3 missed days
  isFrozen: boolean;
  canRecoverWithAd: boolean;
  warmUpPayments: WarmUpPayment[]; // Ad payment tracking
  streakBeforeFreeze: number | null;
  justUnfrozeToday: boolean;

  // Milestone counters
  starCount: number;   // 3-day streaks
  flameCount: number;  // 7-day streaks
  crownCount: number;  // 30-day streaks

  // Deprecated (remove in migration)
  preserveCurrentStreak: boolean;
  preserveCurrentStreakUntil: DateString | null;
  warmUpCompletedOn: DateString | null;
  autoResetTimestamp: number | null;
}

interface WarmUpPayment {
  id: string;
  missedDate: DateString;
  paidAt: number;
  adsWatched: number;
}
```

**🔥 Performance Bottlenecks & Race Conditions**:

1. **create() method** - Adds new journal entry
   - Current: Reads ALL entries, appends, writes ALL entries (~80-150ms with 8+ entries)
   - Issue: Multiple concurrent creates → race condition, duplicate entries
   - Frequency: Every journal entry add (user-triggered, high frequency)

2. **calculateAndUpdateStreak()** - Recalculates streak after every entry
   - Current: Reads GRATITUDES + GRATITUDE_STREAK, complex JS calculations, writes GRATITUDE_STREAK (~120ms)
   - Issue: Runs after EVERY create(), collides with Progress Analyzer reads
   - Has async locking (_isCalculatingStreak flag) but still experiences deadlocks

3. **getByDate()** - Loads today's entries for Journal screen
   - Current: Reads ALL entries, filters in JavaScript (~20-50ms with 100+ entries)
   - Issue: Inefficient, loads unnecessary data

4. **calculateFrozenDays()** - Complex debt calculation
   - Current: Calculates missed days, iterates warm-up payments (~30-60ms)
   - Issue: Called multiple times per operation (not cached)

**Race Condition Timeline** (Root Cause of Current Problem):
```
User adds entry #8:
  T=0ms:   create() starts
  T=10ms:  Read GRATITUDES (80ms)
  T=90ms:  Append new entry
  T=100ms: Write GRATITUDES (100ms)
  T=200ms: Call calculateAndUpdateStreak()
  T=210ms:   Read GRATITUDES again (80ms)
  T=290ms:   Read GRATITUDE_STREAK (20ms)
  T=310ms:   calculateFrozenDays() (50ms)
  T=360ms:   Write GRATITUDE_STREAK (30ms)
  T=390ms: COMPLETE

During 390ms window:
  ❌ Progress Analyzer reads GRATITUDES (collision at T=150ms)
  ❌ User clicks Add again (second create() starts at T=300ms)
  ❌ UI shows stale state (entry appears multiple times)
  ❌ AsyncStorage queue fills up → deadlock
```

**SQLite Solution - Schema Design**:

```sql
-- ============================================
-- JOURNAL ENTRIES TABLE
-- ============================================
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('gratitude', 'self-praise')),
  date TEXT NOT NULL,  -- YYYY-MM-DD format
  gratitude_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for fast queries
CREATE INDEX idx_entries_date ON journal_entries(date);
CREATE INDEX idx_entries_type ON journal_entries(type);
CREATE INDEX idx_entries_date_type ON journal_entries(date, type);
CREATE INDEX idx_entries_created_at ON journal_entries(created_at DESC);

-- ============================================
-- STREAK STATE TABLE (Singleton)
-- ============================================
CREATE TABLE streak_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),  -- Only 1 row allowed
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date TEXT,
  streak_start_date TEXT,

  -- Frozen streak system
  frozen_days INTEGER NOT NULL DEFAULT 0,
  is_frozen INTEGER NOT NULL DEFAULT 0,  -- Boolean (0/1)
  can_recover_with_ad INTEGER NOT NULL DEFAULT 0,
  streak_before_freeze INTEGER,
  just_unfroze_today INTEGER NOT NULL DEFAULT 0,

  -- Milestone counters
  star_count INTEGER NOT NULL DEFAULT 0,
  flame_count INTEGER NOT NULL DEFAULT 0,
  crown_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  updated_at INTEGER NOT NULL
);

-- Initialize singleton row
INSERT INTO streak_state (id, updated_at) VALUES (1, strftime('%s', 'now'));

-- ============================================
-- WARM-UP PAYMENTS TABLE
-- ============================================
CREATE TABLE warm_up_payments (
  id TEXT PRIMARY KEY,
  missed_date TEXT NOT NULL,
  paid_at INTEGER NOT NULL,
  ads_watched INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_payments_date ON warm_up_payments(missed_date);
CREATE INDEX idx_payments_paid_at ON warm_up_payments(paid_at DESC);

-- ============================================
-- VIEWS FOR CONVENIENCE
-- ============================================

-- Today's entries count (cached query)
CREATE VIEW v_todays_entry_count AS
SELECT COUNT(*) as count, date
FROM journal_entries
WHERE date = date('now')
GROUP BY date;

-- Completed dates for streak calculation
CREATE VIEW v_completed_dates AS
SELECT DISTINCT date
FROM journal_entries
WHERE gratitude_number >= 1
ORDER BY date DESC;

-- Bonus dates (4+ entries)
CREATE VIEW v_bonus_dates AS
SELECT date, COUNT(*) as count
FROM journal_entries
GROUP BY date
HAVING COUNT(*) > 3
ORDER BY date DESC;
```

**Performance Improvements**:

| Operation | AsyncStorage | SQLite | Speedup |
|-----------|--------------|--------|---------|
| Add entry | 360ms | 5ms | **72x faster** |
| Get today's entries | 50ms | 2ms | **25x faster** |
| Calculate streak | 120ms | 15ms | **8x faster** |
| Get completed dates | 80ms | 5ms | **16x faster** |
| Count by date | 50ms | 1ms | **50x faster** |

**ACID Transaction Example**:
```typescript
// All-or-nothing transaction
await db.withTransactionAsync(async () => {
  // 1. Insert entry
  await db.runAsync(
    'INSERT INTO journal_entries VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, text, type, date, gratitudeNumber, createdAt, updatedAt]
  );

  // 2. Update streak (atomic)
  await db.runAsync(
    'UPDATE streak_state SET current_streak = ?, last_entry_date = ?, updated_at = ? WHERE id = 1',
    [newStreak, date, Date.now()]
  );

  // If ANYTHING fails → automatic ROLLBACK
  // No partial writes, no race conditions ✅
});
```

**Migration Strategy - Journal/Gratitude**:

**Phase 1.1.1: Preparation & Backup** ✅ **COMPLETE**

**Status**: Completed 2025-10-12
**Test Results**:
- ✅ 161 entries backed up
- ✅ 14 days streak preserved
- ✅ Checksums verified: 607379d6 (entries), 7231f49d (streak)
- ✅ Rollback capability confirmed

**Files Created**:
- `/src/services/database/migration/journalBackup.ts` - Core backup logic with checksum verification
- `/src/services/database/migration/testJournalBackup.ts` - Comprehensive test suite
- `/src/services/database/migration/runBackupTest.ts` - App integration wrapper
- `/app/(tabs)/migration-test.tsx` - UI test screen for manual testing

**Backup Location**: AsyncStorage key `MIGRATION_BACKUP_JOURNAL_V1`

**Implementation Code** (Reference):
```typescript
// 1. Backup current AsyncStorage data
const backup = {
  entries: await BaseStorage.get<Gratitude[]>('GRATITUDES'),
  streak: await BaseStorage.get<GratitudeStreak>('GRATITUDE_STREAK'),
  timestamp: Date.now(),
  version: '1.0.0',
  entriesChecksum: generateChecksum(entries),
  streakChecksum: generateChecksum(streak)
};

// 2. Save backup to AsyncStorage (separate key)
await BaseStorage.set('MIGRATION_BACKUP_JOURNAL_V1', backup);

// 3. Verify backup integrity
const verified = await BaseStorage.get('MIGRATION_BACKUP_JOURNAL_V1');
if (!verified || verified.entries.length !== backup.entries.length) {
  throw new Error('Backup verification failed');
}

console.log(`✅ Backup created: ${backup.entries.length} entries, streak: ${backup.streak.currentStreak}`);
```

**Phase 1.1.2: SQLite Database Setup** ✅ **COMPLETE**

**Status**: Completed 2025-10-12
**Implementation**: Updated `/src/services/database/init.ts`

**Changes Made**:
1. ✅ Added composite index `idx_journal_date_type` for faster filtering
2. ✅ Added `idx_journal_created_at` for chronological sorting
3. ✅ Fixed `warm_up_payments.ads_watched` DEFAULT to 1 (was 0)
4. ✅ Added `is_complete` field to `warm_up_payments`
5. ✅ Added `idx_warmup_paid_at` index for payment history
6. ✅ Created 3 performance views:
   - `v_todays_entry_count` - Fast today's count
   - `v_completed_dates` - Pre-filtered completed dates (3+ entries)
   - `v_bonus_dates` - Bonus dates (4+ entries)

**Schema Summary**:
- **3 Tables**: journal_entries, streak_state, warm_up_payments
- **6 Indexes**: Optimized for date/type/time queries
- **3 Views**: Pre-computed aggregations for performance
- **WAL Mode**: Enabled for concurrent access
- **Foreign Keys**: Enabled for referential integrity

**Ready For**: Phase 1.1.3 (Data Migration) after development build completes

**Implementation Code** (Reference - Already in init.ts):
```typescript
import * as SQLite from 'expo-sqlite';

// Database already initialized in /src/services/database/init.ts
// Tables created automatically on first app launch
// No manual setup needed - migration will use existing schema

// Schema includes:
// - journal_entries: Full journal data with indexes
// - streak_state: Singleton table for streak tracking
// - warm_up_payments: Ad payment tracking with is_complete flag
// - 3 performance views for fast queries
```

**Phase 1.1.3: Data Migration** ✅ **COMPLETE**

**Status**: Completed 2025-10-13
**Results**:
- ✅ 163 journal entries migrated successfully
- ✅ Streak state migrated (14 days current streak)
- ✅ 16 warm-up payments migrated
- ✅ All data verified in SQLite database
- ✅ ACID transaction ensured data integrity

**Implementation**: `/src/services/database/migration/journalMigration.ts`

**Key Fixes Applied**:
1. ✅ Data model transformation (old AsyncStorage → new SQLite schema)
   - `content` → `text`
   - `order` → `gratitudeNumber`
   - `paymentTimestamp` → `paidAt`
2. ✅ Validation logic to skip invalid entries (empty text, missing fields)
3. ✅ Singleton row initialization in `streak_state` table
4. ✅ Comprehensive verification after migration

**Reference Code**:
```typescript
// 1. Migrate entries in transaction
await db.withTransactionAsync(async () => {
  const entries = backup.entries || [];

  // Prepare statement for bulk insert
  const stmt = await db.prepareAsync(
    'INSERT INTO journal_entries (id, text, type, date, gratitude_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const entry of entries) {
    await stmt.executeAsync([
      entry.id,
      entry.text,
      entry.type,
      entry.date,
      entry.gratitudeNumber,
      entry.createdAt,
      entry.updatedAt
    ]);
  }

  await stmt.finalizeAsync();
  console.log(`✅ Migrated ${entries.length} journal entries`);
});

// 2. Migrate streak state
const streak = backup.streak;
if (streak) {
  await db.runAsync(`
    INSERT OR REPLACE INTO streak_state VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `, [
    streak.currentStreak,
    streak.longestStreak,
    streak.lastEntryDate,
    streak.streakStartDate,
    streak.frozenDays,
    streak.isFrozen ? 1 : 0,
    streak.canRecoverWithAd ? 1 : 0,
    streak.streakBeforeFreeze,
    streak.justUnfrozeToday ? 1 : 0,
    streak.starCount,
    streak.flameCount,
    streak.crownCount,
    Date.now()
  ]);

  console.log(`✅ Migrated streak state: ${streak.currentStreak} days`);
}

// 3. Migrate warm-up payments
if (streak?.warmUpPayments) {
  for (const payment of streak.warmUpPayments) {
    await db.runAsync(
      'INSERT INTO warm_up_payments VALUES (?, ?, ?, ?)',
      [payment.id, payment.missedDate, payment.paidAt, payment.adsWatched || 1]
    );
  }
  console.log(`✅ Migrated ${streak.warmUpPayments.length} warm-up payments`);
}
```

**Phase 1.1.4: Verification** (5 min)
```typescript
// 1. Count migrated entries
const entryCount = await db.getFirstAsync<{ count: number }>(
  'SELECT COUNT(*) as count FROM journal_entries'
);

// 2. Verify streak state
const migratedStreak = await db.getFirstAsync(
  'SELECT * FROM streak_state WHERE id = 1'
);

// 3. Check warm-up payments
const paymentCount = await db.getFirstAsync<{ count: number }>(
  'SELECT COUNT(*) as count FROM warm_up_payments'
);

// 4. Validation
const validationPassed =
  entryCount.count === backup.entries.length &&
  migratedStreak.current_streak === backup.streak.currentStreak &&
  paymentCount.count === (backup.streak.warmUpPayments?.length || 0);

if (!validationPassed) {
  throw new Error(`Migration validation failed:
    Expected entries: ${backup.entries.length}, Got: ${entryCount.count}
    Expected streak: ${backup.streak.currentStreak}, Got: ${migratedStreak.current_streak}
    Expected payments: ${backup.streak.warmUpPayments?.length || 0}, Got: ${paymentCount.count}
  `);
}

console.log('✅ Migration verification passed');
```

**Phase 1.1.5: Update GratitudeStorage Service** (30 min)
```typescript
// New SQLiteGratitudeStorage class
export class SQLiteGratitudeStorage {
  private db: SQLite.SQLiteDatabase;

  async init() {
    this.db = await SQLite.openDatabaseAsync('selfrise.db');
  }

  // ✅ FAST: Direct INSERT (no read-all)
  async create(input: CreateGratitudeInput): Promise<Gratitude> {
    const entry = {
      id: generateUUID(),
      text: input.text,
      type: input.type,
      date: input.date || today(),
      gratitudeNumber: input.gratitudeNumber || 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.db.withTransactionAsync(async () => {
      // Insert entry
      await this.db.runAsync(
        'INSERT INTO journal_entries VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entry.id, entry.text, entry.type, entry.date, entry.gratitudeNumber, entry.createdAt, entry.updatedAt]
      );

      // Update streak (trigger-based or manual update)
      await this.updateStreakAfterEntry(entry.date);
    });

    return entry;
  }

  // ✅ FAST: WHERE clause filtering
  async getByDate(date: DateString): Promise<Gratitude[]> {
    return await this.db.getAllAsync<Gratitude>(
      'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at ASC',
      [date]
    );
  }

  // ✅ FAST: SQL COUNT aggregates
  async calculateAndUpdateStreak(): Promise<GratitudeStreak> {
    // Use SQL aggregates instead of loading all data
    const completedDates = await this.db.getAllAsync<{ date: string }>(
      'SELECT DISTINCT date FROM journal_entries WHERE gratitude_number >= 1 ORDER BY date DESC'
    );

    // Calculate streak using SQL-powered logic
    const streak = calculateStreakFromDates(completedDates.map(r => r.date));

    // Update streak state
    await this.db.runAsync(`
      UPDATE streak_state
      SET current_streak = ?, longest_streak = ?, last_entry_date = ?, updated_at = ?
      WHERE id = 1
    `, [streak.current, streak.longest, streak.lastDate, Date.now()]);

    return this.getStreak();
  }

  // ✅ FAST: Single SELECT
  async getStreak(): Promise<GratitudeStreak> {
    const row = await this.db.getFirstAsync('SELECT * FROM streak_state WHERE id = 1');
    return {
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastEntryDate: row.last_entry_date,
      // ... map all fields
    };
  }
}
```

**Phase 1.1.6: Rollback Plan** (if anything fails)
```typescript
async function rollbackJournalMigration() {
  try {
    console.log('🔄 Rolling back journal migration...');

    // 1. Restore from backup
    const backup = await BaseStorage.get('MIGRATION_BACKUP_JOURNAL_V1');

    if (!backup) {
      throw new Error('No backup found');
    }

    // 2. Restore AsyncStorage data
    await BaseStorage.set('GRATITUDES', backup.entries);
    await BaseStorage.set('GRATITUDE_STREAK', backup.streak);

    // 3. Drop SQLite tables (optional - can keep for debugging)
    // await db.execAsync('DROP TABLE IF EXISTS journal_entries');
    // await db.execAsync('DROP TABLE IF EXISTS streak_state');

    // 4. Mark migration as rolled back
    await BaseStorage.set('MIGRATION_ROLLBACK_JOURNAL', {
      timestamp: Date.now(),
      reason: 'User-initiated rollback or validation failure'
    });

    console.log('✅ Rollback completed - AsyncStorage restored');
    return true;
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return false;
  }
}
```

**Testing Plan**:
1. ✅ Create automated tests for SQLiteGratitudeStorage (all methods)
2. ✅ Test migration with various data sizes (0, 10, 100, 1000 entries)
3. ✅ Test transaction rollback scenarios
4. ✅ Test concurrent operations (race condition prevention)
5. ✅ Performance benchmarks (AsyncStorage vs SQLite)
6. ✅ Manual testing: Add entries, check streak, verify warm-up payments
7. ✅ Edge cases: Empty data, corrupted data, partial migration

**Files to Update**:
- `src/services/storage/sqliteGratitudeStorage.ts` (NEW)
- `src/services/storage/gratitudeStorage.ts` (keep as fallback)
- `src/services/storage/migration.ts` (add journal migration logic)
- `src/contexts/GratitudeContext.tsx` (switch to SQLite storage)
- Tests: `__tests__/sqliteGratitudeStorage.test.ts` (NEW)

**Success Criteria**:
- ✅ 100% data integrity (verified via checksums)
- ✅ 20x+ performance improvement in add entry operation
- ✅ Zero race conditions (transaction-based)
- ✅ Rollback capability fully functional
- ✅ All existing features work identically
- ✅ No user-facing changes (migration is transparent)

---

#### 📊 ČÁST 1.2: HABITS STORAGE ANALÝZA

**Current AsyncStorage Keys**:
- `HABITS` - Array of habit definitions
- `HABIT_COMPLETIONS` - Array of completion records

**Data Structures**:

```typescript
interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  scheduledDays: number[];  // 0-6 (Sunday-Saturday)
  order: number;

  // Timeline system (immutable history)
  timeline: HabitTimelineEntry[];

  createdAt: number;
  updatedAt: number;
}

interface HabitTimelineEntry {
  id: string;
  timestamp: number;
  changeType: 'created' | 'schedule_changed' | 'name_changed' | 'archived';
  scheduledDays: number[];
  name: string;
}

interface HabitCompletion {
  id: string;
  habitId: string;
  date: DateString;
  completedAt: number;
  isBonus: boolean;  // Completed on non-scheduled day
  xpAwarded: number;
}
```

**Performance Bottlenecks**:
1. **toggleCompletion()** - Mark habit complete/incomplete
   - Reads ALL habits + ALL completions (~60ms)
   - Triggers XP calculation
   - Writes completions array

2. **getAll()** - Load habits for Habits screen
   - Reads all habits, performs automatic timeline migration
   - ~40-80ms with migration checks

3. **getHabitStatistics()** - Calculate completion rates, streaks
   - Iterates all completions in JavaScript
   - ~50-100ms per habit

**SQLite Schema**:

```sql
-- Habits table
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  scheduled_days TEXT NOT NULL,  -- JSON array: [0,1,2,3,4,5,6]
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_habits_order ON habits(order_index);
CREATE INDEX idx_habits_archived ON habits(is_archived);

-- Habit timeline (immutable history)
CREATE TABLE habit_timeline (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  scheduled_days TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE INDEX idx_timeline_habit ON habit_timeline(habit_id, timestamp DESC);

-- Habit completions
CREATE TABLE habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  is_bonus INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_completion_habit_date ON habit_completions(habit_id, date);
CREATE INDEX idx_completion_date ON habit_completions(date);

-- Views
CREATE VIEW v_todays_completions AS
SELECT hc.*, h.name, h.color, h.icon
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id
WHERE hc.date = date('now');

CREATE VIEW v_habit_stats AS
SELECT
  h.id,
  h.name,
  COUNT(hc.id) as total_completions,
  SUM(hc.xp_awarded) as total_xp,
  MAX(hc.date) as last_completion_date
FROM habits h
LEFT JOIN habit_completions hc ON hc.habit_id = h.id
GROUP BY h.id;
```

**Performance Improvements**:
- Toggle completion: 60ms → 3ms (20x faster)
- Get habit stats: 100ms → 10ms (10x faster)
- Load habits: 80ms → 15ms (5x faster)

**Migration Strategy**: Similar to journal (backup → create tables → migrate data → verify → update service)

---

#### 📊 ČÁST 1.3: GOALS STORAGE ANALÝZA

**Current AsyncStorage Keys**:
- `GOALS` - Array of goal definitions
- `GOAL_PROGRESS` - Array of progress records
- `GOAL_DAILY_XP_TRACKING` - Daily XP limits tracking

**Data Structures**:

```typescript
interface Goal {
  id: string;
  title: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  targetDate: DateString | null;
  category: GoalCategory;
  status: 'active' | 'completed' | 'archived';
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface GoalProgress {
  id: string;
  goalId: string;
  value: number;
  date: DateString;
  note?: string;
  xpAwarded: number;
  createdAt: number;
}
```

**SQLite Schema**:

```sql
-- Goals table
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  unit TEXT NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL NOT NULL DEFAULT 0,
  target_date TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_order ON goals(order_index);

-- Goal progress tracking
CREATE TABLE goal_progress (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  value REAL NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  xp_awarded INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_progress_goal ON goal_progress(goal_id, date DESC);
CREATE INDEX idx_progress_date ON goal_progress(date);

-- Daily XP tracking
CREATE TABLE goal_daily_xp_tracking (
  date TEXT PRIMARY KEY,
  total_xp_awarded INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Views
CREATE VIEW v_goal_summary AS
SELECT
  g.*,
  COUNT(gp.id) as progress_count,
  SUM(gp.value) as total_progress,
  MAX(gp.date) as last_update_date
FROM goals g
LEFT JOIN goal_progress gp ON gp.goal_id = g.id
GROUP BY g.id;
```

**Migration Strategy**: Same phased approach as journal and habits

---

### 📦 IMPLEMENTATION TIMELINE - SEKCE 1

**Total Estimated Time: 8-12 hours** (including testing)

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1.1.1 | Journal backup & verification | 30 min | 🔴 Critical |
| 1.1.2 | SQLite setup & schema creation | 45 min | 🔴 Critical |
| 1.1.3 | Journal data migration | 1 hour | 🔴 Critical |
| 1.1.4 | Migration verification tests | 45 min | 🔴 Critical |
| 1.1.5 | Update GratitudeStorage service | 2 hours | 🔴 Critical |
| 1.1.6 | Rollback mechanism | 30 min | 🔴 Critical |
| 1.1.7 | Integration testing | 1 hour | 🔴 Critical |
| 1.2 | Habits storage migration | 2 hours | 🟠 High |
| 1.3 | Goals storage migration | 2 hours | 🟠 High |
| Testing | Automated + manual testing | 2 hours | 🔴 Critical |

---

### ✅ SUCCESS CRITERIA - SEKCE 1

**Data Integrity**:
- [ ] 100% of journal entries migrated (verified via count + checksums)
- [ ] All streak data preserved (current, longest, frozen days, payments)
- [ ] All habit completions migrated with correct dates
- [ ] All goal progress records migrated
- [ ] Timeline data integrity maintained

**Performance**:
- [ ] Add journal entry: <10ms (target: 5ms, baseline: 360ms)
- [ ] Load today's entries: <5ms (target: 2ms, baseline: 50ms)
- [ ] Calculate streak: <20ms (target: 15ms, baseline: 120ms)
- [ ] Toggle habit completion: <5ms (target: 3ms, baseline: 60ms)
- [ ] Update goal progress: <10ms (target: 5ms, baseline: 70ms)

**Stability**:
- [ ] Zero race conditions (verified via stress testing)
- [ ] Transaction rollback works 100% of time
- [ ] Rollback mechanism restores data perfectly
- [ ] No data loss in any scenario
- [ ] No corruption during concurrent operations

**User Experience**:
- [ ] Migration happens transparently (user sees "Optimizing database..." for 3-5s)
- [ ] All features work identically after migration
- [ ] No visual changes to UI
- [ ] Performance improvement noticeable (faster entry adds, faster screen loads)
- [ ] Backup available in case of issues

---

### 🔄 NEXT STEPS

**After SEKCE 1 Complete**:
1. Mark all tasks as completed ✅
2. Monitor production for 1-2 weeks
3. Proceed to SEKCE 2: Gamification & XP Migration
4. Proceed to SEKCE 3: Monthly Challenges & Features Migration
5. Proceed to SEKCE 4: Configuration Layer Analysis (what stays on AsyncStorage)

---

**Status**: 📋 Planning Complete - Ready for Implementation Review & Approval
