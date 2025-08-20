# SelfRise V2 My Journal System - Technical Guide

*Business logic and non-gamification features for the Journal/Gratitude system*

## Table of Contents

1. [Journal Business Logic](#journal-business-logic)
2. [Daily Requirements](#daily-requirements)
3. [Frozen Streak System](#frozen-streak-system)
4. [UI/UX Guidelines](#uiux-guidelines)
5. [Ad Integration](#ad-integration)
6. [Testing & Validation](#testing--validation)

---

## Journal Business Logic

### Core Concept
My Journal (Gratitude) system allows users to record daily gratitude entries with streak tracking and completion protection mechanisms.

### Key Components
- **gratitudeStorage.ts**: Core storage layer for journal entries
- **GratitudeStreak**: Streak tracking with frozen protection
- **Daily Completion Rules**: 3+ entries requirement for streak maintenance
- **Recovery System**: Ad-based streak protection

### Architecture Separation
```typescript
// ✅ Journal Business Logic (this guide)
- Daily completion requirements (3+ entries)
- Streak tracking and protection
- Ad-based recovery system
- UI/UX behavior for frozen states

// ✅ Gamification Logic (separate guide)
- XP position-based rewards
- Anti-spam XP limits  
- Journal bonus milestones
- Daily XP limits integration
```

---

## Daily Requirements

### Streak Completion Rules
```typescript
// Daily completion requirements for streak maintenance
MINIMUM_DAILY_ENTRIES: 3                 // Required for streak continuation
STREAK_PROTECTION_ENABLED: true          // Frozen streak system active
GRACE_PERIOD_HOURS: 24                   // Until midnight for daily completion
AUTO_RESET_PROTECTION: 3 days            // Max debt before auto-reset
```

### Completion States
```typescript
interface DailyCompletionState {
  entriesCount: number;                   // Number of entries today
  isComplete: boolean;                    // 3+ entries = complete day
  streakStatus: 'active' | 'frozen' | 'broken';
  frozenDays: number;                     // 0-3 accumulated debt days
  canRecover: boolean;                    // Ad recovery available
}
```

### Daily Logic Flow
```typescript
// Daily completion check logic
const checkDailyCompletion = (entriesCount: number): DailyCompletionState => {
  const isComplete = entriesCount >= 3;
  
  if (isComplete) {
    return { streakStatus: 'active', frozenDays: 0 };
  } else {
    // Incomplete day → accumulate debt
    return { streakStatus: 'frozen', frozenDays: currentDebt + 1 };
  }
}
```

---

## Frozen Streak System

### ✅ FULLY IMPLEMENTED

### System Overview
Frozen Streak protects user journal streaks from complete loss when they miss daily requirements. Instead of resetting to 0, streaks become "frozen" and can be "warmed up" through ad-watching.

### Basic Rules
```typescript
DAILY_REQUIREMENT: 3+ journal entries = complete day
INCOMPLETE_DAY: 0-2 entries = debt accumulation  
MAX_DEBT_DAYS: 3 days (auto-reset after 3+ days)
RECOVERY_METHOD: 1 ad per missed day
AUTO_RESET_THRESHOLD: 4+ consecutive incomplete days
```

### Debt Tracking System
```typescript
interface GratitudeStreak {
  currentStreak: number;               // Current streak value (preserved when frozen)
  frozenDays: number;                  // 0-3, accumulated missed days
  isFrozen: boolean;                   // true when frozenDays > 0
  canRecoverWithAd: boolean;           // true if frozenDays 1-3
  warmUpPayments: WarmUpPayment[];     // Track ad payments for recovery
  autoResetTimestamp: Date | null;     // Auto-reset protection timestamp
  autoResetReason: string | null;      // Reset reason tracking
  lastCompletionDate: string;          // Last day with 3+ entries
}
```

### State Transitions
```typescript
// Normal → Frozen (when daily requirement not met)
Normal State (3+ entries) → Frozen State (debt accumulates)

// Frozen → Normal (through ad recovery)
Frozen State + Ad Payment → Normal State (debt cleared)

// Frozen → Broken (auto-reset after 3+ days)
Frozen State (4+ days debt) → Auto-Reset → New Streak (starts at 0)
```

### Recovery Mechanism
```typescript
interface WarmUpPayment {
  debtDay: string;                     // Which debt day this payment covers
  paymentTimestamp: Date;              // When ad was watched
  adType: 'rewarded_video';            // Type of ad watched
  isValid: boolean;                    // Payment validation status
}

// Recovery calculation
const calculateRecoveryNeeded = (frozenDays: number): number => {
  return Math.min(frozenDays, 3); // Max 3 ads required
}
```

---

## UI/UX Guidelines

### Visual States

#### Normal Streak State
```typescript
// UI appearance when streak is active
streakNumber: "15" (standard app color)
streakLabel: "days"
status: "🔥 Streak Active"
backgroundColor: normal theme
actionButton: hidden
```

#### Frozen Streak State
```typescript
// UI appearance when streak is frozen
streakNumber: "15" (ice blue color ❄️)
streakLabel: "frozen"
status: "❄️ Streak Frozen: 2 days - Tap to warm up"
warning: "❄️ Streak Frozen: 2 day(s) - Tap to warm up"
backgroundColor: light blue tint
actionButton: "Warm Up Streak" (visible)
```

### Modal Design: "Warm Up Your Streak"
```typescript
// Recovery modal specifications
title: "Warm Up Your Streak"
description: "Watch ads to recover your frozen streak"
debtDisplay: "Frozen for X days"
progressBar: {
  current: adsWatched,
  total: frozenDays,
  color: ice blue theme
}
adButton: "Watch Ad" (per debt day)
successMessage: "🎉 Streak Rescued!"
```

### Home Screen Integration
```typescript
// Display location: Home screen streak section
position: "Next to trophy and reorganizer icons"
scrollBehavior: "Non-scrolling header area"
visibility: "Always visible when frozen"
tapBehavior: "Opens recovery modal"
```

---

## Ad Integration

### Testing vs Production

#### Development/Testing Mode
```typescript
// Mock ad system for testing
mockAdWatching: true
adDuration: 1 second (instant)
alwaysSuccessful: true
testingActions: [
  'Simulate ad completion',
  'Test recovery flow',
  'Validate debt clearing'
]
```

#### Production Mode
```typescript
// Real AdMob integration required
adProvider: 'AdMob Rewarded Video'
adDuration: 15-30 seconds
rewardValidation: server-side
errorHandling: retry mechanism
adLoadingStates: loading/ready/failed
```

### Ad Flow Integration
```typescript
// Complete ad recovery flow
1. User taps frozen streak → Opens modal
2. User taps "Watch Ad" → AdMob loads
3. User watches full ad → Reward granted
4. System validates reward → Debt day cleared
5. Update UI → Progress bar advances
6. Repeat until all debt cleared → Streak restored
```

---

## Testing & Validation

### Critical Test Scenarios
```typescript
describe('Journal Business Logic Testing', () => {
  it('should track daily completion correctly', async () => {
    // Test 3+ entries = complete day
    // Test 0-2 entries = incomplete day
  })
  
  it('should accumulate debt properly', async () => {
    // Test debt accumulation for incomplete days
    // Test max 3 debt days before auto-reset
  })
  
  it('should handle frozen streak recovery', async () => {
    // Test ad-based recovery system
    // Test debt clearing per ad watched
  })
  
  it('should auto-reset after max debt', async () => {
    // Test auto-reset protection at 4+ days
    // Test new streak starts from 0
  })
  
  it('should maintain streak value during freeze', async () => {
    // Test streak value preserved when frozen
    // Test restoration to original value after recovery
  })
})
```

### Edge Cases Validation
```typescript
// Critical edge cases to test
1. Exactly 3 entries → should complete day ✅
2. 2 entries → should start freezing ❄️  
3. Multiple incomplete days → should accumulate debt
4. 4+ incomplete days → should auto-reset ♻️
5. Recovery with partial ads → should track progress
6. App closure during recovery → should restore state
```

### Performance Requirements
```typescript
// Business logic operations must be fast
Daily completion check: <10ms
Debt calculation: <20ms
Recovery validation: <50ms
UI state updates: <100ms
```

---

## Integration with Other Systems

### Gamification Integration
```typescript
// Clear separation of concerns
Journal Business Logic → Handles completion rules, streak protection
Gamification System → Handles XP rewards, daily limits, anti-spam

// Shared data points
dailyEntryCount: used by both systems
completionStatus: journal → gamification (for streak milestone XP)
```

### Storage Integration
```typescript
// gratitudeStorage.ts responsibilities
- Entry CRUD operations
- Daily count calculation  
- Streak state persistence
- Recovery payment tracking

// NOT responsible for:
- XP calculation (→ GamificationService)
- Daily XP limits (→ GamificationService)
- Milestone bonuses (→ GamificationService)
```

---

**GOLDEN RULE**: *"One journal system, clear completion rules, complete streak protection, separate from XP concerns"*

---

*This technical guide focuses exclusively on Journal business logic, daily requirements, and streak protection. For XP-related journal features, see @technical-guides:Gamification.md*