'use strict';
// NON-PUBLISHED study. This is not the approved final appearance.
// Fixed supplementary light is a stylized presentation choice, not a new physical light bake.
// Preserve every model vertex and the existing matched light cache.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
module.exports=function materialStudy(site){
 const file=path.join(site,'src/renderer.js');
 let src=fs.readFileSync(file,'utf8');
 if(sha(src)!=='e0ffab67f40a8ec2c7874441c8cda0c45f3d9ded689ec436656d50e74e0aeb73')throw Error('Unexpected renderer; refuse approximate patch');
 const before={};for(const n of ['src/scene.js','lighting.bin'])before[n]=sha(fs.readFileSync(path.join(site,n)));
 const edits=[
  ['indirectLight*1.18+sky*.095','indirectLight*1.18+sky*.115'],
  ['lit+=base*vec3(.19,.17,.14)*fill;','lit+=base*vec3(.38,.31,.24)*fill;'],
  ['vec3(1.0,.92,.83)*2.20*nd*sh','vec3(1.0,.92,.83)*2.05*nd*sh'],
  ['aces(lit*.72)','aces(lit*.76)']
 ];
 for(const[a,b]of edits){if(src.split(a).length!==2)throw Error('Unexpected shader fragment '+a);src=src.replace(a,b);}
 fs.writeFileSync(file,src);
 for(const[n,h]of Object.entries(before))if(sha(fs.readFileSync(path.join(site,n)))!==h)throw Error('Geometry or light data was altered');
 return {study:'warm-veranda-fill-a',published:false,rendererHash:sha(src),unchanged:before};
};
if(require.main===module)console.log(JSON.stringify(module.exports(process.argv[2]),null,2));
