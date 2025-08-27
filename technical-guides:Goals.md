# SelfRise V2 Goals System - Complete Technical Guide

*Comprehensive reference for all Goals system mechanics, UI components, validation rules, and user interactions*

## Table of Contents

1. [Goals Architecture](#goals-architecture)
2. [Goal Creation System](#goal-creation-system)
3. [Target Date Calendar Wheel Modal](#target-date-calendar-wheel-modal)
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
4. **Target Date Selection** - Use Calendar Wheel Modal (detailed below)
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

## Target Date Calendar Wheel Modal

### 🎯 FUNDAMENTAL UX PRINCIPLE
**The Target Date Calendar Wheel Modal provides an intuitive, touch-friendly way to select dates without keyboard input issues or invalid date entries.**

### Modal Architecture

#### Modal Trigger & Integration
```typescript
// CRITICAL: Modal opens when user taps Target Date text field in Add Goal screen
// The text field itself remains unchanged visually - same appearance as current
// When user taps the field, instead of keyboard, the Calendar Wheel Modal opens

<TouchableOpacity onPress={() => setShowDateModal(true)}>
  <Text style={styles.targetDateField}>
    {targetDate ? formatDate(targetDate) : "Select Target Date (Optional)"}
  </Text>
</TouchableOpacity>

// After modal confirms date selection, the formatted date appears in the text field
// User sees the completed goal creation form with selected date displayed
```

#### Modal Structure
```typescript
interface CalendarWheelModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;        // Default: First day of month +2 from current
}
```

### Visual Design Specifications

#### Modal Layout
- **Size**: 90% of screen width, 85% of screen height, centered horizontally and vertically
- **Background**: Semi-transparent dark overlay (rgba(0,0,0,0.5))
- **Modal Content**: White background with rounded corners (16px border radius)
- **Shadow**: Elevation 10 (Android) / Shadow (iOS)
- **Wheel Sizing**: Large enough to prevent number overlap, optimized for touch interaction

#### Wheel Components Layout
```
┌─────────────────────────────────────┐
│              Modal Title            │
├─────────────────────────────────────┤
│                                     │
│     ┌─ Day Wheel (Outer Ring) ─┐    │
│     │  ┌─ Month Wheel ─┐       │    │  
│     │  │     YEAR      │       │    │
│     │  │   ← 2025 →    │       │    │
│     │  │  (scrollable) │       │    │
│     │  └───────────────┘       │    │
│     └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│    [Cancel]        [OK]             │
└─────────────────────────────────────┘
```

#### Color Specifications
```typescript
// Wheel Colors (using app theme colors)
SELECTED_COLOR: '#4CAF50'     // Green for selected day/month
UNSELECTED_COLOR: '#2196F3'   // Blue for unselected (system theme color)
TEXT_SELECTED: '#FFFFFF'      // White text on selected
TEXT_UNSELECTED: '#FFFFFF'    // White text on unselected blue background
YEAR_BACKGROUND: '#F5F5F5'    // Light background for year section
ARROW_COLOR: '#666666'        // Gray for year arrows
```

#### User Interaction Settings
```typescript
// Haptic feedback settings
VIBRATION_ENABLED: false       // Disable vibrations for wheel interactions
SELECTION_FEEDBACK: 'visual'   // Use visual feedback only (no haptic)
```

### Default Date Logic

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

// Examples:
// Today: 26.8.2025 → Default: 1.10.2025
// Today: 15.12.2025 → Default: 1.2.2026
// Today: 31.1.2025 → Default: 1.3.2025
```

### Wheel Interaction Logic

#### 🔄 CRITICAL: Selection Order Flexibility
```typescript
// FUNDAMENTAL REQUIREMENT: User can select in ANY ORDER and modal adapts
// The system MUST work regardless of selection sequence:

// Scenario A: Day First
// 1. User picks day 31 (valid)
// 2. User picks February → day AUTO-CHANGES to 28 (user sees this happen)
// 3. User picks leap year → day wheel now shows 29 as option, keeps 28 selected

// Scenario B: Month First  
// 1. User picks February → day wheel shows 1-28 options
// 2. User picks leap year → day wheel expands to show 1-29 options
// 3. User picks day 29 (now valid)

// Scenario C: Year First
// 1. User picks leap year 2024 → system ready for leap year logic
// 2. User picks February → day wheel shows 1-29 options (leap year aware)
// 3. User picks day 29 (valid for leap February)

// CRITICAL: All components update IMMEDIATELY when any selection changes
// User always sees current valid options based on their selections so far

// VISUAL FEEDBACK REQUIREMENTS:
// ✅ Day wheel must show/hide options instantly when month/year changes
// ✅ Selected day auto-adjusts with subtle animation (300ms) when invalid
// ✅ Green highlight follows user selections immediately
// ✅ Wheel rotation animations are smooth (60fps)
// ✅ No loading states - all calculations are instant
```

#### Day Wheel (Outer Ring)
```typescript
// Dynamic day calculation based on selected month/year
const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

// Day validation when month changes
const validateDayForMonth = (selectedDay: number, month: number, year: number): number => {
  const maxDays = getDaysInMonth(month, year);
  return selectedDay > maxDays ? maxDays : selectedDay;
};

// Example scenarios:
// Selected: 31 January → User picks February → Auto-adjust to 28/29
// Selected: 30 April → User picks May → Keeps 30 (valid)
// Selected: 29 February (non-leap) → User picks leap year → Shows 29
```

#### Month Wheel (Inner Ring)
```typescript
// 12 months displayed in circular arrangement
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Month selection updates available days
const onMonthSelected = (newMonth: number) => {
  setSelectedMonth(newMonth);
  
  // Auto-adjust day if invalid for new month
  const adjustedDay = validateDayForMonth(selectedDay, newMonth, selectedYear);
  if (adjustedDay !== selectedDay) {
    setSelectedDay(adjustedDay);
  }
};
```

#### Year Selection (Center)
```typescript
// Year range: Current year to +10 years (long-term goals)
const YEAR_MIN = new Date().getFullYear();
const YEAR_MAX = YEAR_MIN + 10;

// Year interaction methods:
// 1. Arrow buttons: UP arrow increases year, DOWN arrow decreases year
// 2. Scroll gesture (vertical swipe up/down) - DISABLED in simplified version  
// 3. Direct value display
// 4. Visual feedback only (no vibrations)

const onYearChange = (newYear: number) => {
  // Validate year range
  const clampedYear = Math.max(YEAR_MIN, Math.min(YEAR_MAX, newYear));
  setSelectedYear(clampedYear);
  
  // Re-validate day for leap year changes
  const adjustedDay = validateDayForMonth(selectedDay, selectedMonth, clampedYear);
  if (adjustedDay !== selectedDay) {
    setSelectedDay(adjustedDay);
  }
};
```

### Leap Year Handling

#### Leap Year Detection
```typescript
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// February day calculation
const getFebruaryDays = (year: number): number => {
  return isLeapYear(year) ? 29 : 28;
};
```

#### Dynamic Day Adjustment Examples
```typescript
// Scenario 1: Non-leap to leap year
// User selected: 28 Feb 2025 → Changes year to 2024 → Day wheel now shows 29
// User can select 29, which becomes valid

// Scenario 2: Leap to non-leap year  
// User selected: 29 Feb 2024 → Changes year to 2025 → Auto-adjust to 28 Feb 2025

// Scenario 3: Month change with day overflow
// User selected: 31 Jan 2025 → Changes to Feb → Auto-adjust to 28 Feb 2025
// User selected: 31 May 2025 → Changes to Jun → Auto-adjust to 30 Jun 2025

// COMPLETE INTERACTION SCENARIOS:
// 📅 Scenario D: Complex selection sequence
// 1. User starts with default: 1 Mar 2025
// 2. User picks day 29 → (29 Mar 2025, valid)
// 3. User picks February → Auto-adjust to 28 Feb 2025 (non-leap year)
// 4. User picks leap year 2024 → Day wheel shows 29 option, stays at 28
// 5. User can now pick 29 → Final: 29 Feb 2024

// 📅 Scenario E: Month-first selection
// 1. User picks February first → Day wheel shows 1-28 options
// 2. User picks day 15 → (15 Feb, current year)
// 3. User picks leap year → Day wheel expands to show day 29 option
// 4. User can select 29 or keep 15 → Final: 15 Feb or 29 Feb (leap year)

// 📅 Scenario F: Year boundary validation
// 1. User picks current year → All months available
// 2. User picks past month of current year → Modal shows validation error on confirm
// 3. User must pick future month or future year to proceed
```

### Wheel Gesture Handling

#### Touch Interaction Specifications
```typescript
// Day/Month wheel rotation
interface WheelGesture {
  onRotationStart: (startAngle: number) => void;
  onRotationUpdate: (currentAngle: number, deltaAngle: number) => void;
  onRotationEnd: (finalAngle: number, velocity: number) => void;
  
  // Snap to nearest valid position
  snapToPosition: (angle: number) => number;
  
  // Calculate selected value from angle
  getValueFromAngle: (angle: number) => number;
}

// Year scroll gesture (vertical)
interface YearScrollGesture {
  onScrollStart: (startY: number) => void;
  onScrollUpdate: (deltaY: number) => void;
  onScrollEnd: (velocity: number) => void;
  
  // Convert scroll distance to year change
  getYearDelta: (scrollDistance: number) => number;
}
```

#### Animation Specifications
```typescript
// Smooth wheel rotation animation
WHEEL_ANIMATION_DURATION: 300ms
WHEEL_SNAP_TENSION: 50
WHEEL_SNAP_FRICTION: 8

// Year transition animation
YEAR_CHANGE_DURATION: 200ms
YEAR_SCROLL_SENSITIVITY: 0.01    // Years per pixel scrolled

// Selection highlight animation
SELECTION_HIGHLIGHT_DURATION: 150ms
SELECTION_SCALE_FACTOR: 1.1      // Slight scale up for selected item
```

### Modal Actions

#### Button Behavior
```typescript
// Cancel Button
const onCancel = () => {
  // Restore original date if editing existing goal
  // Close modal without applying changes
  setShowDateModal(false);
};

// OK Button
const onConfirm = () => {
  // Create Date object from selected values
  const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
  
  // Validate date is not in past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    showError("Target date cannot be in the past");
    return;
  }
  
  // Apply selected date
  onSelectDate(selectedDate);
  setShowDateModal(false);
};

// INTEGRATION WITH EXISTING GOAL CREATION FLOW:
// The modal replaces the current text input field but maintains the same
// data flow and validation. The parent component receives the selected
// Date object and handles formatting for display.
```

#### Date Format Display
```typescript
// Format selected date for display in text field
const formatTargetDate = (date: Date): string => {
  // Format: "DD.MM.YYYY" (European format)
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}.${month}.${year}`;
};

// Examples:
// 1.10.2025 → "01.10.2025"
// 15.12.2025 → "15.12.2025"
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
  GOAL_COMPLETION: 200,       // Basic goal completion
  GOAL_COMPLETION_BIG: 350,   // Large goal completion (target ≥ 1000)
};
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

**GOLDEN RULE**: *"Goals are specific, measurable targets with completion points - not daily recurring activities. The Calendar Wheel Modal provides intuitive date selection without keyboard input issues."*

---

*This technical guide serves as the authoritative reference for all Goals system mechanics in SelfRise V2. All development work on Goals features must strictly follow these specifications.*