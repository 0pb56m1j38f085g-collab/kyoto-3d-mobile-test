'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium}=require('playwright');
const OUT=path.resolve('area-v4-artifacts'),BASE='http://127.0.0.1:4174';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],errors:[],screenshots:[],environment:'GitHub-hosted Linux / Chromium software WebGL',lightingSamples:12};
function check(name,v,d){report.checks.push({name,passed:!!v,detail:d});assert.ok(v,name);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let server,browser,page;try{
 const build=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs'],{env:{...process.env,LIGHT_SAMPLES:'12'},stdio:'inherit',timeout:45*60*1000});
 check('12-sample area build completed',build.status===0,{status:build.status,signal:build.signal});
 const info=JSON.parse(fs.readFileSync('area-quality-v4/site/build-info.json','utf8'));report.build=info;
 check('Correct area revision',info.revision==='area-higashiyama-quality-v4.2',info.revision);
 check('Baked light data belongs to this model',info.lightingBytes===8+info.lightSamples*4&&info.rays===12,{bytes:info.lightingBytes,samples:info.lightSamples,rays:info.rays});
 server=cp.spawn('python3',['-m','http.server','4174','--directory','area-quality-v4/site'],{stdio:'ignore'});
 let alive=false;for(let i=0;i<60;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(_){}await sleep(250);}check('Local site started',alive);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
 page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(BASE+'/?quality=high&view=area&capture=1',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
 check('3D initializes',await page.evaluate(()=>!!phoneTest?.ready&&!window.__error),await page.evaluate(()=>window.__error||null));
 check('Baked lighting active',await page.evaluate(()=>phoneTest.renderer.bakedEnabled),await page.evaluate(()=>({baked:phoneTest.renderer.bakedEnabled,count:phoneTest.renderer.lightSampleCount})));
 check('v4 area model loaded',await page.evaluate(()=>phoneTest.model.revision==='area-higashiyama-quality-v4.2'),await page.evaluate(()=>phoneTest.model.revision));
 const snap=async(view,name,w=430,h=932)=>{await page.setViewportSize({width:w,height:h});await page.evaluate(v=>phoneTest.view(v,false),view);await page.waitForTimeout(1200);await page.evaluate(()=>phoneTest.renderer.gl.finish());await page.screenshot({path:path.join(OUT,name),fullPage:true,timeout:120000});report.screenshots.push(name);};
 await snap('area','area-mobile.png');await snap('temple','kiyomizu-mobile.png');await snap('hokanji','hokanji-mobile.png');await snap('kodaiji','kodaiji-mobile.png');await snap('yasaka','yasaka-mobile.png');await snap('street','street-mobile.png');await snap('area','area-wide.png',1280,960);
 check('No WebGL error',await page.evaluate(()=>phoneTest.renderer.gl.getError()===0));
 check('No runtime errors',report.errors.length===0&&await page.evaluate(()=>phoneTest.errors.length===0),report.errors);
 report.diagnostics=await page.evaluate(()=>phoneTest.diagnostics());report.ok=true;
 }catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;if(page)try{await page.screenshot({path:path.join(OUT,'failure.png'),fullPage:true});}catch(_){}}
 finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}})();
