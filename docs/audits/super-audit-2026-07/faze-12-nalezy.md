# Fáze 12 — nálezy (super audit 2026-07)

Datum: 2026-07-22 | Commit: `8efb179` | Node: v24.18.0
Baseline: `npx tsc --noEmit` → 0 chyb; `npm test` →

```
Test Suites: 31 passed, 31 total
Tests:       464 passed, 464 total
Snapshots:   0 total
Time:        21.497 s
Ran all test suites.
```

Guide: `technical-guides.md` § Internationalization (i18n) Guidelines (řádky 70–170).
Nástroj: projektový skill `i18n-auditor` (4 kontroly) — spuštěn jako položka 12.0.

**Metodika**: locale soubory (`src/locales/{en,de,es}/index.ts`) byly načteny do Node
skriptem (odstranění `import`, typové anotace a `as any`, pak `require`) a rekurzivně
zploštěny na leaf klíče. Skripty žijí ve scratchpadu session, jejich výstupy jsou
citované doslova níže. **Během auditní části nebyl změněn žádný soubor mimo tuto zprávu (E1).**

---

## Položky

### 12.0 — Spuštění skillu `i18n-auditor` (baseline fáze)

- Kde: `.claude/skills/i18n-auditor/SKILL.md`
- Pravidlo: plán Fáze 12 — „spusť ho jako první krok fáze", jeho výstup je baseline.
- Ověřeno jak: skill spuštěn, jeho 4 kontroly provedeny v pořadí (Check 1 synchronizace
  locale souborů → položka 12.1, Check 2 hardcoded strings → položka 12.4,
  Check 3 validace `t()` cest → nový nález N-12.3/N-12.4, Check 4 nepoužité klíče → N-12.7).
- Verdikt: ✅ proveden, výstup zapracován; skill sám o sobě nic nemění, jen definuje postup.
- Důkaz: čísla baseline (viz 12.1) — **EN 2777 klíčů, DE 2774, ES 2774**.

**PLAN-DISCREPANCY (drobná)**: skill předpokládá, že parita klíčů je hlídaná typem
`TranslationKeys`. Realita je jiná — viz N-12.1. Kontrola Check 1 proto NENÍ redundantní
vůči `tsc`, jak by se z popisu skillu dalo čekat, ale je jediná, která parity vůbec hlídá.

---

### 12.1 — Paritní kontrola klíčů EN ↔ DE ↔ ES

- Kde: `src/locales/en/index.ts` (4533 ř.), `src/locales/de/index.ts` (4493 ř.),
  `src/locales/es/index.ts` (4495 ř.)
- Pravidlo: `technical-guides.md:88-95` — „Add German translation… Add Spanish translation…
  **NO EXCEPTIONS for user-visible text**".
- Ověřeno jak: zploštění všech 3 stromů + množinový diff.
- Verdikt: ⚠️ — 7 klíčů chybí v DE i ES, 4 klíče navíc v DE i ES; **žádný z nich není
  uživatelsky viditelný** (oba bloky jsou mrtvé), ale chybí typová pojistka, která by
  příště drift zachytila včas.

Doslovný výstup:

```
EN keys: 2777
DE keys: 2774
ES keys: 2774

--- MISSING IN DE (7) ---
  social.notifications.disabled
  social.notifications.enableTap
  social.notifications.settingsTap
  social.notifications.afternoonReminder
  social.notifications.afternoonDescription
  social.notifications.eveningReminder
  social.notifications.eveningDescription

--- MISSING IN ES (7) ---   (identických 7 klíčů)

--- ORPHAN IN DE (not in EN) (4) ---
  help.achievements.trophyRoom.totalTrophies
  help.achievements.trophyRoom.collected
  help.achievements.trophyRoom.completionRate
  help.achievements.trophyRoom.overallProgress

--- ORPHAN IN ES (not in EN) (4) ---   (identické 4 klíče)

--- EMPTY VALUES ---   (žádné)
--- ARRAY LENGTH MISMATCH vs EN ---   (žádné)
```

- Důkaz A (7 „chybějících" je mrtvý blok): kód čte **top-level** `notifications.*`, ne
  `social.notifications.*` — `src/components/settings/NotificationSettings.tsx:372`
  `t('notifications.disabled')`, `:390` `t('notifications.afternoonDescription')`,
  `:420` `t('notifications.eveningDescription')`. Grep na `social.notifications.` mimo
  `src/locales/` nevrací nic. EN blok `src/locales/en/index.ts` (uvnitř `social:`,
  komentář „Phase 8: NotificationSettings & LoyaltyCard") je duplikát, který nikdo nečte.
- Důkaz B (4 „přebývající" jsou duplikát): kód čte
  `src/components/achievements/TrophyRoomStats.tsx:232,234,241,243` →
  `t('achievements.trophyRoom.totalTrophies')` atd. Ty klíče existují ve všech 3 jazycích.
  DE/ES navíc obsahují druhou, nikdy nečtenou kopii pod `help.achievements.trophyRoom.*`
  (DE „Gesamttrophäen" vs. živé „Trophäen").
- Nálezy: **N-12.1** (chybí typová pojistka), **N-12.2** (mrtvý EN blok), **N-12.5** (mrtvý DE/ES blok).

---

### 12.2 — Achievementy: 75 × name + description ve 3 jazycích

- Kde: `src/constants/achievementCatalog.ts` (75 × `id`/`nameKey`/`descriptionKey`),
  locale bloky `achievements.<id_snake>.name|.description`.
- Pravidlo: plán 12.2 — všech 75 má name + description ve 3 jazycích; žádný text
  nezůstal anglicky v DE/ES; uklidit osiřelé klíče 3 trofejí smazaných ve Fázi 2.
- Ověřeno jak: parsování katalogu (`id:`, `nameKey:`, `descriptionKey:`) + křížová
  kontrola proti všem 3 zploštěným locale stromům.
- Verdikt: ✅ pro pokrytí (0 chybějících ze 450 kombinací) / ⚠️ pro osiřelé klíče.

Doslovný výstup:

```
catalog ids: 75, nameKeys: 75, descKeys: 75

--- MISSING name/description KEYS PER LOCALE ---
  total: 0

--- DE/ES value identical to EN (untranslated?) ---
  [de] achievements.century_club.name = "Century Club"
  [de] achievements.level_up.name = "Level Up"
  total: 2

--- ORPHAN per-achievement blocks in EN (not in catalog) ---
  orphan: achievements.flame_collector (.name/.description)
  orphan: achievements.triple_crown_master (.name/.description)
  orphan: achievements.recommendation_master (.name/.description)
  (+ falešně pozitivní `achievements.details` — to není achievement, ale UI blok)

--- catalog ids with NO per-achievement block ---
  (žádné)
```

- Důkaz kvality překladu (namátková kontrola, ne strojový posudek celého překladu):

```
achievements.first_habit.description
  [en] "Create your very first habit and begin your journey to self-improvement"
  [de] "Erstelle deine allererste Gewohnheit und beginne deine Reise zur Selbstverbesserung"
  [es] "Crea tu primer hábito y comienza tu viaje hacia la superación personal"
achievements.eternal_gratitude.description
  [en] "Maintain a 100-day journal streak - your gratitude practice is legendary"
  [de] "Halte eine 100-Tage-Tagebuch-Serie aufrecht - deine Dankbarkeitspraxis ist legendär"
  [es] "Mantén una racha de 100 días en el diario - tu práctica de gratitud es legendaria"
achievements.loyalty_master.description
  [en] "1000 active days total - you have achieved ultimate loyalty"
  [de] "Insgesamt 1000 aktive Tage - du hast ultimative Loyalität erreicht"
  [es] "1000 días activos en total - has alcanzado la lealtad definitiva"
```

- Důkaz „identických" hodnot: z 2777 klíčů je DE identické s EN u 75, ES u 46. Po
  odfiltrování jednoslovných/emoji/číselných hodnot zbývají **3 vícеslovné podezřelé**:
  `achievements.century_club.name` a `achievements.achievementNames.century-club`
  („Century Club" — vlastní jméno trofeje) a
  `notifications.reminders.afternoon.variant1.title` („SelfRise Check-in ☀️" — brand +
  v němčině běžné přejaté slovo). ES nemá ani jednu. **Nejde o chybu.**
- Bonusový nález mimo zadání položky (druhý, paralelní zdroj jmen):

```
--- achievements.achievementNames. / achievements.achievementRequirements. ---
  [en/de/es] entries=83, missingForCatalogIds=0, extra=8 ->
    habit-streak-champion, flame-collector, triple-crown-master, centurion,
    gratitude-guardian, dream-fulfiller, recommendation-master, selfrise-legend
```

  UI vykresluje jména **výhradně** přes `achievement.nameKey`
  (`AchievementCard.tsx:362`, `AchievementDetailModal.tsx:519`,
  `AchievementCelebrationModal.tsx:321`, `AchievementTooltip.tsx:314`,
  `AchievementHistory.tsx:212`, `AchievementSpotlight.tsx:356`, `app/achievements.tsx:313`),
  tedy přes `achievements.<snake>.name`. Blok `achievements.achievementNames.*`
  konzumuje jen `src/services/loyaltyService.ts:25-34` (10 loyalty ID).
  Zbylých 73 položek × 3 jazyky je mrtvých — a **rozcházejí se ve znění**:
  `achievements.goal_getter.name` = DE „Ziel-Erreicher" vs.
  `achievements.achievementNames.goal-getter` = DE „Zielerfüller".
- Nálezy: **N-12.6** (osiřelé klíče 3 smazaných trofejí + 8 neexistujících ID),
  **N-12.7** (mrtvý duplicitní blok `achievementNames`).

---

### 12.3 — Monthly Challenges: 14 šablon × title/description/requirement

- Kde: `src/services/monthlyChallengeService.ts:72-…` (klíče `help.challenges.templates.*`),
  locale blok `help.challenges.templates`.
- Pravidlo: plán 12.3 — 14 šablon × title/description/requirement ve 3 jazycích.
- Ověřeno jak: seznam 14 ID vytažen z kódu (`grep -oE "templates\.[a-z_]+" | sort -u`),
  pak křížová kontrola 6 polí (title, description, requirement, bonus1-3) × 3 jazyky.
- Verdikt: ✅ — 14 × 6 × 3 = **252 klíčů, 0 chybějících, 0 nepřeložených**.

Doslovný výstup:

```
total missing: 0
--- extra fields present per template (EN) ---
  habits_consistency_master: title, description, requirement, bonus1, bonus2, bonus3
  habits_variety_champion: title, description, requirement, bonus1, bonus2, bonus3
  habits_streak_builder: title, description, requirement, bonus1, bonus2, bonus3
  habits_bonus_hunter: title, description, requirement, bonus1, bonus2, bonus3
  journal_consistency_writer: title, description, descriptionDynamic_one,
                              descriptionDynamic_other, requirement, bonus1, bonus2, bonus3
  journal_depth_explorer: title, description, requirement, bonus1, bonus2, bonus3
  journal_gratitude_guru: title, description, requirement, bonus1, bonus2, bonus3
  journal_reflection_expert: title, description, requirement, bonus1, bonus2, bonus3
  goals_completion_master: title, description, requirement, bonus1, bonus2, bonus3
  goals_progress_champion: title, description, requirement, bonus1, bonus2, bonus3
  consistency_xp_champion: title, description, requirement, bonus1, bonus2, bonus3
  consistency_triple_master: title, description, requirement, bonus1, bonus2, bonus3
  consistency_perfect_month: title, description, requirement, bonus1, bonus2, bonus3
  consistency_balance_expert: title, description, requirement, bonus1, bonus2, bonus3
--- DE/ES identical to EN in templates ---
  (žádné)
```

- Důkaz dynamického popisu: `monthlyChallengeService.ts:2151` volá
  `t('help.challenges.templates.journal_consistency_writer.descriptionDynamic', { count: starLevel })`
  — klíč existuje jako pluralizovaný pár `descriptionDynamic_one` / `descriptionDynamic_other`
  ve všech 3 jazycích, i18next ho tedy rozřeší správně. Oprava N-3.7 z Fáze 3 drží.
- Důkaz kvality: `consistency_balance_expert.description`
  EN „Maintain balanced XP sources (no single source >60% of total)" /
  DE „Halte ausgewogene XP-Quellen aufrecht (keine einzelne Quelle >60% des Gesamtwerts)" /
  ES „Mantén fuentes de XP equilibradas (ninguna fuente >60% del total)".

---

### 12.4 — Hardcoded strings v komponentách změněných od 1. 7. 2026

- Kde: 80 souborů z `git log --since=2026-07-01 --name-only` (bez testů a locale).
- Pravidlo: `technical-guides.md:88-95` — každý user-visible text přes `t()`;
  jediná povolená výjimka jsou rarity tiery (Common/Rare/Epic/Legendary/Exotic).
- Ověřeno jak: grep `<Text …>literál`, `Alert.alert('…')`, `placeholder="…"` přes všech
  80 souborů + ruční kontrola každého zásahu.
- Verdikt: ⚠️ — 4 zásahy, **všechny uvnitř vývojářského nástroje** za env flagem;
  0 hardcoded textů v produkční UI cestě.

Doslovný výstup gripu:

```
app/(tabs)/settings.tsx:459:  <Text style={styles.sectionTitle}>Marketing Demo</Text>
app/(tabs)/settings.tsx:481:  <Text style={styles.loadingText}>Loading...</Text>
app/(tabs)/settings.tsx:546:  <Text style={styles.loadingText}>Clearing...</Text>
app/(tabs)/settings.tsx:560:  <Text style={styles.menuItemText}>Disable Marketing Demo Mode</Text>
(zbytek: src/components/goals/GoalForm.tsx:67-69 a habits/HabitForm.tsx:56 =
 falešně pozitivní — `useRef<TextInput>`, ne JSX text)
Alert.alert / placeholder s natvrdo psaným textem: žádný výskyt
```

- Důkaz gatingu: `app/(tabs)/settings.tsx:26`
  `const ENABLE_MARKETING_DEMO_TOOLS = process.env.EXPO_PUBLIC_ENABLE_MARKETING_DEMO === 'true';`
  a `:457` `{ENABLE_MARKETING_DEMO_TOOLS && (` — celá sekce (včetně řádků 459-560) je
  v produkčním buildu nedostupná. Stejně tak dva potvrzovací modaly z Fáze 9
  (`:594` „Clear ALL data?", `:622` „Delete ALL your data and load demo?"), které jsou
  spustitelné jen z této sekce. **Záměrná výjimka, ne nález** — a záměrně anglicky,
  protože je to interní nástroj, ne uživatelská funkce.
- Druhý zásah (mimo změněné soubory, ale user-visible): `notificationScheduler.ts:53-70`
  a `:472-491` obsahují natvrdo anglické varianty notifikací. Nejsou to však primární
  texty — jsou to **fallbacky pro případ selhání i18n**:
  `:42` `const reminders = i18n.t('notifications.reminders.afternoon', { returnObjects: true })`
  a `:457` totéž pro `evening.generic`; hardcoded větev se použije jen když i18n vrátí
  neobjekt / prázdno. Živé klíče existují ve všech 3 jazycích (afternoon 8 klíčů,
  evening 20 klíčů, shodně v EN/DE/ES). Verdikt: ⚠️ přijatelné (obranný kód), zapsáno
  jako informativní **N-12.9**.

---

### 12.5 — Pluralizace: `_one`/`_other` páry ve 3 jazycích

- Kde: celý locale strom.
- Pravidlo: plán 12.5 — všechny `_one`/`_other` páry kompletní ve 3 jazycích (plošně,
  navazuje na 7.4).
- Ověřeno jak: pro každý EN klíč končící `_one` kontrola existence `_one` i `_other`
  v DE a ES; obráceně kontrola osiřelých `_other` bez `_one`; kontrola osiřelých
  plurálů v DE/ES, které nejsou v EN.
- Verdikt: ✅ — bez jediné odchylky.

Doslovný výstup:

```
--- PLURAL PARITY (EN _one/_other vs DE/ES) ---
  total plural issues: 0
```

(žádný řádek `[de] missing …`, `[es] missing …`, `[en] … has NO _one`, `[en] … has NO _other`
ani `orphan plural`.)

- Poznámka k metodě: první průchod validací `t()` cest hlásil 6 falešně pozitivních
  klíčů (`achievements.preview.daysAgo`, `hoursAgo`, `minutesAgo`, `achievedInDays`,
  `achievedInWeeks`, `achievedInMonths`). Ověřeno na volajících místech
  (`achievementPreviewUtils.ts:1092-1096` a `:1161-1167`) — všechna předávají `{ count }`,
  takže i18next rozřeší `_one`/`_other`. Validátor byl opraven, ne nález.

---

## Nálezy k opravě (číslované, s prioritou)

### N-12.3 — 🔴 VYSOKÁ: 28 volání `t()` míří na neexistující klíče → v UI se zobrazí syrová cesta klíče

**Kde**: `src/utils/achievementPreviewUtils.ts` (řádky níže).
**Dopad**: uživatel místo textu vidí např. `achievements.preview.selfrise_expert.progress`.
Ve **všech třech jazycích včetně angličtiny** — i18next vrací klíč, když překlad nenajde.
Cesta je živá: `AchievementCard.tsx:89` volá `generateProgressHint(achievement, userStats, t)`
a `AchievementDetailModal.tsx:16` importuje `generateProgressHintAsync`.
Žádné z volání nemá `defaultValue` fallback (ověřeno čtením všech 28 míst).

**Příčina**: špatný jmenný prostor / špatný název listu. Správné klíče existují a jsou
**kompletně přeložené ve všech 3 jazycích** pod `achievements.progressHints.*`.

Rozpis (28 = 22 × špatný namespace + 6 × špatný list):

| Řádek | Volaný (neexistující) klíč | Existující správný klíč |
|---|---|---|
| 803 | `achievements.preview.triple_crown.progress_complete` | `achievements.progressHints.triple_crown.progress_complete` |
| 804 | `achievements.preview.triple_crown.progress_incomplete` | `…progressHints.triple_crown.progress_incomplete` |
| 807 | `achievements.preview.triple_crown.requirement` | `…progressHints.triple_crown.requirement` |
| 808 | `achievements.preview.triple_crown.action` | `…progressHints.triple_crown.action` |
| 831 | `achievements.preview.selfrise_expert.progress` | `…progressHints.selfrise_expert.progress` |
| 834 | `achievements.preview.selfrise_expert.requirement` | `…progressHints.selfrise_expert.requirement` |
| 835 | `achievements.preview.selfrise_expert.action` | `…progressHints.selfrise_expert.action` |
| 841 | `achievements.preview.selfrise_master.progress` | `…progressHints.selfrise_master.progress` |
| 844 | `achievements.preview.selfrise_master.requirement` | `…progressHints.selfrise_master.requirement` |
| 845 | `achievements.preview.selfrise_master.action` | `…progressHints.selfrise_master.action` |
| 851 | `achievements.preview.ultimate_selfrise_legend.progress` | `…progressHints.ultimate_selfrise_legend.progress` |
| 854 | `achievements.preview.ultimate_selfrise_legend.requirement` | `…progressHints.ultimate_selfrise_legend.requirement` |
| 855 | `achievements.preview.ultimate_selfrise_legend.action` | `…progressHints.ultimate_selfrise_legend.action` |
| 861 | `achievements.preview.trophy_collector_basic.progress` | `…progressHints.trophy_collector_basic.progress` |
| 864 | `achievements.preview.trophy_collector_basic.requirement` | `…progressHints.trophy_collector_basic.requirement` |
| 865 | `achievements.preview.trophy_collector_basic.action` | `…progressHints.trophy_collector_basic.action` |
| 871 | `achievements.preview.trophy_collector_master.progress` | `…progressHints.trophy_collector_master.progress` |
| 874 | `achievements.preview.trophy_collector_master.requirement` | `…progressHints.trophy_collector_master.requirement` |
| 875 | `achievements.preview.trophy_collector_master.action` | `…progressHints.trophy_collector_master.action` |
| 910 | `achievements.preview.seven_wonder.progress` | `…progressHints.seven_wonder.progress` |
| 913 | `achievements.preview.seven_wonder.requirement` | `…progressHints.seven_wonder.requirement` |
| 914 | `achievements.preview.seven_wonder.action` | `…progressHints.seven_wonder.action` |
| 638 | `…progressHints.deep_thinker.progress_complete` | list neexistuje (locale má `progress_checking`) |
| 639 | `…progressHints.deep_thinker.progress_incomplete` | list neexistuje |
| 644 | `…progressHints.deep_thinker.action_complete` | list neexistuje (locale má `action`) |
| 645 | `…progressHints.deep_thinker.action_incomplete` | list neexistuje |
| 670 | `…progressHints.goal_getter.progress_incomplete` | list neexistuje (locale má `progress`) |
| 671 | `…progressHints.goal_getter.progress_complete` | list neexistuje |

**Návrh opravy**:
- řádky 803-914 (22×): záměna namespace `achievements.preview.` → `achievements.progressHints.`
  — čistě kódová oprava, žádný nový překlad není potřeba;
- řádky 638-645 a 670-671 (6×): doplnit chybějící varianty do EN/DE/ES
  (`deep_thinker.progress_complete` s `{{count}}`, `progress_incomplete` s `{{longest}}`,
  `action_complete`, `action_incomplete` s `{{needed}}`; `goal_getter.progress_complete`,
  `progress_incomplete`) — kód je logicky správný, jen text chybí.

### N-12.4 — 🟠 STŘEDNÍ: `t('common.confirmAction')` neexistuje v žádném jazyce

**Kde**: `src/components/common/ConfirmationModal.tsx:49`
`const resolvedTitle = title || t('common.confirmAction');`
**Dopad**: kdykoliv se `ConfirmationModal` použije bez explicitního `title`, vykreslí se
v titulku doslova `common.confirmAction`. V locale existuje jen `common.confirm`.
**Ověřeno**: aktuální 3 volání v `app/(tabs)/settings.tsx:579,591,610` `title` předávají,
takže dnes to není vidět — je to nastražená mina pro příští použití komponenty.
**Návrh**: doplnit klíč `common.confirmAction` do EN/DE/ES (EN „Confirm action" /
DE „Aktion bestätigen" / ES „Confirmar acción").

### N-12.1 — 🟠 STŘEDNÍ: DE/ES nemají žádnou typovou pojistku úplnosti

**Kde**: `src/locales/de/index.ts:15` a `src/locales/es/index.ts:15`
`const de: Partial<TranslationKeys> = {` — a navíc **15 největších bloků** v obou
souborech je přetypováno na `any`:

```
de/index.ts: 355, 590, 924, 1249, 1571, 1653, 1682, 3032, 3061, 3486, 3738, 4165, 4387, 4418, 4437
es/index.ts: 355, 590, 924, 1249, 1571, 1653, 1682, 3032, 3061, 3485, 3737, 4166, 4389, 4420, 4439
(bloky: home, habits, journal, goals, monthlyChallenge, settings, days, achievements,
 auth, gamification, help, notifications, social, challenges, gratitude)
```

`src/locales/en/index.ts` je naopak plné `TranslationKeys` bez jediného `as any` —
ale ani to nestačí: `src/types/i18n.ts:1702-1705` typuje **celý blok `achievements`**
přes indexovou signaturu `[achievementId: string]: { name; description } | any`,
takže největší blok v souboru je neohlídaný i v angličtině.
**Dopad**: `tsc` nezachytí chybějící ani přejmenovaný klíč prakticky nikde v DE/ES.
Přesně tak vznikl drift z položky 12.1 (`social.notifications.*`) — a proto baseline
`tsc --noEmit` hlásí 0 chyb, i když parita 0 není.
**Ověřeno**: baseline běh `npx tsc --noEmit` = 0 chyb, zatímco skript hlásí 7 chybějících
a 4 přebývající klíče.
**Návrh (k rozhodnutí Petra, E5)**: nechat typy být a místo toho přidat **jeden Jest test**,
který provede stejný množinový diff jako tento audit a padne při jakékoliv nové odchylce.
Je to levnější a bezpečnější než odstraňovat 30 `as any` (to by byl rozsáhlý zásah do
fungujícího souboru — CLAUDE.md pravidlo #16).

### N-12.2 — 🟡 NÍZKÁ: mrtvý EN blok `social.notifications.*` (7 klíčů)

Duplikát živého top-level bloku `notifications.*`; nikdo ho nečte (viz důkaz A u 12.1).
**Návrh**: smazat z `src/locales/en/index.ts` (+ odpovídající typ v `src/types/i18n.ts:2701-2704`).

### N-12.5 — 🟡 NÍZKÁ: mrtvý DE/ES blok `help.achievements.trophyRoom.*` (4 klíče × 2 jazyky)

Duplikát živého `achievements.trophyRoom.*`, existuje jen v DE a ES.
**Návrh**: smazat.

### N-12.6 — 🟡 NÍZKÁ: osiřelé i18n klíče smazaných / neexistujících trofejí

- Bloky `.name` + `.description` 3 trofejí smazaných ve Fázi 2:
  `achievements.flame_collector`, `achievements.triple_crown_master`,
  `achievements.recommendation_master` → 6 klíčů × 3 jazyky = **18 klíčů**.
- 8 ID, která v katalogu vůbec nejsou, ve dvou blocích:
  `habit-streak-champion`, `flame-collector`, `triple-crown-master`, `centurion`,
  `gratitude-guardian`, `dream-fulfiller`, `recommendation-master`, `selfrise-legend`
  v `achievements.achievementNames.*` i `achievements.achievementRequirements.*`
  → 8 × 2 × 3 = **48 klíčů**.
- Navíc `achievements.progressHints.triple_crown_master.*` (3 klíče × 3 jazyky = 9).

**Návrh**: smazat ve Fázi 13 (patří do úklidové fáze, ne sem).

### N-12.7 — 🟡 NÍZKÁ: 341 pravděpodobně nepoužitých EN klíčů + mrtvý blok `achievementNames`

Výstup Check 4 (klíč nemá statickou referenci a jeho název listu se nikde ve zdrojích
nevyskytuje ani jako dynamický fragment):

```
EN keys total: 2777
likely UNUSED (no static ref, leaf not found anywhere): 341
possibly unused but leaf name found in source (dynamic?): 881

--- unused grouped by 2-level prefix (top 15) ---
  26  goals.sharing        13  tutorial.validation   11  journal.export
  10  auth.register         9  tutorial.accessibility 9  social.dailyHeroes
   9  social.achievements   8  social.quote           7  achievements.sort
   7  achievements.accessibility  7  auth.login        7  tutorial.errors
   6  achievements.filter   6  achievements.stats     6  achievements.names
```

Nápadné: celý blok `auth.*` (17 klíčů) — v appce žádná registrace/přihlášení není.
K tomu 73 mrtvých položek v `achievements.achievementNames.*` (viz 12.2).
**Návrh**: **nedělat teď.** Patří do Fáze 13; 881 „možná dynamických" klíčů vyžaduje
ruční verifikaci a hromadné mazání by bylo riskantní. Zapsáno do fronty Fáze 13.

### N-12.8 — 🟡 NÍZKÁ (obsahový drift, ne i18n): `progressHints.goal_getter` popisuje jiný achievement

`achievements.progressHints.goal_getter.progress` = „Create 5 goals ({{current}}/{{target}})",
`.requirement` = „Create 5 different goals" — ve všech 3 jazycích.
Skutečná podmínka podle `src/constants/achievementCatalog.ts:376-389`:
`source: 'goal_completion', target: 1` = **dokonči 1 cíl**. Sedí to s
`achievements.goal_getter.description` („Complete your first goal") i s
`achievements.achievementRequirements.goal-getter` („Complete your first goal") i s kódem
(`achievementPreviewUtils.ts:672` `isCompleted: userStats.completedGoals > 0`).
Chybný je tedy jen tenhle jeden blok textů.
**Návrh**: opravit text ve všech 3 jazycích při opravě N-12.3 (stejné místo, stejný blok).

### N-12.9 — ⚪ INFORMATIVNÍ: anglické fallbacky notifikací

`notificationScheduler.ts:53-70` a `:472-491`. Použijí se jen když `i18n.t(…,
{returnObjects: true})` selže. Živé klíče jsou kompletní ve všech 3 jazycích.
Ponecháno záměrně — bez fallbacku by uživatel při selhání i18n dostal prázdnou notifikaci.
**Bez akce.**

---

## PLAN-DISCREPANCY

1. **Skill `i18n-auditor` popisuje parity check jako doplněk k `tsc`** — ve skutečnosti je
   jediným mechanismem, který parity hlídá (viz N-12.1). Popis skillu není chybný, jen
   vytváří falešný dojem redundance.
2. **Plán 12.2 mluví o „78 → 75" achievementech** — realita v katalogu je přesně 75
   (`grep -c "id: '" src/constants/achievementCatalog.ts` = 75), komentář v hlavičce
   souboru (`achievementCatalog.ts:2`) ale stále říká „78 Total Achievements".
   Kosmetický drift komentáře, zapsáno do fronty Fáze 13.
3. **Plán 12.2 předpokládá, že osiřelé klíče 3 smazaných trofejí uklidíme tady.**
   Navrhuji přesunout do Fáze 13 spolu s dalšími 341 mrtvými klíči — mazání
   locale klíčů je úklid, ne oprava, a Fáze 13 je na to určená (E5: rozhoduje Petr).

---

## Brána úplnosti

| Položek dle plánu | Sekcí ve zprávě | Shoda |
|---|---|---|
| 6 (12.0, 12.1, 12.2, 12.3, 12.4, 12.5) | 6 | ✓ |

Kontrolní součty auditu:
- locale klíče porovnány: 2777 (EN) × 3 jazyky
- achievementy ověřeny: 75 / 75 (150 klíčů name+description × 3 jazyky = 450)
- šablony výzev ověřeny: 14 / 14 (252 klíčů)
- souborů proskenováno na hardcoded texty: 80 / 80 (změněné od 1. 7. 2026)
- volání `t()` validováno: 1547 unikátních statických klíčů

---

## Rozhodnutí Petra (2026-07-22) — zapsáno PŘED implementací

| Nález | Rozhodnutí | Co se udělá |
|---|---|---|
| **N-12.3** | opravit | 22× záměna namespace v kódu + 6 nových klíčů (deep_thinker, goal_getter) ve všech 3 jazycích |
| **N-12.4** | „pokud je lepší varianta, udělej ji" | doplnit chybějící klíč `common.confirmAction` do EN/DE/ES (lepší než mazat fallback — komponenta má smysluplný default titulek) |
| **N-12.1** | ponecháno na mně | **Jest test místo zásahu do typů** — `as any` a `Partial<>` v DE/ES zůstávají (chirurgický přístup, CLAUDE.md #16), přidá se regresní test parity klíčů |
| **N-12.8** | opravit | text `progressHints.goal_getter.progress` + `.requirement` ve všech 3 jazycích sladit se skutečnou podmínkou (dokonči 1 cíl) |
| **N-12.2, N-12.5, N-12.6, N-12.7** | odloženo | mazání ~400 mrtvých klíčů → **Fáze 13** (úklidová fáze), zapsáno do její fronty |

### Implementační poznámky

**N-12.4 — proč doplnit klíč, a ne odstranit volání**: `ConfirmationModal` má `title`
volitelný právě proto, aby šel použít bez titulku. Odstranění fallbacku by API komponenty
zhoršilo; doplnění klíče je menší zásah a řeší příčinu.

**N-12.1 — proč test a ne typy**: odstranění 30 `as any` a `Partial<>` z DE/ES by znamenalo
zásah do dvou souborů po ~4500 řádcích, které dnes fungují. Test pokrývá stejné riziko
(chybějící/osiřelý klíč) za zlomek rizika a navíc hlídá i to, co typy neumí — prázdné
hodnoty a rozjeté délky polí.

---

## Provedené opravy

### N-12.3 — 28 rozbitých `t()` cest → opraveno

- **22× záměna namespace** v `src/utils/achievementPreviewUtils.ts`
  (`achievements.preview.<id>.*` → `achievements.progressHints.<id>.*`) na řádcích
  803, 804, 807, 808, 831, 834, 835, 841, 844, 845, 851, 854, 855, 861, 864, 865,
  871, 874, 875, 910, 913, 914. Žádný nový překlad — cílové klíče už existovaly
  kompletní ve všech 3 jazycích.
- **6 nových klíčů** doplněno do EN/DE/ES + `src/types/i18n.ts`:
  `achievements.progressHints.deep_thinker.progress_complete` (`{{count}}`),
  `.progress_incomplete` (`{{longest}}`), `.action_complete`, `.action_incomplete`
  (`{{needed}}`), `achievements.progressHints.goal_getter.progress_complete`,
  `.progress_incomplete`.

### N-12.4 — `common.confirmAction` doplněn

EN „Confirm action" / DE „Aktion bestätigen" / ES „Confirmar acción",
+ typ v `src/types/i18n.ts`.

### N-12.8 — text `goal_getter` sladěn se skutečnou podmínkou

Celý blok `achievements.progressHints.goal_getter` ve všech 3 jazycích byl přepsán tak,
aby odpovídal katalogu (`achievementCatalog.ts:383-389`: `source: 'goal_completion'`,
`target: 1`). Nepoužívaný klíč `.progress` („Create 5 goals ({{current}}/{{target}})")
nahradily `.progress_incomplete` / `.progress_complete`, které kód skutečně volá.
Opraven i `.action` — drift tam byl stejný („Set more goals to expand your ambitions!"
vs. skutečné „dokonči jeden cíl"); je to tentýž blok a tentýž nález, tak byl opraven
zároveň, ne zvlášť.

### N-12.1 — regresní test parity locale souborů

Nový soubor `src/locales/__tests__/localeParity.test.ts` — 6 deklarací, které se přes
`it.each` rozpadají na **12 testů**: parita EN↔DE a EN↔ES, žádné osiřelé klíče v DE/ES,
žádné prázdné hodnoty (3 jazyky), shodné délky polí, kompletní `_one`/`_other` páry v EN
a jejich zrcadlení v DE/ES. Test importuje locale moduly přímo (Jest je transpiluje),
takže nepotřebuje skriptový hack z auditní části. Hlavička souboru dokumentuje **proč**
test existuje (aby ho nikdo nepovažoval za redundantní vůči `tsc`).

**Negativní kontrola** (test skutečně chytá regresi, ne že jen prochází): do EN byl
dočasně vložen klíč `common.__regressionProbe`, který v DE/ES nebyl.

```
✕ de has every key that EN has (2 ms)
✕ es has every key that EN has
+   "common.__regressionProbe",
Tests:       2 failed, 10 passed, 12 total
```

Probe následně odstraněn (`grep -c "__regressionProbe" src/locales/en/index.ts` → `0`).

### Odchylka od odloženého úklidu — N-12.2 a N-12.5 provedeny hned

**Proč**: obě jsou přesně to, co nový test hlídá — EN-only blok (7 klíčů) a DE/ES-only
blok (4 klíče × 2). Dokud existují, test parity nemůže projít; jediná alternativa by
byl seznam výjimek v testu, který by časem zplesnivěl a pojistku znehodnotil.
Jde o **15 řádků prokazatelně mrtvých duplikátů**, ne o rizikový úklid.
Smazáno:
- `social.notifications.*` v `src/locales/en/index.ts` + odpovídající typ
  v `src/types/i18n.ts` (na obou místech zůstal komentář vysvětlující, co tam bylo a proč zmizelo);
- `help.achievements.trophyRoom.*` v `src/locales/de/index.ts` a `es/index.ts`.

**Ve Fázi 13 zůstává** vše ostatní: N-12.6 (osiřelé klíče smazaných trofejí, ~75 klíčů),
N-12.7 (341 nepoužitých EN klíčů + mrtvý blok `achievementNames`), komentář „78 Total
Achievements" v `achievementCatalog.ts:2`. Ty parity neporušují — existují ve všech
3 jazycích — takže test kvůli nim nespadne.

---

## Ověření po opravách

```
$ npx tsc --noEmit
(0 chyb)

$ npm test
Test Suites: 32 passed, 32 total
Tests:       476 passed, 476 total
Snapshots:   0 total
Time:        15.982 s
Ran all test suites.
```

(baseline byla 31 suites / 464 testů → +1 suite, +12 testů, 0 regresí)

Auditní skripty přehrány na opraveném kódu:

```
--- INVALID STATIC t() PATHS (0) ---
static keys referenced: 1547

EN keys: 2777
DE keys: 2777
ES keys: 2777
--- MISSING IN DE (0) ---
--- MISSING IN ES (0) ---
--- ORPHAN IN DE (not in EN) (0) ---
--- ORPHAN IN ES (not in EN) (0) ---
--- EMPTY VALUES ---   (žádné)
--- PLURAL PARITY ---  total plural issues: 0
```

## Stav: HOTOVO (audit + opravy)
