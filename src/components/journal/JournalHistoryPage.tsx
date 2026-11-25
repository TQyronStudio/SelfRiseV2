/**
 * Journal history as a calendar (migration E13, from the Design Lab's
 * JournalHistoryConcept). Replaces the old one-day-at-a-time screen: a month
 * shows the whole rhythm at once and a tap opens a day.
 *
 * - A day's state is told by SHAPE (journalHistoryLogic): filled = complete,
 *   ★ = bonus day, dashed = started, ice + ❄ = a frozen day saved with an ad;
 *   a soft ribbon joins the days of an unbroken streak.
 * - The day panel keeps the old ‹ › stepping; every entry keeps "⋯" = edit /
 *   delete (the Journal's own sheet and confirm). Months go back to the first
 *   entry.
 * - Search replaces the calendar while typing; matches are picked out in the
 *   text. It filters the journal the context already holds (the storage's
 *   search did the same in JavaScript) and the results stay a virtualized list
 *   (FlatList, audit N9).
 * - A failed edit or delete is a calm note (7.9), never a system alert.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { useGratitude } from '@/src/contexts/GratitudeContext';
import { useI18n } from '@/src/hooks/useI18n';
import { fixed, fonts, radius, space } from '@/src/design/tokens';
import { feel } from '@/src/services/feelService';
import { DateString } from '@/src/types/common';
import { Gratitude } from '@/src/types/gratitude';
import {
  addDays,
  formatDateToString,
  parseDate,
  subtractDays,
  today as todayString,
} from '@/src/utils/date';
import { contentColumn } from '@/src/utils/layout';
import { JOURNAL_DAILY_GOAL } from '@/src/utils/journalXp';
import {
  carriesStreak,
  countsByDay,
  journalDayState,
  JournalDayState,
  monthDiff,
  monthRows,
  paidDays,
  positionInDay,
  searchEntries,
} from '@/src/screens/journal/journalHistoryLogic';
import {
  AppText,
  Chip,
  ConfirmSheet,
  PageTopBar,
  PressableScale,
  Surface,
  typeStyle,
  useProblemNote,
} from '@/src/components/ui';
import { EntryActionsSheet, EntryCard } from './EntryCard';
import { ComposerMode, EntryComposer } from './EntryComposer';

const DISC = 34;
const CELL_H = 46;
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const asDate = (d: DateString | Date): DateString =>
  typeof d === 'string' ? d : formatDateToString(d);

export function JournalHistoryPage({
  bottomInset,
  topInset,
  onClose,
}: {
  bottomInset: number;
  topInset: number;
  onClose: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const { state, actions } = useGratitude();
  const { showProblem } = useProblemNote();
  const locale = t('common.locale');
  const today = todayString();
  const entries = state.gratitudes;

  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<DateString>(today);
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [actionsFor, setActionsFor] = useState<Gratitude | null>(null);
  const [composer, setComposer] = useState<ComposerMode | null>(null);
  const [deleting, setDeleting] = useState<Gratitude | null>(null);

  const counts = useMemo(() => countsByDay(entries), [entries]);
  const paid = useMemo(
    () => paidDays(state.streakInfo?.warmUpPayments),
    [state.streakInfo?.warmUpPayments]
  );
  const stateOf = (d: DateString) =>
    journalDayState(d, today, counts.get(d) ?? 0, paid.has(d));
  // Months go back to the first entry (at least the current one).
  const earliest = useMemo(
    () => entries.reduce<DateString>((min, e) => (e.date < min ? e.date : min), today),
    [entries, today]
  );
  const minOffset = monthDiff(today, earliest);

  const searching = term.trim().length > 0;
  const results = useMemo(() => searchEntries(entries, term), [entries, term]);
  const dayEntries = useMemo(
    () =>
      entries
        .filter(e => e.date === selected)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [entries, selected]
  );

  const select = (d: DateString) => {
    feel('tap');
    setSelected(d);
    const diff = monthDiff(today, d);
    if (diff !== offset) {
      setDir(diff > offset ? 1 : -1);
      setOffset(diff);
    }
  };
  const goMonth = (step: 1 | -1) => {
    feel('tap');
    setDir(step);
    setOffset(o => o + step);
  };

  const dayLabel = (d: DateString, long = true) =>
    parseDate(d).toLocaleDateString(locale, {
      weekday: long ? 'long' : 'short',
      day: 'numeric',
      month: long ? 'long' : 'short',
    });
  const selectedState = stateOf(selected);

  const saveEdit = async (mode: ComposerMode, text: string) => {
    if (mode.kind !== 'edit') return;
    try {
      await actions.updateGratitude(mode.id, { content: text });
    } catch (error) {
      console.error('Journal entry not saved:', error);
      showProblem({ message: t('common.errors.gratitude.failedToSave') });
      setComposer({ ...mode, text });
    }
  };
  const confirmDelete = async (entry: Gratitude) => {
    try {
      await actions.deleteGratitude(entry.id);
    } catch (error) {
      console.error('Journal entry not deleted:', error);
      showProblem({ message: t('journal.errors.deleteFailed') });
    }
  };

  const header = (
    <View>
      <PageTopBar onClose={onClose} label={t('common.close')} />
      <AppText variant="overline" tone="muted" style={styles.overline}>
        {t('journal.title')}
      </AppText>
      <AppText variant="display" style={styles.title}>
        {t('journal.historyTitle')}
      </AppText>

      {/* Search */}
      <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Ionicons name="search" size={18} color={c.textMuted} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder={t('journal.searchPlaceholder')}
          placeholderTextColor={c.textFaint}
          returnKeyType="search"
          accessibilityLabel={t('journal.searchPlaceholder')}
          style={[typeStyle('body', c.text), styles.searchInput]}
        />
        {term.length > 0 && (
          <PressableScale
            onPress={() => setTerm('')}
            pressScale={0.85}
            accessibilityLabel={t('journal.historyPage.clearSearch')}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={18} color={c.textFaint} />
          </PressableScale>
        )}
      </View>

      {searching ? (
        <AppText variant="label" tone="muted" italic style={styles.resultsLine}>
          {results.length > 0
            ? t('journal.searchResults', { count: results.length, term: term.trim() })
            : t('journal.noSearchResults', { term: term.trim() })}
        </AppText>
      ) : (
        <Animated.View entering={FadeIn.duration(200)}>
          <Surface style={styles.calendar}>
            <MonthHeader
              offset={offset}
              minOffset={minOffset}
              today={today}
              locale={locale}
              onPrev={() => goMonth(-1)}
              onNext={() => goMonth(1)}
              onToday={offset !== 0 || selected !== today ? () => select(today) : undefined}
            />
            <View style={styles.weekRow}>
              {Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={styles.weekCell}>
                  <AppText variant="caption" tone="faint">
                    {new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' })}
                  </AppText>
                </View>
              ))}
            </View>
            <Animated.View
              key={offset}
              entering={(dir > 0 ? FadeInRight : FadeInLeft).duration(260)}
            >
              <MonthGrid
                offset={offset}
                today={today}
                selected={selected}
                stateOf={stateOf}
                countOf={d => counts.get(d) ?? 0}
                locale={locale}
                onSelect={select}
              />
            </Animated.View>
            <Legend />
          </Surface>

          {/* The selected day */}
          <Surface style={styles.dayPanel}>
            <View style={styles.dayHead}>
              <StepButton
                icon="chevron-back"
                label={t('journal.historyPage.previousDay')}
                disabled={selected <= earliest}
                onPress={() => select(asDate(subtractDays(selected, 1)))}
              />
              <View style={styles.dayTitle}>
                <AppText variant="titleSm" numberOfLines={1}>
                  {dayLabel(selected)}
                </AppText>
                <DayChip state={selectedState} count={counts.get(selected) ?? 0} />
              </View>
              <StepButton
                icon="chevron-forward"
                label={t('journal.historyPage.nextDay')}
                disabled={selected >= today}
                onPress={() => select(asDate(addDays(selected, 1)))}
              />
            </View>
          </Surface>
          {selectedState === 'paid' && (
            <AppText variant="caption" italic style={[styles.paidNote, { color: c.ice }]}>
              {t('journal.calendar.paidDay')}
            </AppText>
          )}
          {dayEntries.length === 0 && (
            <AppText variant="body" tone="muted" italic style={styles.emptyDay}>
              {t('journal.emptyHistory', { date: dayLabel(selected) })}
            </AppText>
          )}
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={searching ? results : dayEntries}
        keyExtractor={e => e.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          contentColumn,
          {
            paddingTop: topInset,
            paddingHorizontal: space.xl,
            paddingBottom: bottomInset + space.xxl,
          },
        ]}
        renderItem={({ item, index }) => (
          <View style={styles.entryGap}>
            <EntryCard
              id={item.id}
              type={item.type === 'self-praise' ? 'self-praise' : 'gratitude'}
              text={item.content}
              time={new Date(item.createdAt).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
              })}
              position={searching ? positionInDay(item, entries) : index + 1}
              fresh={false}
              {...(searching ? { dateLabel: dayLabel(item.date), term } : null)}
              onMore={id => setActionsFor(entries.find(e => e.id === id) ?? null)}
            />
          </View>
        )}
      />

      {actionsFor && (
        <EntryActionsSheet
          text={actionsFor.content}
          bottomInset={bottomInset}
          onClosed={() => setActionsFor(null)}
          onEdit={() =>
            setComposer({
              kind: 'edit',
              id: actionsFor.id,
              type: actionsFor.type === 'self-praise' ? 'self-praise' : 'gratitude',
              text: actionsFor.content,
            })
          }
          onDelete={() => setDeleting(actionsFor)}
        />
      )}
      {composer && (
        <EntryComposer
          mode={composer}
          nextPosition={0}
          bottomInset={bottomInset}
          onClosed={() => setComposer(null)}
          onSave={(_type, text) => void saveEdit(composer, text)}
        />
      )}
      {deleting && (
        <ConfirmSheet
          title={t('journal.deleteConfirm.title')}
          message={t('journal.deleteConfirm.message', {
            type:
              deleting.type === 'self-praise'
                ? t('journal.deleteConfirm.selfPraise')
                : t('journal.deleteConfirm.gratitude'),
          })}
          confirm={t('common.delete')}
          cancel={t('common.cancel')}
          icon="trash-outline"
          bottomInset={bottomInset}
          onClosed={() => setDeleting(null)}
          onConfirm={() => void confirmDelete(deleting)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Month
// ---------------------------------------------------------------------------

function MonthHeader({
  offset,
  minOffset,
  today,
  locale,
  onPrev,
  onNext,
  onToday,
}: {
  offset: number;
  minOffset: number;
  today: DateString;
  locale: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: (() => void) | undefined;
}) {
  const { t } = useI18n();
  const base = parseDate(today);
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const title = month.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return (
    <View style={styles.monthHead}>
      <StepButton
        icon="chevron-back"
        label={t('habits.detail.previousMonth')}
        disabled={offset <= minOffset}
        onPress={onPrev}
      />
      <View style={styles.monthTitle}>
        <AppText variant="title" style={styles.capitalize}>
          {title}
        </AppText>
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
        label={t('habits.detail.nextMonth')}
        disabled={offset >= 0}
        onPress={onNext}
      />
    </View>
  );
}

function MonthGrid({
  offset,
  today,
  selected,
  stateOf,
  countOf,
  locale,
  onSelect,
}: {
  offset: number;
  today: DateString;
  selected: DateString;
  stateOf: (d: DateString) => JournalDayState;
  countOf: (d: DateString) => number;
  locale: string;
  onSelect: (d: DateString) => void;
}) {
  const base = parseDate(today);
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const rows = monthRows(first.getFullYear(), first.getMonth());
  return (
    <View>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map((d, i) => {
            if (!d) return <View key={i} style={styles.cell} />;
            const state = stateOf(d);
            const streak = carriesStreak(state);
            const prev = row[i - 1];
            const next = row[i + 1];
            return (
              <DayCell
                key={d}
                date={d}
                state={state}
                count={countOf(d)}
                isToday={d === today}
                selected={d === selected}
                ribbonLeft={streak && !!prev && carriesStreak(stateOf(prev))}
                ribbonRight={streak && !!next && carriesStreak(stateOf(next))}
                locale={locale}
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
  locale,
  onPress,
}: {
  date: DateString;
  state: JournalDayState;
  count: number;
  isToday: boolean;
  selected: boolean;
  ribbonLeft: boolean;
  ribbonRight: boolean;
  locale: string;
  onPress: () => void;
}) {
  const { c } = useDesign();
  const { t } = useI18n();
  const future = state === 'future';
  const complete = state === 'complete';
  const label = `${parseDate(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  })} · ${t('journal.entryCount', { count })}${
    state === 'paid' ? ` · ${t('journal.calendar.legendPaid')}` : ''
  }`;
  const disc = complete
    ? { backgroundColor: c.primary }
    : state === 'paid'
      ? { backgroundColor: c.iceSoft, borderWidth: 1.5, borderColor: c.iceRing }
      : state === 'partial'
        ? { borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed' as const }
        : null;
  const numberColor = complete
    ? c.onPrimary
    : state === 'paid'
      ? c.ice
      : state === 'partial'
        ? c.primary
        : future
          ? c.textFaint
          : c.textMuted;

  return (
    <PressableScale
      {...(future ? null : { onPress })}
      feel={null}
      pressScale={0.88}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={styles.cell}
    >
      {ribbonLeft && (
        <View style={[styles.ribbon, styles.ribbonLeft, { backgroundColor: c.primarySoft }]} />
      )}
      {ribbonRight && (
        <View style={[styles.ribbon, styles.ribbonRight, { backgroundColor: c.primarySoft }]} />
      )}
      {selected && <View style={[styles.selectRing, { borderColor: c.text }]} />}
      <View>
        <View style={[styles.disc, disc]}>
          <AppText
            variant="label"
            style={{ color: numberColor, fontFamily: complete || isToday ? fonts.bold : fonts.medium }}
          >
            {parseDate(date).getDate()}
          </AppText>
        </View>
        {complete && count > JOURNAL_DAILY_GOAL && (
          <View style={[styles.corner, { backgroundColor: c.reward, borderColor: c.surface }]}>
            <Ionicons name="star" size={8} color={fixed.ink} />
          </View>
        )}
        {state === 'paid' && (
          <View style={[styles.corner, { backgroundColor: c.ice, borderColor: c.surface }]}>
            <Ionicons name="snow" size={8} color={c.surface} />
          </View>
        )}
      </View>
      {isToday && <View style={[styles.todayDot, { backgroundColor: c.primary }]} />}
    </PressableScale>
  );
}

function Legend() {
  const { c } = useDesign();
  const { t } = useI18n();
  const items: { key: string; label: string; mark: React.ReactNode }[] = [
    {
      key: 'complete',
      label: t('journal.calendar.legendComplete', { goal: JOURNAL_DAILY_GOAL }),
      mark: <View style={[styles.legendDisc, { backgroundColor: c.primary }]} />,
    },
    {
      key: 'bonus',
      label: t('journal.calendar.legendBonus'),
      mark: (
        <View style={[styles.legendDisc, { backgroundColor: c.primary }]}>
          <View style={[styles.legendCorner, { backgroundColor: c.reward, borderColor: c.surface }]}>
            <Ionicons name="star" size={6} color={fixed.ink} />
          </View>
        </View>
      ),
    },
    {
      key: 'partial',
      label: t('journal.calendar.legendPartial'),
      mark: (
        <View
          style={[styles.legendDisc, { borderWidth: 1.5, borderColor: c.primary, borderStyle: 'dashed' }]}
        />
      ),
    },
    {
      key: 'paid',
      label: t('journal.calendar.legendPaid'),
      mark: (
        <View
          style={[
            styles.legendDisc,
            styles.center,
            { backgroundColor: c.iceSoft, borderWidth: 1.5, borderColor: c.iceRing },
          ]}
        >
          <Ionicons name="snow" size={8} color={c.ice} />
        </View>
      ),
    },
  ];
  return (
    <View style={[styles.legend, { borderColor: c.border }]}>
      {items.map(item => (
        <View key={item.key} style={styles.legendItem}>
          {item.mark}
          <AppText variant="caption" tone="muted" style={styles.legendLabel}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function DayChip({ state, count }: { state: JournalDayState; count: number }) {
  const { t } = useI18n();
  if (state === 'complete') {
    const bonus = count > JOURNAL_DAILY_GOAL;
    return (
      <View style={styles.chipGap}>
        <Chip
          tone={bonus ? 'reward' : 'success'}
          icon={bonus ? 'star' : 'checkmark-circle'}
          label={t('journal.entryCount', { count })}
        />
      </View>
    );
  }
  if (state === 'paid' || state === 'partial') {
    return (
      <AppText variant="caption" tone="muted" style={styles.chipGap}>
        {`${count}/${JOURNAL_DAILY_GOAL}`}
      </AppText>
    );
  }
  return (
    <AppText variant="caption" tone="faint" style={styles.chipGap}>
      —
    </AppText>
  );
}

function StepButton({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { c } = useDesign();
  return (
    <PressableScale
      {...(disabled ? null : { onPress })}
      feel={disabled ? null : 'tap'}
      pressScale={0.88}
      accessibilityLabel={label}
      style={[styles.step, { backgroundColor: c.track, opacity: disabled ? 0.35 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={c.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overline: {
    marginTop: space.sm,
  },
  title: {
    marginTop: space.sm,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
    paddingHorizontal: space.lg,
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: space.sm,
    paddingVertical: 0,
  },
  clear: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space.sm,
  },
  resultsLine: {
    marginTop: space.lg,
  },
  calendar: {
    marginTop: space.lg,
    paddingHorizontal: space.md,
  },
  monthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  monthTitle: {
    flex: 1,
    alignItems: 'center',
  },
  todayPill: {
    marginRight: 2,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: space.lg,
    marginBottom: space.xs,
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
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    position: 'absolute',
    bottom: 1,
    width: 4,
    height: 4,
    borderRadius: radius.pill,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.md,
    paddingTop: space.md,
    paddingBottom: space.xs,
    paddingHorizontal: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLabel: {
    marginLeft: 6,
  },
  legendDisc: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
  },
  legendCorner: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPanel: {
    marginTop: space.lg,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  dayTitle: {
    flex: 1,
    alignItems: 'center',
  },
  chipGap: {
    marginTop: 4,
  },
  paidNote: {
    marginTop: space.md,
  },
  emptyDay: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  entryGap: {
    marginTop: space.md,
  },
});
