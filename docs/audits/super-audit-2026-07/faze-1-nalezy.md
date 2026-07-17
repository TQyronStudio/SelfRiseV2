# Fáze 1 — nálezy (super audit 2026-07)

Datum: 2026-07-16 | Commit: `ae8149a` | Node: v24.18.0 (přes nvm; default shell má v20.20.2!)
Baseline: tsc 0 chyb (exit 0) | testy **399/399, 26/26 suites** — doslovný výstup:

```
Test Suites: 26 passed, 26 total
Tests:       399 passed, 399 total
Snapshots:   0 total
Time:        7.053 s, estimated 8 s
```

Pozn. baseline: Jest hlásí "A worker process has failed to exit gracefully…
likely caused by tests leaking due to improper teardown" — testy prošly, ale
únik timerů zapsat jako pozorování (viz nálezy).

Dílčí suite 1.1 (`xpMultiplier.loyalty.test.ts`):

```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

## Položky

### 1.1 XP Multiplier — aktivační cesty + single-writer storage

- **Kde**: `src/services/xpMultiplierService.ts` — helpery `storeActiveMultiplier`
  (:150-175), `clearActiveMultiplierStorage` (:180-189); aktivační cesty
  `activateHarmonyMultiplier` (:511), `activateInactiveUserBoost` (:1092),
  `activateAchievementComboMultiplier` (:1264),
  `activateChallengeCompletionMultiplier` (:1420).
- **Pravidlo**: Gamification-Core.md § "XP Multiplier System" (PRODUCTION FIX
  červenec 2026 — zápis výhradně přes helpery).
- **Ověřeno jak**: test suite + grep + trasování všech aktivačních cest a
  čtecí cesty.
- **Verdikt**: ✅ (s 2 poznámkami ⚠️ níže)
- **Důkaz**:
  - Test: `xpMultiplier.loyalty.test.ts` → `Tests: 12 passed, 12 total`.
  - Zápis dle flagu tam, kde se čte: `storeActiveMultiplier` píše SQLite
    `xp_multipliers` při `USE_SQLITE_GAMIFICATION` (:153-167), jinak
    AsyncStorage (:170-173); `clearActiveMultiplierStorage` čistí SQLite
    i AsyncStorage (:183-188).
  - Single-writer potvrzeno grepem `xp_multiplier_active|xp_multipliers`:
    mimo helpery zapisují jen `database/migration/gamificationMigration.ts:519`
    (jednorázová migrace — očekávané) a `marketingDemoDataService.ts:537`
    (tabulka v seznamu demo módu — posoudí Fáze 9.4). Žádný jiný zápis.
  - Všechny 4 aktivační cesty volají helper (:556, :1143, :1300, :1467).
  - Reachability všech 4 cest: Harmony ← `XpMultiplierSection.tsx:190` +
    `XpMultiplierIndicator.tsx:317`; Inactive ← `appInitializationService.ts:297`
    → `checkAndActivateInactiveUserBoost` → interně `:1202`; Combo ←
    `achievementService.ts:613` (+ :855) → `checkAndActivateAchievementCombo:1220`
    → `:1251`; Challenge ← `starRatingService.ts:346`.
  - Aplikace na XP: `gamificationService.ts:735-736` —
    `finalAmount = amount × multiplier` v `addXP`.
- **Poznámky**:
  - ⚠️ **N-1.1a (dokumentace)**: Guide i doc-comment (`xpMultiplierService.ts:142`)
    mluví o „třech aktivačních cestách", reálně existují **4** (Challenge
    Completion přes `starRatingService.ts:346` je čtvrtá, funkční). Plán fáze
    říkal také 3 → viz PD-3. Navrhnout aktualizaci guide + komentáře.
  - ⚠️ **N-1.1b (testovatelnost)**: `getActiveXPMultiplier` má Jest shortcut
    (`gamificationService.ts:2293-2296` — v testech vždy 1×). Násobení XP
    v `addXP` je tedy unit-testy NEOVĚŘITELNÉ; write→read konzistenci kryjí
    testy na úrovni XPMultiplierService, ale samotné násobení jen 🔶 device.

### 1.2 XP transakce end-to-end (addXP → SQLite → čtení zpět)

- **Kde**: `GamificationService.addXP` → tabulka `xp_transactions` →
  `getAllTransactions`/`getTransactionsByDateRange`/`getTotalXP`.
- **Pravidlo**: Gamification-Core.md § Architecture Enforcement (single
  source of truth) + metodologie krok 4 (end-to-end tok).
- **Ověřeno jak**: existující regresní suite
  `__tests__/services/gamification/SqliteConsistency.test.ts` dělá PŘESNĚ
  to, co položka žádá — reálný `GamificationService` + reálná DB přes
  `getDatabase()` (:11-12), žádné mocky: zápis přes `addXP` a okamžité
  čtení zpět přes `getAllTransactions` (:22), `getTransactionsByDateRange`
  včetně range-exclusion (:41, :53), konzistence `getTotalXP` (:66),
  `xp_daily_summary` per-source sloupce vč. case-mismatch regrese (:81-125),
  zapojení denních limitů (:140), `rollbackLastTransaction` (:168),
  `clearAllData` (:207).
- **Verdikt**: ✅
- **Důkaz** (doslovný výstup):

  ```
  Test Suites: 1 passed, 1 total
  Tests:       11 passed, 11 total
  ```

### 1.3 Event systém — všech 18 eventů z guide + reverzní kontrola

- **Kde**: viz tabulka. **Pravidlo**: Gamification-Events.md.
- **Ověřeno jak**: úplný grep `DeviceEventEmitter.emit(` + `emitAppEvent(` +
  `DeviceEventEmitter.addListener(` + `addAppEventListener(` přes `src/` +
  `app/` (bez testů); dumpy v scratchpadu, klíčová místa ověřena čtením.
- **Verdikt**: ⚠️ (eventy fungují, ale guide je na 4 místech zastaralý
  a 1 event je mrtvý — viz nálezy N-1.3a–e)

| # | Event | Emit (soubor:řádek) | Listener (soubor:řádek) | Verdikt |
|---|---|---|---|---|
| 1 | `xpGained` | gamificationService:2361; achievementService:586, :831 (+demo :1217, :1262) | XpAnimationContext:238; OptimizedXpProgressBar:127; monthlyProgressIntegration:113 | ✅ |
| 2 | `levelUp` | gamificationService:970; achievementService:599, :843 (+demo :1223) | XpAnimationContext:241; OptimizedXpProgressBar:130; monthlyProgressIntegration:125 | ✅ |
| 3 | `xpBatchCommitted` | gamificationService:611 | XpAnimationContext:240; monthlyProgressIntegration:119 | ✅ |
| 4 | `xpSmartNotification` | gamificationService:2364 | XpAnimationContext:239 | ✅ |
| 5 | `achievementQueueStarting` | **ŽÁDNÝ** | **ŽÁDNÝ** (odstraněn — komentář XpAnimationContext:199 „no longer needed with centralized ModalQueue") | ❌ mrtvý |
| 6 | `achievementUnlocked` | achievementService:1258 | AchievementContext:372; tutorialAchievementGate:99 (dynamicky, match na `achievement.id`) | ✅ |
| 7 | `multipleAchievementsUnlocked` | achievementService:1270 | AchievementContext:401 | ✅ |
| 8 | `achievementCelebrationClosed` | AchievementContext:363; ModalQueueContext:176 | TutorialContext:1676; tutorialAchievementGate:104 | ✅ (guide uvádí listenery HabitForm/GoalForm — zastaralé, viz N-1.3b) |
| 9 | `xpMultiplierActivated` | xpMultiplierService:923 (helper, volán JEN z Harmony :582); :1326 (Combo); :1494 (Challenge) | XpMultiplierSection:152 | ⚠️ guide říká BEZ LISTENERU (zastaralé); **Inactive Boost jako jediný NEemituje** (N-1.3c) |
| 10 | `monthly_progress_updated` | monthlyProgressTracker:399 (+demo :1232, :1268) | MonthlyChallengeSection:58; app/(tabs)/index.tsx:174 | ✅ |
| 11 | `monthly_challenge_completed` | monthlyProgressTracker:1544 | MonthlyChallengeSection:104 | ✅ |
| 12 | `monthly_milestone_reached` | monthlyProgressTracker:1449 | MonthlyChallengeSection:155 | ✅ |
| 13 | `star_level_changed` | starRatingService:238, :324, :647 | MonthlyChallengeSection:188 | ✅ |
| 14 | `star_progression_updated` | starRatingService:336 | žádný | ✅ reserved (dle guide) |
| 15 | `difficulty_recalculated` | starRatingService:429 | žádný | ✅ reserved (dle guide) |
| 16 | `tutorial_scroll_to` | TutorialContext:1276; TutorialOverlay:263 | GoalForm:141; HabitForm:107; app/(tabs)/index.tsx:74 | ✅ |
| 17 | `tutorial_scroll_completed` | GoalForm:151, :219; HabitForm:117, :171; index.tsx:85 | TutorialOverlay:292 | ✅ |
| 18 | `openHomeCustomization` | app/(tabs)/_layout.tsx:90 | app/(tabs)/index.tsx:98 | ✅ |

**Reverzní kontrola — eventy emitované v kódu, ale CHYBĚJÍCÍ v guide:**

| Event | Emit | Listener | Poznámka |
|---|---|---|---|
| `monthly_challenge_failed` | lifecycleManager:335 | MonthlyChallengeSection:132 | živý, nedokumentovaný |
| `monthly_challenge_challenge_generated` | dynamicky lifecycleManager:859 (+demo :1231) | MonthlyChallengeSection:88 | živý, nedokumentovaný |
| `monthly_challenge_${event}` (dynamická rodina, 10 jmen z `ChallengeLifecycleEvent`, types/gamification.ts:778) | lifecycleManager:859 | jen `…challenge_generated` | ⚠️ produkuje i `monthly_challenge_challenge_completed` / `…challenge_failed` (zdvojené „challenge"), zatímco poslouchané jsou přímé `monthly_challenge_completed`/`_failed` — matoucí duplicitní jmenný prostor, detail posoudí Fáze 3 |
| `star_level_modal_closed` | ModalQueueContext:179 | žádný (typováno v appEvents.ts:135) | bez listeneru, nedokumentovaný |
| `marketing_demo_data_loaded` / `_cleared` | demo služba :1216, :1261 | žádný nalezen | Fáze 9.4 |
| `HAPTICS_CHANGED_EVENT` | hapticsService:35 | settings.tsx:50 | ne-gamifikační, OK |
| `MARKETING_DEMO_MODE_CHANGED_EVENT` | marketingDemoModeService:15 | AdBanner:63; settings.tsx:63 | Fáze 9.4 |

- **Důkaz**: kompletní dumpy emitů (44 řádků) a listenerů v scratchpadu
  session; klíčové řádky ověřeny čtením souborů (čísla výše).

### 1.4 ModalQueue pinning invariant

- **Kde**: `src/contexts/ModalQueueContext.tsx` — `presentedIdRef` (:104-107),
  `enqueue` pinning (:141-160), de-dupe achievementů (:124-133),
  `closeCurrentModal` (:167-184).
- **Pravidlo**: invariant ze 14.7. (b125cd4) — zobrazené čelo fronty se
  nikdy nepřeřazuje; priorita řadí jen nezobrazený zbytek.
- **Ověřeno jak**: test + čtení kódu + git log.
- **Verdikt**: ✅
- **Důkaz**:
  - `modalQueueOrdering.test.ts` → `Tests: 5 passed, 5 total`.
  - Kód: `headIsPresented` gate (:156) → nový modal se řadí jen do
    `prev.slice(1)` tailu (:158-159); `presentedIdRef` se plní až po
    React commitu (useEffect :105-107), takže burst enqueues v jednom
    ticku se smí přeřadit celý (nic není na obrazovce) — přesně dle
    dokumentované sémantiky.
  - `git log --since=2026-07-14 -- src/contexts/ModalQueueContext.tsx`
    → jediný commit `b125cd4` (samotný fix). Nic pozdějšího invariant
    nezměnilo.

### 1.5 Animation consistency — všechna addXP call-sites vs. batchování

- **Kde**: `GamificationService.addXP` (:639), `shouldBatchXPAddition` (:358),
  `addXPWithBatching` (:335); call-sites viz seznam.
- **Pravidlo**: Gamification-UI.md :295 — „ALL XP popups MUST appear
  immediately without batching delays".
- **Ověřeno jak**: úplný grep `GamificationService.addXP|subtractXP|addXPWithBatching`
  přes `src/` + `app/` (bez testů) + trasování obou cest v service.
- **Verdikt**: ✅ pro uživatelský požadavek (žádný user-facing zdroj se
  nebatchuje — batching se NIKDY nespustí); ❌ nález mrtvého kódu N-1.5a.
- **Důkaz — všech 35 call-sites, každé volá PŘÍMOU cestu** (addXP/subtractXP,
  nikdy addXPWithBatching):
  - `xpMultiplierService.ts` :563, :1149, :1307, :1474 (aktivační bonusy, XP_MULTIPLIER_BONUS)
  - `achievementService.ts` :569, :813, :1156 (ACHIEVEMENT_UNLOCK)
  - `monthlyProgressTracker.ts` :1366, :1493 (MONTHLY_CHALLENGE odměny)
  - `SQLiteGoalStorage.ts` :477, :484, :504, :609, :616, :708, :715 (goal progress/completion/reverze)
  - `goalStorage.ts` (legacy) :266, :274, :299, :326, :407, :415, :501, :508
  - `SQLiteGratitudeStorage.ts` :311, :439; `gratitudeStorage.ts` (legacy) :85, :237, :1686, :1700, :1714
  - `SQLiteHabitStorage.ts` :333, :447; `habitStorage.ts` (legacy) :274, :352
  - `addXP` (:639-643) jde VŽDY přímo: komentář „Direct execution — SQLite
    is fast enough… No batching needed anymore" → `performXPAddition`;
    `triggerXPAnimation` emituje `xpGained` okamžitě pro každou transakci
    (:901 add, :1135 subtract, :1218).
- **Nález ❌ N-1.5a — mrtvý batching pipeline**: `addXPWithBatching` (:335)
  nemá ŽÁDNÉHO volajícího (grep src+app+interně). Tím je mrtvý celý řetěz:
  `shouldBatchXPAddition` (:358), `addToBatch` (:390), `commitBatch`
  (volaný jen z :435/:440), `triggerBatchedXPAnimation` (:609, jediné
  volání :549), stav `pendingBatch` (:274). Důsledek: event
  **`xpBatchCommitted` se v produkci nikdy neemituje**, ale mají na něm
  živé listenery `XpAnimationContext:240` a `monthlyProgressIntegration:119`
  — čekají na signál, který nepřijde (stejný vzorec jako „dead evaluator"
  z 3.7.). Guides (Events § xpBatchCommitted, UI § batching) popisují
  batching jako aktivní mechanismus → dokumentační drift. Datová ztráta
  NEHROZÍ (všechno XP teče přes xpGained), jde o mrtvý kód + matoucí
  dokumentaci. Rozhodnutí o smazání → Fáze 13 (pozor na
  monthlyProgressIntegration).

### 1.6 Denní limity + anti-spam (xpLimits.ts vs. guide)

- **Kde**: `src/services/gamification/xpLimits.ts` (mapa :64-93, škálování
  :99-116, validace :137-230); konstanty `src/constants/gamification.ts:97-107`.
- **Pravidlo**: Gamification-Core.md § Daily Limits & Anti-Spam + § Daily
  Limits Scale with Multipliers.
- **Ověřeno jak**: test suite + řádkové porovnání mapy s guide + grep
  vynucení distribučních pravidel.
- **Verdikt**: ✅ jádro limitů; ❌ 2 pravidla z guide nevynucená (N-1.6a);
  ⚠️ jednotková nekonzistence validace při multiplikátoru (N-1.6b).
- **Důkaz**:
  - `xpLimits.test.ts` → `Tests: 15 passed, 15 total` — včetně hraničních
    testů (trim :142, reject :155), škálování 2× (:181), rate-limitingu
    (:192) a goal anti-spamu 3/den (:87) s exempt GOAL_COMPLETION (:109).
  - Konstanty = guide: HABITS 500, JOURNAL 415, GOALS 400, ENGAGEMENT 200,
    TOTAL 1500 (constants/gamification.ts:99-105) ✓.
  - Exempt zdroje = guide: GOAL_COMPLETION, ACHIEVEMENT_UNLOCK,
    MONTHLY_CHALLENGE, XP_MULTIPLIER_BONUS, LOYALTY_MILESTONE (xpLimits.ts:81-87)
    ✓; navíc DAILY_ACTIVITY a INACTIVE_USER_RETURN (:88-89) — v guide
    nezmíněné (drobný dokumentační dluh).
  - Škálování limitů multiplikátorem: `getAdjustedDailyLimits` ×multiplier
    (:103-110); transakční počty se NEškálují (goal check :148-162 na
    neškálované konstantě) ✓ dle guide.
- **Nález ❌ N-1.6a — dvě „Limit Distribution Rules" z guide NEEXISTUJÍ
  v kódu**: „Single source maximum 80 %" (`SINGLE_SOURCE_MAX_PERCENT`,
  constants:106) a „Minimum section allocation ≥ 20 %"
  (`MIN_FEATURE_DIVERSITY_PERCENT`, constants:319) jsou definované
  konstanty s NULOVÝM použitím (grep celý src/ — jen definice). Guide je
  popisuje jako platná pravidla. → Rozhodnout: implementovat, nebo
  vyškrtnout z guide + smazat konstanty (E5 — rozhodne Petr).
- **Nález ⚠️ N-1.6b — mixní jednotky při aktivním multiplikátoru**:
  validace porovnává částku PŘED násobením (`amount`,
  gamificationService.ts:711) proti škálovaným limitům, ale denní součty
  akumulují částku PO násobení (`finalAmount`, :852, :865). Na hraniční
  transakci tak lze překročit škálovaný limit až o `amount×(mult−1)`
  (např. journal 830: stav 820 + vstup 20 → trim na 10 → uloženo 10×2=20
  → 840 > 830). Dopad malý a shora omezený, ale je to skutečná
  nekonzistence; navíc netestovatelná unit testy kvůli Jest shortcutu
  (viz N-1.1b).

### 1.7 Level výpočty — single source of truth

- **Kde**: `src/services/levelCalculation.ts` (exporty: `getXPRequiredForLevel:81`,
  `getCurrentLevel:222`, `getXPProgress:251`, `getLevelInfo:328`,
  `isLevelMilestone:471`, `validateProgressionTimeline:506`).
- **Pravidlo**: plán odkazuje na „matematický model v Gamification-Core.md"
  — ⚠️ ten tam NENÍ, viz PD-4 a N-1.7a.
- **Ověřeno jak**: testy + grep konzumentů + hledání vlastních vzorců v UI.
- **Verdikt**: ✅ kód (single source potvrzený, testy zelené);
  ⚠️ dokumentace chybí (N-1.7a).
- **Důkaz**:
  - `MathematicalModel.test.ts` + `levelProgressDisplay.test.ts` →
    `Tests: 35 passed, 35 total` (druhá suite kryje XP-bar fix ze 14.7.
    — text i bar na škále v rámci levelu).
  - Všichni UI konzumenti importují z `levelCalculation.ts`:
    `OptimizedXpProgressBar.tsx:23`, `LevelsOverviewScreen.tsx:17,:44,:50`,
    `app/(tabs)/journal.tsx:10`. Grep `Math.pow`/`×1.x` v components/screens/app
    nenašel žádný vlastní level vzorec (hity jen styling — lineHeight apod.).
- **Nález ⚠️ N-1.7a — level model není v žádném guide**: grep přes všechny
  `technical-guides*.md` (progression/formula/XP required/calculation)
  nenašel dokumentaci vzorce. Jediná specifikace je kód + testy. Navrhnout:
  doplnit sekci „Level Progression Model" do Gamification-Core.md
  (hodnoty lze vygenerovat z `generateLevelPreview:587` a
  `validateProgressionTimeline:506`).

### 1.8 Loyalty systém (loyaltyService + userActivityTracker)

- **Kde**: `src/services/loyaltyService.ts` (milníky :24-42,
  `trackDailyActivity` :119-209), `src/services/userActivityTracker.ts`,
  `src/validation/loyaltySystemValidation.ts`,
  `src/components/achievements/LoyaltyProgressCard.tsx`.
- **Pravidlo**: Gamification-Core.md (LOYALTY_MILESTONE exempt z limitů);
  loyalty-* achievementy viz Fáze 2g.
- **Ověřeno jak**: testy + trasování celého toku den→milník→achievement→XP.
- **Verdikt**: ✅ jádro (den se nedá započíst 2×, streak kotví na včerejšku,
  tok milník→achievement funguje); ⚠️/❌ 4 nálezy níže.
- **Důkaz**:
  - `userActivityTracker.test.ts` + `.baseline.test.ts` →
    `Tests: 36 passed, 36 total`; loyalty část `xpMultiplier.loyalty.test.ts`
    kryje streak kotvení a level hranice 30/100/365/1000.
  - Same-day guard: `lastActiveDate === todayStr` → return bez inkrementu
    (loyaltyService.ts:131-137). Streak: pokračuje jen pokud
    `previousActiveDate === yesterday` (:148-154).
  - Tok odměn: `appInitializationService.ts:304` → `trackDailyActivity` →
    `milestonesReached` → `AchievementService.checkLoyaltyAchievements(days)`
    (:315-320) → loyalty-* achievementy (ACHIEVEMENT_UNLOCK XP). Hodnoty
    `LOYALTY_MILESTONES.xpReward` = hodnoty v achievement katalogu
    (namátkou 75/150/1000 na first-week/month-explorer/year-legend —
    plných 10/10 ověří Fáze 2g; jde o DUPLICITNÍ zdroj týchž čísel).
  - `LoyaltyProgressCard` čte přes `LoyaltyService.getLoyaltyData()` (:50)
    — stejný store, jaký plní tracker ✓ (single source: AsyncStorage).
- **Nález ⚠️ N-1.8a — `XPSourceType.LOYALTY_MILESTONE` nemá producenta**:
  žádné `addXP` s tímto zdrojem v celém kódu (jen exempt záznam, default
  popis a nulové mapy). Odměny reálně tečou přes ACHIEVEMENT_UNLOCK.
  Zdroj je vestigiální — guide ho přitom vede jako aktivní. Sladit
  (vyškrtnout z guide, nebo začít používat).
- **Nález ❌ N-1.8b — mrtvé SQLite tabulky `loyalty_state` a
  `daily_activity_log`**: vytváří je `database/init.ts:430,:441`, plní
  jednorázová migrace (`gamificationMigration.ts:583`) a demo služba
  (:868, :843) — ale ŽÁDNÝ produkční kód je nečte (loyaltyService je
  čistý AsyncStorage — 0 hitů FEATURE_FLAGS/getDatabase; jediný „hit"
  v gamificationService:2112 je zastaralý KOMENTÁŘ, dotaz čte jen
  `xp_daily_summary`). Nastražený split-brain: kdokoliv v budoucnu
  přepne čtení na SQLite, dostane zmražená data z migrace. → Fáze 13
  (rozhodnout: dopojit, nebo zrušit tabulky) + pozor pro Fázi 9.4
  (demo píše do tabulky, kterou UI nečte).
- **Nález ⚠️ N-1.8c — `loyaltySystemValidation.ts` nikdo neimportuje**
  (grep src+app: 0 použití mimo vlastní soubor) — mrtvý kód → Fáze 13.
- **Poznámka pro Fázi 2g**: duplicitu čísel LOYALTY_MILESTONES ↔ katalog
  ověřit 10/10 a zvážit jeden zdroj pravdy.

### 1.9 Velikost gamificationService.ts (N28 — informativní pro Fázi 13)

- **Ověřeno jak**: `wc -l`.
- **Verdikt**: ✅ zapsáno.
- **Důkaz**: `gamificationService.ts` **3388 řádků** (při auditu 6/10:
  3547+; guide Core říká ~3400 a popisuje probíhající extrakci modulů —
  `xpLimits.ts` a `levelUpEvents.ts` už extrahované). Kontext: 
  `monthlyProgressTracker.ts` 2513, `achievementService.ts` 1657,
  `xpMultiplierService.ts` 1579. Mrtvý batching pipeline (N-1.5a,
  ~250 ř.) je kandidát na první krok zmenšení.

## Nálezy k opravě (číslované, s prioritou)

1. **[STŘEDNÍ] N-1.5a** — mrtvý XP batching pipeline vč. eventu
   `xpBatchCommitted`, na který čekají 2 živé listenery (detail v 1.5).
   Návrh: smazat pipeline + listenery + aktualizovat Events/UI guides
   (rozhodnutí ve Fázi 13, tady jen zapsáno).
2. **[STŘEDNÍ] N-1.8b** — mrtvé tabulky `loyalty_state` +
   `daily_activity_log` = nastražený split-brain (detail v 1.8).
3. **[STŘEDNÍ] N-1.6a** — pravidla „80 % single source" a „20 % minimum
   allocation" z guide neexistují v kódu (jen mrtvé konstanty).
   Rozhodnout: implementovat vs. vyškrtnout z guide (E5 → Petr).
4. **[NÍZKÁ] N-1.6b** — mixní jednotky validace limitů při aktivním
   multiplikátoru (překročení limitu až o amount×(mult−1) na hraně).
5. **[NÍZKÁ] N-1.3a (❌ mrtvý event)** — `achievementQueueStarting`:
   guide ho vede jako živý, v kódu nemá emit ani listener. Vyškrtnout
   z guide.
6. **[NÍZKÁ] N-1.3b/c** — guide drift eventů: `achievementCelebrationClosed`
   listenery (HabitForm/GoalForm → dnes TutorialContext+gate);
   `xpMultiplierActivated` „bez listeneru" (má listener) a Inactive Boost
   jako jediná cesta neemituje; + 7 nedokumentovaných eventů (tabulka v 1.3).
   Aktualizovat Gamification-Events.md vč. počtu (nadpis „16" vs realita).
7. **[NÍZKÁ] N-1.7a** — level progression model není v žádném guide.
8. **[NÍZKÁ] N-1.8a** — vestigiální `XPSourceType.LOYALTY_MILESTONE`.
9. **[NÍZKÁ] N-1.8c** — nepoužívaný `loyaltySystemValidation.ts`.
10. **[INFO] N-1.1a** — „3 aktivační cesty" v guide/komentáři → reálně 4.
11. **[INFO] N-1.1b** — násobení XP multiplikátorem v `addXP` je kvůli
    Jest shortcutu neověřitelné unit testy (jen 🔶 device).
12. **[INFO]** — Jest warning „worker process has failed to exit
    gracefully" na konci plné suite (únik timerů v testech; testy zelené).
13. **[VYŘEŠENO 2026-07-16] N-1.7b — levelová křivka zploštěna** *(objeveno
    při opravě N-1.7a)* — `validateProgressionTimeline()` vracela
    `isValid: false`; level 100 vyžadoval 612,5 M XP (≈ 1 400 let i pro
    max. uživatele). **Rozhodnutí Petra: změkčit, cíl level 100 ≈ 5 let.**
    Prověrka ukázala, že úprava konstant nestačí (i s multiplikátory 1,0
    vychází ~5 M XP ≈ 11 let) → vyměněn vnitřek vzorce:
    levely 1–10 beze změny (historická lineární řada), levely 11+
    mocninná křivka `cum(L) = cum(10) × (L/10)^2.66`
    (`PROGRESSION_EXPONENT` v constants). Výsledek ověřen reálným kódem:
    level 100 = 1 999 656 XP → Super user (1200/den) **4,6 roku** ✓;
    Power 1 rok = L48 (pravidlo ≤ 50 ✓); Casual 1 rok = L25 (≥ 5 ✓);
    `validateProgressionTimeline()` → **`isValid: true`, issues: []**.
    Bonus: zmizely oba dokumentované zlomy křivky (skok 10→11, propad
    50→51) a s nimi mrtvá fázová mašinerie (`LevelRequirement`,
    `calculateEndOfPhaseXP`, 3 fázové multiplikátory, nedosažitelná
    `master` větev switche). Dopad na existující uživatele: jednorázový
    tichý skok levelu nahoru (XP se nemění) — před ostrým vydáním
    přijatelné (jen TestFlight). Tabulka v Core guide přegenerována.
    Pozn. pro Fázi 2f: achievementy za vysoké levely jsou nyní reálně
    dosažitelné — zkontrolovat, že jejich prahy dávají s novou křivkou
    smysl.

## PLAN-DISCREPANCY

- **PD-1**: Plán uvádí stav `main`@`1e56d63`, 393/393 testů (25/25 suites).
  Realita při exekuci: HEAD `ae8149a` (o 1 commit novější — „Fix Home Peak
  Day"), 399/399 testů (26/26 suites). Bez dopadu na scope fáze; audit běží
  proti `ae8149a`.
- **PD-2**: Plán (sekce „Jak spustit fázi") předpokládá `node --version` ≥ 22.5
  v shellu. Default node v shellu je **v20.20.2**; testy je nutné pouštět
  explicitně přes `PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"`.
  Doporučení: přidat `.nvmrc` s `24` (návrh opravy, zatím neprovedeno — E1).
- **PD-3**: Plán 1.1 mluví o „všech 3 cestách aktivace multiplikátoru" —
  reálně existují **4** (i Challenge Completion, `starRatingService.ts:346`).
  Všechny 4 auditované, viz 1.1.
- **PD-4**: Plán 1.7 odkazuje na „matematický model v Gamification-Core.md"
  — model v žádném guide není (viz N-1.7a). Porovnáno proti testům
  (`MathematicalModel.test.ts`) a interní konzistenci kódu.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 9 (1.1–1.9) | 9 (1.1–1.9) | ✓ |

Doplňkové kontrolní součty: eventová tabulka 18/18 jmen z plánu + 7
nedokumentovaných z reverzní kontroly; addXP call-sites 35/35
klasifikováno (vše přímá cesta).

## Rozhodnutí Petra + plán oprav (2026-07-16)

Obecný princip (Petr, doslova): **„Cílem je čistá aplikace — dokumentace
musí sedět s tím, co se reálně používá, a nepoužívaný kód je k ničemu,
jen může dělat paseku (AI se ho může omylem chytit)."**

| Nález | Rozhodnutí | Jak se oprava provede |
|---|---|---|
| **N-1.6a** (pravidla 80 % / 20 %) | ❌ **NEIMPLEMENTOVAT — vyškrtnout** (revize rozhodnutí 2026-07-16: Petr potvrdil, že pro neomezené zdroje — trofeje apod. — pravidlo platit nemá, a pro limitované zdroje je matematicky redundantní: 80 % z 1500 = 1200 XP > všechny per-source stropy ≤ 500) | Vyškrtnout „Limit Distribution Rules" z `Gamification-Core.md` a smazat mrtvé konstanty `SINGLE_SOURCE_MAX_PERCENT` (constants:106) a `MIN_FEATURE_DIVERSITY_PERCENT` (constants:319) — princip čisté aplikace. |
| **N-1.6b** (mixní jednotky při multiplikátoru) | ❌ **NEŘEŠIT** (detail, ve prospěch uživatele, nezneužitelné) | Bez akce; ponecháno ve zprávě pro budoucí referenci. |
| **N-1.3a** (mrtvý event `achievementQueueStarting` v guide) | ✅ **OPRAVIT** | Vyškrtnout sekci z `Gamification-Events.md` (event nemá emit ani listener; nahrazen ModalQueue systémem). |
| **N-1.3b/c** (guide drift + 7 nedokumentovaných eventů) | ✅ **OPRAVIT** | Aktualizovat `Gamification-Events.md` podle tabulky v 1.3: opravit počet v nadpisu, opravit listenery `achievementCelebrationClosed` (TutorialContext + gate, ne HabitForm/GoalForm), zapsat listener `xpMultiplierActivated`, dopsat 7 nedokumentovaných eventů vč. dynamické rodiny `monthly_challenge_${event}`. Pozn.: případné DOPLNĚNÍ emitu do Inactive Boost cesty je změna kódu — nerozhodnuto, zatím jen zdokumentovat realitu. |
| **N-1.7a** (chybějící level vzorec v dokumentaci) | ✅ **OPRAVIT** | Doplnit sekci „Level Progression Model" do `Gamification-Core.md` — tabulku vygenerovat z `generateLevelPreview()` + `validateProgressionTimeline()`, ať dokumentace vzniká z kódu (jediný zdroj pravdy). |
| **N-1.8a** (nepoužívaný zdroj `LOYALTY_MILESTONE`) | ✅ **SMAZAT** (čistá aplikace) | Chirurgicky odstranit `XPSourceType.LOYALTY_MILESTONE` z kódu (enum + mrtvé záznamy v mapách xpLimits/gamificationService/demo) + vyškrtnout z guide. Po každém kroku `tsc` + celá suite. Pozor: NEsahat na funkční tok odměn přes achievementy. |
| **N-1.5a** (mrtvý batching pipeline) | ✅ **SMAZAT** — potvrzeno principem čisté aplikace | Provedení ve **Fázi 13** dle plánu (po jednom: pipeline → listenery `xpBatchCommitted` v XpAnimationContext a monthlyProgressIntegration → sekce v Events/UI guides; každý krok tsc + testy). |
| **N-1.8b** (mrtvé tabulky `loyalty_state`, `daily_activity_log`) | ✅ **ZRUŠIT** — potvrzeno principem čisté aplikace | Provedení ve **Fázi 13**: odstranit CREATE z `init.ts`, zápisy z migrace a demo služby + DROP migrace pro existující instalace; nejdřív ověřit ve Fázi 9.4, že demo mód na tabulkách nezávisí. |
| **N-1.8c** (nepoužívaný `loyaltySystemValidation.ts`) | ✅ **SMAZAT** | Ve Fázi 13 (grep-ověření + smazání souboru). |
| **N-1.1a** (guide/komentář „3 cesty" → 4) | ✅ **OPRAVIT** | Součást aktualizace guides (Core § Multiplier System + komentář v `xpMultiplierService.ts:142`). |
| **N-1.1b**, INFO položky | Bez akce | N-1.1b zařadit do společného device sezení (🔶). |

**Pořadí provedení schválených oprav** (mimo ty odložené do Fáze 13):
1. Dokumentační opravy + úklid konstant (N-1.3a, N-1.3b/c, N-1.7a, N-1.1a,
   N-1.6a — vyškrtnutí z guide + smazání 2 mrtvých konstant) — bez rizika.
2. N-1.8a (smazání LOYALTY_MILESTONE) — chirurgicky, tsc + testy po každém souboru.

## Provedení oprav (2026-07-16, tatáž session)

Všechny schválené opravy mimo Fázi 13 PROVEDENY, po dávkách dle plánu:

**Dávka 1 — dokumentace + konstanty** ✅
- N-1.3a: `achievementQueueStarting` vyškrtnut z Events guide (seznam,
  payload sekce, handler) + poznámka o nahrazení ModalQueue.
- N-1.3b/c: Events guide přepsán podle auditní tabulky — nový nadpis
  s reálnými počty, opravené listenery `achievementCelebrationClosed`,
  listener `xpMultiplierActivated` + poznámka o neemitujícím Inactive
  Boost, doplněno 5 přímých monthly eventů + dynamická rodina
  `monthly_challenge_${event}` + 4 star eventy + 4 systémové eventy;
  `xpBatchCommitted` označen jako mrtvá větev (odkaz na N-1.5a/Fázi 13)
  v seznamu, patternech i payload sekci.
- N-1.1a: „3 aktivační cesty" → 4 v Core guide (:151)
  i v komentáři `xpMultiplierService.ts:142`.
- N-1.6a: „Limit Distribution Rules" v Core guide nahrazeny záznamem
  o zrušení s odůvodněním; smazány **3** mrtvé konstanty (kromě dvou
  plánovaných i objevený duplikát `MAX_SINGLE_FEATURE_PERCENT`,
  constants:320 — 0 použití, stejná rodina).
- N-1.7a: do Core guide přidána sekce „Level Progression Model" —
  fáze, milníky, tabulka hodnot vygenerovaná z `generateLevelPreview(100)`
  (dočasným testem, po použití smazán), známé vlastnosti křivky.
  Vedlejší objev → nový nález N-1.7b (viz seznam).
- Ověření dávky 1: tsc exit 0; `npm test` → 26/26 suites, 399/399.

**Dávka 2 — smazání `XPSourceType.LOYALTY_MILESTONE`** ✅
- Odstraněno 6 referencí: enum `types/gamification.ts:26`, exempt mapa
  `xpLimits.ts:87`, nulové mapy `gamificationService.ts:2271` +
  `marketingDemoDataService.ts:498`, default popis
  `gamificationService.ts:2400`, test očekávání `xpLimits.test.ts:48`
  (nahrazeno `DAILY_ACTIVITY` — také exempt zdroj).
- NEdotčeno (záměrně): pole `LoyaltyService.LOYALTY_MILESTONES`
  (funkční definice milníků pro achievementy) a komentář
  v `loyaltySystemValidation.ts` (celý soubor se maže ve Fázi 13).
- Žádné uložené transakce se zdrojem `loyalty_milestone` nemohou
  existovat (zdroj nikdy neměl producenta) → bez datové migrace.
- Ověření dávky 2: tsc exit 0; `npm test`:

```
Test Suites: 26 passed, 26 total
Tests:       399 passed, 399 total
```

**Dávka 3 — rebalance levelové křivky (N-1.7b, rozhodnutí Petra:
„level 100 cca za 5 let")** ✅
- `levelCalculation.ts`: `calculateXPForSpecificLevel` přepsán — L≤10
  původní lineární vzorec, L≥11 mocninná křivka kotvená na cum(10)
  (kontinuita exaktní); smazána mrtvá fázová mašinerie
  (`getPhaseBaseXP`, `getPhaseMultiplier`, `calculateEndOfPhaseXP`,
  nedosažitelná `master` větev); `getLevelPhase` zjednodušen na label.
- `constants/gamification.ts`: + `PROGRESSION_EXPONENT: 2.66`
  (s kalibračním komentářem); − `QUADRATIC/EXPONENTIAL/MASTER_MULTIPLIER`,
  − `MASTER_PHASE_START` (nepoužívané).
- `types/gamification.ts`: − interface `LevelRequirement` (jediný
  konzument byla smazaná mašinerie).
- Core guide: přegenerovaná tabulka + tabulka dosahů dle typu uživatele
  + přepsané vlastnosti křivky.
- Ověření: tsc exit 0; `npm test` → 26/26 suites, 399/399 (testy jsou
  relační — hranice levelů, ne zafixované hodnoty křivky);
  `validateProgressionTimeline()` reálným kódem → `isValid: true`.

**Odloženo dle rozhodnutí**: N-1.5a, N-1.8b, N-1.8c → Fáze 13;
N-1.6b → neřeší se.

## Stav: HOTOVO (audit + všechny schválené opravy včetně rebalance křivky)

Otevřené zůstává: položky pro Fázi 13, device položka 🔶 N-1.1b
(společné device sezení). Pro Fázi 2f: ověřit prahy level-achievementů
proti nové křivce.
