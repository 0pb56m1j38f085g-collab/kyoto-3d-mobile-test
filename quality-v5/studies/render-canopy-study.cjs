'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const root=path.resolve('canopy-study-artifacts');
const report={checks:[],errors:[],environment:'GitHub Linux Chromium/SwiftShader; not an iPhone'};
const check=(name,pass)=>{report.checks.push({name,passed:!!pass});assert.ok(pass,name);};
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1'),relative=decodeURIComponent(url.pathname);let p=path.resolve(root,'.'+relative);if(!p.startsWith(root+path.sep))throw Error('Invalid path');if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.bin':'application/octet-stream','.json':'application/json'}[ext]||'text/plain','Cache-Control':'no-store'});fs.createReadStream(p).on('error',()=>res.destroy()).pipe(res);}catch(_){res.writeHead(404);res.end();}});
(async()=>{let browser;try{
 await new Promise(resolve=>server.listen(8099,'127.0.0.1',resolve));
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:960},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
 for(const site of ['baseline','candidate']){
  const page=await ctx.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(site+': '+e.message));
  await page.goto('http://127.0.0.1:8099/'+site+'/?quality=high',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  check(site+' initialized',await page.evaluate(()=>!!window.__ready&&!window.__error));
  check(site+' matched light active',await page.evaluate(()=>phoneTest.renderer.bakedEnabled));
  const snap=async(name)=>{await page.waitForTimeout(1200);await page.evaluate(async()=>{await document.fonts.ready;phoneTest.renderer.gl.finish();});await page.screenshot({path:path.join(root,site+'-'+name+'.png'),timeout:120000});};
  await page.evaluate(()=>document.body.classList.add('capture'));await snap('whole');
  await page.evaluate(()=>phoneTest.view('corner',false));await snap('detail');
  await page.evaluate(()=>phoneTest.view('reverse',false));await snap('reverse');
  await page.setViewportSize({width:430,height:932});await page.waitForTimeout(1000);await page.evaluate(()=>{document.body.classList.remove('capture');phoneTest.view('temple',false);});await snap('mobile');
  if(site==='candidate'){
   const yaw=await page.evaluate(()=>phoneTest.camera.yaw);await page.mouse.move(190,460);await page.mouse.down();await page.mouse.move(240,460,{steps:5});await page.mouse.up();await page.waitForTimeout(800);
   check('drag changes camera',Math.abs(await page.evaluate(()=>phoneTest.camera.yaw)-yaw)>.1);
   const before=await page.evaluate(()=>phoneTest.camera.span);await page.locator('#zoom-in').click();await page.waitForTimeout(800);check('zoom changes camera',await page.evaluate(()=>phoneTest.camera.span)<before);
   await page.locator('#help-open').click();await page.locator('#quality').selectOption('light');await page.waitForTimeout(300);check('light quality',await page.evaluate(()=>phoneTest.quality==='light'));
   await page.locator('#quality').selectOption('high');await page.locator('#help-close').click();await page.waitForTimeout(1000);
   const f=await page.evaluate(()=>phoneTest.renderer.frames);await page.waitForTimeout(1000);check('idle stops drawing',await page.evaluate(()=>phoneTest.renderer.frames)===f);
   const cdp=await ctx.newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({x:p[0],y:p[1],id:i,radiusX:4,radiusY:4,force:1}))});
   const span=await page.evaluate(()=>phoneTest.camera.span);await touch('touchStart',[[150,450],[270,450]]);await touch('touchMove',[[120,450],[300,450]]);await touch('touchEnd',[]);await page.waitForTimeout(800);check('pinch changes camera',Math.abs(await page.evaluate(()=>phoneTest.camera.span)-span)>.2);
   report.stats=await page.evaluate(()=>phoneTest.model.stats);report.diagnostics=await page.evaluate(()=>phoneTest.diagnostics());
  }
  check(site+' no WebGL errors',await page.evaluate(()=>phoneTest.renderer.gl.getError()===0));await page.close();
 }
 check('no runtime errors',report.errors.length===0);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(root,'browser-tests.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}})();
