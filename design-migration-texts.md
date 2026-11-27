# Soupis textů převodu – etapy E5 až E16

Tenhle dokument je krok 2 postupu etapy (`design-migration-plan.md`, kap. 0.2 a 7.1): ke každé etapě E5–E16 vypisuje texty, které převedená obrazovka ukáže, ve třech jazycích EN / DE / ES.
**Od 2026-11-24 rozhoduje drobnosti Claude** (Petr: „rozhodni sám s vědomím, že cílíš na TOP 5 %“) – texty jdou do `src/locales/{en,de,es}/index.ts` a `src/types/i18n.ts` v etapě, která je ukáže; Petr je vidí na telefonu a může cokoliv zvrátit. Všechna rozhodnutí otázek jsou v oddílu **Rozhodnutí otázek** níže. Tabulka A = nové klíče, tabulka B = laboratoř použije klíč, který appka už má (ověřeno ve všech třech jazycích); kulisy laboratoře (její lišta, scénáře „Lab ·“, přepínače situací, `MOCK_STATS`, ukázková jména) se nepřevádějí a nejsou tu.
EN a DE jsou opsané doslova z `src/screens/design-lab/mockCopy.ts` (nebo z textu natvrdo v souboru laboratoře); ES chybí v laboratoři všude, takže je celé můj návrh (tykání, slovník appky: Hábitos, Mi Diario, Metas, racha, hito, desafío, logro/trofeo, Nivel, En pausa, Recuperado).
Legenda: ***návrh*** = text navrhuji já, laboratoř ho v tom jazyce nemá · ***odvozeno*** = tvar jednotného čísla dopočítaný k textu laboratoře kvůli pravidlu `_one`/`_other` · ⚠ DE = německý text výrazně delší než EN (hlídat zalomení).

**Společné konvence pro všechny etapy**

- Množné číslo: i18next potřebuje parametr `count`. Proto mají klíče s množným číslem `{{count}}` místo pojmenovaného čísla z laboratoře a každý tvar má vlastní řádek (`_one`, `_other`).
- Násobič má v laboratoři dvě podoby parametru: `{{factor}}` = **už vytištěný faktor se znakem „ד** („2ד, „1,5ד – `formatFactor`), nebo `{{factor}}` = **holé číslo** a znak × je v textu („{{factor}}× XP“). U každého klíče to stojí v poznámce. Sjednocení je otázka pro Petra (viz E9).
- Datum, dny v týdnu a měsíc tiskne `toLocaleDateString` s jazykem z existujícího klíče `common.locale` (en-US / de-DE / es-ES) – bez vlastních klíčů.
- Čísla s oddělovačem tisíců („4 205“) dělá formátování čísla, ne text.
- Texty, které laboratoř skládá z několika kusů jen pro čtečku obrazovky (např. „Level 16. Ember. 237 XP to Level 17“), nemají vlastní klíč – skládají se v kódu z klíčů níže.

---

## Rozhodnutí otázek (2026-11-24)

E5 a E6 rozhodl Petr (2026-11-23/24), E7–E16 Claude podle pravidla „drobnosti rozhoduj sám, cíl TOP 5 %“.
Každé rozhodnutí lze zvrátit – stačí říct.

**E5 (Petr):** 1 „Routine(n)“ všude v DE · 2 větný styl v EN v převáděných místech · 3 tvar `_zero` („Paused today“) ·
4 „⋯“ i u pozastaveného návyku, řádek ukáže „Resume“ · 5 čip = XP za návyky dnes (`getTodayHabitXP()`) · 6 jen přepsat větu.

**E6 (Petr):** 1 nápověda podle nového značení (kroužek + závorka) – i živá `help.habits.makeupFunction` („zlatá fajfka“ pryč) ·
2 jen jedna karta pravidla · 3 jedno slovo „Scheduled“ · 4 jména 8 barev hned · 5 „Edit habit“ / „Save“ · 6 DE „Neu ordnen“.
✅ **Texty E6 v locales 2026-11-24** (hlídá `src/locales/__tests__/habitsDetailCopy.test.ts`). Jedna karta = zůstává tiché „i“
s oknem pravidla (`help.rules.makeUp`, jeden zdroj s E22, plán 7.10); karta `habits.detail.explainTitle/Body` se nezakládá.
Nadpis úpravy `habits.composer.editTitle` („Edit habit“ větou), tlačítko existující `common.save`.

**E7.** 1 DE zůstává „LEVEL UP“ (appka říká „Level“), ES „NUEVO NIVEL · 16“ – „LEVEL UP“ ve španělské appce nikde není.

**E8** (✅ v locales 2026-11-24, test `momentsCopy.test.ts`). 1 DE všude **„Trophäenhalle“** (= laboratoř, kterou Petr schválil); záložka zůstává krátká „Trophäen“.
2 Nadpisy `rarity_*` přepsat na trofej („Epic trophy!“ / „Epische Trophäe!“ / „¡Trofeo épico!“) – jedno slovo pro jednu věc
v oznámení i v okně.

**E9** (✅ v locales 2026-11-24 vč. 20 hodností `gamification.levels.rank.*`, test `levelsCopy.test.ts`). 1 **Přeložit** hodnosti – je jich jen 20 (×5 římských číslic), ne 100. Nové klíče `levels.rank.<id>`:
Novice/Novize/Novato · Beginner/Anfänger/Principiante · Learner/Lernender/Estudiante · Apprentice/Lehrling/Aprendiz ·
Adept/Adept/Adepto · Seeker/Sucher/Buscador · Adventurer/Abenteurer/Aventurero · Practitioner/Praktiker/Practicante ·
Pathfinder/Pfadfinder/Explorador · Specialist/Spezialist/Especialista · Veteran/Veteran/Veterano · Expert/Experte/Experto ·
Guardian/Wächter/Guardián · Warden/Hüter/Custodio · Challenger/Herausforderer/Retador · Master/Meister/Maestro ·
Elite/Elite/Élite · Champion/Champion/Campeón · Grandmaster/Großmeister/Gran maestro · Mythic/Mythos/Mítico.
Římská číslice se přidá v kódu; `getLevelInfo().title` zůstane anglicky jako interní klíč. Proč: TOP appky lokalizují vše,
co uživatel vidí, a anglické hodnosti v DE/ES jsou nejviditelnější místo celé gamifikace.
2 Ano, vlastní krátké „Habits / Journal / Goals“ (DE „Routinen / Tagebuch / Ziele“, ES „Hábitos / Diario / Metas“).
3 Faktor **číslem** z `XP_MULTIPLIERS` přes `formatFactor` – text nesmí lhát po změně konstanty.
4 ES neutrálně: „¡Hola de nuevo!“ místo „¡Bienvenido de nuevo!“ – i v `home.title` a `welcomeBack*`, ať je appka jednotná – mužský rod vynechává polovinu uživatelů.
5 Sjednotit: `{{factor}}` = vždy hotový faktor se znakem z `formatFactor`.

**E10** (✅ v locales 2026-11-25, test `windowsCopy.test.ts`; `activatedLine` s faktorem číslem, emoji z nadpisů milníků pryč). 1 Sjednotit na „Weiter“ (`ui.continue`). 2 Tiché oznámení nese jen „Journal streak“ + počet dní (= laboratoř:
oznámení je tiché, titulek milníku patří oknu). 3 Den 30 vlastní texty ✅ **hotovo 2026-11-24** (3cd593a), „传奇“ ✅ odstraněno
tamtéž. 4 Emoji z nadpisů ⭐🔥👑 i milníků série **odstranit v locales** (ikona je komponenta, PREVOD) – v E10.

**E11** (✅ v locales 2026-11-25, test `homeCopy.test.ts`; `frozenMessage_*` a `resetFailed.message` vloženy s kartou série v E11c, `journal.warmUp.adsCount` zrušen; `timelineCheck.description_*` už od 0e2aba0; E11e: věty Přehledů bez „this month“ a trend „než dva týdny předtím“ – výpočet je 4 týdny, rozhodnutí 5). 1 Pozdrav: vlastní hranice 5 / 12 / 18 h, tři pozdravy, `home.greeting.night` pryč (večer 18–5 = „Good evening“);
nebe dál podle `getDaypart`. 2 (a) `home.hero.nothingPlanned` místo „0 / 0“ a pochvaly za nic, (b) čip `home.startToday`
u série 0, (c) karta statistik skrytá do prvního naplánovaného dne. 3 DE rychlé akce celými slovy (laboratoř).
4 Sekce sheetu přizpůsobení = nadpis své karty. 5 Řádek trendu jen při růstu, období z výpočtu („Last 30 days“), „this month“
z vět pryč. 6 Okna úspěchu záchrany série zrušit – potvrzením je plamen; chyby do pruhu (4 věty z C); technické větve bez okna.

**E12** (✅ v locales 2026-11-25, test `journalCopy.test.ts`; A celé, C celé). 1 Klidné věty: „Today’s three are done — your streak grows.“ / „Die drei für heute sind geschafft – deine Serie wächst.“ /
„Las tres de hoy, hechas: tu racha crece.“; bonus „Every extra entry is a bonus.“ / „Jeder weitere Eintrag ist ein Bonus.“ /
„Cada entrada extra es una bonificación.“

**E13** (✅ v locales 2026-11-25, test `journalHistoryCopy.test.ts`; `journal.history.previousDay/nextDay/clearSearch` založeny jako `journal.historyPage.*` – `journal.history` je text „History“, pod něj nejde vnořit; `journal.stats.best_*` už od 0e2aba0). 1 Při nejdelší sérii 0 existující `journal.stats.startToday` místo „Best: 0 days“.

**E14** (✅ v locales 2026-11-25, test `goalsListCopy.test.ts`; A celé, C celé). 1 Čip „Deadline passed“ (`goals.pace.overdue`) v teplé barvě, řádek „days left“ zmizí, nic se nepočítá dál; nové
datum přes „⋯ → Edit goal“.

**E15** (✅ v locales 2026-11-28; A celé, C celé). 1 Stejný vzor jako návyk: „New goal / Neues Ziel / Nueva meta“ a „Create goal / Ziel erstellen / Crear meta“.

**Zastavení z mapy dat (`design-migration-datamaps.md`):**
- E10/E14 ikona a barva cíle podle kategorie → převést mapu z kulis do konstant (`src/constants`), s testem, že každá
  kategorie má ikonu i barvu s kontrastem.
- E14 rychlé částky → `suggestQuick(target)` jako čistá funkce s testem.
- E14 „+35 XP / milník / dnes už bez XP“ (D-4) → platí rozhodnutí z plánu 4.5: odvodit z událostí `xpGained` podle
  `sourceId`, úložiště se nemění; obrazovka ukáže jen to, co se opravdu připsalo.
- E15 XP u zápisu v historii → číst z `xp_transactions` podle `sourceId`; kde vazba není (staré zápisy), číslo se neukáže
  (nikdy odhad).

---

## E5 – Návyky: seznam (pilot)

Obrazovka Návyky: týden nahoře, karta „Dnes“ s dílky, karty návyků s mini-týdnem, sekce Bonus a Pozastavené a nabídka „⋯“ (sheet) místo čtyř tlačítek na řádku.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `habits.list.subline` | Small steps, kept. | Kleine Schritte, die bleiben. | Pequeños pasos que perduran. | podtitulek pod nadpisem obrazovky | |
| `habits.list.week` | This week | Diese Woche | Esta semana | nadpis karty s týdnem | `home.habitPerformance.thisWeek` má „This Week“ (Title Case, jiná oblast) |
| `habits.list.doneOf_one` | {{count}} of {{total}} done | {{count}} von {{total}} erledigt | {{count}} de {{total}} completado | karta „Dnes“ pod počtem | *odvozeno* pro ES (shoda čísla); EN/DE stejný tvar jako `_other` |
| `habits.list.doneOf_other` | {{count}} of {{total}} done | {{count}} von {{total}} erledigt | {{count}} de {{total}} completados | karta „Dnes“ pod počtem | lab: `doneOf(done, total)` → `count` = splněno |
| `habits.list.bonusSection` | Bonus — not on today’s plan | Bonus – heute nicht geplant | Bonificación — fuera del plan de hoy | nadpis sekce Bonus (se zlatou hvězdou) | |
| `habits.list.bonusHint` | Check one for bonus XP — or to make up a missed day this week. | Abhaken bringt Bonus-XP – oder holt einen verpassten Tag dieser Woche nach. | Marca uno para ganar XP de bonificación — o para recuperar un día perdido esta semana. | věta pod nadpisem sekce Bonus | nahrazuje bublinu `help.habits.bonusConversion` (7.10 – zaniká) |
| `habits.list.pausedFor_one` | Paused for {{count}} day — never counted as missed | Seit {{count}} Tag pausiert – zählt nie als verpasst | En pausa desde hace {{count}} día — nunca cuenta como perdido | karta pozastaveného návyku | *odvozeno* EN/DE; viz otázka 3 (0 dní) |
| `habits.list.pausedFor_other` | Paused for {{count}} days — never counted as missed | Seit {{count}} Tagen pausiert – zählt nie als verpasst | En pausa desde hace {{count}} días — nunca cuenta como perdido | karta pozastaveného návyku | lab: `pausedFor(days)`; počet dní z otevřeného `pausePeriods` |
| `habits.list.resume` | Resume | Fortsetzen | Reanudar | tlačítko na kartě pozastaveného návyku (i čtečka) | |
| `habits.list.makeupCovers` | Make-up · covers {{day}} | Nachgeholt · ersetzt {{day}} | Recuperación · cubre el {{day}} | řádek pod jménem, když dnešní odškrtnutí nahrazuje vynechaný den | `{{day}}` = krátký den („Tue“, „Di“, „mar“) z `toLocaleDateString` |
| `habits.list.more` | More | *návrh* Mehr | Más opciones | čtečka obrazovky: tlačítko „⋯“ na kartě | v laboratoři natvrdo jen EN |
| `habits.schedule.everyDay` | Every day | Jeden Tag | Todos los días | řádek pod jménem návyku (série · rozvrh); i detail a tvorba (E6) | v `HabitsConcept` natvrdo `'Every day'`/`'Jeden Tag'`, v mockCopy `habits.composer.everyDay`; jiné rozvrhy = výčet krátkých dnů „Mon · Wed · Fri“ z `toLocaleDateString` |
| `habits.actions.calendarStats` | Calendar & stats | Kalender & Statistik | Calendario y estadísticas | řádek v nabídce „⋯“ (otevře detail v E6) | |
| `habits.actions.pause` | Pause | Pausieren | Pausar | řádek v nabídce „⋯“ | viz otázka 4 (pozastavený návyk) |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| nadpis obrazovky „Habits“ / „Routinen“ | `tabs.habits` | Habits / Routine / Hábitos | DE má „Routine“ (jednotné), laboratoř „Routinen“ – viz otázka 1 |
| „Today“ (nadpis karty i sekce) | `common.dates.today` | Today / Heute / Hoy | |
| tlačítko „Reorder“ (čtečka; ikona) | `habits.reorder` | Reorder / Neu ordnen / Reordenar | v laboratoři natvrdo EN |
| tlačítko „Add habit“ (čtečka; ikona) | `habits.addHabit` | Add Habit / Neue Routine / Añadir Hábito | v laboratoři natvrdo EN; Title Case – viz otázka 2 |
| štítek „Bonus“ na kartě | `habits.bonus` | Bonus / Bonus / Bonificación | |
| nadpis sekce „Paused“ / „Pausiert“ | `habits.calendar.legendPaused` | Paused / Pausiert / En pausa | stejný text ve všech třech |
| „+145 XP“ v kartě „Dnes“ | `achievements.card.xpReward` | +{{xp}} XP (všude) | viz otázka 5 (které číslo) |
| písmena dnů v týdnu a v mini-týdnu (M T W …) | `days.shortest.*` | Mo… / Mo… / L… | EN/DE mají dvě písmena, laboratoř jedno; jednopísmenné „úzké“ tvary umí i `toLocaleDateString({ weekday: 'narrow' })` bez klíče |
| zaškrtávátko pro čtečku (laboratoř: jen jméno návyku) | `habits.accessibility.markComplete` / `markIncomplete` | Mark habit as complete … | jméno návyku zůstává jako popisek, akce z klíče |
| nabídka „⋯“: Edit / Delete | `common.edit` / `common.delete` | Edit · Delete / Bearbeiten · Löschen / Editar · Eliminar | |
| nabídka „⋯“: zavření ťuknutím vedle (čtečka „Cancel“) | `common.cancel` | Cancel / Abbrechen / Cancelar | |
| potvrzení smazání (laboratoř ho nemá, appka ano) | `habits.confirmDelete`, `habits.deleteMessage` | Confirm Delete … | zůstává dnešní text, dokud Petr neřekne jinak |
| prázdný stav (laboratoř ho nemá) | `habits.emptyStateWithCompletion.title` / `.subtitle` | No habits created yet / Tap "Add New Habit"… | viz otázka 6 |
| řádek data nad nadpisem | `common.locale` | en-US / de-DE / es-ES | jen jazyk pro `toLocaleDateString` |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Němčina: „Routine“ × „Gewohnheit“.** Appka i laboratoř to míchají: záložka „Routine“ (jednotné číslo), nadpis laboratoře „Routinen“, formulář appky „Gewohnheitsname“, panel úrovně v laboratoři „Gewohnheiten“. Navrhuji na obrazovce Návyky všude „Routine(n)“ a ve větách o pravidlech taky – nebo naopak. Které slovo?
2. **Velká písmena v angličtině.** Existující klíče jsou v Title Case („Add Habit“, „Harmony Streak“, „Goal Completed!“), laboratoř píše větou („Add habit“). Tam, kde text jde jen do čtečky, je to jedno. Tam, kde je vidět (např. nadpisy v E6, E9, E10), bude nový vzhled míchat obojí. Chceš existující EN hodnoty v převedených místech přepsat na větný styl?
3. **Pauza od dneška.** „Paused for 0 days“ nedává smysl. Laboratoř pro 0 dní text nemá. Chceš tvar `_zero` (např. „Paused today — never counted as missed“), nebo počítat den pauzy jako 1?
4. **Pozastavený návyk a nabídka „⋯“.** Karta pozastaveného návyku má v laboratoři jen „Resume“ a žádné „⋯“, takže nejde upravit ani smazat (dnešní appka to umí). Kdyby „⋯“ dostal i pozastavený návyk, bude jeho řádek „Pause“ ukazovat „Resume“?
5. **Čip „+N XP“ v kartě „Dnes“ (pravidlo 0.1/4).** V laboratoři jsou to XP jen za dnešní návyky. Má ostrá appka ukázat XP za návyky dnes, nebo celé dnešní XP (`getTodayXP()`, jako čip na Home)? Podle toho se rozhodne, odkud číslo vezmeme.
6. **Prázdný stav.** Dnešní podtitulek říká „Tap "Add New Habit" to get started!“, jenže v novém vzhledu je přidání jen ikona „+“ bez textu. Laboratoř prázdný stav nemá. Mám ho nejdřív postavit v laboratoři (kap. 0.3), nebo stačí přepsat jen větu?

---

## E6 – Návyky: detail, tvorba a úprava, řazení

Detail návyku vyroste z karty (kalendář s tvary dnů, vysvětlení dne, legenda s tichým „i“), tvorba i úprava jsou jeden sheet s živým náhledem a řazení dostane nový vzhled řádků.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `habits.detail.currentStreak` | Current streak | Aktuelle Serie | Racha actual | dlaždice v detailu | stejný text má `journal.stats.currentStreak` (oblast deníku, Title Case) |
| `habits.detail.bestStreak` | Best streak | Beste Serie | Mejor racha | dlaždice v detailu | |
| `habits.detail.rate` | Completion | Erfüllung | Cumplimiento | dlaždice v detailu (hodnota „{{rate}} %“ se tiskne číslem) | |
| `habits.detail.previousMonth` | Previous month | *návrh* Vorheriger Monat | Mes anterior | čtečka: šipka vlevo nad kalendářem | v laboratoři natvrdo EN |
| `habits.detail.nextMonth` | Next month | *návrh* Nächster Monat | Mes siguiente | čtečka: šipka vpravo nad kalendářem | v laboratoři natvrdo EN |
| `habits.detail.tapHint` | Tap a day to see what happened | Tippe auf einen Tag, um zu sehen, was passiert ist | Toca un día para ver qué pasó | pruh pod kalendářem, dokud není vybraný den | ⚠ DE +67 % (jeden řádek na úzkém telefonu nemusí stačit) |
| `habits.detail.explainTitle` | How make-up works | So funktioniert Nachholen | Cómo funciona la recuperación | nadpis karty pod legendou | |
| `habits.detail.explainBody` | Missed a planned day? An extra day in the same week (Mon–Sun) makes it up. The line shows which day covered which. | Einen geplanten Tag verpasst? Ein zusätzlicher Tag in derselben Woche (Mo–So) holt ihn nach. Die Linie zeigt, welcher Tag welchen ersetzt. | ¿Perdiste un día programado? Un día extra en la misma semana (lun–dom) lo recupera. La línea muestra qué día cubrió a cuál. | text karty pod legendou | viz otázka 2 (dvakrát totéž) |
| `habits.dayStatus.done` | Done | Erledigt | Hecho | vysvětlení vybraného dne: „Wed 22 · Done“ | `habits.done` má DE „Fertig“ (tlačítko), proto vlastní klíč |
| `habits.dayStatus.makeup` | Make-up — covers {{day}} | Nachgeholt – ersetzt {{day}} | Recuperación — cubre el {{day}} | vysvětlení dne, který nahradil vynechaný | `{{day}}` = „Wed 22“ / „Mi., 22.“ / „mié 22“ z `toLocaleDateString` |
| `habits.dayStatus.covered` | Missed — made up on {{day}} | Verpasst – nachgeholt am {{day}} | Perdido — recuperado el {{day}} | vysvětlení vynechaného dne, který byl zachráněn | `{{day}}` jako výše |
| `habits.dayStatus.bonus` | Bonus — an extra day | Bonus – ein zusätzlicher Tag | Bonificación — un día extra | vysvětlení dne | |
| `habits.dayStatus.paused` | Paused — never counted as missed | Pausiert – zählt nie als verpasst | En pausa — nunca cuenta como perdido | vysvětlení dne | |
| `habits.dayStatus.planned` | Planned | Geplant | Programado | vysvětlení budoucího plánovaného dne | viz otázka 3 (Planned × Scheduled) |
| `habits.dayStatus.todayOpen` | Today — still open | Heute – noch offen | Hoy — aún pendiente | vysvětlení dnešního dne | |
| `habits.dayStatus.none` | Not planned | Nicht geplant | No programado | vysvětlení dne bez plánu | |
| `help.topics.makeUp` | How missed days are made up | So werden verpasste Tage ausgeglichen | Cómo se recuperan los días perdidos | čtečka: tiché „i“ u legendy kalendáře | nahrazuje bublinu `help.habits.makeupFunction` (7.10) |
| `help.rules.makeUp.title` | An extra day makes up for a missed one | Ein zusätzlicher Tag gleicht einen verpassten aus | Un día extra recupera uno perdido | spodní okno nápovědy (a v E22 stránka „Jak SelfRise funguje“) | jeden zdroj pro okno i stránku (P76) |
| `help.rules.makeUp.text` | Did a habit on a day it wasn’t planned? It covers a planned day you missed in the same week, Monday to Sunday, one for one. A golden check marks the day it saved. | Du hast eine Gewohnheit an einem ungeplanten Tag erledigt? Sie gleicht einen verpassten geplanten Tag derselben Woche aus, Montag bis Sonntag, eins zu eins. Ein goldener Haken markiert den geretteten Tag. | ¿Hiciste un hábito un día que no estaba programado? Cubre un día programado que perdiste en la misma semana, de lunes a domingo, uno por uno. Una marca dorada señala el día que salvó. | spodní okno nápovědy | **viz otázka 1 (zlatá fajfka)**; DE „Gewohnheit“ – viz E5 otázka 1 |
| `help.allRules` | All the rules | Alle Regeln | Todas las reglas | tlačítko dole v okně nápovědy (otevře stránku pravidel) | používá i E9 |
| `habits.composer.title` | New habit | Neue Routine | Nuevo hábito | nadpis sheetu tvorby | DE = dnešní `habits.addHabit`, EN se liší („Add Habit“) |
| `habits.composer.placeholder` | What will you do? | Was möchtest du tun? | ¿Qué vas a hacer? | prázdné pole jména | nahrazuje `habits.form.namePlaceholder` jen v novém sheetu |
| `habits.composer.previewName` | Your new habit | Deine neue Routine | Tu nuevo hábito | živý náhled karty, dokud je jméno prázdné | |
| `habits.composer.ideas` | Start from an idea | Mit einer Idee starten | Empieza con una idea | nadpis řady předvoleb | |
| `habits.schedule.weekdays` | Weekdays | Werktags | Entre semana | rychlá volba dnů | |
| `habits.schedule.weekends` | Weekends | Wochenende | Fines de semana | rychlá volba dnů | |
| `habits.composer.create` | Create habit | Routine erstellen | Crear hábito | hlavní tlačítko sheetu (i čtečka) | |
| `habits.reorderMode.hint` | Hold a handle and drag. The new order shows on every screen. | Halte einen Griff und ziehe. Die neue Reihenfolge gilt überall. | Mantén presionada el asa y arrastra. El nuevo orden se ve en todas las pantallas. | věta pod nadpisem režimu řazení | |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| legenda: Completed / Makeup / Bonus / Missed / Paused / Scheduled | `habits.calendar.legendCompleted`, `legendMakeup`, `bonus`, `legendMissed`, `legendPaused`, `legendScheduled` | Completed… / Abgeschlossen… / Completado… | laboratoř je už bere přes `getFixedT` |
| stav dne „Missed“ | `habits.calendar.legendMissed` | Missed / Verpasst / Perdido | stejné ve všech třech, proto ne nový klíč |
| křížek detailu, zavření sheetu tvorby i okna nápovědy (čtečka „Close“) | `common.close` | Close / Schließen / Cerrar | |
| řádek rozvrhu „Every day“ v detailu a náhledu | `habits.schedule.everyDay` | (nový z E5) | |
| písmena dnů nad kalendářem, v náhledu a u přepínačů dnů | `days.shortest.*` | Mo… / Mo… / L… | jako E5 |
| čtečka u přepínače dne (laboratoř: jen písmeno „M“) | `days.monday` … `days.sunday` | Monday / Montag / Lunes … | dnešní `DayPicker` čte `social.days.*` (stejné hodnoty) |
| „Select Color“, „Select Icon“, „Scheduled Days“, „Description (Optional)“, popisek pole popisu | `habits.form.color`, `habits.form.icon`, `habits.form.scheduledDays`, `habits.form.description`, `habits.form.descriptionPlaceholder` | Select Color… / Farbe wählen… / Seleccionar Color… | laboratoř je bere přes `getFixedT`; Title Case – E5 otázka 2 |
| chybové texty pole (třesení místo okna) | `habits.form.errors.nameRequired`, `nameTooShort`, `nameTooLong`, `daysRequired`, `descriptionTooLong` | (všechny tři) | sdílet s `HabitForm`, nekopírovat |
| předvolby „Start from an idea“ | `onboarding.habitPresets.*` | Drink water… / Wasser trinken… / Beber agua… | přes `HABIT_PRESETS.nameKey` |
| nadpis sheetu při úpravě (laboratoř má jen tvorbu) | `habits.editHabit` | Edit Habit / Bearbeiten / Editar Hábito | viz otázka 5 |
| tlačítko při úpravě (laboratoř má jen „Create habit“) | `common.save` | Save / Speichern / Guardar | viz otázka 5 |
| nadpis režimu řazení „Reorder“ | `habits.reorder` | Reorder / Neu ordnen / Reordenar | laboratoř DE „Reihenfolge“ – viz otázka 6 |
| tlačítko „Done“ v řazení | `habits.done` | Done / Fertig / Hecho | stejné jako laboratoř |
| úchyt řádku (čtečka) | `ui.dragToReorder` | Drag to reorder / Zum Neuordnen ziehen / Arrastra para reordenar | `ReorderHandle` ho už čte |
| pozastavený řádek v řazení „⏸ Paused“ | `habits.calendar.legendPaused` | Paused / Pausiert / En pausa | emoji ⏸ nahradit ikonou `pause` jako na kartě (E5) |
| měsíc a rok nad kalendářem, „Wed 22“ | `common.locale` | en-US / de-DE / es-ES | `toLocaleDateString` |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **„Zlatá fajfka“ v textu pravidla (P28).** Text nápovědy z laboratoře (`howItWorks.makeUp`) říká „A golden check marks the day it saved.“ Kalendář detailu přitom podle R-11 kreslí zachráněný den jako **kroužek v barvě návyku se spojnicí** a zlatou barvu má jen bonus ★. Plán u E5 sám žádá opravit „zlatou fajfku“ v nápovědě. Mám poslední větu přepsat, třeba na „A ring and a line mark the day it saved.“? Text pak doplním ve všech třech jazycích.
2. **Stejné pravidlo dvakrát.** Detail má kartu „How make-up works“ a hned vedle legendy „i“, které otevře okno se stejným pravidlem jinými slovy. Necháme obojí, nebo jen jedno?
3. **„Planned“ × „Scheduled“.** Vysvětlení dne říká „Planned“, legenda o kousek výš (existující klíč) „Scheduled“. V DE je obojí „Geplant“. Mám pro EN použít jen jedno slovo (např. `habits.calendar.legendScheduled` i pro vysvětlení dne)?
4. **Čtečka u barev a ikon.** V laboratoři čte čtečka u barvy hex kód („#4A90E2“) a u ikony její technické jméno („water-outline“). Appka jména barev ani ikon nemá. Mám je doplnit jako nové texty (sedm barev, ikony podle `HABIT_ICON_MAP`), nebo to necháme na E22?
5. **Úprava návyku.** Laboratoř má jen tvorbu („New habit“ / „Create habit“). Pro úpravu navrhuji existující „Edit Habit“ / „Save“. Souhlas, nebo chceš vlastní větný text?
6. **DE nadpis řazení.** Laboratoř má „Reihenfolge“, appka „Neu ordnen“. Které?

---

## E7 – Jádro XP: odznak a jiskry (R-10)

Odznak úrovně vlevo nahoře na každé obrazovce: kroužek postupu, jiskry XP, které do něj doletí, štítek „LEVEL UP“ po nové úrovni a značka násobiče (štítek s faktorem nebo zlatá tečka).

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `gamification.badge.levelWithMark` | Level {{level}}. {{mark}} | *návrh* Level {{level}}. {{mark}} | Nivel {{level}}. {{mark}} | čtečka: odznak, když na něm je značka násobiče | v laboratoři natvrdo EN (`Level ${level}. ${mark.label}`); `{{mark}}` = jeden ze dvou klíčů níže |
| `gamification.badge.markRunning` | {{factor}} XP is on | {{factor}} XP läuft | {{factor}} XP activado | čtečka: zlatý štítek na odznaku (běžící násobič) | `{{factor}}` = vytištěný faktor „2ד; viditelný štítek ukazuje jen faktor, bez textu |
| `gamification.badge.markReady` | {{factor}} XP is ready to switch on | {{factor}} XP bereit zum Einschalten | {{factor}} XP listo para activar | čtečka: zlatá tečka na odznaku (násobič připravený) | `{{factor}}` = „2ד |
| `gamification.badge.levelUpTag` | LEVEL UP · {{level}} | *návrh* LEVEL UP · {{level}} | NUEVO NIVEL · {{level}} | štítek, který po nové úrovni na chvíli vyjede z odznaku (ťuknutím otevře panel) | v laboratoři natvrdo EN i v DE; viz otázka 1 |
| `gamification.badge.levelUpLabel` | Level up. Level {{level}} | *návrh* Level-Up. Level {{level}} | Subiste de nivel. Nivel {{level}} | čtečka: štítek „LEVEL UP“ | v laboratoři natvrdo EN |
| `gamification.xp.amountLost` | −{{xp}} XP | −{{xp}} XP | −{{xp}} XP | bublina u zaškrtávátka při odškrtnutí zpět | znak „−“ (minus, ne pomlčka) jako v laboratoři; kladná verze je existující klíč (B) |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| čtečka odznaku „Level 16“ | `onboarding.done.statLevel` | Level {{level}} / Level {{level}} / Nivel {{level}} | stejný text i parametr; klíč je z úvodu – kdyby ti vadilo „cizí“ místo, přesunu ho do `gamification.levelNumber` (beze změny textu) |
| bublina „+25 XP“ u místa zisku | `achievements.card.xpReward` | +{{xp}} XP (všude) | |

*Souhrnná lišta (`XpNotification`) a staré bubliny (`XpPopupAnimation`) se v E7 odpojí. Jejich klíče (`gamification.xp.xpNotification.*`, `gamification.xp.popup.*`) se smažou až v E26.*

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **„LEVEL UP“ v němčině a španělštině.** Laboratoř nechává „LEVEL UP“ anglicky i v DE (podobně jako vzácnosti trofejí). DE appka říká „Level“, takže „LEVEL UP“ tam sedí. Pro ES navrhuji „NUEVO NIVEL · 16“, protože „LEVEL UP“ ve španělské appce nikde není. Souhlas, nebo nechat všude anglicky?

---

## E8 – Momenty: jedna oslava na jednu akci, tiché oznámení, velké okno trofeje (R-29)

Trofeje jedné akce jdou jako jeden moment: běžné a vzácné jako tiché oznámení u odznaku (ťuknutím otevře Síň trofejí), epické a legendární jako jedno velké okno s ostatními trofejemi uvnitř („Also unlocked“) a s jedním číslem XP.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `achievements.celebration.alsoUnlocked` | Also unlocked | Außerdem freigeschaltet | También desbloqueaste | velké okno trofeje nad seznamem dalších trofejí z té akce; i okno kapitoly (E10) | ⚠ DE +77 % (malý popisek, v okně se vejde) |
| `achievements.celebration.trophiesUnlocked_one` | {{count}} trophy unlocked | {{count}} Trophäe freigeschaltet | {{count}} trofeo desbloqueado | nadpis tichého oznámení s víc trofejemi | *odvozeno* EN/DE (laboratoř ho volá jen pro 2+) |
| `achievements.celebration.trophiesUnlocked_other` | {{count}} trophies unlocked | {{count}} Trophäen freigeschaltet | {{count}} trofeos desbloqueados | nadpis tichého oznámení s víc trofejemi | |
| `achievements.celebration.opensTrophyRoom` | Opens the Trophy Room | Öffnet die Trophäenhalle | Abre la Sala de Trofeos | čtečka: konec popisu tichého oznámení (je to tlačítko) | DE: appka jinde říká „Trophäenzimmer“ – viz otázka 1 |
| `gamification.multiplier.boostLine_one` | {{factor}}× XP for the next {{count}} hour | {{factor}}× XP für die nächste {{count}} Stunde | {{factor}}× XP durante la próxima {{count}} hora | řádek ve velkém okně trofeje, když trofej spustí kombo (L-11); i čtečka tichého oznámení | *odvozeno*; hodiny jsou z `XP_MULTIPLIERS` vždy 6, 12 nebo 24, tvar `_one` se nezobrazí |
| `gamification.multiplier.boostLine_other` | {{factor}}× XP for the next {{count}} hours | {{factor}}× XP für die nächsten {{count}} Stunden | {{factor}}× XP durante las próximas {{count}} horas | jako výše | `{{factor}}` = holé číslo (× je v textu); lab: `challenge.multiplier(factor, hours)`, použije i E18 |
| `gamification.multiplier.factorTag` | {{factor}}× XP | {{factor}}× XP | {{factor}}× XP | zlatý štítek kombo v tiché pilulce | v laboratoři natvrdo; existující `gamification.multiplier.multiplierValue` má „{{multiplier}}x XP“ s písmenem x – šlo by ho použít, ale vypadá jinak |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| nadpis okna / oznámení podle vzácnosti | `achievements.celebration.rarity_common`, `rarity_rare`, `rarity_epic`, `rarity_legendary` | Achievement Unlocked! … / Erfolg Freigeschaltet! … / ¡Logro Desbloqueado! … | viz otázka 2 (Achievement × Trophy) |
| hlášení čtečce při odemčení | `achievements.celebration.announcement` | {{rarity}} achievement unlocked: {{name}}! … | `{{rarity}}` = anglický název vzácnosti (pravidlo) |
| „XP Earned“ pod číslem | `achievements.celebration.xp_earned` | XP Earned / XP Verdient / XP Ganado | |
| tlačítko „Continue“ (i čtečka) | `achievements.celebration.continue_button`, `continue_hint` | Continue / Fortfahren / Continuar | viz E10 otázka 1 (DE „Fortfahren“ × „Weiter“) |
| jméno a popis trofeje | `achievements.<id>.name` / `.description` (přes `nameKey`, `descriptionKey` v katalogu) | – | |
| „+N XP“ v oznámení a v okně | `achievements.card.xpReward` | +{{xp}} XP | |
| štítek vzácnosti v okně („EPIC“, „LEGENDARY“) | **bez klíče – zůstává anglicky** | COMMON / RARE / EPIC / LEGENDARY | pravidlo `technical-guides.md`; existující `achievements.rarity.*` (přeložené) se tu nepoužije |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Název Síně trofejí v DE.** Laboratoř: „Trophäenhalle“. Appka: nadpis `screens.trophyRoom.title` = „Trophäenzimmer“, záložka a obrazovka = „Trophäen“. Které jméno má být všude? ES „Sala de Trofeos“ je v appce jednotné.
2. **„Achievement“ × „trophy“.** Nové texty laboratoře říkají „trophy / Trophäe / trofeo“, existující nadpisy okna (které laboratoř přebírá) „Achievement / Erfolg / Logro“. V jednom oznámení tak může stát „2 trophies unlocked“ a ve velkém okně „Epic Achievement!“. Přepsat nadpisy `rarity_*` na „trofej“, nebo to nechat?

---

## E9 – Panel úrovně a přehled úrovní (R-31)

Ťuknutí na odznak otevře panel úrovně (úroveň, název, XP, zbytek do další úrovně, dnešní XP, násobič ve třech stavech, odkaz na všechny úrovně). Přibývají tichá oznámení „násobič připraven“ a „Vítej zpět“ a nový přehled úrovní jako cesta šesti kapitolami.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `gamification.progress.xpToLevel` | {{xp}} XP to Level {{level}} | Noch {{xp}} XP bis Level {{level}} | Faltan {{xp}} XP para el nivel {{level}} | panel pod pruhem; přehled úrovní (hrdina i řádek „You are here“) | existující `to_next_level` („to Level {{level}}“) je v DE i ES nepřeložený, proto nový; ⚠ DE +40 % a v panelu je to jeden řádek vedle XP |
| `gamification.xp.amount` | {{xp}} XP | {{xp}} XP | {{xp}} XP | panel: celkové XP; přehled úrovní: XP potřebné pro úroveň | v laboratoři natvrdo |
| `gamification.levelPanel.close` | Close level details | Level-Details schließen | Cerrar detalles del nivel | čtečka: ťuknutí vedle panelu | |
| `gamification.levelPanel.allLevels` | All levels | Alle Level | Todos los niveles | tlačítko dole v panelu (→ přehled úrovní) | |
| `gamification.levelPanel.multiplier` | {{factor}} XP multiplier | {{factor}} XP-Multiplikator | Multiplicador de {{factor}} XP | řádek panelu, když násobič běží | `{{factor}}` = „2ד |
| `gamification.levelPanel.timeLeftHours_one` | {{count}} h left | noch {{count}} Std. | Queda {{count}} h | vpravo v řádku násobiče | *odvozeno* (tvar `_one`); lab: `timeLeft(value, 'h')` |
| `gamification.levelPanel.timeLeftHours_other` | {{count}} h left | noch {{count}} Std. | Quedan {{count}} h | vpravo v řádku násobiče | |
| `gamification.levelPanel.timeLeftMinutes_one` | {{count}} min left | noch {{count}} Min. | Queda {{count}} min | vpravo v řádku násobiče (pod hodinu) | *odvozeno* (tvar `_one`); lab: `timeLeft(value, 'min')` |
| `gamification.levelPanel.timeLeftMinutes_other` | {{count}} min left | noch {{count}} Min. | Quedan {{count}} min | jako výše | |
| `gamification.levelPanel.harmonyDays` | {{done}} of {{required}} days | {{done}} von {{required}} Tagen | {{done}} de {{required}} días | řádek harmonie (sbírá se) | `{{required}}` = vždy 7 (`HARMONY_STREAK_DAYS_REQUIRED`), proto bez množných tvarů |
| `gamification.levelPanel.harmonyNext_one` | Next one tomorrow | Der nächste ab morgen | El próximo, mañana | řádek harmonie v ochranné lhůtě | lab: `harmonyNext(days)` – pro 1 jiný text, sedí na `_one` |
| `gamification.levelPanel.harmonyNext_other` | Next one in {{count}} days | Der nächste in {{count}} Tagen | El próximo en {{count}} días | řádek harmonie v ochranné lhůtě | počet z `nextActivationDate` |
| `gamification.levelPanel.partHabits` | Habits | Gewohnheiten | Hábitos | popisek dílku „návyk dnes“ | `tabs.habits` má DE „Routine“ – E5 otázka 1 |
| `gamification.levelPanel.partJournal` | Journal | Tagebuch | Diario | popisek dílku „3 záznamy dnes“ | `tabs.journal` má „My Journal“ – proto vlastní |
| `gamification.levelPanel.partGoals` | Goals | Ziele | Metas | popisek dílku „krok cíle dnes“ | stejné jako `tabs.goals`; vlastní klíč jen kvůli sadě |
| `gamification.levelPanel.partDone` | {{part}}: done today | {{part}}: heute erledigt | {{part}}: hecho hoy | čtečka u dílku | |
| `gamification.levelPanel.partOpen` | {{part}}: not yet today | {{part}}: heute noch offen | {{part}}: aún no hoy | čtečka u dílku | |
| `gamification.levelPanel.harmonyHint` | A day counts with one habit done, three journal entries and one goal step. | Ein Tag zählt mit einer erledigten Gewohnheit, drei Tagebucheinträgen und einem Schritt bei einem Ziel. | Un día cuenta con un hábito hecho, tres entradas en el diario y un paso en una meta. | věta pod dílky (sbírá se) | ⚠ DE +39 % |
| `gamification.levelPanel.switchOn` | Switch on {{factor}} XP for {{hours}} h | {{factor}} XP für {{hours}} Std. einschalten | Activar {{factor}} XP por {{hours}} h | zlaté tlačítko v panelu (připraveno), i čtečka | `{{factor}}` = „2ד, `{{hours}}` = 24 z `XP_MULTIPLIERS` |
| `gamification.levelPanel.readyTitle` | {{factor}} XP is ready | {{factor}} XP ist bereit | {{factor}} XP está listo | nadpis tichého oznámení „připraveno“ | `{{factor}}` = „2ד |
| `gamification.levelPanel.noteAction` | Switch on | Einschalten | Activar | tlačítko v tichém oznámení „připraveno“ | |
| `gamification.multiplier.harmonyOverline_one` | Harmony streak · {{count}} day | Harmonie-Serie · {{count}} Tag | Racha de armonía · {{count}} día | horní řádek oznámení „připraveno“; i okno zapnutí (E10) | *odvozeno*; počet je vždy 7 |
| `gamification.multiplier.harmonyOverline_other` | Harmony streak · {{count}} days | Harmonie-Serie · {{count}} Tage | Racha de armonía · {{count}} días | jako výše | lab: `moments.multiplierOverline(days)` |
| `gamification.multiplier.boostTitle_one` | {{factor}}× XP for {{count}} hour | {{factor}}× XP für {{count}} Stunde | {{factor}}× XP durante {{count}} hora | nadpis oznámení „Vítej zpět“; nadpis okna zapnutí (E10) | *odvozeno*; hodiny vždy 24 nebo 48 |
| `gamification.multiplier.boostTitle_other` | {{factor}}× XP for {{count}} hours | {{factor}}× XP für {{count}} Stunden | {{factor}}× XP durante {{count}} horas | jako výše | `{{factor}}` = holé číslo; lab: `moments.multiplierTitle` |
| `gamification.multiplier.welcomeBack` | Welcome back | Willkommen zurück | Bienvenido de nuevo | horní řádek tichého oznámení po návratu (2× na 48 h + 25 XP) | ES rod – viz otázka 4 |
| `help.topics.multiplier` | How the XP multiplier works | So funktioniert der XP-Multiplikator | Cómo funciona el multiplicador de XP | čtečka: tiché „i“ v řádku harmonie | nový hostitel za `help.home.xpSystem` (7.10) |
| `help.rules.harmony.title` | {{days}} days of all three = {{factor}} XP | {{days}} Tage mit allen dreien = {{factor}} XP | {{days}} días con las tres = {{factor}} XP | spodní okno nápovědy (a v E22 stránka pravidel) | `{{factor}}` = „2ד; `{{days}}` = 7 (stálé, bez množného tvaru) |
| `help.rules.harmony.text` | A day counts with one habit done, three journal entries and one goal step. After {{days}} in a row, switch it on from the level badge: everything earns double for {{hours}} hours. The next one is possible {{cooldownDays}} days later. | Ein Tag zählt mit einer erledigten Gewohnheit, drei Tagebucheinträgen und einem Schritt bei einem Ziel. Nach {{days}} Tagen in Folge schaltest du ihn am Level-Abzeichen ein: {{hours}} Stunden lang zählt alles doppelt. Der nächste ist {{cooldownDays}} Tage später möglich. | Un día cuenta con un hábito hecho, tres entradas en el diario y un paso en una meta. Después de {{days}} seguidos, actívalo desde la insignia de nivel: todo vale el doble durante {{hours}} horas. El siguiente es posible {{cooldownDays}} días después. | spodní okno nápovědy | čísla z `XP_MULTIPLIERS` (7, 24, 168/24); „double“ je napsané slovem – viz otázka 3 |
| `gamification.levels.journey.title` | Your journey | Dein Weg | Tu camino | nadpis přehledu úrovní | nahrazuje `screens.levelOverview` („Level Overview“) na nové stránce |
| `gamification.levels.journey.ofTotal` | of {{total}} | von {{total}} | de {{total}} | hrdina: „Level 16 of 100“ | |
| `gamification.levels.journey.range` | Levels {{from}}–{{to}} | Level {{from}}–{{to}} | Niveles {{from}}–{{to}} | řádek kapitoly; i okno kapitoly (E10, jiný klíč) | |
| `gamification.levels.journey.reached_one` | {{count}} of {{size}} reached | {{count}} von {{size}} erreicht | {{count}} de {{size}} alcanzado | řádek rozpracované kapitoly | *odvozeno* pro ES; EN/DE beze změny |
| `gamification.levels.journey.reached_other` | {{count}} of {{size}} reached | {{count}} von {{size}} erreicht | {{count}} de {{size}} alcanzados | řádek rozpracované kapitoly | |
| `gamification.levels.journey.allReached` | All reached | Alle erreicht | Todos alcanzados | řádek dokončené kapitoly | |
| `gamification.levels.journey.ahead` | Still ahead | Liegt noch vor dir | Aún por delante | řádek kapitoly před uživatelem | ⚠ DE +64 % (krátký, ale vedle názvu kapitoly) |
| `gamification.levels.journey.here` | You are here | Du bist hier | Estás aquí | řádek úrovně uživatele | |
| `gamification.levels.journey.milestone` | Milestone · Level {{level}} | Meilenstein · Level {{level}} | Hito · Nivel {{level}} | řádek milníkové úrovně bez trofeje (75) | |
| `gamification.levels.journey.milestoneTrophy` | Milestone · trophy “{{name}}” | Meilenstein · Trophäe „{{name}}“ | Hito · trofeo “{{name}}” | řádek milníkové úrovně se skutečnou trofejí (10, 25, 50) | tajná trofej (100) se nejmenuje |
| `gamification.levels.journey.nextMilestone_one` | Next milestone: Level {{level}} · {{count}} level to go | Nächster Meilenstein: Level {{level}} · noch {{count}} Level | Próximo hito: Nivel {{level}} · falta {{count}} nivel | hrdina, pod pruhem | lab: `nextMilestone(level, left)` → `count` = zbývá úrovní |
| `gamification.levels.journey.nextMilestone_other` | Next milestone: Level {{level}} · {{count}} levels to go | Nächster Meilenstein: Level {{level}} · noch {{count}} Level | Próximo hito: Nivel {{level}} · faltan {{count}} niveles | hrdina, pod pruhem | |
| `gamification.levels.journey.top` | You have reached the top. | Du hast den Gipfel erreicht. | Has llegado a la cima. | hrdina na úrovni 100 | |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| „Level 16“ (horní řádek panelu, hrdina přehledu, řádky úrovní) | `onboarding.done.statLevel` | Level {{level}} / Level {{level}} / Nivel {{level}} | jako E7 |
| „Today“ v panelu | `common.dates.today` | Today / Heute / Hoy | číslo z `getTodayXP()` (O-9) |
| „+145 XP“ dnes, „+25 XP“ ve „Vítej zpět“ | `achievements.card.xpReward` | +{{xp}} XP | |
| „−N XP“ dnes (záporný den) | `gamification.xp.amountLost` | (nový z E7) | |
| „Harmony streak“ / „Harmonie-Serie“ | `gamification.multiplier.harmonyStreak` | Harmony Streak / Harmonie-Serie / Racha de Armonía | Title Case – E5 otázka 2 |
| tlačítko „All the rules“ v okně nápovědy | `help.allRules` | (nový z E6) | |
| názvy kapitol (Beginner, Growing, Rare, Epic, Legendary, Mythic) | `gamification.levels.overview.rarity.*` | Beginner… / Start… / Principiante… | laboratoř je bere přes `getFixedT` |
| křížek přehledu úrovní (čtečka) | `common.close` | Close / Schließen / Cerrar | |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Názvy úrovní jsou jen anglicky (P61–P62).** Panel, přehled i okno kapitoly ukazují název úrovně z `getLevelInfo(level).title` („Apprentice I“…), který je jen v kódu, anglicky. Přeložit všech 100 názvů (nová sada klíčů), nebo je nechat anglicky jako vzácnosti?
2. **Dílky panelu.** Navrhuji vlastní krátké „Habits / Journal / Goals“ místo názvů záložek (EN záložka „My Journal“, DE „Routine“). Souhlas?
3. **„Everything earns double“ (pravidlo 0.1/4).** Text pravidla i okno zapnutí (E10) píšou „double / doppelt / el doble“ slovem, zatímco číslo bere appka z `XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER` (dnes 2.0). Dokud je to 2, je text pravdivý. Mám to nechat, nebo psát faktor číslem, aby text nelhal ani po změně konstanty?
4. **ES „Bienvenido de nuevo“.** Je v mužském rodě. Appka už ho tak používá (`home.title`). Chceš neutrální tvar (např. „¡Qué bueno verte de nuevo!“), nebo stejný jako jinde?
5. **Dva tvary parametru `{{factor}}`.** Panel a odznak dostávají faktor i se znakem („2ד, „1,5ד), okna a oznámení holé číslo a „ד stojí v textu. Obojí funguje. Sjednotit na první tvar (`formatFactor` všude), ať se v kódu nesplete?

---

## E10 – Ostatní okna oslav

Zbylá okna v novém jazyce: „Nová kapitola“ (jen při vstupu do nového stupně, s trofejemi té akce uvnitř), série deníku (okno pro 7/30/100/365/1000, jinak tiché oznámení), okno zapnutého násobiče, okno dokončeného cíle a okno ⭐🔥👑 milníku dne.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `gamification.chapter.overline` | New chapter | Neues Kapitel | Nuevo capítulo | horní řádek okna kapitoly; začátek hlášení čtečce | |
| `gamification.chapter.line` | Levels {{from}}–{{to}} lie ahead of you. | Level {{from}}–{{to}} liegen vor dir. | Tienes por delante los niveles {{from}}–{{to}}. | věta pod pruhem cesty v okně kapitoly | rozsah z `levelsJourney` (11–20, 21–40 …) |
| `journal.streakMoment.overline` | Journal streak | Tagebuch-Serie | Racha del diario | horní řádek okna série a tichého oznámení série | `home.customization.componentNames.journalStreak` má DE jen „Serie“ – proto vlastní |
| `journal.streakMoment.days_one` | {{count}} day in a row | {{count}} Tag in Folge | {{count}} día seguido | nadpis tichého oznámení série; čtečka plamene v okně | *odvozeno*; série se slaví od 7 dní, tvar se nezobrazí |
| `journal.streakMoment.days_other` | {{count}} days in a row | {{count}} Tage in Folge | {{count}} días seguidos | jako výše | lab: `moments.streakDays(days)` |
| `gamification.multiplier.activatedLine` | You used habits, journal and goals every day. Everything you earn now counts double. | Du hast Routinen, Tagebuch und Ziele jeden Tag genutzt. Alles, was du jetzt verdienst, zählt doppelt. | Usaste hábitos, diario y metas todos los días. Todo lo que ganes ahora cuenta el doble. | věta v okně zapnutého násobiče | „double“ slovem – E9 otázka 3; žádná dlaždice bonusového XP (O-10, O-16) |
| `goals.completion.doneIn_one` | reached in {{count}} day | erreicht in {{count}} Tag | alcanzada en {{count}} día | okno dokončeného cíle, řádek „100 km · reached in 42 days“ | lab: `goals.doneIn(days)`; ES rod ženský (la meta) |
| `goals.completion.doneIn_other` | reached in {{count}} days | erreicht in {{count}} Tagen | alcanzada en {{count}} días | jako výše | dny = od `startDate` do dokončení; před ním „{{cíl}} {{jednotka}} · “ se skládá v kódu |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| název kapitoly („Growing“, „Rare“ …) | `gamification.levels.overview.rarity.*` | Growing… / Wachsend… / Creciente… | |
| „Level 21 · název“ v okně kapitoly | `onboarding.done.statLevel` + název úrovně | Level {{level}} / … / Nivel {{level}} | název úrovně jen anglicky – E9 otázka 1 |
| „Also unlocked“ v okně kapitoly | `achievements.celebration.alsoUnlocked` | (nový z E8) | |
| „+N XP“ ve všech oknech | `achievements.card.xpReward` | +{{xp}} XP | |
| tlačítko „Continue“ (kapitola, série) | `ui.continue` | Continue / Weiter / Continuar | laboratoř: `challenge.continue` = Continue / Weiter – sedí přesně |
| nadpis a věta okna série | `journal.streakMilestone<N>_title` / `_text`, záložně `journal.streakMilestone_generic_*` | (všechny tři) | vždy přes `getJournalStreakMilestoneTexts()` (`journalStreakMilestones.ts`), emoji na konci se odřízne – viz otázka 3 |
| horní řádek okna násobiče „Harmony streak · 7 days“ | `gamification.multiplier.harmonyOverline_*` | (nový z E9) | |
| nadpis okna násobiče „2× XP for 24 hours“ | `gamification.multiplier.boostTitle_*` | (nový z E9) | čísla z `XP_MULTIPLIERS` |
| tlačítko „Let’s go“ v okně násobiče | `onboarding.welcome.cta` | Let's go / Los geht's / Vamos | stejný text (jen rovný apostrof místo ’) |
| okno cíle: „Goal Completed!“ | `goals.completion.title` | Goal Completed! / Ziel Erreicht! / ¡Meta Completada! | Title Case – E5 otázka 2 |
| okno cíle: povzbuzení | `goals.completion.message1` … `message5` | (všechny tři) | |
| okno cíle: „Goal Completion Bonus +350 XP“ | `goals.completion.bonus` + `achievements.card.xpReward` | Goal Completion Bonus / Zielabschluss-Bonus / Bonus de Meta Completada | |
| okno cíle: tlačítko | `goals.completion.continue` | Continue / Weiter / Continuar | |
| okno ⭐🔥👑: nadpis a věta | `journal.bonusMilestone1_title`/`_text`, `bonusMilestone5_*`, `bonusMilestone10_*` | First Bonus Entry! ⭐ … | viz otázka 4 (emoji) |
| okno ⭐🔥👑: tlačítko | `achievements.celebration.continue_button` | Continue / Fortfahren / Continuar | viz otázka 1 |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **DE „Weiter“ × „Fortfahren“.** Okno trofeje a okno ⭐🔥👑 mají tlačítko z `achievements.celebration.continue_button` = „Fortfahren“, okno kapitoly, série a cíle „Weiter“. Všechna okna oslav vypadají nově stejně, tak by asi mělo stejné být i tlačítko. Sjednotit na „Weiter“ (= `ui.continue`)?
2. **Tiché oznámení série (R-40).** Laboratoř v tichém oznámení ukazuje jen „Journal streak“ + „14 days in a row“, nic z textů `journalStreakMilestones.ts` (ty má jen okno). Je to tak myšlené („nese jen titulek“), nebo má oznámení nést titulek milníku (např. „Two Weeks Strong!“)?
3. **Texty série, které okno ukáže (appka, ne laboratoř).**
   - Den **30** má okno, ale vlastní texty nemá. Ukáže tedy obecné „Another Milestone!“ + „Congratulations on reaching 30 days in a row!“. Chceš pro 30 vlastní text?
   - Den **1000** má nadpis „LEGENDARY! 传奇“. Laboratoř odřízne jen emoji, takže čínské znaky zůstanou vidět. Mám je při převodu z nadpisu odstranit ve všech třech jazycích?
4. **Emoji v nadpisech ⭐🔥👑.** `journal.bonusMilestone*_title` končí emoji („First Bonus Entry! ⭐“), zatímco okno už má podpisovou ikonu v medaili. PREVOD říká emoji v locales přepsat (ikona jako komponenta). Mám emoji z těch tří nadpisů odstranit ve všech jazycích (změna existujících hodnot), nebo ho při vykreslení odříznout jako u série?

---

## Doplněk pro E11–E16: co platí navíc

- **Rozhodnutí Petra, která tu jsou už použitá:** DE slovo pro návyk je „Routine(n)“, ne „Gewohnheit“; EN v převedených obrazovkách větným stylem („Add habit“, ne „Add Habit“); ES neutrální, tykání, slovník appky (racha, hito, meta, fecha límite, ritmo, bonificación).
- **Tabulka C – Existující klíč, nová hodnota.** Nový vzhled ukáže text, který appka už má, ale v Title Case, s emoji na konci (ikonu má vložit komponenta – PREVOD, `SignatureIcon`), s „Gewohnheit“, se špatným množným číslem nebo s větou, která do nového vzhledu nepatří (chybová okna → pruh `ProblemNote`). Klíč zůstává, mění se hodnota. `=` = beze změny. Po schválení se přepíše ve všech třech jazycích ve stejném commitu jako obrazovka.
- **ES Title Case:** kde už klíč měním kvůli EN, srovnávám i ES na běžný španělský pravopis (velké jen první písmeno) – „Metas Activas“ → „Metas activas“.
- Chybové pruhy `ProblemNote` (mapa 7.9 a 7.11) mají texty v té etapě, která pruh zavádí: E11 (Home), E12 (Deník), E13 (Historie). Chyby Cílů (`ErrorModal` v `GoalsScreen`, `GoalForm`, `ProgressEntryForm` …) jsou podle plánu až v E22, proto tu nejsou.

---

## E11 – Home

Hrdina dne (oblouk se sluncem, pozdrav, „+XP dnes“, povzbuzení), rychlé akce, dnešní návyky, karta série deníku se záchranou zamrzlé série přímo na Home, nová karta statistik návyků, Přehledy, Pro tebe a nový sheet přizpůsobení.
*Karta měsíční výzvy na Home zůstává v E11 ve stávající podobě a se stávajícími texty (karta etapy E11: „karta výzvy přijde v plné podobě v E17“) – její texty (`challengeOverline`, `challengeDay`, `challenge.count`, stavy karty) patří do soupisu E17. Kulisa laboratoře „Tap the flame to preview a frozen streak“ (`flameHint`) se nepřevádí – plamen v appce stav neukazuje na ťuknutí.*

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `home.greeting.night` | Good night | Gute Nacht | Buenas noches | velký pozdrav nahoře a kompaktní hlavička, 0–5 h | lab: `greeting(hour)`; **viz otázka 1** |
| `home.greeting.morning` | Good morning | Guten Morgen | Buenos días | pozdrav 5–12 h | |
| `home.greeting.afternoon` | Good afternoon | Guten Tag | Buenas tardes | pozdrav 12–18 h | |
| `home.greeting.evening` | Good evening | Guten Abend | Buenas noches | pozdrav 18–24 h | ES nemá zvláštní „večer“; „Buenas noches“ se po setmění říká i jako pozdrav |
| `home.subline` | One small step a day. | Ein kleiner Schritt pro Tag. | Un pequeño paso al día. | věta pod pozdravem (kurzíva) | |
| `home.hero.habitsDone_one` | {{done}} of {{count}} habit done | {{done}} von {{count}} Routine erledigt | {{done}} de {{count}} hábito completado | hrdina pod číslem „3/5“ | *odvozeno*; `count` = naplánováno dnes (podstatné jméno se řídí celkem), `done` = splněno |
| `home.hero.habitsDone_other` | {{done}} of {{count}} habits done | {{done}} von {{count}} Routinen erledigt | {{done}} de {{count}} hábitos completados | hrdina pod číslem | lab: `habitsDone(done, total)` |
| `home.hero.arcHint` | Tap or slide along the arc | Tippe oder streiche über den Bogen | Toca o desliza a lo largo del arco | drobný řádek pod počtem (oblouk jde ťuknout) | |
| `home.hero.markerDone` | Done today | Heute erledigt | Hecho hoy | čtečka: značka návyku na oblouku | v laboratoři za jménem návyku |
| `home.hero.markerOpen` | Still to do | Noch offen | Pendiente | čtečka: značka nesplněného návyku | |
| `home.hero.xpToday` | +{{xp}} XP today | +{{xp}} XP heute | +{{xp}} XP hoy | zlatý čip v hrdinovi | číslo z `getTodayXP()` (O-9); lab: `xpChip` / `xpChipWord` |
| `home.hero.xpTodayLost` | −{{xp}} XP today | −{{xp}} XP heute | −{{xp}} XP hoy | čip v den, kdy je XP v součtu záporné | *odvozeno* jako `gamification.xp.amountLost` (E7, E9); znak „−“ (minus) |
| `home.hero.encouragement.allDone` | All done for today. Be proud of yourself. | Für heute alles erledigt. Sei stolz auf dich. | Todo hecho por hoy. ¡Qué orgullo! | povzbuzení pod čarou v hrdinovi (vždy 2 řádky místa, P79) | ES bez rodu („orgulloso/a“ by ho potřebovalo) |
| `home.hero.encouragement.freshStart` | A fresh start. Pick one small step. | Ein neuer Anfang. Wähle einen kleinen Schritt. | Un nuevo comienzo. Elige un pequeño paso. | povzbuzení, dokud není splněno nic | |
| `home.hero.encouragement.remaining_one` | One more to go. You’ve got this. | Noch eine. Du schaffst das. | Solo queda uno. Tú puedes. | povzbuzení, zbývá jeden | lab: `encouragement(remaining, done)` → `count` = zbývá |
| `home.hero.encouragement.remaining_other` | {{count}} more to go. You’ve got this. | Noch {{count}}. Du schaffst das. | Quedan {{count}}. Tú puedes. | povzbuzení, zbývá víc | |
| `home.hero.nothingPlanned` | *návrh* Nothing planned today. Enjoy the free day. | *návrh* Heute ist nichts geplant. Genieß den freien Tag. | Hoy no hay nada programado. Disfruta del día libre. | hrdina, když dnes žádný návyk není naplánovaný | laboratoř tenhle stav nemá – **viz otázka 2** |
| `home.journalCard.frozen` | Streak frozen | Serie eingefroren | Racha congelada | čip na kartě série (led) | `home.streakFrozen` má dlouhou větu s emoji – proto nový |
| `home.journalCard.warming` | Warming up… | Wird aufgewärmt… | Calentándose… | čip na kartě série při zahřívání | |
| `home.journalCard.entriesToday` | {{count}} of {{goal}} entries today | {{count}} von {{goal}} Einträgen heute | {{count}} de {{goal}} entradas hoy | řádek s tečkami na kartě série | lab má „3“ natvrdo → `{{goal}}` = denní cíl deníku; podstatné jméno se řídí cílem (3), proto bez tvarů |
| `home.journalCard.writeEntry` | Write an entry | Eintrag schreiben | Escribir una entrada | tlačítko na kartě série (i čtečka) | |
| `journal.streakDaysUnit_one` | day | Tag | día | malé slovo za velkým číslem série (Home; statistiky deníku v E13) | lab: `days` („days“ / „Tage“) bez jednotného čísla; „1 days“ by bylo špatně |
| `journal.streakDaysUnit_other` | days | Tage | días | jako výše | číslo se tiskne zvlášť (velké), klíč nese jen slovo |
| `home.stats.title` | Your habits | Deine Routinen | Tus hábitos | nadpis karty statistik (i název sekce v sheetu – viz otázka 4) | nahrazuje `home.habitStatistics` |
| `home.stats.periodDays_one` | {{count}} day | {{count}} Tag | {{count}} día | přepínač období | *odvozeno*; období jsou vždy 7 a 30 dní (`LENGTH`) |
| `home.stats.periodDays_other` | {{count}} days | {{count}} Tage | {{count}} días | přepínač „7 days / 30 days“ | lab: `periods.week` / `.month` napevno – číslo z konstanty |
| `home.stats.periodYear` | Year | Jahr | Año | přepínač „Year“ | |
| `home.stats.sameAsWeek` | Same as the week before | Wie die Woche davor | Igual que la semana anterior | věta vedle velkého „%“ (7 dní) | lab: `vsPrevious('same', …, 'week')` |
| `home.stats.betterThanWeek_one` | {{count}} point better than the week before | {{count}} Punkt besser als die Woche davor | {{count}} punto más que la semana anterior | věta vedle „%“ (7 dní, lepší) | `count` = procentní body |
| `home.stats.betterThanWeek_other` | {{count}} points better than the week before | {{count}} Punkte besser als die Woche davor | {{count}} puntos más que la semana anterior | jako výše | |
| `home.stats.lowerThanWeek_one` | {{count}} point lower than the week before | {{count}} Punkt schlechter als die Woche davor | {{count}} punto menos que la semana anterior | věta vedle „%“ (7 dní, horší) | |
| `home.stats.lowerThanWeek_other` | {{count}} points lower than the week before | {{count}} Punkte schlechter als die Woche davor | {{count}} puntos menos que la semana anterior | jako výše | |
| `home.stats.sameAsDays` | Same as the {{days}} days before | Wie die {{days}} Tage davor | Igual que los {{days}} días anteriores | věta vedle „%“ (30 dní) | lab má „30“ natvrdo → `{{days}}` z konstanty |
| `home.stats.betterThanDays_one` | {{count}} point better than the {{days}} days before | {{count}} Punkt besser als die {{days}} Tage davor | {{count}} punto más que los {{days}} días anteriores | věta vedle „%“ (30 dní, lepší) | |
| `home.stats.betterThanDays_other` | {{count}} points better than the {{days}} days before | {{count}} Punkte besser als die {{days}} Tage davor | {{count}} puntos más que los {{days}} días anteriores | jako výše | |
| `home.stats.lowerThanDays_one` | {{count}} point lower than the {{days}} days before | {{count}} Punkt schlechter als die {{days}} Tage davor | {{count}} punto menos que los {{days}} días anteriores | věta vedle „%“ (30 dní, horší) | |
| `home.stats.lowerThanDays_other` | {{count}} points lower than the {{days}} days before | {{count}} Punkte schlechter als die {{days}} Tage davor | {{count}} puntos menos que los {{days}} días anteriores | jako výše | |
| `home.stats.completed` | Completed | Erledigt | Completados | legenda grafu a fakt pod ním | `home.completed` má DE „Abgeschlossen“ a jiný význam (stará karta série) |
| `home.stats.ofPlanned` | {{done}} of {{planned}} | {{done}} von {{planned}} | {{done}} de {{planned}} | fakt „Completed 18 of 24“, panel dne, čtečka sloupce | |
| `home.stats.bonusCount_one` | {{count}} bonus | {{count}} Bonus | {{count}} extra | panel ťuknutého dne („3 of 5 · 1 bonus“), souhrn pro čtečku | *odvozeno* |
| `home.stats.bonusCount_other` | {{count}} bonus | {{count}} Bonus | {{count}} extras | jako výše | ES „3 bonificación“ nejde – navrhuji „extra(s)“ |
| `home.stats.restDay` | Nothing planned | Nichts geplant | Nada programado | panel dne bez plánu | `habits.dayStatus.none` (E6) říká „Not planned“ – jiná věta, jiné místo |
| `home.stats.activeDays_one` | {{active}} of {{count}} day active | {{active}} von {{count}} Tag aktiv | {{active}} de {{count}} día activo | věta vedle „%“ (rok) | *odvozeno*; nový uživatel může mít rok kratší než 365 dní |
| `home.stats.activeDays_other` | {{active}} of {{count}} days active | {{active}} von {{count}} Tagen aktiv | {{active}} de {{count}} días activos | jako výše | lab: `activeDays(active, total)` → `count` = dní v období |
| `home.stats.less` | Less | Weniger | Menos | legenda roku (stupnice) | |
| `home.stats.more` | More | Mehr | Más | legenda roku | |
| `home.insights.title` | Insights | Einblicke | Lo que destaca | nadpis karty Přehledy (i název sekce v sheetu) | ES *návrh* slova („Perspectivas“ je strojové) |
| `home.insights.period_one` | Last week | Letzte Woche | La última semana | vpravo v nadpisu karty | *odvozeno*; okno jsou 4 týdny |
| `home.insights.period_other` | Last {{count}} weeks | Letzte {{count}} Wochen | Últimas {{count}} semanas | vpravo v nadpisu karty | lab má „4“ natvrdo – číslo z výpočtu trendu; viz otázka 5 |
| `home.insights.trendUp_one` | Up {{count}} point | {{count}} Punkt besser | {{count}} punto más | řádek trendu (tučně) | *odvozeno* |
| `home.insights.trendUp_other` | Up {{count}} points | {{count}} Punkte besser | {{count}} puntos más | řádek trendu | lab: `trendUp(points)` |
| `home.insights.trendUpText` | You complete more of what you plan than a month ago. | Du schaffst mehr von dem, was du planst, als vor einem Monat. | Cumples más de lo que planeas que hace un mes. | řádek trendu (věta) | |
| `home.insights.strongest` | Strongest habit | Stärkste Routine | Tu hábito más sólido | řádek nejsilnějšího návyku | |
| `home.insights.strongestText` | {{name}} — {{rate}} % this month. | {{name}} – {{rate}} % in diesem Monat. | {{name}} — {{rate}} % este mes. | věta řádku | viz otázka 5 („this month“ × „Last 4 weeks“) |
| `home.insights.focus` | Worth a look | Einen Blick wert | Vale la pena revisarlo | řádek slabšího návyku (teplá barva) | |
| `home.insights.focusText` | {{name}} is at {{rate}} % this month. A lighter schedule might help. | {{name}} liegt bei {{rate}} % in diesem Monat. Ein leichterer Plan könnte helfen. | {{name}} va al {{rate}} % este mes. Un horario más ligero podría ayudar. | věta řádku | |
| `home.forYou.title` | For you | Für dich | Para ti | horní řádek karty Pro tebe (i název sekce v sheetu) | |
| `home.forYou.write` | Write it down | Aufschreiben | Escríbelo | tlačítko u doporučení deníku (nemají vlastní „action“) | doporučení návyků a cílů mají tlačítko z `home.recommendationCards.*.action` |
| `home.forYou.another` | Another suggestion | Anderer Vorschlag | Otra sugerencia | čtečka: kulaté tlačítko „další“ | |
| `home.forYou.position` | {{index}} of {{count}} | {{index}} von {{count}} | {{index}} de {{count}} | vpravo nahoře „1 of 3“ | `count` tu není množné číslo (jen počet), tvary netřeba |
| `home.customization.hint` | Drag to change the order. Your day always stays on top. | Ziehen, um die Reihenfolge zu ändern. Dein Tag bleibt immer oben. | Arrastra para cambiar el orden. Tu día siempre queda arriba. | věta pod nadpisem sheetu přizpůsobení | |
| `ui.dismiss` | Dismiss | Schließen | Cerrar | čtečka: křížek pruhu `ProblemNote` | lab: `system.dismiss`; Home je první obrazovka s pruhem |
| `ui.retrying` | Trying again… | Neuer Versuch… | Reintentando… | tlačítko pruhu během nového pokusu | lab: `system.retrying` |
| `journal.warmUp.frozenMessage_zero` | *návrh* All ads watched — your streak is warming up. | *návrh* Alle Werbungen angesehen – deine Serie wärmt sich auf. | Anuncios vistos: tu racha se está calentando. | věta karty, když je dluh zaplacený a plamen se zahřívá | nový tvar k přepsanému klíči (C níže) |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| řádek data nad pozdravem, měsíce a dny v grafech | `common.locale` | en-US / de-DE / es-ES | `toLocaleDateString` |
| „Today“ v hrdinovi a v panelu ťuknutého dne | `common.dates.today` | Today / Heute / Hoy | |
| bublina „+25 XP“ / „−25 XP“ u zaškrtávátka | `achievements.card.xpReward`, `gamification.xp.amountLost` | +{{xp}} XP / (nový z E7) | |
| zaškrtávátko pro čtečku | `habits.accessibility.markComplete` / `markIncomplete` | Mark habit as complete … | jméno návyku zůstává popiskem; DE dnes „Gewohnheit als erledigt markieren“ – v E5 zůstalo, srovnat v E26 nebo hned (DE „Routine als erledigt markieren“) |
| řádek rozvrhu pod jménem návyku | `habits.schedule.everyDay` (E5), `habits.schedule.weekdays` / `weekends` (E6) | Every day / Jeden Tag / Todos los días | ostatní rozvrhy = krátké dny z `toLocaleDateString` |
| kulaté tlačítko Síně trofejí (čtečka; laboratoř natvrdo „Trophies“) | `screens.trophyRoom.title` | Trophy Room / Trophäenzimmer / Sala de Trofeos | DE jméno – E8 otázka 1 |
| kulaté tlačítko přizpůsobení (laboratoř natvrdo „Customize“) a nadpis sheetu | `home.customization.title` | Customize Home / Startseite anpassen / Personalizar Inicio | „Home“ je jméno záložky, velké H zůstává |
| rychlé akce | `home.quickActions.addHabit`, `gratitude`, `selfPraise`, `addGoal` | Add Habit… / + Routine… / Añadir Hábito… | **hodnoty mění tabulka C** |
| nadpis sekce „Today’s habits“ (i název v sheetu) | `home.todayHabits` | Today's Habits / Heutige Gewohnheiten / Hábitos de Hoy | **C** |
| nadpis a čtečka karty série „Journal streak“ | `home.customization.componentNames.journalStreak` | Journal Streak / Serie / Racha del Diario | jeden klíč pro kartu i řádek sheetu; **C** |
| čip „Streak active“ | `home.streakActive` | Streak active! / Serie aktiv! / ¡Racha activa! | **C** (bez vykřičníku) |
| zpráva zamrzlé série | `journal.warmUp.frozenMessage_one` / `_other` | (s emoji ❄️➡️🔥) | **C** + tvar `_zero` v A |
| „1/2 ads“ u dnů dluhu | `journal.warmUp.adsProgress` | {{watched}}/{{total}} ads (všude) | |
| tlačítko „Warm up (1/2)“, po zaplacení „Warm-up complete“ | `journal.warmUp.warmUpButton`, `journal.warmUp.warmUpComplete` | Warm Up ({{current}}/{{total}}) / Warm Up Complete! ✓ | **C** |
| tiché „Start fresh“ a jeho potvrzení | `common.startFresh`, `journal.warmUp.startFresh.title` / `.message`, `common.cancel` | Start Fresh / Neu beginnen / Empezar de nuevo … | **C** (Title Case, „⚠️“ ve zprávě) |
| statistiky: „Bonus“ (legenda, fakt) | `habits.bonus` | Bonus / Bonus / Bonificación | |
| statistiky: „Planned“ (legenda) | `habits.dayStatus.planned` | (nový z E6) | |
| statistiky: „Best day“ + krátký den | `home.habitStats.bestDay` | Best Day / Bester Tag / Mejor Día | **C** |
| Pro tebe: nadpis, věta, otázka k zápisu, tlačítko | `home.recommendationCards.<oblast>.<typ>.title` / `.description` / `.prompt` / `.action` | (10 karet) | laboratoř je bere přes `getFixedT`; **titulky a tlačítka mění C** |
| sheet přizpůsobení: názvy sekcí | `home.customization.componentNames.quickActions`, `journalStreak`, `monthlyChallenges` + nadpisy karet (`home.todayHabits`, `home.stats.title`, `home.insights.title`, `home.forYou.title`) | Quick Actions / Aktionen / Acciones Rápidas … | **viz otázka 4**; `componentNames.habitStats` a `.recommendations` se pak nečtou (smazat v E26) |
| „Reset to defaults“ v sheetu | `home.customization.resetToDefaults` | Reset to Defaults / Auf Standard zurücksetzen / Restaurar Valores Predeterminados | **C**; bez potvrzení (7.9) – `resetTitle` / `resetMessage` se přestanou číst |
| ťuknutí vedle sheetu (čtečka) | `common.close` | Close / Schließen / Cerrar | |
| pruh `ProblemNote`: „Try again“ | `common.tryAgain` | Try Again / Nochmal / Reintentar | dnes ho nic nečte; **C** podle laboratoře |
| pruh: změna Home se neuložila (7.9) | `home.customization.errors.visibilityFailed` | Failed to update component visibility… | **C** |
| pruh: chyba záchrany série (D-11) | `journal.rescue.adDismissed.message`, `journal.rescue.adLoadFailed.message`, `journal.rescue.adError.message`, `journal.rescue.resetFailed.message` | „…Please try again.“ / „Please contact support.“ | **C**; nadpisy `*.title` pruh nepotřebuje – viz otázka 6 |

### C. Existující klíč, nová hodnota

| Klíč | EN (nově) | DE (nově) | ES (nově) | Dnes / proč |
|---|---|---|---|---|
| `home.quickActions.addHabit` | Add habit | Neue Routine | Añadir hábito | dnes Add Habit / + Routine / Añadir Hábito; DE podle laboratoře – **viz otázka 3** |
| `home.quickActions.gratitude` | = | Dankbarkeit | = | dnes DE „Dank“ |
| `home.quickActions.selfPraise` | Self-praise | Selbstlob | = | dnes Self-Praise / Lob |
| `home.quickActions.addGoal` | Add goal | Neues Ziel | Añadir meta | dnes Add Goal / + Ziel / Añadir Meta |
| `home.todayHabits` | Today’s habits | Heutige Routinen | Hábitos de hoy | Title Case; „Gewohnheiten“ → „Routinen“ (laboratoř) |
| `home.customization.componentNames.quickActions` | Quick actions | Schnellaktionen | Acciones rápidas | dnes DE „Aktionen“ (zkratka ze staré úzké mřížky); viz otázka 4 |
| `home.customization.componentNames.journalStreak` | Journal streak | Tagebuch-Serie | Racha del diario | = laboratoř `journalStreak`; dnes DE jen „Serie“ |
| `home.customization.componentNames.monthlyChallenges` | Monthly challenge | Monatliche Herausforderung | Desafío mensual | dnes DE „Monatsziel“ (= měsíční cíl, jiná věc); výzva je jedna za měsíc; ⚠ DE +53 % – řádek sheetu je jednořádkový, vejde se |
| `home.customization.resetToDefaults` | Reset to defaults | = | Restaurar valores predeterminados | Title Case; ⚠ DE +47 % (tiché tlačítko pod seznamem, místa dost) |
| `home.customization.errors.visibilityFailed` | Your change to Home wasn’t saved. | Deine Änderung an der Startseite wurde nicht gespeichert. | Tu cambio en Inicio no se guardó. | pruh místo `Alert` (7.9); přepínač se vrátí; platí i pro přeřazení a obnovení; ⚠ DE +73 % (pruh má dva řádky) |
| `home.streakActive` | Streak active | Serie aktiv | Racha activa | = laboratoř; vykřičník v čipu křičí |
| `home.habitStats.bestDay` | Best day | = | Mejor día | Title Case |
| `journal.warmUp.frozenMessage_one` | Your streak is frozen. One short ad warms it up again. | Deine Serie ist eingefroren. Eine kurze Werbung wärmt sie wieder auf. | Tu racha está congelada. Un anuncio corto la vuelve a calentar. | **chyba dneška:** tvar se řídí dny (`count`), ale věta mluví o reklamách (`adsNeeded`) → „frozen for 2 days. Watch 1 ads“. Nově `count` = zbývající reklamy, dny ukazuje řada vloček; emoji ❄️➡️🔥 pryč |
| `journal.warmUp.frozenMessage_other` | Your streak is frozen. {{count}} short ads — one for each missed day — warm it up again. | Deine Serie ist eingefroren. {{count}} kurze Werbungen – eine pro verpasstem Tag – wärmen sie wieder auf. | Tu racha está congelada. {{count}} anuncios cortos —uno por cada día perdido— la vuelven a calentar. | jako výše; parametr `adsNeeded` zaniká |
| `journal.warmUp.warmUpButton` | Warm up ({{current}}/{{total}}) | = | = | Title Case |
| `journal.warmUp.warmUpComplete` | Warm-up complete | Aufwärmen abgeschlossen | Calentamiento completado | bez „! ✓“ – tlačítko má ikonu fajfky; ⚠ DE +44 % |
| `common.startFresh` | Start fresh | = | = | Title Case |
| `journal.warmUp.startFresh.title` | Start fresh? | = | = | Title Case |
| `journal.warmUp.startFresh.message` | This will permanently reset your current streak to 0. You can start fresh without warming up your frozen streak. This action cannot be undone. | Dies setzt deine aktuelle Serie dauerhaft auf 0 zurück. Du kannst neu beginnen, ohne deine eingefrorene Serie aufzuwärmen. Diese Aktion kann nicht rückgängig gemacht werden. | Esto restablecerá permanentemente tu racha actual a 0. Puedes empezar de nuevo sin calentar tu racha congelada. Esta acción no se puede deshacer. | jen bez „⚠️ “ na začátku – `ConfirmSheet` má vlastní ikonu |
| `common.tryAgain` | Try again | Erneut versuchen | Reintentar | = laboratoř `system.retry`; dnes Try Again / Nochmal |
| `journal.rescue.adDismissed.message` | The ad didn’t finish, so this day is still frozen. | Die Werbung lief nicht bis zum Ende – der Tag bleibt eingefroren. | El anuncio no terminó, así que este día sigue congelado. | *návrh*; pruh + „Try again“; bez „Please“ |
| `journal.rescue.adLoadFailed.message` | No ad is available right now. Your streak stays frozen and safe. | Gerade ist keine Werbung verfügbar. Deine Serie bleibt eingefroren und sicher. | Ahora mismo no hay anuncios. Tu racha sigue congelada y a salvo. | *návrh* |
| `journal.rescue.adError.message` | Something stopped the ad. Your streak stays frozen and safe. | Etwas hat die Werbung unterbrochen. Deine Serie bleibt eingefroren und sicher. | Algo interrumpió el anuncio. Tu racha sigue congelada y a salvo. | *návrh* |
| `journal.rescue.resetFailed.message` | Your streak wasn’t reset. Nothing has changed. | Deine Serie wurde nicht zurückgesetzt. Es hat sich nichts geändert. | Tu racha no se reinició. No ha cambiado nada. | *návrh*; dnes „Please contact support.“ (žádná podpora v appce není); ⚠ DE +46 % |
| `home.recommendationCards.habits.adjustSchedule.title` | Adjust schedule | = | Ajustar horario | Title Case |
| `home.recommendationCards.habits.adjustSchedule.action` | Adjust schedule | = | Ajustar horario | Title Case |
| `home.recommendationCards.habits.levelUp.title` | Level up | Eine Stufe höher | = | DE dnes anglicky „Level Up“ |
| `home.recommendationCards.habits.levelUp.action` | Add a challenge | = | Añadir desafío | Title Case; ⚠ DE +73 % („Herausforderung hinzufügen“ – tlačítko na celou šířku karty) |
| `home.recommendationCards.habits.addNewHabit.title` | Add a new habit | Neue Routine hinzufügen | Añadir un nuevo hábito | DE „Gewohnheit“ → „Routine“; ⚠ DE +53 % |
| `home.recommendationCards.habits.addNewHabit.description` | = | Du machst das großartig mit deinen Routinen! {{successfulDays}} sind deine stärksten Tage. | = | DE „Gewohnheiten“ → „Routinen“ |
| `home.recommendationCards.habits.addNewHabit.action` | Create habit | Routine erstellen | Crear hábito | DE „Gewohnheit“; = `habits.composer.create` (E6) |
| `home.recommendationCards.journal.buildStreak.title` | Build your streak | Bau deine Serie auf | Construye tu racha | DE dnes „Baue deinen Streak auf“ (anglicismus) |
| `home.recommendationCards.journal.onFire.title` | You’re on fire! | Du bist richtig in Fahrt! | = | DE dnes „Du bist on Fire!“; ⚠ DE +67 % |
| `home.recommendationCards.journal.trySelfPraise.title` | Try self-praise | Versuch es mit Selbstlob | Prueba el autoelogio | Title Case; DE „Versuche Selbstlob“ zní strojově; ⚠ DE +60 % |
| `home.recommendationCards.goals.startProgress.title` | Start making progress | Mach den ersten Schritt | Empieza a avanzar | DE dnes „Beginne mit Fortschritt“ |
| `home.recommendationCards.goals.startProgress.action` | Log progress | Fortschritt eintragen | Registrar progreso | DE „protokollieren“ → „eintragen“ jako v novém zápisu (E14) |
| `home.recommendationCards.goals.almostThere.title` | Almost there! | = | ¡Casi lo logras! | Title Case |
| `home.recommendationCards.goals.almostThere.action` | Final push | = | Empujón final | Title Case |
| `home.recommendationCards.goals.timelineCheck.title` | Timeline check | Termin prüfen | Revisión de plazos | DE dnes „Zeitplan-Check“ |
| `home.recommendationCards.goals.timelineCheck.action` | Adjust timeline | Termin anpassen | Ajustar plazos | Title Case; DE „Termin“ jako v Cílech |
| `home.recommendationCards.goals.timelineCheck.description_one` | {{goalTitle}} may need timeline adjustment. {{count}} day remaining. | {{goalTitle}} benötigt möglicherweise eine Zeitplananpassung. Noch {{count}} Tag. | {{goalTitle}} puede necesitar ajuste de plazos. Queda {{count}} día. | **chyba dneška:** „1 days remaining“ – nahrazuje `.description` s `{{daysRemaining}}`; parametr se přejmenuje na `count` (`RecommendationEngine`) |
| `home.recommendationCards.goals.timelineCheck.description_other` | {{goalTitle}} may need timeline adjustment. {{count}} days remaining. | {{goalTitle}} benötigt möglicherweise eine Zeitplananpassung. Noch {{count}} Tage. | {{goalTitle}} puede necesitar ajuste de plazos. Quedan {{count}} días. | jako výše |
| `home.recommendationCards.goals.setNewGoal.title` | Set a new goal | = | Establecer nueva meta | Title Case |
| `home.recommendationCards.goals.setNewGoal.action` | Create goal | = | Crear meta | Title Case |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Pozdrav v noci.** Laboratoř říká 0–5 h „Good night / Gute Nacht“ – v EN i DE je to ale rozloučení („dobrou noc“), ne pozdrav. Hranice hodin pozdravu (5 / 12 / 18) se navíc liší od `getDaypart` (barvy nebe: 5 / 11 / 17 / 22).
   **Doporučuji:** pozdrav má vlastní hranice podle řeči (odpoledne začíná v poledne), nebe zůstane na `getDaypart`. Mezi 18 a 5 h jeden večerní pozdrav („Good evening / Guten Abend / Buenas noches“) a klíč `home.greeting.night` vypustit – zbudou tři.
2. **Prázdné stavy Home – laboratoř je nemá.** (a) Den bez naplánovaného návyku: hrdina ukáže „0 / 0“ a „All done for today. Be proud of yourself.“ – pochvala za nic. (b) Série deníku 0: čip „Streak active“ lže. (c) Nový uživatel bez dat: karta statistik ukáže „0 %“.
   **Doporučuji:** (a) místo řádku počtu a povzbuzení věta `home.hero.nothingPlanned` (A); (b) čip existující `home.startToday` („Start today / Heute beginnen / Comenzar hoy“); (c) kartu statistik skrýt, dokud není první naplánovaný den – stejně jako se skryjí Přehledy a Pro tebe bez faktů.
3. **Rychlé akce v němčině.** Appka má „+ Routine / Dank / Lob / + Ziel“, laboratoř „Neue Routine / Dankbarkeit / Selbstlob / Neues Ziel“.
   **Doporučuji laboratoř** (tabulka C): dlaždice má dva řádky místa, celá slova se čtou líp než „+“ a „Lob“.
4. **Názvy sekcí v sheetu přizpůsobení.** Dnes se sekce v sheetu jmenují jinak než karty na Home („Habit Statistics / Statistik“ × karta „Your habits“, „Recommendations / Tipps“ × „For you“, DE „Monatsziel“ u výzvy).
   **Doporučuji:** sekce se v sheetu jmenuje přesně jako nadpis své karty – u karet s nadpisem se přečte ten (`home.stats.title`, `home.insights.title`, `home.forYou.title`, `home.todayHabits`), zbylé tři opraví tabulka C.
5. **Přehledy: klesající trend a „this month“.** Laboratoř má jen „Up 12 points“; dnešní `HabitTrendAnalysis` umí i pokles a stagnaci. A karta nahoře říká „Last 4 weeks“, řádky pod ní „this month“.
   **Doporučuji:** řádek trendu ukázat jen při růstu (pokles pokryje laskavý řádek „Worth a look“ – žádná druhá špatná zpráva). Období v nadpisu i ve větách vzít z výpočtu, který fakta skutečně počítá: když je to 30 dní, nadpis „Last 30 days“ (stejná věta jako `journal.stats.lastDays_*` v E13 – klíč by pak vznikl už tady) a z vět vypustit „this month“.
6. **Okna úspěchu záchrany série.** Dnes po zahřátí vyskočí okno („🎉 Streak Rescued!“, „Issue Resolved“, „No Debt“ …). V laboratoři je potvrzením sám plamen (led → zahřátí → oheň + jeden hmatový signál), chyby jdou do pruhu.
   **Doporučuji:** okna úspěchu zrušit (plamen je potvrzení), chyby reklamy a „Start fresh“ jako pruh se čtyřmi větami z C, technické větve (`technicalIssue*`, `criticalError`, `autoFixed`, `issueResolved`, `noDebt`) bez okna – logika v hooku zůstane, jen nic nevyskakuje; kdyby zahřátí opravdu selhalo, ukáže se pruh `adError`. Klíče oken se smažou v E26.

---

## E12 – Deník

Karta „Dnes“ (počet, tři dílky, plamen, bonusová cesta ⭐🔥👑), dvě dlaždice zápisu, zámek zamrzlé série se zahřátím přímo v Deníku, citát dne, dnešní záznamy s „⋯“ a jeden sheet pro psaní i úpravu nad klávesnicí.
*Kulisy se nepřevádějí: „An ad would play here“ (`adPlaying`, simulace reklamy) a „Tap the flame…“ za nejdelší sérií (`flameHint`). Okno ⭐🔥👑 je v E10.*

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `journal.subline` | Three good things a day. | Drei gute Dinge am Tag. | Tres cosas buenas al día. | věta pod nadpisem obrazovky | |
| `journal.write.gratitudeHint` | Something good today | Etwas Gutes heute | Algo bueno de hoy | dlaždice Vděčnost, pod názvem | |
| `journal.write.selfPraiseHint` | Something you did well | Etwas, das du gut gemacht hast | Algo que hiciste bien | dlaždice Sebechvála, pod názvem | ⚠ DE +36 % (dva řádky místa, vejde se) |
| `journal.bonusRoad.title` | Bonus road | Bonusweg | Camino de bonificación | horní řádek bonusové cesty (po třetím záznamu) | |
| `journal.bonusRoad.toNext_one` | {{count}} more to | Noch {{count}} bis | Falta {{count}} para | vpravo v řádku cesty, **za textem ikona** ⭐/🔥/👑 (`InlineIcon`) | lab: `toNextMilestone(left)`; tvary kvůli ES |
| `journal.bonusRoad.toNext_other` | {{count}} more to | Noch {{count}} bis | Faltan {{count}} para | jako výše | čtečka: text + jméno ikony (`journal.iconNames.*`) |
| `journal.bonusRoad.allCollected` | Every milestone of the day collected. | Alle Meilensteine des Tages gesammelt. | Todos los hitos del día conseguidos. | místo „N more to“ po 13. záznamu | |
| `journal.entryCount_one` | {{count}} entry | {{count}} Eintrag | {{count}} entrada | vpravo u nadpisu „Today“; v E13 kalendář, čip dne, graf | lab: `entries(count)` má „1 entry“ natvrdo |
| `journal.entryCount_other` | {{count}} entries | {{count}} Einträge | {{count}} entradas | jako výše | |
| `journal.writingLocked` | Writing opens again once your streak is warm. | Schreiben geht wieder, sobald deine Serie aufgewärmt ist. | Podrás volver a escribir en cuanto tu racha esté caliente. | věta pod tlačítky zahřátí (zamčené dlaždice, R-14) | |
| `journal.composer.anotherPrompt` | Another prompt | Andere Frage | Otra pregunta | čtečka: tlačítko „zamíchat“ u otázky v sheetu | |
| `journal.quote.another` | Another quote | Anderes Zitat | Otra cita | čtečka: tlačítko „obnovit“ na citátu dne | |
| `journal.iconNames.star` | star | Stern | estrella | čtečka: ikona ⭐ uvnitř textu („+25 XP star“, „1 more to star“) | `InlineIcon` nemá hlas; lab: `iconNames` |
| `journal.iconNames.flame` | flame | Flamme | llama | jako výše (🔥) | |
| `journal.iconNames.crown` | crown | Krone | corona | jako výše (👑) | |
| `help.topics.journalDay` | How the journal day works | So funktioniert der Tagebuch-Tag | Cómo funciona el día del diario | čtečka: tiché „i“ u „Today“ na kartě | nahrazuje bublinu `help.journal.selfRiseStreak` (7.10) |
| `help.topics.frozen` | How a frozen streak works | So funktioniert eine eingefrorene Serie | Cómo funciona una racha congelada | čtečka: tiché „i“ na kartě zamrzlé série | nahrazuje bublinu `help.journal.debtRecovery` (7.10); ⚠ DE +56 % (jen čtečka) |
| `help.rules.three.title` | Three entries keep your streak | Drei Einträge halten deine Serie | Tres entradas mantienen tu racha | okno nápovědy `journalDay` (a v E22 stránka pravidel) | jeden zdroj pro okno i stránku (P76) |
| `help.rules.three.text` | Write three a day and the streak grows by one. Each of the three earns {{perEntry}} XP. | Schreib drei am Tag und die Serie wächst um eins. Jeder der drei bringt {{perEntry}} XP. | Escribe tres al día y la racha crece en uno. Cada una de las tres da {{perEntry}} XP. | okno nápovědy `journalDay` | `perEntry` = `XP_REWARDS.JOURNAL.FIRST_ENTRY` |
| `help.rules.bonus.title` | Writing more pays a bonus | Mehr schreiben bringt einen Bonus | Escribir más tiene premio | okno nápovědy `journalDay` (s obrázkem cesty) | |
| `help.rules.bonus.text` | Entries 4, 8 and 13 of a day add +{{star}}, +{{flame}} and +{{crown}} XP. Entries 4 to 13 earn {{each}} XP each; after the 13th, nothing more. | Die Einträge 4, 8 und 13 eines Tages bringen +{{star}}, +{{flame}} und +{{crown}} XP. Die Einträge 4 bis 13 bringen je {{each}} XP, nach dem 13. nichts mehr. | Las entradas 4, 8 y 13 del día suman +{{star}}, +{{flame}} y +{{crown}} XP. De la 4 a la 13 dan {{each}} XP cada una; a partir de la 14, nada más. | okno nápovědy `journalDay` | čísla XP z `XP_REWARDS.JOURNAL` (`*_BONUS_MILESTONE`, `BONUS_ENTRY`); pozice 4 / 8 / 13 jsou součást pravidla a stojí v textu jako v laboratoři |
| `help.rules.frozen.title` | A missed day freezes the streak | Ein verpasster Tag friert die Serie ein | Un día perdido congela la racha | okno nápovědy `frozen` | |
| `help.rules.frozen.text` | It doesn’t break. Watch one short ad for each missed day, up to {{maxDays}} days, and it carries on. Or start fresh. New entries wait until you decide. | Sie bricht nicht ab. Sieh dir für jeden verpassten Tag eine kurze Werbung an, bis zu {{maxDays}} Tage, und sie geht weiter. Oder fang neu an. Neue Einträge warten, bis du dich entscheidest. | No se rompe. Mira un anuncio corto por cada día perdido, hasta {{maxDays}} días, y la racha sigue. O empieza de nuevo. Las entradas nuevas esperan hasta que decidas. | okno nápovědy `frozen` | `maxDays` = `MAX_DEBT_DAYS` – laboratoř ho má jako vlastní konstantu 3, při převodu dát do `src/constants` a ověřit proti úložišti (zastavit, liší-li se) |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| nadpis obrazovky | `journal.title` | My Journal / Tagebuch / Mi Diario | |
| řádek data nad nadpisem | `common.locale` | en-US / de-DE / es-ES | |
| tlačítka vpravo nahoře (čtečka) | `journal.history`, `journal.statistics` | History / Historie / Historial · Statistics / Statistiken / Estadísticas | stejná tlačítka dole na stránce zmizí (P35) |
| „Today“ (karta i nadpis seznamu) | `journal.today` | Today / Heute / Hoy | |
| stav pod počtem: „2 more entries needed“ | `journal.progress.entriesNeeded_one` / `_other` | (všechny tři) | |
| stav po třetím / po bonusovém záznamu | `journal.progress.dailyComplete`, `journal.progress.bonusAmazing` | …alive! 🔥 / …entries! 🌟 | **C** (emoji pryč) – viz otázka 1 |
| pod číslem série; čtečka plamene | `journal.currentStreak`, `journal.frozenStreak` | Current Streak / Frozen Streak … | **C** |
| „Longest streak · 31“ | `journal.longestStreak` | Longest Streak / Längste Serie / Racha Más Larga | **C**; za číslem v appce nic (věta laboratoře o plameni je kulisa) |
| řádek ⭐🔥👑 dole na kartě (otevře statistiky) | `journal.stats.milestoneBadges` | Milestone Badges / Meilenstein-Abzeichen / Insignias de hitos | **C** |
| dlaždice zápisu (čtečka) a jejich název | `journal.input.addGratitudeTitle` / `addSelfPraiseTitle`, `journal.input.typeGratitude` / `typeSelfPraise` | Add Gratitude… / Gratitude, Self-Praise … | **C** |
| „+25“ na dlaždici, „+25 XP“ v sheetu | `achievements.card.xpReward` | +{{xp}} XP | na dlaždici jen číslo; čtečka „+25 XP star“ = klíč + `journal.iconNames.*` |
| karta zamrzlé série: nadpis, zpráva, dny dluhu, tlačítka, potvrzení | `journal.warmUp.title`, `journal.warmUp.frozenMessage_*`, `adsProgress`, `warmUpButton`, `warmUpComplete`, `common.startFresh`, `journal.warmUp.startFresh.*` | (E11 C) | stejná komponenta jako na Home (`WarmUpControls`); `journal.warmUp.title` mění C |
| tiché „i“ → „All the rules“ | `help.allRules` | (nový z E6) | |
| citát dne: nadpis, kategorie | `home.dailyQuote`, `home.quoteCategories.*` | Daily Inspiration / Tägliche Inspiration / Inspiración Diaria … | `home.dailyQuote` mění **C** |
| prázdný den | `journal.empty.title` / `.body` | What went well today? … | |
| štítek bonusového záznamu | `gratitude.bonus.label` | BONUS ⭐ / BONUS ⭐ / BONIFICACIÓN ⭐ | **C**; u 4. / 8. / 13. záznamu stojí před slovem ikona milníku |
| „⋯“ na záznamu (čtečka; laboratoř „Edit / Delete“) | `habits.list.more` | More / Mehr / Más opciones | stejně jako „⋯“ na kartě návyku (E5); řádky nabídky `common.edit` / `common.delete`, zavření `common.cancel` |
| potvrzení smazání | `journal.deleteConfirm.title` / `.message` / `.gratitude` / `.selfPraise`, `common.delete` | Delete Journal Entry … | `title` mění **C** |
| sheet: přepínač typu, otázky, bonusový řádek | `journal.input.typeGratitude` / `typeSelfPraise`, `journal.input.gratitudePlaceholders` / `selfPraisePlaceholders` / `defaultPlaceholder`, `journal.bonusGratitude` + `journal.input.optional` | … / Bonus Entry (optional) … | `journal.bonusGratitude` mění **C** |
| sheet úpravy: nadpis, pole, tlačítka | `gratitude.edit.title`, `journal.editPlaceholder`, `common.add` / `common.save`, `common.cancel` | Edit Journal Entry / Add · Save … | `gratitude.edit.title`, `common.add` mění **C** |
| třesení pole (prázdné / krátké) | `journal.input.emptyError`, `journal.input.minLengthError` | Please enter your gratitude / Gratitude must be at least 3 characters long | **C** – dnes mluví o vděčnosti i u sebechvály |
| okno ⭐🔥👑 | `journal.bonusMilestone*_title` / `_text`, `achievements.celebration.continue_button` | (E10) | |
| pruh: záznam se neuložil (nový i úprava, 7.9) | `common.errors.gratitude.failedToSave` | Failed to save gratitude / Speichern fehlgeschlagen / … | **C**; nahrazuje i chybný `journal.export.error` v `EditGratitudeModal` |

### C. Existující klíč, nová hodnota

| Klíč | EN (nově) | DE (nově) | ES (nově) | Dnes / proč |
|---|---|---|---|---|
| `journal.progress.dailyComplete` | Daily journal complete! Keep your streak alive! | Tagebuch heute abgeschlossen! Halte deine Serie am Leben! | ¡Diario completado hoy! ¡Mantén tu racha viva! | jen bez „🔥“ (E12 bod 7) – viz otázka 1 |
| `journal.progress.bonusAmazing` | Amazing! You've added bonus entries! | Fantastisch! Du hast Bonus-Einträge hinzugefügt! | ¡Increíble! ¡Has agregado entradas bonus! | jen bez „🌟“ – viz otázka 1 |
| `journal.currentStreak` | Current streak | = | Racha actual | Title Case |
| `journal.frozenStreak` | Frozen streak | = | Racha congelada | Title Case |
| `journal.longestStreak` | Longest streak | = | Racha más larga | Title Case |
| `journal.stats.milestoneBadges` | Milestone badges | = | = | Title Case |
| `journal.input.addGratitudeTitle` | Add gratitude | = | = | Title Case; ⚠ DE +69 % (jen čtečka dlaždice) |
| `journal.input.addSelfPraiseTitle` | Add self-praise | = | = | Title Case |
| `journal.input.typeSelfPraise` | Self-praise | = | = | = laboratoř (rychlá akce na Home) |
| `journal.warmUp.title` | Warm up your streak | = | = | Title Case |
| `home.dailyQuote` | Daily inspiration | = | Inspiración diaria | Title Case |
| `gratitude.bonus.label` | BONUS | BONUS | BONUS | bez „⭐“: dnes hvězdu nese **každý** bonusový záznam, i když ⭐ je jen 4. záznam; ES „BONIFICACIÓN“ se do 10pt štítku nevejde a „bonus“ appka v ES už používá |
| `journal.bonusGratitude` | Bonus entry | = | Entrada de bonificación | Title Case; ES „Entrada Bonus“ → slovník appky |
| `gratitude.edit.title` | Edit journal entry | = | Editar entrada del diario | Title Case; ⚠ DE +44 % |
| `common.add` | = | Hinzufügen | = | DE dnes „+ Neu“ – na hlavním tlačítku sheetu nedává smysl (čte ho jen `GratitudeInput`, který sheet nahradí) |
| `journal.deleteConfirm.title` | Delete journal entry | = | = | Title Case |
| `journal.input.emptyError` | Write a few words first. | Schreib zuerst ein paar Worte. | Escribe unas palabras primero. | dnes „Please enter your gratitude“ i u sebechvály |
| `journal.input.minLengthError` | Write at least {{min}} characters. | Schreib mindestens {{min}} Zeichen. | Escribe al menos {{min}} caracteres. | dnes „Gratitude must be at least 3 characters long“; `{{min}}` = 3 z validace (žádné opsané číslo) |
| `common.errors.gratitude.failedToSave` | Your entry wasn’t saved. What you wrote is still there. | Dein Eintrag wurde nicht gespeichert. Was du geschrieben hast, ist noch da. | Tu entrada no se guardó. Lo que escribiste sigue ahí. | pruh místo `ErrorModal` (7.9); sheet zůstane otevřený s textem; věta podle laboratoře `system.saveFailed`; ⚠ DE +36 % |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Věty pod počtem dne.** „Daily journal complete! Keep your streak alive!“ a „Amazing! You've added bonus entries!“ – dva vykřičníky na řádek, zatímco celý Deník v novém vzhledu mluví klidně a oslavu dne dělá zezelenání dílků (R-13). Tabulka C zatím jen odebírá emoji.
   **Doporučuji** klidnější věty: „Today’s three are done — your streak grows.“ / „Die drei für heute sind geschafft – deine Serie wächst.“ / „Las tres de hoy, hechas: tu racha crece.“ a pro bonus „Every extra entry is a bonus.“ / „Jeder weitere Eintrag ist ein Bonus.“ / „Cada entrada extra es una bonificación.“

---

## E13 – Historie a statistiky deníku

Historie jako měsíční kalendář (tvar dne, stuha série, ❄ dny zachráněné reklamou), panel vybraného dne s ‹ ›, hledání se zvýrazněním; statistiky se sérií, čtyřmi čísly, grafem posledních 30 dní, poměrem typů a ⭐🔥👑.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `journal.calendar.legendComplete` | {{goal}}+ entries | {{goal}}+ Einträge | {{goal}}+ entradas | legenda kalendáře historie a grafu statistik | lab: „3+ entries“ natvrdo → `{{goal}}` = denní cíl |
| `journal.calendar.legendBonus` | Bonus day | Bonustag | Día de bonificación | legenda (plný kruh s ★) | |
| `journal.calendar.legendPartial` | Started | Begonnen | Empezado | legenda (čárkovaný kruh) | |
| `journal.calendar.legendPaid` | Saved with an ad | Mit Werbung gerettet | Salvado con un anuncio | legenda (❄) | |
| `journal.calendar.paidDay` | Frozen day — saved with an ad, the streak went on | Eingefrorener Tag – mit Werbung gerettet, die Serie lief weiter | Día congelado: salvado con un anuncio, la racha siguió | věta v panelu dne zaplaceného reklamou | den z `warmUpPayments` |
| `journal.history.previousDay` | *návrh* Previous day | *návrh* Vorheriger Tag | Día anterior | čtečka: ‹ v panelu dne | laboratoř čte jen znak „‹“ |
| `journal.history.nextDay` | *návrh* Next day | *návrh* Nächster Tag | Día siguiente | čtečka: › v panelu dne | laboratoř čte jen „›“ |
| `journal.history.clearSearch` | *návrh* Clear search | *návrh* Suche löschen | Borrar búsqueda | čtečka: křížek v poli hledání | laboratoř tu má `common.close` |
| `journal.stats.milestoneStar` | 4th entry of a day | 4. Eintrag eines Tages | 4.ª entrada del día | pod medailí ⭐ ve statistikách | lab: `milestoneMeaning.star` |
| `journal.stats.milestoneFlame` | 8th entry of a day | 8. Eintrag eines Tages | 8.ª entrada del día | pod medailí 🔥 | |
| `journal.stats.milestoneCrown` | 13th entry of a day | 13. Eintrag eines Tages | 13.ª entrada del día | pod medailí 👑 | |
| `journal.stats.best_one` | Best: {{count}} day | Beste: {{count}} Tag | Mejor: {{count}} día | pod číslem série, když nejde o rekord | **nahrazuje `journal.stats.best`** („Best: 1 days“) – parametr `days` → `count` |
| `journal.stats.best_other` | Best: {{count}} days | Beste: {{count}} Tage | Mejor: {{count}} días | jako výše | |
| `journal.stats.lastDays_one` | Last {{count}} day | Letzter {{count}} Tag | Último {{count}} día | nadpis grafu | *odvozeno*; graf má vždy 30 dní, tvar se nezobrazí |
| `journal.stats.lastDays_other` | Last {{count}} days | Letzte {{count}} Tage | Últimos {{count}} días | nadpis grafu „Last 30 days“ | lab: `last30` natvrdo; `home.last30Days` je jiná věta starého grafu |
| `journal.stats.chartAtGoal` | of {{total}} days at the daily goal | von {{total}} Tagen mit Tagesziel | de {{total}} días con el objetivo diario | věta za velkým číslem v grafu („18 of 30 days…“) | ES „objetivo“, ne „meta“ (= Cíle) |
| `journal.stats.chartAvg` | {{avg}} entries a day on average | Ø {{avg}} Einträge pro Tag | {{avg}} entradas al día en promedio | drobný řádek pod ním | `avg` je desetinné číslo podle jazyka („2,4“) → vždy množné |
| `journal.stats.chartHint` | Tap or slide across the bars | Tippe oder streiche über die Balken | Toca o desliza sobre las barras | řádek nad grafem, dokud není vybraný sloupec | |
| `journal.stats.dailyGoal` | Daily goal | Tagesziel | Objetivo diario | legenda grafu „Daily goal (3)“ | číslo v závorce z konstanty |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| horní řádek obou stránek | `journal.title` | My Journal / Tagebuch / Mi Diario | |
| nadpis historie | `journal.historyTitle` | Journal History / Tagebuch-Verlauf / Historial del diario | **C** |
| křížek stránky (čtečka) | `common.close` | Close / Schließen / Cerrar | |
| pole hledání, výsledky, nic nenalezeno | `journal.searchPlaceholder`, `journal.searchResults_one` / `_other`, `journal.noSearchResults` | Search journal entries... / Found {{count}} result… | výsledky dál ve `FlatList` |
| prázdný den v panelu | `journal.emptyHistory` | No journal entries for {{date}}. | |
| čip „Today“ v hlavičce měsíce, „Today“ pod grafem | `journal.today` | Today / Heute / Hoy | |
| ‹ › u měsíce (čtečka) | `habits.detail.previousMonth` / `nextMonth` | (nové z E6) | doporučuji je při zápisu E6 dát do `common.*` – čtou je tři obrazovky (detail návyku, historie, kalendář termínu v E15) |
| měsíc a rok, „Tue 12 Nov“, písmena dnů | `common.locale` | en-US / de-DE / es-ES | `toLocaleDateString`; písmena dnů `weekday: 'narrow'` |
| počet záznamů dne (čip, čtečka dne, bublina grafu) | `journal.entryCount_one` / `_other` | (nové z E12) | čtečka dne zaplaceného reklamou přidá `journal.calendar.legendPaid` |
| karta záznamu, „⋯“, potvrzení smazání | klíče z E12 | | |
| nadpis statistik | `journal.stats.title` | Journal Statistics / Tagebuch-Statistiken / Estadísticas del diario | **C** |
| série: horní řádek, slovo za číslem, rekord | `journal.stats.currentStreak`, `journal.streakDaysUnit_*` (E11), `journal.stats.personalBest` | Current Streak / Personal best! 🎉 … | `currentStreak` a `personalBest` mění **C**; čtečka plamene `journal.currentStreak` (E12) |
| čtyři dlaždice: názvy a pod nimi | `journal.stats.totalEntries`, `allTime`, `activeDays`, `daysWithEntries_*`, `dailyAverage`, `entriesPerDay`, `milestoneBadges` | Total Entries / All time / Active Days … | lab má vlastní `activeDaysSub` – použije opravený `daysWithEntries` (P29); názvy mění **C** |
| ⭐🔥👑 v dlaždici pro čtečku | `journal.iconNames.*` | (nové z E12) | |
| poměr typů | `journal.stats.entryTypes`, `journal.input.typeGratitude` / `typeSelfPraise` | Entry Types … | **C** |
| povzbuzení dole | `journal.stats.motivationTitle`, `motivationNoStreak`, `motivationDay1`, `motivationDays` | Keep Going! … | `motivationTitle`, `motivationDays` (DE) mění **C** |
| pruh: hledání selhalo / záznam se nesmazal (7.9) | `journal.errors.searchFailed`, `journal.errors.deleteFailed`, `common.tryAgain` (E11) | Failed to search journal entries / Failed to delete journal entry | **C**; „Try again“ jen u hledání |

### C. Existující klíč, nová hodnota

| Klíč | EN (nově) | DE (nově) | ES (nově) | Dnes / proč |
|---|---|---|---|---|
| `journal.historyTitle` | Journal history | = | = | Title Case |
| `journal.stats.title` | Journal statistics | = | = | Title Case |
| `journal.stats.currentStreak` | Current streak | = | = | Title Case |
| `journal.stats.personalBest` | Personal best! | Persönliche Bestleistung! | ¡Mejor marca personal! | bez „🎉“; ⚠ DE +79 % (jeden řádek pod číslem, vejde se) |
| `journal.stats.totalEntries` | Total entries | = | = | Title Case |
| `journal.stats.activeDays` | Active days | = | = | Title Case |
| `journal.stats.dailyAverage` | Daily average | = | = | Title Case; ⚠ DE +69 % (název dlaždice, dva řádky) |
| `journal.stats.motivationTitle` | Keep going! | = | = | Title Case |
| `journal.stats.motivationDays` | = | Fantastische {{days}}-Tage-Serie! Du baust eine starke Routine auf. | = | DE „Gewohnheit“ → „Routine“ |
| `journal.stats.entryTypes` | Entry types | = | Tipos de entradas | Title Case |
| `journal.errors.searchFailed` | Search didn’t work this time. | Die Suche hat diesmal nicht geklappt. | La búsqueda no funcionó esta vez. | *návrh*; pruh + „Try again“ (7.9 „Hledání se nepovedlo“) |
| `journal.errors.deleteFailed` | The entry wasn’t deleted. It’s still in your journal. | Der Eintrag wurde nicht gelöscht. Er ist noch in deinem Tagebuch. | La entrada no se eliminó. Sigue en tu diario. | *návrh*; pruh bez „Try again“ (7.9 „Záznam se nesmazal. Je pořád v deníku.“); použije i Deník (E12), když smazání selže |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Statistiky bez jakékoli série.** Laboratoř pod nulou ukáže „Best: 0 days“. Dnešní obrazovka má pro tenhle případ vlastní větu.
   **Doporučuji** existující `journal.stats.startToday` („Start your streak today! / Starte heute deine Serie! / ¡Comienza tu racha hoy!“), když je nejdelší série 0.

---

## E14 – Cíle: seznam, karta s tempem, rychlý zápis

Přehled (aktivní / v plánu / splněné) s čárou termínů, karta cíle s pruhem, zářezy milníků a čipem tempa, zápis jedním ťuknutím se „Zpět“, panel „Other“ s vlastní klávesnicí, nabídka „⋯“ a sekce Splněné.
*Texty po zápisu (milník, „dnes už bez XP“) se ukazují od E14c podle toho, co vrátí úložiště (D-4 → (a), `xpAwarded` + `milestonesPaid`); „+35 XP“ létá od tlačítka (E7). Okno dokončení cíle je v E10.*

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `goals.subline` | Big things, one step at a time. | Große Dinge, Schritt für Schritt. | Cosas grandes, paso a paso. | věta pod nadpisem obrazovky | |
| `goals.pace.onPace` | On pace | Im Plan | A buen ritmo | čip tempa na kartě a v detailu | |
| `goals.pace.ahead_one` | {{count}} day ahead | {{count}} Tag voraus | {{count}} día de adelanto | čip tempa (zelený) | lab: `ahead(days)` má „1 day ahead“ natvrdo |
| `goals.pace.ahead_other` | {{count}} days ahead | {{count}} Tage voraus | {{count}} días de adelanto | jako výše | |
| `goals.pace.behind_one` | {{count}} day behind | {{count}} Tag zurück | {{count}} día de retraso | čip tempa (teplá barva, ne červená) | |
| `goals.pace.behind_other` | {{count}} days behind | {{count}} Tage zurück | {{count}} días de retraso | jako výše | ES „de adelanto / de retraso“ je bez rodu |
| `goals.pace.overdue` | *návrh* Deadline passed | *návrh* Termin verstrichen | Fecha límite superada | čip tempa po termínu (teplá barva) | laboratoř tenhle stav nemá – **viz otázka 1** |
| `goals.pace.daysLeft_zero` | *návrh* Due today | *návrh* Heute fällig | Vence hoy | řádek vedle čipu v den termínu | „0 days left“ zní špatně |
| `goals.pace.daysLeft_one` | {{count}} day left | noch {{count}} Tag | Queda {{count}} día | řádek vedle čipu; fakt v detailu (E15) | lab: `daysLeft(days)` |
| `goals.pace.daysLeft_other` | {{count}} days left | noch {{count}} Tage | Quedan {{count}} días | jako výše | |
| `goals.card.by` | by {{date}} | bis {{date}} | para el {{date}} | řádek pod jménem cíle „Health · by 31 Dec“; náhled v okně tvorby (E15) | `date` = krátké datum z `toLocaleDateString` |
| `goals.card.noDeadline` | No deadline | Ohne Termin | Sin fecha límite | řádek pod jménem; místo čipu u cíle bez termínu; předvolba v E15 | |
| `goals.card.other` | Other | Andere | Otra | poslední tlačítko rychlého zápisu (otevře panel) | ES = „otra cantidad“ |
| `goals.log.undo` | Undo | Rückgängig | Deshacer | tlačítko v pruhu po zápisu (i čtečka) | |
| `goals.log.logged` | {{amount}} logged | {{amount}} eingetragen | Registrado: {{amount}} | pruh po zápisu „+1 book logged“ | `amount` = „+50 $“, „84,6 kg“ (číslo podle jazyka + jednotka); ES bez rodu |
| `goals.log.milestone` | {{percent}} % — milestone reached | {{percent}} % – Meilenstein erreicht | {{percent}} % — hito alcanzado | připojí se k pruhu „… · 50 % — milestone reached“ | D-4 |
| `goals.log.noXpLeft` | Saved. XP for this goal returns tomorrow. | Gespeichert. XP für dieses Ziel gibt es morgen wieder. | Guardado. Mañana vuelves a ganar XP con esta meta. | pruh po zápisu nad denním stropem (3 zápisy s XP) | D-4 |
| `goals.deadlines.next_zero` | *návrh* Next: {{title}} today | *návrh* Als Nächstes: {{title}} heute | Próxima: {{title}}, hoy | řádek pod čárou termínů | „in 0 days“ zní špatně; ⚠ DE +38 % |
| `goals.deadlines.next_one` | Next: {{title}} tomorrow | Als Nächstes: {{title}} morgen | Próxima: {{title}}, mañana | jako výše | *odvozeno* (laboratoř: „in 1 days“) |
| `goals.deadlines.next_other` | Next: {{title}} in {{count}} days | Als Nächstes: {{title}} in {{count}} Tagen | Próxima: {{title}}, en {{count}} días | jako výše | lab: `nextDeadline(title, days)` |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| nadpis obrazovky | `goals.title` | My Goals / Meine Ziele / Mis Metas | **C** |
| „+“ nahoře (čtečka) | `goals.addGoal` | Add Goal / Neues Ziel / Añadir Meta | **C** |
| přehled: tři čísla | `goals.dashboard.activeGoals`, `onTrack`, `completedGoals` | Active Goals / On Track / Completed Goals … | **C** |
| čára termínů: nadpis | `goals.dashboard.deadlines` | Deadlines / Fristen / Fechas Límite | **C** (ES) |
| nadpisy sekcí | `goals.sections.activeGoals`, `goals.sections.completedGoals` | Active Goals / Aktiv … · Completed Goals / Erledigt … | **C** |
| kategorie v řádku pod jménem | `goals.category.*` | Health … | |
| čip u splněného cíle | `goals.completion.statusCompleted` | Completed / Abgeschlossen / Completada | |
| „⋯“ na kartě (čtečka; laboratoř „Edit / Delete“) | `habits.list.more` | More / Mehr / Más opciones | jako u návyku a záznamu deníku |
| nabídka „⋯“: detail, úprava, smazání, zavření | `goals.stats.overview`, `goals.editGoal`, `goals.deleteGoal`, `common.cancel` | Overview / Edit Goal / Delete Goal … | `editGoal`, `deleteGoal` mění **C** |
| potvrzení smazání | `goals.deleteGoal`, `goals.deleteMessage`, `common.delete` | Delete Goal / Löschen / … | **C** – DE nadpis „Löschen“ |
| panel zápisu: Add / Subtract / Set to | `goals.progress.form.types.add`, `subtract`, `set` | Add / Subtract / Set To … | `set` mění **C** |
| panel zápisu: chyby, poznámka, tlačítko | `goals.progress.form.errors.valueRequired`, `goals.progress.form.errors.valueTooLarge`, `goals.progress.form.placeholders.note`, `goals.progress.form.submit` | Value must be greater than 0 / This number is too large / … / Add Progress | lab „That number is too large.“ = stávající text; `submit` mění **C** |
| klávesa ⌫ (čtečka; laboratoř natvrdo „Delete“) | `common.delete` | Delete / Löschen / Eliminar | |
| „+25 XP“ z tlačítka, „−25 XP“ po Zpět | `achievements.card.xpReward`, `gamification.xp.amountLost` | | |
| bez cílů (laboratoř prázdný stav nemá) | `goals.noGoals`, `goals.noGoalsHint` | No goals yet… / Tap + to pick a ready-made goal… | „Tap +“ sedí na nové „+“ nahoře |
| řádek data nad nadpisem, měsíce na čáře termínů | `common.locale` | | |

### C. Existující klíč, nová hodnota

| Klíč | EN (nově) | DE (nově) | ES (nově) | Dnes / proč |
|---|---|---|---|---|
| `goals.title` | My goals | = | Mis metas | Title Case |
| `goals.addGoal` | Add goal | = | Añadir meta | Title Case |
| `goals.dashboard.activeGoals` | Active goals | = | Metas activas | Title Case |
| `goals.dashboard.onTrack` | On pace | = | A buen ritmo | dnes On Track / En Camino – číslo v přehledu počítá cíle s čipem „On pace“, ať je to jedno slovo |
| `goals.dashboard.completedGoals` | Completed goals | = | Metas completadas | Title Case |
| `goals.dashboard.deadlines` | = | = | Fechas límite | Title Case |
| `goals.sections.activeGoals` | Active goals | = | Metas activas | Title Case |
| `goals.sections.completedGoals` | Completed goals | = | Metas completadas | Title Case |
| `goals.editGoal` | Edit goal | Ziel bearbeiten | Editar meta | dnes DE jen „Bearbeiten“; je to i nadpis okna úpravy (E15) |
| `goals.deleteGoal` | Delete goal | Ziel löschen | Eliminar meta | dnes DE jen „Löschen“ – i jako nadpis potvrzení |
| `goals.progress.form.types.set` | Set to | = | Establecer en | Title Case |
| `goals.progress.form.submit` | Add progress | = | Añadir progreso | Title Case |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Cíl po termínu – laboratoř ho nemá.** Termín uplynul a cíl není splněný: laboratoř ukáže „0 days left“ a čip „x days behind“, který každým dnem roste. Test funkce tempa „po termínu“ přitom plán chce.
   **Doporučuji:** čip „Deadline passed“ v teplé barvě (A, `goals.pace.overdue`), řádek „days left“ zmizí, nic se nepočítá dál. Nové datum si uživatel dá přes „⋯ → Edit goal“ – žádné další tlačítko na kartě.

---

## E15 – Cíle: tvorba a úprava, detail

Jedno okno tvorby i úpravy s živým náhledem, nápady ze šablon uvnitř, termín předvolbami nebo kalendářem v okně; detail cíle s kruhem, fakty tempa, grafem „Ty a plán“, milníky a historií zápisů.

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `goals.composer.title` | *návrh* New goal | Neues Ziel | Nueva meta | nadpis okna tvorby | laboratoř čte `goals.addGoal` – **viz otázka 1**; DE = laboratoř |
| `goals.composer.create` | *návrh* Create goal | *návrh* Ziel erstellen | Crear meta | hlavní tlačítko okna tvorby (i čtečka) | laboratoř čte `common.create` (DE „Neu“) – **viz otázka 1** |
| `goals.composer.previewTitle` | Your new goal | Dein neues Ziel | Tu nueva meta | živý náhled karty, dokud je jméno prázdné | |
| `goals.composer.paceHint` | That’s about {{amount}} {{unit}} a week | Das sind etwa {{amount}} {{unit}} pro Woche | Son unos {{amount}} {{unit}} por semana | věta pod náhledem, když je zadaný cíl i termín | `amount` = číslo podle jazyka |
| `goals.composer.ideas` | Start from an idea | Mit einer Idee starten | Empieza con una idea | nadpis řady nápadů (šablony) | stejný text jako `habits.composer.ideas` (E6), vlastní klíč kvůli oblasti |
| `goals.composer.deadline` | Deadline | Termin | Fecha límite | nadpis části s termínem | |
| `goals.composer.presetMonths_one` | {{count}} month | {{count}} Monat | {{count}} mes | předvolba „1 month“ | lab: `presets.m1` / `m3` / `m6` napevno |
| `goals.composer.presetMonths_other` | {{count}} months | {{count}} Monate | {{count}} meses | předvolby „3 months“, „6 months“ | |
| `goals.composer.presetYear` | End of year | Jahresende | Fin de año | předvolba | |
| `goals.composer.presetPick` | Pick a date | Datum wählen | Elegir fecha | předvolba s ikonou kalendáře (otevře kalendář v okně) | předvolba „No deadline“ = `goals.card.noDeadline` (E14) |
| `goals.composer.inDays_zero` | *návrh* today | *návrh* heute | hoy | řádek s vybraným termínem „Fri, 22 May 2026 · today“ | v kalendáři jde vybrat i dnešek |
| `goals.composer.inDays_one` | tomorrow | morgen | mañana | jako výše | lab: `inDays(days)` |
| `goals.composer.inDays_other` | in {{count}} days | in {{count}} Tagen | en {{count}} días | jako výše | |
| `goals.detail.neededPerWeek` | {{amount}} a week needed | {{amount}} pro Woche nötig | Hacen falta {{amount}} por semana | fakt tempa v detailu | `amount` = „0,5 books“ (číslo + jednotka) |
| `goals.detail.yourPerWeek` | {{amount}} a week so far | bisher {{amount}} pro Woche | {{amount}} por semana hasta ahora | fakt tempa | |
| `goals.detail.finish` | At this pace: {{date}} | In diesem Tempo: {{date}} | A este ritmo: {{date}} | fakt tempa; legenda tečkované čáry v grafu | |
| `goals.detail.paceTitle` | You vs. the plan | Du und der Plan | Tú frente al plan | nadpis grafu; čtečka grafu | |
| `goals.detail.plan` | Plan | Plan | Plan | legenda (čárkovaná čára) | |
| `goals.detail.you` | You | Du | Tú | legenda (čára v barvě cíle) | |
| `goals.detail.chartHint` | *návrh* Tap or slide along the line | *návrh* Tippe oder streiche über die Linie | Toca o desliza a lo largo de la línea | řádek nad grafem, dokud není vybraný bod | laboratoř tu čte nápovědu grafu deníku „…across the bars“ – graf cíle je ale čára |
| `goals.detail.milestones` | Milestones | Meilensteine | Hitos | nadpis milníků | |
| `goals.detail.reached` | reached {{date}} | erreicht {{date}} | alcanzado el {{date}} | řádek dosaženého milníku „50 % · reached 3 Nov“ | DE správně spíš „erreicht am {{date}}“ – navrhuji „am“ doplnit |
| `help.topics.pace` | How the pace is worked out | So wird das Tempo berechnet | Cómo se calcula el ritmo | čtečka: tiché „i“ u čipu tempa v detailu | nové téma místo `help.goals.predictions` (7.10) |
| `help.rules.pace.title` | Your pace, in plain words | Dein Tempo, in klaren Worten | Tu ritmo, en pocas palabras | okno nápovědy `pace` (a v E22 stránka pravidel) | |
| `help.rules.pace.text` | A goal with a deadline compares your pace with the straight line to it and tells you whether you’ll make it. | Ein Ziel mit Termin vergleicht dein Tempo mit der geraden Linie bis dahin und sagt dir, ob du es schaffst. | Una meta con fecha límite compara tu ritmo con la línea recta hasta ella y te dice si llegarás a tiempo. | okno nápovědy `pace` | |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| nadpis okna při úpravě | `goals.editGoal` | (E14 C: Edit goal / Ziel bearbeiten / Editar meta) | |
| tlačítko při úpravě | `common.save` | Save / Speichern / Guardar | |
| křížek a ťuknutí vedle okna (čtečka) | `common.close` | Close / Schließen / Cerrar | |
| náhled: kategorie · termín | `goals.category.*`, `goals.card.by`, `goals.card.noDeadline` | (E14) | |
| pole jména | `goals.form.placeholders.title` | Enter your goal title... | |
| nápady | `goals.templates.<id>`, `goals.units.<id>` | Lose weight … / kg … | přes `useGoalTemplates()` |
| cílová hodnota, jednotka, kategorie, popis | `goals.form.targetValue`, `goals.form.placeholders.targetValue`, `goals.form.unit`, `goals.units.*`, `goals.form.category`, `goals.form.description`, `goals.form.placeholders.description` | Target Value / 100 / Unit / … / Description (Optional) | `targetValue`, `description` mění **C** |
| třesení pole | `goals.form.errors.titleRequired`, `titleTooShort`, `titleTooLong`, `unitRequired`, `unitTooLong`, `targetValueRequired`, `targetValueTooLarge`, `descriptionTooLong` | (všechny tři) | sdílet s `GoalForm`; lab „That number is too large.“ = `targetValueTooLarge` |
| ‹ › v kalendáři termínu (laboratoř čte „‹“ / „›“) | `habits.detail.previousMonth` / `nextMonth` | (nové z E6) | viz pozn. v E13 (`common.*`) |
| písmena dnů, den v kalendáři pro čtečku, datum termínu | `common.locale` | | `toLocaleDateString` |
| detail: kategorie, „Target: 100 km“ | `goals.category.*`, `goals.detailsCard.target` | Target / Ziel / Objetivo | |
| detail: čip tempa a „days left“ | `goals.pace.*` | (nové z E14) | |
| detail: tlačítko zápisu | `goals.progress.addProgress` | Add Progress / Fortschritt hinzufügen / Añadir Progreso | **C** |
| detail: historie, prázdná historie, smazání zápisu | `goals.progress.progressHistory`, `goals.progress.noProgress`, `common.delete`, `goals.progress.confirmDelete`, `goals.progress.deleteMessage` | Progress History … | `progressHistory`, `confirmDelete` mění **C** |
| detail: tlačítko úpravy | `goals.editGoal` | (E14 C) | |
| graf: „Today“ na ose | `common.dates.today` | Today / Heute / Hoy | laboratoř čte `journal.today` (stejný text, cizí oblast) |
| milník: „+50 XP“, u 100 % „+250 XP“ | `achievements.card.xpReward` | +{{xp}} XP | čísla z `XP_REWARDS.GOALS`; u 100 % podle O-8 (E16) |
| tiché „i“ → „All the rules“ | `help.allRules` | (nový z E6) | |

### C. Existující klíč, nová hodnota

| Klíč | EN (nově) | DE (nově) | ES (nově) | Dnes / proč |
|---|---|---|---|---|
| `goals.form.targetValue` | Target value | = | Valor objetivo | Title Case |
| `goals.form.description` | Description (optional) | Beschreibung (optional) | Descripción (opcional) | Title Case |
| `goals.progress.addProgress` | Add progress | = | Añadir progreso | Title Case |
| `goals.progress.progressHistory` | Progress history | = | Historial de progreso | Title Case |
| `goals.progress.confirmDelete` | Delete progress entry | = | Eliminar entrada de progreso | Title Case |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

1. **Okno tvorby cíle jako okno tvorby návyku.** Laboratoř má nadpis z `goals.addGoal` („Add Goal“) a tlačítko z `common.create`, které je v DE jen „Neu“. Okno návyku (E6) má „New habit / Create habit“.
   **Doporučuji** stejný vzor: nadpis „New goal / Neues Ziel / Nueva meta“ a tlačítko „Create goal / Ziel erstellen / Crear meta“ (dva klíče v A). „Add goal“ zůstane jen čtečce u „+“.

---

## E16 – Cíle: druh „Messen“ (změna dat)

Volba druhu cíle v okně tvorby („Hochzählen“ = přičítá se, „Messen“ = zapisuje se naměřená hodnota) s počáteční hodnotou a rychlý zápis „dnešní hodnoty“ u měřeného cíle.
*Texty jsou jen pro obrazovky; plán migrace dat se píše Petrovi zvlášť (karta E16).*

### A. Nové texty

| Návrh klíče | EN | DE | ES | Kde se ukáže | Pozn. |
|---|---|---|---|---|---|
| `goals.kind.count` | Count up | Hochzählen | Sumar | volba druhu v okně tvorby (i čtečka) | |
| `goals.kind.countHint` | Add as you go — books, money, hours | Nach und nach addieren – Bücher, Geld, Stunden | Suma poco a poco: libros, dinero, horas | věta pod volbou druhu | |
| `goals.kind.measure` | Measure | Messen | Medir | volba druhu | |
| `goals.kind.measureHint` | Log a reading — weight, balance, time | Messwert eintragen – Gewicht, Kontostand, Zeit | Anota una medición: peso, saldo, tiempo | věta pod volbou druhu | |
| `goals.composer.now` | Now | Jetzt | Ahora | popisek pole počáteční hodnoty (jen u „Messen“) | placeholder „85“ zůstává číslem bez klíče |
| `goals.form.errors.startRequired` | Enter where you are now — it has to differ from the target. | Gib deinen aktuellen Wert ein – er muss sich vom Ziel unterscheiden. | Indica dónde estás ahora: tiene que ser distinto del objetivo. | třesení pole „Now“ | |
| `goals.form.errors.targetRequiredMeasure` | Enter the value you want to reach (0 is fine). | Gib den Zielwert ein (0 ist erlaubt). | Indica el valor que quieres alcanzar (0 también vale). | třesení cílové hodnoty u „Messen“ | `targetValueRequired` („must be greater than 0“) u „Messen“ neplatí – smí být 0 |
| `goals.log.logReading` | Log a reading | Messwert eintragen | Anotar medición | jediné tlačítko zápisu na kartě měřeného cíle; tlačítko v detailu | ⚠ DE +38 % (tlačítko je široké) |
| `goals.log.reading` | Today’s reading | Heutiger Messwert | Medición de hoy | nadpis nad číslem v panelu zápisu | |
| `goals.log.readingRequired` | *návrh* Enter today’s reading. | *návrh* Gib den heutigen Messwert ein. | Indica la medición de hoy. | třesení prázdného čísla v panelu u „Messen“ | laboratoř tu čte `valueRequired` („Value must be greater than 0“) – u „Messen“ ale 0 platí (dluh splacen); ⚠ DE +36 % |

### B. Použije existující klíč

| Text laboratoře | Existující klíč | EN / DE / ES dnes | Pozn. |
|---|---|---|---|
| cílová hodnota u „Messen“ | `goals.form.targetValue` | (E15 C) | |
| hodnota karty „84,6 kg → 78 kg“, „85 → 78 kg“ v detailu | – | | skládá se v kódu z čísel podle jazyka a jednotky, bez klíče |
| pruh po zápisu „84,6 kg logged“ | `goals.log.logged` | (nový z E14) | `amount` bez znaménka (je to hodnota, ne přírůstek) |
| uložit zápis, příliš velké číslo | `goals.progress.form.submit`, `goals.progress.form.errors.valueTooLarge` | (E14 C) / This number is too large | |
| čip tempa, „days left“, fakta detailu | `goals.pace.*`, `goals.detail.*` | (nové z E14, E15) | fungují oběma směry beze změny textu |
| okno dokončení „84,6 → 78 kg · reached in 42 days“ | `goals.completion.doneIn_*` | (nový z E10) | |

### Otázky (rozhodnuto – viz „Rozhodnutí otázek“ nahoře)

Žádné – texty jsou z laboratoře, rozhoduje se o datech (plán migrace zvlášť).

---

## Souhrn

| Etapa | Nové klíče (řádky tabulky A) | z toho tvary `_zero`/`_one`/`_other` | Použité existující (řádky tabulky B) | Nová hodnota existujícího klíče (řádky tabulky C) | Otázky |
|---|---|---|---|---|---|
| E5 – Návyky: seznam | 14 | 4 (2 páry) | 14 | – | 6 |
| E6 – Detail, tvorba, řazení | 28 | 0 | 16 | – | 6 |
| E7 – Odznak a jiskry | 6 | 0 | 2 | – | 1 |
| E8 – Momenty trofejí | 7 | 4 (2 páry) | 7 | – | 2 |
| E9 – Panel a přehled úrovní | 42 | 14 (7 párů) | 8 | – | 5 |
| E10 – Ostatní okna | 8 | 4 (2 páry) | 15 | – | 4 |
| E11 – Home | 64 | 25 (12 párů + 1 `_zero`) | 25 | 44 | 6 |
| E12 – Deník | 23 | 4 (2 páry) | 23 | 19 | 1 |
| E13 – Historie a statistiky deníku | 19 | 4 (2 páry) | 17 | 12 | 1 |
| E14 – Cíle: seznam a zápis | 20 | 10 (2 páry + 2 trojice) | 16 | 12 | 1 |
| E15 – Cíle: tvorba a detail | 25 | 5 (1 pár + 1 trojice) | 18 | 5 | 1 |
| E16 – Cíle: druh „Messen“ | 10 | 0 | 6 | 0 | 0 |
| **Celkem** | **266** | **74** | **167** | **92** | **34** |

*Každý tvar `_one` / `_other` se počítá jako jeden klíč. Řádek tabulky B může shrnovat víc příbuzných klíčů (např. šest klíčů legendy). Řádky B, které odkazují na klíč založený dřív v tomto soupisu (např. `help.allRules` z E6 v E9), se počítají v B té pozdější etapy.*

*Ověřeno skriptem nad locales: žádný navržený klíč z tabulek A v appce ještě neexistuje; každý klíč z tabulek B existuje v EN, DE i ES; zástupné parametry `{{…}}` sedí v EN, DE i ES u každého řádku tabulek A.*

*E11–E16 ověřeno stejně (skript nad locales, 2026-11-24): žádný klíč z tabulek A v appce ještě není; každý klíč z tabulek B je v EN, DE i ES, nebo ho zakládá dřívější etapa tohoto soupisu (označeno „nový z E…“); každý klíč z tabulek C v appce je (kromě dvou nových tvarů `timelineCheck.description_one`/`_other`, které nahrazují `.description`); parametry `{{…}}` sedí ve všech třech jazycích u řádků A i C. Značka ⚠ DE od +35 %.*
