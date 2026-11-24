# Soupis textů převodu – etapy E5 až E10

Tenhle dokument je krok 2 postupu etapy (`design-migration-plan.md`, kap. 0.2 a 7.1): ke každé etapě E5–E10 vypisuje texty, které převedená obrazovka ukáže, ve třech jazycích EN / DE / ES.
**Petr schvaluje po etapách** – teprve schválené texty jdou do `src/locales/{en,de,es}/index.ts` a `src/types/i18n.ts`. Tabulka A = nové klíče, tabulka B = laboratoř použije klíč, který appka už má (ověřeno ve všech třech jazycích); kulisy laboratoře (její lišta, scénáře „Lab ·“, přepínače situací, `MOCK_STATS`, ukázková jména) se nepřevádějí a nejsou tu.
EN a DE jsou opsané doslova z `src/screens/design-lab/mockCopy.ts` (nebo z textu natvrdo v souboru laboratoře); ES chybí v laboratoři všude, takže je celé můj návrh (tykání, slovník appky: Hábitos, Mi Diario, Metas, racha, hito, desafío, logro/trofeo, Nivel, En pausa, Recuperado).
Legenda: ***návrh*** = text navrhuji já, laboratoř ho v tom jazyce nemá · ***odvozeno*** = tvar jednotného čísla dopočítaný k textu laboratoře kvůli pravidlu `_one`/`_other` · ⚠ DE = německý text výrazně delší než EN (hlídat zalomení).

**Společné konvence pro všechny etapy**

- Množné číslo: i18next potřebuje parametr `count`. Proto mají klíče s množným číslem `{{count}}` místo pojmenovaného čísla z laboratoře a každý tvar má vlastní řádek (`_one`, `_other`).
- Násobič má v laboratoři dvě podoby parametru: `{{factor}}` = **už vytištěný faktor se znakem „ד** („2ד, „1,5ד – `formatFactor`), nebo `{{factor}}` = **holé číslo** a znak × je v textu („{{factor}}× XP“). U každého klíče to stojí v poznámce. Sjednocení je otázka pro Petra (viz E9).
- Datum, dny v týdnu a měsíc tiskne `toLocaleDateString` s jazykem z existujícího klíče `common.locale` (en-US / de-DE / es-ES) – bez vlastních klíčů.
- Čísla s oddělovačem tisíců („4 205“) dělá formátování čísla, ne text.
- Texty, které laboratoř skládá z několika kusů jen pro čtečku obrazovky (např. „Level 16. Ember. 237 XP to Level 17“), nemají vlastní klíč – skládají se v kódu z klíčů níže.

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

### Otázky pro Petra

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

### Otázky pro Petra

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

### Otázky pro Petra

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

### Otázky pro Petra

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

### Otázky pro Petra

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

### Otázky pro Petra

1. **DE „Weiter“ × „Fortfahren“.** Okno trofeje a okno ⭐🔥👑 mají tlačítko z `achievements.celebration.continue_button` = „Fortfahren“, okno kapitoly, série a cíle „Weiter“. Všechna okna oslav vypadají nově stejně, tak by asi mělo stejné být i tlačítko. Sjednotit na „Weiter“ (= `ui.continue`)?
2. **Tiché oznámení série (R-40).** Laboratoř v tichém oznámení ukazuje jen „Journal streak“ + „14 days in a row“, nic z textů `journalStreakMilestones.ts` (ty má jen okno). Je to tak myšlené („nese jen titulek“), nebo má oznámení nést titulek milníku (např. „Two Weeks Strong!“)?
3. **Texty série, které okno ukáže (appka, ne laboratoř).**
   - Den **30** má okno, ale vlastní texty nemá. Ukáže tedy obecné „Another Milestone!“ + „Congratulations on reaching 30 days in a row!“. Chceš pro 30 vlastní text?
   - Den **1000** má nadpis „LEGENDARY! 传奇“. Laboratoř odřízne jen emoji, takže čínské znaky zůstanou vidět. Mám je při převodu z nadpisu odstranit ve všech třech jazycích?
4. **Emoji v nadpisech ⭐🔥👑.** `journal.bonusMilestone*_title` končí emoji („First Bonus Entry! ⭐“), zatímco okno už má podpisovou ikonu v medaili. PREVOD říká emoji v locales přepsat (ikona jako komponenta). Mám emoji z těch tří nadpisů odstranit ve všech jazycích (změna existujících hodnot), nebo ho při vykreslení odříznout jako u série?

---

## Souhrn

| Etapa | Nové klíče (řádky tabulky A) | z toho tvary `_one`/`_other` | Použité existující (řádky tabulky B) | Otázky |
|---|---|---|---|---|
| E5 – Návyky: seznam | 14 | 4 (2 páry) | 14 | 6 |
| E6 – Detail, tvorba, řazení | 28 | 0 | 16 | 6 |
| E7 – Odznak a jiskry | 6 | 0 | 2 | 1 |
| E8 – Momenty trofejí | 7 | 4 (2 páry) | 7 | 2 |
| E9 – Panel a přehled úrovní | 42 | 14 (7 párů) | 8 | 5 |
| E10 – Ostatní okna | 8 | 4 (2 páry) | 15 | 4 |
| **Celkem** | **105** | **26** | **62** | **24** |

*Každý tvar `_one` / `_other` se počítá jako jeden klíč. Řádek tabulky B může shrnovat víc příbuzných klíčů (např. šest klíčů legendy). Řádky B, které odkazují na klíč založený dřív v tomto soupisu (např. `help.allRules` z E6 v E9), se počítají v B té pozdější etapy.*

*Ověřeno skriptem nad locales: žádný navržený klíč z tabulek A v appce ještě neexistuje; každý klíč z tabulek B existuje v EN, DE i ES; zástupné parametry `{{…}}` sedí v EN, DE i ES u každého řádku tabulek A.*
