/**
 * The ratchet (design-migration-plan.md E1, point 5): files converted to the new
 * look may only use tokens. In a converted file there is
 * - no hex or rgba colour (tokens + withAlpha()),
 * - no literal fontSize or borderRadius (type / radius tokens),
 * - no fontWeight (one font family per weight — Android drops the family),
 * - no measureLabPerf (the lab's measuring probe is never converted, P48),
 * - no Modal imported from react-native (stacked native modals froze the app;
 *   windows are views in one layer, E8).
 *
 * THE LIST ONLY GROWS: after each migration stage add the files it converted.
 * Never remove a file to make the test pass — fix the file.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');

const CONVERTED: readonly string[] = [
  // E1 – the new theme plumbing
  'src/contexts/ThemeContext.tsx',
  'src/design/fontFiles.ts',
  // E2 – the building blocks and the feel of the new look
  'src/components/ui/primitives.tsx',
  'src/components/ui/RollingNumber.tsx',
  'src/components/ui/rollingNumberLogic.ts',
  'src/components/ui/StreakFlame.tsx',
  'src/components/ui/SignatureIcon.tsx',
  'src/components/ui/Ring.tsx',
  'src/components/ui/Stars.tsx',
  'src/components/ui/scrollChoreography.tsx',
  'src/components/ui/introTimeline.tsx',
  'src/components/ui/index.ts',
  // E3 – the chrome: tab bar and top row
  'src/components/ui/TabBar.tsx',
  'src/components/ui/tabBarLogic.ts',
  'src/components/ui/TopRow.tsx',
  'app/(tabs)/_layout.tsx',
  // E4 – shared parts: sheets, details, drag to close, overlays, windows
  'src/components/ui/overlayRegistry.ts',
  'src/components/ui/dragToClose.tsx',
  'src/components/ui/dragToCloseLogic.ts',
  'src/components/ui/sheets.tsx',
  'src/components/ui/DetailFrame.tsx',
  'src/components/ui/windowFrame.tsx',
  // E5 – the Habits list (pilot)
  'src/screens/habits/HabitsScreen.tsx',
  'src/screens/habits/habitListLogic.ts',
  'src/components/habits/list/HabitsListView.tsx',
  'src/components/habits/list/HabitCard.tsx',
  'src/components/habits/list/PausedHabitCard.tsx',
  'src/components/habits/list/WeekStrip.tsx',
  'src/components/habits/list/HabitActionsSheet.tsx',
  // E6 – habit detail and in-place help
  'src/components/habits/detail/HabitDetail.tsx',
  'src/components/ui/help.tsx',
  'src/components/habits/composer/HabitComposer.tsx',
  'src/components/habits/habitFormRules.ts',
  'src/components/habits/list/HabitsReorderView.tsx',
  // E7 (part 2) – the level badge and the sparks
  'src/components/xp/XpDisplay.tsx',
  'src/services/xpDisplay/heldMoments.ts',
  // E7 (part 1) – the XP display: books, origins, multiplier mark rules
  'src/services/xpDisplay/xpLedger.ts',
  'src/services/xpDisplay/xpOriginRegistry.ts',
  'src/services/xpDisplay/multiplierDisplay.ts',
  // E8 (part 1) – one action, one moment: pure rules, the queue's ordering rule
  'src/services/moments/moments.ts',
  'src/services/moments/momentRules.ts',
  'src/services/levels/levelsJourney.ts',
  'src/contexts/modalQueueOrdering.ts',
  // Prep for E9 / E11 – lab rules moved with their tests
  'src/services/levels/levelPanelLogic.ts',
  'src/screens/home/homeLayoutLogic.ts',
  'src/screens/home/homeChartsLogic.ts',
  'src/constants/feel.ts',
  'src/services/feelService.ts',
];

interface Violation {
  rule: string;
  line: number;
  text: string;
}

/** A numeric literal right after the colon or as a branch of a ternary (`a ? 18 : 14`). */
const literalAfter = (prop: string) =>
  new RegExp(`\\b${prop}\\s*:(?:[^,}\\n]*?[?:])?\\s*-?\\d`);

const NAMED_COLOURS =
  'white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|silver|gold';

const RULES: { rule: string; pattern: RegExp }[] = [
  // Anywhere in code: in a string, a shadow ('0px 2px 4px #0004') or a border.
  // Not after a word or dot (`this.#cache`), not an HTML entity (`&#39;`).
  { rule: 'hex colour', pattern: /(?<![\w.&])#[0-9A-Fa-f]{3,8}\b/ },
  // `${c.habit.blue}33` – alpha glued to a colour (use withAlpha()).
  { rule: 'hex alpha suffix', pattern: /\$\{[^}]+\}[0-9A-Fa-f]{2}\b(?![\w-])/ },
  { rule: 'rgb/hsl colour', pattern: /\b(?:rgba?|hsla?)\(/ },
  // Only where a colour is set (`color: 'white'`, `tintColor="black"`) – a habit
  // colour NAME ('green') or a reward kind ('gold') is data, not a colour.
  {
    rule: 'named colour',
    pattern: new RegExp(
      `\\b\\w*colou?r\\s*[:=]\\s*\\{?\\s*['"\`](?:${NAMED_COLOURS})['"\`]`,
      'i'
    ),
  },
  { rule: 'literal fontSize', pattern: literalAfter('fontSize') },
  {
    rule: 'literal borderRadius',
    pattern: literalAfter(
      'border(?:Top|Bottom)?(?:Start|End|Left|Right)?Radius'
    ),
  },
  { rule: 'fontWeight', pattern: /\bfontWeight\s*:/ },
  { rule: 'measureLabPerf', pattern: /\bmeasureLabPerf\b/ },
  // Any other way to reach the react-native Modal.
  {
    rule: 'Modal from react-native',
    pattern: /\bRN\.Modal\b|require\(\s*['"]react-native['"]\s*\)\.Modal\b/,
  },
];

// `import { Modal }`, `import type { Modal }`, `import RN, { Modal }` – over lines.
const MODAL_IMPORT =
  /import\s+(?:type\s+)?(?:\w+\s*,\s*)?\{[^}]*\bModal\b[^}]*\}\s*from\s*['"]react-native['"]/g;

/** Comments may talk about colours; only code counts. Line numbers are kept. */
function stripComments(source: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ');
  return source
    .replace(/(^|\s)\/\*[\s\S]*?\*\//g, blank)
    .replace(
      /(^|[^:'"`])\/\/.*$/gm,
      (m, lead: string) => lead + blank(m.slice(lead.length))
    );
}

function designViolations(source: string): Violation[] {
  const code = stripComments(source);
  const found: Violation[] = [];
  code.split('\n').forEach((text, i) => {
    for (const { rule, pattern } of RULES) {
      if (pattern.test(text))
        found.push({ rule, line: i + 1, text: text.trim() });
    }
  });
  for (const m of code.matchAll(MODAL_IMPORT)) {
    const line = code.slice(0, m.index).split('\n').length;
    found.push({
      rule: 'Modal from react-native',
      line,
      text: m[0].replace(/\s+/g, ' '),
    });
  }
  return found;
}

describe('the ratchet', () => {
  it.each(CONVERTED)('%s uses only tokens', file => {
    const full = path.join(ROOT, file);
    expect(fs.existsSync(full)).toBe(true);
    expect(designViolations(fs.readFileSync(full, 'utf8'))).toEqual([]);
  });
});

describe('designViolations()', () => {
  const rules = (src: string) => designViolations(src).map(v => v.rule);

  it('catches every forbidden thing', () => {
    expect(rules(`const s = { color: '#1A2233' };`)).toEqual(['hex colour']);
    expect(rules(`const s = { color: "#FFF" };`)).toEqual(['hex colour']);
    expect(rules('const s = { backgroundColor: `#000000` };')).toEqual([
      'hex colour',
    ]);
    expect(rules(`const s = { color: 'rgba(0, 0, 0, 0.3)' };`)).toEqual([
      'rgb/hsl colour',
    ]);
    expect(rules(`const s = { fontSize: 14 };`)).toEqual(['literal fontSize']);
    expect(rules(`const s = { borderRadius: 12 };`)).toEqual([
      'literal borderRadius',
    ]);
    expect(rules(`const s = { borderTopLeftRadius: 8 };`)).toEqual([
      'literal borderRadius',
    ]);
    expect(rules(`const s = { fontWeight: '600' };`)).toEqual(['fontWeight']);
    expect(rules(`measureLabPerf('habit check');`)).toEqual(['measureLabPerf']);
    expect(rules(`const s = { boxShadow: '0px 2px 4px #00000040' };`)).toEqual([
      'hex colour',
    ]);
    expect(rules(`const s = { borderColor: '1px solid #ccc' };`)).toEqual([
      'hex colour',
    ]);
    expect(
      rules('const s = { backgroundColor: `${c.habit.blue}33` };')
    ).toEqual(['hex alpha suffix']);
    expect(rules(`const s = { color: 'hsl(210, 50%, 40%)' };`)).toEqual([
      'rgb/hsl colour',
    ]);
    expect(rules(`const s = { color: 'white' };`)).toEqual(['named colour']);
    expect(rules(`<Ionicons name="star" color="black" />`)).toEqual([
      'named colour',
    ]);
    expect(rules(`const s = { fontSize: big ? 18 : 14 };`)).toEqual([
      'literal fontSize',
    ]);
    expect(rules(`const s = { borderRadius: on ? radius.lg : 8 };`)).toEqual([
      'literal borderRadius',
    ]);
    expect(rules(`const M = RN.Modal;`)).toEqual(['Modal from react-native']);
    expect(rules(`const M = require('react-native').Modal;`)).toEqual([
      'Modal from react-native',
    ]);
    expect(rules(`import RN, { Modal } from 'react-native';`)).toEqual([
      'Modal from react-native',
    ]);
    expect(rules(`import { View, Modal } from 'react-native';`)).toEqual([
      'Modal from react-native',
    ]);
    expect(
      rules(`import {\n  Modal,\n  Text,\n} from "react-native";`)
    ).toEqual(['Modal from react-native']);
  });

  it('lets tokens, helpers and comments through', () => {
    expect(
      rules(
        [
          `const s = { color: c.text, fontSize: t.fontSize, borderRadius: radius.lg };`,
          `const veil = withAlpha(fixed.black, 0.32);`,
          `// was '#2477C4' before E1`,
          `/* rgba(0, 0, 0, 0.5) in the lab */`,
          `const url = 'https://selfrise.app/#faq';`,
          `import { Modal } from './ui/Modal';`,
          `import { View } from 'react-native';`,
          `const s = { borderRadius: size / 2, fontSize: type.body.fontSize * scale };`,
          `const reward = { kind: 'gold' }; const isGreen = habit.color === 'green';`,
          `const glob = 'src/*'; const x = { color: c.text };`,
          `class Cache { #cache = 1; run() { return this.#cache; } }`,
          'const key = `${day}px`;',
        ].join('\n')
      )
    ).toEqual([]);
  });

  it('reports the line', () => {
    expect(
      designViolations(`const a = 1;\nconst b = { fontSize: 12 };`)
    ).toEqual([
      {
        rule: 'literal fontSize',
        line: 2,
        text: 'const b = { fontSize: 12 };',
      },
    ]);
  });
});
