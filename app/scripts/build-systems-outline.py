"""Generate SYSTEMS outlines from the existing TikTok Sans font.

Development only: fonttools[woff]==4.65.0 and skia-pathops==0.9.2,
installed in app/.cache/font-geometry. Production imports the generated JSON.
"""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.cache/font-geometry'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import pathops

font = instantiateVariableFont(
    TTFont(ROOT / 'public/assets/fonts/tiktok-sans-latin-variable.woff2'),
    {'wght': 700},
)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
word = 'SYSTEMS'
advance = sum(glyphs[cmap[ord(char)]].width for char in word)
sx = 1310 / advance
sy = 300 / font['head'].unitsPerEm
letters = []
x = 0
for char in word:
    glyph = glyphs[cmap[ord(char)]]
    original = pathops.Path(fillType=pathops.FillType.WINDING)
    glyph.draw(original.getPen(glyphs))
    # Trace the visible union, not the font's overlapping construction contours.
    outline = pathops.simplify(original, fix_winding=True)
    assert pathops.op(original, outline, pathops.PathOp.XOR).area < .001, char
    assert all(abs(a-b) < .001 for a, b in zip(original.bounds, outline.bounds)), char
    assert len(list(outline.contours)) == 1, f'{char}: disconnected outline'
    assert list(outline.verbs)[-1] == pathops.PathVerb.CLOSE, char
    pen = SVGPathPen(glyphs, ntos=lambda n: f'{n:.3f}'.rstrip('0').rstrip('.') if n else '0')
    outline.draw(TransformPen(pen, (sx, 0, 0, -sy, 4 + x*sx, 226)))
    letters.append({'letter': char, 'd': pen.getCommands()})
    x += glyph.width

output = ROOT / 'src/pages/systems-title-outline.json'
output.write_text(json.dumps({
    'source': 'TikTok Sans local variable font, wght 700; overlapping contours merged with nonzero winding; original SVG textLength 1310 and baseline 226.',
    'viewBox': '0 0 1320 250',
    'letters': letters,
}, separators=(',', ':')), encoding='utf-8')
print(f'Generated {len(letters)} closed outlines; filled shapes and bounds preserved.')
