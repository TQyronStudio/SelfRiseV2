# SelfRise — Produkční audit (2026-06-10)

**Auditor:** Claude (role: senior tech lead / architekt s 5letým výhledem údržby)
**Rozsah:** Kompletní codebase (262 TS/TSX souborů v `src/`, ~120 000 řádků), konfigurace, závislosti, dokumentace.
**Pravidlo:** Žádné změny kódu nebyly provedeny. Vše níže je analýza a doporučení.

> **Rozlišení fakt vs. domněnka:** Každý nález je označen buď ✅ (ověřeno přímo v kódu — uvádím soubor a řádek), nebo 🔶 (domněnka/předpoklad — vyžaduje ověření, typicky runtime test).

---

## 1. Executive Summary

1. **Skutečný stack je Expo SDK 55, ne 53.** `package.json`: `expo ~55.0.11`, RN 0.83.4, React 19.2.0, New Architecture povinná. Zadání auditu i řada interních komentářů (metro.config.js, projectplan) mluví o SDK 53 — dokumentace zaostává za realitou o dvě SDK verze. ✅

2. **Nejzávažnější technický nález: „split-brain" XP transakcí.** Zápisy XP transakcí jdou do SQLite, ale všechna čtení (`getAllTransactions`, `getTransactionsByDateRange`) jdou ze staré AsyncStorage. Achievementy, baseline výpočty a rollback tedy pracují s daty zamrzlými v okamžiku migrace. ✅ (detail v sekci 3.1)

3. **V produkčním entry pointu je importovaná debug utilita, která umí DROPnout tabulky cílů** (`dropGoalsTables`, vystavená globálně). Soubor sám o sobě říká „DELETE THIS FILE". ✅

4. **Jádro je na sólo vývojáře nadprůměrně robustní:** ACID transakce v SQLite, prioritní fronta modálů (ModalQueue), batching XP eventů, čisté odhlašování listenerů, lokální notifikace bez backendu, striktní TypeScript (`strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`) a produkční kód prochází typecheckem bez chyb. To je solidní inženýrský základ. ✅

5. **Codebase nese těžký „migrační batoh":** duplicitní legacy AsyncStorage + SQLite implementace všech úložišť (~5 000 řádků duplicit), mrtvé služby (productionMonitoring 686 ř., optimizedStorage 517 ř., prázdný gamificationCache, nepoužité social komponenty), 1 201 výskytů `console.log`, dokumentační soubory v rootu repa. ✅

6. **Design je funkční, ne světový.** Brand identita (deep navy `#07051A`, indigo/purple/cyan) existuje jen ve splash screenu a ikoně. Uvnitř appky běží default light theme s iOS systémovou modrou `#007AFF`. Odměnové momenty (level-up, achievement) jsou postavené na RN core Animated s hardcoded barvami — funkční, ale ne „juicy" jako u Duolinga/Fabulous. ✅

7. **Upřímný verdikt:** SelfRise je dnes funkčně bohatá, technicky slušně postavená appka v **top ~20–25 % kategorie**, ale od top 0,1 % ji dělí (a) datová integrita gamifikace (bod 2), (b) vizuální identita a kvalita odměnových momentů, (c) úklid migračního dluhu. Dobrá zpráva: nic z toho nevyžaduje backend ani tým — vše je v dosahu jednoho člověka v řádu týdnů, ne let.

---

## 2. Mapa architektury a datového toku

### 2.1 Vrstvy

```
┌─────────────────────────────────────────────────────────────┐
│ app/ (Expo Router v7)                                       │
│  (tabs): index(Home) | habits | journal | goals | settings  │
│  stack: achievements, journal-history/stats, habit-stats,   │
│         goal-stats, levels-overview, reorder-habits         │
├─────────────────────────────────────────────────────────────┤
│ src/contexts (React Context + useReducer)                   │
│  Theme → App → ModalQueue → XpAnimation → Habits →          │
│  Gratitude → Goals → Achievement → HomeCustomization        │
│  (RootProvider.tsx — 9 vnořených providerů)                 │
├─────────────────────────────────────────────────────────────┤
│ src/services (statické třídy / singletony, ~30 služeb)      │
│  GamificationService (3 547 ř.) · AchievementService ·      │
│  MonthlyChallengeService · MonthlyProgressTracker ·         │
│  XpMultiplierService · UserActivityTracker · LoyaltyService │
│  · AdService · NotificationScheduler · …                    │
├─────────────────────────────────────────────────────────────┤
│ Úložiště (hybrid, řízeno src/config/featureFlags.ts)        │
│  SQLite (expo-sqlite, WAL): journal, habits, goals,         │
│    challenges, xp_state, xp_transactions, xp_daily_summary  │
│  AsyncStorage (legacy + drobnosti): XP-by-source, level-up  │
│    history, loyalty, theme, jazyk, demo-mode, achievementy  │
├─────────────────────────────────────────────────────────────┤
│ Komunikační sběrnice: DeviceEventEmitter (27 souborů)       │
│  eventy: xpGained, xpBatchCommitted, levelUp,               │
│  monthly_progress_updated, challengeCompleted, tutorial_*…  │
├─────────────────────────────────────────────────────────────┤
│ Externí: Firebase Analytics (+ATT), AdMob (UMP consent,     │
│  bannery + rewarded), expo-notifications (jen lokální)      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Klíčové datové toky (ověřeno v kódu)

**Habit check-in:** `HomeScreen/HabitsScreen → HabitsContext.toggleCompletion → SQLiteHabitStorage` — a **storage vrstva sama volá `GamificationService.addXP`** (SQLiteHabitStorage.ts:333). XP tedy přiděluje úložiště, ne doménová služba. Funguje to, ale je to architektonická anomálie (viz 6.2).

**XP pipeline:** `addXP → (batching 500 ms okno) → performXPAdditionInternal → SQLite ACID transakce (xp_transactions + xp_state + xp_daily_summary) → DeviceEventEmitter.emit('xpGained'/'levelUp') → XpAnimationContext (popup/modal), OptimizedXpProgressBar (refetch), MonthlyProgressIntegration (progres výzev)`. Zápisová cesta je čistá a transakční. ✅

**Journal (gratitude):** `GratitudeContext` při startu načte `gratitudeStorage.getAll()` — **celou historii do paměti Reactu**. Streak/debt logika žije v SQLiteGratitudeStorage (1 710 ř.).

**Stav aplikace při startu:** `app/_layout.tsx`: fonty + `initializeDatabase()` + `initHaptics()` → `RootProvider` → `AppContext` volá `AppInitializationService.initializeApp()` (inicializace gamifikace, lifecycle manageru výzev, loyalty…). Do té doby `return null` (uživatel vidí jen nativní splash).

**Notifikace:** Čistě lokální (`expo-notifications`). Při každém návratu do popředí se přeplánují podle aktuálního progresu (`useNotificationLifecycle` + `NotificationScheduler`, večerní připomínky předplánované na X dní dopředu). Architektonicky správná volba pro sólo vývojáře — žádný server. ✅

**Pozadí:** Žádné skutečné OS background tasky. Vše jsou JS `setInterval`y běžící jen ve foregroundu (detail v sekci 3.2).

---

## 3. Nálezy podle oblastí

Formát: **[Závažnost | Kategorie]** — popis. U SHOULD/NICE-TO-HAVE: úsilí / přínos / riziko regrese.

### 3.1 Datová integrita a stabilita (nejdřív, protože přesahuje všechny oblasti)

**N1. [KRITICKÁ | MUST] Split-brain čtení/zápis XP transakcí.** ✅
- `FEATURE_FLAGS.USE_SQLITE_GAMIFICATION = true` (featureFlags.ts:46).
- Zápis: `performXPAdditionInternal` a `saveTransaction` zapisují transakce do SQLite `xp_transactions` (gamificationService.ts:775, 1549).
- Čtení: `getAllTransactions` (ř. 1583) a `getTransactionsByDateRange` (ř. 1604) čtou **výhradně AsyncStorage** (`gamification_xp_transactions`) — bez SQLite větve.
- Konzumenti zastaralých dat: `achievementService.ts:208, 1542`; `achievementIntegration.ts:427, 490, 595, 654, 799`; `userActivityTracker.ts:332, 533`; `appInitializationService.ts:245`.
- Důsledek: achievementy závislé na transakční historii, baseline pro měsíční výzvy a aktivity-tracking pracují s daty zamrzlými v okamžiku SQLite migrace. 🔶 Domněnka o dopadu na konkrétní achievementy vyžaduje runtime ověření, ale rozpor read/write cest je ověřený fakt.
- Bonus: `rollbackLastTransaction` (ř. 1622) maže transakci v AsyncStorage a zapisuje TOTAL_XP do AsyncStorage, zatímco `getTotalXP` čte z SQLite `xp_state` → rollback je při zapnutém flagu fakticky nefunkční. ✅
- **Kořenová příčina:** migrace na SQLite byla dokončena na zápisové cestě, čtecí cesta zůstala legacy. Typický „half-migrated" stav.
- **Náprava (blueprint):** (1) napsat SQLite implementaci `getAllTransactions`/`getTransactionsByDateRange` (`SELECT … FROM xp_transactions WHERE timestamp BETWEEN…` — indexy už existují, init.ts:343); (2) `rollbackLastTransaction` přepsat na SQLite DELETE + UPDATE xp_state v transakci; (3) regression test: addXP → getTransactionsByDateRange(today) musí transakci vrátit.

**N2. [KRITICKÁ | MUST] Debug utilita na DROP tabulek v produkčním bundlu.** ✅
- `app/_layout.tsx:37`: `import '../src/utils/dropGoalsTables'` — soubor sám deklaruje „TEMPORARY — DELETE THIS FILE after Phase 1.3" a vystavuje `global.dropGoalsTables`, který dropne `goals`, `goal_progress`, `goal_milestones`.
- Riziko není útočník, ale nehoda (vlastní debug session, crash-recovery skript, budoucí Claude Code session, která funkci „užitečně" zavolá).
- **Náprava:** smazat import + soubor. 5 minut.

**N3. [VYSOKÁ | MUST] Selhání inicializace DB → „continue anyway".** ✅
- `app/_layout.tsx:103–106`: při chybě `initializeDatabase()` se nastaví `setDbInitialized(true)` a appka běží dál. Všechny storage flagy jsou ale `true`, takže každé volání `getDatabase()` hází `Database not initialized` → kaskáda chyb v celé datové vrstvě, potenciálně tichá ztráta zápisů.
- **Náprava:** retry (např. 3×), pak explicitní error obrazovka s tlačítkem „Zkusit znovu" + odkaz na zálohu/export. Nikdy nepouštět uživatele do appky s mrtvou DB.

**N4. [VYSOKÁ | MUST] Pravděpodobný off-by-one den v týdnu pro uživatele západně od UTC.** ✅ (mechanismus) / 🔶 (reálný dopad)
- `src/utils/date.ts`: `formatDateToString` skládá datum z **lokálních** komponent, ale `parseDate` parsuje `'YYYY-MM-DD' + 'T00:00:00.000Z'` jako **UTC** půlnoc; `getDayOfWeek` pak volá lokální `getDay()`.
- Pro uživatele v UTC−5 (New York): `getDayOfWeekFromDateString('2026-06-10')` → instant 10. 6. 00:00 UTC = 9. 6. 19:00 lokálně → vrátí úterý místo středy.
- Použití: MonthlyHabitOverview, YearlyHabitOverview, Monthly30DayChart, WeeklyHabitChart, HabitPerformanceIndicators, HabitTrendAnalysis (statistiky a „scheduled days" vizualizace). Pokud stejnou funkci používá i logika plnění návyků podle naplánovaných dnů, jde o funkční bug, ne jen kosmetiku ve statistikách.
- **Náprava:** `parseDate` bez `Z` (lokální půlnoc: `new Date(y, m-1, d)`), + unit test pro UTC−8/UTC+12. Jediný soubor, nízké riziko, ale otestovat všechny grafy.

**N5. [STŘEDNÍ | MUST] Rozbitý typecheck v testech.** ✅
- `npx tsc --noEmit`: produkční kód 0 chyb, ale 28 chyb v `__tests__/hooks/useHabitsData.makeup.test.tsx` (+ chybějící typy pro react-test-renderer). `npm run typecheck` je tedy trvale červený → ztrácí funkci bezpečnostní sítě.
- Související: `react-test-renderer@19.0.0` vs. `react@19.2.0` (nesoulad verzí; react-test-renderer je v React 19 deprecated).

### 3.2 Procesy na pozadí, listenery, baterie

**Celkový obraz:** Žádné skutečné OS background tasky (žádný expo-background-task/BGTaskScheduler) — všechna „background" logika jsou JS intervaly běžící **jen ve foregroundu**. Pro tuto kategorii appky je to v pořádku; jen názvosloví („BackgroundTaskScheduler") slibuje víc, než dělá.

**N6. [NÍZKÁ | —] Inventura časovačů.** ✅
| Časovač | Interval | Hodnocení |
|---|---|---|
| monthlyChallengeLifecycleManager | 1 h | OK (kontrola přelomu měsíce) |
| achievementService background queue | 1 s, self-stop při prázdné frontě | OK |
| XpMultiplierSection | 60 s polling | OK, ale šel by nahradit eventem |
| Multiplier countdown (2 komponenty) | 1 s, jen když je multiplier aktivní | OK ✅ (ověřeno gating) |
| productionMonitoring | 5 s | **Mrtvý kód — nikdy se nespouští** (hook `useProductionMonitoring` není nikde použit) ✅ |
| optimizedStorage / atomicStorage cleanup | — | optimizedStorage zcela nepoužitý ✅ |

**N7. [NÍZKÁ | —] Hygiena listenerů je překvapivě dobrá.** ✅ Vzorky napříč kontexty a komponentami (XpAnimationContext, AchievementContext, HomeScreen, AdBanner, useNotificationLifecycle) důsledně vracejí `subscription.remove()` v cleanup funkcích. Modulové singletony (MonthlyProgressIntegration) drží listenery po celý život appky záměrně a mají `cleanup()`. Memory leak z listenerů jsem nenašel. 🔶 Neauditoval jsem všech 27 souborů řádek po řádku — doporučuji jednorázový grep-audit jako součást úklidu.

**N8. [STŘEDNÍ | SHOULD] DeviceEventEmitter jako netypovaná globální sběrnice.** (úsilí: nízké–střední / přínos: střední / riziko: nízké)
- 27 souborů komunikuje stringovými eventy (`'xpGained'`, `'monthly_progress_updated'`…). Funguje, ale překlep v názvu eventu = tichá chyba, kterou kompilátor nechytí.
- Špičkové řešení: tenký typovaný wrapper (jeden soubor, ~40 řádků): `type AppEvents = { xpGained: XpGainedPayload; levelUp: LevelUpPayload; … }` + `emit<K extends keyof AppEvents>(…)`. Žádná nová knihovna, jen typy nad DeviceEventEmitter. Postupná migrace, nulové runtime riziko.

### 3.3 Výkon a optimalizace

**N9. [VYSOKÁ | MUST] journal-history renderuje celou historii v ScrollView přes `.map()`.** ✅ (app/journal-history.tsx:325)
- Po roce používání: 365 dní × 3+ zápisy = 1 100+ Text/View uzlů najednou. Na starším Androidu znatelné zaseknutí při otevření a vysoká spotřeba paměti. Data už jsou v SQLite — stránkování je levné.
- **Náprava:** FlatList s `onEndReached` + SQLite `LIMIT/OFFSET` (nebo po měsících). Úsilí nízké–střední, přínos vysoký pro dlouhodobé uživatele (= ty nejcennější), riziko nízké.

**N10. [STŘEDNÍ | SHOULD] Kontexty drží kompletní datasety v paměti.** (úsilí: střední / přínos: střední / riziko: střední)
- `GratitudeContext` načítá `getAll()` celé historie do React state; obdobný vzor u návyků. Při 1–2 letech dat zpomaluje start a každý reducer update kopíruje velká pole.
- Pragmatická cesta (ne přepis na zustand!): kontext drží jen „aktivní okno" (dnešek + streak metadata), historie se dotazuje ze SQLite per-screen. Dělat až PO vyřešení N1/N9 a jen pokud profiling potvrdí problém. 🔶 Bez profilace na reálném zařízení je dopad domněnka.

**N11. [STŘEDNÍ | SHOULD] Home screen: StyleSheet.create uvnitř render funkce + vše mounted.** ✅ (app/(tabs)/index.tsx:316)
- `StyleSheet.create` se vytváří při každém renderu (levné, ale zbytečné — přesunout ven / `useMemo(colors)`).
- Všech ~11 widgetů Home je mounted naráz v ScrollView; každý si sám fetchuje data a poslouchá eventy. Při `xpGained` se refetchuje víc widgetů paralelně. Batching XP eventů (500 ms) to z velké části tlumí ✅ — proto jen SHOULD.
- Úsilí: nízké / přínos: nízký–střední (starší HW) / riziko: nízké.

**N12. [STŘEDNÍ | SHOULD] Particle efekty na RN core Animated (JS thread).** ✅ (ParticleEffects.tsx — desítky `Animated.Value` per částice)
- Na slabém Androidu může oslava levelu drhnout přesně v momentu, kdy má action vypadat nejlépe. Máte v projektu Reanimated 4 i Skia — špičkové appky tohle dělají přes worklety/Skia nebo předrenderovanou Lottie.
- Doporučení: nahradit Lottie animacemi (už používáte lottie-react-native pro streak) — nejnižší úsilí, deterministický výkon. Úsilí: střední / přínos: vysoký (vizuálně i výkonem) / riziko: nízké.

**N13. [NÍZKÁ | NICE-TO-HAVE] Bundle obsahuje mrtvý kód a demo data.** ✅
- marketingDemoDataService (1 269 ř.) — guard přes env flag existuje (poslední commit), ale kód je v bundlu; productionMonitoring + optimizedStorage + social komponenty + gamificationCache (0 ř.!). Dohromady ~3 000+ řádků. Smazání = menší bundle, rychlejší start, čistší mentální mapa. Úsilí: nízké / přínos: nízký–střední / riziko: nízké (po grep ověření importů).

**N14. [NÍZKÁ | —] Console logging.** ✅ 1 201 × `console.log`; v produkci odstraněno babel pluginem (`transform-remove-console`, ověřeno v babel.config.js) kromě error/warn. Produkčně OK; v dev znatelný šum. Doporučený cíl: tenký `logger` s úrovněmi (jeden soubor), postupná migrace.

### 3.4 Design a UX (benchmark: top 0,1 % kategorie)

**Kontext srovnání:** Duolingo/Finch/Fabulous staví část kouzla na maskotech, ilustracích a sociální vrstvě. Sociální vrstvu záměrně vynechávám (mimo dosah sólo provozu). Co je plně v dosahu: **vizuální identita, mikrointerakce, odměnové momenty, zvuk a haptika** — tedy „single-player juice".

**N15. [VYSOKÁ | MUST (designová)] Brand identita se v appce nevyskytuje.** ✅
- Splash + ikona: deep navy `#07051A`. Uvnitř: default **light** theme (ThemeContext default `'light'`, ne `'system'`), primární barva iOS systémová modrá `#007AFF`, hlavičky tabů modré, dark mode = generická AMOLED černá `#000000` s `#1E9FFF`.
- Uživatel z App Store screenshotů (navy/indigo brand) přijde do appky, která vypadá jako iOS template. To je největší jednotlivý rozdíl mezi „funkční" a „prémiová".
- **Blueprint „SelfRise Dark by default":**
  1. Do `darkColors` promítnout brand: background `#07051A`, surface `#100C2A`/`#161130`, primary indigo `#6366F1` (už je v notification icon barvě!), akcent icy cyan `#22D3EE`, sekundární purple `#A855F7`.
  2. Default themeMode → `'dark'` (nebo `'system'` s dark-first marketingem).
  3. Hlavičky: místo plné `colors.primary` plochy průhledná/blur varianta na navy pozadí.
  - Úsilí: střední (barvy jsou centralizované — výměna je levná; ladění kontrastů pár dní). Přínos: zásadní. Riziko: střední (vizuální regrese — projít všechny obrazovky; navrhuju feature-flag theme „Midnight" a přepnout default až po kontrole).

**N16. [VYSOKÁ | MUST (designová)] Dva nezávislé barevné systémy → rozbitý dark mode.** ✅
- `export const Colors = lightColors` (colors.ts:222) je staticky importováno v `Typography` (typography.ts) a min. 4 komponentách. Text stylovaný přes Typography má **vždy light barvy**, i v dark mode.
- **Náprava:** Typography zbavit barev (barvu dodává komponenta z `useTheme()`), statický `Colors` export smazat a nechat kompilátor najít všechna použití. Úsilí: nízké–střední / přínos: vysoký / riziko: nízké (TS chyby to vodí za ruku).

**N17. [STŘEDNÍ | SHOULD] Odměnové momenty: dobrá kostra, chybí „juice".** ✅ (struktura) / 🔶 (subjektivní laťka)
- Co už je špičkové: ModalQueue s prioritami (level-up > achievement > celebration) řeší problém, který většina appek ignoruje (kolize modálů); haptika s odstupňovanou intenzitou (CelebrationModal — triple burst pro crown); milestone struktura streaků.
- Co dělí od Duolinga: (a) oslavy jsou modální karty s particle overlay, ne plnohodnotná animovaná sekvence (Lottie/Skia); (b) hardcoded hex barvy mimo theme (ParticleEffects.tsx:48–…); (c) žádný zvukový design (Duolingo: ~50 % dojmu z odměny je zvuk; `expo-audio` + 5–10 krátkých SFX s vypínačem v nastavení = levná výhra); (d) XP progress bar nemá „count-up" tick a overshoot-bounce na level-up.
- Pořadí podle poměru cena/výkon: 1) SFX (nízké úsilí, vysoký dopad), 2) Lottie pack pro level-up/achievement/streak (střední/vysoký), 3) count-up + spring animace progress baru přes Reanimated (nízké/střední). Riziko regrese: nízké (aditivní vrstva).

**N18. [STŘEDNÍ | SHOULD] Empty a loading stavy jsou text-only.** ✅ (vzorek: HabitListWithCompletion:273, GoalList)
- Špička kategorie používá empty stavy jako onboarding moment (ilustrace + 1 CTA). Levná verze bez ilustrátora: velký emoji/ikona + titulek + CTA tlačítko, jednotná `<EmptyState>` komponenta. Úsilí: nízké / přínos: střední / riziko: žádné.
- Loading: `return null` při startu (bílý/černý flash mezi splash a UI) — elegantnější je podržet nativní splash přes `SplashScreen.preventAutoHideAsync()` a pustit ho až po prvním renderu. 🔶 Ověřit, jestli už se neděje — neviděl jsem to v _layout.tsx.

**N19. [STŘEDNÍ | SHOULD] Reklamy vs. prémiový pocit.** ✅ AdBanner je na 10+ obrazovkách včetně Home a Journalu (fixní bottom). U self-improvement appky banner přímo pod ranním gratitude zápisem podkopává „sanctuary" pocit, který Fabulous/Finch pěstují.
- Bez zásahu do monetizační strategie aspoň: nezobrazovat banner během psaní zápisu (keyboard visible) a během oslav. Úsilí: nízké / přínos: střední / riziko: nízké. Dlouhodobě zvážit „remove ads" jednorázový IAP — nejjednodušší premium pro sólo vývojáře. (NICE-TO-HAVE, střední úsilí.)
- 🔶 Domněnka: nemám data o eCPM/retenci; rozhodnutí je byznysové.

**N20. [NÍZKÁ | SHOULD] Přístupnost je částečná.** ✅ 68 výskytů `accessibilityLabel` na 262 souborů; AccessibilityInfo (reduce motion) řešeno v particle efektech, ale ne plošně. Minimální cíl: labels na všech TouchableOpacity v hlavních flow + respektovat `isReduceMotionEnabled` ve všech oslavách. Úsilí: střední / přínos: střední / riziko: žádné.

**N21. [NÍZKÁ | NICE-TO-HAVE] Volitelné „lehké sociálno" bez backendu** (v souladu s omezením sólo provozu):
- Sdílení achievementu/streaku jako obrázek (ViewShot → share sheet) — `socialSharingService` už existuje, jen je odpojený ✅. Úsilí: nízké / přínos: marketingově zajímavý (organická akvizice) / riziko: žádné.
- Lokální „síň slávy": osobní rekordy (nejdelší streak, nejlepší měsíc) jako offline leaderboard vůči sobě. Úsilí: nízké–střední / přínos: střední / riziko: žádné.
- iOS/Android home-screen widget (streak + dnešní stav): velký retention nástroj špičkových appek, ale vyžaduje nativní moduly (WidgetKit/Glance) — úsilí: vysoké / přínos: vysoký / riziko: střední. Až po stabilizaci.

### 3.5 Kompatibilita (iOS / Android / SDK)

**N22. [STŘEDNÍ | MUST] Zastaralé workaroundy z SDK 53 éry.** ✅
- metro.config.js: monkey-patch `console.warn/log` kvůli ExpoLinearGradient warningu s komentářem „Expo SDK 53 + RN 0.79.5". Na SDK 55 (New Arch only) je tento hack pravděpodobně bezpředmětný a maskuje legitimní warningy. 🔶 Ověřit odstraněním v dev buildu.
- `LogBox.ignoreLogs` potlačuje mj. `'Unable to get the view config for'` a `'Cannot find native module ExpoPushTokenManager'` — druhé je symptom nedokončeného notification rebuildu (NOTIFICATION_REBUILD_GUIDE.md). Po rebuildu suppressy odstranit; každý z nich může schovat budoucí reálnou chybu.
- `_layout.tsx.bak` v repu; `app.json` zmiňuje plugin `withModularHeaders` — po SDK 55 ověřit nutnost.

**N23. [STŘEDNÍ | MUST] Riskantní third-party závislosti na New Architecture.** ✅ (verze) / 🔶 (konkrétní chování)
- `react-native-modal@14.0.0-rc.1` — release candidate, knihovna dlouhodobě minimálně udržovaná, historicky problémová na New Arch. Náhrada: RN `Modal` + Reanimated, nebo expo-router modal screens. Used-in: BaseModal? → ověřit rozsah.
- `react-native-draggable-flatlist@4.0.3` **a zároveň** `react-native-draglist@3.9.6` — dvě knihovny na stejný problém (drag & drop reorder). draggable-flatlist je prakticky neudržovaný a závislý na starých gesture-handler API. Sjednotit na jednu (draglist je jednodušší a novější), druhou odinstalovat.
- `@types/i18next@12` — deprecated stub (i18next si typy nese sám od v23); smazat.
- `react-test-renderer@19.0.0` — viz N5.

**N24. [NÍZKÁ | —] Soulad s SDK 55.** ✅ Všechny `expo-*` balíčky jsou na řadě ~55.x, RN 0.83.4 + React 19.2.0 odpovídá oficiálnímu párování SDK 55 (ověřeno proti Expo changelogu — zdroje na konci). `newArchEnabled` správně odstraněno z app.json (v SDK 55 je New Arch povinná). `npx expo install --check` jsem nemohl spustit (sandbox bez přístupu k registru) — doporučuji spustit lokálně jako součást Quick Wins. 🔶
- Budoucí riziko: SDK 56+ — sledovat react-native-google-mobile-ads a @react-native-firebase (native moduly s nejpomalejší adaptací; dnes v pořádku: RNFB 23.x, RNGMA 16.x jsou New-Arch ready verze).

**N25. [NÍZKÁ | SHOULD] Web target je nakonfigurovaný, ale nefunkční.** ✅ app.json má web output `static` a v dependencies je react-native-web, ale appka stojí na nativních modulech (AdMob, RNFB, SQLite). Mrtvá konfigurační větev — odstranit, ať `expo start --web` neslibuje nemožné. Úsilí: minimální / riziko: žádné.

**N26. [NÍZKÁ | —] Safe areas & edge-to-edge.** ✅ react-native-safe-area-context 5.6 + `edges={[]}` na Home (vědomé rozhodnutí kvůli vlastnímu headeru) + translucent StatusBar. 🔶 Na Androidu 15+ (povinný edge-to-edge) doporučuji vizuální kontrolu spodního AdBanneru vs. gesture bar na reálném zařízení — fixní `bottom: 0` bez safe-area insetů může kolidovat.

### 3.6 Kvalita kódu a udržovatelnost

**N27. [VYSOKÁ | MUST] Dokončit SQLite migraci a smazat legacy větev.** ✅
- Všech 5 feature flagů je `true` a flagy nejsou runtime-přepínatelné (konstanty). Legacy implementace (gratitudeStorage 1 752 ř., habitStorage 747 ř., goalStorage 871 ř. + AsyncStorage větve v gamificationService) jsou ~5 000 řádků kódu, který se nikdy nevykoná, ale musí se udržovat při každé změně typů.
- Tohle je příčina N1: dvojí implementace = dvojí místo, kde se dá zapomenout.
- **Postup:** nejdřív N1 (sjednotit čtecí cesty), pak 1 release s migrací „doběhnutí" (ověřit, že AsyncStorage→SQLite migrace proběhla u všech uživatelů — telemetrie přes Firebase event), pak smazat legacy soubory i flagy. Úsilí: střední / přínos: vysoký / riziko: střední (proto telemetrie před smazáním).

**N28. [STŘEDNÍ | SHOULD] GamificationService je god-object (3 547 ř.).** (úsilí: střední / přínos: střední–vysoký / riziko: střední)
- Míchá: XP přidávání, batching, validaci/anti-spam, level-up eventy, denní tracking, multipliery, notifikace, debug API. Po vyřešení N1/N27 rozdělit podle existujících švů: `xpCore` (add/subtract/total), `xpBatching`, `xpLimits`, `levelUpEvents`, `xpStats`. Žádné přepisování logiky — jen přesun do modulů se zachováním API přes fasádu. Dělat postupně, ne big-bang.

**N29. [STŘEDNÍ | SHOULD] Statické třídy všude → špatná testovatelnost.** (úsilí: vysoké / přínos: střední / riziko: střední)
- Vzor `class X { static async … }` + module-level singletony znemožňuje DI a vynucuje jest mock-magii (viz rozbité testy N5). Nepředělávat plošně — jen u nově vznikajících služeb preferovat plain funkce + explicitní závislosti. Pragmatické: tohle je SHOULD se slabou prioritou pro sólo vývojáře.

**N30. [STŘEDNÍ | SHOULD] Side-effect importy a barrel exporty.** ✅
- `app/_layout.tsx:18`: `import '../src/services'` — side-effect import celého barrelu (`export *` ze ~17 služeb) kvůli inicializaci. Tahá do startu vše včetně mrtvého kódu, ztěžuje tree-shaking a maskuje, co se kdy inicializuje. Nahradit explicitním `import { AppInitializationService }` tam, kde se reálně volá. Úsilí: nízké / přínos: střední / riziko: nízké.
- `require()` workaroundy v featureFlags.ts kvůli kruhovým závislostem — symptom: storage ↔ gamifikace se navzájem importují (viz N31).

**N31. [STŘEDNÍ | SHOULD] Obrácená závislost: storage vrstva volá GamificationService.** ✅ (SQLiteHabitStorage.ts:333, habitStorage.ts:274)
- Úložiště by nemělo rozhodovat o herních odměnách; proto kruhové závislosti a `require()` hacky. Cílový stav: storage jen ukládá; XP přiděluje doménová operace (context action / use-case funkce `completeHabit()`), která volá storage i gamifikaci vedle sebe. Úsilí: střední / přínos: vysoký (rozmotá závislosti) / riziko: střední — dělat až po N1, s testy na XP přidělování.

**N32. [NÍZKÁ | SHOULD] Repo hygiena.** ✅ V rootu: `_layout.tsx.bak`, dropGoalsTables.ts, 10+ ad-hoc auditních/trackingových .md souborů (audit-fix-plan.md 79 kB, i18n-migration-tracker.md 77 kB, implementation-history.md 154 kB…). Přesunout do `docs/archive/`, .bak smazat. Úsilí: minimální.

**N33. [NÍZKÁ | —] i18n: detekce jazyka zařízení je vypnutá.** ✅ (i18n config: „Only English is supported for now" → vždy 'en' default, přestože DE/ES překlady jsou 100% hotové — 4 455/4 453 řádků). Pokud je to vědomé rozhodnutí před QA překladů, OK; jinak appka zahazuje hotovou investici a konverzi v DE/ES trzích. Jednořádková změna + QA průchod oběma jazyky. 🔶 Záměr neznám — k rozhodnutí.

**N34. [NÍZKÁ | —] Testy.** ✅ 13 test souborů, slušné pokrytí gamifikační matematiky (XpCalculation, MathematicalModel, DataPersistence). Chybí: testy na N1 (write→read konzistence), date utils (N4), streak/debt logiku v SQLiteGratitudeStorage (nejsložitější byznys logika v appce — 1 710 ř.). Pro sólo údržbu 5+ let jsou regression testy na streak logiku důležitější než UI testy.

---

## 4. Posouzení optimálnosti (funguje to, ale je to nejlepší cesta?)

| Oblast | Současné řešení | Verdikt | Lepší cesta (pokud existuje) |
|---|---|---|---|
| State management | Context + useReducer per doména | ✅ Správná volba pro sólo dev; **nemigrovat** na zustand/redux jen kvůli módě | Jen zmenšit objem dat držený v kontextech (N10) |
| Persistence | SQLite (WAL, ACID) + AsyncStorage zbytky | ✅ SQLite je správně; hybrid je dluh | Dokončit migraci, AsyncStorage nechat jen na preference (N27) |
| Event bus | DeviceEventEmitter, stringové eventy | ⚠️ Funkční, ale netypové | Typovaný wrapper, ne nová knihovna (N8) |
| Notifikace | Lokální, reschedule on foreground | ✅ Vzorové řešení bez backendu | Nic — toto je „světová úroveň v mezích sólo" |
| Animace odměn | RN core Animated + particle JS | ⚠️ Funkční, drhne na slabém HW | Lottie pro oslavy, Reanimated pro progress bary (N12, N17) |
| Theming | ThemeContext + paralelní statický Colors | ❌ Dva systémy, rozbitý dark mode | Jediný zdroj pravdy (N16) + brand theme (N15) |
| Služby | Statické třídy, god-object | ⚠️ Udržitelné, ale křehne s růstem | Postupná modularizace gamifikace (N28), bez big-bangu |
| Monetizace | Bannery všude + rewarded | ⚠️ Funkční, eroduje prémiový dojem | Kontextové skrývání bannerů; zvážit „remove ads" IAP (N19) |
| Tutorial | Vlastní overlay systém, Skia spotlight | ✅ Nadstandardní pro sólo projekt | — (1 800 ř. TutorialContext jen hlídat při změnách) |
| i18n | i18next + ICU, 3 jazyky kompletní | ✅ Kvalitní | Zapnout detekci jazyka (N33) |

**Design vs. špička — konkrétně:**
- **Duolingo:** každý správný krok má zvuk + mikro-animaci + okamžitý vizuální tick; streak flame je centrální brand asset. SelfRise: ticho, statická ikona streaku. → SFX pack + animovaný streak flame (Lottie) je nejlevnější krok k „duolingo pocitu".
- **Fabulous:** rituálové framování (ráno/večer), prémiové ilustrace, dark-luxury paleta. SelfRise má obsahovou hloubku srovnatelnou, vizuální vrstvu ne → N15 řeší 70 % rozdílu bez ilustrátora.
- **Streaks/Atomic-style minimalisté:** widgety na home screen a Apple Watch. SelfRise nemá — NICE-TO-HAVE s vysokým úsilím (N21).
- **Finch:** emoční vazba přes virtuálního mazlíčka — mimo rozumný scope sólo vývojáře, nenavrhuju.

---

## 5. Prioritizovaný akční plán (blueprint)

**Sprint 1 — „Zastavit krvácení" (1–2 dny, vše MUST):**
1. Smazat `dropGoalsTables` import + soubor + `_layout.tsx.bak` (N2, N32). [30 min]
2. SQLite čtecí cesty pro XP transakce + rollback + regression test (N1). [1 den]
3. DB init: retry + error screen místo „continue anyway" (N3). [0,5 dne]

**Sprint 2 — „Důvěryhodná data" (2–4 dny):**
4. Fix `parseDate` UTC/local + testy pro UTC−8/UTC+12 + vizuální kontrola grafů (N4). [0,5–1 den]
5. Opravit test typecheck, srovnat react-test-renderer / přejít čistě na @testing-library (N5). [0,5–1 den]
6. Telemetrie dokončení migrace (Firebase event `sqlite_migration_state`) — předpoklad pro smazání legacy (N27 krok 1). [0,5 dne]
7. Regression testy na streak/debt logiku journalu (N34). [1–2 dny]

**Sprint 3 — „Velký úklid" (2–3 dny):**
8. Smazat mrtvý kód: productionMonitoring + hook, optimizedStorage, gamificationCache, social komponenty, weeklyChallengeCleanup po ověření (N13). [0,5 dne]
9. Odstranit metro console-patch + redukovat LogBox suppressy, ověřit v dev buildu na SDK 55 (N22). [0,5 dne]
10. Sjednotit drag-and-drop na jednu knihovnu; plán náhrady react-native-modal; smazat @types/i18next (N23). [1 den]
11. Doc soubory → docs/archive/; aktualizovat komentáře „SDK 53" → realita (N22, N32). [0,5 dne]

**Sprint 4 — „Brand & juice" (1–2 týdny, největší viditelný skok):**
12. Brand dark theme „Midnight" + jediný theming systém (N15 + N16). [3–5 dní]
13. SFX pack + vypínač zvuku (N17). [1–2 dny]
14. Lottie oslavy: level-up, achievement, streak milestone (N17, N12). [2–4 dny]
15. EmptyState komponenta + nasazení (N18). [1 den]
16. journal-history → stránkovaný FlatList (N9). [1 den]

**Průběžně / později:** N8 (typovaný event bus), N28 (rozdělení gamificationService), N31 (XP mimo storage), N33 (jazyky — rozhodnutí), N19/N21 (monetizace, sdílení, widgety).

---

## 6. Quick wins (max. přínos / min. úsilí)

1. **Smazat dropGoalsTables** — 30 minut, eliminace rizika ztráty dat. (N2)
2. **SQLite read-path pro transakce** — 1 den, opraví achievementy a baseline výpočty. (N1)
3. **parseDate fix** — pár řádků, správné dny v týdnu pro americké uživatele. (N4)
4. **Smazat ~3 000 řádků mrtvého kódu** — půl dne, menší bundle a čistší hlava. (N13)
5. **Default theme 'dark'/'system' + brand navy pozadí** — i jen výměna hodnot v darkColors viditelně zvedne prémiovost. (N15)
6. **SFX při check-inu a oslavě** — nejlevnější „juice" s největším emočním dopadem. (N17)
7. **Banner skrýt při psaní zápisu a během oslav** — 2 hodiny, lepší pocit z klíčových momentů. (N19)
8. **Zapnout detekci jazyka zařízení** (pokud jsou DE/ES QA-ready) — 1 řádek + QA. (N33)

---

## 7. Kontrolní seznam auditu (Fáze 0) — ověření pokrytí

- [x] Verze stacku ověřeny z package.json, ne z paměti (Expo 55 / RN 0.83.4 / React 19.2) — vč. web-ověření párování SDK 55
- [x] Architektura reverzně zmapována (vrstvy, moduly, datový tok) — sekce 2
- [x] Klíčové systémy pochopeny: check-iny (HabitsContext→SQLiteHabitStorage→XP), journal + streak/debt (GratitudeContext/SQLiteGratitudeStorage), XP/levely (GamificationService), achievementy (achievementService/Integration/Catalog), cíle (GoalsContext), měsíční výzvy (monthlyChallengeService/ProgressTracker/LifecycleManager), multipliery, loyalty, tutorial
- [x] Procesy na pozadí: intervaly, AppState listenery, notifikační lifecycle, AdMob load/consent — sekce 3.2
- [x] Memory leaky / listenery: vzorková kontrola cleanup funkcí — N7
- [x] Výkon: seznamy, re-rendery, animace, start, bundle — sekce 3.3
- [x] Design & UX vs. benchmark (Duolingo, Fabulous, Finch, Streaks) + brand konzistence + hygiena (empty/loading/a11y) — sekce 3.4
- [x] Kompatibilita: SDK 55 soulad, deprecated API, rizikové knihovny, safe areas, web target — sekce 3.5
- [x] Kvalita kódu: duplicity, provázání, god-objecty, mrtvý kód, testy, repo hygiena — sekce 3.6
- [x] Posouzení optimálnosti u každé oblasti („funguje, ale je to nejlepší cesta?") — sekce 4
- [x] Každé doporučení klasifikováno MUST/SHOULD/NICE-TO-HAVE; u SHOULD/NTH úsilí+přínos+riziko
- [x] Fakta vs. domněnky důsledně rozlišeny (✅/🔶)
- [ ] Neověřeno (vyžaduje runtime/zařízení): reálný dopad N1 na konkrétní achievementy, profiling startu a paměti na starším Androidu, vizuální kontrola edge-to-edge na Androidu 15+, `npx expo install --check` (sandbox bez registru), běh jest suite

**Limity auditu:** Statická analýza bez spuštění na zařízení. Soubory nad ~1 500 řádků (TutorialContext, monthlyChallengeService, SQLiteGratitudeStorage) auditovány strukturálně, ne řádek po řádku — streak/debt logiku doporučuji pokrýt testy dřív, než se do ní bude zasahovat.

**Zdroje (ověření SDK 55):** [Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55), [React Native 0.83 release](https://reactnative.dev/blog/2025/12/10/react-native-0.83), [Expo New Architecture docs](https://docs.expo.dev/guides/new-architecture/)
