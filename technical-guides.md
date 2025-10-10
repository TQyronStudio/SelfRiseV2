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
13. [Screen Creation Guidelines](#screen-creation-guidelines)
14. [Help Tooltip System](#help-tooltip-system)
15. [Onboarding Tutorial System](#onboarding-tutorial-system)

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

## Screen Creation Guidelines

### App Design Culture Standards

Při vytváření nových screenů v SelfRise V2 je **KRITICKÉ** dodržovat ustanovenou design kulturu aplikace. Tato pravidla zabraňují běžným problémům jako dvojité headery, špatné safe area handling, nebo nekonzistentní styling.

### 1. Screen Types a Navigation Setup

#### A) Tab Navigation Screens
Pro screeny v `app/(tabs)/`:
- **Header**: Automaticky poskytovaný tab navigation s `Colors.primary` background
- **Safe Area**: Používej `SafeAreaView` standard pattern
- **Structure**: Bez custom headerů

```typescript
// ✅ Správně pro tab screens
export function TabScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* content */}
    </SafeAreaView>
  );
}
```

#### B) Modal/Stack Navigation Screens
Pro screeny v main stack (goal-stats, habit-stats, levels-overview):
- **Navigation**: Přidej do `app/_layout.tsx` s `headerShown: false`
- **Header**: Custom header s proper safe area handling
- **Safe Area**: Používej `useSafeAreaInsets()` nikoliv `SafeAreaView`

```typescript
// ✅ Přidat do app/_layout.tsx
<Stack.Screen
  name="new-screen"
  options={{ headerShown: false, presentation: 'card' }}
/>
```

### 2. Safe Area Handling Patterns

#### ❌ ŠPATNĚ - Dvojitá Safe Area
```typescript
// Nikdy nepoužívej SafeAreaView pro modal screens s custom headerem
return (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}> {/* Dvojitý header! */}
```

#### ✅ SPRÁVNĚ - Modal Screen Pattern
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ModalScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {/* Header content */}
      </View>
      {/* Screen content */}
    </View>
  );
}
```

### 3. Header Design Standards

#### Standard Header Pattern
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.primary,  // VŽDY primary color
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,  // Konzistentní padding
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,  // VŽDY bílý text na primary background
    textAlign: 'center',
  },
});
```

#### Back Button Standards
```typescript
<TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Go back"
>
  <Ionicons name="arrow-back" size={24} color={Colors.white} />
</TouchableOpacity>
```

### 4. Color Scheme Standards

#### Background Colors
- **Main container**: `Colors.background`
- **Header background**: `Colors.primary`
- **Secondary containers**: `Colors.backgroundSecondary`

#### Text Colors
- **Header text**: `Colors.white` (na primary background)
- **Main text**: `Colors.text`
- **Secondary text**: `Colors.textSecondary`
- **Header icons**: `Colors.white`

### 5. Loading States Pattern

```typescript
if (isLoading) {
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loading...</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    </View>
  );
}
```

### 6. Common Anti-Patterns to Avoid

#### ❌ Double Header Problem
- **Problém**: Tab navigation + custom header = dvojitý header
- **Řešení**: Používej `headerShown: false` pro modal screens

#### ❌ Wrong Safe Area Usage
- **Problém**: `SafeAreaView` + custom header s `paddingTop: insets.top`
- **Řešení**: Buď SafeAreaView (pro tab screens) NEBO useSafeAreaInsets (pro modal screens)

#### ❌ Inconsistent Colors
- **Problém**: Různé barvy headerů napříč aplikací
- **Řešení**: VŽDY používej `Colors.primary` pro header background

#### ❌ Wrong Text Colors
- **Problém**: Černý text na dark background nebo bílý text na light background
- **Řešení**: Používaj `Colors.white` pro text na `Colors.primary` background

### 7. Screen Creation Checklist

Před implementací nového screenu:

**Navigation Setup:**
- [ ] Přidán do správného layoutu (`app/_layout.tsx` nebo tab navigation)
- [ ] Správná `headerShown` konfigurace
- [ ] Presentation type nastaven (obvykle `'card'`)

**Safe Area:**
- [ ] Použitý správný pattern (SafeAreaView vs useSafeAreaInsets)
- [ ] Žádné dvojité safe area handling
- [ ] PaddingTop: insets.top pouze pro custom headers

**Styling:**
- [ ] Header má `Colors.primary` background
- [ ] Header text má `Colors.white` color
- [ ] Back button má bílou ikonu
- [ ] Container má `Colors.background`

**User Experience:**
- [ ] Loading state implementovaný
- [ ] Back navigation funguje správně
- [ ] Accessibility labels přidány
- [ ] Error states ošetřeny

### 8. Screen Template

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { useI18n } from '@/src/hooks/useI18n';

export const NewScreen: React.FC = () => {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Screen Title</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Screen content */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
```

**Použití template**: Zkopíruj tento template a upravuj podle specifických potřeb screenu. Template garantuje konzistenci s app design culture.

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
- Habit milestone celebrations - pravidla a implementace: @technical-guides:Habits.md
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

## Build History & Testing Environment

### iPhone Development Build - 2025-10-10
**Status**: Active native build with full notification support
**Build Method**: EAS Build (cloud) - development profile
**Platform**: iOS
**Native Modules**: expo-notifications fully integrated
**Testing Device**: iPhone (physical device)
**Build Details**:
- Apple Push Notifications service key configured
- Provisioning profile updated for development build
- All native modules included in build
- Notification system fully operational

**Related Technical Documentation**: @technical-guides:Notifications.md

---

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
- Habit completion rates - výpočet a logika: @technical-guides:Habits.md
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

**Technická pravidla a logika pro Gamifikaci**:
- **XP systém, odměny, limity**: @technical-guides:Gamification-Core.md
- **Animace, modaly, UI**: @technical-guides:Gamification-UI.md  
- **Eventy, komunikace, architektura**: @technical-guides:Gamification-Events.md

---

## Achievements System

**Technická pravidla a logika pro všechny Achievements**: @technical-guides:Achievements.md

---

## Monthly Challenge Detail Modal UI Structure

### Modal Tab Organization

**Overview Tab**:
- Challenge Description
- Timeline (Active Days functionality)
- Requirements Progress (moved from Progress tab)

**Calendar Tab**:
- MonthlyProgressCalendar component
- Weekly Breakdown functionality

**Tips Tab**:
- Category-specific tips
- Monthly strategy
- Reward information

### Removed Components

**Progress Tab**: Completely eliminated due to UI duplication
- ❌ Requirements Progress → moved to Overview
- ❌ Weekly Breakdown → duplicated in Calendar

### Design Principles

**Avoid UI Duplication**:
- Each feature should appear in only one logical location
- Similar functionality should be consolidated, not duplicated

**Information Hierarchy**:
- Overview: High-level information and current progress
- Calendar: Detailed daily/weekly tracking data  
- Tips: Guidance and strategy information

### Technical Implementation Notes

**Tab Structure**:
```typescript
type TabType = 'overview' | 'calendar' | 'tips'; // 'progress' removed
```

**Component Reorganization**:
- Requirements Progress: `renderOverviewTab()` 
- Weekly Breakdown: Remains only in Calendar tab via `MonthlyProgressCalendar`

**Data Source**: Load daily snapshots directly from centralized storage, not weekly estimates

---

## Modal Priority System - 4-Tier Architecture

### Overview

The XpAnimationContext implements a sophisticated 4-tier modal priority system to prevent modal conflicts and ensure proper celebration order. This system was implemented to resolve issues where multiple modals would try to display simultaneously, causing user confusion and blocking important completion celebrations.

### 4-Tier Priority Hierarchy

**Tier 1: Activity Modals (Highest Priority)**
- **Types**: Journal, Habit, Goal completion modals
- **Behavior**: Show immediately, block all other modals
- **Rationale**: User-initiated actions take highest priority for immediate feedback

**Tier 2: Monthly Challenge Completion Modals (High Priority)**
- **Types**: Monthly challenge completion celebrations
- **Behavior**: Show immediately if no Activity modals, block Achievement and Level-up modals
- **Rationale**: Monthly achievements are significant milestones that deserve precedence over regular achievements

**Tier 3: Achievement Modals (Medium Priority)**
- **Types**: Achievement unlock celebrations (handled by AchievementContext)
- **Behavior**: Show immediately if no Activity or Monthly Challenge modals active, block Level-up modals
- **Rationale**: Achievement celebrations are important but secondary to completion events

**Tier 4: Level-up Modals (Lowest Priority)**
- **Types**: XP level-up and multiplier celebrations
- **Behavior**: Only show when all higher priority modals are dismissed
- **Rationale**: Level-ups are cumulative events that can wait for more immediate celebrations

### Implementation Details

**State Management**:
```typescript
modalCoordination: {
  // Tier 1: Activity modals
  isActivityModalActive: boolean;
  currentActivityModalType?: 'journal' | 'habit' | 'goal' | null;

  // Tier 2: Monthly Challenge Completion modals
  isMonthlyChallengeModalActive: boolean;

  // Tier 3: Achievement modals
  isAchievementModalActive: boolean;

  // Tier 4: Level-up modals
  pendingLevelUpModals: Array<{...}>;
  isLevelUpModalActive: boolean;
}
```

**Priority Check Logic**:
```typescript
// Level-up modals check all higher priority tiers
if (state.modalCoordination.isActivityModalActive ||
    state.modalCoordination.isMonthlyChallengeModalActive ||
    state.modalCoordination.isAchievementModalActive) {
  // Queue level-up modal for later display
  queueLevelUpModal(eventData);
} else {
  // Show level-up modal immediately
  showLevelUpModal(eventData);
}
```

### Integration Requirements

**For Monthly Challenge Components**:
- Call `notifyMonthlyChallengeModalStarted()` when showing completion modal
- Call `notifyMonthlyChallengeModalEnded()` when modal is dismissed

**For Achievement Components**:
- Achievement modals automatically processed after Monthly Challenge modals complete

**For Activity Components**:
- Activity modals maintain highest priority and show immediately

### Usage Example

```typescript
const { notifyMonthlyChallengeModalStarted, notifyMonthlyChallengeModalEnded } = useXpAnimation();

// In MonthlyChallengeCompletionModal component
useEffect(() => {
  if (visible) {
    notifyMonthlyChallengeModalStarted();
  }
  return () => {
    if (!visible) {
      notifyMonthlyChallengeModalEnded();
    }
  };
}, [visible]);
```

### Resolution of Original Issues

This 4-tier system specifically resolves:
- ✅ Monthly challenge completion modals now show before level-up modals
- ✅ Multiple haptic feedbacks resolved (proper modal sequencing)
- ✅ Completed challenges remain accessible (separate fix in MonthlyChallengeService)
- ✅ Modal conflicts eliminated through proper priority management

---

## Help Tooltip System

**Technická pravidla a logika pro Help Tooltip systém**: @technical-guides:Help-Tooltips.md

---

## Onboarding Tutorial System

**Technická pravidla a logika pro Onboarding Tutorial**: @technical-guides:Tutorial.md

---

*This document is continuously updated as new development patterns and guidelines are established in the SelfRise V2 project.*