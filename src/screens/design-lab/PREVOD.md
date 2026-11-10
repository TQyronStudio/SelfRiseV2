# Design Lab → ostrá appka: rozcestník převodu 1:1

*Založeno 2026-10-24 na Petrovo přání: „až test vyladíme, převádíme 1:1 – ať neopakujeme chyby".*

**Jak to používat:** před převodem obrazovky si přečti řádek jejího souboru tady, pak blok
`GOING LIVE (1:1)` na začátku souboru a nakonec pravidla v **`premium-design-plan.md` → kapitola 10
„Poučení z laboratoře"** (čísla pravidel `P#` níže odkazují tam). Rozhodnutí `R-#` jsou v kapitole 7.

## Čtyři věci, které platí pro všechno

1. **Převádí se VZHLED a POHYB, ne data a logika.** `habitsMock.tsx`, `mockCopy.ts` a čísla v `MOCK_STATS`
   jsou jen kulisy. Skutečná appka má vlastní ověřenou logiku (XP, série, párování make-up, pauzy) –
   ta se **nepřepisuje podle laboratoře**, laboratoř se napojí na ni.
2. **Texty z `mockCopy.ts` jdou do `src/locales` (EN/DE/ES) jako klíče** a před převodem je schválí Petr
   (pravidlo i18n v `technical-guides.md`). Laboratoř má jen EN/DE – **ES chybí všude**.
3. **Sdílené prvky převádět v jejich nativní podobě** (`PressableScale`, `RollingNumber`, pruhy) – běžné reakce
   UI běží na nativním ovladači, ne na Reanimated (P46). `labPerf.tsx` se nepřevádí, volání `measureLabPerf`
   odstranit.
4. **Každá obrazovka = jeden commit, snímky před/po, `tsc` + `npm test`** (plán F3–F4). Průvodce
   dotčené oblasti se aktualizuje ve stejném commitu (CLAUDE.md pravidlo 10).

## Soubor po souboru

| Soubor laboratoře | Kam ve skutečné appce | Převést | NEpřevádět / pozor |
|---|---|---|---|
| `labTokens.ts` | nové `src/design/` (F2), postupně nahradí `src/constants/colors.ts` | paletu, typografii, mezery, zaoblení, pohyb, `onHabitColor()` | staré `colors` mazat až nic nečte (F5); tokeny ověřit testem kontrastu (P-kontrast v kap. 4.1) |
| `labPrimitives.tsx` | sdílené komponenty (např. `src/components/ui/`) | `LabText`→`AppText`, `Surface`, `PressableScale`, `ProgressBar`, `DayArc`, `CheckButton`, `Chip`… | `LabThemeProvider` nahradí rozšířený `useTheme()`; `crown` přepínač je jen pro laboratoř (P1–P5) |
| `scrollChoreography.tsx` | sdílené pro všechny obrazovky s kartami | `ScrollCard` + nativní rolování | **rolování jen přes `Animated.event` + `useNativeDriver`** (P1), **karty bez průhlednosti** (P2), „vidět" drží karta (P3) |
| `introTimeline.tsx` | start appky (`app/_layout.tsx`), jen po **R-9** | časová osa, `settle` náběh | opona jen 1× denně ze studeného startu, nesmí se potkat s ATT/UMP ani úvodem (`technical-guides:Startup-Orchestrator.md`) |
| `HomeConcept.tsx` | `app/(tabs)/index.tsx` + `src/components/home/*` | rozložení, hrdina dne, kompaktní hlavička | pořadí bloků zůstává uživatelovo (`HomeCustomizationContext`) – R-4b; data z kontextů, ne mock |
| `xpFlight.tsx` | nahradí souhrnnou lištu (`XpAnimationContext`, `XpNotification`) – jen po **R-10** | odznak úrovně, jiskry, náraz do kroužku | zdroj každého XP musí nést **bod původu** (událost `xpGained`); XP mimo obrazovku letí ze středu; pravidla dávkování z `technical-guides:Gamification-UI.md` (P12–P17) |
| `AchievementCelebrationConcept.tsx` | `src/components/achievements/AchievementCelebrationModal.tsx` | celý vzhled a průběh | **zůstává jedním oknem z `ModalQueueContext`** (invariant fronty), XP až po „Continue" |
| `RollingNumber.tsx` | sdílená komponenta | 1:1 | jen tabulkové číslice (Figtree), ne Fraunces |
| `StreakFlame.tsx` | `src/components/home/GratitudeStreakCard.tsx` (+ deník) | Lottie oheň/led/zahřátí | stav (oheň/led) z `GratitudeContext` – led = zmrzlá série, zahřátí = zaplacený dluh / Start Fresh (`technical-guides:My-Journal.md`), ne ťuknutí |
| `JournalDetailConcept.tsx` | přechod do záložky Deník | „karta roste do detailu" | je to změna navigace → **R-4** |
| `HabitsConcept.tsx` | `src/screens/habits/HabitsScreen.tsx`, `HabitListWithCompletion`, `HabitItemWithCompletion` | týden, „dnes" s dílky, karty, sekce Bonus/Pozastavené, mini-týden | **pulz z úvodu** (`highlight` v `HabitCompletionButton`) zachovat; „⋯" = **R-4c**; XP hodnoty z appky, ne konstanty laboratoře |
| `HabitDetailConcept.tsx` | `HabitCalendarView` / statistiky návyku | kalendář, tvary stavů, oblouček páru, vysvětlení dne | stavy brát z `useHabitsData` / `habitImmutability` (skutečné párování) – **R-11**; průvodce `Habits.md` „UI Display Rules" přepsat |
| `HabitsReorderConcept.tsx` | režim řazení v `HabitsScreen` | vzhled řádků, čísla pořadí | už používá skutečnou `ReorderableList` – pravidla řazení beze změny |
| `HabitComposerConcept.tsx` | `HabitForm` / `HabitModal` (tvorba i úprava) | sheet s živým náhledem, předvolby, dny | validace a texty už jsou z `HabitForm` – při převodu sdílet, ne kopírovat; ikony jen z `HABIT_ICON_MAP` |
| `JournalConcept.tsx` | `app/(tabs)/journal.tsx` + `src/components/gratitude/*` | „Dnes", bonusová cesta, dlaždice, citát, seznam | pořadí obrazovky podle průvodce (P33); splnění dne na místě = **R-13**; zámek zmrzlé série a ohřátí v Deníku = **R-14**, pojistka Debt Gate v ukládání zůstává (P31); data z `GratitudeContext` |
| `journalParts.tsx` | `GratitudeInput` + `EditGratitudeModal` (jeden sheet), `GratitudeList` (karta), oslava ⭐🔥👑 v `CelebrationModal` | sheet nad klávesnicí, karta záznamu, potvrzení | sheet se zvedá o změřený překryv klávesnice (P30); XP záznamu ukládá vrstva úložiště – obrazovka jen ukazuje let; okno ⭐🔥👑 zůstává jedno z `ModalQueueContext` |
| `JournalHistoryConcept.tsx` | `app/journal-history.tsx` | měsíční kalendář, panel dne, hledání se zvýrazněním | **R-15**; ❄ dny z `warmUpPayments`; výsledky hledání dál ve `FlatList` (audit N9) |
| `JournalStatsConcept.tsx` | `app/journal-stats.tsx` | série, 4 čísla, graf 30 dní, poměr typů, ⭐🔥👑 | **nekopírovat text „aktivní dny" z laboratoře – opravit klíč `daysWithEntries` (P29)**; barvy grafu jako samostatná paleta grafů v tokenech (P32) |
| `GoalsConcept.tsx` | `src/screens/goals/GoalsScreen.tsx` + `GoalListWithDragAndDrop` | přehled, čára termínů, karty, sekce Splněné | data z `useGoalsData`; 4 ikony na kartě → „⋯“ (R-4c); šablony do okna (R-19); cíl úvodu `add-goal-button` na „+“; řazení dál přes `ReorderableList` |
| `goalParts.tsx` | `GoalItem`, `ProgressModal` + `ProgressEntryForm`, `GoalCompletionModal` | karta s pruhem (zářezy, ryska plánu), rychlé zápisy + Zpět, panel zápisu s klávesnicí, okno dokončení | zápis přes `addProgress` (XP, milníky, dokončení dělá úložiště); Zpět = smazání zápisu (existující cesta); okno dokončení zůstává jedno z `ModalQueueContext` (P36) |
| `GoalDetailConcept.tsx` | `app/goal-stats.tsx` (`GoalStatsCard`, `ProgressTrendAnalysis`, `GoalCompletionPredictions`, `ProgressHistoryList`) | kruh, fakta tempa, graf „Ty a plán“, milníky, historie | tempo z jedné funkce v `goalCalculations.ts` (**R-17**, P37); jeden cíl = jeden graf (P38) |
| `GoalComposerConcept.tsx` | `GoalModal` + `GoalForm` + `TargetDateStepSelectionModal` + `GoalTemplatesModal` | okno s náhledem, nápady, druh, termín s kalendářem | validace sdílet s `GoalForm` (strop `MAX_GOAL_VALUE` už platí, **nula u „Messen“ přijde s R-16**, P41); šablony přes `useGoalTemplates()`; druh „Messen“ = **R-16** (změna dat + migrace); termín = **R-19** (přepsat průvodce Goals.md) |
| `SettingsConcept.tsx` | `app/(tabs)/settings.tsx` + `NotificationSettings` | karta „Ty“, náhledy vzhledu, jazyk, připomínky, sekce | **R-23** (bez karty úrovně, Petr 2026-10-31); logika beze změny: `ThemeContext`, jazyk, `notificationService` **včetně pruhu „oznámení vypnutá“**, reset tutoriálu; „Privacy Settings“ jen když `isPrivacyOptionsRequired()`; vývojářské řádky zůstávají jen ve vývoji |
| `TrophyRoomConcept.tsx` | `app/achievements.tsx` + `src/components/achievements/*` | jedna místnost, medaile, zeď s filtry, listy trofeje a sbírky | **R-22**; sbírky a bonus už v ostré appce fungují (`trophyCollections.ts`); stav z `AchievementStorage`/`AchievementService`, průběh hromadně (`batchUserStats`), ne po kartách; tajné trofeje skryté i v hledání (P50) |
| `OnboardingConcept.tsx` | `src/components/onboarding/*` + `OnboardingPreferencesModal` | nebe, „Tvůj první den" s pěti políčky, dlaždice, krok vděčnosti, závěr jako vrchol, připomínky nakonec | **R-24 až R-27**; **`Tutorial.md` nejdřív upravit**: pravidlo 3 (trofeje až na závěru) a „Přeskočit" jen kroku, tok bez návyku nemá krok odškrtnutí. Dál platí: žádný `<Modal>`, klíče úložiště beze změny, strop a validace z `goalDraft`. Události trychtýře: `onb_notifications` se přesouvá, vděčnost je nová (`firstDayEvents.ts` + analytický průvodce). Vděčnost přes skutečné `createGratitude`. Systémové okno připomínek jen s prázdnou obrazovkou (`Startup-Orchestrator.md`) |
| `habitsMock.tsx`, `journalMock.tsx`, `goalsMock.tsx`, `trophiesMock.ts`, `mockCopy.ts` | **nic** | – | kulisy laboratoře |
| `DesignLabScreen.tsx`, `app/design-lab.tsx`, `src/config/designLab.ts` | **nic** (nebo zůstane jako vývojový nástroj – F5) | – | nikdy v obchodní verzi (test `designLab.test.ts`) |
