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
10. [My Journal System](#my-journal-system)
11. [Gamification System](#gamification-system)
12. [Achievements System](#achievements-system)

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

## My Journal System

**Technická pravidla a logika pro My Journal**: @technical-guides:My-Journal.md

---

## Gamification System

**Technická pravidla a logika pro Gamifikaci**: @technical-guides:Gamification.md

---

## Achievements System

**Technická pravidla a logika pro všechny Achievements**: @technical-guides:Achievements.md

---

*This document is continuously updated as new development patterns and guidelines are established in the SelfRise V2 project.*