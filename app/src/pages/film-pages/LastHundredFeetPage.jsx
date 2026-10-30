import {useEffect,useMemo,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {Reveal,BeforeAfter,NextProject,useInView} from '../story/Story';
import {Desk,FPS} from '../story/FilmDesk';
import M from '../films/last-100-feet-timing.json';
import './last-hundred-feet-page.css';

/* Last 100 Feet, the film: how it was timed. The page is laid out as an animator's exposure sheet (a margin column of
   ruled frames, scenes down the page) and follows the film's own clock: the first cut, the review rounds, the judder
   ("一卡一卡"), its three causes, the shot-by-shot re-timing in src/kit/time.ts, and the pin's leap frame by frame.
   Every number comes from aigc-vibecoding/product-films or is measured from the files: films/last-100-feet-timing.json
   holds the per-frame picture change of the site's film and of the first cut (rendered again from LastHundredFeetV1),
   values recomputed from the film's code (camera keys, pin, courier) and a left-vs-transform test in headless Chrome.
   Motion is transform and opacity only, except the pixel demo, which moves one box by `left` on purpose. */

const MEDIA='/assets/other-project/last-100-feet';
const DUR=29.2,FRAMES=1752,BUILT=27;
// src/films/l100v2-time.ts: the film's own spans (seconds of its 27 s clock) and the length each plays in
const SPANS=[[0,12,13],[12,16,4],[16,20.4,6],[20.4,24,3.4],[24,27,2.8]].map(([from,to,len],i,all)=>({from,to,len,start:all.slice(0,i).reduce((s,x)=>s+x[2],0),speed:(to-from)/len}));
const spanAt=t=>{let i=0;while(i<SPANS.length-1&&t>=SPANS[i+1].start-1e-9)i++;return i;};
const toOld=t=>{const s=SPANS[spanAt(t)];return s.from+(t-s.start)/s.len*(s.to-s.from);};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const pad=(n,w=2)=>String(n).padStart(w,'0');
const tc=f=>pad(Math.floor(f/FPS))+':'+pad(f%FPS);
const pct=v=>Math.round(v*100)+'%';
const heldSeconds=spans=>spans.reduce((s,[a,b])=>s+b-a,0);
const scrollerOf=el=>el?.closest('.portfolio-page-viewport')||window;
const viewH=s=>s===window?innerHeight:s.clientHeight;
/** Picture change drawn on a square-root scale, capped at 12 (as scripts/motion-curve.mjs caps its plot). */
const level=v=>Math.sqrt(Math.min(v,12)/12);
/** A measured strip as a mirrored area: x in seconds, y in [-1, 1]; each pair of frames drawn at its larger value. */
function wave(d,fps,skip){
 const top=[],bottom=[];
 for(let i=0;i<d.length;i+=2){
  let m=0;for(let k=i;k<i+2&&k<d.length;k++)if(!skip?.has(k))m=Math.max(m,d[k]);
  const x=((i+1)/fps).toFixed(3),h=level(m).toFixed(3);
  top.push(x+','+(-h));bottom.push(x+','+h);
 }
 return 'M0,0L'+top.join('L')+'L'+(d.length/fps).toFixed(3)+',0L'+bottom.reverse().join('L')+'Z';
}
/** Arrow keys for a frame slider: one frame, Shift one second. */
const stepKey=(event,cur,max,big=FPS)=>{
 const s=event.shiftKey?big:1;
 const to={ArrowRight:cur+s,ArrowUp:cur+s,ArrowLeft:cur-s,ArrowDown:cur-s,PageUp:cur+big,PageDown:cur-big,Home:0,End:max}[event.key];
 if(to===undefined)return null;
 event.preventDefault();return clamp(to,0,max);
};

const EN={
 back:'Other Project',sheet:'Exposure sheet · 01 / 01',
 fields:[['Production','Last 100 Feet'],['Scene','Launch film'],['Frames','1,752'],['Rate','60 fps'],['Length','29.2 s'],['Made with','React, rendered by Remotion']],
 sub:'How the film was timed.',
 lede:'Every frame of this film is rendered from React code, so its timing is code too. The motion-first cut juddered, so I measured it frame by frame and re-timed it shot by shot. Animators plan a film frame by frame on an exposure sheet; this page is the one for Last 100 Feet.',
 watch:'Watch the film',caseLink:'The product: Last 100 Feet case',
 posterAlt:'A frame of the film: the red map pin has landed on door 214 of the site plan, rings spreading out from it, above the line “The door says otherwise.”',
 poster:'Frame 165, 2.75 s: the pin has landed on door 214. Every picture on this page is a frame of the film or a measurement of it.',
 fpK:'The final, frame by frame',fpLabel:'How much the picture changes from each frame to the next, across all 1,752 frames.',
 fpAria:'The final film’s picture change per frame. Use the arrow keys to move frame by frame, Shift for a second.',
 fpValue:(f,s,shot)=>`Frame ${f}, ${s} seconds, shot ${shot}`,
 fpLegend:'Red: the five hard cuts, which run off the top. Height is the square root of the change, so small moves still show.',
 fpHint:'Drag across it',fpPlay:s=>`▶ Play from ${s} s`,frame:'Fr',shot:'Shot',
 s1k:'First cut',s1h:n=>`First cut: 38 seconds, ${n} of them standing still`,
 s1p1:h=>`Measured the same way as the final, the first cut holds still for ${h} s in all, and its last 7.2 s are one card that never moves. It read like a slide deck: a whole phone on light grey, a caption beside it.`,
 s1p2:'So I went through nine app launch films from Apple, Notion, Figma, Linear, Raycast and The Browser Company, one frame a second, and rebuilt the film motion first around three ideas.',
 firstLabel:'First cut',finalLabel:'Final',heldFor:s=>`${s} s held`,
 stripsAria:'The first cut and the final measured frame by frame on one time scale; hatched spans are holds.',
 legend:'Hatched: holds, where a frame matches the one half a second later (mean difference under 1 in 255). For this measurement the first cut was rendered again from its composition, at 480 × 270.',
 compareK:'The same moment, first cut against final',
 s2k:'Review',s2h:'Six review rounds took it from 73 to 86. It still stuttered.',
 s2p:'An independent reviewer scored every render out of 100 (motion 30, craft 30, story 25, finish 15), and its notes reshaped the film. Three of them:',
 round:n=>`R${n}`,roundsAria:s=>`Review scores over six rounds: ${s}.`,note:'Note',fix:'Fix',
 quoteLead:'Then my own note on the motion-first cut:',quoteGloss:'“Not smooth at all.” “It stutters”: move, stop, move.',
 quoteAfter:'The scores couldn’t see it. The reviewer worked from contact sheets, a frame every half second, and a stutter lives between frames.',
 s3k:'Measure',s3h:'A stutter lives between frames',
 s3p:'So each render was decoded and every frame compared with the one before: greyscale at 192 × 108, mean difference out of 255. Plotted across a film, stop-and-go shows as dips to zero and pixel stepping as a comb of spikes. Three causes turned up.',
 c1h:'Cameras eased to a stop at every framing',
 c1p:'The kit’s track() reaches a key at rest unless the key is marked to flow. With every key held, the opening camera stops at each of its five framings in ten seconds. With flow on, it passes through them on Catmull–Rom tangents, clamped so it never overshoots, and rests once: at 1.73 s, where every part of the move turns, just before the pin leaps.',
 c1fix:'Fix: keys flow, and shots are cut while the camera still moves.',
 c1cap:'Recomputed from the film’s seven opening camera keys: how far the picture moves each frame, in pixels at 1080p, on a square-root scale; marks on the baseline are stops. Below, each tick is one frame, spaced by that distance: where ticks bunch, the camera is slowing or stopped.',
 held:'Every key held',flow:'Keys flow (the film)',stops2:n=>`${n} stop${n===1?'':'s'}`,run:'Run both',again:'Run again',stop:'Stop',pxf:'px / frame',
 c1aria:'Camera speed through the opening, held keys against flowing keys. Arrow keys move the time.',
 c2h:'The courier walked in stop-and-go legs',
 c2p:(b4,st)=>`Now it walks from the gate to door 214 in one 3.2-second move, easing only as it leaves the gate and as it reaches the door. It passes Building 4 at ${b4} of its top speed and the north stairs at ${st}.`,
 c2fix:'Fix: one leg from the gate to the door.',
 c2cap:'Computed from the film’s courier legs: feet from the curb in each output frame. Shaded: the film is on the gate shot, where the code appears.',
 c2aria:'The courier’s feet from the curb over time. Arrow keys move the time.',
 stops:['Curb','Gate','Bldg 4','Stairs','214'],ft:'ft',gate:'On the gate shot',run2:'Walk it',
 c3h:'Slow drifts stepped a whole pixel at a time',
 c3p:'Phones and windows were placed by left and top. Chrome snaps those to whole pixels, so a phone drifting a few pixels a second sat still, then jumped. src/kit/devices.tsx now places them with a transform, which moves by fractions of a pixel.',
 c3fix:'Fix: position by transform, render at 60 fps.',
 demoK:'Live in your browser, magnified 8×',demoP:'Both squares drift 6 px a second. One cell of the grid is one pixel. Chrome shows the difference; other browsers may round differently.',
 byLeft:'Placed by left',byTransform:'Placed by transform',pause:'Pause',play:'Play',nudge:'Move both by hand, in tenths of a pixel',
 traceK:'Measured in headless Chrome',
 traceCap:v=>`A 40 px box moved 0.1 px a frame for 90 frames; its painted centre found in each screenshot (${v}). By left: one 1 px jump every ten frames. By transform: 0.1 px every frame. Underneath, the change per frame: by left it is a comb.`,
 traceAria:'Measured painted position per frame: a staircase when placed by left, a straight ramp when placed by transform.',
 s4k:'Re-time',s4h:'Re-timed shot by shot: 27 s became 29.2 s',
 s4p1:'The film is animated on its own 27-second clock. src/kit/time.ts plays each span between hard cuts at its own length, rounded to whole frames, so the speed changes only on a cut and never in the middle of a move. The opening breathes a little more; the walk from the gate to door 214 gets the time it needs to read each stop.',
 s4p2:'Every output frame is rendered fresh from code at its new time, so a slower span isn’t stretched footage: nothing is repeated or blended. Numbers that change in steps, like the feet counter, hold for the whole output frame (time.ts’s held()), so the 16 motion-blur samples inside a frame all show the same value.',
 hint:'Scroll, drag the graph, or use the arrow keys (Shift: one second)',hintStill:'Drag the graph or use the arrow keys (Shift: one second)',
 out:'Output',film:'Film clock',speed:'Speed',span:'Span',
 axisX:'Output, seconds',axisY:'The film’s own clock, seconds',asBuilt:'As built: 27 s',retimed:'Re-timed: 29.2 s',
 cols:['Fr','Out','Film','Speed','Note'],cutTo:n=>`CUT → shot ${n}`,
 rmAria:'Re-timing graph: output time against the film’s own clock. Arrow keys move one frame, Shift one second.',
 rmValue:(s,o,p)=>`Output ${s} s, film clock ${o} s, speed ${p}`,
 tableCap:'The five spans in src/films/l100v2-time.ts',
 tableHead:['Span','Film clock','Plays in','Frames','Speed','In it'],
 spanNotes:['The map against the door, the route, the resident, the curb','At the gate, with the cut at 15.45 s inside it','Building 4, the north stairs, door 214, delivered','The whole route from above','The lockup'],
 after:'Measured after the fix, from the file on this page',
 res:[['1,752','frames, 60 a second, no hold of a second or more'],['8','spikes: the 5 hard cuts and 3 screen changes inside the phone (12.46, 16.20, 19.66 s); no comb'],['1','hold: the frames at 1.27 s and 1.77 s nearly match, where the camera rests before the leap']],
 s5k:'The leap',s5h:'The key line, acted out in 0.54 seconds',
 s5p:'Each film acts out its key line once. Here it is “The door says otherwise.”: the pin map apps drop on the garage lifts off at 1.755 s, turns red at the top of its arc and lands on door 214 at 2.297 s. It flies on a cubic in-out, so its frames bunch at take-off and landing; the camera whips with it and is still moving when it lands.',
 dotsCap:'The pin’s flight from the film’s code: one dot per output frame, red from the top of the arc.',
 garage:'Garage',camCap:'Camera movement through the leap, px per frame',
 scrub:'Move through 0.90–2.95 s, frame by frame',
 stills:'Stills from the film: 24 between 0.90 and 2.95 s, and one at each moment listed.',
 playIn:'▶ Play this in the film',lift:'Lift-off',red:'Turns red',land:'Lands',
 s6k:'The film',s6h:'The film on its own timeline',
 s6p:'29.2 s at 60 fps, silent. Click or drag the timeline; the arrow keys step a second, Shift and an arrow one frame.',
 open:'Open the video',
 fine:'An independent concept, not affiliated with any delivery company, not yet tested with couriers or residents; the address is fictional and the photos are AI-generated illustrations.',
 footer:'A film rendered from code, by Jay Lin.',
};
const ZH={
 back:'Other Project',sheet:'摄影表 · 第 01 / 01 页',
 fields:[['片名','Last 100 Feet'],['场次','宣传片'],['帧数','1,752'],['帧率','60 帧/秒'],['时长','29.2 秒'],['制作','React 代码，Remotion 渲染']],
 sub:'这支片子的节奏是怎么定的。',
 lede:'这支片子的每一帧都由 React 代码渲染，所以它的节奏也写在代码里。以动效为先重做的那一版看起来一卡一卡的，我就逐帧去量，再一个镜头一个镜头地重新定速。动画师用摄影表逐帧安排一部片子，这一页就是 Last 100 Feet 的摄影表。',
 watch:'看片子',caseLink:'产品本身：Last 100 Feet 案例',
 posterAlt:'片中的一帧：红色定位点落在小区平面图的 214 号门上，红色圆环向外扩散，下方是字幕 “The door says otherwise.”',
 poster:'第 165 帧，2.75 秒：定位点已经落在 214 号门上。这一页上的每张图，要么是片子里的一帧，要么是从片子里量出来的。',
 fpK:'终版，逐帧',fpLabel:'全片 1,752 帧，每一帧相对上一帧的画面变化量。',
 fpAria:'终版每一帧的画面变化。用方向键逐帧移动，按住 Shift 一次一秒。',
 fpValue:(f,s,shot)=>`第 ${f} 帧，${s} 秒，第 ${shot} 个镜头`,
 fpLegend:'红线是 5 个硬切，数值超出了图的上沿。高度取变化量的平方根，小幅运动也看得见。',
 fpHint:'在上面拖动',fpPlay:s=>`▶ 从 ${s} 秒开始播放`,frame:'帧',shot:'镜头',
 s1k:'第一版',s1h:n=>`第一版：38 秒，有 ${n} 秒是静止的`,
 s1p1:h=>`用测终版的方法去测第一版：画面加起来静止了 ${h} 秒，最后 7.2 秒是一张一动不动的结尾卡。整支片子像幻灯片：浅灰底上摆一整台手机，旁边配一行字。`,
 s1p2:'于是我把 Apple、Notion、Figma、Linear、Raycast 和 The Browser Company 的九支 App 宣传片按每秒一帧铺开来看，然后以动效为先重做了这支片子，围绕三个想法：',
 firstLabel:'第一版',finalLabel:'终版',heldFor:s=>`静止 ${s} 秒`,
 stripsAria:'第一版和终版在同一条时间轴上的逐帧测量，斜线部分是静止段。',
 legend:'斜线表示静止：这一帧和半秒之后的那一帧几乎一样（平均差值小于 1/255）。为了这次测量，第一版按原来的合成重新渲染了一遍，分辨率 480 × 270。',
 compareK:'同一时刻，第一版对终版',
 s2k:'评审',s2h:'六轮评审，从 73 分涨到 86 分。可它还是一卡一卡的。',
 s2p:'每次渲染都交给一个独立评审打分，满分 100（动效 30、工艺 30、叙事 25、完成度 15），它的意见一轮轮改变了片子。其中三条：',
 round:n=>`第${n}轮`,roundsAria:s=>`六轮评审的分数：${s}。`,note:'意见',fix:'改法',
 quoteLead:'然后是我自己看动效优先版时写下的评语：',quoteGloss:'动一下，停一下，再动一下。',
 quoteAfter:'评分看不出这个问题。评审看的是联系表，每半秒一帧；而卡顿发生在帧与帧之间。',
 s3k:'测量',s3h:'卡顿藏在帧与帧之间',
 s3p:'所以每次渲染完都要逐帧解码，把每一帧和上一帧比较：缩成 192 × 108 的灰度图，取平均差值（满分 255）。把这条曲线铺满全片，走走停停会一次次掉到零，像素跳格则是一排梳齿一样的尖刺。最后找出了三个原因。',
 c1h:'每到一个构图，镜头都会减速停下',
 c1p:'工具包里的 track() 默认在关键帧上停稳，除非这个关键帧标成“流过”。如果每个关键帧都停，开场 10 秒里镜头会在 5 个构图上各停一次；打开“流过”之后，镜头沿 Catmull–Rom 切线穿过这些关键帧，而且做了限制，不会冲过头。全程只在 1.73 秒停一下：那一刻运镜的每个分量都在转向，定位点马上就要飞起来。',
 c1fix:'改法：关键帧一律流过，并且趁镜头还在动的时候切走。',
 c1cap:'用片子开场的 7 个镜头关键帧重新算出来的：画面每一帧移动多少（1080p 下的像素，纵轴取平方根），底线上的标记是停住的地方。下面每一道刻度是一帧，间距就是这一帧的移动量：刻度挤在一起的地方，镜头在减速或停住。',
 held:'每个关键帧都停',flow:'关键帧流过（成片）',stops2:n=>`停 ${n} 次`,run:'一起跑一遍',again:'再跑一遍',stop:'停',pxf:'像素 / 帧',
 c1aria:'开场镜头的速度：关键帧停住和关键帧流过的对比。方向键可以移动时间。',
 c2h:'骑手走一段、停一段',
 c2p:(b4,st)=>`现在骑手从大门到 214 号门一口气走完，用时 3.2 秒，只在离开大门和走到门口时减速。经过 4 号楼时是最高速度的 ${b4}，经过北侧楼梯时是 ${st}。`,
 c2fix:'改法：从大门到门口只走一段。',
 c2cap:'用片子里骑手的走位算出来的：每个输出帧上，骑手离路边多少英尺。浅色区域是片子切到大门镜头、显示门禁码的那几秒。',
 c2aria:'骑手离路边的英尺数随时间的变化。方向键可以移动时间。',
 stops:['路边','大门','4 号楼','楼梯','214'],ft:'英尺',gate:'正在大门镜头',run2:'走一遍',
 c3h:'慢速漂移一次跳一整个像素',
 c3p:'手机和窗口原来是用 left 和 top 定位的。Chrome 会把它们吸附到整像素，所以每秒只漂几个像素的手机，会先停住、再跳一下。现在 src/kit/devices.tsx 改用 transform 定位，可以移动零点几个像素。',
 c3fix:'改法：用 transform 定位，按 60 帧渲染。',
 demoK:'在你的浏览器里实时运行，放大 8 倍',demoP:'两个方块都以每秒 6 像素的速度漂移，网格里的一格就是一个像素。Chrome 里能看出差别，其他浏览器的取整方式可能不同。',
 byLeft:'用 left 定位',byTransform:'用 transform 定位',pause:'暂停',play:'播放',nudge:'手动移动两个方块，以 0.1 像素为单位',
 traceK:'在无头 Chrome 里实测',
 traceCap:v=>`一个 40 像素的方块每帧移动 0.1 像素，共 90 帧，从每张截图里找出它实际画在哪里（${v}）。用 left：每 10 帧跳 1 像素；用 transform：每帧移动 0.1 像素。下面是每一帧的变化量：用 left 时是一排梳齿。`,
 traceAria:'实测的逐帧绘制位置：用 left 定位是阶梯，用 transform 定位是一条直线。',
 s4k:'重新定速',s4h:'按镜头重新定速：27 秒变成 29.2 秒',
 s4p1:'片子是在它自己 27 秒的时间线上做的动画。src/kit/time.ts 让两个硬切之间的每一段按自己的时长播放，时长取整到整帧，所以速度只在剪辑点上变化，绝不会在一个动作中间变。开场多留了一点呼吸；从大门走到 214 号门那一段，给够了看清每一站的时间。',
 s4p2:'每个输出帧都是在新的时间点上由代码重新渲染的，所以放慢的那一段不是被拉长的素材，没有重复帧，也没有融合帧。英尺计数这类一格一格跳的数字，会在整个输出帧里保持不变（time.ts 里的 held()），一帧里的 16 个运动模糊采样显示的都是同一个值。',
 hint:'滚动页面、拖动图表，或用方向键（按住 Shift 一次一秒）',hintStill:'拖动图表，或用方向键（按住 Shift 一次一秒）',
 out:'输出',film:'片内时钟',speed:'速度',span:'段',
 axisX:'输出时间（秒）',axisY:'片子自己的时间（秒）',asBuilt:'原样播放：27 秒',retimed:'重新定速：29.2 秒',
 cols:['帧','输出','片内','速度','备注'],cutTo:n=>`硬切 → 镜头 ${n}`,
 rmAria:'重新定速图：输出时间对片子自己的时间。方向键一次一帧，按住 Shift 一次一秒。',
 rmValue:(s,o,p)=>`输出 ${s} 秒，片内 ${o} 秒，速度 ${p}`,
 tableCap:'src/films/l100v2-time.ts 里的五段',
 tableHead:['段','片内时间','播放时长','帧数','速度','内容'],
 spanNotes:['地图和门口的对比、路线、住户、路边','大门，中间还有 15.45 秒的一个剪辑点','4 号楼、北侧楼梯、214 号门、送达','整条路线的俯瞰','结尾署名'],
 after:'修完之后，用本页播放的文件再测一遍',
 res:[['1,752','帧，每秒 60 帧，没有一秒以上的静止'],['8','个尖刺：5 个硬切，加上手机里 3 次换屏（12.46、16.20、19.66 秒），没有梳齿'],['1','处静止：1.27 秒和 1.77 秒的两帧几乎一样，那是定位点起飞前镜头停的一拍']],
 s5k:'起跳',s5h:'把关键那句话演出来，用了 0.54 秒',
 s5p:'每支片子都要把它最关键的那句话演出来一次。这一支是 “The door says otherwise.”：地图 app 落在车库的定位点在 1.755 秒离地，飞到弧线最高点时变红，在 2.297 秒落到 214 号门上。它走的是三次方缓入缓出，所以起飞和落地的帧挤在一起；镜头跟着它甩过去，落地时还在动。',
 dotsCap:'从片子代码算出的定位点轨迹：每个输出帧一个点，过了弧顶就变红。',
 garage:'车库',camCap:'起跳期间的镜头运动（像素 / 帧）',
 scrub:'在 0.90–2.95 秒之间逐帧移动',
 stills:'片中截图：0.90 到 2.95 秒之间 24 张，下面列出的每个时刻各一张。',
 playIn:'▶ 在片子里播放这一段',lift:'离地',red:'变红',land:'落地',
 s6k:'成片',s6h:'放在它自己时间线上的成片',
 s6p:'29.2 秒，60 帧，无声。点击或拖动时间线；方向键一次走一秒，按住 Shift 一次一帧。',
 open:'单独打开视频',
 fine:'独立概念作品，与任何配送公司无关，还没找骑手或住户测试过；地址是虚构的，照片是 AI 生成的示意图。',
 footer:'用代码渲染的一支片子，林世杰。',
};

/* ---------- small parts ---------- */

function Head({k,h,id,children}){
 return <Reveal as="header" className="xs-head"><span className="xs-k">{k}</span><h2 id={id} className="xs-h2">{h}</h2>{children}</Reveal>;
}

/** One scene of the sheet: a ruled margin column (scene number, label) beside the action. */
function Scene({n,k,id,className='',children,...rest}){
 return <section className={'xs-sc'+(className?' '+className:'')} aria-labelledby={id} {...rest}>
  <div className="xs-margin" aria-hidden="true"><span className="xs-margin-in"><b>SC</b><span>{pad(n)}</span><em>{k}</em></span></div>
  <div className="xs-body">{children}</div>
 </section>;
}

/** A clock for the demos: runs once from 0 to `dur` in real time when it first comes into view, and can be run again,
    stopped or seeked. `write` is called on every animation frame with the time; nothing re-renders while it runs. */
function useRun(ref,{dur,reduced,write}){
 const st=useRef({raf:0,t:0,done:false}),fn=useRef(write),[playing,setPlaying]=useState(false),inView=useInView(ref,{threshold:.45});
 fn.current=write;
 const halt=()=>{cancelAnimationFrame(st.current.raf);st.current.raf=0;setPlaying(false);};
 const play=()=>{
  cancelAnimationFrame(st.current.raf);setPlaying(true);
  const from=st.current.t>=dur-1e-3?0:st.current.t,t0=performance.now();
  const tick=now=>{const t=Math.min(dur,from+(now-t0)/1000);st.current.t=t;fn.current(t);if(t<dur)st.current.raf=requestAnimationFrame(tick);else{st.current.raf=0;setPlaying(false);}};
  st.current.raf=requestAnimationFrame(tick);
 };
 const seek=t=>{if(st.current.raf)halt();st.current.t=clamp(t,0,dur);fn.current(st.current.t);};
 useEffect(()=>{st.current.t=reduced?dur:0;fn.current(st.current.t);return()=>cancelAnimationFrame(st.current.raf);},[reduced]);
 useEffect(()=>{if(inView&&!reduced&&!st.current.done){st.current.done=true;play();}},[inView,reduced]);
 return {playing,play,halt,seek,time:()=>st.current.t};
}

/** Pointer and keyboard scrubbing for a chart that maps x to time in [t0, t1]. */
function useScrub(el,{t0,t1,seek,now}){
 const drag=useRef(false);
 const at=x=>{const r=el.current.getBoundingClientRect();return t0+clamp((x-r.left)/r.width)*(t1-t0);};
 return {
  onPointerDown:e=>{if(e.button>0)return;drag.current=true;e.currentTarget.setPointerCapture?.(e.pointerId);seek(at(e.clientX));},
  onPointerMove:e=>{if(drag.current)seek(at(e.clientX));},
  onPointerUp:()=>{drag.current=false;},onPointerCancel:()=>{drag.current=false;},
  onKeyDown:e=>{const f=stepKey(e,Math.round((now()-t0)*FPS),Math.round((t1-t0)*FPS));if(f!==null)seek(t0+f/FPS);},
 };
}

/* ---------- the title block ---------- */

function Fingerprint({film,t,onPlay}){
 const fig=useRef(null),plot=useRef(null),drag=useRef(false),[f,setF]=useState(null),[active,setActive]=useState(false);
 const inView=useInView(fig,{threshold:.3});
 const cutFrames=useMemo(()=>new Set(film.cuts.map(c=>Math.round(c*FPS))),[film]);
 const path=useMemo(()=>wave(M.final.d,FPS,cutFrames),[cutFrames]);
 const at=x=>{const r=plot.current.getBoundingClientRect();return clamp(Math.round((x-r.left)/r.width*(FRAMES-1)),0,FRAMES-1);};
 const show=x=>{setF(at(x));setActive(true);};
 const frame=f??0,time=frame/FPS,p=frame/(FRAMES-1);
 const shot=film.cuts.filter(c=>time>=c-1e-6).length+1;
 const line=film.headlines.find(([a,b])=>time>=a&&time<b)?.[2];
 const beat=(film.beats.find(b=>time<b.to)||film.beats[film.beats.length-1]).name;
 // the nearest of the filmstrip's stills (one every 0.5 s), kept on this side of a cut
 let sprite=Math.min(58,Math.round(time/.5));
 {const ts=sprite*.5;if(film.cuts.some(c=>c>Math.min(ts,time)&&c<=Math.max(ts,time)))sprite+=ts>time?-1:1;}
 const shots=[0,...film.cuts,DUR];
 return <figure ref={fig} className={'xs-fp'+(inView?' is-in':'')}>
  <figcaption className="xs-fp-cap"><b className="xs-mono">{t.fpK}</b><span>{t.fpLabel}</span><span className="xs-fp-hint xs-mono" aria-hidden="true">{t.fpHint} ↔</span></figcaption>
  <div ref={plot} className={'xs-fp-plot'+(active?' is-active':'')} role="slider" tabIndex={0} aria-label={t.fpAria} aria-valuemin={0} aria-valuemax={FRAMES-1} aria-valuenow={frame} aria-valuetext={t.fpValue(frame,time.toFixed(2),shot)}
   onPointerDown={e=>{if(e.button>0)return;drag.current=true;e.currentTarget.setPointerCapture?.(e.pointerId);show(e.clientX);}}
   onPointerMove={e=>{if(drag.current||e.pointerType==='mouse')show(e.clientX);}}
   onPointerUp={()=>{drag.current=false;}} onPointerCancel={()=>{drag.current=false;}}
   onPointerLeave={e=>{if(e.pointerType==='mouse'&&!drag.current&&document.activeElement!==plot.current)setActive(false);}}
   onFocus={()=>setActive(true)} onBlur={()=>setActive(false)}
   onKeyDown={e=>{const to=stepKey(e,frame,FRAMES-1);if(to!==null){setF(to);setActive(true);}}}>
   <div className="xs-fp-ink">
    <svg viewBox={`0 -1 ${DUR} 2`} preserveAspectRatio="none" aria-hidden="true">
     {shots.slice(0,-1).map((s,i)=>i%2?<rect key={s} className="xs-fp-alt" x={s} y={-1} width={shots[i+1]-s} height={2}/>:null)}
     <line className="xs-fp-mid" x1={0} x2={DUR} y1={0} y2={0}/>
     <path className="xs-fp-wave" d={path}/>
     {film.cuts.map(c=><line key={c} className="xs-cut" x1={c} x2={c} y1={-1} y2={1}/>)}
    </svg>
    <i className="xs-fp-cover" aria-hidden="true"/>
   </div>
   <div className="xs-fp-shots" aria-hidden="true">{shots.slice(0,-1).map((s,i)=><span key={s} style={{left:s/DUR*100+'%',width:(shots[i+1]-s)/DUR*100+'%'}}>{pad(i+1)}</span>)}</div>
   <div className="xs-fp-head" style={{transform:`translate3d(${(p*100).toFixed(3)}%,0,0)`}} aria-hidden="true">
    <i className="xs-fp-line"/>
    <div className="xs-fp-tip" data-side={p<.14?'l':p>.86?'r':'c'}>
     <span className="xs-fp-thumb" style={{backgroundPosition:`${(sprite%10)/9*100}% ${Math.floor(sprite/10)/5*100}%`}}/>
     <span className="xs-fp-read xs-mono"><b>{t.frame} {pad(frame,4)}</b><span>{tc(frame)}</span><span>{t.shot} {pad(shot)}</span></span>
     <span className="xs-fp-say">{line?`“${line}”`:beat}</span>
    </div>
   </div>
  </div>
  <div className="xs-axis" aria-hidden="true">{[0,5,10,15,20,25].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:x/DUR*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>29.2 s</span></div>
  <div className="xs-fp-foot"><span>{t.fpLegend}</span><button type="button" className="xs-link" onClick={()=>onPlay(time)}>{t.fpPlay(time.toFixed(2))}</button></div>
 </figure>;
}

function Title({film,t,go,onWatch,reduced}){
 const [ready,setReady]=useState(false);
 useEffect(()=>{const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setReady(true)));return()=>cancelAnimationFrame(id);},[]);
 const caseHref='/product/'+film.caseSlug;
 return <header className={'xs-title'+(ready||reduced?' is-in':'')}>
  <div className="xs-wrap">
   <div className="xs-title-top xs-mono"><a className="xs-back" href="/other-project" onClick={go('/other-project')}>← {t.back}</a><span>{t.sheet}</span></div>
   <div className="xs-title-grid">
    <div className="xs-title-copy">
     <h1 className="xs-h1" aria-label={film.name}>{film.name.split(' ').map((w,i)=><span className="xs-w" key={i} aria-hidden="true"><span style={{'--i':i}}>{w}</span></span>)}</h1>
     <p className="xs-sub">{t.sub}</p>
     <p className="xs-lede">{t.lede}</p>
     <div className="xs-actions">
      <button type="button" className="xs-btn is-red" onClick={()=>onWatch(0)}>▶ {t.watch}</button>
      <a className="xs-btn" href={caseHref} onClick={go(caseHref)}>{t.caseLink} →</a>
     </div>
    </div>
    <div className="xs-title-side">
     <dl className="xs-fields">{t.fields.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
     <figure className="xs-poster">
      <div className="xs-pegs" aria-hidden="true"><i/><i/><i/></div>
      <div className="xs-poster-frame"><img src={MEDIA+'/sig-6.webp'} width="1600" height="900" alt={t.posterAlt} fetchPriority="high" decoding="async"/><span className="xs-field" aria-hidden="true"/></div>
      <figcaption>{t.poster}</figcaption>
     </figure>
    </div>
   </div>
   <Fingerprint film={film} t={t} onPlay={onWatch}/>
  </div>
 </header>;
}

/* ---------- SC 01: the first cut ---------- */

function Strips({film,t}){
 const fig=useRef(null),inView=useInView(fig,{threshold:.3}),AX=38;
 const rows=useMemo(()=>[
  {k:'first',label:t.firstLabel,d:M.first.d,dur:38,holds:M.first.holds},
  {k:'final',label:t.finalLabel,d:M.final.d,dur:DUR,holds:M.final.holds,cuts:film.cuts},
 ].map(r=>({...r,held:heldSeconds(r.holds),path:wave(r.d,FPS,r.cuts?new Set(r.cuts.map(c=>Math.round(c*FPS))):null)})),[film,t]);
 return <figure ref={fig} className={'xs-strips'+(inView?' is-in':'')} role="img" aria-label={t.stripsAria}>
  {rows.map((r,i)=><div key={r.k} className={'xs-strip is-'+r.k} style={{'--d':i*220+'ms'}}>
   <div className="xs-strip-k"><b>{r.label}</b><span className="xs-mono">{r.dur.toFixed(1)} s · {t.heldFor(r.held.toFixed(1))}</span></div>
   <div className="xs-strip-track"><div className="xs-strip-plot" style={{width:r.dur/AX*100+'%'}}>
    <svg viewBox={`0 -1 ${r.dur} 2`} preserveAspectRatio="none" aria-hidden="true"><line className="xs-fp-mid" x1={0} x2={r.dur} y1={0} y2={0}/><path className="xs-fp-wave" d={r.path}/>{r.cuts?.map(c=><line key={c} className="xs-cut" x1={c} x2={c} y1={-1} y2={1}/>)}</svg>
    {r.holds.map(([a,b])=><i key={a} className="xs-hold" style={{left:a/r.dur*100+'%',width:(b-a)/r.dur*100+'%'}}/>)}
    <i className="xs-fp-cover"/>
   </div></div>
  </div>)}
  <div className="xs-strip-axis"><span/><div className="xs-axis">{[0,5,10,15,20,25,30,35].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:x/AX*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>38 s</span></div></div>
 </figure>;
}

function FirstCut({film,t,L,reduced}){
 const held=heldSeconds(M.first.holds);
 return <>
  <Head k={t.s1k} h={t.s1h(Math.round(held))} id="xs-s1"/>
  <Reveal><Strips film={film} t={t}/></Reveal>
  <p className="xs-fine xs-strip-legend">{t.legend}</p>
  <div className="xs-two">
   <div>
    <Reveal as="p" className="xs-p">{t.s1p1(held.toFixed(1))}</Reveal>
    <Reveal as="p" className="xs-p">{t.s1p2}</Reveal>
    <ol className="xs-ideas">{film.ideas.map((x,i)=><Reveal as="li" key={i} delay={i*90}><b>{pad(i+1)}</b><div><h3>{x.title[L]}</h3><p>{x.body[L]}</p></div></Reveal>)}</ol>
   </div>
   <Reveal className="xs-compare"><p className="xs-mono">{t.compareK}</p><BeforeAfter pairs={film.firstCut} media={MEDIA} lang={L} reduced={reduced}/></Reveal>
  </div>
 </>;
}

/* ---------- SC 02: the review rounds, and the note ---------- */

function Review({film,t,L}){
 const s=film.scores;
 return <>
  <Head k={t.s2k} h={t.s2h} id="xs-s2"><p className="xs-p">{t.s2p}</p></Head>
  <div className="xs-review">
   <Reveal as="ol" className="xs-rounds" aria-label={t.roundsAria(s.join(', '))}>{s.map((v,i)=><li key={i} style={{'--v':((v-60)/30).toFixed(3),'--i':i}} aria-hidden="true"><i><s/></i><b>{v}</b><span className="xs-mono">{t.round(i+1)}</span></li>)}</Reveal>
   <ol className="xs-notes">{film.notes.map((n,i)=><Reveal as="li" key={i} delay={i*80}>
    <span className="xs-mono">{t.note} {pad(i+1)}</span><p>{n.note[L]}</p>
    <span className="xs-mono is-fix">{t.fix}</span><p>{n.fix[L]}</p>
   </Reveal>)}</ol>
  </div>
  <Reveal as="figure" className="xs-quote">
   <p className="xs-quote-lead">{t.quoteLead}</p>
   <blockquote lang="zh-CN"><span className="xs-quote-a">“非常不 smooth”</span><span className="xs-quote-b"><span className="xs-sr">“</span>一卡一卡<span className="xs-sr">”</span></span></blockquote>
   <figcaption>{t.quoteGloss}</figcaption>
  </Reveal>
  <Reveal as="p" className="xs-p xs-after-quote">{t.quoteAfter}</Reveal>
 </>;
}

/* ---------- SC 03: three causes ---------- */

function Cause({n,h,body,fix,children}){
 return <article className="xs-cause">
  <Reveal className="xs-cause-copy">
   <span className="xs-cause-n" aria-hidden="true">{n}</span>
   <h3>{h}</h3><p>{body}</p><p className="xs-fix">{fix}</p>
  </Reveal>
  <Reveal className="xs-cause-fig">{children}</Reveal>
 </article>;
}

function CamDemo({t,reduced}){
 const N=M.cam.flow.length,END=N/FPS,YMAX=50,sy=v=>1-Math.sqrt(Math.min(v,YMAX)/YMAX);
 const series=useMemo(()=>[['held',M.cam.held],['flow',M.cam.flow]].map(([k,v])=>{
  let acc=0;const cum=[0];for(const x of v){acc+=x;cum.push(acc);}
  // a stop: the picture all but still (under 0.25 px a frame) at a low point; the move's own end is left out
  const stops=[];let last=-99;
  for(let i=1;i<v.length-40;i++)if(v[i]<.25&&v[i]<=v[i-1]&&v[i]<=v[i+1]){if(i-last>9)stops.push(i+1);last=i;}
  return {k,stops,cum:cum.map(c=>c/acc),line:'M0,1L'+v.map((x,i)=>((i+1)/FPS).toFixed(3)+','+sy(x).toFixed(4)).join('L'),ticks:cum.map(c=>'M'+(c/acc).toFixed(5)+',0V1').join('')};
 }),[N]);
 const root=useRef(null),chart=useRef(null),cursor=useRef(null),clock=useRef(null),dots=useRef([]);
 const write=time=>{
  const f=clamp(Math.round(time*FPS),0,N);
  if(cursor.current)cursor.current.style.transform=`translate3d(${(time/END*100).toFixed(3)}%,0,0)`;
  series.forEach((s,i)=>{const d=dots.current[i];if(d)d.style.transform=`translate3d(${(s.cum[f]*100).toFixed(3)}%,0,0)`;});
  if(clock.current)clock.current.textContent=time.toFixed(2)+' s';
  chart.current?.setAttribute('aria-valuenow',f);
 };
 const run=useRun(root,{dur:END,reduced,write});
 const scrub=useScrub(chart,{t0:0,t1:END,seek:run.seek,now:run.time});
 const keys=M.cam.keys.slice(1,-1);
 return <div ref={root} className="xs-demo">
  <div ref={chart} className="xs-chart xs-cam" role="slider" tabIndex={0} aria-label={t.c1aria} aria-valuemin={0} aria-valuemax={N} {...scrub}>
   <span className="xs-chart-y xs-mono">{t.pxf} · √</span>
   <svg viewBox={`0 0 ${END} 1`} preserveAspectRatio="none" aria-hidden="true">
    {[1,5,20].map(v=><line key={v} className="xs-grid" x1={0} x2={END} y1={sy(v)} y2={sy(v)}/>)}
    {keys.map(k=><line key={k} className="xs-key" x1={k} x2={k} y1={0} y2={1}/>)}
    <path className="xs-line is-held" d={series[0].line}/><path className="xs-line is-flow" d={series[1].line}/>
   </svg>
   {[1,5,20,50].map(v=><span key={v} className="xs-chart-tick xs-mono" style={{top:sy(v)*100+'%'}}>{v}</span>)}
   {keys.map(k=><span key={k} className="xs-key-k xs-mono" style={{left:k/END*100+'%'}}>{k.toFixed(2)}</span>)}
   {series.map(s=>s.stops.map(f=><i key={s.k+f} className={'xs-stop is-'+s.k} style={{left:f/FPS/END*100+'%'}} aria-hidden="true"/>))}
   <div ref={cursor} className="xs-cursor" aria-hidden="true"><i/></div>
  </div>
  <div className="xs-axis" aria-hidden="true">{[0,2,4,6,8].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:x/END*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>10.4 s</span></div>
  <div className="xs-ticks">{series.map((s,i)=><div key={s.k} className={'xs-tickrow is-'+s.k}>
   <span className="xs-tickrow-k">{s.k==='held'?t.held:t.flow}<small>{t.stops2(s.stops.length)}</small></span>
   <div className="xs-tickrow-track"><svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path d={s.ticks}/></svg>
    {s.stops.map(f=><i key={f} className="xs-tickstop" style={{left:s.cum[f]*100+'%'}} aria-hidden="true"/>)}
    <div ref={el=>{dots.current[i]=el;}} className="xs-dot" aria-hidden="true"><i/></div></div>
  </div>)}</div>
  <div className="xs-demo-bar"><button type="button" className="xs-btn is-small" onClick={()=>run.playing?run.halt():run.play()}>{run.playing?'❚❚ '+t.stop:'▶ '+(run.time()>0?t.again:t.run)}</button><span ref={clock} className="xs-mono xs-clock">0.00 s</span></div>
  <p className="xs-cap">{t.c1cap}</p>
 </div>;
}

function CourierDemo({t,reduced}){
 const {from,ft,pass}=M.walk,N=ft.length,T0=from/FPS,T1=(from+N-1)/FPS,SPAN=T1-T0,STOPS=[0,45,170,195,290];
 const data=useMemo(()=>{
  const line='M'+ft.map((v,i)=>((from+i)/FPS).toFixed(3)+','+(1-v/290).toFixed(4)).join('L');
  const ticks=ft.map(v=>'M'+(v/290).toFixed(5)+',0V1').join('');
  const speed=ft.map((v,i)=>i?v-ft[i-1]:0),top=Math.max(...speed);
  const at=s=>pct(speed[clamp(Math.round(s*FPS)-from,1,N-1)]/top);
  return {line,ticks,b4:at(pass[0]),st:at(pass[1])};
 },[from,ft,N,pass]);
 const root=useRef(null),chart=useRef(null),cursor=useRef(null),dot=useRef(null),clock=useRef(null),count=useRef(null),gate=useRef(null);
 const write=time=>{
  const tt=T0+time,i=clamp(Math.round(time*FPS),0,N-1),v=ft[i];
  if(cursor.current)cursor.current.style.transform=`translate3d(${(time/SPAN*100).toFixed(3)}%,0,0)`;
  if(dot.current)dot.current.style.transform=`translate3d(${(v/290*100).toFixed(3)}%,0,0)`;
  if(clock.current)clock.current.textContent=tt.toFixed(2)+' s';
  if(count.current)count.current.textContent=Math.round(v);
  gate.current?.toggleAttribute('data-on',tt>=13&&tt<17);
  chart.current?.setAttribute('aria-valuenow',i);
 };
 const run=useRun(root,{dur:SPAN,reduced,write});
 const scrub=useScrub(chart,{t0:0,t1:SPAN,seek:run.seek,now:run.time});
 return <div ref={root} className="xs-demo">
  <div ref={chart} className="xs-chart xs-walk" role="slider" tabIndex={0} aria-label={t.c2aria} aria-valuemin={0} aria-valuemax={N-1} {...scrub}>
   <span className="xs-chart-y xs-mono">290 {t.ft}</span>
   <svg viewBox={`${T0} 0 ${SPAN} 1`} preserveAspectRatio="none" aria-hidden="true">
    <rect className="xs-shade" x={13} y={0} width={4} height={1}/>
    {STOPS.slice(1,-1).map(s=><line key={s} className="xs-key" x1={T0} x2={T1} y1={1-s/290} y2={1-s/290}/>)}
    <path className="xs-line is-flow" d={data.line}/>
   </svg>
   <span className="xs-shade-k xs-mono" style={{left:(13-T0)/SPAN*100+'%',width:4/SPAN*100+'%'}}>{t.gate}</span>
   {pass.slice(0,2).map((p,i)=><span key={p} className="xs-pass" style={{left:(p-T0)/SPAN*100+'%',top:(1-[170,195][i]/290)*100+'%'}}/>)}
   <div ref={cursor} className="xs-cursor" aria-hidden="true"><i/></div>
  </div>
  <div className="xs-axis" aria-hidden="true">{[12,14,16,18].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:(x-T0)/SPAN*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>{T1.toFixed(1)} s</span></div>
  <div className="xs-ticks">
   <div className="xs-tickrow is-flow">
    <span className="xs-tickrow-k"><b ref={count}>0</b> {t.ft}</span>
    <div className="xs-tickrow-track"><svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><path d={data.ticks}/></svg><div ref={dot} className="xs-dot" aria-hidden="true"><i/></div></div>
   </div>
   <div className="xs-stops" aria-hidden="true">{STOPS.map((s,i)=><span key={s} style={{left:s/290*100+'%'}}>{t.stops[i]}<small>{s}</small></span>)}</div>
  </div>
  <div className="xs-demo-bar"><button type="button" className="xs-btn is-small" onClick={()=>run.playing?run.halt():run.play()}>{run.playing?'❚❚ '+t.stop:'▶ '+(run.time()>0?t.again:t.run2)}</button><span ref={clock} className="xs-mono xs-clock">{T0.toFixed(2)} s</span><span ref={gate} className="xs-mono xs-gate-on">{t.gate}</span></div>
  <p className="xs-cap">{t.c2cap}</p>
 </div>;
}

/** The left-versus-transform demo: both boxes are moved live by the same value, one by `left` (Chrome snaps it to whole
    pixels of its own coordinate space, here magnified 8x) and one by transform. Next to it, the measured trace. */
function PixelDemo({t,reduced}){
 const stage=useRef(null),a=useRef(null),b=useRef(null),ra=useRef(null),rb=useRef(null),range=useRef(null);
 const st=useRef({x:6,dir:1,max:40,raf:0,last:0});
 const [playing,setPlaying]=useState(!reduced),inView=useInView(stage,{threshold:.05,once:false});
 const write=x=>{
  st.current.x=x;
  if(a.current)a.current.style.left=x+'px';
  if(b.current)b.current.style.transform=`translate3d(${x}px,0,0)`;
  if(ra.current)ra.current.textContent=`left: ${x.toFixed(2)}px`;
  if(rb.current)rb.current.textContent=`translate3d(${x.toFixed(2)}px, 0, 0)`;
  if(range.current)range.current.value=x.toFixed(2);
 };
 useEffect(()=>{
  const measure=()=>{const w=stage.current?.clientWidth||0;st.current.max=Math.max(8,Math.floor(w/8)-6);if(range.current)range.current.max=st.current.max;write(clamp(st.current.x,0,st.current.max));};
  const ro=new ResizeObserver(measure);ro.observe(stage.current);measure();return()=>ro.disconnect();
 },[]);
 useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
 useEffect(()=>{
  if(!playing||!inView||reduced)return;
  const s=st.current;s.last=0;
  const tick=now=>{
   const dt=s.last?Math.min(.05,(now-s.last)/1000):0;s.last=now;
   let x=s.x+s.dir*6*dt;
   if(x>s.max){x=s.max;s.dir=-1;}else if(x<0){x=0;s.dir=1;}
   write(x);s.raf=requestAnimationFrame(tick);
  };
  s.raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(s.raf);
 },[playing,inView,reduced]);
 const L=M.snap.left,T=M.snap.transform,n=L.length,lo=99.8,hi=109.2;
 const y=v=>((hi-v)/(hi-lo)).toFixed(4);
 const stair='M0,'+y(L[0])+L.slice(1).map((v,i)=>`H${i+1}V${y(v)}`).join('')+`H${n-1}`;
 const ramp='M'+T.map((v,i)=>`${i},${y(v)}`).join('L');
 const comb=L.map((v,i)=>i&&v!==L[i-1]?`M${i},1V0`:'').join('');
 const fine=T.map((v,i)=>i?`M${i},1V${(1-(v-T[i-1])).toFixed(3)}`:'').join('');
 return <div className="xs-demo xs-px">
  <p className="xs-mono xs-demo-k">{t.demoK}</p>
  <div ref={stage} className="xs-px-stage" aria-hidden="true">
   <div className="xs-px-zoom"><i ref={a} className="xs-px-box is-left"/><i ref={b} className="xs-px-box is-transform"/></div>
   <span className="xs-px-lane is-left"><b>{t.byLeft}</b><code ref={ra}/></span>
   <span className="xs-px-lane is-transform"><b>{t.byTransform}</b><code ref={rb}/></span>
  </div>
  <p className="xs-cap">{t.demoP}</p>
  <div className="xs-demo-bar">
   <button type="button" className="xs-btn is-small" onClick={()=>setPlaying(v=>!v)} disabled={reduced} aria-pressed={playing}>{playing?'❚❚ '+t.pause:'▶ '+t.play}</button>
   <label className="xs-range"><span className="xs-mono">{t.nudge}</span><input ref={range} type="range" min="0" max="40" step="0.05" defaultValue="6" onChange={e=>{setPlaying(false);write(+e.target.value);}}/></label>
  </div>
  <figure className="xs-trace">
   <figcaption className="xs-mono xs-demo-k">{t.traceK}</figcaption>
   <div className="xs-trace-plot" role="img" aria-label={t.traceAria}>
    <svg viewBox={`0 0 ${n-1} 1`} preserveAspectRatio="none" aria-hidden="true">
     {[100,101,102,103,104,105,106,107,108,109].map(v=><line key={v} className="xs-grid" x1={0} x2={n-1} y1={y(v)} y2={y(v)}/>)}
     <path className="xs-line is-flow" d={stair}/><path className="xs-line is-ink" d={ramp}/>
    </svg>
    <span className="xs-trace-k is-left xs-mono">left</span><span className="xs-trace-k is-transform xs-mono">transform</span>
   </div>
   <div className="xs-comb" aria-hidden="true"><svg viewBox={`0 0 ${n-1} 1`} preserveAspectRatio="none"><path className="xs-comb-l" d={comb}/><path className="xs-comb-t" d={fine}/></svg></div>
   <div className="xs-axis" aria-hidden="true">{[0,10,20,30,40,50,60,70,80].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:x/(n-1)*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>fr</span></div>
   <p className="xs-cap">{t.traceCap(M.snap.chrome.replace('/',' '))}</p>
  </figure>
 </div>;
}

function Causes({t,reduced}){
 const pass=useMemo(()=>{
  const {from,ft,pass:p}=M.walk,speed=ft.map((v,i)=>i?v-ft[i-1]:0),top=Math.max(...speed);
  return p.slice(0,2).map(s=>pct(speed[Math.round(s*FPS)-from]/top));
 },[]);
 return <>
  <Head k={t.s3k} h={t.s3h} id="xs-s3"><p className="xs-p">{t.s3p}</p></Head>
  <Cause n="1" h={t.c1h} body={t.c1p} fix={t.c1fix}><CamDemo t={t} reduced={reduced}/></Cause>
  <Cause n="2" h={t.c2h} body={t.c2p(pass[0],pass[1])} fix={t.c2fix}><CourierDemo t={t} reduced={reduced}/></Cause>
  <Cause n="3" h={t.c3h} body={t.c3p} fix={t.c3fix}><PixelDemo t={t} reduced={reduced}/></Cause>
 </>;
}

/* ---------- SC 04: the re-timing, on an exposure sheet ---------- */

const ROWS=15,MID=7;
function Remap({film,t,reduced}){
 const track=useRef(null),stage=useRef(null),plot=useRef(null),dot=useRef(null),vx=useRef(null),hy=useRef(null),rows=useRef([]),R=useRef({});
 const st=useRef({t:-1,f:-1,i:-1,w:0,h:0}),manual=useRef(null);
 const sheet=useMemo(()=>{
  const note=new Array(FRAMES).fill(''),kind=new Array(FRAMES).fill(''),text=new Uint8Array(FRAMES);
  const add=(f,s,k)=>{if(f>=0&&f<FRAMES&&!note[f]){note[f]=s;kind[f]=k;}};
  film.cuts.forEach((c,i)=>add(Math.round(c*FPS),t.cutTo(i+2),'cut'));
  film.headlines.forEach(([a,b,s])=>{add(Math.round(a*FPS),'“'+s+'”','text');for(let f=Math.round(a*FPS);f<Math.round(b*FPS)&&f<FRAMES;f++)text[f]=1;});
  film.beats.forEach((b,i)=>add(i?Math.round(film.beats[i-1].to*FPS):0,b.name,'beat'));
  const shift=new Set(SPANS.slice(1).map(s=>Math.round(s.start*FPS)));
  return {note,kind,text,shift};
 },[film,t]);
 const draw=(time,force)=>{
  const s=st.current;if(!force&&Math.abs(time-s.t)<1e-6)return;s.t=time;
  const f=Math.min(FRAMES-1,Math.round(time*FPS)),old=toOld(time),i=spanAt(time),sp=SPANS[i].speed;
  const x=time/DUR*s.w,y=(1-old/BUILT)*s.h;
  if(dot.current)dot.current.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
  if(vx.current)vx.current.style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;
  if(hy.current)hy.current.style.transform=`translate3d(0,${y.toFixed(2)}px,0)`;
  // the readouts name the frame the dot is on, as the sheet's highlighted row does
  const r=R.current;
  if(r.out)r.out.textContent=(f/FPS).toFixed(2);
  if(r.fr)r.fr.textContent=pad(f,4);
  if(r.film)r.film.textContent=toOld(f/FPS).toFixed(3);
  if(i!==s.i){s.i=i;stage.current?.setAttribute('data-span',i);if(r.speed)r.speed.textContent=pct(sp);if(r.span)r.span.textContent=(i+1)+' / 5';}
  plot.current?.setAttribute('aria-valuenow',f);plot.current?.setAttribute('aria-valuetext',t.rmValue(time.toFixed(2),old.toFixed(2),pct(sp)));
  if(f===s.f&&!force)return;s.f=f;
  rows.current.forEach((row,k)=>{
   if(!row)return;const fr=f+k-MID,ok=fr>=0&&fr<FRAMES,c=row.children;
   if(!ok){for(const cell of c)cell.textContent='';row.removeAttribute('data-kind');row.removeAttribute('data-sec');row.removeAttribute('data-ten');row.removeAttribute('data-shift');row.removeAttribute('data-text');row.setAttribute('data-off','');return;}
   row.removeAttribute('data-off');
   const tt=fr/FPS,j=spanAt(tt);
   // the reading row also names what is on screen when no note starts on it
   let ctx='';
   if(k===MID&&!sheet.note[fr]){const h=film.headlines.find(([a,b])=>tt>=a&&tt<b);ctx=h?'“'+h[2]+'”':(film.beats.find(b=>tt<b.to)||film.beats[film.beats.length-1]).name;}
   c[0].textContent=pad(fr,4);c[1].textContent=tt.toFixed(2);c[2].textContent=toOld(tt).toFixed(3);c[3].textContent=pct(SPANS[j].speed);c[4].textContent=sheet.note[fr]||ctx;
   const set=(name,on,val='')=>on?row.setAttribute(name,val):row.removeAttribute(name);
   set('data-ctx',!!ctx);
   set('data-kind',!!sheet.kind[fr],sheet.kind[fr]);set('data-sec',fr%FPS===0);set('data-ten',fr%10===0);set('data-shift',sheet.shift.has(fr));set('data-text',!!sheet.text[fr]);
   row.setAttribute('data-span',j%2);
  });
 };
 const paint=useRef(draw);paint.current=draw;
 useEffect(()=>{
  const ro=new ResizeObserver(()=>{const r=plot.current.getBoundingClientRect();st.current.w=r.width;st.current.h=r.height;paint.current(st.current.t<0?(reduced?17:0):st.current.t,true);});
  ro.observe(plot.current);return()=>ro.disconnect();
 },[reduced]);
 // a language switch rewrites the notes column
 useEffect(()=>{st.current.i=-1;if(st.current.t>=0)paint.current(st.current.t,true);},[sheet]);
 useEffect(()=>{
  if(reduced){paint.current(st.current.t<0?17:st.current.t,true);return;}
  const scroller=scrollerOf(track.current);let raf=0;
  const read=()=>{
   raf=0;
   // after a key or a drag the page is scrolled to that frame; keep the exact frame unless the reader scrolls away
   const top=scroller===window?scrollY:scroller.scrollTop;
   if(manual.current&&Math.abs(top-manual.current)<2)return;
   manual.current=null;
   const r=track.current.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-viewH(scroller)));paint.current(clamp((p-.03)/.94)*DUR);
  };
  const queue=()=>{if(!raf)raf=requestAnimationFrame(read);};
  scroller.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);read();
  return()=>{cancelAnimationFrame(raf);scroller.removeEventListener('scroll',queue);removeEventListener('resize',queue);};
 },[reduced]);
 // drag and keys move the page when the stage is scroll-driven, so scroll stays the one source of time
 const setTime=time=>{
  time=clamp(time,0,DUR);
  if(reduced){paint.current(time);return;}
  const scroller=scrollerOf(track.current),r=track.current.getBoundingClientRect(),range=r.height-viewH(scroller);
  const top=(scroller===window?scrollY:scroller.scrollTop)+r.top+(.03+time/DUR*.94)*range;
  paint.current(time);manual.current=top;
  scroller.scrollTo({top,behavior:'instant'});
 };
 const drag=useRef(false);
 const at=x=>{const r=plot.current.getBoundingClientRect();return clamp((x-r.left)/r.width)*DUR;};
 const shots=[0,...film.cuts,DUR];
 const remapPts=[[0,0],...SPANS.map(s=>[s.start+s.len,s.to])].map(([a,b])=>`${a},${BUILT-b}`).join(' ');
 return <>
  <div ref={track} className="xs-rm">
   <div ref={stage} className="xs-rm-stage">
    <div className="xs-rm-read" aria-hidden="true">
     <div className="is-big"><span className="xs-mono">{t.out}</span><b><span ref={el=>{R.current.out=el;}}>0.00</span><small>s</small></b><span className="xs-mono">{t.frame||'Fr'} <span ref={el=>{R.current.fr=el;}}>0000</span></span></div>
     <i className="xs-rm-arrow">→</i>
     <div className="is-big"><span className="xs-mono">{t.film}</span><b><span ref={el=>{R.current.film=el;}}>0.000</span><small>s</small></b></div>
     <div><span className="xs-mono">{t.speed}</span><b className="is-red" ref={el=>{R.current.speed=el;}}>92%</b></div>
     <div><span className="xs-mono">{t.span}</span><b ref={el=>{R.current.span=el;}}>1 / 5</b></div>
    </div>
    <div className="xs-rm-chart">
     <span className="xs-rm-ay xs-mono">{t.axisY}</span>
     <div className="xs-rm-yt" aria-hidden="true">{[0,5,10,15,20,25].map(v=><span key={v} style={{top:(1-v/BUILT)*100+'%'}}>{v}</span>)}<span style={{top:0}}>27</span></div>
     <div ref={plot} className="xs-rm-plot" role="slider" tabIndex={0} aria-label={t.rmAria} aria-valuemin={0} aria-valuemax={FRAMES-1}
      onPointerDown={e=>{if(e.button>0)return;drag.current=true;e.currentTarget.setPointerCapture?.(e.pointerId);setTime(at(e.clientX));}}
      onPointerMove={e=>{if(drag.current)setTime(at(e.clientX));}} onPointerUp={()=>{drag.current=false;}} onPointerCancel={()=>{drag.current=false;}}
      onKeyDown={e=>{const f=stepKey(e,Math.round(Math.max(0,st.current.t)*FPS),FRAMES-1);if(f!==null)setTime(f/FPS);}}>
      <svg viewBox={`0 0 ${DUR} ${BUILT}`} preserveAspectRatio="none" aria-hidden="true">
       {SPANS.map((s,i)=><rect key={i} className="xs-rm-band" data-i={i} x={s.start} y={0} width={s.len} height={BUILT}/>)}
       {[5,10,15,20,25].map(v=><line key={'x'+v} className="xs-grid" x1={v} x2={v} y1={0} y2={BUILT}/>)}
       {[5,10,15,20,25].map(v=><line key={'y'+v} className="xs-grid" x1={0} x2={DUR} y1={BUILT-v} y2={BUILT-v}/>)}
       {film.cuts.map(c=><line key={c} className="xs-cut is-faint" x1={c} x2={c} y1={0} y2={BUILT}/>)}
       <line className="xs-rm-built" x1={0} y1={BUILT} x2={BUILT} y2={0}/>
       <polyline className="xs-rm-line" points={remapPts}/>
      </svg>
      <span className="xs-rm-lab is-built xs-mono" style={{left:BUILT/DUR*100+'%'}}>{t.asBuilt}</span>
      <span className="xs-rm-lab is-new xs-mono">{t.retimed}</span>
      <i ref={vx} className="xs-rm-vx" aria-hidden="true"/><i ref={hy} className="xs-rm-hy" aria-hidden="true"/>
      <i ref={dot} className="xs-rm-dot" aria-hidden="true"/>
     </div>
     <div className="xs-rm-speeds" aria-hidden="true">{SPANS.map((s,i)=><span key={i} data-i={i} style={{left:s.start/DUR*100+'%',width:s.len/DUR*100+'%'}}>{pct(s.speed)}</span>)}</div>
     <div className="xs-axis xs-rm-xt" aria-hidden="true">{[0,5,10,15,20,25].map(x=><span key={x} className={x===0?'is-start':undefined} style={{left:x/DUR*100+'%'}}>{x}</span>)}<span className="is-end" style={{left:'100%'}}>29.2</span></div>
     <span className="xs-rm-ax xs-mono">{t.axisX}</span>
    </div>
    <div className="xs-rm-sheet" aria-hidden="true">
     <div className="xs-row is-head">{t.cols.map(c=><span key={c}>{c}</span>)}</div>
     <div className="xs-rm-rows">{Array.from({length:ROWS},(_,k)=><div key={k} ref={el=>{rows.current[k]=el;}} className={'xs-row'+(k===MID?' is-now':'')} data-k={k}><span/><span/><span/><span/><span/></div>)}</div>
    </div>
    <p className="xs-rm-hint xs-mono">{reduced?t.hintStill:t.hint}</p>
    <div className="xs-rm-shots" aria-hidden="true">{shots.slice(0,-1).map((s,i)=><i key={s} style={{left:s/DUR*100+'%'}}/>)}</div>
   </div>
  </div>
  <Reveal as="figure" className="xs-table-wrap">
   <table className="xs-table">
    <caption className="xs-mono">{t.tableCap}</caption>
    <thead><tr>{t.tableHead.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{SPANS.map((s,i)=><tr key={i}><th scope="row">{pad(i+1)}</th><td>{s.from}–{s.to} s</td><td>{s.len} s</td><td>{Math.round(s.len*FPS)}</td><td className={s.speed<1?'is-slow':s.speed>1?'is-fast':undefined}>{pct(s.speed)}</td><td>{t.spanNotes[i]}</td></tr>)}</tbody>
    <tfoot><tr><th scope="row">Σ</th><td>0–27 s</td><td>29.2 s</td><td>1,752</td><td/><td/></tr></tfoot>
   </table>
  </Reveal>
  <div className="xs-results">
   <p className="xs-mono xs-k">{t.after}</p>
   <ul>{t.res.map(([n,s],i)=><Reveal as="li" key={i} delay={i*90}><b>{n}</b><span>{s}</span></Reveal>)}</ul>
  </div>
 </>;
}

/* ---------- SC 05: the leap ---------- */

function Leap({film,t,L,onPlay}){
 const root=useRef(null),[near,setNear]=useState(false),inView=useInView(root,{threshold:.25});
 const [fr,setFr]=useState(Math.round(M.pinAt.red*FPS)),[sig,setSig]=useState(2);
 const [from,to]=film.flip,N=24,F0=Math.round(from*FPS),F1=Math.round(to*FPS);
 useEffect(()=>{const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setNear(true);io.disconnect();}},{rootMargin:'700px 0px'});io.observe(root.current);return()=>io.disconnect();},[]);
 const time=fr/FPS,flip=clamp(Math.round((time-from)/(to-from)*(N-1)),0,N-1);
 const pins=M.pin,P0=pins[0][0],P1=pins[pins.length-1][0];
 const cur=pins[clamp(fr-P0,0,pins.length-1)];
 const firstRed=pins.find(p=>p[3]>.5)[0],red=fr>=firstRed;
 const cam=M.cam.flow,C0=84,C1=180,CM=Math.max(...cam.slice(C0,C1));
 const camLine='M'+cam.slice(C0,C1).map((v,i)=>`${C0+i+1},${(1-v/CM).toFixed(4)}`).join('L');
 const marks=[[t.lift,M.pinAt.lift],[t.red,firstRed/FPS],[t.land,M.pinAt.land]];
 const keyFrames=film.signature.map(s=>Math.round(s.t*FPS));
 const set=f=>{setFr(clamp(f,F0,F1));setSig(keyFrames.indexOf(f));};
 return <div ref={root} className={'xs-leap'+(inView?' is-in':'')}>
  <div className="xs-leap-view">
   <div className="xs-leap-frame">
    {near&&Array.from({length:N},(_,i)=><img key={'f'+i} src={`${MEDIA}/flip-${pad(i+1)}.webp`} alt="" decoding="async" data-on={sig<0&&i===flip?'':undefined}/>)}
    {near&&film.signature.map((s,i)=><img key={'s'+i} src={`${MEDIA}/sig-${i+1}.webp`} alt="" decoding="async" data-on={sig===i?'':undefined}/>)}
    <span className="xs-leap-tc xs-mono">{t.frame} {pad(fr,4)} · {time.toFixed(3)} s</span>
   </div>
   <label className="xs-range is-wide"><span className="xs-mono">{t.scrub}</span>
    <input type="range" min={F0} max={F1} step="1" value={fr} onChange={e=>set(+e.target.value)} aria-valuetext={`${time.toFixed(2)} s`}/>
   </label>
   <p className="xs-cap">{t.stills}</p>
   <ol className="xs-keys">{film.signature.map((s,i)=><li key={i}><button type="button" aria-pressed={sig===i} onClick={()=>set(keyFrames[i])}><b className="xs-mono">{t.frame} {pad(keyFrames[i],4)}</b><span>{s.label[L]}</span></button></li>)}</ol>
   <button type="button" className="xs-link" onClick={()=>onPlay(1.5)}>{t.playIn}</button>
  </div>
  <div className="xs-leap-side">
   <figure className="xs-arc">
    <svg viewBox="52 44 236 176" aria-hidden="true">
     <path className="xs-arc-path" d={'M'+pins.map(p=>p[1]+','+p[2]).join('L')}/>
     <rect className="xs-arc-garage" x={60} y={92} width={42} height={20} rx={3}/><text className="xs-arc-t" x={81} y={124}>{t.garage}</text>
     <rect className="xs-arc-door" x={242} y={204} width={26} height={14} rx={3}/><text className="xs-arc-t is-door" x={255} y={214.5}>214</text>
     {pins.map((p,i)=><circle key={p[0]} className={'xs-arc-dot'+(p[3]>.5?' is-red':'')+(p[0]===cur[0]?' is-on':'')} cx={p[1]} cy={p[2]} r={p[0]===cur[0]?3.6:2.1} style={{'--i':i}}/>)}
     <g className={'xs-arc-pin'+(red?' is-red':'')} style={{transform:`translate(${cur[1]}px,${cur[2]}px)`}}><path d="M0 0C-1.6-4.6-7-7.8-7-13.4A7 7 0 1 1 7-13.4C7-7.8 1.6-4.6 0 0Z"/><circle cx="0" cy="-13.4" r="2.6"/></g>
    </svg>
    <figcaption className="xs-cap">{t.dotsCap}</figcaption>
   </figure>
   <figure className="xs-camspark">
    <figcaption className="xs-mono">{t.camCap}</figcaption>
    <div className="xs-camspark-plot">
     <svg viewBox={`${C0} 0 ${C1-C0} 1`} preserveAspectRatio="none" aria-hidden="true">
      <rect className="xs-shade" x={M.pinAt.lift*FPS} y={0} width={(M.pinAt.land-M.pinAt.lift)*FPS} height={1}/>
      <path className="xs-line is-flow" d={camLine}/>
      <line className="xs-key" x1={fr} x2={fr} y1={0} y2={1}/>
     </svg>
     {marks.map(([k,s])=><span key={k} className="xs-mono" style={{left:(s*FPS-C0)/(C1-C0)*100+'%'}}>{k}<small>{s.toFixed(3)}</small></span>)}
    </div>
   </figure>
  </div>
 </div>;
}

/* ---------- the page ---------- */

export default function LastHundredFeetPage({lang,reduced,onNavigate,slug='last-100-feet'}){
 const film=FILMS[slug]||FILMS['last-100-feet'],en=lang==='en',L=en?'en':'zh',t=en?EN:ZH;
 const video=useRef(null),desk=useRef(null);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 const watch=time=>{
  const v=video.current;if(!v)return;
  if(typeof time==='number')v.currentTime=time;
  v.play().catch(()=>{});
  desk.current?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
 };
 const src='/video/'+film.stem+'-film.mp4';
 return <article key={slug} className={'xs-page'+(reduced?' st-still':'')} data-nav-tone="light" style={{'--accent':film.accent}}>
  <Title film={film} t={t} go={go} onWatch={watch} reduced={reduced}/>
  <div className="xs-wrap">
   <Scene n={1} k={t.s1k} id="xs-s1"><FirstCut film={film} t={t} L={L} reduced={reduced}/></Scene>
   <Scene n={2} k={t.s2k} id="xs-s2"><Review film={film} t={t} L={L}/></Scene>
   <Scene n={3} k={t.s3k} id="xs-s3"><Causes t={t} reduced={reduced}/></Scene>
   <Scene n={4} k={t.s4k} id="xs-s4" className="xs-sc-remap">
    <Head k={t.s4k} h={t.s4h} id="xs-s4"><p className="xs-p">{t.s4p1}</p><p className="xs-p">{t.s4p2}</p></Head>
    <Remap film={film} t={t} reduced={reduced}/>
   </Scene>
   <Scene n={5} k={t.s5k} id="xs-s5">
    <Head k={t.s5k} h={t.s5h} id="xs-s5"><p className="xs-p">{t.s5p}</p></Head>
    <Leap film={film} t={t} L={L} onPlay={watch}/>
   </Scene>
   <Scene n={6} k={t.s6k} id="xs-s6">
    <Head k={t.s6k} h={t.s6h} id="xs-s6"><p className="xs-p">{t.s6p}</p></Head>
    <div ref={desk} className="xs-desk" data-nav-tone="dark"><Desk film={film} slug={slug} lang={L} video={video}/></div>
    <div className="xs-desk-links"><a className="xs-link" href={src} target="_blank" rel="noopener noreferrer">{t.open} ↗</a></div>
    <p className="xs-fine">{t.fine}</p>
   </Scene>
   <NextProject item={nextAfter(slug)} lang={L} onNavigate={onNavigate}/>
   <footer className="st-footer xs-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{t.footer}</p></footer>
  </div>
 </article>;
}
