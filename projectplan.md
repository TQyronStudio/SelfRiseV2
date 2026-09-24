# SelfRise V2 - Project Plan

> 📦 **Handoff**: Blueprinty zbývající práce (runtime ověření, Crashlytics, Achievements audit, N27/N28/N31, Sprint 4) + nebezpečné zóny: @handoff-blueprints.md

> 🧹 **Úklid 2026-07-14**: Dokončené sekce přesunuty do @implementation-history.md (viz index níže). Tento soubor drží už jen ROZPRACOVANÉ a PLÁNOVANÉ úkoly + trvalou referenci.

> ✅ **Super audit 2026-07 (13 fází) KOMPLETNÍ** — plán @super-audit-plan-2026-07-16.md,
> zprávy @docs/audits/super-audit-2026-07/, průběžný deník všech sessions + device bugy
> z 26. 7. přesunuty do @projectplan-archive.md → „Super audit 2026-07 — průběžný deník".
> **Zůstává otevřené:**
> - [ ] Device testy (Petr): **2i** trofeje, **3e** měsíční výzvy, **11.2** přepnutí widgetů přežije restart
> - [ ] Fáze 13 dojezd: N-13.6 (3 konstanty ENGAGEMENT), úklid root `.md`, 87 osamocených i18n klíčů

---

## ✅ HOTOVO: Řazení návyků a cílů — plynulý scroll (2026-09-24)

**Problém (Petr, iOS i Android)**: v režimu řazení nejde s více položkami scrollovat, jen občas „popojede".
**Příčina**: `react-native-draggable-flatlist` obaluje CELÝ seznam pan gestem (aktivace po 10 bodech
svisle) a my ho vnořujeme do ScrollView → dvě gesta soupeří o každý svislý tah. Vnoření knihovna
nepodporuje (známé od 2018), neudržuje se a nedeklaruje Reanimated 4. Navíc chybí autoscroll
(stránka se při tažení zamyká) a úchyt u návyků má 28 pt.
**Rozhodnutí Petra: varianta B** — přechod na `react-native-sortables` (udržovaná, Reanimated 4,
nová architektura, čistý JS → bez nového buildu).

- [x] 1. Instalace `react-native-sortables` + ověření kompatibility (Reanimated 4.2, worklets 0.7, RNGH 2.30, Expo 55)
- [x] 2. Společná komponenta pro řazení + úchyt 44 pt (jedno chování pro návyky i cíle)
- [x] 3. Návyky: seznam + úchyt v kartě návyku
- [x] 4. Cíle: seznam + úchyt v kartě cíle
- [x] 5. Haptika (zvednutí / prohození / puštění) podle uživatelského nastavení vibrací
- [x] 6. Pojistka: režim řazení se při odchodu z obrazovky vypne (známé zaseknutí na iOS s RNGH 2)
- [x] 7. Testy + negativní kontrola, `npx tsc --noEmit`, `npm test`
- [x] 8. Průvodci @technical-guides:Habits.md + @technical-guides:Goals.md — sekce Řazení
- [x] 9. **Device test Petr** (iOS + Android) — ✅ 2026-09-24: „rychlý, 100% spokojenost"

**Mimo rozsah (čeká na rozhodnutí Petra)**: mrtvá obrazovka `reorder-habits` a odinstalace staré knihovny.

---

## ✅ HOTOVO: Android build spadl — AdMob SDK vs. Kotlin (2026-07-30)

`react-native-google-mobile-ads` byl `^16.0.1` → npm vytáhl 16.4.0 s `play-services-ads`
zkompilovaným Kotlinem 2.3.0, zatímco Expo SDK 55 staví Kotlinem 2.1.20. **Pin na přesně
`16.0.2`**; ověřeno reálným buildem (`:app:bundleRelease` ✅). Tabulka verzí + měřicí skript
+ varování o KSP: @technical-guides:AdMob.md. Detaily: @implementation-history.md.

---

## ✅ HOTOVO: První spuštění — dotaz na notifikace (2026-07-16)

**Problém**: testeři vůbec nezjistili, že aplikace umí připomínky (obě jsou default OFF, schované v Nastavení).

**Řešení**: uvítací brána má nově **3. krok „🔔 Notifikace"** (jazyk → vzhled → notifikace). Po „Ano, chci" se zapnou **OBĚ** denní připomínky naráz a hned naplánují.

- [x] Pre-permission („priming") dotaz vlastním oknem — **systémový dotaz jde položit jen JEDNOU za instalaci**, takže se nesmí pálit naslepo. „Teď ne" ho nechá nespálený → přepínač v Nastavení funguje i později (praxe špičkových aplikací; odsouhlaseno Petrem)
- [x] `notificationOptIn.ts` → `enableAllRemindersAfterOptIn()`: OS dotaz → zapnout obě → `rescheduleAll()`. Nikdy nehází výjimku (selhání nesmí zablokovat onboarding)
- [x] Pořadí: zavřít bránu → **teprve pak** systémový dotaz → `await` → tutoriál (dva modaly naráz = iOS deadlock)
- [x] i18n EN/DE/ES; Android `POST_NOTIFICATIONS` už v app.json (bez native změny)
- [x] 6 regresních testů; tsc 0 chyb, 520/520 testů, eslint 0 errors
- [ ] **Device test na čisté instalaci** (systémový dotaz nelze spustit v testech)

**Orchestrator**: dotaz **není** krok pipeline, ale ochranu dědí — brána běží až po `awaitStartupComplete()`, takže se nikdy nepotká s ATT/UMP. Detaily: @implementation-history.md → „First-Launch Notification Opt-In"; pravidla: @technical-guides:Notifications.md → „First-Launch Opt-In (Priming)"

---

## 📱 Android device test 2026-07-26 — UX nálezy (ikona, tutoriál, lišta)

> Petr testoval Android build na Xiaomi Redmi 8 Pro. **Bod 1 vyřešen, body 2–4
> čekají na rozhodnutí bod po bodu.**
> Nálezy a návrhy: @docs/audits/ux-android-2026-07-26-nalezy.md
>
> 1. ✅ **Ikona (hotovo 2026-08-02)** — „S" sahalo do 92 % plátna, Android
>    ořezává na 67 %. Zmenšeno na 0,721× (dosah 473 → 339 px, limit 341).
>    Přidána `monochrome` vrstva (Android 13+) a iOS 18 varianty `dark`
>    + `tinted`. Jen obrázky + `app.json`, **žádná změna kódu**.
>    Navíc opraveno **5 zbytků po zpackaném ořezu pozadí** v samotné kresbě
>    (viditelné jen na ikonách s průhledností). Čeká na ověření na zařízení.
> 2. **Tutoriál — oříznutý text [VYSOKÁ]** — `contentCard maxHeight: safeHeight * 0.3`
>    (`TutorialOverlay.tsx:409`) + výpočet výšky s poznámkou `Assume 2 lines max`
>    (`:138`), přitom **17 z 18 kroků má 3–8 řádků**. Text je ve ScrollView, ale
>    scrollbar je proužek, kterého si nikdo nevšimne.
> 3. **Spodní lišta se neztmaví** — hypotéza: androidí `elevation` React Navigation
>    přebíjí `zIndex` overlaye. ⚠️ neověřeno na zařízení.
> 4. ✅ **[STRATEGICKÉ] 25krokový tutoriál** — Petr schválil přepracování
>    2026-08-02. Plán níže.

---

## 🚧 Přepracování onboardingu — 25 kroků → 3 obrazovky (43/44 hotovo)

> 📘 **Technická pravidla a logika pro Onboarding: @technical-guides:Tutorial.md**
> Guide byl kvůli tomuto přepracování celý přepsán a je **nadřazený** tomuto seznamu:
> 5 kritických pravidel, integrační kontrakt K1–K7, storage klíče, brána trofejí.

**Hotovo** (etapy A–H): data a překlady, skelet a napojení, D-KIT stavební bloky,
obrazovky 1–3 (návyk → cíl → první odškrtnutí), uvítací obrazovka F5, přesun zbytku,
úklid starého 25krokového flow. Z ~28 ťuknutí na ~7; uživatel odchází s návykem, cílem,
prvním odškrtnutím a prvním XP.

**Zbývá:**
- [ ] H4b Device test (světlý/tmavý × EN/DE/ES × malý displej × tablet;
      němčina musí u cíle ukázat „Bücher" a €)

**Nesahat:** `OnboardingPreferencesModal.tsx`, `tutorialAchievementGate.ts`,
`AchievementContext.tsx:343`, `TUTORIAL_STORAGE_KEYS` (čte i XpAnimationContext).

---

## 🎯 AKTUÁLNÍ ÚKOL: XP oznámení — přepracování podání (2026-08-03)

**Nálezy testerky** (Android + iOS) + vlastní průzkum. Všechno **ověřené v kódu** — ani jeden
nález není zařízením.

1. 🔴 **„5 habits completed" při klikání na JEDEN návyk.** `batchXpGains()` počítá **události,
   ne entity** (`count: existing.count + 1`), a událost `xpSmartNotification`
   ([gamificationService.ts:2469](src/services/gamificationService.ts#L2469)) **nenese `sourceId`**
   — identita se zahodí, takže „5 návyků" od „jeden 5×" nejde rozlišit.
2. 🔴 **Odškrtnutí počet ZVYŠUJE.** Zaškrtnu/odškrtnu/zaškrtnu → „3 habits completed",
   XP je přitom správně (`+25 −25 +25`). Platí i pro smazaný záznam v deníku a mínusový pokrok u cíle.
3. 🔴 **Blikání a „skákání".** `XpAnimationContainer` vyrábí **nové pole při každém renderu**
   (`pendingNotifications.map(...)`) → `useEffect([xpGains])` přepočte `batchedData` → a protože
   na `batchedData` visí i **animační efekt**, resetuje se `opacity` na 0 a nástup se přehraje znovu.
   XP bubliny se rodí a mizí každých 1,4 s → oznámení se přeanimovává, i když uživatel nic nedělá.
   Není to starým Androidem, běží to i na iOS — rychlý telefon to jen schová.
4. 🟠 **Čím víc aktivity, tím hektičtější.** `shouldUseReducedMotion = xpGains.length > 3`
   animace **zrychlí** (300→150 ms) a zobrazení **zkrátí** (3→2 s). Přesně naopak, než má být.
5. 🟠 **Malé/placaté popupy na Androidu.** `XpPopupAnimation` jako jediná komponenta nepoužívá
   `scaleFont()` (natvrdo `fontSize: 16`). Stín je **mrtvý kód**: předává se `shadowColor`, ale
   chybí `shadowOpacity`, `shadowRadius` i `elevation` → nevykreslí se nic, na Androidu obzvlášť.
6. 🟠 **NOVÝ: jeden ťuk u cíle = „2 goals".** `GOAL_PROGRESS` i `GOAL_COMPLETION` spadají do
   stejné skupiny `goals` ([SQLiteGoalStorage.ts:566](src/services/storage/SQLiteGoalStorage.ts#L566)
   pošle obě události naráz, když pokrok cíl dokončí).
7. 🟠 **NOVÝ: věta vždy končí slovem „completed".** I u deníku („3 journal entries completed"),
   u sérií („streaks completed") a u trofejí. Právě tohle Petr myslel tím „aby to dávalo smysl".

**Cíl**: jedno stabilní oznámení, které **neodskakuje** — naskočí jednou, dál jen tiše
aktualizuje obsah, zmizí ~2 s po poslední akci. A **věta, která je pravdivá**.

**Co NESMÍ se rozbít**: výpočet XP (je správný!), okamžitost popupů (0 ms, pravidlo z guide),
ModalQueue a level-up okna, potlačení během onboardingu, haptika (Petr ji schválil jak je),
překrývání popupů na stejném místě (Petr potvrdil, že vypadá dobře).

### 🌍 ROZSAH: globální, ne jen návyky

Popup i souhrnné oznámení jsou **jedna komponenta pro celou aplikaci** — `XpAnimationContainer`
visí v [RootProvider.tsx:29](src/contexts/RootProvider.tsx#L29), tedy nad všemi obrazovkami.
Zdroj událostí je taky jediný: `triggerXPAnimation`
([gamificationService.ts:2447](src/services/gamificationService.ts#L2447)) pro **všechny** typy XP.
→ **FIX 2, 3 a 4 jsou tím pádem automaticky globální** (jedna komponenta = jedna oprava).

### 📐 ROZHODNUTÍ PETRA: co je „jedna věc" se liší podle oblasti

> „Cíle — tohle je v pořádku, pokud dávám progres a ne mínus, na to je potřeba dávat pozor."

Zavádí se **dva režimy počítání** podle typu zdroje:

| Režim | Význam | Zdroje |
|---|---|---|
| **`entity`** | přepínač — opakovaný ťuk na TÉŽE věc = pořád jedna věc (klíč `sourceId`) | návyk (splnění i bonus), **dokončení cíle**, trofej |
| **`event`** | přírůstek — každý kladný záznam je samostatná věc | **pokrok u cíle**, záznam v deníku, milníky, série, měsíční výzvy |

**Záporný zisk nikdy nezvyšuje počet** — v režimu `entity` ruší dřívější zaškrtnutí téhož
`sourceId`, v režimu `event` snižuje počet (nejméně na 0). Když nezbude nic kladného,
oznámení ukáže dnešní „📉 Progress reversed", ne vymyšlený počet.

| Oblast | Dnes | Po opravě |
|---|---|---|
| **Návyky** | 1 návyk 5× → „5 habits completed" | „1 habit completed" |
| **Návyky — odškrtnutí** | zvyšuje počet | ruší dřívější zaškrtnutí |
| **Cíle — pokrok** | ✅ počítá se každý záznam (Petrovo rozhodnutí) | beze změny + mínus odečítá |
| **Cíle — dokončení** | 🔴 jeden ťuk → „2 goals" | „1 goal completed", vlastní skupina |
| **Deník — psaní** | ✅ počet je správně | beze změny |
| **Deník — smazání** | 🔴 napsat + smazat → „2 journal entries" (XP je 0) | nezobrazí se |
| Trofeje, výzvy, násobiče | ok | ok |
| Level-up (nemá `sourceId`) | ok | fallback na počet událostí |

---

### FIX 1 [🔴] — Počítá se to, co se opravdu stalo

- [x] 1.1 `xpSmartNotification` doplnit o **`sourceId`** — **NEJDŘÍV** do `AppEvents`
      ([appEvents.ts:117](src/utils/appEvents.ts#L117)), pak teprve do emitu
      (`triggerXPAnimation` už `sourceId` má, jen ho do tohoto eventu neposílá)
- [x] 1.2 `XpGain` (v kontextu i v komponentě) + `showSmartNotification()` protáhnout
      `sourceId` jako **volitelný** (level-up a `xpBatchCommitted` ho nemají)
- [x] 1.3 **Vytáhnout čistou logiku** z komponenty do `xpNotificationBatching.ts`
      (bez Reactu → jde otestovat; dnes je uvnitř `XpNotification.tsx` a testovat nejde)
- [x] 1.4 Implementovat režimy `entity` / `event` podle tabulky výše
- [x] 1.5 Záporné zisky: `entity` = odebrat `sourceId` ze sady, `event` = odečíst (min. 0)
- [x] 1.6 **Rozdělit `GOAL_COMPLETION` do vlastní skupiny** (jinak jeden ťuk = „2 goals")
- [x] 1.7 **Sloveso podle skupiny** místo věčného „completed": splněno / zapsáno /
      zaznamenáno / dosaženo / odemčeno. U smíšených zdrojů věta **bez slovesa**
      („🎉 2 habits · 3 journal entries"), XP se stejně ukazuje zvlášť vpravo
- [x] 1.8 Překlady **EN + DE + ES** + `src/types/i18n.ts` (hlídá `localeParity.test.ts`)
- [x] 1.9 Testy: 1 návyk 5× → „1"; 3 návyky → „3"; zaškrtnout+odškrtnout → žádné „2";
      1 cíl 5× pokrok → „5"; pokrok + mínus → „4"; ťuk dokončující cíl → „1 goal completed"
      a ne „2 goals"; deník napsat+smazat → nezobrazí se; bez `sourceId` → fallback

### FIX 2 [🔴] — Oznámení přestane blikat a skákat

- [x] 2.1 `XpAnimationContainer`: **přestat vyrábět nové pole** při každém renderu (`useMemo`)
- [x] 2.2 **Oddělit nástup od aktualizace obsahu**: nástupní animace se spustí JEN při
      přechodu neviditelné→viditelné. Změna obsahu jen překreslí text — **žádný reset
      `opacity`/`translateY`**
- [x] 2.3 **Odpočet do zmizení se novým XP prodlouží**, ne restartuje animaci
      (klouzavé okno ~2,5 s od poslední akce)
- [x] 2.4 Test: opakované zisky během viditelnosti **nesmí** resetovat `opacity` na 0

### FIX 3 [🟠] — Klid místo zrychlování

- [x] 3.1 Zrušit `shouldUseReducedMotion` navázané na `xpGains.length > 3`
- [x] 3.2 Respektovat **systémové „omezit pohyb"** přes existující `useAccessibility()`
      ([useAccessibility.ts:11](src/hooks/useAccessibility.ts#L11)) — hook bez provideru,
      používají ho i trofeje

### FIX 4 [🟠] — Popup viditelný i na Androidu

- [x] 4.1 `scaleFont()` na text i ikonu (sjednotit se zbytkem aplikace), ikonu zvětšit
- [x] 4.2 Doplnit **funkční** stín: `shadowOpacity` + `shadowRadius` + **`elevation`**
      — ⚠️ **JEN pro světlý režim**. technical-guides.md → „NEVER use shadows in dark mode"
      zakazuje i `elevation`; v tmavém držet hloubku přes `cardBackgroundElevated` + border
- [x] 4.3 Totéž zkontrolovat u `XpNotification` (taky bez stínu) a ověřit obě platformy

### FIX 5 — Ověření a dokumentace

- [x] 5.1 `npx tsc --noEmit` 0 chyb + celá test suite zelená (Node ≥ 22.5)
- [x] 5.2 U nových testů **ověřit i testy** — schválně rozbít, co hlídají (pravidlo 9)
- [x] 5.3 Aktualizovat @technical-guides:Gamification-UI.md — implementace se od průvodce
      rozešla. Doplnit: režimy počítání, „oznámení se nesmí přeanimovat při aktualizaci obsahu",
      stín jen ve světlém režimu
- [x] 5.4 **Device test — kolo 1 hotovo** (testerka, Android, tmavý režim). Souhrnná lišta
      a texty v pořádku, ale **XP bublina se ukazovala v poloviční velikosti** a správná
      velikost jen problikla → viz FIX 6

### FIX 6 [🔴] — Bublina se zasekávala v malé fázi (Android) — HOTOVO

**Příčina** (prokázaná ze snímků): rozdíl velikostí NENÍ font, je to `scale` transformace.
Důkaz — malý popup je zároveň posunutý doleva, protože `translateX` byl v poli transformací
**až za `scale`**, takže se jím násobil (50 px při 0,5 vs. 57 px při 1,15).
Animace běžela jako **tři navazující kroky**; nativní vrstva dostane jen první z nich a mezi
každými dvěma se musí zeptat JS vlákna — které v ten okamžik zapisuje splnění do SQLite
a překresluje seznam návyků. Na Androidu se animace zasekla, obvykle v úvodní malé fázi.
iOS stejnou pauzu jen schová, takže „na iOS to funguje" tady nic nedokazuje.

- [x] 6.1 Vytáhnout časovou osu do `xpPopupTimeline.ts` (data místo kódu → testovatelné)
- [x] 6.2 Jedna hodnota 0→1 hnaná nativně + `interpolate()` na měřítko, průhlednost a posun
      → **nula dotazů na JS vlákno** během běhu animace
- [x] 6.3 Zrušit `setValue()` v efektu (každá bublina je nová instance, není co resetovat)
      a zakládat hodnotu rovnou správně (dřív `0.8` → korekce na `0.5` o snímek později)
- [x] 6.4 `Easing.linear` — tvarování je v klíčových snímcích, výchozí easing by je roztáhl
- [x] 6.5 Přesunout posuny **před** `scale`, aby se jimi nenásobily
- [x] 6.6 22 testů časové osy + ověřeno třemi schválnými rozbitími (pravidlo 9)
- [x] 6.7 Průvodce: @technical-guides:Gamification-UI.md — pravidlo „jedna osa, nula
      mezikroků" a „posuny mimo měřítko"
- [x] 6.8 **Device test kolo 2 — POTVRZENO** (testerka, Android): bublina naskakuje
      správně a plynule, stejně jako na iOS

### FIX 7 [🟠] — Souhrnná lišta škubala — HOTOVO

**Jiná příčina než u bubliny.** Lišta neběží v navazujících krocích, takže se JS vlákna
uprostřed animace neptá. Škubala proto, že **zůstává připojená a překresluje se při každém
novém XP** (při rychlém klikání několikrát za vteřinu) — a při každém překreslení dostávala
animovaná vrstva **nový objekt se styly**. React Native na to reaguje odpojením a znovupřipojením
nativních uzlů animace; když se to stane uprostřed běhu, je to vidět jako trhnutí.
`StyleSheet.create` se navíc volal při každém překreslení.

- [x] 7.1 Jedna hodnota „přítomnost" 0→1 místo tří hodnot + tří `setValue` + tří animací.
      Nástup = k 1, odchod = k 0, nové XP během mizení jen **otočí směr z místa, kde je**
- [x] 7.2 Ustálit stylopis (`useMemo`) i pole stylů animované vrstvy → konec odpojování
- [x] 7.3 Ustálit skládání textu a hlášení pro odečítač obrazovky
- [x] 7.4 Zrušit `setValue` úplně; nulování jen když je lišta mimo strom (není vidět)
- [x] 7.5 Průvodce: @technical-guides:Gamification-UI.md — dvě nová pravidla
- [ ] 7.6 **Device test** (testerka, Android): rychlé klikání na návyky, lišta nesmí škubat

⚠️ **Automatickými testy nepokryto.** `__tests__/setup.ts` nahrazuje celý modul react-native
stubem bez `View`/`Animated`, takže vykreslovací test tu bez zásahu do globálního nastavení
napsat nejde. Ověřeno jen typovou kontrolou, lintem, regresní sadou a device testem.

**Neřešeno (samostatný nález):** průvodce v sekci Accessibility tvrdí, že popup respektuje
systémové „omezit pohyb" — **nerespektuje**. Souhrnná lišta ano (FIX 3), bublina ne.

---

## 🎯 AKTUÁLNÍ ÚKOL: Startup Orchestrator — sekvenční startovací pipeline

> 📘 **Technická pravidla a logika pro Startup Orchestrator: @technical-guides:Startup-Orchestrator.md**
> (vytvořen 2026-07-20 — 3 kritická pravidla, kontrakt StartupStep, bariéra,
> app-ready gate, DB init/migrace, nebezpečné zóny. **Guide je nadřazený tomuto
> plánu** — sekce níže je historický kontext zadání a smí se archivovat.)

**Cíl**: Univerzální, budoucnostně odolný systém, který zaručí, že se při startu aplikace nikdy nezobrazí dvě „okna" (nativní systémová: ATT, souhlas s reklamami, oznámení… i naše RN: uvítací brána, tutoriál) přes sebe → **konec iOS dual-modal zamrzávání na prvním spuštění, bez ohledu na počet a pořadí systémových oken**.

**Proč**: Externí tester zamrzl na prvním spuštění. Dnešní `src/utils/startupGate.ts` zná napevno **jen 2 úkoly** (`att`, `consent`) — je to záplata na dvě konkrétní okna, ne systém. Jakmile přibude libovolné další startovací okno (budoucí EU souhlas, druhá vrstva UMP „Manage options"/partneři, cokoliv), princip se rozbije. Potřebujeme řešení odolné vůči **počtu i pořadí** oken („EU přidá dalších 20").

**Aktuální realita v kódu (co orchestrator nahrazuje)**:
- Startovací nativní okna jsou dnes **přesně dvě**: **ATT** (iOS) + **UMP souhlas** (AdMob). Nic víc se při startu neptá.
- **Oznámení NEJSOU startovací okno** — `notificationService.initialize()` ([notificationService.ts:49](src/services/notifications/notificationService.ts#L49)) jen zakládá Android kanály; `requestPermissions()` ([:94](src/services/notifications/notificationService.ts#L94)) volá jedině obrazovka Nastavení. Uživatel si oznámení zapíná sám → do pipeline nepatří.
- Tři nezávislá místa dnes: ATT v `useFirebaseAnalytics` ([:52+](src/hooks/useFirebaseAnalytics.ts)), UMP v `initializeAdsWithConsent` ([adConsentService.ts:43](src/services/adConsentService.ts#L43)), tutoriál čeká přes `waitForStartupModals()` ([TutorialContext.tsx:1653](src/contexts/TutorialContext.tsx#L1653)). Orchestrator je sjednotí do jedné sekvence.
- Pozn.: tester nejspíš běžel na buildu **před** `startupGate` fixem (commit `b125cd4` ještě není v TestFlight buildu) — L1 to řeší tak jako tak a natrvalo.

**Princip** (osvědčené vzory: Apple HIG „one-at-a-time permissions", iOS Coordinator pattern, Android Jetpack App Startup, onboarding jako finite state machine, enterprise CMP):
1. **Jeden dirigent, striktně sekvenčně** — žádná dvě systémová okna paralelně; vždy zobraz → počkej na zavření → další.
2. **Naše UI je za závorou** — uvítací brána a tutoriál naskočí AŽ po vyprázdnění systémové pipeline (nahradí křehký časovač).
3. **Jedna autorita nad „je něco na obrazovce"** — pipeline splývá s existující ModalQueue: systémová okna první, naše potom, nikdy překryv.

**Co NESMÍ se rozbít**: ATT flow, UMP souhlas (+ Crashlytics zapnutí po něm), pořadí ATT→UMP, uvítací brána (jazyk/theme), tutoriál (autostart + resume), ModalQueue invariant.

---

### 🥇 ÚROVEŇ 1: Orchestrator + pipeline v kódu (kroky napevno)

**Rozsah**: nahradit dnešní 2-úkolový `startupGate.ts` obecnou sekvenční pipeline; ATT + UMP přebalit do „kroků"; tutoriál + uvítací bránu napojit na jeden signál „startup complete". Pipeline dnes drží **přesně `[att, adConsent]`** — hodnota je, že KAŽDÝ budoucí krok je jen jedna položka navíc.

> ⚠️ **KRITICKÁ PRAVIDLA (ověřeno prověrkou plánu 2026-07-14 — bez nich systém NEFUNGUJE):**
> 1. **Timeout NIKDY neobaluje interaktivní zobrazení okna.** Nativní prompt čeká na uživatele libovolně dlouho; krátký timeout přes zobrazené okno = orchestrator pokračuje a pustí tutoriál přes otevřený prompt = **přesně to zamrznutí, které řešíme**. Timeout patří JEN na neinteraktivní přípravu (síť). Zobrazené okno má jen dlouhou crash-pojistku (~5 min), ne pacing timeout (stejný princip jako `tutorialAchievementGate` 120 s).
> 2. **Reklamy + Crashlytics běží VŽDY, ne gated přes `shouldRun`.** Dnes jsou v `finally` ([adConsentService.ts:65-69](src/services/adConsentService.ts#L65)) → běží i bez formuláře. Gating jen na modalový krok by non-EEA uživatele (bez formuláře) připravil o reklamy i crash reporting.
> 3. **Zachovat pořadí ATT → zapnout analytics → app_open** (dnes záměr v [useFirebaseAnalytics.ts:68-83](src/hooks/useFirebaseAnalytics.ts#L68)). Zapnutí analytics navázat na dokončení ATT kroku.

- [x] **1.1 Typ kroku** `StartupStep` v novém `src/services/startup/types.ts`: `{ id; shouldRun(): Promise<boolean>; prepare?(): Promise<void>; present(): Promise<void>; prepTimeoutMs: number; critical?: boolean }` — **prepare/present split** (pravidlo 1 vynuceno strukturálně, ne disciplínou v každém kroku)
  - `shouldRun()` = idempotence/resume, **jen levné/lokální checky** (ATT: `Platform.OS==='ios'` && `getTrackingPermissionsAsync()==='undetermined'`; adConsent: **triviálně `true`** — `present()` si interně zobrazí formulář jen když je potřeba)
  - `prepare?()` = **neinteraktivní** příprava (síť), kterou orchestrator obalí `prepTimeoutMs` (fail-open: timeout/chyba → modal se přeskočí, sekvence jede dál). Bez UI.
  - `present()` = zobraz okno a **await na zavření uživatelem BEZ krátkého timeoutu** (u UMP vč. „Manage options"/partneři); jen dlouhá crash-pojistka (~5 min) na zaseknuté SDK
  - `prepTimeoutMs` = timeout **jen na `prepare()`**; `critical=false` default
- [x] **1.2 Nový `src/services/startup/startupOrchestrator.ts`** — nahrazuje `src/utils/startupGate.ts` (celý)
  - Drží `pipeline: StartupStep[] = [attStep, adConsentStep]`
  - `runStartupSequence()`: nejdřív **app-ready gate** (fonty ✓ · DB ✓ · `AppState.currentState==='active'` · po prvním snímku via `InteractionManager`/`requestAnimationFrame`), pak `for (const step of pipeline)` → `if (await step.shouldRun()) await step.present()` **striktně za sebou**. Timeout si řídí `present()` sám JEN na přípravné fázi (viz pravidlo 1)
  - Po doběhnutí nastaví latching flag + rozresolvuje čekatele → veřejné **`awaitStartupComplete(): Promise<void>`** (bariéra s pamětí — listener nezmešká, i když se přihlásí až po doběhnutí)
  - Guard proti dvojímu spuštění (StrictMode/re-mount)
- [x] **1.3 `src/services/startup/steps/attStep.ts`** — vytáhnout logiku z `useFirebaseAnalytics.handleATTPermission` ([useFirebaseAnalytics.ts:93](src/hooks/useFirebaseAnalytics.ts#L93)). `present()` čeká na odpověď (bez timeoutu). Hook si nechá Analytics instance, ale **ATT prompt spouští orchestrator**; **zapnutí analytics + `app_open` se přesune AŽ za dokončení ATT kroku** (pravidlo 3) — hook počká na `awaitAttComplete()` z orchestratoru, nebo to spustí orchestrator po att kroku. Odstranit `markStartupTaskComplete('att')` (řl. 75/92)
- [x] **1.4 `src/services/startup/steps/adConsentStep.ts`** — modalová část z `initializeAdsWithConsent`: `present()` = `requestInfoUpdate` (s `prepTimeoutMs`) + `loadAndShowConsentFormIfRequired` (bez timeoutu, čeká na uživatele vč. „Manage options"). Pořadí ATT→UMP je dané pozicí v poli (`waitForATT()` smazat). `showPrivacyOptionsForm()` beze změny (Settings)
- [x] **1.4b Bezpodmínečná startovní práce** (pravidlo 2, **NE modalový krok**) — `mobileAds().initialize()` + `CrashReportingService.enable()` běží **po consent kroku vždy**, i když byl formulář přeskočen. Buď v orchestratoru po sekvenci, nebo ve `finally` uvnitř `present()` adConsent kroku — hlavně **nikdy negated přes shouldRun**. Zachovat privacy-first pořadí (enable až po consent flow)
- [x] **1.5 Napojit v `app/_layout.tsx` → `LayoutContent`** — jedno `runStartupSequence()` místo dnešního: `useFirebaseAnalytics()` (ATT část, [:56](app/_layout.tsx)) + `useEffect(initializeAdsWithConsent)` ([:60](app/_layout.tsx)). Spustit až po `dbInitialized`. `useNotificationLifecycle` ([:52](app/_layout.tsx)) beze změny (netýká se)
- [x] **1.6 Tutoriál + uvítací brána za závorou** — `TutorialContext.autoStartTutorial` ([:1604](src/contexts/TutorialContext.tsx#L1604)): `await waitForStartupModals()` ([:1653](src/contexts/TutorialContext.tsx#L1653)) → `await awaitStartupComplete()`; import z orchestratoru. `setShowOnboardingPrefs(true)` ([:1629](src/contexts/TutorialContext.tsx#L1629)) běží až po tomto — beze změny logiky
- [x] **1.7 Smazat `src/utils/startupGate.ts`** po migraci konzumentů (dnes: TutorialContext, useFirebaseAnalytics, adConsentService) + upravit importy
- [x] **1.8 Regresní testy** `src/services/startup/__tests__/startupOrchestrator.test.ts`: (a) striktní sekvenčnost — krok B nezačne, dokud A nedoběhne; (b) idempotence — `shouldRun()===false` přeskočí (resume po force-quit); (c) **prep-timeout, NE present-timeout** — pomalá příprava vyprší a jede dál, ALE „pomalý uživatel" u zobrazeného okna sekvenci NEposune (pravidlo 1); (d) **reklamy+Crashlytics běží i když consent formulář skipnut** (pravidlo 2); (e) rozšiřitelnost — 3. mock-krok nic nerozbije; (f) `awaitStartupComplete` resolvne i pro pozdního čekatele
- [x] **1.9 Verifikace**: `tsc` 0 chyb + celá suite zelená (Node ≥ 22.5); **device re-test na čisté instalaci** (scénář testera — proklikat ATT i „Manage options" v UMP, včetně pomalého klikání)

**Nebezpečné zóny**:
- ATT `requestTrackingPermissionsAsync` **musí** běžet při `AppState==='active'` a po prvním snímku (jinak iOS prompt tiše zahodí) → app-ready gate to hlídá.
- ⛔ **Nikdy timeout přes zobrazené okno** (pravidlo 1) — nejčastější způsob, jak si tenhle systém znovu rozbít.
- Reklamy + Crashlytics **bezpodmínečně** (pravidlo 2).

**✅ Brief Review (implementováno 2026-07-14)**: Postaveno přesně dle plánu vč. všech 3 kritických pravidel. Struktura: `src/services/startup/{types,startupOrchestrator,index}.ts` + `steps/{attStep,adConsentStep}.ts`. Jádro `createStartupOrchestrator(pipeline, {waitForAppReady})` je čisté a testovatelné (bez nativních importů); wiring singleton v `index.ts`. **Pravidlo 1** zajištěno strukturálně: rozhraní `StartupStep` odděluje `prepare()` (síť, timeoutovaná) od `present()` (interaktivní, JEN 5min crash-pojistka). **Pravidlo 2**: `finalizeAdsAndDiagnostics()` (reklamy+Crashlytics) volá wiring v `_layout` po sekvenci **vždy**. **Pravidlo 3**: `initAnalyticsAfterConsent()` běží až po `runStartupSequence()`. Nativní moduly v krocích přes lazy `require()`. Smazán `startupGate.ts`. Testy: `startupOrchestrator.test.ts` (9 testů vč. „pomalý uživatel neposune sekvenci"). tsc 0 chyb, 393/393 testů (25/25 suites). **⏳ Zbývá device test** na čisté instalaci. Detaily: @implementation-history.md → „Startup Orchestrator (July 14, 2026)".

---

### 🥈 ÚROVEŇ 2: Pipeline řízená remote configem (nulové nasazování přes update)

**Rozsah**: zapnutí/pořadí/timeouty (a u „consent-only" oken i texty) registrovaných kroků přichází z **Firebase Remote Config** → nové EU okno zapneš **bez aktualizace v App Store**. Firebase `app`+`analytics`+`crashlytics` už v projektu jsou (v23.8.8); `remote-config` **není** nainstalovaný. Stavíme až po device ověření Úrovně 1.

- [ ] **2.1 Instalace** `@react-native-firebase/remote-config@^23.8.8` (sladit verzi s ostatními RNFB) → vyžádá `expo prebuild --clean` + rebuild; wrapper po vzoru `crashReportingService.ts` (bezpečný no-op v Jest/Expo Go, NIKDY neimportovat RNFB přímo)
- [ ] **2.2 Remote schéma** — versionovaný JSON: `[{ id, enabled, order, timeoutMs, critical }]`. Config **nikdy neposílá kód** — jen vybírá/řadí kroky z registru (2.3) podle `id`
- [ ] **2.3 Registr kroků** — mapa `id → StartupStep` (z Úrovně 1: `att`, `adConsent`). Orchestrator sestaví běhovou pipeline = registr ∩ remote schéma, seřazeno dle `order`. **Neznámé `id` z configu se bezpečně ignoruje** (starý build + nový config nespadne)
- [ ] **2.4 Fetch s bezpečným defaultem** — `fetchAndActivate()` s krátkým timeoutem v app-ready gate; když config nedorazí/je nevalidní → **fallback na zabudovanou pipeline z Úrovně 1** (appka se nikdy nezasekne kvůli configu). Cache dle RNFB `minimumFetchInterval`
- [ ] **2.5 „Consent-only" kroky z dat** — generický `RemoteConsentStep` (emoji/nadpis/text/tlačítka + uložení volby do AsyncStorage) plně definovatelný z configu → nové čistě souhlasové okno **bez nového buildu** (princip CMP jako OneTrust/Didomi). Vizuál = CelebrationModal standard.
  - ⚠️ **Můstek await-na-zavření**: RN `<Modal>` (na rozdíl od nativních kroků) nemá promise, který se resolvuje při zavření. `present()` musí modal zobrazit a **vrátit promise, který resolvne až po tapu na tlačítko**. Přes ModalQueue to znamená: enqueue + počkat na `closeCurrentModal`/callback daného modalu. Musí ctít ModalQueue **pinning invariant** (zobrazené čelo se nepřeřazuje) — jinak se do toho vrací dual-modal zamrznutí.
- [ ] **2.6 Telemetrie** — log které kroky proběhly/skipnuly/vypršely do Firebase (diagnostika budoucích zamrznutí u testerů) přes `crashReportingService.log()`
- [ ] **2.7 Testy**: fallback na default při nedostupném/nevalidním/prázdném configu; neznámé `id` ignorováno; změna `order`/`enabled` přes config se projeví; `RemoteConsentStep` uloží volbu a projde ModalQueue
- [ ] **2.8 Dokumentace** — nový `technical-guides:Startup-Orchestrator.md` (architektura, jak přidat krok v kódu i přes config, app-ready gate, invarianty, vazba na ModalQueue + jeho pinning pravidlo)

**Doporučení**: Úroveň 1 teď (vyřeší problém natrvalo, čistě v kódu, testovatelné). Úroveň 2 jako druhý krok po device ověření L1 — přidává hodnotu (compliance bez App Store updatu), ale i závislost na síti + nový native modul (`prebuild`), takže až na stabilním základu.

---

### ✅ Nedávno dokončeno (2026-07-14, detaily v @implementation-history.md)

- Onboarding Preferences Gate (jazyk/theme před tutoriálem) — hotovo
- First-launch freeze — koordinace ATT/UMP + tutoriál (dnešní `startupGate.ts`) — hotovo *(Úroveň 1 tohle zobecní)*
- Goals split-brain [🔴] — 7 míst četlo cíle z prázdného AsyncStorage → 8 mrtvých goal trofejí + Depth Explorer výzva; storage helpery otypovány (kořen neviditelnosti)
- Skryté chyby odhalené typováním: vyhledávání v deníku (`searchByContent` chyběl), signatura `create()`, typ parametru v xpMultiplier
- Achievement batch truncation — katalog 78 > limit 50 → 28 trofejí se nikdy nekontrolovalo
- Tutorial↔achievement handshake (`tutorialAchievementGate.ts`) — čeká na modal jen když opravdu přijde
- XP bar na Home — text vs. bar sjednoceny na škálu v rámci levelu
- ModalQueue deadlock [🔴] — zobrazené čelo fronty se přeřadilo → 2 modaly v 1 snímku; čelo je teď pinnuté
- Ověřeno: tsc 0 chyb, 384/384 testů (24/24 suites). Commit `b125cd4`.

---

## 📈 PLANNED: Meta Ads & Marketing Analytics Integration

**Goal**: Připravit SelfRise V2 pro běh marketingových kampaní na Meta Ads (Facebook + Instagram) a zároveň začít aktivně sbírat custom eventy do Firebase Analytics pro vlastní reporting.

**Background** (potvrzeno auditem 2026-05-18):
- ✅ Firebase Analytics SDK instalovaný, hook `useFirebaseAnalytics` napojený v `app/_layout.tsx`
- ✅ ATT (App Tracking Transparency) plugin + permission flow funkční
- ✅ SKAdNetwork 48 ID v `app.json` (včetně Meta `v9wttpbfk9`, `n38lu8286q`)
- ✅ AdMob bannery + rewarded ads kompletní – **nekolidují s Meta Ads akvizicí** (různý účel: AdMob = monetizace, Meta Ads = akvizice)
- ⚠️ Žádné custom eventy se zatím nelogují (kromě `app_open` a `att_permission_response`)
- ⚠️ Meta SDK (`react-native-fbsdk-next`) NENÍ nainstalovaný
- ⚠️ Premium tier NENÍ v plánu – Value Optimization eventy v Metě vynechány

---

### 🧑 Část A: Úkoly pro Petra (mimo kód)

Tyto kroky musí Petr udělat v externích nástrojích – kód na nich závisí:

- [ ] **A1. Vytvořit Meta App v Meta for Developers**
  - URL: https://developers.facebook.com/apps/
  - Type: "Consumer"
  - Spojit s bundle ID `com.petrturek.selfrise` (iOS) i Android package `com.petrturek.selfrise`
  - Zapsat si: **Meta App ID** + **Client Token** (App Settings → Basic + Advanced)
- [ ] **A2. Přidat platformy v Meta App Settings**
  - iOS: Bundle ID + App Store ID
  - Android: Package Name + Class Name `com.facebook.react.ReactActivity`
- [ ] **A3. Aktivovat App Events v Meta App Dashboardu**
  - Audience Network nepovolovat (jen pro monetizaci přes Metu – není náš případ)
- [ ] **A4. (Volitelně) Zažádat o Meta Ads MCP open beta**
  - URL: https://mcp.facebook.com/ads
  - Vyžaduje Claude Pro/Max plán
- [ ] **A5. Předat mi Meta App ID + Client Token** → odblokuje Část C

---

### 💻 Část B: Custom Eventy do Firebase (nezávislé na Metě)

Tato část má hodnotu sama o sobě – lepší interní data o chování uživatelů. Lze začít hned.

- [ ] **B1. Vytvořit `src/services/analyticsService.ts`**
  - Sjednocený eventový dispatcher (zatím jen Firebase, později paralelně i Meta)
  - Wrapper kolem `FirebaseAnalytics.logEvent` z existujícího hooku
  - Type-safe event names (TypeScript union type)
- [ ] **B2. Tier 1 eventy – Acquisition signal**
  - `complete_onboarding` – konec tutorialu (Tutorial system)
  - `create_first_habit` – první vytvořený návyk (HabitsContext)
  - `complete_first_habit` – první zaškrtnutí návyku
  - `journal_first_entry` – první zápis do deníku (GratitudeContext)
- [ ] **B3. Tier 2 eventy – Retention signal**
  - `streak_7_days` – sedmidenní streak (deník nebo návyky)
  - `streak_30_days` – třicetidenní streak
  - `goal_completed` – dokončený cíl
  - `monthly_challenge_completed` – splněná měsíční výzva
  - `achievement_unlocked` – odemčený achievement (param `achievement_id`)
- [ ] **B4. Tier 3 eventy – Monetization signal**
  - `rewarded_ad_completed` – sledování rewarded reklamy (AdMob WarmUp)
- [ ] **B5. Ověření v Firebase Console**
  - Dev build, projít tutorialem, založit návyk, zaškrtnout
  - Firebase Console → Analytics → DebugView ověří příchozí eventy

---

### 🔌 Část C: Meta SDK Integrace (blokováno Částí A)

Tato část navazuje na Část A a B. **Blokovaná dokud Petr nedodá Meta App ID + Client Token.**

- [ ] **C1. Instalace `react-native-fbsdk-next`**
  - `npm install react-native-fbsdk-next`
  - Verify kompatibilita s Expo SDK 55 + RN 0.83
- [ ] **C2. Konfigurace pluginu v `app.json`**
  - Přidat `react-native-fbsdk-next` do `plugins` s App ID a Client Tokenem
  - Nastavit `advertiserIDCollectionEnabled`, `autoLogAppEventsEnabled`, `isAutoInitEnabled`
- [x] **C3. Update `NSUserTrackingUsageDescription`** (provedeno preventivně 2026-05-18)
  - Z: "This data helps us keep the app free and show you more relevant ads."
  - Na: "We use this to measure ad performance and personalize your experience. This keeps SelfRise free for everyone."
- [ ] **C4. Rozšířit `analyticsService.ts` o Meta App Events**
  - Paralelní dispatch: jedno `Analytics.track()` → Firebase + Meta zároveň
  - Type-safe mapping interních event names na Meta standard event names
- [ ] **C5. Mapování interních eventů na Meta Standard Events**
  - `complete_onboarding` → `fb_mobile_complete_registration`
  - `create_first_habit` → `fb_mobile_content_view` (custom params)
  - `streak_7_days` → `fb_mobile_achievement_unlocked`
  - `rewarded_ad_completed` → custom event
- [ ] **C6. Expo Prebuild + Native Builds**
  - `npx expo prebuild --clean`
  - iOS test build → ověření v Meta Events Manager Test Events tool
  - Android test build → ověření v Meta Events Manager Test Events tool
- [ ] **C7. Verifikace v Meta Events Manager**
  - Test Events tool zobrazuje příchozí eventy z obou platform
  - App Dashboard → Activity Log bez chyb

---

### 📚 Část D: Dokumentace

- [ ] **D1. Vytvořit `technical-guides:Marketing-Analytics.md`**
  - Architektura `analyticsService`
  - Seznam všech eventů: kdy se triggerují, jaké parametry posílají
  - Dual-dispatch logika (Firebase + Meta)
  - ATT / SKAdNetwork pravidla a důsledky pro attribution
- [ ] **D2. Update `technical-guides:AdMob.md`**
  - Krátká sekce: AdMob (monetizace) vs Meta Ads (akvizice) – nekolidují
  - Sdílený ATT prompt – relevance pro oba systémy

---

### Surgical Scope

- ✅ Žádný stávající kód se nerozbije – jen se rozšiřuje existující `useFirebaseAnalytics` infrastruktura
- ✅ AdMob bannery + rewarded ads zůstávají beze změny
- ✅ Tutorial, Habits, Goals, Journal logika beze změny – pouze přibudou `Analytics.track()` volání na klíčových místech
- ⚠️ `app.json`: nový plugin (Část C2) + úprava ATT permission textu (C3 – hotovo)
- ⚠️ Vyžaduje `expo prebuild --clean` po C2 → reinstall na zařízeních

### Dependencies / Pořadí prací

```
Část A (Petr, externí) ─┐
                        ├─→ Část C (Meta SDK) ─→ Část D (dokumentace)
Část B (Firebase) ──────┘
```

Část B lze začít kdykoliv – je nezávislá. Část C blokovaná Částí A.

---

## 🚨 DŮLEŽITÉ - NEMAZAT 🚨

### Cílová kvalita - TOP světová úroveň:
Aplikace MUSÍ být na špičkové úrovni ve všech aspektech:
- **Funkcionalita** - Bezchybná, intuitivní, rychlá
- **Design** - Moderní, elegantní, profesionální
- **Animace** - Smooth, přírodní, poutavé
- **UX** - Vynikající uživatelský zážitek srovnatelný s nejlepšími aplikacemi na trhu

### 🛠️ Future Skills Roadmap
Seznam Claude Code skills a MCP serverů pro instalaci v jednotlivých fázích projektu (Wave 1: TEĎ, Wave 2: před Phase 10, Wave 3: post-launch):
**Roadmap:** @future-skills-roadmap.md

---

## Project Overview
SelfRise V2 is a React Native mobile application built with Expo and TypeScript, focused on goal tracking, habit formation, and gratitude journaling. The app will feature internationalization (i18n) support with English as the default language and future support for German and Spanish.

## Core Features
- **Home**: Daily gratitude streak display and interactive habit statistics
- **Habits**: Habit creation, management, and tracking with customizable scheduling
- **My Journal**: Daily reflection with gratitude and self-praise entries
- **Goals**: Long-term goal setting with progress tracking
- **Settings**: Notifications, user authentication, and preferences

## Technical Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Bottom tab navigation
- **Styling**: Consistent light theme design
- **Data Storage**: Local storage with future Firebase integration

---

## Development Phases

### Phase 1: Core Foundation - NAVIGATION & HOME SCREEN ✅ COMPLETE
*(All checkpoints completed successfully)*

### Phase 2: Habit Tracking System ✅ COMPLETE
*(Full habit creation, tracking, and management implemented)*

### Phase 3: My Journal Screen ✅ COMPLETE
*(Gratitude and self-praise system with streak tracking implemented)*

### Phase 4: Goals System ✅ COMPLETE
*(Goal creation, progress tracking, and completion system implemented)*

### Phase 5: Gamification & XP System ✅ COMPLETE
*(Complete XP earning, leveling, and achievement systems implemented)*

### Phase 6: Monthly Challenges ✅ COMPLETE
*(4-category challenge system with real-time tracking implemented)*

*(Detaily dokončených checkpointů → @implementation-history.md / @projectplan-archive.md)*

### Phase 7: Settings & User Experience

- 7.1 Daily Reminder Notifications ✅ · 7.2 Theme + Language ✅ *(detaily v archivu)*

### Phase 8: External Service Integration Preparation ✅ COMPLETE

#### Checkpoint 8.1: Firebase Configuration ✅
- [x] Firebase project setup and configuration
- [x] Firebase Analytics integration (see Phase 12)
- [x] App Tracking Transparency (ATT) for iOS

#### Checkpoint 8.2: AdMob Integration ✅
**Technical Documentation**: @technical-guides:AdMob.md
- [x] AdMob account setup and ad unit creation
- [x] Ad integration for streak recovery system
- [x] Revenue tracking and analytics

#### Checkpoint 8.3: Analytics & Local Notifications ✅
- [x] Analytics service integration (Firebase Analytics - Phase 12)
- [x] Local notification system (Checkpoint 7.1)
- [x] User engagement tracking (Firebase Analytics)

**Note**: Remote Push Notifications (FCM) moved to Future Updates - not needed for launch

### Phase 9: Testing & Quality Assurance

#### Checkpoint 9.1: Debt Recovery System Testing ⚡ ✅ COMPLETED
**Goal**: Create comprehensive test suite for debt recovery system fixes
- [x] Analyze critical bug fixes made by habit-logic-debugger agent
- [x] Review fixed calculateDebt() and requiresAdsToday() functions
- [x] Review fixed ad counting logic in DebtRecoveryModal
- [x] Create comprehensive debt recovery system test suite
- [x] Test primary bug: user with 3+ entries today shows debt = 0
- [x] Test ad counting: 1 ad watched = 1 ad credited (no double counting)
- [x] Test edge cases: debt calculation with various scenarios
- [x] Test integration: full debt payment flow end-to-end
- [x] Validate logical consistency across all debt recovery functions

**Implementation Summary**: August 2, 2025
- ✅ **Created comprehensive test suite**: 65+ automated test scenarios
- ✅ **GratitudeStorage tests**: 45 test cases covering all debt recovery logic
- ✅ **DebtRecoveryModal tests**: 20 test cases covering UI and ad counting
- ✅ **Manual testing guide**: Comprehensive testing documentation with scenarios
- ✅ **Jest configuration**: Proper test setup and npm scripts added
- ✅ **Coverage validation**: Tests validate all critical bug fixes

**Key Test Files Created**:
- `/src/services/storage/__tests__/gratitudeStorage.debtRecovery.test.ts` - Logic testing
- `/src/components/gratitude/__tests__/DebtRecoveryModal.test.tsx` - UI testing
- `DEBT_RECOVERY_TESTING_GUIDE.md` - Manual testing scenarios
- `jest.config.js` - Test configuration

**Test Commands Available**:
- `npm run test:debt-recovery` - Run debt recovery tests only
- `npm run test:debt-recovery:coverage` - Run with coverage report
- `npm test` - Run all tests

**Validation Completed**: All critical bugs are now covered by comprehensive tests ensuring:
1. Users with 3+ entries today always show debt = 0
2. Ad counting works correctly (1 ad = 1 credit)
3. Edge cases and boundary conditions handled properly
4. Integration flows work end-to-end

#### Checkpoint 9.2: XP System Testing ⚡ PENDING
**Goal**: Create comprehensive test suite for gamification/XP system

**Note**: XP system is manually tested and working correctly - this checkpoint is about creating automated test coverage.

- [ ] Install Jest and React Native Testing Library dependencies
- [ ] Create GamificationService unit tests with full coverage
- [ ] Test level calculation mathematical model accuracy
- [ ] Test XP validation and anti-spam protection systems
- [ ] Test daily limits and balance validation logic
- [ ] Test XP transaction and rollback functionality
- [ ] Create XP integration tests with storage services
- [ ] Test edge cases and error handling scenarios

#### Checkpoint 9.2: Core Feature Unit Testing
- [ ] Component testing with Jest and React Native Testing Library
- [ ] Storage service testing (HabitStorage, GratitudeStorage, GoalStorage)
- [ ] Business logic unit tests for habit tracking, streaks, calculations

#### Checkpoint 9.3: E2E Testing
- [ ] User flow testing with Detox
- [ ] Cross-platform compatibility testing
- [ ] Performance testing

#### Checkpoint 9.4: Quality Assurance
- [ ] Manual testing across different devices
- [ ] User acceptance testing
- [ ] Bug fixes and refinements

### Phase 10: App Store & Google Play Preparation

**Target Platforms**: iOS (App Store) + Android (Google Play)

#### Checkpoint 10.1: Assets & Metadata

**10.1.1: App Icons**
- [ ] Design app icon (1024x1024 master)
- [ ] Generate iOS icon set (all required sizes: 20pt - 1024pt)
- [ ] Generate Android adaptive icon (foreground + background layers)
- [ ] Test icons on both light and dark backgrounds

**10.1.2: Screenshots & Promotional Assets**
- [ ] iOS Screenshots:
  - [ ] iPhone 6.7" (Pro Max) - required
  - [ ] iPhone 6.5" (Plus) - required
  - [ ] iPad Pro 12.9" - required
  - [ ] Capture 5-10 key screens in EN/DE/ES
- [ ] Android Screenshots:
  - [ ] Phone (1080x1920 or higher)
  - [ ] 7" Tablet
  - [ ] 10" Tablet
  - [ ] Capture 4-8 key screens in EN/DE/ES
- [ ] Feature graphic for Google Play (1024x500)
- [ ] Promotional video (optional but recommended)

**10.1.3: App Descriptions & Metadata**
- [ ] App title (max 30 chars) - EN/DE/ES
- [ ] Subtitle/short description - EN/DE/ES
- [ ] Full description - EN/DE/ES
- [ ] Keywords/tags for ASO (App Store Optimization)
- [ ] Categories: Health & Fitness, Productivity
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Support URL and marketing website

**10.1.4: Legal & Compliance**
- [ ] Privacy policy (GDPR compliant)
- [ ] Terms of service
- [ ] Data handling disclosure (App Privacy Details)
- [ ] AdMob compliance documentation

#### Checkpoint 10.2: Build Configuration

**10.2.1: iOS Build Setup**
- [ ] Configure app.json/app.config.js for iOS production
- [ ] Set bundle identifier (com.yourcompany.selfrise)
- [ ] Configure version number and build number
- [ ] Setup signing certificates (Apple Developer account)
- [ ] Configure App Store Connect app record

**10.2.2: Android Build Setup**
- [ ] Configure app.json/app.config.js for Android production
- [ ] Set package name (com.yourcompany.selfrise)
- [ ] Configure versionCode and versionName
- [ ] Generate upload keystore for signing
- [ ] Configure Google Play Console app record

**10.2.3: Production Builds**
- [ ] Build iOS production .ipa with EAS Build
- [ ] Build Android production .aab with EAS Build
- [ ] Verify builds install and run correctly
- [ ] Test critical user flows on both platforms

#### Checkpoint 10.3: Beta Testing

**10.3.1: iOS Beta (TestFlight)**
- [ ] Upload build to TestFlight
- [ ] Configure beta testing groups (internal + external)
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.2: Android Beta (Google Play Internal Testing)**
- [ ] Upload build to Google Play Console
- [ ] Configure internal testing track
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.3: Beta Testing Checklist**
- [ ] Test on iOS (minimum iOS 13, test on iOS 16+)
- [ ] Test on Android (minimum Android 5, test on Android 11+)
- [ ] Test on different screen sizes (small phone, large phone, tablet)
- [ ] Test all 3 languages (EN/DE/ES)
- [ ] Test both light and dark themes
- [ ] Verify AdMob ads display correctly (test ads only)
- [ ] Verify push notifications work
- [ ] Performance testing (smooth 60fps, no lag)
- [ ] Memory leak testing (no crashes after extended use)

#### Checkpoint 10.4: Final Submission

**10.4.1: App Store Submission (iOS)**
- [ ] Complete App Store Connect metadata
- [ ] Upload final production build
- [ ] Submit for App Review
- [ ] Respond to any review feedback/rejections
- [ ] Release to App Store (manual or automatic)

**10.4.2: Google Play Submission (Android)**
- [ ] Complete Google Play Console metadata
- [ ] Upload final production build to production track
- [ ] Submit for review
- [ ] Respond to any review feedback/rejections
- [ ] Release to Google Play (staged rollout recommended)

**10.4.3: Post-Launch Monitoring**
- [ ] Monitor crash reports (first 24-48 hours critical)
- [ ] Monitor user reviews and ratings
- [ ] Monitor analytics (user acquisition, retention)
- [ ] Prepare hotfix build if critical issues found
- [ ] Plan first update (v1.1) based on user feedback

---

## ✅ Dokončené fáze (archiv)

SQLite migrace (SEKCE 1–4), Firebase Analytics + ATT (Phase 12), Tutorial Spotlight refaktoring (Skia), vyřešené Known Issues — vše hotové, detaily: @implementation-history.md a @projectplan-archive.md.

---

## 🔮 FUTURE UPDATES - Plánované funkce

### Data Export & Backup System 💾

**Priority**: Medium | **Complexity**: Medium | **Estimated**: 4-6 hours

**Goal**: Allow users to export, backup, and restore all their app data for safety and portability

**Features**:
- [ ] Export All Data - Download complete backup as JSON file
- [ ] Import Backup - Restore data from backup file
- [ ] Storage Usage Display - Show data size breakdown by category
- [ ] Auto Backup Toggle - Automatic weekly backups
- [ ] Share exported backup across apps (email, cloud storage)

**Technical Implementation**:
- ✅ Backup/restore logic already complete: `src/services/storage/backup.ts`
- ✅ UserSettings type includes `dataBackupEnabled` flag
- ⏳ Need to install: `expo-sharing`, `expo-document-picker`, `expo-file-system`
- ⏳ Need to create: DataExportModal component
- ⏳ Need to integrate: Share API and DocumentPicker for native file operations

**Export Format**:
- File extension: `.selfrise.json`
- Includes: Habits, Goals, Journal, XP data, Achievements, User Settings
- Metadata: Timestamp, app version, migration version, item counts

**User Flow**:
1. User taps "Export Data" → App creates JSON backup
2. Native share sheet opens → User can send via email, save to iCloud/Google Drive
3. User taps "Import Backup" → File picker opens
4. User selects `.selfrise.json` file → Confirmation modal warns about overwrite
5. User confirms → Data restored, success message shown

**Why postponed**:
- Theme and Language are higher priority for user experience
- Export/Backup is "safety net" feature - important but not urgent
- Requires additional native dependencies and testing

**When to implement**:
- After Checkpoint 7.2 (Theme + Language) complete
- Before Phase 10 (App Store launch) - users need backup before going live
