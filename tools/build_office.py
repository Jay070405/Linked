"""Reproducible, original studio model. Run with Blender --background --python.

Blender coordinates: X right, Y into room, Z up. GLB converts to Y-up.
No downloaded meshes or generated third-party geometry are used.
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
garden = group('FantasyGarden')
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

wood = painted('Honey_oak', (.43,.26,.135), True)
walnut = painted('Walnut', (.20,.12,.071), True)
plaster = painted('Forest_plaster', (.083,.125,.116))
ink = material('Ink', (.018,.022,.024))
graphite = material('Graphite', (.052,.062,.066))
aluminum = material('Champagne_aluminium', (.50,.40,.29), .45, .28)
rim = material('Warm_edge', (.65,.55,.40), .46, .18)
screen = material('Screen_off', (.003,.004,.005), 1)
paper = painted('Ivory_paper', (.81,.77,.65))
ceramic = painted('Clay', (.44,.30,.19))
cream = material('Key_caps', (.63,.61,.53))
leafmat = [material('Leaf_'+str(i), c) for i,c in enumerate([(.14,.22,.12),(.22,.30,.15),(.31,.36,.18),(.10,.17,.11)])]
petal = material('Petal', (.65,.32,.42))
twig = material('Branch', (.13,.09,.07))
brass = material('Brass', (.45,.30,.12), .55, .3)

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
        mod = obj.modifiers.new('Soft machined edges', 'BEVEL'); mod.width = bevel; mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        mod = obj.modifiers.new('Face normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj,name,mat)

def sphere(name, loc, size, mat, segments=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=10, radius=1, location=loc)
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
    return finish(obj,name,mat)

def cylinder(name, a, b, radius, mat, r2=None, vertices=20):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius, radius2=radius if r2 is None else r2, depth=d.length, location=(a+b)*.5)
    obj=bpy.context.object; obj.rotation_euler=d.to_track_quat('Z','Y').to_euler()
    for p in obj.data.polygons: p.use_smooth=True
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

# DESK: generous uninterrupted top, chamfered corners, structural rails.
box('Oak_desktop',(.55,0,1.30),(8.2,2.9,.19),wood,.12)
box('Desk_front_apron',(.55,-1.10,1.12),(7.7,.10,.25),walnut,.02)
for x in [-3.10,4.15]:
    for y in [-1.05,1.05]:
        cylinder('Tapered_desk_leg',(x,y,.03),(x,y,1.23),.11,walnut,.16)

# Monitor faces -Y. Screen center is the camera's handoff target.
rounded_front('Monitor_body',(.55,.48,2.70),(3.32,.22,2.17),aluminum,.15)
rounded_front('Monitor_bezel',(.55,.355,2.81),(3.23,.042,1.84),ink,.12)
rounded_front('ScreenSurface',(.55,.329,2.81),(3.11,.008,1.73),screen,.095)
box('Monitor_lower_chin',(.55,.347,1.73),(3.04,.017,.20),aluminum,.015)
cylinder('Monitor_stand',(.55,.58,1.42),(.55,.54,1.91),.105,aluminum,.18)
box('Monitor_foot',(.55,.34,1.43),(1.12,.67,.055),aluminum,.07)
sphere('Status_light',(.55,.33,1.73),(.012,.006,.012),rim,12)

# Keyboard, individual keys and printed modifiers.
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
sphere('Mouse',(2.12,-.74,1.47),(.18,.27,.095),paper)
curve('Mouse_seam',[(2.12,-.96,1.49),(2.12,-.80,1.564),(2.12,-.70,1.565)],.004,ceramic)

# Drawing pad, pencil, stylus.
pad=box('Drawing_tablet',(-1.95,-.55,1.425),(1.7,.97,.055),graphite,.07); pad.rotation_euler.z=.07
box('Tablet_active_area',(-1.95,-.59,1.456),(1.43,.73,.003),ink,.035)
cylinder('Stylus',(-2.05,-.76,1.48),(-1.51,-.23,1.49),.021,ink)
cylinder('Stylus_tip',(-2.11,-.81,1.48),(-2.05,-.76,1.48),.002,rim,.019)

# Anglepoise desk lamp, tilted open shade and luminous inner disk.
cylinder('Lamp_base',(2.71,.53,1.41),(2.71,.53,1.49),.30,ink,vertices=40)
cylinder('Lamp_lower_arm',(2.71,.53,1.49),(2.83,.64,2.87),.031,brass)
cylinder('Lamp_upper_arm',(2.83,.64,2.87),(2.45,.47,3.07),.034,ink)
sphere('Lamp_joint',(2.83,.64,2.87),(.067,.067,.067),ink)
shade_axis=Vector((-.10,-.025,-.35)).normalized()
tip=Vector((2.44,.46,3.05)); bottom=tip+shade_axis*.43
cylinder('Lamp_shade',bottom,tip,.38,ink,.095,40)
glow=material('Lamp_inner',(.96,.78,.43)); p=glow.node_tree.nodes.get('Principled BSDF')
p.inputs['Emission Color'].default_value=(1,.74,.36,1);p.inputs['Emission Strength'].default_value=1
cylinder('Lamp_diffuser',bottom-shade_axis*.002,bottom+shade_axis*.006,.348,glow,vertices=40)

# Open ceramic cup and handle.
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
lathe('Coffee_cup',(2.37,-.08,1.40),[(.12,0),(.18,.04),(.21,.33),(.208,.36),(.18,.36),(.175,.07),(.02,.055)],ceramic)
cylinder('Coffee',(2.37,-.08,1.71),(2.37,-.08,1.714),.178,walnut,vertices=40)
curve('Cup_handle',[(2.55,-.08,1.69),(2.70,-.08,1.70),(2.72,-.08,1.50),(2.54,-.08,1.49)],.032,ceramic)

# Open sketchbook with ink studies.
for x,angle in [(3.02,-.08),(3.73,.08)]:
    obj=box('Sketchbook_cover',(x,-.83,1.42),(.76,.89,.025),walnut,.02);obj.rotation_euler.y=angle
    obj=box('Sketchbook_pages',(x,-.83,1.445),(.72,.85,.029),paper,.012);obj.rotation_euler.y=angle
curve('Book_spine',[(3.37,-1.25,1.475),(3.37,-.8,1.448),(3.37,-.41,1.475)],.006,ceramic)
for cx,cy,r in [(2.98,-.73,.13),(3.1,-1.04,.11),(3.70,-.78,.16)]:
    pts=[(cx+math.cos(i*math.tau/20)*r,cy+math.sin(i*math.tau/20)*r*.7,1.494) for i in range(21)]
    curve('Pencil_study',pts,.0028,ceramic)
cylinder('Pencil',(3.99,-1.11,1.50),(3.83,-.49,1.50),.018,ink,vertices=8)

# Plant: multiple curved stems, folded leaves; no spherical foliage clumps.
lathe('Plant_pot',(3.92,.72,1.40),[(.21,0),(.26,.05),(.33,.51),(.34,.55),(.29,.55),(.27,.40)],ceramic)
cylinder('Pot_soil',(3.92,.72,1.87),(3.92,.72,1.90),.282,walnut)
for branch in range(5):
    a=branch*2.3
    end=Vector((3.92+math.cos(a)*.40,.72+math.sin(a)*.27,2.9+random.random()*.45))
    start=Vector((3.92,.72,1.87)); mid=start.lerp(end,.48)+Vector((.08,0,0))
    curve('Plant_stem',[start,mid,end],.012,twig)
    for i in range(3):
        p=start.lerp(end,.43+i*.24)
        d=Vector((math.cos(a+i*2.1)*.38,math.sin(a+i*2.1)*.27,.10))
        leaf('Plant_leaf',p,p+d,.11,leafmat[(branch+i)%4])

# Upright reference books and loose books on the windowsill.
for i in range(4):
    m=[walnut,ceramic,paper,graphite][i]
    book=box('Reference_book',(4.64+i*.14,.76,1.82+(.04 if i%2 else 0)),(.12,.53,.84+(i%2)*.08),m,.009)
    for z in [1.52,2.1]: box('Book_spine_rule',(4.64+i*.14,.487,z),(.081,.004,.012),brass,.001)

# INDOOR ENVIRONMENT. Front-facing wall with physical window on the left.
parent=indoor
box('Back_wall',(1.4,1.88,4.5),(10.8,.15,9),plaster,.0)
box('Left_wall',(-5.7,0,4.5),(.14,4.0,9),plaster,.0)
box('Above_window',(-4.9,1.88,7.44),(2.5,.15,3.12),plaster,0)
box('Floor',(0,-.2,-.08),(16,16,.16),walnut,.0)
for i in range(-12,13):
    box('Floorboard_seam',(i*.55,-2,.004),(.009,11,.003),ink,0)
box('Wall_baseboard',(.0,1.72,.16),(13,.06,.22),walnut,.01)
# Opening occupies left gap alongside the wall, framed in oak.
picture('Window_landscape', ROOT/'app/public/assets/world-tree.png',(-4.86,3.25,3.08),10.5,5.9)
for x in [-6.12,-3.62]: box('Window_jamb',(x,1.63,3.05),(.17,.28,5.8),walnut,.02)
for x in [-5.31,-4.48]: box('Window_mullion',(x,1.50,3.15),(.065,.09,5.8),ink,.005)
for z in [1.35,4.20,5.84]: box('Window_crossbar',(-4.88,1.51,z),(2.6,.09,.07),ink,.006)
box('Window_sill',(-4.86,1.40,1.28),(2.8,.75,.13),wood,.04)
for i in range(4):
    b=box('Windowsill_book',(-4.45+(i%2)*.06,1.23,1.4+i*.09),(.73,.43,.075),[paper,graphite,ceramic,paper][i],.009)
    b.rotation_euler.z=(i-1)*.045

# Alternate world: own original artwork is a distant painted cyclorama.
parent=garden
picture('Garden_painting',ROOT/'app/public/assets/world-tree.png',(0,7.7,4.1),28,15.75)
gardenfloor=material('Garden_ground',(.12,.18,.14))
box('Garden_floor',(0,1,-.04),(20,22,.06),gardenfloor,0)
for x,y,z,s in [(-4.3,3.6,0,1),(5.2,3.7,0,1.1)]:
    curve('Garden_trunk',[(x,y,0),(x-.2,y,2.8),(x+.2,y,5.9)],.20,twig)
    for j in range(5):
        a=j*1.7; p=Vector((x,y,3+j*.6));e=p+Vector((math.cos(a)*2.0,-.3,1.0))
        curve('Garden_branch',[p,p.lerp(e,.6)+Vector((0,0,.2)),e],.055,twig)
        for k in range(6):
            center=p.lerp(e,.4+k*.1)+Vector((random.uniform(-.25,.25),random.uniform(-.2,.2),random.uniform(-.1,.2)))
            for n in range(5):
                a=n*math.tau/5
                leaf('Sakura_petal',center,center+Vector((math.cos(a)*.18,-.015,math.sin(a)*.18)),.066,petal)
for i in range(28):
    x=random.choice([-1,1])*random.uniform(3.8,6);y=random.uniform(.8,5)
    leaf('Garden_grass',(x,y,0),(x+random.uniform(-.2,.2),y,random.uniform(.15,.55)),.035,leafmat[i%4])

# Named anchors: exported with scene for reproducible runtime camera placement.
parent=None
for name,pos in [('CameraStart',(0,-8.6,4.1)),('CameraLook',(.2,.25,2.55)),('ScreenTarget',(.55,.32,2.81))]:
    o=group(name);o.location=pos

# Useful native Blender preview. Web lighting is configured independently.
bpy.ops.object.camera_add(location=(0,-8.6,4.1))
cam=bpy.context.object;cam.name='Studio_camera';cam.rotation_euler=(Vector((.2,.25,2.55))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=44
bpy.context.scene.camera=cam
for name,loc,energy,size,color in [('Window_softbox',(-4,-3,6),800,5,(.69,.79,1)),('Warm_lamp',(3,-1,4),550,3,(1,.73,.46))]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name
    light.data.energy=energy;light.data.shape='DISK';light.data.size=size;light.data.color=color
    light.rotation_euler=(Vector((0,0,1.5))-light.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.13,.13,.13)
# Keep a fully editable native source with individual keys, leaves and props.
for o in garden.children_recursive:o.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'studio.blend'))
for o in garden.children_recursive:o.hide_render=False
# Merge by material within each environment for a small browser draw-call count.
# Screen and camera anchors remain independent. Native source above is untouched.
for root in [shared,indoor,garden]:
    buckets={}
    for obj in list(root.children_recursive):
        if obj.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH');obj=bpy.context.object
        if obj.type!='MESH' or obj.name=='ScreenSurface':continue
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
manifest={'generator':'tools/build_office.py','blender':bpy.app.version_string,'units':'metres','groups':['SharedDesk','StudioInterior','FantasyGarden'],'screenSize':[3.11,1.73],'anchors':['CameraStart','CameraLook','ScreenTarget'],'sourceArtwork':'Existing original portfolio artwork: world-tree.png','meshCount':sum(o.type=='MESH' for o in bpy.data.objects)}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('OFFICE_MODEL_READY', manifest)
