'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const out=path.resolve('district-v49-artifacts');fs.mkdirSync(out,{recursive:true});
const base=process.env.CHECK_BASE_URL||'http://127.0.0.1:4189';
const report={revision:'area-higashiyama-quality-v4.16',base,cases:[],checks:[]};
const check=(name,passed,detail)=>{report.checks.push({name,passed:!!passed,detail});assert.ok(passed,name);};
let server,browser;
(async()=>{try{
 if(!process.env.CHECK_BASE_URL){
  if(!process.env.SKIP_BUILD){const r=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:8*60*1000});check('geometry validates',r.status===0,{status:r.status});}
  server=cp.spawn('python3',['-m','http.server','4189','--directory','area-quality-v4/site'],{stdio:'ignore'});
  for(let n=0;n<50;n++){try{if((await fetch(base)).ok)break;}catch(_){}await new Promise(r=>setTimeout(r,100));}
 }
 const engine=process.env.TEST_ENGINE==='chromium'?chromium:webkit;
 browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
 for(const kind of ['iphone','ipad','fallback']){
  const mobile=kind!=='fallback';const ctx=await browser.newContext({viewport:kind==='ipad'?{width:820,height:1180}:kind==='iphone'?{width:390,height:844}:{width:1280,height:960},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce',...(mobile?{userAgent:kind==='iphone'?'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15'}:{})});
  if(kind==='ipad')await ctx.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});});
  const page=await ctx.newPage(),record={kind,requests:[],errors:[],maxPartsInFlight:0};report.cases.push(record);
  const inFlight=new Set();
  page.on('request',r=>{record.requests.push(r.url());if(/\/mobile\/.*\.bin\.gz/.test(r.url())){inFlight.add(r);record.maxPartsInFlight=Math.max(record.maxPartsInFlight,inFlight.size);}});
  page.on('requestfinished',r=>inFlight.delete(r));page.on('requestfailed',r=>inFlight.delete(r));page.on('pageerror',e=>record.errors.push(String(e)));
  if(!mobile){await page.route('**/lighting.bin*',r=>{const body=Buffer.alloc(12);body.write('KVL1');body.writeUInt32LE(1,4);return r.fulfill({status:200,contentType:'application/octet-stream',body});});}
  await page.goto(base+'/?quality=high&view=area',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  record.state=await page.evaluate(()=>({ready:!!window.__ready&&!!phoneTest.ready,revision:phoneTest.model.revision,quality:phoneTest.quality,qualityText:document.querySelector('#quality-label').textContent,qualitySelect:document.querySelector('#quality').value,lowMemoryIOS:window.__lowMemoryIOS,bakedEnabled:phoneTest.renderer.bakedEnabled,shadowSize:phoneTest.renderer.shadowSize,bakedMismatch:phoneTest.renderer.bakedMismatch||null,frames:phoneTest.renderer.frames,glError:phoneTest.renderer.gl.getError(),errors:phoneTest.errors,stats:phoneTest.model.stats,houses:phoneTest.model.areaBuildings.length,roads:phoneTest.model.areaSites.roadReference,labels:[...document.querySelectorAll('.map-spot')].filter(e=>!e.hidden).map(e=>e.textContent)}));
  const s=record.state;check(kind+' actual frame drawn',s.ready&&s.frames>0&&!s.glError,s);
  check(kind+' current model loaded',s.revision===report.revision,s.revision);
  check(kind+' no runtime errors',!s.errors.length&&!record.errors.length,{app:s.errors,page:record.errors});
  check(kind+' focal plane follows overview camera',await page.evaluate(()=>{const r=phoneTest.renderer,g=r.gl,focus=g.getUniform(r.composite,g.getUniformLocation(r.composite,'focus'));return phoneTest.camera.target.every((v,i)=>Math.abs(v-focus[i])<1e-4);}));
  if(mobile){
   record.memory=await page.evaluate(()=>({
    ...phoneTest.model.mobileMemory,modelBuildMs:window.__modelMs,startupMs:window.__startupMs,
    proceduralCodeLoaded:typeof makeStudy!=='undefined',
    cpuMeshes:phoneTest.model.meshes.length,
    batchTypedArrays:phoneTest.renderer.batches.flatMap(Object.values).filter(ArrayBuffer.isView).length,
    uploadedTriangles:phoneTest.renderer.batches.reduce((s,b)=>s+b.count*b.instances/3,0),
    lightSamples:phoneTest.renderer.lightSampleCount,msSamples:phoneTest.renderer.msSamples
   }));
   check(kind+' never fetches procedural scene',!record.requests.some(u=>/\/scene\.js/.test(u))&&!record.memory.proceduralCodeLoaded,record.requests);
   check(kind+' sequential parts no larger than 2 MiB',record.maxPartsInFlight===1&&record.memory.maxChunkBytes<=2*1024*1024&&record.memory.uploadedChunks===record.memory.chunkCount,record.memory);
   check(kind+' retains no CPU geometry after upload',record.memory.cpuMeshes===0&&record.memory.batchTypedArrays===0&&record.memory.stagingBytes===0&&record.memory.retainedGeometryBytes===0,record.memory);
   check(kind+' skips runtime geometry and lighting index generation',!record.memory.proceduralBuild&&!record.memory.runtimeVertexIndexing&&record.memory.lightSamples===0,record.memory);
   check(kind+' preserves every rendered triangle and source instance',s.stats.triangles===4965647&&record.memory.uploadedTriangles===4965647&&s.stats.instances===23659,s.stats);
   check(kind+' no multisample attachments',record.memory.msSamples===1,record.memory);
   check(kind+' skips lighting download',!record.requests.some(u=>/lighting\.bin/.test(u)),record.requests);
   check(kind+' stays light and reports light',s.lowMemoryIOS&&s.quality==='light'&&s.qualityText==='軽量'&&s.qualitySelect==='light',s);
   check(kind+' dynamic lighting enabled',!s.bakedEnabled&&s.shadowSize===1024,s);
   await page.evaluate(()=>phoneTest.setQuality('high'));check(kind+' settings cannot bypass memory guard',await page.evaluate(()=>phoneTest.quality==='light'));
  }else{
   check('mismatched lighting gracefully falls back',!!s.bakedMismatch&&!s.bakedEnabled,s);
   check('fallback allocates usable shadow map',s.shadowSize===3072,s.shadowSize);
  }
  if(kind==='iphone'){
   await page.evaluate(()=>document.querySelector('#toast').hidden=true);
   check('all four landmarks visible in portrait overview',s.labels.length===4,s.labels);
   await page.screenshot({path:path.join(out,'iphone-overview.png'),timeout:120000});
   for(const view of ['hokanji','kodaiji','yasaka','street','temple']){
    await page.locator('[data-view="'+view+'"]').click();
    await page.waitForFunction(v=>document.querySelector('[data-view="'+v+'"]').getAttribute('aria-pressed')==='true',view);
    await page.waitForTimeout(300);await page.evaluate(()=>phoneTest.renderer.gl.finish());
    await page.screenshot({path:path.join(out,'iphone-'+view+'.png'),timeout:120000});
   }
   await page.locator('#reset').click();check('reset returns to district',await page.locator('[data-view="area"]').getAttribute('aria-pressed')==='true');
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(350);await page.evaluate(()=>phoneTest.renderer.gl.finish());
   check('landscape resize keeps drawing',await page.evaluate(()=>phoneTest.ready&&phoneTest.renderer.gl.getError()===0));
   await page.screenshot({path:path.join(out,'iphone-landscape.png'),timeout:120000});
   check('main hall geometry preserved',s.stats.mainHallInstances===2158,s.stats.mainHallInstances);
   check('2843 polygon buildings, thirteen metric landmarks and normalized Kiyomizu loaded',await page.evaluate(()=>phoneTest.model.footprintBuildings.filter(b=>!b.custom).length===2843&&phoneTest.model.metricLandmarks.length===13&&phoneTest.model.kiyomizuPlacement.uniformScale<.12));
   // Restoration must refetch parts, because no CPU geometry is retained.
   const canLose=await page.evaluate(()=>!!phoneTest.renderer.gl.getExtension('WEBGL_lose_context'));
   if(canLose){
    const before=record.requests.filter(u=>/\/mobile\/.*\.bin\.gz/.test(u)).length;
    await page.evaluate(()=>{window.__lose=phoneTest.renderer.gl.getExtension('WEBGL_lose_context');window.__lose.loseContext();});
    await page.waitForFunction(()=>!document.querySelector('#error').hidden);
    await page.evaluate(()=>window.__lose.restoreContext());
    await page.waitForFunction(()=>document.querySelector('#error').hidden&&phoneTest.renderer.frames>0,null,{timeout:120000});
    check('model refetches and restores after context loss',record.requests.filter(u=>/\/mobile\/.*\.bin\.gz/.test(u)).length-before===record.memory.chunkCount&&await page.evaluate(()=>phoneTest.ready&&phoneTest.renderer.gl.getError()===0&&phoneTest.model.mobileMemory.stagingBytes===0));
   }
   await page.reload({waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
   check('iPhone reload draws without procedural generation',await page.evaluate(()=>phoneTest.ready&&phoneTest.renderer.frames>0&&typeof makeStudy==='undefined'&&phoneTest.renderer.gl.getError()===0));
  }
  check(kind+' no late errors',!record.errors.length&&await page.evaluate(()=>phoneTest.errors.length===0),record.errors);
  await ctx.close();
 }
 // Network failures must produce a readable retry screen, never the old heavy path.
 for(const failure of ['503','truncated','corrupt','context-loss']){
  const failedContext=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const failed=await failedContext.newPage();let parts=0;
  await failed.route('**/mobile/*.bin.gz',async route=>{
   if(++parts!==5)return route.continue();
   if(failure==='503')return route.fulfill({status:503,body:'temporarily unavailable'});
   if(failure==='truncated'){const response=await route.fetch(),body=await response.body();return route.fulfill({status:200,contentType:'application/gzip',body:body.subarray(0,body.length-32)});}
   if(failure==='corrupt'){const response=await route.fetch(),z=require('node:zlib'),raw=z.gunzipSync(await response.body());raw[raw.length-12]^=1;return route.fulfill({status:200,contentType:'application/gzip',body:z.gzipSync(raw)});}
   await failed.evaluate(()=>document.querySelector('#scene').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
   await route.abort();
  });
  await failed.goto(base,{waitUntil:'load'});await failed.waitForFunction(()=>!!window.__error,null,{timeout:120000});
  check('mid-load '+failure+' offers retry without heavy fallback',await failed.evaluate(()=>!document.querySelector('#error').hidden&&!window.__ready&&typeof makeStudy==='undefined'));
  await failedContext.close();
 }
 report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,failure:report.failure,checks:report.checks.map(c=>({name:c.name,passed:c.passed}))},null,2));}})();
