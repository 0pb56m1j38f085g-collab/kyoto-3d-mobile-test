'use strict';
// Read-only experiment builder: fetch only our verified preview; no writes to GitHub/Render.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const dir=path.resolve('canopy-study-artifacts'),base=path.join(dir,'baseline'),site=path.join(dir,'candidate');
const expected={
 'src/scene.js':'638cbe336981a49addd8d189067bcbc0cd8287562937b205602aa85daad28d6d',
 'src/renderer.js':'e0ffab67f40a8ec2c7874441c8cda0c45f3d9ded689ec436656d50e74e0aeb73',
 'src/app.js':'cfbb959b08e00734aa4ed5f0a1eaec9ddab0ea1c7b5313c4228fd9244a61d30b',
 'index.html':'825dee7418676a99d38666bb7e63c9d168c8249503cc13ea1907b8fe361b38a0',
 'lighting.bin':'5137cb232440cba6ec46d21183c9d6b839dc37c662e88a3d8ddf727c099339c5'};
function model(folder){const c=vm.createContext({console,performance});for(const n of ['renderer','scene'])vm.runInContext(fs.readFileSync(path.join(folder,'src/'+n+'.js'),'utf8'),c,{filename:n});return vm.runInContext('makeStudy()',c,{timeout:60000});}
function stats(s){return{meshes:s.meshes.length,instances:s.meshes.reduce((n,m)=>n+m.instances.length,0),triangles:s.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0),...s.stats};}
function protectedPart(s){return JSON.stringify(s.meshes.map(m=>({name:m.name,p:m.p,n:m.n,u:m.u,instances:m.instances.filter(i=>['main-hall','visitors','distant-context'].includes(i.group))})).filter(m=>m.instances.length));}
async function main(){
 fs.mkdirSync(path.join(base,'src'),{recursive:true});
 for(const [file,hash]of Object.entries(expected)){
  const response=await fetch('https://kiyomizu-quality-v5.onrender.com/'+file,{signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error(file+' HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer());
  if(sha(bytes)!==hash)throw Error('Published baseline changed: '+file);fs.writeFileSync(path.join(base,file),bytes);
 }
 fs.cpSync(base,site,{recursive:true});
 const original=fs.readFileSync(path.join(base,'src/scene.js'),'utf8');
 fs.writeFileSync(path.join(site,'src/scene.js'),require('./canopy-v54.cjs')(original));
 require('./warm-veranda-fill.cjs')(site);
 for(const file of ['scene','renderer','app'])cp.execFileSync(process.execPath,['--check',path.join(site,'src/'+file+'.js')],{stdio:'inherit'});
 const before=model(base),scene=model(site);
 if(protectedPart(before)!==protectedPart(scene))throw Error('Protected building geometry or site context changed');
 let size=12,instances=0,lightSamples=0;
 for(const m of scene.meshes){
  if(m.p.length%9||m.n.length!==m.p.length||m.u.length*3!==m.p.length*2)throw Error('Bad mesh '+m.name);
  for(const a of[m.p,m.n,m.u])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid vertex');
  const unique=new Set();for(let j=0;j<m.p.length/3;j++)unique.add([...m.p.slice(j*3,j*3+3),...m.n.slice(j*3,j*3+3)].map(Math.fround).join(','));
  lightSamples+=unique.size*m.instances.length;
  for(const i of m.instances){for(const a of[i.p,i.s,i.q,i.c])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid instance');if(i.s.some(x=>x<=0))throw Error('Bad scale');}
  size+=8+Buffer.byteLength(m.name)+m.p.length/9*96;instances+=m.instances.length;
 }
 size+=instances*60;const b=Buffer.alloc(size);let at=0;const u=v=>{b.writeUInt32LE(v,at);at+=4;},f=v=>{b.writeFloatLE(v===0?0:v,at);at+=4;};b.write('KYT4',at);at+=4;u(scene.meshes.length);u(instances);
 for(const m of scene.meshes){const n=Buffer.from(m.name);u(n.length);n.copy(b,at);at+=n.length;u(m.p.length/9);for(let j=0;j<m.p.length/9;j++){for(let k=0;k<9;k++)f(m.p[j*9+k]);for(let k=0;k<9;k++)f(m.n[j*9+k]);for(let k=0;k<6;k++)f(m.u[j*6+k]);}}
 scene.meshes.forEach((m,gi)=>{for(const i of m.instances){u(gi);u(i.mat);for(const v of[...i.p,...i.s,...i.q,...i.c])f(v);}});
 if(at!==size)throw Error('Packed length mismatch');
 const modelFile=path.join(dir,'scene.bin'),lightFile=path.join(site,'lighting.bin'),exe=path.join(dir,'bake_vertex'),rays=Number(process.env.LIGHT_SAMPLES||24);
 if(![24,48,96,128].includes(rays))throw Error('Unsupported sample count');
 fs.writeFileSync(modelFile,b);fs.rmSync(lightFile); // never reuse the old light on altered crowns
 const report={study:'canopy-v5.4',published:false,protectedGeometryUnchanged:true,before:stats(before),after:stats(scene),modelHash:sha(b),sceneHash:sha(fs.readFileSync(path.join(site,'src/scene.js'))),lightSamples,rays};
 fs.writeFileSync(path.join(dir,'model-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 cp.execFileSync('g++',['-O3','-std=c++17','-fopenmp','quality-v5/bake_vertex.cpp','-o',exe],{stdio:'inherit'});
 cp.execFileSync(exe,[modelFile,lightFile,String(rays)],{stdio:'inherit',timeout:35*60*1000,env:{...process.env,OMP_NUM_THREADS:'4'}});
 const light=fs.readFileSync(lightFile);if(light.toString('ascii',0,4)!=='KVL1'||light.readUInt32LE(4)!==lightSamples||light.length!==8+lightSamples*4)throw Error('Mismatched light');
 report.lightingHash=sha(light);report.lightingBytes=light.length;
 fs.writeFileSync(path.join(site,'build-info.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(dir,'model-check.json'),JSON.stringify(report,null,2));
 fs.rmSync(modelFile);fs.rmSync(exe);console.log('STUDY_BUILT');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
