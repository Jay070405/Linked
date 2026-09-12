"""Derive animation paths from the actual wordmark font and supplied JL artwork.

Development-only dependencies: fonttools[woff], skia-pathops, Pillow.
Validated with fonttools[woff]==4.65.0 and skia-pathops==0.9.2 installed into
app/.cache/font-geometry; neither is in the browser or production build.
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
import pathops

def regularize_y(outline):
 # The filled font has small horizontal shoulders between each outer arm and
 # the stem. For this large traced wordmark, extend both original outer arm
 # lines down to a centered stem of the original width, removing those steps.
 # Keep all four top terminals, the inner crotch, baseline and outer bounds.
 x0,y0,x1,y1=outline.bounds; center=(x0+x1)/2
 points=list(outline.points)
 upper=sorted(x for x,y in points if abs(y-y1)<.001)
 lower=sorted(x for x,y in points if abs(y-y0)<.001)
 assert len(upper)==4 and len(lower)==2, 'Y: unexpected font structure'
 stem_width=lower[1]-lower[0]
 stem_left=center-stem_width/2; stem_right=center+stem_width/2
 shoulders=[(x,y) for x,y in points if y0<y<y1 and (x<lower[0] or x>lower[1])]
 assert len(shoulders)==2, 'Y: expected two outer arm shoulder points'
 left_shoulder,right_shoulder=sorted(shoulders)
 left_join=y1+(stem_left-x0)*(left_shoulder[1]-y1)/(left_shoulder[0]-x0)
 right_join=y1+(stem_right-x1)*(right_shoulder[1]-y1)/(right_shoulder[0]-x1)
 assert abs(left_join-right_join)<.001, 'Y: outer arm slopes are not symmetric'
 join_y=(left_join+right_join)/2
 crotch=[y for x,y in points if abs(x-center)<.001 and y0<y<y1]
 assert len(crotch)==1 and y0<join_y<crotch[0]<y1, 'Y: invalid arm/stem junction'
 fixed=pathops.Path(fillType=pathops.FillType.WINDING)
 fixed.moveTo(stem_left,join_y)
 fixed.lineTo(x0,y1); fixed.lineTo(upper[1],y1)
 fixed.lineTo(center,crotch[0]); fixed.lineTo(upper[2],y1); fixed.lineTo(x1,y1)
 fixed.lineTo(stem_right,join_y); fixed.lineTo(stem_right,y0); fixed.lineTo(stem_left,y0)
 fixed.close()
 assert all(abs(a-b)<=.001 for a,b in zip(outline.bounds,fixed.bounds)), 'Y: bounds changed'
 # Every vertex has a reflected partner; no horizontal segment remains inside
 # the cap height. The only horizontal edges are the top ends and stem base.
 vertices=list(fixed.points)
 assert all(any(abs(xx-(2*center-x))<.001 and abs(yy-y)<.001 for xx,yy in vertices) for x,y in vertices), 'Y: asymmetric outline'
 assert all(abs(a[1]-b[1])>.001 or min(abs(a[1]-y0),abs(a[1]-y1))<.001 for a,b in zip(vertices,vertices[1:]+vertices[:1])), 'Y: internal shoulder step'
 assert len(list(pathops.simplify(fixed).contours))==1, 'Y: disconnected corrected outline'
 return fixed

def merged_outline(glyph, glyph_set, char):
 # Font contours are designed for a filled glyph, not for tracing every segment.
 # A's crossbar and Y's stem overlap their other contours; L also folds back on
 # itself. Simplify their NONZERO fill as one region before drawing its outline.
 # Unioning each contour independently would incorrectly fill A's counter.
 original=pathops.Path(fillType=pathops.FillType.WINDING)
 glyph.draw(original.getPen(glyph_set))
 merged=pathops.simplify(original,fix_winding=True,keep_starting_points=True,clockwise=original.clockwise)
 # Retain the exact visible shape and layout. These checks also prevent a future
 # font or pathops update from silently opening a seam or filling a real hole.
 difference=pathops.op(original,merged,pathops.PathOp.XOR)
 assert difference.area<=.001, f'{char}: boolean merge changed the filled glyph'
 assert all(abs(a-b)<=.001 for a,b in zip(original.bounds,merged.bounds)), f'{char}: bounds changed'
 contours=list(merged.contours)
 assert all(list(contour.verbs)[-1]==pathops.PathVerb.CLOSE for contour in contours), f'{char}: open outline'
 if char=='A':
  assert len(contours)==2 and contours[0].clockwise!=contours[1].clockwise, 'A: missing counter'
  x0,y0,x1,y1=merged.bounds
  assert not merged.contains(((x0+x1)/2,y0+(y1-y0)*.65)), 'A: counter is filled'
 if char=='Y':
  assert len(contours)==1, 'Y: disconnected stem or internal boundary'
  x0,y0,x1,y1=merged.bounds
  assert all(merged.contains(((x0+x1)/2,y0+(y1-y0)*t)) for t in (.05,.2,.4,.5)), 'Y: seam through the stem'
  return regularize_y(merged)
 return merged

font=instantiateVariableFont(TTFont(ROOT/'public/assets/fonts/tiktok-sans-latin-variable.woff2'),{'wght':650})
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); em=font['head'].unitsPerEm
items=[]; x=0; tracking=-.065*em
for char in 'JAY LIN':
 name=cmap[ord(char)]; glyph=glyphs[name]
 if char!=' ':
  bounds=BoundsPen(glyphs);glyph.draw(bounds)
  items.append({'char':char,'glyph':name,'x':x,'bounds':bounds.bounds,'outline':merged_outline(glyph,glyphs,char)})
 x+=glyph.width+tracking
min_x=min(it['x']+it['bounds'][0] for it in items)
min_y=min(-it['bounds'][3] for it in items)
max_x=max(it['x']+it['bounds'][2] for it in items)
max_y=max(-it['bounds'][1] for it in items)
word=[]
for item in items:
 pen=SVGPathPen(glyphs,ntos=lambda n:f'{n:.3f}'.rstrip('0').rstrip('.') if n else '0')
 item['outline'].draw(TransformPen(pen,(1,0,0,-1,item['x']-min_x,-min_y)))
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
data={'source':'TikTok Sans local variable font, wght 650; tracking -0.065em; overlapping font contours boolean-merged with nonzero winding; Y outer arms extended to a centered stem of the original width. Logo contour from supplied logo.png, luminance <75.','word':{'width':max_x-min_x,'height':max_y-min_y,'paths':word},'logo':{'viewBox':'85 90 355 410','paths':logo}}
out=ROOT/'src/components/assets/brand-geometry.json'
out.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(f'Generated {len(word)} real glyph outlines and {len(logo)} JL contours; word {max_x-min_x:.1f} × {max_y-min_y:.1f}; {out.stat().st_size} bytes')
print('Verified exact fills for J/A/L/I/N and unchanged bounds for all letters; A retains its counter; Y has symmetric, continuous arm-to-stem edges.')
