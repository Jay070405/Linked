// The camera of the Variables for agents film, copied from the film's own source so the page can redraw it:
// aigc-vibecoding/product-films/src/films/VariablesForAgents2.tsx (aim, KEYS, winAt, STAGES, Flight, scramble) and
// src/kit/motion.ts (smoother). The film's window is 1440 x 900 under a 40 px title bar, placed by
// translate3d(x - 720, y - 470) rotateX(rx) rotateY(ry) scale(s) inside a 1920 x 1080 frame with perspective 1800.
// Everything here is a pure function of film time t (seconds), like the film itself.

export const FPS=60;
export const CUTS=[20.4,24,27.4];
export const DURATION=29.4;
const PERSPECTIVE=1800,CX=720,CY=470,BAR=40,DEG=Math.PI/180;

export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const prog=(t,a,b)=>clamp((t-a)/(b-a));
/** Quintic smoothstep (kit/motion.ts): zero velocity and acceleration at both ends. */
export const smoother=x=>x<=0?0:x>=1?1:x*x*x*(x*(6*x-15)+10);

/** Puts point (px, py) of the 1440 x 900 page at frame (fx, fy) at scale s. */
const aim=(px,py,s,fx,fy)=>({x:fx-(px-720)*s,y:fy-(py+40-470)*s,s});
/** The twelve framings, as the film writes them: what point of the file sits where in the frame, at what scale and tilt. */
export const KEYS=[
 {t:6.9,aim:[720,450,.9,960,1700],rx:50,ry:-10},
 {t:7.7,aim:[720,450,.92,1000,600],rx:14,ry:-14},
 {t:8.6,aim:[1300,160,2.1,1250,430],rx:10,ry:-12},
 {t:9.5,aim:[1290,165,2.2,1240,440],rx:9,ry:-11},
 {t:10.1,aim:[590,330,1.7,1150,560],rx:12,ry:-8},
 {t:11.9,aim:[600,320,1.8,1140,560],rx:10,ry:-6},
 {t:12.5,aim:[1020,470,1.75,1180,560],rx:8,ry:-10},
 {t:13.7,aim:[1020,520,1.8,1180,540],rx:7,ry:-9},
 {t:14.3,aim:[700,520,1.62,1150,560],rx:8,ry:-6},
 {t:17.3,aim:[780,500,2.05,1150,560],rx:4,ry:-2},
 {t:18,aim:[720,470,1,1100,590],rx:18,ry:-16},
 {t:20.4,aim:[720,470,1.12,1060,580],rx:12,ry:-10},
].map(k=>({t:k.t,aim:k.aim,w:{...aim(...k.aim),rx:k.rx,ry:k.ry}}));
const CH=['x','y','s','rx','ry'],N=KEYS.length;
const segment=t=>{let i=0;while(i<N-2&&t>KEYS[i+1].t)i++;return i;};
const hermite=(a,b,m0,m1,u)=>{const u2=u*u,u3=u2*u;return (2*u3-3*u2+1)*a+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b+(u3-u2)*m1;};
const slope=(j,k)=>(KEYS[j+1].w[k]-KEYS[j].w[k])/(KEYS[j+1].t-KEYS[j].t);

/** The film's path (winAt): a monotone cubic through every key. Each tangent is the harmonic mean of the slopes on
    either side, or zero where a value turns back, so it never overshoots a key and only stops where a value reverses.
    It starts from rest and is still moving on the cut at 20.4 s. */
export function winAt(t){
 if(t<=KEYS[0].t)return KEYS[0].w;
 const i=segment(t),a=KEYS[i],b=KEYS[i+1],h=b.t-a.t,u=clamp((t-a.t)/h),out={};
 const tan=(j,k)=>{if(j===0)return 0;if(j===N-1)return slope(N-2,k);const s0=slope(j-1,k),s1=slope(j,k);return s0*s1<=0?0:2/(1/s0+1/s1);};
 for(const k of CH)out[k]=hermite(a.w[k],b.w[k],tan(i,k)*h,tan(i+1,k)*h,u);
 return out;
}
/** Not in the film: the same keys, each reached at rest (a minimum-jerk glide between neighbours, kit/motion.ts's
    track() without `flow`). This is the stop-and-go the README's smoothness rules forbid. */
export function easedAt(t){
 if(t<=KEYS[0].t)return KEYS[0].w;
 const i=segment(t),a=KEYS[i],b=KEYS[i+1],u=smoother(clamp((t-a.t)/(b.t-a.t))),out={};
 for(const k of CH)out[k]=lerp(a.w[k],b.w[k],u);
 return out;
}
/** Not in the film: the same keys through a plain Catmull-Rom spline, which keeps moving but swings past keys. */
export function catmullAt(t){
 if(t<=KEYS[0].t)return KEYS[0].w;
 const i=segment(t),a=KEYS[i],b=KEYS[i+1],h=b.t-a.t,u=clamp((t-a.t)/h),out={};
 const tan=(j,k)=>j===0?0:j===N-1?slope(N-2,k):(KEYS[j+1].w[k]-KEYS[j-1].w[k])/(KEYS[j+1].t-KEYS[j-1].t);
 for(const k of CH)out[k]=hermite(a.w[k],b.w[k],tan(i,k)*h,tan(i+1,k)*h,u);
 return out;
}

/** The window's rotation applied to a local vector (CSS rotateX(rx) rotateY(ry): Y first, then X). */
const rotate=(w,X,Y,Z)=>{
 const ry=w.ry*DEG,rx=w.rx*DEG;
 const X1=Math.cos(ry)*X+Math.sin(ry)*Z,Z1=-Math.sin(ry)*X+Math.cos(ry)*Z;
 return [X1,Math.cos(rx)*Y-Math.sin(rx)*Z1,Math.sin(rx)*Y+Math.cos(rx)*Z1];
};
/** Where point (px, py) of the file lands in the 1920 x 1080 frame for window pose w (CSS perspective 1800). */
export function project(w,px,py){
 const [X,Y,Z]=rotate(w,(px-CX)*w.s,(py+BAR-CY)*w.s,0),k=1/(1-Z/PERSPECTIVE);
 return [960+(w.x+X-960)*k,540+(w.y+Y-540)*k];
}
/** The point of the file seen at frame point (fx, fy): the ray from the eye meets the window's plane. */
export function unproject(w,fx,fy){
 const ex=rotate(w,1,0,0),ey=rotate(w,0,1,0),E=[960,540,PERSPECTIVE],d=[fx-960,fy-540,-PERSPECTIVE],O=[w.x,w.y,0];
 const A=[[d[0],-ex[0],-ey[0]],[d[1],-ex[1],-ey[1]],[d[2],-ex[2],-ey[2]]],B=[O[0]-E[0],O[1]-E[1],O[2]-E[2]];
 const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
 const D=det(A);if(Math.abs(D)<1e-9)return null;
 const col=c=>A.map((r,i)=>r.map((v,j)=>j===c?B[i]:v));
 if(det(col(0))/D<=0)return null;
 return [CX+det(col(1))/D/w.s,CY-BAR+det(col(2))/D/w.s];
}
/** The camera's footprint on the file: the four corners of the frame, traced back onto the tilted window. */
export const footprint=w=>[[0,0],[1920,0],[1920,1080],[0,1080]].map(([x,y])=>unproject(w,x,y));

// the frame points the picture speed is measured at (a 5 x 3 grid)
const GX=[160,560,960,1360,1760],GY=[140,540,940];
/** How fast the picture moves at time t under path f: the RMS speed, in frame pixels per second, of the file's points
    seen at a 5 x 3 grid of the frame (perspective included); before the window covers the grid, its centre's speed. */
export function pictureSpeed(f,t,dt=1e-4){
 const w=f(t),a=f(t-dt),b=f(t+dt);let sum=0,n=0;
 for(const gx of GX)for(const gy of GY){
  const p=unproject(w,gx,gy);if(!p||p[0]<0||p[0]>1440||p[1]<-BAR||p[1]>900)continue;
  const A=project(a,p[0],p[1]),B=project(b,p[0],p[1]);sum+=(B[0]-A[0])**2+(B[1]-A[1])**2;n++;
 }
 if(!n){const A=project(a,720,430),B=project(b,720,430);return Math.hypot(B[0]-A[0],B[1]-A[1])/(2*dt);}
 return Math.sqrt(sum/n)/(2*dt);
}

/** The screen inside the window, swapped on the frame while the window moves. */
export const STAGES=[
 {at:6.9,src:'row',name:{en:'File, unbound-values row',zh:'文件，未绑定数值那一行'}},
 {at:9.95,src:'outline',name:{en:'A scan line outlines the unbound layers',zh:'扫描线框出未绑定的图层'}},
 {at:12.35,src:'review',name:{en:'Check designs review list',zh:'Check designs 检查清单'}},
 {at:14.15,src:'picker',name:{en:'Variable picker, light then dark',zh:'variable 选择器，先浅色后深色'}},
 {at:17.85,src:'bound',name:{en:'Bound 9 values on 29 layers',zh:'已绑定 29 个图层上的 9 个值'}},
];
/** Construction lines on the file drawing: regions the film's own overlays point at (window-local px, minus the bar). */
export const REGIONS=[
 {id:'row',x:1206,y:148,w:224,h:26,place:'below',label:{en:'unbound-values row',zh:'未绑定数值那一行'}},
 {id:'scan',x:380,y:60,w:420,h:700,place:'below',label:{en:'canvas, scanned 10.1–11.4 s',zh:'画布，10.1–11.4 秒被扫描'}},
 {id:'list',x:862,y:369,w:315,h:380,place:'above',label:{en:'review list',zh:'检查清单'}},
];

/** The headline plates (Plate): a dark plate only as big as the words, at (96, 66) in the frame. */
export const PLATES=[{from:7.5,to:20.4,w:860,h:210},{from:20.4,to:24,w:1080,h:190}];

/** The scramble (characters settle left to right; unsettled ones flicker, held per output frame). */
const GLYPHS='abcdefghijklmnopqrstuvwxyz0123456789/#';
export const scramble=(from,to,p,frame)=>{
 if(p<=0)return from;if(p>=1)return to;
 const n=Math.round(from.length+(to.length-from.length)*smoother(p));let out='';
 for(let i=0;i<n;i++){const edge=p*(n+5)-i;out+=edge>=5?(to[i]??''):GLYPHS[Math.floor(Math.abs(Math.sin((i+1)*12.9898+frame*78.233))*43758.5453)%GLYPHS.length];}
 return out;
};
/** The film's scrambles: each runs a quarter second of the frame clock. */
export const SCRAMBLES=[
 {at:14.85,dur:.25,from:'#F7F7F5',to:'color/background'},
 {at:3,dur:.25,from:'#F7F7F5',to:'bgLight'},
];

/** Bound (Flight): nine raw values flip into their token names on one frame (SNAP) and arc down into the canvas. */
export const SNAP=18.45;
export const BOUND=['color/background','color/text-primary','color/text-secondary','color/accent','color/surface-sunken','color/border','space/20','space/16','radius/md'];
export const RAW=['#F7F7F5','#1C1D21','#6E6F78','#2F5D50','#EDECE8','#E4E3DF','20px','16px','12px'];
const inOutCubic=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
/** Chip i of the flight at time t: centre in frame px, scale, opacity and the opacity of its name. */
export function flight(i,t){
 const a=SNAP+.14+i*.05,u=prog(t,a,a+1.35),k=inOutCubic(u);
 const x0=1470,y0=300+i*58,x1=780+(i%3)*70,y1=380+Math.floor(i/3)*150;
 return {u,k,x:lerp(x0,x1,k),y:lerp(y0,y1,k)+Math.sin(Math.PI*k)*90,scale:1-.5*k,o:1-smoother(prog(k,.8,1)),text:1-smoother(prog(u,.02,.2)),start:a};
}
export const SHUTTER={samples:16,span:.5};// 16 samples over the first half of each frame (a 180° shutter)
