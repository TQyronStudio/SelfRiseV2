#!/usr/bin/env python3
"""Contact sheet: all screenshots of one folder side by side in one image.

  python3 .maestro/sheet.py .maestro/out/before/iphone-se-en-light sheet.png [columns]

Handy for looking at a whole run at once and for before/after comparison.
Needs Pillow.
"""
import sys
from pathlib import Path

from PIL import Image

WIDTH = 220  # each screenshot is scaled to this width
GAP = 6


def main(folder: str, out: str, cols: int = 10) -> None:
    files = sorted(Path(folder).glob("*.png"))
    if not files:
        sys.exit(f"no screenshots in {folder}")
    shots = []
    for f in files:
        im = Image.open(f).convert("RGB")
        shots.append(im.resize((WIDTH, round(im.height * WIDTH / im.width))))
    h = max(s.height for s in shots)
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (WIDTH + GAP), rows * (h + GAP)), "white")
    for i, s in enumerate(shots):
        sheet.paste(s, ((i % cols) * (WIDTH + GAP), (i // cols) * (h + GAP)))
    sheet.save(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 10)
