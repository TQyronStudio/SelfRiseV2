# SelfRise V2 - Project Plan

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

## Android Modal Fix Summary (July 18, 2025)

### Root Cause Identified:
**Main Issue:** `DraggableFlatList` from `react-native-draggable-flatlist` causes conflicts with both modals and scrolling on Android.

### Final Solution:
- **Modal Implementation:** Standard React Native `Modal` with `presentationStyle="pageSheet"`
- **List Implementation:** Standard React Native `FlatList` instead of `DraggableFlatList`
- **Trade-off:** Sacrificed drag&drop functionality for modal stability and scrolling

### Key Technical Details:
```typescript
// Working Modal Pattern:
<Modal
  visible={visible}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={onClose}
>
  <SafeAreaView style={styles.container}>
    {/* Modal content */}
  </SafeAreaView>
</Modal>

// Working List Pattern:
<FlatList
  data={activeItems}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  scrollEnabled={false}
  nestedScrollEnabled={true}
/>
```

---

### FINÁLNÍ ŘEŠENÍ: Hybrid ScrollView + DraggableFlatList architektura
✅ **DOKONČENO**: Habits screen scrollování a drag & drop definitivně vyřešeno

#### Finální implementace (po rozsáhlém testování):

**Problém**: Unified DraggableFlatList struktura nefunguje správně s mixed content typy (header, nadpisy, různé habit sekce). DraggableFlatList má problémy s renderováním různých typů obsahu v jednom seznamu.

**Řešení**: Hybrid architektura kombinující ScrollView s vnořeným DraggableFlatList:

#### Současná funkční architektura:

1. **Hlavní kontejner**: ScrollView s `nestedScrollEnabled={true}`
2. **Active Habits sekce**: DraggableFlatList s `scrollEnabled={false}`
3. **Inactive Habits sekce**: Obyčejné mapování bez drag funkcionalit
4. **Header komponenta**: Renderována přímo v ScrollView
5. **Gesture koordinace**: Programové ovládání ScrollView během drag operací

#### Technické detaily současného řešení:

**HabitListWithCompletion.tsx**:
```typescript
// Hybrid přístup: ScrollView s DraggableFlatList pouze pro aktivní návyky
return (
  <ScrollView
    ref={scrollViewRef}
    style={styles.container}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={true}
    nestedScrollEnabled={true} // Řeší VirtualizedList warning
    refreshControl={<RefreshControl />}
  >
    {/* Header */}
    {ListHeaderComponent}

    {/* Active Habits Section with Drag & Drop */}
    {activeHabits.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Habits</Text>
        <DraggableFlatList
          data={activeHabits}
          renderItem={renderActiveHabitItem}
          keyExtractor={(item) => item.id}
          onDragBegin={handleDragBegin}
          onDragEnd={handleActiveDragEnd}
          scrollEnabled={false}
          nestedScrollEnabled={true}
          activationDistance={20}
          dragHitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        />
      </View>
    )}

    {/* Inactive Habits Section - No Drag & Drop */}
    {inactiveHabits.map((habit) => (
      <HabitItemWithCompletion habit={habit} onDrag={undefined} />
    ))}
  </ScrollView>
);
```

**Gesture koordinace**:
```typescript
const handleDragBegin = () => {
  setIsDragging(true);
  // Disable ScrollView scrolling during drag
  scrollViewRef.current?.setNativeProps({ scrollEnabled: false });
};

const handleActiveDragEnd = ({ data }: { data: Habit[] }) => {
  setIsDragging(false);
  // Re-enable ScrollView scrolling after drag
  scrollViewRef.current?.setNativeProps({ scrollEnabled: true });
  // Process reorder
  onReorderHabits(habitOrders);
};
```

#### Současné kompromisy a omezení:

1. **Scrollování při drag**: Během drag operace se ScrollView deaktivuje, takže nelze scrollovat při držení návyku
2. **VirtualizedList warning**: Potlačeno pomocí `nestedScrollEnabled={true}`
3. **Autoscroll nefunguje**: React Native autoscroll pro DraggableFlatList nefunguje ve vnořené struktuře

#### DŮLEŽITÉ POZNÁMKY PRO BUDOUCÍ OPRAVU:

⚠️ **CO NEFUNGUJE A PROČ**:

1. **Unified DraggableFlatList**: Nepodporuje mixed content typy (header + různé sekce + empty state)
   - Problém: DraggableFlatList očekává homogenní data typu, ne heterogenní ListItem typy
   - Symptom: Prázdná obrazovka nebo crash při renderování

2. **ScrollView + DraggableFlatList konflikt**: VirtualizedList warning a gesture konflikty
   - Problém: React Native zakazuje vnořování VirtualizedList do ScrollView
   - Řešení: `nestedScrollEnabled={true}` potlačuje warning, ale nevyřeší gesture konflikty

3. **Autoscroll při drag**: Nefunguje kvůli vnořené struktuře
   - Problém: DraggableFlatList autoscroll parametry (`autoscrollThreshold`, `autoscrollSpeed`) nefungují
   - Workaround: Programové deaktivování ScrollView během drag

#### MOŽNÁ BUDOUCÍ ŘEŠENÍ:

1. **Custom Drag & Drop implementace**: 
   - Použít `react-native-gesture-handler` přímo
   - Implementovat vlastní drag logiku bez DraggableFlatList
   - Plná kontrola nad gestures a scrollováním

2. **Separátní obrazovky**: 
   - Aktivní a neaktivní návyky na samostatných tabech
   - Každá sekce může mít vlastní optimalizovanou strukturu

3. **Refaktoring na FlatList**: 
   - Přepsat celou strukturu na obyčejný FlatList
   - Implementovat drag & drop pomocí gesture handleru
   - Zachovat unified data strukturu

#### KRITICKÉ NASTAVENÍ PRO FUNKČNOST:

1. **DraggableFlatList konfigurace**:
   ```typescript
   scrollEnabled={false}           // MUSÍ být false kvůli konfliktu s ScrollView
   nestedScrollEnabled={true}      // Potlačuje VirtualizedList warning
   activationDistance={20}         // Optimální pro touch handling
   dragHitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
   ```

2. **ScrollView konfigurace**:
   ```typescript
   nestedScrollEnabled={true}      // KRITICKÉ pro potlačení warnings
   ref={scrollViewRef}             // Pro programové ovládání
   ```

3. **Gesture koordinace**:
   ```typescript
   // MUSÍ být implementováno pro eliminaci konfliktů
   onDragBegin: () => scrollViewRef.current?.setNativeProps({ scrollEnabled: false })
   onDragEnd: () => scrollViewRef.current?.setNativeProps({ scrollEnabled: true })
   ```

#### VÝSLEDNÝ STAV:
- ✅ **Všechny návyky viditelné**: Header, aktivní, neaktivní, empty state
- ✅ **Scrollování funguje**: Přes celý obsah (kromě během drag)
- ✅ **Drag & drop funkční**: Pro aktivní návyky s visual feedback
- ✅ **Žádné crashe**: Stabilní architektura
- ⚠️ **Kompromis**: Nelze scrollovat při držení návyku (přijatelné pro UX)

Toto je nejlepší možné řešení vzhledem k omezením React Native a react-native-draggable-flatlist knihovny.

---

## Development Phases

### Phase 1: Foundation & Core Setup
**Goal**: Set up project structure, i18n, and basic navigation

#### Checkpoint 1.1: Project Structure & Dependencies
- [x] Install required dependencies for i18n (react-i18next, expo-localization)
- [x] Set up TypeScript configuration for strict typing
- [x] Configure ESLint and prettier for code consistency
- [x] Create folder structure for components, screens, services, and utils
- [x] Set up constants for colors, fonts, and dimensions

#### Checkpoint 1.2: Internationalization Setup
- [x] Configure react-i18next with proper TypeScript support
- [x] Create translation files structure (en/index.ts, de/index.ts, es/index.ts)
- [x] Set up language detection and persistence
- [x] Create translation keys for all static text
- [x] Implement language switching utility functions

#### Checkpoint 1.3: Navigation & Layout
- [x] Configure bottom tab navigation with proper TypeScript types
- [x] Create tab bar with custom icons and styling
- [x] Set up screen components for all 5 main tabs
- [x] Implement consistent header styling across screens
- [x] Add placeholder content for each screen

### Phase 2: Data Layer & Storage
**Goal**: Implement local data storage and management

#### Checkpoint 2.1: Data Models & Types
- [x] Define TypeScript interfaces for Habit, Gratitude, Goal, and User data
- [x] Create enum types for habit colors, symbols, and days of week
- [x] Define data validation schemas
- [x] Create utility functions for data manipulation
- [x] Set up date handling utilities

#### Checkpoint 2.2: Local Storage Implementation
- [x] Set up AsyncStorage for data persistence
- [x] Create storage service with CRUD operations
- [x] Implement data migration utilities
- [x] Add data backup/restore functionality
- [x] Create storage service with proper error handling

#### Checkpoint 2.3: State Management
- [x] Set up React Context for global state management
- [x] Create providers for Habits, Gratitude, and Goals
- [x] Implement state persistence and rehydration
- [x] Add loading states and error handling
- [x] Create custom hooks for data access

### Phase 3: Habits Feature
**Goal**: Complete habit tracking functionality

#### Checkpoint 3.1: Habit Creation & Management
- [x] Create habit creation form with validation
- [x] Implement color and symbol picker components
- [x] Add habit editing and deletion functionality
- [x] Create habit list component with proper styling
- [x] Implement habit reordering functionality (pending UX redesign)
- [x] Fix placeholder text color and day abbreviations for better UX

#### Checkpoint 3.2: Habit Tracking System
- [x] Create daily habit check-off interface
- [x] Implement scheduled vs unscheduled day tracking
- [x] Add "star" system for bonus completions
- [x] Create habit streak calculation logic
- [x] Implement daily habit reset functionality

#### Checkpoint 3.3: Habit Statistics & Calendar  
- [x] **Refactoring completed**: Sjednocena navigace chart ikon na `/habit-stats` s auto-expansion funkcionalitou

### Phase 4: Journal Feature
**Goal**: Complete universal journal system

#### Current Journal Implementation Analysis

**✅ FULLY COMPLETED AND OPERATIONAL**:
- Complete type definitions in `/src/types/gratitude.ts` with badge system
- Full storage service in `/src/services/storage/gratitudeStorage.ts` with all CRUD operations
- React Context with complete state management in `/src/contexts/GratitudeContext.tsx`
- All required UI components: GratitudeInput, GratitudeList, DailyGratitudeProgress, CelebrationModal
- Functional main screen at `/app/(tabs)/journal.tsx` with full feature set
- Localization support in English (complete), German and Spanish (partial)
- Data utilities for gratitude creation, validation, and migration
- Mysterious badge system (⭐🔥👑) fully implemented and working
- Streak calculations, milestone celebrations, and bonus tracking operational
- All storage methods implemented: getStreakInfo(), getStats(), incrementMilestoneCounter()

**⚠️ MINOR ISSUES (NON-BLOCKING)**:
- TypeScript errors in DailyGratitudeProgress.tsx due to missing Colors constants
- Incomplete German/Spanish translations for advanced features
- No gratitude history/edit functionality (planned for future phases)

**📋 IMPLEMENTATION PLAN**:

#### Checkpoint 4.1: Daily Gratitude Entry ✅ COMPLETED
- [x] Fix missing storage methods (getStreakInfo, getStats) in GratitudeStorage
- [x] Create GratitudeInput component with text validation
- [x] Create DailyGratitudeList component to display today's entries
- [x] Replace gratitude.tsx placeholder with functional daily journal screen
- [x] Implement "Add Gratitude" button with proper form handling
- [x] Add visual indicators for minimum requirement (3/3) and bonus entries
- [x] Fix getCurrentDate import error (use today() function instead)
- [x] Fix VirtualizedList nesting warning (replaced FlatList with map for small daily lists)
- [x] Fix createdAt date serialization issue (proper Date object handling in display)
- [x] Fix number centering in gratitude order circles (use lineHeight for proper vertical alignment)
- [x] Remove second bonus alert and allow bonus gratitudes always
- [x] Add optional hint for bonus gratitudes after completing 3 required entries
- [x] Fix Czech text to English: "volitelné" → "optional" in bonus hint
- [x] Remove clickability from displayed gratitudes (no more TouchableOpacity)
- [x] Add milestone celebration alerts for 1st, 5th, and 10th bonus gratitudes
- [x] Fix bonus gratitude numbering to restart from 1 (instead of continuing 4, 5, 6...)
- [x] Simplify bonus label to show only "BONUS ⭐" (removed GRATITUDE text)
- [x] Add data migration to fix existing gratitudes with old numbering
- [x] Fix isBonus logic in storage service to work with new numbering system
- [x] Fix Date serialization issues in sorting and migration functions
- [x] Add proper sorting by creation time for daily gratitudes display

#### Checkpoint 4.2: Streak System & Gamification ✅ COMPLETED
- [x] Implement streak calculation logic in storage service
- [x] Create celebration modal for completing 3rd gratitude
- [x] Add streak display component with current/longest streak
- [x] Implement milestone celebrations (7, 14, 30+ days)
- [x] Create streak recovery system hooks (for future ad integration)
- [x] Expand milestone system: 21, 50, 75, 100, 150, 200, 250, 365, 500, 750, 1000 days
- [x] Add special celebration texts for key milestones (21, 100, 365, 1000 days)
- [x] Add fallback texts for milestone celebrations and remove unused imports
- [x] Add bonus streak tracking for consecutive days with 4+ gratitudes
- [x] Implement bonus streak celebrations (1, 5, 10 consecutive bonus days)
- [x] Add bonus streak display in DailyGratitudeProgress component
- [x] Redesign bonus system: remove repetitive streak alerts, add mysterious milestone counters (⭐🔥👑)
- [x] **MAJOR TEXT REFACTORING**: Complete overhaul of celebration system for universal "My Journal" concept
  - Replaced all specific gratitude milestone texts with universal journal texts
  - Implemented new milestone system: bonusMilestone1/5/10 and streakMilestone21/100/365/1000
  - Updated all i18n keys from `gratitude.*` to `journal.*`
  - Fixed all missing key errors and syntax issues
  - Created unified celebration system supporting both gratitude and self-praise entries

#### Checkpoint 4.3: Journal History & Advanced Features
- [x] Create journal history screen with date navigation
- [x] Implement edit/delete functionality for journal entries
- [x] Add search functionality for journal content
- [x] Create statistics dashboard (total entries, average per day)
- [x] Implement journal export functionality

**✅ DOKONČENO** - Vyřešeny byly také navigační problémy:
- Opravena trhaná navigace u Journal Statistics screen
- Eliminováno zobrazování "My Journal" textu během přechodu
- Přidána správná konfigurace Stack.Screen v root layout
- Optimalizace Journal Stats screenu pro eliminaci blikání při načítání
- Oprava počítání Entry Types v Journal Statistics (Gratitude/Self-Praise)
- Implementace správného přepočítávání Milestone Badges při mazání záznamů
- Okamžité refreshování UI po mazání/editaci záznamů (History + My Journal)
- Opravena chyba "Property 'state' doesn't exist" v Journal History screenu
- Oprava i18n chyby "bonusMilestonenull_title" v CelebrationModal
- Opravena nekonečná smyčka refreshování - nahrazena explicitní forceRefresh funkcí
- Přidána forceRefresh funkce pro přímé refreshování po mazání/editaci v History
- Implementace barevného rozlišení tlačítek (Gratitude modré, Self-Praise zelené)

### Phase 5: Goals Feature
**Goal**: Complete goal tracking system

#### Checkpoint 5.1: Goal Creation & Management ✅ COMPLETED (July 15, 2025)
- [x] Create goal creation form with validation
- [x] Implement goal editing and deletion
- [x] Add goal categorization system
- [x] Create goal list component
- [x] Implement goal reordering functionality
- [x] Fix missing getGoalStats() method in goalStorage.ts
- [x] Add keyboard handling and automatic scrolling for form inputs
- [x] Implement sectioned display (Active/Completed/Other goals)
- [x] Add progress visualization with progress bars and percentages
- [x] Create comprehensive English localization with form validation messages
- [x] Implement drag & drop reordering using hybrid ScrollView + DraggableFlatList architecture

#### Checkpoint 5.2: Progress Tracking ✅ COMPLETED
- [x] Create progress entry form
- [x] Implement progress bar/slider component
- [x] Add progress history and timeline
- [x] Create progress statistics and analytics
- [x] Implement goal completion celebrations

#### Checkpoint 5.3: Goal Analytics ✅ COMPLETED
- [x] Create goal performance dashboard
- [x] Implement progress trend analysis
- [x] Add goal completion predictions
- [x] Create goal sharing functionality
- [x] Implement goal templates system
- [x] **FIXED**: Insights interpolation bug - replaced single braces {} with double braces {{}} in i18n texts (July 16, 2025)
- [x] **FIXED**: NaN values in Predictions Insights - added proper validation for daysRemaining calculations (July 16, 2025)
- [x] **FIXED**: TypeScript errors in base.ts - fixed readonly arrays assignment issues (July 16, 2025)
- [x] **FEATURE**: Goal Templates pre-fill functionality - templates now pre-populate goal creation form (July 16, 2025)
- [x] **IMPROVEMENT**: Goal Templates description field - removed template descriptions from pre-fill (July 16, 2025)
- [x] **FIXED**: Goal form placeholders visibility - added proper placeholder text color (July 16, 2025)
- [x] **FIXED**: Target Value input glitching - empty field shows correctly instead of "0" (July 16, 2025)
- [x] **FIXED**: Progress form placeholders visibility - added proper placeholder text color (July 16, 2025)
- [x] **FIXED**: Progress Value input glitching - empty field shows correctly instead of "0" (July 16, 2025)
- [x] **MATHEMATICAL FIXES**: Fixed mathematical logic in goal predictions (July 16, 2025)
  - Recent Trend: Now works with 2-3 days of data, compares latest entry with previous average
  - Accelerated Progress: Conservative model requiring 5+ entries, caps acceleration at 2x, requires 20% improvement
  - Average Daily: Now calculates based on unique days with progress, not total days since start
  - Data Thresholds: Shows basic estimates for insufficient data, complex predictions require recent data
  - TypeScript: Updated GoalStats interface with daysWithProgress property
- [x] **TIMELINE STATUS SYSTEM**: Implemented multi-level status system based on estimated vs target completion (July 16, 2025)
  - Way Ahead: >30 days early (blue color)
  - Ahead: 1-30 days early (green color)
  - On Track: ±1 day of target (green color)
  - Behind: 1-30 days late (orange/yellow color)
  - Way Behind: >30 days late (red color)
  - Updated GoalStatsCard.tsx with proper color-coded status display
  - Added translations for all timeline status labels
- [x] **TIMELINE STATUS VERIFICATION**: Comprehensive analysis and critical bug fixes (July 16, 2025)
  - Verified Timeline Status calculation logic is mathematically correct
  - Fixed critical progress sorting bug in getGoalStats method
  - Progress entries now properly sorted chronologically before calculations  
  - Ensures correct results for 'set' progressType goals
  - **MAJOR FIX**: Fixed Czech date format parsing bug in calculateTimelineStatus function
  - Added support for both Czech (DD.MM.YYYY) and ISO (YYYY-MM-DD) date formats
  - Fixed Timeline Status showing "Way Behind" instead of correct "Ahead/Way Ahead" status
  - Timeline Status now reliably calculates estimated completion dates with proper date parsing


### Phase 6: Home Dashboard
**Goal**: Create comprehensive home screen

#### Checkpoint 6.1: Gratitude Streak Display
- [ ] Create daily streak counter component
- [ ] Implement streak visualization
- [ ] Add streak history graph
- [ ] Create streak milestone indicators
- [ ] Implement streak sharing functionality

#### Checkpoint 6.2: Habit Statistics Dashboard
- [ ] Create weekly habit completion chart
- [ ] Implement monthly habit statistics
- [ ] Add interactive chart navigation
- [ ] Create habit performance indicators
- [ ] Implement habit trend analysis

#### Checkpoint 6.3: Home Screen Integration
- [ ] Integrate all dashboard components
- [ ] Add quick action buttons
- [ ] Implement daily motivational quotes
- [ ] Create personalized recommendations
- [ ] Add home screen customization options

### Phase 7: Settings & User Experience
**Goal**: Complete user settings and preferences

#### Checkpoint 7.1: Notification Settings
- [ ] Create notification scheduling interface
- [ ] Implement two daily notification types
- [ ] Add notification message variants (4 per type)
- [ ] Create notification testing functionality
- [ ] Implement notification permission handling

#### Checkpoint 7.2: User Authentication UI
- [ ] Create login/registration forms
- [ ] Implement form validation
- [ ] Add password reset functionality
- [ ] Create user profile management
- [ ] Implement account deletion flow

#### Checkpoint 7.3: App Settings
- [ ] Create app preferences screen
- [ ] Implement data export/import functionality
- [ ] Add app theme customization
- [ ] Create backup/restore interface
- [ ] Implement app reset functionality

### Phase 8: External Service Integration Preparation
**Goal**: Prepare for third-party service integration

#### Checkpoint 8.1: Firebase Integration Prep
- [ ] Create Firebase service structure
- [ ] Implement authentication service interface
- [ ] Create Firestore data sync service
- [ ] Add offline/online state management
- [ ] Create data conflict resolution system

#### Checkpoint 8.2: AdMob Integration Prep
- [ ] Create ad service interface
- [ ] Implement banner ad placeholder components
- [ ] Create rewarded ad service structure
- [ ] Add ad loading and error handling
- [ ] Implement ad-free purchase flow prep

#### Checkpoint 8.3: Analytics & Notifications Prep
- [ ] Create analytics event tracking system
- [ ] Implement push notification service
- [ ] Create user engagement tracking
- [ ] Add crash reporting integration
- [ ] Implement A/B testing framework

### Phase 9: Testing & Quality Assurance
**Goal**: Ensure app quality and reliability

#### Checkpoint 9.1: Unit Testing
- [ ] Set up Jest and React Native Testing Library
- [ ] Create tests for data models and utilities
- [ ] Implement component testing suite
- [ ] Add service layer testing
- [ ] Create integration tests

#### Checkpoint 9.2: E2E Testing
- [ ] Set up Detox for end-to-end testing
- [ ] Create user journey tests
- [ ] Implement performance testing
- [ ] Add accessibility testing
- [ ] Create regression test suite

#### Checkpoint 9.3: Quality Assurance
- [ ] Implement code quality checks
- [ ] Add TypeScript strict mode compliance
- [ ] Create performance optimization
- [ ] Implement memory leak detection
- [ ] Add security vulnerability scanning

### Phase 10: Deployment & Launch Preparation
**Goal**: Prepare for app store deployment

#### Checkpoint 10.1: App Store Preparation
- [ ] Create app icons and splash screens
- [ ] Implement app store metadata
- [ ] Create app store screenshots
- [ ] Add app store description and keywords
- [ ] Implement app versioning system

#### Checkpoint 10.2: Production Build
- [ ] Configure production build settings
- [ ] Implement code obfuscation
- [ ] Add bundle size optimization
- [ ] Create deployment scripts
- [ ] Implement monitoring and logging

#### Checkpoint 10.3: Launch Preparation
- [ ] Create user onboarding flow
- [ ] Implement feature tutorials
- [ ] Add help and support system
- [ ] Create privacy policy and terms
- [ ] Implement feedback collection system

---

## Button Touch Events Fix (July 17, 2025)

### Problem & Solution:
**Issue:** Add buttons stopped working when lists had items (Android)
**Fix:** Separated buttons from scrollable lists using proper layout structure

### Key Architecture:
```typescript
// Working Button Layout:
<SafeAreaView style={{flex: 1}}>
  <View style={styles.addButtonContainer}>
    <TouchableOpacity>Add Button</TouchableOpacity>
  </View>
  <View style={{flex: 1}}>
    <ScrollView>List Content</ScrollView>
  </View>
</SafeAreaView>
```

## Drag&Drop Problém - Brainstorming alternativních řešení (July 18, 2025)

### Aktuální situace:
- ✅ **Modaly fungují perfektně** (standardní React Native Modal s pageSheet)
- ✅ **Scrollování funguje perfektně** (standardní FlatList)
- ❌ **Drag&Drop nefunguje** (DraggableFlatList způsobuje konflikty)

### Alternativní řešení pro Drag&Drop:

#### 1. **Alternativní knihovny**
```typescript
// Možnosti k vyzkoušení:
- react-native-super-grid (s drag&drop)
- react-native-sortable-list
- react-native-gesture-handler (custom implementace)
- react-native-reanimated (s gesture handler)
- @react-native-community/react-native-drag-sort
```

#### 2. **Vlastní implementace s Gesture Handler**
```typescript
// Výhody:
- Plná kontrola nad chováním
- Žádné konflikty s modaly
- Optimalizace pro naše specifické potřeby
- Možnost fine-tuningu pro iOS/Android

// Nevýhody:
- Více práce na implementaci
- Potřeba testování na obou platformách
```

#### 3. **Hybridní přístup - Conditional Drag&Drop**
```typescript
// Drag&Drop pouze při splnění podmínek:
const enableDragDrop = Platform.OS === 'ios' || !hasActiveModals;

return enableDragDrop ? (
  <DraggableFlatList {...props} />
) : (
  <FlatList {...props} />
);
```

#### 4. **Oddělené Drag&Drop módy**
```typescript
// Tlačítko pro přepnutí mezi módy:
- "View Mode" - standardní FlatList, modaly fungují
- "Edit Mode" - DraggableFlatList, modaly dočasně zakázány

// UX: Podobně jako iOS homescreen editing
```

#### 5. **Context Menu řešení**
```typescript
// Dlouhý stisk → kontextové menu s možnostmi:
- "Move Up" / "Move Down"
- "Move to Top" / "Move to Bottom"
- "Edit" / "Delete"

// Alternativa k drag&drop s podobnou funkcionalitou
```

#### 6. **Separátní Reorder Screen**
```typescript
// Dedikovaná obrazovka pro přeuspořádání:
- Hlavní screen: FlatList (stabilní)
- "Reorder" tlačítko → navigace na ReorderScreen
- ReorderScreen: DraggableFlatList (izolovaný)
- Žádné modaly na ReorderScreen
```

#### 7. **Numeric Input řešení**
```typescript
// Číselné input pro pořadí:
- Každá položka má "Order" pole
- Uživatel může zadat číslo pozice
- Automatické přeuspořádání podle čísel
```

#### 8. **Arrow Buttons řešení**
```typescript
// Tlačítka pro pohyb:
- ⬆️ Move Up
- ⬇️ Move Down
- ⏫ Move to Top
- ⏬ Move to Bottom
```

### Doporučené testovací pořadí:

1. **react-native-sortable-list** (rychlé testování)
2. **Vlastní Gesture Handler implementace** (dlouhodobé řešení)
3. **Hybridní přístup** (kompromis)
4. **Context Menu** (alternativní UX)

### Kritéria pro výběr:
- ✅ Kompatibilita s našimi modaly
- ✅ Stabilita na obou platformách
- ✅ Dobrá UX (intuitivní ovládání)
- ✅ Performance (žádné lag)
- ✅ Minimální refaktoring existing kódu

---

## Configuration Keys

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

## Development Guidelines

### Code Standards
- Use TypeScript strict mode
- Follow React Native best practices
- Implement proper error handling
- Use consistent naming conventions
- Add comprehensive JSDoc comments

### Performance Considerations
- Implement lazy loading for screens
- Use React.memo for expensive components
- Optimize images and assets
- Implement proper state management
- Use native modules when necessary

### Accessibility
- Add proper accessibility labels
- Implement keyboard navigation
- Support screen readers
- Use proper color contrast
- Add haptic feedback

### Security
- Implement proper data validation
- Use secure storage for sensitive data
- Implement proper authentication
- Add input sanitization
- Use HTTPS for all API calls

### User Interface & Celebrations
- **CRITICAL**: All celebrations, alerts, notifications, and user feedback throughout the app MUST use the elegant CelebrationModal component design standard
- **NO simple Alert.alert()**: Never use system alerts for important user interactions
- **Consistent styling**: All modals should follow the CelebrationModal pattern with:
  - Large emoji display
  - Styled title and message
  - Beautiful button design
  - Proper spacing and shadows
  - Badge/counter displays when relevant
- **Examples of correct implementation**: 
  - Gratitude completion celebrations (daily_complete, streak_milestone, bonus_milestone)
  - All future habit milestone celebrations
  - Goal achievement notifications
  - App onboarding confirmations
  - Any significant user achievement or feedback

---

## Success Metrics

### Technical Metrics
- App launch time < 2 seconds
- Crash rate < 0.1%
- Memory usage < 100MB
- Battery usage optimization
- 99.9% uptime for data sync

### User Experience Metrics
- Daily active users retention
- Habit completion rates
- Gratitude entry frequency
- Goal achievement rates
- User satisfaction scores

### Business Metrics
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

## Next Steps

1. **Review and Approval**: Wait for stakeholder review and approval of this plan
2. **Development Environment Setup**: Set up development environment and dependencies
3. **Team Alignment**: Ensure all team members understand the plan and requirements
4. **Timeline Planning**: Create detailed timeline with milestones and deadlines
5. **Begin Implementation**: Start with Phase 1 development tasks