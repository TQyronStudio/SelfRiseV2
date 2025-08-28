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

**UI GOLDEN RULE**: *"One modal at a time, immediate animations, graceful degradation"*