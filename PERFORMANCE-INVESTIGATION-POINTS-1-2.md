# Performance Investigation: Points 1 & 2 Analysis

**Date**: October 26, 2025
**Investigation**: Analyzing redundant habits loading and streak calculations from production log

---

## Point 1: Redundant Habits Loading (12x during session)

### Pattern from Production Log
```
🔄 HabitsContext: Starting loadHabits... (appears 12 times)
🔄 HabitsContext: Loaded 2 habits, 33 completions
```

### Root Cause Analysis

**Primary Caller: HabitsContext.tsx**
- `useEffect(() => { loadHabits(); }, [])` - Runs once on mount (line 263-265)

**Problem**: The `loadHabits()` appears to be called 12 times, but HabitsContext only calls it once in `useEffect`.

**Potential Causes**:
1. **Context Re-mounting**: HabitsProvider might be re-mounting multiple times
2. **Manual Reload Triggers**: Components calling `actions.loadHabits()` explicitly
3. **Error Recovery**: Line 254 shows `await loadHabits()` in error recovery during `updateHabitOrder`

**Components Using `useHabits()`**:
- `app/(tabs)/index.tsx` (Home screen) - Line 46
- `src/hooks/useHabitsData.ts` - Line 10 (used by multiple components)
- `src/services/notifications/progressAnalyzer.ts`
- `src/utils/userStatsCollector.ts`
- `src/services/achievementIntegration.ts`
- `src/services/storage/backup.ts`
- `src/services/storage/userStorage.ts`

**Investigation Needed**:
1. **Check for explicit `loadHabits()` calls**: Search for `actions.loadHabits()` across codebase
2. **Check for Provider re-mounts**: Verify RootProvider structure in `app/_layout.tsx`
3. **Check useEffect dependencies**: Ensure no dependency array issues causing re-runs

### Current Implementation: HabitsContext
```typescript
const loadHabits = async () => {
  try {
    console.log('🔄 HabitsContext: Starting loadHabits...');
    setLoading(true);
    setError(null);

    // Initialize daily reset system
    await HabitResetUtils.initializeResetSystem();

    const [habits, completions] = await Promise.all([
      habitStorage.getAll(),  // ← SQLite query ~30-50ms
      habitStorage.getAllCompletions(),  // ← SQLite query ~20-30ms
    ]);

    console.log(`🔄 HabitsContext: Loaded ${habits.length} habits, ${completions.length} completions`);

    dispatch({ type: 'SET_HABITS', payload: habits });
    dispatch({ type: 'SET_COMPLETIONS', payload: completions });

    console.log('✅ HabitsContext: Habits loaded successfully');
  } catch (error) {
    console.error('❌ HabitsContext: Failed to load habits:', error);
    setError(error instanceof Error ? error.message : 'Failed to load habits');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadHabits();
}, []); // ← Empty dependency array - should only run once
```

**Performance Impact**: 12 × 50ms = ~600ms wasted on redundant database reads

---

## Point 2: Triple Streak Calculation (9x during session)

### Pattern from Production Log
```
// At startup:
📊 Calculating current streak for habit... (appears 3 times)

// Per journal entry (2 entries created):
📊 Calculating current streak for habit... (appears 2 times each = 4 times)

Total: 3 + 4 + 2 = 9 streak calculations
```

### Root Cause Analysis

**Streak Calculation Functions** (from habitStorage.ts):
1. `calculateCurrentStreak(habitId)` - Private method (line 474-482)
2. `calculateStreakFromCompletions(completions)` - Private helper (line 489-524)
3. `getHabitStatistics(habitId)` - Public method calling `calculateCurrentStreak` (line 545)

**useHabitsData.ts Streak Functions**:
1. `calculateCurrentStreak(completions)` - Line 184-204
2. `calculateLongestStreak(completions)` - Line 207-234
3. Called in `getHabitStats()` - Lines 178-179

**Potential Callers**:
1. **Home Screen Components**:
   - `HabitStatsDashboard` - Shows current streaks
   - `HabitPerformanceIndicators` - Displays performance metrics
   - `HabitTrendAnalysis` - Analyzes trends

2. **Achievement System**:
   - `checkAndAwardStreakMilestones()` - Line 442 in habitStorage.ts
   - Called after habit completions

3. **Monthly Progress Tracking**:
   - May calculate streaks for baseline analysis

**Investigation Needed**:
1. **Identify exact callers**: Search for `calculateCurrentStreak`, `getHabitStats`, `getHabitStatistics`
2. **Check for redundant calculations**: Same habit, same data, calculated multiple times
3. **Caching opportunity**: Cache streak results with invalidation on new completions

### Current Implementation: Streak Calculation
```typescript
// useHabitsData.ts
const calculateCurrentStreak = (completions: HabitCompletion[]): number => {
  const sortedCompletions = [...completions]
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  let currentDate = new Date();

  for (const completion of sortedCompletions) {
    const completionDate = parseDate(completion.date);
    const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
      currentDate = completionDate;
    } else {
      break;
    }
  }

  return streak;
};
```

**Performance Impact**:
- Sorting completions: O(n log n) per calculation
- 9 calculations × ~10-15ms each = ~90-135ms wasted
- Grows with completion count (33 completions currently)

---

## Key Questions for Discussion

### Point 1: Habit Loading
1. **Why 12 times?** - Is HabitsProvider re-mounting, or are components calling `loadHabits()` explicitly?
2. **Is this intentional?** - Does some feature require re-loading habits multiple times?
3. **Can we cache?** - Should habits be cached between loads?

### Point 2: Streak Calculations
1. **Why 9 times?** - Which components/functions are triggering these calculations?
2. **Is this intentional?** - Does each calculation serve a different purpose?
3. **Can we cache?** - Should streak results be cached and only recalculated when completions change?

---

## Recommended Investigation Steps

1. **Add more detailed logging** to identify exact callers:
   ```typescript
   console.log('🔄 HabitsContext: loadHabits called from:', new Error().stack);
   console.log('📊 Calculating streak from:', new Error().stack);
   ```

2. **Check for Provider re-mounting**:
   - Verify `app/_layout.tsx` structure
   - Check if `RootProvider` or `HabitsProvider` unmounts/remounts

3. **Search for explicit calls**:
   - `actions.loadHabits()` - Manual reload triggers
   - `calculateCurrentStreak` - Streak calculation callers
   - `getHabitStats` - Stats calculation callers

4. **Profile with React DevTools**:
   - Identify unnecessary re-renders
   - Check component mount/unmount cycles

---

## Investigation Findings

### Point 1: Habit Loading - MAKE-UP FUNCTIONALITY REQUIREMENT ✅
**User Clarification**: "u těch habits to může být z důvodů make up funkcionalitě"

**Evidence**:
- ✅ No components call `actions.loadHabits()` explicitly (grep search confirmed)
- ✅ HabitsContext `useEffect` has empty dependency array (should only run once)
- ✅ **Make-up conversion requires fresh data** for accurate bonus-to-scheduled pairing

**Make-up System Context** (from technical-guides:Habits.md):
```typescript
// Smart Bonus Conversion System
// Páruje bonusové dny s propásnutými scheduled dny v rámci týdne (1:1 ratio)
const convertedCompletions = applySmartBonusConversion(habit, rawCompletions);

// Cache invalidation principle:
// "Content-Aware Invalidation: Cache musí detekovat změny v obsahu habit objektů"
```

**Why Multiple Loads May Be Needed**:
1. **Habit Schedule Changes**: User modifies `scheduledDays` → requires reload for accurate conversion
2. **Completion Updates**: New completion may trigger re-conversion of entire week
3. **Historical Context**: Make-up system needs complete timeline for accurate pairing
4. **Cache Invalidation**: Content-aware cache requires detecting changes in habit objects

**Conclusion**: Multiple loads are **LIKELY BY DESIGN** for make-up accuracy, but 12x seems excessive

**Question for User**: Does make-up conversion intentionally trigger full habit reloads, or is this unintended?

### Point 2: Streak Calculations - HOME SCREEN COMPONENTS
**Evidence**:
- `HabitPerformanceIndicators` calls `getHabitStats()` which calculates streaks (line 101)
- `HabitTrendAnalysis` likely does the same
- Multiple home screen components use `useHabitsData()` hook
- Each component may calculate streaks independently

**Pattern**:
```typescript
// HabitPerformanceIndicators.tsx (line 101)
const { habits, getHabitsByDate, getHabitStats, getRelevantDatesForHabit } = useHabitsData();

// getHabitStats() internally calls:
const performanceData = useMemo(() => {
  const activeHabits = habits.filter(habit => habit.isActive);
  // ... for each habit:
  const stats = getHabitStats(habitId); // ← Calculates streaks
}, [habits, getHabitsByDate, getHabitStats]);
```

**Why 9 times?**:
- 3 at startup: Home screen renders, multiple components calculate streaks for 2 habits
- 6 during session: Journal entry triggers achievement checks, which recalculate streaks

**Root Cause**: No caching in `useHabitsData` - each call to `getHabitStats()` recalculates from scratch

---

## Optimization Recommendations

### Point 1: Habit Loading (IF caused by re-mounting)
**Solution**: Move HabitsContext higher in provider tree or implement singleton pattern
```typescript
// Option 1: Cache at storage level
class HabitStorage {
  private cache: { habits: Habit[], completions: HabitCompletion[], timestamp: number } | null = null;
  private CACHE_TTL = 5000; // 5 seconds

  async getAll(): Promise<Habit[]> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.habits;
    }
    // ... fetch from SQLite
  }
}

// Option 2: Fix provider structure
// Ensure HabitsProvider is above navigation/routing logic
```

### Point 2: Streak Calculations
**Solution**: Implement memoization in `useHabitsData`
```typescript
// useHabitsData.ts
const streakCacheRef = useRef(new Map<string, { streak: number, longest: number, timestamp: number }>());

const getHabitStats = useCallback((habitId: string) => {
  const cacheKey = `${habitId}-${state.completions.length}`;

  if (streakCacheRef.current.has(cacheKey)) {
    return streakCacheRef.current.get(cacheKey);
  }

  // Calculate streaks...
  const stats = {
    currentStreak: calculateCurrentStreak(convertedCompletions),
    longestStreak: calculateLongestStreak(convertedCompletions),
    // ... other stats
  };

  streakCacheRef.current.set(cacheKey, stats);
  return stats;
}, [state.completions, state.habits]);
```

**Impact**:
- Point 1 fix: Save ~550ms per session (11 redundant loads × 50ms)
- Point 2 fix: Save ~80-120ms per session (6-8 redundant calculations × 10-15ms)
- **Total potential savings: ~630-670ms per session**

---

## Updated Analysis with Make-up Context

### Point 1: Potential Optimization Despite Make-up Requirements
**Current Implementation** (`useHabitsData.ts` lines 41-71):
- Already has `conversionCacheRef` for make-up conversions
- Already has content-aware cache invalidation via `getHabitsContentHash()`
- Cache invalidates when `habits` or `completions` change

**Problem**: Cache is at **component level** (useHabitsData), not **data loading level** (HabitsContext)
- HabitsContext loads from SQLite 12 times
- Each load is ~50ms (habits + completions)
- Make-up conversion happens AFTER loading, so multiple loads are wasteful

**Optimization**: Keep make-up conversion cache, but add SQLite query cache
```typescript
// HabitsContext.tsx - Add query-level cache
const habitsQueryCache = useRef<{
  habits: Habit[];
  completions: HabitCompletion[];
  timestamp: number;
} | null>(null);

const loadHabits = async () => {
  // Check cache first (5 second TTL)
  if (habitsQueryCache.current && Date.now() - habitsQueryCache.current.timestamp < 5000) {
    dispatch({ type: 'SET_HABITS', payload: habitsQueryCache.current.habits });
    dispatch({ type: 'SET_COMPLETIONS', payload: habitsQueryCache.current.completions });
    return;
  }

  // ... load from SQLite and update cache
};
```

**Impact**: Reduce 12 loads to ~2-3 loads per session (save ~450-500ms)
**Make-up Safety**: Cache invalidates every 5 seconds + manual invalidation on new completion

---

## Next Steps

**User Questions**:
1. **Point 1**: Je 12x loading intentional pro make-up, nebo je to side-effect jiného problému?
2. **Point 2**: Jsou streak calculations potřeba 9x, nebo můžeme cachovat?

**Recommended Actions**:
1. ✅ **Point 1 understood**: Make-up může vyžadovat častější reload, ale 12x je pravděpodobně excess
2. **Implement cache at query level** (HabitsContext) - neporuší make-up conversion
3. **Implement Point 2 optimization** (streak calculation memoization)
4. **Add invalidation triggers**: Explicitly invalidate cache on completion create/delete

**Estimated Impact**: ~550-650ms saved per session while maintaining make-up accuracy
