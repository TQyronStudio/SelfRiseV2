# 📊 SelfRise V2 — Analytics (trychtýř prvního dne) Technical Guide

**🏃 CO TOHLE OBSAHUJE:**
- **5 kritických pravidel** — bez nich trychtýř lže, vynáší osobní data nebo rozbije úvod
- **Seznam událostí a štítků** — co přesně se posílá, odkud a s jakými hodnotami
- **Kdo se do trychtýře počítá** — jen nové instalace, každý krok jednou
- **Vztah k souhlasům** (ATT, UMP, consent mode) a k Privacy Policy
- **Nebezpečné zóny** — jak si to rozbít, aniž by spadl jediný test

**🔧 KDY TOHLE POUŽÍVAT:**
- Přidáváš, měníš nebo mažeš jakoukoliv analytickou událost
- Saháš na úvod (`TutorialContext`, `src/components/onboarding/`, bránu předvoleb)
  — volají se z něj události trychtýře
- Měníš předvolby návyků (`habitPresets.ts`) nebo šablony cílů (`goalTemplates.ts`)
  — jejich id jsou na whitelistu
- Měníš sběr dat, souhlasová okna nebo Privacy Policy

---

## Proč tenhle systém existuje

Appka vydělává jen na reklamách, takže výdělek = počet uživatelů × počet dní, kdy
appku otevřou. Z Firebase (září–říjen 2026) bylo vidět, že kdo zůstane, tráví v appce
přes 7 minut denně — ale většina nových lidí odejde hned první den. Do té doby
appka posílala jen technické události, takže nebylo vidět, **na kterém kroku**
lidé odpadají.

Trychtýř prvního dne (od 2026-10-10) to měří: od otevření úvodu přes první návyk,
cíl a první odškrtnutí až po návrat v dalších dnech. Na jeho datech se rozhoduje,
co v prvním dni zlepšit (viz „vlna B" v `projectplan.md`).

---

## 🚨 5 KRITICKÝCH PRAVIDEL

### Pravidlo 1: Žádný osobní obsah — jen hodnoty z whitelistu

```typescript
// ❌ WRONG: název, který uživatel napsal, odejde do Firebase
FirebaseAnalytics.logEvent('onb_habit_created', { name: habit.name });

// ✅ CORRECT: id dlaždice, ze které uživatel vyšel — nikdy text
void FirstDayAnalytics.habitCreated(selectedId);   // → { source, preset }
```

**Proč**: Privacy Policy slibuje, že obsah (návyky, cíle, deník) neopouští telefon.
`firstDayEvents.ts` drží whitelist každé události, parametru i hodnoty a
`sanitizeFirstDayParams()` ho uplatní těsně před odesláním. Hodnota mimo seznam se
nahradí `other`, neznámý parametr se zahodí, neznámá událost se nepošle vůbec.
Typy hlídají volání při kompilaci, sanitizace za běhu.

### Pravidlo 2: Analytika nikdy neblokuje a nikdy nehází

```typescript
// ❌ WRONG: čekat na analytiku v toku úvodu
await FirstDayAnalytics.welcomeDone();
setShowOnboardingWelcome(false);

// ✅ CORRECT: vypálit a zapomenout
void FirstDayAnalytics.welcomeDone();
setShowOnboardingWelcome(false);
```

**Proč**: úvod stojí na přesném pořadí oken (jinak iOS zamrzne — viz
@technical-guides:Tutorial.md a @technical-guides:Startup-Orchestrator.md).
Analytika ho nesmí zdržet ani rozbít. Každá veřejná funkce `FirstDayAnalytics` je
obalená `guard()`: chybu zaloguje a spolkne.

### Pravidlo 3: Do trychtýře vstupují jen nové instalace — na jediném místě

```typescript
// ✅ CORRECT (TutorialContext.tsx, autoStart, větev brány předvoleb)
void FirstDayAnalytics.onboardingStarted();   // jediný zápis stavu trychtýře
setShowOnboardingPrefs(true);

// ❌ WRONG: zapsat stav trychtýře jinde (např. při restartu ze Settings)
```

**Proč**: brána předvoleb se ukáže jen při úplně prvním spuštění. Uživatelé, kteří
appku měli před touto verzí, ji už neuvidí, takže do trychtýře nikdy nevstoupí —
jinak by jim po aktualizaci naskočilo „první odškrtnutí" a trychtýř by lhal. Všechny
ostatní události trychtýře bez stavu (`analytics_first_day_state`) nic nepošlou.

**Past, kterou `onboardingStarted()` hlídá sám:** bránu může uvidět i stávající
uživatel — kdo appku měl dřív, než brána existovala (nemá `PREFS_COMPLETED`), dal
restart úvodu ze Settings a appku mu systém v půlce zabil. Při dalším startu
autoStart otevře bránu. Proto `onboardingStarted()` nic nezapíše, když je nastavený
`TUTORIAL_STORAGE_KEYS.RESTARTED` (přežije zabití appky, maže se až dokončením nebo
přeskočením úvodu).

### Pravidlo 4: Každý krok nejvýš jednou; po konci úvodu už žádný `onb_*`

```typescript
// claimOnce(step): příznak se zapíše PŘED odesláním → raději ztratit jednu
// událost při pádu než počítat krok dvakrát
// onboardingEnded(): po onb_complete / onb_skip se další onb_* krok nepošle
```

**Proč**: restart úvodu ze Settings projde uvítáním, návykem i cílem znovu. Bez
těchto pojistek by jeden člověk prošel trychtýřem dvakrát. Proti dvěma souběžným
voláním téhož kroku (dvojí ťuk, efekt + tlačítko) chrání ještě `claimsInFlight`.

### Pravidlo 5: Firebase se načítá líně přes most v `useFirebaseAnalytics`

```typescript
// ✅ CORRECT (firstDayAnalytics.ts, send())
const { FirebaseAnalytics } = require('../../hooks/useFirebaseAnalytics');

// ❌ WRONG: top-level import '@react-native-firebase/analytics' v modulu,
//    který importují kontexty
```

**Proč**: `HabitsContext`, `GratitudeContext` a `TutorialContext` importují
analytický modul. Top-level import nativního modulu by ho natáhl do Jest grafu
všech jejich testů (nemockuje se globálně) a rozbil je.

---

## Události

Soubor pravdy: `src/services/analytics/firstDayEvents.ts` (`FIRST_DAY_EVENTS`).

| Událost | Kdy | Parametry | Odkud |
|---|---|---|---|
| `onb_start` | brána předvoleb se poprvé ukázala | – | `TutorialContext` autoStart |
| `onb_language` | potvrzení jazyka | `language`: en/de/es | `OnboardingPreferencesModal.handleConfirm` |
| `onb_theme` | potvrzení vzhledu | `theme`: light/dark | `OnboardingPreferencesModal.handleConfirm` |
| `onb_notifications` | volba u notifikací | `choice`: yes/later, `os`: granted/denied/none | `TutorialContext.completeOnboardingPrefs` |
| `onb_welcome_done` | odchod z uvítání | – | `TutorialContext.completeOnboardingWelcome` |
| `onb_habit_created` | první návyk | `source`: preset/custom, `preset`: id/none | `FirstHabitScreen.handleCreate` |
| `onb_goal_created` | první cíl | `source`: template/custom, `template`: id/none | `FirstGoalScreen.handleCreate` |
| `onb_complete` | úvod došel na závěr | `method`: check/later, `duration_s` | `FirstCheckCard` |
| `onb_learn_more` | „How it all works" na závěru | – | `FirstCheckCard.handleLearnMore` |
| `onb_skip` | přeskočení | `screen`: 1/2 | `TutorialContext.skipOnboarding` |
| `first_habit_check` | vůbec první odškrtnutí návyku | `in_onboarding`: 0/1, `min_since_start` | `HabitsContext.toggleCompletion` |
| `first_journal_entry` | vůbec první zápis do deníku | `day` (dny od instalace) | `GratitudeContext.createGratitude` |
| `day_return` | první aktivace appky v den 1–7 | `day`: 1–7 | `useDayReturnTracking` (`app/_layout.tsx`) |
| `reminder_open` | ťuknutí na připomínku (**všichni uživatelé**) | `type`: afternoon/evening | `useNotificationLifecycle` |

**Upřesnění, na kterých záleží:**
- `onb_complete` se posílá ve chvíli, kdy se ukáže **závěr** úvodu: `check` 1,2 s
  po odškrtnutí návyku z obrazovky 1 (závěr „Day 1 done"), `later` po „I'll do it
  later". Kolik lidí první den opravdu odškrtne, je tedy přímo podíl `check`.
- `onb_learn_more` přichází **po** `onb_complete`, proto ho neblokuje pojistka
  „po konci úvodu už žádný `onb_*`" — jen stav trychtýře a jednou za instalaci.
- `duration_s` a `min_since_start` se měří od **první** brány; force-quit na bráně
  start nepřepíše.
- `onb_theme` posílá zaškrtnutou volbu v bráně (výchozí `light`, když uživatel nic
  nezmění).
- `reminder_open` se počítá i ze **studeného startu**: ťuknutí, které appku spustilo,
  posluchač nedostane, proto se při startu čte `getLastNotificationResponse()`.
  Stejné ťuknutí z obou cest se počítá jednou (klíč `identifier|date`).
- `day_return` se kontroluje při startu i při každém návratu do popředí — kdo appku
  nezavřel, druhý den ji jen přepne. „Den" je **kalendářní den** v čase telefonu:
  instalace ve 23:00 a návrat v 00:30 je `day: 1`.

### Štítky uživatele (user properties)

| Štítek | Hodnoty | Kdy |
|---|---|---|
| `onb_result` | in_progress / completed / skipped | `onb_start`, `onb_complete`, `onb_skip` |
| `notif_optin` | granted / denied / later | volba v bráně (**ne** pozdější změna v Nastavení) |

Na štítcích stojí hlavní otázka měření: **„mají lidé s povolenými notifikacemi
lepší návratnost?"** — ve Firebase porovnání retence podle štítku.

---

## Firebase limity (hlídá `firstDayEvents.test.ts`)

- Název události a parametru: písmeno na začátku, jen `[a-zA-Z0-9_]`, max 40 znaků,
  bez prefixů `firebase_`, `google_`, `ga_`
- Textová hodnota parametru max 100 znaků
- Štítek: název max 24, hodnota max 36 znaků; celkem max 25 štítků na projekt

---

## Souhlasy, Privacy Policy, obchody

- **Sběr Firebase Analytics běží od prvního spuštění.** `firebase.json` automatický
  sběr nevypíná, takže `setAnalyticsCollectionEnabled(true)` v
  `initAnalyticsAfterConsent()` je jen formalita. Úvod ale startuje až za bariérou
  souhlasových oken, takže časování žádný krok trychtýře neztratí.
- **Consent mode v AdMob je vypnutý** (rozhodnutí Petra 2026-10-10). Analytika tak
  běží i u lidí z EU, kteří odmítli personalizované reklamy — v souladu s Privacy
  Policy, která základní analytiku opírá o **oprávněný zájem**
  (https://tqyronstudio.github.io/privacy.html). Kdyby se consent mode zapnul,
  odmítnutí z EU budou posílat jen anonymní signály a v trychtýři zmizí.
- **ATT** na trychtýř nemá vliv: Firebase posílá události i bez povolení, jen bez
  reklamního identifikátoru.
- **Deklarace v obchodech**: události spadají pod App Privacy → *Product Interaction*
  a Data safety → *App interactions*.
- **AdMob je s Firebase propojený**: `ad_impression` s výnosem přichází automaticky
  (výnos podle kohort bez dalšího kódu).

**Nová událost nebo parametr = zkontroluj, že stále sedí s Privacy Policy a
deklaracemi.** Cokoliv mimo „anonymní údaje o používání" vyžaduje jejich úpravu.

---

## ⚠️ NEBEZPEČNÉ ZÓNY

1. **⛔ Text od uživatele v parametru** — sanitizace ho sice nahradí `other`, ale
   pokus o to je chyba návrhu. Posílej id dlaždice, nikdy název.
2. **⛔ `await` analytiky v toku úvodu** — zdrží přechody a v nejhorším pustí okno
   přes okno (pravidlo 2).
3. **Nová předvolba návyku nebo šablona cíle bez úpravy whitelistu** — trychtýř
   funguje dál, ale dlaždice se ukáže jako `other`. Test `firstDayEvents.test.ts`
   na to upozorní (porovnává seznamy se skutečnými konstantami).
4. **Zápis stavu trychtýře mimo `onboardingStarted()`** — vpustí do trychtýře
   stávající uživatele (pravidlo 3).
5. **Přejmenování události** — ve Firebase vznikne nová, stará data zůstanou pod
   starým jménem a trychtýř se rozpadne na dvě půlky. Přejmenovávat jen vědomě.
6. **Top-level import `@react-native-firebase/analytics`** v modulu, který importují
   kontexty — rozbije Jest (pravidlo 5).
7. **Změna klíčů `analytics_first_day_*`** — stávající instalace by vstoupily do
   trychtýře znovu nebo z něj vypadly.

---

## Testování

```bash
PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH" npx jest src/services/analytics
```

- `firstDayEvents.test.ts` — whitelist (text neprojde, neznámé parametry a události
  se zahodí), Firebase limity, souhlas whitelistu s předvolbami a šablonami
- `firstDayAnalytics.test.ts` — kdo vstupuje do trychtýře (i past s restartem a
  zabitím appky), celý průchod, každý krok jednou (i dvojí souběžné volání kroků
  úvodu a prvního odškrtnutí), konec po skipu/dokončení, restart ze Settings nic
  nepošle, `day_return` dny 0/1/2/7/8, deduplikace `reminder_open`, nic nehází
- `src/config/__tests__/deviceLanguage.test.ts` — jazyk podle telefonu (pro úvod)

Každý z těchto testů byl ověřen záměrným rozbitím hlídaného chování (2026-10-10).

**Na zařízení (bez kabelu) — přehled Realtime:**
Firebase Console → Analytics → *Realtime* (nebo GA4 → Reports → Realtime) ukazuje
události z posledních 30 minut. Čistá instalace → projít úvod → události se tam
objeví zhruba do minuty. Standardní reporty mají zpoždění až 24 h.

*DebugView* (události po jedné, s parametry) vyžaduje zapnutý debug režim:
iOS argument `-FIRDebugEnabled` při spuštění z Xcode, Android
`adb shell setprop debug.firebase.analytics.app com.petrturek.selfrise`. Obojí
potřebuje připojení k počítači, takže pro běžné ověření stačí Realtime.

---

## Co se NESMÍ rozbít

- Žádný obsah od uživatele nikdy neopustí telefon
- Úvod funguje přesně jako bez analytiky (žádné čekání, žádná výjimka)
- Stávající uživatelé po aktualizaci do trychtýře nevstoupí
- Restart úvodu ze Settings nepřidá druhý průchod
- Testy kontextů (`HabitsContext`, `GratitudeContext`, `TutorialContext`) běží bez
  mocku Firebase

---

## Device scénáře

1. **Čistá instalace, EN telefon** → DebugView ukáže `onb_start` … `onb_complete`
   v pořadí, `first_habit_check` s `in_onboarding = 1`.
2. **„Teď ne" u notifikací** → `onb_notifications { choice: later, os: none }`,
   štítek `notif_optin = later`.
3. **Přeskočit na obrazovce 2** → `onb_skip { screen: 2 }`, pak žádný `onb_*`.
3a. **„I'll do it later" na obrazovce 3** → `onb_complete { method: later }`;
   „How it all works" na závěru → `onb_learn_more`.
4. **Restart úvodu ze Settings** → žádná nová `onb_*` událost — ani když se appka
   během restartu zabije a při dalším startu ukáže bránu.
5. **Druhý den** otevřít appku (i jen přepnout z pozadí) → `day_return { day: 1 }`,
   podruhé ten den už nic.
6. **Ťuknutí na připomínku při zavřené appce** → `reminder_open` jednou.
7. **Aktualizace ze starší verze** (appka už prošla úvodem) → žádná událost trychtýře.

---

**GOLDEN RULE**: *„Jen id, nikdy text. Vypálit a zapomenout. Do trychtýře jen
nové instalace a každý krok jednou."*

---

*Tento průvodce je závazná reference pro veškerou práci s analytikou. Popisuje stav
kódu — když se kód změní, změň i tenhle soubor.*
