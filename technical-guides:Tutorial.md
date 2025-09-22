# SelfRise V2 - Onboarding Tutorial System Technical Guide

## Overview

Onboarding Tutorial je interaktivní průvodce pro nové uživatele, který je provede celou aplikací při prvním spuštění. Systém používá overlay approach s tmavnutím obrazovky a spotlight efekty pro zvýraznění specifických elementů.

## Design Specifikace

### 1. Visual Design
- **Overlay**: Tmavý overlay (rgba(0,0,0,0.8)) přes celou obrazovku
- **Spotlight Effect**: Postupně se zužující světlý kruh na cílový element
- **Pulsing Animation**: Zvýrazněné elementy pulzují pro lepší viditelnost
- **Skip Button**: Křížek v pravém horním rohu (slabě viditelný během celého tutoriálu)
- **Next Button**: Zobrazuje se když není vyžadována specifická akce od uživatele

### 2. Interaction Design
- **Blocking**: Uživatel může kliknout pouze na zvýrazněný element nebo skip/next tlačítka
- **Progressive Disclosure**: Formuláře se vyplňují postupně s next tlačítkem po prvním znaku
- **Haptic Feedback**: Při každém kroku tutoriálu
- **Smooth Transitions**: Plynulé přechody mezi kroky (300ms animace)

## Tutorial Flow - 15 Kroků

### Step 1: Welcome Modal
**Type**: Modal
**Content**:
```
title: "Welcome to SelfRise! 🌟"
content: "Ready to transform your life? Let's take a quick tour and set up your first habits, goals, and journal entries!"
button: "Let's Start!"
```

### Step 2: App Overview
**Type**: Spotlight
**Target**: Celá obrazovka
**Content**:
```
title: "Your Personal Growth Hub"
content: "SelfRise helps you build habits, track goals, and practice gratitude. Let's explore the three main sections that will change your life!"
action: "next"
```

### Step 3: Quick Actions Explanation
**Type**: Spotlight
**Target**: Quick Actions sekce na home screen
**Content**:
```
title: "Quick Actions ⚡"
content: "These buttons let you quickly add habits, write in your journal, or create goals without navigating around the app!"
action: "next"
```

### Step 4: Create First Habit - Button
**Type**: Spotlight
**Target**: Add Habit tlačítko
**Content**:
```
title: "Create Your First Habit 💪"
content: "Click the + Add Habit button to build your first positive routine!"
action: "click_element"
```

### Step 5a: Habit Name Input
**Type**: Spotlight
**Target**: Název návyku textové pole
**Content**:
```
title: "Name Your Habit"
content: "What habit would you like to build? Examples: 'Drink water', 'Read 10 pages', 'Meditate 5 minutes'"
action: "type_text"
next_trigger: "first_character"
```

### Step 5b: Habit Color Selection
**Type**: Spotlight
**Target**: Color picker
**Content**:
```
title: "Choose a Color 🎨"
content: "Pick a color that motivates you - it will help you quickly spot this habit!"
action: "select_option"
```

### Step 5c: Habit Icon Selection
**Type**: Spotlight
**Target**: Icon picker
**Content**:
```
title: "Pick an Icon"
content: "Choose an icon that represents your habit perfectly!"
action: "select_option"
```

### Step 5d: Scheduled Days
**Type**: Spotlight
**Target**: Scheduled days sekce
**Content**:
```
title: "When Will You Do It? 📅"
content: "Select which days you want to practice this habit. Start small - you can always adjust later!"
action: "select_days"
```

### Step 5e: Create Habit
**Type**: Spotlight
**Target**: Create tlačítko
**Content**:
```
title: "Create Your Habit!"
content: "Click Create to add your first habit!"
action: "click_element"
```

### Step 6: First Habit Achievement
**Type**: Achievement Modal (automatické)
**Achievement ID**: `first-habit`
**Behavior**: Po vytvoření prvního návyku se automaticky spustí achievement modal
**Tutorial Action**: Čekat na uzavření achievement modalu, pak pokračovat na krok 7
**Note**: Vyžaduje implementaci achievement check v HabitsContext.createHabit()

### Step 7: Navigate to Journal
**Type**: Spotlight
**Target**: My Journal tab v bottom navigation
**Content**:
```
title: "Let's Explore Your Journal 📝"
content: "Click on My Journal to see where you'll record your daily gratitude and self-praise!"
action: "click_element"
```

### Step 8: Journal Actions Explanation
**Type**: Spotlight
**Target**: Add Gratitude a Add Self-Praise tlačítka
**Content**:
```
title: "Daily Gratitude & Self-Praise ✨"
content: "Write at least 3 entries daily to build your journal streak! Express gratitude and celebrate your wins here every day."
action: "next"
```

### Step 9: Navigate to Goals
**Type**: Spotlight
**Target**: Goals tab v bottom navigation
**Content**:
```
title: "Time for Your Goals! 🎯"
content: "Click on Goals to see where you'll track your bigger aspirations!"
action: "click_element"
```

### Step 10: Create First Goal - Button
**Type**: Spotlight
**Target**: + Add Goal tlačítko
**Content**:
```
title: "Create Your First Goal"
content: "Click + Add Goal to set your first meaningful target!"
action: "click_element"
```

### Step 11a: Goal Title
**Type**: Spotlight
**Target**: Goal title input
**Content**:
```
title: "What's Your Goal?"
content: "Examples: 'Read 12 books', 'Run 100 kilometers', 'Save $1000', 'Learn Spanish'"
action: "type_text"
next_trigger: "first_character"
```

### Step 11b: Target Date
**Type**: Spotlight
**Target**: Target date picker
**Content**:
```
title: "When Do You Want to Achieve It? 📅"
content: "Set a realistic deadline that motivates you!"
action: "select_date"
```

### Step 11c: Unit Selection
**Type**: Spotlight
**Target**: Unit input/picker
**Content**:
```
title: "What Unit Will You Track?"
content: "Examples: books, kilometers, dollars, hours, pages, sessions"
action: "type_text"
```

### Step 11d: Target Value
**Type**: Spotlight
**Target**: Value input
**Content**:
```
title: "How Much Do You Want to Achieve?"
content: "Enter your target number - you can always adjust it later!"
action: "type_number"
```

### Step 11e: Category Selection
**Type**: Spotlight
**Target**: Category picker
**Content**:
```
title: "Choose a Category 📂"
content: "This helps organize your goals and track progress by area of life!"
action: "select_option"
```

### Step 11f: Create Goal
**Type**: Spotlight
**Target**: Create tlačítko
**Content**:
```
title: "Create Your Goal!"
content: "Click Create to add your first goal!"
action: "click_element"
```

### Step 12: First Goal Achievement
**Type**: Achievement Modal (automatické)
**Achievement ID**: `first-goal`
**Behavior**: Po vytvoření prvního cíle se automaticky spustí achievement modal
**Tutorial Action**: Čekat na uzavření achievement modalu, pak pokračovat na krok 13
**Note**: Už implementováno v GoalsContext.createGoal()

### Step 13: Navigate to Home
**Type**: Spotlight
**Target**: Home tab v bottom navigation
**Content**:
```
title: "Back to Your Dashboard 🏠"
content: "Click Home to see your progress overview!"
action: "click_element"
```

### Step 14: XP System Explanation
**Type**: Spotlight
**Target**: XP Progress bar sekce
**Content**:
```
title: "Your Growth Journey 📈"
content: "Everything you do earns XP! Complete habits, achieve goals, write in your journal - watch your level rise as you grow! 🌟"
action: "next"
```

### Step 15: Trophy Room
**Type**: Spotlight
**Target**: Trophy room tlačítko
**Content**:
```
title: "Your Trophy Collection 🏆"
content: "Here you'll see all the achievements you can unlock! Each milestone on your journey deserves recognition!"
action: "next"
```

### Step 16: Completion Modal
**Type**: Modal
**Content**:
```
title: "You're All Set! 🎊"
content: "Congratulations! You now know how to use SelfRise to build habits, achieve goals, and practice gratitude. Your transformation journey starts now - use this power to reach your dreams and build unshakeable self-worth!"
button: "Start My Journey!"
```

## Technical Implementation

### 1. Tutorial State Management
```typescript
interface TutorialState {
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  isSkipped: boolean;
  userInteractionBlocked: boolean;
}

interface TutorialStep {
  id: string;
  type: 'modal' | 'spotlight';
  target?: string; // CSS selector nebo ref
  content: {
    title: string;
    content: string;
    button?: string;
  };
  action: 'next' | 'click_element' | 'type_text' | 'select_option' | 'select_date' | 'type_number' | 'select_days';
  nextTrigger?: 'first_character' | 'selection' | 'click';
  validation?: (value: any) => boolean;
}
```

### 2. Overlay Component Architecture
```typescript
<TutorialProvider>
  <TutorialOverlay>
    <SpotlightEffect targetRef={currentStepTarget} />
    <TutorialContent step={currentStep} />
    <SkipButton onSkip={handleSkip} />
    <NextButton visible={showNext} onNext={handleNext} />
  </TutorialOverlay>
  <App />
</TutorialProvider>
```

### 3. Animation Specifications
```typescript
const ANIMATIONS = {
  overlayFadeIn: { duration: 300, easing: 'ease-out' },
  spotlightTransition: { duration: 500, easing: 'ease-in-out' },
  pulseAnimation: {
    duration: 1500,
    easing: 'ease-in-out',
    iterationCount: 'infinite',
    direction: 'alternate'
  },
  elementHighlight: { duration: 200, easing: 'ease-out' }
};
```

### 4. Interaction Blocking
```typescript
// Blokování všech interakcí kromě tutorial elementů
const blockNonTutorialInteractions = (allowedSelectors: string[]) => {
  // Přidat overlay s pointer-events: none
  // Výjimky pro allowedSelectors s pointer-events: auto
};
```

## Storage & Persistence

### 1. Tutorial Completion Tracking
```typescript
const TUTORIAL_STORAGE_KEY = 'onboarding_tutorial_completed';
const TUTORIAL_STEP_KEY = 'onboarding_current_step';

// Uložení stavu pro případ přerušení
const saveTutorialProgress = async (step: number) => {
  await AsyncStorage.setItem(TUTORIAL_STEP_KEY, step.toString());
};

// Označení tutoriálu jako dokončeného
const markTutorialCompleted = async () => {
  await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
};
```

### 2. Resume Tutorial Logic
```typescript
const shouldShowTutorial = async (): Promise<boolean> => {
  const isCompleted = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
  return isCompleted !== 'true';
};

const getTutorialResumeStep = async (): Promise<number> => {
  const step = await AsyncStorage.getItem(TUTORIAL_STEP_KEY);
  return step ? parseInt(step, 10) : 1;
};
```

## Content Guidelines

### 1. Text Writing Rules
- **Motivační tón**: Používat pozitivní, povzbuzující jazyk
- **Emojis**: Přidat relevantní emojis pro vizuální přitažlivost
- **Krátké texty**: Maximum 2 věty pro content
- **Actionable**: Jasně říci co má uživatel udělat
- **Examples**: Poskytovat konkrétní příklady při vyplňování

### 2. Button Text Standards
```typescript
const BUTTON_TEXTS = {
  next: "Next",
  continue: "Continue",
  start: "Let's Start!",
  create: "Create",
  done: "Start My Journey!",
  skip: "Skip Tutorial"
};
```

### 3. Error States
```typescript
// Pokud uživatel zkusí jít příliš rychle nebo přeskočit požadovanou akci
const VALIDATION_MESSAGES = {
  emptyField: "Please fill in this field first!",
  invalidSelection: "Please make a selection!",
  requiredAction: "Complete this step to continue!"
};
```

## Integration Points

### 1. Screen Integration
- **Home Screen**: Quick Actions highlighting
- **Habit Creation**: Form field highlighting a validation
- **Journal Screen**: Button highlighting
- **Goals Creation**: Progressive form completion
- **Trophy Room**: Achievement preview

### 2. Navigation Integration
```typescript
// Tutorial kontroluje navigaci
const handleTutorialNavigation = (targetScreen: string) => {
  if (tutorialState.isActive && tutorialState.currentStep === expectedStep) {
    // Povolit navigaci
    navigateToScreen(targetScreen);
    advanceTutorialStep();
  } else {
    // Blokovat navigaci
    showTutorialReminder();
  }
};
```

### 3. Form Integration
```typescript
// Progresivní vyplňování formulářů
const handleFormInput = (fieldName: string, value: string) => {
  if (tutorialState.isActive && isCurrentTutorialField(fieldName)) {
    if (value.length > 0 && tutorialState.nextTrigger === 'first_character') {
      showNextButton();
    }
  }
};
```

## Success Metrics

### 1. Tutorial Completion Tracking
```typescript
interface TutorialMetrics {
  startedAt: Date;
  completedAt?: Date;
  skippedAt?: Date;
  lastStepReached: number;
  timeSpentTotal: number;
  timeSpentPerStep: number[];
  interruptionCount: number;
}
```

### 2. Analytics Events
- `tutorial_started`
- `tutorial_step_completed` (with step number)
- `tutorial_skipped` (with step number)
- `tutorial_completed`
- `tutorial_resumed`
- `tutorial_form_validation_failed`

## Edge Cases & Error Handling

### 1. App Interruption
- Uložit current step před backgrounding
- Obnovit tutorial při návratu do app
- Nabídnout možnost pokračovat nebo začít znovu

### 2. Navigation Conflicts
- Blokovat deep links během tutoriálu
- Blokovat notifikační navigaci
- Handle back button behavior

### 3. Form Validation
- Ukázat chyby jemně s možností opravy
- Nepokračovat dokud není vše správně vyplněno
- Poskytovat contextual help

## Implementation Decisions & Clarifications

### 1. Technology Stack
**React Native** - Tutorial implementace bude používat React Native specifické řešení pro spotlight efekty a overlay system.

### 2. Form Validation Requirements
**První znak trigger** - Pro všechny text input fieldy (habit název, goal název, unit) stačí napsat první znak pro aktivaci Next tlačítka.

### 3. Responsive Design
**Screen size adaptace** - Spotlight velikost a pozice se automaticky adaptuje pro tablety vs phones. Větší spotlight pro tablety, menší pro telefony.

### 4. Recovery & Resume Logic
**Crash recovery** - Pokud se aplikace crashne během tutoriálu, při restartu se nabídne pokračování od posledního uloženého kroku nebo restart celého tutoriálu.

### 5. Achievement Integration
**Existující Achievement System** - Namísto custom gratulačních modalů se použijí **skutečné achievement modaly**:

#### Ověřené Achievementy:
- **`first-habit`** - Za vytvoření prvního návyku (Step 6)
- **`first-goal`** - Za vytvoření prvního cíle (Step 12)
- **`goal-getter`** - Za dokončení prvního cíle (mimo tutorial)

#### Tutorial Flow Úpravy:
```typescript
// Step 6: Namísto custom modalu
// ❌ Původní: TutorialCelebrationModal
// ✅ Nově: Automatické spuštění "first-habit" achievement modal

// Step 12: Namísto custom modalu
// ❌ Původní: TutorialCelebrationModal
// ✅ Nově: Automatické spuštění "first-goal" achievement modal
```

#### Required Implementation:
1. **Habit Creation Achievement**: Přidat `AchievementService.runBatchAchievementCheck()` do HabitsContext.createHabit() (aktuálně chybí)
2. **Goal Creation Achievement**: Už implementováno v GoalsContext.createGoal()
3. **Tutorial Coordination**: Tutorial musí čekat na achievement modal completion před pokračováním

#### Modal Priority Integration:
Tutorial se integruje s existujícím 4-tier modal priority systemem:
- **Tier 1**: Activity modals (habit/goal creation) - Tutorial actions
- **Tier 3**: Achievement modals - Automatické spuštění po creation
- Tutorial pokračuje až po uzavření achievement modalu

## Future Enhancements

### 1. Advanced Features
- Tutorial replay možnost v settings
- Skip specific sections pro advanced uživatele
- A/B testing různých tutorial flows
- Tutorial na nové features při app updates

### 2. Personalization
- Adaptivní tutorial na základě user behavior
- Různé tutorial paths pro různé user personas
- Smart skipping opakujících se konceptů

---

*Tato dokumentace definuje kompletní onboarding tutorial systém pro SelfRise V2 aplikaci s integrací existujícího achievement systému.*