# Pravidla práce na SelfRise V2

---

## 1. 🚨 OPONUJ DŘÍV, NEŽ ZAČNEŠ STAVĚT

Když Petr navrhne koncept, funkci, architekturu nebo postup, **než napíšeš první řádek kódu** řekni:

1. **Jak se tahle třída problému řeší běžně** — co dělají zavedené produkty a proč
2. **Kde má návrh slabinu** — konkrétně, ne mlhavě („tohle bude problém, protože…")
3. **Jak by vypadala špičková verze** — ne nejlevnější, ale ta, kvůli které si uživatel appku nechá. Co v tomhle místě dělá horních 5 % aplikací jinak.

Pak **rozhoduje Petr**. Když si za svým stojí, postav to jeho — celé, poctivě a bez dalšího přemílání.

> **MLČENÍ = SOUHLAS.** Když neoponuješ, potvrzuješ, že je to dobrý přístup.
>
> **DEADLINE je před prvním řádkem kódu.** Potom už to není oponentura, ale zpochybňování hotové práce.

⚠️ **Tohle pravidlo mluví o AMBICI NÁVRHU. Pravidla 6 a 7 mluví o VELIKOSTI ZÁSAHU do kódu. Jsou to dvě různé osy** — 3 obrazovky místo 25 byly pro uživatele jednodušší a zároveň největší zásah v projektu.

*Proč: 25 kroků tutoriálu a všechna data v AsyncStorage byly hodiny práce, které stačilo neudělat. Obojí bylo postavené bez jediné námitky.*

---

## 2. Příprava podle rozsahu

- **Malá změna v existujícím kódu** → přečti relevantního technického průvodce (pravidlo 3)
- **Nová funkčnost nebo zásah do více oblastí** → navíc `projectplan.md`
- **Nejasná historie** → navíc `projectplan-archive.md`

Nečti všechno pokaždé. `projectplan.md` má ~25 000 tokenů — přečíst ho kvůli překlepu ubere kontext vlastní práci.

---

## 3. Technický průvodce je nadřazený a povinný

1. **Konzultace před akcí**: před prací na existující funkčnosti aktivně vyhledej a prostuduj jejího průvodce. Je to první krok.
2. **Identifikace tématu**: „Oprav chybu v odměnách za návyky" → klíčová slova „odměny" + „návyky" → `technical-guides:Gamification-Core.md` a `technical-guides:Habits.md`.
3. **Soulad**: veškerý kód musí být v souladu s logikou, hodnotami a principy v průvodci. **Průvodce je nadřazený tvým předchozím znalostem o projektu.**
4. **Nejasnosti**: je-li zadání v rozporu s průvodcem nebo průvodce případ nepokrývá → **upozorni a navrhni jeho úpravu**, teprve po odsouhlasení implementuj.

---

## 4. Plán a schválení

U větších úkolů: promysli problém, přečti relevantní kód, napiš plán do `projectplan.md` jako seznam odškrtávacích bodů a **počkej na schválení**.

Rozděl ho na části zvládnutelné na jedno posezení — chybovost roste s velikostí kroku.

*U drobných oprav plán nepiš, rovnou pracuj.*

---

## 5. Průběžné hlášení

Po každém kroku stručně vysvětli, co se změnilo. Hotový bod **hned** odškrtni na `[x]` v `projectplan.md`.

---

## 6. 🚨 CHIRURGICKÉ ZMĚNY — „Nerozbij fungující systémy"

- PŘED každým úkolem: **„Co teď FUNGUJE a NESMÍ se pokazit?"**
- ZMĚŇ pouze minimum potřebné k vyřešení problému
- OVĚŘ po každé změně, že funkční systémy pořád fungují
- Musíš-li sáhnout na funkční kód → **ZEPTEJ SE NEJDŘÍV**
- Přestane-li něco fungovat → **OKAMŽITĚ zastav a diagnostikuj**

---

## 7. Malý zásah, ne malá ambice

Sahej na co nejmíň kódu — to je **řízení rizika**, ne skromnost v návrhu. Kvalita výsledku se řeší v pravidle 1, ne tady.

> **Výjimka:** dohodnuté přepracování. Tam je velký zásah správná odpověď a tohle pravidlo na něj neplatí.

---

## 8. Žádné dočasné záplaty

**NEBUĎ LÍNÝ.** Je-li chyba, najdi **příčinu** a oprav ji pořádně. Chovej se jako senior vývojář.

---

## 9. Ověřuj, než řekneš hotovo

Nikdy nehlas hotovo bez ověření:

- `npx tsc --noEmit` a `npm test` musí projít
- **Testy vyžadují Node ≥ 22.5:**
  ```bash
  PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npm test
  ```
- U nového testu **ověř i ten test**: rozbij schválně to, co má hlídat, a přesvědč se, že spadne
- Neprošlo-li něco, **řekni to i s výstupem**. Nepřikrášluj.

*Proč: prošel test, který svou chybu vůbec nedokázal chytit. Bez té zkoušky by hlídal vzduch.*

---

## 10. Průvodce se aktualizuje ve stejném commitu

**Změníš-li chování oblasti, která má průvodce, aktualizuj ho hned — ne „potom".**

*Proč: podle pravidla 3 je průvodce nadřazený. **Zastaralý průvodce je proto horší než žádný.***

### Když průvodce neexistuje

Jde-li o podstatnou funkčnost, založ ho:

- **Název**: striktně `technical-guides:Téma.md` (např. `technical-guides:Gamification.md`)
- **Nejdřív zkontroluj, jestli už neexistuje** — cílem je centralizace, ne duplicita
- **Kostra jako ostatní průvodci** (vzor: `technical-guides:Startup-Orchestrator.md`):
  1. `🏃 CO TOHLE OBSAHUJE` / `🔧 KDY TOHLE POUŽÍVAT`
  2. Proč tenhle systém existuje
  3. `🚨 KRITICKÁ PRAVIDLA` — každé s párem ✅ CORRECT / ❌ WRONG a odstavcem **Proč**
  4. Popisné sekce
  5. `⚠️ NEBEZPEČNÉ ZÓNY` — jak si to rozbít
  6. Testování
  7. Co se NESMÍ rozbít
  8. Device scénáře
  9. GOLDEN RULE
- **Odkazy do kódu ověř** — průvodce se špatnými odkazy je horší než žádný
- Piš srozumitelně, jako bys to vysvětloval kolegovi

### Propojení s projectplan.md

Do plánu **nekopíruj obsah průvodce**, vlož jen odkaz:

`[Popis úkolu] - Technická pravidla a logika pro [Téma]: @[název-souboru]`

Příklad: `Implementace Měsíčních Výzev - Technická pravidla a logika pro Gamifikaci: @technical-guides:Gamification.md`

---

## 11. projectplan.md — jediný zdroj pravdy

- **Nemazat, nepřepisovat celé bez výslovného svolení.** Jen doplňovat, aktualizovat sekce a odškrtávat.
- **Limit 25 000 tokenů.** Přesáhne-li 22 000, **archivuj dokončené etapy dřív, než přidáš další.**
- Detaily patří do archivu, do plánu jen stručné shrnutí a odkaz.
- Archivy: `projectplan-archive.md`, `technical-guides.md`, `implementation-history.md`

---

## 12. Commit na výslovné slovo

Commit a push spouští **jednoznačný pokyn** — „commitni", „ulož to", „pushni".

**Pochvala („dobrá práce", „super", „výborně") commit NESPOUŠTÍ.** Může znamenat „hotovo, ulož" i „dobře, pokračuj" a ten rozdíl nelze spolehlivě poznat. Navíc `git add .` sebere i nesouvisející rozdělanou práci.

Postup: `git add .` → commit s popisným názvem → `git push` → potvrdit úspěch.

---

## 13. Agenti

- **Bez ptaní:** čtecí hledání napříč kódem a **nezávislá revize vlastní hotové práce**
- **Po dohodě:** cokoliv, co mění soubory nebo běží dlouho na pozadí

Nespoléhej na natvrdo jmenované seznamy agentů — zastarávají. Používej, co prostředí zrovna nabízí.

*Proč: kontrola vlastní práce je nejslabší forma kontroly.*

---

## 14. Komunikace

Česky. Každou odpověď zakonči sekcí **„DOPAD NA UŽIVATELE"**:

- **Co se změnilo** — jednou větou
- **Co jsi viděl předtím** — konkrétně, co v aplikaci nesedělo
- **Co uvidíš teď** — konkrétně, jak se to projeví

**Nedotkne-li se změna uživatele, napiš to rovnou.** Úklid kódu, dokumentace nebo testy nemají žádný viditelný dopad — vymýšlet jim význam je horší než přiznat, že žádný nemají.

Žádné cesty k souborům, názvy funkcí ani technické zkratky v této sekci. Zbytek odpovědi nad ní může být technický, jak je potřeba.
