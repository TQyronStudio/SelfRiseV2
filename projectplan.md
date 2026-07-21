# SelfRise V2 - Project Plan

> 📦 **Handoff**: Blueprinty zbývající práce (runtime ověření, Crashlytics, Achievements audit, N27/N28/N31, Sprint 4) + nebezpečné zóny: @handoff-blueprints.md

> 🧹 **Úklid 2026-07-14**: Dokončené sekce přesunuty do @implementation-history.md (viz index níže). Tento soubor drží už jen ROZPRACOVANÉ a PLÁNOVANÉ úkoly + trvalou referenci.

> 🔍 **Připraveno 2026-07-16**: Super audit plán (gamifikace + data integrita + mrtvý kód,
> 13 fází + sub-fáze, k provedení jinou session; revidováno druhou session téhož dne —
> doplněny fáze Startup/Home/i18n, ověřena fakta proti kódu) — @super-audit-plan-2026-07-16.md.
>
> ✅ **Fáze 1 provedena 2026-07-16 (Fable)**: baseline zelená (tsc 0, 399/399 testů),
> 9/9 položek auditováno, 12 nálezů (0 kritických pro uživatele; hlavní: mrtvý XP batching
> pipeline vč. eventu s živými listenery, mrtvé SQLite tabulky loyalty_state/daily_activity_log,
> 2 nevynucená pravidla limitů z guide). **Schválené opravy PROVEDENY 2026-07-16**
> (dokumentace Events/Core, smazání 3 mrtvých konstant 80/20, smazání LOYALTY_MILESTONE,
> level tabulka do guide) — tsc 0, 399/399 testů ✓. Odloženo: mrtvý kód/tabulky → Fáze 13;
> N-1.6b se neřeší. **N-1.7b VYŘEŠEN**: levelová křivka zploštěna dle rozhodnutí Petra
> (mocninná křivka, levely 1–10 beze změny; level 100 = ~2,0 M XP → max. uživatel ~4,6 roku;
> validateProgressionTimeline() nyní isValid: true). Fáze 2f má ověřit prahy
> level-achievementů proti nové křivce.
> Zpráva vč. detailů oprav: @docs/audits/super-audit-2026-07/faze-1-nalezy.md
>
> 🔍 **Fáze 2 — session #2 provedena 2026-07-16 (Fable)**: 2.0 baseline (107/107 ✓)
> + HABITS 8/8 + GOALS 8/8 auditováno. 5 nálezů vč. 1 vysokého (N-2.1: toggle abuse
> trofejí přes XP transakce). **Opravy schváleny a PROVEDENY**: county dokončení čtou
> storage stav (reverze snižují), habit-builder kumulativní (soft-delete využit),
> multi-tasker timeframe srovnán; +4 regresní testy (Group C), guide PRODUCTION FIX 1.
> tsc 0, 403/403 testů ✓. Zpráva: @docs/audits/super-audit-2026-07/faze-2-nalezy.md
>
> 🔍 **Fáze 2 — session #3 (2c JOURNAL 1. půlka) provedena 2026-07-16 (Fable)**:
> 16/16 auditováno. XP hodnoty vč. custom (125/150/750) sedí s guide ✓; 14 položek
> storage-based ✅. Nález **N-2.6** (předpovězený handoffem): `journal-enthusiast` +
> `first-journal` počítaly transakce → viděly jen zápisy 1-3/den a mazání neodečítaly —
> OPRAVENO přesměrováním na `getTotalJournalEntries` (stejná schválená třída jako N-2.1)
> + test. tsc 0, 404/404 ✓. Zpráva: @docs/audits/super-audit-2026-07/faze-2-nalezy.md
>
> 🔍 **Fáze 2 — sessions #4+#5 (2d+2e+2f) provedeny 2026-07-16 (Fable)**: 32/32
> auditováno (celkem 65/78). XP shoda katalog↔guide 32/32 vč. custom hodnot.
> **K ROZHODNUTÍ (audit-only, bez oprav): N-2.8 [VYSOKÁ]** — trofej
> `recommendation-master` je mrtvá (nikdo neuděluje RECOMMENDATION_FOLLOW XP +
> placeholder ×0,3): dodrátovat follow-tracking (váže se na Fázi 11), nebo vyřadit?
> Dále N-2.7 (duplicitní targety 2 párů trofejí — dvojitá odměna naráz), N-2.9 (dvě
> definice „aktivního dne"), N-2.10 (klouzavý vs. kalendářní měsíc u Perfect Month).
> Pozitivní: level trofeje po rebalanci křivky dávají smysl (uzavřen cross-check F1).
> Zpráva: @docs/audits/super-audit-2026-07/faze-2-nalezy.md
>
> ✅ **Rozhodnutí Petra k F2 nálezům PROVEDENA 2026-07-16 (Fable)**: N-2.8 + N-2.7 →
> **smazány 3 trofeje** (recommendation-master, flame-collector, triple-crown-master)
> → **katalog 78 → 75**; N-2.9/N-2.10 → sladěn text guide (kód beze změny). Uklizen
> preview-utils, testy (75), guide (počty/XP 24 150/rarity/popisy). tsc 0, 401/401 ✓.
> Osiřelé i18n klíče → F12, drobný dead-code (recommendations_followed case, ×0,3) → F13.
> **Zbývá dokončit Fázi 2: 2g SPECIAL (14) + 2h batch + 2i device.**
>
> 🔍 **Fáze 2 — session #6 (2g SPECIAL + 2h batch) provedena 2026-07-18 (Fable)**:
> 14/14 + batch smyčka auditovány → **auditní část Fáze 2 KOMPLETNÍ (75/75)**.
> ✅ Loyalty 10/10 shoda katalog↔LOYALTY_MILESTONES↔guide (uzavřen pointer z F1.8);
> legendary-master čte všechny 3 zdroje přes storage (těží z N-2.1/2.6); batch cap
> po filtru drží (150 vs 75, test dynamický). **K ROZHODNUTÍ: N-2.11 [STŘEDNÍ]** —
> `persistence-pays` počítá obráceně (7 odchodů z appky místo „1 návrat + 7 aktivit"
> — perverzní motivace); **N-2.12 [NÍZKÁ]** — `seven-wonder` počítá i pozastavené
> návyky (ignoruje isActive). Zbývá 2i device. Zpráva: @docs/audits/super-audit-2026-07/faze-2-nalezy.md
>
> ✅ **N-2.11 + N-2.12 schváleny a PROVEDENY 2026-07-18 (Fable)**: persistence-pays
> obrácen na „aktivity od posledního comebacku" (+ require() konvence — dynamický
> import blokoval mocky), seven-wonder filtruje jen aktivní návyky. +4 testy.
> tsc 0, **405/405** ✓. Nový INFO N-2.13 (zbylé await import v integraci) → F13.
> **Fáze 2 kompletní až na 2i (device).**
>
> ✅ **Session #7 (3.0 + 3a + 3b) HOTOVÁ 2026-07-18 (Fable)**: baseline 4/4 suites
> 76/76 ✓, tsc 0; auditováno 8/14 šablon Monthly Challenges (Habits 4 + Journal 4).
> **11 nálezů N-3.1–N-3.11, žádný kód neměněn (E1)**. Nejvážnější **K ROZHODNUTÍ**:
> **N-3.1 [VYSOKÁ ❌]** — zápisy deníku nesoucí milestone (#4/#8/#13 dne) mají source
> `JOURNAL_BONUS_MILESTONE`, který tracker nematchuje → Gratitude Guru ztrácí až
> 3 zápisy/den, Consistency Writer 5⭐ reálně chce 6 zápisů/den; **N-3.2 [VYSOKÁ]** —
> kategorová minima + špatné škály baseline metrik → u 5 šablon mrtvá personalizace
> (streak šablony vždy „celý měsíc", Reflection Expert může být nesplnitelný);
> **N-3.4 [VYSOKÁ ❌]** — anti-repeat výběru šablon mrtvý (challenge nenese templateId,
> historie vrací UUID). Dále N-3.3 (hvězdy 1-4 často stejný target), N-3.5/3.6
> (streak kumulace + chybějící undo), N-3.7 (EN hardcoded popis), N-3.9 (testy
> validují mrtvé scaling API) ad. Zbývá: 3c+3d (session #8), 3f+3g (session #9),
> 3e device. Zpráva: @docs/audits/super-audit-2026-07/faze-3-nalezy.md
>
> ✅ **Opravy session #7 PROVEDENY 2026-07-18 (Fable)**: N-3.1 (milestone zápisy
> #4/#8/#13 se počítají), N-3.4 (challenge nese templateId → anti-repeat funguje),
> N-3.5 (streak = skutečná série s resetem + **perzistence day-guard stavu přes
> restart = statické uzavření NÁLEZU 4**; 3e device zůstává jako ověření), N-3.6
> (undo: delete posílá metadata, tracker reverzuje quality/streak/variety), N-3.7
> (dynamický popis Consistency Writer lokalizován EN/DE/ES). +7 regresních testů
> (trackingKeys 16→23). Guide doplněn (sekce 0b).
>
> ✅ **N-3.2 + N-3.3 + N-3.9 schváleny a PROVEDENY 2026-07-18 (Fable)**: hvězdy se
> lineárně mapují do range šablony (každá hvězda ostře těžší; + oprava float
> epsilon 110→111); srovnané škály baseline metrik (bonus ×30, variety ×4, guru
> celkové zápisy, reflection nová metrika qualityJournalEntries) + minima per
> tracking klíč + stropy (quality 3×dny, variety návyky×týdny); smazána 3 mrtvá
> scaling API a testy přesměrovány na reálnou cestu calculateTargetFromBaseline
> (6 testů přepsáno, 3 smazány). Guide dorovnán vč. tabulek šablon (N-3.8).
> tsc 0, **409/409 testů (26/26 suites)** ✓. Otevřené jen N-3.10/3.11 [NÍZKÁ].
>
> ✅ **Session #8 (3c + 3d) HOTOVÁ 2026-07-19 (Fable)**: auditováno zbylých 6 šablon
> (Goals 2 + Consistency 4) — NÁLEZY 1+2 z 11.7. drží. Nové nálezy: **N-3.12
> [VYSOKÁ, PROVEDEN pod schváleným N-3.2]** — (a) Achievement Unlocked chtěl 12
> dokončených cílů místo 2-3; (b) **XP Champion měl target ~58 XP/měsíc = automatická
> výhra 5-25k XP** (baseline z denního průměru → opraveno na totalMonthlyXP);
> (c) **Balance Expert byl matematicky nesplnitelný** (ceil na škále 0-1 + minimum
> 25 → opraveno na zlomkový target, minima 0.60/0.70, strop 0.95). +1 regresní
> test B9. **K ROZHODNUTÍ: N-3.13 [STŘEDNÍ]** — balance score bucketuje XP podle
> neexistujících source hodnot (achievementy/milestony padají do 'other');
> **N-3.14 [NÍZKÁ]** — undo nesnižuje denní XP součet; **N-3.15 [NÍZKÁ]** —
> kalibrace consistency minim + bonus-only den není „perfektní". Guide dorovnán.
> tsc 0, **410/410 testů (26/26 suites)** ✓. Zbývá: 3f+3g (session #9), 3e device.
>
> ✅ **N-3.13 + N-3.14 schváleny a PROVEDENY 2026-07-19 (Fable)**: bucketování
> balance skóre dle skutečného enumu (achievementy/milestony už nepadají do
> 'other'), denní XP = čistý součet s podlahou 0 (undo snižuje). +2 diskriminační
> testy. tsc 0, **412/412 testů** ✓. N-3.15 vysvětlen laicky, čeká na rozhodnutí.
>
> ✅ **N-3.15 rozhodnut a PROVEDEN 2026-07-19 (Fable)**: a) minima Triple Master /
> Perfect Month zjemněna na [8,10,12,15,18] dní; b) perfektní den počítá i bonusové
> návyky (tracker + baseline sladěny; achievementy bonusy počítaly už dřív). +2 testy.
> tsc 0, **413/413 testů (26/26 suites)** ✓. **Fáze 3: všechny nálezy N-3.1–N-3.15
> vyřešené kromě N-3.10/N-3.11 [NÍZKÁ, bez rozhodnutí]. Zbývá session #9 (3f+3g)
> a 3e device.**
>
> ✅ **Session #9 (3f + 3g) HOTOVÁ 2026-07-19 (Fable) — auditní část FÁZE 3 KOMPLETNÍ.**
> 3f: nová distribuce suite (seed RNG, 5000 tahů/kategorii) — losování ✓ v nesezónních
> měsících (žádný monopol, vše ne-gated > 0 %, star gating ✓), rozdělení ve zprávě.
> 3g: nová closure suite — uzávěrka ověřena parametrizovaně přes VŠECH 14 šablon
> (hvězdy s reálným %, streak reset, žádné XP při neúspěchu, správná klasifikace
> partial/failure, warm-up guard). **K ROZHODNUTÍ: N-3.16 [STŘEDNÍ]** — sezónní
> bonus +30 > variance ±20 → v lednu/únoru/září/říjnu se vrací deterministický
> monopol Consistency Mastera; **N-3.17 [STŘEDNÍ]** — archiv po uzávěrce je no-op
> (status se přepne dřív, než se výzva najde) → challenge_history má trvale stale
> data a neúspěch se nikdy neoznačí 'failed'. tsc 0, **424/424 testů (28/28 suites)** ✓.
> Zbývá: 3e device (Petr) + rozhodnutí N-3.10/3.11/3.16/3.17.
>
> ✅ **N-3.16 + N-3.17 schváleny a PROVEDENY 2026-07-19 (Fable)**: sezónní bonus
> +30 → +15 (říjnový podíl Consistency Mastera z matematických 100 % na naměřených
> 90 %, konkurenti mají reálnou šanci; anti-repeat brání opakování) + sezónní
> regresní test; archiv uzávěrky opraven (lookup před statusem, INSERT OR REPLACE,
> reálné finální statistiky, neúspěch = 'failed') a closure test to u všech 14
> šablon vynucuje. tsc 0, **425/425 testů (28/28 suites)** ✓.
> **Zbývá: 3e device (Petr) + rozhodnutí N-3.10/N-3.11 [NÍZKÁ].**
>
> ✅ **N-3.10 + N-3.11 schváleny a PROVEDENY 2026-07-19 (Fable)**: Variety týdny
> pondělně (shodně s kalendářem; přelom měsíce restartuje počítání), aktivní dny
> v kalendáři už nikdy šedé; sezónní bonus podle CÍLOVÉHO měsíce (naměřeno: leden
> z prosince 90,2 % vs. 60,5 % — novoroční boost konečně míří na leden). +1 test.
> tsc 0, **426/426 testů (28/28 suites)** ✓.
> **FÁZE 3 KOMPLETNÍ: všech 17 nálezů N-3.1–N-3.17 vyřešeno a provedeno.
> Zbývá pouze 3e device (Petr).**
> Kompletní audit od nuly (i oblastí auditovaných dřív — 14.7. se v Achievements
> našel nový skrytý bug i po předchozím hloubkovém auditu z 3.7.).
>
> 🔍 **Session #10 (Fáze 4 — Habits) AUDITNÍ ČÁST HOTOVÁ 2026-07-19 (Fable)**:
> 8/8 položek, brána úplnosti ✓, baseline tsc 0 + 426/426 testů ✓. **9 nálezů
> N-4.1–N-4.9 čeká na rozhodnutí Petra** — nejzávažnější N-4.1 [KRITICKÁ]:
> „MINULOST SE NEMĚNÍ" je v živé SQLite cestě mrtvé (scheduleHistory se nikdy
> nenačte z DB → veškerá historie se počítá podle aktuálního rozvrhu; testy
> zelené, protože vkládají historii ručně). Dále N-4.3 (Weekly/30Day procento
> bez bonusů), N-4.5/N-4.2/N-4.8 (E5 rozhodnutí), zbytek úklid. Opravy zatím
> NEprovedeny (E1); po opravách následuje cross-impact F2+F3.
> Zpráva: @docs/audits/super-audit-2026-07/faze-4-nalezy.md
>
> ✅ **Session #10 — FÁZE 4 KOMPLETNÍ 2026-07-19 (Fable)**: všech 9 nálezů
> N-4.1–N-4.9 rozhodnuto Petrem a PROVEDENO. Klíčové opravy: scheduleHistory
> se načítá z DB (+ seed původního rozvrhu při první změně + lokální datum)
> — immutability funguje end-to-end, nová storage suite 8 testů; bonus se
> nepáruje s dneškem; grafy počítají procento s bonusy; conversion cache
> invaliduje referencemi + přes půlnoc; mrtvý kód smazán (HabitResetUtils,
> frequency-proportional pozůstatky); guide aktualizován (XP při smazání
> návyku zůstává — zapsané pravidlo). **Cross-impact F2+F3: 113+100 testů ✓,
> závěry fází 1-3 nedotčeny.** tsc 0, **435/435 testů (29/29 suites)** ✓.
> Zbývá z fází 2-3: 2i + 3e device (Petr). Další: session #11 = Fáze 5 (Goals).
>
> 🔍 **Session #11 (Fáze 5 — Goals) AUDITNÍ ČÁST HOTOVÁ 2026-07-19 (Fable)**:
> 7/7 položek, brána úplnosti ✓, baseline tsc 0 + 435/435 ✓. **9 nálezů
> N-5.1–N-5.9 čeká na rozhodnutí Petra** — nejzávažnější N-5.1 [VYSOKÁ]:
> milestone XP (25/50/75 % → 50/75/100 XP) je v živé SQLite cestě MRTVÉ
> (implementaci má jen legacy cesta — stejná třída regrese jako N-4.1);
> N-5.2 [VYSOKÁ]: odečtení progressu pod target completion nezruší (−250
> reverze se nikdy nestane); dále UTC datumy (N-5.3), validace vs. guide
> (N-5.6 E5), mrtvý kód a doc opravy. Opravy zatím NEprovedeny (E1);
> po opravách cross-impact F2+F3.
> Zpráva: @docs/audits/super-audit-2026-07/faze-5-nalezy.md
>
> ✅ **Session #11 — FÁZE 5 KOMPLETNÍ 2026-07-19 (Fable)**: všech 9 nálezů
> (+bonus N-5.3b) rozhodnuto Petrem a PROVEDENO. Klíčové opravy: milestone
> XP (25/50/75 % → 50/75/100) obnoveno v živé cestě s anti-re-earn persistencí
> v goal_milestones; odečtení progressu pod target od-dokončí cíl a vrací
> 250/350 XP (obě cesty sjednoceny); datumy cílů lokální; completedDate
> jako DateString (opravilo completion modal i timeframe achievementy);
> horní mez targetValue 999 999; mrtvý kód smazán; guide přepsán podle
> reality vč. pravidel „XP při smazání cíle zůstává" a známé hrany N-5.9.
> Nová suite progressXP (10 testů). **Cross-impact F2+F3: 113+100 ✓, závěry
> fází 1-3 nedotčeny.** tsc 0, **445/445 testů (30/30 suites)** ✓.
> Další: session #12 = Fáze 6 (My Journal). Device fronta: 2i + 3e (Petr).
>
> 🔍 **Session #12 (Fáze 6 — My Journal) AUDITNÍ ČÁST HOTOVÁ 2026-07-20 (Fable)**:
> 6/6 položek, brána úplnosti ✓, baseline tsc 0 + 445/445 + streakDebt 23 ✓.
> **ČISTÁ fáze — 0 kritických/vysokých**, jen 4 nálezy nízké priority (úklid):
> N-6.1 mrtvý duplikát calculateAndUpdateStreakWithWarmUp (~100 ř.); N-6.2
> JOURNAL_MAX_DAILY=415 je chybná aritmetika (reálně 315) + vestigiální
> per-source dailyLimity; N-6.3 redundantní inline decrement milestone
> counterů v delete(); N-6.4 journalEntryCount vestigiální (0 konzumentů) +
> nekonzistentní. Debt gate, pozice-based XP, milestone countery i search
> (DE/ES diakritika) funkčně správné a kryté testy. Opravy zatím NEprovedeny
> (E1). Zpráva: @docs/audits/super-audit-2026-07/faze-6-nalezy.md
>
> ✅ **Session #12 — opravy FÁZE 6 PROVEDENY 2026-07-20 (Fable)**: N-6.1
> (mrtvá Phase 1/2/3 scaffolding smazána: calculateAndUpdateStreakWithWarmUp
> + Basic + canRecoverDebt, 0 callerů), N-6.2 (JOURNAL_MAX_DAILY 415→315,
> oprava chybné aritmetiky), N-6.4 (vestigiální journalEntryCount odstraněn
> z 6 míst). **N-6.3 čeká na rozhodnutí Petra** (redundantní inline decrement
> milestone counterů). **N-6.3 na Petrovu žádost staticky i empiricky ověřen**
> jako redundantní (nová suite 6 testů: countery správné jen z přepočtu i po
> odstranění inline decrementu) a smazán. Cross-impact F2+F3: 113+100 ✓.
> tsc 0, **451/451 (30/30 suites)** ✓. Fáze 6 KOMPLETNÍ. Další: session #13 =
> Fáze 7 (Notifications). Device fronta: 2i + 3e (Petr).
>
> 🔍 **Session #13 (Fáze 10 — Startup Orchestrator, statická část bez 10.6)
> AUDITNÍ ČÁST HOTOVÁ 2026-07-20 (Fable)**: 6/6 položek, brána úplnosti ✓,
> baseline tsc 0 + 451/451 + orchestrator 10 + init 6 ✓. **Velmi kvalitní kód
> — všechna 3 kritická pravidla dodržena (timeout jen na prepare, finalize
> vždy, ATT→analytics→app_open), bariéra i provider-pořadí OK.** Reálné nálezy
> jen v DB init: **N-10.1 [STŘEDNÍ]** — `db` singleton se nenuluje při selhání
> createTables → retry vrátí polovičně zmigrovanou DB a označí ji za ready
> (místo DatabaseErrorScreen); **N-10.2 [NÍZKÁ]** — goal_progress restore není
> idempotentní (plain INSERT + netransakční) → force-quit hrana bricku DB init
> u prastarého schématu; N-10.3 INFO (finalize pod cancelled guard). PLAN-DISCR:
> guide Startup-Orchestrator zatím neexistuje. Opravy zatím NEprovedeny (E1);
> 10.6 device zůstává Petrovi. Zpráva: @docs/audits/super-audit-2026-07/faze-10-nalezy.md
>
> ✅ **Session #13 — opravy FÁZE 10 PROVEDENY 2026-07-20 (Fable)**: N-10.1
> (`db` singleton se publikuje až po úspěšném createTables + handle se při
> selhání zavírá → retry skutečně re-runne místo vrácení polovičně zmigrované
> DB), N-10.2 (goal_progress restore `INSERT OR IGNORE` + restore/drop zálohy
> v jedné transakci → force-quit už nemůže zablokovat DB init). N-10.3
> ponecháno dle doporučení (oprava by vyžadovala idempotentní latch, riziko
> zanedbatelné). tsc 0, **451/451 (30/30)** ✓. Cross-impact netřeba (F10 není
> výrobce dat). **Petr potvrdil, že orchestrator už testerům funguje** →
> device 10.6 de facto pokryto. Fáze 10 (statická část) KOMPLETNÍ.
> ✅ **Vyřešena PLAN-DISCREPANCY**: vytvořen chybějící
> @technical-guides:Startup-Orchestrator.md — 3 kritická pravidla jsou tím
> zafixovaná natrvalo (dřív žila jen v sekci projectplan.md určené k archivaci).
>
> 🔍 **Session #14 (Fáze 7 — Notifications) AUDITNÍ ČÁST HOTOVÁ 2026-07-20 (Fable)**:
> 5/5 položek, brána úplnosti ✓, baseline tsc 0 + 451/451 ✓. **Vážený výběr
> večerních notifikací je implementován PŘESNĚ dle guide** (váhy habits/journal/
> bonus, kumulativní losování, explicitní early-exit „vše hotovo → žádná
> notifikace"), i18n klíče kompletní EN/DE/ES, hook mountnutý 1×, listenery
> se uklízejí, Startup refaktor ho neodpojil. **8 nálezů**: N-7.1 [STŘEDNÍ] —
> tap na večerní notifikaci nikdy nepošle do Cílů (podmínka bonusEntries<10
> posílá do Deníku, dokud nemá 13+ zápisů/den); N-7.3/N-7.4 [VÝKON] — analyzátor
> běžící při každém foregroundu dělá N+1 dotazů a načítá celou historii deníku
> místo indexovaného dotazu; N-7.7 — **fáze nemá žádnou regresní suite**;
> N-7.8 [E5] — guide si protiřečí (zastaralá prioritní ukázka vs. vážený systém,
> volba pro cíle v kódu neexistuje); dále ruční pluralizace, latentní datumové
> pole, mrtvá metoda.
> Zpráva: @docs/audits/super-audit-2026-07/faze-7-nalezy.md
>
> ✅ **Session #14 — opravy FÁZE 7 PROVEDENY 2026-07-20 (Fable)**: N-7.1 (tap
> na večerní notifikaci konečně umí poslat do Cílů — cíle povýšeny na prioritu 3),
> N-7.3/N-7.4 (analyzátor běžící při každém foregroundu: N+1 dotazů → 1 indexovaný;
> `getAll()` celé historie deníku → `getByDate(dnes)`), N-7.5 (rozhoduje pole
> `date`, ne časové razítko), N-7.6 (mrtvý kód). **Schválené rozšíření (N-7.8):
> cíle jako 4. volba večerní zprávy, fixní váha 40** (nad bonusem 15, pod
> zanedbaným základem 100) + i18n EN/DE/ES + guide. **Nová regresní suite
> 13 testů — fáze dosud neměla ani jeden** (váhy, guardy, early-exit, obsah zpráv).
> N-7.2 (ruční pluralizace) vědomě odloženo. tsc 0, **464/464 (31/31 suites)** ✓.
> Cross-impact netřeba (samé čtecí změny). **Nápad „doplnění zapomenutého dne"
> zapsán do @projectplan-future-updates.md → Phase 7: Make-up Past Days.**
>
> 🔍 **Session #15 (Fáze 8 + 9) AUDITNÍ ČÁST HOTOVÁ 2026-07-21 (Fable)**:
> 8/8 položek (4+4), brány úplnosti ✓, baseline tsc 0 + 464/464 ✓.
> **Fáze 8 (Tutorial + Help Tooltips)**: achievement handshake je vzorový
> (armed před vznikem entity → snapshot → potvrzení eventem → 120s pojistka,
> žádný leak listenerů) ✅. Nálezy: **N-8.3 [STŘEDNÍ]** — telemetrie Help
> Tooltips je write-only (5 typů událostí + měření výkonu se ukládají do
> AsyncStorage, ale všech 8 čtecích metod má 0 volajících a data nikam
> neodcházejí); **N-8.1 [STŘEDNÍ]** — tutoriálové storage klíče duplikované
> jako literály v XpAnimationContext (přejmenování tiše vypne potlačení
> level-up modalu → dual-modal freeze).
> **Fáze 9 (AdMob + Crashlytics + Demo Mode)**: anti-abuse pravidlo (reklama
> nikdy nedá XP) drží přímo i nepřímo ✅, recordError 4/4 shoda s guide ✅,
> dev/prod ad-unit ID kompletní ✅. **N-9.2 [VYSOKÁ pro demo-enabled build]** —
> zapnutí Marketing Demo Mode **nenávratně smaže všechna reálná data**
> (`DELETE FROM` 28 tabulek bez WHERE, **záloha neexistuje**) a „vypnutí" je
> neobnoví, jen znovu vymaže → prázdná appka. **Riziko ohraničeno: v produkčním
> buildu se sekce vůbec nevykreslí** (env proměnná není nikde nastavená) ✅ —
> ohrožen je Petr při vlastní marketingové práci. Opravy zatím NEprovedeny (E1).
> Zprávy: @docs/audits/super-audit-2026-07/faze-8-nalezy.md,
> @docs/audits/super-audit-2026-07/faze-9-nalezy.md
>
> ✅ **Session #15 — opravy FÁZÍ 8+9 PROVEDENY 2026-07-21 (Fable)**:
> **N-9.2 (rozhodnutí „stačí bod 1")** — klíčové zjištění při opravě: destruktivní
> je NAČTENÍ demo dat, které dosud **nemělo žádné potvrzení** (spouštělo se přímo
> z tlačítka). Přidán tvrdý potvrzovací dialog („Delete ALL your data and load
> demo?") na všechna 3 tlačítka + zpřísněn text u mazání. Záloha vědomě
> neimplementována — demo mód nadále maže nenávratně, ale až po explicitním
> varování. **N-8.3** — smazána mrtvá telemetrie Help Tooltips (2 služby + 6
> volání + osiřelé refy). **N-8.1** — nový `src/constants/tutorialStorageKeys.ts`
> jako jediný zdroj pravdy pro onboarding klíče. **N-9.3** — příznak demo módu
> hned za COMMIT. **N-9.1** — doc oprava v Crashlytics guide.
> tsc 0, **464/464 (31/31 suites)** ✓.

---

## 🎯 AKTUÁLNÍ ÚKOL: Startup Orchestrator — sekvenční startovací pipeline

> 📘 **Technická pravidla a logika pro Startup Orchestrator: @technical-guides:Startup-Orchestrator.md**
> (vytvořen 2026-07-20 — 3 kritická pravidla, kontrakt StartupStep, bariéra,
> app-ready gate, DB init/migrace, nebezpečné zóny. **Guide je nadřazený tomuto
> plánu** — sekce níže je historický kontext zadání a smí se archivovat.)

**Cíl**: Univerzální, budoucnostně odolný systém, který zaručí, že se při startu aplikace nikdy nezobrazí dvě „okna" (nativní systémová: ATT, souhlas s reklamami, oznámení… i naše RN: uvítací brána, tutoriál) přes sebe → **konec iOS dual-modal zamrzávání na prvním spuštění, bez ohledu na počet a pořadí systémových oken**.

**Proč**: Externí tester zamrzl na prvním spuštění. Dnešní `src/utils/startupGate.ts` zná napevno **jen 2 úkoly** (`att`, `consent`) — je to záplata na dvě konkrétní okna, ne systém. Jakmile přibude libovolné další startovací okno (budoucí EU souhlas, druhá vrstva UMP „Manage options"/partneři, cokoliv), princip se rozbije. Potřebujeme řešení odolné vůči **počtu i pořadí** oken („EU přidá dalších 20").

**Aktuální realita v kódu (co orchestrator nahrazuje)**:
- Startovací nativní okna jsou dnes **přesně dvě**: **ATT** (iOS) + **UMP souhlas** (AdMob). Nic víc se při startu neptá.
- **Oznámení NEJSOU startovací okno** — `notificationService.initialize()` ([notificationService.ts:49](src/services/notifications/notificationService.ts#L49)) jen zakládá Android kanály; `requestPermissions()` ([:94](src/services/notifications/notificationService.ts#L94)) volá jedině obrazovka Nastavení. Uživatel si oznámení zapíná sám → do pipeline nepatří.
- Tři nezávislá místa dnes: ATT v `useFirebaseAnalytics` ([:52+](src/hooks/useFirebaseAnalytics.ts)), UMP v `initializeAdsWithConsent` ([adConsentService.ts:43](src/services/adConsentService.ts#L43)), tutoriál čeká přes `waitForStartupModals()` ([TutorialContext.tsx:1653](src/contexts/TutorialContext.tsx#L1653)). Orchestrator je sjednotí do jedné sekvence.
- Pozn.: tester nejspíš běžel na buildu **před** `startupGate` fixem (commit `b125cd4` ještě není v TestFlight buildu) — L1 to řeší tak jako tak a natrvalo.

**Princip** (osvědčené vzory: Apple HIG „one-at-a-time permissions", iOS Coordinator pattern, Android Jetpack App Startup, onboarding jako finite state machine, enterprise CMP):
1. **Jeden dirigent, striktně sekvenčně** — žádná dvě systémová okna paralelně; vždy zobraz → počkej na zavření → další.
2. **Naše UI je za závorou** — uvítací brána a tutoriál naskočí AŽ po vyprázdnění systémové pipeline (nahradí křehký časovač).
3. **Jedna autorita nad „je něco na obrazovce"** — pipeline splývá s existující ModalQueue: systémová okna první, naše potom, nikdy překryv.

**Co NESMÍ se rozbít**: ATT flow, UMP souhlas (+ Crashlytics zapnutí po něm), pořadí ATT→UMP, uvítací brána (jazyk/theme), tutoriál (autostart + resume), ModalQueue invariant.

---

### 🥇 ÚROVEŇ 1: Orchestrator + pipeline v kódu (kroky napevno)

**Rozsah**: nahradit dnešní 2-úkolový `startupGate.ts` obecnou sekvenční pipeline; ATT + UMP přebalit do „kroků"; tutoriál + uvítací bránu napojit na jeden signál „startup complete". Pipeline dnes drží **přesně `[att, adConsent]`** — hodnota je, že KAŽDÝ budoucí krok je jen jedna položka navíc.

> ⚠️ **KRITICKÁ PRAVIDLA (ověřeno prověrkou plánu 2026-07-14 — bez nich systém NEFUNGUJE):**
> 1. **Timeout NIKDY neobaluje interaktivní zobrazení okna.** Nativní prompt čeká na uživatele libovolně dlouho; krátký timeout přes zobrazené okno = orchestrator pokračuje a pustí tutoriál přes otevřený prompt = **přesně to zamrznutí, které řešíme**. Timeout patří JEN na neinteraktivní přípravu (síť). Zobrazené okno má jen dlouhou crash-pojistku (~5 min), ne pacing timeout (stejný princip jako `tutorialAchievementGate` 120 s).
> 2. **Reklamy + Crashlytics běží VŽDY, ne gated přes `shouldRun`.** Dnes jsou v `finally` ([adConsentService.ts:65-69](src/services/adConsentService.ts#L65)) → běží i bez formuláře. Gating jen na modalový krok by non-EEA uživatele (bez formuláře) připravil o reklamy i crash reporting.
> 3. **Zachovat pořadí ATT → zapnout analytics → app_open** (dnes záměr v [useFirebaseAnalytics.ts:68-83](src/hooks/useFirebaseAnalytics.ts#L68)). Zapnutí analytics navázat na dokončení ATT kroku.

- [x] **1.1 Typ kroku** `StartupStep` v novém `src/services/startup/types.ts`: `{ id; shouldRun(): Promise<boolean>; prepare?(): Promise<void>; present(): Promise<void>; prepTimeoutMs: number; critical?: boolean }` — **prepare/present split** (pravidlo 1 vynuceno strukturálně, ne disciplínou v každém kroku)
  - `shouldRun()` = idempotence/resume, **jen levné/lokální checky** (ATT: `Platform.OS==='ios'` && `getTrackingPermissionsAsync()==='undetermined'`; adConsent: **triviálně `true`** — `present()` si interně zobrazí formulář jen když je potřeba)
  - `prepare?()` = **neinteraktivní** příprava (síť), kterou orchestrator obalí `prepTimeoutMs` (fail-open: timeout/chyba → modal se přeskočí, sekvence jede dál). Bez UI.
  - `present()` = zobraz okno a **await na zavření uživatelem BEZ krátkého timeoutu** (u UMP vč. „Manage options"/partneři); jen dlouhá crash-pojistka (~5 min) na zaseknuté SDK
  - `prepTimeoutMs` = timeout **jen na `prepare()`**; `critical=false` default
- [x] **1.2 Nový `src/services/startup/startupOrchestrator.ts`** — nahrazuje `src/utils/startupGate.ts` (celý)
  - Drží `pipeline: StartupStep[] = [attStep, adConsentStep]`
  - `runStartupSequence()`: nejdřív **app-ready gate** (fonty ✓ · DB ✓ · `AppState.currentState==='active'` · po prvním snímku via `InteractionManager`/`requestAnimationFrame`), pak `for (const step of pipeline)` → `if (await step.shouldRun()) await step.present()` **striktně za sebou**. Timeout si řídí `present()` sám JEN na přípravné fázi (viz pravidlo 1)
  - Po doběhnutí nastaví latching flag + rozresolvuje čekatele → veřejné **`awaitStartupComplete(): Promise<void>`** (bariéra s pamětí — listener nezmešká, i když se přihlásí až po doběhnutí)
  - Guard proti dvojímu spuštění (StrictMode/re-mount)
- [x] **1.3 `src/services/startup/steps/attStep.ts`** — vytáhnout logiku z `useFirebaseAnalytics.handleATTPermission` ([useFirebaseAnalytics.ts:93](src/hooks/useFirebaseAnalytics.ts#L93)). `present()` čeká na odpověď (bez timeoutu). Hook si nechá Analytics instance, ale **ATT prompt spouští orchestrator**; **zapnutí analytics + `app_open` se přesune AŽ za dokončení ATT kroku** (pravidlo 3) — hook počká na `awaitAttComplete()` z orchestratoru, nebo to spustí orchestrator po att kroku. Odstranit `markStartupTaskComplete('att')` (řl. 75/92)
- [x] **1.4 `src/services/startup/steps/adConsentStep.ts`** — modalová část z `initializeAdsWithConsent`: `present()` = `requestInfoUpdate` (s `prepTimeoutMs`) + `loadAndShowConsentFormIfRequired` (bez timeoutu, čeká na uživatele vč. „Manage options"). Pořadí ATT→UMP je dané pozicí v poli (`waitForATT()` smazat). `showPrivacyOptionsForm()` beze změny (Settings)
- [x] **1.4b Bezpodmínečná startovní práce** (pravidlo 2, **NE modalový krok**) — `mobileAds().initialize()` + `CrashReportingService.enable()` běží **po consent kroku vždy**, i když byl formulář přeskočen. Buď v orchestratoru po sekvenci, nebo ve `finally` uvnitř `present()` adConsent kroku — hlavně **nikdy negated přes shouldRun**. Zachovat privacy-first pořadí (enable až po consent flow)
- [x] **1.5 Napojit v `app/_layout.tsx` → `LayoutContent`** — jedno `runStartupSequence()` místo dnešního: `useFirebaseAnalytics()` (ATT část, [:56](app/_layout.tsx)) + `useEffect(initializeAdsWithConsent)` ([:60](app/_layout.tsx)). Spustit až po `dbInitialized`. `useNotificationLifecycle` ([:52](app/_layout.tsx)) beze změny (netýká se)
- [x] **1.6 Tutoriál + uvítací brána za závorou** — `TutorialContext.autoStartTutorial` ([:1604](src/contexts/TutorialContext.tsx#L1604)): `await waitForStartupModals()` ([:1653](src/contexts/TutorialContext.tsx#L1653)) → `await awaitStartupComplete()`; import z orchestratoru. `setShowOnboardingPrefs(true)` ([:1629](src/contexts/TutorialContext.tsx#L1629)) běží až po tomto — beze změny logiky
- [x] **1.7 Smazat `src/utils/startupGate.ts`** po migraci konzumentů (dnes: TutorialContext, useFirebaseAnalytics, adConsentService) + upravit importy
- [x] **1.8 Regresní testy** `src/services/startup/__tests__/startupOrchestrator.test.ts`: (a) striktní sekvenčnost — krok B nezačne, dokud A nedoběhne; (b) idempotence — `shouldRun()===false` přeskočí (resume po force-quit); (c) **prep-timeout, NE present-timeout** — pomalá příprava vyprší a jede dál, ALE „pomalý uživatel" u zobrazeného okna sekvenci NEposune (pravidlo 1); (d) **reklamy+Crashlytics běží i když consent formulář skipnut** (pravidlo 2); (e) rozšiřitelnost — 3. mock-krok nic nerozbije; (f) `awaitStartupComplete` resolvne i pro pozdního čekatele
- [x] **1.9 Verifikace**: `tsc` 0 chyb + celá suite zelená (Node ≥ 22.5); **device re-test na čisté instalaci** (scénář testera — proklikat ATT i „Manage options" v UMP, včetně pomalého klikání)

**Nebezpečné zóny**:
- ATT `requestTrackingPermissionsAsync` **musí** běžet při `AppState==='active'` a po prvním snímku (jinak iOS prompt tiše zahodí) → app-ready gate to hlídá.
- ⛔ **Nikdy timeout přes zobrazené okno** (pravidlo 1) — nejčastější způsob, jak si tenhle systém znovu rozbít.
- Reklamy + Crashlytics **bezpodmínečně** (pravidlo 2).

**✅ Brief Review (implementováno 2026-07-14)**: Postaveno přesně dle plánu vč. všech 3 kritických pravidel. Struktura: `src/services/startup/{types,startupOrchestrator,index}.ts` + `steps/{attStep,adConsentStep}.ts`. Jádro `createStartupOrchestrator(pipeline, {waitForAppReady})` je čisté a testovatelné (bez nativních importů); wiring singleton v `index.ts`. **Pravidlo 1** zajištěno strukturálně: rozhraní `StartupStep` odděluje `prepare()` (síť, timeoutovaná) od `present()` (interaktivní, JEN 5min crash-pojistka). **Pravidlo 2**: `finalizeAdsAndDiagnostics()` (reklamy+Crashlytics) volá wiring v `_layout` po sekvenci **vždy**. **Pravidlo 3**: `initAnalyticsAfterConsent()` běží až po `runStartupSequence()`. Nativní moduly v krocích přes lazy `require()`. Smazán `startupGate.ts`. Testy: `startupOrchestrator.test.ts` (9 testů vč. „pomalý uživatel neposune sekvenci"). tsc 0 chyb, 393/393 testů (25/25 suites). **⏳ Zbývá device test** na čisté instalaci. Detaily: @implementation-history.md → „Startup Orchestrator (July 14, 2026)".

---

### 🥈 ÚROVEŇ 2: Pipeline řízená remote configem (nulové nasazování přes update)

**Rozsah**: zapnutí/pořadí/timeouty (a u „consent-only" oken i texty) registrovaných kroků přichází z **Firebase Remote Config** → nové EU okno zapneš **bez aktualizace v App Store**. Firebase `app`+`analytics`+`crashlytics` už v projektu jsou (v23.8.8); `remote-config` **není** nainstalovaný. Stavíme až po device ověření Úrovně 1.

- [ ] **2.1 Instalace** `@react-native-firebase/remote-config@^23.8.8` (sladit verzi s ostatními RNFB) → vyžádá `expo prebuild --clean` + rebuild; wrapper po vzoru `crashReportingService.ts` (bezpečný no-op v Jest/Expo Go, NIKDY neimportovat RNFB přímo)
- [ ] **2.2 Remote schéma** — versionovaný JSON: `[{ id, enabled, order, timeoutMs, critical }]`. Config **nikdy neposílá kód** — jen vybírá/řadí kroky z registru (2.3) podle `id`
- [ ] **2.3 Registr kroků** — mapa `id → StartupStep` (z Úrovně 1: `att`, `adConsent`). Orchestrator sestaví běhovou pipeline = registr ∩ remote schéma, seřazeno dle `order`. **Neznámé `id` z configu se bezpečně ignoruje** (starý build + nový config nespadne)
- [ ] **2.4 Fetch s bezpečným defaultem** — `fetchAndActivate()` s krátkým timeoutem v app-ready gate; když config nedorazí/je nevalidní → **fallback na zabudovanou pipeline z Úrovně 1** (appka se nikdy nezasekne kvůli configu). Cache dle RNFB `minimumFetchInterval`
- [ ] **2.5 „Consent-only" kroky z dat** — generický `RemoteConsentStep` (emoji/nadpis/text/tlačítka + uložení volby do AsyncStorage) plně definovatelný z configu → nové čistě souhlasové okno **bez nového buildu** (princip CMP jako OneTrust/Didomi). Vizuál = CelebrationModal standard.
  - ⚠️ **Můstek await-na-zavření**: RN `<Modal>` (na rozdíl od nativních kroků) nemá promise, který se resolvuje při zavření. `present()` musí modal zobrazit a **vrátit promise, který resolvne až po tapu na tlačítko**. Přes ModalQueue to znamená: enqueue + počkat na `closeCurrentModal`/callback daného modalu. Musí ctít ModalQueue **pinning invariant** (zobrazené čelo se nepřeřazuje) — jinak se do toho vrací dual-modal zamrznutí.
- [ ] **2.6 Telemetrie** — log které kroky proběhly/skipnuly/vypršely do Firebase (diagnostika budoucích zamrznutí u testerů) přes `crashReportingService.log()`
- [ ] **2.7 Testy**: fallback na default při nedostupném/nevalidním/prázdném configu; neznámé `id` ignorováno; změna `order`/`enabled` přes config se projeví; `RemoteConsentStep` uloží volbu a projde ModalQueue
- [ ] **2.8 Dokumentace** — nový `technical-guides:Startup-Orchestrator.md` (architektura, jak přidat krok v kódu i přes config, app-ready gate, invarianty, vazba na ModalQueue + jeho pinning pravidlo)

**Doporučení**: Úroveň 1 teď (vyřeší problém natrvalo, čistě v kódu, testovatelné). Úroveň 2 jako druhý krok po device ověření L1 — přidává hodnotu (compliance bez App Store updatu), ale i závislost na síti + nový native modul (`prebuild`), takže až na stabilním základu.

---

### ✅ Nedávno dokončeno (2026-07-14, detaily v @implementation-history.md)

- Onboarding Preferences Gate (jazyk/theme před tutoriálem) — hotovo
- First-launch freeze — koordinace ATT/UMP + tutoriál (dnešní `startupGate.ts`) — hotovo *(Úroveň 1 tohle zobecní)*
- Goals split-brain [🔴] — 7 míst četlo cíle z prázdného AsyncStorage → 8 mrtvých goal trofejí + Depth Explorer výzva; storage helpery otypovány (kořen neviditelnosti)
- Skryté chyby odhalené typováním: vyhledávání v deníku (`searchByContent` chyběl), signatura `create()`, typ parametru v xpMultiplier
- Achievement batch truncation — katalog 78 > limit 50 → 28 trofejí se nikdy nekontrolovalo
- Tutorial↔achievement handshake (`tutorialAchievementGate.ts`) — čeká na modal jen když opravdu přijde
- XP bar na Home — text vs. bar sjednoceny na škálu v rámci levelu
- ModalQueue deadlock [🔴] — zobrazené čelo fronty se přeřadilo → 2 modaly v 1 snímku; čelo je teď pinnuté
- Ověřeno: tsc 0 chyb, 384/384 testů (24/24 suites). Commit `b125cd4`.

---

## 📈 PLANNED: Meta Ads & Marketing Analytics Integration

**Goal**: Připravit SelfRise V2 pro běh marketingových kampaní na Meta Ads (Facebook + Instagram) a zároveň začít aktivně sbírat custom eventy do Firebase Analytics pro vlastní reporting.

**Background** (potvrzeno auditem 2026-05-18):
- ✅ Firebase Analytics SDK instalovaný, hook `useFirebaseAnalytics` napojený v `app/_layout.tsx`
- ✅ ATT (App Tracking Transparency) plugin + permission flow funkční
- ✅ SKAdNetwork 48 ID v `app.json` (včetně Meta `v9wttpbfk9`, `n38lu8286q`)
- ✅ AdMob bannery + rewarded ads kompletní – **nekolidují s Meta Ads akvizicí** (různý účel: AdMob = monetizace, Meta Ads = akvizice)
- ⚠️ Žádné custom eventy se zatím nelogují (kromě `app_open` a `att_permission_response`)
- ⚠️ Meta SDK (`react-native-fbsdk-next`) NENÍ nainstalovaný
- ⚠️ Premium tier NENÍ v plánu – Value Optimization eventy v Metě vynechány

---

### 🧑 Část A: Úkoly pro Petra (mimo kód)

Tyto kroky musí Petr udělat v externích nástrojích – kód na nich závisí:

- [ ] **A1. Vytvořit Meta App v Meta for Developers**
  - URL: https://developers.facebook.com/apps/
  - Type: "Consumer"
  - Spojit s bundle ID `com.petrturek.selfrise` (iOS) i Android package `com.petrturek.selfrise`
  - Zapsat si: **Meta App ID** + **Client Token** (App Settings → Basic + Advanced)
- [ ] **A2. Přidat platformy v Meta App Settings**
  - iOS: Bundle ID + App Store ID
  - Android: Package Name + Class Name `com.facebook.react.ReactActivity`
- [ ] **A3. Aktivovat App Events v Meta App Dashboardu**
  - Audience Network nepovolovat (jen pro monetizaci přes Metu – není náš případ)
- [ ] **A4. (Volitelně) Zažádat o Meta Ads MCP open beta**
  - URL: https://mcp.facebook.com/ads
  - Vyžaduje Claude Pro/Max plán
- [ ] **A5. Předat mi Meta App ID + Client Token** → odblokuje Část C

---

### 💻 Část B: Custom Eventy do Firebase (nezávislé na Metě)

Tato část má hodnotu sama o sobě – lepší interní data o chování uživatelů. Lze začít hned.

- [ ] **B1. Vytvořit `src/services/analyticsService.ts`**
  - Sjednocený eventový dispatcher (zatím jen Firebase, později paralelně i Meta)
  - Wrapper kolem `FirebaseAnalytics.logEvent` z existujícího hooku
  - Type-safe event names (TypeScript union type)
- [ ] **B2. Tier 1 eventy – Acquisition signal**
  - `complete_onboarding` – konec tutorialu (Tutorial system)
  - `create_first_habit` – první vytvořený návyk (HabitsContext)
  - `complete_first_habit` – první zaškrtnutí návyku
  - `journal_first_entry` – první zápis do deníku (GratitudeContext)
- [ ] **B3. Tier 2 eventy – Retention signal**
  - `streak_7_days` – sedmidenní streak (deník nebo návyky)
  - `streak_30_days` – třicetidenní streak
  - `goal_completed` – dokončený cíl
  - `monthly_challenge_completed` – splněná měsíční výzva
  - `achievement_unlocked` – odemčený achievement (param `achievement_id`)
- [ ] **B4. Tier 3 eventy – Monetization signal**
  - `rewarded_ad_completed` – sledování rewarded reklamy (AdMob WarmUp)
- [ ] **B5. Ověření v Firebase Console**
  - Dev build, projít tutorialem, založit návyk, zaškrtnout
  - Firebase Console → Analytics → DebugView ověří příchozí eventy

---

### 🔌 Část C: Meta SDK Integrace (blokováno Částí A)

Tato část navazuje na Část A a B. **Blokovaná dokud Petr nedodá Meta App ID + Client Token.**

- [ ] **C1. Instalace `react-native-fbsdk-next`**
  - `npm install react-native-fbsdk-next`
  - Verify kompatibilita s Expo SDK 55 + RN 0.83
- [ ] **C2. Konfigurace pluginu v `app.json`**
  - Přidat `react-native-fbsdk-next` do `plugins` s App ID a Client Tokenem
  - Nastavit `advertiserIDCollectionEnabled`, `autoLogAppEventsEnabled`, `isAutoInitEnabled`
- [x] **C3. Update `NSUserTrackingUsageDescription`** (provedeno preventivně 2026-05-18)
  - Z: "This data helps us keep the app free and show you more relevant ads."
  - Na: "We use this to measure ad performance and personalize your experience. This keeps SelfRise free for everyone."
- [ ] **C4. Rozšířit `analyticsService.ts` o Meta App Events**
  - Paralelní dispatch: jedno `Analytics.track()` → Firebase + Meta zároveň
  - Type-safe mapping interních event names na Meta standard event names
- [ ] **C5. Mapování interních eventů na Meta Standard Events**
  - `complete_onboarding` → `fb_mobile_complete_registration`
  - `create_first_habit` → `fb_mobile_content_view` (custom params)
  - `streak_7_days` → `fb_mobile_achievement_unlocked`
  - `rewarded_ad_completed` → custom event
- [ ] **C6. Expo Prebuild + Native Builds**
  - `npx expo prebuild --clean`
  - iOS test build → ověření v Meta Events Manager Test Events tool
  - Android test build → ověření v Meta Events Manager Test Events tool
- [ ] **C7. Verifikace v Meta Events Manager**
  - Test Events tool zobrazuje příchozí eventy z obou platform
  - App Dashboard → Activity Log bez chyb

---

### 📚 Část D: Dokumentace

- [ ] **D1. Vytvořit `technical-guides:Marketing-Analytics.md`**
  - Architektura `analyticsService`
  - Seznam všech eventů: kdy se triggerují, jaké parametry posílají
  - Dual-dispatch logika (Firebase + Meta)
  - ATT / SKAdNetwork pravidla a důsledky pro attribution
- [ ] **D2. Update `technical-guides:AdMob.md`**
  - Krátká sekce: AdMob (monetizace) vs Meta Ads (akvizice) – nekolidují
  - Sdílený ATT prompt – relevance pro oba systémy

---

### Surgical Scope

- ✅ Žádný stávající kód se nerozbije – jen se rozšiřuje existující `useFirebaseAnalytics` infrastruktura
- ✅ AdMob bannery + rewarded ads zůstávají beze změny
- ✅ Tutorial, Habits, Goals, Journal logika beze změny – pouze přibudou `Analytics.track()` volání na klíčových místech
- ⚠️ `app.json`: nový plugin (Část C2) + úprava ATT permission textu (C3 – hotovo)
- ⚠️ Vyžaduje `expo prebuild --clean` po C2 → reinstall na zařízeních

### Dependencies / Pořadí prací

```
Část A (Petr, externí) ─┐
                        ├─→ Část C (Meta SDK) ─→ Část D (dokumentace)
Část B (Firebase) ──────┘
```

Část B lze začít kdykoliv – je nezávislá. Část C blokovaná Částí A.

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

### Phase 1: Core Foundation - NAVIGATION & HOME SCREEN ✅ COMPLETE
*(All checkpoints completed successfully)*

### Phase 2: Habit Tracking System ✅ COMPLETE
*(Full habit creation, tracking, and management implemented)*

### Phase 3: My Journal Screen ✅ COMPLETE
*(Gratitude and self-praise system with streak tracking implemented)*

### Phase 4: Goals System ✅ COMPLETE
*(Goal creation, progress tracking, and completion system implemented)*

### Phase 5: Gamification & XP System ✅ COMPLETE
*(Complete XP earning, leveling, and achievement systems implemented)*

### Phase 6: Monthly Challenges ✅ COMPLETE
*(4-category challenge system with real-time tracking implemented)*

*(Detaily dokončených checkpointů → @implementation-history.md / @projectplan-archive.md)*

### Phase 7: Settings & User Experience

- 7.1 Daily Reminder Notifications ✅ · 7.2 Theme + Language ✅ *(detaily v archivu)*

### Phase 8: External Service Integration Preparation ✅ COMPLETE

#### Checkpoint 8.1: Firebase Configuration ✅
- [x] Firebase project setup and configuration
- [x] Firebase Analytics integration (see Phase 12)
- [x] App Tracking Transparency (ATT) for iOS

#### Checkpoint 8.2: AdMob Integration ✅
**Technical Documentation**: @technical-guides:AdMob.md
- [x] AdMob account setup and ad unit creation
- [x] Ad integration for streak recovery system
- [x] Revenue tracking and analytics

#### Checkpoint 8.3: Analytics & Local Notifications ✅
- [x] Analytics service integration (Firebase Analytics - Phase 12)
- [x] Local notification system (Checkpoint 7.1)
- [x] User engagement tracking (Firebase Analytics)

**Note**: Remote Push Notifications (FCM) moved to Future Updates - not needed for launch

### Phase 9: Testing & Quality Assurance

#### Checkpoint 9.1: Debt Recovery System Testing ⚡ ✅ COMPLETED
**Goal**: Create comprehensive test suite for debt recovery system fixes
- [x] Analyze critical bug fixes made by habit-logic-debugger agent
- [x] Review fixed calculateDebt() and requiresAdsToday() functions
- [x] Review fixed ad counting logic in DebtRecoveryModal
- [x] Create comprehensive debt recovery system test suite
- [x] Test primary bug: user with 3+ entries today shows debt = 0
- [x] Test ad counting: 1 ad watched = 1 ad credited (no double counting)
- [x] Test edge cases: debt calculation with various scenarios
- [x] Test integration: full debt payment flow end-to-end
- [x] Validate logical consistency across all debt recovery functions

**Implementation Summary**: August 2, 2025
- ✅ **Created comprehensive test suite**: 65+ automated test scenarios
- ✅ **GratitudeStorage tests**: 45 test cases covering all debt recovery logic
- ✅ **DebtRecoveryModal tests**: 20 test cases covering UI and ad counting
- ✅ **Manual testing guide**: Comprehensive testing documentation with scenarios
- ✅ **Jest configuration**: Proper test setup and npm scripts added
- ✅ **Coverage validation**: Tests validate all critical bug fixes

**Key Test Files Created**:
- `/src/services/storage/__tests__/gratitudeStorage.debtRecovery.test.ts` - Logic testing
- `/src/components/gratitude/__tests__/DebtRecoveryModal.test.tsx` - UI testing
- `DEBT_RECOVERY_TESTING_GUIDE.md` - Manual testing scenarios
- `jest.config.js` - Test configuration

**Test Commands Available**:
- `npm run test:debt-recovery` - Run debt recovery tests only
- `npm run test:debt-recovery:coverage` - Run with coverage report
- `npm test` - Run all tests

**Validation Completed**: All critical bugs are now covered by comprehensive tests ensuring:
1. Users with 3+ entries today always show debt = 0
2. Ad counting works correctly (1 ad = 1 credit)
3. Edge cases and boundary conditions handled properly
4. Integration flows work end-to-end

#### Checkpoint 9.2: XP System Testing ⚡ PENDING
**Goal**: Create comprehensive test suite for gamification/XP system

**Note**: XP system is manually tested and working correctly - this checkpoint is about creating automated test coverage.

- [ ] Install Jest and React Native Testing Library dependencies
- [ ] Create GamificationService unit tests with full coverage
- [ ] Test level calculation mathematical model accuracy
- [ ] Test XP validation and anti-spam protection systems
- [ ] Test daily limits and balance validation logic
- [ ] Test XP transaction and rollback functionality
- [ ] Create XP integration tests with storage services
- [ ] Test edge cases and error handling scenarios

#### Checkpoint 9.2: Core Feature Unit Testing
- [ ] Component testing with Jest and React Native Testing Library
- [ ] Storage service testing (HabitStorage, GratitudeStorage, GoalStorage)
- [ ] Business logic unit tests for habit tracking, streaks, calculations

#### Checkpoint 9.3: E2E Testing
- [ ] User flow testing with Detox
- [ ] Cross-platform compatibility testing
- [ ] Performance testing

#### Checkpoint 9.4: Quality Assurance
- [ ] Manual testing across different devices
- [ ] User acceptance testing
- [ ] Bug fixes and refinements

### Phase 10: App Store & Google Play Preparation

**Target Platforms**: iOS (App Store) + Android (Google Play)

#### Checkpoint 10.1: Assets & Metadata

**10.1.1: App Icons**
- [ ] Design app icon (1024x1024 master)
- [ ] Generate iOS icon set (all required sizes: 20pt - 1024pt)
- [ ] Generate Android adaptive icon (foreground + background layers)
- [ ] Test icons on both light and dark backgrounds

**10.1.2: Screenshots & Promotional Assets**
- [ ] iOS Screenshots:
  - [ ] iPhone 6.7" (Pro Max) - required
  - [ ] iPhone 6.5" (Plus) - required
  - [ ] iPad Pro 12.9" - required
  - [ ] Capture 5-10 key screens in EN/DE/ES
- [ ] Android Screenshots:
  - [ ] Phone (1080x1920 or higher)
  - [ ] 7" Tablet
  - [ ] 10" Tablet
  - [ ] Capture 4-8 key screens in EN/DE/ES
- [ ] Feature graphic for Google Play (1024x500)
- [ ] Promotional video (optional but recommended)

**10.1.3: App Descriptions & Metadata**
- [ ] App title (max 30 chars) - EN/DE/ES
- [ ] Subtitle/short description - EN/DE/ES
- [ ] Full description - EN/DE/ES
- [ ] Keywords/tags for ASO (App Store Optimization)
- [ ] Categories: Health & Fitness, Productivity
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Support URL and marketing website

**10.1.4: Legal & Compliance**
- [ ] Privacy policy (GDPR compliant)
- [ ] Terms of service
- [ ] Data handling disclosure (App Privacy Details)
- [ ] AdMob compliance documentation

#### Checkpoint 10.2: Build Configuration

**10.2.1: iOS Build Setup**
- [ ] Configure app.json/app.config.js for iOS production
- [ ] Set bundle identifier (com.yourcompany.selfrise)
- [ ] Configure version number and build number
- [ ] Setup signing certificates (Apple Developer account)
- [ ] Configure App Store Connect app record

**10.2.2: Android Build Setup**
- [ ] Configure app.json/app.config.js for Android production
- [ ] Set package name (com.yourcompany.selfrise)
- [ ] Configure versionCode and versionName
- [ ] Generate upload keystore for signing
- [ ] Configure Google Play Console app record

**10.2.3: Production Builds**
- [ ] Build iOS production .ipa with EAS Build
- [ ] Build Android production .aab with EAS Build
- [ ] Verify builds install and run correctly
- [ ] Test critical user flows on both platforms

#### Checkpoint 10.3: Beta Testing

**10.3.1: iOS Beta (TestFlight)**
- [ ] Upload build to TestFlight
- [ ] Configure beta testing groups (internal + external)
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.2: Android Beta (Google Play Internal Testing)**
- [ ] Upload build to Google Play Console
- [ ] Configure internal testing track
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.3: Beta Testing Checklist**
- [ ] Test on iOS (minimum iOS 13, test on iOS 16+)
- [ ] Test on Android (minimum Android 5, test on Android 11+)
- [ ] Test on different screen sizes (small phone, large phone, tablet)
- [ ] Test all 3 languages (EN/DE/ES)
- [ ] Test both light and dark themes
- [ ] Verify AdMob ads display correctly (test ads only)
- [ ] Verify push notifications work
- [ ] Performance testing (smooth 60fps, no lag)
- [ ] Memory leak testing (no crashes after extended use)

#### Checkpoint 10.4: Final Submission

**10.4.1: App Store Submission (iOS)**
- [ ] Complete App Store Connect metadata
- [ ] Upload final production build
- [ ] Submit for App Review
- [ ] Respond to any review feedback/rejections
- [ ] Release to App Store (manual or automatic)

**10.4.2: Google Play Submission (Android)**
- [ ] Complete Google Play Console metadata
- [ ] Upload final production build to production track
- [ ] Submit for review
- [ ] Respond to any review feedback/rejections
- [ ] Release to Google Play (staged rollout recommended)

**10.4.3: Post-Launch Monitoring**
- [ ] Monitor crash reports (first 24-48 hours critical)
- [ ] Monitor user reviews and ratings
- [ ] Monitor analytics (user acquisition, retention)
- [ ] Prepare hotfix build if critical issues found
- [ ] Plan first update (v1.1) based on user feedback

---

## ✅ Dokončené fáze (archiv)

SQLite migrace (SEKCE 1–4), Firebase Analytics + ATT (Phase 12), Tutorial Spotlight refaktoring (Skia), vyřešené Known Issues — vše hotové, detaily: @implementation-history.md a @projectplan-archive.md.

---

## 🔮 FUTURE UPDATES - Plánované funkce

### Data Export & Backup System 💾

**Priority**: Medium | **Complexity**: Medium | **Estimated**: 4-6 hours

**Goal**: Allow users to export, backup, and restore all their app data for safety and portability

**Features**:
- [ ] Export All Data - Download complete backup as JSON file
- [ ] Import Backup - Restore data from backup file
- [ ] Storage Usage Display - Show data size breakdown by category
- [ ] Auto Backup Toggle - Automatic weekly backups
- [ ] Share exported backup across apps (email, cloud storage)

**Technical Implementation**:
- ✅ Backup/restore logic already complete: `src/services/storage/backup.ts`
- ✅ UserSettings type includes `dataBackupEnabled` flag
- ⏳ Need to install: `expo-sharing`, `expo-document-picker`, `expo-file-system`
- ⏳ Need to create: DataExportModal component
- ⏳ Need to integrate: Share API and DocumentPicker for native file operations

**Export Format**:
- File extension: `.selfrise.json`
- Includes: Habits, Goals, Journal, XP data, Achievements, User Settings
- Metadata: Timestamp, app version, migration version, item counts

**User Flow**:
1. User taps "Export Data" → App creates JSON backup
2. Native share sheet opens → User can send via email, save to iCloud/Google Drive
3. User taps "Import Backup" → File picker opens
4. User selects `.selfrise.json` file → Confirmation modal warns about overwrite
5. User confirms → Data restored, success message shown

**Why postponed**:
- Theme and Language are higher priority for user experience
- Export/Backup is "safety net" feature - important but not urgent
- Requires additional native dependencies and testing

**When to implement**:
- After Checkpoint 7.2 (Theme + Language) complete
- Before Phase 10 (App Store launch) - users need backup before going live
