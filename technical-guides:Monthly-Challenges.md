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

---

## 📋 **PŘEHLED VŠECH TYPŮ VÝZEV**

### 🎯 **HABITS KATEGORIE (4 typy výzev)**

#### **1. Consistency Master** 
*"Dokončuj své plánované návyky konzistentně celý měsíc"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 21 návyků za měsíc *(baseline 20 → +5%)*
- **2⭐ Střední**: 22 návyků za měsíc *(baseline 20 → +10%)*  
- **3⭐ Těžká**: 23 návyků za měsíc *(baseline 20 → +15%)*
- **4⭐ Expert**: 24 návyků za měsíc *(baseline 20 → +20%)*
- **5⭐ Mistr**: 25 návyků za měsíc *(baseline 20 → +25%)*

#### **2. Variety Champion**
*"Objevuj různé návyky každý týden pro rozmanitou rutinu"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 4 různé návyky týdně *(baseline 4 → +5%)*
- **2⭐ Střední**: 4 různé návyky týdně *(baseline 4 → +10%)*
- **3⭐ Těžká**: 5 různých návyků týdně *(baseline 4 → +15%)*
- **4⭐ Expert**: 5 různých návyků týdně *(baseline 4 → +20%)*
- **5⭐ Mistr**: 5 různých návyků týdně *(baseline 4 → +25%)*

#### **3. Streak Builder**
*"Udržuj konzistentní streaky návyků po celý měsíc"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 10denní streak *(baseline 10 → +5%)*
- **2⭐ Střední**: 11denní streak *(baseline 10 → +10%)*
- **3⭐ Těžká**: 12denní streak *(baseline 10 → +15%)*
- **4⭐ Expert**: 12denní streak *(baseline 10 → +20%)*
- **5⭐ Mistr**: 13denní streak *(baseline 10 → +25%)*

#### **4. Bonus Hunter**
*"Překračuj své plánované návyky bonus dokončeními"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 8 bonus návyků za měsíc *(baseline 8 → +5%)*
- **2⭐ Střední**: 9 bonus návyků za měsíc *(baseline 8 → +10%)*
- **3⭐ Těžká**: 9 bonus návyků za měsíc *(baseline 8 → +15%)*
- **4⭐ Expert**: 10 bonus návyků za měsíc *(baseline 8 → +20%)*
- **5⭐ Mistr**: 10 bonus návyků za měsíc *(baseline 8 → +25%)*

---

### 📝 **JOURNAL KATEGORIE (4 typy výzev)**

#### **1. Reflection Expert**
*"Piš kvalitní, promyšlené záznamy v deníku konzistentně"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 85 kvalitních záznamů za měsíc *(baseline 80 → +5%)*
- **2⭐ Střední**: 88 kvalitních záznamů za měsíc *(baseline 80 → +10%)*
- **3⭐ Těžká**: 92 kvalitních záznamů za měsíc *(baseline 80 → +15%)*
- **4⭐ Expert**: 96 kvalitních záznamů za měsíc *(baseline 80 → +20%)*
- **5⭐ Mistr**: 100 kvalitních záznamů za měsíc *(baseline 80 → +25%)*

#### **2. Gratitude Guru**
*"Zvládni běžné i bonus záznamy pro perfektní vděčnost"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 105 celkových záznamů za měsíc *(baseline 100 → +5%)*
- **2⭐ Střední**: 110 celkových záznamů za měsíc *(baseline 100 → +10%)*
- **3⭐ Těžká**: 115 celkových záznamů za měsíc *(baseline 100 → +15%)*
- **4⭐ Expert**: 120 celkových záznamů za měsíc *(baseline 100 → +20%)*
- **5⭐ Mistr**: 125 celkových záznamů za měsíc *(baseline 100 → +25%)*

#### **3. Consistency Writer**
*"Piš v deníku každý jednotlivý den pro neprolomitelný návyk"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 26 dnů se záznamem za měsíc *(baseline 25 → +5%)*
- **2⭐ Střední**: 28 dnů se záznamem za měsíc *(baseline 25 → +10%)*
- **3⭐ Těžká**: 29 dnů se záznamem za měsíc *(baseline 25 → +15%)*
- **4⭐ Expert**: 30 dnů se záznamem za měsíc *(baseline 25 → +20%)*
- **5⭐ Mistr**: 30 dnů se záznamem za měsíc *(baseline 25 → +25%)*

#### **4. Depth Explorer**
*"Piš delší, detailnější záznamy pro prohloubení sebepoznání"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 210 znaků průměrně na záznam *(baseline 200 → +5%)*
- **2⭐ Střední**: 220 znaků průměrně na záznam *(baseline 200 → +10%)*
- **3⭐ Těžká**: 230 znaků průměrně na záznam *(baseline 200 → +15%)*
- **4⭐ Expert**: 240 znaků průměrně na záznam *(baseline 200 → +20%)*
- **5⭐ Mistr**: 250 znaků průměrně na záznam *(baseline 200 → +25%)*

---

### 🏆 **GOALS KATEGORIE (4 typy výzev)**

#### **1. Progress Champion**
*"Dělej konzistentní denní pokrok směrem k cílům"*

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

#### **3. Consistency Tracker**
*"Pracuj na cílech konzistentně bez vynechání dnů"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 12denní streak pokroku na cílech *(baseline 12 → +5%)*
- **2⭐ Střední**: 13denní streak pokroku na cílech *(baseline 12 → +10%)*
- **3⭐ Těžká**: 14denní streak pokroku na cílech *(baseline 12 → +15%)*
- **4⭐ Expert**: 15denní streak pokroku na cílech *(baseline 12 → +20%)*
- **5⭐ Mistr**: 15denní streak pokroku na cílech *(baseline 12 → +25%)*

#### **4. Big Dreamer**
*"Vytvoř a pracuj na ambiciózních, vysokohodnotných cílech"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: Pokrok na cílech hodnoty 1050+ *(baseline 1000 → +5%)*
- **2⭐ Střední**: Pokrok na cílech hodnoty 1100+ *(baseline 1000 → +10%)*
- **3⭐ Těžká**: Pokrok na cílech hodnoty 1150+ *(baseline 1000 → +15%)*
- **4⭐ Expert**: Pokrok na cílech hodnoty 1200+ *(baseline 1000 → +20%)*
- **5⭐ Mistr**: Pokrok na cílech hodnoty 1250+ *(baseline 1000 → +25%)*

---

### ⚡ **CONSISTENCY KATEGORIE (4 typy výzev)**

#### **1. Triple Master**
*"Používej všechny tři funkce (návyky, deník, cíle) každý den"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 16 dnů se všemi funkcemi *(baseline 15 → +5%)*
- **2⭐ Střední**: 17 dnů se všemi funkcemi *(baseline 15 → +10%)*
- **3⭐ Těžká**: 18 dnů se všemi funkcemi *(baseline 15 → +15%)*
- **4⭐ Expert**: 18 dnů se všemi funkcemi *(baseline 15 → +20%)*
- **5⭐ Mistr**: 19 dnů se všemi funkcemi *(baseline 15 → +25%)*

#### **2. Perfect Month**
*"Dosáhni denních minim (1+ návyk, 3+ záznamy) konzistentně"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 21 perfektních dnů za měsíc *(baseline 20 → +5%)*
- **2⭐ Střední**: 22 perfektních dnů za měsíc *(baseline 20 → +10%)*
- **3⭐ Těžká**: 23 perfektních dnů za měsíc *(baseline 20 → +15%)*
- **4⭐ Expert**: 24 perfektních dnů za měsíc *(baseline 20 → +20%)*
- **5⭐ Mistr**: 25 perfektních dnů za měsíc *(baseline 20 → +25%)*

#### **3. Engagement King**
*"Získej XP každý jednotlivý den zůstáváním aktivní v aplikaci"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: 26 dnů s XP za měsíc *(baseline 25 → +5%)*
- **2⭐ Střední**: 28 dnů s XP za měsíc *(baseline 25 → +10%)*
- **3⭐ Těžká**: 29 dnů s XP za měsíc *(baseline 25 → +15%)*
- **4⭐ Expert**: 30 dnů s XP za měsíc *(baseline 25 → +20%)*
- **5⭐ Mistr**: 30 dnů s XP za měsíc *(baseline 25 → +25%)*

#### **4. Balance Expert**  
*"Udržuj vyvážené XP zdroje (žádný zdroj >60% celkem)"*

**Příklady obtížnosti:**
- **1⭐ Snadná**: Balance score 0.63+ *(baseline 0.60 → +5%)*
- **2⭐ Střední**: Balance score 0.66+ *(baseline 0.60 → +10%)*
- **3⭐ Těžká**: Balance score 0.69+ *(baseline 0.60 → +15%)*
- **4⭐ Expert**: Balance score 0.72+ *(baseline 0.60 → +20%)*
- **5⭐ Mistr**: Balance score 0.75+ *(baseline 0.60 → +25%)*

---

## 🎯 **CELKOVÉ PRINCIPY SYSTÉMU**

### **🤖 Automatická personalizace**
Systém měsíčních výzev je plně automatizován a personalizován na základě uživatelovy aktivity za posledních 30 dní. Aplikace analyzuje behavioral patterns a vytváří "baseline" (normál) pro každou kategorii aktivit.

### **⭐ 5-hvězdičková obtížnost**
Každá výzva má 5 úrovní obtížnosti s progresivním XP systémem:
- **1⭐ Common** (Novice): +5% nad baseline → **500 XP**
- **2⭐ Rare** (Explorer): +10% nad baseline → **750 XP**  
- **3⭐ Epic** (Challenger): +15% nad baseline → **1,125 XP**
- **4⭐ Legendary** (Expert): +20% nad baseline → **1,688 XP**
- **5⭐ Master** (Master): +25% nad baseline → **2,532 XP**

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
  // 16 předpřipravených templates rozdělených do 4 kategorií
  static HABITS_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  static JOURNAL_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy]; 
  static GOALS_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  static CONSISTENCY_TEMPLATES: MonthlyChallengeTemplate[] = [4 typy];
  
  // Star-based scaling system
  static STAR_SCALING = {
    1: { multiplier: 1.05, xpReward: 500 },
    2: { multiplier: 1.10, xpReward: 750 },
    3: { multiplier: 1.15, xpReward: 1125 },
    4: { multiplier: 1.20, xpReward: 1688 },
    5: { multiplier: 1.25, xpReward: 2532 }
  };
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

### **🆕 First Month Special Handling**
Pro nové uživatele speciální onboarding experience:
```typescript
generateFirstMonthChallenge() {
  // Extra konzervativní targety (30% snížení)
  // Vždy 1⭐ obtížnost pro sebevědomí
  // Beginner-friendly kategorie (především Habits)
  // Onboarding tips a guidance
  // Success rate 85%+ expected
}
```

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
Jednoduché upravování obtížnosti:
```typescript
// Úprava star scaling multipliers
static STAR_SCALING = {
  1: { multiplier: 1.05 }, // +5% - lze upravit na ±2%
  2: { multiplier: 1.10 }, // +10% - lze upravit na ±3% 
  3: { multiplier: 1.15 }, // +15% - lze upravit na ±3%
  4: { multiplier: 1.20 }, // +20% - lze upravit na ±3%
  5: { multiplier: 1.25 }  // +25% - lze upravit na ±3%
};
```

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

*Tato dokumentace je living document - aktualizuje se s rozšiřováním Monthly Challenge systému*