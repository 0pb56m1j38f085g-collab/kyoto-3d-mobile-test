'use strict';
// Keep the full previously reviewed tests. Only exact version/hash/count constants change.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const expected={'src/renderer.js':'1b8bc0bda2ac6f9a8e8ac91e6da474510d404c5eed41447c6c40384fc12e0b5a','src/app.js':'50ff32207f6d1836ef371a02e2d863bdfdf84ed16a284abe28a34d41a0d8b9ae','index.html':'bc1b133ebe65c201897030d8025778fc09847b166cc88c15087c4653ff8adcc3'};
const modelHash='6d6c7ef310b9b9d19dafd280c79a11fe4d6297d51e62359778ae3f8408e3b727',sceneHash='c4573b9fc80a0473e57d78096abf51692cc9864211e4e3b98429b406022a5e77';
function reviewedCopy(name,hash,edits){
 let source=fs.readFileSync(path.join(__dirname,name),'utf8');assert.equal(sha(source),hash,'Test source changed unexpectedly: '+name);
 for(const[a,b]of edits){assert.ok(source.includes(a),'Missing test constant '+a);source=source.replaceAll(a,b);}
 const target=path.join(__dirname,'.v54-'+name);fs.writeFileSync(target,source);return target;
}
const geometry=reviewedCopy('geometry-integrity.cjs','9cce2aa818f526a4d6a5571508ccd53029745e07aa12b434fb7713bb050ca79f',[
 ['quality-v5.3','quality-v5.4'],['3378240','3062824']]);
require(geometry);
(async()=>{
 let info;const deadline=Date.now()+40*60*1000;
 while(Date.now()<deadline){
  try{const r=await fetch('https://kiyomizu-quality-v5.onrender.com/build-info.json?check=quality-v5.4',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(r.ok){const value=await r.json();if(value.viewerRevision==='quality-v5.4'&&value.modelHash===modelHash){info=value;break;}}}catch(_){}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 assert.ok(info,'v5.4 was not published before timeout');assert.deepEqual(info.viewerHashes,expected);assert.equal(info.rays,96);assert.equal(info.lightSamples,3062824);
 for(const[file,hash]of Object.entries(expected))assert.equal(sha(fs.readFileSync(path.resolve(__dirname,'../site',file))),hash,'Local built viewer changed');
 assert.equal(sha(fs.readFileSync(path.resolve(__dirname,'../site/src/scene.js'))),sceneHash);
 const browser=reviewedCopy('live-browser.cjs','cb5ca2f4f39423aa45694f41e0f1a9dfd0a5b3d4639d6b321eba35e3cef4d824',[
 ['ff5467b590eb67975f770f8b43085111120f2aa1a1af01d2962ae572fe1c5609',modelHash],
 ['638cbe336981a49addd8d189067bcbc0cd8287562937b205602aa85daad28d6d',sceneHash],
 ['quality-v5.3.1','quality-v5.4'],['quality-v5.3','quality-v5.4'],
 ['3378240','3062824'],['13512968','12251304'],['116095','116217'],['5952520','5158048']]);
 require(browser);
})().catch(e=>{console.error(e);process.exitCode=1;});
