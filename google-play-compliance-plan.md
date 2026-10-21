# Google Play – plán oprav z Play Console (R8, edge-to-edge, velké obrazovky)

*Založeno 2026-10-13 · **verze 2 z 2026-10-14** · Zdroj: Play Console → produkční vydání 10 (7.0.0) → 1 problém + 2 doporučení.*
*Stav: ✅ **Schváleno 2026-10-14.** Fáze 1 hotová, **fáze 2 (generálka) hotová 2026-10-17**
(necommitnuto). **Výsledek: do 7.0.2 jde V1** (R8 bez optimalizace) – optimalizace (V2) v generálce
selhala na dvou věcech a jde do fáze 8 (termín 15. 1. 2027). Další krok: commit (na pokyn) → EAS build
→ interní testování s testerkou.*

> **Jak číst:** části A–D. Část A má **fáze 0–8** a **kroky A1–A40** číslované průběžně (žádné
> dvojí značení). U každého kroku je, kdo ho dělá: 🤖 **Claude** / 👤 **Petr** / 🤝 **společně**.
> Hotové body se hned odškrtávají `[x]`. `projectplan.md` na tento soubor jen odkazuje.

### Co přinesla verze 2 (druhá hloubková kontrola, vše ověřeno v kódu nebo dokumentaci)
1. **Google chce ≥ 25 % u všech tří metrik** – optimalizace, obfuskace **i** zmenšení (oficiální
   stránka Play Console). Samotné zapnutí R8 řeší jen obfuskaci; optimalizaci má šablona Expa
   vypnutou (`-dontoptimize`). → nové rozhodnutí **R-8** a varianta **V2** (R8 + optimalizace).
2. **R8 v naší šabloně (8.12.14) má chybu ve statistikách** → Play u optimalizace a zmenšení
   ukáže „-" a soubor `r8.json` nejde použít k měření. → obfuskaci měříme z `mapping.txt`,
   pro V2 použijeme opravenou verzi R8.
3. **Test rewarded reklamy** byl v praxi neproveditelný (reklama je jen při zmrzlé sérii deníku)
   → přesný postup se změnou data v emulátoru.
4. **Čistota analytiky** – testovací čisté instalace by se započítaly do trychtýře prvního dne
   → debug režim Firebase před prvním spuštěním, čisté instalace jen v emulátoru.
5. **Past v testu připomínek** – „Vynutit ukončení" maže naplánované alarmy; test by lhal.
6. Sjednocené číslování, matice „nativní modul → test", kontrola sloučené konfigurace R8,
   kontrola `.env`, změna času 25. 10., malá uživatelská základna u postupného vydání.
7. **Druhá nezávislá revize (vše ověřeno):** Play bere `r8.json` jen z buildů s **posledním patchem
   AGP** → V2 zvedá **AGP na 8.12.3** (nese opravené R8 8.12.22) místo připínání samotného R8;
   **R-2 zrušeno** (EAS si paměť Gradlu nastavuje sám a přebije cokoli z projektu); logcat se
   filtruje jen na proces appky; v testu připomínek se povolují přesné alarmy; tester v interním
   testování dostane z Play vždy nejvyšší verzi.

---

## 📋 OBSAH

1. Přehled a rozhodnutí
2. Co teď FUNGUJE a NESMÍ se pokazit
3. Ověřená fakta
4. **ČÁST A – R8: obfuskace + optimalizace (vydání 7.0.2)** ← termín Google únor 2027, děláme hned
5. ČÁST B – Zastaralá API edge-to-edge (jen sledovat)
6. ČÁST C – Velké obrazovky / orientace (diagnostika hned, oprava podle výsledků)
7. ČÁST D – Budoucí kroky (podmíněné)
8. Rizika a plán B
9. Časová osa
10. Zdroje
11. Příloha – návod pro testerku (k přeposlání)

---

## 1. PŘEHLED A ROZHODNUTÍ

| # | Hlášení v Play Console | Závažnost | Termín | Dopad na uživatele | Co uděláme | Kdy |
|---|---|---|---|---|---|---|
| A | Optimalizace DEX kódu pod limitem (teď hlášena obfuskace 1 %; požadavek je ≥ 25 % u **optimalizace, obfuskace i zmenšení**) | **Problém** – „může ovlivnit viditelnost a možnost publikovat" | **únor 2027** | žádný viditelný (appka bude menší) | R8 + keep pravidla (V1), ideálně i optimalizace (V2) | **7.0.2** (samostatné vydání) |
| B | Zastaralá API pro edge-to-edge (Android 15) | Doporučení | žádný | **žádný** – volání jsou jen v knihovnách a Android 15+ je ignoruje | Nic, sledovat aktualizace knihoven | při upgradu Expo SDK |
| C | Zámek na výšku vs. velké obrazovky (Android 16) | Doporučení | **reálně před cílením na API 37 (pravděpodobně srpen 2027)** | **už teď**: tablety s Androidem 16 appku otočí na šířku | Diagnostika v emulátoru → rozhodnutí | diagnostika hned, oprava podle výsledku |

### 🔐 Rozhodnutí, která potřebuju od Petra (před startem)

Každé má moje doporučení. Mlčení = souhlas s doporučením.

- [ ] **R-1: 7.0.2 obsahuje jen R8** (varianta V1 nebo V2 podle R-8), nic jiného. Doporučuji ANO –
      když by se něco pokazilo, víme hned proč a data z trychtýře prvního dne se nemíchají s jinou změnou.
- [x] **R-2: ~~Zvýšit paměť Gradlu pluginem~~ – ZRUŠENO** (2. revize, ověřeno v dokumentaci Expa):
      EAS si paměť nastavuje sám přes `GRADLE_OPTS` (střední stroj: 4 GB heap, 1 GB metaspace)
      a přebije cokoli z `gradle.properties` → plugin by neměl účinek. Lokálně se paměť předává
      parametrem (fáze 2). Kdyby EAS někdy došla paměť: `env.GRADLE_OPTS` v `eas.json`
      nebo `resourceClass: large`.
- [ ] **R-3: Generálka na Macu** – 3 lokální buildy (V0 bez R8, V1, V2) + testy v emulátoru (fáze 2).
      Doporučuji ANO – chytí chyby R8 dřív a zadarmo, porovná V1 s V2 a otestuje přežití připomínek
      přes update. Běží hodiny strojového času (Mac má 8 GB RAM, první build je nejdelší), Petrova
      práce žádná. Když Mac nestačí paměťově, přejdeme na EAS – **přijdeme ale o porovnání V1/V2
      a o rychlý test přežití připomínek** (EAS AAB nejde nainstalovat přes lokální V0) → test
      přežití pak jen přes Play (A29 blok 5) a do 7.0.2 doporučím **V1**.
- [ ] **R-4: Verze 7.0.2** (ne jen nový versionCode). Doporučuji ANO – v Crashlytics a Play vitals půjde
      R8 verze jasně oddělit od 7.0.1.
- [x] **R-5: Jak se nahrává do Play** → **ručně v Play Console** (Petr, 2026-10-14). Platí ruční
      postup v A26.
- [x] **R-6 → testerka má Android telefon s produkční 7.0.1** (Petr, 2026-10-14) → průchod 1 (update
      s daty) dělá ona; potřebujeme její Google účet v seznamu testerů a jednoduchý návod.
      Původní otázka: máš fyzický Android telefon s **produkční 7.0.1 z Play**?
      Doporučené rozdělení: **update test na telefonu** (reálný upgrade s daty), **všechny čisté instalace
      v emulátoru** (nepočítají se do analytiky, reklamy jsou automaticky testovací, jde měnit datum).
      Bez telefonu → všechno v emulátoru (7.0.1 se do něj nainstaluje z Play).
- [ ] **R-7: Průvodce** – založit `technical-guides:Android-Release-Build.md` + krátké odkazy
      z Crashlytics.md, Notifications.md a AdMob.md. Doporučuji ANO – keep pravidla jsou přesně ten
      typ věci, kterou za půl roku někdo smaže, protože „vypadá zbytečně".
- [x] **R-8 → varianta (a) adaptivně** (Petr souhlasí, 2026-10-14). **Výsledek generálky 2026-10-17:
      V2 neprošla → 7.0.2 = V1, optimalizace ve fázi 8** (detaily u A22). **2026-10-20 Petr: všechno naráz
      v 7.0.2** → fáze 8 udělaná hned: oprava Records (`-keep @interface expo.modules.**`) + generálka
      V0 → V2f prošla (výsledky u A39) → **7.0.2 = V2 s optimalizací**. **Optimalizace (V2).** Varianty:
  - **(a) adaptivně – DOPORUČUJI:** generálka postaví V1 i V2. Když V2 projde **všemi** testy
    (start, moduly, přežití připomínek přes update, všechny 3 metriky ≥ 30 %, AAB hlásí AGP 8.12.3),
    vydá se rovnou V2 →
    jedno kolo testování a únor 2027 je vyřešený. Když V2 ukáže cokoli podezřelého, vydá se V1
    (odstraní dnešní varování) a V2 půjde samostatně (fáze 8) s termínem **15. 1. 2027**.
  - (b) vždy jen V1 teď, V2 samostatně do 15. 1. 2027 (dvě kola testování pro Petra).
  - (c) čekat, až optimalizaci přinese upgrade Expo SDK – **nedoporučuji**: 55 → 58 je velký projekt
    s nejistým termínem a bez něj bychom v únoru nesplnili požadavek.
- [x] **R-9 → videa začínají brzy, ~3 týdně; větší příliv lidí až za týdny**, až je začne doporučovat
      algoritmus (Petr, 2026-10-14) → 7.0.2 vydat co nejdřív, dokud je provoz malý, a mít ji na 100 %
      dřív, než příliv přijde. Postupné vydání v klidném období je bezpečné.

---

## 2. CO TEĎ FUNGUJE A NESMÍ SE POKAZIT (pravidlo 6)

R8 mění **jen nativní Java/Kotlin kód** v release buildu. JS (Hermes bundle) se ho netýká.
Ohrožené je všechno, co stojí na nativních modulech, a **data uložená nativní vrstvou pod jmény tříd**.

| Systém | Proč je to citlivé | Kde to ověříme |
|---|---|---|
| Start appky + všechny Expo moduly | `ExpoModulesPackageList` se načítá **reflexí** | A20, A29 blok 1 |
| SQLite (všechna data uživatele) | JNI vrstva, Record s volbami při otevření DB | A20, A29 bloky 1 a 9 |
| **Naplánované připomínky po aktualizaci** | expo-notifications je ukládá **Java serializací pod jmény tříd** a bez `serialVersionUID`; po přejmenování by uložené připomínky ze 7.0.1 tiše přestaly chodit | **A21** (emulátor), **A29 blok 5** (telefon) |
| GDPR souhlas (UMP) | interní třídy UMP, už máme keep pravidlo | A29 blok 3 |
| Reklamy banner + rewarded (příjem!) | Google Mobile Ads SDK | A29 blok 4 |
| Analytika (trychtýř prvního dne ze 7.0.1!) | RNFB Analytics | A29 blok 10 |
| Crashlytics (čitelnost pádů) | mapping soubor | A24, A35 |
| Animace, gesta, přetahování | Reanimated/Worklets, gesture-handler | A29 bloky 6–8 |
| Výběr **času** připomínek, haptika, fonty, ikony, jazyk, vzhled | nativní moduly, AsyncStorage | A29 bloky 1, 5, 7 |
| Kompletní seznam modulů | matice „nativní modul → test" | **A30** |

**Dev build přes `npm start` se nemění** – R8 běží jen v release variantě. **iOS se nemění vůbec.**
**Data safety / App Privacy beze změny** – R8 nemění, jaká data appka sbírá.

---

## 3. OVĚŘENÁ FAKTA

Značky: **[kód]** ověřeno v repu/`node_modules` · **[dok]** oficiální dokumentace ·
**[issues]** zkušenost jiných týmů · **[odhad]** úsudek

### 3.1 Požadavek Googlu
- **[dok]** Od února 2027 musí každé nahrané AAB s > 10 MB DEX mít **≥ 25 % optimalizace, obfuskace
  a zmenšení** (tabulka „DEX code optimization" na stránce *Play Console technical quality
  requirements*). Nesplnění „can affect an app's visibility and publishing capabilities". Přesný den
  v únoru Google neuvedl. Nástroj je volný („R8 or another app shrinker").
- **[dok]** Procenta pro každé AAB ukazuje *App bundle explorer*. Play je bere ze souboru
  `BUNDLE-METADATA/com.android.tools/r8.json` (AGP 8.10+ v posledním patchi), jinak je odhaduje
  z `mapping.txt` (to umí jen obfuskaci) nebo heuristikou nad DEX.
- **[kód]** Dnešní varování se týká jen obfuskace (1 %); ostatní dvě metriky Play u nás zatím neměří.

### 3.2 R8 v naší šabloně (Expo SDK 55 / RN 0.83)
- **[kód]** `enableMinifyInReleaseBuilds` je ve výchozím stavu `false` → **R8 je vypnuté**. V `app.json`
  není zapnuté. Složka `android/` neexistuje – EAS ji generuje při každém buildu (CNG).
- **[kód]** Šablona (`node_modules/expo/template.tgz` → `android/app/build.gradle:119`):
  `proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"` →
  `proguard-android.txt` obsahuje **`-dontoptimize`** → optimalizace 0 %.
  Kořenový `android/build.gradle`: `classpath('com.android.tools.build:gradle')` bez verze.
- **[kód]** `org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m`; R8 full mode (výchozí v AGP 8,
  šablona ho nemění).
- **[kód]** AGP **8.12.0** (verzový katalog `@react-native/gradle-plugin/gradle/libs.versions.toml`;
  do kořenového classpath ho přináší RN plugin, Expo AGP nepřidává). R8 je **zabalené uvnitř AGP**
  (`builder-*.jar`, ne samostatná závislost) – ověřeno `r8-version.properties`: AGP 8.12.0 →
  **R8 8.12.14** (z Gradle cache na Macu), AGP 8.12.3 → **R8 8.12.22**. Na Google Maven je AGP 8.12.0–8.12.3.
- **[issues]** R8 8.12.14 má přetečení ve statistikách (`noOptimizationPercentage: -65.72` = přetečená
  hodnota 100) a statistiky zahodí. Opraveno v 8.12.19+.
- **[dok]** Play bere procenta z `r8.json` jen u buildů s **posledním patchem AGP** (8.10+); jinak
  odhaduje z `mapping.txt` jen obfuskaci (u ostatních dvou „-"). Verzi AGP zapisuje AGP do AAB
  (`BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties`) → samotný pin R8 by
  nestačil, **je potřeba AGP 8.12.3**. Gradle při konfliktu verzí vybere vyšší → zvednutí verze
  v kořenovém `build.gradle` AGP nikdy nesníží.
- **[dok]** EAS nastavuje paměť Gradlu sám přes `GRADLE_OPTS` (střední stroj: 16 GB RAM, 4 GB heap,
  1 GB metaspace) a přebíjí `org.gradle.jvmargs` z projektu.
- **[issues]** Expo appka Selftend: po zapnutí R8 (s `-dontoptimize`) obfuskace **1 % → 93 %**, DEX
  54,1 → 20,2 MB, varování **zmizelo**, optimalizace a zmenšení „-". Jakmile Play začne optimalizaci
  měřit (novější R8 přes upgrade Expa nebo ruční pin), ukáže s `-dontoptimize` **0 %** → pod limitem.
  ⇒ **Novější AGP (a s ním R8) nikdy bez přepnutí na optimalizaci.**
- **[issues]** Expo šablona přechází na `proguard-android-optimize.txt` až v novějších SDK (expo PR
  #46852 z června 2026; Selftend uvádí šablonu 58 s AGP 9.2.1 a R8 9.2.14). Naše SDK 55 to nemá.
- **[issues]** Expensify (velká RN appka) přepnul na `proguard-android-optimize.txt`: DEX −6,7 %, bez
  potvrzených pádů z optimalizace; doporučuje zároveň AGP 8.12.3 / R8 8.12.22 kvůli správnému skóre.
- **[kód]** `expo-build-properties` zapisuje `android.enableMinifyInReleaseBuilds` do
  `gradle.properties` a `extraProguardRules` připojuje do `android/app/proguard-rules.pro`.
  Volbu pro výměnu proguard souboru ani verzi AGP **nemá** → V2 potřebuje vlastní config plugin.

### 3.3 Co R8 může rozbít – reflexe, serializace, pravidla knihoven
- **[kód]** `expo.modules.ExpoModulesPackageList` – `Class.forName` na 3 místech; Expo drží jen členy
  třídy, ne jméno. Při chybě appka naběhne **bez Expo modulů** a do logu napíše
  „Couldn't get expo package list." / „Couldn't get expo modules list.".
- **[kód]** `expo.modules.adapters.react.apploader.RNHeadlessAppLoader` – jméno je jen v hodnotě
  `meta-data` v manifestu → automatická pravidla z manifestu ho nekryjí. Levná pojistka.
- **[kód] 🚨 expo-notifications – vlastní pravidlo se NEPOUŽIJE.** Zdroj má `proguard-rules.pro`
  (drží celý balík), ale `build.gradle` nemá `consumerProguardFiles` a appka bere modul jako hotový
  AAR (`expo-module.config.json` → `publication`), ve kterém `proguard.txt` chybí. Prověřeno všech
  18 předbuildovaných Expo modulů: **jediný** takový případ (ostatní pravidla nemají ani ve zdroji,
  expo-image je má i v AAR).
- **[kód]** expo-notifications ukládá naplánované připomínky do SharedPreferences jako
  **Java-serializované objekty** (`SharedPreferencesNotificationsStore.kt`, `Base64Serialization.kt`).
  `NotificationRequest` a všechny triggery (`DailyTrigger`, `DateTrigger`, …) **nemají `serialVersionUID`**
  (počítá se ze struktury třídy), `NotificationContent` má pevné. Uložené požadavky se čtou při
  aktualizaci appky (`MY_PACKAGE_REPLACED`), po restartu (`BOOT_COMPLETED`) a při každém spuštění
  alarmu. Bez keep pravidla → přejmenované třídy → `ClassNotFoundException`; při přeplánování se
  nečitelný záznam tiše přeskočí, v okamžiku spuštění alarmu se **smaže**
  (`ExpoSchedulingDelegate.kt:72-88`) → **připomínky lidem, kteří si appku po automatické aktualizaci
  neotevřou, přestanou chodit**.
  Keep celého balíku drží jména i strukturu (blokuje i změnu přístupových modifikátorů a slučování,
  takže ho `-allowaccessmodification` ve V2 neovlivní; statický inicializátor s `CREATOR` zůstává →
  výchozí `serialVersionUID` se nezmění) → kompatibilní se 7.0.1 i s obnovou ze systémové zálohy
  Androidu (SharedPreferences se zálohují). Jiná nechráněná data pod jmény tříd (WorkManager,
  komponenty z manifestu) kryjí pravidla knihoven nebo AAPT.
- **[kód]** `expo.modules.kotlin.records.Record` je **prázdné rozhraní**; Expo ho za běhu testuje přes
  `isAssignableFrom` (`TypeConverterProvider.kt:145`). **[issues]** Selftend upozorňuje, že optimalizace
  umí prázdná rozhraní odstranit → pojistka `-keep interface expo.modules.kotlin.records.Record`.
  Recordy používají např. volby otevření DB (expo-sqlite), prohlížeče (expo-web-browser), splash.
- **[kód]** AdMob a RNFB mají `hasPackageClass()` (detekce „je to Expo / dev build"). Po R8 může vracet
  jiné hodnoty; ovlivňuje jen metadata knihovny, ne funkce. **[odhad]**
- **[kód]** Pravidla, která se **opravdu použijí** (AAR obsahuje `proguard.txt`): React Native
  (NativeModule, @ReactProp, @DoNotStrip, JNI), Reanimated, Worklets, expo-modules-core, expo,
  expo-image. Firebase / AdMob / UMP / AndroidX mají pravidla uvnitř svých AAR z Mavenu.
- **[kód]** V pravidlech v `node_modules` není `-dontobfuscate` ani `-dontshrink`. Pravidla z AAR
  z Mavenu uvidíme až ve sloučené konfiguraci R8 (`configuration.txt`) při buildu. **[issues]** Existují
  knihovny, které tím vypnou zmenšení celé appce (případ onyxsdk-pen).
- **[kód]** `lottie-react-native`, `react-native-webview` a `expo-image` se v JS **nepoužívají**
  (nativní kód v appce je, nespouští se). `react-native-sortables` je čisté JS.
- **[kód/dok]** Crashlytics: Gradle plugin `com.google.firebase.crashlytics` je aplikovaný → mapping se
  u obfuskovaných buildů nahrává automaticky. **[issues]** Play si mapping bere přímo z AAB.
- **[kód]** V appce **není** záloha/export dat. Data zálohuje jen systémová záloha Androidu.

### 3.4 Testovací logistika
- **[kód]** Rewarded reklama se nabízí **jen při zmrzlé sérii deníku**: den s ≥ 3 zápisy, pak zmeškaný
  den → `adsNeededToWarmUp() > 0` (`src/components/home/GratitudeStreakCard.tsx:395`). Na čisté
  instalaci se k ní nejde dostat bez změny data. Den se počítá od 3 zápisů; +2 dny po takovém dni =
  1 zmeškaný den = 1 reklama. Karta se načítá jen při otevření obrazovky
  (`GratitudeStreakCard.tsx:126-134`) → po změně data appku zabít a spustit znovu.
- **[kód]** Odpolední připomínka je obecná a chodí denně, když je zapnutá (onboarding ji při povolení
  notifikací zapne); večerní je „chytrá" podle nesplněných úkolů. Připomínky se přeplánují při každém
  spuštění appky a návratu z pozadí (průvodce Notifications.md).
- **[dok]** Události v **debug režimu Firebase** se nezapočítávají do přehledů Analytics ani do exportu
  BigQuery. Zapíná se `adb shell setprop debug.firebase.analytics.app com.petrturek.selfrise`,
  vypíná `… .none.`. **[odhad]** Vlastnost bez `persist.` po restartu zařízení zmizí → po restartu znovu.
- **[dok]** AdMob: **emulátory jsou automaticky testovací zařízení**; fyzický telefon se musí přidat
  v AdMob (jinak hrozí „neplatná návštěvnost" při opakovaném sledování skutečných reklam).
- **[dok]** Reklamní provoz z pre-launch reportu Google sám vylučuje. **[odhad]** Analytiku ne →
  pre-launch report vyrobí pár falešných instalací (zapsat datum, v trychtýři odečíst).
- **[Android]** „Vynutit ukončení" (Force stop) **zruší všechny alarmy appky**; aktualizace balíku je
  neruší a expo-notifications je navíc přeplánuje (`MY_PACKAGE_REPLACED`). Zavření z přehledu
  aplikací alarmy neruší (na běžném Androidu; některé značky telefonů jsou agresivnější).
- **[kód]** Bez povolení přesných alarmů použije expo-notifications **nepřesný** alarm
  (`ExpoSchedulingDelegate.kt:105-120`); na Androidu 14+ je povolení u nových instalací standardně
  zamítnuté → připomínka může přijít i o desítky minut později. V emulátoru se pro test povolí:
  `adb shell appops set com.petrturek.selfrise SCHEDULE_EXACT_ALARM allow`.
- **[dok/odhad]** Tester v interním testování dostane z Play vždy **nejvyšší** versionCode, na který
  má nárok → po nahrání 7.0.2 už jeho účet 7.0.1 z Play nenainstaluje.
- **[odhad, 2. revize]** `adb logcat` bez filtru obsahuje i cizí procesy (Play služby, Play Store, ART)
  a ty `ClassNotFoundException` hlásí běžně → kontrola jen na PID appky + crash buffer, srovnání s V0.
- **[kód]** Lokální buildy používají produkční `google-services.json` (versionCode 1) → jejich pády
  a mapping jdou do produkční Crashlytics → při sledování filtrovat podle versionCode z EAS.
- **[kód]** `.env`, `.env.local`, `.env.production` ani `.env.production.local` teď **neexistují**
  (je jen `.env.example`, který Expo nenačítá); jediný přepínač v kódu je
  `EXPO_PUBLIC_ENABLE_MARKETING_DEMO`. Lokální release build by hodnoty z `.env*` zapekl do appky.
- **[kód]** Výchozí Node na Macu v20.20.2 (pro build stačí), testy potřebují Node 24 (pravidlo 9).
- **[kód]** Lokální emulátory: `Pixel_7` API 36, `Medium_Phone` API 36.1, `Pixel_Tablet` **API 35**
  (všechny s Google Play). JDK 17, Android SDK a `adb` jsou nainstalované.

### 3.5 B – Edge-to-edge
- **[kód]** `setStatusBarColor` / `setNavigationBarColor` / `LAYOUT_IN_DISPLAY_CUTOUT_MODE_*` jsou v RN
  `WindowUtil.kt` (`enableEdgeToEdge` nastavuje průhledné barvy lišt, cutout mód podle verze)
  a `StatusBarModule.kt` čte `window.statusBarColor`. Na Androidu 15+ volání proběhnou, ale **systém je
  ignoruje** (edge-to-edge je vynucené) → bez vlivu na vzhled.
- **[kód]** Náš `<StatusBar style="light" translucent />` (`app/_layout.tsx:96`) jde přes
  `expo-status-bar`, který `translucent` při edge-to-edge ignoruje. Totéž `statusBarTranslucent`
  u modalů. `expo-navigation-bar` nepoužíváme.
- **[dok/odhad]** Play kontroluje **přítomnost** volání v DEX, ne běh. Varování zmizí až s novými
  verzemi RN / Material / Google Mobile Ads SDK.

### 3.6 C – Velké obrazovky
- **[kód]** `targetSdk 36`. **[dok]** Android 16 na displejích s nejmenší šířkou ≥ 600 dp **ignoruje**
  `screenOrientation`, `resizeableActivity=false` a poměry stran → **tablety s Androidem 16 už dnes
  appku otočí na šířku a roztáhnou**.
- **[dok]** Dočasná výjimka: `android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`. Android 17
  ji pro appky cílící na API 37 ruší. **[issues/odhad]** Play bude API 37 vyžadovat zřejmě od srpna 2027.
- **[kód]** Activity se při otočení nerestartuje (`configChanges` obsahuje `orientation|screenSize`) →
  JS stav přežije, ale **30 souborů** čte `Dimensions.get('window')` jednou při načtení modulu
  a **18 souborů** používá statické helpery `src/utils/responsive.ts` / `src/constants/dimensions.ts`
  → po otočení zastaralé rozměry. `useWindowDimensions` se nepoužívá nikde.
- **[kód]** Banner: pevná velikost `BANNER` 320×50, vycentrovaný → nerozbije se.

---

## 4. ČÁST A – R8: OBFUSKACE + OPTIMALIZACE (vydání 7.0.2)

> Technická pravidla: @technical-guides:Android-Release-Build.md *(vznikne v A14)*,
> @technical-guides:Crashlytics.md, @technical-guides:Notifications.md, @technical-guides:AdMob.md

**Varianty buildu:**
| Varianta | Co obsahuje | Účel |
|---|---|---|
| **V0** | dnešní stav, bez R8 (jen lokálně) | „jako 7.0.1" – výchozí bod pro test přežití připomínek |
| **V1** | R8 + keep pravidla, šablonový `proguard-android.txt` (`-dontoptimize`), R8 8.12.14 | odstraní dnešní varování (obfuskace); optimalizace v Play „-" |
| **V2** | V1 + `proguard-android-optimize.txt` + **AGP 8.12.3** (nese R8 8.12.22) | splní **všechny 3 metriky** pro únor 2027 a Play je umí změřit – ❌ v generálce rozbila uložené připomínky |
| **V2''** | V1 + vlastní optimalizační profil bez `-allowaccessmodification` + R8 compat mode + AGP 8.12.3 (= dnešní `plugins/withR8Optimization.js`) | připomínky ✅, ale ❌ rozbitý převod parametrů Expo modulů (databáze) → fáze 8 |

**Cíl (hotovo, když):** produkční AAB má v Play všechny tři metriky ≥ 25 % **před únorem 2027**,
nula nových pádů, připomínky přežijí aktualizaci, čitelné pády v Crashlytics, průvodci aktuální.
**Mimo rozsah:** `shrinkResources`, AGP 9, upgrade Expo SDK (→ ČÁST D).

### Fáze 0 – Příprava (👤 Petr, ~30 min, bez kódu)

- [ ] **A1** 👤 **Výchozí stav v Play:** *Test and release* → *App bundle explorer* → bundle 7.0.1 →
      *Details* → **App optimization**: obfuskace / optimalizace / zmenšení (%) a **velikost DEX**.
      Screenshot. Zapsat: obf. `____ %`, opt. `____`, zmenš. `____`, DEX `____ MB`.
- [ ] **A2** 👤 **Výchozí pády 7.0.1** – **hlavní signál jsou Play vitals** (Crashlytics se v appce
      zapíná až po souhlasu UMP, pád při nativním startu by nemusel nahlásit):
      *Android vitals* → *Crashes and ANRs* → 7.0.1; Firebase → Crashlytics → filtr 7.0.1.
      Zapsat: vitals crash rate `____ %` (nebo „nedostatek dat"), ANR `____ %`,
      Crashlytics crash-free users `____ %`, top 3 issues `____`.
- [ ] **A3** 👤 **Reklamy na telefonu testerky:** stačí, že na reklamy **nekliká** (návod pro testerku
      to říká; rewarded reklamy se testují jen v emulátoru, který je v AdMob testovací automaticky).
      Volitelně úplná jistota: testerka pošle **Advertising ID** (Nastavení → Google → Reklamy /
      Ochrana soukromí → Reklamy) → AdMob → *Settings* → *Test devices* → *Add test device*.
- [ ] **A4** 👤 **Interní testování:** *Testing* → *Internal testing* → *Testers* → do seznamu přidat
      **Google účet testerky** (ten, kterým je přihlášená v Obchodě Play v telefonu) a **Petrův účet**
      (pro emulátor). Zkopírovat **odkaz pro testery** – testerce ho Petr pošle **až po A26** spolu
      s návodem (příloha na konci plánu).
      Zkontrolovat, jestli je zapnuté *Managed publishing* (*Publishing overview*) – pokud ano, po
      schválení se musí ručně kliknout *Publish changes*.
- [ ] **A5** 👤 **Pre-launch report:** *Testing* → *Pre-launch report* → *Settings* → zapnutý.
      (Jestli běží i pro interní stopu, uvidíme v A27; je to bonus, ne podmínka.)
- [ ] **A6** 👤 Odpovědět na **R-1 až R-9** (sekce 1).
- [ ] **A7** 👤 Ověřit s testerkou: v telefonu má **SelfRise z Obchodu Play** (produkční 7.0.1), reálně
      ho používá (návyky, deník) a má zapnuté připomínky. Ať zatím nic neaktualizuje – návod jí
      řekne, kdy a jak (včetně dočasného vypnutí automatických aktualizací SelfRise).

### Fáze 1 – Konfigurace, pluginy, testy, průvodce (🤖 Claude, 1 posezení)

#### A8 – Zapnout R8 a keep pravidla (V1 i V2)
- [x] 🤖 `app.json` → `plugins` → `expo-build-properties` → `android`. **Před:**
  ```json
  "android": {
    "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
  }
  ```
  **Po:**
  ```json
  "android": {
    "enableMinifyInReleaseBuilds": true,
    "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }\n-keep class expo.modules.notifications.** { *; }\n-keep class expo.modules.ExpoModulesPackageList { *; }\n-keep class expo.modules.adapters.react.apploader.RNHeadlessAppLoader { *; }\n-keep interface expo.modules.kotlin.records.Record\n-keep public class * extends java.lang.Exception\n-keepattributes SourceFile,LineNumberTable\n-renamesourcefileattribute SourceFile"
  }
  ```
  | # | Pravidlo | Proč |
  |---|---|---|
  | 1 | `consent_sdk.**` | stávající (od 2026-06), drží interní třídy UMP souhlasu; do teď bez účinku, od teď důležité |
  | 2 | 🚨 `expo.modules.notifications.**` | **kritické** – pravidlo knihovny se nepoužije (§3.3); bez něj přestanou chodit připomínky uložené před aktualizací |
  | 3 | `ExpoModulesPackageList` | načítá se reflexí; bez něj hrozí appka bez Expo modulů |
  | 4 | `RNHeadlessAppLoader` | jméno je jen v `meta-data` manifestu; levná pojistka |
  | 5 | `interface …records.Record` | prázdné rozhraní, které Expo testuje za běhu; pojistka hlavně pro optimalizaci (V2) |
  | 6 | `* extends java.lang.Exception` | doporučení Crashlytics – čitelné názvy výjimek v titulcích issues |
  | 7 | `-keepattributes SourceFile,LineNumberTable` | čísla řádků ve stack trace (Crashlytics, Play vitals) |
  | 8 | `-renamesourcefileattribute SourceFile` | v trace nebude skutečný název souboru (doporučení Androidu; mapping to přeloží) |
- [x] 🤖 **Nepřidávat** `enableShrinkResourcesInReleaseBuilds` (ČÁST D). Nesahat na `ios` blok.

#### A9 – ~~Paměť Gradlu~~ – ZRUŠENO (viz R-2)
EAS si paměť nastavuje sám a přebije `gradle.properties`; lokálně se předává parametrem (fáze 2).
Žádný plugin, žádný test.

#### A10 – Plugin pro optimalizaci (V2; napsat vždy, zaregistrovat podle R-8 / A22)

> ⚠️ **Aktualizace po generálce (2026-10-17):** kód níže je původní V2. Skutečný
> `plugins/withR8Optimization.js` je už **V2''** – navíc kopíruje `plugins/r8/proguard-optimize-base.pro`
> (optimalizační profil AGP bez `-allowaccessmodification`) a zapíná R8 compat mode. **Zůstává
> nezaregistrovaný** (rozbité Records, fáze 8); test to hlídá.
- [x] 🤖 Nový `plugins/withR8Optimization.js`:
  ```js
  /**
   * Expo Config Plugin: turns on R8 optimization for Android release builds.
   *
   * 1. Swaps the template's proguard-android.txt (contains -dontoptimize) for
   *    proguard-android-optimize.txt. Google Play requires >= 25 % optimization,
   *    obfuscation AND shrinking from February 2027; -dontoptimize keeps optimization at 0 %.
   * 2. Raises AGP from 8.12.0 (React Native's version catalog) to 8.12.3, the latest 8.12
   *    patch. Play reads the scores from r8.json only for builds made with the latest AGP
   *    patch, and 8.12.3 bundles R8 8.12.22, which fixes the r8.json stats overflow of
   *    R8 8.12.14. Gradle resolves the version conflict upwards, so this never downgrades AGP.
   *    Never raise AGP without (1): Play would then measure 0 % optimization.
   * Remove both once the Expo template ships them (see the template tripwire test).
   */
  const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

  const AGP_VERSION = '8.12.3';
  const DEFAULT_FILE = 'getDefaultProguardFile("proguard-android.txt")';
  const OPTIMIZE_FILE = 'getDefaultProguardFile("proguard-android-optimize.txt")';
  const AGP_CLASSPATH = "classpath('com.android.tools.build:gradle')";
  const AGP_CLASSPATH_RAISED = `classpath('com.android.tools.build:gradle:${AGP_VERSION}')`;

  function useOptimizeFile(contents) {
    if (contents.includes(OPTIMIZE_FILE)) return contents;
    if (!contents.includes(DEFAULT_FILE)) {
      throw new Error(
        'withR8Optimization: proguard file line not found in android/app/build.gradle. ' +
          'The Expo template changed — re-check R8 setup (technical-guides:Android-Release-Build.md).'
      );
    }
    return contents.replace(DEFAULT_FILE, OPTIMIZE_FILE);
  }

  function raiseAgp(contents) {
    if (contents.includes(AGP_CLASSPATH_RAISED)) return contents;
    if (!contents.includes(AGP_CLASSPATH)) {
      throw new Error(
        'withR8Optimization: versionless AGP classpath not found in android/build.gradle. ' +
          'The Expo template changed — re-check the AGP version (technical-guides:Android-Release-Build.md).'
      );
    }
    return contents.replace(AGP_CLASSPATH, AGP_CLASSPATH_RAISED);
  }

  module.exports = function withR8Optimization(config) {
    config = withAppBuildGradle(config, (config) => {
      config.modResults.contents = useOptimizeFile(config.modResults.contents);
      return config;
    });
    return withProjectBuildGradle(config, (config) => {
      config.modResults.contents = raiseAgp(config.modResults.contents);
      return config;
    });
  };
  module.exports.useOptimizeFile = useOptimizeFile;
  module.exports.raiseAgp = raiseAgp;
  ```
  **Proč AGP 8.12.3 a ne připnutí samotného R8** (2. revize, ověřeno): R8 je zabalené uvnitř AGP, Play
  pozná „poslední patch" podle verze AGP zapsané v AAB a AGP 8.12.3 už R8 8.12.22 obsahuje – jedno AGP,
  jedno R8, žádné pořadí na classpath. Je to opravný patch téže řady 8.12 (stejné požadavky na Gradle).

#### A11 – Regresní testy (ochrana proti tichému rozbití)
- [x] 🤖 Nový `__tests__/config/androidReleaseBuild.test.ts`:
  - `app.json`: `expo-build-properties` → `android.enableMinifyInReleaseBuilds === true`
  - `extraProguardRules` obsahuje **všech 8 pravidel z A8**, každé zvlášť; u notifikací chybová
    hláška vysvětlí proč (serializované připomínky)
  - `useOptimizeFile` nad **skutečnou šablonou** (`tar -xzOf node_modules/expo/template.tgz
    package/android/app/build.gradle`) → obsahuje optimize soubor, ne výchozí; opakované volání nic
    nemění; neznámý obsah → vyhodí chybu
  - `raiseAgp` nad skutečnou šablonou `package/android/build.gradle` → AGP má verzi 8.12.3 a nic jiného
    se nezměnilo; opakované volání nic nemění; neznámý obsah → vyhodí chybu
  - **Pojistka na upgrade Expa:** `agp` v `node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml`
    je `8.12.0` a šablona obsahuje `proguard-android.txt` – když se to změní, test spadne s hláškou
    „Expo/AGP se změnilo – přehodnotit zvednutí AGP a výměnu souboru (šablona je možná už má sama)"
  - ⏳ **(čeká na A22, jen pokud V2)** v `plugins` je `./plugins/withR8Optimization` – dopsat do testu
    při registraci pluginu
  - `orientation` je stále `"portrait"` (změna patří do ČÁSTI C)
  - ✅ *Hotovo 2026-10-17: 16 testů. Zapojení pluginu se testuje přes mock `@expo/config-plugins`,
    šablona se čte přes `execFileSync('tar', …)`.*
- [x] 🤖 **Ověřit, že testy hlídají** (pravidlo 9): dočasně `enableMinifyInReleaseBuilds: false` →
      musí spadnout; smazat pravidlo 2 → musí spadnout; v kopii šablony změnit řádek proguardu →
      `useOptimizeFile` musí vyhodit; změnit verzi AGP v kopii → pojistka musí spadnout. Vrátit → projde.
      Výstupy uvést v hlášení.
      ✅ *2026-10-17: R8 vypnuté → 1 test červený; bez pravidla 2 → červený s vysvětlením;
      AGP od RN 8.12.3 → pojistka červená; plugin bez zvednutí AGP → 2 testy červené. Vše vráceno
      (`cmp` shodné), 16/16 zelených. Neznámá šablona je pokrytá testem „fails loudly".*

#### A12 – Verze
- [x] 🤖 (R-4) `app.json` → `"version": "7.0.1"` → `"7.0.2"`. `versionCode` neměnit – řídí ho EAS
      (`appVersionSource: remote`, `autoIncrement`). Číslo verze je společné s iOS – další iOS vydání
      bude 7.0.2+, což nevadí.

#### A13 – Kontrola bez buildu
- [x] 🤖 `npx expo config --type prebuild --json` → načte se bez chyby, nové hodnoty jsou vidět.
- [x] 🤖 `npx tsc --noEmit` → projde.
- [x] 🤖 `PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npm test` → projde. Počet sad/testů do hlášení.
      ✅ *2026-10-17: `expo config` → verze 7.0.2, minify `true`, 8 pravidel, plugin zatím nezaregistrovaný;
      `tsc` OK; `npm test` 58 sad / 841 testů zelených.*

#### A14 – Průvodce (pravidlo 10, stejný commit) – pokud R-7
- [x] 🤖 Zkontrolovat, že podobný průvodce neexistuje (`ls technical-guides*`, `grep -i -l r8`).
- [x] 🤖 Založit `technical-guides:Android-Release-Build.md` podle kostry
      (`technical-guides:Startup-Orchestrator.md`):
  1. 🏃 CO TOHLE OBSAHUJE / 🔧 KDY TOHLE POUŽÍVAT (sahání na `expo-build-properties` nebo pluginy
     buildu, nová nativní knihovna, upgrade Expo SDK, varování v Play Console)
  2. Proč systém existuje (Play: 3 metriky ≥ 25 %, únor 2027)
  3. 🚨 KRITICKÁ PRAVIDLA (✅/❌ + Proč):
     - R8 zůstává zapnuté; nikdy ho „na zkoušku" nevypínat v produkci
     - keep pravidla se nemažou, i když „vypadají zbytečně" (tabulka z A8)
     - novější AGP nikdy bez optimalizace (Play by ukázal optimalizaci 0 %); při upgradu Expa
       zvednutí AGP a výměnu souboru přehodnotit (pojistka v testu A11)
     - nová nativní knihovna → reflexe / JNI / jména tříd ve stringu nebo manifestu / Java serializace?
       dodává pravidla **a opravdu se použijí**? (Expo moduly s `publication` jsou hotový AAR →
       `unzip -l <aar> | grep proguard`; případ expo-notifications) → release build + logcat povinně
     - keep jen konkrétní třídy, nikdy `-keep class com.** { *; }` (shodí skóre)
     - R8 jde otestovat jen v release buildu (ne přes `npm start`)
  4. Popis: co R8 dělá, kde je konfigurace (app.json + plugin `withR8Optimization`), CNG, mapping →
     Crashlytics + Play, R8 uvnitř AGP a chyba statistik R8 8.12.14, „poslední patch AGP", měření
     (`mapping.txt`, `r8.json`, `app-metadata.properties`), paměť Gradlu (EAS ji řídí sám přes `GRADLE_OPTS`)
  5. ⚠️ NEBEZPEČNÉ ZÓNY: reflexe, `meta-data`, JNI bez `@DoNotStrip`, Java serializace dat přes
     aktualizace, široké `-keep`, `-dontwarn` naslepo, `-dontobfuscate`/`-dontshrink` z knihoven
  6. Testování: generálka (fáze 2), kontrola AAB (A25), checklist (A29), matice (A30)
  7. Co se NESMÍ rozbít (tabulka ze sekce 2)
  8. Device scénáře (Play internal testing, emulátor, podpisy, Force stop maže alarmy, debug režim)
  9. GOLDEN RULE: *„Každá nativní změna = release build + logcat + test přes aktualizaci, než to uvidí uživatel."*
- [x] 🤖 Ověřit všechny odkazy do kódu v průvodci.
- [x] 🤖 `technical-guides:Crashlytics.md` → bod 4 „EAS build nahrává mapping…" přepsat na konkrétní
      ověření (A24/A25) + poznámka „pád při nativním startu před souhlasem Crashlytics nevidí → Play vitals".
- [x] 🤖 `technical-guides:Notifications.md` → nebezpečné zóny: „připomínky jsou v nativní vrstvě
      uložené Java serializací; keep `expo.modules.notifications.**` nesmí z `app.json` zmizet;
      Force stop maže alarmy (pozor při testech)".
- [x] 🤖 `technical-guides:AdMob.md` → „keep pro UMP (`consent_sdk`) – nemazat" + „emulátor = testovací
      zařízení automaticky, fyzický telefon přidat v AdMob".
- [x] 🤖 `technical-guides.md` (index), pokud obsahuje seznam průvodců → přidat odkaz.
      ✅ *2026-10-17: nový průvodce hotový; Crashlytics.md (body 4–5), Notifications.md (sekce
      „Android release build (R8)"), AdMob.md (Pre-Production Checklist +3 body), technical-guides.md
      (sekce „Android release build (R8)" za Crashlytics).*

### Fáze 2 – Generálka: lokální buildy V0 / V1 / V2 + emulátor (🤖 Claude, 1–2 posezení, pokud R-3)

> **Bezpečnost:** lokální buildy jsou podepsané **debug klíčem** → **nikdy na telefon s appkou z Play**
> (jiný podpis → instalace selže, nebo by se musela odinstalovat = ztráta dat). **Jen do emulátoru.**
> Na Macu s 8 GB RAM nikdy současně build a emulátor. Artefakty ukládat do scratchpadu
> (`…/scratchpad/r8/v0|v1|v2/`), ne do repa.

#### A15 – Prostředí
- [x] 🤖 JDK 17 (`JAVA_HOME` = temurin-17 ✅), Android SDK ✅, `adb` ✅, Node v20.20.2 ✅.
- [x] 🤖 **Žádný z `.env`, `.env.local`, `.env.production`, `.env.production.local` neexistuje**
      (nebo neobsahuje `EXPO_PUBLIC_ENABLE_MARKETING_DEMO=true`) – jinak by lokální build měl zapnutý
      marketingový demo režim a nechoval by se jako produkce (`.env.example` Expo nenačítá). Pokud
      některý existuje: dočasně přejmenovat a po generálce vrátit (říct Petrovi).
- [x] 🤖 `git status` čistý kromě změn z fáze 1 (ať se dá poznat, co prebuild případně změnil).

#### A16 – Prebuild a kontrola vygenerovaných souborů
- [x] 🤖 `npx expo prebuild --platform android --no-install --clean` (vytvoří `android/`, je v `.gitignore`).
      Pak `git status` / `git diff` – pokud prebuild sáhl na `package.json`, `.gitignore` apod., vrátit.
- [x] 🤖 Zkontrolovat:
  - `android/gradle.properties`: `android.enableMinifyInReleaseBuilds=true`
  - `android/app/proguard-rules.pro`: všech 8 pravidel
  - `android/app/build.gradle`: `apply plugin: 'com.google.firebase.crashlytics'`; (zatím) `proguard-android.txt`
- [x] 🤖 Skutečná verze AGP: `cd android && ./gradlew buildEnvironment | grep "com.android.tools.build:gradle:"`
      → zapsat `____` (V1 čekám 8.12.0; R8 je uvnitř AGP, jeho verzi ukáže hlavička `mapping.txt`).

**Společné parametry lokálních buildů** (šablona má jen 512 MB metaspace, na kterých jinému týmu první
R8 build spadl; Mac má 8 GB a Kotlin daemon dědí nastavení Gradlu; EAS si paměť nastavuje sám):
`-PreactNativeArchitectures=arm64-v8a -Dorg.gradle.jvmargs="-Xmx2560m -XX:MaxMetaspaceSize=1g" -Pkotlin.compiler.execution.strategy=in-process`
(Na pozadí. Když spadne na paměť **Macu** → zastavit generálku, pokračovat přes EAS.)

#### A17 – Build V0 (bez R8, „jako 7.0.1")
- [x] 🤖 `./gradlew :app:assembleRelease -Pandroid.enableMinifyInReleaseBuilds=false <společné parametry>`
      → zkopírovat APK do `r8/v0/`.

#### A18 – Build V1 (R8, výchozí proguard soubor) + měření
- [x] 🤖 `./gradlew :app:assembleRelease :app:bundleRelease <společné parametry>` → APK, AAB,
      `app/build/outputs/mapping/release/` (mapping.txt, configuration.txt, …) do `r8/v1/`.
  - **„Missing classes detected while running R8"** → přečíst `missing_rules.txt`, u každé třídy zjistit
    proč chybí (volitelná závislost knihovny?), teprve pak cílené `-dontwarn` do A8 (+ test + průvodce).
    Nikdy `-dontwarn **`.
  - Spadne-li `uploadCrashlyticsMappingFileRelease` (síť/oprávnění) → poznamenat; řešit před EAS (A24).
- [x] 🤖 **Měření V1:**
  ```bash
  # velikost DEX
  unzip -l app-release.aab | grep -E '\.dex$' | awk '{s+=$1} END {printf "%.1f MB DEX\n", s/1048576}'
  # mapping v AAB (Play ho bere odtud)
  unzip -l app-release.aab | grep -i -E 'proguard\.map|obfuscation'
  # odhad obfuskace z mapping.txt (podíl přejmenovaných tříd)
  grep -E '^[^ #].* -> .*:$' mapping.txt | awk -F' -> ' '{n=$2; sub(/:$/,"",n); t++; if ($1!=n) r++} END {printf "%d/%d tříd přejmenováno = %.1f %%\n", r, t, 100*r/t}'
  # r8.json (u R8 8.12.14 čekám nesmyslné nebo chybějící statistiky – jen zapsat)
  unzip -p app-release.aab BUNDLE-METADATA/com.android.tools/r8.json | python3 -m json.tool
  # sloučená konfigurace: žádné globální vypínače od knihoven, žádné obří keep
  grep -n -E '^-dontobfuscate|^-dontshrink|^-dontoptimize' configuration.txt
  grep -nE '^-keep(,[a-z]+)* +class +(\*\*?|[a-z]+(\.[a-z]+)*\.\*\*) *\{' configuration.txt
  ```
  Široká pravidla porovnat s očekávanými (RN `com.facebook.react.bridge.**` a spol., Reanimated/Worklets,
  naše notifikace, UMP) – každý neznámý řádek dohledat, odkud je.
  Očekávání V1: `-dontoptimize` ano (ze šablony), `-dontobfuscate`/`-dontshrink` **ne**;
  obfuskace z mappingu **≥ 50 %**.
- [x] 🤖 **Verze R8, která build opravdu udělala** – hlavička `mapping.txt`:
  `head -5 mapping.txt` → řádek `# compiler_version: …` (V1 čekám 8.12.14). Zapsat `____`.
- [x] 🤖 **Keep pravidla opravdu platí** (v `mapping.txt`):
  ```bash
  # musí být > 0 (třídy notifikací v appce jsou a mapping je zná)
  grep -c -E '^expo\.modules\.notifications\..* -> ' mapping.txt
  # musí být prázdné (žádná SKUTEČNÁ třída se nepřejmenovala; třídy vyrobené R8 –
  # $$ExternalSynthetic…, -IA, -$$Nest, $-CC – se nepočítají, ve vstupu nejsou)
  grep -E '^expo\.modules\.notifications\..* -> ' mapping.txt | awk -F' -> ' '{n=$2; sub(/:$/,"",n); if ($1!=n && $1 !~ /\$\$ExternalSynthetic|-IA$|-\$\$Nest|\$-CC$/) print}'
  # musí vypsat řádky „X -> X:" (jméno beze změny)
  grep -E '^expo\.modules\.(ExpoModulesPackageList|kotlin\.records\.Record) -> ' mapping.txt
  ```

#### A19 – Build V2 (optimalizace + AGP 8.12.3) + měření
- [x] 🤖 Dočasně zaregistrovat `./plugins/withR8Optimization` v `app.json` → `npx expo prebuild
      --platform android --no-install --clean` → zkontrolovat `android/app/build.gradle`
      (`proguard-android-optimize.txt`) a `android/build.gradle`
      (`classpath('com.android.tools.build:gradle:8.12.3')`) →
      `./gradlew buildEnvironment | grep "com.android.tools.build:gradle:"` ukazuje `8.12.0 -> 8.12.3`.
- [x] 🤖 `./gradlew :app:assembleRelease :app:bundleRelease <společné parametry>` → do `r8/v2/`.
- [x] 🤖 **Měření V2:** stejné příkazy jako V1, navíc `r8.json` musí mít platné statistiky:
      `isOptimizationsEnabled: true`, a **100 − noObfuscationPercentage**, **100 − noOptimizationPercentage**,
      **100 − noShrinkingPercentage** každé **≥ 30 %** (Play limit 25 % + rezerva). `configuration.txt`
      **bez** `-dontoptimize` (optimize soubor přidává `-allowaccessmodification`). Hlavička
      `mapping.txt`: `# compiler_version: 8.12.22`. V AAB
      `unzip -p app-release.aab BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties`
      → `androidGradlePluginVersion=8.12.3` (podle toho Play pozná „poslední patch"). Keep kontroly
      z A18 znovu.
  - Pokud je některá metrika pod 30 %: najít největší „připnuté" balíky (`-printseeds` do
    `extraProguardRules` jen lokálně) a nejdřív zúžit **naše** pravidla; pravidla knihoven neměnit naslepo.

✅ **Výsledky generálky A15–A19 (2026-10-17):**
- Prostředí OK; žádný `.env*` (jen `.env.example`). Disk: uvolněno 9 → 26 GB (Petr schválil smazání
  cache Xcode/npm/CocoaPods, emulátoru Medium_Phone a obrazu Androidu 36.1).
- Prebuild nezměnil nic mimo `android/`. Vygenerované soubory OK (minify `true`, 8 pravidel, plugin Crashlytics).
- Buildy: V0 4,5 min, V1 1,8 min, V2 10 min (nové AGP → nativní kód znovu). Žádné `Missing classes`,
  žádné OOM; `:app:uploadCrashlyticsMappingFileRelease` proběhl u V1 i V2.

| | V0 | V1 | V2 |
|---|---|---|---|
| APK (jen arm64) | 61,2 MB | 54,4 MB | 53,0 MB |
| DEX | 33,7 MB | 15,0 MB | **10,4 MB** |
| AGP / R8 (z AAB a hlavičky mappingu) | 8.12.0 / – | 8.12.0 / 8.12.14 | **8.12.3 / 8.12.22** |
| Obfuskace (`r8.json` / odhad z mappingu) | – | 90,8 % / 92,0 % | **83,2 % / 85,7 %** |
| Optimalizace (`r8.json`) | – | 0,0 % | **82,8 %** |
| Zmenšení (`r8.json`) | – | 90,8 % | **83,1 %** |
| Notifikace: přejmenované **skutečné** třídy | – | 0 z 303 | 0 z 255 |
| `ExpoModulesPackageList` / `Record` / `RNHeadlessAppLoader` | – | jméno zachováno | jméno zachováno |
| `configuration.txt` | – | `-dontoptimize` (šablona) | `-allowaccessmodification`, bez `-dontoptimize` |

- `r8.json` z R8 8.12.14 u nás **nepřetekl** (čísla dávají smysl), Play ho ale u AGP 8.12.0 stejně nečte.
- Přejmenované třídy v balíku notifikací (58 u V1, 10 u V2) jsou jen třídy, které **vyrobil sám R8**
  (`$$ExternalSynthetic…`, `-IA`). Ve vstupu nejsou, keep je chytit nemůže a nic se do nich neukládá.
  Všechny serializované třídy (`NotificationRequest`, `NotificationContent`, triggery, rozhraní) mají
  jméno beze změny. Kontrola v A18 je proto upravená (níže) a měřicí skript je rozlišuje.
- Široká keep pravidla v `configuration.txt` jsou jen očekávaná (Reanimated, Worklets, RN
  bridge/turbomodule/fabric/jni, naše notifikace).

#### A20 – Smoke test v emulátoru (V1 i V2)
Pro **V0 (výchozí „šum")**, V1 a V2 na `Pixel_7` (API 36), vždy čistá instalace:
```bash
emulator -avd Pixel_7 -no-snapshot-load &      # na pozadí, až po dokončení buildu
adb wait-for-device shell 'while [ -z "$(getprop sys.boot_completed)" ]; do sleep 1; done'
adb uninstall com.petrturek.selfrise
adb install r8/v1/app-release.apk
adb shell setprop debug.firebase.analytics.app com.petrturek.selfrise   # PŘED prvním spuštěním
adb logcat -c && adb logcat -b crash -c
adb shell monkey -p com.petrturek.selfrise -c android.intent.category.LAUNCHER 1
PID=$(adb shell pidof -s com.petrturek.selfrise)
# … průchod appkou (níže) …
# chyby jen z procesu appky – cizí procesy (Play služby, ART) hlásí ClassNotFound běžně:
adb logcat -d --pid=$PID | grep -E "ClassNotFound|NoSuchMethod|NoSuchField|NoClassDefFound|InvalidClassException|AbstractMethodError|VerifyError|Couldn't get expo"
# pády (crash buffer) – jen bloky s naší appkou:
adb logcat -d -b crash | grep -B2 -A20 "com.petrturek.selfrise"
```
Počítají se jen řádky **navíc oproti V0**. Když proces během průchodu spadne, PID se změní – pád
zachytí crash buffer.
- [x] 🤖 Průchod (řídím přes `adb shell input` + screenshoty `adb exec-out screencap -p`, které si
      prohlížím): start a splash → onboarding (notifikace povolit) → souhlas UMP → vytvořit návyk →
      odškrtnout → 3 zápisy do deníku → cíl → Nastavení: přepnout vzhled a jazyk, nativní **výběr času**
      připomínky, „Zásady ochrany soukromí" (prohlížeč) → zavřít z přehledu aplikací → otevřít →
      data, vzhled i jazyk zůstaly → banner se načte (štítek „Test Ad"). `adb shell dumpsys alarm |
      grep -A2 selfrise` → naplánované alarmy existují.
      **Kritérium:** oproti V0 žádné nové řádky z procesu appky, crash buffer bez naší appky, žádná
      prázdná obrazovka.
- [x] 🤖 **Skia** se kreslí jen v `StarLevelChangeModal` (přelom měsíce, těžko vyvolat). Načtení modulu
      pokrývá start; kreslení vědomě netestujeme (JNI s `@DoNotStrip`, riziko nízké).

#### A21 – Test přežití připomínek přes aktualizaci (nejdůležitější test R8)
Pro **V0 → V1** i **V0 → V2** (stejný debug podpis, takže aktualizace projde):
1. `adb uninstall com.petrturek.selfrise` → `adb install r8/v0/app-release.apk` → debug režim Firebase
   → `adb shell appops set com.petrturek.selfrise SCHEDULE_EXACT_ALARM allow` (přesné alarmy –
   jinak může připomínka přijít o desítky minut později a srazit se s restartem v kroku 6) →
   spustit → onboarding s **povolenými notifikacemi** → **nechat 1 návyk nesplněný** (aby existovala
   i večerní připomínka).
2. Nastavení → **odpolední připomínka na teď + 15 min**, **večerní na teď + 40 min**.
3. `adb shell dumpsys alarm | grep -A2 selfrise` → alarmy existují. Appku jen zavřít z přehledu
   aplikací. ⚠️ **Nikdy `adb shell am force-stop` ani „Vynutit ukončení"** – zruší alarmy a test by lhal.
4. `adb install -r r8/v1/app-release.apk` (resp. v2) → **appku neotevírat**.
5. Do ~15 min přijde **odpolední** připomínka. Ověřit `adb shell dumpsys notification --noredact |
   grep -i selfrise` nebo screenshot lišty. V logu knihovny žádné „An exception occurred while
   triggering notification" (`adb logcat -d -s expo-notifications`).
6. `adb reboot` → počkat na `sys.boot_completed` (příkaz z A20) → znovu debug režim (`setprop`;
   proces appky se při startu systému spustí dřív – pár událostí bez debug režimu je přijatelných)
   → **večerní** připomínka přijde (cesta po restartu, `BOOT_COMPLETED`), appka stále neotevřená.
7. Teprve teď appku otevřít → ťuknutí na připomínku otevře správnou obrazovku.
- [x] 🤖 V0 → V1: ✅ (20:58) · V0 → V2: ❌ (připomínka smazána) · V0 → V2'': ✅ (21:18 + po restartu 21:40)
- Kontrolní pokus, kdyby připomínka nepřišla: stejný postup V0 → V0. Když nepřijde ani tam, je to
  emulátor/systém, ne R8.

#### A22 – Rozhodnutí V1/V2, úklid, hlášení
- [x] 🤖 Tabulka pro Petra: V1 vs V2 – build OK, DEX MB, obfuskace (mapping), 3 metriky z `r8.json`
      (jen V2), smoke test, přežití připomínek, nové `-dontwarn`.
- [x] 🤝 **R-8 finálně:** (a) V2 prošla vším → V2 do 7.0.2 (registrace pluginu zůstane, doplnit test
      z A11); jinak V1 do 7.0.2 a V2 do fáze 8 (plugin zůstane v repu nezaregistrovaný, test ho hlídá).
      Pokud generálka vůbec neproběhla (Mac nestačil) → V1.
- [x] 🤖 Úklid: v emulátoru `adb uninstall com.petrturek.selfrise` a debug režim `.none.`;
      **smazat `android/`** (CNG zůstane čisté); `.env` vrátit, pokud se přejmenovával;
      `git status` = jen zamýšlené změny.

✅ **Výsledky A20–A22 (2026-10-17, emulátor Pixel_7, Android 16):**

| Test | V1 (R8) | V2 (R8 + optimalizace, full mode) | V2'' (optimalizace, compat mode, bez změn přístupu) |
|---|---|---|---|
| Uložené třídy připomínek v DEX shodné s V0 | ✅ | ❌ (`protected`→`public` u `NotificationRequest`, `ChannelAwareTrigger`) | ✅ |
| Připomínka po aktualizaci bez otevření appky | ✅ 20:58 | ❌ **smazána**: `InvalidClassException … serialVersionUID` | ✅ 21:18 |
| Připomínka po restartu (`BOOT_COMPLETED`, ~2 min zpoždění systému) | (neověřeno – shodný DEX) | – | ✅ 21:40 |
| Otevření appky (databáze, převod parametrů Expo modulů) | ✅ | (neotevřeno) | ❌ **databáze se neotevře**: `cannot be cast to OpenDatabaseOptions` (NPE na `Field.key()`) |
| Čistá instalace: souhlas UMP, úvod, návyk, cíl ze šablony | ✅ | – | – |
| Hlavní toky: odškrtnutí návyku, deník, tmavý vzhled, výběr času, zásady soukromí (prohlížeč), „Nastavení soukromí" (UMP, i odmítnutí), banner | ✅ bez chyb v logu | – | – |
| Metriky (`r8.json`): obfuskace / optimalizace / zmenšení | 90,8 / **0** / 90,8 % | 83,2 / 82,8 / 83,1 % | 87,9 / 86,9 / 87,9 % |

- **Rozhodnutí R-8 (podle pravidla „V2 jen když projde vším"): 7.0.2 = V1.** Dnešní varování Play
  (obfuskace) V1 odstraní; optimalizace jde do fáze 8.
- Neotestováno v generálce (zůstává na A29): rewarded reklama (zmrzlá série), přetažení návyků,
  statistiky, měsíční výzva – nativní moduly za nimi jsou ve V1 bez optimalizace a jejich třídy
  se nemění jinak než přejmenováním.
- Úklid hotový: aplikace z emulátoru odinstalovaná, debug režim vypnutý, emulátor vypnutý, `android/`
  smazaný, plugin z `app.json` odregistrovaný (test hlídá, že zůstane odregistrovaný).
- Pozn.: jeden pokus V2'' byl neplatný – při ručním připsání řádku do `gradle.properties` se slepil
  s `enableMinifyInReleaseBuilds=true` a R8 se vypnulo; odhaleno podle velikosti DEX. Plugin zapisuje
  vlastnosti správně (ověřeno buildem přes plugin: DEX bajt po bajtu shodný s V2'').

### Fáze 3 – Commit (🤖 jen na výslovný pokyn „commitni")
- [ ] **A23** 🤖 V commitu jen: `app.json`, `plugins/withR8Optimization.js`,
      `__tests__/config/androidReleaseBuild.test.ts`, průvodci, tento plán, `projectplan.md`. Žádné `android/`.
      Commit „Enable R8 for Android release builds (7.0.2)" + push.

### Fáze 4 – EAS build a kontrola AAB (🤝, ~1 h, většinou čekání)

- [ ] **A24** 👤/🤖 `eas build --platform android --profile production` (Petr, nebo Claude na výslovný pokyn).
      V logu na expo.dev (*Run gradlew*) potvrdit:
  - `> Task :app:minifyReleaseWithR8` proběhl
  - `> Task :app:uploadCrashlyticsMappingFileRelease` proběhl bez chyby
  - (V2) AGP 8.12.3; R8 8.12.22 definitivně ověří hlavička `mapping.txt` v A25
  - žádné `OutOfMemoryError`, žádné `Missing classes`; verze 7.0.2 a nový versionCode
  - 👤 stáhnout `.aab` (*Builds* → build → *Download*) a dát cestu Claudovi
- [ ] **A25** 🤖 **Kontrola AAB před nahráním** – stejná měření jako A18 (V1) / A19 (V2) nad EAS AAB;
      `mapping.txt` vytáhnout z AAB (`unzip -p app.aab BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map > mapping.txt`).
      **Go:** obfuskace z mappingu ≥ 50 %; keep kontroly z A18 v pořádku; (V2) `compiler_version: 8.12.22`,
      `androidGradlePluginVersion=8.12.3` a všechny 3 metriky z `r8.json` ≥ 30 %; mapping v AAB; DEX
      výrazně menší než A1; čísla odpovídají generálce (± pár %). **Jinak stop a zjistit proč.**
- Release notes (EN/DE/ES) až podle naměřeného: např. „Under-the-hood improvements and a smaller app."
  – „smaller" jen pokud A25 potvrdí menší AAB.

### Fáze 5 – Interní testování (👤 Petr, ~2 h rozložené do 2 dnů)

#### A26 – Nahrání
- [ ] 👤 Do **Internal testing** (ne rovnou do produkce):
  - ručně: *Testing* → *Internal testing* → *Create new release* → nahrát `.aab` → release notes →
    *Next* → *Save and publish*. **Při nahrání se nesmí objevit varování „There is no deobfuscation
    file associated with this App Bundle"** (mapping je v AAB) – kdyby ano, nahrát `mapping.txt` ručně
    (*App bundle explorer* → bundle → *Downloads* → *Upload deobfuscation file*), viz §8.
  - nebo (R-5) `eas submit -p android --profile production --id <ID buildu z A24>`
    (**ne `--latest`** – vzal by nejnovější Android build z jakéhokoli profilu)

#### A27 – Kontroly v Play Console (👤, než začne ruční test)
- [ ] 👤 *App bundle explorer* → bundle 7.0.2 → *Details* → **App optimization**:
      obf. `____ %`, opt. `____`, zmenš. `____`. **Očekávání:** V1 → obfuskace ≥ 25 % a u ostatních „-"
      (chyba R8 8.12.14 – v pořádku); V2 → **všechny tři čísla ≥ 25 %**. Kdyby u V2 Play i tak ukazoval
      „-", není to blokátor 7.0.2 (dnešní varování je jen o obfuskaci) → zkontrolovat, jestli Google
      mezitím nevydal novější patch AGP 8.12.x (Play chce „poslední patch") → A40.
- [ ] 👤 Stejný bundle → *Downloads* → v *Assets* je **ReTrace mapping file**.
- [ ] 👤 *Release overview* interního vydání → **žádné** varování „App optimization below threshold".
- [ ] 👤 *Pre-launch report* (pokud se spustil, obvykle do 1 h): *Stability* 0 pádů, *Screenshots*
      bez prázdných obrazovek. **Zapsat datum** `____` (jeho testovací zařízení se můžou objevit
      v analytice jako nové instalace → v trychtýři odečíst).

#### A28 – Příprava testu
- **Zařízení (R-6):**
  - **Telefon testerky s produkční 7.0.1 z Play** → **průchod 1 = aktualizace s daty** podle
    **návodu pro testerku** (příloha). Výsledky (screenshoty, časy připomínek) posílá Petrovi.
    Jen přes Obchod Play (*Aktualizovat*), nikdy instalací APK. Logcat z jejího telefonu nebude –
    případné pády hlásí screenshotem a časem.
  - **Emulátor `Pixel_7` s Google Play**, přihlášený Petrovým účtem z A4 → **průchod 2 = čisté
    instalace** (bloky 1–10) – nepočítají se do analytiky (debug režim) a reklamy jsou automaticky
    testovací. Velkou část může udělat **Claude** (ovládá emulátor přes `adb` a screenshoty,
    sleduje logcat); Petr jen jednou přihlásí svůj Google účet v emulátoru a projde, co Claude
    neumí posoudit (vzhled, plynulost animací).
  - Bez telefonu: v emulátoru nainstalovat **7.0.1 z Play ještě před A26** (s debug režimem),
    používat, a teprve po A26 aktualizovat na 7.0.2 = průchod 1. ⚠️ Tester dostane z Play vždy
    **nejvyšší** verzi – po A26 už jeho účet 7.0.1 nenainstaluje (leda jiný účet, který není tester).
- **Podpisy a data:** dev build a appka z Play mají jiný podpis. Telefon s dev buildem
  `com.petrturek.selfrise` → Play verzi nepůjde nainstalovat bez odinstalace = **ztráta dat dev buildu**.
- **Debug režim Firebase PŘED prvním spuštěním každé čisté instalace** (a znovu po restartu):
  `adb shell setprop debug.firebase.analytics.app com.petrturek.selfrise` → Firebase → *DebugView*.
- **Logcat:** telefon/emulátor připojený k Macu → Claude sleduje jen proces appky a crash buffer
  (postup z A20; cizí procesy hlásí `ClassNotFound` běžně). Telefon bez kabelu → stačí sledovat pády.
- **Crashlytics:** lokální buildy z generálky mají versionCode 1 a hlásí se taky jako 7.0.2 → při
  kontrole filtrovat podle versionCode z EAS (A24).
- **Změna času:** v noci **24./25. 10. 2026** se posouvá čas → test připomínek přes tuto noc
  nedělat (posun o hodinu by vypadal jako chyba).
- **Nikdy „Vynutit ukončení"** (Nastavení → Aplikace → SelfRise) během testu připomínek.
- Při jakékoli chybě: screenshot + čas + co jsem udělal → Claudovi. **Nepokračovat do produkce**, dokud
  není vysvětlená.

#### A29 – Ruční testovací checklist

**Blok 1 – Start a základ** *(průchod 1 i 2)*
- [ ] Splash s logem, pak obsah; žádný bílý/černý prázdný screen
- [ ] Fonty a **ikony** (tab bar, tlačítka) vypadají jako v 7.0.1 – žádné čtverečky ani systémový font
- [ ] Jazyk podle telefonu (emulátor: přepnout systém do DE → DE texty; ES → ES; jiný → EN)
- [ ] Zabít appku z přehledu aplikací → otevřít → naběhne normálně
- [ ] Do pozadí na 1 min → zpět → pokračuje na stejném místě
- [ ] Nastavení → vzhled **světlý / tmavý / podle systému** → celá appka se přebarví; „podle systému"
      následuje přepnutí v telefonu
- [ ] Nastavení → haptika vypnout/zapnout → vibrace se řídí přepínačem
- [ ] Nastavení → jazyk EN/DE/ES → texty se změní
- [ ] **Po zabití appky zůstane zvolený vzhled i jazyk** (AsyncStorage)
- [ ] **Průchod 1:** po aktualizaci ze 7.0.1 jsou návyky, cíle, zápisy, XP, úroveň, série a achievementy
      **beze změny** (vyfotit Domů před aktualizací a po ní)

**Blok 2 – Onboarding** *(průchod 2, emulátor)*
- [ ] Celý úvod: jazyk → vzhled → notifikace (Povolit) → uvítání → první návyk (předvolba) → první cíl
- [ ] Konec úvodu: výzva jmenuje návyk z obrazovky 1 → odškrtnout → „Day 1 done 🔥" s XP/úrovní/sérií
- [ ] Další čistá instalace: notifikace „Later" + „I'll do it later" → „Your journey starts today 🌱"
- [ ] Úvod se po dokončení znovu nespustí (zabít appku, otevřít)

**Blok 3 – Souhlasy (GDPR / UMP)** *(průchod 2; v ČR se okno zobrazuje)*
- [ ] Čistá instalace: souhlasové okno Googlu (správný jazyk)
- [ ] „Souhlasím" → appka pokračuje, reklamy se načtou
- [ ] Další čistá instalace: odmítnout / „Spravovat možnosti" → appka pokračuje, žádný pád
- [ ] Nastavení → „Nastavení soukromí" → okno souhlasu → změna se uloží
- [ ] Nastavení → „Zásady ochrany soukromí" → web v prohlížeči uvnitř appky → zpět

**Blok 4 – Reklamy (příjem – kritické)**
- [ ] Banner na: Domů, Návyky, Deník, Nastavení, Achievementy, Statistiky návyků/deníku/cílů,
      Historie deníku *(stačí 5; na reklamy neklikat)*
- [ ] **Rewarded – příprava zmrzlé série** *(emulátor, čistá instalace)*: dokončit úvod → Deník →
      **3 zápisy dnes** (série 1) → Nastavení emulátoru → Systém → Datum a čas → vypnout
      automatický čas → datum **+2 dny** → appku **zabít a spustit znovu** (karta se načítá jen při
      otevření obrazovky) → Domů → karta série deníku ukáže zmrzlou sérii / dluh.
- [ ] Ťuknout na kartu → „Watch ad" → **zavřít reklamu předčasně** → odměna **nepřipsána**, appka nespadne
- [ ] Znovu → **dokoukat** → odměna připsána, série obnovená (pokračuje, ne od nuly)
- [ ] Vrátit automatický čas v emulátoru
- [ ] Bez internetu (letadlový režim): banner se nezobrazí, appka funguje, rewarded ukáže srozumitelnou
      hlášku, nespadne

**Blok 5 – Notifikace**
- [ ] Žádost o oprávnění se zobrazí (čistá instalace, Android 13+)
- [ ] Nastavení → připomínky → **nativní výběr času** pro odpolední i večerní; čas se uloží a po zabití
      appky zůstane
- [ ] Odpolední na **za 3–5 min** → zavřít appku → přijde (ikona v liště = bílý symbol, ne šedý čtverec);
      na Androidu 14+ může přijít o pár minut později
- [ ] 🚨 **Připomínky přežijí aktualizaci bez otevření appky** *(průchod 1 – dělá testerka podle přílohy;
      nejdůležitější test celé 7.0.2)*:
      počkat, až Play Store u SelfRise nabídne **Aktualizovat** (7.0.2) → teprve pak na 7.0.1 nastavit
      odpolední na za ~30 min (a mít 1 návyk nesplněný) → appku zavřít → **hned** aktualizovat v Play
      Store → **appku neotevírat** → v Nastavení telefonu → Aplikace → SelfRise ověřit, že je
      nainstalovaná **7.0.2** (bez spuštění appky; jinak by připomínku poslala ještě 7.0.1 a test by
      prošel falešně) → připomínka musí přijít (na Androidu 14+ může přijít i o desítky minut později –
      přesné alarmy jsou u nových instalací vypnuté). Pak restart telefonu → další naplánovaná
      připomínka (večerní nebo druhý den) musí přijít taky.
- [ ] Ťuknutí na připomínku při **zavřené** appce → otevře správnou obrazovku (ne jen Domů)
- [ ] Vypnout připomínky v Nastavení → nepřijde nic

**Blok 6 – Návyky**
- [ ] Vytvořit, upravit název/dny, smazat (předvolby jsou jen v onboardingu → blok 2)
- [ ] Odškrtnout / zrušit → XP animace, popup XP
- [ ] **Přetažením změnit pořadí**
- [ ] Make-up (doplnění zmeškaného dne), pauza a obnovení
- [ ] Statistiky návyků → graf, banner
- [ ] Level-up (pokud jde vyvolat) → animace/modal

**Blok 7 – Cíle**
- [ ] Vytvořit cíl → výběr cílového data (vlastní krokový výběr v appce) → datum se uloží
- [ ] Cíl ze **šablony**
- [ ] Zapsat pokrok → progress, graf v detailu/statistikách
- [ ] Dokončit cíl → modal s animací
- [ ] Haptika při akcích

**Blok 8 – Deník**
- [ ] Nový zápis (klávesnice, uložení), úprava, smazání
- [ ] Historie, statistiky
- [ ] Série → warm-up modaly, oslava s animací/částicemi

**Blok 9 – Gamifikace a data**
- [ ] Achievementy: mřížka, detail, (pokud jde) oslava odemčení
- [ ] Měsíční výzva: karta, detail, kalendář pokroku
- [ ] Přehled úrovní, „Jak to funguje"
- [ ] XP multiplikátor (pokud aktivní) – odpočet
- [ ] **Zabít appku → otevřít → všechna data z testu jsou na místě** (SQLite)

**Blok 10 – Analytika a pády** *(průchod 2 v DebugView)*
- [ ] Přichází: `first_open`, `onb_start`, `onb_language`, `onb_theme`, `onb_notifications`,
      `onb_welcome_done`, `onb_habit_created`, `onb_goal_created`, `onb_complete`, `first_habit_check`,
      `first_journal_entry`, `reminder_open` (po ťuknutí na připomínku), štítek `onb_result` –
      **názvy a parametry jako v 7.0.1**. (`ad_impression` posílá AdMob díky propojení s Firebase;
      když v DebugView chybí, není to chyba R8.)
- [ ] Crashlytics: verze 7.0.2 se objeví (po 2. spuštění), **žádný nový pád**, nahoře nesvítí
      „Missing mapping file"
- [ ] Po testu vypnout debug režim: `adb shell setprop debug.firebase.analytics.app .none.`

#### A30 – Matice „nativní modul → kde je otestovaný" (nic nezůstane neotestované)
| Nativní modul | Kde v testu |
|---|---|
| @react-native-firebase/app, analytics | start; blok 10 |
| @react-native-firebase/crashlytics | blok 10 (verze 7.0.2, žádný nový pád) |
| react-native-google-mobile-ads (+ UMP) | bloky 3, 4 |
| expo-sqlite | bloky 1 (data po aktualizaci), 9 |
| expo-notifications | blok 5, A21 |
| @react-native-community/datetimepicker | blok 5 (výběr času) |
| @react-native-async-storage/async-storage | blok 1 (vzhled/jazyk po zabití), blok 2 (úvod se nespustí znovu) |
| expo-font, @expo/vector-icons, expo-asset | blok 1 (fonty, ikony) |
| expo-localization | blok 1 (jazyk podle telefonu) |
| expo-haptics | blok 1 (přepínač), blok 7 |
| expo-web-browser | blok 3 (zásady ochrany soukromí) |
| expo-linking | blok 5 (ťuknutí → obrazovka) |
| expo-splash-screen, expo-system-ui, expo-status-bar | blok 1 (splash, pozadí, lišta) |
| expo-linear-gradient | blok 1 (přechody na kartách a tlačítkách) |
| expo-router, react-native-screens, react-native-safe-area-context | navigace a okraje ve všech blocích |
| react-native-gesture-handler, react-native-reanimated, react-native-worklets (+ JS react-native-sortables) | blok 6 (přetažení), animace v blocích 6–8 |
| react-native-get-random-values | blok 6 (vytvoření návyku – UUID) |
| expo-tracking-transparency | start (na Androidu bez okna) |
| @shopify/react-native-skia | jen načtení při startu – kreslení vědomě netestujeme (A20) |
| expo-image, lottie-react-native, react-native-webview, @expo/dom-webview | v JS nepoužité – jen start |
| expo-dev-client | v release buildu není |

#### A31 – Go / No-go do produkce (🤝)
**GO, jen když platí všechno:**
- [ ] A25 měření v pořádku; A27 Play: obfuskace ≥ 25 % (V2: všechny 3 metriky ≥ 25 %), žádné varování
- [ ] A29 všechny bloky ✅ v obou průchodech, hlavně **přežití připomínek přes aktualizaci**
- [ ] Pre-launch report bez pádů (nebo se nespustil – pak stačí A29)
- [ ] Logcat (pokud sledován) bez `ClassNotFound / NoSuchMethod / NoSuchField / InvalidClassException`
- [ ] Analytika přichází, Crashlytics bez nového pádu
**NO-GO** → plán B (sekce 8).

### Fáze 6 – Produkce postupně (👤 Petr, 3–5 dní)

- [ ] **A32** 👤 Načasování podle **R-9** (ne uprostřed marketingové vlny). *Production* → *Create new
      release* → *Add from library* → **stejný** bundle 7.0.2 z interního testování (ne nový build) →
      release notes → **Rollout percentage 20 %** → *Send for review* / *Start rollout*
      (recenze hodiny až 1–2 dny; s *Managed publishing* pak ručně *Publish changes*).
      Pozn.: při malém počtu uživatelů dá 20 % jen pár lidí a vitals můžou ukazovat „nedostatek dat"
      – hlavní jistotou je pak A29; 20 % na 2 dny i tak jako pojistka.
- [ ] **A33** 👤🤖 **Den 1–3, denně 5 min:**
  - **Hlavní signál:** *Android vitals* → *Crashes and ANRs* → 7.0.2 vs 7.0.1 (zachytí i pády při
    startu, které Crashlytics kvůli souhlasu nevidí)
  - Crashlytics, filtr 7.0.2 **a versionCode z EAS** (lokální buildy mají versionCode 1): crash-free
    ≥ A2; žádný nový issue s `ClassNotFoundException`,
    `NoSuchMethodError`, `NoSuchFieldError`, `AbstractMethodError`, `VerifyError`, `InvalidClassException`
    nebo trace s jednopísmennými názvy tříd (= chybí mapping)
  - Firebase → `reminder_open` ze 7.0.2 v podobném objemu jako dřív (nepřímý signál, že připomínky
    po aktualizaci chodí)
  - AdMob → výnos/impressions na uživatele se nepropadly (±20 % den ke dni je normální)
  - Firebase → události trychtýře prvního dne přichází i ze 7.0.2
- [ ] **A34** 👤 Vše v pořádku (min. 2–3 dny): *Update rollout* → **100 %**.
      **Při problému:** *Halt rollout* (zastaví další instalace; kdo už aktualizoval, zůstane na 7.0.2 →
      oprava = 7.0.3 s vyšším versionCode) → plán B.

### Fáze 7 – Ověření po vydání (🤝, ~30 min, týden po 100 %)

- [ ] **A35** 👤 *Android vitals* / *Take action*: varování „App optimization below threshold" je
      **pryč** (u vydání 10 může zůstat jako historické). *App bundle explorer* → 7.0.2: obf. `____ %`,
      opt. `____`, zmenš. `____`, DEX `____ MB` (srovnat s A1). Screenshot.
- [ ] **A36** 🤖 Přišel-li nativní pád, ověřit, že je v Crashlytics čitelný (názvy tříd + čísla řádků).
      Nové R8 karty v Play („Optimised resource shrinking", „Upgrade AGP 9") → **jen zapsat** do ČÁSTI D.
- [ ] **A37** 🤖 Průvodce doplnit o naměřená čísla a data; odškrtnout ČÁST A tady i v `projectplan.md`.
      **Pokud 7.0.2 vyšla jako V1 → naplánovat fázi 8** (termín 15. 1. 2027).

### Fáze 8 – Optimalizace samostatně (jen pokud 7.0.2 vyšla jako V1)

> ✅ **2026-10-20: přesunuto do 7.0.2** (Petr: „všechno naráz“). A38 a A39 hotové, A40 = vydání 7.0.2 (fáze 3–7).

> Termín: **v produkci na 100 % nejpozději 15. 1. 2027** (rezerva před únorem 2027). Spouštěč dřív:
> kdyby se mezitím dělal upgrade Expo SDK, který optimalizaci a nové R8 přinese sám (pak plugin
> z A10 odebrat – pojistka v testu A11 na to upozorní).

**Výchozí bod (generálka 2026-10-17, detaily u A22):** `plugins/withR8Optimization.js` už obsahuje
V2'' (vlastní profil bez změn přístupu + compat mode + AGP 8.12.3) a **uložené připomínky přes
aktualizaci i restart přežijí**. Zbývá jediný známý problém: **optimalizace rozbije převod parametrů
Expo modulů (Records)** – `NativeDatabase.constructor` → „cannot be cast to OpenDatabaseOptions“ → NPE
na přejmenovaném `Field.key()` → databáze se neotevře. Expo čte anotace `@Field`/`@Required` přes
Kotlin reflexi (`RecordTypeConverter.kt:35`); anotace v DEX jsou, R8 ale při optimalizaci zřejmě
„zjednoduší“ kód kolem `findAnnotation` (u anotačních rozhraní nevidí implementace – jsou to runtime
proxy).

- [x] **A38** 🤖 *(2026-10-20: kandidát (1) stačil – `-keep @interface expo.modules.** { *; }` v `app.json`, test + průvodce; příčinu potvrzuje oprava v `expo-modules-core` 58.0.15)* Oprava Records – kandidáti (ověřovat po jednom, každý buildem + otevřením appky):
      (1) `-keep @interface expo.modules.kotlin.records.**` + `-keep class kotlin.Metadata { *; }`
      + `-keepattributes RuntimeVisibleAnnotations,…` (už v profilu); (2) zkontrolovat, co přidávají
      novější verze `expo-modules-core` (Expo šablona 57+/58 optimalizaci zapíná – jejich pravidla
      převzít); (3) `-keep,allowobfuscation class expo.modules.kotlin.records.RecordTypeConverter { *; }`
      a `JSTypeConverterHelper` (zákaz optimalizace převodníku). Přidané pravidlo do `app.json` + testu
      + průvodce.
- [x] **A39** 🤖 *(2026-10-20, výsledky v tabulce níže)* Generálka V0 → V2-opravená: měření (3 metriky ≥ 30 %), shoda uložených tříd
      připomínek s V0 (dexdump), test přežití připomínek (aktualizace + restart), **otevření appky
      a průchod všemi moduly s Recordy** (sqlite, web-browser, notifications, splash, haptika…), čistá
      instalace. Pak teprve zaregistrovat plugin a otočit test „not registered yet“.
> **Drobnost z cesty (2026-10-20, Petr zvolil variantu a):** dlaždice v úvodu (návyky, cíle) na telefonu
> **2 sloupce místo 3** – `getOnbTileColumns(width)` podle skutečné šířky okna (3 až od 600 dp). Dřív rozhodovalo
> `getScreenSize()`, které kvůli `isTablet()` hlásí TABLET i na telefonech → 3 sloupce a dělená slova
> („Somet / hing else", „Bewerbunge / n"). Ověřeno na emulátoru v angličtině i němčině. Test v `onboardingKit.test.ts`.

✅ **Výsledky A38–A39 (2026-10-20, emulátor Pixel_7, Android 16) – V2f = V2'' + `-keep @interface expo.modules.** { *; }`:**

| Test | V2f |
|---|---|
| AGP / R8 (AAB metadata, hlavička mappingu) | 8.12.3 / 8.12.22 |
| DEX | 13,0 MB (V0 33,7 MB) |
| `r8.json`: obfuskace / optimalizace / zmenšení | **87,9 / 86,9 / 87,9 %** (Google chce ≥ 25 %) |
| Konfigurace | `-allowaccessmodification` ani `-dontoptimize` nejsou; compat mode; anotační keep v `configuration.txt` |
| `Field` / `Required` / `Record` v mappingu | jména zachována |
| Uložené třídy připomínek (dexdump V0 vs V2f) | `NotificationRequest`, `ChannelAwareTrigger`, všechny triggery a `NotificationAction` **shodné**; `NotificationContent` se liší jen pořadím interních metod a má vlastní `serialVersionUID`; `NotificationCategory` jen syntetický konstruktor (Parcelable, kategorie appka nativně neukládá) |
| Čistá instalace: souhlas UMP, jazyk, vzhled, oprávnění k notifikacím, úvod (návyk + cíl), **databáze se otevřela** | ✅ |
| Deník 3 zápisy + oslavy (level, multiplikátor, achievement, splněný den) | ✅ |
| Nastavení: tmavý vzhled, výběr času, němčina, zásady soukromí (prohlížeč) | ✅ |
| Druhý návyk s vybranými dny, odškrtnutí, **přetažení v režimu řazení**, statistiky návyku | ✅ |
| Cíl s cílovým datem (výběr rok → měsíc → den), Síň trofejí | ✅ |
| **V0 → V2f bez otevření appky:** připomínka 20:30 přišla (20:30) | ✅ |
| **Restart** → alarmy znovu naplánované (`BOOT_COMPLETED`) → večerní 20:55 přišla | ✅ |
| Ťuknutí na připomínku → appka se otevřela s daty z V0 (na obrazovce Návyky – správně, návyk byl nesplněný) | ✅ |
| Log procesu appky (ClassNotFound/NoSuchMethod/InvalidClass/cast/NPE) a crash buffer | čisté |

- Úklid: appka odinstalovaná, debug režim Firebase vypnutý, emulátor vypnutý, `android/` smazaný.

- [ ] **A40** 🤝 *(= vydání 7.0.2, fáze 3–7)* Vydání 7.0.x podle A23–A37 (stejný checklist A29, release notes beze změn funkcí).
      Pokud Play u V2 ukazuje „-" i s AGP 8.12.3: zkontrolovat `app-metadata.properties` v AAB
      a jestli Google nevydal novější patch 8.12.x (Play chce „poslední patch") → zvednout verzi
      v pluginu, znovu změřit a otestovat.

---

## 5. ČÁST B – ZASTARALÁ API EDGE-TO-EDGE (jen sledovat)

**Verdikt:** jen knihovny (React Native `StatusBarModule` + `WindowUtilKt`, Google Material
`BottomSheetDialog`/`EdgeToEdgeUtils`, Google Mobile Ads SDK). Na Androidu 15+ systém tato volání
ignoruje (edge-to-edge je vynucené). **Žádný dopad na uživatele, žádný termín.** Po 7.0.2 se seznam
může zkrátit (R8 vyhodí nepoužité třídy Material); `WindowUtilKt` zůstane, protože ho drží keep
pravidlo Expa. Kód knihoven ručně neupravujeme (patch-package) – riziko > přínos, u Material/AdMob
by to ani nešlo.

- [ ] 🤖 **Při každém upgradu Expo SDK / react-native-google-mobile-ads:** po vydání zkontrolovat, jestli
      se seznam tříd zkrátil. Zapsat verzi, kdy zmizelo: RN `____`, Material `____`, Google Mobile Ads `____`.
- [ ] 🤝 **Volitelný úklid (rozhodne Petr, výchozí NE):** smazat nefunkční `translucent={true}`
      z `<StatusBar>` v `app/_layout.tsx:96` – jen kosmetika, na appce ani varování se nic nezmění;
      případně přibalit k nejbližší práci v `_layout.tsx`. `statusBarTranslucent` u ~30 modalů
      **neměnit** (změna by mohla posunout obsah modalů pod status bar).

---

## 6. ČÁST C – VELKÉ OBRAZOVKY / ORIENTACE

> Fakt: na tabletech s Androidem 16 už dnes zámek na výšku neplatí. Nejdřív **zjistit, jak to vypadá
> a kolik se to týká lidí**, až pak rozhodnout. Nic z toho nebrzdí 7.0.2.

### Etapa C-0 – Data (👤 Petr, 10 min, kdykoli)
- [ ] 👤 Play Console → statistiky / *Reach and devices* → rozpad podle **typu zařízení** (telefon /
      tablet / skládačka / ChromeOS) a verze Androidu. Zapsat: tablety `____ %`, skládačky `____ %`,
      z toho Android 16+ `____ %`.
- [ ] 👤 *Android vitals* s filtrem na tablety – pády/ANR navíc oproti telefonům? `____`
- [ ] 👤 Recenze z tabletů – zmínky o rozbitém vzhledu? `____`

### Etapa C-1 – Diagnostika v emulátoru (🤝, ~1 h, kdykoli – nevyžaduje build)

**Příprava emulátorů** (👤 v Android Studiu, nebo 🤖 přes `sdkmanager`/`avdmanager` na pokyn –
~1,5 GB na obraz):
- [ ] *Device Manager* → **+** → *Create Virtual Device* → **Tablet** → **Pixel Tablet** → obraz
      **API 36, Google Play**, arm64-v8a → název `Pixel_Tablet_API_36`. (Stávající `Pixel_Tablet` je
      API 35 = Android 15 → zámek ještě drží; poslouží jako srovnání „jak to dnes vidí většina tabletů".)
- [ ] Stejně: **Phone** → **Pixel 9 Pro Fold** (nebo jiný *Foldable*) → API 36, Google Play →
      `Pixel_Fold_API_36`.
- [ ] Přihlásit Google účet → Play Store → nainstalovat **SelfRise z Play** (stejná appka jako mají
      uživatelé; účet testera dostane nejvyšší verzi z interního testování – pro vzhled to nevadí). **Před prvním spuštěním debug režim Firebase** (`adb shell setprop …`), ať se
      testovací instalace nepočítá do trychtýře. Reklamy v emulátoru jsou automaticky testovací.
- [ ] Zapnout automatické otáčení; tlačítka rotace v liště emulátoru.

**Scénáře** (každý na `Pixel_Tablet_API_36`, vybrané na `Pixel_Fold_API_36`); u každého screenshot
(🤖 `adb exec-out screencap -p > c1-XX.png`) + zápis:

| # | Scénář | Na co se dívat | Výsledek |
|---|---|---|---|
| C1-01 | Čistá instalace, **start na šířku** | splash, onboarding: rozložení, tlačítka na obrazovce | |
| C1-02 | Onboarding: otočit **uprostřed** úvodu | zachová se krok? sedí rozložení? | |
| C1-03 | Domů na šířku | karty roztažené přes celou šířku? čitelnost, prázdné plochy | |
| C1-04 | Domů: start na výšku → otočit → zpět | zastaralé rozměry (graf série, karta měsíční výzvy, XP lišta) | |
| C1-05 | Graf série po otočení | přetéká / úzký / osa mimo | |
| C1-06 | Návyky: seznam, přetažení na šířku | gesta fungují | |
| C1-07 | Modal přidání návyku na šířku + **klávesnice** | modal celý? tlačítko Uložit nad klávesnicí? | |
| C1-08 | Modal otevřít na výšku → otočit s otevřeným modalem | šířka, posun mimo střed | |
| C1-09 | Cíle: nový cíl + výběr data na šířku | výběr se vejde | |
| C1-10 | Deník: zápis s klávesnicí na šířku | je vidět, co píšu? | |
| C1-11 | Achievementy: mřížka po otočení | sloupce, mezery | |
| C1-12 | Detail achievementu, oslavy na šířku | velikost, částice mimo obraz | |
| C1-13 | Měsíční výzva: detail + kalendář | rozložení | |
| C1-14 | Nápovědy (HelpTooltip) po otočení | tooltip u správného prvku | |
| C1-15 | Banner na šířku | 320×50 vycentrovaný, nic nepřekrývá | |
| C1-16 | Rewarded reklama na šířku (příprava jako A29 blok 4) | přehraje se, zavření, odměna | |
| C1-17 | Souhlas UMP na šířku | okno čitelné, tlačítka dostupná | |
| C1-18 | **Rozdělená obrazovka** (appka na ½ šířky) | chová se jako telefon? | |
| C1-19 | **Okno s volnou velikostí** (pokud ho obraz nabízí) | rozměry se aktualizují? | |
| C1-20 | Skládačka: **složená** → **rozložit** za běhu | přechod malý → velký displej | |
| C1-21 | Srovnání na `Pixel_Tablet` (API 35) | letterbox na výšku = dnešní stav většiny tabletů | |
| C1-22 | Statistiky (návyky/deník/cíle) na šířku | grafy | |

- [x] 🤖 Vyhodnotit: každá chyba → **rozbité** (nejde použít / mimo obrazovku / ztráta dat) × **ošklivé**.
- [x] 🤖 Zapsat souhrn sem + návrh varianty. Po testu debug režim `.none.`.

✅ **Výsledky C-1 (2026-10-18, Claude):** emulátor `Pixel_Tablet_API_36` (vytvořený z profilu Pixel
Tablet + obraz Androidu 16; tabletový obraz API 36 na Macu není), 1280×800 dp, sw800dp. Build = 7.0.2 (V1).

**Hlavní zjištění: Android 16 zámek na výšku opravdu ignoruje** – appka běží přes celý displej na šířku
i na výšku, bez pruhů. Týká se to **už dnešní verze** na tabletech s Androidem 16.

| # | Výsledek | Kategorie |
|---|---|---|
| C1-01 start na šířku, C1-17 souhlas UMP | souhlas, jazyk, vzhled, notifikace, uvítání i výběr návyku čitelné, ve sloupci uprostřed | ✅ |
| C1-02 otočení uprostřed úvodu | krok zůstal, rozložení se přepočítalo | ✅ |
| C1-03 Domů na šířku | funguje; karty přes celých 1280 dp, hodně prázdna, „Add Habit" úzké vedle roztažených rychlých akcí | ošklivé |
| **C1-04/05 graf historie deníku po otočení** | **graf si nechal šířku z původní orientace → posledních ~14 dní (vč. dneška) je mimo obrazovku**; napraví až restart appky | **rozbité** |
| C1-06 Návyky + přetažení | funguje, roztažené (ovládání daleko vpravo) | ošklivé |
| C1-07 přidání návyku + klávesnice | psaní vidět, „Create" dostupné po posunutí; „Cancel" uprostřed | ošklivé |
| **C1-11 mřížka achievementů po otočení** | na šířku 7 sloupců OK; po otočení na výšku **pravý sloupec karet useknutý** | **rozbité (část mimo obrazovku)** |
| C1-12 oslava achievementu po otočení | modal skoro přes celou šířku (~750 dp) – rozměr z původní orientace | ošklivé |
| C1-15 banner | 320×50 vycentrovaný; v Trophy Room leží přes spodek obsahu (patrně i na telefonu) | ✅ / ošklivé |
| C1-08, 09, 10, 13, 14, 16, 22 | **neprovedeno** – stejný mechanismus (rozměry z modulu) jako výše; doplní se při ověřování opravy | – |
| C1-18/19 rozdělená obrazovka, okno | neprovedeno (emulátor bez desktop windowing) | – |
| C1-20 skládačka | neprovedeno (chybí AVD skládačky) | – |
| C1-21 Android 15 tablet | neprovedeno – chování je dané (letterbox na výšku) | – |

- Během testu appku jednou ukončily **Google Play služby** při aktualizaci reklamního modulu
  („Module config changed, forcing restart due to module ads.dynamite“, SIG 9) – jev emulátoru po prvním
  startu, nesouvisí s tabletem ani s R8. Jinak žádné chyby v logu ani pády.

**Návrh (C-2):** nic „rozbitého“ nebrání používání – rozbité je jen zobrazení **po otočení zařízení za běhu**
(graf a mřížka částečně mimo obrazovku), restart appky to spraví; vše ostatní je „ošklivé“. Doporučuji
**variantu 0 teď** (žádná záplata) a **variantu C v Q1 2027** – a v ní začít přesně těmito dvěma místy
(`StreakHistoryGraph`, `AchievementGrid`/`app/achievements.tsx`) + sloupec max. šířky pro Domů.
Rozhodnutí závisí ještě na C-0 (kolik uživatelů má tablet).

### Etapa C-2 – Rozhodnutí (👤 Petr, na základě C-0 + C-1)

| Varianta | Co | Kdy dává smysl | Pracnost | Platnost |
|---|---|---|---|---|
| **0 – nic** | nechat, jak je | C-1 ukáže jen „ošklivé" věci a tablety < 2 % | 0 | do API 37 |
| **B – dočasná výjimka** | manifest property → tablety s Androidem 16 zpět na letterbox na výšku | C-1 ukáže „rozbité" věci a nechceme teď investovat do C | ~1 h + build + test | **jen do cílení na API 37** |
| **C – skutečná podpora** | appka se přizpůsobí šířce a otočení | dřív nebo později **nutné** (Android 17) a tablety mají smysluplný podíl | 3–4 posezení + test | trvale |

Výchozí doporučení: **C-1 hned → pokud „rozbité", varianta B v nejbližším vydání po 7.0.2 → varianta C
naplánovat na Q1 2027** (s rezervou před srpnem 2027).

- [ ] 👤 Rozhodnutí: `____`

### Etapa C-3 – Varianta B (jen když se zvolí)
- [ ] 🤖 **Ověřit v aktuální dokumentaci** přesný název a hodnotu property
      (`android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`, `true`) a že na API 36 vrací
      letterbox na výšku.
- [ ] 🤖 Config plugin `plugins/withRestrictedResizability.js` (`withAndroidManifest`) → do `<application>`
      (nebo `MainActivity`): `<property android:name="android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY" android:value="true" />`
- [ ] 🤖 Test: plugin nad vzorovým manifestem přidá právě jednu property; ověřit, že test spadne bez pluginu.
- [ ] 🤖 Průvodce → sekce „Velké obrazovky: dočasná výjimka do API 37" s **datem, kdy musí pryč**.
- [ ] 🤝 Test: release build na `Pixel_Tablet_API_36` → na výšku s pruhy po stranách i při otočení; telefon beze změny.

### Etapa C-4 – Varianta C (návrh – před kódem oponentura podle pravidla 1)

> ✅ **Rozhodnutí Petra 2026-10-19:** opravit **hned, v 7.0.2** spolu s R8; rozsah = **sloupec uprostřed +
> přepočet za běhu** (bez dvousloupcového rozložení); **vzhled telefonů zachovat** (varianta a – `isTablet()`
> a `responsive.ts` beze změny, nová logika jen nad šířkou telefonu). Pravidla: @technical-guides:Large-Screens.md
>
> **Jak se realizace liší od návrhu níže (záměrně):**
> - Místo vlastního hooku přímo `useWindowDimensions()` + čisté funkce v `src/utils/layout.ts`
>   (`contentColumn` 640, `getModalWidth` strop 560, `getContentWidth`, `getColumnCount`) – méně kódu, testovatelné.
> - Graf na Domů počítá šířku ze **sloupce** (`getGraphMetrics`), ne z `onLayout` – bez probliknutí
>   prvního vykreslení, na telefonu matematicky stejné.
> - `src/utils/responsive.ts` **zůstává** (čte při startu): na tabletu dává v obou orientacích stejné hodnoty,
>   na telefonu se orientace nemění. Vědomá výjimka v hlídači testu. `src/constants/dimensions.ts`: odstraněno
>   nepoužívané `Layout.window`.
> - C4-4 onboarding: **beze změny** – má vlastní sloupec 560 dp a v C-1 prošel i po otočení.

**Cílový stav (návrh):**
- Na telefonu **beze změny** (žádný vizuální rozdíl – nejdůležitější podmínka).
- Na širokém displeji: obsah ve **sloupci max ~640 dp vycentrovaném**, pozadí přes celou šířku.
  Modaly max ~560 dp. Grafy podle skutečné šířky kontejneru.
- Otočení / rozložení skládačky / změna okna → vše se přepočítá **za běhu**.
- Zámek orientace na telefonech **zůstává** (Android 16 ho ignoruje jen na ≥ 600 dp).
- Dvousloupcové rozložení (seznam + detail) **ne** – pro habit tracker nepřiměřené.

**Části (každá = 1 posezení):**
- [x] 🤖 **C4-1 Základ:** *(2026-10-19: `src/utils/layout.ts` + `contentColumn` na 11 obrazovkách / seznamech)* sdílený hook (např. `src/hooks/useLayoutMetrics.ts`) nad `useWindowDimensions()` →
      `width`, `height`, `isWide` (≥ 600 dp), `contentWidth`. `src/utils/responsive.ts`
      a `src/constants/dimensions.ts` tak, aby **nečetly rozměry při načtení modulu**. Testy hooku
      (telefon 390, tablet 1280, otočení). Kontejner `ContentColumn` (`maxWidth` + `alignSelf: 'center'`)
      na tab a stack obrazovky (`app/(tabs)/*`, `app/achievements.tsx`, `app/*-stats.tsx`,
      `app/journal-history.tsx`, `src/screens/**`).
      ⚠️ **Past:** dnešní `isTablet()` (`src/utils/responsive.ts:6-16`) násobí šířku hustotou pixelů → na
      většině Android telefonů vrací **true** (Pixel 7: 412 dp × 2,625 = 1081 > 1000). Onboarding a „Jak
      to funguje" (6 souborů, ~71 volání) tak už dnes na telefonech používají „tabletové" hodnoty.
      Přepnutí na „≥ 600 dp" by **změnilo vzhled na telefonech**. Rozhodnout před kódem: (a) zachovat
      dnešní výstupy na každém zařízení (nová logika jen pro skutečně široké displeje) – doporučuji,
      nebo (b) změnu přijmout a porovnat screenshoty před/po.
- [x] 🤖 **C4-2 Modaly a překryvy (≈ 20 souborů):** *(2026-10-19; `GoalTemplatesModal` a `OnboardingPreferencesModal` jedou přes `responsive.ts` – stabilní)* `screenWidth`/`screenHeight` z modulu → hook; šířky
      `min(x % šířky, max)`: `common/BaseModal`, `common/HelpTooltip`, `achievements/AchievementDetailModal`,
      `achievements/AchievementCelebrationModal`, `achievements/AchievementTooltip`,
      `goals/GoalCompletionModal`, `goals/TargetDateConfirmationModal`, `goals/TargetDateStepSelectionModal`,
      `goals/GoalTemplatesModal`, `gamification/MultiplierActivationModal`,
      `challenges/MonthlyChallengeFailureModal`, `challenges/MonthlyChallengeDetailModal`,
      `challenges/MonthlyChallengeMilestoneModal`, `challenges/MonthlyChallengeCompletionModal`,
      `challenges/StarLevelChangeModal`, `gratitude/WarmUpModals`, `gratitude/CelebrationModal`,
      `gratitude/StreakWarmUpModal`, `tutorial/OnboardingPreferencesModal`.
- [x] 🤖 **C4-3 Grafy, mřížky, karty, animace (≈ 15 souborů):** *(2026-10-19; mřížka trofejí `key={numColumns}`, 4 mrtvé deklarace smazány)* `home/StreakHistoryGraph` (šířka z `onLayout`),
      `achievements/AchievementGrid`, `achievements/CategorySection`, `app/achievements.tsx` (sloupce),
      `challenges/MonthlyProgressCalendar`, `challenges/MonthlyChallengeCard`,
      `gamification/OptimizedXpProgressBar`, `gamification/XpMultiplierIndicator`,
      `gamification/MultiplierCountdownTimer`, `gamification/XpNotification`,
      `gamification/XpPopupAnimation`, `gamification/ParticleEffects`, `goals/GoalPerformanceDashboard`,
      `goals/ProgressTrendAnalysis`, `goals/GoalCompletionPredictions`,
      `screens/levels/LevelsOverviewScreen`, `screens/help/HowItWorksScreen`.
- [x] 🤖 **C4-4 Onboarding (8 souborů):** *(beze změny – viz rozhodnutí výše)* `onboarding/WelcomeScreen`, `OnbScreenContainer`,
      `FirstHabitScreen`, `FirstGoalScreen`, `OnbTileGrid`, `OnbTile`, `FirstCheckCard`,
      `DayOneCelebration` – pozice a velikosti po otočení. Průvodce @technical-guides:Tutorial.md.
- [x] 🤖 *(tsc + npm test zelené; screenshoty telefonu po změně beze rozdílu)* Po každé části: `tsc`, `npm test`, kontrola tématu (skill na theme), **screenshoty telefonu
      před/po** (Pixel_7) – na telefonu nesmí být rozdíl.
- [x] 🤝 *(2026-10-20 🤖 na `Pixel_Tablet_API_36` + `Pixel_7`: Domů s grafem, Síň trofejí (mřížka i po otočení), Návyky + formulář, Deník, Cíle + šablony + formulář, Nastavení, úprava Domů – vše ve sloupci, graf celý, mřížka bez uříznutí; telefon beze změny. Skládačka a iPad neověřeny – iPad pokryje Petr/testerka)* Závěrečný test: celá tabulka C-1 na `Pixel_Tablet_API_36` + `Pixel_Fold_API_36` + telefon;
      iPad (appka má `supportsTablet: true`).
- [x] 🤖 Průvodce: sekce „Rozvržení pro velké obrazovky" *(nový @technical-guides:Large-Screens.md + odkaz v `technical-guides.md`)* (pravidlo: **nikdy `Dimensions.get` mimo
      komponentu**) + aktualizace dotčených průvodců.
- [ ] 🤝 Po C: rozhodnout o odstranění výjimky z B (pokud byla) a o otáčení na tabletech pod Androidem 16.

---

## 7. ČÁST D – BUDOUCÍ KROKY (podmíněné, NE v 7.0.2)

Každý krok = vlastní vydání s generálkou (fáze 2) a zkráceným checklistem A29.

| Krok | Proč zatím ne | Spouštěč | Poznámka |
|---|---|---|---|
| D1 `enableShrinkResourcesInReleaseBuilds` | Na skóre DEX nemá vliv. Jiný Expo tým ověřil, že `require()` obrázky přežily; máme ale vlastní animace a ikonu notifikací → ověřit | Play doporučí resource shrinking nebo chceme menší appku | ověřit, že všech 8 obrázků, 3 JSON animace, font a ikona notifikace jsou v APK |
| D2 Optimised resource shrinking (`android.r8.optimizedResourceShrinking=true`) | navazuje na D1 | karta „Optimised resource shrinking isn't enabled" | pozor na přesný název – špatný Gradle tiše ignoruje |
| D3 Upgrade Expo SDK / AGP 9 | Řídí šablona Expa | rozhodnutí o upgradu Expa | pojistka v testu A11 spadne → odebrat/upravit `withR8Optimization` (šablona už může optimalizaci a novější AGP mít), přeměřit, znovu generálka |
| D4 Odebrat nepoužívané `lottie-react-native`, `react-native-webview` | sahá na závislosti | samostatný úklid | menší appka, méně kódu |
| D5 Nahlásit Expu chybu „expo-notifications AAR nemá ProGuard pravidla" | veřejná akce na GitHubu – rozhodne Petr | kdykoli | pomůže všem; my jsme kryti vlastním pravidlem |

---

## 8. RIZIKA A PLÁN B

| Riziko | Pravděp. | Dopad | Prevence | Plán B |
|---|---|---|---|---|
| **Uložené připomínky přestanou chodit po aktualizaci** (serializace expo-notifications) | **vysoká bez pravidla** | lidé bez otevření appky přijdou o připomínky | pravidlo 2 (A8), kontrola mappingu (A18/A19), **test přežití** (A21, A29 blok 5) | Halt rollout; 7.0.3 s pravidlem. Uživatelům se připomínky obnoví po prvním otevření appky (přeplánují se při každém spuštění) |
| V2: optimalizace rozbije reflexi / Recordy / serializaci | **potvrzeno 2026-10-17** (serializace i Records) | uložené připomínky smazány / databáze se neotevře | generálka chytila obojí | **vydat V1** (rozhodnuto); serializace vyřešena (V2''), Records → fáze 8 |
| Play u optimalizace a zmenšení ukazuje „-" (R8 8.12.14 / ne „poslední patch AGP") | jistá u V1 | po únoru 2027 nesplněný požadavek | V2 (AGP 8.12.3 + optimalizace) | fáze 8; novější patch AGP (A40) |
| Novější AGP bez optimalizace | – | Play ukáže optimalizaci 0 % → nové varování | zvednutí AGP jen v pluginu spolu s výměnou souboru | – |
| EAS build spadne na `Missing classes` | střední | nic se nevydá, ~30 min | generálka | `missing_rules.txt` → cílené `-dontwarn` → nový build |
| Build spadne na `OutOfMemoryError: Metaspace` | nízká na EAS (1 GB metaspace), střední lokálně | ~30 min | lokálně parametr `-Dorg.gradle.jvmargs` (fáze 2) | EAS: `env.GRADLE_OPTS` v `eas.json` nebo `resourceClass: large` |
| Build spadne na `uploadCrashlyticsMappingFileRelease` | nízká | nic se nevydá | generálka ho spustí taky | ověřit `google-services.json`/síť; nouzově `mappingFileUploadEnabled false` + ruční upload |
| Knihovna vypne obfuskaci/zmenšení celé appce (`-dontobfuscate`/`-dontshrink`) | nízká | skóre se nezlepší | kontrola `configuration.txt` (A18) | najít zdroj, řešit s knihovnou |
| Appka naběhne bez Expo modulů (reflexe) | nízká | nepoužitelná | pravidlo 3 + logcat | vidět hned → No-go |
| Pád v konkrétní funkci (reflexe v knihovně) | nízká | jedna funkce | A29 + pre-launch report + matice A30 | třída z logcatu/Crashlytics → keep → 7.0.3 |
| Pád při nativním startu, který Crashlytics neuvidí | nízká | appka nejde spustit | generálka, A29 | Play vitals (A33) → Halt |
| Tiše nefunkční reklamy nebo souhlas | nízká | **příjem** | bloky 3–4, AdMob v A33 | Halt → keep → 7.0.3 |
| Tiše nefunkční analytika | nízká | ztráta dat z trychtýře | blok 10, A33 | jako výše |
| Nečitelné pády | nízká | horší diagnostika | A24 log uploadu, A27 ReTrace soubor | `firebase crashlytics:mappingfile:upload`; `mapping.txt` z AAB: `unzip -p app.aab BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map > mapping.txt` (EAS ho samostatně neukládá) |
| Testovací instalace zkreslí trychtýř prvního dne | střední | špatná rozhodnutí z dat | debug režim před 1. spuštěním, čisté instalace jen v emulátoru | zapsat počty a data testovacích instalací, v Etapě 4 trychtýře odečíst |
| AdMob „neplatná návštěvnost" při testech | nízká | omezení účtu | A3, emulátor automaticky testovací, na reklamy neklikat | – |
| Test připomínek projde falešně (ještě nainstalovaná 7.0.1) nebo selže falešně (nepřesný alarm, Force stop, změna času 25. 10.) | střední | špatné rozhodnutí | ověřit verzi bez spuštění (A29 blok 5), přesné alarmy v emulátoru (A21), upozornění v A28 | kontrolní pokus V0 → V0 |
| Falešný poplach z logcatu (cizí procesy hlásí `ClassNotFound` běžně) | vysoká bez filtru | zbytečné hledání | filtr na PID appky + crash buffer + srovnání s V0 (A20) | – |
| Instalace testovací verze smaže Petrova data | střední | data | A28 | testovat na zařízení s Play verzí nebo v emulátoru |
| Data uživatelů po aktualizaci (DB) | velmi nízká (R8 nemění DB ani JS) | vysoký | blok 1 průchod 1 | Halt |

**Postup při No-go / problému v produkci:**
1. 👤 *Halt rollout* (produkce) / nepropagovat (interní test).
2. 🤖 Diagnóza z logcatu / Crashlytics / Play vitals: která třída/metoda chybí → proč.
3. 🤖 Cílené keep pravidlo (+ test + průvodce) → 7.0.3 → znovu fáze 2–6.
4. **Krajní možnost:** 7.0.3 s `enableMinifyInReleaseBuilds: false` (návrat ke stavu 7.0.1) a hledat
   příčinu v klidu – do února 2027 je čas.

---

## 9. ČASOVÁ OSA (návrh)

| Kdy | Co | Kdo |
|---|---|---|
| hned | Fáze 0 (A1–A7), R-1…R-9, C-0 | 👤 |
| 1. posezení | Fáze 1 (A8–A14) | 🤖 |
| 2.–3. posezení | Fáze 2 – generálka V0/V1/V2 (A15–A22) | 🤖 |
| po pokynu | Fáze 3–4 (A23–A25) | 🤝 |
| +1–2 dny | Fáze 5 – interní testování (~2 h Petr); **test připomínek ne přes noc 24./25. 10.** | 👤 |
| podle R-9 | Fáze 6 – produkce 20 % → po 2–3 dnech 100 %, ne uprostřed marketingové vlny | 👤 |
| +1 týden po 100 % | Fáze 7 (A35–A37) | 🤝 |
| jen při V1 | Fáze 8 – optimalizace, **v produkci do 15. 1. 2027** | 🤖 + 👤 |
| paralelně, kdykoli | C-1 diagnostika tabletů (~1 h) | 🤝 |
| podle C-2 | B v dalším vydání; C na Q1 2027 | 🤖 + 👤 |

Termín Google: **únor 2027** (přesný den neuveden) → rezerva i na případnou 7.0.3 a fázi 8.

---

## 10. ZDROJE

- Google – Play Console technical quality requirements (3 metriky ≥ 25 %, únor 2027): https://support.google.com/googleplay/android-developer/answer/17492799
- Android – code optimization (vitals, `r8.json`): https://developer.android.com/google/play/vitals/code-optimization
- Firebase – Crashlytics deobfuscated reports: https://firebase.google.com/docs/crashlytics/android/get-deobfuscated-reports
- Firebase – DebugView (debug události mimo přehledy): https://firebase.google.com/docs/analytics/debugview
- AdMob – test ads (emulátory automaticky testovací): https://developers.google.com/admob/flutter/test-ads
- Play Console – pre-launch report (reklamní provoz vyloučen): https://support.google.com/googleplay/android-developer/answer/9842757
- Android – device compatibility mode (Android 16): https://developer.android.com/guide/practices/device-compatibility-mode
- Android 16 behavior changes: https://developer.android.com/about/versions/16/behavior-changes-16
- Android 17 – resizability & orientation: https://developer.android.com/blog/posts/prepare-your-app-for-the-resizability-and-orientation-changes-in-android-17
- Expo – build properties: https://docs.expo.dev/versions/latest/sdk/build-properties/
- Expo – EAS build infrastructure (`GRADLE_OPTS`, paměť strojů): https://docs.expo.dev/build-reference/infrastructure/
- React Native – StatusBar: https://reactnative.dev/docs/statusbar
- Zkušenosti jiných týmů:
  Selftend #1707 (1 % → 93 %, Metaspace OOM) https://github.com/Selftend/selftend/issues/1707 ·
  Selftend #2335 (další R8 doporučení Play) https://github.com/Selftend/selftend/issues/2335 ·
  Selftend #2673 (optimalizace, R8 8.12.14, Record) https://github.com/Selftend/selftend/issues/2673 ·
  Selftend PR #2709 (pojistka na šablonu) https://github.com/Selftend/selftend/pull/2709 ·
  Expensify #100003 (optimize soubor, AGP 8.12.3) https://github.com/Expensify/App/issues/100003 ·
  Expo PR #46852 (šablona → optimize) https://github.com/expo/expo/pull/46852 ·
  boardsesh PR #5338 (keep `ExpoModulesPackageList`) https://github.com/boardsesh/boardsesh/pull/5338 ·
  Microsoft Q&A – pole `r8.json` https://learn.microsoft.com/en-us/answers/questions/6018743/net-10-for-android-r8-metadata-r8-json-and-google

---

## 11. PŘÍLOHA – NÁVOD PRO TESTERKU (k přeposlání)

> **Pro Petra:** poslat až po kroku A26, kdy je 7.0.2 nahraná v interním testování. Přiložit odkaz pro
> testery z A4. Test zabere ~1 h čekání a ~15 min práce, rozložené do 2 dnů (kvůli restartu
> a další připomínce). Výsledky zapsat do A29 blok 5.

---

**Ahoj, díky, že pomůžeš! 🙌**

Testujeme novou verzi SelfRise pro Android (7.0.2). Vypadá úplně stejně jako ta, kterou máš – změna je
„pod kapotou". Nejdůležitější je ověřit, že ti po aktualizaci **dál chodí připomínky, i když appku
neotevřeš**. Prosím nedělej test v **sobotu 24. 10. večer** – v noci se mění čas a zmátlo by to výsledky.

**Než začneš**
1. V Obchodě Play otevři SelfRise → vpravo nahoře **⋮** → **vypni „Povolit automatické aktualizace"**
   (ať se appka neaktualizuje sama dřív, než budeš připravená).
2. Odkaz, který ti posílám, otevři **v telefonu** (přihlášená stejným Google účtem jako v Obchodě Play)
   → **„Stát se testerem"** → pak odkaz na stažení z Google Play. U SelfRise se má objevit tlačítko
   **Aktualizovat** – zatím na něj **neklikej**. Někdy se objeví až za pár hodin.

**Test aktualizace (hlavní část)**

3. Otevři SelfRise a **vyfoť obrazovku Domů** (pro srovnání).
4. V appce → **Nastavení → připomínky**: zkontroluj, že je zapnutá **odpolední připomínka**, a nastav
   její čas na **za 30 minut**. Jeden dnešní návyk nech **neodškrtnutý**.
5. Appku zavři – jen přejdi na plochu nebo ji zavři z přehledu otevřených aplikací.
   ⚠️ **Nikdy nepoužívej „Vynutit ukončení"** v nastavení telefonu.
6. V Obchodě Play u SelfRise klikni na **Aktualizovat**. Po aktualizaci appku **neotvírej**
   (ani tlačítkem „Otevřít").
7. **Nastavení telefonu → Aplikace → SelfRise** → dole by měla být **verze 7.0.2**. Udělej screenshot.
   Appku pořád neotvírej.
8. Počkej na připomínku – může přijít i o něco později, klidně až o půl hodiny.
   **Napiš mi, v kolik přišla** (nebo že nepřišla ani do hodiny).
9. **Restartuj telefon.** Appku pořád neotvírej a počkej na další připomínku (večerní, nebo zítra
   odpolední). Zase mi napiš, v kolik přišla.

**Kontrola po aktualizaci**

10. Teprve teď **ťukni na připomínku** → appka se má otevřít. Napiš, na jaké obrazovce.
11. Porovnej s fotkou z bodu 3: návyky, série, XP a úroveň mají být stejné. **Vyfoť Domů znovu.**
12. Chvíli appku normálně používej: odškrtni návyk, zapiš něco do deníku, otevři statistiky, v Nastavení
    přepni vzhled (světlý/tmavý) a zpátky, otevři „Zásady ochrany soukromí".
13. **Na reklamy prosím neklikej.**
14. Kdyby appka spadla, zamrzla nebo se cokoliv chovalo jinak než dřív: **screenshot + čas + co jsi
    zrovna dělala** → pošli mi to.
15. Na konci si v Obchodě Play u SelfRise zase **zapni automatické aktualizace**.

Díky moc! 💜
