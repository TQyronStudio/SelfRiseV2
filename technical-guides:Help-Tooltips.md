# SelfRise V2 - Help Tooltip System Technical Guide

## Overview

Help Tooltip systém poskytuje kontextové nápovědy v aplikaci pomocí HelpTooltip komponenty. Systém je navržen tak, aby pomáhal uživatelům tam, kde může být funkcionalita nejasná, ale nepřeplňoval interface zbytečnými informacemi.

## Aktuální Implementace Tooltips

### 1. XP Progress System
- **Umístění**: Home screen, v XP progress baru
- **i18n klíč**: `home.xpSystem`
- **Pozice**: Vedle názvu levelu v title header row
- **Typ**: `variant="prominent"`

**Text:**
```
title: "How XP Works"
content: "Complete habits, achieve goals, write in your journal - everything gives you XP! 🎯 As you earn XP, you'll level up and unlock cooler badges and titles. The more you do, the higher you rise! 🚀"
```

### 2. Goals Overview System
- **Umístění**: Goals screen, vedle "Active Goals" heading
- **i18n klíč**: `goals.overview`
- **Pozice**: V GoalListWithDragAndDrop komponentě
- **Typ**: standard

**Text:**
```
title: "Create Any Goal"
content: "You can create absolutely any goal you want! 🎯 Just enter your custom units (books, miles, hours, pages, kilometers, etc.) and set your target amount. That's it - the app will track your progress!"
```

### 3. Journal Streak System
- **Umístění**: My Journal screen, vedle "Longest streak"
- **i18n klíč**: `journal.selfRiseStreak`
- **Pozice**: V JournalHomeSection komponentě
- **Typ**: standard

**Text:**
```
title: "Journal Streak"
content: "Write at least 3 entries to build your streak! 📝✨ Every day you journal, your streak grows. Miss a day? No worries - just start building again tomorrow! Keep going to unlock streak badges!"
```

### 4. Habit Scheduling System
- **Umístění**: Habits screen, v kalendáři pro habit scheduling
- **i18n klíč**: `habits.scheduling`
- **Pozice**: V habit kalendář komponentě
- **Typ**: standard

**Text:**
```
title: "Smart Scheduling"
content: "Plan your habits perfectly! 📅✨ Set which days to do each habit - daily, weekdays, weekends, or custom patterns. The app will track your progress and help you stay consistent!"
```

### 5. Habit Make-up Function
- **Umístění**: Habits screen, v kalendáři pro bonus/make-up funktionalitu
- **i18n klíč**: `habits.makeupFunction`
- **Pozice**: V habit completion kalendář komponentě
- **Typ**: standard

**Text:**
```
title: "Bonus & Make-up Days"
content: "Missed a day? No problem! 💪 Use make-up days to catch up, or go beyond your schedule with bonus completions. Both count toward your streaks and give you XP!"
```

## Pravidla pro Psaní Help Textů

### 1. Ton a Styl
- **Přátelský a motivující**: Používej pozitivní jazyk a motivační fráze
- **Emojis**: Přidávej relevantní emojis pro vizuální atraktivnost
- **Jednoduchý jazyk**: Vyhni se technickým termínům
- **Krátké a jasné**: Maximum 2-3 věty pro content

### 2. Struktura Textu
```typescript
{
  title: "Krátký výstižný název (2-4 slova)",
  content: "Vysvětlení co to dělá + jak to použít + motivace/benefit! 🎯"
}
```

### 3. Příklady Správného Stylu

**✅ Správně:**
```
title: "Smart Scheduling"
content: "Plan your habits perfectly! 📅✨ Set which days to do each habit - daily, weekdays, weekends, or custom patterns. The app will track your progress and help you stay consistent!"
```

**❌ Špatně (příliš technické):**
```
title: "Habit Scheduling Configuration"
content: "This feature allows users to configure scheduling parameters for habit completion tracking based on specified day patterns."
```

### 4. Použití Emojis
- **Habit systém**: 📅✨💪🎯
- **Journal systém**: 📝✨📖💭
- **Goals systém**: 🎯🚀⭐💫
- **XP/Gamifikace**: 🎯🚀⭐💎✨

## Technická Implementace

### 1. i18n Struktura
Všechny help texty jsou v `/src/locales/en/index.ts`:

```typescript
help: {
  home: {
    xpSystem: {
      title: "How XP Works",
      content: "Complete habits, achieve goals..."
    }
  },
  goals: {
    overview: {
      title: "Create Any Goal",
      content: "You can create absolutely any goal..."
    }
  },
  journal: {
    selfRiseStreak: {
      title: "Journal Streak",
      content: "Write at least 3 entries..."
    }
  },
  habits: {
    scheduling: {
      title: "Smart Scheduling",
      content: "Plan your habits perfectly..."
    },
    makeupFunction: {
      title: "Bonus & Make-up Days",
      content: "Missed a day? No problem..."
    }
  }
}
```

### 2. HelpTooltip Komponenta
```typescript
<HelpTooltip
  helpKey="section.feature"  // i18n klíč
  iconSize={16}             // velikost ikony
  maxWidth={300}            // maximální šířka tooltip
  variant="prominent"       // volitelně pro důležité tooltips
/>
```

### 3. Performance Optimalizace
- React.memo implementace
- Deferred analytics calls
- Optimalizované render měření
- Timeout pro analytics: 100ms

## Pravidla pro Přidávání Nových Tooltips

### 1. Kdy PŘIDAT tooltip:
- ✅ Funkcionalita není očividná z UI
- ✅ Nový uživatel by mohl být zmatený
- ✅ Komplexní systém (XP, streaks, scheduling)
- ✅ Custom funkcionalita specifická pro app

### 2. Kdy NEPŘIDÁVAT tooltip:
- ❌ Standardní UI elementy (tlačítka, seznamy)
- ❌ Well-known systémy (achievements, basic navigation)
- ❌ Jednoduchá akce (add, edit, delete)
- ❌ Self-explanatory features

### 3. Umístění Guidelines
- **Vedle relevantního elementu**: Ne ve zvláštní sekci
- **V kontextu použití**: Tam kde uživatel funkcionalitu potřebuje
- **Diskrétně**: Nenarušovat hlavní UI flow

## Údržba a Aktualizace

### 1. Při změnách funkcionalité:
1. Zkontroluj jestli stávající help text je stále přesný
2. Aktualizuj content pokud se změnilo chování
3. Přidej nový tooltip pokud se přidala komplexní funkcionalita

### 2. Při překladu do nových jazyků:
1. Zachovej přátelský a motivující ton
2. Adaptuj emojis pokud jsou kulturně nevhodné
3. Zachovaj stručnost (max 2-3 věty)

### 3. A/B Testing možnosti:
- Různé formulace content textu
- Pozice tooltips
- Variant styling (prominent vs standard)

## Metriky a Sledování

### 1. Analytics Events
- `help_tooltip_shown` - kdy se tooltip zobrazí
- `help_tooltip_dismissed` - kdy uživatel tooltip zavře
- Performance tracking pro render times

### 2. Success Metrics
- Snížení confusion rate u nových uživatelů
- Zvýšení feature adoption rate
- Pozitivní feedback na help systém

---

*Tato dokumentace je živý dokument a měl by být aktualizován při každé změně help tooltip systému.*