# 🧪 Cache Test Scenario - Jak Otestovat Query Cache

**Date**: October 26, 2025
**Purpose**: Ověřit že query cache funguje správně a chrání make-up conversion

---

## 🔍 Původní Problém - Kde Byl 12x Load?

### Root Cause: Achievement System

**Soubor**: `src/services/achievementIntegration.ts`
**Problém**: Každá achievement check volá `habitStorage.getAll()` znovu

**Volající metody** (každá volá getAll):
1. `getHabitCreationCount()` - line 32
2. `getMaxHabitStreak()` - line 68
3. `getDailyHabitVariety()` - line 90
4. `getTotalHabitCompletions()` - line 129
5. `getDailyFeatureCombo()` - line 533
6. `getSameDayHabitCreationCompletionCount()` - line 712
7. `getActiveHabitsSimultaneousCount()` - line 761

**Trigger**: Po každém habit completion → achievement check → **7x** `habitStorage.getAll()`

**Dodatečné volání**:
- `progressAnalyzer.ts` line 74 - notification scheduling
- `userStorage.ts` line 173 - stats collection
- `backup.ts` line 102 - backup creation
- + další...

**Celkem**: ~12x během 30s session s aktivitou

---

## ✅ Naše Implementace - Co Jsme Udělali

### Query Cache v HabitsContext

**Soubor**: `src/contexts/HabitsContext.tsx`

**Implementace**:
```typescript
// Cache ref (lines 113-118)
const habitsQueryCacheRef = useRef<{
  habits: Habit[];
  completions: HabitCompletion[];
  timestamp: number;
} | null>(null);

// Invalidation function (lines 128-135)
const invalidateQueryCache = () => {
  if (habitsQueryCacheRef.current) {
    console.log('🗑️ HabitsContext: Invalidating query cache');
    habitsQueryCacheRef.current = null;
  }
};

// loadHabits with cache check (lines 143-156)
if (habitsQueryCacheRef.current) {
  const cacheAge = Date.now() - habitsQueryCacheRef.current.timestamp;
  if (cacheAge < QUERY_CACHE_TTL) {
    console.log(`⚡ HabitsContext: Using cached data (age: ${cacheAge}ms, TTL: ${QUERY_CACHE_TTL}ms)`);
    dispatch({ type: 'SET_HABITS', payload: habitsQueryCacheRef.current.habits });
    dispatch({ type: 'SET_COMPLETIONS', payload: habitsQueryCacheRef.current.completions });
    return; // ← Early return, no SQLite query!
  }
}
```

**Invalidation Triggers** (všechny implementovány):
- `createHabit()` - line 197
- `updateHabit()` - line 239
- `deleteHabit()` - line 258
- `toggleCompletion()` - line 280 ← **KRITICKÉ** pro make-up conversion
- `updateHabitOrder()` - line 312

---

## ⚠️ PROČ CACHE NEZABRAL V TESTECH?

### Problém: Různé Storage Implementace

**HabitsContext používá**:
```typescript
const habitStorage = getHabitStorageImpl(); // ← Returns SQLite or AsyncStorage
```

**AchievementIntegration používá**:
```typescript
private static habitStorage = getHabitStorageImpl(); // ← INDEPENDENT instance!
```

**Achievement Integration volá PŘÍMO**:
```typescript
await this.habitStorage.getAll() // ← Bypasses HabitsContext cache!
```

**Důsledek**:
- HabitsContext cache chrání `loadHabits()` ✅
- ALE Achievement checks volají SQLite přímo ❌
- Cache se **nepoužívá** protože achievement system má vlastní storage reference

---

## 🎯 Test Scénář #1: Ověření HabitsContext Cache

### Cíl
Ověřit že cache funguje v HabitsContext při opakovaných `loadHabits()` voláních.

### Postup
1. ✅ **Restartuj app** (čistý start)
2. ✅ **Počkej 2 sekundy** (app se načte)
3. ✅ **Swipuj dolů** na Home screenu (pull-to-refresh)
   - Tím se zavolá `actions.loadHabits()` znovu
4. ✅ **Sleduj log** - měl bys vidět:
   ```
   🔄 HabitsContext: Starting loadHabits...
   ⚡ HabitsContext: Using cached data (age: XXXms, TTL: 5000ms)  ← Toto!
   ✅ HabitsContext: Habits loaded from cache
   ```

### Očekávaný Výsledek
- První load: `💾 HabitsContext: Fetching from SQLite...`
- Druhý load (do 5s): `⚡ HabitsContext: Using cached data`

### Pokud Neuvidíš Cache Hit
- Pull-to-refresh možná neimplementován
- Nebo HabitsContext se re-mountuje (neměl by)

---

## 🎯 Test Scénář #2: Cache Invalidation Test

### Cíl
Ověřit že cache se invaliduje při změnách dat (kritické pro make-up conversion).

### Postup
1. ✅ **Otevři app** (cache se vytvoří)
2. ✅ **Toggle 1 habit** (mark as complete)
3. ✅ **Sleduj log** - měl bys vidět:
   ```
   🗑️ HabitsContext: Invalidating query cache  ← Invalidation!
   ```
4. ✅ **Swipuj pull-to-refresh** (nebo počkej na další load)
5. ✅ **Ověř log** - měl bys vidět:
   ```
   💾 HabitsContext: Fetching from SQLite...  ← Fresh data, NOT cache!
   ```

### Očekávaný Výsledek
- Po toggle: Invalidation message
- Další load: Fresh SQLite query (NOT cache hit)

### Důležitost
- **Kritické** pro make-up conversion
- Zajišťuje že po completion toggles dostaneš fresh data
- Conversion cache v `useHabitsData` dostane aktuální completions

---

## 🎯 Test Scénář #3: Achievement System Bypass

### Cíl
Ukázat že achievement checks NEPOUŽÍVAJÍ HabitsContext cache (to je OK).

### Postup
1. ✅ **Otevři app**
2. ✅ **Toggle 5 habits rychle za sebou**
3. ✅ **Sleduj log** - uvidíš:
   ```
   📊 SQLite getAll: Found 11 habits in DB  ← Opakuje se!
   📊 SQLite getAll: Mapped to 11 Habit objects
   ```

### Očekávaný Výsledek
- `SQLite getAll` se opakuje vícekrát (5-7x)
- **ŽÁDNÉ** `⚡ Using cached data` messages
- To je **SPRÁVNĚ** - achievement system volá SQLite přímo

### Proč Je To OK?
- Achievement checks jsou **asynchronní** (background)
- Neblokují UI
- SQLite queries jsou rychlé (~3-5ms)
- Optimalizace achievement systému je **jiný úkol**

---

## 🎯 Test Scénář #4: Make-up Conversion Integrity

### Cíl
Ověřit že make-up conversion stále funguje správně s cache.

### Postup (Simulace Bonus → Makeup Conversion)

**Setup**:
1. ✅ Vytvoř habit s `scheduledDays: [Monday]`
2. ✅ Nech Monday nesplněný (red day)
3. ✅ Označ Tuesday jako complete (bonus day)

**Test**:
4. ✅ **Otevři Habits calendar view**
5. ✅ **Ověř make-up conversion**:
   - Monday měl by mít **blue dot** (covered by makeup)
   - Tuesday měl by být **green** (makeup completion)
   - Completion rate měl by být ~100% (1 scheduled, 1 completed via makeup)

**Expected Log Flow**:
```
// Toggle Tuesday completion
🗑️ HabitsContext: Invalidating query cache  ← Cache invalidated
🔄 Habit toggle: CREATING completion...
✅ Habit completion created (+15 XP)

// Next useHabitsData render
🔄 HabitsContext: Starting loadHabits...
💾 HabitsContext: Fetching from SQLite...  ← Fresh data (cache was invalidated)

// Make-up conversion in useHabitsData
getHabitsContentHash() detects completion count change
conversionCacheRef.current.clear()  ← Conversion cache cleared
applySmartBonusConversion() runs with fresh completions
→ Tuesday bonus pairs with Monday missed
→ Make-up conversion successful ✅
```

### Očekávaný Výsledek
- ✅ Make-up conversion funguje
- ✅ Cache invalidation zajišťuje fresh data
- ✅ Conversion cache dostává aktuální completions

### Pokud Make-up Nefunguje
- **KRITICKÁ CHYBA** - cache invalidation selhává
- Zkontroluj že `invalidateQueryCache()` se volá v `toggleCompletion()`

---

## 🎯 Test Scénář #5: Cache TTL Expiration

### Cíl
Ověřit že cache expiruje po 5 sekundách.

### Postup
1. ✅ **Otevři app** (cache se vytvoří)
2. ✅ **Počkej 6 sekund** (více než TTL)
3. ✅ **Swipuj pull-to-refresh** (nebo trigger loadHabits jinak)
4. ✅ **Sleduj log** - měl bys vidět:
   ```
   🔄 HabitsContext: Starting loadHabits...
   ⏰ HabitsContext: Cache expired (age: 6XXXms > TTL: 5000ms)
   💾 HabitsContext: Fetching from SQLite...
   ```

### Očekávaný Výsledek
- Po 5s: Cache expiruje
- Další load: Fresh SQLite query

### Důležitost
- Zajišťuje že stará data se nedrží příliš dlouho
- Balance mezi performance a data freshness

---

## 📊 Shrnutí - Co Testovat

### ✅ MUSÍŠ OTESTOVAT (Kritické)

1. **Cache Invalidation** (Scénář #2)
   - Po toggle completion → `🗑️ Invalidating cache`
   - Další load → Fresh SQLite data
   - **Kritické** pro make-up conversion

2. **Make-up Conversion** (Scénář #4)
   - Bonus day páruje s missed day
   - Calendar view ukazuje blue dot + green completion
   - Completion rate správně počítá makeup

### 🔧 MŮŽEŠ OTESTOVAT (Nice-to-have)

3. **Cache Hit** (Scénář #1)
   - Pull-to-refresh do 5s → Cache hit
   - Ukazuje že cache funguje

4. **Cache Expiration** (Scénář #5)
   - Po 6s → Cache expiruje
   - Fresh data loading

### ℹ️ INFORMATIVNÍ (Ne nutné)

5. **Achievement Bypass** (Scénář #3)
   - Achievement checks volají SQLite přímo
   - To je OK a očekávané

---

## ✅ Success Criteria

### Minimální Požadavky
- [x] Cache invalidation funguje (vidíš `🗑️` log)
- [x] Make-up conversion funguje správně
- [ ] Žádné crashy nebo chyby
- [ ] Data jsou vždy fresh po mutations

### Bonus
- [ ] Vidíš `⚡ Using cached data` log (cache hit)
- [ ] Cache expiruje po 5s

---

## 🚨 Red Flags - Kdy Je Problém

### CRITICAL - Zastavit Vše
- ❌ Make-up conversion nefunguje (bonus nepáruje s missed)
- ❌ Stará data po completion toggle
- ❌ App crashuje

### WARNING - Investigate
- ⚠️ Cache se nikdy nepoužívá (žádné `⚡` logy)
- ⚠️ Cache se neinvaliduje po mutations (žádné `🗑️` logy)

### OK - Není Problém
- ✅ `SQLite getAll` se opakuje (achievement system bypass)
- ✅ Žádné cache hits (pokud není pull-to-refresh)
- ✅ Cache expiruje po 5s

---

## 🎯 Závěr - Co Ti Pošlu

Po testech mi prosím pošli:

1. ✅ **Log z Scénáře #2** (Cache invalidation test)
2. ✅ **Screenshot make-up conversion** (Scénář #4)
3. ✅ **Info jestli cache hits fungují** (Scénář #1)

To mi ukáže jestli implementace je **100% funkční** nebo jestli potřebuje adjustments.
