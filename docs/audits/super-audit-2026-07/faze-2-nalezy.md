# Fáze 2 — nálezy (super audit 2026-07)

Datum: 2026-07-16 | Commit: `6bd9c27` | Node: v24.18.0 (nvm) | Session: #2 dle dávkování (2.0 + 2a + 2b)
Baseline: tsc 0 chyb (exit 0) | suites Fáze 2 — doslovný výstup:

```
Test Suites: 3 passed, 3 total
Tests:       107 passed, 107 total
```

(`achievementEvaluation.test.ts` 89 + `AchievementLogic.test.ts` + `storageSplitBrain.test.ts` 7 —
druhá jmenovaná dokrývá zbytek do 107. Batch-size invariant katalog=78 kryt splitBrain suite.)

**Scope této session**: 2.0 baseline + 2a HABITS (8) + 2b GOALS (8).
Zbytek Fáze 2 (2c–2i) = další sessions.

## Společné evaluační cesty (platí pro více položek níže)

- **Trigger při vytvoření** (bez XP): `HabitsContext.tsx:214` a
  `GoalsContext.tsx:178` volají `runBatchAchievementCheck({forceUpdate:true})`
  po vytvoření návyku/cíle → creation/value achievementy se vyhodnotí okamžitě.
- **Trigger po XP akci**: `gamificationService.ts:917` →
  `checkAchievementsAfterXPAction` (completions, streaky).
- **Trigger při startu**: `AchievementContext.tsx:178` batch check.
- **Count s XP zdrojem** (`habit_completion`, `goal_completion` jsou hodnoty
  `XPSourceType`): `evaluateCondition` case 'count'
  (achievementService.ts:206-214) počítá **jen kladné transakce**
  (`t.amount > 0`) z `getAllTransactions()`. `subtractXP` přitom zapisuje
  záporné transakce (gamificationService.ts:1018) → reverze count NIKDY
  nesníží → nález N-2.1.
- **Count s custom zdrojem**: dispatch
  `AchievementIntegration.getCountValueForAchievement` (:949-1032).
- **Unlock → XP → modal**: ověřeno ve Fázi 1 (ACHIEVEMENT_UNLOCK přes addXP,
  event `achievementUnlocked` → AchievementContext → ModalQueue).

## Položky

### 2.0 Baseline
- **Verdikt**: ✅ — viz výstup výše; navíc `catalog sanity: 78 achievements
  loaded` je přímo test v suite (achievementEvaluation.test.ts:84).
- Pozn. k pokrytí: Group A testů je „liveness" kontrola dispatch switchů
  (mock 999 / kladné transakce) — **netestuje sémantiku** transakčního
  počítání (viz N-2.1); Group B testuje kalkulátory proti reálné SQLite.

### first-habit (HABITS, count habit_creation ≥ 1, 50 XP Common)
- **Kde**: katalog :20-32; hodnota `getHabitCreationCount`
  (achievementIntegration.ts:32-63) = `habitStorage.getAll().length`.
- **Pravidlo**: guide „Vytvořit svůj úplně první návyk", 50 XP Common ✓
  (xpReward = ACHIEVEMENT_XP_REWARDS[COMMON], katalog :26).
- **Ověřeno jak**: trasování creation trigger (HabitsContext:214 hned po
  vytvoření — nutné, protože creation nedává XP) + Group A test + tutorial
  gate (`armTutorialAchievementGate('first-habit')`, HabitForm.tsx:242).
- **Verdikt**: ✅

### habit-builder (count habit_creation ≥ 5, 100 XP Rare)
- **Kde**: katalog :41-53; stejná datová cesta jako first-habit.
- **Verdikt**: ⚠️ — funguje, ale sémantický drift N-2.2: počítá se počet
  AKTUÁLNĚ EXISTUJÍCÍCH návyků (`habits.length`, :34-37), ne „vytvořeno
  celkem". Kdo vytvořil 5 návyků postupně, ale mezitím mazal, neodemkne,
  dokud nemá 5 najednou. Guide říká „Vytvořit 5 různých návyků".

### century-club (count habit_completion ≥ 100, 200 XP Epic)
- **Kde**: katalog :62-74; hodnota = počet kladných `habit_completion`
  transakcí (achievementService.ts:206-214).
- **Verdikt**: ⚠️ — funguje pro poctivého uživatele (každé dokončení = 1
  kladná tx), ale N-2.1: odškrtnutí completionu count nesníží (záporná tx
  ignorována) → počítá „kolikrát kdy zaškrtl", ne „kolik dokončení reálně
  má". Zneužitelnost mírněná rate-limitem a denním stropem HABITS 500 XP
  (~20 scheduled/den), přesto count roste i čistým toggle cyklem.
  Pozn.: bonus completions (`habit_bonus`) se NEpočítají — jen scheduled;
  guide říká obecně „100 úkolů návyků" → upřesnit v guide.

### consistency-king (count habit_completion ≥ 1000, 500 XP Legendary)
- **Kde**: katalog :83-95. Stejná cesta i verdikt jako century-club.
- **Verdikt**: ⚠️ (N-2.1 + bonus-vs-scheduled poznámka)

### streak-champion (streak habit_completion ≥ 21, 200 XP Epic)
- **Kde**: katalog :104-116; dispatch streak case 'habit_completion'
  (achievementIntegration.ts:1052-1054) → `getMaxHabitStreak` (:68-85)
  = max `currentStreak` přes všechny návyky (z `getHabitStats`).
- **Ověřeno jak**: dispatch živý (Group A test), event-driven vyhodnocení
  (po každém completion XP) → v den dosažení 21 se unlockne.
- **Verdikt**: ✅ s poznámkou N-2.4 (currentStreak, ne longest — zmeškaná
  evaluace se nedožene; správnost výpočtu streaku samotného ověří Fáze 4).

### century-streak (streak habit_completion ≥ 75, 500 XP Legendary)
- **Kde**: katalog :125-137. Stejná cesta jako streak-champion.
- **Verdikt**: ✅ (N-2.4)

### multi-tasker (count daily_habit_variety ≥ 5, timeframe 'daily', 100 XP Rare)
- **Kde**: katalog :146-158; `getDailyHabitVariety`
  (achievementIntegration.ts:90-124) = MAX počet unikátních návyků
  dokončených v jednom dni (přes všechny dny).
- **Verdikt**: ✅ s poznámkou N-2.3 — funkce IGNORUJE parametr `timeframe`
  (katalog má 'daily', tělo :96-117 ho nepoužívá). Chování odpovídá guide
  („5 různých návyků v jednom dni" — kdykoliv), ale parametr je mrtvý.

### habit-legend (combination: level ≥ 50 AND habit_xp_ratio ≥ 50 %, 500 XP Legendary)
- **Kde**: katalog :157-180 (additionalConditions);
  `evaluateCombinationCondition` (achievementService.ts:300-342) — všechny
  sub-podmínky musí platit; level → `userStats.currentLevel` (:237);
  percentage → `getPercentageValue` case 'habit_xp_ratio' (:420-424) →
  `getHabitXPRatio` (achievementIntegration.ts:489-526) = podíl kladného
  habit XP (completion+bonus+milestone) na celkovém kladném XP, 0-100.
- **Verdikt**: ✅ — logika správná; po rebalanci křivky (Fáze 1, N-1.7b) je
  L50 poprvé reálně dosažitelný (~1,1 roku pro power usera) → achievement
  přestal být čistě aspirační. Drobnost: ratio ignoruje záporné transakce
  (stejná třída jako N-2.1, dopad zanedbatelný).

### first-goal (GOALS, count goal_creation ≥ 1, 50 XP Common)
- **Kde**: katalog :352-364; `getGoalCreationCount`
  (achievementIntegration.ts:260-291) = `goals.length`.
- **Ověřeno jak**: creation trigger GoalsContext:178 (nutný — creation bez
  XP) + tutorial gate (`armTutorialAchievementGate('first-goal')`,
  GoalForm.tsx:378) + Group A test.
- **Verdikt**: ✅ (s N-2.2 nuancí — smazání jediného cíle před unlockem)

### goal-getter (count goal_completion ≥ 1, 100 XP Rare)
- **Kde**: katalog :373-385; hodnota = počet kladných `goal_completion`
  transakcí (achievementService.ts:206-214).
- **Verdikt**: ⚠️ — N-2.1: správná storage funkce `getCompletedGoalsCount`
  (achievementIntegration.ts:296-319, čte `status === 'completed'`)
  EXISTUJE, ale používá ji jen statistický kolektor (:1142) — achievement
  jede přes transakce. U target 1 je praktický rozdíl malý.

### goal-champion (count goal_completion ≥ 5, 200 XP Epic)
- **Kde**: katalog :394-406. Stejná cesta.
- **Verdikt**: ⚠️ (N-2.1 — dokončit/od-dokončit tentýž cíl 5× = unlock
  s jediným cílem)

### achievement-unlocked (count goal_completion ≥ 10, 500 XP Legendary)
- **Kde**: katalog :415-427. Stejná cesta.
- **Verdikt**: ❌ **nejzávažnější instance N-2.1**: `GOAL_COMPLETION` je
  exempt z denních limitů (xpLimits.ts:81) I z rate-limitingu
  (xpLimits.test.ts:205 to přímo testuje jako záměr) → toggle
  dokončit↔vrátit na JEDNOM cíli 10× za minutu = legendary achievement
  (+500 XP). Každý cyklus je XP-neutrální (+250/−250), ale count roste.
  Reálný uživatel to může spustit i nechtěně (opravy překlepů v progresu
  kolem targetu — viz plán 5.4 race conditions).
- Pozn.: guide jméno „Achievement Unlocked" se kryje s ID kolizí popsanou
  v plánu (achievement `achievement-unlocked` vs. monthly šablona) — plán
  už to ošetřuje.

### ambitious (value goal_target_value ≥ 1000, 100 XP Rare)
- **Kde**: katalog :436-448; `getValueMetric` case 'goal_target_value'
  (achievementService.ts:365-370) → `getMaxGoalTargetValue`
  (achievementIntegration.ts:352-390) = max targetValue EXISTUJÍCÍCH cílů.
- **Ověřeno jak**: creation trigger (vyhodnotí se hned při založení cíle
  s target ≥ 1000); edit targetu → přehodnocení při dalším checku.
- **Verdikt**: ✅

### progress-tracker (streak goal_progress_consecutive_days ≥ 7, 200 XP Epic)
- **Kde**: katalog :457-469; streak dispatch :1063-1064 →
  `getGoalProgressConsecutiveDays` (achievementIntegration.ts:426-483) =
  délka běhu po sobě jdoucích dní s kladnou `goal_progress` transakcí,
  kotveno na NEJNOVĚJŠÍ progress datum.
- **Verdikt**: ✅ — event-driven (7. den v řadě spustí check přes XP akci).
  Poznámka N-2.5: smazaný progress nechává den započtený (kladná tx
  zůstává) — stejná třída jako N-2.1, dopad malý.

### mega-dreamer (value goal_target_value ≥ 1 000 000, 200 XP Epic)
- **Kde**: katalog :478-490. Stejná cesta jako ambitious.
- **Verdikt**: ✅

### million-achiever (count goal_completion_million_plus ≥ 1, 500 XP Legendary)
- **Kde**: katalog :499-513; count dispatch :970-971 →
  `getGoalCompletionMillionPlus` (achievementIntegration.ts:324-347) =
  počet cílů se `status === 'completed' && targetValue >= 1000000` ze
  STORAGE (ne z transakcí!).
- **Verdikt**: ✅ — správná sémantika (od-dokončení cíle hodnotu sníží;
  unlock je beztak trvalý). Přesně takhle by měly fungovat i
  goal-getter/champion/achievement-unlocked → návrh opravy u N-2.1.

---

## Session #3 — 2c JOURNAL 1. půlka (16 achievementů)

Datum: 2026-07-16 | Commit: `6bd9c27` + neocommitnuté opravy session #2 |
Baseline #3: tsc 0; suites Fáze 2 → `Tests: 111 passed, 111 total`
(107 + 4 nové Group C).

**XP hodnoty vs. guide**: všech 16 sedí — včetně custom hodnot
`flame-achiever` 125, `bonus-week` 125, `crown-royalty` 150,
`bonus-century` 750 (katalog je má explicitně, guide též ✓).

### first-journal (count journal_entry ≥ 1, 50 XP Common)
- **Kde**: katalog :212-219; `journal_entry` JE XPSourceType → transakční
  count větev (achievementService, viz N-2.1/N-2.6).
- **Verdikt**: ⚠️ N-2.6 — prakticky funguje (1. zápis dne vždy vytvoří
  kladnou journal_entry transakci → unlock okamžitě), ale sémanticky
  jede přes transakce; správná funkce `getTotalJournalEntries`
  (achievementIntegration.ts:194-208, storage `getAll().length`) existuje
  a nepoužívá se.

### deep-thinker (value journal_entry_length ≥ 200, 100 XP Rare)
- **Kde**: `getValueMetric` case → `getMaxJournalEntryLength`
  (achievementIntegration.ts:215-233, storage max `content.length`).
- **Verdikt**: ✅ — storage-based, mazání bezpečné. Poznámka: zápis ≥200
  znaků na pozici 14+ (0 XP → žádná transakce) nespustí okamžitý check;
  odemkne se při příštím XP checku / startu — akceptovatelné.

### journal-enthusiast (count journal_entry ≥ 100, 200 XP Epic)
- **Kde**: katalog :254-261; transakční count.
- **Verdikt**: ❌ **N-2.6 hlavní oběť** — dvojí zkreslení:
  (a) source `journal_entry` mají jen PRVNÍ 3 zápisy dne (pozice 4-13 =
  `journal_bonus`/`journal_bonus_milestone`, 14+ žádná transakce —
  `performXPAddition` odmítá amount ≤ 0) → „100 zápisů" reálně počítá
  jen zápisy 1-3 každého dne; kdo píše 10/den, počítá se mu 3/den;
  (b) smazání zápisu refunduje XP zápornou transakcí
  (SQLiteGratitudeStorage.ts:430-441), kterou kladný count neodečte.
  Guide říká „Napsat 100 zápisů do deníku" = všechny zápisy.

### grateful-heart / gratitude-guru / eternal-gratitude (streak journal_entry ≥ 7/30/100)
- **Kde**: streak dispatch `journal_entry` (achievementIntegration.ts:1056-1058)
  → `getJournalStreak` (:181-189) → `getGratitudeCurrentStreak` (storage
  streak state).
- **Verdikt**: ✅ ✅ ✅ — storage-based; správnost samotného streak výpočtu
  (debt/freeze/warm-up) ověří Fáze 6 (kryto
  `sqliteGratitudeStorage.streakDebt.test.ts`, 20 testů).

### bonus-seeker (count journal_bonus_entries ≥ 50, 200 XP Epic)
- **Kde**: custom source → `getBonusJournalEntriesCount`
  (achievementIntegration.ts:242-266) — storage, počítá zápisy nad 3/den.
- **Verdikt**: ✅ — storage-based, mazání count správně sníží. (Počítá
  přes pozice, ne `isBonus` flag — ekvivalentní, storage pozice drží.)

### first-star / five-stars (count journal_star_count ≥ 1/5)
- **Kde**: dispatch :1011-1012 → `gratitudeStorage.getStreak().starCount`.
- **Verdikt**: ✅ ✅ — kryto Group B testem (live hodnoty ze streak state);
  symetrii counterů při mazání (⭐ zpět při smazání 4. zápisu) ověří
  Fáze 6 položka 6.3 (cross-ref).

### flame-achiever (count journal_flame_count ≥ 1, **125 XP** custom)
- **Verdikt**: ✅ — flameCount ze streak state (:1014-1015), Group B ✓.

### bonus-week (streak journal_bonus_streak ≥ 7, **125 XP** custom)
- **Kde**: streak dispatch :1066-1068 → `getBonusJournalDayStreak(1)`.
- **Verdikt**: ✅ — Group B testy: 3denní streak, kotva na včerejšku
  (nedokončený dnešek neláme), mezera láme.

### crown-royalty (count journal_crown_count ≥ 1, **150 XP** custom)
- **Verdikt**: ✅ — crownCount ze streak state (:1017-1018), Group B ✓.

### flame-collector (count journal_flame_count ≥ 25, 200 XP Epic)
- **Verdikt**: ✅ — táž cesta jako flame-achiever.

### golden-bonus-streak (streak journal_golden_bonus_streak ≥ 7, 200 XP Epic)
- **Kde**: :1070-1072 → `getBonusJournalDayStreak(3)`.
- **Verdikt**: ✅ — Group B: vyžaduje 3+ bonusy/den, dny bez bonusů
  nekvalifikují.

### triple-crown-master (count journal_crown_count ≥ 3, 500 XP Legendary)
- **Verdikt**: ✅ — táž cesta jako crown-royalty.

### bonus-century (count journal_bonus_entries ≥ 200, **750 XP** custom)
- **Verdikt**: ✅ — táž cesta jako bonus-seeker (storage).

---

## Sessions #4+#5 — 2d JOURNAL 2. půlka (15) + 2e CONSISTENCY (8) + 2f MASTERY (9)

Datum: 2026-07-16 | Baseline: navazuje na #3 — po opravě N-2.6 celá suite
`Tests: 404 passed, 404 total`, tsc 0 (ověřeno v #3; beze změn kódu mezi tím).

### 2d — star/flame/crown milestones (15 položek)

Všech 15 jede JEDNOU ověřenou cestou: count dispatch →
`gratitudeStorage.getStreak().starCount/flameCount/crownCount`
(achievementIntegration.ts:1011-1018; Group B test čte živé hodnoty ✓).
Trigger: countery aktualizuje storage při vzniku zápisu → XP akce → check ✓.
Symetrie counterů při MAZÁNÍ zápisu = Fáze 6 položka 6.3 (cross-ref).

| ID | Target | XP (katalog) | XP (guide) | Verdikt |
|---|---|---|---|---|
| star-beginner | ⭐10 | 100 | 100 | ✅ |
| star-collector | ⭐25 | 150 (custom) | 150 | ✅ |
| star-master | ⭐50 | 200 | 200 | ✅ |
| star-champion | ⭐100 | 300 (custom) | 300 | ✅ |
| star-legend | ⭐200 | 500 | 500 | ✅ |
| flame-starter | 🔥5 | 150 (custom) | 150 | ✅ |
| flame-accumulator | 🔥10 | 200 | 200 | ✅ |
| flame-master | 🔥25 | 300 (custom) | 300 | ⚠️ N-2.7 (duplikát s flame-collector 🔥25) |
| flame-champion | 🔥50 | 400 (custom) | 400 | ✅ |
| flame-legend | 🔥100 | 750 (custom) | 750 | ✅ |
| crown-achiever | 👑3 | 200 | 200 | ⚠️ N-2.7 (duplikát s triple-crown-master 👑3) |
| crown-collector | 👑5 | 350 (custom) | 350 | ✅ |
| crown-master | 👑10 | 500 | 500 | ✅ |
| crown-champion | 👑25 | 750 (custom) | 750 | ✅ |
| crown-emperor | 👑50 | 1000 (custom) | 1000 | ✅ |

Katalogové řádky: star :1449-1537, flame :1556-1644, crown :1663-1751.
XP shoda katalog↔guide 15/15 ✓ (vč. 9 custom hodnot).

### 2e — CONSISTENCY (8 položek)

- **weekly-warrior** (streak habit_completion ≥ 7, 100 XP, katalog :533-539):
  ✅ — `getMaxHabitStreak` (ověřená cesta ze 2a).
- **monthly-master** (streak habit 30, 200 XP, :554-560): ✅ — táž cesta.
- **hundred-days** (streak habit 100, 500 XP, :575-581; guide „Centurion"): ✅.
- **journal-streaker** (streak journal_entry 21, 100 XP, :596-602; guide
  „Gratitude Guardian"): ✅ — `getJournalStreak` (storage streak state).
- **daily-visitor** (streak app_usage_days 7, 100 XP, :647-653):
  ⚠️ N-2.9 — `getConsecutiveAppUsageDays` (:616-660) = po sobě jdoucí dny
  s JAKOUKOLIV XP transakcí; guide říká „používat aplikaci" — den, kdy
  uživatel appku otevře a nic neudělá, streak LÁME. `DAILY_ACTIVITY`
  XP zdroj nemá v produkci producenta (jen demo služba) a loyalty systém
  počítá „aktivní den" jinak (otevření appky) → dvě definice téhož pojmu.
- **dedicated-user** (streak app_usage_days 30, 200 XP, :668-674): ⚠️ N-2.9.
- **perfect-month** (count daily_feature_combo ≥ 28, timeframe monthly,
  500 XP, :689-695): ✅ s poznámkou N-2.10 — `getDailyFeatureCombo`
  (:554-611) počítá dny, kdy VŠECHNY 3 oblasti mají storage aktivitu
  (delete-safe ✓); 'monthly' = KLOUZAVÝCH posledních 30 dní
  (`isDateInTimeframe` :923-925), guide říká „v měsíci" (kalendářně).
- **triple-crown** (combination 3× streak ≥ 7: habit + journal +
  goal_progress, 500 XP, :710-733): ✅ — všechny 3 sub-podmínky jedou
  ověřenými dispatch cestami (getMaxHabitStreak, getJournalStreak,
  getGoalProgressConsecutiveDays); kombinační logika all-met ověřena u
  habit-legend (2a).

### 2f — MASTERY (9 položek)

- **goal-achiever** (count goal_completion ≥ 3, 200 XP, :622-626; guide
  „Dream Fulfiller"): ✅ — těží z opravy N-2.1 (storage
  `getCompletedGoalsCount`), reverze správně snižují.
- **level-up** (level ≥ 10, 100 XP, :758-762): ✅ — `userStats.currentLevel`
  (evaluateCondition :237); po rebalanci křivky = 4 374 XP (~2-3 týdny
  aktivního užívání). Trigger: level-up je důsledek XP akce → check běží ✓.
- **selfrise-expert** (level ≥ 25, 200 XP, :779-783): ✅ — 50k XP
  (~4 měsíce Regular tempa).
- **selfrise-master** (level ≥ 50, 500 XP, :800-804): ✅ — 316k XP
  (~1,1 roku Power / 2,2 roku Regular). **Uzavírá cross-check z Fáze 1
  (N-1.7b)**: level trofeje jsou po rebalanci dosažitelné a rozumně
  odstupňované.
- **ultimate-selfrise-legend** (level ≥ 100, 500 XP, :905-909): ✅ —
  2,0 M XP (~4,6 roku max. tempa) — aspirační, ale reálný.
- **recommendation-master** (count recommendations_followed ≥ 20, 200 XP,
  :821-825): ❌ **N-2.8 — MRTVÝ v produkci, dvojitá vada**:
  (a) ŽÁDNÝ kód neuděluje `RECOMMENDATION_FOLLOW` XP —
  `recommendationEngine.ts` i `PersonalizedRecommendations.tsx` mají
  0 volání addXP (grep); jediné výskyty zdroje jsou UI ikony, demo mapa
  a relevance mapping (achievementService:988) → count je trvale 0;
  (b) `getRecommendationsFollowedCount` (:673-698) je přiznaný TODO
  placeholder násobící počet transakcí ×0,3 („estimate") → i s producentem
  by target 20 vyžadoval 67 follows. Group A test tohle NEchytí (mockuje
  transakce všech zdrojů) — mrtvost je na úrovni producenta dat, ne
  dispatche. Cross-ref: Fáze 11 (11.1 audituje recommendation engine).
- **balance-master** (count daily_feature_combo ≥ 10, all_time, 200 XP,
  :842-846): ✅ — táž storage cesta jako perfect-month, all_time bez
  timeframe pastí.
- **trophy-collector-basic** (count achievements_unlocked ≥ 10, 100 XP,
  :863-867): ✅ — `getAchievementsUnlockedCount` (:704-729) čte
  `AchievementStorage.getUserAchievements().unlockedAchievements.length`
  (storage ✓); kaskáda funguje (trophy unlock = ACHIEVEMENT_UNLOCK XP
  akce → další check).
- **trophy-collector-master** (count achievements_unlocked ≥ 25, 500 XP,
  :884-888): ✅ — táž cesta.

## Nálezy k opravě (číslované, s prioritou)

1. **[VYSOKÁ] N-2.1 — count přes kladné XP transakce ignoruje reverze;
   u cílů zneužitelné bez brzdy.** Dotčené: `century-club`,
   `consistency-king` (habit_completion), `goal-getter`, `goal-champion`,
   `achievement-unlocked` (goal_completion). Mechanismus:
   `evaluateCondition` count větev (achievementService.ts:206-214) počítá
   `t.amount > 0`; `subtractXP` píše záporné tx (gamificationService.ts:1018),
   které se nikdy neodečtou. U `GOAL_COMPLETION` (exempt z limitů i
   rate-limitu) lze legendary `achievement-unlocked` získat togglováním
   JEDNOHO cíle 10× (každá re-kompletace = `justCompleted` = nová kladná tx,
   SQLiteGoalStorage.ts:504). **Návrh opravy**: přesměrovat count pro
   `goal_completion` na existující `getCompletedGoalsCount` (storage,
   :296) a pro `habit_completion` na storage počet completions (net);
   XP-transakční větev nechat jen pro zdroje bez storage protějšku.
   Musí zůstat zelený Group A test (dispatch liveness) — přidat Group B
   test na reverzi (complete→uncomplete→count klesne).
2. **[NÍZKÁ] N-2.2 — creation counts = aktuálně existující, ne kumulativní**
   (`getHabitCreationCount` :34-37, `getGoalCreationCount` :262-265).
   Dotčené: `habit-builder` (reálně „5 současně existujících"), okrajově
   `first-habit`/`first-goal`. Rozhodnout: upřesnit guide, NEBO počítat
   kumulativně (vyžaduje trvalé počítadlo — dnes neexistuje).
3. **[NÍZKÁ] N-2.3 — `getDailyHabitVariety` ignoruje `timeframe`**
   (:90-124; katalog multi-taskera má 'daily'). Chování odpovídá guide —
   sladit katalog (odstranit timeframe) nebo funkci (respektovat), ať
   parametr není mrtvý.
4. **[INFO] N-2.4 — streak achievementy čtou `currentStreak`** (ne longest;
   getMaxHabitStreak :68-85). Funkční díky event-driven checkům; zmeškaná
   evaluace (crash v den dosažení) se nedožene. Zvážit longest-streak
   fallback ve Fázi 4 (tam se ověřuje getHabitStats).
5. **[INFO] N-2.5 — `getGoalProgressConsecutiveDays`: smazaný progress
   den zůstává započtený** (kladná tx trvá; :436-438). Stejná třída jako
   N-2.1, dopad malý — vyřeší se případně společně s N-2.1.
6. **[VYSOKÁ] N-2.8 — `recommendation-master` je mrtvý achievement
   (sessions #4+#5)**: žádný producent `RECOMMENDATION_FOLLOW` XP
   v produkci + placeholder ×0,3 v kalkulaci (detail v sekci 2f).
   **Rozhodnutí Petra**: (a) dodrátovat follow-tracking (tap na
   doporučení → addXP RECOMMENDATION_FOLLOW v rámci ENGAGEMENT limitu
   200/den — přirozeně spadá do Fáze 11), + smazat ×0,3; NEBO
   (b) trofej vyřadit z katalogu. Do rozhodnutí je to jediná trvale
   nedosažitelná trofej z 57 dosud auditovaných.
7. **[NÍZKÁ — DESIGN] N-2.7 — duplicitní podmínky dvou párů trofejí**:
   `flame-collector` (🔥25, 200 XP, sekce 2c) ≡ `flame-master` (🔥25,
   300 XP, 2d) a `triple-crown-master` (👑3, 500 XP, 2c) ≡
   `crown-achiever` (👑3, 200 XP, 2d). Guide i katalog jsou konzistentní
   (obě dvojice uvádějí) — při dosažení milníku se odemknou OBĚ naráz
   (500 XP resp. 700 XP dohromady). Rozhodnout: záměr (dvojitá oslava),
   nebo odlišit targety (např. flame-master → 🔥35, crown-achiever → 👑2).
8. **[NÍZKÁ] N-2.9 — dvě definice „aktivního dne"**: daily-visitor/
   dedicated-user počítají dny s XP transakcí (`getConsecutiveAppUsageDays`),
   loyalty počítá otevření appky (`trackDailyActivity`). Den „otevřel, ale
   nic neudělal" láme achievement streak, ale loyalty den počítá. Sladit:
   buď guide text („dny s aktivitou"), nebo napojit oba na loyalty tracker.
9. **[INFO] N-2.10 — perfect-month 'monthly' = klouzavých 30 dní**, ne
   kalendářní měsíc (guide říká „v měsíci"). Upřesnit guide, nebo přepnout
   na kalendářní logiku (konzistence s Monthly Challenges — Fáze 3).
10. **[STŘEDNÍ] N-2.6 — journal_entry count = transakce (session #3, 2c)**:
   `first-journal` + `journal-enthusiast` počítají kladné `journal_entry`
   transakce → (a) počítají se jen zápisy 1-3 každého dne (pozice 4+ mají
   jiný/žádný source), (b) smazané zápisy se neodečítají. Guide:
   „100 zápisů do deníku" = všechny zápisy. **Návrh**: stejný fix jako
   schválený N-2.1 — přesměrovat na existující `getTotalJournalEntries`
   (storage). Ostatních 14 položek 2c je storage-based a v pořádku.

## PLAN-DISCREPANCY

- Žádná — počty (8+8), ID i XP hodnoty dle plánu a guide seděly.
  (XP všech 16 = ACHIEVEMENT_XP_REWARDS[rarity]: 50/100/200/500 ✓ guide.)

## Provedení oprav session #3 (N-2.6)

- `evaluateCondition` count větev: `journal_entry` →
  `getTotalJournalEntries()` (storage) — stejná schválená třída fixu jako
  N-2.1. Nový Group C test („journal-enthusiast counts ALL entries…").
- Guide: PRODUCTION FIX 1 rozšířen o journal_entry; popis Journal
  Enthusiast upřesněn.
- Ověření: tsc exit 0; celá suite `Tests: 404 passed, 404 total`.
- Dopad na verdikty: first-journal ⚠️→✅ (fixed),
  journal-enthusiast ❌→✅ (fixed).

## Brána úplnosti

| Session | Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|---|
| #2 (2.0+2a+2b) | 1 + 8 + 8 = 17 | 17 | ✓ |
| #3 (2c) | 16 | 16 (13 sekcí, z toho 2 sloučené trojice/dvojice streak a counter položek explicitně vyjmenované) | ✓ — všech 16 ID pokryto |
| #4 (2d) | 15 | 15 (tabulka, každé ID vlastní řádek s verdiktem) | ✓ |
| #5 (2e+2f) | 8 + 9 = 17 | 17 (každé ID vlastní odrážka) | ✓ |

**Celkem Fáze 2 dosud: 65/78 achievementů auditováno** (zbývá 2g SPECIAL 14
+ 2h batch smyčka + 2i device).

## Rozhodnutí Petra + provedení oprav (2026-07-16, tatáž session)

| Nález | Rozhodnutí | Provedeno |
|---|---|---|
| **N-2.1** | ✅ schváleno — storage místo transakcí | `evaluateCondition` count větev (achievementService.ts): `goal_completion` → `getCompletedGoalsCount()`, `habit_completion` → nová `getHabitCompletionsCount()` (achievementIntegration, čte `getAllCompletions()`, vč. bonusových, reverze snižují). Ostatní XP zdroje (journal) zatím transakčně — prověří 2c/2d. |
| **N-2.2** | ✅ „5 současně" NE — duplikovalo by seven-wonder (7 současně, `getActiveHabitsSimultaneousCount` počítá tytéž existující návyky) → **kumulativně „vytvořeno celkem"** | Mazání návyků je SOFT delete (`is_archived=1`, SQLiteHabitStorage:193) → nová `countCreatedTotal()` (SQLite bez filtru archivace + legacy parita) a `getHabitCreationCount` all_time ji používá. Žádné nové počítadlo nebylo potřeba. |
| **N-2.3** | ✅ dle návrhu | Katalog multi-tasker `timeframe: 'daily'` → `'all_time'` + komentář (evaluator vrací max varietu za kterýkoliv den — chování beze změny, parametr už nelže). |
| N-2.4, N-2.5 | INFO — beze změny | N-2.4 posoudí Fáze 4 (getHabitStats); N-2.5 z velké části vyřešeno přesměrováním countů (progress-tracker streak zůstává transakční — malý dopad, zapsáno). |

**Nové regresní testy** (Group C v `achievementEvaluation.test.ts`, +4):
toggle scénář (10 kladných goal_completion transakcí + 1 reálně dokončený
cíl ⇒ count 1, unlock NE), 10 skutečně dokončených ⇒ unlock ANO, pokles
countu po reverzi completionu (100→99), kumulativní creation count (5 vč.
2 archivovaných).

**Ověření**: tsc exit 0; celá suite:

```
Test Suites: 26 passed, 26 total
Tests:       403 passed, 403 total
```

**Guide aktualizován**: `Achievements.md` — nová sekce PRODUCTION FIX 1
(N-2.1/N-2.2 sémantika) + upřesněné popisy Habit Builder, Century Club,
Consistency King, Goal Getter, Achievement Unlocked.

**Dopad na verdikty položek**: century-club, consistency-king, goal-getter,
goal-champion ⚠️→✅ (fixed); achievement-unlocked ❌→✅ (fixed);
habit-builder ⚠️→✅ (fixed, kumulativní); multi-tasker poznámka vyřešena
(fixed). Ostatní beze změny.

## ROZHODNUTÍ PETRA k nálezům 2d-2f (2026-07-16) — závazné, i kdyby session ztratila paměť

| Nález | Rozhodnutí Petra | Co to znamená pro kód |
|---|---|---|
| **N-2.8** (`recommendation-master` mrtvá) | **SMAZAT trofej** | Odstranit z katalogu + přímo mrtvé věci (preview-utils case/hint). RECOMMENDATION_FOLLOW XP-zdroj + `getRecommendationsFollowedCount` ZŮSTÁVAJÍ (zdroj má UI/limity, funkci volá i stats kolektor achievementIntegration:1171). i18n klíče → Fáze 12. Dispatch case `recommendations_followed` + ×0,3 placeholder → poznámka pro F11/F13. |
| **N-2.7** (duplicitní 🔥25 a 👑3) | **SMAZAT `flame-collector`** (necháváme `flame-master` — zní líp) a **SMAZAT `triple-crown-master`** (necháváme `crown-achiever` — „master" už je jednou jako `crown-master` 👑10) | 2 trofeje pryč z katalogu. Zbylé (flame-master 🔥25 / crown-achiever 👑3) beze změny hodnot. |
| **N-2.9** (2 definice aktivního dne) | **Nechat variantu (b)** — den se počítá, jen když v něm vznikla XP aktivita | Kód beze změny; sladit jen text průvodce (Daily Visitor / Dedicated User → „dny s aktivitou"). |
| **N-2.10** (Perfect Month okno) | **Nechat klouzavých posledních 30 dní** (NE kalendářní měsíc) | Kód beze změny; sladit jen text průvodce (Perfect Month → „28+ z posledních 30 dní"). |

**Důsledek N-2.8+N-2.7: katalog 78 → 75 achievementů.** Nutno srovnat:
`CORE_ACHIEVEMENTS.length` test, katalog header komentář, guide (počty per
kategorie: JOURNAL 31→29, MASTERY 9→8; celkové XP 25 050→24 150; rozdělení
rarit: Epic 29→27, Legendary 26→25; owner popisy 3 trofejí), plán (počty),
storageSplitBrain komentář. XP odečet: recommendation-master 200 +
flame-collector 200 + triple-crown-master 500 = 900.

### Provedení (2026-07-16, tatáž session)

**Katalog 78 → 75** — smazány `recommendation-master`,
`flame-collector`, `triple-crown-master` (achievementCatalog.ts).
- `achievementPreviewUtils.ts`: odstraněny 3 `case` bloky + 3 hint stringy.
- `achievementEvaluation.test.ts`: `CORE_ACHIEVEMENTS.length` 78 → 75.
- Katalog header komentář 78 → 75.
- Guide `Achievements.md`: JOURNAL 31→29, MASTERY 9→8, celkem 78→75,
  Total XP 25 050→24 150, Epic 29→27, Legendary 26→25, Journal Bonus
  24→22; smazány 3 owner popisy + zmínka v ID-pattern; regresní/test
  počty 78→75.
- **N-2.9 text**: Daily Visitor / Dedicated User → „aktivní den = den s XP
  aktivitou" (kód beze změny, varianta b).
- **N-2.10 text**: Perfect Month → „28+ perfektních dní v posledních
  klouzavých 30 dnech" (kód beze změny).
- **NEsmazáno záměrně** (surgical): `RECOMMENDATION_FOLLOW` XP-zdroj
  (má UI/limity/config), `getRecommendationsFollowedCount` (volá stats
  kolektor achievementIntegration:1171). Osiřelé i18n klíče 3 trofejí →
  Fáze 12. Dispatch case `recommendations_followed` + ×0,3 placeholder →
  poznámka F13 (dead-code sweep).
- **Dopad na existující uživatele**: pre-release (jen TestFlight) — pokud
  někdo měl smazanou trofej odemčenou, její ID zmizí z katalogu (v UI se
  nevykreslí), XP zůstává. Bez migrace.

**Ověření**: tsc exit 0; celá suite `Tests: 401 passed, 401 total`
(404 − 3 per-achievement testy smazaných trofejí).

## Stav: Sessions #2–#5 HOTOVÉ (2.0 + 2a-2f) — Fáze 2 pokračuje od 2g (SPECIAL 14)

Handoff poznámka z #2 pro journal county VYŘÍZENA v #3 (N-2.6 opraven).
Sessions #4+#5: audit-only — **čekají na rozhodnutí Petra**: N-2.8
(mrtvý recommendation-master: dodrátovat vs. vyřadit), N-2.7 (duplicitní
targety dvou párů), N-2.9 (definice aktivního dne), N-2.10 (klouzavý vs.
kalendářní měsíc). Handoff pro 2g (SPECIAL): loyalty-* položky čtou
`getLoyaltyTotalActiveDays` — srovnat s Fází 1.8 (loyalty AsyncStorage);
`same_day_habit_creation_completion`, `active_habits_simultaneous`
a `comeback_activities` mají vlastní kalkulátory — prověřit od nuly;
ověřit duplicitu čísel LOYALTY_MILESTONES ↔ katalog 10/10 (pozn. z F1).
