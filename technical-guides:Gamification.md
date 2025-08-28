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
9. [Architecture Enforcement](#architecture-enforcement)
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

## Level-up Modal System - Global Celebration Architecture

### 🎯 FUNDAMENTAL PRINCIPLE
**Modal Priority System: Primary modaly (uživatelské akce) mají OKAMŽITOU PRIORITU. Secondary modaly (systémové celebrations) ČEKAJÍ až primary skončí.**

### 🚫 ANTI-CONCURRENT MODAL RULE
**NIKDY se nezobrazují 2 modaly současně! Primary modaly blokují secondary modaly dokud neskončí.**

### Core Modal Priority Rules - 3-Tier System
```typescript
// 3-TIER MODAL PRIORITY SYSTEM - Modal Display Rules:
1. ACTIVITY MODALS (1st Priority - Immediate User Actions): OKAMŽITÁ PRIORITA
   - Journal: Daily complete, bonus milestones (⭐🔥👑), streak milestones
   - Habit: Completion celebrations, streak achievements  
   - Goal: Milestone celebrations, completion rewards
   - Progress: Direct user action results (add/delete progress, complete/uncomplete habits)

2. ACHIEVEMENT MODALS (2nd Priority - Achievement Unlocks): DRUHÁ PRIORITA
   - Achievement unlocks triggered by user activities
   - Rarity-based celebrations (Common, Rare, Epic, Legendary)
   - Achievement milestone rewards

3. LEVEL-UP MODALS (3rd Priority - System Celebrations): TŘETÍ PRIORITA
   - Level-up celebrations (XP způsobí level-up)
   - Level milestone rewards
   - XP multiplier activations 
   - Background system notifications

4. COORDINATION RULES:
   - SINGLE: Pouze 1 modal active at any time
   - QUEUING: Lower priority modals wait in queue
   - SEQUENCE: Activity → Achievement → Level-up → Next queued item
   - GLOBAL: Řízený centrálně přes XpAnimationContext with 3-tier support
   - ANTI-FREEZE: Each tier has independent error handling to prevent app freeze
```

### Screen-Specific vs Global Celebrations

#### ✅ SCREEN-SPECIFIC (Journal.tsx)
```typescript
// Journal má vlastní modaly pro Journal-specific akce:
- Daily completion (3 gratitude entries) → Journal modal
- Streak milestones (7, 14, 30 days) → Journal modal  
- Bonus milestones (⭐🔥👑 positions 4, 8, 13) → Journal modal

// Modal queue system pro Journal celebrations
const [modalQueue, setModalQueue] = useState<Array<{
  type: 'bonus_milestone';
  data: any;
}>>([]);
```

#### ✅ GLOBAL (XpAnimationContext.tsx)
```typescript
// XpAnimationContext řídí globální level-up celebrations:
- Level-up achievements → Global modal na jakémkoliv screenu
- Level milestone rewards → Global modal
- XP multiplier activations → Global modal

// Centralized level-up handling
const handleLevelUp = (eventData: any) => {
  if (eventData?.newLevel && eventData?.levelTitle) {
    showLevelUpModal(
      eventData.newLevel,
      eventData.levelTitle,
      eventData.levelDescription,
      eventData.isMilestone || false
    );
  }
}
```

### User Experience Flow Examples

#### Scenario 1: Journal Bonus Level-up (PRIORITY SYSTEM)
```typescript
// User na Journal screenu:
1. Napíše 10. bonus gratitude entry → +8 XP (basic) + 100 XP (👑 milestone)
2. Total +108 XP způsobí level-up 15 → 16

3. MODAL COORDINATION:
   a) 👑 Bonus milestone modal = PRIMARY → ZOBRAZÍ SE OKAMŽITĚ
   b) 🎉 Level-up modal = SECONDARY → JDE DO FRONTY

4. USER EXPERIENCE:
   - ⚡ IMMEDIATE: "👑 Tenth Bonus Milestone! +100 XP" (primary modal)
   - User closes bonus modal
   - ⏱️ AFTER 300ms delay: "🎉 Level 16 achieved!" (secondary modal)
   - ✅ RESULT: Perfect sequence, no concurrent modals
```

#### Scenario 2: Home Quick Action Level-up
```typescript
// User na Home screenu:
1. Splní habit via Quick Actions → +25 XP
2. 25 XP způsobí level-up 12 → 13
3. USER VIDÍ:
   a) Level-up modal: "🎉 Level 13 achieved!" (OKAMŽITĚ na Home screenu)
4. Žádné Journal-specific modaly (není to Journal akce)
```

#### Scenario 3: Habits Screen Level-up
```typescript
// User na Habits screenu:
1. Splní habit → +25 XP
2. Způsobí level-up → XpAnimationContext triggers global modal
3. USER VIDÍ:
   a) Level-up modal na Habits screenu (ne až po návratu na jiný screen)
```

### Technical Implementation Architecture

#### XpAnimationContext (Modal Coordination Center)
```typescript
// PRIORITY SYSTEM STATE
const [state, setState] = useState({
  modalCoordination: {
    isPrimaryModalActive: false,
    pendingSecondaryModals: [],
    currentPrimaryModalType: null,
  }
});

// COORDINATION FUNCTIONS
const notifyPrimaryModalStarted = (type: 'journal' | 'habit' | 'goal') => {
  setState(prev => ({
    ...prev,
    modalCoordination: {
      ...prev.modalCoordination,
      isPrimaryModalActive: true,
      currentPrimaryModalType: type,
    }
  }));
};

const notifyPrimaryModalEnded = () => {
  setState(prev => ({ ...prev, modalCoordination: { isPrimaryModalActive: false } }));
  setTimeout(() => processSecondaryModals(), 300); // Process queue after delay
};

// PRIORITY-AWARE LEVEL-UP HANDLER
const handleLevelUp = (eventData: any) => {
  if (state.modalCoordination.isPrimaryModalActive) {
    // ADD TO SECONDARY QUEUE
    setState(prev => ({
      ...prev,
      modalCoordination: {
        ...prev.modalCoordination,
        pendingSecondaryModals: [...prev.modalCoordination.pendingSecondaryModals, {
          type: 'levelUp',
          data: eventData,
          timestamp: Date.now()
        }]
      }
    }));
  } else {
    // SHOW IMMEDIATELY
    showLevelUpModal(eventData.newLevel, eventData.levelTitle, ...);
  }
};
```

#### GamificationService (Level-up Event Trigger)
```typescript
// Po každém XP přidání zkontroluje level-up
if (leveledUp) {
  // Trigger global level-up event
  DeviceEventEmitter.emit('levelUp', {
    newLevel,
    levelTitle: levelInfo.title,
    levelDescription: levelInfo.description,
    isMilestone: levelInfo.isMilestone
  });
}
```

#### Journal.tsx (Primary Modal Coordination)
```typescript
// COORDINATION INTEGRATION
const { notifyPrimaryModalStarted, notifyPrimaryModalEnded } = useXpAnimation();

// PRIMARY MODAL START - Notify coordination system
if (newCount === 3) {
  setCelebrationType('daily_complete');
  notifyPrimaryModalStarted('journal'); // ⚡ COORDINATION
  setShowCelebration(true);
}

if (bonusCount === 1 || bonusCount === 5 || bonusCount === 10) {
  setBonusMilestone(bonusCount);
  setCelebrationType('bonus_milestone');
  notifyPrimaryModalStarted('journal'); // ⚡ COORDINATION
  setShowCelebration(true);
}

// PRIMARY MODAL END - Release coordination lock
<CelebrationModal
  visible={showCelebration}
  onClose={() => {
    notifyPrimaryModalEnded(); // ⚡ COORDINATION - triggers secondary modals
    setShowCelebration(false);
    // Process next Journal modal in queue
    setTimeout(() => processModalQueue(), 500);
  }}
/>

// ❌ FORBIDDEN: Level-up detection v Journal.tsx
// Level-up je handled globálně přes XpAnimationContext coordination
```

### Anti-Pattern Prevention

#### ❌ FORBIDDEN: Duplicitní Level-up Detection
```typescript
// NIKDY nedělat v screen-specific komponentách:
if (newXP > levelThreshold) {
  showLevelUpModal(); // ❌ WRONG - causes duplicate modals
}

// Level-up detection POUZE v GamificationService!
```

#### ❌ FORBIDDEN: Screen-switching Modal Spam
```typescript
// NIKDY nedělat:
const checkUnshownLevelUps = async () => {
  // ❌ Causes modal spam on screen returns
};

// Level-up modal se zobrazí JEDNOU při level-up, ne při screen returns!
```

### Testing & Validation Scenarios

```typescript
// MANDATORY Priority System Test Cases:
1. 🏆 Journal bonus causes level-up:
   - Bonus milestone modal shows IMMEDIATELY (primary)
   - Level-up modal WAITS in queue (secondary)
   - User closes bonus modal → level-up modal shows after 300ms delay
   - RESULT: Perfect sequence, no concurrent modals ✅

2. ⚡ Home habit level-up (no competing primary):
   - Level-up modal shows IMMEDIATELY
   - No queue delay needed
   - RESULT: Instant level-up celebration ✅

3. 🔄 Screen switching during queued level-up:
   - Journal bonus modal shows → user switches screen
   - Modal closes → notifyPrimaryModalEnded() called
   - Level-up modal from queue shows on new screen
   - RESULT: Seamless cross-screen modal coordination ✅

4. 📋 Multiple rapid primary modals:
   - Daily complete + streak milestone + bonus milestone
   - Each primary modal shows in Journal queue order
   - Level-up modal waits until ALL primary modals finish
   - RESULT: Proper priority respect ✅

5. ❌ NO concurrent modals ever:
   - state.modalCoordination.isPrimaryModalActive prevents secondary
   - pendingSecondaryModals queue ensures proper sequencing
   - RESULT: Single modal guarantee ✅
```

---

## Event-Driven Architecture Principles

### 🚨 FUNDAMENTAL EVENT PRINCIPLE
**Every XP operation MUST emit standardized events. Events enable decoupled, scalable gamification architecture across all app components.**

### Standard Event Emission Patterns
```typescript
// MANDATORY EVENT SEQUENCE for all XP operations
1. Individual operations → 'xpGained' (immediate UI feedback)
2. Batched operations → 'xpBatchCommitted' (animation triggers)  
3. Level detection → 'levelUp' (modal celebrations)
4. Achievement triggers → 'achievementUnlocked' (rewards)

// CONSISTENCY RULE: All events use unified data structures
DeviceEventEmitter.emit('eventName', standardEventData)
```

### Event Emission Requirements
```typescript
// MANDATORY: GamificationService MUST emit events for:
- addXP() operations → 'xpGained' + 'xpBatchCommitted' (if batched)
- subtractXP() operations → 'xpGained' (negative amounts)
- Level progression → 'levelUp' (with complete level data)
- Achievement unlocks → 'achievementUnlocked' (with achievement data)

// EVENT DATA CONSISTENCY: Same structure across all emitters
const eventData = {
  amount: number,
  source: XPSourceType, 
  timestamp: number,
  // Additional context based on event type
}
```

### Global Event Listening Pattern
```typescript
// STANDARD LISTENER SETUP (XpAnimationContext pattern):
useEffect(() => {
  const handleXPGained = (eventData: any) => {
    // Process individual XP gain
  };
  
  const handleBatchCommitted = (eventData: any) => {
    // Process batched XP with animations
  };
  
  const handleLevelUp = (eventData: any) => {
    // Process level-up celebration
  };

  // Register listeners
  const xpGainedSub = DeviceEventEmitter.addListener('xpGained', handleXPGained);
  const batchSub = DeviceEventEmitter.addListener('xpBatchCommitted', handleBatchCommitted);
  const levelUpSub = DeviceEventEmitter.addListener('levelUp', handleLevelUp);
  
  return () => {
    // MANDATORY cleanup
    xpGainedSub?.remove();
    batchSub?.remove();
    levelUpSub?.remove();
  };
}, []);
```

---

## Animation Consistency Rules  

### 🚨 FUNDAMENTAL ANIMATION PRINCIPLE
**All XP popup animations MUST use identical timing, positioning, and behavior patterns regardless of XP source or amount (positive/negative).**

### 🎯 IMMEDIATE ANIMATION REQUIREMENT
**ALL XP popups MUST appear immediately without batching delays to ensure consistent user experience across all app sections.**

```typescript
// CRITICAL: All XP operations bypass batching for immediate feedback
HABIT_COMPLETION: 25 XP     // IMMEDIATE popup (0ms delay)
HABIT_BONUS: 15 XP          // IMMEDIATE popup (0ms delay)
JOURNAL_ENTRY: 20 XP        // IMMEDIATE popup (0ms delay)
JOURNAL_BONUS: 8 XP         // IMMEDIATE popup (0ms delay)
GOAL_PROGRESS: 35 XP        // IMMEDIATE popup (0ms delay)
ACHIEVEMENT_UNLOCK: 50+ XP  // IMMEDIATE popup (0ms delay)

// Implementation: shouldBatchXPAddition() excludes ALL user-facing sources
if (options.source === XPSourceType.ACHIEVEMENT_UNLOCK ||
    options.source === XPSourceType.HABIT_COMPLETION ||
    options.source === XPSourceType.HABIT_BONUS ||
    options.source === XPSourceType.JOURNAL_ENTRY ||
    options.source === XPSourceType.JOURNAL_BONUS ||
    options.source === XPSourceType.GOAL_PROGRESS) {
  return false; // NO BATCHING - immediate popup for ALL sources
}

// Universal User Experience Consistency:
✅ Complete habit     → IMMEDIATE +25 XP popup
✅ Uncomplete habit   → IMMEDIATE -25 XP popup
✅ Journal entry      → IMMEDIATE +20 XP popup  
✅ Delete journal     → IMMEDIATE -20 XP popup
✅ Goal progress      → IMMEDIATE +35 XP popup
✅ Delete progress    → IMMEDIATE -35 XP popup
// ALL operations have identical response time (0ms)
```

### Standard Animation Parameters
```typescript
// UNIFIED TIMING CONSTANTS (XpPopupAnimation.tsx)
BOUNCE_IN_DURATION: 300ms        // Fade + scale in
SCALE_ADJUSTMENT: 100ms          // Brief pause at full scale  
FLOAT_UP_DURATION: 800ms         // Translate + scale down
FADE_OUT_DURATION: 600ms         // Opacity to 0
FADE_OUT_DELAY: 200ms           // Delay before fade starts
CLEANUP_TIMEOUT: 1400ms          // Popup removal (200ms buffer)

// TOTAL ANIMATION TIME: 1200ms (400ms bounce + 800ms float)
```

### Standard Positioning & Coordinates
```typescript
// UNIFIED POPUP POSITIONING (all XP sources)
DEFAULT_POSITION: { x: 50, y: 130 }  // Standard screen position
Z_INDEX: 1000                         // Above all other content

// TRANSFORMATION SEQUENCE:
1. translateY: 0 → -80 (float up 80px)
2. scale: 0.5 → 1.15 → 1.0 → 0.8 (bounce effect)
3. opacity: 0 → 1 → 0 (fade in/out)
4. translateX: position.x (horizontal offset)
```

### Visual Consistency Standards
```typescript
// POPUP STYLING CONSISTENCY
background: 'rgba(255, 255, 255, 0.98)'  // Semi-transparent white
borderRadius: 24px                        // Rounded corners
shadowOffset: { width: 0, height: 4 }    // Drop shadow
shadowOpacity: 0.25                      // Shadow transparency
elevation: 8                             // Android shadow
borderWidth: 1.5                         // Subtle border
useNativeDriver: true                    // 60fps performance guarantee

// COLOR CODING BY AMOUNT (not source):
Positive amounts: Source-specific colors (habits=green, journal=blue, etc.)
Negative amounts: '#F44336' (red) regardless of source
```

### Performance Requirements
```typescript
// ANIMATION PERFORMANCE GUARANTEES
Target FPS: 60fps (16.67ms per frame)
Native Driver: MANDATORY for all animations
GPU Acceleration: REQUIRED for transform/opacity changes
Memory Cleanup: Auto-remove after 1400ms timeout

// ACCESSIBILITY INTEGRATION
Screen Reader: Announce meaningful XP changes (≥5 XP)
Haptic Feedback: Light impact for all XP gains
Reduced Motion: Respect system accessibility settings
```

---

## UI Component Communication Patterns

### 🚨 FUNDAMENTAL COMMUNICATION PRINCIPLE
**All gamification components MUST use standardized event-driven communication patterns. Direct component coupling is FORBIDDEN.**

### Standard Hook Usage Pattern
```typescript
// MANDATORY HOOK INTEGRATION for gamification components
const MyGamificationComponent = () => {
  const { showXpPopup, state } = useXpAnimation();
  const { showSmartNotification } = useXpNotification();
  const { notifyPrimaryModalStarted, notifyPrimaryModalEnded } = useXpAnimation();
  
  // REQUIRED: Event listener cleanup pattern
  useEffect(() => {
    const handleXPEvent = (eventData: any) => {
      // Process XP event
    };
    
    const subscription = DeviceEventEmitter.addListener('xpGained', handleXPEvent);
    
    return () => {
      subscription?.remove(); // MANDATORY cleanup
    };
  }, []);
};
```

### Component Lifecycle Integration Standards
```typescript
// STANDARD GAMIFICATION COMPONENT LIFECYCLE:
1. useEffect(() => {}, [])     // Subscribe to events on mount
2. Event handler functions     // Process gamification events  
3. return () => {}            // Cleanup subscriptions on unmount
4. Proper dependency arrays   // Prevent infinite re-renders

// MEMORY LEAK PREVENTION PATTERN:
useEffect(() => {
  const subscriptions = [
    DeviceEventEmitter.addListener('xpGained', handleXPGained),
    DeviceEventEmitter.addListener('levelUp', handleLevelUp),
  ];
  
  return () => {
    subscriptions.forEach(sub => sub?.remove()); // Clean ALL subscriptions
  };
}, []); // Empty dependency array for mount/unmount only
```

### Modal Coordination Communication
```typescript
// PRIMARY MODAL COMMUNICATION (Journal, Habits, Goals screens)
const ScreenSpecificComponent = () => {
  const { notifyPrimaryModalStarted, notifyPrimaryModalEnded } = useXpAnimation();
  
  const showPrimaryModal = () => {
    notifyPrimaryModalStarted('journal'); // Coordinate with global system
    setModalVisible(true);
  };
  
  const hidePrimaryModal = () => {
    notifyPrimaryModalEnded(); // Release coordination lock
    setModalVisible(false);
    // This triggers processing of queued secondary modals (level-ups)
  };
};

// GLOBAL MODAL COMMUNICATION (Level-up, Achievement modals)
// Handled automatically by XpAnimationContext - no manual intervention needed
```

### Event Handler Naming Conventions
```typescript
// STANDARD NAMING PATTERN for gamification event handlers:
handleXPGained(eventData)           // Individual XP gains
handleXPBatchCommitted(eventData)   // Batched XP operations  
handleLevelUp(eventData)           // Level progression events
handleAchievementUnlocked(eventData) // Achievement rewards
handleModalCoordination(eventData)  // Modal priority management

// EVENT HANDLER STRUCTURE:
const handleXPGained = (eventData: any) => {
  // 1. Validate event data
  if (!eventData?.amount || !eventData?.source) return;
  
  // 2. Process event
  showXpPopup(eventData.amount, eventData.source, eventData.position);
  
  // 3. Trigger feedback (haptics, sounds)
  triggerHapticFeedback('light');
};
```

---

## Real-time UI Synchronization Patterns

### 🚨 FUNDAMENTAL SYNCHRONIZATION PRINCIPLE  
**All gamification UI updates MUST be real-time, cache-aware, and performant. Level-up events MUST invalidate relevant caches before UI refresh.**

### Cache Invalidation Requirements
```typescript
// MANDATORY CACHE CLEARING for level-up events
const handleLevelUp = (eventData: any) => {
  // 1. Clear relevant caches BEFORE showing modal
  clearUserLevelCache();           // Level display caches
  clearXPProgressCache();          // Progress bar caches  
  clearAchievementCache();         // Badge/trophy caches
  
  // 2. Trigger UI refresh
  fetchUpdatedUserData();          // Re-fetch with fresh data
  
  // 3. Show celebration modal
  showLevelUpModal(eventData);     // Display level-up celebration
};

// CACHE INVALIDATION TIMING:
Event → clearCache() → fetchData() → updateUI() → showModal()
```

### Progressive UI Update Pattern
```typescript
// REAL-TIME PROGRESS BAR ANIMATION
const updateXPProgress = (newXP: number, newLevel: number) => {
  // 1. Optimistic UI update (immediate feedback)
  setDisplayXP(newXP);
  
  // 2. Animate progress bar smoothly
  Animated.timing(progressAnim, {
    toValue: newXP / levelThreshold,
    duration: 800,
    useNativeDriver: false,        // Layout animations require false
  }).start();
  
  // 3. Update level display when animation completes
  setTimeout(() => {
    setDisplayLevel(newLevel);
  }, 800);
};

// PERFORMANCE GUARANTEE: <16.67ms per update (60fps)
```

### State Synchronization Rules  
```typescript
// UNIFIED STATE MANAGEMENT for gamification
const GamificationComponent = () => {
  // 1. Local state for UI reactivity
  const [localXP, setLocalXP] = useState(0);
  const [localLevel, setLocalLevel] = useState(1);
  
  // 2. Global context for coordination
  const { state } = useXpAnimation();
  
  // 3. Sync local state with global events
  useEffect(() => {
    const handleXPChange = (eventData: any) => {
      setLocalXP(prev => prev + eventData.amount); // Immediate local update
      // Global state handled by XpAnimationContext
    };
    
    const sub = DeviceEventEmitter.addListener('xpGained', handleXPChange);
    return () => sub?.remove();
  }, []);
};
```

---

## Standard Event Data Structures

### 🚨 FUNDAMENTAL DATA PRINCIPLE
**All gamification events MUST use consistent, typed data structures. Ad-hoc event data is FORBIDDEN.**

### Core Event Data Types
```typescript
// STANDARD XP EVENT DATA STRUCTURE
interface XPEventData {
  amount: number;              // XP amount (positive or negative)
  source: XPSourceType;        // Standardized source enum
  timestamp: number;           // Event creation time
  sourceId?: string;          // Optional: Related entity ID
  description?: string;        // Optional: Human-readable description
  metadata?: Record<string, any>; // Optional: Additional context
}

// LEVEL-UP EVENT DATA STRUCTURE  
interface LevelUpEventData {
  newLevel: number;           // User's new level
  previousLevel: number;      // Previous level  
  levelTitle: string;         // Level display name
  levelDescription?: string;  // Optional level description
  isMilestone: boolean;       // Special milestone level
  timestamp: number;          // Event creation time
  totalXP: number;           // User's total XP
}

// BATCH COMMITTED EVENT DATA STRUCTURE
interface XPBatchEventData {
  totalAmount: number;        // Sum of all XP in batch
  sources: Array<{           // Breakdown by source
    source: XPSourceType;
    amount: number;
    count: number;
  }>;
  leveledUp: boolean;        // Whether batch caused level-up
  newLevel: number;          // Current level after batch
  timestamp: number;         // Batch completion time
}
```

### Event Validation Requirements
```typescript
// MANDATORY EVENT DATA VALIDATION
const validateXPEventData = (eventData: any): boolean => {
  return !!(
    eventData &&
    typeof eventData.amount === 'number' &&
    eventData.source &&
    Object.values(XPSourceType).includes(eventData.source) &&
    typeof eventData.timestamp === 'number'
  );
};

// USE VALIDATION in all event handlers:
const handleXPGained = (eventData: any) => {
  if (!validateXPEventData(eventData)) {
    console.warn('Invalid XP event data:', eventData);
    return; // FAIL GRACEFULLY
  }
  
  // Process valid event
  processXPGain(eventData);
};
```

### Event Emission Standards
```typescript
// STANDARD EVENT EMISSION PATTERN (GamificationService)
const emitXPEvent = (amount: number, source: XPSourceType, options?: any) => {
  const eventData: XPEventData = {
    amount,
    source,
    timestamp: Date.now(),
    sourceId: options?.sourceId,
    description: options?.description,
    metadata: options?.metadata || {},
  };
  
  // Emit standardized event
  DeviceEventEmitter.emit('xpGained', eventData);
  
  // Log for debugging
  console.log(`🎯 XP Event: ${amount} from ${source}`, eventData);
};

// FORBIDDEN: Custom or inconsistent event data
// DeviceEventEmitter.emit('xpGained', { xp: 25, type: 'habit' }); ❌ WRONG
```

---

## Error Recovery & Graceful Degradation

### 🚨 FUNDAMENTAL ERROR PRINCIPLE
**Gamification system failures MUST NOT break core app functionality. All XP operations MUST fail gracefully with proper error isolation.**

### Error Isolation Patterns
```typescript
// MANDATORY ERROR BOUNDARY for gamification operations
const performXPOperation = async (operation: () => Promise<void>) => {
  try {
    await operation();
  } catch (error) {
    // 1. Log error for debugging
    console.error('XP operation failed:', error);
    
    // 2. Continue app functionality (DO NOT THROW)
    // User can still use habits, journal, goals without XP
    
    // 3. Optional: Show user-friendly message
    // showErrorMessage('XP tracking temporarily unavailable');
  }
};

// ERROR-SAFE XP ADDITION EXAMPLE:
const addHabitCompletionXP = async (habitId: string) => {
  await performXPOperation(async () => {
    await GamificationService.addXP(25, {
      source: XPSourceType.HABIT_COMPLETION,
      sourceId: habitId
    });
  });
  
  // Habit completion succeeds regardless of XP success/failure
  await habitStorage.createCompletion(habitId);
};
```

### Graceful Degradation Standards
```typescript
// FALLBACK BEHAVIOR when gamification fails:
const GamificationComponent = () => {
  const [isXPSystemHealthy, setIsXPSystemHealthy] = useState(true);
  
  useEffect(() => {
    // Monitor XP system health
    const healthCheck = async () => {
      try {
        await GamificationService.getCurrentXP(); // Test operation
        setIsXPSystemHealthy(true);
      } catch (error) {
        setIsXPSystemHealthy(false);
        console.warn('XP system unhealthy, showing degraded UI');
      }
    };
    
    healthCheck();
    const interval = setInterval(healthCheck, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  // CONDITIONAL RENDERING based on system health
  return (
    <View>
      {isXPSystemHealthy ? (
        <FullGamificationUI />  // Normal XP, levels, animations
      ) : (
        <MinimalUI />           // Basic functionality without XP features
      )}
    </View>
  );
};
```

### Diagnostic Logging Standards
```typescript
// COMPREHENSIVE ERROR LOGGING for gamification issues
const logGamificationError = (error: any, context: string, data?: any) => {
  console.error(`🚨 Gamification Error - ${context}:`, {
    error: error.message || error,
    stack: error.stack,
    context,
    data: data || {},
    timestamp: new Date().toISOString(),
    userAgent: 'SelfRise Mobile App'
  });
  
  // Optional: Send to crash reporting service
  // crashlytics().recordError(error);
};

// USAGE PATTERN:
const handleXPOperation = async () => {
  try {
    await somXPOperation();
  } catch (error) {
    logGamificationError(error, 'XP Addition Failed', { 
      operation: 'addXP',
      source: 'HABIT_COMPLETION',
      amount: 25 
    });
    
    // Continue without throwing
  }
};
```

### Recovery Strategies
```typescript
// AUTOMATIC RECOVERY PATTERNS
const XPSystemRecovery = {
  // Strategy 1: Retry failed operations
  retryWithBackoff: async (operation: () => Promise<void>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          logGamificationError(error, 'Max retries exceeded');
          return; // Give up gracefully
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  },
  
  // Strategy 2: Queue failed operations for later
  queueFailedOperation: (operation: () => Promise<void>) => {
    // Implementation would store operation in AsyncStorage
    // and retry during next app launch or network recovery
  }
};
```

---

## Production Readiness - Level-up System Architecture

### 🚨 FUNDAMENTAL PRODUCTION PRINCIPLE
**Level-up system failures MUST NOT break core app functionality. The system MUST be resilient, observable, and self-healing.**

### Complete Level-up Flow Architecture
```typescript
// COMPLETE LEVEL-UP FLOW (Production-Ready)
1. XP Addition (GamificationService.addXP)
   ├── Enhanced Logging: Level-up detection with flowId tracking
   ├── Error Handling: Graceful degradation on XP operation failures
   └── Event Emission: 'levelUp' with complete metadata

2. Event Processing (XpAnimationContext.handleLevelUp)  
   ├── Enhanced Logging: Modal coordination state tracking
   ├── Error Handling: Modal failures don't break core functionality
   ├── Priority System: Primary vs Secondary modal coordination
   └── Queue Management: Pending secondary modals with timestamps

3. Modal Display (showLevelUpModal)
   ├── Enhanced Logging: Modal display lifecycle tracking  
   ├── Error Handling: Display failures don't break level progression
   ├── Haptic Feedback: Milestone vs regular level feedback
   └── Success Confirmation: Modal display completion logging

4. Memory Management (cleanupDuplicateLevelUpRecords)
   ├── Startup Cleanup: Automatic duplicate removal on app initialization
   ├── Enhanced Logging: Memory optimization results tracking
   ├── Error Handling: Cleanup failures don't affect app startup
   └── Performance: Estimated memory freed reporting
```

### Enhanced Logging Standards for Level-up Flow
```typescript
// MANDATORY LOGGING PATTERNS for production debugging:

// 1. Level-up Detection (GamificationService)
console.log(`📊 Level-up Flow Tracking:`, {
  event: 'LEVEL_UP_DETECTED',
  previousLevel,
  newLevel, 
  totalXP,
  xpGained,
  source,
  flowId: `levelup_${Date.now()}_${randomId}`
});

// 2. Event Emission (GamificationService)  
console.log(`📊 Modal Flow Tracking:`, {
  event: 'LEVEL_UP_EVENT_EMIT',
  eventData: levelUpEventData,
  timestamp: Date.now()
});

// 3. Modal Coordination (XpAnimationContext)
console.log(`📊 Modal Flow Tracking:`, {
  event: 'LEVEL_UP_EVENT_RECEIVED',
  modalState: {
    isPrimaryModalActive,
    currentPrimaryModalType,
    pendingSecondaryModals: queue.length
  },
  timestamp: Date.now()
});

// 4. Memory Cleanup (cleanupDuplicateLevelUpRecords)
console.log(`📊 Memory Cleanup Results:`, {
  event: 'DUPLICATE_CLEANUP_COMPLETE', 
  originalCount,
  finalCount,
  duplicatesRemoved,
  totalRemoved,
  memoryFreed: `~${estimatedKB}KB`
});
```

### Error Recovery & System Resilience
```typescript
// PRODUCTION ERROR HANDLING PATTERNS:

// Pattern 1: XP Operation Resilience  
try {
  await GamificationService.addXP(amount, options);
} catch (error) {
  console.error('🚨 XP operation failed, but core functionality continues:', error);
  // Habit/Journal/Goal operations continue normally
  // User data remains intact
}

// Pattern 2: Modal Display Resilience
try {
  showLevelUpModal(level, title, description, isMilestone);
} catch (error) {
  console.error('🚨 Level-up modal display failed, but XP and app functionality continues:', error);
  console.log('📱 Level progression saved correctly, only celebration visual failed');
}

// Pattern 3: Memory Cleanup Resilience
try {
  await GamificationService.cleanupDuplicateLevelUpRecords();
} catch (error) {
  console.error('🚨 Cleanup failed, but app continues normally:', error);
  // Cleanup will retry on next app launch
}
```

### Memory Optimization & Performance
```typescript
// AUTOMATIC MEMORY MANAGEMENT:
1. Startup Cleanup: cleanupDuplicateLevelUpRecords() runs on app initialization
2. Transaction Limits: Maximum 1000 transactions stored (automatic trimming)
3. Duplicate Detection: Group by date + XP range, keep most recent only
4. Performance Metrics: Memory freed estimation and logging

// MEMORY OPTIMIZATION RESULTS:
- Removes duplicate level-up records from storage
- Maintains chronological order of remaining transactions  
- Estimates memory freed (~0.5KB per removed transaction)
- Non-blocking: Failures don't affect app startup
- Self-healing: Retries on next app launch if cleanup fails
```

### System Health Monitoring
```typescript
// HEALTH CHECK INTEGRATION:
const healthCheck = async () => {
  try {
    await GamificationService.getCurrentXP();     // XP system operational
    await showLevelUpModal(1, 'Test');           // Modal system operational  
    return { healthy: true, systems: ['XP', 'Modals'] };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

// GRACEFUL DEGRADATION when systems are unhealthy:
if (!isXPSystemHealthy) {
  return <MinimalUI />; // Core functionality without XP features
}
```

---

## Level-up Architecture Diagram

### 🏗️ COMPLETE SYSTEM ARCHITECTURE
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SelfRise V2 Level-up System Architecture              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   User Actions  │    │   Storage       │    │  Core Services  │    │ UI Systems  │
│                 │    │   Systems       │    │                 │    │             │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────┤
│ • Complete Habit│    │ • AsyncStorage  │    │ Gamification    │    │ XpAnimation │
│ • Journal Entry │───▶│ • XP Transactions│───▶│ Service         │───▶│ Context     │
│ • Goal Progress │    │ • Level History │    │                 │    │             │
│ • Achievements  │    │ • Daily Tracking│    │ • addXP()       │    │ • Modal     │
└─────────────────┘    └─────────────────┘    │ • subtractXP()  │    │   Coordination│
                                              │ • Level Detection│    │ • Event     │
                                              └─────────────────┘    │   Handling  │
                                                                     └─────────────┘

                                    LEVEL-UP FLOW SEQUENCE
                                    ══════════════════════

1. XP ADDITION PHASE:
   ┌───────────────────┐  validateXP()  ┌─────────────────────────┐
   │ User Action       │───────────────▶│ GamificationService.    │
   │ (habit, journal,  │  applyLimits() │ addXP()                 │
   │  goal, etc.)      │◀───────────────│                         │
   └───────────────────┘     store       │ • Enhanced Logging ✓    │
                             result      │ • Error Handling ✓     │
                                        │ • Level Detection       │
                                        └─────────────────────────┘
                                                    │
                                                    │ if levelUp detected
                                                    ▼
2. EVENT EMISSION PHASE:                   ┌─────────────────────────┐
   ┌─────────────────┐                     │ DeviceEventEmitter      │
   │ Level Detection │                     │ .emit('levelUp', {      │
   │ • Previous: 8   │────────────────────▶│   newLevel: 9,          │
   │ • New: 9        │  emit event         │   levelTitle: 'Rising', │
   │ • Is Milestone  │                     │   timestamp: now        │
   └─────────────────┘                     │ })                      │
                                          └─────────────────────────┘
                                                    │
                                                    │ event broadcast
                                                    ▼
3. MODAL COORDINATION PHASE:              ┌─────────────────────────┐
   ┌─────────────────────────┐            │ XpAnimationContext      │
   │ Priority System Check   │◀───────────│ .handleLevelUp()        │
   │                         │            │                         │
   │ Primary Modal Active?   │            │ • Enhanced Logging ✓    │
   │ ├─ YES: Queue Modal     │            │ • Error Handling ✓     │
   │ └─ NO: Show Immediately │            │ • State Tracking       │
   └─────────────────────────┘            └─────────────────────────┘
           │                                         │
           ▼                                         ▼
   ┌─────────────────────┐              ┌─────────────────────────┐
   │ Secondary Queue     │              │ Immediate Display       │
   │                     │              │                         │
   │ • Pending Modal     │              │ showLevelUpModal()      │
   │ • Timestamp         │              │ • Enhanced Logging ✓    │
   │ • Wait for Primary  │              │ • Error Handling ✓     │
   │   to finish         │              │ • Haptic Feedback      │
   └─────────────────────┘              │ • Visual Celebration   │
           │                            └─────────────────────────┘
           │ primary modal ends                      │
           ▼                                         ▼
   ┌─────────────────────┐                ┌─────────────────────────┐
   │ Process Queue       │                │ User Sees Modal        │
   │                     │                │                         │
   │ processSecondary    │                │ 🎉 Level 9 Achieved!   │
   │ Modals()           │                │ 'Rising Star'           │
   │ • Enhanced Logging ✓│                │                         │
   │ • Error Handling ✓ │                │ [Celebration Effects]   │
   │ • Queue Management  │                │ • Haptics              │
   └─────────────────────┘                │ • Visual Animation     │
                                          │ • Success Logging      │
                                          └─────────────────────────┘

4. MEMORY OPTIMIZATION PHASE (Background):
   ┌─────────────────────────────────────────────────────────────────────────────┐
   │ App Initialization Service                                                  │
   │                                                                             │
   │ GamificationService.cleanupDuplicateLevelUpRecords()                       │
   │ ├─ Enhanced Logging ✓                                                      │
   │ ├─ Error Handling ✓ (non-critical)                                        │
   │ ├─ Duplicate Detection (by date + XP range)                               │
   │ ├─ Keep Most Recent Only                                                   │
   │ ├─ Memory Freed Estimation                                                 │
   │ └─ Auto-retry on Next Launch (if failed)                                  │
   └─────────────────────────────────────────────────────────────────────────────┘

                           ERROR HANDLING & RESILIENCE PATTERNS
                           ═══════════════════════════════════

   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │ XP Operation     │  FAIL   │ Graceful         │  FAIL   │ Core App         │
   │ Error            │────────▶│ Degradation      │────────▶│ Continues        │
   │                  │         │                  │         │                  │
   │ • Log Error ✓    │         │ • XP System OFF  │         │ • Habits Work ✓  │
   │ • Don't Throw ✓  │         │ • Modal System   │         │ • Journal Works ✓│
   │ • Continue Flow  │         │   OFF            │         │ • Goals Work ✓   │
   └──────────────────┘         │ • Core Features  │         │ • Settings Work ✓│
                                │   STILL WORK ✓   │         └──────────────────┘
                                └──────────────────┘

   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │ Modal Display    │  FAIL   │ Level Progression│ SUCCESS │ User Experience  │
   │ Error            │────────▶│ SAVED ✓          │────────▶│                  │
   │                  │         │                  │         │ • XP Added ✓     │
   │ • Log Error ✓    │         │ • XP Stored ✓    │         │ • Level Up ✓     │
   │ • Don't Break    │         │ • Progress Valid │         │ • Visual Failed  │
   │   Level Progress │         │ • Only Visual    │         │   (But User Knows│
   └──────────────────┘         │   Failed         │         │   They Leveled)  │
                                └──────────────────┘         └──────────────────┘
```

### 🔧 DEVELOPER INTEGRATION CHECKLIST

**When Adding New XP Sources:**
```typescript
// ✅ REQUIRED STEPS:
1. Use ONLY GamificationService.addXP() - NO direct XP manipulation
2. Include proper XPSourceType enum value
3. Add error handling with graceful degradation
4. Test both positive and negative XP scenarios (reversal)
5. Verify daily limits are respected
6. Test level-up modal priority with other active modals

// ✅ IMPLEMENTATION TEMPLATE:
const awardXPForNewFeature = async (amount: number, sourceId: string) => {
  try {
    await GamificationService.addXP(amount, {
      source: XPSourceType.NEW_FEATURE,
      sourceId,
      description: 'New feature completion'
    });
  } catch (error) {
    console.error('XP award failed, but feature continues:', error);
    // Feature functionality continues normally
  }
};
```

**When Modifying Level-up Flow:**
```typescript
// 🚨 CRITICAL REQUIREMENTS:
1. Maintain backward compatibility with existing modal coordination
2. Add enhanced logging for all new steps
3. Include error handling with graceful degradation  
4. Test with multiple simultaneous XP sources
5. Verify cleanup integration doesn't break on startup
6. Test modal priority system with rapid level-ups

// 🛡️ TESTING REQUIREMENTS:
- Level-up with active primary modal (Journal milestone)
- Level-up with no competing modals
- Multiple level-ups in rapid succession
- System failure recovery (XP service down, modal crashes)
- Memory cleanup on app startup (with corrupted data)
```

---

**GOLDEN RULE**: *"One gamification system, clear rules, zero exceptions, full reversibility"*

---

*This technical guide serves as the authoritative reference for all gamification mechanics in SelfRise V2. All development work on gamification features must strictly follow these specifications.*