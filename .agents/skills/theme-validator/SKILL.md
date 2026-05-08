---
name: theme-validator
description: Validate theme system compliance for SelfRise V2. Detects hardcoded colors, static StyleSheets outside components, shadow usage in dark mode, pure black backgrounds, and other Light/Dark theme violations. Use after UI changes, before commits, or when investigating theme inconsistencies. Triggers on theme check, color audit, dark mode validation, style review, theme compliance.
---

# Theme Validator — SelfRise V2

## Overview

Validates that all React Native components in SelfRise V2 follow the strict 2-tier theme system documented in `technical-guides.md`. Catches violations that break Light/Dark mode visual hierarchy.

**SelfRise V2 theme architecture:**
- Theme hook: `useTheme()` from `src/contexts/ThemeContext.tsx`
- Color constants: `src/constants/colors.ts`
- Standard: 2-tier system (`backgroundSecondary` for pages, `cardBackgroundElevated` for cards)
- Banned in Dark mode: shadows, pure black, hardcoded white/black

## When to Run

- Before any commit that adds/modifies `.tsx` components with styling
- After major UI refactors
- When user reports "looks wrong in dark mode" issues
- Before EAS production builds
- Periodic codebase health check

## Validation Rules

### Rule 1: No Hardcoded Colors (CRITICAL)

Components MUST use `colors` from `useTheme()`, never hardcoded hex/rgb/named colors.

**❌ Violations to flag:**
```typescript
backgroundColor: '#FFFFFF'              // Hardcoded white
backgroundColor: 'white'                // Named color
color: '#000000'                        // Hardcoded black
color: 'black'
backgroundColor: 'rgb(255, 255, 255)'   // RGB
borderColor: '#DEE2E6'                  // Any hex literal
```

**✅ Allowed exceptions:**
- `'transparent'` — universal, theme-independent
- `Colors.success`, `Colors.error`, `Colors.warning`, `Colors.primary`, `Colors.info` — semantic colors are intentionally vivid in both themes
- Vibrant chart/data visualization colors (e.g., `#22C55E` for habit category colors) — these are brand identifiers
- Skia component colors (e.g., `<Rect color="rgba(0,0,0,0.75)" />`) — Skia uses its own color space

**Search command:**
```bash
grep -rn --include="*.tsx" --include="*.ts" \
  -E "(backgroundColor|color|borderColor|tintColor|shadowColor):\\s*['\"]#[0-9a-fA-F]{3,8}['\"]" \
  src/ app/ | grep -v "node_modules" | grep -v "__tests__"
```

### Rule 2: No Static StyleSheet for Themed Styles (CRITICAL)

`StyleSheet.create({...})` outside the component body cannot access `colors` and won't adapt to theme changes.

**❌ Violation:**
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,  // Static — won't adapt!
  },
});

export function MyComponent() {
  return <View style={styles.container} />;
}
```

**✅ Correct pattern:**
```typescript
export function MyComponent() {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
    },
  });
  return <View style={styles.container} />;
}
```

**Detection logic:**
1. Find files containing both `StyleSheet.create` AND `useTheme`
2. If `StyleSheet.create` appears OUTSIDE function body (top-level) → flag
3. Exception: Theme-independent styles (only layout, no colors) can stay top-level

### Rule 3: No Shadows in Dark Mode (CRITICAL)

Dark mode uses background color hierarchy for elevation, NOT shadows. All shadow properties should be removed.

**❌ Properties to flag:**
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
```

**Search command:**
```bash
grep -rn --include="*.tsx" --include="*.ts" \
  -E "(shadowColor|shadowOffset|shadowOpacity|shadowRadius|elevation):" \
  src/ app/ | grep -v "node_modules" | grep -v "__tests__"
```

**Note:** Some components might still have shadows for Light mode aesthetics. Flag for review — user must confirm whether to keep or remove.

### Rule 4: No Pure Black Background (HIGH)

The app uses 2-tier system: `backgroundSecondary` (#1C1C1E) and `cardBackgroundElevated` (#2C2C2E). Pure black `colors.background` (#000000) is NOT part of standard hierarchy.

**❌ Violation:**
```typescript
backgroundColor: colors.background  // Pure black — not in standard
```

**✅ Correct:**
```typescript
backgroundColor: colors.backgroundSecondary  // Page (#1C1C1E)
backgroundColor: colors.cardBackgroundElevated  // Card (#2C2C2E)
```

**Search command:**
```bash
grep -rn --include="*.tsx" --include="*.ts" \
  "colors\\.background[^S]" \
  src/ app/ | grep -v "node_modules"
```

(Note: trailing `[^S]` excludes `colors.backgroundSecondary` matches.)

### Rule 5: Use Theme-Aware Text Colors (HIGH)

All `<Text>` components must use `colors.text`, `colors.textSecondary`, or `colors.textTertiary`.

**❌ Violations:**
```typescript
<Text style={{ color: 'white' }}>Hello</Text>
<Text style={{ color: '#212529' }}>Hello</Text>
```

**✅ Correct:**
```typescript
<Text style={{ color: colors.text }}>Heading</Text>
<Text style={{ color: colors.textSecondary }}>Subtitle</Text>
```

### Rule 6: Tab Screen vs Modal Screen Pattern (MEDIUM)

Tab screens use `SafeAreaView edges={[]}`, modal screens use `useSafeAreaInsets()`.

**Detection:**
- Check files in `app/(tabs)/` use `SafeAreaView edges={[]}`
- Check files in main stack (e.g., `app/achievements.tsx`) use `useSafeAreaInsets()`
- Flag mismatches

## Validation Procedure

Run all 6 rules and aggregate findings.

### Output Format

```markdown
# Theme Validation Report — [DATE]

## Summary
- Files scanned: X
- Critical violations: Y
- Warnings: Z
- Compliance score: N%

## ❌ CRITICAL Violations

### Hardcoded colors (Rule 1)
- `src/components/Foo.tsx:42` — `backgroundColor: '#FFFFFF'` → use `colors.backgroundSecondary`
- `src/screens/Bar.tsx:18` — `color: 'black'` → use `colors.text`

### Static StyleSheet (Rule 2)
- `src/components/Card.tsx:8` — StyleSheet.create at top-level uses `Colors.background`
  Suggested fix: Move inside component, use `useTheme()`

### Shadows in Dark Mode (Rule 3)
- `src/components/Modal.tsx:55` — `shadowColor: '#000'`
  Action: Remove shadow properties (lines 55-59)

## ⚠️ WARNINGS

### Pure black background usage (Rule 4)
- `src/components/Splash.tsx:12` — `colors.background` (pure black, non-standard)
  Suggested: `colors.backgroundSecondary`

### Hardcoded text color (Rule 5)
- `src/components/Header.tsx:30` — `color: 'white'`
  Suggested: `colors.text`

## ✅ Compliance

- N components fully theme-compliant
- All tab screens use correct safe area pattern
- All modal screens use correct safe area pattern
```

## Quality Checklist

Before reporting "all clean":
- [ ] All `.tsx` files in `src/components/`, `src/screens/`, `app/` scanned
- [ ] Verified semantic colors (`Colors.success`, etc.) NOT flagged
- [ ] Verified `'transparent'` NOT flagged
- [ ] Verified Skia component colors NOT flagged (they're not RN style)
- [ ] Sample-checked 3 random violations to confirm they're real issues
- [ ] Excluded test files (`__tests__/`, `.test.tsx`)

## Common False Positives to Suppress

- **Test files** — `__tests__/`, `*.test.tsx`, `*.test.ts`
- **Skia colors** — inside `<Canvas>` blocks, Skia uses its own color system
- **Animation interpolation** — `interpolateColor` may use literal hex
- **Charts/data viz** — vibrant colors for category identification are intentional
- **Constants files** — `src/constants/colors.ts` itself contains the literals (excluded)
- **Icon colors** — `<Ionicons color={Colors.white} />` for headers (white on primary header is correct pattern)
- **Comments** — lines starting with `//` or inside `/* */` blocks

## Integration with Workflow

After validation completes:
1. Show report summary
2. Ask user which violations to fix first (priority: Critical → High → Medium)
3. Make minimal, surgical fixes (one component at a time)
4. Re-run validator to verify resolved
5. **Important:** Don't auto-fix without showing diff first

## Related Documentation

- Theme rules: `technical-guides.md` → "Theme & Color System"
- Color hierarchy: 2-tier system (`backgroundSecondary` + `cardBackgroundElevated`)
- Color constants: `src/constants/colors.ts`
- Theme context: `src/contexts/ThemeContext.tsx`
