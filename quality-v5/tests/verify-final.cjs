'use strict';
const assert=require('node:assert/strict');
const expected={'src/renderer.js':'b6fd584ed14a349a48f0e41ba23963cadc43d5e98e008ce6e4c2df82d94db75a','src/app.js':'129d9307c263798ffdb4e28327f1a1a650bbc572dcef49652843981352999a4e','index.html':'0595877acb992b5d35d09b7e82ee687572fd90e76e42682af3d519f17c6d84ae'};
(async()=>{
 let info;
 for(let i=0;i<90;i++){
  try{const r=await fetch('https://kiyomizu-quality-v5.onrender.com/build-info.json',{signal:AbortSignal.timeout(15000)});if(r.ok){const v=await r.json();if(v.viewerRevision==='quality-v5.2'){info=v;break;}}}catch(e){}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 assert.ok(info,'Finished viewer has not been published');
 assert.deepEqual(info.viewerHashes,expected,'Published viewer differs from the reviewed files');
 console.log('FINISHED_VIEWER_HASHES_VERIFIED',JSON.stringify(expected));
 require('./live-browser.cjs');
})().catch(e=>{console.error(e);process.exitCode=1;});
