# Fáze 13 — nálezy (super audit 2026-07)

Datum: 2026-07-22 | Commit: `687d50a` | Node: v24.18.0
Baseline: `npx tsc --noEmit` → 0 chyb; `npm test` →

```
Test Suites: 32 passed, 32 total
Tests:       476 passed, 476 total
Snapshots:   0 total
Time:        16.307 s
Ran all test suites.
```

**Zdroj kontextu**: `production-audit-2026-06-10.md` (obnoven přes
`git show 1e56d63:production-audit-2026-06-10.md`), sekce 3.6 — nálezy N27–N32.

**Metodika sweepu**: skript prošel 217 souborů v `src/services`, `src/components`,
`src/utils`, `src/hooks`, `src/contexts` (bez testů) a pro každý hledal jakoukoliv
`import` / `require` / `import()` referenci v celém korpusu `src/` + `app/` + `__tests__/`.
Nálezy pak ověřeny druhým průchodem **na úrovni exportovaných symbolů**, protože
soubor může být importovaný jen přes barrel. Skript žije ve scratchpadu session.

**Během auditní části nebyl změněn žádný soubor mimo tuto zprávu (E1).**

---

## Položky

### 13.1 — N27: legacy storage duplikace (3375 řádků)

- Kde: `src/services/storage/gratitudeStorage.ts` (1752 ř.),
  `habitStorage.ts` (761 ř.), `goalStorage.ts` (862 ř.).
  Přepínač: `src/config/featureFlags.ts:16,25,34` — všechny tři flagy natvrdo `true`.
- Pravidlo: plán 13.1 — ověř telemetrii `sqlite_migration_state`, a POKUD migrace
  doběhla u všech uživatelů, **navrhni** (nedělej) plán mazání.
- Ověřeno jak: grep na importy legacy singletonů napříč `src/` + `app/` + `__tests__/`;
  kontrola existence a obsahu telemetrie; kontrola, kdo migraci spouští.
- Verdikt: ⚠️ — telemetrie **existuje**, ale **nikdo ji zatím nemůže vyhodnotit**,
  a hlavně: sweep odhalil dvě věci, které plán nepředpokládal (viz N-13.1 a N-13.2).

**Telemetrie** (`src/services/appInitializationService.ts:164-194`) je na místě a měří
správné věci:

```
await FirebaseAnalytics.logEvent('sqlite_migration_state', {
  sqlite_flags_enabled: sqliteFlagsEnabled, // expect 5
  sqlite_xp_transactions: Number(txCount?.count ?? 0),
  legacy_xp_store_present: allKeys.includes('gamification_xp_transactions') ? 1 : 0,
  async_storage_key_count: allKeys.length,
});
```

**Kdo ještě sahá na legacy singletony** (mimo `featureFlags.ts`):

| Místo | Kontext | Verdikt |
|---|---|---|
| `src/services/xpMultiplierService.ts:377` | uvnitř `else` větve kontroly flagu | ✅ v pořádku — je to záměrná fallback větev |
| `src/services/achievementService.ts:1663` | **bez jakékoliv kontroly flagu, netypovaný `require`** | ❌ **N-13.1, VYSOKÁ** |
| `src/services/__tests__/userActivityTracker*.test.ts`, `monthlyProgressTracker.trackingKeys.test.ts` | testy mockují legacy třídy | ⚠️ blokuje mazání — viz plán níže |

**Návrh plánu mazání** (k provedení AŽ po rozhodnutí N-13.4 níže, ne teď):

1. Opravit `achievementService.ts:1663` (N-13.1) — jinak by se mazáním rozbila appka.
2. Přepsat 3 testovací soubory tak, aby mockovaly SQLite implementace
   (dnes `require('../storage/habitStorage')` atd.) — jinak spadne 32 suites.
3. Odstranit `else` větve v `featureFlags.ts:88-92, 103-107, 118-122` a s nimi
   i samotné flagy (jsou to konstanty, runtime-přepínatelné nikdy nebyly).
4. Teprve pak smazat 3 legacy soubory — **po jednom**, každý s vlastním
   `grep -rn` ověřením a plným test runem mezi kroky.
5. Souběžně vyřešit `storage/index.ts` (viz 13.2) — barrel je re-exportuje,
   takže dokud existuje `export { habitStorage } from './habitStorage'`,
   sweep je vidí jako „používané".

---

### 13.2 — N30: side-effect barrel import

- Kde: `app/_layout.tsx:18` → `import '../src/services';`
  Barrel: `src/services/index.ts` (16 řádků, 15× `export *`).
- Pravidlo: plán 13.2 — zdokumentuj, co side-effect spouští, a navrhni explicitní inicializaci.
- Ověřeno jak: čtení barrelu a všech jeho cílů; grep na modulové side-effecty
  (instanciace, `setInterval`, registrace listenerů na úrovni modulu).
- Verdikt: ⚠️ — funguje, ale drží při životě víc, než tuší.

**Co ten import doopravdy dělá**: v žádném z 15 cílů barrelu není modulová
inicializace (služby jsou statické třídy) — **jediný skutečný side-effect je
`src/services/storage/index.ts:185`**:

```
export const storageService = StorageService.getInstance();
```

a ten symbol **nikdo nepoužívá** (grep přes `src/` + `app/` mimo definiční soubor: 0 výskytů).

**Skutečný dopad barrelu není inicializace, ale dosah**: `src/services/index.ts:16`
re-exportuje `./storage`, a `src/services/storage/index.ts:5-10` re-exportuje
**legacy AsyncStorage vrstvu i dormantní backup**:

```
export { HabitStorage, habitStorage } from './habitStorage';       // 761 ř.
export { GratitudeStorage, gratitudeStorage } from './gratitudeStorage'; // 1752 ř.
export { GoalStorage, goalStorage } from './goalStorage';          // 862 ř.
export { UserStorage, userStorage } from './userStorage';          // 329 ř.
export { DataMigration, dataMigration } from './migration';        // 405 ř.
export { DataBackup, dataBackup } from './backup';                 // 574 ř. (BLOCKER)
```

Tedy: jeden `import '../src/services'` v `_layout.tsx` natáhne do startu appky
**celou mrtvou storage vrstvu včetně modulu, který má v hlavičce BLOCKER varování**.
Zároveň to je důvod, proč sweep tři z těch souborů nevidí jako osiřelé — viz N-13.3.

**Návrh**: barrel `src/services/index.ts` i side-effect import v `_layout.tsx`
zrušit úplně (nemají co inicializovat), případně nahradit explicitním importem
tam, kde se `storageService` skutečně použije — dnes nikde.
Riziko: nízké, ale dotýká se startu appky → **až po device testu**, ne naslepo.

---

### 13.3 — N31: obrácená závislost storage → gamification

- Kde: souhrn napříč fázemi.
- Pravidlo: plán 13.3 — souhrn ze všech fází (4.6 Habits + případné další).
- Ověřeno jak: grep `GamificationService` ve všech souborech `src/services/storage/`.
- Verdikt: ⚠️ — stav se od 6/10 auditu **zhoršil**, ne zlepšil. Původní nález mluvil
  o 2 místech (`SQLiteHabitStorage.ts:333`, `habitStorage.ts:274`); dnes jich je 19
  ve 4 souborech.

| Soubor | Import | Volání `addXP` / `subtractXP` |
|---|---|---|
| `SQLiteGoalStorage.ts` | `:11` | `:474, 481, 515, 541, 548, 653, 660, 752, 759` (9×) |
| `SQLiteGratitudeStorage.ts` | `:21` | `:311, 439` (2×) |
| `SQLiteHabitStorage.ts` | `:10` | `:389, 503` (2×) |
| `habitStorage.ts` (legacy) | `:5` | `:285, 363` (2×) |

Nárůst není regrese v chování — je to důsledek oprav z Fází 4 a 5 (N-4.x, N-5.1,
N-5.2), které XP logiku doplnily tam, kde chyběla, a šly cestou nejmenšího zásahu
podle stávajícího vzoru. **Tehdy to bylo správné rozhodnutí** (chirurgická oprava
funkční věci), ale dluh tím narostl.

**Návrh**: NEDĚLAT v tomhle auditu. Rozmotání znamená přesunout XP z úložiště do
doménové operace (`completeHabit()`, `addGoalProgress()`…) — to je refaktoring
funkčního a otestovaného kódu, tedy přesně to, co CLAUDE.md pravidlo #16 zakazuje
dělat mimochodem. Zapsáno jako dluh; smysl dává až jako samostatný úkol s vlastní
testovou sítí.

---

### 13.4 — Fresh sweep: exportované symboly bez importu

- Kde: `src/services/`, `src/components/`, `src/utils/`, `src/hooks/`, `src/contexts/`.
- Pravidlo: plán 13.4 — soubory bez importu jinde, pozor na dynamické `require()`.
- Ověřeno jak: dvoufázově — (1) referenční sweep 217 souborů, (2) pro každý kandidát
  ještě grep na jeho **exportované symboly** napříč `src/` + `app/` + `__tests__/`.
- Verdikt: ❌ — **24 souborů, 7289 řádků, nula referencí**.

Doslovný výstup sweepu:

```
scanned files: 217
files with ZERO import references (24):
    818  src/services/database/migration/gamificationMigration.ts
    560  src/utils/concurrencySafeguards.ts
    516  src/services/socialSharingService.ts
    471  src/components/home/MonthlyHabitOverview.tsx
    443  src/services/database/migration/lifecycleHistoryMigration.ts
    416  src/utils/userStatsCollector.ts
    365  src/utils/performanceProfiler.ts
    354  src/services/database/migration/journalMigration.ts
    325  src/services/database/migration/challengesVerification.ts
    310  src/services/database/migration/goalsMigration.ts
    275  src/components/home/StreakVisualization.tsx
    256  src/utils/consoleSuppression.ts
    255  src/services/database/migration/gamificationBackup.ts
    254  src/services/database/migration/challengesBackup.ts
    244  src/services/database/migration/progressTrackingMigration.ts
    240  src/services/database/migration/challengesMigration.ts
    221  src/components/animations/AnimatedStreakNumber.tsx
    217  src/services/database/migration/habitsMigration.ts
    163  src/services/database/migration/goalsBackup.ts
    155  src/services/database/migration/habitsBackup.ts
    151  src/services/database/migration/diagnoseBackup.ts
     98  src/utils/xpCounterOptimizationSummary.ts
     97  src/services/database/migration/runBackupTest.ts
     85  src/components/animations/StreakTransition.tsx
  total lines: 7289
```

**Ověření na úrovni symbolů** (druhý průchod — soubor mohl být tažený přes barrel):

```
AchievementUnlockManager           -> (nikde)
AtomicStorageOperations            -> (nikde)
ConcurrencySafeGamificationService -> (nikde)
XPOperationQueue                   -> (nikde)
SocialSharingService               -> (nikde)
PerformanceProfiler                -> (nikde)
consoleSuppression                 -> (nikde)
XP_COUNTER_OPTIMIZATION_SUMMARY    -> (nikde)
UserStatsCollector                 -> src/services/achievementService.ts
```

Jediný „zásah" u `UserStatsCollector` je falešný — jde o **komentáře**, které říkají,
že ho něco nahradilo: `achievementService.ts:1457` („This replaces the cached
UserStatsCollector for immediate accuracy") a `:1528` („Replaces UserStatsCollector
with real-time data collection"). Kód ho nevolá.

**Čtyři podezřelé drobnosti z plánu** — výsledek:

| Soubor | Řádků | Verdikt |
|---|---|---|
| `src/utils/xpCounterOptimizationSummary.ts` | 98 | ❌ mrtvý — 0 referencí |
| `src/utils/fixBeginnerTargetText.ts` | 93 | ✅ **žije** — `MonthlyChallengeDetailModal.tsx:15,49` |
| `src/services/socialSharingService.ts` | 516 | ❌ mrtvý — 0 referencí |
| `src/services/hapticsService.ts` | 59 | ✅ **žije** — 5+ komponent (XpAnimationContext, 3 modaly výzev, HabitCompletionButton) |

**Zvlášť: celý adresář `src/services/database/migration/`** — 16 souborů, **4663 řádků**,
a nikdo mimo něj se ho nedotkne. Ověřeno dvakrát:

```
=== any reference to 'migration/' (mimo samotný adresář) ===
(nic)
=== external refs to any migration basename ===
(done)   ← žádný ze 16 souborů nemá externí referenci
```

Navíc **neexistuje žádný spouštěč migrace**: grep na
`runMigration|migrateAll|MigrationService|performMigration` mimo ten adresář vrací
jediný zásah, a to nesouvisející `achievementStorage.ts:779 performMigrationIfNeeded()`
(migrace formátu achievementů uvnitř SQLite, ne AsyncStorage→SQLite).
`src/services/database/init.ts` migraci z AsyncStorage nevolá vůbec — řeší jen
schéma SQLite tabulek.

**Zbylých 10 osiřelých souborů mimo migrační adresář = 3263 řádků**
(oprava vlastní chyby: v první verzi této zprávy stálo „8 souborů = 2626 řádků" —
to vzniklo odečtením 4663 od 7289, jenže to jsou dva různé rozsahy. Sweep viděl
z migračního adresáře jen 14 souborů = 4026 ř.; celý adresář má 16 souborů = 4663 ř.,
protože `journalBackup.ts` a `testJournalBackup.ts` drží při životě jejich sourozenci.
Správně: 7289 − 4026 = **3263**):
`concurrencySafeguards.ts` (560), `socialSharingService.ts` (516),
`MonthlyHabitOverview.tsx` (471), `userStatsCollector.ts` (416),
`performanceProfiler.ts` (365), `StreakVisualization.tsx` (275),
`consoleSuppression.ts` (256), `AnimatedStreakNumber.tsx` (221),
`xpCounterOptimizationSummary.ts` (98), `StreakTransition.tsx` (85).

**Navíc — mrtvé kusy maskované barrelem** (sweep je nevidí, protože je re-exportuje
`storage/index.ts`, viz 13.2). Grep na jejich symboly mimo definiční soubory: 0 zásahů.

| Soubor | Řádků | Exportováno z barrelu jako |
|---|---|---|
| `src/services/storage/backup.ts` | 574 | `DataBackup`, `dataBackup` |
| `src/services/storage/migration.ts` | 405 | `DataMigration`, `dataMigration` |
| `src/services/storage/userStorage.ts` | 329 | `UserStorage`, `userStorage` |
| `storageService` singleton | 1 | `storage/index.ts:185` |

---

### 13.5 — `backup.ts` BLOCKER komentář

- Kde: `src/services/storage/backup.ts:9-22`.
- Pravidlo: plán 13.5 — ověř, že BLOCKER komentář je pořád na místě.
- Ověřeno jak: přečtení hlavičky souboru.
- Verdikt: ✅ — komentář je na místě, kompletní a pořád platný.

```
// ⚠️ BLOCKER — DO NOT WIRE THIS TO ANY UI BEFORE MIGRATING IT.
//
// Habits, journal and goals all live in SQLite now (FEATURE_FLAGS.USE_SQLITE_*),
// but every import above is the LEGACY AsyncStorage singleton. This module would
// therefore back up an EMPTY dataset and restore into a store nothing reads —
// silently, with a success message. It is harmless only because it is currently
// dormant (Data Export & Backup is parked in @projectplan-future-updates.md and
// has no call site outside `storage/index.ts` re-exports).
```

Ověřeno i tvrzení z komentáře („no call site outside `storage/index.ts` re-exports"):
grep na `DataBackup`/`dataBackup` mimo definiční soubor a barrel → 0 zásahů. **Sedí.**

---

### 13.6 — Root-level `.md` soubory (N32)

- Kde: kořen repa.
- Pravidlo: plán 13.6 — jen SEZNAM s návrhem přesunu, **žádné hromadné přesuny**,
  rozhoduje Petr.
- Ověřeno jak: `ls -la *.md`.
- Verdikt: ⚠️ — 33 souborů, 1,17 MB. Rozpad podle role:

**A. Aktivní pracovní dokumenty — ZŮSTAT v rootu** (7):
`CLAUDE.md`, `AGENTS.md`, `README.md`, `projectplan.md` (60 kB),
`projectplan-future-updates.md` (29 kB), `super-audit-plan-2026-07-16.md` (67 kB),
`technical-guides.md` (60 kB).

**B. Techničtí průvodci — ZŮSTAT** (13, celkem 356 kB): `technical-guides:*.md`.
CLAUDE.md pravidlo #15 předepisuje přesně tenhle název a umístění.

**C. Archivy — kandidáti na `docs/archive/`** (4, celkem 331 kB):
`implementation-history.md` (204 kB), `projectplan-archive.md` (79 kB),
`audit-fix-plan.md` (79 kB — hotový plán z června), `handoff-blueprints.md` (12 kB).
⚠️ Pozor: `implementation-history.md` a `projectplan-archive.md` jsou v CLAUDE.md
pravidle #3 uvedené jako cílová místa pro archivaci → **přesun by znamenal
aktualizovat i CLAUDE.md**.

**D. Doběhlé jednorázové reporty — kandidáti na `docs/archive/`** (9, celkem 419 kB):
`ACHIEVEMENT_I18N_TRACKING.md` (48 kB), `i18n-migration-tracker.md` (77 kB),
`I18N_FINAL_AUDIT_REPORT.md`, `i18n-comprehensive-audit-findings.md`,
`MONTHLY_CHALLENGES_ARCHITECTURE.md`, `NOTIFICATION_REBUILD_GUIDE.md`,
`monthly-challenge-fix-plan.md`, `future-skills-roadmap.md`.
Tři i18n soubory jsou po Fázi 12 definitivně historické — plán je sám označuje
jako „jen historický kontext".

**Nic jsem nepřesouval** (plán to výslovně zakazuje). Rozhodnutí je na Petrovi.

---

### 13.7 — `RECOMMENDATION_FOLLOW` XP: smazat mrtvou infrastrukturu

- Pravidlo: plán 13.7 — schváleno Petrem 2026-07-21 (Fáze 11).
- Verdikt a provedení: viz sekce „Provedené opravy".

---

### 13.8 — Mrtvé i18n klíče

- Pravidlo: plán 13.8 — schváleno Petrem 2026-07-22 (Fáze 12).
- Verdikt a provedení: viz sekce „Provedené opravy".

---

## Nálezy k opravě (číslované, s prioritou)

### N-13.1 — 🔴 VYSOKÁ: achievementService čte streak z mrtvého AsyncStorage

**Kde**: `src/services/achievementService.ts:1662-1665`

```ts
private static async getGratitudeStreakInfo(): Promise<any> {
  const { gratitudeStorage } = require('./storage/gratitudeStorage');
  return await gratitudeStorage.getStreak();
}
```

Žádná kontrola `FEATURE_FLAGS.USE_SQLITE_JOURNAL`, žádné `as typeof import(...)`
(porušuje pravidlo z hlavičky `featureFlags.ts:70-80` — netypovaný `require` byl
přesně to, co drželo goals split-brain neviditelný měsíce).

**Datový tok**: `getGratitudeStreakInfo()` → `getRealTimeUserStats()` (`:1579`)
→ `app/achievements.tsx:148` → `setBatchUserStats(...)` → náhledy a progress hinty
na obrazovce Trofeje. Konkrétně z toho volání pochází `currentJournalStreak`,
`starCount`, `flameCount`, `crownCount` (`achievementService.ts:1598-1604`)
a `hasTripleCrown: userStats.crownCount >= 3` (`achievements.tsx:186`).

**Důsledek**: zápisy deníku jdou do SQLite (`USE_SQLITE_JOURNAL: true`), ale tohle
čte AsyncStorage, kde nic není. `gratitudeStorage.getStreak()` na prázdném úložišti
vrací default (`gratitudeStorage.ts:434-454`): `currentStreak: 0`, `starCount: 0`,
`flameCount: 0`, `crownCount: 0`. **Na obrazovce Trofeje se tedy u ⭐🔥👑 trofejí
a u journal streaku trvale ukazuje nulový pokrok**, bez ohledu na realitu.

**Proč to Fáze 2 nechytila**: odemykání trofejí jde jinou cestou
(`calculateAllProgressRealTime()` + evaluátory), a ta je v pořádku — 89 testů
`achievementEvaluation.test.ts` prochází. Rozbité je **zobrazení** pokroku, ne
vyhodnocení. Proto je to nález Fáze 13, ne Fáze 2.

**Návrh opravy**: jednořádková — použít helper místo legacy singletonu:

```ts
const { getGratitudeStorageImpl } = require('../config/featureFlags') as typeof import('../config/featureFlags');
return await getGratitudeStorageImpl().getStreak();
```

`SQLiteGratitudeStorage.getStreak()` existuje se stejnou signaturou
(`SQLiteGratitudeStorage.ts:174`), takže jde o čistou záměnu zdroje dat.

### N-13.2 — 🟠 STŘEDNÍ / K ROZHODNUTÍ: migrace AsyncStorage → SQLite se nikdy nespouští

**Kde**: `src/services/database/migration/` — 16 souborů, 4663 řádků.

**Zjištění**: adresář nemá **jedinou** externí referenci a v celé codebase
neexistuje nic, co by migraci volalo. `src/services/database/init.ts` řeší jen
vytvoření a úpravu SQLite schématu, ne přenos dat z AsyncStorage.

**Co to znamená**: kdyby dnes existoval uživatel s daty v AsyncStorage a nainstaloval
si aktuální verzi, appka by mu naběhla **prázdná** — flagy míří na SQLite, migrace
se nespustí. Buď (a) takový uživatel neexistuje, protože appka s AsyncStorage nikdy
nešla ven, nebo (b) je to tichá ztráta dat.

**Tohle nemůžu rozhodnout ze zdrojáku — potřebuju odpověď od Petra (E5):**
**Byla appka někdy vydaná uživatelům ve verzi, která ukládala do AsyncStorage?**

- **Pokud NE** (appka je pořád před vydáním / testeři instalují vždy načisto):
  4663 řádků migrace je čistě mrtvý kód → smazat, a padá i hlavní důvod
  pro opatrnost u 13.1 (legacy vrstva nemá koho chránit).
- **Pokud ANO**: je to **kritický nález** — migrace se musí zapojit do startu
  dřív, než se cokoliv maže, a to je samostatný úkol s vlastním device testem.

### N-13.3 — 🟡 NÍZKÁ: 2626 řádků osiřelých souborů mimo migrační adresář

Seznam a řádky viz 13.4. Všechny ověřené dvakrát (soubor + exportované symboly).
Pozor na `MonthlyHabitOverview.tsx` (471 ř.) a `StreakVisualization.tsx` (275 ř.) —
jsou to Home komponenty, které Fáze 11 auditovala jako součást obrazovky; sweep
teď ukazuje, že na Home vůbec nejsou zapojené.

**Návrh**: smazat, ale **po jednom** a s test runem mezi kroky (metodologie sekce 1).
Nejde o urgentní opravu — mrtvý kód nikoho nepálí, jen ho musíš udržovat.

### N-13.4 — 🟡 NÍZKÁ: 1309 řádků mrtvého kódu maskovaného storage barrelem

`backup.ts` (574), `migration.ts` (405), `userStorage.ts` (329) + nepoužívaný
`storageService` singleton. Vázané na 13.2 — dokud barrel existuje, sweep je nevidí.
`backup.ts` má vlastní BLOCKER komentář a je zaparkovaný ve
`projectplan-future-updates.md` → **nemazat**, jen přestat re-exportovat.

### N-13.5 — ⚪ DLUH (nemazat, nezasahovat): obrácená závislost narostla na 19 míst

Viz 13.3. Zapsáno jako dluh k samostatnému úkolu, ne k řešení v auditu.

---

## PLAN-DISCREPANCY

1. **Plán 13.1 uvádí „3370 řádků"** — realita je 3375 (`gratitudeStorage.ts` 1752,
   `habitStorage.ts` 761, `goalStorage.ts` 862). Nepodstatný rozdíl, ale plán
   vychází z čísel 6/10 auditu, mezitím soubory mírně narostly.
2. **Plán 13.1 předpokládá, že telemetrie stačí k rozhodnutí.** Nestačí — chybějící
   spouštěč migrace (N-13.2) je otázka, na kterou telemetrie neodpoví.
3. **Plán 13.4 vyjmenovává 4 podezřelé drobnosti**; 2 z nich (`fixBeginnerTargetText.ts`,
   `hapticsService.ts`) jsou **živé a používané**. Sweep za to našel 24 jiných souborů,
   které v plánu nejsou.
4. **N31 v plánu i v 6/10 auditu mluví o 2 místech** (`SQLiteHabitStorage.ts:333`,
   `habitStorage.ts:274`) — dnes je jich 19 a řádky nesedí (posunuly se opravami
   Fází 4-5). Postupováno podle reality (E4).

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 8 (13.1–13.8) | 8 | ✓ |

Kontrolní součty auditu:
- souborů proskenováno sweepem: 217
- osiřelých souborů nalezeno: 24 (7289 ř.) + 3 maskované barrelem (1308 ř.)
- kandidátů ověřeno druhým průchodem na úrovni symbolů: 9 / 9
- root `.md` souborů zkatalogizováno: 33 / 33

---

## Provedené opravy (jen položky schválené předem)

### 13.7 — `RECOMMENDATION_FOLLOW` XP smazáno (schváleno 2026-07-21)

Smazáno 15 míst ve 12 souborech. Před každým smazáním ověřeno grepem, po dokončení
`grep -rn "RECOMMENDATION_FOLLOW\|recommendationsFollowed\|recommendations_followed\|getRecommendationsFollowedCount"`
přes `src/` + `app/` + `__tests__/` → **0 zásahů**.

| Soubor | Co |
|---|---|
| `src/types/gamification.ts` | člen enumu `XPSourceType.RECOMMENDATION_FOLLOW` |
| `src/constants/gamification.ts` | `XP_REWARDS.ENGAGEMENT.RECOMMENDATION_FOLLOW: 30` + celý blok `XP_SOURCE_CONFIG` |
| `src/services/gamification/xpLimits.ts` | mapování denního limitu |
| `src/services/gamificationService.ts` | 2× (inicializace breakdownu, popisek transakce) |
| `src/services/marketingDemoDataService.ts` | inicializace breakdownu |
| `src/services/achievementService.ts` | `sources.add(...)` v kategorii MASTERY |
| `src/services/achievementIntegration.ts` | celá metoda `getRecommendationsFollowedCount()` (27 ř.) vč. placeholderu ×0,3, `case 'recommendations_followed'`, pole ve snapshotu |
| `src/components/gamification/XpNotification.tsx` | `case` s ikonou |
| `src/components/gamification/XpPopupAnimation.tsx` | 2× `case` (barva/ikona + překlad) |
| `src/utils/achievementPreviewUtils.ts` | pole `recommendationsFollowed` v `UserStats` |
| `app/achievements.tsx`, `src/utils/userStatsCollector.ts` | 3× naplnění pole nulou |

**Ponecháno záměrně**: `recommendationEngine` a karty doporučení na Home
(funkčně v pořádku dle Fáze 11) — smazána byla jen nikdy nepoužitá XP větev.

**Zbytek po smazání** (nový drobný nález, viz N-13.6): `XP_REWARDS.ENGAGEMENT`
zůstal se dvěma nikdy nepoužitými konstantami (`CUSTOMIZATION_USE: 20`,
`SHARING_ACTION: 25`) a `DAILY_XP_LIMITS.ENGAGEMENT_MAX_DAILY: 200` je teď taky
bez konzumenta. Nemazal jsem je — jsou to rezervy pro plánované funkce, ne
součást schváleného rozsahu.

### 13.8 — Mrtvé i18n klíče smazány (schváleno 2026-07-22)

**99 klíčů v každém ze 3 jazyků (297 celkem)** + 83 typových deklarací.
Vždy ve všech 3 jazycích najednou, jak plán nařizuje.

| Co | Klíčů / jazyk |
|---|---|
| `achievements.achievementNames.*` — smazáno 73 mrtvých ID, **ponecháno 10 loyalty** | 73 |
| `achievements.achievementRequirements.*` — 8 ID, která nejsou v katalogu | 8 |
| `achievements.{flame_collector,triple_crown_master,recommendation_master}` (`.name` + `.description`) | 6 |
| `achievements.progressHints.{triple_crown_master,flame_collector,recommendation_master}` | 9 |
| i18n zbytky po 13.7 (`gamification.xp.sources.recommendation_follow`, `gamification.xpSources.recommendationFollow`, `gamification.sources.recommendation_follow.icon_description`) | 3 |

**Proč se 10 loyalty klíčů v `achievementNames` nechává**: jsou jediné živé.
`src/services/loyaltyService.ts:25-34` je drží jako `nameKey` a
`src/components/achievements/LoyaltyProgressCard.tsx:76,360` je vykresluje přes
`t(nextMilestone.nameKey)`. Ověřeno i to, že se klíč nikde nesestavuje dynamicky
(grep `achievementNames` mimo locale a typy → jen těch 10 statických řádků).

**Typy**: `src/types/i18n.ts` deklaroval smazané klíče explicitně (na rozdíl od
bloků s `as any`), takže `tsc` mazání okamžitě zachytil — 83 deklarací odstraněno
podle jeho hlášení, ne odhadem.

**Kosmetika**: `src/constants/achievementCatalog.ts:2` tvrdil „78 Total Achievements",
opraveno na 75 s poznámkou, které 3 a kdy zmizely.

**Co ZŮSTÁVÁ nedodělané z 13.8**: 339 klíčů bez reference (`goals.sharing` 26,
`auth.*` 17, `journal.export` 11, `tutorial.validation` 13…). Plán u nich sám
nařizuje ruční ověření a zakazuje hromadné mazání — je to samostatný kus práce,
ne dodatek k této session.

---

## Ověření po opravách

```
$ npx tsc --noEmit
(0 chyb)

$ npm test
Test Suites: 32 passed, 32 total
Tests:       476 passed, 476 total
Snapshots:   0 total
Time:        15.913 s
Ran all test suites.
```

Auditní skripty Fáze 12 přehrány na uklizeném stromu:

```
EN keys: 2678      (bylo 2777 → −99)
DE keys: 2678
ES keys: 2678
--- MISSING IN DE (0) ---     --- ORPHAN IN DE (0) ---
--- MISSING IN ES (0) ---     --- ORPHAN IN ES (0) ---
--- INVALID STATIC t() PATHS (0) ---
```

Regresní test parity `src/locales/__tests__/localeParity.test.ts` (z Fáze 12)
prošel po každém kroku — to je přesně ta pojistka, kvůli které vznikl.

---

## Nálezy k opravě — dodatek

### N-13.6 — 🟡 NÍZKÁ: zbytkové konstanty po 13.7

`XP_REWARDS.ENGAGEMENT.CUSTOMIZATION_USE` (20), `.SHARING_ACTION` (25) a
`DAILY_XP_LIMITS.ENGAGEMENT_MAX_DAILY` (200) — po smazání `RECOMMENDATION_FOLLOW`
už je nikdo nečte (`src/constants/gamification.ts:57-59, 101`; grep přes `src/` + `app/`
mimo definice → 0 zásahů). Ponecháno; k rozhodnutí, jestli jsou to rezervy pro
plánované funkce, nebo mrtvé konstanty.

---

## Rozhodnutí Petra (2026-07-22, druhé kolo) — zapsáno PŘED implementací

| Nález | Rozhodnutí | Co se udělá |
|---|---|---|
| **N-13.1** | opravit | `achievementService.getGratitudeStreakInfo()` → přes flag helper |
| **N-13.2** | **„appka ještě venku oficiálně není, zatím jen u testerů a ten přechod se dělal dávno"** → smazat | celý `src/services/database/migration/` (16 souborů, 4663 ř.) |
| **N-13.3** | dotaz „a co to má dělat? co s tím?" | nejdřív vysvětlit po souborech, teprve pak mazat |
| **N-13.5** | OK (ponechat jako dluh) | nic |
| **N-13.6** (root `.md`) | dotaz „to jsou takové ty pomocné soubory?" | nejdřív vysvětlit |
| **13.8 zbytek (339 klíčů)** | odloženo | až po dořešení předchozích bodů |

---

## Provedené opravy — druhé kolo

### N-13.1 — Trophy Room už nečte z mrtvého AsyncStorage

`src/services/achievementService.ts:1658-1670`:

```ts
private static async getGratitudeStreakInfo(): Promise<any> {
  const { getGratitudeStorageImpl } = require('../config/featureFlags') as typeof import('../config/featureFlags');
  return await getGratitudeStorageImpl().getStreak();
}
```

Netypovaný `require` legacy singletonu nahrazen typovaným helperem podle pravidla
z `featureFlags.ts:70-80`. Nad metodou je komentář popisující, co bylo rozbité a proč,
aby se to nevrátilo. Dopad: `currentJournalStreak`, `starCount`, `flameCount`,
`crownCount` a `hasTripleCrown` na obrazovce Trofeje teď ukazují skutečná data.

### N-13.2 — adresář migrace smazán (4663 řádků, 16 souborů)

`git rm -r src/services/database/migration`

**Bezpečnostní argument, proč to nemůže nic rozbít**: kód byl **nedosažitelný** —
neexistoval jediný import a žádný spouštěč. Smazání nedosažitelného kódu je
z definice bez vlivu na běh appky. Kdyby dnes tester měl data v AsyncStorage,
nezmigrovala by se ani před smazáním, ani po něm — to je nález N-13.2, ne
důsledek mazání.

Ověřeno před smazáním (nad rámec dvou grepů z auditní části):

```
=== reference v package.json / jest.config.js / app.json / eas.json / babel.config.js / tsconfig.json ===
(žádná)
=== reference kdekoliv v repu mimo adresář (vč. .js a .json) ===
jen dokumentace: I18N_FINAL_AUDIT_REPORT.md:94, projectplan.md, docs/audits/*
```

Kód zůstává dohledatelný v gitu (`git show 687d50a:src/services/database/migration/…`),
takže „smazání" je vratné.

Po smazání: `tsc --noEmit` 0 chyb, `npm test` 476/476 (32/32 suites).

---

### N-13.3 — 10 osiřelých souborů smazáno (3263 řádků)

Petr rozhodl 2026-07-22: „smazat všechno včetně těch sociálních sítí."
Před smazáním proběhlo **čerstvé ověření** (codebase se od auditní části změnila
opravami 13.7/13.8) — pro každý soubor grep na jeho název přes `src/` + `app/` +
`__tests__/` s vyloučením mazané skupiny; všech 10× „čisto".

| Soubor | Řádků | Co to mělo dělat | Proč zmizel |
|---|---|---|---|
| `src/utils/concurrencySafeguards.ts` | 560 | fronta XP operací, atomické zápisy proti souběhu | souběh dnes řeší SQLite transakce + batching v `GamificationService` |
| `src/services/socialSharingService.ts` | 516 | sdílení trofejí, „daily heroes", motivační citáty | nedokončená funkce; Petr ji škrtl |
| `src/components/home/MonthlyHabitOverview.tsx` | 471 | starší měsíční přehled návyků | Home mountuje `HabitStatsDashboard` + `Monthly30DayChart` (`app/(tabs)/index.tsx:10-19`) |
| `src/utils/userStatsCollector.ts` | 416 | sběr statistik pro náhledy trofejí (`@ts-nocheck`) | nahrazen `getRealTimeUserStats` — říkal to komentář v `achievementService.ts:1457` |
| `src/utils/performanceProfiler.ts` | 365 | měření rychlosti gamifikace (<50 ms) | ladicí nástroj, nikdy nezapojený |
| `src/components/home/StreakVisualization.tsx` | 275 | starší vizualizace série | Home mountuje `StreakHistoryGraph` |
| `src/utils/consoleSuppression.ts` | 256 | umlčení varování ExpoLinearGradient (SDK 53) | řeší `LogBox.ignoreLogs` v `app/_layout.tsx:42` |
| `src/components/animations/AnimatedStreakNumber.tsx` | 221 | animace čísla série | nikdy nezapojená |
| `src/components/animations/StreakTransition.tsx` | 85 | přechodová animace série | nikdy nezapojená |
| `src/utils/xpCounterOptimizationSummary.ts` | 98 | seznam provedených optimalizací **zapsaný jako TypeScript** | dokumentace v hávu kódu |

Adresář `src/components/animations/` tím zůstal prázdný a zanikl.

**Kontrola kaskády** (nevznikly smazáním nové sirotky?) — sweep přehrán:

```
scanned files: 191        (bylo 217 → −26 souborů)
files with ZERO import references (0):
  total lines: 0
```

---

## Ověření po druhém kole oprav

```
$ npx tsc --noEmit
(0 chyb)

$ npm test
Test Suites: 32 passed, 32 total
Tests:       476 passed, 476 total
Snapshots:   0 total
Time:        16.161 s
Ran all test suites.
```

**Celková bilance Fáze 13**: smazáno **26 souborů / 7926 řádků**
(4663 migrace + 3263 osiřelých) + 15 míst po `RECOMMENDATION_FOLLOW`
+ 99 i18n klíčů × 3 jazyky + 83 typových deklarací.
Opraven 1 vysoký nález (N-13.1). Ani jeden test navíc nepadl.

### 13.8 dokončení — 153 mrtvých i18n klíčů ve 34 celých blocích

Petr 2026-07-22: „co ten bod 13.8?" → dokončeno.

**Metodicky to NEBYLO smazání seznamu z auditní části.** Hrubý seznam „339 klíčů bez
reference" se ukázal jako nespolehlivý a v průběhu práce ho musely opravit **tři
nezávislé filtry**. Kdybych ho smazal tak, jak byl, rozbil bych živé funkce:

**Filtr 1 — dynamicky skládané klíče (27 falešně pozitivních).** Klíč, který se
nikde nevyskytuje jako literál, ale kód ho poskládá za běhu:

```
journal.bonusMilestone{1,5,10}_{title,text}          <= t(`journal.${milestoneKey}_title`)
journal.streakMilestone{7,14,21,100,365,1000}_{...}  <= t(`journal.${milestoneKey}_text`)
monthlyChallenge.milestone.motivation_{25,50,75}     <= t(`monthlyChallenge.milestone.motivation_${milestone}`)
achievements.detail.rarity{Common,Rare,Epic,Legendary} <= t(`achievements.detail.rarity${rarityCapitalized}`)
social.history.latestAchievements_{one,other}        <= t(`social.history.latestAchievements_${...}`)
```

To je 18 textů milníkových modalů deníku + 3 texty modalu měsíční výzvy + 4 popisky
vzácnosti. **Hromadné smazání by je vyprázdnilo.**

**Filtr 2 — plná cesta klíče kdekoliv ve zdrojích (4 další).** Klíč nemusí být
uvnitř `t()`, může sedět třeba v konstantě jako `descriptionKey`:
`journal.input.frozenStreakError_{one,other}`, `monthlyChallenge.difficulty`,
`monthlyChallenge.detailModal.strategyDescription`.

**Filtr 3 — placeholder může obsahovat tečku.** Nejzávažnější díra: první verze
filtru překládala `${...}` na „jeden segment bez teček". Jenže
`src/components/common/HelpTooltip.tsx:58` dělá

```ts
const helpContent = t(`help.${helpKey}`, { ... });
```

a volající místa předávají `helpKey="habits.scheduling"`, `"journal.debtRecovery"`,
`"goals.predictions"` … — **tedy hodnoty s tečkou**. Podle původního filtru vycházely
celé bloky `help.habits`, `help.journal`, `help.goals`, `help.home` jako mrtvé.
Smazání by **odstřelilo nápovědní bublinky**, tedy funkci auditovanou ve Fázi 8.
Opraveno na `.*` a pro `help.` navíc přesná enumerace všech 10 skutečných `helpKey`
hodnot z volajících míst — takže se smazaly jen ty podsekce nápovědy, ke kterým
žádné volající místo neexistuje.

**Filtr 4 — práce po blocích, ne po klíčích.** `ads.rewarded` ukázal, proč: z 9 klíčů
bloku jich hrubý seznam označil jen 4 (ty s výrazným názvem listu jako `buttonWatch`;
`title`, `loading`, `success` propadly, protože ta slova jsou v kódu všude). Smazání
by nechalo rozpůlený blok. Finální kritérium: **smaž jmenný prostor, jen když je
mrtvý úplně celý.**

**Výsledek: 34 celých bloků / 153 klíčů × 3 jazyky (459 záznamů) + 34 typových bloků.**

| Blok | Klíčů | Proč je mrtvý |
|---|---|---|
| `auth` (`login`, `register`) | 21 | appka nemá žádné přihlašování ani registraci |
| `tutorial.validation` | 13 | validační hlášky tutoriálu bez volajícího místa |
| `ads` (`banner` + `rewarded`) | 11 | `AdBanner.tsx` nepoužívá `t()` vůbec; obnova série přes reklamu jede na `home.canRecover` |
| `tutorial.accessibility` | 9 | — |
| `challenges.calendar` | 8 | živý kalendář výzev čte `monthlyChallenge.calendar.*` |
| `gamification.achievement` | 7 | — |
| `gamification.effects`, `help.gamification` | 6 + 6 | `help.gamification` nemá žádné `helpKey` volání |
| `gamification.xp.announcement`, `.notifications`, `gamification.analysis` | 5 + 5 + 5 | — |
| `gamification.multiplier.timeFormat` | 4 | živý odpočet používá `home.xpMultiplier.timeRemaining.*` (`XpMultiplierSection.tsx:231-239`) |
| `tutorial.skipConfirmation`, `.progress`, `.recovery` | 4 + 4 + 4 | — |
| `notifications.morning`, `notifications.evening` | 4 + 4 | starý plochý formát; plánovač čte `notifications.reminders.*` |
| `tutorial.steps.journalEncouragement`, `challenges.completion` | 3 + 3 | — |
| `gamification.xp.notification`, `monitoring` | 2 + 2 | — |
| 8× podsekce nápovědy bez `helpKey` volání (`help.habits.streakTracking`, `help.habits.colorAndIcon`, `help.journal.gratitudeStreak`, `help.journal.bonusEntries`, `help.goals.progressTracking`, `help.goals.templates`, `help.home.streakBadges`, `help.home.habitStatistics`) | 16 | — |
| `help.challenges.progressTracking`, `.completionRewards` | 2 + 2 | — |
| `gamification.progress.badge`, `.bar`, `.milestone` | 3 | — |

**Ověření po smazání:**

```
EN keys: 2525      (bylo 2678 → −153)
DE keys: 2525
ES keys: 2525
--- MISSING IN DE (0) ---   --- ORPHAN IN DE (0) ---
--- MISSING IN ES (0) ---   --- ORPHAN IN ES (0) ---
--- INVALID STATIC t() PATHS (0) ---
CELÉ MRTVÉ BLOKY (0 bloků / 0 klíčů)
```

`tsc --noEmit` 0 chyb (typy v `src/types/i18n.ts` mazání hlídaly — 11 bloků mělo
v typech jiný tvar, jednořádkový nebo s `?`, a `tsc` na ně upozornil, takže se
nezapomněly), `npm test` 476/476.

**Vědomě NEsmazáno: 87 osamocených mrtvých klíčů** uvnitř jinak živých bloků
(`gamification.xp.label`, `monthlyChallenge.awesome`, `common.skip`, `ui.edit`…).
Důvod: poměr přínosu a rizika. Jde o jednotlivé řetězce roztroušené mezi používanými,
každý by chtěl vlastní oční kontrolu, a jejich odstranění nezmenší údržbu o nic
podstatného. Seznam je ve scratchpadu session (`dead-singles.txt`) a analýza je
zopakovatelná skriptem `check9.cjs`.

**Poznámka k vlastní práci z Fáze 12**: klíč `common.confirmAction`, který jsem tehdy
přidal kvůli N-12.4, má v locale sourozence `common.modals.confirmTitle`
(„Confirm Action") se stejným významem — ten je nepoužitý a je mezi těmi 87.
Duplicitu jsem vyrobil já tím, že jsem hledal jen přesnou cestu z kódu a ne významový
ekvivalent. Není to chyba v chování, ale zapisuju to.

---

## 13.1 + N-13.4 — smazání legacy storage vrstvy (rozhodnuto 2026-07-22)

Petr: *„tak teď je čas na ten připravený úklid. Ověř, že se tím opravdu nic
neposere a když to bude OK, tak se do toho pust."*

### Ověření PŘED prvním smazaným řádkem

Sedm nezávislých grepů. Výsledek: **mrtvý klastr je uzavřený** — zvenčí do něj
nevede nic než side-effect barrel z `app/_layout.tsx:18`.

```
=== dosažitelnost mimo klastr ===
✅ dataBackup / DataBackup   — nikde
✅ dataMigration / DataMigration — nikde
✅ userStorage / UserStorage — nikde
✅ storageService            — nikde
=== barrel jako celek importuje jen ===
src/services/index.ts:16: export * from './storage';
```

**Skutečné závislosti, které NEJSOU mazání** (musely se vyřešit jako první):

| # | Místo | Co s tím |
|---|---|---|
| 1 | `SQLiteGoalStorage.ts:15` → `calculateTimelineStatus` z `goalStorage.ts:822` | **jediná funkční spojka** — SQLite implementace používala funkci z legacy souboru; přesunout |
| 2 | `featureFlags.ts:88-92, 103-107, 118-122` | 3 mrtvé `else` větve |
| 3 | `xpMultiplierService.ts:377` | 1 mrtvá `else` větev |
| 4 | `storage/index.ts:5-8, 19, 63` | re-exporty + `StorageService` používající `userStorage` |
| 5 | 3 testovací soubory | mockují legacy cesty jako **věšák na mock objekty** (produkce jde přes `featureFlags`) |

### Proč to nemůže nic rozbít

- Legacy soubory jsou **nedosažitelné** už dnes: všech 5 flagů je `true` a jsou to
  `as const` konstanty, ne runtime přepínač. `else` větve jsou mrtvé při kompilaci.
- Jediná věc, která by rozbití způsobila, byla spojka č. 1 — a ta se řeší
  **přesunem**, ne smazáním.
- Testy legacy vrstvu netestují. Mockují její modulové cesty, protože je to
  pohodlné místo, kam zavěsit mock; produkční kód si storage řeší přes
  `getHabitStorageImpl()` a testy ten helper stejně přepisují.

### Rozhodnutí o `backup.ts` (zaparkovaná funkce Zálohování/Export)

`backup.ts` legacy vrstvu blokoval. **Přepojit na SQLite nešlo**: kontrola parity
metod ukázala, že `deleteAll` existuje jen u cílů —

```
deleteAll   habit:0  journal:0  goal:1
```

— takže by bylo nutné napsat **nový nevratně mazací kód** (smaž všechny návyky,
smaž celý deník) pro funkci, kterou nikdo nepoužívá, a nebylo by na čem ho
otestovat. To je přesně ta „method parity" past, před kterou varoval BLOCKER
komentář v hlavičce toho souboru.

Petr zvolil **smazat celý mrtvý klastr** (4683 ř.), návrh funkce zapsat do
`projectplan-future-updates.md` s git odkazem. Věcný důvod: až se Zálohování
bude dělat, musí se psát znovu — pro SQLite se zálohuje úplně jinak než výpisem
klíčů z AsyncStorage.

### Vědomě mimo záběr

`USE_SQLITE_GAMIFICATION` a `USE_SQLITE_CHALLENGES` mají **~45 vlastních
`else` větví** v `gamificationService`, `achievementStorage`,
`monthlyChallengeService`, `monthlyProgressTracker`,
`monthlyChallengeLifecycleManager` a `levelUpEvents`. To je samostatný úkol —
tady se jich nedotýkám. Zůstávají i **všechny flagy**, protože je počítá
telemetrie `sqlite_migration_state` (`appInitializationService.ts:177-181`,
očekává 5).

### Provedeno — 6 souborů / 4692 řádků, po jednom kroku s testem po každém

Petr v průběhu doplnil: *„jen aby to nic nerozbilo, žádnou funkci."* Proto se
`npx tsc --noEmit` i celá sada 476 testů pouštěly **po každém jednotlivém kroku**,
ne až na konci. Ani jeden krok nebyl červený.

| # | Krok | Výsledek |
|---|---|---|
| 1 | `calculateTimelineStatus` přesunuta z `goalStorage.ts:822` do nového `src/utils/goalCalculations.ts` (verbatim, bez změny chování); `SQLiteGoalStorage.ts:15` na ni přesměrován | 476/476 |
| 2 | 3 testovací soubory přepsány — mocky teď visí přímo na `featureFlags` helperech místo na legacy modulových cestách | 14/14, 19/19, 26/26 |
| 3 | 3 mrtvé `else` větve ve `featureFlags.ts` + 1 v `xpMultiplierService.ts:376` | 476/476 |
| 4 | `storage/index.ts` zúžen na živé exporty; `StorageService` + `storageService` odstraněny | 476/476 |
| 5 | smazáno po jednom: `backup.ts` (574), `migration.ts` (405), `userStorage.ts` (329) | 476/476 po každém |
| 6 | smazáno po jednom: `goalStorage.ts` (823), `habitStorage.ts` (761), `gratitudeStorage.ts` (1752) | 476/476 po každém |

**Přepis testů stojí za zmínku**: mocky teď volají `getHabitStorageImpl()` —
tedy **přesně to, co volá produkční kód** (`userActivityTracker.ts:273`). Dřív
visely na legacy modulových cestách a přes přepsaný `featureFlags` se k nim
klikatilo zpátky. Test tím zesílil, ne zeslábl: čte se stejnou cestou jako
produkce a nemá vlastní paralelní realitu.

**Bezpečnostní kontrola během mazání zafungovala** — u `gratitudeStorage.ts` se
skript zastavil na nálezu v `achievementService.ts:1661`. Šlo o **můj vlastní
komentář** z opravy N-13.1, který doslova citoval `require('./storage/…')`.
Ověřeno, že jde o prózu, ne o import; komentář pak přeformulován, aby na něj
příští grep nenarazil.

### Závěrečné funkční ověření

**1. Parita metod** — nejsilnější důkaz, že se nic nerozbilo. Skript vytáhl všechny
proměnné navázané na storage helpery a všechna volání na nich, a porovnal je
s metodami definovanými na SQLite implementacích:

```
zkontrolováno volání: 85
✅ PARITA OK — každá volaná metoda na SQLite implementaci existuje
```

Tohle je přesně ta třída chyby, která způsobila goals split-brain (7/2026) a
N-13.1 v této fázi: kód volá metodu, kterou aktivní implementace nemá, a dostane
tiše nulu. Po úklidu takové místo v codebase není.

**2. Žádný import legacy modulů nikde**:

```
grep -rnE "(from|require\()\s*['\"][^'\"]*storage/(gratitudeStorage|habitStorage|goalStorage|backup|migration|userStorage)['\"]"
→ ✅ nula
```

**3. Sweep — mazání nevyrobilo nové sirotky**:

```
scanned files: 186     (bylo 191 → −5)
files with ZERO import references (0)
```

**4. Obsah `src/services/storage/` po úklidu** — jen živé věci:

```
SQLiteChallengeStorage.ts  SQLiteGoalStorage.ts  SQLiteGratitudeStorage.ts
SQLiteHabitStorage.ts      base.ts               homePreferencesStorage.ts
index.ts                   __tests__
```

**5. Flagy a telemetrie nedotčené** — `appInitializationService.ts:177-181` pořád
počítá všech 5 `USE_SQLITE_*` (`sqlite_migration_state` očekává 5).

**6. Celá sada 32 suites zelená** včetně `storageSplitBrain.test.ts` (napsaný
právě proti téhle třídě chyb), `achievementEvaluation.test.ts` (89 testů,
1 na achievement) a `localeParity.test.ts`.

```
Test Suites: 32 passed, 32 total
Tests:       476 passed, 476 total
```

### Návrh funkce Zálohování zachován

`projectplan-future-updates.md` § „Phase 3: Data Export & Backup System" doplněn
o sekci **„Co se stalo se starou implementací"**: proč byla nepoužitelná
(zálohovala prázdný AsyncStorage a hlásila úspěch), git příkazy k obnovení všech
tří smazaných souborů (`git show 4292741:…`), co z původního návrhu platí
(formát `.selfrise.json`, user flow) a co bude potřeba nově (export nad SQLite,
transakční import, `deleteAll()` pro návyky a deník **s testy**, round-trip test
jako podmínka zapojení do UI).

## Stav: audit 8/8 HOTOVO; opravy 13.7, 13.8, N-13.1, N-13.2, N-13.3 a **13.1 + N-13.4** HOTOVÉ
NEDOKONČENO — vědomě odloženo: N-13.4 (1309 ř. za storage barrelem, vč.
zaparkovaného `backup.ts`), N-13.6 (zbytkové konstanty `ENGAGEMENT`),
13.6 root `.md` soubory (Petr: „teď to řešit nebudeme"),
a 339 i18n klíčů ze 13.8 (Petr: „dořešíme to všechno a potom se vrátíme ke 13.8").
