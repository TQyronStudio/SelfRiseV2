# ✨ SelfRise – Prémiový vzhled (design systém + pohyb) – plán

*Založeno 2026-10-22. Zdroj zadání: vzkaz z jiného chatu Claude (celý v Příloze A) + referenční snímky.*
*Stav: 🔨 **Směr rozhodnut 2026-10-22** – dnešní barvy, doladěné; těžiště je v tom, jak appka
**působí** (písmo, klid, povrchy, pohyb). **Běží F1 – Design Lab** (testovací obrazovka
v Nastavení, návrh Home + úvod při spuštění, kolo 2). Otevřená rozhodnutí: R-3 až R-9.*

> **Jak číst:** kapitoly 1–3 jsou podklad (námitky, audit, co pomůže nejvíc), 4 je rozhodnutý
> směr, 5–6 technický základ, **7 rozhodnutí**, **8 plán s odškrtávacími body**.
> Hotové body se hned odškrtávají `[x]`. `projectplan.md` na tento soubor jen odkazuje.
>
> **Reference** (mimo repo, cizí snímky do repa nepatří): `~/Desktop/SelfRise/Desing - reference/`
> (13× „Bloom", 5× „Forest"). Berou se jako inspirace pro **pocit**, ne jako předloha.

---

## 0. SHRNUTÍ NA JEDNU OBRAZOVKU

- **Cíl (Petr, 2026-10-22):** nejde o nové barvy, ale o to, **jak appka působí**: plynulost,
  hmatatelnost, klid, „prémiovost".
- **Kde se ten pocit bere (od nejvíc po nejmíň):** písmo a hierarchie → klid a místo →
  povrchy (vrstvy, zaoblení, hloubka) → pohyb a dotyk → barvy.
- **Barvy:** identita zůstává (modrá, zlatá pro odměny…). Jen se doladí: méně syté tóny,
  zklidněná hlavička (dnes sytě modrý pruh), oprava chyby v barvách návyků a kontrast
  podle WCAG AA.
- **T-Qyron** (modro-fialový „kvantový" vzhled studia) = budoucí třetí režim, odemyká se na
  **úrovni 20**. **Teď se jím nezabýváme.** Je ale důvod, proč dělat barvy přes tokeny:
  bez nich by T-Qyron přebarvil jen část appky. Detaily @projectplan-future-updates.md
  (Phase 2.1).
- **Laboratoř designu:** v Nastavení (jen ve vývojové verzi) tlačítko „Design Lab", které
  otevře samostatnou obrazovku. Na ní se ladí vzhled bez reálných dat. Skutečné obrazovky se
  mění až po schválení návrhu.
- **Doporučené pořadí vydání:** nejdřív 7.0.2 a měření trychtýře na současném vzhledu, redesign
  pak vyjde **celý najednou** (R-5).

---

## 1. NÁMITKY PŘED STAVBOU (pravidlo 1)

### 1.1 Jak se tahle třída problému řeší běžně
Zavedené produkty (Headspace, Calm, Duolingo, Finch, Things) nedělají „hezčí obrazovky", ale
**design systém**: sémantické tokeny (barva podle *role*, ne podle odstínu), typografická škála,
mřížka mezer, sada primitiv (text, povrch, tlačítko, ukazatel) a **pohybový jazyk** (pár
pevných časování a pružin). Obrazovky se pak skládají z primitiv. Migruje se postupně a
nový kód hlídá automatická pojistka, aby se staré hodnoty nevracely (tzv. „ráčna"). Pro ladění
vzhledu bez rizika se používá izolované hřiště (Storybook, „playground"). U nás je to
**Design Lab** přímo v appce: Petr ho vidí na telefonu a nepotřebuje žádný další nástroj.

### 1.2 Kde má zadání slabiny
1. **Reference jsou prototypy, ne aplikace.** Na snímcích je vidět kurzor myši. Nemají reálná
   data, reklamu, tři jazyky, velké písmo ani prázdné stavy a půlku dojmu dělají fotky.
   **Přenositelné je:** písmo s povahou, klid a místo, měkké vrstvy, záře u důležitého,
   plynulý pohyb.
2. **„Žádné změny funkcí" vs. hierarchie.** Největší skok přinese uklidnění obrazovek (jeden
   hrdina, méně ikon na řádek). Hraničí to s „funkcemi": například pauza, úprava a smazání
   návyku v nabídce „⋯". Bez svolení ne (R-4).
3. **Postupné vydávání po obrazovkách** by ukázalo napůl předělanou appku a zkreslilo měření
   trychtýře prvního dne (R-5).
4. **Marketing:** videa s Mendem natočená teď by za pár týdnů ukazovala starý vzhled (R-5).
5. **Emoji odměn (⭐🔥👑)** vypadají na iOS a Androidu jinak. Teď zůstávají (jsou to jazyk
   odměn), vlastní ikony jsou volitelný krok ve F5.
6. **Průvodce je v rozporu s cílem:** `technical-guides.md` (Theme & Color System) zakazuje
   stíny v tmavém režimu a předepisuje dvě šedé vrstvy. Změnu musí Petr schválit (R-8).

### 1.3 Jak by vypadala špičková verze
- **Jeden hrdina na obrazovku:** Home = „dnešek" (pozdrav + **oblouk dne**: slunce putuje po
  oblouku nad obzorem s každým splněným návykem – vizuální „Self**Rise**"), Návyky = dnešní
  pokrok, Deník = dnešní 3 záznamy.
- **Hmatatelnost:** každý dotyk má odezvu (zmenšení + haptika), odškrtnutí má pružinu,
  čísla se plní a nepřeskakují. Velká oslava jen při splnění dne nebo levelu.
- **Klid:** víc místa, menší paleta, výrazný přechod jen u hlavní akce, pokroku a oslavy.
- **Nic se nerozpadne:** DE nejdelší texty, největší systémové písmo, snížený pohyb, banner,
  prázdné a načítací stavy, tablet.

### 1.4 Jak toho reálně dosáhnout u nás (ověřeno 2026-10-22)
| Potřeba | Jak | Ověření |
|---|---|---|
| Fonty | `expo-font` přes `useFonts`. Funguje s `npm start` bez nového buildu; pro vydání lze vložit do buildu config pluginem (Expo ho doporučuje). **Android:** každá tloušťka = vlastní rodina, nikdy `fontWeight` u vlastního fontu, jinak potichu spadne na systémové písmo. | [Expo Fonts docs](https://docs.expo.dev/versions/v55.0.0/sdk/font) |
| Pohyb | **Reanimated 4** (máme 4.2.1). Výchozí `ReduceMotion.System` = animace samy respektují systémový „snížený pohyb" (ověřeno ve zdrojovém kódu knihovny). Staré RN `Animated` to neumí. | [Software Mansion – Reanimated 4](https://swmansion.com/blog/reanimated-4-is-new-but-also-very-familiar-b926dd59aa40), [freeCodeCamp – Reanimated v4](https://www.freecodecamp.org/news/how-to-create-fluid-animations-with-react-native-reanimated-v4/) |
| Stíny stejné na iOS i Androidu | `boxShadow` (Nová architektura, kterou máme), Android 9+. Přechody přes `expo-linear-gradient`, **ne** `experimental_backgroundImage` (oficiálně „nepoužívat v produkci"). | [RN 0.83 View style props](https://reactnative.dev/docs/0.83/view-style-props), [RN 0.79 View style props](https://reactnative.dev/docs/0.79/view-style-props) |
| „Glass" | Nativní Liquid Glass (iOS 26) na Androidu spadne na obyčejný View → porušuje paritu. Jen gradient, průsvitnost a okraj. | [Expo glass-effect](https://docs.expo.dev/versions/v54.0.0/sdk/glass-effect), [Expo native tabs](https://docs.expo.dev/router/advanced/native-tabs.md) |
| Snímky před/po | iOS simulátory (iPhone SE 3, 16 Pro Max) a Android emulátory (Pixel 7, Pixel Tablet) na Macu jsou. Automatizace přes **Maestro** (`assertScreenshot` od v2.2.0) – zatím nenainstalovaný (R-7). | [Maestro – visual testing](https://maestro.dev/blog/visual-testing), [RN testing tools 2026](https://quashbugs.com/blog/best-react-native-testing-tools) |
| Skilly v prostředí | `frontend-design`, `theme-validator`, `design:accessibility-review`, `design:design-system`, `dataviz` (grafy), `i18n-auditor`, `app-store-screenshots` | seznam skillů v session |
| Zvažováno a nedoporučeno | **Unistyles 3** = nová nativní závislost, nový audit R8, přepsání všech stylů. Zůstáváme u `useTheme()` + memoizovaných stylů. | – |

---

## 2. AUDIT SOUČASNÉHO UI (čísla z kódu 2026-10-22)

*Měřeno skriptem nad `app/`, `src/`, `components/` (147 souborů `.tsx`, bez testů).
Vizuálně podle marketingových snímků z května 2026.*

| Oblast | Stav | Proč to vadí |
|---|---|---|
| **Paleta** | Světlý režim = Bootstrap 4 (`#28A745`, `#DC3545`, `#17A2B8`, `#FFC107`, `#6C757D`, `#212529`…), hlavní barva systémová modrá iOS `#007AFF`. Tmavý režim = systémové barvy iOS. | Dojem „obecné appky". |
| **Kontrast** | `#007AFF` jako text na bílé má **4,02 : 1**. Norma AA pro běžný text je 4,5. | Modré odkazy a popisky jsou hůř čitelné. |
| **Barvy návyků** | Ve světlém režimu „zelená" = modrá `#45B7D1`, „oranžová" = růžová `#FD79A8`, „růžová" = žlutá `#FDCB6E`. V tmavém sedí. Mapa barev zkopírovaná v ≥ 3 komponentách. | Uživatel vybere zelenou a vidí modrou. Po přepnutí režimu návyk změní odstín. |
| **Barvy natvrdo** | **427** hex literálů v **58** souborech (87 různých) + 52 `rgba`. Nejvíc: XP lišta 34, XP bublina 20, oslava deníku 18. | Nejde je řídit z jednoho místa. Část nereaguje na tmavý režim a třetí režim (T-Qyron) by je nepřebarvil. |
| **Písmo** | Jen systémové. **597×** `fontSize` natvrdo, **24 různých velikostí** (7–80). Přes tokeny 156×. `'bold'` 197× vs `'700'` 14×. Titul úrovně v `Times New Roman`/`serif` (na iOS a Androidu jiné písmo). | Hierarchie není čitelná na první pohled. |
| **Velké písmo** | Nikde `maxFontSizeMultiplier` | Při největším systémovém písmu hrozí rozpadlé řádky |
| **Zaoblení** | **25 různých hodnot** (1–60), nejčastěji 12/8/16/20 | Karty, tlačítka a čipy nepůsobí jako jedna rodina |
| **Mezery** | 25 různých hodnot, ale tokeny `Layout.spacing` 561× | Nejlepší oblast |
| **Stíny** | 17 souborů, průhlednost 0–0,8 bez systému | Hloubka je náhodná |
| **Tmavé pozadí** | Token `background` = čistě černá `#000`, ač to průvodce zakazuje | Nekonzistence |
| **Hlavička** | Sytě modrý pruh na všech záložkách | Nejvíc „generický" prvek |
| **Pohyb** | Staré RN `Animated` ve **23** souborech, Reanimated v **8**, Skia v 1. Snížený pohyb respektuje 9 souborů. | Nejednotné časování |
| **Dotyk** | `TouchableOpacity` v **74** souborech (jen zprůhlednění), haptika ve 12 | Dotyk není „hmatatelný" |
| **Modaly** | `<Modal>` ve **33** souborech, každý vlastní vzhled | Oslavy a formuláře nepůsobí jako jeden svět |
| **Hierarchie** | Home až 10 bloků stejné váhy. Řádek návyku má 4 ikonová tlačítka. Deník má dvě sytá tlačítka vedle sebe. | Vizuální šum, žádný hrdina |
| **Mrtvé věci** | Lottie + 3 animace nikdo nepoužívá, pozůstatky šablony Expo (`HelloWave`, `ParallaxScrollView`…). `SafeLinearGradient` místo přechodu kreslí jednu barvu (obcházel varování SDK 53, které na SDK 55 už není). | Úklid ve F5, jen se svolením |

---

## 3. ZÁSADY, KTERÉ Z AUDITU PLYNOU

- **Barva podle role, ne podle odstínu:** `surface`, `textMuted`, `accent`, `reward`.
- **Jedna škála od každého:** písmo ~8 stupňů, mezery 4/8 mřížka, zaoblení 4 stupně.
- **Ráčna:** převedený soubor nesmí obsahovat hex, `fontSize` ani `borderRadius` natvrdo.
  Hlídá to test se seznamem převedených souborů, seznam může jen růst.
- **Nový pohyb jen Reanimated.** Staré `Animated` se převádí jen v komponentě, kterou
  zrovna přestylováváme. XP bublina dostane jen nový vzhled, ne nové časování
  (@technical-guides:Gamification-UI.md).

---

## 4. ROZHODNUTÝ SMĚR: „DNEŠNÍ BARVY, DOLADĚNÉ" (Petr, 2026-10-22)

**Identita zůstává, mění se dojem.** Modrá zůstává hlavní barvou a zlatá barvou odměn. Mění
se písmo, místo, povrchy a pohyb. Barvy se jen zklidní a opraví.

### 4.1 Paleta (první návrh, kontrast ověřen výpočtem WCAG 2026-10-22)

| Role | Světlý | Tmavý | Poznámka |
|---|---|---|---|
| Plátno | `#F3F5F9` | `#0E1014` | tmavý už ne čistě černý |
| Povrch / zvýšený | `#FFFFFF` / `#F6F8FB` | `#171A21` / `#1F232C` | |
| Okraj | `rgba(16,24,40,0.07)` | `rgba(255,255,255,0.07)` | + v tmavém světlá horní hrana karty |
| Text / tlumený / slabý | `#1A2233` / `#5D6678` / `#7C8598` | `#F3F5F9` / `#A0A8B8` / `#737C8E` | 15,9 / 5,8 / 3,7 : 1 (sv.), 16,0 / 7,3 / 4,2 : 1 (tm.) |
| Hlavní (text, ikony) | `#0A62D8` | `#5A9DFF` | 5,6 : 1 / 6,4 : 1 (dnes `#007AFF` 4,0 : 1) |
| Hlavní přechod (tlačítko, pokrok) | `#1E6CEB` → `#0A57C7` | `#2370EA` → `#1A5AD6` | bílý text ≥ 4,6 : 1 |
| Odměna (XP) | výplň `#F4B63F` + text `#3B2A05`; samostatný zlatý text `#9A6400` | `#F6C350` | zlatá na bílé jen jako výplň (1,8 : 1) |
| Série (plamen) | `#C2541A` | `#FF9A4D` | |
| Splněno | `#1E9E5A` (text `#15804A`) | `#3CCB7F` | |

**Barvy návyků:** stejný odstín v obou režimech (jen jas doladěný), jedna sdílená mapa.

### 4.2 Písmo (kandidáti, v laboratoři se dají vyměnit)
- **Nadpisy: Fraunces** (měkký, laskavý serif; řezy SemiBold + SemiBold Italic). Pokrývá
  DE/ES včetně ẞ (ověřeno). Nemá tabulkové číslice → na **plnící se čísla nepoužívat**.
- **Text a čísla: Figtree** (čistý, přátelský; Regular/Medium/SemiBold/Bold). Pokrývá DE/ES,
  **má tabulkové číslice** → čísla při plnění neposkakují.
- Obě písma mají licenci SIL OFL 1.1 (licence leží vedle souborů v `assets/fonts/`).

### 4.3 Tvary a pohyb
- Karty zaoblení 24, tlačítka a čipy jako pilulka, malé prvky 12.
- Hloubka: ve světlém měkký dvouvrstvý stín, v tmavém světlejší povrch + tenká horní hrana
  + střídmý stín.
- Pohyb: náběh 8–12 px + průhlednost, rozestup 50 ms; stisk 0,97 + lehká haptika;
  odškrtnutí pružina; čísla a oblouk dne se plní 400–1000 ms (plnění pokroku je „hlavní pohyb"
  obrazovky).

### 4.4 Co se s původními směry stalo
- **Směr A „Krystal"** (indigo, ledová azurová, fialová) → **základ budoucího T-Qyron
  režimu (úroveň 20)**, viz @projectplan-future-updates.md Phase 2.1. Teď se neřeší.
- **Směr B „Úsvit"** → vyřazen (blízko referenci Bloom).

---

## 5. TECHNICKÝ ZÁKLAD (fáze F2 – bez viditelné změny)

- **Tokeny** (nová složka `src/design/`): sémantické barvy pro oba režimy (a později třetí
  režim T-Qyron jako další sada), typografie, mezery, zaoblení, povrchy, pohyb. Staré
  `colors` zůstávají, dokud je něco čte. Výchozí bod jsou **laboratorní tokeny**
  (`src/screens/design-lab/labTokens.ts`) po Petrově schválení.
- **Přístup:** rozšířit `useTheme()` o nové tokeny (žádná nová knihovna). Styly převedených
  komponent přes memoizovanou továrnu, která se přepočítá jen při změně režimu.
- **Fonty:** `assets/fonts` (v laboratoři už jsou), načtení v `app/_layout.tsx`, rodina pro
  každou tloušťku. Velikost appky zhruba +0,4 MB (6 řezů).
- **Primitiva:** `AppText` (varianty + strop zvětšení písma), `Surface`, `PressableScale`
  (pružina + haptika přes `hapticsService`, který respektuje přepínač v Nastavení), `Button`,
  `ProgressBar`, `DayArc` (Skia), `AnimatedNumber`, `CheckButton`, `ScreenHeader`, `EmptyState`,
  náběh. Laboratoř je má v první verzi (`src/screens/design-lab/labPrimitives.tsx`).
- **Pohybové tokeny:**

  | Token | Hodnota |
  |---|---|
  | rychlý (stisk, přepnutí) | 150 ms |
  | základ (náběh, změna stavu) | 250 ms |
  | pomalý (plnění pokroku, přechod) | 400 ms (oblouk dne až 1000 ms) |
  | stisk | 0,97 + lehká haptika |
  | náběh | 8–12 px + průhlednost, rozestup 40–60 ms, nejvýš 6 položek postupně |
  | snížený pohyb | `ReduceMotion.System` (výchozí v Reanimatedu): skočí na konečný stav |

- **Animuje se jen `transform` a průhlednost** na UI vlákně. Žádný blur v seznamech. Skia jen
  pro oblouk dne, oslavu a pozadí hrdiny.
- **Nový průvodce `technical-guides:Design-System.md`** (kostra podle pravidla 10, po R-8).

---

## 6. CO TEĎ FUNGUJE A NESMÍ SE POKAZIT

- **Logika beze změny:** XP a limity, série, pauzy, Smart Bonus Conversion, dluh deníku a
  reklamy za odměnu, měsíční výzvy, trofeje.
- **Fronta oslavných oken** (@technical-guides:Gamification-UI.md,
  `modalQueueOrdering.test.ts`): mění se vzhled oken, ne fronta.
- **Úvod** (@technical-guides:Tutorial.md): žádný RN `<Modal>`. Pulz zaškrtávátka návyku
  z obrazovky 1 (`highlight` v `HabitCompletionButton`) je přímo na obrazovce Návyky.
- **XP bublina a souhrnná lišta:** „jedna časová osa", „počítat entity", „neurychlovat".
- **Barevné stupně úrovní** (šedá → zelená → modrá → fialová → zlatá → červená) mají význam.
- **Reklamy:** banner na 11 obrazovkách, skrytý během úvodu. Podle pravidel AdMob se reklama
  nesmí přestylovat ani posadit těsně k ovládacím prvkům.
- **Analytika** beze změny, **velké obrazovky** (`contentColumn`, `getModalWidth`,
  `useWindowDimensions`), **řazení** přes úchyt, **i18n**, **R8** (fonty jsou jen assety).
- **Design Lab se nikdy nesmí objevit v obchodní verzi** (hlídá test `designLab.test.ts`).

---

## 7. ROZHODNUTÍ

| # | Otázka | Stav / doporučení |
|---|---|---|
| **R-1** | Směr vzhledu | ✅ **Rozhodnuto 2026-10-22:** dnešní barvy, doladěné. Těžiště v písmu, klidu, povrchách a pohybu (kap. 4). |
| **R-2** | Náhled před rozhodnutím | ✅ **Rozhodnuto 2026-10-22:** Design Lab v Nastavení. Samostatná obrazovka bez reálných dat, první návrh = Home. |
| **R-3** | Pilot na skutečné obrazovce: **Návyky + hlavička + spodní lišta**, nebo Home? | Doporučuji Návyky + chrome (uzavřená obrazovka, děje se na ní první odškrtnutí). Rozhodne se po schválení návrhu v laboratoři. |
| **R-4** | Rozsah „vzhled": (a) vzhled hlavičky a lišty (trasy beze změny), (b) hrdina dne nahoře na Home (pořadí ostatních bloků zůstává uživatelovo), (c) pauza, úprava a smazání návyku do nabídky „⋯" | Doporučuji a, b, c ano. (c) je nejcitlivější. Laboratoř ukazuje (a) a (b). |
| **R-5** | Pořadí vydání: nejdřív 7.0.2 + měření trychtýře, redesign ve větvi `design-v2` a vydat celý najednou; UI pro marketing natáčet až po vydání | Doporučuji ano |
| **R-6** | Pozdrav podle denní doby (EN/DE/ES, bez jména) | Doporučuji ano. Laboratoř ukazuje návrh, finální texty ke schválení ve F4. |
| **R-7** | Instalace **Maestro CLI** (jen nástroj na Macu) na automatické snímky před/po | Doporučuji ano |
| **R-8** | Nahradit kapitolu „Theme & Color System" v `technical-guides.md` novým `Design-System.md` | Doporučuji ano (pravidla 3.4 a 10) |
| **R-9** | Úvod při spuštění ve skutečné appce (pravidla v kap. 8 pod F1) | Doporučuji ano, za uvedených podmínek; rozhodnout po prohlídce v laboratoři |
| **R-10** | Nový XP systém (odznak úrovně vlevo nahoře na každé obrazovce + jiskry místo souhrnné lišty) ve skutečné appce; velký modal level-upu jen u milníků? | Doporučuji ano; modal jen u milníkových úrovní, jinak stačí odznak |
| **R-11** | Dny návyku: barva = identita návyku (libovolná, i žlutá/červená), stav = tvar (● ○ ★ × ━) – i ve skutečném kalendáři a grafech | Doporučuji ano (srozumitelnost u každé barvy návyku, WCAG 1.4.1, laskavý tón) |
| ~~R-12~~ | ~~Barvy RED/YELLOW zobrazovat jinak~~ | **Zrušeno (kolo 19)** – stav nese tvar, barvy uživatelům zůstávají |
| **T-Qyron** | Třetí režim | ✅ **Rozhodnuto 2026-10-22:** úroveň **20**, základ = bývalý směr A, **teď se neřeší** (@projectplan-future-updates.md Phase 2.1) |

---

## 8. PLÁN PO FÁZÍCH

*Každý krok: `npx tsc --noEmit` + `npm test` zelené, snímky před/po, malý commit (jen na Petrův
pokyn, pravidlo 12). Snímky před/po mimo repo: `~/Desktop/SelfRise/Design - pred-po/`.*

### F0 – Rozhodnutí (Petr)
- [x] R-1 směr: dnešní barvy, doladěné (2026-10-22)
- [x] R-2 náhled: Design Lab v Nastavení (2026-10-22)
- [x] T-Qyron: úroveň 20, později (2026-10-22)
- [ ] R-3 pilot
- [ ] R-4 rozsah (a / b / c)
- [ ] R-5 pořadí vydání + marketing
- [ ] R-6 pozdrav
- [ ] R-7 Maestro
- [ ] R-8 průvodce
- [ ] R-9 úvod při spuštění ve skutečné appce
- [ ] R-10 nový XP systém + level-up modal jen u milníků
- [ ] R-11 dny návyku: barva = identita, stav = tvar (● ○ ★ × ━)
- [x] ~~R-12~~ zrušeno v kole 19 (tvar místo vyhrazených barev)

### F1 – Design Lab: testovací prostředí (2026-10-22)
*Samostatná obrazovka bez reálných dat. Nic z ní neovlivní skutečné obrazovky, data,
analytiku ani reklamy. Texty laboratoře nejsou v překladech (vývojový nástroj, jako
„Marketing Demo"). Ukázkové texty Home jsou EN + DE, aby šlo zkoušet délky.*
- [x] Pojistka: tlačítko jen ve vývojové verzi (`__DEV__`) nebo s `EXPO_PUBLIC_ENABLE_DESIGN_LAB=true`;
      test, že se v obchodní verzi nikdy neukáže (+ negativní kontrola)
- [x] Nastavení → sekce „Design Lab" → tlačítko „Test design" → nová obrazovka `design-lab`
- [x] Ovládání laboratoře: zpět, světlý/tmavý (jen pro laboratoř, nastavení appky se nemění),
      EN/DE (délky textů), měřič FPS (Reanimated `PerformanceMonitor`, JS i UI vlákno),
      přehrát animace znovu, ukazatel „snížený pohyb"
- [x] Laboratorní tokeny (`labTokens.ts`) podle kap. 4 + primitiva (`labPrimitives.tsx`: text,
      povrch, stisk s haptikou, oblouk dne ve Skia, pruh, plnící se čísla, odškrtávátko)
- [x] Fonty Fraunces + Figtree (6 řezů, OFL) načtené jen v laboratoři
- [x] **Návrh Home** (`HomeConcept.tsx`): pozdrav podle denní doby místo modrého pruhu, hrdina
      dne (oblouk se sluncem + počet + série + XP dnes + vlídná věta), rychlé akce, dnešní návyky
      (odškrtnutí naživo posune slunce, počet i XP), úroveň s XP pruhem, série deníku, měsíční
      výzva, týden v grafu, místo pro banner, návrh spodní lišty
- [x] Ověřeno: `tsc` 0 chyb, 62 sad / 997 testů, lint nových souborů čistý, bundle pro iOS se
      sestaví (Metro export). Na zařízení zatím neviděno – simulátorový build na Macu není.
- [x] Petr 2026-10-22: „vypadá to opravdu lépe, všechny potřebné položky zachované" → kolo 2
- [x] **Kolo 2 – úvod při spuštění** (`introTimeline.tsx`): jedna časová osa na UI vlákně
      (`t` 0→1), každý prvek má své okno; ťuknutí kamkoli přeskočí. Varianta `launch` (2,2 s):
      noc = přesně dnešní splash (`#07051A`, krystalové S 200 bodů) se rozzáří a zvedne jako
      opona s měkkým okrajem a zlato-modrým „prvním světlem" na obzoru; pod ní se poskládá den
      (pozdrav slovo po slově → hrdina → oblouk se nakreslí → vyjde slunce a počet tiká s ním →
      čipy → karty). Varianta `settle` (0,95 s) pro každé další otevření a přepnutí záložky.
- [x] **Kolo 2 – Home o úroveň výš:** obloha hrdiny podle denní doby (ráno/den/večer/noc, v noci
      měsíc místo slunce), slunce pomalu „dýchá", splnění posledního návyku = jediná velká
      oslava (záblesk + prstenec světla na konci oblouku + haptika úspěchu), řádek návyku se po
      odškrtnutí jemně rozzáří a ikona radostně poskočí, XP v čipu se přičítá plynule, vlídná
      věta se prolne místo skoku, velký pozdrav při rolování zpomaleně odplouvá a předá místo
      kompaktní hlavičce, karty úrovně a výzvy reagují na stisk
- [x] **Kolo 2 – přechody:** ukazatel ve spodní liště klouže pružinou na zvolenou záložku,
      stránky se prolínají (ostatní záložky zatím jen zástupná stránka); v liště laboratoře
      ▶ = celé spuštění, ↻ = rychlý náběh
- [x] Ověřeno (kolo 2): `tsc` 0 chyb, lint čistý, 62 sad / 997 testů, bundle pro iOS i Android
      se sestaví. Na zařízení zatím neviděno.
- [x] Petr 2026-10-22: „velice pěkné, úhledné, značně prémiovější" → kolo 3 „koruna"
- [x] **Kolo 3 – oprava:** plnění pod okrajem obrazovky (XP úrovně, pruh výzvy, sloupce týdne) se
      přehrávalo hned po otevření, kdy ho nikdo neviděl → teď startuje, až je karta na obrazovce
- [x] **Kolo 3 – koruna** (vše ve stejném příběhu „den"; v liště laboratoře ✨ = zapnout/vypnout pro
      srovnání s klidnou verzí):
  - rolování (`scrollChoreography.tsx`): karty se zespodu vynoří zpoza banneru a nahoře odplují
    do hloubky (menší, tlumenější, pomalejší), další karta se přes ně přesune jako balíček;
    hrdina se při rolování stáhne a den žije dál jako **malý oblouk se sluncem v kompaktní
    hlavičce** (stejná hodnota → odškrtnutí ho posune i tam)
  - na oblouku **značka za každý návyk** – rozsvítí se a krátce zvětší, když kolem projde slunce
  - kolem slunce **pomalu se otáčející paprsky** (jedna otáčka za 30 s; v noci u měsíce ne)
  - při spuštění appky **jemné ťuknutí haptiky za každý splněný návyk**, kolem kterého slunce projde
- [x] Záměrně NE (méně je víc, viz kap. 1): poletující částice, nepřetržitě se hýbající pozadí,
      přichytávání rolování, vlastní „gumové" přetažení (na Androidu by se chovalo jinak než na iOS)
- [x] Ověřeno (kolo 3): `tsc` 0 chyb, lint čistý, 62 sad / 997 testů, bundle pro iOS i Android se
      sestaví. Na zařízení zatím neviděno.
- [x] Petr 2026-10-22: „koruna dobrá na zpestření, ale trhá se to, když roluju" → kolo 4 (plynulost)
- [x] **Kolo 4 – příčiny trhání a opravy:**
  - karty při rolování měnily průhlednost → systém musel každou kartu (stín, přechod, u hrdiny
    Skia) v každém snímku skládat mimo obrazovku → **jen posun a zmenšení, žádná průhlednost**
  - tři karty při objevení zapsaly stav celé obrazovky → uprostřed rolování se překreslil celý
    Home → **stav „karta je vidět" drží každá karta sama** (`useCardSeen`)
  - plátno oblouku se překreslovalo každý snímek (dýchání, paprsky) i během rolování a mimo
    obrazovku, navíc s filtrem rozostření → **záře a paprsky radiálním přechodem bez rozostření;
    smyčky se zastaví, když se roluje nebo je hrdina mimo obrazovku**
  - kompaktní hlavička s plátnem Skia se objevovala průhledností → **vysune se shora**
- [x] Petr 2026-10-22: „pořád trhavé, i s vypnutou korunou; chybí plynulé prémiové flow" + „chci pocit
      144Hz monitoru, na iPhonu i Androidu" → kolo 5
- [x] **Kolo 5 – skutečná příčina:** i bez koruny se v každém snímku rolování přepočítávalo 17 věcí
      (posouvající se pozdrav, kompaktní hlavička, 7 karet, 7 hlídačů „vidět", pauza oblouku) přes
      Reanimated. Ten v naší verzi (4.2.1, výchozí přepínače) propisuje každou změnu přes commit
      celého stromu nové architektury → 60× za vteřinu. **Všechno navázané na rolování teď jede
      přes nativní ovladač React Native** (`Animated.event` + `useNativeDriver`): posun jde rovnou
      do nativních pohledů, bez JS a bez commitů. Reanimated zůstal jen tam, kde rolování nehraje
      roli (úvod, odškrtnutí, oblouk). Kontrola: v laboratoři už žádný Reanimated kód nečte
      pozici rolování.
- [x] **120 Hz – iPhone:** `CADisableMinimumFrameDurationOnPhone = true` už je v projektu (šablona
      Expa, vzniká při každém buildu) → na iPhonech Pro s ProMotion appka smí 120 Hz. Na běžných
      iPhonech je strop 60 Hz (hardware).
- [ ] **120 Hz – Android** (F2, nový nativní build): o frekvenci rozhoduje systém a výrobce
      (Samsung, Pixel…); appka si o ni může říct jen nativně – podle Androidu přes `setFrameRate()`,
      ne `preferredDisplayModeId` (developer.android.com/media/optimize/performance/frame-rate).
      Nejdřív změřit: na Androidu se 120Hz displejem zapnout v laboratoři měřič FPS – drží-li UI
      kolem 60, appka je zastropovaná a má smysl config plugin. Pozor na baterii (jen během pohybu).
- [x] Petr 2026-10-22 po kole 5: „je to značně lepší" (vývojový režim přes `npm start`)
- [ ] Petr: ověřit plynulost i v „produkčním" JS
- [x] Petr 2026-10-22: „tvoje nápady jsou super, chci to tam všechno" → **kolo 6 – šperky**:
  - **číslice jako počítadlo kilometrů** (`RollingNumber.tsx`): mění se jen číslice, které se mění,
    každá ve svém sloupci; počet v oblouku se protáčí přesně se sluncem; XP v čipu, XP úrovně,
    „3/5", „73 %"
  - **živý oblouk**: ťuknutí na značku ukáže návyk a stav; tah prstem po oblouku prochází návyky
    s haptickým cvaknutím u každého (vodorovný tah – svislý dál roluje)
  - **plamen série** z vlastních Lottie animací projektu (`StreakFlame.tsx`): oheň; ťuknutí =
    ukázka zmrzlé série (led); další ťuknutí = zahřátí (praskne led → kapka → pára → zažehnutí)
    + haptika úspěchu
  - ~~**cvaknutí** v momentě, kdy se hrdina při rolování předá hlavičce~~ → **odebráno (kolo 7,
    Petr: „působí, jako bych na něco kliknul")** – pravidlo: **haptika jen jako odpověď na dotyk**,
    nikdy při samotném rolování
  - **karta deníku se rozroste do detailu** (`JournalDetailConcept.tsx`) a při zavření se do ní
    vrátí; Android „zpět" zavírá. Ve skutečné appce = přechod do záložky Deník → rozhodnutí R-4
  - **obloha hrdiny se s pokrokem dne otepluje** do zlatova
- [x] **Kolo 8 – gratulace k trofeji** (Petr 2026-10-22: „kostrbaté a o ničem, jen se objeví";
      `AchievementCelebrationConcept.tsx`, v liště laboratoře 🏆 = další vzácnost common → legendary):
      skutečné texty trofejí z překladů (EN/DE); medaile **vystoupá jako slunce**, kolem ní se
      dokreslí prstenec světla v barvě vzácnosti → záblesk + výbuch světla + haptika podle vzácnosti;
      nadpis nad medailí, název slovo po slově, popis, XP se protočí; **žije**: paprsky se točí,
      medaile se vznáší, po líci přejede odlesk; „Pokračovat" → medaile **odletí do ikony trofejí**
      v hlavičce Home (= uložila se do síně trofejí). Ťuknutí během náběhu přeskočí, Android
      „zpět" zavírá, snížený pohyb = vše hned na místě, oznámení pro čtečku obrazovky.
      Ve skutečné appce zůstává jedním oknem z `ModalQueueContext` (invariant fronty platí).
- [x] **Kolo 9 – XP, které je vidět přiletět** (Petrův nápad, 2026-10-22; `xpFlight.tsx`):
  - **odznak úrovně vlevo nahoře na každé obrazovce**: číslo úrovně + zlatý kroužek, který se plní
    (skutečná křivka z `levelCalculation.ts`); zůstává, i když se stránka roluje
  - u odškrtnutí vyskočí **„+25 XP"**, chvíli podrží, **praskne na zlaté jiskry** a ty odletí do
    odznaku; každá jiskra, která dopadne, ho „nasaje" (pulz, záře, kroužek povyroste o svůj díl)
  - gratulace k trofeji připíše XP **až po „Continue"** a jiskry vyletí z toho tlačítka
  - **přechod na další úroveň**: kroužek se uzavře, zableskne, číslo se protočí, vyjede štítek
    „LEVEL UP · 17", haptika úspěchu (laboratoř startuje 237 XP pod úrovní 17 → legendární trofej
    ji předvede)
  - pravidla: odškrtnutí zpět nic neposílá, kroužek jen ubyde; XP mimo obrazovku letí ze středu;
    víc zisků najednou = víc vln, každá jiskra se počítá jednou; snížený pohyb = bez letu
  - ve skutečné appce by nahradilo souhrnnou lištu XP nahoře (`XpAnimationContext`, pravidla v
    @technical-guides:Gamification-UI.md – počítání entit, dávkování) a změnilo hlavičku
    (odznak místo trofeje vlevo) → **rozhodnutí R-10** (+ zda zůstane velký modal level-upu,
    nebo jen u milníkových úrovní 10/25/50/75/100)
- [x] **Kolo 10 – oprava letu XP** (Petr: „z trofeje letí nahoru doprostřed, ne do kroužku; každá tečka
      má narazit do kroužku a kroužek má reagovat na každou"): ohyb dráhy byl nahoře uprostřed (u dlouhých
      letů i nad obrazovkou) → teď mezi výbuchem a odznakem, jiskra vystoupá a zahne přímo do kroužku;
      **dopadá NA kroužek** z té strany, odkud letí; **reakce na každý zásah běží na UI vlákně v tom
      samém snímku** (dřív JS časovač → ve vývojovém režimu se rozcházel s letem): rozsvítí se kousek
      kroužku v místě dopadu, záblesk, pulz a kroužek povyroste o díl té jiskry
- [x] **Kolo 11 – druhá oprava letu** (Petr: „pořád jde přímo nahoru, nárazy nevidím"): skutečné příčiny –
      (1) jiskra se rozjížděla pomalu a zrychlovala až na konci, takže u dlouhé cesty většinu letu jen
      stoupala a do odznaku se stočila v posledním zlomku vteřiny → teď souvislý oblouk mířící k odznaku
      od začátku, mírné zrychlení; (2) záblesk nárazu byl téměř bílý na bílém odznaku → teď sytě zlatý
      (světlý režim) se září, vlnka z místa dopadu („vsákne se") a odznak dostane štulec od zásahu;
      (3) zásahy po 38 ms se slévaly → 70 ms od sebe, méně a větší jiskry, každý náraz je vlastní úder
- [x] **Kolo 12 – jiskry se netrefovaly** (Petr: „oblouk tam je, ale netrefuje se"): měřil se celý řádek
      odznaku včetně skrytého štítku „LEVEL UP" → střed vycházel ~70 bodů vpravo od kroužku. Teď se měří
      jen kroužek (48×48) a všechny body se převádí do souřadnic vrstvy, ve které jiskry létají
      (odolné vůči stavovému řádku / navigaci, hlavně na Androidu)
- [x] Petr 2026-10-22 po kole 12: „tak, to je ono" – let XP do odznaku schválen v laboratoři
- [x] **Kolo 13 – obrazovka Návyky + kalendář návyku** (`HabitsConcept.tsx`, `HabitDetailConcept.tsx`,
      mock + pravidla párování `habitsMock.tsx`; záložka „Habits" v laboratoři):
  - **týden** = 7 dní s kroužkem „kolik z plánu dne se splnilo", dnešek zvýrazněný
  - **dnes** = počet + pruh z dílků, jeden dílek na dnešní návyk, vybarví se barvou návyku; XP dnes
  - karty návyků: ikona, název, série, **mini-týden ze 7 teček** (stejné barvy jako kalendář), „⋯",
    zaškrtnutí s „+25 XP" a jiskrami do odznaku (sdílené s Home)
  - **Bonus** = návyky mimo dnešní plán: zlaté zaškrtnutí, +15 XP; když bonus nahradí vynechaný den
    tohoto týdne, karta to hned napíše („Make-up · covers Tue")
  - **Pozastavené** dole, ztlumené, s „Fortsetzen/Resume"
  - „⋯" = nabídka Kalendář & statistika / Upravit / Pozastavit / Smazat (návrh R-4c)
  - **kalendář** se rozroste z karty: série, nejlepší série, úspěšnost 30 dní; měsíc s posunem;
    dny: splněno, **make-up (zelená ↺)**, **bonus (zlatá ★)**, vynecháno, **nahrazeno (zelený kroužek)**,
    pauza (⏸), plánováno, dnes; **tenký zelený oblouček spojí make-up s dnem, který nahradil**;
    ťuknutí na den řekne slovy, co se stalo; legenda ze skutečných textů appky; vysvětlení make-up
  - ověřeno dočasným testem: párování jen v rámci týdne Po–Ne, jen minulé vynechané dny, pauza nikdy
    jako vynechaný den (9 párů za 8 týdnů)
- [x] **Kolo 14** (Petr: „nechápu barvy teček u Workoutu; z kalendáře nejde odejít křížkem; dodělej řazení"):
  - **křížek nešel stisknout**: připnutý odznak úrovně měl obal přes celou šířku horního řádku a polykal
    ťuknutí (blokoval i tlačítka vpravo nahoře na Home) → obal jen kolem odznaku a průchozí; zavírací
    křížek detailů (kalendář, deník) je v horním řádku vpravo, obsah začíná pod odznakem
  - **tečky mini-týdne**: pod každou písmeno dne; **nahrazovací pár propojený zelenou čárkou** (plná
    tečka = den navíc, který zachránil; kroužek = zachráněný vynechaný den) – stejná řeč jako
    oblouček v kalendáři
  - **řazení** (`HabitsReorderConcept.tsx`): skutečná `ReorderableList` appky (pravidla z průvodce
    platí beze změny), karty se zúží na řádky s pořadovým číslem a úchytem, po puštění se čísla
    protočí na nové pozice, „Done" s haptikou; nové pořadí se hned propíše do seznamu
- [x] **Kolo 15 – barvy dnů** (Petr: „červený návyk je červený, když ho splním i když ho vynechám; zachráněný
      den je zelený, i když návyk sleduji v červené"): míchaly se dva jazyky – barva návyku (identita) a barva
      stavu. Teď **barva = jen identita návyku, stav = tvar**: plná = splněno / den navíc, který zachránil;
      prázdný kroužek v barvě návyku = zachráněný den (spojený čárou/obloučkem v barvě návyku); plná se
      zlatým lemem = bonus; šedý prázdný kroužek (v kalendáři s ×) = vynecháno, **žádná červená**; šedá
      čárka = pauza. Nespoléhá na barvu jako jediný nositel informace (WCAG 1.4.1) a sedí na „laskavého
      průvodce". Platí v mini-týdnu karet i v kalendáři; i podbarvení odškrtnuté karty je v barvě návyku.
- [x] **Kolo 16 – překrývající se páry** (Petr: „Po, St, Pá; Po i St vynechám, splním ve Čt – spojnice by
      protnula středu"): párování je chronologické (Čt zachrání **Po**), takže spojnice nesmí vypadat, že se
      dotýká St. **Mini-týden**: spojnice je **závorka pod tečkami** └──┘ se zarážkami jen na dvou dnech páru;
      překrývající se páry jdou do další řady závorek. **Kalendář**: překrývající se páry v jednom týdnu mají
      různé dráhy – první oblouček nad dny, druhý pod nimi (řádky kalendáře rozestoupené). Ukázka na návyku
      **Read** (Po · St · Pá) v posledních 2 týdnech; odškrtnutí Read v sobotu přidá druhý pár (So zachrání St)
      – ověřeno dočasným testem
- [x] **Kolo 17 – barvy podle Petra**: vynechaný den **sytě rudý** (šedá působila, „jako bych to ani nemusel
      dělat"), bonus zpět **zlatý**; **podmínka: stavové barvy nesmí být v nabídce barev návyku** → změřeno
      ΔE2000: oranžová byla od zlaté jen 15 (hraniční), v tmavém režimu růžová/korálová splývaly s rudou →
      nová paleta: oranžová `#EE6E1F` / `#F57A2E`, růžová tmavá `#F57AD0`, vynecháno `#B0102C` / `#E0213D`;
      každá barva návyku ≥ ΔE 20 od rudé i zlaté, mezi sebou ≥ 12 (světlý i tmavý)
- [x] **Kolo 17 – tvorba návyku** (`HabitComposerConcept.tsx`, tlačítko „+" na obrazovce Návyky): jeden sheet
      bez kroků – **živý náhled karty** nahoře (mění se s názvem, barvou, ikonou a dny), velké pole názvu,
      **„Začni z nápadu"** = skutečné předvolby appky (`HABIT_PRESETS` + texty z úvodu), barvy jen z povolené
      palety (8, RED/YELLOW jako korálová/limetková), ikony ze sdílené `HABIT_ICON_MAP`, dny jako kulaté
      přepínače + rychlá volba Každý den / Pracovní dny / Víkend, popis; **stejná validace a chybové texty
      jako `HabitForm`** (2–50 znaků, aspoň 1 den, popis ≤ 200), chyba = zatřesení pole + haptika; „Create"
      se rozsvítí až při platném formuláři; po vytvoření se karta přidá na konec (jako v appce), stránka
      k ní dojede a karta 2× zazáří barvou návyku
- [x] **Kolo 18 – tvary stavů podle Petra**: **vynecháno = rudý prázdný kroužek s ×** (v mini-týdnu jen rudý
      kroužek – × se do 9 bodů nevejde), **bonus = barva návyku uvnitř + zlatý lem** (★ v kalendáři);
      pulzování jen **jednou** ve chvíli, kdy bonus dnes vznikne (trvalé pulzování desítek dnů = neklid,
      baterie, porušení „jeden hlavní pohyb na obrazovku") – na přání jedna změna
- [x] Petr 2026-10-24 k tvorbě návyku: „nemám co vytknout, vypadá skvěle"
- [x] **Kolo 19 – stav = TVAR, barva patří uživateli** (Petr: „uživatel, co chce žlutou, má mít žlutou; musíme
      odlišit naše bonusy"): rezervace rudé/zlaté z kola 17 **zrušena**. Každý stav má vlastní tvar nezávislý na
      barvě: ● splněno / den navíc, který zachránil; ○ zachráněný den (+ závorka/oblouček); **★ bonus**;
      **× vynecháno** (rudý křížek; v kalendáři na neutrálním podkladu bez kroužku, aby se nepletl se
      zachráněným dnem červeného návyku); ━ pauza; tenký neutrální kroužek = plánováno / dnes. Barvy návyku
      RED a YELLOW jsou zase pravá červená a žlutá. Symbol na barvě návyku (✓, ★, ↺, výběr barvy, dny
      v tvorbě) má **čitelnou barvu podle jasu** (tmavý na žluté, bílý na tmavších) – `onHabitColor()`
- [x] ~~**R-12**: appka dnes nabízí barvy návyku **RED** a **YELLOW** (a předvolba „Cvičení" v úvodu je RED) →
      zobrazovat je jako **korálovou** (`#FF6F61` / `#FFA08C`) a **limetkovou** (`#7FB800` / `#9ED11F`);
      uložená hodnota se nemění (žádná migrace dat), mění se jen kreslení; při převodu přidat test ΔE~~
      → **zrušeno v kole 19**: stav nese tvar, uživatel si barvu nechává
- [ ] **R-11**: změnit pravidla barev v @technical-guides:Habits.md („UI Display Rules": zelená make-up,
      zlatá bonus, červená vynecháno, modrá tečka) na „barva = identita, stav = tvar" – ve skutečné appce
      se to týká kalendáře návyku, týdenního/měsíčního grafu na Home i statistik
- [ ] **Nesoulad v appce (mimo laboratoř):** nápověda „Smart Make-up System" (EN/DE…) píše, že nahrazený
      den má **zlatou** fajfku – podle @technical-guides:Habits.md i kalendáře je make-up **zelený**,
      zlatý je čistý bonus → opravit text nápovědy (rozhodnutí Petra)
- [ ] Další gratulace ve stejném jazyce (level up, splněný cíl, měsíční výzva, série deníku,
      násobič XP) – po schválení trofeje
- [ ] Zvuk při splnění celého dne (volitelný, výchozí vypnutý) – potřebuje novou nativní knihovnu
      (`expo-audio`) → až s novým buildem (F2); do té doby zastupuje haptika
- [x] Ověřeno (kolo 6): `tsc` 0 chyb, lint čistý, 62 sad / 997 testů, bundle pro iOS i Android se
      sestaví. Na zařízení zatím neviděno. (`npx expo start --no-dev --minify --clear`
      + v `.env` `EXPO_PUBLIC_ENABLE_DESIGN_LAB=true`, protože bez vývojového režimu je laboratoř
      jinak skrytá); měřič FPS ukáže, jestli padá UI, nebo JS vlákno
- [ ] Pro skutečnou appku (F2, vyžaduje nový nativní build + test R8): statické přepínače
      Reanimatedu podle jeho průvodce výkonem – `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS`
      („nižší FPS při rolování"), `IOS_/ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` (pozor: s nimi
      `Pressable` z react-native uvnitř animovaného transformu umí „ztratit" ťuknutí → tlačítka
      z react-native-gesture-handler). Zvážit i upgrade Reanimatedu (od 4.3 je první přepínač
      výchozí). Zdroj: docs.swmansion.com/react-native-reanimated/docs/guides/performance
- [ ] Petr: prohlédnout na telefonu (světlý i tmavý, EN i DE, snížený pohyb) → připomínky
- [ ] Doladit podle připomínek → schválení návrhu Home
- [ ] Další návrhy v laboratoři podle potřeby (Návyky, Deník…) před převodem na skutečné obrazovky

### Úvod při spuštění ve skutečné appce – pravidla (návrh, schvaluje Petr; R-9)
Laboratoř ukazuje *jak* to vypadá. Do skutečné appky jen za těchto podmínek (tak to dělají
špičkové appky – krátké předání ze splashe, ne „intro", které se musí přetrpět):
- **Celé spuštění jen při prvním otevření dne** (od místní půlnoci), jen ze studeného startu.
  Každé další otevření = rychlý náběh pod 1 s. Návrat z pozadí = nic.
- **Ťuknutí kamkoli přeskočí**, snížený pohyb = rovnou hotová obrazovka.
- **Navazuje na nativní splash bez švu:** `SplashScreen.preventAutoHideAsync()` → první snímek
  opony je pixelově stejný jako splash → `hideAsync()` → animace.
- **Nesmí se potkat se startovními okny ani úvodem:** při prvním spuštění vede úvod (onboarding),
  opona se nehraje; ATT/souhlas (Startup Orchestrator) musí počkat, až opona doběhne, nebo
  opona čeká na ně (@technical-guides:Startup-Orchestrator.md, pravidlo „nikdy dva modaly").
- **Nikdy neprodlouží čekání na data:** opona se zvedá, až je databáze načtená; nic se kvůli ní
  nezpomalí.

### F2 – Základ: tokeny, fonty, primitiva (bez viditelné změny; 1–2 posezení)
- [ ] Větev `design-v2` (pokud R-5 = ano)
- [ ] Snímky „před": hlavní obrazovky, EN/DE/ES × světlý/tmavý, iPhone SE 3 + 16 Pro Max + Pixel 7,
      marketingová demo data
- [ ] Tokeny v `src/design/` (z laboratoře) vedle starých `colors`
- [ ] Jednotná paleta barev návyků + jedna sdílená mapa (oprava „zelená = modrá")
- [ ] Fonty v `app/_layout.tsx`, strop zvětšení písma
- [ ] Primitiva přesunutá z laboratoře do sdílených komponent
- [ ] Testy: kontrast WCAG AA všech dvojic, ráčna, typografie (rodina u každé varianty),
      negativní kontrola
- [ ] `technical-guides:Design-System.md` + odkaz z `technical-guides.md` (po R-8)
- [ ] Nezávislá revize + `theme-validator`

### F3 – Pilot na skutečné obrazovce (podle R-3; 1–2 posezení)
- [ ] Hlavička bez sytého pruhu, spodní lišta v novém stylu, místo pro banner podle AdMob
- [ ] Hrdina obrazovky, plynulé plnění pokroku
- [ ] Řádek návyku: povrch, klidnější dny, akce podle R-4c
- [ ] Odškrtnutí: pružina + haptika, **pulz z úvodu zachován**
- [ ] Postupný náběh, prázdný a načítací stav, řazení, pauza, bonus a make-up barvy
- [ ] Ověření: DE texty, největší písmo, snížený pohyb, tablet, Android emulátor
- [ ] Snímky před/po + video, `theme-validator`, `design:accessibility-review`, nezávislá revize
- [ ] **Petr: záznam na telefonu → připomínky → schválení pilotu**

### F4 – Další obrazovky, vždy po jedné (každá = snímky před/po + commit)
- [ ] Home (podle schváleného návrhu z laboratoře; grafy podle skillu `dataviz`)
- [ ] Deník + historie + statistiky
- [ ] Cíle + statistiky + formuláře
- [ ] Nastavení
- [ ] Trofeje, přehled úrovní, „Jak SelfRise funguje"
- [ ] Oslavná okna (10 typů ve frontě, jen vzhled) + potvrzovací a chybová okna
- [ ] Úvod (brána, uvítání, 3 obrazovky, závěr). Pozor na 5 pravidel a trychtýř.
- [ ] Chybová obrazovka databáze, soulad splashe

### F5 – Úklid (jen se svolením, pravidlo 6)
- [ ] Odstranit staré `colors`, až je nic nečte
- [ ] Převést zbývající RN `Animated` → Reanimated v přestylovaných komponentách
- [ ] Mrtvé pozůstatky (šablona Expo, Lottie, `SafeLinearGradient`)
- [ ] Volitelně: vlastní ikony místo emoji ⭐🔥👑
- [ ] Aktualizovat dotčené průvodce
- [ ] Rozhodnout, jestli Design Lab zůstane (ladění dalších obrazovek, T-Qyron), nebo se smaže

### F6 – Vydání
- [ ] Device test: iOS + Android, EN/DE/ES, světlý/tmavý, malý telefon, tablet, snížený pohyb,
      největší písmo
- [ ] Nové snímky do obchodů (`app-store-screenshots`) + popis novinky
- [ ] Předat marketingu (nový vzhled pro videa s Mendem)
- [ ] Po vydání: srovnat D1/D7 retenci a trychtýř před/po redesignem

### Hotovo, když (z původního zadání)
- [ ] Pilotní obrazovka je plynulá, jednotná a vizuálně jasně posunutá, ve světlém i tmavém režimu
- [ ] Nejdelší německé texty se vejdou, funguje snížený pohyb
- [ ] Testy projdou, k pilotu jsou snímky před/po

---

## 9. RIZIKA

| Riziko | Opatření |
|---|---|
| Rozsah (147 souborů) | větev, fáze, ráčna, jedna obrazovka = jeden commit |
| Smíšený vzhled v obchodě | vydat až celé jádro (R-5) |
| Dlouhá němčina + velké písmo | laboratoř EN/DE, strop zvětšení na nadpisech, zalamování místo zmenšování |
| Výkon na slabém Androidu | jen transform/průhlednost, žádný blur v seznamech, test na emulátoru Pixel 7 |
| Zkreslení měření trychtýře | pořadí vydání R-5 |
| Fonty potichu spadnou na systémové (Android) | rodina pro každou tloušťku + test |
| Design Lab unikne do obchodní verze | pojistka `__DEV__`/příznak + test |
| Rozbití úvodu nebo fronty oken | kap. 6, stávající testy + device scénáře z průvodců |

---

## 10. POUČENÍ Z LABORATOŘE – PRAVIDLA PRO OSTRÝ PŘEVOD

*Petr 2026-10-24: „všechny poznatky poctivě zapisuj, ať je naostro neřešíme 2×". Každé pravidlo
vzniklo z konkrétního problému v laboratoři (kolo v závorce). Při převodu do skutečné appky se
s touto kapitolou kontroluje každá obrazovka. Pravidla se po schválení přesunou do
`technical-guides:Design-System.md` (F2).*

> **Převod 1:1 – kde začít:** `src/screens/design-lab/PREVOD.md` (soubor laboratoře → cíl v appce,
> co převést a co ne) + blok `GOING LIVE (1:1)` v hlavičce každého souboru laboratoře (pasti
> konkrétně toho místa s čísly pravidel níže). **Nové poučení se zapisuje na obě místa** – sem
> pravidlo, do souboru odkaz na něj.

### 10.1 Plynulost
1. **Pohyb navázaný na rolování = nativní ovladač React Native** (`Animated.event` +
   `useNativeDriver`), ne Reanimated. Reanimated 4.2.1 s výchozími přepínači propisuje každou změnu
   commitem celého stromu → rolování se trhalo i s vypnutými efekty (kolo 4–5). Reanimated zůstává
   pro to, co není řízené rolováním (náběh, odškrtnutí, oblouk, gratulace).
2. **Karty se při rolování jen posouvají a zmenšují, nikdy nemění průhlednost** – karta se stínem,
   přechodem nebo plátnem Skia by se v každém snímku skládala mimo obrazovku (kolo 4).
3. **Stav „karta je vidět" drží karta sama**, ne celá obrazovka – jinak se uprostřed rolování
   překresluje celý Home (kolo 4).
4. **Plátna Skia s nepřetržitou animací se zastaví, když se roluje nebo jsou mimo obrazovku**;
   záře přes radiální přechod, ne přes filtr rozostření (kolo 4).
5. **Plnění a počítání pod okrajem obrazovky startuje, až je karta vidět** (kolo 3).
6. Ve vývojovém režimu (`npm start`) je všechno pomalejší – plynulost se posuzuje i v produkčním JS
   (`npx expo start --no-dev --minify`); 120 Hz: iPhone Pro ano (Info.plist), Android → F2 (kolo 5).

### 10.2 Haptika
7. **Haptika jen jako odpověď na dotyk** (odškrtnutí, ťuknutí, tažení po oblouku, úchyt řazení).
   Nikdy při samotném rolování – působí jako omylem stisknuté tlačítko (kolo 7).
8. Výjimka jen pro skutečnou událost vyvolanou uživatelem: odemčení trofeje, nová úroveň, splněný den.

### 10.3 Vrstvy a dotyk
9. **Prvek připnutý přes stránku (odznak úrovně) musí mít obal jen kolem sebe a být průchozí**
   (`pointerEvents="box-none"`, `alignSelf: 'flex-start'`) – obal přes celou šířku polykal ťuknutí
   na křížky a tlačítka pod ním (kolo 14).
10. **Obsah detailů/sheetů začíná pod řádkem s odznakem**; zavírací křížek je v tom řádku vpravo (kolo 14).
11. **Sheety a překryvy počítají s banerem a spodní lištou** (odsazení = výška chromu), jinak spodní
    řádky zajedou pod ně (kolo 13).

### 10.4 Létající XP a měření polohy
12. **Měřit přesně ten prvek, na který se míří** – měřil se řádek odznaku i se skrytým štítkem
    „LEVEL UP" a jiskry letěly ~70 bodů vedle (kolo 12).
13. **Souřadnice převádět do soustavy vrstvy, ve které se kreslí** (stavový řádek, navigace) (kolo 12).
14. **Reakce cíle na dopad běží na UI vlákně ve snímku dopadu**, ne přes JS časovač (kolo 10).
15. **Dráha míří k cíli od začátku** (oblouk vedle přímky, rovnoměrné tempo) – pomalý rozjezd a
    stočení až na konci čte oko jako „letí rovně nahoru" (kolo 11).
16. **Jednotlivé zásahy musí být rozlišitelné** – ~70 ms od sebe, záblesk kontrastní vůči podkladu
    (bílá na bílém odznaku nebyla vidět) (kolo 11).
17. XP se připisuje až po potvrzení (Continue); odebrané XP nic neposílá, kroužek jen ubyde (kolo 9).

### 10.5 Barvy a stavy návyků
18. **Barva návyku patří uživateli a je jen identita; STAV DNE NESE TVAR** – nezávisle na barvě, aby
    fungovala jakákoli barva (i žlutá a červená) a barvoslepí: ● splněno / den navíc, který zachránil;
    ○ zachráněný den (+ spojnice); **★ bonus**; **× vynecháno** (rudý, v kalendáři bez kroužku); ━ pauza;
    tenký neutrální kroužek = plánováno / dnes (kolo 15–19).
19. **Nevyhrazovat barvy a neměnit uživatelům jejich barvy** – pokus s rezervací rudé/zlaté a ΔE měřením
    (kolo 17) ukázal, že s pravou žlutou nebo červenou by se stav rozpadl; řešením je tvar, ne zákaz barev
    (kolo 19, Petr).
20. **Vynechaný den nesmí být šedý** – působí, „jako by na tom nezáleželo" → rudý × (kolo 17–19).
20b. **Žádné trvalé pulzování stavů** – animace jen v okamžiku vzniku (bonus se rozvlní jednou) (kolo 18).
20c. **Symbol na barvě návyku volí kontrastní barvu podle jasu** (tmavý na žluté, bílý jinde) –
    `onHabitColor()`; pevná bílá na žluté mizí (kolo 19).
21. **Nikdy jen barva** – stav nese i symbol (×, ★, ↺) nebo tvar (WCAG 1.4.1).
22. **Nahrazování se ukazuje jako vztah**: spojnice mezi dnem navíc a zachráněným dnem; párování je
    chronologické (nejstarší vynechaný ↔ nejstarší den navíc v týdnu Po–Ne), takže spojnice nesmí vést
    přes dny mezi nimi → **v mini-týdnu závorka pod tečkami**, **v kalendáři oblouček nad / pod dny**;
    překrývající se páry dostanou vlastní dráhu (kolo 16).
23. U teček mini-týdne **písmeno dne** – bez něj tečky nejdou přečíst (kolo 14).

### 10.5b Formuláře
- Tvorba/úprava = **jeden sheet s živým náhledem výsledku**, ne průvodce po krocích; předvolby jako
  „Začni z nápadu"; validace a chybové texty **přesně podle existujícího formuláře** appky; chyba =
  zatřesení pole, ne dialog; hlavní tlačítko se rozsvítí až při platném vstupu (kolo 17).

### 10.6 Navigace a přechody
24. Detail roste z karty, ze které se otevřel, a vrací se do ní; původní karta je mezitím skrytá
    (jedna karta, ne dvě) (kolo 6, 13).
25. Android „zpět" zavírá detail, gratulaci i sheet.
26. Odznak úrovně je na **každé** obrazovce na stejném místě (kolo 9).

### 10.7 Texty a data
27. Laboratoř bere skutečné texty z překladů, kde existují (trofeje, legenda kalendáře) – ověřit klíče
    v EN i DE (kolo 8, 13).
28. **Nalezený nesoulad v appce:** nápověda „Smart Make-up System" píše „zlatá fajfka" pro nahrazený
    den – po kole 17 je bonus zlatý a nahrazení v barvě návyku → text nápovědy přepsat (kolo 13, 17).

## Příloha A – původní zadání (vzkaz z jiného chatu Claude, 2026-10-22)

**ÚKOL:** Posunout vizuální kvalitu a pocit z appky SelfRise na „premium" úroveň. Žádné změny
funkcí ani logiky, jen vzhled a pohyb.

**KONTEXT**
- Appka je živá na iOS i Androidu (Expo/React Native, EN/DE/ES, světlý i tmavý režim, AdMob reklamy).
- Dnes vypadá obecně: systémové písmo, základní paleta, ploché karty s malým zaoblením, animace jen místy.
- Cíl: aby celek působil jako jeden promyšlený svět, plynulý a „hmatatelný", ne jako sada obrazovek.
- Referenční snímky jsou inspirace pro POCIT. Nekopírovat jejich písmo, obrázky ani rozvržení.
- Značka: laskavý průvodce, ne trenér s píšťalkou. Klidné, teplé, odměňující. Logo je krystalové „S" v indigu.

**PRINCIPY**
1. Jeden systém, ne úpravy po obrazovkách. Barvy, mezery, zaoblení, stíny, písmo i časování pohybu žijí na jednom místě jako tokeny. Nic natvrdo.
2. Písmo má povahu. Jeden výrazný font na nadpisy, jeden čistý na text. Hierarchie čitelná na první pohled. Diakritika EN/DE/ES a dlouhá německá slova.
3. Povrchy mají hloubku. Měkké vrstvy, větší zaoblení, jemné přechody, tenké okraje, střídmé stíny. Stejné na iOS i Androidu, žádné nativní „glass", jen gradient, průsvitnost a okraj. Dost místa kolem prvků.
4. Barva je omezená. Malá paleta, výrazný přechod jen pro to hlavní (tlačítko, pokrok, oslava). Světlý i tmavý režim, kontrast WCAG AA.
5. Pohyb dává smysl. Nic neskáče, každá změna stavu animovaná. Postupný náběh (krátké zpoždění, krátká vzdálenost). 150–400 ms, pružiny u věcí, kterých se dotýkáš. Stisk = mírné zmenšení + haptika. Čísla a ukazatele se plynule plní. Oslava jen k opravdovým momentům. Max jeden „hlavní" pohyb na obrazovku.
6. Plynulost je pravidlo. Animovat jen transform a průhlednost, na UI vlákně (Reanimated). Žádný těžký blur v seznamech. Skia jen pro výjimečné prvky. 60 fps i na slabším Androidu.
7. Nic se nesmí rozbít. Snížený pohyb, dynamická velikost písma, místo pro banner, prázdné/načítací/chybové stavy, texty ve všech třech jazycích.
8. Osobní tón. Pozdrav podle denní doby, vlídné texty. Nic nového bez schválení.

**POSTUP:** 1. audit → 2. směr + plán, ČEKAT NA SCHVÁLENÍ → 3. základ (tokeny a fonty,
jen sjednocení) → 4. pilot jedné obrazovky (Petr natočí záznam ze simulátoru) → 5. další
obrazovky po jedné, malý commit, testy zelené.

**ZAKÁZÁNO:** měnit logiku, data, reklamy, analytiku, navigaci nebo funkce. Těžké závislosti
bez zeptání (stačí Reanimated, Skia, gradienty, haptika, případně font a blur). Kopírovat cizí
design, písmo nebo obrázky.

**HOTOVO, KDYŽ:** pilot plynulý, jednotný, jasně posunutý ve světlém i tmavém režimu.
Nejdelší německé texty se vejdou, funguje snížený pohyb. Testy projdou, přiložené před/po.
