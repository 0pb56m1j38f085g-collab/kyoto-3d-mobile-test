'use strict';
// Measure rendered geometry, not the descriptive scene.stats fields.
const assert=require('node:assert/strict');
function world(v,i){
 const [x,y,z]=v.map((v,k)=>v*i.s[k]),[a,b,c,w]=i.q;
 const tx=2*(b*z-c*y),ty=2*(c*x-a*z),tz=2*(a*y-b*x);
 return [x+w*tx+b*tz-c*ty+i.p[0],y+w*ty+c*tx-a*tz+i.p[1],z+w*tz+a*ty-b*tx+i.p[2]];
}
function bounds(entries,transform=p=>p){
 assert.ok(entries.length,'missing geometry selection');
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const {mesh,instance} of entries)for(let k=0;k<mesh.p.length;k+=3){
  transform(world(mesh.p.slice(k,k+3),instance)).forEach((v,j)=>{assert.ok(Number.isFinite(v));lo[j]=Math.min(lo[j],v);hi[j]=Math.max(hi[j],v);});
 }
 return {lo,hi,size:hi.map((v,j)=>v-lo[j]),instances:entries.length};
}
function audit(model,evidence){
 const entries=model.meshes.flatMap(mesh=>mesh.instances.filter(i=>i.group==='main-hall').map(instance=>({mesh,instance})));
 const select=name=>entries.filter(e=>e.mesh.name===name);
 const placement=model.kiyomizuPlacement,s=placement?.uniformScale||1;
 const inverse=placement?p=>{const dx=p[0]-placement.rearCentre[0],dz=p[2]-placement.rearCentre[1];return[(placement.cos*dx+placement.sin*dz)/s,(p[1]-placement.baseY)/s,-(-placement.sin*dx+placement.cos*dz)/s+placement.localRearZ];}:p=>p;
 const roof=bounds(select('main-yosemune-roof'),inverse);
 const west=bounds(select('west-approach-roof'),inverse);
 // This is the structural deck plate, not the overlaid individual boards or rails.
 // An authored topology change must update this selector explicitly, never silently
 // substitute the bounding box of the whole hall for the projecting stage.
 const plates=select('thin-planks').filter(e=>placement?e.instance.architecturePart==='projecting-stage':Math.abs(e.instance.s[0]-8.2)<1e-5&&Math.abs(e.instance.s[1]-.34)<1e-5&&Math.abs(e.instance.s[2]-3.86)<1e-5);
 assert.equal(plates.length,1,'identify the projecting stage structural plate');
 const stage=bounds(plates,inverse),all=bounds(entries,inverse);
 const scale=model.areaSites.scaleMetresPerUnit;
 assert.ok(Number.isFinite(scale)&&scale>0,'district scale');
 const source=evidence.sources.find(s=>s.id==='temple-history-stage');
 assert.ok(source,'stage evidence missing');
 const stageArea=stage.size[0]*stage.size[2],referenceArea=source.facts.stageAreaApproxSquareMetres;
 assert.ok(referenceArea>0);
 const candidate=Math.sqrt(referenceArea/stageArea)/scale;
 const measurement=b=>({...b,sizeAtDistrictScaleMetres:b.size.map(v=>v*scale*s)});
 return {
  schemaVersion:1,revision:model.revision,metresPerDistrictUnit:scale,
  measured:{wholeMainHall:measurement(all),mainRoof:measurement(roof),westApproachRoof:measurement(west),projectingStage:measurement(stage)},
  stageAreaAtDistrictScaleSquareMetres:stageArea*scale*scale*s*s,
  appliedPlacement:placement||null,worldMainHallBounds:bounds(entries),
  reference:{areaSquareMetres:referenceArea,url:source.url,boundaryVerified:false},
  candidateOnly:{uniformScaleFromStageArea:candidate,mainRoofSizeMetres:roof.size.map(v=>v*scale*candidate),applied:false},
  readyForGeographicPlacement:false,
  unresolved:['Stage deck boundary must be compared with the published approximate area.',
   'Main roof, mokoshi and west corridor have different extents; do not fit their combined bounding box to the published front width.',
   'Stage-facing direction, terrain datum, footings, access paths and adjacent buildings require a shared geographic transform.',
   'No surveyed elevation model is available; neither the candidate scale nor the current terrain is a survey.']
 };
}
module.exports={audit,bounds,world};
