# Design Lab → ostrá appka: rozcestník převodu 1:1

*Založeno 2026-10-24 na Petrovo přání: „až test vyladíme, převádíme 1:1 – ať neopakujeme chyby".*

**Jak to používat:** před převodem obrazovky si přečti řádek jejího souboru tady, pak blok
`GOING LIVE (1:1)` na začátku souboru a nakonec pravidla v **`premium-design-plan.md` → kapitola 10
„Poučení z laboratoře"** (čísla pravidel `P#` níže odkazují tam). Rozhodnutí `R-#` jsou v kapitole 7.

## Tři věci, které platí pro všechno

1. **Převádí se VZHLED a POHYB, ne data a logika.** `habitsMock.tsx`, `mockCopy.ts` a čísla v `MOCK_STATS`
   jsou jen kulisy. Skutečná appka má vlastní ověřenou logiku (XP, série, párování make-up, pauzy) –
   ta se **nepřepisuje podle laboratoře**, laboratoř se napojí na ni.
2. **Texty z `mockCopy.ts` jdou do `src/locales` (EN/DE/ES) jako klíče** a před převodem je schválí Petr
   (pravidlo i18n v `technical-guides.md`). Laboratoř má jen EN/DE – **ES chybí všude**.
3. **Každá obrazovka = jeden commit, snímky před/po, `tsc` + `npm test`** (plán F3–F4). Průvodce
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
| `habitsMock.tsx`, `mockCopy.ts` | **nic** | – | kulisy laboratoře |
| `DesignLabScreen.tsx`, `app/design-lab.tsx`, `src/config/designLab.ts` | **nic** (nebo zůstane jako vývojový nástroj – F5) | – | nikdy v obchodní verzi (test `designLab.test.ts`) |
