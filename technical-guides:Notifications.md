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

Evening notifications use a **4-priority system** that analyzes user progress and sends the **most relevant message**.

### Priority System (Highest to Lowest)

#### **Priority 1: Incomplete Habits** 🏃‍♂️
**Condition**: User has scheduled habits for today that are not yet completed

**Messages**:
- "You still have habits to complete! 🏃‍♂️"
- "You have X habit(s) left to complete. Let's do this!"
- "Don't break your streak! Complete your remaining habits 💪"

**Navigation**: Tapping notification → Habits tab

**Logic**:
```typescript
if (progress.incompletedHabitsCount > 0) {
  // Send incomplete habits message
  // Use pluralization: "1 habit" vs "2 habits"
}
```

---

#### **Priority 2: Missing Journal Entries** 📝
**Condition**: User has fewer than 3 basic entries OR fewer than 10 bonus entries

**Messages**:
- "Evening reflection time 📝"
- "Don't forget to write X more journal entry/entries!"
- "Quick gratitude check-in? You're X entries away 🙏"

**Navigation**: Tapping notification → Journal tab

**Logic**:
```typescript
if (!progress.hasThreeBasicEntries || progress.bonusEntriesCount < 10) {
  // Send journal reminder
  // Calculate missing entries: 3 - currentBasicEntries + (10 - currentBonusEntries)
}
```

**Pluralization**:
- 1 entry: "1 journal entry"
- 2+ entries: "2 journal entries"

---

#### **Priority 3: Goals Without Progress** 🎯
**Condition**: User has active goals but hasn't added any progress update today

**Messages**:
- "Did you make progress on your goals today? 🎯"
- "Quick goal update? Even small wins count! 🌟"
- "Don't forget to track your goal progress today!"

**Navigation**: Tapping notification → Goals tab

**Logic**:
```typescript
if (!progress.goalProgressAddedToday && progress.hasActiveGoals) {
  // Send goal progress reminder
}
```

---

#### **Priority 4: Generic Motivation** 💪
**Condition**: All tasks complete OR no active tasks

**Messages** (rotating):
- "You're doing great! Keep up the amazing work! 🌟"
- "Another day, another opportunity to grow 🚀"
- "Reflect on today - what are you grateful for? 🙏"
- "Tomorrow is a new day - rest well tonight! 😴"

**Navigation**: Tapping notification → Home tab

**Logic**: Fallback when all higher priorities are satisfied

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

**Smart Message Selection**:
```typescript
private selectEveningMessage(progress: DailyProgress): string {
  // Priority 1: Incomplete habits
  if (progress.incompletedHabitsCount > 0) {
    return t('notifications.evening.incompleteHabits.body', {
      count: progress.incompletedHabitsCount
    });
  }

  // Priority 2: Missing journal entries
  if (!progress.hasThreeBasicEntries || progress.bonusEntriesCount < 10) {
    const missing = calculateMissingEntries(progress);
    return t('notifications.evening.missingJournal.body', { count: missing });
  }

  // Priority 3: Goals without progress
  if (!progress.goalProgressAddedToday && progress.hasActiveGoals) {
    return t('notifications.evening.goalProgress.body');
  }

  // Priority 4: Generic motivation
  const genericMessages = t('notifications.evening.generic.messages');
  return genericMessages[Math.floor(Math.random() * genericMessages.length)];
}
```

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

**Issue**: Wrong message priority
- **Debug**: Log progress analysis results
- **Verify**: Priority logic in `selectEveningMessage()`

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

**Last Updated**: 2025-10-10
**Related Files**: See "File Locations" section above
**Related Documentation**: @projectplan.md Phase 7.1, @technical-guides.md
