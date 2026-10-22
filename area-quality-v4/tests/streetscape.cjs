'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console,performance});
for(const f of['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/src',f),'utf8'),ctx);
const m=vm.runInContext('makeStudy({reference:true})',ctx,{timeout:240000});
const retired=['higashiyama-area','landscape','distant-context','legacy-hokanji','legacy-kodaiji','legacy-yasaka'];
assert.ok(m.meshes.every(mesh=>mesh.instances.every(i=>!retired.includes(i.group))));
assert.equal(m.areaBuildings.length,0);assert.equal(m.areaStreets.length,0);
const fronts=m.footprintBuildings.filter(b=>b.frontage);
assert.ok(fronts.length>100);assert.equal(fronts.length,m.areaSites.frontageReference.count);
for(const b of fronts){assert.ok(b.frontage.facing>=.65);assert.ok(b.frontage.canopyDepth>=0&&b.frontage.canopyDepth<=.035);assert.ok(b.frontage.method.includes('inferred'));}
function world(p,i){
 const[x,y,z]=p.map((v,j)=>v*i.s[j]),[qx,qy,qz,qw]=i.q,tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
 return[x+qw*tx+qy*tz-qz*ty+i.p[0],y+qw*ty+qz*tx-qx*tz+i.p[1],z+qw*tz+qx*ty-qy*tx+i.p[2]];
}
assert.ok(m.metricGardenTrees.length>20);
let checkedVertices=0,maxHeight=0;
for(const t of m.metricGardenTrees){
 let pieces=0,hi=-Infinity,lo=Infinity,rad=0;
 for(const mesh of m.meshes)for(const i of mesh.instances){
  if(i.group!==t.group||!i.anchor||Math.hypot(i.anchor[0]-t.x,i.anchor[2]-t.z)>1e-5)continue;
  pieces++;
  for(let j=0;j<mesh.p.length;j+=3){const p=world(mesh.p.slice(j,j+3),i);hi=Math.max(hi,p[1]);lo=Math.min(lo,p[1]);rad=Math.max(rad,Math.hypot(p[0]-t.x,p[2]-t.z));checkedVertices++;}
 }
 assert.equal(pieces,11,'complete trunk, branches and crowns');
 assert.ok(Math.abs(lo-t.baseY)<.012,'tree grounded');
 assert.ok(hi<=t.baseY+t.height+.003,'actual height inside metre-scale budget');
 assert.ok(rad<t.radius+.005,'actual crown inside collision exclusion');
 maxHeight=Math.max(maxHeight,(hi-t.baseY)*20);
}
const out=path.resolve('district-v49-artifacts');fs.mkdirSync(out,{recursive:true});
const report={ok:true,frontages:fronts.length,gardenTrees:m.metricGardenTrees.length,maxTreeHeightMetres:maxHeight,checkedVertices,retiredInstances:m.areaSites.contextPolicy.retiredInstances,limitations:m.areaSites.scaleStatus};
fs.writeFileSync(path.join(out,'streetscape-geometry.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
