# SelfRise V2 - Project Plan

## ✅ COMPLETED: Remove Dead Category Cases from UI Components

Successfully cleaned up switch statements in UI components by removing dead category cases that are no longer valid after the AchievementCategory enum was updated.

### Files Updated:
- [x] `/src/components/challenges/MonthlyProgressCalendar.tsx` - Removed 'mastery', 'social', 'special' from getCategoryColor
- [x] `/src/components/challenges/MonthlyChallengeDetailModal.tsx` - Removed 'mastery', 'social', 'special' from getCategoryColor and getCategoryIcon, removed 'mastery' from getMonthlyChallengeTips
- [x] `/src/components/achievements/AchievementDetailModal.tsx` - Removed 'mastery', 'social', 'special' from getCategoryColor and getCategoryIcon

### Remaining Valid Categories:
Only these categories are now supported in the cleaned switch statements:
- `habits` - '🎯' - #22C55E / #4CAF50
- `journal` - '📝' - #3B82F6 / #2196F3
- `goals` - '🏆' - #F59E0B / #FF9800
- `consistency` - '⚡' - #8B5CF6 / #F44336
- `default` case for fallback

All changes maintain proper switch statement structure and functionality.

## 🚨 DŮLEŽITÉ - NEMAZAT 🚨

### Cílová kvalita - TOP světová úroveň:
Aplikace MUSÍ být na špičkové úrovni ve všech aspektech:
- **Funkcionalita** - Bezchybná, intuitivní, rychlá
- **Design** - Moderní, elegantní, profesionální
- **Animace** - Smooth, přírodní, poutavé
- **UX** - Vynikající uživatelský zážitek srovnatelný s nejlepšími aplikacemi na trhu

---

## Project Overview
SelfRise V2 is a React Native mobile application built with Expo and TypeScript, focused on goal tracking, habit formation, and gratitude journaling. The app will feature internationalization (i18n) support with English as the default language and future support for German and Spanish.

## Core Features
- **Home**: Daily gratitude streak display and interactive habit statistics
- **Habits**: Habit creation, management, and tracking with customizable scheduling
- **My Journal**: Daily reflection with gratitude and self-praise entries
- **Goals**: Long-term goal setting with progress tracking
- **Settings**: Notifications, user authentication, and preferences

## Technical Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Bottom tab navigation
- **Styling**: Consistent light theme design
- **Data Storage**: Local storage with future Firebase integration

---

## Development Phases

### Phase 1: Core Foundation - NAVIGATION & HOME SCREEN ✅ COMPLETE
*(All checkpoints completed successfully)*

### Phase 2: Habit Tracking System ✅ COMPLETE
*(Full habit creation, tracking, and management implemented)*

### Phase 3: My Journal Screen ✅ COMPLETE
*(Gratitude and self-praise system with streak tracking implemented)*

### Phase 4: Goals System ✅ COMPLETE
*(Goal creation, progress tracking, and completion system implemented)*

### Phase 5: Gamification & XP System ✅ COMPLETE
*(Complete XP earning, leveling, and achievement systems implemented)*

### Phase 6: Monthly Challenges ✅ COMPLETE
*(4-category challenge system with real-time tracking implemented)*

#### Checkpoint 6.4: Monthly Challenge Implementation ✅ **COMPLETE**

**Status**: Production-ready monthly challenge system with full category coverage

**Implemented Features**:
- ✅ 12 unique monthly challenges across 4 categories
- ✅ Automatic progress tracking with real-time DeviceEventEmitter sync
- ✅ Star reward system (Bronze/Silver/Gold tiers)
- ✅ Beautiful UI with animations and visual feedback
- ✅ Challenge history and statistics
- ✅ Integration with XP system and achievements

**Challenge Categories & Templates**:
- **Habits**: Consistency Champion, Streak Master, Morning Warrior, Habit Hero ✅
- **Journal**: Reflection Guru, Gratitude Master, Journal Star ✅
- **Goals**: Progress Champion, Achievement Unlocked ✅
- **Consistency**: Triple Master, Perfect Month, XP Champion, Balance Expert ✅

**🔧 Klíčové opravy dokončeny**:
- ✅ Všechny tracking keys v `calculateProgressIncrement()` funkční
- ✅ Daily XP calculation bug opraven (`xpEarnedToday` snapshots)
- ✅ Template structure standardizována (tracking key mismatches opraveny)
- ✅ Complex tracking algoritmy implementovány (balance_score, monthly_xp_total)
- ✅ Real-time DeviceEventEmitter synchronization funkční


**Technical Documentation**: Complete implementation details in @implementation-history.md - "Monthly Challenges System - Complete Implementation"

### Phase 7: Settings & User Experience

#### Checkpoint 7.1: Daily Reminder Notifications ✅ **PRODUCTION READY**

✅ **STATUS**: Fully functional smart notification system with 4-priority evening reminders and afternoon motivational messages. Complete technical documentation: @technical-guides:Notifications.md

**Key Features Implemented**:
- ✅ Afternoon generic reminders (16:00 default, 4 rotating variants)
- ✅ Evening smart reminders (20:00 default, priority-based: habits → journal → bonus → silence)
- ✅ Permission management with iOS/Android support
- ✅ User settings UI (time pickers, toggles, status indicators)
- ✅ App lifecycle integration (useNotificationLifecycle hook)
- ✅ Smart navigation on notification tap
- ✅ Full i18n support (English, ready for other languages)
- ✅ Performance optimized (~50ms async, non-blocking)

**Data Source**: AsyncStorage (habits, journal, goals) - analyzed via progressAnalyzer.analyzeDailyProgress()

**Files**:
- Service: `src/services/notificationService.ts`, `src/utils/notificationScheduler.ts`
- Hook: `src/hooks/useNotificationLifecycle.ts`
- UI: Settings screen notification section
- i18n: `src/locales/en/index.ts` (notifications.reminders)

**Note**: Notifications update on app open (not real-time per task). Future enhancement: granular triggers.

#### Checkpoint 7.2: App Settings
- [ ] Theme selection and customization
- [ ] Language preference settings
- [ ] Data export and backup options

### Phase 8: External Service Integration Preparation

#### Checkpoint 8.1: Firebase Configuration Prep
- [ ] Firebase project setup and configuration (for analytics and notifications only)
- [ ] Cloud storage preparation (for app analytics and crash reporting)

#### Checkpoint 8.2: AdMob Integration Prep
- [ ] AdMob account setup and ad unit creation
- [ ] Ad integration for streak recovery system
- [ ] Revenue tracking and analytics

#### Checkpoint 8.3: Analytics & Notifications Prep
- [ ] Analytics service integration
- [ ] Push notification service setup
- [ ] User engagement tracking

### Phase 9: Testing & Quality Assurance

#### Checkpoint 9.1: Debt Recovery System Testing ⚡ ✅ COMPLETED
**Goal**: Create comprehensive test suite for debt recovery system fixes
- [x] Analyze critical bug fixes made by habit-logic-debugger agent
- [x] Review fixed calculateDebt() and requiresAdsToday() functions
- [x] Review fixed ad counting logic in DebtRecoveryModal
- [x] Create comprehensive debt recovery system test suite
- [x] Test primary bug: user with 3+ entries today shows debt = 0
- [x] Test ad counting: 1 ad watched = 1 ad credited (no double counting)
- [x] Test edge cases: debt calculation with various scenarios
- [x] Test integration: full debt payment flow end-to-end
- [x] Validate logical consistency across all debt recovery functions

**Implementation Summary**: August 2, 2025
- ✅ **Created comprehensive test suite**: 65+ automated test scenarios
- ✅ **GratitudeStorage tests**: 45 test cases covering all debt recovery logic
- ✅ **DebtRecoveryModal tests**: 20 test cases covering UI and ad counting
- ✅ **Manual testing guide**: Comprehensive testing documentation with scenarios
- ✅ **Jest configuration**: Proper test setup and npm scripts added
- ✅ **Coverage validation**: Tests validate all critical bug fixes

**Key Test Files Created**:
- `/src/services/storage/__tests__/gratitudeStorage.debtRecovery.test.ts` - Logic testing
- `/src/components/gratitude/__tests__/DebtRecoveryModal.test.tsx` - UI testing
- `DEBT_RECOVERY_TESTING_GUIDE.md` - Manual testing scenarios
- `jest.config.js` - Test configuration

**Test Commands Available**:
- `npm run test:debt-recovery` - Run debt recovery tests only
- `npm run test:debt-recovery:coverage` - Run with coverage report
- `npm test` - Run all tests

**Validation Completed**: All critical bugs are now covered by comprehensive tests ensuring:
1. Users with 3+ entries today always show debt = 0
2. Ad counting works correctly (1 ad = 1 credit)
3. Edge cases and boundary conditions handled properly
4. Integration flows work end-to-end

#### Checkpoint 9.2: XP System Testing ⚡ PENDING
**Goal**: Create comprehensive test suite for gamification/XP system
- [ ] Install Jest and React Native Testing Library dependencies
- [ ] Create GamificationService unit tests with full coverage
- [ ] Test level calculation mathematical model accuracy
- [ ] Test XP validation and anti-spam protection systems
- [ ] Test daily limits and balance validation logic
- [ ] Test XP transaction and rollback functionality
- [ ] Create XP integration tests with storage services
- [ ] Test edge cases and error handling scenarios

#### Checkpoint 9.2: Core Feature Unit Testing
- [ ] Component testing with Jest and React Native Testing Library
- [ ] Storage service testing (HabitStorage, GratitudeStorage, GoalStorage)
- [ ] Business logic unit tests for habit tracking, streaks, calculations

#### Checkpoint 9.3: E2E Testing
- [ ] User flow testing with Detox
- [ ] Cross-platform compatibility testing
- [ ] Performance testing

#### Checkpoint 9.4: Quality Assurance
- [ ] Manual testing across different devices
- [ ] User acceptance testing
- [ ] Bug fixes and refinements

### Phase 10: App Store Preparation

#### Checkpoint 10.1: Assets & Metadata
- [ ] App icon design and generation
- [ ] Screenshots for App Store and Google Play
- [ ] App descriptions and metadata
- [ ] Privacy policy and terms of service

#### Checkpoint 10.2: Build & Deploy
- [ ] Production builds for iOS and Android
- [ ] Beta testing with TestFlight and Google Play Internal Testing
- [ ] Final submission to App Store and Google Play

---

## 🚀 PHASE 11: SQLITE MIGRATION - AsyncStorage → SQLite Database

**Goal**: Migrate from AsyncStorage to SQLite for 5-40x performance improvement, eliminate race conditions, and prepare for scalability

**Status**: 📋 PLANNING PHASE - Detailed analysis and migration strategy

**Migration Strategy**: Phased approach with backwards compatibility and comprehensive backup system

---


### 🎯 SEKCE 1: CORE DATA MIGRATION (Journal, Habits, Goals)

**Priority**: 🔴 **KRITICKÁ** - Řeší aktuální race condition problém v My Journal

**Technical Documentation**: @sqlite-migration-phase1-core.md

**Implementation Checkpoints**:
- [x] 1.1.1: Journal backup & verification ✅
- [ ] 1.1.2: SQLite database setup & schema creation (45 min)
- [ ] 1.1.3: Journal data migration with transactions (1 hour)
- [ ] 1.1.4: Migration verification & integrity tests (45 min)
- [ ] 1.1.5: Update GratitudeStorage service to SQLite (2 hours)
- [ ] 1.1.6: Implement rollback mechanism (30 min)
- [ ] 1.1.7: Integration testing & race condition validation (1 hour)
- [ ] 1.2: Habits storage migration (2 hours)
- [ ] 1.3: Goals storage migration (2 hours)
- [ ] Final: Automated + manual testing (2 hours)

**Expected Results**:
- ✅ 72x faster journal entry additions (360ms → 5ms)
- ✅ 25x faster entry loading (50ms → 2ms)
- ✅ Zero race conditions (ACID transactions)
- ✅ 100% data integrity with backup/rollback capability

**Total Time**: 8-12 hours

---

### 🎮 SEKCE 2: GAMIFICATION & XP MIGRATION (Achievements, XP, Multipliers, Loyalty)

**Priority**: 🟠 **VYSOKÁ** - Optimalizace XP systému a achievement trackingu

**Technical Documentation**: @sqlite-migration-phase2-gamification.md

**Implementation Checkpoints**:
- [ ] 2.1: XP transactions & daily tracking migration (2 hours)
- [ ] 2.2: Achievement progress & unlock events migration (2 hours)
- [ ] 2.3: XP multipliers & loyalty state migration (1.5 hours)
- [ ] 2.4: Update gamification services to SQLite (2 hours)
- [ ] Final: Testing XP calculations & achievement unlocks (1.5 hours)

**Expected Results**:
- ✅ 16x faster XP award operations (80ms → 5ms)
- ✅ 40x faster daily limit checks (40ms → 1ms)
- ✅ Pre-aggregated XP summaries for instant queries
- ✅ Achievement unlock history preserved

**Total Time**: 6-8 hours

---

### 📅 SEKCE 3: MONTHLY CHALLENGES & FEATURES MIGRATION

**Priority**: 🟡 **STŘEDNÍ** - Optimalizace challenge trackingu

**Technical Documentation**: @sqlite-migration-phase3-features.md

**Implementation Checkpoints**:
- [ ] 3.1.1: Pre-migration preparation (backup all challenge data)
- [ ] 3.2.1: Active challenges & requirements migration
- [ ] 3.3.1: Progress tracking (daily snapshots & weekly breakdowns)
- [ ] 3.4.1: Lifecycle state & history migration
- [ ] 3.5.1: Verification & testing
- [ ] Service refactoring (MonthlyProgressTracker, ChallengeService)

**Expected Results**: 8-15x faster challenge operations, zero race conditions

**Total Time**: 4-6 hours

---

### ⚙️ SEKCE 4: CONFIGURATION LAYER (AsyncStorage Retained)

**Priority**: 🟢 **NÍZKÁ** - Jednoduchá konfigurace **ZŮSTÁVÁ** na AsyncStorage

**Technical Documentation**: @sqlite-migration-phase4-config.md

**What Stays on AsyncStorage** (~21 keys, <25KB total):
- ✅ User preferences (theme, language, home layout)
- ✅ Notification settings & tokens
- ✅ Tutorial completion flags & onboarding state
- ✅ Feature flags & experimental features
- ✅ App metadata & analytics preferences

**Rationale**: AsyncStorage is optimal for simple key-value pairs - faster, simpler, no SQLite overhead needed

**Action Required**: ✅ **NONE** - Keep existing code, no migration

---

**Status**: ✅ **ALL SECTIONS COMPLETE** - Ready for Implementation

**Total Documentation**: 3915 lines across 4 migration phases

**📚 Master Architecture Reference**: @STORAGE-ARCHITECTURE.md (558 lines)
- File-by-file storage mapping (SQLite vs AsyncStorage)
- Implementation patterns & decision tree
- Quick reference table for all features
- Common mistakes to avoid

