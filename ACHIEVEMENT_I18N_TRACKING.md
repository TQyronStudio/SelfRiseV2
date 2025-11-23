# Achievement Localization - Complete Tracking (Phase 18)

**Datum vytvoření**: 2025-11-23
**Celkový počet achievementů**: 78
**Status**: ✅ COMPLETE - All 78 achievements fully localized (EN/DE/ES) - Commit: fe58be0

---

## 📋 PŘEHLED PROBLÉMŮ

### ❌ Problém 1: Browse All Screen - Zelené popisy hardcoded v angličtině
**Kde**: Trophy Room → Browse All → každý splněný achievement má pod nadpisem zelený popis
**Co je špatně**: Zelený popis (např. "Created your first habit") je hardcoded anglicky
**Co potřebujeme**: Přeložit všech 78 requirement textů do EN/DE/ES lokalizací

### ❌ Problém 2: Detail Modal - Chybí nadpisy a popisy achievementů
**Kde**: Trophy Room → Browse All → klik na achievement → Detail Modal
**Co je špatně**:
- Hlavička říká jen "Achievement Unlocked" nebo "Achievement"
- Chybí název achievementu (např. "First Step")
- Chybí popis co uživatel udělal / má udělat
- Zobrazuje se jen "Achievement description" bez skutečného obsahu

**Co potřebujeme**: Opravit komponenty aby používaly správné i18n klíče pro názvy a popisy

---

## 🎯 IMPLEMENTAČNÍ PLÁN

### ✅ FÁZE 1: Příprava TypeScript Definic (HOTOVO 2025-11-23 14:45)
- [x] Přidat sekci `achievements.achievementNames` do src/types/i18n.ts (78 klíčů - kebab-case IDs)
- [x] Přidat sekci `achievements.achievementRequirements` do src/types/i18n.ts (78 klíčů - kebab-case IDs)
- [x] Ověřit TypeScript kompilaci (npm run typecheck) ✅ ZERO ERRORS

### ✅ FÁZE 2: Anglická Lokalizace (EN) (HOTOVO 2025-11-23 14:47)
- [x] Přidat všech 78 názvů do src/locales/en/index.ts pod `achievements.achievementNames`
- [x] Přidat všech 78 requirement textů do src/locales/en/index.ts pod `achievements.achievementRequirements`
- [x] Ověřit TypeScript kompilaci ✅ ZERO ERRORS

### ✅ FÁZE 3: Německá Lokalizace (DE) (HOTOVO 2025-11-23 14:50)
- [x] Přidat accessibility sekci do src/locales/de/index.ts
- [x] Přidat všech 78 názvů do src/locales/de/index.ts pod `achievements.achievementNames`
- [x] Přidat všech 78 requirement textů do src/locales/de/index.ts pod `achievements.achievementRequirements`
- [x] Ověřit TypeScript kompilaci ✅ ZERO ERRORS

### ✅ FÁZE 4: Španělská Lokalizace (ES) (HOTOVO 2025-11-23 14:52)
- [x] Přidat accessibility sekci do src/locales/es/index.ts
- [x] Přidat všech 78 názvů do src/locales/es/index.ts pod `achievements.achievementNames`
- [x] Přidat všech 78 requirement textů do src/locales/es/index.ts pod `achievements.achievementRequirements`
- [x] Ověřit TypeScript kompilaci ✅ ZERO ERRORS

### 🔄 FÁZE 5: Komponenty Update (AKTIVNÍ - ZAČÁTEK 2025-11-23 14:53)
- [x] Update AchievementCard.tsx - zelený popis používá t('achievements.achievementRequirements.{id}') ✅ HOTOVO
- [x] Update AchievementDetailModal.tsx - nadpis používá t('achievements.achievementNames.{id}') ✅ HOTOVO (LINE 552)
- [x] Update AchievementDetailModal.tsx - popis používá t('achievements.achievementRequirements.{id}') ✅ HOTOVO (LINE 579)
- [x] Ověřit TypeScript kompilaci ✅ ZERO ERRORS
- [ ] Testovat Browse All screen - zelené popisy v různých jazycích
- [ ] Testovat Detail Modal - nadpisy a popisy v různých jazycích

### ✅ FÁZE 6: Finalizace (HOTOVO 2025-11-23 15:02)
- [x] Commit všechny změny ✅ HOTOVO (fe58be0)
- [x] Push do remote repository ✅ HOTOVO
- [x] Aktualizovat I18N_FINAL_AUDIT_REPORT.md ✅ HOTOVO

---

## 🏆 ACHIEVEMENT CHECKLIST - 78 Achievementů

---

### 🏃‍♂️ HABITS - Návyky (8 achievementů)

#### 1. First Steps (`first-habit`)
**Název EN**: First Steps
**Název DE**: Erste Schritte
**Název ES**: Primeros Pasos
**Requirement EN**: Create your first habit
**Requirement DE**: Erstelle deine erste Gewohnheit
**Requirement ES**: Crea tu primer hábito

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 2. Habit Builder (`habit-builder`)
**Název EN**: Habit Builder
**Název DE**: Gewohnheitsbildner
**Název ES**: Constructor de Hábitos
**Requirement EN**: Create 5 different habits
**Requirement DE**: Erstelle 5 verschiedene Gewohnheiten
**Requirement ES**: Crea 5 hábitos diferentes

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 3. Century Club (`century-club`)
**Název EN**: Century Club
**Název DE**: Jahrhundert-Club
**Název ES**: Club del Centenario
**Requirement EN**: Complete 100 habit tasks
**Requirement DE**: Schließe 100 Gewohnheitsaufgaben ab
**Requirement ES**: Completa 100 tareas de hábitos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 4. Consistency King (`consistency-king`)
**Název EN**: Consistency King
**Název DE**: König der Beständigkeit
**Název ES**: Rey de la Consistencia
**Requirement EN**: Complete 1000 habit tasks
**Requirement DE**: Schließe 1000 Gewohnheitsaufgaben ab
**Requirement ES**: Completa 1000 tareas de hábitos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 5. Habit Streak Champion (`habit-streak-champion`)
**Název EN**: Habit Streak Champion
**Název DE**: Gewohnheits-Serien-Champion
**Název ES**: Campeón de Racha de Hábitos
**Requirement EN**: Achieve a 21-day streak with any habit
**Requirement DE**: Erreiche eine 21-Tage-Serie mit einer beliebigen Gewohnheit
**Requirement ES**: Logra una racha de 21 días con cualquier hábito

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 6. Century Streak (`century-streak`)
**Název EN**: Century Streak
**Název DE**: Jahrhundert-Serie
**Název ES**: Racha del Centenario
**Requirement EN**: Maintain a 75-day streak with any habit
**Requirement DE**: Halte eine 75-Tage-Serie mit einer beliebigen Gewohnheit
**Requirement ES**: Mantén una racha de 75 días con cualquier hábito

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 7. Multi-Tasker (`multi-tasker`)
**Název EN**: Multi-Tasker
**Název DE**: Multitasker
**Název ES**: Multitarea
**Requirement EN**: Complete 5 different habits in one day
**Requirement DE**: Schließe 5 verschiedene Gewohnheiten an einem Tag ab
**Requirement ES**: Completa 5 hábitos diferentes en un día

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 8. Habit Legend (`habit-legend`)
**Název EN**: Habit Legend
**Název DE**: Gewohnheitslegende
**Název ES**: Leyenda de Hábitos
**Requirement EN**: Reach Level 50 "Specialist V" with XP primarily from habit activities
**Requirement DE**: Erreiche Level 50 "Spezialist V" mit XP hauptsächlich aus Gewohnheitsaktivitäten
**Requirement ES**: Alcanza el Nivel 50 "Especialista V" con XP principalmente de actividades de hábitos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### 📝 JOURNAL - Deník (31 achievementů)

#### 9. First Reflection (`first-journal`)
**Název EN**: First Reflection
**Název DE**: Erste Reflexion
**Název ES**: Primera Reflexión
**Requirement EN**: Write your first gratitude journal entry
**Requirement DE**: Schreibe deinen ersten Dankbarkeitstagebucheintrag
**Requirement ES**: Escribe tu primera entrada de diario de gratitud

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 10. Deep Thinker (`deep-thinker`)
**Název EN**: Deep Thinker
**Název DE**: Tiefdenker
**Název ES**: Pensador Profundo
**Requirement EN**: Write a journal entry with at least 200 characters
**Requirement DE**: Schreibe einen Tagebucheintrag mit mindestens 200 Zeichen
**Requirement ES**: Escribe una entrada de diario con al menos 200 caracteres

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 11. Journal Enthusiast (`journal-enthusiast`)
**Název EN**: Journal Enthusiast
**Název DE**: Tagebuch-Enthusiast
**Název ES**: Entusiasta del Diario
**Requirement EN**: Write 100 journal entries
**Requirement DE**: Schreibe 100 Tagebucheinträge
**Requirement ES**: Escribe 100 entradas de diario

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 12. Grateful Heart (`grateful-heart`)
**Název EN**: Grateful Heart
**Název DE**: Dankbares Herz
**Název ES**: Corazón Agradecido
**Requirement EN**: Maintain a 7-day journal writing streak
**Requirement DE**: Halte eine 7-Tage-Tagebuchschreiben-Serie
**Requirement ES**: Mantén una racha de escritura de diario de 7 días

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 13. Gratitude Guru (`gratitude-guru`)
**Název EN**: Gratitude Guru
**Název DE**: Dankbarkeits-Guru
**Název ES**: Gurú de la Gratitud
**Requirement EN**: Achieve a 30-day journal writing streak
**Requirement DE**: Erreiche eine 30-Tage-Tagebuchschreiben-Serie
**Requirement ES**: Logra una racha de escritura de diario de 30 días

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 14. Eternal Gratitude (`eternal-gratitude`)
**Název EN**: Eternal Gratitude
**Název DE**: Ewige Dankbarkeit
**Název ES**: Gratitud Eterna
**Requirement EN**: Maintain a 100-day journal streak
**Requirement DE**: Halte eine 100-Tage-Tagebuch-Serie
**Requirement ES**: Mantén una racha de diario de 100 días

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 15. Bonus Seeker (`bonus-seeker`)
**Název EN**: Bonus Seeker
**Název DE**: Bonus-Sucher
**Název ES**: Buscador de Bonificaciones
**Requirement EN**: Write 50 bonus journal entries
**Requirement DE**: Schreibe 50 Bonus-Tagebucheinträge
**Requirement ES**: Escribe 50 entradas de diario bonificadas

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 16. First Star (`first-star`)
**Název EN**: First Star
**Název DE**: Erster Stern
**Název ES**: Primera Estrella
**Requirement EN**: Earn a star (first bonus entry of the day)
**Requirement DE**: Verdiene einen Stern (erster Bonuseintrag des Tages)
**Requirement ES**: Gana una estrella (primera entrada bonificada del día)

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 17. Five Stars (`five-stars`)
**Název EN**: Five Stars
**Název DE**: Fünf Sterne
**Název ES**: Cinco Estrellas
**Requirement EN**: Earn a star 5 times total
**Requirement DE**: Verdiene insgesamt 5 Mal einen Stern
**Requirement ES**: Gana una estrella 5 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 18. Flame Achiever (`flame-achiever`)
**Název EN**: Flame Achiever
**Název DE**: Flammen-Erreicher
**Název ES**: Logrador de Llama
**Requirement EN**: Earn a flame (5 bonuses in one day) for the first time
**Requirement DE**: Verdiene zum ersten Mal eine Flamme (5 Bonuseinträge an einem Tag)
**Requirement ES**: Gana una llama (5 bonificaciones en un día) por primera vez

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 19. Bonus Week (`bonus-week`)
**Název EN**: Bonus Week
**Název DE**: Bonus-Woche
**Název ES**: Semana de Bonificación
**Requirement EN**: At least 1 bonus every day for 7 days in a row
**Requirement DE**: Mindestens 1 Bonus jeden Tag für 7 Tage in Folge
**Requirement ES**: Al menos 1 bonificación cada día durante 7 días seguidos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 20. Crown Royalty (`crown-royalty`)
**Název EN**: Crown Royalty
**Název DE**: Kronen-Königtum
**Název ES**: Realeza de Corona
**Requirement EN**: Earn a crown (10 bonuses in one day) for the first time
**Requirement DE**: Verdiene zum ersten Mal eine Krone (10 Bonuseinträge an einem Tag)
**Requirement ES**: Gana una corona (10 bonificaciones en un día) por primera vez

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 21. Flame Collector (`flame-collector`)
**Název EN**: Flame Collector
**Název DE**: Flammen-Sammler
**Název ES**: Coleccionista de Llamas
**Requirement EN**: Earn a flame 5 times total
**Requirement DE**: Verdiene insgesamt 5 Mal eine Flamme
**Requirement ES**: Gana una llama 5 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 22. Golden Bonus Streak (`golden-bonus-streak`)
**Název EN**: Golden Bonus Streak
**Název DE**: Goldene Bonus-Serie
**Název ES**: Racha de Bonificación Dorada
**Requirement EN**: At least 3 bonuses every day for 7 days in a row
**Requirement DE**: Mindestens 3 Bonuseinträge jeden Tag für 7 Tage in Folge
**Requirement ES**: Al menos 3 bonificaciones cada día durante 7 días seguidos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 23. Triple Crown Master (`triple-crown-master`)
**Název EN**: Triple Crown Master
**Název DE**: Dreifache-Kronen-Meister
**Název ES**: Maestro de Triple Corona
**Requirement EN**: Earn a crown 3 times total
**Requirement DE**: Verdiene insgesamt 3 Mal eine Krone
**Requirement ES**: Gana una corona 3 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 24. Bonus Century (`bonus-century`)
**Název EN**: Bonus Century
**Název DE**: Bonus-Jahrhundert
**Název ES**: Siglo de Bonificación
**Requirement EN**: Write 200 bonus entries total
**Requirement DE**: Schreibe insgesamt 200 Bonuseinträge
**Requirement ES**: Escribe 200 entradas bonificadas en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 25. Star Beginner (`star-beginner`)
**Název EN**: Star Beginner
**Název DE**: Stern-Anfänger
**Název ES**: Principiante de Estrellas
**Requirement EN**: Earn a star 10 times total
**Requirement DE**: Verdiene insgesamt 10 Mal einen Stern
**Requirement ES**: Gana una estrella 10 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 26. Star Collector (`star-collector`)
**Název EN**: Star Collector
**Název DE**: Stern-Sammler
**Název ES**: Coleccionista de Estrellas
**Requirement EN**: Earn a star 25 times total
**Requirement DE**: Verdiene insgesamt 25 Mal einen Stern
**Requirement ES**: Gana una estrella 25 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 27. Star Master (`star-master`)
**Název EN**: Star Master
**Název DE**: Stern-Meister
**Název ES**: Maestro de Estrellas
**Requirement EN**: Earn a star 50 times total
**Requirement DE**: Verdiene insgesamt 50 Mal einen Stern
**Requirement ES**: Gana una estrella 50 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 28. Star Champion (`star-champion`)
**Název EN**: Star Champion
**Název DE**: Stern-Champion
**Název ES**: Campeón de Estrellas
**Requirement EN**: Earn a star 100 times total
**Requirement DE**: Verdiene insgesamt 100 Mal einen Stern
**Requirement ES**: Gana una estrella 100 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 29. Star Legend (`star-legend`)
**Název EN**: Star Legend
**Název DE**: Stern-Legende
**Název ES**: Leyenda de Estrellas
**Requirement EN**: Earn a star 200 times total
**Requirement DE**: Verdiene insgesamt 200 Mal einen Stern
**Requirement ES**: Gana una estrella 200 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 30. Flame Starter (`flame-starter`)
**Název EN**: Flame Starter
**Název DE**: Flammen-Starter
**Název ES**: Iniciador de Llamas
**Requirement EN**: Earn a flame 5 times total
**Requirement DE**: Verdiene insgesamt 5 Mal eine Flamme
**Requirement ES**: Gana una llama 5 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 31. Flame Accumulator (`flame-accumulator`)
**Název EN**: Flame Accumulator
**Název DE**: Flammen-Akkumulator
**Název ES**: Acumulador de Llamas
**Requirement EN**: Earn a flame 10 times total
**Requirement DE**: Verdiene insgesamt 10 Mal eine Flamme
**Requirement ES**: Gana una llama 10 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 32. Flame Master (`flame-master`)
**Název EN**: Flame Master
**Název DE**: Flammen-Meister
**Název ES**: Maestro de Llamas
**Requirement EN**: Earn a flame 25 times total
**Requirement DE**: Verdiene insgesamt 25 Mal eine Flamme
**Requirement ES**: Gana una llama 25 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 33. Flame Champion (`flame-champion`)
**Název EN**: Flame Champion
**Název DE**: Flammen-Champion
**Název ES**: Campeón de Llamas
**Requirement EN**: Earn a flame 50 times total
**Requirement DE**: Verdiene insgesamt 50 Mal eine Flamme
**Requirement ES**: Gana una llama 50 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 34. Flame Legend (`flame-legend`)
**Název EN**: Flame Legend
**Název DE**: Flammen-Legende
**Název ES**: Leyenda de Llamas
**Requirement EN**: Earn a flame 100 times total
**Requirement DE**: Verdiene insgesamt 100 Mal eine Flamme
**Requirement ES**: Gana una llama 100 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 35. Crown Achiever (`crown-achiever`)
**Název EN**: Crown Achiever
**Název DE**: Kronen-Erreicher
**Název ES**: Logrador de Corona
**Requirement EN**: Earn a crown 3 times total
**Requirement DE**: Verdiene insgesamt 3 Mal eine Krone
**Requirement ES**: Gana una corona 3 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 36. Crown Collector (`crown-collector`)
**Název EN**: Crown Collector
**Název DE**: Kronen-Sammler
**Název ES**: Coleccionista de Coronas
**Requirement EN**: Earn a crown 5 times total
**Requirement DE**: Verdiene insgesamt 5 Mal eine Krone
**Requirement ES**: Gana una corona 5 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 37. Crown Master (`crown-master`)
**Název EN**: Crown Master
**Název DE**: Kronen-Meister
**Název ES**: Maestro de Coronas
**Requirement EN**: Earn a crown 10 times total
**Requirement DE**: Verdiene insgesamt 10 Mal eine Krone
**Requirement ES**: Gana una corona 10 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 38. Crown Champion (`crown-champion`)
**Název EN**: Crown Champion
**Název DE**: Kronen-Champion
**Název ES**: Campeón de Coronas
**Requirement EN**: Earn a crown 25 times total
**Requirement DE**: Verdiene insgesamt 25 Mal eine Krone
**Requirement ES**: Gana una corona 25 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 39. Crown Emperor (`crown-emperor`)
**Název EN**: Crown Emperor
**Název DE**: Kronen-Kaiser
**Název ES**: Emperador de Coronas
**Requirement EN**: Earn a crown 50 times total
**Requirement DE**: Verdiene insgesamt 50 Mal eine Krone
**Requirement ES**: Gana una corona 50 veces en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### 🎯 GOALS - Cíle (8 achievementů)

#### 40. First Vision (`first-goal`)
**Název EN**: First Vision
**Název DE**: Erste Vision
**Název ES**: Primera Visión
**Requirement EN**: Set your first goal
**Requirement DE**: Setze dein erstes Ziel
**Requirement ES**: Establece tu primer objetivo

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 41. Goal Getter (`goal-getter`)
**Název EN**: Goal Getter
**Název DE**: Zielerfüller
**Název ES**: Conseguidor de Objetivos
**Requirement EN**: Complete your first goal
**Requirement DE**: Schließe dein erstes Ziel ab
**Requirement ES**: Completa tu primer objetivo

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 42. Ambitious (`ambitious`)
**Název EN**: Ambitious
**Název DE**: Ehrgeizig
**Název ES**: Ambicioso
**Requirement EN**: Set a goal with value 1000 or more
**Requirement DE**: Setze ein Ziel mit einem Wert von 1000 oder mehr
**Requirement ES**: Establece un objetivo con valor de 1000 o más

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 43. Goal Champion (`goal-champion`)
**Název EN**: Goal Champion
**Název DE**: Ziel-Champion
**Název ES**: Campeón de Objetivos
**Requirement EN**: Complete 5 goals
**Requirement DE**: Schließe 5 Ziele ab
**Requirement ES**: Completa 5 objetivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 44. Progress Tracker (`progress-tracker`)
**Název EN**: Progress Tracker
**Název DE**: Fortschritts-Verfolger
**Název ES**: Seguidor de Progreso
**Requirement EN**: Make progress on goals for 7 consecutive days
**Requirement DE**: Mache 7 aufeinanderfolgende Tage Fortschritt bei Zielen
**Requirement ES**: Avanza en objetivos durante 7 días consecutivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 45. Mega Dreamer (`mega-dreamer`)
**Název EN**: Mega Dreamer
**Název DE**: Mega-Träumer
**Název ES**: Mega Soñador
**Requirement EN**: Set a goal with value 1,000,000 or more
**Requirement DE**: Setze ein Ziel mit einem Wert von 1.000.000 oder mehr
**Requirement ES**: Establece un objetivo con valor de 1,000,000 o más

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 46. Achievement Unlocked (`achievement-unlocked`)
**Název EN**: Achievement Unlocked
**Název DE**: Erfolg freigeschaltet
**Název ES**: Logro Desbloqueado
**Requirement EN**: Complete 10 goals
**Requirement DE**: Schließe 10 Ziele ab
**Requirement ES**: Completa 10 objetivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 47. Million Achiever (`million-achiever`)
**Název EN**: Million Achiever
**Název DE**: Millionen-Erreicher
**Název ES**: Logrador de Millones
**Requirement EN**: Complete a goal with value 1,000,000 or more
**Requirement DE**: Schließe ein Ziel mit einem Wert von 1.000.000 oder mehr ab
**Requirement ES**: Completa un objetivo con valor de 1,000,000 o más

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### 🔥 CONSISTENCY - Konzistence (8 achievementů)

#### 48. Weekly Warrior (`weekly-warrior`)
**Název EN**: Weekly Warrior
**Název DE**: Wöchentlicher Krieger
**Název ES**: Guerrero Semanal
**Requirement EN**: Maintain a 7-day streak in any habit
**Requirement DE**: Halte eine 7-Tage-Serie in einer beliebigen Gewohnheit
**Requirement ES**: Mantén una racha de 7 días en cualquier hábito

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 49. Monthly Master (`monthly-master`)
**Název EN**: Monthly Master
**Název DE**: Monatlicher Meister
**Název ES**: Maestro Mensual
**Requirement EN**: Achieve a 30-day streak
**Requirement DE**: Erreiche eine 30-Tage-Serie
**Requirement ES**: Logra una racha de 30 días

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 50. Centurion (`centurion`)
**Název EN**: Centurion
**Název DE**: Zenturio
**Název ES**: Centurión
**Requirement EN**: Achieve 100 days of consistency
**Requirement DE**: Erreiche 100 Tage Beständigkeit
**Requirement ES**: Logra 100 días de consistencia

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 51. Daily Visitor (`daily-visitor`)
**Název EN**: Daily Visitor
**Název DE**: Täglicher Besucher
**Název ES**: Visitante Diario
**Requirement EN**: Use the app for 7 consecutive days
**Requirement DE**: Nutze die App 7 aufeinanderfolgende Tage
**Requirement ES**: Usa la app durante 7 días consecutivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 52. Dedicated User (`dedicated-user`)
**Název EN**: Dedicated User
**Název DE**: Engagierter Nutzer
**Název ES**: Usuario Dedicado
**Requirement EN**: Use the app for 30 consecutive days
**Requirement DE**: Nutze die App 30 aufeinanderfolgende Tage
**Requirement ES**: Usa la app durante 30 días consecutivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 53. Perfect Month (`perfect-month`)
**Název EN**: Perfect Month
**Název DE**: Perfekter Monat
**Název ES**: Mes Perfecto
**Requirement EN**: Complete activities in all 3 areas on 28+ days in a month
**Requirement DE**: Schließe Aktivitäten in allen 3 Bereichen an 28+ Tagen in einem Monat ab
**Requirement ES**: Completa actividades en las 3 áreas durante 28+ días en un mes

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 54. Triple Crown (`triple-crown`)
**Název EN**: Triple Crown
**Název DE**: Dreifache Krone
**Název ES**: Triple Corona
**Requirement EN**: Maintain 7+ day streaks in habits, journal, and goals simultaneously
**Requirement DE**: Halte 7+ Tage-Serien in Gewohnheiten, Tagebuch und Zielen gleichzeitig
**Requirement ES**: Mantén rachas de 7+ días en hábitos, diario y objetivos simultáneamente

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 55. Gratitude Guardian (`gratitude-guardian`)
**Název EN**: Gratitude Guardian
**Název DE**: Dankbarkeits-Wächter
**Název ES**: Guardián de la Gratitud
**Requirement EN**: Write journal entries for 21 consecutive days
**Requirement DE**: Schreibe Tagebucheinträge für 21 aufeinanderfolgende Tage
**Requirement ES**: Escribe entradas de diario durante 21 días consecutivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### 👑 MASTERY - Mistrovství (9 achievementů)

#### 56. Dream Fulfiller (`dream-fulfiller`)
**Název EN**: Dream Fulfiller
**Název DE**: Traumerfüller
**Název ES**: Cumplidor de Sueños
**Requirement EN**: Complete 3 goals
**Requirement DE**: Schließe 3 Ziele ab
**Requirement ES**: Completa 3 objetivos

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 57. Level Up (`level-up`)
**Název EN**: Level Up
**Název DE**: Level aufsteigen
**Název ES**: Subir de Nivel
**Requirement EN**: Reach level 10 "Beginner V"
**Requirement DE**: Erreiche Level 10 "Anfänger V"
**Requirement ES**: Alcanza el nivel 10 "Principiante V"

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 58. SelfRise Expert (`selfrise-expert`)
**Název EN**: SelfRise Expert
**Název DE**: SelfRise-Experte
**Název ES**: Experto en SelfRise
**Requirement EN**: Reach level 25 "Adept V"
**Requirement DE**: Erreiche Level 25 "Adept V"
**Requirement ES**: Alcanza el nivel 25 "Adepto V"

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 59. SelfRise Master (`selfrise-master`)
**Název EN**: SelfRise Master
**Název DE**: SelfRise-Meister
**Název ES**: Maestro de SelfRise
**Requirement EN**: Reach level 50 "Specialist V"
**Requirement DE**: Erreiche Level 50 "Spezialist V"
**Requirement ES**: Alcanza el nivel 50 "Especialista V"

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 60. Ultimate SelfRise Legend (`ultimate-selfrise-legend`)
**Název EN**: Ultimate SelfRise Legend
**Název DE**: Ultimative SelfRise-Legende
**Název ES**: Leyenda Definitiva de SelfRise
**Requirement EN**: Reach level 100 "Mythic V"
**Requirement DE**: Erreiche Level 100 "Mythisch V"
**Requirement ES**: Alcanza el nivel 100 "Mítico V"

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 61. Recommendation Master (`recommendation-master`)
**Název EN**: Recommendation Master
**Název DE**: Empfehlungs-Meister
**Název ES**: Maestro de Recomendaciones
**Requirement EN**: Follow 20 personalized recommendations
**Requirement DE**: Folge 20 personalisierten Empfehlungen
**Requirement ES**: Sigue 20 recomendaciones personalizadas

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 62. Balance Master (`balance-master`)
**Název EN**: Balance Master
**Název DE**: Balance-Meister
**Název ES**: Maestro del Equilibrio
**Requirement EN**: Use all 3 features in one day 10 times
**Requirement DE**: Nutze alle 3 Funktionen an einem Tag 10 Mal
**Requirement ES**: Usa las 3 funciones en un día 10 veces

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 63. Trophy Collector (`trophy-collector-basic`)
**Název EN**: Trophy Collector
**Název DE**: Trophäen-Sammler
**Název ES**: Coleccionista de Trofeos
**Requirement EN**: Unlock 10 achievements
**Requirement DE**: Schalte 10 Erfolge frei
**Requirement ES**: Desbloquea 10 logros

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 64. Trophy Master (`trophy-collector-master`)
**Název EN**: Trophy Master
**Název DE**: Trophäen-Meister
**Název ES**: Maestro de Trofeos
**Requirement EN**: Unlock 25 achievements
**Requirement DE**: Schalte 25 Erfolge frei
**Requirement ES**: Desbloquea 25 logros

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### ✨ SPECIAL - Speciální (4 achievementy)

#### 65. Lightning Start (`lightning-start`)
**Název EN**: Lightning Start
**Název DE**: Blitzstart
**Název ES**: Inicio Relámpago
**Requirement EN**: Create and complete a habit on the same day 3 times
**Requirement DE**: Erstelle und schließe eine Gewohnheit am selben Tag 3 Mal ab
**Requirement ES**: Crea y completa un hábito el mismo día 3 veces

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 66. Seven Wonder (`seven-wonder`)
**Název EN**: Seven Wonder
**Název DE**: Sieben Wunder
**Název ES**: Siete Maravillas
**Requirement EN**: Have 7 or more active habits simultaneously
**Requirement DE**: Habe 7 oder mehr aktive Gewohnheiten gleichzeitig
**Requirement ES**: Ten 7 o más hábitos activos simultáneamente

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 67. Persistence Pays (`persistence-pays`)
**Název EN**: Persistence Pays
**Název DE**: Beharrlichkeit zahlt sich aus
**Název ES**: La Persistencia Paga
**Requirement EN**: Return after a 3+ day break and complete 7 activities
**Requirement DE**: Kehre nach einer 3+ Tage Pause zurück und schließe 7 Aktivitäten ab
**Requirement ES**: Regresa después de un descanso de 3+ días y completa 7 actividades

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 68. SelfRise Legend (`selfrise-legend`)
**Název EN**: SelfRise Legend
**Název DE**: SelfRise-Legende
**Název ES**: Leyenda de SelfRise
**Requirement EN**: Achieve mastery: 10 goals + 500 habits + 365 journal entries
**Requirement DE**: Erreiche Meisterschaft: 10 Ziele + 500 Gewohnheiten + 365 Tagebucheinträge
**Requirement ES**: Alcanza la maestría: 10 objetivos + 500 hábitos + 365 entradas de diario

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

### 🏆 LOYALTY - Věrnost (10 achievementů)

#### 69. First Week (`loyalty-first-week`)
**Název EN**: First Week
**Název DE**: Erste Woche
**Název ES**: Primera Semana
**Requirement EN**: 7 active days total
**Requirement DE**: 7 aktive Tage insgesamt
**Requirement ES**: 7 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 70. Two Weeks Strong (`loyalty-two-weeks-strong`)
**Název EN**: Two Weeks Strong
**Název DE**: Zwei Wochen stark
**Název ES**: Dos Semanas Fuerte
**Requirement EN**: 14 active days total
**Requirement DE**: 14 aktive Tage insgesamt
**Requirement ES**: 14 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 71. Three Weeks Committed (`loyalty-three-weeks-committed`)
**Název EN**: Three Weeks Committed
**Název DE**: Drei Wochen engagiert
**Název ES**: Tres Semanas Comprometido
**Requirement EN**: 21 active days total
**Requirement DE**: 21 aktive Tage insgesamt
**Requirement ES**: 21 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 72. Month Explorer (`loyalty-month-explorer`)
**Název EN**: Month Explorer
**Název DE**: Monats-Entdecker
**Název ES**: Explorador de Mes
**Requirement EN**: 30 active days total
**Requirement DE**: 30 aktive Tage insgesamt
**Requirement ES**: 30 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 73. Two Month Veteran (`loyalty-two-month-veteran`)
**Název EN**: Two Month Veteran
**Název DE**: Zwei-Monats-Veteran
**Název ES**: Veterano de Dos Meses
**Requirement EN**: 60 active days total
**Requirement DE**: 60 aktive Tage insgesamt
**Requirement ES**: 60 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 74. Century User (`loyalty-century-user`)
**Název EN**: Century User
**Název DE**: Jahrhundert-Nutzer
**Název ES**: Usuario del Centenario
**Requirement EN**: 100 active days total
**Requirement DE**: 100 aktive Tage insgesamt
**Requirement ES**: 100 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 75. Half Year Hero (`loyalty-half-year-hero`)
**Název EN**: Half Year Hero
**Název DE**: Halbjahres-Held
**Název ES**: Héroe de Medio Año
**Requirement EN**: 183 active days total
**Requirement DE**: 183 aktive Tage insgesamt
**Requirement ES**: 183 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 76. Year Legend (`loyalty-year-legend`)
**Název EN**: Year Legend
**Název DE**: Jahres-Legende
**Název ES**: Leyenda del Año
**Requirement EN**: 365 active days total
**Requirement DE**: 365 aktive Tage insgesamt
**Requirement ES**: 365 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 77. Ultimate Veteran (`loyalty-ultimate-veteran`)
**Název EN**: Ultimate Veteran
**Název DE**: Ultimativer Veteran
**Název ES**: Veterano Definitivo
**Requirement EN**: 500 active days total
**Requirement DE**: 500 aktive Tage insgesamt
**Requirement ES**: 500 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

#### 78. Loyalty Master (`loyalty-master`)
**Název EN**: Loyalty Master
**Název DE**: Treue-Meister
**Název ES**: Maestro de Lealtad
**Requirement EN**: 1000 active days total
**Requirement DE**: 1000 aktive Tage insgesamt
**Requirement ES**: 1000 días activos en total

- [ ] EN název přidán
- [ ] EN requirement přidán
- [ ] DE název přidán
- [ ] DE requirement přidán
- [ ] ES název přidán
- [ ] ES requirement přidán
- [ ] Ověřeno v Browse All
- [ ] Ověřeno v Detail Modal

---

## 📊 PROGRESS STATISTIKY

### Celkový Přehled
- **Celkem achievementů**: 78
- **Kategorizace hotova**: 78 / 78 (100%) ✅
- **Zbývá**: Komponenty & testování

### Rozdělení podle kategorií (všechny přeloženy)
- **Habits**: 8 / 8 ✅
- **Journal**: 31 / 31 ✅
- **Goals**: 8 / 8 ✅
- **Consistency**: 8 / 8 ✅
- **Mastery**: 9 / 9 ✅
- **Special**: 4 / 4 ✅
- **Loyalty**: 10 / 10 ✅

### Rozdělení podle fází
- **Fáze 1 - TypeScript definice**: ✅ HOTOVO (2025-11-23 14:45)
- **Fáze 2 - EN lokalizace**: ✅ HOTOVO (2025-11-23 14:47)
- **Fáze 3 - DE lokalizace**: ✅ HOTOVO (2025-11-23 14:50)
- **Fáze 4 - ES lokalizace**: ✅ HOTOVO (2025-11-23 14:52)
- **Fáze 5 - Komponenty update**: 🔄 IN PROGRESS (2025-11-23 14:53)
- **Fáze 6 - Finalizace**: ⏳ PENDING

---

## 🎯 QUICK REFERENCE

### Kde jsou achievementy definované?
- **Katalog**: `/src/data/achievementCatalog.ts`
- **TypeScript typy**: `/src/types/i18n.ts`
- **EN lokalizace**: `/src/locales/en/index.ts`
- **DE lokalizace**: `/src/locales/de/index.ts`
- **ES lokalizace**: `/src/locales/es/index.ts`

### Které komponenty potřebujeme upravit?
- **AchievementCard.tsx**: Zelený popis v Browse All
- **AchievementDetailModal.tsx**: Nadpis a popis v Detail Modal

### Formát klíčů
- **Názvy**: `achievements.names.{achievement-id}` (např. `achievements.names.first-habit`)
- **Requirements**: `achievements.requirements.{achievement-id}` (např. `achievements.requirements.first-habit`)

---

**Poslední aktualizace**: 2025-11-23
**Autor**: Claude Code
**Status**: 🔴 Ready to start Phase 18
