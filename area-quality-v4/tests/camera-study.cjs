'use strict';
const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');
const OUT=path.resolve('camera-study-artifacts'),BASE='https://higashiyama-quality-v4.onrender.com';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{let browser;const report={base:BASE,shots:[],errors:[]};try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.setDefaultTimeout(120000);
 await page.goto(BASE+'/?quality=high&v=camera-study',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
 if(!await page.evaluate(()=>!!window.phoneTest?.ready&&!window.__error))throw Error(await page.evaluate(()=>window.__error||'not ready'));
 await page.evaluate(()=>document.body.classList.add('capture'));
 const groups={
  kodaiji:{target:[-17.7,4.9,28.8],span:12.3,pitch:.38,yaws:[-1.55,-.9,-.25,.45,1.15,1.85,2.55]},
  yasaka:{target:[-29.1,4.7,44.6],span:13.2,pitch:.38,yaws:[-1.55,-.9,-.25,.45,1.15,1.85,2.55]},
  area:{target:[-10,5.7,21],span:49,pitch:.48,yaws:[.38,.58,.78,.98,1.18]}
 };
 for(const[name,g]of Object.entries(groups))for(let i=0;i<g.yaws.length;i++){
  const c={target:g.target,span:g.span,yaw:g.yaws[i],pitch:g.pitch};
  await page.evaluate(c=>phoneTest.setCamera(c),c);await page.waitForTimeout(700);await page.evaluate(()=>phoneTest.renderer.gl.finish());
  const file=name+'-'+i+'-yaw-'+String(g.yaws[i]).replace('.','_').replace('-','m')+'.png';
  await page.screenshot({path:path.join(OUT,file),timeout:120000});report.shots.push({file,camera:c});
 }
 }catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(browser)await browser.close();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}})();