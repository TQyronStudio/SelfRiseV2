# SelfRise V2 - Onboarding Tutorial System Technical Guide

## Overview

Onboarding Tutorial je interaktivní průvodce pro nové uživatele, který je provede celou aplikací při prvním spuštění. Systém používá overlay approach s tmavnutím obrazovky a spotlight efekty pro zvýraznění specifických elementů.

## Design Specifikace

### 1. Visual Design
- **Overlay**: GPU-rendered Skia `<Canvas>` s tmavým `<Rect>` (rgba(0,0,0,0.75)) přes celou obrazovku
- **Spotlight Cutout**: `<RoundedRect>` s `BlendMode.dstOut` vytvoří "díru" v overlay — GPU-accelerated, žádné CSS clip-path
- **Soft Edges**: `<BlurMask blur={8} style="normal" />` na cutout pro plynné hrany
- **Glow Ring**: Pulsující oranžový rámeček (`rgba(255, 107, 53, …)`) kolem spotlight, rámeček se škáli 1.0→1.08 a opacity 0.3→0.7
- **Inner Border**: Bílý semi-transparentní border (`rgba(255,255,255,0.4)`, strokeWidth 2) na hraně cutout
- **Corner Radius**: 14px na cutout (squircle feel), 18px na glow ring
- **Padding**: 10px kolem targetu pro "dýchání"
- **Entrance Animation**: Celý Canvas fade-in za 200ms při zobrazení
- **Skip Button**: Křížek v pravém horním rohu (slabě viditelný během celého tutoriálu)
- **Next Button**: Zobrazuje se když není vyžadována specifická akce od uživatele

### 2. Interaction Design
- **Blocking**: Uživatel může kliknout pouze na zvýrazněný element nebo skip/next tlačítka
- **Progressive Disclosure**: Formuláře se vyplňují postupně s next tlačítkem po prvním znaku
- **Haptic Feedback**: Při každém kroku tutoriálu
- **Smooth Transitions**: Plynulé přechody mezi kroky (300ms animace)

## Tutorial Flow - 25 Kroků (Complete Implementation)

**✅ AKTUALIZACE**: Současná implementace má **25 kompletních kroků** s intelligent achievement handling. Tutorial pokrývá celý onboarding flow od welcomu až po finální gratulaci.

### Klíčové vlastnosti:
- **Achievement Integration**: Conditional handling - achievement modaly potlačeny během tutorialu
- **Completion Modals**: Step 10 (habit-complete) a Step 21 (goal-complete) nahrazují achievement modaly
- **Complete Flow**: Návrat na Home, XP system intro, Trophy Room, finální completion
- **25 kroků celkem**: Plnohodnotný onboarding včetně gamifikačních prvků

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

## Tutorial Text Positioning - Intelligent Adaptive System

### CRITICAL: Intelligent Positioning to Avoid Overlaps

**Problem**: Tutorial text může překrývat zvýrazněné elementy, zejména když jsou ve spodní části obrazovky (tab bar, bottom buttons).

**Solution**: **INTELLIGENT ADAPTIVE POSITIONING** - text se automaticky umístí tak, aby nepřekrýval target element.

#### Positioning Strategy Matrix:
```typescript
// 🎯 INTELLIGENT ADAPTIVE POSITIONING STRATEGY:
// Automaticky vybírá nejlepší pozici podle typu kroku a umístění targetu

1️⃣ MODAL CREATION STEPS (habit-*, goal-*)
   Strategy: DYNAMIC BELOW FIELD
   Calculation: spotlightTarget.y + spotlightTarget.height + 16px
   Reasoning: Text přímo pod formulářovým fieldem
   Examples: habit-name, goal-title, habit-color

2️⃣ TAB NAVIGATION STEPS (navigate-journal, navigate-goals, navigate-home)
   Strategy: TOP FIXED
   Position: 70-100px from top (device-dependent)
   Reasoning: Tab bar je DOLE → text NAHOŘE aby se nepřekrýval
   Examples: navigate-journal, navigate-goals

3️⃣ QUICK ACTIONS + GOAL-DATE STEPS
   Strategy: DYNAMIC BELOW TARGET
   Calculation: spotlightTarget.y + spotlightTarget.height + 16px
   Reasoning: Quick actions sekce a goal-date picker mohou být na různých pozicích → dynamické umístění pod target vyhýbá se overlaps
   Examples: quick-actions, goal-date

4️⃣ SMART AUTO-DETECTION (any spotlight step)
   Strategy: TOP if target.y > screen.height/2, else BOTTOM
   Reasoning: Pokud je target ve spodní polovině → text NAHORU
   Examples: Automatická detekce pro budoucí kroky

5️⃣ DEFAULT (other steps)
   Strategy: BOTTOM FIXED
   Position: ~50px from bottom
   Reasoning: Target je nahoře/uprostřed → text DOLE
```

#### Affected Steps:
- **Habit Creation**: Steps 5a (habit-name), 5b-5e (color, icon, days, create)
- **Goal Creation**: Steps 11a (goal-title), 11b-11f (unit, target, date, category, create)

#### Implementation Strategy (V2 - Enhanced Android Support):
```typescript
const isModalCreationStep = (
  state.currentStepData?.id?.startsWith('habit-') ||
  state.currentStepData?.id?.startsWith('goal-')
) && state.currentStepData?.id !== 'habit-complete' && state.currentStepData?.id !== 'goal-complete';

if (isModalCreationStep && spotlightTarget) {
  // UNIFIED: Dynamické pozicování pod textovým polem pro OBA flows
  const basePosition = spotlightTarget.y + spotlightTarget.height + 16;

  // 🎯 V2 ENHANCEMENT: Dynamic card height calculation instead of fixed 250px
  const tutorialCardHeight = calculateTutorialCardHeight(); // ~170-220px based on device
  const bottomSafePadding = 20; // Extra breathing room

  // Android-specific: Extra padding for navigation bar variations
  const androidNavBarExtra = Platform.OS === 'android' ? 8 : 0;

  const maxTop = Dimensions.get('window').height - insets.bottom - tutorialCardHeight - bottomSafePadding - androidNavBarExtra;
  const finalPosition = Math.min(basePosition, maxTop);

  position = { top: finalPosition, left: margin, right: margin };
}

// Helper: Calculate tutorial card height dynamically
const calculateTutorialCardHeight = (): number => {
  const cardPadding = getCardPadding(); // 18-32px based on device
  const titleHeight = scaleFont(Fonts.sizes.xl) * 1.3;
  const titleMargin = isTablet() ? 16 : (screenSize === SMALL ? 10 : 12);
  const contentHeight = scaleFont(Fonts.sizes.md) * 1.5 * 2; // 2 lines
  const contentMargin = isTablet() ? 16 : (screenSize === SMALL ? 12 : 14);
  const progressHeight = isTablet() ? 40 : (screenSize === SMALL ? 30 : 35);
  const buttonHeight = showNext ? (isTablet() ? 36 : 32) : 0;

  const total = (cardPadding * 2) + titleHeight + titleMargin +
                contentHeight + contentMargin + progressHeight + buttonHeight;

  return Math.ceil(total + 40); // +40px safety margin
};
```

#### Benefits:
1. **Skutečně "Pod Polem"**: Text se vždy zobrazí pod textovým polem bez ohledu na zařízení
2. **Cross-Platform**: Funguje na iOS, Android, tabletech automaticky
3. **Safe Area Aware**: Respektuje safe areas různých zařízení
4. **Konzistence**: Habit a Goal flows fungují identicky
5. **Adaptive**: Přizpůsobuje se velikosti obrazovky a orientaci
6. **🆕 Android Navigation Bar Support**: Automaticky respektuje různé Android navigační módy (gesture, 3-button, 2-button)
7. **🆕 Dynamic Height Calculation**: Výška tutorial cardu se počítá dynamicky podle obsahu a zařízení

#### Migration Notes:
- **V1 (Original)**: Fixní pozice 120px = problémy na různých zařízeních
- **V1.5 (First Fix)**: Dynamické pozicování s fixní rezervou 250px = lepší, ale stále nedokonalé na Androidu
- **V2 (Android Fix)**: Dynamický výpočet výšky cardu + Android-specific padding
- **V3 (Current - Fully Responsive)**: Vše relativní k `safeHeight` (% místo px), maxHeight 40%, ScrollView na content, žádné hardcoded pixely
- **Impact**:
  - iOS (všechny velikosti): Funguje perfektně ✅
  - Android (gesture nav): Funguje perfektně ✅
  - Android (3-button nav): Funguje perfektně ✅
  - Tablets: Funguje perfektně ✅

#### Android-Specific Enhancements:
```typescript
// Android navigation bar heights (for reference):
// - Gesture navigation: ~20px
// - 3-button navigation: ~48px
// - 2-button navigation: ~40px

// Safe area automatically detected via useSafeAreaInsets()
const insets = useSafeAreaInsets();
// insets.bottom will be: 20-48px on Android (depends on nav mode)
//                        34px on iOS (home bar)

// Extra Android padding ensures comfortable spacing regardless of nav mode
const androidNavBarExtra = Platform.OS === 'android' ? 8 : 0;
```

---

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
    {/* SpotlightEffect — Skia Canvas-based, GPU-rendered */}
    <SpotlightEffect target={spotlightTarget} action={...} targetId={...} onTargetPress={...}>
      {/* Internally renders: */}
      <Canvas style={absoluteFill}>
        <Rect … />                          {/* Dark overlay (0.75 opacity) */}
        <Group blendMode="dstOut">
          <RoundedRect … >                  {/* Spotlight cutout */}
            <BlurMask blur={8} />           {/* Soft edges */}
          </RoundedRect>
        </Group>
        <RoundedRect … style="stroke" />    {/* Pulsing glow ring (orange) */}
        <RoundedRect … style="stroke" />    {/* Inner white border */}
      </Canvas>
      {/* Clickable overlay (Animated.View) — only when action requires tap */}
    </SpotlightEffect>

    <TutorialContent step={currentStep} />  {/* Tutorial card with title/content/buttons */}
    <SkipButton onSkip={handleSkip} />
    <NextButton visible={showNext} onNext={handleNext} />
  </TutorialOverlay>
  <App />
</TutorialProvider>
```

**Klíčové aspekty architektury:**
- `SpotlightEffect` je **jeden komponent** — Canvas + clickable overlay vše v jednom
- Pozice spotlight se přenáša přes `target` prop (`{ x, y, width, height }`) z `TutorialTargetHelper`
- Přechody mezi kroky jsou GPU-accelerated přes Reanimated `withSpring` SharedValues
- `pointerEvents="none"` na Canvas umožňuje prosvítnout tappy na elementy pod ním (form fields, pickers)

### 3. Animation Specifications (Reanimated v3 + Skia)

Všechny animace běží na **UI thread** přes react-native-reanimated SharedValues — žádný JS-thread overhead.

```typescript
// --- Entrance fade-in ---
// Celý Canvas se zobrazuje za 200ms při prvním renderu
entranceOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });

// --- Spotlight position/size transitions (glide effect mezi kroky) ---
// withSpring pro přirozený přechod na nový target
const SPRING_CONFIG = { damping: 20, stiffness: 150, mass: 0.8 };
animatedX.value     = withSpring(target.x - PADDING, SPRING_CONFIG);
animatedY.value     = withSpring(target.y - PADDING, SPRING_CONFIG);
animatedWidth.value = withSpring(target.width  + PADDING * 2, SPRING_CONFIG);
animatedHeight.value= withSpring(target.height + PADDING * 2, SPRING_CONFIG);

// --- Pulse animation (glow ring) ---
// Infinite loop: 0→1 za 1200ms, pak 1→0 za 1200ms, opakování
pulseProgress.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
    withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
  ),
  -1  // infinite
);

// Derived values z pulseProgress:
//   glowOpacity: interpolate [0, 0.5, 1] → [0.3, 0.7, 0.3]  (fade in/out)
//   glowScale:   interpolate [0, 0.5, 1] → [1.0, 1.08, 1.0]  (subtle scale)
```

**Cleanup:** `cancelAnimation(pulseProgress)` se zavolá při unmount komponenty.

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
- **@shopify/react-native-skia** — GPU-accelerated Canvas rendering pro spotlight overlay (dark overlay + cutout via `BlendMode.dstOut` + BlurMask + glow ring). Vyžaduje native module → nelze testovat v Expo Go, nutný EAS development build.
- **react-native-reanimated v3** — Všechny animace (position transitions, pulse, entrance fade) běží na UI thread přes SharedValues + `useDerivedValue`. Žádný JS-thread overhead.
- **TutorialTargetHelper** — Utility pro měření pozice target elementů na screen (`onLayout` → `{ x, y, width, height }`), přenáša do `SpotlightEffect` přes props.

### 2. Form Validation Requirements
**První znak trigger** - Pro všechny text input fieldy (habit název, goal název, unit) stačí napsat první znak pro aktivaci Next tlačítka.

### 3. Responsive Design (V3 - Relative Positioning)

**AKTUALIZACE 2026-03-15**: Kompletní přechod z hardcoded pixelů na relativní hodnoty.

#### Princip: Vše relativní k `safeHeight`
```typescript
const screenHeight = Dimensions.get('window').height;
const safeHeight = screenHeight - insets.top - insets.bottom; // použitelná výška
```

#### Pozicování tutorial karty:
| Pozice | Vzorec | Účel |
|--------|--------|------|
| **TOP** | `insets.top + safeHeight * 0.06` | Karta nahoře (pod status barem) |
| **BOTTOM** | `insets.bottom + safeHeight * 0.05` | Karta dole (nad navigační lištou) |
| **DYNAMIC** | `spotlight.y + spotlight.height + safeHeight * 0.02` | Pod spotlight targetem |
| **Skip button** | `insets.top + 8` | Vždy pod status barem |

#### Omezení velikosti karty:
```typescript
contentCard: {
  maxHeight: safeHeight * 0.4,  // max 40% použitelné výšky
}
```
- **Title, progress bar, button** = fixní (vždy viditelné)
- **Content text** = ve ScrollView (scrolluje se pokud je text delší)
- Spotlight má vždy min. 60% obrazovky

#### Auto-scroll reserves (% z výšky obrazovky):
```typescript
topReserve = isQuickActions ? height * 0.25 : (isTypeInput ? height * 0.18 : height * 0.12);
bottomReserve = isTypeInput ? height * 0.42 : height * 0.25;
```

#### Příklady výpočtů na různých zařízeních:
| Zařízení | safeHeight | Card maxH | Top pos | Bottom pos |
|----------|-----------|-----------|---------|------------|
| iPhone SE | 647px | 259px | 59px | 52px |
| iPhone 15 Pro | 759px | 304px | 105px | 72px |
| Pixel 7 | 794px | 318px | 98px | 88px |
| iPad | 1036px | 414px | 86px | 72px |

#### Android Edge-to-Edge:
- Všechny modály mají `statusBarTranslucent={true}`
- `insets.bottom` automaticky respektuje gesture nav (20px) i 3-button nav (48px)
- Žádné `Platform.OS` podmínky - vše přes `useSafeAreaInsets()`

### 4. Recovery & Resume Logic
**Crash recovery** - Pokud se aplikace crashne během tutoriálu, při restartu se nabídne pokračování od posledního uloženého kroku nebo restart celého tutoriálu.

### 5. Achievement Integration
**✅ NOVÝ SYSTÉM: Conditional Achievement Handling (25 kroků)**
Současná implementace používá **inteligentní podmíněnou logiku** pro achievementy během tutorialu.

#### Jak to funguje:

**Během tutorialu (První spuštění):**
- Step 9: Create Habit → Habit se vytvoří, achievement `first-habit` se odemkne
- Achievement modal je **POTLAČEN** (achievement se přidělí, ale modal se nezobrazí)
- Step 10: **habit-complete** modal se zobrazí místo achievement modalu
- Stejně pro Step 20 (Create Goal) → Step 21 (goal-complete modal)

**Během tutorialu (Restart):**
- Uživatel už má `first-habit` a `first-goal` achievementy
- Achievement systém automaticky přeskočí již odemčené achievementy
- Step 10 a Step 21 modaly se zobrazí normálně

**Technická implementace:**
```typescript
// AchievementContext.tsx - addToCelebrationQueue
const addToCelebrationQueue = async (achievement: Achievement, xpAwarded: number) => {
  const tutorialActive = await isTutorialActive();

  if (tutorialActive) {
    console.log(`🎓 [TUTORIAL] Skipping achievement modal - tutorial is active`);
    return; // Achievement unlocked, XP awarded, no modal
  }

  setCelebrationQueue(prev => [...prev, { achievement, xpAwarded }]);
};
```

#### Výhody tohoto přístupu:
- **Konzistentní UX**: Všichni uživatelé vidí stejné completion modaly v tutorialu
- **Žádné duplikace**: Achievement modal se nezobrazí dvakrát
- **Plná kompatibilita**: Achievement se stále odemkne a přidělí XP
- **Clean restart**: Při restartu tutorialu žádné konflikty s již odemčenými achievementy

#### Achievement modaly v tutorialu:
- ~~**`first-habit`** achievement modal~~ → nahrazeno **Step 10: habit-complete**
- ~~**`first-goal`** achievement modal~~ → nahrazeno **Step 21: goal-complete**
- Achievement modaly se zobrazují **normálně po dokončení tutorialu**

### 6. Tutorial Restart System
**Tutorial Restart** - Uživatelé mohou kdykoli restartovat tutorial z Settings obrazovky s okamžitým spuštěním.

#### Funkcionalita:
- **Settings Screen**: "Restart Tutorial" tlačítko v Tutorial sekci
- **Immediate Launch**: Okamžité spuštění tutoriálu po potvrzení
- **Auto Navigation**: Automatická navigace na Home screen před spuštěním
- **Complete Reset**: Vymaže všechna tutorial data (progress, session, crash logs)

#### User Flow:
1. Uživatel klikne "Restart Tutorial" v Settings
2. Zobrazí se ConfirmationModal s varováním
3. Po potvrzení se spustí `restartTutorial()` funkce
4. Automatická navigace na Home screen
5. Tutorial se okamžitě spustí od Step 1
6. Success modal potvrdí restart

#### Technická implementace:
```typescript
const restartTutorial = async (): Promise<void> => {
  // Reset all tutorial data
  await AsyncStorage.removeItem(TUTORIAL_STORAGE_KEY);
  await AsyncStorage.removeItem(TUTORIAL_STEP_KEY);
  await AsyncStorage.removeItem(TUTORIAL_SKIPPED_KEY);
  dispatch({ type: 'RESET_TUTORIAL' });

  // Navigate to Home screen
  router.push('/(tabs)' as any);

  // Delay for navigation completion
  await new Promise(resolve => setTimeout(resolve, 300));

  // Start tutorial immediately
  dispatch({ type: 'START_TUTORIAL', payload: { steps: TUTORIAL_STEPS } });
  await saveTutorialProgress(1);
};
```

#### Lokalizace:
- `tutorialReset: 'Restart Tutorial'` (změněno z "Reset Tutorial")
- `tutorialResetDescription: 'Restart the tutorial from the beginning'`
- `tutorialResetConfirmTitle: 'Restart Tutorial?'`
- `tutorialResetConfirmMessage: 'This will restart the tutorial from the beginning and guide you through the app again. This action cannot be undone.'`
- `tutorialResetSuccess: 'Tutorial has been restarted successfully! You are now being guided through the app.'`

#### Achievement Compatibility:
- **Repeated Runs**: Tutorial lze spustit opakovaně bez problémů s achievementy
- **No Achievement Conflicts**: Žádné achievement kroky neexistují v tutoriálu
- **Clean Restart**: Každý restart je kompletně nezávislý

## Future Enhancements

### 1. Advanced Features
- ✅ **Tutorial restart možnost v settings** (IMPLEMENTOVÁNO)
- Skip specific sections pro advanced uživatele
- A/B testing různých tutorial flows
- Tutorial na nové features při app updates
- **Achievement Integration**: Volitelné obnovení achievement modalů pro komplexnější onboarding

### 2. Personalization
- Adaptivní tutorial na základě user behavior
- Různé tutorial paths pro různé user personas
- Smart skipping opakujících se konceptů

---

*Tato dokumentace definuje kompletní onboarding tutorial systém pro SelfRise V2 aplikaci s integrací existujícího achievement systému.*