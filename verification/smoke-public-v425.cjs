'use strict';
// Read-only check of the deployed page after exact CDN/CI byte verification.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [url,out]=process.argv.slice(2);assert.ok(url&&out);assert.equal(new URL(url).protocol,'https:');
fs.mkdirSync(out,{recursive:true});
(async()=>{let browser;const errors=[];try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
 // The managed HTTPS proxy CA is trusted by Node/curl but not bundled Chromium.
 // The separate byte verifier retains normal TLS verification.
 const page=await browser.newPage({viewport:{width:390,height:700},deviceScaleFactor:2,isMobile:true,hasTouch:true,ignoreHTTPSErrors:!!process.env.HTTPS_PROXY});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.__ready||window.__error,null,{timeout:180000});
 const state=await page.evaluate(()=>({ready:window.__ready,error:window.__error,revision:phoneTest.model.revision,opacity:phoneTest.model.cartography.townMaterial.opacity,baked:phoneTest.renderer.bakedEnabled,gl:phoneTest.renderer.gl.getError()}));
 assert.ok(state.ready&&!state.error&&state.baked&&state.gl===0);assert.equal(state.opacity,.64);assert.ok(state.revision.includes('v4.25'));
 await page.screenshot({path:path.join(out,'public-area.jpg'),type:'jpeg',quality:88,timeout:120000});
 await page.locator('.map-spot[data-view=street]').tap();
 await page.waitForFunction(()=>phoneTest.selectedView==='street');
 await page.waitForTimeout(1500);await page.evaluate(()=>phoneTest.renderer.gl.finish());
 await page.screenshot({path:path.join(out,'public-street.jpg'),type:'jpeg',quality:88,timeout:120000});
 assert.equal(await page.evaluate(()=>phoneTest.renderer.gl.getError()),0);assert.equal(errors.length,0);
 const report={ok:true,checkedAt:new Date().toISOString(),url,state,errors,physicalDevice:false,proxyCertificateBypass:!!process.env.HTTPS_PROXY,scope:'Published page startup and actual Ninenzaka pin tap in Chromium mobile viewport. TLS checked separately by the byte verifier.'};
 fs.writeFileSync(path.join(out,'public-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
