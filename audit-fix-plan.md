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
