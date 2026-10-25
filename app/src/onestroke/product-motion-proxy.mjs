import {fixture,cameraAt,loaded,objectArea,screen,objectCorners} from './product-test-fixture.mjs';
import {toScroll,toJourney} from './pacing.js';

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
          const corners=objectCorners(f,station);
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
