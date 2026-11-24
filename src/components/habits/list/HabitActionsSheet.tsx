/**
 * "⋯" on a habit (migration E5, R-4c): the four per-row buttons of the old list
 * in one sheet — calendar & stats, edit, pause (Resume for a paused habit),
 * delete. Delete asks first (ConfirmSheet, never an Alert — O-14) with the app's
 * existing wording.
 */
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDesign } from '@/src/contexts/ThemeContext';
import { space } from '@/src/design/tokens';
import { useI18n } from '@/src/hooks/useI18n';
import {
  AppText,
  BottomSheet,
  ConfirmSheet,
  PressableScale,
} from '@/src/components/ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface HabitActionsSheetProps {
  name: string;
  paused: boolean;
  bottomInset: number;
  onClose: () => void;
  onCalendar: () => void;
  onEdit: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
}

export function HabitActionsSheet({
  name,
  paused,
  bottomInset,
  onClose,
  onCalendar,
  onEdit,
  onTogglePause,
  onDelete,
}: HabitActionsSheetProps) {
  const { c } = useDesign();
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <ConfirmSheet
        title={t('habits.confirmDelete')}
        message={t('habits.deleteMessage')}
        confirm={t('common.delete')}
        cancel={t('common.cancel')}
        icon="trash-outline"
        bottomInset={bottomInset}
        onClosed={onClose}
        onConfirm={onDelete}
      />
    );
  }

  const rows: {
    icon: IoniconName;
    label: string;
    color: string;
    run: 'calendar' | 'edit' | 'pause' | 'delete';
  }[] = [
    {
      icon: 'calendar-outline',
      label: t('habits.actions.calendarStats'),
      color: c.primary,
      run: 'calendar',
    },
    {
      icon: 'create-outline',
      label: t('common.edit'),
      color: c.text,
      run: 'edit',
    },
    paused
      ? {
          icon: 'play-circle-outline',
          label: t('habits.list.resume'),
          color: c.text,
          run: 'pause',
        }
      : {
          icon: 'pause-circle-outline',
          label: t('habits.actions.pause'),
          color: c.text,
          run: 'pause',
        },
    {
      icon: 'trash-outline',
      label: t('common.delete'),
      color: c.danger,
      run: 'delete',
    },
  ];

  return (
    <BottomSheet
      bottomInset={bottomInset}
      onClosed={onClose}
      label={t('common.cancel')}
    >
      {dismiss => (
        <>
          <AppText variant="titleSm" style={styles.title} numberOfLines={2}>
            {name}
          </AppText>
          {rows.map(row => (
            <PressableScale
              key={row.run}
              pressScale={0.98}
              accessibilityLabel={row.label}
              onPress={() => {
                if (row.run === 'delete') {
                  // The confirm takes the sheet's place — no second window on top.
                  setConfirming(true);
                  return;
                }
                const action =
                  row.run === 'calendar'
                    ? onCalendar
                    : row.run === 'edit'
                      ? onEdit
                      : onTogglePause;
                dismiss(action);
              }}
              style={[styles.row, { borderColor: c.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.color} />
              <AppText
                variant="bodyStrong"
                style={[styles.label, { color: row.color }]}
              >
                {row.label}
              </AppText>
            </PressableScale>
          ))}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    marginLeft: space.md,
  },
});
