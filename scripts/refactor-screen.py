#!/usr/bin/env python3
"""
Quick theme refactoring script for screen files.
Adds useTheme hook and moves styles inside component.
"""

import sys
import re

def refactor_screen(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Step 1: Replace Colors import with useTheme
    content = re.sub(
        r"import { Colors,",
        "import { useTheme } from '@/src/contexts/ThemeContext';\nimport {",
        content
    )
    content = re.sub(
        r"from '@/src/constants';",
        lambda m: m.group(0).replace(", Colors", "").replace("Colors, ", ""),
        content
    )

    # Step 2: Add useTheme hook after component declaration
    # Find first hook call (usually after function declaration)
    component_pattern = r"(export default function \w+\(\) \{[^}]*?)(const \{)"
    content = re.sub(
        component_pattern,
        r"\1const { colors } = useTheme();\n  \2",
        content,
        count=1
    )

    # Step 3: Replace all Colors. with colors.
    content = re.sub(r'\bColors\.', 'colors.', content)

    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

    print(f"✅ Refactored: {filepath}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python refactor-screen.py <filepath>")
        sys.exit(1)

    refactor_screen(sys.argv[1])
