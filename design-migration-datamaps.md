# Mapy dat pro etapy E5–E16 (krok 0.2/3 plánu převodu)

*Sepsáno 2026-11-23 nad větví `design-v2` (po E4). Podklad: karty E5–E10 v `design-migration-plan.md`, hlavičky `GOING LIVE` souborů laboratoře, řádky v `src/screens/design-lab/PREVOD.md` a ostrý kód. Každý odkaz `soubor:řádek` je ověřený čtením kódu.*
*E11–E16 doplněny 2026-11-24 (po E5) stejným postupem; mají i vlastní tabulku událostí.*

Ke každé hodnotě a akci, kterou obrazovka laboratoře bere z kulis (`habitsMock`, `mockCopy`, `MOCK_STATS`, `multiplierMock`, `useLabXp`, `useLabToday` …), je tu napsané, odkud ji vezme ostrá appka.
**Legenda:** ✅ zdroj existuje beze změny · ⚠️ zdroj existuje, ale liší se číslo, pravidlo nebo formát (popsáno; **platí appka**) · ❌ zdroj chybí → **zastavit a zeptat se Petra** (plán 0.3).
Texty z `MOCK_COPY` tu nejsou rozepsané – patří do soupisu textů (krok 0.2/2); uvedené jsou jen existující klíče locales, které laboratoř už čte.
Kde karta etapy výslovně přikazuje doplnit událost nebo klíč, je řádek ⚠️ s poznámkou „karta přidává“ – to není důvod zastavit.

---

## E5 – Návyky: seznam (pilot)

Zdroj: `src/screens/design-lab/HabitsConcept.tsx`, kulisy `habitsMock.tsx`. Cíl: `src/screens/habits/HabitsScreen.tsx` + `src/components/habits/*`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Seznam návyků `LAB_HABITS` + vytvořené `created` (`HabitsConcept.tsx:123-129`) | `useHabitsData().habits` (seřazené podle `order`) – `src/hooks/useHabitsData.ts:12-22`; nad tím `useHabits().state.habits` – `src/contexts/HabitsContext.tsx:380` | ✅ | `Habit.name` je jeden řetězec (laboratoř `Record<lang>`), ikona je klíč `HabitIcon` → `getHabitIonicon()` `src/constants/habitIcons.ts:50`, barva `HabitColor` → paleta návyků v `src/design/tokens.ts` |
| Pořadí `order` (`HabitsConcept.tsx:117`) | `Habit.order`, řazení v `useHabitsData.ts:13` | ✅ | |
| Pozastavené / aktivní `isPaused(x, today, today)` (`:130-131`) | `Habit.isActive` (`src/types/habit.ts:8`) – seznam dnes dělí `HabitListWithCompletion.tsx:55-61`; pro konkrétní den `isHabitActiveOnDate()` `src/utils/habitImmutability.ts:139` | ✅ | pauza = `isActive: false` + otevřené období v `pausePeriods` |
| „Dnes v plánu“ / „Bonus“ `isScheduled(x, today)` (`:132-133`) | `habit.scheduledDays.includes(getDayOfWeek(dnes))` – stejné pravidlo `DailyHabitProgress.tsx:31-36` a `HabitItemWithCompletion.tsx:150-155`; pro minulé dny `wasScheduledOnDate()` `habitImmutability.ts:93` (historie rozvrhu + pauzy) | ✅ | ostrý seznam dnes sekci Bonus nemá (jen „aktivní / neaktivní“) – rozdělení je nové zobrazení, ne nové pravidlo |
| Splněno dnes `done[id]` (`useLabToday`, `habitsMock.tsx:299-327`) | `completions.find(c => c.habitId === id && c.date === today())` – jako `HabitListWithCompletion.tsx:65-75`; datum `today()` `src/utils/date.ts:58` | ✅ | |
| Počet „x/y“ `doneToday / planned.length` (`:134`, `:376`, `:412`) | výpočet `DailyHabitProgress.tsx:40-54` (aktivní + plánované dnes, splněné z dnešních záznamů) | ✅ | |
| **Čip „+N XP“ dnešních návyků** `xpToday = planned×25 + bonus×15` (`:135-137`, `:381`) | **žádná veřejná funkce.** Denní XP za návyky leží v `xp_daily_summary.habit_xp`, čte je jen soukromá `getDailyXPData()` (`src/services/gamificationService.ts:2233`, mapování `:2240-2265`). Veřejná je jen `getTodayXP()` (`:2220`) = **všechny zdroje dohromady** | ❌ | počítat z konstant by lhalo (násobič, denní strop). Možnosti pro Petra: (a) nová čtecí funkce v `GamificationService` (sahá na službu), (b) čip vynechat, (c) ukázat celkové dnešní XP – jiný význam |
| Týdenní pruh: podíl splněného za den (`WeekStrip`, `:491-520`) | data: `getHabitCompletionsWithConversion(id)` `useHabitsData.ts:31` + `wasScheduledOnDate` + `isHabitActiveOnDate`; vzorec „splněno + zachráněno / plánováno“ je nová čistá funkce | ✅ | `applySmartBonusConversion` (`useHabitsData.ts:267-400`) vrací vynechaný den jen v týdnech, kde je aspoň jeden záznam – vynechaný den musí obrazovka odvodit sama (plánovaný, minulý, ≥ den vytvoření, bez záznamu), stejně jako `HabitCalendarView.tsx:314` |
| Stav dne v mini‑týdnu `statusesFor()` → `done/makeup/bonus/missed/covered/paused/planned/todayOpen` (`habitsMock.tsx:232-293`, volání `HabitsConcept.tsx:667-670`) | `getHabitCompletionsWithConversion()` (`isConverted`, `convertedFromDate`, `isCovered`) + pravidla tvaru jako `HabitCalendarView.tsx:301-314`; pauza `isHabitPausedOnDate()` `habitImmutability.ts:113` | ✅ | párování 1:1, nejstarší vynechaný první, jen minulé dny – shodné s laboratoří. Zakrytý den nenese odkaz zpět (`convertedToDate` se u `covered-…` nevyplňuje, `useHabitsData.ts:367-376`) → pár dohledat obráceně přes `convertedFromDate` |
| „Náhrada · kryje út“ `makeupFor` (`:672-681`, `:773`) | dnešní záznam s `isConverted && convertedFromDate` z `getHabitCompletionsWithConversion()` | ✅ | ukáže se až po odškrtnutí – stejně jako v laboratoři |
| **Série na kartě „🔥 N“** `habit.streak` (`:784`) | `getHabitStats(id).currentStreak` – `useHabitsData.ts:110-172`, výpočet `calculateCurrentStreak` `:174-195` | ⚠️ | **jiné pravidlo:** appka počítá po sobě jdoucí **kalendářní** dny se záznamem (průvodce `Habits.md:419-444`), ne plánované dny. Návyk Po·St·Pá má sérii nejvýš 1; dokud dnes není odškrtnuto, je série **0**, i když včera navazovalo. Laboratoř ukazuje „Číst (Po·St·Pá) 6“ – to appka neumí. Navíc `getHabitStats` prochází všechny dny od vytvoření → drahé volat na každé kartě (P42). Rozhodnout s Petrem: ukázat appkovou hodnotu, nebo sérii na kartě nekreslit |
| Rozvrh „Každý den / Po · St · Pá“ (`:702-713`) | `habit.scheduledDays: DayOfWeek[]` (řetězce `'monday'…`, `src/types/common.ts:4-12`) | ✅ | formát: laboratoř má čísla 0–6; text „Every day/Jeden Tag“ je v laboratoři natvrdo → locales |
| Pozastaveno N dní `h.pausedFor(habit.pausedDaysAgo)` (`:1117`) | otevřené období v `habit.pausePeriods` (`types/habit.ts:15-26`, načítá `SQLiteHabitStorage.attachPausePeriods` `:702`) → `daysBetween(startDate, today())` `utils/date.ts:128` | ⚠️ | pauza zadaná v den, kdy už byl návyk odškrtnutý, začíná **zítra** (`SQLiteHabitStorage.ts:663-689`) → první den vyjde „0“ nebo záporné číslo; ošetřit zobrazením |
| Pulz úvodu `highlight` (`:239`, prop `onboardingHabit`, `asking`) | `useTutorial().onboardingHabitId` + `state.onboardingScreen === 3` → `HabitItemWithCompletion.tsx:78-87`, `:393`; pulz v `HabitCompletionButton.tsx:29-37` | ✅ | musí zůstat 1:1 (karta „nesmí se rozbít“) |
| Příjezd nové karty `freshId` (`:466-468`) | id z návratu `actions.createHabit()` `HabitsContext.tsx:187-225` | ✅ | |
| **Akce: odškrtnout / zrušit** `toggle(habit.id)` (`:833`) | `useHabits().actions.toggleCompletion(habitId, date, isBonus)` `HabitsContext.tsx:263-328` (optimistické); `isBonus = !scheduledDays.includes(den)` jako `HabitItemWithCompletion.tsx:144-160`; obsluha chyb `HabitsScreen.handleToggleCompletion` `:177-189` | ✅ | XP připisuje úložiště: `SQLiteHabitStorage.createCompletion` `:390-400`, odečet `deleteCompletion` `:504-516` |
| XP odškrtnutí `XP_SCHEDULED = 25`, `XP_BONUS = 15` (`:92-93`, `:715`) | `XP_REWARDS.HABIT.SCHEDULED_COMPLETION` / `BONUS_COMPLETION` `src/constants/gamification.ts:16-17` | ⚠️ | čísla sedí (25/15), ale **skutečně připsané** může být jiné: násobič (`gamificationService.ts:737-738`) a denní strop návyků (`xpLimits.ts:74-76`). V E5 se XP ukazuje postaru (karta bod 5); od E7 brát číslo z události `xpGained.amount`, ne z konstanty |
| Bublina „+25“ a jiskry `award()` (`:840-850`) | od E7: událost `xpGained` (`src/utils/appEvents.ts:27-34`, posílá `gamificationService.ts:2455-2474`) | ⚠️ | v E5 se nezapojuje (souhrnná lišta zůstává); zaškrtávátko si jen změří polohu (karta bod 5) |
| **Akce „⋯“ → Kalendář** (`:1251-1255`) | dnes `HabitsScreen.handleViewHabitStats` `:192-194` (`router.push('/habit-stats…')`) → v E6 nový detail | ✅ | trasa se ruší (O-11), v E5 může vést ještě na starou |
| **Akce „⋯“ → Upravit** (`:1257-1261`, v laboratoři bez funkce) | `HabitsScreen.handleEditHabit` `:125-128` → `HabitModal` → `handleSubmitHabit` `:135-147` → `actions.updateHabit` `HabitsContext.tsx:227` | ✅ | |
| **Akce „⋯“ → Pozastavit** (`:1263-1267`, bez funkce) | `HabitsScreen.handleToggleActive(id, false)` `:159-166` → `actions.updateHabit(id, { isActive })` → `SQLiteHabitStorage.update` `:171-174` → `recordPauseChange` `:663` | ✅ | |
| **Akce „⋯“ → Smazat** (`:1269-1273`, bez potvrzení) | potvrzení `ConfirmationModal` `HabitItemWithCompletion.tsx:518` → `HabitsScreen.handleDeleteHabit` `:149-157` → `actions.deleteHabit` `HabitsContext.tsx:246` | ✅ | potvrzení zůstává (podle 7.9 jako nové okno `ConfirmSheet`, `src/components/ui/sheets.tsx:252`) |
| **Akce Obnovit** u pozastaveného (`:1122`, bez funkce) | `HabitsScreen.handleToggleActive(id, true)` `:159-166` | ✅ | |
| Akce Přidat (otevře skladatel) | `HabitsScreen.handleAddHabit` `:120-123`; rychlá akce z Home `?quickAction=addHabit` `:109-118` | ✅ | parametr musí otevřít nový sheet (karta „nesmí se rozbít“) |
| Akce Řadit (`setReordering`) | `HabitsScreen.handleEditPress` `:197-199`, konec při odchodu `:100-102` | ✅ | |
| Nápověda u bonusu (`HelpTooltip habits.bonusConversion`) | `HabitItemWithCompletion.tsx:430` | ✅ | podle 7.10 zaniká (karta) |

**Rozdíly laboratoř × appka (platí appka)**
- **Série návyku** = kalendářní dny za sebou, ne plánované dny; ráno před odškrtnutím 0 (`useHabitsData.ts:174-195`). Laboratorní čísla (12, 24, 6 …) u návyků bez denního rozvrhu appka nikdy neukáže.
- **XP za odškrtnutí** je 25/15 jen bez násobiče a pod denním stropem; skutečné číslo nese `xpGained.amount`.
- Vynechaný den: appka ho v převedených záznamech vrací jen pro týdny s aspoň jedním záznamem – obrazovka ho musí odvodit sama (stejně jako dnešní kalendář).
- Pauza zadaná po dnešním odškrtnutí začíná zítra (počet dní pauzy).
- Dnešní karta `HabitItemWithCompletion` čte celý `useHabits().state` (`:79`) – karta etapy (bod 6) chce, aby karta dostala svůj stav vlastností; jde o zásah do cílového souboru, ne do logiky.

**Chybí zdroj (zastavit)**
- ❌ Čip „+N XP“ dnešních návyků – appka nemá veřejné „XP za návyky dnes“.

**Sliby, které ověřit**
- „+25 / +15 XP“ – platí `SQLiteHabitStorage.createCompletion:390-400` → `GamificationService.addXP`; číslo se může změnit násobičem a stropem.
- „Náhrada · kryje út“ – plní `applySmartBonusConversion` (`useHabitsData.ts:267`); XP za náhradu se nepřidává (zůstává bonusových 15) – obrazovka nesmí slibovat víc.
- Za sérii návyku se nic nevyplácí (O-1; `HABIT_STREAK_MILESTONE` v `Habits.md:277-286` je „FUTURE“, `SQLiteHabitStorage` ho nevolá) – nic takového nekreslit.

---

## E6 – Návyky: detail, tvorba a úprava, řazení

Zdroj: `HabitDetailConcept.tsx`, `HabitComposerConcept.tsx`, `HabitsReorderConcept.tsx`. Cíl: `HabitCalendarView`, `HabitModal`, `HabitForm`, `ColorPicker`, `IconPicker`, `DayPicker`, režim řazení v `HabitsScreen`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Stavy dnů měsíce `statusesFor(habit, monthStart, monthEnd…)` (`HabitDetailConcept.tsx:164-168`) | `getHabitCompletionsWithConversion()` `useHabitsData.ts:31` + `wasScheduledOnDate` + `isHabitPausedOnDate`; pravidla tvaru `HabitCalendarView.tsx:301-314` | ✅ | stejné jako E5 |
| Oblouček páru `pairKey` (`:600-602`) | záchrana: `completion.convertedFromDate`; zachráněný den: obráceně podle `convertedFromDate` | ✅ | `covered-…` záznam nemá odkaz na zachránce (`useHabitsData.ts:367-376`) |
| Vysvětlení dne `describe()` (`:200-224`) | stejná data; texty nové (locales) | ✅ | |
| První dostupný měsíc `habit.createdDaysAgo` (`:146`) | `habit.createdAt` | ✅ | |
| **Současná / nejlepší série** `habit.streak`, `habit.best` (`:313`, `:319`) | `getHabitStats(id).currentStreak / longestStreak` `useHabitsData.ts:168-169` | ⚠️ | kalendářní dny (viz E5); nejlepší série taky kalendářní |
| **Úspěšnost** `rate` – posledních 30 dní, (splněno + zachráněno) / (to + vynechané), strop 100 % (`:170-190`) | `getHabitStats(id).completionRate` `useHabitsData.ts:151-157` → `calculateHabitCompletionRate` `src/utils/habitCalculations.ts:41-69` | ⚠️ | **jiný vzorec:** appka = všechny splnění (vč. bonusů a náhrad) / plánované dny **od vytvoření**, na 1 desetinné místo, **smí být nad 100 %** (PREVOD: „míra je vzorec appky“). Laboratorní „30 dní, max 100 %“ neplatí |
| Legenda kalendáře | klíče `habits.calendar.legendCompleted/Makeup/Missed/Paused/Scheduled` (laboratoř je už čte, `:418-445`; ostře `HabitCalendarView.tsx:135-169`) | ✅ | |
| Nápověda „nahrazený den“ `HelpLink topic="makeUp"` (`:447`) | dnes `HelpTooltip helpKey="habits.makeupFunction"` `HabitCalendarView.tsx:414`; téma `makeUp` je nové (7.10, `labHelp.tsx:53`) | ⚠️ | hostitel nápovědy podle 7.10 – v ostré appce zatím není |
| Detail roste z karty | `DetailFrame` `src/components/ui/DetailFrame.tsx:67` (E4) | ✅ | místo `router.push('/habit-stats…')` `HabitsScreen.tsx:193` |
| Skladatel: předvolby `HABIT_PRESETS` (`HabitComposerConcept.tsx:408-436`) | `src/constants/habitPresets.ts:42-48` | ✅ | už skutečné |
| Ikony `ICONS = Object.values(HABIT_ICON_MAP)` (`:82`) | `HABIT_ICON_MAP` `src/constants/habitIcons.ts:25` | ⚠️ | formát: laboratoř drží jméno Ionicons, appka ukládá klíč `HabitIcon` – při uložení převést zpět na klíč |
| Barvy `COLORS` (8) (`:72-81`) | `HabitColor` (8) `src/types/common.ts:15-24` | ✅ | |
| Dny `days` 0–6 (`:106`) | `scheduledDays: DayOfWeek[]` (`CreateHabitInput` `types/habit.ts:60-66`) | ⚠️ | formát (čísla ↔ řetězce) |
| **Validace** 2–50 znaků, ≥ 1 den, popis ≤ 200 + texty `habits.form.errors.*` (`:187-197`) | `HabitForm.validateForm` `src/components/habits/HabitForm.tsx:72-93` (stejná pravidla a klíče) | ⚠️ | pravidla sedí, ale funkce je **vnitřní** v komponentě – „sdílet, nekopírovat“ znamená vytáhnout ji z `HabitForm` (cílový soubor etapy) |
| **Akce Vytvořit** `onCreate(habit)` (`:208-218`, `HabitsConcept.tsx:463-469`) | `HabitsScreen.handleSubmitHabit` `:135-147` → `actions.createHabit` `HabitsContext.tsx:187` (kontrola trofejí na pozadí `:200-215`) | ✅ | |
| **Akce Uložit úpravu** (laboratoř úpravu nemá) | `actions.updateHabit` `HabitsContext.tsx:227`; změna dnů zapíše historii rozvrhu `SQLiteHabitStorage.ts:123-170` | ✅ | vzhled úpravy = týž sheet s předvyplněním (plán E6 bod 2) |
| Chyba uložení | `HabitsScreen.tsx:144` a `HabitForm.tsx:107` dnes ukazují `error.message` | ⚠️ | podle `systemScreens` řádku PREVOD: `error.message` nikdy neukazovat |
| Vytvoření návyku z úvodu | `FirstHabitScreen.tsx:112` → `createWithTrophyGate` `src/components/onboarding/createWithTrophyGate.ts:28` | ✅ | nesmí se rozbít |
| **Řazení** `onReorder(ids)` (`HabitsReorderConcept.tsx:116-125`) | `ReorderableList` `src/components/common/ReorderableList.tsx:35` → `HabitsScreen.handleReorderHabits` `:168-175` → `actions.updateHabitOrder` `HabitsContext.tsx:330` | ⚠️ | **jiné pravidlo:** laboratoř řadí i pozastavené (řádek „⏸“, `:150`, `:178`); appka řadí **jen aktivní** (`HabitListWithCompletion.tsx:204` nad `activeHabits`, úchyt jen u aktivních `HabitItemWithCompletion.tsx:468`). Formát: appka dává `{id, order}[]`, laboratoř pole id |
| Číslo pořadí řádku | index v `activeHabits` | ✅ | |

**Rozdíly laboratoř × appka (platí appka)**
- Úspěšnost: appka = vše od vytvoření, bonusy se počítají, může být > 100 %; laboratoř = 30 dní a strop 100 %.
- Série v detailu: kalendářní dny (viz E5).
- Řazení: pozastavené návyky se v appce neřadí.
- Ikona se ukládá jako klíč `HabitIcon`, dny jako `DayOfWeek`.

**Chybí zdroj (zastavit)** – nic.

**Sliby, které ověřit**
- Detail ani skladatel nesliboval XP. Úspěšnost „N %“ = `calculateHabitCompletionRate`; číslo laboratoře se nesmí převzít.

---

## E7 – Jádro XP: odznak a jiskry (R-10)

Zdroj: `xpFlight.tsx` (`LabXpProvider`, `LevelBadge`, `XpPop`). Cíl: `XpAnimationContext.tsx`, `RootProvider.tsx`, `app/_layout.tsx`, `src/components/gamification/`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Startovní XP `LAB_START_XP` (`xpFlight.tsx:105`, `:186-191`) | `GamificationService.getTotalXP()` `gamificationService.ts:1464` | ✅ | při startu a návratu z pozadí: zobrazené = skutečné (karta) |
| Úroveň a kroužek `getXPProgress(xp)` (`:116-118`, `:191`) | `getXPProgress` `src/services/levelCalculation.ts:201`, `getCurrentLevel` `:172` | ✅ | laboratoř už volá skutečnou funkci |
| Přírůstek `award(amount, from)` (`:338-361`) | událost `xpGained` (`appEvents.ts:27-34`); posílá `gamificationService.ts:2455-2474` (běžné XP), `achievementService.ts:620-624` a `:873-877` (trofeje), `trophyCollectionService.ts:66-70` (sbírky), `marketingDemoDataService.ts:1330`, `:1374` | ✅ | připsání proběhlo už v úložišti – let je jen zobrazení |
| Bod původu `from` (`:340`) | dnes jen výchozí `position: {x:50,y:130}` `gamificationService.ts:2469` (nerozlišitelné od skutečného) | ⚠️ | karta přidává obrazovkový registr `registerXpOrigin`; služby beze změny |
| `source`, `sourceId`, `metadata` v `xpGained` | běžné XP: všechno (`gamificationService.ts:2463-2470`) | ⚠️ | **trofeje a sbírky posílají jen `amount`, `source`, `timestamp`** (`achievementService.ts:620-624`, `:873-877`; `trophyCollectionService.ts:66-70`) – karta bod 2 je doplní (nic neodebírat; `monthlyProgressIntegration.ts:114` poslouchá) |
| Odebrání XP (záporné, bez letu) (`:341-344`) | `subtractXP` → `triggerXPAnimation(-effectiveAmount…)` `gamificationService.ts:1262` | ✅ | |
| Přidržení u momentu: trofej | `source === ACHIEVEMENT_UNLOCK` | ✅ | ale viz chybějící `sourceId` výše |
| Přidržení: dokončení výzvy (ne milník) | `MONTHLY_CHALLENGE` + `metadata.type === 'monthly_challenge_completion'` `monthlyProgressTracker.ts:1588-1597`; milník má `'monthly_challenge_milestone'` `:1462-1467` | ✅ | |
| Přidržení: dokončení cíle | `GOAL_COMPLETION`, `sourceId = goal.id` `SQLiteGoalStorage.ts:569-573` | ✅ | |
| Přidržení: série deníku | `JOURNAL_STREAK_MILESTONE`, `metadata.streakDays` `SQLiteGratitudeStorage.ts:1322-1326` | ✅ | |
| Přidržení: milníková část ⭐🔥👑 | jedna transakce `JOURNAL_BONUS_MILESTONE` s `metadata.baseXp` a `metadata.milestoneXp` `SQLiteGratitudeStorage.ts:308-317` | ⚠️ | `metadata` nese částky **před** násobičem a stropem; `amount` je výsledná. Rozdělení „základ hned / milník přidržet“ počítat poměrem z `amount`, ne z metadat |
| Přidržení: bonus za návrat 25 XP | `addXP(COMEBACK_BONUS, { source: 'xp_multiplier_bonus', metadata.type: 'inactive_user_return_bonus' })` `xpMultiplierService.ts:1122-1140` | ⚠️ | **v seznamu přidržení karty E7 chybí**, přitom E9 chce, aby 25 XP letělo z oznámení „Vítej zpět“. Navíc se připisuje **při startu appky** (`appInitializationService.ts:297`) – a při startu se zobrazené srovná se skutečným, takže by nebylo co poslat. Rozhodnout pořadí |
| Nová úroveň `levelUpKey`, štítek LEVEL UP (`:230-234`) | událost `levelUp` – `gamificationService.ts:955-966` (za každou úroveň zvlášť, `previousLevel`), `achievementService.ts:629-640`, `trophyCollectionService.ts` | ✅ | potlačení během úvodu `XpAnimationContext.handleLevelUp` `:214-248` zůstává |
| XP během úvodu přidržet | `isTutorialActive()` `src/contexts/TutorialContext.tsx:476` | ✅ | |
| Značka násobiče `mark` „2×“ (`xpFlight.tsx:641-644`) | `XPMultiplierService.getActiveMultiplier()` `.isActive/.multiplier` `xpMultiplierService.ts:593-666` | ✅ | |
| Zlatá tečka „připraveno“ | `calculateHarmonyStreak().canActivateMultiplier` `xpMultiplierService.ts:203-246` | ✅ | |
| Kdy značku přepočítat | `xpMultiplierActivated` (`appEvents.ts:51-56`): harmonie `:895-911`, kombo `:1297`, výzva `:1452` | ⚠️ | konec násobiče žádnou událost nemá (jen čas `expiresAt`) → odznak si hlídá čas sám; zapnutí po návratu dnes **nic neposílá** (`activateInactiveUserBoost` `:1069`) – karta E9 přidává |
| Demo data (marketing) | `xpGained` s `amount: 0` a novým `totalXP` `marketingDemoDataService.ts:1330-1335`, `:1374-1379` | ⚠️ | účetní funkce musí na tuhle událost srovnat zobrazené se skutečným (jinak odznak ukáže staré XP) |
| Souhrnná lišta a bubliny (odpojit) | `XpAnimationContext.tsx:186-208` (`xpGained` → `showXpPopup`, `xpSmartNotification`, `xpBatchCommitted`) | ✅ | |

**Rozdíly laboratoř × appka (platí appka)**
- Laboratoř připisuje XP až při dopadu; appka hned v úložišti – odznak ukazuje „zobrazené XP“ (karta to už říká).
- Částka v `metadata` deníku je před násobičem, `amount` po něm.
- Trofeje a sbírky dnes neposílají `sourceId`/`metadata` – registr původu je u nich musí najít podle druhu zdroje (karta: záznam mladší 3 s) nebo je služba doplní.

**Chybí zdroj (zastavit)** – nic; ale **zeptat se** na bonus za návrat (přidržení × srovnání při startu).

**Sliby, které ověřit**
- Odznak slibuje „co vidíš, to máš“: účetní rovnice `zobrazené + ve vzduchu + přidržené = getTotalXP()` – jediná pravda je `getTotalXP()`.
- Štítek násobiče ukazuje faktor, který opravdu běží – `getActiveMultiplier().multiplier` (2 / 1,5 / 2,5 / 2).

---

## E8 – Momenty: jedna oslava na akci, tichá oznámení, velké okno trofeje (R-29)

Zdroj: `celebrationDirector.tsx`, `AchievementCelebrationConcept.tsx` (kulisy `trophiesMock.ts`, scénáře `CELEBRATION_SCENARIOS`). Cíl: `ModalQueueContext.tsx`, `AchievementContext.tsx`, `AchievementCelebrationModal.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Dávka trofejí jedné akce `celebrate(batch)` (`celebrationDirector.tsx:236-238`) | `achievementUnlocked` za každou trofej + `multipleAchievementsUnlocked` (> 1) – `achievementService.ts:1313-1333`; dnes je poslouchá `AchievementContext.tsx:372-422` | ✅ | sběrač dávky je nový (karta). Duplicitní zařazení dnes odfiltruje fronta `ModalQueueContext.tsx:124-133` |
| Trofej: jméno, popis, ikona (`labTrophy` `:137-149`) | `achievement.nameKey / descriptionKey / icon` v datech události (`CORE_ACHIEVEMENTS`) | ✅ | |
| **Vzácnost** (`labTrophy(id, rarity)` – podle nového katalogu R-28) | `achievement.rarity` z dnešního katalogu `src/constants/achievementCatalog.ts` | ⚠️ | dnes 5 common / 18 rare / 27 epic / 25 legendary → **52 ze 75 trofejí otevře velké okno**. Příklady: `streak-champion` laboratoř rare, appka **epic**; `loyalty-month-explorer` rare → **epic**; `weekly-warrior` common → **rare** (karta bod 5 to předvídá) |
| **XP trofeje** `ACHIEVEMENT_XP_REWARDS[rarity]` (`:146`), součet `momentXp` (`:165-171`) | per trofej `xpAwarded: achievement.xpReward` (`achievementService.ts:1315`) = katalog; **skutečně připsané** jen v `xpGained` (`ACHIEVEMENT_UNLOCK`, `amount = actualXPAwarded`, `:597-624`) a u > 1 v `multipleAchievementsUnlocked.totalXP` (`:1327`) | ⚠️ | katalogová částka ≠ připsaná: násobič ji zvětší, odmítnuté `addXP` ji vynuluje (`:592-605`). Okno má ukázat **připsanou** částku (dávka = `xpGained` téže dávky) |
| Filtr úvodu (jen `first-habit`, `first-goal`) | `AchievementContext.addToCelebrationQueue` `:337-348` | ✅ | zachovat |
| Zavření okna → brána úvodu | `achievementCelebrationClosed` z `ModalQueueContext.closeCurrentModal` `:172-174`; čeká `src/utils/tutorialAchievementGate.ts` | ✅ | |
| Velké okno = hlava fronty | `ModalQueueContext.enqueue` (připnutá hlava) `:105-161`, priorita `ModalPriority.ACHIEVEMENT = 6` `:40-48` | ⚠️ | řadicí funkce `byPriority` je **uvnitř** `enqueue` (`:134-138`); `src/contexts/__tests__/modalQueueOrdering.test.ts` testuje kopii → nejdřív vyvézt (karta bod 3) |
| Výstup fronty | `ModalRenderer` uvnitř `ModalQueueProvider` `:177-184` | ✅ | přesun do vrstvy 4 (karta 3a) |
| Ťuknutí na tiché oznámení → Síň trofejí (`onOpen`) | `router.push('/achievements')` (vzor `app/(tabs)/index.tsx:180`; trasa `app/achievements.tsx`) | ✅ | |
| Tiché oznámení s akcí `LabNote.action` (`:90-104`), `ACTION_HOLD_MS = 5000`, `PLAIN_HOLD_MS = 3000` (`:542-544`) | nové – žádná data | ✅ | konstanty vzhledu, přenáší se s komponentou |
| **Kombo trofejí** `boost` (`MomentBoost` `:110-114`) | `checkAndActivateAchievementCombo()` `xpMultiplierService.ts:1203` (volá `achievementService.ts:647` a `:900`) → `xpMultiplierActivated` se `source: 'achievement'` `:1297-1301`; faktor a hodiny `XP_MULTIPLIERS.ACHIEVEMENT_COMBO_MULTIPLIER / _DURATION` `gamification.ts:262`, `:267` | ⚠️ | **zdroj se v appce jmenuje `'achievement'`**, ne `'achievement_combo'` (`multiplierLogic.ts:110-114`) – převést. **Časování:** událost přijde až po `await` (popředí, `:647`), na pozadí se zkontroluje **dřív**, než za 500 ms dorazí oznámení trofejí (`:866-903`) → sběrač musí počkat oběma směry. Dnes kombo řadí okno `multiplier_activation` v `XpMultiplierSection.tsx:152-168` – pro kombo už ne |
| Dávka otevře kapitolu (předat E10) | `levelUp` z `achievementService.ts:629-641` (`previousLevel`, `newLevel`) hned po `xpGained` téže dávky | ✅ | všechny tři události jdou synchronně za sebou v jednom průchodu (`:614-641`) |

**Rozdíly laboratoř × appka (platí appka)**
- Vzácnost a XP trofejí z dnešního katalogu, ne z R-28 – velkých oken bude výrazně víc (52/75).
- Ukázané XP = připsané (`xpGained`), ne katalogové.
- **„Jedna akce“ není v appce jeden okamžik:** XP odškrtnutí se připíše hned, trofeje se kontrolují až v nečinnosti (`requestIdleCallback`, `gamificationService.ts:900-921`) a kombo ještě později. Sběrač musí sbírat v časovém okně, ne v jednom tiku.
- Kombo nese zdroj `'achievement'`, výzva `'weekly_challenge'` (`xpMultiplierService.ts:1429`).

**Chybí zdroj (zastavit)** – nic.

**Sliby, které ověřit**
- „+N XP“ ve velkém okně a v pilulce → `achievementService.ts:597-624` (`actualXPAwarded`).
- „2,5× XP na 6 h“ u komba → `activateAchievementComboMultiplier` `xpMultiplierService.ts:1247` + `XP_MULTIPLIERS`; řádek jen když se kombo opravdu zapnulo (událost), ne podle počtu trofejí.
- Bonus za zapnutí komba neexistuje (O-16, `xpMultiplierService.ts:1286`) – neukazovat.

---

## E9 – Panel úrovně a přehled úrovní (R-31)

Zdroj: `levelPanel.tsx`, `levelPanelLogic.ts`, `LevelsOverviewConcept.tsx`, `levelsJourney.ts`, kulisa `multiplierMock.tsx`, `MOCK_STATS`. Cíl: vrstva odznaku, `src/screens/levels/LevelsOverviewScreen.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| XP a úroveň `settledXp` (`levelPanel.tsx:283-285`) | zobrazené XP z E7 (účetní funkce); skutečné `getTotalXP()` `gamificationService.ts:1464` | ✅ | závisí na E7 |
| Název úrovně `getLevelInfo(level).title` (`:286`) | `getLevelInfo` `levelCalculation.ts:278` | ⚠️ | názvy jen anglicky natvrdo (`getLevelTitle` `:302-330`, P61–P62) – stejné jako v laboratoři, ale v DE/ES zůstanou anglicky |
| „Do další úrovně“ `xpToNextLevel` (`:287-290`) | `getXPProgress().xpToNextLevel` `levelCalculation.ts:201` | ✅ | |
| **„Dnes“** `MOCK_STATS.xpToday + (settledXp − LAB_START_XP)` (`:293`, `:430`; `mockCopy.ts:73-75`) | `GamificationService.getTodayXP()` `gamificationService.ts:2220-2228` (O-9) | ✅ | čistý zisk, nikdy záporný; po `xpGained` načíst znovu |
| Násobič běží: faktor, zbývající čas (`levelPanel.tsx:488-503`) | `getActiveMultiplier().multiplier`, `.timeRemaining` / `.expiresAt` `xpMultiplierService.ts:593-666` | ✅ | |
| Připraveno (`status.kind === 'ready'`) | `calculateHarmonyStreak().canActivateMultiplier` `:203-246` | ✅ | `activateHarmonyMultiplier` stejně odmítne, když už běží jiný násobič (`:505-512`) |
| Dny harmonie (7 dílků) | `calculateHarmonyStreak().currentStreak` | ✅ | čte nejvýš 30 dní (`getRecentActivityData(30…)` `:209`); dnešek se nezapočte, dokud není hotový, ale sérii nepřeruší (`:384-406`) – shodné s laboratoří |
| Ochranná lhůta „Další za N dní“ `cooldownDays` (`:531-533`) | `calculateHarmonyStreak().nextActivationDate` (`cooldownEndsAt`, `:235-241`) → `ceil((datum − teď)/24 h)` | ✅ | |
| Dnešní tři (návyk / 3 záznamy / krok cíle) `today.*` (`multiplierMock.tsx:88-97`, `levelPanel.tsx:511-513`) | `calculateHarmonyStreak().streakHistory[0].hasHabitActivity / hasJournalActivity / hasGoalActivity` (`DailyActivityData` `xpMultiplierService.ts:35-43`; index 0 = dnes `:280-300`) | ✅ | pravidla: ≥ 1 splnění návyku (i bonus), ≥ 3 záznamy, ≥ 1 zápis cíle s hodnotou > 0 (`:290-294`, `:367`) |
| Konstanty harmonie (7, 2×, 24 h, 168 h) | `XP_MULTIPLIERS` `src/constants/gamification.ts:257-276` | ✅ | |
| **Akce Zapnout 2× na 24 h** `multiplier.activate()` (`levelPanel.tsx:436-439`) | `XPMultiplierService.activateHarmonyMultiplier()` `xpMultiplierService.ts:500-585` (bez bonusu, O-10) → `xpMultiplierActivated` `:895-911` | ✅ | dnes volá `XpMultiplierSection.handleActivateMultiplier` `:186-210` a `XpMultiplierIndicator.tsx:316` |
| Oznámení „připraveno“ jednou na připravení – klíč (`multiplierMock.tsx:163-176`) | `calculateHarmonyStreak().streakStartDate` `:226-233` + **nový klíč v AsyncStorage** (D-9) | ⚠️ | klíč zatím neexistuje – karta ho přidává (D-9 ✅, bez migrace) |
| „Vítej zpět · 2× na 48 h“ + 25 XP (`multiplierMock.tsx:143-152`) | `activateInactiveUserBoost()` `xpMultiplierService.ts:1069-1175`, volá `appInitializationService.ts:297` | ⚠️ | **dnes žádná událost** – karta přidává `xpMultiplierActivated` se zdrojem `inactive_user_return`. 2× a 48 h jsou místní konstanty služby (`:1098`, `:1106`) → karta je přesouvá do `XP_MULTIPLIERS`. Bonus `XP_REWARDS.SPECIAL.COMEBACK_BONUS` je připsaný před zapnutím (`:1119-1140`) – viz otázka u E7 |
| Kombo / výzva v `boostOf` (`multiplierLogic.ts:121-144`) | zdroje `'achievement'` (`:1274`) a `'weekly_challenge'` (`:1429`), typ `ActiveMultiplierInfo.source` `:62-70` | ⚠️ | jména zdrojů se liší od laboratoře (`achievement_combo`, `challenge_completion`) – mapovat |
| Nápověda `HelpLink topic="multiplier"` (`levelPanel.tsx:528`) | dnes klíč `home.xpSystem` (`src/constants/helpTopics.ts:73`); téma `multiplier` je nové (7.10, `labHelp.tsx:57`) | ⚠️ | hostitel nápovědy podle 7.10 |
| **Akce „Všechny úrovně“** `onOpenLevels` (`:445-449`) | `router.push('/levels-overview')` (vzor `OptimizedXpProgressBar.tsx:591`; trasa `app/levels-overview.tsx`) | ✅ | |
| Panel jen na pěti záložkách, nic otevřeného (`useLabCovered`) | `useOverlayCovered()` `src/components/ui/overlayRegistry.ts:56` (E4) + trasa (navigace) + moment z E8 | ✅ | |
| Odstranit sekci násobiče a časovač | `XpMultiplierSection` `app/(tabs)/index.tsx:221-222`; `MultiplierCountdownTimer` `:291` | ✅ | `XpMultiplierSection` dnes řadí okno pro kombo a výzvu (`:152-168`) – náhrada podle L-11 ve stejné etapě |
| Přehled: úroveň uživatele `settledXp` (`LevelsOverviewConcept.tsx:104-107`) | dnes `getGamificationStats().totalXP` `LevelsOverviewScreen.tsx:44-46`; nově zobrazené XP z E7 | ✅ | |
| Přehled: XP úrovně `getXPRequiredForLevel` (`:393`) | `levelCalculation.ts:85` | ✅ | |
| Přehled: šest stupňů `LEVEL_TIERS` 1–10/11–20/21–40/41–60/61–80/81–100 (`levelsJourney.ts:27-34`) | totéž v `LevelsOverviewScreen.tsx:77-92` a `technical-guides:Gamification-UI.md:35-151`; barvy `tier` `src/design/tokens.ts:425` | ✅ | |
| Přehled: názvy stupňů | `gamification.levels.overview.rarity.*` (`src/locales/en/index.ts:3092-3099`) | ✅ | |
| Přehled: milníková úroveň `isLevelMilestone` / `nextMilestone` (`levelsJourney.ts:84-89`) | `LEVEL_PROGRESSION.MILESTONE_LEVELS = [10,25,50,75,100]` `gamification.ts:248`; `isLevelMilestone` `levelCalculation.ts:381`, `getNextMilestone` `:391` | ✅ | |
| Přehled: trofej u milníku `trophyKeyAt` (`LevelsOverviewConcept.tsx:70-78`) | `CORE_ACHIEVEMENTS` s podmínkou `level`: 10 `level-up`, 25 `selfrise-expert`, 50 `selfrise-master`, 100 `ultimate-selfrise-legend` (`isSecret: true`, `achievementCatalog.ts:878-894`) | ✅ | 75 nemá trofej, 100 je tajná – laboratoř to tak dělá |

**Rozdíly laboratoř × appka (platí appka)**
- Názvy zdrojů násobiče: `'achievement'` a `'weekly_challenge'`.
- Názvy úrovní jen anglicky (beze změny – rozhodnutí P61–P62 mimo tuto etapu).
- Konec násobiče neposílá událost; panel i odznak musí počítat z `expiresAt`.

**Chybí zdroj (zastavit)** – nic (událost návratu a klíč D-9 karta výslovně přidává).

**Sliby, které ověřit**
- „Zapnout 2× XP na 24 h“ → `activateHarmonyMultiplier` (`multiplier: XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER`, `expiresAt = teď + HARMONY_STREAK_DURATION h`, `:530-544`); po zapnutí lhůta 168 h (`:556`).
- „Vítej zpět“ + 25 XP → `activateInactiveUserBoost` (`:1122-1140`) – vyplácí se, jen dnes o tom uživatel neví.
- „Dnes +N XP“ → `getTodayXP()` (test `__tests__/services/gamification/TodayXP.test.ts`).
- Milník úrovně jmenuje jen skutečnou netajnou trofej; „odměny za milníky“ (`gamification.milestoneRewards`) neexistují (P49) – nepřevádět.

---

## E10 – Ostatní okna oslav

Zdroj: `goalParts.tsx` (`GoalDoneMoment`), `journalParts.tsx` (`MilestoneMoment`), `otherMoments.tsx`, `momentRules.ts`. Cíl: `GoalCompletionModal`, `CelebrationModal`, `MultiplierActivationModal`, posluchač `levelUp` v `XpAnimationContext`, `app/(tabs)/journal.tsx`, `GoalsScreen.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Cíl: název, cíl, jednotka (`goalParts.tsx:1004-1144`) | `props.goal` z `GoalsScreen.tsx:244-255` (`freshGoal = goalStorage.getById`) – `Goal.title/targetValue/unit` `src/types/goal.ts:19-31` | ✅ | |
| Cíl: „hotovo za N dní“ `goal.startDate` (`:1024-1026`) | `Goal.startDate` → `Goal.completedDate` (`DateString`) | ✅ | |
| Cíl: věta `goals.completion.message1–5` (`:1028`) | stejné klíče (`src/locales/en/index.ts:1267-1271`; dnes náhodně `GoalCompletionModal.tsx` `getCompletionMessage`) | ✅ | |
| **Cíl: ikona a barva** `goal.icon` (`:1103`), z `CATEGORY_LOOK` v kulisách (`goalsMock.tsx:38-48`) | `Goal.category` (klíče sedí, `types/goal.ts:10-17`), ale **mapa kategorie → ikona/barva v appce není** (ani v `src/design/tokens.ts`); dnešní okno má emoji podle kategorie | ❌ | podle 7.7 „funkce z kulis bez obdoby → zastavit“. Návrh: přesunout `CATEGORY_LOOK` do konstant/tokenů (patří i k E14) – rozhodne Petr |
| **Cíl: XP** `completionXp(goal)` = 350 při cíli ≥ 10 000, jinak 250 (`:1018`, `:1144`; `goalsMock.tsx:116-120`) | výplata `SQLiteGoalStorage.ts:567-573` (stejné pravidlo) | ⚠️ | laboratoř sedí s úložištěm; **dnešní okno lže:** `GoalCompletionModal.tsx:205` ukazuje vždy `XP_REWARDS.GOALS.GOAL_COMPLETION` (250), i u velkého cíle (350). Navíc násobič. Číslo brát z `xpGained` (`GOAL_COMPLETION`, `sourceId = goal.id`) |
| Kdy okno cíle | `GoalsScreen.handleSubmitProgress` `:229-270` (porovná stav před/po, uloží `goal_completion_celebrations_shown`) | ✅ | |
| ⭐🔥👑: druh a texty `journal.bonusMilestone{1,5,10}_title/_text` (`journalParts.tsx:1233`, `:1324-1331`) | stejné klíče (`locales/en/index.ts:608-613`); spouští `journal.tsx:129-148` při `bonusCount` 1/5/10 (= pozice 4/8/13) | ✅ | |
| **⭐🔥👑: XP** `milestoneXp(position)` 25/50/100 (`journalMock.tsx:229-238`) | výplata `SQLiteGratitudeStorage.getMilestoneXP` `:360-366` (25/50/100 z `XP_REWARDS.JOURNAL`) | ⚠️ | čísla sedí; **`journal.tsx:133` je má natvrdo** (`25 : 50 : 100`) a násobič je zvětší. Brát `metadata.milestoneXp` / poměr z `xpGained.amount` (viz E7) |
| Série deníku: okno nebo tiché oznámení `streakMomentSize(days)` (`momentRules.ts:36-44`) | délky `JOURNAL_STREAK_MILESTONES` `src/utils/journalStreakMilestones.ts:13-19` (laboratoř je čte) | ✅ | spouští `journal.tsx:108-124` |
| Série deníku: texty `streakWords` (`otherMoments.tsx:67-84`) | `getJournalStreakMilestoneTexts` `journalStreakMilestones.ts:50` (stejné klíče, laboratoř odřízne emoji) | ✅ | |
| **Série deníku: XP** `getJournalStreakReward(days)` (`otherMoments.tsx:117`, `:387`) | výplata `SQLiteGratitudeStorage.awardStreakReward` `:1309-1326` (7/21/30/100/365) | ⚠️ | délky s oknem (7/30/100/365/1000) a s výplatou (7/21/30/100/365) se liší záměrně: 21 dní = tiché oznámení s +100 XP, 1000 dní = okno bez XP – laboratoř to tak má. Násobič částku zvětší → ukázat `xpGained.amount` (`JOURNAL_STREAK_MILESTONE`) |
| Série deníku: délka série | `state.streakInfo.currentStreak` v `journal.tsx:111-112` | ⚠️ | **ověřit:** čte se ze zachyceného stavu po `await actions.refreshStats()` uvnitř `setTimeout` – může jít o hodnotu před obnovením. Nejde o vzhled; jen nepřevzít naslepo |
| Kapitola: vstup do stupně `tierEntered(prev, new)` (`momentRules.ts:24-33`) | událost `levelUp` (`newLevel`, `previousLevel`) – posluchač `XpAnimationContext.handleLevelUp` `:214-248` | ✅ | víc úrovní naráz = víc událostí po jedné (`gamificationService.ts:950-967`) – pravidlo funguje po krocích |
| Kapitola: název úrovně, pruh stupňů (`otherMoments.tsx:294-316`) | `getLevelInfo(level).title`; barvy `tier` `src/design/tokens.ts:425`; `tierFill` z `levelsJourney` (přenáší E9) | ✅ | |
| Kapitola s trofejemi `chapterOfAction(xpBefore, xp)` (`momentRules.ts:53-61`, `otherMoments.tsx:127-143`) | dávka z E8 + `levelUp` z `achievementService.ts:629-640` (`previousLevel`/`newLevel`) | ⚠️ | laboratoř počítá z „XP před“ + katalogové XP trofejí; appka dává rovnou `previousLevel/newLevel` připsaného XP → stačí `tierEntered`. **Pozor:** kapitolu může otevřít už XP samotného odškrtnutí (jeho `levelUp` jde z `gamificationService.ts:966` dřív, než se trofeje vůbec zkontrolují) – pak trofeje přijdou zvlášť a „jedno okno“ nevznikne. Rozhodnout, zda sběrač počká na trofeje |
| Kapitola: „jednou přeskočit“ `chaptersShown` (`otherMoments.tsx:94-103`) | nový stav v posluchači `levelUp` (karta) | ✅ | |
| Demo data: `levelUp` bez `levelTitle` (`marketingDemoDataService.ts:1336-1340`) | dnešní posluchač ho zahodí (`XpAnimationContext.tsx:216` vyžaduje `levelTitle`) | ⚠️ | nové pravidlo nesmí z načtení dema udělat okno kapitoly |
| Násobič: faktor, hodiny, 7 dní (`otherMoments.tsx:483-540`, `XP_MULTIPLIERS`) | výsledek `activateHarmonyMultiplier().multiplier` (`multiplier`, `expiresAt`) – stejná čísla z `XP_MULTIPLIERS` | ✅ | spouští panel / oznámení z E9 (ne `XpMultiplierSection`) |
| Násobič: dlaždice bonusového XP | `MultiplierActivationModal` prop `bonusXP` (`:54`, `:92`) | ✅ | neukazovat – bonus neexistuje (O-10, O-16) |
| **Akce Pokračovat** (všechna okna) | `ModalQueueContext.closeCurrentModal` `:162-176` | ✅ | od E7 uvolní přidržené XP |

**Rozdíly laboratoř × appka (platí appka)**
- XP v oknech: laboratoř bere konstantu, appka může připsat víc (násobič) – ukázat připsanou částku.
- Kapitola + trofeje: v appce dvě oddělené vlny (odškrtnutí → později trofeje); laboratorní `chapterOfAction` nad katalogovým XP nahradí `tierEntered(previousLevel, newLevel)` z události trofejí.
- Dnešní okno cíle ukazuje 250 i u velkého cíle (350) – chyba ostré appky, nový vzhled ji nesmí převzít.

**Chybí zdroj (zastavit)**
- ❌ Ikona/barva cíle podle kategorie (`CATEGORY_LOOK`) žije jen v kulisách.

**Sliby, které ověřit**
- „+250 / +350 XP“ za cíl → `SQLiteGoalStorage.ts:567-573` (×násobič); dnešní `GoalCompletionModal.tsx:205` slib neplní u velkých cílů.
- „+25/+50/+100 XP“ ⭐🔥👑 → `SQLiteGratitudeStorage.ts:292-317`, `:360-366`.
- XP série deníku → `awardStreakReward` (jednou na běh série, tabulka `journal_streak_rewards`).
- Okno násobiče: „2× XP na 24 h“ → `activateHarmonyMultiplier`; žádné bonusové XP.

---

## E11 – Home

*Doplněno 2026-11-24.* Zdroj: `HomeConcept.tsx`, `HabitStatsConcept.tsx` + `homeChartsLogic.ts`, `HomeSectionsConcept.tsx` + `homeLayoutLogic.ts`, `WarmUpControls` v `journalParts.tsx`; kulisy `MOCK_HABITS`/`MOCK_STATS` (`mockCopy.ts`), `useLabToday` (`habitsMock.tsx`), `useLabJournal` (`journalMock.tsx`), `useLabChallenge` (`challengeMock.tsx`), `mockYear` (`homeChartsMock.ts`). Cíl: `app/(tabs)/index.tsx`, `src/components/home/*`, `HomeCustomizationContext`, `src/types/homeCustomization.ts`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Dnešní návyky v hrdinovi, na oblouku a v sekci `MOCK_HABITS` + `useLabToday().done` (`HomeConcept.tsx:163`, `:197-198`, `:366-373`, `:663-673`) | `useHabitsData().getHabitsByDate(today())` (`src/hooks/useHabitsData.ts:67-101`: bez dnů v pauze, `isCompleted` z převedených záznamů) + plán dne `wasScheduledOnDate()` – stejně jako dnešní `QuickActionButtons.tsx:45-54` | ⚠️ | **jiné pravidlo:** laboratoř bere do „x/y“ všech 5 návyků bez ohledu na rozvrh (Po·St·Pá je „v plánu“ i ve čtvrtek); appka = jen naplánované dnes. Nenaplánované (bonusové) návyky dnešní Home neukazuje – rozhodnout, jestli je nová sekce ukáže. Dnešní Home ukazuje jen nesplněné a nejvýš 3 (`:51-54`), nová sekce všechny |
| Počet „x/y“ `copy.habitsDone(doneCount, total)` (`:579`) | spočítat z řádku nahoře | ✅ | P60: jen v hrdinovi a kompaktní hlavičce |
| Den bez naplánovaných návyků | – (laboratoř má vždy 5; `dayProgress = initialDone / total` `:228` by dělilo nulou) | ⚠️ | prázdný stav hrdiny v laboratoři chybí – nový uživatel nebo volný den ho uvidí |
| **Akce odškrtnout** `toggle(habit.id)` (`:670`; `HabitRow` `:1205-1228`) | `HomeScreen.handleHabitToggle` `app/(tabs)/index.tsx:189-198` → `actions.toggleCompletion(habitId, today(), false)` `src/contexts/HabitsContext.tsx:263` | ⚠️ | `isBonus` je natvrdo `false` – dnes nevadí (Home ukazuje jen naplánované). Ukáže-li nová sekce i nenaplánované, počítat `isBonus` jako `HabitItemWithCompletion.tsx:144-160` |
| Bublina „+25“ `XP_PER_HABIT = 25` (`:141`, `:1208`) | událost `xpGained` (`amount`) – posílá `gamificationService.ts:897`, při odečtu záporně `:1262` | ⚠️ | konstanta laboratoře platí i pro bonus (appka 15) a nezná násobič ani strop – číslo z události (E7) |
| **Čip „+N XP dnes“** `MOCK_STATS.xpToday + …` (`:200`, `:597-606`) | `GamificationService.getTodayXP()` `src/services/gamificationService.ts:2220-2228` (O-9); znovu načíst po `xpGained` jako `src/components/habits/list/HabitsListView.tsx:189-205` | ✅ | `xpGained` chodí i při odebrání XP (`:1262`), čip tedy klesne i po zrušení odškrtnutí |
| Pozdrav podle denní doby `getDaypart` + `copy.greeting` (`:202-203`) | `getDaypart()` `src/design/tokens.ts:309` (s testem); texty → locales (R-6) | ✅ | |
| Horní řádek: Trofeje (`:470-477`) | `router.push('/achievements')` `index.tsx:296-301` | ✅ | |
| Horní řádek: Přizpůsobit (`:478-484`) | `DeviceEventEmitter.emit('openHomeCustomization')` `index.tsx:302-306`, posluchač `:61-72` | ✅ | událost musí zůstat (karta „nesmí se rozbít“) |
| **Rychlé akce** `QuickTile` bez `onPress` (`:620-647`, komponenta `:1273-1300`) | `QuickActionButtons.tsx:56-70` → `/(tabs)/habits?quickAction=addHabit`, `/(tabs)/journal?quickAction=addGratitude` / `addSelfPraise`, `/(tabs)/goals?quickAction=addGoal` | ✅ | nápověda `home.quickActions` (`:163`) zaniká (7.10) |
| Karta série: číslo `journal.streak` (`:168`, `:727-745`) | `useGratitude().state.streakInfo.currentStreak` (`src/contexts/GratitudeContext.tsx:12`, plní `refreshStats` `:204-215`) | ✅ | |
| Plamen oheň / led / zahřátí `flame` (`:168`, `:723`) | led = `streakInfo.isFrozen` (`src/types/gratitude.ts:22`); zahřátí = `justUnfrozeToday` (`:24`, nastaví `SQLiteGratitudeStorage.ts:1459` po posledním zaplaceném dni) | ⚠️ | laboratoř zahřívá v okamžiku poslední platby; `justUnfrozeToday` platí **celý den** → obrazovka si musí pamatovat, že zahřátí už přehrála (jinak každé otevření = nové zahřátí). Start Fresh: `currentStreak 0`, `isFrozen false` |
| Dny dluhu (vločka → slunce) a „x/y“ `frozen.days`, `frozen.paid` (`:778-789`; `WarmUpControls` `journalParts.tsx:412-500`) | `actions.getWarmUpPaymentProgress()` `GratitudeContext.tsx:276-295` → `SQLiteGratitudeStorage.ts:1508-1541` (`totalMissedDays`, `paidDays`, `paidDates`, `unpaidDates`) | ⚠️ | **formát:** `streakInfo.frozenDays` je jen **nezaplacený zbytek** (klesá s každou reklamou, `:855-897`) – na „x/y“ nestačí. Dnešní `StreakWarmUpModal.tsx:372-377` dává do `frozenMessage` `count: frozenDays` (zbytek), laboratoř `count: frozen.days` (celkem). Text: plurál se řídí `count`, ale „Watch {{adsNeeded}} ad“ má jiné číslo → „frozen for 2 days. Watch 1 ads“ (`locales/en/index.ts:817-818`) – do soupisu textů |
| **Akce Zahřát (reklama)** `setAd(true)` → `journal.payWarmUpDay` (`:787`, `:1062-1068`) | `JournalStreakCard.handleWatchAd` `src/components/home/GratitudeStreakCard.tsx:409-472`: `adService.showRewardedAd()` `:421` → `actions.applySingleWarmUpPayment()` `:450` (`GratitudeContext.tsx:254-265` → `SQLiteGratitudeStorage.ts:1380-1404`); po poslední platbě `handleDebtComplete` `:474-536` (`refreshStats`, kontrola zbytku, `executeForceResetDebt` `:543-576`) | ⚠️ | přestěhovat do hooku (5b). **Sdílený stav Home ↔ Deník:** `applySingleWarmUpPayment` v kontextu **schválně nevolá `refreshStats`** (`GratitudeContext.tsx:256-257`) a karta drží postup jen v místním `adsWatched` (`GratitudeStreakCard.tsx:454`) → zaplacený den se v `state.streakInfo` objeví až po `handleDebtComplete`. Má-li být „zaplacený den na Home hned vidět v Deníku“ (5c), hook musí po každé platbě obnovit sdílený stav |
| Chyby reklamy (`adDismissed`, `adLoadFailed`, `adError`) | `GratitudeStreakCard.tsx:428-444`, `:464-467` (okno `WarmUpErrorModal` `:710-718`) | ✅ | → `ProblemNote` (D-11, karta bod 8); texty `journal.rescue.*` existují |
| **Akce Začít znovu** `ConfirmSheet` → `journal.startFresh` (`:1050-1059`) | `actions.resetStreak()` `GratitudeContext.tsx:297-305` → `SQLiteGratitudeStorage.resetStreak` `:1543-1590` | ✅ | maže **všechny** platby ohřátí (`:1581`) – viz E13 |
| `?openDebtModal=true` | `index.tsx:101-112` → `triggerDebtModal` `GratitudeStreakCard.tsx:51-58` | ✅ | do E12, pak zrušit na obou koncích |
| Dnešní záznamy (3 tečky, „N dnes“) `journal.todayCount` (`:803-823`) | `actions.getGratitudesByDate(today()).length` `GratitudeContext.tsx:193-202` | ✅ | |
| ⭐🔥👑 na kartě `journal.stats.stars/flames/crowns` (`:826-837`) | `streakInfo.starCount/flameCount/crownCount` = počet dnů s ≥ 4 / 8 / 13 záznamy (`SQLiteGratitudeStorage.calculateMilestoneCounters` `:779-806`) | ✅ | stejné pravidlo jako `journalMock.tsx:360-362` |
| Akce „Napsat“ (bez `onPress`, `:841-856`) | `router.push('/(tabs)/journal?quickAction=addGratitude')` (`QuickActionButtons.tsx:60-62`, posluchač `journal.tsx:75-93`) | ✅ | při zmrzlé sérii skryté (5c) |
| Ťuk na kartu série `openJournal` (`:697`; detail `JournalDetailConcept`) | `handleStreakPress` `index.tsx:168-171` (`router.push('/(tabs)/journal')`) | ✅ | „karta roste do detailu“ je změna navigace (R-4, PREVOD) – v E11 zůstává přechod do záložky |
| Karta výzvy `useLabChallenge()` (`:183-196`, `:870-962`) | `MonthlyChallengeSection` (`loadMonthlyChallenge` `src/components/challenges/MonthlyChallengeSection.tsx:275-330`: `MonthlyChallengeService.getCurrentChallenge` `:281`, `MonthlyProgressTracker.getChallengeProgress` `:305`); detail `handleChallengePress` `index.tsx:173-176` + posluchač `monthly_progress_updated` `:137-155` | ✅ | plná podoba v E17; do té doby stávající data a stavy |
| **Statistiky: denní počty** `mockYear(todayDone, todayScheduled)` (`HabitStatsConcept.tsx:92-95`; `homeChartsMock.ts:22-53`) | `WeeklyHabitChart.tsx:24-97` a `Monthly30DayChart.tsx:15-97` (`getHabitsByDate` + `wasScheduledOnDate` + `getRelevantDatesForHabit`, Smart Bonus Conversion, `isCovered`) | ⚠️ | (1) **rok** `YearlyHabitOverview.tsx:113-145` třídí plán/bonus **jinak** (náhrada v nenaplánovaný den = bonus; týden ji počítá do plánu, `WeeklyHabitChart.tsx:55-57`) – součet dne i míra vyjdou stejně, pro barvu roku nevadí; vzít jeden třídič (týdenní). (2) týden a měsíc jsou dnes „kratší z dostupných dat a 7/30 dní“ (`WeeklyHabitChart.tsx:17-19`, `Monthly30DayChart.tsx:17-19`) – nový uživatel s 3 dny dat má 3 sloupce, laboratoř kreslí vždy 7/30 |
| Míra období `totalsOf().rate` (`homeChartsLogic.ts:32-42`) | vzorec `WeeklyHabitChart.tsx:100-118` (vše vč. bonusů / plán, `Math.round`) | ✅ | smí být nad 100 % |
| Srovnání s minulým obdobím `compareRates` (`HabitStatsConcept.tsx:100-105`) | v appce není – spočítat ze stejných denních počtů za předchozích 7 / 30 dní (rozsah `getDataDateRange()` `useHabitsData.ts:244-248`) | ✅ | nová čistá funkce; období bez plánu = `null` (laboratoř už) |
| **Rok:** aktivní dny, odstíny `activeDays`, `heatLevel` (`:170`, `:179`) | `YearlyHabitOverview.tsx:73-75` bere `getDataDateRange()` = **celou historii** | ⚠️ | **chyba appky:** „rok“ není useknutý na 365 dní (`getDateRangeFromToday` `src/utils/date.ts:445-448`); uživatel s delší historií dostane „365 dní“ za víc než rok (nadpis `title365` `:340`). Nový rok vzít jen z posledních 365 dní |
| Nejlepší den v týdnu `bestWeekday` (`:107`, `:228-231`) | v appce není (Yearly má jen „nejlepší datum“ `:139-142`) | ✅ | nový fakt ze stejných počtů |
| **Přehledy: trend 4 týdnů** `text.trendUp(12)` (`HomeSectionsConcept.tsx:73-78`) | `HabitTrendAnalysis.tsx:93-168` | ⚠️ | **chyba appky – obrácený směr:** smyčka `i = 0` (poslední týden) → `weeks.unshift()` (`:153`) dá pole od nejstaršího; `recentAvg` pak bere `weeks[0..1]` = **nejstarší** dva týdny a `earlierAvg` nejnovější (`:162-164`). „Zlepšení o X %“ se ukáže, když se uživatel zhoršuje. (`currentWeek = weeks[3]` `:348` je správně – v jednom souboru dvě opačná čtení.) Fakt pro Přehledy převzít až opravený |
| Přehledy: nejsilnější návyk (`:65`, `:79-86`, „96 %“) | `HabitTrendAnalysis.tsx:301-316` (`bestPerformer`: jen návyky ≥ 14 dní a trend „improving“) **nebo** `HabitPerformanceIndicators.tsx:206-236` (`weeklyTopPerformer` / `monthlyTopPerformer`) | ⚠️ | dnes dvě různé definice „nejlepšího“; vybrat jednu. Řádek jen když fakt existuje |
| Přehledy: „stojí za pohled“ (`:66`, `:87-97`, „54 %“) | `HabitTrendAnalysis.tsx:318-331` (`strugglingHabit`: ≥ 14 dní a 28denní míra < 50 %) / `HabitPerformanceIndicators.tsx:238` (poslední z měsíčního žebříčku **bez prahu**) | ⚠️ | Indicators by „stojí za pohled“ ukázal i u návyku na 100 % (je jen poslední) → brát definici s prahem < 50 % |
| **Pro tebe: doporučení** (`HomeSectionsConcept.tsx:143-174`) | `RecommendationEngine.generateRecommendations(habits, completions, goals, gratitudes)` `src/services/recommendationEngine.ts:64-99` (nejvýš 4, podle priority); volání `PersonalizedRecommendations.tsx:28-51`; texty z `titleKey/descriptionKey/descriptionParams/promptKey` (`:14-43`) | ✅ | prázdné pole = karta se neukáže |
| **Pro tebe: tlačítko akce** (bez `onPress`, `:208-215`) | `handleRecommendationPress` `PersonalizedRecommendations.tsx:90-108` = jen `router.push` na záložku | ⚠️ | „tlačítko dělá akci doporučení“ appka neumí – jen otevře záložku. Existuje `?quickAction=addSelfPraise` (`journal.tsx:84-91`) pro „zkus pochvalu“; doporučení nese `habitId`/`goalId` (`recommendationEngine.ts:20`, `:40`), ale otevřít konkrétní návyk/cíl je nová cesta. Rozhodnout s Petrem |
| Pro tebe: „další“ `setIndex(i + 1)` (`:217`) | místní index nad polem z enginu | ✅ | |
| Přizpůsobení: seznam sekcí `DEFAULT_HOME_SECTIONS` ve `useState` (`HomeConcept.tsx:219-223`; `homeLayoutLogic.ts:37-45`) | `useHomeCustomization().state.preferences.components` (`index.tsx:200-214`), výchozí `defaultHomeComponents` `src/types/homeCustomization.ts:24-95` | ✅ | převod podle bodu 3b |
| Akce Skrýt / ukázat `toggleSection` (`HomeSectionsConcept.tsx:316`) | `actions.toggleComponentVisibility` `HomeCustomizationContext.tsx:76-86` → `homePreferencesStorage.ts:53-68` | ✅ | |
| **Akce Přetáhnout** `reorderSections` (`:276-290`) | `actions.reorderComponents(ids)` `HomeCustomizationContext.tsx:88-98` → `homePreferencesStorage.ts:70-85` (`hasCustomOrder: true`) | ⚠️ | (1) **dnes ji nic nevolá** – dnešní okno přizpůsobení řazení nemá (`HomeCustomizationModal.tsx` jen viditelnost `:32` a reset `:52`) → `hasCustomOrder` dnes nemá žádný uživatel; „uživatelovo pořadí“ tedy ještě neexistuje. (2) `reorderComponents` zahodí sekce, které v poli nejsou (`:72-75`), a `mergeHomeComponents` je vrátí s výchozím `visible: true` (`src/utils/homeComponents.ts:25-28`) → nový sheet musí poslat **všechna** id včetně skrytých, jinak se skrytá sekce znovu ukáže |
| Akce Obnovit výchozí (`:325`) | `actions.resetToDefaults` `HomeCustomizationContext.tsx:124-134` → `homePreferencesStorage.ts:43-51` | ✅ | bez potvrzení (bod 8) |
| Převod uloženého rozložení `migrateHomeSections` (`homeLayoutLogic.ts:96-120`) | uvnitř `mergeHomeComponents` `homeComponents.ts:18-42` (volá `homePreferencesStorage.ts:15-19`) | ✅ | jedno pravidlo, žádný druhý filtr (karta) |
| Pulz úvodu na Home | dnes žádný (nic v `src/components/home` ani `index.tsx` nečte `useTutorial`) | ✅ | není co zachovat |

**Rozdíly laboratoř × appka (platí appka)**
- „x/y“ = jen návyky naplánované dnes (`wasScheduledOnDate`), ne všechny; bonusové návyky dnešní Home neukazuje.
- Zmrzlá série: `frozenDays` je zbytek dluhu, celkový počet a zaplacené dny dává `getWarmUpPaymentProgress()`; zahřátí = `justUnfrozeToday` na celý den.
- Statistiky: týden/měsíc dnes kratší u nových uživatelů; rok třídí plán/bonus jinak (součet stejný).
- „Akce doporučení“ je dnes jen přechod na záložku.
- Vlastní pořadí sekcí dnes nemá nikdo – řazení přichází s novým sheetem.

**Chybí zdroj (zastavit)** – nic. (Rozhodnutí bez zastavení: bonusové návyky v dnešní sekci, akce doporučení.)

**Sliby, které ověřit**
- „+N XP dnes“ = `getTodayXP()` (všechny zdroje, po odečtech, nikdy záporné).
- Bublina „+25“ – skutečné číslo z `xpGained` (bonus 15, násobič, strop).
- „Jedna reklama = jeden den“ – `warmUpStreakWithAds(1)` (`SQLiteGratitudeStorage.ts:1406-1478`); nad 3 dny dluhu `adsNeededToWarmUp` vrací 0 a nastupuje automatický reset (`:1357-1374`, `:1123`).
- Přehledy nesmí slibovat „zlepšení“ z dnešního `HabitTrendAnalysis`, dokud není opravené pořadí týdnů.

**Chyby ostré appky nalezené při mapování**
- `HabitTrendAnalysis.tsx:153` + `:162-164` – celkový trend obráceně (viz tabulka).
- `HabitPerformanceIndicators.tsx:151`, `:172-198` – „týdenní průměr“ a „vs. minulý týden“: do možných se počítají **všechny aktivní návyky** (ne naplánované) a **i budoucí dny** kalendářního týdne (`getWeekDates()` Po–Ne, `src/utils/date.ts:154-163`) → v pondělí ráno vyjde letošní týden skoro 0 % proti plnému minulému. Sekce v E11 zaniká – jen nepřevzít.
- `YearlyHabitOverview.tsx:73-75` – „rok“ = celá historie.

---

## E12 – Deník

Zdroj: `JournalConcept.tsx`, `journalParts.tsx`; kulisy `useLabJournal` (`journalMock.tsx`). Cíl: `app/(tabs)/journal.tsx`, `src/components/gratitude/{GratitudeInput,EditGratitudeModal,GratitudeList,DailyGratitudeProgress,DailyMotivationalQuote,StreakWarmUpModal,WarmUpModals}.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Dnešní záznamy `journal.entriesOn(todayKey)` (`JournalConcept.tsx:129-131`) | `actions.getGratitudesByDate(today())` `GratitudeContext.tsx:193-202` (dnes `journal.tsx:39`, `:61-63`) | ✅ | číslo záznamu = `Gratitude.order` (`types/gratitude.ts:7`), počítá ho úložiště (`SQLiteGratitudeStorage.ts:249-264`) a po smazání přečísluje (`:533`) |
| Série a nejlepší série v kartě Dnes `streak`, `stats.longestStreak` (`:147`, `:331-334`) | `state.streakInfo.currentStreak / longestStreak` | ✅ | série před třetím záznamem dne = běh do včerejška (`calculateStreakWithWarmUp`, `SQLiteGratitudeStorage.ts:1200-1205`) |
| Třetí záznam = splnění na místě (`TodayCard` `:520-…`) | dnes okno `celebration_daily_complete` `journal.tsx:100-108` | ✅ | R-13: zrušit řazení i typ – výskyty `ModalQueueContext.tsx:52`, `:205`, `CelebrationModal.tsx:23`, `:75`, `:161`, `:220` a test `src/contexts/__tests__/modalQueueOrdering.test.ts:118`, `:129` |
| Bonusová cesta 4–13 s ⭐🔥👑 `milestoneAt` (`:697-740`; `journalMock.tsx:211-220`) | pozice 4 / 8 / 13 – `SQLiteGratitudeStorage.getMilestoneXP` `:360-367` | ✅ | |
| Dlaždice „+N XP“ za další záznam `entryXp + milestoneXp` (`:804-846`) | `getXPForJournalEntry` `:388-400` (20/20/20, 8 do 13., od 14. 0) + `getMilestoneXP` (25/50/100) | ⚠️ | čísla sedí, ale je to **slib předem**: násobič částku zvětší; od 14. záznamu nic nekreslit. Skutečné číslo po zápisu z `xpGained` (`metadata.milestoneXp`, `entryPosition` posílá `:308-318`) |
| Zamčené dlaždice při zmrzlé sérii `startWriting` (`:211-217`, `:905-930`) | `streakInfo.isFrozen` / `frozenDays` | ⚠️ | **Debt Gate žije v komponentě, ne v úložišti:** `GratitudeInput.handleSubmit` `GratitudeInput.tsx:84-118` (`Math.max` uloženého a spočítaného dluhu `:94-97`); `SQLiteGratitudeStorage.create` (`:229-330`) dluh nekontroluje. `GratitudeInput` je cílový soubor E12 (nahradí ho sheet) → pojistku **přenést** do nového sheetu nebo do `createGratitude`, jinak zmizí. Přesměrování `:106-109` se ruší (bod 4) |
| Ohřátí přímo v Deníku `WarmUpControls` (`:350-354`, `:913-920`) | sdílený hook z E11 (logika dnes `GratitudeStreakCard.tsx:388-576`) | ✅ | viz E11 – po každé platbě obnovit sdílený stav |
| **Akce Uložit záznam** `journal.add(type, text)` (`:219-240`) | `actions.createGratitude({ content, date: today(), type })` `GratitudeContext.tsx:128-154` → `SQLiteGratitudeStorage.create` `:229` (XP `:308`) | ✅ | validace prázdný / < 3 znaky (`journalParts.tsx:942-947`) = `GratitudeInput.tsx:70-80`; 200 znaků (`journalParts.tsx:857`) = `GratitudeInput.tsx:240` |
| **Akce Upravit** `journal.edit` (`:226`, nabídka `:462-468`) | `actions.updateGratitude(id, { content })` `GratitudeContext.tsx:156-172` → `SQLiteGratitudeStorage.update` `:406` | ⚠️ | **na záložce Deník dnes úprava ani mazání není** – `<GratitudeList gratitudes={…} />` bez `onEdit/onDelete` (`journal.tsx:371-373`); umí to jen Historie (`journal-history.tsx:89-128`). `EditGratitudeModal` má 500 znaků (`:205`) a nehlídá 3 znaky (`:44-46`) – jeden sheet = sjednotit na pravidla psaní (rozhodnout). Chyba ukazuje `journal.export.error` (`:52`) – karta bod 8 |
| **Akce Smazat** `journal.remove` → vrací XP poslední pozice (`:242-246`; `journalMock.tsx:412-420`) | `actions.deleteGratitude` `GratitudeContext.tsx:174-191` → `SQLiteGratitudeStorage.delete` `:485` (horní pozice `:523`, přečíslování `:533`, `subtractXP` `:539`) | ✅ | stejné pravidlo; nová akce na záložce (viz řádek výš) |
| Okno ⭐🔥👑 `setMoment` (`:235-239`, `MilestoneMoment` `:505`) | `journal.tsx:128-148` (okno `celebration_bonus_milestone`, XP natvrdo `:133`) | ✅ | XP z `xpGained` (E10) |
| Okno série deníku po třetím záznamu | `journal.tsx:109-124` | ⚠️ | **ověřeno – chyba appky (E10 ji měla „ověřit“):** `handleInputSuccess` (`:95-149`) volá `GratitudeInput` ze stejného běhu `handleSubmit`, který začal před uložením (`GratitudeInput.tsx:133`) → v `setTimeout` čte `state.streakInfo` ze záběru **před** zápisem (`journal.tsx:112`); `await actions.refreshStats()` (`:111`) ten záběr nezmění. Série před třetím záznamem = běh do včerejška → okno 7/30/100… přijde **o den později** (8. den s textem „7 dní“). Nový moment číst ze stavu po obnovení |
| Citát dne `getDailyQuote` + „jiný“ `getRandomQuoteFromCategory` (`:976-1004`) | stejné funkce `src/data/motivationalQuotes.ts:654`, `:693`; dnes `DailyMotivationalQuote.tsx:14-31` | ✅ | |
| Historie / Statistiky vpravo nahoře (`:302`, `:307`) | `router.push('/journal-history')`, `router.push('/journal-stats')` `journal.tsx:351-363` | ✅ | spodní dvojici tlačítek odstranit (4c) |
| `?quickAction=addGratitude` / `addSelfPraise` | `journal.tsx:75-93` | ✅ | musí otevřít nový sheet se správným typem |
| Reklamní pruh pryč s klávesnicí | `journal.tsx:44-55`, `:378-382` | ✅ | zachovat (P30) |
| Nápověda `HelpLink topic="journalDay"` (`:585`), `"frozen"` (`:910`) | dnes `HelpTooltip` `journal.debtRecovery` a `journal.selfRiseStreak` (`DailyGratitudeProgress.tsx:276`, `:296`) | ⚠️ | nová témata (7.10); `journal.debtRecovery` „nesmí se rozbít“ → převést na téma `frozen` |

**Rozdíly laboratoř × appka (platí appka)**
- Pojistka dluhu je dnes v `GratitudeInput`, ne v úložišti – při výměně komponenty ji přenést.
- Úprava a mazání na záložce Deník jsou nové (funkce existují, dnes jen v Historii); limity psaní a úpravy se liší (200/3 × 500/1).
- „+N XP“ na dlaždici je slib před zápisem; připsané číslo může být vyšší (násobič).

**Chybí zdroj (zastavit)** – nic.

**Sliby, které ověřit**
- „+20 / +8 / 0 XP“ a ⭐🔥👑 „+25/+50/+100“ → `SQLiteGratitudeStorage.ts:360-400`, výplata `:308`.
- „Smazání vrátí XP poslední pozice“ → `:523-545`.
- „Zmrzlá série zamkne psaní“ → jen dokud pojistka v ukládání zůstane (viz výš).

---

## E13 – Historie a statistiky deníku

Zdroj: `JournalHistoryConcept.tsx`, `JournalStatsConcept.tsx`; kulisy `useLabJournal`. Cíl: `app/journal-history.tsx`, `app/journal-stats.tsx`, `src/components/gratitude/StatisticsCard.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Stav dne v kalendáři `journal.dayState(d)` – plno / ★ / rozepsáno / nic (`JournalHistoryConcept.tsx:398-410`; `journalMock.tsx:328-337`) | počty za den z `state.gratitudes` (`GratitudeContext.tsx:11`; `getGratitudesByDate` `:193`) – pravidla ≥ 3 / ≥ 4 jako `getCompletedDates` `SQLiteGratitudeStorage.ts:733-749` a `getBonusDates` `:755-770` | ✅ | |
| **❄ den zaplacený reklamou** (`'paid'`, `journalMock.tsx:332`) | `state.streakInfo.warmUpPayments` (plní `calculateAndUpdateStreak` `:1267` přes `refreshStats`; `getWarmUpPayments` `:201-219`, `isComplete` = ≥ 1 reklama) | ⚠️ | (1) **`resetStreak` maže všechny platby** (`:1581`) → po „Začít znovu“ i po automatickém resetu ❄ dny z historie zmizí a stuha se v minulosti přetrhne – historie se mění zpětně (rozhodnout, zda to vadí); (2) `getStreak()` vrací `warmUpPayments: []` (`:715`) – číst ze `state.streakInfo` po `refreshStats`, ne ze surového stavu |
| Stuha série `inStreak` = sousední plné / ❄ dny (`:383-386`, `:405-406`) | odvodit ze stejných dat | ✅ | kresba, ne pravidlo série (neříká „aktuální série“) |
| Měsíce zpět `MONTHS_BACK = 3` (`:58`, `:329`) | data od prvního záznamu (`state.gratitudes`) | ⚠️ | omezení laboratoře; ostrá historie musí jít až k prvnímu měsíci se záznamem |
| Panel dne: záznamy (`:110-111`), ‹ › (`:238`, `:250`), „Dnes“ (`:339`) | `getGratitudesByDate(date)`; `navigateDate` `journal-history.tsx:61-72`, `goToToday` `:74-80` | ✅ | |
| **Hledání** `journal.entries.filter(includes)` (`:84-90`), strop `SEARCH_CAP = 40` (`:57`, `:178`) | `actions.searchGratitudes(term)` `GratitudeContext.tsx:226-233` → `searchByContent` `SQLiteGratitudeStorage.ts:78-92` (bez ohledu na velikost písmen, nad `getAll` řazeným `created_at DESC` `:53`) | ✅ | strop nepřevzít – výsledky ve `FlatList` (audit N9); pozice v dni = `Gratitude.order` |
| Akce ⋯ Upravit / Smazat v historii | `handleEditGratitude` / `confirmDelete` / `handleEditSuccess` `journal-history.tsx:89-128` → `updateGratitude` / `deleteGratitude` + `forceRefresh` | ✅ | `Alert.alert` `:57`, `:114` → `ProblemNote` (3b) |
| Statistiky: série a nejlepší (`JournalStatsConcept.tsx:73-75`, `:107-135`) | `state.streakInfo.currentStreak / longestStreak`; text `journal-stats.tsx:57-71` | ✅ | |
| Celkem záznamů `stats.totalEntries` (`:145-147`) | `state.stats.totalGratitudes` (`getStats` `SQLiteGratitudeStorage.ts:1672-1697` → `count()` `:1608`) | ✅ | |
| Aktivní dny `stats.activeDays` (`:153-155`) | `state.stats.totalDays` (`getTotalDaysWithGratitude` `:1625-1636`); text `journal.stats.daysWithEntries_one/_other` (`locales/en/index.ts:746-747`) | ✅ | ověřit vykreslený text testem (P29) |
| Průměr na aktivní den (`:163-166`) | `state.stats.averagePerDay` (`getAverageGratitudesPerDay` `:1642-1658`: průměr přes dny se záznamem, 1 desetinné) | ✅ | stejné jako `journalMock.tsx:370` |
| Odznaky ⭐🔥👑 a jejich součet (`:172-201`) | `streakInfo.starCount + flameCount + crownCount` (`journal-stats.tsx:73-78`) | ✅ | |
| **Graf 30 dní** `stats.last30` (`:327-329`) | počty za den: `gratitudeStorage.countByDate` po dnech (`StreakHistoryGraph.tsx:84-91`) nebo seskupení `state.gratitudes` | ✅ | čára cíle 3 = `getCompletedDates` (≥ 3) |
| Poměr typů (`:786-789`) | `state.gratitudes.filter(g => g.type …)` `journal-stats.tsx:31-40` | ✅ | |
| Povzbuzení (`:231-240`) | stejné klíče `journal-stats.tsx:297-303` | ✅ | |
| Načtení čísel | `loadStats` `journal-stats.tsx:42-55` | ⚠️ | `setStats(state.stats)` po `await refreshStats()` (`:45-46`) ukládá **zastaralý** snímek ze záběru a obrazovka se pak už neobnoví (žádný efekt na `state.stats`) – nepřevzít, číst `state.stats` přímo |

**Rozdíly laboratoř × appka (platí appka)**
- ❄ dny drží jen tabulka plateb, kterou „Začít znovu“ / automatický reset celou maže.
- Historie bez stropu 3 měsíců; hledání bez stropu 40 (virtualizovaný seznam).

**Chybí zdroj (zastavit)** – nic. (K rozhodnutí: mají ❄ dny po resetu z historie mizet?)

**Sliby, které ověřit**
- „❄ = den zachráněný reklamou“ – platí jen do příštího resetu série.
- Text „N dní se záznamem“ – plurál `_one/_other`.

---

## E14 – Cíle: seznam, karta s tempem, rychlý zápis

Zdroj: `GoalsConcept.tsx`, `goalParts.tsx`; kulisy `useLabGoals` (`goalsMock.tsx`). Cíl: `src/screens/goals/GoalsScreen.tsx`, `src/components/goals/{GoalItem,GoalListWithDragAndDrop,GoalList,ProgressModal,ProgressEntryForm}.tsx`.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Seznam cílů, aktivní / splněné `goals`, `completedOn` (`GoalsConcept.tsx:83-88`) | `useGoalsData()` `src/hooks/useGoalsData.ts:6-24` (`activeGoals`, `completedGoals` podle `GoalStatus`, řazeno `order`) | ✅ | laboratoř dělí podle `completedOn`, appka podle `status` (`src/types/goal.ts:3-8`) |
| Hodnota `currentValue(goal)` (`goalsMock.tsx:122-133`; `goalParts.tsx:296`) | `Goal.currentValue` (`types/goal.ts:24`; drží ho `updateGoalValue` `src/utils/data.ts:197-240` a `recalculateGoalValue` `SQLiteGoalStorage.ts:745-816`) | ✅ | druh „Messen“ až E16 |
| Procento `fractionOf` (`goalsMock.tsx:135-140`; `goalParts.tsx:298`) | `currentValue / targetValue` (jako `GoalItem.tsx:106`) | ✅ | smí přes 100 % |
| **Ikona a barva cíle** `CATEGORY_LOOK` (`goalsMock.tsx:38-48`; `goalColor` `goalParts.tsx:86-89`) | `Goal.category` ano, mapa kategorie → ikona/barva ne | ❌ | stejné jako E10 – přesunout mapu do konstant/tokenů? rozhodne Petr |
| Zářezy 25/50/75 `goal.paid` nebo procento (`goalParts.tsx:186-190`) | vyplacené milníky jen v tabulce `goal_milestones` (id `${goalId}_xp_${práh}`, zápis `SQLiteGoalStorage.ts:546-549`) – **čtecí funkce není**; „dosaženo“ = procento | ⚠️ | milník odložený denním stropem (`:538-543`) je dosažený, ale nevyplacený; po poklesu pod práh zářez podle procenta zhasne (laboratoř ho drží). „Svítí, když se vyplatil“ = nová čtecí funkce |
| **Tempo** `paceOf` (`goalsMock.tsx:163-212`; `PaceChip` `goalParts.tsx:98`; ryska plánu `:192-205`) | dnes jen `getGoalStats()` `SQLiteGoalStorage.ts:870-951` (`estimatedCompletionDate`, `isOnTrack`, `timelineStatus`) + `calculateTimelineStatus` `src/utils/goalCalculations.ts:23-64` | ⚠️ | **jiný model:** appka odhaduje z průměru na **den se zápisem** (`averageDaily = totalProgress / uniqueProgressDays` `:914`) a porovná odhad s termínem (pásma ±1 / ±30 dní); laboratoř = přímka start → termín, dny napřed/pozadu, ±3 dny „v plánu“. Karta (R-17) zavádí jednu novou funkci v `goalCalculations.ts` – data pro ni jsou (`startDate`, `targetDate`, `currentValue`, `targetValue`). Pozor: `new Date('YYYY-MM-DD')` v `goalCalculations.ts:45` a `SQLiteGoalStorage.ts:909`, `:935` čte datum jako UTC (posun o den západně od Greenwiche) – nová funkce parsuje místně |
| Přehled: aktivní / v plánu / hotové (`GoalsConcept.tsx:87-93`) | odvodit z řádků výš | ✅ | |
| Čára termínů (`:587-690`) | `Goal.targetDate` (`DateString`; úložiště snese i starý tvar `DD.MM.YYYY` `:926-934`) | ✅ | |
| **Rychlé částky** `goal.quick` (`goalsMock.tsx:74`; `goalParts.tsx:421-431`; vznik `suggestQuick(target)` `GoalComposerConcept.tsx:200-205`) | `Goal` takové pole nemá (`types/goal.ts:19-31`) | ❌ | možnosti: (a) přenést `suggestQuick` jako čistou funkci a počítat z `targetValue` při zobrazení (beze změny dat), (b) ukládat u cíle (změna dat), (c) odvodit z historie zápisů |
| **Akce rychlý zápis** `goalsState.log(id, value)` (`GoalsConcept.tsx:176-222`) | zopakovat `GoalsScreen.handleSubmitProgress` `:229-275`: `actions.addProgress({ goalId, value, note, date: today(), progressType })` `GoalsContext.tsx:228-266` → `SQLiteGoalStorage.addProgress` `:409-598`; pak `goalStorage.getById` a okno `goal_completion` (`GoalsScreen.tsx:239-256`) | ✅ | karta bod 5 |
| Zápis „Odečíst“ (`LogSheet` režim `subtract`, `goalParts.tsx:546-552`) | `progressType: 'subtract'` | ⚠️ | **jiné pravidlo XP:** appka za odečet **bere 35 XP** (`SQLiteGoalStorage.ts:477-483`); laboratoř dá 0 a nic nebere |
| Zápis „Nastavit“ (`LogSheet` režim `set` – ukládá rozdíl `delta`, `goalParts.tsx:546-552`, `:606`) | `progressType: 'set'` (`types/goal.ts:38`; dnešní formulář `ProgressEntryForm.tsx:121-125`) | ⚠️ | laboratoř uloží nastavení jako přičtení (a dá 35 XP); appka zná `'set'` a XP za něj **nedává** (žádná větev `:477-490`), milníky a dokončení ano (`:516`, `:557-590`). Režim mapovat 1:1 na `progressType` |
| XP za zápis 35, 3× denně `XP_PER_LOG`, `logsToday` (`goalsMock.tsx:103-104`, `:439-455`) | `XP_REWARDS.GOALS.PROGRESS_ENTRY` `src/constants/gamification.ts:48`; strop `MAX_GOAL_TRANSACTIONS_PER_DAY = 3` `src/services/gamification/xpLimits.ts:61`, kontrola `:149-162` | ⚠️ | strop počítá **XP transakce cíle** – zápis i milník sdílí stejné 3 (`:152`); laboratoř počítá jen zápisy a milníky platí mimo strop. Jeden zápis přes dva prahy spotřebuje 3 transakce. Násobič |
| Milníky 50 / 75 / 100 XP (`goalsMock.tsx:107-114`) | `SQLiteGoalStorage.ts:516-554` (čísla `gamification.ts:49-51`) | ✅ | odklad při stropu viz výš |
| Dokončení 250 / 350 `completionXp` (`goalsMock.tsx:116-120`) | `goalCompletionXP(targetValue)` `gamification.ts:379-383`; výplata/vrácení `SQLiteGoalStorage.ts:571-584` | ✅ | pravidlo mění E16 (O-8) |
| **„+35 XP“, milníky a „dnes už bez XP“ v pruhu po zápisu** (`GoalsConcept.tsx:185-217`; `LogResult` `goalsMock.tsx:406-412`) | `addProgress` vrací jen `GoalProgress` (`:409`, `:588`) | ❌ | karta bod 6 / D-4. Pro cestu (b): `xpGained` nese `source` a `sourceId = goalId` (`:484-489`, `:532-536`, `:573-577`), ale **milník nenese práh** (jen popis) a odmítnutý zápis (strop) **nepošle nic** → „dnes už bez XP“ by se odvozovalo z nepřítomnosti události (P49). Cesta (a) = rozšířit návrat úložiště |
| **Akce Zpět** `goalsState.removeEntry` (`GoalsConcept.tsx:197-201`) | `actions.deleteProgress(id)` `GoalsContext.tsx:268-302` → `SQLiteGoalStorage.deleteProgress` `:658-714` | ⚠️ | (1) za smazaný `'add'` **vždy odečte 35 XP** (`:684-690`), i když zápis kvůli stropu nic nepřinesl – známá hrana N-5.9, kterou Petr přijal jako vzácnou (`technical-guides:Goals.md:625-628`); s ťuknutím + Zpět bude **běžná** (4. ťuk dne + Zpět = −35 XP). `findGrantedXPToReverse` vezme poslední dnešní grant cíle (`gamificationService.ts:1017-1068`, datum `:1125`) – tedy 35 z dřívějšího zápisu. (2) za smazaný `'subtract'` 35 XP **přidá** (`:691-697`). (3) dokončení vrátí `recalculateGoalValue` (`:782-797`), milníky zůstanou ✅ (karta bod 7) |
| Okno dokončení `setDoneId` (`GoalsConcept.tsx:222`) | `enqueueModal({ type: 'goal_completion' })` `GoalsScreen.tsx:248-255` | ✅ | |
| Značka `goal_completion_celebrations_shown` (karta bod 5) | zapisuje `GoalsScreen.tsx:257-268` | ⚠️ | **nic ji nečte** (jediný výskyt v `src/`) – zapsat ji jde, ale nic nehlídá; říct Petrovi |
| „⋯“ Detail / Upravit / Smazat (`GoalsConcept.tsx:436-447`, smazání `:450-463`) | `handleViewGoalStats` `GoalsScreen.tsx:215-217`; `handleEditGoal` `:170-174`; `handleDeleteGoal` `:196-203` → `actions.deleteGoal` `GoalsContext.tsx:212-226` → `SQLiteGoalStorage.delete` `:237-266` (smaže zápisy i `goal_milestones`, XP zůstává) | ✅ | |
| Akce „+“ nový cíl (`GoalsConcept.tsx:270`) | `handleAddGoal` `GoalsScreen.tsx:153-157`; `?quickAction=addGoal` `:142-151` | ✅ | |
| Řazení (laboratoř nemá) | `handleReorderGoals` `GoalsScreen.tsx:205-213` → `actions.updateGoalOrder` `GoalsContext.tsx:304` → `SQLiteGoalStorage.updateGoalOrder` `:818` | ✅ | dál přes `ReorderableList` |
| Panel „Jiné“: datum zápisu | dnešní formulář má volné **textové** pole data (`ProgressEntryForm.tsx:350-357`), `validateForm` ho nekontroluje (`:62-76`) | ⚠️ | laboratoř zapisuje vždy dnes → zpětný zápis zmizí (rozhodnout); dnešní pole přijme i nesmysl |
| Validace částky > 0 a ≤ `MAX_GOAL_VALUE` (`goalParts.tsx:590-595`) | `ProgressEntryForm.validateForm` `:65-69` (klíče `valueRequired`, `valueTooLarge`) | ✅ | laboratoř má vlastní text `g.tooLarge` → použít `goals.progress.form.errors.valueTooLarge` |
| Chyby (`ErrorModal` s `error.message`) | `GoalsScreen.tsx:191`, `:200`, `:209`, `:271` | ⚠️ | `error.message` nikdy neukazovat (PREVOD `systemScreens`) |

**Rozdíly laboratoř × appka (platí appka)**
- Odečet bere 35 XP; „nastavit“ je samostatný typ zápisu bez XP.
- Denní strop = 3 XP transakce na cíl (zápisy + milníky dohromady).
- Tempo appky je dnes jiný model (průměr na den se zápisem); nová funkce tempa ho nahrazuje podle R-17.
- „Zpět“ po zápisu nad stropem vezme 35 XP, které nepřišlo (přijatá hrana N-5.9 – s novým ovládáním častá).

**Chybí zdroj (zastavit)**
- ❌ Ikona/barva cíle podle kategorie (`CATEGORY_LOOK`) – jen v kulisách (shodně s E10).
- ❌ Rychlé částky na kartě (`quick`) – appka je nemá.
- ❌ „+N XP / milníky / dnes už bez XP“ po zápisu – `addProgress` to nevrací (D-4).

**Sliby, které ověřit**
- „+35 XP“ za zápis jen do 3 XP transakcí na cíl a den (milníky se počítají do stejných 3).
- „Zpět“ odečte 35 XP vždy – text nesmí slibovat „vrátíme, co jsi dostal“.
- „Milník +50/+75/+100“ – může se odložit na příští zápis (`:538-543`).

---

## E15 – Cíle: tvorba a úprava, detail

Zdroj: `GoalComposerConcept.tsx`, `GoalDetailConcept.tsx`. Cíl: `GoalModal`, `GoalForm`, `TargetDateStepSelectionModal`, `TargetDateConfirmationModal`, `GoalTemplatesModal`, `app/goal-stats.tsx`, `GoalStatsScreen` a jeho karty.

| Hodnota / akce v laboratoři | Zdroj v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Validace názvu, jednotky, cíle, popisu (`GoalComposerConcept.tsx:350-380`) | `GoalForm.validateForm` `src/components/goals/GoalForm.tsx:113-142` (stejná pravidla a klíče) | ⚠️ | funkce je vnitřní v komponentě – „sdílet, nekopírovat“ = vytáhnout ji (jako u návyků v E6); `MAX_GOAL_VALUE` `src/constants/goals.ts:8` |
| Nápady `IDEAS` (kopie klíčů, `:88-198`) | `useGoalTemplates()` `src/constants/goalTemplates.ts:31` | ⚠️ | šablony **druh nemají** – „Zhubnout“ je dnes počítání 10 kg (`goalTemplates.ts:37-40`), v laboratoři „Messen“ (`:101-104`) → E16 |
| Termín předvolbami 1/3/6 měsíců, konec roku, bez termínu `presetDate` (`:209-232`) + kalendář | `Goal.targetDate?: DateString` (`types/goal.ts:27`) | ✅ | nové ovládání, stejná data; dnešní tříkrokové okno a potvrzení „bez termínu“ (`GoalForm.tsx:152-157`) zanikají |
| „To je asi N za týden“ `perWeek` (`:282`, `:519-528`) | odvodit z cíle a termínu | ✅ | nové, bez dat |
| Druh + počáteční hodnota (`:253-256`, `:631-680`) | v `Goal` není | ⚠️ | E16 (karta přidává) – v E15 volbu nekreslit |
| Kategorie (`:261-262`, `:760-…`) | `GoalCategory` (`types/goal.ts:10-17`) | ✅ | barva/ikona ❌ viz E14 |
| **Akce Uložit nový** `onSave(goal, null)` (`:396-402`) | `GoalsScreen.handleSubmitGoal` `:182-194` → `actions.createGoal` `GoalsContext.tsx:153` → `SQLiteGoalStorage.create` `:102-155` | ✅ | |
| **Akce Uložit úpravu** `onSave(goal, id)` | `actions.updateGoal` `GoalsContext.tsx:194-210` → `SQLiteGoalStorage.update` `:157-236` | ⚠️ | **chyba appky:** změna `targetValue` nepřepočítá stav – snížení pod `currentValue` nechá cíl ACTIVE nad 100 % bez XP za dokončení (až do dalšího zápisu), zvýšení nad hodnotu nechá COMPLETED i s XP. Výplata i vrácení 250/350 se řídí **aktuálním** `targetValue` (`:571`, `:782`) → změna cíle přes hranici 10 000 mezi dokončením a vrácením rozhodí částku (souvisí s E16 3a) |
| Detail: kruh, hodnota, procento (`GoalDetailConcept.tsx:110-114`) | `getGoalWithStats(goalId)` `useGoalsData.ts:42-52` (dnes `GoalStatsScreen.tsx:25`) | ✅ | trasa `/goal-stats?goalId=` zůstává |
| Fakta tempa: dní zbývá, potřeba / týden, tvoje / týden, dojezd (`:118-134`) | nová funkce tempa z E14 | ⚠️ | dnešní `estimatedCompletionDate` (`SQLiteGoalStorage.ts:920-938`) počítá jinak (průměr na den se zápisem) a datum píše přes `toISOString` (UTC, `:924`) – nepřebírat |
| Graf „Ty a plán“ `seriesOf` (`:78-87`) | průběh z `getGoalProgress(goalId)` `useGoalsData.ts:34-36` (zápisy `add/subtract/set` s datem) | ✅ | přehrát stejnými pravidly jako `recalculateGoalValue` (`:752-766`) – **pozor na pořadí zápisů téhož dne** (E16, chyba 1) |
| Milníky s datem dosažení (`:689-735`) | odvodit z průběhu | ✅ | skutečné datum výplaty je v `goal_milestones.completed_at` (`:546-549`), čtecí funkce není |
| Historie zápisů (`:136`, `:259-300`) | `getGoalProgress(goalId)`; dnes `ProgressHistoryList` | ✅ | laboratoř zná jen ± rozdíl; zápis `set` v počítaném cíli musí mít vlastní řádek („= 40“) |
| **„+35 XP“ u zápisu v historii** `entry.xp` (`:291-297`) | zápis XP nenese (`types/goal.ts:33-39`), transakce se k zápisu neváží (`sourceId = goalId`, `SQLiteGoalStorage.ts:484-489`) | ❌ | bez změny dat neukazovat |
| Akce Smazat zápis `onDeleteEntry` (`:345`) | `GoalStatsScreen` `:38-46` → `goalsActions.deleteProgress` | ✅ | pravidla XP viz E14 „Zpět“; chyba ukazuje text `failedToAddProgress` (`GoalStatsScreen.tsx:44`) – špatný text (drobná chyba appky) |
| Akce Zapsat / Upravit z detailu (`:208`, `:323`) | stejné cesty jako E14 / řádek „Uložit úpravu“ | ✅ | |
| Nápověda `HelpLink topic="pace"` (`:185`) | `goals.predictions` žije v `GoalCompletionPredictions.tsx:511`, která zaniká | ⚠️ | nové téma `pace` (7.10) |

**Rozdíly laboratoř × appka (platí appka)**
- Šablony nemají druh; „Zhubnout“ je dnes počítání.
- Úprava cílové hodnoty dnes nepřepočítá dokončení.

**Chybí zdroj (zastavit)**
- ❌ XP u jednotlivého zápisu v historii.
- (❌ ikona/barva kategorie – viz E14.)

**Sliby, které ověřit**
- Detail neslibuje odměnu za milník jinou než `gamification.ts:49-53`; „+350“ jen podle `goalCompletionXP` (dnes `targetValue ≥ 10 000`, od E16 podle O-8) – čte ho i `GoalCompletionModal.tsx:205`.

---

## E16 – Cíle: druh „Messen“ (změna dat)

Zdroj: `goalsMock.tsx` (pravidla `kind`, `start`, `fractionOf`, `paceOf`, `log`), `GoalComposerConcept.tsx` (volba druhu), `goalParts.tsx` (`LogSheet` u měření). Mock se nepřevádí – níže je, **co data potřebují a co už existuje**.

| Potřeba (laboratoř) | Co je v ostré appce | Stav | Pozn. |
|---|---|---|---|
| Druh cíle `kind: 'count' \| 'measure'` (`goalsMock.tsx:34`, `:66`) | `Goal` ho nemá (`types/goal.ts:19-31`), tabulka `goals` taky ne (`src/services/database/init.ts:288-305`) | ⚠️ | karta přidává |
| Počáteční hodnota `start` (`goalsMock.tsx:67-68`) | není (`createGoal` dává `currentValue: 0`, `src/utils/data.ts:164-186`) | ⚠️ | karta přidává |
| Migrace sloupců | vzor `PRAGMA table_info` + `ALTER TABLE goals ADD COLUMN … DEFAULT` (`init.ts:77-105`) | ✅ | `DEFAULT` druh „Hochzählen“ a start 0 → stávající cíle beze změny |
| Čtení/zápis nových polí | mapování řádku na 3 místech (`SQLiteGoalStorage.ts:37`, `:79`, `:320` – `getAll`, `getById`, `getByStatus`), `INSERT` v `create` (`:122-142`), `UPDATE` (`:202`), `CreateGoalInput` / `UpdateGoalInput` (`types/goal.ts:58-77`) | ⚠️ | všechna doplnit |
| **Záloha a obnova** („starší zálohy musí jít načíst“) | **v appce není** – export/záloha smazány v auditu Fáze 13 (`src/services/storage/index.ts:11-28`) | ⚠️ | jediná „záloha“ je obnova celého zařízení (soubor databáze) → pokryje ji migrace sloupců při startu. Bod 2 karty upřesnit s Petrem |
| Marketingová demo data | `marketingDemoDataService.ts:834-850` (`INSERT INTO goals` s vyjmenovanými sloupci), `:864` (`goal_milestones`), `:886` (`goal_progress`) | ⚠️ | `DEFAULT` pokryje; demo „hubnutí“ ale chce druh „Messen“ a start |
| Zápis naměřené hodnoty (`LogSheet` u měření ukládá čtení, `goalParts.tsx:606`) | `progressType: 'set'` už existuje (`types/goal.ts:38`, CHECK `init.ts:334`, `updateGoalValue` `data.ts:207-208`) | ✅ | |
| XP za čtení „blíž k cíli“ (`goalsMock.tsx:452-455`) | za `'set'` XP **není** (`SQLiteGoalStorage.ts:477-490`) | ⚠️ | nové pravidlo – rozhodnout. Navíc měsíční výzvy počítají „dny s pokrokem cíle“ z XP události `GOAL_PROGRESS` (`monthlyProgressTracker.ts:584`, `:653-661`) → čtení bez XP se do výzvy nezapočítá |
| Nula jako cíl i čtení (dluh → 0) (`GoalComposerConcept.tsx:362-374`, `goalParts.tsx:590-595`) | `GoalForm.tsx:130` (`targetValue <= 0` = chyba), `Validator.minValue(targetValue, 0.01)` `src/types/validation.ts:179-180`, `ProgressEntryForm.tsx:65` (`value <= 0` = chyba) | ⚠️ | u „Messen“ povolit 0 |
| **Pořadí zápisů téhož dne** při přepočtu | `getProgressByGoalId` řadí jen `ORDER BY date DESC` (`SQLiteGoalStorage.ts:387`), `recalculateGoalValue` pole otočí `progress.reverse()` (`:754`) | ⚠️ | **chyba appky (ověřeno):** zápisy jednoho dne se při přepočtu přehrají **v opačném pořadí**, než vznikly. U samých `add` nevadí, u `set` ano – v sqlite3 se stejnou tabulkou a indexem (`init.ts:328-340`) vrací dotaz zápisy dne v pořadí vzniku, `reverse()` je obrátí → „+5, pak =10“ téhož dne vyjde po přepočtu **15 místo 10**. Dnes nastane po smazání nebo úpravě libovolného zápisu (`deleteProgress` `:702`, `updateProgress` `:641-643`). Pro „Messen“ (víc vážení za den) zásadní → řadit i podle `created_at` |
| Výpočty se startem 0 a směrem nahoru | `addProgress` `:425`, `:468` (procento), `:516` (milníky jen když ne `subtract`), dokončení `updateGoalValue` `data.ts:220`, `:234`; `recalculateGoalValue` `:769`; `getGoalStats` `:915`, `:921` (`remainingValue = target − totalProgress`); `calculateTimelineStatus` `goalCalculations.ts:23`; funkce tempa z E14 | ⚠️ | místa z karty bod 3 sedí. **Mimo úložiště navíc:** `recommendationEngine.ts:304`, `GoalItem.tsx:106` (nahradí E14), `userActivityTracker.ts:582`, trofeje `achievementIntegration.ts:352` (dokončený cíl ≥ 1 000 000) a `:374-409` (největší cíl) – u „Messen“ (např. dluh 1 000 000 → 0, cíl 0) by trofej podle `targetValue` nešla; rozhodnout, zda brát `|cíl − start|` |
| `getGoalStats.totalProgress` | `'subtract'` bez ořezu na 0 (`:900`), přepočet ořezává (`:760`) | ⚠️ | drobná nesrovnalost – sjednotit při přepisu |
| **O-8 velký cíl podle úsilí** (≥ 30 dní, ≥ 10 zápisů) | `Goal.startDate` / `completedDate` (`types/goal.ts:28-29`), počet zápisů `getGoalStats().progressEntries` (`:908`) | ✅ | data jsou |
| O-8: místa dnešního pravidla `≥ 10 000` | `goalCompletionXP(goal.targetValue)` `:571` (výplata i vrácení v `addProgress`), `:782` (výplata i vrácení v `recalculateGoalValue`), `bigGoalsCompleted` `:994` (statistika); zobrazení `GoalCompletionModal.tsx:205` | ⚠️ | tři místa v úložišti sedí s kartou; čtvrtý čtenář je okno |
| O-8: vrátit přesně vyplacené | transakce dokončení existuje (`source = GOAL_COMPLETION`, `sourceId = goal.id`, `:573-577`); hledání `findGrantedXPToReverse` je soukromé a **jen pro dnešek** (`gamificationService.ts:1017-1068`, datum `:1125`) | ⚠️ | **dnešní asymetrie:** zruší-li se dokončení jiný den, odečte se základ podle **aktuálního** cíle – dokončení pod násobičem (např. 500) pak vrátí jen 250. Pro O-8 buď hledání bez data, nebo uložit vyplacenou částku u cíle (karta) |
| Tempo a pokrok směrem dolů (84,6 → 78 kg) | `fractionOf` a `paceOf` laboratoře počítají s rozpětím `target − start` (`goalsMock.tsx:135-140`, `:163-212`) | ✅ | pravidlo laboratoře je hotové; patří do funkce tempa (E14) |
| Šablona „Zhubnout“ | `goalTemplates.ts:37-40` (počítání, 10 kg) | ⚠️ | rozhodnout, zda se stane „Messen“ |
| Cíl z úvodu | `goalDraft.ts:28-40`, `FirstGoalScreen` | ✅ | zůstává „Hochzählen“ (DEFAULT) |
| Testy migrace | `src/services/database/__tests__/`, `src/services/storage/__tests__/sqliteGoalStorage.progressXP.test.ts` (umí `add/subtract/set`, `:50`) | ✅ | rozšířit podle karty |

**Rozdíly laboratoř × appka (platí appka)**
- „Měření“ = existující typ zápisu `set`, ale bez XP a bez započtení do měsíční výzvy.
- Nula jako cíl / čtení je dnes všude zakázaná.

**Chybí zdroj (zastavit)** – nic mimo to, co karta sama přidává (druh, start). **Zastavit kvůli kartě:** plán migrace Petrovi před prvním řádkem kódu; navíc rozhodnout XP za čtení, trofeje „milion“ u Messen, šablonu „Zhubnout“, výklad „zálohy“.

**Sliby, které ověřit**
- „Stávající cíle beze změny“ – jen s `DEFAULT` hodnotami a nezměněnými výpočty pro „Hochzählen“ (testy XP pravidel).
- „+350 za velký cíl“ – po O-8 podle úsilí; vrácení musí sedět i jiný den a pod násobičem.

**Chyby ostré appky nalezené při mapování (E14–E16)**
1. `SQLiteGoalStorage.ts:387` + `:754` – zápisy téhož dne se při přepočtu přehrají obráceně (`set` + `add` → špatná hodnota). Ověřeno v sqlite3.
2. `SQLiteGoalStorage.update` `:157-236` – změna cílové hodnoty nepřepočítá dokončení.
3. Zrušení dokončení jiný den vrátí základ podle aktuálního cíle, ne vyplacenou částku (`gamificationService.ts:1125`).
4. Značka `goal_completion_celebrations_shown` se jen zapisuje.
5. `GoalStatsScreen.tsx:44` – chyba mazání zápisu ukazuje text „nepodařilo se přidat“.
6. `ProgressEntryForm.tsx:350-357` – datum zápisu je nekontrolovaný text.

---

## Události pro E11–E16

| Událost | Kde | Co s ní |
|---|---|---|
| `xpGained` | posílá `gamificationService.ts:2493` (i záporně při odečtu `:1262`) | E11 obnova čipu „dnes“; E14 cesta (b) k číslům po zápisu – cíle mají `sourceId = goalId`, milník bez prahu, odmítnutý zápis bez události |
| `openHomeCustomization` | `DeviceEventEmitter` `index.tsx:61-72`, `:305` (není v `appEvents.ts`) | zachovat (karta E11) |
| `monthly_progress_updated` | posluchač `index.tsx:137-155` | karta výzvy na Home (do E17 beze změny) |
| platba ohřátí | **žádná událost**; Home a Deník sdílejí jen `GratitudeContext.state` | hook z E11 musí po platbě zavolat `refreshStats` (viz E11) |

---

## Události – co už existuje a co karty přidávají

| Událost | Existuje | Posílá | Poslouchá dnes | Co s ní E5–E10 |
|---|---|---|---|---|
| `xpGained` | ✅ `appEvents.ts:116` | `gamificationService.ts:2474`, `achievementService.ts:620`, `:873`, `trophyCollectionService.ts:66`, demo `:1330`, `:1374` | `XpAnimationContext.tsx:250`, `OptimizedXpProgressBar.tsx:121`, `monthlyProgressIntegration.ts:114` | E7: vrstva jisker; doplnit `sourceId`/`metadata` u trofejí a sbírek |
| `levelUp` | ✅ `:122` | `gamificationService.ts:966`, `achievementService.ts:633`, `:885`, `trophyCollectionService.ts:75`, demo | `XpAnimationContext.tsx:253` | E7 štítek, E10 kapitola |
| `achievementUnlocked` / `multipleAchievementsUnlocked` | ✅ `:126-127` | `achievementService.ts:1313`, `:1325` | `AchievementContext.tsx:372`, `:401` | E8 sběrač dávky |
| `achievementCelebrationClosed` | ✅ `:128` | `ModalQueueContext.tsx:173`, `AchievementContext.tsx:363` | `tutorialAchievementGate.ts` | zachovat |
| `xpMultiplierActivated` | ✅ `:123` (harmonie, kombo, výzva) | `xpMultiplierService.ts:900`, `:1297`, `:1452` | `XpMultiplierSection.tsx:152` | E7 značka, E8 kombo; **E9 doplní pro návrat** (`activateInactiveUserBoost` dnes nic neposílá) |
| konec násobiče | ❌ neexistuje | – | – | odznak/panel počítají z `expiresAt` (nová událost není potřeba) |

## Souhrn

| Etapa | ✅ | ⚠️ | ❌ | Hlavní věc k rozhodnutí |
|---|---|---|---|---|
| E5 | 21 | 4 | 1 | čip „+N XP dnes“ za návyky nemá zdroj; série návyku je v appce kalendářní |
| E6 | 12 | 8 | 0 | úspěšnost = vzorec appky (od vytvoření, > 100 %); pozastavené se neřadí |
| E7 | 13 | 6 | 0 | bonus za návrat × srovnání XP při startu; `sourceId`/`metadata` u trofejí |
| E8 | 8 | 4 | 0 | 52/75 trofejí = velké okno; XP z `xpGained`; časové okno sběrače (kombo, trofeje v nečinnosti) |
| E9 | 19 | 5 | 0 | názvy zdrojů násobiče; událost návratu a klíč D-9 přidává karta |
| E10 | 13 | 6 | 1 | ikona cíle podle kategorie jen v kulisách; dnešní okno cíle ukazuje 250 místo 350 |
| E11 | 25 | 14 | 0 | „x/y“ jen z naplánovaných; sdílený stav ohřátí potřebuje obnovu po každé platbě; trend 4 týdnů v appce obráceně; vlastní pořadí sekcí dnes nemá nikdo; akce doporučení = jen záložka |
| E12 | 12 | 5 | 0 | Debt Gate žije v `GratitudeInput` (přenést); úprava/mazání na záložce nové; okno série chodí o den později (chyba appky) |
| E13 | 13 | 3 | 0 | ❄ dny mizí s každým resetem série (maže platby); historie bez stropu 3 měsíců |
| E14 | 12 | 9 | 3 | ikona/barva kategorie, rychlé částky a čísla po zápisu (D-4) bez zdroje; odečet bere 35 XP; „Zpět“ nad stropem bere 35 XP |
| E15 | 10 | 6 | 1 | XP u zápisu v historii bez zdroje; úprava cíle nepřepočítá dokončení |
| E16 | 6 | 13 | 0 | „set“ existuje, ale bez XP; pořadí zápisů téhož dne v přepočtu obráceně (chyba appky); záloha v appce není; vrácení O-8 jen „dnes“ |
