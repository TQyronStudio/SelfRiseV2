# SelfRise V2 Achievements System - Complete Guide

*Úplný průvodce systémem odznáčků pro majitele i vývojáře*

---

## 🚨 PRODUCTION FIX 0 — Mrtvé evaluátory: 35+ podmínek nikdy nesplnitelných (červenec 2026)

**Problém**: ~polovina achievementů se NIKDY nemohla odemknout — jejich podmínky trvale
vyhodnocovaly 0, přestože data existovala:

1. **⭐🔥👑 milestone countery** (`journal_star_count`, `journal_flame_count`,
   `journal_crown_count` — 21 podmínek: First Star, Flame Collector, Crown Royalty…)
   neměly case v `getCountValueForAchievement` → default → 0. Data přitom celou dobu
   žila ve streak_state (starCount/flameCount/crownCount).
2. **Streak podmínky** v katalogu používají AKTIVITNÍ sources (`habit_completion`,
   `journal_entry`, `goal_progress_consecutive_days`, `journal_bonus_streak`,
   `journal_golden_bonus_streak`), ale `getStreakValueForAchievement` matchoval jen
   `habit_streak`/`journal_streak` — názvy, které katalog nikde nepoužívá → 12 streak
   achievementů mrtvých (Streak Champion, Century Streak, Eternal Gratitude, Bonus Week…).
3. **`getPercentageValue`** byl `return 0` placeholder → Balanced Life mrtvý.
4. Pro Bonus Week / Golden Bonus Streak kalkulátor vůbec neexistoval — přidán
   `getBonusJournalDayStreak(minBonusPerDay)` (po sobě jdoucí dny s ≥N bonus záznamy;
   běh může končit dneškem nebo včerejškem).

**Opravy**: nové case v obou dispatch switchích (aktivitní názvy mapované na streak
kalkulátory, legacy názvy zachovány jako aliasy), countery čtené ze streak state,
percentage → `getHabitXPRatio` (0–100). `await import()` v achievementService nahrazeno
`require()` (projektová konvence „for Jest compatibility").

**Regresní síť**: `src/services/__tests__/achievementEvaluation.test.ts` — **jeden test
na každý z 75 achievementů** prohání skutečnou podmínku z katalogu přes reálné dispatch
switche (data mocky nenulové). Podmínka, která spadne do mrtvého defaultu, shodí test
pojmenovaný přímo po achievementu. **Pravidlo pro nové achievementy: přidáš-li nový
`source`, MUSÍ dostat handler — jinak tenhle test neprojde. To je záměr.**

---

## 🚨 PRODUCTION FIX 1 — Počítání dokončení ze stavu storage, ne z XP transakcí (audit F2, 2026-07-16)

**Problém (nález N-2.1)**: count podmínky s XP zdrojem (`habit_completion`,
`goal_completion`) počítaly KLADNÉ XP transakce — reverze (odškrtnutí návyku,
vrácení cíle) zapisují záporné transakce, které count nikdy nesnížil.
U cílů (GOAL_COMPLETION je záměrně exempt z limitů i rate-limitu) šlo
legendary „Achievement Unlocked" (10 dokončení) vytočit togglováním
JEDNOHO cíle.

**Fix**: `evaluateCondition` count větev směruje `goal_completion` →
`getCompletedGoalsCount()` (stav `status === 'completed'` ze storage)
a `habit_completion` → `getHabitCompletionsCount()` (reálné completion
řádky, včetně bonusových; smazání completionu počítadlo sníží).
**Rozšíření (audit F2c, N-2.6)**: `journal_entry` → `getTotalJournalEntries()`
— VŠECHNY zápisy ze storage; transakční count viděl jen zápisy 1-3 každého
dne (pozice 4-13 nesou source `journal_bonus`/`journal_bonus_milestone`,
14+ transakci vůbec nevytvoří) a smazané zápisy neodečítal.

**Související sémantika (N-2.2)**: `habit_creation` count je KUMULATIVNÍ
(„vytvořeno celkem") — `countCreatedTotal()` počítá i soft-smazané návyky
(`is_archived = 1`). Habit Builder tak nefunguje jako duplikát Seven
Wonder (7 současně aktivních).

**Regresní testy**: Group C v `achievementEvaluation.test.ts` — toggle
scénář (10 kladných transakcí + 1 dokončený cíl ⇒ count 1), pokles countu
po reverzi, kumulativní creation count.

---

# 📋 PŘEHLED VŠECH ACHIEVEMENTS - PRO MAJITELE

*Kompletní katalog všech 75 achievements v SelfRise V2 aplikaci*

## 🏃‍♂️ **HABITS - Návyky (8 achievements)**

### **First Steps** 🌱 • 50 XP • Common
**Co musí udělat**: Vytvořit svůj úplně první návyk
**Výsledek**: Uživatel začne svou cestu ke zlepšování

### **Habit Builder** 🏗️ • 100 XP • Rare  
**Co musí udělat**: Vytvořit 5 návyků celkem (počítá se každé vytvoření —
i návyk, který později smaže)
**Výsledek**: Uživatel diverzifikuje své osobní rozvoj

### **Century Club** 💯 • 200 XP • Epic
**Co musí udělat**: Dokončit 100 úkolů návyků (včetně bonusových;
odškrtnutí dokončení počítadlo sníží — počítá se skutečný stav)
**Výsledek**: Uživatel se připojí k elitním řadám konzistentních lidí

### **Consistency King** 👑 • 500 XP • Legendary
**Co musí udělat**: Dokončit 1000 úkolů návyků (stejná pravidla jako Century Club)
**Výsledek**: Uživatel se stává mistrem konzistence

### **Habit Streak Champion** 🏆 • 200 XP • Epic
**Co musí udělat**: Dosáhnout 21denní série s jakýmkoliv návykem
**Výsledek**: Uživatel buduje trvalou změnu

### **Century Streak** 📈 • 500 XP • Legendary
**Co musí udělat**: Udržet 75denní sérii s jakýmkoliv návykem
**Výsledek**: Uživatel se blíží k legendárnímu statusu

### **Multi-Tasker** 🎯 • 100 XP • Rare
**Co musí udělat**: Dokončit 5 různých návyků v jednom dni
**Výsledek**: Uživatel ukazuje rozmanitý závazek

### **Habit Legend** 🏆 • 500 XP • Legendary
**Co musí udělat**: Dosáhnout Level 50 "Specialist V" s XP převážně z aktivit návyků
**Výsledek**: Uživatel dosahuje skutečného mistrovství

---

## 📝 **JOURNAL - Deník (29 achievements)**

*Základní journaling achievements - denní praxe vděčnosti*

### **First Reflection** 🌱 • 50 XP • Common
**Co musí udělat**: Napsat svůj první zápis do deníku vděčnosti
**Výsledek**: Uživatel začne praktikovat mindfulness

### **Deep Thinker** 🧠 • 100 XP • Rare
**Co musí udělat**: Napsat zápis do deníku s alespoň 200 znaky
**Výsledek**: Uživatel ukazuje svou zamyšlenost

### **Journal Enthusiast** 📚 • 200 XP • Epic  
**Co musí udělat**: Napsat 100 zápisů do deníku (počítají se VŠECHNY
zápisy včetně bonusových; smazané zápisy se odečítají)
**Výsledek**: Uživatel buduje krásný návyk reflexe

### **Grateful Heart** 💖 • 100 XP • Rare
**Co musí udělat**: Udržet 7denní sérii psaní do deníku
**Výsledek**: Konzistence buduje vděčnost

### **Gratitude Guru** 🧘 • 200 XP • Epic
**Co musí udělat**: Dosáhnout 30denní série psaní do deníku
**Výsledek**: Uživatel se stává mistrem denní reflexe

### **Eternal Gratitude** ♾️ • 500 XP • Legendary
**Co musí udělat**: Udržet 100denní sérii deníku
**Výsledek**: Praxe vděčnosti uživatele je legendární

### **Bonus Seeker** ⭐ • 200 XP • Epic
**Co musí udělat**: Napsat 50 bonusových zápisů do deníku
**Výsledek**: Uživatel jde nad rámec své praxe vděčnosti

---

*Bonus achievements - rozšířená praxe vděčnosti s bonusovými záznamy*

### **First Star** ⭐ • 50 XP • Common
**Co musí udělat**: Získat hvězdičku (první bonusový zápis za den)
**Výsledek**: Uživatel objevuje rozšířenou vděčnost

### **Five Stars** ⭐ • 100 XP • Rare
**Co musí udělat**: Získat hvězdičku celkem 5krát
**Výsledek**: Pravidelné rozšiřování praxe vděčnosti

### **Flame Achiever** 🔥 • 125 XP • Rare
**Co musí udělat**: Získat plamínek (5 bonusů za jeden den) poprvé
**Výsledek**: Den intenzivní vděčnosti a reflexe

### **Bonus Week** ⭐ • 125 XP • Rare
**Co musí udělat**: Alespoň 1 bonus každý den po dobu 7 dní v řadě
**Výsledek**: Týden konzistentní rozšířené praxe

### **Crown Royalty** 👑 • 150 XP • Epic
**Co musí udělat**: Získat korunku (10 bonusů za jeden den) poprvé
**Výsledek**: Vrcholný den reflexe s královským statusem

### **Golden Bonus Streak** ⭐ • 200 XP • Epic
**Co musí udělat**: Alespoň 3 bonusy každý den po dobu 7 dní v řadě
**Výsledek**: Týden hluboké a rozšířené reflexe

### **Bonus Century** 💯 • 750 XP • Legendary
**Co musí udělat**: Napsat 200 bonusových zápisů celkem
**Výsledek**: Vrcholný mistr rozšířené praxe vděčnosti

---

*Hvězdička Milestones - sbíraní hvězdiček za první bonusové záznamy*

### **Star Beginner** ⭐ • 100 XP • Rare
**Co musí udělat**: Získat hvězdičku celkem 10krát
**Výsledek**: Začínající sběratel bonusových zážitků

### **Star Collector** ⭐ • 150 XP • Epic
**Co musí udělat**: Získat hvězdičku celkem 25krát
**Výsledek**: Pravidelný rozšiřovatel praxe vděčnosti

### **Star Master** ⭐ • 200 XP • Epic
**Co musí udělat**: Získat hvězdičku celkem 50krát
**Výsledek**: Mistr rozšířené denní reflexe

### **Star Champion** ⭐ • 300 XP • Epic
**Co musí udělat**: Získat hvězdičku celkem 100krát
**Výsledek**: Šampion dlouhodobé rozšířené praxe

### **Star Legend** ⭐ • 500 XP • Legendary
**Co musí udělat**: Získat hvězdičku celkem 200krát
**Výsledek**: Legendární mistr bonusových zážitků

---

*Plamínek Milestones - sbírání plamínků za intenzivní dny vděčnosti*

### **Flame Starter** 🔥 • 150 XP • Epic
**Co musí udělat**: Získat plamínek celkem 5krát
**Výsledek**: Začínající mistr intenzivních dní

### **Flame Accumulator** 🔥 • 200 XP • Epic
**Co musí udělat**: Získat plamínek celkem 10krát
**Výsledek**: Sběratel výjimečných dní vděčnosti

### **Flame Master** 🔥 • 300 XP • Epic
**Co musí udělat**: Získat plamínek celkem 25krát
**Výsledek**: Mistr systematických intenzivních dní

### **Flame Champion** 🔥 • 400 XP • Legendary
**Co musí udělat**: Získat plamínek celkem 50krát
**Výsledek**: Šampion hluboké denní reflexe

### **Flame Legend** 🔥 • 750 XP • Legendary
**Co musí udělat**: Získat plamínek celkem 100krát
**Výsledek**: Legendární mistr intenzivní praxe vděčnosti

---

*Korunka Milestones - sbírání korunek za královské dny reflexe*

### **Crown Achiever** 👑 • 200 XP • Epic
**Co musí udělat**: Získat korunku celkem 3krát
**Výsledek**: Dosáhne královských dnů reflexe

### **Crown Collector** 👑 • 350 XP • Legendary
**Co musí udělat**: Získat korunku celkem 5krát
**Výsledek**: Sběratel královských zážitků vděčnosti

### **Crown Master** 👑 • 500 XP • Legendary
**Co musí udělat**: Získat korunku celkem 10krát
**Výsledek**: Mistr královské úrovně reflexe

### **Crown Champion** 👑 • 750 XP • Legendary
**Co musí udělat**: Získat korunku celkem 25krát
**Výsledek**: Šampion královských dnů vděčnosti

### **Crown Emperor** 👑 • 1000 XP • Legendary
**Co musí udělat**: Získat korunku celkem 50krát
**Výsledek**: Císařský status v praxi hluboké reflexe

---

## 🎯 **GOALS - Cíle (8 achievements)**

### **First Vision** 🔮 • 50 XP • Common
**Co musí udělat**: Nastavit svůj první cíl
**Výsledek**: Uživatel definuje, kam má jeho cesta vést

### **Goal Getter** 🎯 • 100 XP • Rare
**Co musí udělat**: Dokončit svůj první cíl (počítají se cíle, které jsou
AKTUÁLNĚ dokončené — vrácení cíle zpět počítadlo sníží)
**Výsledek**: Uživatel přeměňuje sny na realitu

### **Ambitious** 💪 • 100 XP • Rare
**Co musí udělat**: Nastavit cíl s hodnotou 1000 nebo více
**Výsledek**: Uživatel sní ve velkém

### **Goal Champion** 🏆 • 200 XP • Epic
**Co musí udělat**: Dokončit 5 cílů
**Výsledek**: Uživatel se stává mistrem dosahování

### **Progress Tracker** 📊 • 200 XP • Epic
**Co musí udělat**: Dělat pokrok na cílech 7 po sobě jdoucích dní
**Výsledek**: Konzistence vede k úspěchu

### **Mega Dreamer** 🌟 • 200 XP • Epic
**Co musí udělat**: Nastavit cíl s hodnotou 1,000,000 nebo více
**Výsledek**: Uživatel sní v milionech

### **Achievement Unlocked** 🔓 • 500 XP • Legendary
**Co musí udělat**: Dokončit 10 cílů (10 současně dokončených cílů —
stav, ne historie kliknutí; viz PRODUCTION FIX 1)
**Výsledek**: Uživatel je legendární dosahování cílů

### **Million Achiever** 💎 • 500 XP • Legendary
**Co musí udělat**: Dokončit cíl s hodnotou 1,000,000 nebo více
**Výsledek**: Uživatel přeměňuje masivní sny na realitu

---

## 🔥 **CONSISTENCY - Konzistence (8 achievements)**

### **Weekly Warrior** ⚔️ • 100 XP • Rare
**Co musí udělat**: Udržet 7denní sérii v jakémkoliv návyku
**Výsledek**: Uživatel prokázuje svou oddanost

### **Monthly Master** 📅 • 200 XP • Epic
**Co musí udělat**: Dosáhnout 30denní série
**Výsledek**: Uživatel skutečně buduje trvalé návyky

### **Centurion** 💯 • 500 XP • Legendary
**Co musí udělat**: Dosáhnout 100 dní konzistence
**Výsledek**: Uživatel se připojí k elitním řadám mistrů návyků

### **Daily Visitor** 📱 • 100 XP • Rare
**Co musí udělat**: Být v aplikaci aktivní 7 dní po sobě (za den se počítá
den, kdy uživatel získal nějaké XP — splnil návyk, zápis nebo pokrok cíle)
**Výsledek**: Uživatel buduje zdravý návyk

### **Dedicated User** 🎯 • 200 XP • Epic
**Co musí udělat**: Být v aplikaci aktivní 30 dní po sobě (stejné pravidlo
„aktivního dne" jako Daily Visitor)
**Výsledek**: Závazek uživatele je inspirující

### **Perfect Month** 🌟 • 500 XP • Legendary
**Co musí udělat**: Mít 28+ „perfektních dní" (den s návykem I zápisem I
pokrokem cíle) v posledních klouzavých 30 dnech
**Výsledek**: Uživatel dosahuje dokonalé balance

### **Triple Crown** 👑 • 500 XP • Legendary
**Co musí udělat**: Udržet 7+ denní série v návycích, deníku i cílech současně
**Výsledek**: Uživatel dosahuje triple mastery

### **Gratitude Guardian** 🛡️ • 100 XP • Rare
**Co musí udělat**: Psát do deníku 21 po sobě jdoucích dní
**Výsledek**: Uživatel chrání svou praxi vděčnosti

---

## 👑 **MASTERY - Mistrovství (8 achievements)**

### **Dream Fulfiller** ⭐ • 200 XP • Epic
**Co musí udělat**: Dokončit 3 cíle
**Výsledek**: Uživatel přeměňuje sny na realitu

### **Level Up** 🆙 • 100 XP • Rare
**Co musí udělat**: Dosáhnout level 10 "Beginner V"
**Výsledek**: Uživatel roste silnější

### **SelfRise Expert** 🎓 • 200 XP • Epic
**Co musí udělat**: Dosáhnout level 25 "Adept V"
**Výsledek**: Uživatel zvládl základy

### **SelfRise Master** 🥇 • 500 XP • Legendary
**Co musí udělat**: Dosáhnout level 50 "Specialist V"
**Výsledek**: Uživatel je skutečným mistrem sebezdokonalování

### **Ultimate SelfRise Legend** 🏆 • 500 XP • Legendary
**Co musí udělat**: Dosáhnout level 100 "Mythic V"
**Výsledek**: Uživatel dosáhl ultimátního mistrovství

### **Balance Master** ⚖️ • 200 XP • Epic
**Co musí udělat**: Použít všechny 3 funkce v jednom dni 10x
**Výsledek**: Uživatel dosahuje životní balance

### **Trophy Collector** 🏅 • 100 XP • Rare
**Co musí udělat**: Odemknout 10 achievements
**Výsledek**: Uživatel buduje impozantní kolekci

### **Trophy Master** 🏆 • 500 XP • Legendary
**Co musí udělat**: Odemknout 25 achievements
**Výsledek**: Trophy room uživatele je legendární

---

## ✨ **SPECIAL - Speciální (14 achievements včetně Loyalty)**

### **Lightning Start** ⚡ • 100 XP • Rare
**Co musí udělat**: Vytvořit a dokončit návyk ve stejný den 3x
**Výsledek**: Uživatel jedná okamžitě

### **Seven Wonder** 🌟 • 200 XP • Epic
**Co musí udělat**: Mít 7 nebo více aktivních návyků současně
**Výsledek**: Uživatel je mistr organizace

### **Persistence Pays** 💪 • 200 XP • Epic
**Co musí udělat**: Vrátit se po 3+ denní pauze a dokončit 7 aktivit
**Výsledek**: Uživatel je comeback champion

### **SelfRise Legend** 🏆 • 500 XP • Legendary
**Co musí udělať**: Dosáhnout mistrovaní: 10 cílů + 500 návyků + 365 zápisů
**Výsledek**: Uživatel dosahuje všestranného mistrovaní

---

## 🏆 **LOYALTY - Věrnost (10 achievements)**
*Hodnotí celkový počet aktivních dní (s mezerami je to OK)*

### **First Week** 🌱 • 75 XP • Common
**Co musí udělat**: 7 aktivních dní celkem
**Výsledek**: Začátek věrnostní cesty

### **Two Weeks Strong** 💪 • 100 XP • Rare
**Co musí udělat**: 14 aktivních dní celkem
**Výsledek**: Oddanost roste

### **Three Weeks Committed** 🔥 • 125 XP • Rare
**Co musí udělat**: 21 aktivních dní celkem
**Výsledek**: Oddaný svému růstu

### **Month Explorer** 🗺️ • 150 XP • Epic
**Co musí udělat**: 30 aktivních dní celkem
**Výsledek**: Objevuje svůj potenciál

### **Two Month Veteran** ⚔️ • 200 XP • Epic
**Co musí udělat**: 60 aktivních dní celkem
**Výsledek**: Zkušený v osobním růstu

### **Century User** 💯 • 300 XP • Epic
**Co musí udělat**: 100 aktivních dní celkem
**Výsledek**: Mezi elitou uživatelů

### **Half Year Hero** 🦸‍♀️ • 500 XP • Legendary
**Co musí udělat**: 183 aktivních dní celkem
**Výsledek**: Závazek je legendární

### **Year Legend** 👑 • 1000 XP • Legendary
**Co musí udělat**: 365 aktivních dní celkem
**Výsledek**: Dosáhli legendárního statusu

### **Ultimate Veteran** 🏅 • 1500 XP • Legendary
**Co musí udělat**: 500 aktivních dní celkem
**Výsledek**: Oddanost je nepřekonatelná

### **Loyalty Master** 🏆 • 2000 XP • Legendary
**Co musí udělat**: 1000 aktivních dní celkem
**Výsledek**: Dosáhli ultimátní věrnosti

---

## 📊 **STATISTIKY PRO MAJITELE**

### **Celkový Přehled**
- **Celkem Achievements**: 75
- **Celkové možné XP**: 24,150 XP
- **Kategorie**: 6 (Habits: 8, Journal: 29, Goals: 8, Consistency: 8, Mastery: 8, Special: 14)

### **Rozložení podle obtížnosti**
- **Common (Běžné)**: 5 achievements • 50 XP každý
- **Rare (Vzácné)**: 18 achievements • 100-125 XP každý
- **Epic (Epické)**: 27 achievements • 150-300 XP každý
- **Legendary (Legendární)**: 25 achievements • 350-2000 XP každý

### **Motivační strategie**
- **Rychlé výhry**: Common achievements pro nové uživatele
- **Střednědobé cíle**: Rare a Epic achievements pro pravidelné uživatele
- **Elitní status**: Legendary achievements pro oddané uživatele
- **Dlouhodobé uznání**: Loyalty achievements pro trvalý závazek

---

---

# 🛠️ TECHNICKÁ DOKUMENTACE - PRO VÝVOJÁŘE

*Kompletní technické specifikace a implementační guidelines*

## Table of Contents

1. [Achievement System Architecture](#achievement-system-architecture)
2. [Achievement ID Standards](#achievement-id-standards)
3. [Implementation Requirements](#implementation-requirements)
4. [Preview System Integration](#preview-system-integration)
5. [Celebration System](#celebration-system)
6. [Testing & Validation](#testing--validation)

---

## Achievement System Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Only GamificationService.addXP()/subtractXP() may handle XP operations. All other systems are FORBIDDEN from containing XP logic.**

### Core Services
- **GamificationService**: Central XP management and level progression
- **XPMultiplierService**: Multiplier management (Harmony Streak, Inactive User Boost, etc.)
- **AchievementService**: Achievement unlocking and XP rewards
- **UserActivityTracker**: Analytics and user behavior tracking

### Complete Achievement System Overview

The SelfRise V2 achievement system consists of **75 achievements** across **6 categories**:

#### **System Breakdown**
- **Core System**: 42 achievements (original)
- **Loyalty System**: 10 achievements
- **Journal Bonus Achievements**: 22 achievements (⭐🔥👑 milestones)
- **Goals Expansion**: 2 additional achievements
- **Total Possible XP**: 24,150 XP from all achievements
- **Categories**: 6 (Habits: 8, Journal: 29, Goals: 8, Consistency: 8, Mastery: 8, Special: 14)

#### **User Experience Types**
```typescript
// Different achievement styles serve different users:
Perfectionists → Streak achievements (Daily Visitor, Eternal Gratitude)
Accumulators → Count achievements (Century Club, Journal Enthusiast)  
Explorers → Level achievements (SelfRise Expert, Ultimate Legend)
Loyalists → Time achievements (Century User, Year Legend)
Collectors → Meta achievements (Trophy Collector, Trophy Master)
```

#### **Engagement Strategy**
- **Early Wins**: Common achievements for first-time users
- **Medium Goals**: Rare and Epic achievements for regular users
- **Elite Status**: Legendary achievements for dedicated users  
- **Secret Rewards**: Hidden achievements for discovery motivation
- **Long-term Recognition**: Loyalty achievements for sustained commitment

---

## Achievement ID Standards 🏷️

### 🎯 Core Principle
**ALL achievement IDs MUST follow the unified kebab-case format without exception. Every achievement in the system uses consistent, descriptive, and standardized identifiers.**

### Mandatory ID Format Standards

#### **Format: kebab-case (REQUIRED)**
```typescript
// ✅ CORRECT: All IDs use kebab-case format
'first-habit'           // lowercase words, hyphens only  
'century-club'          // descriptive, clear meaning
'journal-enthusiast'    // category context included
'selfrise-master'       // compound words hyphenated
'trophy-collector-basic' // progression suffix included

// ❌ FORBIDDEN: Any other format
'firstHabit'           // camelCase - NOT ALLOWED
'first_habit'          // snake_case - NOT ALLOWED  
'FIRST_HABIT'          // SCREAMING_CASE - NOT ALLOWED
'First-Habit'          // PascalCase - NOT ALLOWED
'first habit'          // spaces - NOT ALLOWED
```

#### **ID Pattern Analysis (78 Achievements)**

Based on analysis of all existing achievements in `achievementCatalog.ts`:

**Basic Achievement IDs (Most Common)**
```typescript
// Single action achievements
'first-habit'          // First + category
'first-journal'        // First + category
'first-goal'           // First + category

// Count-based achievements  
'century-club'         // Milestone name
'habit-builder'        // Action + role
'goal-getter'          // Action + role
'journal-enthusiast'   // Category + personality

// Streak achievements
'streak-champion'      // Type + achievement
'century-streak'       // Duration + type
'grateful-heart'       // Descriptive + metaphor
'weekly-warrior'       // Duration + metaphor
```

**Compound Achievement IDs (Advanced)**
```typescript
// Level-based achievements
'level-up'             // Simple action
'selfrise-expert'      // Brand + level
'selfrise-master'      // Brand + level  
'ultimate-selfrise-legend' // Intensity + brand + level

// Complex achievements
'trophy-collector-basic' // Role + progression suffix
'trophy-collector-master' // Role + progression suffix
'balance-master'       // Skill + level
```

**Category-Prefixed IDs (Special Categories)**
```typescript
// Loyalty achievement series (10 achievements)
'loyalty-first-week'        // loyalty- prefix + milestone
'loyalty-two-weeks-strong'  // loyalty- prefix + duration + modifier
'loyalty-month-explorer'    // loyalty- prefix + duration + role
'loyalty-year-legend'       // loyalty- prefix + duration + level
'loyalty-master'           // loyalty- prefix + ultimate level
```

### Naming Convention Rules

#### **1. Descriptive Clarity (MANDATORY)**
```typescript
// IDs MUST be self-explanatory
'century-club'         // ✅ Clear: 100 completions milestone
'eternal-gratitude'    // ✅ Clear: long-term journal commitment  
'seven-wonder'         // ✅ Clear: 7 active habits simultaneously
'lightning-start'      // ✅ Clear: fast action completion

// Avoid cryptic abbreviations
'cc-100'              // ❌ Unclear: what does 'cc' mean?
'h-str-21'            // ❌ Cryptic: unclear abbreviations
'ach-001'             // ❌ Generic: no semantic meaning
```

#### **2. Category Context (RECOMMENDED)**
```typescript
// Include category context when helpful
'journal-enthusiast'   // ✅ Category clear from name
'habit-legend'         // ✅ Category clear from name
'goal-champion'        // ✅ Category clear from name
'consistency-king'     // ✅ Category clear from name

// Generic names need context
'first-steps' → 'first-habit'     // ✅ Category context added
'champion' → 'streak-champion'     // ✅ Type context added  
'master' → 'selfrise-master'       // ✅ Brand context added
```

#### **3. Progression Suffixes (SYSTEMATIC)**
```typescript
// Use consistent progression suffixes for related achievements
'trophy-collector-basic'    // Entry level
'trophy-collector-master'   // Advanced level

// Alternative progression patterns
'loyalty-first-week'        // Time-based progression
'loyalty-two-weeks-strong'  // Time + modifier
'loyalty-month-explorer'    // Time + role evolution

// Level-based progression  
'selfrise-expert'          // Level 25
'selfrise-master'          // Level 50
'ultimate-selfrise-legend' // Level 100 (ultimate prefix)
```

### ID Validation Rules

#### **Format Validation (AUTOMATED)**
```typescript
// Regex pattern for valid achievement IDs
const ACHIEVEMENT_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const validateAchievementId = (id: string): boolean => {
  // Required format checks
  if (!ACHIEVEMENT_ID_PATTERN.test(id)) return false;
  if (id.length < 3) return false;        // Minimum 3 characters
  if (id.length > 50) return false;       // Maximum 50 characters
  if (id.startsWith('-')) return false;   // Cannot start with hyphen
  if (id.endsWith('-')) return false;     // Cannot end with hyphen
  if (id.includes('--')) return false;    // No double hyphens
  
  return true;
};

// Examples of validation results:
validateAchievementId('first-habit');           // ✅ true
validateAchievementId('century-club');          // ✅ true  
validateAchievementId('loyalty-master');        // ✅ true
validateAchievementId('ultimate-selfrise-legend'); // ✅ true

validateAchievementId('FirstHabit');            // ❌ false (camelCase)
validateAchievementId('first_habit');           // ❌ false (snake_case)
validateAchievementId('first--habit');          // ❌ false (double hyphen)
validateAchievementId('-first-habit');          // ❌ false (starts with hyphen)
```

#### **Semantic Validation (MANUAL REVIEW)**
```typescript
// Required manual checks for new achievement IDs:
1. ✅ Is the ID descriptive and self-explanatory?
2. ✅ Does it avoid cryptic abbreviations?
3. ✅ Is it consistent with similar achievement naming?
4. ✅ Does it include appropriate category context?
5. ✅ Does it follow progression patterns if part of a series?
6. ✅ Is it unique across all 78 existing achievements?
7. ✅ Would a new developer understand its purpose?
```

### Implementation Standards

#### **Code References (MANDATORY)**
```typescript
// All achievement references MUST use ID constants
// ✅ CORRECT: Use typed constants
export const ACHIEVEMENT_IDS = {
  FIRST_HABIT: 'first-habit' as const,
  CENTURY_CLUB: 'century-club' as const,
  JOURNAL_ENTHUSIAST: 'journal-enthusiast' as const,
  SELFRISE_MASTER: 'selfrise-master' as const,
  LOYALTY_YEAR_LEGEND: 'loyalty-year-legend' as const
} as const;

// ❌ FORBIDDEN: Hard-coded strings in logic
if (achievementId === 'first-habit') { /* logic */ }           // Bad
if (achievementId === ACHIEVEMENT_IDS.FIRST_HABIT) { /* logic */ } // Good
```

#### **Database/Storage Keys (CONSISTENT)**
```typescript
// Achievement IDs are used directly as storage keys
AsyncStorage.setItem(`achievement_${achievementId}_unlocked`, 'true');
AsyncStorage.setItem(`achievement_first-habit_progress`, '50');

// Consistent with catalog IDs
const achievement = CORE_ACHIEVEMENTS.find(a => a.id === 'first-habit');
```

#### **Documentation Standards (REQUIRED)**
```typescript
// All new achievements MUST include ID documentation
interface Achievement {
  id: string;                    // MUST follow kebab-case format
  name: string;                  // Display name (can use any format)
  description: string;           // User-facing description
  // ... other fields
}

/**
 * Achievement: First Steps
 * ID: 'first-habit' (kebab-case format)
 * Category: Habits
 * Purpose: Onboarding milestone for new users
 * Created: 2025-08-04
 */
```

### Quality Assurance Checklist

#### **Pre-Implementation Review (MANDATORY)**
```typescript
// Before adding any new achievement, verify:
□ ID follows kebab-case format exactly
□ ID is descriptive and self-explanatory  
□ ID is unique across all existing achievements
□ ID includes appropriate category/context
□ ID follows established progression patterns
□ ID passes automated validation regex
□ ID has been manually reviewed by team
□ ID documentation is complete
□ ID constants are added to ACHIEVEMENT_IDS
□ Tests include new achievement ID validation
```

#### **Existing Achievement Compliance (VERIFIED)**
```typescript
// ALL 78 existing achievements verified as compliant:
✅ Habits Category (8 achievements): All kebab-case
✅ Journal Category (8 achievements): All kebab-case  
✅ Goals Category (7 achievements): All kebab-case
✅ Consistency Category (8 achievements): All kebab-case
✅ Mastery Category (8 achievements): All kebab-case
✅ Special Category (14 achievements): All kebab-case

// No exceptions, no legacy formats - 100% compliance achieved
```

---

## Implementation Requirements

### Data Storage & Persistence
- **Storage Method**: AsyncStorage with dedicated achievement data keys
- **Backup Strategy**: Include in existing gamification data export/import
- **Migration**: Graceful handling for existing users

### Performance Optimization
- **Achievement Check**: Single operation per achievement evaluation
- **Lazy Loading**: Achievement sections load independently
- **Minimal Impact**: <50ms addition to achievement operations
- **Memory Usage**: <2KB additional storage per user

### Integration Points
```typescript
// Required integrations:
1. GamificationService.addXP() - for XP rewards
2. AchievementService.unlockAchievement() - for achievement unlocks
3. AppInitializationService - for achievement evaluation
4. TrophyRoomStats component - for achievement display
5. Achievement notification system - for celebrations
```

### Error Handling
```typescript
// Graceful fallbacks:
- Missing achievement data → Initialize with safe defaults
- Achievement evaluation errors → Log error, continue normal operation  
- Achievement unlock failures → Retry mechanism
- Storage failures → Log error, continue normal operation
```

---

## Preview System Integration

### Achievement Preview System Requirements

**ALL achievements MUST implement:**
- ✅ **Progress Hints**: Clear progress indicators for locked achievements  
- ✅ **Completion Requirements**: Detailed requirements for unlocking
- ✅ **Smart Tooltips**: Context-aware tips and motivation
- ✅ **Visual Progress**: Progress bars showing current advancement
- ✅ **Next Milestone**: Clear indication of next achievable goal

### Implementation Checklist for New Achievements

When adding new achievement, MUST complete ALL steps:

1. **[ ] achievementCatalog.ts**: Add with kebab-case ID
2. **[ ] achievementPreviewUtils.ts**: Add progress hint logic:
   ```typescript
   case 'new-achievement-id':
     return {
       progressText: `Clear progress (${current}/${target})`,
       progressPercentage: (current/target) * 100,
       isCompleted: current >= target,
       requirementText: "User-friendly requirement",
       actionHint: "Specific action to take",
       estimatedDays: Math.ceil((target-current) / dailyRate)
     };
   ```
3. **[ ] technical-guides:Achievements.md**: Document progress examples
4. **[ ] Testing**: Verify preview hints work correctly

### Quality Standards - Preview System
- **Progress text**: Must show current/target format `"(75/100)"`
- **Requirement text**: Must be user-friendly, no technical jargon
- **Action hints**: Must provide specific guidance
- **Estimated time**: Must calculate realistic completion estimates

---

## Celebration System

### Achievement Celebration Requirements

**ALL achievement celebrations MUST include:**
- ✅ **Rarity-based color theming** - Every modal styled by achievement rarity
- ✅ **Achievement information** - Icon, name, description, XP reward
- ✅ **Completion details** - What the user accomplished to unlock it
- ✅ **Haptic feedback** - Rarity-appropriate vibration intensity
- ✅ **Sound effects** - Audio celebration matching rarity level
- ✅ **Queue system** - Multiple achievements display sequentially

### Rarity-Based XP & Theming
```typescript
// XP Rewards by Rarity
COMMON: 50 XP      // Gray theme
RARE: 100 XP       // Blue theme  
EPIC: 200 XP       // Purple theme
LEGENDARY: 500 XP  // Gold theme

// Special Loyalty XP (higher rewards)
LOYALTY_COMMON: 75 XP
LOYALTY_RARE: 100-125 XP
LOYALTY_EPIC: 150-300 XP
LOYALTY_LEGENDARY: 500-2000 XP
```

---

## Testing & Validation

### Critical Test Scenarios
```typescript
describe('Achievement System Complete Testing', () => {
  describe('Achievement ID Compliance', () => {
    it('should validate all 75 achievement IDs follow kebab-case', () => {
      // Test ID format compliance
    });
  });

  describe('Preview System Integration', () => {
    it('should show progress hints for all locked achievements', () => {
      // Test progress hint generation for all 75 achievements
    });
    
    it('should display completion requirements clearly', () => {
      // Test requirement text accuracy for all categories
    });
  });
  
  describe('Achievement Unlocking', () => {
    it('should unlock achievements with correct XP rewards', () => {
      // Test XP reward consistency with catalog
    });
    
    it('should trigger appropriate celebrations', () => {
      // Test rarity-based celebration system
    });
  });
})
```

### Edge Cases Validation
```typescript
// Critical edge cases to test:
1. New user with 0 progress → First achievement previews work
2. Long-term user with mixed progress → Accurate progress calculation
3. Achievement unlock edge cases → Proper celebration and XP award
4. Multiple simultaneous unlocks → Queue system works correctly
5. Data corruption scenarios → Graceful recovery
```

---

## Success Metrics & Analytics

### Engagement Metrics
- **Achievement Interaction**: 40% increase in achievement card taps
- **Preview Usage**: 60% of users engage with preview tooltips
- **Next Achievement Focus**: 25% increase in targeted achievement pursuit
- **Celebration Satisfaction**: 95% positive feedback on celebration experience

### Technical Performance
- **Preview Load Time**: <100ms for tooltip display
- **Achievement Evaluation**: <200ms for achievement check
- **Celebration Display**: <200ms from trigger to modal
- **Memory Usage**: <2MB additional memory footprint

---

## Achievement Display Priority System

### 🚨 CRITICAL: Achievement Display Order (Multiple Simultaneous Unlocks)

**CRESCENDO PSYCHOLOGY PRINCIPLE**: Best achievements displayed LAST for maximum emotional impact

```typescript
// ACHIEVEMENT DISPLAY PRIORITY ORDER - Crescendo Effect:
1. COMMON (50-75 XP) 🤍 - Warm-up celebration, builds excitement
2. RARE (100-125 XP) 💙 - Escalating achievement, momentum building  
3. EPIC (150-300 XP) 💜 - Major milestone, tension peaks
4. LEGENDARY (500-2000 XP) 🏆 - ULTIMATE CLIMAX! Maximum celebration!

PSYCHOLOGY RATIONALE:
- Users experience ESCALATING JOY (crescendo effect)
- Each achievement builds anticipation for the next
- Legendary achievements become EPIC FINALE celebrations
- Creates "achievement high" with sustained dopamine release
```

### Implementation Algorithm
```typescript
const sortAchievementsForDisplay = (achievements: Achievement[]): Achievement[] => {
  return achievements.sort((a, b) => {
    // 1. RARITY FIRST: Lower rarity displayed first (CRESCENDO EFFECT)
    const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3, 'legendary': 4 };
    if (a.rarity !== b.rarity) {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    }
    
    // 2. CATEGORY IMPORTANCE: Strategic category ordering
    const categoryOrder = { 
      'special': 1,      // Special achievements first (setup)
      'journal': 2,      // Personal growth (foundation)
      'habits': 3,       // Daily consistency (building)  
      'goals': 4,        // Concrete achievements (momentum)
      'consistency': 5,  // Long-term dedication (climax)
      'mastery': 6       // Ultimate mastery (finale)
    };
    if (a.category !== b.category) {
      return categoryOrder[a.category] - categoryOrder[b.category];
    }
    
    // 3. XP VALUE: Higher XP within same rarity = later display
    return a.xpReward - b.xpReward;
  });
};
```

### Display Rules
- **Sequential Display**: Each achievement modal waits for previous to close
- **Celebration Intensity**: Scales with rarity (Common: subtle → Legendary: explosive)
- **Timing Control**: 2-second minimum between achievement celebrations
- **User Control**: Allow "Skip All" for experienced users who want to continue

### Practical Example
```typescript
// User simultaneously unlocks:
const simultaneousAchievements = [
  { id: 'selfrise-master', rarity: 'legendary', xp: 500 },     // 🏆
  { id: 'first-habit', rarity: 'common', xp: 50 },            // 🤍  
  { id: 'journal-enthusiast', rarity: 'epic', xp: 200 },      // 💜
  { id: 'goal-getter', rarity: 'rare', xp: 100 }              // 💙
];

// DISPLAY ORDER (crescendo effect):
// 1st: "First Habit" (COMMON, 50 XP) - Nice start! 🤍
// 2nd: "Goal Getter" (RARE, 100 XP) - Getting better! 💙  
// 3rd: "Journal Enthusiast" (EPIC, 200 XP) - Wow, amazing! 💜
// 4th: "SelfRise Master" (LEGENDARY, 500 XP) - INCREDIBLE FINALE! 🏆🎉
```

---

## Modal Priority Coordination System

### 🚨 CRITICAL: 3-Tier Modal Priority System
```typescript
// 3-TIER MODAL PRIORITY SYSTEM - Prevents Application Freezing:
1. ACTIVITY MODALS (1st Priority - Immediate User Actions): OKAMŽITÁ PRIORITA
   - Journal: Daily complete, bonus milestones (⭐🔥👑), streak milestones
   - Habit: Completion celebrations, streak achievements  
   - Goal: Milestone celebrations, completion rewards
   - Progress: Direct user action results (add/delete progress, complete/uncomplete habits)

2. ACHIEVEMENT MODALS (2nd Priority - Achievement Unlocks): DRUHÁ PRIORITA
   - Achievement unlocks triggered by user activities
   - Rarity-based celebrations (Common, Rare, Epic, Legendary)
   - Achievement milestone rewards
   - THIS IS WHERE ACHIEVEMENT CELEBRATION MODALS BELONG

3. LEVEL-UP MODALS (3rd Priority - System Celebrations): TŘETÍ PRIORITA
   - Level-up celebrations (XP způsobí level-up)
   - Level milestone rewards
   - XP multiplier activations

COORDINATION RULES:
- SEQUENCE: Activity → Achievement → Level-up → Next queued item
- NO CONCURRENT MODALS: Each tier waits for higher priority to complete
- ERROR ISOLATION: Each tier has independent error handling to prevent app freeze
```

### Achievement Modal Integration
```typescript
// Achievement modals MUST use tier 2 priority coordination:
const { notifySecondaryModalStarted, notifySecondaryModalEnded } = useXpAnimation();

// On achievement unlock:
notifySecondaryModalStarted('achievement');
showAchievementCelebrationModal();

// On modal close:
notifySecondaryModalEnded();
```

---

## Modal Architecture Standards

### Achievement Modal Design Principles

**Modal Architecture Choice:**
- **Detail Modals**: Use `presentationStyle="pageSheet"` with `SafeAreaView` for professional slide-up experience
- **Celebration Modals**: Use `transparent` overlay with fade animation for quick notifications
- **Form Modals**: Use full-screen slide-up pattern consistent with system apps

**ScrollView Guidelines:**
- **Full-screen modals**: `flex: 1` is acceptable and recommended in `SafeAreaView`
- **Overlay modals**: Use `flexGrow` with constraints to prevent rendering conflicts
- **Always test**: Verify content visibility across different screen sizes and orientations

**Consistency Rules:**
- **AchievementDetailModal**: Full-screen slide-up (matches HabitModal/GoalModal pattern)
- **AchievementCelebrationModal**: Overlay fade (matches CelebrationModal pattern)
- **User Experience**: Maintain consistent modal behavior across similar functionality types

### Slide Animation Architecture Issue & Solution

**🚨 CRITICAL MODAL ANIMATION BUG & FIX**

**Problem Identified (2025-09-01):**
- AchievementDetailModal displayed as "small ugly popup" instead of sliding up from bottom
- After converting to slide-up architecture, modal closed instantly instead of sliding down smoothly  
- HabitModal with identical configuration worked correctly

**Root Cause Analysis:**
```typescript
// ❌ PROBLEM: Component re-rendering during slide animation
export const AchievementDetailModal = ({ visible, achievement, ... }) => {
  // Complex useEffect hooks that run on visible change
  useEffect(() => {
    if (!visible) {
      // ⚠️ STATE RESETS CAUSE RE-RENDERS DURING ANIMATION
      setProgressHint(null);
      setUserStats(null);
    }
  }, [visible]);
  
  // Component always renders, even when not visible
  return <Modal visible={visible}...>
}

// When user closes modal:
// 1. visible changes to false
// 2. useEffect hooks trigger immediately
// 3. Component re-renders during native slide animation  
// 4. Animation timing is disrupted → instant disappearance
```

**Final Solution Applied:**
```typescript
// ✅ SOLUTION: Guard clause pattern (same as working AchievementShareModal)
export const AchievementDetailModal = ({ visible, achievement, ... }) => {
  // Guard clause prevents rendering when not visible
  if (!visible) {
    return null; // Component unmounts → automatic state cleanup → no animation interference
  }
  
  // Simplified useEffect hooks - no visible dependency needed
  useEffect(() => {
    setUserStats(batchUserStats || null);
  }, [batchUserStats]);
  
  useEffect(() => {
    if (!isUnlocked) {
      setProgressHint({ /* progress data */ });
    }
  }, [isUnlocked, progress]);
  
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
}
```

**Architecture Comparison:**
```typescript
// ✅ WORKING: AchievementShareModal pattern
if (!visible) return null;
return <Modal visible={visible}...>

// ❌ BROKEN: Always-rendering pattern  
return <Modal visible={visible}...> // Re-renders during animation

// ✅ FIXED: AchievementDetailModal now uses working pattern
if (!visible) return null; 
return <Modal visible={visible}...>
```

**Key Architecture Principles:**
1. **Guard clause pattern** - prevent component rendering when not visible
2. **Component unmounting** - automatic state cleanup without animation interference
3. **Pattern consistency** - follow working modal implementations (AchievementShareModal)
4. **No complex cleanup logic** - let React handle component lifecycle naturally

**Prevention Guidelines:**
- Always use guard clause `if (!visible) return null` for slide-up modals
- Compare new modals with working reference implementations
- Test slide animations on physical devices for accurate timing
- Avoid complex useEffect cleanup during modal transitions

---

**GOLDEN RULE**: *"Every achievement tells a story - show the journey, celebrate the victory, inspire the next step"*

---

*This complete achievement system provides comprehensive recognition for all user types while maintaining motivation for continued engagement across multiple commitment styles and usage patterns. The integration of all 75 achievements creates a robust ecosystem designed for sustained user engagement.*