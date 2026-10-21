'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=__dirname,site=path.join(root,'site'),out=path.join(root,'.build'),qroot=path.resolve(root,'../quality-v5');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.join(site,'src'),{recursive:true});fs.mkdirSync(out,{recursive:true});
const BASE='https://kiyomizu-quality-v5.onrender.com';
const EXPECTED={
 'src/renderer.js':'1b8bc0bda2ac6f9a8e8ac91e6da474510d404c5eed41447c6c40384fc12e0b5a',
 'src/app.js':'50ff32207f6d1836ef371a02e2d863bdfdf84ed16a284abe28a34d41a0d8b9ae',
 'index.html':'bc1b133ebe65c201897030d8025778fc09847b166cc88c15087c4653ff8adcc3',
 'src/scene.js':'c4573b9fc80a0473e57d78096abf51692cc9864211e4e3b98429b406022a5e77'
};
async function fetchFixed(file){
 const r=await fetch(BASE+'/'+file+'?area-v4-base=1',{signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw Error('Base asset '+file+' HTTP '+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 if(sha(b)!==EXPECTED[file])throw Error('Base asset changed: '+file+' '+sha(b));
 return b;
}
function exact(source,a,b,label){if(source.split(a).length!==2)throw Error('Unexpected '+label);return source.replace(a,b);}
(async()=>{
 const [rendererB,appB,indexB,sceneB]=await Promise.all(['src/renderer.js','src/app.js','index.html','src/scene.js'].map(fetchFixed));
 let renderer=rendererB.toString('utf8'),app=appB.toString('utf8'),html=indexB.toString('utf8'),scene=sceneB.toString('utf8');
 const fragment=fs.readFileSync(path.join(root,'area-fragment.jsfrag'),'utf8');
 scene=exact(scene,"\n group='distant-context';","\n"+fragment+"\n group='distant-context';",'area insertion point');
 scene=exact(scene,"scene.revision='quality-v5.4';","scene.revision='area-higashiyama-quality-v5';",'area revision');
 scene=scene.replace("scene.areaQuality='v3-detailed-landmarks-and-streetscape';","scene.areaQuality='v5-detailed-landmarks-machiya-and-street-life';");
 scene=exact(scene,
  "scene.named={temple:{target:[-1,7.2,-.4],span:29,yaw:.64,pitch:.43},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  "scene.named={area:{target:[-16,5.5,24],span:64,yaw:.66,pitch:.50},temple:{target:[-1,7.2,-.4],span:29,yaw:.64,pitch:.43},hokanji:{target:[-26.2,5.0,16.6],span:13.5,yaw:.58,pitch:.39},kodaiji:{target:[-17.7,4.8,28.8],span:15.5,yaw:.57,pitch:.42},yasaka:{target:[-29.1,4.6,44.6],span:16.5,yaw:.57,pitch:.42},street:{target:[-19.4,3.9,21.0],span:14.5,yaw:.74,pitch:.38},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  'area camera metadata');
 app=exact(app,
  "const presets={temple:{target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  "const presets={area:{target:[-16,5.5,24],span:64,yaw:.66,pitch:.50},temple:{target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37},hokanji:{target:[-26.2,5.0,16.6],span:13.5,yaw:.58,pitch:.39},kodaiji:{target:[-17.7,4.8,28.8],span:15.5,yaw:.57,pitch:.42},yasaka:{target:[-29.1,4.6,44.6],span:16.5,yaw:.57,pitch:.42},street:{target:[-19.4,3.9,21.0],span:14.5,yaw:.74,pitch:.38},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  'area camera presets');
 app=exact(app,"let model,renderer,camera,selected='temple'","let model,renderer,camera,selected='area'",'initial selected view');
 app=exact(app,"camera=authored('temple');ready=true;","camera=authored(params.get('view')||'area');ready=true;",'initial area camera');
 app=app.replaceAll("lighting.bin?v=quality-v5.4","lighting.bin?v=area-higashiyama-quality-v5");
 app=app.replaceAll("quality-v5.4","area-higashiyama-quality-v5");
 app=app.replace("camera.target[0]=clamp(camera.target[0],-7,10);camera.target[1]=clamp(camera.target[1],3.5,11);camera.target[2]=clamp(camera.target[2],-7,7);",
                 "camera.target[0]=clamp(camera.target[0],-46,18);camera.target[1]=clamp(camera.target[1],2,17);camera.target[2]=clamp(camera.target[2],-14,54);");
 app=app.replaceAll("Math.max(45,30/(canvas.clientWidth/canvas.clientHeight))","Math.max(150,80/(canvas.clientWidth/canvas.clientHeight))");
 html=html.replaceAll("清水寺本堂と庭の3Dモデル","東山・祇園エリアの3Dミニチュア");
 html=html.replaceAll("建築・景観 v5 · 春の造形見本","東山・祇園 · エリア品質 v4");
 html=html.replace('data-view="temple" aria-pressed="true">本堂全景</button><button data-view="corner" aria-pressed="false">近くで見る</button><button data-view="reverse" aria-pressed="false">別の角度</button>',
                   'data-view="area" aria-pressed="true">エリア全体</button><button data-view="temple" aria-pressed="false">清水寺</button><button data-view="hokanji" aria-pressed="false">八坂の塔</button>');
 html=html.replaceAll("quality-v5.4","area-higashiyama-quality-v5");
 fs.writeFileSync(path.join(site,'src/renderer.js'),renderer);fs.writeFileSync(path.join(site,'src/app.js'),app);fs.writeFileSync(path.join(site,'src/scene.js'),scene);fs.writeFileSync(path.join(site,'index.html'),html);fs.writeFileSync(path.join(site,'robots.txt'),'User-agent: *\nDisallow: /\n');
 for(const file of ['renderer.js','scene.js','app.js'])cp.execFileSync(process.execPath,['--check',path.join(site,'src',file)],{stdio:'inherit'});
 const context=vm.createContext({console,performance});for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(site,'src',file),'utf8'),context,{filename:file});
 const model=vm.runInContext('makeStudy()',context,{timeout:90000});
 if(model.revision!=='area-higashiyama-quality-v5'||model.areaQuality!=='v5-detailed-landmarks-machiya-and-street-life')throw Error('Wrong area revision');
 if(!model.areaSites||!model.areaSites.geographicAnchors)throw Error('Area anchors missing');
 let size=12,instances=0;
 for(const m of model.meshes){
  if(m.p.length%9||m.n.length!==m.p.length||m.u.length!==m.p.length/3*2)throw Error('Invalid mesh '+m.name);
  for(const a of[m.p,m.n,m.u])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid vertex '+m.name);
  for(const i of m.instances){for(const a of[i.p,i.s,i.q,i.c])for(const v of a)if(!Number.isFinite(v))throw Error('Invalid instance '+m.name);if(i.s.some(v=>v<=0))throw Error('Non-positive dimension');}
  size+=8+Buffer.byteLength(m.name)+m.p.length/9*96;instances+=m.instances.length;
 }
 size+=instances*60;const packed=Buffer.alloc(size);let at=0;
 const u=v=>{packed.writeUInt32LE(v,at);at+=4;},f=v=>{packed.writeFloatLE(v===0?0:v,at);at+=4;};
 packed.write('KYT4',at);at+=4;u(model.meshes.length);u(instances);
 for(const m of model.meshes){const n=Buffer.from(m.name);u(n.length);n.copy(packed,at);at+=n.length;u(m.p.length/9);for(let t=0;t<m.p.length/9;t++){for(let k=0;k<9;k++)f(m.p[t*9+k]);for(let k=0;k<9;k++)f(m.n[t*9+k]);for(let k=0;k<6;k++)f(m.u[t*6+k]);}}
 model.meshes.forEach((m,gi)=>{for(const i of m.instances){u(gi);u(i.mat);for(const v of[...i.p,...i.s,...i.q,...i.c])f(v);}});
 if(at!==size)throw Error('Packed model length mismatch');
 const modelHash=sha(packed),scenePath=path.join(out,'scene.bin');fs.writeFileSync(scenePath,packed);
 if(process.argv.includes('--validate-only')){console.log('AREA_MODEL_VALIDATED',JSON.stringify({modelHash,meshes:model.meshes.length,instances,revision:model.revision,areaQuality:model.areaQuality}));return;}
 const source=path.join(qroot,'bake_vertex.cpp'),exe=path.join(out,'bake_vertex'),rays=process.env.LIGHT_SAMPLES||'24';
 if(!/^(12|24|48|96|128)$/.test(rays))throw Error('Unsupported LIGHT_SAMPLES');
 cp.execFileSync('g++',['-O3','-std=c++17','-fopenmp',source,'-o',exe],{stdio:'inherit'});
 const lightPath=path.join(site,'lighting.bin');cp.execFileSync(exe,[scenePath,lightPath,rays],{stdio:'inherit',timeout:70*60*1000});
 const light=fs.readFileSync(lightPath);if(light.toString('ascii',0,4)!=='KVL1')throw Error('Invalid light header');
 const lightSamples=light.readUInt32LE(4);if(light.length!==8+lightSamples*4)throw Error('Incomplete light bake');
 const viewerHashes={};for(const file of['src/renderer.js','src/scene.js','src/app.js','index.html'])viewerHashes[file]=sha(fs.readFileSync(path.join(site,file)));
 const triangles=model.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0);
 const info={revision:model.revision,viewerRevision:'area-higashiyama-quality-v5',viewerHashes,modelHash,bakerHash:sha(fs.readFileSync(source)),meshes:model.meshes.length,instances,triangles,lightSamples,rays:Number(rays),lightingBytes:light.length,lightingHash:sha(light),architecture:model.stats,areaSites:model.areaSites,surveyed:false,description:'Higashiyama quality-v5 miniature with Kiyomizu v5.4 presentation pipeline, denser landmark architecture, detailed machiya streets, and a geometry-matched baked light field. Geographic anchors are real; intermediate street/building geometry remains authored.'};
 fs.writeFileSync(path.join(site,'build-info.json'),JSON.stringify(info,null,2));
 console.log('AREA_BUILD_VALIDATED',JSON.stringify({modelHash,meshes:model.meshes.length,instances,triangles,lightSamples,lightingBytes:light.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
