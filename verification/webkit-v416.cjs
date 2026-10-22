'use strict';
// Distinguish delayed screenshots from a stale on-demand WebGL presentation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require('playwright');
const out='webkit-public-artifacts',base='https://higashiyama-quality-v4.onrender.com';fs.mkdirSync(out,{recursive:true});
const report={environment:'GitHub Linux WebKit, iPhone UA; not physical iPhone',base,views:[],requests:[],errors:[]};
(async()=>{let browser;try{
 browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
 const page=await context.newPage();page.on('request',r=>report.requests.push(r.url()));page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(base+'/?v=4.16',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
 report.start=await page.evaluate(()=>({ready:phoneTest.ready,revision:phoneTest.model.revision,quality:phoneTest.quality,memory:phoneTest.model.mobileMemory,frames:phoneTest.renderer.frames,gl:phoneTest.renderer.gl.getError(),reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches}));
 assert.ok(report.start.ready&&report.start.quality==='light'&&!report.start.gl);assert.equal(report.start.revision,'area-higashiyama-quality-v4.16');
 const state=()=>page.evaluate(()=>({frames:phoneTest.renderer.frames,camera:JSON.parse(JSON.stringify(phoneTest.camera)),gl:phoneTest.renderer.gl.getError()}));
 const presented=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 for(const view of ['hokanji','kodaiji','yasaka','street','temple','area']){
  const before=await state();await page.locator('[data-view="'+view+'"]').click();
  await page.waitForFunction(f=>phoneTest.renderer.frames>f,before.frames,{timeout:30000});await presented();
  const record={view,before,afterFrame:await state()};report.views.push(record);
  await page.screenshot({path:path.join(out,view+'-presented.png'),timeout:60000});
  if(view==='yasaka'){
   await page.waitForTimeout(1000);record.afterDelay=await state();await page.screenshot({path:path.join(out,view+'-delayed.png')});
   const frames=record.afterDelay.frames;await page.evaluate(()=>phoneTest.request());await page.waitForFunction(f=>phoneTest.renderer.frames>f,frames);await presented();
   record.afterExtraFrame=await state();await page.screenshot({path:path.join(out,view+'-redrawn.png')});
  }
  assert.equal(record.afterFrame.gl,0);
 }
 assert.equal(report.requests.filter(u=>u.includes('lighting.bin')).length,0);assert.equal(report.requests.filter(u=>u.includes('/scene.js')).length,0);assert.deepEqual(report.errors,[]);report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
