# 🎯 SelfRise V2 - Gamification Core System

**🎲 CO TOHLE OBSAHUJE:**
- **XP body, odměny a zdroje** - kolik XP dát za jakou akci
- **Denní limity a anti-spam** - aby lidé nemohli podvádět  
- **XP multipliery** - double XP a boosty pro neaktivní uživatele
- **Reversal logic** - jak správně odebírat XP při deletování

**🔧 KDY TOHLE POUŽÍVAT:**
- Implementuješ novou XP akci (habit, journal, goal)
- Upravuješ XP hodnoty nebo denní limity
- Řešíš problémy s XP spamováním
- Implementuješ multiplier systém

---

## Gamification Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Only GamificationService.addXP()/subtractXP() may handle XP operations. All other systems are FORBIDDEN from containing XP logic.**

### Core Services
- **GamificationService**: Central XP management and level progression (FASÁDA — viz níže)
- **XPMultiplierService**: Multiplier management (Harmony Streak, Inactive User Boost, etc.)
- **AchievementService**: Achievement unlocking and XP rewards
- **UserActivityTracker**: Analytics and user behavior tracking

### 🏗️ N28 — Postupné rozdělení GamificationService (od července 2026)

`gamificationService.ts` je god-object (~3 400 ř.), který se postupně rozděluje do
modulů v **`src/services/gamification/`**. GamificationService zůstává **fasádou**:
veřejné statické API se NEMĚNÍ (žádný konzument se nepřepisuje), metody delegují
do modulů přes `require('./gamification/<modul>') as typeof import(...)`.

**Hotové moduly:**
| Modul | Obsah | Poznámka |
|---|---|---|
| `gamification/xpLimits.ts` | Denní limity, anti-spam, multiplier škálování limitů | **PURE** — žádné I/O, data se injektují parametry; 15 unit testů (`xpLimits.test.ts`) vč. rate-limitingu, který byl v god-objectu netestovatelný |
| `gamification/levelUpEvents.ts` | Level-up event store (ukládání, historie, shown tracking, failed fallback) | Věrný port; ⚠️ dokumentovaný latentní nesoulad: zápis SQLite / čtení AsyncStorage — dnes bez konzumenta, sjednotit před přidáním konzumenta (kandidát N27) |

**Pravidla pro extrakci dalších modulů (závazný recept):**
1. Najdi sekci podle `// ===== HLAVIČKA =====` komentářů a `grep`em ověř, že její
   metody nevolá nic mimo sekci (kromě fasádních vstupů)
2. Preferuj **pure design**: modul dostává data parametry (viz xpLimits) —
   I/O zůstává ve fasádě; kde to nejde, přenes I/O věrně (viz levelUpEvents)
3. Modul NIKDY neimportuje gamificationService (cyklus!) — ani nic, co ho importuje
4. Fasádní metoda = stejná signatura, tělo = require modulu + delegace
5. Po KAŽDÉM modulu: `npx tsc --noEmit` (0) + celá test suita (aktuálně 339) —
   jeden modul = jeden commit
6. Nikdy neměň chování během extrakce — nalezené bugy dokumentuj a řeš zvlášť

**Zbývající kandidáti (pořadí dle izolovanosti, řádky ±):**
1. `PRODUCTION MONITORING` (~75 ř.) — malý, izolovaný, snadný
2. `NOTIFICATION & ANIMATION` (~60 ř.) — malý
3. `TRANSACTION MANAGEMENT` (~300 ř.) — read/rollback cesty, pozor na sdílené cache
4. `TRACKING & ANALYTICS` (~290 ř.) — POZOR: `getDailyXPData` používá mnoho sekcí,
   extrahovat až naposledy spolu s cache
5. `ENHANCED XP REWARD ENGINE` + helpers (~600 ř.) — největší, dělit dál

---

## XP Rewards & Sources

### Habit System XP
```typescript
// Scheduled vs Bonus completion
XPSourceType.HABIT_COMPLETION: 25 XP    // Scheduled day completion
XPSourceType.HABIT_BONUS: 15 XP         // Non-scheduled day completion

// Streak milestones  
XPSourceType.HABIT_STREAK_MILESTONE:
- 7 days: 75 XP
- 14 days: 100 XP  
- 30 days: 150 XP
- 50 days: 200 XP
- 100 days: 300 XP
```

### Journal System XP (Position-Based)
```typescript
// Position-based rewards with anti-spam protection
Position 1: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 2: 20 XP (XPSourceType.JOURNAL_ENTRY) 
Position 3: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 4-13: 8 XP each (XPSourceType.JOURNAL_BONUS)
Position 14+: 0 XP (ANTI-SPAM RULE)

// Bonus milestones (on top of entry XP)
Entry #4 (first bonus): +25 XP (⭐ First Bonus Milestone)
Entry #8 (fifth bonus): +50 XP (🔥 Fifth Bonus Milestone)  
Entry #13 (tenth bonus): +100 XP (👑 Tenth Bonus Milestone)

// Streak milestones
7 days: 75 XP, 21 days: 100 XP, 30 days: 150 XP, 100 days: 250 XP, 365 days: 500 XP
```

### Goal System XP  
```typescript
XPSourceType.GOAL_PROGRESS: 35 XP       // Adding progress (max 3x per goal per day)
XPSourceType.GOAL_MILESTONE:
- 25% completion: 50 XP
- 50% completion: 75 XP  
- 75% completion: 100 XP
- 100% completion: 200 XP

XPSourceType.GOAL_COMPLETION: 250 XP     // Goal completed (NO daily limits - milestone achievement)
XPSourceType.GOAL_COMPLETION: 350 XP     // BIG goal completed (targetValue ≥ 10000)
```

### System XP
```typescript
XPSourceType.ACHIEVEMENT_UNLOCK: Variable // Based on rarity (50-500 XP)
```

---

## Level Progression Model

**Jediný zdroj pravdy**: `src/services/levelCalculation.ts` —
`getXPRequiredForLevel()`, `getCurrentLevel()`, `getXPProgress()`,
`getLevelInfo()`. **Žádná komponenta si NESMÍ počítat level vlastním
vzorcem** — vždy import z levelCalculation (ověřeno auditem F1: platí).
Testy: `MathematicalModel.test.ts`, `levelProgressDisplay.test.ts`.

**Vzorec (rebalance 2026-07-16, nález N-1.7b)**: levely 1–10 historická
lineární řada (beze změny); levely 11+ mocninná křivka
`cum(L) = cum(10) × (L/10)^2.66` (`LEVEL_PROGRESSION.PROGRESSION_EXPONENT`).
Kalibrace: level 100 ≈ 2,0 M XP → max. uživatel (1200 XP/den) ho dosáhne
za ~4,6 roku (cíl Petra: „level 100 cca za 5 let").
`validateProgressionTimeline()` vrací `isValid: true` — při jakékoliv změně
exponentu ji znovu spusť a tabulku níže přegeneruj.

*Tabulka vygenerována z `generateLevelPreview(100)` — 2026-07-16, po
rebalanci křivky.*

### Fáze a milníky

| Fáze | Levely | Tituly |
|---|---|---|
| beginner | 1–10 | Novice, Beginner |
| intermediate | 11–25 | Learner, Apprentice, Adept |
| advanced | 26–50 | Seeker, Adventurer, Practitioner, Pathfinder, Specialist |
| master | 51–100 | Veteran, Expert, Guardian, Warden, Challenger, Master, Elite, Champion, Grandmaster, Mythic |

Milníkové levely (⭐ `isLevelMilestone`): **10, 25, 50, 75, 100**.

### Vybrané hodnoty (kumulativní XP potřebné pro level)

| Level | XP celkem | XP od předchozího | Titul |
|---|---|---|---|
| 1 | 100 | 100 | Novice I |
| 2 | 250 | 150 | Novice II |
| 3 | 500 | 250 | Novice III |
| 5 | 1 160 | 360 | Novice V |
| 10 ⭐ | 4 374 | 896 | Beginner V |
| 11 | 5 637 | 1 263 | Learner I |
| 15 | 12 863 | 2 157 | Learner V |
| 20 | 27 649 | 3 526 | Apprentice V |
| 25 ⭐ | 50 058 | 5 151 | Adept V |
| 30 | 81 301 | 7 011 | Seeker V |
| 40 | 174 757 | 11 382 | Practitioner V |
| 50 ⭐ | 316 384 | 16 553 | Specialist V |
| 51 | 333 497 | 17 113 | Veteran I |
| 75 ⭐ | 930 289 | 32 630 | Challenger V |
| 100 ⭐ | 1 999 656 | 52 751 | Mythic V |

### Očekávané dosahy podle typu uživatele (z `validateProgressionTimeline()`)

| Uživatel | XP/den | Level po 1 roce | Po 5 letech | Level 100 za |
|---|---|---|---|---|
| Casual | 150 | 25 | 47 | ~36 let |
| Regular | 400 | 37 | 68 | ~14 let |
| Power | 800 | 48 | 88 | ~7 let |
| Super | 1 200 | 56 | 103 | **~4,6 roku** |

### Vlastnosti křivky (po rebalanci 2026-07-16)

1. Per-level přírůstek je **hladce rostoucí** v celém rozsahu — žádný skok
   na hranici 10→11 ani propad na 50→51 (obojí byly artefakty staré
   fázové mašinerie, odstraněné spolu s ní).
2. Prahy jsou ostře rostoucí celočíselné hodnoty (ověřeno do L150).
3. Historie: do 2026-07-16 rostla křivka fázovými vzorci až k 612,5 M XP
   za level 100 (≈ 1 400 let i pro max. uživatele — nedosažitelné);
   rebalance na mocninnou křivku byla rozhodnutím Petra (audit F1,
   N-1.7b). Existujícím uživatelům se level jednorázově tiše zvýší
   (XP zůstává, prahy klesly) — před ostrým vydáním bez dopadu
   (jen TestFlight testeři).

---

## Daily Limits & Anti-Spam

### Maximum Daily Limits  
```typescript
TOTAL_DAILY_MAX: 1500 XP                // Absolute daily maximum
HABITS_MAX_DAILY: 500 XP                // From all habit activities
JOURNAL_MAX_DAILY: 415 XP               // From all journal activities  
GOALS_MAX_DAILY: 400 XP                 // From goal progress & milestones (GOAL_COMPLETION has NO limits)
ENGAGEMENT_MAX_DAILY: 200 XP            // From launches, recommendations
```

### Transaction Limits
```typescript
// Goals: Maximum 3 XP transactions per goal per day (PROGRESS and MILESTONE only)
MAX_GOAL_TRANSACTIONS_PER_DAY = 3
// 🚨 CRITICAL: GOAL_COMPLETION excluded from transaction limit
//    - Goal completion is milestone achievement, not spammable progress
//    - Users get 250 XP for completion regardless of daily progress count

// Journal: Entry position 14+ = 0 XP (spam prevention)
// Habits: No transaction limit (natural daily scheduling)
```

### Limit Distribution Rules
- **Multiplier scaling**: All limits scale proportionally with active XP multipliers
- ~~Pravidla „min. 20 % na sekci" a „max. 80 % z jednoho zdroje"~~ **ZRUŠENA**
  (rozhodnutí 2026-07-16, audit F1 nález N-1.6a): nikdy nebyla implementovaná,
  pro limitované zdroje jsou matematicky redundantní (per-source stropy ≤ 500
  < 80 % z 1500) a pro neomezené zdroje — trofeje apod. — platit nemají.

---

## XP Multiplier System

### 🚨 PRODUCTION FIX (červenec 2026): Aktivace multiplierů byla tichý no-op

**Problém 1 — split-brain zápis/čtení**: všechny 4 aktivační cesty (Harmony, Inactive
Boost, Achievement Combo, Challenge Completion) zapisovaly aktivní multiplier POUZE do AsyncStorage, ale
`getActiveMultiplier()` při `USE_SQLITE_GAMIFICATION=true` čte SQLite tabulku
`xp_multipliers` — do které zapisovala jen jednorázová migrace. Uživatel si vydřel
7denní Harmony Streak, aktivoval 2×, viděl oslavu, dostal aktivační bonus, ZAPLATIL
7denní cooldown… a žádné XP se nikdy nenásobilo, countdown se nezobrazil.
**Fix**: `storeActiveMultiplier()` / `clearActiveMultiplierStorage()` — zápis podle
feature flagu tam, kde probíhá čtení. **Pravidlo: aktivní multiplier se ukládá VÝHRADNĚ
přes tyto helpery.**

**Problém 2 — kotvení Harmony streaku na dnešku**: nedokončený dnešek (= každé ráno)
nuloval celý streak — po plném 7denním běhu končícím včera se ráno zobrazovalo 0 a
aktivace nešla. **Fix**: nedokončený DNEŠEK běh nepřerušuje (kotva na včerejšku, stejný
vzor jako journal/bonus streaky); přerušit ho může jen zmeškaný MINULÝ den.

**Problém 3 — case-mismatch zdroje**: Inactive Boost posílal `source:
'XP_MULTIPLIER_BONUS'` (UPPERCASE string ≠ enum `'xp_multiplier_bonus'`) → limity a
denní sumáře pro tento zdroj tiše selhávaly.

**Regresní testy**: `src/services/__tests__/xpMultiplier.loyalty.test.ts` (12 testů —
write→read konzistence, expirace, E2E aktivace, kotvení streaku, loyalty milestones).

### Multiplier Types & Rewards
```typescript
// Harmony Streak Multiplier (Primary System)
HARMONY_STREAK_MULTIPLIER: 2.0x XP      // Double XP for 24 hours
HARMONY_STREAK_DURATION: 24 hours        // Full day of 2x XP
HARMONY_STREAK_COOLDOWN: 168 hours       // 7 day cooldown

// Challenge Completion Multiplier  
CHALLENGE_COMPLETION_MULTIPLIER: 1.5x XP // After monthly challenge
CHALLENGE_COMPLETION_DURATION: 12 hours  // Half day of 1.5x XP
CHALLENGE_COMPLETION_COOLDOWN: 168 hours // 7 day cooldown

// Achievement Combo Multiplier (Rare)
ACHIEVEMENT_COMBO_MULTIPLIER: 2.5x XP    // 3 achievements in 24h
ACHIEVEMENT_COMBO_DURATION: 6 hours      // Short burst of 2.5x XP  
ACHIEVEMENT_COMBO_COOLDOWN: 72 hours     // 3 day cooldown

// Inactive User Return Multiplier (New System)
INACTIVE_USER_MULTIPLIER: 2.0x XP        // Double XP for comeback
INACTIVE_USER_DURATION: 48 hours         // 2 days of 2x XP
INACTIVE_USER_TRIGGER: 4+ days away      // Auto-activates on return
```

### Harmony Streak Activation Requirements
```typescript
// User must achieve ALL 3 categories daily for 7 consecutive days:
Daily Requirements for Harmony Streak:
- ✅ At least 1 habit completion (scheduled or bonus)
- ✅ At least 3 journal entries (meeting daily minimum) 
- ✅ At least 1 goal progress update

// Streak Calculation:
HARMONY_STREAK_DAYS_REQUIRED: 7          // Must maintain for 7 days
Consecutive days only - missing any requirement breaks streak

// Activation Bonus:
Multiplier activation = +240 XP          // 24h * 10 XP per hour bonus
```

### Daily Limits Scale with Multipliers
```typescript
// CRITICAL: When multiplier is active, ALL daily limits scale
Base Limits (1x):                      With 2x Multiplier:
TOTAL_DAILY_MAX: 1500 XP         →      3000 XP
HABITS_MAX_DAILY: 500 XP         →      1000 XP  
JOURNAL_MAX_DAILY: 415 XP        →      830 XP
GOALS_MAX_DAILY: 400 XP          →      800 XP (GOAL_COMPLETION still unlimited)
ENGAGEMENT_MAX_DAILY: 200 XP     →      400 XP

// Transaction limits DO NOT scale (fairness)
Goal transactions: Still 3 per goal per day
Journal anti-spam: Still entry 14+ = 0 XP
```

---

## Inactive User Re-engagement System

### ✅ COMPLETE IMPLEMENTATION
Automatically re-engage users who become inactive with 2x XP boost system that activates upon return.

### System Architecture
```typescript
// Inactive User Detection
XPMultiplierService.checkInactiveUserStatus(): {
  isInactive: boolean;           // 4+ days without app opening
  daysSinceLastActivity: number; // Exact days count
  shouldActivateBoost: boolean;  // Ready for boost activation
  lastActivityDate: string;      // Last recorded activity
}

// Auto-Activation on App Launch
AppInitializationService.initializeGamificationService() {
  const boostResult = await XPMultiplierService.checkAndActivateInactiveUserBoost();
  // Seamless activation without user interaction
}
```

### Boost Configuration
```typescript
// Inactive User Boost Settings
INACTIVE_THRESHOLD: 4 days              // Minimum inactive period
BOOST_MULTIPLIER: 2.0x XP               // Double all XP rewards
BOOST_DURATION: 48 hours                // 2 full days of boost
AUTO_ACTIVATION: true                   // Activates automatically on return
COMEBACK_BONUS: 25 XP                   // Welcome back bonus XP
```

---

## Reversal Logic (Minus XP)

### Core Principle
Every action must be fully reversible without exploitation opportunities.

### Reversal Patterns
```typescript
// Pattern 1: Delete 'add' operation → Subtract XP
User adds goal progress +5 → +35 XP ✅
User deletes that progress → -35 XP ✅  
Net result: 0 XP (fair)

// Pattern 2: Delete 'subtract' operation → Add XP back  
User adds goal regress -3 → -35 XP ❌ (penalized)
User deletes that regress → +35 XP ✅ (penalty reversed)
Net result: 0 XP (fair)

// Pattern 3: Transaction limit recovery
User has 3/3 goal transactions → Daily limit reached
User deletes 1 transaction → 2/3 transactions → Can add new progress
```

### Daily Limit Impact of Minus XP
```typescript
// CRITICAL: Minus XP operations affect daily limits
Example Goal Progress Flow:
1. Add progress +2 → +35 XP, transactions: 1/3 ✅
2. Add progress +3 → +35 XP, transactions: 2/3 ✅  
3. Add progress +1 → +35 XP, transactions: 3/3 ✅ (LIMIT REACHED)
4. Try add progress +2 → BLOCKED (limit reached) ❌

5. Delete progress from step 2 → -35 XP, transactions: 2/3 ✅
6. Add new progress +4 → +35 XP, transactions: 3/3 ✅ (SLOT RECOVERED)
```

---

## Journal XP Tracking & Anti-Spam System

### 🚨 FUNDAMENTAL PRINCIPLE
Journal XP calculation relies on accurate `journalEntryCount` tracking that MUST synchronize with actual entry creation/deletion operations.

### Position-Based XP Calculation Rules
```typescript
// Position-based calculation (NOT historical position)
Position 1: 20 XP  // First daily entry
Position 2: 20 XP  // Second daily entry  
Position 3: 20 XP  // Third daily entry
Position 4-13: 8 XP // Bonus entries (limited)
Position 14+: 0 XP  // ANTI-SPAM: No XP for excessive entries
```

### Daily Counter Tracking System
```typescript
// Two-Level Tracking Architecture
// Level 1: Storage Layer (gratitudeStorage.ts)  
const dayGratitudes = gratitudes.filter(g => g.date === input.date);
const totalCount = dayGratitudes.length + 1; // Real count of existing entries

// Level 2: Anti-Spam Layer (GamificationService.ts)
interface DailyXPData {
  journalEntryCount: number; // Daily counter for anti-spam protection
}
```

### Synchronization Requirements
```typescript
// ✅ CREATE Operation (gratitudeStorage.create)
1. Create entry in storage
2. Award XP via GamificationService.addXP()
3. GamificationService increments journalEntryCount

// ✅ DELETE Operation (gratitudeStorage.delete) 
1. Delete entry from storage
2. Subtract XP via GamificationService.subtractXP()
3. GamificationService decrements journalEntryCount

// 🚨 CRITICAL: Both operations MUST happen or counter desynchronization occurs
```

---

## Journal Bonus Milestone System

### ✅ FULLY IMPLEMENTED
**STATUS**: Bonus milestone rewards are awarded correctly in both SQLiteGratitudeStorage and gratitudeStorage

### Bonus Milestone XP Awards
```typescript
// Additional XP on top of basic entry XP - IMPLEMENTED
Entry #4 (4th journal entry): +8 XP (basic) + 25 XP (⭐ milestone) = 33 XP total
Entry #8 (8th journal entry): +8 XP (basic) + 50 XP (🔥 milestone) = 58 XP total
Entry #13 (13th journal entry): +8 XP (basic) + 100 XP (👑 milestone) = 108 XP total
```

### Implementation Locations
- **SQLiteGratitudeStorage.create()**: Lines 250-301 - Combines base XP + milestone XP in single transaction
- **gratitudeStorage.create()**: Lines 50-90 - Same logic for AsyncStorage fallback

### Implementation Details
```typescript
// In SQLiteGratitudeStorage.create() - IMPLEMENTED
// Calculate milestone XP for bonuses (⭐🔥👑)
let milestoneXpAmount = 0;
if (isBonus) {
  if (order === 4) milestoneXpAmount = XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE;  // 25 XP
  else if (order === 8) milestoneXpAmount = XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE;  // 50 XP
  else if (order === 13) milestoneXpAmount = XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE; // 100 XP
}

// Combine base XP + milestone XP for single transaction
const totalXpAmount = baseXpAmount + milestoneXpAmount;
await GamificationService.addXP(totalXpAmount, {
  source: milestoneXpAmount > 0 ? XPSourceType.JOURNAL_BONUS_MILESTONE : xpSource,
  // ...
});

// Update milestone counters (starCount, flameCount, crownCount)
if (milestoneXpAmount > 0) {
  if (order === 4) updatedStreak.starCount += 1;
  else if (order === 8) updatedStreak.flameCount += 1;
  else if (order === 13) updatedStreak.crownCount += 1;
}
```

---

## Architecture Enforcement

### Single Source of Truth
```typescript
// ✅ CORRECT: Only GamificationService handles XP
await habitStorage.createCompletion(habitId, date, isBonus)
await GamificationService.addXP(25, { source: XPSourceType.HABIT_COMPLETION })

// ❌ FORBIDDEN: Storage layers with XP logic
await habitStorage.createCompletionWithXP() // NEVER DO THIS
```

### Storage Layer Rules
```typescript
// Storage layers MUST be XP-free
habitStorage.ts   // ✅ Creates completion + calls GamificationService.addXP()
gratitudeStorage.ts // ✅ Creates entry + calls GamificationService.addXP()  
goalStorage.ts    // ✅ Creates progress + calls GamificationService.addXP()

// Storage layers MUST handle deletion XP reversal
habitStorage.deleteCompletion()     // ✅ MUST call GamificationService.subtractXP()
gratitudeStorage.delete()          // ✅ MUST call GamificationService.subtractXP()
goalStorage.deleteProgress()       // ✅ MUST call GamificationService.subtractXP()
```

---

## Performance Requirements

### 60fps Guarantee
```typescript
// Every XP operation must complete in <16.67ms
Operation speed: <16.67ms per XP operation
Caching: 100ms cache validity for smooth animations
Optimistic updates: Real-time UI with background sync
```

---

## Testing & Validation

### Mandatory Validation
```typescript  
// All XP operations MUST validate:
- Amount > 0 (for addXP)
- Valid XPSourceType
- Daily limits not exceeded
- Anti-spam rules respected
- Source ID provided when required

// All XP operations MUST handle errors gracefully
try {
  await GamificationService.addXP(amount, options)
} catch (error) {
  // XP failure MUST NOT break core functionality
  console.error('XP operation failed:', error)
}
```

### Integration with Achievements
```typescript
// Achievements NEVER add XP directly
// They ONLY call GamificationService.addXP()

await GamificationService.addXP(xpAmount, { 
  source: XPSourceType.ACHIEVEMENT_UNLOCK,
  sourceId: achievement.id,
  description: achievement.title
})

// XP amounts by rarity:
Common: 50 XP, Rare: 100 XP, Epic: 200 XP, Legendary: 500 XP
```

---

**GOLDEN RULE**: *"One gamification system, clear rules, zero exceptions, full reversibility"*