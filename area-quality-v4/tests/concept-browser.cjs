'use strict';
// CI browser evidence. This is not a physical-iPhone certification.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const engine=process.env.TEST_BROWSER||'webkit',browserType=require('playwright')[engine];
const out=path.resolve('concept-v421-artifacts',engine);fs.mkdirSync(out,{recursive:true});
const report={engine,checks:[],screenshots:[],physicalDevice:false};
function check(name,ok,detail){report.checks.push({name,passed:!!ok,detail});assert.ok(ok,name);}
(async()=>{let server,browser;try{
 server=cp.spawn(process.execPath,['area-quality-v4/tests/serve.cjs','4174','area-quality-v4/site'],{stdio:'ignore'});
 for(let n=0;n<50;n++){try{if((await fetch('http://127.0.0.1:4174')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await browserType.launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{} )});
 for(const device of ['iphone','desktop']){
  const ctx=await browser.newContext({viewport:device==='iphone'?{width:390,height:700}:{width:1280,height:900},deviceScaleFactor:2,reducedMotion:'reduce',...(device==='iphone'?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{})});
  const page=await ctx.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  const state=await page.evaluate(()=>({ready:window.__ready,error:window.__error,quality:window.phoneTest?.quality,baked:window.phoneTest?.renderer.bakedEnabled,dpr:window.phoneTest?.renderer.dpr,msaa:window.phoneTest?.renderer.msSamples,gl:window.phoneTest?.renderer.gl.getError(),memory:window.phoneTest?.model.mobileMemory,diagnostics:window.phoneTest?.diagnostics(),camera:window.phoneTest?.camera}));
  report[device]=state;
  check(device+' real 3D ready',state.ready&&!state.error,state);
  check(device+' full baked lighting',state.baked&&requests.some(u=>u.includes('lighting.bin')));
  check(device+' shared full resolution',state.quality==='standard'&&state.dpr===1.5&&state.msaa>1,state);
  check(device+' bounded packed upload',!requests.some(u=>u.includes('/scene.js'))&&state.memory.retainedGeometryBytes===0&&state.memory.uploadedChunks===state.memory.chunkCount);
  check(device+' no bottom menu or light option',await page.locator('.bottom,option[value=light]').count()===0);
  check(device+' uphill west-southwest camera',Math.abs(state.camera.yaw+1.15)<.001);
  check(device+' main landmarks reachable as pins or directions',await page.evaluate(()=>['temple','hokanji','kodaiji','yasaka'].every(id=>{const e=document.querySelector('.map-spot[data-view='+id+']');return e&&!e.hidden;})));
  check(device+' displaced labels retain geographic leaders',await page.evaluate(()=>[...document.querySelectorAll('.map-spot')].filter(e=>!e.hidden&&e.dataset.offscreen!=='true').every(e=>Math.hypot(Number(e.dataset.labelX)-Number(e.dataset.anchorX),Number(e.dataset.labelY)-Number(e.dataset.anchorY))<=12||!document.querySelector('.pin-leader[data-view='+e.dataset.view+']').hidden)));
  const snap=async name=>{await page.waitForTimeout(400);await page.evaluate(()=>{phoneTest.renderer.gl.finish();phoneTest.request();});await page.waitForTimeout(100);const f=device+'-'+name+'.png';await page.screenshot({path:path.join(out,f),timeout:120000});report.screenshots.push(f);};
  await snap('area');
  if(device==='iphone'){
   check('offscreen Yasaka has an explicit directional button',await page.locator('.map-spot[data-view=yasaka][data-offscreen=true]').isVisible());
   await page.locator('.map-spot[data-view=yasaka]').click();
   check('offscreen direction opens the real landmark',await page.evaluate(()=>phoneTest.selectedView==='yasaka'));
   await page.evaluate(()=>phoneTest.view('area',false));
  }
  if(device==='iphone'){
   for(const id of ['temple','street','sannenzaka','hokanji','kodaiji','yasaka']){
    await page.evaluate(v=>phoneTest.view(v,false),id);await snap(id);check('view '+id+' draws',await page.evaluate(v=>phoneTest.selectedView===v&&phoneTest.renderer.gl.getError()===0,id));
   }
   await page.evaluate(()=>phoneTest.view('area',false));await page.setViewportSize({width:390,height:660});await snap('short');
   await page.evaluate(()=>phoneTest.setQuality('high'));check('iPhone high quality available',await page.evaluate(()=>phoneTest.quality==='high'&&phoneTest.renderer.dpr===1.8));
   await page.reload();await page.waitForFunction(()=>window.__ready,null,{timeout:180000});check('reload keeps baked quality',await page.evaluate(()=>phoneTest.renderer.bakedEnabled&&phoneTest.quality==='standard'));
   const restore=await page.evaluate(()=>{const e=phoneTest.renderer.gl.getExtension('WEBGL_lose_context');if(!e)return false;e.loseContext();setTimeout(()=>e.restoreContext(),400);return true;});
   if(restore){await page.waitForTimeout(700);await page.waitForFunction(()=>window.__ready&&phoneTest.ready,null,{timeout:180000});check('context restoration keeps baked quality',await page.evaluate(()=>phoneTest.renderer.bakedEnabled&&phoneTest.renderer.gl.getError()===0));}
  }
  check(device+' no runtime errors',errors.length===0&&await page.evaluate(()=>phoneTest.errors.length===0),errors);await ctx.close();
 }
 report.ok=true;
}catch(e){report.ok=false;report.failure=e.stack||String(e);process.exitCode=1;}finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
