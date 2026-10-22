'use strict';
// HTTP/hash verification only. Does not launch a browser or claim device QA.
const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const base='https://higashiyama-quality-v4.onrender.com';
const local=JSON.parse(fs.readFileSync('area-quality-v4/site/build-info.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const checks=[];
 async function get(file,expectedHash){const r=await fetch(new URL(file,base),{signal:AbortSignal.timeout(90000)});assert.equal(r.status,200,file);const b=Buffer.from(await r.arrayBuffer());if(expectedHash)assert.equal(sha(b),expectedHash,file);checks.push({path:file,status:r.status,bytes:b.length,sha256:sha(b)});return b;}
 const info=JSON.parse(await get('/build-info.json?verify='+Date.now()));
 for(const k of ['revision','modelHash','lightingHash','assetToken','rays'])assert.equal(info[k],local[k],k);
 assert.deepEqual(info.viewerHashes,local.viewerHashes,'public viewer belongs to tested local build');
 assert.deepEqual(info.mobileAsset,local.mobileAsset,'public mobile pack matches final build');
 const version=info.revision.match(/v(\d+\.\d+(?:\.\d+)?)$/)[1];
 for(const [file,hash]of Object.entries(info.viewerHashes))await get('/'+file+'?v='+info.assetToken,hash);
 await get('/?v='+version,info.viewerHashes['index.html']);
 const bytes=await get(info.mobileAsset.url,info.mobileAsset.sha256);assert.equal(bytes.length,info.mobileAsset.manifestBytes);
 const model=JSON.parse(bytes);let rawBytes=0,compressedBytes=0;
 for(const part of model.mobileChunks){const b=await get(part.url),raw=zlib.gunzipSync(b);assert.equal(b.length,part.compressedBytes);assert.equal(raw.length,part.bytes);assert.equal(sha(raw),part.sha256);assert.ok(raw.length<=2*1024*1024);rawBytes+=raw.length;compressedBytes+=b.length;}
 assert.equal(rawBytes,info.mobileAsset.bytes);assert.equal(compressedBytes,info.mobileAsset.compressedBytes);
 const light=await get('/lighting.bin?v='+info.assetToken,info.lightingHash);assert.equal(light.length,info.lightingBytes);
 console.log(JSON.stringify({ok:true,environment:'Host HTTP and SHA-256 verification only; no public browser or physical device test',verifiedAt:new Date().toISOString(),revision:info.revision,assetToken:info.assetToken,modelHash:info.modelHash,lightingHash:info.lightingHash,mobile:info.mobileAsset,checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
