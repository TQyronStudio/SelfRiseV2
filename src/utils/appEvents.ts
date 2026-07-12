// Typed App Event Bus (audit N8, July 2026)
//
// WHY: 27 files communicate through DeviceEventEmitter with bare string event
// names. A typo in an event name is a SILENT failure — the emit happens, no
// listener hears it, nothing errors anywhere. This exact bug class produced
// the dead 'challengeCompleted' listener on the Home screen (nobody emits
// that name; the real event is 'monthly_challenge_completed').
//
// This wrapper adds compile-time safety with ZERO runtime change: it is a
// thin typed façade over the same DeviceEventEmitter channel, so typed and
// legacy call sites interoperate freely and migration can be gradual.
//
// RULES:
// 1. New events MUST be declared in AppEvents below — never emit a bare
//    string that isn't in this map.
// 2. New code uses emitAppEvent / addAppEventListener. Legacy call sites
//    may keep using DeviceEventEmitter until touched (same channel).
// 3. Payload changes belong HERE first — the compiler then finds consumers.

import { DeviceEventEmitter, EmitterSubscription } from 'react-native';
import { XPSourceType, AchievementCategory } from '../types/gamification';

// ========================================
// PAYLOAD TYPES
// ========================================

export interface XpGainedPayload {
  amount: number;
  source: XPSourceType;
  sourceId?: string | undefined;
  metadata?: Record<string, any> | undefined;
  position?: { x: number; y: number } | undefined;
  timestamp: number;
}

export interface XpBatchCommittedPayload {
  totalAmount: number;
  /** Sources that contributed to the committed batch */
  batchedSources?: XPSourceType[] | undefined;
  [key: string]: any; // legacy emitters attach extra fields
}

export interface LevelUpPayload {
  newLevel: number;
  previousLevel?: number | undefined;
  levelTitle?: string | undefined;
  isMilestone?: boolean | undefined;
  [key: string]: any; // emitted from several sites with slight variations
}

export interface XpMultiplierActivatedPayload {
  multiplier: number;
  source: string;
  expiresAt?: Date | string | undefined;
  [key: string]: any;
}

export interface MonthlyProgressUpdatedPayload {
  challengeId: string;
  challengeTitle: string;
  previousProgress: Record<string, number>;
  newProgress: Record<string, number>;
  completionPercentage: number;
  daysActive: number;
  daysRemaining: number;
  activeDays: string[];
  milestones: unknown[];
  source: XPSourceType;
  amount: number;
  timestamp: Date;
}

export interface MonthlyMilestoneReachedPayload {
  challengeId: string;
  challengeTitle: string;
  milestone: 25 | 50 | 75;
  xpAwarded: number;
  requirements: Record<string, number>;
  timestamp: Date;
  celebrationType: string;
}

export interface MonthlyChallengeCompletedPayload {
  challengeId: string;
  completed: boolean;
  xpEarned: number;
  completedAt: Date;
  baseXP: number;
  streakBonus: number;
  totalXPEarned: number;
  completionPercentage: number;
  requirementsCompleted: number;
  activeDays: number;
  milestonesReached: number;
  oldStarLevel: number;
  newStarLevel: number;
  starLevelChanged: boolean;
  [key: string]: any;
}

export interface StarLevelChangedPayload {
  category: AchievementCategory;
  previousStars: number;
  newStars: number;
  reason: string;
  [key: string]: any;
}

// ========================================
// EVENT MAP — the single source of truth for event names & payloads
// ========================================

export interface AppEvents {
  // --- XP / gamification core ---
  xpGained: XpGainedPayload;
  xpBatchCommitted: XpBatchCommittedPayload;
  xpSmartNotification: { amount: number; source: XPSourceType; timestamp: number };
  levelUp: LevelUpPayload;
  xpMultiplierActivated: XpMultiplierActivatedPayload;

  // --- Achievements ---
  achievementUnlocked: { achievement: unknown; [key: string]: any };
  multipleAchievementsUnlocked: { achievements: unknown[]; [key: string]: any };
  achievementCelebrationClosed: Record<string, never> | undefined;

  // --- Monthly challenges ---
  monthly_progress_updated: MonthlyProgressUpdatedPayload;
  monthly_milestone_reached: MonthlyMilestoneReachedPayload;
  monthly_challenge_completed: MonthlyChallengeCompletedPayload;
  monthly_challenge_failed: { challengeId: string; [key: string]: any };
  monthly_challenge_challenge_generated: { challengeId?: string; [key: string]: any };

  // --- Star rating ---
  star_level_changed: StarLevelChangedPayload;
  star_level_modal_closed: Record<string, never> | undefined;

  // --- UI / misc ---
  openHomeCustomization: Record<string, never> | undefined;
  tutorial_scroll_to: { target?: string; [key: string]: any };
  tutorial_scroll_completed: { target?: string; [key: string]: any };
  marketing_demo_data_loaded: Record<string, never> | undefined;
  marketing_demo_data_cleared: Record<string, never> | undefined;
}

export type AppEventName = keyof AppEvents;

// ========================================
// TYPED FAÇADE (same channel as DeviceEventEmitter — interoperable)
// ========================================

export function emitAppEvent<K extends AppEventName>(
  event: K,
  ...payload: AppEvents[K] extends undefined ? [] : [AppEvents[K]]
): void {
  DeviceEventEmitter.emit(event, ...payload);
}

export function addAppEventListener<K extends AppEventName>(
  event: K,
  handler: (payload: AppEvents[K]) => void
): EmitterSubscription {
  return DeviceEventEmitter.addListener(event, handler);
}
