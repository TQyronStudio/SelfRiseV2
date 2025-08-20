# SelfRise V2 Gamification System - Complete Technical Guide

*Comprehensive reference for all gamification mechanics, XP systems, achievements, and user engagement features*

## Table of Contents

1. [Gamification Architecture](#gamification-architecture)
2. [XP Rewards & Sources](#xp-rewards--sources)
3. [Daily Limits & Anti-Spam](#daily-limits--anti-spam)
4. [XP Multiplier System](#xp-multiplier-system)
5. [Inactive User Re-engagement System](#inactive-user-re-engagement-system)
6. [Reversal Logic (Minus XP)](#reversal-logic-minus-xp)
7. [Journal XP Tracking](#journal-xp-tracking--anti-spam-system)
8. [Journal Bonus Milestone System](#journal-bonus-milestone-system)
9. [Frozen Streak System](#frozen-streak-system-journal-completion-protection)
10. [Architecture Enforcement](#architecture-enforcement)
11. [Event System](#event-system)
12. [Performance Requirements](#performance-requirements)
13. [Testing & Validation](#testing--validation)

---

## Gamification Architecture

### 🚨 FUNDAMENTAL PRINCIPLE
**Only GamificationService.addXP()/subtractXP() may handle XP operations. All other systems are FORBIDDEN from containing XP logic.**

### Core Services
- **GamificationService**: Central XP management and level progression
- **XPMultiplierService**: Multiplier management (Harmony Streak, Inactive User Boost, etc.)
- **AchievementService**: Achievement unlocking and XP rewards
- **UserActivityTracker**: Analytics and user behavior tracking

---

## XP Rewards & Sources

### Habit System XP
```typescript
// Scheduled vs Bonus completion
XPSourceType.HABIT_COMPLETION: 25 XP    // Scheduled day completion
XPSourceType.HABIT_BONUS: 15 XP         // Non-scheduled day completion

// Streak milestones  
XPSourceType.HABIT_STREAK_MILESTONE:
- 7 days: 75 XP
- 14 days: 100 XP  
- 30 days: 150 XP
- 50 days: 200 XP
- 100 days: 300 XP
```

### Journal System XP (Position-Based)
```typescript
// Position-based rewards with anti-spam protection
Position 1: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 2: 20 XP (XPSourceType.JOURNAL_ENTRY) 
Position 3: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 4-13: 8 XP each (XPSourceType.JOURNAL_BONUS)
Position 14+: 0 XP (ANTI-SPAM RULE)

// Bonus milestones (on top of entry XP)
Entry #4 (first bonus): +25 XP (⭐ First Bonus Milestone)
Entry #8 (fifth bonus): +50 XP (🔥 Fifth Bonus Milestone)  
Entry #13 (tenth bonus): +100 XP (👑 Tenth Bonus Milestone)

// Streak milestones
7 days: 75 XP, 21 days: 100 XP, 30 days: 150 XP, 100 days: 250 XP, 365 days: 500 XP
```

### Goal System XP  
```typescript
XPSourceType.GOAL_PROGRESS: 35 XP       // Adding progress (max 3x per goal per day)
XPSourceType.GOAL_MILESTONE:
- 25% completion: 50 XP
- 50% completion: 75 XP  
- 75% completion: 100 XP
- 100% completion: 200 XP
```

### System XP
```typescript
XPSourceType.DAILY_LAUNCH: 5 XP         // Daily app launch
XPSourceType.ACHIEVEMENT_UNLOCK: Variable // Based on rarity (50-500 XP)
```

---

## Daily Limits & Anti-Spam

### Maximum Daily Limits  
```typescript
TOTAL_DAILY_MAX: 1500 XP                // Absolute daily maximum
HABITS_MAX_DAILY: 500 XP                // From all habit activities
JOURNAL_MAX_DAILY: 415 XP               // From all journal activities  
GOALS_MAX_DAILY: 400 XP                 // From all goal activities
ENGAGEMENT_MAX_DAILY: 200 XP            // From launches, recommendations
```

### Transaction Limits
```typescript
// Goals: Maximum 3 XP transactions per goal per day
MAX_GOAL_TRANSACTIONS_PER_DAY = 3

// Journal: Entry position 14+ = 0 XP (spam prevention)
// Habits: No transaction limit (natural daily scheduling)
```

### Limit Distribution Rules
- **Minimum section allocation**: Each feature gets ≥20% of daily limit when active
- **Single source maximum**: No source can exceed 80% of total daily XP
- **Multiplier scaling**: All limits scale proportionally with active XP multipliers

---

## XP Multiplier System

### Multiplier Types & Rewards
```typescript
// Harmony Streak Multiplier (Primary System)
HARMONY_STREAK_MULTIPLIER: 2.0x XP      // Double XP for 24 hours
HARMONY_STREAK_DURATION: 24 hours        // Full day of 2x XP
HARMONY_STREAK_COOLDOWN: 168 hours       // 7 day cooldown

// Challenge Completion Multiplier  
CHALLENGE_COMPLETION_MULTIPLIER: 1.5x XP // After monthly challenge
CHALLENGE_COMPLETION_DURATION: 12 hours  // Half day of 1.5x XP
CHALLENGE_COMPLETION_COOLDOWN: 168 hours // 7 day cooldown

// Achievement Combo Multiplier (Rare)
ACHIEVEMENT_COMBO_MULTIPLIER: 2.5x XP    // 3 achievements in 24h
ACHIEVEMENT_COMBO_DURATION: 6 hours      // Short burst of 2.5x XP  
ACHIEVEMENT_COMBO_COOLDOWN: 72 hours     // 3 day cooldown

// Inactive User Return Multiplier (New System)
INACTIVE_USER_MULTIPLIER: 2.0x XP        // Double XP for comeback
INACTIVE_USER_DURATION: 48 hours         // 2 days of 2x XP
INACTIVE_USER_TRIGGER: 4+ days away      // Auto-activates on return
```

### Harmony Streak Activation Requirements
```typescript
// User must achieve ALL 3 categories daily for 7 consecutive days:
Daily Requirements for Harmony Streak:
- ✅ At least 1 habit completion (scheduled or bonus)
- ✅ At least 3 journal entries (meeting daily minimum) 
- ✅ At least 1 goal progress update

// Streak Calculation:
HARMONY_STREAK_DAYS_REQUIRED: 7          // Must maintain for 7 days
Consecutive days only - missing any requirement breaks streak

// Activation Bonus:
Multiplier activation = +240 XP          // 24h * 10 XP per hour bonus
```

### Daily Limits Scale with Multipliers
```typescript
// CRITICAL: When multiplier is active, ALL daily limits scale
Base Limits (1x):                      With 2x Multiplier:
TOTAL_DAILY_MAX: 1500 XP         →      3000 XP
HABITS_MAX_DAILY: 500 XP         →      1000 XP  
JOURNAL_MAX_DAILY: 415 XP        →      830 XP
GOALS_MAX_DAILY: 400 XP          →      800 XP
ENGAGEMENT_MAX_DAILY: 200 XP     →      400 XP

// Transaction limits DO NOT scale (fairness)
Goal transactions: Still 3 per goal per day
Journal anti-spam: Still entry 14+ = 0 XP
```

---

## Inactive User Re-engagement System

### ✅ COMPLETE IMPLEMENTATION (Sub-checkpoint 4.5.10.B)

### Core Concept
Automatically re-engage users who become inactive with 2x XP boost system that activates upon return.

### System Architecture
```typescript
// Inactive User Detection
XPMultiplierService.checkInactiveUserStatus(): {
  isInactive: boolean;           // 4+ days without app opening
  daysSinceLastActivity: number; // Exact days count
  shouldActivateBoost: boolean;  // Ready for boost activation
  lastActivityDate: string;      // Last recorded activity
}

// Auto-Activation on App Launch
AppInitializationService.initializeGamificationService() {
  const boostResult = await XPMultiplierService.checkAndActivateInactiveUserBoost();
  // Seamless activation without user interaction
}
```

### Boost Configuration
```typescript
// Inactive User Boost Settings
INACTIVE_THRESHOLD: 4 days              // Minimum inactive period
BOOST_MULTIPLIER: 2.0x XP               // Double all XP rewards
BOOST_DURATION: 48 hours                // 2 full days of boost
AUTO_ACTIVATION: true                   // Activates automatically on return
COMEBACK_BONUS: 25 XP                   // Welcome back bonus XP
```

### User Experience Flow
```typescript
// Step 1: User becomes inactive (4+ days)
lastActivity: "2024-01-01" → today: "2024-01-06" = 5 days away

// Step 2: User opens app → Auto-activation
checkInactiveUserStatus() → shouldActivateBoost: true
activateInactiveUserBoost() → success: true, multiplier: 2.0x

// Step 3: Countdown timer appears in Home header
"Welcome Back! 2x XP (47h remaining)" 

// Step 4: All XP doubled for 48 hours
Journal entry: 20 XP → 40 XP
Habit completion: 25 XP → 50 XP
Goal progress: 35 XP → 70 XP

// Step 5: Boost expires naturally
Timer reaches 0 → multiplier deactivates → back to normal XP
```

### UI Integration
```typescript
// Home Screen Header (Non-scrolling)
Position: Next to trophy icon and reorganizer
Component: MultiplierCountdownTimer
Display: "Welcome Back! 2x XP (47h remaining)"
Style: Ice blue with ⚡ boost indicator

// Countdown Timer Features
Real-time updates (every second)
Progress circle animation
Urgent pulse when <5 minutes remaining
Accessibility support
Automatic cleanup on expiration
```

### Technical Implementation
```typescript
// Files Modified/Created:
src/services/xpMultiplierService.ts      // Core boost logic
src/services/appInitializationService.ts // Auto-activation on launch
src/components/gamification/MultiplierCountdownTimer.tsx // UI timer
src/utils/inactiveUserBoostTest.ts       // Comprehensive testing

// Key Methods:
XPMultiplierService.checkInactiveUserStatus()
XPMultiplierService.activateInactiveUserBoost() 
XPMultiplierService.checkAndActivateInactiveUserBoost()
GamificationService.getAdjustedDailyLimits() // Scales limits with multiplier
```

### Daily Limit Scaling
```typescript
// Automatic limit doubling during boost period
Normal Daily Limits:    With Inactive User Boost (2x):
Total: 1500 XP       →  3000 XP
Habits: 500 XP       →  1000 XP  
Journal: 415 XP      →  830 XP
Goals: 400 XP        →  800 XP
Engagement: 200 XP   →  400 XP

// Prevents bottlenecks - users can earn full doubled amounts
```

### Testing & Validation
```typescript
// Comprehensive Test Suite (inactiveUserBoostTest.ts)
1. testInactiveUserDetection() - Verifies 4+ day detection
2. testBoostActivation() - Tests 2x multiplier activation  
3. testXPDoubling() - Confirms XP is properly doubled
4. testCountdownTimer() - Validates UI countdown display
5. testSystemReset() - Cleanup and data consistency

// Integration Testing
Auto-activation on app launch ✅
XP doubling across all sources ✅  
Daily limit scaling ✅
Countdown timer display ✅
Natural expiration ✅
```

### Production Status
**✅ 100% PRODUCTION READY**
- Complete inactive user detection (4+ days tracking)
- Automatic 2x XP boost activation (48h duration) 
- Doubled daily XP limits during boost period
- Countdown timer UI in Home screen header (non-scrolling)
- Full integration with unified GamificationService
- Comprehensive testing utility and validation

---

## Reversal Logic (Minus XP)

### Core Principle
Every action must be fully reversible without exploitation opportunities.

### Reversal Patterns
```typescript
// Pattern 1: Delete 'add' operation → Subtract XP
User adds goal progress +5 → +35 XP ✅
User deletes that progress → -35 XP ✅  
Net result: 0 XP (fair)

// Pattern 2: Delete 'subtract' operation → Add XP back  
User adds goal regress -3 → -35 XP ❌ (penalized)
User deletes that regress → +35 XP ✅ (penalty reversed)
Net result: 0 XP (fair)

// Pattern 3: Transaction limit recovery
User has 3/3 goal transactions → Daily limit reached
User deletes 1 transaction → 2/3 transactions → Can add new progress
```

### Daily Limit Impact of Minus XP
```typescript
// CRITICAL: Minus XP operations affect daily limits
Example Goal Progress Flow:
1. Add progress +2 → +35 XP, transactions: 1/3 ✅
2. Add progress +3 → +35 XP, transactions: 2/3 ✅  
3. Add progress +1 → +35 XP, transactions: 3/3 ✅ (LIMIT REACHED)
4. Try add progress +2 → BLOCKED (limit reached) ❌

5. Delete progress from step 2 → -35 XP, transactions: 2/3 ✅
6. Add new progress +4 → +35 XP, transactions: 3/3 ✅ (SLOT RECOVERED)
```

---

## Journal XP Tracking & Anti-Spam System

### 🚨 FUNDAMENTAL PRINCIPLE
Journal XP calculation relies on accurate `journalEntryCount` tracking that MUST synchronize with actual entry creation/deletion operations.

### Position-Based XP Calculation Rules
```typescript
// Position-based calculation (NOT historical position)
Position 1: 20 XP  // First daily entry
Position 2: 20 XP  // Second daily entry  
Position 3: 20 XP  // Third daily entry
Position 4-13: 8 XP // Bonus entries (limited)
Position 14+: 0 XP  // ANTI-SPAM: No XP for excessive entries
```

### Daily Counter Tracking System
```typescript
// Two-Level Tracking Architecture
// Level 1: Storage Layer (gratitudeStorage.ts)  
const dayGratitudes = gratitudes.filter(g => g.date === input.date);
const totalCount = dayGratitudes.length + 1; // Real count of existing entries

// Level 2: Anti-Spam Layer (GamificationService.ts)
interface DailyXPData {
  journalEntryCount: number; // Daily counter for anti-spam protection
}
```

### Synchronization Requirements
```typescript
// ✅ CREATE Operation (gratitudeStorage.create)
1. Create entry in storage
2. Award XP via GamificationService.addXP()
3. GamificationService increments journalEntryCount

// ✅ DELETE Operation (gratitudeStorage.delete) 
1. Delete entry from storage
2. Subtract XP via GamificationService.subtractXP()
3. GamificationService decrements journalEntryCount

// 🚨 CRITICAL: Both operations MUST happen or counter desynchronization occurs
```

### Counter Update Logic in GamificationService
```typescript
private static async updateDailyXPTracking(amount: number, source: XPSourceType): Promise<void> {
  if (amount > 0) {
    // INCREASE COUNTER (for addXP operations)
    if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
      dailyData.journalEntryCount += 1;
    }
  } else if (amount < 0) {
    // DECREASE COUNTER (for subtractXP operations) 
    if (source === XPSourceType.JOURNAL_ENTRY || source === XPSourceType.JOURNAL_BONUS) {
      dailyData.journalEntryCount = Math.max(0, dailyData.journalEntryCount - 1);
    }
  }
}
```

### Common Bug Patterns & Prevention

#### ❌ Bug Pattern: Missing Counter Decrement
```typescript
// BROKEN: Subtract XP but don't update counter
await GamificationService.subtractXP(xpAmount, options); // Counter stays high
// Result: Counter shows 13 entries, but only 5 exist → new entries get 0 XP
```

#### ✅ Correct Pattern: Synchronized Operations
```typescript
// CORRECT: Both XP and counter are synchronized
const xpAmount = deletedGratitude.xpAwarded || calculateXP(position);
await GamificationService.subtractXP(xpAmount, options); // Counter decrements automatically
// Result: Counter accurate, new entries get correct XP
```

---

## Journal Bonus Milestone System

### 🚨 MISSING CRITICAL FEATURE
**STATUS**: **NOT IMPLEMENTED** - Bonus milestone rewards are defined but not awarded

### Required Bonus Milestone Implementation
```typescript
// REQUIRED: Additional XP on top of basic entry XP
Entry #4 (4th journal entry): +8 XP (basic) + 25 XP (⭐ milestone) = 33 XP total
Entry #8 (8th journal entry): +8 XP (basic) + 50 XP (🔥 milestone) = 58 XP total  
Entry #13 (13th journal entry): +8 XP (basic) + 100 XP (👑 milestone) = 108 XP total
```

### Implementation Location: `gratitudeStorage.create()`
```typescript
async create(input: CreateGratitudeInput): Promise<Gratitude> {
  // ... existing basic XP logic
  
  // ✅ REQUIRED: Add bonus milestone XP awards
  if (totalCount === 4) {
    await GamificationService.addXP(XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE, { 
      source: XPSourceType.JOURNAL_BONUS_MILESTONE,
      description: "⭐ First Bonus Milestone achieved!",
      sourceId: newGratitude.id,
      metadata: { milestoneType: 'star', position: 4 }
    });
    console.log(`⭐ Bonus milestone achieved: +${XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE} XP`);
  }
  
  if (totalCount === 8) {
    await GamificationService.addXP(XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE, { 
      source: XPSourceType.JOURNAL_BONUS_MILESTONE,
      description: "🔥 Fifth Bonus Milestone achieved!",
      sourceId: newGratitude.id,
      metadata: { milestoneType: 'flame', position: 8 }
    });
    console.log(`🔥 Bonus milestone achieved: +${XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE} XP`);
  }
  
  if (totalCount === 13) {
    await GamificationService.addXP(XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE, { 
      source: XPSourceType.JOURNAL_BONUS_MILESTONE,
      description: "👑 Tenth Bonus Milestone achieved!",
      sourceId: newGratitude.id,
      metadata: { milestoneType: 'crown', position: 13 }
    });
    console.log(`👑 Bonus milestone achieved: +${XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE} XP`);
  }
}
```

### Required Reversal Logic - CRITICAL
```typescript
// Problem: Milestone Loss on Deletion
// User Scenario:
1. Create 8 entries → Gets ⭐(25 XP) + 🔥(50 XP) = 75 bonus XP
2. Delete entry #5 → Now has 7 entries → LOSES 🔥 milestone
3. REQUIRED: Must subtract -50 XP for lost 🔥 milestone
```

### User Experience Impact
```typescript
// Current (Broken) Experience:
User creates 13 entries → Gets only 20+20+20+8+8+8+8+8+8+8 = 156 XP ❌

// Required (Correct) Experience:  
User creates 13 entries → Gets 156 XP + 25 XP (⭐) + 50 XP (🔥) + 100 XP (👑) = 331 XP ✅
Difference: 175 XP missing per day with heavy journal usage!
```

---

## Frozen Streak System (Journal Completion Protection)

### ✅ FULLY IMPLEMENTED

### System Overview
Frozen Streak protects user journal streaks from complete loss when they miss daily requirements. Instead of resetting to 0, streaks become "frozen" and can be "warmed up" through ad-watching.

### Basic Rules
```typescript
DAILY_REQUIREMENT: 3+ journal entries = complete day
INCOMPLETE_DAY: 0-2 entries = debt accumulation  
MAX_DEBT_DAYS: 3 days (auto-reset after 3+ days)
RECOVERY_METHOD: 1 ad per missed day
```

### Debt Tracking System
```typescript
interface GratitudeStreak {
  frozenDays: number;      // 0-3, accumulated missed days
  isFrozen: boolean;       // true when frozenDays > 0
  canRecoverWithAd: boolean; // true if frozenDays 1-3
  warmUpPayments: WarmUpPayment[]; // Track ad payments
  autoResetTimestamp: Date | null; // Auto-reset protection
  autoResetReason: string | null;  // Reset reason tracking
}
```

### User Interface Behavior
```typescript
// Normal State
streakNumber: "15" (standard color)
streakLabel: "days"  
status: "🔥 Streak Active"

// Frozen State  
streakNumber: "15" (ice blue color ❄️)
streakLabel: "frozen"
status: "❄️ Streak Frozen: 2 days - Tap to warm up"
warning: "❄️ Streak Frozen: 2 day(s) - Tap to warm up"
```

### Ad-Based Recovery System
```typescript
Modal: "Warm Up Your Streak"
- Shows current debt: "Frozen for X days"  
- Progress bar: ads watched vs needed
- "Watch Ad" button for each missed day
- 1 ad = 1 day debt cleared
- Success: "🎉 Streak Rescued!"
```

### Implementation Status
**✅ FULLY IMPLEMENTED** - Frozen streak system is complete and functional with:
- Debt calculation with payment tracking
- Ad-based recovery system (testing mock - needs real AdMob)
- Auto-reset protection against phantom debt
- UI indicators across Home and Journal screens
- Progressive error handling with auto-fix mechanisms

---

## Architecture Enforcement

### Single Source of Truth
```typescript
// ✅ CORRECT: Only GamificationService handles XP
await habitStorage.createCompletion(habitId, date, isBonus)
await GamificationService.addXP(25, { source: XPSourceType.HABIT_COMPLETION })

// ❌ FORBIDDEN: Storage layers with XP logic
await habitStorage.createCompletionWithXP() // NEVER DO THIS
```

### Storage Layer Rules
```typescript
// Storage layers MUST be XP-free
habitStorage.ts   // ✅ Creates completion + calls GamificationService.addXP()
gratitudeStorage.ts // ✅ Creates entry + calls GamificationService.addXP()  
goalStorage.ts    // ✅ Creates progress + calls GamificationService.addXP()

// Storage layers MUST handle deletion XP reversal
habitStorage.deleteCompletion()     // ✅ MUST call GamificationService.subtractXP()
gratitudeStorage.delete()          // ✅ MUST call GamificationService.subtractXP()
goalStorage.deleteProgress()       // ✅ MUST call GamificationService.subtractXP()
```

---

## Event System

### Standardized Events Only
```typescript
'xpGained'           // Every XP addition/subtraction
'levelUp'            // Level progression  
'xpBatchCommitted'   // Batched operations complete
'achievementUnlocked' // Achievement triggers

// ❌ FORBIDDEN: Custom XP events
'enhanced_xp_awarded' // DEPRECATED - use 'xpGained'
'custom_xp_event'     // FORBIDDEN - use standard events
```

---

## Performance Requirements

### 60fps Guarantee
```typescript
// Every XP operation must complete in <16.67ms
Operation speed: <16.67ms per XP operation
Caching: 100ms cache validity for smooth animations
Optimistic updates: Real-time UI with background sync
```

---

## Testing & Validation

### Mandatory Validation
```typescript  
// All XP operations MUST validate:
- Amount > 0 (for addXP)
- Valid XPSourceType
- Daily limits not exceeded
- Anti-spam rules respected
- Source ID provided when required

// All XP operations MUST handle errors gracefully
try {
  await GamificationService.addXP(amount, options)
} catch (error) {
  // XP failure MUST NOT break core functionality
  console.error('XP operation failed:', error)
}
```

### Code Review Checklist
- [ ] Uses only GamificationService for XP operations?
- [ ] Storage layers are XP-free?  
- [ ] Minus XP implemented for all deletions?
- [ ] Daily limits and anti-spam respected?
- [ ] Standard events used?
- [ ] Error handling prevents feature breakage?

### Testing Requirements
```typescript
// MANDATORY: Test both directions for every XP feature
describe('XP Flow Testing', () => {
  it('should add XP on action', async () => {
    await performAction()
    expect(xp).toHaveIncreased()
  })
  
  it('should subtract XP on action reversal', async () => {
    await performAction()
    await reverseAction()
    expect(xp).toEqual(originalXP) // Must return to original state
  })
})
```

---

## Integration with Achievements

### Achievement XP Rules
```typescript
// Achievements NEVER add XP directly
// They ONLY call GamificationService.addXP()

await GamificationService.addXP(xpAmount, { 
  source: XPSourceType.ACHIEVEMENT_UNLOCK,
  sourceId: achievement.id,
  description: achievement.title
})

// XP amounts by rarity:
Common: 50 XP, Rare: 100 XP, Epic: 200 XP, Legendary: 500 XP
```

---

**GOLDEN RULE**: *"One gamification system, clear rules, zero exceptions, full reversibility"*

---

*This technical guide serves as the authoritative reference for all gamification mechanics in SelfRise V2. All development work on gamification features must strictly follow these specifications.*