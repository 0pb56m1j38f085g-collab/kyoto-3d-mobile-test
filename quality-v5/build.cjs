'use strict';
// Reproducible build. Optional checksum-verified lighting cache from our own public preview; no credentials or Git writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=__dirname,site=path.join(root,'site'),out=path.join(root,'.build');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.join(site,'src'),{recursive:true});fs.mkdirSync(out,{recursive:true});
for(const patch of JSON.parse(fs.readFileSync(path.join(root,'patches.json'),'utf8'))){
 if(!['src/renderer.js','src/app.js','index.html'].includes(patch.path))throw Error('Unexpected patch target');
 const original=fs.readFileSync(path.join(root,'base',path.basename(patch.path)),'utf8');
 if(sha(original)!==patch.base)throw Error('Base asset checksum mismatch: '+patch.path);
 let result='',last=0;for(const [start,end,text] of patch.ops){if(start<last||end<start||end>original.length)throw Error('Invalid patch offsets');result+=original.slice(last,start)+text;last=end;}result+=original.slice(last);
 if(sha(result)!==patch.result)throw Error('Patched asset checksum mismatch: '+patch.path);
 if(patch.path==='src/renderer.js')result=result.replace('bakedEnabled?indirectLight:', 'bakedEnabled?(indirectLight*1.12+sky*.045):');
 if(patch.path==='index.html')result=result.replace('>本堂と庭</button>', '>本堂全景</button>');
 const expected={'src/renderer.js':'346f7f8688507e7a000cfcf965e6f6e436a8920641841c807b6060ced84d8bff','src/app.js':'479947687c3d62a387126f787131e245e92686fdeab9f57359983fb331fc2a5c','index.html':'c131f63343b94ddb66f5672dfab115b481dd8435b3ac71a347e228ca02ad26ff'};
 if(sha(result)!==expected[patch.path])throw Error('Final asset checksum mismatch: '+patch.path);
 fs.writeFileSync(path.join(site,patch.path),result);
}
const reviewedScene=require('./refine.cjs')(fs.readFileSync(path.join(root,'scene.js'),'utf8'));
const canopyScene=require('./studies/canopy-v54.cjs')(reviewedScene).replace('quality-v5.4-study','quality-v5.4');
fs.writeFileSync(path.join(site,'src/scene.js'),canopyScene);
fs.writeFileSync(path.join(site,'robots.txt'),'User-agent: *\nDisallow: /\n');
require('./finish.cjs')(site);
require('./presentation.cjs')(site);
require('./interaction.cjs')(site);
const viewerHashes=require('./finish-v54.cjs')(site);
fs.writeFileSync(path.join(out,'viewer-hashes.json'),JSON.stringify(viewerHashes,null,2));
for(const file of ['renderer.js','scene.js','app.js'])cp.execFileSync(process.execPath,['--check',path.join(site,'src',file)],{stdio:'inherit'});
const context=vm.createContext({console,performance});
for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(site,'src',file),'utf8'),context,{filename:file});
const scene=vm.runInContext('makeStudy()',context,{timeout:60000});
if(scene.stats.stageSupportCount!==18||scene.stats.mainBays.join(',')!=='9,7')throw Error('Unexpected architectural model revision');
let size=12,instances=0;
for(const m of scene.meshes){
 if(m.p.length%9||m.n.length!==m.p.length||m.u.length!==m.p.length/3*2)throw Error('Invalid geometry lengths: '+m.name);
 for(const a of[m.p,m.n,m.u])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid vertex in '+m.name);
 for(const i of m.instances){for(const a of[i.p,i.s,i.q,i.c])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid instance in '+m.name);if(i.s.some(v=>v<=0))throw Error('Non-positive model dimension');}
 size+=8+Buffer.byteLength(m.name)+m.p.length/9*96;instances+=m.instances.length;
}
size+=instances*60;const b=Buffer.alloc(size);let at=0;
function u(v){b.writeUInt32LE(v,at);at+=4;}function f(v){b.writeFloatLE(v===0?0:v,at);at+=4;}
b.write('KYT4',at);at+=4;u(scene.meshes.length);u(instances);
for(const m of scene.meshes){const name=Buffer.from(m.name);u(name.length);name.copy(b,at);at+=name.length;u(m.p.length/9);for(let t=0;t<m.p.length/9;t++){for(let k=0;k<9;k++)f(m.p[t*9+k]);for(let k=0;k<9;k++)f(m.n[t*9+k]);for(let k=0;k<6;k++)f(m.u[t*6+k]);}}
scene.meshes.forEach((m,gi)=>{for(const i of m.instances){u(gi);u(i.mat);for(const v of[...i.p,...i.s,...i.q,...i.c])f(v);}});
if(at!==size)throw Error('Packed model length mismatch');
const hash=sha(b);if(hash!=='6d6c7ef310b9b9d19dafd280c79a11fe4d6297d51e62359778ae3f8408e3b727')throw Error('Model differs from the validated geometry: '+hash);
const scenePath=path.join(out,'scene.bin');fs.writeFileSync(scenePath,b);console.log('MODEL_SHA256',hash);
if(process.argv.includes('--validate-only')){console.log('MODEL_VALIDATED',JSON.stringify(scene.stats));process.exit(0);}
async function buildLighting(){
 const source=path.join(root,'bake_vertex.cpp'),exe=path.join(out,'bake_vertex');
 const rays=process.env.LIGHT_SAMPLES||'96';if(!/^(24|48|96|128)$/.test(rays))throw Error('Unsupported light sample count');
 const lightPath=path.join(site,'lighting.bin'),bakerHash=sha(fs.readFileSync(source));
 const lightCount=3062824,lightSize=8+lightCount*4;
 function validInfo(info){return info&&info.modelHash===hash&&info.bakerHash===bakerHash&&info.rays===Number(rays)&&info.lightSamples===lightCount&&/^[a-f0-9]{64}$/.test(info.lightingHash);}
 function validLight(data,info){return validInfo(info)&&data.length===lightSize&&data.toString('ascii',0,4)==='KVL1'&&data.readUInt32LE(4)===lightCount&&sha(data)===info.lightingHash;}
 let cached=false;
 try{const info=JSON.parse(fs.readFileSync(path.join(site,'build-info.json'),'utf8'));if(validLight(fs.readFileSync(lightPath),info))cached=true;}catch(_){}
 if(!cached)try{
  const response=await fetch('https://kiyomizu-quality-v5.onrender.com/build-info.json',{signal:AbortSignal.timeout(15000)});
  if(response.ok){const info=await response.json();if(validInfo(info)){
   const r=await fetch('https://kiyomizu-quality-v5.onrender.com/lighting.bin?v='+info.revision,{signal:AbortSignal.timeout(60000)});
   if(r.ok){const data=Buffer.from(await r.arrayBuffer());if(validLight(data,info)){fs.writeFileSync(lightPath,data);cached=true;}}
  }}
 }catch(_){console.log('Validated light cache unavailable; computing from actual geometry.');}
 if(cached)console.log('LIGHT_CACHE_VALIDATED');
 else{cp.execFileSync('g++',['-O3','-std=c++17','-fopenmp',source,'-o',exe],{stdio:'inherit'});cp.execFileSync(exe,[scenePath,lightPath,rays],{stdio:'inherit',timeout:55*60*1000});}
 const light=fs.readFileSync(lightPath);
 if(light.toString('ascii',0,4)!=='KVL1'||light.length!==lightSize||light.readUInt32LE(4)!==lightCount)throw Error('Light bake is incomplete or mismatched');
 fs.writeFileSync(path.join(site,'build-info.json'),JSON.stringify({revision:scene.revision,viewerRevision:'quality-v5.4',viewerHashes,modelHash:hash,bakerHash,meshes:scene.meshes.length,instances,triangles:scene.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0),lightSamples:lightCount,rays:Number(rays),lightingBytes:light.length,lightingHash:sha(light),architecture:scene.stats,surveyed:false,description:'Native WebGL2 miniature. Actual geometry with matching four-bounce light bake, indexed vertices and native MSAA. Soft presentation fill; no reference-image planes. Architectural dimensions remain illustrative.'},null,2));
 console.log('BUILD_VALIDATED',JSON.stringify({meshes:scene.meshes.length,instances,lighting:light.length,viewerRevision:'quality-v5.4'}));
}
buildLighting().catch(e=>{console.error(e);process.exitCode=1;});
