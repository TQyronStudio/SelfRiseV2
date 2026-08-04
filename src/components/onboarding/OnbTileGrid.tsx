import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout } from '@/src/constants/dimensions';
import { OnbTile, getOnbTileColumns } from './OnbTile';
import { chunkIntoRows } from './gridLayout';

/**
 * Lays tiles out in a responsive grid — two columns on phones, three when
 * there is room.
 *
 * The last row is padded with invisible spacers so three tiles across two
 * columns leave a gap on the right instead of stretching the odd one to full
 * width, which is how a "quick pick" grid stops looking deliberate.
 */
export interface OnbTileGridItem {
  id: string;
  label: string;
  icon: string;
  accentColor: string;
  detail?: string;
}

export interface OnbTileGridProps {
  items: OnbTileGridItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}


export function OnbTileGrid({ items, selectedId, onSelect }: OnbTileGridProps) {
  const columns = getOnbTileColumns();

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: Layout.spacing.sm,
      marginBottom: Layout.spacing.sm,
    },
    spacer: {
      flex: 1,
    },
  });

  const rows = chunkIntoRows(items, columns);

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map(item => (
            <OnbTile
              key={item.id}
              label={item.label}
              icon={item.icon}
              accentColor={item.accentColor}
              detail={item.detail}
              selected={selectedId === item.id}
              onPress={() => onSelect(item.id)}
            />
          ))}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`spacer-${i}`} style={styles.spacer} />
          ))}
        </View>
      ))}
    </View>
  );
}
