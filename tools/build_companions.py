"""Author the supplied models in Blender; preserve an editable resting cat rig.

Run with Blender --background --python tools/build_companions.py.
Source files stay untouched. Blender uses Z-up and forward -Y.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'design/office3d/companions'
SOURCE.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def imported(path,name):
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=path)
 meshes=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
 obj=meshes[0];obj.parent=None;obj.name=name
 bpy.context.view_layer.objects.active=obj
 bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 for other in list(set(bpy.data.objects)-before):
  if other.type=='EMPTY':bpy.data.objects.remove(other,do_unlink=True)
 for mat in obj.data.materials:
  mat.name=name+'_fabric'
  p=mat.node_tree.nodes.get('Principled BSDF')
  p.inputs['Roughness'].default_value=.9
  p.inputs['Metallic'].default_value=0
 return obj

cat=imported('E:/工作/建模/homepage model/cute fluffy kitten 3d model.glb','Kitten_Fur')
arm=bpy.data.armatures.new('Kitten_Skeleton');rig=bpy.data.objects.new('WindowKitten',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;cat.select_set(False);rig.select_set(True);rig.show_in_front=True
bpy.ops.object.mode_set(mode='EDIT')
def bone(name,a,b,parent=None):
 part=arm.edit_bones.new(name);part.head=a;part.tail=b
 if parent:part.parent=arm.edit_bones[parent]
 return part
bone('Root',(0,0,0),(0,0,.12))
bone('Body',(0,.12,.32),(0,-.06,.35),'Root')
bone('Chest',(0,-.06,.35),(0,-.23,.37),'Body')
bone('Neck',(0,-.24,.34),(0,-.30,.43),'Chest')
bone('Head',(0,-.30,.41),(0,-.30,.64),'Neck')
bone('TailBase',(0,.255,.36),(0,.35,.57),'Body')
bone('TailTip',(0,.35,.57),(0,.34,.79),'TailBase')
for side,x in [('L',.108),('R',-.108)]:
 fore_y=-.335 if side=='L' else -.285
 hind_y=.005 if side=='L' else .135
 bone('ForeUpper.'+side,(x,fore_y+.07,.30),(x,fore_y+.035,.16),'Chest')
 bone('ForeLower.'+side,(x,fore_y+.035,.16),(x,fore_y,.04),'ForeUpper.'+side)
 bone('ForePaw.'+side,(x,fore_y,.04),(x,fore_y-.08,.04),'ForeLower.'+side)
 bone('HindUpper.'+side,(x,.18,.34),(x,hind_y+.065,.17),'Body')
 bone('HindLower.'+side,(x,hind_y+.065,.17),(x,hind_y,.04),'HindUpper.'+side)
 bone('HindPaw.'+side,(x,hind_y,.04),(x,hind_y-.07,.04),'HindLower.'+side)
bpy.ops.object.mode_set(mode='OBJECT')

def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
groups={b.name:cat.vertex_groups.new(name=b.name) for b in arm.bones}
# Anatomical masks keep the long fur and whiskers attached to their region.
# Every vertex has normalized weights; no heat-solver islands are left behind.
for vertex in cat.data.vertices:
 x,y,z=vertex.co
 weights={}
 tail=smooth(-.04,.08,y)*smooth(.34,.44,z)
 head=(1-smooth(-.24,-.12,y))*smooth(.31,.45,z)
 fore=(1-smooth(-.18,-.115,y))*(1-smooth(.19,.29,z))
 hind=smooth(-.15,-.09,y)*(1-smooth(.21,.33,z))
 leg=max(fore,hind)*(1-tail)*(1-head)
 if tail>.001:
  tip=smooth(.48,.66,z);weights['TailBase']=tail*(1-tip);weights['TailTip']=tail*tip
 remainder=1-tail
 if head>.001:
  amount=head*remainder;neck=1-smooth(.34,.43,z)
  weights['Head']=amount*(1-neck*.6);weights['Neck']=amount*neck*.6;remainder-=amount
 if leg>.001:
  side='L' if x>0 else 'R';part='Fore' if fore>hind else 'Hind'
  amount=min(remainder,leg);paw=1-smooth(.055,.10,z);upper=smooth(.13,.235,z)
  weights[part+'Paw.'+side]=amount*paw
  weights[part+'Upper.'+side]=amount*(1-paw)*upper
  weights[part+'Lower.'+side]=amount*(1-paw)*(1-upper);remainder-=amount
 chest=1-smooth(-.20,.04,y)
 weights['Chest']=remainder*chest;weights['Body']=remainder*(1-chest)
 weights=dict(sorted(((k,w) for k,w in weights.items() if w>.001),key=lambda p:-p[1])[:4]);total=sum(weights.values())
 for name,weight in weights.items():groups[name].add([vertex.index],weight/total,'REPLACE')
modifier=cat.modifiers.new('Kitten skin','ARMATURE');modifier.object=rig;cat.parent=rig
for b in rig.pose.bones:b.rotation_mode='XYZ'
# Place joints in armature space, independent of each edit bone's local roll.
drop=Vector((0,0,-.18))
rig.pose.bones['Root'].matrix=Matrix.Translation(drop)@arm.bones['Root'].matrix_local
bpy.context.view_layer.update()
def place(name,head,tail):
 rest=arm.bones[name]
 delta=(rest.tail_local-rest.head_local).rotation_difference(tail-head)
 rig.pose.bones[name].matrix=Matrix.Translation(head)@delta.to_matrix().to_4x4()@rest.matrix_local.to_3x3().to_4x4()
 bpy.context.view_layer.update()
for side,x in [('L',.108),('R',-.108)]:
 for part,foot in [('Fore',Vector((x,-.465 if side=='L' else -.42,.04))),('Hind',Vector((x,.13 if side=='L' else .245,.04)))]:
  upper=arm.bones[part+'Upper.'+side];lower=arm.bones[part+'Lower.'+side]
  shoulder=upper.head_local+drop;delta=foot-shoulder;distance=delta.length;direction=delta.normalized()
  along=(upper.length**2-lower.length**2+distance**2)/(2*distance)
  across=math.sqrt(max(0,upper.length**2-along**2))
  bend=(direction.cross(Vector((1,0,0))) if part=='Fore' else Vector((1,0,0)).cross(direction)).normalized()
  knee=shoulder+direction*along+bend*across
  place(part+'Upper.'+side,shoulder,knee);place(part+'Lower.'+side,knee,foot)
  paw=arm.bones[part+'Paw.'+side]
  place(part+'Paw.'+side,foot,foot+paw.tail_local-paw.head_local)
tail_start=arm.bones['TailBase'].head_local+drop
tail_mid=tail_start+Vector((-.15,.17,.035)).normalized()*arm.bones['TailBase'].length
tail_end=tail_mid+Vector((-.17,-.13,-.03)).normalized()*arm.bones['TailTip'].length
place('TailBase',tail_start,tail_mid);place('TailTip',tail_mid,tail_end)
# Bind in the authored resting pose. Compress the underside's fur against the
# sill, a contact corrective, while preserving all 19 editable deform bones.
bpy.context.view_layer.objects.active=cat
bpy.ops.object.modifier_apply(modifier=modifier.name)
for vertex in cat.data.vertices:
 vertex.co.z=max(.003,vertex.co.z)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='POSE');bpy.ops.pose.armature_apply(selected=False);bpy.ops.object.mode_set(mode='OBJECT')
modifier=cat.modifiers.new('Kitten skin','ARMATURE');modifier.object=rig
bpy.context.view_layer.update()
rig['role']='Resting windowsill kitten; Head and Neck support pointer tracking'
rig['source']='cute fluffy kitten 3d model.glb'

# Keep a separate, optimized doll asset with a clean floor origin.
doll=imported('E:/工作/建模/homepage model/plush doll 3d model.glb','PlushDoll')
doll['source']='plush doll 3d model.glb';doll.hide_render=True;doll.hide_set(True)
for image in bpy.data.images:
 if image.source=='FILE':image.pack()

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Companion studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.55,.55,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
for pos,power in [((2,-3,4),600),((-3,-1,2),350)]:
 data=bpy.data.lights.new('Softbox','AREA');data.energy=power;data.size=3
 light=bpy.data.objects.new('Softbox',data);scene.collection.objects.link(light);light.location=pos;light.rotation_euler=(Vector((0,0,.3))-light.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Preview');cam=bpy.data.objects.new('Preview',data);scene.collection.objects.link(cam);scene.camera=cam;data.type='ORTHO';data.ortho_scale=1.65
cam.location=(2,-3,1.4);cam.rotation_euler=(Vector((0,0,.22))-cam.location).to_track_quat('-Z','Y').to_euler()
# A preview floor makes support/contact visible but is excluded from exports.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,0));floor=bpy.context.object;floor.name='Preview_floor'
floor_mat=bpy.data.materials.new('Preview floor');floor_mat.diffuse_color=(.22,.23,.24,1);floor.data.materials.append(floor_mat)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'kitten-rig.blend'))
for label,direction in [('front',(0,-3,.8)),('side',(3,0,1)),('three-quarter',(2,-3,1.4))]:
 cam.location=direction;cam.rotation_euler=(Vector((0,0,.22))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(SOURCE/f'kitten-rest-{label}.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='DESELECT');cat.select_set(True);rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(SOURCE/'kitten-raw.glb'),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=True,export_skins=True,export_extras=True,export_yup=True)
cat.hide_set(True);rig.hide_set(True);doll.hide_set(False);doll.hide_render=False
bpy.ops.object.select_all(action='DESELECT');doll.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(SOURCE/'doll-raw.glb'),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
print('COMPANIONS_READY',len(arm.bones),'bones;',len(cat.data.vertices),'weighted kitten vertices')
