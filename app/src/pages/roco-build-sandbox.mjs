// Portable client bundle of the EXISTING S5 prototype. Its game/storage rules are unmodified.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.resolve(root,'../../../s5-prototype');
const output=path.join(root,'public/assets/roco/s5');
fs.mkdirSync(output,{recursive:true});
const entry=`import React,{useEffect,useRef} from 'react';import {createRoot} from 'react-dom/client';import Prototype from './app/simple-prototype';
const notify=(type)=>parent.postMessage({type,source:'jay-s5-local'},location.origin);
class Boundary extends React.Component{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(){notify('s5-error')}render(){return this.state.failed?<main className="portable-status"><h1>原型暂时未能启动</h1><p>进度没有清空，请重试；也可以使用页面下方原始托管入口。</p><button onClick={()=>location.reload()}>重新加载</button></main>:this.props.children}}
function Ready(){const node=useRef(null);useEffect(()=>{const observer=new MutationObserver(()=>{if(node.current?.querySelector('.game-screen')){document.documentElement.dataset.s5Ready='true';notify('s5-ready');observer.disconnect()}});observer.observe(node.current,{subtree:true,childList:true});if(node.current.querySelector('.game-screen')){document.documentElement.dataset.s5Ready='true';notify('s5-ready')}return()=>observer.disconnect()},[]);return <div ref={node}><Prototype/></div>}
createRoot(document.getElementById('root')).render(<Boundary><Ready/></Boundary>);`;
await build({stdin:{contents:entry,resolveDir:source,sourcefile:'portable-entry.jsx',loader:'jsx'},outfile:path.join(output,'sandbox.js'),bundle:true,platform:'browser',format:'iife',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},alias:{'@':source},plugins:[{name:'portable-asset-base',setup(b){b.onLoad({filter:/simple-prototype\.tsx$/},async args=>({contents:fs.readFileSync(args.path,'utf8').replace("=>'/assets/'","=>'/assets/roco/s5/assets/'"),loader:'tsx',resolveDir:path.dirname(args.path)}));}}],legalComments:'linked'});
const cssDirectory=path.join(source,'dist/client/_next/static/css');
const cssFile=fs.readdirSync(cssDirectory).find(file=>file.endsWith('.css'));
if(!cssFile)throw new Error('Original compiled S5 CSS missing');
fs.copyFileSync(path.join(cssDirectory,cssFile),path.join(output,'sandbox.css'));
fs.cpSync(path.join(source,'public/assets'),path.join(output,'assets'),{recursive:true});
fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>S5 异色奇遇｜原双方案交互原型</title><link rel="stylesheet" href="./sandbox.css"><style>.portable-status{padding:48px 28px;color:#fff;font-family:system-ui}.portable-status h1{font-size:24px}.portable-status p{margin:14px 0}.portable-credit{color:#bdc4c1;font:10px/1.8 system-ui;max-width:1350px;padding:10px 20px;margin:auto}.portable-credit a{text-decoration:underline;color:inherit}</style></head><body><div id="root"><main class="portable-status" role="status">正在加载原始 S5 交互原型…</main></div><footer class="portable-credit">个人原创机制提案，非官方游戏。精灵图来自 BWIKI 图鉴，角色美术归原权利方；页面内容依 CC BY-NC-SA 4.0 署名。<a href="https://wiki.biligame.com/rocom/稻草人" target="_blank" rel="noreferrer">稻草人</a> · <a href="https://wiki.biligame.com/rocom/守夜烛" target="_blank" rel="noreferrer">守夜烛</a> · <a href="https://wiki.biligame.com/rocom/栗鼠" target="_blank" rel="noreferrer">栗鼠</a> · <a href="https://s5-encounter-lab.linke0704.chatgpt.site" target="_blank" rel="noreferrer">原始托管入口 ↗</a></footer><script src="./sandbox.js" onerror="document.getElementById('root').innerHTML='<main class=portable-status>原型脚本未能加载，请刷新重试。</main>';parent.postMessage({type:'s5-error',source:'jay-s5-local'},location.origin)"></script></body></html>`);
const evidence=['app/simple-prototype.tsx','app/motion-feedback.tsx','lib/game.ts','lib/storage.ts','README-PROTOTYPE.md'].map(file=>({source:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex')}));
fs.writeFileSync(path.join(output,'source-manifest.json'),JSON.stringify({source:'Existing workspace s5-prototype',adaptations:['Mount original client component without server routing','Rebase six creature image URLs','Add parent-ready/error handshake and standalone fallback','Reuse original compiled CSS'],gameRules:'No changes',storageRules:'No changes; local same-origin browser save is separate from original hosted origin',files:evidence},null,2));
fs.copyFileSync(path.join(source,'README-PROTOTYPE.md'),path.join(output,'ORIGINAL-README.md'));
console.log('S5 original client packaged:',output);
