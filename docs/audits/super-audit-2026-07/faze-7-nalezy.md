# Fáze 7 — nálezy (super audit 2026-07): Notifications — PLNÝ audit

Datum: 2026-07-20 | Commit: `5b6442c` | Node: v24.18.0
Baseline: tsc 0 chyb, testy 451/451 (30/30 suites)

```
Tests:       451 passed, 451 total
```

Scope dle plánu: položky 7.1–7.5. Guide: `technical-guides:Notifications.md` (866 ř.).
Soubory: `notificationService.ts` (421 ř.), `notificationScheduler.ts` (499 ř.),
`progressAnalyzer.ts` (219 ř.), `useNotificationLifecycle.ts` (165 ř.),
`NotificationSettings.tsx` (465 ř.).

**Celkové hodnocení: jádro (vážený výběr) je implementováno PŘESNĚ dle guide.**
Žádný kritický nález. 1 nález střední priority (navigace při tapu obchází cíle),
2 výkonnostní nálezy v analyzátoru běžícím při každém foregroundu, 1 latentní
křehkost (špatné datumové pole), 1 mrtvá metoda a 1 rozpor uvnitř guide (E5).

⚠️ **Fáze nemá ŽÁDNOU regresní test suite** — notifikace nejsou kryté ani
jedním testem (viz nález N-7.7).

## Položky

### 7.1 Weighted random selection (večerní notifikace)

- Kde: `notificationScheduler.ts:320-398` (`generateSmartEveningMessage`),
  `:404-428` (`weightedRandomPick`), zdroj dat `progressAnalyzer.ts:78-123`
- Pravidlo: guide ř. 56-168 — habits `(incomplete/scheduledToday)×100`,
  journal `((3-count)/3)×100`, bonus fixních 15 jen při 3+ základních zápisech.
- Ověřeno jak: porovnání vzorců řádek po řádku + kontrola podmínek vstupu.
- Verdikt: ✅ **přesná shoda s guide, včetně všech podmínek.**
- Důkaz:
  - **Habits** (ř. 333-334): podmínka `incompletedHabitsCount > 0 &&
    scheduledTodayCount > 0`, váha `(incompletedHabitsCount /
    scheduledTodayCount) * 100` ✅ = guide ř. 136-140. Jmenovatel je
    `scheduledTodayCount` — tedy **jen dnes naplánované**, ne všechny aktivní
    (guide ř. 78 to explicitně vyžaduje); analyzátor ho počítá filtrem
    `habit.scheduledDays.includes(todayDayOfWeek)` (`progressAnalyzer.ts:87-92`) ✅.
  - **Journal** (ř. 353-355): podmínka `!hasThreeBasicEntries`,
    `missing = 3 - journalEntriesCount`, váha `(missing / 3) * 100` ✅ = guide ř. 144-148.
  - **Bonus** (ř. 374-382): podmínka `hasThreeBasicEntries && bonusEntriesCount < 10`,
    váha fixních `15` ✅ = guide ř. 152-156. Bonus tedy nikdy nesoutěží se
    základními požadavky (guide ř. 117) ✅.
  - **Losování** (`weightedRandomPick`, ř. 404-428): `totalWeight` = suma vah,
    `random = Math.random() * totalWeight`, kumulativní distribuce s
    `random <= cumulative` ✅ = guide ř. 164-167. Korektní vážený výběr.
  - Kontrolní přepočet guide příkladu B (1/5 habitů, 3 zápisy, 4 bonusy):
    habits 20, bonus 15 → 57,1 % / 42,9 % — sedí s guide ř. 205-208 ✅.

### 7.2 „No notification if all requirements met" — explicitní early-exit

- Kde: `notificationScheduler.ts:392-394` (early-exit), `:206-236`
  (rozhodování o dnešní notifikaci)
- Pravidlo: guide ř. 159-162 — když nejsou žádné options, **žádná notifikace**
  (ne fallback na náhodný text).
- Ověřeno jak: čtení větvení + kontrola, kam vedou jednotlivé cesty.
- Verdikt: ✅ **explicitní early-exit implementován správně, bez fallbacku.**
- Důkaz:
  - `generateSmartEveningMessage` vrací `null` při `options.length === 0`
    (ř. 392-394) ✅ — žádný fallback na generický text.
  - `scheduleEveningReminder` (ř. 213-235): `if (personalizedMessage)` →
    naplánovat; `else if (!progress)` → generická (jen když **chybí data**);
    `else` → jen log „All tasks complete for today - no evening notification"
    a **nic se nenaplánuje** ✅. Rozlišení „vše hotovo" vs. „nemám data" je
    správné a odpovídá záměru.
  - Hybridní design (dnešek personalizovaně, dny +1..+30 genericky, ř. 238-255)
    je vědomý — generické texty jsou „vždy pravdivé, bez konkrétních čísel"
    (ř. 444-446), takže neporušují pravidlo 7.2 pro dny, kdy appka neběžela.
  - Limit iOS na počet čekajících notifikací: 30 večerních + 1 odpolední = 31,
    bezpečně pod systémovým limitem 64 ✅.

### 7.3 Smart tap navigation — re-analýza při tapu

- Kde: `useNotificationLifecycle.ts:130-159` (`navigateToMissingTask`),
  volané z `:96-125` (`handleNotificationResponse`)
- Pravidlo: guide ř. 388-404 — při tapu se volá
  `progressAnalyzer.analyzeDailyProgress()` ZNOVU, ne cachovaná hodnota;
  priorita habits → journal → goals → home.
- Ověřeno jak: čtení handleru + porovnání priorit s guide.
- Verdikt: ⚠️ **re-analýza je správně čerstvá ✅, ale pořadí priorit se
  odchyluje od guide a fakticky vyřazuje větev pro cíle.**
- Důkaz:
  - **Čerstvá data ✅**: `navigateToMissingTask` volá
    `await progressAnalyzer.analyzeDailyProgress()` přímo při tapu
    (ř. 132) — žádná cache, žádná hodnota z doby plánování ✅ = guide.
  - **N-7.1 [STŘEDNÍ] — větev pro cíle je prakticky nedosažitelná**:
    priorita 2 (ř. 141) zní `if (!progress.hasThreeBasicEntries ||
    progress.bonusEntriesCount < 10)` → naviguj do deníku. Guide (ř. 394-396)
    má jen `!hasThreeBasicEntries`. Přidaná podmínka `bonusEntriesCount < 10`
    je splněná, dokud uživatel nenapíše **13+ zápisů za den** (bonus =
    entries − 3), takže priorita 3 (cíle, ř. 147-150) se v praxi **nikdy
    nespustí**. Uživatel, který má hotové návyky i 3 zápisy, ale dnes
    nepřidal žádný pokrok k cíli, je poslán do Deníku místo do Cílů.
  - Kategorie notifikace se čte z `data.category` (ř. 98-99), kterou zapisuje
    `scheduleOneTimeNotification` (`notificationService.ts:263-267`) ✅ —
    routing afternoon → Home, evening → smart ✅.

### 7.4 i18n pluralizace notifikačních klíčů (EN/DE/ES)

- Kde: `notificationScheduler.ts:337-339, 358-360, 377-378`; locales
  `src/locales/{en,de,es}/index.ts`
- Pravidlo: plán 7.4 — kompletnost `body_one`/`body_other` ve všech 3 jazycích.
- Ověřeno jak: kontrola existence všech klíčů použitých kódem ve všech locales.
- Verdikt: ✅ **kompletní ve všech 3 jazycích**; ⚠️ způsob pluralizace obchází
  i18next (viz N-7.2).
- Důkaz (přítomnost klíčů, EN/DE/ES shodně 1×):
  - `reminders.evening.incomplete_habits` (title, body_one, body_other) ✅
  - `reminders.evening.missing_journal` (title, body_one, body_other) ✅
  - `reminders.evening.bonus_opportunity` (title, body) ✅
  - `reminders.evening.generic.variant1-4` — **4 varianty v každém jazyce** ✅
  - `reminders.afternoon.variant1-4` ✅ · `reminders.evening.fallback` ✅
  - Žádný chybějící klíč → kód nikdy nespadne na anglický hardcoded fallback.
- **N-7.2 [NÍZKÁ] — ruční pluralizace místo i18next**: kód si sám vybírá
  `count === 1 ? body_one : body_other` a dosazuje přes
  `.replace('{{count}}', ...)` (ř. 337-339) místo `t(key, { count })`.
  Pro EN/DE/ES (2 plurální tvary) je výsledek shodný, ale: (a) obchází to
  plurální pravidla i18next, takže přidání jazyka s víc tvary (CZ/PL/RU —
  one/few/many) tiše vybere špatný tvar; (b) `String.replace` s textovým
  vzorem nahradí jen **první** výskyt `{{count}}`.

### 7.5 `useNotificationLifecycle` po Startup Orchestrator refaktoru

- Kde: `app/_layout.tsx:53` (mount), `useNotificationLifecycle.ts:25-61`
  (listenery + cleanup)
- Pravidlo: plán 7.5 — hook mountnutý právě JEDNOU, listenery se při unmountu
  odregistrují, a git log od 14. 7. neukazuje nic, co by hook odpojilo.
- Ověřeno jak: grep mount pointů + čtení cleanupu + git log dle zadání.
- Verdikt: ✅ **všechna 3 kritéria splněna.**
- Důkaz:
  - **Mount právě jednou**: grep `useNotificationLifecycle` přes `src/` + `app/`
    → jediné volání `app/_layout.tsx:53` (uvnitř `LayoutContent`, tedy pod
    `RootProvider` — má přístup ke kontextům dle guide ř. 358) ✅.
  - **Cleanup listenerů**: `return () => { subscription.remove();
    notificationListener.current?.remove(); responseListener.current?.remove(); }`
    (ř. 56-60) — odregistrují se všechny tři (AppState + received + response) ✅.
  - **Git log** (kritérium plánu, doslovně):
    ```
    git log --oneline --since=2026-07-14 -- src/hooks/useNotificationLifecycle.ts app/_layout.tsx
    1e56d63 Add Startup Orchestrator (Level 1) — sequential first-launch modal pipeline
    ```
    Jediný commit je samotný Startup Orchestrator; ten hook **neodpojil**
    (`_layout.tsx:53` volání zůstalo, plán ho výslovně vedl jako „beze změny") ✅.
  - Pozn.: hook je záměrně MIMO startup pipeline — notifikace nejsou startovní
    okno (uživatel si je zapíná v Nastavení), což odpovídá analýze v
    projectplan.md ř. 231 ✅.

## Nálezy k opravě (číslované, s prioritou)

| # | Priorita | Co | Kde | Návrh |
|---|---|---|---|---|
| N-7.1 | ⚠️ **STŘEDNÍ** | Tap na večerní notifikaci: větev pro Cíle je prakticky nedosažitelná (podmínka `\|\| bonusEntriesCount < 10` posílá do Deníku, dokud uživatel nemá 13+ zápisů/den) — odchylka od guide (7.3) | `useNotificationLifecycle.ts:141` | Srovnat s guide: priorita 2 jen `!hasThreeBasicEntries`; bonusy řešit až za cíli (nebo úplně vypustit z navigace) |
| N-7.2 | 🧹 nízká | Ruční pluralizace (`count===1 ? body_one : body_other` + `.replace`) obchází i18next → budoucí jazyk s víc tvary tiše dostane špatný tvar; `.replace` nahradí jen první `{{count}}` (7.4) | `notificationScheduler.ts:337-339, 358-360, 377-378` | Použít `i18n.t('...body', { count })` a nechat pluralizaci na i18next |
| N-7.3 | ⚠️ výkon | `analyzeHabitsProgress` dělá N+1 dotazů (`getCompletionsByHabitId` v cyklu přes návyky) místo jednoho `getCompletionsByDate(today)` — běží při KAŽDÉM foregroundu | `progressAnalyzer.ts:97-110` | Načíst dnešní completions jedním dotazem a filtrovat v paměti |
| N-7.4 | ⚠️ výkon | `analyzeJournalProgress` volá `getAll()` (všechny zápisy za celou historii) a filtruje v JS, přestože existuje indexovaný `getByDate(today)` | `progressAnalyzer.ts:132-140` | Použít `gratitudeStorage.getByDate(today)` |
| N-7.5 | 🧹 latentní | Analyzátor rozhoduje „je to dnešní?" podle časového razítka `completedAt`/`createdAt` místo autoritativního pole `date`. Dnes neškodí (UI vždy zapisuje dnešní datum), ale komponenty `date` prop už podporují → jakékoliv budoucí zpětné odškrtnutí tiše rozbije večerní notifikace | `progressAnalyzer.ts:99-105, 135-140` | Porovnávat `completion.date === today()` / `entry.date === today()` |
| N-7.6 | 🧹 nízká | Mrtvá metoda `getFallbackEveningMessage()` — 0 volajících (nahrazena `getGenericEveningMessage`) | `notificationScheduler.ts:434-441` | Smazat (i18n klíč `fallback` pak zůstane osiřelý → Fáze 12) |
| N-7.7 | ⚠️ pokrytí | **Fáze nemá žádnou regresní suite** — vážený výběr, early-exit ani navigace nejsou kryté testem; jde přitom o čistou logiku, která se testuje snadno | (chybí) | Doplnit `notificationScheduler` testy: váhy dle guide příkladů A-D, early-exit → `null`, distribuce se seedem |
| N-7.8 | ⚠️ E5 (guide) | **Guide si protiřečí**: sekce „Weighted Selection System" (ř. 56-168) vs. ukázka `selectEveningMessage` (ř. ~530-560) s prioritním výběrem a **volbou pro cíle**, kterou kód vůbec nemá (options jsou jen habits/journal/bonus) | guide ř. 530-560 | Přepsat zastaralou ukázku podle skutečné vážené implementace; rozhodnout, zda cíle mají mít vlastní zprávu (dnes se `goalProgressAddedToday` počítá, ale nikdy negeneruje notifikaci) |

Poznámka: `hasCompletedAllTasks()` (`progressAnalyzer.ts:201-215`) nemá
volajícího — mrtvá, ale úzce souvisí s N-7.8 (rozhodnutí o cílech), proto
zatím zapsáno jen jako evidence.

## Rozhodnutí Petra (2026-07-20, session #14 — doslovně)

> „N7.1 - Souhlasím / N7.3 a N7.4 - souhlasím / N7.7 - Dobrá
> N7.8 - Večerní zpráva je jen jedna a tam by se ty cíle měli taky moct dostat…
> Udělej to přesně jak píšeš, to zní dobře.
> N7.2 - ok, tak na to zatím kašleme
> N7.5 - zapomenutý den je velice zajímavá implementace, to zapiš do future
> updates… Jinak to co jsi popsal, v tomto bodě tak to oprav
> N7.6 - pokud ji nic nepoužívá a je nám k ničemu, tak víš co s ní :-)"

| Nález | Rozhodnutí | Plán provedení |
|---|---|---|
| N-7.1 | OPRAVIT | Navigace: priorita 2 jen `!hasThreeBasicEntries`; bonusy až za cíli → větev Cílů se zpřístupní |
| N-7.8 | **ROZŠÍŘIT** (nová funkce, schválen návrh Fable) | Přidat 4. možnost do váženého losování: cíle, podmínka `hasActiveGoals && !goalProgressAddedToday`, **fixní váha 40** (nad bonusem 15, pod plně zanedbaným základem 100). Analyzátor musí nově vracet `hasActiveGoals`. + i18n klíče EN/DE/ES. + guide srovnat (odstranit zastaralou prioritní ukázku) |
| N-7.3 | OPRAVIT | Jeden dotaz `getCompletionsByDate(today)` místo N+1 v cyklu |
| N-7.4 | OPRAVIT | `getByDate(today)` (indexovaný) místo `getAll()` + JS filtr |
| N-7.5 | OPRAVIT | Rozhodovat podle pole `date` (`completion.date === today()`), ne podle časového razítka. **+ Nápad „doplnění zapomenutého dne" zapsán do `projectplan-future-updates.md` (Phase 7)** — tato oprava je jeho blokující předpoklad |
| N-7.6 | SMAZAT | Mrtvá `getFallbackEveningMessage()` |
| N-7.7 | DOPLNIT | Regresní suite (váhy dle guide A-D, early-exit, nová volba cílů, navigace) |
| N-7.2 | ODLOŽENO | Petr: „na to zatím kašleme" — ruční pluralizace zůstává (pro EN/DE/ES funguje); pozor při přidání CZ/PL |

## PLAN-DISCREPANCY

- Plán uvádí `notificationService.ts, notificationScheduler.ts,
  progressAnalyzer.ts, useNotificationLifecycle.ts, NotificationSettings.tsx`
  — všechny existují ✅, žádná odchylka.
- Plán nezmiňuje absenci testů; audit ji doplňuje jako N-7.7.

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 5 (7.1–7.5) | 5 (7.1–7.5) | ✓ |

## PROVEDENÍ OPRAV (2026-07-20, po rozhodnutích Petra)

1. **N-7.3 + N-7.4 + N-7.5 ✅ (přepsán `progressAnalyzer`)**
   - Habity: N+1 cyklus (`getCompletionsByHabitId` per návyk) nahrazen JEDNÍM
     indexovaným dotazem `getCompletionsByDate(today)` + `Set` habitId.
   - Deník: `getAll()` (celá historie!) → indexovaný `getByDate(today)`.
   - **N-7.5**: rozhoduje se podle pole `date` (den, kterému záznam patří),
     ne podle časového razítka `completedAt`/`createdAt`. Odstraněn helper
     `isSameDay` (už není potřeba).
   - Nové `hasActiveGoals` v `DailyTaskProgress` (`types/notification.ts`).
2. **N-7.8 ✅ ROZŠÍŘENO — cíle jako 4. volba večerní zprávy**
   - `notificationScheduler.generateSmartEveningMessage`: nová možnost
     `goals` s podmínkou `hasActiveGoals && !goalProgressAddedToday` a
     **fixní vahou 40** (nad bonusem 15, pod plně zanedbaným základem 100).
   - i18n `reminders.evening.goal_progress` (title + body) doplněno do
     **EN/DE/ES** + typ v `types/i18n.ts`.
3. **N-7.1 ✅** — `useNotificationLifecycle.navigateToMissingTask`: priorita 2
   je nově jen `!hasThreeBasicEntries`; **cíle povýšeny na prioritu 3**
   (s guardem `hasActiveGoals`), bonusy sesunuty na prioritu 4. Větev Cílů je
   tím konečně dosažitelná.
4. **N-7.6 ✅** — smazána mrtvá `getFallbackEveningMessage()` (0 volajících).
   Pozn.: i18n klíč `reminders.evening.fallback` je tím osiřelý → Fáze 12.
5. **N-7.7 ✅ — nová regresní suite** `notificationScheduler.test.ts`
   (13 testů, seeded RNG přes REÁLNÝ scheduler s mocknutým
   `notificationService`): early-exit „vše hotovo → nic" + 30 generických dnů
   dál plánovaných; guardy (bonus až po 3 základních, cíle jen s aktivním
   cílem, habity jen když je dnes něco naplánováno); **ověření vah** —
   100 vs 100 → ~50/50, 20 vs 15 → ~57/43 (guide příklad B), 40 vs 15 →
   ~73/27, 100 vs 40 → ~71/29; obsah zpráv (jednotné/množné číslo,
   dosazený `{{count}}`).
6. **Guide srovnán (N-7.8)** — zastaralá prioritní ukázka `selectEveningMessage`
   nahrazena popisem skutečného váženého systému + historická poznámka proč;
   přidána sekce „Option 4: Goals Without Progress" (podmínka, váha, proč
   fixních 40 a ne úměrně); doplněn algoritmický blok; opravena
   troubleshooting rada odkazující na neexistující prioritní logiku.
7. **N-7.2 ODLOŽENO** dle rozhodnutí (ruční pluralizace ponechána).
8. **Nápad „doplnění zapomenutého dne"** zapsán do
   `projectplan-future-updates.md` → **Phase 7: Make-up Past Days**
   (vč. design otázek a poznámky, že N-7.5 byl jeho blokující předpoklad).

### Verifikace po opravách

```
npx tsc --noEmit → 0 chyb
npm test         → Tests: 464 passed, 464 total (31/31 suites)
notificationScheduler.test.ts → 13 passed (12,5 s)
```

Vývoj počtu testů: 451 → **464** (+13 nová suite). Fáze měla dosud 0 testů.

Cross-impact F2+F3: **není potřeba** — všechny změny v analyzátoru jsou
čistě ČTECÍ (jiné dotazy nad stejnými daty), žádný zápis, žádná změna XP ani
ukládaných dat.

## Stav: HOTOVO (2026-07-20) — audit 5/5 položek ✓, 7 z 8 nálezů provedeno (N-7.2 vědomě odloženo), + schválené rozšíření o cíle ve večerní zprávě, 464/464, tsc 0
