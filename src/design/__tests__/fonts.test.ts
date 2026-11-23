/**
 * Type and font files of the new look (design-migration-plan.md E1, points 3 and 5).
 *
 * - every type variant names a font family we ship, and never a fontWeight
 *   (Android silently drops a custom family when a weight is set);
 * - every family has its file, listed in fontFiles.ts (loaded at start);
 * - every file carries a PostScript name equal to the family: iOS registers a
 *   font by it and draws the icon font as "?" without one (kolo 51).
 */
import * as fs from 'fs';
import * as path from 'path';
import { fonts, type } from '../tokens';

const ROOT = path.resolve(__dirname, '../../..');
const fontPath = (family: string) =>
  path.join(ROOT, 'assets/fonts', `${family}.ttf`);

/** Name records of a TrueType file's `name` table: nameID → first string found. */
function readFontNames(file: Buffer): Map<number, string> {
  const tables = file.readUInt16BE(4);
  for (let i = 0; i < tables; i++) {
    const at = 12 + 16 * i;
    if (file.toString('latin1', at, at + 4) !== 'name') continue;
    const table = file.readUInt32BE(at + 8);
    const count = file.readUInt16BE(table + 2);
    const strings = table + file.readUInt16BE(table + 4);
    const names = new Map<number, string>();
    for (let j = 0; j < count; j++) {
      const rec = table + 6 + 12 * j;
      const platform = file.readUInt16BE(rec);
      const nameId = file.readUInt16BE(rec + 6);
      const length = file.readUInt16BE(rec + 8);
      const offset = strings + file.readUInt16BE(rec + 10);
      const raw = file.subarray(offset, offset + length);
      // Windows/Unicode records are UTF-16BE, Mac records single-byte.
      const text =
        platform === 1
          ? raw.toString('latin1')
          : Buffer.from(raw).swap16().toString('utf16le');
      if (!names.has(nameId) && text) names.set(nameId, text);
    }
    return names;
  }
  return new Map();
}

describe('type', () => {
  const families = new Set<string>(Object.values(fonts));

  it.each(Object.keys(type) as (keyof typeof type)[])(
    '%s uses a shipped family and no fontWeight',
    variant => {
      const style = type[variant];
      expect(families.has(style.fontFamily)).toBe(true);
      expect(style.fontFamily).not.toBe(fonts.icons);
      expect(Object.keys(style)).not.toContain('fontWeight');
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize);
    }
  );
});

describe('font files', () => {
  // fontFiles.ts as a map: `[fonts.<key>]: require('…/<file>.ttf')` → key → file.
  const source = fs.readFileSync(
    path.join(ROOT, 'src/design/fontFiles.ts'),
    'utf8'
  );
  const listed = new Map(
    [
      ...source.matchAll(
        /\[fonts\.(\w+)\]:\s*require\(\s*'[^']*\/assets\/fonts\/([^']+)\.ttf'\s*\)/g
      ),
    ].map(m => [fonts[m[1] as keyof typeof fonts], m[2]])
  );

  it('lists every family exactly once, each with its own file', () => {
    expect([...listed.keys()].sort()).toEqual(Object.values(fonts).sort());
    for (const [family, file] of listed) expect(file).toBe(family);
  });

  it.each(Object.values(fonts))(
    '%s is shipped and carries its PostScript name',
    family => {
      expect(fs.existsSync(fontPath(family))).toBe(true);
      const names = readFontNames(fs.readFileSync(fontPath(family)));
      // nameID 6 = PostScript name.
      expect(names.get(6)).toBe(family);
    }
  );

  it('reads the PostScript name of a known file', () => {
    const names = readFontNames(
      fs.readFileSync(path.join(ROOT, 'assets/fonts/SpaceMono-Regular.ttf'))
    );
    expect(names.get(6)).toBe('SpaceMono-Regular');
    expect(names.get(1)).toBe('Space Mono');
  });
});
