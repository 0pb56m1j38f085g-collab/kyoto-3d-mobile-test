'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright');
const OUT=path.resolve('area-quality-artifacts'),BASE='http://127.0.0.1:4173';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],errors:[],screenshots:[],environment:'GitHub-hosted Linux / Chromium software WebGL'};
function check(name,condition,detail){report.checks.push({name,passed:Boolean(condition),detail});assert.ok(condition,name);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let server,browser,page;
 try{
  server=cp.spawn('python3',['-m','http.server','4173','--directory','area-preview'],{stdio:'ignore'});
  let alive=false;for(let i=0;i<40;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(e){}await sleep(250);}check('Local preview server started',alive);
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
  page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto(BASE+'/?capture=1&view=area',{waitUntil:'load',timeout:90000});
  await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:120000});
  check('3D initializes',await page.evaluate(()=>!!window.phoneTest?.ready&&!window.__error),await page.evaluate(()=>window.__error||null));
  check('Correct area revision loaded',await page.evaluate(()=>phoneTest.model.revision==='area-higashiyama-quality-v3'),await page.evaluate(()=>phoneTest.model.revision));
  check('Detailed area pass loaded',await page.evaluate(()=>phoneTest.model.areaQuality==='v3-detailed-landmarks-and-streetscape'),await page.evaluate(()=>phoneTest.model.areaQuality));
  const diag=await page.evaluate(()=>({meshes:phoneTest.model.meshes.length,instances:phoneTest.model.meshes.reduce((n,m)=>n+m.instances.length,0),stats:phoneTest.model.stats}));
  report.model=diag;check('Area model has substantial mesh content',diag.meshes>20&&diag.instances>1000,diag);
  async function snap(view,name,viewport={width:430,height:932}){
    await page.setViewportSize(viewport);await page.evaluate(v=>phoneTest.view(v,false),view);await page.waitForTimeout(900);await page.evaluate(()=>phoneTest.renderer.gl.finish());
    await page.screenshot({path:path.join(OUT,name),fullPage:true,timeout:120000});report.screenshots.push(name);
  }
  await snap('area','area-mobile.png');
  await snap('temple','kiyomizu-mobile.png');
  await snap('hokanji','hokanji-mobile.png');
  await snap('kodaiji','kodaiji-mobile.png');
  await snap('yasaka','yasaka-mobile.png');
  await snap('street','street-mobile.png');
  await snap('area','area-wide.png',{width:1280,height:960});
  check('No WebGL error',await page.evaluate(()=>phoneTest.renderer.gl.getError()===0));
  const before=await page.evaluate(()=>phoneTest.camera.yaw);
  await page.mouse.move(170,440);await page.mouse.down();await page.mouse.move(255,440,{steps:4});await page.mouse.up();await page.waitForTimeout(500);
  check('Drag rotates scene',Math.abs((await page.evaluate(()=>phoneTest.camera.yaw))-before)>.05);
  await page.setViewportSize({width:430,height:932});await page.evaluate(()=>phoneTest.view('area',false));await page.waitForTimeout(500);
  const cdp=await ctx.newCDPSession(page);
  const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((p,i)=>({x:p[0],y:p[1],id:i,radiusX:4,radiusY:4,force:1}))});
  const span=await page.evaluate(()=>phoneTest.camera.span);
  await touch('touchStart',[[135,430],[295,430]]);await touch('touchMove',[[100,430],[330,430]]);await touch('touchEnd',[]);await page.waitForTimeout(500);
  check('Pinch zoom works',Math.abs((await page.evaluate(()=>phoneTest.camera.span))-span)>.2);
  check('No runtime errors',report.errors.length===0&&await page.evaluate(()=>phoneTest.errors.length===0),report.errors);
  report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;if(page)try{await page.screenshot({path:path.join(OUT,'failure.png'),fullPage:true});}catch(_){}}
 finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();