/**
 * Trophy Room concept for the Design Lab (premium-design-plan.md, F1, kolo 28).
 *
 * Today's room is two tabs of stacked statistics. Here it is one room, top to
 * bottom, built around the trophies themselves:
 *   1. The count — ring, unlocked of 75, XP earned, the four rarities as gems.
 *   2. Recent — the newest medals in a row (replaces History and the Spotlight that
 *      rotated every 30 seconds).
 *   3. Coming up — the trophies closest to unlocking: what to do next.
 *   4. Collections — themed sets. A tap opens the set (today: a TODO, nothing happens).
 *   5. Loyalty journey — active days on a road of milestones.
 *   6. All trophies — the wall: search, category, and behind "Filter" rarity,
 *      unlocked only and sorting (every filter of today's screen).
 * Tapping any medal opens its sheet: how to earn it, or when it was earned.
 *
 * The 75 trophies are the app's real catalog; only their state is staged.
 *
 * Performance: the wall is a FlatList (virtualized, audit N9) and has no animation
 * per medal — reactions run on the native driver (lesson 46).
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces app/achievements.tsx and its 9 components. State from
 *   AchievementStorage / AchievementService; realTimeProgress stays for progress.
 * - Secret trophies stay hidden until unlocked, in every list and in search.
 * - Rarity labels stay English (technical-guides.md).
 * - The wall needs real progress per trophy; compute it in batch (batchUserStats),
 *   never per card.
 * - Collections: src/constants/trophyCollections.ts; the bonus is paid by
 *   trophyCollectionService — this screen only shows it.
 */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { contentColumn } from '@/src/utils/layout';
import {
  LabText,
  PressableScale,
  ProgressBar,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import {
  labFonts,
  LabRarity,
  labRadius,
  labRarity,
  labSpace,
} from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { daysBetween } from './goalsMock';
import { Ring } from './GoalDetailConcept';
import { BottomSheet, PageTopBar, useJournalT } from './journalParts';
import {
  LAB_ACTIVE_DAYS,
  LAB_COLLECTIONS,
  LabCollection,
  TrophyState,
  trophyStates,
} from './trophiesMock';

const COLUMNS = 4;
const RARITIES: LabRarity[] = ['common', 'rare', 'epic', 'legendary'];
const RARITY_ORDER: Record<LabRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};
const CATEGORIES = [
  'habits',
  'journal',
  'goals',
  'consistency',
  'mastery',
  'special',
] as const;
type Category = (typeof CATEGORIES)[number];
type Sort = 'category' | 'rarity' | 'unlock_date' | 'alphabetical';

const isHidden = (x: TrophyState) => x.achievement.isSecret && !x.unlockedOn;

export function TrophyRoomConcept({
  bottomInset,
  onClose,
}: {
  bottomInset: number;
  onClose: () => void;
}) {
  const { c, lang } = useLab();
  const copy = MOCK_COPY[lang];
  const tr = copy.trophies;
  const t = useJournalT();
  const [today] = useState(() => new Date());
  const [all] = useState(() => trophyStates());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [rarity, setRarity] = useState<LabRarity | 'all'>('all');
  const [unlockedOnly, setUnlockedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('category');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sheet, setSheet] = useState<TrophyState | null>(null);
  const [collection, setCollection] = useState<LabCollection | null>(null);

  const nameOf = (x: TrophyState) =>
    isHidden(x) ? tr.secret : t(x.achievement.nameKey as never);

  const unlocked = all.filter(x => x.unlockedOn);
  const earnedXp = unlocked.reduce((s, x) => s + x.achievement.xpReward, 0);
  const recent = [...unlocked]
    .sort((a, b) => b.unlockedOn!.getTime() - a.unlockedOn!.getTime())
    .slice(0, 8);
  const comingUp = all
    .filter(x => !x.unlockedOn && !isHidden(x))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = all.filter(x => {
      if (category !== 'all' && x.achievement.category !== category)
        return false;
      if (rarity !== 'all' && x.rarity !== rarity) return false;
      if (unlockedOnly && !x.unlockedOn) return false;
      if (needle) {
        // A secret trophy must not be findable by its real name.
        if (isHidden(x)) return false;
        const hay =
          `${t(x.achievement.nameKey as never)} ${t(x.achievement.descriptionKey as never)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    const byCategory = (x: TrophyState) =>
      CATEGORIES.indexOf(x.achievement.category as Category);
    return [...list].sort((a, b) => {
      if (sort === 'rarity')
        return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      if (sort === 'unlock_date')
        return (b.unlockedOn?.getTime() ?? 0) - (a.unlockedOn?.getTime() ?? 0);
      if (sort === 'alphabetical')
        return nameOf(a).localeCompare(nameOf(b), copy.locale);
      return (
        byCategory(a) - byCategory(b) ||
        Number(!!b.unlockedOn) - Number(!!a.unlockedOn)
      );
    });
    // nameOf only depends on t and the secret flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, query, category, rarity, unlockedOnly, sort, t, copy.locale]);

  const header = (
    <View>
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <LabText variant="display" style={{ marginTop: labSpace.sm }}>
        {t('screens.trophyRoom.title')}
      </LabText>
      <LabText variant="body" tone="muted" italic style={{ marginTop: 2 }}>
        {tr.subline}
      </LabText>

      {/* The count */}
      <Surface style={styles.hero}>
        <View style={styles.heroRow}>
          <Ring fraction={unlocked.length / all.length} color={c.reward} />
          <View style={{ flex: 1, marginLeft: labSpace.lg }}>
            <LabText variant="overline" tone="reward">
              {t('achievements.overview.unlockedCount')}
            </LabText>
            <View style={styles.heroCount}>
              <LabText variant="number">{`${unlocked.length}`}</LabText>
              <LabText
                variant="title"
                tone="faint"
                style={{ marginLeft: 2, marginBottom: 4 }}
              >
                {`/${all.length}`}
              </LabText>
            </View>
            <LabText variant="caption" tone="muted">
              {`${earnedXp.toLocaleString(copy.locale)} XP · ${t('achievements.overview.totalXP')}`}
            </LabText>
          </View>
        </View>
        <View style={styles.gems}>
          {RARITIES.map(r => {
            const of = all.filter(x => x.rarity === r);
            const have = of.filter(x => x.unlockedOn).length;
            return (
              <View key={r} style={styles.gem}>
                <LinearGradient
                  colors={labRarity[r].ring}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gemMark}
                />
                <LabText
                  variant="label"
                  style={{ fontFamily: labFonts.semibold, marginTop: 4 }}
                >
                  {`${have}/${of.length}`}
                </LabText>
                <LabText variant="caption" tone="muted" numberOfLines={1}>
                  {labRarity[r].label.charAt(0) +
                    labRarity[r].label.slice(1).toLowerCase()}
                </LabText>
              </View>
            );
          })}
        </View>
      </Surface>

      {/* Recent */}
      <Heading text={t('achievements.overview.recentUnlocks')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.recentRow}
      >
        {recent.map(x => (
          <PressableScale
            key={x.id}
            pressScale={0.93}
            accessibilityLabel={nameOf(x)}
            onPress={() => setSheet(x)}
            style={styles.recent}
          >
            <Medal trophy={x} size={68} />
            <LabText
              variant="caption"
              numberOfLines={2}
              style={styles.medalName}
            >
              {nameOf(x)}
            </LabText>
            <LabText variant="caption" tone="faint" style={styles.medalDate}>
              {whenText(x, today, t)}
            </LabText>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Coming up */}
      <Heading text={t('achievements.overview.nextToUnlock')} />
      {comingUp.map(x => (
        <PressableScale
          key={x.id}
          pressScale={0.985}
          accessibilityLabel={nameOf(x)}
          onPress={() => setSheet(x)}
          style={{ marginBottom: labSpace.sm }}
        >
          <Surface style={styles.nextCard}>
            <Medal trophy={x} size={48} />
            <View style={{ flex: 1, marginLeft: labSpace.md }}>
              <LabText variant="bodyStrong" numberOfLines={1}>
                {nameOf(x)}
              </LabText>
              <LabText variant="caption" tone="muted" numberOfLines={1}>
                {t(x.achievement.descriptionKey as never)}
              </LabText>
              <ProgressBar
                progress={x.progress}
                colors={labRarity[x.rarity].ring}
                height={6}
                style={{ marginTop: 6 }}
              />
            </View>
            <LabText
              variant="label"
              tone="muted"
              style={{ marginLeft: labSpace.md }}
            >
              {`${Math.round(x.progress * 100)} %`}
            </LabText>
          </Surface>
        </PressableScale>
      ))}

      {/* Collections */}
      <Heading text={t('social.trophy_combinations.title')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.collections}
      >
        {LAB_COLLECTIONS.map(set => {
          const parts = set.trophyIds.map(id => all.find(x => x.id === id));
          const have = parts.filter(x => x?.unlockedOn).length;
          const done = have === parts.length;
          return (
            <PressableScale
              key={set.id}
              pressScale={0.96}
              accessibilityLabel={t(
                `social.trophy_combinations.collections.${set.id}` as never
              )}
              onPress={() => setCollection(set)}
            >
              <Surface
                style={[
                  styles.collection,
                  done && { borderColor: labRarity[set.rarity].glow },
                ]}
              >
                <View style={styles.collectionHead}>
                  <Text style={styles.collectionIcon}>{set.icon}</Text>
                  {done && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={c.success}
                    />
                  )}
                </View>
                <LabText variant="bodyStrong" numberOfLines={2}>
                  {t(
                    `social.trophy_combinations.collections.${set.id}` as never
                  )}
                </LabText>
                <View style={{ flex: 1 }} />
                <View style={styles.pips}>
                  {parts.map((part, i) => (
                    <View
                      key={i}
                      style={[
                        styles.pip,
                        {
                          backgroundColor: part?.unlockedOn
                            ? labRarity[set.rarity].glow
                            : c.track,
                        },
                      ]}
                    />
                  ))}
                </View>
                <LabText variant="caption" tone="muted">
                  {t('social.trophy_combinations.completedProgress', {
                    completed: have,
                    total: parts.length,
                  })}
                </LabText>
              </Surface>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Loyalty */}
      <Heading text={t('social.loyalty_progress.activeDays')} />
      <LoyaltyRoad trophies={all} />

      {/* The wall */}
      <Heading
        text={tr.wall}
        trailing={tr.ofTotal(visible.length, all.length)}
      />
      <View
        style={[
          styles.search,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Ionicons name="search" size={18} color={c.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('achievements.filter.searchPlaceholder')}
          placeholderTextColor={c.textFaint}
          returnKeyType="search"
          style={[typeStyle('body', c.text), styles.searchInput]}
        />
        <PressableScale
          onPress={() => setFiltersOpen(open => !open)}
          pressScale={0.9}
          accessibilityLabel={tr.filter}
          accessibilityState={{ selected: filtersOpen }}
          style={[
            styles.filterButton,
            { backgroundColor: filtersOpen ? c.primarySoft : c.track },
          ]}
        >
          <Ionicons
            name="options-outline"
            size={17}
            color={filtersOpen ? c.primary : c.textMuted}
          />
        </PressableScale>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.bleed}
        contentContainerStyle={styles.chips}
      >
        <FilterChip
          label={t('achievements.categories.all')}
          on={category === 'all'}
          onPress={() => setCategory('all')}
        />
        {CATEGORIES.map(key => (
          <FilterChip
            key={key}
            label={t(`achievements.categories.${key}`)}
            on={category === key}
            onPress={() => setCategory(key)}
          />
        ))}
      </ScrollView>
      {filtersOpen && (
        <View style={styles.filterPanel}>
          <View style={styles.wrapRow}>
            <FilterChip
              label={t('social.achievements_filters.unlockedOnlyLabel')}
              on={unlockedOnly}
              onPress={() => setUnlockedOnly(v => !v)}
            />
          </View>
          <LabText variant="overline" tone="muted" style={styles.filterTitle}>
            {t('social.achievements_filters.rarityLabel')}
          </LabText>
          <View style={styles.wrapRow}>
            <FilterChip
              label={t('social.achievements_filters.allRarities')}
              on={rarity === 'all'}
              onPress={() => setRarity('all')}
            />
            {RARITIES.map(r => (
              <FilterChip
                key={r}
                label={t(`social.achievements_filters.${r}Rarity`)}
                on={rarity === r}
                onPress={() => setRarity(r)}
              />
            ))}
          </View>
          <LabText variant="overline" tone="muted" style={styles.filterTitle}>
            {t('social.achievements_filters.sortByLabel')}
          </LabText>
          <View style={styles.wrapRow}>
            {(
              [
                ['category', 'categoryLabel'],
                ['rarity', 'rarityLabel'],
                ['unlock_date', 'recentLabel'],
                ['alphabetical', 'alphabeticalLabel'],
              ] as const
            ).map(([key, label]) => (
              <FilterChip
                key={key}
                label={t(`social.achievements_filters.${label}`)}
                on={sort === key}
                onPress={() => setSort(key)}
              />
            ))}
          </View>
        </View>
      )}
      <View style={{ height: labSpace.md }} />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visible}
        keyExtractor={x => x.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.wallRow}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LabText variant="titleSm" style={{ textAlign: 'center' }}>
              {t('achievements.filter.noResults')}
            </LabText>
            <LabText
              variant="caption"
              tone="muted"
              style={{ textAlign: 'center', marginTop: labSpace.xs }}
            >
              {t('achievements.filter.noResultsSubtitle')}
            </LabText>
          </View>
        }
        renderItem={({ item }) => (
          <WallCell
            trophy={item}
            name={nameOf(item)}
            onPress={() => setSheet(item)}
          />
        )}
        initialNumToRender={16}
        maxToRenderPerBatch={16}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          contentColumn,
          {
            paddingHorizontal: labSpace.xl,
            paddingBottom: bottomInset + labSpace.xxl,
          },
        ]}
      />

      {sheet && (
        <TrophySheet
          trophy={sheet}
          today={today}
          name={nameOf(sheet)}
          bottomInset={bottomInset}
          onClosed={() => setSheet(null)}
        />
      )}
      {collection && (
        <CollectionSheet
          set={collection}
          trophies={all}
          nameOf={nameOf}
          bottomInset={bottomInset}
          onClosed={() => setCollection(null)}
          onTrophy={x => setSheet(x)}
        />
      )}
    </View>
  );
}

function whenText(
  x: TrophyState,
  today: Date,
  t: ReturnType<typeof useJournalT>
): string {
  if (!x.unlockedOn) return '';
  const days = Math.max(0, daysBetween(x.unlockedOn, today));
  if (days <= 1) return t('achievements.detail.unlockedYesterday');
  if (days <= 7) return t('achievements.detail.unlockedDaysAgo', { days });
  if (days <= 30)
    return t('achievements.detail.unlockedWeeksAgo', {
      weeks: Math.round(days / 7),
    });
  return t('achievements.detail.unlockedRecently');
}

function Heading({ text, trailing }: { text: string; trailing?: string }) {
  return (
    <View style={styles.heading}>
      <LabText variant="title" style={{ flex: 1 }}>
        {text}
      </LabText>
      {trailing && (
        <LabText variant="label" tone="muted">
          {trailing}
        </LabText>
      )}
    </View>
  );
}

function FilterChip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      onPress={onPress}
      pressScale={0.94}
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={[
        styles.chip,
        {
          backgroundColor: on ? c.primary : c.surface,
          borderColor: on ? c.primary : c.border,
        },
      ]}
    >
      <LabText
        variant="caption"
        style={{
          color: on ? c.onPrimary : c.text,
          fontFamily: labFonts.semibold,
        }}
      >
        {label}
      </LabText>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// The medal — the one object of this room
// ---------------------------------------------------------------------------

/**
 * Status by shape, not colour alone (lesson 18): unlocked = a rarity ring around the
 * full-colour emblem; locked = a flat disc, faded emblem, small lock; secret = "?".
 */
function Medal({ trophy, size }: { trophy: TrophyState; size: number }) {
  const { c } = useLab();
  const open = !!trophy.unlockedOn;
  const hidden = isHidden(trophy);
  const emoji = Math.round(size * 0.46);
  const inner = size - 7;
  if (!open) {
    return (
      <View
        style={[
          styles.medal,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.track,
          },
        ]}
      >
        {hidden ? (
          <Ionicons name="help" size={emoji} color={c.textFaint} />
        ) : (
          <Text
            maxFontSizeMultiplier={1}
            style={{ fontSize: emoji, lineHeight: emoji + 6, opacity: 0.3 }}
          >
            {trophy.achievement.icon}
          </Text>
        )}
        <View
          style={[
            styles.lock,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Ionicons name="lock-closed" size={9} color={c.textMuted} />
        </View>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={labRarity[trophy.rarity].ring}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.medal,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.medal,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: c.surface,
          },
        ]}
      >
        <Text
          maxFontSizeMultiplier={1}
          style={{ fontSize: emoji, lineHeight: emoji + 6 }}
        >
          {trophy.achievement.icon}
        </Text>
      </View>
    </LinearGradient>
  );
}

const WallCell = React.memo(function WallCell({
  trophy,
  name,
  onPress,
}: {
  trophy: TrophyState;
  name: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}
    >
      <Medal trophy={trophy} size={60} />
      <LabText
        variant="caption"
        tone={trophy.unlockedOn ? 'text' : 'muted'}
        numberOfLines={2}
        style={styles.medalName}
      >
        {name}
      </LabText>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Loyalty road
// ---------------------------------------------------------------------------

function LoyaltyRoad({ trophies }: { trophies: TrophyState[] }) {
  const { c, lang } = useLab();
  const tr = MOCK_COPY[lang].trophies;
  const t = useJournalT();
  const stops = trophies
    .filter(x => x.id.startsWith('loyalty-'))
    .map(x => ({ x, target: x.achievement.condition.target }))
    .sort((a, b) => a.target - b.target);
  const next = stops.find(s => s.target > LAB_ACTIVE_DAYS);
  return (
    <Surface>
      <View style={styles.loyaltyHead}>
        <LabText variant="number">{`${LAB_ACTIVE_DAYS}`}</LabText>
        <LabText
          variant="label"
          tone="muted"
          style={{ marginLeft: labSpace.sm, marginBottom: 8 }}
        >
          {t('social.loyalty_progress.activeDays')}
        </LabText>
      </View>
      {next && (
        <LabText variant="caption" tone="muted">
          {tr.nextLoyalty(
            next.target - LAB_ACTIVE_DAYS,
            t(next.x.achievement.nameKey as never)
          )}
        </LabText>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: labSpace.md }}
      >
        {stops.map((stop, i) => {
          const reached = stop.target <= LAB_ACTIVE_DAYS;
          return (
            <View key={stop.x.id} style={styles.stop}>
              {i > 0 && (
                <View
                  style={[
                    styles.stopLine,
                    { backgroundColor: reached ? c.reward : c.track },
                  ]}
                />
              )}
              <Medal trophy={stop.x} size={40} />
              <LabText
                variant="caption"
                tone={reached ? 'text' : 'faint'}
                style={styles.stopLabel}
              >
                {`${stop.target}`}
              </LabText>
            </View>
          );
        })}
      </ScrollView>
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Sheets
// ---------------------------------------------------------------------------

function RarityChip({ rarity }: { rarity: LabRarity }) {
  const { mode } = useLab();
  const look = labRarity[rarity];
  return (
    <View style={[styles.rarityChip, { backgroundColor: look.chipBg[mode] }]}>
      <Text
        style={[
          typeStyle('caption', look.chipText[mode]),
          { fontFamily: labFonts.bold, letterSpacing: 0.8 },
        ]}
      >
        {look.label}
      </Text>
    </View>
  );
}

function TrophySheet({
  trophy,
  today,
  name,
  bottomInset,
  onClosed,
}: {
  trophy: TrophyState;
  today: Date;
  name: string;
  bottomInset: number;
  onClosed: () => void;
}) {
  const { c, lang } = useLab();
  const tr = MOCK_COPY[lang].trophies;
  const t = useJournalT();
  const hidden = isHidden(trophy);
  const a = trophy.achievement;
  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.close')}
    >
      {() => (
        <View style={styles.sheet}>
          <Medal trophy={trophy} size={104} />
          <LabText variant="title" style={styles.sheetName}>
            {name}
          </LabText>
          <View style={styles.sheetTags}>
            <RarityChip rarity={trophy.rarity} />
            <LabText
              variant="label"
              tone="reward"
              style={{ fontFamily: labFonts.semibold }}
            >
              {`+${a.xpReward} XP`}
            </LabText>
          </View>
          <LabText variant="body" tone="muted" style={styles.sheetText}>
            {hidden ? tr.secretHint : t(a.descriptionKey as never)}
          </LabText>
          {trophy.unlockedOn ? (
            <View style={styles.sheetDone}>
              <Ionicons name="checkmark-circle" size={16} color={c.success} />
              <LabText variant="label" style={{ marginLeft: 6 }}>
                {whenText(trophy, today, t)}
              </LabText>
            </View>
          ) : (
            !hidden && (
              <View style={{ alignSelf: 'stretch', marginTop: labSpace.lg }}>
                <View style={styles.sheetProgress}>
                  <LabText variant="label" tone="muted" style={{ flex: 1 }}>
                    {t('achievements.detail.progressToUnlock')}
                  </LabText>
                  <LabText variant="label" tone="muted">
                    {t('achievements.detail.progressPercent', {
                      percent: Math.round(trophy.progress * 100),
                    })}
                  </LabText>
                </View>
                <ProgressBar
                  progress={trophy.progress}
                  colors={labRarity[trophy.rarity].ring}
                  height={8}
                  style={{ marginTop: 6 }}
                />
                <LabText
                  variant="caption"
                  tone="faint"
                  italic
                  style={{ marginTop: labSpace.sm, textAlign: 'center' }}
                >
                  {t('achievements.detail.actionHint')}
                </LabText>
              </View>
            )
          )}
        </View>
      )}
    </BottomSheet>
  );
}

function CollectionSheet({
  set,
  trophies,
  nameOf,
  bottomInset,
  onClosed,
  onTrophy,
}: {
  set: LabCollection;
  trophies: TrophyState[];
  nameOf: (x: TrophyState) => string;
  bottomInset: number;
  onClosed: () => void;
  onTrophy: (x: TrophyState) => void;
}) {
  const { lang, c } = useLab();
  const tr = MOCK_COPY[lang].trophies;
  const t = useJournalT();
  const parts = set.trophyIds
    .map(id => trophies.find(x => x.id === id))
    .filter((x): x is TrophyState => !!x);
  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClosed}
      label={t('common.close')}
    >
      {dismiss => (
        <>
          <View style={styles.collectionSheetHead}>
            <Text style={styles.collectionIcon}>{set.icon}</Text>
            <View style={{ flex: 1, marginLeft: labSpace.md }}>
              <LabText variant="title">
                {t(`social.trophy_combinations.collections.${set.id}` as never)}
              </LabText>
              <LabText variant="caption" tone="reward">
                {tr.collectionReward(set.bonusXp)}
              </LabText>
            </View>
          </View>
          {parts.map(x => (
            <PressableScale
              key={x.id}
              pressScale={0.98}
              accessibilityLabel={nameOf(x)}
              onPress={() => dismiss(() => onTrophy(x))}
              style={[styles.partRow, { borderColor: c.border }]}
            >
              <Medal trophy={x} size={40} />
              <LabText
                variant="bodyStrong"
                numberOfLines={1}
                style={{ flex: 1, marginLeft: labSpace.md }}
              >
                {nameOf(x)}
              </LabText>
              <Ionicons
                name={x.unlockedOn ? 'checkmark-circle' : 'chevron-forward'}
                size={18}
                color={x.unlockedOn ? c.success : c.textFaint}
              />
            </PressableScale>
          ))}
          <LabText
            variant="caption"
            tone="faint"
            italic
            style={{ marginTop: labSpace.sm, textAlign: 'center' }}
          >
            {tr.collectionNote}
          </LabText>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -labSpace.xl,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xxl,
    marginBottom: labSpace.md,
  },
  hero: {
    marginTop: labSpace.xl,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gems: {
    flexDirection: 'row',
    marginTop: labSpace.lg,
  },
  gem: {
    flex: 1,
    alignItems: 'center',
  },
  gemMark: {
    width: 18,
    height: 18,
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
  },
  recentRow: {
    paddingHorizontal: labSpace.xl,
    gap: labSpace.md,
  },
  recent: {
    width: 84,
    alignItems: 'center',
  },
  medal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalName: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  medalDate: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: labSpace.md,
    borderRadius: labRadius.md + 4,
  },
  collections: {
    paddingHorizontal: labSpace.xl,
    gap: labSpace.md,
  },
  collection: {
    width: 148,
    height: 152,
    padding: labSpace.md,
    borderRadius: labRadius.md + 4,
  },
  collectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: labSpace.xs,
  },
  collectionIcon: {
    fontSize: 26,
    lineHeight: 34,
  },
  pips: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },
  pip: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
  },
  loyaltyHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  stop: {
    width: 62,
    alignItems: 'center',
  },
  stopLine: {
    position: 'absolute',
    top: 19,
    left: -11,
    width: 22,
    height: 2,
  },
  stopLabel: {
    marginTop: 4,
    fontSize: 11,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingLeft: labSpace.lg,
    paddingRight: 6,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: labSpace.sm,
    paddingVertical: 0,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    paddingHorizontal: labSpace.xl,
    paddingTop: labSpace.md,
    gap: labSpace.sm,
  },
  chip: {
    paddingHorizontal: labSpace.md,
    height: 34,
    borderRadius: labRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanel: {
    marginTop: labSpace.md,
  },
  filterTitle: {
    marginTop: labSpace.md,
    marginBottom: labSpace.sm,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.sm,
  },
  wallRow: {
    gap: labSpace.sm,
  },
  cell: {
    flex: 1 / COLUMNS,
    alignItems: 'center',
    paddingVertical: labSpace.sm,
  },
  empty: {
    paddingVertical: labSpace.xxxl,
  },
  sheet: {
    alignItems: 'center',
  },
  sheetName: {
    marginTop: labSpace.md,
    textAlign: 'center',
  },
  sheetTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.md,
    marginTop: labSpace.sm,
  },
  sheetText: {
    marginTop: labSpace.md,
    textAlign: 'center',
  },
  sheetDone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.lg,
  },
  sheetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityChip: {
    paddingHorizontal: labSpace.sm,
    paddingVertical: 3,
    borderRadius: labRadius.pill,
  },
  collectionSheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: labSpace.md,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: labSpace.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
