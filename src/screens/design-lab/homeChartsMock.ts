/**
 * A made-up year of habit days for the statistics card (kolo 41). Deterministic,
 * so the lab looks the same every time; today's entry comes from the lab's live
 * checks, so ticking a habit on Home moves the last bar.
 *
 * GOING LIVE: nothing from here — the days come from useHabitsData.
 */
import { DayStat } from './homeChartsLogic';

export interface LabDay extends DayStat {
  date: Date;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
}

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 365 days, oldest first; the last one is today. */
export function mockYear(todayDone: number, todayScheduled: number): LabDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: LabDay[] = [];
  for (let back = 364; back >= 0; back--) {
    const date = new Date(today);
    date.setDate(today.getDate() - back);
    const weekday = (date.getDay() + 6) % 7;
    if (back === 0) {
      days.push({
        date,
        weekday,
        scheduled: todayScheduled,
        done: Math.min(todayDone, todayScheduled),
        bonus: 0,
      });
      continue;
    }
    // Weekends are lighter; the further back, the patchier — a user who grew.
    const scheduled = weekday >= 5 ? 3 : 5;
    const reliability = 0.55 + 0.35 * (1 - back / 364);
    let done = 0;
    for (let k = 0; k < scheduled; k++) {
      if (rand(back * 7 + k) < reliability) done++;
    }
    // A stretch away from the app last spring, and the odd day off.
    if ((back > 210 && back < 222) || rand(back + 0.5) < 0.04) done = 0;
    const bonus = done === scheduled && rand(back * 3.3) < 0.3 ? 1 : 0;
    days.push({ date, weekday, scheduled, done, bonus });
  }
  return days;
}
