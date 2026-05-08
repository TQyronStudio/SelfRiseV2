#!/usr/bin/env python3
"""
SelfRise V2 - store screenshot generator.

Takes one raw app screenshot and renders a polished App Store-style marketing
slide. This first version intentionally stays small and deterministic so the
workflow is easy to inspect and iterate.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_DEFAULT = PROJECT_ROOT / "marketing" / "raw" / "phone" / "en" / "home-raw.png"
OUT_DEFAULT = PROJECT_ROOT / "marketing" / "final" / "phone" / "en" / "app-store" / "home-en-dark-iphone67-v1.png"
MOCKUP_DEFAULT = Path("/Users/turage/.agents/skills/app-store-screenshots/mockup.png")

CANVAS_W = 1290
CANVAS_H = 2796

# The bundled iPhone mockup dimensions and measured screen area from the skill.
MOCKUP_W = 1022
MOCKUP_H = 2082
SCREEN_L = 52
SCREEN_T = 46
SCREEN_W = 918
SCREEN_H = 1990
SCREEN_RADIUS = 126


def font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/SFCompact.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Avenir Next.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size, index=1 if bold else 0)
        except Exception:
            continue
    return ImageFont.load_default()


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img.convert("RGBA")


def add_radial_glow(base: Image.Image, center: tuple[int, int], radius: int, color: tuple[int, int, int], alpha: int) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for r in range(radius, 0, -24):
        t = 1 - (r / radius)
        a = int(alpha * (t**2))
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, a))
    layer = layer.filter(ImageFilter.GaussianBlur(38))
    base.alpha_composite(layer)


def prepare_screen(raw: Image.Image) -> Image.Image:
    """
    Remove anything we do not want visible in store assets:
    - top iOS status bar
    - bottom AdMob/test banner area

    The screen keeps the original device ratio so the UI is not stretched or
    side-cropped. Unwanted system/ad areas are painted out with nearby app
    colors before the screenshot is placed in the phone frame.
    """
    cleaned = raw.copy().convert("RGBA")
    draw = ImageDraw.Draw(cleaned)
    w, h = cleaned.size

    header_blue = cleaned.getpixel((w // 2, 170))
    app_dark = (28, 28, 30, 255)

    draw.rectangle((0, 0, w, 134), fill=header_blue)
    draw.rectangle((0, 2384, w, 2538), fill=app_dark)

    return cleaned.resize((SCREEN_W, SCREEN_H), Image.Resampling.LANCZOS)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def phone_with_screen(raw: Image.Image, mockup_path: Path) -> Image.Image:
    mockup = Image.open(mockup_path).convert("RGBA")
    if mockup.size != (MOCKUP_W, MOCKUP_H):
        mockup = mockup.resize((MOCKUP_W, MOCKUP_H), Image.Resampling.LANCZOS)

    screen = prepare_screen(raw)
    mask = rounded_mask((SCREEN_W, SCREEN_H), SCREEN_RADIUS)

    composed = mockup.copy()
    composed.paste(screen, (SCREEN_L, SCREEN_T), mask)
    return composed


def draw_centered(draw: ImageDraw.ImageDraw, text: str, y: int, fnt: ImageFont.ImageFont, fill: tuple[int, int, int]) -> None:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    x = (CANVAS_W - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=fnt, fill=fill)


def add_floor_reflection(canvas: Image.Image, phone: Image.Image, x: int, y: int, w: int, h: int) -> None:
    floor = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(floor)
    ellipse_y = min(CANVAS_H - 95, y + h - 44)
    draw.ellipse((x + 80, ellipse_y, x + w - 80, ellipse_y + 115), fill=(0, 170, 255, 62))
    floor = floor.filter(ImageFilter.GaussianBlur(34))
    canvas.alpha_composite(floor)

    reflected = phone.crop((0, int(phone.height * 0.72), phone.width, phone.height))
    reflected = reflected.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    reflected = reflected.resize((w, max(1, int(reflected.height * (w / phone.width) * 0.25))), Image.Resampling.LANCZOS)
    fade = Image.new("L", reflected.size, 0)
    fp = fade.load()
    for yy in range(fade.height):
        a = int(42 * (1 - yy / max(1, fade.height - 1)))
        for xx in range(fade.width):
            fp[xx, yy] = a
    reflected.putalpha(fade)
    canvas.alpha_composite(reflected, (x, y + h - 8))


def render(raw_path: Path, out_path: Path, mockup_path: Path) -> None:
    raw = Image.open(raw_path).convert("RGBA")
    phone = phone_with_screen(raw, mockup_path)

    canvas = vertical_gradient((CANVAS_W, CANVAS_H), (3, 8, 30), (0, 63, 125))
    add_radial_glow(canvas, (CANVAS_W // 2, 1110), 900, (0, 187, 255), 120)
    add_radial_glow(canvas, (CANVAS_W // 2, CANVAS_H + 70), 760, (0, 145, 255), 150)

    draw = ImageDraw.Draw(canvas)
    headline = font(126, bold=True)
    headline_accent = font(118, bold=True)
    sub = font(45)

    draw_centered(draw, "Build Habits.", 142, headline, (255, 255, 255))
    draw_centered(draw, "Level Up Your Life.", 290, headline_accent, (0, 214, 255))
    draw_centered(draw, "Track habits. Earn XP. Become your best self.", 468, sub, (198, 207, 224))

    phone_w = 990
    phone_h = int(phone_w * (MOCKUP_H / MOCKUP_W))
    phone_resized = phone.resize((phone_w, phone_h), Image.Resampling.LANCZOS)
    phone_x = (CANVAS_W - phone_w) // 2
    phone_y = 675

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (phone_x + 38, phone_y + 44, phone_x + phone_w - 38, phone_y + phone_h + 32),
        radius=110,
        fill=(0, 0, 0, 150),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(42))
    canvas.alpha_composite(shadow)

    canvas.alpha_composite(phone_resized, (phone_x, phone_y))
    add_floor_reflection(canvas, phone_resized, phone_x, phone_y, phone_w, phone_h)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out_path, "PNG", optimize=True)
    print(out_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build one SelfRise store screenshot.")
    parser.add_argument("--raw", type=Path, default=RAW_DEFAULT)
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT)
    parser.add_argument("--mockup", type=Path, default=MOCKUP_DEFAULT)
    args = parser.parse_args()

    render(args.raw, args.out, args.mockup)


if __name__ == "__main__":
    main()
