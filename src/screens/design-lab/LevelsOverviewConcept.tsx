/**
 * Levels overview as a journey (kolo 35) — opened from the level panel's
 * "All levels" (levelPanel.tsx). Replaces today's table of 100 look-alike rows.
 *
 * What the user sees, top to bottom:
 * - the hero: "Level 16 of 100", the level's name, and the whole road as one strip
 *   of six tier colours, filled up to where the user stands; the next milestone;
 * - six chapters (the tiers). The one the user is in is in focus, on a path: the
 *   level just behind them, their own level with the gold ring of the badge, and
 *   the levels ahead, quiet, saying the XP they need. Finished chapters are one
 *   line, chapters ahead show their milestone. A tap opens any chapter fully.
 * - The page opens AT the user: once it has slid in, the list glides until their
 *   level sits in the middle (no jump under reduce motion — it is simply there).
 *
 * A milestone says only what is true (lesson 49): the trophy the app really
 * unlocks at that level (achievementCatalog: 10, 25, 50; the one at 100 is secret
 * and stays unnamed; 75 has none). The old "rewards" (custom theme, prestige
 * system, mentor mode…) never existed and were removed from the app (2026-11-11).
 *
 * Rows are plain views in a FlatList, nothing animates per row (lessons 42, 50).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces src/screens/levels/LevelsOverviewScreen.tsx (route /levels-overview).
 * - Level and XP from GamificationService; names and XP per level from
 *   levelCalculation.ts (already real here); tier names from the existing keys
 *   gamification.levels.overview.rarity.*; new texts (`levels` in mockCopy) → locales.
 * - Tier colours: `labTier` in the tokens; ranges per Gamification-UI.md.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getLevelInfo,
  getXPProgress,
  getXPRequiredForLevel,
} from '@/src/services/levelCalculation';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { contentColumn } from '@/src/utils/layout';
import { PageTopBar, useJournalT } from './journalParts';
import {
  Divider,
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace, labTier, LabTierId } from './labTokens';
import {
  buildJourney,
  JourneyItem,
  LEVEL_TIERS,
  MAX_LEVEL,
  nextMilestone,
  tierFill,
  tierOf,
} from './levelsJourney';
import { formatThousands, MOCK_COPY } from './mockCopy';
import { LEVEL_GOLD, useLabXp } from './xpFlight';

/** Name key of the trophy a level unlocks — never a secret one. */
function trophyKeyAt(level: number): string | null {
  const trophy = CORE_ACHIEVEMENTS.find(
    a =>
      a.condition.type === 'level' &&
      a.condition.target === level &&
      !a.isSecret
  );
  return trophy?.nameKey ?? null;
}

type ChapterItem = Extract<JourneyItem, { kind: 'chapter' }>;
type LevelItem = Extract<JourneyItem, { kind: 'level' }>;

const NODE = 30;
/** The user's own level and the milestones stand out on the path. */
const NODE_BIG = 38;
const RAIL_COLUMN = 48;
/** The page's own slide-in (SlidePage) — the list moves once that has settled. */
const SLIDE_IN_MS = 420;

export function LevelsOverviewConcept({
  bottomInset,
  onClose,
}: {
  bottomInset: number;
  onClose: () => void;
}) {
  const { c, lang, mode } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.levels;
  const sep = copy.thousandsSeparator;
  const t = useJournalT();

  // The XP the badge shows (moves when a wave of sparks has landed).
  const { settledXp } = useLabXp();
  const now = getXPProgress(settledXp);
  const current = now.currentLevel;
  const here = tierOf(current);
  const milestone = nextMilestone(current);

  const [open, setOpen] = useState<ReadonlySet<LabTierId>>(() => new Set());
  // The user's own chapter starts in focus (from the level behind them onward);
  // the first tap on it opens it fully.
  const [focus, setFocus] = useState<LabTierId | null>(here.id);
  const toggle = useCallback(
    (tier: LabTierId) => {
      const wasFocus = tier === focus;
      if (wasFocus) setFocus(null);
      setOpen(prev => {
        const next = new Set(prev);
        if (next.has(tier) && !wasFocus) next.delete(tier);
        else next.add(tier);
        return next;
      });
    },
    [focus]
  );

  const items = useMemo(
    () => buildJourney(current, open, focus),
    [current, open, focus]
  );

  // Open at the user: after the page has slid in, glide to their level.
  const listRef = useRef<FlatList<JourneyItem>>(null);
  const reducedMotion = useReducedMotion();
  const startIndex = useRef(
    items.findIndex(item => item.kind === 'level' && item.state === 'current')
  ).current;
  useEffect(() => {
    if (startIndex < 0) return undefined;
    const id = setTimeout(
      () =>
        listRef.current?.scrollToIndex({
          index: startIndex,
          viewPosition: 0.45,
          animated: !reducedMotion,
        }),
      reducedMotion ? 0 : SLIDE_IN_MS
    );
    return () => clearTimeout(id);
    // Once, for the rows the page opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toNext = copy.toNext(
    formatThousands(now.xpToNextLevel, sep),
    current + 1
  );
  const tierName = useCallback(
    (tier: LabTierId) => t(`gamification.levels.overview.rarity.${tier}`),
    [t]
  );

  const header = (
    <View>
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <LabText variant="display" style={{ marginTop: labSpace.sm }}>
        {text.title}
      </LabText>

      <Surface style={styles.hero}>
        <View
          style={[
            styles.tierChip,
            { backgroundColor: labTier[here.id].soft[mode] },
          ]}
        >
          <Text
            maxFontSizeMultiplier={1.3}
            style={typeStyle('overline', labTier[here.id].text[mode])}
          >
            {tierName(here.id)}
          </Text>
        </View>
        <View style={styles.heroLevel}>
          <LabText variant="number">{copy.level(current)}</LabText>
          <LabText variant="body" tone="muted" style={styles.heroOf}>
            {text.ofTotal(MAX_LEVEL)}
          </LabText>
        </View>
        {current > 0 && (
          <LabText variant="title" numberOfLines={1}>
            {getLevelInfo(current).title}
          </LabText>
        )}

        {/* The whole road: six tiers, as long as they are, filled up to here. */}
        <View
          style={styles.strip}
          accessible
          accessibilityLabel={`${copy.level(current)} ${text.ofTotal(MAX_LEVEL)}`}
        >
          {LEVEL_TIERS.map(tier => (
            <View
              key={tier.id}
              style={[
                styles.stripPart,
                { flex: tier.to - tier.from + 1, backgroundColor: c.track },
              ]}
            >
              <LinearGradient
                colors={labTier[tier.id].fill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: `${tierFill(tier, current) * 100}%`,
                  height: '100%',
                }}
              />
            </View>
          ))}
        </View>
        {current < MAX_LEVEL && (
          <LabText
            variant="caption"
            tone="muted"
            style={{ marginTop: labSpace.sm }}
          >
            {toNext}
          </LabText>
        )}

        <Divider style={{ marginTop: labSpace.lg }} />
        <View style={styles.heroMilestone}>
          <Ionicons
            name="star"
            size={16}
            color={c.reward}
            style={{ marginRight: labSpace.sm }}
          />
          <LabText variant="label" style={{ flex: 1 }}>
            {milestone === null
              ? text.top
              : text.nextMilestone(milestone, milestone - current)}
          </LabText>
        </View>
      </Surface>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={item => item.key}
        // The user's row is always among the first rendered; if it ever is not,
        // staying at the top is fine.
        onScrollToIndexFailed={() => undefined}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item.kind === 'chapter' ? (
            <ChapterRow
              item={item}
              name={tierName(item.tier.id)}
              onToggle={toggle}
            />
          ) : (
            <LevelRow item={item} toNext={toNext} />
          )
        }
        initialNumToRender={18}
        maxToRenderPerBatch={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          contentColumn,
          {
            paddingHorizontal: labSpace.xl,
            paddingBottom: bottomInset + labSpace.xxl,
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// A chapter = one tier
// ---------------------------------------------------------------------------

const ChapterRow = React.memo(function ChapterRow({
  item,
  name,
  onToggle,
}: {
  item: ChapterItem;
  name: string;
  onToggle: (tier: LabTierId) => void;
}) {
  const { c, lang, mode } = useLab();
  const text = MOCK_COPY[lang].levels;
  const look = labTier[item.tier.id];
  const status =
    item.state === 'done'
      ? text.allReached
      : item.state === 'current'
        ? text.reached(item.reached, item.size)
        : text.ahead;
  const range = text.range(item.tier.from, item.tier.to);
  return (
    <PressableScale
      onPress={() => onToggle(item.tier.id)}
      pressScale={0.985}
      accessibilityLabel={`${name}. ${range}. ${status}`}
      accessibilityState={{ selected: item.open }}
      style={styles.chapter}
    >
      <LinearGradient
        colors={look.fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.chapterMark,
          item.state === 'ahead' && { opacity: 0.45 },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text
          maxFontSizeMultiplier={1.4}
          numberOfLines={1}
          style={typeStyle('titleSm', look.text[mode])}
        >
          {name}
        </Text>
        <LabText variant="caption" tone="muted" numberOfLines={1}>
          {`${range} · ${status}`}
        </LabText>
      </View>
      {item.state === 'done' && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={look.text[mode]}
          style={{ marginRight: labSpace.sm }}
        />
      )}
      <Ionicons
        name={item.open ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={c.textFaint}
      />
    </PressableScale>
  );
});

// ---------------------------------------------------------------------------
// A level on the path
// ---------------------------------------------------------------------------

const LevelRow = React.memo(function LevelRow({
  item,
  toNext,
}: {
  item: LevelItem;
  /** "237 XP to Level 17" — only the user's own level shows it. */
  toNext: string;
}) {
  const { c, lang, mode } = useLab();
  const copy = MOCK_COPY[lang];
  const text = copy.levels;
  const t = useJournalT();
  const look = labTier[item.tier.id];
  const info = getLevelInfo(item.level);
  const trophyKey = item.milestone ? trophyKeyAt(item.level) : null;
  const isCurrent = item.state === 'current';
  const reached = item.state !== 'ahead';
  const big = isCurrent || item.milestone;
  const size = big ? NODE_BIG : NODE;

  // The path is coloured as far as the user has come.
  const railAbove = reached ? look.fill[1] : c.track;
  const railBelow = item.state === 'done' ? look.fill[1] : c.track;

  const sub = isCurrent
    ? item.level < MAX_LEVEL
      ? `${text.here} · ${toNext}`
      : text.here
    : item.milestone
      ? trophyKey
        ? text.milestoneTrophy(t(trophyKey))
        : text.milestone(item.level)
      : null;
  const xp = `${formatThousands(getXPRequiredForLevel(item.level), copy.thousandsSeparator)} XP`;

  return (
    <View
      accessible
      accessibilityLabel={[copy.level(item.level), info.title, sub ?? xp].join(
        '. '
      )}
      style={[
        styles.level,
        big && styles.levelBig,
        isCurrent && {
          backgroundColor: c.surface,
          borderColor: c.border,
          boxShadow: c.shadow,
        },
      ]}
    >
      <View style={styles.railColumn}>
        {item.joinedAbove && (
          <View
            style={[
              styles.rail,
              styles.railAbove,
              { backgroundColor: railAbove },
            ]}
          />
        )}
        {item.joinedBelow && (
          <View
            style={[
              styles.rail,
              styles.railBelow,
              { backgroundColor: railBelow },
            ]}
          />
        )}
        <Node item={item} size={size} />
      </View>
      <View style={styles.levelText}>
        <LabText
          variant={isCurrent ? 'bodyStrong' : 'body'}
          tone={reached ? 'text' : 'muted'}
          numberOfLines={1}
        >
          {info.title}
        </LabText>
        {sub && (
          <Text
            maxFontSizeMultiplier={1.5}
            numberOfLines={1}
            style={typeStyle(
              'caption',
              isCurrent
                ? c.textMuted
                : mode === 'light'
                  ? c.rewardText
                  : c.reward
            )}
          >
            {sub}
          </Text>
        )}
      </View>
      {item.state === 'ahead' && (
        <LabText variant="caption" tone="faint" style={styles.levelXp}>
          {xp}
        </LabText>
      )}
      {item.state === 'done' && (
        <Ionicons name="checkmark" size={18} color={look.text[mode]} />
      )}
    </View>
  );
});

/** The dot on the path: the level's number, or a star for a milestone. */
function Node({ item, size }: { item: LevelItem; size: number }) {
  const { c, mode } = useLab();
  const look = labTier[item.tier.id];
  const round = { width: size, height: size, borderRadius: size / 2 };
  const number = (color: string) => (
    <Text
      maxFontSizeMultiplier={1.2}
      style={[
        typeStyle('caption', color),
        { fontFamily: labFonts.bold, fontVariant: ['tabular-nums'] },
      ]}
    >
      {item.level}
    </Text>
  );

  if (item.state === 'current') {
    // The same gold ring as the level badge — "this is you".
    return (
      <LinearGradient
        colors={LEVEL_GOLD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.node, round]}
      >
        <View
          style={[
            styles.node,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
              backgroundColor: c.surface,
            },
          ]}
        >
          {number(c.text)}
        </View>
      </LinearGradient>
    );
  }
  if (item.milestone) {
    // Milestones are gold in every tier (Gamification-UI.md).
    return item.state === 'done' ? (
      <LinearGradient
        colors={LEVEL_GOLD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.node, round]}
      >
        <Ionicons name="star" size={18} color="#4A2F00" />
      </LinearGradient>
    ) : (
      <View
        style={[
          styles.node,
          round,
          {
            backgroundColor: c.rewardSoft,
            borderWidth: 1.5,
            borderColor: c.reward,
          },
        ]}
      >
        <Ionicons
          name="star"
          size={18}
          color={mode === 'light' ? c.rewardText : c.reward}
        />
      </View>
    );
  }
  if (item.state === 'done') {
    // Solid, the tier's darker stop: the number must stay readable (labTier.on).
    return (
      <View style={[styles.node, round, { backgroundColor: look.fill[1] }]}>
        {number(look.on)}
      </View>
    );
  }
  return (
    <View
      style={[
        styles.node,
        round,
        {
          backgroundColor: c.surface,
          borderWidth: 1.5,
          borderColor: c.track,
        },
      ]}
    >
      {number(c.textFaint)}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: labSpace.lg,
  },
  tierChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: labSpace.md,
    paddingVertical: labSpace.xs,
    borderRadius: labRadius.pill,
  },
  heroLevel: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: labSpace.md,
  },
  heroOf: {
    marginLeft: labSpace.sm,
  },
  strip: {
    flexDirection: 'row',
    gap: 3,
    marginTop: labSpace.lg,
  },
  stripPart: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  heroMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.md,
  },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    marginTop: labSpace.xl,
    marginBottom: labSpace.xs,
  },
  chapterMark: {
    width: 6,
    height: 36,
    borderRadius: 3,
    marginRight: labSpace.md,
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingRight: labSpace.md,
    borderRadius: labRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelBig: {
    minHeight: 60,
  },
  railColumn: {
    width: RAIL_COLUMN,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    width: 2,
    left: RAIL_COLUMN / 2 - 1,
  },
  // Past the row's own border, so the path has no gap between two rows.
  railAbove: {
    top: -1,
    bottom: '50%',
  },
  railBelow: {
    top: '50%',
    bottom: -1,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    flex: 1,
    marginLeft: labSpace.sm,
  },
  levelXp: {
    marginLeft: labSpace.md,
    fontVariant: ['tabular-nums'],
  },
});
