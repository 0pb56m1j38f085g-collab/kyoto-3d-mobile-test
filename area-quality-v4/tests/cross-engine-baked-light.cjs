'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium,webkit}=require('playwright');
const OUT=path.resolve('cross-engine-baked-artifacts'),BASE='http://127.0.0.1:4181';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],engines:{},errors:[]};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(n,v,d)=>{report.checks.push({name:n,passed:!!v,detail:d});assert.ok(v,n)};
(async()=>{let server;try{
  const build=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs'],{env:{...process.env,LIGHT_SAMPLES:'12'},stdio:'inherit',timeout:55*60*1000});
  check('12-sample deterministic bake completes',build.status===0,{status:build.status,signal:build.signal});
  const info=JSON.parse(fs.readFileSync('area-quality-v4/site/build-info.json','utf8'));report.buildInfo=info;
  check('v4.8 build info',info.revision==='area-higashiyama-quality-v4.8',info);
  check('lighting file matches build info',fs.statSync('area-quality-v4/site/lighting.bin').size===info.lightingBytes,{actual:fs.statSync('area-quality-v4/site/lighting.bin').size,expected:info.lightingBytes});
  server=cp.spawn('python3',['-m','http.server','4181','--directory','area-quality-v4/site'],{stdio:'ignore'});
  let alive=false;for(let i=0;i<60;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(_){}await sleep(250)}check('site starts',alive);
  for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await type.launch({headless:true,args:name==='chromium'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
    try{
      const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
      const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
      await page.goto(BASE+'/?quality=light&view=area&engine='+name,{waitUntil:'load',timeout:120000});
      await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:300000});
      const state=await page.evaluate(()=>({
        ready:!!window.phoneTest?.ready,error:window.__error||null,
        count:window.phoneTest?.renderer?.lightSampleCount??null,
        bakedEnabled:window.phoneTest?.renderer?.bakedEnabled??null,
        bakedMismatch:window.phoneTest?.renderer?.bakedMismatch??null,
        bakedBytes:window.phoneTest?.renderer?.bakedBytes??null,
        revision:window.phoneTest?.model?.revision||null,
        errors:window.phoneTest?.errors||[]
      }));
      state.pageErrors=errs;report.engines[name]=state;
      check(name+' initializes',state.ready&&!state.error,state);
      check(name+' uses baked lighting',state.bakedEnabled===true&&!state.bakedMismatch,state);
      check(name+' light count matches build',state.count===info.lightSamples,{state,build:info.lightSamples});
      await page.screenshot({path:path.join(OUT,name+'.png'),timeout:120000});
    }finally{await browser.close();}
  }
  check('both engines use identical light count',report.engines.chromium.count===report.engines.webkit.count,report.engines);
  report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
finally{if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();