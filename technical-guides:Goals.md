# SelfRise V2 Goals System - Complete Technical Guide

*Comprehensive reference for all Goals system mechanics, UI components, validation rules, and user interactions*

## Table of Contents

1. [Goals Architecture](#goals-architecture)
2. [Goal Creation System](#goal-creation-system)
3. [Target Date Step-by-Step Selection Modal](#target-date-step-by-step-selection-modal)
4. [Goal Progress Tracking](#goal-progress-tracking)
5. [Goal Templates System](#goal-templates-system)
6. [Goal Analytics & Statistics](#goal-analytics--statistics)
7. [XP Integration](#xp-integration)
8. [Data Storage & Validation](#data-storage--validation)
9. [UI/UX Standards](#uiux-standards)

---

## Goals Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Goals represent specific, measurable, time-bound objectives that users want to achieve. Unlike habits (daily recurring actions), goals have defined end points and completion criteria.**

### Core Concepts
- **Goal**: A specific target with measurable progress (e.g., "Lose 10 kg", "Save $5,000")
- **Progress**: Incremental steps toward goal completion
- **Target Date**: Optional deadline for goal completion
- **Target Value**: Numerical goal (e.g., weight loss amount, savings amount)
- **Current Value**: Current progress toward target

### Goal Categories
```typescript
enum GoalCategory {
  HEALTH = 'health',           // Weight loss, fitness targets
  FINANCIAL = 'financial',     // Savings, debt payoff
  LEARNING = 'learning',       // Skills, courses, books
  CAREER = 'career',          // Job applications, networking
  PERSONAL = 'personal',       // Personal development
  OTHER = 'other'             // Custom categories
}
```

### Goal Status Types
```typescript
enum GoalStatus {
  ACTIVE = 'active',          // Currently working toward goal
  COMPLETED = 'completed',    // Target achieved
  PAUSED = 'paused',         // Temporarily suspended
  ARCHIVED = 'archived'       // No longer relevant
}
```

---

## Goal Creation System

### Goal Creation Flow
1. **Template Selection** (Optional) - Choose from pre-defined templates
2. **Basic Information** - Title, description, category
3. **Target Configuration** - Target value, units, current value
4. **Target Date Selection** - Use Step-by-Step Selection Modal (detailed below)
5. **Validation & Save** - Ensure all required fields are valid

### Required Fields
```typescript
interface CreateGoalInput {
  title: string;              // Goal title (max 100 characters)
  description?: string;       // Optional description (max 500 characters)
  category: GoalCategory;     // Goal category
  targetValue: number;        // Numerical target (must be > 0)
  currentValue: number;       // Starting value (default: 0)
  unit: string;              // Unit of measurement (e.g., 'kg', '$', 'books')
  targetDate?: Date;         // Optional deadline
  tags: string[];            // Optional tags for organization
}
```

### Validation Rules
```typescript
// MANDATORY VALIDATION RULES:
1. Title: 1-100 characters, non-empty after trim
2. Target Value: Must be > 0, must be number
3. Current Value: Must be >= 0, must be <= target value
4. Target Date: Must be today or future date (no historical goals)
5. Unit: 1-20 characters, non-empty after trim
6. Category: Must be valid GoalCategory enum value
```

---

## Target Date Step-by-Step Selection Modal

### 🎯 FUNDAMENTAL UX PRINCIPLE
**The Target Date Modal provides a progressive, step-by-step date selection experience that adapts its size to content and guides users through Year → Month → Day selection without input errors.**

### Modal Architecture

#### Modal Trigger & Integration
```typescript
// CRITICAL: Modal opens when user taps Target Date text field in Add Goal screen
// The text field itself remains unchanged visually - same appearance as current
// When user taps the field, instead of keyboard, the Step-by-Step Selection Modal opens

<TouchableOpacity onPress={() => setShowDateModal(true)}>
  <Text style={styles.targetDateField}>
    {targetDate ? formatDate(targetDate) : "Select Target Date (Optional)"}
  </Text>
</TouchableOpacity>

// After user completes all 3 steps (Year → Month → Day), modal auto-closes
// The formatted date appears in the text field automatically
// User sees the completed goal creation form with selected date displayed
```

#### Modal Structure
```typescript
interface StepSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;        // Default: First day of month +2 from current
}

// Three-step flow states
enum SelectionStep {
  YEAR = 'year',           // First step: Select year
  MONTH = 'month',         // Second step: Select month
  DAY = 'day'             // Third step: Select day
}
```

### Progressive Selection Flow

#### Step-by-Step User Experience
```typescript
// COMPLETE USER JOURNEY:
// 1. User taps Target Date field
// 2. Modal opens showing YEAR selection (small modal size)
// 3. User selects year → Years disappear, MONTHS appear (modal enlarges)
// 4. User selects month → Months disappear, DAYS appear (modal enlarges again)  
// 5. User selects day → Modal auto-closes, date appears in text field

// NAVIGATION CONTROLS:
// - Back Arrow (left center): Appears after year selection, allows going back to previous step
// - Close X (top right corner): Always visible, cancels entire flow without changes
// - Tap outside modal: Also cancels entire flow

// AUTOMATIC PROGRESSION:
// Each selection immediately advances to next step
// If invalid date selected → Error shown immediately (no waiting for completion)
// Final day selection completes entire flow instantly
```

#### Dynamic Modal Sizing & Navigation
```typescript
// Modal automatically resizes based on current step content
MODAL_SIZING: {
  // Step 1: Year Selection (largest - expanded range)
  yearStep: {
    width: '95%',        // Large width for 3×7 year grid (21 years: 2025-2045)
    height: 'auto',      // Height fits content exactly
    minHeight: 310,      // Minimum modal height for larger grid
    controls: ['closeX'] // Only close X visible
  },
  
  // Step 2: Month Selection (medium)  
  monthStep: {
    width: '75%',        // Optimal for 3×4 month grid
    height: 'auto',      // Height fits content exactly
    minHeight: 310,      // Accommodate 3 rows of months
    controls: ['closeX', 'backArrow']  // Close X + Back arrow
  },
  
  // Step 3: Day Selection (large)
  dayStep: {
    width: '95%',        // Large width for 7×variable day grid
    height: 'auto',      // Height fits content exactly
    minHeight: 400,      // Accommodate full month calendar (up to 5 rows)
    controls: ['closeX', 'backArrow']  // Close X + Back arrow
  }
}

// POSITIONING & SIZING RULES:
// - Always centered horizontally and vertically on screen
// - Auto-size to content with padding, no fixed dimensions
// - Must prevent content overlap at all screen sizes
// - Smooth 300ms resize transitions between steps

// NAVIGATION CONTROL POSITIONING:
NAVIGATION_CONTROLS: {
  closeX: {
    position: 'top-right corner',
    size: '24x24px',
    color: '#666666',
    touchTarget: '44x44px'    // Larger invisible touch area
  },
  
  backArrow: {
    position: 'left center of modal header',
    size: '24x24px', 
    color: '#2196F3',         // Theme blue
    touchTarget: '44x44px',   // Larger invisible touch area
    visibility: 'step 2+ only'  // Not shown in year selection
  }
}
```

### Visual Design Specifications

#### Square Grid Layout
```typescript
// FUNDAMENTAL DESIGN: Blue squares in grids, green when selected
// NO circles, NO wheels - simple square grid arrangement

SQUARE_SPECIFICATIONS: {
  // Individual square design
  width: 40,               // Touch-friendly size (optimized for fit)
  height: 40,              // Square aspect ratio
  borderRadius: 8,         // Slightly rounded corners
  marginHorizontal: 3,     // White space between squares (optimized)
  marginVertical: 3,       // White space between rows (optimized)
  
  // Colors
  backgroundColor: '#2196F3',    // Blue background (unselected)
  selectedColor: '#4CAF50',      // Green background (selected)
  textColor: '#FFFFFF',          // White text on blue/green
  fontSize: 16,                  // Clear readable text
  fontWeight: 'medium'           // Medium font weight
}

// Grid arrangements for each step
GRID_ARRANGEMENTS: {
  // Year grid: 3 rows × 7 columns (21 years: current + 20 future)
  years: {
    columns: 7,
    rows: 3,
    totalItems: 21        // Current year + 20 future years (expanded range)
  },
  
  // Month grid: 3 rows × 4 columns (12 months)
  months: {
    columns: 4,
    rows: 3,
    totalItems: 12        // Jan, Feb, ..., Dec
  },
  
  // Day grid: Variable rows × 7 columns (calendar layout)
  days: {
    columns: 7,           // Standard week layout
    rows: 'variable',     // 4-6 rows depending on month
    totalItems: '28-31'   // Dynamic based on selected month/year
  }
}
```

#### Grid Visual Examples
```typescript
// Step 1: Year Selection (3×7 grid)
// ┌─────────────────────────────────────┐
// │ 2025 2026 2027 2028 2029 2030 2031 │
// │ 2032 2033 2034 2035 2036 2037 2038 │
// │ 2039 2040 2041 2042 2043 2044 2045 │
// └─────────────────────────────────────┘

// Step 2: Month Selection (3×4 grid)
// ┌─────────────────────────────────┐
// │   1     2     3     4          │
// │   5     6     7     8          │
// │   9    10    11    12          │
// └─────────────────────────────────┘

// Step 3: Day Selection (Variable×7 grid)
// ┌─────────────────────────────────┐
// │  1   2   3   4   5   6   7     │
// │  8   9  10  11  12  13  14     │
// │ 15  16  17  18  19  20  21     │
// │ 22  23  24  25  26  27  28     │
// │ 29  30  31                     │
// └─────────────────────────────────┘
```

### Step-Specific Logic

#### Step 1: Year Selection
```typescript
// Year range: Current year to +20 years (expanded long-term goals)
const generateYearOptions = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = 0; i <= 20; i++) {
    years.push(currentYear + i);
  }
  
  return years; // [2025, 2026, 2027, ..., 2045]
};

// Year selection behavior
const onYearSelect = (selectedYear: number) => {
  setYear(selectedYear);
  setCurrentStep(SelectionStep.MONTH);  // Advance to month selection
  
  // Modal automatically resizes for month grid
  animateModalResize('monthStep');
};

// VISUAL: 2×6 grid of blue squares, selected year turns green
```

#### Step 2: Month Selection  
```typescript
// Month options: Numbers 1-12 (not names)
const generateMonthOptions = (): number[] => {
  return Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, 3, ..., 12]
};

// Month selection behavior
const onMonthSelect = (selectedMonth: number) => {
  setMonth(selectedMonth);
  setCurrentStep(SelectionStep.DAY);    // Advance to day selection
  
  // Generate day options based on selected year/month
  const daysInMonth = getDaysInMonth(selectedMonth, year);
  setDayOptions(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  
  // Modal automatically resizes for day grid
  animateModalResize('dayStep');
};

// VISUAL: 3×4 grid of blue squares, selected month turns green
```

#### Step 3: Day Selection
```typescript
// Day options: 1 to 28/29/30/31 (based on selected month/year)
const generateDayOptions = (month: number, year: number): number[] => {
  const daysInMonth = getDaysInMonth(month, year);
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

// Day selection behavior (FINAL STEP)
const onDaySelect = (selectedDay: number) => {
  setDay(selectedDay);
  
  // Create final date object
  const selectedDate = new Date(year, month - 1, selectedDay);
  
  // Validate date is not in past
  if (isValidFutureDate(selectedDate)) {
    onSelectDate(selectedDate);  // Return selected date
    setShowDateModal(false);     // Auto-close modal
  } else {
    showError("Selected date cannot be in the past");
  }
};

// VISUAL: Variable×7 grid (calendar layout), selected day turns green
```

### Default Date Logic & Visual States

#### Initial Date Calculation
```typescript
const getDefaultDate = (): Date => {
  const today = new Date();
  const defaultDate = new Date(today);
  
  // Set to first day of month +2 months from current
  defaultDate.setMonth(today.getMonth() + 2);
  defaultDate.setDate(1);
  
  return defaultDate;
};

// STEP INITIALIZATION:
// Modal starts with Year step showing current year + 10 options (2025-2035)
// Default selection: Year from defaultDate is pre-selected (GREEN)
// All other years remain blue until user selects them
// User can override by selecting different year
```

#### Color State System
```typescript
// VISUAL STATE MANAGEMENT:
SQUARE_STATES: {
  unselected: {
    backgroundColor: '#2196F3',    // Blue (app theme color)
    textColor: '#FFFFFF'           // White text
  },
  
  selected: {
    backgroundColor: '#4CAF50',    // Green (confirmation color)  
    textColor: '#FFFFFF'           // White text
  },
  
  // Default pre-selected item starts as GREEN
  // User can change selection → old GREEN becomes BLUE, new selection becomes GREEN
}
```

### Leap Year Handling

#### Dynamic Day Options & Validation
```typescript
// Leap year detection (same as before)
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// February day calculation
const getDaysInMonth = (month: number, year: number): number => {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;  // Automatic leap year handling
  }
  return new Date(year, month, 0).getDate();
};

// AUTOMATIC LEAP YEAR INDICATION:
// User naturally sees 29 days for February in leap years vs 28 in regular years
// No special labeling needed - the available day options communicate leap year status
// Example: User selects 2024 (leap) → February → sees days 1-29 available
//          User selects 2025 (regular) → February → sees days 1-28 available

// IMMEDIATE DATE VALIDATION:
const validateDateSelection = (year: number, month: number, day: number): ValidationResult => {
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return {
      valid: false,
      error: "Selected date cannot be in the past",
      showImmediately: true  // Error shown immediately, not at end of flow
    };
  }
  
  return { valid: true };
};

// CRITICAL: Day options are calculated when user reaches Step 3
// User has already selected Year and Month, so day calculation is accurate
// All displayed days are valid for the selected month/year combination
// Past date validation occurs immediately upon day selection
```

### Back Navigation & Flow Control

#### Navigation Flow Logic
```typescript
// COMPREHENSIVE NAVIGATION SYSTEM:
// Forward: Year → Month → Day → Auto-close
// Backward: Any step can go back to previous step
// Cancel: Close X or tap outside = cancel entire flow

NAVIGATION_FLOW: {
  // Step 1: Year Selection
  yearStep: {
    forward: 'Select year → advance to Month step',
    backward: 'None (first step)',
    cancel: 'Close X or tap outside → close modal'
  },
  
  // Step 2: Month Selection  
  monthStep: {
    forward: 'Select month → advance to Day step',
    backward: 'Back arrow → return to Year step (keep year selection)',
    cancel: 'Close X or tap outside → close modal'
  },
  
  // Step 3: Day Selection
  dayStep: {
    forward: 'Select day → auto-close modal + return date',
    backward: 'Back arrow → return to Month step (keep year+month selection)',
    cancel: 'Close X or tap outside → close modal'
  }
}

// BACK NAVIGATION EXAMPLES:
// Example A: User flow with back navigation
// 1. Select year 2025 → Month step appears
// 2. Select month 3 → Day step appears  
// 3. User clicks back arrow → Month step (year 2025 still selected)
// 4. Select month 2 → Day step appears (shows 28 days for February)
// 5. Select day 15 → Modal closes, returns "15.02.2025"

// Example B: Multi-level back navigation
// 1. Select year 2024 → Month step
// 2. Select month 2 → Day step (shows 29 days - leap year)
// 3. Click back arrow → Month step (year 2024 still selected) 
// 4. Click back arrow → Year step (can change year)
// 5. Select year 2025 → Month step
// 6. Select month 2 → Day step (shows 28 days - regular year)
```

### Animation & Transitions

#### Anti-Blink Step Transition System
```typescript
// 🚨 CRITICAL: Prevents visual "blinking" during step transitions
// PROBLEM: If setCurrentStep() executes before animations, user sees new content in old modal size
// SOLUTION: Step changes happen INSIDE animation callbacks, not before them

ANIMATION_SPECIFICATIONS: {
  // Modal resize animation (smooth size changes)
  modalResize: {
    duration: 300,           // 300ms resize transition
    easing: 'easeInOut',     // Smooth acceleration curve
    properties: ['width', 'height']  // Animate size changes
  },
  
  // Content fade transitions (ANTI-BLINK SYSTEM)
  contentTransition: {
    fadeOut: 150,            // Current content fades out FIRST
    stepChange: 0,           // setCurrentStep() called DURING fade-out callback
    fadeIn: 150,             // New content fades in AFTER modal resize
    totalDuration: 600,      // 150ms + 300ms + 150ms = smooth transition
    overlap: false           // ZERO content overlap - eliminates blink
  },
  
  // Selection feedback
  selectionFeedback: {
    duration: 150,           // Quick color change animation
    scaleEffect: 1.05,       // Slight scale up on tap
    colorTransition: true    // Animate blue→green color change
  }
}

// ANTI-BLINK SEQUENCE (Year → Month example):
// 1. User taps year → Immediate visual feedback (green selection)
// 2. → Fade out year grid (150ms) 
// 3. → setCurrentStep(MONTH) called in fade-out callback (0ms - no blink!)
// 4. → Modal resizes to month dimensions (300ms)
// 5. → Fade in month grid (150ms)
// 6. → User sees seamless transition without visual glitches

// IMPLEMENTATION PATTERN:
const handleYearSelect = (year: number) => {
  setSelectedYear(year);
  animateModalResize(SelectionStep.MONTH, () => {
    setCurrentStep(SelectionStep.MONTH); // Called AFTER fade-out, prevents blink
  });
};

// SMOOTH USER EXPERIENCE:
// ✅ No visual "blinking" or content flashing
// ✅ Smooth step progression with perfect timing
// ✅ Modal always correct size for displayed content
// ✅ Professional, polished user interface
```

### Performance & Implementation Strategy

#### Simplicity Over Optimization
```typescript
// FUNDAMENTAL PERFORMANCE APPROACH: Simple and reliable over complex optimization

PERFORMANCE_STRATEGY: {
  // getDaysInMonth() calculation
  approach: 'Calculate every time',           // No caching needed
  reasoning: 'User selects date only once',   // Rare operation
  implementation: 'Direct new Date() calls', // Standard JavaScript
  
  // Square component rendering
  approach: 'Re-render all squares',          // No memoization
  reasoning: 'Small grids, infrequent use',   // Not performance critical  
  implementation: 'Standard React components', // No React.memo() wrapper
  
  // Modal state management
  approach: 'Simple setState calls',          // No complex state optimization
  reasoning: 'Clear code over micro-optimization', // Maintainability first
  implementation: 'Direct state updates'     // Standard React patterns
}

// RATIONALE FOR SIMPLE APPROACH:
// 1. Date selection is rare user action (not performance critical)
// 2. Small data sets (12 years, 12 months, max 31 days)
// 3. Modal appears briefly then disappears  
// 4. Maintainability and bug prevention more important than micro-optimizations
// 5. Simple code = easier debugging and future modifications

// PERFORMANCE REQUIREMENTS STILL MET:
// - 300ms animations remain smooth (handled by React Native animations)
// - Instant user feedback on selections (no perceived delay)
// - Memory usage minimal (no caching overhead)
// - Code complexity low (fewer potential bugs)
```

---

## Goal Progress Tracking

### Progress Update System
```typescript
interface ProgressUpdate {
  goalId: string;
  amount: number;           // Progress amount (positive or negative)
  note?: string;           // Optional progress note
  timestamp: Date;         // When progress was recorded
}

// Daily transaction limits (XP integration)
MAX_GOAL_PROGRESS_PER_DAY = 3;  // Maximum 3 XP-earning updates per goal per day
```

### Progress Validation
```typescript
// Progress validation rules
const validateProgressUpdate = (goal: Goal, amount: number): ValidationResult => {
  // Cannot exceed target value
  if (goal.currentValue + amount > goal.targetValue) {
    return { valid: false, error: "Progress would exceed target value" };
  }
  
  // Cannot go below 0
  if (goal.currentValue + amount < 0) {
    return { valid: false, error: "Progress cannot be negative" };
  }
  
  // Check daily transaction limit for XP
  const todayTransactions = getTodayTransactionCount(goal.id);
  if (todayTransactions >= MAX_GOAL_PROGRESS_PER_DAY && amount > 0) {
    return { valid: false, error: "Daily progress limit reached (3 updates)" };
  }
  
  return { valid: true };
};
```

### Goal Completion Detection
```typescript
const checkGoalCompletion = (goal: Goal): boolean => {
  return goal.currentValue >= goal.targetValue;
};

// Auto-complete goals when target reached
const onProgressUpdate = async (goal: Goal, amount: number) => {
  const updatedGoal = { ...goal, currentValue: goal.currentValue + amount };
  
  if (checkGoalCompletion(updatedGoal) && goal.status === GoalStatus.ACTIVE) {
    updatedGoal.status = GoalStatus.COMPLETED;
    updatedGoal.completedAt = new Date();
    
    // Trigger completion celebration
    showGoalCompletionCelebration(updatedGoal);
  }
  
  await goalStorage.update(updatedGoal);
};
```

---

## Goal Templates System

### Template Categories

#### Health Templates
```typescript
const HEALTH_TEMPLATES = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Set a target weight loss goal with healthy progress tracking.',
    category: GoalCategory.HEALTH,
    unit: 'kg',
    suggestedTargetValue: 10,
    tags: ['weight', 'health', 'fitness'],
    icon: 'fitness',
    color: '#FF6B6B',
  }
  // Note: Daily Steps and Water Intake removed (belong in Habits)
];
```

#### Financial Templates
```typescript
const FINANCIAL_TEMPLATES = [
  {
    id: 'save_money',
    title: 'Save Money',
    description: 'Build your savings with a specific target amount.',
    category: GoalCategory.FINANCIAL,
    unit: '$',
    suggestedTargetValue: 5000,
    tags: ['savings', 'money', 'financial'],
    icon: 'piggy-bank',
    color: '#4ECDC4',
  },
  {
    id: 'pay_debt',
    title: 'Pay Off Debt',
    description: 'Track progress toward eliminating debt completely.',
    category: GoalCategory.FINANCIAL,
    unit: '$',
    suggestedTargetValue: 10000,
    tags: ['debt', 'money', 'financial'],
    icon: 'credit-card',
    color: '#4ECDC4',
  }
];
```

#### Learning Templates
```typescript
const LEARNING_TEMPLATES = [
  {
    id: 'read_books',
    title: 'Read Books',
    description: 'Set an annual or monthly reading goal.',
    category: GoalCategory.LEARNING,
    unit: 'books',
    suggestedTargetValue: 12,
    tags: ['reading', 'books', 'learning'],
    icon: 'book',
    color: '#45B7D1',
  },
  {
    id: 'learn_language',
    title: 'Learn New Language',
    description: 'Track progress in language learning milestones.',
    category: GoalCategory.LEARNING,
    unit: 'levels',
    suggestedTargetValue: 5,
    tags: ['language', 'learning', 'skills'],
    icon: 'globe',
    color: '#45B7D1',
  }
];
```

### Template Selection Rules
```typescript
// Templates must represent concrete, measurable goals
// NOT daily activities (those belong in Habits)

// ✅ GOOD TEMPLATES:
// - Lose 10 kg (specific target, completion point)
// - Save $5000 (specific amount, measurable)
// - Read 24 books (countable target)
// - Learn Spanish Level B2 (specific milestone)

// ❌ BAD TEMPLATES (belong in Habits):
// - Daily Steps (daily recurring activity)
// - Water Intake (daily recurring activity)
// - Journal Entries (daily recurring activity)
```

---

## Goal Analytics & Statistics

### Goal Completion Rates
```typescript
interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  completionRate: number;        // Percentage of completed goals
  averageTimeToComplete: number; // Days from creation to completion
  categoryBreakdown: {
    [key in GoalCategory]: {
      total: number;
      completed: number;
      rate: number;
    };
  };
}
```

### Progress Prediction
```typescript
// Estimate completion date based on current progress rate
const estimateCompletion = (goal: Goal): Date | null => {
  if (!goal.targetDate || goal.currentValue >= goal.targetValue) {
    return null;
  }
  
  const progressHistory = getProgressHistory(goal.id, 30); // Last 30 days
  if (progressHistory.length < 2) return null;
  
  const dailyRate = calculateDailyProgressRate(progressHistory);
  const remainingProgress = goal.targetValue - goal.currentValue;
  const estimatedDays = Math.ceil(remainingProgress / dailyRate);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  
  return estimatedDate;
};
```

### Timeline Recommendations
```typescript
// Smart recommendations based on goal analysis
const generateTimelineRecommendations = (goal: Goal): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  
  // Check if goal is behind schedule
  if (goal.targetDate && isGoalBehindSchedule(goal)) {
    recommendations.push({
      type: 'timeline_check',
      priority: 'medium',
      title: 'Timeline Check',
      description: 'Your goal might need a timeline adjustment or increased effort.',
      actionable: true
    });
  }
  
  // Suggest breaking down large goals
  if (goal.targetValue > 100 && goal.currentValue === 0) {
    recommendations.push({
      type: 'break_down',
      priority: 'low',
      title: 'Break It Down',
      description: 'Consider setting smaller milestone targets for better motivation.',
      actionable: false
    });
  }
  
  return recommendations;
};
```

---

## XP Integration

### Goal XP Rewards
```typescript
// XP rewards for goal-related activities
XP_REWARDS = {
  GOAL_PROGRESS: 35,          // Adding progress (max 3x per goal per day)
  GOAL_MILESTONE_25: 50,      // 25% completion milestone
  GOAL_MILESTONE_50: 75,      // 50% completion milestone
  GOAL_MILESTONE_75: 100,     // 75% completion milestone
  GOAL_COMPLETION: 250,       // Goal completion (original amount restored)
  GOAL_COMPLETION_BIG: 350,   // Large goal completion (target ≥ 1000)
};
```

### 🎉 Goal Completion Celebration System

#### Completion Detection & XP Awarding
```typescript
// CRITICAL: Goal completion XP is awarded when goal reaches 100%+ for first time
const justCompleted = isCompleted && !wasCompleted; // First-time completion only

if (justCompleted) {
  await GamificationService.addXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
    source: XPSourceType.GOAL_COMPLETION,
    description: `🎉 Goal completed: ${goal.title}`,
    sourceId: goal.id
  });
  console.log(`🏆 Goal completed: ${goal.title} (+250 XP)`);
}
```

#### Reversible XP Logic
```typescript
// CRITICAL: When goal drops below 100%, completion XP is subtracted
const shouldBeActive = !isCompleted && goal.status === GoalStatus.COMPLETED;

if (shouldBeActive && wasCompleted) {
  await GamificationService.subtractXP(XP_REWARDS.GOALS.GOAL_COMPLETION, {
    source: XPSourceType.GOAL_COMPLETION,
    description: `📉 Goal dropped below completion: ${goal.title}`,
    sourceId: goal.id
  });
  console.log(`📉 Goal completion reversed: ${goal.title} (-250 XP)`);
}
```

#### Goal Completion Modal Integration
```typescript
// Goal completion is enqueued via centralized ModalQueueContext
// GoalsScreen.tsx detects completion and enqueues:
enqueueModal({
  type: 'goal_completion',
  priority: ModalPriority.GOAL_COMPLETION,  // Priority 2
  props: { goal: freshGoal },
});

// GoalCompletionModal rendered by ModalRenderer in ModalQueueContext
// No notify functions needed - queue handles priority ordering
// onClose calls closeCurrentModal() → next modal in queue shows
```

#### User Experience Flow
```typescript
// COMPLETE GOAL COMPLETION FLOW:
1. User adds progress that reaches/exceeds 100% → goalStorage.addProgress()
2. Storage detects completion → Awards +250 XP via GamificationService
3. XP popup animation appears immediately (via XpAnimationContext)
4. Goal status updates to COMPLETED → GoalsScreen detects change
5. PRIMARY goal completion modal shows with "+250 XP" display
6. User closes modal → Modal coordination releases to show any level-up modal
7. If progress later reduces below 100% → Subtracts -250 XP automatically
```

### XP Transaction Limits
```typescript
// Daily limits to prevent XP exploitation
MAX_GOAL_TRANSACTIONS_PER_DAY = 3;

// Progress XP is only awarded 3 times per goal per day
const canAwardProgressXP = async (goalId: string): Promise<boolean> => {
  const todayTransactions = await getXPTransactionCount(goalId, 'today');
  return todayTransactions < MAX_GOAL_TRANSACTIONS_PER_DAY;
};
```

### Milestone Detection
```typescript
const checkMilestones = (goal: Goal, previousValue: number) => {
  const progressPercent = (goal.currentValue / goal.targetValue) * 100;
  const previousPercent = (previousValue / goal.targetValue) * 100;
  
  // Check which milestones were crossed
  const milestones = [25, 50, 75];
  const crossedMilestones = milestones.filter(
    milestone => previousPercent < milestone && progressPercent >= milestone
  );
  
  // Award XP for each crossed milestone
  crossedMilestones.forEach(milestone => {
    const xpAmount = XP_REWARDS[`GOAL_MILESTONE_${milestone}`];
    GamificationService.addXP(xpAmount, {
      source: XPSourceType.GOAL_MILESTONE,
      sourceId: goal.id,
      description: `${milestone}% goal milestone reached`
    });
  });
};
```

---

## Data Storage & Validation

### Goal Storage Schema
```typescript
interface Goal {
  id: string;                // Unique identifier
  title: string;             // Goal title
  description?: string;      // Optional description
  category: GoalCategory;    // Goal category
  targetValue: number;       // Target amount
  currentValue: number;      // Current progress
  unit: string;             // Unit of measurement
  targetDate?: Date;        // Optional deadline
  status: GoalStatus;       // Current status
  createdAt: Date;          // Creation timestamp
  updatedAt: Date;          // Last update timestamp
  completedAt?: Date;       // Completion timestamp
  tags: string[];           // Organization tags
  color?: string;           // Custom color
  icon?: string;           // Custom icon
}
```

### Progress Entry Schema
```typescript
interface ProgressEntry {
  id: string;               // Unique identifier
  goalId: string;          // Goal reference
  amount: number;          // Progress amount
  note?: string;           // Optional note
  timestamp: Date;         // When recorded
  source: 'manual' | 'auto'; // How it was added
}
```

### Validation Services
```typescript
class GoalValidationService {
  static validateGoal(goal: Partial<Goal>): ValidationResult {
    const errors: string[] = [];
    
    // Title validation
    if (!goal.title?.trim() || goal.title.trim().length > 100) {
      errors.push("Title must be 1-100 characters");
    }
    
    // Target value validation
    if (!goal.targetValue || goal.targetValue <= 0) {
      errors.push("Target value must be greater than 0");
    }
    
    // Current value validation
    if (goal.currentValue < 0 || goal.currentValue > goal.targetValue) {
      errors.push("Current value must be between 0 and target value");
    }
    
    // Target date validation
    if (goal.targetDate && goal.targetDate < new Date()) {
      errors.push("Target date cannot be in the past");
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

---

## UI/UX Standards

### Visual Consistency
```typescript
// Goal card styling
GOAL_CARD_STYLES = {
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3
};

// Progress bar styling
PROGRESS_BAR_STYLES = {
  height: 8,
  borderRadius: 4,
  backgroundColor: '#E0E0E0',
  overflow: 'hidden'
};
```

### Color Coding
```typescript
// Goal status colors
STATUS_COLORS = {
  [GoalStatus.ACTIVE]: '#4CAF50',      // Green
  [GoalStatus.COMPLETED]: '#2196F3',    // Blue
  [GoalStatus.PAUSED]: '#FF9800',      // Orange
  [GoalStatus.ARCHIVED]: '#9E9E9E'     // Gray
};

// Category colors
CATEGORY_COLORS = {
  [GoalCategory.HEALTH]: '#FF6B6B',     // Red
  [GoalCategory.FINANCIAL]: '#4ECDC4',  // Teal
  [GoalCategory.LEARNING]: '#45B7D1',   // Blue
  [GoalCategory.CAREER]: '#96CEB4',     // Green
  [GoalCategory.PERSONAL]: '#FECA57',   // Yellow
  [GoalCategory.OTHER]: '#A8E6CF'       // Light green
};
```

### Accessibility Standards
```typescript
// Accessibility requirements
ACCESSIBILITY_STANDARDS = {
  // All interactive elements need accessibility labels
  accessibilityLabels: true,
  
  // Support for screen readers
  screenReaderSupport: true,
  
  // Minimum touch target size
  minimumTouchTarget: 44, // 44x44 points
  
  // Color contrast ratios
  minimumContrast: 4.5,   // WCAG AA standard
  
  // Keyboard navigation support
  keyboardNavigation: true
};
```

### Animation Standards
```typescript
// Standard animation durations
ANIMATION_DURATIONS = {
  fast: 150,      // Quick feedback
  normal: 300,    // Standard transitions
  slow: 500       // Complex animations
};

// Easing curves
EASING_CURVES = {
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
};
```

---

## Error Handling & Edge Cases

### Common Error Scenarios
```typescript
// Error handling patterns
const COMMON_ERRORS = {
  INVALID_DATE: 'Selected date is invalid or in the past',
  VALUE_TOO_LARGE: 'Target value exceeds maximum allowed (999,999)',
  PROGRESS_OVERFLOW: 'Progress update would exceed target value',
  DAILY_LIMIT_REACHED: 'Daily progress update limit reached (3 updates)',
  NETWORK_ERROR: 'Unable to save goal. Please check your connection.',
  VALIDATION_ERROR: 'Please check all required fields are filled correctly'
};

// Graceful error recovery
const handleGoalError = (error: Error, operation: string) => {
  console.error(`Goal operation '${operation}' failed:`, error);
  
  // Show user-friendly error message
  showErrorMessage(COMMON_ERRORS[error.type] || 'Something went wrong. Please try again.');
  
  // Log for debugging but don't crash app
  // Continue with app functionality
};
```

### Data Recovery & Migration
```typescript
// Goal data migration for app updates
const migrateGoalData = async (version: number) => {
  switch (version) {
    case 1:
      // Add new fields with default values
      // Ensure backward compatibility
      break;
    case 2:
      // Update data structures
      // Preserve user data integrity
      break;
  }
};
```

---

**GOLDEN RULE**: *"Goals are specific, measurable targets with completion points - not daily recurring activities. The Step-by-Step Selection Modal provides intuitive, progressive date selection with anti-blink animations and perfect modal sizing."*

---

*This technical guide serves as the authoritative reference for all Goals system mechanics in SelfRise V2. All development work on Goals features must strictly follow these specifications.*