// All surfaces share one inner sphere. Coordinates are relative to the viewport
// centre; scrolling moves the unrolled wall through this same projection.
export function spherePoint(x,y,width,height) {
  const rx=width*1.12, ry=height*.82, focal=height*1.28;
  const ax=x/rx, ay=y/ry;
  const z=ry*(1-Math.cos(ay))+rx*(1-Math.cos(ax))*.32;
  const perspective=focal/(focal-z);
  return {x:rx*Math.sin(ax)*Math.cos(ay)*perspective,y:ry*Math.sin(ay)*perspective,z,scale:perspective};
}
