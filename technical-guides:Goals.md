# SelfRise V2 Goals System - Complete Technical Guide

*Comprehensive reference for all Goals system mechanics, UI components, validation rules, and user interactions*

## Table of Contents

1. [Goals Architecture](#goals-architecture)
2. [Goal Creation System](#goal-creation-system)
3. [Jedno okno tvorby i úpravy](#-jedno-okno-tvorby-i-úpravy-e15)
4. [Goal Progress Tracking](#goal-progress-tracking)
5. [Goal Templates System](#goal-templates-system)
6. [Goal Analytics & Statistics](#goal-analytics--statistics)
7. [XP Integration](#xp-integration)
8. [Data Storage & Validation](#data-storage--validation)
9. [UI/UX Standards](#uiux-standards)

---

## Goals Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Goals represent specific, measurable, time-bound objectives that users want to achieve. Unlike habits (daily recurring actions), goals have defined end points and completion criteria.**

### Core Concepts
- **Goal**: A specific target with measurable progress (e.g., "Lose 10 kg", "Save $5,000")
- **Progress**: Incremental steps toward goal completion
- **Target Date**: Optional deadline for goal completion
- **Target Value**: Numerical goal (e.g., weight loss amount, savings amount)
- **Current Value**: Current progress toward target

### Goal Categories
```typescript
enum GoalCategory {
  HEALTH = 'health',           // Weight loss, fitness targets
  FINANCIAL = 'financial',     // Savings, debt payoff
  LEARNING = 'learning',       // Skills, courses, books
  CAREER = 'career',          // Job applications, networking
  PERSONAL = 'personal',       // Personal development
  OTHER = 'other'             // Custom categories
}
```

### Goal Status Types
```typescript
enum GoalStatus {
  ACTIVE = 'active',          // Currently working toward goal
  COMPLETED = 'completed',    // Target achieved
  PAUSED = 'paused',         // Temporarily suspended
  ARCHIVED = 'archived'       // No longer relevant
}
```

---

## Goal Creation System

### 🚨 Jedno okno tvorby i úpravy (E15)

`src/components/goals/composer/GoalComposer.tsx` – **jeden list** pro nový cíl i úpravu (nahradil
`GoalModal`, `GoalForm`, tříkrokové `TargetDateStepSelectionModal`, potvrzení „bez termínu?“
`TargetDateConfirmationModal` a samostatné `GoalTemplatesModal` – všechny smazány).

Shora: **živý náhled karty** (ikona a barva kategorie, název, „Kategorie · do 31. 12.“, „0 / cíl
jednotka“ – při úpravě skutečná hodnota a vyplněný pruh, věta „To je asi N jednotek za týden“) →
**název** → **„Začni z nápadu“** (jen nový cíl; `useGoalTemplates()` – vyplní název, jednotku,
kategorii a navrženou hodnotu) → **cílová hodnota + jednotka** (běžné jednotky jako čipy) →
**kategorie** (dává ikonu a barvu, `goalLook`) → **termín** → **popis**. Hlavní tlačítko jede nad
klávesnicí a nad reklamou.

**Termín:** předvolby 1 / 3 / 6 měsíců, konec roku, bez termínu, „Vybrat datum“ = měsíční kalendář
přímo v listu (minulé dny zamčené, ‹ › po měsících, ne do minulosti). Nový cíl začíná na 3 měsících
(tempo je pak čitelné; jedno ťuknutí termín odebere), úprava na stávajícím termínu / „bez termínu“.
Pod volbou řádek „So 28. února 2027 · za 92 dní“.

✅ CORRECT: list posílá **vždy** `description` i `targetDate` (prázdné = smazat) – úložiště dělá
`{...goal, ...updates}`, takže výslovné `undefined` termín při úpravě opravdu smaže.
❌ WRONG: vynechat klíč – „Bez termínu“ by při úpravě nechal starý termín.

✅ CORRECT: list zůstane otevřený, dokud úložiště neodpoví; chyba = věta `goals.errors.saveFailed`
v listu, text uživatele zůstane. ❌ WRONG: zavřít hned a chybu ukázat jinde.

### Validation Rules
Jedno pravidlo `src/components/goals/goalFormRules.ts` (test `__tests__/goalFormRules.test.ts`),
vrací klíče textů:
1. Název: 2–100 znaků po trim.
2. Cílová hodnota: > 0 a ≤ `MAX_GOAL_VALUE` (`src/constants/goals.ts`, 1 bilion – jen pojistka proti
   nesmyslu; sdílí ji i zápis pokroku a cíl z úvodu). **Desetinná čísla platí** (`parseGoalNumber`
   čte „10,5“ i „1 000 000“) – starý formulář je přes `parseInt` tiše ořezával (10,5 km → 10).
3. Jednotka: 1–20 znaků po trim. Popis: ≤ 300 znaků.
4. Hodnota cíle smí přes 100 % (rozhodnutí Petra 2026-07-19); dolní mez 0 drží datová vrstva.
5. Předvolby termínu: `presetDeadline` – měsíce drží den v měsíci, 31. připadne na poslední den
   kratšího měsíce (`addMonthsClamped`); „konec roku“ méně než 14 dní před 31. 12. = příští rok.
6. Zápis pokroku: > 0 a ≤ `MAX_GOAL_VALUE`, poznámka ≤ 200, datum Dnes / Včera / jiné skutečné datum
   ne v budoucnu (`progressDateError`, panel „Jiné“ na stránce Cílů).

---

## Goal Progress Tracking

### Progress Update System
```typescript
interface ProgressUpdate {
  goalId: string;
  amount: number;           // Progress amount (positive or negative)
  note?: string;           // Optional progress note
  timestamp: Date;         // When progress was recorded
}

// Daily transaction limits (XP integration)
MAX_GOAL_PROGRESS_PER_DAY = 3;  // Maximum 3 XP-earning updates per goal per day
```

### Progress Validation
```typescript
// SKUTEČNÉ CHOVÁNÍ (sladěno s kódem 2026-07-19, super audit N-5.6):
//
// 1. OVERACHIEVEMENT JE POVOLEN — progress smí překročit target value
//    (cíl se dokončí při >= 100 % a klidně pokračuje přes 100 %).
// 2. Pod nulu nelze — datová vrstva clampuje (Math.max(0, ...)).
// 3. Denní XP limit (3 kladné transakce / cíl / den) NEbrání zápisu:
//    zápis se VŽDY uloží, jen XP vrstva (centrální xpLimits.validateXPAddition)
//    tiše vrátí 0 XP. Žádná chybová hláška — záměr (lepší UX než blokace).
//
// ✅ HRANA N-5.9 VYŘEŠENA (Petr 2026-11-25 – s „Zpět“ u rychlého zápisu by
// byla běžná): každý zápis si pamatuje své SKUTEČNÉ XP v goal_progress.xp_awarded
// (0 nad denním stropem, 70 pod 2× násobičem, −35 za odečet, 0 za „nastavit“)
// a smazání vrátí přesně tolik (subtractXP s metadata.exactAmount). Zápisy
// z doby před sloupcem mají NULL → staré chování (odečte 35 / dohledá grant).
```

### Goal Completion Detection
```typescript
const checkGoalCompletion = (goal: Goal): boolean => {
  return goal.currentValue >= goal.targetValue;
};

// Auto-complete goals when target reached
const onProgressUpdate = async (goal: Goal, amount: number) => {
  const updatedGoal = { ...goal, currentValue: goal.currentValue + amount };
  
  if (checkGoalCompletion(updatedGoal) && goal.status === GoalStatus.ACTIVE) {
    updatedGoal.status = GoalStatus.COMPLETED;
    updatedGoal.completedAt = new Date();
    
    // Trigger completion celebration
    showGoalCompletionCelebration(updatedGoal);
  }
  
  await goalStorage.update(updatedGoal);
};
```

---

## 📱 Stránka Cíle v novém vzhledu (E14)

**Soubory:** `src/screens/goals/GoalsScreen.tsx` (data a pravidla), `src/components/goals/page/` –
`GoalsPage` (stránka), `GoalCard` (karta, pruh, čip tempa), `GoalLogSheet` (panel „Jiné“),
`GoalActionsSheet` („⋯“), `GoalsReorderView` (řazení); čistá logika `src/screens/goals/goalsPageLogic.ts`
(test `__tests__/goalsPageLogic.test.ts`). Smazány `GoalItem`, `GoalList`, `GoalListWithDragAndDrop`,
`ProgressModal`, `ProgressEntryForm` (nápověda `goals.overview` zanikla s nimi).

Shora: datum, nadpis, věta → **přehled** (aktivní / v plánu z těch s termínem / splněné) s **čárou
termínů** (dnes vlevo, každý aktivní cíl s termínem jako tečka v barvě a ikoně své kategorie; tečky, které
by se dotkly, jdou do další řady; termín po datu sedí na „dnes“; pod čárou nejvýš 6 značek měsíců, leden nese
rok) → **aktivní cíle** (karty) → **splněné** (tiché řádky, ťuk = detail, „⋯“ = smazat). Bez cílů prázdný
stav `goals.noGoals` + `noGoalsHint`. Horní řada: řazení (od 2 cílů), **šablony (dočasně do E15, pak
uvnitř okna tvorby)**, „+“.

**Karta:** ikona a barva kategorie (`goalLook`), název, „Kategorie · do 31. 12. / Bez termínu“, „⋯“; hodnota
„/ cíl jednotka“ a procento (čísla se při otevření neodvalují, P44); pruh se zářezy 25/50/75 % (rozsvítí
se při dosažení procenta – vyplacení milníku je věc úložiště) a ryskou plánu dnes; čip tempa + „zbývá N dní“
(`paceOf`); rychlé částky (`quickAmounts`) a „Jiné“. Karta je `memo` a nečte datový kontext (P42).
Na iOS přístupná karta skryje svá tlačítka → částky, „Jiné“ a „⋯“ jsou **akce karty** pro VoiceOver
(stejně jako u návyku). Jednotka je slovo uživatele, nejde vyskloňovat → u jedničky se nepíše („+1“).

### 🚨 Zápis jedním ťuknutím dělá všechno, co dřív formulář
✅ CORRECT: `GoalsScreen.handleLog` – stav cíle **před** zápisem z úložiště → `addProgress` (XP, denní strop,
milníky, dokončení – vše úložiště) → stav **po** z úložiště → dokončil-li zápis cíl, okno `goal_completion`
přes frontu + značka `goal_completion_celebrations_shown`.
❌ WRONG: porovnat se stavem z objektu karty – dvě rychlá ťuknutí by jedno dokončení oslavila dvakrát.
**Proč:** cíl dokončený jedním ťuknutím se jinak nikdy neoslaví (bod 5 E14) a karta drží starý objekt.

- Zápisy jdou **jeden po druhém v pořadí ťuknutí** (fronta ve stránce) – dvě ťuknutí = dva zápisy.
- Místo potvrzovacího okna **pruh „+1 kniha zapsáno · Zpět“** (`UndoToast`, ~4 s). „Zpět“ = existující
  `deleteProgress` (vrácení XP i přepočet; dokončení se vrátí, milníky zůstanou vyplacené) přes akce
  **nejnovějšího** vykreslení – `deleteProgress` hledá zápis ve stavu svého vykreslení.
- **Denní strop 3 XP transakcí na cíl počítá granty MÍNUS jejich vrácení** (revize E14, 2026-11-25):
  „+1 → Zpět“ místo vrátí (dřív zůstávalo obsazené a skutečný zápis dne pak nedostal nic). Počítají
  se jen `goal_progress` a `goal_milestone` – dokončení cíle místo nebere. `getDailyXPData` (SQLite);
  test `src/services/__tests__/goalXpCapCounter.test.ts`.
- **„Zpět“ běží ve stejné frontě jako zápisy** – rozběhnutý zápis nepřepíše hodnotu cíle po smazání.
- **Smazání odečtu vrací přesně** – `addXP` se `skipLimits` a `metadata.exactAmount` (bez stropu, bez
  násobiče; pod 2× šlo „odečti → Zpět“ vydělávat 70 XP za kolo).
- **Datum „dnes“ sleduje hodiny** (`useToday`: půlnoc a návrat do appky) – rychlý zápis po půlnoci
  nedostane včerejší datum.
- Selhání okna oslavy po uloženém zápisu se nehlásí jako „neuloženo“ (opakování by zapsalo dvakrát).
- **Pruh po zápisu říká jen to, co úložiště opravdu udělalo** (E14c): `addProgress` vrací
  `LoggedGoalProgress` – zápis + `xpAwarded` (skutečné XP) + `milestonesPaid` (milníky vyplacené
  **tímto** zápisem). Pruh: „+1 zapsáno“, k tomu „· 50 % – milník dosažen“ (nejvyšší vyplacený), nebo
  „· Uloženo. XP za tenhle cíl zase zítra.“ (přičtení s `xpAwarded === 0` = vyčerpané 3 XP za den;
  `null` = neznámo → nic netvrdí). Pravidlo `logNoteParts` v `goalsPageLogic.ts` (test).
  ❌ WRONG: odvozovat „bez XP“ z toho, že nepřišla událost `xpGained` (P49).
- **„Zpět“ vrací přesně to, co zápis dostal** (`goal_progress.xp_awarded`, sloupec přidán 2026-11-25
  migrací `ALTER TABLE … ADD COLUMN xp_awarded INTEGER` – staré zápisy NULL = staré chování). Čtvrté
  ťuknutí dne + „Zpět“ tak nic neodečte. Pomocná `awardedXP()` v `SQLiteGoalStorage.ts`; testy
  `sqliteGoalStorage.progressXP.test.ts` („reverses exactly its own XP“) a `database/__tests__/init.test.ts`.
- Jiskry XP letí od ťuknutého tlačítka (`registerXpOrigin` se `sourceId = goalId`).
- **Panel „Jiné“** (`GoalLogSheet`): vlastní číselník, Přičíst / Odečíst / Nastavit = `progressType`
  `add` / `subtract` / `set` 1:1 (XP pravidla úložiště beze změny: odečet bere 35 XP, nastavení XP nedává),
  náhled „teď → potom · %“, částky z karty, **datum Dnes / Včera / Jiné datum** (pravidlo
  `progressDateError` – skutečné datum, ne v budoucnu), poznámka. Částka > 0 a ≤ `MAX_GOAL_VALUE`
  (`logAmountError`). Chyba = zatřesení a věta v panelu.
- Chyby akcí = jedna klidná věta v pruhu `ProblemNote` (`goals.errors.*`), nikdy `error.message`.

## Goal Templates System

### Template Categories

#### Health Templates
```typescript
const HEALTH_TEMPLATES = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Set a target weight loss goal with healthy progress tracking.',
    category: GoalCategory.HEALTH,
    unit: 'kg',
    suggestedTargetValue: 10,
    tags: ['weight', 'health', 'fitness'],
    icon: 'fitness',
    color: '#FF6B6B',
  }
  // Note: Daily Steps and Water Intake removed (belong in Habits)
];
```

#### Financial Templates
```typescript
const FINANCIAL_TEMPLATES = [
  {
    id: 'save_money',
    title: 'Save Money',
    description: 'Build your savings with a specific target amount.',
    category: GoalCategory.FINANCIAL,
    unit: '$',
    suggestedTargetValue: 5000,
    tags: ['savings', 'money', 'financial'],
    icon: 'piggy-bank',
    color: '#4ECDC4',
  },
  {
    id: 'pay_debt',
    title: 'Pay Off Debt',
    description: 'Track progress toward eliminating debt completely.',
    category: GoalCategory.FINANCIAL,
    unit: '$',
    suggestedTargetValue: 10000,
    tags: ['debt', 'money', 'financial'],
    icon: 'credit-card',
    color: '#4ECDC4',
  }
];
```

#### Learning Templates
```typescript
const LEARNING_TEMPLATES = [
  {
    id: 'read_books',
    title: 'Read Books',
    description: 'Set an annual or monthly reading goal.',
    category: GoalCategory.LEARNING,
    unit: 'books',
    suggestedTargetValue: 12,
    tags: ['reading', 'books', 'learning'],
    icon: 'book',
    color: '#45B7D1',
  },
  {
    id: 'learn_language',
    title: 'Learn New Language',
    description: 'Track progress in language learning milestones.',
    category: GoalCategory.LEARNING,
    unit: 'levels',
    suggestedTargetValue: 5,
    tags: ['language', 'learning', 'skills'],
    icon: 'globe',
    color: '#45B7D1',
  }
];
```

### Template Selection Rules
```typescript
// Templates must represent concrete, measurable goals
// NOT daily activities (those belong in Habits)

// ✅ GOOD TEMPLATES:
// - Lose 10 kg (specific target, completion point)
// - Save $5000 (specific amount, measurable)
// - Read 24 books (countable target)
// - Learn Spanish Level B2 (specific milestone)

// ❌ BAD TEMPLATES (belong in Habits):
// - Daily Steps (daily recurring activity)
// - Water Intake (daily recurring activity)
// - Journal Entries (daily recurring activity)
```

---

## Goal Analytics & Statistics

### Goal Completion Rates
```typescript
interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;        // Percentage of completed goals
  averageTimeToComplete: number; // Days from creation to completion
  categoryBreakdown: {
    [key in GoalCategory]: {
      total: number;
      completed: number;
      rate: number;
    };
  };
}
```

### 🚨 Tempo cíle – jedno pravidlo (E14, R-17)

`paceOf(goal, today)` v `src/utils/goalCalculations.ts` (test `src/utils/__tests__/goalPace.test.ts`):
**přímka od data začátku (počáteční hodnota) k termínu (cílová hodnota)** proti skutečnému pokroku.
Dny napřed / pozadu = o kolik dní té přímky je pokrok před (za) dnešním bodem na ní. Čte ji karta cíle
(čip a ryska plánu), přehled „v plánu“ a od E15 detail (fakta tempa, graf „Ty a plán“).

| Stav | Kdy | Na kartě |
|---|---|---|
| `done` | `status = COMPLETED` nebo ≥ 100 % | čip „Splněno“ |
| `none` | bez termínu | „Bez termínu“, nic se nepočítá |
| `overdue` | termín uplynul, cíl nesplněný | teplý čip „Termín uplynul“, **nic dál nepočítá** (číslo rostoucí každý den jen kárá); nové datum přes „⋯ → Upravit cíl“ |
| `ahead` / `onPace` / `behind` | ±`PACE_TOLERANCE_DAYS` (3) kolem přímky | „o N dní napřed“ / „v plánu“ / „o N dní pozadu“ (teplá barva, ne červená) |

✅ CORRECT: kartu, přehled i detail krmí `paceOf` / `fractionOf`.
❌ WRONG: vlastní výpočet tempa v obrazovce, nebo převzetí `getGoalStats().estimatedCompletionDate`
(průměr na **den se zápisem**, datum přes `toISOString` = UTC).
**Proč:** dvě pravidla tempa = karta říká „v plánu“ a detail „pozadu“ (P37).

- Data cíle parsuje `goalDate()` **místně** (i starý tvar `DD.MM.YYYY`), nikdy `new Date('YYYY-MM-DD')`.
- `fractionOf` umí směr dolů (`startValue` > cíl – připraveno pro druh „Messen“ v E16) a smí přes 100 %.
- První den cíle není „pozadu“ (uplynulé dny se počítají nejméně jako 1).
- Starý `calculateTimelineStatus` (pásma ±1/±30 dní z odhadu) zůstává jen pro `getGoalStats().timelineStatus`
  do E15, kdy zanikají záložky Trendy a Předpovědi.

**Rychlé částky** na kartě: `quickAmounts(targetValue)` (týž soubor a test) – do 30 po jedné, do 200
[1, 5], do 2 000 [10, 50], nad tím [5, 10, 25] × řád (10 000 → 50/100/250, 1 000 000 → 5 000/10 000/25 000).
Počítá se při zobrazení z cílové hodnoty, **v datech se nic neukládá**.

**Ikona a barva cíle** = jeho kategorie: `goalLook(category)` v `src/constants/goalLook.ts` (test
`goalLook.test.ts`), barvy z palety návyků (`c.habit[...]`, kontrast symbolu přes `onHabitColor`). Čte ji karta,
čára termínů a okno „Cíl splněn“.

### Progress Prediction
```typescript
// Estimate completion date based on current progress rate
const estimateCompletion = (goal: Goal): Date | null => {
  if (!goal.targetDate || goal.currentValue >= goal.targetValue) {
    return null;
  }
  
  const progressHistory = getProgressHistory(goal.id, 30); // Last 30 days
  if (progressHistory.length < 2) return null;
  
  const dailyRate = calculateDailyProgressRate(progressHistory);
  const remainingProgress = goal.targetValue - goal.currentValue;
  const estimatedDays = Math.ceil(remainingProgress / dailyRate);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  
  return estimatedDate;
};
```

### Timeline Recommendations
```typescript
// Smart recommendations based on goal analysis
const generateTimelineRecommendations = (goal: Goal): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // Check if goal is behind schedule
  if (goal.targetDate && isGoalBehindSchedule(goal)) {
    recommendations.push({
      type: 'timeline_check',
      priority: 'medium',
      title: 'Timeline Check',
      description: 'Your goal might need a timeline adjustment or increased effort.',
      actionable: true
    });
  }
  
  // Suggest breaking down large goals
  if (goal.targetValue > 100 && goal.currentValue === 0) {
    recommendations.push({
      type: 'break_down',
      priority: 'low',
      title: 'Break It Down',
      description: 'Consider setting smaller milestone targets for better motivation.',
      actionable: false
    });
  }
  
  return recommendations;
};
```

---

## XP Integration

### Goal XP Rewards
```typescript
// XP rewards for goal-related activities
XP_REWARDS = {
  GOAL_PROGRESS: 35,          // Adding progress (max 3x per goal per day)
  GOAL_MILESTONE_25: 50,      // 25% completion milestone
  GOAL_MILESTONE_50: 75,      // 50% completion milestone
  GOAL_MILESTONE_75: 100,     // 75% completion milestone
  GOAL_COMPLETION: 250,       // Goal completion (original amount restored)
  GOAL_COMPLETION_BIG: 350,   // Large goal completion (target ≥ 10 000) — oprava N-5.7, kód je konzistentní na 10 000
};
```

**Jedno pravidlo pro 250 / 350 XP (2026-11-23):** `goalCompletionXP(targetValue)` a `BIG_GOAL_TARGET`
v `src/constants/gamification.ts`. Čte ho `SQLiteGoalStorage` (vyplacení i odečtení při návratu do
ACTIVE) **i** `GoalCompletionModal` (zobrazená odměna). Okno dřív ukazovalo vždy 250, i když velký cíl
připsal 350. Nikde jinde nepsat vlastní `>= 10000` ani pevné `GOALS.GOAL_COMPLETION` – hlídá to
`src/constants/__tests__/goalCompletionXP.test.ts`. (Zobrazená částka je před případným násobičem.)

### 🎉 Goal Completion Celebration System

#### Completion Detection & XP Awarding
```typescript
// CRITICAL: Goal completion XP is awarded when goal reaches 100%+ for first time
const justCompleted = isCompleted && !wasCompleted; // First-time completion only

if (justCompleted) {
  await GamificationService.addXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
    source: XPSourceType.GOAL_COMPLETION,
    description: `🎉 Goal completed: ${goal.title}`,
    sourceId: goal.id
  });
  console.log(`🏆 Goal completed: ${goal.title} (+250 XP)`);
}
```

#### Reversible XP Logic
```typescript
// CRITICAL: When goal drops below 100%, completion XP is subtracted
const shouldBeActive = !isCompleted && goal.status === GoalStatus.COMPLETED;

if (shouldBeActive && wasCompleted) {
  await GamificationService.subtractXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
    source: XPSourceType.GOAL_COMPLETION,
    description: `📉 Goal dropped below completion: ${goal.title}`,
    sourceId: goal.id
  });
  console.log(`📉 Goal completion reversed: ${goal.title} (-250 XP)`);
}

// Reverze platí v OBOU cestách (sjednoceno 2026-07-19, super audit N-5.2):
//  1. přímé ODEČTENÍ progressu pod target (addProgress + updateGoalValue
//     přepne COMPLETED → ACTIVE, smaže completedDate, odečte 250/350 XP),
//  2. SMAZÁNÍ progress záznamu (recalculateGoalValue — stejné chování).
//  3. ÚPRAVA CÍLOVÉ HODNOTY (goalStorage.update, 2026-11-24) — viz níže.
// Opětovné dokončení pak znovu udělí +250/350 (symetrický cyklus, net 0).
```

#### Změna cílové hodnoty znovu rozhodne „splněno" (2026-11-24)
`SQLiteGoalStorage.update` dřív jen sloučil úpravu: zvýšený target nad progress nechal cíl
COMPLETED i s vyplaceným XP, snížený target pod progress cíl nikdy nedokončil. Teď — **jen když
se mění `targetValue` a úprava nenese vlastní `status`** (vnitřní zapisovače ho posílají samy),
a jen u ACTIVE/COMPLETED:
- target zvýšen nad progress → ACTIVE, `completedDate` smazáno, odečte se XP za **starý** target
  (tolik, kolik bylo vyplaceno),
- target snížen pod progress → COMPLETED, `completedDate` = dnes, vyplatí se XP za **nový** target;
  `GoalsScreen` pak ukáže okno dokončení (stejný `celebrateCompletion` jako u progressu).
- zůstává COMPLETED, ale target přejde hranici velkého cíle (10 000) → doplatí / odečte se **rozdíl**
  350 − 250. Invariant: splněný cíl má vždy vyplaceno přesně `goalCompletionXP(aktuální target)` – to,
  co pak každá reverze odečte. Bez toho šlo úpravami targetu nahoru a dolů opakovaně vydělat rozdíl.
- Jinak se stav nemění → žádné XP. Hlídá `src/services/storage/__tests__/sqliteGoalStorage.targetEdit.test.ts`.

#### Datum zápisu pokroku (2026-11-24)
Pole data v `ProgressEntryForm` je volný text. `progressDateError` (`src/components/goals/progressEntryRules.ts`)
pustí jen skutečné datum `YYYY-MM-DD`, dnes nebo dřív (texty `goals.progress.form.errors.invalidDate` /
`futureDate`). Dřív se uložilo cokoliv – a úložiště zápisy podle data řadí i přehrává. Hlídá
`src/components/goals/__tests__/progressEntryRules.test.ts`.

#### Pořadí záznamů jednoho dne (2026-11-24)
`getProgressByGoalId` řadí `date DESC, created_at DESC, rowid DESC`. Přepočet (`recalculateGoalValue`)
přehrává záznamy od nejstaršího — řazení jen podle data vracelo záznamy jednoho dne v libovolném
pořadí a „+5, pak =10" po smazání jiného záznamu dalo 15. Hlídá
`src/services/storage/__tests__/sqliteGoalStorage.recalcOrder.test.ts`.

#### Goal Deletion & XP (rozhodnutí Petra, 2026-07-19 — paralela N-4.5 u návyků)
```typescript
// Smazání celého CÍLE (goalStorage.delete):
// - hard-delete cíle + všech progress záznamů + goal_milestones,
// - XP se NEVRACÍ — veškeré XP vydělané cílem (progress, milestones,
//   completion) uživateli zůstává.
// ZÁMĚRNÉ chování, ne bug — mazání nesmí vzít poctivě vydělané XP.
```

#### Goal Completion Modal Integration
```typescript
// Goal completion is enqueued via centralized ModalQueueContext
// GoalsScreen.tsx detects completion and enqueues:
enqueueModal({
  type: 'goal_completion',
  priority: ModalPriority.GOAL_COMPLETION,  // Priority 2
  props: { goal: freshGoal },
});

// GoalCompletionModal rendered by ModalRenderer in ModalQueueContext
// No notify functions needed - queue handles priority ordering
// onClose calls closeCurrentModal() → next modal in queue shows
```

#### User Experience Flow
```typescript
// COMPLETE GOAL COMPLETION FLOW:
1. User adds progress that reaches/exceeds 100% → goalStorage.addProgress()
2. Storage detects completion → Awards +250 XP via GamificationService
3. XP popup animation appears immediately (via XpAnimationContext)
4. Goal status updates to COMPLETED → GoalsScreen detects change
5. PRIMARY goal completion modal shows with "+250 XP" display
6. User closes modal → Modal coordination releases to show any level-up modal
7. If progress later reduces below 100% → Subtracts -250 XP automatically
```

### XP Transaction Limits
```typescript
// Daily limits to prevent XP exploitation
MAX_GOAL_TRANSACTIONS_PER_DAY = 3;

// Progress XP is only awarded 3 times per goal per day
const canAwardProgressXP = async (goalId: string): Promise<boolean> => {
  const todayTransactions = await getXPTransactionCount(goalId, 'today');
  return todayTransactions < MAX_GOAL_TRANSACTIONS_PER_DAY;
};
```

### Milestone Detection
```typescript
// SKUTEČNÁ IMPLEMENTACE (od 2026-07-19, super audit N-5.1 — milestone XP se
// při přepisu na SQLite ztratilo, obnoveno v SQLiteGoalStorage.addProgress):
//
// - Prahy 25/50/75 % → 50/75/100 XP (XPSourceType.GOAL_MILESTONE)
// - Vyhodnocuje se jen KLADNÝ směr (progressType !== 'subtract' a nové % > staré %)
// - Jeden zápis může překročit víc prahů najednou → udělí se všechny
// - ANTI-RE-EARN: "už uděleno" se persistuje v SQLite tabulce goal_milestones
//   (id = `${goalId}_xp_${threshold}`) — kolísání kolem hranice (odečti pod
//   25 %, přidej zpět) milestone NIKDY neudělí podruhé; smazání progress
//   záznamů udělené milestones neresetuje (záměr)
// - Milestone XP podléhá dennímu limitu 3 kladných transakcí/cíl/den
//   (sdílený s GOAL_PROGRESS, centrálně v xpLimits.validateXPAddition)
//
// Kryto testy: sqliteGoalStorage.progressXP.test.ts
```

---

## Data Storage & Validation

### Goal Storage Schema
```typescript
interface Goal {
  id: string;                // Unique identifier
  title: string;             // Goal title
  description?: string;      // Optional description
  category: GoalCategory;    // Goal category
  targetValue: number;       // Target amount
  currentValue: number;      // Current progress
  unit: string;             // Unit of measurement
  targetDate?: Date;        // Optional deadline
  status: GoalStatus;       // Current status
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
  completedAt?: Date;       // Completion timestamp
  tags: string[];           // Organization tags
  color?: string;           // Custom color
  icon?: string;           // Custom icon
}
```

### Progress Entry Schema
```typescript
interface ProgressEntry {
  id: string;               // Unique identifier
  goalId: string;          // Goal reference
  amount: number;          // Progress amount
  note?: string;           // Optional note
  timestamp: Date;         // When recorded
  source: 'manual' | 'auto'; // How it was added
}
```

### Validation Services
```typescript
// ŽÁDNÁ centrální GoalValidationService třída NEEXISTUJE (super audit N-5.6).
// Validace žije v čistých pravidlech, která čtou listy (E14/E15):
//   - goalFormRules.goalFormErrors()      → název / jednotka / cílová hodnota / popis
//   - goalsPageLogic.logAmountError()     → částka zápisu; progressEntryRules → datum zápisu
//   - kalendář termínu v GoalComposer     → minulé dny nejdou vybrat
// Storage vrstva nevaliduje — listy jsou jediná vstupní brána z UI.
// Přesná pravidla: viz "Validation Rules" výše.
```

---

## UI/UX Standards

### Řazení aktivních cílů (reorder mode)
Stejná sdílená komponenta a pravidla jako u návyků — **jediný zdroj pravdy**:
@technical-guides:Habits.md → „Řazení (reorder mode)". Řadí se jen sekce Aktivní cíle;
dokončené a ostatní cíle zůstávají statické. Úchyt v `GoalItem` (`showReorderHandle`)
má dotykovou plochu 44 pt se zápornými okraji, takže výška hlavičky karty se nemění.

### Visual Consistency
```typescript
// Goal card styling
GOAL_CARD_STYLES = {
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3
};

// Progress bar styling
PROGRESS_BAR_STYLES = {
  height: 8,
  borderRadius: 4,
  backgroundColor: '#E0E0E0',
  overflow: 'hidden'
};
```

### Color Coding
```typescript
// Goal status colors
STATUS_COLORS = {
  [GoalStatus.ACTIVE]: '#4CAF50',      // Green
  [GoalStatus.COMPLETED]: '#2196F3',    // Blue
  [GoalStatus.PAUSED]: '#FF9800',      // Orange
  [GoalStatus.ARCHIVED]: '#9E9E9E'     // Gray
};

// Category colors
CATEGORY_COLORS = {
  [GoalCategory.HEALTH]: '#FF6B6B',     // Red
  [GoalCategory.FINANCIAL]: '#4ECDC4',  // Teal
  [GoalCategory.LEARNING]: '#45B7D1',   // Blue
  [GoalCategory.CAREER]: '#96CEB4',     // Green
  [GoalCategory.PERSONAL]: '#FECA57',   // Yellow
  [GoalCategory.OTHER]: '#A8E6CF'       // Light green
};
```

### Accessibility Standards
```typescript
// Accessibility requirements
ACCESSIBILITY_STANDARDS = {
  // All interactive elements need accessibility labels
  accessibilityLabels: true,
  
  // Support for screen readers
  screenReaderSupport: true,
  
  // Minimum touch target size
  minimumTouchTarget: 44, // 44x44 points
  
  // Color contrast ratios
  minimumContrast: 4.5,   // WCAG AA standard
  
  // Keyboard navigation support
  keyboardNavigation: true
};
```

### Animation Standards
```typescript
// Standard animation durations
ANIMATION_DURATIONS = {
  fast: 150,      // Quick feedback
  normal: 300,    // Standard transitions
  slow: 500       // Complex animations
};

// Easing curves
EASING_CURVES = {
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
};
```

---

## Error Handling & Edge Cases

### Common Error Scenarios
```typescript
// Error handling patterns
const COMMON_ERRORS = {
  INVALID_DATE: 'Selected date is invalid or in the past',
  VALUE_TOO_LARGE: 'This number is too large', // nad MAX_GOAL_VALUE
  PROGRESS_OVERFLOW: 'Progress update would exceed target value',
  DAILY_LIMIT_REACHED: 'Daily progress update limit reached (3 updates)',
  NETWORK_ERROR: 'Unable to save goal. Please check your connection.',
  VALIDATION_ERROR: 'Please check all required fields are filled correctly'
};

// Graceful error recovery
const handleGoalError = (error: Error, operation: string) => {
  console.error(`Goal operation '${operation}' failed:`, error);
  
  // Show user-friendly error message
  showErrorMessage(COMMON_ERRORS[error.type] || 'Something went wrong. Please try again.');
  
  // Log for debugging but don't crash app
  // Continue with app functionality
};
```

### Data Recovery & Migration
```typescript
// Goal data migration for app updates
const migrateGoalData = async (version: number) => {
  switch (version) {
    case 1:
      // Add new fields with default values
      // Ensure backward compatibility
      break;
    case 2:
      // Update data structures
      // Preserve user data integrity
      break;
  }
};
```

---

**GOLDEN RULE**: *"Goals are specific, measurable targets with completion points - not daily recurring activities. One sheet creates and edits a goal; its pace is one rule (paceOf) that the card, the overview and the detail all read."*

---

*This technical guide serves as the authoritative reference for all Goals system mechanics in SelfRise V2. All development work on Goals features must strictly follow these specifications.*