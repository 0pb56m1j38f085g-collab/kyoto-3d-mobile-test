'use strict';
// Compare actual browser allocations, not an iPhone-sized viewport alone.
// This remains desktop Chromium with software WebGL, NOT a physical iPhone.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright');
const output=path.resolve('mobile-memory-artifacts');fs.mkdirSync(output,{recursive:true});
const report={environment:'Desktop Chromium / iPhone UA / software WebGL; not physical iPhone',cases:[]};
const local='http://127.0.0.1:4191',publicBase='https://higashiyama-quality-v4.onrender.com';
(async()=>{let browser,server;try{
 server=cp.spawn('python3',['-m','http.server','4191','--directory','area-quality-v4/site'],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{if((await fetch(local)).ok)break;}catch(_){}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info']});
 for(const baseline of(process.env.COMPARE_PUBLIC? [true,false]:[false])){
  const base=baseline?publicBase:local,context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  if(baseline)await context.route(publicBase+'/**',async route=>{const r=await fetch(route.request().url(),{signal:AbortSignal.timeout(90000)});await route.fulfill({status:r.status,contentType:r.headers.get('content-type')||'application/octet-stream',body:Buffer.from(await r.arrayBuffer())});});
  const page=await context.newPage(),session=await context.newCDPSession(page),record={baseline,base,requests:[],errors:[]};report.cases.push(record);
  page.on('request',r=>record.requests.push(r.url()));page.on('pageerror',e=>record.errors.push(String(e)));
  record.startupSamples=[];let sampling=true;
  const sampler=(async()=>{while(sampling){try{record.startupSamples.push(await session.send('Runtime.getHeapUsage'));}catch(_){break;}await new Promise(r=>setTimeout(r,100));}})();
  await page.goto(base+'/?quality=high&view=area',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
  sampling=false;await sampler;
  record.firstFrameHeap=await session.send('Runtime.getHeapUsage');
  record.sampledPeakBackingBytes=Math.max(...record.startupSamples.map(s=>s.backingStorageSize),record.firstFrameHeap.backingStorageSize);
  record.state=await page.evaluate(()=>({revision:phoneTest.model.revision,ready:phoneTest.ready,frames:phoneTest.renderer.frames,ms:window.__startupMs,memory:phoneTest.model.mobileMemory||null,stats:phoneTest.model.stats,gl:phoneTest.renderer.gl.getError()}));
  assert.ok(record.state.ready&&!record.state.gl&&!record.errors.length);
  await session.send('HeapProfiler.collectGarbage');record.afterGC=await session.send('Runtime.getHeapUsage');
  if(!baseline){
   assert.ok(record.afterGC.usedSize<64*1024*1024,'bounded JS object heap (not total process/GPU memory)');
   assert.ok(record.afterGC.backingStorageSize<8*1024*1024,'no retained monolithic CPU geometry');
   assert.ok(record.sampledPeakBackingBytes<64*1024*1024,'sampled startup backing storage budget; not total process/GPU peak');
   for(const view of ['temple','hokanji','kodaiji','yasaka','street','area']){
    await page.evaluate(v=>phoneTest.view(v,false),view);await page.waitForTimeout(100);await page.evaluate(()=>phoneTest.renderer.gl.finish());
    await page.screenshot({path:path.join(output,'packed-'+view+'.png'),timeout:120000});
   }
   for(let i=0;i<12;i++){await page.evaluate(i=>{phoneTest.setCamera({yaw:-.58+i*.04});},i);await page.waitForTimeout(80);}
   await page.evaluate(()=>phoneTest.renderer.gl.finish());assert.equal(await page.evaluate(()=>phoneTest.renderer.gl.getError()),0);
   await session.send('HeapProfiler.collectGarbage');record.afterInteractionGC=await session.send('Runtime.getHeapUsage');
   assert.ok(record.afterInteractionGC.usedSize<64*1024*1024);
   assert.ok(record.afterInteractionGC.backingStorageSize<8*1024*1024);
  }
  await context.close();
 }
 report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
