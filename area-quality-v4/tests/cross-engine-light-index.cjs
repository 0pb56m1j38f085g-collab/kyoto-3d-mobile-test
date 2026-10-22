'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const {chromium,webkit}=require('playwright');
const OUT=path.resolve('cross-engine-artifacts'),BASE='http://127.0.0.1:4180';
fs.mkdirSync(OUT,{recursive:true});
const report={checks:[],engines:{},errors:[]};
const check=(n,v,d)=>{report.checks.push({name:n,passed:!!v,detail:d});assert.ok(v,n)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function nodeCount(){
  const ctx=vm.createContext({console,performance});
  for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join('area-quality-v4/site/src',file),'utf8'),ctx,{filename:file});
  const model=vm.runInContext('makeStudy()',ctx,{timeout:120000});
  let total=0;
  for(const m of model.meshes){
    const ids=new Map();
    for(let vi=0;vi<m.p.length/3;vi++){
      const key=[...m.p.slice(vi*3,vi*3+3),...m.n.slice(vi*3,vi*3+3)].map(Math.fround).join(',');
      if(!ids.has(key))ids.set(key,ids.size);
    }
    total+=ids.size*m.instances.length;
  }
  return {count:total,revision:model.revision,areaQuality:model.areaQuality,meshes:model.meshes.length};
}
(async()=>{let server;try{
  const b=cp.spawnSync(process.execPath,['area-quality-v4/build.cjs','--validate-only'],{stdio:'inherit',timeout:12*60*1000});
  check('deterministic build validates',b.status===0,{status:b.status,signal:b.signal});
  report.engines.node=nodeCount();
  check('node revision v4.8',report.engines.node.revision==='area-higashiyama-quality-v4.8',report.engines.node);
  server=cp.spawn('python3',['-m','http.server','4180','--directory','area-quality-v4/site'],{stdio:'ignore'});
  let alive=false;for(let i=0;i<60;i++){try{const r=await fetch(BASE);if(r.ok){alive=true;break;}}catch(_){}await sleep(250)}check('local site started',alive);
  for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
    const browser=await type.launch({headless:true,args:name==='chromium'?['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
    try{
      const ctx=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
      const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
      await page.goto(BASE+'/?quality=light&view=area&engine='+name,{waitUntil:'load',timeout:120000});
      await page.waitForFunction(()=>window.phoneTest?.ready||window.__error,null,{timeout:180000});
      const state=await page.evaluate(()=>({
        ready:!!window.phoneTest?.ready,
        error:window.__error||null,
        count:window.phoneTest?.renderer?.lightSampleCount??null,
        bakedEnabled:window.phoneTest?.renderer?.bakedEnabled??null,
        bakedMismatch:window.phoneTest?.renderer?.bakedMismatch??null,
        revision:window.phoneTest?.model?.revision||null,
        areaQuality:window.phoneTest?.model?.areaQuality||null,
        errors:window.phoneTest?.errors||[]
      }));
      state.pageErrors=errs;report.engines[name]=state;
      check(name+' initializes',state.ready&&!state.error,state);
      check(name+' revision v4.8',state.revision==='area-higashiyama-quality-v4.8',state);
      await page.screenshot({path:path.join(OUT,name+'.png'),timeout:120000});
    }finally{await browser.close();}
  }
  check('Node and Chromium light-index counts match',report.engines.node.count===report.engines.chromium.count,report.engines);
  check('Node and WebKit light-index counts match',report.engines.node.count===report.engines.webkit.count,report.engines);
  check('Chromium and WebKit light-index counts match',report.engines.chromium.count===report.engines.webkit.count,report.engines);
  report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack||e);process.exitCode=1;}
finally{if(server)server.kill('SIGTERM');fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();