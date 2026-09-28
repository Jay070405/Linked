import { Group, Quaternion, Vector2, Vector3, MathUtils } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const COMPANION_PLACEMENT = {
  doll: { position: [-2.94, 1.398, -.67], scale: .8, yaw: -.08 },
  kitten: { position: [-4.40, 1.348, -1.36], scale: 1.08, yaw: Math.PI * .36 },
};

export function gazeTarget(pointer, active) {
  return new Vector2(-.55 + (active ? MathUtils.clamp(pointer.x, -1, 1) * .46 : 0),
    -.035 - (active ? MathUtils.clamp(pointer.y, -1, 1) * .22 : 0));
}

export function createKittenGaze(root) {
  root.updateMatrixWorld(true);
  const head = root.getObjectByName('Head'), neck = root.getObjectByName('Neck');
  if (!head?.isBone || !neck?.isBone) throw new Error('Kitten requires the authored Head / Neck skin bones');
  const bodyRight = new Vector3(1, 0, 0).applyQuaternion(root.quaternion);
  const bones = [[neck, .18], [head, .82]].map(([bone, share]) => {
    const inverse = bone.getWorldQuaternion(new Quaternion()).invert();
    return { bone, share, rest: bone.quaternion.clone(), up: new Vector3(0, 1, 0).applyQuaternion(inverse), right: bodyRight.clone().applyQuaternion(inverse) };
  });
  const angles = gazeTarget({ x: 0, y: 0 }, false), yaw = new Quaternion(), pitch = new Quaternion();
  const apply = () => bones.forEach(({ bone, rest, up, right, share }) => {
    yaw.setFromAxisAngle(up, angles.x * share); pitch.setFromAxisAngle(right, angles.y * share);
    bone.quaternion.copy(rest).multiply(yaw).multiply(pitch);
  });
  apply();
  return {
    angles,
    head,
    update(pointer, active, dt) {
      const target = gazeTarget(pointer, active);
      angles.lerp(target, 1 - Math.exp(-Math.min(Math.max(dt, 0), .08) * 8));
      const moving = angles.distanceToSquared(target) > .000001;
      if (!moving) angles.copy(target);
      apply();
      return moving;
    },
  };
}

export async function loadCompanions() {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const root = new Group(); root.name = 'OfficeCompanions';
  const results = await Promise.allSettled([
    loader.loadAsync('/assets/office3d/plush-doll.glb'),
    loader.loadAsync('/assets/office3d/kitten.glb'),
  ]);
  let doll, kitten, gaze;
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') { console.warn('Office companion could not load', result.reason); return; }
    const model = result.value.scene, place = COMPANION_PLACEMENT[index === 0 ? 'doll' : 'kitten'];
    model.name = index === 0 ? 'DeskPlushDoll' : 'WindowsillKitten';
    model.position.fromArray(place.position); model.scale.setScalar(place.scale); model.rotation.y = place.yaw;
    model.traverse(mesh => {
      if (!mesh.isMesh) return;
      mesh.castShadow = true; mesh.receiveShadow = true;
      if (mesh.isSkinnedMesh) mesh.frustumCulled = false;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => { material.roughness = .9; material.envMapIntensity = .35; });
    });
    root.add(model);
    if (index === 0) doll = model;
    else { kitten = model; gaze = createKittenGaze(model); }
  });
  return { root, doll, kitten, gaze };
}
