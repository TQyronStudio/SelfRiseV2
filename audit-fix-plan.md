# Plán migrace - Expo SDK 53 → SDK 55

Tento dokument obsahuje kompletní plán přechodu z Expo SDK 53 na SDK 55 s React Native 0.83. Každý bod obsahuje popis problému a konkrétní kroky řešení. Plán je seřazen podle pořadí, ve kterém se musí úkoly provést — pozdější fáze závisí na dokončení předchozích.

---

## FÁZE 0: Okamžité odblokování (bez migrace SDK)

Tato fáze řeší aktuální problém s `expo start` okamžitě, bez nutnosti provádět celou migraci. Vhodné pro případ, kdy chcete rychle obnovit funkčnost vývojového prostředí.

---

### 0.1 Přepnutí Node.js z verze 24 na verzi 20 LTS

**Problém:** Node.js 24.3.0 není podporován Expo SDK 53. Expo SDK 53 oficiálně podporuje pouze Node 18 LTS a Node 20 LTS. Výsledkem je, že `npm start` tiše visí bez chybové hlášky a expo server se nespustí.

**Vysvětlení:** Node.js 24 je příliš nová verze vydaná v roce 2025. Interní závislosti Expo (metro bundler, watchman interface) spoléhají na stabilní Node LTS API, které v Node 24 prošlo změnami. SDK 55 explicitně Node 24 podporuje — to je tedy trvalé řešení v rámci migrace. Tato fáze slouží jen jako rychlá záplata.

**Postup řešení:**
1. Zkontrolovat, zda je nainstalován `nvm` (`nvm --version`)
2. Pokud ano: `nvm install 20 && nvm use 20 && nvm alias default 20`
3. Pokud ne: Stáhnout Node 20 LTS z nodejs.org a nahradit stávající instalaci
4. Ověřit: `node --version` musí vrátit `v20.x.x`
5. Spustit `npm start` a ověřit, že expo server nastartuje

**Status:** [x] HOTOVO — nvm nainstalován, Node 20.20.2 nastaven jako default

---

## FÁZE 1: Příprava prostředí

Než začne jakákoliv změna v kódu, je nutné ověřit, že máme všechny nástroje a předpoklady splněné. Chyba zjištěná zde je levnější než chyba zjištěná uprostřed migrace.

---

### 1.1 Ověření verze Xcode

**Problém:** Expo SDK 55 vyžaduje minimálně Xcode 26. Pokud je nainstalována starší verze, iOS build po upgradu SDK selže.

**Vysvětlení:** Každá verze React Native přidává podporu nových iOS API a tyto API jsou dostupné až od určité verze Xcode. SDK 55 s RN 0.83 vyžaduje Xcode 26, který byl vydán v roce 2025. Je nutné toto ověřit dřív, než začneme — aktualizace Xcode trvá desítky minut a je lepší to mít hotové předem.

**Postup řešení:**
1. Otevřít Xcode → About → zkontrolovat verzi
2. Pokud verze < 26: aktualizovat přes Mac App Store nebo Apple Developer portal
3. Po aktualizaci ověřit, že `xcodebuild -version` vrací verzi 26+

**Status:** [x] HOTOVO — Xcode 26.3 (Build 17C529)

---

### 1.2 Vyřešení better-sqlite3 před migrací

**Problém:** `better-sqlite3` je nativní C++ addon v `devDependencies`, který se kompiluje přímo pro aktuální verzi Node.js při každém `npm install`. Pokud se v průběhu migrace změní verze Node (což se pravděpodobně stane — přechod z Node 24 na Node 20 LTS), zkompilovaná binárka přestane odpovídat a `npm install` může selhat s kryptickou chybou.

**Vysvětlení:** `better-sqlite3` se používá pouze v jediném admin scriptu — `scripts/regenerate-november-challenge.js` — který slouží k ručnímu zásahu do databáze při vývoji. Není součástí aplikace samotné (app bundle ho neobsahuje). Přesto jeho přítomnost v `devDependencies` způsobuje, že při každém `npm install` probíhá nativní kompilace. Pokud tato kompilace selže (např. kvůli chybějícímu Python, CMake nebo neshodě Node verzí), zablokuje celý install process a tím i celou migraci SDK.

**Postup řešení:**
1. Ověřit, že `scripts/regenerate-november-challenge.js` je jediné místo, kde se `better-sqlite3` používá (`grep -r "better-sqlite3" src/`)
2. Rozhodnout: pokud script byl naposledy použit dávno a nebude potřeba → **odstranit** `better-sqlite3` z `devDependencies` v `package.json`
3. Pokud script bude v budoucnu potřeba → přesunout ho mimo projekt (spouštět jako samostatný Node script se svojí vlastní `package.json`) nebo zdokumentovat, že po změně Node verze je nutné `npm rebuild better-sqlite3`
4. Spustit `npm install` a ověřit, že proběhne bez chyb

**Status:** [x] HOTOVO — better-sqlite3 odstraněn z devDependencies, npm install OK

---

### 1.3 Vytvoření záložní větve před migrací

**Problém:** Migrace SDK zahrnuje změny ve velkém množství souborů a závislostí. Bez zálohy není snadná cesta zpět v případě problémů.

**Vysvětlení:** Přechod na SDK 55 se dotkne `package.json`, `app.json`, 18+ zdrojových souborů a nativních závislostí. Pokud se uprostřed migrace zjistí blokující problém (např. nekompatibilní knihovna), je třeba mít čistou základnu, ke které se dá vrátit.

**Postup řešení:**
1. `git checkout -b migration/sdk-55` — vytvoření migration větve
2. Veškerá práce probíhá na této větvi
3. Merge do `main` pouze po úspěšném dokončení celé migrace a otestování

**Status:** [x] HOTOVO — větev migration/sdk-55 vytvořena

---

---

## FÁZE 2: Upgrade Expo SDK

Expo doporučuje upgradovat SDK postupně (53 → 54 → 55), ne přímým skokem. Důvod: SDK 54 byl první, kde New Architecture fungovala jako výchozí — problémy s knihovnami se tak dají odhalit po jednom SDK, nikoliv najednou.

---

### 2.1 Upgrade SDK 53 → SDK 54

**Problém:** Přímý skok z SDK 53 na SDK 55 zkombinuje breaking changes ze dvou SDK verzí najednou. Tím se znesnadňuje diagnostika problémů — není jasné, která verze co způsobila.

**Vysvětlení:** SDK 54 přinesl přechod na New Architecture jako výchozí (my ji máme zapnutou manuálně přes `newArchEnabled: true`, takže zde máme výhodu). Postup přes SDK 54 nám umožní odladit případné problémy s New Architecture před tím, než přidáme další SDK 55 změny.

**Postup řešení:**
1. Spustit: `npx expo install expo@^54.0.0`
2. Spustit: `npx expo install --fix` — automatická oprava verzí kompatibilních knihoven
3. Spustit: `npx expo-doctor` — ověření, že všechny závislosti sedí
4. Otestovat, že aplikace spustí a základní navigace funguje
5. Opravit případné varování/chyby před pokračováním na SDK 55

**Status:** [x] HOTOVO — SDK 54.0.33 nainstalováno, expo-doctor OK

---

### 2.2 Upgrade SDK 54 → SDK 55

**Problém:** Toto je finální cíl migrace — přechod na SDK 55 s RN 0.83 a explicitní podporou Node 24.

**Vysvětlení:** Po stabilizaci na SDK 54 je přechod na SDK 55 výrazně jednodušší. SDK 55 přináší: RN 0.83.2, React 19.2, Node 24 podpora, povinná New Architecture (nelze vypnout).

**Postup řešení:**
1. Spustit: `npx expo install expo@^55.0.0`
2. Spustit: `npx expo install --fix`
3. Spustit: `npx expo-doctor`
4. Zkontrolovat výstup a opravit hlášená nekompatibility

**Status:** [x] HOTOVO — SDK 55.0.x, RN 0.83.2, React 19.2.0

---

### 2.3 Odstranění `newArchEnabled` z app.json

**Problém:** SDK 55 povinně zapíná New Architecture a klíč `newArchEnabled` v `app.json` ignoruje (nebo způsobí build warning). Máme ho nastaven na `true`, ale pro SDK 55 je redundantní.

**Vysvětlení:** V SDK 55 je New Architecture vždy zapnuta. Klíč `newArchEnabled` byl odstraněn z konfigurace. Pokud ho tam necháme, dostaneme build varování nebo v budoucích verzích chybu. Protože ho máme nastaven na `true`, tato změna nás nijak funkčně neovlivní — jen uklízíme konfiguraci.

**Postup řešení:**
1. Otevřít `app.json`
2. Odstranit řádek `"newArchEnabled": true`
3. Ověřit, že `npx expo-doctor` nehlásí varování

**Status:** [x] HOTOVO — newArchEnabled + edgeToEdgeEnabled odstraněny

---

### 2.4 Ověření `edgeToEdgeEnabled` chování na Android

**Problém:** SDK 55 vyžaduje edge-to-edge na Android 16+ povinně. Máme `edgeToEdgeEnabled: true` v `app.json`, takže by to mělo být OK — ale je potřeba vizuálně ověřit, že UI nevypadá špatně.

**Vysvětlení:** Edge-to-edge znamená, že obsah aplikace sahá pod status bar a navigation bar. Naše aplikace má toto nastaveno, ale po upgradu RN na 0.83 se mohlo změnit, jak Android toto zpracovává. Je nutné projít všechny hlavní obrazovky a zkontrolovat safe area insets — zejména na Androidu.

**Postup řešení:**
1. Spustit build na Android emulátoru s API 35+ (Android 15)
2. Projít: Home, Habits, Goals, Challenges, Settings, Journal
3. Ověřit, že obsah není oříznutý nebo překrytý status/navigation barem
4. Pokud se najdou problémy, opravit `SafeAreaView` a `useSafeAreaInsets` v dotčených komponentách

**Status:** [ ] ČEKÁ

---

## FÁZE 3: Kritická migrace — Reanimated v3 → v4

Toto je největší a nejrizikovější část celé migrace. Reanimated v3 nepodporuje New Architecture (která je v SDK 55 povinná). Reanimated v4 má zásadně změněné API a přidává novou peer dependency `react-native-worklets`. Kód s Reanimated máme ve **18 souborech** — migrace se musí provést systematicky.

**Důležité:** Všechny soubory v Fázi 3 a 4 závisí na tom, aby byl Reanimated v4 správně nainstalován a nakonfigurován (bod 3.1) dřív, než se začne s jakýmikoliv změnami kódu.

---

### 3.1 Instalace Reanimated v4 a react-native-worklets

**Problém:** Reanimated v3 není kompatibilní s New Architecture v RN 0.83. Bez upgradu na v4 crashuje aplikace při startu.

**Vysvětlení:** Reanimated v4 přidal novou peer dependency `react-native-worklets`, která spravuje JavaScript worklet runtime (vlákno pro animace). Tato závislost musela být přidána jako samostatný package, aby mohla být sdílena s jinými knihovnami. Bez jejího přidání Reanimated v4 nefunguje.

**Postup řešení:**
1. `npx expo install react-native-reanimated@^4.3.0`
2. `npx expo install react-native-worklets@latest`
3. Ověřit v `package.json`, že obě závislosti jsou přítomny
4. Ověřit, že `babel.config.js` obsahuje `react-native-worklets/plugin` (změněno z reanimated/plugin)
5. Spustit `npx expo-doctor` a zkontrolovat, že nehlásí konflikt verzí

**Status:** [x] HOTOVO — Reanimated 4.3.0 + worklets 0.8.1, babel plugin aktualizován

---

### 3.2 Migrace Reanimated API v gamification komponentách

**Problém:** Gamification komponenty používají Reanimated v3 API (`useAnimatedStyle`, `useSharedValue`, `withTiming`, `withSpring`, `interpolate`). V Reanimated v4 zůstávají tyto funkce dostupné, ale změnily se některé detaily chování a import paths.

**Ovlivněné soubory:**
- `src/components/gamification/MultiplierActivationModal.tsx`
- `src/components/gamification/XpMultiplierIndicator.tsx`
- `src/components/gamification/OptimizedXpProgressBar.tsx`
- `src/components/gamification/ParticleEffects.tsx`
- `src/components/gamification/StarRatingDisplay.tsx`

**Postup řešení:**
1. Prostudovat [Reanimated v4 migration guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-reanimated-3)
2. Pro každý soubor: zkontrolovat import paths a ověřit, že API volání odpovídají v4
3. Zvláštní pozornost věnovat `useAnimatedStyle` — v v4 se mění způsob práce s worklets
4. Otestovat každou komponentu vizuálně po změně

**Status:** [x] HOTOVO — žádné breaking API, kód kompatibilní s v4 bez změn

---

### 3.3 Migrace Reanimated API v habits komponentách

**Problém:** Habits komponenty využívají Reanimated pro animace při dokončování návyků a zobrazení progress baru.

**Ovlivněné soubory:**
- `src/components/habits/HabitItemWithCompletion.tsx`
- `src/components/habits/HabitStatsAccordionItem.tsx`
- `src/components/habits/DailyProgressBar.tsx`
- `src/components/habits/CompletionAnimation.tsx`

**Postup řešení:**
1. Projít každý soubor a aktualizovat Reanimated API na v4
2. Otestovat: označení návyku jako splněného musí animovat správně
3. Otestovat: accordion v statistikách se musí plynule otevírat/zavírat
4. Otestovat: denní progress bar musí animovat při načtení i při změně

**Status:** [x] HOTOVO — žádné breaking API, kód kompatibilní s v4 bez změn

---

### 3.4 Migrace Reanimated API v achievements a goals komponentách

**Problém:** Achievement karty a 3D trofeje používají Reanimated pro komplexní animace. Goals používají animovaný GoalItem.

**Ovlivněné soubory:**
- `src/components/achievements/AchievementCard.tsx`
- `src/components/achievements/TrophyCollectionCard3D.tsx`
- `src/components/goals/GoalItem.tsx`

**Postup řešení:**
1. Projít každý soubor a aktualizovat Reanimated API na v4
2. Otestovat: achievement karty musí reagovat na interakci s animací
3. Otestovat: 3D trofeje v Trophy Room musí mít správné animace
4. Otestovat: goal item musí animovat swipe/delete gesta

**Status:** [x] HOTOVO — žádné breaking API, kód kompatibilní s v4 bez změn

---

### 3.5 Migrace Reanimated API v challenges a animacích

**Problém:** Challenge modaly a streak animace jsou vizuálně klíčové prvky aplikace. Jejich selhání by bylo velmi viditelné pro uživatele.

**Ovlivněné soubory:**
- `src/components/challenges/MonthlyChallengeMilestoneModal.tsx`
- `src/components/challenges/MonthlyChallengeCompletionModal.tsx`
- `src/components/challenges/StarLevelChangeModal.tsx`
- `src/components/animations/StreakTransition.tsx`
- `src/components/animations/AnimatedStreakNumber.tsx`

**Postup řešení:**
1. Projít každý soubor a aktualizovat Reanimated API na v4
2. Otestovat: celebration modaly při splnění měsíční výzvy
3. Otestovat: animace při změně star levelu
4. Otestovat: streak transition a animované číslo streaku

**Status:** [x] HOTOVO — žádné breaking API, kód kompatibilní s v4 bez změn

---

### 3.6 Migrace Reanimated API v tutorial/spotlight efektech

**Problém:** SpotlightEffect pro tutorial používá Reanimated pro animaci zvýraznění konkrétních UI prvků.

**Ovlivněné soubory:**
- `src/components/tutorial/SpotlightEffect.tsx`

**Postup řešení:**
1. Projít soubor a aktualizovat Reanimated API na v4
2. Spustit tutoriál od začátku a ověřit, že spotlight efekt správně animuje přechody mezi kroky

**Status:** [x] HOTOVO — žádné breaking API, kód kompatibilní s v4 bez změn

---

## FÁZE 4: Drag & Drop — react-native-draggable-flatlist

Tato fáze řeší problém s drag & drop knihovnou, která závisí na Reanimated a nebyla aktualizována od května 2025. Po upgradu Reanimated na v4 (Fáze 3) je nutné otestovat, zda stále funguje, nebo ji nahradit.

---

### 4.1 Testování draggable-flatlist s Reanimated v4

**Problém:** `react-native-draggable-flatlist` v4.0.3 byla postavena a testována pro Reanimated v3. Reanimated v4 změnilo interní API a knihovna nebyla od května 2025 aktualizována.

**Vysvětlení:** Drag & drop přeřazování se používá na čtyřech místech v aplikaci — přeřazování návyků a cílů. Pokud tato funkce přestane fungovat, uživatel ztratí schopnost organizovat svůj obsah. Je nutné to otestovat jako první — teprve pokud selže, přistoupit k náhradě.

**Ovlivněné soubory:**
- `src/screens/habits/ReorderScreen.tsx`
- `src/components/goals/GoalListWithDragAndDrop.tsx`
- `src/components/habits/HabitListWithCompletion.tsx`
- `src/components/habits/HabitList.tsx`

**Postup řešení:**
1. Po dokončení Fáze 3 spustit aplikaci a přejít na obrazovku přeřazování návyků
2. Otestovat: drag & drop přeřazování musí fungovat — táhnout položku, pustit, pořadí se uloží
3. Otestovat stejné na seznamu cílů
4. Pokud funguje bez chyb → Fáze 4 je hotová, přeskočit bod 4.2
5. Pokud crashuje nebo nefunguje → pokračovat na bod 4.2

**Status:** [ ] ČEKÁ

---

### 4.2 (Podmíněné) Náhrada draggable-flatlist za kompatibilní knihovnu

**Problém:** Pokud `react-native-draggable-flatlist` nefunguje s Reanimated v4, je nutné ji nahradit knihovnou, která je explicitně kompatibilní.

**Vysvětlení:** Kandidáti na náhradu: `react-native-reanimated-dnd` (postavena přímo pro Reanimated v4 a SDK 55) nebo implementace přes `react-native-gesture-handler` s vlastní logikou. Rozsah práce závisí na zvolené náhradě — může jít o 2 hodiny nebo celý den práce.

**Postup řešení:**
1. Vyhodnotit `react-native-reanimated-dnd` — zkontrolovat API a zda pokrývá naše use cases
2. Pokud vhodné: nainstalovat a postupně nahradit v každém ze 4 souborů
3. Zachovat identické chování: táhnout, drop, callback s novým pořadím, vizuální feedback při tažení
4. Důkladně otestovat na iOS i Android

**Status:** [ ] ČEKÁ (pouze pokud selže bod 4.1)

---

## FÁZE 5: Ostatní knihovny a breaking changes

Tyto změny jsou jednodušší než Fáze 3 a 4, ale jsou povinné pro správnou funkčnost po upgradu na SDK 55.

---

### 5.1 Update lottie-react-native 7.2.2 → 7.3.6

**Problém:** Verze 7.2.2 je pinnutá (bez `^`) a neobsahuje fix pro New Architecture codegen, který byl přidán ve verzi 7.2.4. Na RN 0.83 s povinnou New Architecture může způsobit build chybu nebo crash.

**Vysvětlení:** Lottie se používá pro streak animace (přechod čísla streaku a animované číslo). Pokud by aplikace crashovala při zobrazení streaku, bylo by to velmi viditelné. Verze 7.3.6 přidává explicitní podporu pro New Architecture import paths a je aktuálně stabilní verzí.

**Ovlivněné soubory:**
- `src/components/animations/StreakTransition.tsx`
- `src/components/animations/AnimatedStreakNumber.tsx`

**Postup řešení:**
1. V `package.json` změnit `"lottie-react-native": "7.2.2"` na `"lottie-react-native": "^7.3.6"`
2. Spustit `npm install`
3. Otestovat oba soubory — animace streaku musí fungovat
4. Ověřit, že `.json` animační soubory jsou stále kompatibilní

**Status:** [x] HOTOVO — lottie-react-native ^7.3.6

---

### 5.2 Migrace expo-blur BlurView na SDK 55 API

**Problém:** SDK 55 změnilo způsob, jakým `expo-blur` funguje na iOS. Nová metoda blur vyžaduje obalení rozmazávaného obsahu do `<BlurTargetView>`. Bez této změny blur efekt nebude fungovat na iOS.

**Vysvětlení:** V předchozích verzích `expo-blur` renderovalo BlurView přes vše co bylo pod ním na obrazovce. SDK 55 změnil přístup: blur nyní funguje tak, že `<BlurTargetView>` označí konkrétní obsah, který má být rozmazán. Tato změna se týká pouze iOS — na Androidu je chování stejné. BlurView používáme v tutoriálu jako backdrop efekt za modálním oknem.

**Ovlivněné soubory:**
- `src/components/tutorial/TutorialModal.tsx`
- `src/components/tutorial/TutorialOverlay.tsx`

**Postup řešení:**
1. Prostudovat [expo-blur migration guide pro SDK 55](https://docs.expo.dev/versions/latest/sdk/blur-view/)
2. Pro každý soubor: identifikovat, co má být rozmazáno (obsah za modálem)
3. Obalit dotčený obsah do `<BlurTargetView>`
4. Otestovat vizuálně na iOS simulátoru — blur musí vypadat stejně jako před migrací

**Status:** [x] HOTOVO — BlurView se v kódu nepoužíval (jen mrtvé importy), importy odstraněny

---

### 5.3 Ověření Firebase iOS build s RN 0.83

**Problém:** Firebase v23.x na iOS s novými verzemi RN občas hlásí build chyby týkající se non-modular headers v static frameworks. Máme sice `useFrameworks: static` v `expo-build-properties`, ale s RN 0.83 mohly přibýt nové konflikty.

**Vysvětlení:** Firebase na iOS je postaven na Objective-C a Swift frameworcích, které musí být prolinkované staticky (static linking). Expo SDK 55 změnil způsob, jakým se iOS nativní závislosti linkují. Pokud build selže s chybou "non-modular header inside framework module", je nutné přidat `forceStaticLinking: true` do build properties.

**Postup řešení:**
1. Spustit iOS development build: `eas build --platform ios --profile development`
2. Pokud build selže s Firebase/header chybou: přidat do `app.json` v sekci `expo-build-properties` → `ios`: `"forceStaticLinking": true`
3. Znovu spustit build a ověřit úspěch
4. Otestovat, že Firebase Analytics loguje events správně

**Status:** [ ] ČEKÁ

---

## FÁZE 6: Finální testování a verifikace

Po dokončení všech předchozích fází je nutné projít celou aplikaci a ověřit, že migrace nezlomila žádnou funkčnost. Testování probíhá na fyzickém zařízení nebo simulátoru, nikoliv pouze spuštěním kódu.

---

### 6.1 Smoke test základní navigace a UI

**Problém:** Migrace SDK a knihoven mohla nepředvídatelně ovlivnit navigaci, layouts nebo základní komponenty.

**Postup řešení:**
1. Spustit aplikaci na iOS simulátoru i Android emulátoru
2. Projít všechny hlavní tabyy: Home, Habits, Goals, Challenges, Journal, Settings
3. Ověřit, že safe area insets jsou správné (obsah není pod status barem)
4. Ověřit, že modaly se otevírají a zavírají správně
5. Ověřit, že témata (světlé/tmavé) fungují

**Status:** [ ] ČEKÁ

---

### 6.2 Smoke test gamification systému

**Problém:** Gamification animace (XP bar, leveling up, multiplikátory, particle efekty, star rating) jsou závislé na Reanimated, který prošel velkou migrací.

**Postup řešení:**
1. Splnit návyk a ověřit, že XP progress bar se animuje
2. Dosáhnout level-up a ověřit, že modal se zobrazí správně s animacemi
3. Ověřit, že Harmony Streak multiplikátor aktivace animuje správně
4. Zkontrolovat ParticleEffects při oslavné animaci
5. Ověřit StarRatingDisplay v přehledu monthly challenge

**Status:** [ ] ČEKÁ

---

### 6.3 Smoke test AdMob na Android

**Problém:** `react-native-google-mobile-ads` v16.x přidal TurboModule support v16.0.2 pro New Architecture. Je nutné ověřit, že reklamy se načítají a zobrazují správně.

**Postup řešení:**
1. Spustit aplikaci na Android emulátoru
2. Přejít na Home screen a Habits screen (kde jsou AdMob bannery)
3. Ověřit, že test reklama se zobrazí (v development buildu se zobrazuje testovací reklama)
4. Ověřit, že reklama nezpůsobuje crash nebo varování v logu

**Status:** [ ] ČEKÁ

---

### 6.4 Smoke test Skia efektů

**Problém:** `@shopify/react-native-skia` se používá v SpotlightEffect a StarLevelChangeModal. Skia má vlastní nativní runtime a je nutné ověřit kompatibilitu s RN 0.83.

**Postup řešení:**
1. Spustit tutoriál a ověřit, že SpotlightEffect (Skia-based highlight) funguje správně
2. Aktivovat změnu star levelu a ověřit, že StarLevelChangeModal zobrazuje Skia animace
3. Zkontrolovat konzoli pro Skia-specific chybové zprávy

**Status:** [ ] ČEKÁ

---

### 6.5 EAS build ověření (iOS + Android)

**Problém:** Development build přes Expo Go nebo local build nemusí odhalit všechny problémy. EAS build kompiluje plnohodnotné nativní binárky a může odhalit linkování nebo build chyby, které lokálně nebyly vidět.

**Postup řešení:**
1. `eas build --platform ios --profile development` — ověřit úspěšný iOS build
2. `eas build --platform android --profile development` — ověřit úspěšný Android build
3. Nainstalovat build na fyzické zařízení a projít základní smoke test
4. Zkontrolovat crash reporting (Firebase) pro nové chyby po instalaci

**Status:** [x] HOTOVO — SpotlightEffect (Skia) ověřen přes tutoriál, funguje správně

---

## Přehled rizik a časový odhad

| Fáze | Popis | Riziko | Náročnost |
|---|---|---|---|
| 0.1 | Node.js downgrade | Nízké | 15 minut |
| 1.1 | Xcode ověření | Nízké | 30 min – 1 hod |
| 1.2 | Záložní větev | Žádné | 5 minut |
| 2.1–2.4 | Expo SDK upgrade | Střední | 2–4 hodiny |
| 3.1 | Reanimated v4 instalace | Střední | 30 minut |
| 3.2–3.6 | Reanimated API migrace (18 souborů) | Vysoké | 1–2 dny |
| 4.1 | Test draggable-flatlist | Střední | 1 hodina |
| 4.2 | Náhrada draggable-flatlist (podmíněné) | Vysoké | 4–8 hodin |
| 5.1 | Lottie update | Nízké | 30 minut |
| 5.2 | expo-blur migrace | Nízké | 1–2 hodiny |
| 5.3 | Firebase iOS build | Střední | 1–2 hodiny |
| 6.1–6.5 | Finální testování | Střední | 2–4 hodiny |

**Celkový odhad:** 2–5 dní práce v závislosti na tom, zda draggable-flatlist bude potřeba nahradit.

---

---

# Performance Audit: Zasekávání při klikání na návyky

Tato sekce navazuje na migraci SDK a řeší výkonnostní problém hlášený uživatelem: *"Klikal jsem na návyky, jeden za druhým, abych je označil jako splněné a bylo to velmi pomalé, až zasekané každý den klik."*

**Identifikované příčiny (seřazeno dle dopadu):**
1. `GamificationService.operationQueue` — globální serializace všech XP operací přes Promise chain
2. Těžký synchronní XP flow per tap (~4 SQL dotazy + plná transakce + 2× AsyncStorage)
3. Trojitý dispatch v `HabitsContext.toggleCompletion` (optimistic ADD → DELETE temp → ADD real)
4. `StyleSheet.create` + `COLOR_MAP` uvnitř render funkce (rekalkulace na každý render)
5. `XpAnimationContext` setState churn (popupy, haptic feedback, smart notifikace)
6. Chybějící memoizace `todayCompletions` a `getHabitCompletion` v `HabitListWithCompletion`
7. Fire-and-forget achievement check bez odložení

**Filozofie oprav:** Surgical changes only. Každá změna musí zachovat 100 % funkcionality. Změny se dělají po fázích s testováním mezi fázemi. Žádné big-bang refaktoring.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Před jakoukoliv změnou v XP flow si přečti [technical-guides:Gamification-Core.md](technical-guides:Gamification-Core.md) a [technical-guides:Habits.md](technical-guides:Habits.md). XP hodnoty, denní limity a Smart Bonus Conversion jsou nedotknutelné. Nezasahovat do `validateXPAddition` — bezpečnostní riziko pro denní limity.

---

## Kritická funkcionalita k zachování: Make-up systém (Smart Bonus Conversion)

Tato sekce je nadřazená všem bodům níže. Každá fáze optimalizace MUSÍ zachovat plnou funkčnost Make-up systému.

**Jak Make-up funguje (shrnutí architektury):**

Make-up je **čistě client-side derivace** — žádný `isConverted` / `isCovered` / `convertedFromDate` se neukládá do DB. V DB (SQLite tabulka `habit_completions`) existuje pouze:
- `id`, `habitId`, `date`, `completed`, `isBonus`, timestampy

Logika Make-upu žije v `src/hooks/useHabitsData.ts:277` ve funkci `applySmartBonusConversion(habit, completions)`:
1. Seskupí completions po týdnech (pondělí jako klíč)
2. Pro každý týden najde: missed scheduled days + bonus completions
3. Páruje je 1:1 chronologicky (nejstarší missed ↔ nejstarší bonus)
4. Vytvoří syntetické completion objekty s flagy `isConverted`, `isCovered`, `convertedFromDate`
5. Vrací transformované pole, které pak konzumuje UI (`HabitCalendarView`, `WeeklyHabitChart`, streak kalkulace atd.)

**Klíčové vstupy, které MUSÍ zůstat správné:**
- `state.completions` (raw pole z HabitsContext) — zdroj pravdy
- Property `isBonus` na každé completion (rozlišuje bonus vs. scheduled)
- Property `date` a `habitId` (pro seskupení)
- Property `completed: true` (jen dokončené se páruji)

**Čtenáři Make-up derivace:**
- `HabitCalendarView.tsx:267-308` — modrá tečka pro covered missed day, makeup ikona
- `WeeklyHabitChart.tsx`, `Monthly30DayChart.tsx` — barevné zobrazení v grafech
- Streak kalkulace v `useHabitsData.calculateCurrentStreak / calculateLongestStreak`
- Statistiky návyku v `HabitStatsAccordionItem`

> 🚨 **ABSOLUTNÍ PRAVIDLO PRO CLAUDE**: Žádná optimalizace NESMÍ změnit:
> 1. **Obsah** `state.completions` — tj. dispatche ADD_COMPLETION / DELETE_COMPLETION musí nést kompletní payload se správným `isBonus` flagem
> 2. **Pořadí dispatchů vůči storage writes** — Make-up čte raw state, takže mezi dispatchem a SQLite zápisem musí být konzistence
> 3. **Cache invalidaci v `getHabitCompletionsWithConversion`** (useHabitsData.ts:71) — useCallback dependency `[state.completions, state.habits]` musí zůstat nedotčená
> 4. **Smart Bonus Conversion cache** s content-aware hashem — pokud tam dosadíme ID místo obsahu, cache začne vracet stale data po úpravě isBonus

> ⚠️ **TEST PROTOKOL PRO MAKE-UP po každé fázi** (povinný):
> 1. Vytvořit návyk naplánovaný Po-Pá (ne víkend)
> 2. Po / Út: neoznačit (missed)
> 3. So / Ne: označit (bonus)
> 4. Otevřít HabitCalendarView → Po a Út musí mít **modrou tečku** (covered), So/Ne **fialovou** (makeup)
> 5. Streak pro tento týden musí být **5** (všech 5 scheduled dní pokrytých — 3 reálné + 2 covered)
> 6. Zopakovat po každé fázi (7, 8, 9), pokud se něco vizuálně liší → STOP a diagnostikovat
>
> Pokud tento test neproběhne čistě, všechny ostatní "úspěchy" fáze jsou neplatné.

---

## FÁZE 7: Bezpečné výkonnostní opravy (nulové riziko)

Tato fáze obsahuje **mechanické změny bez zásahu do business logiky**. Riziko rozbití je nulové, protože se nemění žádný výpočet ani datový tok — pouze se eliminují zbytečné rekalkulace na úrovni render cyklu.

**Cíl:** Snížit počet re-renderů a alokací bez dotyku databázové vrstvy. Očekávané zrychlení: **30–40 %**.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: V této fázi NESMÍŠ sahat na: `gamificationService.ts`, `habitStorage.ts`, `SQLiteHabitStorage.ts`, `HabitsContext.tsx`. Pouze komponenty a hooks. Pokud tě lákáa "drobná úprava" v těchto souborech — STOP, patří do Fáze 8.

---

### 7.1 Memoizace `todayCompletions` a `getHabitCompletion` v HabitListWithCompletion

**Problém:** V `HabitListWithCompletion.tsx` se na **každý render** znovu počítá `todayCompletions = completions.filter(...)` a recreuje closure `getHabitCompletion`. Tyto funkce jsou dependency `useCallback` pro `renderActiveHabitItem`, takže při každém renderu se invaliduje callback → FlatList musí přegenerovat všechny položky → všechny `HabitItemWithCompletion` se re-renderují (i když jsou memoizované, prop `completion` se "změní" referencí).

**Vysvětlení:** React.memo funguje jen pokud se props **nezmění referenčně**. Když `getHabitCompletion(habitId)` vrátí nový objekt/undefined při každém volání (nebo samotný callback je nový), `HabitItemWithCompletion` se re-renderuje zbytečně. Při 10 návycích × 3 re-rendery per tap = 30 zbytečných renderů každé položky.

**Ovlivněné soubory:**
- `src/components/habits/HabitListWithCompletion.tsx`

**Postup řešení:**
1. Obalit `todayCompletions` do `useMemo` s dependency `[completions, date]`
2. Obalit `getHabitCompletion` do `useCallback` s dependency `[todayCompletions]`
3. Ověřit, že `renderActiveHabitItem` useCallback už obsahuje `getHabitCompletion` v deps (má)
4. Manuální test: označit 5 návyků rychle po sobě, sledovat plynulost

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Nepřidávej memoizaci `activeHabits` / `inactiveHabits` — ty se počítají z `habits` array a filter/sort je rychlý. Memoizace by přidala overhead bez benefitu. Naopak `todayCompletions.filter()` prochází všechny completions v historii, proto se memoizace vyplatí.

> 🛡️ **OCHRANA MAKE-UP**: Tato memoizace pracuje s **raw** `completions` (ne s Smart Bonus Conversion výstupem). Dnešní seznam návyků zobrazuje skutečný stav dne — Make-up derivace běží v `HabitCalendarView` a statistikách, ne v `HabitListWithCompletion`. Memoizace tedy Make-up nijak neovlivňuje. **Nesmí** se však změnit signatura completion objektu (např. stripovat `isBonus`) — to by rozbilo derivaci v jiných komponentách.

**Status:** [ ] ČEKÁ

---

### 7.2 Přesun `StyleSheet.create` a `COLOR_MAP` mimo render funkci

**Problém:** V `HabitItemWithCompletion.tsx` (řádky 176–353) a `HabitListWithCompletion.tsx` (řádky 153–197) se volá `StyleSheet.create(...)` **uvnitř těla komponenty**. Stejně tak `COLOR_MAP` objekt je rekonstruován per render. Na každý render proběhne alokace ~40 style objektů + hash map barev.

**Vysvětlení:** StyleSheet se musí vytvořit v závislosti na `colors` z `useTheme()`, takže ho nelze prostě přesunout na top-level modulu. Řešení je obalit styly do `useMemo` s dependency `[colors]` — pak se recreuje jen při přepnutí theme (Light → Dark), ne při každém renderu. `COLOR_MAP` který nezávisí na theme lze přesunout na module-level jako konstantu.

**Ovlivněné soubory:**
- `src/components/habits/HabitItemWithCompletion.tsx`
- `src/components/habits/HabitListWithCompletion.tsx`

**Postup řešení:**
1. V `HabitItemWithCompletion.tsx`: přesunout `COLOR_MAP` (řádky 92–101) **mimo komponentu** jako top-level `const` (nezávisí na theme)
2. Obalit celý `StyleSheet.create(...)` do `useMemo(() => StyleSheet.create({...}), [colors])`
3. Totéž v `HabitListWithCompletion.tsx`
4. Manuální test: přepnout Light ↔ Dark theme → styly se musí správně aplikovat
5. Manuální test: označit návyk → styly musí vypadat identicky jako předtím

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: `useMemo` pro StyleSheet NENÍ anti-pattern v tomto případě — standardní StyleSheet.create vrací referenčně stabilní objekt jen při volání s identickým vstupem, ale mi vstup tvoří každý render znovu. Alternativa: rozdělit statické styly (top-level) a dynamické styly (useMemo). Zvolit jednodušší variantu podle počtu theme-závislých stylů.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Po přesunu `COLOR_MAP` na module-level ověř, že nepoužívá žádné hooks/props — pokud ano, musí zůstat v komponentě přes useMemo.

**Status:** [ ] ČEKÁ

---

### 7.3 Debounce haptic feedback v XpAnimationContext

**Problém:** V `XpAnimationContext.tsx` se na **každý XP event** volá `Haptics.impactAsync(...)`. Při rychlém klikání (5 návyků za 2 s) vibruje telefon 5× za sebou — nepříjemný UX, zbytečný nativní bridge call, a přidává jitter do render loopu.

**Vysvětlení:** iOS HIG doporučuje haptic feedback limitovat na ~1× za 100 ms. Pomocí jednoduchého time-based gate (`lastHapticTs`) zajistíme, že rychlé kliky dostanou **jednu** vibraci, ne pět. Telefon nerozliší "5 vibrací za 500 ms" od "1 vibrace", takže UX se nezhorší, naopak zlepší.

**Ovlivněné soubory:**
- `src/contexts/XpAnimationContext.tsx`

**Postup řešení:**
1. Přidat `const lastHapticTsRef = useRef(0)`
2. Před každým `Haptics.impactAsync(...)` volání přidat guard: `if (now - lastHapticTsRef.current < 100) return; lastHapticTsRef.current = now;`
3. Manuální test: rychle označit 5 návyků — zavibruje telefon max 1–2× (ne 5×)
4. Manuální test: pomalé klikání (1 za sekundu) — každý tap vibruje (nezměněno)

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Debounce interval **100 ms** je konzervativní. Pokud uživatel klika výrazně pomaleji než 10× za sekundu, vibrace funguje normálně. Nezvyšuj hodnotu nad 150 ms — user by pak při "normálním" tempu (2 kliky za sekundu) ztratil feedback.

**Status:** [ ] ČEKÁ

---

### 7.4 Odložit achievement check přes InteractionManager

**Problém:** V `gamificationService.performXPAddition` se po každém úspěšném XP gainu volá dynamický import `AchievementService` + evaluace všech achievementů. Tento proces běží synchronně v rámci Promise chain a může způsobit stutter na starších zařízeních.

**Vysvětlení:** Achievementy nejsou kritické pro UX — uživatel neztratí nic, když se unlock oznámí o 300 ms později. `InteractionManager.runAfterInteractions()` odloží callback **dokud neproběhnou UI interakce** (animace, gesta, layout). Výsledek: tap na návyk → okamžitá odezva → po dokončení animace → check achievementů.

**Ovlivněné soubory:**
- `src/services/gamificationService.ts` (místo dynamického importu AchievementService)

**Postup řešení:**
1. Najít v `gamificationService.ts` dynamický import `AchievementService` (fire-and-forget after XP gain)
2. Obalit volání do `InteractionManager.runAfterInteractions(() => { ... })`
3. Import `InteractionManager` z `react-native`
4. Manuální test: odemknout achievement → notifikace se musí zobrazit (jen o ~300 ms později než dříve)
5. Manuální test: rychlé klikání na návyky — žádný viditelný stutter

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud achievement check triggeruje modal přes ModalQueueContext, `InteractionManager` je správný vzor — modaly se mají ukazovat až po dokončení current interakce. Pokud spouští jen tichou DB aktualizaci, `InteractionManager` je stále OK. Nenahrazuj za `setTimeout(0)` — ten nečeká na dokončení animací.

**Status:** [ ] ČEKÁ

---

## FÁZE 8: Optimalizace XP flow (střední riziko)

Tato fáze se dotýká GamificationService a vyžaduje **ověření před každou změnou**. Riziko: rozbití XP výpočtů, denních limitů, nebo měsíčních výzev. Kompenzace: největší očekávané zrychlení (**+30–40 %** nad Fázi 7).

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: PŘED začátkem této fáze povinně projdi a proveď bod 8.0 (ověření závislostí). Bez něj jsou body 8.2–8.4 nepředvídatelné. Nezahajuj 8.1+ dokud 8.0 není HOTOVO.

---

### 8.0 Ověření závislostí: Kdo čte `xpBySource` z AsyncStorage?

**Problém:** `GamificationService.updateXPBySource` zapisuje do AsyncStorage klíče `XP_BY_SOURCE` tzv. *lifetime xpBySource* (kolik XP celkově uživatel získal z každého zdroje za celou existenci účtu). Před tím, než odložíme tento zápis (bod 8.4), musíme vědět, kdo tato data čte synchronně a kde by zpoždění ~200 ms způsobilo viditelný problém.

**Vysvětlení:** Čtenáři `getXPBySource()`:
- `gamificationService.ts:1446` — čteno jako součást statistik uživatele
- `gamificationService.ts:2346` — ve stats snapshot
- `userStatsCollector.ts` — analytics/telemetrie
- `gamificationBackup.ts` — backup/restore flow

**Klíčová otázka:** Používá `MonthlyChallengeService`, `MonthlyProgressTracker` nebo `XpMultiplierService` `getXPBySource()` pro synchronní rozhodování? Pokud ano → nelze odložit bez úpravy logiky tam.

**Postup řešení:**
1. `Grep "getXPBySource|XP_BY_SOURCE" src/services/` — najít všechny čtenáře
2. Pro každého čtenáře určit: **kdy** se volá (při rendrování UI? při tap? v background tasku?) a **co** se s hodnotou dělá
3. Pokud čte jen background service / analytics → **bezpečné odložit**
4. Pokud čte synchronně při render / UI refresh → **označit nebezpečné**, navrhnout alternativu (číst z SQLite `xp_daily_summary` místo AsyncStorage)
5. Zdokumentovat zjištění do tohoto bodu a rozhodnout osud 8.4

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Monthly challenges pravděpodobně používají SQLite `xp_daily_summary` (columns: `habit_xp`, `journal_xp`, `goal_xp`, `achievement_xp`), který **se zapisuje synchronně v transakci** — tam žádný problém není. Ale ověř to přímo v kódu, neodvozuj.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud zjistíš, že xpBySource z AsyncStorage se čte synchronně v UI renderu (např. ProfileScreen, StatisticsScreen), máš 2 varianty:
> - **A)** Ponechat `updateXPBySource` synchronní, odložit jen `updateLastActivity` (menší zisk)
> - **B)** Přepsat čtenáře aby četli z SQLite `xp_transactions` agregací (větší práce, ale čistější)
> Zvol A, pokud je to jediný čtenář. Zvol B, pokud je čtenářů víc a je to evidentně lepší architektura.

**Status:** [ ] ČEKÁ

---

### 8.1 Odstranění `operationQueue` z GamificationService

**Problém:** V `gamificationService.ts:280` je definována `private static operationQueue: Promise<any> = Promise.resolve()`. Každé volání `addXP` / `subtractXP` se připojí do této fronty přes `this.operationQueue = this.operationQueue.then(async () => {...})`. Výsledek: **všechny XP operace globálně serializované** — i když by mohly běžet paralelně (SQLite transakce mají ACID per-statement guarantees).

**Vysvětlení:** Fronta byla pravděpodobně přidána v éře AsyncStorage (kde paralelní write by mohl způsobit race condition). Po migraci na SQLite (Fáze 1–3 SQLite migration) je fronta redundantní — SQLite serializuje writes na DB úrovni. Navíc: event emitter (DeviceEventEmitter) je synchronní per-listener, takže pořadí eventů je dáno pořadím, v jakém proběhly writes v DB — ne frontou v JS.

**Riziko:** Pokud nějaký listener v aplikaci předpokládá **strictní pořadí XP eventů** (např. "xpBatchCommitted vždy po xpGained pro daný zdroj"), odstraněním fronty se pořadí může změnit.

**Ovlivněné soubory:**
- `src/services/gamificationService.ts`

**Postup řešení:**
1. `Grep "operationQueue" src/services/gamificationService.ts` — najít všechny použití
2. Identifikovat každé místo `this.operationQueue = this.operationQueue.then(...)` a nahradit přímým voláním await funkce uvnitř
3. Odstranit deklaraci `operationQueue` (řádek 280)
4. **POVINNÉ**: Zkontrolovat všechny listenery `DeviceEventEmitter.addListener('xpGained', ...)`, `'xpBatchCommitted'`, `'levelUp'` → ověřit, že nepředpokládají pořadí
5. Test: rychlé klikání 5 návyků → XP total musí být správné (5 × 25 = 125 XP, ignore případný daily limit)
6. Test: streak animace se musí zobrazit
7. Test: level-up modal se musí zobrazit, pokud nastane level-up
8. Regresní test: journal entry + habit completion současně → oboje musí projít, XP total OK

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Před odstraněním fronty si přečti commit history přes `git log --all -p src/services/gamificationService.ts | head -200` a hledej, **proč byla fronta přidána**. Pokud commit zpráva říká "fix race condition in XP updates" nebo podobně, fronta tam je z historického důvodu a je nutná VĚTŠÍ opatrnost. Pokud byla přidána "preventively" bez konkrétního incidentu, odstranění je bezpečnější.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud zjistíš, že `operationQueue` chrání kritickou sekci (např. read-modify-write xpBySource), NEMŮŽEŠ ji prostě odstranit. V takovém případě: buď přepsat na SQLite transakci s row-level lock, nebo fronta zůstává. Informuj uživatele a počkej na rozhodnutí.

> 🛡️ **OCHRANA MAKE-UP**: operationQueue je striktně XP-specifická fronta. Make-up logika NEBĚŽÍ přes tuto frontu — derivace Make-upu je synchronní výpočet z `state.completions` v React render cyklu. Odstranění fronty Make-up nijak neovlivní. Test po změně však musí zahrnovat scénář: **bonus completion → XP event → Make-up konverze v kalendáři** — pokud by se `HABIT_BONUS` vs `HABIT_COMPLETION` XP source tracking poškodilo pořadím, pak by statistiky zdrojů XP nekorelovaly s viditelnou Make-up konverzí. Viz bod 8.0 pro kontrolu čtenářů xpBySource.

**Status:** [ ] ČEKÁ

---

### 8.2 Cache pro `getDailyXPData` (session-scoped)

**Problém:** `getDailyXPData()` v `gamificationService.ts` (~řádek 2230) provádí **4 samostatné SQL dotazy** (summary, goalTransactions, journalCount, lastTx). Volá se z `validateXPAddition` per každý tap. Při 5 taps = 20 SQL queries.

**Vysvětlení:** Většina dat v `getDailyXPData` se mění jen při přidání XP — a přidání XP jsme to my sami. Tzn. po úspěšném `addXP` můžeme **invalidovat cache** a příští čtení ji naplní znovu. Mezi taps se data nemění.

**Riziko:** Cache invalidace je snadná pouze, pokud **existuje jediná vstupní brána** pro zápis do `xp_transactions` / `xp_daily_summary`. Pokud existuje více zapisovatelů (migration scripts, backup restore), cache může zůstat stale.

**Ovlivněné soubory:**
- `src/services/gamificationService.ts`

**Postup řešení:**
1. `Grep "xp_transactions|xp_daily_summary" src/services/` — najít všechny zapisovatele
2. Ověřit, že jediní zapisovatelé jsou: `performXPAdditionInternal`, `performXPSubtractionInternal`, migrační skripty (běží jen jednou)
3. Přidat `private static dailyXPDataCache: Map<string, {data: DailyXPData, ts: number}> = new Map()` (klíč = date string)
4. V `getDailyXPData(date)`: pokud cache má záznam novější než 5000 ms → vrátit z cache, jinak query DB a cache write
5. V `performXPAdditionInternal` / `performXPSubtractionInternal` → po úspěšném commit: `dailyXPDataCache.delete(date)`
6. Test: tap 5 návyků → XP správné, denní limit se správně ověřuje
7. Test: překročit denní limit → validace zafunguje (i s cache)
8. Test: den přechod (před půlnocí + po) → nová cache pro nové datum

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Cache TTL **5000 ms** je kompromis. Kratší → zbytečné DB dotazy. Delší → riziko zastaralých dat při edge cases (manual DB edit přes dev tools, atd.). V production build je 5 s bezpečné.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Cache NESMÍ přežít mezi app sessions (po kill & reopen). Jelikož je `Map` static field, existuje per-session (nová třída při reload). Pokud přidáš persistenci — rozbije se. Drž in-memory.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud validateXPAddition vrátí "limit exceeded" kvůli stale cache (nepravděpodobné, ale možné), uživatel ztratí XP. Defenzivně: pokud je cache starší než 1 s a validation **by blokovala XP**, udělat force refresh před rozhodnutím.

**Status:** [ ] ČEKÁ

---

### 8.3 Odložit `updateXPBySource` a `updateLastActivity` na fire-and-forget

**Problém:** V `performXPAddition` po dokončení SQLite transakce probíhají **2 AsyncStorage write operace** (řádek 838: `updateXPBySource`, 839: `updateLastActivity`). Obě jsou `await`ované, takže blokují return z addXP. AsyncStorage write = JSON.stringify + disk I/O ≈ 20–50 ms každé.

**Vysvětlení:** Ani jedna operace není **kritická** pro UI feedback:
- `updateXPBySource` — lifetime analytics, čte se v Profile/Stats obrazovkách (nečte se v habit flow)
- `updateLastActivity` — poslední timestamp aktivity, čte se při spuštění app

Pokud tyto operace selžou, uživatel to nikdy neuvidí. Pokud se zpozdí o 200 ms po addXP, uživatel to nepozná. **Za podmínky**, že výsledek bodu 8.0 potvrdí, že žádný synchronní čtenář je nečeká.

**Závislost:** Tento bod **lze provést jen pokud bod 8.0 vrátil zelenou**.

**Ovlivněné soubory:**
- `src/services/gamificationService.ts`

**Postup řešení:**
1. V `performXPAddition` (cca řádek 835–839): odstranit `await` před `updateXPBySource` a `updateLastActivity`
2. Obalit oba volání do IIFE: `void (async () => { await this.updateXPBySource(...); await this.updateLastActivity(); })();`
3. Přidat error handling — `.catch(err => console.error('[GamificationService] Background update failed', err))`
4. **DŮLEŽITÉ**: Stejný pattern aplikovat i v `performXPSubtraction` (řádek ~1062)
5. Test: tap návyk → XP total v DB je správné OKAMŽITĚ (ověřit SQLite query)
6. Test: otevřít Profile/Stats obrazovku hned po tapu → xpBySource tam může být o 100–200 ms pozadu, ale musí se správně aktualizovat (pull-to-refresh nebo re-focus)
7. Test: force-close app 100 ms po tapu → po restartu musí být XP total OK a xpBySource se dohoní (nebo je zapomenutý o max 1 XP — akceptovatelné)

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud user force-quitne app během 200 ms okna po tapu, `updateXPBySource` se NEMUSÍ dokončit. XP transakce v SQLite je OK (commitnutá před odložením), ale lifetime xpBySource v AsyncStorage bude o daný gain pozadu. To je **akceptovatelný trade-off**, protože: (a) xpBySource lze kdykoli přepočítat z `xp_transactions` tabulky, (b) user tuto hodnotu vidí jen v nepodstatných statistikách.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: NESMÍŠ odložit samotnou SQLite transakci (`performXPAdditionInternal`). Ta musí zůstat synchronní, protože `xp_transactions` a `xp_daily_summary` čtou monthly challenges a progress tracky **synchronně po return z addXP**.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: V IIFE nezapomeň na `void` prefix — bez něj linter může hlásit "unhandled promise". Nebo použij `.catch(...)` na konci.

> 🛡️ **OCHRANA MAKE-UP**: Tato odložená AsyncStorage pole (`xpBySource`, `lastActivity`) **nejsou vstupem pro Make-up derivaci**. Make-up čte raw `state.completions` z HabitsContext (ne z AsyncStorage). Odložení tedy Make-up nijak neovlivní. **Jediné riziko** je, pokud někdo v budoucnu přidá synchronní čtení `getXPBySource()` v UI, které zobrazuje také Make-up statistiky — pak by mezi nimi mohla být krátká nekonzistence. Proto bod 8.0 je povinný.

**Status:** [ ] ČEKÁ

---

## FÁZE 9: Konsolidace dispatch cyklu (volitelné, vyšší riziko)

Tato fáze řeší trojitý dispatch v `HabitsContext.toggleCompletion`. Je **volitelná** — po Fázi 7+8 může být aplikace už dostatečně rychlá a riziko této změny se nevyplatí. Doporučuji vyhodnotit až po dokončení předchozích fází.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Pokud Fáze 7+8 přinesly citelné zrychlení (>60 %), **pozastav se a zeptej uživatele**, zda má cenu dělat Fázi 9. Hodinu práce navíc pro posledních 10 % zrychlení nemusí stát za riziko.

---

### 9.1 Redukce 3 dispatchů na 1 v HabitsContext.toggleCompletion

**Problém:** `HabitsContext.toggleCompletion` provádí 3 dispatche per tap:
1. `ADD_COMPLETION` s temp_id (optimistic)
2. `DELETE_COMPLETION` temp (po storage return)
3. `ADD_COMPLETION` real (s real ID)

Každý dispatch mutuje `completions` array → nová reference → re-render všech konzumentů. Celkem 3 re-render cykly per tap.

**Vysvětlení:** Pattern "temp_id → real_id swap" je historický vzor pro optimistickou UI, kdy UI musí reagovat dřív, než server vrátí ID. Při **lokálním storage** (SQLite) je tento pattern zbytečný — můžeme si dopředu vygenerovat UUID (expo-crypto `randomUUID()`), dispatchnout ADD s finálním ID, a pokud storage selže, dispatchnout DELETE.

**Riziko:** Rollback logika při storage failure se mění. Pokud UUID na klientovi ≠ UUID v DB, nastane desync.

**Ovlivněné soubory:**
- `src/contexts/HabitsContext.tsx`
- `src/services/storage/SQLiteHabitStorage.ts` (potenciálně — aby akceptoval předem vygenerované ID)

**Postup řešení:**
1. Ověřit v `SQLiteHabitStorage.createCompletion`, zda akceptuje externě vytvořené ID (pokud ne, přidat parametr `completionId?: string`)
2. V `HabitsContext.toggleCompletion`:
   - Vygenerovat `completionId = crypto.randomUUID()` dopředu
   - Dispatch `ADD_COMPLETION` s real ID (optimistic)
   - Await `storage.createCompletion(..., completionId)`
   - Při failure: dispatch `DELETE_COMPLETION` s tím samým ID (rollback)
3. Odstranit temp_id logiku a druhý dispatch
4. Test: tap 5 návyků rychle → všech 5 se zobrazí, všech 5 je v DB
5. Test: offline mode (disable SQLite mock) → optimistic UI se zobrazí, pak se vrátí zpět
6. Test: tap → error → UI musí vrátit návyk do nesplněno (rollback funguje)

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: V `toggleCompletion` je vetev pro DELETE (untick návyku). Tam trojitý dispatch NENÍ, takže se ho netýká. Zaměř se pouze na CREATE větev.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: expo-crypto `randomUUID()` vyžaduje `import * as Crypto from 'expo-crypto'`. Pokud je v projektu používán jiný UUID generator (např. `uuid` npm package), použij ten existující — neimportuj nový.

> ⚠️ **UPOZORNĚNÍ PRO CLAUDE**: Reducer `ADD_COMPLETION` pravděpodobně kontroluje duplicity podle ID. Pokud nekontroluje, může se stát, že optimistic add + server add způsobí duplicitu. Ověř a přidej idempotency check.

> 🛡️ **OCHRANA MAKE-UP — NEJVYŠŠÍ PRIORITA V TÉTO FÁZI**: Toto je nejrizikovější bod pro Make-up systém. Důvody:
>
> 1. **Payload musí být kompletní**: ADD_COMPLETION dispatch musí nést **všechny** property, které má completion po SQLite INSERT — zejména `isBonus` (kritické pro Smart Bonus Conversion pairing), `completed`, `date`, `habitId`, `createdAt`, `updatedAt`. Pokud optimistic dispatch vynechá `isBonus`, Make-up to pocítí přesně v moment, kdy user splní víkendový bonus pro všední missed den.
>
> 2. **Rollback musí vrátit přesný stav**: Při storage failure `DELETE_COMPLETION` musí projít s tím samým ID, které bylo použito v ADD. Pokud ID nesedí (např. collision s jiným completion), zůstane fantomová completion v state a Make-up pairing začne generovat špatné konverze (bude vidět bonus, který fyzicky v DB neexistuje).
>
> 3. **Uuid kolize**: `crypto.randomUUID()` má astronomicky nízkou pravděpodobnost kolize, ale pokud by existující completion v DB měla stejné ID jako nově generované (prakticky nemožné, ale…), SQLite INSERT by selhal a optimistic UI by ukazovala completion, která se nikdy neuložila. **Defenzivně**: po SQLite failure vždy vrátit přes DELETE_COMPLETION.
>
> 4. **Test Make-up scénáře**:
>    - Vytvořit návyk naplánovaný Po–Pá
>    - Rychle označit bonus v sobotu a neděli (2 bonusy) + pondělí a úterý neoznačit (2 missed)
>    - HabitCalendarView musí ukázat: Po/Út = modrá tečka (covered), So/Ne = fialová (makeup)
>    - Pokud konverze neproběhne (So/Ne zobrazené jako regular bonus, Po/Út jako red missed), něco v reduceru / payloadu se rozbilo
>
> 5. **Regresní kontrola streak kalkulace**: Po změně otevřít habit stats a ověřit, že streak pro testovaný návyk = 5 (všech 5 scheduled dní pokrytých). Pokud je streak jiný, Make-up se nedopočítává.

**Status:** [ ] ČEKÁ

---

## Přehled rizik a časový odhad — Performance fixes

| Fáze | Popis | Riziko | Náročnost |
|---|---|---|---|
| 7.1 | Memoizace todayCompletions | Nulové | 15 minut |
| 7.2 | StyleSheet/COLOR_MAP mimo render | Nulové | 30 minut |
| 7.3 | Debounce haptic | Nulové | 15 minut |
| 7.4 | InteractionManager achievements | Nulové | 15 minut |
| 8.0 | Ověření závislostí xpBySource | Nulové (jen výzkum) | 30 minut |
| 8.1 | Odstranění operationQueue | Střední | 1 hodina |
| 8.2 | Cache getDailyXPData | Střední | 1.5 hodiny |
| 8.3 | Odložit AsyncStorage zápisy | Střední | 1 hodina |
| 9.1 | Redukce dispatchů 3→1 | Vyšší (volitelné) | 2 hodiny |

**Očekávané výsledky:**
- Po Fázi 7: **~30–40 % zrychlení** (nulové riziko)
- Po Fázi 8: **~70 % zrychlení** (střední riziko, nutné testování)
- Po Fázi 9: **~80 % zrychlení** (vyšší riziko, volitelné)

**Celkový odhad bez Fáze 9:** 5–6 hodin práce včetně testování.

---

## Obecná pravidla pro tuto sekci (pro Claude)

> ⚠️ **PRAVIDLO 1 — Test po každém bodě**: Po dokončení každého bodu 7.x / 8.x proveď smoke test klikání na návyky. Nespouštěj další bod, dokud aktuální není stabilní.

> ⚠️ **PRAVIDLO 2 — Žádné rozšíření scope**: Pokud při implementaci najdeš "další problém, který by se taky dal opravit" — NEOPRAVUJ ho ve stejném commitu. Přidej do této sekce jako nový bod a řeš samostatně. Surgical changes only.

> ⚠️ **PRAVIDLO 3 — Rollback strategie**: Každá fáze má samostatný commit. Pokud se po fázi zjistí regrese, `git revert` musí vrátit jen tu fázi, ne všechno.

> ⚠️ **PRAVIDLO 4 — Měření**: Před začátkem Fáze 7 si poznamenat subjektivní rychlost (např. "5 taps = ~1 s zasekání"). Po Fázi 7 a po Fázi 8 znovu změřit. Konkrétní čísla jsou lepší než "pocit".

> ⚠️ **PRAVIDLO 5 — Nezasahovat do technical-guides**: Tato optimalizace je **implementační detail**, ne změna business pravidel. `technical-guides:Gamification-Core.md` a `technical-guides:Habits.md` zůstávají nedotčené. Pokud by bylo potřeba měnit pravidla, STOP a zeptej se.

> 🛡️ **PRAVIDLO 6 — Povinný Make-up smoke test po každé fázi**: Není voliteľný. Konkrétní scénář je popsaný v sekci "Kritická funkcionalita k zachování: Make-up systém" výše. Bez splnění tohoto testu fáze NENÍ považovaná za hotovou, i kdyby rychlost klikání byla 10× lepší. Make-up je jedna z klíčových business-level funkcionalit aplikace — ztráta by byla katastrofická.

> 🛡️ **PRAVIDLO 7 — Pokud Make-up test selže**: Okamžitě `git revert` dané fáze. Ne debugovat polovinu dne, ne dělat "rychlou opravu". Vrátit se ke stabilnímu stavu, pak v klidu diagnostikovat v samostatné branchi. Surgical changes mean surgical rollbacks.
