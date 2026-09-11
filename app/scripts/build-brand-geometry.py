"""Derive animation paths from the actual wordmark font and supplied JL artwork.

Development-only dependencies: fonttools[woff] in .cache/font-geometry, Pillow.
No raster file is modified. Output is code-native SVG geometry.
"""
from pathlib import Path
import sys, json, math
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.cache/font-geometry'))
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

font=instantiateVariableFont(TTFont(ROOT/'public/assets/fonts/tiktok-sans-latin-variable.woff2'),{'wght':650})
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); em=font['head'].unitsPerEm
items=[]; x=0; tracking=-.065*em
for char in 'JAY LIN':
 name=cmap[ord(char)]; glyph=glyphs[name]
 if char!=' ':
  bounds=BoundsPen(glyphs);glyph.draw(bounds)
  items.append({'char':char,'glyph':name,'x':x,'bounds':bounds.bounds})
 x+=glyph.width+tracking
min_x=min(it['x']+it['bounds'][0] for it in items)
min_y=min(-it['bounds'][3] for it in items)
max_x=max(it['x']+it['bounds'][2] for it in items)
max_y=max(-it['bounds'][1] for it in items)
word=[]
for item in items:
 pen=SVGPathPen(glyphs,ntos=lambda n:f'{n:.3f}'.rstrip('0').rstrip('.') if n else '0')
 glyphs[item['glyph']].draw(TransformPen(pen,(1,0,0,-1,item['x']-min_x,-min_y)))
 bx0,by0,bx1,by1=item['bounds']
 word.append({'letter':item['char'],'d':pen.getCommands(),'bounds':[item['x']+bx0-min_x,-by1-min_y,item['x']+bx1-min_x,-by0-min_y]})

im=Image.open(ROOT/'public/assets/logo.png').convert('L'); width,height=im.size
filled={(x,y) for y in range(height) for x in range(width) if im.getpixel((x,y))<75}
edges={}
def edge(a,b):edges.setdefault(a,[]).append(b)
for x,y in filled:
 if (x,y-1) not in filled:edge((x,y),(x+1,y))
 if (x+1,y) not in filled:edge((x+1,y),(x+1,y+1))
 if (x,y+1) not in filled:edge((x+1,y+1),(x,y+1))
 if (x-1,y) not in filled:edge((x,y+1),(x,y))
loops=[]
while edges:
 start=next(iter(edges));cursor=start;loop=[]
 while True:
  loop.append(cursor);nxt=edges[cursor].pop()
  if not edges[cursor]:del edges[cursor]
  cursor=nxt
  if cursor==start:break
 if len(loop)>100:loops.append(loop)
def rdp(points,eps=.7):
 if len(points)<3:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];length=math.hypot(dx,dy)
 distances=[abs(dy*(p[0]-a[0])-dx*(p[1]-a[1]))/length if length else math.dist(p,a) for p in points]
 index=max(range(len(points)),key=lambda n:distances[n])
 if distances[index]<=eps:return [a,b]
 return rdp(points[:index+1],eps)[:-1]+rdp(points[index:],eps)
logo=[]
for loop in loops:
 # Start at the topmost point; simplify two open halves, then smooth subpixel corners.
 k=min(range(len(loop)),key=lambda i:(loop[i][1],loop[i][0]));loop=loop[k:]+loop[:k]
 half=len(loop)//2;points=rdp(loop[:half+1])[:-1]+rdp(loop[half:]+loop[:1])[:-1]
 mids=[((points[i][0]+points[(i+1)%len(points)][0])/2,(points[i][1]+points[(i+1)%len(points)][1])/2) for i in range(len(points))]
 path=f'M{mids[-1][0]:g} {mids[-1][1]:g}'
 for p,m in zip(points,mids):path+=f'Q{p[0]:g} {p[1]:g} {m[0]:g} {m[1]:g}'
 logo.append(path+'Z')
data={'source':'TikTok Sans local variable font, wght 650; tracking -0.065em. Logo contour from supplied logo.png, luminance <75.','word':{'width':max_x-min_x,'height':max_y-min_y,'paths':word},'logo':{'viewBox':'85 90 355 410','paths':logo}}
out=ROOT/'src/components/assets/brand-geometry.json'
out.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(f'Generated {len(word)} real glyph outlines and {len(logo)} JL contours; word {max_x-min_x:.1f} × {max_y-min_y:.1f}; {out.stat().st_size} bytes')
