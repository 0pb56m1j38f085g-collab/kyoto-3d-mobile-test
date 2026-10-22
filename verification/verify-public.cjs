'use strict';
// Verify real public bytes through the host, then relay those unchanged bytes to
// Chromium. This is not a physical iPhone or an end-to-end cellular network test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {chromium}=require('playwright');
const base='https://higashiyama-quality-v4.onrender.com',out=path.resolve('public-v417-artifacts');
const expected=JSON.parse(fs.readFileSync('area-quality-v4/site/build-info.json','utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),report={environment:'Public bytes / host-relayed Chromium; not physical iPhone',cases:[]};
fs.mkdirSync(out,{recursive:true});
(async()=>{let browser;try{
 const info=await(await fetch(base+'/build-info.json?verify='+Date.now(),{signal:AbortSignal.timeout(30000)})).json();
 for(const key of ['revision','modelHash','lightingHash','assetToken','rays'])assert.equal(info[key],expected[key],key);
 report.revision=info.revision;report.assetToken=info.assetToken;
 const cache=new Map();
 async function fetchBytes(file,hash){const url=new URL(file,base),r=await fetch(url,{signal:AbortSignal.timeout(90000)});assert.equal(r.status,200,file);const body=Buffer.from(await r.arrayBuffer());if(hash)assert.equal(sha(body),hash,file);cache.set(url.pathname,{status:r.status,contentType:r.headers.get('content-type')||'application/octet-stream',body});return body;}
 for(const [file,hash]of Object.entries(info.viewerHashes))await fetchBytes('/'+file+'?v='+info.assetToken,hash);
 const manifest=await fetchBytes(info.mobileAsset.url,info.mobileAsset.sha256);assert.equal(manifest.length,info.mobileAsset.manifestBytes);
 const model=JSON.parse(manifest);for(const part of model.mobileChunks){const body=await fetchBytes(part.url);assert.equal(body.length,part.compressedBytes);const raw=zlib.gunzipSync(body);assert.equal(raw.length,part.bytes);assert.equal(sha(raw),part.sha256);assert.ok(raw.length<=2*1024*1024);}
 await fetchBytes('/lighting.bin?v='+info.assetToken,info.lightingHash);report.allAssetHashesVerified=true;report.mobile=info.mobileAsset;
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const mobile of [true,false]){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',...(mobile?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});
  await ctx.route(base+'/**',async route=>{const url=new URL(route.request().url());if(!cache.has(url.pathname))await fetchBytes(url.pathname+url.search);await route.fulfill(cache.get(url.pathname));});
  const page=await ctx.newPage(),record={mobile,requests:[],errors:[]};report.cases.push(record);page.on('request',r=>record.requests.push(r.url()));page.on('pageerror',e=>record.errors.push(String(e)));
  await page.goto(base+'/?v=4.17&quality=high',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  record.state=await page.evaluate(()=>({ready:phoneTest.ready,revision:phoneTest.model.revision,quality:phoneTest.quality,baked:phoneTest.renderer.bakedEnabled,frames:phoneTest.renderer.frames,gl:phoneTest.renderer.gl.getError(),errors:phoneTest.errors,memory:phoneTest.model.mobileMemory,stats:phoneTest.model.stats,labels:[...document.querySelectorAll('.map-spot')].filter(e=>!e.hidden).map(e=>e.textContent)}));
  const s=record.state;assert.ok(s.ready&&!s.gl&&!s.errors.length&&!record.errors.length);assert.equal(s.revision,info.revision);assert.equal(s.stats.triangles,info.triangles);assert.equal(s.labels.length,4);
  const lights=record.requests.filter(u=>u.includes('lighting.bin')).length;
  if(mobile){assert.equal(s.frames,2);assert.equal(s.quality,'light');assert.equal(lights,0);assert.equal(s.baked,false);assert.equal(s.memory.uploadedChunks,info.mobileAsset.chunkCount);assert.equal(s.memory.retainedGeometryBytes,0);assert.equal(s.memory.stagingBytes,0);assert.ok(!record.requests.some(u=>u.includes('/scene.js')));}else{assert.equal(lights,1);assert.equal(s.baked,true);}
  await page.screenshot({path:path.join(out,mobile?'iphone.png':'desktop.png'),timeout:120000});await ctx.close();
 }
 report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
