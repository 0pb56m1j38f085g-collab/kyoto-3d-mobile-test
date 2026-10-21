'use strict';
// Read-only geometry inspection. A passed execution is NOT an architectural-accuracy approval.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const site = path.resolve(process.argv[2] || 'quality-test-artifacts/site');
const output = path.resolve(process.argv[3] || 'architecture-geometry-audit.json');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const sceneHash = 'c4573b9fc80a0473e57d78096abf51692cc9864211e4e3b98429b406022a5e77';
const scenePath = path.join(site,'src/scene.js');
const source = fs.readFileSync(scenePath,'utf8');
assert.equal(hash(source),sceneHash,'This measurement protocol is specific to the inspected v5.4 model');
const before = {};
for (const file of ['src/scene.js','src/renderer.js','src/app.js','index.html','lighting.bin']) {
 before[file] = hash(fs.readFileSync(path.join(site,file)));
}
const ctx = vm.createContext({console,performance});
for (const name of ['renderer.js','scene.js']) {
 new vm.Script(fs.readFileSync(path.join(site,'src',name),'utf8'),{filename:name}).runInContext(ctx,{timeout:15000});
}
const model = new vm.Script('makeStudy()').runInContext(ctx,{timeout:30000});
assert.equal(model.revision,'quality-v5.4');
const near=(a,b)=>Math.abs(a-b)<1e-6;
const sortedUnique=values=>Array.from(new Set(values.map(x=>Number(x.toFixed(6))))).sort((a,b)=>a-b);
const round=model.meshes.find(m=>m.name==='round-columns');
assert.ok(round,'Round column geometry is required');
const upright=round.instances.filter(i=>i.group==='main-hall' && near(i.q[0],0) && near(i.q[2],0));
const floor=7.7;
const front=upright.filter(i=>near(i.p[2],.70)&&near(i.p[1]-i.s[1]/2,floor+.04)&&near(i.p[1]+i.s[1]/2,floor+2.78));
const sides=[-1,1].map(sign=>upright.filter(i=>near(i.p[0],sign*6.72)&&near(i.p[1]-i.s[1]/2,floor)&&near(i.p[1]+i.s[1]/2,floor+2.8)));
const stage=upright.filter(i=>near(i.s[0],.16)&&near(i.s[2],.16)&&near(i.p[1]+i.s[1]/2,floor-.12)&&i.p[2]>.9&&i.p[2]<4.8);
const row=(items,axis)=>{
 const coordinates=sortedUnique(items.map(i=>i.p[axis]));
 return {columnCount:coordinates.length,coordinates,intervalCount:Math.max(0,coordinates.length-1),intervals:coordinates.slice(1).map((v,i)=>Number((v-coordinates[i]).toFixed(6)))};
};
function bounds(name){
 const m=model.meshes.find(m=>m.name===name);assert.ok(m,'Missing mesh '+name);
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(const i of m.instances) for(let k=0;k<m.p.length;k+=3){
  const p=[0,1,2].map(j=>m.p[k+j]*i.s[j]),q=i.q.slice(0,3),a=cross(q,p),b=cross(q,a.map((v,j)=>v+i.q[3]*p[j]));
  for(let j=0;j<3;j++){const w=i.p[j]+p[j]+2*b[j];assert.ok(Number.isFinite(w));lo[j]=Math.min(lo[j],w);hi[j]=Math.max(hi[j],w);}
 }
 return {mesh:name,min:lo,max:hi,size:hi.map((v,j)=>v-lo[j]),units:'unscaled model units; not metres'};
}
const frontReport=row(front,0),sideReports=sides.map(items=>row(items,2));
assert.equal(frontReport.columnCount,10,'Unexpected front measurement: inspect protocol before continuing');
assert.ok(sideReports.every(r=>r.columnCount===7),'Unexpected side measurement: inspect protocol before continuing');
assert.equal(stage.length,18,'Unexpected stage measurement: inspect protocol before continuing');
const report={
 status:'inspection_complete_not_accuracy_approved',revision:model.revision,sourceHash:sceneHash,
 geometryModified:false,publishedSiteModified:false,unitScaleToMetres:null,
 method:'Inspect generated, grouped round-column instances and transformed roof vertices; do not accept authored metadata as measured geometry.',
 declaredBays:Array.from(model.stats.mainBays),
 observedFrontVeranda:frontReport,observedOuterSideRows:sideReports,
 stageSupports:{actualCount:stage.length,positions:stage.map(i=>({x:i.p[0],z:i.p[2],bottom:i.p[1]-i.s[1]/2,top:i.p[1]+i.s[1]/2}))},
 mainRoof:bounds('main-yosemune-roof'),
 warnings:[
  'Each selected outer side row has seven columns/six intervals, whereas model.stats declares seven side bays. The selected row may not represent the formal bay layout: correspondence to the real structure remains unverified.',
  'Neither matching a column count nor passing this inspection establishes real-world dimensions, correct post placement or architectural accuracy.',
  'This report deliberately does not rescale the model to independent published width, depth or height estimates, because their measurement boundaries have not been aligned.'
 ]
};
for (const [file,expected] of Object.entries(before)) assert.equal(hash(fs.readFileSync(path.join(site,file))),expected,'Read-only audit altered '+file);
report.unchangedHashes=before;
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
