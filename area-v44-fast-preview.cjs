'use strict';
// v4.7 street-detail and soft-presentation review trigger.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright');const OUT=path.resolve('v44-fast-artifacts'),BASE='http://127.0.0.1:4176';
fs.mkdirSync(OUT,{recursive:true});const report={checks:[],shots:[],errors:[],mode:'geometry-only fast preview; baked lighting intentionally absent'};
const check=(n,v,d)=>{report.checks.push({name:n,passed:!!v,detail:d});assert.ok(v,n)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let server,browser,page;try{
 const b=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:8*60*1000});check('geometry build',b.status===0,{status:b.status});
 server=cp.spawn('python3',['-m','http.server','4176','--directory','area-quality-v4/site'],{stdio:'ignore'});let ok=false;for(let i=0;i<50;i++){try{let r=await fetch(BASE);if(r.ok){ok=true;break;}}catch(_){}await sleep(200)}check('server',ok);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,reducedMotion:'reduce'});page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(BASE+'/?quality=light&capture=1&view=area',{waitUntil:'load',timeout:90000});await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:120000});
 check('viewer initializes',await page.evaluate(()=>!!phoneTest?.ready&&!window.__error),await page.evaluate(()=>window.__error||null));check('v4.4 loaded',await page.evaluate(()=>phoneTest.model.revision==='area-higashiyama-quality-v4.10'),await page.evaluate(()=>phoneTest.model.revision));
 const snap=async(v,n,w=430,h=932)=>{await page.setViewportSize({width:w,height:h});await page.evaluate(v=>phoneTest.view(v,false),v);await page.waitForTimeout(500);await page.screenshot({path:path.join(OUT,n),timeout:120000});report.shots.push(n)};
 await snap('area','area-mobile.png');
 const candidates=[
  {target:[-8,5.7,23],span:38,yaw:.58,pitch:.48},
  {target:[-10,5.7,18],span:38,yaw:.58,pitch:.48},
  {target:[-13,5.7,18],span:38,yaw:.58,pitch:.48},
  {target:[-12,5.7,16],span:40,yaw:.58,pitch:.48},
  {target:[-5,5.7,18],span:38,yaw:.58,pitch:.48}
 ];
 for(let i=0;i<candidates.length;i++){await page.evaluate(c=>phoneTest.setCamera(c),candidates[i]);await page.waitForTimeout(400);await page.screenshot({path:path.join(OUT,'area-candidate-'+i+'.png'),timeout:120000});report.shots.push('area-candidate-'+i+'.png');}
 await snap('hokanji','hokanji-mobile.png');await snap('kodaiji','kodaiji-mobile.png');await snap('yasaka','yasaka-mobile.png');await snap('street','street-mobile.png');await snap('area','area-wide.png',1280,960);
 check('runtime errors',report.errors.length===0,report.errors);report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}})();