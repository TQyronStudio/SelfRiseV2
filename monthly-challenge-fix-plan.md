# Monthly Challenges — plán oprav z per-šablonové prověrky (2026-07-11)

Výstup hloubkové prověrky všech 14 šablon: sémantika (co výzva slibuje vs. co měří)
+ zobrazovací řetěz (Card → DetailModal → Calendar → Weekly breakdown).
Navazuje na opravu trackingu z 3.7. (implementation-history → „Monthly Challenges
Tracking Repair"). Určeno k provedení slabším modelem — postupuj přesně, po každé
opravě `npx tsc --noEmit` + celá test suita (aktuálně **342/342**).

⚠️ Před prací přečti: `technical-guides:Monthly-Challenges.md` (hlavně sekce
Production fix 0 a Calendar Color Adaptation) + `CLAUDE.md` pravidla.

---

## ✅ Co je prověřené a FUNGUJE (neopravovat)

- Tracking všech 14 klíčů (event → progress) — opraveno 3.7., kryto
  `monthlyProgressTracker.trackingKeys.test.ts` (16 testů)
- Card i DetailModal počítají progress správně (`progress[trackingKey] / target`),
  completion %, milestones, XP odměny, i18n (14/14 šablon ve 3 jazycích)
- Kalendář a weekly breakdown fungují správně pro JEDNODUCHÉ čítačové klíče
  (habits_consistency_master, bonus_hunter, reflection_expert, gratitude_guru,
  goals_completion_master)

---

## ✅ OPRAVENO 2026-07-11 (Fable) — NÁLEZ 1 [MAJOR][UI]: Kalendář + weekly breakdown mrtvé pro odvozené klíče

> Provedeno render-side receptem níže: `COMPLEX_TRACKING_KEYS_LIST` exportován
> z trackeru; `MonthlyProgressCalendar` má `getDerivedKeyDayData()` (intenzita ze
> snapshot faktů dle tabulky) + `DayData.dailyValue` pro weekly sumy;
> balance/avg používají active-days basis. tsc ✓.

**Symptom**: u výzev s odvozeným (complex) klíčem — **Perfect Month, Triple Master,
XP Champion, Balance Expert, Depth Explorer** (a částečně streak výzvy) — je celý
kalendář v detailu šedý ('none') a weekly breakdown ukazuje 0 %, přestože progress
na kartě správně roste.

**Příčina**: `MonthlyProgressCalendar.getAdaptiveActivityIntensity()` (ř. ~110)
i weekly % (ř. ~601) počítají VÝHRADNĚ ze `snapshot.dailyContributions` — a ty se
plní přes `calculateProgressIncrement`, který pro odvozené klíče vrací **0 by
design** (hodnoty počítá `recalculateComplexTrackingKeys` ze snapshot faktů).
Denní příspěvky odvozených výzev jsou proto trvale nulové.

**Recept (render-side — bezpečnější, nesahá na uložená data):**
V `MonthlyProgressCalendar.tsx` rozšiř výpočet intenzity: pokud výzva má odvozený
klíč, počítej intenzitu dne ze snapshot FAKTŮ místo contributions:

| trackingKey | Denní intenzita z snapshotu |
|---|---|
| `perfect_days` | `isPerfectDay ? 'perfect' : (xpEarnedToday > 0 ? 'some' : 'none')` |
| `triple_feature_days` | `isTripleFeatureDay ? 'perfect' : (xpEarnedToday > 0 ? 'some' : 'none')` |
| `monthly_xp_total` | poměr `xpEarnedToday / (target / početDníMěsíce)` → stávající prahy 10/51/91 % |
| `balance_score` | `xpEarnedToday > 0 ? 'good' : 'none'` (denní balance nemá smysl) |
| `avg_entry_length` | denní průměr nelze — použij `xpEarnedToday > 0 ? 'good' : 'none'` |

Snapshot fakty (`isPerfectDay`, `isTripleFeatureDay`, `xpEarnedToday`) UŽ EXISTUJÍ
v `DailyProgressSnapshot` — jen se v kalendáři nepoužívají. Stejně uprav weekly
breakdown sumaci (ř. ~601): pro odvozené klíče sčítej denní fakty (počet perfect
dnů / XP), ne contributions.

**Definice odvozených klíčů**: importuj/zrcadli `COMPLEX_TRACKING_KEYS`
z `monthlyProgressTracker.ts` (ř. ~125) — NEduplikuj ručně.

**Test**: rozšíř `monthlyProgressTracker.trackingKeys.test.ts` nebo nový UI-logic
test: snapshot s isPerfectDay=true + contributions {} → intenzita 'perfect'.

---

## ✅ OPRAVENO 2026-07-11 (Fable) — NÁLEZ 2 [MAJOR][sémantika]: Progress Champion počítá UDÁLOSTI, ne DNY

> Provedeno in-memory day-guard receptem (`calculateDailyGoalProgressIncrement`,
> vzor habit streak; undo releases day). Test rozšířen (3 eventy/den → +1; undo
> edge). NAVÍC objeven dvojí-call problém guardovaných klíčů (snapshot
> contributions = 0) → kalendář pro habit_streak_days / daily_journal_streak /
> daily_goal_progress čte deltu `cumulativeProgress` mezi snapshoty. tsc ✓, testy ✓.

**Symptom**: šablona `goals_progress_champion` (klíč `daily_goal_progress`) slibuje
„X **dnů** s pokrokem na cílech" (target ~21, měsíční cap na počet dní), ale
`calculateProgressIncrement` přičítá **+1 za každou GOAL_PROGRESS událost**.
Uživatel se 3 cíli a 3 zápisy pokroku denně splní „21 dnů" za 7 dní.

**Recept**: převeď `daily_goal_progress` na denně-deduplikovaný čítač — stejný
vzor jako `calculateHabitStreakIncrement` (in-memory `currentStreakDate` guard):
+1 jen při PRVNÍ GOAL_PROGRESS události dne, jinak 0. Pozor na undo (negativní
amount): -1 jen pokud po odečtu v daný den nezbývá žádný goal progress (zjisti
z `dailyData.goalTransactions`/snapshotu) — jinak 0.
Alternativa (robustnější, ale větší zásah): přesuň klíč mezi COMPLEX_TRACKING_KEYS
a v `recalculateComplexTrackingKeys` počítej počet snapshot dnů, kde
`dailyContributions['daily_goal_progress'] > 0` — POZOR: pak musí zůstat match
v `getRelevantRequirements` (GOAL_PROGRESS) a přibýt case do recalc switche
i do `COMPLEX_TRACKING_KEYS`. Viz pasti v handoff-blueprints.md §⚠️ bod 4.

**Test**: 3× GOAL_PROGRESS týž den → progress +1 (ne +3); další den +1; undo edge.

---

## ✅ OPRAVENO 2026-07-11 (Fable) — NÁLEZ 3 [MINOR][UI]: Balance Expert zobrazuje syrový float

> DetailModal ř. ~606: balance_score → `toFixed(2)` (obě strany zlomku). tsc ✓.

`MonthlyChallengeDetailModal.tsx` ř. ~606 renderuje `{currentProgress} /
{requirement.target}` — pro `balance_score` to je např. „0.7333333333 / 0.8".
**Recept**: formátovat podle klíče: balance_score → `value.toFixed(2)`;
ostatní beze změny.

---

## 🟡 NÁLEZ 4 [VERIFY na zařízení]: in-memory streak cache přes restart appky

`habit_streak_days` (Streak Builder) a `daily_journal_streak` (Consistency Writer)
používají in-memory statická pole trackeru (`currentStreakDate`,
`todayJournalEntriesCount`…), která restart appky vynuluje. Persistovaný progress
zůstává, ale příčítání PO restartu uprostřed dne je potřeba ověřit ručně:
1. Splň návyk (streak výzva +1) → zabij appku → spusť → splň další návyk týž den
   → progress se NESMÍ zvýšit podruhé
2. Totéž pro journal entries u Consistency Writer (star-based požadavek N/den)
Pokud se objeví dvojité počítání → recept: perzistuj denní guard do snapshotu
(kontrola `dailyContributions[klíč] > 0` v dnešním snapshotu místo in-memory flagu).

---

## 🟢 POZNÁMKY (bez akce)

- **Variety Champion**: den, kdy uživatel splní jen OPAKOVANÉ návyky (žádný nový
  unikát v týdnu), se v kalendáři ukáže jako 'none' — sémanticky obhajitelné
  („nepřibyl pokrok"), jen vědět o tom při případné stížnosti uživatele.
- **Depth Explorer**: průměrná délka může KLESAT (krátký záznam sníží průměr) —
  progress % může jít dolů. Záměr, ne bug.
- Streak výzvy v kalendáři: 1. aktivita dne = 'perfect' (denní cíl je zlomek
  <1) — přijatelné, streak den prostě JE splněný den.

## ✅ ZÁVĚREČNÁ KONTROLA A–Z (2026-07-11, Fable): našla a opravila 4. problém —
## SQLite `rowToSnapshot` vrací `cumulativeProgress: {}` (prázdné) → delta přístup
## z Fixu 2 by na produkci nefungoval. Řešení U ZDROJE: `executeAtomicProgressUpdate`
## předává snapshotu `appliedIncrements` (žádný re-compute → day-guard hodnoty se
## do contributions zapisují PRAVDIVĚ) a kalendář čte guardované klíče přímo
## z contributions (>0 = splněný den). Funguje pro JSON i legacy column path.

## STAV K 2026-07-11: Nálezy 1–3 OPRAVENY (Fable), verifikace tsc 0 + 342/342 testů.
## ZBÝVÁ: NÁLEZ 4 — ruční ověření na zařízení (restart uprostřed dne × streak/goal
## day-guardy) + vizuální kontrola kalendáře u odvozených výzev (Perfect Month ap.).
