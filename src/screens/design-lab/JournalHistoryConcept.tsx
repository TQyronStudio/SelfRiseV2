/**
 * Journal history as a calendar (kolo 20) — today's app steps one day at a time
 * (‹ date ›); here a month shows the whole rhythm at once and a tap opens a day.
 *
 * A day's state is told by SHAPE (lesson 18), so it reads in both themes and
 * without colour vision:
 *   filled disc         = complete (3+ entries)
 *   filled + ★          = bonus day (4+)
 *   dashed ring         = started (1–2) — not complete
 *   ice disc + ❄        = frozen day saved with an ad (bridges the streak)
 *   plain number        = nothing written
 * A soft ribbon joins the days of an unbroken streak, so a streak — and the day
 * that broke it — are visible at a glance.
 *
 * The day panel keeps today's ‹ › stepping, and every entry keeps ⋯ = edit / delete.
 * Search replaces the calendar while typing; matches are picked out in the text.
 *
 * GOING LIVE (1:1) — see PREVOD.md:
 * - Replaces app/journal-history.tsx (route stays). Day states from GratitudeContext
 *   (counts per day + warmUpPayments for the ❄ days) — never from journalMock.
 * - Search keeps the virtualized list (FlatList, audit N9): results can be the
 *   whole journal. The lab caps them instead.
 * - Close button sits in the badge row on the right (lesson 10).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { selection } from '@/src/services/hapticsService';
import { contentColumn } from '@/src/utils/layout';
import {
  Chip,
  LabText,
  PressableScale,
  Surface,
  typeStyle,
  useLab,
} from './labPrimitives';
import { labFonts, labRadius, labSpace } from './labTokens';
import { MOCK_COPY } from './mockCopy';
import { addDays, dateKey, weekdayIndex } from './habitsMock';
import { DayState, LabEntry, useLabJournal } from './journalMock';
import {
  EntryCard,
  formatDay,
  iceColors,
  PageTopBar,
  useJournalT,
} from './journalParts';

const SEARCH_CAP = 40;
const MONTHS_BACK = 3;
const DISC = 34;
const CELL_H = 46;

export function JournalHistoryConcept({
  bottomInset,
  onClose,
  onEntryMore,
}: {
  bottomInset: number;
  onClose: () => void;
  onEntryMore: (entry: LabEntry, position: number) => void;
}) {
  const { c, lang, mode } = useLab();
  const t = useJournalT();
  const copy = MOCK_COPY[lang];
  const journal = useLabJournal();
  const today = journal.today;
  const todayKey = dateKey(today);
  const [term, setTerm] = useState('');
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [selected, setSelected] = useState(today);
  const selectedKey = dateKey(selected);

  const searching = term.trim().length > 0;
  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    return journal.entries
      .filter(e => e.text[lang].toLowerCase().includes(needle))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [journal.entries, term, lang]);

  const goMonth = (step: 1 | -1) => {
    selection();
    setDir(step);
    setOffset(o => o + step);
  };
  const select = (d: Date) => {
    selection();
    setSelected(d);
    const monthDiff =
      (d.getFullYear() - today.getFullYear()) * 12 +
      d.getMonth() -
      today.getMonth();
    if (monthDiff !== offset) {
      setDir(monthDiff > offset ? 1 : -1);
      setOffset(monthDiff);
    }
  };

  const dayEntries = journal.entriesOn(selectedKey);
  const state = journal.dayState(selected);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        contentColumn,
        {
          paddingHorizontal: labSpace.xl,
          paddingBottom: bottomInset + labSpace.xxl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <LabText
        variant="overline"
        tone="muted"
        style={{ marginTop: labSpace.sm }}
      >
        {t('journal.title')}
      </LabText>
      <LabText variant="display" style={{ marginTop: labSpace.sm }}>
        {t('journal.historyTitle')}
      </LabText>

      {/* Search */}
      <View
        style={[
          styles.search,
          { backgroundColor: c.surface, borderColor: c.border },
        ]}
      >
        <Ionicons name="search" size={18} color={c.textMuted} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder={t('journal.searchPlaceholder')}
          placeholderTextColor={c.textFaint}
          returnKeyType="search"
          style={[typeStyle('body', c.text), styles.searchInput]}
        />
        {term.length > 0 && (
          <PressableScale
            onPress={() => setTerm('')}
            pressScale={0.85}
            accessibilityLabel={t('common.close')}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={18} color={c.textFaint} />
          </PressableScale>
        )}
      </View>

      {searching ? (
        <Animated.View key="results" entering={FadeIn.duration(200)}>
          <LabText
            variant="label"
            tone="muted"
            italic
            style={{ marginTop: labSpace.lg }}
          >
            {results.length > 0
              ? t('journal.searchResults', { count: results.length, term })
              : t('journal.noSearchResults', { term })}
          </LabText>
          {results.slice(0, SEARCH_CAP).map(entry => (
            <View key={entry.id} style={{ marginTop: labSpace.md }}>
              <EntryCard
                entry={entry}
                position={journal.entriesOn(entry.date).indexOf(entry) + 1}
                dateLabel={formatDay(entry.date, copy.locale, true)}
                term={term}
                onMore={() =>
                  onEntryMore(
                    entry,
                    journal.entriesOn(entry.date).indexOf(entry) + 1
                  )
                }
              />
            </View>
          ))}
        </Animated.View>
      ) : (
        <Animated.View key="calendar" entering={FadeIn.duration(200)}>
          <Surface
            style={{ marginTop: labSpace.lg, paddingHorizontal: labSpace.md }}
          >
            <MonthHeader
              offset={offset}
              onPrev={() => goMonth(-1)}
              onNext={() => goMonth(1)}
              onToday={
                offset !== 0 || selectedKey !== todayKey
                  ? () => select(today)
                  : undefined
              }
            />
            <View style={styles.weekRow}>
              {copy.weekdays.map((letter, i) => (
                <View key={i} style={styles.weekCell}>
                  <LabText variant="caption" tone="faint">
                    {letter}
                  </LabText>
                </View>
              ))}
            </View>
            <Animated.View
              key={offset}
              entering={(dir > 0 ? FadeInRight : FadeInLeft).duration(260)}
            >
              <MonthGrid
                offset={offset}
                selectedKey={selectedKey}
                onSelect={select}
              />
            </Animated.View>
            <Legend />
          </Surface>

          {/* The selected day */}
          <Surface style={{ marginTop: labSpace.lg }}>
            <View style={styles.dayHead}>
              <StepButton
                icon="chevron-back"
                label="‹"
                onPress={() => select(addDays(selected, -1))}
              />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <LabText variant="titleSm" numberOfLines={1}>
                  {formatDay(selectedKey, copy.locale, true)}
                </LabText>
                <DayChip state={state} count={dayEntries.length} />
              </View>
              <StepButton
                icon="chevron-forward"
                label="›"
                disabled={selectedKey >= todayKey}
                onPress={() => select(addDays(selected, 1))}
              />
            </View>
          </Surface>
          <Animated.View key={selectedKey} entering={FadeIn.duration(240)}>
            {state === 'paid' && (
              <LabText
                variant="caption"
                italic
                style={{
                  marginTop: labSpace.md,
                  color: iceColors(mode).fg,
                }}
              >
                {copy.journal.paidDay}
              </LabText>
            )}
            {dayEntries.length === 0 ? (
              <LabText
                variant="body"
                tone="muted"
                italic
                style={{ marginTop: labSpace.lg, textAlign: 'center' }}
              >
                {t('journal.emptyHistory', {
                  date: formatDay(selectedKey, copy.locale, true),
                })}
              </LabText>
            ) : (
              dayEntries.map((entry, i) => (
                <Animated.View
                  key={entry.id}
                  exiting={FadeOut.duration(180)}
                  layout={LinearTransition.duration(260)}
                  style={{ marginTop: labSpace.md }}
                >
                  <EntryCard
                    entry={entry}
                    position={i + 1}
                    onMore={() => onEntryMore(entry, i + 1)}
                  />
                </Animated.View>
              ))
            )}
          </Animated.View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Month
// ---------------------------------------------------------------------------

function MonthHeader({
  offset,
  onPrev,
  onNext,
  onToday,
}: {
  offset: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: (() => void) | undefined;
}) {
  const { lang } = useLab();
  const t = useJournalT();
  const { today } = useLabJournal();
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const title = month.toLocaleDateString(MOCK_COPY[lang].locale, {
    month: 'long',
    year: 'numeric',
  });
  return (
    <View style={styles.monthHead}>
      <StepButton
        icon="chevron-back"
        label="‹"
        disabled={offset <= -MONTHS_BACK}
        onPress={onPrev}
      />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <LabText variant="title" style={{ textTransform: 'capitalize' }}>
          {title}
        </LabText>
      </View>
      {onToday && (
        <PressableScale
          onPress={onToday}
          accessibilityLabel={t('journal.today')}
          pressScale={0.92}
          style={styles.todayPill}
        >
          <Chip tone="primary" label={t('journal.today')} />
        </PressableScale>
      )}
      <StepButton
        icon="chevron-forward"
        label="›"
        disabled={offset >= 0}
        onPress={onNext}
      />
    </View>
  );
}

function MonthGrid({
  offset,
  selectedKey,
  onSelect,
}: {
  offset: number;
  selectedKey: string;
  onSelect: (d: Date) => void;
}) {
  const journal = useLabJournal();
  const { today } = journal;
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate();
  const lead = weekdayIndex(first);
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) =>
    cells.slice(r * 7, r * 7 + 7)
  );
  const inStreak = (d: Date | null | undefined) => {
    if (!d) return false;
    const s = journal.dayState(d);
    return s === 'complete' || s === 'paid';
  };

  return (
    <View>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const key = dateKey(d);
            const streakHere = inStreak(d);
            return (
              <DayCell
                key={key}
                date={d}
                state={journal.dayState(d)}
                count={journal.countOn(key)}
                isToday={key === dateKey(today)}
                selected={key === selectedKey}
                ribbonLeft={streakHere && inStreak(row[i - 1])}
                ribbonRight={streakHere && inStreak(row[i + 1])}
                onPress={() => onSelect(d)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function DayCell({
  date,
  state,
  count,
  isToday,
  selected,
  ribbonLeft,
  ribbonRight,
  onPress,
}: {
  date: Date;
  state: DayState;
  count: number;
  isToday: boolean;
  selected: boolean;
  ribbonLeft: boolean;
  ribbonRight: boolean;
  onPress: () => void;
}) {
  const { c, mode, lang } = useLab();
  const ice = iceColors(mode);
  const future = state === 'future';
  const complete = state === 'complete';
  const label = `${date.toLocaleDateString(MOCK_COPY[lang].locale, {
    day: 'numeric',
    month: 'long',
  })} · ${MOCK_COPY[lang].journal.entries(count)}`;

  const disc = complete
    ? { backgroundColor: c.primary }
    : state === 'paid'
      ? { backgroundColor: ice.soft, borderWidth: 1.5, borderColor: ice.ring }
      : state === 'partial'
        ? {
            borderWidth: 1.5,
            borderColor: c.primary,
            borderStyle: 'dashed' as const,
          }
        : null;
  const numberColor = complete
    ? c.onPrimary
    : state === 'paid'
      ? ice.fg
      : state === 'partial'
        ? c.primary
        : future
          ? c.textFaint
          : c.textMuted;

  return (
    <PressableScale
      {...(future ? null : { onPress })}
      haptic={null}
      pressScale={0.88}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={styles.cell}
    >
      {ribbonLeft && (
        <View
          style={[
            styles.ribbon,
            styles.ribbonLeft,
            { backgroundColor: c.primarySoft },
          ]}
        />
      )}
      {ribbonRight && (
        <View
          style={[
            styles.ribbon,
            styles.ribbonRight,
            { backgroundColor: c.primarySoft },
          ]}
        />
      )}
      {selected && (
        <View style={[styles.selectRing, { borderColor: c.text }]} />
      )}
      <View>
        <View style={[styles.disc, disc]}>
          <LabText
            variant="label"
            style={{
              color: numberColor,
              fontFamily: complete || isToday ? labFonts.bold : labFonts.medium,
            }}
          >
            {date.getDate()}
          </LabText>
        </View>
        {complete && count >= 4 && (
          <View
            style={[
              styles.corner,
              { backgroundColor: c.reward, borderColor: c.surface },
            ]}
          >
            <Ionicons name="star" size={8} color="#1A2233" />
          </View>
        )}
        {state === 'paid' && (
          <View
            style={[
              styles.corner,
              { backgroundColor: ice.fg, borderColor: c.surface },
            ]}
          >
            <Ionicons name="snow" size={8} color="#FFFFFF" />
          </View>
        )}
      </View>
      {isToday && (
        <View style={[styles.todayDot, { backgroundColor: c.primary }]} />
      )}
    </PressableScale>
  );
}

function Legend() {
  const { c, lang, mode } = useLab();
  const l = MOCK_COPY[lang].journal.legend;
  const ice = iceColors(mode);
  const items: { key: string; label: string; mark: React.ReactNode }[] = [
    {
      key: 'complete',
      label: l.complete,
      mark: (
        <View style={[styles.legendDisc, { backgroundColor: c.primary }]} />
      ),
    },
    {
      key: 'bonus',
      label: l.bonus,
      mark: (
        <View style={[styles.legendDisc, { backgroundColor: c.primary }]}>
          <View
            style={[
              styles.legendCorner,
              { backgroundColor: c.reward, borderColor: c.surface },
            ]}
          >
            <Ionicons name="star" size={6} color="#1A2233" />
          </View>
        </View>
      ),
    },
    {
      key: 'partial',
      label: l.partial,
      mark: (
        <View
          style={[
            styles.legendDisc,
            { borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed' },
          ]}
        />
      ),
    },
    {
      key: 'paid',
      label: l.paid,
      mark: (
        <View
          style={[
            styles.legendDisc,
            {
              backgroundColor: ice.soft,
              borderWidth: 1.5,
              borderColor: ice.ring,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Ionicons name="snow" size={8} color={ice.fg} />
        </View>
      ),
    },
  ];
  return (
    <View style={[styles.legend, { borderColor: c.border }]}>
      {items.map(item => (
        <View key={item.key} style={styles.legendItem}>
          {item.mark}
          <LabText variant="caption" tone="muted" style={{ marginLeft: 6 }}>
            {item.label}
          </LabText>
        </View>
      ))}
    </View>
  );
}

function DayChip({ state, count }: { state: DayState; count: number }) {
  const { lang } = useLab();
  if (state === 'complete') {
    return (
      <View style={{ marginTop: 4 }}>
        <Chip
          tone={count >= 4 ? 'reward' : 'success'}
          icon={count >= 4 ? 'star' : 'checkmark-circle'}
          label={MOCK_COPY[lang].journal.entries(count)}
        />
      </View>
    );
  }
  if (state === 'paid' || state === 'partial') {
    return (
      <LabText variant="caption" tone="muted" style={{ marginTop: 4 }}>
        {`${count}/3`}
      </LabText>
    );
  }
  return (
    <LabText variant="caption" tone="faint" style={{ marginTop: 4 }}>
      —
    </LabText>
  );
}

function StepButton({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { c } = useLab();
  return (
    <PressableScale
      {...(disabled ? null : { onPress })}
      haptic={null}
      pressScale={0.88}
      accessibilityLabel={label}
      style={[
        styles.step,
        { backgroundColor: c.track, opacity: disabled ? 0.35 : 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={c.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: labSpace.xl,
    paddingHorizontal: labSpace.lg,
    height: 50,
    borderRadius: labRadius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: labSpace.sm,
    paddingVertical: 0,
  },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -labSpace.sm,
  },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.sm,
  },
  todayPill: {
    marginRight: 2,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: labSpace.lg,
    marginBottom: labSpace.xs,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbon: {
    position: 'absolute',
    top: (CELL_H - DISC) / 2,
    height: DISC,
    width: '50%',
  },
  ribbonLeft: {
    left: 0,
  },
  ribbonRight: {
    right: 0,
  },
  selectRing: {
    position: 'absolute',
    width: DISC + 8,
    height: DISC + 8,
    borderRadius: (DISC + 8) / 2,
    borderWidth: 2,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    position: 'absolute',
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: labSpace.md,
    marginTop: labSpace.md,
    paddingTop: labSpace.md,
    paddingHorizontal: labSpace.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDisc: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendCorner: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: labSpace.sm,
  },
});
