### 🎮 SEKCE 2: GAMIFICATION & XP MIGRATION (Achievements, XP, Multipliers, Loyalty)

**Priority**: 🟠 **VYSOKÁ** - Optimalizace XP systému a achievement trackingu

**Affected Services**:
- `src/services/gamificationService.ts` (31 AsyncStorage operations, 2000+ lines)
- `src/services/achievementStorage.ts` (16 AsyncStorage operations)
- `src/services/xpMultiplierService.ts` (15 AsyncStorage operations)
- `src/services/loyaltyService.ts` (8 AsyncStorage operations)

---

#### 📊 ČÁST 2.1: XP & GAMIFICATION STORAGE ANALÝZA

**Current AsyncStorage Keys**:
```typescript
STORAGE_KEYS = {
  TOTAL_XP: 'gamification_total_xp',
  XP_TRANSACTIONS: 'gamification_xp_transactions',
  XP_BY_SOURCE: 'gamification_xp_by_source',
  DAILY_XP_TRACKING: 'gamification_daily_xp',
  LAST_ACTIVITY: 'gamification_last_activity',
  XP_MULTIPLIER: 'gamification_xp_multiplier',
  PENDING_NOTIFICATIONS: 'gamification_pending_notifications',
  LEVEL_UP_HISTORY: 'gamification_level_up_history'
}
```

**Data Structures**:
```typescript
interface XPTransaction {
  id: string;
  amount: number;
  source: XPSourceType;
  sourceId?: string;
  timestamp: number;
  description?: string;
  metadata?: Record<string, any>;
}

interface DailyXPTracking {
  date: DateString;
  totalXP: number;
  bySource: Map<XPSourceType, number>;
  transactionCount: number;
  limits: {
    habits: { earned: number; limit: number };
    journal: { earned: number; limit: number };
    goals: { earned: number; limit: number };
  };
}
```

**Performance Bottlenecks**:
1. **XP Transactions Array** - Grows indefinitely
   - Current: All-time history stored (could be 1000+ transactions)
   - Issue: Slow reads/writes as data grows
   - Frequency: Every XP award (habits, journal, goals)

2. **Daily XP Limits** - Calculated via array iteration
   - Current: Iterates all transactions to sum today's XP
   - Issue: ~30-50ms for 100+ transactions

**SQLite Schema**:
```sql
-- XP Transactions (time-series data)
CREATE TABLE xp_transactions (
  id TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  timestamp INTEGER NOT NULL,
  description TEXT,
  metadata TEXT  -- JSON
);

CREATE INDEX idx_xp_timestamp ON xp_transactions(timestamp DESC);
CREATE INDEX idx_xp_source ON xp_transactions(source);

-- Daily XP Summary (pre-aggregated for fast queries)
CREATE TABLE xp_daily_summary (
  date TEXT PRIMARY KEY,
  total_xp INTEGER NOT NULL DEFAULT 0,
  habit_xp INTEGER NOT NULL DEFAULT 0,
  journal_xp INTEGER NOT NULL DEFAULT 0,
  goal_xp INTEGER NOT NULL DEFAULT 0,
  achievement_xp INTEGER NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- User XP State (singleton)
CREATE TABLE xp_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  last_activity INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Level Up History
CREATE TABLE level_up_history (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  total_xp_at_levelup INTEGER NOT NULL,
  is_milestone INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_levelup_timestamp ON level_up_history(timestamp DESC);
```

**Performance Improvements**:
- Award XP: 80ms → 5ms (16x faster - no transaction array read)
- Get today's XP: 50ms → 1ms (50x faster - pre-aggregated)
- Check daily limits: 40ms → 1ms (40x faster - direct query)

---

#### 📊 ČÁST 2.2: ACHIEVEMENTS STORAGE ANALÝZA

**Current AsyncStorage Keys**:
```typescript
ACHIEVEMENT_STORAGE_KEYS = {
  USER_ACHIEVEMENTS: 'achievements_user_data',
  PROGRESS_HISTORY: 'achievements_progress_history',
  UNLOCK_EVENTS: 'achievements_unlock_events',
  STATISTICS_CACHE: 'achievements_statistics_cache',
  STREAK_DATA: 'achievements_streak_data'
}
```

**Data Structures**:
```typescript
interface UserAchievements {
  unlockedAchievements: string[];  // Achievement IDs
  achievementProgress: Map<string, number>;
  lastUnlockDate: DateString | null;
  totalAchievements: number;
  totalXPFromAchievements: number;
}

interface AchievementUnlockEvent {
  achievementId: string;
  unlockedAt: number;
  xpAwarded: number;
  category: AchievementCategory;
}
```

**SQLite Schema**:
```sql
-- User Achievement Progress
CREATE TABLE achievement_progress (
  achievement_id TEXT PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  unlocked INTEGER NOT NULL DEFAULT 0,
  unlocked_at INTEGER,
  xp_awarded INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_achievement_unlocked ON achievement_progress(unlocked);
CREATE INDEX idx_achievement_category ON achievement_progress(achievement_id);

-- Achievement Unlock Events (history)
CREATE TABLE achievement_unlock_events (
  id TEXT PRIMARY KEY,
  achievement_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  xp_awarded INTEGER NOT NULL,
  category TEXT NOT NULL
);

CREATE INDEX idx_unlock_timestamp ON achievement_unlock_events(unlocked_at DESC);

-- Achievement Statistics Cache
CREATE TABLE achievement_stats_cache (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  total_unlocked INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  by_category TEXT NOT NULL,  -- JSON
  by_rarity TEXT NOT NULL,    -- JSON
  last_updated INTEGER NOT NULL
);
```

---

#### 📊 ČÁST 2.3: XP MULTIPLIERS & LOYALTY

**Current Data**:
- XP Multiplier tracking (harmony streaks, active multipliers)
- Loyalty tracking (cumulative active days, milestones)

**SQLite Schema**:
```sql
-- XP Multipliers
CREATE TABLE xp_multipliers (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  multiplier REAL NOT NULL,
  activated_at INTEGER NOT NULL,
  expires_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_multiplier_active ON xp_multipliers(is_active, expires_at);

-- Loyalty Tracking
CREATE TABLE loyalty_state (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  total_active_days INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  milestones_unlocked TEXT NOT NULL,  -- JSON array
  updated_at INTEGER NOT NULL
);

-- Daily Activity Log (for harmony streak calculation)
CREATE TABLE daily_activity_log (
  date TEXT PRIMARY KEY,
  has_habit_activity INTEGER NOT NULL DEFAULT 0,
  has_journal_activity INTEGER NOT NULL DEFAULT 0,
  has_goal_activity INTEGER NOT NULL DEFAULT 0,
  habit_completions INTEGER NOT NULL DEFAULT 0,
  journal_entries INTEGER NOT NULL DEFAULT 0,
  goal_progress_updates INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_activity_date ON daily_activity_log(date DESC);
```

---

#### 📊 ČÁST 2.4: KRITICKÉ SYSTÉMY - BATCHING & OPTIMISTIC UPDATES

**XP Batching System** - Složitý systém vyžadující speciální pozornost při migraci:

```typescript
// Current Implementation (AsyncStorage)
private static pendingBatch: PendingXPBatch | null = null;
private static batchTimeout: NodeJS.Timeout | null = null;
private static readonly BATCH_WINDOW_MS = 500; // 500ms batching window
private static readonly MAX_BATCH_SIZE = 20;

interface PendingXPBatch {
  totalAmount: number;
  sources: Map<XPSourceType, number>;
  sourceIds: string[];
  descriptions: string[];
  metadata: Record<string, any>[];
  firstActionTime: number;
  lastActionTime: number;
}
```

**Batching Logic Flow**:
1. User performs multiple actions quickly (e.g., completing 3 habits)
2. Each action adds XP to pendingBatch (in-memory)
3. After 500ms OR 20 operations OR 500 XP total → commit batch
4. Batch commits all XP in single AsyncStorage write

**Migration Challenge**:
- Batching systém běží v paměti → nesmí se ztratit pending XP během migrace
- Musíme zajistit že pending batch se commitne PŘED migrací
- SQLite transakce jsou rychlejší → možná úplně odstranit batching?

**Optimistic Updates System**:
```typescript
// Cached XP for instant UI feedback
private static cachedXPData: {
  totalXP: number;
  timestamp: number;
  level: number;
} | null = null;

// Performance tracking
private static performanceMetrics: PerformanceMetrics = {
  operationCount: 0,
  totalOperationTime: 0,
  averageOperationTime: 0,
  optimisticUpdateCount: 0,
  backgroundSyncCount: 0,
  correctionCount: 0,
  lastOperationTime: 0,
  cacheHitRate: 0,
};
```

**Migration Decision Points**:
1. **Keep batching?** SQLite je 16x rychlejší → možná není potřeba
2. **Optimistic updates?** Pravděpodobně stále užitečné pro animace
3. **Cache validity**: SQLite může číst častěji bez performance penalizace

---

### 📦 MIGRATION STRATEGY - SEKCE 2

**Total Estimated Time: 6-8 hours**

---

#### PHASE 2.1.1: Pre-Migration Preparation (30 min)

**Goal**: Ensure all pending XP operations are committed before migration starts

**Critical Steps**:

1. **Flush Pending Batch** - Commit any in-flight XP batches
```typescript
// Add to migration prep script
async function flushPendingGamificationBatches(): Promise<void> {
  console.log('🔄 Flushing pending XP batches...');

  // Force commit any pending batch
  if (GamificationService.hasPendingBatch()) {
    await GamificationService.commitBatch();
    console.log('✅ Pending batch committed');
  }

  // Wait for all background sync operations to complete
  await GamificationService.waitForBackgroundSync();
  console.log('✅ Background sync completed');

  // Verify no pending operations
  const pendingOps = await GamificationService.getPendingOperationsCount();
  if (pendingOps > 0) {
    throw new Error(`Still ${pendingOps} pending operations after flush!`);
  }

  console.log('✅ All gamification operations flushed');
}
```

2. **Backup Gamification Data** - Complete backup with verification
```typescript
async function backupGamificationData(): Promise<GamificationBackup> {
  const backup: GamificationBackup = {
    timestamp: Date.now(),
    version: '1.0.0',

    // XP & State
    totalXP: await AsyncStorage.getItem('gamification_total_xp'),
    xpTransactions: await AsyncStorage.getItem('gamification_xp_transactions'),
    dailyXPTracking: await AsyncStorage.getItem('gamification_daily_xp'),
    levelUpHistory: await AsyncStorage.getItem('gamification_level_up_history'),

    // Achievements
    userAchievements: await AsyncStorage.getItem('achievements_user_data'),
    achievementProgress: await AsyncStorage.getItem('achievements_progress_history'),
    unlockEvents: await AsyncStorage.getItem('achievements_unlock_events'),
    statisticsCache: await AsyncStorage.getItem('achievements_statistics_cache'),

    // Multipliers & Loyalty
    xpMultipliers: await AsyncStorage.getItem('xp_multipliers_state'),
    loyaltyState: await AsyncStorage.getItem('loyalty_tracking_state'),
    harmonyStreak: await AsyncStorage.getItem('harmony_streak_data'),
  };

  // Save to file system
  const backupPath = `${FileSystem.documentDirectory}gamification_backup_${backup.timestamp}.json`;
  await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backup, null, 2));

  console.log(`✅ Gamification backup saved: ${backupPath}`);
  return backup;
}
```

3. **Calculate Verification Checksums**
```typescript
interface GamificationChecksums {
  totalXPSum: number;              // Sum of all XP transactions
  achievementUnlockCount: number;  // Total achievements unlocked
  totalXPAwarded: number;          // Total XP from achievements
  levelUpEventCount: number;       // Total level-up events
  transactionCount: number;        // Total XP transactions
}

async function calculateGamificationChecksums(): Promise<GamificationChecksums> {
  const transactions = await getXPTransactions();
  const achievements = await getUserAchievements();
  const levelUps = await getLevelUpHistory();

  return {
    totalXPSum: transactions.reduce((sum, t) => sum + t.amount, 0),
    achievementUnlockCount: achievements.unlockedAchievements.length,
    totalXPAwarded: achievements.totalXPFromAchievements,
    levelUpEventCount: levelUps.length,
    transactionCount: transactions.length,
  };
}
```

**Time Estimate**: 30 minutes

---

#### PHASE 2.1.2: XP Transactions Migration (1.5 hours)

**Goal**: Migrate all XP transactions to SQLite with transaction history intact

**Migration Steps**:

1. **Read AsyncStorage XP Data**
```typescript
async function loadXPDataFromAsyncStorage(): Promise<XPMigrationData> {
  // Load all XP-related data
  const totalXPStr = await AsyncStorage.getItem('gamification_total_xp');
  const transactionsStr = await AsyncStorage.getItem('gamification_xp_transactions');
  const dailyXPStr = await AsyncStorage.getItem('gamification_daily_xp');

  const totalXP = totalXPStr ? parseInt(totalXPStr, 10) : 0;
  const transactions: XPTransaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];
  const dailyXP: Record<DateString, DailyXPData> = dailyXPStr ? JSON.parse(dailyXPStr) : {};

  console.log(`📊 Loaded ${transactions.length} XP transactions, total: ${totalXP} XP`);
  return { totalXP, transactions, dailyXP };
}
```

2. **Migrate XP Transactions to SQLite**
```typescript
async function migrateXPTransactions(
  db: SQLite.SQLiteDatabase,
  transactions: XPTransaction[]
): Promise<void> {
  console.log(`🔄 Migrating ${transactions.length} XP transactions...`);

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const transaction of transactions) {
      await db.runAsync(
        `INSERT INTO xp_transactions (
          id, amount, source, source_id, timestamp, description, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.amount,
          transaction.source,
          transaction.sourceId || null,
          transaction.createdAt.getTime(),
          transaction.description || null,
          transaction.metadata ? JSON.stringify(transaction.metadata) : null
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`✅ ${transactions.length} XP transactions migrated`);

  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw new Error(`XP transaction migration failed: ${error}`);
  }
}
```

3. **Pre-aggregate Daily XP Summaries**
```typescript
async function buildDailyXPSummaries(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  console.log('🔄 Building daily XP summaries...');

  // Use SQLite aggregation to build summaries from transactions
  await db.execAsync(`
    INSERT INTO xp_daily_summary (
      date,
      total_xp,
      habit_xp,
      journal_xp,
      goal_xp,
      achievement_xp,
      transaction_count,
      updated_at
    )
    SELECT
      DATE(timestamp / 1000, 'unixepoch') as date,
      SUM(amount) as total_xp,
      SUM(CASE WHEN source LIKE 'HABIT_%' THEN amount ELSE 0 END) as habit_xp,
      SUM(CASE WHEN source LIKE 'JOURNAL_%' THEN amount ELSE 0 END) as journal_xp,
      SUM(CASE WHEN source LIKE 'GOAL_%' THEN amount ELSE 0 END) as goal_xp,
      SUM(CASE WHEN source = 'ACHIEVEMENT_UNLOCK' THEN amount ELSE 0 END) as achievement_xp,
      COUNT(*) as transaction_count,
      strftime('%s', 'now') * 1000 as updated_at
    FROM xp_transactions
    GROUP BY date
    ORDER BY date ASC
  `);

  const summaryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM xp_daily_summary'
  );

  console.log(`✅ ${summaryCount?.count || 0} daily summaries created`);
}
```

4. **Migrate XP State**
```typescript
async function migrateXPState(
  db: SQLite.SQLiteDatabase,
  totalXP: number
): Promise<void> {
  console.log(`🔄 Migrating XP state (total: ${totalXP})...`);

  const currentLevel = getCurrentLevel(totalXP);
  const lastActivity = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO xp_state (
      id, total_xp, current_level, last_activity, updated_at
    ) VALUES (1, ?, ?, ?, ?)`,
    [totalXP, currentLevel, lastActivity, lastActivity]
  );

  console.log(`✅ XP state migrated: ${totalXP} XP, Level ${currentLevel}`);
}
```

5. **Migrate Level-Up History**
```typescript
async function migrateLevelUpHistory(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const historyStr = await AsyncStorage.getItem('gamification_level_up_history');
  const history: LevelUpEvent[] = historyStr ? JSON.parse(historyStr) : [];

  console.log(`🔄 Migrating ${history.length} level-up events...`);

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const event of history) {
      await db.runAsync(
        `INSERT INTO level_up_history (
          id, level, timestamp, total_xp_at_levelup, is_milestone
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          event.id,
          event.newLevel,
          event.timestamp.getTime(),
          event.totalXPAtLevelUp,
          isLevelMilestone(event.newLevel) ? 1 : 0
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`✅ ${history.length} level-up events migrated`);

  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

6. **Verify XP Migration**
```typescript
async function verifyXPMigration(
  db: SQLite.SQLiteDatabase,
  originalChecksums: GamificationChecksums
): Promise<void> {
  console.log('🔍 Verifying XP migration...');

  // Verify transaction count
  const txCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM xp_transactions'
  );
  if (txCount?.count !== originalChecksums.transactionCount) {
    throw new Error(
      `Transaction count mismatch: ${txCount?.count} vs ${originalChecksums.transactionCount}`
    );
  }

  // Verify total XP sum
  const xpSum = await db.getFirstAsync<{ sum: number }>(
    'SELECT SUM(amount) as sum FROM xp_transactions'
  );
  if (xpSum?.sum !== originalChecksums.totalXPSum) {
    throw new Error(
      `XP sum mismatch: ${xpSum?.sum} vs ${originalChecksums.totalXPSum}`
    );
  }

  // Verify level-up count
  const levelUpCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM level_up_history'
  );
  if (levelUpCount?.count !== originalChecksums.levelUpEventCount) {
    throw new Error(
      `Level-up count mismatch: ${levelUpCount?.count} vs ${originalChecksums.levelUpEventCount}`
    );
  }

  console.log('✅ XP migration verification passed');
}
```

**Time Estimate**: 1.5 hours

---

#### PHASE 2.2.1: Achievements Migration (1.5 hours)

**Goal**: Migrate achievement progress, unlock events, and statistics

**Migration Steps**:

1. **Migrate Achievement Progress**
```typescript
async function migrateAchievementProgress(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const userAchievements = await AchievementStorage.getUserAchievements();

  console.log(`🔄 Migrating achievement progress (${Object.keys(userAchievements.achievementProgress).length} achievements)...`);

  await db.execAsync('BEGIN TRANSACTION');

  try {
    // Get all achievement definitions to get target values
    const allAchievements = getAllAchievements(); // From achievement definitions

    for (const achievement of allAchievements) {
      const currentValue = userAchievements.achievementProgress[achievement.id] || 0;
      const isUnlocked = userAchievements.unlockedAchievements.includes(achievement.id);

      // Find unlock event if exists
      const unlockEvents = await AsyncStorage.getItem('achievements_unlock_events');
      const events: AchievementUnlockEvent[] = unlockEvents ? JSON.parse(unlockEvents) : [];
      const unlockEvent = events.find(e => e.achievementId === achievement.id);

      await db.runAsync(
        `INSERT INTO achievement_progress (
          achievement_id, current_value, target_value,
          unlocked, unlocked_at, xp_awarded, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          achievement.id,
          currentValue,
          achievement.target,
          isUnlocked ? 1 : 0,
          unlockEvent?.unlockedAt || null,
          unlockEvent?.xpAwarded || 0,
          Date.now()
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`✅ Achievement progress migrated`);

  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

2. **Migrate Achievement Unlock Events**
```typescript
async function migrateAchievementUnlockEvents(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const eventsStr = await AsyncStorage.getItem('achievements_unlock_events');
  const events: AchievementUnlockEvent[] = eventsStr ? JSON.parse(eventsStr) : [];

  console.log(`🔄 Migrating ${events.length} achievement unlock events...`);

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const event of events) {
      await db.runAsync(
        `INSERT INTO achievement_unlock_events (
          id, achievement_id, unlocked_at, xp_awarded, category
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          event.achievementId + '_unlock', // Generate ID
          event.achievementId,
          event.unlockedAt,
          event.xpAwarded,
          event.category
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`✅ ${events.length} unlock events migrated`);

  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

3. **Build Achievement Statistics Cache**
```typescript
async function buildAchievementStatsCache(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  console.log('🔄 Building achievement statistics cache...');

  const userAchievements = await AchievementStorage.getUserAchievements();

  await db.runAsync(
    `INSERT OR REPLACE INTO achievement_stats_cache (
      id, total_unlocked, total_xp_earned, by_category, by_rarity, last_updated
    ) VALUES (1, ?, ?, ?, ?, ?)`,
    [
      userAchievements.unlockedAchievements.length,
      userAchievements.totalXPFromAchievements,
      JSON.stringify(userAchievements.categoryProgress),
      JSON.stringify(userAchievements.rarityCount),
      Date.now()
    ]
  );

  console.log('✅ Achievement stats cache created');
}
```

**Time Estimate**: 1.5 hours

---

#### PHASE 2.3.1: Multipliers & Loyalty Migration (1 hour)

**Goal**: Migrate XP multipliers and loyalty tracking data

**Migration Steps**:

1. **Migrate Active XP Multipliers**
```typescript
async function migrateXPMultipliers(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const multipliersStr = await AsyncStorage.getItem('xp_multipliers_state');
  const multipliers: ActiveMultiplier[] = multipliersStr ? JSON.parse(multipliersStr) : [];

  console.log(`🔄 Migrating ${multipliers.length} XP multipliers...`);

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const multiplier of multipliers) {
      await db.runAsync(
        `INSERT INTO xp_multipliers (
          id, source, multiplier, activated_at, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          multiplier.id,
          multiplier.source,
          multiplier.value,
          multiplier.activatedAt,
          multiplier.expiresAt || null,
          multiplier.isActive ? 1 : 0
        ]
      );
    }

    await db.execAsync('COMMIT');
    console.log(`✅ ${multipliers.length} multipliers migrated`);

  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
```

2. **Migrate Loyalty State**
```typescript
async function migrateLoyaltyState(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  const loyaltyStr = await AsyncStorage.getItem('loyalty_tracking_state');
  const loyalty = loyaltyStr ? JSON.parse(loyaltyStr) : null;

  if (!loyalty) {
    console.log('⚠️  No loyalty data to migrate');
    return;
  }

  console.log('🔄 Migrating loyalty state...');

  await db.runAsync(
    `INSERT OR REPLACE INTO loyalty_state (
      id, total_active_days, current_streak, longest_streak,
      last_active_date, milestones_unlocked, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [
      loyalty.totalActiveDays,
      loyalty.currentStreak,
      loyalty.longestStreak,
      loyalty.lastActiveDate,
      JSON.stringify(loyalty.milestonesUnlocked),
      Date.now()
    ]
  );

  console.log('✅ Loyalty state migrated');
}
```

3. **Build Daily Activity Log from Historical Data**
```typescript
async function buildDailyActivityLog(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  console.log('🔄 Building daily activity log from XP transactions...');

  // Analyze XP transactions to determine daily activity
  await db.execAsync(`
    INSERT INTO daily_activity_log (
      date,
      has_habit_activity,
      has_journal_activity,
      has_goal_activity,
      habit_completions,
      journal_entries,
      goal_progress_updates
    )
    SELECT
      DATE(timestamp / 1000, 'unixepoch') as date,
      MAX(CASE WHEN source LIKE 'HABIT_%' THEN 1 ELSE 0 END) as has_habit_activity,
      MAX(CASE WHEN source LIKE 'JOURNAL_%' THEN 1 ELSE 0 END) as has_journal_activity,
      MAX(CASE WHEN source LIKE 'GOAL_%' THEN 1 ELSE 0 END) as has_goal_activity,
      SUM(CASE WHEN source = 'HABIT_COMPLETION' THEN 1 ELSE 0 END) as habit_completions,
      SUM(CASE WHEN source = 'JOURNAL_ENTRY' THEN 1 ELSE 0 END) as journal_entries,
      SUM(CASE WHEN source = 'GOAL_PROGRESS' THEN 1 ELSE 0 END) as goal_progress_updates
    FROM xp_transactions
    GROUP BY date
    ORDER BY date ASC
  `);

  const activityCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM daily_activity_log'
  );

  console.log(`✅ ${activityCount?.count || 0} days of activity logged`);
}
```

**Time Estimate**: 1 hour

---

#### PHASE 2.4.1: Update Gamification Services (2 hours)

**Goal**: Refactor gamification services to use SQLite instead of AsyncStorage

**Critical Changes**:

1. **Decision: Remove XP Batching System**
   - SQLite je 16x rychlejší než AsyncStorage (5ms vs 80ms)
   - Batching byl nutný kvůli AsyncStorage performance → už není potřeba
   - Simplify code: každá XP operace je okamžitý SQLite INSERT (5ms)
   - **BENEFIT**: Jednodušší kód, méně bugs, real-time XP updates

2. **Keep Optimistic Updates for Animations**
   - UI animace stále potřebují okamžitou zpětnou vazbu
   - SQLite read je sice rychlé (2ms), ale animace vyžadují synchronní data
   - Cache zůstává pro smooth animations

3. **Refactor GamificationService.addXP()**
```typescript
// NEW: Direct SQLite implementation (no batching)
static async addXP(amount: number, options: XPAdditionOptions): Promise<XPTransactionResult> {
  const startTime = Date.now();

  try {
    // 1. Get current XP state
    const xpState = await db.getFirstAsync<XPState>(
      'SELECT * FROM xp_state WHERE id = 1'
    );

    const previousXP = xpState?.total_xp || 0;
    const previousLevel = xpState?.current_level || 1;

    // 2. Validate daily limits (if not skipped)
    if (!options.skipLimits) {
      const canAdd = await this.checkDailyLimit(amount, options.source);
      if (!canAdd) {
        return {
          success: false,
          xpGained: 0,
          totalXP: previousXP,
          previousLevel,
          newLevel: previousLevel,
          leveledUp: false,
          milestoneReached: false,
          error: 'Daily XP limit reached'
        };
      }
    }

    // 3. Insert XP transaction (ACID transaction)
    const transactionId = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    await db.execAsync('BEGIN TRANSACTION');

    try {
      // Insert transaction
      await db.runAsync(
        `INSERT INTO xp_transactions (
          id, amount, source, source_id, timestamp, description, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          amount,
          options.source,
          options.sourceId || null,
          timestamp,
          options.description || this.getDefaultDescription(options.source),
          options.metadata ? JSON.stringify(options.metadata) : null
        ]
      );

      // Update XP state
      const newTotalXP = previousXP + amount;
      const newLevel = getCurrentLevel(newTotalXP);

      await db.runAsync(
        'UPDATE xp_state SET total_xp = ?, current_level = ?, last_activity = ?, updated_at = ? WHERE id = 1',
        [newTotalXP, newLevel, timestamp, timestamp]
      );

      // Update daily summary (upsert)
      const today = formatDateToString(new Date());
      await db.runAsync(
        `INSERT INTO xp_daily_summary (date, total_xp, ${options.source.toLowerCase()}_xp, transaction_count, updated_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(date) DO UPDATE SET
           total_xp = total_xp + ?,
           ${options.source.toLowerCase()}_xp = ${options.source.toLowerCase()}_xp + ?,
           transaction_count = transaction_count + 1,
           updated_at = ?`,
        [today, amount, amount, timestamp, amount, amount, timestamp]
      );

      await db.execAsync('COMMIT');

      // 4. Check for level-up
      const leveledUp = newLevel > previousLevel;
      const milestoneReached = leveledUp && isLevelMilestone(newLevel);

      if (leveledUp) {
        await this.recordLevelUp(newLevel, newTotalXP, options.source, milestoneReached);
      }

      // 5. Update cache for optimistic reads
      this.cachedXPData = {
        totalXP: newTotalXP,
        level: newLevel,
        timestamp: Date.now()
      };

      // 6. Emit events
      DeviceEventEmitter.emit('xpAwarded', {
        amount,
        source: options.source,
        totalXP: newTotalXP,
        level: newLevel,
        leveledUp,
        timestamp
      });

      const operationTime = Date.now() - startTime;
      console.log(`✅ XP added in ${operationTime}ms: +${amount} ${options.source} (${previousXP} → ${newTotalXP})`);

      return {
        success: true,
        xpGained: amount,
        totalXP: newTotalXP,
        previousLevel,
        newLevel,
        leveledUp,
        milestoneReached,
        transaction: {
          id: transactionId,
          amount,
          source: options.source,
          timestamp,
          description: options.description || this.getDefaultDescription(options.source)
        }
      };

    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('GamificationService.addXP error:', error);
    return {
      success: false,
      xpGained: 0,
      totalXP: await this.getTotalXP(),
      previousLevel: getCurrentLevel(await this.getTotalXP()),
      newLevel: getCurrentLevel(await this.getTotalXP()),
      leveledUp: false,
      milestoneReached: false,
      error: error instanceof Error ? error.message : 'Failed to add XP'
    };
  }
}
```

4. **Simplified Daily Limit Check**
```typescript
static async checkDailyLimit(amount: number, source: XPSourceType): Promise<boolean> {
  const today = formatDateToString(new Date());

  // Get today's summary (pre-aggregated)
  const summary = await db.getFirstAsync<XPDailySummary>(
    'SELECT * FROM xp_daily_summary WHERE date = ?',
    [today]
  );

  if (!summary) return true; // No data for today = limit not reached

  // Check source-specific limit
  const sourceXP = {
    [XPSourceType.HABIT_COMPLETION]: summary.habit_xp,
    [XPSourceType.JOURNAL_ENTRY]: summary.journal_xp,
    [XPSourceType.GOAL_PROGRESS]: summary.goal_xp,
  }[source] || 0;

  const limit = DAILY_XP_LIMITS[source] || Infinity;

  return (sourceXP + amount) <= limit;
}
```

**Time Estimate**: 2 hours

---

#### PHASE 2.5.1: Testing & Validation (1.5 hours)

**Automated Tests**:

```typescript
describe('Gamification SQLite Migration', () => {
  test('XP addition performance < 10ms', async () => {
    const start = Date.now();
    await GamificationService.addXP(50, { source: XPSourceType.HABIT_COMPLETION });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10);
  });

  test('Daily limit check performance < 5ms', async () => {
    const start = Date.now();
    await GamificationService.checkDailyLimit(50, XPSourceType.HABIT_COMPLETION);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5);
  });

  test('Achievement unlock preserves XP history', async () => {
    const before = await db.getAllAsync('SELECT * FROM achievement_unlock_events');

    // Trigger achievement
    await AchievementService.checkAndUnlockAchievements();

    const after = await db.getAllAsync('SELECT * FROM achievement_unlock_events');
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  });

  test('Level-up calculation accuracy', async () => {
    const totalXP = await GamificationService.getTotalXP();
    const calculatedLevel = getCurrentLevel(totalXP);

    const dbLevel = await db.getFirstAsync<{ current_level: number }>(
      'SELECT current_level FROM xp_state WHERE id = 1'
    );

    expect(dbLevel?.current_level).toBe(calculatedLevel);
  });
});
```

**Manual Testing Checklist**:
- [ ] Add XP from habit completion → verify instant XP update
- [ ] Complete 10 habits rapidly → verify no race conditions
- [ ] Unlock achievement → verify XP awarded correctly
- [ ] Reach daily limit → verify limit enforcement
- [ ] Level up → verify level-up modal shows
- [ ] Check XP history → verify all transactions visible
- [ ] Check achievement progress → verify incremental updates
- [ ] Test harmony streak → verify multiplier activation

**Time Estimate**: 1.5 hours

---

### 📦 IMPLEMENTATION TIMELINE - SEKCE 2

**Total Estimated Time: 6-8 hours**

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 2.1.1 | Pre-migration preparation (flush batches, backup, checksums) | 30 min | 🔴 Critical |
| 2.1.2 | XP transactions & daily summaries migration | 1.5 hours | 🔴 Critical |
| 2.2.1 | Achievement progress & unlock events migration | 1.5 hours | 🟠 High |
| 2.3.1 | Multipliers & loyalty migration | 1 hour | 🟡 Medium |
| 2.4.1 | Refactor services (remove batching, SQLite integration) | 2 hours | 🔴 Critical |
| 2.5.1 | Testing & validation (automated + manual) | 1.5 hours | 🟠 High |

---

### 🔄 ROLLBACK MECHANISM - SEKCE 2

**Emergency Rollback Procedure** - Pokud migrace selže nebo vzniknou kritické problémy:

```typescript
async function rollbackGamificationMigration(): Promise<void> {
  console.log('⚠️  INITIATING GAMIFICATION ROLLBACK...');

  try {
    // 1. Stop all gamification operations
    await GamificationService.pauseAllOperations();
    console.log('✅ Gamification operations paused');

    // 2. Close SQLite database
    await db.closeAsync();
    console.log('✅ SQLite database closed');

    // 3. Restore AsyncStorage backup
    const backupFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    const gamificationBackups = backupFiles
      .filter(f => f.startsWith('gamification_backup_'))
      .sort()
      .reverse();

    if (gamificationBackups.length === 0) {
      throw new Error('No gamification backup found!');
    }

    const latestBackup = gamificationBackups[0];
    const backupPath = `${FileSystem.documentDirectory}${latestBackup}`;
    const backupData = await FileSystem.readAsStringAsync(backupPath);
    const backup: GamificationBackup = JSON.parse(backupData);

    console.log(`📦 Restoring backup: ${latestBackup}`);

    // 4. Restore all AsyncStorage keys
    await AsyncStorage.multiSet([
      ['gamification_total_xp', backup.totalXP || '0'],
      ['gamification_xp_transactions', backup.xpTransactions || '[]'],
      ['gamification_daily_xp', backup.dailyXPTracking || '{}'],
      ['gamification_level_up_history', backup.levelUpHistory || '[]'],
      ['achievements_user_data', backup.userAchievements || '{}'],
      ['achievements_progress_history', backup.achievementProgress || '[]'],
      ['achievements_unlock_events', backup.unlockEvents || '[]'],
      ['achievements_statistics_cache', backup.statisticsCache || '{}'],
      ['xp_multipliers_state', backup.xpMultipliers || '[]'],
      ['loyalty_tracking_state', backup.loyaltyState || '{}'],
      ['harmony_streak_data', backup.harmonyStreak || '{}'],
    ]);

    console.log('✅ AsyncStorage data restored');

    // 5. Delete SQLite database
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}SQLite/selfrise.db`, {
      idempotent: true
    });
    console.log('✅ SQLite database deleted');

    // 6. Restore old service code (revert to AsyncStorage implementation)
    console.log('⚠️  MANUAL STEP REQUIRED: Revert service code to AsyncStorage version');

    // 7. Verify restoration
    const totalXP = await AsyncStorage.getItem('gamification_total_xp');
    const transactions = await AsyncStorage.getItem('gamification_xp_transactions');
    console.log(`✅ Verification: ${totalXP} XP, ${JSON.parse(transactions || '[]').length} transactions`);

    // 8. Resume operations
    await GamificationService.resumeOperations();
    console.log('✅ Gamification operations resumed');

    console.log('✅ ROLLBACK COMPLETE - Application restored to pre-migration state');

  } catch (error) {
    console.error('❌ ROLLBACK FAILED:', error);
    throw new Error(`Rollback failed: ${error}. MANUAL INTERVENTION REQUIRED.`);
  }
}
```

**Rollback Decision Criteria**:
- [ ] XP calculations producing incorrect results
- [ ] Achievement unlocks not triggering
- [ ] Level-up system broken
- [ ] Performance degradation (SQLite slower than expected)
- [ ] Data corruption detected
- [ ] Critical production bugs after migration

**Post-Rollback Actions**:
1. Analyze root cause of migration failure
2. Fix identified issues in migration scripts
3. Test migration in development environment
4. Schedule new migration attempt

---

### ✅ SUCCESS CRITERIA - SEKCE 2

**Data Integrity**:
- [ ] All XP transactions migrated (verified via sum)
- [ ] Achievement progress preserved
- [ ] Level up history intact
- [ ] Loyalty milestones preserved

**Performance**:
- [ ] Award XP: <10ms (target: 5ms, baseline: 80ms)
- [ ] Check daily limits: <5ms (target: 1ms, baseline: 40ms)
- [ ] Get achievement stats: <10ms (target: 5ms, baseline: 60ms)

**Stability**:
- [ ] No XP calculation errors
- [ ] Achievement unlock events tracked correctly
- [ ] Multipliers activate/expire properly

---

### 🎯 KEY MIGRATION DECISIONS - SEKCE 2

**1. XP Batching System → REMOVED**
- **Reason**: SQLite is 16x faster (5ms vs 80ms AsyncStorage writes)
- **Impact**: Simpler code, fewer bugs, real-time XP updates
- **Trade-off**: None - batching was AsyncStorage performance workaround

**2. Optimistic Updates → KEPT**
- **Reason**: UI animations require instant feedback
- **Impact**: Smooth animations continue working
- **Implementation**: Cache updated after SQLite write (5ms penalty)

**3. Daily XP Summaries → PRE-AGGREGATED**
- **Reason**: Instant daily limit checks (1ms vs 40ms iteration)
- **Impact**: Faster limit validation, better UX
- **Implementation**: Update summary on every XP transaction (UPSERT)

**4. Achievement Progress → INCREMENTAL TRACKING**
- **Reason**: Preserve unlock history and progress over time
- **Impact**: Historical data for analytics and user insights
- **Implementation**: Separate tables for progress and unlock events

---

### 📊 EXPECTED PERFORMANCE IMPROVEMENTS - SEKCE 2

| Operation | AsyncStorage | SQLite | Improvement |
|-----------|-------------|--------|-------------|
| Award XP | 80ms | 5ms | **16x faster** |
| Check daily limit | 40ms | 1ms | **40x faster** |
| Get total XP | 15ms | 2ms | **7.5x faster** |
| Unlock achievement | 120ms | 8ms | **15x faster** |
| Get achievement stats | 60ms | 5ms | **12x faster** |

**Overall Impact**:
- ✅ Zero race conditions (ACID transactions)
- ✅ Real-time XP updates (no batching delay)
- ✅ Faster UI responsiveness across all gamification features
- ✅ Simplified codebase (removed ~200 lines of batching logic)
- ✅ Scalable for future growth (SQLite handles 100k+ transactions easily)

---

### 🚨 CRITICAL RISKS & MITIGATIONS - SEKCE 2

**Risk 1: Pending XP Batch Lost During Migration**
- **Severity**: 🔴 Critical (users lose XP)
- **Mitigation**: Phase 2.1.1 flushes all pending batches before migration
- **Validation**: Verify pendingOperationsCount = 0 before proceeding

**Risk 2: XP Calculation Discrepancies After Migration**
- **Severity**: 🟠 High (incorrect levels, broken achievements)
- **Mitigation**: Comprehensive checksums (totalXPSum, transactionCount)
- **Validation**: Verify checksums match before/after migration

**Risk 3: Achievement Unlock Events Missing**
- **Severity**: 🟠 High (lost progress history)
- **Mitigation**: Migrate unlock events as separate table with full history
- **Validation**: Count unlock events before/after migration

**Risk 4: Daily Limit Bypass After Migration**
- **Severity**: 🟡 Medium (XP farming exploit)
- **Mitigation**: Pre-aggregate daily summaries from transactions
- **Validation**: Test limit enforcement after migration

**Risk 5: Level-Up System Broken**
- **Severity**: 🔴 Critical (no level-up modals, broken progression)
- **Mitigation**: Migrate level-up history + verify calculation logic
- **Validation**: Manual testing of level-up flow

---

### 📝 MIGRATION COMPLETION CHECKLIST - SEKCE 2

**Pre-Migration** (Phase 2.1.1):
- [ ] All pending XP batches committed (pendingOperationsCount = 0)
- [ ] Background sync operations completed
- [ ] Full gamification backup created and verified
- [ ] Checksums calculated and documented

**Migration** (Phases 2.1.2 - 2.3.1):
- [ ] XP transactions migrated (count verified)
- [ ] Daily XP summaries pre-aggregated
- [ ] XP state migrated (total XP + level verified)
- [ ] Level-up history migrated (count verified)
- [ ] Achievement progress migrated (all achievements tracked)
- [ ] Achievement unlock events migrated (count verified)
- [ ] Achievement stats cache built
- [ ] XP multipliers migrated (active multipliers preserved)
- [ ] Loyalty state migrated (streaks preserved)
- [ ] Daily activity log built from transactions

**Post-Migration** (Phase 2.4.1):
- [ ] GamificationService refactored (batching removed)
- [ ] AchievementService refactored (SQLite queries)
- [ ] XPMultiplierService refactored
- [ ] LoyaltyService refactored
- [ ] All DeviceEventEmitter events still working

**Testing** (Phase 2.5.1):
- [ ] XP addition performance < 10ms
- [ ] Daily limit check performance < 5ms
- [ ] Achievement unlock performance < 10ms
- [ ] Level-up calculation accuracy verified
- [ ] No race conditions in rapid XP additions
- [ ] All manual test scenarios passing

**Validation**:
- [ ] All checksums match (XP sum, transaction count, achievement count)
- [ ] No data loss detected
- [ ] No XP calculation errors
- [ ] Performance improvements measured and documented

---

