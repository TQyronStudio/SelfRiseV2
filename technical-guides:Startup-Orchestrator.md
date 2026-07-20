# 🚦 SelfRise V2 — Startup Orchestrator Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **3 kritická pravidla** — bez nich se vrací zamrzání na prvním spuštění
- **Kontrakt `StartupStep`** (`prepare()` vs. `present()`) — jak přidat nové startovní okno
- **Bariéra `awaitStartupComplete()`** — proč naše UI čeká na systémová okna
- **App-ready gate** — proč se prompt nesmí spustit moc brzy
- **Inicializace databáze** — retry, idempotence migrací, force-quit bezpečnost
- **Nebezpečné zóny** — přesně ty způsoby, jak si tenhle systém znovu rozbít

**🔧 KDY TOHLE POUŽÍVAT:**
- Přidáváš JAKÉKOLIV nové startovní okno (souhlas, oprávnění, onboarding krok)
- Saháš na `src/services/startup/`, `app/_layout.tsx` nebo start tutoriálu
- Měníš inicializaci databáze nebo migrace schématu
- Řešíš problém typu „appka zamrzla / okno se nezobrazilo / tutoriál naskočil moc brzy"

---

## Proč tenhle systém existuje

**Historický bug**: externí tester zamrzl na prvním spuštění aplikace. Příčina: na
iOS se **dvě modální okna zobrazila přes sebe** (systémový ATT prompt + naše RN
uvítací brána) → aplikace zamrzla natvrdo.

Původní řešení (`src/utils/startupGate.ts`) znalo **napevno jen 2 úkoly** (`att`,
`consent`) — byla to záplata na dvě konkrétní okna, ne systém. Jakmile by přibylo
libovolné další startovní okno (budoucí EU souhlas, druhá vrstva UMP, cokoliv),
princip by se rozbil.

**Startup Orchestrator** (od 2026-07-14, `src/services/startup/`) je obecný
dirigent: drží frontu startovních oken a pouští je **striktně jedno po druhém**.
Naše UI (uvítací brána, tutoriál) čeká za bariérou, dokud fronta nedoběhne.
`startupGate.ts` byl smazán.

> ✅ **Ověřeno auditem 2026-07-20** (super audit Fáze 10) — všechna 3 kritická
> pravidla dodržena, 0 nálezů proti orchestrátoru. Potvrzeno i reálným provozem
> (testeři).

---

## 🚨 3 KRITICKÁ PRAVIDLA (bez nich systém NEFUNGUJE)

### Pravidlo 1: Timeout NIKDY neobaluje interaktivní zobrazení okna

```typescript
// ❌ FATAL: krátký timeout přes zobrazený prompt
await Promise.race([
  requestTrackingPermissionsAsync(),  // uživatel může přemýšlet minuty
  timeout(5000),                       // ...a tohle ho "přeskočí"
]);
// → orchestrator pokračuje, pustí tutoriál PŘES otevřený prompt → ZAMRZNUTÍ

// ✅ CORRECT: timeout jen na neinteraktivní přípravu, zobrazení bez timeoutu
prepare()  → obaleno prepTimeoutMs (síť, fail-open)
present()  → BEZ pacing timeoutu, jen 5min crash-pojistka
```

**Proč**: nativní prompt legitimně čeká na uživatele libovolně dlouho. Krátký
timeout přes zobrazené okno = orchestrator si myslí, že je hotovo, a pustí další
modal přes ten otevřený → **přesně to zamrznutí, které řešíme**.

**Jak je to vynuceno**: strukturálně, ne disciplínou. Rozhraní `StartupStep`
(`src/services/startup/types.ts`) fyzicky odděluje `prepare()` od `present()` a
orchestrator (`startupOrchestrator.ts`) aplikuje timeout **jen** na `prepare()`.
Stejný princip jako `tutorialAchievementGate` (120 s).

### Pravidlo 2: Reklamy + Crashlytics běží VŽDY

```typescript
// ✅ CORRECT (app/_layout.tsx) — bezpodmínečně PO sekvenci
await runStartupSequence();
await initAnalyticsAfterConsent();   // vždy
await finalizeAdsAndDiagnostics();   // vždy

// ❌ WRONG: gatovat je přes shouldRun() consent kroku
// → non-EEA uživatel (bez formuláře) by přišel o reklamy I crash reporting
```

**Proč**: uživatelé mimo EEA žádný souhlasový formulář nevidí. Kdyby inicializace
reklam a Crashlytics visela na tom, že se formulář zobrazil, přišli by o obojí.
`adConsentStep` je proto **jen modal**; nepodmíněná práce žije mimo pipeline.

### Pravidlo 3: Zachovat pořadí ATT → zapnout analytics → `app_open`

```typescript
// Pipeline pořadí = pořadí oken (src/services/startup/index.ts)
createStartupOrchestrator([attStep, adConsentStep]);

// Analytics až PO sekvenci (useFirebaseAnalytics.initAnalyticsAfterConsent):
await setAnalyticsCollectionEnabled(analytics, true);  // nejdřív zapnout
await logEvent(analytics, 'app_open', { ... });        // pak teprve událost
```

**Proč**: sledování nesmí začít dřív, než uživatel odpoví na ATT. Pořadí ATT→UMP
navíc doporučuje Google.

---

## Kontrakt `StartupStep` — jak přidat nové okno

**Celá hodnota systému**: každé budoucí startovní okno je **jedna položka v poli**.

```typescript
// src/services/startup/types.ts
export interface StartupStep {
  id: string;                      // stabilní id pro logy/telemetrii

  shouldRun(): Promise<boolean>;   // LEVNÝ, LOKÁLNÍ check (idempotence/resume)
                                   // ⚠️ žádná síť, žádné UI, žádné side-effecty

  prepare?(): Promise<void>;       // NEINTERAKTIVNÍ příprava (síť)
                                   // orchestrator ji obalí prepTimeoutMs (fail-open)
                                   // ⚠️ NESMÍ zobrazit UI

  present(): Promise<void>;        // INTERAKTIVNÍ: zobraz okno a čekej na zavření
                                   // ⚠️ ŽÁDNÝ krátký timeout (jen 5min crash-pojistka)

  prepTimeoutMs: number;           // timeout POUZE pro prepare()
  critical?: boolean;              // default false = fail-open
}
```

### Postup přidání nového okna

1. Vytvoř `src/services/startup/steps/<název>Step.ts` implementující `StartupStep`.
2. Nativní moduly importuj **lazy přes `require()`** uvnitř metod (ne top-level
   import) — jinak se natáhnou do Jest grafu, který je nemockuje.
3. Přidej krok do pole v `src/services/startup/index.ts` **na správnou pozici**
   (pozice v poli = pořadí zobrazení).
4. Doplň test do `startupOrchestrator.test.ts` (rozšiřitelnost je tam už krytá
   „3. mock-krok nic nerozbije").

```typescript
// Vzor (zkráceně)
export const mujStep: StartupStep = {
  id: 'muj-souhlas',
  prepTimeoutMs: 6000,
  async shouldRun() { return Platform.OS === 'ios' && !(await uzOdpovezeno()); },
  async prepare() { /* síť, žádné UI */ },
  async present() { /* zobraz a čekej na uživatele */ },
};
```

---

## Bariéra: `awaitStartupComplete()`

```typescript
// Naše RN UI se NIKDY nesmí zobrazit, dokud běží systémová okna.
// src/contexts/TutorialContext.tsx
await awaitStartupComplete();   // bariéra s pamětí (latching)
await autoStartTutorial();      // uvítací brána i tutoriál až tady
```

**Vlastnosti bariéry**:
- **Latching (s pamětí)** — kdo se přihlásí až po doběhnutí, dostane resolve
  okamžitě; nikdo signál nezmešká.
- **Jediná instance** — `src/services/startup/index.ts` exportuje sdílený
  singleton. `_layout.tsx` sekvenci **spouští**, `TutorialContext` na ni **čeká**.
  Obojí musí importovat tentýž modul, jinak se míjejí.
- **Guard proti dvojímu spuštění** — `runStartupSequence()` je idempotentní;
  první volající běží, ostatní jen čekají (StrictMode / re-mount bezpečné).

**Pravidlo**: jakékoliv nové UI, které se zobrazuje při startu, **musí** být za
touto bariérou. UI reagující na akci uživatele (achievement/level-up modaly přes
ModalQueue) za ni nepatří — ty vznikají až po startu.

---

## App-ready gate

```typescript
// defaultWaitForAppReady() — startupOrchestrator.ts
1. AppState.currentState === 'active'   // čeká na aktivní stav
2. requestAnimationFrame()               // čeká na první snímek
```

**Proč**: iOS **tiše zahodí** ATT prompt, když se zavolá moc brzy (během launche
nebo mimo aktivní stav). Uživatel pak nikdy nedostane možnost odpovědět.

Fonty a databázi řeší `app/_layout.tsx` — dokud nejsou hotové, rendruje `null`
a sekvence se vůbec nespustí.

---

## Inicializace databáze (součást startu)

### Pravidlo: singleton se publikuje AŽ po úspěšné migraci

```typescript
// ✅ CORRECT (src/services/database/init.ts) — od opravy N-10.1
let database = await SQLite.openDatabaseAsync('selfrise.db');
await createTables(database);   // když tohle selže...
db = database;                  // ...sem se nikdy nedostaneme

// ❌ WRONG: přiřadit modulový `db` PŘED createTables
// → při selhání zůstane `db` nastavené → retry se přes `if (db) return db`
//   zkratuje a appka běží s POLOVIČNĚ zmigrovaným schématem
```

**Proč**: `app/_layout.tsx` má retry smyčku (3 pokusy, backoff, pak
`DatabaseErrorScreen`). Když singleton zůstane nastavený po selhání, retry vrátí
rozbitou databázi a označí ji za zdravou — appka pak hází chyby ve všech storage
voláních místo aby ukázala chybovou obrazovku. Při selhání se handle navíc
best-effort zavírá, aby retry otevřel čistý.

### Pravidlo: každá migrace re-runnable NEBO transakční

```typescript
// ✅ Běžné kroky: idempotentní
CREATE TABLE IF NOT EXISTS ...
// + ALTER guardované přes PRAGMA table_info (kontrola sloupce před změnou)

// ✅ Restore ze zálohy: atomicky + bez duplicit (od opravy N-10.2)
await database.withTransactionAsync(async () => {
  await database.execAsync(`INSERT OR IGNORE INTO goal_progress (...) SELECT ...`);
  await database.execAsync(`DROP TABLE goal_progress_backup;`);
});

// ❌ WRONG: plain INSERT + DROP mimo transakci
// → force-quit mezi nimi → při dalším startu INSERT znovu → kolize PRIMARY KEY
//   → DB init selže navždy → uživatel trvale na DatabaseErrorScreen
```

**Proč**: `createTables()` běží při KAŽDÉM startu a uživatel může appku kdykoliv
zabít. Každý krok musí přežít force-quit uprostřed — buď je opakovatelný, nebo
je zabalený v transakci (rollback → další start začne čistě).

---

## ⚠️ NEBEZPEČNÉ ZÓNY (nejčastější způsoby, jak to rozbít)

1. **⛔ Timeout přes zobrazené okno** — pravidlo 1. Vypadá to jako rozumná
   ochrana („co když uživatel neodpoví?"), ale je to přesně ta příčina zamrzání.
   Uživatel smí přemýšlet libovolně dlouho.
2. **Gatování reklam/Crashlytics přes `shouldRun`** — pravidlo 2. Nepodmíněná
   práce nepatří do kroku pipeline.
3. **Side-effect v `shouldRun()`** — musí být levný a bez následků; volá se při
   každém startu.
4. **Top-level import nativního modulu v kroku** — rozbije Jest. Používej lazy
   `require()` uvnitř metody.
5. **Nové startovní UI mimo bariéru** — okamžitý návrat překryvu.
6. **Vlastní instance orchestrátoru** — musí se používat singleton z
   `src/services/startup/index.ts`, jinak si spouštěč a čekatel nerozumí.
7. **Přiřazení `db` před dokončením migrací** — viz výše (podkopává retry).

---

## Testování

```typescript
// src/services/startup/__tests__/startupOrchestrator.test.ts (10 testů)
✅ striktní sekvenčnost — krok B nezačne, dokud A nedoběhne
✅ idempotence — shouldRun()===false přeskočí (resume po force-quit)
✅ prep-timeout ANO, present-timeout NE („pomalý uživatel neposune sekvenci")
✅ reklamy + Crashlytics běží i když je consent formulář přeskočen
✅ rozšiřitelnost — 3. mock-krok nic nerozbije
✅ awaitStartupComplete resolvne i pozdnímu čekateli

// src/services/database/__tests__/init.test.ts (6 testů)
✅ inicializace, všechny tabulky, WAL, foreign keys, stejná instance, zápis+čtení
```

**Jádro je čistě testovatelné**: `createStartupOrchestrator(pipeline, { waitForAppReady })`
nemá žádné nativní importy — pipeline i app-ready gate se injektují.

> ⚠️ **Limit testů**: mock `expo-sqlite` otevírá při každém otevření novou
> `:memory:` databázi, takže **force-quit / selhání-větve DB migrací se v testech
> vyvolat nedají**. Jejich správnost stojí na strukturální jasnosti (publish-after-success,
> transakční atomicita, `OR IGNORE`) — o to pečlivěji je při změnách kontroluj ručně.

---

## Co se NESMÍ rozbít

- ATT flow + UMP souhlas (včetně „Manage options" / partneři)
- Pořadí ATT → UMP → analytics → `app_open`
- Zapnutí Crashlytics po consent flow (privacy-first pořadí)
- Uvítací brána (jazyk/theme) a tutoriál (autostart + resume) za bariérou
- ModalQueue invariant: **jedno okno na obrazovce v jeden okamžik**
- Fail-open princip: jeden rozbitý krok nikdy nesmí zablokovat spuštění appky

---

## Device scénáře (po každé změně startu)

1. **Čistá instalace** → ATT → UMP (i „Manage options", i pomalé klikání) →
   uvítací brána → tutoriál. **Nikdy dvě okna přes sebe.**
2. **Force-quit během ATT promptu** → další start pokračuje správně.
3. **Letadlový režim** → UMP `prepare()` vyprší → fail-open, appka plně funkční
   offline (local-first).
4. **Smazání + reinstalace** → čistý stav, žádný crash, tutoriál se spustí znovu.

---

**GOLDEN RULE**: *„Jedno okno v jeden okamžik, striktně za sebou. Timeout jen na
přípravu — nikdy na uživatele. Nepodmíněná práce (reklamy, Crashlytics) běží vždy.
Naše UI až za bariérou."*

---

*Tento průvodce je závazná reference pro veškerou práci na startu aplikace.
Vznikl konsolidací specifikace z `projectplan.md` a ověření kódu při super auditu
Fáze 10 (2026-07-20).*
