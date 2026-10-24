# SelfRise V2 - Project Plan

> 📦 **Handoff**: Blueprinty zbývající práce (runtime ověření, Crashlytics, Achievements audit, N27/N28/N31, Sprint 4) + nebezpečné zóny: @handoff-blueprints.md

> 🧹 **Úklid 2026-07-14**: Dokončené sekce přesunuty do @implementation-history.md (viz index níže). Tento soubor drží už jen ROZPRACOVANÉ a PLÁNOVANÉ úkoly + trvalou referenci.

> 🚀 **Stav 2026-10-04**: aplikace má **ostrou verzi v App Store i Google Play**. Fáze 1–10
> hotové. Hotové úkoly a jejich historie: @projectplan-archive.md → „Úklid projectplan.md
> 2026-10-04". Odložené / neplánované věci: @projectplan-future-updates.md (Phase 0–11).

---

## 🎯 AKTUÁLNÍ ÚKOLY

### 📊 Analytika prvního dne + úpravy úvodu před marketingem (od 2026-10-10)

**Proč**: lidé hned odcházejí (D1 jednotky %, D7 9 %) a před organickým marketingem (videa
s Mendem) chceme vidět, na kterém kroku prvního dne odpadají. Vše vyjde **v jedné
aktualizaci před prvním videem**. Stav: 🔨 **schváleno 2026-10-10** — Etapa 1 a 2 hotové, další krok je Etapa 3
(Petrův test na zařízení a vydání).

Technická pravidla: Onboarding @technical-guides:Tutorial.md · Start a souhlasy
@technical-guides:Startup-Orchestrator.md · Připomínky @technical-guides:Notifications.md ·
Analytika @technical-guides:Analytics.md

**Hranice**: žádný osobní obsah. Parametry jsou jen pevné hodnoty z naší nabídky, nikdy
text od uživatele. Analytika běží na oprávněném zájmu podle Privacy Policy
(https://tqyronstudio.github.io/privacy.html), consent mode v AdMob zůstává vypnutý.

**Etapa 0 – Petr (mimo kód)**
- [x] AdMob propojený s Firebase
- [x] Consent mode v AdMob zjištěn: vypnutý → necháváme
- [ ] Zkontrolovat deklarace v obchodech: App Privacy (Product Interaction + Device ID) a
      Data safety (App interactions + Device or other IDs); když chybí, doplnit

**Etapa 1 – Měření (1 posezení)**
- [x] Typovaný analytický modul: pevné hodnoty parametrů, odeslání bez čekání, nikdy nehází
- [x] Příznak „nová instalace" + datum při první úvodní bráně (staří uživatelé a restart
      úvodu z Nastavení se do trychtýře nepočítají)
- [x] Úvod (parametry v závorce):
  - `onb_start`
  - `onb_language` (`language`: en/de/es)
  - `onb_theme` (`theme`: light/dark)
  - `onb_notifications` (`choice`: yes/later, `os`: granted/denied/none)
  - `onb_welcome_done`
  - `onb_habit_created` (`source`: preset/custom, `preset`: id předvolby)
  - `onb_goal_created` (`source`: template/custom, `template`: id šablony)
  - `onb_complete` (`method`: check/button/learn_more, `duration_s`)
  - `onb_skip` (`screen`: 1/2)
- [x] Mimo úvod:
  - `first_habit_check` (`in_onboarding`: 0/1, `min_since_start`)
  - `first_journal_entry` (`day`: dny od instalace; 0 = den instalace)
  - `day_return` (`day`: 1–7)
  - `reminder_open` (`type`: afternoon/evening; u všech uživatelů, nejen nových)
- [x] Štítky uživatele: `onb_result`, `notif_optin`
- [x] Testy (včetně ověření, že spadnou) + nový průvodce Analytics.md

**Etapa 2 – Úpravy appky (1 posezení)**
- [x] Nastavení: „Zásady ochrany soukromí" (web v prohlížeči uvnitř appky) a „Nastavení
      soukromí" (souhlasové okno Googlu, jen kde je vyžadováno)
- [x] Jazyk podle telefonu (de/es, jinak en); krok výběru zůstává, jen předvybraný
- [x] Uvítání: podtitul „Build a better life, one small step a day." (+ DE/ES)
- [x] Konec úvodu jako karta se dvěma stavy (schváleno Petrem 2026-10-10):
  - výzva „One last step / Tick off your habit and watch your XP grow."
  - po odškrtnutí „Day 1 done 🔥" + text podle připomínek („… Come back tomorrow,
    we'll remind you in the afternoon." / „… Come back tomorrow and keep your streak
    growing."), EN/DE/ES
  - karta po odškrtnutí zůstane, dokud uživatel neťukne na tlačítko
- [x] Aktualizovat Tutorial.md (+ Notifications, AdMob, Startup-Orchestrator); `tsc` + `npm test`
- [x] Ťuknutí na připomínku při zavřené appce otevře správnou obrazovku (dnes se
      navigace ztratí; schváleno Petrem 2026-10-10) — @technical-guides:Notifications.md
- [x] Počítání dní přes změnu času (`daysBetween` ceil → round; 25. 10. by počítal
      o den víc; schváleno Petrem 2026-10-10)

**Etapa 2b – Konec úvodu podle Petrova testu (schváleno 2026-10-11)**
- [x] Úvod si pamatuje návyk z obrazovky 1 (i při restartu, i po zabití appky)
- [x] Výzva s názvem návyku („Last step: tick off „…"") + tichý odkaz „I'll do it
      later" místo „Got it"; pulzuje jen ten návyk; odškrtnutí se pozná na něm
- [x] Závěr přes celou obrazovku (pohled, ne modal) ve 2 variantách:
  - odškrtl → „Day 1 done 🔥" + dnešní XP, úroveň, série 1 + slib na zítřek
  - „později" → „Your journey starts today 🌱" + úkol „odškrtni „…", až ho splníš"
  - hlavní tlačítko „Let's do this", tichý odkaz „How it all works →"
  - úvod se zapíše jako dokončený až při zavření závěru (předchozí mezikrok
    „zapsat 1,2 s po odškrtnutí" se ruší — závěr zakrývá appku)
- [x] Měření: `onb_complete.method` = check/later, nová `onb_learn_more`
- [x] Texty EN/DE/ES (ukázat Petrovi), testy, Tutorial.md + Analytics.md

**Etapa 3 – Vydání (Petr)**
- [ ] Device test: čistá instalace iOS + Android, EN/DE/ES, události ve Firebase → Realtime
  - konec úvodu: výzva jmenuje návyk z obrazovky 1 a pulzuje jen on → po odškrtnutí
    závěr přes celou obrazovku „Day 1 done 🔥" s XP, úrovní a sérií; podruhé „I'll do
    it later" → „Your journey starts today 🌱" bez odměn; text o připomínce jen při
    povolených připomínkách; restart ze Settings večer; zabití appky na závěru
  - zavřít appku úplně, ťuknout na večerní připomínku → otevře se obrazovka s tím, co
    chybí (ne jen Domů)
  - Nastavení → Soukromí: odkaz otevře web v appce; „Nastavení soukromí" jen v EU
- [ ] Build + odeslání do obchodů
- [ ] Ve Firebase označit `onb_complete` a `first_habit_check` jako klíčové události
- [ ] Předat marketingu:
  - Úvod teď používá slogan „Build a better life, one small step a day." Videa by ho
    měla používat taky, aby uživatel po instalaci viděl tutéž větu.
  - Mendo v appce zatím není. Ve videích ho ukazovat jako tvář značky, ne jako funkci
    appky.

**Etapa 4 – Vyhodnocení (po ~200 nových instalacích)**
- [ ] Trychtýř po krocích, zvlášť iOS a Android; návratnost podle `notif_optin` a `onb_result`
- [ ] Výnos z reklam na uživatele podle kohort (AdMob je propojený, `ad_impression` přichází
      automaticky)
- [ ] Srovnávat stejné metriky: dnešní „D1 jednotky %" a „týden 9 %" si odporují,
      pravděpodobně se míchá denní a týdenní kohorta
- [ ] Rozhodnout o vlně B podle dat:
  - **Kandidát 1: úvod před souhlasová okna.** Nejdřív uvítání → návyk → první
    odškrtnutí, žádosti (notifikace, ATT, souhlas EU) až potom. Rozhoduje úbytek mezi
    `first_open` a `onb_start`. Povoleno pravidly Applu i Googlu (ověřeno 2026-10-10)
    za podmínek: reklamy až po souhlasu, žádná odměna za povolení, vlastní
    obrazovka nesmí napodobovat systémové okno.
  - Cíl až po prvním odškrtnutí
  - Deník (první zápis) přímo v úvodu
  - Druhá nabídka notifikací po prvním úspěchu (pro ty, kdo dali „Teď ne")
  - Personalizovaná připomínka na den 2 (návyk + série; zůstává lokálně v telefonu)
  - Čas připomínek podle návyku místo pevných 16:00 a 20:00
  - Vzhled podle systému a jazyk bez zvláštního kroku: úvod by se zkrátil o 2 obrazovky
- [ ] **Později: Mendo v appce.** Až se marketing usadí; přesný záměr ještě
      nerozhodnutý. Navazuje na „důvod vrátit se zítra" (příběh pejska na pokračování).

### 🤖 Google Play – varování z Play Console (od 2026-10-13)

Stav: ✅ **2026-10-20 Petr: všechno naráz v 7.0.2** → R8 **včetně optimalizace** (oprava Records, generálka
prošla: ~87 % u všech tří metrik, připomínky přežijí aktualizaci i restart) + velké obrazovky. Další krok: commit →
EAS build → interní testování s testerkou. *(Dřívější stav:)* fáze 1 a 2 hotové 2026-10-17. Generálka: **7.0.2 = R8 bez optimalizace (V1)**,
ověřeno v emulátoru vč. přežití připomínek přes aktualizaci; optimalizace rozbila data a databázi →
fáze 8 (do 15. 1. 2027). Další krok: commit → EAS build → interní testování s testerkou. Celý plán, testy a postup krok za krokem:
**@google-play-compliance-plan.md**

- [ ] A – *(kód hotový 2026-10-20, čeká na vydání)* Zapnout R8 + optimalizaci (Google chce ≥ 25 % optimalizace, obfuskace i zmenšení, termín
      **únor 2027**; teď hlášena obfuskace 1 %) → samostatné vydání 7.0.2
- [ ] B – Zastaralá API edge-to-edge → jen knihovny, sledovat při upgradu Expo SDK
- [ ] C – Velké obrazovky (Android 16 už ignoruje zámek na výšku) → diagnostika hotová 2026-10-18 (nic
      nebrání používání; po otočení za běhu je graf deníku a mřížka achievementů částečně mimo obrazovku);
      **2026-10-19 Petr: opravit hned v 7.0.2** → kód hotový (sloupec uprostřed, živý přepočet, telefony beze
      změny; @technical-guides:Large-Screens.md), ověřeno 2026-10-20 na emulátoru tabletu (na výšku, na šířku, otočení za běhu) i telefonu

### ✨ Prémiový vzhled – design systém a pohyb (od 2026-10-22)

- [ ] **Plně implementováno** – audit, dva směry, rozhodnutí a plán po fázích: @premium-design-plan.md

---

## 🚨 DŮLEŽITÉ - NEMAZAT 🚨

### Cílová kvalita - TOP světová úroveň:
Aplikace MUSÍ být na špičkové úrovni ve všech aspektech:
- **Funkcionalita** - Bezchybná, intuitivní, rychlá
- **Design** - Moderní, elegantní, profesionální
- **Animace** - Smooth, přírodní, poutavé
- **UX** - Vynikající uživatelský zážitek srovnatelný s nejlepšími aplikacemi na trhu

### 🛠️ Future Skills Roadmap
Seznam Claude Code skills a MCP serverů pro instalaci v jednotlivých fázích projektu (Wave 1: TEĎ, Wave 2: před Phase 10, Wave 3: post-launch):
**Roadmap:** @future-skills-roadmap.md

---

## Project Overview
SelfRise V2 is a React Native mobile application built with Expo and TypeScript, focused on goal tracking, habit formation, and gratitude journaling. The app will feature internationalization (i18n) support with English as the default language and future support for German and Spanish.

## Core Features
- **Home**: Daily gratitude streak display and interactive habit statistics
- **Habits**: Habit creation, management, and tracking with customizable scheduling
- **My Journal**: Daily reflection with gratitude and self-praise entries
- **Goals**: Long-term goal setting with progress tracking
- **Settings**: Notifications, user authentication, and preferences

## Technical Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Bottom tab navigation
- **Styling**: Consistent light theme design
- **Data Storage**: Local storage with future Firebase integration

---

## Development Phases

- Phase 1: Core Foundation (navigace, Home) ✅
- Phase 2: Habit Tracking System ✅
- Phase 3: My Journal ✅
- Phase 4: Goals System ✅
- Phase 5: Gamification & XP System ✅
- Phase 6: Monthly Challenges ✅
- Phase 7: Settings & UX (notifikace, theme, jazyk) ✅
- Phase 8: External Services (Firebase, AdMob, ATT) ✅
- Phase 9: Testing & QA ✅ — 49 sad / 684 testů (2026-10-04)
- Phase 10: App Store & Google Play ✅ — ostrá verze v obou obchodech

*(Detailní checklisty → @projectplan-archive.md a @implementation-history.md)*

---

## ✅ Dokončené fáze (archiv)

SQLite migrace (SEKCE 1–4), Firebase Analytics + ATT (Phase 12), Tutorial Spotlight refaktoring (Skia), vyřešené Known Issues — vše hotové, detaily: @implementation-history.md a @projectplan-archive.md.

---

---

## 🔮 FUTURE UPDATES

Plánované a odložené funkce: **@projectplan-future-updates.md** (export a zálohy dat, FCM,
orchestrator Úroveň 2, Meta Ads & analytika, dojezd Fáze 13, „omezit pohyb" u XP bubliny…).
