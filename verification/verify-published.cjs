'use strict';
// Compare public bytes with the exact browser-tested artifact, including every
// geometry chunk and its uncompressed checksum. No physical-device claim.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const [site,base,reportPath]=process.argv.slice(2);
assert.ok(site&&base);const origin=new URL(base.endsWith('/')?base:base+'/');assert.equal(origin.protocol,'https:');
const expected=JSON.parse(fs.readFileSync(path.join(site,'build-info.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
async function read(file,nonce=expected.assetToken){
 const url=new URL(file,origin);assert.equal(url.origin,origin.origin);url.searchParams.set('verify',nonce);
 const r=await fetch(url,{signal:AbortSignal.timeout(60000),cache:'no-store'});assert.ok(r.ok,'HTTP '+r.status+' '+file);return Buffer.from(await r.arrayBuffer());
}
async function verify(file,hash){
 const local=fs.readFileSync(path.join(site,file));assert.equal(sha(local),hash,'Artifact checksum '+file);
 const data=await read(file);assert.equal(sha(data),hash,'Public bytes '+file);checks.push({file,bytes:data.length,sha256:hash});return data;
}
(async()=>{
 const actual=JSON.parse(await read('build-info.json',String(Date.now())));
 for(const key of['revision','modelHash','lightingHash','bakerHash','rays','assetToken','lightSamples'])assert.equal(actual[key],expected[key],'Public '+key);
 assert.deepEqual(actual.viewerHashes,expected.viewerHashes);assert.deepEqual(actual.mobileAsset,expected.mobileAsset);
 for(const[file,hash]of Object.entries(expected.viewerHashes))await verify(file,hash);
 const light=await verify('lighting.bin',expected.lightingHash);assert.equal(light.toString('ascii',0,4),'KVL1');assert.equal(light.readUInt32LE(4),expected.lightSamples);
 const manifest=JSON.parse(await verify(expected.mobileAsset.url,expected.mobileAsset.sha256));
 assert.equal(manifest.sourceModelHash,expected.modelHash);assert.equal(manifest.lightSampleCount,expected.lightSamples);
 for(const chunk of manifest.mobileChunks){
  const data=await verify(chunk.url,sha(fs.readFileSync(path.join(site,chunk.url)))),raw=zlib.gunzipSync(data);
  assert.equal(data.length,chunk.compressedBytes);assert.equal(raw.length,chunk.bytes);assert.equal(sha(raw),chunk.sha256);
 }
 const report={ok:true,checkedAt:new Date().toISOString(),url:origin.href,revision:expected.revision,modelHash:expected.modelHash,lightingHash:expected.lightingHash,checks,physicalDevice:false,scope:'Public bytes match the browser-tested artifact.'};
 if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
