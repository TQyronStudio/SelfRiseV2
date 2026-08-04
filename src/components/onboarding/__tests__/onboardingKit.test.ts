/**
 * Stage C — the shared onboarding building blocks.
 *
 * Rendering these would mean standing up the theme, i18n, safe-area and
 * tutorial providers to assert layout maths and data shape, so the parts worth
 * protecting are tested directly instead:
 *   - the grid's row chunking (an off-by-one here silently drops a preset)
 *   - the goal template data, which stage A moved out of GoalTemplatesModal —
 *     the source guard below is what stops the hardcoded English units from
 *     creeping back in
 */
import { chunkIntoRows } from '../gridLayout';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('chunkIntoRows', () => {
  it('fills complete rows', () => {
    expect(chunkIntoRows([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it('leaves the last row short rather than dropping items', () => {
    // Six presets in three columns is exact; seven (with "Something else")
    // must not lose the seventh.
    expect(chunkIntoRows([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('keeps every item, whatever the column count', () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    for (const columns of [2, 3]) {
      expect(chunkIntoRows(items, columns).flat()).toEqual(items);
    }
  });

  it('handles an empty list', () => {
    expect(chunkIntoRows([], 2)).toEqual([]);
  });

  it('never loops forever on a nonsense column count', () => {
    expect(chunkIntoRows([1, 2], 0)).toEqual([[1, 2]]);
  });
});

describe('goal template data', () => {
  const source = readFileSync(
    join(__dirname, '../../../constants/goalTemplates.ts'),
    'utf8'
  );

  it('still holds all 11 templates after the extraction', () => {
    expect(source.match(/^\s{6}id: '/gm)?.length).toBe(11);
  });

  it('resolves every unit through i18n, never a hardcoded string', () => {
    // The bug this guards: units were plain English literals, so a German user
    // got "12 books" and saved money in dollars.
    // Only the template entries (indented six spaces) — not the `unit: string`
    // field on the interface, nor `unit: template.unit` in the converter.
    const units = source.match(/^ {6}unit: .+$/gm) ?? [];
    expect(units.length).toBe(11);
    for (const unit of units) {
      expect(unit.trim()).toMatch(/^unit: t\('goals\.units\.\w+'\),$/);
    }
  });

  it('uses the locale-aware currency key for money goals', () => {
    expect(source).toContain("unit: t('goals.units.currency')");
  });
});
