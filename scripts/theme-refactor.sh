#!/bin/bash

# Theme Refactoring Script
# Converts all components from Colors import to useTheme() hook

echo "🎨 Starting theme refactoring..."
echo "This will update all components to use useTheme() hook"
echo ""

# Find all TypeScript/TSX files that import Colors
FILES=$(find ./src ./app -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -v node_modules | grep -v ".expo" | xargs grep -l "import.*Colors.*from.*constants" 2>/dev/null)

TOTAL_FILES=$(echo "$FILES" | wc -l | tr -d ' ')
echo "📊 Found $TOTAL_FILES files to refactor"
echo ""

COUNTER=0
SUCCESS=0
SKIPPED=0

for file in $FILES; do
  COUNTER=$((COUNTER + 1))

  # Skip if already refactored (contains useTheme)
  if grep -q "useTheme" "$file"; then
    echo "⏭️  [$COUNTER/$TOTAL_FILES] Skipping $file (already uses useTheme)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "🔧 [$COUNTER/$TOTAL_FILES] Refactoring: $file"

  # Create backup
  cp "$file" "$file.backup"

  # Step 1: Add useTheme import if Colors is imported from constants
  if grep -q "import.*Colors.*from.*constants" "$file"; then
    # Check if it's a hook file (can't use hooks in non-component files)
    if [[ "$file" == *"hooks/"* ]] || [[ "$file" == *"utils/"* ]] || [[ "$file" == *"services/"* ]] || [[ "$file" == *"types/"* ]]; then
      echo "   ⚠️  Skipping: Hook/Utility file (can't use useTheme)"
      rm "$file.backup"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    # Replace Colors import with useTheme import
    sed -i '' "s/import { Colors/import { useTheme }/g" "$file"
    sed -i '' "s/, Colors//g" "$file"
    sed -i '' "s/Colors, //g" "$file"

    # If still has other imports from constants, re-add them
    if grep -q "from '@/src/constants'" "$file"; then
      :  # Do nothing, import line still exists
    else
      # Add new line for useTheme if needed
      if ! grep -q "useTheme" "$file"; then
        # Find first import and add useTheme import
        sed -i '' "1a\\
import { useTheme } from '@/src/contexts/ThemeContext';
" "$file"
      fi
    fi

    SUCCESS=$((SUCCESS + 1))
  fi

  # Clean up backup if successful
  if [ -f "$file.backup" ]; then
    rm "$file.backup"
  fi
done

echo ""
echo "✅ Refactoring complete!"
echo "📊 Summary:"
echo "   Total files found: $TOTAL_FILES"
echo "   Successfully refactored: $SUCCESS"
echo "   Skipped: $SKIPPED"
echo ""
echo "⚠️  IMPORTANT: This script only updated imports!"
echo "   You still need to:"
echo "   1. Add 'const { colors } = useTheme();' to component bodies"
echo "   2. Replace all 'Colors.xxx' with 'colors.xxx'"
echo "   3. Move StyleSheet.create() inside components"
echo ""
echo "   Run 'npx tsc --noEmit' to find remaining issues"
