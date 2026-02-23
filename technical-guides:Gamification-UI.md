# 🎨 SelfRise V2 - Gamification UI & Modal System

**🎭 CO TOHLE OBSAHUJE:**
- **Level-up modaly a celebrations** - jak zobrazovat level-up modaly správně
- **XP popup animace** - timing, pozice a vzhled XP popupů
- **Modal priority systém** - jak koordinovat více modalů najednou
- **UI komponenty a hooks** - jak propojit gamifikaci s UI

**🖥️ KDY TOHLE POUŽÍVAT:**
- Implementuješ novou celebration modal
- Upravuješ XP popup animace nebo timing
- Řešíš problémy s více modaly najednou
- Propojuješ gamifikaci s React komponentami

---

## 🏆 Level Overview - Home Screen Display

**Levely zobrazované na Home screenu s jejich barvami a XP požadavky:**

### ⚪ Grey (Beginner) - Levels 1-10
```
1 - Novice I - 100 XP - Grey
2 - Novice II - 250 XP - Grey  
3 - Novice III - 400 XP - Grey
4 - Novice IV - 580 XP - Grey
5 - Novice V - 800 XP - Grey
6 - Beginner I - 1,060 XP - Grey
7 - Beginner II - 1,370 XP - Grey
8 - Beginner III - 1,740 XP - Grey
9 - Beginner IV - 2,180 XP - Grey
10 - Beginner V [MILESTONE] - 2,700 XP - Gold-Orange
```

### 🟢 Green (Growing) - Levels 11-20
```
11 - Learner I - 3,300 XP - Green
12 - Learner II - 3,980 XP - Green  
13 - Learner III - 4,750 XP - Green
14 - Learner IV - 5,620 XP - Green
15 - Learner V - 6,620 XP - Green
16 - Apprentice I - 7,750 XP - Green
17 - Apprentice II - 9,020 XP - Green
18 - Apprentice III - 10,460 XP - Green
19 - Apprentice IV - 12,100 XP - Green
20 - Apprentice V - 13,970 XP - Green
```

### 🔵 Blue (Rare) - Levels 21-40
```
21 - Adept I - 16,100 XP - Blue
22 - Adept II - 18,530 XP - Blue
23 - Adept III - 21,300 XP - Blue
24 - Adept IV - 24,450 XP - Blue
25 - Adept V [MILESTONE] - 28,040 XP - Gold-Orange
26 - Seeker I - 32,100 XP - Blue
27 - Seeker II - 36,770 XP - Blue
28 - Seeker III - 42,120 XP - Blue
29 - Seeker IV - 48,220 XP - Blue
30 - Seeker V - 55,150 XP - Blue
31 - Adventurer I - 63,000 XP - Blue
32 - Adventurer II - 72,000 XP - Blue
33 - Adventurer III - 82,000 XP - Blue
34 - Adventurer IV - 93,500 XP - Blue
35 - Adventurer V - 106,000 XP - Blue
36 - Practitioner I - 120,000 XP - Blue
37 - Practitioner II - 135,000 XP - Blue
38 - Practitioner III - 152,000 XP - Blue
39 - Practitioner IV - 170,000 XP - Blue
40 - Practitioner V - 190,000 XP - Blue
```

### 🟣 Purple (Epic) - Levels 41-60
```
41 - Pathfinder I - 212,000 XP - Purple
42 - Pathfinder II - 236,000 XP - Purple
43 - Pathfinder III - 262,000 XP - Purple
44 - Pathfinder IV - 290,000 XP - Purple
45 - Pathfinder V - 320,000 XP - Purple
46 - Specialist I - 352,000 XP - Purple
47 - Specialist II - 387,000 XP - Purple
48 - Specialist III - 425,000 XP - Purple
49 - Specialist IV - 466,000 XP - Purple
50 - Specialist V [MILESTONE] - 510,000 XP - Gold-Orange
51 - Veteran I - 558,000 XP - Purple
52 - Veteran II - 610,000 XP - Purple
53 - Veteran III - 666,000 XP - Purple
54 - Veteran IV - 726,000 XP - Purple
55 - Veteran V - 791,000 XP - Purple
56 - Expert I - 861,000 XP - Purple
57 - Expert II - 937,000 XP - Purple
58 - Expert III - 1,018,000 XP - Purple
59 - Expert IV - 1,106,000 XP - Purple
60 - Expert V - 1,200,000 XP - Purple
```

### 🟡 Gold (Legendary) - Levels 61-80
```
61 - Guardian I - 1,302,000 XP - Gold
62 - Guardian II - 1,412,000 XP - Gold
63 - Guardian III - 1,530,000 XP - Gold
64 - Guardian IV - 1,657,000 XP - Gold
65 - Guardian V - 1,794,000 XP - Gold
66 - Warden I - 1,941,000 XP - Gold
67 - Warden II - 2,099,000 XP - Gold
68 - Warden III - 2,268,000 XP - Gold
69 - Warden IV - 2,449,000 XP - Gold
70 - Warden V - 2,643,000 XP - Gold
71 - Challenger I - 2,850,000 XP - Gold
72 - Challenger II - 3,071,000 XP - Gold
73 - Challenger III - 3,307,000 XP - Gold
74 - Challenger IV - 3,559,000 XP - Gold
75 - Challenger V [MILESTONE] - 3,828,000 XP - Gold-Orange
76 - Master I - 4,115,000 XP - Gold
77 - Master II - 4,421,000 XP - Gold
78 - Master III - 4,748,000 XP - Gold
79 - Master IV - 5,096,000 XP - Gold
80 - Master V - 5,467,000 XP - Gold
```

### 🔴 Red (Mythic/Exotic) - Levels 81-100
```
81 - Elite I - 5,862,000 XP - Red
82 - Elite II - 6,283,000 XP - Red
83 - Elite III - 6,732,000 XP - Red
84 - Elite IV - 7,211,000 XP - Red
85 - Elite V - 7,722,000 XP - Red
86 - Champion I - 8,267,000 XP - Red
87 - Champion II - 8,848,000 XP - Red
88 - Champion III - 9,467,000 XP - Red
89 - Champion IV - 10,126,000 XP - Red
90 - Champion V - 10,827,000 XP - Red
91 - Grandmaster I - 11,573,000 XP - Red
92 - Grandmaster II - 12,367,000 XP - Red
93 - Grandmaster III - 13,213,000 XP - Red
94 - Grandmaster IV - 14,113,000 XP - Red
95 - Grandmaster V - 15,071,000 XP - Red
96 - Mythic I - 16,091,000 XP - Red
97 - Mythic II - 17,176,000 XP - Red
98 - Mythic III - 18,330,000 XP - Red
99 - Mythic IV - 19,557,000 XP - Red
100 - Mythic V [ULTIMATE MILESTONE] - 20,861,000 XP - Gold-Orange
```

### 🎨 Color System - 6-Tier Motivational Progression
- **Grey (Beginner)**: #9E9E9E-#757575 (levels 1-10)
- **Green (Growing)**: #4CAF50-#66BB6A (levels 11-20) ✨ **NEW**
- **Blue (Rare)**: #2196F3-#00BCD4 (levels 21-40)  
- **Purple (Epic)**: #9C27B0-#673AB7 (levels 41-60)
- **Gold (Legendary)**: #FFD700-#FFC107 (levels 61-80)
- **Red (Mythic/Exotic)**: #F44336-#E91E63 (levels 81-100)
- **Gold-Orange (Milestones)**: #FFD700-#FFA500 (MILESTONE levels: 10, 25, 50, 75, 100)

### 🔧 Components That Change Color Based on Level
**All these UI elements dynamically adapt their colors based on the user's current level:**

#### A) XP Progress Bar Component (`OptimizedXpProgressBar.tsx`)
- **Border**: 2px border around entire component (`rarityBorderColor`)
- **Roman numeral text**: Large serif numeral display
- **Level title text**: Serif level name above numeral
- **Progress bar gradient**: XP fill colors (`progressColors`)
- **Level badge**: Gradient background and border (`badgeColors`)

#### B) Other Level-Dependent Components (Future Implementation)
- Achievement badges and cards
- Habit completion celebrations
- Goal milestone indicators
- Profile level displays
- Leaderboard level indicators
- Any component displaying user progression

#### C) Standard Implementation Pattern
```typescript
// Standard implementation pattern for level-based colors
const getRarityColor = (currentLevel: number): string => {
  if (currentLevel >= 81) return '#F44336'; // Red (Mythic)
  if (currentLevel >= 61) return '#FFD700'; // Gold (Legendary) 
  if (currentLevel >= 41) return '#9C27B0'; // Purple (Epic)
  if (currentLevel >= 21) return '#2196F3'; // Blue (Rare)
  if (currentLevel >= 11) return '#4CAF50'; // Green (Growing)
  return '#9E9E9E'; // Grey (Beginner)
};

// Usage in components:
borderColor: getRarityColor(currentLevel)
```

### 🌱 Motivational Design Logic
- **Grey (1-10)**: First steps, learning basics
- **Green (11-20)**: Growth phase, building momentum - users see progress faster!
- **Blue (21-40)**: Established user, consistent progress
- **Purple (41-60)**: Advanced user, mastering systems
- **Gold (61-80)**: Expert level, exceptional dedication
- **Red (81-100)**: Master level, ultimate achievement

**⚠️ NOTE**: XP values jsou přibližné kalkulace. Milestone levely VŽDY používají Gold-Orange efekt bez ohledu na jejich barevnou fázi.

---

## Centralized Modal Queue System (ModalQueueContext)

### 🎯 FUNDAMENTAL PRINCIPLE
**Centralizovaná fronta s prioritou: Pouze JEDEN `<Modal visible={true}>` v jakýkoli moment. Fronta automaticky řadí podle priority.**

### 🚫 ANTI-CONCURRENT MODAL RULE
**NIKDY se nezobrazují 2 modaly současně! ModalQueueContext to garantuje architektonicky.**

### Priority Hierarchy (ModalPriority enum)
```typescript
enum ModalPriority {
  ACTIVITY_CELEBRATION = 1,  // Journal daily_complete, streak_milestone, bonus_milestone
  GOAL_COMPLETION = 2,       // Goal reaches 100%
  MONTHLY_CHALLENGE = 3,     // Monthly challenge completion, milestone 25/50/75%
  STAR_LEVEL_CHANGE = 4,     // Star promotion/demotion
  MULTIPLIER_ACTIVATION = 5, // XP multiplier activated
  ACHIEVEMENT = 6,           // Achievement unlocked
  LEVEL_UP = 7,              // Level-up celebration (lowest priority)
}
```

### How It Works
1. Component calls `enqueueModal({ type, priority, props })`
2. Queue sorts by priority (lower number = shown first), stable sort by timestamp
3. `ModalRenderer` renders first item as `visible={true}`
4. User closes modal → `closeCurrentModal()` → next in queue shows
5. No flags, no setTimeout race conditions, no iOS freeze

### Usage Example
```typescript
import { useModalQueue, ModalPriority } from '@/src/contexts/ModalQueueContext';

const { enqueue: enqueueModal } = useModalQueue();

// Any component can enqueue
enqueueModal({
  type: 'celebration_bonus_milestone',
  priority: ModalPriority.ACTIVITY_CELEBRATION,
  props: { bonusCount: 5, xpAmount: 50 },
});
```

### User Experience Flow Example
```
User napíše 10. bonus gratitude → triggers achievement + level-up:

1. enqueue: celebration_bonus_milestone (priority 1)
2. enqueue: achievement (priority 6)
3. enqueue: level_up (priority 7)

Queue sorts: [bonus(1), achievement(6), level_up(7)]

User experience:
- 👑 "Tenth Bonus Milestone!" → user closes
- 🏆 "Achievement Unlocked!" → user closes
- 🎉 "Level 16 achieved!" → user closes
- ✅ Perfect sequence, no concurrent modals
```

### Architecture
- **Provider**: `ModalQueueProvider` in `RootProvider.tsx`
- **State**: Single `useState<QueuedModal[]>` sorted by priority
- **Renderer**: `ModalRenderer` switch-case renders correct component
- **Event Bridge**: `closeCurrentModal()` emits `achievementCelebrationClosed` and `star_level_modal_closed`
- **10 modal types** managed: daily_complete, streak_milestone, bonus_milestone, goal_completion, monthly_challenge_completion, monthly_challenge_milestone, star_level_change, multiplier_activation, achievement, level_up

### Anti-Pattern Prevention

#### ❌ FORBIDDEN: Duplicitní Level-up Detection
```typescript
// NIKDY nedělat v screen-specific komponentách:
if (newXP > levelThreshold) {
  enqueueModal({ type: 'level_up', ... }); // ❌ WRONG - causes duplicate modals
}

// Level-up detection POUZE v GamificationService → DeviceEventEmitter → XpAnimationContext.handleLevelUp!
```

#### ❌ FORBIDDEN: Přímé renderování celebration modalů
```typescript
// NIKDY nedělat:
<CelebrationModal visible={showCelebration} /> // ❌ WRONG - bypasses queue

// VŽDY použít:
enqueueModal({ type: '...', priority: ModalPriority.X, props: {} }); // ✅ CORRECT
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
  
  // 3. Enqueue celebration modal
  enqueueModal({ type: 'level_up', priority: ModalPriority.LEVEL_UP, props: eventData });
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

---

## Production Readiness - Memory & Performance

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
    // Modal system: enqueueModal() via ModalQueueContext
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

**UI GOLDEN RULE**: *"One modal at a time, immediate animations, graceful degradation"*