---
name: i18n-auditor
description: Audit i18n translation consistency and completeness for SelfRise V2 across EN/DE/ES locales. Use when adding new features with text, before releases, or when investigating missing translations. Triggers on i18n audit, translation check, missing translations, hardcoded strings, locale validation, translation coverage.
---

# i18n Auditor — SelfRise V2

## Overview

Comprehensive i18n compliance auditor for SelfRise V2. Validates that all 3 locales (EN/DE/ES) are complete and synchronized, finds hardcoded user-visible strings in components, and detects unused translation keys.

**SelfRise V2 i18n architecture:**
- Master types: `src/types/i18n.ts`
- English (master): `src/locales/en/index.ts`
- German: `src/locales/de/index.ts`
- Spanish: `src/locales/es/index.ts`
- Hook: `useI18n()` from `src/hooks/useI18n.ts`
- Function: `t('key.path')`

**Hardcoded exception:** Rarity tiers (`Common`, `Rare`, `Epic`, `Legendary`, `Exotic`) are intentionally hardcoded English. Don't flag them.

## When to Run

- Before any commit that touches `src/locales/` or adds new user-visible text
- Before EAS builds (preview/production)
- When investigating "missing translation" reports
- After major refactors that move/rename components
- Periodic health check (e.g., monthly)

## Audit Procedure

Run all 4 checks in sequence and report findings.

### Check 1: Locale File Synchronization

Compare keys between EN/DE/ES locale files. EN is the master — DE and ES must mirror its structure.

```bash
# Extract all leaf keys from each locale (use a Node script or jq)
# Compare:
#   - Keys in EN but missing in DE → CRITICAL: missing German translation
#   - Keys in EN but missing in ES → CRITICAL: missing Spanish translation
#   - Keys in DE/ES but not in EN → WARNING: orphan key (delete it)
#   - Keys with empty string values → WARNING: untranslated placeholder
```

Implementation steps:
1. Read all 3 locale files (`src/locales/{en,de,es}/index.ts`)
2. Parse exported object structure (find the default export)
3. Recursively flatten nested keys (e.g., `journal.warmUp.modals.success.title`)
4. Compare 3 flat key sets
5. Report missing/orphan/empty keys with full path

### Check 2: Hardcoded Strings in Components

Find user-visible text in `.tsx`/`.ts` files that should be translated.

```bash
# Search patterns to flag:
grep -rn --include="*.tsx" --include="*.ts" \
  -E '<Text[^>]*>[A-Z][a-zA-Z ]{2,}</Text>' \
  src/ app/ | grep -v "node_modules"

# Common locations of hardcoded strings:
# - JSX: <Text>Hello world</Text>
# - Alert.alert('Title', 'Message')
# - Toast messages
# - Button titles
# - Modal titles/messages
```

What to flag:
- `<Text>...</Text>` containing literal English text (length ≥ 3 chars, capital first letter)
- `Alert.alert('...', '...')` calls with hardcoded text
- `placeholder="..."` props with English text
- `title="..."` props on screens/modals
- Toast/notification messages with literal strings

What NOT to flag (allowed exceptions):
- Rarity tiers: `'Common'`, `'Rare'`, `'Epic'`, `'Legendary'`, `'Exotic'`
- Single emojis: `'🎉'`, `'⭐'`
- Empty/whitespace strings
- Numbers and units: `'100'`, `'10x'`
- Technical/debug strings inside `console.log` (those are fine)

### Check 3: i18n Key Path Validation

Find `t('...')` calls where the key path doesn't exist in the master EN file.

```bash
# Extract all t() calls
grep -rn --include="*.tsx" --include="*.ts" \
  -E "t\\(['\"]([^'\"]+)['\"]" \
  src/ app/

# For each unique key, check if it exists in src/locales/en/index.ts
```

Common bugs to catch:
- Typos: `t('jounral.title')` (missing `r`)
- Wrong path: `t('warmup.success')` instead of `t('warmUp.success')` (camelCase mismatch)
- Wrong nesting: `t('journal.daily_complete_title')` instead of `t('journal.celebration.daily_complete_title')`

### Check 4: Unused Translation Keys

Find keys defined in EN locale that no component uses.

```bash
# For each leaf key in src/locales/en/index.ts:
#   Search if any t('that.key') reference exists in src/ or app/
#   If no reference found → flag as potentially unused
```

⚠️ Be careful with dynamic keys! Some keys are constructed dynamically:
- `t(\`achievements.${achievementId}.title\`)`
- `t(\`days.shortest.\${dayName}\`)`

Only flag keys that:
1. Have no static reference AND
2. Don't match a dynamic pattern (e.g., `achievements.*.title`)

## Output Format

Generate a structured report:

```markdown
# i18n Audit Report — [DATE]

## Summary
- Total keys (EN): X
- Total keys (DE): Y (missing: Z)
- Total keys (ES): A (missing: B)
- Hardcoded strings found: N
- Invalid t() paths: M
- Potentially unused keys: P

## ❌ CRITICAL ISSUES

### Missing translations
- DE missing: `key.path.one`, `key.path.two`
- ES missing: `key.path.three`

### Invalid t() paths
- `src/components/Foo.tsx:42` — `t('typo.key')` not found in EN

## ⚠️ WARNINGS

### Hardcoded strings (require translation)
- `src/components/Foo.tsx:15` — `<Text>Welcome!</Text>`
- `src/screens/Bar.tsx:30` — `Alert.alert('Error', 'Failed to save')`

### Potentially unused keys
- `unused.key.path.one` (no static reference found, not matching dynamic pattern)

## ✅ All Good
- EN/DE/ES are X% synchronized
- N components verified clean
```

## Quality Checklist

Before reporting "all clean":
- [ ] All 3 locale files parsed successfully
- [ ] Verified rarity tiers not flagged as hardcoded
- [ ] Considered dynamic key patterns (achievements, days, etc.)
- [ ] Cross-referenced t() calls against actual locale structure
- [ ] Sample-checked at least 3 flagged hardcoded strings to verify they're real issues

## Common False Positives to Suppress

- `console.log/error/warn` strings (developer-facing, not user-visible)
- Test files (`.test.ts`, `.test.tsx`, `__tests__/`)
- Comment text (lines starting with `//` or inside `/* */`)
- Style values (e.g., `fontFamily: 'System'`)
- Type/enum values used as keys (e.g., `'habits' | 'journal' | 'goals'`)
- Storage keys (`AsyncStorage.getItem('user_theme_preference')`)
- Event names (`DeviceEventEmitter.emit('xpAwarded')`)
- Achievement IDs and similar identifiers

## Integration with Workflow

After audit completes:
1. Show report summary in chat
2. Ask user which issues to fix first (priority: missing translations > hardcoded strings > unused keys)
3. Make targeted fixes — never bulk-delete "unused" keys without confirmation
4. Re-run audit to verify clean state

## Related Documentation

- i18n rules: `technical-guides.md` → "Internationalization (i18n) Guidelines"
- Master language strategy: EN is canonical, DE/ES are translations
- Recent i18n work: `projectplan.md` → "Phase 11 - Parts A & B & C & D"
