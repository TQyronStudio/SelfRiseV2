/**
 * Feeds `day_return` (days 1–7 after install) for the first-day funnel.
 *
 * Checked on launch AND whenever the app comes back to the foreground: plenty
 * of users never cold-start the app on day 2, they just switch back to it.
 * Each day is sent at most once, so calling this often is cheap and harmless.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { FirstDayAnalytics } from '../services/analytics';

export function useDayReturnTracking(): void {
  useEffect(() => {
    void FirstDayAnalytics.appActive();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void FirstDayAnalytics.appActive();
    });
    return () => subscription.remove();
  }, []);
}
