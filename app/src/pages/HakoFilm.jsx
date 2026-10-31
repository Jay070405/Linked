import {useEffect,useMemo,useRef,useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import EDIT from './hako-edit.json';
import {nextAfter} from './product-films-data';
import {Hero,SectionHead,Statement,Reveal,NextProject,useInView} from './story/Story';
import './brand-motion.css';
import './hako-film.css';
import './film-case.css';
import './hako-reel.css';
import './hako-tech.css';

// How the Hako launch film was made, told through sound and picture. Every number on this page comes from the film's
// own project (aigc-vibecoding/saas-film): the music plan and time warp (scripts/music-plans.mjs, src/film/warp.ts),
// the foley cue sheet and its review rounds (scripts/sfx-cues.mjs, sfx.mjs, research/sfx-review.md), the camera
// (src/film/camera.ts, src/kit/motion.ts track(), scripts/camspeed.ts) and the per-frame motion read from the final
// render (hako-edit.json). The sounds are the film's own CC0 recordings, trimmed the way sfx.mjs trims them; the
// "in the film" buttons play the delivered film's audio track.
const media='/assets/other-project/hako';
const film=media+'/hako.mp4',MIX=media+'/hako-mix.m4a',SFX=media+'/sfx/';
const DUR=50,FPS=60,SONG=173.28;
const pos=t=>t/DUR*100+'%';
const span=(a,b)=>({left:pos(a),width:(b-a)/DUR*100+'%'});
const clock=t=>{const f=Math.min(Math.round(t*FPS),DUR*FPS),s=Math.floor(f/FPS);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%FPS).padStart(2,'0');};
const sec=t=>'00:'+t.toFixed(1).padStart(4,'0');
const mmss=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const hz=m=>440*2**((m-69)/12);

/* ── data generated from the project (see the header) ─────────────────────────────────────────────────────────── */
// WARP_D: d(t) = W(t) − t of warp A every 0.1 s, in tenths of a millisecond (warp.ts run on music-sync.json)
// CAM_SPEED: camspeed.ts's measure per output frame through the warp, max of each 5 frames, px/frame × 10
// KEY08_ENV: the raw key-08 recording, 2 ms bins, dB over −60 re its peak
// PEAKS: [seconds shown, 56 bins 0–99] per recording; SPECS: 52 × 40 spectrogram cells, base 36, −60…0 dB
const WARP_D=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,5,8,11,15,19,24,29,35,41,47,53,60,67,74,80,87,94,101,108,115,121,128,135,142,149,155,162,169,176,183,189,196,203,210,217,223,230,237,244,251,257,264,271,278,285,292,298,305,312,319,326,333,339,346,353,360,367,374,381,388,395,402,409,416,423,430,437,444,452,459,466,473,480,488,495,503,510,517,525,532,540,548,555,563,571,578,586,594,602,610,618,626,634,642,650,658,667,675,684,692,701,709,718,726,735,744,753,762,771,780,789,798,825,921,1000,1035,1065,1087,1084,1048,1000,953,908,863,818,771,724,675,624,570,515,457,397,335,271,205,138,70,1,-68,-137,-205,-272,-338,-402,-463,-522,-578,-630,-678,-722,-761,-796,-826,-852,-872,-888,-899,-907,-910,-909,-906,-900,-891,-880,-867,-851,-834,-815,-795,-773,-750,-726,-702,-676,-650,-623,-595,-567,-539,-510,-481,-452,-423,-394,-364,-335,-305,-276,-246,-216,-187,-157,-128,-98,-69,-39,-10,20,49,79,109,139,169,199,229,260,290,321,352,384,415,447,479,512,545,578,611,644,678,712,746,780,815,849,884,919,953,987,1022,1055,1089,1122,1154,1186,1217,1247,1275,1303,1329,1354,1376,1397,1416,1433,1448,1460,1471,1479,1486,1492,1495,1498,1499,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500,1500];
const CAM_SPEED=[78,84,86,86,83,219,234,218,223,224,221,212,197,177,153,127,100,76,56,42,33,28,25,25,26,28,30,31,32,32,32,31,30,28,26,25,24,27,31,40,56,77,99,120,137,148,151,153,150,137,119,98,77,87,104,120,135,146,151,150,155,157,157,155,151,143,132,119,103,86,47,52,56,61,64,68,70,72,73,73,73,71,69,66,62,57,51,45,40,36,45,64,82,109,129,146,161,173,181,185,186,185,182,175,163,146,124,98,70,44,22,14,15,16,18,19,20,22,23,24,25,26,26,119,142,158,166,167,162,154,142,128,118,126,144,162,174,178,177,169,134,111,100,120,147,168,179,180,175,158,132,102,73,54,45,43,44,33,34,35,35,36,36,36,36,36,36,36,35,32,32,31,30,29,28,27,27,26,25,25,25,25,25,26,26,28,29,32,35,37,40,43,46,48,50,52,53,53,53,53,53,51,50,48,45,42,39,35,31,27,23,8,10,11,13,15,17,19,20,21,22,23,24,24,24,24,24,24,23,22,21,20,19,17,15,13,12,10,9,12,14,16,19,21,23,24,26,27,28,29,29,29,29,28,28,27,26,25,24,23,22,21,20,20,21,22,22,23,24,25,27,28,36,37,38,39,39,39,39,38,38,37,35,34,32,30,28,25,23,21,19,16,15,14,12,11,10,9,9,9,9,9,9,9,10,10,10,11,11,11,11,11,11,11,10,10,10,9,9,8,8,8,7,7,8,8,9,10,11,13,15,17,19,20,22,22,22,22,22,20,19,17,15,14,13,12,11,9,9,10,12,14,15,17,18,19,20,20,20,21,21,21,21,21,21,20,20,20,20,19,18,17,16,19,23,28,35,43,51,58,66,66,79,81,81,77,68,57,49,50,66,56,58,64,70,73,73,69,60,47,36,27,21,16,17,17,17,17,17,16,15,16,18,22,32,63,116,179,236,272,282,282,279,274,267,259,255,255,259,265,267,260,229,169,102,47,29,32,43,51,57,60,61,59,53,40,25,15,17,22,25,27,27,25,22,17,12,11,16,20,23,25,26,27,27,26,26,25,24,24,26,34,53,77,90,95,104,120,132,141,149,155,160,164,167,168,168,168,167,164,161,157,153,147,141,134,127,120,112,104,96,88,80,71,63,56,48,41,34,28,23,18,15,13,13,18,36,62,91,120,145,165,178,183,183,178,167,148,125,99,72,47,27,14,13,13,13,13,13,13,13,13,13,13,13,13,13,13,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12];
const KEY08_ENV=[36,23,23,22,24,22,22,27,25,20,21,21,22,23,20,20,21,18,19,16,19,17,18,18,15,13,32,58,60,57,58,52,47,54,50,43,42,37,39,37,37,37,36,34,35,35,30,35,29,32,34,33,33,34,29,31,28,29,31,29];
const PEAKS={"kenney-ui-click1":[0.082,[14,52,42,28,58,99,30,9,10,11,6,5,3,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-30":[0.231,[35,18,99,30,18,9,6,4,6,5,4,5,4,3,4,4,4,3,3,3,3,4,3,38,31,17,18,4,5,4,3,2,3,2,3,2,2,2,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0]],"key-01":[0.215,[99,49,24,12,6,5,5,4,5,3,3,2,2,2,3,1,1,1,1,1,1,1,1,1,8,7,3,1,3,2,5,18,19,14,8,4,3,2,2,2,1,2,2,1,2,1,1,1,1,1,0,1,1,0,0,0]],"key-04":[0.238,[47,99,11,7,5,17,10,6,5,4,3,2,3,2,2,2,2,2,1,1,1,2,5,4,9,6,3,2,1,2,1,1,2,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-05":[0.224,[49,99,30,22,30,15,13,10,5,7,8,5,5,3,6,3,3,3,2,2,2,2,2,1,2,3,57,27,22,10,5,7,4,5,5,4,3,4,3,2,2,2,1,2,1,1,1,1,1,1,1,0,1,0,0,0]],"key-06":[0.242,[99,58,58,52,16,8,9,7,8,5,5,5,4,4,3,4,3,7,10,33,14,14,5,4,4,3,3,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-07":[0.245,[99,85,23,26,12,9,6,5,5,5,4,4,3,4,6,11,47,11,4,5,3,3,3,4,3,2,2,3,1,2,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-13":[0.238,[38,99,18,15,8,5,6,4,6,5,5,4,2,2,3,2,2,2,3,2,1,2,2,1,12,7,3,3,2,2,1,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-16":[0.181,[33,99,39,18,9,8,20,13,10,4,7,5,4,4,4,3,3,3,3,3,3,2,2,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,20,14,7,4,3,2,3,2,2,2,2,2,1,2,1,1,1,1]],"key-18":[0.231,[64,99,66,26,15,35,15,10,11,6,5,6,5,4,5,4,4,2,2,2,2,2,3,3,2,22,14,8,5,6,4,3,4,4,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0]],"key-19":[0.223,[29,99,64,19,7,6,6,4,4,3,3,3,2,2,2,2,3,9,8,41,28,12,5,3,3,3,2,2,2,1,2,2,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"key-22":[0.214,[53,85,99,24,13,8,6,7,7,5,4,5,4,3,3,3,2,2,2,2,2,1,1,1,1,1,1,1,1,3,12,8,7,3,4,2,3,2,2,3,3,2,1,2,2,1,1,1,1,1,1,1,1,0,0,0]],"key-23":[0.186,[37,93,99,40,29,16,12,9,14,10,9,5,5,7,16,7,5,14,7,4,5,4,3,2,2,2,2,2,1,1,1,1,3,3,10,9,6,3,5,5,3,3,3,2,3,3,2,2,2,2,2,2,1,2,1,1]],"key-32":[0.194,[86,99,33,16,51,32,14,9,8,7,6,5,4,5,5,4,4,3,3,3,6,7,2,2,2,1,4,3,2,23,26,11,6,6,6,4,5,2,2,4,5,3,3,2,2,3,2,1,2,1,2,2,1,1,1,1]],"key-10":[0.195,[60,50,42,99,50,20,12,12,11,8,7,6,6,5,4,6,4,3,5,3,4,4,3,17,19,18,19,8,16,6,4,4,4,3,2,3,3,2,2,3,2,2,2,2,1,2,1,1,1,1,1,1,1,0,1,0]],"key-31":[0.207,[66,65,99,88,28,14,12,13,11,14,9,9,9,10,5,9,14,6,6,5,5,5,4,6,4,10,16,10,10,9,6,4,6,4,6,3,11,7,4,4,3,3,3,3,1,2,2,1,2,1,1,1,1,1,1,1]],"vsco-marimba-G5":[0.9,[99,91,65,57,54,48,46,38,36,36,35,30,28,26,23,23,22,20,18,16,16,15,13,12,11,10,9,8,7,7,6,5,5,5,4,4,3,3,3,3,2,2,2,2,1,1,1,1,1,0,0,0,0,0,0,0]],"vsco-marimba-B5":[0.9,[99,98,87,72,67,64,51,49,50,43,39,36,30,27,24,22,19,18,15,13,13,12,10,8,7,6,6,6,5,5,4,3,3,3,3,2,2,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0]],"vsco-marimba-F6":[0.9,[80,99,68,44,57,63,50,39,26,25,25,21,19,15,14,13,13,13,8,8,8,7,5,4,5,6,5,4,4,3,3,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0]],"vsco-marimba-C7":[0.9,[99,54,49,37,21,20,11,10,6,6,5,7,3,3,4,4,4,3,3,2,2,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"kenney-rpg-bookClose":[0.157,[74,99,84,31,22,18,26,31,17,12,15,11,12,8,9,7,7,6,10,7,9,7,9,4,6,7,3,7,9,9,8,9,6,7,3,7,4,2,4,5,4,5,4,2,2,5,4,1,1,2,2,2,1,2,1,1]],"kenney-rpg-bookPlace1":[0.226,[38,22,96,92,99,89,45,30,13,17,8,8,9,6,5,7,7,7,4,3,4,2,3,6,5,3,4,3,2,3,2,1,1,2,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"kenney-rpg-bookPlace3":[0.25,[64,30,43,13,8,51,99,89,69,40,24,26,31,15,15,11,14,10,12,12,10,8,7,10,8,10,6,6,5,5,7,5,2,3,3,2,2,2,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0]],"pop-ezd-9":[0.086,[3,98,99,98,98,97,98,91,70,53,46,39,32,28,23,16,17,16,9,9,10,10,9,9,7,5,6,8,5,7,6,2,1,3,3,3,3,3,3,3,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1]],"pop-ezd-8":[0.09,[14,97,98,98,99,99,99,98,98,91,67,55,50,40,34,30,25,21,13,14,13,9,6,5,3,4,4,5,5,4,4,4,3,3,3,2,3,2,2,2,2,3,2,3,2,2,1,1,1,1,1,1,1,1,1,1]],"pop-ezd-3":[0.125,[56,99,99,99,66,49,43,22,16,9,5,4,7,4,4,4,2,4,4,4,3,3,2,3,4,4,3,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,0,1]],"pop-ezd-4":[0.084,[0,48,98,99,96,84,66,53,46,37,31,27,23,20,17,15,15,13,11,9,8,7,4,3,5,7,6,6,4,2,2,4,3,2,1,3,3,3,2,1,2,1,2,3,2,1,1,1,2,2,2,1,1,1,1,1]],"kenney-drop_003":[0.188,[68,61,50,42,35,28,23,18,16,13,11,9,7,6,5,4,4,3,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]],"kenney-pluck_001":[0.1,[35,70,73,55,44,39,40,32,28,26,26,23,18,16,14,16,12,10,10,9,9,7,7,6,6,5,4,4,4,3,3,3,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0]]};
const SPECS={"synth":"976554014599fszuda530000000000000000000011100000043bdryuc50200000000000000000000000000000448drytb80200000000000000000000000000102159cqxsa30000000000000000000000000000011239bpwsb60000000000000000000000000000010142cowr9000000000000000000000000000000100269nvr4200000000000000000000000000000000227nuq7100000000000000000000000000000000037muq6000000000000000000000000000000000026ltp4000000000000000000000000000000000025kso5000000000000000000000000000000000005jro4000000000000000000000000000000000014jrn3000000000000000000000000000000000003iqn3000000000000000000000000000000000003hpm0000000000000000000000000000000000001gpl1000000000000000000000000000000000001fol1000000000000000000000000000000000000enk0000000000000000000000000000000000000dnj0000000000000000000000000000000000000dmj0000000000000000000000000000000000000cli0000000000000000000000000000000000000bli0000000000000000000000000000000000000akh00000000000000000000000000000000000009jg00000000000000000000000000000000000008jg00000000000000000000000000000000000007if00000000000000000000000000000000000007he00000000000000000000000000000000000006he00000000000000000000000000000000000005gd00000000000000000000000000000000000004fd00000000000000000000000000000000000004fc00000000000000000000000000000000000003eb00000000000000000000000000000000000002db00000000000000000000000000000000000001ca00000000000000000000000000000000000000ca00000000000000000000000000000000000000b900000000000000000000000000000000000000a800000000000000000000000000000000000000a800000000000000000000000000000000000000970000000000000000000000000000000000000086000000000000000000000000000000000000008600000000000000000000000000000000000000750000000000000000000000000000000000000064000000000000000000000000000000000000006400000000000000000000000000000000000000530000000000000000000000000000000000000043000000000000000000000000000000000000003200000000000000000000000000000000000000310000000000000000000000000000000000000020000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","pop":"edc8adfeeiikmsyztda9dddelm3a8b86a5752101bb974889acceksyxrf66cb86hj28496372320000aa9747787bddmuwvpe54ba50bd04253010000000678877558abcnuvrld3497202200000000000000157887349a9boutlg62472000000000000000000556666529a5cptpic50430000000000000000000555256517a79qrlif402000000000000000000005420355069acppjie400000000000000000000004111244267chonjgd000000000000000000000002201344236cjolhgc010000000000000000000000000233045ajnkffb120000000000000000000000000111135ajmkeg71200000000000000000000000000003569hljgh50100000000000000000000000110003675hkhii41000000000000000000000000110003664hjeii63000000000000000000000001110002466hidii92000000000000000000000000000000249ghcigb1000000000000000000000000000000139fgahec1000000000000000000000000000000259de8gdc1000000000000000000000000000000379dd5efb1000000000000000000000000000000489dd9bfa000000000000000000000001011000058adc99f90000000000000000000000011111000578cbaaf70000000000000000000000000122210575b8abe70000000000000000000000000012222567a69bd70000000000000000000000000001222258867bc50000000000000000000000000000122047776bb300000000000000000000000000000110365669a000000000000000000000000000000000231668900000000000000000000000000000000011067680000000000000000000000000000000001007857000000000000000000000000000000000100685600000000000000000000000000000000000057550000000000000000000000000000000000004654000000000000000000000000000000000000133200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"};

// cuts on exact frames: the 3D↔2D mark swaps at 44.417 and 46.05 are cuts too
const SHOTS=[0,.45,5.85,10.3,13.05,17.6,19.9,31.9,32.5,44.417,46.05,DUR];
const BEATS=[
 {to:.45,name:'Key',camera:{en:'Macro on a 3D keycap',zh:'3D 键帽特写'},built:{en:'A 3D keycap, lit and framed as a macro. The B key bottoms out at 0.22 s. It is the only sound before the music, a heavy key recording slowed to 0.84×.',zh:'一颗 3D 键帽，按微距打光和构图。B 键在 0.22 秒按到底，这是音乐进来前唯一的声音，用的是一颗重键的录音，放慢到 0.84 倍。'}},
 {to:5.85,name:'Draw',camera:{en:'Pulls back with the drag, easing into a pan',zh:'跟着拖拽拉远，顺势转成横移'},built:{en:'Cut on frame 27, with the song’s first note. The drag snaps onto a guide, three corner handles tick at least 50 ms apart, and a camera key at 3.4 s keeps the camera easing out, so the frame never goes still.',zh:'在第 27 帧切入，正好是歌的第一个音。拖拽吸附到参考线上，三个角点依次响一下，间隔不小于 50 毫秒。3.4 秒处加了一个镜头关键帧，让镜头一直在缓出，画面不会停住。'}},
 {to:10.3,name:'Build',camera:{en:'Macro on the prompt, then a pull-back with a focus pull',zh:'先特写提示框，再拉远并转移焦点'},built:{en:'Cut on frame 351, with the first typed character. The text types at 22 characters a second; about 11 a second are heard. The Build click lands on the band’s entrance at 7.65 s, where the x axis turns while y keeps rising, so the camera doesn’t stop.',zh:'在第 351 帧切入，正好是第一个字符出现。画面上每秒打 22 个字符，声音只保留大约 11 个。Build 的点击落在 7.65 秒乐队进来的位置；这里 x 轴转向，y 轴继续上升，镜头不会停住。'}},
 {to:13.05,name:'Metrics',camera:{en:'One steep macro on a rounded U-turn',zh:'一个大倾角特写，走一条圆滑的 U 形路线'},built:{en:'One macro move on five keys, along the numbers and then in a rounded U-turn onto the curve. It only moves down, so it carries its speed through the turn. Each ✓ is a marimba note picked against the harmony under it.',zh:'一个特写运镜，五个关键帧。先沿着数字走，再绕一个圆滑的 U 形落到曲线上。镜头只往下走，所以转弯时速度不会掉。每个 ✓ 是一个马林巴音，按当时的和声来选。'}},
 {to:17.6,name:'Team',camera:{en:'One push from wide into medium',zh:'从全景一路推到中景'},built:{en:'Cut on frame 783, on the beat grid. The headline is billboarded and swaps its words in place on the beat at 15.15 s while one push runs from wide to medium.',zh:'在第 783 帧切入，落在节拍网格上。标题始终朝向镜头，在 15.15 秒的拍点上原地换词，同时一个推镜从全景推到中景。'}},
 {to:19.9,name:'Comment',camera:{en:'Macro, its pitch easing from 15° to 11.25°',zh:'特写，俯仰角从 15° 缓到 11.25°'},built:{en:'The macro’s pitch eases down to 11.25° so the interface type stops leaning into italic. When Mia types, only every other character sounds; Ren’s switch lands on the music’s hit.',zh:'特写的俯仰角缓到 11.25°，界面文字就不会被拉成斜体。Mia 打字时只有隔一个字符才出一次声；Ren 的开关正好落在音乐的重音上。'}},
 {to:31.124,name:'Layers',camera:{en:'One continuous take: rise, turn, descend',zh:'一镜到底：升起、环绕、落下'},built:{en:'One continuous take through the dark stage. The roll turns once and peaks near 3.7°/s; an earlier version swung at 30°/s. The song’s first join (22.04 s) opens the act.',zh:'一镜到底穿过暗场。横滚只转一次，峰值约每秒 3.7°；早先的版本达到每秒 30°。歌的第一个接口（22.04 秒）是这一段的开头。'}},
 {to:39.327,name:'Ship',camera:{en:'Continuous, with one cut-in on the button',zh:'连续运镜，中间切一个按钮特写'},built:{en:'The chorus lands on the select click; Ship sits on beat 2 with a 250 Hz book knock under it and a 2 dB dip in the music. The cut-in to the button is pinned to frames, and on the deploy trip the camera follows the box itself.',zh:'副歌落在选中的点击上；Ship 落在第 2 拍，底下垫一记 250 Hz 的书本敲击，音乐同时压低 2 dB。按钮特写的切入切出都在整帧上；送达途中，镜头直接跟着盒子走。'}},
 {to:43.398,name:'Scale',camera:{en:'Dolly out',zh:'后拉揭示'},built:{en:'The pull-back hands over to an analytic camera curve. Sampling it into keys had added jerk (0.19 against 0.06). The marquee click gets a book-knock body and a 1.5 dB dip.',zh:'后拉的镜头改用一条解析的运动曲线，没有用采样出来的关键帧，因为采样会增加急动度（0.19，对比 0.06）。大框选的点击垫了书本敲击，音乐压低 1.5 dB。'}},
 {to:DUR,name:'Mark',camera:{en:'Match cut on the shape, then flat',zh:'形状匹配剪辑，再切到平面'},built:{en:'The mark swaps 3D↔2D twice, each swap pinned to a frame (44.42 and 46.05 s). The B key sound from the opening comes back here, and the flat mark lands on the outro’s first attack.',zh:'标志在 3D 和 2D 之间切换两次，每次都在整帧上（44.42 和 46.05 秒）。片头 B 键的声音在这里再出现一次；平面标志落在尾声的第一个起音上。'}},
];
const HEADLINES=[[.6,4.1,'Draw a box.'],[13.1,14.7,'Hako builds what’s inside.'],[15.15,16.55,'With your team.'],[19.2,21.95,'And your agents.'],[25.2,27.4,'Every layer, production-ready.'],[37.53,39.33,'Ship a product.'],[46.15,DUR,'hako · Draw a box. Ship a product.']];
// track A: four pieces of the 2:53 song, joined on the beat ([film from, film to, song from, song to])
const MUSIC=[[.33,22.041,0,21.711],[22.041,29.241,108.111,115.311],[29.241,36.441,117.711,124.911],[36.441,DUR,144.121,157.68]];
// each join's score from scripts/cutsearch.mjs (out of 3), as noted in music-plans.mjs
const JOINS=[[22.041,'1.62'],[29.241,'1.81'],[36.441,'2.14']];
const FAMILIES=[
 {id:'click',color:'#f2f0eb',h:.78,label:{en:'Mouse clicks',zh:'鼠标点击'}},
 {id:'key',color:'#9a9aa6',h:.5,label:{en:'Keyboard',zh:'键盘'}},
 {id:'marimba',color:'#e8a21a',h:.64,label:{en:'Marimba',zh:'马林巴'}},
 {id:'body',color:'#0fa3a3',h:1,label:{en:'Book & box knocks',zh:'书本与盒子'}},
 {id:'pop',color:'#e8467c',h:.9,label:{en:'Mouth pops',zh:'嘴巴“啵”声'}},
].map(f=>({...f,count:EDIT.cues.filter(c=>c[1]===f.id).length}));
const COLOR=Object.fromEntries(FAMILIES.map(f=>[f.id,f]));

// the seven hits warp A pins the picture to: [output time of the hit, film time of the picture event, where that event
// lands after the warp] (music-sync.json anchors; the flat mark is a frame-locked swap, so it is pinned to frame 2763)
const HITS=[
 {o:.45,f:.45,out:.45,img:'f0027',music:{en:'the first note',zh:'第一个音'},picture:{en:'The cut to the drag',zh:'切到拖拽'}},
 {o:7.65,f:7.65,out:7.65,img:'f0459',music:{en:'the band coming in',zh:'乐队进来'},picture:{en:'The Build click',zh:'点击 Build'}},
 {o:22.041,f:22.05,out:22.041,img:'f1323',music:{en:'the breakdown (join 1)',zh:'间奏（第 1 个接口）'},picture:{en:'Hand-over to the dark stage',zh:'交给暗场段落'}},
 {o:31.62,f:31.7,out:31.62,img:'f1897',music:{en:'the chorus landing',zh:'副歌落下'},picture:{en:'The select click',zh:'选中的点击'}},
 {o:32.241,f:32.35,out:32.241,img:'f1935',music:{en:'beat 2 of the chorus',zh:'副歌第 2 拍'},picture:{en:'The Ship click',zh:'点击 Ship'}},
 {o:36.441,f:36.35,out:36.441,img:'f2187',music:{en:'the last chorus (join 3)',zh:'最后一段副歌（第 3 个接口）'},picture:{en:'The box lands over the browser',zh:'盒子落到浏览器上'}},
 {o:46.058,f:46.2,out:46.05,img:'f2763',music:{en:'the outro’s first attack',zh:'尾声的第一个起音'},picture:{en:'The flat mark',zh:'平面标志'}},
];
const WIN=.3;
// camera cuts as output frames (CUTS in camera.ts, mapped through warp A)
const CAM_CUTS=[27,351,618,783,1056,1194,1914,1950];

/* ── the film's motion maths, ported line for line ─────────────────────────────────────────────────────────────── */
/** kit/motion.ts bezier(): CSS-style cubic easing. */
const bezier=(x1,y1,x2,y2)=>{const cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
 const sx=u=>((ax*u+bx)*u+cx)*u,sy=u=>((ay*u+by)*u+cy)*u,dx=u=>(3*ax*u+2*bx)*u+cx;
 return x=>{if(x<=0)return 0;if(x>=1)return 1;let u=x;for(let i=0;i<8;i++){const e=sx(u)-x,d=dx(u);if(Math.abs(e)<1e-6||Math.abs(d)<1e-6)break;u-=e/d;}return sy(Math.min(1,Math.max(0,u)));};};
const soft=bezier(.33,0,.2,1);
/** kit/motion.ts spline() for one axis. guard=false keeps only Catmull-Rom tangents and averaged accelerations. */
function solve(tt,p,guard){
 const n=p.length,rest=p.map((_,j)=>j===0||j===n-1);
 const sec=Array.from({length:n-1},(_,j)=>(p[j+1]-p[j])/(tt[j+1]-tt[j]));
 const v=p.map((_,j)=>rest[j]?0:(guard&&sec[j-1]*sec[j]<=0)?0:(p[j+1]-p[j-1])/(tt[j+1]-tt[j-1]));
 if(guard)for(let j=0;j<n-1;j++){ // Fritsch–Carlson on the shared per-key velocities
  const d=sec[j];if(d===0){v[j]=0;v[j+1]=0;continue;}
  let al=v[j]/d,be=v[j+1]/d;if(al<0)v[j]=al=0;if(be<0)v[j+1]=be=0;
  const r=al*al+be*be;if(r>9){const s=3/Math.sqrt(r);v[j]=s*al*d;v[j+1]=s*be*d;}
 }
 const aEnd=j=>{const h=tt[j+1]-tt[j];return(-6*(p[j+1]-p[j])/h+2*v[j]+4*v[j+1])/h;};
 const aStart=j=>{const h=tt[j+1]-tt[j];return(6*(p[j+1]-p[j])/h-4*v[j]-2*v[j+1])/h;};
 const a=p.map((_,j)=>rest[j]?0:.5*(aEnd(j-1)+aStart(j)));
 if(guard){ // the monotone guard: one-sided acceleration, then halve, then trim, until no segment turns back
  const mm=j=>{if(rest[j])return 0;const l=aEnd(j-1),r=aStart(j);return l*r<=0?0:Math.sign(l)*Math.min(Math.abs(l),Math.abs(r));};
  const dq=(j,u)=>{const h=tt[j+1]-tt[j],u2=u*u,u3=u2*u,u4=u3*u;return(30*u2-60*u3+30*u4)*(p[j+1]-p[j])+(1-18*u2+32*u3-15*u4)*v[j]*h+(u-4.5*u2+6*u3-2.5*u4)*a[j]*h*h+(1.5*u2-4*u3+2.5*u4)*a[j+1]*h*h+(-12*u2+28*u3-15*u4)*v[j+1]*h;};
  const bad=j=>{const d=p[j+1]-p[j],eps=1e-9*(Math.abs(d)+1);for(let i=1;i<64;i++){const q=dq(j,i/64);if(d===0?Math.abs(q)>eps:q*Math.sign(d)<-eps)return true;}return false;};
  const tried=new Set();
  for(let pass=0;pass<40;pass++){let any=false;for(let j=0;j<n-1;j++){if(!bad(j))continue;any=true;
   if(!tried.has(j)){tried.add(j);a[j]=mm(j);a[j+1]=mm(j+1);}
   else if(a[j]!==0||a[j+1]!==0){a[j]*=.5;a[j+1]*=.5;if(Math.abs(a[j])<1e-6)a[j]=0;if(Math.abs(a[j+1])<1e-6)a[j+1]=0;}
   else{v[j]*=.9;v[j+1]*=.9;}}if(!any)break;}
 }
 return {v,a};
}
/** kit/motion.ts quintic Hermite between keys. */
function splineAt(t,tt,p,s){
 const n=p.length;if(t<=tt[0])return p[0];if(t>=tt[n-1])return p[n-1];
 let i=0;while(i<n-2&&t>tt[i+1])i++;
 const h=tt[i+1]-tt[i],u=(t-tt[i])/h,u2=u*u,u3=u2*u,u4=u3*u,u5=u4*u;
 return(1-10*u3+15*u4-6*u5)*p[i]+(u-6*u3+8*u4-3*u5)*s.v[i]*h+(.5*u2-1.5*u3+1.5*u4-.5*u5)*s.a[i]*h*h+(.5*u3-u4+.5*u5)*s.a[i+1]*h*h+(-4*u3+7*u4-3*u5)*s.v[i+1]*h+(10*u3-15*u4+6*u5)*p[i+1];
}
/** scripts/sfx.mjs: a hashed seed for a Lehmer generator (close seeds no longer give close draws). */
const hash=(a,b)=>{let h=Math.imul(a^0x9e3779b9,0x85ebca6b)^Math.imul(b+0x632be5ab,0xc2b2ae35);h^=h>>>13;h=Math.imul(h,0x27d4eb2f);h^=h>>>16;return((h>>>0)%2147483646)+1;};
const lehmer=seed=>{const next=()=>(seed=(seed*16807)%2147483647)/2147483647;next();return next;};

/* ── the sounds (scripts/sfx-cues.mjs) ─────────────────────────────────────────────────────────────────────────── */
const KEYS=['01','04','05','06','07','13','16','18','19','22','23','32'],SPACES=['10','31'];
const MARIMBA=[['vsco-marimba-G5',782.5],['vsco-marimba-B5',988.8],['vsco-marimba-F6',1396.1],['vsco-marimba-C7',2096.3]];
// a bank plays the recording nearest the note (a near-tie goes to the one above), retuned the rest of the way
const nearest=(bank,note)=>{const cents=f=>1200*Math.log2(hz(note)/f);return bank.reduce((p,q)=>{const d=Math.abs(cents(q[1]))-Math.abs(cents(p[1]));return d<-5||(Math.abs(d)<=5&&q[1]>p[1])?q:p;});};
const NOTES=[[78,'F♯5'],[81,'A5'],[83,'B5'],[86,'D6'],[88,'E6']];
// the prompt as the film types it: [output time, recording, rate], the picks sfx.mjs made with its hashed seeds
const PROMPT=[[5.85,'01',1.0017],[5.95,'16',1.0153],[6.033,'10',1],[6.117,'06',.9828],[6.217,'23',1.0074],[6.3,'18',.9819],[6.4,'31',1],[6.483,'10',1],[6.567,'23',.9974],[6.667,'07',1.0113],[6.75,'31',1],[6.85,'18',.9829],[6.933,'05',1.0218],[7.017,'23',1.0179],[7.117,'22',.9875,.63]];
const keyOpts=(rec,rate=1,cut=true)=>{const space=SPACES.includes(rec);return cut?{rate,cut:space?.055:.05,cutLen:space?.015:.03,hp:space?140:200,lp:space?9000:10000}:{rate,hp:space?140:200,lp:space?9000:10000};};
// pluck_001's partials, measured on the file (dB re its loudest, the 3rd at 1320 Hz)
const PLUCK=[-5.2,-5.4,0,-2.8,-16.4,-5.9,-20.6,-15.2];

/** One Web Audio graph for the recordings, and one audio element for the film's own mix. */
function makeSound(onBusy,onFilm,onHear,setProgress){
 const st={ctx:null,out:null,raw:new Map(),bufs:new Map(),idle:0,el:null,raf:0,id:null};
 const ensure=()=>{
  if(!st.ctx){const C=window.AudioContext||window.webkitAudioContext;st.ctx=new C();st.out=st.ctx.createGain();st.out.gain.value=.85;st.out.connect(st.ctx.destination);}
  if(st.ctx.state==='suspended')st.ctx.resume();return st.ctx;
 };
 const fetchRaw=name=>{if(!st.raw.has(name))st.raw.set(name,fetch(SFX+name+'.wav').then(r=>{if(!r.ok)throw new Error(name);return r.arrayBuffer();}));return st.raw.get(name);};
 const load=name=>{if(!st.bufs.has(name))st.bufs.set(name,fetchRaw(name).then(b=>new Promise((ok,no)=>ensure().decodeAudioData(b,ok,no))));return st.bufs.get(name);};
 const busy=s=>{clearTimeout(st.idle);onBusy(true);st.idle=setTimeout(()=>onBusy(Boolean(st.id)),s*1000+700);};
 /** A recording processed as sfx.mjs does: resampled (rate), started late (from), filtered, cut with a raised-cosine fade. */
 const play=async(name,o={})=>{
  const c=ensure();let buf;
  try{buf=await load(name);}catch{st.bufs.delete(name);st.raw.delete(name);return 0;}
  const {rate=1,from=0,cut,cutLen=.03,hp,lp,gain=.8,when}=o;
  const src=c.createBufferSource();src.buffer=buf;src.playbackRate.value=rate;
  let node=src;
  for(const [type,f] of [['highpass',hp],['lowpass',lp]])if(f){const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=.707;node.connect(b);node=b;}
  const g=c.createGain();node.connect(g);g.connect(st.out);
  const t0=Math.max(c.currentTime+.02,when??0);let dur=Math.max(0,(buf.duration-from)/rate);
  g.gain.setValueAtTime(gain,t0);
  if(cut!==undefined&&cut+cutLen<dur){dur=cut+cutLen;const n=32,curve=new Float32Array(n);for(let i=0;i<n;i++)curve[i]=gain*(.5+.5*Math.cos(Math.PI*i/(n-1)));g.gain.setValueCurveAtTime(curve,t0+cut,cutLen);}
  src.start(t0,from);src.stop(t0+dur+.02);
  busy(t0-c.currentTime+dur);return dur;
 };
 const now=()=>ensure().currentTime;
 const stopHear=()=>{
  cancelAnimationFrame(st.raf);
  if(st.el){st.el.pause();st.el.muted=false;st.el.volume=1;}
  if(st.id){st.id=null;onHear(null);setProgress(0);busy(0);}
 };
 /** The delivered film's own audio from a to b (seconds). A second press stops it. */
 const hear=(a,b,id)=>{
  if(st.id===id){stopHear();return;}
  stopHear();
  const el=st.el||(st.el=new Audio(MIX));el.preload='auto';
  st.id=id;onHear(id);onBusy(true);onFilm();
  const start=()=>{
   if(st.id!==id)return;
   el.currentTime=a;
   const tick=()=>{
    if(st.id!==id)return;
    const t=el.currentTime;
    if(t>=a-.05&&t<b+1){setProgress(Math.min(1,Math.max(0,(t-a)/(b-a))));el.muted=false;if(t>b-.15)el.volume=Math.max(0,(b-t)/.15);}
    if(t>=b||el.ended){stopHear();return;}
    st.raf=requestAnimationFrame(tick);
   };
   st.raf=requestAnimationFrame(tick);
  };
  el.muted=true;el.volume=1;
  el.play().catch(()=>stopHear());
  if(el.readyState>=1)start();else el.addEventListener('loadedmetadata',start,{once:true});
 };
 const prefetch=names=>names.forEach(n=>fetchRaw(n).catch(()=>{st.raw.delete(n);}));
 const close=()=>{stopHear();clearTimeout(st.idle);if(st.el){st.el.removeAttribute('src');st.el.load();st.el=null;}st.ctx?.close().catch(()=>{});st.ctx=null;st.bufs.clear();};
 return {play,hear,stopHear,prefetch,load,now,close};
}

/** A selection box around a section title, drawn from its top-left corner as the title comes in, as in the film. */
const Sel=({id,children})=><span id={id} className="hk-sel">{children}<i/><i/><i/><i/></span>;

/** A button that plays a window of the delivered film's audio, with its progress drawn underneath. */
function Hear({id,a,b,sound,hearing,children,className=''}){
 const on=hearing===id;
 return <button type="button" className={'hkt-hear'+(on?' is-on':'')+(className?' '+className:'')} aria-pressed={on} onClick={()=>sound.hear(a,b,id)}><i aria-hidden="true"/><span>{children}</span></button>;
}

/** Two-way switch (a radio pair) with a sliding thumb. */
function Switch({value,options,onChange,label}){
 return <div className="hkt-switch" role="radiogroup" aria-label={label}>
  {options.map(([v,text])=><button key={String(v)} type="button" role="radio" aria-checked={value===v} onClick={()=>onChange(v)}>{text}</button>)}
  <i className={value===options[1][0]?'is-right':''} aria-hidden="true"/>
 </div>;
}

/** The order the film was made in, as a signal path; each stage jumps to its section. */
function SignalPath({lang,reduced}){
 const en=lang==='en';
 const nodes=[
  ['hk-music',en?'A1 · MUSIC':'A1 · 音乐',en?'2:53 → 0:50':'2:53 → 0:50',en?'the song cut into four pieces, joined on beats':'歌剪成 4 段，在拍点上接起来'],
  ['hk-warp',en?'WARP':'变速','0.93–1.11×',en?'picture timing adjusted to 7 hits':'画面时间调到 7 个重拍上'],
  ['hk-pic',en?'V1 · PICTURE':'V1 · 画面',en?'11 shots':'11 个镜头',en?'every cut on an exact frame':'每个剪辑点都在整帧上'],
  ['hk-foley',en?'A2 · FOLEY':'A2 · 音效',en?'82 recordings':'82 个录音',en?'each placed on the frame of its action':'每个都放在对应动作的那一帧'],
  ['hk-cut',en?'MIX':'混音','−15.87 LUFS',en?'the music lowered in four places':'音乐在 4 处压低'],
 ];
 const go=id=>event=>{event.preventDefault();document.getElementById(id)?.closest('section')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});};
 return <Reveal as="ol" className="hkt-path" aria-label={en?'The order the film was made in':'片子的制作顺序'}>
  {nodes.map(([id,k,v,s],i)=><li key={id} style={{'--i':i}}><a href={'#'+id} onClick={go(id)}><span className="hkt-path-k">{k}</span><b>{v}</b><small>{s}</small></a></li>)}
 </Reveal>;
}

/** The four pieces of the song and the cut that joins them; each join can be heard in the delivered film. */
function MusicEdit({lang,sound,hearing}){
 const en=lang==='en';
 return <Reveal as="figure" className="hk-music hkt-edit">
  <div className="hk-music-row"><span>{en?'SONG':'原曲'} · 2:53</span><div className="hk-music-bar">{MUSIC.map(([,,s0,s1])=><i key={s0} style={{left:s0/SONG*100+'%',width:(s1-s0)/SONG*100+'%'}}/>)}</div></div>
  <svg className="hk-music-links" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">{MUSIC.map(([a,b,s0,s1])=><path key={a} d={`M${s0/SONG*1000},0L${s1/SONG*1000},0L${b/DUR*1000},60L${a/DUR*1000},60Z`}/>)}</svg>
  <div className="hk-music-row"><span>{en?'FILM':'成片'} · 0:50</span><div className="hk-music-bar hk-music-out">{MUSIC.map(([a,b,s0,s1])=><i key={a} style={span(a,b)}><b>{mmss(s0)}–{mmss(s1)}</b></i>)}</div></div>
  <ol className="hkt-joins">{JOINS.map(([t,score],i)=><li key={t}>
   <Hear id={'join'+i} a={t-1.6} b={t+1.6} sound={sound} hearing={hearing}>{en?'Join':'接口'} {i+1} · {t.toFixed(1)} s<em>{en?'cut score':'匹配分'} {score} / 3</em></Hear>
  </li>)}</ol>
  <figcaption>{en?'At each join the song jumps from one beat to another. cutsearch.mjs picks the pair whose eight surrounding beats match best in harmony, timbre and rhythm, which keeps downbeats on downbeats. A 30 ms crossfade ends on the beat, so the new piece’s attack stays as recorded.':'每个接口处，歌从一拍直接跳到另一拍。cutsearch.mjs 比较两边各 8 拍的和声、音色和节奏，挑最接近的一对，这样重拍仍然落在重拍上。30 毫秒的交叉淡化在拍点上结束，新一段的起音保持原样。'}</figcaption>
 </Reveal>;
}

/** Warp A: the picture events against the song's hits, as laid out and after the warp. */
function WarpPanel({lang,reduced,sound,hearing}){
 const en=lang==='en',ref=useRef(null),inView=useInView(ref,{threshold:.3}),[on,setOn]=useState(false),touched=useRef(false),read=useRef(null),plot=useRef(null);
 useEffect(()=>{if(!inView||touched.current)return;if(reduced){setOn(true);return;}const id=setTimeout(()=>{if(!touched.current)setOn(true);},700);return()=>clearTimeout(id);},[inView,reduced]);
 const pick=v=>{touched.current=true;setOn(v);};
 const Y0=64,K=.32; // zero line, units per ms
 const curve=useMemo(()=>'M'+WARP_D.map((v,i)=>(i*2).toFixed(0)+','+(Y0-v/10*K).toFixed(2)).join('L'),[]);
 const fmt=ms=>{
  const a=Math.abs(ms);if(a<.5)return en?'on the hit':'在拍上';
  return en?`${a.toFixed(0)} ms ${ms>0?'late':'early'} · ${(a*.06).toFixed(1)} frames`:`${ms>0?'晚':'早'} ${a.toFixed(0)} 毫秒 · ${(a*.06).toFixed(1)} 帧`;
 };
 const move=event=>{
  const r=plot.current.getBoundingClientRect(),x=Math.min(1,Math.max(0,(event.clientX-r.left)/r.width)),i=Math.min(499,Math.round(x*500));
  const d=WARP_D[i]/10,rate=1+(WARP_D[i+1]-WARP_D[i])/10000/.1;
  read.current.textContent=(en?`${(i/10).toFixed(1)} s · picture ${on?(d>=0?'+':'')+d.toFixed(0)+' ms':'+0 ms'} · speed ${on?rate.toFixed(3):'1.000'}×`:`${(i/10).toFixed(1)} 秒 · 画面 ${on?(d>=0?'+':'')+d.toFixed(0)+' 毫秒':'+0 毫秒'} · 速度 ${on?rate.toFixed(3):'1.000'}×`);
 };
 return <div ref={ref} className={'hkt-warp'+(on?' is-on':'')}>
  <div className="hkt-warp-top">
   <Switch value={on} onChange={pick} label={en?'Show the picture with its original timing or warped':'显示原始时间或变速后的画面'} options={[[false,en?'Original timing':'原始时间'],[true,en?'Warped to track A':'按配乐 A 变速']]}/>
   <p ref={read} className="hkt-warp-read" aria-live="off">{en?'Speed range 0.93× to 1.11×':'速度范围 0.93× 到 1.11×'}</p>
  </div>
  <figure className="hkt-warp-plot" onPointerMove={move} onPointerDown={move}>
   <div ref={plot} className="hkt-warp-svg">
    <svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
     {[0,10,20,30,40,50].map(s=><line key={s} className="hkt-grid" x1={s*20} x2={s*20} y1="0" y2="120"/>)}
     <line className="hkt-zero" x1="0" x2="1000" y1={Y0} y2={Y0}/>
     <g className="hkt-warp-g" style={{transformOrigin:`0 ${Y0}px`}}>
      <path className="hkt-warp-area" d={curve+`L1000,${Y0}L0,${Y0}Z`}/>
      <path className="hkt-warp-line" d={curve}/>
      {HITS.map((h,i)=><line key={i} className="hkt-warp-stick" x1={h.o*20} x2={h.o*20} y1={Y0} y2={Y0-(h.f-h.o)*1000*K}/>)}
     </g>
    </svg>
    {HITS.map((h,i)=><span key={i} className={'hkt-warp-n'+(i===3?' is-l':i===4?' is-r':'')} style={{left:pos(h.o)}}>{i+1}</span>)}
    <span className="hkt-warp-y is-top">+150 ms</span><span className="hkt-warp-y is-zero">0</span><span className="hkt-warp-y is-low">−100 ms</span>
   </div>
   <div className="hkt-axis" aria-hidden="true">{[0,10,20,30,40,50].map(s=><span key={s} style={{left:pos(s)}}>{s} s</span>)}</div>
   <figcaption>{en?'d(t) is how far the warp shifts the picture against the song. It stays at 0 until 20 s, because the film was laid out on this song’s 100 BPM grid. Through the chorus it moves the picture up to 109 ms earlier, at the box’s landing 91 ms later, and from 46 s it holds at 150 ms.':'d(t) 表示变速把画面相对歌曲移动了多少。前 20 秒是 0，因为片子本来就是按这首歌 100 BPM 的网格排的。副歌里画面最多提前 109 毫秒，盒子落地时推后 91 毫秒，46 秒以后保持在 150 毫秒。'}</figcaption>
  </figure>
  <ol className="hkt-hits">{HITS.map((h,i)=>{
   const ms=(on?h.out-h.o:h.f-h.o)*1000,first=Math.ceil((h.o-WIN)*FPS)/FPS;
   return <li key={i} style={{'--dx':(ms/1000/(2*WIN)).toFixed(4),'--fx':((first-(h.o-WIN))/(2*WIN)*100).toFixed(2)+'%'}}>
    <img src={`${media}/tech-${h.img}.webp`} width="480" height="270" loading="lazy" decoding="async" alt=""/>
    <div className="hkt-hit-text"><span className="st-mono">{String(i+1).padStart(2,'0')} · {h.o.toFixed(3)} s</span><b>{h.picture[lang]}</b><span>{en?'on ':'对上'}{h.music[lang]}</span></div>
    <div className="hkt-lane" aria-hidden="true"><i className="hkt-lane-hit"/><div className="hkt-lane-pic"><i/></div></div>
    <p className={'hkt-off'+(Math.abs(ms)<.5?' is-on':'')}>{fmt(ms)}{on&&i===6&&<small>{en?'pinned to frame 2763':'固定在第 2763 帧'}</small>}</p>
    <Hear id={'hit'+i} a={Math.max(0,h.o-1.8)} b={h.o+1} sound={sound} hearing={hearing}>{en?'Hear':'听'}</Hear>
   </li>;
  })}</ol>
  <p className="hkt-lane-key"><i className="is-hit"/>{en?'the hit in the song':'歌里的重拍'}<i className="is-pic"/>{en?'the picture event':'画面事件'}<i className="is-frame"/>{en?'frames, 1/60 s':'帧，1/60 秒'}</p>
 </div>;
}

/** Spectrogram from the measured cells. */
function Spectro({data,color,label}){
 const ref=useRef(null);
 useEffect(()=>{
  const canvas=ref.current,cols=52,rows=40;
  const draw=()=>{
   const ratio=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;if(!w)return;
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
   const g=canvas.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);g.clearRect(0,0,w,h);g.fillStyle=color;
   const cw=w/cols,ch=h/rows;
   for(let c=0;c<cols;c++)for(let r=0;r<rows;r++){const v=parseInt(data[c*rows+r],36)/35;if(v<.18)continue;g.globalAlpha=Math.pow((v-.18)/.82,1.6);g.fillRect(c*cw,h-(r+1)*ch,cw+.6,ch+.6);}
   g.globalAlpha=1;
  };
  draw();const ro=new ResizeObserver(draw);ro.observe(canvas);return()=>ro.disconnect();
 },[data,color]);
 return <canvas ref={ref} className="hkt-spec" role="img" aria-label={label}/>;
}

/** A recording's waveform; a playhead runs over it while it plays. */
function Wave({name,run,marks=[]}){
 const [shown,peaks]=PEAKS[name];
 return <div className="hkt-wave" aria-hidden="true">
  <svg viewBox="0 0 56 40" preserveAspectRatio="none">{peaks.map((v,i)=><rect key={i} x={i+.18} width=".64" y={20-Math.max(.4,v/99*19)} height={Math.max(.8,v/99*38)}/>)}</svg>
  {marks.map(([t,text])=><b key={t} style={{left:t/shown*100+'%'}}><span>{text}</span></b>)}
  {run&&run.name===name&&<i key={run.n} style={{'--a':run.a,'--b':run.b,animationDuration:run.d+'s'}}/>}
  <span className="hkt-wave-t">{Math.round(shown*1000)} ms</span>
 </div>;
}

/** One family of the foley: its recording, the ways the film plays it, and where to hear it in the film. */
function Strip({fam,lang,sound,hearing,plays,film,note,wave,marks,extra,files}){
 const en=lang==='en',ref=useRef(null),near=useInView(ref,{margin:'400px 0px'}),[run,setRun]=useState(null),n=useRef(0);
 useEffect(()=>{if(near)sound.prefetch(files);},[near,sound,files]);
 const go=async p=>{
  const d=await sound.play(p.name,p.o);if(!d)return;
  const [shown]=PEAKS[p.name]||[0];if(!shown)return;
  const from=p.o?.from||0,rate=p.o?.rate||1,src=Math.min(shown-from,d*rate);
  setRun({name:p.name,n:++n.current,a:(from/shown).toFixed(4),b:((from+src)/shown).toFixed(4),d:(src/rate).toFixed(3)});
 };
 const f=COLOR[fam];
 return <li ref={ref} className="hkt-strip" style={{'--c':f.color}}>
  <div className="hkt-strip-head"><span className="hkt-strip-n">{f.count}</span><div><h3>{f.label[lang]}</h3><p>{note[lang]}</p></div></div>
  <Wave name={wave} run={run} marks={marks}/>
  <div className="hkt-strip-plays">{plays.map(p=><button key={p.label.en} type="button" className="hkt-dry" onClick={()=>go(p)}><i aria-hidden="true"/><span>{p.label[lang]}</span><em>{p.meta}</em></button>)}</div>
  {extra}
  <Hear id={'fam-'+fam} a={film.a} b={film.b} sound={sound} hearing={hearing} className="hkt-film-btn"><img src={`${media}/tech-${film.img}.webp`} width="480" height="270" loading="lazy" decoding="async" alt=""/><span><em>{en?'In the film':'在片中'} · {film.t}</em>{film.label[lang]}</span></Hear>
 </li>;
}

/** Type with the film's keyboard: its recordings, its rules (none closer than 60 ms, never the same recording twice in
    a row, cut before the key-up). */
function KeyPad({lang,sound}){
 const en=lang==='en',[cut,setCut]=useState(true),[log,setLog]=useState([]),last=useRef({t:-1,key:null,space:null,n:0}),[value,setValue]=useState('');
 const stroke=ch=>{
  const now=performance.now(),L=last.current;L.n++;
  if(now-L.t<60){setLog(l=>[...l.slice(-15),{ch,skip:true,id:L.n}]);return;}
  L.t=now;
  const space=ch===' ',pool=space?SPACES:KEYS,slot=space?'space':'key',r=lehmer(hash(Math.round(now*10)%2147483647,L.n));
  let k=Math.floor(r()*pool.length);for(let i=0;pool.length>1&&pool[k]===L[slot]&&i<8;i++)k=Math.floor(r()*pool.length);
  L[slot]=pool[k];
  sound.play('key-'+pool[k],{...keyOpts(pool[k],space?1:1+(r()-.5)*.05,cut),gain:.75});
  setLog(l=>[...l.slice(-15),{ch,rec:pool[k],id:L.n}]);
 };
 const onInput=event=>{
  const e=event.nativeEvent,text=e.data||'';
  setValue(event.target.value.slice(-48));
  if(e.inputType&&e.inputType.startsWith('delete'))stroke('⌫');else stroke(text.slice(-1)||'·');
 };
 const prompt=async()=>{
  try{await Promise.all(PROMPT.map(([,rec])=>sound.load('key-'+rec)));}catch{return;}
  const t0=sound.now()+.08;
  PROMPT.forEach(([t,rec,rate,g=1])=>sound.play('key-'+rec,{...keyOpts(rec,rate,cut),gain:.75*g,when:t0+t-PROMPT[0][0]}));
  setLog(PROMPT.map(([,rec],i)=>({ch:SPACES.includes(rec)?' ':'·',rec,id:'p'+i+Date.now()})));
 };
 return <div className="hkt-pad">
  <div className="hkt-pad-row">
   <label className="hkt-type"><span className="st-mono">{en?'Type here':'在这里打字'}</span><input type="text" value={value} onChange={()=>{}} onInput={onInput} autoComplete="off" autoCorrect="off" spellCheck={false} placeholder={en?'Make it real — dark, live data':'Make it real — dark, live data'} aria-describedby="hkt-pad-help"/></label>
   <button type="button" className="hkt-dry" onClick={prompt}><i aria-hidden="true"/><span>{en?'The film’s prompt, no music':'片中的提示词，不带配乐'}</span><em>{en?'15 strokes, same recordings as the film':'15 下，录音和片中一样'}</em></button>
  </div>
  <div className="hkt-pad-row">
   <Switch value={cut} onChange={setCut} label={en?'Cut each stroke before its key-up':'在抬键声之前切掉'} options={[[true,en?'Cut at 50 ms':'在 50 毫秒处切'],[false,en?'With the key-up':'保留抬键声']]}/>
   <ol className="hkt-picks" aria-label={en?'Recordings played':'播放过的录音'}>{log.map(s=><li key={s.id} className={s.skip?'is-skip':s.ch===' '?'is-space':undefined} title={s.skip?(en?'skipped: under 60 ms':'跳过：间隔不到 60 毫秒'):'key-'+s.rec}>{s.skip?'—':s.rec}</li>)}</ol>
  </div>
  <p id="hkt-pad-help" className="hkt-pad-help">{en?'Each stroke picks one of 12 clean Cherry keyboard recordings with a hashed seed (spaces use two space-bar recordings) and never repeats the previous one. Strokes less than 60 ms apart are skipped, as in the film.':'每一下用打散过的种子，从 12 个干净的 Cherry 键盘录音里挑一个（空格用两个空格键录音），不会和上一下相同。间隔不到 60 毫秒的按键不出声，和片中一样。'}</p>
 </div>;
}

/** The marimba retuned into the song's key: each note plays the nearest of four recordings, resampled the rest of the way. */
function MarimbaPad({lang,sound}){
 const en=lang==='en';
 return <div className="hkt-pad">
  <div className="hkt-notes">{NOTES.map(([m,name])=>{
   const [rec,f0]=nearest(MARIMBA,m),cents=Math.round(1200*Math.log2(hz(m)/f0));
   return <button key={m} type="button" onClick={()=>sound.play(rec,{rate:hz(m)/f0,cut:.35,cutLen:.25,hp:200,gain:.7})}><b>{name}</b><span>{rec.slice(-2)} {cents>0?'+':cents<0?'−':'±'}{Math.abs(cents)} ¢</span></button>;
  })}
   <button type="button" className="is-tok" onClick={()=>{const [rec,f0]=nearest(MARIMBA,81);sound.play(rec,{rate:hz(81)/f0,cut:.012,cutLen:.008,hp:200,gain:.8});}}><b>{en?'tok':'tok'}</b><span>{en?'strike only, 20 ms':'只留敲击，20 毫秒'}</span></button>
  </div>
  <p className="hkt-pad-help">{en?'D major pentatonic (D E F♯ A B) from four recordings (G5, B5, F6, C7). Each note plays the nearest recording, taking the higher one in a near-tie, and resamples the rest of the way. A ✓ rings for 0.35 s; a panel appearing gets only the 20 ms strike.':'D 大调五声音阶（D E F♯ A B），只用四个录音（G5、B5、F6、C7）。每个音用最近的录音，距离差不多时选高的那个，剩下的差距用重采样补上。✓ 响 0.35 秒；面板出现时只用前 20 毫秒的敲击。'}</p>
 </div>;
}

/** Why recordings: the round-1 pop against the mouth pop that replaced it, both measured. */
function WhyRecorded({lang,sound}){
 const en=lang==='en';
 return <Reveal className="hkt-why">
  <div className="hkt-why-text">
   <span className="st-mono">{en?'ROUNDS 1–5':'第 1–5 轮'}</span>
   <h3>{en?'Why the interface sounds were replaced':'为什么换掉界面音效包'}</h3>
   <p>{en?'The first pass used a pack of interface sounds. Its pop measured as a single pure partial with no glide, and the review called it the most electronic sound in the film. The handle, toggle and agent-click blips were synthesized too. The traits that read as electronic were a pure partial, no glide and a long steady tone. A recorded mouth pop has air across the band and a pitch that slides.':'第一版用的是一套界面音效包。测下来，它的“啵”只有一个纯分音，音高不滑动，评审认为这是全片最像电子音的声音。控制点、开关和 agent 点击的提示音也都是合成的。听起来像电子音，是因为纯分音、没有滑音、长时间稳定的音。录下来的嘴巴“啵”声在整个频段都有气声，音高也会滑动。'}</p>
   <ul className="hkt-rounds" aria-label={en?'Cues per review round':'每轮评审后的音效数'}>{[217,157,93,89,82].map((n,i)=><li key={i} style={{'--w':n/217}}><span>{en?'Round':'第'} {i+1}{en?'':'轮'}</span><i/><b>{n}</b></li>)}</ul>
   <p className="hkt-small">{en?'Number of cues in the version each of the five review rounds listened to.':'五轮评审各自听的那一版里有多少个音效。'}</p>
  </div>
  <div className="hkt-why-pair">
   <figure><Spectro data={SPECS.synth} color="#c9c7c0" label={en?'Spectrogram of the round-1 pop: one flat line':'第 1 轮“啵”声的频谱图：一条平直的线'}/>
    <figcaption><button type="button" className="hkt-dry" onClick={()=>sound.play('kenney-drop_003',{hp:200,gain:.6})}><i aria-hidden="true"/><span>{en?'Round 1: synthesized drop':'第 1 轮：合成的 drop'}</span><em>{en?'one pure partial, 738 Hz':'单一纯分音，738 Hz'}</em></button></figcaption></figure>
   <figure><Spectro data={SPECS.pop} color="#e8467c" label={en?'Spectrogram of the recorded mouth pop: broadband with a gliding pitch':'录音“啵”声的频谱图：宽频，音高滑动'}/>
    <figcaption><button type="button" className="hkt-dry" onClick={()=>sound.play('pop-ezd-9',{hp:200,lp:9000,gain:.8})}><i aria-hidden="true"/><span>{en?'Final: a recorded mouth pop':'终版：录下来的嘴巴“啵”声'}</span><em>{en?'air across the band, pitch sliding':'满频段的气声，音高滑动'}</em></button></figcaption></figure>
   <p className="hkt-spec-axis st-mono"><span>0</span><span>120 ms</span><span className="is-f">150 Hz – 12 kHz, log</span></p>
  </div>
 </Reveal>;
}

/** What the foley reviews caught, with the measurements. */
function BugLog({lang,sound,hearing}){
 const en=lang==='en',[final,setFinal]=useState(false);
 const D5=hz(74),TICKS=[35.309,35.555,35.801],V3=[35.11,35.36,35.6],FINAL=[35.317,35.567,35.817],w0=34.95,w1=36;
 const x=t=>(t-w0)/(w1-w0)*100+'%',xn=t=>((t-w0)/(w1-w0)*100).toFixed(2);
 return <ol className="hkt-bugs">
  <Reveal as="li">
   <span className="st-mono">{en?'ROUND 1 · DESIGN':'第 1 轮 · 设计'}</span>
   <h3>{en?'Check sounds tuned from the wrong partial':'✓ 音按错了分音定调'}</h3>
   <p>{en?'A pluck was retuned from its loudest partial. On this file the loudest is the 3rd harmonic at 1320 Hz, while the fundamental is 439 Hz, so every note came out an octave and a fifth low. A D sounded as a G and clashed with the song’s F♯.':'拨弦音是按它最响的分音来定调的。这个文件最响的是 1320 Hz 的三次谐波，基频其实是 439 Hz，所以每个音都低了一个八度加五度。D 听起来是 G，和歌里的 F♯ 冲突。'}</p>
   <div className="hkt-harm" aria-label={en?'Partials of the pluck, measured':'拨弦音各分音的实测电平'} role="img">{PLUCK.map((db,i)=><span key={i} className={i===2?'is-loud':i===0?'is-f0':undefined} style={{'--h':(1+db/24).toFixed(3)}}><i/><b>{i+1}</b></span>)}</div>
   <p className="hkt-small">{en?'Partials 1–8, measured on the file; the 3rd is loudest.':'第 1–8 个分音的实测电平；第 3 个最响。'}</p>
   <div className="hkt-row">
    <button type="button" className="hkt-dry" onClick={()=>sound.play('kenney-pluck_001',{rate:D5/1319.9,hp:120,gain:.7})}><i aria-hidden="true"/><span>{en?'“D” tuned from 1320 Hz':'按 1320 Hz 定的“D”'}</span><em>{en?'the bug, sounds as G':'错误版本，听起来是 G'}</em></button>
    <button type="button" className="hkt-dry" onClick={()=>sound.play('kenney-pluck_001',{rate:D5/439.3,hp:120,gain:.7})}><i aria-hidden="true"/><span>{en?'D tuned from 439.3 Hz':'按 439.3 Hz 定的 D'}</span><em>{en?'fixed':'修正后'}</em></button>
   </div>
   <p className="hkt-small">{en?'Round 2 found that the pluck itself was a synthesized tone, and the ✓s were changed to a recorded marimba.':'第 2 轮发现这个拨弦音本身就是合成音，后来 ✓ 换成了马林巴录音。'}</p>
  </Reveal>
  <Reveal as="li" delay={70}>
   <span className="st-mono">{en?'SCORE V3 · SOUND REVIEW':'配乐 v3 · 声音评审'}</span>
   <h3>{en?'Check sounds 200 ms ahead of the ticks':'✓ 声比勾早 200 毫秒'}</h3>
   <p>{en?'In the code-built score, the three ✓ pings on the deploy cards played 200 ms before the green ticks finished drawing. In the foley version every sound sits on the first frame that shows its action.':'在代码做的那版配乐里，部署卡片上的三个 ✓ 提示音比绿色的勾画完早了 200 毫秒。音效版里，每个声音都放在第一次看到对应动作的那一帧。'}</p>
   <Switch value={final} onChange={setFinal} label={en?'Score v3 or final foley':'配乐 v3 或终版音效'} options={[[false,en?'Score v3':'配乐 v3'],[true,en?'Final foley':'终版音效']]}/>
   <div className="hkt-ticks" aria-hidden="true">
    <div><span>{en?'tick drawn':'勾画完'}</span>{TICKS.map(t=><i key={t} className="is-tick" style={{left:x(t)}}>✓</i>)}</div>
    <div><span>{en?'sound':'声音'}</span>{(final?FINAL:V3).map((t,i)=><i key={i} className="is-ping" style={{'--x':xn(t)}}/>)}</div>
   </div>
   <p className="hkt-small">{en?(final?'35.317, 35.567 and 35.817 s, 8 ms after each tick, within one frame.':'Pings at 35.11, 35.36 and 35.60 s; ticks done at 35.31, 35.56 and 35.80 s.'):(final?'35.317、35.567、35.817 秒，比勾晚 8 毫秒，在一帧之内。':'提示音在 35.11、35.36、35.60 秒，勾在 35.31、35.56、35.80 秒画完。')}</p>
   <Hear id="bug-ticks" a={34.9} b={36.3} sound={sound} hearing={hearing}>{en?'Play this moment in the film':'在片中听这一段'}</Hear>
  </Reveal>
  <Reveal as="li" delay={140}>
   <span className="st-mono">{en?'ROUND 1 · SYNC':'第 1 轮 · 同步'}</span>
   <h3>{en?'Key sounds three frames late':'打字声晚了约三帧'}</h3>
   <p>{en?'Some key recordings start with a lone blip, followed by 45 to 57 ms of room tone before the strike. With the trim at 3 % of peak, the cue started on the blip, and 13 typed cues sounded about three frames late. A recording now starts 2 ms before it first crosses 20 % of its peak.':'有些按键录音开头先有一个孤立的小毛刺，后面是 45 到 57 毫秒的房间底噪，然后才是敲击。按峰值 3% 来切时，起点落在毛刺上，13 个打字声晚了大约三帧。现在每个录音从第一次超过峰值 20% 的位置往前 2 毫秒开始。'}</p>
   <div className="hkt-env" role="img" aria-label={en?'The key-08 recording: 55 ms of room between the 3 % and 20 % crossings':'key-08 录音：3% 和 20% 两个阈值之间隔着 55 毫秒'}>
    <svg viewBox="0 0 60 60" preserveAspectRatio="none" aria-hidden="true">{KEY08_ENV.map((v,i)=><rect key={i} x={i+.15} width=".7" y={60-v} height={Math.max(.5,v)}/>)}</svg>
    <b style={{left:'0%'}}><span>3 %</span></b><b className="is-good" style={{left:55.1/120*100+'%'}}><span>20 % · 55 ms</span></b>
   </div>
   <p className="hkt-small">{en?'key-08, first 120 ms, level in dB.':'key-08 前 120 毫秒，电平按 dB 显示。'}</p>
  </Reveal>
  <Reveal as="li" delay={210}>
   <span className="st-mono">{en?'ROUND 1 · SYNC':'第 1 轮 · 同步'}</span>
   <h3>{en?'Repeated key recordings':'按键录音重复'}</h3>
   <p>{en?'Each cue seeded its own random generator with almost the same number as the cue before it, and a Lehmer generator gives close first draws for close seeds. A typing run therefore went through the pool in order and repeated one recording up to five times. The seed is now hashed first, and a run never plays the same recording twice in a row.':'每个音效给自己的随机数生成器一个种子，相邻音效的种子几乎一样；Lehmer 生成器在种子相近时，开头几个数也很接近。结果一段打字按顺序轮过录音池，同一个录音最多连着用了五次。现在种子先打散再用，一段打字里不会连续两次用同一个录音。'}</p>
   <ol className="hkt-picks is-static" aria-label={en?'The recordings the film’s prompt plays':'片中提示词用到的录音'}>{PROMPT.map(([t,rec])=><li key={t} className={SPACES.includes(rec)?'is-space':undefined}>{rec}</li>)}</ol>
   <p className="hkt-small">{en?'The recording used for each of the 15 strokes in the film’s prompt; shaded ones are the space bar. The keyboard above uses the same rule.':'片中提示词 15 下按键各自用的录音，深色的是空格键。上面的键盘用的是同一套规则。'}</p>
  </Reveal>
 </ol>;
}

/** Why cuts sit on exact frames: a frame averages 8 renders over half a frame. Drag where the cut falls. */
function Shutter({lang}){
 const en=lang==='en',[c,setC]=useState(.22);
 const k=Array.from({length:8},(_,j)=>j/16<c-1e-9).filter(Boolean).length;
 return <div className="hkt-shutter">
  <div className="hkt-shutter-img">
   <img src={media+'/tech-cut-0783.webp'} width="960" height="540" loading="lazy" decoding="async" alt={en?'Frame 783: the wide shot after the 13.05 s cut':'第 783 帧：13.05 秒剪辑点之后的全景'}/>
   <img className="is-a" src={media+'/tech-cut-0782.webp'} width="960" height="540" loading="lazy" decoding="async" alt="" style={{opacity:k/8}}/>
   <span className="hkt-shutter-tag st-mono">{en?'FRAME 783':'第 783 帧'} · {k}/8 {en?'from the macro':'来自特写'}</span>
  </div>
  <div className="hkt-shutter-ctl">
   <div className="hkt-shutter-bar" aria-hidden="true">
    <i className="hkt-open"/>
    {Array.from({length:8},(_,j)=><b key={j} className={j/16<c-1e-9?'is-a':undefined} style={{left:j/16*100+'%'}}/>)}
    <em style={{transform:`translate3d(${(c*100).toFixed(2)}%,0,0)`}}><span>{en?'cut':'剪'}</span></em>
    <span className="hkt-shutter-l">0</span><span className="hkt-shutter-m">{en?'½ frame · shutter closes':'½ 帧 · 快门关'}</span><span className="hkt-shutter-r">{en?'1 frame':'1 帧'}</span>
   </div>
   <input type="range" min="0" max=".5" step={1/64} value={c} onChange={event=>setC(+event.target.value)} aria-label={en?'Where the cut falls inside frame 783':'剪辑点落在第 783 帧里的位置'} aria-valuetext={`${(c*16.667).toFixed(1)} ms, ${k} of 8`}/>
   <p>{k===0?(en?'Cut on the frame boundary. All 8 samples show the new shot.':'剪在帧边界上，8 个采样都是新镜头。'):(en?`Cut ${(c*16.667).toFixed(1)} ms into the frame. ${k} of 8 samples still show the macro, so the frame is a double exposure.`:`剪在这一帧的第 ${(c*16.667).toFixed(1)} 毫秒。8 个采样里有 ${k} 个还是上一个特写，这一帧就成了双重曝光。`)}</p>
   <button type="button" className="hkt-dry" onClick={()=>setC(0)} disabled={k===0}><i aria-hidden="true"/><span>{en?'Move the cut to the frame boundary':'把剪辑点移到帧边界'}</span></button>
  </div>
 </div>;
}

/** The spline guard as a live demo: drag the keys, switch the guard. */
const KEY0={t:[0,1,1.4,2.8,4],p:[.1,.15,.85,.88,.9]};
function SplineDemo({lang,reduced}){
 const en=lang==='en',[keys,setKeys]=useState(KEY0),[guard,setGuard]=useState(false),svg=useRef(null),drag=useRef(-1),dot=useRef(null),box=useRef(null),inView=useInView(box,{threshold:.2,once:false});
 // a narrower drawing on phones, so the keys stay big enough to drag
 const [W,setW]=useState(640);
 useEffect(()=>{const el=box.current,ro=new ResizeObserver(()=>setW(el.clientWidth<560?400:640));ro.observe(el);return()=>ro.disconnect();},[]);
 const L=W===640?40:24,R=W-(W===640?20:14),X=t=>L+t/4*(R-L),Y=v=>215-v*190;
 const model=useMemo(()=>{
  const s=solve(keys.t,keys.p,guard),N=400,pts=[];
  for(let i=0;i<=N;i++){const t=4*i/N;pts.push([t,splineAt(t,keys.t,keys.p,s)]);}
  const seg=t=>{let i=0;while(i<keys.t.length-2&&t>keys.t[i+1])i++;return i;};
  const stops=[],over=[];let worst=0,cur=[];
  for(let i=1;i<N;i++){
   const [t,y]=pts[i],j=seg(t),lo=Math.min(keys.p[j],keys.p[j+1]),hi=Math.max(keys.p[j],keys.p[j+1]),dir=Math.sign(keys.p[j+1]-keys.p[j]);
   const v0=pts[i][1]-pts[i-1][1],v1=pts[i+1][1]-pts[i][1],nearKey=keys.t.some(q=>Math.abs(q-t)<.012);
   if(!nearKey&&v0*v1<0&&Math.abs(v0)+Math.abs(v1)>1e-7)stops.push([t,y]);
   const o=Math.max(y-hi,lo-y,0);
   if(o>1e-4&&dir!==0){cur.push([t,y]);const rel=o/Math.max(.05,Math.max(...keys.p)-Math.min(...keys.p));if(rel>worst)worst=rel;}else if(cur.length){over.push(cur);cur=[];}
  }
  if(cur.length)over.push(cur);
  const strobe=[];for(let i=0;i<=60;i++){const t=4*i/60,y=splineAt(t,keys.t,keys.p,s),j=seg(Math.min(3.999,t)),yb=splineAt(Math.max(0,t-1/60),keys.t,keys.p,s),dir=Math.sign(keys.p[j+1]-keys.p[j]);strobe.push([y,dir!==0&&(y-yb)*dir<-1e-6]);}
  return {s,pts,stops,over,worst,strobe};
 },[keys,guard]);
 // the "camera" running the curve on a loop
 const live=useRef(model);live.current=model;
 useEffect(()=>{
  if(reduced||!inView)return;let raf=0,t0=0;
  const step=t=>{t0||=t;const e=((t-t0)/1000)%5,tt=Math.min(4,e),m=live.current,y=splineAt(tt,keys.t,keys.p,m.s);if(dot.current)dot.current.style.transform=`translate3d(${(y*100).toFixed(3)}%,0,0)`;raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[reduced,inView,keys]);
 const toSvg=event=>{const p=svg.current.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.current.getScreenCTM().inverse());};
 const setKey=(i,t,p)=>setKeys(k=>{const tt=[...k.t],pp=[...k.p];if(i>0&&i<tt.length-1)tt[i]=Math.min(tt[i+1]-.2,Math.max(tt[i-1]+.2,t));pp[i]=Math.min(1,Math.max(0,p));return {t:tt,p:pp};});
 const down=i=>event=>{event.preventDefault();drag.current=i;svg.current.setPointerCapture?.(event.pointerId);};
 const move=event=>{if(drag.current<0)return;const q=toSvg(event);setKey(drag.current,(q.x-L)/(R-L)*4,(215-q.y)/190);};
 const up=()=>{drag.current=-1;};
 const keyDown=i=>event=>{
  const d={ArrowUp:[0,.02],ArrowDown:[0,-.02],ArrowLeft:[-.05,0],ArrowRight:[.05,0]}[event.key];
  if(!d)return;event.preventDefault();setKey(i,keys.t[i]+d[0],keys.p[i]+d[1]);
 };
 const path=pts=>'M'+pts.map(([t,y])=>X(t).toFixed(1)+','+Y(y).toFixed(1)).join('L');
 return <div ref={box} className={'hkt-spline'+(guard?' is-guard':'')}>
  <div className="hkt-spline-top">
   <Switch value={guard} onChange={setGuard} label={en?'Spline guard':'样条保护'} options={[[false,en?'Guard off':'关闭保护'],[true,en?'Guard on':'打开保护']]}/>
   <p className="hkt-spline-read" aria-live="polite"><b className={model.stops.length?'is-bad':'is-good'}>{model.stops.length}</b>{en?' stops between keys':' 次键间停顿'}<span>·</span><b className={model.worst>.005?'is-bad':'is-good'}>{Math.round(model.worst*100)}%</b>{en?' overshoot past a key':' 冲过关键帧（占整段行程）'}</p>
  </div>
  <svg ref={svg} className="hkt-spline-svg" viewBox={`0 0 ${W} 240`} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="group" aria-label={en?'Camera keys on a curve: value against time':'曲线上的镜头关键帧：数值随时间变化'}>
   {[0,1,2,3,4].map(s=><g key={s}><line className="hkt-grid" x1={X(s)} x2={X(s)} y1="20" y2="220"/><text x={X(s)} y="236" textAnchor="middle">{s} s</text></g>)}
   {keys.t.slice(0,-1).map((t,i)=><rect key={i} className="hkt-band" x={X(t)} width={X(keys.t[i+1])-X(t)} y={Y(Math.max(keys.p[i],keys.p[i+1]))} height={Math.max(.5,Math.abs(Y(keys.p[i])-Y(keys.p[i+1])))}/>)}
   {model.over.map((o,i)=><path key={i} className="hkt-over" d={path(o)}/>)}
   <path className="hkt-curve" d={path(model.pts)}/>
   {model.stops.map(([t,y],i)=><g key={i} className="hkt-stop"><circle cx={X(t)} cy={Y(y)} r="6"/><text x={X(t)} y={Y(y)-12} textAnchor="middle">{en?'stop':'停'}</text></g>)}
   {keys.t.map((t,i)=><g key={i} className="hkt-key" tabIndex={0} role="slider" aria-label={(en?'Key ':'关键帧 ')+(i+1)} aria-valuemin={0} aria-valuemax={1} aria-valuenow={+keys.p[i].toFixed(2)} aria-valuetext={`${t.toFixed(2)} s, ${keys.p[i].toFixed(2)}`} onPointerDown={down(i)} onKeyDown={keyDown(i)} transform={`translate(${X(t)},${Y(keys.p[i])})`}>
    <rect className="hkt-key-hit" x="-18" y="-18" width="36" height="36"/><rect className="hkt-key-box" x="-6" y="-6" width="12" height="12" rx="2"/>
   </g>)}
  </svg>
  <div className="hkt-rail" aria-hidden="true">
   <span className="st-mono">{en?'camera':'镜头'}</span>
   <div className="hkt-rail-track">{model.strobe.map(([y,back],i)=><i key={i} className={back?'is-back':undefined} style={{left:(y*100).toFixed(2)+'%'}}/>)}{!reduced&&<div ref={dot} className="hkt-rail-dot"><b/></div>}</div>
  </div>
  <div className="hkt-spline-foot">
   <p>{en?'Demonstration of the film’s spline (track() in kit/motion.ts), ported line for line. Drag a key, or focus one and use the arrow keys. The rail marks the camera position every 1/15 s; orange bars are where it moves backwards between keys.':'演示：片子用的样条曲线（kit/motion.ts 里的 track()），逐行移植过来。可以拖动关键帧，或选中后用方向键调。下面的轨道每 1/15 秒记一次镜头位置，橙色的是在关键帧之间往回走的地方。'}</p>
   <button type="button" className="hkt-dry" onClick={()=>setKeys(KEY0)}><i aria-hidden="true"/><span>{en?'Reset the keys':'重置关键帧'}</span></button>
  </div>
 </div>;
}

/** Camera screen speed per frame against the ~20 px/frame budget. */
function SpeedChart({lang}){
 const en=lang==='en',read=useRef(null);
 const H=120,top=30,yOf=v=>H-v/top*(H-8),path=useMemo(()=>'M'+CAM_SPEED.map((v,i)=>i+','+yOf(v/10).toFixed(2)).join('L'),[]);
 const move=event=>{const r=event.currentTarget.getBoundingClientRect(),i=Math.min(599,Math.max(0,Math.round((event.clientX-r.left)/r.width*600)));read.current.textContent=en?`${(i*5/60).toFixed(1)} s · ${(CAM_SPEED[i]/10).toFixed(1)} px/frame`:`${(i*5/60).toFixed(1)} 秒 · 每帧 ${(CAM_SPEED[i]/10).toFixed(1)} 像素`;};
 return <Reveal as="figure" className="hkt-speed">
  <p ref={read} className="hkt-speed-read st-mono">{en?'max 28.2 px/frame · over 20 on 104 of 3000 frames':'最高每帧 28.2 像素 · 3000 帧里有 104 帧超过 20'}</p>
  <div className="hkt-speed-plot" onPointerMove={move} onPointerDown={move}>
   <svg viewBox={`0 0 600 ${H}`} preserveAspectRatio="none" aria-hidden="true">
    <defs><clipPath id="hkt-over20"><rect x="0" y="0" width="600" height={yOf(20)}/></clipPath></defs>
    {CAM_CUTS.map(f=><line key={f} className="hkt-speed-cut" x1={f/5} x2={f/5} y1="0" y2={H}/>)}
    <path className="hkt-speed-area" d={path+`L600,${H}L0,${H}Z`}/>
    <path className="hkt-speed-hot" d={path+`L600,${H}L0,${H}Z`} clipPath="url(#hkt-over20)"/>
    <path className="hkt-speed-line" d={path}/>
    <line className="hkt-speed-budget" x1="0" x2="600" y1={yOf(20)} y2={yOf(20)}/>
   </svg>
   <span className="hkt-speed-tag" style={{top:yOf(20)/H*100+'%'}}>{en?'budget 20 px/f':'预算 20 px/帧'}</span>
  </div>
  <div className="hkt-axis" aria-hidden="true">{[0,10,20,30,40,50].map(s=><span key={s} style={{left:pos(s)}}>{s} s</span>)}</div>
  <figcaption>{en?'Camera motion only. A 7 × 5 grid of canvas points is projected through the camera, and the chart shows the fastest point in each frame (camspeed.ts, run through the warp). It goes over 20 px twice, in the opening keycap macro and on the deploy trip where the camera follows the box. Dashed lines are camera cuts.':'只算镜头本身的运动。把画布上 7 × 5 个点投影到画面里，图上是每帧最快的那个点（camspeed.ts，按变速后的时间计算）。有两处超过 20 像素：开场的键帽特写，和送达途中镜头跟着盒子走的那段。虚线是镜头剪辑点。'}</figcaption>
 </Reveal>;
}

/** Why 2D type moves with translate3d: a 40 px rise on the film's soft ease, frame by frame, exact vs pixel-snapped. */
function SnapChart({lang}){
 const en=lang==='en';
 const rows=useMemo(()=>{const D=40,N=42,y=f=>D*(1-soft(f/N)),ex=[],sn=[];for(let f=19;f<=N;f++){ex.push(y(f-1)-y(f));sn.push(Math.round(y(f-1))-Math.round(y(f)));}return {ex,sn};},[]);
 const bars=(vals,cls)=><svg viewBox="0 0 240 44" preserveAspectRatio="none" aria-hidden="true">{vals.map((v,i)=><rect key={i} className={cls} x={i*10+2} width="6" y={44-Math.min(2,v)*20} height={Math.max(.6,Math.min(2,v)*20)}/>)}</svg>;
 return <figure className="hkt-snap">
  <div><span className="st-mono">translate3d · will-change</span>{bars(rows.ex,'is-ex')}</div>
  <div><span className="st-mono">translateY · {en?'snapped':'取整'}</span>{bars(rows.sn,'is-sn')}</div>
  <figcaption>{en?'Illustration: pixels moved per frame over the last 24 frames of a 40 px rise on the film’s soft ease (700 ms) at 1× density. Snapped to whole pixels, the end of the ease moves 1, 0, 1, 0.':'示意：一行字用片子的 soft 缓动（700 毫秒）上移 40 像素，最后 24 帧每帧移动多少像素（1 倍像素密度）。按整像素取整后，缓动的末尾变成 1、0、1、0 这样跳。'}</figcaption>
 </figure>;
}

/** The ten beats as a reel that runs sideways while the page scrolls down; each still plays the film from its beat. */
function Reel({lang,reduced,onPlay}){
 const en=lang==='en',track=useRef(null),rail=useRef(null),row=useRef(null),bar=useRef(null),activeRef=useRef(0),[active,setActive]=useState(0);
 useEffect(()=>{
  if(reduced)return;
  const el=track.current,list=row.current,scroller=el.closest('.portfolio-page-viewport')||window;let raf=0,dist=0;
  const size=()=>{dist=Math.max(0,list.scrollWidth-rail.current.clientWidth);el.style.height=`calc(100svh + ${dist}px)`;paint();};
  const paint=()=>{raf=0;
   const box=el.getBoundingClientRect(),p=dist?Math.min(1,Math.max(0,-box.top/dist)):0;
   list.style.transform=`translate3d(${(-p*dist).toFixed(1)}px,0,0)`;bar.current.style.transform=`scaleX(${p.toFixed(4)})`;
   const i=Math.min(BEATS.length-1,Math.round(p*(BEATS.length-1)));
   if(i!==activeRef.current){activeRef.current=i;setActive(i);}
  };
  const queue=()=>{if(!raf)raf=requestAnimationFrame(paint);};
  const observer=new ResizeObserver(size);observer.observe(rail.current);observer.observe(list);
  scroller.addEventListener('scroll',queue,{passive:true});size();
  return()=>{cancelAnimationFrame(raf);observer.disconnect();scroller.removeEventListener('scroll',queue);el.style.height='';list.style.transform='';};
 },[reduced]);
 return <div ref={track} className={'hk-reel'+(reduced?' is-still':'')}>
  <div ref={rail} className="hk-reel-stage">
   <ol ref={row} className="hk-reel-row">{BEATS.map((b,i)=>{
    const from=i?BEATS[i-1].to:0,cues=EDIT.cues.filter(([t])=>t>=from&&t<b.to);
    return <li key={b.name} className={i===active?'is-on':undefined}>
     <button type="button" onClick={()=>onPlay(from)} aria-label={(en?'Play from ':'从这里播放：')+sec(from)+' · '+b.name}>
      <img src={`${media}/reel-${String(i+1).padStart(2,'0')}.webp`} width="960" height="540" loading="lazy" decoding="async" alt=""/>
      <span className="hk-reel-play" aria-hidden="true">▶ {sec(from)}</span>
     </button>
     <div className="hk-reel-text">
      <span className="st-mono">{String(i+1).padStart(2,'0')} / {BEATS.length} · {sec(from)}–{sec(Math.min(b.to,DUR))}</span>
      <h3>{b.name}</h3>
      <p>{b.built[lang]}</p>
      <p className="hk-reel-cam"><span className="st-mono">{en?'Camera':'镜头'}</span>{b.camera[lang]}</p>
      <ul className="hk-reel-jobs" aria-label={en?'Sounds in this beat':'这一段的声音'}>{cues.length?FAMILIES.filter(f=>cues.some(c=>c[1]===f.id)).map(f=><li key={f.id} style={{'--c':f.color}}><i aria-hidden="true"/>{cues.filter(c=>c[1]===f.id).length} · {f.label[lang]}</li>):<li className="is-quiet">{en?'No foley, music only':'没有音效，只有音乐'}</li>}</ul>
     </div>
    </li>;
   })}</ol>
   <div className="hk-reel-foot" aria-hidden="true"><span className="st-mono">{String(active+1).padStart(2,'0')} · {BEATS[active].name}</span><div className="hk-reel-bar"><i ref={bar}/>{BEATS.map((b,i)=><b key={b.name} style={{left:i/(BEATS.length-1)*100+'%'}}/>)}</div></div>
  </div>
 </div>;
}

const NOTES_QC=[
 {note:{en:'The picture slowed sharply into some cuts. One shot was down to 0.4 px a frame going into a cut, and the next opened at 15.',zh:'有些剪辑点前画面突然变慢。一个镜头进剪辑点前只有每帧 0.4 像素，下一个镜头却从 15 像素开始。'},fix:{en:'The next camera now starts moving before the cut, so the picture is in motion at every cut.',zh:'下一个镜头在剪辑点之前就开始运动，所以每个剪辑点上画面都在动。'}},
 {note:{en:'On the deploy trip the box weaved on screen: it changed direction five times between 34.7 and 36.5 s, swinging up to 125 px, because the sparse camera keys ran ahead of it and then fell behind.',zh:'送达途中盒子在画面里左右摇摆：34.7 到 36.5 秒之间换了五次方向，最大摆幅 125 像素，因为稀疏的镜头关键帧一会儿跑在它前面，一会儿落在后面。'},fix:{en:'From 34.0 to 37.2 s the camera follows the box itself. In a probe on the film’s camera code, the box now crosses the frame in one direction, at most 1.47 px a frame sideways.',zh:'34.0 到 37.2 秒之间，镜头直接跟着盒子走。用片子的镜头代码测试，盒子现在只朝一个方向穿过画面，横向每帧最多 1.47 像素。'}},
 {note:{en:'The main clicks were no louder against the music than the small ones. Ship sat 3.4 LU under the music and the lockup 5.9, while Theo’s click sat 3.3 under.',zh:'主要的点击相对音乐并不比小动作响。Ship 比音乐低 3.4 LU，收尾标志低 5.9，而 Theo 的点击只低 3.3。'},fix:{en:'Secondary hits came down 4 to 8 dB and the main actions kept a book-knock body. In the last check the six main actions were the six loudest hits, within 1.1 LU of each other.',zh:'次要的声音降了 4 到 8 dB，主要动作保留书本敲击垫底。最后一轮检查中，六个主要动作就是最响的六个声音，彼此相差不到 1.1 LU。'}},
];

const waveD=(()=>{const top=[],bottom=[];EDIT.wave.forEach((v,i)=>{const x=((i+.5)/20).toFixed(3),y=Math.max(v*.92,.02).toFixed(3);top.push(x+','+(-y));bottom.unshift(x+','+y);});return 'M'+top.join('L')+'L'+bottom.join('L')+'Z';})();
const motionMax=Math.max(...EDIT.motion);
const motionD='M'+EDIT.motion.map((v,i)=>(i+.5).toFixed(1)+','+(100-v/motionMax*92).toFixed(2)).join('L');

export default function HakoFilm({lang,reduced,onNavigate}){
 const en=lang==='en',root=useRef(null),video=useRef(null),lanes=useRef(null),scroller=useRef(null),strip=useRef(null),head=useRef(null),tc=useRef(null);
 const beatRef=useRef(0),dragging=useRef(false),paintRef=useRef(null),busyRef=useRef({film:false,sound:false});
 const [beat,setBeat]=useState(0),[failed,setFailed]=useState(false),[hearing,setHearing]=useState(null);
 const {setSuppressed}=useMusic();
 const suppressRef=useRef(setSuppressed);suppressRef.current=setSuppressed;
 const sync=()=>suppressRef.current(busyRef.current.film||busyRef.current.sound);
 const syncMusic=()=>{const v=video.current;busyRef.current.film=Boolean(v&&!v.paused&&!v.ended&&!v.error);if(busyRef.current.film)sound.stopHear();sync();};
 const sound=useMemo(()=>makeSound(
  b=>{busyRef.current.sound=b;sync();},
  ()=>{const v=video.current;if(v&&!v.paused)v.pause();},
  id=>setHearing(id),
  p=>root.current?.style.setProperty('--hear',p.toFixed(4)),
 ),[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>()=>sound.close(),[sound]);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 // the playhead, timecode and inspector follow the video; while it plays they repaint every frame
 useEffect(()=>{
  const v=video.current;let raf=0;
  const paint=()=>{
   const t=Math.min(v.currentTime||0,DUR);
   head.current.style.transform=`translate3d(${(t/DUR*lanes.current.clientWidth).toFixed(2)}px,0,0)`;tc.current.textContent=clock(t);
   lanes.current.setAttribute('aria-valuenow',t.toFixed(1));lanes.current.setAttribute('aria-valuetext',clock(t));
   const i=Math.max(0,BEATS.findIndex(b=>t<b.to));
   const index=t>=DUR?BEATS.length-1:i;
   if(index!==beatRef.current){beatRef.current=index;setBeat(index);}
   const s=scroller.current;
   if(!v.paused&&s.scrollWidth>s.clientWidth){const r=lanes.current,x=r.offsetLeft+t/DUR*r.offsetWidth;if(x<s.scrollLeft+r.offsetLeft||x>s.scrollLeft+s.clientWidth-32)s.scrollLeft=x-s.clientWidth/2;}
  };
  const loop=()=>{paint();if(!v.paused&&!v.ended)raf=requestAnimationFrame(loop);};
  const start=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
  // the playhead moves by transform (sub-pixel, no layout); a resized timeline repaints it
  paintRef.current=paint;paint();
  const resize=new ResizeObserver(()=>paint());resize.observe(lanes.current);
  v.addEventListener('play',start);v.addEventListener('seeked',paint);v.addEventListener('timeupdate',paint);
  const pauseWhenHidden=()=>{if(document.hidden){v.pause();sound.stopHear();}};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>{cancelAnimationFrame(raf);resize.disconnect();v.removeEventListener('play',start);v.removeEventListener('seeked',paint);v.removeEventListener('timeupdate',paint);document.removeEventListener('visibilitychange',pauseWhenHidden);suppressRef.current(false);};
 },[sound]);
 // V1: each shot tiles its own frames at their true 16:9, like an editor's filmstrip
 useEffect(()=>{
  const canvas=strip.current,sprite=new Image();let ready=false;
  const draw=()=>{
   if(!ready)return;
   const ratio=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
   const g=canvas.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);g.clearRect(0,0,w,h);
   const tw=h*16/9;
   for(let s=0;s<SHOTS.length-1;s++){
    const x0=SHOTS[s]/DUR*w,x1=SHOTS[s+1]/DUR*w;
    g.save();g.beginPath();g.rect(x0+.5,0,Math.max(0,x1-x0-1),h);g.clip();
    for(let x=x0;x<x1;x+=tw){const i=Math.min(99,Math.floor((x/w*DUR+.26)/.5));g.drawImage(sprite,(i%10)*192,Math.floor(i/10)*108,192,108,x,0,tw,h);}
    g.restore();
   }
  };
  sprite.onload=()=>{ready=true;draw();};sprite.src=media+'/filmstrip.webp';
  const observer=new ResizeObserver(draw);observer.observe(canvas);
  return()=>{observer.disconnect();sprite.onload=null;};
 },[]);
 const seek=t=>{const v=video.current;v.currentTime=Math.max(0,Math.min(t,DUR-1/FPS));paintRef.current?.();};
 const seekAt=clientX=>{const r=lanes.current.getBoundingClientRect();seek((clientX-r.left)/r.width*DUR);};
 const keys=event=>{
  const v=video.current,step=event.shiftKey?1/FPS:1;
  const to={ArrowRight:v.currentTime+step,ArrowLeft:v.currentTime-step,Home:0,End:DUR}[event.key];
  if(to!==undefined){event.preventDefault();seek(to);}
  else if(event.key===' '){event.preventDefault();v.paused?v.play().catch(()=>{}):v.pause();}
 };
 const jump=t=>{sound.stopHear();seek(t);video.current.play().catch(()=>{});video.current.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});};
 const current=BEATS[beat];
 const shared={lang,sound,hearing};
 const FOLEY=[
  {fam:'click',wave:'kenney-ui-click1',files:['kenney-ui-click1'],
   note:{en:'A recorded mouse button. Agent clicks use the same recording played 25 % faster, which makes them higher and lighter, so they sound like a different hand.',zh:'录下来的鼠标按键。agent 的点击用同一段录音快 25% 播放，音更高、更轻，听起来像另一只手。'},
   plays:[{name:'kenney-ui-click1',o:{hp:160,gain:.9},label:{en:'User click',zh:'用户点击'},meta:'click1 · hp 160 Hz'},{name:'kenney-ui-click1',o:{rate:1.25,hp:600,gain:.55},label:{en:'Agent click',zh:'agent 点击'},meta:'×1.25 · hp 600 Hz'}],
   film:{a:6.9,b:8.5,t:'7.65 s',img:'f0459',label:{en:'Build click, as the band comes in',zh:'点击 Build，乐队在这时进来'}}},
  {fam:'key',wave:'key-04',files:['key-04','key-30',...KEYS.map(k=>'key-'+k),...SPACES.map(k=>'key-'+k)],marks:[[.05,en?'cut':'切']],
   note:{en:'A Cherry keyboard. Each stroke is cut at 50 ms with a 30 ms fade, before the key-up sound, so fast typing doesn’t sound doubled.',zh:'Cherry 机械键盘。每一下在 50 毫秒处切断，淡出 30 毫秒，在抬键声之前结束，连续打字时不会听成两下。'},
   plays:[{name:'key-04',o:{hp:200,lp:10000,gain:.8},label:{en:'One stroke, uncut',zh:'完整的一下'},meta:en?'key-up included':'带抬键声'},{name:'key-04',o:{...keyOpts('04'),gain:.8},label:{en:'Cut before the key-up',zh:'在抬键声前切掉'},meta:'50 + 30 ms'},{name:'key-30',o:{rate:.84,hp:70,gain:.9},label:{en:'The B key',zh:'B 键'},meta:en?'key-30 at 0.84×':'key-30，0.84 倍'}],
   film:{a:5.55,b:7.5,t:'5.85 s',img:'f0384',label:{en:'Typing the prompt',zh:'输入提示词'}},extra:<KeyPad lang={lang} sound={sound}/>},
  {fam:'marimba',wave:'vsco-marimba-B5',files:MARIMBA.map(m=>m[0]),marks:[[.35,'✓ 0.35 s']],
   note:{en:'A recorded marimba (VSCO 2 CE), retuned to the song’s key. Each ✓ is a full note; a panel appearing gets only the mallet strike.',zh:'马林巴录音（VSCO 2 CE），按歌的调重新定音。每个 ✓ 是一个完整的音；面板出现时只用槌子敲击的那一下。'},
   plays:[],film:{a:34.9,b:36.3,t:'35.38 s',img:'f2139',label:{en:'✓ Build, ✓ Checks, ✓ Edge: A, B, E',zh:'✓ Build、✓ Checks、✓ Edge：A、B、E'}},extra:<MarimbaPad lang={lang} sound={sound}/>},
  {fam:'body',wave:'kenney-rpg-bookPlace3',files:['kenney-rpg-bookClose','kenney-rpg-bookPlace1','kenney-rpg-bookPlace3'],marks:[[.022,'+22 ms']],
   note:{en:'The box sounds are books. A cover shutting plays the flaps closing, a book set down plays the touchdown, and a 250 Hz knock sits under the main clicks, in a band the chorus leaves free.',zh:'盒子的声音都来自书：合上书封是盒盖合上，书放到桌上是落地。几个主要的点击下面垫了一记 250 Hz 的敲击，这个频段副歌没有占用。'},
   plays:[{name:'kenney-rpg-bookClose',o:{hp:90,lp:9000,gain:.85},label:{en:'Flaps seal',zh:'盒盖合上'},meta:'bookClose'},{name:'kenney-rpg-bookPlace1',o:{hp:60,lp:9000,gain:.85},label:{en:'Touchdown',zh:'落地'},meta:'bookPlace1'},{name:'kenney-rpg-bookPlace3',o:{hp:120,lp:2500,gain:.9},label:{en:'Body, from first contact',zh:'敲击，从轻触开始'},meta:en?'flams 25 ms late':'晚 25 毫秒，发虚'},{name:'kenney-rpg-bookPlace3',o:{from:.022,hp:120,lp:2500,gain:.9},label:{en:'Body, from the knock',zh:'敲击，从实击开始'},meta:'from +22 ms'}],
   film:{a:31.3,b:32.9,t:'32.24 s',img:'f1935',label:{en:'Ship click, its knock and a 2 dB dip in the music',zh:'Ship 的点击和敲击，音乐压低 2 dB'}}},
  {fam:'pop',wave:'pop-ezd-3',files:['pop-ezd-3','pop-ezd-8','pop-ezd-4','kenney-drop_003'],
   note:{en:'Used only where something springs out: Mia’s pin, the reply row and the popover. They are recorded mouth pops with air in them, pitched to the harmony underneath.',zh:'只用在有东西弹出来的地方：Mia 的评论钉、回复那一行和浮层。用的是带气声的嘴巴录音，音高按底下的和声来定。'},
   plays:[{name:'pop-ezd-3',o:{rate:hz(83)/1021,hp:200,lp:9000,gain:.85},label:{en:'Mia’s pin: B5',zh:'Mia 的评论钉：B5'},meta:'ezd-3 −57 ¢'},{name:'pop-ezd-8',o:{rate:hz(81)/783,hp:200,lp:9000,gain:.85},label:{en:'The popover: A5',zh:'浮层：A5'},meta:'ezd-8 +202 ¢'},{name:'pop-ezd-4',o:{hp:200,lp:9000,gain:.7},label:{en:'Dropped: near-sine',zh:'弃用：近乎正弦'},meta:'ezd-4'}],
   film:{a:17.15,b:18.2,t:'17.60 s',img:'f1057',label:{en:'Mia’s pin, on the cut into the comment',zh:'Mia 的评论钉，落在切入评论的那一刀'}}},
 ];
 return <article ref={root} className={'st-page hk-page'+(reduced?' st-still':'')} data-nav-tone="dark" style={{'--accent':'#ff5a1f'}}>
  <Hero reduced={reduced} video={film} poster={media+'/poster.webp'} title="Hako" tagline={en?['A 50-second film rendered from code,','cut to a song I generated.']:['一支用代码渲染的 50 秒短片，','按我生成的一首歌来剪。']}
   back={<a href="/other-project" onClick={go('/other-project')}>← Other Project</a>} kicker={en?'LAUNCH FILM · HOW IT WAS MADE':'发布短片 · 怎么做出来的'}
   meta={[[en?'FILM':'片子',en?'50 s · 1080p60 · rendered from code':'50 秒 · 1080p60 · 代码渲染'],[en?'MUSIC':'音乐',en?'Track A · 100 BPM · D major':'配乐 A · 100 BPM · D 大调'],[en?'FOLEY':'音效',en?'82 recorded cues':'82 个录音音效'],[en?'BUILT WITH':'工具','Remotion · three.js · Node']]}
   actions={<>
    <button type="button" className="st-btn is-primary" onClick={()=>jump(0)}>▶ {en?'Watch with sound':'开声音看片'}</button>
    <a className="st-btn" href="/product/hako" onClick={go('/product/hako')}>{en?'The product: Hako':'产品本身：Hako'} →</a>
   </>}/>

  <div className="st-wrap">
   <section className="st-section hkt-intro" aria-label={en?'How it was made':'制作顺序'}>
    <Statement reduced={reduced} text={en?'The work went in this order: music, picture, sound. The song was cut to 50 seconds, the picture’s timing was adjusted to land on its hits, and 82 recorded sounds were placed on the frames where a hand or the product acts. The film was rendered from code with Remotion. Nothing was filmed and no editing app was used.':'工作顺序是先音乐，再画面，最后音效。歌剪成 50 秒，画面的时间调到落在歌的重拍上，82 个录音音效放在手或产品有动作的那几帧。整支片子用 Remotion 从代码渲染，没有实拍，也没用剪辑软件。'}/>
    <SignalPath lang={lang} reduced={reduced}/>
   </section>

   <section className="st-section" aria-labelledby="hk-music">
    <SectionHead index={`A1 / ${en?'MUSIC':'音乐'}`} title={<Sel id="hk-music">{en?'Choosing and editing the song':'选歌和剪歌'}</Sel>} lead={en?'The first score was synthesised in Node from modelled piano, marimba and bass. I turned it down, because a modelled score can’t reach the quality of a produced track. Claude wrote prompts for an AI music generator in two directions, I generated a song from each, and the film was cut to one of them.':'第一版配乐是在 Node 里用模拟的钢琴、马林巴和贝斯合成的。我没有用它，因为模拟出来的配乐达不到成品音乐的质量。之后 Claude 写了两个方向的提示词给 AI 音乐生成器，我各生成了一首歌，片子按其中一首来剪。'}/>
    <ol className="hkt-takes">
     <Reveal as="li" className="is-drop"><span className="st-mono">{en?'SCORE V3.1 · CODE':'配乐 v3.1 · 代码'}</span><b>{en?'Modelled acoustic score':'模拟原声配乐'}</b><p>{en?'Modelled piano, marimba and bass, mixed to −14.6 LUFS.':'模拟的钢琴、马林巴和贝斯，混音响度 −14.6 LUFS。'}</p><em>{en?'Rejected':'没用'}</em></Reveal>
     <Reveal as="li" className="is-pick" delay={80}><span className="st-mono">{en?'TRACK A':'配乐 A'}</span><b>“Product Launch”</b><p>{en?'100 BPM, D major, 2:53. The film was already laid out on a 100 BPM grid, so the picture barely had to move.':'100 BPM，D 大调，2 分 53 秒。片子本来就排在 100 BPM 的网格上，画面几乎不用动。'}</p><em>{en?'Used':'用了'}</em></Reveal>
     <Reveal as="li" delay={160}><span className="st-mono">{en?'TRACK B':'配乐 B'}</span><b>“Brass and Claps”</b><p>{en?'About 107.5 BPM with tempo drift, G → E♭. A fitted version was made too; because of the drift it follows tracked beats.':'约 107.5 BPM，速度有漂移，G → E♭。也做了一版对位；因为速度会漂，用的是逐拍追踪出来的拍点。'}</p><em>{en?'Fitted, not used':'做了，没用'}</em></Reveal>
    </ol>
    <MusicEdit {...shared}/>
   </section>

   <section className="st-section" aria-labelledby="hk-warp">
    <SectionHead index={`A1 → V1 / ${en?'WARP':'变速'}`} title={<Sel id="hk-warp">{en?'Fitting the picture to the song':'画面卡点'}</Sel>} lead={en?'Seven picture events had to land on seven hits in the song. The film’s timing is adjusted with W(t) = t + d(t), where d is a smooth spline through the hits that starts and ends at normal speed. Playback speed stays between 0.93× and 1.11×, and every cut is mapped back and pinned to an exact frame.':'画面里有 7 个事件要落在歌的 7 个重拍上。做法是调整画面的时间，W(t) = t + d(t)，d 是一条穿过这些重拍的平滑样条，开头和结尾都是正常速度。播放速度保持在 0.93× 到 1.11× 之间，每个剪辑点都映射回来，固定在整帧上。'}/>
    <Reveal><WarpPanel lang={lang} reduced={reduced} sound={sound} hearing={hearing}/></Reveal>
    <Reveal className="hkt-callout">
     <span className="st-mono">{en?'FIRST FIT':'第一版对位'}</span>
     <p>{en?'The first warp was checked on the delivered mp4. The A/V offset was 0 ms, the joins were inaudible and five anchored hits were within a few milliseconds of the beat. The check still marked it “fix first”, because the Ship click, the film’s title action, landed 52–60 ms (about 3.6 frames) after the beat; track A has no hit there to anchor it. The fix added one more anchor, beat 2 of the chorus to the Ship click, and moved the select click 20 ms ahead of the downbeat so the warp doesn’t have to speed up sharply between the two.':'第一版变速在交付的 mp4 上检查过。音画偏移 0 毫秒，接口听不出来，五个锚定的重拍都只差几毫秒。检查结论仍然是“先修”，因为 Ship 的点击（全片的标题动作）比拍子晚了 52–60 毫秒，约 3.6 帧；配乐 A 在那里没有重拍可以锚定。修改是再加一个锚点，把副歌第 2 拍对到 Ship 的点击，并把选中的点击放到重拍前 20 毫秒，这样两者之间的变速不会突然加快。'}</p>
    </Reveal>
   </section>

   <section className="st-section" aria-labelledby="hk-pic">
    <SectionHead index={`V1 / ${en?'PICTURE':'画面'}`} title={<Sel id="hk-pic">{en?'Four picture rules':'画面的四条规则'}</Sel>} lead={en?'These rules keep the picture steady enough for a sound to read as landing on a frame. Each one was found by measuring renders.':'这四条规则让画面足够稳，声音落在哪一帧才看得出来。每一条都是在测量渲染结果时发现的。'}/>
    <ol className="hkt-rules">
     <Reveal as="li" className="hkt-rule is-wide">
      <div className="hkt-rule-text"><span className="hkt-rule-n">01</span><h3>{en?'Cuts on whole frames and on the beat grid':'剪辑点对齐整帧和节拍网格'}</h3>
       <p>{en?'Each output frame is the average of 8 renders spread over the first half of the frame (a 180° shutter), blended in Node. A cut between frames would mix two shots inside one frame, so every cut and both 3D↔2D swaps of the mark are pinned to frames. Three cuts also sit on the 100 BPM grid, at frames 27, 351 and 783 (0.45, 5.85 and 13.05 s). An eighth note is 18 frames.':'每个输出帧是 8 次渲染的平均，这 8 次分布在这一帧的前半段（相当于 180° 快门），在 Node 里混合。剪辑点如果落在两帧之间，一帧里就会混进两个镜头，所以每个剪辑点和标志的两次 3D↔2D 切换都固定在整帧上。其中三个剪辑点还在 100 BPM 的网格上，分别是第 27、351、783 帧（0.45、5.85、13.05 秒）。一个八分音符是 18 帧。'}</p></div>
      <Shutter lang={lang}/>
     </Reveal>
     <Reveal as="li" className="hkt-rule is-wide">
      <div className="hkt-rule-text"><span className="hkt-rule-n">02</span><h3>{en?'Camera speed between keyframes':'关键帧之间的镜头速度'}</h3>
       <p>{en?'The camera passes through its keys without stopping. Between keys it follows a quintic spline, continuous in position, speed and acceleration. Next to a steep step, the speed and acceleration carried into a key can push the curve past the key and back, and even a brief reverse reads as a hitch. track() clamps the tangents (Fritsch–Carlson), then trims the accelerations until every segment moves in one direction. A key where every axis turns at once also stops the camera, so the axes turn at different keys.':'镜头经过关键帧时不停。关键帧之间走的是五次样条，位置、速度和加速度都连续。如果旁边有一段很陡的变化，带进关键帧的速度和加速度会让曲线冲过关键帧再折回来，哪怕只倒退一瞬间，也会看出顿了一下。track() 先用 Fritsch–Carlson 方法限制斜率，再逐步减小加速度，直到每一段都只朝一个方向走。所有轴在同一个关键帧上同时转向，也会让镜头停住，所以各轴在不同的关键帧上转向。'}</p></div>
      <SplineDemo lang={lang} reduced={reduced}/>
     </Reveal>
     <Reveal as="li" className="hkt-rule">
      <div className="hkt-rule-text"><span className="hkt-rule-n">03</span><h3>{en?'Screen speed per frame':'每帧的画面速度'}</h3>
       <p>{en?'The research budget was about 20 px per frame without blur, with a cap of 60. camspeed.ts measures every frame. Where the camera goes over 20, it stays well under 60, and every frame has motion blur.':'前期研究定的预算是不加模糊时每帧约 20 像素，上限 60。camspeed.ts 每一帧都测。超过 20 的地方也远低于 60，而且每一帧都有运动模糊。'}</p></div>
      <SpeedChart lang={lang}/>
     </Reveal>
     <Reveal as="li" className="hkt-rule">
      <div className="hkt-rule-text"><span className="hkt-rule-n">04</span><h3>{en?'Text motion and pixel snapping':'文字运动和像素取整'}</h3>
       <p>{en?'In Chrome, 2D text eased with translateY snaps to whole pixels, so near the end of an ease it moves 1 px, then 0, then 1, which judders. translate3d with will-change keeps the sub-pixel position. Headlines placed in the 3D scene sheared under the tilted camera; the H leaned 8° and read as italic. They are now billboarded, so they move with the world and always face the lens.':'在 Chrome 里，2D 文字用 translateY 做缓动会被取整到整像素，缓动快结束时就成了动 1 像素、停一帧、再动 1 像素，看起来在抖。translate3d 加 will-change 能保留亚像素位置。放进 3D 场景的标题在倾斜的镜头下会变形，H 歪了 8°，像斜体。现在这些标题始终朝向镜头，跟着场景移动，但一直正对镜头。'}</p></div>
      <SnapChart lang={lang}/>
     </Reveal>
    </ol>
   </section>

   <section className="st-section" aria-labelledby="hk-foley">
    <SectionHead index={`A2 / ${en?'FOLEY':'音效'}`} title={<Sel id="hk-foley">{en?'UI foley: 82 recorded sounds':'界面音效：82 个录音'}</Sel>} lead={en?'Sounds are limited to what a hand or the product does. There are no whooshes or risers, and the headlines come in without sound. Each hit is a CC0 recording placed on the first frame that shows its action. Its level is set against the music in the hit’s own frequency band, and pitched hits are tuned to the song’s key. Every button below plays a sound.':'只有手和产品的动作才有声音，没有呼啸声和上升音效，标题出现时也没有声音。每个声音都是 CC0 授权的录音，放在第一次看到对应动作的那一帧；音量按它所在的频段和音乐比较来定，有音高的声音调到歌的调上。下面的按钮都可以点开听。'}/>
    <WhyRecorded lang={lang} sound={sound}/>
    <ul className="hkt-strips">{FOLEY.map(s=><Strip key={s.fam} {...s} {...shared}/>)}</ul>
    <h3 className="hkt-sub">{en?'Bugs found in review':'评审中发现的问题'}</h3>
    <BugLog {...shared}/>
   </section>

   <section className="st-section hk-film-section" aria-labelledby="hk-beats">
    <SectionHead index={`V1 · A2 / ${en?'TEN BEATS':'十个段落'}`} title={<Sel id="hk-beats">{en?'How each beat was built':'每一段的做法'}</Sel>} lead={en?'Scrolling moves through the ten beats. Each card lists the camera move, how the beat was made and the sounds in it. Click a still to play the film from that point.':'往下滚动会依次经过十个段落。每张卡片写了镜头运动、这一段的做法和其中的声音。点画面可以从那里开始播放。'}/>
    <Reel lang={lang} reduced={reduced} onPlay={jump}/>
   </section>

   <section className="st-section" aria-labelledby="hk-cut">
    <SectionHead index={`TL / ${en?'THE MIX':'混音'}`} title={<Sel id="hk-cut">{en?'The final mix on its timeline':'成片时间线'}</Sel>} lead={en?'The final cut with its picture, music and foley lanes on the 100 BPM grid. Under the foley the music is 0.6 dB lower overall, with four short dips of 1–2 dB under Ship, Live, the marquee and the lockup. The limiter runs on the foley only. The file measures −15.87 LUFS. Click or drag the timeline to jump.':'成片的画面、音乐和音效轨，都对在 100 BPM 的节拍网格上。音效底下的音乐整体低 0.6 dB，在 Ship、Live、大框选和收尾标志四处再短暂压低 1–2 dB。限幅器只作用在音效上。成片响度 −15.87 LUFS。点击或拖动时间线可以跳转。'}/>
    <Reveal>
    <div className="hk-desk">
     <div className="hk-bar"><span className="hk-dots" aria-hidden="true"><i/><i/><i/></span><b>hako-a-sfx.mp4</b><span className="hk-bar-meta">1920 × 1080 · 60 FPS · {en?'TRACK A + FOLEY':'配乐 A + 音效'}</span><span ref={tc} className="hk-tc" aria-hidden="true">00:00:00:00</span></div>
     <video ref={video} controls playsInline preload="metadata" poster={media+'/poster.webp'} aria-label={en?'Hako SaaS launch film':'Hako SaaS 发布短片'} onPlay={syncMusic} onPause={syncMusic} onEnded={syncMusic} onError={()=>{setFailed(true);syncMusic();}}>
      <source src={film} type="video/mp4"/>
      <a href={film}>{en?'Open video':'打开视频'}</a>
     </video>
     <div className="hk-inspector" aria-live="polite">
      <div><span>{en?'BEAT':'段落'} {String(beat+1).padStart(2,'0')} / {BEATS.length}</span><strong>{current.name}</strong></div>
      <p>{current.built[lang]}</p>
      <div><span>{en?'CAMERA':'镜头'}</span><p>{current.camera[lang]}</p></div>
     </div>
     <div ref={scroller} className="hk-timeline">
      <div className="hk-tl">
       <div className="hk-labels" aria-hidden="true"><span/><span>{en?'BEAT':'段落'}</span><span>{en?'TEXT':'字幕'}</span><span>V1</span><span>A1</span><span>A2</span></div>
       <div ref={lanes} className="hk-lanes" role="slider" tabIndex={0} aria-label={en?'Timeline: drag or use the arrow keys to move through the film':'时间线：拖动或用方向键在片中跳转'} aria-valuemin={0} aria-valuemax={DUR}
        onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);dragging.current=true;seekAt(event.clientX);}}
        onPointerMove={event=>{if(dragging.current)seekAt(event.clientX);}}
        onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}}
        onClick={event=>seekAt(event.clientX)} onKeyDown={keys}>
        <svg className="hk-grid" viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none" aria-hidden="true">
         {EDIT.beats.map((b,i)=><line key={i} x1={b} x2={b} y1="0" y2="1"/>)}
         {EDIT.bars.map((b,i)=><line key={'b'+i} className="hk-bar-line" x1={b} x2={b} y1="0" y2="1"/>)}
        </svg>
        <div className="hk-ruler" aria-hidden="true">{Array.from({length:11},(_,i)=><span key={i} style={{left:pos(i*5)}}>{String(i*5).padStart(2,'0')}</span>)}</div>
        <div className="hk-lane hk-beats" aria-hidden="true">{BEATS.map((b,i)=>{const from=i?BEATS[i-1].to:0;return <span key={b.name} className={(i===beat?'is-on':'')+(b.to-from<1.2?' is-short':'')} style={span(from,b.to)}>{b.name}</span>;})}</div>
        <div className="hk-lane hk-text" aria-hidden="true">{HEADLINES.map(([a,b,text])=><span key={text} style={span(a,b)}>{text}</span>)}</div>
        <div className="hk-lane hk-v1" aria-hidden="true"><canvas ref={strip}/>{SHOTS.slice(0,-1).map((s,i)=><span key={s} className={SHOTS[i+1]-s<1.2?'is-short':undefined} style={span(s,SHOTS[i+1])}>{String(i+1).padStart(2,'0')}</span>)}</div>
        <div className="hk-lane hk-a1" aria-hidden="true">
         <svg viewBox={`0 -1 ${DUR} 2`} preserveAspectRatio="none"><path d={waveD}/></svg>
         {MUSIC.map(([a,b,s0,s1])=><span key={a} style={span(a,b)}>A · {mmss(s0)}–{mmss(s1)}</span>)}
        </div>
        <div className="hk-lane hk-a2" aria-hidden="true"><svg viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none">{EDIT.cues.map(([t,f],i)=><line key={i} x1={t} x2={t} y1={1-COLOR[f].h} y2="1" stroke={COLOR[f].color}/>)}</svg></div>
        <div ref={head} className="hk-head" aria-hidden="true"><i/></div>
       </div>
      </div>
     </div>
     <ul className="hk-legend">{FAMILIES.map(f=><li key={f.id}><i style={{background:f.color}}/>{f.label[lang]} <span>{f.count}</span></li>)}<li className="hk-legend-grid">{en?'Lines: beats and bars at 100 BPM':'竖线：100 BPM 的拍与小节'}</li></ul>
    </div>
    </Reveal>
    {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly.':'视频暂时未能加载，请直接打开。'} <a href={film}>{en?'Open video':'打开视频'} ↗</a></p>}
   </section>

   <section className="st-section" aria-labelledby="hk-qc">
    <SectionHead index={`QC / ${en?'CHECKS':'检查'}`} title={<Sel id="hk-qc">{en?'Review notes':'评审记录'}</Sel>} lead={en?'The picture had three rounds of independent review and the foley five. Before a finding was fixed, another reviewer tried to disprove it, usually with a probe on the film’s code or the render.':'画面做了三轮独立评审，音效做了五轮。每条问题在修之前，都由另一位评审尝试推翻，通常是在片子的代码或渲染结果上跑探针。'}/>
    <Reveal as="figure" className="st-chart">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={en?'Frame-to-frame picture change across the 50-second film':'50 秒成片逐帧的画面变化量'}>
      {SHOTS.slice(1,-1).map(s=><line key={s} x1={s*12} x2={s*12} y1="0" y2="100"/>)}
      <path d={motionD}/>
     </svg>
     <figcaption>{en?'Picture change from frame to frame, measured on the final render. Peaks: the agents bursting out of Build (8 s) and the canvas collapsing into the mark (43 s). Dashed: the cuts.':'在最终渲染上逐帧测出的画面变化。两个高峰：agent 从 Build 飞出（8 秒），以及画布收拢成标志（43 秒）。虚线是剪辑点。'}</figcaption>
    </Reveal>
    <ol className="st-notes">{NOTES_QC.map((n,i)=><Reveal as="li" key={i} delay={i*80}><span>{en?'REVIEW NOTE':'评审意见'} 0{i+1}</span><p>{n.note[lang]}</p><span>{en?'WHAT CHANGED':'怎么改的'}</span><p>{n.fix[lang]}</p></Reveal>)}</ol>
   </section>

   <NextProject item={nextAfter('hako')} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / HAKO</span><p>{en?'Hako launch film, 50 s':'Hako 发布短片，50 秒'}</p></footer>
  </div>
 </article>;
}
