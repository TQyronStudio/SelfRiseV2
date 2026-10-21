# 📐 SelfRise V2 — Large Screens (tablety, otočení) Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **Proč appka musí fungovat na šířku**, i když má `orientation: portrait` (Android 16)
- **3 stavební kameny**: živá velikost okna, sloupec obsahu, strop šířky modalů (`src/utils/layout.ts`)
- **Hlídač v testech**, který nepustí zpět „zamrzlou" velikost obrazovky
- **Jak to otestovat na emulátoru tabletu** včetně otočení za běhu

**🔧 KDY TOHLE POUŽÍVAT:**
- Píšeš **novou obrazovku, modal, graf nebo mřížku**
- Počítáš cokoliv ze **šířky/výšky obrazovky**
- Play Console hlásí cokoliv o **velkých obrazovkách / omezení orientace**
- Uživatel tabletu nebo skládacího telefonu hlásí uříznutý nebo roztažený obsah

---

## Proč tenhle systém existuje

Play Console u produkčního vydání 10 (7.0.0) upozornil: **Android 16 ignoruje zámek orientace
na obrazovkách ≥ 600 dp** (tablety, rozložené skládačky) u appek s `targetSdk 36`. Android 17
zruší i dočasnou výjimku. Na tabletu se tedy appka otáčí, ať chceme, nebo ne.

Diagnostika na emulátoru Pixel Tablet (Android 16, 2026-10-18, @google-play-compliance-plan.md
část C-1) ukázala:
- **Rozbité po otočení za běhu**: graf deníku na Domů vykreslil posledních ~14 dní mimo obrazovku,
  mřížka trofejí uřízla pravý sloupec. Příčina: velikost obrazovky přečtená **jednou při startu**
  (`Dimensions.get('window')` na úrovni modulu). Activity se při otočení nevytváří znovu
  (`configChanges` obsahuje `orientation|screenSize`), takže hodnota zůstala stará.
- **Roztažené**: Domů, Návyky, formuláře, oslavné modaly přes celou šířku 1280 dp.

Od 7.0.2 proto: velikost okna se čte živě, obsah sedí ve sloupci uprostřed a modaly mají strop.
**Telefony vypadají přesně jako dřív** — všechny limity jsou nad šířkou každého telefonu.

---

## 🚨 4 KRITICKÁ PRAVIDLA

### Pravidlo 1: Velikost okna jen přes `useWindowDimensions()` uvnitř komponenty

```tsx
// ✅ CORRECT
export function MyModal() {
  const { width: screenWidth } = useWindowDimensions();
  // ... styly z screenWidth
}

// ❌ WRONG: hodnota zamrzne při startu appky
const { width: screenWidth } = Dimensions.get('window');
export function MyModal() { ... }

// ❌ WRONG: i v renderu — po otočení se komponenta sama nepřekreslí
const columns = Math.floor(Dimensions.get('window').width / 158);
```

**Proč**: `Dimensions.get()` je snímek. Na úrovni modulu se nikdy neaktualizuje, v renderu
nespustí nové vykreslení. `useWindowDimensions()` komponentu po otočení / změně okna překreslí.
Hlídá to test `no module-level window size` v `__tests__/utils/layout.test.ts` (jediná výjimka:
`src/utils/responsive.ts`, viz Nebezpečné zóny).

### Pravidlo 2: Obsah obrazovky ve sloupci `contentColumn`

```tsx
// ✅ CORRECT — na contentContainerStyle, okraje zůstanou posouvatelné
import { contentColumn } from '@/src/utils/layout';
content: { ...contentColumn, paddingBottom: 80 },
<ScrollView contentContainerStyle={styles.content}>

// ❌ WRONG — obsah přes celou šířku tabletu (karty 1200 dp široké)
content: { paddingBottom: 80 },
```

**Proč**: `contentColumn` = `{ width: '100%', maxWidth: 640, alignSelf: 'center' }`. Na telefonu
nic nedělá (každý telefon je užší než 640 dp), na tabletu drží čitelnou šířku. Banner reklamy,
hlavičky a tab bar zůstávají přes celou šířku — to je správně.

### Pravidlo 3: Modal má strop `getModalWidth()`

```tsx
// ✅ CORRECT
maxWidth: getModalWidth(screenWidth, 0.85),   // = min(85 % okna, 560)

// ❌ WRONG — na tabletu na šířku 1088 dp široká karta
maxWidth: screenWidth * 0.85,
```

**Proč**: na telefonu vyjde přesně `screenWidth * 0.85` (test to ověřuje pro šířky 320–440 dp),
na tabletu max. 560 dp. Modaly, které už mají vlastní strop (`Math.min(screenWidth - 48, 360)`),
jen čtou živou šířku.

### Pravidlo 4: Výpočet ze šířky počítá se sloupcem, ne s celou obrazovkou

```tsx
// ✅ CORRECT — prvek uvnitř sloupce
const columns = getColumnCount(windowWidth, 32, 158);        // trofeje
const { availableWidth, dayWidth } = getGraphMetrics(width); // graf na Domů
minWidth: getContentWidth(screenWidth) * 0.8,                // karta výzvy

// ❌ WRONG — počítá s 1280 dp, ale sloupec má 640 → přetečení
const columns = Math.floor((windowWidth - 32) / 158);
```

**Proč**: obsah je od 7.0.2 ve sloupci max. 640 dp. Kdo počítá z celé šířky okna, vykreslí
na tabletu víc, než se do sloupce vejde. `getContentWidth(w)` = `min(w, 640)`.

---

## Jak je to zapojené

| Soubor | Co dělá |
|---|---|
| `src/utils/layout.ts` | `CONTENT_MAX_WIDTH` (640), `MODAL_MAX_WIDTH` (560), `contentColumn`, `getContentWidth`, `getModalWidth`, `getColumnCount` |
| `src/components/home/streakHistoryGraphLayout.ts` | rozměry grafu na Domů (`getGraphMetrics`) — samostatně kvůli testu |
| `__tests__/utils/layout.test.ts` | telefony beze změny, tablety ve stropech, hlídač `Dimensions.get` |

**Sloupec `contentColumn` mají**: Domů, Deník, Nastavení (`app/(tabs)/*.tsx`), Návyky
(tlačítka v `HabitsScreen` + seznam v `HabitListWithCompletion`), Cíle (tlačítka v `GoalsScreen`
+ seznam v `GoalListWithDragAndDrop`), Síň trofejí (`app/achievements.tsx`), Historie a Statistiky
deníku, Statistiky návyku a cíle, Přehled úrovní. A celoobrazovková okna (`pageSheet`): formulář
návyku (`HabitForm`) a cíle (`GoalForm`), šablony cílů (`GoalTemplatesModal`), zápis pokroku
(`ProgressEntryForm`), úprava zápisu deníku, úprava Domů, warm-up série, detail trofeje a výzvy.
**Nové celoobrazovkové okno = `contentColumn` na jeho obsah** (hlavička zůstává přes celou šířku).

**Vlastní sloupec už měly dřív** (nesahat): onboarding (`ONB_MAX_CONTENT_WIDTH` = 560
v `OnbScreenContainer.tsx`) a Jak to funguje (`HowItWorksScreen.tsx`, 640).

**Živá šířka + strop**: `BaseModal` (výchozí `maxWidth`), oslavné a warm-up modaly deníku,
modaly výzev, cílů, trofejí, XP notifikace (max. 560), `HelpTooltip` (pozice z živé velikosti),
výběr cílového data (`TargetDateStepSelectionModal` — po otočení přepočítá šířku aktuálního kroku).

---

## ⚠️ NEBEZPEČNÉ ZÓNY

1. **`FlatList` s `numColumns` z šířky** — FlatList neumí změnit `numColumns` za běhu (spadne
   červenou obrazovkou). Dej mu `key={numColumns}` (viz `AchievementGrid.tsx`).
2. **Hook až za `return null`** — `useWindowDimensions()` musí být před každým předčasným
   `return` (pravidla hooků). Pozor u modalů s `if (!visible) return null`.
3. **Styly v `createStyles(colors)` mimo komponentu** — šířku jim předej parametrem
   (`createStyles(colors, screenWidth)`), modul ji znát nesmí.
4. **`src/utils/responsive.ts`** čte velikost jednou při startu (`scaleFont`, `isTablet`,
   `getResponsiveValue`). Je to **vědomá výjimka**: na tabletu dává v obou orientacích stejné
   hodnoty (`isTablet` z kratší strany, písmo na stropu 1,3×), na telefonu se orientace nemění.
   Neplatí to u skládačky (složení/rozložení mění šířku mezi telefonem a tabletem) – písmo zůstane
   podle stavu při startu; nic se nerozbije, jen velikost písma nesedí.
   Nepoužívej ho pro šířky obsahu — na to je `layout.ts`. ⚠️ `isTablet()` vrací `true` i na
   většině Android telefonů (bere fyzické pixely), proto se na něj nesmí věšet tabletový vzhled.
5. **Komentář s `Dimensions.get(`** v kódu — hlídač hledá text, i v komentáři ho chytí.
   Piš „Dimensions snapshot".
6. **Nový prvek přes celou šířku** (graf, carousel) — počítej z `getContentWidth`, ne z okna.

---

## Testování

```bash
PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npx jest __tests__/utils/layout.test.ts
```

Test ověřuje: telefony 320–440 dp mají **stejné** hodnoty jako před 7.0.2 (modaly, sloupce trofejí,
graf), tablety 600–1366 dp drží stropy a graf se vejde do karty, a že nikde mimo `responsive.ts`
není `Dimensions.get(`. Ověřeno rozbitím (2026-10-19): strop modalu pod šířku telefonu → 12 pádů,
graf bez sloupce → 8 pádů, `Dimensions.get` vrácené do `BaseModal` → hlídač spadl.

**Emulátor tabletu** (AVD `Pixel_Tablet_API_36`, Android 16, 2560×1600 @ 320 dpi = 1280×800 dp):

```bash
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1   # na šířku (0 = na výšku)
adb exec-out screencap -p > tablet.png
```

⚠️ Emulátor si auto-rotaci občas zapne zpět — `accelerometer_rotation 0` nastav před každou změnou.

---

## Co se NESMÍ rozbít

- **Vzhled na telefonu** — každý limit musí být nad šířkou telefonu (hlídá test)
- **Přetahování návyků a cílů** v režimu řazení (seznam je ve sloupci)
- **Banner reklamy** dole přes celou šířku
- **Onboarding** — má vlastní sloupec 560 dp

---

## Device scénáře

| Zařízení | Co zkontrolovat |
|---|---|
| Telefon (na výšku) | Domů, Návyky, Deník, Cíle, Nastavení, Trofeje, oslava — beze změny proti 7.0.1 |
| Tablet na výšku (800 dp) | obsah ve sloupci 640 dp uprostřed, modaly ≤ 560 dp |
| Tablet na šířku (1280 dp) | totéž; graf na Domů celý (30 sloupců), trofeje bez uříznutí |
| **Otočení za běhu** | spustit na výšku → otočit → graf, trofeje, otevřený modal se přepočítají |
| Skládačka (složit/rozložit) | změna šířky za běhu; obsah a modaly se přepočítají. ⚠️ Písmo z `responsive.ts` zůstane podle stavu při startu (spuštěno rozložené → na vnějším displeji o něco větší). Neověřeno na zařízení. |

---

## GOLDEN RULE

**Šířku nikdy neukládej mimo komponentu a nikdy nepočítej s celou obrazovkou —
čti ji živě (`useWindowDimensions`) a omez ji sloupcem nebo stropem z `src/utils/layout.ts`.**
