import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AdBanner } from '@/src/components/ads/AdBanner';
import { JournalPage } from '@/src/components/journal/JournalPage';
import { EntryType } from '@/src/components/journal/EntryCard';
import { useMomentNotes } from '@/src/components/xp/XpDisplay';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { ModalPriority, useModalQueue } from '@/src/contexts/ModalQueueContext';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { streakMomentSize } from '@/src/services/moments/momentRules';
import { getJournalStreakReward } from '@/src/utils/journalStreakMilestones';
import { JOURNAL_DAILY_GOAL, journalMilestoneXp } from '@/src/utils/journalXp';

/** Room kept at the bottom for the ad banner (as on the other tabs). */
const BANNER_ROOM = 60;

/**
 * My Journal (migration E12: the page is JournalPage). This screen keeps what
 * happens AFTER an entry is stored:
 * - the third entry completes the day in place on the Today card (R-13 — no
 *   "daily complete" window any more), and the streak moment follows: a window
 *   for 7 / 30 / 100 / 365 / 1000 days, a quiet note otherwise (E10, R-40);
 * - entries 4, 8 and 13 open the ⭐ 🔥 👑 window and count the milestone;
 * - the ad banner hides while the keyboard is up (the most personal moment of
 *   the app has no ad next to the keyboard — P30);
 * - `?quickAction=addGratitude|addSelfPraise` from Home opens the writing sheet.
 */
export default function JournalScreen() {
  const { t } = useI18n();
  const { c } = useDesign();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { actions } = useGratitude();
  const { enqueue: enqueueModal } = useModalQueue();
  const { showPlainNote } = useMomentNotes();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [openWrite, setOpenWrite] = useState<{ type: EntryType; key: number } | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Quick actions from Home: open the writing sheet, then clear the parameter.
  useEffect(() => {
    const action = params.quickAction;
    if (action !== 'addGratitude' && action !== 'addSelfPraise') return;
    setOpenWrite({
      type: action === 'addGratitude' ? 'gratitude' : 'self-praise',
      key: Date.now(),
    });
    router.setParams({ quickAction: undefined });
  }, [params.quickAction, router]);

  const handleAdded = useCallback(
    (count: number) => {
      if (count === JOURNAL_DAILY_GOAL) {
        // The streak AFTER today's entry — refreshStats returns it fresh.
        setTimeout(async () => {
          const fresh = await actions.refreshStats();
          const streak = fresh?.currentStreak || 0;
          const size = streakMomentSize(streak);
          if (size === 'window') {
            enqueueModal({
              type: 'celebration_streak_milestone',
              priority: ModalPriority.ACTIVITY_CELEBRATION,
              props: { streakDays: streak },
            });
          } else if (size === 'quiet') {
            showPlainNote({
              icon: 'flame',
              overline: t('journal.streakMoment.overline'),
              title: t('journal.streakMoment.days', { count: streak }),
              xp: getJournalStreakReward(streak),
            });
          }
        }, 1000);
      }

      // ⭐ 🔥 👑 at entries 4, 8 and 13 (bonus 1, 5 and 10).
      const xpAmount = journalMilestoneXp(count);
      if (xpAmount > 0) {
        const bonusCount = count - JOURNAL_DAILY_GOAL;
        Keyboard.dismiss();
        enqueueModal({
          type: 'celebration_bonus_milestone',
          priority: ModalPriority.ACTIVITY_CELEBRATION,
          props: { bonusCount, xpAmount },
        });
        setTimeout(async () => {
          await actions.incrementMilestoneCounter(bonusCount);
          await actions.refreshStats();
        }, 500);
      }
    },
    [actions, enqueueModal, showPlainNote, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: c.canvas }]}>
      <JournalPage bottomInset={BANNER_ROOM} openWrite={openWrite} onAdded={handleAdded} />
      {!isKeyboardVisible && (
        <View style={[styles.banner, { backgroundColor: c.canvas }]}>
          <AdBanner />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
