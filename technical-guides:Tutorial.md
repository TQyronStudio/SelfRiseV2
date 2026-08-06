# 🎓 SelfRise V2 — Onboarding Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **5 kritických pravidel** — bez nich zamrzá iOS, mizí trofeje nebo uživatel skončí v prázdné aplikaci
- **Průběh onboardingu** — brána předvoleb → uvítání → 3 obrazovky, a kde se to spouští
- **Stav a úložiště** — klíče AsyncStorage a jejich sémantika, na které visí půlka aplikace
- **Brána trofejí** — pořadí nabít → vytvořit → počkat
- **Obrazovky 1–3** — co dělají a proč zrovna takhle
- **Lokalizace, theme, zařízení, přístupnost** — závazné vzory
- **Nebezpečné zóny** — přesně ty způsoby, jak si tenhle systém rozbít

**🔧 KDY TOHLE POUŽÍVAT:**
- Saháš na `src/components/onboarding/`, `TutorialContext` nebo bránu předvoleb
- Přidáváš cokoliv, co se má zobrazit při prvním spuštění
- Měníš `TUTORIAL_STORAGE_KEYS` nebo cokoliv, co je čte
- Řešíš „během úvodu vyskočila cizí trofej / appka zamrzla / úvod naskočil moc brzy"
- Přidáváš texty do `onboarding.*` nebo nový jazyk

> Soubor se jmenuje `Tutorial.md`, protože tak se subsystém jmenuje i v kódu:
> `TutorialContext`, `TUTORIAL_STORAGE_KEYS`, `useTutorial()`. Přejmenování
> těch klíčů by bylo **tiché** rozbití — několik souborů čte ty přesné
> řetězce a nespadlo by nic nahlas.

---

## Proč tenhle systém existuje

Uživatel po prvním spuštění nesmí skončit v prázdné aplikaci. Onboarding má
jediný cíl: **odejít z něj s návykem, cílem a prvním odškrtnutím.**

Druhý důvod je obranný. Onboarding je jediné místo, kde se potkává nativní
okno (ATT, souhlas s reklamou, povolení notifikací), naše RN okno a oslavné
okno trofeje. **Dva modály přes sebe zmrazí iOS natvrdo** — proto je celý
systém postavený tak, aby se nikdy nepotkaly.

```
brána předvoleb  →  uvítání  →  obrazovka 1  →  obrazovka 2  →  obrazovka 3
(jazyk, téma,       (jedna       (návyk)         (cíl)          (odškrtnutí)
 notifikace)         stránka)     ●○○             ○●○            ○○●
```

Brána a uvítání **nejsou číslované obrazovky** — tečky ukazují tři úkoly, ne
pět kroků. Brána běží jen při úplně prvním spuštění.

---

## 🚨 5 KRITICKÝCH PRAVIDEL (bez nich systém NEFUNGUJE)

### Pravidlo 1: V onboardingu není žádný RN `<Modal>`

```tsx
// ❌ FATAL: obrazovka jako modál
<Modal visible={screen === 1}>
  <FirstHabitScreen />
</Modal>
// → potká se s oslavným oknem trofeje nebo se systémovým promptem → ZAMRZNUTÍ iOS

// ✅ CORRECT: plnohodnotné view nad navigátorem (OnboardingFlow.tsx)
<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
               zIndex: 9999, elevation: 9999 }}>
  <FirstHabitScreen />
</View>
```

**Proč**: celá ochrana proti zamrznutí stojí na tom, že se RN modály nikdy
nepotkají. Jediné modály, které ve flow smějí být: **brána předvoleb** a
**oslavná okna trofejí** (řídí je `ModalQueueContext`, jedno v jeden okamžik).

**`elevation` není zbytečné.** Na Androidu přebíjí `zIndex` v pořadí kreslení
sourozenců — bez něj se přes obrazovku prokreslí spodní lišta.

### Pravidlo 2: Start až za `awaitStartupComplete()`

```typescript
// ❌ WRONG: onboarding hned po namontování
useEffect(() => { autoStart(); }, []);
// → naskočí přes ještě zobrazený ATT / consent prompt → ZAMRZNUTÍ

// ✅ CORRECT (TutorialContext.tsx:371-382)
const run = async () => {
  await awaitStartupComplete();   // bariéra Startup Orchestratoru
  if (cancelled) return;
  await autoStart();
};
const timer = setTimeout(run, 300);  // + čas na inicializaci kontextů a navigace
```

**Proč**: `awaitStartupComplete()` doběhne, teprve až fronta startovních oken
dojede. Na dalších spuštěních je to prakticky okamžité, protože se nic
nezobrazuje. Detaily v @technical-guides:Startup-Orchestrator.md.

### Pravidlo 3: Bránu trofejí nabít PŘED vytvořením, přejít až po `wait()`

```typescript
// ❌ WRONG: nabít až po vytvoření
await habitActions.createHabit(data);
const gate = armTutorialAchievementGate('first-habit');
await gate.wait();
// → odemčení přijde ~100 ms po vytvoření, posluchač ho promešká → čeká se naprázdno

// ❌ WRONG: nečekat na zavření oslavy
const gate = armTutorialAchievementGate('first-habit');
await habitActions.createHabit(data);
void gate.wait();          // ← přechod na další obrazovku PŘES otevřenou oslavu
onCreated();

// ✅ CORRECT (createWithTrophyGate.ts)
await createWithTrophyGate({
  arm: () => armTutorialAchievementGate('first-habit'),  // 1. NABÍT
  create: () => habitActions.createHabit(data),          // 2. VYTVOŘIT
});                                                       // 3. POČKAT (uvnitř)
onCreated();
```

**Proč**: uživatel musí oslavné okno zavřít dřív, než onboarding přejde dál —
jinak se dvě okna perou. **Při restartu ze Settings ale žádné okno nepřijde**
(trofej už vlastní), takže `wait()` nesmí čekat vůbec. Rozlišuje se dotazem do
úložiště trofejí *před* vytvořením, ne odhadem z příznaku restartu.

Časové limity v `tutorialAchievementGate.ts` jsou **záchranné brzdy, ne tempo**.
V hlavičce toho souboru jsou popsané dva dřívější pokusy, které tohle spletly —
přečti si je, než na to sáhneš.

### Pravidlo 4: Sémantika storage flagů se nemění

```typescript
// ✅ Jediná povolená sémantika
dokončení onboardingu  → COMPLETED = 'true'
přeskočení             → SKIPPED   = 'true'
rozdělaná obrazovka    → CURRENT_STEP = '1' | '2' | '3'

// ❌ WRONG: „uklidím to a zavedu jeden čistý příznak"
await AsyncStorage.setItem('onboarding_state', 'done');
// → filtr trofejí i potlačení level-up modálu tiše přestanou platit
```

**Proč**: na těch flagech visí věci, které s onboardingem nesouvisejí na první
pohled:

| Kdo | Co dělá | Čte |
|---|---|---|
| `AchievementContext.tsx:339-348` | propustí jen `first-habit` a `first-goal`, ostatní oslavy potlačí | `isTutorialActive()` |
| `XpAnimationContext.tsx:11-14` | potlačí **modál** level-upu | `COMPLETED` / `SKIPPED` |
| `HabitsContext.tsx:201`, `GoalsContext.tsx:165` | při restartu neslaví trofej znovu | `isTutorialRestarted()` |

Klíče jsou v `src/constants/tutorialStorageKeys.ts` jako **single source of
truth** právě proto, že to jsou obyčejné řetězce — překlep by neodhalil ani
`tsc`, ani žádný test, a projevil by se až jako zamrznutí na telefonu.

### Pravidlo 5: `CURRENT_STEP` mimo rozsah → začít od 1, nikdy neořezávat

```typescript
// ❌ WRONG: ořezání do rozsahu
const screen = Math.min(Math.max(savedStep, 1), 3);
// → uživatel, který upgradoval uprostřed starého flow, má uloženo třeba 17
//   a skončí rovnou na obrazovce 3 — bez návyku a bez cíle

// ✅ CORRECT (TutorialContext.tsx:39-44)
export function resolveOnboardingStartScreen(savedStep: number): OnboardingScreen {
  if (!Number.isFinite(savedStep)) return 1;
  const step = Math.trunc(savedStep);
  if (step < 1 || step > ONBOARDING_TOTAL_SCREENS) return 1;
  return step as OnboardingScreen;
}
```

**Proč**: `CURRENT_STEP` je sdílený klíč, který dřív počítal do 25. Nesmyslná
hodnota znamená „nevíme, kde jsi" — a jediná bezpečná odpověď je začít znovu.
Ořezání na 3 by uživatele posadilo na cílovou čáru s prázdnou aplikací, což je
přesně to, čemu má celý onboarding zabránit.

---

## Kde se onboarding spouští

`TutorialContext.tsx:332-383`, v tomto pořadí:

1. `awaitStartupComplete()` (pravidlo 2)
2. `setTimeout(…, 300)` — kontexty a navigace se stihnou inicializovat
3. `shouldShowOnboarding()` — nic, když je `COMPLETED` nebo `SKIPPED`
4. `router.push('/(tabs)')` + 300 ms — ať se to zjeví nad domovskou obrazovkou
5. rozhodnutí, co zobrazit:

| Podmínka | Co se stane |
|---|---|
| `CURRENT_STEP > 1` | pokračuje se na rozdělané obrazovce, **uvítání se přeskočí** |
| `PREFS_COMPLETED ≠ 'true'` | brána předvoleb |
| jinak | uvítání |

Namontováno je to na **jediném místě**: `app/_layout.tsx:95`, jako poslední
sourozenec, aby kreslilo přes navigátor.

---

## Stav

### ⚠️ Dvě různé pravdy o tom, „jestli onboarding běží"

Vypadají zaměnitelně. Nejsou.

```typescript
// A) React stav — platí, JEN když je onboarding právě vidět
const { state } = useTutorial();
state.isActive        // AdBanner, zvýraznění zaškrtávátka
state.onboardingScreen // 1 | 2 | 3 | null

// B) Storage flagy — async, čte se i zvenčí React stromu
await isTutorialActive()
// vrací true, kdykoliv NENÍ ani COMPLETED ani SKIPPED
// → TEDY I PŘEDTÍM, NEŽ ONBOARDING VŮBEC ZAČNE
```

**Filtr trofejí (`AchievementContext`) stojí na B, ne na A.** Kdo změní zápis
flagů, rozbije filtr, aniž by se ho dotkl. To je důvod pravidla 4.

### Klíče (`tutorialStorageKeys.ts`)

| Klíč | Význam |
|---|---|
| `COMPLETED` | onboarding doběhl do konce |
| `SKIPPED` | uživatel ho opustil |
| `CURRENT_STEP` | číslo rozdělané obrazovky (1–3) |
| `PREFS_COMPLETED` | brána předvoleb proběhla |
| `RESTARTED` | běží znovu ze Settings (trofeje už vlastněné) |
| `SESSION`, `SESSION_TIMESTAMP`, `CRASH_LOG`, `ERROR_COUNT`, `RECOVERY_STATE` | **nikdy se nezapisují**, jen maže `clearCrashData()` |

---

## Principy návrhu (tyhle drží kvalitu, ne funkčnost)

### Předvolba je startovní hodnota, ne zámek

```tsx
// ❌ WRONG: ťuknu na dlaždici a mám hotovo, nic nejde změnit
<OnbTileGrid items={presets} onSelect={createHabitImmediately} />

// ✅ CORRECT (FirstHabitScreen.tsx:151-186): pod mřížkou skutečné ovládací prvky
<OnbTileGrid items={tiles} selectedId={selectedId} onSelect={handleSelect} />
{selectedId !== null && (
  <>
    <TextInput value={name} onChangeText={setName} />
    <ColorPicker selectedColor={color} onColorSelect={setColor} />
    <IconPicker selectedIcon={icon} onIconSelect={setIcon} />
    <DayPicker selectedDays={days} onDayToggle={toggleDay} />
  </>
)}
```

Jsou to **ty samé komponenty**, co používá normální formulář. Jeden ťuk vyplní
název, ikonu a barvu — a všechno zůstane editovatelné.

Formulář se zobrazí až po výběru: prázdná pole nad dlaždicemi by dělala
z obrazovky práci dřív, než si uživatel cokoliv vybral.

### „Přeskočit" je na každé obrazovce

`OnbScreenContainer.tsx:157-164`. Nikdo nesmí být rukojmí úvodu.

### Obrazovka 3 nepřekrývá aplikaci

Ostatní obrazovky aplikaci zakrývají. Tahle **nesmí** — celý smysl je, že
uživatel vidí svůj návyk a ťukne na skutečné zaškrtávátko.

```tsx
// ❌ WRONG: karta uvnitř celoobrazovkového překryvu
<View style={styles.takeover}><FirstCheckCard /></View>
// → zablokuje přesně to ťuknutí, o které si říká

// ✅ CORRECT (FirstCheckCard.tsx:116): karta u spodního okraje, klikatelná appka
<View style={styles.root} pointerEvents="box-none">
```

Ukazuje se **pulzováním samotného zaškrtávátka**
(`HabitItemWithCompletion.tsx:397` → `HabitCompletionButton highlight`), ne
overlayem, který by dopočítával souřadnice.

### Validace kopíruje pravidla normálního formuláře

`goalDraft.ts` má stejná pravidla jako `GoalForm`: celé číslo, > 0, ≤ 999999.
Cíl vytvořený v onboardingu a upravený potom v normálním formuláři nesmí
poslouchat dvě různá pravidla.

### Sdílí se data, ne vzhled

`goalTemplates.ts` drží 11 šablon. `GoalTemplatesModal` (záložka Cíle) je
ukazuje jako **široké řádky**, onboarding jako **kompaktní dlaždice**. Jedna
komponenta pro obojí by změnila vzhled Cílů.

---

## Obrazovky

| | Soubor | Obsah |
|---|---|---|
| Brána | `OnboardingPreferencesModal.tsx` | jazyk → téma → notifikace. Zavírá se **před** systémovým promptem (`TutorialContext.tsx:269`) — nikdy dva modály. |
| Uvítání | `WelcomeScreen.tsx` | jedna stránka, tři řádky, jedno tlačítko. Je to **příznak**, ne čtvrtá obrazovka, aby tečky mluvily pravdu. |
| 1 | `FirstHabitScreen.tsx` | 6 předvoleb + „Něco jiného". CTA se rozsvítí při neprázdném názvu a aspoň jednom dni. |
| 2 | `FirstGoalScreen.tsx` | 11 šablon + „Něco jiného". Číslo a jednotka na jednom řádku — „12 knih" je jedna odpověď. **Bez výběru data** (volitelné, kalendář uprostřed flow je překážka). |
| 3 | `FirstCheckCard.tsx` | karta u spodního okraje. Zmizí sama po odškrtnutí, tlačítko je východ. |

**`CUSTOM_HABIT_DEFAULTS.scheduledDays = ALL_DAYS`**: dny jsou jediné povinné
pole bez výchozí hodnoty; prázdné by uživatele zastavila validace.

**Základní hodnota na obrazovce 3** (`checkDetection.ts`): kdo si onboarding
pustí znovu večer, může mít dnešní návyky **už odškrtnuté**. Naivní podmínka by
vyhlásila vítězství v okamžiku, kdy se karta objeví. Proto se při zobrazení
zapamatuje počet a čeká se, až **naroste**.

Po odškrtnutí se čeká `CELEBRATION_LINGER_MS = 1200`, aby doběhla XP animace —
ta je důvod, proč obrazovka existuje. (Potlačuje se jen **modál** level-upu,
ne animace v liště.)

---

## Restart ze Settings

`settings.tsx:197-198` → `restartTutorial()` + `clearCrashData()`.

`restartTutorial()` (`TutorialContext.tsx:293-318`) smaže `COMPLETED`,
`CURRENT_STEP`, `SKIPPED` → nastaví `RESTARTED='true'` → `router.push('/(tabs)')`
+ 300 ms → **uvítání** (restart má působit jako to pravé).

`RESTARTED` říká kontextům návyků a cílů, že trofeje už uživatel vlastní.
Maže se při dokončení i přeskočení.

---

## Lokalizace

**EN, DE, ES.** Texty onboardingu pod `onboarding.*`, brána pod
`tutorial.languageSetup.*` a `tutorial.themeSetup.*`.

```typescript
// ✅ CORRECT: název se překládá v okamžiku vytvoření
setName(t(preset.nameKey));   // FirstHabitScreen.tsx:80

// ❌ WRONG: natvrdo psaný anglický řetězec v konstantě
{ id: 'read', name: 'Read', ... }
```

Návyk se uloží v jazyce, který si uživatel vybral. Pozdější změna jazyka už
vytvořená data nepřepisuje — od té chvíle jsou to uživatelova data.

**Měna** `goals.units.currency`: EN `$`, DE `€`, ES `€`. Německá šablona dá
„Bücher" a eura.

| Test | Co ohlídá |
|---|---|
| `localeParity.test.ts` | DE a ES mají **přesně** klíče co EN — chybějící i přebývající |
| `onboardingCopy.test.ts` | délku textů |
| `helpTooltipKeys.test.ts` | každý `helpKey` z kódu existuje ve všech 3 jazycích |

`localeParity` je **jediná** pojistka na úplnost DE/ES: oba soubory jsou
`Partial<TranslationKeys>` s ~30 přetypováními `as any`, takže `tsc` neohlídá nic.

`onboardingCopy` drží texty krátké, s rezervou pro delší němčinu a španělštinu.
**Když limit padne, zkrať text — nezvyšuj číslo.**

---

## Theme, zařízení, přístupnost

```typescript
// ❌ WRONG: StyleSheet na úrovni modulu
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF' } });

// ✅ CORRECT: uvnitř komponenty, barvy z useTheme()
export function OnbTile() {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    card: { backgroundColor: colors.cardBackgroundElevated },
  });
}
```

- **2-tier systém**: stránka `backgroundSecondary`, karty
  `cardBackgroundElevated`, texty `textPrimary` / `textSecondary`.
- Zakázáno: natvrdo psané barvy, stíny v tmavém režimu, čistě černé pozadí.
- Typografie přes `Fonts` + `scaleFont()`. Žádné holé číselné `fontSize`.
- Breakpointy z `src/utils/responsive.ts` — `getScreenSize()`, `scaleFont()`,
  `getCardPadding()`, `isTablet()`. Nevymýšlet vlastní.
- Mřížka: **2 sloupce** na SMALL/MEDIUM, **3** na LARGE/TABLET
  (`getOnbTileColumns()`).
- **Tablety**: obsah do sloupce `ONB_MAX_CONTENT_WIDTH = 560`. Dlaždice přes
  celý iPad vypadají rozbitě.
- Orientace zamčená na portrait (`app.json:6`) — landscape se neřeší.

**Klávesnice** — klasický zdroj chyb:

```tsx
// ✅ CORRECT (OnbScreenContainer.tsx:133)
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
```

Na iOS klávesnice view překrývá, na Androidu okno zmenší. Jedna hodnota pro
obojí způsobí dvojitý posun. Bez toho zmizí CTA pod klávesnicí na malých
displejích a flow se stane slepou uličkou.

**Přístupnost:**
- Dlaždice: `accessibilityRole="button"` + `accessibilityLabel`. **Viditelný
  popisek je zároveň ten přístupnostní** — druhý řetězec by se jen rozešel
  s prvním. Výběr hlásí `accessibilityState`, ten si OS lokalizuje sám.
- Tečky postupu: `accessibilityRole="progressbar"` + `onboarding.progressA11y`.
- Dotykové cíle min. 44 pt (CTA má 48).
- **Reduce-motion** (`useAccessibility()`): dlaždice vynechá stisk-scale,
  zaškrtávátko dostane **statický kroužek místo pulzu**. Zvýraznění nesmí
  zmizet, jen se přestane hýbat.

---

## ⚠️ NEBEZPEČNÉ ZÓNY (nejčastější způsoby, jak to rozbít)

1. **⛔ Obrazovka onboardingu jako `<Modal>`** — pravidlo 1. Vypadá to
   přirozeně („je to přece překryv"), a je to přesně ta příčina zamrzání iOS.
2. **⛔ Přejmenování / „úklid" storage klíčů** — pravidlo 4. Tiše vypne filtr
   trofejí i potlačení level-up modálu. `tsc` ani testy nic nenajdou.
3. **⛔ Nabití brány trofejí až po vytvoření** — pravidlo 3. Posluchač
   promešká odemčení a čeká se naprázdno do timeoutu.
4. **`void gate.wait()` místo `await`** — přechod proběhne přes otevřenou
   oslavu. V testu se to neprojeví, dokud se mikrofronta pořádně nevyprázdní
   (`await new Promise(r => setImmediate(r))`, ne `await Promise.resolve()`).
5. **Zabalení obrazovky 3 do překryvu** — zablokuje ťuknutí, o které si říká.
6. **Nová startovní obrazovka mimo `OnboardingFlow`** — dvě místa, která
   rozhodují, co se zobrazí, se dřív nebo později neshodnou.
7. **`StyleSheet.create` na úrovni modulu** — nedostane se k `colors` a
   nepřizpůsobí se tmavému režimu.
8. **Zvýšení limitu v `onboardingCopy.test.ts`** místo zkrácení textu — tak
   vznikl 25krokový průvodce, který nikdo nedočetl.

---

## Testování

```typescript
// src/contexts/__tests__/onboardingFlow.test.ts
✅ reducer: start, přechod, dokončení, přeskočení, restart
✅ resolveOnboardingStartScreen — rozsah, junk, hodnota ze starého flow (pravidlo 5)

// src/components/onboarding/__tests__/
✅ onboardingKit.test.ts — chunkIntoRows, sdílené bloky
✅ firstHabit.test.ts    — předvolby návyků
✅ firstGoal.test.ts     — parseGoalTarget, isGoalDraftComplete (hranice 0, 999999, "12abc")
✅ firstCheck.test.ts    — detekce odškrtnutí VČETNĚ večerního restartu

// src/locales/__tests__/
✅ localeParity.test.ts   — úplnost DE/ES v obou směrech
✅ onboardingCopy.test.ts — délka textů
```

`goalDraft.ts`, `checkDetection.ts` a `gridLayout.ts` jsou **záměrně bez
importů** — jinak by test kvůli tvrzení „šest dlaždic udělá tři řádky" vtáhl
`@expo/vector-icons`, theme a i18n. Reducer se testuje bez montování provideru
(ten potřebuje AsyncStorage, router a startovní bránu), proto jsou
`tutorialReducer` a `initialState` exportované.

**Spuštění vyžaduje Node ≥ 22.5:**

```bash
PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npm test
```

---

## Co se NESMÍ rozbít

- Onboarding vždy skončí návykem, cílem a odškrtnutím — nebo vědomým „Přeskočit"
- Nikdy dva modály přes sebe (nativní × RN × oslava trofeje)
- Filtr trofejí: během onboardingu projde jen `first-habit` a `first-goal`
- Potlačení level-up **modálu**, ale ne XP animace v liště
- Skrytí reklam po dobu onboardingu
- Obnovení po zabití aplikace — pokračuje na rozdělané obrazovce
- Restart ze Settings neslaví trofeje podruhé a nečeká na okno, které nepřijde
- Všechno vytvořené jde okamžitě upravit

---

## Device scénáře (po každé změně onboardingu)

1. **Čistá instalace** → ATT → souhlas → brána → uvítání → 3 obrazovky.
   **Nikdy dvě okna přes sebe.** Trofeje za první návyk a cíl vyskočí a čeká se
   na jejich zavření.
2. **Zabití aplikace na obrazovce 2** → další start pokračuje na 2, bez uvítání.
3. **Restart ze Settings večer**, když už je dnes něco odškrtnuté → karta na
   obrazovce 3 **nesmí zmizet hned**, čeká na nové odškrtnutí.
4. **Světlý i tmavý režim × EN/DE/ES** — němčina u cíle ukáže „Bücher" a €.
5. **Malý displej** — CTA nesmí zmizet pod klávesnicí u „Něco jiného".
6. **Tablet** — dlaždice se neroztáhnou přes celou šířku.
7. **Na obrazovce 3 otevřít „+ Přidat návyk"** — formulář jde scrollovat, uložit
   i zavřít tlačítkem zpět (obrazovka 3 nechává aplikaci schválně použitelnou).

---

**GOLDEN RULE**: *„Žádný modál. Start až za bariérou. Nabít → vytvořit →
počkat. Flagy se nepřejmenovávají. Předvolba je startovní hodnota, ne zámek."*

---

*Tento průvodce je závazná reference pro veškerou práci na onboardingu.
Popisuje stav kódu — když se kód změní, změň i tenhle soubor.*
