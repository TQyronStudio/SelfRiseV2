# Mapy dat pro etapy E5–E10 (krok 0.2/3 plánu převodu)

*Sepsáno 2026-11-23 nad větví `design-v2` (po E4). Podklad: karty E5–E10 v `design-migration-plan.md`, hlavičky `GOING LIVE` souborů laboratoře, řádky v `src/screens/design-lab/PREVOD.md` a ostrý kód. Každý odkaz `soubor:řádek` je ověřený čtením kódu.*

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
