# 🧬 SelfRise V2 — Android Release Build (R8) Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **Proč je v release buildu zapnuté R8** a co Google Play požaduje od února 2027
- **8 keep pravidel** a proč žádné z nich nesmí zmizet (hlavně uložené připomínky)
- **Plugin `withR8Optimization`** (optimalizace + AGP 8.12.3) a kdy ho odebrat
- **Jak změřit**, že R8 opravdu běží a co uvidí Play (`mapping.txt`, `r8.json`, metadata AAB)
- **Nebezpečné zóny** — jak si rozbít release build, aniž by to dev build ukázal

**🔧 KDY TOHLE POUŽÍVAT:**
- Saháš na `expo-build-properties` v `app.json` nebo na pluginy v `plugins/`
- Přidáváš nebo upgraduješ **nativní knihovnu** (cokoliv se složkou `android/`)
- Upgraduješ **Expo SDK / React Native** (spadnou pojistky v testu, viz Testování)
- Play Console hlásí cokoliv o „App optimization", obfuskaci, R8 nebo deobfuskačním souboru
- Pád **jen v release buildu** (`ClassNotFoundException`, `NoSuchMethodError`, …), který přes `npm start` není

---

## Proč tenhle systém existuje

Play Console u produkčního vydání 10 (7.0.0) hlásil **obfuskaci 1 %**. Google od **února 2027**
vyžaduje u každého nahraného AAB s více než 10 MB DEX kódu **≥ 25 % optimalizace, obfuskace
i zmenšení** (*Play Console technical quality requirements*). Nesplnění „může ovlivnit viditelnost
a možnost publikovat".

Šablona Expo SDK 55 má R8 **vypnuté** (`enableMinifyInReleaseBuilds` ve výchozím stavu `false`)
a optimalizaci **zakázanou** (`proguard-android.txt` obsahuje `-dontoptimize`). Proto jsme R8
zapnuli sami (od 7.0.2) a přidali keep pravidla pro všechno, co se načítá podle jména třídy.

Celý plán, rozhodnutí a historie: @google-play-compliance-plan.md

---

## 🚨 5 KRITICKÝCH PRAVIDEL

### Pravidlo 1: R8 zůstává zapnuté

```jsonc
// ✅ CORRECT (app.json → plugins → expo-build-properties → android)
"enableMinifyInReleaseBuilds": true

// ❌ WRONG: "na zkoušku" vypnout, protože release build někde padá
"enableMinifyInReleaseBuilds": false
```

**Proč**: bez R8 je obfuskace ~1 % a appka od února 2027 nesplní požadavek Googlu. Když release
build padá kvůli R8, chybí keep pravidlo — najdi třídu a přidej ho (Pravidlo 4), nevypínej R8.
Vypnutí je jen krajní nouzové řešení s okamžitým plánem nápravy.

### Pravidlo 2: Keep pravidla se nemažou

Všech 8 pravidel je v `app.json:238` (`extraProguardRules`) a každé hlídá test:

| # | Pravidlo | Co chrání |
|---|---|---|
| 1 | `-keep class com.google.android.gms.internal.consent_sdk.** { *; }` | interní třídy souhlasového okna Googlu (UMP/GDPR) |
| 2 | 🚨 `-keep class expo.modules.notifications.** { *; }` | **uložené připomínky** – viz níže |
| 3 | `-keep class expo.modules.ExpoModulesPackageList { *; }` | načítá se přes `Class.forName` (`expo/.../ExpoModulesPackage.kt:23`); bez něj appka naběhne bez Expo modulů |
| 4 | `-keep class expo.modules.adapters.react.apploader.RNHeadlessAppLoader { *; }` | jméno je jen v `meta-data` manifestu, automatická pravidla ho nekryjí |
| 5 | `-keep interface expo.modules.kotlin.records.Record` | prázdné rozhraní, které Expo testuje za běhu (`TypeConverterProvider.kt:145`); optimalizace ho umí odstranit |
| 6 | `-keep public class * extends java.lang.Exception` | čitelné názvy výjimek v Crashlytics |
| 7 | `-keepattributes SourceFile,LineNumberTable` | čísla řádků ve stack trace |
| 8 | `-renamesourcefileattribute SourceFile` | skryje názvy zdrojových souborů; mapping je vrátí |

**Pravidlo 2 podrobně** — expo-notifications ukládá každou naplánovanou připomínku do
SharedPreferences jako **Java-serializovaný objekt pod jménem třídy**
(`SharedPreferencesNotificationsStore.kt:33-60`). `NotificationRequest` ani triggery nemají
`serialVersionUID`. Záznamy se čtou při aktualizaci appky (`MY_PACKAGE_REPLACED`), po restartu
(`BOOT_COMPLETED`) a při spuštění každého alarmu; nečitelný záznam knihovna v okamžiku spuštění
**smaže** (`ExpoSchedulingDelegate.kt:72-88`). Vlastní keep pravidlo knihovny se do buildu
**nedostane** — modul se bere jako hotový AAR (`expo-module.config.json` → `publication`) a v něm
`proguard.txt` chybí. Bez našeho pravidla by R8 třídy přejmenoval → **lidem, kteří si appku po
automatické aktualizaci neotevřou, by přestaly chodit připomínky**. Keep celého balíku drží jména
i strukturu tříd, takže data zůstávají kompatibilní napříč verzemi i při obnově ze zálohy Androidu.

```jsonc
// ✅ CORRECT: nové pravidlo přidat i s důvodem do tabulky výš a do testu
// ❌ WRONG: "vyčistit" pravidla, která "vypadají zbytečně" – dev build rozdíl neukáže
```

**Proč**: každé pravidlo chrání věc, kterou `npm start` ani testy v Jestu nevidí. Rozbití se
projeví až u uživatelů – a u připomínek až po další aktualizaci.

### Pravidlo 3: Novější AGP nikdy bez optimalizace

`plugins/withR8Optimization.js` zapíná optimalizaci a mění **tři věci najednou**: místo
`proguard-android.txt` použije `plugins/r8/proguard-optimize-base.pro` (optimalizační profil AGP
**bez** `-allowaccessmodification`), přepne R8 do **compat mode** a zvedne AGP z 8.12.0 na **8.12.3**.

```text
✅ CORRECT: všechno spolu (plugin) → Play změří všechny 3 metriky a uložené připomínky přežijí
❌ WRONG:  jen AGP 8.12.3 → Play začne optimalizaci měřit a uvidí 0 % → nové varování
❌ WRONG:  jen optimize soubor na AGP 8.12.0 → Play optimalizaci a zmenšení neumí změřit („-")
❌ WRONG:  šablonový proguard-android-optimize.txt / R8 full mode → R8 změní přístup
           (protected → public) i u chráněných tříd → jiný serialVersionUID → uložené
           připomínky se při spuštění SMAŽOU (ověřeno 2026-10-17)
```

**Proč**: R8 je zabalené uvnitř AGP. AGP 8.12.0 nese R8 8.12.14, které má přetečení ve
statistikách (`r8.json`), a Play bere procenta z `r8.json` jen u buildů s **posledním patchem AGP**
(verzi čte z metadat AAB). AGP 8.12.3 nese opravené R8 8.12.22. Gradle při konfliktu verzí vybere
vyšší, takže plugin AGP nikdy nesníží.

> 🚨 **Stav k 2026-10-17 – plugin NENÍ připravený a je záměrně nezaregistrovaný** (test to hlídá).
> Generálka ukázala, že optimalizace **rozbije převod parametrů Expo modulů (Records)**:
> `NativeDatabase.constructor` → „cannot be cast to OpenDatabaseOptions“ → NPE na přejmenovaném
> `Field.key()` → appka neotevře databázi. Expo čte `@Field` přes Kotlin reflexi
> (`expo-modules-core/.../records/RecordTypeConverter.kt:35`). 7.0.2 proto jde **bez optimalizace**
> (R8 jen obfuskuje a zmenšuje); oprava je fáze 8 plánu, termín 15. 1. 2027.

### Pravidlo 4: Nová nativní knihovna = kontrola R8

Před přidáním nebo upgradem knihovny se složkou `android/`:

1. **Reflexe?** `Class.forName`, jména tříd ve stringu nebo v `meta-data` manifestu
2. **JNI** bez `@DoNotStrip`?
3. **Data, která přežívají aktualizaci pod jménem třídy?** (Java serializace, Parcelable
   v `PendingIntent`, plánované úlohy)
4. **Dodává keep pravidla a opravdu se použijí?** Expo moduly s `publication`
   v `expo-module.config.json` se berou jako hotový AAR:
   `find node_modules/<modul> -name '*.aar' -exec unzip -l {} \; | grep -c proguard.txt`
   (0 = pravidla knihovny se do buildu nedostanou → musí být v `app.json`)
5. Pak **release build + logcat + test přes aktualizaci** (Device scénáře níže)

**Proč**: přesně takhle vznikl případ expo-notifications – pravidlo ve zdroji existuje, do buildu
se nedostane.

### Pravidlo 5: R8 se testuje jen v release buildu

```text
✅ CORRECT: lokální release build (generálka) nebo build z interního testování v Play
❌ WRONG:  "funguje to přes npm start" – dev build R8 vůbec nemá
```

**Proč**: R8 běží jen v release variantě. Dev build ukáže, že funguje JS, ne že přežil nativní kód.

---

## Jak je to zapojené

- **`app.json:230-240`** (blok `android` na řádcích 236–239) – `expo-build-properties` → `android.enableMinifyInReleaseBuilds=true`
  v `gradle.properties` a pravidla připojená do `android/app/proguard-rules.pro`.
- **CNG** – složka `android/` se generuje při každém EAS buildu. Nikdy ji necommitovat; po lokálním
  `expo prebuild` ji smazat.
- **`plugins/withR8Optimization.js`** + **`plugins/r8/proguard-optimize-base.pro`** – optimalizace
  (Pravidlo 3); zatím nezaregistrované.
- **Mapping** – Gradle plugin Crashlytics nahrává `mapping.txt` automaticky
  (`:app:uploadCrashlyticsMappingFileRelease` v logu buildu). Play ho bere přímo z AAB
  (`BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`). EAS ho samostatně neukládá.
- **Crashlytics se zapíná až po souhlasu** (`firebase.json:3`) → pád při nativním startu neuvidí.
  U nového vydání je hlavním signálem **Play vitals**.
- **Paměť Gradlu** – EAS ji nastavuje sám přes `GRADLE_OPTS` (střední stroj: 4 GB heap, 1 GB
  metaspace) a přebíjí `gradle.properties`. Lokálně se předává parametrem
  `-Dorg.gradle.jvmargs="-Xmx2560m -XX:MaxMetaspaceSize=1g"` (Mac má 8 GB).
- **Verze** – AGP 8.12.0 pochází z `node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml`.

---

## Jak změřit, že R8 funguje

Nad AAB (lokální `android/app/build/outputs/bundle/release/app-release.aab` nebo z EAS):

```bash
# velikost DEX
unzip -l app.aab | grep -E '\.dex$' | awk '{s+=$1} END {printf "%.1f MB DEX\n", s/1048576}'
# mapping je v AAB (Play ho bere odtud) – a vytažení pro další kontroly
unzip -p app.aab BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map > mapping.txt
# která verze R8 build udělala
head -5 mapping.txt                       # → # compiler_version: …
# odhad obfuskace (podíl přejmenovaných tříd)
grep -E '^[^ #].* -> .*:$' mapping.txt | awk -F' -> ' '{n=$2; sub(/:$/,"",n); t++; if ($1!=n) r++} END {printf "%d/%d = %.1f %%\n", r, t, 100*r/t}'
# keep pravidla platí – notifikace: > 0 řádků a žádná SKUTEČNÁ třída přejmenovaná
# (třídy vyrobené samotným R8 – $$ExternalSynthetic…, -IA, -$$Nest, $-CC – ve vstupu nejsou,
#  keep je chytit nemůže a nic se do nich neukládá; ty se nepočítají)
grep -c -E '^expo\.modules\.notifications\..* -> ' mapping.txt
grep -E '^expo\.modules\.notifications\..* -> ' mapping.txt | awk -F' -> ' '{n=$2; sub(/:$/,"",n); if ($1!=n && $1 !~ /\$\$ExternalSynthetic|-IA$|-\$\$Nest|\$-CC$/) print}'
# statistiky R8 (u R8 8.12.14 nesmyslné; u 8.12.22: 100 − no*Percentage = skóre)
unzip -p app.aab BUNDLE-METADATA/com.android.tools/r8.json | python3 -m json.tool
# verze AGP, podle které Play pozná „poslední patch"
unzip -p app.aab BUNDLE-METADATA/com.android.tools.build.gradle/app-metadata.properties
```

Lokálně navíc `android/app/build/outputs/mapping/release/configuration.txt` (sloučená konfigurace):

```bash
grep -n -E '^-dontobfuscate|^-dontshrink|^-dontoptimize' configuration.txt
grep -nE '^-keep(,[a-z]+)* +class +(\*\*?|[a-z]+(\.[a-z]+)*\.\*\*) *\{' configuration.txt
```

V Play: *App bundle explorer* → bundle → *Details* → **App optimization** (3 procenta) a *Downloads*
→ **ReTrace mapping file**. S AGP 8.12.0 ukazuje Play u optimalizace a zmenšení „-" (očekávané).

---

## ⚠️ NEBEZPEČNÉ ZÓNY (nejčastější způsoby, jak to rozbít)

1. **⛔ Smazat „zbytečné" keep pravidlo** – hlavně pravidlo 2. Dev build nic neukáže, připomínky
   zmizí až po další aktualizaci u lidí, kteří appku neotevřou.
2. **Zvednout AGP / R8 bez optimalizace** (Pravidlo 3) – Play začne měřit a uvidí 0 %.
3. **`-dontwarn` naslepo** (`-dontwarn **`) – schová skutečně chybějící třídu; build projde,
   appka spadne. Vždy jen konkrétní třída s důvodem.
4. **Široké `-keep class com.** { *; }`** – „opraví" pád, ale shodí skóre pod limit.
5. **Knihovna s `-dontobfuscate` / `-dontshrink` ve svých pravidlech** – vypne R8 celé appce.
   Kontrola v `configuration.txt`.
6. **Data přežívající aktualizaci pod jménem třídy** – Java serializace, Parcelable v alarmu,
   plánované úlohy (Pravidlo 4).
7. **Falešné výsledky testů:** „Vynutit ukončení" maže alarmy; `adb logcat` bez filtru je plný
   cizích `ClassNotFoundException` (Play služby, ART); tester dostane z Play vždy nejvyšší verzi;
   na Androidu 14+ jsou přesné alarmy u nových instalací vypnuté (připomínka přijde později).
8. **Upgrade Expa bez přehodnocení pluginu** – pojistky v testu spadnou schválně, neobcházet je.
9. **⛔ Zapnout optimalizaci bez testu na zařízení** – optimalizace (ne obfuskace) rozbila v generálce
   dvě věci, které dev build ani Jest neukážou: uložené připomínky (R8 full mode mění přístup tříd)
   a převod parametrů Expo modulů (databáze se neotevře). Každá změna optimalizace = otevřít appku
   v release buildu + test přežití připomínek přes aktualizaci.
10. **„Shodné třídy“ u buildu, kde R8 vůbec neběželo** – vždy zkontrolovat velikost DEX a hlavičku
    `mapping.txt`; ruční zásah do `gradle.properties` jednou R8 tiše vypnul (slepený řádek).

---

## Testování

```text
__tests__/config/androidReleaseBuild.test.ts (19 testů)
✅ R8 je zapnuté pro release
✅ všech 8 keep pravidel – každé s důvodem v chybové hlášce
✅ optimalizační plugin NENÍ zaregistrovaný (rozbité Records – fáze 8)
✅ orientace na výšku (změna patří do samostatné práce na velkých obrazovkách)
✅ profil plugins/r8/proguard-optimize-base.pro: bez -allowaccessmodification a -dontoptimize
✅ plugin: compat mode právě jednou; nad skutečnou šablonou (node_modules/expo/template.tgz)
   vlastní profil a AGP 8.12.3, nic jiného se nezmění, opakované spuštění nic nemění,
   neznámá šablona → chyba; profil se zkopíruje vedle app/build.gradle
✅ pojistky: RN pořád přináší AGP 8.12.0; šablona pořád používá proguard-android.txt
```

Ověřeno rozbitím (2026-10-17): vypnuté R8, chybějící pravidlo 2, jiné AGP od React Native,
plugin bez zvednutí AGP, zaregistrovaný plugin, `-allowaccessmodification` v profilu, full mode
→ pokaždé červený test s vysvětlením.

Ověřeno na zařízení (generálka 2026-10-17, emulátor Android 16) – postup a výsledky:
@google-play-compliance-plan.md (A20–A22).

> ⚠️ **Limit testů**: Jest ověří konfiguraci, ne běh. Jestli R8 nerozbilo nativní kód, ukáže jen
> release build v emulátoru nebo z interního testování (Device scénáře).

---

## Co se NESMÍ rozbít

- Start appky a všechny Expo moduly
- SQLite data uživatele (i po aktualizaci)
- **Naplánované připomínky po aktualizaci bez otevření appky** a po restartu telefonu
- Souhlasové okno Googlu (UMP) a „Nastavení soukromí"
- Reklamy: banner a rewarded (oprava série deníku)
- Analytika trychtýře prvního dne (stejné názvy a parametry událostí)
- Čitelné pády v Crashlytics a Play vitals

---

## Device scénáře (po každé změně R8 nebo nativní knihovny)

1. **Čistá instalace release buildu** → průchod appkou; v logu procesu appky žádné nové chyby
   oproti buildu bez R8 (`adb logcat --pid=…`, crash buffer `adb logcat -b crash`).
2. **Aktualizace ze starší verze bez otevření appky** → naplánovaná připomínka přijde; po restartu
   telefonu přijde další. (V emulátoru předtím `adb shell appops set com.petrturek.selfrise
   SCHEDULE_EXACT_ALARM allow`.)
3. **Hlavní toky**: onboarding, souhlas, banner, rewarded (zmrzlá série deníku), návyky
   s přetažením, cíle, deník, nastavení (výběr času připomínky, vzhled, jazyk, zásady soukromí).
4. **Play Console**: App optimization (3 procenta), ReTrace mapping file, žádné varování
   „App optimization below threshold".

Podrobný checklist a matice „nativní modul → test": @google-play-compliance-plan.md (A29, A30).

---

## Naměřené hodnoty

| Verze | AGP / R8 | DEX | Obfuskace | Optimalizace | Zmenšení | Zdroj |
|---|---|---|---|---|---|---|
| 7.0.0 / 7.0.1 | bez R8 | 33,7 MB* | 1 % | – | – | Play Console (*lokální build V0) |
| 7.0.2 – lokální generálka (V1) | 8.12.0 / 8.12.14 | 15,0 MB | 90,8 % | 0 % | 90,8 % | `r8.json` 2026-10-17 |
| 7.0.2 – v Play | *(doplnit po vydání)* | | | | | App bundle explorer |
| pokus V2'' (nevydáno) | 8.12.3 / 8.12.22 | 13,0 MB | 87,9 % | 86,9 % | 87,9 % | `r8.json` – rozbité Records |

---

**GOLDEN RULE**: *„Každá nativní změna = release build + logcat + test přes aktualizaci, než to
uvidí uživatel. Keep pravidla se nemažou. AGP se nezvedá bez optimalizace."*

---

*Tento průvodce je závazná reference pro release build Androidu. Vznikl 2026-10-17 z plánu
@google-play-compliance-plan.md (průzkum, dvě nezávislé revize a ověření v kódu).*
