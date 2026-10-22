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
 // The old decorative terrain wave is three metres high at geographic scale.
 // Reduce it in the mapped urban block; this is still synthetic, not DEM data.
 scene=exact(scene,'.15*Math.sin(x*.48)*Math.cos(z*.35)',
  '(.15-.14*smooth((x+45)/1)*smooth((-8-x)/1)*smooth((z-14)/1)*smooth((53-z)/1))*Math.sin(x*.48)*Math.cos(z*.35)','urban ground amplitude');
 scene=exact(scene,' const clusters=',` const inheritedTree=tree,inheritedPine=pine;
 const anchoredPlant=(fn,x,z,args)=>{const previous=scene.__anchor;scene.__anchor=[x,ground(x,z),z];try{return fn(x,z,...args);}finally{scene.__anchor=previous;}};
 tree=(x,z,...args)=>anchoredPlant(inheritedTree,x,z,args);pine=(x,z,...args)=>anchoredPlant(inheritedPine,x,z,args);
 const clusters=`,'plant anchors for whole-tree collision removal');
 // Cross-engine deterministic storage. V8 and WebKit may differ by a few ULPs in
 // procedural trig results; quantize only stored render geometry/transforms so the
 // baked-light index ordering/count is identical across engines.
 renderer=exact(renderer,
  "class MeshData{constructor(name){this.name=name;this.p=[];this.n=[];this.u=[];this.instances=[];}",
  "const GEOQ=v=>Math.round(v*100000)/100000,QGA=a=>a.map(GEOQ);class MeshData{constructor(name){this.name=name;this.p=[];this.n=[];this.u=[];this.instances=[];}",
  'deterministic geometry quantizer');
 renderer=exact(renderer,
  "this.p.push(...a,...b,...c);this.n.push(...n,...(nb||n),...(nc||n));this.u.push(...ua,...ub,...uc);",
  "this.p.push(...QGA(a),...QGA(b),...QGA(c));this.n.push(...QGA(n),...QGA(nb||n),...QGA(nc||n));this.u.push(...QGA(ua),...QGA(ub),...QGA(uc));",
  'deterministic stored triangle values');
 renderer=exact(renderer,
  "mesh.instances.push({anchor:this.__anchor?this.__anchor.slice():null,p,s,c:typeof c==='string'?rgb(c):c,q,mat});",
  "mesh.instances.push({anchor:this.__anchor?QGA(this.__anchor):null,p:QGA(p),s:QGA(s),c:typeof c==='string'?rgb(c):QGA(c),q:QGA(q),mat});",
  'deterministic instance values');
 const streetData=JSON.parse(fs.readFileSync(path.join(root,'../area-data/historic-streets.json'),'utf8'));
 const footprintData=require('./footprints.cjs').compile(JSON.parse(fs.readFileSync(path.join(root,'../area-data/gion-footprints.json'),'utf8')));
 const footprintFragment=fs.readFileSync(path.join(root,'footprint-fragment.jsfrag'),'utf8').replace('__FOOTPRINT_DATA__',JSON.stringify(footprintData));
 const metricFragment=fs.readFileSync(path.join(root,'metric-landmarks.jsfrag'),'utf8').replace('// __KODAIJI_MODELS__',fs.readFileSync(path.join(root,'kodaiji-fragment.jsfrag'),'utf8'));
 const kiyomizuFragment=fs.readFileSync(path.join(root,'kiyomizu-placement.jsfrag'),'utf8').replace('__KIYOMIZU_SOURCE__',fs.readFileSync(path.join(root,'../area-data/kiyomizu-placement.json'),'utf8'));
 const fragment=kiyomizuFragment+'\n'+fs.readFileSync(path.join(root,'area-fragment.jsfrag'),'utf8').replace('__HISTORIC_STREETS__',JSON.stringify(streetData.roads))+'\n'+footprintFragment+'\n'+metricFragment;
 scene=exact(scene,"\n group='distant-context';","\n"+fragment+"\n group='distant-context';",'area insertion point');
 // Retire all pre-GIS context as whole groups, including objects outside the
 // mapped block. Position-only removal left fragments of oversized houses/trees.
 scene=exact(scene,' scene.stats={',` const retiredGroups=new Set(['higashiyama-area','landscape','distant-context','legacy-hokanji','legacy-yasaka','legacy-kodaiji']);
 let retiredInstances=0;
 for(const m of scene.meshes)m.instances=m.instances.filter(i=>{if(!retiredGroups.has(i.group))return true;retiredInstances++;return false;});
 scene.areaBuildings=[];scene.areaStreets=[];
 scene.areaSites.contextPolicy={retiredInstances,oversizedAuthoredContextRemoved:true,unmappedLand:'unfilled; no invented houses, roads or woodland'};
 scene.areaSites.frontageReference={method:'outward-facing road visibility with adjacent-building exclusion',count:scene.footprintBuildings.filter(b=>b.frontage).length,joinery:'illustrative; not an individual facade survey'};
 scene.stats={`,'retire oversized context');
 scene=exact(scene,"scene.revision='quality-v5.4';","scene.revision='area-higashiyama-quality-v4.15';",'area revision');
 scene=scene.replace("scene.areaQuality='v3-detailed-landmarks-and-streetscape';","scene.areaQuality='v4-cleared-urban-corridor-and-baked-lighting';");
 scene=exact(scene,
  "scene.named={temple:{target:[-1,7.2,-.4],span:29,yaw:.64,pitch:.43},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  "scene.named={area:{target:[-5,5.7,18],span:42,yaw:.58,pitch:.48},temple:{target:[-1,7.2,-.4],span:29,yaw:.64,pitch:.43},hokanji:{target:[-26.2,5.2,16.6],span:12.5,yaw:.58,pitch:.39},kodaiji:{target:[-17.7,4.9,28.8],span:11.8,yaw:1.15,pitch:.38},yasaka:{target:[-29.1,4.7,44.6],span:12.8,yaw:1.85,pitch:.38},street:{target:[-20.3,4.0,22.0],span:12.8,yaw:.78,pitch:.37},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  'area camera metadata');
 app=exact(app,
  "const presets={temple:{target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  "const presets={area:{target:[-5,5.7,18],span:42,yaw:.58,pitch:.48},temple:{target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37},hokanji:{target:[-26.2,5.2,16.6],span:12.5,yaw:.58,pitch:.39},kodaiji:{target:[-17.7,4.9,28.8],span:11.8,yaw:1.15,pitch:.38},yasaka:{target:[-29.1,4.7,44.6],span:12.8,yaw:1.85,pitch:.38},street:{target:[-20.3,4.0,22.0],span:12.8,yaw:.78,pitch:.37},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};",
  'area camera presets');
 app=exact(app,"let model,renderer,camera,selected='temple'","let model,renderer,camera,selected='area'",'initial selected view');
 app=exact(app,"camera=authored('temple');ready=true;","camera=authored(params.get('view')||'area');ready=true;",'initial area camera');
 // Real iPhone/iPad memory guard. iOS WebKit has a substantially lower tab/GPU memory ceiling
 // than desktop WebKit, so it starts without the 35MB baked-light asset and with lighter buffers.
 app=exact(app,
  "const params=new URLSearchParams(location.search);if(params.has('capture'))document.body.classList.add('capture');",
  "const params=new URLSearchParams(location.search);const lowMemoryIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);window.__lowMemoryIOS=lowMemoryIOS;if(params.has('capture'))document.body.classList.add('capture');",
  'iOS low-memory detection');
 app=exact(app,
  "const modes={standard:{dpr:Math.min(devicePixelRatio||1,1.25),ao:.26,focus:2.0},high:{dpr:Math.min(devicePixelRatio||1,1.8),ao:.34,focus:2.8},light:{dpr:Math.min(devicePixelRatio||1,.85),ao:.12,focus:0}};",
  "const modes={standard:{dpr:Math.min(devicePixelRatio||1,1.25),ao:.26,focus:2.0},high:{dpr:Math.min(devicePixelRatio||1,1.8),ao:.34,focus:2.8},light:{dpr:Math.min(devicePixelRatio||1,lowMemoryIOS?.62:.85),ao:lowMemoryIOS?0:.12,focus:0}};",
  'iOS light render mode');
 app=exact(app,
  "let model,renderer,camera,selected='area',quality='standard',ready=false,contextLost=false,anim=null,raf=0,lastDraw=0,pointers=new Map(),previousGesture=null,modal=null,returnFocus=null,tickTimes=[],renderTimes=[],toastTimer,resizeTimer,paused=false;",
  "let model,renderer,camera,selected='area',quality=lowMemoryIOS?'light':'standard',ready=false,contextLost=false,anim=null,raf=0,lastDraw=0,pointers=new Map(),previousGesture=null,modal=null,returnFocus=null,tickTimes=[],renderTimes=[],toastTimer,resizeTimer,paused=false;",
  'iOS default quality');
 app=exact(app,
  "let bakedLighting=null;try{if(window.__BAKED_LIGHT_BASE64)",
  "let bakedLighting=null;if(lowMemoryIOS){lightingState='iPhone用軽量照明';delete window.__BAKED_LIGHT_BASE64;}else try{if(window.__BAKED_LIGHT_BASE64)",
  'skip baked light on iOS');
 app=exact(app,
  "renderer=new Renderer(canvas,model,{dpr:modes.standard.dpr,shadowSize:3072,bakedLighting});renderer.ao=modes.standard.ao;renderer.focusEffect=modes.standard.focus;",
  "renderer=new Renderer(canvas,model,{dpr:modes[quality].dpr,shadowSize:lowMemoryIOS?1024:3072,bakedLighting});renderer.ao=modes[quality].ao;renderer.focusEffect=modes[quality].focus;",
  'iOS initial renderer memory');
 app=exact(app,
  "renderer=new Renderer(canvas,model,{dpr:modes[quality].dpr,shadowSize:3072,bakedLighting:bakedAsset});",
  "renderer=new Renderer(canvas,model,{dpr:modes[quality].dpr,shadowSize:lowMemoryIOS?1024:3072,bakedLighting:bakedAsset});",
  'iOS context restore memory');
 app=exact(app,
  "if(params.has('quality'))setQuality(params.get('quality'));",
  "if(params.has('quality')&&!lowMemoryIOS)setQuality(params.get('quality'));",
  'iOS prevent heavy startup override');
 const portraitOld="if(aspect<1.05){p.span*=.78/aspect;p.target[1]+=.2;}";
 if(!app.includes(portraitOld))throw Error('Unexpected portrait camera scaling input');
 app=app.replace(portraitOld,"if(aspect<1.05){const areaLandmark=['hokanji','kodaiji','yasaka','street'].includes(name);const portraitScale=name==='area'?.42:(areaLandmark?.58:.78);p.span*=portraitScale/aspect;p.target[1]+=name==='area'?-.12:.2;}");
 app=app.replaceAll("lighting.bin?v=quality-v5.4","lighting.bin?v=area-higashiyama-quality-v4.15");
 app=app.replaceAll("quality-v5.4","area-higashiyama-quality-v4.15");
 app=exact(app,
  "fetch('./lighting.bin?v=area-higashiyama-quality-v4.15',{signal:controller.signal})",
  "fetch('./lighting.bin?v=area-higashiyama-quality-v4.15',{signal:controller.signal,cache:'no-store'})",
  'cache-safe lighting fetch');
 app=app.replace("camera.target[0]=clamp(camera.target[0],-7,10);camera.target[1]=clamp(camera.target[1],3.5,11);camera.target[2]=clamp(camera.target[2],-7,7);",
                 "camera.target[0]=clamp(camera.target[0],-46,18);camera.target[1]=clamp(camera.target[1],2,17);camera.target[2]=clamp(camera.target[2],-14,54);");
 app=app.replaceAll("Math.max(45,30/(canvas.clientWidth/canvas.clientHeight))","Math.max(150,80/(canvas.clientWidth/canvas.clientHeight))");
 html=html.replaceAll("清水寺本堂と庭の3Dモデル","東山・祇園エリアの3Dミニチュア");
 html=html.replaceAll("建築・景観 v5 · 春の造形見本","東山・祇園 · エリア品質 v4");
 html=html.replace('data-view="temple" aria-pressed="true">本堂全景</button><button data-view="corner" aria-pressed="false">近くで見る</button><button data-view="reverse" aria-pressed="false">別の角度</button>',
                   'data-view="area" aria-pressed="true">エリア全体</button><button data-view="temple" aria-pressed="false">清水寺</button><button data-view="hokanji" aria-pressed="false">八坂の塔</button>');
 html=html.replaceAll("quality-v5.4","area-higashiyama-quality-v4.15");
 // Area presentation finish: preserve baked contact lighting while moving the district
 // slightly closer to the approved soft pastel concept. Exact replacements refuse
 // to run if the reviewed Kiyomizu renderer changes.
 renderer=exact(renderer,'indirectLight*1.18+sky*.115','indirectLight*1.20+sky*.125','area indirect/sky balance');
 renderer=exact(renderer,'lit+=base*vec3(.38,.31,.24)*fill;','lit+=base*vec3(.40,.34,.28)*fill;','area warm frontal fill');
 renderer=exact(renderer,'vec3(1.0,.92,.83)*2.05*nd*sh','vec3(1.0,.94,.88)*1.96*nd*sh','area sun warmth');
 renderer=exact(renderer,'aces(lit*.76)','aces(lit*.785)','area exposure');
 // WebKit/Safari can produce a slightly different procedural light-index count from
 // V8 because transcendental floating-point results may round differently. The 3D
 // geometry is still valid. Never fail the whole viewer for that optional baked-light
 // mismatch: keep the dynamic soft-light path and expose a diagnostic instead.
 renderer=exact(renderer,
  "if(count!==this.lightSampleCount||buffer.byteLength!==8+count*4)throw Error('3Dモデルと照明データの版が一致しません。');",
  "if(count!==this.lightSampleCount||buffer.byteLength!==8+count*4){this.bakedMismatch={expected:this.lightSampleCount,received:count,bytes:buffer.byteLength};console.warn('Baked lighting disabled for this JS engine:',this.bakedMismatch);this.bakedEnabled=false;return false;}",
  'WebKit baked-light graceful fallback');

 ({renderer,app,html}=require('./refine-viewer.cjs')({renderer,app,html}));
 renderer+='\n'+fs.readFileSync(path.join(root,'mobile-runtime.jsfrag'),'utf8');
 fs.writeFileSync(path.join(site,'src/renderer.js'),renderer);fs.writeFileSync(path.join(site,'src/app.js'),app);fs.writeFileSync(path.join(site,'src/scene.js'),scene);fs.writeFileSync(path.join(site,'index.html'),html);fs.writeFileSync(path.join(site,'robots.txt'),'User-agent: *\nDisallow: /\n');
 for(const file of ['renderer.js','scene.js','app.js'])cp.execFileSync(process.execPath,['--check',path.join(site,'src',file)],{stdio:'inherit'});
 const context=vm.createContext({console,performance});for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(site,'src',file),'utf8'),context,{filename:file});
 const model=vm.runInContext('makeStudy()',context,{timeout:240000});
 if(model.revision!=='area-higashiyama-quality-v4.15'||model.areaQuality!=='v4.15-streetscape-coherence-and-focus')throw Error('Wrong area revision');
 if(!model.areaSites||!model.areaSites.geographicAnchors)throw Error('Area anchors missing');
 const architectureAudit=require('./architecture-audit.cjs').audit(model,require('../quality-v5/references/architecture-evidence.json'));
 fs.writeFileSync(path.join(out,'architecture-audit.json'),JSON.stringify(architectureAudit,null,2));
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
 // Fail closed if a later material starts using UVs; the mobile pack omits them.
 if((vm.runInContext('fragmentShader',context).match(/\buv\b/g)||[]).length!==1)throw Error('Mobile pack requires UV-free world-space materials');
 const mobileAsset=require('./mobile-pack.cjs')(model,site,modelHash);
 app=exact(app,'__MOBILE_ASSET__',JSON.stringify(mobileAsset),'mobile asset descriptor');
 fs.writeFileSync(path.join(site,'src/app.js'),app);
 fs.writeFileSync(path.join(out,'mobile-pack.json'),JSON.stringify(mobileAsset,null,2));
 if(process.argv.includes('--validate-only')){console.log('AREA_MODEL_VALIDATED',JSON.stringify({modelHash,meshes:model.meshes.length,instances,revision:model.revision,areaQuality:model.areaQuality}));return;}
 const source=path.join(qroot,'bake_vertex.cpp'),exe=path.join(out,'bake_vertex'),rays=process.env.LIGHT_SAMPLES||'24';
 if(!/^(12|24|48|96|128)$/.test(rays))throw Error('Unsupported LIGHT_SAMPLES');
 const lightPath=path.join(site,'lighting.bin'),bakerHash=sha(fs.readFileSync(source));
 let reused=false;
 // Strictly reuse the currently published lighting only when it belongs to the exact same
 // geometry, baker and ray count. This avoids an unnecessary 15-minute rebake for viewer-only fixes.
 try{
  const infoRes=await fetch('https://higashiyama-quality-v4.onrender.com/build-info.json?cache-safe-probe=1',{signal:AbortSignal.timeout(20000),cache:'no-store'});
  if(infoRes.ok){
   const info=await infoRes.json();
   if(info.modelHash===modelHash&&info.bakerHash===bakerHash&&info.rays===Number(rays)&&Number.isInteger(info.lightSamples)&&/^[a-f0-9]{64}$/.test(info.lightingHash)){
    const lightRes=await fetch('https://higashiyama-quality-v4.onrender.com/lighting.bin?cache-safe='+info.lightingHash,{signal:AbortSignal.timeout(120000),cache:'no-store'});
    if(lightRes.ok){
     const data=Buffer.from(await lightRes.arrayBuffer());
     if(data.length===8+info.lightSamples*4&&data.toString('ascii',0,4)==='KVL1'&&data.readUInt32LE(4)===info.lightSamples&&sha(data)===info.lightingHash){
      fs.writeFileSync(lightPath,data);reused=true;console.log('AREA_LIGHT_CACHE_VALIDATED',info.lightingHash);
     }
    }
   }
  }
 }catch(e){console.log('Area light cache unavailable:',e.message);}
 if(!reused){cp.execFileSync('g++',['-O3','-std=c++17','-fopenmp',source,'-o',exe],{stdio:'inherit'});cp.execFileSync(exe,[scenePath,lightPath,rays],{stdio:'inherit',timeout:70*60*1000});}
 const light=fs.readFileSync(lightPath);if(light.toString('ascii',0,4)!=='KVL1')throw Error('Invalid light header');
 const lightSamples=light.readUInt32LE(4);if(light.length!==8+lightSamples*4)throw Error('Incomplete light bake');
 const lightingHash=sha(light),assetToken=modelHash.slice(0,12)+'-'+lightingHash.slice(0,12)+'-'+sha(renderer+scene+app+html).slice(0,12);
 // Cache-safe finalization: JS and lighting URLs share the exact geometry/light token.
 const appPath=path.join(site,'src/app.js'),htmlPath=path.join(site,'index.html');
 let cacheSafeApp=fs.readFileSync(appPath,'utf8'),cacheSafeHtml=fs.readFileSync(htmlPath,'utf8');
 cacheSafeApp=cacheSafeApp.replaceAll('lighting.bin?v=area-higashiyama-quality-v4.15','lighting.bin?v='+assetToken);
 cacheSafeHtml=cacheSafeHtml.replaceAll('area-higashiyama-quality-v4.15',assetToken);
 fs.writeFileSync(appPath,cacheSafeApp);fs.writeFileSync(htmlPath,cacheSafeHtml);
 const viewerHashes={};for(const file of['src/renderer.js','src/scene.js','src/app.js','index.html'])viewerHashes[file]=sha(fs.readFileSync(path.join(site,file)));
 const triangles=model.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0);
 const info={revision:model.revision,viewerRevision:'area-higashiyama-quality-v4.15-deterministic',viewerHashes,modelHash,bakerHash,meshes:model.meshes.length,instances,triangles,lightSamples,rays:Number(rays),lightingBytes:light.length,lightingHash,architecture:model.stats,areaSites:model.areaSites,surveyed:false,assetToken,description:'Higashiyama miniature with geometry-matched baked light. Expanded source block: 2843 polygon buildings, thirteen metric landmark models, and separately reconstructed Kiyomizu hall/approach/stage. Kiyomizu uses provisional north-edge uniform calibration. Heights, roof details, gardens and terrain remain inferred; not a surveyed map.'};
 info.mobileAsset=mobileAsset;
 fs.writeFileSync(path.join(site,'build-info.json'),JSON.stringify(info,null,2));
 console.log('AREA_BUILD_VALIDATED',JSON.stringify({modelHash,meshes:model.meshes.length,instances,triangles,lightSamples,lightingBytes:light.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
