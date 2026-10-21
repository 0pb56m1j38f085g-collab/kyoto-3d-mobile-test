'use strict';
// Deterministic presentation finish; preserves all geometry and matched lighting.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
module.exports=function(site){
 const hashes={'src/renderer.js':'e0ffab67f40a8ec2c7874441c8cda0c45f3d9ded689ec436656d50e74e0aeb73','src/app.js':'cfbb959b08e00734aa4ed5f0a1eaec9ddab0ea1c7b5313c4228fd9244a61d30b','index.html':'825dee7418676a99d38666bb7e63c9d168c8249503cc13ea1907b8fe361b38a0'},out={};
 for(const[file,expected]of Object.entries(hashes)){
  let source=fs.readFileSync(path.join(site,file),'utf8');if(sha(source)!==expected)throw Error('Unexpected v5.3.1 presentation input: '+file);
  if(file==='src/renderer.js')for(const[a,b]of[
   ['indirectLight*1.18+sky*.095','indirectLight*1.18+sky*.115'],
   ['lit+=base*vec3(.19,.17,.14)*fill;','lit+=base*vec3(.38,.31,.24)*fill;'],
   ['vec3(1.0,.92,.83)*2.20*nd*sh','vec3(1.0,.92,.83)*2.05*nd*sh'],
   ['aces(lit*.72)','aces(lit*.76)']
  ]){if(source.split(a).length!==2)throw Error('Unexpected shader fragment');source=source.replace(a,b);}
  else source=source.replaceAll('quality-v5.3.1','quality-v5.4').replaceAll('quality-v5.3','quality-v5.4');
  fs.writeFileSync(path.join(site,file),source);out[file]=sha(source);
 }
 return out;
};
