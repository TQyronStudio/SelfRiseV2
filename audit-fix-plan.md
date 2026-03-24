# Plan oprav - Hloubkovy audit gamifikace

Tento dokument obsahuje vsechny nalezene problemy z auditu gamifikace, achievementu, modalu a event systemu. Kazdy bod obsahuje popis problemu srozumitelny pro neodbornika a navrh opravy.

---

## FAZE 1: Bugy ovlivnujici uzivatele (nejvyssi priorita)

Tyto problemy primo ovlivnuji zazitek uzivatele - bud nedostavaji odmeny, ktere by meli, nebo se neco zobrazuje spatne.

---

### 1.1 Duplicitni achievement: `flame-starter` a `flame-collector`

**Problem z reportu:** OBA maji identicke podminky (target=5, source=journal_flame_count) - oba se odemknou soucasne.

**Vysvetleni:** Existuji dva achievementy za plaminek v deniku, ale oba vyzaduji presne to same - ziskat plaminek 5krat. To znamena, ze uzivatel dostane oba naraz ve stejnou chvili, coz nedava smysl. Kazdy achievement by mel mit jinou obtiznost.

**Navrh opravy:** Projit celou progresi plaminku (1, 5, 10, 25, 50, 100) a rozhodnout, ktery z techto dvou achievementu ma mit jakou hodnotu. Napriklad `flame-starter` by mohl vyzadovat 3 plaminky a `flame-collector` 5. Nebo jeden z nich uplne odstranit, pokud je nadbytecny. Opravit v kodu i v dokumentaci.

**Status:** [x] OPRAVENO - flame-collector zmenen na target=25. Aktualizovan katalog, preview utils, 3 lokalizace (EN/DE/ES), technicka dokumentace.

---

### 1.2 Dvojity level-up modal (dvojity emit `levelUp` eventu)

**Problem z reportu:** `performXPAddition` emituje `levelUp` ze DVOU mist - potencialne duplicitni level-up modaly.

**Vysvetleni:** Kdyz uzivatel ziska dost XP na novy level, system omylem odesle zpravu "dosahl jsi noveho levelu" DVAKRAT. To muze zpusobit, ze se uzivateli zobrazi level-up oslava dvakrat za sebou pro ten samy level.

**Navrh opravy:** Odstranit jeden z techto dvou emisnich bodu, aby se level-up udalost odeslala vzdy jen jednou. Ponechat tu cestu, ktera obsahuje vsechna potrebna data (cislo predchoziho i noveho levelu).

**Status:** [x] OPRAVENO - Odstranen duplicitni levelUp emit z queueXPNotification. Ponechana inline loop (radek ~920) ktera ma kompletni data vcetne previousLevel a podporuje multi-level-up.

---

### 1.3 Goal milestones se nikdy neprideli (mrtvy kod)

**Problem z reportu:** Goal milestone system (25%, 50%, 75%) - konstanty existuji, ale nikdy se nevolaji. Uzivatele prichazeji o 225-325 XP za kazdy cil.

**Vysvetleni:** Kdyz uzivatel plni svuj cil postupne (napriklad dokonci 25%, pak 50%, pak 75%), mel by za kazdy takovy milnik dostat bonusove XP. Pravidla pro tyto bonusy existuji v systemu, ale nikdy se realne nevolaji. Uzivatel tak za celou cestu k dokonceni cile dostava mnohem mene XP, nez by mel.

**Navrh opravy:** Implementovat kontrolu milniku pri pridani progressu u cilu. Kdyz procento dokonceni prekroci 25%, 50% nebo 75%, pridelit odpovidajici bonusove XP (50, 75, 100 XP).

**Status:** [x] OPRAVENO - Implementovana kontrola milniku v goalStorage.addProgress(). Pri prekroceni 25% (+50 XP), 50% (+75 XP), 75% (+100 XP) se prideluje bonusove XP. Kazdy milnik se prideluje presne jednou.

---

### 1.4 Daily Launch XP nesouhlasi

**Problem z reportu:** Dokumentace rika 5 XP, kod dava 10 XP.

**Vysvetleni:** Kdyz uzivatel otevre aplikaci, dostane odmenu za prihlaseni. Ale pravidla rikaji 5 XP a aplikace dava 10 XP. Jedno z toho je spatne.

**Navrh opravy:** Rozhodnout, ktera hodnota je spravna (5 nebo 10 XP) a sjednotit kod i dokumentaci.

**Status:** [x] OPRAVENO - Cely Daily Launch XP system odstranen (byl mrtvy kod - nikdy se nepriděloval). Odstraneno: enum, konstanta, konfigurace, 3x mapa v gamificationService, achievementService, achievementIntegration, 2x UI komponenta, 3x lokalizace (EN/DE/ES), i18n typy, technicka dokumentace.

---

### 1.5 Harmony Streak aktivacni bonus chybi

**Problem z reportu:** Dokumentace rika +240 XP pri aktivaci Harmony Streak, ale neni to nikde implementovano.

**Vysvetleni:** Kdyz uzivatel splni vsechny navyky 7 dni v rade a aktivuje se mu Harmony Streak (2x multiplikator), mel by podle pravidel dostat jednorazy bonus 240 XP. Tento bonus ale nikdy nebyl naprogramovan.

**Navrh opravy:** Rozhodnout, jestli tento bonus chceme (muze byt prilis stedry) nebo ho z dokumentace odstranit. Pokud ano, implementovat jednoraze pridani 240 XP pri aktivaci multiplikatoru.

**Status:** [x] OVERENO - Bonus 240 XP JE implementovan (xpMultiplierService.ts radek ~469: bonusXP = HARMONY_STREAK_DURATION * 10 = 240). Audit byl falesny poplach. Navic optimalizovan vypocet Harmony Streak (early termination, cache konzistence).

---

### 1.6 Goal 100% milestone chybi

**Problem z reportu:** Dokumentace zminuje 200 XP za dosazeni 100% u cile (oddelene od completion bonusu 250 XP), ale v kodu to neexistuje.

**Vysvetleni:** Podle pravidel by uzivatel mel dostat extra 200 XP, kdyz dosahne 100% cile, NAVIC k 250 XP za samotne dokonceni. Tento 100% milnik ale nebyl nikdy naprogramovan. Souvisi s bodem 1.3 - cely milnikovy system u cilu nefunguje.

**Navrh opravy:** Resit spolecne s bodem 1.3. Pokud implementujeme milniky, pridat i 100%. Pokud ne, odstranit z dokumentace.

**Status:** [x] ROZHODNUTO - 100% milestone NEIMPLEMENTOVAN. 100% = GOAL_COMPLETION (250 XP), coz je dostatecna odmena. Pridani dalsich 200 XP by bylo prilis. Dokumentace a kod jsou konzistentni (25%, 50%, 75% milniky + 250 XP za completion).

---

## FAZE 2: Nekonzistence v kodu (stredni priorita)

Tyto problemy nezpusobuji prime chyby pro uzivatele, ale mohou vest k budoucim problemum a ztezuji udrzbu.

---

### 2.1 Nekonzistentni data v `levelUp` eventu

**Problem z reportu:** 3 emisni mista posilaji ruzna data - `previousLevel` chybi v jednom, `source` pridano v jednom, `totalXP` chybi ve vsech.

**Vysvetleni:** Kdyz system hlasi novy level, jsou tri ruzna mista v kodu, kde se tato zprava vytvari. Kazde z nich posila trochu jine informace. To muze vest k tomu, ze level-up oslava obcas nezobrazi spravne informace (napriklad predchozi level).

**Navrh opravy:** Sjednotit vsechna tri mista tak, aby vzdy posilala stejnou sadu dat. Opravit spolecne s bodem 1.2 (po odstraneni duplicity zustane mene mist k sjednoceni).

**Status:** [x] OPRAVENO - Vsechna 3 emisni mista sjednocena. achievementService (foreground + background) nyni zachytava xpResult.previousLevel a pouziva loop pro multi-level-up (shodny vzor s gamificationService). Data: { newLevel, previousLevel, levelTitle, levelDescription, isMilestone, timestamp }.

---

### 2.2 Comeback Bonus - zavadejici konstanta

**Problem z reportu:** Dokumentace rika 25 XP, konstanta v kodu rika 150 XP, ale skutecna implementace pouziva hardcoded 25 XP.

**Vysvetleni:** Existuje odmena pro uzivatele, kteri se vrati do aplikace po delsi nepritomnosti. Pravidla rikaji 25 XP a aplikace skutecne dava 25 XP, ale v nastaveni systemu je omylem napsana hodnota 150 XP, ktera se nikdy nepouzije. To je matouci pro budouci upravu.

**Navrh opravy:** Opravit konstantu na 25 XP a pouzivat ji misto hardcoded hodnoty.

**Status:** [x] OPRAVENO - Konstanta COMEBACK_BONUS opravena z 150 na 25. Hardcoded hodnota v xpMultiplierService nahrazena odkazem na konstantu XP_REWARDS.SPECIAL.COMEBACK_BONUS.

---

### 2.3 BIG_GOAL_COMPLETION neni zdokumentovany

**Problem z reportu:** V kodu existuje bonus 350 XP pro cile s hodnotou >= 1000, ale dokumentace o nem nerika nic.

**Vysvetleni:** Kdyz uzivatel dokonci velky cil (s cilovou hodnotou 1000 a vice), dostane extra bonus 350 XP namisto standardnich 250 XP. Tato funkce funguje, ale neni nikde zdokumentovana v pravidlech.

**Navrh opravy:** Pridat tento bonus do dokumentace Gamification-Core, aby pravidla odpovidala realite.

**Status:** [x] OPRAVENO - Konstanta BIG_GOAL_COMPLETION byla mrtvy kod (nikdy se nepouzivala). Implementovana v goalStorage + SQLiteGoalStorage (addProgress + recalculate). Threshold zmenen na >= 10000. bigGoalsCompleted stat aktualizovan. Dokumentace doplnena.

---

### 2.4 Warm-up 4-star XP nekonzistence

**Problem z reportu:** Hodnota pro 4. hvezdu je 1688 v konstantach, ale 1556 v enhanced engine.

**Vysvetleni:** Existuji dve mista, kde je definovana odmena za 4. hvezdu v warm-up vyzve, a kazde rika neco jineho. Zalezi na tom, ktera cesta se pouzije - uzivatel muze dostat ruzny pocet XP.

**Navrh opravy:** Sjednotit hodnotu na jedno misto. Rozhodnout, ktera hodnota je spravna (1688 nebo 1556).

**Status:** [x] OPRAVENO - ENHANCED_STAR_BASE_REWARDS[4] opraven z 1556 na 1688 (spravna ×1.5 progrese). WARM_UP_CHALLENGES konstanta smazana (mrtvy kod, nikde neimportovana).

---

### 2.5 Achievement `xpGained` pouziva raw string misto enum

**Problem z reportu:** `source: 'achievement_unlock'` misto `XPSourceType.ACHIEVEMENT_UNLOCK`.

**Vysvetleni:** Kdyz achievement system hlasi ziskane XP, pouziva textovy retezec misto spravneho datoveho typu. Momentalne to funguje, protoze text je nahodou stejny, ale kdyz se typ nekdy prejmenuji, prestane to fungovat.

**Navrh opravy:** Nahradit raw string za spravny enum typ.

**Status:** [x] OPRAVENO - Nahrazeny 2 raw stringy 'achievement_unlock' za XPSourceType.ACHIEVEMENT_UNLOCK v achievementService.ts (radky 572 a 820).

---

### 2.6 Interni nekonzistence v AchievementContext

**Problem z reportu:** `closeCelebrationModal` rika "3-Tier", `showNextCelebration` rika "4-Tier" ve stejnem souboru.

**Vysvetleni:** V jednom souboru jsou dva ruzne komentare, ktere si odporuji - jeden tvrdi, ze system ma 3 urovne priority, druhy 4. To mate vyvojare pri budouci praci.

**Navrh opravy:** Opravit oba komentare na "4-Tier" - coz je aktualni stav systemu.

**Status:** [x] OPRAVENO - Opraven komentar v AchievementContext.tsx radek 394: "3-Tier" -> "4-Tier".

---

## FAZE 3: Zastarala dokumentace (nizsi priorita, ale dulezita)

Dokumentace je na mnoha mistech zastarala a neodpovida aktualnimu stavu kodu. To muze zpusobit problemy pri budouci praci.

---

### 3.1 Modal system - cela dokumentace je zastarala

**Problem z reportu:** Dokumentace popisuje 3-Tier system, kod implementuje 4-Tier. Vsechny nazvy funkci a state properties jsou deprecated.

**Vysvetleni:** Dokumentace pro zobrazovani modalu (gratulacnich oken) popisuje starsi verzi systemu. Od te doby byl system rozsiren o novou uroven priority pro mesicni vyzvy, ale dokumentace se neaktualizovala. Kdokoli bude cist tuto dokumentaci, bude pracovat se spatnymi informacemi.

**Navrh opravy:** Kompletne prepsat sekci o modal priority systemu v `technical-guides:Gamification-UI.md`:
- Aktualizovat na 4-Tier system
- Nahradit vsechny deprecated nazvy funkci za aktualni
- Aktualizovat state properties
- Pridat chybejici timing hodnoty
- Zdokumentovat achievementQueueStarting pre-registraci
- Zdokumentovat crescendo razeni
- Zdokumentovat tutorial suppression

**Status:** [x] OPRAVENO - Kompletne prepsana sekce Modal Priority System v technical-guides:Gamification-UI.md na 4-Tier. Aktualizovany vsechny nazvy funkci, state properties, timing hodnoty, pridana achievementQueueStarting pre-registrace a legacy aliasy.

---

### 3.2 Achievement pocty v dokumentaci

**Problem z reportu:** Header rika 78, stats sekce rika 76, technicka sekce rika 52. Goals kategorie - stats rika 6, skutecne je 8.

**Vysvetleni:** Dokumentace achievementu byla psana v ruznych dobach a cisla se nikdy neaktualizovala. Nekde se rika 52, nekde 76, nekde 78 achievementu. Spravne cislo je 78. Podobne u kategorie Cilu - rika se 6, ale je jich 8.

**Navrh opravy:** Projit celou dokumentaci achievementu a sjednotit vsechny pocty na aktualni stav (78 achievementu, Goals: 8).

**Status:** [x] OPRAVENO - Sjednoceny vsechny pocty v technical-guides:Achievements.md: 78 achievements, Goals: 8, Rare: 18, Legendary: 26, Total XP: 25,050. Opraveno 7 vyskytu cisla 52 na 78.

---

### 3.3 Komentar v kodu achievementu

**Problem z reportu:** Radek 2 souboru achievementCatalog.ts rika "76 Total", JSDoc rika 78, skutecne je 78.

**Vysvetleni:** Podobne jako bod 3.2, ale primo v kodu. Jeden komentar rika 76, druhy spravne 78.

**Navrh opravy:** Opravit komentar na radku 2 z "76" na "78".

**Status:** [x] OPRAVENO - Komentar na radku 2 achievementCatalog.ts opraven z "76" na "78".

---

### 3.4 Event system - 16 nedokumentovanych eventu

**Problem z reportu:** Dokumentace listuje 4 eventy, kod pouziva 20+ eventu.

**Vysvetleni:** System komunikuje pomoci "udalosti" (napriklad "uzivatel ziskal XP", "uzivatel dosahl noveho levelu"). Dokumentace zna jen 4 takove udalosti, ale ve skutecnosti jich system pouziva pres 20. Kdyz nekdo bude chtit neco menit nebo opravovat, nebude vedet o existenci vetsiny techto udalosti.

**Navrh opravy:** Doplnit do `technical-guides:Gamification-Events.md` vsechny chybejici eventy:
- xpSmartNotification
- achievementQueueStarting
- multipleAchievementsUnlocked
- achievementCelebrationClosed
- xpMultiplierActivated
- star_level_changed, star_progression_updated, difficulty_recalculated
- monthly_progress_updated, monthly_milestone_reached, monthly_week_completed
- daily_snapshot_created, monthly_challenge_completed
- tutorial_scroll_to, tutorial_scroll_completed

**Status:** [x] OPRAVENO - Doplnen kompletni seznam 18 gamifikacnich eventu do technical-guides:Gamification-Events.md. Aktualizovany deprecated nazvy v logging a flow diagramu (Primary/Secondary → 4-Tier). Identifikovano 7 eventu bez listeneru (viz Faze 5).

---

### 3.5 TypeScript interfaces pro eventy neexistuji

**Problem z reportu:** `XPEventData`, `LevelUpEventData`, `XPBatchEventData` jsou dokumentovany, ale v kodu neexistuji. Vsechny handlery pouzivaji typ `any`.

**Vysvetleni:** Dokumentace definuje presne struktury dat pro jednotlive udalosti, ale v kodu tyto definice nikdy nebyly vytvoreny. To znamena, ze neni zadna kontrola, jestli se posilaji spravna data - vse je "cokoliv".

**Navrh opravy:** Vytvorit TypeScript interfaces podle dokumentace a pouzit je v event handlerech. To zajisti, ze chyby v datech se odhali pri vyvoji, ne az u uzivatele. Resit az po bode 1.2 a 2.1, protoze tam se meni co se posila.

**Reseni:** Dokumentace prepsana tak, aby presne odpovidala realite v kodu. Fiktivni interfaces (`XPEventData`, `LevelUpEventData`, `XPBatchEventData`), neexistujici validacni funkce (`validateXPEventData`) a neexistujici emisni pattern (`emitXPEvent`) nahrazeny popisem skutecnych datovych struktur pro vsech 8 aktivne poslouchanych eventu. Opraveny i handler nazvy (handleModalCoordination neexistoval, handleXPBatchCommitted → handleBatchCommitted).

**Status:** [x] OPRAVENO - dokumentace sjednocena s realitou

---

### 3.6 Event data structures - chybejici a prebytecna pole

**Problem z reportu:** `totalXP` se nikde neemituje, `position` pole neni dokumentovano, `description` se nikdy neposila.

**Vysvetleni:** Nektere informace, ktere by se melo posilat (celkove XP), se neposilaji. A nektere, ktere se posilaji (pozice na obrazovce), nejsou v pravidlech. Dokumentace a realita se rozchazeji.

**Navrh opravy:** Resit spolecne s bodem 3.5 - pri vytvareni interfaces definovat, co je opravdu potreba, a sjednotit kod i dokumentaci.

**Reseni:** Vsechny 3 problemy vyreseny v ramci bodu 3.5. Dokumentace nyni presne odpovidala realite: `totalXP` a `description` odstraneny (nikdy se neposilaly), `position` pridano (realne se posila v xpGained).

**Status:** [x] OPRAVENO - vyreseno v ramci 3.5

---

### 3.7 Validacni a logovaci funkce neexistuji

**Problem z reportu:** `validateXPEventData()`, `logGamificationError()`, `XPSystemRecovery` retry system - vse dokumentovano, ale neexistuje v kodu.

**Vysvetleni:** Dokumentace popisuje bezpecnostni mechanismy - kontrolu spravnosti dat, systematicke logovani chyb a automaticke zotaveni po selhani. Nic z toho ale nebylo nikdy naprogramovano. Aplikace funguje, ale bez techto ochran.

**Navrh opravy:** Rozhodnout, jestli tyto mechanismy chceme implementovat, nebo je z dokumentace odstranit. Doporucuji je zatim z dokumentace odstranit (znacit jako "planned for future") a implementovat az bude potreba - aplikace funguje i bez nich.

**Reseni:** Fiktivni funkce `logGamificationError()` a `XPSystemRecovery` odstraneny z dokumentace. `validateXPEventData()` jiz odstranena v 3.5. Ponechany realne error handling patterny (try/catch), ktere odpovidaji kodu (55 try/catch v gamificationService, 6 v XpAnimationContext). Opraven i zastaraly odkaz "Primary vs Secondary" → 4-Tier.

**Status:** [x] OPRAVENO - fiktivni funkce odstraneny, realne patterny ponechany

---

## FAZE 4: Nizka priorita / kosmeticke

Tyto body nemaji vliv na funkcnost, ale je dobre je mit na pameti.

---

### 4.1 Timing hodnoty v dokumentaci

**Problem z reportu:** Dokumentace rika 300ms po zavreni Activity modalu, kod pouziva 500ms. Ruzne dalsni timing hodnoty nejsou dokumentovany.

**Vysvetleni:** Cas, ktery system ceka mezi zobrazenim jednotlivych oken, je v dokumentaci jiny nez ve skutecnosti. Nemeni to chovani pro uzivatele, ale mate vyvojare.

**Navrh opravy:** Resit v ramci bodu 3.1 (kompletni prepis modal dokumentace).

**Reseni:** Vyreseno v ramci 3.1. Vsechny timing hodnoty v dokumentaci nyni odpovidaji kodu: Tier 1/2 → 500ms, Tier 3 → 300ms, mezi level-up modaly → 500ms.

**Status:** [x] OPRAVENO - vyreseno v ramci 3.1

---

### 4.2 Nazvy achievementu v docs vs. ID v kodu

**Problem z reportu:** Dokumentace pouziva zobrazovane nazvy ("First Steps", "Centurion", "Dream Fulfiller"), kod pouziva technicke ID ("first-habit", "hundred-days", "goal-achiever").

**Vysvetleni:** To je ocekavane chovani - dokumentace pouziva jmena, ktera vidi uzivatel, a kod pouziva technicka ID. Nejde o bug, ale pro prehlednost by bylo dobre pridat do dokumentace i technicke ID vedle nazvu.

**Navrh opravy:** V achievement dokumentaci pridat sloupec s technickym ID ke kazdemu achievementu.

**Status:** [x] PRESKOCENO - ocekavane chovani, neni potreba menit

---

## FAZE 5: Mrtve eventy - emituji se, ale nikdo je neposlouchá

Behem proverovani bodu 3.4 bylo identifikovano 7 eventu, ktere se emituji do prazdna. Zadna komponenta je neposlouchá. Nejde o bugy - aplikace funguje - ale uzivatel prichazi o vizualni zpetnou vazbu.

---

### 5.1 `xpMultiplierActivated` - uzivatel nevidi aktivaci multiplikatoru

**Problem:** Event se emituje na 3 mistech v xpMultiplierService.ts (radky 847, 1246, 1414), ale zadna UI komponenta ho neposlouchá.

**Co to ma delat:** Informovat uzivatele, ze se mu aktivoval XP multiplikator (napr. "1.5× XP bonus na 4 hodiny!"). Bez toho uzivatel nevi, ze bonus bezi.

**Dopad:** Stredni. Uzivatel ziska bonus XP, ale nevi o tom. Chybi motivacni efekt.

**Navrh opravy:** Pridat listener v XpAnimationContext nebo dedickem komponente, ktery zobrazi notifikaci/toast o aktivaci multiplikatoru.

**Reseni:** Pridan listener v XpMultiplierSection pro `xpMultiplierActivated`. Pro achievement combo a challenge completion (automaticke aktivace) se nacte aktualni multiplier info a zobrazi existujici MultiplierActivationModal. Pro harmony streak (rucni aktivace) se preskakuje - modal uz bezi pres primy UI flow. V MultiplierActivationModal pridana podminka: harmony-specificka sekce (streak summary) se zobrazi jen pro harmony_streak zdroj. Lokalizace (EN, DE, ES) uz existovaly.

**Status:** [x] OPRAVENO - listener pridan, modal se zobrazuje pro vsechny zdroje

---

### 5.2 `monthly_milestone_reached` - chybi celebrace milniku 25/50/75%

**Problem:** Event se emituje v monthlyProgressTracker.ts (radek 1337), ale zadna komponenta ho neposlouchá.

**Co to ma delat:** Zobrazit uzivateli celebraci, kdyz dosahne 25%, 50% nebo 75% mesicni vyzvy. XP se prideluje spravne, ale uzivatel nedostane vizualni oslavu.

**Dopad:** Stredni. Uzivatel prichazi o motivacni milniky behem mesice. Jedina celebrace je az pri 100% dokonceni.

**Navrh opravy:** Pridat listener v MonthlyChallengeSection nebo na Home screenu, ktery zobrazi milestone celebraci (toast nebo mini-modal).

**Reseni:** Vytvorena nova komponenta MonthlyChallengeMilestoneModal s animacemi, progress barem a haptic feedbackem. Pridan listener v MonthlyChallengeSection pro `monthly_milestone_reached`. Kazdy milestone (25/50/75%) ma vlastni emoji (🌱/🔥/🚀), barvu a motivacni text. Lokalizace pridany ve vsech 3 jazycich (EN, DE, ES). Typ pridan do i18n.ts.

**Status:** [x] OPRAVENO - milestone celebracni modal implementovan

---

### 5.3 `monthly_week_completed` - chybi zpetna vazba za dokonceny tyden

**Problem:** Event se emituje v monthlyProgressTracker.ts (radek 1206), ale zadna komponenta ho neposlouchá.

**Co to ma delat:** Informovat uzivatele, ze uspesne dokoncil cely tyden mesicni vyzvy (7/7 aktivnich dnu).

**Dopad:** Nizky. Tydenni data se spravne ukladaji. Chybi jen vizualni potvrzeni pro uzivatele.

**Navrh opravy:** Pridat listener ktery zobrazi kratkou notifikaci "Tyden X dokoncen!" nebo to integrovat do progress baru vyzvy.

**Status:** [x] SMAZANO - event odstranen jako zbytecny

---

### 5.4 `daily_snapshot_created` - interni diagnosticky event

**Problem:** Event se emituje v monthlyProgressTracker.ts (radek 1080), ale zadna komponenta ho neposlouchá.

**Co to ma delat:** Informovat o vytvoreni denniho snapshotu pokroku vyzvy. Jde o interni diagnosticky event.

**Dopad:** Zadny pro uzivatele. Tento event je spise pro interni logging/debugging.

**Navrh opravy:** Bud odstranit emit (zbytecny overhead), nebo ponechat pro budouci analytics. Neni potreba listener.

**Status:** [x] SMAZANO - interni diagnosticky event odstranen jako zbytecny overhead

---

### 5.5 `star_level_changed` - uzivatel nevidi, ze se mu zmenila uroven hvezd

**Co se deje:**
Kazda mesicni vyzva patri do jedne kategorie (Navyky, Denik, Cile, Konzistence). Kazda kategorie ma svou uroven hvezd od 1★ do 5★:
- 1★ Novice (seda) → 2★ Explorer (modra) → 3★ Challenger (fialova) → 4★ Expert (oranzova) → 5★ Master (zlata)

Hvezdy se meni ve dvou situacich:
- **Povyseni** - kdyz uzivatel splni mesicni vyzvu na 100%, jeho hvezda v dane kategorii stoupne o 1
- **Sesazeni** - kdyz uzivatel 2× za sebou selze (pod 70%), nebo kdyz 3× za sebou dostane zjednoduseny warm-up

**Problem:**
Tyto zmeny se deji uplne POTICHRU. Uzivatel si toho vubec nevsimne! Nikdo mu nerekne "Postoupil jsi na 3★ Challenger!" ani "Tvoje hvezdy klesly na 1★".

**Overene fakty:**
- Vzdy se meni jen JEDNA kategorie naraz (jedna vyzva = jedna kategorie)
- Nemuze nastat situace, ze by sly dve kategorie nahoru/dolu soucasne
- Existuje funkce "reset hvezd", ale ta NENI nikde v aplikaci pristupna uzivateli (jen pro testovani)

**Plan opravy - novy modal "Zmena urovne hvezd":**

🔼 **Kdyz hvezda STOUPNE (povyseni):**
1. Uzivatel splni mesicni vyzvu na 100%
2. Nejdriv se zobrazi gratulacni modal "Vyzva splnena!" (ten uz existuje)
3. Uzivatel ho odklikne
4. HNED NA TO se zobrazi novy modal "Postoupil jsi na 3★ Challenger!"
   - S animaci, barvou nove urovne, motivacnim textem
   - Pozitivni, slavnostni atmosfera

🔽 **Kdyz hvezda KLESNE (sesazeni):**
1. Vyzva skonci neuspechem (nebo 3× warm-up penalizace)
2. Uzivatel ten den mozna ani neotevre apku
3. DRUHY DEN (nebo pri pristim otevreni apky) se zobrazi modal
   - "Tvoje hvezdy v kategorii Navyky klesly na 1★ Novice"
   - S vysvetlenim proc (2× selhal / warm-up penalizace)
   - S tipem na zlepseni
   - Jemnejsi, informativni ton (ne depresivni)

**Design modalu - vizualni podoba:**

Modal bude mit DVE varianty - jednu slavnostni (povyseni) a jednu informativni (sesazeni).
Obe varianty musi fungovat spravne v Light i Dark theme.

🔼 **Povyseni (napr. 2★ → 3★ Challenger):**

Obsah modalu:
- Nazev kategorie (napr. "Navyky" / "Habits")
- Animovane hvezdy v barve NOVE urovne (viz barvy nize)
- Nazev nove urovne (napr. "Challenger")
- Motivacni text
- Tlacitko "Super!"

Animace pri otevreni:
1. Modal se objevi, uzivatel vidi 2 hvezdy (stare) zarovnane na stred
2. BUM! - treti hvezda vybuchne do sceny (zvetseni z nuly + bounce efekt)
3. Vsechny hvezdy se plynule presunou aby zustaly zarovnane na stred
4. Hvezdy zmeni barvu na barvu nove urovne
5. Nazev urovne se plynule zmeni (Explorer → Challenger)
6. Jemny glow/zablesk kolem hvezd + haptic feedback pri "bouchnuti"

🔽 **Sesazeni (napr. 3★ → 2★ Explorer):**

Obsah modalu:
- Nazev kategorie
- Animovane hvezdy v barve NOVE (nizsi) urovne
- Nazev nove urovne
- Vysvetleni proc doslo k sesazeni (2× selhal / warm-up penalizace)
- Motivacni tip na zlepseni
- Tlacitko "Jdu do toho!"

Animace pri otevreni:
1. Modal se objevi, uzivatel vidi 3 hvezdy v puvodni barve
2. Treti hvezda ztmavne a ZMENSI se (fade out + scale down)
3. Zbyle 2 hvezdy se plynule presunou na stred
4. Hvezdy zmeni barvu na barvu nizsi urovne
5. Nazev urovne se plynule zmeni (Challenger → Explorer)

**Barvy hvezd podle urovne** (tematicke - kazda uroven ma svou barvu):
- 1★ Novice = seda (#9E9E9E)
- 2★ Explorer = modra (#2196F3)
- 3★ Challenger = fialova (#9C27B0)
- 4★ Expert = oranzova (#FF9800)
- 5★ Master = zlata (#FFD700)

**Theme podpora:**
- Pozadi modalu, texty a tlacitka pouzivaji barvy z naseho theme systemu (Light/Dark)
- Barvy hvezd zustavaji stejne v obou themes (jsou dostatecne kontrastni)
- Zadne hardcoded bile/cerne barvy - vse pres colors z ThemeContext

**Implementace po krocich:**
- [x] 5.5.1: Vytvorit novy modal StarLevelChangeModal (design, animace, lokalizace EN/DE/ES)
- [x] 5.5.2: Povyseni - napojit modal tak, aby se zobrazil hned po gratulaci za splnenou vyzvu
- [x] 5.5.3: Sesazeni - ulozit info o zmene do pameti a zobrazit pri pristim otevreni aplikace
- [x] 5.5.4: Otestovat oba scenare (nahoru i dolu)

**Reseni:** Vytvorena nova komponenta StarLevelChangeModal s animacemi hvezd (bounce-in pro povyseni, fade-out pro sesazeni). Pridan listener v MonthlyChallengeSection pro `star_level_changed` event. Povyseni se zobrazi hned po zavreni completion modalu (500ms delay). Sesazeni se ulozi do AsyncStorage a zobrazi pri pristim otevreni appky (1s delay). Lokalizace pridany ve vsech 3 jazycich (EN, DE, ES). Typ pridan do i18n.ts. Animace vylepseny pomoci Reanimated (spring physics, modal impact shake) + Skia (radial glow burst).

**Status:** [x] HOTOVO

---

### 5.6 `star_progression_updated` - aktualizace progrese hvezd

**Problem:** Event se emituje v starRatingService.ts (radek 336), ale zadna komponenta ho neposlouchá.

**Co to ma delat:** Informovat UI o aktualizaci progrese smerem k dalsi hvezde.

**Dopad:** Nizky. Jde o granularni update - uzivatel vidi progress pri nacitani screenu.

**Rozhodnuti:** NEPOTREBNY - listener neni nutny. Hvezdy se vyhodnocuji na konci mesice, uzivatel normalne prechazi mezi taby a obrazovka se nacte znovu. Real-time aktualizace by jen spinila kod bez realne pridane hodnoty pro uzivatele. Event ponechan pro pripadne budouci analytics.

**Status:** [x] UZAVRENO - nepotrebny

---

### 5.7 `difficulty_recalculated` - prepocet obtiznosti

**Problem:** Event se emituje v starRatingService.ts (radek 429), ale zadna komponenta ho neposlouchá.

**Co to ma delat:** Informovat o prepoctu obtiznosti vyzvy na zaklade vykonnosti uzivatele.

**Dopad:** Zadny pro uzivatele. Interni event pro analytics/debugging.

**Rozhodnuti:** NEPOTREBNY - ciste interni event pro debugging. Uzivatel z nej nic nema. Event ponechan v kodu pro pripadne budouci analytics, ale listener neni potreba.

**Status:** [x] UZAVRENO - nepotrebny

---

## Prehled vsech bodu

| Faze | # | Problem | Rozhodnuti |
|------|---|---------|------------|
| 1 | 1.1 | Duplicitni flame achievement | K prodiskutovani |
| 1 | 1.2 | Dvojity level-up modal | K oprave |
| 1 | 1.3 | Goal milestones nefungují | K prodiskutovani |
| 1 | 1.4 | Daily Launch XP (5 vs 10) | K rozhodnuti |
| 1 | 1.5 | Harmony Streak bonus chybi | K rozhodnuti |
| 1 | 1.6 | Goal 100% milestone chybi | Souvisi s 1.3 |
| 2 | 2.1 | Nekonzistentni levelUp data | K oprave (po 1.2) |
| 2 | 2.2 | Comeback Bonus zavadejici | K oprave |
| 2 | 2.3 | BIG_GOAL_COMPLETION v docs | K oprave (docs) |
| 2 | 2.4 | Warm-up 4-star nekonzistence | K rozhodnuti |
| 2 | 2.5 | Raw string misto enum | K oprave |
| 2 | 2.6 | 3-Tier vs 4-Tier komentare | K oprave |
| 3 | 3.1 | Modal docs zastarala | K prepisu |
| 3 | 3.2 | Achievement pocty v docs | K oprave (docs) |
| 3 | 3.3 | Komentar v kodu (76 vs 78) | K oprave |
| 3 | 3.4 | 16 nedokumentovanych eventu | K oprave (docs) |
| 3 | 3.5 | TypeScript interfaces chybi | K implementaci |
| 3 | 3.6 | Event data nesouhlasi | Souvisi s 3.5 |
| 3 | 3.7 | Validace/logovani neexistuje | K rozhodnuti |
| 4 | 4.1 | Timing hodnoty v docs | Souvisi s 3.1 |
| 4 | 4.2 | Achievement nazvy vs ID | Volitelne |
| 5 | 5.1-5.7 | Mrtve eventy bez listeneru | Viz vyse |
| **6** | **6.1** | **Centralni Modal Queue** | **K implementaci** |
| 7 | 7.1 | Modal vyzvy zobrazuje 0 XP vsude | OPRAVENO |
| 7 | 7.2 | Perfect Completion Bonus neexistuje | ODSTRANENO |
| 7 | 7.3 | Zastarala XP tabulka v dokumentaci | OPRAVENO |
| 8 | 8.1 | Vyzva se neuzavre na konci mesice | OPRAVENO |
| 8 | 8.2 | Hardcoded 30 dnu v dennich targetech | OPRAVENO |
| 8 | 8.3 | Rovne vahy pozadavku | NEOPRAVOVAT (UI task naplánován) |
| 8 | 8.4 | Hardcoded userId v progress trackeru | PŘESUNUTO (future-updates) |
| 8 | 8.5 | Potencialne chybejici preklady | OVERENO - OK |
| 8 | 8.6 | Neefektivni prepocet aktivnich dnu | OPRAVENO |
| 8 | 8.7 | Balance score nedokumentovany | OPRAVENO |
| 8 | 8.8 | Weekly habit variety pouziva SYNC verzi | OVERENO - OK |

---

## FAZE 6: Centralni Modal Queue - Nahrada 4-Tier systemu

### Problem

Soucasny "4-Tier Modal Priority System" nefunguje spolehlive. Hlavni duvody:

1. **Zadna centralni kontrola** - 4 ruzna mista v kodu (XpAnimationContext, AchievementContext, MonthlyChallengeSection, journal.tsx) kazdy ridi svuj vlastni `<Modal>` komponent nezavisle
2. **Koordinace pres flagy je krehka** - `isActivityModalActive`, `isAchievementModalActive` atd. se nastavuji rucne, s `setTimeout` zpozdenim, a snadno se zapomene nebo nastane race condition
3. **Dva `<Modal>` naraz = zamrznuti na iOS** - React Native nativni Modal na iOS neumoznuje dva modaly soucasne. Kdyz se to stane, aplikace zamrzne (opakovane potvrzeno testem)
4. **Nove modaly = novy chaos** - kazdy novy modal vyzaduje rucni integraci s flagy, coz je narusene a neskalnuje

### Reseni: Centralni Modal Queue

Jeden `ModalQueueContext` ktery:
- Prijima pozadavky na modaly (`enqueue`)
- Radi je podle priority
- Zobrazuje VZDY jen JEDEN modal naraz
- Kdyz uzivatel zavre modal, automaticky ukaze dalsi ve fronte
- Zadne flagy, zadne setTimeout, zadne race conditions

### Ktere modaly budou v queue (celebracni/odmenove)

Pouze modaly ktere se mohou spustit AUTOMATICKY (bez akce uzivatele) a mohou kolidovat:

| # | Modal | Soucasny Tier | Kde se renderuje | Trigger |
|---|-------|---------------|------------------|---------|
| 1 | CelebrationModal (daily_complete) | Tier 1 | journal.tsx | 3. zapis v deniku |
| 2 | CelebrationModal (streak_milestone) | Tier 1 | journal.tsx | Streak milnik (7, 14, 21...) |
| 3 | CelebrationModal (bonus_milestone) | Tier 1 | journal.tsx | 1./5./10. bonus zapis |
| 4 | GoalCompletionModal | Tier 1 | GoalsScreen.tsx | Cil dosahne 100% |
| 5 | MonthlyChallengeCompletionModal | Tier 2 | MonthlyChallengeSection.tsx | `monthly_challenge_completed` event |
| 6 | MonthlyChallengeMilestoneModal | Tier 2 | MonthlyChallengeSection.tsx | `monthly_milestone_reached` event |
| 7 | StarLevelChangeModal | Zadny! | MonthlyChallengeSection.tsx | `star_level_changed` event |
| 8 | MultiplierActivationModal | Zadny! | XpMultiplierSection.tsx | `xpMultiplierActivated` event |
| 9 | AchievementCelebrationModal | Tier 3 | AchievementContext.tsx | `achievementUnlocked` event |
| 10 | CelebrationModal (level_up) | Tier 4 | XpAnimationContext.tsx | `levelUp` event |

### Ktere modaly ZUSTANOU mimo queue (uzivatelske akce)

Modaly ktere uzivatel otevre sam (kliknutim) se neradi do fronty - jsou primo svazane s UI akci:

| Modal | Duvod proc neni ve fronte |
|-------|---------------------------|
| HabitModal (vytvoreni/editace) | Uzivatel ho sam otevira |
| GoalModal (vytvoreni/editace) | Uzivatel ho sam otevira |
| ProgressModal (logovani progressu) | Uzivatel ho sam otevira |
| EditGratitudeModal | Uzivatel ho sam otevira |
| ConfirmationModal (mazani) | Uzivatel ho sam otevira |
| GoalTemplatesModal | Uzivatel ho sam otevira |
| HomeCustomizationModal | Uzivatel ho sam otevira |
| MonthlyChallengeDetailModal | Uzivatel ho sam otevira |
| AchievementDetailModal | Uzivatel ho sam otevira |
| StreakWarmUpModal + podmodaly | Uzivatel ho sam otevira |
| TutorialOverlay/Modal | Samostatny onboarding system |
| HelpTooltip | Singleton tooltip |
| ErrorModal, BaseModal (settings) | Reakce na chybu/akci |
| TargetDate modaly (uvnitr GoalModal) | Vnorene v GoalModal |

### Prioritni poradi ve fronte

Kdyz prijde vice modalu naraz, zobrazi se v tomto poradi (1 = prvni):

| Priorita | Typ | Priklad |
|----------|-----|---------|
| 1 (nejvyssi) | Activity celebrations | Bonus milestone, Daily complete, Streak milestone |
| 2 | Goal completion | Cil dosahne 100% |
| 3 | Monthly challenge | Splneni vyzvy, milestone 25/50/75% |
| 4 | Star level change | Povyseni/sesazeni hvezd |
| 5 | Multiplier activation | XP multiplikator aktivovan |
| 6 | Achievement | Odemceni achievementu |
| 7 (nejnizsi) | Level-up | Dosazeni noveho levelu |

### Zjistene mezery v soucasnem systemu (z review pred implementaci)

Tyto problemy v soucasnem kodu POTVRZUJI nutnost centralniho queue a musi se zohlednit pri implementaci:

1. **MonthlyChallengeSection - 3 modaly BEZ koordinace:**
   - `MonthlyChallengeCompletionModal`, `MonthlyChallengeMilestoneModal` a `StarLevelChangeModal` jsou vsechny rizeny jen lokalnim stavem
   - NEVOLAJI `notifyMonthlyChallengeModalStarted/Ended` - stary 4-Tier system je vubec nekoordinuje!
   - Mohou se zobrazit soucasne s jakymkoliv jinym modalem → iOS freeze
   - **Queue toto automaticky vyresi** - kazdy z nich bude enqueue a zobrazi se az kdyz je rady

2. **MultiplierActivationModal - zadna koordinace:**
   - V tabulce oznacen "Zadny!" tier - nema vubec zadnou prioritu v systemu
   - Muze kolidovat s libovolnym jinym modalem
   - **Queue toto automaticky vyresi**

3. **`achievementQueueStarting` pre-registracni pattern:**
   - Soucasny system pouziva event `achievementQueueStarting` ktery se emituje SYNCHRONNE pred jednotlivymi `achievementUnlocked` eventy
   - Slouzi k tomu, aby XpAnimationContext vedel ze "achievements prichazi" a nastavil flag DRIVE nez dorazi prvni achievement
   - **V novem queue systemu NENI POTREBA** - kazdy achievement se proste prida do fronty pres `enqueue()` a queue sam zajisti poradi. Zadne pre-registracni flagy.
   - Pri migraci kroku 6.1.4 tento listener ODSTRANIT z XpAnimationContext

### Technicky plan implementace

**Novy soubor: `src/contexts/ModalQueueContext.tsx`**

```
interface QueuedModal {
  id: string;                    // Unikatni ID (pro deduplikaci)
  type: ModalType;               // Enum: 'celebration', 'achievement', 'level_up', ...
  priority: number;              // 1-7 (nizsi = vyssi priorita)
  component: string;             // Nazev komponenty k renderovani
  props: Record<string, any>;    // Data pro komponentu
  timestamp: number;             // Cas pridani
}

interface ModalQueueContextValue {
  enqueue: (modal: QueuedModal) => void;  // Prida modal do fronty
  closeCurrentModal: () => void;           // Zavre aktualni modal, ukaze dalsi
  currentModal: QueuedModal | null;        // Aktualne zobrazeny modal
  queueLength: number;                     // Pocet modalu ve fronte
}
```

**Kroky implementace:**

- [x] 6.1.1: Vytvorit `ModalQueueContext.tsx` s frontou, prioritnim razenim a renderovanim
- [x] 6.1.2: Pridat ModalQueueProvider do `RootProvider.tsx` (obalit celou appku)
- [x] 6.1.3: Presunout CelebrationModal (level_up) z XpAnimationContext do queue
- [x] 6.1.4: Presunout AchievementCelebrationModal z AchievementContext do queue
- [x] 6.1.5: Presunout Journal celebrations (daily, streak, bonus) z journal.tsx do queue
- [x] 6.1.6: Presunout GoalCompletionModal z GoalsScreen do queue
- [x] 6.1.7: Presunout Monthly modaly z MonthlyChallengeSection do queue
- [x] 6.1.8: Presunout MultiplierActivationModal z XpMultiplierSection do queue
- [x] 6.1.9: Odstranit stary 4-Tier system z XpAnimationContext + TutorialContext + Monthly modaly
- [x] 6.1.10: Aktualizovat stress test v Settings
- [x] 6.1.11: TypeScript build check - 0 chyb
- [x] 6.1.12: Prepsat technickou dokumentaci (technical-guides.md, Gamification-UI, Events, Monthly-Challenges, My-Journal, Goals)

### Co se SMAZE (zjednoduseni kodu)

Po implementaci se odstrani:
- `modalCoordination` state v XpAnimationContext (~50 radku)
- `notifyActivityModalStarted/Ended` (~30 radku)
- `notifyMonthlyChallengeModalStarted/Ended` (~30 radku)
- `notifyAchievementModalStarted/Ended` (~20 radku)
- `processLevelUpModals` (~50 radku)
- `pendingLevelUpModals` fronta (~20 radku)
- `showLevelUpModal/hideLevelUpModal` (~50 radku)
- `celebrationQueue` v AchievementContext (~60 radku)
- `showNextCelebration/closeCelebrationModal` (~40 radku)
- `isHigherPriorityModalActive` (~10 radku)
- `modalQueue/processModalQueue` v journal.tsx (~40 radku)
- Legacy `notifyPrimaryModalStarted/Ended` (~10 radku)

**Celkem: ~410 radku smazano, nahrazeno ~150 radky v jednom souboru.**

### Bezpecnostni pravidla

1. VZDY jen JEDEN `<Modal visible={true}>` v cele aplikaci
2. Kazdy modal ve fronte ma `id` pro deduplikaci (stejny modal se neprida dvakrat)
3. Timeout: pokud uzivatel nezavre modal do 30s, automaticky se zavre a ukaze dalsi
4. Pokud uzivatel naviguje pryc (zmeni tab), fronta se POZASTAVI (ne smaze)
5. Tutorial overlay POTLACUJE vsechny celebration modaly (kontrola pred enqueue)


---

## FAZE 7: Gratulacni modal za splneni mesicni vyzvy (vysoka priorita)

Tyto problemy se tykaji modalu, ktery se zobrazi kdyz uzivatel splni mesicni vyzvu. Modal obsahuje sekci "XP Rewards Earned" kde by mely byt videt vsechny odmeny - kolik XP dostal za samotnou vyzvu, za streak, za perfektni splneni a celkem. Bohuzel kvuli technicke chybe v predavani dat modal zobrazuje nulove hodnoty a nektere sekce se vubec nezobrazi.

---

### 7.1 Modal za splneni mesicni vyzvy zobrazuje 0 XP vsude

**Problem z reportu:** Sekce "XP Rewards Earned" v modalu ukazuje +0 za Base Challenge XP, +0 za Total XP Earned. Sekce "Monthly Streak", "Star Level Progression" a "Ready for Next Month?" se nikdy nezobrazi. Statistiky (Requirements, Active Days, Milestones) jsou vzdy 0.

**Vysvetleni:** Kdyz uzivatel splni vyzvu, system spravne vypocita XP a prida je na jeho konto. Zaroven odesle zpravu do gratulacniho modalu - "tady jsou data k zobrazeni". Problem je, ze zprava pouziva jina pojmenovani nez co modal ocekava. Je to jako kdyby nekdo napsal dopis "Pro: Jan Novak" ale postou ho poslal na adresu "Pro: J. Novak" - nedorazi. Konkretne: system odesle data pod nazvem `xpAwarded`, ale modal hleda `totalXPEarned`. System posle `streak`, ale modal hleda `monthlyStreak`. A pole jako `baseXP`, `bonusXP`, `streakBonus`, `requirementsCompleted`, `activeDays`, `milestonesReached`, `starLevelChanged` a `nextMonthEligible` v odeslane zprave vubec neexistuji - takze modal vsude zobrazi 0 a podminene sekce (streak, hvezdy, dalsi mesic) se nikdy nezapnou.

**Dopad:** Vysoky. Uzivatel vidi +0 XP misto realnych hodnot (ktere mohou byt i 5 000-25 000+ XP). XP mu spravne pribyde na profilu, takze neni financne poskozeny - ale motivacni efekt gratulacniho modalu je uplne ztracen. Uzivatel nevi, kolik presne dostal, nevi o svem streaku, nevi o zmene hvezd a nevi na co se tesit dalsi mesic.

**Navrh opravy:** Opravit nazvy poli v odeslane zprave tak, aby odpovidaly tomu, co modal ocekava. Zaroven doplnit chybejici pole (baseXP, bonusXP, streakBonus, statistiky, info o hvezdach a dalsim mesici). Zmena se provede na jednom miste v kodu (funkce `completeMonthlyChallenge` v monthlyProgressTracker.ts).

**Status:** [x] OPRAVENO - Event nyni emituje vsechna pole dle MonthlyChallengeCompletionResult (baseXP, bonusXP, streakBonus, totalXPEarned, requirementsCompleted, activeDays, milestonesReached, oldStarLevel, newStarLevel, starLevelChanged, monthlyStreak, nextMonthEligible). Zmena v monthlyProgressTracker.ts.

---

### 7.2 "Perfect Completion Bonus" v modalu nikdy nevznikne

**Problem z reportu:** Modal za splneni vyzvy obsahuje radek "Perfect Completion 🏆" ktery by mel zobrazit bonus XP pro uzivatele co splni vyzvu na 100%. Tento radek se ale nikdy nezobrazi a bonus nikdy neni pridelit.

**Vysvetleni:** V modalu je pripravena vizualni sekce "Perfect Completion 🏆 +??? XP" a v datovem modelu existuje pole `perfectCompletionBonus`. Ale v casti kodu, ktera vypocita odmeneni pri splneni vyzvy, toto pole neni nikdy vypocitano ani nastaveno. Je to jako kdybys mel v menu restaurace nabidku "Dezert zdarma pro ty co snedi cely talir" - ale kuchyn o tom nikdy nedostala instrukce, takze dezert nikdo nedostane. Uzivatel ktery splni vyzvu na 100% dostane stejnou odmenu jako kdyz ji splni na 80%.

**Dopad:** Stredni. Uzivatel ktery odvede perfektni praci (100% splneni) nedostane zadny extra bonus, i kdyz modal naznacuje ze by mel existovat. Chybi motivace dotahnout vyzvu na 100% misto jen na 70%.

**Navrh opravy:** Rozhodnout, jestli tento bonus chceme zachovat. Pokud ano - implementovat vypocet (napr. +20% extra za 100% splneni, stejne jak uz funguje "Completion Bonus"). Pokud ne - odstranit radek z modalu a pole z datoveho modelu, aby modal nesliboval neco co neexistuje.

**Status:** [x] ODSTRANENO - Pole `perfectCompletionBonus` odebrano z typu, event emise, modal UI a vsech 4 lokalizaci (EN/DE/ES/CZ). Bonus neexistoval v logice, ted neexistuje ani v UI.

---

### 7.3 Zastarala XP tabulka v technicke dokumentaci Monthly Challenges

**Problem z reportu:** Technicka dokumentace `technical-guides:Monthly-Challenges.md` obsahuje dve sekce ktere si navzajem odporuji - uvadeji ruzne XP odmeny za stejne hvezdy.

**Vysvetleni:** V dokumentaci jsou dve mista kde jsou napsany XP odmeny za mesicni vyzvy. Prvni sekce "FULL Challenge XP" rika spravne hodnoty (1★ = 5 000 XP, 2★ = 7 500 XP, az 5★ = 25 000 XP). Druha sekce "STAR_SCALING" rika uplne jine hodnoty (1★ = 500 XP, 2★ = 750 XP, az 5★ = 2 532 XP) - coz jsou ve skutecnosti XP pro zjednodusene Warm-Up vyzvy pro nove uzivatele, ne pro plnohodnotne Full vyzvy. Kod je v poradku a pouziva spravne hodnoty (5 000-25 000 XP pro Full, 500-2 532 XP pro Warm-Up). Problem je jen v dokumentaci.

**Dopad:** Zadny pro uzivatele. Matouci pro vyvojare - pri cteni dokumentace nevedi, ktere cislo je spravne, a mohli by omylem implementovat vyzvu se spatnymi XP hodnotami.

**Navrh opravy:** Aktualizovat sekci "STAR_SCALING" v `technical-guides:Monthly-Challenges.md` tak, aby zobrazovala spravne Full challenge hodnoty (5 000-25 000 XP). Nebo tuto sekci uplne smazat - jsou to stare hodnoty z doby pred 10x XP systemem a uz nejsou potreba.

**Status:** [x] OPRAVENO - Sekce STAR_SCALING v technical-guides:Monthly-Challenges.md aktualizovana: pridany obe XP tabulky (MONTHLY_XP_REWARDS 5000-25000 a WARM_UP_XP_REWARDS 500-2532) aby odpovidaly skutecnemu kodu.

---

## FAZE 8: Celkova analyza Monthly Challenge systemu

Komplexni audit celeho systemu mesicnich vyzev - od generovani pres tracking az po zobrazeni uzivateli. Kontrolovano: jak se vyzvy vytvarejí, jak se sleduje pokrok, co uzivatel vidi, a jestli data odpovidaji realite.

**Pozitivni zjisteni:**
- Baseline analyza pouziva REALNA data z aktivity uzivatele (zadne vymyslene hodnoty)
- Tracking progresu je real-time a funkcni (habit, journal, goal eventy se okamzite promitnou)
- Vsechna UI data v modalech a sekcich jsou realna (zadne hardcoded nuly nebo dummy data)
- Event-driven architektura je cista - vsechny listenery maji cleanup, zadne memory leaky
- Star rating system funguje spravne (100% = +1★, <70% 2x = -1★)
- Kategorialni rotace penalizuje opakovani

---

### 8.1 Vyzva se neuzavre na konci mesice

**Problem z auditu:** Kdyz mesic skonci a uzivatel nesplnil vyzvu na 100%, vyzva se nikdy neuzavre. Neprohlasi se ani za usech, ani za neuspech. Zustane "otevrenal" v pameti.

**Vysvetleni:** System kontroluje pouze jednu podminku: `completionPercentage >= 100`. Pokud uzivatel dosahne treba 95% a mesic skonci, nic se nestane. Vyzva se neuzavre, star rating se neaktualizuje (takze uzivatel nedostane ani penalizaci za neuspech), a v UI muze zustat stary stav. Je to jako kdyby ucitel na konci semestru proste nehodnotil studenty, kteri nemaji 100% - ani je nenechá propadnout, ani projit. Proste se na ne zapomene.

**Dopad:** Vysoky. Star rating system nefunguje spravne - uzivatel ktery opakavane neuspeje, nikdy nedostane penalizaci (-1★), protoze neuspech se nikdy nezaznamena. Navic lifecycle manager generuje novou vyzvu pro dalsi mesic, ale stara zustava ve stavu "aktivni".

**Navrh opravy:** Pridat logiku pro konec mesice: kdyz zacne novy mesic (nebo kdyz lifecycle manager zjisti prechod), automaticky uzavrit predchozi vyzvu. Pokud splneni >= 70%, zaznamenat jako castecny uspech (zadna zmena hvezd). Pokud < 70%, zaznamenat jako neuspech (pocitat do consecutive failures pro potencialni demotion). Zmena v `monthlyChallengeLifecycleManager.ts`.

**Status:** [x] OPRAVENO - Implementována metoda `closePreviousChallenge()` v lifecycle manageru, nový `MonthlyChallengeFailureModal`, event `monthly_challenge_failed`, star rating update při neúspěchu, streak reset, lokalizace EN/DE/ES.

---

### 8.2 Denni targety pocitaji vzdy s 30 dny

**Problem z auditu:** Na 3 mistech v kodu `monthlyChallengeService.ts` (radky 936, 1348, 1445) se denni target vypocitava jako `Math.ceil(target / 30)`. Vzdycky se deli 30, bez ohledu na skutecnou delku mesice.

**Vysvetleni:** Kdyz system generuje vyzvu a pocita kolik by mel uzivatel splnit denne, vzdy deli celkovy target cislem 30. Ale unor ma 28 dnu (nebo 29), a nektery mesice maji 31. Je to jako kdyby vam v praci rekli "rozdelete si 300 ukolu rovnomerne na 30 dnu" - ale mesic ma jen 28 dnu a vy nevite, ze byste meli pocitat s 28. Vysledek: v unoru jsou denni targety nizsi nez by mely byt (vyzva je lehci), v 31-dnovych mesicich mirne vyssi (vyzva je tezsi).

**Dopad:** Stredni. Rozdil je maximalne ~7% (28 vs 30), takze to neni dramaticke, ale je to nepresnost ktera se da snadno opravit.

**Navrh opravy:** Nahradit hardcoded `30` skutecnym poctem dnu v mesici. Informace o zacatku a konci mesice uz je dostupna v challenge objektu (`startDate`, `endDate`), staci je pouzit pro vypocet.

**Status:** [x] OPRAVENO - Nová helper `getDaysInMonth()` nahradila hardcoded `/30` na všech 3 místech. Používá `new Date(year, month, 0).getDate()` - automaticky řeší přestupné roky.

---

### 8.3 Vsechny pozadavky maji stejnou vahu

**Problem z auditu:** Funkce `calculateCompletionPercentage` v `monthlyProgressTracker.ts` (radek 514) vahuje vsechny pozadavky stejne - kazdy ma vahu 1, bez ohledu na obtiznost.

**Vysvetleni:** Predstav si, ze mas vyzvu se dvema pozadavky: "Splnte 600 navyku" a "Splnte 10 dnu progressu na cilich". Oba pozadavky se pocitaji jako 50% celku. Kdyz splnis tech 10 dnu progressu (coz je relativne lehke) a neudejas ani jeden navyk, ukazuje se ti 50% splneni - i kdyz jsi neudelo to hlavni. Je to jako kdyby ve skole znamka z matiky a z telocviku mela stejnou vahu na vyslednem prumeru.

**Dopad:** Stredni. Uzivatele vidi nepresnne procento dokonceni - lehke pozadavky nafukuji celkove procento. Ale protoze completion se spousti az pri 100%, funkcne to neovlivnuje - vsechny pozadavky musi byt splneny.

**Navrh opravy:** Rozhodnout, jestli chceme vahy upravit (napr. podle pomeru target / kategoricky prumer) nebo nechat stejne. Protoze completion vyzaduje 100% a kazdy pozadavek musi byt splnen, realne je dopad jen vizualni - progress bar ukazuje mirne zavadejici procento.

**Status:** [x] VYŘEŠENO - Logika výpočtu ponechána (funkčně správná). Přidány per-requirement progress bary do MonthlyChallengeSection — každý požadavek má vlastní bar s popisem, hodnotou (x/target) a statusem (✓/○). Celkový progress bar zůstává jako souhrn.

---

### 8.4 Hardcoded userId v progress trackeru

**Problem z auditu:** V `monthlyProgressTracker.ts` (radek 746) je `userId: 'current_user' // TODO: Get from authentication context`. Podobne v `monthlyChallengeService.ts` se pouziva `'local_user'`.

**Vysvetleni:** Kdyz se vytvari novy zaznam o pokroku vyzvy, system tam zapise uzivatelske ID jako pevny text "current_user" misto skutecneho ID uzivatele. Momentalne to nevadi, protoze aplikace podporuje jen jednoho uzivatele (offline aplikace). Ale kdyby se v budoucnu pridala podpora vice uzivatelu nebo cloudova synchronizace, toto by zpusobilo, ze vsichni uzivatele by sdileli stejny pokrok.

**Dopad:** Zadny momentalne (single-user app). Potencialni problem pro budouci rozsireni.

**Navrh opravy:** Zatim nechat - opravit az se bude implementovat multi-user podpora nebo Firebase autentizace. Zanechat TODO komentar jako pripominku.

**Status:** [x] PŘESUNUTO do projectplan-future-updates.md (Phase 0.1.1.C) — řešit až při implementaci multi-user/auth

---

### 8.5 Potencialne chybejici preklady pro milestone modaly

**Problem z auditu:** `MonthlyChallengeMilestoneModal.tsx` (radek 145) pouziva dynamicke i18n klice: `monthlyChallenge.milestone.motivation_25`, `motivation_50`, `motivation_75`. Pokud tyto klice chybi v nekterem jazykovem souboru (DE nebo ES), modal zobrazi nazev klice misto prelozeneho textu.

**Vysvetleni:** Kdyz uzivatel dosahne 25%, 50% nebo 75% mesicni vyzvy, zobrazi se mu motivacni zprava. Tato zprava se vytvari dynamicky - system slozi nazev klice z cisla milniku. Pokud preklad pro dany klic v danem jazyce neexistuje, uzivatel misto "Skvely zacatek!" uvidi neco jako "monthlyChallenge.milestone.motivation_25" - technicky text ktery nedava smysl. Podobne riziko existuje pro klice kategorii (`monthlyChallenge.categories.mastery`, `monthlyChallenge.categories.special`).

**Dopad:** Stredni. Uzivatel v nemecke nebo spanelske verzi muze videt anglicke klice misto prelozeneho textu v celebracnich modalech.

**Navrh opravy:** Proverit vsechny 3 jazykove soubory (EN, DE, ES) a overit, ze vsechny dynamicky skladane klice pro monthly challenge existuji ve vsech jazycich. Doplnit chybejici.

**Status:** [x] OVERENO - Vsechny dynamicke klice (milestone.motivation_25/50/75, categories.mastery/special, milestone.title/xpBonus/accessibility) existuji ve vsech 3 jazycich (EN, DE, ES). Zadne chybejici preklady.

---

### 8.6 Neefektivni prepocet aktivnich dnu

**Problem z auditu:** Funkce `recalculateActiveDays()` v `monthlyProgressTracker.ts` (radek 873) pri kazdem updatu pokroku nacte VSECHNY denni snapshoty vyzvy a prepocita aktivni dny od zacatku.

**Vysvetleni:** Kdyz uzivatel splni navyk nebo napise do deniku, system aktualizuje pokrok vyzvy. Soucasti toho je i prepocet kolik dnu v mesici byl uzivatel aktivni. Misto toho aby si pamatoval predchozi hodnotu a jen pridal dnesni den, pokazde nacte vsechny zaznamy od zacatku mesice a spocita je znovu. Na zacatku mesice je to 1-5 zaznamu (rychle), ale ke konci mesice to muze byt 25-30 zaznamu. Je to jako kdyby ucitel pri kazdem novem domacim ukolu precetl VSECHNY predchozi ukoly znovu, misto aby se jen podival na posledni.

**Dopad:** Nizky. Cache zmirniuje dopad a 30 zaznamu neni dramaticke mnozstvi. Uzivatel pravdepodobne nepozna zadny rozdil ve vykonu. Ale je to zbytecna prace.

**Navrh opravy:** Optimalizovat na inkrementalni tracking - pri update pridat dnesni datum do seznamu aktivnich dnu, pokud tam jeste neni. Neni urgentni.

**Status:** [x] OPRAVENO - Prepsano na inkrementalni tracking. Misto nacitani vsech snapshotu se pouze pridava dnesni datum do activeDays, pokud tam jeste neni.

---

### 8.7 Balance score neni nikde dokumentovany

**Problem z auditu:** V `monthlyProgressTracker.ts` (radky 956-962) se pocita "balance score" - metrika ktera meri, jak rovnomerne uzivatel pouziva ruzne funkce aplikace (navyky, denik, cile). Tato metrika se pouziva jako jeden z pozadavku nekterych konzistencnich vyzev, ale nikde v dokumentaci ani v UI neni vysvetlena.

**Vysvetleni:** Kdyz ma uzivatel vyzvu typu "Consistency" s pozadavkem na balance score, vidi treba "Balance: 0.7 / 0.8" - ale nikde se nedozvi co to znamena, jak se to pocita, nebo jak to zlepsit. Je to jako kdyby vam ve skole dali znamku z predmetu "Rovnovaha" a nikdo vam nerekl co to je a jak se to uci.

**Dopad:** Nizky. Uzivatel muze byt zmaten, kdyz vidi pozadavek na balance score bez vysvetleni. Ale vetsina vyzev tento pozadavek nepouziva.

**Navrh opravy:** Pridat vysvetleni balance score do technicke dokumentace (`technical-guides:Monthly-Challenges.md`) a pripadne pridat tooltip v UI, kdyz se tento pozadavek objevi ve vyzve.

**Status:** [x] OPRAVENO - Balance score zdokumentovan v technical-guides:Monthly-Challenges.md (algoritmus, tabulka, priklady). Pridan UI tooltip pod progress barem s lokalizacemi EN/DE/ES.

---

### 8.8 Weekly habit variety pouziva SYNC verzi

**Problem z auditu:** Funkce `calculateWeeklyHabitVarietyIncrement` v `monthlyProgressTracker.ts` (radky 445-447) pouziva synchronni cache-based vypocet uvnitr asynchronni funkce. Muze dojit k situaci, kde dva soucasne eventy (napr. uzivatel rychle splni dva ruzne navyky) nevidi navzajem sve zmeny.

**Vysvetleni:** Kdyz system pocita kolik ruznych navyku uzivatel splnil v danem tydnu, pouziva "fotku" aktualniho stavu misto toho, aby se podival primo do uloziste. Pokud dva navyky dorazi v rychlem sledu (treba behem jedne sekundy), oba se mohou podivat na stejnou "fotku" a oba si mysli, ze jsou "novy unikatni navyk" - i kdyz uz jeden z nich byl zapocitan. Vysledek: weekly habit variety muze byt o 1 vyssi nez by mela.

**Dopad:** Nizky. Realne se to muze stat jen pri velmi rychlem klikani a rozdil je maximalne +1 v jednom tydnu. Nema vyznamny vliv na celkovy pokrok vyzvy.

**Navrh opravy:** Pouzit zamek (mutex) nebo serializovat updaty aby se zpracovavaly postupne. Nicmene uz existuje sequential queue v `updateMonthlyProgress` ktera by mela toto castecne resit. Neni urgentni.

**Status:** [x] OVERENO - Sequential queue (processProgressUpdate) jiz zajistuje serialni zpracovani. Race condition realne nehrozi. Zmena neni potreba.

---

## FAZE 9: Android Edge-to-Edge (API 35) - Povinná migrace pro Google Play

### Proc to delame

Google od Android 15 (API 35) **POVINNE** vyzaduje, aby aplikace cilici na API 35+ pouzivaly edge-to-edge rendering. Google Play nam dal ultimatum - bez teto zmeny neprijmou nove verze aplikace.

**Co to znamena pro uzivatele:**
- Aplikace zabere CELOU obrazovku - navigacni tlacitka dole i status bar nahore budou pruhledne
- Obsah plynule "proteka" pod navigacni listu pri scrollovani - moderni, premiovy pocit
- Aplikace bude vypadat jako Instagram, Spotify nebo WhatsApp
- Vice prostoru pro obsah - zadne "mrtve zony" mezi obsahem a tlacitky

**Co to znamena pro nas (vyvojare):**
- Zapnout `edgeToEdgeEnabled: true` v app.json
- Projit KAZDY screen a zajistit, ze fixni prvky (bannery, tlacitka) maji `paddingBottom: insets.bottom`
- ScrollView obsah muze proteka pod navigaci (zadny padding) - ale posledni polozka musi byt videt
- Modaly s tlacitky dole musi mit padding pro navigacni listu
- Tutorial overlay uz je spravne pripraveny (pouziva `insets.bottom`)

**Riziko:** Nizke. Zmeny jsou male (pridani paddingu), zadna logika se nemeni. Jediny risk je vizualni - neco se muze schovat pod navigaci, ale to je videt okamzite a opravi se rychle.

---

### KROK 0: Konfigurace (zaklad)

- [x] **0.1** Zmenit `edgeToEdgeEnabled` z `false` na `true` v `app.json` (Android sekce)
- [x] **0.2** Overit ze `expo-status-bar` ma `translucent={true}` (uz mame v `_layout.tsx`)
- [x] **0.3** Overit ze `react-native-safe-area-context` je nainstalovany a SafeAreaProvider je v root layoutu

---

### KROK 1: Tab screeny (5 screenu) - spodni Safe Area + AdMob banner

Kazdy tab screen ma `SafeAreaView` a `AdBanner` fixovany dole. Je treba zajistit, ze banner nesedne POD navigacni listu.

**Vzor opravy pro tab screeny:**
```
bannerContainer: {
  position: 'absolute',
  bottom: insets.bottom,  // ZMENA: bylo bottom: 0
  left: 0, right: 0,
}
contentPadding: {
  paddingBottom: 60 + insets.bottom,  // ZMENA: pridat insets.bottom
}
```

- [x] **1.1 Home** (`app/(tabs)/index.tsx`)
  - SafeAreaView `edges={['bottom']}` → `edges={[]}` (tab bar resi bottom safe area)

- [x] **1.2 Habits** (`src/screens/habits/HabitsScreen.tsx`)
  - SafeAreaView `edges={['bottom']}` → `edges={[]}` (tab bar resi bottom safe area)

- [x] **1.3 Journal** (`app/(tabs)/journal.tsx`)
  - SafeAreaView bez `edges` prop → pridano `edges={[]}` (tab bar resi bottom safe area)

- [x] **1.4 Goals** (`src/screens/goals/GoalsScreen.tsx`)
  - SafeAreaView `edges={['bottom']}` → `edges={[]}` (tab bar resi bottom safe area)

- [x] **1.5 Settings** (`app/(tabs)/settings.tsx`)
  - SafeAreaView `edges={['bottom']}` → `edges={[]}` (tab bar resi bottom safe area)

---

### KROK 2: Stack screeny s AdMob bannerem (5 screenu) - spodni Safe Area

Tyto screeny maji custom header (pres `useSafeAreaInsets` nahoře) a `AdBanner` fixovany dole. Nektere NEMAJI spodni safe area vubec.

- [x] **2.1 Achievements / Trophy Room** (`app/achievements.tsx`)
  - Pridano `useSafeAreaInsets`, `bottom: insets.bottom` na banner, `paddingBottom: 120 + insets.bottom` na scroll

- [x] **2.2 Habit Stats** (`app/habit-stats.tsx`)
  - Pridano `useSafeAreaInsets`, `bottom: insets.bottom` na banner

- [x] **2.3 Journal Stats** (`app/journal-stats.tsx`)
  - Pridano `useSafeAreaInsets`, `bottom: insets.bottom` na banner, `paddingBottom: 60 + insets.bottom`

- [x] **2.4 Journal History** (`app/journal-history.tsx`)
  - Pridano `useSafeAreaInsets`, `bottom: insets.bottom` na banner, `paddingBottom: 60 + insets.bottom`

- [x] **2.5 Goal Stats** (`src/screens/goals/GoalStatsScreen.tsx`)
  - `bannerContainer.bottom: 0` → `bottom: insets.bottom` (padding uz byl spravne)

---

### KROK 3: Stack screeny BEZ AdMob banneru (2 screeny)

- [x] **3.1 Levels Overview** (`src/screens/levels/LevelsOverviewScreen.tsx`)
  - Pridano `paddingBottom: Layout.spacing.xl + insets.bottom` do listContainer

- [x] **3.2 Reorder Habits** (`src/screens/habits/ReorderScreen.tsx`)
  - Opraveny import SafeAreaView na `react-native-safe-area-context`
  - Pridano `useSafeAreaInsets` a `paddingBottom: insets.bottom`

---

### KROK 4: Tab Bar navigace

- [x] **4.1 Tab Bar layout** (`app/(tabs)/_layout.tsx`)
  - Tab bar automaticky resi safe area pres React Navigation - overeno, zadna hardcoded height

---

### KROK 5: AdMob Banner komponenta

- [x] **5.1 AdBanner** (`src/components/ads/AdBanner.tsx`)
  - Overeno: jen `paddingVertical: 4`, zadny marginBottom - rodic resi safe area

---

### KROK 6: Modaly s tlacitky dole (uzivatelske akce)

Modaly pouzivaji RN `<Modal>` ktery se renderuje pres celou obrazovku. Tlacitka "Ulozit", "Zrusit" atd. na spodku modalu mohou byt pod navigacni listou.

- [x] **6.1 HabitModal** - Opraveny import SafeAreaView z RN na react-native-safe-area-context
- [x] **6.2 GoalModal** - Opraveny import SafeAreaView z RN na react-native-safe-area-context
- [x] **6.3 ProgressModal** - Opraveny import SafeAreaView z RN na react-native-safe-area-context
- [x] **6.4 EditGratitudeModal** - Centrovany dialog, nepotrebuje fix
- [x] **6.5 StreakWarmUpModal** - Opraveny import SafeAreaView z RN na react-native-safe-area-context
- [x] **6.6 WarmUpModals** - Centrovany dialog (BaseModal pattern), nepotrebuje fix
- [x] **6.7 ConfirmationModal** - Centrovany dialog (BaseModal pattern), nepotrebuje fix
- [x] **6.8 ErrorModal** - Centrovany dialog (BaseModal pattern), nepotrebuje fix
- [x] **6.9 BaseModal** - Centrovany dialog (`justifyContent: 'center'`), nepotrebuje fix
- [x] **6.10 AchievementDetailModal** - Opraveny import SafeAreaView z RN na react-native-safe-area-context
- [x] **6.11 MonthlyChallengeDetailModal** - Centrovany dialog, nepotrebuje fix
- [x] **6.12 HomeCustomizationModal** - Uz pouziva spravny SafeAreaView z react-native-safe-area-context
- [x] **6.13 TargetDateConfirmationModal** - Centrovany dialog, nepotrebuje fix
- [x] **6.14 TargetDateStepSelectionModal** - Centrovany dialog, nepotrebuje fix

---

### KROK 7: Celebracni modaly (rizene ModalQueueContext)

Tyto modaly se zobrazuji automaticky a maji tlacitko "OK/Super/Dalsi". Obsah je obvykle vycentrovany, takze spodni safe area je potreba jen pro tlacitko.

- [x] **7.1-7.8 Vsechny celebracni modaly** - Centrovane dialogy (`justifyContent: 'center'`), tlacitka jsou uprostred obrazovky, nepotrebuje fix

---

### KROK 8: Tutorial system

- [x] **8.1 TutorialOverlay** - ✅ Uz pouziva `useSafeAreaInsets` a `insets.bottom`
- [x] **8.2 TutorialModal** - ✅ Uz pouziva `paddingBottom: insets.bottom`
- [x] **8.3 SpotlightEffect** - ✅ Skia Canvas `absoluteFill` pokryva celou obrazovku

---

### KROK 9: Ostatni komponenty s fixni pozici

- [x] **9.1 HelpTooltip** - Absolute pozice jen pro sipky tooltipov, ne pro celkove umisteni
- [x] **9.2 AchievementTooltip** - Zadna fixni pozice
- [x] **9.3 GratitudeInput** - Zadna fixni pozice, v ScrollView

---

### KROK 10: Splash screen a app start

- [x] **10.1** Splash screen (`expo-splash-screen`) resi edge-to-edge automaticky
- [x] **10.2** `backgroundColor` v app.json pro splash je `#ffffff` - OK

---

### KROK 11: Testovani

- [x] **11.1** TypeScript build check - 0 novych chyb (2 pre-existujici v monthlyProgressTracker)
- [ ] **11.2** Vizualni kontrola vsech 5 tab screenu
- [ ] **11.3** Vizualni kontrola vsech 7 stack screenu
- [ ] **11.4** Kontrola vsech modalu - tlacitka nejsou pod navigaci
- [ ] **11.5** Kontrola AdMob banneru - neni pod navigaci
- [ ] **11.6** Kontrola tutorialu - karticka a spotlight funguje
- [ ] **11.7** Test na Androidu s navigacnimi TLACITKY (3-button nav)
- [ ] **11.8** Test na Androidu s GESTOVOU navigaci (swipe)
- [ ] **11.9** Test na iOS - zadne regrese (insets.bottom = home indicator)
- [ ] **11.10** Test Light + Dark theme - zadne vizualni problemy

---

### KROK 12: Dokumentace

- [x] **12.1** Pridano do `technical-guides.md` - kompletni sekce "Android Edge-to-Edge (API 35)"

---

### Prehled screenu a jejich stav

| # | Screen / Komponenta | Typ | AdMob? | Safe Area dole PRED | Status |
|---|---------------------|-----|--------|---------------------|--------|
| 1.1 | Home | Tab | ✅ | `edges={['bottom']}` | [x] |
| 1.2 | Habits | Tab | ✅ | `edges={['bottom']}` | [x] |
| 1.3 | Journal | Tab | ✅ | Vsechny edges | [x] |
| 1.4 | Goals | Tab | ✅ | `edges={['bottom']}` | [x] |
| 1.5 | Settings | Tab | ✅ | `edges={['bottom']}` | [x] |
| 2.1 | Achievements | Stack | ✅ | ❌ ZADNA | [x] |
| 2.2 | Habit Stats | Stack | ✅ | ❌ CHYBI dole | [x] |
| 2.3 | Journal Stats | Stack | ✅ | ❌ CHYBI dole | [x] |
| 2.4 | Journal History | Stack | ✅ | ❌ CHYBI dole | [x] |
| 2.5 | Goal Stats | Stack | ✅ | ✅ `insets.bottom` | [x] |
| 3.1 | Levels Overview | Stack | ❌ | ❌ CHYBI dole | [x] |
| 3.2 | Reorder Habits | Stack | ❌ | ⚠️ Spatny import | [x] |
| 4.1 | Tab Bar | Nav | - | Auto (overit) | [x] |
| 5.1 | AdBanner | Komp | - | Rodic resi | [x] |
| 6.1-6.14 | 14 uzivatelskych modalu | Modal | - | Zkontrolovat | [x] |
| 7.1-7.8 | 8 celebracnich modalu | Modal | - | Zkontrolovat | [x] |
| 8.1-8.3 | Tutorial system | Overlay | - | ✅ Pripraveno | [x] |
| 9.1-9.3 | Tooltips + input | Komp | - | Zkontrolovat | [x] |
| 10.1-10.2 | Splash screen | Start | - | Overit | [x] |

**IMPLEMENTACE DOKONCENA. Zbyva vizualni testovani (11.2-11.10).**

---

## FAZE 10: Optimalizace plynulosti - prvni habit completion lag

### Problem

Kdyz uzivatel poprve v session oznaci navyk jako splneny, aplikace se na chvili "kousne" (~75-200ms). Od druheho kliknuti je vse plynule. Jde o "studeny start" - pri prvnim kliknuti se probouzi cely retezec sluzeb, ktere se inicializuji az na posledni chvili (lazy loading).

### Vysvetleni pro laiky

Predstav si, ze pri kazdem zastaveni auta musis znovu nastartovat motor. Prvni start rana trvá dele, protoze motor je studeny. Dalsi starty uz jsou rychle, protoze motor je zahrity. Nase aplikace dela totez - pri prvnim kliknuti na navyk "startuje motory" pro XP system, achievementy a multiplikatory. Druhe kliknuti uz je bleskove, protoze vsechno bezi.

**Reseni: Nastartovat motory predem pri otevreni aplikace + ukazat zavrtnuti OKAMZITE a pocitat XP na pozadi.**

### Co presne zpusobuje zpozdeni (retezec operaci pri prvnim kliknuti)

```
Klik na navyk
  └→ SQLiteHabitStorage.createCompletion()
       └→ GamificationService.addXP()
            └→ performXPAddition() [queued operation]
                 ├→ getTotalXP() [DB read]
                 ├→ validateXPAddition()
                 │    ├→ getAdjustedDailyLimits()
                 │    │    └→ getActiveXPMultiplier()
                 │    │         └→ DYNAMIC IMPORT xpMultiplierService [5-15ms cold start]
                 │    └→ getDailyXPData()
                 │         └→ DYNAMIC IMPORT featureFlags [cold start]
                 │         └→ DYNAMIC IMPORT database/init [cold start]
                 │         └→ 4x SQLite queries [20-40ms celkem]
                 ├→ getActiveXPMultiplier() [DRUHY volani - uz cached]
                 ├→ DYNAMIC IMPORT featureFlags [cold start]
                 ├→ DYNAMIC IMPORT database/init [cold start]
                 ├→ SQLite ACID transakce (INSERT + UPSERT + UPSERT)
                 ├→ updateXPBySource() [legacy tracking]
                 ├→ updateLastActivity() [legacy tracking]
                 ├→ triggerXPAnimation() [DeviceEventEmitter]
                 └→ DYNAMIC IMPORT achievementService [5-15ms cold start]
                      └→ checkAchievementsAfterXPAction() [50-150ms]
```

### Identifikovane problemy (4 vinici)

**Vinik 1: Dynamicke importy (cold start penalty)**
- `gamificationService.ts:2425` - `await import('./xpMultiplierService')` v `getActiveXPMultiplier()`
- `gamificationService.ts:754` - `await import('../config/featureFlags')` v `performXPAdditionInternal()`
- `gamificationService.ts:758` - `await import('./database/init')` v `performXPAdditionInternal()`
- `gamificationService.ts:2242` - `await import('../config/featureFlags')` v `getDailyXPData()`
- `gamificationService.ts:2246` - `await import('./database/init')` v `getDailyXPData()`
- `gamificationService.ts:877` - `await import('./achievementService')` v achievement check
- **Dopad**: Kazdy dynamicky import pri prvnim volani zabere 5-15ms na parsovani a inicializaci modulu

**Vinik 2: 4 sekvencni DB dotazy v getDailyXPData()**
- `gamificationService.ts:2251` - SELECT z xp_daily_summary
- `gamificationService.ts:2271` - SELECT z xp_transactions s GROUP BY (goal anti-spam)
- `gamificationService.ts:2287` - SELECT COUNT z xp_transactions (journal count)
- `gamificationService.ts:2296` - SELECT z xp_transactions ORDER BY DESC LIMIT 1
- **Dopad**: Dotazy bezi sekvencne (jeden po druhem), celkem 20-40ms

**Vinik 3: Achievement check po XP pridani**
- `gamificationService.ts:877-892` - Po KAZDEM pridani XP se kontroluji achievementy
- Nacte vsechny achievementy, vyfiltruje relevantni, vyhodnoti podminky
- Pri prvnim volani: inicializace AchievementService + AsyncStorage reads
- **Dopad**: 50-150ms (nejvetsi vinik)

**Vinik 4: Optimistic UI se nepouziva**
- `HabitItemWithCompletion.tsx:146-161` - `handleToggleCompletion` ceka na `await onToggleCompletion()`
- Checkbox se zaskrtne AZ po dokonceni cele operace (XP + achievementy + animace)
- `HabitsContext.tsx:276` - `await habitStorage.toggleCompletion()` blokuje dispatch
- **Dopad**: Uzivatel vidi "zamrzly" checkbox po celou dobu zpracovani

---

### Plan opravy (3 kroky)

#### 10.1: Optimistic UI - okamzita vizualni odezva

**Cil**: Checkbox se zaskrtne OKAMZITE po kliknuti, XP a achievementy se pocitaji na pozadi.

**Co se zmeni**:
- `HabitsContext.tsx` - `toggleCompletion()` provede dispatch PRED awaitovanim storage operace
- Pokud storage operace selze, provede se rollback (odskrtnuti)
- Uzivatel vidi okamzitou odezvu, tezke operace bezi na pozadi

**Implementace**:
- [x] 10.1.1: V `toggleCompletion()` pridat optimistic dispatch PRED `await habitStorage.toggleCompletion()`
- [x] 10.1.2: Pridat rollback logiku pro pripad chyby (dispatch DELETE_COMPLETION)
- [x] 10.1.3: Overit ze vizualni stav checkboxu je okamzity

**Soubory k uprave**: `src/contexts/HabitsContext.tsx` (1 soubor, ~15 radku zmena)

---

#### 10.2: Eager initialization - zahrivani motoru pri startu appky

**Cil**: Predem nahrat moduly a inicializovat cache, ktere zpusobuji cold start pri prvnim kliknuti.

**Co se zmeni**:
- `gamificationService.ts` - Nahradit dynamicke importy `featureFlags` a `database/init` statickymi (top-level) importy
- `achievementService` a `xpMultiplierService` ZUSTAVAJI dynamicke (cirkularni dependence - oba importuji GamificationService)

**KRITICKE - Cirkularni dependence (overeno v kodu):**
- `achievementService.ts` radek 22: `import { GamificationService } from './gamificationService'` → STATICKA dependence
- `xpMultiplierService.ts`: dynamicky importuje GamificationService → cirkularni
- Proto oba MUSI zustat jako `await import()` aby se zabranilo cirkularnimu nacitani modulu

**Implementace**:
- [x] 10.2.1: Nahradit dynamicke importy `featureFlags` za staticky top-level import (7 vyskytu)
- [x] 10.2.2: Nahradit dynamicke importy `database/init` za staticky top-level import (7 vyskytu)
- [x] 10.2.3: PONECHAT dynamicky import `achievementService` (radek 877) - cirkularni dependence
- [x] 10.2.4: PONECHAT dynamicky import `xpMultiplierService` (radek 2425) - cirkularni dependence
- [x] 10.2.5: Overit ze appka startuje bez regresu

**Soubory k uprave**: `src/services/gamificationService.ts` (1 soubor)

---

#### 10.3: Achievement check optimalizace - presun na pozadi

**Cil**: Achievement kontrola po pridani XP nebude blokovat vraceni vysledku. XP se pricte okamzite, achievementy se zkontroloji asynchronne.

**Co se zmeni**:
- `gamificationService.ts:871-892` - Achievement check se spusti bez `await` (fire-and-forget)
- Result z `addXP()` se vrati OKAMZITE po zapsani XP do DB
- Achievementy se vyhodnoti na pozadi a pripadne modaly se enqueuji do ModalQueue

**Implementace**:
- [x] 10.3.1: Odstranit `await` pred `AchievementService.checkAchievementsAfterXPAction()`
- [x] 10.3.2: Pridat `.catch()` handler pro logovani chyb z pozadi
- [x] 10.3.3: Overit ze achievement modaly se stale spravne zobrazuji (pres ModalQueue)

**Soubory k uprave**: `src/services/gamificationService.ts` (1 soubor, ~5 radku zmena)

---

---

#### 10.4: Vytvoreni navyku - achievement check na pozadi

**Cil**: Modal pro vytvoreni navyku se zavre OKAMZITE po ulozeni. Achievement check bezi na pozadi (stejne jako uz funguje u cilu).

**Soucasny stav** (`HabitsContext.tsx:189-230`):
```
setLoading(true)
→ habitStorage.create() [~5ms]
→ dispatch ADD_HABIT [okamzite]
→ isTutorialRestarted() [AsyncStorage ~5ms] ← ZBYTECNE BLOKUJE
→ isTutorialActive() [2× AsyncStorage ~10ms] ← ZBYTECNE BLOKUJE
→ await AchievementService.runBatchAchievementCheck() [50-150ms] ← BLOKUJE ZAVRENI MODALU
→ return newHabit
→ setLoading(false) ← TEPRVE TED SE MODAL ZAVRE
```

**Problem**: Achievement check (50-150ms) blokuje zavreni modalu. U GoalsContext.tsx je to UZ VYRESENE pres `setTimeout(() => ..., 100)`.

**Co se zmeni**:
- `HabitsContext.tsx:200-220` - Presunout tutorial check + achievement check do `setTimeout` (stejny pattern jako GoalsContext)
- Modal se zavre hned po `dispatch({ type: 'ADD_HABIT' })`
- Achievement check probehne na pozadi

**Tutorial bezpecnost**:
- Achievement modaly se behem tutorialu POTLACUJI (`AchievementContext.tsx:345-347`)
- VYJIMKA: `first-habit` a `first-goal` se zobrazuji i behem tutorialu (`AchievementContext.tsx:343`)
- `first-habit` achievement se odemkne pres `checkAchievementsAfterXPAction` (volane z `addXP` uvnitr `habitStorage.create`), NE pres `runBatchAchievementCheck`
- Proto presunuti `runBatchAchievementCheck` do setTimeout NEOVLIVNI tutorial - `first-habit` modal se stale zobrazi spravne
- Tutorial restarted check (`isTutorialRestarted`) slouzi jen k logovani, ne k blokaci - presun do setTimeout je bezpecny

**Implementace**:
- [x] 10.4.1: Zabalit tutorial check + runBatchAchievementCheck do `setTimeout(() => ..., 100)` (kopie vzoru z GoalsContext)
- [x] 10.4.2: Overit ze `first-habit` achievement modal se stale zobrazi pri prvnim vytvoreni navyku (behem tutorialu)
- [x] 10.4.3: Overit ze modal pro vytvoreni navyku se zavre okamzite

**Soubory k uprave**: `src/contexts/HabitsContext.tsx` (1 soubor, ~5 radku zmena - jen zabaleni do setTimeout)

---

#### 10.5: Zapis do deniku - XP na pozadi, streak zustava synchronni

**Cil**: Tlacitko "Odeslat" v deniku se odblokuje rychleji. Pouze XP (nejvetsi vinik 75-200ms) bezi na pozadi. Milestone countery a streak update ZUSTAVAJI synchronni (jsou rychle a UI je potrebuje).

**Soucasny stav** (`SQLiteGratitudeStorage.ts:201-316` + `GratitudeInput.tsx:82-136`):
```
GratitudeInput.handleSubmit():
  → setIsSubmitting(true) ← tlacitko se zablokuje
  → getStreak() [~5ms] ← NUTNE (debt check)
  → calculateFrozenDays() [~5ms] ← NUTNE (debt check)
  → actions.createGratitude()
      → gratitudeStorage.create()
          → SQLite INSERT [~5ms]
          → GamificationService.addXP() [75-200ms] ← BLOKUJE (JEDINY VINIK)
          → milestone counter update [~5ms] ← rychle, zustava sync
          → calculateAndUpdateStreak() [~10ms] ← rychle, zustava sync
      → dispatch ADD_GRATITUDE [okamzite]
      → refreshStats() [uz na pozadi - OK]
  → setIsSubmitting(false) ← TEPRVE TED SE TLACITKO ODBLOKUJE
  → onSubmitSuccess() → celebration logic
```

**Problem**: `gratitudeStorage.create()` ceka na `addXP()` (75-200ms) PRED vracenim vysledku. To je jediny velky vinik.

**Co se zmeni**:
- `SQLiteGratitudeStorage.ts` - Presunout POUZE `addXP()` za `return` jako fire-and-forget
- Milestone countery a `calculateAndUpdateStreak()` ZUSTAVAJI synchronni (pred return)
- Duvod: Streak milestone modal v `journal.tsx` cte `state.streakInfo` po `refreshStats()`. Pokud by streak update bezel na pozadi, `refreshStats()` by mohla precist STARY streak a milestone modal by se nezobrazil.

**Proc NESMI streak bezet na pozadi** (overeno v kodu):
```
journal.tsx handleInputSuccess():
  → celebration modaly pouzivaji currentCount (lokalni stav) ← OK
  → ALE: streak milestone modal (radek 89-105):
      → setTimeout(1000ms)
      → await actions.refreshStats() ← cte streak z DB
      → if (milestones.includes(currentStreak)) ← rozhoduje o zobrazeni modalu
      → Pokud streak update NEBYL dokoncen, cte STARY streak → modal se NEZOBRAZI!
```

**Tutorial bezpecnost**:
- Journal nema tutorial-specificky achievement
- Daily_complete modal pouziva `currentCount` (lokalni stav), ne storage result
- Streak milestone modal: bezpecny protoze streak update zustava sync

**Implementace**:
- [x] 10.5.1: V `SQLiteGratitudeStorage.create()` presunout POUZE `GamificationService.addXP()` za milestone/streak logiku jako fire-and-forget promise s `.catch()` handlerem
- [x] 10.5.2: Milestone counter update a `calculateAndUpdateStreak()` ZUSTAVAJI pred return (synchronni)
- [x] 10.5.3: Zachovat poradi: INSERT → milestones → streak → return → (pozadi: XP)
- [x] 10.5.4: Overit ze celebration modaly se stale zobrazuji spravne
- [x] 10.5.5: Overit ze XP popup animace se stale zobrazuje

**Soubory k uprave**: `src/services/storage/SQLiteGratitudeStorage.ts` (1 soubor, ~10 radku zmena)

**Poznamka k debt checku**: `getStreak()` a `calculateFrozenDays()` v GratitudeInput.tsx ZUSTAVAJI synchronni. Bezpecnostni check ktery MUSI probehnout pred ulozenim.

---

### Ocekavany vysledek (vsechny kroky dohromady)

| Akce | PRED opravou | PO oprave |
|------|-------------|-----------|
| Zasrknuti navyku (prvni) | 75-200ms | <16ms (okamzite) |
| Zasrknuti navyku (dalsi) | ~5ms | ~5ms (beze zmeny) |
| Vytvoreni navyku (zavreni modalu) | 70-170ms | ~10ms |
| Vytvoreni cile | ~10ms | ~10ms (uz je OK) |
| Zapis do deniku (odblokování tlacitka) | 100-230ms | ~15ms |

**Celkovy efekt**: Vsechny hlavni akce uzivatele reagují okamzite. XP, achievementy a streak updaty bezi na pozadi - uzivatel je nepozna, ale dostane vsechny odmeny.

---

### Poradi implementace

1. **10.1 (Optimistic UI - habit toggle)** - Nejvetsi dopad, nejmensi zmena
2. **10.2 (Eager init)** - Odstraneni cold start penalty pri startu appky
3. **10.3 (Async achievements v addXP)** - Achievement check nebrzdi zadnou XP operaci
4. **10.4 (Habit creation - async achievement)** - Zavreni modalu nebrzdi achievement check
5. **10.5 (Journal - async XP+streak)** - Tlacitko reaguje okamzite

Kroky 10.3, 10.4, 10.5 jsou na sobe NEZAVISLE a mohou se implementovat v libovolnem poradi.
Krok 10.3 automaticky zrychluje i 10.5 (protoze addXP se vola uvnitr journal create).

### Tutorial ochrana - souhrn

| Krok | Tutorial riziko | Proc je to bezpecne |
|------|----------------|---------------------|
| 10.1 | ZADNE | Optimistic UI nemeni logiku, jen poradi dispatch vs storage |
| 10.2 | ZADNE | Warmup pri startu - tutorial jeste nebezi |
| 10.3 | ZADNE | Achievement modaly se behem tutorialu potlacuji (krome first-habit/first-goal). Ty se odemykaji pres `checkAchievementsAfterXPAction` v `addXP`, ne pres `runBatchAchievementCheck` |
| 10.4 | ZADNE | `first-habit` achievement se odemyka uvnitr `habitStorage.create()` → `addXP()` → `checkAchievementsAfterXPAction()`. `runBatchAchievementCheck` v setTimeout je jen pojistka - i bez nej se first-habit odemkne |
| 10.5 | ZADNE | Journal nema tutorial-specificke achievementy. Celebration modaly (daily_complete) se triggeri z `handleInputSuccess()` na zaklade `currentCount` stavu, ne z navratove hodnoty storage |

### Rizika

- **10.1**: Minimalni. Pokud storage selze, rollback vrati puvodni stav. Uz pouzivame tento pattern u `updateHabitOrder()`.
- **10.2**: Zadne. Pridavame jen "zahrivaci" volani pri startu - nic se nemeni na logice.
- **10.3**: Nizke. Achievement modaly uz pouzivaji ModalQueue. Jediny vedlejsi efekt: achievement modal se muze objevit o ~100ms pozdeji - uzivatel nepozna.
- **10.4**: Zadne. Kopirujeme presny pattern z GoalsContext, ktery uz funguje mesice bez problemu.
- **10.5**: Nizke. SQLite INSERT (data) probehne vzdy pred return. XP a streak se dopocitaji na pozadi. Nejhorsi scenar: uzivatel zavre appku behem 200ms po zapisu - XP se nepricte. Ale to je extrémne nepravdepodobne a pri dalsim otevreni se data zrekonciliuji.

---

## FAZE 11: Context memoization - zabraneni zbytecnym re-renderum

### Problem

React Context providers vytvari novy objekt `value` PRI KAZDEM renderovani. I kdyz se data NEZMENILA, vsechny consumer komponenty se znovu vykresli. Napriklad: zmena stavu v AppContext zpusobi re-render VSECH komponent pouzivajicich HabitsContext - i kdyz habits data se vubec nezmenila.

### Vysvetleni pro laiky

Predstav si, ze mas skrinky s ruznym obsahem. Pokazde kdyz otevres jednu skrinku, system prohlasi ze se VSECHNY zmenily - a tak se vsechny znovu kontroluji. S `useMemo` system rekne: "zkontroluj jestli se OBSAH opravdu zmenil - pokud ne, pouzij ten samy odkaz". Vysledek: komponenty se prekresluji JEN kdyz se jejich data skutecne zmeni.

### Hloubkova analyza kazdeho kontextu (overeno proti kodu)

Po detailnim precteni kodu bylo zjisteno, ze kontexty maji RUZNE state management patterny. Nelze pouzit jednotny pristup pro vsechny.

**BEZPECNE pro useMemo (useReducer s jednim `state` objektem):**
- HabitsContext, GoalsContext, GratitudeContext, AppContext pouzivaji `useReducer` → `state` je jediny objekt
- Action funkce (createHabit, toggleCompletion...) jsou plain funkce uzavirajici nad:
  - `dispatch` → stabilni reference z useReducer, NEMENI SE
  - `habitsQueryCacheRef` a jine refs → stabilni reference, `.current` se cte az v call-time
  - `state` → meni se pri kazdem dispatch → zachyceno v `[state]` dependency
- Proto `useMemo([state])` JE BEZPECNE - funkce se znovu vytvori kdyz se state zmeni, a stabilni reference (dispatch, refs) jsou vzdy aktualni

**BEZPECNE s upravenym dependency:**
- ThemeContext - pouziva `useState` pro jednu promennou `themeMode`, `setThemeMode` je plain funkce → zabalit do useCallback + useMemo
- ModalQueueContext - pouziva `useState` pro `queue`, `enqueue` a `closeCurrentModal` jsou uz useCallback s [] deps (pouzivaji `setQueue(prev => ...)` pattern) → `useMemo([queue, enqueue, closeCurrentModal])` je bezpecne

**PRESKOCIT (prilis slozite, riziko stale closures):**
- XpAnimationContext - pouziva `useState` s jednim state objektem, ALE ma 4 refs (`batchTimeoutRef`, `notificationQueueRef`...) a useCallback funkce s neuplnymi dependency arrays. useMemo by melo prilis mnoho dependencies a neresilo by existujici problem s neuplnymi deps
- AchievementContext - pouziva VICE `useState` hooku (userAchievements, isLoading, celebrationQueue, showingCelebration...). contextValue ma 25+ poli → dependency array by mel 20+ polozek. Marginalni prinos, vysoke riziko chyby
- TutorialContext - pouziva `useReducer`, ALE action funkce uzaviraji nad `t()` funkci z `useTranslation()`. Pri zmene jazyka by se `t()` zmenila ale useMemo by to nezachytil → tutorial texty by zustaly ve starem jazyce

### Co se meni a co NESMI prestit fungovat

**KRITICKE: useMemo NEMENI logiku - jen zabranuje zbytecnym re-renderum.**

| Oblast | Overeni | Verdikt |
|--------|---------|---------|
| Habits: Smart Bonus Conversion, make-up system | Logika je uvnitr `useHabitsData.ts` a `applySmartBonusConversion()`, ne v context value | BEZ ZMENY |
| Habits: XP integration (25/15 XP) | Logika je v `SQLiteHabitStorage.createCompletion()` → `GamificationService.addXP()` | BEZ ZMENY |
| Goals: Milestone detection (25/50/75%) | Logika je v `SQLiteGoalStorage.addProgress()` | BEZ ZMENY |
| Goals: Completion celebration modal | Triggeruje se z `GoalsScreen.tsx`, ne z context value | BEZ ZMENY |
| Journal: Frozen streak, debt, warm-up | Logika je v action funkcich (`calculateFrozenDays`, `applySingleWarmUpPayment`) | BEZ ZMENY |
| Journal: Celebration modaly | Triggeruji se z `journal.tsx handleInputSuccess()` na zaklade lokalniho stavu | BEZ ZMENY |
| Theme: Light/dark switching | `setThemeMode` dostane useCallback wrapper → stale stabilni | BEZ ZMENY |
| ModalQueue: Modal priority, sequential display | `enqueue` a `closeCurrentModal` uz jsou useCallback → stabilni | BEZ ZMENY |

### Postizene kontexty (6 souboru - bezpecne)

| # | Kontext | State management | Dependency pro useMemo |
|---|---------|-----------------|----------------------|
| 1 | HabitsContext.tsx | useReducer → `state` | `[state]` |
| 2 | GoalsContext.tsx | useReducer → `state` | `[state]` |
| 3 | GratitudeContext.tsx | useReducer → `state` | `[state]` |
| 4 | AppContext.tsx | useReducer → `state` | `[state]` |
| 5 | ThemeContext.tsx | useState → `themeMode` | `[colors, themeMode, isDark, setThemeModeCallback]` |
| 6 | ModalQueueContext.tsx | useState → `queue` | `[queue, enqueue, closeCurrentModal]` |

### Preskocene kontexty (3 soubory - prilis slozite)

| # | Kontext | Duvod preskoceni |
|---|---------|-----------------|
| 1 | XpAnimationContext.tsx | 4 refs + useCallback s neuplnymi deps → useMemo nepomuze |
| 2 | AchievementContext.tsx | 25+ poli v contextValue z vicenarych useState → prilis velka dependency array |
| 3 | TutorialContext.tsx | Action funkce uzaviraji nad `t()` z useTranslation → zmena jazyka by nebyla zachycena |

### Implementace

**Vzor zmeny pro useReducer kontexty** (HabitsContext, GoalsContext, GratitudeContext, AppContext):
```
// PRED:
return (
  <Context.Provider value={{ state, actions: { ... } }}>

// PO:
const contextValue = useMemo(() => ({
  state,
  actions: { loadHabits, createHabit, ... }
}), [state]);  // state z useReducer se meni referenci pri kazdem dispatch

return (
  <Context.Provider value={contextValue}>
```

**Vzor zmeny pro ThemeContext:**
```
// PRED:
const setThemeMode = async (mode) => { ... };  // plain funkce

// PO:
const setThemeModeCallback = useCallback(async (mode) => {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  setThemeModeState(mode);
}, []);  // zadne external dependencies

const value = useMemo(() => ({
  colors, themeMode, isDark, setThemeMode: setThemeModeCallback
}), [colors, themeMode, isDark, setThemeModeCallback]);
```

**Vzor zmeny pro ModalQueueContext:**
```
// PRED:
const contextValue = { enqueue, closeCurrentModal, currentModal, queueLength };

// PO:
const contextValue = useMemo(() => ({
  enqueue,           // uz je useCallback([])
  closeCurrentModal, // uz je useCallback([])
  currentModal: queue.length > 0 ? queue[0]! : null,
  queueLength: queue.length,
}), [queue, enqueue, closeCurrentModal]);
```

**Poradi implementace:**
- [x] 11.1: HabitsContext.tsx - useMemo na value (radek 332-343), dependency: `[state]`
- [x] 11.2: GoalsContext.tsx - useMemo na value (radek 353-367), dependency: `[state]`
- [x] 11.3: GratitudeContext.tsx - useMemo na value (radek 308-328), dependency: `[state]`
- [x] 11.4: AppContext.tsx - useMemo na value (radek 197-205), dependency: `[state]`
- [x] 11.5: ThemeContext.tsx - useCallback na setThemeMode + useMemo na value
- [x] 11.6: ModalQueueContext.tsx - useMemo na contextValue (radek 138-143), dependency: `[queue, enqueue, closeCurrentModal]`
- [x] 11.7: TypeScript build: 0 errors

**Soubory k uprave**: 6 souboru v `src/contexts/`, kazdy zmena ~5-10 radku

### Rizika

- **ZADNE funkcni riziko** pro useReducer kontexty: `state` se meni referenci pri kazdem dispatch → useMemo se prepocita → vsechny consumer komponenty dostanou novy stav
- **Jedine riziko u ThemeContext**: `setThemeModeCallback` s `useCallback([])` nema dependencies → funkce pouziva `setThemeModeState` ze useState (stabilni setter) a `AsyncStorage.setItem` (globalni) → BEZPECNE
- **ModalQueueContext**: `enqueue` a `closeCurrentModal` pouzivaji `setQueue(prev => ...)` pattern → nezaviraji nad `queue` → BEZPECNE

---

## ~~FAZE 12: N+1 goal stats query~~ - ODSTRANENO (uz optimalizovano)

### Puvodni plan

Nahradit N+1 pattern v GoalsContext (N× `getGoalStats()` volani) jednim batch SQL dotazem.

### Duvod odstraneni

Po hloubkove analyze kodu bylo zjisteno, ze optimalizace NENI potreba:

1. **`getGoalStats()` dela tezke JS vypocty** (sorting, timeline estimation, completion percentage) - ne SQL dotazy. Batch SQL dotaz by neusetril cas protoze bottleneck je v JavaScriptu, ne v databazi.
2. **`Promise.all()` uz paralelizuje** - `GoalsContext.tsx` radky 143-144 a 335-336 uz pouzivaji `Promise.all(goals.map(...))`, takze N dotazu bezi soucasne.
3. **Skutecny prinos by byl < 5ms** pro typickeho uzivatele (3-10 cilu). Slozitost implementace (nova batch metoda, interface zmena) neodpovida minimalnimu prinosu.

**Status:** PRESKOCENO - soucasny kod uz je dostatecne optimalizovany.

---

## FAZE 13: FlatList optimalizace - plynulejsi scrollovani

### Problem

V aplikaci je vice FlatList komponent bez optimalizacnich props. React Native tak renderuje VSECHNY polozky naraz (misto jen tech viditelnych), coz muze zpusobit pomalejsi scroll a vyssi spotrebu pameti, zejmena na starsich telefonech.

### Vysvetleni pro laiky

Predstav si, ze mas knihu s 500 strankami. Misto toho abys otevrel jen aktualni stranku, system vytiskne VSECH 500 stranek naraz a drzi je v pameti. S optimalizaci system "vytiskne" jen 10 stranek kolem te aktualni a ostatni vytvori az kdyz k nim doscrollujes.

### Co se meni a co NESMI prestit fungovat

**Overeni proti technickym pruvodcum:**
- Habits: Smart Bonus Conversion barevne kodovani v kalendari - BEZ ZMENY (je v HabitCalendarView, ne v FlatList)
- Goals: GoalCard MA variabilni vysku (ruzne delky popisku) → `getItemLayout` NENASTAVOVAT
- Achievements: AchievementGrid ma pevnou velikost karet → `getItemLayout` MOZNE
- Levels: LevelsOverviewScreen uz MA `getItemLayout` - pridat jen chybejici props

### KRITICKE: DraggableFlatList vyloucen

Soubory `GoalListWithDragAndDrop.tsx`, `HabitList.tsx` a `HabitListWithCompletion.tsx` pouzivaji **`DraggableFlatList` z knihovny `react-native-draggable-flatlist`** (treti strana). Tento komponent ma JINE vnitrni API nez standardni FlatList:
- Renderuje vlastni `Animated.FlatList` s reanimated gestury
- Props jako `windowSize`, `maxToRenderPerBatch` NEMAJI garantovane chovani
- `removeClippedSubviews` muze skryt prvky behem presunu

**Proto se DraggableFlatList instance NEOPTIMALIZUJI.** Optimalizujeme POUZE standardni `<FlatList>` instance v techto souborech (pouzivane v view mode / Android fallback).

### Postizene FlatList komponenty (JEN standardni FlatList)

| # | Soubor | Radek | Typ obsahu | Doporucene props |
|---|--------|-------|------------|-----------------|
| 1 | AchievementGrid.tsx | 61 | Achievement karty (pevna vyska) | `getItemLayout`, `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 2 | GoalList.tsx | 74 | Goal karty (variabilni vyska) | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 3 | GoalListWithDragAndDrop.tsx | **198** | Goal karty (view mode FlatList, NE DnD) | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 4 | ProgressHistoryList.tsx | 217 | Progress zaznamy (pevna vyska) | `getItemLayout`, `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 5 | HabitList.tsx | **183** | Habit karty (Android FlatList) | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 6 | HabitList.tsx | **207** | Habit karty (view mode FlatList) | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 7 | HabitListWithCompletion.tsx | **230** | Habit checkboxy (non-edit FlatList) | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |
| 8 | achievements.tsx | 1185 | Achievement seznam | `windowSize`, `maxToRenderPerBatch`, `initialNumToRender` |

**Pozn.**: LevelsOverviewScreen.tsx (radek 370) uz MA `getItemLayout` - pridat `windowSize={5}`, `maxToRenderPerBatch={10}`, `initialNumToRender={10}`

### VYLOUCENE DraggableFlatList instance (NEDOTÝKAT SE)

| Soubor | Radek | Duvod vylouceni |
|--------|-------|-----------------|
| GoalListWithDragAndDrop.tsx | 186 | DraggableFlatList - treti strana, edit mode |
| HabitList.tsx | 191 | DraggableFlatList - treti strana, iOS edit mode |
| HabitListWithCompletion.tsx | 217 | DraggableFlatList - treti strana, iOS edit mode |

### Implementace

- [x] 13.1: AchievementGrid.tsx - pridat `windowSize={5}`, `maxToRenderPerBatch={10}`, `initialNumToRender={12}` (BEZ `getItemLayout` - multi-column + dvojity marginBottom = riskantni vypocet)
- [x] 13.2: GoalList.tsx - pridat `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={5}`
- [x] 13.3: GoalListWithDragAndDrop.tsx **radek 198** (view mode FlatList) - pridat `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={5}`
- [SKIP] 13.4: ProgressHistoryList.tsx - PRESKOCENO: `scrollEnabled={false}` = nulovy efekt props; variabilni vyska (podmínený item.note) = getItemLayout by byl chybny
- [x] 13.5: HabitList.tsx **radek 207** (inactive habits FlatList) - pridat `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={7}` (radek 183 preskocen - data=[{key:'content'}] = 1 item, zadny benefit)
- [x] 13.6: HabitListWithCompletion.tsx **radek 230** (non-edit FlatList) - pridat `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={7}`
- [SKIP] 13.7: achievements.tsx - PRESKOCENO: soubor neexistuje, AchievementGrid.tsx (krok 13.1) je jediny achievements FlatList
- [x] 13.8: LevelsOverviewScreen.tsx - doplnit chybejici `windowSize={5}`, `maxToRenderPerBatch={10}`, `initialNumToRender={10}`
- [ ] 13.9: Overit plynulost scrollovani na vsech zmenenych obrazovkach

**Soubory k uprave**: 5 souboru (6 FlatList instanci), kazdy zmena ~3-4 radky (pridani props)

### Rizika

- **Velmi nizke**: Pridani props nemeni logiku, jen optimalizuje renderovani
- **`getItemLayout` NEPOUZIVAME**: AchievementGrid ma multi-column + dvojity marginBottom (slozity vypocet). ProgressHistoryList ma variabilni vysku a scrollEnabled=false. U vsech ostatnich (variabilni vyska) take ne → zadny glitchy scroll
- **DraggableFlatList NEDOTKNUTY**: Vsechny tri DraggableFlatList instance (radky 186, 191, 217) zustavaji BEZ ZMENY → drag-and-drop funguje beze zmen

---

## FAZE 14: Console.log cleanup - selektivni odstraneni

### Problem

V produkcnim kodu aplikace je priblizne **1 192 console.log** volani. Kazde z nich zabira CPU cas na stringifikaci argumentu a na Androidu se zapisuje do logcat (I/O operace).

### Vysvetleni pro laiky

Predstav si, ze pri kazdem kroku zapisujes do deniku "Ted jsem sel doleva", "Ted jsem zvedl nohu". V produkci tyto zaznamy nikdo necte - jen zbytecne zatezuji telefon. Ale NEKTERE zaznamy jsou dulezite pro diagnostiku problemu u uzivatelu, takze je musime ponechat.

### KRITICKE: Rozliseni mezi debug logy a diagnostickymi logy

Po hloubkove analyze kodu bylo zjisteno, ze mnoho `console.log` volani NEJSOU obycejne debug logy, ale **strukturovane diagnosticke logy** s emoji prefixy (📥, ✅, 🔍, 🎯, 💥, ⚠️). Tyto logy slouzi k diagnostice produkcnich problemu a jejich slepé odstraneni by ztizilo debugging u uzivatelu.

**Kategorie logu:**

| Kategorie | Priklad | Akce |
|-----------|---------|------|
| Strukturovane diagnosticke | `📥 ModalQueue: enqueue celebration` | **PONECHAT** |
| Error handling (`catch` bloky) | `console.error('[GamificationService] addXP failed:', e)` | **PONECHAT** |
| `console.error` a `console.warn` | Vsechny | **PONECHAT** |
| Migracni a testovaci soubory | `database/migration/`, `__tests__/`, `diagnoseBackup.ts` | **PONECHAT** |
| Startup/init logy | `database/init.ts` (bezi 1× pri startu) | **PONECHAT** |
| Genericke debug logy | `console.log('here')`, `console.log('value:', x)` | **ODSTRANIT** |
| Verbose flow logy | `console.log('[DEBUG] entering function X')` | **ODSTRANIT** |
| Data dump logy | `console.log('Full state:', JSON.stringify(bigObject))` | **ODSTRANIT** |

### Co se meni a co NESMI prestit fungovat

- **console.error** a **console.warn** ZUSTAVAJI vzdy
- **Strukturovane diagnosticke logy** (s emoji prefixy) ZUSTAVAJI - pomahaji diagnostikovat produkcni problemy
- **console.log v `catch` blocich** ZUSTAVAJI - error handling je kriticke
- **Migracni, testovaci a diagnosticke skripty** BEZ ZMENY
- **Genericke debug logy** se ODSTRANI - nemaji diagnostickou hodnotu v produkci

### Top soubory k vycisteni

| # | Soubor | Celkem logu | Odhadnuto k odstraneni | Poznamka |
|---|--------|------------|----------------------|----------|
| 1 | gamificationService.ts | 84 | ~40-50 | Ponechat strukturovane XP/level logy, odstranit verbose flow |
| 2 | TutorialContext.tsx | 51 | ~30-35 | Ponechat error handling, odstranit step-by-step debug |
| 3 | SQLiteGratitudeStorage.ts | 41 | ~20-25 | Ponechat streak/frozen diagnostiku, odstranit CRUD verbose |
| 4 | achievementService.ts | 26 | ~10-15 | Ponechat achievement unlock logy, odstranit scan verbose |
| 5 | GoalForm.tsx | 25 | ~20-23 | Formular - vetsina jsou validacni debug logy |
| 6 | SQLiteGoalStorage.ts | 23 | ~10-15 | Ponechat milestone/completion logy, odstranit CRUD verbose |
| 7 | HabitForm.tsx | 23 | ~20-23 | Formular - vetsina jsou validacni debug logy |

**NECHAT BEZ ZMENY** (migrace, testy, diagnostika):
- monthlyProgressTracker.ts (65) - kriticke pro debugging mesicnich vyzev
- testJournalBackup.ts (60) - testovaci skript
- diagnoseBackup.ts (45) - diagnosticky skript
- Vsechny soubory v `database/migration/` - migrace bezi jen jednou
- Vsechny soubory v `__tests__/` - testovaci soubory
- performanceProfiler.ts (20) - profiling nastroj
- database/init.ts (24) - bezi jen pri startu, dulezite pro diagnostiku

### Implementace

**Strategie**: Projit kazdy soubor MANUALNE a rozlisit:
- ✅ PONECHAT: strukturovane logy s emoji/bracket prefixy, error handling, kriticke flow body
- ❌ ODSTRANIT: genericke debug, verbose flow, data dumpy, `[DEBUG]` prefixy

- [x] 14.1-14.8: VYRESENO AUTOMATICKY - `babel-plugin-transform-remove-console` byl jiz nainstalovan a nakonfigurovany v `babel.config.js`. V produktnich buildech se odstrani vsechny console.log automaticky (zachovany console.error + console.warn). Manualni mazani neni potreba.

**Soubory k uprave**: ~7-10 souboru
**Odhadovany pocet odstranenych logu**: ~150-200 z 1192 (cca 15%)

### Rizika

- **Zadne funkcni riziko**: console.log nema vliv na logiku aplikace
- **Zachovana diagnostika**: Strukturovane logy s emoji prefixy zustavaji → produkcni debugging NENI ohrozen
- **KRITICKE**: Pri manualni praci kontrolovat kazdy radek - nesmime smazat log ktery je jediny indikator chyby v catch bloku

---

## PRIORITNI PORADI IMPLEMENTACE FAZI 10-14

| Poradi | Faze | Oblast | Dopad | Obtiznost | Riziko |
|--------|------|--------|-------|-----------|--------|
| A | 11 | Context memoization (6 bezpecnych kontextu) | VYSOKY (vsechny consumer komponenty) | NIZKA (5-10 radku na soubor) | ZADNE |
| B | 10 | Habit completion + journal plynulost | VYSOKY (hlavni user akce) | STREDNI (10-15 radku na soubor) | NIZKE |
| C | 13 | FlatList optimalizace (8 standardnich FlatListu) | STREDNI (scroll plynulost) | NIZKA (3-5 radku na soubor) | VELMI NIZKE |
| D | 14 | Console.log selektivni cleanup (~150-200 logu) | NIZKY (micro-optimalizace) | NIZKA (manualni review) | ZADNE |
| ~~E~~ | ~~12~~ | ~~N+1 goals stats~~ | ~~ODSTRANENO~~ | ~~uz optimalizovano (Promise.all)~~ | — |

---

## FAZE 15: Oprava Frozen Streak Reset - 2 kriticke chyby

### Problem

Uzivatel mel zamrznutou radu (frozen streak), stiskl cervene tlacitko Reset → aplikace se KOMPLETNE ZASEKLA. Po znovuotevreni aplikace byla rada STALE ZMRAZENA.

Dukladnou analyzou zdrojoveho kodu byly nalezeny 2 kriticke chyby.

---

### CHYBA #1: Aplikace zamrzne (Race Condition - paralelni SQLite zapisy)

**Soubor**: `src/components/gratitude/StreakWarmUpModal.tsx` radek 358-363

**Root cause**: `handleResetStreak()` vola `onResetStreak()` BEZ `await`. Modal se okamzite zavre a domovska obrazovka dostane fokus → `useFocusEffect` spusti DRUHY `refreshStats()`. Oba volaji `calculateAndUpdateStreak()` paralelne na SQLite databazi bez zamkoveho mechanismu (SQLite verze nema `_isCalculatingStreak` lock jako AsyncStorage verze).

```
1. Uzivatel potvrdí Reset
2. onResetStreak() spusti SQLite operace NA POZADI (neni await)
3. onClose() zavre modal OKAMZITE
4. useFocusEffect() spusti DRUHY loadStreakData() → refreshStats()
5. PARALELNE bezi:
   - VLAKNO A: resetStreak() → updateStreak() → calculateAndUpdateStreak() [SQLite zapis]
   - VLAKNO B: loadStreakData() → refreshStats() → calculateAndUpdateStreak() [SQLite zapis]
6. Oba zapisy narazaji do SQLite ve stejny cas → databaze blokuje → APP FREEZE
```

**Fix**: Pridat `await` do `handleResetStreak()` + pridat `isResetting` loading state ktery blokuje dalsi interakci behem resetu.

---

### CHYBA #2: Rada zustane zmrazena po restartu (Docasna ochrana misto permanentniho resetu)

**Soubor**: `src/services/storage/SQLiteGratitudeStorage.ts` radek 1543-1586

**Root cause**: `resetStreak()` nastavi `autoResetTimestamp = new Date()`. `calculateFrozenDays()` respektuje tento timestamp POUZE 5 minut. Po 5 minutach (nebo po restartu) se dluh prepocita znovu ze skutecnych zmeskanych dni - ty jsou STALE v databazi!

```
[Okamzik resetu]
  autoResetTimestamp = NOW
  calculateFrozenDays() → timestamp < 5 min → vraci 0 ✅ (zmrazeni pryc)

[Po 5 minutach nebo po restartu]
  clearAutoResetTimestamp() vymaze timestamp
  calculateFrozenDays() → pocita znovu od zakladu
  calculateRawMissedDays() → stale nachazi ty same zmeskane dny!
  warm_up_payments jsou prazdne (smazane resetem)
  Vysledek: frozenDays = 2 (nebo kolik jich bylo) ❌ FREEZE ZPET!
```

`resetStreak()` vymaze `warm_up_payments` ale NEVYMAZE pricinu dluhu. Zmeskane dny v `journal_entries` zustavaji a `calculateRawMissedDays()` je znovu najde.

**Fix**: Pri `resetStreak()` vlozit `warm_up_payments` pro VSECHNY aktualne zmeskane dny (oznacit je jako zaplacene). Tim `calculateFrozenDays()` natrvalo vrati 0 – bez zavislosti na casovem okne `autoResetTimestamp`.

---

### Co NESMI prestit fungovat

- Normalni streak vypocet (neni dotcen)
- WarmUp flow pres reklamy (neni dotcen)
- `justUnfrozeToday` logika (neni dotcena)
- SQLite warm_up_payments tabulka struktura (jen pridavame zaznamy, nemeníme schema)
- Lokalizace EN/DE/ES (UI se nemeni)

---

### Implementace

#### 15.1: Fix Race Condition v StreakWarmUpModal.tsx

**Soubor**: `src/components/gratitude/StreakWarmUpModal.tsx`

Zmena: `handleResetStreak()` - pridat `async/await` + `isResetting` state pro zablokovani UI behem operace.

```typescript
// PRED (broken):
const handleResetStreak = () => {
  if (onResetStreak) {
    onResetStreak(); // BEZ await → race condition
    onClose();
  }
};

// PO (fixed):
const handleResetStreak = async () => {
  if (onResetStreak && !isResetting) {
    setIsResetting(true);
    try {
      await onResetStreak(); // S await → zadna race condition
    } finally {
      setIsResetting(false);
      onClose();
    }
  }
};
```

Zaroven pridat `isResetting` do `disabled` prop restovaciho tlacitka:
```typescript
disabled={isResetting}
```

**Dotcene radky**: ~358-363 (handleResetStreak) + ~637-646 (reset button disabled prop)
**Rozsah zmeny**: ~10 radku

---

#### 15.2: Fix permanentniho dluhu v SQLiteGratitudeStorage.ts

**Soubor**: `src/services/storage/SQLiteGratitudeStorage.ts`

Zmena: `resetStreak()` - pred vymazanim `warm_up_payments` zjistit vsechny aktualne zmeskane dny a vlozit je jako ZAPLACENE platby. Tim `calculateFrozenDays()` natrvalo vrati 0.

```typescript
// Pridat DO resetStreak() pred "DELETE FROM warm_up_payments":

// 1. Zjistit zmeskane dny ktere zpusobily zmrazeni
const rawMissedDays = await this.calculateRawMissedDays();
const missedDates = this.getMissedDatesFromToday(rawMissedDays);

// 2. Vlozit je jako zaplacene (aby calculateFrozenDays() natrvalo vratilo 0)
const db = this.getDb();
for (const missedDate of missedDates) {
  const paymentId = `reset_payment_${missedDate}_${Date.now()}`;
  await db.runAsync(
    'INSERT OR REPLACE INTO warm_up_payments (id, missed_date, ads_watched, paid_at) VALUES (?, ?, 1, ?)',
    [paymentId, missedDate, Date.now()]
  );
}

// 3. Pak pokracovat jako drive (DELETE uz neni potreba - warm_up_payments zustavaji jako "zaplaceno")
// POZOR: Odstranit radek "await db.runAsync('DELETE FROM warm_up_payments')"
// misto toho resetStreak uz warm_up_payments ponecha jako permanentni "zaplaceno" zaznam
```

**Alternativa (jednodussi)**: Misto ukladani paid payments ponechat `autoResetTimestamp` navzdy (nemazeт ho po 5 minutach). Ale toto je riskantni - pokud uzivatel priste znovu zacne a neco zmeskne, timestamp ho muze blokovat natrvalo. Proto preferujeme variantu s warm_up_payments.

**Dotcene radky**: ~1577-1579 (DELETE warm_up_payments + nova logika pred tim)
**Rozsah zmeny**: ~15 radku

---

### Souhrn zmen

| # | Krok | Soubor | Radky | Rozsah |
|---|------|--------|-------|--------|
| 15.1 | Fix async/await race condition | StreakWarmUpModal.tsx | ~358-363, ~637-646 | ~10 radku |
| 15.2 | Fix permanentni dluh po resetu | SQLiteGratitudeStorage.ts | ~1577-1585 | ~15 radku |

**Celkovy dopad**: 2 soubory, ~25 radku zmeny, zadna zmena schematu DB, zadna zmena UI/lokalizace.

### Todo

- [x] 15.1: Pridat `async/await` + `isResetting` state do `handleResetStreak()` v StreakWarmUpModal.tsx
- [x] 15.2: Pridat vkladani `warm_up_payments` pro zmeskane dny v `resetStreak()` v SQLiteGratitudeStorage.ts
- [ ] 15.3: Overit ze po resetu je rada okamzite odmrazena a zustane odmrazena po restartu aplikace
- [ ] 15.4: Overit ze normalni WarmUp flow pres reklamy stale funguje spravne
