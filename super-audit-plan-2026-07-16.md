# Super Audit Plán — SelfRise V2 (2026-07-16)

**Účel tohoto souboru**: PLÁN, ne audit. Nic v kódu se tímto dokumentem nemění.
Fáze níže bude provádět jiná (Opus) session, fázi po fázi, chirurgicky —
jedna oprava, ověřit testy, další oprava.

**⚠️ ZÁSADNÍ ZMĚNA OPROTI PŮVODNÍMU NÁVRHU (2026-07-16, na žádost Petra)**:
Tohle je **kompletní audit celé aplikace od nuly, bez ohledu na to, co bylo
auditováno dřív**. Důvod: v oblastech, které už prošly hloubkovým auditem
(Achievements, Monthly Challenges — viz historie níže), se nedávno našly
další zásadní chyby. To znamená, že "hotovo" v minulosti **negarantuje**
správnost dnes — buď se od auditu něco změnilo, nebo audit sám měl mezery.
**Žádná fáze se proto nepřeskakuje ani neredukuje na "re-verifikaci".**
Historie v sekci 0 slouží jen jako **kontext a odkaz na existující
regresní testy** (spustit je jako první krok každé fáze — pokud selžou, je
to prioritní nález), ne jako důvod dělat menší nebo mělčí kontrolu.

**📝 REVIZE PLÁNU (2026-07-16, druhá session — Fable)**: Plán prošel kritickou
prověrkou proti skutečnému kódu. Fakta ověřena (78 achievementů ✅, 14 šablon ✅,
25 test suites ✅), **doplněny 4 chybějící oblasti** (Fáze 10-12 + demo mód
v 9.4), zkompletována mapa regresních testů na všech 25 suites, opraveny
odkazy na neexistující soubory a zpřesněna vágní kritéria. Ve druhém kole
přitvrzeno na **exekuční kontrakt**: závazná pravidla E1–E8, povinná šablona
zprávy s důkazy, a natvrdo vyjmenované seznamy položek (78 ID achievementů,
18 eventů), aby nešlo nic vynechat ani si domyslet. Detaily změn: git diff
tohoto souboru.

**Konvence** (stejná jako `production-audit-2026-06-10.md` — pozor, soubor je
smazaný z working tree, viz sekce 0): ✅ ověřený fakt (soubor + řádek),
🔶 domněnka (potřebuje runtime/device ověření).

**Stav při psaní plánu**: `main`, commit `1e56d63`, tsc 0 chyb, **393/393 testů
(25/25 suites)**, working tree čistý (kromě tohoto plánu a smazaného
`production-audit-2026-06-10.md`).

---

## Jak spustit fázi (závazné pro exekuční session)

Každá fáze je navržená jako **samostatně spustitelná** — bez čtení půlky repa.
Před začátkem KAŽDÉ fáze udělej přesně tohle:

1. **Přečti**: sekce 0 + 1 tohoto plánu (kontext + metodologie + kontrakt
   níže) a zadání SVÉ fáze. Nic víc z tohoto plánu číst nemusíš.
2. **Přečti guide(s)** uvedené v hlavičce fáze — guide je nadřazený tvým
   předchozím znalostem o projektu (pravidlo #16 v CLAUDE.md).
3. **Baseline**: `node --version` (musí být ≥ 22.5, jinak testy padají na
   `node:sqlite`), `npx tsc --noEmit` (očekávej 0 chyb), `npm test` (očekávej
   vše zelené). Červená baseline = nález #1 fáze, zapiš a řeš přednostně.
4. **Výstup fáze**: auditní zpráva `docs/audits/super-audit-2026-07/faze-<N>-nalezy.md`
   (adresář vytvoř, pokud neexistuje). Do `projectplan.md` jen 1-3 řádky
   shrnutí + odkaz (pravidla #13 a #15 v CLAUDE.md). Root repa NEzaplavovat
   dalšími ad-hoc `.md` (viz otevřený nález N32).
5. **Opravy** až po dokončení auditní části fáze, po jedné, dle sekce 1.

### Exekuční kontrakt (E1–E8) — porušení = neplatná fáze

- **E1 — Audit nemění kód.** Během auditní části fáze se nesmí změnit žádný
  soubor mimo auditní zprávu. Žádné opravy „po cestě", žádný refaktoring,
  žádné přesuny souborů, žádné mlčky opravené guides. Oprava smí existovat
  jen k nálezu, který byl NEJDŘÍV zapsán do zprávy.
- **E2 — Verdikt bez důkazu je neplatný.** Každé ✅/⚠️/❌ musí mít u sebe
  důkaz: `soubor:řádek` pro tvrzení o kódu, doslovný výstup pro tvrzení
  o testech (poslední řádky s počty, ne parafráze „testy prošly"). 🔶 musí
  mít popsaný přesný device scénář, který ho ověří.
- **E3 — Zákaz komprese seznamu.** Kde plán vyjmenovává položky (78 ID
  achievementů, 18 eventů, 14 šablon…), má KAŽDÁ položka vlastní sekci ve
  zprávě. Formulace typu „zbytek kategorie je analogický, taky ✅" je
  zakázaná. Když dochází čas/kontext, ukonči session zápisem
  `NEDOKONČENO — pokračovat od položky <ID>` — to je legitimní výsledek,
  zkrácený průchod není.
- **E4 — Realita > plán.** Pokud soubor/symbol/počet z plánu neodpovídá
  realitě v repu, nic si nedomýšlej: zapiš nález typu `PLAN-DISCREPANCY`
  (co plán tvrdí vs. co je v repu) a pokračuj podle reality.
- **E5 — Konflikty pravidel se hlásí, neřeší mlčky.** Rozpor guide vs. kód,
  guide vs. guide, plán vs. guide → samostatný nález s návrhem, který zdroj
  opravit. Rozhoduje Petr (CLAUDE.md pravidlo #16.4).
- **E6 — Stop podmínky.** Zastav fázi a předej Petrovi, když: (a) baseline
  je červená a příčina není opravitelná v rámci scope fáze; (b) oprava
  nálezu vyžaduje změnu fungujícího systému mimo scope fáze (CLAUDE.md
  pravidlo #16 — chirurgické zásahy); (c) dvě opravy po sobě rozbily testy.
- **E7 — Zpráva se píše průběžně**, po každé položce, ne na konci. Pokud
  zpráva fáze už existuje (přerušená session), pokračuj od poslední
  dokončené položky — nezačínej znovu a nepřepisuj hotové sekce.
- **E8 — Brána úplnosti.** Poslední akce auditní části: spočítej sekce ve
  zprávě vs. počet položek dle plánu a zapiš tabulku úplnosti (viz šablona).
  Nesedí-li počty, fáze NENÍ hotová — žádné „done" do projectplan.md.

### Povinná šablona zprávy (`faze-<N>-nalezy.md`)

```markdown
# Fáze <N> — nálezy (super audit 2026-07)
Datum: … | Commit: … | Node: … | Baseline: tsc <výsledek>, testy <x/y>
(doslovný výstup baseline testů své fáze)

## Položky
### <ID/název položky 1>
- Kde: <soubor:řádek evaluatoru/handleru>
- Pravidlo: <guide + sekce/řádek>
- Ověřeno jak: <test / grep / trasování toku — konkrétně>
- Verdikt: ✅/⚠️/❌/🔶 + jednověté zdůvodnění
- Důkaz: <soubor:řádek / vložený výstup>
### <ID/název položky 2>
…

## Nálezy k opravě (číslované, s prioritou)
## PLAN-DISCREPANCY (pokud nějaké)
## Brána úplnosti
| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| … | … | ✓/✗ |
## Stav: HOTOVO / NEDOKONČENO — pokračovat od <ID>
```

---

## 0. Historie oprav — KONTEXT, ne checklist k přeskočení

Poslední měsíc proběhly 4 samostatné hloubkové audity + 2 re-verifikace.
Tahle sekce shrnuje, co se NAŠLO a co je KRYTO TESTY — abys věděl, kde
sáhnout po existující regresní test suite jako startovní bod. Ale: **pokaždé
projdi celou metodologii (sekce 1) znovu, sám, nezávisle na starých
závěrech.** Testy potvrzují, že se nevrátil KONKRÉTNÍ starý bug — neznamená
to, že oblast nemá jiné, nové problémy.

### Timeline

| Datum | Co se auditovalo | Výsledek | Zdroj |
|---|---|---|---|
| 2026-06-10 | Celková produkční prověrka (262 souborů, architektura, výkon, design, kompatibilita, kvalita kódu) | 34 nálezů (N1–N34), MUST/SHOULD/NICE | `production-audit-2026-06-10.md` (⚠️ smazán z working tree — obnov si ho příkazem `git show 1e56d63:production-audit-2026-06-10.md`) |
| 2026-06-13 | Realizace 9 MUST bodů z 6/10 auditu | N1 (XP split-brain), N2 (dropGoalsTables), N3 (DB retry), N4 (parseDate UTC), N5 (testy), N7 (telemetrie), N13 (mrtvý kód), N19 (banner+klávesnice) | implementation-history.md §"Pre-Release Production Audit Fixes" |
| 2026-07-02 | Nezávislá re-verifikace 9 bodů z 6/13 | Nalezeny 3 mezery (zbytkové UTC parsy, negativní uptime test, hardcoded EN chybová obrazovka) — opraveno | §"Audit Fixes Re-Verification" |
| 2026-07-02 | Zbývající SHOULD body z 6/10 | N16 (Typography barvy), N23 (závislosti), N9 (journal-history FlatList), N22 (metro/LogBox) | §"Pre-Release Cleanup" |
| 2026-07-03 | 4 souběžné hloubkové audity (jeden den) | viz níže | §"XP Multiplier…", "Achievements Dead Evaluator…", "Journal Streak Debt Gate…", "Monthly Challenges Tracking…" |
| 2026-07-11 | Per-šablonová sémantická prověrka 14 měsíčních výzev (Fable) | 3 další nálezy opraveny, 1 čeká na device | `monthly-challenge-fix-plan.md` |
| 2026-07-14 | Storage split-brain (Goals + Journal) — vyvoláno testem tutorialu na zařízení | 7 call-site oprav, typování storage helperů, 3 skryté bugy, batch truncation (28/78 achievementů nikdy nekontrolováno) | §"Storage Split-Brain Repair" |
| 2026-07-14 | Startup Orchestrator L1 (nová funkcionalita, ne audit) | Sekvenční pipeline ATT→UMP, smazán `startupGate.ts`; **⏳ device test na čisté instalaci stále čeká** | projectplan.md §"Startup Orchestrator" |

**Ponaučení z vlastní historie tohoto projektu**: Achievements i Monthly
Challenges DOSTALY plný hloubkový audit (3.7., + Monthly Challenges znovu
11.7.) a i tak se 14.7. našel další skrytý bug (batch truncation — 28 z 78
achievementů se nikdy nekontrolovalo, protože limit aplikoval na SUROVÝ
katalog před filtrem odemčených). To je přesně vzorec, který ospravedlňuje
"znovu od nuly" přístup — hloubkový audit není jednorázová očkovací látka.

### Kompletní mapa regresních testů (všech 25 suites → fáze)

Spusť suites své fáze jako krok 1. Pokud NĚCO padá → okamžitě nejvyšší
priorita nálezu, protože to znamená regresi něčeho už jednou opraveného.

| Fáze | Test suites |
|---|---|
| 1 | `xpMultiplier.loyalty.test.ts` (12), `src/services/gamification/__tests__/xpLimits.test.ts`, `levelProgressDisplay.test.ts`, `userActivityTracker.test.ts` + `userActivityTracker.baseline.test.ts`, `modalQueueOrdering.test.ts` (5), legacy sada `__tests__/services/gamification/`: `MathematicalModel`, `XpCalculation`, `XpBasicTest`, `DataPersistence`, `SqliteConsistency`, `PerformanceTest` |
| 2 | `achievementEvaluation.test.ts` (89 — 1 test PER achievement), `__tests__/services/gamification/AchievementLogic.test.ts`, `storageSplitBrain.test.ts` (7) |
| 3 | `monthlyProgressTracker.trackingKeys.test.ts` (16), `monthlyChallenge.phase3.test.ts`, `monthlyChallenge.phase3.production.test.ts`, `starRatingMigration.test.ts` |
| 4 | `__tests__/hooks/useHabitsData.makeup.test.tsx`, `__tests__/utils/date.timezone.test.ts` (18) |
| 5 | `storageSplitBrain.test.ts` (sdílená s F2 — goals část) |
| 6 | `sqliteGratitudeStorage.streakDebt.test.ts` (20) |
| 8 | `tutorialAchievementGate.test.ts` (4) |
| 10 | `startupOrchestrator.test.ts`, `src/services/database/__tests__/init.test.ts` |
| průřezově | `date.timezone.test.ts` — relevantní všude, kde se pracuje s daty |

### Co ZŮSTÁVÁ zdokumentované jako otevřené (z 6/10 auditu, nikdy neřešeno)

- **N27** — legacy AsyncStorage implementace (`gratitudeStorage.ts` 1752 ř.,
  `habitStorage.ts` 747 ř., `goalStorage.ts` 871 ř. = **3370 řádků**
  mrtvého/paralelního kódu za feature flagy natvrdo `true`).
- **N28** — `GamificationService` god-object (3547+ ř. při 6/10 auditu).
- **N30** — side-effect barrel import (`import '../src/services'` v `app/_layout.tsx`).
- **N31** — obrácená závislost storage→gamification (`SQLiteHabitStorage.ts:333`).
- **N32 (částečně)** — repo hygiena (ad-hoc `.md` soubory v rootu).

**Known debt** (ne nález, existující BLOCKER komentář): `src/services/storage/backup.ts`
čte legacy singletony u všech 3 domén — **nesmí se zapnout bez migrace**.

---

## 1. Metodologie pro každou položku (závazná pro VŠECHNY fáze, bez výjimky)

Pro každou kontrolovanou položku (achievement, výzva, pravidlo, event,
podezřelý mrtvý kód) proveď a zapiš — **nezávisle na tom, jestli položka už
byla dřív "auditovaná"**:

1. **Najdi** v kódu evaluator/tracker/handler odpovědný za danou věc
   (konkrétní soubor + řádek).
2. **Porovnej** s pravidlem v příslušném `technical-guides:*.md`.
3. **Spusť existující regresní test** pokrývající tuhle položku (mapa
   v sekci 0) — pokud chybí nebo je moc obecný na to, co zrovna kontroluješ,
   navrhni/napiš konkrétnější scénář.
4. **Sleduj datový tok end-to-end**, ne jen izolovanou funkci: event vzniku
   → handler → uložení → čtení pro zobrazení → XP důsledek (pokud existuje).
   Batch-truncation bug (14.7.) byl přesně tenhle případ — jednotlivé
   evaluátory byly OK, problém byl v obalující smyčce, která je nikdy
   nezavolala.
5. **Označ nález**:
   - ✅ **funguje** — kód odpovídá guide, end-to-end tok ověřen, test existuje
   - ⚠️ **funguje částečně** — okrajový případ, drobná nesrovnalost s guide,
     chybějící test
   - ❌ **nefunguje / mrtvé** — podmínka nikdy nesplněná, event bez
     listeneru, větev nedosažitelná, obalující smyčka danou položku
     nevolá
   - 🔶 **potřebuje device ověření** — logika vypadá správně staticky, ale
     vyžaduje runtime/zařízení (restart appky, reálný časový posun,
     nativní modul)
6. Nálezy piš do auditní zprávy své fáze
   (`docs/audits/super-audit-2026-07/faze-<N>-nalezy.md`) — do
   `projectplan.md` jen odkaz + shrnutí (pravidlo #15 v CLAUDE.md).

**Opravy jsou SAMOSTATNÝ krok** — audit jen hledá a zapisuje. Po nalezení:
jedna oprava → `npx tsc --noEmit` → celá test suite → další oprava. Nikdy
hromadně měnit víc věcí najednou. Před smazáním jakéhokoliv "mrtvého" kódu
ověř `grep -rn` přes celý `src/` + `app/`, že opravdu nikde není importovaný
(false positive u dynamických `require()` je v týhle codebase běžný —
viz featureFlags.ts).

**Cross-impact pravidlo (nové)**: Fáze 4-6 auditují VÝROBCE dat (habits,
goals, journal), na kterých stojí závěry fází 2-3 (achievementy, výzvy je
konzumují). Pokud oprava ve fázích 4-6 změní cokoliv v ukládaných datech
nebo XP: (a) znovu spusť regresní suites fází 1-3, (b) v auditní zprávě
explicitně vyhodnoť, jestli oprava nemění závěry už uzavřených fází, a
dotčené položky re-verifikuj. Stejné pravidlo platí obráceně pro opravy
ve Fázi 1 (eventy/XP core) vůči všem ostatním fázím.

---

## FÁZE 1 — Gamification Core / Events / UI / Limity / Levely / Loyalty (základ, dělat PRVNÍ)

> ✅ **PROVEDENO 2026-07-16 (Fable)** — 9/9 položek, brána úplnosti ✓,
> 13 nálezů, schválené opravy provedeny (vč. rebalance levelové křivky —
> N-1.7b), commit `05ed277`. Zpráva:
> `docs/audits/super-audit-2026-07/faze-1-nalezy.md`.
> Pro navazující fáze: viz cross-impact poznámky ve zprávě (Fáze 2f —
> prahy level-achievementů proti nové křivce; Fáze 9.4 — demo mód píše
> do mrtvých tabulek; Fáze 13 — schválené smazání N-1.5a/1.8b/1.8c).

**Proč první**: Achievementy i měsíční výzvy na těchto eventech/pravidlech
závisí — chyba tady by deformovala výsledky všech dalších fází.

**Guide**: `technical-guides:Gamification-Core.md`,
`technical-guides:Gamification-Events.md`, `technical-guides:Gamification-UI.md`

**Soubory**: `src/services/gamificationService.ts`,
`src/services/xpMultiplierService.ts`, `src/services/gamification/xpLimits.ts`,
`src/services/levelCalculation.ts`, `src/services/gamification/levelUpEvents.ts`,
`src/services/loyaltyService.ts`, `src/services/userActivityTracker.ts`,
`src/utils/appEvents.ts`, `src/contexts/XpAnimationContext.tsx`,
`src/contexts/ModalQueueContext.tsx`

- [x] 1.1 Spusť `xpMultiplier.loyalty.test.ts` — potvrď zelené, pak jdi za
      test suite: projdi ručně všechny 3 cesty aktivace multiplikátoru
      (Harmony Streak, Inactive Boost, Achievement Combo) a ověř storage
      helpery (`storeActiveMultiplier`/`clearActiveMultiplierStorage`) jsou
      OPRAVDU jediné místo zápisu — grep na `xp_multiplier_active` a
      `xp_multipliers` tabulku, žádný jiný přímý zápis mimo tyhle helpery.
      (Pozn.: grep najde i `marketingDemoDataService.ts` — to je záměrný
      zápis demo módu, posuzuje se ve fázi 9.4, tady jen zapiš, že existuje.)
- [x] 1.2 **XP transakce end-to-end**: `addXP` → SQLite `xp_transactions` →
      `getAllTransactions`/`getTransactionsByDateRange` — ověř SQL dotazy
      opravdu vrací to, co appka očekává (ne jen že běží bez chyby) —
      napiš/spusť test co zapíše transakci a hned ji přečte zpět.
- [x] 1.3 Projdi **všech 18 eventů** vyjmenovaných v `Gamification-Events.md`
      (sekce "Kompletni seznam gamifikacnich eventu"). ⚠️ Guide v nadpisu
      tvrdí "16 eventu", ale reálně jich vyjmenovává 15 gamifikačních + 3
      UI/tutorial = 18; a tvrdí "5 eventu BEZ LISTENERU", ale značí jen 3 —
      oba nesoulady počtů zapiš jako dokumentační nález a při průchodu urči
      skutečné počty. Kompletní seznam (nic nevynechávej):
      `xpGained`, `levelUp`, `xpBatchCommitted`, `xpSmartNotification`,
      `achievementQueueStarting`, `achievementUnlocked`,
      `multipleAchievementsUnlocked`, `achievementCelebrationClosed`,
      `xpMultiplierActivated`, `monthly_progress_updated`,
      `monthly_challenge_completed`, `monthly_milestone_reached`,
      `star_level_changed`, `star_progression_updated`,
      `difficulty_recalculated`, `tutorial_scroll_to`,
      `tutorial_scroll_completed`, `openHomeCustomization`.
      Pro každý ověř přes `src/utils/appEvents.ts`
      (`emitAppEvent`/`addAppEventListener`) +
      `grep -rn "emitAppEvent('EVENT'\|addAppEventListener('EVENT'"`,
      že (a) event se reálně emituje na správném místě s payloadem dle guide,
      (b) má aspoň jeden listener NEBO je explicitně zdokumentovaný jako
      "reserved for future". Navíc reverzní kontrola: grep všech
      `emitAppEvent(` v `src/` — event emitovaný v kódu, ale chybějící
      v seznamu výše = nedokumentovaný event = nález. Kritérium: tabulka
      18+ řádků, každý event má vyplněné emit-místo (soubor:řádek) +
      listener-místo (soubor:řádek) nebo štítek "reserved".
- [x] 1.4 **ModalQueue pinning invariant** — spusť
      `src/contexts/__tests__/modalQueueOrdering.test.ts`, pak ručně projdi
      `enqueue()` logiku a `presentedIdRef` — potvrď, že žádný commit od
      14.7. tohle nerozbil (`git log --oneline -- src/contexts/ModalQueueContext.tsx`).
- [x] 1.5 **Animation consistency** (Gamification-UI.md): vylistuj VŠECHNA
      call-sites `addXP(` v `src/` + `app/` (grep), každé klasifikuj
      batchované/nebatchované podle `shouldBatchXPAddition()` a ověř, že
      žádný user-facing zdroj (habit toggle, journal entry, goal progress…)
      neprochází batchováním. Kritérium: úplný seznam call-sites s klasifikací,
      0 user-facing batchovaných.
- [x] 1.6 **Denní limity + anti-spam** (`src/services/gamification/xpLimits.ts`):
      porovnej mapu source→limit s guide (HABITS_MAX_DAILY 500,
      JOURNAL_MAX_DAILY 415, GOALS_MAX_DAILY 400, ENGAGEMENT_MAX_DAILY 200;
      exempt: GOAL_COMPLETION, ACHIEVEMENT_UNLOCK, MONTHLY_CHALLENGE,
      XP_MULTIPLIER_BONUS, LOYALTY_MILESTONE). Ověř škálování limitů při
      aktivním multiplikátoru (×2 dle guide) a "minimum section allocation
      ≥ 20 %". Spusť `xpLimits.test.ts`. Kritérium: každý `XPSourceType` má
      limit shodný s guide + existuje test chování NA hranici limitu
      (transakce těsně pod / přes).
- [x] 1.7 **Level výpočty**: `levelCalculation.ts` vs. matematický model
      v Gamification-Core.md; spusť `MathematicalModel.test.ts` +
      `levelProgressDisplay.test.ts`. Pak grep přes UI (`app/levels-overview.tsx`,
      XP bar na Home, level-up modaly), že VŠECHNY zobrazované hodnoty
      procházejí `levelCalculation.ts` — žádná komponenta nemá vlastní
      kopii vzorce. (Přesně tenhle typ bugu byl XP bar fix ze 14.7.)
- [x] 1.8 **Loyalty systém** (v plánu dosud chyběl): `loyaltyService.ts` +
      `userActivityTracker.ts` + `src/validation/loyaltySystemValidation.ts`
      + UI `src/components/achievements/LoyaltyProgressCard.tsx`. Spusť
      `userActivityTracker.test.ts` a `userActivityTracker.baseline.test.ts`.
      Ověř: (a) co přesně počítá "aktivní den" a že se nedá inkrementovat
      2× za den; (b) LOYALTY_MILESTONE XP odměny odpovídají guide a jsou
      exempt z denních limitů; (c) LoyaltyProgressCard čte stejná data,
      jaká zapisuje tracker (single source of truth).
- [x] 1.9 Změř aktuální velikost `gamificationService.ts` (N28) — zapiš do
      zprávy, informativní pro Fázi 13.

---

## FÁZE 2 — Achievements: PLNÝ audit všech 78 → 75 (3 smazány v session #5), po kategoriích

**Guide**: `technical-guides:Achievements.md` (sekce "PRODUCTION FIX 0":
nový zdroj ⇒ musí mít dispatch handler)

**Soubory**: `src/constants/achievementCatalog.ts` (78 položek — ověřeno
2026-07-16 grepem `category: AchievementCategory`),
`src/services/achievementService.ts`, `src/services/achievementIntegration.ts`,
`src/services/achievementStorage.ts`

**Rozdělení do dávek podle kategorie** (počty i ID ověřeny v katalogu
2026-07-16, PŮVODNÍ stav): JOURNAL 31, SPECIAL 14, MASTERY 9, HABITS 8,
GOALS 8, CONSISTENCY 8 = 78. JOURNAL je moc velká na jednu dávku → rozděl na 2 půlky.
**⚠️ AKTUALIZACE (session #5, 2026-07-16)**: smazány 3 trofeje (N-2.8
`recommendation-master` MASTERY; N-2.7 `flame-collector` + `triple-crown-master`
JOURNAL) → **nově JOURNAL 29, MASTERY 8, celkem 75**. Historické checklisty
2c/2d/2f níže obsahují smazaná ID (proškrtnuto v realitě, ne v textu) —
zbývající SPECIAL (2g) = 14 beze změny.

⚠️ **Past**: katalog NENÍ v souboru seřazený po kategoriích (např.
`goal-achiever` z MASTERY leží uprostřed CONSISTENCY bloku a JOURNAL je ve
dvou oddělených blocích). Dávky sestavuj VÝHRADNĚ podle pole `category`
u položky / podle ID seznamů níže — nikdy podle pořadí řádků v souboru.
Seznamy níže jsou závazný checklist (kontrakt E3): každé ID = jedna sekce
ve zprávě.

Pro KAŽDOU sub-fázi aplikuj plnou metodologii ze sekce 1 na KAŽDÝ jednotlivý
achievement v dávce (podmínka odemčení → reálný event → správná hodnota →
XP odměna dle guide → modal/notifikace). Batch-truncation bug (14.7.) ukázal,
že i "89/89 testů zelených" nezaručuje, že se všech 78 REÁLNĚ vyhodnocuje v
produkčním běhu — ověř tohle explicitně v každé sub-fázi (najdi, kde a jak
se seznam achievementů k vyhodnocení sestavuje, ne jen jestli JEDNOTLIVÝ
evaluátor vrací správnou hodnotu).

Texty (name/description) achievementů v EN/DE/ES tady neřeš — to je Fáze 12;
tady jen zapiš ID achievementů, kterých se dotkneš oprava.

- [x] 2.0 Spusť `achievementEvaluation.test.ts` (celý, 89 testů),
      `__tests__/services/gamification/AchievementLogic.test.ts` a
      `storageSplitBrain.test.ts` (catalog-vs-batch-size invariant) —
      zapiš výsledek jako baseline před hloubkovým průchodem.
- [x] 2a. **HABITS** (8): `first-habit`, `habit-builder`, `century-club`,
      `consistency-king`, `streak-champion`, `century-streak`,
      `multi-tasker`, `habit-legend`
- [x] 2b. **GOALS** (8): `first-goal`, `goal-getter`, `goal-champion`,
      `achievement-unlocked`, `ambitious`, `progress-tracker`,
      `mega-dreamer`, `million-achiever`
      (⚠️ `achievement-unlocked` je ID ACHIEVEMENTU v kategorii GOALS —
      nezaměňovat se stejnojmennou monthly-challenge šablonou z guide,
      viz Fáze 3)
- [x] 2c. **JOURNAL — 1. půlka** (16): `first-journal`, `deep-thinker`,
      `journal-enthusiast`, `grateful-heart`, `gratitude-guru`,
      `eternal-gratitude`, `bonus-seeker`, `first-star`, `five-stars`,
      `flame-achiever`, `bonus-week`, `crown-royalty`, `flame-collector`,
      `golden-bonus-streak`, `triple-crown-master`, `bonus-century`
- [x] 2d. **JOURNAL — 2. půlka** (15): `star-beginner`, `star-collector`,
      `star-master`, `star-champion`, `star-legend`, `flame-starter`,
      `flame-accumulator`, `flame-master`, `flame-champion`, `flame-legend`,
      `crown-achiever`, `crown-collector`, `crown-master`, `crown-champion`,
      `crown-emperor`
- [x] 2e. **CONSISTENCY** (8): `weekly-warrior`, `monthly-master`,
      `hundred-days`, `journal-streaker`, `daily-visitor`, `dedicated-user`,
      `perfect-month`, `triple-crown`
- [x] 2f. **MASTERY** (9): `goal-achiever`, `level-up`, `selfrise-expert`,
      `selfrise-master`, `recommendation-master`, `balance-master`,
      `trophy-collector-basic`, `trophy-collector-master`,
      `ultimate-selfrise-legend`
- [x] 2g. **SPECIAL** (14): `lightning-start`, `seven-wonder`,
      `persistence-pays`, `legendary-master`, `loyalty-first-week`,
      `loyalty-two-weeks-strong`, `loyalty-three-weeks-committed`,
      `loyalty-month-explorer`, `loyalty-two-month-veteran`,
      `loyalty-century-user`, `loyalty-half-year-hero`, `loyalty-year-legend`,
      `loyalty-ultimate-veteran`, `loyalty-master` — včetně ověření
      že cross-feature podmínky (kombinující habits+journal+goals) čtou
      VŠECHNY potřebné zdroje dat, ne jen jeden; loyalty-* achievementy
      musí sedět na data z `userActivityTracker`/`loyaltyService` (Fáze 1.8)
- [x] 2h. **Batch-vyhodnocovací smyčka** — nezávisle na jednotlivých
      achievementech ověř mechanismus, který je VŠECHNY prochází po každé
      XP akci (`checkAchievementsAfterXPAction` a batch-check při startu
      appky) — potvrď limit/stránkování/filtry tam nikdy neuřežou konec
      seznamu (přesně tenhle bug byl nalezen 14.7., ověř, že zůstal opravený
      i po pozdějších změnách).
- [ ] 2i. 🔶 Device-ověření: odemkni na reálném zařízení aspoň 1 achievement
      z každé kategorie (6 kategorií) a potvrď modal + XP se zobrazí.

---

## FÁZE 3 — Monthly Challenges: PLNÝ audit všech 14 šablon, po kategoriích

**Guide**: `technical-guides:Monthly-Challenges.md`

**Soubory**: `src/services/monthlyProgressTracker.ts`,
`src/services/monthlyChallengeService.ts`, `src/services/monthlyChallengeLifecycleManager.ts`,
`src/services/monthlyProgressIntegration.ts`, `src/services/starRatingService.ts`
(+ `starRatingMigration.ts`), `src/components/challenges/MonthlyProgressCalendar.tsx`,
`src/components/challenges/MonthlyChallengeDetailModal.tsx`

**Rozdělení do dávek podle kategorie** (4 kategorie, 14 šablon celkem;
ID ověřena v kódu 2026-07-16):
Habits (4: `habits_consistency_master`, `habits_variety_champion`,
`habits_streak_builder`, `habits_bonus_hunter`),
Journal (4: `journal_reflection_expert`, `journal_gratitude_guru`,
`journal_consistency_writer`, `journal_depth_explorer`),
Goals (2: `goals_progress_champion`, `goals_completion_master` — ⚠️ guide
mu říká "Achievement Unlocked", v kódu je to `goals_completion_master`;
nehledej v kódu šablonu jménem "Achievement Unlocked", neexistuje —
nesoulad názvosloví zapiš jako dokumentační nález),
Consistency (4: `consistency_triple_master`, `consistency_perfect_month`,
`consistency_xp_champion`, `consistency_balance_expert`).

Pro každou šablonu ověř CELÝ řetězec: generování cíle (star scaling přes
`starRatingService`, měsíční limit) → tracking (event → progress, včetně
"increment-0 trap" u odvozených klíčů) → zobrazení (Card, DetailModal,
Calendar, weekly breakdown) → konec měsíce (úspěch/neúspěch, hvězdy,
streak bonus).

- [x] 3.0 Spusť `monthlyProgressTracker.trackingKeys.test.ts` (16),
      `monthlyChallenge.phase3.test.ts`, `monthlyChallenge.phase3.production.test.ts`
      a `starRatingMigration.test.ts` — baseline před hloubkovým průchodem.
      ✅ 2026-07-18: 4/4 suites, 76/76, tsc 0.
- [x] 3a. **Habits šablony** (4) — kompletní průchod
      ✅ 2026-07-18: consistency_master ✅; variety/bonus_hunter ⚠️ (N-3.2 mrtvá
      personalizace targetů); streak_builder ❌ (target vždy celý měsíc).
      → Nálezy OPRAVENY týž den (N-3.2/3.3/3.5: nové škály baseline, minima
      per klíč, lineární hvězdy, streak reset) — viz faze-3-nalezy.md.
- [x] 3b. **Journal šablony** (4) — kompletní průchod, včetně Depth Explorer
      (avg_entry_length — čtení žurnálu bylo dotčeno split-brain opravou
      14.7., ověř znovu od nuly, ne jen "guide říká že je to opravené")
      ✅ 2026-07-18: depth_explorer ⚠️ (split-brain oprava DRŽÍ — čte SQLite);
      reflection ⚠️; gratitude_guru + consistency_writer ❌ (N-3.1 milestone
      zápisy #4/#8/#13 neviditelné pro tracker).
      → Nálezy OPRAVENY týž den (N-3.1/3.2/3.6/3.7) — viz faze-3-nalezy.md.
- [x] 3c. **Goals šablony** (2) — kompletní průchod, včetně ověření že
      Progress Champion opravdu počítá DNY, ne UDÁLOSTI (11.7. NÁLEZ 2 fix)
      ✅ 2026-07-19: progress_champion ✅ (NÁLEZ 2 fix DRŽÍ, dny ne události);
      completion_master ⚠️ (minima ve dnech chtěla 12 cílů → OPRAVENO N-3.12a).
- [x] 3d. **Consistency šablony** (4) — kompletní průchod, včetně Balance
      Expert (min. 4⭐ gating) a kalendářového zobrazení odvozených klíčů
      (11.7. NÁLEZ 1 fix — perfect_days, triple_feature_days, monthly_xp_total,
      balance_score)
      ✅ 2026-07-19: NÁLEZ 1 fix DRŽÍ (kalendář derived ✓); triple/perfect ✅;
      xp_champion ❌ (target ~58 XP = auto-výhra → OPRAVENO N-3.12b);
      balance_expert ❌ (target 25 na škále 0-1 = nesplnitelné → OPRAVENO
      N-3.12c; gating 4⭐ ✓). K rozhodnutí: N-3.13 (bucketování balance),
      N-3.14 (undo XP), N-3.15 (kalibrace). Zpráva: faze-3-nalezy.md.
- [ ] 3e. **NÁLEZ 4** (otevřený z 11.7., in-memory streak cache přes restart) —
      device test: splň návyk ve Streak Builder, zabij appku uprostřed dne,
      spusť znovu, splň další návyk týž den → progress se NESMÍ zvýšit
      podruhé. Totéž pro `daily_journal_streak` (Consistency Writer).
      ⚠️ Pozn. 2026-07-18: oprava už JE v kódu (perzistence day-guard stavu,
      N-3.5 + Jest test simulující restart) — device test je teď OVĚŘENÍ
      opravy, ne potvrzení bugu. Přidat i variety scénář (smaž/přidej
      completion téhož návyku v týdnu po restartu).
- [ ] 3f. **Weighted random template selection** — napiš jednorázový test
      (fixní RNG seed, ~1000 iterací generování pro každou kategorii)
      a ověř: žádná šablona nemá 100% šanci výběru (historický bug z října
      2025) a každá ne-gated šablona v kategorii má šanci > 0 %. Kritérium:
      test existuje a prochází; rozdělení výběru zapiš do zprávy.
- [ ] 3g. Konec měsíce (lifecycle manager) — ověř `closePreviousChallenge`
      pro VŠECH 14 šablon (ne jen namátkou) — star update, streak reset,
      archivace, žádné XP za neúspěch.

---

## FÁZE 4 — Habits: PLNÝ audit

**Guide**: `technical-guides:Habits.md` — klíčová pravidla: "MINULOST SE
NEMĚNÍ" (scheduled days immutability), Smart Bonus Conversion algoritmus,
unified completion rate formula, XP hodnoty (25 scheduled / 15 bonus),
streak-milestone XP zdokumentované jako TODO — ověř aktuální stav.

**Soubory**: `src/services/storage/SQLiteHabitStorage.ts`,
`src/services/storage/habitStorage.ts` (legacy), `src/contexts/HabitsContext.tsx`,
`src/utils/habitImmutability.ts`, `src/utils/habitCalculations.ts`,
`src/utils/HabitResetUtils.ts`, bonus conversion logika
(`grep -rn "Smart Bonus\|bonusConversion" src/`)

- [ ] 4.1 **Immutability pravidlo**: změna `scheduledDays` u existujícího
      návyku nesmí ovlivnit historické completion rate výpočty. Scénář:
      návyk Po-Pá 2 týdny → změna na Po-St-Pá → historický rate za první
      2 týdny se MUSÍ počítat podle PŮVODNÍHO rozvrhu.
- [ ] 4.2 **Smart Bonus Conversion**: párování zmeškaných scheduled dnů
      s bonus completions v rámci Po-Ne týdne je chronologické 1:1, konverze
      je needitovatelná zpětně.
- [ ] 4.3 **Completion rate formula**: `(completedScheduled + bonusCompletions)
      / scheduledDays × 100` — JEDNOTNĚ napříč VŠEMI UI komponentami (Habit
      stats, Home widgety `WeeklyHabitChart`/`Monthly30DayChart`/`MonthlyHabitOverview`/
      `YearlyHabitOverview`/`HabitPerformanceIndicators`, kalendář) — žádná
      vlastní odvozená varianta. Kritérium: grep výpočtů rate přes
      `src/components/` — každé nalezené místo buď volá sdílenou utilitu
      (`habitCalculations.ts`), nebo je zapsáno jako nález.
- [ ] 4.4 **XP aplikace a reverze**: `HABIT_COMPLETION` 25 XP / `HABIT_BONUS`
      15 XP — aplikace i reverze (smazání completion) v SQLite i legacy cestě.
- [ ] 4.5 **Streak-milestone XP**: potvrď aktuální stav (implementováno/ne)
      a srovnej s guide (guide to vede jako TODO — pokud kód mezitím
      implementoval, aktualizuj guide; pokud ne, zapiš "nezavedeno, guide ✓").
- [ ] 4.6 **N31** (obrácená závislost storage→gamification,
      `SQLiteHabitStorage.ts:333` — ověřeno 2026-07-16, `addXP` volané přímo
      ze storage vrstvy) — potvrď, zapiš jako known-debt pro Fázi 13.
- [ ] 4.7 Cache invalidation — content-aware, ne jen count-based — ověř
      přidání/odebrání/EDITACE completion správně invaliduje cache.
- [ ] 4.8 Spusť `__tests__/hooks/useHabitsData.makeup.test.tsx` +
      `date.timezone.test.ts` — potvrď zelené.

---

## FÁZE 5 — Goals: PLNÝ audit

**Guide**: `technical-guides:Goals.md` + `technical-guides:Gamification-Core.md`
(⚠️ guides si protiřečí v prahu pro 350 XP completion bonus — Goals.md ř. 838
říká "≥ 1000", Gamification-Core.md ř. 107 říká "≥ 10 000"; kód v
`SQLiteGoalStorage.ts:509` používá `targetValue >= 10000` — ověřeno
2026-07-16. Zbývá ověřit legacy cestu + konstanty a opravit Goals.md.)

**Soubory**: `src/services/storage/SQLiteGoalStorage.ts`,
`src/services/storage/goalStorage.ts` (legacy), `src/contexts/GoalsContext.tsx`,
`src/components/goals/GoalForm.tsx` + `ProgressEntryForm.tsx` (validace
žije ve formulářích — žádný `goalValidationService.ts` NEEXISTUJE, neztrácej
čas hledáním)

- [ ] 5.0 Rozporuplné číslo (1000 vs 10000): potvrď hodnotu i v legacy
      `goalStorage.ts` a případných konstantách (`grep -rn "10000\|GOAL_COMPLETION_BIG" src/`),
      pak oprav Goals.md ř. 838. Pokud je kód sám nekonzistentní (SQLite vs
      legacy jiná hodnota), je to skutečný nález, ne dokumentační chyba.
- [ ] 5.1 **Validace**: title 1-100 znaků, targetValue>0, currentValue
      0..targetValue, targetDate dnes/budoucnost — test pro každou hranici.
      Ověř, že validace platí na VŠECH vstupních cestách (GoalForm,
      ProgressEntryForm, případný přímý storage zápis).
- [ ] 5.2 **3 transakce/den limit**: GOAL_PROGRESS limitováno, GOAL_COMPLETION
      exempt — najdi přesné místo v kódu (pozn.: `xpLimits.ts` obsahuje
      komentář "migrated from GoalStorage.MAX_DAILY_POSITIVE_XP_PER_GOAL" —
      začni tam).
- [ ] 5.3 **Milestone XP** (25/50/75 % → 50/75/100 XP): trigger přesně při
      překročení prahu, nedá se "znovu vydělat" kolísáním kolem hranice.
- [ ] 5.4 **Completion XP reverze**: `justCompleted = isCompleted &&
      !wasCompleted`, -250 XP při poklesu pod target po dokončení —
      pozor na race conditions/double-award.
- [ ] 5.5 Target Date Step-by-Step modal — anti-blink pořadí kroků,
      🔶 device check (je to UI, ne data — nižší priorita).
- [ ] 5.6 Storage split-brain re-verifikace: `grep -rn "new GoalStorage()\|from.*storage/goalStorage'"` —
      potvrď žádné nové přímé volání legacy storage mimo `get*StorageImpl()`.

---

## FÁZE 6 — My Journal: PLNÝ audit (debt gate i happy path)

**Guide**: `technical-guides:My-Journal.md`

**Soubory**: `src/services/storage/SQLiteGratitudeStorage.ts` (1710 ř.),
`src/contexts/GratitudeContext.tsx`

- [ ] 6.0 Spusť `sqliteGratitudeStorage.streakDebt.test.ts` (20 testů) —
      baseline.
- [ ] 6.1 **Debt/freeze/warm-up systém** — projdi znovu od nuly (ne jen
      test výsledky): freeze preservation, `streakBeforeFreeze`, warm-up
      payment bridging, auto-reset boundary, `justUnfrozeToday` +1 continuation.
- [ ] 6.2 **Happy path bez dluhu**: 3+ zápisy/den → streak +1, pozice-based
      XP (20/20/20 pro 1.-3., 8 pro 4.-13., 0 pro 14+) per-den, ne kumulativně.
      Zkontroluj konzistenci s denním stropem JOURNAL_MAX_DAILY 415 XP
      (vzorec `3×FIRST_ENTRY + 10×BONUS_ENTRY + 3 milestones` v
      `src/constants/gamification.ts:138-160` musí sedět s reálnými hodnotami).
- [ ] 6.3 **Milestone počítadla ⭐🔥👑** (pozice 4/8/13) — Achievements (Fáze 2)
      je čtou přímo ze streak_state — ověř zápis PŘI VYTVOŘENÍ i PŘI SMAZÁNÍ
      zápisu je symetrický (smazání 13. zápisu musí crown počítadlo vzít zpět).
- [ ] 6.4 **searchByContent** — case-insensitivita pro DE/ES diakritiku
      (filtr v JS, ne SQL LIKE/LOWER — ty jsou ASCII-only).
- [ ] 6.5 `journalEntryCount` synchronizace mezi create/delete napříč SQLite
      i AsyncStorage.

---

## FÁZE 7 — Notifications: PLNÝ audit

**Guide**: `technical-guides:Notifications.md`

**Soubory**: `src/services/notifications/notificationService.ts`,
`notificationScheduler.ts`, `progressAnalyzer.ts`,
`src/hooks/useNotificationLifecycle.ts`,
`src/components/settings/NotificationSettings.tsx`

- [ ] 7.1 **Weighted random selection** (večerní notifikace): incomplete
      habits `(incomplete/scheduledToday)×100` (jen DNES naplánované, ne
      všechny aktivní), missing journal `((3-count)/3)×100`, bonus entries
      fixed 15 (jen při 3+ základních zápisech).
- [ ] 7.2 **"No notification if all requirements met"** — explicitní
      early-exit, ne fallback na náhodný text.
- [ ] 7.3 **Smart tap navigation**: `progressAnalyzer.analyzeDailyProgress()`
      volané ZNOVU při tapu, ne cachovaná hodnota.
- [ ] 7.4 **i18n pluralizace** (`body_one`/`body_other`) — kompletnost EN/DE/ES
      (jen notifikační klíče; plošný i18n audit je Fáze 12).
- [ ] 7.5 `useNotificationLifecycle` po Startup Orchestrator refaktoru (14.7.):
      kritérium — hook je mountnutý právě JEDNOU (v `app/_layout.tsx` /
      `RootProvider`), jeho listenery se při unmountu odregistrují, a
      `git log --oneline --since=2026-07-14 -- src/hooks/useNotificationLifecycle.ts app/_layout.tsx`
      neukazuje nic, co by hook odpojilo od nového startup flow.

---

## FÁZE 8 — Tutorial + Help Tooltips: PLNÝ datový audit

**Guide**: `technical-guides:Tutorial.md`, `technical-guides:Help-Tooltips.md`

**Soubory**: `src/contexts/TutorialContext.tsx`, `src/utils/tutorialAchievementGate.ts`,
`src/services/helpAnalyticsService.ts`, `src/services/helpPerformanceMonitor.ts`

- [ ] 8.0 Spusť `tutorialAchievementGate.test.ts` (4 testy) — baseline.
- [ ] 8.1 `onboarding_tutorial_completed` / `onboarding_current_step` —
      žádný jiný kód mimo TutorialContext tyhle klíče nečte/nepíše
      (kritérium: grep obou klíčů přes `src/` + `app/`, každý hit mimo
      TutorialContext = nález).
- [ ] 8.2 Achievement handshake (`armTutorialAchievementGate`) — projdi
      celý stavový model znovu (armed před vznikem entity → snapshot →
      potvrzení eventem → čekání na zavření modalu s 120s pojistkou).
- [ ] 8.3 Help Tooltips — `help_tooltip_shown`/`help_tooltip_dismissed`
      eventy se reálně odesílají (najdi emit i konzumenta —
      `helpAnalyticsService.ts`; event bez konzumenta = nález ❌).

---

## FÁZE 9 — AdMob + Crashlytics + Marketing Demo Mode: PLNÝ audit

**Guide**: `technical-guides:AdMob.md`, `technical-guides:Crashlytics.md`

**Soubory**: `src/services/adService.ts`, `src/services/adConsentService.ts`,
`src/services/crashReportingService.ts`, `src/components/ads/AdBanner.tsx`,
`src/components/gratitude/StreakWarmUpModal.tsx` + `WarmUpModals.tsx`,
`src/services/marketingDemoModeService.ts`, `src/services/marketingDemoDataService.ts`

- [ ] 9.1 **Rewarded ad nikdy neuděluje XP** (anti-abuse critical rule) —
      grep přes `adService.ts` + `StreakWarmUpModal.tsx` + `WarmUpModals.tsx`,
      potvrď žádná cesta k `addXP` po `EARNED_REWARD`.
- [ ] 9.2 Crashlytics `recordError` zapojený jen na katastrofické cesty
      (DB init, streak calc, monthly progress, harmony multiplier) — žádné
      nové šumové volání (kritérium: vylistuj všechna call-sites
      `recordError`, každé přiřaď ke kategorii z guide).
- [ ] 9.3 Dev/prod ad-unit-ID přepínání (`__DEV__`) — potvrď úplnost.
- [ ] 9.4 **Marketing Demo Mode** (v plánu dosud chyběl; vstupy:
      `app/(tabs)/settings.tsx`, `AdBanner.tsx`): `marketingDemoDataService.ts`
      zapisuje mj. do reálné `xp_multipliers` tabulky. Ověř binárně:
      (a) aktivace demo módu NIKDY nepřepíše produkční data bez úplné zálohy;
      (b) deaktivace obnoví PŘESNĚ původní stav (srovnej dump před/po);
      (c) demo mód není dosažitelný náhodným uživatelem v produkci (skrytý
      vstup/gating — popiš jaký); (d) pád appky UPROSTŘED demo módu
      nenechá uživatele trvale v demo datech (existuje recovery cesta?).

---

## FÁZE 10 — Startup Orchestrator + inicializace appky (NOVÁ FÁZE)

**Proč**: `src/services/startup/` vznikl 14.7. (commit `1e56d63`) a je to
NEJNOVĚJŠÍ kód v repu — žádný audit ho ještě neviděl a **device test na
čisté instalaci pořád čeká** (viz projectplan.md). Řeší historicky nejhorší
user-facing bug (zamrznutí na prvním spuštění) — regresi tady nesmíme přehlédnout.

**Guide**: zatím NEEXISTUJE (`technical-guides:Startup-Orchestrator.md` je
naplánovaný až v Úrovni 2, bod 2.8 v projectplan.md). Referenční specifikace
= sekce "Startup Orchestrator" v `projectplan.md` (3 kritická pravidla) —
přečti ji celou před začátkem fáze.

**Soubory**: `src/services/startup/` (`types.ts`, `startupOrchestrator.ts`,
`index.ts`, `steps/attStep.ts`, `steps/adConsentStep.ts`),
`src/services/appInitializationService.ts`, `src/services/database/init.ts`
(+ `migration/`), `src/services/atomicStorage.ts`,
`src/utils/concurrencySafeguards.ts`, `app/_layout.tsx`,
`src/contexts/RootProvider.tsx`

- [ ] 10.0 Spusť `startupOrchestrator.test.ts` a
      `src/services/database/__tests__/init.test.ts` — baseline.
- [ ] 10.1 **3 kritická pravidla z projectplan.md** — ověř v kódu (soubor+řádek):
      (1) timeout NIKDY neobaluje interaktivní `present()` — jen `prepare()`
      + 5min crash-pojistka; (2) `finalizeAdsAndDiagnostics()` (reklamy +
      Crashlytics) běží VŽDY, i když se consent formulář přeskočí; (3) pořadí
      ATT → zapnutí analytics → `app_open` zachováno.
- [ ] 10.2 **Konzumenti `awaitStartupComplete()`** — grep: kdo všechno čeká
      na konec pipeline (očekávaný: TutorialContext/uvítací brána). Každé
      místo, které zobrazuje UI při startu a NEČEKÁ, je kandidát na překryv
      → nález.
- [ ] 10.3 Guard proti dvojímu spuštění pipeline (StrictMode/re-mount) +
      app-ready gate (fonty, DB, `AppState==='active'`, po prvním snímku).
- [ ] 10.4 **Database init + migrace**: retry logika (N3 fix z 6/13),
      idempotence migrací — co se stane při force-quit UPROSTŘED migrace
      a dalším startu (kritérium: každá migrace je re-runnable nebo
      transakční; zapiš per-migrace).
- [ ] 10.5 `RootProvider.tsx` — pořadí providerů: závislosti mezi contexty
      (kdo čte koho) zdokumentuj; provider čtoucí data z provideru POD sebou
      = nález. N30 (side-effect barrel import v `_layout.tsx`) jen potvrď
      a nech Fázi 13.
- [ ] 10.6 🔶 **Device testy** (scénář externího testera):
      (a) čistá instalace → ATT → UMP (včetně "Manage options" a pomalého
      klikání) → uvítací brána → tutoriál, nikdy 2 okna přes sebe;
      (b) force-quit během ATT promptu → další start pokračuje správně;
      (c) start v letadlovém režimu → UMP `prepare()` vyprší → fail-open,
      appka plně funkční offline (local-first);
      (d) smazání appky + reinstalace → čistý stav, žádný crash, tutoriál
      se spustí znovu.

---

## FÁZE 11 — Home screen + customizace + doporučení (NOVÁ FÁZE)

**Proč**: `src/components/home/` má 16 komponent, vlastní context
(`HomeCustomizationContext`), vlastní storage (`homePreferencesStorage.ts`)
a doporučovací engine (`recommendationEngine.ts` + `PersonalizedRecommendations`)
— nic z toho původní plán nepokrýval a Home je první obrazovka, kterou
uživatel vidí.

**Guide**: žádný specifický; platí `technical-guides.md` (sekce Theme &
Color System, Screen Creation Guidelines) + `technical-guides:Gamification-UI.md`
pro XP prvky.

**Soubory**: `src/components/home/*` (16 komponent),
`src/contexts/HomeCustomizationContext.tsx`,
`src/services/storage/homePreferencesStorage.ts`,
`src/services/recommendationEngine.ts`, `app/(tabs)/index.tsx`

- [ ] 11.1 **recommendationEngine**: vylistuj všechny typy doporučení;
      pro každý ověř (a) podmínka vzniku je splnitelná reálnými daty,
      (b) tap vede na existující obrazovku/akci, (c) případné
      `RECOMMENDATION_FOLLOW` XP jde přes `addXP` a spadá pod
      ENGAGEMENT_MAX_DAILY (200). Kritérium: tabulka typ→trigger→cíl→XP.
- [ ] 11.2 **HomeCustomizationContext + homePreferencesStorage**: zapnutí/
      vypnutí každého widgetu se uloží a přežije restart (🔶 device);
      storage klíč má jediného zapisovatele (grep).
- [ ] 11.3 **Datová správnost widgetů**: `GratitudeStreakCard`,
      `StreakVisualization`/`StreakHistoryGraph`, `WeeklyHabitChart`,
      `Monthly30DayChart`, `MonthlyHabitOverview`, `YearlyHabitOverview`,
      `HabitPerformanceIndicators`, `HabitTrendAnalysis`, `HabitStatsDashboard` —
      každý widget čte data výhradně přes contexty/SQLite storage (žádný
      přímý import legacy `*Storage.ts` — grep), a completion-rate čísla
      jdou přes sdílenou utilitu (vazba na 4.3).
- [ ] 11.4 `QuickActionButtons` — každé tlačítko naviguje na existující
      route a respektuje tutoriál (nerozbíjí spotlight flow).
- [ ] 11.5 `XpMultiplierSection` — zobrazený stav multiplikátoru = stav
      v `xpMultiplierService` (žádná vlastní kopie odpočtu času).
- [ ] 11.6 `DailyMotivationalQuote` — deterministická denní rotace (stejný
      den = stejný citát), texty přes i18n (kompletnost řeší Fáze 12).
- [ ] 11.7 **Theme compliance**: spusť projektový skill `theme-validator`
      nad `src/components/home/` + `challenges/` + `achievements/`.
      Kritérium: 0 porušení, nebo každé porušení zapsané jako nález.

---

## FÁZE 12 — i18n audit EN/DE/ES (NOVÁ FÁZE)

**Proč**: Achievementy (78×), výzvy (14 šablon × title/description/requirement),
notifikace a tutoriál jsou plné textů; poslední plošné i18n audity
(`I18N_FINAL_AUDIT_REPORT.md`, `ACHIEVEMENT_I18N_TRACKING.md` v rootu —
jen historický kontext) proběhly PŘED červencovými změnami (nové modaly,
Startup Orchestrator, welcome gate). Chybějící DE/ES klíč = anglický text
v německé appce, přesně typ chyby, který unikne všem ostatním fázím.

**Guide**: `technical-guides.md` § Internationalization (i18n) Guidelines.
**Nástroj**: projektový skill `i18n-auditor` (spusť ho jako první krok fáze).

**Soubory**: `src/locales/en|de|es/`, `src/utils/i18n.ts`, `src/hooks/useI18n.ts`

- [ ] 12.0 Spusť skill `i18n-auditor` — jeho výstup je baseline fáze.
- [ ] 12.1 **Paritní kontrola klíčů**: každý klíč existující v EN existuje
      i v DE a ES (a obráceně — osiřelé klíče zapiš). Kritérium: skript/grep
      diff, výstupem počet chybějících klíčů per jazyk (cíl: 0).
- [ ] 12.2 **Achievementy**: všech 75 má name + description ve 3 jazycích
      (+ uklidit OSIŘELÉ i18n klíče 3 trofejí smazaných v F2: recommendation-master,
      flame-collector, triple-crown-master — viz faze-2-nalezy.md);
      žádný text nezůstal anglicky v DE/ES (namátkově ověř kvalitu, ne
      strojový posudek celého překladu).
- [ ] 12.3 **Monthly Challenges**: 14 šablon × title/description/requirement
      (klíče `help.challenges.templates.*` — ověřeno, že kód je čte přes `t()`)
      ve 3 jazycích.
- [ ] 12.4 **Hardcoded strings**: grep user-facing literálů v komponentách
      vzniklých/změněných od 1.7. (`git log --since=2026-07-01 --name-only`)
      — každý hardcoded text = nález (přesně tohle byla jedna z mezer
      nalezených 2.7. — hardcoded EN chybová obrazovka).
- [ ] 12.5 Pluralizace: všechny `_one`/`_other` páry kompletní ve 3 jazycích
      (navazuje na 7.4, ale plošně, ne jen notifikace).

---

## FÁZE 13 — Mrtvý kód napříč codebase (dříve Fáze 10; VŽDY POSLEDNÍ)

**Zdroj kontextu**: `production-audit-2026-06-10.md` sekce 3.6 (N27-N32) —
⚠️ soubor je smazaný z working tree, obnov si ho:
`git show 1e56d63:production-audit-2026-06-10.md`. Otevřené nálezy viz
sekce 0 výše. Dělat POSLEDNÍ — potřebuje závěry z Fází 1-12, aby bylo
jasné co je "legacy ale používané" vs. "opravdu mrtvé".

- [ ] 13.1 **N27 — legacy storage duplikace** (3370 řádků): ověř migrace
      proběhla u všech uživatelů (telemetrie `sqlite_migration_state`),
      POKUD ano, navrhni (NEDĚLEJ v tomhle auditu) plán smazání legacy
      větví — po jednom souboru, každý s vlastním grep-ověřením a test
      runem, nikdy "smazat všechny 3 najednou".
- [ ] 13.2 **N30 — side-effect barrel import**: `app/_layout.tsx` →
      `import '../src/services'` — zdokumentuj, co všechno side-effect
      spouští, a navrhni explicitní inicializaci (vazba na nález z 10.5).
- [ ] 13.3 **N31 — obrácená závislost** storage→gamification — souhrn
      ze všech fází (4.6 Habits, případně další nalezené).
- [ ] 13.4 **Fresh sweep**: `src/services/`, `src/components/`, `src/utils/` —
      exportované symboly bez importu jinde (grep-based, pozor na dynamické
      `require()`), zaměř se hlavně na soubory vzniklé PO 6/10 auditu.
      Speciálně prověř podezřelé drobnosti: `src/utils/xpCounterOptimizationSummary.ts`,
      `src/utils/fixBeginnerTargetText.ts`, `src/services/socialSharingService.ts`,
      `src/services/hapticsService.ts` — jsou vůbec odněkud volané?
- [ ] 13.5 `src/services/storage/backup.ts` BLOCKER komentář pořád na místě.
- [ ] 13.6 Root-level `.md` soubory → jen SEZNAM s návrhem přesunu do
      `docs/archive/` (N32) — žádné hromadné přesuny v rámci auditu,
      rozhodne Petr.

---

## Doporučené pořadí fází

1. **Fáze 1** (Gamification Core/Events/UI/limity/levely/loyalty) — základ
   pro 2-6 a 11.
2. **Fáze 2** (Achievements, 8 sub-fází 2a-2h + device check 2i) — právě
   tady se nedávno našly nové chyby navzdory předchozímu auditu, dát
   vysokou prioritu.
3. **Fáze 3** (Monthly Challenges, 3.0 + 7 sub-fází 3a-3g) — totéž zdůvodnění.
4. **Fáze 4 → 5** (Habits → Goals) — Habits má jednodušší strukturu, dobrá
   rozcvička před Goals (rozporuplné číslo 5.0 k vyřešení).
   ⚠️ Platí **cross-impact pravidlo** ze sekce 1: opravy tady mohou
   zneplatnit závěry fází 2-3 → po opravách znovu spustit jejich suites
   a re-verifikovat dotčené položky.
5. **Fáze 6** (Journal) — navazuje na Fázi 2 (milestone počítadla);
   cross-impact pravidlo platí i tady.
6. **Fáze 10** (Startup + inicializace) — nezávislá na 1-6, ale obsahuje
   čekající device test z 14.7. → **možno předsunout kdykoliv**, ideálně
   spojit device část (10.6) s device testy 2i a 3e do jednoho sezení
   se zařízením.
7. **Fáze 7** (Notifications) — nezávislá, kdykoliv mezi tím.
8. **Fáze 8 + 9** (Tutorial/Help + AdMob/Crashlytics/Demo) — lehčí.
9. **Fáze 11** (Home) — až po 1 a 4 (widgety zobrazují habit/XP data,
   potřebuješ vědět, co je "správně").
10. **Fáze 12** (i18n) — až po 2, 3, 7 (kdyby opravy přidaly/změnily klíče,
    ať se kontroluje finální stav).
11. **Fáze 13** (mrtvý kód) — vždy poslední.

**Odhad náročnosti**: Fáze 2 a 3 jsou největší (78 + 14 položek k plnému
prověření) — počítej s nimi jako s nejnáročnější částí celého auditu.
Fáze 1 narostla (limity, levely, loyalty) — je druhá nejtěžší. Fáze 4, 5, 7,
10 jsou plnohodnotné hloubkové audity srovnatelné s červencovými. Fáze 6,
8, 9, 11 o něco lehčí. Fáze 12 je z velké části skriptovatelná (skill +
diff klíčů). Fáze 13 je otevřená co do rozsahu (13.4 fresh sweep) — časově
ohraničit předem. Device testy (2i, 3e, 10.6, 11.2) plánuj do společných
sezení se zařízením, ať se appka nepřeinstalovává zbytečně často.

## Dávkování na sessions (pro Petra — jak zadávat práci)

Jedna session = jeden řádek tabulky. Zadání každé session je jedna věta:
*„Proveď <blok> ze @super-audit-plan-2026-07-16.md, přesně podle sekce
‚Jak spustit fázi', exekučního kontraktu E1–E8 a metodologie v sekci 1."*
Po každé session: commitnout zprávu + případné opravy. Nikdy nezadávat
víc bloků najednou — kvalita kontroly klesá s délkou práce v jednom kuse.

| # | Blok | Pozn. |
|---|---|---|
| 1 | Fáze 1 celá (1.1–1.9) | ✅ HOTOVO 2026-07-16 (zpráva: faze-1-nalezy.md) |
| 2 | 2.0 + 2a + 2b | ✅ HOTOVO 2026-07-16 (5 nálezů, 1 vysoký — N-2.1; zpráva: faze-2-nalezy.md) |
| 3 | 2c | ✅ HOTOVO 2026-07-16 (N-2.6 nalezen + opraven; zpráva: faze-2-nalezy.md) |
| 4 | 2d | ✅ HOTOVO 2026-07-16 (15/15, XP shoda, N-2.7 duplicity) |
| 5 | 2e + 2f | ✅ HOTOVO 2026-07-16 (17/17; N-2.8 mrtvý recommendation-master → rozhodnutí Petra) |
| 6 | 2g + 2h | ✅ HOTOVO 2026-07-16 (loyalty 10/10 ✓, batch ✓; N-2.11 + N-2.12 → rozhodnutí Petra) |
| 7 | 3.0 + 3a + 3b | ✅ HOTOVO 2026-07-18 (11 nálezů; PROVEDENY opravy N-3.1/3.2/3.3/3.4/3.5/3.6/3.7/3.8/3.9 — vč. perzistence day-guard stavu = statické uzavření NÁLEZU 4, přestavby generování targetů a smazání mrtvých scaling API; otevřené jen N-3.10/3.11 [NÍZKÁ]; 409/409 ✓; zpráva: faze-3-nalezy.md) |
| 8 | 3c + 3d | ✅ HOTOVO 2026-07-19 (4 nálezy N-3.12–N-3.15, VŠECHNY PROVEDENY — XP Champion auto-výhra, nesplnitelný Balance Expert, bucketování balance, undo v denním XP, zjemněná consistency minima, perfektní den s bonusy; 413/413 ✓; zpráva: faze-3-nalezy.md) |
| 9 | 3f + 3g | výběr šablon + lifecycle |
| 10 | Fáze 4 | poté cross-impact: suites F2+F3 |
| 11 | Fáze 5 | poté cross-impact: suites F2+F3 |
| 12 | Fáze 6 | poté cross-impact: suites F2+F3 |
| 13 | Fáze 10 (statická část, bez 10.6) | lze předsunout kamkoliv |
| 14 | Fáze 7 | |
| 15 | Fáze 8 + 9 | |
| 16 | Fáze 11 | až po 1 a 4 |
| 17 | Fáze 12 | až po 2, 3, 7 |
| 18 | Fáze 13 | vždy poslední |
| 🔶 | Device sezení: 2i + 3e + 10.6 + 11.2 | dělá Petr se zařízením, ideálně po #9 |
