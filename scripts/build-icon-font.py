# SelfRise signature icons (kolo 51, lab debt L-5, O-15) -> assets/fonts/SelfRiseIcons.ttf
# Each icon is TWO glyphs: a base and a lighter core drawn on top (duotone, colours from
# the app's tokens). Shapes are SVG paths in a y-down 1000-unit box.
# Usage: <venv>/bin/python scripts/build-icon-font.py   (needs fonttools)
import math, os, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path

def rounded_poly(points, radii):
    """Closed polygon with each corner rounded by a quadratic curve (y-down)."""
    n = len(points); d = []
    for i in range(n):
        p0 = points[i - 1]; p1 = points[i]; p2 = points[(i + 1) % n]; r = radii[i]
        def toward(a, b, dist):
            dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy)
            return (a[0] + dx / L * dist, a[1] + dy / L * dist)
        a = toward(p1, p0, r); b = toward(p1, p2, r)
        d.append(('L' if d else 'M') + f'{a[0]:.1f},{a[1]:.1f} Q{p1[0]:.1f},{p1[1]:.1f} {b[0]:.1f},{b[1]:.1f}')
    return ' '.join(d) + ' Z'

def star(cx, cy, R, r, rr_out, rr_in):
    pts = []; radii = []
    for k in range(10):
        ang = -math.pi / 2 + k * math.pi / 5
        rad = R if k % 2 == 0 else r
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        radii.append(rr_out if k % 2 == 0 else rr_in)
    return rounded_poly(pts, radii)

def rotated_bar(cx, cy, deg, r0, r1, half):
    """A rounded bar from radius r0 to r1 around (cx, cy), at `deg` (0 = right, y-down)."""
    a = math.radians(deg); ux, uy = math.cos(a), math.sin(a); px, py = -uy, ux
    p0 = (cx + ux * r0, cy + uy * r0); p1 = (cx + ux * r1, cy + uy * r1)
    pts = [(p0[0] + px * half, p0[1] + py * half), (p1[0] + px * half, p1[1] + py * half),
           (p1[0] - px * half, p1[1] - py * half), (p0[0] - px * half, p0[1] - py * half)]
    return rounded_poly(pts, [half * 0.9] * 4)

def circle(cx, cy, r):
    k = 0.5523 * r
    return (f'M{cx},{cy-r} C{cx+k},{cy-r} {cx+r},{cy-k} {cx+r},{cy} C{cx+r},{cy+k} {cx+k},{cy+r} {cx},{cy+r} '
            f'C{cx-k},{cy+r} {cx-r},{cy+k} {cx-r},{cy} C{cx-r},{cy-k} {cx-k},{cy-r} {cx},{cy-r} Z')

def rrect(x0, y0, x1, y1, r):
    return rounded_poly([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], [r, r, r, r])

ICONS = {
    # name: (base paths, core paths)
    'star': ([star(500, 530, 430, 200, 70, 30)],
             [star(500, 548, 205, 98, 34, 14)]),
    'flame': (['M500,70 C565,215 780,330 780,600 C780,800 655,925 500,925 C345,925 220,800 220,615 '
               'C220,470 300,395 345,320 C365,415 405,465 460,488 C440,350 462,210 500,70 Z'],
              ['M500,505 C545,595 632,640 632,748 C632,842 572,895 500,895 C428,895 368,842 368,755 '
               'C368,682 420,640 447,598 C462,650 484,672 506,678 C495,620 490,565 500,505 Z']),
    'crown': ([rounded_poly([(150, 330), (335, 555), (500, 235), (665, 555), (850, 330), (790, 720), (210, 720)],
                            [40, 30, 40, 30, 40, 30, 30]),
               rrect(205, 735, 795, 845, 40),
               circle(150, 300, 62), circle(500, 200, 66), circle(850, 300, 62)],
              [circle(340, 790, 30), circle(500, 790, 34), circle(660, 790, 30)]),
    'trophy': (['M250,140 H750 V420 C750,565 645,660 500,660 C355,660 250,565 250,420 Z',
                'M251,215 H185 C142,215 118,248 118,292 C118,398 196,462 286,482 L300,414 '
                'C236,398 186,352 186,300 C186,284 196,278 208,278 H251 Z',
                'M749,215 H815 C858,215 882,248 882,292 C882,398 804,462 714,482 L700,414 '
                'C764,398 814,352 814,300 C814,284 804,278 792,278 H749 Z',
                rrect(458, 640, 542, 770, 10),
                rrect(325, 760, 675, 870, 38)],
               ['M325,205 H405 V420 C405,505 438,560 482,592 C392,580 325,505 325,420 Z']),
    # --- Tab bar (kolo 51). A path starting with '!' is a hole. ---
    # Today: the sun of the day rising over the horizon (the hero of Home).
    'today': ([rrect(110, 700, 890, 770, 35)]
              # Five rays, 36° apart, over the rising sun.
              + [rotated_bar(500, 660, ang, 320, 430, 30) for ang in (-162, -126, -90, -54, -18)],
              ['M285,660 A215,215 0 0 1 715,660 Z']),
    # Habits: a check in a circle — done, again and again.
    'habits': ([circle(500, 500, 370),
                '!' + rounded_poly([(290, 505), (362, 433), (450, 521), (640, 331), (712, 403), (450, 665)],
                                   [18, 22, 14, 22, 18, 14])],
               []),
    # Journal: a page with lines and a ribbon.
    'journal': ([rrect(200, 110, 800, 890, 70),
                 '!' + rrect(300, 380, 700, 430, 25),
                 '!' + rrect(300, 500, 700, 550, 25),
                 '!' + rrect(300, 620, 580, 670, 25)],
                ['M560,110 H690 V310 L625,262 L560,310 Z']),
    # Goals: a flag on its pole.
    'goals': ([rrect(215, 110, 285, 900, 35),
               'M285,150 H760 C790,150 800,175 785,198 L690,325 L785,452 C800,475 790,500 760,500 H285 Z'],
              []),
    # Settings: three sliders.
    'settings': ([rrect(140, 245, 860, 315, 35), rrect(140, 465, 860, 535, 35), rrect(140, 685, 860, 755, 35),
                  circle(360, 280, 90), circle(640, 500, 90), circle(430, 720, 90)],
                 []),
}

CODEPOINTS = {}
cp = 0xE001
for name in ICONS:
    CODEPOINTS[name] = cp; CODEPOINTS[name + '-core'] = cp + 1; cp += 2

from fontTools.pens.areaPen import AreaPen
from fontTools.pens.reverseContourPen import ReverseContourPen

def draw(paths):
    """Every contour drawn in the same direction, so overlapping shapes add up
    (TrueType fills by non-zero winding: opposite directions would cut holes)."""
    pen = TTGlyphPen(None)
    for d in paths:
        hole = d.startswith('!')
        d = d.lstrip('!')
        area = AreaPen()
        parse_path(d, TransformPen(area, (1, 0, 0, -1, 0, 800)))
        target = Cu2QuPen(pen, max_err=1.0, reverse_direction=True)
        # TrueType wants clockwise outlines (negative area in fontTools' AreaPen);
        # a hole runs the other way.
        if (area.value > 0) != hole:
            target = ReverseContourPen(target)
        parse_path(d, TransformPen(target, (1, 0, 0, -1, 0, 800)))
    return pen.glyph()

order = ['.notdef'] + [n for name in ICONS for n in (name, name + '-core')]
glyphs = {'.notdef': TTGlyphPen(None).glyph()}
for name, (base, core) in ICONS.items():
    glyphs[name] = draw(base); glyphs[name + '-core'] = draw(core)

fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(order)
fb.setupCharacterMap({CODEPOINTS[n]: n for n in order if n != '.notdef'})
fb.setupGlyf(glyphs)
# The left side bearing must equal each glyph's xMin, or renderers shift the
# outline (the core would no longer sit on its base).
glyf = fb.font['glyf']
lsb = {}
for n in order:
    g = glyf[n]
    g.recalcBounds(glyf)
    lsb[n] = getattr(g, 'xMin', 0)
fb.setupHorizontalMetrics({n: (1000, lsb[n]) for n in order})
fb.setupHorizontalHeader(ascent=800, descent=-200)
# iOS finds a font by its PostScript name (nameID 6): without it the font may not
# resolve and every icon draws as a "?" box (Petr 2026-11-22). Full set of names,
# like every shipped font has.
fb.setupNameTable({
    'familyName': 'SelfRiseIcons',
    'styleName': 'Regular',
    'uniqueFontIdentifier': 'SelfRiseIcons-Regular-1.001',
    'fullName': 'SelfRiseIcons',
    'psName': 'SelfRiseIcons',
    'version': 'Version 1.001',
})
fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, sTypoLineGap=0, usWinAscent=800,
            usWinDescent=200, usWeightClass=400, fsType=0, achVendID='SLFR')
fb.setupPost()
out = sys.argv[1] if len(sys.argv) > 1 else 'assets/fonts/SelfRiseIcons.ttf'
fb.save(out)
print('saved', out, {k: hex(v) for k, v in CODEPOINTS.items()})
