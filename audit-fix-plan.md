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

**Status:** [ ] ČEKÁ

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
