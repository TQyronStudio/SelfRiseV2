#!/usr/bin/env python3
"""
SelfRise V2 - App Store Marketing Screenshot Generator
Converts raw home screen screenshot into premium App Store marketing image.

Test version: single screenshot, dark theme, EN.
Outputs at iPhone 6.7" Pro Max App Store size (1290x2796).
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import os
import sys

# === Constants ===
PROJECT_ROOT = "/Users/turage/Documents/SelfRiseV2"
RAW_SCREENSHOT = f"{PROJECT_ROOT}/marketing/raw/home-raw.png"
MOCKUP = "/Users/turage/.claude/skills/app-store-screenshots/mockup.png"
OUTPUT_DIR = f"{PROJECT_ROOT}/marketing/final"
OUTPUT_FILE = f"{OUTPUT_DIR}/home-en-dark-iphone67-test1.png"

# Final canvas (App Store iPhone 6.7" Pro Max)
FINAL_W, FINAL_H = 1290, 2796

# === Helpers ===
def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/SFCompact.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    ]
    for fp in candidates:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_clean_status_bar(img: Image.Image):
    """Overlay clean Apple-style status bar (9:41, full battery, full WiFi/signal)."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # Sample header background color (just below status bar)
    bg = img.getpixel((w // 2, 130))
    print(f"[status-bar] header bg sampled: {bg}")

    # Clear the original status bar area (keep header color)
    STATUS_H = 130
    draw.rectangle([0, 0, w, STATUS_H], fill=bg)

    # Determine icon color based on header brightness
    # If header is dark, use white; else black
    brightness = (bg[0] * 299 + bg[1] * 587 + bg[2] * 114) / 1000
    icon_color = "white" if brightness < 128 else "black"

    # --- Time "9:41" on left ---
    time_font = load_font(54)
    draw.text((54, 48), "9:41", fill=icon_color, font=time_font)

    # --- Right side icons (signal, wifi, battery) ---
    # Battery (rightmost) - 100% white-filled rounded rectangle
    batt_w, batt_h = 80, 38
    batt_x = w - 60 - batt_w
    batt_y = 56
    # Outer outline
    draw.rounded_rectangle(
        [batt_x, batt_y, batt_x + batt_w, batt_y + batt_h],
        radius=10, outline=icon_color, width=3
    )
    # Battery tip
    draw.rectangle(
        [batt_x + batt_w + 3, batt_y + 12, batt_x + batt_w + 9, batt_y + batt_h - 12],
        fill=icon_color
    )
    # Filled portion (100%)
    draw.rounded_rectangle(
        [batt_x + 5, batt_y + 5, batt_x + batt_w - 5, batt_y + batt_h - 5],
        radius=6, fill=icon_color
    )

    # WiFi icon (simplified arc/triangle) - to the left of battery
    wifi_x = batt_x - 80
    wifi_y = batt_y + 4
    # Draw 4 arcs (concentric)
    for i in range(4):
        r = 14 + i * 8
        draw.arc(
            [wifi_x - r + 25, wifi_y - r + 30, wifi_x + r + 25, wifi_y + r + 30],
            start=225, end=315, fill=icon_color, width=4
        )
    # Solid dot at bottom of wifi
    draw.ellipse([wifi_x + 22, wifi_y + 27, wifi_x + 30, wifi_y + 35], fill=icon_color)

    # Signal bars (4 bars increasing) - leftmost of right group
    sig_x = wifi_x - 90
    sig_y_base = batt_y + batt_h
    bar_w = 8
    bar_gap = 6
    for i in range(4):
        bar_h = 8 + i * 8
        x0 = sig_x + i * (bar_w + bar_gap)
        y0 = sig_y_base - bar_h
        draw.rounded_rectangle(
            [x0, y0, x0 + bar_w, sig_y_base],
            radius=2, fill=icon_color
        )


def mask_admob(img: Image.Image):
    """Cover AdMob banner with dark theme color (precisely measured Y range)."""
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # Precise AdMob Y range measured via brightness scan:
    # y=2395-2525: AdMob banner (brightness 124-195, light)
    # y=2525+: dark (back to normal app)
    ADMOB_TOP = 2390
    ADMOB_BOTTOM = 2530
    DARK_BG = (28, 28, 30)  # #1C1C1E (colors.backgroundSecondary)

    draw.rectangle([0, ADMOB_TOP, w, ADMOB_BOTTOM], fill=DARK_BG)
    print(f"[admob] masked y={ADMOB_TOP}-{ADMOB_BOTTOM}")


def detect_screen_area(mockup: Image.Image):
    """Detect the black screen area inside iPhone mockup. Returns (x, y, w, h)."""
    arr = np.array(mockup.convert("RGBA"))
    # Black pixels with full alpha
    mask = (
        (arr[:, :, 0] < 25) &
        (arr[:, :, 1] < 25) &
        (arr[:, :, 2] < 25) &
        (arr[:, :, 3] > 200)
    )
    ys, xs = np.where(mask)
    if len(ys) == 0:
        # Fallback estimate
        w, h = mockup.size
        return (30, 30, w - 60, h - 60)
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    return (x0, y0, x1 - x0, y1 - y0)


def make_gradient(w, h):
    """Premium dark navy → deep purple gradient."""
    grad = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(grad)
    # Top: deep slate-navy (#0F172A) → bottom: rich purple (#4C1D95)
    top = (15, 23, 42)
    bottom = (76, 29, 149)
    for y in range(h):
        t = y / h
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        gd.line([(0, y), (w, y)], fill=(r, g, b))

    # Subtle radial highlight (top-center)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Soft white-blue glow
    cx, cy = w // 2, h // 6
    for r in range(800, 0, -40):
        alpha = max(0, int(40 * (1 - r / 800)))
        od.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(99, 102, 241, alpha)
        )
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=80))
    grad_rgba = grad.convert("RGBA")
    grad_rgba = Image.alpha_composite(grad_rgba, overlay)
    return grad_rgba.convert("RGB")


# === Main ===
def main():
    print(f"Loading: {RAW_SCREENSHOT}")
    raw = Image.open(RAW_SCREENSHOT).convert("RGB")
    print(f"Loading: {MOCKUP}")
    mockup = Image.open(MOCKUP).convert("RGBA")
    print(f"Raw: {raw.size}  Mockup: {mockup.size}")

    # --- Step 1: Clean raw screenshot ---
    print("[step 1] Cleaning status bar...")
    draw_clean_status_bar(raw)

    print("[step 2] Masking AdMob banner...")
    mask_admob(raw)

    # Save intermediate (for debugging)
    intermediate = f"{OUTPUT_DIR}/_intermediate-cleaned.png"
    raw.save(intermediate)
    print(f"[debug] Saved intermediate: {intermediate}")

    # --- Step 3: Detect mockup screen area & insert screenshot ---
    print("[step 3] Detecting mockup screen area...")
    sx, sy, sw, sh = detect_screen_area(mockup)
    print(f"[step 3] Screen area: x={sx} y={sy} w={sw} h={sh}")

    print("[step 4] Resizing screenshot to fit screen...")
    shot_resized = raw.resize((sw, sh), Image.LANCZOS).convert("RGBA")

    print("[step 5] Compositing screenshot into mockup...")
    mockup_with_shot = mockup.copy()
    mockup_with_shot.paste(shot_resized, (sx, sy))

    # --- Step 6: Build final canvas ---
    print("[step 6] Building final canvas with gradient + copy...")
    final = make_gradient(FINAL_W, FINAL_H)

    # Marketing copy
    draw = ImageDraw.Draw(final)
    headline_font = load_font(140)
    subtitle_font = load_font(56)

    # Headline (2 lines, left-aligned with margin)
    margin_x = 90
    draw.text((margin_x, 230), "Level up", fill="white", font=headline_font)
    draw.text((margin_x, 380), "your habits.", fill="white", font=headline_font)

    # Subtitle
    draw.text((margin_x, 570), "Track. Reflect. Grow.", fill=(200, 210, 245), font=subtitle_font)

    # --- Step 7: Place phone mockup ---
    print("[step 7] Placing phone mockup...")
    target_w = int(FINAL_W * 0.85)
    scale = target_w / mockup_with_shot.width
    target_h = int(mockup_with_shot.height * scale)
    mockup_resized = mockup_with_shot.resize((target_w, target_h), Image.LANCZOS)

    phone_x = (FINAL_W - target_w) // 2
    phone_y = 740  # Below copy

    # Add soft shadow under phone
    shadow = Image.new("RGBA", (FINAL_W, FINAL_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    shadow_offset_y = 30
    sd.rounded_rectangle(
        [phone_x + 20, phone_y + shadow_offset_y,
         phone_x + target_w - 20, phone_y + target_h + shadow_offset_y],
        radius=120, fill=(0, 0, 0, 120)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=40))

    final_rgba = final.convert("RGBA")
    final_rgba = Image.alpha_composite(final_rgba, shadow)
    final_rgba.paste(mockup_resized, (phone_x, phone_y), mockup_resized)

    # --- Step 8: Save ---
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    final_out = final_rgba.convert("RGB")
    final_out.save(OUTPUT_FILE, "PNG", optimize=True)
    print(f"[done] Saved: {OUTPUT_FILE}")
    print(f"[done] Size: {final_out.size}")


if __name__ == "__main__":
    main()
