"""
arden-exploded-map.py -- an ID map for the Arden exploded render, so the page can move its parts.

renders/exploded.png is one still. To slide its parts apart on scroll, the page needs to know which pixel belongs to
which part and where each part sits once assembled. This script re-creates that exact view in Blender (it runs the
case's own render_exploded.py up to its render call, so camera, pose and offsets are the same), then:

  - renders two flat ID maps with Workbench (fast, no anti-aliasing): the opaque parts, and the clear lens layers on
    their own (a clear layer must not claim the frame seen through it);
  - writes, for every visible object, its layer (the parts that move together), its projected box and centroid, and
    how far its layer travels on screen between assembled and exploded (fractions of the image).

    "<blender.exe>" -b <d5-glasses>/blender/arden.blend -P app/scripts/arden-exploded-map.py -- \
        --case <d5-glasses> --out app/scripts/arden-map

Nothing is saved back to the .blend. build-arden-assets.mjs reads the result; it checks the recorded hash of
exploded.png and falls back to a plain split (no travel) when the map is stale.
"""
import hashlib
import json
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = dict(case="", out="", width="1600")
for i in range(0, len(argv) - 1, 2):
    opt[argv[i].lstrip('-')] = argv[i + 1]
CASE = os.path.abspath(opt['case'] or os.path.join(os.path.dirname(bpy.data.filepath), ".."))
OUT = os.path.abspath(opt['out'] or os.path.join(os.path.dirname(os.path.abspath(__file__)), "arden-map"))
os.makedirs(OUT, exist_ok=True)
SCRIPT = os.path.join(CASE, "blender", "render_exploded.py")
RENDER = os.path.join(CASE, "renders", "exploded.png")

# run the case's exploded script up to (not including) its lighting and render
src = open(SCRIPT, encoding="utf-8").read()
cut = src.find("# titanium: gradient cards")
if cut < 0:
    cut = src.find("LK.render(")
ns = {"__file__": SCRIPT, "__name__": "__exploded__"}
sys.argv = [sys.argv[0], "--", "--view", "full", "--out", os.path.join(OUT, "unused.png")]
exec(compile(src[:cut], SCRIPT, "exec"), ns)

sc = bpy.context.scene
cam, MM, K = ns["cam"], ns["MM"], ns["K"]
full_offset, group, side_of = ns["full_offset"], ns["group"], ns["side_of"]
vis = [o for o in ns["moved"] if not o.hide_render]
W0, H0 = int(ns["W"]), int(ns["Hh"])

TEMPLE = ("core", "outer", "chassis", "skin")
ROW = {0: "flex", 1: "core", 2: "chassis"}


def layer_of(o):
    n, g, sd = o.name, group(o.name), side_of(o.name)
    if g in TEMPLE and sd == 0:
        # the capture button has no side in its name, so the render script moves it on its own; it gets its own layer
        return "button"
    if g in TEMPLE:
        if n.startswith(("Flex_Arm_", "Flex_Hinge_", "Pogo_Spring_", "Mic_Front_", "Mic_Rear_")):
            k = 0
        else:
            k = {"core": 1, "chassis": 2, "outer": 3, "skin": 4 if sd < 0 else 3}[g]
        row = "skin" if g == "skin" else ROW.get(k, "outer")
        return ("far-" if sd < 0 else "near-") + row
    if g == "stack":
        key = n.replace("LensStack_R_", "")
        return "lens-" + ("waveguide" if key in ("Waveguide", "InCoupler", "OutCoupler") else key.lower())
    if g == "front_int":
        if n.startswith("Projector_"):
            return "projector"
        if n.startswith("ALS_"):
            return "als"
        if n.startswith("Mic_Bridge"):
            return "mic-bridge"
        return "camera"
    return {"front_flex": "front-flex", "pads": "pads", "accel": "accel"}.get(g, "front")


def world_delta(o):
    off = full_offset(o.name, group(o.name), side_of(o.name)) * K * MM
    if o.parent is not None:
        off = (o.parent.matrix_world.to_3x3() @ o.matrix_parent_inverse.to_3x3()) @ off
    return off


def proj(p):
    v = world_to_camera_view(sc, cam, p)
    return (v.x, 1.0 - v.y)


def verts(o):
    mw = o.matrix_world
    vs = o.data.vertices
    step = max(1, len(vs) // 400)
    return [mw @ vs[i].co for i in range(0, len(vs), step)]


objects, layers = [], {}
for i, o in enumerate(vis, start=1):
    pts = verts(o)
    if not pts:
        continue
    c = sum(pts, Vector()) / len(pts)
    a, b = proj(c), proj(c - world_delta(o))
    xy = [proj(p) for p in pts]
    xs, ys = [p[0] for p in xy], [p[1] for p in xy]
    lay = layer_of(o)
    objects.append(dict(id=i, name=o.name, layer=lay, lens=o.name.startswith(("LensStack_R_", "Lens_L")),
                        cx=round(a[0], 5), cy=round(a[1], 5), x0=round(min(xs), 5), y0=round(min(ys), 5),
                        x1=round(max(xs), 5), y1=round(max(ys), 5),
                        dx=round(b[0] - a[0], 5), dy=round(b[1] - a[1], 5), n=len(o.data.vertices)))
    L = layers.setdefault(lay, dict(name=lay, dx=0.0, dy=0.0, w=0))
    L["dx"] += (b[0] - a[0]) * len(o.data.vertices)
    L["dy"] += (b[1] - a[1]) * len(o.data.vertices)
    L["w"] += len(o.data.vertices)
for L in layers.values():
    L["dx"], L["dy"] = round(L["dx"] / L["w"], 5), round(L["dy"] / L["w"], 5)
    del L["w"]

# flat ID maps: R + 256 * G is the object's id; transparent where nothing is
width = int(opt['width'])
r = sc.render
r.engine = 'BLENDER_WORKBENCH'
r.resolution_x, r.resolution_y, r.resolution_percentage = width, round(width * H0 / W0), 100
r.film_transparent = True
r.use_compositing = False
r.use_sequencer = False
r.dither_intensity = 0.0
r.image_settings.file_format = 'PNG'
r.image_settings.color_mode = 'RGBA'
r.image_settings.color_depth = '8'
sc.view_settings.view_transform = 'Raw'
sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0
sc.view_settings.gamma = 1.0
sh = sc.display.shading
sh.light = 'FLAT'
sh.color_type = 'OBJECT'
for k in ("show_xray", "show_shadows", "show_cavity", "show_object_outline", "show_specular_highlight",
          "use_dof", "show_backface_culling"):
    if hasattr(sh, k):
        setattr(sh, k, False)
sc.display.render_aa = 'OFF'
ids = {o.name: d["id"] for o, d in zip(vis, objects)}
for o in vis:
    i = ids.get(o.name, 0)
    o.color = ((i % 256) / 255.0, (i // 256) / 255.0, 0.0, 1.0)
keep = set(o.name for o in vis)
for o in sc.objects:
    if o.type in ('MESH', 'CURVE', 'SURFACE', 'META', 'FONT') and o.name not in keep:
        o.hide_render = True
lens = set(d["name"] for d in objects if d["lens"])
for name, which in (("opaque", lambda n: n not in lens), ("lens", lambda n: n in lens)):
    for o in vis:
        o.hide_render = not which(o.name)
    r.filepath = os.path.join(OUT, f"exploded-{name}.png")
    bpy.ops.render.render(write_still=True)

sha = hashlib.sha1(open(RENDER, "rb").read()).hexdigest() if os.path.exists(RENDER) else None
with open(os.path.join(OUT, "exploded-map.json"), "w", encoding="utf-8") as f:
    json.dump(dict(render=dict(file="renders/exploded.png", sha1=sha, width=W0, height=H0),
                   map=dict(width=r.resolution_x, height=r.resolution_y, files=["exploded-opaque.png", "exploded-lens.png"]),
                   layers=sorted(layers.values(), key=lambda L: L["name"]), objects=objects), f, indent=1)
print("ARDEN MAP", len(objects), "objects,", len(layers), "layers ->", OUT)
