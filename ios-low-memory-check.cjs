'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {webkit}=require('playwright');
const OUT=path.resolve('ios-low-memory-artifacts'),BASE='http://127.0.0.1:4180';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],requests:[],errors:[]};
const check=(n,v,d)=>{report.checks.push({name:n,passed:!!v,detail:d});assert.ok(v,n)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let server,browser,page;try{
 const b=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:6*60*1000});
 check('validate-only build completed',b.status===0,{status:b.status,signal:b.signal});
 server=cp.spawn('python3',['-m','http.server','4180','--directory','area-quality-v4/site'],{stdio:'ignore'});
 let alive=false;for(let i=0;i<60;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(_){}await sleep(200);}check('local site started',alive);
 browser=await webkit.launch({headless:true});
 const ctx=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
 });
 page=await ctx.newPage();
 page.on('request',r=>report.requests.push(r.url()));
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(BASE+'/?ios-low-memory-test=1',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
 const state=await page.evaluate(()=>({
  ready:!!window.phoneTest?.ready,
  error:window.__error||null,
  lowMemoryIOS:window.__lowMemoryIOS,
  quality:window.phoneTest?.quality||null,
  bakedEnabled:window.phoneTest?.renderer?.bakedEnabled??null,
  dpr:window.phoneTest?.renderer?.dpr??null,
  bakedMismatch:window.phoneTest?.renderer?.bakedMismatch||null,
  errors:window.phoneTest?.errors||[]
 }));
 report.state=state;
 check('iOS low-memory detection active',state.lowMemoryIOS===true,state);
 check('3D initializes in iPhone WebKit mode',state.ready&&!state.error,state);
 check('iPhone starts in light quality',state.quality==='light',state.quality);
 check('baked lighting remains disabled',state.bakedEnabled===false,state);
 check('heavy lighting file was never requested',!report.requests.some(u=>u.includes('lighting.bin')),report.requests.filter(u=>u.includes('lighting.bin')));
 check('no runtime errors',state.errors.length===0,state.errors);
 await page.screenshot({path:path.join(OUT,'ios-low-memory.png'),fullPage:true,timeout:120000});
 report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);if(page)try{await page.screenshot({path:path.join(OUT,'failure.png'),fullPage:true,timeout:120000});}catch(_){}process.exitCode=1;}
 finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();