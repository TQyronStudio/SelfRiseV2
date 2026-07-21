# Fáze 11 — nálezy (super audit 2026-07): Home screen + customizace + doporučení

Datum: 2026-07-21 | Commit: `f39d54e` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 464/464 (31/31 suites)

```
Tests:       464 passed, 464 total
```

Scope dle plánu: položky 11.1–11.7. Guide: žádný specifický — platí
`technical-guides.md` (Theme & Color System) + `technical-guides:Gamification-UI.md`.
Soubory: `src/components/home/*` (16 komponent), `HomeCustomizationContext.tsx` (170 ř.),
`homePreferencesStorage.ts` (112 ř.), `recommendationEngine.ts` (425 ř.),
`app/(tabs)/index.tsx` (356 ř.).

**Celkové hodnocení: logická část Home je v dobrém stavu** — doporučovací engine
má splnitelné podmínky i funkční navigaci, customizace má jediného zapisovatele,
multiplikátor si nedělá vlastní odpočet a citát dne je deterministický.
**Hlavní nález je vizuální**: v modálech měsíčních výzev je natvrdo zapsaný
tmavý text na motivem řízeném pozadí → v tmavém režimu **nečitelné**.

## Položky

### 11.1 recommendationEngine — typ → trigger → cíl → XP

- Kde: `src/services/recommendationEngine.ts:50-425`, konzument
  `src/components/home/PersonalizedRecommendations.tsx:90-108`
- Pravidlo: plán 11.1 — (a) podmínka splnitelná reálnými daty, (b) tap vede na
  existující obrazovku, (c) `RECOMMENDATION_FOLLOW` XP přes `addXP` pod
  ENGAGEMENT_MAX_DAILY (200).
- Ověřeno jak: vylistování všech typů + čtení každé podmínky + kontrola
  jednotek + grep XP producentů + čtení tap handleru.
- Verdikt: ✅ (a) i (b) v pořádku; (c) **XP se neuděluje vůbec** — konzistentní
  s rozhodnutím z Fáze 2 (trofej `recommendation-master` byla proto smazána).

| # | Typ | Trigger (podmínka vzniku) | Cíl tapu | XP |
|---|---|---|---|---|
| 1 | `habit_schedule` | completionRate < 30 % (7 dní), aktivní, 14+ dní starý (`:158`) | `/(tabs)/habits` ✅ | žádné |
| 2 | `habit_adjustment` | completionRate > 80 %, aktivní, 14+ dní, max 1× (`:172`) | `/(tabs)/habits` ✅ | žádné |
| 3 | `new_habit` | existuje 14+ denní návyk s rate ≥ 60 % A aktivních návyků < 5 (`:222-225`) | `/(tabs)/habits` ✅ | žádné |
| 4 | `streak_motivation` | < 3 zápisy za posledních 7 dní (`:255`) | `/(tabs)/journal` ✅ | žádné |
| 5 | `milestone_celebration` | ≥ 5 zápisů za 7 dní (`:266`) | `/(tabs)/journal` ✅ | žádné |
| 6 | `journal_prompt` | všechny nedávné zápisy jsou typu 'gratitude' (žádné self-praise) (`:277-278`) | `/(tabs)/journal` ✅ | žádné |
| 7 | `goal_progress` (a) | uplynulo > 10 % času do deadlinu (`:315`) | `/(tabs)/goals` ✅ | žádné |
| 8 | `goal_progress` (b) | pokrok > 80 % (`:330`) | `/(tabs)/goals` ✅ | žádné |
| 9 | `goal_adjustment` | zbývá < 30 dní, pokrok < 50 %, odhad překročí deadline (`:348-352`) | `/(tabs)/goals` ✅ | žádné |
| 10 | `new_goal` | aktivních cílů < 2 (`:382`) | `/(tabs)/goals` ✅ | žádné |

- Důkaz k jednotlivým kritériím:
  - **(a) splnitelnost ✅** — všechny prahy jsou dosažitelné běžnými daty; navíc
    je všude respektováno stáří návyku (`ageInfo.daysSinceCreation < 3 → return`,
    `:118`) a datum vzniku (`getRelevantDatesForHabit`, `:55-59`), takže se
    nedoporučuje nesmysl na základě neúplné historie.
  - **Kontrola jednotek** (klasická past): utilita `calculateHabitCompletionRate`
    vrací **procenta 0-100+**, ale podmínky používají zlomek (`< 0.3`, `> 0.8`).
    Ověřeno — na ř. 154 je explicitní převod
    `const completionRate = completionResult.totalCompletionRate / 100;` ✅
    **žádná záměna jednotek**.
  - **(b) navigace ✅** — `handleRecommendationPress` (`:90-108`) mapuje všech
    10 typů na 3 existující taby (habits/journal/goals); žádný typ nechybí,
    žádný nevede na neexistující route.
  - **(c) XP ✅/❌** — grep `RECOMMENDATION_FOLLOW` přes `src/`: **žádný
    producent** (nikde `addXP` s tímto zdrojem). Existují jen konzumenti
    (`achievementService.ts:988`, `achievementIntegration.ts:682`,
    `xpLimits.ts:83` s limitem ENGAGEMENT_MAX_DAILY, UI switche). Uživatel tedy
    za následování doporučení nedostane nic. **Není to regrese** — je to stejný
    stav, kvůli kterému Petr ve Fázi 2 schválil smazání trofeje
    `recommendation-master`. Konfigurace limitu je připravená, kdyby se to
    někdy zapnulo.
  - Drobnost: komentář na ř. 157 říká „established habits (7+ days)", kód ale
    kontroluje `isEstablishedHabit` = **14+ dní**. Jen zavádějící komentář.

### 11.2 HomeCustomizationContext + homePreferencesStorage

- Kde: `src/services/storage/homePreferencesStorage.ts:5, 40, 49`,
  `src/contexts/HomeCustomizationContext.tsx:100-102`
- Pravidlo: plán 11.2 — přepnutí widgetu se uloží a přežije restart (🔶 device);
  **storage klíč má jediného zapisovatele** (grep).
- Ověřeno jak: grep klíče `@home_preferences` přes `src/` + `app/`.
- Verdikt: ✅ **jediný zapisovatel potvrzen**; funkční ověření přes restart je
  🔶 device (v device frontě jako 11.2).
- Důkaz:
  - Grep `@home_preferences` → **jediný výskyt** `homePreferencesStorage.ts:5`
    (definice `STORAGE_KEY`). Zápisy (`setItem` ř. 40, `removeItem` ř. 49) jsou
    uvnitř téže služby; žádná komponenta ani context nepíše do AsyncStorage
    přímo ✅.
  - `HomeCustomizationContext` volá výhradně metody služby
    (`updateQuickActionsPreferences` ř. 102 atd.) ✅ — jedna cesta zápisu.
  - 🔶 **Device scénář**: v Nastavení Home vypnout/zapnout několik widgetů →
    zabít appku → spustit → stav musí zůstat.

### 11.3 Datová správnost widgetů

- Kde: 9 jmenovaných widgetů v `src/components/home/`
- Pravidlo: plán 11.3 — data výhradně přes contexty/SQLite storage (**žádný
  přímý import legacy `*Storage.ts`**), completion-rate přes sdílenou utilitu
  (vazba na 4.3).
- Ověřeno jak: grep legacy importů + grep `calculateHabitCompletionRate`.
- Verdikt: ✅ **žádný legacy import**; ⚠️ dva widgety čtou storage přímo mimo
  context a jeden z nich načítá celou historii deníku.
- Důkaz:
  - **Legacy importy: 0** ✅ — jediné storage odkazy jsou
    `StreakHistoryGraph.tsx:16` a `StreakVisualization.tsx:16`, obě přes
    **`getGratitudeStorageImpl()`** (feature-flag helper = správný vzor, ne
    legacy import).
  - **Completion rate přes sdílenou utilitu** — `HabitPerformanceIndicators`,
    `YearlyHabitOverview`, `HabitTrendAnalysis` volají
    `calculateHabitCompletionRate` ✅; `WeeklyHabitChart` a `Monthly30DayChart`
    počítají agregát inline, ale **po opravě N-4.3 už včetně bonusů** (sladěno
    ve Fázi 4) ✅.
  - **N-11.1 [⚠️ výkon]** — `StreakHistoryGraph.tsx:78` volá
    `gratitudeStorage.getAll()` (**celá historie deníku, bez omezení**) a pak
    v JS filtruje posledních 30 dní (`:85-94`). Přesně stejná třída jako
    N-7.4 (opraveno ve Fázi 7): indexovaný `getByDate()` existuje. S rostoucí
    historií se to zpomaluje při každém zobrazení Home.
  - **N-11.2 [🧹 mrtvý filtr]** — tamtéž (`:90`) se odfiltrovávají „fake
    entries" obsahující `'Streak recovery - Ad watched'`. Grep producentů:
    takové zápisy vytváří **jen legacy `gratitudeStorage.ts`** (mrtvá cesta,
    flag `USE_SQLITE_JOURNAL: true`) — v živé SQLite cestě warm-up platby žijí
    v tabulce `warm_up_payments`, ne jako zápisy do deníku. Filtr je tedy dnes
    bezúčelný (a maskoval by chybu, kdyby se takové zápisy někdy objevily).
  - Ostatní widgety berou data z kontextů (`useHabitsData`, `useGratitude`,
    `useGoals`) ✅.

### 11.4 QuickActionButtons — routes a tutoriál

- Kde: `src/components/home/QuickActionButtons.tsx:58-102`
- Pravidlo: plán 11.4 — každé tlačítko naviguje na existující route a
  respektuje tutoriál (nerozbíjí spotlight flow).
- Ověřeno jak: čtení handlerů + grep konzumentů parametru `quickAction`.
- Verdikt: ✅ **všechny 4 akce vedou na existující route a parametr je
  skutečně zpracován** (žádný „mrtvý" parametr).

| Tlačítko | Route | Konzument parametru |
|---|---|---|
| Přidat návyk | `/(tabs)/habits?quickAction=addHabit` | `HabitsScreen.tsx:99` ✅ |
| Přidat vděčnost | `/(tabs)/journal?quickAction=addGratitude` | `journal.tsx:72` ✅ |
| Přidat pochvalu | `/(tabs)/journal?quickAction=addSelfPraise` | `journal.tsx:80` ✅ |
| Přidat cíl | `/(tabs)/goals?quickAction=addGoal` | `GoalsScreen.tsx:144` ✅ |

- Tutoriál: komponenta registruje spotlight cíle přes `useTutorialTarget`
  (`:58-66`) pro `quickActions` i `addHabit` ✅; `TutorialContext` sám používá
  **tytéž** route s parametrem (`:1221`, `:1253`), takže tutoriálový flow a
  ruční klik vedou na identickou cestu — konzistentní ✅.

### 11.5 XpMultiplierSection — stav = stav služby

- Kde: `src/components/home/XpMultiplierSection.tsx:74, 143-155, 223-239`
- Pravidlo: plán 11.5 — zobrazený stav multiplikátoru = stav v
  `xpMultiplierService`, **žádná vlastní kopie odpočtu času**.
- Ověřeno jak: čtení zdroje stavu + hledání lokálního countdownu.
- Verdikt: ✅ **žádná vlastní kopie** — komponenta hodnotu jen formátuje.
- Důkaz:
  - Stav pochází výhradně z `XPMultiplierService` přes `loadData()` →
    `setActiveMultiplier(...)` (`:74`); komponenta nikde nepočítá vlastní
    zbývající čas z `Date.now()`.
  - Zobrazení času (`:223-239`) čte `activeMultiplier.timeRemaining` (hodnota
    ze služby) a jen ji převádí na text ✅.
  - Aktualizace: `setInterval(loadData, 60000)` (`:148`) + listener
    `xpMultiplierActivated` (`:151+`) — tedy re-fetch ze služby, ne lokální
    dopočet ✅.
  - Drobnost (INFO): mezi refreshi může být zobrazený zbývající čas až 60 s
    starý. Není to „vlastní odpočet", jen granularita; bez dopadu na správnost.

### 11.6 DailyMotivationalQuote — deterministická denní rotace

- Kde: `src/components/home/DailyMotivationalQuote.tsx:15, 20, 24-33`,
  `src/data/motivationalQuotes.ts:654-676`
- Pravidlo: plán 11.6 — stejný den = stejný citát; texty přes i18n.
- Ověřeno jak: čtení implementace `getDailyQuote` + kontrola `Math.random`
  v komponentě.
- Verdikt: ✅ **denní rotace je deterministická.**
- Důkaz:
  - `getDailyQuote(date, language)` (`motivationalQuotes.ts:654`): index se
    počítá jako `dateHash % availableQuotes.length`, kde
    `dateHash = součet částí data (rok+měsíc+den)` → **stejný den vždy stejný
    citát** ✅. Fallback na EN, když jazyk nemá citáty ✅.
  - Komponenta volá `getDailyQuote(today(), currentLanguage)` při mountu i při
    změně jazyka (`:15, 20`) ✅.
  - `Math.random()` (`:28`) je **jen v `handleRefreshQuote`** — explicitní
    uživatelské tlačítko „chci jiný citát", ne denní rotace ✅ (determinismus
    nenarušuje).
  - INFO: hash `rok+měsíc+den` je slabý — různá data mohou kolidovat
    (např. 21. 7. 2026 a 20. 8. 2026 dají stejný index) a na přelomu měsíce se
    index vrací zpět. Kritérium „stejný den = stejný citát" to neporušuje;
    zapsáno jen jako pozorování.

### 11.7 Theme compliance (skill `theme-validator`)

- Rozsah dle plánu: `src/components/home/` + `challenges/` + `achievements/` —
  **37 komponent** (bez testů).
- Ověřeno jak: spuštěn projektový skill `theme-validator`, všech 6 pravidel.
- Verdikt: ⚠️ **1 reálné porušení s dopadem na uživatele (N-11.3), 1 drobné
  (N-11.4); ostatní pravidla čistá** (pravidlo 3 po ověření odvoláno).

| Pravidlo | Výsledek |
|---|---|
| 2 — statický `StyleSheet.create` mimo komponentu | ✅ **0 porušení** |
| 5 — natvrdo `'white'`/`'black'` u textu | ✅ **0 porušení** |
| 6 — safe-area vzor (tab vs. modal) | ✅ `app/(tabs)/index.tsx:323` má `edges={[]}` dle vzoru pro taby |
| 1 — natvrdo zapsané barvy | ⚠️ 67 výskytů → po protřídění **~20 reálných** (viz N-11.3) |
| 4 — čistě černé `colors.background` | ⚠️ 2 výskyty (viz N-11.4) |
| 3 — stíny / elevation | ✅ **0 skutečných porušení** — `colors.shadow` je v tmavém režimu `transparent`; viz odvolané N-11.5 |

- **N-11.3 [❌ STŘEDNÍ — reálný dopad na uživatele]**: v modálech měsíčních
  výzev je **tmavý text natvrdo na pozadí řízeném motivem** → v tmavém režimu
  tmavá na tmavé = **nečitelné**.
  - `MonthlyChallengeFailureModal.tsx:280-297` — kontejner má
    `backgroundColor: colors.backgroundSecondary` (v tmavém režimu `#1C1C1E`)
    a text `color: '#991B1B'` / `'#7F1D1D'` (tmavě červená) ⇒ potvrzeno
    nečitelné.
  - `MonthlyChallengeCompletionModal.tsx:453-536` — kontejnery
    `starProgressContainer` / `streakContainer` / `nextMonthContainer` mají
    jen `borderColor` (`#FDE68A`, `#FECACA`, `#DBEAFE`) a **žádné vlastní
    pozadí**, takže dědí pozadí modalu (řízené motivem), ale text je
    `#92400E`, `#78350F`, `#991B1B`, `#7F1D1D`, `#1E40AF`, `#1E3A8A` — stejný
    problém.
  - Jde o paletu navrženou pro světlé podbarvení (styl Tailwind `bg-amber-50`
    + `text-amber-800`), kde ale podbarvení chybí.
  - **Nepočítá se jako porušení** (vyjmuto skillem, ověřeno v kontextu):
    kategoriální/brandové barvy — hvězdné úrovně (`StarLevelChangeModal.tsx:30-34`),
    rarity trofejí (`AchievementFilters.tsx:56-59`), stupně milníků
    (`MonthlyChallengeMilestoneModal.tsx:43-49`), ledově modrá u zmrzlého
    streaku (`GratitudeStreakCard.tsx:240-299`, dokumentováno v My-Journal
    guide), zlatý panel multiplikátoru (`XpMultiplierSection.tsx:367` +
    tmavý text **na tom zlatém pozadí** = čitelné v obou režimech), a bílý
    text na sytých badge/tlačítkách.
- **N-11.4 [🧹 nízká]**: `colors.background` (čistě černá, mimo 2-vrstvý
  standard) — `HomeCustomizationModal.tsx:68`, `TrophyCombinations.tsx:236`.
  Dle guide má být `backgroundSecondary`.
- **N-11.5 ❌ ODVOLÁNO (planý poplach)** — původně zapsáno jako „38 stínů
  k rozhodnutí". Po dotazu Petra („nevšiml jsem si, že by některé téma vypadalo
  špatně") ověřeno v `src/constants/colors.ts`:
  - `shadow: 'rgba(0, 0, 0, 0.1)'` ve světlém režimu (ř. 57)
  - **`shadow: 'transparent'` v tmavém režimu** (ř. 163, komentář přímo říká
    „No shadows in dark mode")
  Všech 7 „normálních" stínů používá `shadowColor: colors.shadow`, takže
  **theme systém pravidlo už vynucuje sám** — a elegantněji než plošné mazání,
  protože světlému režimu stíny zachová. Zbylé 2-3 výskyty
  (`shadowColor: rarityColor` v `AchievementCard.tsx:303-308`) jsou **záměrná
  animovaná aura** podle vzácnosti trofeje; tatáž komponenta jinde větví podle
  `isDark`, autor tedy téma řešil. Jediná technická drobnost je Android
  `elevation` (10×), která motivem řízená není — černý stín na téměř černém
  pozadí je ale prakticky neviditelný.
  ⇒ **Žádná změna, nález stažen.** Validátorovo pravidlo 3 hlásí pouhou
  přítomnost vlastností a nevidí, že barva je theme token.

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| ~~N-11.5~~ | ❌ ODVOLÁNO | Stíny — planý poplach: `colors.shadow` je v tmavém režimu `transparent`, theme systém pravidlo vynucuje sám | — | Beze změny |
| N-11.3 | ❌ **STŘEDNÍ** | Tmavý text natvrdo na pozadí řízeném motivem → v tmavém režimu nečitelné (modály výzev: reset streaku, hvězdný pokrok, příští měsíc) | `MonthlyChallengeFailureModal.tsx:285-317`, `MonthlyChallengeCompletionModal.tsx:453-536` | Nahradit `colors.text` / `colors.textSecondary`, případně semantickými (`colors.error`, `colors.warning`); rámečky ponechat nebo taky sladit |
| N-11.1 | ⚠️ výkon | `StreakHistoryGraph` načítá `getAll()` celé historie deníku kvůli grafu za 30 dní | `StreakHistoryGraph.tsx:78` | Indexovaný dotaz na rozsah / `getByDate` (stejně jako oprava N-7.4) |
| N-11.2 | 🧹 nízká | Mrtvý filtr „fake entries" (`Streak recovery - Ad watched`) — takové zápisy tvoří jen legacy cesta | `StreakHistoryGraph.tsx:90` | Smazat filtr (řešit spolu s N-11.1) |
| N-11.4 | 🧹 nízká | `colors.background` (čistě černá) mimo 2-vrstvý standard | `HomeCustomizationModal.tsx:68`, `TrophyCombinations.tsx:236` | → `colors.backgroundSecondary` |
| — | 🧹 INFO | Komentář „7+ days" vs. kód `isEstablishedHabit` = 14+ dní | `recommendationEngine.ts:157` | Opravit komentář |

**Pozitivní bez nálezu**: 10/10 typů doporučení má splnitelný trigger i funkční
cíl; jednotky completion rate správně převedené; `@home_preferences` má jediného
zapisovatele; všechny 4 quick actions mají konzumenta parametru; multiplikátor
bez vlastního odpočtu; citát dne deterministický; theme pravidla 2, 5 a 6 čistá.

## PLAN-DISCREPANCY

- Plán mluví o „16 komponentách" v `src/components/home/` — reálně **16 `.tsx`
  komponent + adresář `__tests__`** (tedy 17 položek ve výpisu). Sedí.
- Položka 11.1 předpokládá možné `RECOMMENDATION_FOLLOW` XP — v kódu **žádné
  není** (konzistentní s rozhodnutím Fáze 2 o smazání trofeje
  `recommendation-master`).

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 7 (11.1–11.7) | 7 (11.1–11.7) | ✓ |

## Rozhodnutí Petra (2026-07-21, session #16 — doslovně)

> „N11.3 - souhlasím / N11.5 - Co to může mít za dopady? Úplně jsem si nevšimnul
> že by některé theme vypadalo nějak špatně / Drobnosti: oprav podle sebe /
> K tomu XP: tady bych taky schválil mazání nebo co myslíš?"

| Nález | Rozhodnutí | Poznámka |
|---|---|---|
| N-11.3 | OPRAVIT | Text i rámečky v obou modálech na theme tokeny |
| N-11.5 | **ODVOLÁNO** | Petrův dotaz vedl k ověření — `colors.shadow` je v tmavém režimu `transparent`, takže theme systém pravidlo už vynucuje. Žádná změna, nález stažen (viz 11.7) |
| N-11.1, N-11.2, N-11.4 + komentář | OPRAVIT (Fable dle uvážení) | |
| XP za doporučení | **SCHVÁLENO smazat → Fáze 13 (13.7)** | Neimplementovat (exploit); zapsáno jako položka 13.7 v plánu vč. rozsahu |

### Rozhodnutí k `RECOMMENDATION_FOLLOW` XP

Petr se ptal, zda i tohle smazat; po vysvětlení **schválil** (2026-07-21:
„k tomu XP - souhlasím s tebou"). **Rozhodnutí: smazat, ale až ve Fázi 13**
(sběrná fáze mrtvého kódu) — a hlavně **neimplementovat**:

- **Naivní implementace by byla XP exploit**: karta doporučení je trvale na
  Home a tap na ni jen naviguje na tab. Odměnit tap = uživatel tapne, vrátí se,
  tapne znovu — 5× denně po 30 XP (denní limit z configu) = **150 XP za nic**.
- **Poctivá implementace** („uživatel doporučení skutečně následoval", tj.
  založil navržený návyk / přidal pokrok) je výrazně složitější a není v plánu.
- Trofej, která na tom stála (`recommendation-master`), už byla **smazána ve
  Fázi 2** přesně z tohoto důvodu.
- Ve Fázi 13 už je fronta mrtvého kódu z F2 (vč. `recommendations_followed`
  case a placeholderu ×0,3) — patří to tam, aby se smazalo najednou s plným
  grep ověřením, ne po kouskách.

## PROVEDENÍ OPRAV (2026-07-21)

1. **N-11.3 ✅ PROVEDENO** — tmavý text natvrdo → theme tokeny:
   - `MonthlyChallengeCompletionModal.tsx`: sekce hvězdného pokroku, streaku,
     příštího měsíce a odměn — nadpisy `colors.text`, popisky
     `colors.textSecondary`, akcenty `colors.warning` / `colors.error`,
     rámečky `colors.warning` / `colors.error` / `colors.primary` /
     `colors.success`, oddělovač `colors.border`.
   - `MonthlyChallengeFailureModal.tsx`: sekce resetu streaku i příštího měsíce
     stejným způsobem; navíc **ternární blok** `starSection`/`starTitle`/
     `starArrow`/`starDescription` (ř. 244-274), který jsem při prvním čtení
     přehlédl — tam byla stejná chyba zapsaná podmínkou.
   - **Ponecháno záměrně** (kategoriální/brandové identifikátory, ověřeno
     v kontextu): barvy kategorií výzev (`#22C55E` habits, `#3B82F6` journal,
     `#F59E0B` goals, `#8B5CF6` consistency), barvy hvězdných úrovní, konfety,
     bílý text na sytých tlačítkách.
2. **N-11.1 + N-11.2 ✅ PROVEDENO** — `StreakHistoryGraph.tsx`: `getAll()`
   (celá historie) nahrazeno **30 indexovanými `countByDate()` dotazy paralelně**
   (`Promise.all`); mrtvý filtr „Streak recovery - Ad watched" odstraněn
   i s vysvětlením proč (produkuje ho jen legacy cesta; v SQLite žijí warm-up
   platby v `warm_up_payments`).
3. **N-11.4 ✅ PROVEDENO** — `HomeCustomizationModal.tsx:68` a
   `TrophyCombinations.tsx:236`: `colors.background` (čistě černá) →
   `colors.backgroundSecondary` (2-vrstvý standard).
4. **Komentář ✅** — `recommendationEngine.ts:157` „7+ days" → „isEstablishedHabit
   = 14+ days".
5. **N-11.5** — bez zásahu (odvoláno).

### Verifikace

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 464 passed, 464 total (31/31 suites)
```

## Stav: HOTOVO (2026-07-21) — audit 7/7 položek ✓, N-11.1/11.2/11.3/11.4 + komentář provedeny, N-11.5 odvoláno po ověření, XP za doporučení → Fáze 13. 11.2 device ověření zůstává ve frontě.
