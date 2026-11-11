/**
 * Mock monthly challenges for the lab (kolo 36): four situations a user can be in,
 * built from the app's real templates (their texts come from the locales by
 * template id) and the real rules (challengeLogic.ts). Home's card and the detail
 * read the same one, so they can never disagree.
 *
 * The mock month is October 2026 (31 days) — the Home card says "October challenge".
 *
 * GOING LIVE: nothing from here. The challenge, its progress, the daily snapshots
 * and the star levels come from MonthlyChallengeService / MonthlyProgressTracker /
 * StarRatingService; texts through challengeDisplayText.ts.
 */
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import { StarLevel } from './challengeLogic';

export type ChallengeCategory = 'habits' | 'journal' | 'goals' | 'consistency';

export interface LabChallenge {
  /** Real template id — title, description and requirement text hang on it. */
  templateId: string;
  category: ChallengeCategory;
  stars: StarLevel;
  /** Made easy on purpose for a new user; gives no stars. */
  warmUp: boolean;
  /** One line per requirement; the first one feeds the calendar. */
  requirements: { done: number; target: number }[];
  /** Today's day of the month, and the month's length. */
  day: number;
  days: number;
  /** The first requirement's work per day, day 1 … today. */
  daily: number[];
  /** Months finished in a row before this one. */
  streakBefore: number;
}

export const CHALLENGE_SCENARIOS = [
  'onTrack',
  'behind',
  'warmUp',
  'done',
] as const;
export type ChallengeScenario = (typeof CHALLENGE_SCENARIOS)[number];

/** October 2026. */
export const CHALLENGE_MONTH = { year: 2026, month: 9, days: 31 } as const;

const CHALLENGES: Record<ChallengeScenario, LabChallenge> = {
  onTrack: {
    templateId: 'habits_consistency_master',
    category: 'habits',
    stars: 3,
    warmUp: false,
    requirements: [{ done: 46, target: 62 }],
    day: 22,
    days: CHALLENGE_MONTH.days,
    daily: [3, 2, 2, 3, 1, 0, 2, 3, 2, 2, 3, 2, 0, 1, 3, 2, 2, 3, 2, 3, 2, 3],
    streakBefore: 3,
  },
  behind: {
    templateId: 'consistency_triple_master',
    category: 'consistency',
    stars: 2,
    warmUp: false,
    requirements: [{ done: 9, target: 18 }],
    day: 22,
    days: CHALLENGE_MONTH.days,
    daily: [1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    streakBefore: 0,
  },
  warmUp: {
    templateId: 'journal_gratitude_guru',
    category: 'journal',
    stars: 1,
    warmUp: true,
    requirements: [{ done: 12, target: 30 }],
    day: 9,
    days: CHALLENGE_MONTH.days,
    daily: [2, 1, 0, 2, 1, 2, 1, 1, 2],
    streakBefore: 0,
  },
  done: {
    templateId: 'habits_consistency_master',
    category: 'habits',
    stars: 3,
    warmUp: false,
    requirements: [{ done: 62, target: 62 }],
    day: 27,
    days: CHALLENGE_MONTH.days,
    daily: [
      3, 2, 2, 3, 1, 0, 2, 3, 2, 2, 3, 2, 0, 1, 3, 2, 2, 3, 2, 3, 2, 3, 3, 4, 3,
      3, 3,
    ],
    streakBefore: 3,
  },
};

/** The user's star level per category ("Your challenge levels"). */
export const CHALLENGE_LEVELS: Record<ChallengeCategory, StarLevel> = {
  habits: 3,
  journal: 2,
  goals: 1,
  consistency: 2,
};

interface LabChallengeState {
  scenario: ChallengeScenario;
  challenge: LabChallenge;
  setScenario: (scenario: ChallengeScenario) => void;
}

const LabChallengeContext = createContext<LabChallengeState | null>(null);

export function LabChallengeProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ChallengeScenario>('onTrack');
  const value = useMemo(
    () => ({ scenario, challenge: CHALLENGES[scenario], setScenario }),
    [scenario]
  );
  return (
    <LabChallengeContext.Provider value={value}>
      {children}
    </LabChallengeContext.Provider>
  );
}

export function useLabChallenge(): LabChallengeState {
  const ctx = useContext(LabChallengeContext);
  if (!ctx) {
    throw new Error('useLabChallenge must be used inside LabChallengeProvider');
  }
  return ctx;
}
