# 🏠 SelfRise V2 — Home Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **Co je „dnes“** na Home: jen návyky naplánované na dnešek, stejná pravidla jako záložka Návyky
- **Hrdina dne**: oblouk se sluncem, počet x/y, „+N XP dnes“, povzbuzující věta, oslava dokončeného dne
- **Pozdrav podle denní doby** (vlastní hranice 5 / 12 / 18 h, odděleně od barvy nebe)
- **Kompaktní hlavička** při rolování a pravidla plynulosti (P1–P3, P79)
- **Rychlé akce** a jejich odkazy `?quickAction=…`
- **Pořadí sekcí** (uživatelovo, `HomeCustomizationContext`)
- **Nebezpečné zóny**: jak si Home rozbít

**🔧 KDY TOHLE POUŽÍVAT:**
- Saháš na `app/(tabs)/index.tsx` nebo cokoli v `src/components/home/`
- Měníš, co se na Home počítá jako „dnešní návyk“ nebo „hotovo“
- Přidáváš nebo přesouváš sekci Home, měníš přizpůsobení Home
- Řešíš zadrhávání při rolování Home nebo „slunce se točí, i když se nedívám“

*Stav: převod designu E11 běží po krocích. **E11b hotová** (2026-11-25): hrdina, pozdrav,
kompaktní hlavička, rychlé akce, dnešní návyky. Karta série se záchranou (E11c), statistiky
návyků (E11d), Přehledy, Pro tebe, nový sheet přizpůsobení a převod uloženého rozložení (E11e)
zatím zůstávají ve staré podobě – jejich části se doplní sem se svým kódem.*

---

## Proč tenhle systém existuje

Home je první obrazovka po otevření appky. Má odpovědět na jedinou otázku: **„Jak jsem na tom
dnes a jaký je další malý krok?“** Proto je nahoře jeden hrdina (dnešek jako cesta slunce po
obloze), hned pod ním další krok (rychlé akce, dnešní návyky) a teprve potom pomalejší
statistiky. Každé číslo je na obrazovce **jednou** (P60) – „x/y“ jen v hrdinovi a v kompaktní
hlavičce, série deníku jen ve své kartě, úroveň jen na odznaku (R-31).

Home nic nerozhoduje: co je naplánované, co je hotové a kolik XP padlo, říkají pravidla appky
(úložiště návyků, `GamificationService`). Home je jen čte.

---

## 🚨 KRITICKÁ PRAVIDLA

### Pravidlo 1: „Dnes“ = naplánované dnes, stejně jako v Návycích

```ts
// ✅ CORRECT – stejné funkce jako záložka Návyky
const planned = splitHabits(habits, today).planned;
const done = doneToday(habit.id, completions, today);

// ❌ WRONG – všechny aktivní návyky, nebo vlastní výpočet „hotovo“
const planned = habits.filter(h => h.isActive);
```

**Proč:** hrdina Home a karta „Dnes“ v Návycích musí ukázat stejné „x/y“. Návyk Po·St·Pá ve
čtvrtek v plánu není – kdyby ho Home počítala, uživatel by ve čtvrtek nikdy neměl hotovo.
Nenaplánované (bonusové) návyky na Home nejsou: odškrtnutí mimo plán je bonus nebo náhrada a to
rozhodnutí patří do Návyků, kde jsou jeho pravidla vidět (rozhodnutí E11, 2026-11-25).
Pravidla: `src/screens/habits/habitListLogic.ts` (`splitHabits`, `doneToday`, `scheduleLabel`).

### Pravidlo 2: XP na Home se jen čte, nikdy nepočítá

```ts
// ✅ CORRECT – čip z deníku XP, obnova po události
GamificationService.getTodayXP();          // + znovu po 'xpGained' a ještě jednou za 400 ms
registerXpOrigin({ source: 'habit', sourceId: id }, point); // jen ODKUD jiskry letí

// ❌ WRONG – konstanta v obrazovce
setXpToday(x => x + 25);
```

**Proč:** bonus dává jiné XP, násobič ho mění a denní strop ho useká. Číslo musí být to, které
úložiště opravdu připsalo. Let jisker obstarává vrstva XP (`technical-guides:Gamification-UI.md`).

### Pravidlo 3: Oslava dne jen při přechodu na „vše“ a jen na Home

```ts
// ✅ CORRECT
if (finishedTheDay(prevDay, done, planned) && focused) { feel('dayDone'); flare(); }
// prevDay = { done, planned } z minulého vykreslení; plán se mezi nimi nesmí změnit

// ❌ WRONG – při každém vykreslení s done === planned, nebo i když je Home skrytá
if (done === planned) feel('dayDone');
```

**Proč:** záložky zůstávají připojené (R-32). Kdo dokončí den v Návycích, by jinak dostal
zavibrování od neviditelné Home. Plán se navíc nesmí mezi dvěma vykresleními změnit: návyky se
po startu načtou o chvilku později (0/0 → 3/3) a kdo měl den hotový už dřív, by jinak dostal
oslavu za pouhé otevření appky. Den s nulovým plánem není „vše hotovo“ a odškrtnutí zpět
oslavu nespustí (`src/screens/home/homeHeroLogic.ts`, `finishedTheDay`, test).

### Pravidlo 4: Pohyb vázaný na rolování jen přes nativní driver

```ts
// ✅ CORRECT – usePageScrollFrame + Animated.event({ useNativeDriver: true }), interpolace
// ❌ WRONG – useAnimatedScrollHandler / Reanimated styl podle scrollY (commit za snímek)
```

**Proč:** nejdražší lekce laboratoře (P1–P3). Hlavička, kompaktní lišta i karty se hýbou bez
JS za snímek (`src/components/ui/scrollChoreography.tsx`).

### Pravidlo 5: Kompaktní lišta vyjíždí, nikdy se neprolíná

**Proč:** nese plátno Skia (malý oblouk). Průhlednost nad plátnem nutí systém skládat ji mimo
obrazovku v každém snímku rolování. Lišta proto jen posouvá `translateY`.

---

## Stavba stránky

| Část | Soubor | Poznámka |
|---|---|---|
| Obrazovka (data, okna, pořadí sekcí) | `app/(tabs)/index.tsx` | horní řádek: Síň trofejí, přizpůsobení (`openHomeCustomization`) |
| Stránka: pozdrav, hrdina, kompaktní lišta, sekce | `src/components/home/HomePage.tsx` | vlastní `IntroProvider kind="settle"` |
| Pravidla hrdiny | `src/screens/home/homeHeroLogic.ts` | `greetingKey`, `encouragementOf`, `arcOrder`, `finishedTheDay` (test) |
| Dnešní návyky | `src/components/home/TodayHabits.tsx` | řádek se překreslí jen při změně svého návyku |
| Rychlé akce | `src/components/home/QuickActions.tsx` | |

### Pozdrav
`greetingKey(hour)`: ráno 5–12, odpoledne 12–18, večer 18–5 (rozhodnutí E11/1). „Dobrou noc“
není – v jednu ráno je člověk pořád vzhůru. **Barva nebe** se dál řídí `getDaypart()` z tokenů
(čtyři části dne); jen slova mají vlastní hranice. Čas se znovu přečte při každém návratu na Home.

### Hrdina
- Oblouk (`DayArc`): jedna značka na naplánovaný návyk, hotové první (`arcOrder`), slunce = podíl
  hotových. Číslo uprostřed roluje se sluncem.
- Nebe zezlátne, jak se den plní (průhlednost se mění jen při odškrtnutí).
- Povzbuzení (`encouragementOf`): nic v plánu → věta o volném dni (žádná pochvala za nic,
  rozhodnutí E11/2a), vše → pochvala, nic → nový začátek, jinak „zbývá N“. Věta má vždy **dvě
  řádky místa** (P79), aby změna věty nezměnila výšku hrdiny.
- Den bez plánu: oblouk bez značek, bez „0/0“ a bez nápovědy oblouku; v kompaktní liště jen pozdrav.

### Kompaktní lišta
Horní řádek (odznak vlevo, tlačítka vpravo) je pevný jako na všech záložkách. Lišta (pozdrav,
malý oblouk, x/y) vyjede **pod ním** mezi posunem 8 a 56 bodů. Jemné ranní světlo (`canvasGlow`)
leží za celou horní částí obrazovky; lišta nese stejné světlo posunuté o výšku horního řádku,
takže mezi nimi není schod.

### Smyčky slunce
Paprsky a dýchání slunce běží jen když: Home je vpředu (`useIsFocused`), stránka stojí (ne táhnutí,
ne dojezd) a hrdina je na obrazovce (posun < 460). Jinak plátno, na které nikdo nekouká, krade
snímky rolování.

### Rychlé akce
`/(tabs)/habits?quickAction=addHabit`, `/(tabs)/journal?quickAction=addGratitude` / `addSelfPraise`,
`/(tabs)/goals?quickAction=addGoal` – cílové záložky na ně poslouchají. Bublina nápovědy
`home.quickActions` zanikla (plán 7.10, `technical-guides:Help-Tooltips.md`).

### Pořadí sekcí
Pořadí a viditelnost z `useHomeCustomization()`. Do E11e: „Dnešní návyky“ jdou hned za rychlé akce
(dřív byly spodním řádkem jejich karty), sekce `xpMultiplier` se přeskakuje (násobič je na
odznaku, E9). Staré karty (`renderSection`) dostávají zpět svůj okraj 16 bodů, dokud je E11c–E11e
nenahradí.

### Odškrtnutí
`handleHabitToggle` v `index.tsx`: jeden zápis na návyk naráz (druhé ťuknutí během ukládání se
ignoruje – úložiště čte a pak píše, dva zápisy naráz by mohly dát XP dvakrát). `isBonus` je
`false`, protože Home ukazuje jen naplánované.

---

## ⚠️ NEBEZPEČNÉ ZÓNY

1. **Vlastní definice „dnes“ nebo „hotovo“** → Home a Návyky ukážou jiné x/y.
2. **Oslava bez `focused`** → vibrace z neviditelné záložky.
3. **Reanimated styl podle rolování** → zadrhávání na Androidu (P1–P3).
4. **Průhlednost na kompaktní liště** → skládání mimo obrazovku v každém snímku.
5. **Povzbuzení bez `minHeight`** → poslední návyk posune všechny karty pod hrdinou.
6. **Konstanta XP v obrazovce** → lže při bonusu, násobiči i stropu.
7. **Smazání posluchače `openHomeCustomization`** → tlačítko přizpůsobení přestane fungovat.

---

## Testování

```bash
PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npx jest src/screens/home src/screens/habits src/locales/__tests__/homeCopy
```

- `src/screens/home/__tests__/homeHeroLogic.test.ts` – pozdrav na hranicích, povzbuzení, pořadí
  značek, kdy je den dokončený.
- `src/screens/habits/__tests__/habitListLogic.test.ts` – `scheduleLabel`, `splitHabits`, `doneToday`.
- `src/locales/__tests__/homeCopy.test.ts` – texty Home ve třech jazycích.
- `src/design/__tests__/ratchet.test.ts` – nové soubory Home jen s tokeny.

---

## Co se NESMÍ rozbít

- Stejné „x/y“ na Home i v Návycích.
- Rychlé akce otevírají správné okno v cílové záložce.
- Přizpůsobení Home (pořadí, viditelnost, událost `openHomeCustomization`).
- `?openDebtModal=true` otevře záchranu série (do E12).
- Jiskry XP letí z odškrtnutí k odznaku.

---

## Device scénáře

1. **Ráno / odpoledne / večer / po půlnoci** → správný pozdrav, nebe podle denní doby.
2. **Odškrtni návyky jeden po druhém** → slunce jde dál, číslo roluje, čip XP roste, věta se
   prolne; poslední → záblesk na konci oblouku + jedna vibrace.
3. **Dokonči den v záložce Návyky** a vrať se → Home ukazuje vše hotovo, **bez** vibrace.
4. **Den bez naplánovaného návyku** → věta o volném dni, žádné „0/0“.
5. **Rychle roluj nahoru a dolů** → bez zadrhnutí; lišta vyjede pod horním řádkem bez schodu ve světle.
6. **Ťukni na každou rychlou akci** → správná záložka a správné okno.

---

**GOLDEN RULE**: *„Home jen čte – plán, hotovo i XP říkají pravidla appky. Každé číslo jednou,
každý pohyb přes nativní driver, oslava jen tam, kde se uživatel dívá.“*

---

*Průvodce vznikl při převodu designu, etapa E11 (D-12, 2026-11-25). Zdroj návrhu:
`src/screens/design-lab/HomeConcept.tsx`; mapa dat: `design-migration-datamaps.md`, kap. E11.*
