---
name: app-icon-generator
description: Generate all required iOS and Android app icon sizes from a single 1024x1024 master image for SelfRise V2. Use when preparing for App Store or Google Play submission, when updating app branding, or when creating splash screens. Triggers on app icon, generate icons, iOS icon set, Android adaptive icon, splash screen, app branding, ikona, master ikona.
---

# App Icon Generator — SelfRise V2

## Overview

Generates the complete set of iOS and Android app icons from a single 1024×1024 master image. Updates `app.json` with correct paths and validates results.

**Required input:** A single PNG file at 1024×1024 (the master icon)
**Output:** All required icon variants saved to `assets/` directory + updated `app.json`

## Prerequisites

Verify before running:
1. Master icon exists at the path provided by user (typically `assets/icon-master.png` or similar)
2. Master icon is exactly 1024×1024 pixels
3. Master icon is PNG format with proper alpha channel (or solid background for iOS)
4. macOS `sips` command is available (built-in on macOS — used for resizing)
   - Alternative: ImageMagick `convert` or Node `sharp` library

**iOS specific:** Master icon should NOT have transparency in main visual area (Apple removes alpha for App Store icon). Background should be solid color or full-bleed design.

**Android specific:** Adaptive icon needs a foreground (108×108dp safe zone in 144×144dp full canvas) + background layer. If master is single-layer, we'll create a solid-color background based on dominant color.

## Required Output Sizes

### iOS Icon Set (App Store + iPhone + iPad)

| Size | Filename | Purpose |
|------|----------|---------|
| 1024×1024 | `icon.png` | App Store marketing |
| 180×180 | `ios/icon-60@3x.png` | iPhone home (3x) |
| 120×120 | `ios/icon-60@2x.png` | iPhone home (2x) |
| 167×167 | `ios/icon-83.5@2x.png` | iPad Pro home |
| 152×152 | `ios/icon-76@2x.png` | iPad home (2x) |
| 76×76 | `ios/icon-76.png` | iPad home (1x) |
| 80×80 | `ios/icon-40@2x.png` | iPhone Spotlight |
| 120×120 | `ios/icon-40@3x.png` | iPhone Spotlight (3x) |
| 58×58 | `ios/icon-29@2x.png` | iPhone Settings (2x) |
| 87×87 | `ios/icon-29@3x.png` | iPhone Settings (3x) |
| 40×40 | `ios/icon-20@2x.png` | iOS Notifications (2x) |
| 60×60 | `ios/icon-20@3x.png` | iOS Notifications (3x) |

### Android Adaptive Icon

| Size | Filename | Purpose |
|------|----------|---------|
| 1024×1024 | `adaptive-icon.png` | Foreground for Expo |
| 432×432 | `android/foreground-mdpi.png` | Adaptive foreground |
| 432×432 | `android/foreground-xhdpi.png` | (different DPI) |
| 432×432 | `android/foreground-xxhdpi.png` | (different DPI) |
| 432×432 | `android/foreground-xxxhdpi.png` | (different DPI) |

**Note:** Expo handles Android icon generation automatically from `adaptive-icon.png` + background color in `app.json`. The simpler approach is to provide just `icon.png` (1024×1024) and `adaptive-icon.png` (1024×1024), and let Expo prebuild handle the rest.

### Splash Screen

| Size | Filename | Purpose |
|------|----------|---------|
| 1242×2436 | `splash.png` | iOS splash (universal) |
| 1242×2436 | `splash-dark.png` | iOS dark mode splash |

## Generation Procedure

### Step 1: Validate Master Icon

```bash
# Verify file exists
ls -la "$MASTER_ICON_PATH"

# Verify dimensions (macOS)
sips -g pixelWidth -g pixelHeight "$MASTER_ICON_PATH"
# Expected: pixelWidth: 1024, pixelHeight: 1024

# Verify format
file "$MASTER_ICON_PATH"
# Expected: PNG image data
```

If validation fails:
- Wrong size → ask user to provide 1024×1024 master
- Wrong format → ask user to convert to PNG
- File not found → ask user for correct path

### Step 2: Create Output Directory Structure

```bash
mkdir -p assets/ios
mkdir -p assets/android
```

### Step 3: Modern Expo Approach (RECOMMENDED — Simplest)

For Expo SDK 50+ projects, you only need **2 master files** in `assets/`:

```bash
# Just copy/resize master to assets/icon.png and assets/adaptive-icon.png
sips -z 1024 1024 "$MASTER_ICON_PATH" --out assets/icon.png
sips -z 1024 1024 "$MASTER_ICON_PATH" --out assets/adaptive-icon.png
```

Then in `app.json`:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#YOUR_BRAND_COLOR"
      }
    }
  }
}
```

EAS Build automatically generates all required sizes during build. **This is the recommended approach for SelfRise V2.**

### Step 4: Manual Resize (Only if NOT using Expo prebuild)

For custom native projects or manual iOS icon set:

```bash
# Loop through iOS sizes
for size_pair in "1024:icon.png" \
                 "180:ios/icon-60@3x.png" \
                 "120:ios/icon-60@2x.png" \
                 "167:ios/icon-83.5@2x.png" \
                 "152:ios/icon-76@2x.png" \
                 "76:ios/icon-76.png" \
                 "80:ios/icon-40@2x.png" \
                 "120:ios/icon-40@3x.png" \
                 "58:ios/icon-29@2x.png" \
                 "87:ios/icon-29@3x.png" \
                 "40:ios/icon-20@2x.png" \
                 "60:ios/icon-20@3x.png"; do
  size="${size_pair%%:*}"
  filename="${size_pair##*:}"
  sips -z $size $size "$MASTER_ICON_PATH" --out "assets/$filename"
done
```

### Step 5: Update app.json

Read `app.json`, add/update icon paths:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#FFFFFF",
      "resizeMode": "contain"
    },
    "ios": {
      "icon": "./assets/icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#YOUR_BRAND_COLOR"
      }
    }
  }
}
```

### Step 6: Validation

After generation, verify all files were created:

```bash
ls -la assets/icon.png assets/adaptive-icon.png
sips -g pixelWidth -g pixelHeight assets/icon.png
sips -g pixelWidth -g pixelHeight assets/adaptive-icon.png
```

Expected: Both files exist, both 1024×1024.

### Step 7: Visual Sanity Check

Suggest to user:
1. Open `assets/icon.png` in Preview to verify quality
2. Run `npx expo prebuild --clean` to regenerate native projects with new icons
3. Test on simulator: icons should appear correctly on home screen

## Splash Screen Generation (Optional)

If user requests splash screen:

```bash
# Splash dimensions: 1242×2436 (iPhone X+ universal)
# Logo should be centered, ~33% of width

# Method 1: Use master icon as splash (simple, branded)
sips -z 800 800 "$MASTER_ICON_PATH" --out /tmp/splash-logo.png
# Then composite onto white/dark background using ImageMagick or Skia

# Method 2: User provides separate splash.png
```

**Recommendation:** Splash screen typically needs custom design (logo on branded background), not just resized icon. Ask user to provide splash design separately, OR offer to create simple splash with `<logo>` centered on solid background.

## Output Format

After successful generation:

```markdown
# App Icon Generation Complete

## Generated Files

### iOS
- ✅ assets/icon.png (1024×1024)
- ✅ All iOS icon sizes (12 variants)

### Android
- ✅ assets/adaptive-icon.png (1024×1024)
- ✅ Background color set: #XXXXXX

### Splash Screen
- ✅ assets/splash.png (1242×2436)
- ✅ assets/splash-dark.png (dark variant)

## app.json Updated
- icon path: ./assets/icon.png
- adaptive-icon path: ./assets/adaptive-icon.png
- splash configuration added

## Next Steps
1. Run `npx expo prebuild --clean` to regenerate native projects
2. Run `npm start` and verify icons appear correctly on simulator
3. For production builds: `eas build --profile production`

## Quality Checks
- [ ] All required sizes generated
- [ ] app.json updated with correct paths
- [ ] No transparent areas on iOS icon (App Store rejects these)
- [ ] Android background color matches brand
```

## Common Issues

### "Master icon not 1024×1024"
- Solution: Ask user to provide correct size, or offer to upscale (with quality warning)

### "Transparent iOS icon" warning
- Apple removes alpha channel for App Store icons
- Solution: Master should have solid background OR full-bleed design

### "Adaptive icon foreground gets cropped"
- Android adaptive icon has 66% safe zone in center
- Solution: Master logo should occupy only center 66% if using as foreground directly

### "Icons look pixelated after resize"
- `sips` does basic bicubic resize
- For better quality: Use `sharp` (Node) or `convert` (ImageMagick) with Lanczos filter
- Alternative: Provide hand-tuned variants for critical sizes (120, 180, 1024)

## Quality Checklist

Before declaring "done":
- [ ] Master icon validated (1024×1024 PNG)
- [ ] All required sizes generated successfully
- [ ] `app.json` updated with new paths
- [ ] No errors in `sips` output
- [ ] Visual sanity check (preview at least 1 generated icon)
- [ ] Backup of old icons preserved (if replacing existing)

## Related Documentation

- Project plan: Phase 10.1.1 — App Icons
- Expo icon docs: https://docs.expo.dev/guides/app-icons/
- Apple Human Interface Guidelines (App Icons): https://developer.apple.com/design/human-interface-guidelines/app-icons
- Android Adaptive Icons: https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive
