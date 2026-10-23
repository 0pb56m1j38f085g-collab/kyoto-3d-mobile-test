'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),context=vm.createContext({console,performance});
for(const file of ['renderer','scene'])vm.runInContext(fs.readFileSync(path.join(root,'site/src',file+'.js'),'utf8'),context);
const model=vm.runInContext('makeStudy()',context,{timeout:240000});
const triangles=model.meshes.reduce((sum,m)=>sum+m.p.length/9*m.instances.length,0),instances=model.meshes.reduce((sum,m)=>sum+m.instances.length,0);
assert.ok(triangles<3000000&&instances<42000,'shared full-quality geometry budget');
assert.equal(model.cartography.mode,'illustrated-miniature');assert.equal(model.cartography.metric,false);assert.equal(model.cartography.routeGeometry,false);
assert.equal(model.metricLandmarks.length,13);
assert.equal(model.meshes.reduce((n,m)=>n+m.instances.filter(i=>i.group==='main-hall').length,0),2158,'main hall and stage construction retained');
for(const record of model.metricLandmarks)assert.ok(model.meshes.some(m=>m.instances.some(i=>i.group===record.group)),record.key+' remains present');
assert.ok(model.areaBuildings.length>100&&model.areaBuildings.length<=360);
assert.ok(model.cartography.trees>=1000&&model.cartography.trees<=1300,'quieter woodland budget');
assert.ok(model.cartography.vegetation.maxHeight<=2.1&&model.cartography.vegetation.averageHeight<1.6,'small crowns stay subordinate to landmark architecture');
assert.ok(model.meshes.some(m=>m.name==='storybook-sculpted-canopy'));
assert.ok(model.meshes.some(m=>m.name==='storybook-machiya-gables'),'closed gables avoid hollow toy roofs');
for(const name of ['storybook-machiya-roof','storybook-shop-eave']){
 const roof=model.meshes.find(m=>m.name===name);assert.ok(roof&&roof.instances.length);
 for(let i=1;i<roof.n.length;i+=3)assert.ok(roof.n[i]>0,'roof bake normals must face the sky: '+name);
}
assert.ok(model.areaBuildings.length>=100,'continuous town density');
assert.ok(model.areaBuildings.every(b=>b.illustrative&&Number.isFinite(b.x)&&Number.isFinite(b.z)));
assert.ok(model.areaBuildings.every(b=>b.height<=1.76&&b.width<=1.77),'ordinary houses are subordinate to landmarks');
assert.ok(model.areaBuildings.every(b=>Math.abs(b.frontageShift)<=.65&&b.sourceAnchor.every(Number.isFinite)&&b.streetWay),'frontages remain tied to a source parcel and actual street');
assert.ok(model.cartography.relief.eastRidgeHeight-model.cartography.relief.plainHeight>5,'readable mountain/plain contrast');
assert.ok(model.cartography.landmarks.temple.scale>=5.8&&model.cartography.landmarks.yasaka.scale>=1.8&&model.cartography.landmarks.kodaiji.heightEmphasis>1.5,'Kiyomizu leads, with the other named districts still legible');
assert.deepEqual([...new Set(model.cartography.waterways.channels.map(r=>r.name))].sort(),['白川','鴨川']);
assert.ok(!model.meshes.some(m=>m.name==='metric-yasaka-gravel'&&m.instances.length),'no inherited enlarged precinct slab across the river');
for(const name of ['storybook-river-water','storybook-river-banks','storybook-water-glints','storybook-wooded-ridge'])assert.ok(model.meshes.some(m=>m.name===name&&m.instances.length&&m.p.length>0),name+' rendered as geometry');
const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
for(const b of model.areaBuildings)for(const r of model.cartography.waterways.channels)assert.ok(Math.min(...r.points.slice(1).map((p,j)=>distance(b.x,b.z,r.points[j],p)))>r.width/2+.8,'house clear of river bank');
// Sample real street centres in each actual house's local frame. The separate
// corridor clipper must not allow an illustrated roof across a historic lane.
for(const b of model.areaBuildings)for(const r of model.areaStreets.filter(r=>r.hero))for(let j=1;j<r.points.length;j++){
 const a=r.points[j-1],p=r.points[j],len=Math.hypot(p[0]-a[0],p[1]-a[1]);
 if(distance(b.x,b.z,a,p)>3)continue;
 for(let k=0,n=Math.ceil(len/.08);k<=n;k++){
  const dx=a[0]+(p[0]-a[0])*k/n-b.x,dz=a[1]+(p[1]-a[1])*k/n-b.z;
  const x=dx*Math.cos(b.yaw)-dz*Math.sin(b.yaw),z=dx*Math.sin(b.yaw)+dz*Math.cos(b.yaw);
  const width=model.cartography.streetCraft.construction.find(s=>s.sourceWay===r.id).width;
  assert.ok(Math.abs(x)>b.width*.60+width/2||Math.abs(z)>b.depth*.61+width/2,'historic lane remains clear of house roofs');
 }
}
const cart=model.cartography;
assert.equal(cart.coordinateFrame.render,'east +X / up +Y / south +Z');
assert.equal(cart.coordinateFrame.reflectionApplied,true);
for(const [key,l]of Object.entries(cart.landmarks)){
 assert.ok(Math.abs(l.at[0]-l.source[0]*cart.displayScaleEast)<1e-8,key+' shared longitude transform');
 assert.ok(Math.abs(l.at[1]+l.source[1]*cart.displayScale)<1e-8,key+' shared latitude transform');
}
const ls=Object.values(cart.landmarks);for(const a of ls)for(const b of ls)if(a!==b){
 assert.equal(Math.sign(a.at[0]-b.at[0]),Math.sign(a.source[0]-b.source[0]),'east/west ordering preserved');
 assert.equal(Math.sign(a.at[1]-b.at[1]),-Math.sign(a.source[1]-b.source[1]),'north/south ordering preserved');
}
const waterSource=JSON.parse(fs.readFileSync(path.join(root,'../area-data/west-gion-reference.json')));
for(const r of cart.waterways.channels){const original=waterSource.water.find(s=>s.id===r.sourceWay);assert.ok(original&&!original.tunnel,'no invented / underground open river');
 const p=original.points.map(p=>[p[0]*cart.displayScaleEast,-p[1]*cart.displayScale]);
 for(const v of r.points)assert.ok(Math.min(...p.slice(1).map((b,j)=>distance(...v,p[j],b)))<.0001,'rendered river centre line follows source');
}
const gojoSource=JSON.parse(fs.readFileSync(path.join(root,'../area-data/gojo-entry-reference.json')));
for(const r of cart.waterways.crossings){const source=[...waterSource.bridges,...gojoSource.bridges].find(b=>b.id===r.sourceWay);assert.ok(source,'no fictional bridge');for(let j=0;j<r.points.length;j++){assert.ok(Math.abs(r.points[j][0]-source.points[j][0]*cart.displayScaleEast)<1e-8);assert.ok(Math.abs(r.points[j][1]+source.points[j][1]*cart.displayScale)<1e-8);}}
const major=cart.landmarks,westRiver=cart.waterways.channels.find(r=>r.name==='鴨川');
assert.ok(westRiver.points.every(p=>p[0]<major.yasaka.at[0]&&p[0]<major.hokanji.at[0]),'Kamo stays west, beyond the Gion town block');
assert.ok(major.temple.at[1]>major.hokanji.at[1]&&major.hokanji.at[1]>major.kodaiji.at[1]&&major.kodaiji.at[1]>major.yasaka.at[1],'Kiyomizu -> Hokanji -> Kodaiji -> Yasaka south-to-north order');
assert.ok(cart.framing.bounds.temple.x1-cart.framing.bounds.temple.x0>14,'main hall and approach visually dominate');
// Verify geographic handedness with the real renderer projection, not labels.
const vectors=vm.runInContext(`(()=>{const view=M.look([0,40,-100],[0,0,0]),p=M.perspective(.6,.6,.25,250),vp=M.mul(p,view);return{east:M.point(vp,[10,0,0]),west:M.point(vp,[-10,0,0]),north:M.point(vp,[0,0,-10]),south:M.point(vp,[0,0,10])};})()`,context);
assert.ok(vectors.east[0]<vectors.west[0]&&vectors.north[1]<vectors.south[1],'south-up rendering: east left, west right, north down');
const html=fs.readFileSync(path.join(root,'site/index.html'),'utf8'),app=fs.readFileSync(path.join(root,'site/src/app.js'),'utf8');
assert.ok(!html.includes('<section class="bottom"')&&!html.includes('<nav class="tabs"'),'bottom menu removed, not just hidden');
assert.ok(html.includes('id="compass"')&&html.includes('id="orientation"')&&html.includes('id="quality-label"'),'direction and settings retained');
assert.ok(!app.includes('getBoundingClientRect().top-12')&&!app.includes('updateStory('),'no references to deleted menu');
assert.ok(model.meshes.every(m=>m.p.every(Number.isFinite)&&m.n.every(Number.isFinite)),'finite terrain and channel geometry');
for(const m of model.meshes.filter(m=>['storybook-soft-ground','storybook-wooded-ridge'].includes(m.name)))for(let k=0;k<m.p.length;k+=9){
 const p=m.p;for(const [a,b]of[[0,3],[3,6],[6,0]])assert.ok(Math.hypot(p[k+a]-p[k+b],p[k+a+2]-p[k+b+2])<.41,'terrain cells bounded for slope and shoreline interpolation');
}
assert.ok(!model.meshes.some(m=>m.instances.some(i=>['kiyomizu-landscape','gion-footprint-blocks','district-terrain'].includes(i.group))),'retire dense non-display geometry');
const asset=JSON.parse(fs.readFileSync(path.join(root,'.build/mobile-pack.json')));
assert.ok(asset.bytes<16*1024*1024&&asset.compressedBytes<5*1024*1024&&asset.manifestBytes<280000,'download and GPU-input budgets, including the real Gojo arrival source');
assert.ok(asset.maxChunkBytes<=2*1024*1024&&asset.chunkCount>=2);
assert.equal(asset.triangles,triangles);assert.equal(asset.instances,instances);
const sourceHashes={};for(const file of ['historic-streets.json','gion-footprints.json'])sourceHashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'../area-data',file))).digest('hex');
assert.deepEqual(sourceHashes,{'historic-streets.json':'170bb89edda78d10fd84b45ce089fdcc7f6906abf913a3bacecdcc2f92a39151','gion-footprints.json':'d0d1e9120fe00f0c2e242bbc350475dc23cc49ce023cbbedcb54fe446058792b'},'geographic sources unchanged by visual work');
const report={ok:true,revision:model.revision,triangles,instances,trees:model.cartography.trees,houses:model.areaBuildings.length,mobile:asset,geographicSourceHashes:sourceHashes,geographicFrame:cart.coordinateFrame,landmarkAnchors:cart.landmarks,waterSourceWays:cart.waterways.channels.map(r=>r.sourceWay),bridgeSourceWays:cart.waterways.crossings.map(r=>r.sourceWay),limitations:model.cartography.notice};
fs.mkdirSync('district-v49-artifacts',{recursive:true});fs.writeFileSync('district-v49-artifacts/storybook-geometry.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
