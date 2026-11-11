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
| **R-13** | Deník: splnění dne (3. záznam) **na místě** – zezelenání, jedno rozzáření, haptika, série naskočí – **místo gratulačního modalu**; modal (jedno okno z fronty) zůstává jen pro ⭐🔥👑 s XP a pro milníky série | Doporučuji ano – denní modal se opakuje každý den a nic nového neříká (Petr: „kostrbaté a o ničem") |
| **R-14** | Deník: zmrzlá série zamkne psaní **dřív, než uživatel začne psát**, a ohřátí (reklamy / Začít znovu) je přímo v Deníku; dnes appka nechá napsat celý text, při uložení ho zahodí a pošle na Home | Doporučuji ano – zahozený text je nejhorší chvíle deníku; pojistka v ukládání (Debt Gate) zůstává beze změny |
| **R-15** | Historie deníku jako **měsíční kalendář** (stav dne tvarem, stuha série) místo listování po dni (‹ › zůstává v panelu dne) + ve Statistikách nový graf **posledních 30 dní** | Doporučuji ano – jen jiné zobrazení existujících dat, žádná nová logika |
| **R-16** | Cíle: **dva druhy** – „Hochzählen“ (přičítá se: knihy, peníze, hodiny) a „Messen“ (zapisuje se naměřená hodnota od startu k cíli, i směrem dolů: váha 84,6 → 78 kg). Dnes si uživatel u hubnutí musí odečítat sám | ✅ **Schváleno 2026-10-26 (Petr):** **mění data** (počáteční hodnota + druh), potřebuje migraci (stávající cíle = „Hochzählen“, start 0) a úpravu @technical-guides:Goals.md |
| **R-17** | Cíle: **tempo na každé kartě** („v plánu / o 6 dní napřed / o 10 dní pozadu“, kolik je potřeba za týden, kdy to vyjde) místo záložek Trendy + Předpovědi s pěti metodami; jedna funkce v `goalCalculations.ts` | ✅ **Schváleno 2026-10-26 (Petr):** laskavý tón („pozadu“ v teplé, ne červené barvě) |
| **R-18** | Cíle: **zápis jedním ťuknutím** (+1, +50 $, „Jiné“ = panel s vlastní klávesnicí; u „Messen“ dnešní hodnota) + **Zpět** místo potvrzovacího okna; zápis zůstává přes `addProgress` se všemi pravidly XP | ✅ **Schváleno 2026-10-26 (Petr)** – zápis dál přes `addProgress` se všemi pravidly XP |
| **R-19** | Cíle: **termín** předvolbami (1/3/6 měsíců, konec roku, bez termínu) + kalendář přímo v okně místo třístupňového výběru rok → měsíc → den; šablony jako „Začni z nápadu“ v okně místo zvláštního tlačítka a okna | ✅ **Schváleno 2026-10-26 (Petr):** @technical-guides:Goals.md kapitolu „Target Date Step-by-Step Selection Modal“ pak přepsat (pravidlo 3.4) |
| **R-20** | Cíle: **žádný umělý strop hodnot** (dnes cíl ≤ 999 999, zápis ≤ 1 000 000 – kontroluje je jen `GoalForm` a `ProgressEntryForm`, úložiště ani výpočty je nepotřebují) a u „Messen“ **smí být cíl i start 0** (dluh 5 000 000 Kč → 0). Zůstává jen pojistka proti nesmyslu (bilion) | ✅ **Strop hotov v ostré appce 2026-10-31** (`MAX_GOAL_VALUE`; cíl 0 u „Messen“ až s R-16). Schváleno 2026-10-26 (Petr): „důležitá je flexibilita, aby si to lidi z různých zemí mohli nastavit, jak potřebují“. **Vedlejší oprava:** trofeje `mega-dreamer` (cíl ≥ 1 000 000) a `million-achiever` (dokončit takový cíl) jsou s dnešním stropem 999 999 **nedosažitelné** – od 2026-10-31 dosažitelné. **Otevřené:** bonus za „velký cíl“ (cíl ≥ 10 000 → 350 místo 250 XP) pak závisí na měně – 10 000 Kč je malý cíl. Návrh do převodu: počítat „velký“ jinak (např. podle délky cíle ve dnech), rozhodne Petr |
| **R-21** | Sbírky trofejí – **2 chyby v ostré appce:** (a) 4 z 8 sbírek (`habits-master`, `journal-sage`, `epic-hunter`, `time-master`) odkazují na smazané trofeje (`habit-collector`, `completion-machine`, `journal-master`, `perfect-week`, `weekend-warrior`, `early-bird`) a **nejdou dokončit**; (b) „Bonus XP“ se ukazuje a sčítá, ale **žádná služba ho nevyplácí**. Laboratoř navrhuje náhrady v `trophiesMock.ts` | ✅ **Hotovo v ostré appce 2026-10-31 (Petr):** odkazy opravené (`trophyCollections.ts`), bonus se vyplácí jednou (`trophyCollectionService`, vyplaceno = XP transakce) |
| **R-22** | Síň trofejí jako **jedna místnost** místo dvou záložek: počet + rarity, Nedávné, Blíží se, Sbírky (klepnutí otevře sadu – dnes prázdné TODO), Věrnostní cesta, zeď všech 75 s hledáním a filtry; pryč statistické tabulky a Spotlight rotující po 30 s; vstup z Home | ✅ **Schváleno 2026-10-31 (Petr):** „nová síň se mi velice líbí“ |
| **R-23** | Nastavení: náhledy vzhledu místo 3 přepínačů, jazyk jedním řádkem, čas připomínky hned u přepínače, verze dole. Logika beze změny | Doporučuji ano |
| **R-24** | Onboarding: **uvítání jako první krok** bez brány tří otázek. Jazyk a vzhled jsou předvybrané podle zařízení a leží pod tlačítkem jako dva tiché štítky | ✅ **Schváleno 2026-10-31 (Petr):** „líbí se mi, jak jsi to udělal“. Pozor při převodu: `onb_language`/`onb_theme` se pošlou s výchozí hodnotou |
| **R-25** | Onboarding: **dotaz na připomínky až po návyku a cíli**, ne před nimi (dnes se ptáme, když ještě není o čem připomínat) | ✅ **Schváleno 2026-10-31 (Petr):** dotaz až ke konci, kdy je uživatel víc motivovaný. Přesné místo se dořeší s krokem vděčnosti (R-27). Změna pořadí proti systémovému oknu – ověřit se Startup Orchestratorem, `onb_notifications` se přesune |
| **R-26** | Onboarding: **východ slunce** napříč kroky a „Tvůj první den" se třemi políčky místo teček; po dlaždici živý náhled a „Přizpůsobit" místo otevřeného formuláře | ✅ **Schváleno 2026-10-31 (Petr):** „postupný východ je sympatický“ |
| **R-27** | Onboarding podle psychologie (rozbor 2026-10-31): (1) „Přeskočit“ jen daného kroku, ne celého úvodu; (2) ~~„Kdy?“ po dlaždici návyku~~ **odstraněno, Petr 2026-10-31**: výběr nikde nezůstal a ne každý si chce čas určovat; (3) závěr jako vrchol: vlastní návyk, cíl a slova z vděčnosti, trofeje najednou (mění pravidlo 3 v Tutorial.md); (4) krok vděčnosti před odškrtnutím; (5) první políčko hotové po „Let's go“; (6) podnadpis „začni malým“; (7) připomínky úplně nakonec, skutečným obecným textem (skutečné připomínky žádný návyk nejmenují). Vědomě NE: falešný počet uživatelů, odpočty, vina za přeskočení, otázka „proč jsi tady“ (zatím) | ✅ **Schváleno 2026-10-31 (Petr):** „postav to celé v laboratoři“. Hotovo v kolech 31 a 32. Při převodu: mění pravidlo 3 v Tutorial.md a význam `onb_skip`, nová událost pro vděčnost |
| **R-28** | Trofeje: nový katalog, 75 → 51, vzácnost podle času, první den jen běžné trofeje, cíl se do trofejí počítá až po 7 dnech. Katalog a simulace: @achievements-rework-plan.md | ✅ **Schváleno 2026-10-31 (Petr):** vyřazené zmizí úplně i těm, kdo je získali, XP zůstávají. V ostré appce samostatný krok po novém vzhledu, včetně povinného vyčištění uložených trofejí (počet se bere z délky seznamu) |
| **R-29** | Jedna oslava na jednu akci: běžné a vzácné tiše (oznámení vyjede z odznaku úrovně, XP se do něj vrátí), velké okno jen pro epic a legendary a ostatní z té akce v něm („Also unlocked“, jedno XP). Nová úroveň nikdy jako samostatné okno. Žádné časové pauzy mezi okny | ✅ Petr 2026-11-10: „pusť se do R-29“. Postaveno v kole 33, na zařízení neviděno. Milníkové úrovně (R-10) navazují |
| **R-30** | Části dne: návyky po ráno, odpoledne, večer a „Kdykoliv“, volitelné, ne v tutoriálu. Ruční řazení uvnitř části, bonusové návyky zůstávají zvlášť | Petr zvažuje („zajímavější, ale ne každý to ocení“). Vyzkoušet v laboratoři, v ostré appce samostatný krok (nový údaj v databázi). Plná časová osa zůstává v @projectplan-future-updates.md Phase 12 |
| **R-31** | Úroveň na Home: karta Úroveň pryč z výchozího Home, stačí připnutý odznak s kroužkem. **Ťuknutí na odznak vysune panel úrovně** (název úrovně, XP, kolik chybí do další, odkaz na přehled úrovní) | ✅ **Schváleno 2026-11-10 (Petr):** jeho nápad s panelem z odznaku. Postavit v laboratoři; při převodu ošetřit uloženou volbu sekce Úroveň v přizpůsobení Home |
| **R-32** | Nájezd obrazovky jen při **prvním zobrazení záložky** po otevření appky; další přepnutí je okamžité a záložka si drží stav i polohu rolování (mění kolo 4: „settle při každém přepnutí“) | ✅ **Schváleno 2026-11-10 (Petr)** |
| **R-33** | Detaily, sheety a oslavy jdou **zavřít tažením** a v půlce vrátit (dnes jen tlačítkem); Android „zpět“ a křížek zůstávají | ✅ **Schváleno 2026-11-10 (Petr)** |
| **R-34** | **Vlastní podpisové ikony** (plamen, hvězda, koruna, trofej, slunce, spodní lišta) místo emoji a obecné sady; už ne „volitelně“ | ✅ **Schváleno 2026-11-10 (Petr)** |
| **R-35** | Smysly: **zvuk** (víc než jeden volitelný) a **složené hmatové vzory** u oslav, obojí vypínatelné; potřebuje nativní build | ✅ **Schváleno 2026-11-10 (Petr)** – rozsah a knihovnu hmatu ověřit před stavbou |
| **R-36** | Měsíční výzva: detail jako jedna stránka místo tří záložek, obecné tipy nahrazuje věta o tempu („stíháš“ / „chybí ti X za Y dní“). Kalendář ve čtyřech odstínech bez procentní legendy | ✅ **Schváleno 2026-11-11 (Petr: „nechám to na tvé profesionalitě“)** |
| **R-37** | Měsíční výzva: milníky 25/50/75 % jako tiché oznámení z odznaku místo oken, XP zůstává | ✅ Schváleno 2026-11-11 (Petr) |
| **R-38** | Měsíční výzva: splnění a povýšení hvězdy v jednom okně; nesplnění a sesazení v jednom klidném okně „Tvůj měsíc“ s novou výzvou | ✅ Schváleno 2026-11-11 (Petr) |
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
- [x] **Kolo 20 – Můj deník** (`JournalConcept.tsx` + `JournalHistoryConcept.tsx` + `JournalStatsConcept.tsx`,
      díly v `journalParts.tsx`, kulisy `journalMock.tsx`) – všechny prokliky ostré verze:
      - **Hlavní obrazovka** v pořadí podle průvodce (citát dne vždy nad dnešními záznamy): „Dnes" = počet,
        3 díly, plamen série (ťuknutí = náhled zmrzlé série); po 3. záznamu se otevře **bonusová cesta**
        4→13 s ⭐ 🔥 👑; milníkové odznaky celkem; dvě dlaždice (vděčnost / sebechvála), každá ukazuje, kolik
        XP přinese **další** záznam (podle pozice); citát dne ze skutečných citátů appky + „jiný citát";
        dnešní záznamy číslované 1..N s ⋯ = upravit / smazat, prázdný stav = skutečný text appky
      - **Psaní** = sheet nad klávesnicí: přepínač typu, otázka ze skutečných nápověd appky (Fraunces
        kurzíva) + „jiná otázka", 200 znaků, validace a texty jako `GratitudeInput`, chyba = zatřesení;
        XP vyletí z tlačítka Přidat; 3. záznam = splnění dne na místě (R-13); 4./8./13. = okno ⭐🔥👑 s XP
        až po „Pokračovat"; nový záznam stránka dorolí a 2× zazáří; úprava ve stejném sheetu
      - **Smazání** = potvrzení se skutečnými texty; den se přečísluje (čísla se odrolují) a vrací se XP
        **poslední pozice** (průvodce My-Journal; ověřeno dočasným testem i negativní zkouškou: Petrův
        příklad 4 záznamy → smazání 2. → −33 XP)
      - **Zmrzlá série** (náhled): psaní zamčené předem, ohřátí reklamami přímo v Deníku (simulace), led →
        oheň, „Začít znovu" s potvrzením (R-14)
      - **Historie** = měsíční kalendář: ● splněno, ●★ bonusový den, přerušovaný kroužek = začato,
        ❄ = zmrzlý den zachráněný reklamou, stuha spojuje dny série; panel dne s ‹ › a záznamy (upravit /
        smazat); hledání nahradí kalendář a zvýrazní nalezené slovo (R-15)
      - **Statistiky**: série s plamenem a nejlepší sérií, 4 čísla, která se dopočítají, graf 30 dní
        s čarou denního cíle (ťuknutí na sloupec = hodnota), poměr vděčnost / sebechvála, ⭐🔥👑 s významem,
        povzbuzení appky. Barvy grafu ověřené validátorem skillu `dataviz` (pravidlo 13)
      - Home a Deník sdílejí stav (dnešní počet, série, odznaky)
- [x] **Kolo 21 – Deník podle Petrova snímku**: opravena rozbitá čísla u ⭐🔥👑 (příčina v `RollingNumber`,
      opraveno u zdroje); pryč zdvojená tlačítka Historie / Statistiky na konci stránky; **graf 30 dní
      předělán** – nahoře „26 z 30 dní s denním cílem“ + průměr, sloupek na jemné stopě, zaoblený jen
      nahoře, čára cíle přerušovaná s položkou v legendě (ne popisek pod odznakem úrovně), týdenní
      vodítka a data pondělků, měřítko do 8 (vyšší den nese číslo), ťuknutí nebo tažení prstem =
      bublina s datem, počtem a ⭐🔥👑, ostatní sloupky se ztlumí, opětovné ťuknutí bublinu zavře
- [x] **Kolo 22 – Cíle** (`GoalsConcept.tsx`, `GoalDetailConcept.tsx`, `GoalComposerConcept.tsx`, díly
      `goalParts.tsx`, kulisy `goalsMock.tsx`) – Petr: „počítadla a zapisování progresu jsou neohrabané“:
      - **Přehled**: aktivní / v tempu / splněné + **čára termínů** (dnes vlevo, každý cíl tečkou na svém datu,
        „Další: … za N dní“)
      - **Karta cíle**: hodnota (odroluje se), pruh se **zářezy 25/50/75 %** (rozsvítí se, když se zaplatí
        jejich XP – dnes se platí potichu) a **ryskou „kde je dnes plán“**, tempo slovy, počet dní,
        **rychlé zápisy** (+1 kniha, +50/100/250 $, +0,5/1/2 h, „Jiné“), u váhy „Zapsat hodnotu“
      - **Zápis**: ťuknutí = zapsáno, XP vyletí z tlačítka, lišta **Zpět** 4 s (XP se vrátí); milník zaplatí
        ze svého zářezu; 100 % = jedno okno s bonusem 250/350 XP až po „Pokračovat“; po 3 zápisech
        za den se ukládá bez XP s vysvětlením (pravidlo appky)
      - **Panel zápisu**: Přidat / Odečíst / Nastavit na (jako dnes), vlastní číselná klávesnice, rychlé
        částky, náhled „10 → 11 knih · 92 %“, poznámka; u váhy ± 0,1 a dnešní hodnota
      - **Detail**: kruh s %, fakta (dní zbývá, kolik je potřeba / týden, tvoje tempo, kdy to vyjde),
        **graf „Ty a plán“** (tvoje čára, přerušovaný plán, tečkovaný odhad, terč; tažením prstu hodnota),
        milníky s datem dosažení a XP, historie se smazáním (potvrzení), úprava
      - **Nový cíl**: živý náhled, nápady = skutečné šablony appky, druh (R-16), cíl + jednotka (rychlé
        jednotky), kategorie, **termín** (R-19) + „to je asi 0,5 knihy týdně“, popis; validace a texty
        z `GoalForm`
      - Ověřeno dočasným testem kulis (strop 3 XP zápisů / den, milník nikdy podruhé, dokončení a jeho
        zrušení, tempo všech 5 stavů) + negativní zkouškou; 83 klíčů textů v EN i DE vykresleno bez `{…}`
- [x] Petr 2026-10-26 k Cílům: „celkově se mi tvoje nápady líbí“ → **R-16 až R-19 schváleno**
- [ ] Při převodu Cílů (F4): **R-16** = změna dat – nové pole počáteční hodnota + druh cíle, migrace
      (stávající cíle = „Hochzählen“ od 0), testy úložiště; **R-19** + R-16 = přepsat
      @technical-guides:Goals.md (výběr termínu, typy zápisu, tempo) ve stejném commitu (pravidlo 10)
- [ ] **Pořadí v ostré appce (Petr 2026-10-31, doporučení):** 1. nový vzhled bez nové logiky, 2. části dne jako
      vlastní krok, 3. nové trofeje jako vlastní krok. Nic z toho v jednom vydání, aby šlo poznat, co způsobilo chybu
- [ ] **Co v laboratoři ještě chybí (soupis proti obrazovkám a oknům appky, 2026-10-31), v pořadí podle dopadu:**
  - [x] **Onboarding** – kola 30 až 32
  - [x] **Trofeje (R-29)** – pravidlo jedné oslavy, kolo 33 (na zařízení neviděno)
  - [ ] **Části dne (R-30)** – vyzkoušet na obrazovce Návyků
  - [ ] **Měsíční výzva v komplexní verzi** (Petr 2026-11-11, R-36 až R-38 schváleny; podklad:
        @technical-guides:Monthly-Challenges.md; logika a čísla výzev se nemění, jen vzhled a počet oken)
    - [x] **Kolo 36 – Detail výzvy jako jedna stránka** (na zařízení neviděno)
    - [ ] **Kolo 37 – Momenty během měsíce:** milník 25/50/75 jako tiché oznámení z odznaku (ne okno);
          splnění = jedno velké okno i s povýšením hvězdy (dnes dvě okna po sobě)
    - [ ] **Kolo 38 – Přelom měsíce:** nesplněná výzva = jedno klidné okno „Tvůj měsíc“ (co se povedlo, dopad
          na hvězdy včetně sesazení) a hned nová výzva; přepínač scénářů v panelu laboratoře; převodní mapa
    - Při převodu opravit průvodce `Monthly-Challenges.md`: uvádí milníky 50/75/100 XP, kód vyplácí
          50/100/150 XP (a k tomu násobí za vytrvalost); sekce „XP Reward Structure“ popisuje starý výpočet
          (+20 % za splnění, +100 XP za měsíc série) – skutečně se vyplácí základ podle hvězd + podíl za
          sérii měsíců (`completeMonthlyChallenge`). Šablony výzev nesou texty „bonusů“ (víkendový bonus
          apod.), které appka nevyplácí; nikde se neukazují, při převodu je smazat
  - [ ] **Zbylé oslavy** – postup na úroveň (potřebné k R-10), milník série deníku, aktivace násobiče XP
  - [x] **Přehled úrovní** (`levels-overview`) – kolo 35 (na zařízení neviděno)
  - [ ] **Přizpůsobení Home** (tlačítko v laboratoři zatím nic neotevírá)
  - [ ] **Jak SelfRise funguje** (`how-it-works`, v laboratoři vede na ostrou verzi)
  - [ ] **Drobnosti** – bublinky nápovědy, chybové okno, stránka „nenalezeno“
- [ ] **Revize s nadhledem (2026-11-10, Petr: „se vším souhlasím“ kromě pohledu „den 1“)** – jen čtení, nic se
      neměnilo. Zdroje ověřené ten den: průvodce výkonem a přepínači Reanimatedu, changelog 4.3.0, npm
  - **Laboratoř (vzhled a pocit):**
    - [x] **Panel úrovně z odznaku (R-31)** – kolo 34 (na zařízení neviděno). Odkaz „Všechny úrovně“ vede
          zatím na dnešní přehled; jeho nový vzhled je bod „Přehled úrovní“ výše
    - [ ] **Nájezd jen při prvním zobrazení záložky (R-32)** – laboratoř dnes stránku při přepnutí zahodí
          a postaví znovu (`key` v `DesignLabScreen.tsx`); stránky držet živé jako záložky Expo Routeru
    - [ ] **Tažné zavírání (R-33)** – detail deníku, návyku a cíle, sheety, velká oslava
    - [ ] **Vlastní podpisové ikony (R-34)** a **zvuk + hmatové vzory (R-35)**
  - **Na pozadí (před převodem první obrazovky):**
    - [ ] **Jeden nativní build pro všechno najednou:** přepínač `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS`
          (jde zapnout už na 4.2.1; pozor na hlášení #10444 – probliknutí průhlednosti při přechodu obrazovek),
          120 Hz na Androidu, `expo-audio`, knihovna hmatových vzorů
    - [ ] **Přeměřit sondou a rozhodnout o poučení 46.** Laboratoř je nejednotná: na Reanimated stále běží
          `CheckButton`, `ProgressBar`, rozzáření a poskok řádku návyku (Home i Návyky), sloupce týdne, věta
          průvodce a pohyb slunce. Podle výsledku buď sjednotit na nativní ovladač, nebo poučení 46 zrušit
    - [ ] **Měřit s ostrou zátěží:** každá převedená obrazovka s 20+ návyky na slabším Androidu (laboratoř má
          5 vymyšlených návyků, žádné ukládání, XP výpočty ani reklamu)
    - [ ] **Odškrtnutí překreslí jen dotčenou kartu:** dnes celé Home a každá karta v Návycích (čtou společný
          stav dne). Výběr podle návyku, nebo React Compiler (`experiments.reactCompiler`, v SDK 55 dostupný,
          u nás vypnutý) – ověřit, jestli jde zapnout jen pro nové obrazovky
    - [ ] Drobnosti: `RollingNumber` má 11 textů na číslici (Home ~150–200 prvků); týdenní pruh v Návycích
          má 7 kreslicích ploch místo jedné
    - [ ] **Po převodu, ne dřív:** Expo 55 → aktuální (2026-11-10 je venku 58; Reanimated 4.3 až 4.6 podle
          npm podporují i naše RN 0.83)
  - **Zamítnuto (Petr):** pohled „nový účet / den 1“ v laboratoři – první den řeší tutoriál
  - **Bez rozhodnutí, jen zaznamenáno:** trvalý reklamní pruh je strop prémiového dojmu (obchodní věc)
  - [x] **Vymyšlené odměny za milníky úrovní odstraněny z ostré appky (Petr 2026-11-11: „odstraň je“).** Okno
        nové úrovně slibovalo „Custom Color Theme“, „Prestige System“, „Mentor Mode“… – nic neexistovalo. Pryč je
        seznam v okně, funkce `getMilestoneRewards`, pole `rewards` a texty EN/DE/ES; průvodce
        `Gamification-UI.md` má nové pravidlo, hlídá to test `levelMilestonePromises.test.ts` (+ negativní
        zkouška). Skutečné odměny zůstávají: trofeje za úroveň 10, 25, 50 a tajná za 100. Přehled úrovní
        v laboratoři je u milníků jmenuje (kromě tajné)
- [x] **Kolo 36 – Měsíční výzva: detail jako jedna stránka (R-36)** (`ChallengeDetailConcept.tsx`,
      `challengeLogic.ts`, `challengeMock.tsx`). Roste z karty výzvy na Home a vrací se do ní. Shora: která
      výzva to je, kruh s procenty, hvězdy s názvem stupně a „zbývá 10 dní“; **jedna věta o tempu** („Stíháš.
      Ještě 16 za 10 dní.“ / „Trochu pozadu… asi 1 denně a stihneš to.“) místo záložky s obecnými tipy;
      požadavky s vlastními pruhy a milníky 25/50/75 % s XP; kalendář měsíce ve čtyřech odstínech bez
      procent; co splnění vynese (XP podle hvězd, bonus za sérii měsíců, součet) a co bude příští měsíc;
      hvězdy podle kategorií. Čtyři situace (stíhá, pozadu, zahřívací, hotovo) se přepínají dole na stránce
      (ovladač laboratoře). Karta na Home čte stejnou výzvu a texty skutečných šablon appky. Čísla odpovídají
      kódu appky (XP 5 000–25 000, zahřívací 500–2 532, série +5/10/15/25 %, milníky 50/100/150 XP, prahy
      kalendáře 10/51/91 %); tempo je nové pravidlo. Ověřeno trvalým testem (14 testů) + 6 negativních
      zkoušek, `tsc`, celá sada; nezávislá revize proběhne po kole 38 najednou; na zařízení neviděno
- [x] **Kolo 35 – Přehled úrovní jako cesta** (`LevelsOverviewConcept.tsx`, `levelsJourney.ts`; Petr: „když se
      prokliknu, je to staré“). Místo tabulky 100 stejných řádků: nahoře „Level 16 z 100“, název úrovně
      a celá cesta jako pruh šesti barev stupňů vyplněný po místo, kde uživatel stojí, plus příští milník.
      Pod tím šest kapitol (stupně). Kapitola uživatele je zaostřená: úroveň těsně za ním, jeho úroveň se
      zlatým kroužkem odznaku a „237 XP do další“, úrovně před ním ztlumené s potřebným XP. Hotové kapitoly
      jsou jeden řádek, budoucí ukazují svůj milník (zlatá hvězda), ťuknutí otevře kteroukoli celou. Stránka
      vyjede z panelu úrovně (jako Síň trofejí, odznak zůstává) a seznam sám dojede na řádek uživatele.
      Barvy stupňů jsou nové tokeny `labTier` (kontrast spočítán; dvě barvy ztmaveny, číslo sedí na plné
      tmavší barvě, ne na přechodu). Milník jmenuje jen skutečnou trofej z katalogu (10, 25, 50), vymyšlené odměny ne.
      Ověřeno trvalým testem (20 testů) + 9 negativních zkoušek (jedna odhalila test, který nic nehlídal –
      doplněn), `tsc`, celá sada. Nezávislá revize tohoto kola neproběhla; na zařízení neviděno
- [x] **Kolo 34 – Panel úrovně z odznaku (R-31, Petrův nápad)** (`levelPanel.tsx`, `levelPanelLogic.ts`).
      Ťuknutí na připnutý odznak a z kroužku vyroste panel: kroužek se zvětší a stane se jeho hlavičkou
      (odznak se nekopíruje), vedle něj úroveň a její název, pod tím zlatý pruh, celkové XP a kolik chybí do
      další úrovně, dnešní zisk, běžící násobič a odkaz „Všechny úrovně“. Celý přechod řídí jedna hodnota;
      zavírá se ťuknutím vedle, na kroužek, tlačítkem zpět, přepnutím záložky a **tažením** nahoru i dolů –
      panel se pod prstem vrací do odznaku a v půlce ho jde pustit zpět (první okno s R-33). Pravidla:
      z odznaku vyjíždí jen jedna věc (během tichého oznámení je ťuknutí na odznak ťuknutím na oznámení,
      štítek „LEVEL UP“ ustoupí a sám jde ťuknout – tak uživatel zjistí, že odznak reaguje), nad otevřeným
      detailem, sheetem ani oslavou se panel neotevře (`labCover.ts`, jen pro laboratoř) a oslava, která
      přijde, ho zavře. **Home:** karta Úroveň pryč, počet hotových už jen v hrdinovi a kompaktní hlavičce.
      Násobič je v laboratoři kulisa (vždy běží), v appce se řádek ukáže jen při běžícím násobiči. Ověřeno
      trvalým testem pravidel (17 testů) + 6 negativních zkoušek, `tsc`, celá sada testů. Nezávislá revize
      našla a je opraveno: „LEVEL UP“ mohl vyjet přes otevřený panel, okno „⋯“ v Návycích nebylo zapojené do
      pravidla „ne nad oknem“, panel zavřený odjinud během tažení zůstal viset, chvění prstu rušilo zavření.
      **Na zařízení ověřit:** že panel roste ze středu odznaku na iOS i Androidu (pevný počátek + nativně
      řízená změna velikosti), stín na Androidu, a ostrost zvětšeného kroužku. Vědomě ponecháno: po postupu
      na úroveň „za letu“ panel dožene kroužek o necelou vteřinu později; „Dnes“ v panelu počítá všechno XP
      z laboratoře, čip na Home jen návyky (kulisy – v appce jeden zdroj). **Po Petrově zkoušce
      (2026-11-11):** vypadá dobře, kroužek je ostrý; asi vteřinu po otevření byl měkký – pružina dobíhala
      skoro vteřinu a kroužek mezitím seděl o zlomek bodu vedle, teď se usadí za necelou půlvteřinu (znovu
      ověřit na zařízení). „Všechny úrovně“ je tiché tlačítko laboratoře místo holého řádku. Cíl odkazu je
      pořád stará obrazovka → bod „Přehled úrovní“
- [x] **Kolo 33 – Jedna oslava na jednu akci (R-29)** (`celebrationDirector.tsx`, testeři: „vyskakují moc po sobě“).
      Pravidlo `momentFor`: v akci je epic nebo legendary → jedno velké okno pro nejvzácnější, ostatní uvnitř
      („Also unlocked“) a jedno XP za všechny. Jinak tiché oznámení, které vyjede z odznaku úrovně (stejný
      jazyk jako „LEVEL UP“): medaile, název, XP. Vzácná déle, silnější haptika a barva; víc najednou = jedno
      oznámení. Ťuknutí otevře Síň trofejí, XP odletí do odznaku, když oznámení odchází. Momenty z různých
      akcí čekají ve frontě, tiché čekající se slučují, to na obrazovce se nikdy nemění. Tlačítko trofeje
      v panelu laboratoře prochází 5 scénářů se skutečnými trofejemi a vzácností podle R-28 (mimo jiné
      souběh 7. a 30. dne). Ověřeno dočasným testem (14 testů EN/DE) + 5 negativních zkoušek; na zařízení
      neviděno
- [x] **Kolo 32 – „Kdy?“ pryč z onboardingu** (Petr): „Dám si čtení večer, ale dostanu se k tomu odpoledne“,
      štítek by neměl význam, a uživatel by zmateně hledal funkci, která neexistuje. Odstraněn výběr, věta
      plánu i údaj na závěru. Dotaz na připomínky používá skutečný obecný text, protože skutečné připomínky
      žádný návyk nejmenují. Cesta: 9 ťuknutí a pár vlastních slov. Části dne a časová osa jsou v
      @projectplan-future-updates.md Phase 12. Ověřeno
      dočasným průchodem EN/DE + 2 negativní zkoušky; na zařízení neviděno
- [x] **Kolo 31 – Onboarding podle psychologie (R-27)**: pět políček „Tvůj první den“ (Start je hotový po
      „Let's go“, pak návyk, cíl, vděčnost, odškrtnutí; právě získané políčko na další obrazovce doskočí).
      „Přeskočit“ opouští jen daný krok. Po dlaždici návyku jedno ťuknutí „Kdy?“ a věta plánu (v kole 32 odstraněno).
      Nový krok vděčnosti se skutečnými otázkami z Deníku (zápis se objeví v laboratorním Deníku). Trofeje
      během toku nevyskakují, všechny přijdou najednou na závěru spolu s vlastním návykem, cílem a slovy.
      Připomínky jsou úplně poslední (jmenování plánu v kole 32 odstraněno). XP doletí do odznaku až po zavření. Cesta: 10 ťuknutí a
      pár vlastních slov. Ověřeno dočasným průchodem (24 testů, všechny texty EN/DE ve všech závěrech)
      + 11 negativních zkoušek; na zařízení neviděno
- [x] **Kolo 30 – Onboarding** (`OnboardingConcept.tsx`, spouští se z Nastavení → Restart Tutorial). Měřítko
      Petra: noví uživatelé musí mít **chuť to proklikat**. Každé ťuknutí něco udělá: nebe se rozednívá od noci
      z úvodu po první den, slunce se pohne už při výběru dlaždice, „Tvůj první den" se plní vlastním
      návykem, cílem a odškrtnutím. Skutečné texty, předvolby, šablony a pravidla (`goalDraft`,
      `firstCheckCopy`). Odškrtnutí proběhne na skutečném seznamu Návyků (pulzující zaškrtávátko), závěr
      „hotovo" i poctivé „později". Cesta: 10 ťuknutí proti dnešním 12. Ověřeno dočasným testem průchodu
      (38 textů EN/DE, Přeskočit, brána trofejí, závěry) + 4 negativní zkoušky; na zařízení neviděno
- [x] **Kolo 29 – 4 chyby v ostré appce opravené + Nastavení bez karty úrovně** (Petr: sekce s úrovní
      a prokliknutím do trofejí je zbytečná, Síň trofejí zůstává na Home): sbírky jdou dokončit, bonus se
      vyplácí, Mega Dreamer a Million Achiever jsou dosažitelné (`MAX_GOAL_VALUE`), `goalDraft` sdílí stejný
      limit. **Poučení:** stav trofejí je v SQLite, ne v AsyncStorage – první návrh výplaty s vlastním
      příznakem odhalil až test; vyplaceno je teď samotná XP transakce
- [x] **Kolo 28 – Nastavení a Síň trofejí** (`SettingsConcept.tsx`, `TrophyRoomConcept.tsx`, kulisy
      `trophiesMock.ts` nad **skutečným katalogem 75 trofejí**): v laboratoři je tím všech 5 záložek.
      Vzhled a jazyk v Nastavení opravdu přepínají laboratoř; Síň trofejí se otevírá z Home i z Nastavení.
      Ověřeno dočasným testem (ID v katalogu, 228 textů EN/DE bez holých klíčů, vykreslení obou obrazovek,
      tajná trofej nejde najít hledáním – negativní zkouška: bez pojistky test padá). Na zařízení neviděno
- [x] **Kolo 27 – sekání při zápisu pokroku** (Petr: „jakmile doběhly procesy, je to plynulé“): zmáčknutí
      (`PressableScale`, celá laboratoř), odvalování číslic (`RollingNumber`, kromě řízení sluncem na Home),
      pruh cíle, zářezy, lišta Zpět a odskok odznaku přešly na nativní ovladač (P46); `useLabXpAward`
      (P47); sonda `labPerf.tsx` (P48). **Na zařízení ověřeno 2026-11-10 (Petr): „v pohodě“**; Skia let jisker
      zůstal beze změny a nevadí
- [ ] **F2:** statické přepínače Reanimatedu (`USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` aj.) potřebují nový
      nativní build – po kole 27 je jejich přínos menší, ale ověřit při převodu
- [x] **Kolo 26 – „seká se úplně všechno, každý screen“** (Petr): příčina v kole 25 – `RollingNumber` četl
      `position.value` z JS (blokující volání UI vlákna u každé číslice) → nahrazeno `useRef` (P45)
- [x] **Kolo 25 – Cíle znovu: sekání + klávesnice** (Petr): vysoká sekce (seznam cílů) už nemá žádný styl
      navázaný na rolování (i stálý posun se na obří prvek posílal každý snímek); čísla na kartách cílů
      se při otevření záložky neodvalují od nuly (~30 pružin naráz), rolují jen při změně (`RollingNumber`
      `rollIn={false}`, pružina „z 9 na 9“ se přeskakuje); **tlačítko Create** v okně cíle i návyku teď jede
      nad klávesnicí (dřív bylo pod ní) a pole, do kterého se píše, se posune nad lištu
      (`useKeyboardLift` – sdílené se spodním panelem Deníku)
- [x] **Mimo laboratoř – opraveno 2026-10-26 (Petr: „jestli je to rychlovka, oprav“):** varování Firebase v logu – `crashReportingService.ts` volá Crashlytics
      starým „namespaced“ API (`default()`, `setCrashlyticsCollectionEnabled`), RNFB 23 ho označilo za
      zastaralé a v další hlavní verzi zmizí → přepsat ten jeden soubor na modulární API
      (`getCrashlytics(getApp())`, `setCrashlyticsCollectionEnabled(crashlytics, …)`), dnes funguje
- [x] **Kolo 24 – Cíle podle Petrova testu**: „Messen“ přijme cíl i start **0** (dluh → 0), **bez stropu
      999 999 / 1 000 000** (R-20), klávesnice zápisu až 13 číslic, čísla se při psaní seskupují
      („4 500 000“), ± u „Messen“ krokuje podle velikosti cíle (váha 0,1, dluh 1 000); **varování Reanimatedu**
      („transform … may be overwritten by a layout animation“) – zatřesení pole bylo na stejném prvku
      jako animace vjezdu (okno cíle i návyku) → vnořený prvek; **sekání Cílů**: karty bez animace
      rozvržení (jen nově vytvořený cíl vjede), karty si nepřekreslují všechny ostatní (memo + datum jako
      vlastnost, ne z kontextu), zmáčknutí karty se zpožděním 110 ms (začátek rolování nespustí pružinu);
      k tomu oprava z kola 23 (dlouhý seznam se při rolování zmenšoval = drahé překreslování)
- [x] **Kolo 23 – překrytí na Cílech** (Petrův snímek): seznam aktivních cílů odplouval při rolování přes
      sekci Splněné (příčina a oprava v P39); týká se i dlouhých seznamů v Návycích a Deníku – ty teď
      při rolování jen najedou
- [ ] **Chyba v ostré appce (mimo laboratoř), nalezeno v kole 20:** Statistiky deníku → „Aktivní dny"
      ukazují **syrový text `{count, plural, one {# day} other {# days}} with entries`** v EN, DE i ES –
      klíč `journal.stats.daysWithEntries` používá zápis ICU, ale i18next nemá ICU plugin zapnutý
      (ověřeno vykreslením). Oprava = přepsat klíč na `_one`/`_other` ve 3 jazycích (rozhodnutí Petra)
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
- [ ] Vlastní podpisové ikony místo emoji ⭐🔥👑 a obecné sady (R-34, od 2026-11-10 už ne „volitelně“)
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
26. Odznak úrovně je na **každé** obrazovce na stejném místě (kolo 9). Ťuknutí na něj vysune panel úrovně;
    karta Úroveň proto na Home není (R-31).
26b. **Nájezd obrazovky jen při prvním zobrazení záložky** po otevření appky. Co je hezké jednou, je po
    dvacáté za den čekání; záložka si drží stav i polohu rolování (R-32, revize 2026-11-10).

### 10.7 Texty a data
27. Laboratoř bere skutečné texty z překladů, kde existují (trofeje, legenda kalendáře) – ověřit klíče
    v EN i DE (kolo 8, 13).
28. **Nalezený nesoulad v appce:** nápověda „Smart Make-up System" píše „zlatá fajfka" pro nahrazený
    den – po kole 17 je bonus zlatý a nahrazení v barvě návyku → text nápovědy přepsat (kolo 13, 17).
29. **Ověřit vykreslený text, ne jen existenci klíče** – `journal.stats.daysWithEntries` existuje ve všech
    jazycích, a přesto uživatel čte syrový zápis ICU (kolo 20). Test textů má volat `t()` s parametry
    a hledat `{`, `}` a název klíče ve výsledku.

### 10.8 Deník
30. **Sheet s textovým polem se zvedá o skutečný překryv klávesnice se stránkou** (změřit stránku
    a `endCoordinates.screenY`), ne o pevnou výšku – pak funguje na iOS i na Androidu, ať se okno
    zmenšuje, nebo ne. Reklamní pruh za klávesnicí zmizí (stejně jako dnes v `journal.tsx`) (kolo 20).
31. **Zámek dřív než práce** – co uživatel nesmí uložit, nesmí ani začít psát (zmrzlá série). Pojistka
    v ukládání zůstává, zámek je navíc (kolo 20, R-14).
32. **Barvy grafu jsou vlastní stupně, ověřené validátorem** (skill `dataviz`, `validate_palette.js`)
    pro světlý i tmavý povrch: UI zlatá `#F4B63F` má jako výplň na bílé jen 1,8:1 → graf používá
    `#B97F0E` / `#BE8A1A`; sloupce rostou od základny, zaoblené jen nahoře, 2 px mezera mezi díly,
    popisky v barvě textu, legenda u 2+ řad. Měřítko končí na 8 záznamech a vyšší den nese
    svou hodnotu („13“) – jinak jeden rekordní den smáčkne celý měsíc na pahýly (kolo 20–21).
33. **Pořadí obrazovky deníku je Petrovo rozhodnutí** (průvodce 2026-10-04): citát dne vždy nad
    dnešními záznamy, prázdný stav = vysvětlení, co psát – citát ho nenahrazuje (kolo 20).
34. **Rolující číslo nedostává okraje do stylu číslic** – každá číslice je ve výřezu a okraj ji
    vysune ven (⭐🔥👑 ukazovaly jen půlky „9 / 4 / 1“). Opraveno u zdroje: `RollingNumber` okraje
    přesouvá na celé číslo (kolo 21, Petrův snímek).
35. **Jedna cesta na jedno místo** – Historie a Statistiky jsou vpravo nahoře; stejná tlačítka
    znovu na konci stránky jsou šum (kolo 21, Petr).

### 10.9 Cíle
36. **Častá akce = jedno ťuknutí + Zpět**, ne formulář a potvrzovací okno. Formulář jen pro „jiné“
    množství; vratné akce se nepotvrzují, nabízí se jejich vrácení (kolo 22).
37. **Tempo z jednoho místa** – „napřed / v plánu / pozadu“ počítá jedna funkce (přímka start → termín
    proti skutečnosti); karta, detail i přehled ji jen zobrazují. Bez termínu tempo není, jen odhad (kolo 22).
38. **Barva kategorie jako čára grafu** prošla kontrastem ≥ 3:1 na obou površích (validátor skillu), ale
    kategorie mezi sebou nejsou rozlišitelné pro barvoslepé (modrá × fialová) → **jeden cíl = jeden graf**;
    kde je víc cílů vedle sebe (čára termínů), nese identitu ikona a název, ne barva (kolo 22).
39. **Efekt „odplutí“ při rolování patří jedné kartě, ne seznamu.** Sekce s celým seznamem cílů se
    posouvala o 22 % své výšky (~330 bodů) přes sekci Splněné a zmenšovala se (kolo 23, Petrův snímek).
    Opraveno u zdroje: sekce vyšší než 60 % obrazovky jen najede, neodplouvá (`ScrollCard`); karta
    „hero“ zůstává beze změny. Při převodu: dlouhé seznamy nikdy do jedné animované karty.
40. **Animace vjezdu/odjezdu a animovaný `transform` nikdy na jednom prvku** – Reanimated varuje, že
    se přepíšou (zatřesení pole + vjezd v okně cíle i návyku). Vjezd na obal, zatřesení na vnořený prvek
    (kolo 24).
41. **Žádné umělé stropy u čísel uživatele.** Měny a jednotky se liší o řády (Kč, jeny, forinty); strop
    jen jako pojistka proti nesmyslu. Nula je platný cíl (dluh, zůstatek). Každé pravidlo „> 0“ musí mít
    důvod – u „Hochzählen“ má (nejde počítat k nule), u „Messen“ ne (kolo 24, R-20).
42. **Seznam karet: animace rozvržení (`layout`) ne na každý řádek** – zdražuje každou změnu na obrazovce;
    řádky `React.memo` se stabilními funkcemi a **bez čtení sdíleného kontextu uvnitř karty** (kontext
    obejde memo a překreslí všechny karty). Velká karta v rolovacím seznamu: zmáčknutí se zpožděním,
    ať začátek rolování nespouští animaci (kolo 24).
43. **Hlavní tlačítko formuláře jede nad klávesnicí** a pole, do kterého se píše, se posune nad něj
    (změřený překryv klávesnice, ne pevná výška). Lišta „pevně dole“ bez toho zmizí pod klávesnicí –
    stalo se v okně cíle i návyku (kolo 25, Petr).
44. **Seznam mnoha čísel se při otevření obrazovky neodvaluje** – jen při změně. Třicet pružin naráz při
    otevření záložky = zadrhnutí. Na prvek bez pohybu se nenapojuje žádný styl řízený rolováním (kolo 25).
45. 🚨 **Nikdy nečíst `sharedValue.value` z JavaScriptu** (v efektu, v obsluze ťuknutí, při renderu).
    V Reanimated 4 je to **blokující skok na UI vlákno** (`runOnUISync`). Kontrola „už tam je?“ v rolujícím
    čísle to dělala u každé číslice každé obrazovky → **sekala se celá laboratoř** (kolo 26, Petr). Co
    JS potřebuje vědět, si drží v `useRef`; `.value` se z JS jen zapisuje, číst se smí jen ve workletu.
46. 🚨 **Běžné reakce UI = nativní ovladač React Native, ne Reanimated** (zmáčknutí, odvalení čísla, plnění
    pruhu, toast, odskok odznaku). Důvod přímo ve zdroji Reanimated 4.2 (`ReanimatedCommitHook.cpp`): každý
    snímek animovaného stylu je zápis do ShadowTree a **každý zápis z Reactu znovu aplikuje vlastnosti všech
    animovaných prvků a animace pozastaví** (`pauseReanimatedCommits`). Akce, která zároveň mění stav
    a animuje (zápis pokroku), se proto sekala a po doběhnutí byla zase plynulá (kolo 27, Petr). Reanimated
    jen tam, kde je potřeba: sdílený hodinový signál úvodu, řízení z jiné animace, Skia, gesta.
    ⚠️ **Revize 2026-11-10:** laboratoř tohle pravidlo plní jen napůl (`CheckButton`, `ProgressBar`, rozzáření
    řádku návyku aj. jsou stále na Reanimated) a příčinu řeší přepínač `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS`
    (od 4.3 výchozí). **Před převodem první obrazovky zapnout, přeměřit a pravidlo buď dotáhnout, nebo zrušit**
    – nepřenášet do ostré appky smíšený stav.
47. **Spotřebitel kontextu obchází `React.memo`, a kontext s `settledXp` se mění po každé vlně XP** → kdo
    jen utrácí XP, bere `useLabXpAward()` (stálá funkce ve vlastním kontextu). Překreslení se **měří**,
    ne odhaduje: zápis = 1 karta z 5, bez memo všech 5 (dočasný test + negativní zkouška, kolo 27).
48. **Sekání se měří sondou, ne dojmem:** `measureLabPerf('…')` vypíše do logu `[LabPerf]` – nejhorší snímek
    a počet záseků zvlášť pro UI a JS vlákno (kolo 27). Před ostrým převodem sondu odstranit.
51. **Text přes barevné pozadí: kontrast spočítat a překryv vyloučit rozložením.** Slunce by jelo za bílý
    text (1,7:1) → obsah končí nad spodním pásem a slunce vychází jen v něm. Neplatí „ono se to nepotká",
    ale „nemůže se to potkat" (kolo 30).
52. **Onboarding: každé ťuknutí má viditelný výsledek** a postup je vidět na vlastním obsahu uživatele,
    ne na anonymních tečkách. Povinné pole žádné, předvolba je start, ne zámek (kolo 30, Petr).
53. **Přeskočitelný krok = každý další text musí unést, že se nestal.** Výpis textů všech závěrů odhalil
    „odškrtni svůj návyk“ pro člověka bez návyku, připomínku v čase, který si nikdo nevybral, a „Level 0“
    jako odměnu. Běžné testy na tlačítka to nechytí, u toku s více výstupy projít každý konec a číst ho
    (kolo 31).
54. **Laboratorní součty nepatří do pohledu nového uživatele.** Úroveň 16 z kulis by v onboardingu vypadala
    jako hotová věc. Závěr počítá jen to, co se stalo v toku; v ostré appce je to shodou okolností totéž,
    protože nový uživatel nic jiného nemá (kolo 31).
55. **Neptej se na nic, co appka potom nepoužije, a neslibuj, co neumí.** „Kdy?“ znělo jako nejlepší
    doložená technika, ale bez trvalého místa v appce je to prázdné ťuknutí a čekání na funkci, která
    neexistuje. Výzkum neomlouvá chybějící funkci: u každého vstupu a slibu nejdřív ověřit, kde se projeví
    druhý den (kolo 32, Petr).
56. **Hromadění oslav se řeší významem, ne pauzami.** Pauza mezi okny jen roztáhne stejné vyrušování a oslava,
    která přijde pozdě, ztratí účinek. Co patří k jedné akci, je jeden moment, a velikost oslavy určuje
    vzácnost, ne pořadí. Malé věci nesmí blokovat obrazovku (kolo 33).
57. **Jedna hodnota řídí celý přechod a tažení ji jen posouvá.** Ztmavení stránky, růst panelu i zvětšení
    kroužku visí na jediné hodnotě 0–1 a prst ji při tažení přímo nastavuje. Vratnost v půlce (R-33) tak
    není zvláštní režim, ale vlastnost stavby, a nic se nemůže rozejít. Puštění „na cestě zpět“ nezavírá
    (kolo 34, `levelPanel.tsx`).
58. **Co je připnuté na každé obrazovce, se do okna nekopíruje – okno se postaví kolem toho.** Velký kroužek
    v panelu úrovně je odznak sám. XP, které doletí při otevřeném panelu, dál dopadá do něj a nic se
    nezdvojuje (kolo 34).
59. **Z jednoho místa vyjíždí vždy jen jedna věc a okno se neotevírá nad oknem.** Panel, tiché oznámení
    a „LEVEL UP“ sdílejí odznak: ťuknutí během oznámení patří oznámení, štítek ustoupí panelu, nad otevřeným
    detailem zůstává odznak jen ukazatelem. Ťuknutí, které nic neudělá, nezavibruje (kolo 34).
60. **Stejný údaj jen jednou na obrazovce.** Úroveň byla na Home dvakrát (odznak a karta) a počet hotových
    třikrát. Co je vidět pořád, nepotřebuje vlastní kartu; podrobnosti patří na ťuknutí (R-31, kolo 34).
61. **Dlouhý seznam stejných řádků není obrazovka, ale tabulka.** Přehled úrovní odpovídá na dvě otázky –
    kde jsem a co mě čeká. Zaostřit na „teď“ (kapitola uživatele od úrovně za ním), hotové sbalit, z dálky
    ukázat jen milníky a po otevření dojet na řádek uživatele (kolo 35).
62. **Text na barevném přechodu se počítá proti jeho světlejšímu konci.** Bílé číslo prošlo na tmavém konci
    a propadlo na světlém; číslo proto sedí na plné tmavší barvě. Kontrast nových barev spočítat hned,
    ne od oka (kolo 35, `labTier`).
63. **Místo obecných rad jedna věta o tom, co zbývá.** Záložka „Tipy“ radila všem totéž; uživatel chce
    vědět, jestli stíhá a kolik má denně udělat. Tempo se počítá proti rovnoměrnému měsíci, dnešek se
    počítá ve prospěch uživatele a mluví se o požadavku, který je nejvíc pozadu (kolo 36).
64. **Před kreslením odměny dohledat kód, který ji vyplácí – ne průvodce.** Průvodce výzev popisoval dva
    různé výpočty a šablony slibovaly bonusy, které nikdo nevyplácí. Pravda je v jedné funkci
    (`completeMonthlyChallenge`); čísla na obrazovce jsou opsaná odtud a hlídá je test (kolo 36).
49. **Co obrazovka slibuje, musí kód plnit.** Sbírky ukazovaly bonus XP, který nikdo nevyplácí, a čtyři z nich
    čekaly na neexistující trofeje; dvě trofeje blokoval strop formuláře. Při převodu ke každému slibu
    dohledat kód, který ho plní, a odkazy na katalog hlídat testem (kolo 28).
50. **Zeď mnoha položek = `FlatList` bez animace na položku.** Filtry jako prvek v `ListHeaderComponent`
    (ne funkce, jinak hledání ztratí fokus); tajné trofeje skrýt i ve vyhledávání, včetně popisu (kolo 28).

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
