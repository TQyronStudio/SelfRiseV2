# Fáze 8 — nálezy (super audit 2026-07): Tutorial + Help Tooltips

Datum: 2026-07-21 | Commit: `758d796` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 464/464 (31/31 suites)

```
tutorialAchievementGate.test.ts → Tests: 4 passed, 4 total
npm test                        → Tests: 464 passed, 464 total
```

Scope dle plánu: položky 8.0–8.3. Guides: `technical-guides:Tutorial.md` (832 ř.),
`technical-guides:Help-Tooltips.md` (208 ř.).

**Celkové hodnocení: tutoriálová část je velmi dobrá** — achievement handshake je
promyšlený a odpovídá zadání do detailu. Dva nálezy: duplikované storage klíče
mimo TutorialContext (křehkost s ošklivým failure mode) a **kompletně mrtvá
telemetrie Help Tooltips** (sbírá data, která nikdo nikdy nečte).

## Položky

### 8.0 Baseline suite

- Verdikt: ✅ `tutorialAchievementGate.test.ts` 4/4 zelené.

### 8.1 Storage klíče `onboarding_tutorial_completed` / `onboarding_current_step`

- Kde: `TutorialContext.tsx:116-125` (9 klíčů), `XpAnimationContext.tsx:9-10, 207-214`
- Pravidlo: plán 8.1 — mimo `TutorialContext` nesmí ty klíče nikdo číst/psát;
  **každý hit mimo = nález**.
- Ověřeno jak: grep obou klíčů + všech `onboarding_*` klíčů přes `src/` + `app/`.
- Verdikt: ⚠️ **jeden hit mimo TutorialContext** (read-only, ale s duplikovanými
  string literály).
- Důkaz:
  - `onboarding_current_step`: **jediný výskyt** `TutorialContext.tsx:117` ✅.
  - `onboarding_tutorial_completed`: `TutorialContext.tsx:116` **+
    `XpAnimationContext.tsx:9`** ❌ (duplikát literálu).
  - `XpAnimationContext.tsx:207-214` čte `onboarding_tutorial_completed` a
    `onboarding_tutorial_skipped` a při aktivním tutoriálu **potlačuje
    level-up modal** — funkčně správné a důležité chování (level-up modal přes
    tutoriálový modal = přesně ten iOS dual-modal freeze, který se jinde řeší
    Startup Orchestratorem).
  - Vlastní komentář (ř. 8) přiznává důvod: *„duplicated here to avoid circular
    dependency with TutorialContext"*.
- **N-8.1 [STŘEDNÍ] — duplikované klíče bez sdíleného zdroje**: hodnoty jsou
  opsané ručně na dvou místech. Přejmenování klíče v `TutorialContext` (nebo
  překlep) **tiše** vypne potlačení level-up modalu → během tutoriálu se objeví
  druhý modal → zamrznutí na iOS. Žádný test to nechytí, tsc taky ne (jsou to
  string literály). Zápis do klíčů mimo TutorialContext neexistuje ✅ (jen čtení),
  takže nehrozí poškození dat — jen tichá ztráta ochrany.
  - Návrh: přesunout ty 2-3 klíče do sdíleného modulu bez závislostí
    (např. `src/constants/storageKeys.ts`, případně rozšířit `STORAGE_KEYS`
    v `services/storage/base.ts`) a importovat na obou místech. Cyklická
    závislost tím nevzniká.

### 8.2 Achievement handshake (`armTutorialAchievementGate`)

- Kde: `src/utils/tutorialAchievementGate.ts` (135 ř.), volající
  `HabitForm.tsx:242-251`, `GoalForm.tsx:380-390`
- Pravidlo: plán 8.2 — armed PŘED vznikem entity → snapshot → potvrzení
  eventem → čekání na zavření modalu s 120s pojistkou.
- Ověřeno jak: projití celého stavového modelu od nuly + kontrola všech cest
  a úklidu listenerů + ověření obou volajících.
- Verdikt: ✅ **model odpovídá zadání ve všech čtyřech bodech.**
- Důkaz (stavový model):
  1. **Armed před vznikem entity**: oba volající vytvoří gate PŘED
     `await onSubmit(...)` (`HabitForm.tsx:242` / `GoalForm.tsx:380`), s
     komentářem vysvětlujícím proč (unlock event přijde ~100 ms po vytvoření
     a jinak by listenery předběhl) ✅.
  2. **Snapshot**: `wasLockedPromise = hasAchievement(id).then(owned => !owned)`
     (ř. 96-98) — pořízen ve chvíli, kdy entita ještě neexistuje ✅.
     `.catch(() => true)` = při chybě raději čekat než přeskočit (bezpečnější
     směr) ✅.
  3. **Potvrzení eventem**: `eventOnce('achievementUnlocked', 5000, match dle id)`
     (ř. 100-104) — čeká na REÁLNÝ unlock, ne na domněnku ✅.
  4. **Čekání na zavření se 120s pojistkou**:
     `eventOnce('achievementCelebrationClosed', DISMISS_TIMEOUT_MS = 120000)`
     (ř. 36, 105) ✅. Komentář ř. 35 to výslovně označuje za crash-safety net,
     ne deadline — **stejný princip jako pravidlo 1 Startup Orchestratoru**.
  - **Všechny tři cesty ve `wait()` jsou korektní**:
    (a) `!wasLocked` (restart / už vlastní) → `unlocked.cancel()` +
    `dismissed.cancel()` + 400 ms na dozavření formuláře → **nečeká na modal,
    který nepřijde** ✅; (b) unlock nedorazil do 5 s → hlasitý `console.warn`
    + pokračuj (fail-open, tutoriál se nikdy nezasekne) ✅; (c) unlock dorazil →
    `await dismissed.promise` (uživatel si modal přečte) ✅.
  - **Úklid listenerů**: `finish()` (ř. 53-60) vždy `clearTimeout` +
    `subscription.remove()`; ve všech třech cestách se oba listenery uzavřou
    (cancel / timeout / event) — **žádný leak** ✅.
  - Historie dvou dřívějších chybných pokusů je zdokumentovaná přímo v souboru
    (ř. 17-25) — přesně ten druh „proč", který brání regresi.
- **N-8.2 [INFO]** — když `onSubmit()` vyhodí výjimku, `wait()` se nezavolá a
  oba listenery zůstanou viset do svých timeoutů (5 s / 120 s). Samy se uklidí
  a nemají vedlejší efekt (resolvují promise, kterou nikdo nečeká) — jen
  evidence, oprava není nutná.

### 8.3 Help Tooltips — eventy a jejich konzument

- Kde: `helpAnalyticsService.ts` (369+ ř.), `helpPerformanceMonitor.ts`,
  emitery `HelpTooltip.tsx:167, 199, 203, 234, 239, 182`
- Pravidlo: plán 8.3 — eventy se reálně odesílají, **event bez konzumenta = nález ❌**.
- Ověřeno jak: grep emitů + grep VŠECH čtecích metod obou služeb přes `src/` + `app/`.
- Verdikt: ❌ **telemetrie je kompletně mrtvá — sbírá se, nikdo ji nečte.**
- Důkaz:
  - **Emitery existují ✅**: `HelpTooltip.tsx` posílá 5 typů událostí přes
    `HelpAnalyticsService.trackHelpInteraction`: `tooltip_opened` (:199),
    `tooltip_closed` (:234), `tooltip_position_changed` (:167),
    `help_content_viewed` (:203), `help_content_duration` (:239); plus
    `HelpPerformanceMonitor.startRenderMeasurement` (:182).
  - **Kam data tečou**: `trackHelpInteraction` (ř. 64-95) → buffer → `flushBuffer()`
    → **AsyncStorage**. Grep `firebase|logEvent|fetch|http` v obou službách =
    **0 hitů** → data nikam neodcházejí, zůstávají lokálně na zařízení.
  - **Konzumenti: ŽÁDNÍ ❌**. Čtecí API existuje —
    `getAnalytics()` (:227), `getRawInteractions()` (:240),
    `exportAnalyticsData()` (:266), `getInsights()` (:301);
    u monitoru `getPerformanceSummary()` (:174), `getDetailedMetrics()` (:293),
    `exportPerformanceData()` (:352), `shouldUsePerformanceMode()` (:335) —
    **všechny mají 0 volajících** v celém `src/` + `app/`. Jediné volané metody
    jsou zapisovací (`trackHelpInteraction`, `startRenderMeasurement`).
  - Dopad: každé otevření/zavření tooltipu stojí CPU + zápis do AsyncStorage
    (buffer + flush) čistě do prázdna. Žádná hodnota, jen režie a údržba
    ~570 řádků kódu.
- **N-8.3 [STŘEDNÍ] — rozhodnutí potřeba**: buď (a) **smazat** obě služby
  i jejich volání z `HelpTooltip` (nejčistší — nic se neztratí, data stejně
  nikdy nikdo neviděl), nebo (b) **napojit na Firebase Analytics** (data by
  začala být k něčemu), nebo (c) ponechat a explicitně zdokumentovat jako
  „připraveno pro budoucí použití". Doporučuji (a).

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-8.3 | ⚠️ STŘEDNÍ | Help Tooltips telemetrie je write-only: 5 typů událostí + měření výkonu se ukládají do AsyncStorage, ale **žádná ze 8 čtecích metod nemá volajícího** a data nikam neodcházejí (8.3) | `helpAnalyticsService.ts`, `helpPerformanceMonitor.ts`, `HelpTooltip.tsx` | **Rozhodnutí Petra**: smazat (doporučeno) / napojit na Firebase / ponechat s poznámkou |
| N-8.1 | ⚠️ STŘEDNÍ | Tutoriálové storage klíče duplikované jako string literály v `XpAnimationContext` — přejmenování v TutorialContext tiše vypne potlačení level-up modalu → dual-modal freeze na iOS (8.1) | `XpAnimationContext.tsx:9-10`, `TutorialContext.tsx:116-125` | Sdílený `storageKeys` modul bez závislostí, import na obou místech |
| N-8.2 | 🧹 INFO | Při výjimce v `onSubmit` se `wait()` nezavolá → listenery visí do timeoutu (self-clean, bez efektu) (8.2) | `HabitForm.tsx`, `GoalForm.tsx` | Evidence, oprava není nutná |

## Rozhodnutí Petra (2026-07-21, session #15 — doslovně)

> „8.3 - ano, smaž / 8.1 - souhlas"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-8.3 | **SMAZAT** | Odstranit `helpAnalyticsService.ts` + `helpPerformanceMonitor.ts` i všechna jejich volání v `HelpTooltip.tsx` (data nikdo nikdy nečetl) |
| N-8.1 | OPRAVIT | Sdílený modul `src/constants/storageKeys.ts` (bez závislostí) — importovat v `TutorialContext` i `XpAnimationContext` |
| N-8.2 | bez zásahu | INFO, oprava není nutná |

## PLAN-DISCREPANCY

- Plán 8.3 jmenuje eventy `help_tooltip_shown` / `help_tooltip_dismissed` —
  v kódu **neexistují**. Skutečné názvy: `tooltip_opened` / `tooltip_closed`
  (+ 3 další). Audit proveden proti skutečným názvům.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 4 (8.0–8.3) | 4 (8.0–8.3) | ✓ |

## PROVEDENÍ OPRAV (2026-07-21, po rozhodnutích Petra)

1. **N-8.1 ✅ PROVEDENO** — nový sdílený modul
   `src/constants/tutorialStorageKeys.ts` (bez jediného importu, takže žádná
   cyklická závislost) s všemi 10 onboarding klíči jako jediným zdrojem pravdy.
   `TutorialContext.tsx` i `XpAnimationContext.tsx` z něj nyní importují;
   duplikované string literály zmizely. V modulu je zdokumentováno, PROČ
   existuje (rename by tiše vypnul potlačení level-up modalu → dual-modal freeze).
2. **N-8.3 ✅ PROVEDENO — telemetrie smazána** — odstraněny celé soubory
   `src/services/helpAnalyticsService.ts` a `src/services/helpPerformanceMonitor.ts`
   + všech 6 volání v `HelpTooltip.tsx` (position_changed, opened,
   content_viewed, closed, content_duration, startRenderMeasurement) + osiřelé
   refy `openTimestamp` a `performanceMeasurement`. Grep po smazání = 0 zbylých
   referencí. Tooltip funguje beze změny, jen už neplýtvá CPU a zápisy do
   AsyncStorage na data, která nikdo nikdy nečetl.
3. **N-8.2** — bez zásahu (INFO).

### Verifikace

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 464 passed, 464 total (31/31 suites)
```

## Stav: HOTOVO (2026-07-21) — audit 4/4 položek ✓, N-8.1 + N-8.3 provedeny, N-8.2 ponecháno jako INFO
