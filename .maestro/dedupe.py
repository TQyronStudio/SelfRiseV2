#!/usr/bin/env python3
"""Deletes the repeated frames at the bottom of each tab (capture.sh calls it).

Files are named <order>-<tab>-<nn>.png. A frame that looks the same as the one
kept before it in the same tab means the scroll reached the bottom. "Looks the
same" ignores the right edge, where the scroll bar flashes after every swipe.
Needs Pillow; without it only byte-identical frames are removed.
"""
import filecmp
import sys
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageStat
except ImportError:  # pragma: no cover - fallback for a machine without Pillow
    Image = None

EDGE = 0.04  # the right 4 % of the width holds the scroll bar
LIMIT = 0.5  # mean difference per pixel (0-255) still counted as "the same"


def same(a: Path, b: Path) -> bool:
    if filecmp.cmp(a, b, shallow=False):
        return True
    if Image is None:
        return False
    ia, ib = Image.open(a).convert("L"), Image.open(b).convert("L")
    if ia.size != ib.size:
        return False
    box = (0, 0, int(ia.width * (1 - EDGE)), ia.height)
    diff = ImageChops.difference(ia.crop(box), ib.crop(box))
    return ImageStat.Stat(diff).mean[0] < LIMIT


def main(folder: str) -> None:
    kept, tab = None, None
    for f in sorted(Path(folder).glob("*.png")):
        this_tab = "-".join(f.stem.split("-")[:2])
        if this_tab == tab and kept is not None and same(f, kept):
            f.unlink()
            continue
        kept, tab = f, this_tab


if __name__ == "__main__":
    main(sys.argv[1])
