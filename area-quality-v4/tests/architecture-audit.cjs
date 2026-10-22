'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {audit,bounds,world}=require('../architecture-audit.cjs');
const ctx=vm.createContext({console,performance});
for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/src',file),'utf8'),ctx);
const model=vm.runInContext('makeStudy({reference:true})',ctx,{timeout:240000});
const evidence=require('../../quality-v5/references/architecture-evidence.json');
const report=audit(model,evidence);
assert.equal(report.measured.wholeMainHall.instances,2158);
assert.ok(Math.abs(report.measured.projectingStage.size[0]-8.2)<.002);
assert.ok(Math.abs(report.measured.projectingStage.size[2]-3.86)<.002);
assert.ok(report.stageAreaAtDistrictScaleSquareMetres>170&&report.stageAreaAtDistrictScaleSquareMetres<180,'uniform source edge scale, not forced 200m²');
assert.ok(report.appliedPlacement.uniformScale>.11&&report.appliedPlacement.uniformScale<.12);
assert.ok(report.worldMainHallBounds.size[0]<3,'no giant hall in the district');
assert.ok(report.candidateOnly.uniformScaleFromStageArea>.12&&report.candidateOnly.uniformScaleFromStageArea<.13);
assert.equal(report.candidateOnly.applied,false);
assert.equal(report.readyForGeographicPlacement,false);
assert.equal(report.reference.boundaryVerified,false);
const placement=model.kiyomizuPlacement;
assert.ok(placement.stageCentre[2]<placement.roofCentre[2],'stage faces south');
const roofMesh=model.meshes.find(m=>m.name==='main-yosemune-roof');
for(const [x,expected] of [[-8,placement.source.points[0]],[8,placement.source.points[1]]]){
 let p=null;for(let j=0;j<roofMesh.p.length;j+=3)if(Math.abs(roofMesh.p[j]-x)<1e-6&&Math.abs(roofMesh.p[j+2]-8.85)<1e-6){p=world(roofMesh.p.slice(j,j+3),roofMesh.instances[0]);break;}
 assert.ok(p,'rear eave corner exists');
 assert.ok(Math.hypot(p[0]-expected[0],p[2]-expected[1])<.001,'actual roof matches selected source edge');
}
const west=model.meshes.find(m=>m.name==='west-approach-roof');
assert.ok(bounds(west.instances.map(instance=>({mesh:west,instance}))).hi[0]<placement.roofCentre[0],'west approach remains west after axis correction');
const stone=model.meshes.find(m=>m.name==='weathered-stone');
const footings=stone.instances.filter(i=>i.group==='main-hall'&&Math.abs(i.s[0]/placement.uniformScale-.5)<.001&&Math.abs(i.s[1]/placement.uniformScale-.24)<.001&&Math.abs(i.s[2]/placement.uniformScale-.48)<.001);
assert.equal(footings.length,18,'all actual stage foundation stones retained');
const terrain=model.meshes.find(m=>m.name==='continuous-wooded-escarpment');
function heightAt(x,z){
 for(let k=0;k<terrain.p.length;k+=9){const a=terrain.p.slice(k,k+3),b=terrain.p.slice(k+3,k+6),c=terrain.p.slice(k+6,k+9);
  if(x<Math.min(a[0],b[0],c[0])-1e-7||x>Math.max(a[0],b[0],c[0])+1e-7||z<Math.min(a[2],b[2],c[2])-1e-7||z>Math.max(a[2],b[2],c[2])+1e-7)continue;
  const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
  const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
  if(u>=-1e-6&&v>=-1e-6&&u+v<=1+1e-6)return u*a[1]+v*b[1]+(1-u-v)*c[1];
 }throw Error('foundation outside rendered terrain');
}
const footingErrors=footings.map(i=>Math.abs(bounds([{mesh:stone,instance:i}]).lo[1]-heightAt(i.p[0],i.p[2])));
assert.ok(Math.max(...footingErrors)<.012,'foundation bottoms touch rendered terrain within 24cm, synthetic slope');
report.foundationChecks={count:footings.length,maxGroundGapMetres:Math.max(...footingErrors)*20};
const out=path.resolve('district-v49-artifacts');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'architecture-scale-audit.json'),JSON.stringify(report,null,2));
// Quaternion and non-uniform instance scales must be included in measurement.
const b=bounds([{mesh:{p:[0,0,0,2,0,0,0,1,0]},instance:{p:[10,20,30],s:[2,3,4],q:[0,Math.SQRT1_2,0,Math.SQRT1_2]}}]);
assert.ok(Math.abs(b.size[2]-4)<1e-10);assert.ok(Math.abs(b.size[1]-3)<1e-10);
const roof=model.meshes.find(m=>m.name==='main-yosemune-roof');
roof.instances[0].s=roof.instances[0].s.map(v=>v*2);
const changed=audit(model,evidence);
assert.ok(Math.abs(changed.measured.mainRoof.size[0]-report.measured.mainRoof.size[0]*2)<1e-8,'measure geometry, not static metadata');
const stage=model.meshes.find(m=>m.name==='thin-planks').instances.find(i=>i.architecturePart==='projecting-stage');
delete stage.architecturePart;
assert.throws(()=>audit(model,evidence),/structural plate/,'fail closed when topology changes');
console.log(JSON.stringify({ok:true,report},null,2));
