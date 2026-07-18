# Monthly Challenges - Kompletní technická dokumentace

*Sofistikovaný systém měsíčních personalizovaných výzev s inteligentní 5-hvězdičkovou obtížností*

## ⚠️ **KRITICKÉ PRINCIPY PRO DEBUGGING & DEVELOPMENT**

### 🚨 **Interface Compatibility**
- **VŽDY ověř interface shodu** mezi GamificationService ↔ MonthlyProgressIntegration  
- **BatchedXPEvent format** se může změnit - testuj s real daty, ne mock objekty
- **Console.log skutečná event data** při debugging interface issues

### 🔄 **XP Direction Handling** 
- **Pozor na záporné XP** (-10 XP při undo návyků) - `calculateProgressIncrement` musí respektovat znaménko
- **NIKDY jen `if (amount > 0)`** - use `if (amount !== 0)` pro processing pozitivních i negativních hodnot
- **Math.max(0, value)** - progress nikdy nesmí jít pod 0

### 📡 **Real-time Updates**
- **UI komponenty MUSÍ** poslouchat `DeviceEventEmitter.addListener('monthly_progress_updated')`
- **Event cleanup** v useEffect return function - prevent memory leaks
- **Challenge ID filtering** - update pouze relevantní challenge

### 🌐 **i18n Coverage**  
- **Každý nový XPSourceType** → přidat do `src/locales/en/index.ts`
- **Testuj missing key warnings** v console.log - často přehlédnuto

### 🔍 **Debug Logging Strategy**
- **Comprehensive logging** v MonthlyProgressTracker klíčové pro diagnostiku
- **Log real values**: amount, direction, challenge IDs, progress changes
- **Structured debug tags**: `🔍 [DEBUG]`, `❌ [DEBUG]`, `✅ [DEBUG]` pro easy filtering

### 💀 **Dead Modal Syndrome**
- **Modal komponenty MUSÍ** mít vlastní DeviceEventEmitter listeners pro real-time updates
- **Static data loading** = mrtvé UI - data se načtou při otevření a nikdy neaktualizují
- **Daily snapshots** se musí vytvářet a ukládat pro calendar/weekly views
- **Weekly progress calculation** musí být based on real daily data, ne odhady

### 🗑️ **UI Content Restrictions**
- **NIKDY nezobrazovat baseline values** nebo scaling multipliers uživateli  
- **VYMAZAT "beginner-friendly" labels** a podobné condescending texty
- **DUBLOVANÉ progress indikátory** - milestone progress jen na home screen, ne v modalu
- **Developer info nesmí leak** do user-facing UI (scaling, baselines, atd.)

---

## 🔧 **PRODUCTION FIXES & IMPLEMENTATION HISTORY**

### 🚨 **0. Tracking Key Repair — 7 of 14 templates never progressed (July 2026)**

**Problem**: Seven challenge templates collected ZERO progress in production — the user
completed activities, but the challenge stayed at 0% and ended in a failure modal with
star demotion. Three independent root causes in `monthlyProgressTracker.ts`:

1. **Missing filter cases**: `habit_streak_days` (Streak Builder) and `avg_entry_length`
   (Depth Explorer) had no case in `getRelevantRequirements` → events were discarded
   before any calculation ran.
2. **Increment-0 trap**: complex/derived keys (`triple_feature_days`, `perfect_days`,
   `monthly_xp_total`, `balance_score`, `avg_entry_length`) return per-event increment 0
   by design — but the whole update pipeline (snapshot + `recalculateComplexTrackingKeys`
   + save + emit) was gated on `progressUpdated`, which only turns true on a non-zero
   increment. Chicken-and-egg: the recalculation that produces their values never ran.
   All 4 consistency templates were dead.
3. **Dropped sourceId**: `unique_weekly_habits` (Variety Champion) reads
   `metadata.sourceId`, but XP events carry `sourceId` as a separate top-level field and
   habit storage sends no metadata → variety never counted.

**Fixes**:
- Added the two missing `getRelevantRequirements` cases (habit sources / journal sources).
- Pipeline now also runs when a matched requirement is complex (`hasComplexRelevant`);
  completion % is recomputed AFTER the recalc; save/emit only fire when a requirement
  value or active-days actually changed (no churn).
- `updateMonthlyProgress` merges top-level `sourceId` into metadata before processing.
- Bonus: all `new Date().toISOString().split('T')[0]` (UTC!) date keys in the tracker
  replaced with local `today()` — active days / streak dates no longer shift after
  local evening for users west of UTC.

**Regression guard**: `src/services/__tests__/monthlyProgressTracker.trackingKeys.test.ts`
drives one real event pipeline per template tracking key and asserts progress > 0.
**If any of these 16 tests fails, a whole challenge type is dead — release blocker.**

### 🚨 **0b. Audit Fixes N-3.1/3.4/3.5/3.6/3.7 (July 2026, super audit Fáze 3)**

1. **Milestone zápisy počítány (N-3.1)**: Zápis deníku nesoucí milestone (#4/#8/#13 dne)
   odchází jako JEDNA XP transakce se source `JOURNAL_BONUS_MILESTONE`. Tracker ho dřív
   nematchoval → Gratitude Guru ztrácel až 3 zápisy/den a 5⭐ Consistency Writer reálně
   vyžadoval 6 zápisů. Nyní `JOURNAL_BONUS_MILESTONE` matchují klíče
   `total_journal_entries_with_bonus`, `daily_journal_streak`, `avg_entry_length`
   i denní čítač zápisů. (`quality_journal_entries` záměrně ne — quality jsou jen zápisy #1-3.)
2. **Anti-repeat ožil (N-3.4)**: Challenge nese `templateId` (id šablony); historie ho
   ukládá i vrací → 6měsíční filtr a -40 penalizace ve výběru šablon KONEČNĚ fungují
   (dřív se porovnávala UUID, která se nikdy netrefila).
3. **Streak = skutečná série (N-3.5)**: `habit_streak_days` / `daily_journal_streak`
   hodnota v progressu je AKTUÁLNÍ po sobě jdoucí série — při přerušení se resetuje na 1
   (dřív kumulovala +1 za každý aktivní den bez resetu). Výzva se dokončí v okamžiku,
   kdy série dosáhne targetu.
4. **Day-guard stav přežívá restart (N-3.5 / NÁLEZ 4 z 11.7.)**: všechny denní/týdenní
   guardy trackeru (streak stavy, denní čítač zápisů, goal-day guard, variety set) se
   perzistují v AsyncStorage (`monthly_tracker_day_guard_state`) — restart appky už
   nezpůsobí double-count dne ani ztrátu série. Device ověření = položka 3e auditu.
5. **Undo funguje (N-3.6)**: smazání zápisu/completion posílá metadata
   (`entryLength`, `date`) a tracker reverzuje progress: quality dekrement, uvolnění
   dnešního streak dne (u journalu přesně přes čítač), uvolnění variety slotu.
6. **Lokalizovaný dynamický popis (N-3.7)**: star-based popis Consistency Writer jde
   přes i18n klíč `descriptionDynamic` (plurály, EN/DE/ES) — dřív hardcoded angličtina.

**Regression guard**: `monthlyProgressTracker.trackingKeys.test.ts` rozšířen 16 → 23 testů
(milestone counting, streak reset, restart survival, undo scénáře).

7. **Generování targetů opraveno (N-3.2 + N-3.3, schváleno a provedeno 2026-07-18)**:
   - **Hvězdy = lineární mapování do range šablony** (N-3.3): `multiplier(hvězda) =
     min + (hvězda−1)/4 × (max−min)` — např. range [1.20, 1.40] dává 1.20/1.25/1.30/1.35/1.40.
     Každá hvězda je reálně těžší (dřívější clamp dělal z hvězd 1-4 stejný cíl).
   - **Srovnané škály baseline metrik** (N-3.2): Bonus Hunter → `monthlyBonusHabits`
     (denní průměr × 30), Variety Champion → `monthlyHabitVariety` (denní pestrost × 4),
     Gratitude Guru → `totalJournalEntries` (přímý měsíční počet), Reflection Expert →
     nová metrika `qualityJournalEntries` (non-bonus zápisy ≥33 znaků za 30 dní).
   - **Minima per tracking klíč** (místo per kategorie): streak klíče [5,7,10,14,18] dní,
     `unique_weekly_habits` [8,10,12,16,20], `bonus_habit_completions` [5,8,12,16,20],
     `quality_journal_entries` [20,30,40,50,60], `avg_entry_length` [25,30,35,40,45] znaků.
     Ostatní klíče zatím kategorová minima (Goals/Consistency dořeší audit sessions #8/#9).
   - **Stropy**: streak/denní klíče ≤ dní v měsíci (stávající); quality ≤ 3×dny v měsíci;
     variety ≤ počet aktivních návyků × počet týdnů měsíce.
   - Platí pro nově generované výzvy; běžící výzva se nemění.
8. **Mrtvá scaling API smazána (N-3.9, schváleno 2026-07-18)**:
   `MonthlyChallengeService.applyStarScaling`, `UserActivityTracker.applyStarScaling` /
   `getStarScaling` a `StarRatingService.calculateDifficulty` nevolal žádný produkční
   kód a počítaly JINAK než reálná generace — testy je přesto zeleně validovaly.
   Testy přesměrovány na skutečnou cestu `calculateTargetFromBaseline`.

Detail: `docs/audits/super-audit-2026-07/faze-3-nalezy.md`.

### 🚀 **1. MonthlyProgressIntegration Auto-Initialization Fix (August 2025)**

**Problem**: Unreliable auto-initialization causing system non-functionality
```typescript
// ❌ BEFORE: Unreliable auto-init
MonthlyProgressIntegration.initialize(); // Sometimes failed silently

// ✅ AFTER: Explicit initialization in HomeScreen
useEffect(() => {
  const initializeMonthlyProgress = async () => {
    try {
      await MonthlyProgressIntegration.initialize();
      console.log('✅ MonthlyProgressIntegration initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize MonthlyProgressIntegration:', error);
    }
  };
  initializeMonthlyProgress();
}, []); // Run once on mount
```

**Root Cause**: Auto-initialization timing issues and silent failures
**Solution**: Explicit initialization with proper error handling in app startup
**Result**: 100% reliable Monthly Challenge system startup

### 📊 **2. Active Days Tracking - Storage Consistency Fix (August 2025)**

**Problem**: Active days remained 0 despite completed habits
**Root Cause**: Inconsistent storage strategy between save and read operations

```typescript
// ❌ BEFORE: Inconsistent storage
saveDailySnapshot() {
  // Saved individual daily keys: "monthly_daily_snapshot_2025-08-09_challenge_123"
  AsyncStorage.setItem(`monthly_daily_snapshot_${date}_${challengeId}`, data);
}

recalculateActiveDays() {
  // Expected centralized array storage
  const snapshots = await AsyncStorage.getItem('monthly_snapshots_array');
  // MISMATCH! → Always returned 0 active days
}

// ✅ AFTER: Unified centralized array storage
saveDailySnapshot() {
  // Both save and read use same centralized array
  const existingSnapshots = await this.getAllSnapshots();
  const updatedSnapshots = [...existingSnapshots, newSnapshot];
  await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_SNAPSHOTS, JSON.stringify(updatedSnapshots));
}
```

**Solution**: Unified storage strategy using centralized array for both operations
**Result**: Real-time active days updates work correctly

### ⚡ **3. Performance Optimization - getWeeklySnapshots() (August 2025)**

**Problem**: 7x redundant AsyncStorage calls causing performance bottleneck

```typescript
// ❌ BEFORE: Multiple individual calls
getWeeklySnapshots(challengeId, dates) {
  const snapshots = [];
  for (const date of dates) { // 7 iterations
    const snapshot = await AsyncStorage.getItem(`snapshot_${date}_${challengeId}`); // 7 calls!
    snapshots.push(snapshot);
  }
  return snapshots;
}

// ✅ AFTER: Single load + filtering + caching
private static snapshotCache: { data: any[]; timestamp: number } | null = null;
private static CACHE_TTL = 10 * 1000; // 10 seconds

getWeeklySnapshots(challengeId, dates) {
  // Single load with caching
  const allSnapshots = await this.getAllSnapshots(); // 1 call only!
  return allSnapshots.filter(s => 
    s.challengeId === challengeId && dates.includes(s.date)
  );
}
```

**Solution**: Single array load + in-memory filtering + 10s TTL caching
**Result**: Dramatic performance improvement for weekly data loading

### 🎨 **4. Calendar Color Adaptation System - Complete Overhaul (August 2025)**

**Problem**: Fixed color logic didn't reflect challenge intensity
- 18 habits/month challenge: 1 habit = same color as 90 habits/month challenge: 1 habit
- Used fake `weeklyData / 7` estimates instead of real daily snapshots

```typescript
// ❌ BEFORE: Fixed logic regardless of challenge
if (hasAnyActivity) return 'perfect'; // Any activity = perfect (wrong!)
const dailyEstimate = weeklyData / 7; // Fake data!

// ✅ AFTER: Challenge-adaptive coloring
const dailyTarget = calculateDailyTarget(challenge.requirements);
const completionPercentage = actualProgress / dailyTarget;

// Adaptive thresholds based on actual daily targets
if (completionPercentage >= 0.91) return 'perfect'; // 91%+ = Perfect Day
if (completionPercentage >= 0.51) return 'good';   // 51-90% = Good Progress  
if (completionPercentage >= 0.10) return 'some';   // 10-50% = Some Activity
return 'none'; // <10% = No meaningful activity
```

**Key Changes**:
- Real daily snapshots from MonthlyProgressTracker instead of fake estimates
- Daily target calculation based on challenge requirements
- Adaptive intensity mapping using completion percentages
- User-optimized thresholds (10%/51%/91% instead of 25%/75%/100%)

**Result**: Calendar accurately reflects challenge difficulty and user progress

### 📅 **5. Weekly Breakdown Enhancement (August 2025)**

**Problem**: % calculation based only on "active days count" was misleading

```typescript
// ❌ BEFORE: Misleading percentage calculation
const weekProgress = (weekDaysWithActivity / totalPossibleDays) * 100;
// Week with 7 "some" days = 100%
// Week with 7 "perfect" days = 100% (SAME!)

// ✅ AFTER: Real progress calculation
const monthlyTarget = challenge.requirements.reduce((total, req) => total + req.target, 0);
const weeklyTarget = (monthlyTarget * weekDays) / monthTotalDays;
const weekActualProgress = week.reduce((sum, day) => {
  return sum + Object.values(day.contributions).reduce((a, b) => a + b, 0);
}, 0);
const weekProgress = Math.round((weekActualProgress / weeklyTarget) * 100); // No 100% cap!
```

**Enhancements**:
- Added "some" category display for complete intensity breakdown
- Intelligent weekly target distribution based on month structure
- Real progress percentage reflecting actual goal completion
- Removed 100% cap - can show 200%+ for overachievers
- Proper handling of partial weeks (proportional targets)

**Display Format**: `"5/7 active | 2 some | 2 good | 1 perfect | 119%"`

### 🏗️ **6. Modal UI Structure Cleanup (August 2025)**

**Problem**: UI duplication and poor information hierarchy

**Changes**:
- **Removed**: Duplicated "Progress" tab (contained duplicate Weekly Breakdown)
- **Reorganized**: Requirements Progress moved from Progress tab → Overview tab
- **Streamlined**: 4 tabs → 3 tabs (Overview, Calendar, Tips)
- **Eliminated**: UI duplication between tabs

**Design Principles Applied**:
- Each feature appears in only one logical location
- Similar functionality consolidated, not duplicated
- Clear information hierarchy: Overview → Calendar → Tips

### 🔄 **7. Real-time Updates Implementation (August 2025)**

**Implementation**:
```typescript
// Modal components now have real-time listeners
useEffect(() => {
  const progressListener = DeviceEventEmitter.addListener(
    'monthly_progress_updated',
    async (eventData) => {
      if (eventData.challengeId === selectedChallenge.id) {
        const updatedProgress = await MonthlyProgressTracker.getChallengeProgress(challengeId);
        setSelectedChallengeProgress(updatedProgress);
      }
    }
  );

  return () => {
    progressListener.remove(); // Prevent memory leaks
  };
}, [selectedChallenge?.id]);
```

**Features**:
- DeviceEventEmitter listeners for real-time UI updates
- Challenge ID filtering for relevant updates only
- Proper event cleanup to prevent memory leaks
- Modal components receive live progress updates

**Result**: UI stays synchronized with user actions in real-time

### 📚 **8. Technical Documentation Centralization (August 2025)**

**Created**: Comprehensive `technical-guides:Monthly-Challenges.md` with:
- Complete debugging principles and troubleshooting guide
- All adaptive systems documentation (calendar colors, weekly breakdown)
- Technical implementation details with code examples
- Visual mapping and threshold explanations
- Production fixes and implementation history

**Organized**: All Monthly Challenge knowledge centralized in one location

---

## 📋 **PŘEHLED VŠECH TYPŮ VÝZEV**

### 🎯 **HABITS KATEGORIE (4 typy výzev)**

#### **1. Consistency Master** 
*"Dokončuj své plánované návyky konzistentně celý měsíc"*

Baseline: `totalHabitCompletions` (počet scheduled completions za 30 dní). Range [1.05, 1.25]
→ hvězdy +5/+10/+15/+20/+25 %. Minima 20/25/30/35/40.

**Příklad (baseline 40):**
- **1⭐**: 42 návyků *(+5 %)* | **2⭐**: 44 *(+10 %)* | **3⭐**: 46 *(+15 %)* | **4⭐**: 48 *(+20 %)* | **5⭐**: 50 *(+25 %)*


#### **2. Variety Champion**
*"Dokončuj různé návyky každý týden pro pestrost"* (trackingKey: `unique_weekly_habits`)

Počítá **unikátní návyky za týden** (stejný návyk 2× týdně = 1), sčítá se přes týdny měsíce.
Baseline: `monthlyHabitVariety` = denní pestrost × 4 (N-3.2). Range [1.10, 1.30].
Minima 8/10/12/16/20. **Strop**: počet aktivních návyků × počet týdnů měsíce — target
nikdy nechce víc pestrosti, než kolik návyků reálně máš.

**Příklad (denní pestrost 3 → baseline 12):** 1⭐ 14 | 2⭐ 14 | 3⭐ 15 | 4⭐ 16 | 5⭐ 20 *(minima)*

#### **3. Streak Builder**
*"Udržuj konzistentní streaky návyků po celý měsíc"*

Hodnota v progressu = **aktuální po sobě jdoucí série** (při přerušení reset na 1 — N-3.5);
výzva se splní v okamžiku dosažení targetu. Baseline: `longestHabitStreak`.
Range [1.15, 1.35]. Minima 5/7/10/14/18 dní.

**📅 MĚSÍČNÍ LIMIT**: Targets automaticky omezeny počtem dní v měsíci (28-31 dní)

**Příklad (baseline 10):** 1⭐ 12 dní | 2⭐ 12 | 3⭐ 13 | 4⭐ 14 | 5⭐ 18 *(minimum)*

#### **4. Bonus Hunter**
*"Překračuj své plánované návyky bonus dokončeními"*

Baseline: `monthlyBonusHabits` = denní průměr bonusů × 30 (N-3.2). Range [1.20, 1.40]
→ hvězdy +20/+25/+30/+35/+40 %. Minima 5/8/12/16/20.

**Příklad (0,3 bonusu denně → baseline 9):** 1⭐ 11 | 2⭐ 12 | 3⭐ 12 | 4⭐ 16 | 5⭐ 20 *(minima)*

---

### 📝 **JOURNAL KATEGORIE (4 typy výzev)**

#### **1. Reflection Expert**
*"Piš detailní záznamy (33+ znaků) pro prohloubení vděčnosti"*

**Měření kvality**: Jako "detailní" se počítají POUZE zápisy #1-3 dne (non-bonus)
s 33+ znaky. Baseline: `qualityJournalEntries` (stejná definice, za 30 dní — N-3.2).
Range [1.05, 1.25]. Minima 20/30/40/50/60. **Strop**: 3 × počet dní měsíce
(víc kvalitních zápisů se strukturálně započítat nedá).

**Příklad (baseline 80, 31denní měsíc):** 1⭐ 84 | 2⭐ 88 | 3⭐ 92 | 4⭐ 93 | 5⭐ 93 *(strop 93)*

#### **2. Gratitude Guru**
*"Zvládni běžné i bonus záznamy pro perfektní vděčnost"*

Počítá VŠECHNY zápisy (běžné + bonusové, včetně milestone zápisů #4/#8/#13 — N-3.1).
Baseline: `totalJournalEntries` (měsíční počet všech zápisů — N-3.2). Range [1.10, 1.30]
→ hvězdy +10/+15/+20/+25/+30 %. Minima 30/40/50/60/70.

**Příklad (baseline 100):** 1⭐ 110 | 2⭐ 115 | 3⭐ 120 | 4⭐ 125 | 5⭐ 130

#### **3. Consistency Writer**
*"Piš v deníku každý jednotlivý den pro neprolomitelný návyk"*

**🆕 STAR-BASED ENTRY REQUIREMENTS (September 2025)**
- **1⭐ Level**: 1 entry per day required for streak
- **2⭐ Level**: 2 entries per day required for streak  
- **3⭐ Level**: 3 entries per day required for streak
- **4⭐ Level**: 4 entries per day required for streak
- **5⭐ Level**: 5 entries per day required for streak

**📅 MĚSÍČNÍ LIMIT**: Targets automaticky omezeny počtem dní v měsíci (28-31 dní)

Hodnota v progressu = **aktuální po sobě jdoucí série dní** splňujících star požadavek
(reset při přerušení — N-3.5); milestone zápisy #4/#8/#13 se do denního počtu počítají
(N-3.1). Baseline: `journalConsistencyDays` (dny s 3+ zápisy za 30 dní).
Range [1.15, 1.35]. Minima 5/7/10/14/18 dní.

**Příklad (baseline 20):** 1⭐ 23 dní *(1 zápis/den)* | 2⭐ 24 *(2/den)* | 3⭐ 25 *(3/den)* | 4⭐ 26 *(4/den)* | 5⭐ 27 *(5/den)*

#### **4. Depth Explorer**
*"Zvyšuj průměrnou délku svých záznamů pro hlubší reflexi"* (trackingKey: `avg_entry_length`)

Hodnota = **průměrná délka záznamů (znaky)** v rámci měsíce — přepočítává se při každém
journal eventu z reálných dat v úložišti (derived/complex key, ne inkrementální čítač).
Baseline: `avgEntryLength`. Range [1.20, 1.40] → hvězdy +20/+25/+30/+35/+40 %.
Minima 25/30/35/40/45 znaků.

**Příklad (baseline 60 znaků):** 1⭐ 72 | 2⭐ 75 | 3⭐ 78 | 4⭐ 81 | 5⭐ 84

---

### 🏆 **GOALS KATEGORIE (2 typy výzev)**

#### **1. Progress Champion**
*"Dělej konzistentní denní pokrok směrem k cílům"*

**📅 MĚSÍČNÍ LIMIT**: Targets automaticky omezeny počtem dní v měsíci (28-31 dní)

**Příklady obtížnosti:**
- **1⭐ Snadná**: 21 dnů s pokrokem na cílech *(baseline 20 → +5%)*
- **2⭐ Střední**: 22 dnů s pokrokem na cílech *(baseline 20 → +10%)*
- **3⭐ Těžká**: 23 dnů s pokrokem na cílech *(baseline 20 → +15%)*
- **4⭐ Expert**: 24 dnů s pokrokem na cílech *(baseline 20 → +20%)*
- **5⭐ Mistr**: 25 dnů s pokrokem na cílech *(baseline 20 → +25%)*

#### **2. Achievement Unlocked**
*"Dokončí více cílů během měsíce"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 2 dokončené cíle za měsíc *(baseline 2 → +5%)*
- **2⭐ Střední**: 2 dokončené cíle za měsíc *(baseline 2 → +10%)*
- **3⭐ Těžká**: 3 dokončené cíle za měsíc *(baseline 2 → +15%)*
- **4⭐ Expert**: 3 dokončené cíle za měsíc *(baseline 2 → +20%)*
- **5⭐ Mistr**: 3 dokončené cíle za měsíc *(baseline 2 → +25%)*



---

### ⚡ **CONSISTENCY KATEGORIE (4 typy výzev)**

#### **1. Triple Master**
*"Používej všechny tři funkce (návyky, deník, cíle) každý den"*

**📅 MĚSÍČNÍ LIMIT**: Targets automaticky omezeny počtem dní v měsíci (28-31 dní)

**Příklady obtížnosti:**
- **1⭐ Snadná**: 16 dnů se všemi funkcemi *(baseline 15 → +5%)*
- **2⭐ Střední**: 17 dnů se všemi funkcemi *(baseline 15 → +10%)*
- **3⭐ Těžká**: 18 dnů se všemi funkcemi *(baseline 15 → +15%)*
- **4⭐ Expert**: 18 dnů se všemi funkcemi *(baseline 15 → +20%)*
- **5⭐ Mistr**: 19 dnů se všemi funkcemi *(baseline 15 → +25%)*

#### **2. Perfect Month**
*"Dosáhni denních minim (1+ návyk, 3+ záznamy) konzistentně"*

**📅 MĚSÍČNÍ LIMIT**: Targets automaticky omezeny počtem dní v měsíci (28-31 dní)

**Příklady obtížnosti:**
- **1⭐ Snadná**: 21 perfektních dnů za měsíc *(baseline 20 → +5%)*
- **2⭐ Střední**: 22 perfektních dnů za měsíc *(baseline 20 → +10%)*
- **3⭐ Těžká**: 23 perfektních dnů za měsíc *(baseline 20 → +15%)*
- **4⭐ Expert**: 24 perfektních dnů za měsíc *(baseline 20 → +20%)*
- **5⭐ Mistr**: 25 perfektních dnů za měsíc *(baseline 20 → +25%)*

> ℹ️ **Pozn. (červenec 2026)**: Dřívější výzva „Engagement King" (`daily_engagement_streak`)
> NEMÁ v kódu šablonu — tracking klíč existuje jen jako podpora v trackeru. Nezapočítávat
> do počtu výzev, dokud šablona nevznikne.

#### **3. XP Champion**
*"Nashromáždi více celkového XP během měsíce ze všech zdrojů"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 1610 celkového XP za měsíc *(baseline 1400 → +15%)*
- **2⭐ Střední**: 1680 celkového XP za měsíc *(baseline 1400 → +20%)*
- **3⭐ Těžká**: 1750 celkového XP za měsíc *(baseline 1400 → +25%)*
- **4⭐ Expert**: 1820 celkového XP za měsíc *(baseline 1400 → +30%)*
- **5⭐ Mistr**: 1890 celkového XP za měsíc *(baseline 1400 → +35%)*

**🎯 VŠECHNY XP ZDROJE**: Počítá habits, journal, goals, achievementy, bonusy, milestones
**⚡ DAILY XP LIMITS**: Respektuje denní XP limity - 5⭐ targets automaticky omezeny na dosažitelné

#### **5. Balance Expert** 🚨 **EXPERT ONLY (4⭐+ Required)**
*"Udržuj vyvážené XP zdroje (žádný zdroj >60% celkem)"*

**⚠️ POKROČILÁ VÝZVA**: Vyžaduje minimálně **4⭐ consistency rating** pro unlock!

**Příklady obtížnosti:**
- **4⭐ Expert**: Balance score 0.72+ *(baseline 0.60 → +20%)*
- **5⭐ Mistr**: Balance score 0.84+ *(baseline 0.60 → +40%)*

**🔒 OMEZENÍ PŘÍSTUPU**: 1⭐-3⭐ uživatelé tuto výzvu nevidí - systém ji automaticky filtruje podle star ratingu

---

## 🎯 **CELKOVÉ PRINCIPY SYSTÉMU**

### **📊 Baseline-Driven Personalization Process**

**Klíčový princip**: Systém **NESPOUŠTÍ** výzvy okamžitě po registraci, ale nejprve **30 dní sleduje** uživatelovu aktivitu a teprve poté navrhuje personalizované výzvy.

#### **🔍 30-denní analytický proces**
1. **UserActivityTracker** sleduje každodenní aktivitu za posledních 30 dní
2. **Počítá baseline metriky** pro všechny kategorie:
   ```typescript
   // Příklad baseline výpočtu
   avgDailyHabitCompletions: 0.67 návyků/den = 20 návyků/měsíc
   avgDailyJournalEntries: 3.2 záznamy/den = 96 záznamy/měsíc  
   totalGoalProgressDays: 18 dnů s pokrokem = 18 dnů/měsíc
   tripleFeatureDays: 12 dnů se všemi funkcemi = 12 dnů/měsíc
   ```

3. **Určuje kvalitu dat** podle activity thresholds:
   ```typescript
   QUALITY_THRESHOLDS = {
     MINIMAL: 5,   // < 5 aktivních dnů
     PARTIAL: 15,  // 5-15 aktivních dnů  
     COMPLETE: 20  // 20+ aktivních dnů
   }
   ```

#### **🎲 Challenge Generation Logic**
```typescript
if (totalActiveDays < 20) {
  // 🌱 WARM-UP TREATMENT (< 20 aktivních dní)
  category = randomFrom([HABITS, JOURNAL, GOALS])  // Náhodná variabilita
  template = randomFrom(templates.filter(t => t.minLevel === 1))
  title = "🌱 Warm-Up: " + template.title
  target = fixedBeginnerTarget * 0.7  // Extra konzervativní (70 % — N-3.8: guide dřív tvrdil 80 %)
  starLevel = 1                       // Vždy nejlehčí
  generationReason = 'warm_up'        // ❌ Nedává hvězdu!

} else if (dataQuality === 'partial') {
  // ČÁSTEČNÁ PERSONALIZACE (kolem prahu — dataQuality 'partial')
  category = weightedCategorySelection()
  template = weightedRandomTemplate()
  target = baseline * lightScaling    // Lehká personalizace
  starLevel = 1-3                     // Omezený rozsah
  generationReason = 'scheduled'      // ✅ Dává hvězdu

} else {
  // PLNÁ PERSONALIZACE (20+ aktivních dní)
  category = weightedCategorySelection()
  template = weightedRandomTemplate()
  target = baseline * starMultiplier  // Plně personalizované
  starLevel = 1-5                     // Celý rozsah hvězdičkové obtížnosti
  xpReward = 5000-25000               // 10x XP systém!
  generationReason = 'scheduled'      // ✅ Dává hvězdu
}
```

#### **📅 Praktický příklad uživatelského journey**
```
Den 1-19:  Uživatel je nový, má < 20 aktivních dní
           → 🌱 Warm-Up: Náhodná kategorie, 1⭐, bez hvězdičky

Den 20:    Uživatel dosáhne 20 aktivních dní - přechod na Full!
           → ⭐ Full Challenge: Personalizované, dává hvězdičky

Měsíc 1:   🌱 Warm-Up: Journal → Gratitude Guru (1⭐) - 8 aktivních dní
           → XP: 500 (Warm-Up hodnota), bez hvězdičky
Měsíc 2:   🌱 Warm-Up: Habits → Streak Builder (1⭐) - 12 aktivních dní
           → XP: 500 (Warm-Up hodnota), bez hvězdičky
Měsíc 3:   ⭐ Full: Habits → Consistency Master (2⭐) - 22 aktivních dní
           → XP: 7,500 (Full 10x!), první hvězda! Target: +10% nad baseline
Měsíc 4:   ⭐ Full: Journal → Reflection Expert (3⭐) - 25 aktivních dní
           → XP: 12,000 (Full 10x!), plná personalizace
```

**Výsledek**: Každá výzva je **precizně nastavena** na uživatelovu skutečnou úroveň aktivity, ne na generické hodnoty.

### **🤖 Automatická personalizace**
Na základě 30-denní analýzy systém automaticky vytváří personalizované výzvy přizpůsobené behavioral patterns každého uživatele.

### **⭐ 5-hvězdičková obtížnost + XP odměny**

#### **FULL Challenge XP (10x multiplier pro engagement!)**
Uživatelé s 20+ aktivními dny dostávají plnohodnotné výzvy s vysokými XP odměnami:
- **1⭐ Common** (Novice): **5,000 XP**
- **2⭐ Rare** (Explorer): **7,500 XP**
- **3⭐ Epic** (Challenger): **12,000 XP**
- **4⭐ Legendary** (Expert): **17,500 XP**
- **5⭐ Master** (Master): **25,000 XP**

Procentní navýšení targetu nad baseline určuje `baselineMultiplierRange` ŠABLONY:
hvězdy se mapují lineárně od minima (1⭐) po maximum (5⭐) rozsahu — např. šablona
[1.05, 1.25] dává +5/+10/+15/+20/+25 %, šablona [1.20, 1.40] dává +20/+25/+30/+35/+40 %
(N-3.3, 2026-07-18).

> **💡 Business Logic**: 10x XP motivuje uživatele používat aplikaci celý měsíc aby splnili výzvu. Jedna 5⭐ výzva = více XP než celý měsíc denních aktivit!

#### **Monthly Streak Bonus (milníkový systém)**
Bonus za po sobě jdoucí měsíce splněných výzev. Počítá se jako % z base XP:
- **Streak 1**: žádný bonus (první splnění)
- **Streak 2–3**: +5% z base XP
- **Streak 4–5**: +10% z base XP
- **Streak 6–11**: +15% z base XP
- **Streak 12+**: +25% z base XP

> **Příklad**: 3⭐ výzva (12,000 XP) se streakem 5 měsíců = 12,000 + 1,200 (10%) = **13,200 XP**

#### **WARM-UP Challenge XP (původní hodnoty)**
Noví uživatelé (<20 aktivních dní) dostávají Warm-Up výzvy s nižšími XP:
- **1⭐**: 500 XP
- **2⭐**: 750 XP
- **3⭐**: 1,125 XP
- **4⭐**: 1,688 XP
- **5⭐**: 2,532 XP

> **⚠️ Warm-Up omezení**: Nedává hvězdičky, vždy 1⭐ obtížnost, nižší XP = motivace k přechodu na Full challenge

### **📈 Inteligentní progrese**
Star level se upravuje na základě výsledků:
- **Úspěch** (100% splnění): +1 hvězdička
- **Částečný úspěch** (70-99%): stejná úroveň
- **Neúspěch** (<70%): po 2 neúspěších po sobě -1 hvězdička
- **Ochrana**: nikdy neklesne pod 1⭐ (vždy splnitelné)

### **🔄 Kategoriální rotace**
Systém zajišťuje rozmanitost výzev:
- **Vyhýbá se opakování** stejné kategorie 2 měsíce po sobě
- **Preferuje nevyužité kategorie** pro pestrost
- **Respektuje user engagement** v jednotlivých oblastech
- **Sezónní preference** (leden = novoroční habits, září = back-to-school)

### **🎲 Weighted Random Template Selection (Tahání karet z balíčku)**

**Klíčový princip**: Systém používá **váhovanou náhodnost** pro výběr výzev, ne deterministický výběr nejvyšší priority.

#### **Jak funguje "tahání karet z balíčku":**

```typescript
// Každý template dostane váhový skór (weight)
const weightedTemplates = templates.map(template => {
  let weight = template.priority; // Base: 65-100 bodů

  // Seasonal bonus: +30 bodů pro sezónní výzvy
  if (isSeasonal) weight += 30;

  // Anti-repeat penalty: -40 bodů pro nedávno použité výzvy
  if (wasRecentlyUsed) weight -= 40;

  // Random variance: ±20 bodů náhodné variace
  const randomVariance = (Math.random() - 0.5) * 40;
  weight += randomVariance;

  return { template, weight };
});

// Vyber template s nejvyšším váhovým skórem
const selected = weightedTemplates.sort((a, b) => b.weight - a.weight)[0];
```

#### **📊 Příklad výběru (Habits kategorie v říjnu):**

| Template | Base Priority | Seasonal Bonus | Anti-repeat | Random | Final Weight | Probability |
|----------|--------------|----------------|-------------|--------|--------------|-------------|
| **Consistency Master** | 100 | +30 (říjen) | 0 | +15 | **145** | ~45% |
| **Streak Builder** | 90 | 0 | 0 | +8 | **98** | ~25% |
| **Variety Champion** | 85 | 0 | -40 (used) | -12 | **33** | ~10% |
| **Bonus Hunter** | 75 | 0 | 0 | +18 | **93** | ~20% |

**Výsledek**: I když Consistency Master má nejvyšší prioritu, existuje **~55% šance** že se vybere jiná výzva!

#### **🎯 Výhody weighted random systému:**

✅ **Pestrost** - Každý měsíc může přijít jiná výzva, i v rámci stejné kategorie
✅ **Respektuje prioritu** - Templates s vyšší prioritou mají stále větší šanci
✅ **Anti-repeat ochrana** - Nedávno použité výzvy mají -40 bodů penalty
✅ **Sezónní preference** - Relevantní výzvy dostanou +30 bodů boost
✅ **Překvapení** - Random variance (±20) zajišťuje nepředvídatelnost

#### **🔒 Anti-repeat systém:**

- **-40 bodů penalty** pro templates použité v posledních 6 měsících
- **Silný discount** který výrazně snižuje šanci opakování
- **Ale ne absolute ban** - v krajním případě (všechny templates použity) může projít

#### **🎄 Sezónní bonusy:**

Templates s `seasonality` field dostanou **+30 bodů** v relevantních měsících:

```typescript
// Příklad sezónnosti
{
  id: 'habits_consistency_master',
  seasonality: ['01', '02', '09', '10'], // Leden, Únor, Září, Říjen
  // +30 bodů bonus v těchto měsících
}
```

**Sezónní templates:**
- **Leden/Únor**: Novoroční návyky (Consistency Master)
- **Září/Říjen**: Back-to-school návyky (Consistency Master)
- Ostatní měsíce nemají sezónní preference

#### **📈 Pravděpodobnostní analýza:**

**Consistency Master v říjnu (se sezónním bonusem):**
- Base priority: 100
- Seasonal bonus: +30
- Random variance: -20 až +20
- **Finální rozsah: 110-150 bodů**
- **Pravděpodobnost výběru: ~40-50%** (ne 100%!)

**Ostatní templates:**
- Base priority: 75-90
- Random variance: -20 až +20
- **Finální rozsah: 55-110 bodů**
- **Pravděpodobnost výběru: ~50-60% CELKEM**

**Výsledek**: I v sezónních měsících existuje **solidní šance** na výběr jiné výzvy!

---

## 🛠️ **TECHNICKÁ ARCHITEKTURA**

### **📊 Baseline Calculation System**
```typescript
// UserActivityTracker analyzuje 30 dní aktivity
interface UserActivityBaseline {
  // Habit metrics
  avgDailyHabitCompletions: number;
  totalHabitCompletions: number;
  longestHabitStreak: number;
  
  // Journal metrics  
  avgDailyJournalEntries: number;
  totalJournalEntries: number;
  avgEntryLength: number;
  
  // Goal metrics
  totalGoalProgressDays: number;
  goalsCompleted: number;
  avgGoalTargetValue: number;
  
  // Consistency metrics
  tripleFeatureDays: number;
  perfectDays: number;
  balanceScore: number;
}
```

### **🎲 Challenge Generation Engine**
```typescript
// MonthlyChallengeService - hlavní logika generování
class MonthlyChallengeService {
  // 14 předpřipravených templates rozdělených do 4 kategorií
  static HABITS_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  static JOURNAL_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  static GOALS_TEMPLATES: MonthlyChallengeTemplate[] = [2 typy];
  static CONSISTENCY_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  
  // Star-based scaling system (Full challenge XP / Warm-Up XP)
  static MONTHLY_XP_REWARDS = {
    1: 5000, 2: 7500, 3: 12000, 4: 17500, 5: 25000
  };
  static WARM_UP_XP_REWARDS = {
    1: 500, 2: 750, 3: 1125, 4: 1688, 5: 2532
  };

  // Star scaling (N-3.3): lineární mapování hvězd dovnitř range šablony
  // multiplier(hvězda) = min + (hvězda − 1) / 4 × (max − min)
  // kde [min, max] = template.baselineMultiplierRange
}
```

### **⭐ Star Rating Progression**
```typescript
// StarRatingService - správa hvězdičkové obtížnosti
class StarRatingService {
  static PROGRESSION_RULES = {
    successThreshold: 100,        // 100% = +1 star
    partialThreshold: 70,         // 70-99% = same star  
    failureThreshold: 70,         // <70% = potential -1 star
    consecutiveFailuresForDemotion: 2, // 2 failures = -1 star
    maxStarLevel: 5,
    minStarLevel: 1
  };
}
```

### **⭐ Star Level Change Modal (StarLevelChangeModal)**

Vizuální zpětná vazba pro uživatele při změně úrovně hvězd.

**Kdy se zobrazí:**
- **Povýšení (star UP)**: Ihned po zavření gratulačního modalu za splněnou výzvu (500ms delay)
- **Sesazení (star DOWN)**: Při příštím otevření aplikace (uloženo v AsyncStorage pod klíčem `pending_star_demotion`)

**Animace - Povýšení:**
1. Modal se objeví se starými hvězdami
2. Nová hvězda "vybuchne" do scény (bounce: scale 0 → 1.4 → 0.9 → 1.0)
3. Glow efekt kolem hvězd
4. Název nové úrovně se plynule objeví
5. Haptic feedback: Heavy impact při "bouchnutí"

**Animace - Sesazení:**
1. Modal se objeví s aktuálními hvězdami
2. Poslední hvězda ztmavne a zmenší se (fade out + scale down)
3. Zbylé hvězdy změní barvu na nižší úroveň
4. Zobrazí se důvod sesazení + motivační tip
5. Haptic feedback: Warning notification

**Barvy hvězd podle úrovně:**
| Úroveň | Název | Barva | Hex |
|---------|-------|-------|-----|
| 1★ | Novice | Šedá | #9E9E9E |
| 2★ | Explorer | Modrá | #2196F3 |
| 3★ | Challenger | Fialová | #9C27B0 |
| 4★ | Expert | Oranžová | #FF9800 |
| 5★ | Master | Zlatá | #FFD700 |

**Technické detaily:**
- Komponenta: `src/components/challenges/StarLevelChangeModal.tsx`
- Listener: v `MonthlyChallengeSection.tsx` na event `star_level_changed`
- Ignoruje reason `reset` (admin/debug only)
- Podporuje Light/Dark theme (barvy z ThemeContext)
- Lokalizace: EN/DE/ES (`monthlyChallenge.starChange.*`)

**Integrace s centralizovanou ModalQueueContext:**
- Povýšení i sesazení: `enqueueModal({ type: 'star_level_change', priority: ModalPriority.STAR_LEVEL_CHANGE })`
- Queue automaticky řadí podle priority - zobrazí se po vyšších prioritách
- Sesazení: uloženo do AsyncStorage, zobrazí se při dalším otevření appky přes queue

---

### **🔴 Month-End Challenge Closure (Failure Path)**

Když měsíc skončí a výzva nebyla splněna na 100%, systém ji automaticky uzavře při dalším spuštění aplikace.

**Kdy se spouští:**
- Při startupu aplikace, když `MonthlyChallengeLifecycleManager.handleMonthTransition()` detekuje přechod měsíce
- Metoda `closePreviousChallenge()` se volá PŘED generováním nové výzvy

**Flow:**
1. Načíst předchozí výzvu a její progress
2. Pokud `progress.isCompleted === true` → skip (už bylo zpracováno při dosažení 100%)
3. Pokud `isCompleted === false` → failure path:
   - `StarRatingService.updateStarRatingForCompletion()` s reálným `completionPercentage`
   - `GamificationService.updateMonthlyStreak(category, false)` → reset streak na 0
   - Emit `monthly_challenge_failed` event s `MonthlyChallengeFailureResult`
   - Archive challenge
4. Generovat novou výzvu pro aktuální měsíc

**Star Impact podle procenta:**
| Procento | Klasifikace | Dopad na hvězdy |
|----------|------------|-----------------|
| 100% | Úspěch | +1★ (zpracováno ihned, ne při přechodu) |
| 70-99% | Partial | Beze změny, ale počítá se jako consecutive failure |
| <70% | Failure | Při 2 po sobě jdoucích failures → -1★ |

**Failure Modal (`MonthlyChallengeFailureModal.tsx`):**
- Zobrazí se jako první modal při startupu nového měsíce (priorita MONTHLY_CHALLENGE = 3)
- Star Level Change modal se zobrazí po něm (priorita STAR_LEVEL_CHANGE = 4)
- Ukazuje: procento dokončení, splněné požadavky, aktivní dny, dopad na hvězdy, streak reset
- Event listener v `MonthlyChallengeSection.tsx` na `monthly_challenge_failed`
- Lokalizace: EN/DE/ES (`monthlyChallenge.failureModal.*`)

**Žádné XP při neúspěchu:** Uživatel nedostane žádné XP za nesplněnou výzvu.

---

### **📈 Real-time Progress Tracking**
```typescript
// MonthlyProgressTracker - real-time pokrok
class MonthlyProgressTracker {
  // Performance optimalizace
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minut
  private static BATCH_WINDOW = 500; // 500ms batching
  
  // Event system pro UI updates
  private static EVENTS = {
    PROGRESS_UPDATED: 'monthly_progress_updated',
    MILESTONE_REACHED: 'monthly_milestone_reached',
    WEEK_COMPLETED: 'monthly_week_completed'
  };
}
```

---

## 🎮 **GAMIFICATION & REWARDS**

### **💰 XP Reward Structure**
Progresivní systém odměn motivuje k vyšší obtížnosti:
- **Base XP**: Podle star levelu (500-2,532 XP)
- **Completion Bonus**: +20% při 100% splnění
- **Streak Bonus**: +300-1200 XP za consecutive měsíce
- **Milestone Bonuses**: +50-100 XP za 25%, 50%, 75% progress

### **🏆 Achievement Integration**
Monthly challenges se propojují s achievement systémem:
- **Challenge completion** → Achievement progress
- **Star level milestones** → Special achievements
- **Category mastery** → Rare achievement unlocks
- **Perfect months** → Legendary achievements

### **🎯 Milestone System**
Každá výzva má 3 mezicíle pro udržení motivace:
- **25% Progress**: +50 XP milestone reward
- **50% Progress**: +75 XP milestone reward  
- **75% Progress**: +100 XP milestone reward
- **100% Complete**: Base XP + completion bonus

---

## 🔧 **ADVANCED FEATURES**

### **🌱 WARM-UP vs FULL CHALLENGE SYSTEM (December 2025)**

Systém rozlišuje dva typy výzev podle aktivity uživatele:

#### **📊 Rozhodovací logika**

```
┌─────────────────────────────────────────────────────────────┐
│  Uživatel otevře aplikaci 1. den v měsíci                   │
│                         ↓                                    │
│  Systém zkontroluje: Kolik aktivních dní má uživatel?       │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  < 20 aktivních dní  │  ≥ 20 aktivních dní          │    │
│  │         ↓            │           ↓                   │    │
│  │   🌱 WARM-UP         │    ⭐ FULL CHALLENGE          │    │
│  │   CHALLENGE          │                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### **🌱 WARM-UP CHALLENGE (< 20 dnů aktivity)**

**Kdy se aktivuje:**
- Uživatel má méně než 20 aktivních dní v historii
- Nový uživatel bez dat
- Uživatel s mezerami v aktivitě

**Charakteristiky:**

| Vlastnost | Warm-Up Challenge |
|-----------|-------------------|
| **Práh** | < 20 aktivních dní |
| **Kategorie** | Náhodně: HABITS, JOURNAL, nebo GOALS |
| **Šablona** | Náhodně z `minLevel = 1` šablon |
| **Obtížnost** | Vždy 1⭐ (nejlehčí) |
| **Scaling** | 70 % konzervativních fallback cílů (extra konzervativní) |
| **XP odměna** | Standardní XP za dokončení |
| **Hvězdička** | ❌ **NEDÁVÁ hvězdu obtížnosti** |
| **generationReason** | `'warm_up'` |

**Proč nedává hvězdu:**
- Zabraňuje "gamingu" systému
- Uživatel nemůže získat 5⭐ s lehkými výzvami
- První "pravá" hvězda přijde až po 20+ dnech aktivity

**Náhodná variabilita (December 2025):**
```typescript
// Kategorie - náhodný výběr ze 3 jednoduchých
const beginnerCategories = [HABITS, JOURNAL, GOALS];
const selected = beginnerCategories[Math.random() * 3];

// Šablona - náhodný výběr z lehkých
const beginnerTemplates = templates.filter(t => t.minLevel === 1);
const selected = beginnerTemplates[Math.random() * count];
```

#### **⭐ FULL CHALLENGE (≥ 20 dnů aktivity)**

**Kdy se aktivuje:**
- Uživatel má 20 nebo více aktivních dní
- Systém má dostatek dat pro personalizaci

**Charakteristiky:**

| Vlastnost | Full Challenge |
|-----------|----------------|
| **Práh** | ≥ 20 aktivních dní |
| **Kategorie** | Inteligentní výběr (váhy, historie, engagement) |
| **Šablona** | Weighted random s priority, seasonal bonus, anti-repeat |
| **Obtížnost** | 1-5⭐ podle star ratingu uživatele |
| **Scaling** | Personalizované: baseline × star multiplier |
| **XP odměna** | Progresivní: 500-2,532 XP podle ⭐ |
| **Hvězdička** | ✅ Dává hvězdu (success = +1⭐, failure = potenciálně -1⭐) |
| **generationReason** | `'scheduled'` nebo `'manual'` |

**Inteligentní výběr kategorie:**
- User engagement multiplier (0.5-1.5×)
- Recent usage penalty (80%/40%/10% pro poslední 3 měsíce)
- Star level bonus (preference kategorií s prostorem pro růst)
- Data quality bonus (preference kategorií s dostatkem dat)

**Weighted random výběr šablony:**
- Base priority: 65-100 bodů
- Seasonal bonus: +30 bodů
- Anti-repeat penalty: -40 bodů
- Random variance: ±20 bodů

#### **📈 Přechod z Warm-Up na Full**

```
Den 1-19:  Uživatel dostává Warm-Up výzvy
           → Žádné hvězdy, variabilní kategorie, lehké cíle

Den 20+:   Uživatel přechází na Full výzvy
           → Plná personalizace, hvězdy, progresivní obtížnost
```

**Praktický příklad:**
```
Měsíc 1 (5 aktivních dní):   🌱 Warm-Up: Habits → Consistency Master (1⭐)
Měsíc 2 (12 aktivních dní):  🌱 Warm-Up: Journal → Gratitude Guru (1⭐)
Měsíc 3 (22 aktivních dní):  ⭐ Full: Habits → Streak Builder (2⭐) ← První hvězda!
Měsíc 4 (25 aktivních dní):  ⭐ Full: Journal → Reflection Expert (3⭐)
```

#### **🔧 Technická implementace**

**Threshold konstanta:**
```typescript
// userActivityTracker.ts
private static readonly WARM_UP_THRESHOLD = 20; // zvýšeno ze 14 (commit d8ca23f)

// Rozhodování
isFirstMonth: context.totalActiveDays < this.WARM_UP_THRESHOLD // < 20 dní = warm-up
```

**Star blocking v starRatingService.ts:**
```typescript
if (isWarmUp) {
  console.log('⚠️ Warm-up challenge - NO star progression');
  return {
    ...historyEntry,
    reason: 'warm_up',
    newStars: previousStars // Beze změny
  };
}
```

**Lokalizace:**
| Jazyk | Prefix |
|-------|--------|
| EN | "Warm-Up" |
| DE | "Aufwärm-Challenge" |
| ES | "Calentamiento" |

---

### **🎲 Template Selection Algorithm**  
Inteligentní výběr výzev na základě:
- **User engagement** v kategorii (priorita aktivnějších kategorií)
- **Recent usage penalty** (vyhýbání opakování)
- **Star level bonus** (preference kategorií s prostředními stars)
- **Data quality bonus** (preference kategorií s dostatečnými daty)
- **Seasonal preferences** (specifické měsíce roku)

### **⚡ Performance Optimizations**
- **Caching system**: 5-minutový TTL na všechny baseline calculations
- **Batch processing**: 500ms okno pro groupování XP updates
- **Lazy loading**: Challenge generation až při prvním zobrazení
- **Background sync**: Automatické generování 1. den v měsíci

### **🔄 Fallback & Error Handling**
Robustní fallback systém zajišťuje vždy funkční výzvy:
- **Baseline failure**: Fallback na konzervativní default hodnoty
- **Template failure**: Fallback na nejjednodušší habits template
- **Star calculation error**: Fallback na 1⭐ obtížnost
- **Storage errors**: Fallback na in-memory calculations

---

## 💾 **DATA STORAGE ARCHITECTURE**

### **AsyncStorage Structure**
```typescript
// Klíče pro uložení dat
STORAGE_KEYS = {
  MONTHLY_CHALLENGES: 'monthly_challenges',
  USER_STAR_RATINGS: 'user_star_ratings', 
  MONTHLY_BASELINES: 'monthly_baselines',
  CHALLENGE_PROGRESS: 'monthly_challenge_progress',
  CHALLENGE_HISTORY: 'monthly_challenge_history_${userId}'
};
```

### **Data Migration System**
Automatické migrace při updates:
- **Version tracking** pro backward compatibility
- **Safe fallbacks** při corrupted data
- **Data validation** před použitím
- **Cleanup routines** pro old data

---

## 🚀 **DEPLOYMENT & LIFECYCLE**

### **📅 Monthly Generation Schedule**
- **Trigger**: 1. den každého měsíce při prvním otevření aplikace
- **Background check**: Denní kontrola potřeby generování  
- **Manual generation**: Dev/debug možnost force refresh
- **Archive system**: Ukládání completed challenges pro historii

### **📊 Analytics & Monitoring**  
Systém sleduje klíčové metriky:
- **Completion rates** podle star levels
- **Category preferences** uživatelů
- **Difficulty progression** trends
- **XP distribution** analysis
- **User engagement** patterns

### **🛡️ Anti-Abuse Protection**
Ochrana proti zneužití systému:
- **Cooldown periods**: Zabránění spam generování
- **Validation checks**: Realistic target values
- **Progress verification**: Anti-cheat measures
- **Rate limiting**: Ochrana před excessive API calls

---

## ⚙️ **CONFIGURATION & CUSTOMIZATION**

### **🔧 Template Management**
Snadné přidání nových výzev:
```typescript
// Přidání nového template
const NEW_TEMPLATE: MonthlyChallengeTemplate = {
  id: 'unique_template_id',
  category: AchievementCategory.HABITS,
  title: 'Template Title',
  description: 'What user needs to accomplish',
  baselineMetricKey: 'relevant_baseline_metric',
  baselineMultiplierRange: [1.05, 1.25], // Min/max scaling
  // ... requirements and bonuses
};
```

### **⚙️ Difficulty Tuning**
Obtížnost se ladí per šablona přes `baselineMultiplierRange` (N-3.3):
```typescript
// Šablona definuje rozsah; hvězdy se do něj mapují lineárně
baselineMultiplierRange: [1.05, 1.25], // 1⭐ = +5 % … 5⭐ = +25 %
// multiplier(hvězda) = min + (hvězda − 1) / 4 × (max − min)
// Širší/vyšší range = těžší šablona (např. Bonus Hunter [1.20, 1.40])
```
Druhá páka: minima per tracking klíč a stropy (dny v měsíci, 3×dny u quality,
návyky×týdny u variety) v `monthlyChallengeService.ts`.

### **🎯 Category Priority Adjustment**
```typescript
// Úprava preferencí kategorií
const CATEGORY_BASE_WEIGHTS = {
  [HABITS]: 100,        // Highest priority (most fundamental)
  [JOURNAL]: 95,        // Core self-reflection  
  [CONSISTENCY]: 90,    // Multi-feature engagement
  [GOALS]: 85          // Achievement-focused
};
```

---

## 🧪 **TESTING & QUALITY ASSURANCE**

### **📋 Test Coverage Areas**
- **Baseline calculation accuracy**: Všechny metriky správně počítané
- **Star progression logic**: Správná +1/-1 star logika
- **Challenge generation**: Všechny templates funkční
- **Progress tracking**: Real-time updates přesné
- **XP calculations**: Správné odměny a bonusy
- **Edge case handling**: New users, missing data, corrupted storage

### **🎯 Success Metrics**
- **Completion Rate**: 70-85% podle star level
- **User Engagement**: 80%+ users dokončí alespoň 1 výzvu za 3 měsíce  
- **Difficulty Progression**: Smooth progression napříč star levels
- **Category Balance**: Žádná kategorie >40% všech generovaných výzev
- **Performance**: <100ms pro challenge generation, <50ms pro progress updates

---

## 📅 **CALENDAR COLOR ADAPTATION SYSTEM**

### **🎨 Adaptive Visual Feedback (August 9, 2025)**

**Problem Solved**: Calendar colors now adapt to challenge intensity and use real daily data instead of fake estimates.

### **🔧 Technical Implementation**

#### **Challenge-Adaptive Daily Targets**
```typescript
// Calculate daily target based on challenge requirements
const dailyTarget = calculateDailyTarget(challenge.requirements);
const completionPercentage = actualProgress / dailyTarget;

// Adaptive color mapping - Final thresholds (User Optimized)
if (completionPercentage >= 0.91) return 'perfect'; // 91%+ = Perfect Day
if (completionPercentage >= 0.51) return 'good';   // 51-90% = Good Progress  
if (completionPercentage >= 0.10) return 'some';   // 10-50% = Some Activity
return 'none'; // <10% = No meaningful activity
```

### **🎯 Final Percentage Thresholds (User Optimized)**

| Activity Level | Percentage Range | Visual Representation | Star Badge |
|----------------|------------------|----------------------|------------|
| **Perfect Day** | 91%+ | Full category color | ★ Gold star |
| **Good Progress** | 51-90% | Category color + 80% opacity | None |
| **Some Activity** | 10-50% | Category color + 40% opacity | None |
| **No Activity** | <10% | Gray background (#F3F4F6) | None |

### **🎭 Visual Legend Mapping**
```
🟢 Perfect Day (91%+) - Full intensity, star badge ★
🟡 Good Progress (51-90%) - Medium intensity  
🔹 Some Activity (10-50%) - Light intensity
⚫ No Activity (<10%) - Gray background
```

### **📊 Example Challenge Scenarios**

#### **Light Challenge Example**
- **18 habits/30 days = 0.6 habits/day target**
- 1 habit completed = 166% → **Perfect Day ★**
- 0.5 habits = 83% → **Good Progress**
- 0.1 habits = 17% → **Some Activity**

#### **Intense Challenge Example**  
- **90 habits/30 days = 3 habits/day target**
- 3+ habits = 100%+ → **Perfect Day ★**
- 2 habits = 67% → **Good Progress**  
- 1 habit = 33% → **Some Activity**
- 0 habits = 0% → **No Activity**

### **🔄 Real Data Integration**

**Data Source**: Daily snapshots loaded directly from MonthlyProgressTracker instead of fake weekly estimates

```typescript
// Load real daily snapshots (not fake estimates!)
const dailySnapshot = dailySnapshots[dateString];
const dailyContributions = dailySnapshot?.dailyContributions || {};
```

**Benefits**:
- ✅ **Accurate representation** of actual daily progress
- ✅ **Challenge-specific intensity** based on requirements
- ✅ **Real-time calendar updates** when habits completed
- ✅ **User-friendly thresholds** optimized for encouragement

### **🎨 Color System Architecture**

**Category Colors with Adaptive Opacity**:
```typescript
switch (intensity) {
  case 'perfect':  // Full category color (100% opacity)
    backgroundColor = categoryColor;
    break;
  case 'good':     // Medium intensity (80% opacity)  
    backgroundColor = categoryColor + '80';
    break;
  case 'some':     // Light intensity (40% opacity)
    backgroundColor = categoryColor + '40';
    break;
  default:         // No activity (gray)
    backgroundColor = '#F3F4F6';
}
```

**Category Color Mapping**:
- 🟢 **Habits**: #22C55E (Green)
- 🔵 **Journal**: #3B82F6 (Blue)  
- 🟡 **Goals**: #F59E0B (Orange)
- 🟣 **Consistency**: #8B5CF6 (Purple)

### **📊 Weekly Breakdown Progress Calculation**

**Problem Solved**: Weekly progress % now reflects actual goal completion instead of just "active days"

#### **Intelligent Weekly Target Distribution**
```typescript
// Calculate week-specific target based on month structure
const monthTotalDays = getDaysInMonth(challenge.startDate);
const weekDays = week.length; // Usually 7, but first/last week might be partial
const weeklyTarget = (monthlyTarget * weekDays) / monthTotalDays;

// Example: 90 habits/month, 30 days total
// Week 1 (7 days): 90 * 7/30 = 21 habits target  
// Week 2 (7 days): 90 * 7/30 = 21 habits target
// Week 5 (2 days): 90 * 2/30 = 6 habits target (partial week)
```

#### **Real Progress Percentage Calculation**
```typescript
// Sum actual contributions for the week
const weekActualProgress = week.reduce((sum, day) => {
  const dailyContributions = day.contributions || {};
  return sum + Object.values(dailyContributions).reduce((a, b) => a + b, 0);
}, 0);

// Calculate true completion percentage (can exceed 100%)
const weekProgress = Math.round((weekActualProgress / weeklyTarget) * 100);

// Examples with 21 habits weekly target:
// 10 habits completed = 48%
// 21 habits completed = 100% 
// 25 habits completed = 119%
// 84 habits completed = 400% (if completed all month in first week)
```

#### **Enhanced Weekly Breakdown Display**
```
Week 1: 5/7 active | 2 some | 2 good | 1 perfect | 119%
Week 2: 3/7 active | 1 some | 1 good | 1 perfect | 67%  
Week 3: 7/7 active | 1 some | 3 good | 3 perfect | 156%
```

**Display Components**:
- **Active Count**: `{activeDays}/{totalDays} active` - How many days had any activity
- **Intensity Breakdown**: `{some} some | {good} good | {perfect} perfect` - Quality distribution  
- **True Progress**: `{actualProgress}%` - Actual completion vs weekly target (no cap at 100%)

#### **Benefits of New System**:
- ✅ **Accurate progress tracking** - Reflects real goal completion, not just "was I active"
- ✅ **Motivation for overachievers** - Can see 200%+ weeks when exceeding targets
- ✅ **Proper week comparison** - Week with 7 "some" days shows lower % than week with 7 "perfect" days
- ✅ **Partial week handling** - First/last weeks get proportional targets
- ✅ **Visual feedback** - Color-coded intensity breakdown shows effort quality

### **⭐ 9. Consistency Writer Star-Based Entry Requirements (September 2025)**

**Problem**: Consistency Writer had uniform 1-entry-per-day requirement regardless of star level, making difficulty progression too shallow.

**Solution**: Implemented star-based daily entry requirements where star level = entries required per day.

#### **Technical Implementation**

**Real-time Entry Counting System**:
```typescript
// Cache variables for tracking daily entries
private static todayJournalEntriesCount: number = 0;
private static journalCountDate: string = '';

// Increment on each journal entry  
if ((source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) && amount > 0) {
  this.incrementTodayJournalCount();
}
```

**Star-Based Streak Logic**:
```typescript
// Get challenge star level and calculate required entries
const starLevel = challenge?.starLevel || 1;
const requiredEntriesPerDay = starLevel; // 1⭐=1 entry, 5⭐=5 entries

// Only count streak when daily requirement is met
const todayJournalCount = this.countTodayJournalEntries(todayString);
if (todayJournalCount < requiredEntriesPerDay) {
  return 0; // Not enough entries for star level requirement
}
```

**Dynamic Challenge Description** (localized since July 2026 — N-3.7):
```typescript
// Update description based on star level when generating challenge (i18n, EN/DE/ES)
description: template.id === 'journal_consistency_writer'
  ? t('help.challenges.templates.journal_consistency_writer.descriptionDynamic', { count: starLevel })
  : template.description,
```

**Monthly Limit Safeguard**:
```typescript
// Prevent daily streak targets from exceeding days in month
if (this.isDailyStreakTrackingKey(template.requirementTemplates[0]?.trackingKey)) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  if (target > daysInMonth) {
    warnings.push(`Daily streak target ${target} exceeds days in month (${daysInMonth}), capping at ${daysInMonth}`);
    target = daysInMonth;
  }
}
```

#### **User Experience Examples**

**1⭐ Consistency Writer (Beginner)**:
- Target: 26 consecutive days
- Daily requirement: 1 journal entry
- Description: "Journal every single day with 1 entry per day..."

**5⭐ Consistency Writer (Master)**:
- Target: 30 consecutive days  
- Daily requirement: 5 journal entries
- Description: "Journal every single day with 5 entries per day..."

#### **Benefits**

- ✅ **True difficulty progression** - Each star level meaningfully harder
- ✅ **Clear user communication** - Description shows exact requirements
- ✅ **Real-time validation** - System counts entries and validates requirements
- ✅ **Monthly boundary safety** - Cannot exceed calendar month limitations
- ✅ **Cache-optimized** - Synchronous counting for performance

#### **Files Modified**
- `monthlyProgressTracker.ts` - Added star-based streak logic and entry counting
- `monthlyChallengeService.ts` - Added dynamic description and monthly limit safeguard
- `technical-guides:Monthly-Challenges.md` - Documentation update

### **📅 10. Monthly Limit Safeguard System (September 2025)**

**Problem**: Daily tracking challenges could theoretically generate targets exceeding calendar month limitations (e.g., 35 consecutive days in 30-day month).

**Solution**: Implemented comprehensive monthly limit safeguard system with precise date calculation.

### **🎲 11. Weighted Random Template Selection Fix (October 2025)**

**Problem**: Template selection was deterministic (always highest priority), causing same challenges to repeat monthly despite having 12+ different challenge types.

**Root Cause Analysis**:
```typescript
// ❌ BEFORE: Deterministic selection (always same result)
const selectedTemplate = finalTemplatePool.reduce((best, current) =>
  current.priority > best.priority ? current : best
);

// Results in:
// - Consistency Master ALWAYS wins in Habits category (priority: 100)
// - Perfect Month ALWAYS wins in Consistency category (priority: 100)
// - Other templates with lower priority NEVER selected
// - User gets same challenge month after month
```

**Impact**:
- **0% variety** - Same templates dominated their categories
- **User frustration** - "Why do I always get Consistency Master?"
- **Wasted content** - 8 out of 12 challenge types effectively unused
- **Anti-repeat system ineffective** - Even with -40 penalty, deterministic selection ignored it

**Solution**: Implemented weighted random selection with variance

```typescript
// ✅ AFTER: Weighted random selection (variety + respect for priority)
const weightedTemplates = finalTemplatePool.map(template => {
  let weight = template.priority; // Base: 65-100

  // Seasonal bonus: +30 for relevant months
  if (template.seasonality?.includes(currentMonth)) weight += 30;

  // Anti-repeat penalty: -40 for recently used
  if (previousTemplateIds.includes(template.id)) weight -= 40;

  // Random variance: ±20 points
  const randomVariance = (Math.random() - 0.5) * 40;
  weight = Math.max(0, weight + randomVariance);

  return { template, weight };
});

// Select highest weighted (but now with randomness)
const selected = weightedTemplates.sort((a, b) => b.weight - a.weight)[0];
```

**Selection Probability Examples (Habits in October)**:

| Template | Old System | New System |
|----------|-----------|-----------|
| Consistency Master (priority 100, seasonal) | **100%** ✓ | ~40-50% |
| Streak Builder (priority 90) | **0%** ✗ | ~25% |
| Variety Champion (priority 85) | **0%** ✗ | ~15% |
| Bonus Hunter (priority 75) | **0%** ✗ | ~10-20% |

**Key Features**:
- **Priority still matters** - Higher priority = higher chance, but not guaranteed
- **Seasonal boost** - +30 weight for seasonally relevant challenges
- **Anti-repeat protection** - -40 weight penalty for recently used templates
- **Random variance** - ±20 points ensures unpredictability
- **Variety guaranteed** - Even highest priority has only ~50% max chance

**Real-world Example**:
```
User in October 2025:
Before fix: Consistency Master (100% chance)
After fix:  45% Consistency Master, 25% Streak Builder, 15% Variety, 15% Bonus Hunter
```

**Benefits**:
- ✅ **True variety** - Users experience all 12 challenge types over time
- ✅ **Respects design** - Priority still influences selection (weighted)
- ✅ **Seasonal relevance** - October still favors back-to-school challenges
- ✅ **Anti-repeat works** - Recently used templates effectively discouraged
- ✅ **User engagement** - Fresh challenges maintain interest

**Files Modified**:
- `monthlyChallengeService.ts` - Replaced deterministic reduce with weighted random
- `technical-guides:Monthly-Challenges.md` - Added "Weighted Random Template Selection" section

**Debug Logging Added**:
```typescript
console.log('🎲 Template selection weights:', weightedTemplates.map(w => ({
  id: w.template.id,
  priority: w.template.priority,
  finalWeight: Math.round(w.weight),
  seasonal: w.isSeasonal,
  recent: w.wasRecentlyUsed
})));
```

#### **Technical Implementation**

**Target Month Awareness**:
```typescript
// Pass target month through the entire chain
generateChallengeParameters(template, userBaseline, starLevel, isFirstMonth, targetMonth)
  → createPersonalizedRequirements(template, userBaseline, starLevel, targetMonth)  
    → calculateTargetFromBaseline(template, userBaseline, starLevel, fallback, targetMonth)
```

**Precise Monthly Calculation**:
```typescript
// Support for February and leap years
if (targetMonth) {
  const [year, month] = targetMonth.split('-').map(Number);
  daysInMonth = new Date(year, month, 0).getDate(); // Accurate for all months
} else {
  // Fallback to current month
  const currentDate = new Date();
  daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
}

if (target > daysInMonth) {
  warnings.push(`Daily streak target ${target} exceeds days in ${monthName} (${daysInMonth}), capping at ${daysInMonth}`);
  target = daysInMonth;
}
```

**Protected Tracking Keys**:
- `daily_journal_streak` (Consistency Writer)
- `habit_streak_days` (Streak Builder)  
- `daily_goal_progress` (Progress Champion)
- `daily_engagement_streak` (Engagement King)
- `triple_feature_days` (Triple Master)
- `perfect_days` (Perfect Month)

#### **Monthly Limits by Calendar**
- **February (non-leap)**: Max 28 days
- **February (leap year)**: Max 29 days  
- **April, June, September, November**: Max 30 days
- **January, March, May, July, August, October, December**: Max 31 days

#### **Benefits**
- ✅ **Calendar compliance** - Never exceeds actual month duration
- ✅ **Leap year support** - Correctly handles February 29th
- ✅ **Automatic capping** - Targets reduced with warnings
- ✅ **Cross-timezone safe** - Uses target month, not current date
- ✅ **Challenge validity** - All daily challenges remain achievable

#### **Files Modified**
- `monthlyChallengeService.ts` - Added monthly limit logic and target month threading
- `technical-guides:Monthly-Challenges.md` - Documentation with monthly limits marked

---

### **📊 Balance Score - Algoritmus a vysvětlení**

Balance Score měří, jak rovnoměrně uživatel využívá všechny funkce aplikace. Používá se jako požadavek ve výzvě "Balance Expert" (kategorie Consistency, min. 4⭐).

**Jak se počítá:**
1. Načtou se všechny XP transakce za měsíc
2. XP se seskupí podle zdroje: habits, journal, goals, achievements, challenges, other
3. Zjistí se, který zdroj má nejvyšší % podíl na celkovém XP
4. Score se vypočítá podle tabulky:

| Max. zdroj (% celku) | Balance Score |
|---|---|
| ≤ 50% | 1.0 (perfektní) |
| 50-60% | 1.0 → 0.75 (lineární pokles) |
| 60-100% | 0.75 → 0.0 (strmější pokles) |

**Příklady:**
- Habits 40%, Journal 35%, Goals 25% → max 40% → Score: 1.0
- Habits 55%, Journal 25%, Goals 20% → max 55% → Score: ~0.875
- Habits 80%, Journal 10%, Goals 10% → max 80% → Score: ~0.375

**UI tooltip:** Pod progress barem pro balance_score se zobrazuje vysvětlující text ve všech lokalizacích (EN/DE/ES).

**Soubor:** `monthlyProgressTracker.ts` → `calculateBalanceScore()`

---

*Tato dokumentace je living document - aktualizuje se s rozšiřováním Monthly Challenge systému*