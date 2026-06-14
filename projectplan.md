# SelfRise V2 - Project Plan

## ✅ COMPLETED: Pre-Release Production Audit Fixes (2026-06-13)

**Goal**: Implement the 4 MUST-fix + 5 recommended issues from `production-audit-2026-06-10.md` before app store release, plus 2 additional bugs found during re-verification.

- [x] Bod 1 — Split-brain XP transaction read paths (SQLite) + case-mismatch fix in `xp_daily_summary` (daily limits/anti-spam were silently disabled for habit/journal/goal XP)
- [x] Bod 2 — Removed `dropGoalsTables.ts` + `_layout.tsx.bak`
- [x] Bod 3 — DB init retry (3x w/ backoff) + `DatabaseErrorScreen` fallback
- [x] Bod 4 — Fixed root-cause UTC timezone bug in `parseDate`/`isValidDateString` + swept all habit-scheduling `new Date(dateString)` call sites (incl. infinite-loop risk in `userActivityTracker`)
- [x] Bod 5 — `npx tsc --noEmit` 0 errors, full Jest suite green (187/187)
- [x] Bod 7 — `sqlite_migration_state` Firebase telemetry
- [x] Bod 8 — AdBanner hidden during keyboard in Journal
- [x] Bod 9 — Dead code removal (productionMonitoring, optimizedStorage, gamificationCache, weeklyChallengeCleanupService, social components)

**Verification**: tsc 0 errors, 187/187 tests passing, eslint clean (only pre-existing i18next warnings). Git diff: 37 files, +816/-2773.

Full technical details: @implementation-history.md → "Pre-Release Production Audit Fixes (June 13, 2026)"

---

## 📈 PLANNED: Meta Ads & Marketing Analytics Integration

**Goal**: Připravit SelfRise V2 pro běh marketingových kampaní na Meta Ads (Facebook + Instagram) a zároveň začít aktivně sbírat custom eventy do Firebase Analytics pro vlastní reporting.

**Background** (potvrzeno auditem 2026-05-18):
- ✅ Firebase Analytics SDK instalovaný, hook `useFirebaseAnalytics` napojený v `app/_layout.tsx`
- ✅ ATT (App Tracking Transparency) plugin + permission flow funkční
- ✅ SKAdNetwork 48 ID v `app.json` (včetně Meta `v9wttpbfk9`, `n38lu8286q`)
- ✅ AdMob bannery + rewarded ads kompletní – **nekolidují s Meta Ads akvizicí** (různý účel: AdMob = monetizace, Meta Ads = akvizice)
- ⚠️ Žádné custom eventy se zatím nelogují (kromě `app_open` a `att_permission_response`)
- ⚠️ Meta SDK (`react-native-fbsdk-next`) NENÍ nainstalovaný
- ⚠️ Premium tier NENÍ v plánu – Value Optimization eventy v Metě vynechány

---

### 🧑 Část A: Úkoly pro Petra (mimo kód)

Tyto kroky musí Petr udělat v externích nástrojích – kód na nich závisí:

- [ ] **A1. Vytvořit Meta App v Meta for Developers**
  - URL: https://developers.facebook.com/apps/
  - Type: "Consumer"
  - Spojit s bundle ID `com.petrturek.selfrise` (iOS) i Android package `com.petrturek.selfrise`
  - Zapsat si: **Meta App ID** + **Client Token** (App Settings → Basic + Advanced)
- [ ] **A2. Přidat platformy v Meta App Settings**
  - iOS: Bundle ID + App Store ID
  - Android: Package Name + Class Name `com.facebook.react.ReactActivity`
- [ ] **A3. Aktivovat App Events v Meta App Dashboardu**
  - Audience Network nepovolovat (jen pro monetizaci přes Metu – není náš případ)
- [ ] **A4. (Volitelně) Zažádat o Meta Ads MCP open beta**
  - URL: https://mcp.facebook.com/ads
  - Vyžaduje Claude Pro/Max plán
- [ ] **A5. Předat mi Meta App ID + Client Token** → odblokuje Část C

---

### 💻 Část B: Custom Eventy do Firebase (nezávislé na Metě)

Tato část má hodnotu sama o sobě – lepší interní data o chování uživatelů. Lze začít hned.

- [ ] **B1. Vytvořit `src/services/analyticsService.ts`**
  - Sjednocený eventový dispatcher (zatím jen Firebase, později paralelně i Meta)
  - Wrapper kolem `FirebaseAnalytics.logEvent` z existujícího hooku
  - Type-safe event names (TypeScript union type)
- [ ] **B2. Tier 1 eventy – Acquisition signal**
  - `complete_onboarding` – konec tutorialu (Tutorial system)
  - `create_first_habit` – první vytvořený návyk (HabitsContext)
  - `complete_first_habit` – první zaškrtnutí návyku
  - `journal_first_entry` – první zápis do deníku (GratitudeContext)
- [ ] **B3. Tier 2 eventy – Retention signal**
  - `streak_7_days` – sedmidenní streak (deník nebo návyky)
  - `streak_30_days` – třicetidenní streak
  - `goal_completed` – dokončený cíl
  - `monthly_challenge_completed` – splněná měsíční výzva
  - `achievement_unlocked` – odemčený achievement (param `achievement_id`)
- [ ] **B4. Tier 3 eventy – Monetization signal**
  - `rewarded_ad_completed` – sledování rewarded reklamy (AdMob WarmUp)
- [ ] **B5. Ověření v Firebase Console**
  - Dev build, projít tutorialem, založit návyk, zaškrtnout
  - Firebase Console → Analytics → DebugView ověří příchozí eventy

---

### 🔌 Část C: Meta SDK Integrace (blokováno Částí A)

Tato část navazuje na Část A a B. **Blokovaná dokud Petr nedodá Meta App ID + Client Token.**

- [ ] **C1. Instalace `react-native-fbsdk-next`**
  - `npm install react-native-fbsdk-next`
  - Verify kompatibilita s Expo SDK 55 + RN 0.83
- [ ] **C2. Konfigurace pluginu v `app.json`**
  - Přidat `react-native-fbsdk-next` do `plugins` s App ID a Client Tokenem
  - Nastavit `advertiserIDCollectionEnabled`, `autoLogAppEventsEnabled`, `isAutoInitEnabled`
- [x] **C3. Update `NSUserTrackingUsageDescription`** (provedeno preventivně 2026-05-18)
  - Z: "This data helps us keep the app free and show you more relevant ads."
  - Na: "We use this to measure ad performance and personalize your experience. This keeps SelfRise free for everyone."
- [ ] **C4. Rozšířit `analyticsService.ts` o Meta App Events**
  - Paralelní dispatch: jedno `Analytics.track()` → Firebase + Meta zároveň
  - Type-safe mapping interních event names na Meta standard event names
- [ ] **C5. Mapování interních eventů na Meta Standard Events**
  - `complete_onboarding` → `fb_mobile_complete_registration`
  - `create_first_habit` → `fb_mobile_content_view` (custom params)
  - `streak_7_days` → `fb_mobile_achievement_unlocked`
  - `rewarded_ad_completed` → custom event
- [ ] **C6. Expo Prebuild + Native Builds**
  - `npx expo prebuild --clean`
  - iOS test build → ověření v Meta Events Manager Test Events tool
  - Android test build → ověření v Meta Events Manager Test Events tool
- [ ] **C7. Verifikace v Meta Events Manager**
  - Test Events tool zobrazuje příchozí eventy z obou platform
  - App Dashboard → Activity Log bez chyb

---

### 📚 Část D: Dokumentace

- [ ] **D1. Vytvořit `technical-guides:Marketing-Analytics.md`**
  - Architektura `analyticsService`
  - Seznam všech eventů: kdy se triggerují, jaké parametry posílají
  - Dual-dispatch logika (Firebase + Meta)
  - ATT / SKAdNetwork pravidla a důsledky pro attribution
- [ ] **D2. Update `technical-guides:AdMob.md`**
  - Krátká sekce: AdMob (monetizace) vs Meta Ads (akvizice) – nekolidují
  - Sdílený ATT prompt – relevance pro oba systémy

---

### Surgical Scope

- ✅ Žádný stávající kód se nerozbije – jen se rozšiřuje existující `useFirebaseAnalytics` infrastruktura
- ✅ AdMob bannery + rewarded ads zůstávají beze změny
- ✅ Tutorial, Habits, Goals, Journal logika beze změny – pouze přibudou `Analytics.track()` volání na klíčových místech
- ⚠️ `app.json`: nový plugin (Část C2) + úprava ATT permission textu (C3 – hotovo)
- ⚠️ Vyžaduje `expo prebuild --clean` po C2 → reinstall na zařízeních

### Dependencies / Pořadí prací

```
Část A (Petr, externí) ─┐
                        ├─→ Část C (Meta SDK) ─→ Část D (dokumentace)
Část B (Firebase) ──────┘
```

Část B lze začít kdykoliv – je nezávislá. Část C blokovaná Částí A.

---

## 🔎 PLANNED: SelfRiseV2 Code/App Market Value Review

**Goal**: Study the current SelfRiseV2 codebase and provide a realistic current market value estimate for the code/application.

**Approach**:
- [x] Review repository structure, package stack, feature scope, and app maturity.
- [x] Inspect core screens, services, contexts, storage, i18n, monetization, and release readiness indicators.
- [x] Check current market benchmarks for comparable custom mobile app development and codebase/app valuation.
- [x] Estimate value using practical scenarios: replacement cost, codebase sale value, pre-revenue app value, and investor/buyer value.
- [x] Provide the full valuation analysis in chat only, per user request.

**Surgical Scope**: Analysis/documentation only. No production code changes planned.

---

## 🧪 PLANNED: Habits Make-up System Verification

**Goal**: Verify that the Habits Make-up / Smart Bonus Conversion system behaves correctly and matches `technical-guides:Habits.md`.

**Scope**:
- [x] Inspect existing Make-up conversion implementation and current test coverage.
- [x] Run relevant existing tests for habits/conversion logic where available.
- [x] If coverage is missing, add focused unit tests for Make-up conversion only.
- [x] Verify key scenarios: perfect conversion, partial conversion, no cross-week conversion, schedule immutability, habit creation date respect, and completion-rate impact.
- [x] Report results in chat only.

**Surgical Scope**: Tests only unless a real bug is found and user approves implementation changes.

---

## ✅ COMPLETED: Journal & Monthly Challenges Localization (Phase 11 - Parts A & B)

### Part A: Monthly Challenges ✅

**Goal**: Verify and achieve 100% i18n coverage for Monthly Challenges in EN/DE/ES

**Completion Summary**:
- ✅ Comprehensive audit of all 5 Monthly Challenge components
- ✅ Extracted all 28 translation keys used across components
- ✅ Cross-referenced against all 3 locale files (EN/DE/ES)
- ✅ Fixed critical issue: Changed 14 lines in MonthlyChallengeDetailModal.tsx
  - **Root cause**: Component used `t('challenges.detail.*')` keys that didn't exist
  - **Solution**: Corrected to use `t('help.detail.*')` which have full EN/DE/ES coverage
- ✅ Verified: TypeScript compilation with 0 errors
- ✅ **Result**: Monthly Challenges now **100% localized** across all 3 languages

**Files Modified**:
- `src/components/challenges/MonthlyChallengeDetailModal.tsx` (14 lines changed)

---

### Part B: Journal Completion & WarmUp Modals ✅

**Goal**: Fix hardcoded strings in journal celebration modals (3 entries, 1st/5th/10th bonus)

**Root Cause**:
- `CelebrationModal.tsx` used hardcoded English strings for `daily_complete` case
- Hardcoded: "Congratulations! 🎉" and "You've completed your daily journal practice!"
- Bonus milestones (1st/5th/10th) already had correct i18n keys

**Root Cause Analysis**:
1. **First Issue**: Hardcoded strings in component (FIXED in commit 1)
2. **Second Issue**: Wrong i18n key path - used `journal.daily_complete_*` instead of `journal.celebration.daily_complete_*`
   - Keys are nested in `celebration` object in all locale files
   - Component was calling wrong path causing "missingKey" errors in dev logs

**Completion Summary**:
- ✅ Audited `CelebrationModal.tsx` for all celebration types
- ✅ Found all i18n keys existed in EN/DE/ES under **`journal.celebration.*`**:
  - `journal.celebration.daily_complete_title` & `journal.celebration.daily_complete_message` ✅
  - `journal.celebration.bonusMilestone1/5/10_title` & `_text` ✅
- ✅ Fixed: Corrected key paths to include `.celebration` prefix (commit 2)
- ✅ Verified: All 3 languages have complete translations
- ✅ TypeScript compilation: 0 errors

**Files Modified**:
- `src/components/gratitude/CelebrationModal.tsx` (2 commits, 4 lines total changed)
  - Commit 1: Changed hardcoded strings to t() calls
  - Commit 2: Fixed i18n key paths to use `.celebration.` prefix

**Technical Details**: All keys exist in nested `celebration` object:
- Structure: `journal.celebration.{daily_complete_title, daily_complete_message, bonusMilestone1/5/10_*}`
- EN, DE, ES: 100% complete translations

---

### Part C: WarmUp Modal Popup Translations ✅

**Goal**: Fix 4th entry milestone popup and all other WarmUp/StreakWarmUp modals localization

**Root Cause Found**:
- Components used **LOWERCASE** `journal.warmup.modals.*` for i18n keys
- All locale files defined keys with **CAMELCASE** `journal.warmUp.modals.*`
- This inconsistency caused all WarmUp popups to show in English only

**Affected Modals** (18 incorrect references fixed):
1. **WarmUpSuccessModal**: success.title/message/button
2. **WarmUpErrorModal**: error.title/message/button
3. **WarmUpConfirmationModal**: confirmation.title/message/cancel/confirm
4. **WarmUpIssueModal**: issue.title/message/primaryAction/secondaryAction
5. **QuickWarmUpModal**: quickWarmUp.title/message/cancel/confirm

**Completion Summary**:
- ✅ Identified naming convention mismatch (lowercase vs camelCase)
- ✅ Fixed all 18 i18n key references in WarmUpModals.tsx
- ✅ Changed: `journal.warmup.modals.*` → `journal.warmUp.modals.*`
- ✅ Verified: All keys exist in EN/DE/ES with proper translations
- ✅ TypeScript compilation: 0 errors
- ✅ **Result**: All popups now properly localized (4th entry milestone, warm-up dialogs, etc.)

**Files Modified**:
- `src/components/gratitude/WarmUpModals.tsx` (18 lines changed - all modal references)

**Locale Key Structure**:
```
journal.warmUp: {
  modals: {
    success: { title, message, button }
    error: { title, message, button }
    confirmation: { title, message, cancel, confirm }
    issue: { title, message, primaryAction, secondaryAction }
    quickWarmUp: { title, message, cancel, confirm }
  }
}
```

---

## ✅ COMPLETED: COMPREHENSIVE i18n AUDIT & FIX (Phase 11 - Part D)

**Goal**: Achieve TRUE 100% i18n coverage by finding and translating ALL remaining hardcoded user-visible strings

**Fixed User-Visible Strings**:
- ✅ Habits Screen: "Saturday, November 22 0 of 0 completed" - date formatting + count localized
- ✅ Habits Screen: "Mo, Tu, We..." - day abbreviations localized
- ✅ Journal Screen: "Today's Journal Progress" - localized
- ✅ Journal Screen: "X more entries needed" - localized
- ✅ Journal Screen: "Complete ✓" - localized
- ✅ Journal Screen: "Frozen Streak" - fully localized
- ✅ Navigation: "Home", "Trophy Room", all tab/screen titles - localized

**Phases**:
- [x] **Phase 1**: Comprehensive File Scan - Found 40+ hardcoded strings across 10+ files
- [x] **Phase 2**: Categorize Findings - Grouped into 5 categories (journal, navigation, dates, day abbreviations, completion counts)
- [x] **Phase 3**: Create Translation Keys - Added missing keys to i18n.ts type definitions (EN complete)
  - [x] Added `days.shortest.*` (Mo, Tu, We, Th, Fr, Sa, Su)
  - [x] Added `journal.frozenStreak`, `journal.progress.*` (6 keys)
  - [x] Added `common.completed`
  - [x] Added `screens.trophyRoom.title`
  - [x] Updated TypeScript types in i18n.ts
- [x] **Phase 4**: Add Translations - Added DE/ES strings to all 3 locale files
  - [x] German (DE): All new keys translated
  - [x] Spanish (ES): All new keys translated
- [x] **Phase 5**: Update Components - Replaced ALL hardcoded strings with t()
  - [x] DailyGratitudeProgress.tsx (6 strings)
  - [x] HabitItem.tsx, HabitItemWithCompletion.tsx, HabitCalendarView.tsx (day abbreviations)
  - [x] DailyHabitTracker.tsx, DailyHabitProgress.tsx, DailyProgressBar.tsx (completion counts)
  - [x] app/_layout.tsx (navigation titles)
- [x] **Phase 6**: Update Date Utilities - formatDateForDisplay() is now i18n-aware
- [x] **Phase 7**: Verification - TypeScript compilation clean + manual testing passed

**Result**: ✅ **100% i18n coverage achieved** - Zero hardcoded user-visible strings, full EN/DE/ES support across all screens

---

## ✅ COMPLETED: Achievement i18n Migration (100%)

Successfully completed full internationalization of achievement system with German and Spanish translations.

### Phases Completed (6 phases):
- [x] **Phase 1**: Language Settings UI - Added language selector with EN/DE/ES flags
- [x] **Phase 2**: Deep Search Analysis - Analyzed current i18n state (~900 keys, 562 calls)
- [x] **Phase 3**: Achievement Refactoring - Converted 78 achievements to use translation keys (156 keys)
- [x] **Phase 4**: German Translation - Translated all 156 achievement keys to German
- [x] **Phase 5**: Spanish Translation - Translated all 156 achievement keys to Spanish
- [x] **Phase 6**: Testing & QA - User verified all functionality works correctly

### Critical Bug Fixed:
- Fixed i18n configuration where DE/ES locales were not loaded into i18next
- Language switching now works immediately across all languages

### Translation Details:
- **German (DE)**: Professional "du" form, motivational tone, ~30% longer than English
- **Spanish (ES)**: Professional "tú" form, motivational tone, ~25% longer than English
- **Quality**: Consistent terminology, natural phrasing, culturally appropriate

### Files Modified:
- `src/config/i18n.ts` - Added DE/ES locale imports and registration
- `src/locales/de/index.ts` - Added 156 achievement translation keys (330+ lines)
- `src/locales/es/index.ts` - Added 156 achievement translation keys (330+ lines)
- `src/constants/achievementCatalog.ts` - Refactored to use nameKey/descriptionKey
- `app/(tabs)/settings.tsx` - Language selector already implemented
- `i18n-migration-tracker.md` - Detailed documentation of all phases

### Result:
- Users can switch between EN/DE/ES and see achievements in their language
- Language preference persists across app restarts
- Fallback to English for non-translated sections works perfectly
- Zero crashes, stable performance verified by user testing

**Documentation**: See [i18n-migration-tracker.md](i18n-migration-tracker.md) for complete details

---

## ✅ COMPLETED: PRIORITY 4 - Goals Components Theme Integration (100%)

Successfully refactored the final 3 large Goals analytical components to achieve 100% completion of theme integration project.

### Files Refactored (3 files, ~1374 lines total):
- [x] `/src/components/goals/GoalCompletionPredictions.tsx` (~572 lines) - Predictions and insights
- [x] `/src/components/goals/GoalPerformanceDashboard.tsx` (~358 lines) - Performance metrics dashboard
- [x] `/src/components/goals/ProgressTrendAnalysis.tsx` (~444 lines) - Trend analysis with charts

### Changes Applied:
- Added `useTheme` hook import from ThemeContext
- Added `const { colors } = useTheme()` inside each component
- Moved StyleSheet.create inside components (before return statements)
- Replaced all `Colors.text/textSecondary/background` with `colors.*`
- Updated backgrounds: `colors.backgroundSecondary` (page) + `colors.cardBackgroundElevated` (cards)
- Removed all shadow properties (shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation)
- Kept vibrant chart colors (Colors.success, warning, error, primary, info) for data visualization

### Result:
- PRIORITY 4 (Goals Components) - 100% COMPLETE
- All analytical components now support dynamic theming
- Chart colors remain vibrant and colorful for optimal data visualization
- Components ready for Light/Dark theme switching

---

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

### 🛠️ Future Skills Roadmap
Seznam Claude Code skills a MCP serverů pro instalaci v jednotlivých fázích projektu (Wave 1: TEĎ, Wave 2: před Phase 10, Wave 3: post-launch):
**Roadmap:** @future-skills-roadmap.md

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

#### Checkpoint 7.2: App Settings ✅ **COMPLETE**

**Goal**: Implement theme switching (Light/Dark/System) and language preferences

---

- [x] **7.2.1-7.2.3: Dark Theme Implementation** ✅ **COMPLETE** - Full dark theme system with AMOLED-friendly 2-tier color design (#1C1C1E + #2C2C2E), ThemeContext API with system auto-detection, 100% component coverage (all screens, modals, notifications, achievements), consistent header styling, and theme selector UI in Settings. Zero hardcoded structural colors remaining, all gamification accent colors preserved.

- [x] **7.2.4: Language Settings UI** ✅ **COMPLETE** - Functional language selector with 3 languages (🇬🇧 English, 🇩🇪 Deutsch, 🇪🇸 Español), instant switching, theme-aware design (works in Light & Dark mode), AsyncStorage persistence. Partial DE/ES translations created, full translations planned for future. See [i18n-migration-tracker.md](i18n-migration-tracker.md) for migration details.

---

##### **Sub-checkpoint 7.2.4: Language Settings UI** 🌍 ✅ **COMPLETE**

**Tasks**:
- [x] 7.2.4.A: Add Language section to Settings screen
  - Section title: "Language"
  - Language selector with 3 options:
    - 🇬🇧 English
    - 🇩🇪 Deutsch (German)
    - 🇪🇸 Español (Spanish)
  - Visual indicator (checkmark) on active language
  - Instant language switch on selection

- [x] 7.2.4.B: Verify i18n integration
  - Language switching works via `changeLanguage()` function
  - AsyncStorage persistence confirmed (key: `user_language`)
  - UI updates instantly on language change
  - Partial DE/ES translations ready with fallback to EN

**Implementation Summary**:
- Files Modified: [app/(tabs)/settings.tsx](app/(tabs)/settings.tsx:237-282), [src/locales/en/index.ts](src/locales/en/index.ts:663-706)
- Files Created: [src/locales/de/index.ts](src/locales/de/index.ts), [src/locales/es/index.ts](src/locales/es/index.ts)
- Theme Integration: Uses `colors` from ThemeContext - works seamlessly in both Light & Dark modes
- Full migration tracking: See [i18n-migration-tracker.md](i18n-migration-tracker.md)

---

##### **Sub-checkpoint 7.2.5: Testing & QA** ✅ **COMPLETE**

**Testing Checklist**:
- [x] 7.2.5.A: Theme functionality testing
  - [x] Light mode displays correctly on all screens
  - [x] Dark mode displays correctly on all screens
  - [x] System auto mode detects device theme correctly
  - [x] Real-time system theme change updates app immediately
  - [x] Theme preference persists after app restart
  - [x] Theme transitions are smooth (no flashing)
  - [x] All text is readable in both themes (contrast check)
  - [x] Icons, shadows, and borders look good in both themes

- [x] 7.2.5.B: Language functionality testing
  - [x] English translations complete
  - [x] German translations working and complete
  - [x] Spanish translations working and complete
  - [x] Language preference persists after app restart
  - [x] All screens update immediately on language change
  - [x] Modals and toasts show correct language

- [x] 7.2.5.C: Cross-feature testing
  - [x] Test all major screens: Home, Habits, Journal, Goals, Settings
  - [x] Test all modals: Achievement, Level-up, Confirmations
  - [x] Test navigation in both themes
  - [x] Test notifications settings screen
  - [x] Test tutorial reset flow

- [x] 7.2.5.D: Edge cases
  - [x] Switch theme while modal is open
  - [x] Switch language while modal is open
  - [x] Rapid theme switching (no crashes)
  - [x] System theme changes during app usage

**Result**: ✅ All theme and language functionality tested and working perfectly across all screens and use cases.

---

##### **i18n Translation Keys to Add**:

Add to `src/locales/en/index.ts`:
```typescript
settings: {
  // ... existing keys

  // Appearance
  appearance: 'Appearance',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System Auto',
  themeDescription: 'Choose your preferred color scheme',
  themeSystemDescription: 'Matches your device settings',

  // Language
  language: 'Language',
  languageDescription: 'Select your preferred language',
  languageEnglish: 'English',
  languageGerman: 'Deutsch',
  languageSpanish: 'Español',
}
```

---

**Dependencies**: None (all features use existing libraries)

**Estimated Time**: 2-3 hours

**Priority**: High (user experience improvement)

**Notes**:
- T-Qyron theme (Level 20 unlock) planned for future update → See @projectplan-future-updates.md Phase 2.1
- Data Export & Backup moved to future updates → See @projectplan-future-updates.md Phase 3

---

- ~~Data export and backup options~~ → Moved to Future Updates

### Phase 8: External Service Integration Preparation ✅ COMPLETE

#### Checkpoint 8.1: Firebase Configuration ✅
- [x] Firebase project setup and configuration
- [x] Firebase Analytics integration (see Phase 12)
- [x] App Tracking Transparency (ATT) for iOS

#### Checkpoint 8.2: AdMob Integration ✅
**Technical Documentation**: @technical-guides:AdMob.md
- [x] AdMob account setup and ad unit creation
- [x] Ad integration for streak recovery system
- [x] Revenue tracking and analytics

#### Checkpoint 8.3: Analytics & Local Notifications ✅
- [x] Analytics service integration (Firebase Analytics - Phase 12)
- [x] Local notification system (Checkpoint 7.1)
- [x] User engagement tracking (Firebase Analytics)

**Note**: Remote Push Notifications (FCM) moved to Future Updates - not needed for launch

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

**Note**: XP system is manually tested and working correctly - this checkpoint is about creating automated test coverage.

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

### Phase 10: App Store & Google Play Preparation

**Target Platforms**: iOS (App Store) + Android (Google Play)

#### Checkpoint 10.1: Assets & Metadata

**10.1.1: App Icons**
- [ ] Design app icon (1024x1024 master)
- [ ] Generate iOS icon set (all required sizes: 20pt - 1024pt)
- [ ] Generate Android adaptive icon (foreground + background layers)
- [ ] Test icons on both light and dark backgrounds

**10.1.2: Screenshots & Promotional Assets**
- [ ] iOS Screenshots:
  - [ ] iPhone 6.7" (Pro Max) - required
  - [ ] iPhone 6.5" (Plus) - required
  - [ ] iPad Pro 12.9" - required
  - [ ] Capture 5-10 key screens in EN/DE/ES
- [ ] Android Screenshots:
  - [ ] Phone (1080x1920 or higher)
  - [ ] 7" Tablet
  - [ ] 10" Tablet
  - [ ] Capture 4-8 key screens in EN/DE/ES
- [ ] Feature graphic for Google Play (1024x500)
- [ ] Promotional video (optional but recommended)

**10.1.3: App Descriptions & Metadata**
- [ ] App title (max 30 chars) - EN/DE/ES
- [ ] Subtitle/short description - EN/DE/ES
- [ ] Full description - EN/DE/ES
- [ ] Keywords/tags for ASO (App Store Optimization)
- [ ] Categories: Health & Fitness, Productivity
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Support URL and marketing website

**10.1.4: Legal & Compliance**
- [ ] Privacy policy (GDPR compliant)
- [ ] Terms of service
- [ ] Data handling disclosure (App Privacy Details)
- [ ] AdMob compliance documentation

#### Checkpoint 10.2: Build Configuration

**10.2.1: iOS Build Setup**
- [ ] Configure app.json/app.config.js for iOS production
- [ ] Set bundle identifier (com.yourcompany.selfrise)
- [ ] Configure version number and build number
- [ ] Setup signing certificates (Apple Developer account)
- [ ] Configure App Store Connect app record

**10.2.2: Android Build Setup**
- [ ] Configure app.json/app.config.js for Android production
- [ ] Set package name (com.yourcompany.selfrise)
- [ ] Configure versionCode and versionName
- [ ] Generate upload keystore for signing
- [ ] Configure Google Play Console app record

**10.2.3: Production Builds**
- [ ] Build iOS production .ipa with EAS Build
- [ ] Build Android production .aab with EAS Build
- [ ] Verify builds install and run correctly
- [ ] Test critical user flows on both platforms

#### Checkpoint 10.3: Beta Testing

**10.3.1: iOS Beta (TestFlight)**
- [ ] Upload build to TestFlight
- [ ] Configure beta testing groups (internal + external)
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.2: Android Beta (Google Play Internal Testing)**
- [ ] Upload build to Google Play Console
- [ ] Configure internal testing track
- [ ] Invite 5-20 beta testers
- [ ] Collect feedback and crash reports
- [ ] Fix critical issues found in beta

**10.3.3: Beta Testing Checklist**
- [ ] Test on iOS (minimum iOS 13, test on iOS 16+)
- [ ] Test on Android (minimum Android 5, test on Android 11+)
- [ ] Test on different screen sizes (small phone, large phone, tablet)
- [ ] Test all 3 languages (EN/DE/ES)
- [ ] Test both light and dark themes
- [ ] Verify AdMob ads display correctly (test ads only)
- [ ] Verify push notifications work
- [ ] Performance testing (smooth 60fps, no lag)
- [ ] Memory leak testing (no crashes after extended use)

#### Checkpoint 10.4: Final Submission

**10.4.1: App Store Submission (iOS)**
- [ ] Complete App Store Connect metadata
- [ ] Upload final production build
- [ ] Submit for App Review
- [ ] Respond to any review feedback/rejections
- [ ] Release to App Store (manual or automatic)

**10.4.2: Google Play Submission (Android)**
- [ ] Complete Google Play Console metadata
- [ ] Upload final production build to production track
- [ ] Submit for review
- [ ] Respond to any review feedback/rejections
- [ ] Release to Google Play (staged rollout recommended)

**10.4.3: Post-Launch Monitoring**
- [ ] Monitor crash reports (first 24-48 hours critical)
- [ ] Monitor user reviews and ratings
- [ ] Monitor analytics (user acquisition, retention)
- [ ] Prepare hotfix build if critical issues found
- [ ] Plan first update (v1.1) based on user feedback

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
- [x] 1.1.2: SQLite database setup & schema creation ✅
- [x] 1.1.3: Journal data migration with transactions ✅ (163 entries, 14 days streak, 16 payments)
- [x] 1.1.4: Migration verification & integrity tests ✅
- [x] 1.1.5: Update GratitudeStorage service to SQLite ✅
- [x] 1.1.6: Integrate SQLiteGratitudeStorage into app & implement rollback mechanism ✅
- [x] 1.1.7: Integration testing & race condition validation ✅
- [x] 1.2: Habits storage migration ✅ (11 habits, 266 completions, 13 schedule history)
  - [x] 1.2.1: Habits backup & verification
  - [x] 1.2.2: Update Habits SQLite schema
  - [x] 1.2.3: Habits data migration
  - [x] 1.2.4: Create SQLiteHabitStorage service (630 lines)
  - [x] 1.2.5: Integrate into HabitsContext with feature flag
  - [x] 1.2.6: Testing & validation
- [x] 1.3: Goals storage migration ✅ (2 goals, 21 progress records, 0 milestones)
  - [x] 1.3.1: Goals backup & verification (goalsBackup.ts - 171 lines)
  - [x] 1.3.2: Update Goals SQLite schema (description, start_date, progress_type)
  - [x] 1.3.3: Goals data migration (goalsMigration.ts - 241 lines)
  - [x] 1.3.4: Create SQLiteGoalStorage service (880 lines)
  - [x] 1.3.5: Integrate into GoalsContext with feature flag
  - [x] 1.3.6: Schema migration automation (goals.order_index, target_date, goal_progress rebuild)
  - [x] 1.3.7: Testing & validation (create goal, add progress, XP integration)
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
- [x] 2.1: XP transactions & daily tracking migration ✅ (916/923 transactions, 44 level-ups, 81 achievements, 27 unlock events, 51 daily summaries)
  - [x] 2.1.1: Pre-migration preparation (backup, checksums)
  - [x] 2.1.2: XP transactions migration with validation
  - [x] 2.1.3: Daily XP summaries generation
  - [x] 2.1.4: XP state migration with automatic correction
  - [x] 2.1.5: Level-up history migration
  - [x] 2.1.6: Achievement progress & unlock events migration
  - [x] 2.1.7: Verification & data integrity checks
- [x] 2.2: Achievement progress & unlock events migration ✅ (completed in 2.1)
- [x] 2.3: XP multipliers & loyalty state migration ✅ (0 multipliers, no loyalty data - clean migration)
- [x] 2.4: Update gamification services to SQLite ✅
- [x] Final: Testing XP calculations & achievement unlocks ✅ (Goal anti-spam limit fixed, habits XP verified)

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
- [x] 3.1.1: Pre-migration preparation (backup all challenge data) ✅
- [x] 3.2.1: Active challenges & requirements migration ✅
- [x] 3.3.1: Progress tracking (daily snapshots & weekly breakdowns) ✅
- [x] 3.4.1: Lifecycle state & history migration ✅
- [x] 3.5.1: Verification & testing ✅
- [x] 3.6.1: Service refactoring (SQLite storage layer created) ✅

**Migration Results**:
- ✅ All challenge data migrated successfully (2 challenges, 2 requirements, 40 state history, 6 errors)
- ✅ Verification passed (100% data integrity)
- ✅ SQLiteChallengeStorage created (replaces AsyncStorage operations)
- ✅ Feature flag added (USE_SQLITE_CHALLENGES - currently disabled for safety)

**Storage Layer Created**:
- `src/services/storage/SQLiteChallengeStorage.ts` - Complete CRUD operations for:
  - Active challenges & requirements
  - Daily progress snapshots
  - Weekly breakdowns
  - Lifecycle state management
  - User ratings & history

**Service Refactoring Status**: ✅ **COMPLETE**
- ✅ All 3 services refactored with storage adapter pattern
- ✅ Storage adapter checks `USE_SQLITE_CHALLENGES` feature flag
- ✅ Backward compatible - AsyncStorage fallback maintained
- 📊 **Refactored**: 20 AsyncStorage calls across 3 services (5312 lines total)
  - `monthlyChallengeService.ts`: 7 calls ✅ (all have SQLite branches)
  - `monthlyProgressTracker.ts`: 7 calls ✅ (all have SQLite branches)
  - `monthlyChallengeLifecycleManager.ts`: 6 calls ✅ (all have SQLite branches)

**Implementation Completed**:
1. ✅ Refactored 3 services to use storage adapter pattern with `sqliteChallengeStorage`
2. ✅ `USE_SQLITE_CHALLENGES = true` enabled in featureFlags.ts
3. ⏳ Testing all challenge operations (in progress)

**Current Status**: ✅ **PHASE 3 COMPLETE** - All monthly challenges now use SQLite

**Results Achieved**: 8-15x faster challenge operations, zero race conditions, ACID transactions

**Total Time**: 8 hours (Phase 3.1-3.6 complete, services refactored)

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



---

## 🐛 KNOWN ISSUES - Resolved

### ✅ RESOLVED: Habit Statistics Home Screen - Make Up synchronization

**Původní problém**:
V Habit Statistics na Home screenu se po provedení Make Up (bonus completion pokrývající zmeškaný den) nezobrazoval stav správně. I když v jednotlivých kalendářích návyků nebylo červené políčko (zmeškaný den byl pokrytý bonusem), v Home Screen statistikách stále zůstávala červená.

**Řešení**: ✅ Opraveno a otestováno - Make Up logika nyní funguje správně napříč všemi zobrazení (kalendáře i Home Screen statistiky). Synchronizace dat mezi komponentami funguje bez problémů.

**Status**: ✅ RESOLVED - Funkční a otestováno

---

## ✅ COMPLETED: Firebase Analytics + ATT Integration (Phase 12)

**Goal**: Integrate Firebase Analytics with iOS App Tracking Transparency for Google Ads conversion tracking

**Status**: ✅ **COMPLETE** - Awaiting EAS build for final verification

---

### Checkpoint 12.1: Firebase Analytics + ATT Implementation ✅

**Tasks**:
- [x] 12.1.1: Install required packages ✅
  - `@react-native-firebase/app` v23.8.3
  - `@react-native-firebase/analytics` v23.8.3
  - `expo-tracking-transparency` v5.2.4

- [x] 12.1.2: Place Firebase configuration files ✅
  - ✅ `GoogleService-Info.plist` → project root `/`
  - ✅ `google-services.json` → project root `/`
  - ✅ Bundle ID verified: `com.petrturek.selfrise`

- [x] 12.1.3: Update app.json configuration ✅
  - ✅ `@react-native-firebase/app` plugin
  - ✅ `expo-tracking-transparency` plugin
  - ✅ `NSUserTrackingUsageDescription` for ATT dialog
  - ✅ `SKAdNetworkItems` (50 Google Ads network IDs)
  - ✅ `googleServicesFile` paths for iOS/Android
  - ✅ `AD_ID` permission for Android

- [x] 12.1.4: Create Firebase Analytics hook ✅
  - ✅ `src/hooks/useFirebaseAnalytics.ts` (182 lines)
  - ✅ ATT permission request (iOS 14+)
  - ✅ Analytics initialization after ATT
  - ✅ `app_open` event logging
  - ✅ `logEvent()`, `setUserId()`, `setUserProperty()` functions

- [x] 12.1.5: Integrate hook into app startup ✅
  - ✅ Added to `app/_layout.tsx`

- [x] 12.1.6: TypeScript compilation verification ✅

- [ ] 12.1.7: Build & test (USER ACTION - run `eas build`)

**File Structure**:
```
/SelfRiseV2/
├── GoogleService-Info.plist  ← iOS (place here)
├── google-services.json      ← Android (place here)
├── app.json                  ← Will be updated
└── src/hooks/
    └── useFirebaseAnalytics.ts  ← New hook
```

---

## 🎯 AKTUÁLNÍ ÚKOL: Tutorial Spotlight Refaktoring (Skia + Reanimated)

**Cíl**: Přepsat SpotlightEffect.tsx na vysokovýkonné Skia renderování pro profesionální, plynulý tutoriál

**Status**: 📋 PLÁNOVÁNÍ

---

### PHASE 1: Analýza & Příprava ✅ COMPLETE

- [x] 1.1: Analyzovat SpotlightEffect.tsx props a logiku
  - Props: `target`, `action`, `targetId`, `onTargetPress`
  - Animace: `pulseScale`, `spotlightOpacity`, `targetHighlight`
- [x] 1.2: Analyzovat TutorialTargetHelper.ts data strukturu
  - `TargetElementInfo`: x, y, width, height, pageX, pageY
- [x] 1.3: Ověřit babel.config.js pro reanimated plugin
  - ✅ `react-native-reanimated/plugin` již přidán

### PHASE 2: Implementační strategie ✅ COMPLETE

**Vizuální & Technické požadavky:**
- ✅ **Canvas Layer**: Jeden Skia `<Canvas>` přes celou obrazovku (`StyleSheet.absoluteFill`)
- ✅ **Overlay**: Tmavý obdélník (černá, opacity 0.75) přes celou obrazovku
- ✅ **Cutout (Spotlight)**: `BlendMode.dstOut` pro vytvoření "díry" v overlay
- ✅ **Shape**: `RoundedRect` s corner radius 14px (squircle feel)
- ✅ **Soft Edges**: `<BlurMask blur={8} style="normal" />` pro měkké hrany
- ✅ **Padding**: 10px padding kolem targetu pro "dýchání"

**Animace (react-native-reanimated v3):**
- [x] Mapovat `target` props na SharedValues
- [x] `withSpring` pro plynulé přechody pozice (damping: 20, stiffness: 150)
- [x] Spotlight "glide" efekt při změně targetu
- [x] Sophisticated pulse animace (opacity záře 0.3↔0.7 + scale 1.0↔1.08)

**Zachovat kompatibilitu:**
- ✅ Stejné props jako původní komponenta
- ✅ Nenarušit TutorialOverlay.tsx

### PHASE 3: Implementace ✅ COMPLETE

- [x] 3.1: Nainstalovat `@shopify/react-native-skia` (již bylo v projektu v2.0.0-next.4)
- [x] 3.2: Kompletně přepsat SpotlightEffect.tsx
  - [x] Skia Canvas s absoluteFill
  - [x] Dark overlay + RoundedRect cutout s BlendMode.dstOut
  - [x] BlurMask blur={8} pro měkké hrany
  - [x] Reanimated SharedValues pro x, y, width, height
  - [x] withSpring pro plynulé přechody
  - [x] Pulse animace s glow efektem (oranžový rámeček)
- [x] 3.3: Striktní TypeScript typování ✅ (0 errors)
- [x] 3.4: Code review & opravy ✅
  - [x] Odstraněn dead code (TIMING_CONFIG)
  - [x] Přesunuty useDerivedValue z JSX (anti-pattern fix)
  - [x] Přidána entrance fade-in animace (200ms)
  - [x] Přidán Dimensions listener pro rotaci obrazovky
  - [x] Přidán cleanup pro pulse animaci (cancelAnimation)
  - [x] Přidán accessibilityHint
- [ ] 3.5: Testování v aplikaci

**Očekávané výsledky:**
- ✨ Plynulé přechody spotlightu mezi kroky (glide effect)
- ✨ Měkké hrany díky BlurMask
- ✨ Profesionální glow pulse animace
- ✨ 60fps rendering díky Skia GPU akceleraci
- ✨ Squircle tvar (zaoblený obdélník) místo ostrých rohů

**Závislosti:**
```
@shopify/react-native-skia
```

**Soubory k úpravě:**
- `src/components/tutorial/SpotlightEffect.tsx` (kompletní přepis)
- `TutorialOverlay.tsx` (minimální změny - možná žádné)

---

## 🔮 FUTURE UPDATES - Plánované funkce

## ✅ COMPLETED: Monthly Challenge Home Banner Fixed Layout

**Goal**: Upravit první Monthly Challenge banner na Home screenu tak, aby byl pevně usazený, neposouval se horizontálně a celý obsah se vešel na obrazovku telefonu pro marketing screenshoty.

**Scope**: Pouze UI/layout karty v Home sekci Monthly Challenge. Bez změn v progress trackingu, generování výzev, XP, modalech nebo storage.

**Todo**:
- [x] Potvrdit současný problém v `MonthlyChallengeSection.tsx` a `MonthlyChallengeCard.tsx`
- [x] Odstranit horizontální posouvání první Monthly Challenge karty na Home
- [x] Upravit šířku a vnitřní layout karty tak, aby obsah nepřetékal na běžných telefonech
- [x] Zkontrolovat, že tap na kartu stále otevírá detail modal
- [x] Spustit TypeScript kontrolu nebo nejbližší dostupné ověření
- [x] Přidat krátký implementation summary do archive/plan dokumentace

**Brief Review**: První Monthly Challenge karta na Home je nyní pevný full-width card layout bez horizontálního posouvání. Změna je pouze UI/layout, bez zásahu do progress logiky nebo Monthly Challenge dat.

**Technical Guide**: Monthly Challenge UI pravidla a logika: @technical-guides:Monthly-Challenges.md

---

### Data Export & Backup System 💾

**Priority**: Medium | **Complexity**: Medium | **Estimated**: 4-6 hours

**Goal**: Allow users to export, backup, and restore all their app data for safety and portability

**Features**:
- [ ] Export All Data - Download complete backup as JSON file
- [ ] Import Backup - Restore data from backup file
- [ ] Storage Usage Display - Show data size breakdown by category
- [ ] Auto Backup Toggle - Automatic weekly backups
- [ ] Share exported backup across apps (email, cloud storage)

**Technical Implementation**:
- ✅ Backup/restore logic already complete: `src/services/storage/backup.ts`
- ✅ UserSettings type includes `dataBackupEnabled` flag
- ⏳ Need to install: `expo-sharing`, `expo-document-picker`, `expo-file-system`
- ⏳ Need to create: DataExportModal component
- ⏳ Need to integrate: Share API and DocumentPicker for native file operations

**Export Format**:
- File extension: `.selfrise.json`
- Includes: Habits, Goals, Journal, XP data, Achievements, User Settings
- Metadata: Timestamp, app version, migration version, item counts

**User Flow**:
1. User taps "Export Data" → App creates JSON backup
2. Native share sheet opens → User can send via email, save to iCloud/Google Drive
3. User taps "Import Backup" → File picker opens
4. User selects `.selfrise.json` file → Confirmation modal warns about overwrite
5. User confirms → Data restored, success message shown

**Why postponed**:
- Theme and Language are higher priority for user experience
- Export/Backup is "safety net" feature - important but not urgent
- Requires additional native dependencies and testing

**When to implement**:
- After Checkpoint 7.2 (Theme + Language) complete
- Before Phase 10 (App Store launch) - users need backup before going live
