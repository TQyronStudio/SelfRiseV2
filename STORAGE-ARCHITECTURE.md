# 🗄️ STORAGE ARCHITECTURE - Post-Migration Reference

**Purpose**: Centrální technická dokumentace - kde je co uložené a proč

**Last Updated**: 2025-01-12 (post SQLite migration)

**Quick Reference**: Pokud implementuješ novou feature, podívej se sem aby jsi věděl jestli použít AsyncStorage nebo SQLite.

---

## 📊 STORAGE OVERVIEW

```
SelfRise Application Storage Strategy
├── SQLite Database (user-generated data, relationships, queries)
│   ├── Core Data (journal, habits, goals)
│   ├── Gamification (XP, achievements, loyalty)
│   └── Monthly Challenges (tracking, lifecycle)
│
└── AsyncStorage (configuration, preferences, flags)
    ├── User Preferences
    ├── Notifications
    ├── Tutorial State
    └── Feature Flags
```

---

## 🗂️ COMPLETE FILE-BY-FILE REFERENCE

### 📝 JOURNAL & GRATITUDE

**Files**: `src/services/storage/gratitudeStorage.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `journal_entries` - All gratitude + self-praise entries
- `streak_state` - Current streak, frozen days, warm-up payments

**Why SQLite?**
- Race conditions with AsyncStorage (8+ entries → UI freeze)
- Time-series data (entries by date)
- Complex streak calculations need ACID transactions

**Key Operations**:
```typescript
// Example queries you'll write:
await db.getAllAsync('SELECT * FROM journal_entries WHERE date = ?', [today()]);
await db.runAsync('INSERT INTO journal_entries VALUES (?, ?, ?, ...)', [...]);
await db.getFirstAsync('SELECT * FROM streak_state WHERE id = 1');
```

**Migration Status**: ✅ MIGRATED (Phase 1.1.x)

---

### 🎯 HABITS

**Files**: `src/services/storage/habitStorage.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `habits` - Habit definitions
- `habit_completions` - Completion history (time-series)
- `habit_schedules` - Scheduling rules (days of week, frequency)

**Why SQLite?**
- Many-to-many relationships (habit → completions)
- Query patterns (get today's habits, filter by schedule)
- Completion history grows unbounded

**Key Operations**:
```typescript
// Typical queries:
await db.getAllAsync('SELECT * FROM habits WHERE archived = 0');
await db.getAllAsync(`
  SELECT h.*, COUNT(c.id) as completion_count
  FROM habits h
  LEFT JOIN habit_completions c ON h.id = c.habit_id
  WHERE c.date >= ?
  GROUP BY h.id
`, [startDate]);
```

**Migration Status**: ✅ MIGRATED (Phase 1.2.x)

---

### 🏆 GOALS

**Files**: `src/services/storage/goalStorage.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `goals` - Goal definitions
- `goal_milestones` - Milestone tracking
- `goal_progress` - Progress history

**Why SQLite?**
- Parent-child relationships (goals → milestones)
- Progress tracking over time
- Complex queries (completed goals, by category, etc.)

**Key Operations**:
```typescript
// Typical usage:
await db.getAllAsync('SELECT * FROM goals WHERE status = ?', ['active']);
await db.getAllAsync('SELECT * FROM goal_milestones WHERE goal_id = ?', [goalId]);
```

**Migration Status**: ✅ MIGRATED (Phase 1.3.x)

---

### 🎮 GAMIFICATION - XP SYSTEM

**Files**: `src/services/gamificationService.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `xp_transactions` - All XP transactions (time-series)
- `xp_daily_summary` - Pre-aggregated daily XP (performance)
- `xp_state` - Current total XP + level (singleton)
- `level_up_history` - Level-up events

**Why SQLite?**
- High write frequency (every habit/journal/goal action)
- Daily XP limits need fast queries
- Transaction history for analytics
- **Critical**: Removed batching system (SQLite is 16x faster)

**Key Operations**:
```typescript
// Direct XP operations (no batching!):
await db.runAsync('INSERT INTO xp_transactions VALUES (?, ?, ?, ...)', [...]);
await db.runAsync('UPDATE xp_state SET total_xp = total_xp + ? WHERE id = 1', [amount]);
await db.getFirstAsync('SELECT * FROM xp_daily_summary WHERE date = ?', [today()]);
```

**⚠️ IMPORTANT**: Batching system REMOVED - každý XP write je okamžitý!

**Migration Status**: ✅ MIGRATED (Phase 2.1.x)

---

### 🏅 ACHIEVEMENTS

**Files**: `src/services/achievementStorage.ts`, `src/services/achievementService.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `achievement_progress` - Current progress for all achievements
- `achievement_unlock_events` - Unlock history
- `achievement_stats_cache` - Pre-aggregated statistics

**Why SQLite?**
- Progress tracking across many achievements
- Unlock events are historical data
- Query patterns (by category, by rarity, etc.)

**Key Operations**:
```typescript
// Typical usage:
await db.getAllAsync('SELECT * FROM achievement_progress WHERE unlocked = 1');
await db.runAsync('UPDATE achievement_progress SET current_value = ? WHERE achievement_id = ?', [value, id]);
```

**Migration Status**: ✅ MIGRATED (Phase 2.2.x)

---

### 💎 LOYALTY & MULTIPLIERS

**Files**: `src/services/loyaltyService.ts`, `src/services/xpMultiplierService.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `loyalty_state` - Total active days, streaks (singleton)
- `xp_multipliers` - Active multipliers
- `daily_activity_log` - Daily activity tracking for harmony streak

**Why SQLite?**
- Loyalty data grows over time
- Multipliers have expiration logic
- Harmony streak needs multi-day queries

**Key Operations**:
```typescript
// Typical usage:
await db.getFirstAsync('SELECT * FROM loyalty_state WHERE id = 1');
await db.getAllAsync('SELECT * FROM xp_multipliers WHERE is_active = 1');
await db.getAllAsync('SELECT * FROM daily_activity_log WHERE date >= ? ORDER BY date DESC', [date]);
```

**Migration Status**: ✅ MIGRATED (Phase 2.3.x)

---

### 📅 MONTHLY CHALLENGES

**Files**:
- `src/services/monthlyChallengeService.ts`
- `src/services/monthlyChallengeLifecycleManager.ts`
- `src/services/monthlyProgressTracker.ts`

**Storage**: ✅ **SQLite**

**Tables Used**:
- `monthly_challenges` - Challenge definitions
- `challenge_requirements` - Challenge requirements (1:many)
- `challenge_daily_snapshots` - Daily progress snapshots
- `challenge_weekly_breakdown` - Weekly aggregations
- `challenge_lifecycle_state` - Lifecycle state machine
- `challenge_state_history` - Audit log
- `challenge_previews` - Next month previews
- `user_challenge_ratings` - Historical performance
- `challenge_completion_history` - Archived challenges

**Why SQLite?**
- Complex relationships (challenge → requirements → snapshots)
- Time-series data (daily snapshots)
- Lifecycle state machine needs ACID
- Weekly aggregations (5 reads → 1 JOIN query = 15x faster)

**Key Operations**:
```typescript
// Get active challenge with all data:
const challenge = await db.getFirstAsync('SELECT * FROM monthly_challenges WHERE status = ?', ['active']);
const requirements = await db.getAllAsync('SELECT * FROM challenge_requirements WHERE challenge_id = ?', [challenge.id]);
const snapshots = await db.getAllAsync('SELECT * FROM challenge_daily_snapshots WHERE challenge_id = ?', [challenge.id]);

// Weekly breakdown (single query instead of 5 AsyncStorage reads):
const weeks = await db.getAllAsync('SELECT * FROM challenge_weekly_breakdown WHERE challenge_id = ? ORDER BY week_number', [challengeId]);
```

**Migration Status**: ✅ MIGRATED (Phase 3.x)

---

### ⚙️ USER PREFERENCES

**Files**: `src/services/storage/homePreferencesStorage.ts`

**Storage**: ❌ **AsyncStorage** (NO MIGRATION)

**Keys Used**:
- `@home_preferences` - Home screen layout customization
- `user_theme_preference` - 'light' | 'dark' | 'auto'
- `user_language` - 'en' | 'de' | 'es'

**Why AsyncStorage?**
- Simple key-value pairs
- Read once on app startup (before SQLite init)
- No relationships needed
- Small data size (<5KB)

**Key Operations**:
```typescript
// Typical usage:
const theme = await AsyncStorage.getItem('user_theme_preference');
await AsyncStorage.setItem('user_theme_preference', 'dark');

const prefs = await AsyncStorage.getItem('@home_preferences');
const parsed = JSON.parse(prefs || '{}');
```

**Migration Status**: ❌ STAYS ON ASYNCSTORAGE

---

### 🔔 NOTIFICATIONS

**Files**: `src/services/notificationService.ts` (future)

**Storage**: ❌ **AsyncStorage** (NO MIGRATION)

**Keys Used**:
- `notification_settings` - Notification preferences
- `push_notification_token` - FCM/APNS token
- `notification_permissions` - Permission status

**Why AsyncStorage?**
- Updated infrequently
- Small data (<2KB)
- No queries needed
- Security (tokens separate from user data)

**Key Operations**:
```typescript
// Typical usage:
const settings = await AsyncStorage.getItem('notification_settings');
await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
```

**Migration Status**: ❌ STAYS ON ASYNCSTORAGE

---

### 🎓 TUTORIAL & ONBOARDING

**Files**: `src/contexts/TutorialContext.tsx`

**Storage**: ❌ **AsyncStorage** (NO MIGRATION)

**Keys Used**:
- `onboarding_tutorial_completed` - boolean
- `tutorial_current_step` - number
- `tutorial_session` - Session data
- `tutorial_crash_log` - Error recovery
- `feature_discovery_flags` - Feature hints shown

**Why AsyncStorage?**
- Boolean flags (simplest data)
- Read once, write once pattern
- No relationships
- Perfect for feature flags

**Key Operations**:
```typescript
// Typical usage:
const completed = await AsyncStorage.getItem('onboarding_tutorial_completed');
await AsyncStorage.setItem('onboarding_tutorial_completed', 'true');
```

**Migration Status**: ❌ STAYS ON ASYNCSTORAGE

---

### 🚩 FEATURE FLAGS

**Files**: `src/config/featureFlags.ts` (future)

**Storage**: ❌ **AsyncStorage** (NO MIGRATION)

**Keys Used**:
- `feature_flags` - Feature toggles
- `experimental_features` - Beta features
- `app_version` - Current version
- `analytics_enabled` - Analytics opt-in

**Why AsyncStorage?**
- Developer-controlled (not user data)
- Simple booleans
- Changed rarely
- Fast startup reads

**Key Operations**:
```typescript
// Typical usage:
const flags = await AsyncStorage.getItem('feature_flags');
const parsed = JSON.parse(flags || '{}');
if (parsed.enableMonthlyChallenges) { ... }
```

**Migration Status**: ❌ STAYS ON ASYNCSTORAGE

---

## 🎯 DECISION TREE: Which Storage to Use?

When implementing a NEW feature, use this flowchart:

```
Is it user-generated data that grows over time?
├─ YES → Does it need relationships/queries?
│  ├─ YES → Use SQLite ✅
│  └─ NO → Does it grow unbounded?
│     ├─ YES → Use SQLite ✅
│     └─ NO → Maybe AsyncStorage (if < 100 records)
│
└─ NO → Is it a preference/flag/setting?
   ├─ YES → Use AsyncStorage ❌
   └─ NO → Is it < 10KB and simple key-value?
      ├─ YES → Use AsyncStorage ❌
      └─ NO → Use SQLite ✅
```

**Examples:**
- ❓ New "Daily Mood Tracker" feature → **SQLite** (time-series, queries)
- ❓ New "Dark mode auto-schedule" setting → **AsyncStorage** (simple preference)
- ❓ New "Custom habit categories" → **SQLite** (relationships with habits)
- ❓ New "Show/hide UI element" toggle → **AsyncStorage** (boolean flag)

---

## 📋 QUICK REFERENCE TABLE

| Feature | Files | Storage | Tables/Keys | Why |
|---------|-------|---------|-------------|-----|
| **Journal** | gratitudeStorage.ts | SQLite | journal_entries, streak_state | Race conditions, time-series |
| **Habits** | habitStorage.ts | SQLite | habits, habit_completions, habit_schedules | Relationships, queries |
| **Goals** | goalStorage.ts | SQLite | goals, goal_milestones, goal_progress | Relationships, progress tracking |
| **XP System** | gamificationService.ts | SQLite | xp_transactions, xp_state, xp_daily_summary | High frequency, transactions |
| **Achievements** | achievementStorage.ts | SQLite | achievement_progress, achievement_unlock_events | Progress tracking, history |
| **Loyalty** | loyaltyService.ts | SQLite | loyalty_state, daily_activity_log | Growing data, queries |
| **Multipliers** | xpMultiplierService.ts | SQLite | xp_multipliers | Active/expired queries |
| **Challenges** | monthlyChallengeService.ts | SQLite | 9 tables (see above) | Complex relationships |
| **Preferences** | homePreferencesStorage.ts | AsyncStorage | @home_preferences, user_theme, etc. | Simple KV, startup |
| **Notifications** | notificationService.ts | AsyncStorage | notification_settings, tokens | Small, infrequent |
| **Tutorial** | TutorialContext.tsx | AsyncStorage | tutorial_completed, flags | Boolean flags |
| **Feature Flags** | featureFlags.ts | AsyncStorage | feature_flags, app_version | Dev-controlled |

---

## 🔧 IMPLEMENTATION PATTERNS

### Pattern 1: SQLite Read (Simple)
```typescript
// Get single record
const habit = await db.getFirstAsync<Habit>(
  'SELECT * FROM habits WHERE id = ?',
  [habitId]
);

// Get multiple records
const todayHabits = await db.getAllAsync<Habit>(
  'SELECT * FROM habits WHERE archived = 0'
);
```

### Pattern 2: SQLite Write (Transaction)
```typescript
// Always use transactions for consistency
await db.withTransactionAsync(async () => {
  // Insert
  await db.runAsync(
    'INSERT INTO habits VALUES (?, ?, ?, ...)',
    [id, name, category, ...]
  );

  // Update related data
  await db.runAsync(
    'UPDATE xp_state SET total_xp = total_xp + ? WHERE id = 1',
    [xpReward]
  );

  // If anything fails → automatic ROLLBACK
});
```

### Pattern 3: AsyncStorage Read/Write
```typescript
// Simple get/set
const theme = await AsyncStorage.getItem('user_theme_preference');
await AsyncStorage.setItem('user_theme_preference', 'dark');

// JSON objects
const settings = await AsyncStorage.getItem('notification_settings');
const parsed = settings ? JSON.parse(settings) : DEFAULT_SETTINGS;
await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
```

### Pattern 4: SQLite with Relations (JOIN)
```typescript
// Get habit with completions
const habitWithCompletions = await db.getAllAsync(`
  SELECT
    h.*,
    c.date as completion_date,
    c.bonus as completion_bonus
  FROM habits h
  LEFT JOIN habit_completions c ON h.id = c.habit_id
  WHERE h.id = ? AND c.date >= ?
  ORDER BY c.date DESC
`, [habitId, startDate]);
```

---

## 🚨 COMMON MISTAKES TO AVOID

### ❌ DON'T: Use AsyncStorage for growing arrays
```typescript
// BAD - will cause race conditions with 100+ entries
const entries = await AsyncStorage.getItem('my_entries');
const parsed = JSON.parse(entries || '[]');
parsed.push(newEntry);
await AsyncStorage.setItem('my_entries', JSON.stringify(parsed));
```

### ✅ DO: Use SQLite for growing data
```typescript
// GOOD - no race conditions, fast
await db.runAsync(
  'INSERT INTO my_entries VALUES (?, ?, ?)',
  [id, data, timestamp]
);
```

### ❌ DON'T: Use SQLite for simple flags
```typescript
// BAD - unnecessary complexity
await db.runAsync('INSERT INTO settings VALUES (?, ?)', ['theme', 'dark']);
```

### ✅ DO: Use AsyncStorage for simple flags
```typescript
// GOOD - simple and fast
await AsyncStorage.setItem('user_theme', 'dark');
```

### ❌ DON'T: Forget transactions in SQLite
```typescript
// BAD - partial writes possible
await db.runAsync('INSERT INTO habits ...');
await db.runAsync('INSERT INTO habit_schedules ...'); // If this fails, habit is orphaned!
```

### ✅ DO: Use transactions for multi-step operations
```typescript
// GOOD - atomic operations
await db.withTransactionAsync(async () => {
  await db.runAsync('INSERT INTO habits ...');
  await db.runAsync('INSERT INTO habit_schedules ...');
  // Both succeed or both fail
});
```

---

## 📚 RELATED DOCUMENTATION

- **Migration Guides**:
  - [SEKCE 1: Core Data Migration](./sqlite-migration-phase1-core.md) - Journal, Habits, Goals
  - [SEKCE 2: Gamification Migration](./sqlite-migration-phase2-gamification.md) - XP, Achievements, Loyalty
  - [SEKCE 3: Monthly Challenges Migration](./sqlite-migration-phase3-features.md) - Challenge system
  - [SEKCE 4: Configuration Layer](./sqlite-migration-phase4-config.md) - What stays on AsyncStorage

- **Technical Guides**:
  - [technical-guides.md](./technical-guides.md) - Coding standards, patterns
  - [projectplan.md](./projectplan.md) - Overall project plan

---

## 🎯 TLDR FOR NEW DEVELOPERS

**Adding new feature? Ask yourself:**

1. **Is it user-generated data?** → SQLite
2. **Does it grow over time?** → SQLite
3. **Does it need queries/relationships?** → SQLite
4. **Is it a simple setting/flag?** → AsyncStorage
5. **Is it < 10KB and rarely changes?** → AsyncStorage

**When in doubt:** Check this document or ask "Would this data benefit from SQL queries?" If yes → SQLite.

---

**Last Updated**: 2025-01-12
**Maintained By**: SelfRise Development Team
**Questions?** Check migration docs or create GitHub issue

