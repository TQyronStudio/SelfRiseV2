# Fáze 3 — nálezy (super audit 2026-07)

Datum: 2026-07-18 | Commit: `15050b8` (+ neodkomitované opravy N-2.11/N-2.12 z Fáze 2 ve working tree — čekají na commit dle pravidla 14) | Node: v24.18.0 (přes nvm PATH; shell default v20.20.2 = PD-2 z Fáze 2 trvá) | Baseline: tsc exit 0, testy 76/76 (4/4 suites Fáze 3)

Baseline výstup (doslovně, poslední řádky):

```
Test Suites: 4 passed, 4 total
Tests:       76 passed, 76 total
Snapshots:   0 total
Time:        6.805 s, estimated 7 s
Ran all test suites matching /monthlyProgressTracker.trackingKeys|monthlyChallenge.phase3|starRatingMigration/i.
```

Pozn.: známé varování „A worker process has failed to exit gracefully" (timer leak v teardownu, testy zelené) — evidováno už ve Fázi 1/2, není nový nález.

**Rozsah této session (#7 dle batching tabulky)**: 3.0 baseline + 3a Habits šablony (4) + 3b Journal šablony (4). Položky 3c–3g budou v sessions #8–#9.

**Metodika na šablonu** (dle plánu Fáze 3): celý řetězec — generování cíle (star scaling, měsíční limit) → tracking (event → progress, increment-0 trap u odvozených klíčů) → zobrazení (Card, DetailModal, Calendar, weekly breakdown) → konec měsíce (úspěch/neúspěch, hvězdy, streak bonus).

---

## Společný řetězec (důkazy sdílené všemi 8 šablonami)

Aby se v sekcích šablon neopakovalo totéž, tady jsou jednou ověřené společné články. Sekce šablon na ně odkazují.

**G1 — Generování targetu** (`monthlyChallengeService.ts`):
`generateMonthlyChallenge` (:1904) → warm-up check (:1925, práh <20 aktivních dní přes `shouldUseWarmUpTreatment` :1489) → výběr kategorie → hvězdy z `StarRatingService` (:1966-1968) → výběr šablony `selectTemplateForCategory` (:1761, filtr `minLevel` :1793) → `generateChallengeParameters` (:1045) → `createPersonalizedRequirements` (:895) → `calculateTargetFromBaseline` (:661):
1. baseline metrika přes `extractBaselineMetric` (:792-842; všech 8 klíčů šablon 3a/3b existuje v `UserActivityBaseline`, userActivityTracker.ts:16-63) ✅
2. star multiplier 1.05–1.25 (:551-557) **ořezaný do `baselineMultiplierRange` šablony** (:697-703) → viz nález N-3.3
3. `target = ceil(baseline × multiplier)` (:706)
4. **kategorové minimum** `getMinimumTargetForTemplate` (:847-863): HABITS [20,25,30,35,40], JOURNAL [30,40,50,60,70] podle hvězdy — bez ohledu na sémantiku tracking klíče → viz nález N-3.2
5. měsíční cap pro daily-streak klíče (`isDailyStreakTrackingKey` :868-879, cap :716-741) ✅ (přesný pro cílový měsíc, únor/přestupný rok OK)

Warm-up větev: `createWarmUpRequirements` (:1443-1470) — fixní fallback (habits 25 / journal 45, :972-981) × **0.7** (:1453), minima warm-up (:1475-1484). Guide tvrdí 0.8 → nález N-3.8.

**G2 — Doručení eventů do trackeru**: `MonthlyProgressIntegration` poslouchá `xpGained` (monthlyProgressIntegration.ts:113-116), 250ms batching (:69), `processXPEvent` předává source/amount/sourceId/metadata **beze změny** do `MonthlyProgressTracker.updateMonthlyProgress` (:321-333). Listener na `xpBatchCommitted` (:119-122) je mrtvý (event nikdy nevzniká — nález N-1.5a z Fáze 1, potvrzeno). Merge top-level `sourceId` do metadat: monthlyProgressTracker.ts:214-220 ✅ (červencová oprava drží).

**G3 — Update pipeline** (`executeAtomicProgressUpdate`, monthlyProgressTracker.ts:266-441): relevance filtr `getRelevantRequirements` (:446-511) → increment `calculateProgressIncrement` (:516-594) → increment-0 trap ošetřen (`hasComplexRelevant` :340-344) → snapshot PŘED recalcem (:351-353, s `appliedIncrements` :304-319) → `recalculateComplexTrackingKeys` (:1001-1090) → completion % po recalcu (:363-368) → save/emit jen při reálné změně (:373-412) → completion při ≥100 % (:422-423). Odpovídá dokumentované červencové opravě ✅.

**G4 — Zobrazení**: Home drží `selectedChallengeProgress` a má vlastní listener `monthly_progress_updated` (app/(tabs)/index.tsx:173-202) → `MonthlyChallengeDetailModal` dostává živá data přes props (:347-352) — „Dead Modal Syndrome" z guide je řešený architektonicky (listener o úroveň výš), ne listenerem v modalu; funkčně ekvivalentní ✅. Sekce na Home má vlastní listenery (MonthlyChallengeSection.tsx:53-84, 87-100, 103-128, 131-149) ✅. Kalendář (MonthlyProgressCalendar.tsx): denní target = target/dny (:102-113), tři režimy vybarvení — jednoduché čítače (:232-233), day-guarded klíče (:222-230), odvozené klíče (:149-186, avg_entry_length = „aktivní den" fallback :178-184) ✅. Weekly breakdown: ratio-basis výjimka pro balance_score/avg_entry_length (:686-692) ✅.

**G5 — Dokončení při 100 %** (`completeMonthlyChallenge`, monthlyProgressTracker.ts:1468-1573): base XP z challenge + streak bonus 5/10/15/25 % dle milníků streaku (:1486, odpovídá guide) → `addXP` source `MONTHLY_CHALLENGE` (:1493-1503) → hvězdy přes `StarRatingService` s `isWarmUp` guardem (:1507-1518) → event `monthly_challenge_completed` (:1544-1568). ✅ (Uzávěr NEÚSPĚCHU na konci měsíce pro všech 14 šablon = položka 3g, session #9.)

---

## Položky

### 3.0 Baseline testy Fáze 3

- Kde: `monthlyProgressTracker.trackingKeys.test.ts` (16), `monthlyChallenge.phase3.test.ts`, `monthlyChallenge.phase3.production.test.ts`, `starRatingMigration.test.ts`
- Ověřeno jak: spuštěno `npm test -- --testPathPattern="monthlyProgressTracker.trackingKeys|monthlyChallenge.phase3|starRatingMigration"` (Node v24.18.0)
- Verdikt: ✅ — 4/4 suites, 76/76 testů, tsc 0 chyb
- Důkaz: výstup v hlavičce zprávy

### 3a-1 `habits_consistency_master` (Consistency Master)

- Kde: definice monthlyChallengeService.ts:69-98 (baseline `totalHabitCompletions`, range [1.05,1.25], trackingKey `scheduled_habit_completions`, minLevel 1, priority 100, seasonality 01/02/09/10); tracking monthlyProgressTracker.ts:458-460 + :528-529
- Pravidlo: guide „Consistency Master" (baseline ~20 → targety 21-25)
- Ověřeno jak: trasování G1→G5; increment ±direction pro HABIT_COMPLETION (undo funguje — smazání completion pošle záporné XP, direction -1 dekrementuje); regresní test trackingKeys (liveness) zelený
- Verdikt: ✅ — jediná habits šablona, kde baseline (měsíční počet completions) i minimum (20-40) sedí sémantikou k tracking klíči; celý řetězec končí správně
- Důkaz: viz řádky výše; XP event s `sourceId` SQLiteHabitStorage.ts:351-355; kalendář režim „jednoduchý čítač" MonthlyProgressCalendar.tsx:232-233
- Pozn.: hvězdy 1-5 dávají multiplikátory 1.05/1.10/1.15/1.20/1.25 — range [1.05,1.25] nic neořezává, progrese obtížnosti funguje jen u téhle šablony (viz N-3.3)

### 3a-2 `habits_variety_champion` (Variety Champion)

- Kde: definice monthlyChallengeService.ts:99-128 (baseline `avgHabitVariety`, range [1.10,1.30], trackingKey `unique_weekly_habits`, minLevel 2); tracking monthlyProgressTracker.ts:464-466 + :534-540; kalkulátor `calculateWeeklyHabitVarietyIncrement` :1596-1628; týden = `ceil(dayOfMonth/7)` :1582-1590
- Pravidlo: guide „Variety Champion" — „unikátní návyky za týden… target škáluje z baseline podle hvězd stejně jako ostatní výzvy"
- Ověřeno jak: trasování celého řetězce + výpočet typických hodnot
- Verdikt: ⚠️ — runtime tracking funguje (unikátnost per týden, sourceId merge ✅), ale generování targetu je fakticky mrtvá personalizace a týdenní definice je nekonzistentní s kalendářem
- Důkaz:
  - `avgHabitVariety` = průměr RŮZNÝCH návyků **za den** (userActivityTracker.ts:23) — typicky 1-5. Scaled 1.10-1.30 → 2-7. Kategorové minimum pro 2⭐+ je 25-40 (:853) → **minimum vyhrává vždy** → target konstantní (25/30/35/40), baseline nehraje roli → N-3.2b. Target 25+ „unikátních návyků týdně v součtu za měsíc" navíc není nijak omezen počtem existujících návyků uživatele (max = počet návyků × ~4.4 týdne) — se 4 návyky je 2⭐ target 25 nesplnitelný (max ~20)
  - Restart appky vymaže in-memory `currentWeekHabits` set → tentýž návyk se v témž týdnu započítá podruhé (třída NÁLEZ 4, viz N-3.5; přidáno do 3e device scénáře)
  - Undo ignorováno: direction ≤ 0 → 0 (:1599) → smazání completion nechá variety čítač nafouknutý → N-3.6
  - Definice týdne: tracker týden 1 = 1.-7. den měsíce (:1585), kalendář láme týdny v pondělí (MonthlyProgressCalendar.tsx:205) → tracker a UI mají různé „týdny"; guide týden nedefinuje → N-3.10
  - Kalendář: dny, kdy uživatel splnil jen návyky už započítané tento týden, mají contribution 0 → šedý den navzdory aktivitě (:228-233 režim se na tento klíč nevztahuje — patří do simple větve :232) → N-3.10

### 3a-3 `habits_streak_builder` (Streak Builder)

- Kde: definice monthlyChallengeService.ts:129-158 (baseline `longestHabitStreak`, range [1.15,1.35], trackingKey `habit_streak_days`, minLevel 3); tracking monthlyProgressTracker.ts:479-484 + :568-573; kalkulátor `calculateHabitStreakIncrement` :1662-1709
- Pravidlo: guide „Streak Builder" — 10-13denní streak podle hvězd, měsíční limit 28-31
- Ověřeno jak: trasování + výpočet reálných targetů; srovnání s guide tabulkou
- Verdikt: ❌ (sémantika generování) + 🔶 (restart, 3e) — výzva se v praxi vždy degeneruje na „návyk každý den měsíce", guide slibuje 10-13denní streaky
- Důkaz:
  - minLevel 3 → nabízí se až od 3⭐; kategorové minimum pro 3/4/5⭐ = 30/35/40 (:853). Baseline `longestHabitStreak` × 1.15-1.25 překoná 30 až od baseline ≥27. Pro běžného uživatele tedy target = 30/35/40 → měsíční cap (:736-740) ořízne na 28-31 → **target = každý den měsíce, u všech hvězd** → N-3.2a
  - Uložený progress se při přerušení streaku NERESETUJE: interní `currentStreakDays` se vynuluje (:1683), ale funkce vrací +1 a pipeline přičítá (:321-325) → `progress['habit_streak_days']` = kumulativní počet dní s ≥1 návykem, ne streak → N-3.5. Při dnešních month-length targetech je výsledek ekvivalentní („všechny dny"), ale při rebalanci targetů dle guide by výzvu splnilo JAKÝCHKOLIV 12 aktivních dní
  - In-memory `currentStreakDate`/`streakCompletedToday` → restart uprostřed dne = double-count dne (přesně scénář 3e z 11.7. NÁLEZ 4, stále platí staticky) → 🔶 device
  - Undo ignorováno (:1665) → N-3.6
  - Kalendář: day-guarded režim (MonthlyProgressCalendar.tsx:124-125, 222-230) ✅

### 3a-4 `habits_bonus_hunter` (Bonus Hunter)

- Kde: definice monthlyChallengeService.ts:159-187 (baseline `avgDailyBonusHabits`, range [1.20,1.40], trackingKey `bonus_habit_completions`, minLevel 2); tracking monthlyProgressTracker.ts:461-463 + :531-532
- Pravidlo: guide „Bonus Hunter" — baseline 8 → targety 8-10 bonus completions/měsíc
- Ověřeno jak: trasování + výpočet typických hodnot
- Verdikt: ⚠️ — tracking čistý (±direction, undo funguje), generování targetu opět mrtvá personalizace + ploché hvězdy
- Důkaz:
  - `avgDailyBonusHabits` = **denní průměr** (~0-2, userActivityTracker.ts:22), target je ale měsíční počet → scaled hodnota 1-3 vždy prohraje s minimem 25/30/35/40 (2⭐+) → target konstantní, 2.5-4× přísnější než guide příklady → N-3.2c
  - Range [1.20,1.40]: hvězdy 1-4 všechny clampnuté na 1.20 (:699) → i kdyby baseline vyhrávala, 1⭐-4⭐ mají identický target → N-3.3

### 3b-1 `journal_reflection_expert` (Reflection Expert)

- Kde: definice monthlyChallengeService.ts:190-219 (baseline `totalJournalEntries`, range [1.05,1.25], trackingKey `quality_journal_entries`, minLevel 1); tracking monthlyProgressTracker.ts:467-469 + :542-547
- Pravidlo: guide „Reflection Expert" — záznamy 33+ znaků, baseline 80 → targety 85-100
- Ověřeno jak: trasování end-to-end vč. metadat; ověření undo cesty
- Verdikt: ⚠️ — hlavní tok funguje (33+ filtr, metadata tečou), ale: bonusové zápisy se nikdy nepočítají jako quality → u bonus-heavy uživatelů může být target NESPLNITELNÝ; undo nedekrementuje
- Důkaz:
  - Metadata `entryLength` posílá SQLite storage při každém zápisu (SQLiteGratitudeStorage.ts:319) → increment podmínka `metadata.entryLength >= 33` (:544) ✅ funguje
  - `quality_journal_entries` matchuje POUZE `JOURNAL_ENTRY` (:467-468, :544) = zápisy #1-3 dne. Max započitatelné = ~3/den ≈ 90-93/měsíc. Baseline `totalJournalEntries` ale zahrnuje i bonusy: uživatel se 6 zápisy/den má baseline ~180 → target ceil(180×1.05) = 189 quality zápisů → **matematicky nesplnitelné** (max ~93) → N-3.2f
  - Undo: `delete()` posílá `subtractXP` BEZ metadat (SQLiteGratitudeStorage.ts:439-442) → podmínka `entryLength >= 33` nevyhodnotitelná → increment 0 → smazaný kvalitní zápis zůstává započtený → N-3.6
  - Milestone zápisy (#4/#8/#13) jsou JOURNAL_BONUS třídy — pro quality klíč irelevantní (quality = jen #1-3), N-3.1 se této šablony NEdotýká

### 3b-2 `journal_gratitude_guru` (Gratitude Guru)

- Kde: definice monthlyChallengeService.ts:220-249 (baseline `avgDailyBonusEntries`, range [1.10,1.30], trackingKey `total_journal_entries_with_bonus`, minLevel 2); tracking monthlyProgressTracker.ts:473-475 + :552-554
- Pravidlo: guide „Gratitude Guru" — celkové záznamy (běžné + bonus), baseline 100 → targety 105-125
- Ověřeno jak: trasování end-to-end vč. milestone větve v úložišti
- Verdikt: ❌ — každý zápis nesoucí milestone (#4, #8, #13 v daném dni) je pro tracker NEVIDITELNÝ; navíc target je řádově mimo guide
- Důkaz:
  - Úložiště při milestone slučuje base+milestone XP do JEDNÉ transakce se source `JOURNAL_BONUS_MILESTONE` (SQLiteGratitudeStorage.ts:311-313; milestony na pozicích 4/8/13 :291-300). Integrace source nemapuje (monthlyProgressIntegration.ts:321-333), tracker matchuje jen `JOURNAL_ENTRY`/`JOURNAL_BONUS` (:473-475) → zápisy #4/#8/#13 se do `total_journal_entries_with_bonus` NIKDY nezapočtou → ztráta až 3 zápisů/den → N-3.1
  - `avgDailyBonusEntries` = denní průměr BONUSOVÝCH zápisů (~0-2, userActivityTracker.ts:30), target je celkový měsíční počet VŠECH zápisů → scaled 1-3 vždy prohraje s minimem 40/50/60/70 → target konstantní a výrazně NIŽŠÍ než guide příklady (105-125) → N-3.2d
  - Undo: direction -1 dekrementuje ✅ (:552-554, metadata nepotřebuje) — jediný journal klíč se symetrickým undo

### 3b-3 `journal_consistency_writer` (Consistency Writer)

- Kde: definice monthlyChallengeService.ts:250-279 (baseline `journalConsistencyDays`, range [1.15,1.35], trackingKey `daily_journal_streak`, minLevel 3); tracking monthlyProgressTracker.ts:476-478 + :575-580; kalkulátor `calculateJournalStreakIncrement` :1716-1780; denní čítač :1785-1819 (trigger :195-201); dynamický popis monthlyChallengeService.ts:2070-2072
- Pravidlo: guide „Consistency Writer" — star-based požadavek N zápisů/den (1⭐=1 … 5⭐=5), targety 26-30 dní, měsíční limit
- Ověřeno jak: trasování end-to-end vč. star-based počítání a milestone větve
- Verdikt: ❌ — milestone zápisy chybí v denním čítači (4⭐/5⭐ reálně vyžadují o 1 zápis víc, než slibuje popis); target vždy celý měsíc; popis natvrdo anglicky; + třída NÁLEZ 4 (restart)
- Důkaz:
  - Denní čítač `incrementTodayJournalCount` se volá jen pro `JOURNAL_ENTRY`/`JOURNAL_BONUS` (:198-201) → zápis #4 dne (source `JOURNAL_BONUS_MILESTONE`, viz 3b-2) se nezapočte → den s přesně 5 zápisy má čítač 4 → **5⭐ požadavek „5 zápisů/den" reálně = 6 zápisů**; 4⭐ = 5 zápisů → N-3.1
  - Generování: baseline `journalConsistencyDays` (0-30) × 1.15-1.25 ≤ 38; kategorové minimum pro 3⭐+ (minLevel 3) = 50/60/70 → vždy vyhrává → měsíční cap ořízne na 28-31 → **target = zápis každý den měsíce u všech hvězd**; guide slibuje 26-30 dle hvězd → N-3.2e
  - Dynamický popis je hardcoded EN string mimo t() (:2070-2072) → DE/ES uživatelé vidí anglický text; guide tvrdí lokalizaci EN/DE/ES → N-3.7
  - Kumulace bez resetu streaku (:1747-1755 interní reset, ale návrat +1 → progress jen roste) → N-3.5; in-memory stav (`todayJournalEntriesCount`, `currentJournalStreakDate`) → restart = double-count / zapomenuté dnešní zápisy → 🔶 3e device (explicitně v plánu 3e pro `daily_journal_streak`)
  - Undo ignorováno (:1719) a denní čítač se při smazání zápisu nedekrementuje → N-3.6

### 3b-4 `journal_depth_explorer` (Depth Explorer)

- Kde: definice monthlyChallengeService.ts:280-308 (baseline `avgEntryLength`, range [1.20,1.40], trackingKey `avg_entry_length`, minLevel 2); relevance monthlyProgressTracker.ts:485-489; komplexní přepočet :1057-1077; čtení úložiště :25 (`getGratitudeStorageImpl()`)
- Pravidlo: guide „Depth Explorer" + plán 3b: „čtení žurnálu bylo dotčeno split-brain opravou 14.7., ověř znovu od nuly"
- Ověřeno jak: trasování od nuly — relevance, increment-0 trap, recalc zdroj dat, zaokrouhlení, kalendář, weekly breakdown; regresní test trackingKeys (liveness avg_entry_length) zelený v baseline
- Verdikt: ⚠️ — jádro řetězce v pořádku (split-brain oprava drží: čte se SQLite implementace), zbývají okrajové vady sdílené s ostatními
- Důkaz:
  - Relevance case existuje (:485-489), increment 0 by design (:587-589), pipeline běží přes `hasComplexRelevant` (:340-344) ✅
  - Recalc: `gratitudeStorage.getAll()` kde `gratitudeStorage = getGratitudeStorageImpl()` (:25 s vysvětlujícím komentářem) → SQLite; filtr dat lexikograficky přes DateString (:1063-1066, bez timezone rizika), průměr `Math.round` (:1068-1070) → DetailModal ukazuje celé číslo (modal má toFixed jen pro balance_score, MonthlyChallengeDetailModal.tsx:606-609 — pro celé číslo OK)
  - Milestone zápis (#4/#8/#13) nespustí recalc (source mimo match :485-489) → průměr se dopočte až při dalším journal eventu; je-li milestone zápis poslední v měsíci, průměr ho nezachytí — okrajový dopad N-3.1
  - Generování: baseline `avgEntryLength` je jediný journal klíč, kde scaled hodnota typicky PŘEKONÁ kategorové minimum (60 znaků × 1.20 = 72 > min 40) → personalizace tady žije; ALE range [1.20,1.40] → hvězdy 1-4 identický multiplier 1.20 → N-3.3; a kategorová minima 30-70 „znaků" jsou sémanticky náhodná čísla (kalibrovaná na počty zápisů) — u nízkých baseline (<33 znaků) target skokově diktuje minimum → součást N-3.2
  - Kalendář: derived fallback „aktivní den = good" (MonthlyProgressCalendar.tsx:178-184) ✅ dokumentovaný kompromis; weekly ratio-basis (:686-692) ✅

---

## Nálezy k opravě (číslované, s prioritou)

### N-3.1 (VYSOKÁ, ❌) — Milestone zápisy deníku (#4/#8/#13 dne) jsou pro Monthly Challenges neviditelné

Úložiště slučuje base+milestone XP do jedné transakce se source `JOURNAL_BONUS_MILESTONE` (SQLiteGratitudeStorage.ts:311-313), ale `getRelevantRequirements` (:473-478) i denní čítač (:198-201) matchují jen `JOURNAL_ENTRY`/`JOURNAL_BONUS`.
- **Dopad**: Gratitude Guru ztrácí až 3 zápisy denně; Consistency Writer na 4⭐/5⭐ vyžaduje reálně o 1 zápis/den víc, než slibuje; Depth Explorer přepočet o event později.
- **Návrh opravy** (chirurgická, jen tracker): přidat `JOURNAL_BONUS_MILESTONE` do tří match míst (relevance :473-478 u total/streak/avg klíčů, increment :552-554/:575-580, denní čítač :198-201). Achievementy nedotčené (čtou storage, ne transakce — vzor N-2.1).

### N-3.2 (VYSOKÁ, ❌/⚠️) — Generování targetů: nesoulad baseline metrik s tracking klíči + kategorová minima ignorují sémantiku klíče

`getMinimumTargetForTemplate` (:847-863) aplikuje minima per KATEGORIE (počty completions/zápisů), ale klíče v kategorii mají různé jednotky (dny, streak dny, unikátní návyky, znaky). Šest konkrétních instancí:
- **a) streak_builder**: minima 30/35/40 (3⭐+) + měsíční cap → target vždy = celý měsíc; guide slibuje 10-13 dní.
- **b) variety_champion**: baseline `avgHabitVariety` (denní průměr 1-5) vs. měsíční suma unikátů → minimum 25-40 vždy vyhrává, personalizace mrtvá; target neomezen počtem návyků uživatele (se 4 návyky nesplnitelné).
- **c) bonus_hunter**: baseline `avgDailyBonusHabits` (denní průměr) vs. měsíční počet → minimum 25-40 vždy vyhrává; guide 8-10.
- **d) gratitude_guru**: baseline `avgDailyBonusEntries` (denní průměr bonusů) vs. celkový měsíční počet zápisů → minimum 40-70 vždy vyhrává; guide 105-125.
- **e) consistency_writer**: minima 50/60/70 (3⭐+) + cap → target vždy = celý měsíc; guide 26-30.
- **f) reflection_expert**: baseline `totalJournalEntries` (vč. bonusů) vs. max ~3 quality zápisy/den → pro bonus-heavy uživatele target > dosažitelné maximum = nesplnitelná výzva.
- **Podstata**: buď opravit baseline klíče na správné škály (×30 u denních průměrů; u reflection použít jen non-bonus počty), nebo zavést minima per tracking klíč. **Konflikt guide vs. kód (E5) → rozhodnutí Petra.** Pozn.: měnit generování je bezpečné jen pro NOVĚ generované výzvy — běžící výzvu neměnit.

### N-3.3 (STŘEDNÍ, ⚠️) — Clamp star multiplieru do template range dělá z hvězd obtížnosti kosmetiku

`calculateTargetFromBaseline` ořezává star multiplier do `baselineMultiplierRange` (:697-703): bonus_hunter + depth_explorer [1.20,1.40] → hvězdy 1-4 identických 1.20; streak_builder + consistency_writer [1.15,1.35] → hvězdy 1-3 identických 1.15; variety + gratitude [1.10,1.30] → 1-2⭐ shodné. Guide slibuje +5/+10/+15/+20/+25 %. Řešit spolu s N-3.2 (např. mapovat hvězdy lineárně DOVNITŘ range, ne clampovat).

### N-3.4 (VYSOKÁ, ❌) — Anti-repeat výběru šablon je mrtvý (týká se všech 14 šablon)

Challenge objekt nikdy nenese id šablony (`createMonthlyChallengeObject` :2067-2092 ukládá jen UUID). SQLite ukládá `metadata?.templateId || challenge.id` (SQLiteChallengeStorage.ts:138) resp. `|| ''` při archivaci (:493); `getRecentTemplateIds` (:2164-2181) tak vrací UUID/prázdné stringy → filtr posledních 6 měsíců (:1781-1783) ani penalizace -40 (:1837-1840) se NIKDY netrefí. `cooldownMonths` je definované u všech šablon, ale nikde v logice čtené (grep: jen typ + definice) = mrtvé pole. Weighted random varianta (±20) variety částečně zachraňuje, ale říjnový bug „stejná výzva pořád dokola" je vyléčený jen napůl. **Oprava**: při generování uložit `template.id` na challenge (a číst ho v historii). Překrývá se s 3f (test výběru, session #8/#9) — tam se dopad kvantifikuje.

### N-3.5 (STŘEDNÍ, ⚠️ + 🔶 3e) — „Streak" klíče kumulují a neresetují; in-memory guard přes restart

`habit_streak_days` (:1662-1709) a `daily_journal_streak` (:1716-1780): interní streak počítadlo se při přerušení resetuje, ale ULOŽENÝ progress dostává +1 za každý kvalifikovaný den → hodnota = počet kvalifikovaných dní, ne streak. Při dnešních month-length targetech (N-3.2a/e) ekvivalentní, ale při rebalanci targetů by „streak 12" splnilo jakýchkoliv 12 dní. Rozhodnout sémantiku SPOLU s N-3.2. In-memory stavy (`currentStreakDate`, `todayJournalEntriesCount`, `currentWeekHabits`, `goalProgressCountedDate`) přes restart = double-count — už naplánováno jako 3e device test (rozšířit i o variety scénář).

### N-3.6 (STŘEDNÍ, ⚠️) — Asymetrické undo u journal/variety klíčů

Smazání zápisu posílá `subtractXP` bez metadat (SQLiteGratitudeStorage.ts:439-442) → `quality_journal_entries` nedekrementuje (podmínka na `entryLength`); `daily_journal_streak` denní čítač se nedekrementuje; variety ignoruje direction ≤ 0 (:1599); streaky ignorují direction ≤ 0 (:1665, :1719). Správný vzor existuje u `daily_goal_progress` (:1642-1660, undo řešené). Progress lze nafouknout cyklem přidat+smazat. Oprava: poslat `entryLength` v metadatech při delete + doplnit záporné větve kalkulátorů.

### N-3.7 (NÍZKÁ, ⚠️ i18n) — Dynamický popis Consistency Writer natvrdo anglicky

monthlyChallengeService.ts:2070-2072 skládá EN string mimo t(); všechny ostatní texty šablon jdou přes i18n. Guide tvrdí EN/DE/ES. Oprava: přesunout do lokalizačních klíčů s parametrem počtu zápisů.

### N-3.8 (NÍZKÁ, ⚠️ dokumentace) — Guide čísla neodpovídají kódu

(1) Warm-up scaling: guide „80 % normálních cílů", kód 0.7 (:1453). (2) Tabulky příkladů targetů u šablon (10/11/12…, 8/9/9/10/10…) jsou nereprodukovatelné — reálný výpočet řídí minima a clampy (N-3.2/N-3.3). Po rozhodnutí N-3.2 přepsat guide podle skutečného vzorce.

### N-3.9 (NÍZKÁ, INFO → Fáze 13) — Tři paralelní implementace star scalingu, dvě mrtvé; testy testují mrtvou

`MonthlyChallengeService.applyStarScaling` (:577-583), `UserActivityTracker.applyStarScaling` (userActivityTracker.ts:238-252) a `StarRatingService.calculateDifficulty` (starRatingService.ts:378) nevolá žádný produkční kód (grep: jen testy) a jejich matematika se LIŠÍ od reálné generace (bez range clampu a minim). Testy `monthlyChallenge.phase3*.test.ts` (:355-391) tak zeleně validují API, kterým se výzvy negenerují — reálná cesta `calculateTargetFromBaseline` per-šablonový test nemá. Kandidát na Fázi 13 (smazat mrtvé API + přesměrovat testy na reálnou cestu).

### N-3.10 (NÍZKÁ, ⚠️ UX) — Variety Champion: nekonzistentní definice týdne + šedé aktivní dny v kalendáři

Tracker týden = 1.-7./8.-14./… den měsíce (:1582-1590; poslední „týden" má 1-3 dny), kalendář láme týdny v pondělí (MonthlyProgressCalendar.tsx:205), `weeklyTarget` v UI = target/4 (:937). Dny s aktivitou jen z už-započítaných návyků mají contribution 0 → šedé („none") navzdory splněným návykům.

### N-3.11 (NÍZKÁ, ⚠️) — Sezónní bonus výběru šablon podle AKTUÁLNÍHO měsíce, ne cílového

`selectTemplateForCategory` používá `new Date().getMonth()+1` (:1825-1826); u preview generace na 25.+ den (lifecycle) se tak sezónnost vyhodnotí pro předchozí měsíc (např. prosinec místo ledna — mine lednový bonus Consistency Mastera).

## ROZHODNUTÍ PETRA k nálezům session #7 (2026-07-18)

| Nález | Rozhodnutí | Stav provedení |
|---|---|---|
| N-3.1 | **„Oprav to"** — přidat `JOURNAL_BONUS_MILESTONE` do match míst trackeru | ✅ PROVEDENO 2026-07-18 |
| N-3.2 | **„Co s tím navrhuješ udělat?"** → návrh předložen → **„Dobrá, udělej to" (2026-07-18)** — SCHVÁLENO: srovnat škály baseline metrik, minima per tracking klíč, stropy (variety dle počtu návyků, quality 3/den) | ✅ PROVEDENO 2026-07-18 (viz detail níže) |
| N-3.3 | **„Ten cíl by se měl nějak procentuelně navyšovat, ne?"** → **„Dobrá, udělej to" (2026-07-18)** — SCHVÁLENO: lineární mapování hvězd DOVNITŘ `baselineMultiplierRange` šablony (1⭐=min … 5⭐=max) | ✅ PROVEDENO 2026-07-18 (viz detail níže) |
| N-3.4 | **„Oprav to"** — challenge ponese `templateId`, historie ho vrací, anti-repeat ožije | ✅ PROVEDENO 2026-07-18 |
| N-3.5 + N-3.6 | **„To oprav"** — streak hodnoty = skutečná po sobě jdoucí série (reset při přerušení), undo větve doplnit vč. metadat při mazání zápisu | ✅ PROVEDENO 2026-07-18 (vč. perzistence day-guard stavu = statické uzavření NÁLEZU 4) |
| N-3.7 | **„Tak tomu udělej i DE a ES"** — dynamický popis Consistency Writer přes i18n s překlady EN/DE/ES | ✅ PROVEDENO 2026-07-18 |
| N-3.8 | bez explicitního rozhodnutí — dorovnáno spolu s provedením N-3.2/3.3 (guide tabulky přepočítány dle reálného vzorce, warm-up 80 %→70 %, opraven i kosmetický string `scalingFormula` v kódu na 0.7) | ✅ PROVEDENO 2026-07-18 |
| N-3.9 | „Tomuto vůbec nerozumím" → vysvětleno laicky (3 kalkulačky, appka používá 1, testy hlídají ty 2 mrtvé) → **„Dobře, udělej jak navrhuješ" (2026-07-18)** — SCHVÁLENO: smazat mrtvá scaling API, testy přesměrovat na reálnou cestu | ✅ PROVEDENO 2026-07-18 (viz detail níže) |
| N-3.10, N-3.11 | zatím bez rozhodnutí | odloženo |

### PROVEDENÍ OPRAV (2026-07-18, Fable) — detail

**N-3.1** (`monthlyProgressTracker.ts`): `JOURNAL_BONUS_MILESTONE` přidán do relevance filtru u `total_journal_entries_with_bonus`, `daily_journal_streak`, `avg_entry_length`, do increment větví obou prvních klíčů a do triggeru denního čítače zápisů. `quality_journal_entries` záměrně nedotčen (quality = jen zápisy #1-3 dne, ty milestone nenesou).

**N-3.4**: `MonthlyChallenge` má nové pole `templateId?` (types/gamification.ts); plní ho `createMonthlyChallengeObject` i `createWarmUpChallengeObject`; SQLite ho ukládá (save i archiv, SQLiteChallengeStorage.ts) a čte zpět v `rowToChallengeWithRequirements` (s guardem proti legacy řádkům, kde `template_id` = UUID challenge); `getRecentTemplateIds` vrací jen skutečná template id (UUID fallback odstraněn); AsyncStorage fallback historie ukládá `challenge.templateId`. `cooldownMonths` zůstává mrtvé pole → doplněno do N-3.9/F13 kontextu.

**N-3.5 + N-3.6** (`monthlyProgressTracker.ts` + storage):
- **Reset streaku**: kalkulátory habit/journal streaku při dni zahajujícím NOVOU sérii nastaví `streakResetPending`; apply smyčka pak uloží hodnotu 1 místo `předchozí+1`. Uložený progress = aktuální po sobě jdoucí série. Snapshot/kalendář kontrakt zachován (`appliedIncrements` dál +1 za kvalifikovaný den).
- **Perzistence day-guard stavu** (nutná podmínka resetu — bez ní by restart smazal sérii na 1; zároveň staticky uzavírá NÁLEZ 4 / 11.7.): všechny in-memory guardy (habit streak, journal streak, denní čítač zápisů, goal-day guard, týdenní variety set) se ukládají do AsyncStorage (`monthly_tracker_day_guard_state`), lazy-load na vstupu `updateMonthlyProgress`, save po každé mutaci. Týdenní klíč variety je nově měsíčně-vědomý (`YYYY-MM-W3`). Položka 3e device zůstává jako OVĚŘENÍ opravy na zařízení.
- **Undo větve**: habit streak (uvolnění dnešního dne; nepřesné při více splněních — self-heal dalším splněním, stejný akceptovaný vzor jako `daily_goal_progress`), journal streak (PŘESNÉ — čítač zná počet, den se uvolní jen když klesne pod star požadavek), variety (uvolnění slotu při smazání completion z aktuálního týdne), quality (dekrement díky metadatům). Smazání zápisu/completion nyní posílá metadata: `SQLiteGratitudeStorage.delete` → `{ entryLength, entryPosition, date }` + sourceId; `SQLiteHabitStorage.deleteCompletion` → `{ date }`. Legacy AsyncStorage storage (mrtvá cesta za flagy, N27) záměrně neměněn.

**N-3.7**: `createMonthlyChallengeObject` dostává `t` a skládá popis přes klíč `help.challenges.templates.journal_consistency_writer.descriptionDynamic` (plurál `_one/_other`, interpolace `{{count}}`); překlady doplněny do EN/DE/ES locales.

**Regresní testy** (`monthlyProgressTracker.trackingKeys.test.ts`, 16 → 23): +7 testů — 2× N-3.1 (Gratitude Guru počítá milestone zápis; 5⭐ Consistency Writer den s přesně 5 zápisy kvalifikuje), 2× N-3.5 (reset po mezeře na 1 místo kumulace 7; restart bez double-countu dne = jádro NÁLEZU 4), 3× N-3.6 (undo quality/variety/journal-streak).

**Verifikace (kolo 1 — N-3.1/3.4/3.5/3.6/3.7)**: `npx tsc --noEmit` exit 0; celá suite:

```
Test Suites: 26 passed, 26 total
Tests:       412 passed, 412 total
```

(dřívější stav 405 → 412 po +7 testech; cross-impact: suites Fází 1-3 součástí běhu, vše zelené)

### PROVEDENÍ OPRAV — kolo 2 (2026-07-18, Fable): N-3.2 + N-3.3 + N-3.9 (schváleno „dobrá, udělej to" / „udělej jak navrhuješ")

**N-3.3 — lineární mapování hvězd** (`monthlyChallengeService.ts`, `calculateTargetFromBaseline`):
clamp globální škály 1.05-1.25 do range šablony nahrazen vzorcem
`multiplier(hvězda) = min + (hvězda−1)/4 × (max−min)` (zaokrouhleno na 4 desetinná místa;
součin baseline×multiplier čištěn od float epsilon před `ceil` — 100×1.1 = 110.00000000000001
by jinak dalo target 111). Každá hvězda je nyní ostře těžší u všech šablon.

**N-3.2 — škály, minima, stropy**:
- Baseline metriky šablon: bonus_hunter → `monthlyBonusHabits` (odvozeno: avgDailyBonusHabits×30),
  variety_champion → `monthlyHabitVariety` (avgHabitVariety×4), gratitude_guru →
  `totalJournalEntries`, reflection_expert → **nová metrika `qualityJournalEntries`**
  (non-bonus zápisy #1-3 dne s ≥33 znaky za 30denní okno) — doplněna do
  `UserActivityBaseline` + `DailyActivitySummary` + výpočtu + fallbacku
  (userActivityTracker.ts). Staré uložené baselines bez pole → 0 → fallback větev (bezpečné).
- Minima per tracking klíč (`getMinimumTargetForTemplate`): habit_streak_days +
  daily_journal_streak [5,7,10,14,18] dní; unique_weekly_habits [8,10,12,16,20];
  bonus_habit_completions [5,8,12,16,20]; quality_journal_entries [20,30,40,50,60];
  avg_entry_length [25,30,35,40,45] znaků. Ostatní klíče: kategorová minima (fallback) —
  Goals/Consistency klíče dostanou svá minima po auditu sessions #8/#9.
- Stropy: quality ≤ 3×dny měsíce (v `calculateTargetFromBaseline`); variety ≤ počet
  aktivních návyků × počet týdnů (post-krok v `generateMonthlyChallenge`, lazy require
  `getHabitStorageImpl`, fail-open při chybě). Streak cap na dny v měsíci beze změny.
- Platí pro nově generované výzvy; běžící výzva nedotčena.

**N-3.9 — mrtvá scaling API smazána, testy přesměrovány**:
- Smazáno: `MonthlyChallengeService.STAR_SCALING/getStarScaling/applyStarScaling`,
  `UserActivityTracker.STAR_SCALING/applyStarScaling/getStarScaling` (+ interface
  `StarScalingConfig`), `StarRatingService.calculateDifficulty` (+ jediný privátní
  konzument `calculateConfidenceLevel`, interface `DifficultyCalculationResult`,
  event konstanta `DIFFICULTY_RECALCULATED` — nic z toho neměl žádný produkční caller).
- Testy přesměrovány na reálnou cestu `calculateTargetFromBaseline`: přepsáno 6 testů
  ve 4 souborech (phase3 B3/B4/B5/B8 + integrace ř. ~816; phase3.test 2+3 přes
  `jest.requireActual` — soubor službu celou mockuje; baseline.test 2 testy;
  userActivityTracker.test — 3 testy mrtvého API smazány bez náhrady, matematika
  je kryta v phase3 souborech). Bonus: odhalil se skrytý float bug (110→111), opraven výše.
- Pozn.: phase3.test „1. XP reward calculation" dál pinuje hodnoty VLASTNÍHO mocku
  (500-2532) — reálné hodnoty (5000-25000) kryje produkční B1; ponecháno (mock je
  podpěra lifecycle testů), zapsáno pro transparentnost.

**Dokumentace**: guide `technical-guides:Monthly-Challenges.md` — sekce 0b rozšířena
o body 7+8; tabulky příkladů 8 auditovaných šablon přepočítány podle reálného vzorce
(vč. minim a stropů); STAR_SCALING snippety nahrazeny vzorcem lineárního mapování;
„+5..25 % nad baseline" opraveno na per-šablonový range; warm-up 80 %→70 % (N-3.8).

**Verifikace (kolo 2)**: `npx tsc --noEmit` exit 0; celá suite:

```
Test Suites: 26 passed, 26 total
Tests:       409 passed, 409 total
```

(412 → 409: −3 smazané testy mrtvého API v userActivityTracker.test.ts; všech 26 suites
zelených vč. cross-impact Fází 1-3)

### Návrh řešení N-3.2 + N-3.3 (předloženo Petrovi 2026-07-18, čeká na schválení)

1. **N-3.3 (hvězdy)**: místo clampu mapovat hvězdy lineárně dovnitř `baselineMultiplierRange` šablony: `multiplier(hvězda) = min + (hvězda−1)/4 × (max−min)`. Každá hvězda je pak reálně těžší a range šablony zůstává respektovaný.
2. **Špatné škály baseline metrik** (denní průměr vs. měsíční cíl): bonus_hunter → `avgDailyBonusHabits × 30`; gratitude_guru → `totalJournalEntries` (přímý měsíční počet všech zápisů); reflection_expert → nová baseline metrika `qualityJournalEntries` (počet non-bonus zápisů ≥33 znaků za 30 dní) — jediné čisté řešení nesplnitelnosti; variety_champion → `avgHabitVariety × 4` (aproximace týdenních unikátů) + strop `počet aktivních návyků × počet týdnů`.
3. **Minima per tracking klíč** místo per kategorie (streak klíče ~[5,7,10,14,18] dní, variety ~[8,10,12,16,20] atd.) — přesná čísla doladit při implementaci.
4. Platí jen pro NOVĚ generované výzvy; běžící výzva se nemění. Po schválení dorovnat guide (N-3.8).

## PLAN-DISCREPANCY

Žádné — počty (14 šablon = 4+4+2+4), ID šablon, soubory i testy z plánu odpovídají realitě repa.

## Brána úplnosti (session #7 — rozsah 3.0 + 3a + 3b)

| Položek dle plánu (3.0 + 4 Habits + 4 Journal) | Sekcí ve zprávě | Shoda |
|---|---|---|
| 9 | 9 (3.0, 3a-1…3a-4, 3b-1…3b-4) | ✓ |

Zbývající položky Fáze 3 (sessions #8-#9 dle batching tabulky): 3c (Goals 2), 3d (Consistency 4), 3e (device), 3f (weighted random test), 3g (konec měsíce všech 14).

## Stav: NEDOKONČENO (fáze) / session #7 HOTOVÁ — pokračovat od 3c (session #8)

Auditní část session #7 kompletní (E1 dodrženo — žádný kód změněn). Opravy čekají na rozhodnutí Petra k N-3.1 až N-3.11.
