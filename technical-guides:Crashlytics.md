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

**Consent gating (privacy-first):**
- `firebase.json`: `crashlytics_auto_collection_enabled: false` — sběr je
  vypnutý, dokud ho kód nezapne.
- `adConsentService.finalizeAdsAndDiagnostics()` → po dokončení UMP privacy flow
  volá `CrashReportingService.enable()`. Sběr tedy nikdy nezačne dřív, než
  uživatel viděl privacy formulář. Jediné call-site — případné zpřísnění
  (strict opt-in) se dělá tam.
  *(Funkce se do 14. 7. 2026 jmenovala `initializeAdsWithConsent()`; přejmenována
  při zavedení Startup Orchestratoru — název opraven při super auditu, N-9.1.)*

**API wrapperu:**
- `enable()` / `disable()` — zapnutí/vypnutí sběru
- `log(msg)` — breadcrumb do timeline crash reportu (levné, používat u
  významných přechodů stavu)
- `recordError(error, context?)` — HANDLED chyba → non-fatal issue v Console
- `testCrash()` — DEV/QA: vynucený nativní pád pro ověření pipeline

**Strategická `recordError` místa (kritické systémy):**
| Místo | Context tag |
|---|---|
| `app/_layout.tsx` — DB init selhalo po 3 pokusech | `db_init_failed_after_retries` |
| `SQLiteGratitudeStorage.calculateAndUpdateStreak` | `streak_calculation_failed` |
| `MonthlyProgressTracker.processProgressUpdate` | `monthly_progress_update_failed` |
| `XPMultiplierService.activateHarmonyMultiplier` | `harmony_multiplier_activation_failed` |

Při přidávání dalších: jen катастrofické/datové chyby, ne běžný šum.

## Co zbývá udělat (Petr / zařízení)

1. `npx expo prebuild --clean` + nový build (nativní modul)
2. Ověření pipeline: v dev buildu zavolat `CrashReportingService.testCrash()`
   (např. dočasně z debug tlačítka), **restartovat appku**, do pár minut
   zkontrolovat Firebase Console → Crashlytics
3. **Privacy dokumenty** (viz konverzace 2026-07-06):
   - Privacy Policy na webu: odstavec o crash reportingu (Crashlytics/Google,
     stack trace + model zařízení + verze OS/appky + instalační ID, jen
     diagnostika, ne reklama, retence ~90 dní, sběr po privacy flow)
   - App Store Connect → App Privacy: přidat **Crash Data + Performance Data**
     (Diagnostics, not linked, no tracking)
   - Google Play → Data Safety: Crash logs + Diagnostics, účel App functionality
4. EAS build nahrává dSYM/mapping soubory automaticky — pokud by stack traces
   v Console byly nesymbolikované, zkontrolovat EAS build log.
