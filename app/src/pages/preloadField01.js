let warmed=false;
// Warm network resources on intent without starting a hidden 3D render loop.
export function preloadField01(){
 if(warmed||navigator.connection?.saveData)return;
 warmed=true;
 // Match the viewer's exact URL so the prefetched GLB can actually be reused.
 for(const path of ['index.html','assets/parts_manifest.json','assets/field01.glb?surface=4']){
  const link=document.createElement('link');link.rel='prefetch';link.href='/field01/'+path;
  link.as=path.endsWith('.html')?'document':'fetch';
  if(link.as==='fetch')link.crossOrigin='anonymous';
  document.head.appendChild(link);
 }
}
