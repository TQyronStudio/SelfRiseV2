# Fáze 5 — nálezy (super audit 2026-07): Goals — PLNÝ audit

Datum: 2026-07-19 | Commit: `f98246a` (+ neodcommitované opravy Fáze 4) | Node: v24.18.0
Baseline: tsc 0 chyb, testy 435/435 (29/29 suites)

```
Tests:       435 passed, 435 total
```

Scope dle plánu: položky 5.0–5.6. Guide: `technical-guides:Goals.md` (1143 ř.)
+ `technical-guides:Gamification-Core.md` (XP hodnoty). Známý rozpor z plánu:
completion bonus 350 XP práh „≥ 1000" (Goals.md ř. 838) vs. „≥ 10 000"
(Gamification-Core.md) — položka 5.0.

## Položky

### 5.0 Práh completion bonusu — 1000 vs. 10 000

- Kde: `src/constants/gamification.ts:53`, `SQLiteGoalStorage.ts:503, 706, 918`,
  legacy `goalStorage.ts:325, 499, 710`
- Pravidlo: Goals.md ř. 838 „target ≥ 1000" vs. Gamification-Core.md „≥ 10 000".
- Ověřeno jak: grep `10000|BIG_GOAL` přes celý `src/`.
- Verdikt: ✅ **kód je plně konzistentní na 10 000** — všech 6 výskytů
  (konstanta s komentářem „targetValue ≥ 10000", obě storage cesty completion
  i statistiky `bigGoalsCompleted`). Chybu má JEN dokumentace Goals.md.
- Nález N-5.7 (doc): opravit Goals.md ř. 838 na „≥ 10 000" (plán tuto opravu
  přímo předepisuje, jde o potvrzený scénář „dokumentační chyba").

### 5.1 Validace vstupů

- Kde: `GoalForm.tsx:309-336` (validateForm), `ProgressEntryForm.tsx:60-75`,
  `TargetDateStepSelectionModal.tsx:204-223`, storage: bez validace
- Pravidlo: guide ř. 78-87 (title 1-100, targetValue>0, currentValue
  0..target, targetDate dnes/budoucnost, unit 1-20) + ř. 976-1005
  (GoalValidationService) + ř. 606-627 (progress nesmí přes target, denní
  limit hlásí chybu) + ř. 1100-1107 (max 999 999).
- Ověřeno jak: čtení všech tří vstupních cest + grep validátorů.
- Verdikt: ⚠️ — jádro validace existuje ve formulářích, ale několik odchylek
  od guide a guide popisuje neexistující třídu.
- Důkaz per pravidlo:
  - title: `GoalForm.tsx:312-317` — required, **min 2** (guide říká 1-100),
    max 100 ✅/⚠️ (odchylka min).
  - unit: ř. 320-324 — required, max 20 ✅.
  - targetValue: ř. 326-328 — `> 0` ✅; **žádná horní mez** (guide
    VALUE_TOO_LARGE max 999 999 — neimplementováno) ⚠️.
  - description: ř. 330-332 — **max 300** (guide říká 500) ⚠️.
  - targetDate: `TargetDateStepSelectionModal.tsx:210-218` — okamžitá
    validace `selectedDate < today(midnight)` → chyba „pastDate" ✅
    (lokální půlnoc ✅). Ve `validateForm` se datum už nevaliduje (modal je
    jediný vstup data) ✅.
  - progress value: `ProgressEntryForm.tsx:63-67` — `> 0`, **max 1 000 000**
    (guide 999 999 — kosmetický nesoulad) ✅/⚠️; note max 200 ✅;
    datum = vždy `today()` (lokální, žádné backdating) ✅.
  - currentValue 0..target: dolní mez drží datová vrstva
    (`updateGoalValue`, `data.ts:214-217` — `Math.max(0, …)`) ✅; **horní
    mez neexistuje** — progress smí překročit target (overachievement),
    v přímém rozporu s guide ř. 610-613 („Progress would exceed target
    value") ⚠️ E5.
  - Denní limit ve formuláři: guide ř. 620-624 předepisuje chybovou hlášku
    při 4. zápisu; realita: zápis se uloží VŽDY, jen XP vrstva tiše vrátí
    0 XP ⚠️ E5 (viz 5.2).
  - `GoalValidationService` (guide ř. 976): třída v kódu **neexistuje**
    (plán to předpovídá — validace žije ve formulářích) — guide fikce.
  - Storage vrstva: `create`/`update`/`addProgress` nevalidují nic — jediná
    ochrana jsou formuláře. Interní cesty (tutorial, demo) validaci obcházejí
    (zapsáno, žádný reálný abuse vektor v UI).

### 5.2 Limit 3 XP transakce / cíl / den

- Kde: `src/services/gamification/xpLimits.ts:60-61, 80-82, 146-160, 216-227`;
  počítadlo `gamificationService.ts:2041` (`dailyData.goalTransactions[sourceId]`)
- Pravidlo: plán — GOAL_PROGRESS limitováno, GOAL_COMPLETION exempt.
- Ověřeno jak: čtení `validateXPAddition` + trasování počítadla; kryto
  testy `xpLimits.test.ts` (Fáze 1).
- Verdikt: ✅ implementováno centrálně a správně; ⚠️ 2 hrany.
- Důkaz:
  - `MAX_GOAL_TRANSACTIONS_PER_DAY = 3` (ř. 61, komentář „migrated from
    GoalStorage.MAX_DAILY_POSITIVE_XP_PER_GOAL" — přesně dle plánu).
  - Check ř. 146-160: jen `amount > 0` + `sourceId` + source ∈
    {GOAL_PROGRESS, GOAL_MILESTONE} → per-goal počítadlo ✅.
  - GOAL_COMPLETION: exempt z per-goal limitu, z denního stropu (ř. 81
    `null`) i z rate-limitu (ř. 216-227) ✅. Denní strop zdroje
    GOALS_MAX_DAILY 400 na progress/milestone ✅.
  - **Hrana A (N-5.9)**: po vyčerpání limitu další `addProgress` uloží
    zápis s 0 XP, ale jeho pozdější SMAZÁNÍ vždy odečte plných 35 XP
    (`SQLiteGoalStorage.deleteProgress:608-614` odečítá bez znalosti, kolik
    bylo reálně přiznáno) → uživatel může přijít o XP, které nedostal.
  - **Hrana B**: `subtractXP` (negativní progress) není limitován — jen
    nevýhoda pro uživatele, žádný exploit; zapsáno.
  - Doc drobnost (N-5.8): komentář konstanty `PROGRESS_ENTRY` říká „max
    once per goal per day" (`constants/gamification.ts:48`) — správně 3×.

### 5.3 Milestone XP (25/50/75 % → 50/75/100 XP)

- Kde: legacy `goalStorage.ts:285-311` (implementováno); **SQLite
  `SQLiteGoalStorage.addProgress` ř. 408-522 — CHYBÍ ÚPLNĚ**
- Pravidlo: guide ř. 834-836 + 913-935 (checkMilestones) — 50/75/100 XP při
  překročení prahu, bez znovu-vydělání kolísáním.
- Ověřeno jak: grep `GOAL_MILESTONE` přes `src/` — producenti vs. konzumenti.
- Verdikt: ❌ **MRTVÉ v živé cestě** — SQLite storage (flag
  `USE_SQLITE_GOALS: true`, `featureFlags.ts:36`) milestone XP nikdy
  neudílí. Jediný producent je legacy `goalStorage.addProgress` (mrtvá
  cesta, vč. AsyncStorage anti-re-earn setu `goal_milestones_${id}`).
  Konzumenti existují všude (UI popupy `XpPopupAnimation.tsx:88`,
  achievementy `achievementService.ts:975`, denní limity `xpLimits.ts:82`)
  — infrastruktura bez producenta. Stejná třída regrese jako N-4.1
  (funkce ztracena při přepisu na SQLite).
- Dopad na uživatele: za celý životní cyklus cíle přijde o 225 XP
  (50+75+100); XP popup pro milestone se nikdy neukáže.
- Pozn. pro opravu: tabulka `goal_milestones` v SQLite existuje
  (`init.ts:270-278`) a je dnes prakticky mrtvá (zápis jen migrace/demo;
  čtení jen mrtvý dotaz v `getById` — viz N-5.4) — nabízí se jako
  perzistence „už uděleno" místo AsyncStorage klíče.

### 5.4 Completion XP a reverze (justCompleted / −250)

- Kde: award `SQLiteGoalStorage.addProgress:493-510`; reverze POUZE
  `recalculateGoalValue:693-721`; status logika `utils/data.ts:206-241`
  (`updateGoalValue`)
- Pravidlo: guide ř. 846-871 — `justCompleted = isCompleted && !wasCompleted`
  (+250/350); při poklesu pod 100 % automatická reverze −250/350.
- Ověřeno jak: čtení obou cest + trasování volajících (`GoalsContext`:
  addProgress ř. 234, deleteProgress ř. 276; `updateProgress` nemá v UI
  žádného volajícího — edit záznamu neexistuje).
- Verdikt: ⚠️ — award ✅ správně (první dosažení, big-goal větev, exempt
  z limitů); reverze funguje jen v jedné ze dvou cest.
- Důkaz:
  - `justCompleted` ✅ (ř. 493-495); double-award přes cyklus
    complete→delete→complete je symetrický (recalc odečte −250, nové
    dokončení +250, net 0) ✅.
  - **N-5.2 ❌: přímý 'subtract' progress completion NIKDY nezruší** —
    `updateGoalValue` (`data.ts:229`) mění status jen směrem
    ACTIVE→COMPLETED; pokles pod target status nechává COMPLETED →
    `addProgress` žádnou reverzi nespustí. Cíl zůstane „dokončený" se
    např. 80 % a −250 XP se nikdy nestane. Guide ř. 859-871 reverzi
    výslovně předepisuje. Cesta smazání záznamu (recalculateGoalValue
    ř. 696-702, 714-721) reverzi dělá správně → dvě cesty, dvě chování.
  - Race double-award (plán): dva souběžné addProgress oba přečtou status
    ACTIVE → teoreticky 2×250 (completion je exempt z rate-limitu);
    prakticky vyžaduje dvojité odeslání formuláře v jednom okamžiku —
    zapsáno jako teoretická hrana, bez opravy (nízké riziko).
  - Datumová hrana (N-5.5): `completedDate` se nastavuje přes
    `getCurrentDateString()` = **UTC** (`data.ts:18-19` `toISOString`);
    stejné UTC v `recalculateGoalValue` ř. 726 a ve fallbacku `startDate`
    (`getAll` ř. 42, `getByStatus` ř. 328). Po lokální půlnoci (CET 0:00-2:00)
    je completedDate/startDate včerejšek. Stejná třída jako opravený
    N-4.1c; konvence appky je lokální `formatDateToString`/`today()`.

### 5.5 Target Date Step-by-Step modal

- Kde: `src/components/goals/TargetDateStepSelectionModal.tsx` (existuje,
  + `TargetDateConfirmationModal.tsx`)
- Pravidlo: guide ř. 91-587 — anti-blink (setCurrentStep uvnitř animačního
  callbacku), okamžitá validace minulého data, back navigace.
- Ověřeno jak: statické čtení handlerů (device = nižší priorita dle plánu).
- Verdikt: ✅ staticky v pořádku, 🔶 vizuální plynulost jen na zařízení.
- Důkaz: `handleMonthSelect`/`handleDaySelect`/`handleBackNavigation`
  (ř. 197-238) — všechny mění krok výhradně v callbacku
  `animateModalResize(..., () => setCurrentStep(...))` s komentářem „Step
  changes AFTER fade out - no blink" = přesně guide vzor ✅; validace
  minulého data okamžitá s lokální půlnocí (ř. 210-218) ✅; back šipka
  zachovává vyšší volby ✅.
- 🔶 Device scénář: projít Y→M→D tam a zpět a sledovat, že obsah nikdy
  neproblikne ve špatné velikosti modalu (přidat k device sezení, nízká
  priorita).

### 5.6 Storage split-brain re-verifikace

- Kde: grep přes `src/` + `app/`
- Pravidlo: žádné přímé použití legacy `goalStorage` mimo
  `getGoalStorageImpl()`.
- Ověřeno jak: `grep "new GoalStorage()|from …/goalStorage"` (obě formy cest).
- Verdikt: ✅ čisté — s dvěma známými, už evidovanými výjimkami.
- Důkaz:
  - `GoalsContext.tsx:7` používá `getGoalStorageImpl()` ✅; žádný jiný
    spotřebitel legacy instance nenalezen.
  - `SQLiteGoalStorage.ts:15` importuje z legacy souboru POUZE čistou
    funkci `calculateTimelineStatus` (ne storage instanci) — přijatelné,
    kandidát na přesun do utils při Fázi 13.
  - `backup.ts:5` importuje legacy `goalStorage` — ZNÁMÝ BLOCKER debt ze
    sekce 0 plánu („nesmí se zapnout bez migrace"), beze změny.

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-5.1 | ❌ **VYSOKÁ** | Milestone XP (25/50/75 % → 50/75/100) je v živé SQLite cestě MRTVÉ — uživatel ztrácí 225 XP na cíl a milestone popup se nikdy neukáže (5.3) | `SQLiteGoalStorage.addProgress` (chybí), legacy `goalStorage.ts:285-311` (má) | Přenést milestone logiku do SQLite addProgress; „už uděleno" persistovat v existující (dnes mrtvé) tabulce `goal_milestones`; + testy |
| N-5.2 | ❌ VYSOKÁ | Odečtení progressu pod target completion NEzruší (status zůstane COMPLETED, −250 se nestane) — guide reverzi předepisuje; cesta smazání záznamu ji přitom dělá (5.4) | `utils/data.ts:229` (jen ACTIVE→COMPLETED), `SQLiteGoalStorage.addProgress` | Sjednotit: v addProgress po 'subtract' pod target přepnout na ACTIVE + subtractXP (stejně jako recalculateGoalValue) |
| N-5.3 | ⚠️ STŘEDNÍ | UTC datumy u cílů: `getCurrentDateString()` (completedDate, startDate) + `recalculateGoalValue:726` + startDate fallbacky — po půlnoci „včerejšek" (5.4) | `utils/data.ts:18-19`, `SQLiteGoalStorage.ts:42, 328, 726` | Přepnout na lokální `formatDateToString`/`today()` (stejná oprava jako N-4.1c) |
| N-5.4 | 🧹 nízká | Mrtvý dotaz na `goal_milestones` v `getById` (výsledek se zahazuje) | `SQLiteGoalStorage.ts:67-71` | Smazat (nebo využít při N-5.1) |
| N-5.5 | 🧹 nízká | `hasGoalProgressToday`: SQLite verze se dotazuje na neexistující sloupec `timestamp` (vždy vrátí false přes catch); obě verze BEZ volajících | `SQLiteGoalStorage.ts:995-1010`, `goalStorage.ts:800-811` | Smazat obě (mrtvý kód) |
| N-5.6 | ⚠️ E5 | Validace vs. guide: title min 2 vs. 1; description 300 vs. 500; chybí max targetValue (999 999); progress smí přes target (overachievement) vs. guide zákaz; denní limit tichý vs. guide chybová hláška; `GoalValidationService` neexistuje (5.1) | `GoalForm.tsx`, `ProgressEntryForm.tsx`, guide ř. 78-87, 606-627, 976-1005 | Petr rozhodne: doporučuji PONECHAT chování kódu (overachievement je feature, tiché XP kapování je OK UX) a přepsat guide podle reality + doplnit max targetValue 999 999 do GoalForm |
| N-5.7 | 🧹 doc | Goals.md ř. 838: „target ≥ 1000" → správně „≥ 10 000" (kód konzistentní, 5.0) | guide | Opravit číslo (plán to předepisuje) |
| N-5.8 | 🧹 doc | Komentář konstanty: „max once per goal per day" → správně 3× | `constants/gamification.ts:48` | Opravit komentář |
| N-5.9 | ⚠️ E5 | Smazání progressu zapsaného PO vyčerpání denního limitu odečte 35 XP, které nikdy nepřišly (5.2 hrana A) | `SQLiteGoalStorage.deleteProgress:608-614` | Petr rozhodne: buď akceptovat (vzácná hrana, zapsat do guide), nebo při mazání ověřit reálné XP transakce |

Poznámka (bez čísla): smazání celého CÍLE hard-deletne progress bez XP
reverze — stejné chování jako u návyků (N-4.5, rozhodnuto „XP zůstává").
Navrhuji při opravách jen doplnit stejné pravidlo do Goals guide.

## Rozhodnutí Petra (2026-07-19, session #11 — doslovně)

> „N5.1 - oprav tp
> N5.2 - souhlasím, oprav to
> N5.3 - souhlasím s opravou
> N5.6 - dobře, souhlasím s tebou
> N5.9 - ok, zapiš to
> Drobnosti: oprav tak jak píšeš"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-5.1 | OPRAVIT | Milestone XP do `SQLiteGoalStorage.addProgress` (prahy 25/50/75, jen kladný směr); anti-re-earn persistovat v tabulce `goal_milestones` (id `${goalId}_xp_${threshold}`); + testy |
| N-5.2 | OPRAVIT | `updateGoalValue` downgraduje COMPLETED→ACTIVE při poklesu pod target (+ smaže completedDate); addProgress při `justUncompleted` odečte completion XP (SQLite i legacy parita) |
| N-5.3 | OPRAVIT | `getCurrentDateString` → lokální; `recalculateGoalValue` completedDate → `today()`; startDate fallbacky → `formatDateToString` |
| N-5.4 | PROVÉST | Smazat mrtvý dotaz v `getById` |
| N-5.5 | PROVÉST | Smazat `hasGoalProgressToday` z obou storage |
| N-5.6 | Kód ponechat, guide přepsat | Overachievement zůstává; tiché XP kapování zůstává; guide §Validation/§Progress Validation přepsat podle reality; do GoalForm doplnit max targetValue 999 999 (+ locales EN/DE/ES) |
| N-5.7 | PROVÉST | Goals.md ř. 838: „≥ 1000" → „≥ 10 000" |
| N-5.8 | PROVÉST | Komentář konstanty na „max 3× per goal per day" |
| N-5.9 | ZAPSAT | Známá hrana do guide (mazání zápisu po limitu odečte 35 XP) — bez změny kódu |
| pozn. | ZAPSAT | Smazání cíle nechává XP — pravidlo do Goals guide (paralela N-4.5) |

## PLAN-DISCREPANCY

- Plán cituje `SQLiteGoalStorage.ts:509` pro práh 10 000 — aktuálně ř. 503
  (posun řádků, obsah sedí).
- Plán správně předpověděl: `goalValidationService.ts` neexistuje, validace
  žije ve formulářích ✓; komentář „migrated from
  GoalStorage.MAX_DAILY_POSITIVE_XP_PER_GOAL" v xpLimits nalezen ✓.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 7 (5.0–5.6) | 7 (5.0–5.6) | ✓ |

## PROVEDENÍ OPRAV (2026-07-19, po rozhodnutích Petra)

Postup: jedna oprava → `tsc` (pokaždé 0) → testy. Pořadí a obsah:

1. **N-5.3 ✅ PROVEDENO** — `getCurrentDateString` (`utils/data.ts`) přepsán
   na lokální datum (ovlivňuje startDate + completedDate cílů — jediní
   volající); `recalculateGoalValue` completedDate → `today()`; startDate
   fallbacky v `getAll`/`getById`/`getByStatus` → `formatDateToString`
   (getByStatus navíc nově preferuje uložený `start_date`, dřív ho ignoroval).
2. **N-5.3b ✅ PROVEDENO (nalezeno novým testem)** — `completedDate` se z DB
   vracel jako **epoch číslo**, ačkoliv typ deklaruje DateString: completion
   modal zobrazoval surové číslo (`GoalCompletionModal.tsx:215`) a
   `achievementIntegration.isDateInTimeframe` (string porovnání
   `dateStr === todayStr`) s číslem vracel VŽDY false → timeframe achievementy
   nad dokončenými cíli nikdy nesedly. Mapping všech tří čtení opraven na
   lokální DateString.
3. **N-5.2 ✅ PROVEDENO** — `updateGoalValue` (`utils/data.ts`) nově
   downgraduje COMPLETED→ACTIVE při poklesu pod target (+ maže completedDate);
   `SQLiteGoalStorage.addProgress` při `justUncompleted` odečítá completion
   XP (250/350); legacy `goalStorage.addProgress` paritně.
4. **N-5.1 ✅ PROVEDENO** — milestone XP (25/50/75 % → 50/75/100) obnoveno
   v `SQLiteGoalStorage.addProgress`: jen kladný směr, více prahů najednou
   možných, anti-re-earn persistovaný v tabulce `goal_milestones`
   (id `${goalId}_xp_${threshold}`, INSERT před addXP).
5. **Nová suite `src/services/storage/__tests__/sqliteGoalStorage.progressXP.test.ts`
   (10 testů, reálná in-memory SQLite)**: milestone crossing/vícenásobné
   prahy/oscilace/subtract směr; completion 250 + big goal 350; reverze
   při subtract pod target (status, completedDate, −250) + symetrický
   cyklus; lokální completedDate/startDate. Výstup: `Tests: 10 passed`.
6. **N-5.4 ✅** — mrtvý dotaz na `goal_milestones` v `getById` smazán.
   **N-5.5 ✅** — `hasGoalProgressToday` smazána z obou storage (SQLite verze
   se ptala na neexistující sloupec `timestamp`; žádní volající).
7. **N-5.6 ✅** — `GoalForm.validateForm`: doplněn horní limit
   `targetValue > 999999` → chyba `targetValueTooLarge` (locale klíče už
   v EN/DE/ES existovaly, jen se nepoužívaly). Chování kódu jinak ponecháno
   dle rozhodnutí (overachievement, tiché XP kapování).
8. **N-5.7 ✅** — Goals.md: práh BIG completion „≥ 1000" → „≥ 10 000".
   **N-5.8 ✅** — komentář konstanty PROGRESS_ENTRY opraven na 3×/den.
   **N-5.9 ✅ ZAPSÁNO** — známá hrana do guide §Progress Validation.
   **Guide dále** (N-5.6): §Validation Rules a §Validation Services přepsány
   podle reality (formuláře, žádná GoalValidationService), §Progress
   Validation (overachievement povolen, limit tichý), §Milestone Detection
   (skutečná implementace s goal_milestones), §Reversible XP (obě cesty),
   nová sekce §Goal Deletion & XP (XP zůstává — paralela N-4.5).

### Verifikace po opravách

```
npx tsc --noEmit → 0 chyb (po každé opravě)
npm test         → Tests: 445 passed, 445 total (30/30 suites)
```

Vývoj počtu testů: 435 → +10 (nová progressXP suite) = **445/445 (30/30)**.

### Cross-impact F2+F3

```
F2 (achievementy): 3 suites → Tests: 113 passed, 113 total
F3 (měsíční výzvy): 6 suites → Tests: 100 passed, 100 total
```

Vyhodnocení dopadu na uzavřené fáze:
- **N-5.1** přidává nové XP transakce `GOAL_MILESTONE` — konzumenti z Fáze 2
  (achievementy) a Fáze 3 (XP Champion baseline `totalMonthlyXP`) je začnou
  vidět. To je ZAMÝŠLENÝ stav (infrastruktura na ně čekala — `xpLimits`,
  UI popupy, achievement sources); závěry fází se nemění, jen se plní dřív
  prázdný kanál.
- **N-5.3b** zprovozňuje timeframe vyhodnocení dokončených cílů
  v `achievementIntegration` (dřív vždy false kvůli číslu místo DateString)
  — oprava directly PODPORUJE závěry Fáze 2 (typová konzistence), žádný
  audit-ovaný evaluator se nechová hůř; suites F2 zelené.
- **N-5.2** je symetrická reverze (net 0 při cyklu) — bez dopadu na závěry.
- Vše ostatní: display/doc/mrtvý kód. **Závěry fází 1-3 nedotčeny, suites
  zelené.**

## Stav: HOTOVO (2026-07-19) — audit 7/7 položek ✓, všech 9 nálezů (+N-5.3b) rozhodnuto a PROVEDENO, cross-impact F2+F3 ✓
