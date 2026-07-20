# Fáze 6 — nálezy (super audit 2026-07): My Journal — PLNÝ audit

Datum: 2026-07-20 | Commit: `09cbabf` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 445/445 (30/30 suites)

```
Tests:       445 passed, 445 total
```

Regresní suite fáze (položka 6.0):

```
npx jest sqliteGratitudeStorage.streakDebt.test.ts → Tests: 23 passed, 23 total
```

Scope dle plánu: položky 6.0–6.5. Guide: `technical-guides:My-Journal.md`
(653 ř.). Soubory: `SQLiteGratitudeStorage.ts` (1779 ř.),
`GratitudeContext.tsx` (341 ř.), + `constants/gamification.ts`,
`gamificationService.ts`, `gamification/xpLimits.ts`.

**Celkové hodnocení: ČISTÁ fáze.** Žádný kritický ani vysoký nález. Debt/
freeze/warm-up systém, pozice-based XP i milestone počítadla jsou funkčně
správné a kryté testy. 4 nálezy nízké priority (mrtvý kód + vestigiální
pole + nekonzistentní konstanta) — kandidáti na úklid, ne bugy.

## Položky

### 6.0 Baseline streakDebt suite

- Verdikt: ✅ zelené — `Tests: 23 passed, 23 total`.
- PLAN-DISCREPANCY: plán uvádí 20 testů, reálně 23 (suite mezitím narostla
  o 3 testy). Jen posun počtu, obsah pokrývá debt gate dle guide.

### 6.1 Debt / freeze / warm-up systém

- Kde: `calculateFrozenDays` (`SQLiteGratitudeStorage.ts:769-811`),
  `calculateAndUpdateStreak` (:1011-1211), `adsNeededToWarmUp` (:1427-1444),
  `applySingleWarmUpPayment` (:1450-1492), `warmUpStreakWithAds` (:1476+),
  `executeForceResetDebt` (`GratitudeStreakCard.tsx:543-560`)
- Pravidlo: guide ř. 85-110 (Debt Gate — žádný „today complete → 0" early
  return), ř. 264-356 (danger zones), ř. 506-646 (justUnfrozeToday +1).
- Ověřeno jak: čtení logiky od nuly + 23 testů (in-memory SQLite) zelené.
- Verdikt: ✅ **funkčně správné** — s jedním nálezem mrtvého duplikátu.
- Důkaz:
  - `calculateFrozenDays` (:781-787) — explicitní komentář + BEZ „today
    complete → 0" early returnu; dluh = nezaplacené minulé dny; jediný
    early return je `currentStreak === 0` (guide ř. 98) ✅.
  - `adsNeededToWarmUp` (:1429-1437) — BEZ „3+ entries today → 0" early
    returnu; `> 3` → auto-reset ✅ (guide ř. 102-103).
  - Auto-reset boundary: `debtExcludingToday > 3` (:1037), zachovává
    `longestStreak` přes warm-up aware výpočet (:1050-1057), preservuje
    milestone countery ✅.
  - `justUnfrozeToday && todayComplete` → `streakBeforeFreeze + 1`
    (:1098-1101), `justUnfrozeToday && !todayComplete` → drží
    `streakBeforeFreeze` (:1103-1105) ✅ = guide Component 1.
  - `executeForceResetDebt` volá smyčku `applySingleWarmUpPayment` (bez
    přímého zápisu streak stavu) ✅ = guide ř. 104-106.
  - **N-6.1 (mrtvý kód)**: `calculateAndUpdateStreakWithWarmUp`
    (`SQLiteGratitudeStorage.ts:1214-1312`, ~100 ř.) je **duplikát
    `calculateAndUpdateStreak` bez jediného volajícího** (grep přes `src/`
    + `app/` = 0 callerů). Živá cesta používá výhradně
    `calculateAndUpdateStreak`. Riziko: budoucí úprava streak logiky se
    omylem provede jen v jedné z kopií → divergence.

### 6.2 Happy path + pozice-based XP + denní strop

- Kde: `getXPForJournalEntry` (`SQLiteGratitudeStorage.ts:356-368`), award
  v `create` (:284-321); konstanty `constants/gamification.ts:26-42, 100,
  138-160`; enforcement `xpLimits.ts:71-113, 197-211`
- Pravidlo: guide ř. 44-53 (3+ = complete), plán (20/20/20 pro 1.-3., 8 pro
  4.-13., 0 pro 14+, per-den; strop 415 = `3×FIRST + 10×BONUS + 3 milestones`).
- Ověřeno jak: čtení funkce + dohledání skutečně vynucených limitů.
- Verdikt: ⚠️ pozice-based XP ✅ správně; denní strop má **rozbitou
  aritmetiku v komentáři + vestigiální nevynucené konstanty**.
- Důkaz:
  - `getXPForJournalEntry`: pozice 1-3 → 20, 4-13 → 8, 14+ → 0 ✅; pozice
    = `countByDate + 1` (per-datum, resetuje se každý den) ✅ per-den, ne
    kumulativně.
  - Milestone XP: pozice 4/8/13 → +25/+50/+100 nad rámec base 8, jedna
    transakce se source `JOURNAL_BONUS_MILESTONE` ✅.
  - **N-6.2a (chybná aritmetika)**: `JOURNAL_MAX_DAILY: 415`
    (`constants/gamification.ts:100`) i komentář u source configu (:140-142)
    tvrdí „3×20 + 10×8 + 25 + 50 + 100 = 415". Skutečný součet =
    60 + 80 + 175 = **315**, ne 415. Reálné maximum denního journal XP je
    315 (13 zápisů). Strop 415 tedy nikdy nezasáhne → funkčně neškodí, ale
    číslo i komentář jsou faktograficky špatně.
  - **N-6.2b (nevynucené konstanty)**: `XP_SOURCE_CONFIG[...].dailyLimit`
    pro journal zdroje (JOURNAL_ENTRY 315, JOURNAL_BONUS 80,
    JOURNAL_BONUS_MILESTONE 175 — `constants:138-160`) se **nevynucují**;
    `validateXPAddition` používá `getSourceDailyLimit` (`xpLimits.ts:76-79`),
    který pro VŠECHNY journal zdroje vrací jednotně 415. Ty per-source
    hodnoty jsou tak vestigiální a navíc vzájemně nekonzistentní
    (JOURNAL_BONUS_MILESTONE reálně vyprodukuje až 199 XP/den — base 8×3 +
    175 — ale „limit" 175). Riziko: pokud by se někdy začaly vynucovat,
    ořízly by legitimní XP.

### 6.3 Milestone počítadla ⭐🔥👑 — create/delete symetrie

- Kde: `calculateMilestoneCounters` (`SQLiteGratitudeStorage.ts:693-721`),
  create (bez inline update, :325-329), delete inline decrement (:458-480)
  + finální `calculateAndUpdateStreak` (:483)
- Pravidlo: plán 6.3 — zápis PŘI VYTVOŘENÍ i SMAZÁNÍ symetrický (smazání 13.
  zápisu vezme crown zpět).
- Ověřeno jak: trasování obou cest ke zdroji pravdy.
- Verdikt: ✅ **symetrické a správné** — countery jsou odvozené SQL dotazem
  (count-based), ne inkrementované; jeden nález redundance.
- Důkaz:
  - `calculateMilestoneCounters` počítá `SUM(CASE WHEN entry_count >= 4/8/13)`
    přes dny (:701-709) — **zdroj pravdy je počet dnů s N+ zápisy**, ne
    přírůstkový čítač. Create i delete nakonec volají
    `calculateAndUpdateStreak`, který countery přepočte z tohoto SQL
    (:1046 auto-reset větev, :1138 normální větev — obě vždy nastaví
    star/flame/crown). → smazání 13. zápisu sníží crown, přidání zvýší,
    symetricky ✅.
  - **N-6.3 (redundantní kód)**: delete (:464-479) navíc dělá inline
    `updateStreak({ starCount: currentStreak.starCount - 1 })` atd., které
    je vzápětí **přepsáno** přepočtem v `calculateAndUpdateStreak` (:483).
    Logika `position === 4 && newCount < 4` je navíc sémanticky křehká
    (pozice se nerenumerují) — ale díky finálnímu přepočtu na výsledek nemá
    vliv. Mrtvá/zavádějící práce, kandidát na odstranění.

### 6.4 searchByContent — DE/ES diakritika

- Kde: `SQLiteGratitudeStorage.searchByContent` (:77-91)
- Pravidlo: plán 6.4 — case-insensitivita pro diakritiku přes JS filtr,
  ne SQL LIKE/LOWER (ASCII-only).
- Ověřeno jak: čtení implementace.
- Verdikt: ✅ **správně** — `getAll()` (newest-first) → JS
  `.filter(e => e.content.toLowerCase().includes(term.toLowerCase()))`
  (:79-82). JS `toLowerCase()` je Unicode-aware (Ä→ä, É→é), takže DE/ES
  diakritika funguje; komentář (:67-76) tuto volbu i historii (chybějící
  metoda → split-brain oprava 7/2026) dokumentuje.

### 6.5 journalEntryCount synchronizace

- Kde: definice `gamificationService.ts:150`; zápis legacy :2059/:2077,
  SQLite fresh-count :2157-2164/:2181; init :2221
- Pravidlo: plán 6.5 — sync mezi create/delete napříč SQLite i AsyncStorage.
- Ověřeno jak: grep všech čtení/zápisů pole napříč `src/`.
- Verdikt: ⚠️ pole je udržované, ale **vestigiální (nikdo ho nečte) a
  nekonzistentní**.
- Důkaz:
  - **Žádný konzument**: grep `journalEntryCount` přes celý `src/` — pole se
    jen zapisuje/inkrementuje, **nikde se nečte pro rozhodnutí**.
    Anti-spam „14+ = 0 XP" řídí `getXPForJournalEntry(position)` v storage
    (pozice ze SQL countByDate), NE toto pole.
  - **N-6.4 (nekonzistence + vestigiál)**: SQLite fresh-count (:2161-2163)
    počítá `source IN (JOURNAL_ENTRY, JOURNAL_BONUS)` — **vynechává
    `JOURNAL_BONUS_MILESTONE`**, takže den se 13 zápisy dá journalEntryCount
    = 10 (pozice 4/8/13 chybí). Legacy inkrement (:2058) taky vynechává
    milestone source při create, ale delete odečítá přes JOURNAL_BONUS
    (:430) → v legacy cestě navíc drift. Bez konzumenta = **žádný dopad na
    uživatele dnes**; riziko jen kdyby se pole začalo číst. Kandidát na
    odstranění (Fáze 13) nebo doplnění milestone source.

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-6.1 | 🧹 nízká | `calculateAndUpdateStreakWithWarmUp` je mrtvý duplikát (~100 ř., 0 callerů) — riziko divergence streak logiky | `SQLiteGratitudeStorage.ts:1214-1312` | Smazat |
| N-6.2 | 🧹 nízká | `JOURNAL_MAX_DAILY = 415` + komentáře: aritmetika je 315, ne 415; per-source `XP_SOURCE_CONFIG.dailyLimit` (315/80/175) se nevynucují a jsou nekonzistentní | `constants/gamification.ts:100, 140-142, 150, 159` | Opravit číslo na 315 (nebo ponechat volný strop, ale opravit komentář); označit/odstranit vestigiální per-source dailyLimit |
| N-6.3 | 🧹 nízká | Redundantní inline decrement milestone counterů v delete() — přepsán následným `calculateAndUpdateStreak`; navíc křehká `position && newCount` logika | `SQLiteGratitudeStorage.ts:458-480` | Smazat inline blok (přepočet stačí) |
| N-6.4 | 🧹 nízká/INFO | `journalEntryCount` je vestigiální (0 konzumentů) a nekonzistentní (SQLite i legacy vynechává JOURNAL_BONUS_MILESTONE) | `gamificationService.ts:150, 2058, 2161-2163, 2181` | Fáze 13: odstranit pole, NEBO doplnit milestone source do počtu |

Žádný nález nemění chování aplikace pro uživatele — jde výhradně o úklid
mrtvého/vestigiálního kódu a opravu chybného čísla/komentáře.

## Rozhodnutí Petra (2026-07-20, session #12 — doslovně)

> „N6.1 - smaž jak píšeš
> N6.2 - oprav tp
> N6.3 - tohle mi víc lajcky vysvětli jako pro koncového uživatele
> N6.4 - pokud to nic nepoužívá, tak to můžeš uklidit"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-6.1 | SMAZAT | Odstranit mrtvý `calculateAndUpdateStreakWithWarmUp` (1214-1319) — a při opravě ověřeno grepem, že do stejné mrtvé „Phase 1/2/3" scaffoldingu patří i `calculateAndUpdateStreakBasic` (1329-1404) a `canRecoverDebt` (1413-1420), oba také 0 callerů → smazány spolu |
| N-6.2 | OPRAVIT | `JOURNAL_MAX_DAILY` komentář + source-config komentáře na skutečných 315; opravit/označit nevynucené per-source dailyLimity |
| N-6.3 | OPRAVIT (po ověření) | Petr: „pokud je to opravdu zbytečné, tak to smaž, ale ještě to ověř a prověř, jestli tomu tak opravdu je" → ověřeno staticky i empiricky (viz níže), smazáno |
| N-6.4 | UKLIDIT | Odstranit vestigiální `journalEntryCount` (0 konzumentů) |

## PLAN-DISCREPANCY

- Plán 6.0 uvádí streakDebt „20 testů", reálně **23** (suite narostla; vše
  zelené).
- Plán 6.2 uvádí denní strop „415 XP" jako fakt; audit zjistil, že skutečné
  maximum je 315 a 415 je chybná aritmetika (viz N-6.2).

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 6 (6.0–6.5) | 6 (6.0–6.5) | ✓ |

## PROVEDENÍ OPRAV (2026-07-20, po rozhodnutích Petra)

Postup: jedna oprava → `tsc` (0) → testy.

1. **N-6.1 ✅ PROVEDENO** — smazána celá mrtvá „Phase 1/2/3" scaffolding
   z `SQLiteGratitudeStorage.ts`: `calculateAndUpdateStreakWithWarmUp`,
   `calculateAndUpdateStreakBasic` a orphan `canRecoverDebt` (grep-ověřeno
   0 callerů u všech tří) + odstraněn osiřelý import `calculateContinuingStreak`.
   Živá cesta beze změny (používá jen `calculateAndUpdateStreak`).
2. **N-6.2 ✅ PROVEDENO** — `constants/gamification.ts`: `JOURNAL_MAX_DAILY`
   415 → **315** (skutečné denní maximum) + oprava aritmetiky v komentáři;
   per-source `dailyLimit` u JOURNAL_ENTRY označen jako informational
   (vynucuje se `getSourceDailyLimit` → JOURNAL_MAX_DAILY). Bezpečné:
   strop je aplikován per-zdroj, největší reálný zdroj ≈199 → nikdy nezasáhne.
3. **N-6.4 ✅ PROVEDENO** — odstraněno vestigiální pole `journalEntryCount`
   ze `DailyXPData` (`gamificationService.ts:150`) + všech 5 míst zápisu
   (legacy inkrement/dekrement, SQLite fresh-count dotaz i přiřazení, empty
   init) + demo data (`marketingDemoDataService.ts`). Anti-spam „14+ = 0 XP"
   běží dál přes `getXPForJournalEntry(position)` ve storage.
4. **N-6.3 ✅ PROVEDENO (po důkladném ověření na Petrovu žádost)** — smazán
   redundantní inline decrement milestone counterů v `delete()`
   (`SQLiteGratitudeStorage.ts`), přepočet přes `calculateAndUpdateStreak`
   ponechán jako jediný zdroj pravdy.

   **Ověření, že je decrement OPRAVDU redundantní** (na výslovnou žádost Petra):
   - **Staticky**: `calculateAndUpdateStreak` má právě 2 návratové cesty
     (auto-reset větev + normální větev); OBĚ volají
     `calculateMilestoneCounters()` (SQL count dnů s ≥4/≥8/≥13 zápisy) a
     zapíšou star/flame/crown přes `updateStreak` PŘED returnem. Mezi
     vstupem metody a přepočtem není žádný early-return, který by přeskočil.
     `delete()` volá `calculateAndUpdateStreak` bezpodmínečně (mimo
     `if (isBonus)` blok), takže po smazání záznamu se countery vždy
     přepočítají z reálných dat (smazání proběhlo dřív, ř. 433). `updateStreak`
     je čisté SQL UPDATE — nevysílá žádný event, takže inline zápis nemohl nic
     notifikovat.
   - **Empiricky**: přidána nová regresní suite „Journal milestone counters
     ⭐🔥👑 (N-6.3)" (6 testů proti reálné in-memory SQLite) — create 4/8/13
     → star/flame/crown, delete 4. → star 0, delete 13. → crown 0, plná
     symetrie create↔delete. **PŘED** odstraněním: 29/29 zelených + log
     „⭐ Milestone lost: starCount--" potvrdil, že inline decrement reálně
     běžel. **PO** odstranění: **29/29 stále zelených**, log „Milestone lost"
     zmizel → countery zůstávají správné jen z přepočtu = důkaz redundance.

### Verifikace po VŠECH opravách (N-6.1/6.2/6.3/6.4)

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 451 passed, 451 total (30/30 suites)
```

Vývoj počtu testů: 445 → **451** (+6 nová suite „Journal milestone counters
⭐🔥👑 N-6.3"). Žádný test se neopíral o smazané symboly (grep ověřen).

### Cross-impact F2+F3

```
F2 (achievementy): 3 suites → Tests: 113 passed, 113 total
F3 (měsíční výzvy): 6 suites → Tests: 100 passed, 100 total
```

Vyhodnocení: všechny 4 opravy jsou mazání mrtvého/vestigiálního/redundantního
kódu + oprava chybného čísla nevynucené konstanty. Žádná ukládaná data ani
XP toky se nemění; N-6.2 mění jen hodnotu stropu, který nikdy nezasáhne;
N-6.3 nemění výsledné countery (dokázáno testy). **Závěry fází 1-5 nedotčeny,
suites zelené.**

## Stav: HOTOVO (2026-07-20) — audit 6/6 položek ✓, všechny 4 nálezy N-6.1–N-6.4 rozhodnuto a PROVEDENO (N-6.3 po statickém i empirickém ověření redundance), cross-impact F2+F3 ✓
