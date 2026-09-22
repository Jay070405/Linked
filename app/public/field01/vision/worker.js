/* Local, classic worker: MediaPipe's WASM loader uses importScripts. */
const localAsset=path=>new URL(path,self.location.href).href;
importScripts(localAsset('vision_bundle.js'));
let recognizer=null;
self.onmessage=async({data})=>{
  try {
    if(data.type==='init'){
      const files=await Vision.FilesetResolver.forVisionTasks(localAsset('wasm'));
      recognizer=await Vision.GestureRecognizer.createFromOptions(files,{
        baseOptions:{modelAssetPath:localAsset('gesture_recognizer.task'),delegate:'CPU'},
        runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.65,
        minHandPresenceConfidence:.65,minTrackingConfidence:.65,
      });
      self.postMessage({type:'ready'});
    }else if(data.type==='frame'&&recognizer){
      const started=performance.now();
      try {
        const result=recognizer.recognizeForVideo(data.bitmap,data.time);
        self.postMessage({type:'result',time:data.time,latency:performance.now()-started,
          landmarks:result.landmarks,gestures:result.gestures,handedness:result.handedness});
      } finally { data.bitmap.close(); }
    }
  }catch(error){
    self.postMessage({type:'error',message:error instanceof Error?error.message:String(error)});
  }
};
