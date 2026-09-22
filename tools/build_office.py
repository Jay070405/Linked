"""Reproducible, original studio model. Run with Blender --background --python.

Blender coordinates: X right, Y into room, Z up. GLB converts to Y-up.
Geometry is authored here. CC0 scanned wood maps: Poly Haven. See ASSET-CREDITS.md.
"""
import bpy, math, random, json
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/public/assets/office3d'
SOURCE = ROOT / 'design/office3d'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
random.seed(23)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj

shared = group('SharedDesk')
indoor = group('StudioInterior')
props=[]
parent = shared

def material(name, color, rough=.85, metal=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    return m

def painted(name, base, wood=False):
    m = material(name, base)
    n = 512
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    rng = np.random.default_rng(47 if wood else 18)
    noise = rng.random((n,n)).astype(np.float32) - .5
    if wood:
        ripple = y * 105 + np.sin(x * 9 + y * 5) * .68 + np.sin(x * 21) * .13
        stroke = np.sin(ripple * math.pi) * .012 + np.sin(ripple * 8) * .006
        stroke += np.sin(y * 13 + x * 2) * .014
    else:
        stroke = np.sin(x * 26 + np.sin(y * 11)) * .018 + np.sin(y * 34 + x * 7) * .014
    value = stroke + noise * .023
    pixels = np.ones((n,n,4), dtype=np.float32)
    for c in range(3): pixels[:,:,c] = np.clip(base[c] + value * (1 if wood else .5), 0, 1)
    image = bpy.data.images.new(name + '_brushwork', n, n)
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = str(SOURCE / (name + '.png'))
    image.file_format = 'PNG'
    image.save(); image.pack()
    tex = m.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = image
    m.node_tree.links.new(tex.outputs['Color'], m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    return m

def pbr_wood(name, asset, tint=(1,1,1)):
    m=material(name,tint,.76)
    p=m.node_tree.nodes.get('Principled BSDF')
    for kind,socket in [('Diffuse','Base Color'),('nor_gl','Normal')]:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image=bpy.data.images.load(str(SOURCE/'textures'/f'{asset}_{kind}.jpg'));tex.image.pack()
        if kind!='Diffuse':tex.image.colorspace_settings.name='Non-Color'
        if kind=='nor_gl':
            normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.16
            m.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs[0],p.inputs[socket])
        else:m.node_tree.links.new(tex.outputs['Color'],p.inputs[socket])
    return m
wood=pbr_wood('Honey_oak','wood_table_large')
walnut=pbr_wood('Floor_walnut','wood_table_large')
plaster=painted('Forest_plaster',(.028,.037,.030))
ink=material('Ink',(.008,.009,.009),.36)
graphite=material('Graphite',(.016,.019,.021),.67)
aluminum=material('Champagne_aluminium',(.48,.43,.35),.29,.88)
rim=material('Warm_edge',(.58,.53,.43),.25,.82)
screen=material('Screen_off',(.003,.004,.005),1)
paper=material('Ivory_paper',(.69,.64,.52),.9)
ceramic=painted('Clay',(.25,.15,.080));ceramic.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.58
cream=material('Key_caps',(.55,.53,.47),.49)
leafmat=[material('Leaf_'+str(i),c,.42) for i,c in enumerate([(.055,.085,.018),(.095,.14,.026),(.17,.19,.045),(.035,.065,.014)])]
twig=material('Branch',(.13,.065,.022),.8)
brass=material('Brass',(.34,.21,.085),.29,.8)

# Each loose object is an independent hierarchy and rigid body in the browser.
def start_prop(name, center, half, mass=1):
    global parent
    obj=group(name);obj.parent=shared
    obj['draggable']=True;obj['halfExtents']=half;obj['mass']=mass
    obj['home']=center;props.append(obj);parent=obj
    return obj

def end_prop():
    global parent
    obj=parent;center=Vector(obj['home'])
    for child in obj.children:child.location-=center
    obj.location=center;parent=shared

def finish(obj, name, mat=None):
    obj.name = name
    obj.parent = parent
    if mat: obj.data.materials.append(mat)
    return obj

def box(name, loc, size, mat, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object; obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Soft machined edges', 'BEVEL'); mod.width = bevel; mod.segments = 6
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod = obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if mat in [wood,walnut]:
        # Metric planar UVs keep edge grain and desktop grain at the same scale.
        uv=obj.data.uv_layers.active or obj.data.uv_layers.new()
        for poly in obj.data.polygons:
            axis=max(range(3),key=lambda i:abs(poly.normal[i]))
            for li in poly.loop_indices:
                v=obj.data.vertices[obj.data.loops[li].vertex_index].co
                uv.data[li].uv=((v.y+loc[1])/5,(v.x+loc[0])/3) if axis==2 and name=='Floor' else ((v.x+loc[0])/8,(v.y+loc[1])/7) if axis==2 else ((v.x+loc[0])/5,(v.z+loc[2])/3) if axis==1 else ((v.y+loc[1])/3,(v.z+loc[2])/3)
    return finish(obj,name,mat)

def sphere(name, loc, size, mat, segments=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=20, radius=1, location=loc)
    obj=bpy.context.object; obj.scale=size
    for p in obj.data.polygons: p.use_smooth=True
    return finish(obj,name,mat)

def rounded_front(name, loc, size, mat, radius):
    # Independent X/Z radius: a thin monitor must not clamp corner curvature
    # to half its depth as a conventional cube bevel would.
    w,depth,h=size; outline=[]
    for cx,cz,angle in [(w/2-radius,h/2-radius,0),(-w/2+radius,h/2-radius,90),(-w/2+radius,-h/2+radius,180),(w/2-radius,-h/2+radius,270)]:
        for i in range(9):
            a=math.radians(angle+i*90/8)
            outline.append((cx+math.cos(a)*radius,cz+math.sin(a)*radius))
    count=len(outline); verts=[]
    for y in [-depth/2,depth/2]:
        verts.extend([(loc[0]+x,loc[1]+y,loc[2]+z) for x,z in outline])
    faces=[tuple(range(count)),tuple(range(2*count-1,count-1,-1))]
    faces.extend([(i,count+i,count+(i+1)%count,(i+1)%count) for i in range(count)])
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    if depth>.02:
        bevel=obj.modifiers.new('Rolled edge','BEVEL');bevel.width=min(depth*.20,.013);bevel.segments=3
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)
        normal=obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=normal.name)
    return finish(obj,name,mat)

def cylinder(name, a, b, radius, mat, r2=None, vertices=40):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius if r2 is None else r2, depth=d.length, location=(a+b)*.5)
    obj=bpy.context.object; obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    for p in obj.data.polygons: p.use_smooth=True
    if mat in [wood,walnut]:
        for uv in obj.data.uv_layers.active.data:
            u,v=uv.uv[:];uv.uv=(v*.7,u*.045)
    return finish(obj,name,mat)

def curve(name, points, radius, mat):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=10
    spline=data.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for b,p in zip(spline.bezier_points,points): b.co=p; b.handle_left_type='AUTO'; b.handle_right_type='AUTO'
    data.bevel_depth=radius; data.bevel_resolution=2
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat)

def leaf(name, start, end, width, mat):
    # Curved leaf blade with a visible fold, not a stretched primitive sphere.
    a,b=Vector(start),Vector(end); d=b-a
    side=d.cross(Vector((0,-1,.2))).normalized()*width
    mid=a+d*.53; lift=Vector((0,-.018,.025))
    verts=[]; faces=[]
    for i in range(9):
        t=i/8; w=math.sin(t*math.pi)**.85
        center=a+d*t+lift*math.sin(t*math.pi)
        verts.extend([center-side*w,center+lift*w*.3,center+side*w])
    for i in range(8):
        for j in range(2):
            v=i*3+j;faces.extend([(v,v+3,v+1),(v+1,v+3,v+4)])
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj)
    for p in data.polygons:p.use_smooth=True
    finish(obj,name,mat)
    # Thin painted vein enhances the illustrated silhouette.
    curve(name+'_vein',[a,mid+lift,b],.0035,leafmat[2])
    return obj

def picture(name, file, loc, width, height):
    m=bpy.data.materials.new(name+'_painting'); m.use_nodes=True
    nodes=m.node_tree.nodes; nodes.clear()
    tex=nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(str(file)); tex.image.pack()
    emission=nodes.new('ShaderNodeEmission'); emission.inputs['Strength'].default_value=.8
    output=nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(tex.outputs['Color'],emission.inputs['Color']); m.node_tree.links.new(emission.outputs[0],output.inputs[0])
    bpy.ops.mesh.primitive_plane_add(size=2, location=loc, rotation=(math.pi/2,0,0))
    obj=bpy.context.object; obj.scale=(width/2,height/2,1)
    return finish(obj,name,m)

def lathe(name, loc, profile, mat):
    verts=[]; faces=[]; n=40
    for r,z in profile:
        for k in range(n):
            a=k*math.tau/n; verts.append((loc[0]+r*math.cos(a),loc[1]+r*math.sin(a),loc[2]+z))
    for j in range(len(profile)-1):
        for k in range(n): faces.append((j*n+k,j*n+(k+1)%n,(j+1)*n+(k+1)%n,(j+1)*n+k))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    for p in mesh.polygons:p.use_smooth=True
    return finish(obj,name,mat)

# DESK: generous uninterrupted top, chamfered corners, structural rails.
box('Oak_desktop',(.90,0,1.30),(8.9,2.9,.19),wood,.12)
box('Desk_front_apron',(.55,-1.10,1.12),(7.7,.10,.25),walnut,.02)
for x in [-3.10,4.15]:
    for y in [-1.05,1.05]:
        cylinder('Tapered_desk_leg',(x,y,.03),(x,y,1.23),.11,walnut,.16)

# Monitor faces -Y. Screen center is the camera's handoff target.
rounded_front('Monitor_body',(.55,.48,2.70),(3.32,.22,2.17),aluminum,.15)
rounded_front('Monitor_bezel',(.55,.355,2.81),(3.23,.042,1.84),ink,.12)
rounded_front('ScreenSurface',(.55,.329,2.81),(3.11,.008,1.73),screen,.095)
# The unbroken body itself forms the lower chin.
# Folded, tapered aluminium pedestal, broad at the foot rather than a pole.
verts=[]
for z,y,w in [(1.45,.17,.50),(1.50,.31,.49),(1.68,.48,.41),(1.96,.53,.35)]:
    verts.extend([(.55-w,y-.05,z),(.55+w,y-.05,z),(.55+w,y+.065,z),(.55-w,y+.065,z)])
faces=[(0,3,2,1),(12,13,14,15)]
for i in range(3):
    for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
data=bpy.data.meshes.new('Pedestal');data.from_pydata(verts,[],faces);data.update()
o=bpy.data.objects.new('Monitor_stand',data);bpy.context.collection.objects.link(o);finish(o,'Monitor_stand',aluminum)
mod=o.modifiers.new('Rounded casting','BEVEL');mod.width=.035;mod.segments=5;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=mod.name)

box('Monitor_foot',(.55,.34,1.43),(1.12,.67,.055),aluminum,.07)
sphere('Status_light',(.55,.33,1.73),(.012,.006,.012),rim,12)

sphere('Webcam',(.55,.331,3.701),(.012,.004,.012),graphite)
# Keyboard, individual keys and printed modifiers.
start_prop('Prop_Keyboard',(.60,-.72,1.461),(1.0,.326,.057),1.4)
box('Keyboard_base',(.60,-.72,1.425),(1.95,.63,.07),aluminum,.055)
for row in range(5):
    for col in range(14):
        if row==0 and 4<=col<=9: continue
        x=.60+(col-6.5)*.132; y=-.72+(row-2)*.113
        box('Key', (x,y,1.48),(.115,.094,.034),cream,.012)
box('Spacebar',(.665,-.946,1.48),(.76,.094,.034),cream,.012)
for row in range(1,5):
    for col in range(13):
        x=.60+(col-6.5)*.132; y=-.72+(row-2)*.113
        box('Key_legend',(x,y,1.499),(.019,.007,.001),graphite,.001)
end_prop()
start_prop('Prop_Mouse',(2.12,-.74,1.481),(.19,.28,.087),.15)
sphere('Mouse',(2.12,-.74,1.47),(.18,.27,.095),paper)
curve('Mouse_seam',[(2.12,-.96,1.49),(2.12,-.80,1.564),(2.12,-.70,1.565)],.004,ceramic)

end_prop()
# Drawing pad, pencil, stylus.
start_prop('Prop_Tablet',(-1.95,-.55,1.433),(.91,.53,.038),1.1)
pad=box('Drawing_tablet',(-1.95,-.55,1.425),(1.7,.97,.055),graphite,.07); pad.rotation_euler.z=.07
box('Tablet_active_area',(-1.95,-.59,1.456),(1.43,.73,.003),ink,.035)
end_prop()
start_prop('Prop_Stylus',(-1.81,-.51,1.50),(.33,.31,.025),.05)
cylinder('Stylus',(-2.05,-.76,1.48),(-1.51,-.23,1.49),.021,ink)
cylinder('Stylus_tip',(-2.11,-.81,1.48),(-2.05,-.76,1.48),.002,rim,.019)

end_prop()
# Anglepoise desk lamp, tilted open shade and luminous inner disk.
cylinder('Lamp_base',(2.71,.53,1.41),(2.71,.53,1.49),.30,ink,vertices=40)
cylinder('Lamp_lower_arm',(2.71,.53,1.49),(2.83,.64,2.87),.031,brass)
cylinder('Lamp_upper_arm',(2.83,.64,2.87),(2.45,.47,3.07),.034,ink)
sphere('Lamp_joint',(2.83,.64,2.87),(.067,.067,.067),ink)
shade_axis=Vector((-.10,-.12,-.33)).normalized()
tip=Vector((2.44,.46,3.05)); bottom=tip+shade_axis*.43
shade_profile=[(.38,0),(.37,.045),(.34,.13),(.28,.23),(.19,.31),(.105,.355),(.086,.39)]
shade=lathe('Lamp_shade',(0,0,0),shade_profile,ink)
# Local +Z goes from the open rim to the top of the shade.
shade.location=bottom;shade.rotation_euler=(-shade_axis).to_track_quat('Z','Y').to_euler()
inner=material('Lamp_lining',(.72,.65,.48),.41,.15)
shell=lathe('Lamp_lining',(0,0,0),[(r-.009,z+.002) for r,z in shade_profile],inner)
shell.location=bottom;shell.rotation_euler=shade.rotation_euler
bead=curve('Lamp_rolled_rim',[(.379*math.cos(i*math.tau/64),.379*math.sin(i*math.tau/64),0) for i in range(65)],.008,brass)
bead.location=bottom;bead.rotation_euler=shade.rotation_euler
glow=material('Lamp_inner',(1,.76,.38),.24)
p=glow.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.64,.27,1);p.inputs['Emission Strength'].default_value=5
sphere('Lamp_bulb',bottom-shade_axis*.15,(.09,.09,.10),glow)
# Electrical cable and a small tactile switch.
curve('Lamp_cable',[(2.73,.65,1.42),(3.0,1.1,1.408),(3.28,1.48,1.36),(3.3,1.52,.25)],.012,ink)
box('Lamp_switch',(2.71,.36,1.50),(.10,.13,.015),brass,.015)
# Keep the complete lamp clear of the display, including its slanted rim.
# Translation is applied before material batching and shared by the web lights.
for obj in list(shared.children):
    if obj.name.startswith('Lamp_'): obj.location.x += .55

# A compact walnut studio speaker behind the drawing tablet. Front faces -Y.
speaker=group('StudioSpeaker');speaker.parent=shared;parent=speaker
box('Speaker_cabinet',(-2.02,.67,1.96),(.66,.55,1.08),walnut,.045)
box('Speaker_baffle',(-2.02,.38,1.96),(.59,.045,.98),graphite,.032)
speakerRubber=material('Speaker_rubber',(.018,.018,.019),.9)
speakerCone=material('Speaker_cone',(.065,.066,.062),.96)
for z,r in [(1.77,.205),(2.20,.10)]:
    driver=lathe('Speaker_driver',(0,0,0),[(r,0),(r*.95,.019),(r*.79,.019),(r*.73,-.006),(r*.32,-.056),(.005,-.045)],speakerRubber)
    driver.location=(-2.02,.348,z);driver.rotation_euler.x=math.pi/2
    cylinder('Speaker_dustcap',(-2.02,.335,z),(-2.02,.326,z),r*.28,speakerCone,vertices=40)
for x in [-2.25,-1.79]:
    for z in [1.56,2.35]: cylinder('Speaker_screw',(x,.348,z),(x,.337,z),.016,brass,vertices=16)
cylinder('Speaker_volume',(-1.84,.344,1.58),(-1.84,.313,1.58),.043,aluminum,vertices=32)
speakerLed=material('Speaker_indicator',(.7,.6,.4),.4)
speakerLed.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.5,.39,.23,1)
speakerLed.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.8
sphere('Speaker_LED',(-2.18,.328,1.58),(.012,.005,.012),speakerLed,16)
for x in [-2.26,-1.78]:
    box('Speaker_foot',(x,.67,1.41),(.10,.38,.032),ink,.008)
parent=shared

# Open ceramic cup and handle.
start_prop('Prop_Cup',(2.37,-.08,1.59),(.27,.225,.19),.4)
lathe('Coffee_cup',(2.37,-.08,1.40),[(.12,0),(.18,.04),(.21,.33),(.208,.36),(.18,.36),(.175,.07),(.02,.055)],ceramic)
cylinder('Coffee',(2.37,-.08,1.71),(2.37,-.08,1.714),.178,material('Coffee_surface',(.010,.004,.001),.65),vertices=64)
curve('Cup_handle',[(2.55,-.08,1.69),(2.70,-.08,1.70),(2.72,-.08,1.50),(2.54,-.08,1.49)],.032,ceramic)

end_prop()
# Open sketchbook with ink studies.
start_prop('Prop_Sketchbook',(3.38,-.83,1.458),(.77,.46,.065),.6)
# A continuous curved sheet arches gently away from the stitched gutter.
bookInk=material('Pencil_graphite',(.17,.14,.10),.9)
for side in [-1,1]:
    cx=3.37
    cover=box('Sketchbook_cover',(cx+side*.375,-.83,1.427),(.77,.90,.020),ceramic,.025)
    for layer in range(5):
        verts=[];faces=[]
        for j in range(13):
            t=j/12
            for k in range(9):
                y=-1.25+k*.105
                verts.append((cx+side*(.012+t*.72),y,1.447+layer*.003+math.sin(t*math.pi)*.053+t*.015))
        for j in range(12):
            for k in range(8):
                v=j*9+k;face=(v,v+9,v+10,v+1);faces.append(face if side>0 else face[::-1])
        data=bpy.data.meshes.new('Page');data.from_pydata(verts,[],faces);data.update()
        o=bpy.data.objects.new('Curved_paper',data);bpy.context.collection.objects.link(o);finish(o,'Curved_paper',paper)
        for f in data.polygons:f.use_smooth=True
    # Loose pencil studies of a cup and a small botanical branch.
    def paperz(x):
        t=abs(x-3.37)/.72
        return 1.463+math.sin(t*math.pi)*.053+t*.015
    for j in range(3):
        ccx=cx+side*.36;cy=-.68-j*.13;r=.105+j*.014
        pts=[]
        for k in range(49):
            a=k*math.tau/48;x=ccx+math.cos(a)*r;y=cy+math.sin(a)*r*.42
            pts.append((x,y,paperz(x)+.001))
        curve('Graphite_study',pts,.0016,bookInk)
    for j in range(8):
        x=cx+side*(.18+j*.05);y=-1.13
        curve('Pencil_hatching',[(x,y,paperz(x)),(x+side*.08,y+.05,paperz(x+side*.08))],.0008,bookInk)
curve('Book_thread',[(3.37,-1.25,1.461),(3.37,-.83,1.46),(3.37,-.41,1.461)],.002,cream)
end_prop()
start_prop('Prop_Pencil',(3.91,-.80,1.52),(.10,.34,.025),.05)
cylinder('Pencil',(3.99,-1.11,1.50),(3.83,-.49,1.50),.018,ink,vertices=8)

end_prop()
# Scanned CC0 foliage: author Rico Cilliers / Poly Haven. Real leaf veins,
# surface roughness and the irregular terracotta rim replace generic blades.
start_prop('Prop_Plant',(3.92,.72,2.15),(.32,.32,.75),1.4)
existing=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(SOURCE/'assets/potted_plant_01/plant.gltf'))
imported=set(bpy.data.objects)-existing
meshes=[o for o in imported if o.type=='MESH']
coords=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
lo=Vector([min(v[i] for v in coords) for i in range(3)]);hi=Vector([max(v[i] for v in coords) for i in range(3)])
scale=1.57/(hi.z-lo.z);center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
for o in meshes:
    transform=o.matrix_world.copy()
    for v in o.data.vertices:v.co=(transform@v.co-center)*scale+Vector((3.92,.72,1.40))
    o.parent=parent;o.matrix_world.identity();o.name='Scanned_plant_'+o.name
    for mat in o.data.materials:
        mat.use_backface_culling=False
        for node in mat.node_tree.nodes:
            if node.type=='TEX_IMAGE' and node.image:node.image.pack()
for o in imported:
    if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
end_prop()

# Upright reference books and loose books on the windowsill.
for i in range(4):
    start_prop('Prop_Book_'+str(i),(4.45+i*.15,.76,1.84),(.069,.275,.445),.4)
    m=[material('Book_linen',(.21,.17,.12),.96),ceramic,paper,graphite][i]
    book=box('Reference_book',(4.45+i*.15,.76,1.82+(.04 if i%2 else 0)),(.12,.53,.84+(i%2)*.08),m,.009)
    for z in [1.52,2.1]: box('Book_spine_rule',(4.45+i*.15,.487,z),(.081,.004,.012),brass,.001)

    end_prop()

# INDOOR ENVIRONMENT. Front-facing wall with physical window on the left.
parent=indoor
box('Back_wall',(4.215,1.88,4.5),(15.57,.15,9),plaster,.0)
box('Left_wall',(-10,1.9,4.5),(.14,6.0,9),plaster,.0)
box('Window_left_wall',(-8.27,1.88,4.5),(3.46,.15,9),plaster,0)
box('Above_window',(-5.03,1.88,7.58),(2.92,.15,2.84),plaster,0)
box('Below_window',(-5.03,1.88,.62),(2.92,.15,1.24),plaster,0)
box('Floor',(0,-.2,-.08),(16,16,.16),walnut,.0)
# Floorboard divisions come from the scanned surface map.
box('Wall_baseboard',(.0,1.72,.16),(13,.06,.22),walnut,.01)
# Opening occupies left gap alongside the wall, framed in oak.
# The browser uses the photographed city dusk HDR outside the physical window.
for x in [-6.40,-3.66]: box('Window_jamb',(x,1.63,3.72),(.18,.28,4.88),walnut,.02)
box('Window_mullion',(-5.04,1.55,3.72),(.050,.09,4.88),ink,.005)
for z in [1.35,4.26,6.12]: box('Window_crossbar',(-5.03,1.55,z),(2.74,.09,.06),ink,.006)
box('Window_sill',(-5.03,1.40,1.28),(3.02,.75,.13),wood,.04)
for i in range(4):
    b=box('Windowsill_book',(-4.12+(i%2)*.06,1.23,1.4+i*.09),(.73,.43,.075),[paper,graphite,ceramic,paper][i],.009)
    b.rotation_euler.z=(i-1)*.045

# Named anchors: exported with scene for reproducible runtime camera placement.
parent=None
for name,pos in [('CameraStart',(0,-8.6,4.1)),('CameraLook',(.2,.25,2.55)),('ScreenTarget',(.55,.32,2.81))]:
    o=group(name);o.location=pos

# Useful native Blender preview. Web lighting is configured independently.
bpy.ops.object.camera_add(location=(0,-8.6,4.1))
cam=bpy.context.object;cam.name='Studio_camera';cam.rotation_euler=(Vector((.2,.25,2.55))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=31.8
bpy.context.scene.camera=cam
for name,loc,target,energy,size,color in [
 ('Window_softbox',(-4.5,-.2,4.1),(0,0,1.5),600,3,(.69,.80,1)),
 ('Front_bounce',(-.5,-5.5,4.5),(1,0,2),220,5,(1,.89,.73)),
 ('Lamp_light',(2.30,.42,2.58),(2.9,-.25,1.38),75,.30,(1,.61,.28))]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name
    light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.data.color=color
    light.rotation_euler=(Vector(target)-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.16,.18,.22,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.18
scene.view_settings.view_transform='AgX'
# Keep a fully editable native source with individual keys, leaves and props.

bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'studio.blend'))

# Merge by material within each environment for a small browser draw-call count.
# Screen and camera anchors remain independent. Native source above is untouched.
for root in [shared,indoor,speaker,*props]:
    buckets={}
    for obj in list(root.children):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH');obj=bpy.context.object
        if obj.type!='MESH' or obj.name=='ScreenSurface' or obj.name.startswith('Lamp_'):continue
        key=obj.data.materials[0].name if obj.data.materials else 'Default'
        buckets.setdefault(key,[]).append(obj)
    for mat,objects in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        objects[0].name=root.name+'_'+mat
bpy.ops.object.select_all(action='DESELECT')
for o in list(bpy.data.objects):
    if o.type in {'MESH','CURVE','EMPTY'}: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(SOURCE/'studio-raw.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
manifest={'generator':'tools/build_office.py','blender':bpy.app.version_string,'units':'metres','groups':['SharedDesk','StudioInterior'],'screenSize':[3.11,1.73],'anchors':['CameraStart','CameraLook','ScreenTarget'],'textures':'Poly Haven CC0: wood_table_large, potted_plant_01, studio_small_09, sunset_jhbcentral','props':[p.name for p in props],'meshCount':sum(o.type=='MESH' for o in bpy.data.objects)}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
print('OFFICE_MODEL_READY', manifest)
