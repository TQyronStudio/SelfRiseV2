# Technical Guide: Notification System

## Overview

The SelfRise notification system delivers **smart, context-aware notifications** that adapt to user progress throughout the day. The system analyzes daily habits, journal entries, and goal progress to send personalized motivational messages at strategic times.

**Key Principle**: Notifications should feel helpful, not annoying. Messages are intelligent and relevant to what the user actually needs to do.

---

## System Architecture

The notification system consists of **3 core services** and **1 lifecycle hook**:

### Core Services

1. **`notificationService.ts`** - Expo Notifications wrapper
   - Permission management (iOS/Android)
   - Notification scheduling API
   - Push notification handlers
   - System settings redirect on permission denial

2. **`notificationScheduler.ts`** - Scheduling engine
   - Time-based notification scheduling (16:00 afternoon, 20:00 evening)
   - Smart message selection based on user progress
   - Notification cancellation and rescheduling
   - Daily notification refresh

3. **`progressAnalyzer.ts`** - Smart analysis engine
   - Analyzes user's daily progress (habits, journal, goals)
   - Calculates completion status
   - Provides data for smart notification prioritization

### Integration Hook

4. **`useNotificationLifecycle.ts`** - App integration
   - Initializes notification system on app start
   - Reschedules notifications when app becomes active (background → foreground)
   - Handles notification tap navigation
   - Manages notification listeners

---

## Smart Evening Notifications (20:00)

Evening notifications use a **dynamic weighted random system** that analyzes user progress and selects messages based on **proportional probability**.

### How It Works

Instead of fixed priorities, the system calculates **weights** for each notification type based on how much work remains. Higher weight = higher probability of being selected.

**Core Principle**: The more incomplete a task category is, the more likely you'll receive a notification about it.

---

### Weighted Selection System

#### **Option 1: Incomplete Habits** 🏃‍♂️

**Condition**: User has scheduled habits for today that are not yet completed

**Weight Calculation**:
```typescript
weight = (incompletedHabitsCount / scheduledTodayCount) × 100
```

**Examples**:
- 1 out of 3 habits incomplete (33%) → weight: 33
- 2 out of 3 habits incomplete (67%) → weight: 67
- 3 out of 3 habits incomplete (100%) → weight: 100

**Message**:
- "You still have habits to complete! 🏃‍♂️"
- "You have X habit(s) left to complete. Let's do this!"

**Navigation**: Tapping notification → Habits tab

**Important**: Only counts habits **scheduled for today** (not all active habits)

---

#### **Option 2: Missing Journal Entries** 📝

**Condition**: User has fewer than 3 basic entries (required daily minimum)

**Weight Calculation**:
```typescript
missing = 3 - journalEntriesCount
weight = (missing / 3) × 100
```

**Examples**:
- 0 entries (missing 3) → weight: 100
- 1 entry (missing 2) → weight: 67
- 2 entries (missing 1) → weight: 33
- 3+ entries → weight: 0 (excluded from selection)

**Message**:
- "Evening reflection time 📝"
- "Don't forget to write X more journal entry/entries!"

**Navigation**: Tapping notification → Journal tab

**Pluralization**: "1 entry" vs "2 entries"

---

#### **Option 3: Bonus Entries** ⭐

**Condition**: User has 3+ basic entries AND fewer than 10 bonus entries

**Weight Calculation**:
```typescript
weight = 15 (fixed nice-to-have weight)
```

**Important Rule**: This option is **ONLY available if user already has 3+ basic entries**. Bonuses never compete with basic requirements.

**Message**:
- "Bonus opportunity! ⭐"
- "You still have time for bonus entries! (currently X/10)"

**Navigation**: Tapping notification → Journal tab

**Philosophy**: Bonuses are optional extras, so they have a small fixed weight to avoid overshadowing habits/journal basics.

---

#### **Option 4: Goals Without Progress** 🎯

*(přidáno 2026-07-20 — rozhodnutí Petra, super audit Fáze 7 / N-7.8)*

**Condition**: User has at least one **active goal** AND added **no progress to any goal today**

**Weight Calculation**:
```typescript
weight = 40 (fixed)
```

**Message**:
- "Your goals are waiting 🎯"
- "You haven't added progress to any goal today. Take one small step!"

**Navigation**: Tapping notification → Goals tab

**Why fixed 40 (not proportional)**: Goals are long-term. Requiring progress on
*every* goal each day would be unrealistic and would let goals dominate the
lottery. The meaningful daily question is "did you touch **any** goal today?" —
which is exactly what `goalProgressAddedToday` answers.

**Why 40 specifically**: clearly above the nice-to-have bonus (15), clearly
below a fully neglected daily basic (100). A user who finished habits and the
journal but ignored their goals gets the reminder; a user who neglected
everything still hears about habits/journal first.

**Requires**: `DailyTaskProgress.hasActiveGoals` (added with this option — the
analyzer previously returned only the boolean `goalProgressAddedToday`, so the
"has any goals at all" guard was impossible).

---

### Selection Algorithm

```typescript
// Phase 1: Build list of available options
const options = [];

// Add habits if incomplete
if (incompletedHabitsCount > 0 && scheduledTodayCount > 0) {
  options.push({
    type: 'habits',
    weight: (incompletedHabitsCount / scheduledTodayCount) * 100
  });
}

// Add journal if missing entries
if (journalEntriesCount < 3) {
  options.push({
    type: 'journal',
    weight: ((3 - journalEntriesCount) / 3) * 100
  });
}

// Add bonuses ONLY if 3+ basic entries exist
if (journalEntriesCount >= 3 && bonusEntriesCount < 10) {
  options.push({
    type: 'bonus',
    weight: 15
  });
}

// Add goals if the user has active goals but touched none today (2026-07-20)
if (hasActiveGoals && !goalProgressAddedToday) {
  options.push({
    type: 'goals',
    weight: 40
  });
}

// Phase 2: If no options, no notification (all complete!)
if (options.length === 0) {
  return null;
}

// Phase 3: Weighted random selection
totalWeight = sum of all weights
random = Random number between 0 and totalWeight
Select option based on cumulative weight distribution
```

---

### Real-World Examples

#### Example A: Busy Day
**User State**:
- 3 out of 5 habits incomplete (60%)
- 1 journal entry (missing 2 = 67%)
- No bonuses (but doesn't qualify - needs 3 basic first)

**Weights**:
- Habits: 60
- Journal: 67
- Total: 127

**Probabilities**:
- Habits: 60/127 = **47.2%** chance 🎯
- Journal: 67/127 = **52.8%** chance 🎯

**Result**: Slightly more likely to receive journal reminder (needs 2 more entries vs 3 more habits)

---

#### Example B: Almost Done
**User State**:
- 1 out of 5 habits incomplete (20%)
- 3 journal entries (all basic requirements met!)
- 4 bonus entries (could write 6 more)

**Weights**:
- Habits: 20
- Journal: 0 (excluded - already has 3+)
- Bonuses: 15
- Total: 35

**Probabilities**:
- Habits: 20/35 = **57.1%** chance 🎯
- Bonuses: 15/35 = **42.9%** chance 🎯

**Result**: More likely habits reminder, but bonuses still have a decent shot

---

#### Example C: Everything Incomplete
**User State**:
- 5 out of 5 habits incomplete (100%)
- 0 journal entries (missing 3 = 100%)

**Weights**:
- Habits: 100
- Journal: 100
- Total: 200

**Probabilities**:
- Habits: 100/200 = **50%** chance 🎯
- Journal: 100/200 = **50%** chance 🎯

**Result**: Perfect coin flip - both equally important

---

#### Example D: All Done Except Bonuses
**User State**:
- 0 habits incomplete
- 3 basic journal entries (requirement met!)
- 3 bonus entries (could write 7 more)

**Weights**:
- Habits: 0 (excluded)
- Journal: 0 (excluded)
- Bonuses: 15 (only option)
- Total: 15

**Probabilities**:
- Bonuses: 15/15 = **100%** chance 🎯

**Result**: Bonus notification sent (user requested this behavior)

---

## Afternoon Notifications (16:00)

Afternoon notifications are **generic motivational messages** that rotate to keep content fresh. They don't analyze progress - they're designed to re-engage users midday.

### Message Rotation

Messages are selected **randomly** from this pool:

- "How's your day going? Don't forget your goals and habits! 🚀"
- "You still have time! Check your habits and goals 💪"
- "Afternoon check-in: How are you doing with your goals? 🎯"
- "Time for a micro-win! Can you complete one more habit? 🏃‍♂️"
- "Quick break? Perfect time to log a journal entry 📝"
- "Your future self will thank you for today's efforts! 🌟"

**Navigation**: Tapping notification → Home tab

**Scheduling**: Every day at 16:00 (4:00 PM) local time

---

## Permission Management

### iOS Permission Flow

1. **Initial Request**: First time enabling notifications
   ```typescript
   const { status } = await Notifications.requestPermissionsAsync();
   ```

2. **Permission States**:
   - `granted` → Notifications enabled ✅
   - `denied` → User declined → Show system settings redirect
   - `undetermined` → First time asking

3. **System Settings Redirect**:
   If user previously denied permissions, we can't ask again. Instead:
   ```typescript
   if (status === 'denied') {
     // Show alert with "Open Settings" button
     Linking.openSettings(); // Opens iOS Settings app
   }
   ```

### Android Permission Flow

Similar to iOS, but Android has more granular notification permissions (channels, importance levels). Our implementation handles this automatically via `expo-notifications`.

---

## Scheduling Logic

### When Notifications Are Scheduled

Notifications are **rescheduled** in these scenarios:

1. **App Launch** - When user opens the app
2. **Background → Foreground** - When user returns to app from background
3. **Settings Change** - When user enables/disables notifications
4. **Task Completion** - After completing a habit/journal/goal (optional refresh)

### Scheduling Implementation

```typescript
// Schedule afternoon notification (16:00)
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Afternoon Check-In',
    body: 'How\'s your day going? Don\'t forget your goals and habits! 🚀',
    data: { category: 'afternoon_reminder' },
  },
  trigger: {
    hour: 16,
    minute: 0,
    repeats: true, // Daily repeat
  },
});

// Schedule evening notification (20:00)
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Evening Reflection',
    body: smartMessage, // Based on progress analysis
    data: { category: 'evening_reminder' },
  },
  trigger: {
    hour: 20,
    minute: 0,
    repeats: true, // Daily repeat
  },
});
```

### Identifier System

Each notification type has a unique identifier for cancellation/rescheduling:

- **Afternoon**: `afternoon-reminder`
- **Evening**: `evening-reminder`

To cancel:
```typescript
await Notifications.cancelScheduledNotificationAsync('afternoon-reminder');
```

---

## App Lifecycle Integration

### useNotificationLifecycle Hook

This hook **must be called inside RootProvider** (app/_layout.tsx) to have access to all contexts (Habits, Journal, Goals).

#### What It Does:

1. **On Mount**:
   - Initializes notification service
   - Requests permissions (if not already granted)
   - Schedules initial notifications
   - Sets up listeners for:
     - App state changes (background ↔ foreground)
     - Notification received (app in foreground)
     - Notification tapped (user interaction)

2. **On App State Change**:
   - When app goes **background → foreground**:
     - Reschedules notifications with updated progress
     - Ensures notifications reflect latest user data

3. **On Notification Tap**:
   - Afternoon reminder → Navigate to Home tab
   - Evening reminder → Navigate to missing task (smart navigation)

#### Smart Navigation on Tap

When user taps evening notification:

1. Analyze current progress
2. Navigate to **highest priority incomplete task**:
   - Incomplete habits → Habits tab
   - Missing journal entries → Journal tab
   - Goals without progress → Goals tab
   - All complete → Home tab

```typescript
const navigateToMissingTask = async () => {
  const progress = await progressAnalyzer.analyzeDailyProgress();

  if (progress.incompletedHabitsCount > 0) {
    router.push('/(tabs)/habits');
  } else if (!progress.hasThreeBasicEntries) {
    router.push('/(tabs)/journal');
  } else if (!progress.goalProgressAddedToday) {
    router.push('/(tabs)/goals');
  } else {
    router.push('/(tabs)'); // Home
  }
};
```

---

## i18n Support

All notification messages support **internationalization** with proper pluralization.

### Translation Structure

```typescript
// en/index.ts
notifications: {
  afternoon: {
    messages: [
      "How's your day going? Don't forget your goals and habits! 🚀",
      "You still have time! Check your habits and goals 💪",
      // ... more messages
    ],
  },
  evening: {
    incompleteHabits: {
      title: "Habit Reminder",
      body_one: "You have {{count}} habit left to complete. Let's do this!",
      body_other: "You have {{count}} habits left to complete. Let's do this!",
    },
    missingJournal: {
      title: "Evening Reflection",
      body_one: "Don't forget to write {{count}} more journal entry!",
      body_other: "Don't forget to write {{count}} more journal entries!",
    },
    // ... more messages
  },
}
```

### Pluralization

English uses **two forms**:
- `body_one`: "1 habit"
- `body_other`: "2 habits", "5 habits"

Usage:
```typescript
const message = t('notifications.evening.incompleteHabits.body', {
  count: incompletedCount
});
// count = 1 → "You have 1 habit left to complete."
// count = 5 → "You have 5 habits left to complete."
```

---

## Technical Implementation Details

### File Locations

```
src/
├── services/
│   └── notifications/
│       ├── notificationService.ts       # Expo wrapper, permissions
│       ├── notificationScheduler.ts     # Scheduling logic
│       ├── progressAnalyzer.ts          # Progress analysis
│       └── index.ts                     # Exports
├── hooks/
│   └── useNotificationLifecycle.ts      # App integration hook
└── components/
    └── settings/
        └── NotificationSettings.tsx     # UI toggle switches
```

### notificationService.ts

**Responsibilities**:
- Permission request/check
- Schedule notification (wrapper around Expo API)
- Cancel notification
- Get scheduled notifications
- Handle permission denial → system settings redirect

**Key Methods**:
```typescript
class NotificationService {
  async initialize(): Promise<void>
  async requestPermission(): Promise<boolean>
  async scheduleNotification(options): Promise<string>
  async cancelNotification(id: string): Promise<void>
  async getAllScheduledNotifications(): Promise<Notification[]>
}
```

---

### notificationScheduler.ts

**Responsibilities**:
- Schedule afternoon notification (16:00)
- Schedule evening notification (20:00) with smart message selection
- Cancel all notifications
- Reschedule all notifications

**Key Methods**:
```typescript
class NotificationScheduler {
  async scheduleAfternoon(): Promise<void>
  async scheduleEvening(progress: DailyProgress): Promise<void>
  async cancelAll(): Promise<void>
  async rescheduleAll(progress: DailyProgress): Promise<void>
}
```

**Smart Message Selection**: implementováno jako **vážené losování**, ne
prioritní řetěz — viz sekce „Weighted Selection System" výše (ta je závazná).

```typescript
// notificationScheduler.generateSmartEveningMessage(progress)
// Postaví seznam možností s vahami a jednu vylosuje:
//   habits : (incomplete / scheduledToday) × 100   [jen když je dnes něco naplánováno]
//   journal: ((3 - entries) / 3) × 100             [jen když chybí základní 3]
//   bonus  : 15 (fixní)                            [jen když 3+ základních a < 10 bonusů]
//   goals  : 40 (fixní)                            [jen když má aktivní cíl a dnes u něj
//                                                    není žádný pokrok]  ← přidáno 2026-07-20
// Když je seznam prázdný → vrací null → DNES SE NEPOSÍLÁ NIC (žádný fallback).
```

> ⚠️ **Historická poznámka (super audit Fáze 7, N-7.8)**: do 2026-07-20 tu byla
> ukázka s prioritním výběrem (`if habits … else if journal … else if goals`).
> Ta **neodpovídala kódu** už od zavedení váženého systému a navíc slibovala
> zprávu o cílech, kterou implementace neuměla. Prioritní ukázka byla nahrazena
> popisem výše a volba pro cíle byla do kódu doplněna (váha 40).

---

### progressAnalyzer.ts

**Responsibilities**:
- Load user data from AsyncStorage (habits, journal, goals)
- Calculate daily completion status
- Return structured progress object

**Return Type**:
```typescript
interface DailyProgress {
  // Habits
  totalHabitsForToday: number;
  completedHabitsCount: number;
  incompletedHabitsCount: number;

  // Journal
  hasThreeBasicEntries: boolean;
  bonusEntriesCount: number;

  // Goals
  goalProgressAddedToday: boolean;
  hasActiveGoals: boolean;
}
```

**Key Method**:
```typescript
class ProgressAnalyzer {
  async analyzeDailyProgress(): Promise<DailyProgress>
}
```

**Implementation**:
```typescript
async analyzeDailyProgress(): Promise<DailyProgress> {
  // Load all habits
  const habits = await loadHabits();

  // Filter habits scheduled for today
  const todaysHabits = habits.filter(habit =>
    isScheduledForToday(habit, new Date())
  );

  // Count completed vs incomplete
  const completed = todaysHabits.filter(h => h.completedToday).length;
  const incomplete = todaysHabits.length - completed;

  // Load journal entries
  const entries = await loadJournalEntries();
  const todayEntries = entries.filter(e => isToday(e.date));
  const basicEntries = todayEntries.slice(0, 3).length;
  const bonusEntries = Math.max(0, todayEntries.length - 3);

  // Load goals
  const goals = await loadGoals();
  const activeGoals = goals.filter(g => g.status === 'active');
  const progressToday = activeGoals.some(g =>
    g.progressUpdates?.some(p => isToday(p.date))
  );

  return {
    totalHabitsForToday: todaysHabits.length,
    completedHabitsCount: completed,
    incompletedHabitsCount: incomplete,
    hasThreeBasicEntries: basicEntries >= 3,
    bonusEntriesCount: bonusEntries,
    goalProgressAddedToday: progressToday,
    hasActiveGoals: activeGoals.length > 0,
  };
}
```

---

### useNotificationLifecycle.ts

**Responsibilities**:
- Initialize notification system on app start
- Set up app state listener (background ↔ foreground)
- Set up notification tap listener
- Reschedule notifications when app becomes active
- Provide manual reschedule function

**Hook Return**:
```typescript
{
  rescheduleNotifications: () => Promise<void>
}
```

**Usage in app/_layout.tsx**:
```typescript
function LayoutContent() {
  // Must be inside RootProvider to access contexts
  const { rescheduleNotifications } = useNotificationLifecycle();

  return (
    <TutorialProvider>
      <TutorialOverlay>
        <Stack>
          {/* ... routes */}
        </Stack>
      </TutorialOverlay>
    </TutorialProvider>
  );
}
```

**Manual Reschedule** (optional, for immediate updates):
```typescript
// After completing a habit
await completeHabit(habitId);
await rescheduleNotifications(); // Update notifications immediately
```

---

## Native Build Requirements

### Why Native Build Is Required

`expo-notifications` is a **native module** that includes:
- iOS: Apple Push Notification Service (APNS) integration
- Android: Firebase Cloud Messaging (FCM) integration

These cannot run in **Expo Go** (which has a fixed set of native modules). You must create a **development build** with expo-notifications included.

### Build Process

#### Option 1: EAS Build (Cloud)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

After build completes:
1. Scan QR code with device
2. Install development build
3. Notifications will work ✅

#### Option 2: Local Build
```bash
# iOS (requires Mac + Xcode)
npx expo run:ios --device

# Android (requires Android Studio)
npx expo run:android --device
```

### app.json Configuration

Ensure expo-notifications plugin is present:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff",
          "sounds": []
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM"
      ]
    }
  }
}
```

---

## Testing & Debugging

### Manual Testing

1. **Enable Notifications**:
   - Go to Settings tab
   - Enable "Afternoon Reminder" and/or "Evening Reminder"
   - Grant permissions when prompted

2. **Test Scheduling**:
   ```typescript
   // In console or debug code
   import { notificationScheduler, progressAnalyzer } from '@/src/services/notifications';

   const progress = await progressAnalyzer.analyzeDailyProgress();
   await notificationScheduler.rescheduleAll(progress);

   // Check scheduled notifications
   const scheduled = await Notifications.getAllScheduledNotificationsAsync();
   console.log('Scheduled:', scheduled);
   ```

3. **Test Immediate Notification** (for debugging):
   ```typescript
   await Notifications.scheduleNotificationAsync({
     content: {
       title: 'Test',
       body: 'This is a test notification',
     },
     trigger: {
       seconds: 5, // 5 seconds from now
     },
   });
   ```

### Debugging Tips

1. **Check Permission Status**:
   ```typescript
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```

2. **View All Scheduled Notifications**:
   ```typescript
   const scheduled = await Notifications.getAllScheduledNotificationsAsync();
   console.log('All scheduled:', scheduled);
   ```

3. **Cancel All Notifications** (reset):
   ```typescript
   await Notifications.cancelAllScheduledNotificationsAsync();
   ```

4. **Check Logs**:
   - Look for `[useNotificationLifecycle]` prefix in console
   - Check for permission errors
   - Verify scheduling success messages

### Common Issues

**Issue**: Notifications not appearing
- **Check**: Permission status (must be `granted`)
- **Check**: Time zone settings (notifications use local time)
- **Check**: Device Do Not Disturb settings

**Issue**: Wrong / unexpected evening message
- **Debug**: Log progress analysis results (`[ProgressAnalyzer] Daily progress analyzed`)
- **Verify**: weights in `generateSmartEveningMessage()` — the pick is a WEIGHTED
  LOTTERY, so an "unexpected" message is often correct behaviour (a low-weight
  option legitimately winning). Check the logged `probability` in
  `[NotificationScheduler] Weighted selection`.
- **Regression suite**: `src/services/notifications/__tests__/notificationScheduler.test.ts`

**Issue**: Notification tap not navigating
- **Check**: `data.category` field in notification
- **Verify**: Router is accessible (useNotificationLifecycle inside navigation tree)

---

## Future Enhancements

### Potential Improvements

1. **Customizable Times**: Allow users to set custom notification times
2. **Notification Frequency**: Daily, weekdays only, custom schedule
3. **Quiet Hours**: Disable notifications during specific hours
4. **Streak Alerts**: Special notifications for streak milestones
5. **Goal Deadline Reminders**: Notify when goals are approaching deadline
6. **Weekly Summary**: Sunday evening recap of weekly progress

### Implementation Notes

For customizable times, update scheduling logic:
```typescript
const afternoonTime = await AsyncStorage.getItem('notification_afternoon_time');
const [hour, minute] = afternoonTime?.split(':') || [16, 0];

await Notifications.scheduleNotificationAsync({
  trigger: {
    hour: parseInt(hour),
    minute: parseInt(minute),
    repeats: true,
  },
});
```

---

## Summary

The SelfRise notification system is designed to be:
- **Smart**: Analyzes user progress and sends relevant messages
- **Non-intrusive**: Two notifications per day max (afternoon + evening)
- **Helpful**: Guides users to incomplete tasks via tap navigation
- **Flexible**: Easy to enable/disable in Settings
- **Localized**: Full i18n support with proper pluralization

**Core Principle**: Help users stay on track without being annoying. Quality over quantity.

---

**Last Updated**: 2025-10-27 (Dynamic Weighted System Implementation)
**Related Files**: See "File Locations" section above
**Related Documentation**: @projectplan.md Phase 7.1, @technical-guides.md

---

## Changelog

### 2025-10-27: Dynamic Weighted System
- **Changed**: Replaced fixed priority system with dynamic weighted random selection
- **Added**: `scheduledTodayCount` to DailyTaskProgress for accurate weight calculation
- **Fixed**: Habits filter now only counts habits scheduled for today (not all active habits)
- **Improved**: Bonus entries now ONLY appear if user already has 3+ basic entries
- **Added**: Console logging for weight calculations and selection probabilities (debugging)
