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

### Standardized Events Only
```typescript
'xpGained'           // Every XP addition/subtraction
'levelUp'            // Level progression  
'xpBatchCommitted'   // Batched operations complete
'achievementUnlocked' // Achievement triggers

// ❌ FORBIDDEN: Custom XP events
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

## Standard Event Data Structures

### 🚨 FUNDAMENTAL DATA PRINCIPLE
**All gamification events MUST use consistent, typed data structures. Ad-hoc event data is FORBIDDEN.**

### Core Event Data Types
```typescript
// STANDARD XP EVENT DATA STRUCTURE
interface XPEventData {
  amount: number;              // XP amount (positive or negative)
  source: XPSourceType;        // Standardized source enum
  timestamp: number;           // Event creation time
  sourceId?: string;          // Optional: Related entity ID
  description?: string;        // Optional: Human-readable description
  metadata?: Record<string, any>; // Optional: Additional context
}

// LEVEL-UP EVENT DATA STRUCTURE  
interface LevelUpEventData {
  newLevel: number;           // User's new level
  previousLevel: number;      // Previous level  
  levelTitle: string;         // Level display name
  levelDescription?: string;  // Optional level description
  isMilestone: boolean;       // Special milestone level
  timestamp: number;          // Event creation time
  totalXP: number;           // User's total XP
}

// BATCH COMMITTED EVENT DATA STRUCTURE
interface XPBatchEventData {
  totalAmount: number;        // Sum of all XP in batch
  sources: Array<{           // Breakdown by source
    source: XPSourceType;
    amount: number;
    count: number;
  }>;
  leveledUp: boolean;        // Whether batch caused level-up
  newLevel: number;          // Current level after batch
  timestamp: number;         // Batch completion time
}
```

### Event Validation Requirements
```typescript
// MANDATORY EVENT DATA VALIDATION
const validateXPEventData = (eventData: any): boolean => {
  return !!(
    eventData &&
    typeof eventData.amount === 'number' &&
    eventData.source &&
    Object.values(XPSourceType).includes(eventData.source) &&
    typeof eventData.timestamp === 'number'
  );
};

// USE VALIDATION in all event handlers:
const handleXPGained = (eventData: any) => {
  if (!validateXPEventData(eventData)) {
    console.warn('Invalid XP event data:', eventData);
    return; // FAIL GRACEFULLY
  }
  
  // Process valid event
  processXPGain(eventData);
};
```

### Event Emission Standards
```typescript
// STANDARD EVENT EMISSION PATTERN (GamificationService)
const emitXPEvent = (amount: number, source: XPSourceType, options?: any) => {
  const eventData: XPEventData = {
    amount,
    source,
    timestamp: Date.now(),
    sourceId: options?.sourceId,
    description: options?.description,
    metadata: options?.metadata || {},
  };
  
  // Emit standardized event
  DeviceEventEmitter.emit('xpGained', eventData);
  
  // Log for debugging
  console.log(`🎯 XP Event: ${amount} from ${source}`, eventData);
};

// FORBIDDEN: Custom or inconsistent event data
// DeviceEventEmitter.emit('xpGained', { xp: 25, type: 'habit' }); ❌ WRONG
```

---

## Event Handler Naming Conventions

### Standard Event Handler Pattern
```typescript
// STANDARD NAMING PATTERN for gamification event handlers:
handleXPGained(eventData)           // Individual XP gains
handleXPBatchCommitted(eventData)   // Batched XP operations  
handleLevelUp(eventData)           // Level progression events
handleAchievementUnlocked(eventData) // Achievement rewards
handleModalCoordination(eventData)  // Modal priority management

// EVENT HANDLER STRUCTURE:
const handleXPGained = (eventData: any) => {
  // 1. Validate event data
  if (!eventData?.amount || !eventData?.source) return;
  
  // 2. Process event
  showXpPopup(eventData.amount, eventData.source, eventData.position);
  
  // 3. Trigger feedback (haptics, sounds)
  triggerHapticFeedback('light');
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

// 3. Modal Coordination (XpAnimationContext)
console.log(`📊 Modal Flow Tracking:`, {
  event: 'LEVEL_UP_EVENT_RECEIVED',
  modalState: {
    isPrimaryModalActive,
    currentPrimaryModalType,
    pendingSecondaryModals: queue.length
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

### Diagnostic Logging Standards
```typescript
// COMPREHENSIVE ERROR LOGGING for gamification issues
const logGamificationError = (error: any, context: string, data?: any) => {
  console.error(`🚨 Gamification Error - ${context}:`, {
    error: error.message || error,
    stack: error.stack,
    context,
    data: data || {},
    timestamp: new Date().toISOString(),
    userAgent: 'SelfRise Mobile App'
  });
  
  // Optional: Send to crash reporting service
  // crashlytics().recordError(error);
};

// USAGE PATTERN:
const handleXPOperation = async () => {
  try {
    await somXPOperation();
  } catch (error) {
    logGamificationError(error, 'XP Addition Failed', { 
      operation: 'addXP',
      source: 'HABIT_COMPLETION',
      amount: 25 
    });
    
    // Continue without throwing
  }
};
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
   ├── Priority System: Primary vs Secondary modal coordination
   └── Queue Management: Pending secondary modals with timestamps

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

## Recovery Strategies

### Automatic Recovery Patterns
```typescript
// AUTOMATIC RECOVERY PATTERNS
const XPSystemRecovery = {
  // Strategy 1: Retry failed operations
  retryWithBackoff: async (operation: () => Promise<void>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          logGamificationError(error, 'Max retries exceeded');
          return; // Give up gracefully
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  },
  
  // Strategy 2: Queue failed operations for later
  queueFailedOperation: (operation: () => Promise<void>) => {
    // Implementation would store operation in AsyncStorage
    // and retry during next app launch or network recovery
  }
};
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
   │ Primary Modal Active?   │            │ • Enhanced Logging ✓    │
   │ ├─ YES: Queue Modal     │            │ • Error Handling ✓     │
   │ └─ NO: Show Immediately │            │ • State Tracking       │
   └─────────────────────────┘            └─────────────────────────┘
           │                                         │
           ▼                                         ▼
   ┌─────────────────────┐              ┌─────────────────────────┐
   │ Secondary Queue     │              │ Immediate Display       │
   │                     │              │                         │
   │ • Pending Modal     │              │ showLevelUpModal()      │
   │ • Timestamp         │              │ • Enhanced Logging ✓    │
   │ • Wait for Primary  │              │ • Error Handling ✓     │
   │   to finish         │              │ • Haptic Feedback      │
   └─────────────────────┘              │ • Visual Celebration   │
           │                            └─────────────────────────┘
           │ primary modal ends                      │
           ▼                                         ▼
   ┌─────────────────────┐                ┌─────────────────────────┐
   │ Process Queue       │                │ User Sees Modal        │
   │                     │                │                         │
   │ processSecondary    │                │ 🎉 Level 9 Achieved!   │
   │ Modals()           │                │ 'Rising Star'           │
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