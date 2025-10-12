### ⚙️ SEKCE 4: CONFIGURATION LAYER (AsyncStorage Retained)

**Priority**: 🟢 **NÍZKÁ** - Jednoduchá konfigurace **ZŮSTÁVÁ** na AsyncStorage

**Philosophy**: "Use the right tool for the right job"
- **SQLite**: Complex data with relationships, transactions, queries
- **AsyncStorage**: Simple key-value pairs, preferences, flags

---

## 📋 WHAT STAYS ON ASYNCSTORAGE

SEKCE 4 není migrace - je to dokumentace toho, co **ZÁMĚRNĚ zůstává** na AsyncStorage, protože je to pro tyto případy **rychlejší a jednodušší**.

---

### 🎯 CATEGORY 1: USER PREFERENCES

**Storage Keys:**
```typescript
// Theme & Display
'user_theme_preference'              // 'light' | 'dark' | 'auto'
'home_preferences'                   // Home screen customization

// Language & Localization
'user_language'                      // 'en' | 'de' | 'es'
'i18n_locale'                        // Current i18n locale
```

**Why AsyncStorage?**
- ✅ Single key reads (2-5ms)
- ✅ Read on app startup (before SQLite init)
- ✅ No relationships needed
- ✅ Simpler API for simple data

**Data Structures:**
```typescript
interface HomePreferences {
  showStreakCard: boolean;
  showHabitStats: boolean;
  showQuickActions: boolean;
  layoutOrder: string[];
}

// Simple string values
type Theme = 'light' | 'dark' | 'auto';
type Language = 'en' | 'de' | 'es';
```

**Performance:**
- AsyncStorage read: ~3ms
- SQLite read: ~2ms
- **Difference: 1ms** (negligible for startup)
- **Benefit: Simpler code, no SQLite dependency**

---

### 🔔 CATEGORY 2: NOTIFICATION SETTINGS

**Storage Keys:**
```typescript
// Notification Configuration
'notification_settings'              // Notification preferences
'push_notification_token'            // FCM/APNS token
'notification_permissions'           // Permission status
```

**Why AsyncStorage?**
- ✅ Updated infrequently (only on settings change)
- ✅ Small data size (<1KB)
- ✅ No queries needed
- ✅ Direct key access pattern

**Data Structures:**
```typescript
interface NotificationSettings {
  enabled: boolean;
  habitReminders: boolean;
  journalReminders: boolean;
  goalReminders: boolean;
  challengeReminders: boolean;
  reminderTimes: {
    morning: string;    // "08:00"
    evening: string;    // "20:00"
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}
```

**Performance:**
- Read frequency: Once per app launch
- Write frequency: Rarely (user changes settings)
- **Conclusion: AsyncStorage is perfect here**

---

### 🎓 CATEGORY 3: TUTORIAL & ONBOARDING

**Storage Keys:**
```typescript
// Tutorial State
'tutorial_completed'                 // boolean
'tutorial_current_step'              // number
'tutorial_dismissed_hints'           // string[]
'onboarding_completed'               // boolean
'feature_discovery_flags'            // Record<string, boolean>
```

**Why AsyncStorage?**
- ✅ Boolean flags (simplest data type)
- ✅ Read once, write once pattern
- ✅ No relationships
- ✅ Perfect for feature flags

**Data Structures:**
```typescript
interface TutorialState {
  completed: boolean;
  currentStep: number;
  dismissedHints: string[];
  lastShownAt: Date;
}

interface FeatureDiscovery {
  'home-streak-card': boolean;
  'habits-bonus-feature': boolean;
  'challenges-preview': boolean;
  'goals-milestones': boolean;
}
```

**Migration Impact:**
- **Before**: ~30 tutorial-related reads on app launch
- **After**: Same (no change)
- **Reason**: Tutorial system works perfectly with AsyncStorage

---

### 🚩 CATEGORY 4: FEATURE FLAGS & APP STATE

**Storage Keys:**
```typescript
// Feature Flags
'feature_flags'                      // Feature toggles
'experimental_features'              // Beta features enabled

// App State
'app_first_launch'                   // boolean
'app_version'                        // string
'last_app_update'                    // timestamp
'analytics_enabled'                  // boolean
'crash_reporting_enabled'            // boolean
```

**Why AsyncStorage?**
- ✅ Simple booleans and strings
- ✅ Changed by developers/remote config
- ✅ No user-generated data
- ✅ Fast reads on startup

**Data Structures:**
```typescript
interface FeatureFlags {
  enableMonthlyChallenges: boolean;
  enableSocialSharing: boolean;
  enableAdvancedAnalytics: boolean;
  betaFeaturesEnabled: boolean;
}

interface AppMetadata {
  firstLaunchDate: string;
  currentVersion: string;
  lastUpdateDate: string;
  installationId: string;
}
```

---

### 🔐 CATEGORY 5: AUTHENTICATION & TOKENS (Future)

**Storage Keys (for future Firebase integration):**
```typescript
'firebase_auth_token'                // JWT token
'firebase_refresh_token'             // Refresh token
'user_session'                       // Session metadata
```

**Why AsyncStorage?**
- ✅ Security: Tokens should NOT be in SQLite (easier to export)
- ✅ Encryption: Can use secure-store for sensitive data
- ✅ Persistence: Survives app reinstalls
- ✅ Standard practice for auth tokens

**Note**: This is for **future** Firebase integration, not currently implemented.

---

## 📊 ASYNCSTORAGE RETENTION SUMMARY

| Category | Keys | Total Size | Read Frequency | Why AsyncStorage? |
|----------|------|------------|----------------|-------------------|
| User Preferences | 4 | <5KB | App startup | Simple KV, no relationships |
| Notifications | 3 | <2KB | Infrequent | Small, infrequent updates |
| Tutorial/Onboarding | 5 | <3KB | Once | Boolean flags, feature discovery |
| Feature Flags | 6 | <1KB | App startup | Developer-controlled, not user data |
| Auth (future) | 3 | <10KB | Every request | Security best practice |
| **TOTAL** | **~21 keys** | **<25KB** | **Startup + rare** | **Perfect for AsyncStorage** |

---

## 🎯 DECISION CRITERIA: ASYNCSTORAGE VS SQLITE

Use **AsyncStorage** when:
- ✅ Simple key-value pairs (no relationships)
- ✅ Small data (<10KB per key)
- ✅ Infrequent writes
- ✅ No queries needed (direct key access)
- ✅ Boolean flags or enums
- ✅ Read on app startup (before SQLite init)

Use **SQLite** when:
- ✅ Complex data structures with relationships
- ✅ Large datasets (100+ records)
- ✅ Frequent writes (daily/hourly)
- ✅ Need queries, filters, sorting
- ✅ Time-series data
- ✅ Transaction safety required (ACID)
- ✅ Data grows unbounded

---

## 📦 CONFIGURATION SERVICE ARCHITECTURE

**Recommended Pattern:**

```typescript
// ConfigurationService.ts - Stays on AsyncStorage
export class ConfigurationService {

  // User Preferences
  static async getTheme(): Promise<Theme> {
    const theme = await AsyncStorage.getItem('user_theme_preference');
    return (theme as Theme) || 'auto';
  }

  static async setTheme(theme: Theme): Promise<void> {
    await AsyncStorage.setItem('user_theme_preference', theme);
  }

  // Language
  static async getLanguage(): Promise<Language> {
    const lang = await AsyncStorage.getItem('user_language');
    return (lang as Language) || 'en';
  }

  static async setLanguage(language: Language): Promise<void> {
    await AsyncStorage.setItem('user_language', language);
    // Trigger i18n update
    i18n.locale = language;
  }

  // Notifications
  static async getNotificationSettings(): Promise<NotificationSettings> {
    const stored = await AsyncStorage.getItem('notification_settings');
    return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATION_SETTINGS;
  }

  static async setNotificationSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
  }

  // Tutorial
  static async isTutorialCompleted(): Promise<boolean> {
    const completed = await AsyncStorage.getItem('tutorial_completed');
    return completed === 'true';
  }

  static async setTutorialCompleted(completed: boolean): Promise<void> {
    await AsyncStorage.setItem('tutorial_completed', completed.toString());
  }

  // Feature Flags
  static async isFeatureEnabled(feature: string): Promise<boolean> {
    const flags = await AsyncStorage.getItem('feature_flags');
    const parsed = flags ? JSON.parse(flags) : {};
    return parsed[feature] === true;
  }

  static async setFeatureFlag(feature: string, enabled: boolean): Promise<void> {
    const flags = await AsyncStorage.getItem('feature_flags');
    const parsed = flags ? JSON.parse(flags) : {};
    parsed[feature] = enabled;
    await AsyncStorage.setItem('feature_flags', JSON.stringify(parsed));
  }
}
```

---

## 🔄 NO MIGRATION NEEDED

**Important**: SEKCE 4 **není migrace** - tyto data **zůstávají** na AsyncStorage.

**Actions Required:**
- ✅ **NONE** - Keep existing AsyncStorage code
- ✅ Document which keys stay on AsyncStorage (this file)
- ✅ Ensure no conflicts with SQLite migration
- ✅ Update architecture docs to reflect dual-storage approach

**Post-Migration Architecture:**
```
┌─────────────────────────────────────────┐
│         SelfRise Application            │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │ AsyncStorage │    │    SQLite    │ │
│  │  (Config)    │    │  (User Data) │ │
│  └──────────────┘    └──────────────┘ │
│        │                    │          │
│        ├─ Preferences       ├─ Habits  │
│        ├─ Notifications     ├─ Journal │
│        ├─ Tutorial Flags    ├─ Goals   │
│        ├─ Feature Flags     ├─ XP/Achievements │
│        └─ App Metadata      └─ Challenges │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ BENEFITS OF DUAL-STORAGE APPROACH

**1. Performance Optimization**
- Config reads: 3ms (AsyncStorage) vs 2ms (SQLite) - negligible
- No SQLite connection needed for startup config
- Faster app initialization

**2. Simplicity**
- AsyncStorage API is simpler for key-value pairs
- No SQL queries for boolean flags
- Less code complexity

**3. Security**
- Auth tokens stay separate from user data
- Easier to implement secure storage for sensitive data
- SQLite database can be exported without exposing tokens

**4. Maintainability**
- Clear separation of concerns
- Config changes don't require database migrations
- Feature flags can be toggled without data model changes

**5. Reliability**
- Config survives database corruption
- Can reset SQLite without losing preferences
- Independent storage systems reduce single point of failure

---

## 📋 VERIFICATION CHECKLIST

After SQLite migration (SEKCE 1-3), verify AsyncStorage keys:

**Still Working:**
- [ ] Theme preference loads correctly
- [ ] Language setting persists
- [ ] Home screen preferences respected
- [ ] Notification settings functional
- [ ] Tutorial state preserved
- [ ] Feature flags work as expected

**No Conflicts:**
- [ ] No AsyncStorage keys accidentally migrated to SQLite
- [ ] No duplicate data in both storage systems
- [ ] Clear documentation of what's where

**Performance:**
- [ ] App startup time not degraded
- [ ] Config reads remain fast (<5ms)
- [ ] No unnecessary SQLite queries for config

---

## 🎯 FUTURE CONSIDERATIONS

**Potential AsyncStorage → SQLite migrations (future versions):**

1. **User Preferences History** (if we add preference tracking)
   - Current: Single preference state
   - Future: Track preference changes over time
   - Migration trigger: When we need analytics on preference changes

2. **Feature Flag Analytics** (if we track feature usage)
   - Current: Boolean flags only
   - Future: Usage metrics per feature
   - Migration trigger: When we need usage data

3. **Notification History** (if we log notification events)
   - Current: Settings only
   - Future: Track sent/received notifications
   - Migration trigger: When we need notification analytics

**For now: Keep it simple!** Current AsyncStorage usage is optimal.

---

## 📊 FINAL SUMMARY

**SEKCE 4 Conclusion:**
- **~21 AsyncStorage keys** remain for configuration
- **<25KB total data** - perfect for AsyncStorage
- **No migration needed** - existing code stays unchanged
- **Dual-storage architecture** - right tool for right job

**Total Migration Plan:**
- SEKCE 1: Core Data (835 lines) → SQLite ✅
- SEKCE 2: Gamification (1351 lines) → SQLite ✅
- SEKCE 3: Monthly Challenges (1297 lines) → SQLite ✅
- **SEKCE 4: Configuration (this doc) → AsyncStorage (no change)** ✅

**Grand Total: 3483+ lines of migration documentation**

---

**Status**: ✅ **COMPLETE** - All 4 sections documented and ready for implementation

