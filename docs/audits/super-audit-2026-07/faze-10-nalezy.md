# Fáze 10 — nálezy (super audit 2026-07): Startup Orchestrator + inicializace appky

Datum: 2026-07-20 | Commit: `37b8a3e` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 451/451 (30/30 suites)

Regresní suites fáze (10.0):
```
startupOrchestrator.test.ts → Tests: 10 passed, 10 total
database/__tests__/init.test.ts → Tests: 6 passed, 6 total
```

Scope: položky 10.0–10.5 (statická část; 10.6 = device, dělá Petr). Referenční
spec: sekce „Startup Orchestrator" v `projectplan.md` (3 kritická pravidla).
Guide `technical-guides:Startup-Orchestrator.md` v době auditu NEEXISTOVAL (plán
ho vedl na Úroveň 2) — PLAN-DISCREPANCY; **vyřešeno 2026-07-20: guide vytvořen**.

Soubory: `src/services/startup/{types,startupOrchestrator,index}.ts`,
`steps/{attStep,adConsentStep}.ts`, `appInitializationService.ts`,
`database/init.ts` (+ `migration/`), `app/_layout.tsx`,
`contexts/RootProvider.tsx`, `hooks/useFirebaseAnalytics.ts`.

**Celkové hodnocení: velmi kvalitní kód.** Jádro orchestratoru je čisté,
testovatelné a 3 kritická pravidla jsou dodržena. 2 reálné nálezy v DB
inicializaci (retry short-circuit + neidempotentní restore), 1 low-risk
poznámka + 1 PLAN-DISCREPANCY (chybějící guide).

## Položky

### 10.0 Baseline suites

- Verdikt: ✅ zelené — `startupOrchestrator.test.ts` 10/10,
  `init.test.ts` 6/6.

### 10.1 Tři kritická pravidla

- Kde: `startupOrchestrator.ts:126-166` (jádro), `types.ts:16-50` (kontrakt),
  `app/_layout.tsx:61-73` (wiring), `useFirebaseAnalytics.ts:41-58`
- Pravidlo: projectplan.md „KRITICKÁ PRAVIDLA" (ř. 248-251).
- Ověřeno jak: čtení jádra + kroků + wiringu + trasování pořadí.
- Verdikt: ✅ **všechna 3 pravidla dodržena, pravidlo 1 vynuceno strukturálně.**
- Důkaz:
  - **Pravidlo 1 (timeout NIKDY neobaluje interaktivní `present()`)**:
    `prepare()` je obalen `raceTimeout` (fail-open, `startupOrchestrator.ts:147`);
    `present()` je obalen `withSafety` (crash-only 5 min, NE pacing timeout,
    ř. 157 + konstanta `DEFAULT_PRESENT_SAFETY_MS = 5*60*1000` ř. 18). Split
    prepare/present je v `StartupStep` kontraktu (`types.ts:33-43`) → pravidlo
    je strukturální, ne disciplína. `withSafety` navíc korektně pohlcuje
    pozdní rejection (ř. 94-97) — žádný unhandled rejection. ✅
  - **Pravidlo 2 (reklamy + Crashlytics VŽDY)**: `_layout.tsx:64-68` — po
    `runStartupSequence()` běží `initAnalyticsAfterConsent()` +
    `finalizeAdsAndDiagnostics()` **bezpodmínečně** (mimo pipeline, negated
    přes shouldRun). `adConsentStep` (ř. 13-16 komentář) explicitně říká, že
    init SDK + Crashlytics NEjsou v kroku. ✅
  - **Pravidlo 3 (ATT → analytics → app_open)**: pipeline `[attStep,
    adConsentStep]` (`index.ts:14`) → ATT první; `initAnalyticsAfterConsent`
    (`useFirebaseAnalytics.ts:47-52`) volá `setAnalyticsCollectionEnabled(true)`
    PAK `logEvent('app_open')`, a to až po celé sekvenci (`_layout.tsx:67`)
    → pořadí ATT → enable → app_open zaručeno pozicí v `_layout`. ✅
  - **Poznámka N-10.3 (LOW/INFO)**: `_layout.tsx:62-72` guarduje finalize přes
    `cancelled`. Při běžném produkčním single-mountu i ve StrictMode (druhý
    mount doběhne) finalize proběhne. Teoretická hrana: unmount PŘESNĚ mezi
    doběhnutím sekvence a finalize v produkci (bez remountu) by reklamy +
    Crashlytics přeskočil. Extrémně nepravděpodobné (startup se neunmountuje),
    ale technicky je to jediné místo, kde „VŽDY" z pravidla 2 má podmínku.

### 10.2 Konzumenti `awaitStartupComplete()`

- Kde: grep přes `src/` + `app/`
- Pravidlo: 10.2 — kdo čeká na konec pipeline; UI startující bez čekání = nález.
- Ověřeno jak: grep `awaitStartupComplete|runStartupSequence|waitForStartupModals`.
- Verdikt: ✅ **jediný konzument je TutorialContext; brána i tutoriál jsou
  správně za bariérou.**
- Důkaz:
  - `TutorialContext.tsx:1652` — `await awaitStartupComplete()` před
    `autoStartTutorial()` (ř. 1654). Uvnitř `autoStartTutorial` je jak
    uvítací brána `setShowOnboardingPrefs(true)` (ř. 1629), tak start
    tutoriálu — obojí až po bariéře ✅.
  - `runStartupSequence` volá jen `_layout.tsx:64` (spouštěč). Žádné jiné
    startup UI nečeká-bez-bariéry: ModalQueue modaly (achievement/level-up/
    celebration) jsou event-driven (XP/akce uživatele), ne startup-time →
    nevznikají během startovního okna. Starý `waitForStartupModals` /
    `startupGate` už neexistuje (grep 0). ✅

### 10.3 Guard dvojího spuštění + app-ready gate

- Kde: `startupOrchestrator.ts:108, 126-129` (guard), `:37-59, 132`
  (app-ready gate)
- Pravidlo: 10.3 — guard proti dvojímu běhu (StrictMode/re-mount) + app-ready
  gate (fonty, DB, AppState active, po prvním snímku).
- Ověřeno jak: čtení jádra + wiringu.
- Verdikt: ✅ **oboje korektní.**
- Důkaz:
  - Double-run guard: `started` flag (ř. 108) — první volající běží sekvenci,
    ostatní dostanou `awaitStartupComplete()` (ř. 128). StrictMode dvojitý
    mount → druhé `runStartupSequence` jen čeká. ✅ Navíc `_layout` spouští
    až po `dbInitialized` (`_layout.tsx:217`) a fontech.
  - App-ready gate: `defaultWaitForAppReady` (ř. 37-59) čeká na
    `AppState==='active'` + `requestAnimationFrame` (první snímek) — přesně
    dle nebezpečné zóny „ATT musí běžet při active + po prvním snímku". Fonty
    + DB řeší `_layout` (render null dokud `!loaded || !dbInitialized`). ✅

### 10.4 Database init + migrace

- Kde: `database/init.ts:13-40` (init), `:57-755` (createTables + migrace/
  restore), retry `app/_layout.tsx:179-215`
- Pravidlo: 10.4 — retry (N3 fix), idempotence migrací, force-quit uprostřed
  migrace; per-migrace re-runnable nebo transakční.
- Ověřeno jak: čtení init + všech inline migrací + restore bloků + retry smyčky.
- Verdikt: ⚠️ **retry i restore mají reálný defekt** (2 nálezy); zbytek
  idempotentní.
- Důkaz:
  - **Idempotence běžných kroků ✅**: `createTables` používá `CREATE TABLE
    IF NOT EXISTS` + guardované `ALTER` (kontrola `PRAGMA table_info` před
    změnou, ř. 63-123, 461-508). Re-run bezpečný.
  - **challenge_lifecycle restore ✅**: `INSERT OR REPLACE` (ř. 743) +
    common-columns guard (ř. 735-738) — idempotentní, force-quit mezi INSERT
    a DROP → re-run přepíše, ne duplikát.
  - **N-10.1 [STŘEDNÍ] — retry short-circuit přes `db` singleton**:
    `initializeDatabase` (`init.ts:14`) má `if (db) return db;`, ale `db` se
    přiřadí (ř. 22) PŘED `createTables` (ř. 31), a catch (ř. 36-39)
    **nenuluje `db`**. Když `createTables` selže: `db` zůstane ne-null →
    retry smyčka v `_layout` (ř. 181-201) při dalším pokusu dostane přes
    `if (db) return db` **polovičně zmigrovanou DB bez re-runu createTables**
    → `setDbInitialized(true)` → appka běží s NEúplným schématem → kaskáda
    chyb ve všech storage voláních (přesně to, čemu má `DatabaseErrorScreen`
    zabránit). Retry funguje jen pro selhání `openDatabaseAsync` (tam `db`
    zůstane null). Návrh: v catch nastavit `db = null` (nebo přiřadit do
    lokální a modulový `db` až po úspěšném createTables).
  - **N-10.2 [NÍZKÁ] — goal_progress restore není idempotentní**: restore
    (ř. 703-715) je prostý `INSERT INTO goal_progress ... SELECT FROM
    goal_progress_backup` (NE `OR REPLACE/IGNORE`), a cyklus backup→drop není
    transakční. Force-quit mezi INSERT (ř. 715) a `DROP goal_progress_backup`
    (ř. 721) → další start: backup pořád existuje → restore INSERT **znovu**
    → kolize PRIMARY KEY `id` → `createTables` hodí výjimku → DB init selže
    všechny 3 pokusy → uživatel natrvalo na `DatabaseErrorScreen`. Dopad jen
    pro upgrade z VELMI starého schématu (`goal_progress` se sloupcem
    `timestamp` bez `date`); čistá instalace (device scénář) tuto větev nikdy
    nespustí. Návrh: `INSERT OR IGNORE` + ideálně backup→restore→drop v jedné
    transakci.
  - Retry N3 fix ✅ existuje (`_layout.tsx:181-201`, 3 pokusy, backoff
    `300*attempt` ms, po vyčerpání `CrashReportingService.recordError` +
    `DatabaseErrorScreen`) — jen ho podkopává N-10.1.
  - Pozn.: legacy `StorageService.initialize()` + `dataMigration` (verzovaná
    AsyncStorage migrace, `storage/migration.ts`, `storage/index.ts:35`) NEMÁ
    v živém startu volajícího (grep 0) — mrtvá cesta, souvisí s BLOCKER debt
    `backup.ts` ze sekce 0 plánu. Neřeší se tady (Fáze 13).

### 10.5 RootProvider — pořadí providerů + N30

- Kde: `contexts/RootProvider.tsx:18-42`, `app/_layout.tsx:18`
- Pravidlo: 10.5 — provider čtoucí context provideru POD sebou = nález; N30
  jen potvrdit.
- Ověřeno jak: grep spotřeby hooků (`useModalQueue`/`useXpAnimation`/…) v
  každém provideru vs. pozice ve stromu.
- Verdikt: ✅ **pořadí korektní, žádný provider nečte context pod sebou.**
- Důkaz:
  - Strom (vnější→vnitřní): Theme → App → ModalQueue → XpAnimation → Habits →
    Gratitude → Goals → Achievement → HomeCustomization → XpAnimationContainer.
  - Křížové závislosti: `XpAnimationContext` čte `useModalQueue`
    (ModalQueue je NAD ním ✅); `AchievementContext` čte `useModalQueue`
    (NAD ✅). Ostatní providery čtou jen vlastní context. Žádné čtení
    směrem dolů. ✅
  - **N30 (potvrzeno, → Fáze 13)**: side-effect barrel import
    `import '../src/services';` (`_layout.tsx:18`) trvá. Jen evidence.

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-10.1 | ⚠️ **STŘEDNÍ** | `db` singleton se nenuluje při selhání `createTables` → retry vrátí polovičně zmigrovanou DB a označí ji za „ready" (appka běží s neúplným schématem místo DatabaseErrorScreen) | `database/init.ts:14, 22, 31, 36-39` | V catch `db = null` před rethrow; nebo migrovat do lokální proměnné a modulový `db` nastavit až po úspěšném `createTables` |
| N-10.2 | 🧹 nízká | goal_progress restore je prostý `INSERT` (ne `OR IGNORE`) + backup→drop netransakční → force-quit mezi INSERT a DROP → PK kolize při dalším startu → DB init natrvalo selže (jen upgrade z prastarého schématu) | `database/init.ts:703-721` | `INSERT OR IGNORE` + backup→restore→drop v jedné transakci |
| N-10.3 | 🧹 INFO | `finalize` (reklamy+Crashlytics) je guardován `cancelled` → teoretický unmount mezi sekvencí a finalize v produkci by ho přeskočil (StrictMode-safe, extrémně nepravděpodobné) | `app/_layout.tsx:62-72` | Zvážit finalize mimo `cancelled` guard (nebo ponechat — riziko zanedbatelné) |
| N30 | (evidence) | side-effect barrel import | `app/_layout.tsx:18` | Fáze 13 (dle plánu) |

Žádný nález nezpůsobuje user-facing regresi na čisté instalaci (device
scénář 10.6). N-10.1 je robustnost retry, N-10.2 extrémně úzká upgrade hrana.

## Rozhodnutí Petra (2026-07-20, session #13 — doslovně)

> „N10.1 - souhlasím
> N10.2 - tohle je tvoje parketa, hlavně ať to funguje a je to bezpečné
> N10.3 - Má to cenu nějak opravovat?"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-10.1 | OPRAVIT | Modulový `db` publikovat až PO úspěšném `createTables` (lokální proměnná); při selhání handle best-effort zavřít, aby retry otevřel čistý |
| N-10.2 | OPRAVIT (bezpečně) | goal_progress restore: `INSERT OR IGNORE` + restore→drop zálohy v jedné `withTransactionAsync` (atomické, re-runnable) |
| N-10.3 | NEOPRAVOVAT (doporučení Fable, Petr souhlasil implicitně otázkou) | Ponechat — „oprava" by vyžadovala idempotentní latch na finalize (jinak dvojitá inicializace reklam/analytics ve StrictModu); riziko původní hrany zanedbatelné (startup se v produkci neunmountuje). Jen audit-zápis. |

## PLAN-DISCREPANCY

- **Guide `technical-guides:Startup-Orchestrator.md` NEEXISTOVAL** — plán ho
  v hlavičce Fáze 10 uváděl jako referenci „až v Úrovni 2 (bod 2.8)".
  Audit proto proveden proti sekci „Startup Orchestrator" v `projectplan.md`.
  ✅ **VYŘEŠENO 2026-07-20 (rozhodnutí Petra)**: guide vytvořen — konsoliduje
  3 kritická pravidla (i s odůvodněním „proč"), kontrakt `StartupStep`
  (prepare/present), postup přidání nového kroku, bariéru `awaitStartupComplete`,
  app-ready gate, pravidla DB initu (publish-after-success, re-runnable/transakční
  migrace vč. oprav N-10.1/N-10.2), nebezpečné zóny, testovací limity a device
  scénáře. Do `projectplan.md` vložen odkaz dle pravidla #15; tamní sekce je tím
  degradována na historický kontext a smí se archivovat, aniž se pravidla ztratí.
- Plán 10.4 cituje „retry (N3 fix z 6/13)" — retry existuje, ale v
  `app/_layout.tsx` (ne v init.ts) a je podkopán N-10.1.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 6 (10.0–10.5; 10.6 device = Petr) | 6 (10.0–10.5) | ✓ |

## PROVEDENÍ OPRAV (2026-07-20, po rozhodnutích Petra)

1. **N-10.1 ✅ PROVEDENO** — `database/init.ts:13-49`: `initializeDatabase`
   staví na LOKÁLNÍ proměnné `database` a modulový singleton `db` publikuje
   až PO úspěšném `createTables`. Při selhání `db` zůstane null (retry
   v `_layout` skutečně re-runne, ne short-circuit) + handle se best-effort
   zavře (`database?.closeAsync()`), aby retry otevřel čistý.
2. **N-10.2 ✅ PROVEDENO** — `database/init.ts:699-723`: goal_progress restore
   je nově `INSERT OR IGNORE` (idempotentní vůči PK kolizi) a restore+drop
   zálohy běží v jedné `withTransactionAsync` (atomické — force-quit uprostřed
   → rollback, záloha přežije, re-run čistý). challenge_lifecycle restore byl
   už bezpečný (`INSERT OR REPLACE`) — beze změny (chirurgický princip).
3. **N-10.3 ✅ PONECHÁNO dle doporučení** — bez zásahu (viz rozhodnutí výše).

### Verifikace po opravách

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 451 passed, 451 total (30/30 suites)
init.test.ts     → 6/6 ✓   startupOrchestrator.test.ts → 10/10 ✓
```

Úroveň ověření: **happy-path plně krytý** existujícími testy (16), bez
regrese. Selhání-/force-quit-větve N-10.1/N-10.2 se nedají v testech vyvolat
(mock `expo-sqlite` otevírá pokaždé novou `:memory:` DB → zálohu nelze
propašovat přes restart) — správnost stojí na strukturální jasnosti oprav
(publish-after-success; transakční atomicita + `OR IGNORE` idempotence =
SQLite garance) + potvrzení z reálného provozu (orchestrator L1 běží testerům
od 14.7., viz projectplan.md — de facto pokrytí device scénáře 10.6).

Cross-impact F2+F3: **není potřeba** — Fáze 10 není výrobce dat pro fáze 2-3
(žádná ukládaná gamifikační data ani XP toky se nemění).

## Stav: HOTOVO (2026-07-20) — audit 6/6 položek ✓, N-10.1 + N-10.2 opraveny, N-10.3 ponecháno (doporučení), 451/451, tsc 0. 10.6 device = de facto ověřeno testery (projectplan).
