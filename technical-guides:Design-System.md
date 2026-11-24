# 🎨 SelfRise V2 — Design System Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **Tokeny nového vzhledu** (`src/design/tokens.ts`) — barvy po rolích, písmo, mezery, zaoblení, pohyb
- **Stavební prvky** (`src/components/ui/`) — text, karta, tlačítko, pruh, čísla, oblouk dne, plamen, ikony
- **Slovník pocitů** (`feel('<okamžik>')`) — vibrace a zvuky na jednom místě
- **Choreografie posunu** — karty, které vyplouvají a ustupují, a smyčky, které se při posunu zastaví
- **6 kritických pravidel** a jejich hlídací testy (ráčna, kontrast, písma)
- **Nebezpečné zóny** — jak si plynulost nebo vzhled znovu rozbít

**🔧 KDY TOHLE POUŽÍVAT:**
- Převádíš obrazovku z laboratoře do ostré appky (`design-migration-plan.md`, etapy E3–E23)
- Stavíš cokoli nového v novém vzhledu
- Saháš na `src/design/`, `src/components/ui/`, `src/constants/feel.ts` nebo `src/services/feelService.ts`
- Řešíš „sekání při posunu“, „ikony jako otazníky“, „špatně čitelný text“ nebo „jiná vibrace na stejném místě“

---

## Proč tenhle systém existuje

Nový vzhled vznikl v laboratoři (`src/screens/design-lab/`) za 53 kol a 80 poučení
(`premium-design-plan.md`, kap. 10). Do ostré appky se převádí **1:1** a obrazovka po obrazovce.
Aby se neopisovaly styly a s nimi i jejich chyby, každá převedená obrazovka staví jen z:

1. **tokenů** — jediné místo, kde je napsaná barva, velikost písma, mezera nebo zaoblení;
2. **stavebních prvků** — jediné místo, kde je napsaný pohyb, dotyk a pravidla plynulosti.

Staré obrazovky dál čtou `useTheme().colors` (`src/constants/colors.ts`), dokud nějaká existuje.

Laboratoř si drží vlastní kopie (je to vzor). **Oprava prvku během převodu se dělá na obou místech**,
dokud laboratoř existuje (O-6).

---

## 🚨 6 KRITICKÝCH PRAVIDEL

### Pravidlo 1: V převedeném souboru nic napevno — jen tokeny

```tsx
// ✅ CORRECT
const { c } = useDesign();
<View style={{ backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xl }} />
<View style={{ backgroundColor: withAlpha(fixed.black, 0.32) }} />

// ❌ WRONG
<View style={{ backgroundColor: '#FFFFFF', borderRadius: 24 }} />
<View style={{ backgroundColor: `${c.habit.blue}22` }} />
<Text style={{ fontSize: 14, fontWeight: '600' }} />
```

**Proč:** jen tak se dá vzhled ladit na jednom místě a jen tak hlídá test kontrastu všechno, co
uživatel vidí. Ráčna (`src/design/__tests__/ratchet.test.ts`) projde každý soubor na svém seznamu.
**Po každé etapě do seznamu přidej její soubory — seznam jen roste.** Kruh = `radius.pill` (999 na
čtverci dá kruh), tenký pruh také. Chybí-li token, přidej ho do `tokens.ts` (pojmenovaný po roli).

### Pravidlo 2: Posun jen přes `Animated.event` s nativním ovladačem, karty bez průhlednosti

```tsx
// ✅ CORRECT
const { frame, onScroll, onLayout } = usePageScrollFrame(bottomInset, true);
<ScrollFrameProvider value={frame}>
  <Animated.ScrollView onScroll={onScroll} onLayout={onLayout} scrollEventThrottle={16}>
    <ScrollCard>…</ScrollCard>
  </Animated.ScrollView>
</ScrollFrameProvider>

// ❌ WRONG — styl svázaný s posunem přes Reanimated, průhlednost karty
const style = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, …) }));
```

**Proč:** posunem řízený styl v Reanimatedu stál commit ShadowTree v každém snímku a posun se sekal
i s vypnutými efekty (kolo 4–5, P1). Průhlednost karty se stínem a plátnem nutí kreslit mimo obrazovku
v každém snímku (P2). Reanimated zůstává na všechno, co posun neřídí (nájezd, odškrtnutí, oblouk dne).

### Pravidlo 3: Dotyk a zvuk jen přes slovník pocitů

```tsx
// ✅ CORRECT
import { feel } from '@/src/services/feelService';
feel('saved');
<PressableScale feel="press" onPress={…} />   // výchozí je 'tap'

// ❌ WRONG
impact(ImpactFeedbackStyle.Medium);
notification(NotificationFeedbackType.Success);
```

**Proč:** v laboratoři bylo 32 ručních vibrací a stejný okamžik se jinde cítil jinak. Okamžik má jedno
jméno a jméno rozhoduje o vzoru i zvuku (`src/constants/feel.ts`). Zvuk jen u 6 vzácných oken —
denní zvuk se do týdne změní v hluk. Vypínače uživatele vždy vyhrají.

### Pravidlo 4: Jedna rodina písma na tloušťku, nikdy `fontWeight`

```tsx
// ✅ CORRECT
<AppText variant="bodyStrong">…</AppText>
style={{ fontFamily: fonts.semibold }}

// ❌ WRONG
style={{ fontFamily: 'Figtree-Regular', fontWeight: '600' }}
```

**Proč:** Android u vlastního písma s `fontWeight` potichu přepne na systémové písmo. Písmo ikon
(`SelfRiseIcons`) musí mít PostScript název — bez něj iOS kreslí ikony jako „?“ (P78). Písma se
načítají při startu (`app/_layout.tsx`) a chyba písma start nezablokuje (systémové písmo jako náhrada).

### Pravidlo 5: Žádný `Modal` z `react-native`

```tsx
// ✅ CORRECT — okno je View ve vrstvě nad obrazovkou (design-migration-plan.md kap. 6.0)
// ❌ WRONG
import { Modal } from 'react-native';
```

**Proč:** dvě nativní okna přes sebe appku zamrazila (`technical-guides:Startup-Orchestrator.md`).
Okna nového vzhledu jsou View ve vrstvě a ve frontě po jednom (E4, E8). Ráčna to hlídá.

### Pravidlo 6: Kontrast hlídá test, ne oko

```text
✅ CORRECT — po každé změně barvy: npx jest src/design
❌ WRONG — „na mém telefonu to je vidět“
```

**Proč:** test kontrastu (`src/design/__tests__/contrast.test.ts`) při převodu tokenů našel tři chyby,
které v laboratoři nikdo neviděl (P80). Text ≥ 4,5 : 1, velký text a značky ≥ 3 : 1, oba režimy.

---

## Tokeny (`src/design/tokens.ts`)

| Skupina | Co v ní je |
|---|---|
| `palettes.light` / `.dark` (`Palette`) | plocha, povrch, text, tlumený / slabý text, hlavní, odměna, plamen, úspěch, nebezpečí (+ `onDanger`), led, barvy návyků, grafy |
| `fixed` | barvy stejné v obou režimech: bílá, černá (závoj), inkoust, zlato, jiskra |
| `type` (`TypeVariant`) | `display`, `title`, `titleSm`, `number`, `numberMd`, `numberSm`, `body`, `bodyStrong`, `label`, `caption`, `overline` |
| `space`, `radius`, `motion` | mřížka 4/8; 12 / 16 / 24 / 28 (spodní okna a okna oslav) / pilulka; časy a pružiny |
| `rarity`, `tier` | barvy vzácnosti trofejí a šesti stupňů úrovní |
| `sky`, `sun`, `skyGold`, `getDaypart()` | nebe a slunce hrdiny podle denní doby |
| `signatureTones` | dvě barvy každé podpisové ikony |
| `night`, `SPLASH_*` | noční scéna úvodu a spuštění (vždy tmavá) |
| `shadows` | stíny plovoucích vrstev (oznámení, panel, okno trofeje…) |
| `withAlpha()`, `onHabitColor()` | průhledná verze barvy (jen `#RGB` / `#RRGGBB`, jinak výjimka); čitelný symbol na barvě návyku |

V komponentě: `const { c, mode } = useDesign();` (`src/contexts/ThemeContext.tsx`).

## Stavební prvky (`src/components/ui/`)

| Prvek | Na co |
|---|---|
| `AppText`, `typeStyle()`, `toneColor()` | každý text; strop zvětšení písma podle varianty; `accessibilityLabel` pro text s ikonou |
| `Surface` | karta (povrch, okraj, stín, volitelný přechod) |
| `PressableScale` | každé ťuknutí: stisk na nativním ovladači + okamžik `feel` (`'tap'` výchozí = jemné ťuknutí z laboratoře, `'press'` pevnější, `null` když si ho volá sám) |
| `Rise` | nájezd ve svém okně společné časové osy (`IntroProvider`, `useIntroWindow`) |
| `AnimatedNumber`, `RollingNumber` | čísla, která se plní / odvalují; jen tabulkové číslice (Figtree) |
| `ProgressBar` | pruh, výplň se posouvá (`translateX`), konce se nemačkají |
| `DayArc`, `MiniArc` | oblouk dne se sluncem; smyčky jen když `ambient` = 1 |
| `CheckButton` | odškrtnutí (`feel('check')` / `feel('uncheck')`) |
| `Chip`, `IconBadge`, `Divider` | drobnosti |
| `Ring`, `Stars` | kruh s procenty; pět hvězd |
| `StreakFlame` | plamen série deníku; stav zvenku, hraje jen na zaměřené obrazovce (`useIsFocused` – musí být uvnitř obrazovky navigace); konec zahřátí hlásí `onWarmed`, při sníženém pohybu hned |
| `SignatureIcon`, `InlineIcon` | podpisové ikony ⭐ 🔥 👑 🏆 a záložky z písma `SelfRiseIcons` |
| `ScrollCard`, `usePageScrollFrame`, `useCardSeen`, `useScrollRest` | choreografie posunu a klid při posunu |
| `TabBar` (+ `tabBarLogic.ts`) | spodní lišta (E3): vlastní ikony, klouzavá pilulka; `tabPress` vždy, přepnutí jen nezaměřené záložky; ikona pro každou trasu `app/(tabs)` (test) |
| `TopRow`, `RoundButton` | horní řádek záložky (E3): `insets.top` + 48 pt, vlevo místo pro odznak (E7), tlačítka vpravo; kulaté tlačítko 44 pt |
| `BottomSheet`, `useKeyboardLift`, `ConfirmSheet`, `UndoToast`, `PageTopBar` (`sheets.tsx`) | spodní okno (nad klávesnicí, zavírá závoj / zpět / tažení – ne s textovým polem), potvrzení smazání (místo `Alert`, O-14; tlačítko `onDanger`), krátké oznámení s vrácením, horní řádek karty s křížkem (E4) |
| `DetailFrame` | detail rostoucí z karty a zpět do ní – jeden díl pro deník, návyk i výzvu; obsah přes `children(close, p)` (E4) |
| `useDragToClose`, `DetailScroll` (+ `dragToCloseLogic.ts`) | zavírání tažením: po puštění zavřít, nebo vrátit celé (E4) |
| `useOverlayCover`, `useOverlayCovered`, `useOverlayBack` (`overlayRegistry.ts`) | „něco je otevřeno“ pro panel úrovně; Android zpět jen na zaměřené obrazovce (E4) |
| `useWindowMotion`, `PrimaryButton`, `windowStyles` (`windowFrame.tsx`) | rám oken oslav: příjezd, oznámení čtečce, odchod vždy ohlášený (E4; okna E8, E10, E18) |

## Slovník pocitů

- Okamžiky a jejich vzory: `src/constants/feel.ts` (`FEEL`), zvukové jen `SOUND_MOMENTS`.
- Přehrání: `feel('<okamžik>')` ze `src/services/feelService.ts` — vibrace přes `hapticsService`
  (vypínač „Haptic feedback“), zvuk přes `expo-audio` (jeden přehrávač na zvuk, hlasitost 0,6, tichý
  režim telefonu vyhraje, chyba zvuku nikdy neshodí okamžik).
- Vypínač zvuků: `setSoundsEnabled()` / `isSoundsEnabled()`, uložený pod `@sounds_enabled`, načtený
  při startu (`initSounds()` v `app/_layout.tsx`), událost `SOUNDS_CHANGED_EVENT`. Řádek v Nastavení
  přibude v E20.
- Mapa ručních vibrací laboratoře → okamžik: `src/screens/design-lab/PREVOD.md`, řádek `labFeel.ts`.

---

## ⚠️ NEBEZPEČNÉ ZÓNY

1. **Styl svázaný s posunem v Reanimatedu** → sekání (pravidlo 2).
2. **Animace průhlednosti na kartě** → vykreslování mimo obrazovku v každém snímku.
3. **Smyčka, která běží při posunu nebo mimo obrazovku** (slunce, plamen) → ukradené snímky. Smyčky
   poslouchají `useScrollRest` a `ambient` (P79).
4. **Výška, která se mění při běžné změně stavu** → všechny karty pod ní přestaví animace (P79).
5. **Okraj na číslici v `RollingNumber`** → číslice zmizí ze svého sloupce; okraje patří celému číslu (P34).
6. **`fontWeight` u vlastního písma** → Android tiše použije systémové písmo.
7. **Ruční písmo ikon** → písmo se mění jen skriptem `scripts/build-icon-font.py` (P78).
8. **`withAlpha()` na průhlednou barvu** (`primarySoft`…) → výjimka; průhlednost se skládá jen z plné barvy.
9. **Ruční vibrace** → stejný okamžik se cítí jinak na dvou místech (pravidlo 3).

## Testování

| Test | Hlídá |
|---|---|
| `src/design/__tests__/contrast.test.ts` | kontrast AA všech dvojic v obou režimech |
| `src/design/__tests__/fonts.test.ts` | každá varianta má rodinu bez `fontWeight`; každá rodina má soubor a PostScript název |
| `src/design/__tests__/habitPalette.test.ts` | barva návyku má stejný odstín v obou režimech |
| `src/design/__tests__/ratchet.test.ts` | převedené soubory jen z tokenů, bez `measureLabPerf` a bez RN `Modal` |
| `src/design/__tests__/tokens.test.ts` | `withAlpha`, `onHabitColor`, `getDaypart` |
| `src/constants/__tests__/feel.test.ts` | zvuk jen u vzácných oken, krátké vzory, vypínače |
| `src/services/__tests__/feelService.test.ts` | přehrávač: vzor v čase, jeden přehrávač na zvuk, vypínače, chyba zvuku |
| `src/components/ui/__tests__/rollingNumberLogic.test.ts` | sloupce číslic a okraje celého čísla |

```bash
PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npx jest src/design src/components/ui src/constants src/services/__tests__/feelService
```

## Co se NESMÍ rozbít

- Start appky: písma ani databáze ho nesmí zablokovat (`app/_layout.tsx`).
- Staré obrazovky: `useTheme().colors` zůstává beze změny, dokud ho něco čte.
- Laboratoř: dál běží na svých kopiích (`src/screens/design-lab/`).
- Vypínač vibrací: `feel()` ho vždy respektuje.

## Device scénáře (po změně prvku nebo tokenu)

- Světlý i tmavý režim, němčina (nejdelší texty), největší systémové písmo, snížený pohyb.
- Rychlý posun stránky s kartami hned po odškrtnutí (měření `[LabPerf]` v laboratoři, kap. 7.4 plánu).
- Tichý režim telefonu: velké okno nehraje zvuk, vibruje.
- Snímky před/po: `.maestro/capture.sh` (`.maestro/README.md`).

---

## GOLDEN RULE

> **Obrazovka nového vzhledu se skládá z tokenů a prvků — nikdy z opsaných stylů.**
> Co chybí, přidej jako token nebo prvek (pojmenovaný po roli), oprav i v laboratoři a nech to
> pohlídat testem.
