/**
 * What the lab toolbar's trophy button plays, one after another: the trophy
 * scenarios of R-29 and the remaining celebrations (kolo 39). A lab tool only.
 */
import { useMemo } from 'react';
import { CELEBRATION_SCENARIOS, useLabCelebrate } from './celebrationDirector';
import { useOtherMoments } from './otherMoments';

export interface LabScenario {
  label: string;
  play: () => void;
}

export function useLabScenarios(): LabScenario[] {
  const celebrate = useLabCelebrate();
  const moments = useOtherMoments();
  return useMemo(
    () => [
      ...CELEBRATION_SCENARIOS.map(scenario => ({
        label: scenario.label,
        play: () => celebrate(scenario.batch),
      })),
      { label: 'new chapter: level 11', play: () => moments.levelUp(10, 11) },
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
    ],
    [celebrate, moments]
  );
}
