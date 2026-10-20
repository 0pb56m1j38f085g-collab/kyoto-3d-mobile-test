'use strict';
// Reproducible local build only: no network, credentials, Git writes, or changes to the live app.
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
 // Final art review: subtle fill without flattening contact shadows, and a clearer view label.
 if(patch.path==='src/renderer.js')result=result.replace('bakedEnabled?indirectLight:', 'bakedEnabled?(indirectLight*1.12+sky*.045):');
 if(patch.path==='index.html')result=result.replace('>本堂と庭</button>', '>本堂全景</button>');
 const expected={'src/renderer.js':'346f7f8688507e7a000cfcf965e6f6e436a8920641841c807b6060ced84d8bff','src/app.js':'479947687c3d62a387126f787131e245e92686fdeab9f57359983fb331fc2a5c','index.html':'c131f63343b94ddb66f5672dfab115b481dd8435b3ac71a347e228ca02ad26ff'};
 if(sha(result)!==expected[patch.path])throw Error('Final asset checksum mismatch: '+patch.path);
 fs.writeFileSync(path.join(site,patch.path),result);
}
fs.copyFileSync(path.join(root,'scene.js'),path.join(site,'src/scene.js'));
fs.writeFileSync(path.join(site,'robots.txt'),'User-agent: *\nDisallow: /\n');
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
const hash=sha(b);if(hash!=='04b808ccfbd16ca400ed8897c8dfdc675051406e32075e9cbdb6fa567afa421a')throw Error('Model differs from the validated geometry: '+hash);
const scenePath=path.join(out,'scene.bin');fs.writeFileSync(scenePath,b);console.log('MODEL_SHA256',hash);
if(process.argv.includes('--validate-only')){console.log('MODEL_VALIDATED',JSON.stringify(scene.stats));process.exit(0);}
const source=path.join(root,'bake_vertex.cpp'),exe=path.join(out,'bake_vertex');
cp.execFileSync('g++',['-O3','-std=c++17','-fopenmp',source,'-o',exe],{stdio:'inherit'});
const rays=process.env.LIGHT_SAMPLES||'96';if(!/^(24|48|96|128)$/.test(rays))throw Error('Unsupported light sample count');
cp.execFileSync(exe,[scenePath,path.join(site,'lighting.bin'),rays],{stdio:'inherit',timeout:55*60*1000});
const light=fs.readFileSync(path.join(site,'lighting.bin'));
if(light.toString('ascii',0,4)!=='KVL1'||light.length!==8+light.readUInt32LE(4)*4||light.readUInt32LE(4)!==2470976)throw Error('Light bake is incomplete or mismatched');
fs.writeFileSync(path.join(site,'build-info.json'),JSON.stringify({revision:scene.revision,modelHash:hash,meshes:scene.meshes.length,instances,triangles:scene.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0),lightSamples:light.readUInt32LE(4),rays:Number(rays),lightingBytes:light.length,architecture:scene.stats,surveyed:false,description:'Native WebGL2 miniature. Static indirect and area-sun lighting baked onto actual vertices. No reference-image planes.'},null,2));
console.log('BUILD_VALIDATED',JSON.stringify({meshes:scene.meshes.length,instances,lighting:light.length}));
