// The film's reflections, made once in the browser the way scene.js used to make them at every load: three's room
// environment, prefiltered (PMREM) at 128 px a side. datahall-bake-env.mjs runs this in Chrome through the dev server
// and stores the result as src/pages/data-hall/room-env.bin. (Served by Vite as a module, so 'three' is the app's copy)
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function bake() {
  const renderer = new THREE.WebGLRenderer({canvas: document.createElement('canvas')});
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, {size: 128});
  const {width, height} = target, data = new Uint16Array(width * height * 4);
  renderer.readRenderTargetPixels(target, 0, 0, width, height, data);
  // (base64 in pieces: the whole buffer is too big for one call)
  const bytes = new Uint8Array(data.buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  pmrem.dispose(); target.dispose(); renderer.dispose();
  return {width, height, revision: THREE.REVISION, data: btoa(s)};
}
