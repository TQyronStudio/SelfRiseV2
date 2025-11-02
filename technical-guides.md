# SelfRise V2 Technical Development Guidelines

*A living document for development reference - extracted from projectplan.md*

## Table of Contents

1. [Theme & Color System](#theme--color-system)
2. [Data Storage Architecture](#data-storage-architecture)
3. [Smart Logic Design Guidelines](#smart-logic-design-guidelines)
4. [Development Standards](#development-standards)
5. [Code Standards](#code-standards)
6. [Performance Considerations](#performance-considerations)
7. [User Interface & Celebrations](#user-interface--celebrations)
8. [Security Guidelines](#security-guidelines)
9. [Accessibility Standards](#accessibility-standards)
10. [Configuration Management](#configuration-management)
11. [Technical Stack & Architecture](#technical-stack--architecture)
12. [My Journal System](#my-journal-system)
13. [Gamification System](#gamification-system)
14. [Achievements System](#achievements-system)
15. [Screen Creation Guidelines](#screen-creation-guidelines)
16. [Help Tooltip System](#help-tooltip-system)
17. [Onboarding Tutorial System](#onboarding-tutorial-system)

---

## Theme & Color System

### Philosophy: "Consistent Visual Hierarchy Across All Themes"

SelfRise V2 implements a sophisticated dual-theme system (Light/Dark) with strict color hierarchy standards to ensure consistent user experience across the entire application.

---

### Theme Architecture

**Location**: `src/constants/colors.ts`

**Theme Provider**: `src/contexts/ThemeContext.tsx`

**Supported Themes**:
- **Light Mode**: Clean, bright interface (default)
- **Dark Mode**: AMOLED-friendly pure black base with elevated surfaces
- **System Auto**: Follows device theme settings with real-time updates

---

### Dark Mode Color Hierarchy (Primary Standard)

**Critical Rule**: Dark mode uses a **3-tier elevation system** with pure black base and gray elevated surfaces.

#### Tier 1: Base Layer (Deepest)
```typescript
background: '#000000'  // Pure black (AMOLED-friendly)
```
**Usage**:
- ❌ **RARELY USED** - Only for deepest nested elements for subtle depth
- ⚠️ **NOT for main page backgrounds**
- ✅ Nested elements inside cards (e.g., badges, buttons on elevated cards)

**Example**:
```typescript
// ❌ WRONG - Never use for main containers
<View style={{ backgroundColor: colors.background }}>

// ✅ CORRECT - Only for nested depth
<View style={{ backgroundColor: colors.cardBackgroundElevated }}>
  <View style={{ backgroundColor: colors.background, borderWidth: 1 }}>
    {/* Badge inside card */}
  </View>
</View>
```

#### Tier 2: Elevated Surfaces (Standard Page Background)
```typescript
backgroundSecondary: '#1C1C1E'  // Dark gray - PRIMARY page background
```
**Usage**:
- ✅ **MAIN PAGE BACKGROUNDS** - All screens, modals, full-page containers
- ✅ Tab navigation backgrounds
- ✅ Modal overlays

**Example**:
```typescript
// ✅ CORRECT - Standard pattern for all screens
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,  // #1C1C1E
  },
});
```

**Reference Screens**:
- HomeScreen: Uses `backgroundSecondary` (#1C1C1E)
- Trophy Room: Uses `backgroundSecondary` (#1C1C1E)
- All modal screens: Use `backgroundSecondary` (#1C1C1E)

#### Tier 3: Elevated Cards & Components (Highest Elevation)
```typescript
cardBackgroundElevated: '#2C2C2E'  // Light gray - CARDS and COMPONENTS
```
**Usage**:
- ✅ **ALL CARDS** - Achievement cards, habit cards, goal cards
- ✅ **ELEVATED SECTIONS** - Headers, filters, search bars
- ✅ **INTERACTIVE ELEMENTS** - Buttons, input fields, chips

**Example**:
```typescript
// ✅ CORRECT - Cards on page background
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,  // Page background
  },
  card: {
    backgroundColor: colors.cardBackgroundElevated,  // Card elevation
    borderRadius: 12,
    padding: 16,
  },
  searchBar: {
    backgroundColor: colors.cardBackgroundElevated,  // Interactive element
  },
});
```

---

### Visual Hierarchy Summary

| Element Type | Color | Hex Value | Usage |
|--------------|-------|-----------|-------|
| **Page Background** | `backgroundSecondary` | `#1C1C1E` | Screens, modals, main containers |
| **Cards & Components** | `cardBackgroundElevated` | `#2C2C2E` | Cards, headers, filters, buttons |
| **Nested Depth** | `background` | `#000000` | Rare - only for depth inside cards |

**Visual Example**:
```
┌─────────────────────────────────────┐
│ Screen (#1C1C1E - backgroundSecondary) │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Card (#2C2C2E - elevated)    │  │
│  │                              │  │
│  │  ┌────────────────────────┐  │  │
│  │  │ Badge (#000000)        │  │  │
│  │  └────────────────────────┘  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ Search Bar (#2C2C2E)         │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

### Light Mode Color Hierarchy

**Inverted hierarchy** with white base and gray elevations:

```typescript
background: '#FFFFFF'              // Pure white base
backgroundSecondary: '#F8F9FA'     // Light gray - page backgrounds
cardBackgroundElevated: '#F8F9FA'  // Same as backgroundSecondary
```

**Note**: Light mode uses subtle shadows for elevation instead of background color differences.

---

### Text Color Standards

#### Dark Mode
```typescript
text: '#FFFFFF'           // Primary text - white
textSecondary: '#98989D'  // Secondary text - gray
textTertiary: '#636366'   // Tertiary text - darker gray
```

#### Light Mode
```typescript
text: '#212529'           // Primary text - black
textSecondary: '#6C757D'  // Secondary text - gray
textTertiary: '#ADB5BD'   // Tertiary text - light gray
```

**Usage Rules**:
- Main headings, body text → `colors.text`
- Subtitles, descriptions, labels → `colors.textSecondary`
- Hints, disabled text → `colors.textTertiary`

---

### Semantic Colors (Theme-Independent)

**Status Colors** (stay vivid in both themes):
```typescript
success: '#32D74B'   // Dark mode: brighter green
error: '#FF453A'     // Dark mode: brighter red
warning: '#FFD60A'   // Dark mode: brighter yellow
primary: '#0A84FF'   // Dark mode: brighter blue
```

**Important**: Semantic colors are **more vivid in dark mode** for better visibility against dark backgrounds.

---

### Border & Shadow Standards

#### Dark Mode
```typescript
border: '#38383A'      // Subtle gray borders
shadow: 'transparent'  // NO SHADOWS in dark mode (AMOLED-friendly)
```

**Critical Rule**: ❌ **NEVER use shadows in dark mode**
- Remove ALL: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`
- Use background color hierarchy for depth instead

#### Light Mode
```typescript
border: '#DEE2E6'              // Light gray borders
shadow: 'rgba(0, 0, 0, 0.1)'   // Subtle shadows for depth
```

---

### Theme Implementation Checklist

When creating/refactoring components:

**1. Import Theme Hook**:
```typescript
import { useTheme } from '@/src/contexts/ThemeContext';
const { colors } = useTheme();
```

**2. Move Styles Inside Component**:
```typescript
// ❌ WRONG - Static styles outside component
const styles = StyleSheet.create({...});

// ✅ CORRECT - Dynamic styles inside component
export function Component() {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { backgroundColor: colors.backgroundSecondary }
  });
}
```

**3. Apply Correct Color Hierarchy**:
```typescript
const styles = StyleSheet.create({
  // Main screen background
  container: {
    backgroundColor: colors.backgroundSecondary,  // #1C1C1E
  },

  // Cards and components
  card: {
    backgroundColor: colors.cardBackgroundElevated,  // #2C2C2E
  },

  // Nested elements (rare)
  badge: {
    backgroundColor: colors.background,  // #000000
    borderWidth: 1,
    borderColor: colors.border,
  },
});
```

**4. Remove All Shadows**:
```typescript
// ❌ DELETE these in dark mode
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
```

**5. Use Theme-Aware Text**:
```typescript
<Text style={{ color: colors.text }}>Main Text</Text>
<Text style={{ color: colors.textSecondary }}>Subtitle</Text>
```

---

### Common Mistakes to Avoid

#### ❌ Mistake 1: Using Pure Black for Main Backgrounds
```typescript
// ❌ WRONG
container: {
  backgroundColor: colors.background,  // Pure black - too dark!
}

// ✅ CORRECT
container: {
  backgroundColor: colors.backgroundSecondary,  // #1C1C1E
}
```

#### ❌ Mistake 2: Using White/Black Static Colors
```typescript
// ❌ WRONG
backgroundColor: '#FFFFFF',  // Doesn't adapt to theme
color: '#000000',            // Doesn't adapt to theme

// ✅ CORRECT
backgroundColor: colors.cardBackgroundElevated,
color: colors.text,
```

#### ❌ Mistake 3: Adding Shadows in Dark Mode
```typescript
// ❌ WRONG - Shadows don't work in dark mode
card: {
  backgroundColor: colors.cardBackgroundElevated,
  shadowColor: '#000',
  shadowOpacity: 0.1,
}

// ✅ CORRECT - No shadows, elevation via background only
card: {
  backgroundColor: colors.cardBackgroundElevated,  // Elevation via color
}
```

#### ❌ Mistake 4: Inconsistent Nesting
```typescript
// ❌ WRONG - Pure black card on gray background (backwards)
<View style={{ backgroundColor: colors.backgroundSecondary }}>
  <View style={{ backgroundColor: colors.background }}>  // Too dark!

// ✅ CORRECT - Light gray card on dark gray background
<View style={{ backgroundColor: colors.backgroundSecondary }}>
  <View style={{ backgroundColor: colors.cardBackgroundElevated }}>
```

---

### Reference Implementation

**Perfect Example - HomeScreen**:
```typescript
// app/(tabs)/index.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,  // Main background
  },
});

// Individual card components
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackgroundElevated,  // Elevated card
    borderRadius: 12,
    padding: 16,
  },
});
```

**Perfect Example - Trophy Room**:
```typescript
// app/achievements.tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,  // #1C1C1E
  },
  achievementCard: {
    backgroundColor: colors.cardBackgroundElevated,  // #2C2C2E
  },
});
```

---

### Testing Checklist

Before committing theme changes:

- [ ] **Visual Check**: Compare with HomeScreen appearance
- [ ] **Color Hierarchy**: Page (#1C1C1E) → Cards (#2C2C2E) → Nested (#000000 rare)
- [ ] **No Shadows**: Verify all shadows removed in dark mode
- [ ] **Text Contrast**: All text readable on backgrounds
- [ ] **Theme Toggle**: Test switching between Light/Dark/System modes
- [ ] **Consistency**: All similar components use same colors

---

### Quick Reference

**When in doubt, ask yourself**:

1. **Is this a main page/modal?** → `colors.backgroundSecondary` (#1C1C1E)
2. **Is this a card/component?** → `colors.cardBackgroundElevated` (#2C2C2E)
3. **Is this nested inside a card?** → `colors.background` (#000000) + border
4. **Am I using shadows?** → ❌ Remove in dark mode
5. **Does it match HomeScreen?** → ✅ Visual consistency check

---

## Data Storage Architecture

### Philosophy: "Use the Right Tool for the Right Job"

SelfRise V2 uses a **hybrid storage architecture** combining SQLite for complex data and AsyncStorage for simple preferences.

---

### SQLite Storage (Primary Database)

**Used For**: Complex data with relationships, queries, and transactions

**Migrated Systems** (Phases 1-3 Complete):

#### Phase 1: Core Data (✅ Complete)
- **Journal Entries** (`journal_entries` table)
  - Gratitude entries with text, type, date
  - Streak state (singleton pattern)
  - Warm-up payments
- **Habits** (`habits` table)
  - Habit definitions with schedules
  - Completion tracking with bonus conversion
  - Schedule history timeline
- **Goals** (`goals` table)
  - Goal tracking with milestones
  - Progress history with add/subtract/set operations
  - Category-based organization

#### Phase 2: Gamification (✅ Complete)
- **XP Transactions** (`xp_transactions` table)
  - Time-series XP data with source tracking
  - Daily XP summaries (pre-aggregated)
  - User XP state (singleton)
  - Level-up history
- **Achievements** (`achievement_progress` table)
  - Achievement progress tracking
  - Unlock events history
  - Statistics cache
- **Loyalty System** (`loyalty_state` table)
  - Active days tracking
  - Streak calculations
  - Milestones unlocked

#### Phase 3: Monthly Challenges (✅ Complete)
- **Monthly Challenges** (`monthly_challenges` table)
  - Active challenges with requirements (1:many relationship)
  - Daily progress snapshots (time-series)
  - Weekly breakdowns (5 weeks per challenge)
  - Lifecycle state machine (singleton per month)
  - Challenge history archive
  - Preview generation for next month
  - User ratings tracking

**Performance Benefits**:
- **5-15x faster** than AsyncStorage for complex queries
- **ACID transactions** ensure data consistency
- **Indexed queries** for instant lookups
- **Relational data** with foreign keys

**Example Performance**:
```typescript
// AsyncStorage: ~25ms (parse JSON + filter)
const challenge = JSON.parse(await AsyncStorage.getItem('challenges'))
  .find(c => c.status === 'active');

// SQLite: ~3ms (indexed query)
const challenge = await db.getFirstAsync(
  'SELECT * FROM monthly_challenges WHERE status = ? LIMIT 1',
  ['active']
);
```

---

### AsyncStorage (Configuration Layer)

**Used For**: Simple key-value pairs, preferences, and feature flags

**Retained Systems** (Phase 4 - Intentionally NOT Migrated):

#### 1. User Preferences
```typescript
'user_theme_preference'     // 'light' | 'dark' | 'auto'
'home_preferences'          // Home screen customization
'user_language'             // 'en' | 'de' | 'es'
'i18n_locale'              // Current locale
```

**Why AsyncStorage?**
- ✅ Read on app startup (before SQLite init)
- ✅ Single key reads (2-5ms)
- ✅ No relationships needed
- ✅ Simpler code

#### 2. Notification Settings
```typescript
'notification_settings'     // Notification preferences
'push_notification_token'   // FCM/APNS token
'notification_permissions'  // Permission status
```

**Why AsyncStorage?**
- ✅ Updated infrequently
- ✅ Small data (<1KB)
- ✅ No queries needed

#### 3. Tutorial & Onboarding
```typescript
'tutorial_completed'           // boolean
'tutorial_current_step'        // number
'tutorial_dismissed_hints'     // string[]
'onboarding_completed'         // boolean
'feature_discovery_flags'      // Record<string, boolean>
```

**Why AsyncStorage?**
- ✅ Boolean flags (simplest data)
- ✅ Read once, write once pattern
- ✅ Perfect for feature flags

#### 4. Feature Flags & App State
```typescript
'feature_flags'                // Feature toggles
'experimental_features'        // Beta features
'app_first_launch'            // boolean
'app_version'                 // string
'analytics_enabled'           // boolean
```

**Why AsyncStorage?**
- ✅ Simple booleans/strings
- ✅ Fast reads on startup
- ✅ No user-generated data

#### 5. Authentication Tokens (Future)
```typescript
'firebase_auth_token'         // JWT token
'firebase_refresh_token'      // Refresh token
'user_session'               // Session metadata
```

**Why AsyncStorage?**
- ✅ **SECURITY**: Tokens should NOT be in SQLite (easier to export/leak)
- ✅ Can use secure-store for encryption
- ✅ Standard practice for auth tokens

---

### Feature Flag System

**Location**: `src/config/featureFlags.ts`

All SQLite migrations use feature flags for safe rollback:

```typescript
export const FEATURE_FLAGS = {
  USE_SQLITE_JOURNAL: true,        // Phase 1: Journal
  USE_SQLITE_HABITS: true,         // Phase 1: Habits
  USE_SQLITE_GOALS: true,          // Phase 1: Goals
  USE_SQLITE_GAMIFICATION: true,   // Phase 2: XP, Achievements
  USE_SQLITE_CHALLENGES: true,     // Phase 3: Monthly Challenges
} as const;
```

**Emergency Rollback**:
- Set flag to `false` → App uses AsyncStorage fallback
- All refactored services maintain AsyncStorage code for backward compatibility
- Zero downtime rollback strategy

---

### Decision Matrix: SQLite vs AsyncStorage

| Criteria | SQLite | AsyncStorage |
|----------|--------|--------------|
| **Relationships** | ✅ Foreign keys, JOINs | ❌ Manual linking |
| **Queries** | ✅ Complex WHERE/ORDER BY | ❌ Load all + filter |
| **Transactions** | ✅ ACID guarantees | ❌ No transactions |
| **Performance (complex)** | ✅ 5-15x faster | ❌ Slower |
| **Performance (simple)** | ⚠️ Similar (~2-5ms) | ✅ Fast enough |
| **Code Complexity** | ⚠️ More complex | ✅ Very simple |
| **Security (tokens)** | ❌ Easier to export | ✅ Can encrypt |
| **Startup Dependency** | ❌ Needs init | ✅ Available immediately |

**Rule of Thumb**:
- **Use SQLite**: User-generated data, relationships, queries, time-series data
- **Use AsyncStorage**: Settings, flags, tokens, simple preferences

---

### Migration Timeline

| Phase | System | Status | Migration Date |
|-------|--------|--------|----------------|
| **Phase 1** | Journal, Habits, Goals | ✅ Complete | Oct 2024 |
| **Phase 2** | XP, Achievements, Loyalty | ✅ Complete | Oct 2024 |
| **Phase 3** | Monthly Challenges | ✅ Complete | Oct 26, 2024 |
| **Phase 4** | Configuration (AsyncStorage) | ✅ Documented | Oct 26, 2024 |

**Total Code Migrated**: ~15,000+ lines across 10+ services
**Database Tables**: 25+ tables with proper indexes
**Performance Improvement**: 5-15x faster for complex operations

---

### Implementation Guidelines

**When Adding New Features**:

1. **Ask**: "Is this simple key-value data or complex relational data?"
   - Simple → AsyncStorage
   - Complex → SQLite

2. **Data Characteristics**:
   - **Time-series data** (journal entries, XP transactions) → SQLite
   - **1:many relationships** (goals with milestones, challenges with requirements) → SQLite
   - **Query requirements** (filter by date, status, category) → SQLite
   - **Simple flags/settings** (theme preference, tutorial completed) → AsyncStorage
   - **Auth tokens** → AsyncStorage with encryption

3. **Use Feature Flags**:
   ```typescript
   if (FEATURE_FLAGS.USE_SQLITE_NEW_FEATURE && this.storage) {
     // SQLite implementation
     await this.storage.saveData(data);
     return;
   }
   // AsyncStorage fallback
   await AsyncStorage.setItem(key, JSON.stringify(data));
   ```

4. **Always Provide Rollback**:
   - Keep AsyncStorage code as fallback
   - Test both code paths
   - Document rollback procedure

---

### Related Documentation

- **Phase 3 Details**: See `PHASE3-COMPLETION-CHECKLIST.md`
- **Phase 4 (AsyncStorage Decisions)**: See `sqlite-migration-phase4-config.md`
- **Database Schema**: See `src/services/database/init.ts`

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