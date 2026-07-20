# 🎯 SelfRise V2 - Habits System Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **Smart Bonus Conversion** - jak bonusové dny napravují propásnuté návyky
- **XP Integration** - přesné hodnoty XP odměn a gamifikace
- **Completion Rate Calculation** - unified algoritmus pro výpočet úspěšnosti
- **Performance Optimization** - cache systém a Android optimalizace
- **UI Components** - statistiky, kalendáře a grafy návyků

**🔧 KDY TOHLE POUŽÍVAT:**
- Implementuješ nové funkce v Habits systému
- Upravuješ logiku completion rate nebo streak výpočtů
- Řešíš problémy s performance u návyků
- Implementuješ nové UI komponenty pro habits
- Upravuješ Smart Bonus Conversion logiku

---

## Habits System Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Habits system respektuje creation date a time context ve všech výpočtech. Nikdy nepočítá s dny před vytvořením návyku.**

### 🚨 SCHEDULED DAYS IMMUTABILITY PRINCIPLE
**"MINULOST SE NEMĚNÍ" - Změny v scheduled days se aplikují pouze od dne změny dále, nikdy zpětně.**

#### Historical Data Preservation Rules

**Fundamental Rule**: Jakákoliv změna v `habit.scheduledDays` ovlivňuje pouze budoucí dny od okamžiku změny. Veškerá historická data, výpočty a UI zobrazení zůstávají v původním stavu.

**Datová vrstva (od 2026-07-19, super audit N-4.1)**: `SQLiteHabitStorage`
při změně rozvrhu zapisuje do tabulky `habit_schedule_history` — při PRVNÍ
změně navíc zapíše i PŮVODNÍ rozvrh s platností od vytvoření návyku (druhá
změna v tentýž den denní záznam přepíše, datumy se nedublují; datum změny je
LOKÁLNÍ přes `formatDateToString`). `getAll()`/`getById()` timeline načítají
a připojují jako `habit.scheduleHistory` — bez toho by celý immutability
systém běžel ve fallbacku na aktuální rozvrh (přesně to byl nález N-4.1).
End-to-end kryto testy `sqliteHabitStorage.scheduleHistory.test.ts`.

**Remove Scheduled Day Principle:**
```typescript
// Example: Odebírám pondělí ze scheduled days ve středu
// ✅ CORRECT: Všechny pondělky v minulosti zůstávají scheduled days
// ✅ CORRECT: Červená pole za minulé pondělky zůstávají červená
// ✅ CORRECT: Zelené completions za minulé pondělky zůstávají zelené
// ✅ CORRECT: Smart Bonus Conversions zůstávají zmražené v původním stavu
// ✅ CORRECT: Completion rate procenta reflektují historical schedule
```

**Add Scheduled Day Principle:**
```typescript
// Example: Přidávám sobotu do scheduled days ve středu
// ✅ CORRECT: Sobota se stává scheduled day od této soboty dále
// ✅ CORRECT: Minulé soboty zůstávají non-scheduled (bonus days)
// ✅ CORRECT: Completion rate počítá sobotu jako scheduled jen pro budoucnost
```

#### Completion Rate Calculation Principle

**Time-Segmented Approach**: Completion rate respektuje kdy byly které dny scheduled, ne současný stav `habit.scheduledDays`.

```typescript
// ✅ CORRECT: Počítá completion rate s historical schedule awareness
function calculateCompletionRate(habit: Habit, completions: HabitCompletion[]): number {
  // Pro každý completion se používá schedule platný v ten den
  // Ne současný habit.scheduledDays
}

// ❌ WRONG: Používá současný habit.scheduledDays pro všechnu historii
function calculateCompletionRate(habit: Habit, completions: HabitCompletion[]): number {
  const scheduledDaysCount = habit.scheduledDays.length; // Zpětné přepočítávání!
}
```

#### Smart Bonus Conversion Immutability

**Conversion State Freezing**: Bonus conversions se počítají v okamžiku jejich vzniku a následně se nemění.

```typescript
// ✅ PRINCIPLE: Conversion remains immutable
// Bonus completion z úterý which covered missed pondělí:
// - Zůstává green (makeup completion) i když odeberu pondělí ze scheduled
// - Nevrací se na gold (bonus) status
// - Zachovává historical context kdy byla conversion vytvořena
```

#### Cache Invalidation Principle

**Reference-Based Invalidation** (od 2026-07-19, super audit N-4.7): Reducer
v HabitsContext nahrazuje pole `habits`/`completions` NOVOU instancí při každé
mutaci — porovnání referencí je proto přesný a O(1) detektor jakékoliv změny
(včetně editace obsahu). Navíc se cache invaliduje při změně kalendářního dne,
protože výsledek konverze závisí na "dnešku".

```typescript
// ✅ CORRECT: reference + day comparison (skutečná implementace v useHabitsData)
if (state.habits !== lastHabitsRef.current ||
    state.completions !== lastCompletionsRef.current ||
    todayStr !== lastDayRef.current) {
  conversionCacheRef.current.clear();
}

// ❌ WRONG: count-based hash — výměna completion (smazat + přidat jiný den)
// vrátí délku na původní hodnotu a cache se neinvaliduje
const cacheKey = `${habits.length}-${completions.length}`;
```

### Core Data Models
```typescript
// Core Habit Entity
interface Habit extends BaseEntity {
  name: string;
  color: HabitColor;
  icon: HabitIcon;
  scheduledDays: DayOfWeek[];        // Kdy má být habit vykonáván (pondělí-neděle)
  isActive: boolean;                 // Aktivní/neaktivní stav
  description?: string;
  order: number;                     // Pořadí v UI pro custom sorting
}

// Habit Completion Record
interface HabitCompletion extends BaseEntity {
  habitId: string;
  date: DateString;                  // YYYY-MM-DD formát
  completed: boolean;
  isBonus: boolean;                  // true = completed on non-scheduled day
  completedAt?: Date;                // timestamp completion
  note?: string;

  // Smart Bonus Conversion fields
  isConverted?: boolean;             // true = bonus converted to makeup completion
  convertedFromDate?: DateString;    // original missed date this covers
  convertedToDate?: DateString;      // bonus date that was converted
  isCovered?: boolean;               // true = missed day covered by makeup
}

// Generated Statistics
interface HabitStats {
  habitId: string;
  currentStreak: number;             // consecutive days with completions
  longestStreak: number;             // best streak ever achieved
  totalCompletions: number;          // all completed days
  completionRate: number;            // percentage with bonus calculation (unlimited)
  lastCompletedDate?: DateString;
}
```

---

## XP Integration & Rewards

### Habit XP Values
```typescript
// Scheduled vs Bonus Completion XP
XPSourceType.HABIT_COMPLETION: 25 XP    // Scheduled day completion
XPSourceType.HABIT_BONUS: 15 XP         // Non-scheduled day completion

// XP is awarded immediately in HabitStorage operations:
await habitStorage.createCompletion(habitId, date, isBonus)
// → Automatically calls GamificationService.addXP() with appropriate amount

// XP is subtracted on deletion:
await habitStorage.deleteCompletion(id)
// → Automatically calls GamificationService.subtractXP() with original amount
```

### Habit Deletion & XP (rozhodnutí Petra, 2026-07-19 — super audit N-4.5)
```typescript
// Smazání celého NÁVYKU (habitStorage.delete):
// - návyk se soft-deletne (is_archived = 1),
// - všechny jeho completions se HARD-smažou (deleteCompletionsByHabitId),
// - XP se NEVRACÍ — veškeré XP vydělané historií návyku uživateli zůstává.
//
// Důvod: smazání návyku nesmí vzít měsíce poctivě vydělaného XP.
// Toto je ZÁMĚRNÉ chování, ne bug. (subtractXP se volá jen při smazání
// JEDNOTLIVÉHO completion, tj. při odškrtnutí.)
```

### Streak Milestone XP (FUTURE FEATURE)
```typescript
// Planned automatic streak milestone rewards
7 days: 75 XP    (XPSourceType.HABIT_STREAK_MILESTONE)
14 days: 100 XP
30 days: 150 XP
50 days: 200 XP
100 days: 300 XP

// TODO: Implement in habitStorage.checkAndAwardStreakMilestones()
```

---

## Smart Bonus Conversion System

### 🚨 CORE ALGORITHM
**Inteligentní systém který páruje bonusové dny s propásnutými scheduled dny v rámci týdne (1:1 ratio).**

### Conversion Logic Steps
```typescript
// 1. WEEKLY GROUPING: Group completions by Monday-Sunday weeks
const weeklyCompletions = groupCompletionsByWeek(completions);

// 2. WEEKLY ANALYSIS: For each week, identify:
const missedScheduledDays = []; // scheduled days without completion
const bonusCompletions = [];   // completed non-scheduled days
const scheduledCompletions = []; // completed scheduled days

// 3. CHRONOLOGICAL PAIRING: Pair missed + bonus chronologically
// ⚠️ Jen MINULÉ dny (date < today) se počítají jako zmeškané pro párování —
// dnešek ještě běží a bonus se nesmí "spotřebovat" na den, který uživatel
// může ještě splnit (rozhodnutí Petra 2026-07-19, super audit N-4.2).
const sortedMissed = missedScheduledDays.sort(); // oldest first
const sortedBonuses = bonusCompletions.sort((a, b) => a.date.localeCompare(b.date));

// 4. CONVERSION APPLICATION: Transform 1:1 pairs
const pairCount = Math.min(sortedMissed.length, sortedBonuses.length);
for (let i = 0; i < pairCount; i++) {
  // Convert bonus completion to makeup completion
  bonusCompletion.isBonus = false;
  bonusCompletion.isConverted = true;
  bonusCompletion.convertedFromDate = missedDate;

  // Mark missed day as covered
  missedCompletion.isCovered = true;
}
```

### Conversion Examples
```typescript
// Example 1: Perfect conversion
Schedule: Mon, Wed, Fri
Completions: Tue (bonus), Wed (scheduled), Thu (bonus)
Missed: Mon, Fri

Conversion Result:
- Tue bonus → covers Mon (makeup completion)
- Thu bonus → covers Fri (makeup completion)
- Wed scheduled → remains unchanged
Final: 3/3 scheduled days completed via conversion

// Example 2: Partial conversion
Schedule: Mon, Tue, Wed, Thu, Fri (daily habit)
Completions: Sat (bonus), Sun (bonus)
Missed: Mon, Tue, Wed, Thu, Fri

Conversion Result:
- Sat bonus → covers Mon (makeup completion)
- Sun bonus → covers Tue (makeup completion)
- Wed, Thu, Fri → remain as missed (no bonus to cover)
Final: 2/5 scheduled days completed via conversion
```

### UI Display Rules
```typescript
// Calendar/Chart Color Coding after conversion:
Green: Scheduled completion OR makeup completion (isConverted = true)
Gold: Real bonus (isBonus = true, isConverted = false)
Red: Missed scheduled day (no conversion available)
Blue dot: Covered missed day (isCovered = true) - shows underlying schedule
```

---

## Completion Rate Calculation

### 🚨 UNIFIED ALGORITHM
**Single unified approach used across ALL components for consistent results.**

### Simple Intuitive Formula
```typescript
function calculateHabitCompletionRate(habit: Habit, completionData: HabitCompletionData) {
  // SIMPLE INTUITIVE SYSTEM: All completions / scheduled days
  // This includes: scheduled completions + make-up completions + bonus completions
  //
  // IMMUTABILITY PRINCIPLE "MINULOST SE NEMĚNÍ":
  // Input data (scheduledDays, completedScheduled, bonusCompletions) MUST be calculated
  // with historical timeline awareness using wasScheduledOnDate() and Smart Bonus Conversion.
  // This function only does the final math - historical accuracy is preserved in data layer.

  const totalCompletions = completedScheduled + bonusCompletions;
  const totalCompletionRate = scheduledDays > 0 ? (totalCompletions / scheduledDays) * 100 : 0;

  // Calculate individual components for display purposes
  const scheduledRate = scheduledDays > 0 ? (completedScheduled / scheduledDays) * 100 : 0;
  const bonusRate = scheduledDays > 0 ? (bonusCompletions / scheduledDays) * 100 : 0;

  return {
    scheduledRate: Math.round(scheduledRate * 10) / 10,
    bonusRate: Math.round(bonusRate * 10) / 10,
    totalCompletionRate: Math.round(totalCompletionRate * 10) / 10,
    isMaxedOut: totalCompletionRate > 120
  };
}
```

### Simple Calculation Examples
```typescript
// Example 1: Perfect performance with bonus
Scheduled days: 20
Completed scheduled (including make-up): 20
Bonus completions: 3
Result: (20 + 3) / 20 × 100 = 115%

// Example 2: Good performance with some missed days
Scheduled days: 23
Completed scheduled (including make-up): 17
Bonus completions: 4
Result: (17 + 4) / 23 × 100 = 91.3%

// Example 3: Perfect scheduled, no bonus
Scheduled days: 15
Completed scheduled: 15
Bonus completions: 0
Result: (15 + 0) / 15 × 100 = 100%

// Key principle: 100% = perfect adherence, over 100% = exceptional effort
```

---

## Streak Tracking System

### Current Streak Calculation
```typescript
// Counts consecutive days backwards from today
function calculateCurrentStreak(completions: HabitCompletion[]): number {
  const sortedCompletions = completions
    .filter(c => c.completed)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  let streak = 0;
  let currentDate = today();

  // Count backwards day by day
  while (true) {
    const hasCompletion = sortedCompletions.some(c => c.date === currentDate);

    if (hasCompletion) {
      streak++;
      currentDate = previousDay(currentDate);
    } else {
      break; // Streak broken
    }
  }

  return streak;
}
```

### Longest Streak Calculation
```typescript
// Finds the longest consecutive sequence in history
function calculateLongestStreak(completions: HabitCompletion[]): number {
  const sortedDates = completions
    .filter(c => c.completed)
    .map(c => c.date)
    .sort()
    .filter((date, index, array) => array.indexOf(date) === index); // remove duplicates

  let longestStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currentDate = new Date(sortedDates[i]);
    const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++; // consecutive day
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1; // reset streak
    }
  }

  return Math.max(longestStreak, currentStreak);
}
```

---

## Performance Optimization

### 🚨 ANDROID CACHE SYSTEM
**Essential optimization for smooth Android performance with large datasets.**

### Cache Implementation
```typescript
// Stable cache that doesn't invalidate on every render (useHabitsData.ts)
const conversionCacheRef = useRef(new Map<string, HabitCompletion[]>());
const lastHabitsRef = useRef<Habit[] | null>(null);
const lastCompletionsRef = useRef<HabitCompletion[] | null>(null);
const lastDayRef = useRef('');

function getHabitCompletionsWithConversion(habitId: string): HabitCompletion[] {
  // Invalidation by reference + calendar day (viz Cache Invalidation Principle)
  const todayStr = formatDateToString(new Date());
  if (state.habits !== lastHabitsRef.current ||
      state.completions !== lastCompletionsRef.current ||
      todayStr !== lastDayRef.current) {
    conversionCacheRef.current.clear();
    lastHabitsRef.current = state.habits;
    lastCompletionsRef.current = state.completions;
    lastDayRef.current = todayStr;
  }

  // Return cached result if available
  if (conversionCacheRef.current.has(habitId)) {
    return conversionCacheRef.current.get(habitId)!;
  }

  // Compute and cache conversion
  const convertedCompletions = applySmartBonusConversion(habit, rawCompletions);
  conversionCacheRef.current.set(habitId, convertedCompletions);

  return convertedCompletions;
}
```

### Performance Requirements
```typescript
// Performance benchmarks for smooth operation:
Cache hit rate: >95% for Android scroll performance
Conversion calculation: <50ms per habit
UI render time: <16.67ms (60fps guarantee)
Memory usage: <10MB for 1000+ completions
```

---

## Habit Age-Aware Messaging

### 🚨 CONTEXTUAL USER FEEDBACK
**Different messaging strategy based on habit maturity to provide appropriate encouragement.**

### Age Categories & Messaging
```typescript
// Age calculation respects creation date
function getHabitAgeInfo(habit: Habit): HabitAgeInfo {
  const createdAt = habit.createdAt instanceof Date ? habit.createdAt : new Date(habit.createdAt);
  const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    daysSinceCreation,
    isNewHabit: daysSinceCreation < 7,        // 0-6 days
    isEarlyHabit: daysSinceCreation >= 7 && daysSinceCreation < 14,  // 7-13 days
    isEstablishedHabit: daysSinceCreation >= 14,  // 14+ days
    canShowTrends: daysSinceCreation >= 7,
    canShowPerformance: daysSinceCreation >= 1
  };
}
```

### Messaging Strategy
```typescript
// NEW HABITS (0-6 days): Always encouraging
"🌱 Building Momentum - Great start with [habit]! Keep going to establish the pattern."

// EARLY HABITS (7-13 days): Positive reinforcement
"🚀 Excellent Early Progress - 95% completion! You're building a strong foundation."
"📈 Good Early Pattern - 75% completion. You're on the right track!"

// ESTABLISHED HABITS (14+ days): Full analysis
"⭐ Exceptional Performance - [real]% completion rate! Your dedication is extraordinary."
"🏆 Outstanding Performance - 125% completion with bonus effort. Excellent consistency!"
"✅ Strong Consistency - 85% completion rate. Well done maintaining [habit]!"
"💪 Focus Opportunity - 45% completion. Try breaking it into smaller steps."
```

---

## UI Components Architecture

### HabitCalendarView
```typescript
// Full month calendar with Smart Conversion display
Components:
- Month navigation (prev/next)
- Day grid with color coding
- Legend explaining conversion states
- Support for makeup completion indicators

Color Coding:
- Green: Scheduled completion OR makeup completion
- Gold: Real bonus (not converted)
- Red: Missed scheduled day (no coverage)
- Blue dot: Underlying schedule indicator
```

### WeeklyHabitChart
```typescript
// Stacked bar chart for 7-day habit overview
Features:
- Proportional bar heights based on habit count
- Stacked sections: missed (red/gray), completed (green), bonus (gold)
- Smart Conversion applied to data
- Today highlighting
- Completion rate statistics

Performance:
- Dynamic Y-axis scaling
- Respects habit creation dates
- Handles empty states gracefully
```

### HabitStatsAccordionItem
```typescript
// Collapsible habit statistics with calendar
Features:
- Header with completion rate and total days
- Animated expansion/collapse
- Embedded HabitCalendarView
- Inactive habit visual treatment
- Month navigation within accordion

Stats Display:
- Completion rate with bonus indication
- Total completed days count
- Visual indicators for high performance (>100%)
```

### HabitStatsDashboard
```typescript
// Master view with Week/Month/Year toggle
Components:
- WeeklyHabitChart (7 days)
- Monthly30DayChart (30 days)
- YearlyHabitOverview (365 days)
- Unified navigation controls

Data Flow:
- All components use same completion rate algorithm
- Consistent Smart Conversion application
- Shared performance optimizations
```

---

## Storage Layer Integration

### HabitStorage Methods
```typescript
// Core CRUD operations
async getAll(): Promise<Habit[]>
async getById(id: string): Promise<Habit | null>
async create(input: CreateHabitInput): Promise<Habit>
async update(id: string, updates: Partial<Habit>): Promise<Habit>
async delete(id: string): Promise<void>

// Completion operations
async getAllCompletions(): Promise<HabitCompletion[]>
async getCompletionsByHabitId(habitId: string): Promise<HabitCompletion[]>
async createCompletion(habitId: string, date: DateString, isBonus: boolean): Promise<HabitCompletion>
async toggleCompletion(habitId: string, date: DateString, isBonus: boolean): Promise<HabitCompletion | null>
async deleteCompletion(id: string): Promise<void>

// Statistics and analytics
async getHabitStatistics(habitId: string): Promise<HabitStatsResult>
async getHabitCompletionStats(days: number): Promise<CompletionStatsResult>
```

### XP Integration Points
```typescript
// Automatic XP operations in storage layer:

// CREATE completion → Add XP
await habitStorage.createCompletion(habitId, date, isBonus)
// Internally calls: GamificationService.addXP(25 or 15, {...})

// DELETE completion → Subtract XP
await habitStorage.deleteCompletion(id)
// Internally calls: GamificationService.subtractXP(25 or 15, {...})

// TOGGLE completion → Add or subtract XP based on new state
await habitStorage.toggleCompletion(habitId, date, isBonus)
// Internally handles both add and subtract cases
```

---

## Context & Hook Integration

### HabitsContext
```typescript
// Global state management for habits
interface HabitsContextType {
  state: {
    habits: Habit[];
    completions: HabitCompletion[];
    isLoading: boolean;
    error: string | null;
  };
  actions: {
    loadHabits: () => Promise<void>;
    createHabit: (input: CreateHabitInput) => Promise<Habit>;
    updateHabit: (id: string, updates: UpdateHabitInput) => Promise<Habit>;
    deleteHabit: (id: string) => Promise<void>;
    toggleCompletion: (habitId: string, date: DateString, isBonus?: boolean) => Promise<HabitCompletion | null>;
    updateHabitOrder: (habitOrders: Array<{ id: string; order: number }>) => Promise<void>;
  };
}
```

### useHabitsData Hook
```typescript
// Enhanced hook with computed data and Smart Conversion
function useHabitsData() {
  return {
    habits: Habit[];                              // Sorted by order
    activeHabits: Habit[];                        // Only active habits
    completions: HabitCompletion[];               // Raw completions
    getHabitsByDate: (date: DateString) => HabitWithCompletion[];
    getHabitStats: (habitId: string) => HabitStats | null;
    getHabitCompletionsWithConversion: (habitId: string) => HabitCompletion[];  // Smart Conversion applied
    actions: HabitsContextActions;
  };
}
```

---

## Testing & Quality Assurance

### Required Test Coverage
```typescript
// Core functionality tests
✅ Smart Bonus Conversion accuracy
✅ Completion rate calculation precision
✅ Streak calculation correctness
✅ XP integration (add/subtract operations)
✅ Performance benchmarks (cache hit rates)

// Edge case testing
✅ Habit creation date respect
✅ Empty state handling
✅ Large dataset performance (1000+ completions)
✅ Cache invalidation scenarios
✅ Cross-week conversion logic
```

### Performance Benchmarks
```typescript
// Required performance standards:
Conversion calculation: <50ms per habit
Cache hit rate: >95% during normal use
UI responsiveness: 60fps during scroll/navigation
Memory usage: <10MB for 1000+ completion records
XP operation time: <16.67ms for 60fps guarantee
```

---

## Future Enhancement Roadmap

### Planned Features
```typescript
// 1. Automatic Streak Milestone XP
Status: DEFINED, NOT IMPLEMENTED
Location: habitStorage.checkAndAwardStreakMilestones()
Values: 7d=75XP, 14d=100XP, 30d=150XP, 50d=200XP, 100d=300XP

// 2. Habit Templates & Categories
Status: PLANNED
Features: Pre-defined habit templates, categorization system

// 3. Advanced Analytics
Status: PLANNED
Features: Weekly/monthly trends, completion prediction, recommendation engine

// 4. Social Features
Status: PLANNED
Features: Habit sharing, friend challenges, leaderboards
```

### Technical Debt
```typescript
// 1. Habit Reset Utils — SMAZÁNO 2026-07-19 (super audit N-4.9)
// Byla to no-op třída (zapisovala datum, které nikdo nečetl); completions
// jsou per-datum a žádný denní "reset" nepotřebují.

// 2. Cache Optimization
Current: Map-based cache in useHabitsData (reference-based invalidation)
Future: Implement LRU cache with size limits for memory efficiency

// 3. Background Sync
Future: Implement background data sync for offline capability
```

---

**GOLDEN RULE**: *"Respect creation dates, provide contextual feedback, optimize for Android performance, maintain XP integration consistency"*