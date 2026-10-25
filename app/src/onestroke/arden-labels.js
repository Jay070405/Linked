// Pixel layout shared by the live projected labels and their envelope tests.
export function ardenLabelPose(id, dot, box, size, stemX, viewport) {
  const [width,height]=size, [w,h]=viewport;
  let x,y;
  if(id==='projector'){x=box.left-28-width;y=dot.y-height/2;}
  if(id==='board'){x=dot.x-width/2;y=box.top-24-height;}
  if(id==='camera'){x=dot.x-width/2;y=box.bottom+24;}
  if(id==='battery'){x=box.right+28;y=dot.y-height/2;}
  const idealX=x,idealY=y;
  x=Math.max(stemX+16,Math.min(w-24-width,x));
  // A full-width side tag cannot fit in the narrow stem/film gutter. Once
  // clamped horizontally, use the adjacent outside corner so it still clears
  // both the film and its own part dot (and the top/bottom centre labels).
  if(x!==idealX&&id==='projector')y=box.bottom+24;
  if(x!==idealX&&id==='battery')y=box.top-24-height;
  // During the exit dolly the top of the film can reach the navigation edge.
  // Use the opposite outside edge rather than clamping text onto the image.
  if(y<24)y=box.bottom+24;
  if(y+height>h-24)y=box.top-24-height;
  y=Math.max(24,Math.min(h-24-height,y));
  const clamped=x!==idealX||y!==idealY;
  let end;
  if(id==='projector')end={x:x+width,y:y+height/2};
  if(id==='battery')end={x,y:y+height/2};
  if(id==='board'||id==='camera')end={x:x+width/2,y:y>dot.y?y:y+height};
  if(clamped&&id==='projector')end={x:x+width-7,y:y>dot.y?y:y+height};
  if(clamped&&id==='battery')end={x:x+7,y:y>dot.y?y:y+height};
  const points=[dot];
  if(clamped)points.push({x:end.x,y:dot.y});
  points.push(end);
  return {x,y,width,height,points,clamped};
}
