import {Vector3} from 'three';
import {fixture,cameraAt,loaded,objectArea,screen} from './product-test-fixture.mjs';
import {toScroll,toJourney} from './pacing.js';
import {ARDEN_CONTENT_BOUNDS} from './product-layout.js';

export const HANDOVERS=[[18.05,18.55],[20.1,20.65],[22.55,23],[24.65,25.1]];
// Offline clock, neutral pointer, loaded assets. Track matching object corners
// only while the object is visible in both samples; do not count its appearance
// as motion. Retain offscreen corners of a partially visible object.
export async function motionProxy() {
  const f=fixture();
  try {
    await loaded(f);const keys=f.hold(3),results=[];
    for(const [i,[start,end]] of HANDOVERS.entries()) {
      let previous;const displacements=[];
      for(let r=toScroll(start);r<=toScroll(end)+1e-9;r+=1/9) {
        const s=toJourney(r);cameraAt(f,keys,s);f.product.update(s,f.frame);f.scene.updateMatrixWorld(true);
        const current=new Map();
        for(const station of [i,i+1]) {
          if(objectArea(f,station)<=0)continue;
          let corners;
          if(station===4)corners=[[308,309],[409,309],[409,359],[308,359]].map(f.product.layout.world);
          else {
            const mesh=f.scene.children[station].children[0],u=mesh.material.uniforms;
            const [x0,y0,x1,y1]=station===3?ARDEN_CONTENT_BOUNDS:[0,0,1,1];
            corners=[[x0,y0],[x1,y0],[x1,Math.min(y1,u.reveal.value)],[x0,Math.min(y1,u.reveal.value)]].map(([x,y])=>new Vector3((x-.5)*u.size.value.x,(.5-y)*u.size.value.y,0).applyMatrix4(mesh.matrixWorld));
          }
          current.set(station,corners.map(p=>screen(p,f.frame.cam,1440)));
        }
        if(previous) {
          const distances=[];
          for(const [station,corners] of current)if(previous.has(station))corners.forEach((p,j)=>distances.push(Math.hypot(p[0]-previous.get(station)[j][0],p[1]-previous.get(station)[j][1])));
          if(distances.length)displacements.push(Math.max(...distances));
        }
        previous=current;
      }
      displacements.sort((a,b)=>a-b);
      results.push({window:[start,end],samples:displacements.length,p90:displacements[Math.ceil(.9*displacements.length)-1],max:displacements.at(-1)});
    }
    return results;
  } finally {f.dispose();}
}
