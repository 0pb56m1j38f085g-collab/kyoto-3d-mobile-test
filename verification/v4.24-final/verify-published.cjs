'use strict';
// Read-only CDN verification against an already tested, downloaded CI artifact.
// This verifies bytes and version consistency, not physical-device rendering.
// Usage: node verification/verify-published.cjs CI_SITE_DIR HTTPS_BASE [REPORT]
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {gunzipSync}=require('node:zlib');
const assert=require('node:assert/strict');
const [site,base,reportPath]=process.argv.slice(2);
assert.ok(site&&base,'Provide the tested CI site directory and public HTTPS URL');
const origin=new URL(base.endsWith('/')?base:base+'/');
assert.equal(origin.protocol,'https:');
const expected=JSON.parse(fs.readFileSync(path.join(site,'build-info.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const checks=[];
function readPublic(file,query){
 const url=new URL(file,origin);assert.equal(url.origin,origin.origin);
 url.searchParams.set('verify',query);
 return new Promise((resolve,reject)=>execFile('curl',['--fail','--silent','--show-error','--location','--max-time','50',url.href],{encoding:'buffer',maxBuffer:24*1024*1024},(e,out)=>e?reject(e):resolve(out)));
}
async function verify(file,hash){
 assert.match(hash,/^[a-f0-9]{64}$/);
 const local=fs.readFileSync(path.join(site,file.replace(/^\.\//,'')));
 assert.equal(sha(local),hash,'CI artifact checksum: '+file);
 const data=await readPublic(file,expected.assetToken);
 assert.equal(sha(data),hash,'Public content differs from CI: '+file);
 checks.push({file,bytes:data.length,sha256:hash});
 return data;
}
(async()=>{
 const actual=JSON.parse(await readPublic('build-info.json',Date.now().toString()));
 for(const key of ['revision','modelHash','lightingHash','bakerHash','rays','assetToken','lightSamples'])assert.equal(actual[key],expected[key],'Public build-info '+key);
 assert.deepEqual(actual.viewerHashes,expected.viewerHashes);
 assert.deepEqual(actual.mobileAsset,expected.mobileAsset);
 for(const [file,hash]of Object.entries(expected.viewerHashes))await verify(file,hash);
 const light=await verify('lighting.bin',expected.lightingHash);
 assert.equal(light.toString('ascii',0,4),'KVL1');
 assert.equal(light.readUInt32LE(4),expected.lightSamples);
 assert.equal(light.length,8+expected.lightSamples*4);
 const manifest=JSON.parse(await verify(expected.mobileAsset.url,expected.mobileAsset.sha256));
 assert.equal(manifest.sourceModelHash,expected.modelHash);
 assert.equal(manifest.lightSampleCount,expected.lightSamples);
 assert.equal(manifest.mobileChunks.length,expected.mobileAsset.chunkCount);
 for(const chunk of manifest.mobileChunks){
  // The manifest hash identifies the unpacked geometry, not the gzip bytes.
  const compressedHash=sha(fs.readFileSync(path.join(site,chunk.url.replace(/^\.\//,''))));
  const data=await verify(chunk.url,compressedHash);assert.equal(data.length,chunk.compressedBytes);
  const geometry=gunzipSync(data);assert.equal(sha(geometry),chunk.sha256);assert.equal(geometry.length,chunk.bytes);
 }
 const report={ok:true,checkedAt:new Date().toISOString(),url:origin.href,revision:expected.revision,modelHash:expected.modelHash,lightingHash:expected.lightingHash,checks,physicalDevice:false,scope:'Public CDN bytes match the browser-tested CI artifact; no claim of physical iPhone verification.'};
 if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
