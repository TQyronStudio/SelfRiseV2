# Fáze 4 — nálezy (super audit 2026-07): Habits — PLNÝ audit

Datum: 2026-07-19 | Commit: `f98246a` | Node: v24.18.0 | Baseline: tsc 0 chyb, testy 426/426 (28/28 suites)

Doslovný výstup baseline:

```
Test Suites: 28 passed, 28 total
Tests:       426 passed, 426 total
```

Regresní suites Fáze 4 (položka 4.8, spuštěno předem jako součást baseline):

```
npx jest __tests__/utils/date.timezone.test.ts      → Tests: 18 passed, 18 total
npx jest __tests__/hooks/useHabitsData.makeup.test.tsx → Tests: 6 passed, 6 total
```

Scope dle plánu: položky 4.1–4.8. Guide: `technical-guides:Habits.md` (653 ř., naposledy editován 2026-05-18 — starší než všechny 4 velké audity, pozor na drift).

Soubory: `SQLiteHabitStorage.ts` (619 ř.), `habitStorage.ts` legacy (758 ř.),
`HabitsContext.tsx` (386 ř.), `habitImmutability.ts` (409 ř.),
`habitCalculations.ts` (221 ř.), `HabitResetUtils.ts` (126 ř.),
`useHabitsData.ts` + UI komponenty (viz 4.3).

---

## Položky

### 4.1 Immutability pravidlo — „MINULOST SE NEMĚNÍ"

- Kde: `src/utils/habitImmutability.ts:34-69` (`getScheduledDaysForDate`),
  `src/services/storage/SQLiteHabitStorage.ts:106-187` (`update`),
  `src/services/storage/SQLiteHabitStorage.ts:555-571` (`rowToHabit`),
  `src/services/storage/SQLiteHabitStorage.ts:595-615` (`getScheduleHistory`),
  `src/contexts/HabitsContext.tsx:164-167` (`loadHabits`)
- Pravidlo: guide `technical-guides:Habits.md` ř. 24-64 — změny `scheduledDays`
  platí jen od data změny dále; completion rate používá rozvrh platný v daný
  den (`wasScheduledOnDate`), nikdy současný `habit.scheduledDays`.
- Ověřeno jak: trasování toku živé cesty (feature flag → storage → context →
  UI) + grep všech volajících `getScheduleHistory` a `scheduleHistory`.
- Verdikt: ❌ **NEFUNGUJE v živé cestě** — celý immutability systém je mrtvý,
  protože `scheduleHistory` se nikdy nenačte z DB do habit objektů.
- Důkaz (řetěz):
  1. Živá cesta je SQLite: `src/config/featureFlags.ts:26`
     (`USE_SQLITE_HABITS: true`) → `getHabitStorageImpl()` vrací
     `sqliteHabitStorage` (`featureFlags.ts:99-103`).
  2. `SQLiteHabitStorage.rowToHabit` (ř. 555-571) **nikdy nenastaví**
     `scheduleHistory` — vlastní komentář ř. 569: *„scheduleHistory will be
     loaded separately if needed"*.
  3. Metoda `getScheduleHistory(habitId)` (ř. 595) **nemá jediného
     volajícího** — grep `getScheduleHistory` přes `src/` + `app/` najde jen
     definici. Tabulka `habit_schedule_history` je write-only (zápis:
     `update()` ř. 124-128 a `habitsMigration.ts:85-102`; čtení: nikdo).
  4. `HabitsContext.loadHabits` (ř. 164-167) volá jen `getAll()` +
     `getAllCompletions()` — habit objekty v celé aplikaci mají
     `scheduleHistory === undefined`.
  5. `getScheduledDaysForDate` (`habitImmutability.ts:36-38`): bez timeline
     → fallback `return habit.scheduledDays` (SOUČASNÝ rozvrh) pro **všechna**
     historická data. Všech 13 volajících `wasScheduledOnDate` (UI komponenty,
     useHabitsData, recommendationEngine) tak počítá historii podle aktuálního
     rozvrhu.
- Dopad na uživatele: přesně scénář z plánu — návyk Po-Pá 2 týdny → změna na
  Po-St-Út: historická červená pole za út/čt zmizí, completion rate za minulost
  se přepočítá podle nového rozvrhu, minulé bonus dny mohou zpětně změnit
  barvu. Guide tohle výslovně zakazuje (ř. 25: „MINULOST SE NEMĚNÍ").
- Vedlejší defekty (i kdyby se historie načítala, zůstávají):
  - **4.1b**: `SQLiteHabitStorage.update()` při PRVNÍ změně rozvrhu nezapíše
    záznam PŮVODNÍHO rozvrhu s platností od vytvoření návyku (legacy
    `createScheduleChangeEntry` v `habitImmutability.ts:196-210` to dělá,
    SQLite verze ř. 116-129 ne). Období před první změnou by pak spadlo do
    fallbacku na současný rozvrh → historie před první změnou špatně.
  - **4.1c**: effective_from_date se počítá jako
    `new Date().toISOString().split('T')[0]` (`SQLiteHabitStorage.ts:120`)
    = **UTC** datum. Konvence aplikace je lokální `formatDateToString` (UTC
    parsování bylo opraveno v auditu 6/13, N4). Pro CET uživatele mezi
    půlnocí a 1-2h ráno se změna stane retroaktivně platnou od včerejška.
- Poznámka: legacy `habitStorage.ts:104-114` (mrtvá cesta, flag true) dělá
  immutability SPRÁVNĚ — `createScheduleChangeEntry` + migrace při `getAll`.
  Regrese vznikla při přechodu na SQLite (fáze 1.2.4 dle hlavičky souboru).

### 4.2 Smart Bonus Conversion — chronologické 1:1 párování

- Kde: `src/hooks/useHabitsData.ts:277-411` (`applySmartBonusConversion`),
  týdenní klíč `src/utils/date.ts:136-159` (`getWeekStart`/`getWeekDates`)
- Pravidlo: guide ř. 165-227 — týdenní Po-Ne seskupení, chronologické 1:1
  párování (nejstarší zmeškaný + nejstarší bonus), konverze needitovatelná
  zpětně („Conversion State Freezing", ř. 66-76).
- Ověřeno jak: čtení algoritmu řádek po řádku + porovnání s guide příklady
  1 a 2; grep persistence (`updateCompletion`, `is_converted`).
- Verdikt: ⚠️ **algoritmus párování odpovídá guide, ale „zmražení konverzí"
  neexistuje** — konverze se počítá on-the-fly a nikdy se nepersistuje.
- Důkaz:
  - Seskupení Po-Ne: `getWeekStart` (`date.ts:136-142`) je pondělní vč.
    nedělní korekce (`dayOfWeek === 0 ? -6 : 1`) ✅.
  - Chronologické párování 1:1: `useHabitsData.ts:332-350` — `sortedMissed`
    (vzestupně) × `sortedBonuses` (vzestupně), `pairCount = Math.min(...)` ✅
    odpovídá guide krokům 3-4 i příkladům (bonus smí krýt i pozdější
    zmeškaný den v témže týdnu — guide příklad 1, Thu→Fri ✅).
  - Dny před vytvořením návyku se nepočítají jako zmeškané
    (`date >= creationDateString`, ř. 323) ✅.
  - **4.2a — konverze není nikdy persistovaná**: `updateCompletion`
    (SQLite ř. 380, podporuje `isConverted`/`convertedFromDate`) **nemá
    jediného volajícího** mimo storage třídy. DB sloupec `is_converted` se
    zapisuje jen jako `0` při create (`SQLiteHabitStorage.ts:335`) a při
    migraci. „Zmražení" konverze tedy nefunguje jako uložený stav — každé
    překreslení konverzi přepočítá z aktuálních dat. Dokud jsou vstupní data
    stabilní, výsledek je deterministický a stejný; jakmile se ale změní
    rozvrh, konverze se přepočítají podle NOVÉHO rozvrhu (protože
    `wasScheduledOnDate` je přes nález 4.1 fallback na současný rozvrh) —
    přímé porušení guide ř. 37 („Smart Bonus Conversions zůstávají zmražené")
    a ř. 71-76. Root cause je 4.1; po jeho opravě bude přepočet minulých
    týdnů stabilní (data minulých týdnů se nemění) a „freezing" bude
    emergentní vlastnost. Zapsáno jako závislý nález, řešení = oprava 4.1
    (persistence konverzí NENÍ nutná, pokud Petr nerozhodne jinak).
  - **4.2b — dnešek se páruje jako „zmeškaný"**: ř. 314-325 počítá mezi
    zmeškané dny i DNEŠEK (`date === todayStr`), komentář přiznává „for
    display purposes". Důsledek: bonus z pondělí se ve středu ráno spáruje
    s dnešní středou (scheduled, ještě nesplněná) → kalendář ukáže bonus
    jako zelený makeup a dnešek s modrou tečkou, přestože uživatel může
    středu ještě splnit. Po splnění se konverze sama přepočítá zpět
    (transientní, ale viditelné „blikání" sémantiky). Guide párování dnešku
    neřeší → konflikt E5, rozhodne Petr (návrh: párovat jen dny < dnes,
    dnešek nechat jen pro šedé zobrazení v grafech).
  - XP při konverzi: bonus completion dostal 15 XP při vzniku; konverzí na
    makeup se XP nemění. Guide žádnou XP korekci nepředepisuje → ✅ v souladu
    (jen konstatováno).

### 4.3 Completion rate formula — jednotnost napříč UI

- Kde: sdílená utilita `src/utils/habitCalculations.ts:44-73`; konzumenti viz níže
- Pravidlo: guide ř. 233-284 — JEDNOTNÁ formule
  `(completedScheduled + bonusCompletions) / scheduledDays × 100` napříč všemi
  komponentami.
- Ověřeno jak: grep `calculateHabitCompletionRate` + grep výpočtů `* 100`
  přes `src/components/`, každé místo posouzeno v kontextu.
- Verdikt: ⚠️ — většina komponent sdílenou utilitu volá, ale **dva Home
  widgety mají vlastní vzorec BEZ bonusů** a jeden z nich zobrazuje vnitřně
  nekonzistentní hlavičku.
- Inventura všech míst s výpočtem rate:
  - ✅ `useHabitsData.getHabitStats` (`useHabitsData.ts:160`) → utilita;
    přes něj `HabitStatsAccordionItem.tsx:53` (obrazovka statistik návyků)
    a per-habit žebříček v `MonthlyHabitOverview.tsx:142`.
  - ✅ `YearlyHabitOverview.tsx:193` (per-habit výkonnost) → utilita.
  - ✅ `HabitPerformanceIndicators.tsx:129` → utilita.
  - ✅ `HabitTrendAnalysis.tsx:137` + `:203` (týdenní trend i per-habit) → utilita.
  - ✅ `recommendationEngine.ts:148` + `:216` → utilita.
  - ✅ `MonthlyHabitOverview.tsx:119` a `YearlyHabitOverview.tsx:145`
    (agregát přes všechny návyky): inline vzorec
    `(scheduled+bonus completions)/totalPossible` — utilitu nevolá (ta je
    per-habit), ale matematicky odpovídá guide formuli vč. bonusů.
  - ❌ **4.3a — `WeeklyHabitChart.tsx:102` a `Monthly30DayChart.tsx:101`**:
    souhrnné `avgCompletionRate = totalScheduledCompletions / totalPossible`
    — **bonusy vyloučeny**, v rozporu s guide formulí. Navíc hlavička
    (`WeeklyHabitChart.tsx:300-304`, locale klíč
    `'{{completed}}/{{total}} ({{percent}}%)'`, `en/index.ts:127+137`)
    dosazuje za `completed` hodnotu `totalCompletions` VČETNĚ bonusů, ale
    `percent` je BEZ bonusů — uživatel vidí např. „12/10 (80 %)": zlomek
    říká 120 %, procento 80 %. Stejný vzor v obou grafech (copy-paste).
    Dopad: dva widgety na Home ukazují jinou sémantiku procenta než
    Monthly/Yearly overview a než statistiky návyků.
  - ⚠️ per-day sloupečky (`WeeklyHabitChart.tsx:76`, `Monthly30DayChart.tsx:75`,
    `MonthlyHabitOverview.tsx:177` dailyChartData): denní rate bez bonusů —
    denní metrika pro barvu/výšku sloupce, ne „completion rate" dle guide;
    přijatelné, jen zapsáno.
  - ✅ `DailyProgressBar.tsx:29` — obecný progress bar (completed/total ze
    props, dnešní den), nejde o completion rate periody.
- **4.3b — mrtvý kód v utilitě**: `habitCalculations.ts:3` importuje
  `getHabitFrequencyForDate` a `calculateAverageFrequencyForPeriod`, ale
  funkce je nikde nepoužívá; parametry `periodStartDate`/`periodEndDate`
  (ř. 22-23, plněné volajícím v `useHabitsData.ts:164-165`) se ignorují;
  komentářový blok `habitCalculations.ts:211-222` popisuje
  „frequency-proportional bonus" (bonusRate = bonus/týdenní frekvence),
  který implementace nedělá (bonusRate = bonus/scheduledDays). Pozůstatek
  staršího návrhu — matoucí dokumentace přímo v kódu.

### 4.4 XP aplikace a reverze (HABIT_COMPLETION 25 / HABIT_BONUS 15)

- Kde: konstanty `src/constants/gamification.ts:16-17`; SQLite
  `SQLiteHabitStorage.ts:343-355` (add) a `:458-472` (subtract); legacy
  `habitStorage.ts:277-289` (add) a `:355-368` (subtract)
- Pravidlo: guide ř. 134-147 — 25 XP scheduled / 15 XP bonus, přičtení při
  vytvoření completion, odečtení při smazání, v obou storage cestách.
- Ověřeno jak: čtení obou implementací + grep `XP_REWARDS.HABIT` a
  `deleteCompletionsByHabitId` volajících.
- Verdikt: ✅ hodnoty i symetrie add/subtract sedí v obou cestách; ⚠️ jeden
  nekrytý případ (4.4a) a jeden drift legacy cesty (4.4b).
- Důkaz:
  - `XP_REWARDS.HABIT.SCHEDULED_COMPLETION: 25`, `BONUS_COMPLETION: 15`
    (`constants/gamification.ts:16-17`) ✅ = guide.
  - SQLite `createCompletion` ř. 345-355: `addXP(25|15, {source:
    HABIT_COMPLETION|HABIT_BONUS, sourceId: habitId})` ✅;
    `deleteCompletion` ř. 459-472: `subtractXP` stejné částky + `metadata:
    {date}` (pro reverzi měsíčních výzev, N-3.6) ✅; `toggleCompletion`
    ř. 491-509 deleguje na create/delete ✅.
  - Legacy `createCompletion` ř. 279-289 a `deleteCompletion` ř. 357-368:
    stejné hodnoty ✅ (mrtvá cesta, flag `USE_SQLITE_HABITS: true`).
  - **4.4a — smazání celého návyku nevrací žádné XP**: `delete()` (SQLite
    ř. 189-205) volá `deleteCompletionsByHabitId` (ř. 481-489), který
    HROMADNĚ smaže všechny completions **bez subtractXP** (stejně legacy
    ř. 151 + 380-393). Uživatel smazáním návyku zachová veškeré XP z jeho
    historie. Guide XP sémantiku smazání NÁVYKU vůbec neřeší → E5, rozhodne
    Petr. Poznámka: ponechání XP je pravděpodobně záměr (mazání návyku by
    nemělo vzít měsíce poctivého XP) — ale mělo by to být zapsané pravidlo
    v guide, ne mlčenlivé chování.
  - **4.4b — legacy subtractXP bez `metadata.date`**: oprava N-3.6 (reverze
    trackeru výzev) se dělala jen v SQLite cestě; legacy `subtractXP`
    (ř. 363-368) metadata nemá. Mrtvý kód → jen evidence pro Fázi 13 (N27).

### 4.5 Streak-milestone XP — stav vs. guide

- Kde: guide ř. 149-159 + 618-623; konstanty
  `constants/gamification.ts:18-22`; legacy stub
  `habitStorage.ts:453-470`
- Pravidlo: guide vede jako „FUTURE FEATURE / DEFINED, NOT IMPLEMENTED"
  (7d=75, 14d=100, 30d=150, 50d=200, 100d=300 XP).
- Ověřeno jak: grep `checkAndAwardStreakMilestones`, `HABIT_STREAK_MILESTONE`,
  `STREAK_*_DAYS` přes celý `src/` + `app/`.
- Verdikt: ✅ **nezavedeno, guide sedí** — žádná cesta v aplikaci neudílí
  `HABIT_STREAK_MILESTONE` XP.
- Důkaz:
  - Jediná „implementace" je `habitStorage.checkAndAwardStreakMilestones`
    (legacy, ř. 453) — private metoda **bez jediného volajícího** (grep najde
    jen definici), a i kdyby se volala, jen `console.log`, XP neudílí.
  - SQLite cesta nemá nic. Infrastruktura připravená (enum
    `XPSourceType.HABIT_STREAK_MILESTONE`, konstanty, UI switch-e v
    `XpNotification.tsx:62`, `XpPopupAnimation.tsx:69`, denní limit v
    `xpLimits.ts:75`) — vše konzumenti bez producenta.
- Doplněk (soubor ze scope, bez vlastní položky v plánu):
  `HabitResetUtils.ts` je fakticky no-op — jediné živé volání je
  `initializeResetSystem()` (`HabitsContext.tsx:160`), které pouze zapíše
  dnešní datum do AsyncStorage (`habitTracker:lastReset`); nic ten záznam
  nečte a „reset" nic neresetuje (completions jsou per-datum, reset není
  potřeba). Metody `isToday`/`isYesterday`/`getDaysSince`/`clearResetData`
  jsou mrtvé. Guide §Technical Debt ho vede jako „IMPLEMENTED but needs
  testing validation" — reálně jde o kandidáta na smazání (Fáze 13).

### 4.6 N31 — obrácená závislost storage→gamification

- Kde: `SQLiteHabitStorage.ts:9` (import `GamificationService`), volání
  `addXP` ř. 351, `subtractXP` ř. 465
- Pravidlo: plán položka 4.6 — potvrdit a zapsat jako known-debt pro Fázi 13.
- Ověřeno jak: čtení souboru.
- Verdikt: ✅ potvrzeno (known-debt, beze změny).
- Důkaz: storage vrstva přímo importuje a volá gamifikační službu — obrácená
  závislost trvá. Pozn.: plán uvádí `SQLiteHabitStorage.ts:333`, po
  editacích souboru je addXP na ř. 351 (drobná PLAN-DISCREPANCY, jen posun
  řádků). Evidováno pro Fázi 13, v rámci Fáze 4 se nemění (chirurgický
  princip — funguje).

### 4.7 Cache invalidation — content-aware

- Kde: `src/hooks/useHabitsData.ts:24-71` (conversion cache),
  `src/contexts/HabitsContext.tsx:13-15 + 129-136` (query cache TTL 5 s)
- Pravidlo: guide ř. 78-88 — „Content-Aware Invalidation: cache musí
  detekovat změny v OBSAHU habit objektů, ne jen jejich počet".
- Ověřeno jak: čtení obou cache vrstev + trasování invalidace při
  přidání/odebrání/editaci completion.
- Verdikt: ⚠️ — habity jsou content-aware ✅, ale completions část hashe je
  **count-based** a hash nezná aktuální datum.
- Důkaz:
  - Hash: `useHabitsData.ts:48` —
    `${habitsContentHash}-${state.completions.length}`. Habits část
    (ř. 29-39) obsahuje id, scheduledDays, scheduleHistory i updatedAt ✅
    content-aware. Completions část je jen **délka pole** ❌.
  - Přidání completion: délka +1 → invalidace ✅. Odebrání: −1 → ✅.
  - **4.7a — výměna completion beze změny počtu**: toggle OFF (den X) a
    hned toggle ON (den Y) vrátí délku na původní hodnotu; pokud mezi
    oběma dispatchi žádný konzument nezavolá
    `getHabitCompletionsWithConversion` (např. uživatel je na obrazovce
    Habits — seznam konverzi nevolá, viz `HabitItemWithCompletion`), hash
    se rovná původnímu → cache se NEinvaliduje a statistiky/kalendář ukážou
    starý stav do další mutace. EDITACE completion přes `updateCompletion`
    v živém kódu nenastává (bez volajících, viz 4.2a) — jediné „editace"
    jsou právě delete+create páry, tedy přesně rizikový vzor.
  - **4.7b — hash nezná datum**: konverze závisí na dnešku (zmeškané dny
    jen ≤ dnes, párování dneška 4.2b). Při přechodu přes půlnoc bez datové
    mutace zůstane cache platná → včerejší nesplněný scheduled den se
    v grafech neukáže jako zmeškaný, dokud uživatel něco nezmění.
  - Query cache v `HabitsContext` (TTL 5 s): všechny mutace volají
    `invalidateQueryCache()` (create ř. 198, update ř. 237, delete ř. 256,
    toggle ř. 280+288+316+321, order ř. 342) ✅.
  - **4.7c — guide si protiřečí (E5)**: §Cache Invalidation (ř. 80-88)
    předepisuje content-aware a count-based označuje ❌ WRONG; §Performance
    Optimization (ř. 355-380) ukazuje jako vzorovou implementaci právě
    count-based hash `${habits.length}-${completions.length}`. Kód je dnes
    napůl (habits content-aware, completions count). Návrh: opravit kód na
    plně content-aware a §Performance v guide přepsat podle reality.

### 4.8 Regresní suites fáze

- Kde: `__tests__/hooks/useHabitsData.makeup.test.tsx` (6 testů),
  `__tests__/utils/date.timezone.test.ts` (18 testů)
- Ověřeno jak: spuštěno v rámci baseline (viz hlavička zprávy).
- Verdikt: ✅ obě suites zelené — doslovně:
  `Tests: 6 passed, 6 total` (makeup), `Tests: 18 passed, 18 total` (timezone).
- ⚠️ Důležitý kontext k nálezu 4.1: makeup test vkládá `scheduleHistory` do
  habit objektu RUČNĚ (`useHabitsData.makeup.test.tsx:182-193`) — testuje
  tedy správně utilitu `habitImmutability`, ale NE end-to-end řetěz
  (storage → context → hook). Proto je suite zelená, přestože živá cesta
  `scheduleHistory` nikdy nedodá. Stejný vzorec jako batch-truncation bug
  ze 14. 7. (jednotky OK, obalující tok ne) — po opravě N-4.1 doplnit test
  na úrovni storage.

---

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-4.1 | ❌ **KRITICKÁ** | „MINULOST SE NEMĚNÍ" je v živé cestě mrtvé — `scheduleHistory` se nikdy nenačte z DB, všechna historie se počítá podle AKTUÁLNÍHO rozvrhu (položka 4.1; + 4.1b nezapsaný původní rozvrh při první změně; + 4.1c UTC datum změny) | `SQLiteHabitStorage.ts:555-571, 116-129, 120`; `habitImmutability.ts:36-38` | Načítat `habit_schedule_history` v `getAll`/`getById` a plnit `habit.scheduleHistory`; při první změně zapsat i původní rozvrh s platností od vytvoření; datum změny přes `formatDateToString` (lokální). Po opravě doplnit storage-level test |
| N-4.2 | ⚠️ střední | Dnešek se páruje jako „zmeškaný" den → bonus se spotřebuje na krytí dneška, který uživatel může ještě splnit (transientní blikání) (4.2b) | `useHabitsData.ts:314-325` | E5 rozhodnutí: párovat jen dny < dnes (dnešek nechat pro šedé zobrazení) |
| N-4.3 | ❌ vysoká | Weekly/Monthly30Day hlavička: procento BEZ bonusů, zlomek S bonusy — vnitřně nekonzistentní a v rozporu s jednotnou formulí (4.3a) | `WeeklyHabitChart.tsx:102+300`, `Monthly30DayChart.tsx:101+276` | Počítat `avgCompletionRate` včetně bonusů (= guide formule), jako Monthly/Yearly overview |
| N-4.4 | 🧹 nízká | Mrtvý import + ignorované parametry + zastaralý „frequency-proportional" komentář v utilite (4.3b) | `habitCalculations.ts:3, 22-23, 211-222` | Smazat mrtvý import/parametry/komentář (nebo Fáze 13) |
| N-4.5 | ⚠️ E5 | Smazání návyku smaže všechny completions BEZ vrácení XP — nikde nezdokumentované pravidlo (4.4a) | `SQLiteHabitStorage.ts:189-205, 481-489` | Petr rozhodne: ponechat XP (návrh) a zapsat do guide, nebo XP vracet |
| N-4.6 | 🧹 nízká | Legacy `subtractXP` bez `metadata.date` (N-3.6 jen v SQLite) — mrtvá cesta (4.4b) | `habitStorage.ts:363-368` | Jen evidence pro Fázi 13 (N27 smazání legacy) |
| N-4.7 | ⚠️ střední | Conversion cache: completions část hashe count-based (výměna completion beze změny počtu neinvaliduje) + hash nezná datum (půlnoc) (4.7a+4.7b) | `useHabitsData.ts:48` | Hash z content completions (id+date+updatedAt) + přidat dnešní datum do hashe |
| N-4.8 | ⚠️ E5 | Guide si protiřečí: §Cache Invalidation (content-aware ✅) vs. §Performance (count-based jako vzor) (4.7c) | guide ř. 80-88 vs. 355-380 | Přepsat §Performance podle opravené reality |
| N-4.9 | 🧹 nízká | `HabitResetUtils` je no-op (zapíše datum, nikdo nečte, nic neresetuje); guide ho vede jako „IMPLEMENTED" | `HabitResetUtils.ts` celý, volání `HabitsContext.tsx:160` | Kandidát na smazání (Fáze 13) + opravit guide §Technical Debt |

Závislost: 4.2a (konverze nejsou „zmražené") je důsledek N-4.1 — po jeho
opravě je přepočet minulých týdnů deterministický a zvláštní oprava není
třeba (pokud Petr nerozhodne o persistenci konverzí).

## Rozhodnutí Petra (2026-07-19, session #10 — doslovně)

> „N4.1 - oprav to jak nejlépe uznáš za vhnodné s nějvětší profesionalitou
> N4.2 - dobrý návrh, udělej to
> N4.3 - udělej jak píšeš
> N4.5 - zapiš to
> N4.7 - pokud to pomůže, tak to udělej
> Drobnosti: Nechám opravy čistě na tobě, všechny ty body vyřeš"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-4.1 | OPRAVIT (plná profesionalita) | Načítat `habit_schedule_history` v `getAll` (1 batch dotaz) i `getById`; při první změně rozvrhu zapsat i PŮVODNÍ rozvrh s platností od data vytvoření návyku (přeskočit, pokud návyk vznikl dnes); druhá změna v tentýž den UPDATUJE denní záznam (žádné duplicitní datumy); `effective_from_date` lokálně přes `formatDateToString`; sekundární řazení `created_at ASC`; nový storage-level test end-to-end |
| N-4.2 | PROVÉST | Párovat jen zmeškané dny < dnes; dnešní zobrazení v grafech zachovat |
| N-4.3 | PROVÉST | `avgCompletionRate` v obou grafech včetně bonusů (= guide formule) |
| N-4.4 | PROVÉST (volné ruce) | Smazat mrtvý import, ignorované parametry i zastaralý komentář; upravit volajícího |
| N-4.5 | ZAPSAT (chování ponechat) | Pravidlo „smazání návyku XP nechává" zapsat do guide §XP Integration |
| N-4.6 | PROVÉST (volné ruce) | Doplnit `metadata: { date }` i do legacy `subtractXP` (parita, 1 řádek) |
| N-4.7 | PROVÉST | Invalidace referencí (React state arrays jsou immutable — porovnání referencí je O(1) a přesné) + dnešní datum; nahrazuje string-hash |
| N-4.8 | PROVÉST (volné ruce) | Přepsat guide §Performance/§Cache podle nové reality |
| N-4.9 | PROVÉST (volné ruce) | Smazat no-op `HabitResetUtils` + volání v `HabitsContext`; opravit guide §Technical Debt |

Postup: opravy po jedné, po každé `tsc` + testy; na závěr plná suite +
**cross-impact F2+F3** (regresní suites Fáze 2 a 3 + vyhodnocení dopadu).

## PLAN-DISCREPANCY

- Plán uvádí N31 na `SQLiteHabitStorage.ts:333` — po editacích (N-3.6 aj.)
  je `addXP` na ř. 351. Jen posun řádků, obsah sedí.
- Jiné nesrovnalosti plán vs. realita nebyly nalezeny (soubory, testy 18+6,
  formule v guide odpovídají plánované citaci).

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 8 (4.1–4.8) | 8 (4.1–4.8) | ✓ |

## PROVEDENÍ OPRAV (2026-07-19, po rozhodnutích Petra)

Postup: jedna oprava → `tsc` (pokaždé 0 chyb) → testy. Pořadí a obsah:

1. **N-4.1 ✅ PROVEDENO** — `SQLiteHabitStorage.ts`: (a) nový privátní helper
   `attachScheduleHistories()` — 1 batch dotaz na `habit_schedule_history`
   (řazení `effective_from_date ASC, created_at ASC`), timeline připojen ke
   všem habitům v `getAll()`; `getById()` připojuje přes `getScheduleHistory()`
   (tamtéž doplněno sekundární řazení). (b) `update()`: při PRVNÍ změně
   rozvrhu se zapíše seed záznam PŮVODNÍHO rozvrhu s platností od data
   vytvoření (přeskočeno, když návyk vznikl dnes); druhá změna v tentýž den
   UPDATUJE denní záznam (žádné duplicitní datumy). (c) `effective_from_date`
   lokálně přes `formatDateToString` místo UTC `toISOString()`.
   **Nová suite `src/services/storage/__tests__/sqliteHabitStorage.scheduleHistory.test.ts`
   (8 testů, reálná in-memory SQLite)** — vč. přesného uživatelského scénáře
   z plánu (Po-Pá 2 týdny → změna → historie podle PŮVODNÍHO rozvrhu) a
   regrese „bez změny žádný timeline". Výstup: `Tests: 8 passed, 8 total`.
2. **N-4.2 ✅ PROVEDENO** — `useHabitsData.ts`: zmeškané dny pro párování jen
   `date < todayStr` (dnešek se nikdy nepáruje). Kalendář/grafy dnešek
   nezobrazují červeně z jiné logiky (ověřeno: `HabitCalendarView.tsx:272`
   — `isPastDay && !isToday`; grafy počítají missed aritmeticky), takže
   syntetický záznam pro dnešek nebyl potřeba. +1 test v makeup suite
   (`does not consume a bonus to cover TODAY... [N-4.2]`) → 7/7.
3. **N-4.3 ✅ PROVEDENO** — `WeeklyHabitChart.tsx` + `Monthly30DayChart.tsx`:
   `avgCompletionRate` počítá `(scheduled + bonus) / possible` — procento už
   odpovídá zobrazenému zlomku i jednotné formuli.
4. **N-4.7 ✅ PROVEDENO** — `useHabitsData.ts`: string-hash nahrazen
   invalidací porovnáním referencí (`state.habits`/`state.completions` —
   reducer při každé mutaci vytváří nová pole, reference je přesný O(1)
   detektor) + kontrola kalendářního dne (půlnoční přechod). Řeší 4.7a i 4.7b.
5. **N-4.4 ✅ PROVEDENO** — `habitCalculations.ts`: smazán mrtvý import
   z `habitImmutability`, parametry `periodStartDate`/`periodEndDate`
   z rozhraní i volajícího (`useHabitsData.getHabitStats`), zastaralý
   „frequency-proportional" komentářový blok; doc-komentář přepsán podle
   skutečné formule.
6. **N-4.6 ✅ PROVEDENO** — legacy `habitStorage.deleteCompletion`: doplněno
   `metadata: { date }` do `subtractXP` (parita se SQLite, N-3.6).
7. **N-4.9 ✅ PROVEDENO** — smazán `src/utils/HabitResetUtils.ts` + import a
   volání v `HabitsContext.loadHabits` (grep před smazáním: jediná reference).
8. **N-4.5 ✅ ZAPSÁNO + N-4.8 ✅ PROVEDENO** — `technical-guides:Habits.md`:
   nová sekce „Habit Deletion & XP" (XP při smazání návyku zůstává — záměr);
   §Cache Invalidation Principle a §Performance/Cache Implementation
   přepsány na skutečnou reference-based invalidaci; §Smart Bonus Conversion
   doplněno pravidlo „jen minulé dny se párují"; §Historical Data
   Preservation doplněna datová vrstva (seed, lokální datum, testy);
   §Technical Debt — HabitResetUtils označen jako smazaný.

### Verifikace po opravách

```
npx tsc --noEmit                     → 0 chyb (po každé opravě)
npm test                             → Test Suites: 29 passed, 29 total
                                       Tests:       435 passed, 435 total
```

Vývoj počtu testů: 426 → +8 (nová scheduleHistory suite) → +1 (N-4.2 test)
= **435/435 (29/29 suites)**.

### Cross-impact F2+F3 (pravidlo plánu, sekce 1)

Fáze 4 je výrobce dat pro konzumenty z fází 2-3 — po opravách spuštěny
regresní suites obou fází:

```
F2 (achievementy): achievementEvaluation + AchievementLogic + storageSplitBrain
   → Test Suites: 3 passed | Tests: 113 passed, 113 total
F3 (měsíční výzvy): trackingKeys + phase3 + phase3.production +
   starRatingMigration + selection.distribution + lifecycle.closure
   → Test Suites: 6 passed | Tests: 100 passed, 100 total
```

Vyhodnocení dopadu: žádná z oprav nemění ukládaná gamifikační data ani XP
toky — N-4.1 mění jen zápis/čtení `habit_schedule_history` (achievement
evaluatory ani challenge tracker tuto tabulku nečtou; pracují s completions,
počty habitů a XP eventy), N-4.2/4.3/4.7 jsou čistě zobrazovací vrstva,
N-4.6 je mrtvá cesta, N-4.9 mazal no-op. **Závěry fází 1-3 nedotčeny,
re-verifikace položek není potřeba, suites zelené.**

## Stav: HOTOVO (2026-07-19) — audit 8/8 položek ✓, všech 9 nálezů N-4.1–N-4.9 rozhodnuto a PROVEDENO, cross-impact F2+F3 ✓
