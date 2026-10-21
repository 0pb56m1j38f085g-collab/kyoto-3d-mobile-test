'use strict';
const assert=require('node:assert/strict');
require('./geometry-integrity.cjs');
const expected={'src/renderer.js':'e0ffab67f40a8ec2c7874441c8cda0c45f3d9ded689ec436656d50e74e0aeb73','src/app.js':'cfbb959b08e00734aa4ed5f0a1eaec9ddab0ea1c7b5313c4228fd9244a61d30b','index.html':'825dee7418676a99d38666bb7e63c9d168c8249503cc13ea1907b8fe361b38a0'};
(async()=>{
 let info;
 for(let i=0;i<210;i++){
  try{const r=await fetch('https://kiyomizu-quality-v5.onrender.com/build-info.json?check=v5.3.1',{signal:AbortSignal.timeout(15000),cache:'no-store'});if(r.ok){const v=await r.json();if(v.viewerRevision==='quality-v5.3.1'){info=v;break;}}}catch(e){}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 assert.ok(info,'Finished v5.3.1 viewer has not been published');
 assert.deepEqual(info.viewerHashes,expected,'Published viewer differs from the reviewed files');
 assert.equal(info.modelHash,'ff5467b590eb67975f770f8b43085111120f2aa1a1af01d2962ae572fe1c5609');
 assert.equal(info.rays,96);
 console.log('FINISHED_VIEWER_HASHES_VERIFIED',JSON.stringify(expected));
 require('./live-browser.cjs');
})().catch(e=>{console.error(e);process.exitCode=1;});
