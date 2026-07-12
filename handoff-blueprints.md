# Handoff Blueprints — zbývající práce (stav k 2026-07-11)

> 🆕 **Monthly Challenges per-šablonová prověrka (11.7.)**: 2 MAJOR + 2 minor nálezy
> s přesnými recepty → **@monthly-challenge-fix-plan.md** (kalendář mrtvý pro
> odvozené klíče; Progress Champion počítá události místo dnů). Udělat PŘED vydáním.

Tento dokument předává kontext a přesné pracovní postupy pro zbývající úkoly.
Psáno tak, aby je zvládl kterýkoliv model/vývojář bez znovu-objevování souvislostí.

**Zlaté pravidlo projektu**: chirurgické změny, po každé změně `npx tsc --noEmit`
(0 chyb) + `npx jest` (aktuálně **324/324, 19 suit** — každý pád = STOP a diagnóza).
Před prací na oblasti VŽDY přečti příslušný `technical-guides:*.md`.

**Release-blocker test suity** (pád = mrtvá funkcionalita v produkci, nikdy neignorovat):
- `monthlyProgressTracker.trackingKeys.test.ts` (16) — každý test = jeden typ měsíční výzvy
- `sqliteGratitudeStorage.streakDebt.test.ts` (20) — ochrana streaků uživatelů
- `achievementEvaluation.test.ts` (89) — jeden test na KAŽDÝ z 78 achievementů
- `xpMultiplier.loyalty.test.ts` (12) — multipliery skutečně násobí, loyalty milníky
- `date.timezone.test.ts` (18) — timezone korektnost

---

## 1. PŘED VYDÁNÍM — runtime ověření na zařízení (~2 h, žádný kód)

Statická analýza a testy jsou hotové; tohle vyžaduje ruce a telefon:

- [ ] **XP Multiplier**: aktivuj multiplier (debug tools / 7denní Harmony streak) →
      countdown se zobrazí a XP za akce se viditelně násobí (do 2026-07-03 to byl no-op!)
- [ ] **Monthly Challenge progress**: splň návyk s aktivní výzvou → % na kartě výzvy se pohne
- [ ] **Debt gate**: nech streak zmrznout (vynech den) → pokus o zápis v Journalu
      MUSÍ přesměrovat na Home s otevřeným warm-up modalem; zaplať 1 reklamu →
      streak pokračuje (15 → 16 po dokončení dne)
- [ ] **LogBox/metro**: v dev buildu ověřit, že po redukci suppressů nic nefllooduje
      konzoli (pokud ano → vrátit KONKRÉTNÍ string, nikdy plošný filtr)
- [ ] **journal-history**: normální pohled + vyhledávání + edit/delete (po FlatList přepisu)
- [ ] `npx expo install --check` lokálně (sandbox neměl přístup k registru)
- [ ] Android 15 edge-to-edge: vizuálně zkontrolovat spodní AdBanner vs. gesture bar

## 2. Crashlytics ✅ KÓDOVÁ ČÁST HOTOVA (2026-07-06)

Provedeno: balíček + plugin + firebase.json (auto-collection OFF), bezpečný wrapper
`crashReportingService.ts` (PRAVIDLO: nikdy neimportovat RNFB crashlytics přímo),
enable po UMP flow v `adConsentService`, 4 strategická `recordError` místa.
Kompletní pravidla + zbývající kroky: `technical-guides:Crashlytics.md`.

**Zbývá (Petr/zařízení)**: `npx expo prebuild --clean` + build → `testCrash()`
ověření v Firebase Console → privacy dokumenty (Privacy Policy odstavec na webu,
App Store App Privacy +Diagnostics, Play Data Safety +Crash logs).

## 3. Achievements — hloubkový audit ✅ HOTOVO (2026-07-03)

Provedeno — nalezeno a opraveno **35+ mrtvých podmínek** (~polovina katalogu se nikdy
nemohla odemknout): ⭐🔥👑 countery bez handleru (21), streak source name mismatch (12),
percentage placeholder, chybějící bonus-streak kalkulátor. Detail:
implementation-history.md → „Achievements Dead Evaluator Repair". Regresní síť:
`achievementEvaluation.test.ts` (89 testů — 1 na každý achievement; nový source bez
handleru = červený test pojmenovaný po achievementu, by design).

**Zbývá runtime**: odemknout achievement na zařízení (např. First Star — 1 bonus
záznam) a ověřit celebration modal + XP připsání.

## 4. N27 — smazání legacy AsyncStorage vrstvy (~5 000 ř.) — AŽ PO TELEMETRII

**Blokováno daty**: Firebase event `sqlite_migration_state` musí ukázat, že uživatelská
báze běží čistě na SQLite (`legacy_xp_store_present: 0`, `sqlite_flags_enabled: 5`).
Kontrola: Firebase Console → Analytics → Events, min. 2–4 týdny po vydání.

**Pak**: smazat `gratitudeStorage.ts` (legacy část), `habitStorage.ts`, `goalStorage.ts`
legacy větve, AsyncStorage větve v `gamificationService.ts` (všechny
`if (FEATURE_FLAGS.USE_SQLITE_*)` else-větve), pak flagy samotné. Po každém souboru
tsc + testy. POZOR: `getGratitudeStorageImpl()` v featureFlags.ts používá GratitudeInput.

## 5. N28 — rozdělení GamificationService ✅ ZAHÁJENO (2026-07-06), 2 moduly hotové

Hotovo: `gamification/xpLimits.ts` (PURE pravidla limitů/anti-spamu + 15 unit
testů) a `gamification/levelUpEvents.ts` (level-up event store). God-object
3 776 → 3 379 ř. Fasáda zachována — žádný konzument se nezměnil.

**Závazný recept + mapa zbývajících modulů (pořadí, řádky, pasti):**
`technical-guides:Gamification-Core.md` → sekce „N28 — Postupné rozdělení".
Klíčové: pure design kde to jde (data parametry, I/O ve fasádě), modul nikdy
neimportuje gamificationService, jeden modul = tsc + celá suita = jeden commit,
chování se při extrakci NIKDY nemění (bugy dokumentuj zvlášť — viz dokumentovaný
latentní split-brain v levelUpEvents: zápis SQLite / čtení AsyncStorage, dnes
bez konzumenta, sjednotit s N27).

## 6. N31 — XP mimo storage vrstvu — po vydání, s rozmyslem

`SQLiteHabitStorage.ts:333` volá `GamificationService.addXP` (obrácená závislost,
příčina require() hacků). Cíl: doménová operace `completeHabit()` volá storage
i gamifikaci vedle sebe. RIZIKO: přesun musí zachovat přesné XP hodnoty a pořadí
eventů (Monthly Challenges na nich závisí — viz trackingKeys testy). Dělat až
s zelenou test suitou jako sítí.

## 7. Sprint 4 — Brand & Juice (design, 1–2 týdny) — nezávislé na kódu výše

Viz `production-audit-2026-06-10.md` N15/N17/N18 + Sprint 4 blueprint. Pořadí dle
poměru cena/výkon: (1) SFX pack + vypínač (expo-audio, 5–10 krátkých zvuků),
(2) „Midnight" dark brand theme — pozadí `#07051A`, surface `#100C2A`, primary
`#6366F1`, akcent `#22D3EE` — jako feature-flag theme, default přepnout až po
vizuální kontrole všech obrazovek, (3) Lottie oslavy (level-up/achievement/streak),
(4) `<EmptyState>` komponenta. POZOR: Typography je záměrně bez barev (červenec 2026)
— barvy VŽDY z `useTheme()`.

## 8. Meta Ads část B/C — custom eventy (Petr zatím jede organiku, peníze později)

Viz projectplan.md → „Meta Ads & Marketing Analytics Integration". Část B (Firebase
custom eventy) je nezávislá a bezpečná; Část C (Meta SDK) blokována externě
(App ID + Client Token). Část B má hodnotu i pro ORGANICKÝ marketing — retenční
data ukážou, co v appce funguje, ještě před placenými kampaněmi.

### 🗺️ Mapa trigger míst (sepsáno 2026-07-06 s plným kontextem po auditech)

**Nejdřív infrastruktura (B1):** `src/services/analyticsService.ts` — vzor podle
`crashReportingService.ts`: lazy/safe wrapper (no-op v Jest), type-safe union event
names, interně volá `FirebaseAnalytics.logEvent` (stejný modul jako telemetrie v
`appInitializationService.logStorageTelemetry`, ř. ~170 — tam je vidět require vzor).
„First"-eventy ochránit proti duplicitám AsyncStorage flagem
(`analytics_sent_<event>` → jednou a dost). Nikdy nevyhazovat výjimky.
POZOR: netriggerovat při marketing demo mode (guard přes `isMarketingDemoModeEnabled`).

**Tier 1 — Acquisition:**
| Event | Místo |
|---|---|
| `complete_onboarding` | `TutorialContext.tsx` → `markTutorialCompleted()` (ř. ~630; dispatchuje `COMPLETE_TUTORIAL`) |
| `create_first_habit` | `HabitsContext` → create akce po úspěchu; „first" = počet návyků po vytvoření === 1 |
| `complete_first_habit` | `HabitsContext.toggleCompletion` success path; „first" přes AsyncStorage flag |
| `journal_first_entry` | `GratitudeContext.createGratitude` po `storage.create()`; „first" = `getTotalEntryCount() === 1` |

**Tier 2 — Retention:**
| Event | Místo |
|---|---|
| `streak_7_days` / `streak_30_days` | `SQLiteGratitudeStorage.calculateAndUpdateStreak` — těsně před `updateStreak(updatedStreak)`: fire když `savedStreak.currentStreak < N && finalCurrentStreak >= N` (přesně tam, kde se streak počítá — žádné jiné místo není spolehlivé) |
| `goal_completed` | `SQLiteGoalStorage` — 2 místa, kde se přiděluje `XPSourceType.GOAL_COMPLETION` XP (ř. ~503 a ~706 — completion přes progress i přímé dokončení) |
| `monthly_challenge_completed` | `MonthlyProgressTracker.completeMonthlyChallenge` — hned za `GamificationService.addXP(totalXP, …)`; params: `star_level`, `category` |
| `achievement_unlocked` | `achievementService.ts` — po `AchievementStorage.storeUnlockEvent(...)` vrátí `true` (3 call-sites: ř. ~523, ~766, ~1121 — storeUnlockEvent je idempotentní, `wasUnlocked === true` = skutečně nový unlock); param `achievement_id` |

**Tier 3 — Monetization:**
| Event | Místo |
|---|---|
| `rewarded_ad_completed` | `adService.showRewardedAd()` — v místě, kde se nastavuje `rewarded: true` (JEDINÝ choke-point pro všechny rewarded placementy; ne v GratitudeStreakCard, tam by unikly budoucí placementy) |

**Verifikace (B5):** dev build → projít tutorial, založit návyk, zapsat entry →
Firebase Console → DebugView (`adb shell setprop debug.firebase.analytics.app
com.petrturek.selfrise` na Androidu). Pak `technical-guides:Marketing-Analytics.md`
(část D projectplanu).

## 9. N8 — Typovaný event bus ✅ ZÁKLAD HOTOV (2026-07-06), migrace postupná

Vytvořen `src/utils/appEvents.ts` — typovaná fasáda nad DeviceEventEmitter
(kompletní `AppEvents` mapa všech ~20 eventů + payload typy). Pravidla
v technical-guides.md → „Typed Event Bus". Zmigrováno: MonthlyChallengeSection
(6 listenerů); odstraněn mrtvý `challengeCompleted` listener + duplicitní
completion modal z Home (nikdo ho neemitoval — přesně bug třída, kterou bus řeší).

**Zbývá (postupně, kdykoliv se souboru dotkneš)**: emit místa v
`gamificationService` (xpGained/levelUp/xpBatchCommitted),
`monthlyProgressTracker` (EVENTS konstanty), `starRatingService`, listenery
v XpAnimationContext, AchievementContext, HomeScreen widgetech,
XpMultiplierSection, GratitudeStreakCard. Vzor: import `addAppEventListener`/
`emitAppEvent`, stejné stringy, stejný kanál — nulové runtime riziko.

## ⚠️ Nebezpečné zóny (nauč se z historie bugů)

1. **Datumové klíče**: NIKDY `new Date().toISOString().split('T')[0]` (UTC!) —
   vždy `today()` z `utils/date`. NIKDY `new Date(dateString + 'T00:00:00.000Z')` —
   vždy `parseDate()`. (3× opravováno: N4, tracker, streaky.)
2. **Early returny v debt/streak logice**: guide `technical-guides:My-Journal.md`
   → „Debt Gate" + „CRITICAL IMPLEMENTATION WARNINGS". Dvakrát způsobily tichou
   destrukci dat.
3. **Feature-flag větve**: každá změna v SQLite větvi musí zvážit legacy větev
   (dokud existuje) — příčina split-brain bugu N1.
4. **Nové tracking keys / XP zdroje**: musí mít case v `getRelevantRequirements`
   I v `calculateProgressIncrement` (monthlyProgressTracker) + i18n klíč + test
   v trackingKeys suite. Komplexní (derived) klíče navíc do `COMPLEX_TRACKING_KEYS`.
5. **Streak stav**: zápis JEN přes `storage.updateStreak()` (SQLite). Jakýkoliv
   `BaseStorage.set(STORAGE_KEYS.GRATITUDE_STREAK, …)` je tichý no-op (bug 2026-07-03).
6. **Aktivní multiplier**: zápis JEN přes `storeActiveMultiplier()` /
   `clearActiveMultiplierStorage()` v xpMultiplierService. Přímý AsyncStorage zápis
   je tichý no-op — čtení jde do SQLite `xp_multipliers` (bug 2026-07-03; TŘETÍ
   split-brain v projektu — při práci s flag-based storage vždy ověř, že write
   a read cesta míří do stejného úložiště).
7. **XP source stringy**: vždy enum hodnota (`XPSourceType.X` = lowercase), nikdy
   název konstanty jako string ('XP_MULTIPLIER_BONUS' ≠ 'xp_multiplier_bonus').
8. **Dynamic import**: v services používej `require('…') as typeof import('…')`,
   ne `await import()` — dynamic import v Jest VM hází výjimku a kód tiše padá
   do catch fallbacků (netestovatelné cesty).
