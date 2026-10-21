'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');const{chromium}=require('playwright');
const OUT=path.resolve('v44-framing-artifacts'),BASE='http://127.0.0.1:4177';fs.mkdirSync(OUT,{recursive:true});
(async()=>{let server,browser,page;const report={shots:[],errors:[]};try{
 const b=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:8*60*1000});assert.equal(b.status,0);
 server=cp.spawn('python3',['-m','http.server','4177','--directory','area-quality-v4/site'],{stdio:'ignore'});for(let i=0;i<50;i++){try{if((await fetch(BASE)).ok)break}catch(_){}await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,reducedMotion:'reduce'});page=await ctx.newPage();
 await page.goto(BASE+'/?quality=light&capture=1',{waitUntil:'load',timeout:90000});await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:120000});
 const cams=[
  {name:'a',target:[-10,5.7,21],span:44,yaw:.58,pitch:.48},
  {name:'b',target:[-8,5.8,19],span:42,yaw:.58,pitch:.48},
  {name:'c',target:[-7,5.9,17],span:40,yaw:.62,pitch:.47},
  {name:'d',target:[-10,5.7,21],span:40,yaw:.48,pitch:.48},
  {name:'e',target:[-8.5,5.8,19.5],span:38,yaw:.58,pitch:.46}
 ];
 for(const c of cams){await page.evaluate(c=>phoneTest.setCamera(c),c);await page.waitForTimeout(450);await page.screenshot({path:path.join(OUT,'portrait-'+c.name+'.png')});report.shots.push(c);}
 await page.setViewportSize({width:1280,height:960});
 for(const c of cams.slice(0,4)){await page.evaluate(c=>phoneTest.setCamera(c),c);await page.waitForTimeout(450);await page.screenshot({path:path.join(OUT,'wide-'+c.name+'.png')});}
 }catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));}})();