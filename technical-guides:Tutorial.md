# SelfRise V2 - Onboarding Tutorial System Technical Guide

> ## ⚠️ STAV: PROBÍHÁ PŘEPRACOVÁNÍ (schváleno 2026-08-02)
>
> Popis 25krokového průvodce níže je **stále platný pro nasazený kód**, ale je
> rozhodnuto ho nahradit. Nový návrh je hned v následující sekci. Starý popis
> zůstává, dokud se starý kód nesmaže (etapa H) — do té doby je to referenční
> dokumentace toho, co v aplikaci reálně běží.
>
> Odškrtávací plán: `projectplan.md` → „Přepracování onboardingu“

---

# NOVÝ NÁVRH: 3 obrazovky místo 25 kroků

## Proč se to mění

Průvodce vodí uživatele šipkami po skutečné aplikaci. To vyžaduje overlay,
spotlight, měření pozic prvků a blokování dotyků — nejkřehčí kód v projektu.
Dva ze tří nálezů z device testu (oříznutý text, rozseklá spodní lišta) jsou
přímým důsledkem té konstrukce, ne chybami v obsahu.

Rozbor 25 kroků:

| Typ kroku | Počet | Poznámka |
|---|---|---|
| Jen mluví (`action: 'next'`) | 9 | uživatel jen odkliká |
| Přepni záložku | 3 | |
| Otevři formulář | 2 | |
| Vyplň políčko | 11 | **4 z nich učí políčka s funkční výchozí hodnotou** |

Ta čtyři zbytečná: `HabitForm.tsx:185` (color → BLUE), `:186` (icon → FITNESS),
`GoalForm.tsx:110` (category → PERSONAL), `:350` (targetDate je nepovinné).

## Cíl (nezměněný)

**Uživatel odejde z úvodu s vlastním návykem a vlastním cílem uvnitř aplikace.**
Tenhle cíl je správný a v novém návrhu se plní **lépe** — přibývá první
odškrtnutí návyku a první zážitek XP, které dnes chybí.

## Architektura

### Obrazovka 0 — Předvolby (BEZE ZMĚNY)

`OnboardingPreferencesModal.tsx` — jazyk → motiv → notifikace. Funguje, nesahat.

### Obrazovka 1 — První návyk

Dlaždice s předvolbami. Ťuknutí vyplní **název + ikonu + barvu najednou**.

| Předvolba | `HabitIcon` | `HabitColor` |
|---|---|---|
| Pít vodu | `water` | `blue` |
| Cvičit | `fitness` | `red` |
| Číst | `book` | `purple` |
| Meditovat | `meditation` | `teal` |
| Chodit včas spát | `sleep` | `orange` |
| Zdravě jíst | `food` | `green` |
| *Něco jiného* | `fitness` | `blue` |

K dispozici je 14 ikon a 8 barev (`src/types/common.ts`).

**Dny:** předvyplněné všech 7. `scheduledDays` je jediné povinné pole bez
výchozí hodnoty (`HabitForm.tsx:206`), proto ho předvolba musí vyplnit.

### Obrazovka 2 — První cíl

**Znovupoužije obsah `GoalTemplatesModal.tsx`** — 11 šablon už existuje a je
zapojený v `GoalsScreen.tsx:356`. ⚠️ Ale POZOR: ta komponenta je RN `<Modal>`
(`:372`) — do onboardingu se **nevkládá modál, ale vytažená mřížka dlaždic**
(`GoalTemplateGrid`, viz pravidlo D-TPL v Design specifikaci). K tomu se
doplní chybějící lokalizace jednotek (viz níže).

### Obrazovka 3 — První odškrtnutí

> **Ověřeno (etapa F, 2026-08-02):** `XpAnimationContext.tsx:207-218` potlačuje
> během onboardingu **pouze okno o novém levelu**, ne XP animace. Odměna za
> první odškrtnutí se tedy opravdu ukáže — to je celý smysl téhle obrazovky.
> Karta proto po odškrtnutí ještě 1,2 s počká, než zmizí.
>
> **Past nalezená při psaní testů:** naivní podmínka „odškrtl dnes něco?“ je
> při **restartu ze Settings** pravdivá hned při zobrazení karty (uživatel už
> dnes něco odškrtl dřív) → karta by zmizela dřív, než by uživatel cokoliv
> udělal. Řeší se tím, že si karta při zobrazení uloží výchozí počet a čeká na
> jeho **nárůst** (`checkDetection.ts`).

Hlavní obrazovka, kde už návyk i cíl jsou. Krátká karta dole:

> „Hotovo. Odškrtni si návyk a uvidíš, jak přibude XP.“

**Bez overlay a bez měření pozic.** Zvýraznění řeší samotná karta návyku —
dostane vlastnost `highlightCheckbox`, dokud uživatel neodškrtl první návyk.
Komponenta zná pozici svého zaškrtávátka sama; žádné globální měření.

---

## PRAVIDLO: Lokalizace

**Tři jazyky, žádné výjimky: EN, DE, ES.**

- Veškerý nový text jde přes `t()`, nikdy natvrdo do komponenty.
- Pojistka existuje: `src/locales/__tests__/localeParity.test.ts` (12 testů)
  shodí build, když klíč chybí v DE nebo ES, je prázdný, nebo nesedí délka pole.
- **Nespoléhat na TypeScript** — DE/ES jsou typované jako
  `Partial<TranslationKeys>` s ~30 přetypováními `as any`, takže `tsc` tuhle
  třídu chyb nezachytí. Hlídá to jen ten test.

## PRAVIDLO: Měna a jednotky

**Nález (chyba v nasazeném kódu, ne jen v onboardingu):** v
`GoalTemplatesModal.tsx` jde `title` i `description` přes `t()`, ale **`unit` je
natvrdo anglicky**:

```
:40  unit: 'kg'          :99   unit: 'lessons'
:53  unit: '$'    ← měna :112  unit: 'applications'
:64  unit: '$'    ← měna :123  unit: 'connections'
:77  unit: 'books'       :136  unit: 'minutes'
:88  unit: 'hours'       :149  unit: 'projects'
                         :160  unit: 'recipes'
```

Německý uživatel tedy dnes dostane cíl „12 **books**“ a spořicí cíl v **dolarech**.

**Řešení: jednotky se stanou i18n klíči** — jedním mechanismem se opraví obojí.

```
goals.units.currency   EN: $        DE: €          ES: €
goals.units.books      EN: books    DE: Bücher     ES: libros
goals.units.hours      EN: hours    DE: Stunden    ES: horas
… (10 různých jednotek × 3 jazyky = 30 řetězců)
```

- `kg` zůstává `kg` ve všech třech (metrická jednotka, nepřekládá se).
- `goals.form.unitPlaceholder` už `€` v DE/ES má — nic k práci.
- **Tato oprava je nezávislá na onboardingu** a dá se nasadit samostatně.

> **Chování, se kterým se počítá:** jednotka i název se do cíle/návyku
> **zapíšou v jazyce platném při vytvoření** (`Goal.unit` je prostý `string`,
> `goal.ts:22`). Pozdější přepnutí jazyka existující záznamy nepřepíše — od
> vytvoření je to uživatelova vlastní data. Totéž platí pro názvy z předvoleb
> návyků. Alternativa (ukládat klíč a překládat při zobrazení) by znemožnila
> uživateli jednotku přepsat, což pravidlo „vše musí jít upravit“ zakazuje.

**Stav (etapa A, hotovo 2026-08-02):** klíče `goals.units.*` zavedené ve všech
3 jazycích, `GoalTemplatesModal` je používá (`useMemo(..., [t])` už `t` v
závislostech měl, takže přepnutí jazyka mřížku přegeneruje).

## PRAVIDLO: Trofeje (KRITICKÉ — nerozbít)

Za první návyk i první cíl se odemyká trofej a **její oslavné okno musí dostat
svůj prostor**. Mechanika už existuje a je pracně odladěná:

- `src/utils/tutorialAchievementGate.ts` — `armTutorialAchievementGate(id)`
- `AchievementContext.tsx:343` — během průvodce se propouští **pouze**
  `first-habit` a `first-goal`, ostatní trofeje se potlačují

**Nepřepisovat. Jen zavolat z nových obrazovek.** Závazná pravidla:

1. **Nabít bránu PŘED vytvořením** návyku/cíle. Odemčení přijde ~100 ms po
   vytvoření; kdo se přihlásí k odběru později, událost promešká.
2. **Nepřecházet na další obrazovku, dokud `wait()` nedoběhne.**
3. **Restart průvodce:** trofej už uživatel vlastní → žádné okno nepřijde →
   `wait()` nesmí čekat. Řeší se dotazem `hasAchievement()` *před* vytvořením,
   ne odhadem z příznaku restartu. (V komentářích souboru jsou popsané dva
   dřívější pokusy, které to spletly — stojí za přečtení.)
4. Časové limity v tom souboru jsou **záchranné brzdy, ne tempo**.

**Zlepšení nového návrhu:** nové obrazovky jsou plnohodnotné obrazovky, ne
`<Modal>`. Odpadá tím riziko dvou RN modálů naráz, které na iOS zmrazí UI.

## PRAVIDLO: Vše musí jít upravit

Předvolba je **startovní hodnota, ne zámek**. Na obou obrazovkách jsou pod
dlaždicemi normální ovládací prvky (název, ikona, barva, dny / název, jednotka,
číslo, kategorie, datum) a uživatel do nich může kdykoliv sáhnout.

Prakticky: znovupoužít existující výběrové komponenty z `HabitForm` a
`GoalForm`, ne psát nové.

---

## Co se ruší — a AŽ V ETAPĚ H

```
src/components/tutorial/TutorialOverlay.tsx    734 řádků  ← oříznutý text
src/components/tutorial/SpotlightEffect.tsx    282 řádků  ← rozseklá lišta
src/utils/TutorialTargetHelper.ts
createTutorialSteps() v TutorialContext.tsx    ~330 řádků (25 kroků)
+ osiřelé i18n klíče ve všech 3 jazycích
```

**Co zůstává z `TutorialContext.tsx`:** ukládání stavu (dokončeno/přeskočeno),
restart, `hasAchievement()`, propojení s bránou trofejí.

## DESIGN SPECIFIKACE (doplněno při 2. prověrce 2026-08-02)

Onboarding je první minuta s aplikací — nesmí vypadat jako cizí těleso.
Všechno níže staví na infrastruktuře, která v projektu UŽ EXISTUJE
(s file:line důkazy), žádné nové knihovny.

### D-VIZ: Vizuální jazyk

Vzorem je `OnboardingPreferencesModal.tsx` (obrazovka 0 — funguje a vypadá
dobře): karta `colors.cardBackgroundElevated` s akcentním horním proužkem
`colors.primary` (`:147-154`), stránka `colors.backgroundSecondary`.

- **2-tier theme systém, žádné výjimky**: stránka `backgroundSecondary`,
  karty `cardBackgroundElevated`. Texty `textPrimary`/`textSecondary`.
- `StyleSheet.create` **uvnitř komponenty** s `colors` z `useTheme()` —
  přesně jako `OnboardingPreferencesModal.tsx:63,130`. Nikdy top-level.
- **Zakázáno**: natvrdo psané barvy, stíny v dark mode, čisté černé pozadí.
- Typografie: `Fonts` (`src/constants/fonts.ts`) + `scaleFont()`. Žádné
  holé číselné fontSize.
- Dlaždice předvoleb: ikona + popisek, vybraná = rámeček `colors.primary`
  + jemný tint. Mřížka 2 sloupce (SMALL/MEDIUM), 3 sloupce (LARGE/TABLET).

### D-POHYB: Animace (reanimated 4.2.1 už v projektu)

- Přechod mezi obrazovkami: fade+slide ~250 ms (reanimated, ne Animated).
- Dlaždice při stisku: scale 0.97 (pattern viz `AchievementCard.tsx:317`).
- Obrazovka 3: pulz na zaškrtávátku (`highlightCheckbox`) — jemný, 2s cyklus.
- **VŠE respektuje reduce-motion**: `useAccessibility()` →
  `isReduceMotionEnabled` → animace vypnout (pattern
  `AchievementCard.tsx:101,122` — kopírovat ten přístup).
- Lottie/Skia jsou k dispozici, ale pro v1 stačí reanimated — žádné nové
  assety, ať se etapa nenafoukne.

### D-DEV: Zařízení

- Orientace je **zamčená portrait** (`app.json:6`) — landscape se neřeší.
- **Tablety se řeší**: iOS `supportsTablet: true` (`app.json:11`).
  Obsah na TABLET centrovat do kontejneru max ~560 px šířky, ať se
  dlaždice neroztáhnou přes celý iPad.
- Breakpointy hotové: `src/utils/responsive.ts` — `ScreenSize`
  (SMALL <375 / MEDIUM / LARGE / TABLET ≥768), `getResponsiveValue()`,
  `scaleFont()` (sevřeno 0.8–1.3×), `getCardPadding()`. POUŽÍVAT TYHLE,
  nevymýšlet vlastní.
- Safe areas: `useSafeAreaInsets()` (vzor `OnboardingPreferencesModal.tsx:65`).
- Klávesnice: pole „Něco jiného“ (vlastní název) musí mít
  `KeyboardAvoidingView` — na SMALL telefonech jinak klávesnice zakryje
  tlačítko Pokračovat. Klasický zdroj chyb, testovat na malém displeji.

### D-A11Y: Přístupnost

- Každá dlaždice: `accessibilityRole="button"` + `accessibilityLabel`
  z i18n (21 komponent v projektu to už dělá — držet laťku).
- Dotykové cíle min. 44 pt.
- Kontrast řeší theme tokeny — proto žádné vlastní barvy.

### D-UX: Kostra každé obrazovky

```
[●○○ progress]                    [Přeskočit]
Nadpis (1 řádek)
Podnadpis (max 2 řádky)
── obsah (dlaždice / formulář) ──
[ Pokračovat ]   ← vždy viditelné, nad klávesnicí
```

- Progress tečky 1/2/3, ne „krok X z Y“ textem.
- **Přeskočit na každé obrazovce** (zapíše `SKIPPED`, K3). Uživatel nesmí
  být rukojmí.
- Zabití aplikace uprostřed: `CURRENT_STEP` (`'screen-1'`…) → po startu
  se pokračuje na rozdělané obrazovce, ne od nuly.

### D-KIT: Sdílené stavební bloky (samostatná etapa C)

Tři obrazovky sdílejí: kontejner (safe areas + progress + skip + CTA),
dlaždici, sekční nadpis. Postavit JEDNOU jako `src/components/onboarding/`,
obrazovky je jen skládají. Tím se etapy D–F zmenší na obsah.

### ✅ D-TPL — jak to dopadlo (etapa C, 2026-08-02)

Původní znění chtělo vytáhnout „data **i mřížku**“ do jedné komponenty pro obě
místa. Při implementaci se ukázalo, že to jde proti druhé půlce téhož pravidla
(„modál na Goals obrazovce beze změny“): modál zobrazuje **široké řádky**
s popisem a šipkou, onboarding chce **kompaktní dlaždice** ve 2–3 sloupcích.
Jedna komponenta pro obojí by nutně změnila vzhled Goals.

**Sdílí se tedy DATA, ne vzhled:**

```
src/constants/goalTemplates.ts     ← 11 šablon + useGoalTemplates() + templateToGoalInput()
   ├── GoalTemplatesModal          ← široké řádky, chování 1:1 jako dřív
   └── OnbTileGrid + OnbTile       ← dlaždicová mřížka pro onboarding
```

Zásadní část pravidla platí dál: **v onboardingu není žádný `<Modal>`.**
Ověřeno, že extrakce dat nic nezměnila — porovnáno 11 šablon pole po poli
proti gitové verzi, shoda 100 %.

### ⚠️ D-TPL (původní znění): GoalTemplatesModal je `<Modal>` — NEvkládat

Druhá prověrka odhalila kolizi: `GoalTemplatesModal.tsx:372` je RN
`<Modal>`. „Znovupoužít“ ho v onboardingu NEZNAMENÁ otevřít modál
(porušení K2) — znamená **vytáhnout data šablon + mřížku dlaždic do
sdílené komponenty** (`GoalTemplateGrid`), kterou použije:
1. stávající `GoalTemplatesModal` (Goals obrazovka — chování beze změny),
2. onboarding obrazovka 2 (vložená přímo do view, žádný modál).

### D-CHECK: Kontrolní nástroje po každé UI etapě

- `theme-validator` skill na `src/components/onboarding/` (hlídá natvrdo
  psané barvy, top-level StyleSheet, stíny v dark mode)
- `i18n-auditor` skill + `localeParity.test.ts`
- Device matrix v F4: malý Android (Redmi 8 Pro) + iPhone; light i dark;
  EN/DE/ES; je-li po ruce iPad — tablet layout.

## INTEGRAČNÍ KONTRAKT (doplněno při prověrce plánu 2026-08-02)

Prošel jsem každý bod plánu proti kódu. Tohle jsou přesné vazby, které nové
obrazovky MUSÍ dodržet — každá s file:line důkazem.

### K1: Start za Startup Orchestratorem

Dnešní průvodce se spouští v `TutorialContext.tsx:1660-1671`:
`awaitStartupComplete()` → 300 ms → `autoStartTutorial()` (ten čte
`PREFS_COMPLETED`, `:1638`). Důvod: RN modál přes nativní okno (ATT/UMP)
= iOS zamrznutí. **Nový flow startuje ze STEJNÉHO místa** — mění se jen to,
co se po bráně zobrazí. Bránu nepředělávat.

### K2: Nové obrazovky NEJSOU `<Modal>`

Celá ochrana proti dual-modal zamrznutí stojí na tom, že se RN modály
nepotkávají. Obrazovky 1–3 se renderují jako plnohodnotné view (conditional
render v root layoutu nad taby), ne přes `<Modal>`. Jediné modály ve flow:
oslavná okna trofejí (řízená `ModalQueueContext`) a existující
`OnboardingPreferencesModal`.

### K3: Klíče stavu se ZACHOVÁVAJÍ (čte je i XpAnimationContext)

`TUTORIAL_STORAGE_KEYS` (`src/constants/tutorialStorageKeys.ts`) je single
source of truth. `XpAnimationContext.tsx:11-14` podle `COMPLETED`/`SKIPPED`
**potlačuje level-up modál během onboardingu** (dual-modal ochrana, N-8.1).
Nový flow musí tyto klíče zapisovat se stejnou sémantikou:
- dokončení obrazovky 3 → `COMPLETED = 'true'`
- přeskočení → `SKIPPED = 'true'`
- `CURRENT_STEP` může nést id obrazovky (`'screen-1'` …) pro obnovu po pádu

Pozn.: potlačuje se jen level-up **modál**, ne XP animace v liště — první
odškrtnutí na obrazovce 3 tedy XP animaci ukáže, jak návrh chce.

### K4: Nabíjení brány trofejí — přesný vzor

Dnes: `HabitForm.tsx:234-255` — podmínka `isTutorialCreateStep` kontroluje
`currentStepData.target === 'create-habit-submit'`; při novém flow **nikdy
nebude pravdivá** (žádné kroky). Nové obrazovky nabíjejí bránu SAMY, stejným
vzorem:

```ts
const gate = armTutorialAchievementGate('first-habit');  // PŘED create!
await createHabit(data);
await gate.wait();          // teprve potom přechod na další obrazovku
```

Totéž `first-goal` (vzor v `GoalForm.tsx:380`). Podmínky ve formulářích se
mažou až v etapě H.

### Jak je to nakonec zapojené (etapa B, hotovo 2026-08-02)

Klíčový trik: nový flow **dispatchuje `START_ONBOARDING`, které nastaví
`isActive: true` úplně stejně jako starý `START_TUTORIAL`, ale nechá
`currentStepData: null`.**

Díky tomu:
- **žádný ze 129 odkazů se nemusel měnit** — `isActive` je pořád ten jediný
  signál, který zbytek aplikace čte,
- **starý overlay sám od sebe nic nekreslí** — jeho podmínka
  `!state.isActive || !state.currentStepData` (`TutorialOverlay.tsx:335`) je
  díky `null` splněná a vrátí jen `children`.

Přepnuta tři startovní místa (`autoStartTutorial`, `completeOnboardingPrefs`,
`restartTutorial`); `skipOnboarding` volá existující `skipTutorial()`, takže
storage flagy zůstávají bit po bitu stejné.

**`userInteractionBlocked: false`** — starý overlay ho nastavoval na `true`,
protože pod ním byla živá aplikace. Nové obrazovky ji překrývají celou, takže
není co blokovat. Ověřeno: mimo `TutorialContext` to nikdo nečte.

### K5: `AchievementContext.tsx:335-343` — filtr trofejí

> **Ověřeno při implementaci:** `isTutorialActive()` (`TutorialContext.tsx:1948`)
> **nečte React stav, ale storage flagy** COMPLETED/SKIPPED. Filtr proto funguje
> dál jen díky tomu, že nový flow ty flagy zapisuje se stejnou sémantikou (K3) —
> ne díky `isActive`. Kdyby někdo v budoucnu měnil zápis flagů, rozbije tím i
> filtr trofejí, aniž by se toho dotkl.

Během aktivního průvodce se propouští jen `first-habit`/`first-goal`, vše
ostatní se potlačuje. Filtr čte stav tutoriálu → nový flow musí po dobu
obrazovek 1–3 vystavovat týž „aktivní“ stav (nebo ekvivalent), jinak filtr
přestane platit a hrozí cizí trofej přes onboarding.

### K6: Restart ze Settings

`app/(tabs)/settings.tsx:190-199` volá `restartTutorial()`. Po přepnutí musí
spouštět nový flow. Restart = trofeje už vlastněné → brána nesmí čekat
(řeší `hasAchievement()` uvnitř gate). Pozor i na `GoalsContext.tsx:169`
(zvláštní větev pro restart). `hasAchievement` je exportováno
z `TutorialContext` — při zeštíhlování kontextu export zachovat.

### K7: AdBanner

`AdBanner.tsx:93-94` skrývá reklamy během průvodce. Zachovat pro obrazovky
1–3 (stejný „aktivní“ stav jako K5 to vyřeší zadarmo).

### Mrtvý kód — nekopírovat, smazat v etapě H

`TutorialContext.tsx:1679-1700` („Achievement Modal Coordination“) čeká na
kroky `first-habit-achievement`/`first-goal-achievement`, **které v seznamu
kroků neexistují** — podmínka je vždy false, efekt nikdy neproběhne. Skutečná
koordinace je brána ve formulářích (K4). Při psaní nového flow se tímto
efektem neinspirovat.

### Záchrana starého overlaye — ZRUŠENO (rozhodnutí 2026-08-02)

Původně se mělo nejdřív rychle opravit oříznutí textu
(`TutorialOverlay.tsx:409` a `:138`) a vyhodit 4 zbytečné kroky. Petr rozhodl
jít rovnou na přepracování — opravovat kód určený ke smazání nemá smysl.

**Důsledek, se kterým se počítá:** starý průvodce zůstává rozbitý až do
nasazení etapy E. Testeři uvidí oříznuté věty.

Zjištění z prověrky si tu necháváme pro případ, že by se rozhodnutí otočilo:
odhad „2 řádky“ na `:138` se používá **jen pro pozicování karty** (`:662-664`),
ne pro její výšku — příliš malý odhad posune `maxTop` nízko a karta přeteče
pod okraj obrazovky. Týká se 4 kroků s dynamickou pozicí (`:653-658`).

### Etapa A — stav ověřen

`goals.form.unitPlaceholder`: DE `'z.B. €, kg, Stunden...'` (`de/index.ts:941`),
ES `'ej., €, kg, horas...'` (`es/index.ts:941`) — **už hotové, bod 2.4 odpadá**.
EN si `$` nechává. Zbývá jen 11× `unit:` v `GoalTemplatesModal.tsx`.
Vedlejší: `marketingDemoDataService.ts:153,206` má také `'$'` — demo data,
neblokuje, možno přibalit.

### Znovupoužití `GoalTemplatesModal` — jak funguje

`GoalsScreen.tsx:165-170`: `onSelectTemplate` vrací `CreateGoalInput` a
otevírá `GoalModal` předvyplněný (`templateData`). Obrazovka 2 použije týž
kontrakt: šablona → předvyplněný formulář → uživatel může vše změnit → uložit.

## Rizika

**Průvodce je zaklíněný hlouběji, než vypadá: 129 odkazů ve 13 souborech**
(`useTutorial`, `tutorialState`, `isTutorialActive`) — mimo jiné v
`GoalForm`, `HabitForm`, `GoalsScreen`, `AdBanner`, `OptimizedXpProgressBar`,
`QuickActionButtons`, `DailyGratitudeProgress`, `app/(tabs)/_layout.tsx`.

Např. `GoalForm.tsx:350` během průvodce vypíná validaci data. Smazání stavu
průvodce bez auditu těchto míst rozbije formuláře. **Proto se maže až v etapě H,
až po device testu z F4 a po projití všech 129 odkazů.**

---

## Overview (PŮVODNÍ 25krokový průvodce — stále nasazený)

Onboarding Tutorial je interaktivní průvodce pro nové uživatele, který je provede celou aplikací při prvním spuštění. Systém používá overlay approach s tmavnutím obrazovky a spotlight efekty pro zvýraznění specifických elementů.

## Design Specifikace

### 1. Visual Design
- **Overlay**: GPU-rendered Skia `<Canvas>` s tmavým `<Rect>` (rgba(0,0,0,0.75)) přes celou obrazovku
- **Spotlight Cutout**: `<RoundedRect>` s `BlendMode.dstOut` vytvoří "díru" v overlay — GPU-accelerated, žádné CSS clip-path
- **Soft Edges**: `<BlurMask blur={8} style="normal" />` na cutout pro plynné hrany
- **Glow Ring**: Pulsující oranžový rámeček (`rgba(255, 107, 53, …)`) kolem spotlight, rámeček se škáli 1.0→1.08 a opacity 0.3→0.7
- **Inner Border**: Bílý semi-transparentní border (`rgba(255,255,255,0.4)`, strokeWidth 2) na hraně cutout
- **Corner Radius**: 14px na cutout (squircle feel), 18px na glow ring
- **Padding**: 10px kolem targetu pro "dýchání"
- **Entrance Animation**: Celý Canvas fade-in za 200ms při zobrazení
- **Skip Button**: Křížek v pravém horním rohu (slabě viditelný během celého tutoriálu)
- **Next Button**: Zobrazuje se když není vyžadována specifická akce od uživatele

### 2. Interaction Design
- **Blocking**: Uživatel může kliknout pouze na zvýrazněný element nebo skip/next tlačítka
- **Progressive Disclosure**: Formuláře se vyplňují postupně s next tlačítkem po prvním znaku
- **Haptic Feedback**: Při každém kroku tutoriálu
- **Smooth Transitions**: Plynulé přechody mezi kroky (300ms animace)

## Uvítací brána (Onboarding Preferences Gate) — PŘED tutoriálem

`src/components/tutorial/OnboardingPreferencesModal.tsx` — **3 obrazovky**, zobrazí se
**jen při úplně prvním spuštění** aplikace (flag `onboarding_prefs_completed`):

1. **Jazyk** (EN/DE/ES) — přepíná se živě při tapu
2. **Vzhled** (světlý/tmavý) — živý náhled
3. **🔔 Notifikace** — pre-permission dotaz („Ano, chci" / „Teď ne"); po „Ano" se
   zavře brána, teprve pak přijde systémový dotaz a zapnou se **obě** denní připomínky.
   Kompletní pravidla (vč. proč se neptáme systémovým dialogem rovnou):
   @technical-guides:Notifications.md → „First-Launch Opt-In (Priming)"

**Není součástí TUTORIAL_STEPS** → nemá počítadlo „Step X of 25"; tutoriál zůstává 25 kroků.
Restart tutoriálu z Nastavení bránu **NEspouští** (flag zůstává nastavený).

Po posledním kroku brána volá `completeOnboardingPrefs(wantsNotifications)`, který
uloží flag, zavře bránu, (volitelně) vyřídí notifikace a **teprve pak** spustí tutoriál.

⚠️ **Pořadí je kritické**: brána (RN modal) musí být zavřená před systémovým dotazem —
dva modaly naráz = iOS deadlock. Brána sama se spouští až po `awaitStartupComplete()`
(ATT + UMP souhlas), viz @technical-guides:Startup-Orchestrator.md

---

## Tutorial Flow - 25 Kroků (Complete Implementation)

**✅ AKTUALIZACE**: Současná implementace má **25 kompletních kroků** s intelligent achievement handling. Tutorial pokrývá celý onboarding flow od welcomu až po finální gratulaci.

### Klíčové vlastnosti:
- **Achievement Integration**: Conditional handling - achievement modaly potlačeny během tutorialu
- **Completion Modals**: Step 10 (habit-complete) a Step 21 (goal-complete) nahrazují achievement modaly
- **Complete Flow**: Návrat na Home, XP system intro, Trophy Room, finální completion
- **25 kroků celkem**: Plnohodnotný onboarding včetně gamifikačních prvků

### Step 1: Welcome Modal
**Type**: Modal
**Content**:
```
title: "Welcome to SelfRise! 🌟"
content: "Ready to transform your life? Let's take a quick tour and set up your first habits, goals, and journal entries!"
button: "Let's Start!"
```

### Step 2: App Overview
**Type**: Spotlight
**Target**: Celá obrazovka
**Content**:
```
title: "Your Personal Growth Hub"
content: "SelfRise helps you build habits, track goals, and practice gratitude. Let's explore the three main sections that will change your life!"
action: "next"
```

### Step 3: Quick Actions Explanation
**Type**: Spotlight
**Target**: Quick Actions sekce na home screen
**Content**:
```
title: "Quick Actions ⚡"
content: "These buttons let you quickly add habits, write in your journal, or create goals without navigating around the app!"
action: "next"
```

### Step 4: Create First Habit - Button
**Type**: Spotlight
**Target**: Add Habit tlačítko
**Content**:
```
title: "Create Your First Habit 💪"
content: "Click the + Add Habit button to build your first positive routine!"
action: "click_element"
```

### Step 5a: Habit Name Input
**Type**: Spotlight
**Target**: Název návyku textové pole
**Content**:
```
title: "Name Your Habit"
content: "What habit would you like to build? Examples: 'Drink water', 'Read 10 pages', 'Meditate 5 minutes'"
action: "type_text"
next_trigger: "first_character"
```

### Step 5b: Habit Color Selection
**Type**: Spotlight
**Target**: Color picker
**Content**:
```
title: "Choose a Color 🎨"
content: "Pick a color that motivates you - it will help you quickly spot this habit!"
action: "select_option"
```

### Step 5c: Habit Icon Selection
**Type**: Spotlight
**Target**: Icon picker
**Content**:
```
title: "Pick an Icon"
content: "Choose an icon that represents your habit perfectly!"
action: "select_option"
```

### Step 5d: Scheduled Days
**Type**: Spotlight
**Target**: Scheduled days sekce
**Content**:
```
title: "When Will You Do It? 📅"
content: "Select which days you want to practice this habit. Start small - you can always adjust later!"
action: "select_days"
```

### Step 5e: Create Habit
**Type**: Spotlight
**Target**: Create tlačítko
**Content**:
```
title: "Create Your Habit!"
content: "Click Create to add your first habit!"
action: "click_element"
```

### Step 6: First Habit Achievement
**Type**: Achievement Modal (automatické)
**Achievement ID**: `first-habit`
**Behavior**: Po vytvoření prvního návyku se automaticky spustí achievement modal
**Tutorial Action**: Čekat na uzavření achievement modalu, pak pokračovat na krok 7
**Note**: Vyžaduje implementaci achievement check v HabitsContext.createHabit()

### Step 7: Navigate to Journal
**Type**: Spotlight
**Target**: My Journal tab v bottom navigation
**Content**:
```
title: "Let's Explore Your Journal 📝"
content: "Click on My Journal to see where you'll record your daily gratitude and self-praise!"
action: "click_element"
```

### Step 8: Journal Actions Explanation
**Type**: Spotlight
**Target**: Add Gratitude a Add Self-Praise tlačítka
**Content**:
```
title: "Daily Gratitude & Self-Praise ✨"
content: "Write at least 3 entries daily to build your journal streak! Express gratitude and celebrate your wins here every day."
action: "next"
```

### Step 9: Navigate to Goals
**Type**: Spotlight
**Target**: Goals tab v bottom navigation
**Content**:
```
title: "Time for Your Goals! 🎯"
content: "Click on Goals to see where you'll track your bigger aspirations!"
action: "click_element"
```

### Step 10: Create First Goal - Button
**Type**: Spotlight
**Target**: + Add Goal tlačítko
**Content**:
```
title: "Create Your First Goal"
content: "Click + Add Goal to set your first meaningful target!"
action: "click_element"
```

### Step 11a: Goal Title
**Type**: Spotlight
**Target**: Goal title input
**Content**:
```
title: "What's Your Goal?"
content: "Examples: 'Read 12 books', 'Run 100 kilometers', 'Save $1000', 'Learn Spanish'"
action: "type_text"
next_trigger: "first_character"
```

### Step 11b: Target Date
**Type**: Spotlight
**Target**: Target date picker
**Content**:
```
title: "When Do You Want to Achieve It? 📅"
content: "Set a realistic deadline that motivates you!"
action: "select_date"
```

### Step 11c: Unit Selection
**Type**: Spotlight
**Target**: Unit input/picker
**Content**:
```
title: "What Unit Will You Track?"
content: "Examples: books, kilometers, dollars, hours, pages, sessions"
action: "type_text"
```

### Step 11d: Target Value
**Type**: Spotlight
**Target**: Value input
**Content**:
```
title: "How Much Do You Want to Achieve?"
content: "Enter your target number - you can always adjust it later!"
action: "type_number"
```

### Step 11e: Category Selection
**Type**: Spotlight
**Target**: Category picker
**Content**:
```
title: "Choose a Category 📂"
content: "This helps organize your goals and track progress by area of life!"
action: "select_option"
```

### Step 11f: Create Goal
**Type**: Spotlight
**Target**: Create tlačítko
**Content**:
```
title: "Create Your Goal!"
content: "Click Create to add your first goal!"
action: "click_element"
```

### Step 12: First Goal Achievement
**Type**: Achievement Modal (automatické)
**Achievement ID**: `first-goal`
**Behavior**: Po vytvoření prvního cíle se automaticky spustí achievement modal
**Tutorial Action**: Čekat na uzavření achievement modalu, pak pokračovat na krok 13
**Note**: Už implementováno v GoalsContext.createGoal()

### Step 13: Navigate to Home
**Type**: Spotlight
**Target**: Home tab v bottom navigation
**Content**:
```
title: "Back to Your Dashboard 🏠"
content: "Click Home to see your progress overview!"
action: "click_element"
```

### Step 14: XP System Explanation
**Type**: Spotlight
**Target**: XP Progress bar sekce
**Content**:
```
title: "Your Growth Journey 📈"
content: "Everything you do earns XP! Complete habits, achieve goals, write in your journal - watch your level rise as you grow! 🌟"
action: "next"
```

### Step 15: Trophy Room
**Type**: Spotlight
**Target**: Trophy room tlačítko
**Content**:
```
title: "Your Trophy Collection 🏆"
content: "Here you'll see all the achievements you can unlock! Each milestone on your journey deserves recognition!"
action: "next"
```

### Step 16: Completion Modal
**Type**: Modal
**Content**:
```
title: "You're All Set! 🎊"
content: "Congratulations! You now know how to use SelfRise to build habits, achieve goals, and practice gratitude. Your transformation journey starts now - use this power to reach your dreams and build unshakeable self-worth!"
button: "Start My Journey!"
```

## Tutorial Text Positioning - Intelligent Adaptive System

### CRITICAL: Intelligent Positioning to Avoid Overlaps

**Problem**: Tutorial text může překrývat zvýrazněné elementy, zejména když jsou ve spodní části obrazovky (tab bar, bottom buttons).

**Solution**: **INTELLIGENT ADAPTIVE POSITIONING** - text se automaticky umístí tak, aby nepřekrýval target element.

#### Positioning Strategy Matrix:
```typescript
// 🎯 INTELLIGENT ADAPTIVE POSITIONING STRATEGY:
// Automaticky vybírá nejlepší pozici podle typu kroku a umístění targetu

1️⃣ MODAL CREATION STEPS (habit-*, goal-*)
   Strategy: DYNAMIC BELOW FIELD
   Calculation: spotlightTarget.y + spotlightTarget.height + 16px
   Reasoning: Text přímo pod formulářovým fieldem
   Examples: habit-name, goal-title, habit-color

2️⃣ TAB NAVIGATION STEPS (navigate-journal, navigate-goals, navigate-home)
   Strategy: TOP FIXED
   Position: 70-100px from top (device-dependent)
   Reasoning: Tab bar je DOLE → text NAHOŘE aby se nepřekrýval
   Examples: navigate-journal, navigate-goals

3️⃣ QUICK ACTIONS + GOAL-DATE STEPS
   Strategy: DYNAMIC BELOW TARGET
   Calculation: spotlightTarget.y + spotlightTarget.height + 16px
   Reasoning: Quick actions sekce a goal-date picker mohou být na různých pozicích → dynamické umístění pod target vyhýbá se overlaps
   Examples: quick-actions, goal-date

4️⃣ SMART AUTO-DETECTION (any spotlight step)
   Strategy: TOP if target.y > screen.height/2, else BOTTOM
   Reasoning: Pokud je target ve spodní polovině → text NAHORU
   Examples: Automatická detekce pro budoucí kroky

5️⃣ DEFAULT (other steps)
   Strategy: BOTTOM FIXED
   Position: ~50px from bottom
   Reasoning: Target je nahoře/uprostřed → text DOLE
```

#### Affected Steps:
- **Habit Creation**: Steps 5a (habit-name), 5b-5e (color, icon, days, create)
- **Goal Creation**: Steps 11a (goal-title), 11b-11f (unit, target, date, category, create)

#### Implementation Strategy (V2 - Enhanced Android Support):
```typescript
const isModalCreationStep = (
  state.currentStepData?.id?.startsWith('habit-') ||
  state.currentStepData?.id?.startsWith('goal-')
) && state.currentStepData?.id !== 'habit-complete' && state.currentStepData?.id !== 'goal-complete';

if (isModalCreationStep && spotlightTarget) {
  // UNIFIED: Dynamické pozicování pod textovým polem pro OBA flows
  const basePosition = spotlightTarget.y + spotlightTarget.height + 16;

  // 🎯 V2 ENHANCEMENT: Dynamic card height calculation instead of fixed 250px
  const tutorialCardHeight = calculateTutorialCardHeight(); // ~170-220px based on device
  const bottomSafePadding = 20; // Extra breathing room

  // Android-specific: Extra padding for navigation bar variations
  const androidNavBarExtra = Platform.OS === 'android' ? 8 : 0;

  const maxTop = Dimensions.get('window').height - insets.bottom - tutorialCardHeight - bottomSafePadding - androidNavBarExtra;
  const finalPosition = Math.min(basePosition, maxTop);

  position = { top: finalPosition, left: margin, right: margin };
}

// Helper: Calculate tutorial card height dynamically
const calculateTutorialCardHeight = (): number => {
  const cardPadding = getCardPadding(); // 18-32px based on device
  const titleHeight = scaleFont(Fonts.sizes.xl) * 1.3;
  const titleMargin = isTablet() ? 16 : (screenSize === SMALL ? 10 : 12);
  const contentHeight = scaleFont(Fonts.sizes.md) * 1.5 * 2; // 2 lines
  const contentMargin = isTablet() ? 16 : (screenSize === SMALL ? 12 : 14);
  const progressHeight = isTablet() ? 40 : (screenSize === SMALL ? 30 : 35);
  const buttonHeight = showNext ? (isTablet() ? 36 : 32) : 0;

  const total = (cardPadding * 2) + titleHeight + titleMargin +
                contentHeight + contentMargin + progressHeight + buttonHeight;

  return Math.ceil(total + 40); // +40px safety margin
};
```

#### Benefits:
1. **Skutečně "Pod Polem"**: Text se vždy zobrazí pod textovým polem bez ohledu na zařízení
2. **Cross-Platform**: Funguje na iOS, Android, tabletech automaticky
3. **Safe Area Aware**: Respektuje safe areas různých zařízení
4. **Konzistence**: Habit a Goal flows fungují identicky
5. **Adaptive**: Přizpůsobuje se velikosti obrazovky a orientaci
6. **🆕 Android Navigation Bar Support**: Automaticky respektuje různé Android navigační módy (gesture, 3-button, 2-button)
7. **🆕 Dynamic Height Calculation**: Výška tutorial cardu se počítá dynamicky podle obsahu a zařízení

#### Migration Notes:
- **V1 (Original)**: Fixní pozice 120px = problémy na různých zařízeních
- **V1.5 (First Fix)**: Dynamické pozicování s fixní rezervou 250px = lepší, ale stále nedokonalé na Androidu
- **V2 (Android Fix)**: Dynamický výpočet výšky cardu + Android-specific padding
- **V3 (Current - Fully Responsive)**: Vše relativní k `safeHeight` (% místo px), maxHeight 40%, ScrollView na content, žádné hardcoded pixely
- **Impact**:
  - iOS (všechny velikosti): Funguje perfektně ✅
  - Android (gesture nav): Funguje perfektně ✅
  - Android (3-button nav): Funguje perfektně ✅
  - Tablets: Funguje perfektně ✅

#### Android-Specific Enhancements:
```typescript
// Android navigation bar heights (for reference):
// - Gesture navigation: ~20px
// - 3-button navigation: ~48px
// - 2-button navigation: ~40px

// Safe area automatically detected via useSafeAreaInsets()
const insets = useSafeAreaInsets();
// insets.bottom will be: 20-48px on Android (depends on nav mode)
//                        34px on iOS (home bar)

// Extra Android padding ensures comfortable spacing regardless of nav mode
const androidNavBarExtra = Platform.OS === 'android' ? 8 : 0;
```

---

## Technical Implementation

### 1. Tutorial State Management
```typescript
interface TutorialState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  isSkipped: boolean;
  userInteractionBlocked: boolean;
}

interface TutorialStep {
  id: string;
  type: 'modal' | 'spotlight';
  target?: string; // CSS selector nebo ref
  content: {
    title: string;
    content: string;
    button?: string;
  };
  action: 'next' | 'click_element' | 'type_text' | 'select_option' | 'select_date' | 'type_number' | 'select_days';
  nextTrigger?: 'first_character' | 'selection' | 'click';
  validation?: (value: any) => boolean;
}
```

### 2. Overlay Component Architecture
```typescript
<TutorialProvider>
  <TutorialOverlay>
    {/* SpotlightEffect — Skia Canvas-based, GPU-rendered */}
    <SpotlightEffect target={spotlightTarget} action={...} targetId={...} onTargetPress={...}>
      {/* Internally renders: */}
      <Canvas style={absoluteFill}>
        <Rect … />                          {/* Dark overlay (0.75 opacity) */}
        <Group blendMode="dstOut">
          <RoundedRect … >                  {/* Spotlight cutout */}
            <BlurMask blur={8} />           {/* Soft edges */}
          </RoundedRect>
        </Group>
        <RoundedRect … style="stroke" />    {/* Pulsing glow ring (orange) */}
        <RoundedRect … style="stroke" />    {/* Inner white border */}
      </Canvas>
      {/* Clickable overlay (Animated.View) — only when action requires tap */}
    </SpotlightEffect>

    <TutorialContent step={currentStep} />  {/* Tutorial card with title/content/buttons */}
    <SkipButton onSkip={handleSkip} />
    <NextButton visible={showNext} onNext={handleNext} />
  </TutorialOverlay>
  <App />
</TutorialProvider>
```

**Klíčové aspekty architektury:**
- `SpotlightEffect` je **jeden komponent** — Canvas + clickable overlay vše v jednom
- Pozice spotlight se přenáša přes `target` prop (`{ x, y, width, height }`) z `TutorialTargetHelper`
- Přechody mezi kroky jsou GPU-accelerated přes Reanimated `withSpring` SharedValues
- `pointerEvents="none"` na Canvas umožňuje prosvítnout tappy na elementy pod ním (form fields, pickers)

### 3. Animation Specifications (Reanimated v3 + Skia)

Všechny animace běží na **UI thread** přes react-native-reanimated SharedValues — žádný JS-thread overhead.

```typescript
// --- Entrance fade-in ---
// Celý Canvas se zobrazuje za 200ms při prvním renderu
entranceOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });

// --- Spotlight position/size transitions (glide effect mezi kroky) ---
// withSpring pro přirozený přechod na nový target
const SPRING_CONFIG = { damping: 20, stiffness: 150, mass: 0.8 };
animatedX.value     = withSpring(target.x - PADDING, SPRING_CONFIG);
animatedY.value     = withSpring(target.y - PADDING, SPRING_CONFIG);
animatedWidth.value = withSpring(target.width  + PADDING * 2, SPRING_CONFIG);
animatedHeight.value= withSpring(target.height + PADDING * 2, SPRING_CONFIG);

// --- Pulse animation (glow ring) ---
// Infinite loop: 0→1 za 1200ms, pak 1→0 za 1200ms, opakování
pulseProgress.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
  ),
  -1  // infinite
);

// Derived values z pulseProgress:
//   glowOpacity: interpolate [0, 0.5, 1] → [0.3, 0.7, 0.3]  (fade in/out)
//   glowScale:   interpolate [0, 0.5, 1] → [1.0, 1.08, 1.0]  (subtle scale)
```

**Cleanup:** `cancelAnimation(pulseProgress)` se zavolá při unmount komponenty.

### 4. Interaction Blocking
```typescript
// Blokování všech interakcí kromě tutorial elementů
const blockNonTutorialInteractions = (allowedSelectors: string[]) => {
  // Přidat overlay s pointer-events: none
  // Výjimky pro allowedSelectors s pointer-events: auto
};
```

## Storage & Persistence

### 1. Tutorial Completion Tracking
```typescript
const TUTORIAL_STORAGE_KEY = 'onboarding_tutorial_completed';
const TUTORIAL_STEP_KEY = 'onboarding_current_step';

// Uložení stavu pro případ přerušení
const saveTutorialProgress = async (step: number) => {
  await AsyncStorage.setItem(TUTORIAL_STEP_KEY, step.toString());
};

// Označení tutoriálu jako dokončeného
const markTutorialCompleted = async () => {
  await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
};
```

### 2. Resume Tutorial Logic
```typescript
const shouldShowTutorial = async (): Promise<boolean> => {
  const isCompleted = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
  return isCompleted !== 'true';
};

const getTutorialResumeStep = async (): Promise<number> => {
  const step = await AsyncStorage.getItem(TUTORIAL_STEP_KEY);
  return step ? parseInt(step, 10) : 1;
};
```

## Content Guidelines

### 1. Text Writing Rules
- **Motivační tón**: Používat pozitivní, povzbuzující jazyk
- **Emojis**: Přidat relevantní emojis pro vizuální přitažlivost
- **Krátké texty**: Maximum 2 věty pro content
- **Actionable**: Jasně říci co má uživatel udělat
- **Examples**: Poskytovat konkrétní příklady při vyplňování

### 2. Button Text Standards
```typescript
const BUTTON_TEXTS = {
  next: "Next",
  continue: "Continue",
  start: "Let's Start!",
  create: "Create",
  done: "Start My Journey!",
  skip: "Skip Tutorial"
};
```

### 3. Error States
```typescript
// Pokud uživatel zkusí jít příliš rychle nebo přeskočit požadovanou akci
const VALIDATION_MESSAGES = {
  emptyField: "Please fill in this field first!",
  invalidSelection: "Please make a selection!",
  requiredAction: "Complete this step to continue!"
};
```

## Integration Points

### 1. Screen Integration
- **Home Screen**: Quick Actions highlighting
- **Habit Creation**: Form field highlighting a validation
- **Journal Screen**: Button highlighting
- **Goals Creation**: Progressive form completion
- **Trophy Room**: Achievement preview

### 2. Navigation Integration
```typescript
// Tutorial kontroluje navigaci
const handleTutorialNavigation = (targetScreen: string) => {
  if (tutorialState.isActive && tutorialState.currentStep === expectedStep) {
    // Povolit navigaci
    navigateToScreen(targetScreen);
    advanceTutorialStep();
  } else {
    // Blokovat navigaci
    showTutorialReminder();
  }
};
```

### 3. Form Integration
```typescript
// Progresivní vyplňování formulářů
const handleFormInput = (fieldName: string, value: string) => {
  if (tutorialState.isActive && isCurrentTutorialField(fieldName)) {
    if (value.length > 0 && tutorialState.nextTrigger === 'first_character') {
      showNextButton();
    }
  }
};
```

## Success Metrics

### 1. Tutorial Completion Tracking
```typescript
interface TutorialMetrics {
  startedAt: Date;
  completedAt?: Date;
  skippedAt?: Date;
  lastStepReached: number;
  timeSpentTotal: number;
  timeSpentPerStep: number[];
  interruptionCount: number;
}
```

### 2. Analytics Events
- `tutorial_started`
- `tutorial_step_completed` (with step number)
- `tutorial_skipped` (with step number)
- `tutorial_completed`
- `tutorial_resumed`
- `tutorial_form_validation_failed`

## Edge Cases & Error Handling

### 1. App Interruption
- Uložit current step před backgrounding
- Obnovit tutorial při návratu do app
- Nabídnout možnost pokračovat nebo začít znovu

### 2. Navigation Conflicts
- Blokovat deep links během tutoriálu
- Blokovat notifikační navigaci
- Handle back button behavior

### 3. Form Validation
- Ukázat chyby jemně s možností opravy
- Nepokračovat dokud není vše správně vyplněno
- Poskytovat contextual help

## Implementation Decisions & Clarifications

### 1. Technology Stack
- **@shopify/react-native-skia** — GPU-accelerated Canvas rendering pro spotlight overlay (dark overlay + cutout via `BlendMode.dstOut` + BlurMask + glow ring). Vyžaduje native module → nelze testovat v Expo Go, nutný EAS development build.
- **react-native-reanimated v3** — Všechny animace (position transitions, pulse, entrance fade) běží na UI thread přes SharedValues + `useDerivedValue`. Žádný JS-thread overhead.
- **TutorialTargetHelper** — Utility pro měření pozice target elementů na screen (`onLayout` → `{ x, y, width, height }`), přenáša do `SpotlightEffect` přes props.

### 2. Form Validation Requirements
**První znak trigger** - Pro všechny text input fieldy (habit název, goal název, unit) stačí napsat první znak pro aktivaci Next tlačítka.

### 3. Responsive Design (V3 - Relative Positioning)

**AKTUALIZACE 2026-03-15**: Kompletní přechod z hardcoded pixelů na relativní hodnoty.

#### Princip: Vše relativní k `safeHeight`
```typescript
const screenHeight = Dimensions.get('window').height;
const safeHeight = screenHeight - insets.top - insets.bottom; // použitelná výška
```

#### Pozicování tutorial karty:
| Pozice | Vzorec | Účel |
|--------|--------|------|
| **TOP** | `insets.top + safeHeight * 0.06` | Karta nahoře (pod status barem) |
| **BOTTOM** | `insets.bottom + safeHeight * 0.05` | Karta dole (nad navigační lištou) |
| **DYNAMIC** | `spotlight.y + spotlight.height + safeHeight * 0.02` | Pod spotlight targetem |
| **Skip button** | `insets.top + 8` | Vždy pod status barem |

#### Omezení velikosti karty:
```typescript
contentCard: {
  maxHeight: safeHeight * 0.4,  // max 40% použitelné výšky
}
```
- **Title, progress bar, button** = fixní (vždy viditelné)
- **Content text** = ve ScrollView (scrolluje se pokud je text delší)
- Spotlight má vždy min. 60% obrazovky

#### Auto-scroll reserves (% z výšky obrazovky):
```typescript
topReserve = isQuickActions ? height * 0.25 : (isTypeInput ? height * 0.18 : height * 0.12);
bottomReserve = isTypeInput ? height * 0.42 : height * 0.25;
```

#### Příklady výpočtů na různých zařízeních:
| Zařízení | safeHeight | Card maxH | Top pos | Bottom pos |
|----------|-----------|-----------|---------|------------|
| iPhone SE | 647px | 259px | 59px | 52px |
| iPhone 15 Pro | 759px | 304px | 105px | 72px |
| Pixel 7 | 794px | 318px | 98px | 88px |
| iPad | 1036px | 414px | 86px | 72px |

#### Android Edge-to-Edge:
- Všechny modály mají `statusBarTranslucent={true}`
- `insets.bottom` automaticky respektuje gesture nav (20px) i 3-button nav (48px)
- Žádné `Platform.OS` podmínky - vše přes `useSafeAreaInsets()`

### 4. Recovery & Resume Logic
**Crash recovery** - Pokud se aplikace crashne během tutoriálu, při restartu se nabídne pokračování od posledního uloženého kroku nebo restart celého tutoriálu.

### 5. Achievement Integration

> ⚠️ **PŘEPSÁNO 2026-07-14.** Předchozí verze této sekce tvrdila, že se `first-habit`
> a `first-goal` achievement modaly během tutoriálu **potlačují** a jsou "nahrazeny"
> kroky habit-complete / goal-complete. **To je nesprávné** a neodpovídá zamýšlenému
> produktovému chování (potvrzeno Petrem 2026-07-14). Platí pravidla níže.

#### Zamýšlené chování (ZÁVAZNÉ)

**První spuštění aplikace (tutoriál poprvé):**
- Step 9 `habit-create` → návyk se vytvoří → odemkne se achievement **`first-habit`**
  → **achievement modal SE ZOBRAZÍ** (uživatel ho zavře)
- Poté navazuje Step 10 `habit-complete` (vlastní gratulační modal tutoriálu)
- Analogicky Step 20 `goal-create` → **`first-goal`** → **achievement modal SE ZOBRAZÍ**
  → poté Step 21 `goal-complete`

**Restart tutoriálu z Nastavení:**
- Uživatel už `first-habit` i `first-goal` odemčené **má** → achievement se znovu
  neodemyká → **žádný achievement modal se nezobrazí**
- Uživatel dostane **jen** gratulační modal tutoriálu (Step 10 / Step 21)

**Klíčový princip:** Achievement modal se během tutoriálu **nepotlačuje uměle**.
Zobrazí se právě tehdy, když se achievement skutečně odemkne — což je přirozeně
jen při prvním průchodu. Restart je "tichý" sám od sebe, protože duplicitní odemčení
nenastane (`storeUnlockEvent` vrací false).

#### Technická implementace

```typescript
// AchievementContext.tsx - addToCelebrationQueue
// Během tutoriálu se potlačí VŠECHNY achievement modaly KROMĚ first-habit / first-goal,
// aby tutoriál nezahltily nesouvisející odemčené trofeje, ale klíčové dva milníky
// uživatel viděl.
const isFirstStepAchievement = achievement.id === 'first-habit' || achievement.id === 'first-goal';
if (tutorialActive && !isFirstStepAchievement) {
  return; // odemčeno + XP přiděleno, ale bez modalu
}
```

Formuláře (`HabitForm.tsx`, `GoalForm.tsx`) po odeslání **čekají na zavření achievement
modalu** (`achievementCelebrationClosed`) a teprve pak posunou tutoriál na další krok —
aby se gratulace za trofej a gratulační modal tutoriálu nepřekryly.

#### ⚠️ Past: čekání na modal, který nepřijde

Když achievement modal z jakéhokoli důvodu **nedorazí** (už odemčeno, chyba v odemykání),
čekání ve formuláři doběhne až na **fallback timeout** a tutoriál na několik sekund
"zamrzne". Proto platí:

- Fallback timeout musí být **krátký** (ne 10 s) — uživatel nesmí čekat na nic.
- Cesta „achievement se má odemknout" musí být **funkční** — viz split-brain bug
  s `goalStorage` v `AchievementIntegration` (červenec 2026), kvůli kterému se
  `first-goal` NIKDY neodemkl a tutoriál na kroku 20 čekal 10 s.

#### Achievement modaly po tutoriálu
Po dokončení/přeskočení tutoriálu se achievement modaly zobrazují **zcela normálně**
(všechny kategorie, bez potlačování).

### 6. Tutorial Restart System
**Tutorial Restart** - Uživatelé mohou kdykoli restartovat tutorial z Settings obrazovky s okamžitým spuštěním.

#### Funkcionalita:
- **Settings Screen**: "Restart Tutorial" tlačítko v Tutorial sekci
- **Immediate Launch**: Okamžité spuštění tutoriálu po potvrzení
- **Auto Navigation**: Automatická navigace na Home screen před spuštěním
- **Complete Reset**: Vymaže všechna tutorial data (progress, session, crash logs)

#### User Flow:
1. Uživatel klikne "Restart Tutorial" v Settings
2. Zobrazí se ConfirmationModal s varováním
3. Po potvrzení se spustí `restartTutorial()` funkce
4. Automatická navigace na Home screen
5. Tutorial se okamžitě spustí od Step 1
6. Success modal potvrdí restart

#### Technická implementace:
```typescript
const restartTutorial = async (): Promise<void> => {
  // Reset all tutorial data
  await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
  await AsyncStorage.removeItem(TUTORIAL_SKIPPED_KEY);
  dispatch({ type: 'RESET_TUTORIAL' });

  // Navigate to Home screen
  router.push('/(tabs)' as any);

  // Delay for navigation completion
  await new Promise(resolve => setTimeout(resolve, 300));

  // Start tutorial immediately
  dispatch({ type: 'START_TUTORIAL', payload: { steps: TUTORIAL_STEPS } });
  await saveTutorialProgress(1);
};
```

#### Lokalizace:
- `tutorialReset: 'Restart Tutorial'` (změněno z "Reset Tutorial")
- `tutorialResetDescription: 'Restart the tutorial from the beginning'`
- `tutorialResetConfirmTitle: 'Restart Tutorial?'`
- `tutorialResetConfirmMessage: 'This will restart the tutorial from the beginning and guide you through the app again. This action cannot be undone.'`
- `tutorialResetSuccess: 'Tutorial has been restarted successfully! You are now being guided through the app.'`

#### Achievement Compatibility:
- **Repeated Runs**: Tutorial lze spustit opakovaně bez problémů s achievementy
- **No Achievement Conflicts**: Žádné achievement kroky neexistují v tutoriálu
- **Clean Restart**: Každý restart je kompletně nezávislý

## Future Enhancements

### 1. Advanced Features
- ✅ **Tutorial restart možnost v settings** (IMPLEMENTOVÁNO)
- Skip specific sections pro advanced uživatele
- A/B testing různých tutorial flows
- Tutorial na nové features při app updates
- **Achievement Integration**: Volitelné obnovení achievement modalů pro komplexnější onboarding

### 2. Personalization
- Adaptivní tutorial na základě user behavior
- Různé tutorial paths pro různé user personas
- Smart skipping opakujících se konceptů

---

*Tato dokumentace definuje kompletní onboarding tutorial systém pro SelfRise V2 aplikaci s integrací existujícího achievement systému.*