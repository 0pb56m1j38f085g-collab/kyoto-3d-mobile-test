'use strict';
// View-only comparisons of the exact, already validated geometry/light artifact.
// This script never substitutes a reference image for the live WebGL scene.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {webkit}=require('playwright'),out='camera-review-artifacts';fs.mkdirSync(out,{recursive:true});
const info=JSON.parse(fs.readFileSync('area-quality-v4/site/build-info.json'));
assert.equal(info.modelHash,'eac03d18e16e42896090064dc7a11797bfeb20d71ca060eeab38fe6256fd5ffe');
assert.equal(info.lightingHash,'ed7a49f41698c82889da94b532605b695a18db50bf58fc5f5080d24ed3bccbf0');
(async()=>{let browser,server;const report={modelHash:info.modelHash,lightingHash:info.lightingHash,views:[]};try{
 server=cp.spawn(process.execPath,['area-quality-v4/tests/serve.cjs','4174','area-quality-v4/site'],{stdio:'ignore'});
 for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:4174')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await webkit.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4174/',{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
 assert.ok(await page.evaluate(()=>window.__ready&&phoneTest.renderer.bakedEnabled&&!window.__error));
 for(const [name,yaw,pitch]of[['north',-.15,.62],['diagonal',-.3,.58],['southwest',-.45,.53]]){
  const camera=await page.evaluate(({yaw,pitch})=>{
   const c=phoneTest.camera;c.target=[-8,4,-24];c.span=70;c.yaw=yaw;c.pitch=pitch;
   const w=390,h=700,pts=phoneTest.model.cartography.framing.overview;
   for(let n=0;n<16;n++){
    const eye=V.add(c.target,[Math.sin(yaw)*Math.cos(pitch)*100,Math.sin(pitch)*100,Math.cos(yaw)*Math.cos(pitch)*100]),vp=M.mul(M.perspective(2*Math.atan(c.span/200),w/h,.25,250),M.look(eye,c.target));
    const pp=pts.map(v=>{const q=M.point(vp,v);return[(q[0]*.5+.5)*w,(.5-q[1]*.5)*h];});
    const x0=Math.min(...pp.map(p=>p[0])),x1=Math.max(...pp.map(p=>p[0])),y0=Math.min(...pp.map(p=>p[1])),y1=Math.max(...pp.map(p=>p[1]));
    c.span*=Math.max(.85,Math.min(1.5,Math.max((x1-x0)/(w-32),(y1-y0)/(h*.74-108))))*1.006;
    const dx=((x0+x1)-w)/2*c.span/h,dy=((y0+y1)-(108+h*.74))/2*c.span/h;
    c.target[0]+=dx*Math.cos(yaw)+dy*Math.sin(yaw)/Math.sin(pitch);
    c.target[2]-=dx*Math.sin(yaw)-dy*Math.cos(yaw)/Math.sin(pitch);
   }
   document.body.classList.add('capture');phoneTest.request();return JSON.parse(JSON.stringify(c));
  },{yaw,pitch});
  await page.waitForTimeout(500);await page.evaluate(()=>{phoneTest.renderer.gl.finish();phoneTest.request();});await page.waitForTimeout(200);
  await page.screenshot({path:path.join(out,name+'.png'),timeout:120000});report.views.push({name,camera});
 }
 report.ok=true;
}catch(e){report.ok=false;report.error=String(e.stack||e);process.exitCode=1;}finally{await browser?.close();server?.kill();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
