'use strict';
// Public iPhone/WebKit parity check for deterministic v4.8 low-memory mode.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit}=require('playwright');
const URL='https://higashiyama-quality-v4.onrender.com/?v=48-ios-live';
const OUT=path.resolve('live-webkit-artifacts');fs.mkdirSync(OUT,{recursive:true});
const report={url:URL,checks:[],errors:[],console:[],requests:[]};
const check=(n,v,d)=>{report.checks.push({name:n,passed:!!v,detail:d});assert.ok(v,n)};
(async()=>{let browser,page;try{
  const infoRes=await fetch('https://higashiyama-quality-v4.onrender.com/build-info.json?probe='+Date.now(),{cache:'no-store'});
  check('build-info HTTP 200',infoRes.ok,infoRes.status);
  const info=await infoRes.json();report.buildInfo=info;
  check('public revision is deterministic v4.8',info.revision==='area-higashiyama-quality-v4.8',info.revision);
  check('asset token present',typeof info.assetToken==='string'&&info.assetToken.length>10,info.assetToken);
  browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  });
  page=await ctx.newPage();
  page.on('request',r=>report.requests.push(r.url()));
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('console',m=>report.console.push({type:m.type(),text:m.text()}));
  await page.goto(URL,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
  report.webKitState=await page.evaluate(()=>({
    ready:!!window.phoneTest?.ready,
    error:window.__error||null,
    errors:window.phoneTest?.errors||[],
    lowMemoryIOS:window.__lowMemoryIOS,
    quality:window.phoneTest?.quality||null,
    bakedEnabled:window.phoneTest?.renderer?.bakedEnabled??null,
    dpr:window.phoneTest?.renderer?.dpr??null,
    modelRevision:window.phoneTest?.model?.revision||null,
    diagnostics:window.phoneTest?.diagnostics?.()||null
  }));
  const state=report.webKitState;
  check('iPhone low-memory detection active',state.lowMemoryIOS===true,state);
  check('WebKit initializes 3D',state.ready&&!state.error,state);
  check('public v4.8 model loaded',state.modelRevision==='area-higashiyama-quality-v4.8',state.modelRevision);
  check('light mode selected on iPhone',state.quality==='light',state.quality);
  check('baked lighting disabled on iPhone',state.bakedEnabled===false,state.bakedEnabled);
  check('low DPR active',state.dpr<=.62,state.dpr);
  const lightRequests=report.requests.filter(u=>u.includes('lighting.bin'));
  check('browser did not request heavy lighting file',lightRequests.length===0,lightRequests);
  check('no runtime errors',state.errors.length===0&&report.errors.length===0,{state:state.errors,page:report.errors});
  await page.screenshot({path:path.join(OUT,'webkit-live-ios.png'),fullPage:true,timeout:120000});
  report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);if(page)try{await page.screenshot({path:path.join(OUT,'webkit-failure.png'),fullPage:true,timeout:120000});}catch(_){}process.exitCode=1;}
 finally{if(browser)await browser.close();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();