'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console,performance});
for(const file of ['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../site/src',file),'utf8'),ctx);
const model=vm.runInContext('makeStudy()',ctx,{timeout:240000});
function world(v,i){
 const [x,y,z]=v.map((v,k)=>v*i.s[k]),[qx,qy,qz,qw]=i.q;
 const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
 return [x+qw*tx+qy*tz-qz*ty+i.p[0],y+qw*ty+qz*tx-qx*tz+i.p[1],z+qw*tz+qx*ty-qy*tx+i.p[2]];
}
const measured=[];
for(const r of model.metricLandmarks){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let instances=0;
 for(const m of model.meshes)for(const i of m.instances)if(i.group===r.group){
  instances++;for(let k=0;k<m.p.length;k+=3){const p=world(m.p.slice(k,k+3),i);p.forEach((v,j)=>{lo[j]=Math.min(lo[j],v);hi[j]=Math.max(hi[j],v);});}
 }
 assert.ok(instances>30,r.key+' actual geometry');
 const observedHeight=(hi[1]-r.baseY)*20;
 assert.ok(Math.abs(observedHeight-r.heightMetres)<.025,r.key+' measured mesh height '+observedHeight);
 assert.ok(Math.abs(lo[1]-r.baseY)<.04,r.key+' grounded');
 assert.ok(Math.hypot((lo[0]+hi[0])/2-r.center[0],(lo[2]+hi[2])/2-r.center[1])<.10,r.key+' geometry at source centre');
 measured.push({key:r.key,instances,observedHeightMetres:observedHeight,worldBounds:{lo,hi},centre:r.center});
}
assert.equal(measured.length,4);
assert.ok(model.meshes.every(m=>m.instances.every(i=>!['legacy-hokanji','legacy-yasaka'].includes(i.group))));
const h=model.metricLandmarks.find(r=>r.key==='yasaka-honden'),m=model.metricLandmarks.find(r=>r.key==='yasaka-maiden'),g=model.metricLandmarks.find(r=>r.key==='yasaka-south-gate');
assert.ok(h.center[1]>m.center[1]&&m.center[1]>g.center[1]);
assert.ok(Math.hypot(h.center[0]-g.center[0],h.center[1]-g.center[1])*20<70,'precinct sequence no longer stretched over 170m');
assert.ok(model.areaSites.scaleStatus.includes('remain exaggerated'),'remaining scale limitations explicit');
assert.equal(model.stats.mainHallInstances,2158);
// Fine vertex spacing is required for baked shadows at the new physical scale.
for(const name of ['gion-footprints-#9cab76:0','gion-footprints-#d8cbb4:3']){
 const mesh=model.meshes.find(m=>m.name===name);assert.ok(mesh,name+' exists');
 for(let i=0;i<mesh.p.length;i+=9)for(let j=0;j<3;j++){
  const a=mesh.p.slice(i+j*3,i+j*3+3),b=mesh.p.slice(i+((j+1)%3)*3,i+((j+1)%3)*3+3);
  assert.ok(Math.hypot(...a.map((v,k)=>v-b[k]))<.18,name+' subdivided for lighting');
 }
}
const out=path.resolve('district-v49-artifacts');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'metric-geometry.json'),JSON.stringify({ok:true,measured,limitations:model.areaSites.scaleStatus},null,2));
console.log(JSON.stringify({ok:true,measured},null,2));
