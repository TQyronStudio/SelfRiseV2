/**
 * The XP multiplier's scenery for the Design Lab (kolo 44, L-10): the harmony days,
 * a running multiplier, its cooldown — and switching it on. Rules: multiplierLogic.ts.
 *
 * - The badge reads `status` (tag while running, dot while ready).
 * - The level panel reads `status` and `today` and offers `activate`.
 * - When it becomes ready, ONE quiet note slides out of the badge with "Switch on".
 * - `activate` starts the multiplier and plays the approved window (R-41).
 * - `setScenario` is the lab toolbar's way to every state.
 *
 * GOING LIVE: do NOT port this file. Status comes from XPMultiplierService
 * (getActiveMultiplier, calculateHarmonyStreak); `activate` is
 * activateHarmonyMultiplier(); the announced readiness is stored (shouldAnnounceReady).
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { XP_MULTIPLIERS, XP_REWARDS } from '@/src/constants/gamification';
import { useLabMoments } from './celebrationDirector';
import { useLabToday } from './habitsMock';
import { DAILY_GOAL, useLabJournal } from './journalMock';
import { useLab } from './labPrimitives';
import { MOCK_COPY } from './mockCopy';
import {
  boostOf,
  formatFactor,
  MultiplierSource,
  MultiplierState,
  multiplierStatus,
  MultiplierStatus,
  shouldAnnounceReady,
} from './multiplierLogic';
import { MultiplierWindow } from './otherMoments';

const REQUIRED = XP_MULTIPLIERS.HARMONY_STREAK_DAYS_REQUIRED;

export type MultiplierScenario = 'building' | 'ready' | 'running' | 'cooldown';

const SCENARIOS: Record<MultiplierScenario, MultiplierState> = {
  building: { harmonyDays: 5, running: null, cooldownHoursLeft: 0 },
  ready: { harmonyDays: REQUIRED, running: null, cooldownHoursLeft: 0 },
  running: {
    harmonyDays: 3,
    running: {
      factor: XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER,
      minutesLeft: 14 * 60 + 20,
    },
    cooldownHoursLeft: 6 * 24,
  },
  cooldown: { harmonyDays: REQUIRED, running: null, cooldownHoursLeft: 50 },
};

interface LabMultiplier {
  status: MultiplierStatus;
  /** Which of today's three a harmony day needs are done. */
  today: { habits: boolean; journal: boolean; goals: boolean };
  /** "2×" / "1,5×" in the lab's language. */
  print: (factor: number) => string;
  activate: () => void;
  setScenario: (scenario: MultiplierScenario) => void;
  /** A multiplier that switches on by itself (L-11): the badge shows it at once. */
  startBoost: (source: MultiplierSource) => { factor: string; hours: number };
  /** The comeback boost at app start: running 2× and a quiet "Welcome back" note. */
  welcomeBack: () => void;
}

const LabMultiplierContext = createContext<LabMultiplier | null>(null);

export function LabMultiplierProvider({ children }: { children: ReactNode }) {
  const { lang } = useLab();
  const copy = MOCK_COPY[lang];
  const { showNote, showWindow } = useLabMoments();
  const { done } = useLabToday();
  const journal = useLabJournal();
  // The lab opens on what it showed before kolo 44: a 2× running.
  const [state, setState] = useState<MultiplierState>(SCENARIOS.running);
  const [readyKey, setReadyKey] = useState(0);
  const [announcedFor, setAnnouncedFor] = useState<string | null>(null);

  const status = useMemo(() => multiplierStatus(state, REQUIRED), [state]);
  const today = useMemo(
    () => ({
      habits: Object.values(done).some(Boolean),
      // The app's rule: three entries (xpMultiplierService, hasJournalActivity).
      journal: journal.todayCount >= DAILY_GOAL,
      // Kulisy: no goal progress logged today.
      goals: false,
    }),
    [done, journal.todayCount]
  );
  const decimal = (1.5).toLocaleString(copy.locale).charAt(1);
  const print = useCallback(
    (factor: number) => formatFactor(factor, decimal),
    [decimal]
  );

  // Only a READY multiplier can be switched on — a late tap on an old note, or
  // a second tap, does nothing (live: activateHarmonyMultiplier refuses too).
  const statusRef = useRef(status);
  statusRef.current = status;
  const activate = useCallback(() => {
    if (statusRef.current.kind !== 'ready') return;
    statusRef.current = {
      kind: 'building',
      days: 0,
      required: REQUIRED,
      cooldownDays: 0,
    };
    setState(prev => ({
      ...prev,
      running: {
        factor: XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER,
        minutesLeft: XP_MULTIPLIERS.HARMONY_STREAK_DURATION * 60,
      },
      cooldownHoursLeft: XP_MULTIPLIERS.HARMONY_STREAK_COOLDOWN,
    }));
    showWindow(close => <MultiplierWindow onClosed={close} />);
  }, [showWindow]);

  const startBoost = useCallback(
    (source: MultiplierSource) => {
      const boost = boostOf(source);
      setState(prev => ({
        ...prev,
        running: { factor: boost.factor, minutesLeft: boost.hours * 60 },
      }));
      // Printed without the sign – the texts add the ×.
      return {
        factor: boost.factor.toLocaleString(copy.locale),
        hours: boost.hours,
      };
    },
    [copy.locale]
  );

  const welcomeBack = useCallback(() => {
    const { factor, hours } = startBoost('inactive_user_return');
    showNote({
      icon: 'sunny',
      overline: copy.moments.welcomeBack,
      title: copy.moments.multiplierTitle(factor, hours),
      // The app pays it before the 2× starts (O-16), so it is never doubled.
      xp: XP_REWARDS.SPECIAL.COMEBACK_BONUS,
    });
  }, [startBoost, showNote, copy.moments]);

  const setScenario = useCallback((scenario: MultiplierScenario) => {
    setState(SCENARIOS[scenario]);
    // A new readiness each time the lab makes it ready (live: a new streak start).
    if (scenario === 'ready') setReadyKey(k => k + 1);
  }, []);

  // One quiet note per readiness — the dot and the panel keep the offer after it.
  const words = useRef({ copy, print, activate });
  words.current = { copy, print, activate };
  useEffect(() => {
    const key = `lab-${readyKey}`;
    if (!shouldAnnounceReady(status, key, announcedFor)) return;
    setAnnouncedFor(key);
    const { copy: text, print: printed, activate: run } = words.current;
    const factor = printed(XP_MULTIPLIERS.HARMONY_STREAK_MULTIPLIER);
    showNote({
      icon: 'flash',
      overline: text.moments.multiplierOverline(REQUIRED),
      title: text.levelPanel.readyTitle(factor),
      xp: 0,
      action: { label: text.levelPanel.noteAction, run },
    });
  }, [status, readyKey, announcedFor, showNote]);

  const value = useMemo(
    () => ({
      status,
      today,
      print,
      activate,
      setScenario,
      startBoost,
      welcomeBack,
    }),
    [status, today, print, activate, setScenario, startBoost, welcomeBack]
  );
  return (
    <LabMultiplierContext.Provider value={value}>
      {children}
    </LabMultiplierContext.Provider>
  );
}

export function useLabMultiplier(): LabMultiplier {
  const ctx = useContext(LabMultiplierContext);
  if (!ctx)
    throw new Error(
      'useLabMultiplier must be used inside LabMultiplierProvider'
    );
  return ctx;
}
