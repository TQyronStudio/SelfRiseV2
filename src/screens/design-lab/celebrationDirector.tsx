/**
 * One celebration per action (premium-design-plan.md, R-29, kolo 33).
 *
 * Testers: "it pops one after another, it is too much". One tap could raise two or
 * three trophy windows and a level-up on top. The rule here:
 *
 *   one action → one moment.
 *
 * - Something epic or legendary in the action: the BIG window, once, for the
 *   rarest trophy. Everything else from that action rides inside it ("Also
 *   unlocked"), and their XP is added to the one number that flies home.
 * - Only common or rare: no window at all. A quiet note slides out of the level
 *   badge — medal, name, XP — holds a few seconds and slides back; its XP flies
 *   into the badge as it goes. Rare holds longer, with a stronger haptic and its
 *   colour. Several at once = one note ("2 trophies unlocked").
 * - A level up is never its own window: the XP lands in the badge, which already
 *   shows LEVEL UP. (Milestone levels get their own design next, R-10.)
 * - No timed pauses between windows: a celebration that comes late falls flat.
 *   Moments from DIFFERENT actions wait in line; quiet ones waiting together fold
 *   into one note.
 *
 * Accessibility: every moment is announced with the real texts; the note is a
 * button (opens the Trophy Room) and its content stays in the room, so the time
 * limit hides nothing. Reduce motion: the note fades, nothing slides.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - The batch is what one evaluation unlocks: AchievementService already emits all
 *   unlocks of one `updateUserAchievements` together (achievementService.ts, the
 *   `unlockedAchievements.length > 1` event). Map one batch to one `momentFor`.
 * - The BIG moment stays ONE modal from ModalQueueContext. The quiet note is not a
 *   modal: it never shows while a modal is up, it waits until the queue is empty.
 * - The level-up modal disappears for ordinary levels (R-10); the XP-animation
 *   guards in technical-guides:Gamification-UI.md keep their meaning.
 * - XP is credited when the moment ends (Continue, or the note leaving) — as today.
 * - Rarities follow the approved catalog (R-28, achievements-rework-plan.md).
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
import {
  AccessibilityInfo,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import i18n from '@/src/config/i18n';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { ACHIEVEMENT_XP_REWARDS } from '@/src/constants/achievements';
import { AchievementRarity } from '@/src/types/gamification';
import { impact, ImpactFeedbackStyle } from '@/src/services/hapticsService';
import { PressableScale, typeStyle, useLab } from './labPrimitives';
import {
  labFonts,
  labRadius,
  LabRarity,
  labRarity,
  labSpace,
} from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { useLabXpAward } from './xpFlight';
import {
  AchievementCelebrationConcept,
  Medal,
} from './AchievementCelebrationConcept';

export interface LabTrophy {
  id: string;
  icon: string;
  rarity: LabRarity;
  nameKey: string;
  descriptionKey: string;
  xp: number;
}

/** A quiet note that is not a trophy (a monthly challenge milestone, kolo 37). */
export interface LabNote {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  overline: string;
  title: string;
  xp: number;
}

export type Moment =
  | { id: number; kind: 'quiet'; items: LabTrophy[] }
  | { id: number; kind: 'big'; headliner: LabTrophy; also: LabTrophy[] }
  | { id: number; kind: 'note'; note: LabNote }
  /** Any other full-screen moment; it calls `done` when it has closed. */
  | { id: number; kind: 'window'; render: (done: () => void) => ReactNode };

const RANK: Record<LabRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

/** A real trophy from the catalog, with its rarity from the approved rework (R-28). */
export function labTrophy(id: string, rarity: LabRarity): LabTrophy {
  const a = CORE_ACHIEVEMENTS.find(x => x.id === id);
  if (!a) throw new Error(`Unknown achievement ${id}`);
  return {
    id,
    icon: a.icon,
    rarity,
    nameKey: a.nameKey,
    descriptionKey: a.descriptionKey,
    xp: ACHIEVEMENT_XP_REWARDS[rarity as AchievementRarity],
  };
}

/** The rule: what one action unlocked becomes exactly one moment. */
export function momentFor(batch: LabTrophy[], id = 0): Moment | null {
  if (batch.length === 0) return null;
  const sorted = [...batch].sort((a, b) => RANK[b.rarity] - RANK[a.rarity]);
  const top = sorted[0]!;
  return RANK[top.rarity] >= RANK.epic
    ? { id, kind: 'big', headliner: top, also: sorted.slice(1) }
    : { id, kind: 'quiet', items: sorted };
}

export function momentXp(moment: Moment): number {
  if (moment.kind === 'note') return moment.note.xp;
  if (moment.kind === 'window') return 0;
  const items =
    moment.kind === 'big' ? [moment.headliner, ...moment.also] : moment.items;
  return items.reduce((sum, item) => sum + item.xp, 0);
}

/**
 * Moments of different actions wait in line. The head is on screen and never
 * changes; quiet moments waiting behind it fold into one.
 */
export function enqueueMoment(queue: Moment[], next: Moment): Moment[] {
  const last = queue[queue.length - 1];
  if (queue.length >= 2 && last?.kind === 'quiet' && next.kind === 'quiet') {
    const merged = momentFor([...last.items, ...next.items], last.id);
    return merged ? [...queue.slice(0, -1), merged] : queue;
  }
  return [...queue, next];
}

/** The toolbar's trophy button walks through these — real trophies, real collisions. */
export const CELEBRATION_SCENARIOS: { label: string; batch: LabTrophy[] }[] = [
  { label: '1 common', batch: [labTrophy('first-habit', 'common')] },
  {
    label: 'day 7: 2 common',
    batch: [
      labTrophy('weekly-warrior', 'common'),
      labTrophy('loyalty-first-week', 'common'),
    ],
  },
  { label: '1 rare', batch: [labTrophy('streak-champion', 'rare')] },
  {
    label: 'day 30: epic + rare',
    batch: [
      labTrophy('monthly-master', 'epic'),
      labTrophy('loyalty-month-explorer', 'rare'),
    ],
  },
  {
    label: 'legendary + level up',
    batch: [labTrophy('hundred-days', 'legendary')],
  },
];

// ---------------------------------------------------------------------------
// State: a stable `celebrate`, and the moment on screen
// ---------------------------------------------------------------------------

const CelebrateContext = createContext<((batch: LabTrophy[]) => void) | null>(
  null
);
interface MomentsApi {
  showNote: (note: LabNote) => void;
  showWindow: (render: (done: () => void) => ReactNode) => void;
}
const MomentsApiContext = createContext<MomentsApi | null>(null);
const MomentContext = createContext<{
  current: Moment | null;
  finish: () => void;
  /** The tap of the quiet note on screen — the level badge next to it shares it. */
  noteTap: React.RefObject<(() => void) | null>;
} | null>(null);

export function LabCelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Moment[]>([]);
  const nextId = useRef(1);
  const noteTap = useRef<(() => void) | null>(null);
  const celebrate = useCallback((batch: LabTrophy[]) => {
    const moment = momentFor(batch, nextId.current++);
    if (moment) setQueue(q => enqueueMoment(q, moment));
  }, []);
  const finish = useCallback(() => setQueue(q => q.slice(1)), []);
  // Other moments join the same line: still one thing at a time (R-29).
  const api = useMemo<MomentsApi>(
    () => ({
      showNote: note =>
        setQueue(q =>
          enqueueMoment(q, { id: nextId.current++, kind: 'note', note })
        ),
      showWindow: render =>
        setQueue(q =>
          enqueueMoment(q, { id: nextId.current++, kind: 'window', render })
        ),
    }),
    []
  );
  const state = useMemo(
    () => ({ current: queue[0] ?? null, finish, noteTap }),
    [queue, finish]
  );
  return (
    <CelebrateContext.Provider value={celebrate}>
      <MomentsApiContext.Provider value={api}>
        <MomentContext.Provider value={state}>
          {children}
        </MomentContext.Provider>
      </MomentsApiContext.Provider>
    </CelebrateContext.Provider>
  );
}

export function useLabCelebrate(): (batch: LabTrophy[]) => void {
  const ctx = useContext(CelebrateContext);
  if (!ctx) throw new Error('useLabCelebrate needs LabCelebrationProvider');
  return ctx;
}

/** Queue a quiet note or a full-screen moment that is not a trophy. */
export function useLabMoments(): MomentsApi {
  const ctx = useContext(MomentsApiContext);
  if (!ctx) throw new Error('useLabMoments needs LabCelebrationProvider');
  return ctx;
}

function useMoment() {
  const ctx = useContext(MomentContext);
  if (!ctx) throw new Error('Celebration outlets need LabCelebrationProvider');
  return ctx;
}

/**
 * For the level badge (levelPanel.tsx): what is celebrating right now, and the
 * quiet note's own tap — one thing comes out of the badge at a time, so while a
 * note is out, a tap on the badge is a tap on the note.
 */
export function useCelebrationGate(): {
  moment: 'quiet' | 'big' | null;
  openNote: () => void;
} {
  const { current, noteTap } = useMoment();
  const openNote = useCallback(() => noteTap.current?.(), [noteTap]);
  const kind = current?.kind;
  const moment =
    kind === 'quiet' || kind === 'note'
      ? 'quiet'
      : kind === 'big' || kind === 'window'
        ? 'big'
        : null;
  return { moment, openNote };
}

/** Full screen: the big window. */
export function CelebrationModalOutlet() {
  const { current, finish } = useMoment();
  if (current?.kind === 'window') {
    return (
      <React.Fragment key={current.id}>{current.render(finish)}</React.Fragment>
    );
  }
  if (current?.kind !== 'big') return null;
  return (
    <AchievementCelebrationConcept
      key={current.id}
      headliner={current.headliner}
      also={current.also}
      onClosed={finish}
    />
  );
}

/** Next to the level badge: the quiet note. */
export function CelebrationNoteOutlet({
  onOpenTrophies,
}: {
  onOpenTrophies: () => void;
}) {
  const { current, finish } = useMoment();
  if (current?.kind === 'note') {
    return <PlainNote key={current.id} note={current.note} onDone={finish} />;
  }
  if (current?.kind !== 'quiet') return null;
  return (
    <TrophyNote
      key={current.id}
      items={current.items}
      onDone={finish}
      onOpen={onOpenTrophies}
    />
  );
}

// ---------------------------------------------------------------------------
// The quiet note
// ---------------------------------------------------------------------------

const HOLD_MS: Record<'common' | 'rare', number> = { common: 2600, rare: 3400 };

function TrophyNote({
  items,
  onDone,
  onOpen,
}: {
  items: LabTrophy[];
  onDone: () => void;
  onOpen: () => void;
}) {
  const { c, mode, lang } = useLab();
  const copy = MOCK_COPY[lang].celebrate;
  const t = useMemo(() => i18n.getFixedT(lang), [lang]);
  const reducedMotion = useReducedMotion();
  const award = useLabXpAward();
  const top = items[0]!;
  const rare = top.rarity === 'rare';
  const tier = labRarity[top.rarity];
  const xp = items.reduce((sum, item) => sum + item.xp, 0);
  const names = items.map(item => t(item.nameKey)).join(' · ');
  const overline =
    items.length > 1
      ? copy.trophiesUnlocked(items.length)
      : t(`achievements.celebration.rarity_${top.rarity}`);

  const p = useRef(new RNAnimated.Value(0)).current;
  const xpRef = useRef<View>(null);
  const left = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;

  const leave = useCallback(
    (open: boolean) => {
      if (left.current) return;
      left.current = true;
      // The XP is credited as the note goes — it flies from its number home.
      xpRef.current?.measureInWindow((x, y, w, h) =>
        award(xp, { x: x + w / 2, y: y + h / 2 })
      );
      if (open) onOpen();
      RNAnimated.timing(p, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(() => done.current());
    },
    [award, xp, onOpen, p]
  );
  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  // The badge the note came out of opens it too (useCelebrationGate).
  const { noteTap } = useMoment();
  useEffect(() => {
    noteTap.current = () => leaveRef.current(true);
    return () => {
      noteTap.current = null;
    };
  }, [noteTap]);

  useEffect(() => {
    impact(rare ? ImpactFeedbackStyle.Medium : ImpactFeedbackStyle.Light);
    AccessibilityInfo.announceForAccessibility(
      items
        .map(item =>
          t('achievements.celebration.announcement', {
            rarity: labRarity[item.rarity].label,
            name: t(item.nameKey),
            xp: String(item.xp),
          })
        )
        .join(' ')
    );
    RNAnimated.spring(p, {
      toValue: 1,
      damping: 14,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
    const id = setTimeout(
      () => leaveRef.current(false),
      HOLD_MS[rare ? 'rare' : 'common']
    );
    return () => clearTimeout(id);
    // Mount-only: one note = one entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const motion = reducedMotion
    ? { opacity: p }
    : {
        opacity: p,
        transform: [
          {
            translateX: p.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
          {
            scale: p.interpolate({
              inputRange: [0, 1],
              outputRange: [0.92, 1],
            }),
          },
        ],
      };

  return (
    <RNAnimated.View style={[styles.noteWrap, motion]} pointerEvents="box-none">
      <PressableScale
        onPress={() => leave(true)}
        haptic={null}
        accessibilityLabel={`${overline}. ${names}. +${xp} XP. ${copy.openTrophies}`}
        style={[
          styles.note,
          {
            backgroundColor: c.surface,
            borderColor: rare ? tier.glow : c.border,
          },
        ]}
      >
        <View style={styles.medals}>
          {items.slice(0, 3).map((item, i) => (
            <Medal key={item.id} trophy={item} overlap={i > 0} />
          ))}
        </View>
        <View style={styles.noteText}>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={typeStyle('overline', labRarity[top.rarity].chipText[mode])}
          >
            {overline}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={typeStyle('label', c.text)}
          >
            {names}
          </Text>
        </View>
        <View ref={xpRef} collapsable={false} style={styles.noteXp}>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={[
              typeStyle('label', mode === 'light' ? c.rewardText : c.reward),
              { fontFamily: labFonts.bold },
            ]}
          >
            {`+${xp} XP`}
          </Text>
        </View>
      </PressableScale>
    </RNAnimated.View>
  );
}

// ---------------------------------------------------------------------------
// A quiet note that is not a trophy (monthly challenge milestone)
// ---------------------------------------------------------------------------

const PLAIN_HOLD_MS = 3000;

/**
 * Same place, same motion and the same deal as the trophy note: it slides out of
 * the level badge, holds, and its XP flies home as it leaves. A tap (on it or on
 * the badge) lets it go early.
 */
function PlainNote({ note, onDone }: { note: LabNote; onDone: () => void }) {
  const { c, mode } = useLab();
  const reducedMotion = useReducedMotion();
  const award = useLabXpAward();
  const gold = mode === 'light' ? c.rewardText : c.reward;

  const p = useRef(new RNAnimated.Value(0)).current;
  const xpRef = useRef<View>(null);
  const left = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;

  const leave = useCallback(() => {
    if (left.current) return;
    left.current = true;
    xpRef.current?.measureInWindow((x, y, w, h) =>
      award(note.xp, { x: x + w / 2, y: y + h / 2 })
    );
    RNAnimated.timing(p, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start(() => done.current());
  }, [award, note.xp, p]);
  const leaveRef = useRef(leave);
  leaveRef.current = leave;

  const { noteTap } = useMoment();
  useEffect(() => {
    noteTap.current = () => leaveRef.current();
    return () => {
      noteTap.current = null;
    };
  }, [noteTap]);

  useEffect(() => {
    impact(ImpactFeedbackStyle.Light);
    AccessibilityInfo.announceForAccessibility(
      `${note.overline}. ${note.title}. +${note.xp} XP`
    );
    RNAnimated.spring(p, {
      toValue: 1,
      damping: 14,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
    const id = setTimeout(() => leaveRef.current(), PLAIN_HOLD_MS);
    return () => clearTimeout(id);
    // Mount-only: one note = one entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const motion = reducedMotion
    ? { opacity: p }
    : {
        opacity: p,
        transform: [
          {
            translateX: p.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
          {
            scale: p.interpolate({
              inputRange: [0, 1],
              outputRange: [0.92, 1],
            }),
          },
        ],
      };

  return (
    <RNAnimated.View style={[styles.noteWrap, motion]} pointerEvents="box-none">
      <PressableScale
        onPress={leave}
        haptic={null}
        accessibilityLabel={`${note.overline}. ${note.title}. +${note.xp} XP`}
        style={[
          styles.note,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <View style={[styles.noteIcon, { backgroundColor: c.rewardSoft }]}>
          <Ionicons name={note.icon} size={18} color={gold} />
        </View>
        <View style={styles.noteText}>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={typeStyle('overline', c.textMuted)}
          >
            {note.overline}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={typeStyle('label', c.text)}
          >
            {note.title}
          </Text>
        </View>
        <View ref={xpRef} collapsable={false} style={styles.noteXp}>
          <Text
            maxFontSizeMultiplier={1.2}
            numberOfLines={1}
            style={[typeStyle('label', gold), { fontFamily: labFonts.bold }]}
          >
            {`+${note.xp} XP`}
          </Text>
        </View>
      </PressableScale>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  noteWrap: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  note: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: labSpace.lg,
    borderRadius: labRadius.pill,
    borderWidth: 1,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)',
  },
  medals: {
    flexDirection: 'row',
  },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flexShrink: 1,
    marginLeft: labSpace.sm,
  },
  noteXp: {
    marginLeft: labSpace.md,
  },
});
