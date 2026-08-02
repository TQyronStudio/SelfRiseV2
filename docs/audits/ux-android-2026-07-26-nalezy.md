# Nálezy z Android device testu — ikona, tutoriál, spodní lišta

Datum: 2026-07-26 | Zařízení: **Xiaomi Redmi 8 Pro** (starší, MIUI) | Build: Android, verze 7.0.0
Zdroj: Petrův device test + 2 screenshoty (plocha, tutoriál krok 3/25)
Stav: **bod 1 (ikona) vyřešen 2026-08-02**, body 2–4 čekají na rozhodnutí

> Poznámka k umístění: soubor je v `docs/audits/`, ne v kořeni repa — v kořeni už je
> ~33 `.md` souborů (otevřený nález N32 ze super auditu).

---

## Souhrn — 3 nezávislé problémy + 1 strategická otázka

| # | Problém | Závažnost | Náročnost opravy |
|---|---|---|---|
| 1 | ~~Ikona appky vypadá nacpaná do dlaždice~~ | střední (první dojem) | ✅ **hotovo 2026-08-02** |
| 2 | Text v tutoriálu je oříznutý, nejde přečíst | **vysoká** | malá (2 řádky kódu) až velká (viz #4) |
| 3 | Spodní lišta se během tutoriálu neztmaví | nízká (kosmetika) | malá, ale nutné ověřit na zařízení |
| 4 | 25krokový tutoriál jako koncept | **vysoká** | velká — návrhové rozhodnutí |

---

## 1. Ikona: není moc velká, je natažená do rohů

> **STAV: VYŘEŠENO 2026-08-02.** Detaily na konci sekce.

### Co se změřilo

Zdroj `assets/images/adaptive-icon.png`:

```
plátno:        1024 × 1024
obsah („S“):    590 px šířky = 58 %
                787 px výšky = 77 %   ← přesahuje
```

**Doměřeno 2026-08-02 — problém je horší, než ukazovala výška.** Maska je
kruhová, takže nerozhoduje výška ani šířka, ale **vzdálenost nejvzdálenějšího
pixelu od středu**:

```
nejvzdálenější bod obsahu:  471 px od středu → průměr 942 px = 92 % plátna
zaručeně viditelný kruh:                       průměr 683 px = 67 % plátna
```

Původní číslo 77 % problém **podceňovalo** — počítalo jen svislý rozměr, ne
diagonální dosah krystalových výběžků.

### Proč to vypadá špatně

Android u adaptivních ikon **ořezává okraje**. Zaručeně viditelný je jen **vnitřní
kruh o průměru ~67 %** plochy (bezpečná zóna 72 dp ze 108 dp); zbytek si každý
launcher ukusuje podle svého tvaru a Xiaomi/MIUI má vlastní masku navíc.

„S“ má 77 % výšky → launcher ukousne špičky nahoře i dole a zbytek vyplní dlaždici
až do krajů. Ostatní appky mají kolem loga volné místo, tahle ne — proto působí
„moc velká“.

### Co s tím

Původně jsem to psal jako práci pro grafika („překreslit“). **Není.** Kresba se
nemění — jen se zmenší a vycentruje, což je čistě mechanická operace. Grafik by
byl potřeba, jen kdyby se měl měnit samotný tvar loga.

### Co se NEPOTVRDILO

Druhá ikona na ploše (`SelfRiseV2`, šedé kroužky) je **jiný build** (dev client) —
Petr potvrdil, že ji řešit nemáme. Není to chyba produkční ikony.

---

### ✅ Provedeno 2026-08-02

Všechno vygenerováno skriptem z existující kresby — **žádný nový grafický
podklad, žádná změna kódu aplikace**. Mění se jen obrázky a `app.json`.

| Soubor | Co je | Stav |
|---|---|---|
| `assets/images/adaptive-icon.png` | androidí popředí, zmenšeno na 0,721× | **upraven** |
| `assets/images/adaptive-icon-monochrome.png` | bílá silueta pro motivy Androidu 13+ | nový |
| `assets/images/icon-dark.png` | iOS 18 tmavá varianta („S“ na průhledné) | nový |
| `assets/images/icon-tinted.png` | iOS 18 obarvitelná varianta (neprůhledné odstíny šedi) | nový |
| `assets/images/icon.png` | iOS světlá varianta | **nedotčen** (MD5 ověřeno) |
| `assets/images/splash-icon.png` | úvodní obrazovka | **nedotčen** (MD5 ověřeno) |

**Android — zmenšení popředí**

```
obsah 587×785 → 423×566 px  (měřítko 0,721)
dosah od středu: 473 px → 339 px   (limit 341 px)  → vejde se do každé masky
```

Měřítko není odhad — spočítalo se jako `bezpečný_poloměr / skutečný_dosah_obsahu`,
takže logo sedí přesně na hraně bezpečné zóny, ne zbytečně malé.

**Monochrome vrstva** — vygenerována z alfa kanálu ikony, ve stejném měřítku
0,721 (obě vrstvy musí být stejně velké, jinak logo při zapnutí motivů „skočí“).
Po zmenšení zůstalo z krystalových jiskřiček **851 drobných smítek**; v barevné
kresbě neviditelné, v jednobarevné siluetě by vypadaly jako špína. Odstraněny —
ponechán jen největší souvislý tvar (140 713 px, zahozeno 1 549 px).

**iOS 18 varianty** — `ios.icon` přijímá objekt `{ light, dark, tinted }`.

```json
"ios": {
  "icon": {
    "light":  "./assets/images/icon.png",
    "dark":   "./assets/images/icon-dark.png",
    "tinted": "./assets/images/icon-tinted.png"
  }
}
```

> **⚠️ Dvě pasti v Expu, na které se snadno naletí** (`node_modules/@expo/prebuild-config/build/plugins/icons/withIosIcons.js`)
>
> 1. **`:198` — `removeTransparency: appearance !== 'dark'` + `backgroundColor: '#ffffff'`.**
>    Varianta `tinted` se **zploští na bílé pozadí**. Kdyby se dodala jako šedý
>    „S“ na průhledném (jak radí Apple), Expo z toho udělá bílou dlaždici a
>    ikona zmizí. Proto je `icon-tinted.png` **neprůhledný** RGB.
> 2. **`:93` — když je `ios.icon` objekt, `light` se musí uvést explicitně.**
>    Jinak se jako základní ikona vezme `dark` nebo `tinted`.

**Rozdíl Android vs. iOS** — Android používá jen **alfa kanál** (barva se
zahodí → plochá silueta). iOS mapuje **jas** na uživatelovu barvu → krystalové
plošky zůstanou zachované. Proto jsou to dva různé soubory, ne jeden sdílený.

Pro `icon-tinted.png` se jas zvedl o 35 (`0–255 → 35–255`), aby tmavé pozadí
nespadlo do ploché černé — to Apple v HIG nedoporučuje.

**Ověřeno** (ne odhadnuto):

| Kontrola | Jak | Výsledek |
|---|---|---|
| Expo čte všechny 4 cesty | `npx expo config --json` | ✅ bez varování |
| Android XML má monochrome | `createAdaptiveIconXmlString()` | ✅ `<monochrome …/>` |
| Popředí se vejde do masky | přeměřen výsledný soubor | ✅ 339 ≤ 341 px |
| `icon.png` a `splash-icon.png` beze změny | MD5 před/po | ✅ shodné |

---

### ✅ Nález navíc: zpackaný ořez pozadí (opraveno 2026-08-02)

Petr si při prohlížení ikon bez pozadí všiml „výmrdku“ ve spodní části „S“.
Nebyl sám — po prověření jich bylo **pět**.

**Příčina:** kresba vznikla odmazáním pozadí z hotového obrázku a ten ořez byl
udělaný špatně. Zůstaly po něm kusy pozadí přisazené ke kresbě — blokovité,
tmavě teal. V `icon.png` je nevidět, protože tam je pozadí zapečené; **vylezou
ve chvíli, kdy je pozadí průhledné**, tedy ve všech ikonách, které jsem
generoval.

**Proč na to nestačí prahování průhlednosti:** zbytky nejsou jen slabě
průsvitné. Měřením se ukázalo, že **až polovina jejich plochy je plně
neprůhledná** — pro počítač k nerozeznání od skutečné kresby.

**Jak se to tedy odlišilo — dvě nezávislé metody:**

1. **Srovnání s `icon.png`** (stejný motiv, ale s pozadím, takže bez vady).
   Řádek po řádku se obě siluety shodují na **0–2 px**; v místě vady kresba
   **přečnívá o 31 px**. Tam, kde se to potvrdilo, se řez vedl podle předlohy.
2. **Blokovitost.** Poslední zbytek (klín mezi dvěma krystaly) šlo takhle
   odříznout jen zčásti, protože oba obrázky jsou **různé rendery** posunuté
   proti sobě o 9–14 px — předloha tedy není důkaz, co v kresbě má být. Rozhodl
   jiný znak: **horní a pravý okraj klínu jsou přesně vodorovná a svislá čára
   po blocích 8 px.** Kreslená grafika má hrany šikmé, nikdy zarovnané na mřížku.
   Vybráno rozlitím z vnitřku klínu; výsledek vyšel **stejný ze tří různých
   semínek i tří prahů** (1279–1338 px), takže to není naladěné na míru.

| Vada | Umístění | Smazáno | Z toho plně neprůhledných |
|---|---|---|---|
| 1 — nahlášená | (565,675)–(599,729) | 1495 px | 774 |
| 2 — pruh u hrotu | (231,565)–(255,690) | 1271 px | 614 |
| 3 — klín mezi krystaly | (324,608)–(370,676) | 1307 px | vše |
| 4 — závoj | (482,586)–(545,615) | 414 px | 106 |
| lem + odtržené kusy | po celém obvodu | 5583 px | — |

**Zásady, které oprava dodržela:**

- pixely se jen **odebírají, nikdy nepřidávají** → skutečnou kresbu nelze poškodit
- zásah jen uvnitř **pěti změřených oblastí**, ne plošně
- řez **rozostřen o 0,8 px** jen v opravených místech, aby nebyl schodovitý
- vše přegenerováno **z opraveného originálu** → oprava je ve všech třech
  průhledných ikonách (android, monochrome, iOS dark)

> **Poučení pro příště:** pokud se bude kresba někdy překreslovat, zadání zní
> **„dodej ji rovnou na průhledném pozadí“**, ne „ořízni ji z hotového obrázku“.
> Tahle vada vznikla přesně tím druhým postupem a byla v repu od začátku —
> neviditelná, dokud se nezačaly dělat ikony bez pozadí.

**Dopad byl širší, než se zdálo.** Vada byla i ve dvou assetech, které s ikonou
appky nesouvisí:

| Soubor | Nález | Oprava |
|---|---|---|
| `splash-icon.png` | **bajt po bajtu** ta samá vadná kresba (shodné MD5) | nahrazen opravenou předlohou, velikost beze změny (úvodní obrazovka masku nemá) |
| `notification-icon.png` | 96×96 bílá silueta z téže kresby → stejné hrbolky, navíc tvrdý zubatý řez | přegenerována z opravené předlohy, měkký okraj (813 px přechodu místo ostrého) |

Obojí je nakonfigurované v `app.json` (`expo-splash-screen` a `expo-notifications`),
takže by to bylo vidět v aplikaci, ne jen na ploše.

**Úklid assetů:** smazána 4 nepoužívaná loga z výchozí Expo šablony —
`react-logo.png`, `react-logo@2x.png`, `react-logo@3x.png`,
`partial-react-logo.png`. Ověřeno grepem napříč celým repem: **nula odkazů**.
`favicon.png` zůstává, je to vlastní „S“ a je zapojený pro web.

**Kontrola po úklidu:** `npx expo config --json` → všech 8 obrázkových cest
v konfiguraci existuje, žádné varování.

---

**Zbývá:** ověřit na zařízení po dalším buildu. Vše je vratné jedním
`git checkout assets/images/ app.json`.

---

## 2. Tutoriál: text se nevejde, protože karta má strop 30 % obrazovky

### Dvě chyby, které se sčítají

**a) Karta nesmí být vyšší než 30 % obrazovky**
`src/components/tutorial/TutorialOverlay.tsx:409`
```js
contentCard: {
  padding: getCardPadding(),
  maxHeight: safeHeight * 0.3,     // ← tvrdý strop
}
```

**b) Výška se počítá s předpokladem 2 řádků textu**
`src/components/tutorial/TutorialOverlay.tsx:138`
```js
const contentHeight = scaleFont(Fonts.sizes.md) * 1.5 * 2; // Assume 2 lines max
```

### Realita: 17 z 18 kroků má textu víc

Změřeno na EN textech (`src/locales/en/index.ts` → `tutorial.steps.*`),
odhad ~34 znaků na řádek:

| krok | znaků | ≈ řádků |
|---|---|---|
| welcome | 244 | **8** |
| goalsIntro | 191 | 6 |
| habitDays | 186 | 6 |
| habitComplete | 184 | 6 |
| habitName | 180 | 6 |
| gratitudeEntry | 180 | 6 |
| habitIcon | 157 | 5 |
| goalDate | 155 | 5 |
| habitColor | 144 | 5 |
| goalCategory | 129 | 4 |
| appOverview | 120 | 4 |
| goalUnit | 120 | 4 |
| quickActions | 112 | 4 |
| trophyRoom | 103 | 4 |
| goalComplete | 97 | 3 |
| habitCreate | 94 | 3 |
| goalCreate | 88 | 3 |
| createGoalButton | 53 | 2 ✅ |

**17 z 18 kroků přeteče.** Do karty se vejde titulek, pruh postupu a tlačítko —
na text zbyde proužek o výšce jednoho řádku, oříznutý nahoře i dole.

### Scrollovat jde, ale nikdo to nepozná

`TutorialOverlay.tsx:682` — text **je** v `ScrollView` s `persistentScrollbar`,
takže scrollbar se zobrazuje. Je to ale tenká čárka u kraje proužku; uživatele
nenapadne, že tam je další text. Petrův postřeh sedí.

### Co s tím — tři úrovně

| | Co udělat | Náročnost | Výsledek |
|---|---|---|---|
| **A. Rychlá záplata** | zvednout strop z `0.3` na ~`0.6`, opravit `Assume 2 lines max` na skutečnou výšku obsahu | ~půl dne | text půjde přečíst, ale zůstane 25 kroků |
| **B. Poctivě** | A + zkrátit texty na 1–2 věty | +1 den | čitelné a stravitelné |
| **C. Doopravdy** | viz bod 4 — přepracovat koncept | větší úkol | jediné, co lidi opravdu přečtou |

⚠️ Samotná varianta A **nesmí** stačit jako „hotovo“ — viz bod 4.

---

## 3. Spodní lišta se během tutoriálu neztmaví

### Co se děje

Ztmavovací vrstva má `zIndex: 9999` a pokrývá celou obrazovku
(`TutorialOverlay.tsx:355-369`, `position: absolute` + `top/bottom: 0`).
`TutorialOverlay` navíc obaluje celý `Stack` (`app/_layout.tsx:80-93`), takže by
lištu pokrýt měla.

### Nejpravděpodobnější příčina

Spodní lišta pochází z React Navigation, která jí na Androidu dává **`elevation`**.
Na Androidu **`elevation` přebíjí `zIndex`** — view s vyšší elevací se vykreslí nad
sourozencem, i když má sourozenec vyšší zIndex. Lišta proto zůstane světlá a vznikne
viditelný šev.

`app/(tabs)/_layout.tsx:61-65` nastavuje `tabBarStyle`, ale **`elevation: 0`
tam není**, takže platí výchozí elevace React Navigation.

```js
tabBarStyle: {
  backgroundColor: colors.tabBarBackground,
  borderTopColor: 'transparent',
  borderTopWidth: 0,
  // elevation: 0  ← chybí
}
```

### ⚠️ Neověřeno na zařízení

Tohle je **hypotéza z kódu**, ne prokázaný fakt. Sedí na příznaky ze screenshotu
(obsah ztmavený, lišta ne, mezi tím ostrý šev), ale potvrdit ji může jen zkouška
na Androidu. Alternativní vysvětlení: rozdíl mezi výškou Skia plátna
(`SpotlightEffect.tsx` kreslí tmavý `Rect` s `Dimensions.get('window').height`)
a skutečnou výškou overlay vrstvy při edge-to-edge režimu.

### Co s tím

1. Zkusit `elevation: 0` na `tabBarStyle` (nejlevnější test hypotézy), nebo
2. vykreslovat overlay přes `Modal`, který je nad vším.

---

## 4. Strategická otázka: přepracovat tutoriál?

### Doporučení: ano — ale ne kvůli oříznutému textu

Oříznutý text je chyba na půl dne. **Jádro problému je, že tutoriál má 25 kroků.**
I kdyby se vykresloval dokonale, po člověku, který appku vidí poprvé, chceš
přečtení 25 obrazovek textu. To je manuál, ne uvítání.

### Jak to dělají největší firmy

Onboarding se za posledních ~10 let otočil. Tenhle typ prohlídky se jmenuje
**„coach mark tour“** a dnes platí za odstrašující případ — lidé ji proklikají bez
čtení a nezapamatují si nic. Co se dělá místo toho:

**① Nechat uživatele něco UDĚLAT, ne číst.**
Duolingo tě do 30 sekund nechá odpovědět na první otázku. Nevysvětluje, co je lekce.

**② Provést ho jednou jedinou akcí.**
Místo „tohle je tlačítko Přidat návyk“ → *„Pojďme si založit první návyk“* a projít
to s ním naživo. Naučí se to tím, že to udělá.

**③ Prázdné obrazovky učí samy.**
Místo prázdné obrazovky Cílů → *„Zatím tu nic není. Založ si první cíl →“*.
Nulové úsilí, žádný modal.

**④ Nápověda až u té funkce.**
Deník vysvětlit, až tam uživatel poprvé přijde — ne v kroku 14 z 25, kdy ještě neví,
o čem je řeč.

**⑤ Všechno přeskočitelné a kdykoliv dohledatelné.**

### Dobrá zpráva: polovinu už máme hotovou

V projektu existují **nápovědní bublinky** — `HelpTooltip` s 10 tématy
(`helpKey`: `habits.scheduling`, `habits.bonusConversion`, `habits.makeupFunction`,
`journal.selfRiseStreak`, `journal.debtRecovery`, `goals.overview`,
`goals.predictions`, `home.recommendations`, `home.xpSystem`,
`challenges.starDifficulty`). To je přesně nástroj z bodu ④ — jen dnes dělá
doplňkovou práci, zatímco hlavní tíhu nese 25krokový průvodce.

### Návrh cílového stavu

| | dnes | návrh |
|---|---|---|
| Kroků na úvod | **25** | **3–5** |
| Obsah úvodu | celý manuál | vítej → založ 1 návyk → hotovo |
| Zbytek (20 kroků) | v tutoriálu | bublinky u funkcí + prázdné obrazovky |
| Délka textu na krok | až 244 znaků | 1–2 věty |

Zbylých 20 kroků se **nemaže — stěhuje**. Práce na tom je, ale je to jediná
varianta, po které si to lidi opravdu přečtou.

### Hrubý návrh, co nechat na úvod

Ke schválení, není to hotové rozhodnutí:

1. **Vítej** — 1 věta, co appka dělá.
2. **Založ si první návyk** — vedená akce naživo (ne popis).
3. **Odškrtni ho** — okamžitý pocit úspěchu + první XP.
4. *(volitelně)* **Deník** — jedna věta + odkaz „ukázat později“.
5. **Hotovo** — „zbytek ti ukážu, až na to přijdeš.“

Vše ostatní (barvy a ikony návyku, dny v týdnu, kategorie cíle, jednotky, datum,
trofeje, dohánění dne) → bublinky u příslušných polí + prázdné obrazovky.

---

## Rozhodovací tabulka — projít bod po bodu

| # | Bod | Varianty | Moje doporučení |
|---|---|---|---|
| 1 | ~~Ikona — zmenšit `adaptive-icon.png`~~ | — | ✅ **hotovo** (0,721×, ověřeno) |
| 1b | ~~`monochrome` ikona pro Android 13+~~ | — | ✅ **hotovo** |
| 1c | ~~iOS 18 varianty `dark` + `tinted`~~ | — | ✅ **hotovo** (nález přibyl 2026-08-02) |
| 2 | Strop karty 30 % + „Assume 2 lines max“ | A / B / C | **A hned** (aby build nebyl rozbitý), pak C |
| 3 | Spodní lišta — `elevation: 0` | zkusit / odložit | zkusit, je to jeden řádek + device test |
| 4 | Přepracovat tutoriál z 25 na 3–5 kroků | ano / ne / později | **ano**, ale jako samostatný úkol s vlastním plánem |

---

## Co je ověřené a co ne

| Tvrzení | Jak ověřeno |
|---|---|
| Ikona přesahovala bezpečnou zónu (92 % vs 67 %) | ✅ změřeno skriptem; **opraveno**, přeměřeno na 66 % |
| Nové ikony načte Expo správně | ✅ `npx expo config --json`, bez varování |
| Nové ikony vypadají dobře na zařízení | ⚠️ **neověřeno — čeká na build** |
| `maxHeight: safeHeight * 0.3` | ✅ přečteno v kódu, `TutorialOverlay.tsx:409` |
| „Assume 2 lines max“ | ✅ přečteno v kódu, `TutorialOverlay.tsx:138` |
| 17 z 18 kroků přeteče | ✅ změřeno na EN textech |
| Text JE ve ScrollView | ✅ `TutorialOverlay.tsx:682` |
| Lišta kvůli `elevation` | ⚠️ **hypotéza z kódu, nutné ověřit na Androidu** |
| 25 kroků | ✅ `grep -c "id: '"` v `TutorialContext.tsx` |
