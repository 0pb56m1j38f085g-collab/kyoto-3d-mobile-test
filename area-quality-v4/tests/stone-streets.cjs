'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({console,performance});
for(const f of['renderer','scene'])vm.runInContext(fs.readFileSync(path.join(root,'site/src',f+'.js'),'utf8'),ctx);
const model=vm.runInContext('makeStudy()',ctx,{timeout:240000}),craft=model.cartography.streetCraft,source=JSON.parse(fs.readFileSync(path.join(root,'../area-data/historic-streets.json')));
const dist=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
const east=JSON.parse(fs.readFileSync(path.join(root,'../area-data/gion-footprints.json'))),west=JSON.parse(fs.readFileSync(path.join(root,'../area-data/west-gion-reference.json')));
const gojo=require('../../area-data/gojo-entry-reference.json');
const selection=require('../tourist-roads.cjs')(source,east,west),sourceWays=new Map([...gojo.roads,...west.roads,...east.roads,...source.roads].map(r=>[r.id,r]));
assert.ok(craft&&craft.construction.length===selection.roads.length);
assert.ok(selection.roads.length<=36&&craft.omittedMinorWays.length>1000,'a selective tourist network replaces broad road-type inclusion');
for(const name of ['清水坂','産寧坂','二寧坂','一念坂','八坂通','五条坂','ねねの道'])assert.ok(selection.roads.some(r=>r.name===name&&r.tier==='main'));
assert.ok(!model.meshes.some(m=>m.name==='storybook-cream-lanes'),'all selected roads use crafted paving');
let faces=0,treads=0;
for(const road of craft.construction){
 const original=sourceWays.get(road.sourceWay),display=model.areaStreets.find(r=>r.id===road.sourceWay),selected=selection.roads.find(r=>r.id===road.sourceWay);
 assert.ok(original&&display,'every improved street belongs to an existing source way');
 original.points.slice(selected.sourcePointRange[0],selected.sourcePointRange[1]+1).forEach((p,j)=>assert.ok(dist([p[0]*.56,-p[1]*1.02],display.points[j])<1e-8,'source centre line has not moved'));
 assert.equal(road.steps,original.highway==='steps','stairs are only built on source-tagged stairways');
 for(const tread of road.treads){
  assert.ok(Math.max(...['a','b','c','d'].map(k=>tread[k][1]))-Math.min(...['a','b','c','d'].map(k=>tread[k][1]))<1e-8,'stair treads must be horizontal');
  assert.ok(tread.rise>0&&tread.rise<.14,'visible but bounded stair risers');treads++;
 }
 for(const s of road.samples)assert.ok(s.at[1]>=s.ground-.005,'paving cannot be hidden under the graded ground');
 faces+=road.stoneFaces;
}
// A whitelist must retain the real unnamed links as well as named streets.
const pointDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const roads=[...model.areaStreets,...model.cartography.waterways.crossings.map(b=>({...b,id:b.sourceWay}))],connected=new Set([roads.find(r=>r.name==='清水坂').id]);
for(let n=0;n<roads.length;n++)for(const a of roads)if(connected.has(a.id))for(const b of roads){
 if(a.points.some(p=>b.points.slice(1).some((q,j)=>pointDistance(p,b.points[j],q)<.13))||b.points.some(p=>a.points.slice(1).some((q,j)=>pointDistance(p,a.points[j],q)<.13)))connected.add(b.id);
}
for(const name of ['清水坂','産寧坂','二寧坂','一念坂','八坂通','五条坂','ねねの道','下河原通','台所坂','八坂神社南参道','石塀小路','五条通','五条大橋'])assert.ok(roads.filter(r=>r.name===name).every(r=>connected.has(r.id)),name+' has source-based continuity');
// Compare the actual two road edges across touching OSM way boundaries. The
// former independent rectangles left gaps at Ninenzaka's stair/landing joins.
const ninen=craft.construction.filter(r=>r.name==='二寧坂');let joins=0;
for(const a of ninen)for(const b of ninen)if(a!==b)for(const ja of a.joins)for(const jb of b.joins){
 if(dist(ja.b.slice(0,2),jb.a.slice(0,2))>1e-8)continue;
 assert.ok(dist(ja.leftB,jb.leftA)<1e-8&&dist(ja.rightB,jb.rightA)<1e-8,'joined stairway and landing edges must coincide');joins++;
}
assert.ok(joins>=3&&faces>300&&treads>=10);
const row=model.areaBuildings.filter(b=>b.streetName==='二寧坂');
// This pass finishes a short section, not every parcel of Ninenzaka. Require
// a consecutive pair on each side rather than an arbitrary total house count.
assert.ok(row.filter(b=>b.x<-11).length>=2&&row.filter(b=>b.x>-10.3).length>=2,'Ninenzaka needs a run of shopfronts on both sides');
for(const h of row){assert.ok(h.depth>=.55&&h.height/h.depth<=1.851,'shop parcels must retain credible depth, not cardboard-thin walls');assert.ok(h.entranceRise>=0&&h.entranceRise<.25,'doorstep connects to the paving');assert.ok(h.foundationHeight<.55,'no tall shop pedestal in Ninenzaka');}
for(const name of['storybook-paving-mortar','storybook-stair-faces','storybook-shop-thresholds','storybook-fitted-stone-foundations'])assert.ok(model.meshes.some(m=>m.name===name&&m.p.length&&m.instances.length));
for(const name of ['清水坂','産寧坂','二寧坂','一念坂','八坂通','五条坂','ねねの道'])assert.ok(craft.construction.filter(r=>r.name===name).reduce((n,r)=>n+r.stoneFaces,0)>40,name+' receives individual stone faces');
assert.ok(model.meshes.some(m=>m.name.startsWith('storybook-detail-')&&m.p.length),'close-view alleys have their own paving batches');
// Probe actual stored paving triangles against actual stored terrain triangles.
// Centre-line heights alone missed green terrain cutting through sloped pavers.
const terrainBins=new Map(),bin=p=>Math.floor(p[0]*2)+','+Math.floor(p[2]*2);
for(const mesh of model.meshes.filter(m=>['storybook-soft-ground','storybook-wooded-ridge'].includes(m.name)))for(let k=0;k<mesh.p.length;k+=9){
 const tri=[0,3,6].map(j=>mesh.p.slice(k+j,k+j+3)),xs=tri.map(p=>p[0]),zs=tri.map(p=>p[2]);
 for(let x=Math.floor(Math.min(...xs)*2);x<=Math.floor(Math.max(...xs)*2);x++)for(let z=Math.floor(Math.min(...zs)*2);z<=Math.floor(Math.max(...zs)*2);z++){
  const key=x+','+z;if(!terrainBins.has(key))terrainBins.set(key,[]);terrainBins.get(key).push(tri);
 }
}
function terrainAt(p){
 for(const [a,b,c]of terrainBins.get(bin(p))||[]){
  const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-12)continue;
  const u=((b[2]-c[2])*(p[0]-c[0])+(c[0]-b[0])*(p[2]-c[2]))/den,v=((c[2]-a[2])*(p[0]-c[0])+(a[0]-c[0])*(p[2]-c[2]))/den,w=1-u-v;
  if(Math.min(u,v,w)>=-1e-5)return u*a[1]+v*b[1]+w*c[1];
 }throw Error('No rendered terrain under stone');
}
let pavingProbes=0,minPavingClearance=Infinity;
for(const mesh of model.meshes.filter(m=>/paving-stone-/.test(m.name)))for(let k=0;k<mesh.p.length;k+=9){
 const tri=[0,3,6].map(j=>mesh.p.slice(k+j,k+j+3));
 for(const weights of [[1/3,1/3,1/3],[.5,.5,0],[0,.5,.5],[.5,0,.5]]){
  const p=[0,1,2].map(j=>tri.reduce((n,v,i)=>n+v[j]*weights[i],0)),clearance=p[1]-terrainAt(p);minPavingClearance=Math.min(minPavingClearance,clearance);pavingProbes++;
  assert.ok(clearance>=-.002,'stored terrain must not pierce a stone face: '+clearance+' at '+p);
 }
}
const triangles=model.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0),instances=model.meshes.reduce((n,m)=>n+m.instances.length,0);
assert.ok(triangles<3000000&&instances<42000,'retain the shared full-quality scene budget');
console.log(JSON.stringify({ok:true,revision:model.revision,faces,treads,pavingProbes,minPavingClearance,continuousNinenJoins:joins,ninenShopfronts:row.length,triangles,instances,limitations:craft.positionPolicy}));
