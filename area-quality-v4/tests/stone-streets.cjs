'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({console,performance});
for(const f of['renderer','scene'])vm.runInContext(fs.readFileSync(path.join(root,'site/src',f+'.js'),'utf8'),ctx);
const model=vm.runInContext('makeStudy()',ctx,{timeout:240000}),craft=model.cartography.streetCraft,source=JSON.parse(fs.readFileSync(path.join(root,'../area-data/historic-streets.json')));
const dist=(a,b)=>Math.hypot(...a.map((v,j)=>v-b[j]));
assert.ok(craft&&craft.construction.length===source.roads.length);
let faces=0,treads=0;
for(const road of craft.construction){
 const original=source.roads.find(r=>r.id===road.sourceWay),display=model.areaStreets.find(r=>r.id===road.sourceWay);
 assert.ok(original&&display,'every improved street belongs to an existing source way');
 original.points.forEach((p,j)=>assert.ok(dist([p[0]*.56,-p[1]*1.02],display.points[j])<1e-8,'source centre line has not moved'));
 assert.equal(road.steps,original.highway==='steps','stairs are only built on source-tagged stairways');
 for(const tread of road.treads){
  assert.ok(Math.max(...['a','b','c','d'].map(k=>tread[k][1]))-Math.min(...['a','b','c','d'].map(k=>tread[k][1]))<1e-8,'stair treads must be horizontal');
  assert.ok(tread.rise>0&&tread.rise<.14,'visible but bounded stair risers');treads++;
 }
 for(const s of road.samples)assert.ok(s.at[1]>=s.ground-.005,'paving cannot be hidden under the graded ground');
 faces+=road.stoneFaces;
}
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
for(const h of row){assert.ok(h.entranceRise>=0&&h.entranceRise<.25,'doorstep connects to the paving');assert.ok(h.foundationHeight<.55,'no tall shop pedestal in Ninenzaka');}
for(const name of['storybook-paving-mortar','storybook-stair-faces','storybook-shop-thresholds','storybook-fitted-stone-foundations'])assert.ok(model.meshes.some(m=>m.name===name&&m.p.length&&m.instances.length));
const triangles=model.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0),instances=model.meshes.reduce((n,m)=>n+m.instances.length,0);
assert.ok(triangles<3000000&&instances<42000,'retain the shared full-quality scene budget');
console.log(JSON.stringify({ok:true,revision:model.revision,faces,treads,continuousNinenJoins:joins,ninenShopfronts:row.length,triangles,instances,limitations:craft.positionPolicy}));
