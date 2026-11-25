/**
 * Levels overview as a journey (migration E9 step 4; from the Design Lab's
 * LevelsOverviewConcept, kolo 35). Opened from the level panel's "All levels".
 * Replaces the table of 100 look-alike rows (LevelsOverviewScreen, goes in E26).
 *
 * - The hero: "Level 16 of 100", the rank, the whole road as one strip of six
 *   tier colours filled up to the user, XP to the next level, the next milestone.
 * - Six chapters (the tiers). The user's chapter is in focus on a path: the
 *   level behind, their own level with the badge's gold ring, the levels ahead
 *   with the XP they need. Finished chapters are one line, chapters ahead show
 *   their milestone. A tap opens any chapter fully. Rules: levelsJourney.ts (tested).
 * - The page opens AT the user: once it has slid in, the list glides until their
 *   level sits in the middle (reduce motion: it is simply there).
 * - A milestone names only the trophy the app really unlocks at that level
 *   (catalog, never a secret one).
 * - Rows are plain views in a FlatList; nothing animates per row.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, fonts, radius, space, tier as tierTokens, TierId } from '@/src/design/tokens';
import { getXPProgress, getXPRequiredForLevel } from '@/src/services/levelCalculation';
import { CORE_ACHIEVEMENTS } from '@/src/constants/achievementCatalog';
import { contentColumn } from '@/src/utils/layout';
import { AppText, Divider, PageTopBar, PressableScale, Surface, typeStyle } from '@/src/components/ui';
import { useXpDisplay } from '@/src/components/xp/XpDisplay';
import {
  buildJourney,
  JourneyItem,
  LEVEL_TIERS,
  MAX_LEVEL,
  nextMilestone,
  tierFill,
  tierOf,
} from '@/src/services/levels/levelsJourney';
import { rankTitle } from '@/src/services/levels/rankTitle';

/** Name key of the trophy a level unlocks — never a secret one. */
function trophyKeyAt(level: number): string | null {
  const trophy = CORE_ACHIEVEMENTS.find(
    a => a.condition.type === 'level' && a.condition.target === level && !a.isSecret
  );
  return trophy?.nameKey ?? null;
}

type ChapterItem = Extract<JourneyItem, { kind: 'chapter' }>;
type LevelItem = Extract<JourneyItem, { kind: 'level' }>;

const NODE = 30;
const NODE_BIG = 38;
const RAIL_COLUMN = 48;
/** The native slide-in of the page — the list glides once that has settled. */
const SLIDE_IN_MS = 420;

export function LevelsJourneyScreen() {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const locale = t('common.locale');
  const fmt = useCallback((n: number) => new Intl.NumberFormat(locale).format(n), [locale]);

  // The XP the badge shows (moves when a wave of sparks has landed).
  const { shownXp } = useXpDisplay();
  const now = getXPProgress(Math.max(0, shownXp));
  const current = Math.max(1, now.currentLevel);
  const here = tierOf(current);
  const milestone = nextMilestone(current);
  const levelLabel = (level: number) => t('onboarding.done.statLevel', { level });

  const [open, setOpen] = useState<ReadonlySet<TierId>>(() => new Set());
  const [focus, setFocus] = useState<TierId | null>(here.id);
  const toggle = useCallback(
    (id: TierId) => {
      const wasFocus = id === focus;
      if (wasFocus) setFocus(null);
      setOpen(prev => {
        const next = new Set(prev);
        if (next.has(id) && !wasFocus) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [focus]
  );
  const items = useMemo(() => buildJourney(current, open, focus), [current, open, focus]);

  const listRef = useRef<FlatList<JourneyItem>>(null);
  const reducedMotion = useReducedMotion();
  const startIndex = useRef(items.findIndex(item => item.kind === 'level' && item.state === 'current')).current;
  useEffect(() => {
    if (startIndex < 0) return undefined;
    const id = setTimeout(
      () => listRef.current?.scrollToIndex({ index: startIndex, viewPosition: 0.45, animated: !reducedMotion }),
      reducedMotion ? 0 : SLIDE_IN_MS
    );
    return () => clearTimeout(id);
    // Once, for the rows the page opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toNext = t('gamification.progress.xpToLevel', { xp: fmt(now.xpToNextLevel), level: current + 1 });
  const tierName = useCallback((id: TierId) => t(`gamification.levels.overview.rarity.${id}`), [t]);

  const header = (
    <View style={{ paddingTop: insets.top }}>
      <PageTopBar onClose={() => router.back()} label={t('common.close')} />
      <AppText variant="display" style={styles.title}>
        {t('gamification.levels.journey.title')}
      </AppText>

      <Surface style={styles.hero}>
        <View style={[styles.tierChip, { backgroundColor: tierTokens[here.id].soft[mode] }]}>
          <Text maxFontSizeMultiplier={1.3} style={typeStyle('overline', tierTokens[here.id].text[mode])}>
            {tierName(here.id)}
          </Text>
        </View>
        <View style={styles.heroLevel}>
          <AppText variant="number">{levelLabel(current)}</AppText>
          <AppText variant="body" tone="muted" style={styles.heroOf}>
            {t('gamification.levels.journey.ofTotal', { total: MAX_LEVEL })}
          </AppText>
        </View>
        <AppText variant="title" numberOfLines={1}>
          {rankTitle(current, t)}
        </AppText>

        <View
          style={styles.strip}
          accessible
          accessibilityLabel={`${levelLabel(current)} ${t('gamification.levels.journey.ofTotal', { total: MAX_LEVEL })}`}
        >
          {LEVEL_TIERS.map(tr => (
            <View key={tr.id} style={[styles.stripPart, { flex: tr.to - tr.from + 1, backgroundColor: c.track }]}>
              <LinearGradient
                colors={tierTokens[tr.id].fill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${tierFill(tr, current) * 100}%`, height: '100%' }}
              />
            </View>
          ))}
        </View>
        {current < MAX_LEVEL && (
          <AppText variant="caption" tone="muted" style={styles.toNext}>
            {toNext}
          </AppText>
        )}

        <Divider style={styles.dividerTop} />
        <View style={styles.heroMilestone}>
          <Ionicons name="star" size={16} color={c.reward} style={styles.starIcon} />
          <AppText variant="label" style={styles.flex}>
            {milestone === null
              ? t('gamification.levels.journey.top')
              : t('gamification.levels.journey.nextMilestone', { level: milestone, count: milestone - current })}
          </AppText>
        </View>
      </Surface>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: c.canvas }]}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={item => item.key}
        onScrollToIndexFailed={() => undefined}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item.kind === 'chapter' ? (
            <ChapterRow item={item} name={tierName(item.tier.id)} onToggle={toggle} />
          ) : (
            <LevelRow item={item} toNext={toNext} fmt={fmt} />
          )
        }
        initialNumToRender={18}
        maxToRenderPerBatch={16}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[contentColumn, styles.list, { paddingBottom: insets.bottom + space.xxl }]}
      />
      {/* The list glides to the user's level: a strip keeps the clock readable. */}
      <View pointerEvents="none" style={[styles.statusStrip, { height: insets.top, backgroundColor: c.canvas }]} />
    </View>
  );
}

const ChapterRow = React.memo(function ChapterRow({
  item,
  name,
  onToggle,
}: {
  item: ChapterItem;
  name: string;
  onToggle: (id: TierId) => void;
}) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const look = tierTokens[item.tier.id];
  const status =
    item.state === 'done'
      ? t('gamification.levels.journey.allReached')
      : item.state === 'current'
        ? t('gamification.levels.journey.reached', { count: item.reached, size: item.size })
        : t('gamification.levels.journey.ahead');
  const range = t('gamification.levels.journey.range', { from: item.tier.from, to: item.tier.to });
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
        style={[styles.chapterMark, item.state === 'ahead' && styles.dim]}
      />
      <View style={styles.flex}>
        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={typeStyle('titleSm', look.text[mode])}>
          {name}
        </Text>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {`${range} · ${status}`}
        </AppText>
      </View>
      {item.state === 'done' && (
        <Ionicons name="checkmark-circle" size={20} color={look.text[mode]} style={styles.doneIcon} />
      )}
      <Ionicons name={item.open ? 'chevron-up' : 'chevron-down'} size={18} color={c.textFaint} />
    </PressableScale>
  );
});

const LevelRow = React.memo(function LevelRow({
  item,
  toNext,
  fmt,
}: {
  item: LevelItem;
  toNext: string;
  fmt: (n: number) => string;
}) {
  const { c, mode } = useDesign();
  const { t } = useI18n();
  const look = tierTokens[item.tier.id];
  const trophyKey = item.milestone ? trophyKeyAt(item.level) : null;
  const isCurrent = item.state === 'current';
  const reached = item.state !== 'ahead';
  const big = isCurrent || item.milestone;
  const size = big ? NODE_BIG : NODE;
  const railAbove = reached ? look.fill[1] : c.track;
  const railBelow = item.state === 'done' ? look.fill[1] : c.track;
  const title = rankTitle(item.level, t);
  const here = t('gamification.levels.journey.here');
  const sub = isCurrent
    ? item.level < MAX_LEVEL
      ? `${here} · ${toNext}`
      : here
    : item.milestone
      ? trophyKey
        ? t('gamification.levels.journey.milestoneTrophy', { name: t(trophyKey) })
        : t('gamification.levels.journey.milestone', { level: item.level })
      : null;
  const xp = t('gamification.xp.amount', { xp: fmt(getXPRequiredForLevel(item.level)) });

  return (
    <View
      accessible
      accessibilityLabel={[t('onboarding.done.statLevel', { level: item.level }), title, sub ?? xp].join('. ')}
      style={[
        styles.level,
        big && styles.levelBig,
        isCurrent && { backgroundColor: c.surface, borderColor: c.border, boxShadow: c.shadow },
      ]}
    >
      <View style={styles.railColumn}>
        {item.joinedAbove && <View style={[styles.rail, styles.railAbove, { backgroundColor: railAbove }]} />}
        {item.joinedBelow && <View style={[styles.rail, styles.railBelow, { backgroundColor: railBelow }]} />}
        <Node item={item} size={size} />
      </View>
      <View style={styles.levelText}>
        <AppText variant={isCurrent ? 'bodyStrong' : 'body'} tone={reached ? 'text' : 'muted'} numberOfLines={1}>
          {title}
        </AppText>
        {sub && (
          <Text
            maxFontSizeMultiplier={1.5}
            numberOfLines={1}
            style={typeStyle('caption', isCurrent ? c.textMuted : mode === 'light' ? c.rewardText : c.reward)}
          >
            {sub}
          </Text>
        )}
      </View>
      {item.state === 'ahead' && (
        <AppText variant="caption" tone="faint" style={styles.levelXp}>
          {xp}
        </AppText>
      )}
      {item.state === 'done' && <Ionicons name="checkmark" size={18} color={look.text[mode]} />}
    </View>
  );
});

/** The dot on the path: the level's number, or a star for a milestone. */
function Node({ item, size }: { item: LevelItem; size: number }) {
  const { c, mode } = useDesign();
  const look = tierTokens[item.tier.id];
  const round = { width: size, height: size, borderRadius: size / 2 };
  const number = (color: string) => (
    <Text maxFontSizeMultiplier={1.2} style={[typeStyle('caption', color), styles.nodeNumber]}>
      {item.level}
    </Text>
  );
  if (item.state === 'current') {
    // The same gold ring as the level badge — "this is you".
    return (
      <LinearGradient colors={fixed.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.node, round]}>
        <View style={[styles.node, { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2, backgroundColor: c.surface }]}>
          {number(c.text)}
        </View>
      </LinearGradient>
    );
  }
  if (item.milestone) {
    return item.state === 'done' ? (
      <LinearGradient colors={fixed.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.node, round]}>
        <Ionicons name="star" size={18} color={fixed.goldInk} />
      </LinearGradient>
    ) : (
      <View style={[styles.node, round, styles.milestoneAhead, { backgroundColor: c.rewardSoft, borderColor: c.reward }]}>
        <Ionicons name="star" size={18} color={mode === 'light' ? c.rewardText : c.reward} />
      </View>
    );
  }
  if (item.state === 'done') {
    return <View style={[styles.node, round, { backgroundColor: look.fill[1] }]}>{number(look.on)}</View>;
  }
  return (
    <View style={[styles.node, round, styles.nodeAhead, { backgroundColor: c.surface, borderColor: c.track }]}>
      {number(c.textFaint)}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0 },
  list: { paddingHorizontal: space.xl },
  title: { marginTop: space.sm },
  hero: { marginTop: space.lg },
  tierChip: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.pill },
  heroLevel: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.md },
  heroOf: { marginLeft: space.sm },
  strip: { flexDirection: 'row', gap: 3, marginTop: space.lg },
  stripPart: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  toNext: { marginTop: space.sm },
  dividerTop: { marginTop: space.lg },
  heroMilestone: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  starIcon: { marginRight: space.sm },
  chapter: { flexDirection: 'row', alignItems: 'center', minHeight: 56, marginTop: space.xl, marginBottom: space.xs },
  chapterMark: { width: 6, height: 36, borderRadius: radius.pill, marginRight: space.md },
  dim: { opacity: 0.45 },
  doneIcon: { marginRight: space.sm },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingRight: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelBig: { minHeight: 60 },
  railColumn: { width: RAIL_COLUMN, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  rail: { position: 'absolute', width: 2, left: RAIL_COLUMN / 2 - 1 },
  railAbove: { top: -1, bottom: '50%' },
  railBelow: { top: '50%', bottom: -1 },
  node: { alignItems: 'center', justifyContent: 'center' },
  nodeNumber: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
  nodeAhead: { borderWidth: 1.5 },
  milestoneAhead: { borderWidth: 1.5 },
  levelText: { flex: 1, marginLeft: space.sm },
  levelXp: { marginLeft: space.md, fontVariant: ['tabular-nums'] },
});
