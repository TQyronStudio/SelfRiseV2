# ⚡ SelfRise V2 - Gamification Events & Communication

**📡 CO TOHLE OBSAHUJE:**
- **Event systém a standardy** - jaké eventy posílat a jak
- **Event-driven architektura** - jak komponenty komunikují přes eventy
- **Data struktury eventů** - standardizované formáty pro eventy
- **Diagnostic logging** - jak logovat eventy pro debugging

**🔌 KDY TOHLE POUŽÍVAT:**
- Implementuješ novou komponentu co potřebuje XP eventy
- Ladíš komunikaci mezi komponentami
- Řešíš problémy s event listenery
- Debuguješ proč se eventy nezpracovávají

---

## Event System

### Kompletni seznam gamifikacnich eventu (16 eventu)

#### Core XP & Level eventy (4)
```typescript
'xpGained'              // Kazde pridani/odebrani XP → XpAnimationContext, OptimizedXpProgressBar
'levelUp'               // Level-up detekce → XpAnimationContext, OptimizedXpProgressBar
'xpBatchCommitted'      // Batch operace dokoncena → XpAnimationContext
'xpSmartNotification'   // Smart notifikace pro XP → XpAnimationContext
```

#### Achievement eventy (4)
```typescript
'achievementQueueStarting'      // Synchronni pre-registrace pred achievement modaly → XpAnimationContext
'achievementUnlocked'           // Jednotlivy achievement odemcen → AchievementContext
'multipleAchievementsUnlocked'  // Vice achievementu najednou (crescendo razeni) → AchievementContext
'achievementCelebrationClosed'  // Achievement modal zavren → HabitForm, GoalForm (cekaji na zavření)
```

#### XP Multiplier eventy (1)
```typescript
'xpMultiplierActivated'  // Multiplier aktivovan (napr. 1.5x za 4h) → BEZ LISTENERU
```

#### Monthly Challenge eventy (3)
```typescript
'monthly_progress_updated'      // Pokrok vyzvy aktualizovan → index.tsx, MonthlyChallengeSection
'monthly_challenge_completed'   // Vyzva dokoncena → MonthlyChallengeSection (zobrazi modal)
'monthly_milestone_reached'     // Milnik 25/50/75% dosazeny → MonthlyChallengeSection (MilestoneModal)
```

#### Star Rating eventy (3)
```typescript
'star_level_changed'         // Zmena urovne hvezd → MonthlyChallengeSection (StarLevelChangeModal)
'star_progression_updated'   // Aktualizace star progrese → BEZ LISTENERU
'difficulty_recalculated'    // Prepocet obtiznosti → BEZ LISTENERU
```

#### UI/Tutorial eventy (ne-gamifikacni, pro uplnost)
```typescript
'tutorial_scroll_to'         // Scrollovani na pozici v tutorialu
'tutorial_scroll_completed'  // Tutorial krok dokoncen
'openHomeCustomization'      // Otevreni home customization modalu
```

> **Poznamka:** 5 eventu (oznacenych BEZ LISTENERU) se emituje, ale zadna komponenta je neposlouchá. Jsou pripraveny pro budouci UI featury (celebrace milniku, multiplier notifikace, star rating vizualy).

// ❌ FORBIDDEN: Custom XP events
```typescript
'enhanced_xp_awarded' // DEPRECATED - use 'xpGained'
'custom_xp_event'     // FORBIDDEN - use standard events
```

---

## Event-Driven Architecture Principles

### 🚨 FUNDAMENTAL EVENT PRINCIPLE
**Every XP operation MUST emit standardized events. Events enable decoupled, scalable gamification architecture across all app components.**

### Standard Event Emission Patterns
```typescript
// MANDATORY EVENT SEQUENCE for all XP operations
1. Individual operations → 'xpGained' (immediate UI feedback)
2. Batched operations → 'xpBatchCommitted' (animation triggers)  
3. Level detection → 'levelUp' (modal celebrations)
4. Achievement triggers → 'achievementUnlocked' (rewards)

// CONSISTENCY RULE: All events use unified data structures
DeviceEventEmitter.emit('eventName', standardEventData)
```

### Event Emission Requirements
```typescript
// MANDATORY: GamificationService MUST emit events for:
- addXP() operations → 'xpGained' + 'xpBatchCommitted' (if batched)
- subtractXP() operations → 'xpGained' (negative amounts)
- Level progression → 'levelUp' (with complete level data)
- Achievement unlocks → 'achievementUnlocked' (with achievement data)

// EVENT DATA CONSISTENCY: Same structure across all emitters
const eventData = {
  amount: number,
  source: XPSourceType, 
  timestamp: number,
  // Additional context based on event type
}
```

### Global Event Listening Pattern
```typescript
// STANDARD LISTENER SETUP (XpAnimationContext pattern):
useEffect(() => {
  const handleXPGained = (eventData: any) => {
    // Process individual XP gain
  };
  
  const handleBatchCommitted = (eventData: any) => {
    // Process batched XP with animations
  };
  
  const handleLevelUp = (eventData: any) => {
    // Process level-up celebration
  };

  // Register listeners
  const xpGainedSub = DeviceEventEmitter.addListener('xpGained', handleXPGained);
  const batchSub = DeviceEventEmitter.addListener('xpBatchCommitted', handleBatchCommitted);
  const levelUpSub = DeviceEventEmitter.addListener('levelUp', handleLevelUp);
  
  return () => {
    // MANDATORY cleanup
    xpGainedSub?.remove();
    batchSub?.remove();
    levelUpSub?.remove();
  };
}, []);
```

---

## Realna datova struktura eventu

> **Poznamka:** Typy nize NEJSOU TypeScript interfaces v kodu. Jsou to popisy toho, co kod skutecne posila. Handlery pouzivaji `(eventData: any)` a rucne kontroluji pritomnost poli.

### xpGained
Emituje: `gamificationService.triggerXPAnimation()`, `achievementService` (foreground + background)
```typescript
{
  amount: number;              // XP castka (kladna i zaporna)
  source: XPSourceType;        // Enum zdroje XP
  sourceId?: string;           // ID souvisejici entity
  metadata?: Record<string, any>; // Doplnkovy kontext
  position?: { x: number; y: number }; // Souradnice pro popup (default: { x: 50, y: 130 })
  timestamp: number;           // Cas vytvoreni
}
```

### xpSmartNotification
Emituje: `gamificationService.triggerXPAnimation()` (vzdy spolu s xpGained)
```typescript
{
  amount: number;              // XP castka
  source: XPSourceType;        // Enum zdroje XP
  timestamp: number;           // Cas vytvoreni
}
```

### levelUp
Emituje: `gamificationService.addXP()`, `achievementService` (foreground + background)
```typescript
{
  newLevel: number;            // Novy level uzivatele
  previousLevel: number;       // Predchozi level
  levelTitle: string;          // Nazev levelu
  levelDescription: string;    // Popis levelu (prazdny string pokud chybi)
  isMilestone: boolean;        // Zda jde o milnikovy level
  timestamp: number;           // Cas vytvoreni (+ offset pro multi-level-up)
}
```

### xpBatchCommitted
Emituje: `gamificationService.triggerBatchedXPAnimation()`
```typescript
{
  totalAmount: number;         // Celkova XP v batchi
  sources: Array<{            // Rozpad podle zdroju
    source: XPSourceType;
    amount: number;
    count: number;
  }>;
  leveledUp: boolean;          // Zda batch zpusobil level-up
  newLevel: number;            // Aktualni level po batchi
  timestamp: number;           // Cas dokonceni batche
}
```

### achievementQueueStarting
Emituje: `achievementService.triggerAchievementNotifications()`
```typescript
{
  count: number;               // Pocet achievementu ve fronte
  timestamp: number;           // Cas vytvoreni
}
```

### achievementUnlocked
Emituje: `achievementService.triggerAchievementNotifications()` (pro kazdy achievement zvlast)
```typescript
{
  achievement: Achievement;    // Cely achievement objekt
  xpAwarded: number;           // XP odmena za achievement
  timestamp: number;           // Cas vytvoreni
  showCelebration: boolean;    // Zda zobrazit celebraci (vzdy true)
}
```

### multipleAchievementsUnlocked
Emituje: `achievementService.triggerAchievementNotifications()` (po vsech jednotlivych)
```typescript
{
  count: number;               // Pocet achievementu
  totalXP: number;             // Celkove XP za vsechny achievementy
  achievements: Achievement[]; // Vsechny odemcene achievementy
  leveledUp: boolean;          // Zda doslo k level-upu
  newLevel: number;            // Novy level (pokud level-up)
  timestamp: number;           // Cas vytvoreni
}
```

### achievementCelebrationClosed
Emituje: `AchievementContext.handleCelebrationClose()`
```typescript
// Zadna data - pouze signal ze modal byl zavren
```

---

## Event Handler Naming Conventions

### Realne handlery v XpAnimationContext
```typescript
// Skutecne nazvy handleru v kodu:
handleXPGained(eventData)              // xpGained → zobrazeni XP popup
handleSmartNotification(eventData)     // xpSmartNotification → batched notifikace
handleBatchCommitted(eventData)        // xpBatchCommitted → batched XP popup
handleLevelUp(eventData)              // levelUp → level-up modal (async)
handleAchievementQueueStarting(eventData) // achievementQueueStarting → Tier 3 pre-registrace

// PRIKLAD REALNEHO HANDLERU:
const handleXPGained = (eventData: any) => {
  if (eventData && eventData.amount && eventData.source && showXpPopupRef.current) {
    showXpPopupRef.current(eventData.amount, eventData.source, eventData.position);
  }
};
```

---

## Production Readiness - Enhanced Logging

### Enhanced Logging Standards for Level-up Flow
```typescript
// MANDATORY LOGGING PATTERNS for production debugging:

// 1. Level-up Detection (GamificationService)
console.log(`📊 Level-up Flow Tracking:`, {
  event: 'LEVEL_UP_DETECTED',
  previousLevel,
  newLevel, 
  totalXP,
  xpGained,
  source,
  flowId: `levelup_${Date.now()}_${randomId}`
});

// 2. Event Emission (GamificationService)  
console.log(`📊 Modal Flow Tracking:`, {
  event: 'LEVEL_UP_EVENT_EMIT',
  eventData: levelUpEventData,
  timestamp: Date.now()
});

// 3. Modal Coordination (XpAnimationContext) - 4-Tier system
console.log(`📊 Modal Flow Tracking:`, {
  event: 'LEVEL_UP_EVENT_RECEIVED',
  modalState: {
    isActivityModalActive,        // Tier 1
    isMonthlyChallengeModalActive, // Tier 2
    isAchievementModalActive,      // Tier 3
    pendingLevelUpModals: queue.length // Tier 4
  },
  timestamp: Date.now()
});

// 4. Memory Cleanup (cleanupDuplicateLevelUpRecords)
console.log(`📊 Memory Cleanup Results:`, {
  event: 'DUPLICATE_CLEANUP_COMPLETE', 
  originalCount,
  finalCount,
  duplicatesRemoved,
  totalRemoved,
  memoryFreed: `~${estimatedKB}KB`
});
```

---

## Complete Level-up Flow Architecture

### 🚨 FUNDAMENTAL PRODUCTION PRINCIPLE
**Level-up system failures MUST NOT break core app functionality. The system MUST be resilient, observable, and self-healing.**

### Complete Level-up Flow Architecture
```typescript
// COMPLETE LEVEL-UP FLOW (Production-Ready)
1. XP Addition (GamificationService.addXP)
   ├── Enhanced Logging: Level-up detection with flowId tracking
   ├── Error Handling: Graceful degradation on XP operation failures
   └── Event Emission: 'levelUp' with complete metadata

2. Event Processing (XpAnimationContext.handleLevelUp)  
   ├── Enhanced Logging: Modal coordination state tracking
   ├── Error Handling: Modal failures don't break core functionality
   ├── Priority System: 4-Tier modal coordination (Activity → Monthly → Achievement → Level-up)
   └── Queue Management: Pending level-up modals with timestamps

3. Modal Display (showLevelUpModal)
   ├── Enhanced Logging: Modal display lifecycle tracking  
   ├── Error Handling: Display failures don't break level progression
   ├── Haptic Feedback: Milestone vs regular level feedback
   └── Success Confirmation: Modal display completion logging

4. Memory Management (cleanupDuplicateLevelUpRecords)
   ├── Startup Cleanup: Automatic duplicate removal on app initialization
   ├── Enhanced Logging: Memory optimization results tracking
   ├── Error Handling: Cleanup failures don't affect app startup
   └── Performance: Estimated memory freed reporting
```

### Error Recovery & System Resilience
```typescript
// PRODUCTION ERROR HANDLING PATTERNS:

// Pattern 1: XP Operation Resilience  
try {
  await GamificationService.addXP(amount, options);
} catch (error) {
  console.error('🚨 XP operation failed, but core functionality continues:', error);
  // Habit/Journal/Goal operations continue normally
  // User data remains intact
}

// Pattern 2: Modal Display Resilience
try {
  showLevelUpModal(level, title, description, isMilestone);
} catch (error) {
  console.error('🚨 Level-up modal display failed, but XP and app functionality continues:', error);
  console.log('📱 Level progression saved correctly, only celebration visual failed');
}

// Pattern 3: Memory Cleanup Resilience
try {
  await GamificationService.cleanupDuplicateLevelUpRecords();
} catch (error) {
  console.error('🚨 Cleanup failed, but app continues normally:', error);
  // Cleanup will retry on next app launch
}
```

---

## Level-up Architecture Diagram

### 🏗️ COMPLETE SYSTEM ARCHITECTURE
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SelfRise V2 Level-up System Architecture              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   User Actions  │    │   Storage       │    │  Core Services  │    │ UI Systems  │
│                 │    │   Systems       │    │                 │    │             │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────┤
│ • Complete Habit│    │ • AsyncStorage  │    │ Gamification    │    │ XpAnimation │
│ • Journal Entry │───▶│ • XP Transactions│───▶│ Service         │───▶│ Context     │
│ • Goal Progress │    │ • Level History │    │                 │    │             │
│ • Achievements  │    │ • Daily Tracking│    │ • addXP()       │    │ • Modal     │
└─────────────────┘    └─────────────────┘    │ • subtractXP()  │    │   Coordination│
                                              │ • Level Detection│    │ • Event     │
                                              └─────────────────┘    │   Handling  │
                                                                     └─────────────┘

                                    LEVEL-UP FLOW SEQUENCE
                                    ══════════════════════

1. XP ADDITION PHASE:
   ┌───────────────────┐  validateXP()  ┌─────────────────────────┐
   │ User Action       │───────────────▶│ GamificationService.    │
   │ (habit, journal,  │  applyLimits() │ addXP()                 │
   │  goal, etc.)      │◀───────────────│                         │
   └───────────────────┘     store       │ • Enhanced Logging ✓    │
                             result      │ • Error Handling ✓     │
                                        │ • Level Detection       │
                                        └─────────────────────────┘
                                                    │
                                                    │ if levelUp detected
                                                    ▼
2. EVENT EMISSION PHASE:                   ┌─────────────────────────┐
   ┌─────────────────┐                     │ DeviceEventEmitter      │
   │ Level Detection │                     │ .emit('levelUp', {      │
   │ • Previous: 8   │────────────────────▶│   newLevel: 9,          │
   │ • New: 9        │  emit event         │   levelTitle: 'Rising', │
   │ • Is Milestone  │                     │   timestamp: now        │
   └─────────────────┘                     │ })                      │
                                          └─────────────────────────┘
                                                    │
                                                    │ event broadcast
                                                    ▼
3. MODAL COORDINATION PHASE:              ┌─────────────────────────┐
   ┌─────────────────────────┐            │ XpAnimationContext      │
   │ Priority System Check   │◀───────────│ .handleLevelUp()        │
   │                         │            │                         │
   │ Higher Tier Active?  │            │ • Enhanced Logging ✓    │
   │ (Tier 1/2/3)        │            │ • Error Handling ✓     │
   │ ├─ YES: Queue Modal  │            │ • State Tracking       │
   │ └─ NO: Show Now      │            └─────────────────────────┘
   └─────────────────────────┘                      │
           │                                         │
           ▼                                         ▼
   ┌─────────────────────┐              ┌─────────────────────────┐
   │ Tier 4 Queue        │              │ Immediate Display       │
   │                     │              │                         │
   │ • pendingLevelUp    │              │ showLevelUpModal()      │
   │   Modals[]          │              │ • Enhanced Logging ✓    │
   │ • Wait for Tier 1-3 │              │ • Error Handling ✓     │
   │   to finish         │              │ • Haptic Feedback      │
   └─────────────────────┘              │ • Visual Celebration   │
           │                            └─────────────────────────┘
           │ higher tier ends                         │
           ▼                                         ▼
   ┌─────────────────────┐                ┌─────────────────────────┐
   │ Process Queue       │                │ User Sees Modal        │
   │                     │                │                         │
   │ processLevelUp      │                │ 🎉 Level 9 Achieved!   │
   │ Modals()            │                │ 'Rising Star'           │
   │ • Enhanced Logging ✓│                │                         │
   │ • Error Handling ✓ │                │ [Celebration Effects]   │
   │ • Queue Management  │                │ • Haptics              │
   └─────────────────────┘                │ • Visual Animation     │
                                          │ • Success Logging      │
                                          └─────────────────────────┘

                           ERROR HANDLING & RESILIENCE PATTERNS
                           ═══════════════════════════════════

   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │ XP Operation     │  FAIL   │ Graceful         │  FAIL   │ Core App         │
   │ Error            │────────▶│ Degradation      │────────▶│ Continues        │
   │                  │         │                  │         │                  │
   │ • Log Error ✓    │         │ • XP System OFF  │         │ • Habits Work ✓  │
   │ • Don't Throw ✓  │         │ • Modal System   │         │ • Journal Works ✓│
   │ • Continue Flow  │         │   OFF            │         │ • Goals Work ✓   │
   └──────────────────┘         │ • Core Features  │         │ • Settings Work ✓│
                                │   STILL WORK ✓   │         └──────────────────┘
                                └──────────────────┘

   ┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
   │ Modal Display    │  FAIL   │ Level Progression│ SUCCESS │ User Experience  │
   │ Error            │────────▶│ SAVED ✓          │────────▶│                  │
   │                  │         │                  │         │ • XP Added ✓     │
   │ • Log Error ✓    │         │ • XP Stored ✓    │         │ • Level Up ✓     │
   │ • Don't Break    │         │ • Progress Valid │         │ • Visual Failed  │
   │   Level Progress │         │ • Only Visual    │         │   (But User Knows│
   └──────────────────┘         │   Failed         │         │   They Leveled)  │
                                └──────────────────┘         └──────────────────┘
```

---

## Developer Integration Checklist

**When Adding New XP Sources:**
```typescript
// ✅ REQUIRED STEPS:
1. Use ONLY GamificationService.addXP() - NO direct XP manipulation
2. Include proper XPSourceType enum value
3. Add error handling with graceful degradation
4. Test both positive and negative XP scenarios (reversal)
5. Verify daily limits are respected
6. Test level-up modal priority with other active modals

// ✅ IMPLEMENTATION TEMPLATE:
const awardXPForNewFeature = async (amount: number, sourceId: string) => {
  try {
    await GamificationService.addXP(amount, {
      source: XPSourceType.NEW_FEATURE,
      sourceId,
      description: 'New feature completion'
    });
  } catch (error) {
    console.error('XP award failed, but feature continues:', error);
    // Feature functionality continues normally
  }
};
```

**When Modifying Level-up Flow:**
```typescript
// 🚨 CRITICAL REQUIREMENTS:
1. Maintain backward compatibility with existing modal coordination
2. Add enhanced logging for all new steps
3. Include error handling with graceful degradation  
4. Test with multiple simultaneous XP sources
5. Verify cleanup integration doesn't break on startup
6. Test modal priority system with rapid level-ups

// 🛡️ TESTING REQUIREMENTS:
- Level-up with active primary modal (Journal milestone)
- Level-up with no competing modals
- Multiple level-ups in rapid succession
- System failure recovery (XP service down, modal crashes)
- Memory cleanup on app startup (with corrupted data)
```

---

**EVENT GOLDEN RULE**: *"Standard events only, structured data, graceful failures, comprehensive logging"*