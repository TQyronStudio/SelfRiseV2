# SelfRise V2 Technical Development Guidelines

*A living document for development reference - extracted from projectplan.md*

## Table of Contents

1. [Smart Logic Design Guidelines](#smart-logic-design-guidelines)
2. [Development Standards](#development-standards)
3. [Code Standards](#code-standards)
4. [Performance Considerations](#performance-considerations)
5. [User Interface & Celebrations](#user-interface--celebrations)
6. [Security Guidelines](#security-guidelines)
7. [Accessibility Standards](#accessibility-standards)
8. [Configuration Management](#configuration-management)
9. [Technical Stack & Architecture](#technical-stack--architecture)

---

## Smart Logic Design Guidelines

### Fundamental Principle: "Context is King"
Never use absolute numerical values without considering time, history, or entity state context.

### 1. Temporal Context Principles

**L Wrong: Absolute values without time**
```typescript
if (progress < 10%) show "Start Making Progress"
if (habit.completionRate < 30%) show "Adjust Schedule"
```

** Correct: Time and existence context**
```typescript
// Respect when entity was created
if (timeElapsed > 10% && progress < 10%) show "Start Making Progress"
if (recentDays.filter(day => day >= creationDate).length >= 7 && rate < 30%) show "Adjust Schedule"
```

**Key Question**: *"Can this state be considered problematic given the entity's existence time?"*

### 2. Relevant Data Principle

**L Wrong: Fixed time windows**
```typescript
// Habit may exist only 2 days, but we calculate 7 days back
const last7Days = getPast7Days()
const completionRate = completions.length / 7
```

** Correct: Dynamic windows based on existence**
```typescript
const relevantDays = getPastDays(7).filter(day => day >= habit.createdAt)
const completionRate = completions.length / relevantDays.length
```

**Key Question**: *"Does my data include periods when the entity didn't exist?"*

### 3. Proportional Assessment Principle

**L Wrong: Same thresholds for everything**
```typescript
if (daysToDeadline < 30 && progress < 50%) show "Timeline Check"
// 1-month goal: Warns almost entire time
```

** Correct: Proportional to total duration**
```typescript
if (daysToDeadline < 30 && progress < 50% && estimatedCompletion > targetDate) show "Timeline Check"
// Warns only when actually at risk
```

**Key Question**: *"Is this warning relevant for the entity's duration?"*

### 4. Design Checklist for New Logic

**A) Context Analysis:**
- [ ] **When was entity created?** (createdAt respect)
- [ ] **How long should it last?** (total timeframe)
- [ ] **What phase is it in?** (beginning/middle/end)

**B) Edge Case Validation:**
- [ ] **New entity** (created today) - does warning make sense?
- [ ] **Short entity** (duration < 7 days) - isn't warning permanent?
- [ ] **Long entity** (duration > 1 year) - isn't threshold too strict?

**C) Test Scenarios:**
```typescript
// Always test these 3 scenarios:
const scenarios = [
  { name: "New entity", createdAt: "today", duration: "30 days", progress: 0 },
  { name: "Short entity", duration: "7 days", progress: 30 },
  { name: "Long entity", duration: "365 days", progress: 5 }
]
```

### 5. Template for New Logic

```typescript
function shouldShowRecommendation(entity, currentDate) {
  // 1. CONTEXT: Calculate relevant time period
  const createdDate = new Date(entity.createdAt)
  const targetDate = entity.targetDate ? new Date(entity.targetDate) : null
  const totalDuration = targetDate ? targetDate - createdDate : null
  const elapsed = currentDate - createdDate
  
  // 2. CONDITIONS: Define proportional thresholds
  const timeElapsedPercent = totalDuration ? (elapsed / totalDuration) * 100 : 0
  const progressPercent = (entity.currentValue / entity.targetValue) * 100
  
  // 3. LOGIC: Combine absolute + relative conditions
  const hasEnoughTimeElapsed = timeElapsedPercent > MINIMUM_TIME_THRESHOLD
  const hasLowProgress = progressPercent < PROGRESS_THRESHOLD
  const isActuallyBehind = entity.estimatedCompletion > entity.targetDate // when available
  
  // 4. DECISION: All relevant conditions simultaneously
  return hasEnoughTimeElapsed && hasLowProgress && isActuallyBehind
}
```

### 6. Design Patterns

**Pattern 1: "Grace Period"**
```typescript
// Give user time to get started
const gracePeriod = Math.max(totalDuration * 0.1, 1) // Min 1 day, max 10% duration
if (elapsedTime < gracePeriod) return false
```

**Pattern 2: "Proportional Thresholds"**
```typescript
// Thresholds proportional to duration
const expectedProgress = (elapsedTime / totalDuration) * 100
const threshold = entity.duration < 30 ? 20 : 10 // Gentler for short goals
```

**Pattern 3: "Smart Fallbacks"**
```typescript
// When you don't have perfect data, fallback to reasonable logic
if (!targetDate) {
  // Without deadline, can't calculate timeline pressure
  return false
}
```

### 7. Final Checklist

Before implementing new logic, ask:

1. **=R Time**: *"Does it respect when entity was created and how long it should last?"*
2. **=� Proportion**: *"Are thresholds proportional to entity context?"*
3. **<� Relevance**: *"Is warning useful at this exact moment?"*
4. **= Edge cases**: *"Did I test very new and very long entities?"*
5. **<� UX**: *"Am I not annoying users with unnecessary notifications?"*

---

## Development Standards

### Code Standards
- Use TypeScript strict mode
- Follow React Native best practices
- Implement proper error handling
- Use consistent naming conventions
- Add comprehensive JSDoc comments

### Async/Await Support
- Add async/await support for all data fetching operations
- Use proper error handling with try-catch blocks
- Test edge cases (no progress data, no target date, etc.)

### Testing Requirements
- Test with short-term goals that are on track (should NOT show false positives)
- Test with goals genuinely behind schedule (should show appropriate warnings)
- Verify integration functionality remains correct
- Always test the 3 core scenarios: new, short, and long entities

---

## Performance Considerations
- Implement lazy loading for screens
- Use React.memo for expensive components
- Optimize images and assets
- Implement proper state management
- Use native modules when necessary

---

## User Interface & Celebrations

### Critical Design Standard
- **CRITICAL**: All celebrations, alerts, notifications, and user feedback throughout the app MUST use the elegant CelebrationModal component design standard
- **NO simple Alert.alert()**: Never use system alerts for important user interactions

### Consistent Modal Styling
All modals should follow the CelebrationModal pattern with:
- Large emoji display
- Styled title and message
- Beautiful button design
- Proper spacing and shadows
- Badge/counter displays when relevant

### Examples of Correct Implementation
- Gratitude completion celebrations (daily_complete, streak_milestone, bonus_milestone)
- All future habit milestone celebrations
- Goal achievement notifications
- App onboarding confirmations
- Any significant user achievement or feedback

---

## Security Guidelines
- Implement proper data validation
- Use secure storage for sensitive data
- Implement proper authentication
- Add input sanitization
- Use HTTPS for all API calls

---

## Accessibility Standards
- Add proper accessibility labels
- Implement keyboard navigation
- Support screen readers
- Use proper color contrast
- Add haptic feedback

---

## Configuration Management

### Firebase Configuration
**Location**: `src/config/firebase.ts`
- `EXPO_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### AdMob Configuration
**Location**: `src/config/admob.ts`
- `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` - AdMob Android app ID
- `EXPO_PUBLIC_ADMOB_IOS_APP_ID` - AdMob iOS app ID
- `EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID` - Android banner ad unit ID
- `EXPO_PUBLIC_ADMOB_BANNER_ID_IOS` - iOS banner ad unit ID
- `EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID` - Android rewarded ad unit ID
- `EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS` - iOS rewarded ad unit ID

### Analytics Configuration
**Location**: `src/config/analytics.ts`
- `EXPO_PUBLIC_FIREBASE_ANALYTICS_ID` - Firebase Analytics ID
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN for crash reporting

### Push Notifications
**Location**: `src/config/notifications.ts`
- `EXPO_PUBLIC_PUSH_NOTIFICATION_PROJECT_ID` - Expo push notification project ID

### Environment Files
- `.env.example` - Example environment file with all required keys
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

---

## Technical Stack & Architecture

## Latest Implementation Updates

### Monthly Challenge System Integration Complete (August 9, 2025)
**Issue**: MonthlyProgressTracker had placeholder methods, preventing real-time progress tracking
**Solution**: Complete integration with all services using dynamic imports to prevent circular dependencies

**Key Fixes**:
- `getActiveMonthlyChallenge()` → Real integration with MonthlyChallengeService.getCurrentChallenge()
- `getChallengeById()` → Multi-month lookup with historical fallback
- `getDailyXPTransactions()` → Full GamificationService.getTransactionsByDateRange() integration
- **9 Weekly Breakdown Methods** → Complete implementation replacing all placeholders

**Result**: 100% functional Monthly Challenge System ready for production deployment.

### Core Technologies
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Bottom tab navigation
- **Styling**: Consistent light theme design

### Project Focus
SelfRise V2 is a React Native mobile application built with Expo and TypeScript, focused on goal tracking, habit formation, and gratitude journaling. The app features internationalization (i18n) support with English as the default language and future support for German and Spanish.

### Success Metrics

#### Technical Metrics
- App launch time < 2 seconds
- Crash rate < 0.1%
- Memory usage < 100MB
- Battery usage optimization
- 99.9% uptime for data sync

#### User Experience Metrics
- Daily active users retention
- Habit completion rates
- Gratitude entry frequency
- Goal achievement rates
- User satisfaction scores

#### Business Metrics
- App store ratings > 4.5
- User retention > 80% after 30 days
- Feature adoption rates
- In-app purchase conversion
- Ad revenue optimization

---

## Risk Assessment

### Technical Risks
- **Risk**: Complex state management across features
- **Mitigation**: Use proven state management patterns and comprehensive testing

- **Risk**: Performance issues with large datasets
- **Mitigation**: Implement pagination and data optimization strategies

- **Risk**: Cross-platform compatibility issues
- **Mitigation**: Thorough testing on both iOS and Android devices

### Business Risks
- **Risk**: Low user engagement
- **Mitigation**: Implement gamification and social features

- **Risk**: App store rejection
- **Mitigation**: Follow app store guidelines and conduct thorough testing

- **Risk**: Competition from existing apps
- **Mitigation**: Focus on unique features and superior user experience

---

## Gamification System Rules

### Critical Architecture Rule
**🚨 FUNDAMENTAL PRINCIPLE**: Only GamificationService.addXP()/subtractXP() may handle XP operations. All other systems are FORBIDDEN from containing XP logic.

### 1. XP REWARDS & SOURCES

#### Habit System XP
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

#### Journal System XP (Position-Based)
```typescript
// Position-based rewards with anti-spam protection
Position 1: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 2: 20 XP (XPSourceType.JOURNAL_ENTRY) 
Position 3: 20 XP (XPSourceType.JOURNAL_ENTRY)
Position 4-13: 8 XP each (XPSourceType.JOURNAL_BONUS)
Position 14+: 0 XP (ANTI-SPAM RULE)

// Bonus milestones (on top of entry XP)
Entry #4 (first bonus): +25 XP
Entry #8 (fifth bonus): +50 XP
Entry #13 (tenth bonus): +100 XP

// Streak milestones
7 days: 75 XP, 21 days: 100 XP, 30 days: 150 XP, 100 days: 250 XP, 365 days: 500 XP
```

#### Goal System XP  
```typescript
XPSourceType.GOAL_PROGRESS: 35 XP       // Adding progress (max 3x per goal per day)
XPSourceType.GOAL_MILESTONE:
- 25% completion: 50 XP
- 50% completion: 75 XP  
- 75% completion: 100 XP
- 100% completion: 200 XP
```

#### System XP
```typescript
XPSourceType.DAILY_LAUNCH: 5 XP         // Daily app launch
XPSourceType.ACHIEVEMENT_UNLOCK: Variable // Based on rarity (50-500 XP)
```

### 2. DAILY LIMITS & ANTI-SPAM RULES

#### Maximum Daily Limits  
```typescript
TOTAL_DAILY_MAX: 1500 XP                // Absolute daily maximum
HABITS_MAX_DAILY: 500 XP                // From all habit activities
JOURNAL_MAX_DAILY: 415 XP               // From all journal activities  
GOALS_MAX_DAILY: 400 XP                 // From all goal activities
ENGAGEMENT_MAX_DAILY: 200 XP            // From launches, recommendations
```

#### Transaction Limits
```typescript
// Goals: Maximum 3 XP transactions per goal per day
MAX_GOAL_TRANSACTIONS_PER_DAY = 3

// Journal: Entry position 14+ = 0 XP (spam prevention)
// Habits: No transaction limit (natural daily scheduling)
```

#### Limit Distribution Rules
- **Minimum section allocation**: Each feature gets ≥20% of daily limit when active
- **Single source maximum**: No source can exceed 80% of total daily XP
- **Multiplier scaling**: All limits scale proportionally with active XP multipliers

#### XP MULTIPLIER SYSTEM

#### Multiplier Types & Rewards
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
```

#### Harmony Streak Activation Requirements
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

#### Daily Limits Scale with Multipliers
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

#### Multiplier Eligibility Checking
```typescript
// User can activate multiplier when:
1. Harmony streak ≥ 7 days ✅
2. No active multiplier running ✅  
3. Not on cooldown (7 days since last activation) ✅
4. User manually activates (not automatic)

// Cooldown system prevents exploitation:
- Harmony: 7 day cooldown between activations
- Challenge: 7 day cooldown after monthly challenge
- Achievement: 3 day cooldown after combo
```

### 3. REVERSAL LOGIC (Critical for Minus XP)

#### Core Principle
Every action must be fully reversible without exploitation opportunities.

#### Reversal Patterns
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

#### Daily Limit Impact of Minus XP
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

### 4. ARCHITECTURE ENFORCEMENT

#### Single Source of Truth
```typescript
// ✅ CORRECT: Only GamificationService handles XP
await habitStorage.createCompletion(habitId, date, isBonus)
await GamificationService.addXP(25, { source: XPSourceType.HABIT_COMPLETION })

// ❌ FORBIDDEN: Storage layers with XP logic
await habitStorage.createCompletionWithXP() // NEVER DO THIS
```

#### Storage Layer Rules
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

### 5. EVENT SYSTEM

#### Standardized Events Only
```typescript
'xpGained'           // Every XP addition/subtraction
'levelUp'            // Level progression  
'xpBatchCommitted'   // Batched operations complete
'achievementUnlocked' // Achievement triggers

// ❌ FORBIDDEN: Custom XP events
'enhanced_xp_awarded' // DEPRECATED - use 'xpGained'
'custom_xp_event'     // FORBIDDEN - use standard events
```

### 6. PERFORMANCE REQUIREMENTS

#### 60fps Guarantee
```typescript
// Every XP operation must complete in <16.67ms
Operation speed: <16.67ms per XP operation
Caching: 100ms cache validity for smooth animations
Optimistic updates: Real-time UI with background sync
```

### 7. VALIDATION & ERROR HANDLING

#### Mandatory Validation
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

### 8. DEVELOPMENT PATTERNS

#### Code Review Checklist
- [ ] Uses only GamificationService for XP operations?
- [ ] Storage layers are XP-free?  
- [ ] Minus XP implemented for all deletions?
- [ ] Daily limits and anti-spam respected?
- [ ] Standard events used?
- [ ] Error handling prevents feature breakage?

#### Testing Requirements
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

### 9. INTEGRATION WITH ACHIEVEMENTS

#### Achievement XP Rules
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

*This document is continuously updated as new development patterns and guidelines are established in the SelfRise V2 project.*