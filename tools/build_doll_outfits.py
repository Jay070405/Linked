"""Render wardrobe previews and normalize the supplied cat-ear outfit for the web.

Run with Blender --background --python tools/build_doll_outfits.py.
Original user files are never modified.
"""
import bpy, bmesh, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/public/assets/office3d'
SOURCE = ROOT / 'design/office3d/companions'
for name, source, band in [
    ('classic', 'E:/工作/建模/homepage model/plush doll 3d model.glb', None),
    ('cat-ear', 'C:/Users/shiji/Downloads/cat-ear plush doll 3d model.glb', (2/3,1.01)),
    ('beret', 'C:/Users/shiji/Downloads/cat-ear plush doll 3d model.glb', (1/3,2/3)),
    ('bunny', 'C:/Users/shiji/Downloads/cat-ear plush doll 3d model.glb', (-.01,1/3)),
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for obj in meshes:
        world = obj.matrix_world.copy();obj.parent = None
        for vertex in obj.data.vertices: vertex.co = world @ vertex.co
        obj.matrix_world.identity()
        if band:
            # The supplied GLB has three complete dolls stacked vertically in
            # one mesh. Split in the empty gaps, preserving their UVs/material.
            bm = bmesh.new();bm.from_mesh(obj.data)
            rejected = [v for v in bm.verts if not band[0] <= v.co.z < band[1]]
            rejected_set = set(rejected)
            crossing = [edge for edge in bm.edges if (edge.verts[0] in rejected_set) != (edge.verts[1] in rejected_set)]
            if crossing: raise RuntimeError('Outfit split would cut connected geometry')
            bmesh.ops.delete(bm, geom=rejected, context='VERTS')
            bm.to_mesh(obj.data);bm.free();obj.data.update()
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
    lo = Vector([min(p[i] for p in points) for i in range(3)])
    hi = Vector([max(p[i] for p in points) for i in range(3)])
    print('DOLL_SOURCE', name, json.dumps({'min': list(lo), 'max': list(hi), 'meshes': len(meshes), 'vertices': sum(len(o.data.vertices) for o in meshes)}))
    offset = Vector(((lo.x+hi.x)/2, (lo.y+hi.y)/2, lo.z))
    for obj in meshes:
        world = obj.matrix_world.copy()
        obj.parent = None
        for vertex in obj.data.vertices:
            vertex.co = (world @ vertex.co - offset) / (hi.z-lo.z)
        obj.matrix_world.identity()
        obj.name = 'Plush_' + name
        for material in obj.data.materials:
            shader = material.node_tree.nodes.get('Principled BSDF')
            shader.inputs['Roughness'].default_value = .9
            shader.inputs['Metallic'].default_value = 0
    if band:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in meshes: obj.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(SOURCE/f'{name}-doll-raw.glb'), export_format='GLB', use_selection=True, export_animations=False)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 432
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.world = bpy.data.worlds.new('Wardrobe studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.6,.6,.6,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .6
    target = Vector((0,0,.5))
    for pos,power in [((2,-3,4),650),((-3,-1,2),350)]:
        data = bpy.data.lights.new('Softbox','AREA')
        data.energy = power;data.size = 3
        light = bpy.data.objects.new('Softbox',data);scene.collection.objects.link(light)
        light.location = pos;light.rotation_euler = (target-light.location).to_track_quat('-Z','Y').to_euler()
    data = bpy.data.cameras.new('Outfit preview')
    cam = bpy.data.objects.new('Outfit preview',data);scene.collection.objects.link(cam);scene.camera = cam
    data.type = 'ORTHO';data.ortho_scale = 1.22
    cam.location = (0,-3,.82);cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(OUT/f'doll-{name}-preview.png')
    bpy.ops.render.render(write_still=True)
