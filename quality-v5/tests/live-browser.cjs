'use strict';
// Read-only end-to-end verification of the isolated preview, never mutates GitHub or Render.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=path.resolve('quality-test-artifacts'),BASE='https://kiyomizu-quality-v5.onrender.com';
const HASH='ff5467b590eb67975f770f8b43085111120f2aa1a1af01d2962ae572fe1c5609';
fs.mkdirSync(OUT,{recursive:true});
const report={preview:BASE,checks:[],errors:[],screenshots:[],measuredHardware:'GitHub-hosted Linux / Chromium software WebGL, not an iPhone'};
function check(name,condition,detail){report.checks.push({name,passed:Boolean(condition),detail});assert.ok(condition,name);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function asset(file){const r=await fetch(BASE+'/'+file,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(file+' HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());const target=path.join(OUT,'site',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);return b;}
(async()=>{
 let browser,page;
 try{
  let info;
  for(let i=0;i<90;i++){try{const r=await fetch(BASE+'/build-info.json',{signal:AbortSignal.timeout(15000)});if(r.ok){const v=await r.json();if(v.modelHash===HASH&&v.viewerRevision==='quality-v5.3.1'){info=v;break;}}}catch(e){}await sleep(10000);}
  check('Published build matches validated model hash',!!info,info);report.build=info;
  for(const file of['index.html','src/renderer.js','src/scene.js','src/app.js','build-info.json','lighting.bin','robots.txt'])await asset(file);
  const lighting=fs.readFileSync(path.join(OUT,'site/lighting.bin'));
  check('Light data has expected header and vertex count',lighting.toString('ascii',0,4)==='KVL1'&&lighting.readUInt32LE(4)===3378240&&lighting.length===13512968,{bytes:lighting.length,sha256:crypto.createHash('sha256').update(lighting).digest('hex')});
  check('Lighting bytes match the published geometry build',crypto.createHash('sha256').update(lighting).digest('hex')===info.lightingHash);
  for(const [file,expected]of Object.entries(info.viewerHashes))check('Published asset hash: '+file,crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT,'site',file))).digest('hex')===expected);
  check('Refined scene hash matches approved build input',crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT,'site/src/scene.js'))).digest('hex')==='638cbe336981a49addd8d189067bcbc0cd8287562937b205602aa85daad28d6d');
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1280,height:960},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
  page=await context.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(BASE+'/?quality=high&v=quality-v5.3.1',{waitUntil:'load',timeout:90000});
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:120000});
  check('3D initializes successfully',await page.evaluate(()=>!!window.__ready&&!window.__error),await page.evaluate(()=>window.__error||null));
  check('Precomputed indirect light and sunlight are active',await page.evaluate(()=>phoneTest.renderer.bakedEnabled));
  check('Refined model is loaded, not a stale scene',await page.evaluate(()=>phoneTest.model.revision==='quality-v5.3'));
  check('Offscreen native multisampling is active',await page.evaluate(()=>!!phoneTest.renderer.msFB&&phoneTest.renderer.msSamples>=2));
  check('Indexed meshes preserve triangle count with less uploaded vertex data',await page.evaluate(()=>phoneTest.renderer.uploadedUniqueVertices===116095&&phoneTest.model.stats.triangles===5952520));
  check('Matched lighting count is used by the renderer',await page.evaluate(()=>phoneTest.renderer.lightSampleCount===3378240));
  check('WebGL reports no error',await page.evaluate(()=>phoneTest.renderer.gl.getError()===0));
  const snap=async(name)=>{
   await page.waitForTimeout(2000);
   await page.evaluate(async()=>{await document.fonts.ready;phoneTest.renderer.gl.finish();});
   await page.screenshot({path:path.join(OUT,name),timeout:120000});
   report.screenshots.push(name);
  };
  await page.evaluate(()=>document.body.classList.add('capture'));await snap('overview.png');
  await page.evaluate(()=>phoneTest.view('corner',false));await snap('detail.png');
  await page.evaluate(()=>phoneTest.view('reverse',false));await snap('alternate-angle.png');
  await page.evaluate(()=>{document.body.classList.remove('capture');phoneTest.view('temple',false);});
  const original=await page.evaluate(()=>({...phoneTest.camera,target:[...phoneTest.camera.target]}));
  await page.locator('#zoom-in').click();await page.waitForTimeout(1200);
  check('Zoom button changes camera distance',await page.evaluate(s=>phoneTest.camera.span<s,original.span));
  await page.locator('#reset').click();await page.waitForTimeout(1200);
  check('Reset restores camera',Math.abs((await page.evaluate(()=>phoneTest.camera.span))-original.span)<.01);
  const yaw=await page.evaluate(()=>phoneTest.camera.yaw);
  await page.mouse.move(570,460);await page.mouse.down();await page.mouse.move(700,460,{steps:6});await page.mouse.up();await page.waitForTimeout(1000);
  check('Drag rotates actual geometry',Math.abs((await page.evaluate(()=>phoneTest.camera.yaw))-yaw)>.1);
  await page.locator('[data-view="corner"]').click();await page.waitForTimeout(1000);
  check('Detail view selects correct tab',await page.locator('[data-view="corner"]').getAttribute('aria-pressed')==='true');
  await page.locator('#help-open').click();check('Help opens as dialog',await page.locator('#help').isVisible());
  const modalFrames=await page.evaluate(()=>phoneTest.renderer.frames);
  await page.locator('#quality').selectOption('light');await page.waitForTimeout(500);check('Light quality mode works',await page.evaluate(()=>phoneTest.quality==='light'));
  await page.locator('#quality').selectOption('high');await page.waitForTimeout(500);
  check('Quality dialog avoids background GPU work',await page.evaluate(f=>phoneTest.renderer.frames===f,modalFrames));
  await page.locator('#help-close').click();check('Dialog closes',await page.locator('#help').isHidden());
  await page.setViewportSize({width:430,height:932});await page.waitForTimeout(1000);await page.evaluate(()=>phoneTest.view('temple',false));await snap('mobile.png');
  check('Portrait canvas fits screen',await page.evaluate(()=>document.querySelector('#scene').clientWidth===430&&document.querySelector('#scene').clientHeight===932));
  const cdp=await context.newCDPSession(page);
  const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((p,i)=>({x:p[0],y:p[1],id:i,radiusX:4,radiusY:4,force:1}))});
  const before=await page.evaluate(()=>phoneTest.camera.span);
  await touch('touchStart',[[150,430],[270,430]]);await touch('touchMove',[[120,430],[300,430]]);await touch('touchEnd',[]);await page.waitForTimeout(1000);
  check('Two-finger pinch changes camera distance',Math.abs((await page.evaluate(()=>phoneTest.camera.span))-before)>.2);
  const target=await page.evaluate(()=>[...phoneTest.camera.target]);
  await touch('touchStart',[[140,430],[280,430]]);await touch('touchMove',[[160,450],[300,450]]);await touch('touchEnd',[]);await page.waitForTimeout(800);
  check('Two-finger gesture moves camera target',await page.evaluate(t=>Math.hypot(...phoneTest.camera.target.map((v,i)=>v-t[i]))>.02,target));
  await page.locator('#reset').click();await page.waitForTimeout(1800);
  const frames=await page.evaluate(()=>phoneTest.renderer.frames);await page.waitForTimeout(1800);check('Rendering stops while idle',await page.evaluate(f=>phoneTest.renderer.frames===f,frames));
  await page.setViewportSize({width:932,height:430});await page.waitForTimeout(1200);check('Landscape resize succeeds',await page.evaluate(()=>phoneTest.ready&&!window.__error&&phoneTest.renderer.gl.getError()===0));await snap('landscape.png');
  check('No JavaScript runtime errors',report.errors.length===0&&await page.evaluate(()=>phoneTest.errors.length===0),report.errors);
  report.diagnostics=await page.evaluate(()=>phoneTest.diagnostics());
  await page.setViewportSize({width:430,height:932});await page.waitForTimeout(1000);await page.evaluate(()=>phoneTest.view('temple',false));await snap('mobile-final.png');
  check('MSAA resize and touch gestures leave no WebGL errors',await page.evaluate(()=>phoneTest.renderer.gl.getError()===0));
  const originalPage=await context.newPage();
  await originalPage.setViewportSize({width:1280,height:960});
  await originalPage.goto('https://kyoto-3d-mobile-test.onrender.com/?quality=high',{waitUntil:'load',timeout:90000});
  await originalPage.waitForFunction(()=>window.__ready||window.__error,null,{timeout:120000});
  check('Stable original site is unchanged and still opens',await originalPage.evaluate(()=>!!window.__ready&&!window.__error));
  await originalPage.evaluate(()=>{document.body.classList.add('capture');phoneTest.renderer.gl.finish();});
  await originalPage.screenshot({path:path.join(OUT,'stable-before.png'),timeout:120000});
  report.screenshots.push('stable-before.png');
  await originalPage.close();
  report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;
  if(page)try{report.failureState=await page.evaluate(()=>({modal:window.phoneTest?.modal,quality:window.phoneTest?.quality,ready:window.__ready,error:window.__error,helpHidden:document.querySelector('#help')?.hidden,sheetScroll:document.querySelector('#help .sheet')?.scrollTop,closeBounds:document.querySelector('#help-close')?.getBoundingClientRect().toJSON(),active:document.activeElement?.id}));await page.screenshot({path:path.join(OUT,'failure-state.png'),timeout:120000});}catch(_){}
 }finally{if(browser)await browser.close();fs.writeFileSync(path.join(OUT,'test-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
