/**
 * Today's date (local `YYYY-MM-DD`) that follows the clock: it changes at
 * midnight while the screen is open, and when the app comes back to the
 * foreground on a later day. A value computed once per render goes stale when
 * nothing re-renders over midnight (review of E14: a quick goal log at 00:10
 * was dated yesterday).
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { today as todayString } from '@/src/utils/date';

/** Milliseconds until the next local midnight (+1 s of margin). */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 1000;
}

export function useToday(): string {
  const [today, setToday] = useState(todayString);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setToday(prev => {
      const now = todayString();
      return now === prev ? prev : now;
    });
    const schedule = () => {
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilMidnight());
    };
    schedule();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        clearTimeout(timer);
        schedule();
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
