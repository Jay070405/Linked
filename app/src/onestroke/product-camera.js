import {Vector3} from 'three';
import {createScrollCameraTrack} from './camera-track.js';

// Interpolate the viewing direction and radius around the moving look point.
// A Cartesian chord between two orbit positions would cut close to the object.
export function createProductCameraTrack(keys) {
  const orbit=createScrollCameraTrack(keys.map(k=>({...k,pos:k.pos.clone().sub(k.look)})));
  const radius=createScrollCameraTrack(keys.map(k=>({...k,pos:new Vector3(k.pos.distanceTo(k.look),0,0)})));
  const distance=new Vector3(),unused=new Vector3();
  return (s,pos,look)=>{
    orbit(s,pos,look);radius(s,distance,unused);
    pos.normalize().multiplyScalar(distance.x).add(look);
  };
}
