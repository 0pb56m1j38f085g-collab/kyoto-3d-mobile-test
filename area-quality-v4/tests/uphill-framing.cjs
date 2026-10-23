'use strict';
// Camera acceptance uses the existing geographic approach and the real hall's
// front axis. It must not pass by rotating/repositioning the architecture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const site=path.resolve(__dirname,'../site'),info=JSON.parse(fs.readFileSync(path.join(site,'build-info.json')));
const app=fs.readFileSync(path.join(site,'src/app.js'),'utf8');
const model={cartography:info.cartography},ctx=vm.createContext({console,performance,model});
vm.runInContext(fs.readFileSync(path.join(site,'src/renderer.js'),'utf8'),ctx);
vm.runInContext('const presets='+app.match(/const presets=(\{.*?\});/)[1]+';const canvas={clientWidth:390,clientHeight:700};const copy=p=>JSON.parse(JSON.stringify(p));'+app.match(/function authored\(name\)\{[\s\S]*?\n \}/)[0],ctx);
const placement=info.areaSites.kiyomizuPlacement,l=model.cartography.landmarks.temple;
const stage=[l.at[0]+(placement.stageCentre[0]-placement.roofCentre[0])*l.scale,2.15+l.lift+(placement.stageCentre[1]-2.15)*l.scale,l.at[1]-(placement.stageCentre[2]-placement.roofCentre[2])*l.scale];
ctx.stage=stage;ctx.body=[l.at[0],stage[1],l.at[1]];
const source=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../area-data/historic-streets.json'))).roads.find(r=>r.id===28514434);
const approach=model.cartography.composition.approach;
assert.equal(model.cartography.composition.buildingRotation,0);
for(const [p,q]of[[approach.from,source.points[0]],[approach.to,source.points.at(-1)]]){
 assert.equal(p[0],q[0]*model.cartography.displayScaleEast);
 assert.equal(p[2],-q[1]*model.cartography.displayScale);
}
assert.ok(approach.to[1]>approach.from[1],'approach climbs toward the existing temple');
const report=[];
for(const [w,h]of[[390,700],[390,660],[375,560],[430,932],[1280,900]]){
 ctx.width=w;ctx.height=h;
 const result=vm.runInContext(`(()=>{
  canvas.clientWidth=width;canvas.clientHeight=height;const c=authored('area');
  const eye=V.add(c.target,[Math.sin(c.yaw)*Math.cos(c.pitch)*100,Math.sin(c.pitch)*100,Math.cos(c.yaw)*Math.cos(c.pitch)*100]);
  const vp=M.mul(M.perspective(2*Math.atan(c.span/200),width/height,.25,250),M.look(eye,c.target));
  const project=p=>{const q=M.point(vp,p);return[(q[0]*.5+.5)*width,(.5-q[1]*.5)*height];};
  const a=model.cartography.composition.approach;
  const b=model.cartography.framing.bounds.temple;
  const corners=[b.x0,b.x1].flatMap(x=>[b.y0,b.y1].flatMap(y=>[b.z0,b.z1].map(z=>project([x,y,z]))));
  return {width,height,camera:c,bridge:project(model.cartography.composition.entry.at),entry:project(a.from),arrival:project(a.to),stage:project(stage),body:project(body),temple:project(model.cartography.landmarkPins.temple),corners};
 })()`,ctx);
 assert.ok(result.arrival[1]<result.entry[1]-8,'street rises into the screen');
 assert.ok(result.temple[1]<result.entry[1]-40,'temple sits beyond the uphill approach');
 assert.ok(result.bridge[0]>20&&result.bridge[0]<w-20&&result.bridge[1]>h*.55&&result.bridge[1]<h-65,'real Gojo bridge is visible in the foreground');
 assert.ok(result.bridge[1]>result.entry[1]+35,'bridge to town to uphill approach reads back into the scene');
 const entry=model.cartography.composition.entry.at,hero=model.cartography.landmarks.temple.at,axis=Math.atan2(entry[0]-hero[0],entry[2]-hero[1]);
 assert.ok(Math.abs(result.camera.yaw-axis)<1e-8,'camera direction is anchored to the real bridge and temple');
 assert.ok(result.stage[0]>result.body[0]+8,'the stage projects toward screen right');
 assert.ok(result.corners.every(p=>p[0]>10&&p[0]<w-10&&p[1]>80&&p[1]<h-80),'whole main-hall silhouette remains visible');
 const silhouetteWidth=Math.max(...result.corners.map(p=>p[0]))-Math.min(...result.corners.map(p=>p[0]));
 const silhouetteHeight=Math.max(...result.corners.map(p=>p[1]))-Math.min(...result.corners.map(p=>p[1]));
 assert.ok(Math.max(silhouetteWidth,silhouetteHeight)>Math.min(w,h)*.27,'main hall remains prominent on the shorter screen axis');
 report.push(result);
}
console.log(JSON.stringify({ok:true,sourceApproachWay:source.id,buildingRotation:0,viewports:report}));
