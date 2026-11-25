# Převod nového designu z laboratoře do ostré appky – úplný plán

*Sepsáno 2026-11-15 nad commitem `6583d02`, **prověřeno a doplněno 2026-11-21 po kolech 41–52** (nezávislá revize plánu: karty etap teď obsahují vše z L-2…L-10 a O-10…O-16). Autor: Claude Fable 5.2 a Opus 5.5.*
*Určeno pro: model, který bude převod provádět (může být slabší než autor), a pro Petra jako kontrolní seznam.*

> **Tento dokument je POSTUP. Není to zdroj pravdy o vzhledu ani o logice.**
> - Jak to má **vypadat a hýbat se** → soubor laboratoře v `src/screens/design-lab/` (kód je závazný vzor).
> - **Proč** to tak je a co se smí → `premium-design-plan.md` (kap. 7 rozhodnutí `R-#`, kap. 10 poučení `P#`).
> - **Kam** který soubor patří → `src/screens/design-lab/PREVOD.md`.
> - Jak **funguje logika appky** → `technical-guides:*.md` (nadřazené všemu, CLAUDE.md pravidlo 3).
> - **Tento soubor** říká: v jakém pořadí, po jakých krocích, co ověřit a kdy se zastavit.

---

## 0. NEJDŘÍV SI PŘEČTI TOHLE (pravidla pro toho, kdo převádí)

### 0.1 Deset pravidel, která se neporušují

1. **Jedna etapa = jedno posezení = jeden commit.** Nezačínej další etapu, dokud Petr neschválil tu předchozí
   na telefonu. Commit a push jen na výslovné „commitni“ (CLAUDE.md pravidlo 12).
2. **Převádí se vzhled, pohyb a schválené nové chování. Logika appky se nepřepisuje.** XP, série, limity,
   párování nahrazených dnů, dluh deníku, výzvy, trofeje – to všechno už v appce je a je otestované.
   Laboratoř má kulisy (`*Mock.ts*`, `mockCopy.ts`, `MOCK_STATS`). **Kulisy se nikdy nepřevádějí.**
3. **Když se laboratoř a ostrá appka liší v čísle nebo pravidle, platí ostrá appka** – a ty se zastavíš
   a nahlásíš to Petrovi (viz 0.3). Výjimka: nové chování, které má v kap. 4 tohoto plánu schválené `R-#`
   nebo rozhodnuté `O-#` (✅). **Platí obecně: co je postavené v laboratoři, je rozhodnuté** (Petr 2026-11-22) –
   rozdíl laboratoř × ostrá appka u vzhledu a nového chování se nehlásí, převádí se. Hlásí se jen rozdíl
   v číslech a pravidlech logiky (XP, série, limity) – tam platí ostrá appka.
4. **Co obrazovka slibuje, musí kód plnit (P49, P64).** Než nakreslíš jakékoli číslo, odměnu nebo slib,
   dohledej funkci, která to opravdu dělá. V laboratoři se takhle našlo šest chyb ostré appky.
5. **Před každou etapou přečti:** (a) kartu etapy v kap. 6, (b) hlavičku `GOING LIVE (1:1)` každého
   zdrojového souboru laboratoře, (c) řádek souboru v `PREVOD.md`, (d) průvodce dotčené oblasti,
   (e) ostré soubory, které budeš měnit – celé, ne úryvky.
6. **Chirurgicky.** Měň soubory vyjmenované v kartě etapy a to, co z nich přímo plyne (typ události,
   posluchač, test, překlad). Potřebuješ-li sáhnout na další obrazovku, službu nebo úložiště, zastav se.
7. **Žádné dočasné záplaty, žádné „TODO později“.** Co etapa slibuje, to je po ní hotové.
8. **Ověř, než řekneš hotovo:** `npx tsc --noEmit` a
   `PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npm test`. U každého nového testu udělej **negativní
   zkoušku** (schválně rozbij hlídané pravidlo, test musí spadnout, pak vrať).
9. **Průvodce se mění ve stejném commitu** jako chování, které popisuje (CLAUDE.md pravidlo 10).
10. **Odpovídej česky a každou odpověď zakonči sekcí „DOPAD NA UŽIVATELE“** (CLAUDE.md pravidlo 14).

### 0.2 Postup jedné etapy (stejný pro všechny)

| Krok | Co udělat | Hotovo když |
|---|---|---|
| 1 | Přečíst podklady podle 0.1 bod 5 | umíš vyjmenovat, co etapa mění a co nesmí rozbít |
| 2 | **Soupis textů:** vypsat nové texty z `mockCopy.ts` pro tuhle obrazovku do tabulky EN / DE / ES a dát Petrovi ke schválení (kap. 7.1) | Petr texty schválil |
| 3 | **Mapa dat:** ke každé hodnotě, kterou laboratoř bere z kulis, napsat, odkud ji vezme ostrá appka (kontext / služba / funkce). Co nemá zdroj → zastavit | tabulka bez prázdných řádků |
| 4 | Postavit vzhled z primitiv (`src/components/ui/`) a tokenů (`src/design/`), ne kopírováním stylů | obrazovka se vykreslí se skutečnými daty |
| 5 | Zapojit chování: stávající funkce kontextů a služeb; nové chování jen podle `R-#` | všechny akce obrazovky fungují |
| 6 | Testy: pravidla převzatá z laboratoře (`*Logic.ts`) přenést i s testy; nová místa otestovat + negativní zkouška | `tsc` + celá sada projdou |
| 7 | Ruční kontrola podle kap. 7.5 (tmavý režim, DE, velké písmo, snížený pohyb, tablet) | bez nálezu, nebo nálezy opravené |
| 8 | Nezávislá revize hotové práce (čtecí agent, CLAUDE.md pravidlo 13) a oprava nálezů | nálezy vyřešené nebo vědomě odložené |
| 9 | Aktualizovat průvodce, `PREVOD.md`, `premium-design-plan.md` (odškrtnout), tento plán (stav etapy) | dokumenty sedí s kódem |
| 10 | Zpráva Petrovi: co se změnilo, co ověřit na telefonu, co zůstalo otevřené | Petr ví, co má zkusit |

### 0.3 Kdy se ZASTAVIT a zeptat Petra

- Chybí rozhodnutí: etapa závisí na `R-#`, které v kap. 4 nemá ✅.
- Laboratoř ukazuje číslo, text nebo odměnu, kterou ostrý kód nedělá (pravidlo 4).
- Je potřeba **změna dat** (nový sloupec, tabulka, migrace) nebo **nativní build**.
- Je potřeba sáhnout na soubor mimo kartu etapy nebo na fungující logiku.
- Test z kap. 3.4 („co se nesmí rozbít“) po tvé změně spadl a příčinu neumíš najít do 30 minut.
- Něco v laboratoři chybí (kap. 5) – **nevymýšlej vzhled sám**, nejdřív se staví v laboratoři.
- Texty (EN/DE/ES) ještě Petr neschválil.
- Hlavička souboru laboratoře říká „okno z `ModalQueueContext`“ a ty nevíš, co s tím: znamená to **frontu**
  (pořadí a jedno okno najednou), ne RN `<Modal>`. Okna se kreslí podle kap. 6.0.

### 0.4 Slovníček

| Pojem | Význam |
|---|---|
| Laboratoř | `src/screens/design-lab/` – vývojové hřiště s kulisami, otevírá se z Nastavení jen ve vývoji. Nikdy v obchodní verzi (`src/config/__tests__/designLab.test.ts`) |
| `R-#` | rozhodnutí v `premium-design-plan.md` kap. 7 |
| `P#` | poučení v `premium-design-plan.md` kap. 10 (pravidla pro převod) |
| Kolo | jedno posezení práce v laboratoři; záznamy v `premium-design-plan.md` kap. 8 |
| Odznak | kroužek s úrovní připnutý vlevo nahoře na každé obrazovce (`xpFlight.tsx`) |
| Tiché oznámení | pilulka, která vyjede z odznaku (trofej, milník); není to okno |
| Moment | jedna oslava: tiché oznámení nebo okno. Vždy jen jeden najednou |
| Chrome | spodní lišta záložek + reklamní pruh + horní řádek s odznakem |
| Nativní ovladač | `Animated` z React Native s `useNativeDriver: true` (ne Reanimated) |

---

## 1. CÍL A HRANICE

**Cíl:** všechno, co je v laboratoři schválené, je v ostré appce – stejný vzhled, stejný pohyb, stejné nové
chování – nad skutečnými daty, ve třech jazycích, ve světlém i tmavém režimu, na telefonu i tabletu,
bez zhoršení plynulosti a bez rozbité logiky.

**Dvě vydání** (Petr 2026-11; vydání B zrušeno O-13):
1. **Vydání A – nový vzhled celý najednou** (etapy E0 až E27). Smíšený vzhled se do obchodu nepouští (R-5).
2. ~~**Vydání B – části dne** (R-30, etapa E28)~~ – **zrušeno, Petr 2026-11-21 (O-13).**
3. **Vydání C – nový katalog trofejí** (R-28, etapa E29). Mění uložené trofeje.
Potom E30: přechod na aktuální Expo.

**Co se nepřevádí:** kulisy (`*Mock.ts*` / `*Mock.tsx` – mj. `homeChartsMock.ts`, `multiplierMock.tsx`, `challengeMock.tsx`, `journalMock.tsx`, `habitsMock.tsx`, `goalsMock.tsx` –, `mockCopy.ts`, `trophiesMock.ts`), `DesignLabScreen.tsx`,
`labPerf.tsx`, `labScenarios.tsx`, přepínače situací a tlačítka „Lab · …“ uvnitř obrazovek, panel nástrojů
laboratoře.

**Hotovo, když** (pro vydání A):
- každá obrazovka z kap. 6 má stav ✅ a Petrovo schválení na telefonu;
- `tsc` + celá sada testů projdou; testy z kap. 3.4 beze změny zelené;
- v převedených souborech není hex barva, `fontSize` ani `borderRadius` natvrdo (ráčna, E1);
- měření plynulosti podle kap. 7.4 nevyšlo hůř než před převodem;
- všechny nové texty jsou v EN/DE/ES a žádný syrový klíč se nevykreslí (P29);
- průvodci odpovídají kódu; `technical-guides:Design-System.md` existuje.

---

## 2. VÝCHOZÍ STAV (2026-11-15)

### 2.1 Technika

Expo 55.0.27 · React Native 0.83.6 (New Architecture) · React 19.2 · Reanimated 4.2.1 · worklets 0.7.4 ·
Skia 2.4.18 · gesture-handler ~2.30 · expo-router (záložky `Tabs`) · verze appky 7.0.2 (`app.json`) ·
82 testových sad, 1254 testů (2026-11-21). Testy potřebují Node ≥ 22.5 (viz 0.1 bod 8).

### 2.2 Ostrá appka – kde co je

| Oblast | Soubory |
|---|---|
| Trasy | `app/_layout.tsx` (kořen: databáze → `RootProvider` → `Stack` → `OnboardingFlow` jako poslední sourozenec), `app/(tabs)/_layout.tsx`, `app/(tabs)/{index,habits,journal,goals,settings}.tsx`, `app/{achievements,journal-history,journal-stats,habit-stats,goal-stats,levels-overview,how-it-works,+not-found}.tsx` |
| Kontexty (pořadí v `src/contexts/RootProvider.tsx`) | Theme → App → ModalQueue → XpAnimation → Habits → Gratitude → Goals → Achievement → HomeCustomization → `XpAnimationContainer` |
| Obrazovky | `src/screens/habits/*`, `src/screens/goals/*`, `src/screens/levels/LevelsOverviewScreen.tsx`, `src/screens/help/HowItWorksScreen.tsx` |
| Komponenty | `src/components/{home,habits,goals,gratitude,gamification,achievements,challenges,onboarding,tutorial,settings,ads,common}/` |
| Fronta oken | `src/contexts/ModalQueueContext.tsx` – 11 typů oken, priority 1–7, okna jsou RN `<Modal>` a kreslí je sám poskytovatel (`ModalRenderer` uvnitř `ModalQueueProvider`) |
| Smluvené parametry tras | `?quickAction=addHabit\|addGratitude\|addSelfPraise\|addGoal` (posílá `QuickActionButtons`, čtou `HabitsScreen`, `journal.tsx`, `GoalsScreen`), ~~`/habit-stats?habitId=`~~ (ruší se, O-11 – v E6 přesměrovat na detail návyku), `/goal-stats?goalId=`, `?openDebtModal=true` (z `GratitudeInput` na Home); ťuknutí na připomínku vede na `/(tabs)/habits\|journal\|goals` (`useNotificationLifecycle.ts`) |
| Stavový řádek | `<StatusBar style="light">` natvrdo v `app/_layout.tsx`, `app/(tabs)/_layout.tsx` a ve čtyřech obrazovkách karet |
| XP na obrazovce | `src/contexts/XpAnimationContext.tsx`, `src/components/gamification/{XpNotification,XpPopupAnimation,XpAnimationContainer}.tsx` |
| Vzhled dnes | `src/contexts/ThemeContext.tsx`, `src/constants/colors.ts` |
| Reklamní pruh | `src/components/ads/AdBanner.tsx` – vložený zvlášť v 10 obrazovkách |

### 2.3 Laboratoř – co je postavené (zdroj pro převod)

| Soubor laboratoře | Co obsahuje |
|---|---|
| `labTokens.ts` | palety (světlá/tmavá), typografie, mezery, zaoblení, pohyb, barvy vzácnosti a stupňů úrovní |
| `labPrimitives.tsx`, `RollingNumber.tsx`, `StreakFlame.tsx` | text, povrch, tlačítko se zmáčknutím, pruh, oblouk dne, zaškrtávátko, čip, dělič, rolující číslo, plamen |
| `scrollChoreography.tsx`, `introTimeline.tsx` | pohyb karet při rolování, časová osa nájezdu a spuštění |
| `xpFlight.tsx`, `levelPanel.tsx`, `levelPanelLogic.ts` | odznak úrovně, jiskry XP, štítek „LEVEL UP“, panel úrovně |
| `celebrationDirector.tsx`, `AchievementCelebrationConcept.tsx`, `challengeMoments.tsx`, `otherMoments.tsx`, `momentRules.ts` | jedna fronta momentů, tichá oznámení, velké okno trofeje, okna výzvy, nová kapitola, série deníku, násobič |
| `HomeConcept.tsx` | Home: hrdina dne, rychlé akce, dnešní návyky, série deníku, výzva, týden |
| `HabitsConcept.tsx`, `HabitDetailConcept.tsx`, `HabitComposerConcept.tsx`, `HabitsReorderConcept.tsx` | Návyky, detail návyku, tvorba/úprava, řazení |
| `JournalConcept.tsx`, `journalParts.tsx`, `JournalDetailConcept.tsx`, `JournalHistoryConcept.tsx`, `JournalStatsConcept.tsx` | Deník, sheet psaní, historie jako kalendář, statistiky |
| `GoalsConcept.tsx`, `goalParts.tsx`, `GoalDetailConcept.tsx`, `GoalComposerConcept.tsx` | Cíle, karta s tempem, rychlý zápis + Zpět, detail, tvorba/úprava |
| `ChallengeDetailConcept.tsx`, `challengeLogic.ts` | detail měsíční výzvy, pravidla tempa, odměny, hvězd |
| `TrophyRoomConcept.tsx`, `LevelsOverviewConcept.tsx`, `levelsJourney.ts` | Síň trofejí, přehled úrovní jako cesta |
| `SettingsConcept.tsx` | Nastavení |
| `OnboardingConcept.tsx` | celý úvod |
| `dragToClose.tsx`, `dragToCloseLogic.ts`, `labCover.ts` | tažné zavírání, „něco je otevřeno“, „záložka je vidět“ |
| `HabitStatsConcept.tsx`, `homeChartsLogic.ts` | Home: statistiky návyků (týden / 30 dní / rok) – kolo 41 |
| `HomeSectionsConcept.tsx`, `homeLayoutLogic.ts` | Home: Přehledy, Pro tebe, sheet přizpůsobení, převod uloženého rozložení – kolo 42 |
| `multiplierLogic.ts` | násobič na odznaku a v panelu úrovně (L-10) – kolo 44 |
| `ChallengeCardStates.tsx` (+ `challengeCardState` v `challengeLogic.ts`) | karta výzvy před výzvou: načítání, příprava, chyba – kolo 45 |
| `HowItWorksConcept.tsx` | nová stránka „Jak SelfRise funguje“ – kolo 47 |
| `labHelp.tsx` | nápověda na místě (6 témat, spodní okno) – kolo 48 |
| `systemScreens.tsx` | pruh neúspěšné akce (`ProblemNote`), „nenalezeno“, chyba databáze – kolo 49 |
| `labFeel.ts`, `feelPlayer.ts` | slovník dotyku a zvuku, přepínač zvuků – kolo 50 |
| `SignatureIcon.tsx` (+ `assets/fonts/SelfRiseIcons.ttf`, `scripts/build-icon-font.py`) | vlastní ikony ⭐🔥👑🏆 a ikony spodní lišty – kolo 51 |

Pravidla s testy, která se přenášejí i s testy: `levelPanelLogic`, `levelsJourney`, `challengeLogic`,
`momentRules`, `dragToCloseLogic`, `homeChartsLogic`, `homeLayoutLogic`, `multiplierLogic`, `labFeel`
(všechny v `src/screens/design-lab/__tests__/`).

### 2.4 Co už je v ostré appce hotové (vzniklo během laboratoře – neopakovat)

| Co | Kde | Test |
|---|---|---|
| Strop hodnoty cíle zvednut (R-20) | `MAX_GOAL_VALUE` | stávající testy cílů |
| Sbírky trofejí opravené a bonus se vyplácí (R-21) | `trophyCollections.ts`, `trophyCollectionService.ts` | stávající |
| Vymyšlené odměny za milníky úrovní odstraněny | `levelCalculation.ts`, `CelebrationModal.tsx`, locales | `levelMilestonePromises.test.ts` |
| Bonus za sérii měsíčních výzev se vyplácí | `src/services/monthlyStreak.ts`, `monthlyProgressTracker.ts` | `monthlyStreak.test.ts` |
| Milníky výzvy platí přesně 50/100/150 XP | `monthlyProgressTracker.ts` | `monthlyStreak.test.ts` |
| XP za sérii deníku 7/21/30/100/365 dní (R-41) | `SQLiteGratitudeStorage.awardStreakReward`, tabulka `journal_streak_rewards` | `sqliteGratitudeStorage.streakRewards.test.ts` |
| „Dnešní XP“ (O-9) | `GamificationService.getTodayXP()` | `__tests__/services/gamification/TodayXP.test.ts` |
| Zapnutí násobiče (harmonie, kombo, výzva) nedává bonusové XP; bonus za návrat se připisuje před zapnutím (O-10, O-16) | `xpMultiplierService.ts`; okno `MultiplierActivationModal` neukazuje „+0“ | `xpMultiplier.loyalty.test.ts` |

Tyto opravy **nejsou vydané** – vyjdou spolu s vydáním A (O-2: jeden velký update).

---

## 3. ZÁSADY PŘEVODU (výtah z 79 poučení – platí pro každou etapu)

Plné znění a důvody jsou v `premium-design-plan.md` kap. 10. Tady je to, co musíš mít v hlavě pořád.

### 3.1 Plynulost

| Pravidlo | P# |
|---|---|
| Pohyb řízený rolováním jen přes `Animated.event` + `useNativeDriver`. Nikdy Reanimated | P1 |
| Karty se při rolování posouvají a zmenšují, **nemění průhlednost** | P2 |
| „Karta je vidět“ si drží karta sama, ne obrazovka | P3 |
| Nekonečné smyčky (Skia, Lottie) stojí, když se roluje, když jsou mimo obrazovku a když je záložka skrytá | P4, P68 |
| Plnění a počítání začíná, až je karta vidět | P5 |
| **Nikdy nečíst `sharedValue.value` z JavaScriptu.** Jen zapisovat; číst jen ve workletu | P45 |
| Běžné reakce UI (zmáčknutí, odvalení čísla, pruh, toast) → podle výsledku brány B1 (kap. 6, E0) | P46 |
| Kdo jen utrácí XP, nečte kontext se stavem XP (jinak se překreslí každá karta) | P47 |
| Seznam karet: řádky `React.memo`, stabilní funkce, **žádné čtení sdíleného kontextu v kartě**, žádná animace rozvržení na řádek | P42 |
| Zeď mnoha položek = `FlatList` bez animace na položku | P50 |
| Efekt „odplutí“ jen na jednu kartu, ne na dlouhý seznam | P39 |
| Čísla se při otevření obrazovky neodvalují, jen při změně | P44 |
| Vjezd/odjezd a animovaný `transform` nikdy na stejném prvku | P40 |
| Funkce gest musí mít `'worklet'` samy (doplněk ho přidá jen řetězci začínajícímu `Gesture.Pan()`) | kolo 40 |
| **Při posunu nic nemění výšku a nic neběží ve smyčce:** běžná změna stavu (odškrtnutí, nová věta) drží výšku karty (karty s animací posunu se jinak všechny přestaví); plamen (Lottie) a slunce se při posunu pozastaví – plamen přes `useScrollRest` a ref `LottieView` (pauza/pokračování, žádné přestavění) | P79, kolo 52 |
| Dotyk a zvuk jen přes slovník okamžiků `feel('<okamžik>')`, nikdy ruční `impact()` / `notification()`; zvuk jen u vzácných oken | P77 |

### 3.2 Vrstvy, dotyk, navigace

| Pravidlo | P# |
|---|---|
| Připnutý prvek má obal jen kolem sebe a je průchozí (`pointerEvents="box-none"`) | P9 |
| Obsah detailů a sheetů začíná pod řádkem s odznakem; křížek je v tom řádku vpravo | P10 |
| Sheety a překryvy počítají s reklamním pruhem a spodní lištou | P11 |
| Detail roste z karty a vrací se do ní; původní karta je mezitím skrytá | P24 |
| Android „zpět“ zavírá detail, sheet i okno – ale jen v záložce, která je vidět | P25, kolo 40 |
| Odznak je na každé obrazovce na stejném místě | P26 |
| Nájezd obrazovky jen při prvním zobrazení záložky | P26b |
| Z odznaku vyjíždí vždy jen jedna věc; okno se neotevírá nad oknem | P59 |
| Tažení posouvá tu samou hodnotu, která věc otevírá; u začátku obsahu patří tah oknu, jinde seznamu; okno s textovým polem se tažením nezavírá | P57, P69 |
| Sheet s textovým polem se zvedá o **změřený** překryv klávesnice, hlavní tlačítko jede nad klávesnicí | P30, P43 |

### 3.3 Obsah a poctivost

| Pravidlo | P# |
|---|---|
| Haptika jen jako odpověď na dotyk nebo skutečnou událost; nikdy při rolování; ťuknutí, které nic neudělá, nezavibruje | P7, P8, P59 |
| XP se připisuje až po potvrzení a letí z místa, kde vzniklo; odebrané XP nic neposílá | P12–P17 |
| Stav dne návyku nese **tvar**, barva je jen identita návyku | P18–P23 |
| Co k sobě patří, je jeden moment; okno si zaslouží jen to, co se stane párkrát za život účtu | P56, P65, P67 |
| Špatná zpráva končí tím, co je dál | P66 |
| Stejný údaj jen jednou na obrazovce | P60 |
| Žádné umělé stropy u čísel uživatele; nula může být platná | P41 |
| Text na barevném přechodu se počítá proti světlejšímu konci; kontrast nových barev spočítat | P32, P51, P62 |
| Ověřovat **vykreslený** text, ne existenci klíče | P29 |
| Místo obecných rad jedna věta o tom, co zbývá | P63 |
| Neptej se na nic, co appka potom nepoužije | P55 |
| Uložená data uživatele (pořadí, skryté sekce) se při slučování převádějí pravidlem s testem, nikdy reset na výchozí | P71 |
| Co tiché oznámení nabízí, zůstává dosažitelné tam, odkud vyjelo; „ukázat jednou“ = jednou na připravení (uložený klíč), ne na změnu za běhu | P73 |
| Prázdný stav: známá data vždy vyhrají (obnovení nikdy neschová kartu); kostra až po chvilce; chyba jednou větou s jedním „Zkusit znovu“, bez surového textu | P74 |
| Dvě věci z jedné akce = jedna věc na obrazovce (vede vzácnější, druhá jede uvnitř), i když přijdou různými událostmi | P75 |
| Nápověda jen u skrytého pravidla, jeden text pro bublinu i stránku pravidel | P76 |
| Ikony jsou písmo (`SignatureIcon`), mění se jen skriptem; emoji ⭐🔥👑🏆 se nekreslí | P78 |

### 3.4 Co teď funguje a nesmí se pokazit

| Systém | Průvodce | Hlídá |
|---|---|---|
| XP, denní limity, vratky | `Gamification-Core.md` | `src/services/gamification/__tests__/*`, `__tests__/services/gamification/*` (kořen repozitáře) |
| Fronta oken – jedno okno najednou, priority | `Gamification-UI.md` | `src/contexts/__tests__/modalQueueOrdering.test.ts` – **pozor: testuje kopii řadicí funkce, ne kontext.** V E8 funkci z kontextu vyvézt a test na ni napojit, jinak nic nehlídá |
| Smluvené parametry tras (rychlé akce z Home, připomínky, statistiky) | – | ručně (kap. 7.5); v každé dotčené etapě zachovat |
| Nápověda (dnes 11 klíčů `helpKey`; po E22 6 témat podle 7.10) | `Help-Tooltips.md` | `helpTooltipKeys.test.ts` |
| Série a dluh deníku, číslování záznamů, vratka XP při smazání | `My-Journal.md` | `sqliteGratitudeStorage.{streakDebt,numbering,deletionXP,streakRewards}.test.ts` |
| Návyky: Smart Bonus Conversion, párování nahrazených dnů, pauzy, řazení | `Habits.md` | testy návyků, `ReorderableList` |
| Cíle: XP za zápis, milníky, dokončení a jeho vrácení | `Goals.md` | `sqliteGoalStorage.progressXP.test.ts` |
| Měsíční výzvy: generování, sledování, konec měsíce, hvězdy, série. **Průběh se počítá z události `xpGained`** (`monthlyProgressIntegration.ts`) – její obsah se nesmí zmenšit | `Monthly-Challenges.md` | `monthlyChallenge*.test.ts`, `monthlyStreak.test.ts`, `monthlyProgressTracker.trackingKeys.test.ts` |
| Trofeje a sbírky | `Achievements.md` | testy trofejí |
| Úvod: žádný RN `<Modal>`, pět pravidel, události trychtýře | `Tutorial.md`, `Analytics.md` | `src/contexts/__tests__/onboardingFlow.test.ts`, `src/components/onboarding/__tests__/*` |
| Start appky: nikdy dvě okna najednou (ATT → souhlas → úvod) | `Startup-Orchestrator.md` | `src/services/startup/__tests__/*` |
| Reklamy: pruh se nepřestylovává a nesedí těsně u ovládacích prvků | `AdMob.md` | `src/components/ads/__tests__/*` |
| Připomínky | `Notifications.md` | stávající |
| Velké obrazovky | `Large-Screens.md` | `contentColumn`, `getModalWidth` |
| Analytika – beze změny, pokud karta etapy neříká jinak | `Analytics.md` | stávající |
| Laboratoř není v obchodní verzi | – | `src/config/__tests__/designLab.test.ts` |

---

## 4. ROZHODNUTÍ – STAV A BRÁNY

### 4.1 Schváleno (✅) – lze převádět

R-1, R-2, R-16 až R-22, R-24 až R-29, R-31 až R-41. Znění v `premium-design-plan.md` kap. 7.
R-29, R-31 a R-39 stojí na R-10 (odznak a jiskry) – R-10 je tím fakticky schválené, v B0 se jen formálně potvrdí.

### 4.2 Postaveno v laboratoři – ✅ potvrzeno (Petr 2026-11-22: „co je navržené v laboratoři, je rozhodnuté; podle toho se předělá appka“)

| # | Co | Blokuje etapu |
|---|---|---|
| R-3 | pilot = Návyky + chrome | E3, E5 |
| R-4 | (a) nová hlavička a lišta, (b) hrdina dne nahoře na Home, (c) pauza/úprava/smazání do „⋯“ | E3 (a), E5 (c), E11 (b) |
| R-5 | redesign ve větvi `design-v2`, vydat celý najednou | E0 |
| R-6 | pozdrav podle denní doby (EN/DE/ES) | E11 |
| R-7 | Maestro pro snímky před/po (nástroj na Macu) | E0 (volitelné) |
| R-8 | nový průvodce `Design-System.md` nahradí kapitolu v `technical-guides.md` | E2 |
| R-9 | úvod při spuštění („opona“) za podmínek v plánu | E23 |
| R-10 | odznak + jiskry místo souhrnné lišty XP | E7 |
| R-11 | stav dne návyku tvarem i ve skutečném kalendáři | E5 |
| R-13 | deník: splnění dne na místě místo okna | E12 |
| R-14 | deník: zámek zmrzlé série dřív, než se píše; ohřátí v Deníku | E12 |
| R-15 | historie deníku jako kalendář + graf 30 dní | E13 |
| R-23 | nové Nastavení | E20 |
| R-30 | části dne – **zrušeno (O-13)** | ~~E28~~ |

### 4.3 Otevřené věci, které nejsou rozhodnutí o vzhledu

| Kód | Otázka | Kdy rozhodnout |
|---|---|---|
| O-1 | XP za sérii **návyku** (75/100/150/200/300 XP za 7/14/30/50/100 dní) | ✅ **Petr 2026-11-16: ne – „to jsem původně nezamýšlel, to bych tam nedával“.** Nic se nevyplácí a nikde se to nekreslí. Nepoužité konstanty `XP_REWARDS.HABIT.STREAK_*` a zdroj `HABIT_STREAK_MILESTONE` smazat v E26; průvodce `Gamification-Core.md` je opravený |
| O-2 | Vydat opravy z kap. 2.4 hned, nebo až s vydáním A? | ✅ **Petr 2026-11-16: jeden velký update** – opravy vyjdou spolu s novým vzhledem |
| O-3 | Okna oslav zavírat i tažením? | ✅ **Petr 2026-11-16: podle velikosti – velká okna jen tlačítkem.** Všechna okna oslav jsou „velká“ (připisují XP nebo nesou zprávu), takže tažením se nezavírají; malé oslavy jsou tichá oznámení, která odejdou sama nebo ťuknutím |
| O-4 | Kde je vidět běžící násobič XP a kde se zapíná | ✅ **Petr 2026-11-16: souhlas s návrhem.** Běžící násobič = malý štítek „2ד na odznaku úrovně (zbývající čas v panelu úrovně); průběh harmonie x/7 jako řádek v panelu úrovně; když je připravený, vyjede z odznaku tiché oznámení „2× XP připraveno“ a ťuknutí ho zapne. Sekce násobiče na Home (`xpMultiplier`) i časovač v hlavičce zanikají. **Nejdřív postavit v laboratoři (L-10)** |
| O-5 | Trvalý reklamní pruh: zůstává tak, jak je (obchodní věc) | bez termínu |
| O-6 | Zůstane laboratoř v kódu po vydání (ladění dalších obrazovek, T-Qyron)? | E26 |
| O-7 | Karta série deníku na Home: vyrůst do vlastního detailu, nebo přepnout na Deník? | ✅ **Petr 2026-11-16 nechal na autorovi a výsledek potvrdil:** ťuknutí vede na záložku Deník a karta do ní **vyroste jako přechod**. Samostatný detail z laboratoře (`JournalDetailConcept.tsx`) se jako stránka nepřevádí – byl by to druhý Deník (P35); převádí se jen jeho pohyb |
| O-8 | Bonus za „velký cíl“ (dnes cíl ≥ 10 000 → 350 XP místo 250) | ✅ **Petr 2026-11-16: souhlas – měřit úsilím, ne číslem.** Bonus dostane cíl, na kterém uživatel pracoval aspoň 30 dní a zapsal aspoň 10 pokroků. Provedení v E16 (viz tam) |
| O-9 | Funkce „dnešní XP“ | ✅ **Petr 2026-11-16: ano.** V appce hotovo: `GamificationService.getTodayXP()` (jen čtení, test `__tests__/services/gamification/TodayXP.test.ts`). Čip na Home (E11) a řádek v panelu úrovně (E9) čtou tuhle jednu funkci |
| O-10 | Bonus za zapnutí násobiče (dnes se omylem zdvojí 240 → 480 XP, okno o něm mlčí) | ✅ **Petr 2026-11-21: zrušit** (varianta c). Zapnutí násobiče žádné XP nedává; odměnou je samotný násobič |
| O-11 | Trasa `habit-stats` (přehled statistik všech návyků) | ✅ **Petr 2026-11-21: zrušit** (varianta a). Stačí statistiky na Home (kolo 41) a detail návyku; trasa, `IndividualHabitStatsScreen` a `DailyHabitTrackingScreen` v E26 smazat, odkazy na ně přesměrovat na detail návyku |
| O-12 | Zvuk a hmat (L-6, R-35) | ✅ **Petr 2026-11-21: vibrace + pár jemných zvuků u velkých okamžiků** (varianta b), zvuky vypínatelné v Nastavení. Musí být v nativním buildu E0 |
| O-13 | Části dne u návyků (L-1, R-30) | ✅ **Petr 2026-11-21: ne.** L-1 a E28 se ruší |
| O-14 | Systémová okna `Alert.alert` (14 míst) | ✅ **Petr 2026-11-21: souhlas – všechna na nová okna** (`ConfirmSheet` / pruh `ProblemNote`); mapa míst v L-4 |
| O-15 | Vlastní ikony místo emoji ⭐🔥👑 (L-5, R-34) | ✅ **Petr 2026-11-21: ano, vlastní sada** (varianta a) |
| O-16 | Ostatní bonusy při zapnutí násobiče (návrat po neaktivitě `COMEBACK_BONUS`, kombo trofejí a splněná výzva `durationHours × 10`) – připisují se až po uložení násobiče, takže se zdvojí; žádné okno o nich neříká | ✅ **Petr 2026-11-21: souhlas – hotovo v appce.** Kombo a výzva bez bonusu; bonus za návrat se připisuje před zapnutím násobiče (nezdvojí se, jeho selhání boost nezruší). Testy v `xpMultiplier.loyalty.test.ts` (+ negativní zkouška), průvodce `Gamification-Core.md` |

### 4.5 Otevřená rozhodnutí, která blokují etapy (stav 2026-11-22)

Etapa, která na něčem z tabulky stojí, **nezačne**, dokud tu není ✅ (0.3). Výchozí návrh je jen návrh –
platí až po Petrově potvrzení.

| # | Otázka | Blokuje | Výchozí návrh |
|---|---|---|---|
| D-1 | Potvrzení tabulky 4.2 (R-3 … R-23) | E0 a dál (B0) | ✅ potvrzeno 2026-11-22 (laboratoř = rozhodnutí) |
| D-2 | P46 – ovladač běžných animací | E2 | ✅ 2026-11-22: **P46 zrušeno** – s přepínačem UI vlákno 0 snímků nad 25 ms (sonda), Petr „jednoznačně plynulejší“; primitiva zůstávají na Reanimated |
| D-3 | Čip série v hrdinovi Home | E11 | ✅ Petr 2026-11-22: zrušen (stejné číslo je v kartě série, P60); z laboratoře odstraněn |
| D-4 | Návratová cesta `addProgress` pro „+35 XP / milníky / dnes už bez XP“ | E14 | ✅ technicky rozhodnuto: (b) odvodit z `xpGained` podle `sourceId` – úložiště se nemění |
| D-5 | Plán migrace dat pro „Messen“ | E16 | napsat a nechat schválit na začátku E16 |
| D-6 | Jak vyvolat přelom měsíce pro zkoušku momentů výzvy | E18 | ✅ ladicí řádek v Nastavení jen ve vývoji |
| D-7 | Konečná sada zvuků | E2, E27 | ✅ Petr 2026-11-22: zatím syntetizované návrhy z `assets/sounds/`, upravit se dají později |
| D-8 | O-6: laboratoř po vydání ponechat / smazat | E26 | ✅ ponechat do E30 (uživatel ji nevidí) |
| D-9 | Klíč „násobič oznámen pro toto připravení“ (AsyncStorage) | E9 | ✅ plyne z laboratoře (oznámení jednou na připravení); nový klíč bez migrace |
| D-10 | Parametr trasy `/how-it-works?section=<oddíl>` | E22 | ✅ plyne z laboratoře („Všechna pravidla“ otevře oddíl) |
| D-11 | `WarmUpErrorModal` → pruh `ProblemNote` | E11/E12 | ✅ plyne z laboratoře (kolo 49) |
| D-12 | Nový průvodce `technical-guides:Home.md` | E11 | ✅ plyne z CLAUDE.md pravidla 10 |

### 4.6 Co Petr opravdu musí udělat nebo rozhodnout (2026-11-22)

Vše, co je postavené v laboratoři, je rozhodnuté (4.2). Zbývá jen tohle:

**Jednou, před začátkem**
1. ~~Zvuky (D-7)~~ – ✅ 2026-11-22: zatím návrhy, upraví se později.
2. **Nativní build v E0:** Claude změní nastavení a pošle příkaz; Petr build spustí a nainstaluje (E0 bod 3).
3. ~~Maestro (R-7)~~ – ✅ 2026-11-22: ano, nutné minimum simulátorů (E0 bod 2).

**Před konkrétní etapou**
4. ~~Čip série v hrdinovi Home (D-3)~~ – ✅ 2026-11-22: zrušen.
5. **Cíle typu „Měřit“ (D-5, E16):** schválit plán úpravy uložených dat – je to jediná etapa, která mění
   databázi u stávajících uživatelů.

**Opakovaně v každé etapě**
6. ~~**Texty EN/DE/ES** schvaluje Petr po etapách~~ – **od 2026-11-24 drobnosti a texty rozhoduje Claude** (cíl TOP 5 %),
   zapisuje je do `design-migration-texts.md` („Rozhodnutí otázek“); Petr je vidí na telefonu a může zvrátit.
   Otázka na Petra jen u zásadních věcí (data uživatelů, peníze, nový koncept).
7. **Vyzkoušet etapu na telefonu** a říct „ok“ – bez toho se nejde dál (0.1 bod 1).

**Podklady pro E5–E10 (připraveno 2026-11-23, čeká na Petra)**
8. **Texty:** `design-migration-texts.md` – 105 nových textů EN/DE/ES (ES a část DE jako *návrh*), 62 použitých
   existujících klíčů a 24 otázek. Schvaluje se po etapách; E5 je na řadě první.
9. **Mapa dat:** `design-migration-datamaps.md` – zdroj každé hodnoty a akce v ostré appce. **Dvě zastavení:**
   E5 čip „+N XP“ v kartě Dnes nemá veřejný zdroj (jen XP za návyky dnes – nová čtecí funkce / bez čipu /
   celkové dnešní XP); E10 ikona a barva cíle podle kategorie existuje jen v kulisách (převést mapu do
   konstant – potřebuje ji i E14).
10. **Chyba ostré appky (nalezena při mapě dat, ověřeno):** okno „Cíl splněn“ ukazuje vždy +250 XP
    (`GoalCompletionModal.tsx`), ale cíl s cílovou hodnotou ≥ 10 000 připíše 350 (`SQLiteGoalStorage.ts`).
    ✅ **Opraveno 2026-11-23 (Petr: „ano oprav“):** jedno pravidlo `goalCompletionXP()` v
    `src/constants/gamification.ts` čte ukládání i okno, s testem (`goalCompletionXP.test.ts`).

**Podklady pro E11–E16 (připraveno 2026-11-24, čeká na Petra)**
11. ✅ **Všech 34 otázek k textům rozhodnuto 2026-11-24** (E5/E6 Petr, ostatní Claude – `design-migration-texts.md`,
    oddíl „Rozhodnutí otázek“; tamtéž zastavení z mapy dat). **Texty E11–E16:** `design-migration-texts.md` – dohromady E5–E16 266 nových textů, 167 převzatých, 92 existujících
    klíčů s opravenou hodnotou (tabulka C: Title Case, emoji, „Gewohnheit“, „1 days“) a 34 otázek s doporučením.
    Schvaluje se po etapách.
12. **Mapa dat E11–E16:** `design-migration-datamaps.md`. **Zastavení:** E14 ikona a barva cíle podle kategorie
    (jako E10), rychlé částky na kartě cíle (navrženo převést `suggestQuick(target)` jako čistou funkci), „+35 XP /
    milník / dnes už bez XP“ po zápisu (D-4 – `addProgress` výsledek XP nevrací); E15 XP u zápisu v historii.
13. ✅ **Chyby ostré appky z mapy dat (2026-11-24, s důkazem – opraveno 2026-11-24 se souhlasem, commity afd309a…5796e58; každá s testem a negativní zkouškou; navíc opraveno: týdenní průměr na Home, množná čísla „1 days“, chybové texty deníku a resetu):**
    - přepočet cíle přehraje zápisy **téhož dne obráceně** (`SQLiteGoalStorage.ts` ~387 a ~754; „+5, pak =10“ dá 15
      místo 10 po smazání/úpravě zápisu) – **data**, nejzávažnější;
    - trend „4 týdny“ na Home počítá obráceně (`HabitTrendAnalysis.tsx` ~153–164) – zlepšení při zhoršení;
    - okno série deníku přijde o den později (`journal.tsx` ~109–124, čte stav před uložením);
    - „Rok“ na Home je celá historie (`YearlyHabitOverview.tsx` ~73–75); úprava cílové hodnoty nepřepočítá dokončení
      (`SQLiteGoalStorage.update`); drobnosti: text chyby mazání zápisu cíle, zastaralá čísla `journal-stats`,
      nekontrolované datum v `ProgressEntryForm`, „Watch 1 ads“.

### 4.4 Brány (bez nich se dál nejde)

| Brána | Co musí platit | Před etapou |
|---|---|---|
| **B0** | Tabulka 4.2 potvrzená, zvuky (D-7), čip (D-3), Maestro (R-7) – vše ✅ 2026-11-22; zbývá založit větev podle R-5 | E0 |
| **B1** | Nativní build s přepínačem a s `expo-audio` je na telefonu, plynulost přeměřená, rozhodnuto o P46 (dotáhnout / zrušit), zvuky jdou slyšet v laboratoři | E1 |
| **B2** | Pilot (Návyky + chrome) schválený na telefonu, plynulost se skutečnou zátěží v pořádku | E7 |
| **B3** | Jádro XP a momentů schválené na telefonu (jiskry se trefují, nic se neskládá přes sebe) | E11 |
| **B4** | Všechny obrazovky vydání A schválené; všechny laboratorní dluhy (L-1 zrušen) postavené a převedené | E27 |
| **B5** | Vydání A venku a změřené (D1/D7, trychtýř) | E29 |

Značka „→ brána B#“ v nadpisu etapy znamená: **po** této etapě se brána vyhodnotí. Laboratorní dluhy (kap. 5)
a otevřené otázky (4.3) mají vlastní sloupec „potřebuje etapa“ / „kdy rozhodnout“ – etapa nesmí začít,
dokud nejsou hotové, i když zrovna žádná brána neleží před ní.

---

## 5. CO V LABORATOŘI JEŠTĚ CHYBÍ (nejdřív laboratoř + Petrovo schválení, potom převod)

**Pravidlo:** nic z téhle tabulky se v ostré appce nevymýšlí. Každý řádek se nejdřív postaví v laboratoři
(vlastní kolo, zápis do `premium-design-plan.md`, poučení do kap. 10), Petr ho schválí na telefonu
a teprve pak smí proběhnout etapa, která na něm závisí.

| Kód | Co chybí | Proč to chybí / co přesně | Potřebuje etapa |
|---|---|---|---|
| **L-1** | ~~**Části dne** (R-30)~~ | **Zrušeno – Petr 2026-11-21 (O-13): ne.** Nestavět | ~~E28~~ |
| **L-2** | **Home – sekce, které laboratoř nemá, přizpůsobení Home a ovládání v horním řádku** (vstup do Síně trofejí, tlačítko přizpůsobení, časovač násobiče – v laboratoři jsou tlačítka bez funkce) | Ostrý Home má 10 sekcí (`src/types/homeCustomization.ts`): `xpProgressBar`, `xpMultiplier`, `quickActions`, `journalStreak`, `streakHistory`, `monthlyChallenges`, `habitStats`, `recommendations`, `habitPerformance`, `habitTrends`. Laboratoř kreslí jen hrdinu dne, rychlé akce, dnešní návyky, sérii deníku, výzvu a týden. **Chybí:** historie sérií (graf), statistiky návyků (týden / 30 dní / rok), doporučení, výkon a trendy návyků, sekce násobiče (průběh harmonie x/7 + tlačítko zapnutí; O-4) a samotné okno přizpůsobení (`HomeCustomizationModal`). U každé rozhodnout: nový vzhled / sloučit / zrušit. Grafy návyků používají tvary stavů (R-11) a ověřenou paletu grafů (P32). **Stav 2026-11-17: hotovo v laboratoři.** Statistiky návyků (týden / 30 dní / rok) – `HabitStatsConcept.tsx` + `homeChartsLogic.ts` (kolo 41). Přehledy (místo výkonu a trendů), Pro tebe (místo doporučení), sheet přizpůsobení a funkční horní řádek – `HomeSectionsConcept.tsx` + `homeLayoutLogic.ts` (kolo 42). Historie série na Home zrušena (graf je ve Statistikách deníku, P35; Petr potvrdil 2026-11-21). Karta série deníku na Home zůstává a při zamrznutí nabízí zahřátí přímo na místě (kolo 43). Ukazatel násobiče je L-10, ne L-2 | E11 |
| **L-3** | **„Jak SelfRise funguje“** (`how-it-works`) | v laboratoři odkaz vede na starou obrazovku. **Stav 2026-11-21: postaveno v laboratoři** (kolo 47) – `HowItWorksConcept.tsx`: sedm oddílů skrytých mechanik, čísla z konstant appky; dnešní texty `help.*` mají věcné chyby (série deníku, lišta XP, „věštec“) – stránka je už nevykresluje, bublinky `?` si je zatím nechávají (jejich oprava patří k L-4) | E22 |
| **L-4** | **Drobnosti:** bublinky nápovědy (`HelpTooltip`), potvrzovací a chybové okno (`ConfirmationModal`, `ErrorModal`, `BaseModal`), stránka „nenalezeno“, obrazovka chyby databáze, načítací a prázdné stavy; systémová okna `Alert.alert` (historie deníku, přizpůsobení Home, připomínky ×8, úprava záznamu) – nahradit sheetem, nebo nechat; **kam se přestěhuje nápověda**, jejíž hostitel zaniká (`home.xpSystem` v `OptimizedXpProgressBar`, `goals.predictions` v `GoalCompletionPredictions`; celkem 11 klíčů – ke každému nový hostitel); **trasa `habit-stats`** (`IndividualHabitStatsScreen`, `DailyHabitTrackingScreen`) – laboratoř má jen detail jednoho návyku rostoucí z karty; rozhodnout, jestli přehled všech návyků zůstane **Stav 2026-11-21: bublinky hotové v laboratoři** (kolo 48, `labHelp.tsx`): z 11 klíčů zůstává 6 témat na místech skrytých pravidel – **úplná tabulka klíč → téma → hostitel → etapa je v kap. 7.10**. Texty = texty stránky „Jak SelfRise funguje“. Chybové okno, „nenalezeno“ a chyba databáze hotové v laboratoři (kolo 49, `systemScreens.tsx`; potvrzovací okno = `ConfirmSheet`, už existuje). `Alert.alert`: mapa všech 14 míst v kap. 7.9 (O-14). Trasa `habit-stats`: zrušit (O-11). L-4 tím uzavřen | E6, E22 |
| **L-5** | **Vlastní podpisové ikony** (R-34): plamen, hvězda, koruna, trofej, slunce, spodní lišta – místo emoji ⭐🔥👑 a obecné sady | zatím emoji a Ionicons. **Stav 2026-11-21: hvězda, plamen, koruna, trofej postaveny** (kolo 51) – písmo `assets/fonts/SelfRiseIcons.ttf` (zdroj `scripts/build-icon-font.py`), `SignatureIcon` (dvoubarevná) a `InlineIcon` (ve větě). Spodní lišta hotová (Dnes = vycházející slunce, Návyky, Deník, Cíle, Nastavení; jeden tvar, stav barvou). **Čeká na Petrovo schválení na zařízení** (kola 50–52 nebyla součástí schválení kol 41–49) | E1–E3 (přesunuto z E24, viz tam) |
| **L-6** | **Zvuk a hmatové vzory** (R-35) | rozsah a knihovnu hmatu ověřit; potřebuje nativní build (E0). **Stav 2026-11-21: postaveno v laboratoři** (kolo 50) – slovník pocitů `labFeel.ts` i s testem (18 okamžiků; zvuk jen 6 vzácných), `feelPlayer.ts`, přepínač „Zvuky“ v Nastavení, 4 kandidátní zvuky v `assets/sounds/` (zatím se nepřehrávají – přehrávač až s buildem E0). **Čeká na Petrovo schválení na zařízení** | E2, E20 (přesunuto z E25, viz tam) |
| **L-7** | **Stavy karty měsíční výzvy:** „připravuje se“, „žádná výzva“, načítání, chyba s tlačítkem „Zkusit znovu“ | ostrá karta je má (`monthlyChallenge.{loading,preparing,noActiveChallenge,errorLoading,retry}`), laboratoř ne. **Stav 2026-11-21: postaveno v laboratoři** (kolo 45) – `ChallengeCardStates.tsx`, pravidlo `challengeCardState` (`challengeLogic.ts`) i s testem: **známá data vždy vyhrají** (obnovení nikdy nepřepne kartu na načítání ani chybu); kostra až po `SKELETON_DELAY_MS`; chyba bez surového textu s jedním „Zkusit znovu“ = `loadMonthlyChallenge()`. Nové texty místo dnešních s emoji | E17 |
| **L-8** | **Spojení momentů:** vstup do nového stupně + velká trofej ze stejné akce = jedno okno; víc milníků výzvy naráz = jedno oznámení; trest za 3 zahřívací výzvy (`warmup_penalty`) | dnes by šly po sobě / nejsou nakreslené. **Stav 2026-11-21: postaveno v laboratoři** (kolo 46): (1) `chapterOfAction(xpBefore, xpAkce)` (`momentRules.ts`) – kapitola vede, trofeje akce jedou v `ChapterWindow` (`also`), XP z jejího tlačítka; level-up po přistání XP tutéž kapitolu znovu neukáže (v ostré appce: posluchač `levelUp` v `XpAnimationContext` musí znát kapitoly už ukázané akcí). (2) `milestonesCrossed(před, po)` (`challengeLogic.ts`) – události `monthly_milestone_reached` z jednoho zápisu složit do jednoho oznámení se součtem XP. (3) `warmUpStepDown` (`challengeLogic.ts`) kopíruje `starRatingService` (3 zahřívací po sobě, nejvyšší kategorie −1, shoda: Konzistence, nikdy pod 1★) – řádek v okně výzvy téhož měsíce, událost `star_level_changed` s důvodem `warmup_penalty` nesmí řadit vlastní okno | E8, E18 |
| **L-9** | **Tažení:** detail cíle; rozhodnutí O-3 o oknech oslav | kolo 40 je nedělalo. **Stav 2026-11-21: ověřeno, nic se nestavělo.** Detail cíle je v laboratoři stránka (`SlidePage` v `GoalsConcept.tsx`) a od kola 40 se vrací tahem od levého okraje (pás 28 px – graf s prstem začíná dál, nekoliduje); v ostré appce je to trasa `goal-stats` s nativním gestem zpět. Okna oslav (O-3): tažením se nezavírají; ťuknutí vedle okna jen zrychlí jeho nájezd (`skip` v `AchievementCelebrationConcept.tsx`), zavírá tlačítko (a systémové zpět na Androidu) – tak to zůstane | E15 |
| **L-11** | **Ostatní zapnutí násobiče** (nález finální kontroly 2026-11-22): kombo trofejí 2,5× / 6 h, splněná výzva 1,5× / 12 h, návrat po neaktivitě 2× / 48 h + 25 XP | Dnes kombo a výzvu oznamuje okno `multiplier_activation`, které řadí **posluchač `xpMultiplierActivated` v `XpMultiplierSection.tsx`** – sekce v E9 zaniká, takže by oznámení tiše zmizela. Návrat po neaktivitě (`appInitializationService` → `checkAndActivateInactiveUserBoost`) dnes uživateli neukazuje **nic**. Laboratoř má jen zapnutí harmonie. **Stav 2026-11-22: postaveno v laboratoři** (kolo 53, Petr souhlasil s návrhem): pravidla `boostOf` a `boostMoment` (`multiplierLogic.ts`) i s testem – samo zapnutý násobič nikdy nemá vlastní okno; výzva = řádek v okně „Výzva splněna“; kombo = štítek „2,5×“ v tiché pilulce trofeje, resp. řádek „2,5× XP na dalších 6 hodin“ ve velkém okně (`MomentBoost` v `celebrationDirector.tsx`); návrat = tiché „Vítej zpět · 2× XP na 48 hodin“ z odznaku s +25 XP (`welcomeBack` v `multiplierMock.tsx`) | E8, E9, E18 |
| **L-10** | **Násobič na odznaku** (O-4, schváleno): štítek „2ד na odznaku, řádek harmonie x/7 a zbývající čas v panelu úrovně, tiché oznámení „připraveno“ se zapnutím ťuknutím | postavit a nechat schválit v laboratoři. **Stav 2026-11-21: postaveno v laboratoři** (kolo 44) – `multiplierLogic.ts` i s testem, `multiplierMock.tsx`, značka `mark` na `LevelBadge` (`xpFlight.tsx`), `MultiplierPart` v `levelPanel.tsx`, oznámení s akcí (`LabNote.action`). Štítek ukazuje faktor, který opravdu běží (i 1,5× / 2,5×). Připravený násobič: tečka na odznaku + tlačítko v panelu zůstávají i po přehlédnutém oznámení; oznámení **jednou na připravení** (uložit klíč, např. začátek série harmonie – `shouldAnnounceReady`). Petr schválil na zařízení 2026-11-21 | E9, E11 |

---

## 6. ETAPY

### 6.0 Stavba vrstev v ostré appce (závazné – nevymýšlet jinak)

Laboratoř kreslí všechno v jednom stromu. V ostré appce to musí být stejně, jinak jiskry XP nedoletí
z tlačítka okna do odznaku a oslavy se budou krýt.

```
app/_layout.tsx → LayoutContent (odspodu nahoru)
 1. <Stack>                      navigátor: záložky i obrazovky karet
 2. Vrstva odznaku               panel úrovně → odznak (+ značka násobiče `mark`) → tiché oznámení
 2a. Vrstva nápovědy             spodní okno nápovědy (`labHelp.tsx`); otevírá se i z panelu úrovně –
                                 panel se nejdřív schová (jedna věc najednou)
 2b. Pruh neúspěšné akce         `ProblemNote` – nad spodní lištou a reklamním pruhem (P11), nikdy přes ně
 3. <OnboardingFlow>             úvod
 4. Vrstva oken                  fronta momentů – celoobrazovkové View
 5. Vrstva jisker XP             jedno plátno Skia, jen když něco letí

app/(tabs)/_layout.tsx           spodní lišta; reklamní pruh nad ní
Uvnitř jedné záložky             stránka → její sheety a detaily (ne trasy, ne RN <Modal>)
```

- **V nových obrazovkách žádný RN `<Modal>`.** Sheety, detaily a okna jsou `View` ve stromu (jako v
  laboratoři). Dnešní okna z `ModalQueueContext` jsou RN `<Modal>` – překryla by odznak i jiskry.
  Fronta zůstává (pořadí, priority, test), mění se jen to, **kde a jak** se okno kreslí: dnes je kreslí
  sám `ModalQueueProvider` (`ModalRenderer`), nově výstup fronty (vrstva 4) připojený v `LayoutContent`.
- **Proč jsou okna nad úvodem:** dnešní úvod počítá s tím, že okna trofejí `first-habit` a `first-goal`
  uživatel uvidí a zavře (`Tutorial.md` pravidla 1 a 3; brána čeká na událost `achievementCelebrationClosed`).
  Okno schované pod úvodem by nešlo zavřít a úvod by čekal na pojistný časovač. Teprve E21 to mění
  (trofeje až v závěru úvodu) – a s ním se upraví `Tutorial.md`.
- **XP během úvodu:** odznak je při úvodu schovaný, takže XP získané v úvodu se přidrží a rozletí se až
  po jeho zavření (laboratoř: `OnboardingXp`). `Tutorial.md` dnes říká „XP v liště se stihnou ukázat“ –
  v E7 ten odstavec přepsat.
- **Vrstva odznaku se skrývá** během úvodu (`OnboardingFlow`) a na trase `design-lab` (laboratoř má vlastní
  odznak). Obrazovka chyby databáze se kreslí před `RootProvider`, odznak na ní tedy není vůbec.
- **Registr „něco je otevřeno“** (`labCover.ts`) se **převádí** – sheety a detaily uvnitř záložek nejsou
  trasy, takže navigace o nich neví. Panel úrovně se smí otevřít jen když: trasa je jedna z pěti záložek
  **a** registr hlásí nulu **a** neběží žádný moment. „Záložka je vidět“ = `useIsFocused()`.
- **Stránky, které v laboratoři přijíždějí zprava** (`SlidePage`: Síň trofejí, historie a statistiky
  deníku, přehled úrovní, detail cíle, „Jak SelfRise funguje“), jsou v ostré appce **skutečné trasy** ve `Stack`u. Nech jim nativní
  přechod a nativní gesto zpět; `SlidePage` ani jeho tažení se nepřevádí.

---

### E0 – Příprava, větev, nativní build, měření  → brána B1

**Cíl:** bezpečné místo pro práci, snímky „před“ a rozhodnutí, na čem poběží běžné animace.
**Závisí na:** B0.

1. Větev `design-v2` z `main` (R-5). **Před každou další etapou `git merge main` – jen s Petrovým výslovným
   pokynem** (sloučení vytváří commit, CLAUDE.md pravidlo 12); na `main` dál běží opravy a práce v laboratoři.
2. Snímky „před“: hlavní obrazovky × EN/DE/ES × světlý/tmavý × malý telefon, velký telefon, Android,
   s marketingovými demo daty (`marketingDemoDataService`). **Nástroj Maestro (R-7, ✅ Petr 2026-11-22):**
   nainstalovat Maestro CLI (Java 17, Xcode a Android SDK s emulátorem už na Macu jsou); scénáře průchodu
   obrazovkami v `.maestro/`; po každé etapě snímky „po“ a porovnání. **Nutné minimum simulátorů** (na Macu
   je málo místa): jeden malý iPhone, jeden velký iPhone, jeden Android – ostatní simulátory a staré buildy
   pro simulátor mazat; tablet a další velikosti ručně (kap. 7.5).
   **Rozsah snímků (2026-11-23, Petr nenamítal návrh):** EN světlý na všech třech zařízeních; tmavý režim
   a DE/ES jen na iPhone 17 Pro Max. Vždy běží jen jeden simulátor (málo RAM).
3. **Jeden nativní build pro všechno.** Rozdělení práce (Petr 2026-11-22): Claude změní nativní nastavení
   projektu (níže) a dá Petrovi přesný příkaz; **build spouští a instaluje Petr sám** přes EAS jako vývojový
   build (nikdy kabelem). Do instalace nového buildu Petr jede na tom současném – kód, který nový build
   vyžaduje, se do té doby nepouští:
   - přepínač Reanimatedu `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` (statický; ověř přesný zápis
     v dokumentaci nainstalované verze, než ho napíšeš do `package.json`);
   - 120 Hz: **iPhone** – klíč `CADisableMinimumFrameDurationOnPhone` je od 2026-11-22 v `app.json`
     (`ios.infoPlist`). Dřív byl jen v místní složce `ios/`, kterou git ignoruje – EAS ho tedy nikdy
     nestavěl a appka běžela na 60 Hz. **Android** – žádné nastavení: React Native jede v tempu displeje,
     ověřit měřením na 120Hz telefonu;
   - **`expo-audio`** pro zvuky R-35 – rozsah je určený (O-12, kolo 50): 6 okamžiků, 4 zvuky
     v `assets/sounds/`. Nainstalováno 2026-11-22 (`~55.0.18`). **Plugin má výchozí nastavení, které by
     přidalo oprávnění k mikrofonu, zvuk na pozadí a službu na popředí (Android) – v `app.json` je vypnuté**
     (`microphonePermission`, `recordAudioAndroid`, `enableBackgroundPlayback`, `enableBackgroundRecording`
     = false). Nikdy nevracet bez důvodu – obchody by chtěly zdůvodnění. Hmat zvládá
     stávající `expo-haptics` (vzory jsou časované tapy, `labFeel.ts`) – další knihovna **není potřeba**.
   Přepínač Reanimatedu je od verze 4.3 výchozí – při přechodu na nové Expo (E30) se z konfigurace odstraní.
4. Měření v laboratoři na novém buildu (kap. 7.4): odškrtnutí návyku na Home a v Návycích, zápis pokroku
   cíle, přepínání záložek, přechody obrazovek.
   **Petr 2026-11-21:** posun Home hned po odškrtání návyků se trhal. Kolo 52 našlo dvě skutečné příčiny
   a opravilo je v laboratoři (věta hrdiny měnila výšku a přestavěla animace všech karet; plamen běžel ve
   smyčce i při posunu – P79). Na novém buildu změřit přesně tenhle scénář (odškrtat všechny návyky →
   hned rychle posouvat; v tu chvíli běží slunce, záře a lety XP). Sleduj známé riziko přepínače: probliknutí průhlednosti
   při výměně obrazovek (hlášení Reanimated #10444).
5. **Rozhodnutí o P46** (✅ 2026-11-22: zrušeno – viz D-2; JS špičky po odškrtnutí řešit v E5/E11): když je s přepínačem odškrtnutí plynulé i na Reanimated → P46 se ruší a primitiva
   zůstávají, jak jsou. Když ne → všechny běžné reakce (`CheckButton`, `ProgressBar`, rozzáření a poskok
   řádku návyku, sloupce týdne, věta průvodce, pohyb slunce) se převedou na nativní ovladač **v laboratoři**,
   než začne E2. Výsledek zapsat do `premium-design-plan.md` (poučení 46) – nepřenášet smíšený stav.
6. Zjistit (jen přečíst a zapsat): dá se React Compiler (`experiments.reactCompiler`) zapnout jen pro nové
   soubory? Nezapínat bez Petra.
   **Zjištěno 2026-11-23 (z nainstalovaných balíčků, nic se nezapnulo):** ano, dvěma způsoby. Zapíná se
   `experiments.reactCompiler: true` v `app.json` (Metro pak předá `supportsReactCompiler`
   `babel-preset-expo`) a rozsah se omezí volbou presetu v `babel.config.js`:
   `['babel-preset-expo', { 'react-compiler': { … } }]` s **`sources: (filename) => boolean`** (jen vybrané
   složky, např. `src/design/` a nové obrazovky) nebo **`compilationMode: 'annotation'`** (jen komponenty
   s direktivou `'use memo'`). Nainstalovaný `babel-plugin-react-compiler` 1.0.0 obojí má; `node_modules`
   preset nikdy nekompiluje, vypnout jde i direktivou `'use no memo'`. Je to změna jen v JS (žádný nový
   build). Před zapnutím ověřit soužití s Reanimated (čtení `.value` při vykreslení) – rozhoduje Petr.

**Nesmí se rozbít:** nic – kód appky se nemění, jen konfigurace buildu.
**Petr ověří:** build běží; plynulost v laboratoři; žádné problikávání při přechodech.
**Hotovo když:** B1 je zapsaná v tabulce stavu (kap. 10) s výsledkem měření a rozhodnutím o P46.

---

### E1 – Tokeny, fonty, hlídací testy (bez viditelné změny)

**Zdroj:** `labTokens.ts`. **Cíl:** nová složka `src/design/`, `src/contexts/ThemeContext.tsx`, `app/_layout.tsx`.

1. `src/design/tokens.ts`: palety světlá/tmavá, typografie, mezery, zaoblení, pohyb, barvy vzácnosti
   (`labRarity`) a stupňů úrovní (`labTier`), mapa barev návyků + `onHabitColor()`, nebe a slunce hrdiny
   (`labSky`, `labSun`, `labSkyGold`), denní doba (`getDaypart` – potřebuje ji pozdrav R-6), barvy splashe
   (`SPLASH_*`), seznam souborů fontů. Názvy bez „lab“. **Barvy zapsané natvrdo v souborech laboratoře**
   přesuň do tokenů také – jinak pozdější etapy neprojdou ráčnou. Neber jen příklady: projdi
   `grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src/screens/design-lab/*.tsx` mimo `labTokens.ts` a každý nález
   přesuň (mj. `OnboardingConcept`, `journalParts` – led a nebezpečí, `SignatureIcon` – `TONES`,
   `HabitStatsConcept` – paleta grafu, `xpFlight`, `AchievementCelebrationConcept`, `challengeMoments`,
   `JournalStats/HistoryConcept`, `systemScreens`, `levelPanel` – `GOLD_INK`).
2. `useTheme()` rozšířit o `design` (tokeny pro aktuální režim). Staré `colors` zůstávají, dokud je něco čte.
3. Fonty (Fraunces, Figtree **a písmo ikon `SelfRiseIcons`** – soubory už jsou v `assets/fonts`) načíst
   v `app/_layout.tsx` vedle `SpaceMono`. Jedna rodina na tloušťku, nikdy `fontWeight` (Android by potichu
   použil systémové písmo). Písmo ikon nepotřebuje nativní modul (P78); **ověř, že má PostScript název**
   (nameID 6, skript ho od 2026-11-22 zapisuje) – iOS bez něj ikony kreslí jako „?“.
4. Jednotná paleta barev návyků – oprava „zelená = modrá“ (stejný odstín v obou režimech).
5. Testy (nové, s negativní zkouškou):
   - kontrast WCAG AA pro každou dvojici text/povrch v obou režimech, včetně `labTier`, `labRarity`
     a symbolu na barvě návyku;
   - typografie: každá varianta má rodinu písma;
   - **ráčna:** seznam převedených souborů; v nich nesmí být hex barva, `fontSize` ani `borderRadius`
     natvrdo, ani volání `measureLabPerf` (měřicí sonda laboratoře se nepřevádí, P48), **ani import
     `Modal` z `react-native`** (ochrana proti zamrzání, E8). Seznam může jen
     růst – po každé etapě do něj přidej její soubory.

**Nesmí se rozbít:** vzhled appky (nic se nesmí viditelně změnit), start appky (fonty nesmí zdržet
ani shodit spuštění – `useFonts` už dnes blokuje na `SpaceMono`).
**Petr ověří:** appka vypadá stejně jako předtím.
**Pasti:** T-Qyron (třetí režim) se teď nestaví, ale tokeny musí být po rolích (`surface`, `textMuted`…),
ne po odstínech, aby šel později přidat.

---

### E2 – Primitiva a průvodce Design-System

**Zdroj:** `labPrimitives.tsx`, `RollingNumber.tsx`, `StreakFlame.tsx`, `scrollChoreography.tsx`,
`introTimeline.tsx`. **Cíl:** nová složka `src/components/ui/`.

1. Převést: `AppText` (z `LabText`, se stropem zvětšení písma), `Surface`, `PressableScale`, `ProgressBar`,
   `Chip`, `Divider`, `IconBadge`, `CheckButton`, `AnimatedNumber`, `RollingNumber`, `DayArc`, `MiniArc`,
   `StreakFlame`, `ScrollCard` + pohyb při rolování, `Rise` + časová osa nájezdu, `Ring` (kruh s procenty,
   dnes v `GoalDetailConcept.tsx`), `Stars` (dnes v `ChallengeDetailConcept.tsx`).
   `StreakFlame` zjišťuje „je vidět“ přes `useIsFocused()`, ne přes laboratorní kontext. **`lottie-react-native`
   zůstává** – plamen ho potřebuje (původní osnova F5 ho chybně vedla jako mrtvý).
2. Primitiva čtou tokeny z `useTheme()`, ne z `useLab()`. Přepínač `crown` (laboratorní srovnání) se nepřevádí
   – platí verze „zapnuto“.
3. Ovladač animací: **Reanimated, beze změny** (B1: P46 zrušeno 2026-11-22).
4. **Slovník pocitů (L-6, přesunuto z E25):** `labFeel.ts` (+ test) → `src/constants/feel.ts`; přehrávač
   `feelPlayer.ts` → `src/services/feelService.ts` – hmat přes `hapticsService`, zvuk přes `expo-audio`
   (z buildu E0; jeden přednačtený přehrávač na zvuk, hlasitost ~0,6, `playsInSilentMode: false`, chyba
   přehrání nikdy neshodí okamžik). **Od této etapy se v nových obrazovkách volá jen `feel('<okamžik>')`**,
   nikdy ruční `impact()` / `notification()` – mapa ručních volání laboratoře → okamžik je v `PREVOD.md`
   (řádek `labFeel.ts`). Vypínač zvuků: uložený vedle vypínače haptiky (stejný vzor jako
   `setHapticsEnabled`), řádek v Nastavení přibude v E20.
4a. **Ikony (L-5, přesunuto z E24):** `SignatureIcon` a `InlineIcon` → `src/components/ui/`; barvy `TONES`
   do tokenů; komponenta čeká, až je písmo ikon načtené (jinak by kreslila „?“). Ikona ve větě má slovní
   popisek pro čtečku (`accessibilityLabel` rodiče). Písmo se mění jen skriptem `scripts/build-icon-font.py`
   (potřebuje `fonttools`), nikdy ručně.
4b. **Klid při posunu (kolo 52, P79):** `useScrollRest` z `scrollChoreography.tsx` převést spolu se
   `ScrollCard`; `StreakFlame` přijímá `rest` a pozastavuje smyčku přes ref `LottieView`.
5. Nový průvodce `technical-guides:Design-System.md` (kostra podle CLAUDE.md pravidla 10; R-8): tokeny,
   primitiva, pravidla z kap. 3 tohoto plánu a z kap. 10 plánu designu. Odkaz z `technical-guides.md`.
6. Testy primitiv tam, kde mají logiku (např. `RollingNumber`: okraje patří celému číslu, P34).
7. Známý dluh z revize: `RollingNumber` má 11 textů na číslici (Home pak 150–200 prvků). Buď ho tady
   zjednoduš (méně prvků, stejný vzhled – porovnat v laboratoři), nebo to do zprávy napiš jako vědomě
   odložené. Nenech to bez zmínky.

**Pozor:** laboratoř si nechává vlastní kopie (je to vzor). Oprava primitiva během převodu se dělá
**na obou místech**, dokud laboratoř existuje (O-6).
**Nesmí se rozbít:** nic viditelného – primitiva zatím nikdo nepoužívá.
**Petr ověří:** nic (bez viditelné změny); přečte si průvodce.

---

### E3 – Chrome: spodní lišta, horní řádek, místo pro reklamu, nájezd jen poprvé

**Zdroj:** `DesignLabScreen.tsx` (jen `BottomChrome` a pravidlo R-32), `introTimeline.tsx`.
**Cíl:** `app/(tabs)/_layout.tsx` a horní část pěti obrazovek záložek.

1. Spodní lišta v novém stylu: klouzavá pilulka pod aktivní ikonou, popisky, barvy z tokenů. **Ikony lišty
   jsou vlastní** (`SignatureIcon`: `today`, `habits`, `journal`, `goals`, `settings`) – jeden tvar v obou
   stavech, otevřená záložka v barvě appky se zlatým jádrem, ostatní tlumené (kolo 51).
2. Hlavičky záložek bez sytě modrého pruhu (`headerShown: false`); každá obrazovka má vlastní horní řádek
   vysoký 48 bodů pod bezpečným okrajem. **Vlevo nechej volné místo 48 × 48 pro odznak** (přijde v E7),
   tlačítka obrazovky jsou vpravo (P10, R-10).
   **Pozor – hlavička Home dnes nese tři ovládací prvky** (`app/(tabs)/_layout.tsx`): vlevo tlačítko trofejí
   (jediný stálý vstup do Síně trofejí), vpravo časovač násobiče (`MultiplierCountdownTimer`) a tlačítko
   přizpůsobení (posílá událost `openHomeCustomization`, kterou poslouchá `app/(tabs)/index.tsx`). Přestěhuj
   je do vlastního horního řádku Home **beze změny chování**. Časovač násobiče je tu jen dočasně: v E9 ho
   nahradí značka na odznaku a řádek v panelu úrovně (O-4, L-10) a časovač se odstraní; vstup do trofejí
   a tlačítko přizpůsobení dostanou konečnou podobu v E11.
2a. **Stavový řádek podle režimu:** světlý vzhled = tmavé ikony, tmavý = světlé. Dnes je `style="light"`
   natvrdo na šesti místech (kap. 2.2) – bez modré hlavičky by ikony ve světlém režimu zmizely. Oprav v této
   etapě záložky a kořen, obrazovky karet vždy ve své etapě.
3. Reklamní pruh: **logiku reklam neměň** (`AdBanner`, `useBannerRetry`). Mění se jen poloha – nad spodní
   lištou, s odstupem od ovládacích prvků podle `AdMob.md`. Jestli má být pruh jeden společný pro záložky,
   je obchodní rozhodnutí (O-5) – bez Petra nechej pruh v každé obrazovce.
4. R-32: nájezd obrazovky se přehraje jen při **prvním** zobrazení záložky po otevření appky. Záložky
   expo-routeru už zůstávají živé – ověř, že nikde není `unmountOnBlur`. Smyčky (slunce, plamen) stojí,
   když záložka není vidět (`useIsFocused()`).
5. Obsah všech obrazovek počítá s výškou chromu (lišta + pruh + spodní okraj) – P11.

**Nesmí se rozbít:** reklamy (načtení, opakování po chybě, skrytí během úvodu), velké obrazovky, vstup do
Síně trofejí, otevření přizpůsobení Home, časovač násobiče. Úvod už na prvky lišty nemíří (`nativeID`
v kódu jsou pozůstatky, nic je nečte) – jediný živý cíl úvodu je pulz `highlight` zaškrtávátka (E5).
**Petr ověří:** přepínání záložek je okamžité, stav a rolování zůstávají; pruh se ukazuje; tablet. Vlevo
nahoře je do E7 prázdné místo – to je v pořádku, ne chyba.
**Pasti:** P9 (obal přes celou šířku polyká ťuknutí), P26b.

---

### E4 – Sdílené díly: sheet, detail z karty, tažení, registr překryvů

**Zdroj:** `journalParts.tsx` (`BottomSheet`, `useKeyboardLift`, `ConfirmSheet`), `JournalDetailConcept.tsx`
(rám rostoucí z karty), `dragToClose.tsx`, `dragToCloseLogic.ts`, `labCover.ts`.
**Cíl:** `src/components/ui/`.

1. `BottomSheet` (zvedá se o změřený překryv klávesnice; tažením dolů se zavírá, ne však s textovým polem).
2. `DetailFrame` – rám, který roste z obdélníku karty a vrací se do něj; obsah je rozložený jednou v plné
   velikosti. V laboratoři je ten kód třikrát (deník, návyk, výzva) – tady z něj udělej jeden díl.
3. `useDragToClose`, `DetailScroll` + `dragToCloseLogic.ts` **i s testem**.
4. Registr překryvů: `useOverlayCover()`, `useOverlayCovered()`, `useOverlayBack()` (Android zpět jen když
   je obrazovka vidět). „Je vidět“ = `useIsFocused()` místo laboratorního kontextu.
5. `ConfirmSheet` a `UndoToast` (z `goalParts.tsx`) jako sdílené díly.
6. Horní řádek obrazovky karty s křížkem vpravo (`PageTopBar` z `journalParts.tsx`) – používají ho přehled
   úrovní, historie a statistiky deníku, detail cíle a Síň trofejí.
7. Rám okna oslavy: `useWindowMotion`, `PrimaryButton` a styly okna (dnes v `challengeMoments.tsx`) – okna
   v E8, E10 a E18 ho sdílejí, proto vzniká už tady.

**Nesmí se rozbít:** nic – díly zatím nikdo nepoužívá.
**Pasti:** funkce gest musí mít `'worklet'`; po puštění se věc buď zavře, nebo vrátí celá – nikdy nezůstane
napůl (kolo 40); P30, P43.

---

### E5 – Návyky: seznam (pilot)

**Zdroj:** `HabitsConcept.tsx`. **Cíl:** `src/screens/habits/HabitsScreen.tsx`,
`src/components/habits/{HabitListWithCompletion,HabitItemWithCompletion,HabitCompletionButton,DailyHabitProgress,DailyProgressBar,BonusCompletionIndicator}.tsx`.
**Závisí na:** R-3, R-4c, R-11 potvrzené. Za sérii návyku se XP nevyplácí (O-1) – nic takového nekreslit.

| Laboratoř (kulisa) | Ostrá appka |
|---|---|
| `LAB_HABITS`, `statusesFor`, `isScheduled`, `isPaused` | `HabitsContext`, `useHabitsData`, `habitImmutability` (skutečné párování nahrazených dnů) |
| `useLabToday().toggle` | `HabitsContext.toggleCompletion` (už je optimistický) |
| `XP_PER_HABIT = 25` | hodnoty z appky (`XP_REWARDS.HABIT`), nikdy konstanta |

1. Týden nahoře, „dnes“ s dílky, karty s mini-týdnem, sekce Bonus a Pozastavené.
2. Stav dne tvarem (R-11): ● splněno · ○ zachráněný den se spojnicí · ★ bonus · × vynecháno · ━ pauza ·
   tenký kroužek = plánováno. Symbol na barvě návyku přes `onHabitColor()`. Pár „den navíc ↔ zachráněný
   den“ má v mini-týdnu závorku **pod** tečkami; překrývající se páry dostanou každý vlastní dráhu (P22).
   U teček písmeno dne (P23).
2a. Týdenní pruh nahoře kresli **jedním** plátnem, ne sedmi (dluh z revize).
3. Čtyři tlačítka na řádku → nabídka „⋯“ jako sheet (R-4c): kalendář, upravit, pozastavit, smazat.
4. Odškrtnutí: pružina + haptika. **Pulz z úvodu (`highlight` v `HabitCompletionButton`) musí zůstat.**
5. XP se v této etapě ukazuje ještě postaru (souhrnná lišta) – odznak přijde v E7. Zaškrtávátko si ale
   už teď umí změřit vlastní polohu (bude ji potřebovat).
6. **Odškrtnutí překreslí jen dotčenou kartu:** karta nečte celý stav dne z kontextu; dostává svůj stav
   jako vlastnost a je `React.memo` (P42, P47). Ověř měřením počtu překreslení.

**Nesmí se rozbít:** Smart Bonus Conversion, pauzy, řazení úchytem (`ReorderableList`), pulz úvodu
(`highlight` + `onboardingHabitId` v `HabitItemWithCompletion`), nápověda podle 7.10 (`habits.scheduling`
a `habits.bonusConversion` zanikají, téma „nahrazený den“ jde do kalendáře v E6), parametr `?quickAction=addHabit` (rychlá akce z Home
musí otevřít nové okno tvorby), ťuknutí na připomínku vedoucí na Návyky.
**Testy:** stavy dne → tvar (čistá funkce); karta se nepřekreslí při změně jiného návyku.
**Průvodci:** `Habits.md` – kapitolu „UI Display Rules“ přepsat; opravit nápovědu „Smart Make-up System“
(píše „zlatá fajfka“ – P28).
**Petr ověří:** 20+ návyků na slabším Androidu, odškrtnutí bez zadrhnutí; barevní návyky žlutá a červená;
úvod s pulzem.

---

### E6 – Návyky: detail, tvorba a úprava, řazení  → brána B2

**Zdroj:** `HabitDetailConcept.tsx`, `HabitComposerConcept.tsx`, `HabitsReorderConcept.tsx`.
**Cíl:** `src/components/habits/{HabitCalendarView,HabitModal,HabitForm,ColorPicker,IconPicker,DayPicker}.tsx`,
režim řazení v `HabitsScreen.tsx`.
**Trasa `habit-stats` se ruší (O-11):** `HabitsScreen.handleViewHabitStats` (`HabitsScreen.tsx:192`,
`router.push('/habit-stats?habitId=…')`) otevře místo trasy nový detail návyku rostoucí z karty. Samotné
soubory trasy se mažou až v E26.

1. Detail roste z karty (`DetailFrame`): kalendář s tvary, oblouček páru nahrazeného dne, vysvětlení dne.
2. Tvorba i úprava = jeden sheet s živým náhledem. **Validace a chybové texty sdílet s `HabitForm`,
   nekopírovat.** Ikony jen z `HABIT_ICON_MAP`.
3. Řazení: vzhled řádků a čísla pořadí; pravidla řazení beze změny.
4. Nápověda „nahrazený den“ (téma `makeUp`, 7.10) jako tiché „i“ u legendy kalendáře v detailu.

**Nesmí se rozbít:** vytvoření návyku z úvodu (`createWithTrophyGate`), limity formuláře, řazení.
**Petr ověří:** celý pilot – a tím **brána B2**: vzhled, plynulost se skutečnými daty, němčina, velké písmo,
snížený pohyb, tablet.

---

### E7 – Jádro XP: odznak a jiskry (R-10)

**Zdroj:** `xpFlight.tsx`. **Cíl:** `src/contexts/XpAnimationContext.tsx`, `src/contexts/RootProvider.tsx`,
`app/_layout.tsx` (vrstvy 2 a 5 podle 6.0), `src/components/gamification/`.

**Jak to funguje v ostré appce (pozor – jinak než v laboratoři):** appka připisuje XP **hned** při akci
(v úložišti). Laboratoř „připisuje“ až při dopadu jisker, protože nemá úložiště. V ostré appce je proto let
jen **zobrazení**:

- Odznak ukazuje **zobrazené XP**, ne skutečné. Skutečné XP zná `GamificationService`.
- Každý přírůstek (`xpGained`) se buď hned rozletí (z místa akce, nebo ze středu obrazovky, když místo
  nezná), nebo se **přidrží u momentu** (XP za trofej, výzvu, dokončený cíl, sérii) a rozletí se, až
  uživatel moment potvrdí nebo až tiché oznámení odejde.
- Záporné XP nic neposílá – kroužek jen ubyde.
- Při startu appky a po návratu z pozadí: zobrazené = skutečné, bez letu.
- Pojistka: kdyby moment nikdy neproběhl, zobrazené XP se srovná se skutečným při dalším otevření appky.

1. Čistá „účetní“ funkce zobrazeného XP (zobrazené + ve vzduchu + přidržené = skutečné) **s testem**.
2. **Bod původu bez zásahu do logiky.** Událost `xpGained` už pole `position` má, ale služba do něj vkládá
   výchozí `{x: 50, y: 130}` (`gamificationService.ts`) – nedá se poznat od skutečného místa. Proto:
   malý registr na straně obrazovky `registerXpOrigin({ source, sourceId }, bod)`. Obrazovka ho zavolá těsně
   **před** akcí (zaškrtávátko návyku, tlačítko „Přidat“ v deníku, rychlý zápis cíle); vrstva jisker si při
   příchodu `xpGained` najde bod podle `sourceId` (nebo podle druhu zdroje, je-li záznam mladší 3 s), použije
   ho jednou a zahodí. Nenajde-li nic → střed obrazovky. **Kontexty, úložiště ani `addXP` se kvůli tomu
   nemění.** Ověř jen, že `xpGained` nese `source`, `sourceId` a `metadata`; chybí-li, doplň je do typu
   události (`src/utils/appEvents.ts`) a do míst, která ji posílají (`gamificationService.ts`,
   `achievementService.ts`, `trophyCollectionService.ts`, `marketingDemoDataService.ts`) – nic neodebírej.
3. **Přidržení XP u momentu** – přesná pravidla:
   - přidržují se zdroje: trofej (`ACHIEVEMENT_UNLOCK`), dokončení výzvy (`MONTHLY_CHALLENGE`, jen dokončení),
     dokončení cíle (`GOAL_COMPLETION`), odměna za sérii deníku (`JOURNAL_STREAK_MILESTONE`) a **milníková
     část** záznamu deníku (⭐🔥👑: jedna transakce nese `metadata.baseXp` a `metadata.milestoneXp` – základ
     letí hned z tlačítka „Přidat“, milníková část se přidrží);
   - přidržené XP se uvolní, když uživatel moment téhož druhu potvrdí (tlačítko okna / odchod tichého
     oznámení); do E10 platí pro stará okna: uvolnit při `closeCurrentModal`;
   - **pojistka:** není-li do 2 s po příchodu XP žádný moment téhož druhu ve frontě ani na obrazovce
     (např. trofej potlačená během úvodu), XP se rozletí hned ze středu. Nic nesmí zůstat přidržené navždy.
4. Odznak: kroužek = postup úrovně ze zobrazeného XP; zásah jiskry = puls, odskok, záblesk; překročení
   úrovně = uzavření kroužku, záblesk, odvalení čísla, štítek „LEVEL UP“. Potlačení oslavy úrovně během
   úvodu (`XpAnimationContext.handleLevelUp`) zůstává.
5. Souhrnná lišta (`XpNotification`) a staré bubliny (`XpPopupAnimation`) se v této etapě odpojí.
   Soubory i jejich testy (`xpNotificationBatching.test.ts`, `xpPopupTimeline.test.ts`) se mažou až v E26.
6. Snížený pohyb: žádný let – kroužek se posune a odznak jednou pulzne.
6a. **Značka násobiče na odznaku (L-10, O-4):** vlastnost `mark` z `LevelBadge` (`xpFlight.tsx`) – zlatý
   štítek s faktorem, který **opravdu běží** (`getActiveMultiplier().multiplier`: 2×, 1,5× výzvy, 2,5× komba,
   2× návratu), a tichá zlatá tečka, když je násobič harmonie připravený. Pravidlo `badgeMark` a `formatFactor`
   z `multiplierLogic.ts` i s testem. Značka nemění měřený střed odznaku (jiskry dál dopadají na kroužek)
   a při otevírání panelu se rozplyne.
7. XP získané během úvodu se přidrží a rozletí po jeho zavření; odstavec v `Tutorial.md` o XP v liště přepsat.

**Nesmí se rozbít:** skutečné XP (žádná změna v `GamificationService.addXP`), denní limity, výpočty výzev
z XP (`monthlyProgressIntegration.ts` poslouchá `xpGained` – obsah události se nesmí zmenšit), fronta oken,
úvod (`onboardingFlow.test.ts`).
**Průvodci:** `Gamification-UI.md` – kapitoly o souhrnné liště a časování bubliny nahradit popisem odznaku
a jisker (R-10 je ruší; průvodce taky uvádí 10 typů oken, kód jich má 11 – opravit); `Gamification-Events.md`
– registr původu a pravidla přidržení; `Tutorial.md` – XP během úvodu.
**Petr ověří:** jiskry se trefují do kroužku na všech obrazovkách (i s výřezem displeje a na tabletu),
několik zisků naráz, odebrání XP, snížený pohyb.
**Pasti:** P12 (měřit přesně odznak 48 × 48, ne řádek), P13 (souřadnice převést do soustavy vrstvy jisker),
P14 (reakce na dopad na UI vlákně), P15–P16, P45, P47.

---

### E8 – Momenty: jedna oslava na jednu akci, tichá oznámení, velké okno trofeje (R-29)

**Zdroj:** `celebrationDirector.tsx`, `AchievementCelebrationConcept.tsx`.
**Cíl:** `src/contexts/ModalQueueContext.tsx`, `src/contexts/AchievementContext.tsx`,
`src/components/achievements/AchievementCelebrationModal.tsx`, vrstvy 2 a 4 podle 6.0.
**Závisí na:** O-3; L-8 (spojení momentů).

1. **Dávka:** služba dnes posílá událost `achievementUnlocked` **za každou trofej zvlášť** (a navíc
   `multipleAchievementsUnlocked`, je-li jich víc) a `AchievementContext` řadí jedno okno na trofej. XP za
   celou dávku je přitom jedno `addXP` a jedna událost `xpGained`, která přijde **dřív**, než kontext cokoli
   zařadí. Proto: sběrač v `AchievementContext` posbírá události `achievementUnlocked` téhož okamžiku do
   jedné dávky a na ni použije pravidlo `momentFor`: je-li v dávce epic nebo legendary → jedno velké okno
   pro nejvzácnější, ostatní uvnitř („Also unlocked“) a jedno XP za všechny; jinak jedno tiché oznámení.
   **Zachovej filtr úvodu** (během úvodu se oslavují jen `first-habit` a `first-goal`) a událost
   `achievementCelebrationClosed` – čeká na ni brána úvodu (`tutorialAchievementGate`).
2. **Tiché oznámení není okno.** Ukáže se jen když žádné okno není otevřené; čekající tichá oznámení se
   slučují; to, co je na obrazovce, se nikdy nemění. Ťuknutí otevře Síň trofejí.
3. Velké okno = `View` ve vrstvě oken, řízené frontou. **Pořadí a priority fronty se nemění.** Nejdřív
   vyvez řadicí funkci z `ModalQueueContext.tsx` a napoj na ni `modalQueueOrdering.test.ts` (dnes testuje
   kopii) – teprve pak sahej na frontu; test musí zůstat zelený se stejnými očekáváními.
3a. Výstup fronty (dnešní `ModalRenderer`) přesuň z `ModalQueueProvider` do vrstvy 4 v `LayoutContent`.
4. XP za trofej je přidržené u momentu a letí z tlačítka „Continue“ / z odcházejícího oznámení (E7).
4a. **Tiché oznámení s akcí** (`LabNote.action`, kolo 44): pilulka s tlačítkem, drží déle
   (`ACTION_HOLD_MS`); ťuknutí na oznámení provede akci, ťuknutí na odznak ho jen pustí; mizející oznámení
   už akci neprovede (pojistka proti dvojímu ťuknutí). Použije ho E9 (násobič připraven).
4c. **Kombo trofejí (L-11):** když trofej dávky spustí kombo (`checkAndActivateAchievementCombo` v
   `achievementService.ts`), moment dávky nese `boost` (`MomentBoost`: faktor a hodiny z `boostOf`) – štítek
   v tiché pilulce / řádek ve velkém okně. Okno `multiplier_activation` se pro kombo **neřadí**.
4b. Sběrač dávky předá dávku i E10: když XP dávky otevře novou kapitolu (`chapterOfAction`), dávka se
   nezobrazí jako okno trofeje, ale jako okno kapitoly s trofejemi uvnitř (E10).
5. Vzácnost: **dnešní katalog** (nový přijde až ve vydání C). Počítej s tím, že velkých oken bude do té
   doby víc, než ukazují scénáře laboratoře.

**Nesmí se rozbít:** odemykání trofejí a jejich XP (`achievementService`), sbírky, pravidlo „hlas jen to,
co dorazilo“ (`Gamification-Core.md`).
**Ochrana proti zamrzání (Petr 2026-11-22: „nerad bych, aby zase docházelo k zamrzání“):** dřívější
zamrzání mělo jednu příčinu – **dvě nativní okna přes sebe** (RN `<Modal>` + systémový dialog nebo druhý
RN `<Modal>`, viz `Startup-Orchestrator.md` a `Tutorial.md`). Nový návrh tu příčinu odstraňuje u kořene:
v nových obrazovkách není **žádný RN `<Modal>`** – okna, sheety i oznámení jsou `View` ve vrstvách 6.0,
které se s nativním dialogem (ATT, souhlas, oprávnění, reklama) nemohou „poprat“. Fronta dál pouští
**jedno okno najednou** (priority beze změny, test na skutečnou řadicí funkci), tichá oznámení čekají, dokud
je okno otevřené, a čekající se slučují; přidržené XP má pojistku 2 s, nic nezůstane viset. Ověřit:
- **ráčna (E1):** v převedených souborech není import `Modal` z `react-native`;
- **zátěžový test fronty:** jedna akce + souběh událostí (3 trofeje s kombem, nová kapitola, milník výzvy,
  série deníku, oznámení násobiče) → na obrazovce vždy jen jedna věc, nic se neztratí, pořadí podle priorit,
  appka během toho reaguje na ťuknutí;
- **na zařízení:** moment ve chvíli, kdy je nahoře systémový dialog (oprávnění k oznámením) a reklama
  za odměnu – nic nezamrzne, moment počká nebo se ukáže pod dialogem a jde zavřít.
**Testy:** `momentFor`, `enqueueMoment` (přenést z laboratoře jako čisté funkce + testy: nikdy se neztratí,
neslučují se cizí druhy, hlava fronty se nemění); sběrač dávky; trofej během úvodu.
**Petr ověří navíc:** čistá instalace – úvod s první trofejí (okno jde zavřít a úvod pokračuje).
**Průvodci:** `Achievements.md` a `Gamification-UI.md` (priority a typy oken) ve stejném commitu.
**Petr ověří:** souběh 7. a 30. dne, legendární trofej + nová úroveň, tři běžné trofeje naráz.

---

### E9 – Panel úrovně a přehled úrovní (R-31)

**Zdroj:** `levelPanel.tsx`, `levelPanelLogic.ts`, `LevelsOverviewConcept.tsx`, `levelsJourney.ts`.
**Cíl:** vrstva odznaku; `src/screens/levels/LevelsOverviewScreen.tsx` (trasa `/levels-overview` zůstává).

| Laboratoř | Ostrá appka |
|---|---|
| `settledXp` | zobrazené XP z E7 |
| „Dnes“ | `GamificationService.getTodayXP()` (O-9) – stejná funkce jako čip na Home |
| `formatThousands`, `MOCK_COPY` | formátování čísel a texty z locales (7.1) |
| `useLabMultiplier()` (`multiplierMock.tsx`) | `XPMultiplierService.getActiveMultiplier()` + `calculateHarmonyStreak()`; tři stavy podle `multiplierStatus` (běží / připraven / sbírá se) – viz L-10 |
| odkaz „All levels“ | `router.push('/levels-overview')` |

1. Panel: jedna hodnota řídí celý přechod; zavírá se ťuknutím vedle, na kroužek, tlačítkem zpět, přepnutím
   záložky a tažením. Pravidla ťuknutí (`badgeTapAction`) a tažení **i s testy**.
2. Otevřít se smí jen na pěti záložkách, bez otevřeného sheetu/detailu a mimo moment (6.0). Reklamní pruh
   se nikdy neztmavuje ani nepřekrývá – ztmavení končí nad ním.
2a. Nápověda: téma `multiplier` (7.10; nový hostitel za `home.xpSystem`) jako tiché „i“ v řádku harmonie;
   ťuknutí nejdřív schová panel, pak otevře spodní okno nápovědy (vrstva 2a).
2b. **Násobič v panelu (L-10, `MultiplierPart` v `levelPanel.tsx`)**, tři stavy podle `multiplierStatus`:
   běží → faktor a zbývající čas; připraven → sedm dílků a jediné zlaté tlačítko „Zapnout 2× XP na 24 h“
   (`activateHarmonyMultiplier`, jen ve stavu „připraven“, pojistka proti dvojímu ťuknutí; panel se zavře
   a zařadí se okno zapnutí z E10); sbírá se → sedm dílků, dnešní tři (návyk / 3 záznamy deníku / krok cíle
   z `calculateHarmonyStreak().streakHistory[0]`), věta, co je den harmonie, a během ochranné lhůty „Další
   za N dní“ (`nextActivationDate`).
2c. **Oznámení „připraveno“ jednou na připravení:** `shouldAnnounceReady(status, klíč, uložený klíč)`; klíč =
   začátek série harmonie (`streakStartDate`), uložený v AsyncStorage (D-9). Tečka na odznaku a tlačítko
   v panelu zůstávají i po přehlédnutém oznámení (P73). Oznámení = tiché oznámení s akcí z E8.
2d. Odstranit `XpMultiplierSection` z Home (sekce `xpMultiplier`) i `MultiplierCountdownTimer` z horního
   řádku (E3) – jejich místo převzal odznak a panel. Soubory se mažou v E26. **Pozor:** `XpMultiplierSection`
   dnes poslouchá `xpMultiplierActivated` a řadí okno pro kombo a výzvu – s ní by oznámení zmizela; náhrada
   podle L-11 musí být hotová ve stejné etapě: kombo nese moment trofeje (E8 bod 4c), výzva řádek ve svém
   okně (E18), **návrat po neaktivitě**: `activateInactiveUserBoost` dnes žádnou událost neposílá – doplnit
   `xpMultiplierActivated` se zdrojem `inactive_user_return` a posluchač ve vrstvě odznaku zařadí tiché
   oznámení „Vítej zpět“ (25 XP letí z oznámení; bonus už je připsaný před zapnutím, O-16). Pravidla
   `boostOf` / `boostMoment` přenést s testem; 2× a 48 h návratu přesunout ze služby do `XP_MULTIPLIERS`.
3. Přehled úrovní: cesta se šesti kapitolami; milník jmenuje jen skutečnou trofej z katalogu
   (`CORE_ACHIEVEMENTS`, podmínka `level`), tajnou nikdy.

**Nesmí se rozbít:** výpočet úrovní (`levelCalculation.ts`), test `levelMilestonePromises.test.ts`,
aktivace a ochranné lhůty násobičů (`xpMultiplier.loyalty.test.ts`).
**Testy:** `levelPanelLogic`, `levelsJourney`, `multiplierLogic` přenést i s testy.
**Průvodci:** `Gamification-UI.md` (panel, značka na odznaku, oznámení připraveno), `Gamification-Core.md`
(klíč oznámení D-9).
**Petr ověří:** panel roste ze středu odznaku na iOS i Androidu, ostrost kroužku, tažení; násobič ve všech
třech stavech; zapnutí z panelu i z oznámení.

---

### E10 – Ostatní okna oslav  → brána B3

**Zdroj:** `goalParts.tsx` (`GoalDoneMoment`), `journalParts.tsx` (`MilestoneMoment`), `otherMoments.tsx`,
`momentRules.ts`. **Cíl:** `src/components/goals/GoalCompletionModal.tsx`,
`src/components/gratitude/CelebrationModal.tsx`, `src/components/gamification/MultiplierActivationModal.tsx`,
posluchač `levelUp` v `XpAnimationContext.tsx`, místa, která okna řadí (`app/(tabs)/journal.tsx` –
série a ⭐🔥👑; `GoalsScreen.tsx` – dokončení cíle).

| Dnešní okno (`ModalType`) | Nově |
|---|---|
| `goal_completion` | okno dokončeného cíle, XP po „Continue“ |
| `celebration_bonus_milestone` (⭐🔥👑) | jedno okno, XP po „Continue“ |
| `celebration_streak_milestone` | okno jen pro 7, 30, 100, 365, 1000 dní; ostatní délky tiché oznámení, které nese jen titulek (R-40). XP: `getJournalStreakReward()` – appka ho už vyplácí sama |
| `level_up` | okno „Nová kapitola“ **jen při vstupu do nového stupně** (`tierEntered`; úrovně 11/21/41/61/81). Jinak žádné okno (R-39). Potlačení během úvodu (`handleLevelUp`) zůstává. **Spojení s trofejemi (L-8):** když XP jedné akce (dávka z E8) otevře kapitolu (`chapterOfAction`), je jedno okno – kapitola s trofejemi uvnitř (`ChapterWindow` `also`, „Také odemčeno“), XP trofejí letí z jeho tlačítka; posluchač `levelUp` v `XpAnimationContext` si pamatuje kapitolu už ukázanou akcí a **tutéž kapitolu jednou přeskočí** (ne natrvalo) |
| `multiplier_activation` | okno zapnutého násobiče, čísla z `XP_MULTIPLIERS`; **žádná dlaždice bonusového XP** (O-10, O-16 – bonus neexistuje); spouští ho panel / oznámení z E9 |
| `celebration_daily_complete` | ruší se až v E12 (R-13) |
| výzvy a hvězdy | E18 |

**Nesmí se rozbít:** fronta (test), texty série (`journalStreakMilestones.ts` – laboratoř jen odřízne
emoji na konci), výplaty XP.
**Testy:** `momentRules` (vč. `chapterOfAction`) přenést i s testy.
**Průvodci:** `Gamification-UI.md` (okna, spojení kapitoly s trofejemi).
**Petr ověří:** každé okno jednou; trofej, která otevře kapitolu (jedno okno); **brána B3** – nic se neskládá přes sebe, jiskry z tlačítek doletí.

---

### E11 – Home (R-4b, R-6, R-31)

**Zdroj:** `HomeConcept.tsx`. **Cíl:** `app/(tabs)/index.tsx`, `src/components/home/*`,
`src/contexts/HomeCustomizationContext.tsx`, `src/types/homeCustomization.ts`.
**Závisí na:** L-2 a L-10 postavené a schválené; R-4b, R-6 potvrzené; D-3, D-11, D-12 (4.5).
(O-4, O-7, O-9 jsou rozhodnuté – viz 4.3.)

**E11 je velká – dělí se na pět posezení, každé = jeden commit a Petrova kontrola:**
E11a hook ohřátí série (5b) · E11b hrdina, pozdrav, kompaktní hlavička, rychlé akce, dnešní návyky (1, 2, 4,
6) · E11c karta série se záchranou (3, 5c) · E11d statistiky návyků (3a) · E11e Přehledy, Pro tebe,
přizpůsobení a převod uloženého rozložení (3b, 5, 5a).

| Laboratoř (kulisa) | Ostrá appka |
|---|---|
| `MOCK_HABITS`, `useLabToday` | `HabitsContext`, `useHabitsData` (dnešní návyky a jejich stav) |
| ~~`MOCK_STATS.streakDays` (čip série v hrdinovi)~~ | **čip zrušen** (Petr 2026-11-22, D-3): série deníku je na Home ve vlastní kartě (P60); v hrdinovi jen „+XP dnes“ |
| `xpToday` („+145 XP today“) | `GamificationService.getTodayXP()` (O-9); po každém zisku XP znovu načíst |
| `MOCK_STATS.week`, `weekTotal`, `copy.consistent(73)` | skutečná data týdne z `useHabitsData`; procento spočítat, ne opsat |
| `useLabJournal()` (série, ⭐🔥👑, dnešní záznamy) | `GratitudeContext` |
| `useLabChallenge()` | `MonthlyChallengeService` / `MonthlyProgressTracker` (karta výzvy přijde v plné podobě v E17; do té doby stávající data ve stávajících stavech) |
| `getDaypart`, pozdravy v `mockCopy` | token `getDaypart` + texty v locales (R-6) |

1. Hrdina dne (oblouk se sluncem) nahoře – pevně; pořadí ostatních sekcí zůstává uživatelovo.
2. Pozdrav podle denní doby (EN/DE/ES, bez jména).
3. Rychlé akce, dnešní návyky, série deníku (plamen: oheň / led / zahřátí podle `GratitudeContext`),
   výzva; ostatní sekce podle L-2.
3a. **Statistiky návyků** (`HabitStatsConcept.tsx`, `homeChartsLogic.ts` i s testem) nahrazují
   `HabitStatsDashboard`, `WeeklyHabitChart`, `Monthly30DayChart` a `YearlyHabitOverview`. **Počty za den
   ber přesně tak, jak je dnes počítají tyhle komponenty** (Smart Bonus Conversion, pokryté vynechané dny) –
   nový je jen způsob kreslení. Míra = všechna splnění včetně bonusů / plán (vzorec appky). Barvy grafu
   patří do tokenů jako paleta grafů. Rok kresli jedním plátnem.
3b. **Přehledy, Pro tebe a přizpůsobení** (`HomeSectionsConcept.tsx`, `homeLayoutLogic.ts` i s testem).
   Přehledy nahrazují `HabitPerformanceIndicators` + `HabitTrendAnalysis`: fakta ber ze stejných výpočtů
   jako ony, řádek ukaž jen tehdy, když jeho fakt existuje. Pro tebe nahrazuje `PersonalizedRecommendations`:
   `RecommendationEngine.generateRecommendations`, jedno doporučení naráz, tlačítko dělá akci doporučení,
   bez doporučení se karta neukáže. Sekci `streakHistory` (`StreakHistoryGraph`) z Home odeber – **graf
   30 dní přibude ve statistikách deníku až v E13**; mezi E11 a E13 není graf nikde, což ve větvi nevadí
   (vydání A jde ven až po E13). Soubor a `streakHistoryGraphLayout.ts` s testem se mažou v E26.
   Sheet nahrazuje `HomeCustomizationModal` nad `HomeCustomizationContext` (`toggleComponentVisibility`,
   `reorderComponents`, `resetToDefaults`). **Převod uloženého rozložení = jedno pravidlo uvnitř stávajícího
   `mergeHomeComponents`** (`src/utils/homeComponents.ts`) – žádný druhý filtr vedle něj:
   - viditelnost a sloučení sekcí podle `migrateHomeSections` (`xpProgressBar`, `xpMultiplier`,
     `streakHistory` pryč; `habitPerformance` + `habitTrends` → `insights`, vidět, když byla vidět aspoň
     jedna; `todayHabits` přibude za rychlé akce);
   - **pořadí:** jen když uživatel řadil (`hasCustomOrder`), zachovat jeho pořadí; jinak nové výchozí pořadí
     (dnešní chování `mergeHomeComponents`);
   - pole živého typu (`name`, `order`, `configurable`) dopočítat z nového výchozího seznamu;
   - test `homeComponents.test.ts` rozšiř o všechny případy z `homeLayoutLogic.test.ts` + oba stavy
     `hasCustomOrder`.
4. Kompaktní hlavička při rolování – posouvá se, nikdy se neprolíná.
5. **Karta Úroveň na Home není** (R-31) – sekce `xpProgressBar` zmizí převodem z bodu 3b.
5a. Horní řádek Home: konečné místo pro vstup do Síně trofejí (R-22 „vstup z Home“) a tlačítko přizpůsobení,
   které otevře nový sheet. **Ukazatel násobiče tu není** – je na odznaku (E7, E9; O-4).
5b. **Ohřátí série vytáhni do sdíleného hooku** (dnes je celé v `src/components/home/GratitudeStreakCard.tsx`:
   reklama, platba bonusovými záznamy, „Začít znovu“, okna úspěchu a chyby). Chování se v této etapě nemění,
   jen se logika přestěhuje, aby ji v E12 mohl použít i Deník. Bez toho bys při přestavbě karty logiku
   buď rozbil, nebo zdvojil.
5c. **Zamrzlá série se zachraňuje přímo na Home** (laboratoř kolo 43, Petr 2026-11-21: „uživatel si toho
   hned všimne a je tam tlačítko pro reklamu“). Karta série při zamrznutí zledovatí (barvy ledu jako v Deníku),
   ukáže zprávu `journal.warmUp.frozenMessage`, dny dluhu (vločka → slunce po zaplacení), hlavní tlačítko
   „Zahřát (x/y)“ a tiché „Začít znovu“ s potvrzením – **stejná komponenta jako karta v Deníku**
   (`WarmUpControls` v `journalParts.tsx`), nad hookem z bodu 5b. Zápis záznamu je v tu chvíli skrytý
   (zamčený jako v Deníku). Home i Deník čtou jeden stav z `GratitudeContext` – zaplacený den na Home je
   hned vidět v Deníku a naopak. Animaci zahřátí přehrává jen plamen na viditelné obrazovce (jeden úspěšný
   hmatový signál, ne dva).
6. Počet hotových návyků jen v hrdinovi a v kompaktní hlavičce (P60).
7. **Plynulost (kolo 52, P79):** povzbuzující věta hrdiny má pevně vyhrazené dva řádky (`minHeight` podle
   `titleSm` × velikost písma, `numberOfLines={2}`), aby změna věty po posledním návyku nezměnila výšku
   hrdiny; plamen na kartě série dostává `rest` z `useScrollRest` (pozastaví se při posunu).
8. `Alert.alert` z `HomeCustomizationModal` (7.9) zaniká spolu s oknem – chyby uložení jako `ProblemNote`,
   „Obnovit výchozí“ bez potvrzení. `WarmUpErrorModal` (chyba zahřátí) → `ProblemNote` (D-11).

**Nesmí se rozbít:** přizpůsobení Home (pořadí, viditelnost, událost `openHomeCustomization`), rychlé akce
(`?quickAction=…` musí dál otevřít správné okno v cílové záložce), parametr `?openDebtModal=true` (do E12),
nápověda podle 7.10 (`home.quickActions` a `home.recommendations` zanikají), pulz úvodu, pokud úvod
skončí na Home.
**Testy:** `homeChartsLogic`, `homeLayoutLogic` přenést i s testy; rozšířený `homeComponents.test.ts`.
**Průvodci:** `Gamification-UI.md` (karta úrovně), **nový `technical-guides:Home.md`** (D-12; sekce, převod
rozložení, záchrana série, pravidla plynulosti).
**Petr ověří:** rolování bez zadrhnutí, slunce se zastaví mimo obrazovku, uživatel s vlastním pořadím sekcí.
**Pasti:** P1–P5, P39, P44, P51 (text přes barevné pozadí), P60.

---

### E12 – Deník (R-13, R-14)

**Zdroj:** `JournalConcept.tsx`, `journalParts.tsx`. **Cíl:** `app/(tabs)/journal.tsx`,
`src/components/gratitude/{GratitudeInput,EditGratitudeModal,GratitudeList,DailyGratitudeProgress,DailyMotivationalQuote,StreakWarmUpModal,WarmUpModals}.tsx`.

1. Pořadí obrazovky podle průvodce: citát dne vždy nad dnešními záznamy; prázdný stav vysvětluje, co psát (P33).
2. Psaní i úprava = jeden sheet nad klávesnicí. XP záznamu dál dělá úložiště; obrazovka jen ukáže let
   z tlačítka „Přidat“.
3. **R-13:** třetí záznam dne = oslava na místě (zezelenání, jedno rozzáření, haptika, série naskočí).
   Okno `celebration_daily_complete` se přestane řadit.
4. **R-14:** zmrzlá série zamkne dlaždice **dřív, než uživatel začne psát**; ohřátí (reklamy / Začít znovu)
   je přímo v Deníku – přes sdílený hook z E11 (bod 5b), žádná kopie logiky. Přesměrování na Home
   (`GratitudeInput` → `?openDebtModal=true` → posluchač v `app/(tabs)/index.tsx`) pak zruš na obou koncích.
   **Pojistka v ukládání (Debt Gate) zůstává beze změny.**
4a. R-13 úplně: odstranit zařazení okna v `app/(tabs)/journal.tsx`, větev `daily_complete` v okně, typ
   `celebration_daily_complete` z `ModalType` a zmínky v průvodcích.
4b. Reklamní pruh se schová, když je klávesnice nahoře (dnes to `journal.tsx` dělá – zachovat, P30).
4c. Tlačítka Historie a Statistiky jsou jen vpravo nahoře; stejná tlačítka na konci stránky odstraň (P35).
5. Série: stav plamene z `GratitudeContext` – led = zmrzlá série, zahřátí = zaplacený dluh / Start Fresh.
   Plamen dostává `rest` z `useScrollRest` (P79).
6. Nápověda: témata `journalDay` (u „Dnes“) a `frozen` (u zamrzlé série) podle 7.10.
7. Ikony ⭐🔥👑 jen přes `SignatureIcon` / `InlineIcon` (E2); texty v locales, které nesou emoji, přepsat tak,
   aby ikonu vložila komponenta (vzor: `toNextMilestone` v laboratoři).
8. `Alert.alert` v `EditGratitudeModal.tsx:52` (s chybným textem exportu) a `ErrorModal` v
   `GratitudeInput.tsx:269` → `ProblemNote` (7.9); sheet úpravy při chybě zůstane otevřený s textem.

**Nesmí se rozbít:** číslování záznamů, vratka XP při smazání, dluh a jeho splácení, reklamy za odměnu
(`AdMob.md`), odměna za sérii, parametry `?quickAction=addGratitude|addSelfPraise`, nápověda
(`journal.debtRecovery`).
**Průvodci:** `My-Journal.md` (priority oken, zámek, pořadí obrazovky).
**Petr ověří:** zmrzlá série od začátku do ohřátí; třetí záznam; smazání záznamu.

---

### E13 – Historie a statistiky deníku (R-15)

**Zdroj:** `JournalHistoryConcept.tsx`, `JournalStatsConcept.tsx`. **Cíl:** `app/journal-history.tsx`,
`app/journal-stats.tsx`, `src/components/gratitude/StatisticsCard.tsx`.

1. Historie jako měsíční kalendář (stav dne tvarem, stuha série, ❄ dny z plateb ohřátí), panel dne,
   hledání se zvýrazněním. Výsledky hledání ve `FlatList`.
2. Statistiky: série, čtyři čísla, graf posledních 30 dní, poměr typů, ⭐🔥👑.
3. Klíč `journal.stats.daysWithEntries` je od 2026-11-10 opravený (`_one`/`_other`, hlídá
   `pluralFormat.test.ts`) – jen ověřit vykreslený text testem (P29).
3a. **Graf 30 dní** (stejný, jaký zmizel z Home v E11) – tady se objeví.
3b. `Alert.alert` v `app/journal-history.tsx:57, 114` → `ProblemNote` (7.9).
4. Barvy grafu jsou vlastní ověřená paleta v tokenech (P32).

**Nesmí se rozbít:** hledání, data historie.
**Petr ověří:** kalendář s dny z plateb ohřátí, hledání, graf 30 dní, ikony ⭐🔥👑.
**Průvodci:** `My-Journal.md` (historie, statistiky).
**Testy:** vykreslené texty statistik (volat `t()` s parametry, ve výsledku nesmí být `{`, `}` ani název klíče).

---

### E14 – Cíle: seznam, karta s tempem, rychlý zápis (R-17, R-18)

**Zdroj:** `GoalsConcept.tsx`, `goalParts.tsx` (`GoalCard`, `GoalTrack`, `PaceChip`, `LogSheet`, `UndoToast`,
`GoalActionsSheet`). **Cíl:** `src/screens/goals/GoalsScreen.tsx`,
`src/components/goals/{GoalItem,GoalListWithDragAndDrop,GoalList,ProgressModal,ProgressEntryForm}.tsx`.

| Laboratoř | Ostrá appka |
|---|---|
| `goalsMock`, `useLabGoals` | `GoalsContext`, `useGoalsData` |
| tempo v `goalParts.tsx` | **jedna** funkce v `src/utils/goalCalculations.ts` (přímka start → termín proti skutečnosti); kartu, detail i přehled jen krmí (P37) |
| rychlý zápis | `addProgress` se všemi pravidly XP (denní strop 3 zápisy na cíl aj.) |
| „Zpět“ | smazání právě vytvořeného zápisu stávající cestou |

1. Karta: pruh se zářezy milníků a ryskou plánu, čip tempa („v plánu / o 6 dní napřed / o 10 dní pozadu“ –
   „pozadu“ teplou barvou, ne červenou), čára termínů, sekce Splněné.
2. Zápis jedním ťuknutím + „Zpět“ místo potvrzovacího okna; „Jiné“ otevře panel s vlastním polem.
3. Čtyři ikony na kartě → nabídka „⋯“; šablony do okna tvorby. (`nativeID="add-goal-button"` je pozůstatek, nic ho nečte – nepřenášet.)
4. Řazení dál přes `ReorderableList`.
5. **Rychlý zápis musí udělat všechno, co dnes dělá formulář** (`GoalsScreen.handleSubmitProgress`): po
   `addProgress` znovu načíst cíl, při dokončení zařadit okno `goal_completion` a zapsat značku
   `goal_completion_celebrations_shown`. Jinak se cíl dokončený jedním ťuknutím nikdy neoslaví.
6. Laboratoř po zápisu ukazuje „+35 XP“, dosažené milníky a text „dnes už bez XP“. **`addProgress` tohle
   nevrací** (vrací jen zápis). Zastav se a domluv s Petrem jednu z cest: (a) rozšířit návratovou hodnotu
   úložiště, (b) odvodit z událostí `xpGained` podle `sourceId`. Nic z toho neodhaduj v obrazovce (P49).
7. „Zpět“ u zápisu, který cíl dokončil: úložiště vrátí XP za dokončení, milníky zůstávají vyplacené –
   text toho, co se vrací, musí odpovídat.

**Nesmí se rozbít:** XP za zápis, milníky 25/50/75 %, dokončení a jeho vrácení při odečtení pod cíl
(`sqliteGoalStorage.progressXP.test.ts`), denní strop zápisů, parametr `?quickAction=addGoal`.
(Nápověda `goals.overview` zaniká – 7.10.) Rozhodnutí D-4 před bodem 6.
**Testy:** funkce tempa (napřed / v plánu / pozadu / bez termínu / po termínu) s negativní zkouškou.
**Průvodci:** `Goals.md` (tempo, rychlý zápis).
**Petr ověří:** zápis a Zpět, dokončení cíle ze zápisu, němčina na kartě.
**Pasti:** P36–P44.

---

### E15 – Cíle: tvorba a úprava, detail (R-19)

**Zdroj:** `GoalComposerConcept.tsx`, `GoalDetailConcept.tsx`. **Cíl:**
`src/components/goals/{GoalModal,GoalForm,TargetDateStepSelectionModal,TargetDateConfirmationModal,GoalTemplatesModal}.tsx`,
`app/goal-stats.tsx`, `src/screens/goals/GoalStatsScreen.tsx`,
`src/components/goals/{GoalStatsCard,ProgressTrendAnalysis,GoalCompletionPredictions,ProgressHistoryList,GoalPerformanceDashboard}.tsx`.
**Závisí na:** L-9 (tažení detailu cíle).

1. Tvorba i úprava = jedno okno s živým náhledem; nápady („Začni z nápadu“) uvnitř okna přes
   `useGoalTemplates()`; termín předvolbami (1 / 3 / 6 měsíců, konec roku, bez termínu) + kalendář v okně.
2. Validace sdílet s `GoalForm` (strop `MAX_GOAL_VALUE` už platí).
3. Detail (trasa `goal-stats`): kruh, fakta tempa, graf „Ty a plán“, milníky, historie. Záložky Trendy
   a Předpovědi s pěti metodami zanikají – tempo je jedna funkce z E14. Jeden cíl = jeden graf (P38).

**Nesmí se rozbít:** úprava existujícího cíle, historie zápisů a jejich mazání, trasa `/goal-stats?goalId=`.
**Pozor:** nápověda `goals.predictions` žije v `GoalCompletionPredictions`, která zaniká – nové téma `pace`
(7.10) jako tiché „i“ u čipu tempa v detailu. Graf používá ověřenou paletu (P32, P38).
**Průvodci:** `Goals.md` – kapitolu „Target Date Step-by-Step Selection Modal“ přepsat.

---

### E16 – Cíle: druh „Messen“ (R-16) – ZMĚNA DAT

**Zastav se před prvním řádkem kódu:** napiš Petrovi plán migrace a počkej na schválení.

1. Data: cíl dostane **druh** („Hochzählen“ = přičítá se / „Messen“ = zapisuje se naměřená hodnota)
   a **počáteční hodnotu**. Všechny stávající cíle = „Hochzählen“, start 0.
2. Migrace databáze + záloha a obnova (starší zálohy musí jít načíst) + marketingová demo data.
3. Výpočty pokroku a tempa pro směr dolů (84,6 → 78 kg); u „Messen“ smí být cíl i start 0 (dluh → 0).
   Dnes všechno počítá s „aktuální / cílová ≥ 1“ a startem 0 – projdi a oprav **všechna** tato místa
   v `src/services/storage/SQLiteGoalStorage.ts`: `addProgress` (dokončení, milníky, vrácení dokončení),
   `updateGoalValue`, `recalculateGoalValue`, `calculateTimelineStatus`; a funkci tempa z E14.
3a. **Bonus za „velký cíl“ nově podle úsilí (O-8):** cíl, na kterém uživatel pracoval aspoň 30 dní
   (od založení do dokončení) a má aspoň 10 zápisů pokroku, dostane 350 XP místo 250. Dnešní pravidlo
   „cíl ≥ 10 000“ je na třech místech `SQLiteGoalStorage.ts` (výplata při dokončení, vrácení při zrušení
   dokončení, statistika velkých cílů). **Pozor na vrácení:** počet zápisů se může mezi dokončením
   a zrušením změnit, takže vrácení nesmí částku počítat znovu – musí vrátit přesně to, co bylo vyplaceno
   (dohledat transakci dokončení tohoto cíle, nebo si vyplacenou částku u cíle uložit). Test: dokončit →
   smazat zápisy → zrušit dokončení → součet XP sedí.
4. Okno tvorby: volba druhu; rychlý zápis u „Messen“ = dnešní hodnota.
5. `Goals.md` přepsat ve stejném commitu.

**Testy:** migrace nad daty staré verze, výpočet pokroku oběma směry, nula jako cíl, dokončení a jeho
vrácení u „Messen“, milníky u směru dolů; XP pravidla u „Hochzählen“ beze změny.
**Petr ověří:** stávající cíle po aktualizaci beze změny; nový cíl na hubnutí.

---

### E17 – Měsíční výzva: detail (R-36)

**Zdroj:** `ChallengeDetailConcept.tsx`, `challengeLogic.ts`. **Cíl:**
`src/components/challenges/{MonthlyChallengeSection,MonthlyChallengeCard,MonthlyChallengeDetailModal,MonthlyProgressCalendar}.tsx`.
**Závisí na:** L-7 (stavy karty).

| Laboratoř | Ostrá appka |
|---|---|
| `challengeMock` | `MonthlyChallengeService` (výzva), `MonthlyProgressTracker` (průběh, denní snímky), `StarRatingService` (hvězdy po kategoriích) |
| texty šablon | `src/services/challengeDisplayText.ts` (aktuální jazyk) |
| `challengeReward`, `streakBonusShare` | `challenge.baseXPReward`, `monthStreakBonusShare` + `MonthlyChallengeService.getCompletedMonthsInRowBefore` |
| `challengePace` | **nová** funkce vedle trackeru; u klíčů typu „dny s…“ zná denní strop (stav „mimo dosah“) |
| kalendář z prvního požadavku | ostrý kalendář sčítá **všechny** požadavky a má zvláštní klíče – to zachovat |

1. Jedna stránka rostoucí z karty: kruh, věta o tempu, požadavky, milníky 25/50/75 s XP, kalendář ve čtyřech
   odstínech bez procent, odměna, hvězdy podle kategorií.
2. Živá aktualizace přes `monthly_progress_updated` (jinak „mrtvé okno“ – viz průvodce).
3. Nikdy neukazovat baseline, násobiče škálování ani „bonusy“ šablon; nikdy neslibovat „příští měsíc N hvězd“
   (hvězdy patří kategorii a další výzva bývá z jiné).
4. **Stavy karty na Home (L-7, `ChallengeCardStates.tsx`):** stav z `challengeCardState({hasChallenge, loading,
   failed})` – **známá data vždy vyhrají**: `MonthlyChallengeSection.loadMonthlyChallenge` dnes nastaví
   `loading` při každém obnovení a schová kartu → při obnovení se už známá výzva neschovává a neúspěšné
   obnovení ji nepřepíše chybou. Kostra až po `SKELETON_DELAY_MS` (250 ms), bez třpytu; „na cestě“ se
   změní samo po události `monthly_challenge_challenge_generated` (už se poslouchá); chyba jednou větou
   s jedním „Zkusit znovu“ = `loadMonthlyChallenge()`, **nikdy `⚠️ {error}`**. Nové texty nahradí
   `monthlyChallenge.preparing`, `noActiveChallenge`, `errorLoading` (emoji, německé useknuté tvary).
   Výzva po čekání se objeví prolnutím.
5. Konstanty, které laboratoř drží jako kopie (`KEEP_LEVEL_SHARE`, `CHALLENGE_MILESTONES`), **vyvézt ze služeb
   appky** (`starRatingService` – 70 %, `monthlyProgressTracker` – XP milníků) a obrazovky, testy i stránku
   pravidel (E22) napojit na ně.
6. Nápověda: téma `stars` (7.10) jako tiché „i“ u nadpisu hvězd v detailu.

**Nesmí se rozbít:** sledování průběhu, všech 14 šablon, zahřívací výzvy.
**Testy:** `challengeLogic` přenést i s testy (porovnávají se s konstantami appky), vč. `challengeCardState`.
**Průvodci:** `Monthly-Challenges.md` (detail, tempo, stavy karty; smazat texty „bonusů“ šablon z locales).
**Petr ověří:** detail výzvy; karta při načítání, „na cestě“ a chybě (vyvolat laděním).

---

### E18 – Měsíční výzva: momenty (R-37, R-38)

**Zdroj:** `challengeMoments.tsx`. **Cíl:** `src/components/challenges/{MonthlyChallengeMilestoneModal,MonthlyChallengeCompletionModal,MonthlyChallengeFailureModal,StarLevelChangeModal}.tsx`,
posluchače v `MonthlyChallengeSection.tsx`, `ModalQueueContext.tsx`.
**Závisí na:** L-8.

0. Okno `multiplier_activation` se pro výzvu neřadí – 1,5× je řádek v okně „Výzva splněna“ (L-11, bod 4).
1. Milník 25/50/75 % = tiché oznámení. Víc milníků jedním zápisem (`milestonesCrossed(před, po)`) = **jedno**
   oznámení se součtem XP – události `monthly_milestone_reached` téhož zápisu se skládají.
2. Splnění = jedno okno; událost `star_level_changed` téhož měsíce se **vloží do něj** místo vlastního okna.
3. Konec měsíce bez splnění = jedno klidné okno; odložené sesazení (`pending_star_demotion`) se vloží do něj.
4. Řádek o násobiči 1,5× jen když ho appka opravdu zapnula (ne u zahřívací výzvy, ne při běžícím jiném
   násobiči nebo ochranné lhůtě). Bonusové XP za zapnutí se neukazuje – neexistuje (O-16).
5. **Snížení hvězd po třetí zahřívací výzvě (L-8, `warmUpStepDown`):** klidný řádek ve stejném okně „Výzva
   splněna“ (resp. v okně konce měsíce) – šipka dolů, měkké varování, „další budou sedět líp“. Událost
   `star_level_changed` s důvodem `warmup_penalty` (`starRatingService.ts`) **neřadí vlastní okno**.
   Text `monthlyChallenge.starChange.reason.warmupPenalty` se smaže (v E26).

**Nesmí se rozbít:** uzavření měsíce (`monthlyChallengeLifecycle.closure.test.ts`), hvězdy, série měsíců,
priority fronty.
**Testy:** `milestonesCrossed`, `warmUpStepDown` (v `challengeLogic.test.ts`) přenést.
**Průvodci:** `Monthly-Challenges.md`, `Gamification-UI.md`.
**Petr ověří:** všechny tři momenty, dva milníky jedním zápisem, třetí zahřívací výzvu; přelom měsíce podle D-6.

---

### E19 – Síň trofejí (R-22)

**Zdroj:** `TrophyRoomConcept.tsx`. **Cíl:** `app/achievements.tsx`, `src/components/achievements/*`.

1. Jedna místnost místo dvou záložek: počet + vzácnosti, Nedávné, Blíží se, Sbírky (klepnutí otevře sadu),
   Věrnostní cesta, zeď všech trofejí s hledáním a filtry, list trofeje. Celkový počet ber z délky katalogu
   (`CORE_ACHIEVEMENTS.length`), nikdy číslem – dnes je jich 75, po vydání C 51.
2. Zeď = `FlatList` bez animace na položku; filtry jako **prvek** v `ListHeaderComponent` (ne funkce – jinak
   hledání ztratí fokus). Tajné trofeje skryté i v hledání, včetně popisu (P50).
3. Stav z `AchievementStorage` / `AchievementService`, průběh hromadně (`batchUserStats`), ne po kartách.
4. Pryč: statistické tabulky (`TrophyRoomStats`) a Spotlight rotující po 30 s (`AchievementSpotlight`).
5. Mapa dnešních dílů: `AchievementHistory` → Nedávné; `AchievementGrid`, `AchievementCard`, `CategorySection`,
   `AchievementFilters` → zeď s filtry; `AchievementDetailModal` → list trofeje (sheet); `TrophyCollectionCard3D`,
   `TrophyCombinations` → Sbírky; `LoyaltyProgressCard` → Věrnostní cesta; `AchievementTooltip` → zaniká.

**Nesmí se rozbít:** sbírky a jejich bonus (už fungují), sdílení trofeje, pokud existuje.
**Průvodci:** `Achievements.md`.
**Petr ověří:** zeď s hledáním a filtry na slabším Androidu, sbírka, tajné trofeje skryté.

---

### E20 – Nastavení (R-23)

**Zdroj:** `SettingsConcept.tsx`. **Cíl:** `app/(tabs)/settings.tsx`, `src/components/settings/NotificationSettings.tsx`.

1. Karta „Ty“, náhledy vzhledu místo tří přepínačů, jazyk jedním řádkem, čas připomínky u přepínače, verze dole.
   **Všechny dnešní řádky musí zůstat:** vypínač haptiky, zásady ochrany soukromí (prohlížeč v appce se
   záložní cestou), „Jak SelfRise funguje“, reset tutoriálu s potvrzením, pruh „oznámení vypnutá“. Než
   začneš, vypiš si řádky z dnešního `settings.tsx` a u každého zapiš, kde je v novém návrhu; co v laboratoři
   chybí → zastavit. **Nový řádek „Zvuky“** pod vypínačem haptiky (L-6, vypínač z E2).
1a. `NotificationSettings.tsx` – všech 8 `Alert.alert` podle 7.9 (`ProblemNote`, oprávnění = `ConfirmSheet`);
   při neúspěchu se přepínač / čas vrátí do původního stavu.
2. Logika beze změny: `ThemeContext`, jazyk, `notificationService` **včetně pruhu „oznámení vypnutá“**,
   reset tutoriálu; „Privacy Settings“ jen když `isPrivacyOptionsRequired()`; vývojářské řádky jen ve vývoji
   (včetně vstupu do laboratoře).

**Nesmí se rozbít:** připomínky, souhlas s reklamami, přepnutí jazyka za běhu.
**Petr ověří:** všechny řádky, zvuky vypnout/zapnout, odepřené oprávnění k oznámením.
**Průvodci:** `Notifications.md` (okna chyb), `Design-System.md` (vypínač zvuků).

---

### E21 – Úvod (R-24 až R-27)

**Zdroj:** `OnboardingConcept.tsx`. **Cíl:** `src/components/onboarding/*`,
`src/components/tutorial/OnboardingPreferencesModal.tsx`, `src/contexts/TutorialContext.tsx`,
`src/utils/tutorialAchievementGate.ts`, `src/components/onboarding/createWithTrophyGate.ts`, filtr úvodu
v `src/contexts/AchievementContext.tsx`, události trychtýře (`firstDayEvents` ve `src/services/analytics/`).

**Nejdřív průvodce, potom kód:** `Tutorial.md` upravit a nechat schválit – mění se pravidlo 3 (trofeje až na
závěru) a „Přeskočit“ platí jen pro krok; tok bez návyku nemá krok odškrtnutí.

1. Uvítání jako první krok, jazyk a vzhled předvybrané podle zařízení (dva tiché štítky pod tlačítkem).
2. Východ slunce napříč kroky, „Tvůj první den“ s políčky, dlaždice s živým náhledem, krok vděčnosti před
   odškrtnutím, závěr jako vrchol, dotaz na připomínky úplně nakonec.
3. Vděčnost se ukládá skutečným `createGratitude`.
4. Události trychtýře: `onb_language` / `onb_theme` se pošlou s výchozí hodnotou, `onb_notifications` se
   přesouvá, vděčnost je nová (`firstDayEvents.ts` + `Analytics.md`).
5. Systémové okno připomínek jen nad prázdnou obrazovkou (`Startup-Orchestrator.md`).
6. `OnboardingPreferencesModal` je dnes RN `<Modal>` (výjimka v `Tutorial.md`, pravidlo 1) – v novém úvodu
   je to obyčejná vrstva; výjimku z průvodce odstraň.
7. Trofeje se ukazují až v závěru úvodu (R-27): brána trofejí a filtr v `AchievementContext` se tomu
   přizpůsobí a okna trofejí se během úvodu už neřadí.

**Nesmí se rozbít:** žádný RN `<Modal>`, klíče úložiště beze změny, strop a validace z `goalDraft`,
brána trofejí (`createWithTrophyGate`), `onboardingFlow.test.ts`.
**Testy navíc:** vypsat texty **všech** závěrů úvodu (s návykem, bez návyku, s cílem, bez cíle, s vděčností,
bez ní) a přečíst je – přeskočitelný krok nesmí nechat větu, která tvrdí, že se stal (P53).
**Petr ověří:** čistá instalace na iOS i Androidu, obě větve (s návykem / „později“), trychtýř v Analytics.

---

### E22 – Zbylé obrazovky a okna

**Závisí na:** L-3, L-4; D-10. **Zdroj:** `HowItWorksConcept.tsx`, `labHelp.tsx`, `systemScreens.tsx`.
**Cíl:** `src/screens/help/HowItWorksScreen.tsx`, `app/how-it-works.tsx`, `app/+not-found.tsx`,
`DatabaseErrorScreen` v `app/_layout.tsx`, `src/components/common/{ConfirmationModal,ErrorModal,BaseModal,HelpTooltip}.tsx`,
`src/constants/helpTopics.ts`, `src/locales/__tests__/helpTooltipKeys.test.ts`.

1. **„Jak SelfRise funguje“ (L-3):** sedm oddílů skrytých mechanik; každé číslo jako interpolace z konstanty
   appky (`XP_REWARDS`, `XP_MULTIPLIERS`, `ACHIEVEMENT_XP_REWARDS`, `JOURNAL_STREAK_REWARDS`,
   `MAX_GOAL_TRANSACTIONS_PER_DAY` z `xpLimits.ts`, konstanty výzvy vyvezené v E17). Konstanty, které drží
   jen stránka laboratoře (`WARM_UP_ACTIVE_DAYS`, `MAX_DEBT_DAYS`), přesuň do `src/constants` a napoj na
   místa, kde appka to pravidlo opravdu počítá (zastavit, pokud se čísla liší). Čtyři tiché obrázky skryté
   pro čtečku. Parametr `?section=` otevře stránku na oddílu (D-10); vstupy: Nastavení, konec úvodu
   (`FirstCheckCard.tsx`), „Všechna pravidla“ z nápovědy.
2. **Nápověda (L-4):** `HelpTooltip` → tiché „i“ + spodní okno ve vrstvě 2a podle tabulky 7.10 – témata
   vložená už v E6, E9, E12, E15, E17 tady jen zkontroluj, zbylé zapoj. **Texty `help.*` = texty stránky
   pravidel** (jeden zdroj; dnešní věcně chybné texty se přepíší). Test `helpTooltipKeys.test.ts` a stráž
   `HOW_IT_WORKS_SECTIONS` přepsat na nová témata; průvodce `Help-Tooltips.md` ve stejném commitu.
3. **Chyby (kolo 49):** `ProblemNote` (vrstva 2b) nahradí `ErrorModal` ve všech místech, která zbyla
   (`HabitsScreen`, `GoalsScreen`, `GoalStatsScreen`, `HabitForm`, `GoalForm`, `ProgressEntryForm`,
   `TargetDateStepSelectionModal`; `GratitudeInput` už v E12) – text podle akce, **nikdy `error.message`**
   (jde dál do logu a Crashlytics); formulář při neúspěchu zůstane otevřený. Stráž: v `src/` ani `app/` není
   `Alert.alert` (kromě `__tests__`) – poslední místa zmizela v E11–E20, tady stráž přidej.
4. **„Nenalezeno“:** klidná stránka, jediné tlačítko „Zpět na dnešek“ = `router.replace('/(tabs)')`.
5. **Chyba databáze:** kreslí se **před** `RootProvider` – nemá kontext vzhledu; barvy z `useColorScheme()`
   a tokenů napřímo; texty `errors.database.*` zůstávají; stav „Zkouším znovu…“.
6. Stavový řádek na zbylých obrazovkách karet podle režimu.

**Petr ověří:** stránka pravidel (i z nápovědy na oddílu), každé „i“, pruh chyby (vyvolat laděním),
„nenalezeno“.

---

### E23 – Spuštění appky: opona (R-9)

**Zdroj:** `introTimeline.tsx` (`LaunchCurtain`, časová osa `launch`). **Cíl:** `app/_layout.tsx`.

Podmínky (všechny): celé spuštění jen při prvním otevření dne ze studeného startu; jinak náběh pod 1 s;
návrat z pozadí nic; ťuknutí přeskočí; snížený pohyb = hotová obrazovka; první snímek opony je pixelově
stejný jako nativní splash; **nesmí se potkat s ATT, souhlasem ani úvodem** (`Startup-Orchestrator.md`);
nikdy neprodlouží čekání na data.

Co dnes chybí a musí vzniknout: (a) `RootLayout` při načítání fontů a databáze vrací prázdno – opona to
místo převezme; (b) v kódu není `SplashScreen.preventAutoHideAsync()` ani `hideAsync()`; (c) nový klíč
úložiště „dnes už opona byla“; (d) výslovná výjimka ve `Startup-Orchestrator.md`: start čeká na doběhnutí
opony (dnes průvodce říká, že každé startovní UI je až za `awaitStartupComplete()`).

**Nesmí se rozbít:** startovní posloupnost (`src/services/startup/__tests__/*`).

---

### E24 – Vlastní ikony (R-34) — přesunuto do E1–E3

Písmo ikon nepotřebuje nativní build (P78), proto se staví hned na začátku, aby žádná etapa nekreslila
emoji a pak se nepředělávala: písmo v E1, komponenty v E2 (bod 4a), ikony lišty v E3. Tady jen kontrola:
v `src/` a `app/` se nikde nekreslí ⭐🔥👑🏆 jako emoji (stráž v testech).

### E25 – Zvuk a hmat (R-35) — přesunuto do E2 a E20

Slovník a přehrávač vznikají v E2 (bod 4; `expo-audio` je z buildu E0), řádek „Zvuky“ v E20. Tady jen
kontrola, že žádná nová obrazovka nevolá `impact()` / `notification()` napřímo.

**Podrobnosti ke slovníku (kolo 50, O-12) – platí pro E2:** slovník `labFeel.ts` (+ test) přesunout do `src/constants/feel.ts`;
přehrávač `feelPlayer.ts` do `src/services/` – hmat přes `hapticsService`, zvuk přes `expo-audio`
(jeden přednačtený přehrávač na zvuk, hlasitost ~0,6, `playsInSilentMode: false`, chyba přehrání nikdy
neshodí okamžik). Přepínač „Zvuky“ v Nastavení pod „Hmatová odezva“, uložený jako ona. **Všechna ruční
volání `notification(...)` / `impact(...)` v nových obrazovkách nahradit `feel('<okamžik>')`** podle mapy
v `PREVOD.md` (řádek `labFeel.ts`). Zvuky zatím syntetizované návrhy – před E25 Petr poslechne
(`afplay assets/sounds/<název>.m4a`) a rozhodne, jestli je nahradit profesionální sadou.

---

### E26 – Úklid (jen se svolením Petra, CLAUDE.md pravidlo 6)

1. Smazat, co už nic nečte: staré `colors`, `XpNotification`, `XpPopupAnimation` (i s jejich testy
   `xpNotificationBatching.test.ts`, `xpPopupTimeline.test.ts`), `OptimizedXpProgressBar`,
   stará okna (`CelebrationModal`, `MonthlyChallenge*Modal`, `StarLevelChangeModal`,
   `MultiplierActivationModal`, `GoalCompletionModal` – jen pokud je nahradil nový díl), `SafeLinearGradient`,
   `src/hooks/useLevelUpCelebrations.ts`, `StarProgressIndicator`, `StarRatingBadge`, `XpMultiplierIndicator`,
   nepoužívané `nativeID`. **`lottie-react-native` nemazat** (plamen série).
1a. Home (E9, E11): `XpMultiplierSection`, `MultiplierCountdownTimer`, `HabitStatsDashboard`,
   `WeeklyHabitChart`, `Monthly30DayChart`, `YearlyHabitOverview`, `HabitPerformanceIndicators`,
   `HabitTrendAnalysis`, `PersonalizedRecommendations`, `HomeCustomizationModal`, `StreakHistoryGraph`
   + `streakHistoryGraphLayout.ts` a jejich testy.
1b. Cíle (E15): `GoalCompletionPredictions`, `ProgressTrendAnalysis`.
1c. Nápověda a chyby (E22): `HelpTooltip`, `helpTopics.ts` (pokud stránka čte nová témata), texty
   `help.home.quickActions`, `help.home.recommendations`, `help.goals.overview`, `help.habits.scheduling`
   a `help.habits.bonusConversion` (EN/DE/ES), `ErrorModal` / `ConfirmationModal` / `BaseModal`, pokud je
   nic nečte, `WarmUpErrorModal`.
1d. Trasa návykových statistik (O-11): `app/habit-stats.tsx`, `Stack.Screen name="habit-stats"`
   (`app/_layout.tsx`), `IndividualHabitStatsScreen`, `DailyHabitTrackingScreen`, export v
   `src/screens/habits/index.ts`; smluvený parametr z kap. 2.2 a 3.4.
1e. Pozůstatky šablony Expo v kořenové složce `components/` (`Collapsible`, `ExternalLink`, `HapticTab`,
   `HelloWave`, `ParallaxScrollView`, `ThemedText`, `ThemedView`, `ui/` – `IconSymbol`, `TabBarBackground`) –
   **až když je nic nečte**: `IconSymbol` dnes čtou `journal-stats`, `journal-history`, `habit-stats`
   (zmizí po E13 a 1d), `ThemedText`/`ThemedView` čte `app/+not-found.tsx` (zmizí po E22).
   `CompletionAnimation` je v `src/components/habits/` (export v `habits/index.ts`) – smazat jen když ho nic nečte.
1g. Další mrtvé nebo nahrazené díly z finální kontroly: `DailyHabitTracker`, `HabitStatsAccordionItem`
   (patří k rušené trase `habit-stats`), `ParticleEffects` (jen export, nikdo ho nečte), `StarRatingDisplay`
   (nahradí `Stars` v E17/E18), `PremiumTrophyIcon` (nahradí tlačítko trofejí s ikonou `trophy` v E11),
   staré díly Síně trofejí z E19 bod 4–5.
1f. Konstanty: `XP_REWARDS.HABIT.STREAK_*` a zdroj `HABIT_STREAK_MILESTONE` (O-1, i jeho užití v
   `XpPopupAnimation`); ověřit a případně smazat `XP_REWARDS.SPECIAL.HARMONY_STREAK_7`; text
   `monthlyChallenge.starChange.reason.warmupPenalty`.
2. Nepoužité texty v locales (EN/DE/ES zároveň): staré okna, „bonusy“ šablon výzev; konstanty série návyku
   podle O-1.
3. Ráčna pokrývá všechny obrazovky.
4. O-6: laboratoř ponechat, nebo smazat.

**Jak poznat, že něco „už nic nečte“:** hledat název v celém `src/` a `app/`; po smazání `tsc` + testy.
**Petr ověří:** celá appka po úklidu (rychlé projití všech obrazovek).

---

### E27 – Vydání A

Zkouška na zařízeních: iOS + Android × EN/DE/ES × světlý/tmavý × malý telefon, tablet × snížený pohyb ×
největší písmo. Nové snímky do obchodů a popis novinky; předání marketingu; po vydání srovnat D1/D7 a trychtýř.

---

### E28 – Části dne (R-30) – vydání B — ❌ ZRUŠENO (Petr 2026-11-21, O-13): nestavět, karta níže jen pro historii

**Závisí na:** L-1, B5. Nový údaj u návyku (část dne, volitelná) → migrace, záloha/obnova. Ruční řazení
uvnitř části; bonusové návyky zůstávají zvlášť; **ne v tutoriálu**. Plná časová osa není součástí
(`projectplan-future-updates.md`, Phase 12).

### E29 – Nový katalog trofejí (R-28) – vydání C

Podle `achievements-rework-plan.md`: 75 → 51 trofejí, vzácnost podle času, první den jen běžné, cíl se
počítá až po 7 dnech. Vyřazené zmizí i těm, kdo je mají; XP zůstává. **Povinné vyčištění uložených trofejí**
(počet se bere z délky seznamu). Průvodci `Achievements.md` a `Gamification-UI.md`.

### E30 – Expo 55 → aktuální

Až po vydáních. Samostatná práce s vlastním plánem (Reanimated, worklets, Skia, RN).

---

## 7. PRŮŘEZOVÉ POSTUPY

### 7.1 Texty

1. Laboratoř má jen EN a DE (`mockCopy.ts`). **ES chybí všude.**
2. Před každou etapou: tabulka nových textů EN / DE / ES → Petr schválí → teprve pak do
   `src/locales/{en,de,es}/index.ts` a typů v `src/types/i18n.ts`.
3. Kde klíč v appce už existuje, použij ho (laboratoř to dělá přes `i18n.getFixedT`). Názvy vzácností
   trofejí zůstávají anglicky ve všech jazycích (`technical-guides.md`).
4. Množná čísla přes i18next (`_one`, `_other`), ne podmínkou v kódu.
5. Test vykresleného textu (P29): volat `t()` se skutečnými parametry ve všech třech jazycích; ve výsledku
   nesmí zůstat `{`, `}` ani název klíče.
6. Texty výzev vždy přes `challengeDisplayText.ts`; texty série deníku přes `journalStreakMilestones.ts`.

### 7.2 Data a migrace

| Změna | Etapa | Poznámka |
|---|---|---|
| Uložené přizpůsobení Home: převod 10 → 7 sekcí (`migrateHomeSections` uvnitř `mergeHomeComponents`, `hasCustomOrder`) | E11 | jedno pravidlo s testem (E11 bod 3b); bez nového sloupce |
| Cíl: druh + počáteční hodnota | E16 | migrace + záloha/obnova |
| Klíč „násobič oznámen pro toto připravení“ (AsyncStorage) | E9 | nový klíč, bez migrace (D-9) |
| Trofeje: nový katalog, vyčištění uložených | E29 | podle `achievements-rework-plan.md` |

Každá migrace: test nad daty staré verze, zpětná kompatibilita zálohy, marketingová demo data, a **zastavit
se a nechat schválit plán migrace** před kódem.

### 7.3 Analytika

Beze změny, kromě E21 (úvod). Žádná nová událost bez Petra a bez zápisu do `Analytics.md`.

### 7.4 Měření plynulosti

- Měřit v produkčním JavaScriptu: `npx expo start --no-dev --minify` (vývojový režim je pomalejší – P6).
- Zařízení: slabší Android + iPhone; 120 Hz tam, kde je.
- Zátěž: 20+ návyků, 10+ cílů, plný měsíc deníku (marketingová demo data).
- Scénáře: odškrtnutí návyku na Home a v Návycích, zápis pokroku cíle, třetí záznam deníku, rolování Home
  odshora dolů, přepínání záložek, otevření a zavření detailu tažením, let jisker při otevřeném okně.
- Posuzuje se: zadrhnutí viditelné okem + monitor výkonu Reanimatedu (JS a UI vlákno).
- Počet překreslení karet se **měří** dočasným testem s negativní zkouškou, neodhaduje (P47).

### 7.5 Ruční kontrola každé obrazovky

Světlý a tmavý režim · němčina (nejdelší texty) a španělština · největší písmo systému · snížený pohyb ·
malý telefon · tablet (`contentColumn`) · Android tlačítko zpět · klávesnice nad sheetem · čtečka obrazovky
(popisky, pořadí, uzavření okna) · stav načítání, prázdný stav, chyba.

### 7.6 Testy

- Čistá pravidla (bez React Native) do vlastního souboru `*Logic.ts` vedle komponenty, test v `__tests__/`.
- Úložiště a migrace: testy proti skutečné databázi v paměti (vzor: `sqliteGratitudeStorage.streakRewards.test.ts`).
- Každý nový test má negativní zkoušku; počet testů a zkoušek patří do zprávy.
- Čísla převzatá z appky se v testu **porovnávají s konstantami appky**, neopisují se.

### 7.7 Pomocné funkce schované v kulisách

Soubory `*Mock.ts*` se nepřevádějí, ale obrazovky laboratoře z nich berou i skutečné pomocné funkce.
Nepřenášej je – použij to, co appka už má:

| V laboratoři (`habitsMock`, `goalsMock`, `journalMock`) | V ostré appce |
|---|---|
| `dateKey`, `addDays`, `startOfDay`, `mondayOf`, `weekdayIndex`, `daysBetween` | `src/utils/date.ts` |
| `statusesFor`, `isScheduled`, `isPaused` | `useHabitsData`, `habitImmutability` |
| `paceOf`, `fractionOf`, `stepFor` | funkce tempa a pokroku v `src/utils/goalCalculations.ts` (E14) |
| `MILESTONES`, `milestoneXp`, `completionXp`, `entryXp` | `XP_REWARDS` a pravidla úložišť – nikdy konstanta v obrazovce |
| `MAX_GOAL_VALUE` | `src/constants/goals.ts` |
| `formatThousands`, texty | locales a formátování podle jazyka (7.1) |

Narazíš-li na funkci z kulis, která tu není a appka pro ni nemá obdobu → zastavit (0.3).

### 7.8 Návrat zpět

Jedna etapa = jeden commit ve větvi → `git revert <commit>`. Etapy s migrací dat (E16, E29) musí mít
napsáno, co se stane s daty při návratu ke starší verzi appky, dřív než se pustí ven.

---

### 7.9 Mapa systémových oken `Alert.alert` (O-14, Petr 2026-11-21: všechna na nová okna)

Žádné `Alert.alert` po převodu nezůstane. Chyba = pruh `ProblemNote` (`systemScreens.tsx`): jedna věta, co
se nestalo a co je v bezpečí, „Zkusit znovu“ jen tam, kde to pomůže; nikdy obecné „Error“ jako nadpis.
Rozhodnutí = `ConfirmSheet` (`journalParts.tsx`). Texty do locales EN/DE/ES.

| Místo | Dnes | Po převodu |
|---|---|---|
| `NotificationSettings.tsx:78` | chyba načtení | `ProblemNote` „Nastavení připomínek se nenačetlo.“ + Zkusit znovu |
| `NotificationSettings.tsx:104` | chybí oprávnění: Zrušit / Otevřít nastavení | `ConfirmSheet`: věta, proč appka oprávnění potřebuje, hlavní tlačítko „Otevřít nastavení“, vedlejší „Teď ne“ |
| `NotificationSettings.tsx:115` | žádost o oprávnění selhala | `ProblemNote` + Zkusit znovu |
| `NotificationSettings.tsx:124` | uložení nastavení selhalo | `ProblemNote` „Změna se neuložila.“ + Zkusit znovu; přepínač se vrátí do původní polohy |
| `NotificationSettings.tsx:156, 186` | odpolední / večerní připomínka se neuložila | jako řádek výše; vlastní věta pro odpoledne a večer |
| `NotificationSettings.tsx:219, 249` | čas připomínky se neuložil | `ProblemNote` „Čas se neuložil.“ + Zkusit znovu; čas se vrátí na původní |
| `HomeCustomizationModal.tsx:34, 54` | změna viditelnosti selhala | `ProblemNote` „Změna Home se neuložila.“; přepínač zpět |
| `HomeCustomizationModal.tsx:42` | potvrzení „Obnovit výchozí“ | **bez potvrzení** jako v laboratoři (`HomeCustomizeSheet`): obnovení je vidět hned v seznamu a rozložení jde hned znovu upravit |
| `EditGratitudeModal.tsx:52` | chyba úpravy záznamu – **s chybným textem** `journal.export.error` (text exportu!) | `ProblemNote` „Úprava se neuložila. Text zůstal v okně.“ – okno zůstane otevřené |
| `app/journal-history.tsx:57` | hledání selhalo | `ProblemNote` „Hledání se nepovedlo.“ + Zkusit znovu |
| `app/journal-history.tsx:114` | smazání záznamu selhalo | `ProblemNote` „Záznam se nesmazal. Je pořád v deníku.“ |

**Test:** stráž v testech, že `Alert.alert` se ve `src/` a `app/` nevyskytuje (kromě `__tests__`).

### 7.10 Nápověda: klíč → téma → hostitel (L-4, kolo 48)

Dnes 11 bublin `HelpTooltip` (`helpKey=`). Po převodu 6 témat (`HELP_TOPICS` v `labHelp.tsx`), texty =
texty stránky „Jak SelfRise funguje“ (jeden zdroj).

| Dnešní klíč (hostitel) | Nově | Etapa |
|---|---|---|
| `habits.makeupFunction` (`HabitCalendarView`) | téma `makeUp` – „i“ u legendy kalendáře v detailu návyku | E6 |
| `habits.bonusConversion` (`HabitItemWithCompletion`) | **zaniká** – obsah pokrývá téma `makeUp` (den navíc nahrazuje vynechaný) | E5 |
| `habits.scheduling` (`HabitForm`) | **zaniká** – výběr dnů je vidět | E6 |
| `journal.selfRiseStreak` (`DailyGratitudeProgress`) | téma `journalDay` – „i“ u „Dnes“ v Deníku (3 záznamy + ⭐🔥👑) | E12 |
| `journal.debtRecovery` (`DailyGratitudeProgress`) | téma `frozen` – „i“ v kartě zamrzlé série | E12 |
| `goals.predictions` (`GoalCompletionPredictions`, zaniká) | téma `pace` – „i“ u čipu tempa v detailu cíle | E15 |
| `goals.overview` (`GoalListWithDragAndDrop`) | **zaniká** – tvorba cíle je vidět | E14 |
| `home.xpSystem` (`OptimizedXpProgressBar`, zaniká) | téma `multiplier` – „i“ u řádku harmonie v panelu úrovně | E9 |
| `home.quickActions` (`QuickActionButtons`) | **zaniká** – tlačítka říkají, co dělají | E11 |
| `home.recommendations` (`PersonalizedRecommendations`, zaniká) | **zaniká** | E11 |
| `challenges.starDifficulty` ×2 (`MonthlyChallengeCard`) | téma `stars` – „i“ u nadpisu hvězd v detailu výzvy | E17 |

### 7.11 Kdo převádí řádky mapy 7.9 (`Alert.alert`)

`HomeCustomizationModal` → E11 · `EditGratitudeModal` → E12 · `app/journal-history.tsx` → E13 ·
`NotificationSettings` ×8 → E20 · stráž „žádné `Alert.alert`“ → E22.

## 8. NOVÉ FUNKCE, KTERÉ OSTRÁ APPKA NEMÁ (soupis)

| Funkce | R-# | V laboratoři | Etapa |
|---|---|---|---|
| Odznak úrovně na každé obrazovce, XP letí jako jiskry | R-10 | `xpFlight.tsx` | E7 |
| Jedna oslava na akci, tichá oznámení | R-29 | `celebrationDirector.tsx` | E8 |
| Panel úrovně z odznaku | R-31 | `levelPanel.tsx` | E9 |
| Přehled úrovní jako cesta | – | `LevelsOverviewConcept.tsx` | E9 |
| Okno „Nová kapitola“ jen při novém stupni | R-39 | `otherMoments.tsx` | E10 |
| Série deníku: okno jen pro 5 délek | R-40 | `otherMoments.tsx` | E10 |
| Hrdina dne (slunce), pozdrav podle denní doby, kompaktní hlavička | R-4b, R-6 | `HomeConcept.tsx` | E11 |
| Stav dne návyku tvarem, nabídka „⋯“, mini-týden | R-11, R-4c | `HabitsConcept.tsx` | E5 |
| Detail rostoucí z karty | – | `*DetailConcept.tsx` | E4 |
| Okno tvorby s živým náhledem (návyk, cíl) | – | `*ComposerConcept.tsx` | E6, E15 |
| Deník: splnění dne na místě | R-13 | `JournalConcept.tsx` | E12 |
| Deník: zámek zmrzlé série před psaním, ohřátí v Deníku | R-14 | `JournalConcept.tsx` | E12 |
| Historie deníku jako kalendář, graf 30 dní | R-15 | `JournalHistoryConcept.tsx`, `JournalStatsConcept.tsx` | E13 |
| Cíle: tempo, rychlý zápis + Zpět | R-17, R-18 | `goalParts.tsx` | E14 |
| Cíle: termín předvolbami, nápady v okně | R-19 | `GoalComposerConcept.tsx` | E15 |
| Cíle: druh „Messen“ | R-16 | `GoalComposerConcept.tsx` | E16 |
| Výzva: detail na jedné stránce, tempo, „mimo dosah“ | R-36 | `ChallengeDetailConcept.tsx` | E17 |
| Výzva: tři momenty místo pěti oken | R-37, R-38 | `challengeMoments.tsx` | E18 |
| Síň trofejí jako jedna místnost, list sbírky | R-22 | `TrophyRoomConcept.tsx` | E19 |
| Nové Nastavení | R-23 | `SettingsConcept.tsx` | E20 |
| Nový úvod s krokem vděčnosti | R-24–R-27 | `OnboardingConcept.tsx` | E21 |
| Nájezd jen při první návštěvě záložky | R-32 | `DesignLabScreen.tsx` | E3 |
| Tažné zavírání | R-33 | `dragToClose.tsx` | E4 |
| Opona při spuštění | R-9 | `introTimeline.tsx` | E23 |
| Vlastní ikony (⭐🔥👑🏆) a ikony spodní lišty | R-34 | `SignatureIcon.tsx`, `SelfRiseIcons.ttf` | E1–E3 |
| Slovník dotyku a zvuku, přepínač „Zvuky“ | R-35 | `labFeel.ts`, `feelPlayer.ts` | E2, E20 |
| Klid při posunu (pevná výška, plamen stojí) | – | `useScrollRest`, `HomeConcept.tsx` | E2, E11, E12 |
| Statistiky návyků na Home (týden / 30 dní / rok) | – | `HabitStatsConcept.tsx` | E11 |
| Přehledy, Pro tebe, sheet přizpůsobení s převodem rozložení | – | `HomeSectionsConcept.tsx` | E11 |
| Záchrana zamrzlé série přímo na Home | – | `HomeConcept.tsx`, `WarmUpControls` | E11 |
| Násobič na odznaku a v panelu úrovně | O-4 | `multiplierLogic.ts`, `xpFlight.tsx`, `levelPanel.tsx` | E7, E8, E9 |
| Stavy karty výzvy (načítání, na cestě, chyba) | – | `ChallengeCardStates.tsx` | E17 |
| Jedna oslava i napříč událostmi (kapitola + trofej, víc milníků, snížení hvězd) | R-29 | `momentRules.ts`, `challengeLogic.ts` | E8, E10, E18 |
| Nová stránka „Jak SelfRise funguje“ | – | `HowItWorksConcept.tsx` | E22 |
| Nápověda na místě (6 témat) | – | `labHelp.tsx` | E6, E9, E12, E15, E17, E22 |
| Pruh neúspěšné akce, „nenalezeno“, chyba databáze | – | `systemScreens.tsx` | E11–E22 |
| ~~Části dne~~ | R-30 | zrušeno (O-13) | – |
| Nový katalog trofejí | R-28 | `achievements-rework-plan.md` | E29 |

---

## 9. RIZIKA

| Riziko | Opatření |
|---|---|
| Slabší model „dotvoří“ vzhled nebo logiku sám | kap. 0.3; kap. 5 (nejdřív laboratoř); karta etapy vyjmenovává soubory |
| Okna jako `View` místo RN `<Modal>` – překrytí s nativními okny a klávesnicí | pořadí vrstev 6.0; `Startup-Orchestrator.md`; zkouška na obou systémech v E8 |
| Zobrazené XP se rozejde se skutečným | účetní funkce s testem a srovnání při startu (E7) |
| Plynulost se skutečnou zátěží je horší než v laboratoři | brána B1 a B2; měření 7.4 po každé obrazovce |
| Smíšený vzhled v obchodě | větev `design-v2`, vydání A celé najednou |
| Větev se rozejde s `main` | `git merge main` před každou etapou |
| Do vydání C platí starý katalog trofejí → víc velkých oken | vědomě; případně vydání C uspíšit |
| Dlouhá němčina, chybějící španělština | 7.1 a 7.5 |
| Rozbití úvodu, fronty oken, série deníku | kap. 3.4 – testy musí zůstat zelené **beze změny testu** |
| Laboratoř unikne do obchodní verze | `designLab.test.ts` |
| Gesta se na iOS a Androidu chovají jinak | zkouška na obou v E4; pasti z kola 40 |

---

## 10. STAV ETAP (odškrtávat tady; jediné místo pravdy o postupu převodu)

`projectplan.md` má na převod jen jeden řádek s odkazem sem – ten se odškrtne až po vydání A. Průběh se
vede v téhle tabulce; rozhodnutí a poučení dál v `premium-design-plan.md`.

| Etapa | Stav | Commit | Petr schválil |
|---|---|---|---|
| B0 – potvrzení rozhodnutí 4.2 (✅ 2026-11-22), zvuky D-7, souhlas s buildem | ☐ | – | |
| E0 – příprava, build, měření (→ B1) | ☑ 2026-11-23: větev `design-v2`, Maestro 2.12.1, build v telefonu, zvuky hrají, měření hotové (P46 zrušeno), React Compiler zjištěn (bod 6). Simulátorové buildy v iPhone SE a 17 Pro Max, Android v emulátoru Pixel 7. Scénáře v `.maestro/` (návod, zařízení a pasti v `.maestro/README.md`). **Snímky „před“ (2026-11-23, čerstvá demo data):** iPhone SE EN světlý (25), Pixel 7 EN světlý (23), 17 Pro Max EN světlý / EN tmavý / DE světlý / ES světlý (po 18) v `.maestro/out/before/` (gitignored, jen na tomto Macu). Po každé etapě: `capture.sh <zařízení> after-E<n> <název>` a porovnat. Dořešeno: „Level 0, 0/100 XP po úvodu“ bylo jen zpoždění (po načtení Level 1, 100 XP za dvě trofeje). Deník: 4 snímky nedojedou na konec dlouhého seznamu zápisů (opakující se karty – záměrně). **Brána B1 splněna.** Zbývá jen commit `.maestro/` na Petrův pokyn | | |
| E1 – tokeny, fonty, testy | ◐ 2026-11-23: `src/design/tokens.ts` (palety po rolích, typ, mezery, zaoblení, pohyb, vzácnost, stupně, nebe a slunce, tóny ikon, noc úvodu, stíny, `withAlpha`, `onHabitColor`) + barvy psané v laboratoři natvrdo; `src/design/fontFiles.ts`; `useTheme().design`; písma (Fraunces, Figtree, `SelfRiseIcons`) se načítají při startu a chyba písma start nezablokuje. Testy: kontrast AA, písma (soubor + PostScript název), paleta návyků, ráčna – každý s negativní zkouškou; `tsc` + 1351 testů zelené. **Test kontrastu našel 3 chyby laboratoře, opraveno na obou místech:** ledová modrá (světlý) `#2477C4` → `#216DB3`; `onHabitColor` hranice 0,4 → 0,3 (P20c); tlumená bílá úvodu 0,72 → 0,76 (P80). Nezávislá revize: hodnoty sedí s laboratoří, žádná viditelná změna appky; podle ní utěsněna ráčna (hex ve stínu/rámečku, `${barva}33`, `hsl()`, barvy jménem, čísla v podmínce, další cesty k `Modal`), test seznamu písem (klíč ↔ soubor) a `withAlpha()` odmítá neplatný vstup. Vědomě ponecháno: písmo, které by se nikdy nenačetlo ani neselhalo, by start pozdrželo (u souborů v balíčku prakticky nemožné; načítá se souběžně s databází). Průvodce `technical-guides.md` (Design Tokens). **Čeká:** Petrovo ověření na telefonu (appka beze změny; v laboratoři tmavší led, tmavé symboly na 4 tmavých barvách návyků, o kousek jasnější tlumený text úvodu) | | |
| E2 – primitiva, Design-System | ◐ 2026-11-23: `src/components/ui/` – `primitives.tsx` (`AppText`, `Surface`, `PressableScale`, `Rise`, `AnimatedNumber`, `ProgressBar`, `DayArc`, `MiniArc`, `CheckButton`, `Chip`, `IconBadge`, `Divider`), `RollingNumber` (+ logika s testem), `StreakFlame` (stav zvenku, `useIsFocused`), `SignatureIcon`/`InlineIcon`, `Ring`, `Stars`, `scrollChoreography` (+ `useScrollRest`), hodiny nájezdu (`introTimeline`; opona až E23); `useDesign()`. Slovník pocitů `src/constants/feel.ts` + `src/services/feelService.ts` (vypínač zvuků uložený, `initSounds()` při startu). Vibrace jen přes `feel`: `PressableScale` výchozí `tap` (= laboratorní `selection`, 1:1; chybný řádek mapy v PREVOD.md opraven), nové tiché okamžiky `check`/`uncheck` pro odškrtnutí (i v laboratoři). Nová varianta písma `numberMd` (kruh s procenty). Průvodce `technical-guides:Design-System.md`. Ráčna rozšířena o všechny soubory E2. **Vědomě odloženo:** zjednodušení `RollingNumber` (11 prvků na číslici) – změnu vykreslení porovnat v laboratoři; laboratorní `PressableScale` dál volá vlastní vibrace. Nezávislá revize: převod 1:1 potvrzen; opraveno podle ní – zahřátí plamene se při sníženém pohybu nikdy nedokončilo (teď hned, jen zaměřený plamen), výchozí vibrace tlačítka vrácena na `tap`, chyba `play()` zvuku bez neošetřené výjimky (i v laboratoři). `tsc` + 1386 testů zelené. **Čeká:** Petr (bez viditelné změny) | | |
| E3 – chrome | ◐ 2026-11-23: `app/(tabs)/_layout.tsx` bez modré hlavičky, nová lišta `src/components/ui/TabBar.tsx` (vlastní ikony `SignatureIcon`, klouzavá pilulka, pravidla stisku s testem) a horní řádek `TopRow` (vlevo místo pro odznak E7, vpravo tlačítka) na všech pěti záložkách. Home: časovač násobiče, Síň trofejí (podpisová trofej) a přizpůsobení v horním řádku – chování beze změny, popisky pro čtečku z existujících klíčů (`achievements.title`, `home.customization.title`), žádné nové texty. Stavový řádek podle režimu v kořeni i záložkách; karty s modrou hlavičkou mají vlastní světlý (goal-stats, levels-overview, how-it-works nově v trase). Reklamy beze změny (pruh už byl v každé obrazovce nad lištou – O-5). R-32: `unmountOnBlur` nikde. Snímky po: `.maestro/out/after-E3/` (Pro Max, světlý) + kontrola tmavého režimu. `HapticTab` nikdo nepoužívá – úklid v E26 se svolením. Nezávislá revize: stavový řádek (pořadí vrstev), lišta, závislosti na zrušené hlavičce a horní řádek v pořádku; opraven posun klávesnice v Deníku (pevných 90 bodů = stará hlavička, teď 0). `tsc` + 1394 testů zelené. **Čeká:** Petrovo ověření (tablet jen ručně; psaní do deníku s klávesnicí na iPhonu) | | |
| E4 – sdílené díly | ◐ 2026-11-23: `src/components/ui/` – `sheets.tsx` (`BottomSheet`, `useKeyboardLift`, `ConfirmSheet`, `UndoToast` – popisky dodává obrazovka, `PageTopBar`), `DetailFrame` (jeden díl místo tří kopií; počáteční zaoblení parametrem), `dragToClose` + `dragToCloseLogic` (test převzat), registr překryvů `overlayRegistry` (`useIsFocused`, s testem), rám oken `windowFrame` (`useWindowMotion`, `PrimaryButton`, `windowStyles`). Vibrace přes `feel` (potvrzení `confirm`, zavření detailu `tap`). **Nalezeno při převodu:** bílý popisek červeného tlačítka v tmavém režimu 2,25 : 1 → nová role `onDanger` (tmavý inkoust, 7,07 : 1), hlídá ji test kontrastu, opraveno i v laboratoři; token `radius.xl` (28). Nezávislá revize: 1:1 s laboratoří potvrzeno, `useIsFocused` mimo obrazovku nespadne (kořen vrací `true`); opraveny tři zděděné drobnosti (i v laboratoři): `UndoToast` už neschová novější oznámení, potvrzená akce `ConfirmSheet` se neztratí při druhém zavření, `PageTopBar raised` pro křížek v detailu. Chování animací ověří až první obrazovky (E5+). `tsc` + 1412 testů zelené. Díly zatím nikdo nepoužívá – bez viditelné změny | | |
| E5 – Návyky: seznam (pilot) | ✅ (Petr na telefonu 2026-11-24) 2026-11-23: **nový seznam Návyků** – `src/components/habits/list/` (`HabitsListView`, `HabitCard` memo, `PausedHabitCard`, `WeekStrip` – 7 kroužků v jednom plátně, `HabitActionsSheet` – „⋯“ se sdíleným `BottomSheet` a `ConfirmSheet`), čistá logika `src/screens/habits/habitListLogic.ts` (stavy dne z párování appky, podíl týdne, dráhy závorek, dny pauzy, sekce, porovnání karty – s testy), `GamificationService.getTodayHabitXP()` (štítek „+N XP“, varianta a) s testem, schválené texty EN/DE/ES (+ test vykreslení; DE „Routine“, EN větou, „Paused today“, prázdný stav „Tap + …“). Série návyku se nekreslí (rozhodnuto). Řazení, tvorba/úprava a ťuk na kartu zůstávají do E6 postaru. `Habits.md` „UI Display Rules“ přepsán. Ověřeno v simulátoru (Pro Max): odškrtnutí (2/5, +105 XP), „⋯“, potvrzení smazání, zrušení; snímky `.maestro/out/after-E5/`. `tsc` + 1495 testů. **Otevřené:** nápověda „Smart Make-up System“ slibuje „zlatou fajfku“ (P28) – nový text potřebuje schválení (navrhnout s E6, kde téma přechází do kalendáře). Nezávislá revize: stavy dne, sekce a pulz úvodu v pořádku; opraveno podle ní – pojistka proti dvojitému ťuknutí na fajfku (vrácena ze starého seznamu), VoiceOver: fajfka a „⋯“ jako akce karty (na iOS by je karta skryla), přepočet týdne jen u změněného návyku (výkon u 20+ návyků), stabilní „Obnovit“, záře nového návyku se nepřehrává znovu, štítek XP se po uložení dočte. **Čeká:** Petr na telefonu (20+ návyků na Androidu, žlutá a červená barva, pulz úvodu, VoiceOver) | | |
| E6 – Návyky: detail, tvorba, řazení (→ B2) | ✅ **brána B2 splněna** (Petr na telefonu 2026-11-24: „všechno funguje výborně, graficky i logicky“) | 2026-11-24 část 1: texty EN/DE/ES (cd66f75). **Bod 1 hotový:** detail roste z karty (`HabitDetail.tsx`), kalendář s tvary a obloučky, vysvětlení dne, série v plánovaných dnech (`planStreaks`), „i“ (`ui/help.tsx`); trasa `habit-stats` z Návyků nedosažitelná (stará „zlatá fajfka“ zmizí s ní v E26); ověřeno na simulátoru. **Bod 2 hotový:** jeden sheet tvorby i úpravy (`HabitComposer.tsx`), sdílená pravidla `habitFormRules.ts`, ověřeno na simulátoru (prázdné jméno, nápad, pracovní dny, vytvoření, úprava). **Bod 3 hotový:** řazení v novém vzhledu (`HabitsReorderView.tsx`, pravidla `ReorderableList` beze změny), ověřeno na simulátoru (přetažení, rolující čísla, pořadí v seznamu). **Bod 4 hotový** s bodem 1 („i“ u legendy). Čeká na Petrův telefon → brána B2 | |
| E7 – odznak a jiskry | ◐ 2026-11-24 část 1 (bez textů, bez viditelné změny): `src/services/xpDisplay/` – `xpLedger.ts` (účetnictví zobrazeného XP s přidržením a pojistkou 2 s, rozdělení ⭐🔥👑), `xpOriginRegistry.ts` (bod původu), `multiplierDisplay.ts` (`badgeMark`, `formatFactor`, `multiplierStatus`, `shouldAnnounceReady` z laboratoře) – vše s testy a negativní zkouškou; `xpGained` trofejí a sbírek nese `sourceId` + `metadata` (bod 2). Revize části 1: kniha drží rovnici ve všech funkcích; doplněno – odebrané XP nejdřív ruší přidržené XP téže věci, bod původu se páruje podle skupiny zdrojů (deník platí třemi zdroji). **Pro část 2 pohlídat:** `achievementService.runBatchAchievementCheck` (~ř. 1203, trofeje z úvodu, `HabitsContext`/`GoalsContext`/`AchievementContext`) připisuje XP se `skipNotification` a **neposílá `xpGained`** → doplnit při zapojení odznaku (dnes by to změnilo starou lištu); bod původu brát jen pro část, která letí hned. **Část 2a hotová 2026-11-24:** odznak úrovně nad levým polem horní řady (jen záložky, ne v úvodu ani pod sheetem/detailem), vrstva jisker nad vším, „+N XP“ u zaškrtávátka návyku, přidržení XP momentů do zavření jejich (starého) okna, pojistka 2 s, srovnání s úložištěm v klidu (místo nových `xpGained` – nesahá na počítání výzev), souhrnná lišta a bubliny odpojeny; texty E7 v locales; ověřeno na simulátoru videem (bublina → oblouky → zásah kroužku). **6a hotové:** značka násobiče (`useBadgeMark`: štítek s běžícím faktorem z `getActiveMultiplier`, tečka při připraveném násobiči harmonie; pravidla `multiplierDisplay`). E7 hotová až na body původu deníku a cílů – přijdou s jejich etapami (E12, E14). **Čeká:** Petr na telefonu (B3 až po E10) | | |
| E8 – momenty a okno trofeje | ◐ 2026-11-24 část 1 (bez textů, bez viditelné změny): řadicí pravidlo fronty vyvezeno do `src/contexts/modalQueueOrdering.ts` a test `modalQueueOrdering.test.ts` napojen na něj (krok 3 – dřív testoval kopii; stejná očekávání, negativní zkouška); čistá pravidla `src/services/moments/moments.ts` (`momentFor`, `momentXp`, `enqueueMoment` – nový test: nic se neztratí, okno se neslučuje, hlava se nemění), `momentRules.ts` (`chapterOfAction`, `streakMomentSize`) a `src/services/levels/levelsJourney.ts` převzaty i s testy. **Část 2, kroky 1–2 hotové 2026-11-24:** texty E8 (9912f94); sběrač dávky (`routeTrophyBatch`, test), tiché oznámení u odznaku (`NoteHost`, `noteBus`), XP oznámení letí z jeho čísla, kombo uvnitř momentu (bez vlastního okna), staré okno ukazuje „Also unlocked“ a kombo; ověřeno na simulátoru. **Krok 3 hotový:** `TrophyWindow` jako `View` ve vrstvě 4 (výstup fronty `ModalQueueOutlet` v `LayoutContent`), XP po „Continue“ z tlačítka (`registerMomentOrigin`), zátěžový test fronty (negativní zkouška), ověřeno na simulátoru. **Čeká:** Petr na telefonu (B3 po E10); 4a oznámení s akcí přijde s E9 | | |
| E9 – panel úrovně, přehled úrovní | ✅ kód (čeká telefon) 2026-11-24 **krok 1 texty** (088d3a4, vč. 20 hodností), **krok 2 panel** (`LevelPanel.tsx`, `useMultiplierState`, `rankTitle` s testem, nápověda `multiplier`, odznak roste do kroužku panelu; ověřeno na simulátoru). **Krok 3 hotový:** sekce násobiče a odpočet z Home pryč, tichá oznámení s akcí (`PlainNoteView`), „připraveno“ jednou na připravení (D-9), „Welcome back“ (událost + kontrola při připojení, `XP_MULTIPLIERS.COMEBACK_*`), okno násobiče výzvy dočasně z vrstvy odznaku (do E18). **Krok 4 hotový 2026-11-25:** přehled úrovní jako cesta (`LevelsJourneyScreen.tsx`), ověřeno na simulátoru. **E9 hotová; čeká na Petrův telefon (B3 po E10).** Příprava: pravidla panelu `src/services/levels/levelPanelLogic.ts` (+ test, z laboratoře) a `levelsJourney.ts`; značka násobiče `src/services/xpDisplay/multiplierDisplay.ts` (E7). Zbytek čeká na texty E9 (42 nových) | | |
| E10 – ostatní okna oslav (→ B3) | ✅ kód 2026-11-25: texty (398a5cb); okna kapitoly / série / násobiče harmonie / cíle / ⭐🔥👑 jako `View` (`MomentWindows.tsx`), kapitola jen při novém stupni + spojení s trofejemi (L-8, `chapterShown`), série 7/30/100/365/1000 okno, ostatní tiché oznámení; ověřeno na simulátoru. Denní dokončení deníku zůstává do E12, výzvy a hvězdy E18. **Brána B3: Petr 2026-11-25 „pokračuj dál podle plánu“ – zkouška na telefonu odložena a proběhne společně s dalšími etapami (E7–E11 najednou).** | | |
| E11 – Home | ✅ kód 2026-11-25 (E11a–E11e). **E11e část 2:** karta Přehledy (`InsightsCard`, fakta `homeInsightsLogic.ts` se stejnými výpočty jako dřív `HabitTrendAnalysis` + test; trend jen při růstu, nejsilnější ≥ 50 %, stojí za pohled < 50 %, jen zavedené návyky, bez faktů bez karty; věty bez „this month“), karta Pro tebe (`ForYouCard`, jedno doporučení naráz, tlačítko dělá akci doporučení – rozhodnuto: tvorba návyku / cíle, psaní, jinak záložka); smazány `PersonalizedRecommendations`, `HabitPerformanceIndicators`, `HabitTrendAnalysis`, `habitPerformanceLogic`; bublina `home.recommendations` zanikla. Ve staré podobě na Home zbývá jen výzva (E17). **Brána B3 ✅ Petr 2026-11-25** (E7–E11 na telefonu): „to je nádherné, všechno vypadá hezky funkčně“. **E11e část 1 hotová 2026-11-25:** sedm sekcí (`defaultHomeComponents`), převod uloženého rozložení jako jediné pravidlo `mergeHomeComponents` (`migrateHomeSections` ho volá, testy obou + past „rozložení už v novém tvaru“), nový `HomeCustomizeSheet` (přetažení, přepínače, názvy = nadpisy karet, chyba = `ProblemNote`, akce kontextu vracejí úspěch), smazán `HomeCustomizationModal` (i jeho `Alert.alert`); karta úrovně, graf série a sekce násobiče z Home pryč. Rozhodnuto: uživatel bez vlastního pořadí dostane nové výchozí pořadí (Přehledy před Pro tebe). **Zjištěno:** na iOS 26 jsou systémové přepínače (`Switch`) v řádku posunuté nahoru – i v Nastavení; řešit jedním přepínačem nového vzhledu při převodu Nastavení. Zbývá část 2: Přehledy a Pro tebe. **E11d hotová 2026-11-25:** `HabitStatsCard.tsx` (7 / 30 dní sloupce, rok kalendář na jednom plátně, ťuknutí na den, legenda, fakta), `countDay` = pravidlo starého týdenního grafu beze změny (test), jeden třídič i pro rok, rok jen z dat a nejvýš 365 dní, počítá se až po přepnutí; srovnání s předchozím obdobím jen když leží celé v datech (`comparable`, nalezeno na simulátoru); paleta `chart` v tokenech; karta skrytá bez plánu v posledních 30 dnech (E11/2c); smazány `HabitStatsDashboard`, `WeeklyHabitChart`, `Monthly30DayChart`, `YearlyHabitOverview`; průvodci Home a Habits. **E11c hotová 2026-11-25:** nová karta série `JournalStreakCard.tsx` se záchranou na kartě (vločky → slunce, „Zahřát (x/y)“, „Začít znovu“ s `ConfirmSheet`), hook `useStreakWarmUp` přestavěn pro záchranu na kartě (obnova sdíleného stavu po každé platbě, bez oken úspěchu – E11/6), plamen `useJournalFlame` (zahřátí jednou za den, test), pruh `ProblemNote` (vrstva 2b, `app/_layout.tsx`) místo `WarmUpErrorModal`; `?openDebtModal=true` dorolluje ke kartě; texty `frozenMessage_*` (počet = reklamy) a `resetFailed.message`, `adsCount` zrušen; nový token písma `streak`; smazány `GratitudeStreakCard`, `StreakWarmUpModal`, `WarmUpModals`; průvodci Home, My-Journal, AdMob. Ověřeno na simulátoru (běžná i zamrzlá karta, testovací reklama, pruh chyby, potvrzení, přesměrování). **E11b hotová 2026-11-25:** nová stránka `src/components/home/HomePage.tsx` – pozdrav 5/12/18 (`homeHeroLogic.ts` + test), hrdina se sluncem jen z dnes naplánovaných návyků (`splitHabits`/`doneToday` jako Návyky), „+N XP dnes“ z `getTodayXP()`, oslava dne jen na Home (`feel('dayDone')`, `finishedTheDay`), kompaktní lišta pod pevným horním řádkem, rychlé akce (`QuickActions.tsx`), dnešní návyky (`TodayHabits.tsx`, zatím vždy za rychlými akcemi – samostatná sekce v E11e); `scheduleLabel` sdílený s Návyky; bublina `home.quickActions` zanikla; nový průvodce `technical-guides:Home.md` (D-12). Rozhodnuto: bonusové návyky na Home nejsou (patří do Návyků). Ověřeno na simulátoru (odškrtnutí, dokončený den, rolování, rychlá akce). Revize: oslava dne se už nespustí při startu, když návyky dorazí rovnou hotové (plán se mezi vykresleními nesmí změnit, test); odškrtávací funkce stabilní, řádky se nepřekreslují všechny. **Texty E11 vloženy 2026-11-25** (tabulky A a C; mimo: `home.greeting.night` podle rozhodnutí E11/1, `timelineCheck.description_*` a `journal.warmUp.frozenMessage_one/_other` až se svými komponentami v E11c/E11d, `resetFailed.message` až s pruhem chyby; test `homeCopy.test.ts`). **E11a hotová 2026-11-25:** zahřátí série v hooku `useStreakWarmUp` (beze změny chování, test s negativní zkouškou), karta Home ho používá. 2026-11-24 příprava: pravidla `src/screens/home/homeLayoutLogic.ts` a `homeChartsLogic.ts` převzata i s testy (nezapojená). Revize: pro zapojení pohlídat – uložený tvar je `HomeScreenComponent {id, name, order, visible, configurable}` a `mergeHomeComponents` (`src/utils/homeComponents.ts`) staví výsledek jen ze starých 10 id → nové id (`todayHabits`, `insights`) i odebrané sekce řešit ve stejném kroku jako `defaultHomeComponents`; `migrateHomeSections` krmit výstupem `getPreferences` (seřazeno); `DayStat.weekday` 0 = pondělí vs. řetězcový `DayOfWeek`; u uživatele bez vlastního pořadí jde `insights` za `recommendations` (čistá instalace naopak) – rozhodnout. Zbytek čeká na texty a mapu dat E11 | | |
| E12 – Deník | ✅ kód 2026-11-25 (čeká na Petrovu zkoušku: zamrzlá série v Deníku, třetí záznam, úprava/smazání). Petr na telefonu: zápis „trhavý“, po třetím záznamu „nic“ → sheet se zavře hned a ukládá se po jeho animaci, po třetím záznamu stránka nedoroluje pryč od karty Dnes (7f7b541). **E12a+b+c hotové 2026-11-25:** nová stránka `JournalPage` (karta Dnes s bonusovou cestou, dlaždice, citát nad záznamy, záznamy s „⋯“), jeden sheet psaní a úprav (`EntryComposer`, chyba = `ProblemNote`, sheet zůstane s textem), XP podle pořadí jako jedno pravidlo `journalXp.ts` (úložiště ho volá, test), R-13 oslava třetího záznamu na místě (`completedTheDay`, test; okno `celebration_daily_complete` + `CelebrationModal` smazány), R-14 zámek dlaždic + zahřátí v Deníku přes sdílený hook, pojistka dluhu přenesena beze změny (`journalWritingGate`), přesměrování `?openDebtModal` zrušeno na obou koncích, nápověda `journalDay` / `frozen` (konstanta `MAX_DEBT_DAYS` i v úložišti); smazány `GratitudeInput`, `DailyGratitudeProgress`, `DailyMotivationalQuote`. Ověřeno na simulátoru (psaní, třetí záznam, smazání s přečíslováním). Revize: sheet nápovědy se kreslil do rámečku vedle „i“ (i v detailu návyku z E6) → `HelpHost` na úrovni stránky, ověřeno. Zbývá: `EditGratitudeModal` / `GratitudeList` dál slouží Historii (E13). **Texty E12 vloženy 2026-11-25** (tabulky A a C, klidné věty pod počtem dne podle rozhodnutí 1, emoji z textů s ikonou pryč; test `journalCopy.test.ts`). Dál po krocích: E12a stránka (karta Dnes, citát, záznamy), E12b sheet psaní a úprav, E12c zámek zamrzlé série + zahřátí v Deníku, E12d oslava třetího záznamu na místě (R-13). | | |
| E13 – historie a statistiky deníku | ✅ kód 2026-11-25 (čeká na Petrovu zkoušku: kalendář se zaplaceným dnem ❄, hledání, graf 30 dní, odznaky ⭐🔥👑). **E13b hotová 2026-11-25:** Statistiky jako `JournalStatsPage` (série s rekordem, čtyři čísla živě ze stavu deníku, graf posledních 30 dní se stupnicí do 8 a značkou cíle, rozdělení podle typu, odznaky 4/8/13 záznamů, motivační věta), pravidla `journalStatsLogic.ts` + test; živý test stránky přepsán na novou stránku; `StatisticsCard` smazán; pruh pod stavovým řádkem v Historii i Statistikách (obsah už nejede pod hodiny), ověřeno na simulátoru. **E13a hotová 2026-11-25:** Historie jako měsíční kalendář (`JournalHistoryPage`, pravidla `journalHistoryLogic.ts` + test: stav dne tvarem, stuha série, ❄ zaplacené dny, měsíce k prvnímu záznamu), panel dne ‹ ›, hledání se zvýrazněním z dat kontextu (výsledky ve `FlatList`), „⋯“ = sheet úprav a potvrzení z Deníku, chyby = `ProblemNote` (Alert.alert pryč); smazány `EditGratitudeModal`, `GratitudeList`; ověřeno na simulátoru. Zbývá E13b statistiky. **Texty E13 vloženy 2026-11-25** (test `journalHistoryCopy.test.ts`; tři klíče jako `journal.historyPage.*`). Dál: historie (kalendář, panel dne, hledání), statistiky (série, čísla, graf 30 dní, typy, ⭐🔥👑). | | |
| E14 – Cíle: seznam | ◐ **E14a hotová 2026-11-25 (bez viditelné změny kromě okna „Cíl splněn“):** jedno pravidlo tempa `paceOf` + `fractionOf` + `goalDate` v `goalCalculations.ts` (přímka start → termín, ±3 dny, stavy napřed / v plánu / pozadu / po termínu / bez termínu / splněno; místní data i starý tvar `DD.MM.YYYY`; směr dolů připraven pro E16), rychlé částky `quickAmounts` (z cílové hodnoty, beze změny dat), vzhled kategorie `goalLook` v `src/constants/goalLook.ts` (okno „Cíl splněn“ už má ikonu a barvu cíle místo vlajky) – vše s testy a negativní zkouškou; texty E14 v locales (A celé, C celé; test `goalsListCopy.test.ts`). **E14b hotová 2026-11-25:** nová stránka Cílů (`src/components/goals/page/`: `GoalsPage`, `GoalCard` memo, `GoalLogSheet`, `GoalActionsSheet`, `GoalsReorderView`; logika `goalsPageLogic.ts` + test): přehled aktivní / v plánu / splněné, čára termínů (cíle se stejným termínem jako jedna skupina překrývajících se teček, nejvýš 6 měsíců, leden s rokem), karta s pruhem, zářezy, ryskou plánu, čipem tempa a „zbývá N dní“, zápis jedním ťuknutím (fronta v pořadí ťuknutí) + pruh „Zpět“, panel „Jiné“ (vlastní číselník, Přičíst / Odečíst / Nastavit = `progressType` 1:1, datum Dnes / Včera / Jiné s pravidlem `progressDateError`, poznámka), „⋯“ detail / úprava / smazání s potvrzením na místě, řazení ve stylu návyků, splněné jako tiché řádky; dokončení ze zápisu otevře okno (stav před / po z úložiště – dvě ťuknutí neoslaví dvakrát); chyby = klidné věty `goals.errors.*` v pruhu (pryč `ErrorModal` s `error.message`); u jedničky bez jednotky („+1“, ne „+1 books“); VoiceOver: částky, „Jiné“ a „⋯“ jako akce karty (na iOS je karta skrývala). Ověřeno na simulátoru: zápis ťuknutím, „Zpět“, panel „Jiné“, dokončení cíle ze zápisu s oknem. Smazány `GoalItem`, `GoalList`, `GoalListWithDragAndDrop`, `ProgressModal`, `ProgressEntryForm`. **Dočasně do E15:** tlačítko šablon v horní řadě (pak uvnitř okna tvorby), tvorba a úprava ve starém `GoalModal`. **Hrana N-5.9 vyřešena (Petr 2026-11-25 „ano“):** zápis si pamatuje své skutečné XP (`goal_progress.xp_awarded`, nový sloupec, staré zápisy NULL = staré chování) a „Zpět“ / smazání vrátí přesně tolik – nad denním stropem nic. Dál: E14c čísla po zápisu (D-4). | | |
| E15 – Cíle: tvorba, detail | ☐ | | |
| E16 – Cíle: „Messen“ | ☐ | | |
| E17 – výzva: detail | ☐ | | |
| E18 – výzva: momenty | ☐ | | |
| E19 – Síň trofejí | ☐ | | |
| E20 – Nastavení | ☐ | | |
| E21 – úvod | ☐ | | |
| E22 – zbylé obrazovky | ☐ | | |
| E23 – opona | ☐ | | |
| E24 – ikony (přesunuto do E1–E3, zbývá kontrola) | ☐ | | |
| E25 – zvuk a hmat (přesunuto do E2, E20, zbývá kontrola) | ☐ | | |
| E26 – úklid | ☐ | | |
| E27 – vydání A (vyžaduje B4) | ☐ | | |
| E28 – části dne | ✖ zrušeno (O-13) | | |
| E29 – katalog trofejí | ☐ | | |
| E30 – Expo | ☐ | | |

Laboratorní dluhy (Petr prošel kola 41–49 na zařízení 2026-11-21: „všechno vypadá skvěle“): L-1 ✖ (zrušeno, O-13) · L-11 ☑ postaveno (kolo 53), čeká na schválení · L-2 ☑ (kolo 41–42) · L-3 ☑ (kolo 47, schváleno 2026-11-21) · L-4 ☑ (kola 48–49 + mapa 7.9, schváleno) · L-5 ☑ postaveno (kolo 51), čeká na schválení · L-6 ☑ postaveno (kolo 50), čeká na schválení; zvuky slyšet až po E0 · kolo 52 (plynulost posunu) postaveno, čeká na schválení · L-7 ☑ (kolo 45, schváleno 2026-11-21) · L-8 ☑ (kolo 46, schváleno 2026-11-21) · L-9 ☑ (ověřeno 2026-11-21) · L-10 ☑ (kolo 44, schváleno 2026-11-21)
