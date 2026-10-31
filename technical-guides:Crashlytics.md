# Crashlytics - Technická pravidla a logika

*Crash reporting přes Firebase Crashlytics — nastaveno červenec 2026*

## Jak to funguje

Crashlytics je „černá skříňka" aplikace: při pádu se report uloží lokálně a odešle
při **příštím spuštění**. Zachytává nativní pády (iOS/Android), neodchycené JS
výjimky a ANR (Android). Firebase Console seskupuje pády do issues, ukazuje
crash-free rate a posílá velocity alerty na e-mail.

## Architektura v projektu

**Jediný vstupní bod: `src/services/crashReportingService.ts`**
- Lazy/safe wrapper — všechny metody jsou bezpečný no-op, když nativní modul
  není dostupný (Jest, Expo Go, web). Nikdy nevyhazuje výjimky.
- 🚨 **PRAVIDLO: nikdy neimportuj `@react-native-firebase/crashlytics` přímo** —
  vždy přes tento wrapper (jinak se rozbijí testy).
- 🚨 **PRAVIDLO: jen modulární API RNFB** (od 2026-10-26) — `getCrashlytics()`,
  `log(crashlytics, msg)`, `recordError(crashlytics, err)`,
  `setCrashlyticsCollectionEnabled(crashlytics, true)`.
  ❌ `crashlytics()` / `instance.log(msg)` (namespaced) — RNFB 23 ho označilo za
  zastaralé (2 varování v logu při každém startu) a v další hlavní verzi zmizí.

**Consent gating (privacy-first):**
- `firebase.json`: `crashlytics_auto_collection_enabled: false` — sběr je
  vypnutý, dokud ho kód nezapne.
- `adConsentService.finalizeAdsAndDiagnostics()` → po dokončení UMP privacy flow
  volá `CrashReportingService.enable()`. Sběr tedy nikdy nezačne dřív, než
  uživatel viděl privacy formulář. Jediné call-site — případné zpřísnění
  (strict opt-in) se dělá tam.
- 🚨 **Pořadí uvnitř `finalizeAdsAndDiagnostics`: NEJDŘÍV Crashlytics, pak reklamy**
  (od 2026-10-31, `configureCrashReporting()` je nezávislé na reklamách).
  ```typescript
  // ❌ WRONG: Crashlytics až za inicializací reklam
  await startGoogleMobileAds();      // visí-li/trvá-li, sběr se nikdy nezapne
  await CrashReportingService.enable();

  // ✅ CORRECT
  await configureCrashReporting();   // vlastní try/catch, na reklamách nezávisí
  await startGoogleMobileAds();
  ```
  **Proč**: původní pořadí vázalo zapnutí sběru na `mobileAds().initialize()`. Jediná
  pomalá nebo zaseknutá inicializace reklam na iOS tiše nechala crash reporting
  vypnutý — a nikdo by to nepoznal (prázdný dashboard vypadá stejně jako „žádné
  pády"). Hlídá `adConsentService.test.ts` (inicializace reklam, která nikdy
  neskončí, sběr nezablokuje).

**Vývojové relace (od 2026-10-31):** v relaci s `__DEV__` (JS z `npm start`), kde není
v lokálním `.env` `EXPO_PUBLIC_ANALYTICS_IN_DEV=true`, se Crashlytics **vypíná**
(`disable()`), ne zapíná. Vývojové buildy sdílejí bundle ID i Firebase projekt s
ostrou appkou, takže jejich pády a červené obrazovky s JS chybami by se míchaly do
čísel. Pravidlo drží `isDevelopmentSession()` v `src/config/diagnosticsMode.ts`;
ostré buildy ho nikdy nesplní (`__DEV__` je tam false). Souvislosti s analytikou:
@technical-guides:Analytics.md → „Vývojové relace".

**Specifika iOS (ověřeno ve zdrojích RNFB 23.8.8):**
- `setCrashlyticsCollectionEnabled` jen **uloží preferenci**; nativní SDK ji použije
  až **při příštím spuštění** (`RNFBCrashlyticsInitProvider`). Po instalaci tedy sběr
  na iOS začíná od **2. spuštění**. Na Androidu platí hned.
- V **Debug konfiguraci** (`#ifdef DEBUG`) RNFB sběr nezapne nikdy, dokud
  `firebase.json` neobsahuje `crashlytics_debug_enabled: true`. Test pádu proto
  patří do Release buildu (EAS `preview`/`production`).
- Při připojeném debuggeru (Xcode) iOS pády zachytí debugger a Crashlytics je
  nedostane. Testovat se spuštěním z ikony na ploše.
- Build skript RNFB zapisuje do Info.plist `FirebaseCrashlyticsCollectionEnabled=NO`
  — sběr je vypnutý, dokud ho nezapne uložená preference z JS.
  *(Funkce se do 14. 7. 2026 jmenovala `initializeAdsWithConsent()`; přejmenována
  při zavedení Startup Orchestratoru — název opraven při super auditu, N-9.1.)*

**API wrapperu:**
- `enable()` / `disable()` — zapnutí/vypnutí sběru
- `log(msg)` — breadcrumb do timeline crash reportu (levné, používat u
  významných přechodů stavu)
- `recordError(error, context?)` — HANDLED chyba → non-fatal issue v Console
- `testCrash()` — DEV/QA: vynucený nativní pád pro ověření pipeline
- `getStatus()` — DEV/QA: co dělá nativní strana (`enabledAtLaunch`,
  `requestedThisSession`, `crashedOnPreviousExecution`, `moduleAvailable`).
  ⚠️ `enabledAtLaunch` se čte hned při prvním načtení modulu, protože RNFB vlastnost
  `isCrashlyticsCollectionEnabled` se po `enable()` přepíše na JS straně a pak jen
  opakuje, co jsme si sami řekli.

**Strategická `recordError` místa (kritické systémy):**
| Místo | Context tag |
|---|---|
| `app/_layout.tsx` — DB init selhalo po 3 pokusech | `db_init_failed_after_retries` |
| `SQLiteGratitudeStorage.calculateAndUpdateStreak` | `streak_calculation_failed` |
| `MonthlyProgressTracker.processProgressUpdate` | `monthly_progress_update_failed` |
| `XPMultiplierService.activateHarmonyMultiplier` | `harmony_multiplier_activation_failed` |

Při přidávání dalších: jen катастrofické/datové chyby, ne běžný šum.

## Test pádu na zařízení (od 2026-10-31)

Nutné ověřit **na iPhonu i na Androidu**: prázdný dashboard („waiting for a crash")
nerozliší „žádný pád nenastal" od „sběr neběží". Do 2026-10-31 nebyl test nikdy
proveden (`testCrash()` neměl žádné volání).

1. V lokálním `.env`:
   ```
   EXPO_PUBLIC_ENABLE_CRASH_TEST=true
   EXPO_PUBLIC_ANALYTICS_IN_DEV=true   # jinak je ve vývojové relaci Crashlytics vypnutý
   ```
   a restartovat `npm start` (`--clear`). Nový build není potřeba.
2. **Otevřít appku dvakrát** (na iOS se uložené zapnutí uplatní až při dalším spuštění).
3. Nastavení → **Crash test (developer)** → **Show Crashlytics status**. Čekat
   `READY: collection was ON at launch`. Jiný výsledek je sám o sobě nález:
   | Výpis | Význam |
   |---|---|
   | `Native module: MISSING` | binárka bez modulu (Expo Go / starý build) |
   | `Collection at launch: OFF` i po dvou spuštěních | sběr se nezapíná — hledat v `finalizeAdsAndDiagnostics` / `enable()` |
   | `Development session: yes` | chybí `EXPO_PUBLIC_ANALYTICS_IN_DEV=true` nebo se `.env` nenačetl |
4. **Record a handled error** (nefatální, appka běží dál) a **Force a crash**
   (potvrdit). Appku **otevřít z ikony** (ne z Xcode) a chvíli počkat.
5. Firebase → Crashlytics → příslušná platforma. Pád se objeví do několika minut;
   nefatální chyba po dalším spuštění. Po úspěchu v `.env` obojí vrátit na `false`.

⚠️ Debug build na iOS nikdy nesbírá (viz výše) — test jen v Release buildu (`preview`).
Ostré buildy tlačítko neobsahují: sekce se zobrazí jen s `EXPO_PUBLIC_ENABLE_CRASH_TEST=true`.

## Co zbývá udělat (Petr / zařízení)

1. `npx expo prebuild --clean` + nový build (nativní modul)
2. Ověření pipeline: viz „Test pádu na zařízení" výše
3. **Privacy dokumenty** (viz konverzace 2026-07-06):
   - Privacy Policy na webu: odstavec o crash reportingu (Crashlytics/Google,
     stack trace + model zařízení + verze OS/appky + instalační ID, jen
     diagnostika, ne reklama, retence ~90 dní, sběr po privacy flow)
   - App Store Connect → App Privacy: přidat **Crash Data + Performance Data**
     (Diagnostics, not linked, no tracking)
   - Google Play → Data Safety: Crash logs + Diagnostics, účel App functionality
4. **Android mapping (R8, od 7.0.2):** Gradle plugin Crashlytics nahrává `mapping.txt`
   automaticky — v logu EAS buildu musí proběhnout `:app:uploadCrashlyticsMappingFileRelease`.
   Kdyby stack traces byly nečitelné (jednopísmenné třídy), mapping jde vytáhnout z AAB
   (`unzip -p app.aab BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`)
   a nahrát ručně (`firebase crashlytics:mappingfile:upload`). iOS dSYM nahrává EAS.
   Detaily: @technical-guides:Android-Release-Build.md
5. **Pád při nativním startu Crashlytics nevidí** — sběr se zapíná až po souhlasu UMP
   (`firebase.json`). U každého nového vydání proto sledovat hlavně Play Console → Android vitals.
