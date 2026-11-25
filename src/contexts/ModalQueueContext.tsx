/**
 * ModalQueueContext - Centralized Modal Queue System
 *
 * Replaces the fragile 4-Tier Modal Coordination System.
 * Guarantees: only ONE <Modal visible={true}> at any time.
 *
 * How it works:
 * 1. Any component calls enqueue() with modal type, priority, and props
 * 2. Queue sorts by priority (lower number = higher priority)
 * 3. Renders the first item in queue as visible modal
 * 4. When user closes modal → closeCurrentModal() → next in queue shows
 * 5. No flags, no setTimeout race conditions, no iOS freeze
 *
 * ⚠️ INVARIANT: the head of the queue is PINNED once it has been presented.
 * Priority orders the modals that are still WAITING; it must never yank the modal
 * the user is currently looking at off the screen. Swapping the presented modal
 * mid-flight unmounts one <Modal> while mounting another in the same frame, which
 * deadlocks iOS. See the pinning logic in enqueue().
 */

import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { insertModal } from './modalQueueOrdering';
import { DeviceEventEmitter, View, StyleSheet, Platform } from 'react-native';
import { WINDOW_LAYER_Z } from './windowLayer';
import { TrophyWindow } from '../components/achievements/TrophyWindow';
import {
  BonusEntryWindow,
  ChapterWindow,
  GoalDoneWindow,
  MultiplierWindow,
  StreakWindow,
} from '../components/moments/MomentWindows';
import { goalCompletionXP } from '../constants/gamification';
import MonthlyChallengeCompletionModal from '../components/challenges/MonthlyChallengeCompletionModal';
import MonthlyChallengeFailureModal from '../components/challenges/MonthlyChallengeFailureModal';
import MonthlyChallengeMilestoneModal from '../components/challenges/MonthlyChallengeMilestoneModal';
import StarLevelChangeModal from '../components/challenges/StarLevelChangeModal';
import { MultiplierActivationModal } from '../components/gamification/MultiplierActivationModal';

// ========================================
// TYPES
// ========================================

/**
 * Priority levels for celebration modals.
 * Lower number = shown first when multiple modals arrive simultaneously.
 */
export enum ModalPriority {
  ACTIVITY_CELEBRATION = 1,  // Journal streak_milestone, bonus_milestone (the day's third entry is celebrated in place, R-13)
  GOAL_COMPLETION = 2,       // Goal reaches 100%
  MONTHLY_CHALLENGE = 3,     // Monthly challenge completion, milestone 25/50/75%
  STAR_LEVEL_CHANGE = 4,     // Star promotion/demotion
  MULTIPLIER_ACTIVATION = 5, // XP multiplier activated
  ACHIEVEMENT = 6,           // Achievement unlocked
  LEVEL_UP = 7,              // Level-up celebration (lowest priority)
}

export type ModalType =
  | 'celebration_streak_milestone'
  | 'celebration_bonus_milestone'
  | 'goal_completion'
  | 'monthly_challenge_completion'
  | 'monthly_challenge_failure'
  | 'monthly_challenge_milestone'
  | 'star_level_change'
  | 'multiplier_activation'
  | 'achievement'
  | 'level_up';

export interface QueuedModal {
  id: string;
  type: ModalType;
  priority: ModalPriority;
  props: Record<string, any>;
  timestamp: number;
}

export interface ModalQueueContextValue {
  /** Add a modal to the queue. It will show when it's the highest priority in line. */
  enqueue: (modal: Omit<QueuedModal, 'id' | 'timestamp'>) => void;
  /** Close the currently visible modal and show the next one in queue. */
  closeCurrentModal: () => void;
  /** The currently displayed modal (first in queue), or null if queue is empty. */
  currentModal: QueuedModal | null;
  /** Number of modals waiting in queue (including current). */
  queueLength: number;
  /**
   * The types in the queue, current first (E7: the XP badge holds a moment's XP
   * while its window is queued or showing — xpLedger.expireHeld).
   */
  queuedTypes: ModalType[];
}

// ========================================
// CONTEXT
// ========================================

const ModalQueueContext = createContext<ModalQueueContextValue | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

interface ModalQueueProviderProps {
  children: React.ReactNode;
}

export const ModalQueueProvider: React.FC<ModalQueueProviderProps> = ({ children }) => {
  const [queue, setQueue] = useState<QueuedModal[]>([]);
  const queueRef = useRef<QueuedModal[]>([]);
  queueRef.current = queue;

  // Id of the modal React has actually COMMITTED to the screen (see the pinning rule
  // in enqueue). useEffect runs after commit, so during a same-tick burst of enqueues
  // this still holds the previous value — which is exactly what we want.
  const presentedIdRef = useRef<string | null>(null);
  useEffect(() => {
    presentedIdRef.current = queue[0]?.id ?? null;
  }, [queue]);

  const enqueue = useCallback((modal: Omit<QueuedModal, 'id' | 'timestamp'>) => {
    const id = `modal_${modal.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newModal: QueuedModal = {
      ...modal,
      id,
      timestamp: Date.now(),
    };

    console.log(`📥 ModalQueue: enqueue ${modal.type} (priority ${modal.priority})`);

    setQueue(prev => {
      // De-dupe achievement celebrations: AchievementService emits both
      // 'achievementUnlocked' (per achievement) and 'multipleAchievementsUnlocked'
      // (batch), and both end up calling addToCelebrationQueue — the same
      // achievement would otherwise be enqueued (and shown) twice.
      if (modal.type === 'achievement') {
        const achievementId = modal.props?.['achievement']?.id;
        const alreadyQueued = prev.some(
          m => m.type === 'achievement' && m.props?.['achievement']?.id === achievementId
        );
        if (achievementId && alreadyQueued) {
          console.log(`🚫 ModalQueue: skipping duplicate achievement enqueue (${achievementId})`);
          return prev;
        }
      }

      // Priority orders what is WAITING; the window on screen is never yanked
      // (it froze iOS — the full story in modalQueueOrdering.ts).
      const updated = insertModal(prev, newModal, presentedIdRef.current);

      console.log(`📋 ModalQueue: ${updated.length} items - [${updated.map(m => m.type).join(', ')}]`);
      return updated;
    });
  }, []);

  const closeCurrentModal = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const closed = prev[0];
      const remaining = prev.slice(1);
      console.log(`✅ ModalQueue: closed ${closed?.type} (${remaining.length} remaining)`);

      // Emit events needed by other systems
      if (closed?.type === 'achievement') {
        DeviceEventEmitter.emit('achievementCelebrationClosed');
      }
      if (closed?.type === 'star_level_change') {
        DeviceEventEmitter.emit('star_level_modal_closed');
      }

      return remaining;
    });
  }, []);

  // 🚀 PERFORMANCE: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ModalQueueContextValue>(() => ({
    enqueue,
    closeCurrentModal,
    currentModal: queue.length > 0 ? queue[0]! : null,
    queueLength: queue.length,
    queuedTypes: queue.map(m => m.type),
  }), [queue, enqueue, closeCurrentModal]);

  return (
    <ModalQueueContext.Provider value={contextValue}>
      {children}
      {/* The queue's output is drawn by <ModalQueueOutlet/> in the root layout's
          window layer (plan 6.0, layer 4 — migration E8): above the onboarding,
          under the XP sparks. Still only ONE modal at a time. */}
    </ModalQueueContext.Provider>
  );
};

// ========================================
// MODAL RENDERER - renders the correct component based on currentModal.type
// ========================================

interface ModalRendererProps {
  currentModal: QueuedModal | null;
  onClose: () => void;
}

/** The window layer (layer 4): renders the queue head. Mount it once, in the root layout. */
export function ModalQueueOutlet() {
  const { currentModal, closeCurrentModal } = useModalQueue();
  if (!currentModal) return null;
  // Above the onboarding takeover (zIndex / elevation 9999 in OnboardingFlow,
  // WelcomeScreen, DayOneCelebration, FirstCheckCard): React Native stacks by
  // zIndex (iOS) / elevation (Android), not by sibling order. The onboarding
  // waits for its first trophy window to be CLOSED — hidden under the takeover
  // it could not be (review 2026-11-24).
  return (
    <View style={outletStyles.layer} pointerEvents="box-none">
      <ModalRenderer currentModal={currentModal} onClose={closeCurrentModal} />
    </View>
  );
}

const outletStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: WINDOW_LAYER_Z,
    ...Platform.select({ android: { elevation: WINDOW_LAYER_Z }, default: {} }),
  },
});

const ModalRenderer: React.FC<ModalRendererProps> = ({ currentModal, onClose }) => {
  if (!currentModal) return null;

  const { id, type, props } = currentModal;

  // 🔑 KEY FIX: each queued modal gets a unique `key` (its queue id).
  // `visible` is always `true` here, so without a key change React reuses
  // the same component instance when the queue advances to the next item —
  // entrance-animation effects (deps: [visible, ...]) never re-fire, so the
  // new modal renders with the PREVIOUS modal's "closed" animation values
  // (scale/opacity 0). It becomes an invisible-but-still-touch-blocking
  // overlay, which looks exactly like the app "freezing" after dismissing
  // a celebration modal. Keying by `id` forces a clean remount per item.
  switch (type) {
    // --- Journal celebrations (the third entry is celebrated in place, R-13) ---
    // E10: the windows below are views in the window layer (MomentWindows).
    case 'celebration_streak_milestone':
      return <StreakWindow key={id} days={props.streakDays} onClose={onClose} />;

    case 'celebration_bonus_milestone':
      return (
        <BonusEntryWindow key={id} bonusCount={props.bonusCount} xp={props.xpAmount ?? 0} onClose={onClose} />
      );

    // --- New chapter (a tier begins; may carry the trophies of its action) ---
    case 'level_up':
      if (!props.tier) return null;
      return (
        <ChapterWindow
          key={id}
          level={props.level}
          tierId={props.tier}
          also={props.also ?? []}
          xp={props.xp ?? 0}
          onClose={onClose}
        />
      );

    // --- Goal completion ---
    case 'goal_completion':
      return (
        <GoalDoneWindow key={id} goal={props.goal} xp={goalCompletionXP(props.goal.targetValue)} onClose={onClose} />
      );

    // --- Monthly challenge ---
    case 'monthly_challenge_completion':
      return (
        <MonthlyChallengeCompletionModal
          key={id}
          visible={true}
          challenge={props.challenge}
          completionResult={props.completionResult}
          onClose={onClose}
        />
      );

    case 'monthly_challenge_failure':
      return (
        <MonthlyChallengeFailureModal
          key={id}
          visible={true}
          failureResult={props.failureResult}
          onClose={onClose}
        />
      );

    case 'monthly_challenge_milestone':
      return (
        <MonthlyChallengeMilestoneModal
          key={id}
          visible={true}
          milestone={props.milestone}
          challengeTitle={props.challengeTitle}
          challengeTemplateId={props.challengeTemplateId}
          xpAwarded={props.xpAwarded}
          onClose={onClose}
        />
      );

    // --- Star level change ---
    case 'star_level_change':
      return (
        <StarLevelChangeModal
          key={id}
          visible={true}
          data={props.data}
          onClose={onClose}
        />
      );

    // --- Multiplier activation ---
    case 'multiplier_activation':
      // The harmony multiplier has its new window; the challenge's keeps the old
      // one until E18 tells it inside the challenge window.
      if (props.multiplier?.source === 'harmony_streak') {
        return <MultiplierWindow key={id} onClose={onClose} />;
      }
      return (
        <MultiplierActivationModal
          key={id}
          visible={true}
          multiplier={props.multiplier}
          harmonyStreakLength={props.harmonyStreakLength}
          bonusXP={props.bonusXP}
          onClose={onClose}
          showShare={false}
        />
      );

    // --- Achievement ---
    case 'achievement':
      return (
        // E8: a view in the window layer, not an RN <Modal> (plan 6.0).
        <TrophyWindow
          key={id}
          onClose={onClose}
          achievement={props.achievement}
          xpAwarded={props.xpAwarded}
          also={props.also}
          boost={props.boost}
        />
      );

    default:
      console.warn(`⚠️ ModalQueue: unknown modal type "${type}"`);
      return null;
  }
};

// ========================================
// HOOK
// ========================================

export const useModalQueue = (): ModalQueueContextValue => {
  const context = useContext(ModalQueueContext);
  if (context === undefined) {
    throw new Error('useModalQueue must be used within a ModalQueueProvider');
  }
  return context;
};
