# Fáze 9 — nálezy (super audit 2026-07): AdMob + Crashlytics + Marketing Demo Mode

Datum: 2026-07-21 | Commit: `758d796` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 464/464 (31/31 suites)

Scope dle plánu: položky 9.1–9.4. Guides: `technical-guides:AdMob.md` (478 ř.),
`technical-guides:Crashlytics.md` (59 ř.).

**Celkové hodnocení: reklamy a Crashlytics jsou v pořádku** — anti-abuse
pravidlo drží i v nepřímé cestě, `recordError` sedí s guide 4/4, dev/prod
ID přepínání je kompletní. **Marketing Demo Mode je ale destruktivní**:
smaže všechna reálná data bez zálohy a „vypnutí" je neobnoví. Riziko je
ohraničené tím, že v produkčním buildu se tyto nástroje vůbec nevykreslí ✅ —
ohrožený je Petr při vlastní marketingové práci.

## Položky

### 9.1 Rewarded ad NIKDY neuděluje XP (anti-abuse critical rule)

- Kde: `adService.ts` (celý), `GratitudeStreakCard.tsx:410-470` (jediný
  konzument), `StreakWarmUpModal.tsx`, `WarmUpModals.tsx`
- Pravidlo: guide AdMob — sledování reklamy nesmí vést k žádnému XP; reklama
  platí POUZE dluh zmrzlého streaku.
- Ověřeno jak: grep `addXP|GamificationService|XPSourceType` ve všech
  jmenovaných souborech + dohledání celé cesty od `EARNED_REWARD` + kontrola
  NEPŘÍMÉ cesty (obnovení streaku → milestone XP?).
- Verdikt: ✅ **pravidlo drží přímo i nepřímo.**
- Důkaz:
  - Grep `addXP|GamificationService|XPSourceType` v `adService.ts`,
    `StreakWarmUpModal.tsx`, `WarmUpModals.tsx` → **0 hitů** ✅.
  - Celá cesta odměny: `EARNED_REWARD` → jen `hasRewarded = true`
    (`adService.ts:135-141`) → `CLOSED` → `resolve({rewarded: true})` (:157-161).
    Jediný konzument `showRewardedAd()` je
    `GratitudeStreakCard.handleWatchAd` (:421); po `adResult.rewarded === true`
    volá **výhradně** `actions.applySingleWarmUpPayment()` (:449) — tedy
    zaplacení jednoho dne dluhu, nic víc ✅. Grep XP v `GratitudeStreakCard.tsx`
    → **0 hitů** ✅.
  - **Nepřímá cesta ověřena**: obnovení streaku by teoreticky mohlo spustit
    milestone XP. `JOURNAL_STREAK_MILESTONE` má v celém `src/` **jen
    konzumenty** (achievement sources, activity tracker, xpLimits, popisky) a
    **žádného producenta** → žádné `addXP` s tímto zdrojem neexistuje ✅.
    V `SQLiteGratitudeStorage` se XP dotýká jen vytvoření zápisu (`addXP` ř. 311)
    a smazání (`subtractXP` ř. 439) — warm-up řetěz
    (`applySingleWarmUpPayment` → `warmUpStreakWithAds` →
    `calculateAndUpdateStreak`) XP **netknutý** ✅.
  - Pozn.: `StreakWarmUpModal.tsx` / `WarmUpModals.tsx` reklamu vůbec
    nespouštějí (jediné volání `showRewardedAd` je v `GratitudeStreakCard`) —
    jsou to čistě UI komponenty.

### 9.2 Crashlytics `recordError` jen na katastrofické cesty

- Kde: 4 call-sites (viz níže), wrapper `crashReportingService.ts`
- Pravidlo: guide Crashlytics — tabulka „Strategická `recordError` místa"
  (4 položky) + „jen katastrofické/datové chyby, ne běžný šum" + „nikdy
  neimportuj `@react-native-firebase/crashlytics` přímo".
- Ověřeno jak: grep VŠECH `recordError(` call-sites a přiřazení ke kategorii
  z guide + grep přímých importů.
- Verdikt: ✅ **přesná shoda 4/4, žádné šumové volání navíc.**
- Důkaz (všechna call-sites → kategorie dle guide):

  | Call-site | Context tag | Kategorie dle guide |
  |---|---|---|
  | `app/_layout.tsx:198` | `db_init_failed_after_retries` | ✅ DB init selhalo po 3 pokusech |
  | `SQLiteGratitudeStorage.ts:1183` | `streak_calculation_failed` | ✅ streak calc |
  | `monthlyProgressTracker.ts:524` | `monthly_progress_update_failed` | ✅ monthly progress |
  | `xpMultiplierService.ts:605` | `harmony_multiplier_activation_failed` | ✅ harmony multiplier |

  - **Žádné další call-site** — grep přes `src/` + `app/` nenašel nic mimo tyto
    čtyři ✅ (žádný šum nepřibyl).
  - **Pravidlo o přímém importu**: grep `@react-native-firebase/crashlytics`
    mimo `crashReportingService.ts` → **0 hitů** ✅.
  - **Consent gating**: `CrashReportingService.enable()` má jediné call-site
    `adConsentService.ts:48` ✅ — a to uvnitř `finalizeAdsAndDiagnostics()`,
    tedy až po dokončení UMP privacy flow (privacy-first pořadí zachováno,
    křížově ověřeno s Fází 10, pravidlo 2).
- **N-9.1 [🧹 doc]** — guide (§Consent gating) tvrdí, že `enable()` volá
  `adConsentService.initializeAdsWithConsent()`. Ta funkce už neexistuje —
  po refaktoru Startup Orchestratoru (14. 7.) se jmenuje
  `finalizeAdsAndDiagnostics()`. Jen zastaralý název v dokumentaci, chování
  je správné.

### 9.3 Dev/prod ad-unit-ID přepínání (`__DEV__`)

- Kde: `adService.ts:15-33` (rewarded), `AdBanner.tsx:22-32, 75` (banner)
- Pravidlo: plán 9.3 — potvrdit úplnost přepínání.
- Ověřeno jak: čtení obou definic + grep VŠECH `ca-app-pub` v repu.
- Verdikt: ✅ **kompletní pro oba typy reklam i obě platformy.**
- Důkaz:
  - Rewarded (`adService.ts:18-26`): `__DEV__` → Google test IDs
    (`ca-app-pub-3940256099942544/…` = oficiální testovací publisher),
    jinak produkční `ca-app-pub-2983534520735805/…`; obě platformy
    (ios/android) ✅. Výběr platformy `getRewardedAdUnitId()` (:29-33) ✅.
  - Banner (`AdBanner.tsx:25-33`): identický vzor, obě platformy ✅.
  - **Grep `ca-app-pub` přes celý `src/` + `app/`** → hity POUZE v těchto dvou
    souborech ✅ (žádné zapomenuté hardcoded ID jinde, žádný jiný typ reklamy).
  - Komentáře u obou (`adService.ts:15-17`, `AdBanner.tsx:22-24`) vysvětlují
    důvod (vlastní kliky na produkční ID = riziko AdMob banu) ✅.

### 9.4 Marketing Demo Mode — 4 binární kritéria

- Kde: `marketingDemoModeService.ts` (16 ř.),
  `marketingDemoDataService.ts` (1267 ř.), vstup `app/(tabs)/settings.tsx:26, 447`,
  spotřeba `AdBanner.tsx:53-64`
- Pravidlo: plán 9.4 (a) aktivace nikdy nepřepíše produkční data bez úplné
  zálohy; (b) deaktivace obnoví PŘESNĚ původní stav; (c) demo mód není
  dosažitelný náhodným uživatelem v produkci; (d) pád uprostřed demo módu
  nenechá uživatele trvale v demo datech.
- Ověřeno jak: čtení obou služeb, dohledání transakčních hranic, grep zálohy,
  dohledání gate až k build konfiguraci.

#### (a) Aktivace vs. produkční data — ❌ **NEPROŠLO**

- `loadMarketingDemoData()` (`:1178`) volá jako PRVNÍ krok uvnitř transakce
  `clearDemoData()` (`:1197`).
- `clearDemoData()` (`:516-561`) provádí **`DELETE FROM` nad 28 tabulkami
  BEZ WHERE**: `habits`, `habit_completions`, `habit_schedule_history`,
  `goals`, `goal_progress`, `goal_milestones`, `journal_entries`,
  `warm_up_payments`, `xp_transactions`, `xp_state`, `xp_daily_summary`,
  `xp_multipliers`, `level_up_history`, `loyalty_state`, `daily_activity_log`,
  `achievement_progress`, `achievement_unlock_events`,
  `achievement_stats_cache`, `monthly_challenges` + 6 dalších challenge tabulek,
  `user_challenge_ratings`, `challenge_history`… a `streak_state` resetuje na nuly
  (`:553-561`).
- **Záloha NEEXISTUJE** — grep `backup|restore|snapshot before` přes celý
  `marketingDemoDataService.ts` → **0 hitů**.
- ⇒ Zapnutí demo módu **nenávratně smaže veškerá reálná uživatelská data**.

#### (b) Deaktivace obnoví původní stav — ❌ **NEPROŠLO**

- `clearMarketingDemoData()` (`:1243`) volá **tentýž** `clearDemoData()`
  (`:1250`) — tedy znovu smaže všech 28 tabulek — a poté
  `setMarketingDemoModeEnabled(false)`.
- Nic se neobnovuje (není z čeho). ⇒ „Vypnutí demo módu" nechá aplikaci
  **úplně prázdnou**, ne v původním stavu.
- Text potvrzovacího dialogu (`settings.tsx:585-586`) slibuje jen odstranění
  demo dat — uživatel z něj nepozná, že přišel i o svá původní data (ta jsou
  ovšem pryč už od aktivace).

#### (c) Nedosažitelnost v produkci — ✅ **PROŠLO** (a to je zásadní)

- Celá sekce je v UI podmíněná: `{ENABLE_MARKETING_DEMO_TOOLS && (…)}`
  (`settings.tsx:447`).
- `const ENABLE_MARKETING_DEMO_TOOLS = process.env.EXPO_PUBLIC_ENABLE_MARKETING_DEMO === 'true'`
  (`settings.tsx:26`).
- Proměnná **není nastavená nikde v repu**: jediný výskyt je
  `.env.example:26` s hodnotou `false`; `.env` soubor neexistuje; `eas.json`
  ji nenastavuje v žádném profilu (development / preview / production).
- Expo dosazuje `EXPO_PUBLIC_*` v době **buildu** → v produkčním buildu je
  `undefined` → podmínka false → **sekce se vůbec nevykreslí**. Běžný uživatel
  se k demo nástrojům nedostane ✅.
- ⇒ Nálezy (a)/(b) tedy **nejsou riziko pro uživatele v App Store**, ale jsou
  reálné riziko pro **build s explicitně zapnutou proměnnou** (marketingový
  build, který Petr používá na screenshoty).

#### (d) Pád uprostřed demo módu — ⚠️ **ČÁSTEČNĚ**

- **Destruktivní fáze je transakční ✅**: `BEGIN TRANSACTION` (`:1194`) →
  `clearDemoData()` + všechny seedy → `COMMIT` (`:1204`), v `catch` `ROLLBACK`
  (`:1206`). Pád uprostřed seedování ⇒ transakce se nedokomituje ⇒ SQLite ji
  při dalším startu vrátí ⇒ **původní data přežijí** ✅. To je dobrý návrh.
- ⚠️ **Okno nekonzistence po COMMIT**: `seedLegacyGamificationData()` (`:1210`)
  a `setMarketingDemoModeEnabled(true)` (`:1228`) běží **až po** commitu, mimo
  transakci. Pád mezi commitem a nastavením příznaku ⇒ v DB jsou demo data,
  ale příznak říká „demo vypnuto" ⇒ zobrazí se reklamy a Settings nabízí
  „načíst demo" místo „demo aktivní".
- **Recovery cesta existuje** (tlačítko „Clear Marketing Demo Data" na příznaku
  nezávisí), ale vede jen k prázdné aplikaci, ne k původním datům.

- Verdikt 9.4 celkově: ❌ (a) + ❌ (b) + ✅ (c) + ⚠️ (d).

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-9.2 | ❌ **VYSOKÁ** (jen pro demo-enabled build) | Zapnutí Marketing Demo Mode **nenávratně smaže všechna reálná data** (`DELETE FROM` 28 tabulek bez WHERE) a **záloha neexistuje**; „vypnutí" data neobnoví, jen znovu vymaže → prázdná aplikace (9.4 a+b) | `marketingDemoDataService.ts:516-561, 1197, 1250` | **Rozhodnutí Petra.** Návrh: (1) minimálně **výrazné varování v potvrzovacím dialogu** („smaže VŠECHNA tvá data, nelze vrátit"), (2) ideálně **záloha před aktivací** (dump dotčených tabulek do JSON v AsyncStorage / souboru) + obnova při vypnutí, (3) alternativa: demo data jen na **čisté instalaci / simulátoru** a v kódu tvrdě odmítnout aktivaci, když v DB existují reálná data |
| N-9.3 | ⚠️ nízká | Po `COMMIT` běží legacy seed + nastavení příznaku mimo transakci → pád v tom okně nechá demo data s příznakem „vypnuto" (9.4 d) | `marketingDemoDataService.ts:1204-1228` | Nastavit příznak jako součást téže transakce (nebo hned po commitu před ostatními kroky) |
| N-9.1 | 🧹 doc | Guide Crashlytics jmenuje `initializeAdsWithConsent()` jako call-site `enable()`; funkce se po refaktoru jmenuje `finalizeAdsAndDiagnostics()` (9.2) | `technical-guides:Crashlytics.md` §Consent gating | Opravit název funkce |

**Pozitivní zjištění bez nálezu**: 9.1 (anti-abuse) ✅ přímo i nepřímo,
9.2 ✅ 4/4 shoda + žádný přímý import, 9.3 ✅ kompletní, 9.4 (c) ✅ gating
v produkci spolehlivý, 9.4 (d) transakční ochrana destruktivní fáze ✅.

## Rozhodnutí Petra (2026-07-21, session #15 — doslovně)

> „N9.2 - stačí bod 1 / 9.3 - nevím co s tím, nechám na tobě
> 9.1 - tohle zní asi užitečně, nechám na tobě"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-9.2 | **Bod 1** (varování) | Výrazné varování v potvrzovacím dialogu. **Pozor:** destruktivní okamžik je NAČTENÍ demo dat, které dnes potvrzení NEMÁ vůbec (spouští se přímo z tlačítka) → přidat potvrzovací dialog s tvrdým varováním k načtení, a zpřísnit i text u mazání (nechá appku prázdnou) |
| N-9.3 | Fable rozhodne → **PROVÉST** | Nastavení příznaku přesunout hned za `COMMIT`, před legacy seed a emity — okno nekonzistence se zkrátí na minimum. Atomicita napříč SQLite + AsyncStorage není možná (dvě různá úložiště), tohle je nejlepší levné zlepšení |
| N-9.1 | Fable rozhodne → **PROVÉST** | Triviální oprava názvu funkce v guide |

## PLAN-DISCREPANCY

- Plán 9.4 uvádí, že `marketingDemoDataService.ts` „zapisuje mj. do reálné
  `xp_multipliers` tabulky" — potvrzeno, a je to **širší, než plán naznačuje**:
  zapisuje/maže napříč **28 tabulkami** (viz výše).
- Plán jmenuje `src/services/marketingDemoModeService.ts` — existuje, ale je to
  jen 16řádkový přepínač příznaku; veškerá destruktivní logika je v
  `marketingDemoDataService.ts`.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 4 (9.1–9.4) | 4 (9.1–9.4, u 9.4 všechna 4 podkritéria a-d) | ✓ |

## PROVEDENÍ OPRAV (2026-07-21, po rozhodnutích Petra)

1. **N-9.2 ✅ PROVEDENO (bod 1 — varování)** — a to na správném místě:
   destruktivní okamžik je **NAČTENÍ** demo dat, které dosud potvrzení
   **nemělo vůbec** (spouštělo se přímo z tlačítka!).
   - `app/(tabs)/settings.tsx`: všechna tři tlačítka (auto/DE/ES) nově vedou
     přes `requestLoadMarketingDemoData()` → nový `ConfirmationModal`
     „Delete ALL your data and load demo?" s explicitním varováním: smaže
     návyky, splnění, cíle, pokroky, zápisy, streak, XP, trofeje i výzvy;
     **žádná záloha, žádné vrácení**; vypnutí demo módu data NEobnoví; a
     doporučením pouštět to jen na zařízení bez reálných dat. Potvrzovací
     tlačítko pojmenováno „Delete my data & load demo" (ne neutrální „OK").
   - Text u mazání zpřísněn: „Clear ALL data?" + upozornění, že to vymaže
     i případná reálná data a nechá appku prázdnou.
2. **N-9.3 ✅ PROVEDENO** — `setMarketingDemoModeEnabled(true)` přesunuto
   bezprostředně za `COMMIT` (`marketingDemoDataService.ts`), před legacy seed
   a emitování událostí. Okno, kdy DB obsahuje demo data, ale příznak hlásí
   „vypnuto", se zkrátilo na jediný `await`. Atomicita napříč SQLite +
   AsyncStorage možná není (dvě různá úložiště) — v kódu zdokumentováno.
3. **N-9.1 ✅ PROVEDENO** — `technical-guides:Crashlytics.md` §Consent gating:
   `initializeAdsWithConsent()` → `finalizeAdsAndDiagnostics()` + poznámka
   o přejmenování při zavedení Startup Orchestratoru.

**Vědomě NEprovedeno** (dle rozhodnutí „stačí bod 1"): záloha před aktivací a
obnova při deaktivaci (body 2 a 3 z návrhu). Demo mód tedy **nadále maže data
nenávratně** — nově ale až po explicitním potvrzení, které to jasně říká.
Riziko zůstává ohraničené na buildy s `EXPO_PUBLIC_ENABLE_MARKETING_DEMO=true`.

### Verifikace

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 464 passed, 464 total (31/31 suites)
```

## Stav: HOTOVO (2026-07-21) — audit 4/4 položek ✓, N-9.2 (bod 1) + N-9.3 + N-9.1 provedeny; záloha demo dat vědomě odložena
