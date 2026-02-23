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
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import CelebrationModal from '../components/gratitude/CelebrationModal';
import { AchievementCelebrationModal } from '../components/achievements/AchievementCelebrationModal';
import { GoalCompletionModal } from '../components/goals/GoalCompletionModal';
import MonthlyChallengeCompletionModal from '../components/challenges/MonthlyChallengeCompletionModal';
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
  ACTIVITY_CELEBRATION = 1,  // Journal daily_complete, streak_milestone, bonus_milestone
  GOAL_COMPLETION = 2,       // Goal reaches 100%
  MONTHLY_CHALLENGE = 3,     // Monthly challenge completion, milestone 25/50/75%
  STAR_LEVEL_CHANGE = 4,     // Star promotion/demotion
  MULTIPLIER_ACTIVATION = 5, // XP multiplier activated
  ACHIEVEMENT = 6,           // Achievement unlocked
  LEVEL_UP = 7,              // Level-up celebration (lowest priority)
}

export type ModalType =
  | 'celebration_daily_complete'
  | 'celebration_streak_milestone'
  | 'celebration_bonus_milestone'
  | 'goal_completion'
  | 'monthly_challenge_completion'
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

  const enqueue = useCallback((modal: Omit<QueuedModal, 'id' | 'timestamp'>) => {
    const id = `modal_${modal.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newModal: QueuedModal = {
      ...modal,
      id,
      timestamp: Date.now(),
    };

    console.log(`📥 ModalQueue: enqueue ${modal.type} (priority ${modal.priority})`);

    setQueue(prev => {
      // Insert sorted by priority (lower = first), stable sort by timestamp for same priority
      const updated = [...prev, newModal].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.timestamp - b.timestamp;
      });

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

  const currentModal: QueuedModal | null = queue.length > 0 ? queue[0]! : null;

  const contextValue: ModalQueueContextValue = {
    enqueue,
    closeCurrentModal,
    currentModal,
    queueLength: queue.length,
  };

  return (
    <ModalQueueContext.Provider value={contextValue}>
      {children}
      {/* Centralized modal rendering - only ONE modal visible at a time */}
      <ModalRenderer currentModal={currentModal} onClose={closeCurrentModal} />
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

const ModalRenderer: React.FC<ModalRendererProps> = ({ currentModal, onClose }) => {
  if (!currentModal) return null;

  const { type, props } = currentModal;

  switch (type) {
    // --- Journal celebrations ---
    case 'celebration_daily_complete':
      return (
        <CelebrationModal
          visible={true}
          onClose={onClose}
          type="daily_complete"
          disableXpAnimations={false}
        />
      );

    case 'celebration_streak_milestone':
      return (
        <CelebrationModal
          visible={true}
          onClose={onClose}
          type="streak_milestone"
          streakDays={props.streakDays}
          title={props.title}
          message={props.message}
          disableXpAnimations={false}
        />
      );

    case 'celebration_bonus_milestone':
      return (
        <CelebrationModal
          visible={true}
          onClose={onClose}
          type="bonus_milestone"
          bonusCount={props.bonusCount}
          xpAmount={props.xpAmount}
          disableXpAnimations={false}
        />
      );

    // --- Level-up ---
    case 'level_up':
      return (
        <CelebrationModal
          visible={true}
          onClose={onClose}
          type="level_up"
          levelUpData={{
            previousLevel: props.newLevel - 1,
            newLevel: props.newLevel,
            levelTitle: props.levelTitle,
            ...(props.levelDescription && { levelDescription: props.levelDescription }),
            isMilestone: props.isMilestone || false,
          }}
          disableXpAnimations={false}
        />
      );

    // --- Goal completion ---
    case 'goal_completion':
      return (
        <GoalCompletionModal
          visible={true}
          goal={props.goal}
          onClose={onClose}
        />
      );

    // --- Monthly challenge ---
    case 'monthly_challenge_completion':
      return (
        <MonthlyChallengeCompletionModal
          visible={true}
          challenge={props.challenge}
          completionResult={props.completionResult}
          onClose={onClose}
        />
      );

    case 'monthly_challenge_milestone':
      return (
        <MonthlyChallengeMilestoneModal
          visible={true}
          milestone={props.milestone}
          challengeTitle={props.challengeTitle}
          xpAwarded={props.xpAwarded}
          onClose={onClose}
        />
      );

    // --- Star level change ---
    case 'star_level_change':
      return (
        <StarLevelChangeModal
          visible={true}
          data={props.data}
          onClose={onClose}
        />
      );

    // --- Multiplier activation ---
    case 'multiplier_activation':
      return (
        <MultiplierActivationModal
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
        <AchievementCelebrationModal
          visible={true}
          onClose={onClose}
          achievement={props.achievement}
          xpAwarded={props.xpAwarded}
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
