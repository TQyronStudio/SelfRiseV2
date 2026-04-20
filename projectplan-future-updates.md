# SelfRise V2 - Future Updates Roadmap

*Strategic roadmap for advanced features requiring significant user data, infrastructure, or complex implementations*

---

## Development Philosophy for Future Updates

**When to Implement Future Features:**
- ✅ After achieving 10,000+ active users (sufficient data for ML models)
- ✅ When core app stability is proven in production
- ✅ After establishing reliable backend infrastructure
- ✅ When development team has dedicated data science resources

---

## Phase 0: Infrastructure & Backend Foundation 🏗️

### Goal
Establish essential backend infrastructure for user management, data synchronization, and cloud services before implementing advanced features.

### Phase 0.1: User Authentication & Account Management 👤

**Implementation Priority**: Medium (after core app stabilization)
**Complexity**: Standard backend integration
**Prerequisites**: Backend infrastructure, Firebase/Supabase setup, privacy compliance

#### Checkpoint 0.1.1: User Authentication System 🔐
**Goal**: Implement complete user registration, login, and account management

##### Sub-checkpoint 0.1.1.A: Authentication Infrastructure 🏛️
- [ ] Firebase Authentication integration setup
- [ ] User registration and login forms with input validation
- [ ] Password reset functionality with email verification
- [ ] Profile management interface (name, email, avatar)
- [ ] Account deletion and data export compliance (GDPR)

##### Sub-checkpoint 0.1.1.C: Hardcoded userId Migration 🔑
- [ ] Replace `'current_user'` in `monthlyProgressTracker.ts` (line 746) with real user ID from auth context
- [ ] Replace `'local_user'` in `monthlyChallengeService.ts` with real user ID from auth context
- [ ] Audit all services for hardcoded user identifiers and replace with auth-provided userId
- **Context**: Discovered in audit 8.4 — currently harmless (single-user offline app), but must be resolved before multi-user or cloud sync support

##### Sub-checkpoint 0.1.1.B: Data Synchronization 📡
- [ ] Local to cloud data migration system
- [ ] Real-time data synchronization across devices
- [ ] Offline-first architecture with conflict resolution
- [ ] Data backup and restore functionality
- [ ] Cross-device habit/goal/journal synchronization

**Technical Implementation**:
```typescript
interface AuthenticationService {
  registerUser(email: string, password: string, profile: UserProfile): Promise<AuthResult>;
  loginUser(email: string, password: string): Promise<AuthResult>;
  resetPassword(email: string): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  deleteAccount(): Promise<void>;
  exportUserData(): Promise<UserDataExport>;
}

interface DataSyncService {
  syncToCloud(): Promise<SyncResult>;
  syncFromCloud(): Promise<SyncResult>;
  resolveConflicts(conflicts: DataConflict[]): Promise<void>;
  setupRealtimeSync(): Promise<void>;
}
```

---

## Phase 1: Advanced User Intelligence & Predictive Analytics 🔮

### Goal
Create sophisticated AI-driven systems to predict user behavior and proactively optimize engagement through machine learning and advanced analytics.

### Phase 1.1: Predictive Retention System 🔮

**Implementation Priority**: High (when conditions met)
**Complexity**: Enterprise-level
**Prerequisites**: 6+ months user data, ML infrastructure, data science team

#### Checkpoint 1.1.1: Data Infrastructure & Model Training 📊
**Goal**: Establish ML infrastructure and initial churn prediction models

##### Sub-checkpoint 1.1.1.A: Data Collection & Feature Engineering 📈
- [ ] Implement comprehensive user behavior tracking system
- [ ] Create feature extraction pipeline for gamification patterns
- [ ] Set up data warehouse for ML model training
- [ ] Establish privacy-compliant data processing workflows
- [ ] Create automated data quality validation system

##### Sub-checkpoint 1.1.1.B: Churn Prediction Model Development 🤖
- [ ] Develop gradient boosting churn prediction model (XGBoost/LightGBM)
- [ ] Create training pipeline with cross-validation
- [ ] Implement model performance monitoring system
- [ ] Set up A/B testing infrastructure for model comparison
- [ ] Create churn risk scoring system (low/medium/high/critical)

**Technical Implementation**:
```typescript
// Future service architecture
interface ChurnPredictionService {
  calculateChurnProbability(userId: string): Promise<{
    probability: number;        // 0.0 - 1.0
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    keyFactors: string[];      // Main churn indicators
    recommendedActions: InterventionAction[];
    confidenceScore: number;   // Model confidence
  }>;
  
  getEngagementTrends(userId: string): Promise<EngagementTrends>;
  identifyAtRiskUsers(): Promise<AtRiskUser[]>;
}
```

**Churn Risk Scoring**:
- **Low Risk (0.0-0.3)**: Active, consistent users
- **Medium Risk (0.3-0.6)**: Showing early warning signs
- **High Risk (0.6-0.8)**: Declining engagement, intervention needed
- **Critical Risk (0.8-1.0)**: Imminent churn, emergency intervention

#### Checkpoint 1.1.2: Intelligent Intervention System 🎯
**Goal**: Automated personalized re-engagement campaigns and user interventions

##### Sub-checkpoint 1.1.2.A: Win-back Campaign Engine 📧
- [ ] Design personalization engine for user personality detection
- [ ] Implement campaign type classification system
- [ ] Create automated intervention content generation
- [ ] Develop optimal timing prediction algorithms
- [ ] Build campaign effectiveness tracking system

##### Sub-checkpoint 1.1.2.B: At-Risk User Detection & Intervention 🚨
- [ ] Implement early warning indicator system
- [ ] Create automated intervention triggers
- [ ] Design gentle check-in message system
- [ ] Build temporary goal/habit simplification suggestions
- [ ] Implement peer support connection matching

**Dynamic Campaign Features**:
```typescript
interface WinBackCampaign {
  userId: string;
  campaignType: 'gentle_nudge' | 'achievement_revival' | 'social_connection' | 'streak_recovery' | 'gamification_boost';
  personalizedContent: {
    title: string;
    message: string;
    actionCTA: string;
    visualTheme: string;
  };
  interventionTiming: {
    optimalHour: number;       // Based on user's historical activity
    dayOfWeek: string;         // User's most active day
    followUpSchedule: number[]; // Days for follow-up messages
  };
  incentives: {
    xpBonus?: number;
    achievementUnlock?: string;
    specialChallenge?: string;
    exclusiveContent?: string;
  };
}
```

#### Checkpoint 1.1.3: Advanced Re-engagement & Notification System 🎁
**Goal**: Sophisticated comeback rewards and predictive notification optimization

##### Sub-checkpoint 1.1.3.A: Tiered Comeback Bonus System 🏆
- [ ] Implement 3-tier comeback system (30-60, 60-120, 120+ days)
- [ ] Create personalized return experience with progress summaries
- [ ] Design gentle re-onboarding flow for returning users
- [ ] Build customized goal/habit suggestion engine
- [ ] Implement special "comeback challenges" system

##### Sub-checkpoint 1.1.3.B: Predictive Notification Optimization ⏰
- [ ] Analyze historical app usage patterns for optimal timing
- [ ] Implement notification response rate tracking
- [ ] Create contextual timing algorithms (work/weekend/holiday detection)
- [ ] Build seasonal behavior pattern recognition
- [ ] Develop personalized notification content generation

**Smart Notification Features**:
```typescript
interface SmartNotificationSystem {
  calculateOptimalTiming(userId: string, notificationType: string): Promise<{
    optimalHour: number;
    dayOfWeek: string;
    probability: number;       // Likelihood of engagement
    alternativeTimes: OptimalTime[];
  }>;
  
  personalizeNotificationContent(userId: string, baseMessage: string): Promise<{
    personalizedMessage: string;
    emotionalTone: 'motivational' | 'gentle' | 'celebratory' | 'urgent';
    visualStyle: string;
  }>;
}
```

#### Checkpoint 1.1.4: Production Infrastructure & Continuous Learning 🤖
**Goal**: Self-improving ML infrastructure with production monitoring

##### Sub-checkpoint 1.1.4.A: Predictive Model Infrastructure 🔧
- [ ] Build real-time feature extraction pipeline
- [ ] Implement automated model performance monitoring
- [ ] Create continuous learning system with monthly retraining
- [ ] Set up privacy-first model architecture
- [ ] Implement A/B testing for intervention effectiveness

##### Sub-checkpoint 1.1.4.B: Production Deployment & Monitoring 📈
- [ ] Deploy models to serverless ML inference infrastructure
- [ ] Create comprehensive logging and monitoring systems
- [ ] Implement automated model rollback on performance degradation
- [ ] Build real-time intervention effectiveness dashboards
- [ ] Set up automated alerts for system anomalies

**Model Architecture**:
```typescript
interface PredictiveModelInfrastructure {
  trainModels(): Promise<ModelTrainingResult>;
  validateModelPerformance(): Promise<PerformanceMetrics>;
  deployModelUpdate(): Promise<DeploymentResult>;
  
  // A/B testing for intervention strategies
  runInterventionExperiment(intervention: InterventionStrategy): Promise<ExperimentResult>;
}
```

---

## Phase 1.2: Social Intelligence & Community Prediction 👥

### Goal
Predict and facilitate optimal social interactions and community engagement

#### Checkpoint 1.2.1: Social Connection Intelligence 🤝
**Goal**: Implement AI-driven social matching and community engagement

##### Sub-checkpoint 1.2.1.A: Friend Connection Optimization 👫
- [ ] Develop complementary habit matching algorithms
- [ ] Implement friend suggestion engine based on activity patterns
- [ ] Create accountability partnership prediction models
- [ ] Build social compatibility scoring system
- [ ] Design privacy-preserving social matching infrastructure

##### Sub-checkpoint 1.2.1.B: Community Challenge Intelligence 🏆
- [ ] Create community challenge success probability analysis
- [ ] Implement social motivation pattern recognition
- [ ] Build team formation optimization algorithms
- [ ] Design competitive vs collaborative preference detection
- [ ] Create community engagement prediction models

---

## Phase 1.3: Lifestyle Adaptation Intelligence 🏠

### Goal  
Predict life changes and automatically adapt app experience

#### Checkpoint 1.3.1: Life Transition Detection & Adaptation 🔄
**Goal**: Automatically adapt app experience to user's life changes

##### Sub-checkpoint 1.3.1.A: Major Life Transition Detection 🎯
- [ ] Implement job change detection algorithms
- [ ] Create relationship status change prediction models
- [ ] Build moving/relocation detection systems
- [ ] Design stress period identification algorithms
- [ ] Create life stage progression tracking

##### Sub-checkpoint 1.3.1.B: Adaptive Goal & Habit Adjustment 🔧
- [ ] Implement automatic difficulty adjustment during stressful periods
- [ ] Create seasonal behavior pattern prediction
- [ ] Build long-term life goal trajectory prediction
- [ ] Design adaptive recommendation engine for life changes
- [ ] Implement personalized motivation adaptation system

---

## Implementation Strategy

### Prerequisites for Phase 1
1. **User Base**: 10,000+ active monthly users
2. **Data Infrastructure**: Cloud-based analytics pipeline
3. **Team**: Data scientist + ML engineer
4. **Privacy Compliance**: GDPR/CCPA-compliant data processing
5. **Infrastructure**: Serverless ML inference capabilities

### Success Metrics
- **Churn Reduction**: 25% decrease in user churn rate
- **Re-engagement**: 40% increase in comeback user retention
- **Notification Efficiency**: 60% improvement in notification engagement rates
- **User Satisfaction**: 90%+ approval for predictive features

### Risk Mitigation
- **Privacy-First**: All predictions based on behavioral patterns, not personal data
- **Transparency**: Users can see and understand their prediction factors
- **Opt-out Options**: Full control over predictive features
- **Gradual Rollout**: Phased implementation with extensive testing

---

## Phase 2: Premium Themes & Customization 🎨

### Goal
Unlock exclusive visual themes as gamification rewards

### Phase 2.1: T-Qyron Theme (Level 20 Unlock) 👑

**Implementation Priority**: Medium (after base theme system complete)
**Complexity**: Low (extends existing theme infrastructure)
**Prerequisites**: Theme system (Context API) implemented, Gamification level tracking

#### Checkpoint 2.1.1: T-Qyron Theme Design & Implementation
**Goal**: Create premium unlockable theme as level-based achievement reward

##### Features:
- [ ] Design T-Qyron color palette (premium/exclusive visual identity)
- [ ] Implement theme unlock logic based on user level (≥20)
- [ ] Create "Theme Locked" state in Settings with level requirement display
- [ ] Add unlock celebration modal when user reaches Level 20
- [ ] Create theme preview system (locked themes show preview but can't be activated)
- [ ] Add achievement/trophy for unlocking T-Qyron theme
- [ ] Implement theme badge/indicator in Settings menu

**Technical Implementation**:
```typescript
// Theme system will check gamification level
interface ThemeOption {
  id: 'light' | 'dark' | 'system' | 'tqyron';
  name: string;
  unlockLevel?: number;        // undefined = always unlocked
  badge?: string;              // Display badge (e.g., '👑' for premium)
  preview: ThemeColors;        // Preview palette for locked themes
}

const themes: ThemeOption[] = [
  { id: 'light', name: 'Light', preview: lightColors },
  { id: 'dark', name: 'Dark', preview: darkColors },
  { id: 'system', name: 'System Auto', preview: lightColors },
  {
    id: 'tqyron',
    name: 'T-Qyron',
    unlockLevel: 20,
    badge: '👑',
    preview: tqyronColors
  },
];

// In ThemeSelector component:
const { level } = useGamification();
const isUnlocked = !theme.unlockLevel || level >= theme.unlockLevel;
```

**User Experience Flow**:
1. User at Level 5 opens Settings → Sees "T-Qyron 👑" theme with lock icon
2. Taps locked theme → Modal shows: "Reach Level 20 to unlock T-Qyron theme!"
3. User reaches Level 20 → Achievement unlocked modal: "🎉 T-Qyron Theme Unlocked!"
4. Settings now shows T-Qyron as selectable option
5. User activates T-Qyron → App transforms with premium color palette

**Gamification Integration**:
- Achievement unlock: "Style Master - Unlock your first premium theme"
- XP bonus on first activation: +500 XP
- Social sharing: "I just unlocked the exclusive T-Qyron theme! 👑"
- Retention impact: Premium theme acts as status symbol and engagement anchor

**Future Expansion Potential**:
- Level 50: "Midnight Galaxy" theme 🌌
- Level 100: "Golden Champion" theme ✨
- Special event themes: Holiday seasonal themes (Christmas, Halloween)
- Achievements-based themes: "Complete 100-day streak to unlock Aurora theme"

**Design Considerations**:
- **T-Qyron color palette TBD** - Will be designed when implementing this feature
  - Options to consider: gold/luxury vibe, cyber/futuristic aesthetic, or custom brand colors
  - Must maintain accessibility standards (WCAG contrast ratios)
  - Should feel meaningfully different from light/dark (premium experience)
  - Visual elements that emphasize exclusivity (subtle animations, premium icons)
- **Note**: Color palette design postponed until Phase 2.1 implementation begins

---

## Phase 3: Data Export & Backup System 💾

**Moved from Checkpoint 7.2 - postponed to focus on Theme + Language first**

**Priority**: Medium | **Complexity**: Medium | **Estimated**: 4-6 hours

**Goal**: Allow users to export, backup, and restore all their app data for safety and portability

### Features:
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

---

## Phase 4: Firebase Cloud Messaging (FCM) - Remote Push Notifications 📲

**Status**: Planned for future
**Priority**: Low | **Complexity**: Medium | **Estimated**: 8-12 hours

**Goal**: Enable server-sent push notifications for marketing campaigns, announcements, and re-engagement.

### What FCM Enables:
- 📢 **Announcements**: "New version released! Update now for new achievements"
- 🎄 **Promotional campaigns**: "Holiday bonus! 3x XP this weekend"
- 🔙 **Re-engagement**: "We miss you! Come back for a special bonus"
- 📊 **Targeted messages**: Send notifications to specific user segments

### Prerequisites:
- Backend server (Firebase Cloud Functions, Node.js, or similar)
- APNs certificate for iOS (Apple Push Notification service)
- Firebase Cloud Messaging setup in Firebase Console

### Technical Implementation Required:
- [ ] Install `@react-native-firebase/messaging`
- [ ] Configure APNs for iOS in Apple Developer account
- [ ] Upload APNs certificate to Firebase Console
- [ ] Create backend service for sending messages
- [ ] Implement notification handling in app
- [ ] Add user opt-in/opt-out for marketing notifications
- [ ] Create notification analytics tracking

### Why Postponed:
- Requires backend infrastructure (server to send messages)
- Local notifications already cover daily reminders
- Not needed for initial app launch
- Can be added anytime without app update (server-side)

### When to Implement:
- After reaching 1,000+ active users
- When marketing campaigns become priority
- When re-engagement automation is needed

---

## Phase 5: Social Sharing System 📤

**Status**: Temporarily removed from app (December 2024)
**Priority**: Low | **Complexity**: Medium | **Estimated**: 6-8 hours

**Goal**: Allow users to share their achievements, streaks, goals, and motivational quotes with friends via social media and messaging apps.

### Background
Social sharing buttons were present in the app but were incomplete/unpolished. They have been removed to focus on core functionality first. This feature should be properly designed and implemented in the future.

### Planned Sharing Features:
- [ ] **Streak Sharing** - Share gratitude streak milestones (series, badges)
- [ ] **Achievement Sharing** - Share unlocked achievements with rarity and description
- [ ] **Goal Progress Sharing** - Share goal completion stats and milestones
- [ ] **Quote Sharing** - Share daily motivational quotes

### Technical Implementation Required:
- [ ] Design beautiful share cards/images (not just plain text)
- [ ] Implement image generation for social media preview
- [ ] Add proper i18n support for all share texts (EN/DE/ES)
- [ ] Create consistent ShareModal component for all share types
- [ ] Test across all platforms (iOS/Android) and sharing targets
- [ ] Add analytics to track sharing engagement

### Previously Removed Components:
- `StreakSharingModal.tsx` - Modal for sharing streak
- `AchievementShareModal.tsx` - Modal for sharing achievements
- `GoalSharingModal.tsx` - Modal for sharing goal stats
- `ExportModal.tsx` - Journal data export (text/JSON) from JournalStatsScreen
- Share buttons in: `GratitudeStreakCard`, `AchievementDetailModal`, `MotivationalQuoteCard`, `GoalStatsScreen`, `JournalStatsScreen`

### Why Postponed:
- Core app functionality takes priority
- Sharing requires polished visual design (share cards)
- Need proper testing across different sharing targets
- Low priority compared to other features

### When to Implement:
- After app is stable in production
- When user engagement features become priority
- Before major marketing push (sharing = organic growth)

---

*This roadmap represents aspirational features for SelfRise V2's long-term evolution. Implementation timeline depends on user adoption, infrastructure readiness, and resource availability.*

---

## Phase 6: Atomic `xp_state` Update — Remove GamificationService.operationQueue ⚛️

**Status**: Deferred (decision made 2026-04-20 during Performance Audit Phase 8.1)
**Priority**: Low | **Complexity**: Medium-High | **Estimated**: 3–4 hours incl. regression testing

**Goal**: Remove the global `GamificationService.operationQueue` (`Promise.resolve().then()` chain that serializes all XP operations) and replace the current read-modify-write pattern on `xp_state.total_xp` with a SQL-level atomic `UPDATE`, unlocking parallel XP gains without race conditions.

### Context from Performance Audit (audit-fix-plan.md Phase 8.1)

During the habit-tap performance audit, the `operationQueue` was identified as a bottleneck: every `addXP` / `subtractXP` call gets appended to a single global `Promise` chain, forcing strict sequential execution. The queue was originally added "to prevent race conditions" (comment in code), and investigation confirmed a real race condition exists in the current code path:

```typescript
// gamificationService.ts:685-753 (simplified)
const previousTotalXP = await this.getTotalXP();          // READ
const newTotalXP = previousTotalXP + finalAmount;          // COMPUTE
await db.runAsync(
  'INSERT OR REPLACE INTO xp_state (id, total_xp, ...) VALUES (1, ?, ...)',
  [newTotalXP, ...]                                        // WRITE
);
```

Without the queue, two parallel `addXP` calls could both read `totalXP=100`, compute `125` and `150` respectively, and the last-writer-wins would produce `150` instead of the correct `175`. The `xp_transactions` INSERTs would all succeed (fine), but `xp_state.total_xp` and `current_level` would be wrong.

### The Fix: Atomic SQL UPDATE

Replace the read-compute-write pattern with an atomic SQL `UPDATE` that increments `total_xp` in a single statement within an SQLite transaction. SQLite serializes writes per-connection, so concurrent transactions are automatically queued at the DB level (same semantics as the JS queue, but without the JS Promise chain overhead).

```sql
BEGIN TRANSACTION;
  INSERT INTO xp_transactions (...) VALUES (...);
  UPDATE xp_state SET total_xp = total_xp + ?, updated_at = ? WHERE id = 1;
  SELECT total_xp FROM xp_state WHERE id = 1;  -- read fresh value
  -- compute new level from fresh total_xp in JS
  UPDATE xp_state SET current_level = ? WHERE id = 1;
  INSERT INTO xp_daily_summary (...) ON CONFLICT(date) DO UPDATE SET ...;
COMMIT;
```

### Implementation Tasks

- [ ] Audit all `this.operationQueue = this.operationQueue.then(...)` call sites (`performXPAddition`, `performXPSubtraction`, any future additions)
- [ ] Refactor `performXPAdditionInternal` to use atomic `UPDATE xp_state SET total_xp = total_xp + ?` instead of `INSERT OR REPLACE` with precomputed `newTotalXP`
- [ ] Read fresh `total_xp` back within the transaction (`SELECT total_xp FROM xp_state WHERE id = 1`) to compute the new level
- [ ] Handle the "fresh install" case where `xp_state` row doesn't exist yet (`INSERT OR IGNORE` then `UPDATE`, or ensure migration creates the row)
- [ ] Apply same pattern to `performXPSubtractionInternal`
- [ ] Remove `private static operationQueue: Promise<any>` declaration and all `.then()` wrappers
- [ ] Verify `cachedXPData` optimistic cache still behaves correctly (may need update with post-UPDATE value)
- [ ] Regression test: rapid XP gains (habit + journal + goal in same tick), level-up during rapid gains, subtraction flows, multiplier edge cases
- [ ] Confirm `DeviceEventEmitter` listeners (`xpGained`, `xpBatchCommitted`, `levelUp`) still receive events in a consistent order (SQLite serializes writes, so write order = event order)
- [ ] Make-up smoke test: bonus XP vs scheduled XP source tracking must correlate with visible Make-up conversions in calendar

### Expected Benefit

- Additional **~15–20%** habit-tap speedup on top of audit-fix-plan Phases 7 and 8 (beyond the current 8.2 cache + 8.3 deferred writes)
- Enables true parallelism for multi-source XP batches (e.g. habit tap that simultaneously triggers XP for habit + achievement + monthly challenge progress)
- Simpler mental model: no JS-side queue, all concurrency control at the DB layer

### Risks

- Higher testing burden than audit-fix-plan Phase 8 fixes — change is at the core of the XP flow
- Possible edge cases around `cachedXPData` consistency during parallel operations
- Any code that assumed strict event ordering (via the JS queue) must be verified

### Why Postponed

During Performance Audit Phase 8 (2026-04-20), Variant A was chosen (keep the queue, apply only the non-core optimizations 8.2 + 8.3). Rationale: audit Phases 7 + partial 8 already deliver the majority of the habit-tap speedup, and keeping the queue avoids any possibility of XP-total drift during rapid operations. The atomic-UPDATE refactor is preserved here for when the remaining ~15–20% matters (e.g., after user load scales up or when a future feature requires true parallel XP ingestion).

### When to Implement

- After the app is stable in production with current queue-based flow
- When a feature specifically benefits from parallel XP operations
- When there's time for comprehensive regression testing of the XP flow