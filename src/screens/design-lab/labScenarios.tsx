/**
 * What the lab toolbar's trophy button plays, one after another: the trophy
 * scenarios of R-29 and the remaining celebrations (kolo 39). A lab tool only.
 */
import { useMemo } from 'react';
import { getXPRequiredForLevel } from '@/src/services/levelCalculation';
import {
  CELEBRATION_SCENARIOS,
  labTrophy,
  useLabCelebrate,
} from './celebrationDirector';
import { useOtherMoments } from './otherMoments';
import { useLabMultiplier } from './multiplierMock';
import { useLabChallenge } from './challengeMock';
import { useLabSystem } from './systemScreens';
import { MOCK_COPY } from './mockCopy';
import { useLab } from './labPrimitives';

export interface LabScenario {
  label: string;
  play: () => void;
}

export function useLabScenarios(): LabScenario[] {
  const celebrate = useLabCelebrate();
  const moments = useOtherMoments();
  const { setScenario, startBoost, welcomeBack } = useLabMultiplier();
  const { setCardState } = useLabChallenge();
  const { showProblem, showScreen } = useLabSystem();
  const { lang } = useLab();
  const system = MOCK_COPY[lang].system;
  return useMemo(
    () => [
      ...CELEBRATION_SCENARIOS.map(scenario => ({
        label: scenario.label,
        play: () => celebrate(scenario.batch),
      })),
      { label: 'new chapter: level 11', play: () => moments.levelUp(10, 11) },
      {
        // One action: an epic + a common trophy whose XP crosses into level 21 —
        // ONE window, the chapter with both trophies inside (kolo 46, L-8).
        label: 'epic + common open a new chapter (one window)',
        play: () =>
          moments.action(
            [
              labTrophy('monthly-master', 'epic'),
              labTrophy('first-habit', 'common'),
            ],
            getXPRequiredForLevel(21) - 100
          ),
      },
      { label: 'journal streak 7', play: () => moments.journalStreak(7) },
      {
        label: 'journal streak 14 (quiet, no XP)',
        play: () => moments.journalStreak(14),
      },
      {
        label: 'journal streak 21 (quiet)',
        play: () => moments.journalStreak(21),
      },
      { label: 'journal streak 100', play: () => moments.journalStreak(100) },
      { label: '2× XP switched on', play: () => moments.multiplier() },
      // The multiplier on the badge (kolo 44): open the badge to see each state.
      // Multipliers that switch on by themselves (kolo 53, L-11).
      {
        label: 'trophy combo: 3rd trophy today → 2.5× (in the note)',
        play: () =>
          celebrate(
            [labTrophy('first-habit', 'common')],
            startBoost('achievement_combo')
          ),
      },
      {
        label: 'trophy combo with an epic trophy (in the window)',
        play: () =>
          celebrate(
            [labTrophy('monthly-master', 'epic')],
            startBoost('achievement_combo')
          ),
      },
      { label: 'welcome back after 5 days (2× + 25 XP)', play: welcomeBack },
      {
        label: 'harmony 5 of 7 (badge: nothing)',
        play: () => setScenario('building'),
      },
      {
        label: '2× XP ready (note + dot)',
        play: () => setScenario('ready'),
      },
      {
        label: '2× XP running (tag)',
        play: () => setScenario('running'),
      },
      {
        label: 'harmony done, next one in 3 days',
        play: () => setScenario('cooldown'),
      },
      // The Home challenge card before its challenge (kolo 45, L-7).
      {
        label: 'challenge card: loading',
        play: () => setCardState('loading'),
      },
      {
        label: 'challenge card: preparing (fills itself)',
        play: () => setCardState('preparing'),
      },
      {
        label: 'challenge card: failed (Try again)',
        play: () => setCardState('error'),
      },
      // When something goes wrong (kolo 49, L-4).
      {
        label: 'save failed (note + Try again)',
        play: () =>
          showProblem({ message: system.saveFailed, retry: () => {} }),
      },
      {
        label: 'delete failed (note)',
        play: () => showProblem({ message: system.deleteFailed }),
      },
      { label: 'page not found', play: () => showScreen('notFound') },
      { label: 'database did not open', play: () => showScreen('database') },
    ],
    [
      celebrate,
      moments,
      setScenario,
      startBoost,
      welcomeBack,
      setCardState,
      showProblem,
      showScreen,
      system,
    ]
  );
}
