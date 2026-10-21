'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {webkit}=require('playwright');
const OUT=path.resolve('safari-fallback-artifacts'),SITE=path.resolve('area-quality-v4/site'),BASE='http://127.0.0.1:4181';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],errors:[],console:[]};
const check=(name,value,detail)=>{report.checks.push({name,passed:!!value,detail});assert.ok(value,name)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let server,browser,page;try{
 const build=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:8*60*1000});
 check('local patched model build succeeds',build.status===0,{status:build.status,signal:build.signal});
 const infoRes=await fetch('https://higashiyama-quality-v4.onrender.com/build-info.json?webkit-fallback='+Date.now(),{cache:'no-store'});
 check('live build info available',infoRes.ok,infoRes.status);const info=await infoRes.json();report.liveInfo=info;
 const lightRes=await fetch('https://higashiyama-quality-v4.onrender.com/lighting.bin?webkit-fallback='+Date.now(),{cache:'no-store'});
 check('live lighting available',lightRes.ok,lightRes.status);const light=Buffer.from(await lightRes.arrayBuffer());fs.writeFileSync(path.join(SITE,'lighting.bin'),light);
 check('live lighting structure valid',light.toString('ascii',0,4)==='KVL1'&&light.length===8+light.readUInt32LE(4)*4,{bytes:light.length,count:light.readUInt32LE(4)});
 server=cp.spawn('python3',['-m','http.server','4181','--directory',SITE],{stdio:'ignore'});
 let alive=false;for(let i=0;i<50;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(_){}await sleep(200)}check('local site started',alive);
 browser=await webkit.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
 page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>report.console.push({type:m.type(),text:m.text()}));
 await page.goto(BASE+'/?webkit-fallback-test=1',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
 report.state=await page.evaluate(()=>({ready:!!window.phoneTest?.ready,error:window.__error||null,lightSampleCount:window.phoneTest?.renderer?.lightSampleCount||null,bakedEnabled:window.phoneTest?.renderer?.bakedEnabled??null,bakedMismatch:window.phoneTest?.renderer?.bakedMismatch||null,revision:window.phoneTest?.model?.revision||null}));
 check('WebKit no longer fails initialization',report.state.ready&&!report.state.error,report.state);
 check('WebKit mismatch is handled by fallback',report.state.bakedEnabled===false&&!!report.state.bakedMismatch,report.state);
 await page.screenshot({path:path.join(OUT,'webkit-fallback-success.png'),fullPage:true,timeout:120000});
 report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);if(page)try{await page.screenshot({path:path.join(OUT,'webkit-fallback-failure.png'),fullPage:true,timeout:120000});}catch(_){}process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();