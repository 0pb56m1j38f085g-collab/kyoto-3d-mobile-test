'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const out=path.resolve('district-v49-artifacts');fs.mkdirSync(out,{recursive:true});
const base=process.env.CHECK_BASE_URL||'http://127.0.0.1:4189';
const report={revision:'area-higashiyama-quality-v4.15',base,cases:[],checks:[]};
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
  const page=await ctx.newPage(),record={kind,requests:[],errors:[]};report.cases.push(record);
  page.on('request',r=>record.requests.push(r.url()));page.on('pageerror',e=>record.errors.push(String(e)));
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
    buffers:new Set(phoneTest.model.meshes.flatMap(m=>[m.p.buffer,m.n.buffer,m.index.buffer,m.instanceData.buffer])).size,
    packedMeshes:phoneTest.model.meshes.every(m=>m.prepacked&&m.p instanceof Float32Array&&m.index instanceof Uint32Array),
    lightSamples:phoneTest.renderer.lightSampleCount,msSamples:phoneTest.renderer.msSamples
   }));
   check(kind+' never fetches procedural scene',!record.requests.some(u=>/\/scene\.js/.test(u))&&!record.memory.proceduralCodeLoaded,record.requests);
   check(kind+' uses one bounded typed geometry buffer',record.memory.buffers===1&&record.memory.packedMeshes&&record.memory.geometryBytes<=96*1024*1024,record.memory);
   check(kind+' skips runtime geometry and lighting index generation',!record.memory.proceduralBuild&&!record.memory.runtimeVertexIndexing&&record.memory.lightSamples===0,record.memory);
   check(kind+' preserves every rendered triangle and instance',s.stats.triangles===4965647&&s.stats.instances===23659,s.stats);
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
   // Exercise the retained packed buffer after WebGL context loss, not just startup.
   const canLose=await page.evaluate(()=>!!phoneTest.renderer.gl.getExtension('WEBGL_lose_context'));
   if(canLose){
    await page.evaluate(()=>{window.__lose=phoneTest.renderer.gl.getExtension('WEBGL_lose_context');window.__lose.loseContext();});
    await page.waitForFunction(()=>!document.querySelector('#error').hidden);
    await page.evaluate(()=>window.__lose.restoreContext());
    await page.waitForFunction(()=>document.querySelector('#error').hidden&&phoneTest.renderer.frames>0,null,{timeout:120000});
    check('packed model restores after context loss',await page.evaluate(()=>phoneTest.ready&&phoneTest.renderer.gl.getError()===0&&phoneTest.model.mobilePacked));
   }
   await page.reload({waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
   check('iPhone reload draws without procedural generation',await page.evaluate(()=>phoneTest.ready&&phoneTest.renderer.frames>0&&typeof makeStudy==='undefined'&&phoneTest.renderer.gl.getError()===0));
  }
  check(kind+' no late errors',!record.errors.length&&await page.evaluate(()=>phoneTest.errors.length===0),record.errors);
  await ctx.close();
 }
 // Network failures must produce a readable retry screen, never the old heavy path.
 const failedContext=await browser.newContext({viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 const failed=await failedContext.newPage();await failed.route('**/mobile/*.bin.gz',r=>r.fulfill({status:503,body:'temporarily unavailable'}));
 await failed.goto(base,{waitUntil:'load'});await failed.waitForFunction(()=>!!window.__error);
 check('mobile network failure offers retry without heavy fallback',await failed.evaluate(()=>!document.querySelector('#error').hidden&&document.querySelector('#error-message').textContent.includes('503')&&typeof makeStudy==='undefined'));
 await failedContext.close();
 report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:report.ok,failure:report.failure,checks:report.checks.map(c=>({name:c.name,passed:c.passed}))},null,2));}})();
