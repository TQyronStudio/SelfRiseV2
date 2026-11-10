# Přestavba trofejí: schválený katalog

*Schváleno Petrem 2026-10-31. Kód se zatím nezměnil. Postup: `premium-design-plan.md`, R-28 až R-30.*

## Co se mění

- **75 → 51 trofejí.** 24 vyřazených z aplikace úplně zmizí, i těm, kdo je získali. XP a vyplacené bonusy jim zůstávají.
- **Vzácnost podle času,** ne podle dojmu. Série se počítá přísněji než součet, protože jeden vynechaný den ji shodí.
- **První den jde získat jen běžná trofej.** V simulaci nic vyššího neodemkl ani přehnaně aktivní uživatel.
- **Jedna oslava na jednu akci.** Běžné trofeje jen tiše, velké okno pro epic a legendary. Trofeje a nová úroveň ze stejné akce se spojí do jednoho momentu.

### Co znamená která vzácnost

| Vzácnost | Kdy ji typický uživatel získá | XP | Jak se ukáže | Počet teď → nově |
|---|---|---|---|---|
| Běžná | první týden | 50 | tiché potvrzení | 5 → 8 |
| Vzácná | týdny | 100 | malý moment | 18 → 15 |
| Epická | měsíce | 200 | velké okno | 27 → 14 |
| Legendární | půl roku a déle | 500 | velké okno, nejsilnější | 25 → 14 |

## Co ukázala simulace

Tři typy uživatelů, každý prošel starým i novým katalogem. Běžný a aktivní 300krát s náhodou, přehnaně aktivní jednou podle pevného plánu. V tabulce je medián.

| | Běžný: starý → nový | Aktivní: starý → nový | Přehnaně aktivní: starý → nový |
|---|---|---|---|
| Trofejí první den | 4 → 3 | 6 → 4 | 14 → 6 |
| Trofejí první týden | 4 → 4 | 15 → 8 | 30 → 11 |
| Trofejí první měsíc | 12 → 8 | 28 → 16 | 48 → 29 |
| Trofejí za rok | 29 → 22 | 56 → 39 | 65 → 45 |
| Nejvíc trofejí za jeden den | 4 → 3 | 6 → 4 | 14 → 6 |
| Z toho nejvíc neběžných za jeden den | 3 → 2 | 4 → 2 | 10 → 3 |
| První epická (den) | 36 → 75 | 14 → 40 | 1 → 10 |
| První legendární (den) | 115 → 229 | 23 → 193 | 2 → 50 |
| Úroveň po 30 dnech | 9 → 9 | 13 → 12 | 18 → 16 |
| Úroveň po roce | 24 → 23 | 32 → 31 | 39 → 39 |

**Co z toho plyne:** přehnaně aktivní člověk už nedostane legendární trofej druhý den. Běžnému uživateli se začátek skoro nemění, takže první dny nezůstanou prázdné. Součet XP ze všech trofejí klesne z 19 950 na 11 700, ale úrovně se pohnou jen o 0 až 2, protože většina XP pochází z denní aktivity.

**Zbývající souběhy:** přehnaně aktivní člověk má pořád 6 trofejí první den, všechny běžné, a ty pohlídá pravidlo jedné oslavy. Tři z nich jsou trofeje z onboardingu, které se ukážou společně na závěru.

**Limity simulace:** typy uživatelů jsem nastavil odhadem, není to změřené chování. Počítá po dnech, neřeší dobíjení série bonusem, měsíční výzvy ani XP za sérii. Série u běžného uživatele jsou proto spíš podhodnocené. Před nasazením se to ověří na skutečné logice aplikace.

Typy: **běžný** má 3 návyky, je aktivní 4 dny z 5 a občas píše bonus. **Aktivní** má 5 návyků a je aktivní skoro denně, s častými bonusy a cílem splněným za měsíc. **Přehnaně aktivní** hned založí 7 návyků, první tři dny píše 13 zápisů denně a cíle plní každý týden.

## Nový katalog (51)

Odhady ukazují medián dne odemčení. „jen někdo“ znamená, že se to v simulaci za rok povede menšině, „za rok ne“ nikomu. Názvy zůstávají anglické jako v appce.

### Běžná (8)

| Trofej | Podmínka | Změna | Běžný | Aktivní |
|---|---|---|---|---|
| 🌱 First Steps | Založ první návyk | beze změny | 1. den | 1. den |
| 📝 First Reflection | První zápis do Deníku | beze změny | 1. den | 1. den |
| 🎯 First Vision | Založ první cíl | beze změny | 1. den | 1. den |
| ⭐ First Star | První bonusový zápis (hvězda) | beze změny | 6. den | 1. den |
| 🏗️ Habit Builder | Založ 5 návyků | bylo Vzácná | za rok ne | 5. den |
| 🤔 Deep Thinker | Zápis o 200+ znacích | bylo Vzácná | 10. den | 3. den |
| ⚔️ Weekly Warrior | Série 7 dní u jednoho návyku | bylo Vzácná | 16. den | 7. den |
| 🌱 First Week | 7 aktivních dní celkem | beze změny | 9. den | 7. den |

### Vzácná (15)

| Trofej | Podmínka | Změna | Běžný | Aktivní |
|---|---|---|---|---|
| 💯 Century Club | 100 splněných návyků | bylo Epická | 47. den | 24. den |
| 🏆 Habit Streak Champion | Série 21 dní u jednoho návyku | bylo Epická | jen někdo | 30. den |
| 💝 Grateful Heart | Série Deníku 10 dní | cíl 7 → 10 | 120. den | 10. den |
| 📖 Gratitude Guardian | Série Deníku 25 dní | cíl 21 → 25 | jen někdo | 43. den |
| 💪 Two Weeks Strong | 14 aktivních dní celkem | beze změny | 17. den | 15. den |
| 🗺️ Month Explorer | 30 aktivních dní celkem | bylo Epická | 37. den | 31. den |
| ⭐ Star Collector | 25 dní s hvězdou | bylo Epická | 205. den | 37. den |
| 🔥 Flame Achiever | 3 dny s plamenem (5 bonusů za den) | cíl 1 → 3 | za rok ne | 24. den |
| 👑 Crown Achiever | 3 dny s korunou (10 bonusů za den) | bylo Epická | za rok ne | 137. den |
| 📈 Progress Tracker | Pokrok na cílech 12 dní v kuse | bylo Epická, cíl 7 → 12 | za rok ne | 175. den |
| ⚖️ Balance Master | 9 dní se všemi třemi oblastmi | bylo Epická, cíl 10 → 9 | 36. den | 13. den |
| ✅ Goal Getter | První splněný cíl | beze změny | 60. den | 30. den |
| 💪 Persistence Pays | Návrat po pauze 3+ dny a 7 aktivit | bylo Epická | jen někdo | za rok ne |
| 🏆 Trophy Collector | 15 odemčených trofejí | cíl 10 → 15 | 88. den | 30. den |
| ⬆️ Level Up | Úroveň 10 | beze změny | 36. den | 17. den |

### Epická (14)

| Trofej | Podmínka | Změna | Běžný | Aktivní |
|---|---|---|---|---|
| 👑 Monthly Master | Série 30 dní u jednoho návyku | beze změny | jen někdo | 61. den |
| 🧘‍♀️ Gratitude Guru | Série Deníku 45 dní | cíl 30 → 45 | za rok ne | 131. den |
| 📖 Journal Enthusiast | 200 zápisů do Deníku | cíl 100 → 200 | 91. den | 50. den |
| ⭐ Star Champion | 100 dní s hvězdou | beze změny | za rok ne | 150. den |
| 🔥 Flame Accumulator | 10 dní s plamenem | beze změny | za rok ne | 84. den |
| 👑 Crown Master | 10 dní s korunou | bylo Legendární | za rok ne | jen někdo |
| ⭐ Golden Bonus Streak | 18 dní v kuse se 3+ bonusy | cíl 7 → 18 | za rok ne | za rok ne |
| 👑 Triple Crown | Série 14 dní v návycích, Deníku i cílech najednou | bylo Legendární, série 7 → 14 | za rok ne | jen někdo |
| 🌟 Dream Fulfiller | 3 splněné cíle | beze změny | 240. den | 90. den |
| 🏆 Goal Champion | 5 splněných cílů | beze změny | za rok ne | 150. den |
| ⚔️ Two Month Veteran | 60 aktivních dní celkem | beze změny | 75. den | 63. den |
| 💯 Century User | 100 aktivních dní celkem | beze změny | 125. den | 105. den |
| 🌟 Perfect Month | 28 dní se všemi třemi oblastmi | bylo Legendární | 115. den | 42. den |
| 🏆 Trophy Master | 30 odemčených trofejí | bylo Legendární, cíl 25 → 30 | za rok ne | 150. den |

### Legendární (14)

| Trofej | Podmínka | Změna | Běžný | Aktivní |
|---|---|---|---|---|
| 🏛️ Centurion | Série 100 dní u jednoho návyku | beze změny | za rok ne | jen někdo |
| 🌟 Eternal Gratitude | Série Deníku 150 dní | cíl 100 → 150 | za rok ne | za rok ne |
| 👑 Consistency King | 1000 splněných návyků | beze změny | za rok ne | 219. den |
| ⭐ Star Legend | 200 dní s hvězdou | beze změny | za rok ne | 301. den |
| 🔥 Flame Champion | 50 dní s plamenem | beze změny | za rok ne | jen někdo |
| 👑 Crown Champion | 25 dní s korunou | beze změny | za rok ne | za rok ne |
| 🎖️ Achievement Unlocked | 10 splněných cílů | beze změny | za rok ne | 300. den |
| 🏆 SelfRise Legend | 10 cílů, 500 návyků a 365 zápisů | beze změny | za rok ne | 300. den |
| 🎓 SelfRise Expert | Úroveň 25 | bylo Epická | za rok ne | 194. den |
| 🏅 SelfRise Master | Úroveň 50 | beze změny | za rok ne | za rok ne |
| 🌟 Ultimate SelfRise Legend | Úroveň 100 | beze změny | za rok ne | za rok ne |
| 🦸‍♀️ Half Year Hero | 183 aktivních dní celkem | beze změny | 229. den | 193. den |
| 👑 Year Legend | 365 aktivních dní celkem | beze změny | za rok ne | za rok ne |
| 🏆 Loyalty Master | 1000 aktivních dní celkem | beze změny | za rok ne | za rok ne |

## Vyřazené trofeje (24)

| Trofej | Vzácnost | Proč pryč |
|---|---|---|
| ⚡ Multi-Tasker | Vzácná | 5 návyků za den jde udělat hned první den, odměňuje množství |
| ⚡ Lightning Start | Vzácná | Založ a hned odškrtni: vybízí k obcházení, sbíhá se s prvním dnem |
| 🏛️ Seven Wonder | Epická | 7 návyků = 7 kliknutí a jde proti „začni malým“ |
| 🏆 Habit Legend | Legendární | Prakticky totéž co Úroveň 50, přijde ve stejný okamžik |
| ⚡ Century Streak | Legendární | Jmenuje se „Century“, ale chce 75 dní; série má 7, 21, 30, 100 |
| 📅 Daily Visitor | Vzácná | Stejný den a skoro stejná věc jako Weekly Warrior a First Week |
| 🎯 Dedicated User | Epická | Stejný den a skoro stejná věc jako Monthly Master |
| ⭐ Bonus Week | Vzácná | Sbíhá se se 7. dnem a podobá se hvězdám |
| ⭐ Bonus Seeker | Epická | Počítá zápisy, jde nasbírat za pár dní; hvězdy počítají dny |
| 💯 Bonus Century | Legendární | Totéž, řada hvězd to pokrývá poctivěji |
| ⭐ Five Stars | Vzácná | Řada hvězd zkrácena na 1, 25, 100, 200 |
| ⭐ Star Beginner | Vzácná | Řada hvězd zkrácena |
| ⭐ Star Master | Epická | Řada hvězd zkrácena |
| 🔥 Flame Starter | Epická | Řada plamenů zkrácena na 3, 10, 50 |
| 🔥 Flame Master | Epická | Řada plamenů zkrácena |
| 🔥 Flame Legend | Legendární | Řada plamenů zkrácena |
| 👑 Crown Royalty | Epická | První koruna = epic první den. Nově až 3 dny s korunou |
| 👑 Crown Collector | Legendární | Řada korun zkrácena na 3, 10, 25 |
| 👑 Crown Emperor | Legendární | Řada korun zkrácena |
| 🚀 Ambitious | Vzácná | Odměňuje napsané číslo, ne práci; 1000 Kč a 1000 $ není totéž |
| 🌟 Mega Dreamer | Epická | Totéž; po zrušení stropu jde získat za pár vteřin |
| 💎 Million Achiever | Legendární | Totéž, závisí na měně |
| 🔥 Three Weeks Committed | Vzácná | Žebřík věrnosti je zbytečně hustý a 21 se sbíhá se sérií |
| 🏅 Ultimate Veteran | Legendární | Mezi 365 a 1000 dní není potřeba další stupeň |

## Sbírky trofejí

Vyřazení se dotkne dvou z osmi sbírek:

- **Epic Hunter:** místo vyřazené Dedicated User nově Century User.
- **Time Master:** všechny tři její trofeje jsou vyřazené, takže sbírka končí. Kdo bonus dostal, ten mu zůstává.
- **Ostatní sbírky** zůstávají. Journal Sage bude díky 200 zápisům trochu těžší.

## Co to znamená v kódu

- **Smazání z katalogu:** vyřazené trofeje se odstraní z katalogu, sbírek, textů a nápověd pokroku. Žádný stav „vyřazená“ není potřeba.
- **Jednorázové vyčištění uložených dat (povinné):** z uloženého seznamu získaných trofejí se odstraní 24 smazaných. Počet získaných se dnes bere přímo z délky seznamu, takže bez vyčištění by appka ukazovala nesmysl jako 60 z 51 a započítávala by je do Trophy Collector.
- **Stávající uživatelé:** XP z vyřazených trofejí a bonusy ze sbírek se neodebírají, úroveň se nezmění. Trofej s novou vzácností se ukáže v nové vzácnosti. Počet získaných trofejí jim klesne a appka to nijak nevysvětluje. Trophy Collector a Trophy Master, které už mají, si nechají i po poklesu.
- **Stáří cíle:** cíl se započítá do trofejí, až když je starý aspoň 7 dní. Jinak jde „splnit“ cíl o hodnotě 1 za pár vteřin. Do XP to nesahá.
- **Texty:** u změněných podmínek nové popisy a nápovědy pokroku v EN, DE a ES.
- **Testy a průvodce:** úprava testů trofejí a přepsání `technical-guides:Achievements.md` ve stejném commitu.
- **Pravidlo jedné oslavy:** spojení trofejí a úrovně do jednoho momentu, navazuje na frontu oken.
- **Ověření:** průchod simulace skutečnými službami aplikace, ne jen tímto modelem.

## Rozhodnuto (Petr 2026-10-31)

1. **24 trofejí se vyřazuje** podle tabulky, včetně Ambitious, Mega Dreamer a Million Achiever.
2. **Vyřazené v aplikaci nezůstanou,** ani těm, kdo je získali. XP už dostali.
3. **Cíl se započítá do trofejí až po 7 dnech** od založení. Do XP to nesahá.
