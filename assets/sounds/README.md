# Zvuky SelfRise – kandidáti (kolo 50, rozhodnutí O-12)

Petr 2026-11-21: vibrace + **pár jemných zvuků u velkých okamžiků**, vypínatelné v Nastavení.
Pravidla a mapa okamžiků: `src/screens/design-lab/labFeel.ts` (slovník pocitů, s testem).

| Soubor | Kdy zní | Charakter | Délka |
|---|---|---|---|
| `celebrate.m4a` | velké okno trofeje (epická, legendární), okno série deníku (7/30/100/365/1000) | dva tóny marimby nahoru o velkou tercii | 1,0 s |
| `chapter.m4a` | nová kapitola úrovní (5× za život účtu) | skleněný zvon, arpeggio přes oktávu | 1,7 s |
| `complete.m4a` | splněná měsíční výzva, dosažený cíl | měkký akord zvonu | 1,2 s |
| `boost.m4a` | zapnutí násobiče XP | rychlá jasná kvinta nahoru, marimba | 0,75 s |

- Hlasitost: špička −14 dBFS, průměr kolem −28 dB – tiché, nesmí přehlušit hudbu, kterou uživatel poslouchá.
- **Jsou to syntetizované návrhy** (`scripts/synth-sounds.py`), ne finální zvukový design. Poslechnout na Macu:
  `afplay assets/sounds/chapter.m4a`. Když nebudou znít dost prémiově, nahradit sadou od zvukového designéra
  nebo licencovanou knihovnou – názvy souborů a místa zůstanou.
- Nic z appky je zatím nenačítá: přehrávač (`expo-audio`) je nativní modul a přijde s buildem E0
  (`design-migration-plan.md`; přehrávač vzniká v E2). Do té doby `feelPlayer.ts` jen zapíše do logu, kdy by zvuk zazněl.
- Ztlumený telefon = žádný zvuk (`playsInSilentMode: false`). Každodenní akce (odškrtnutí, záznam, hotový den)
  zvuk nemají – po týdnu by z nich byl hluk.
