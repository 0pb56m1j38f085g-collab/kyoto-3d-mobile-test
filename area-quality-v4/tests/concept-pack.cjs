'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),ctx=vm.createContext({console,performance});
for(const file of ['renderer','scene'])vm.runInContext(fs.readFileSync(path.join(site,'src',file+'.js'),'utf8'),ctx);
const model=vm.runInContext('makeStudy()',ctx,{timeout:240000});
const asset=JSON.parse(fs.readFileSync(path.join(root,'.build/mobile-pack.json'))),manifest=JSON.parse(fs.readFileSync(path.join(site,asset.url)));
let offset=0;
const expected=new Map();
for(const m of model.meshes){if(!m.instances.length||!m.p.length)continue;const keys=new Map();for(let v=0;v<m.p.length/3;v++){
 const key=[...m.p.slice(v*3,v*3+3),...m.n.slice(v*3,v*3+3)].map(Math.fround).join(',');if(!keys.has(key))keys.set(key,keys.size);
}expected.set(m.name,{keys,offset,instances:m.instances.length});offset+=keys.size*m.instances.length;}
assert.equal(offset,manifest.lightSampleCount);assert.equal(offset,asset.lightSampleCount);
let checked=0,triangles=0;
for(const chunk of manifest.mobileChunks){const bytes=zlib.gunzipSync(fs.readFileSync(path.join(site,chunk.url))),length=bytes.readUInt32LE(4),start=16+((length+3)&~3),meta=JSON.parse(bytes.subarray(16,16+length));
 for(const m of meta.meshes){const e=expected.get(m.name);assert.ok(e);assert.equal(m.lightOffset,e.offset);assert.equal(m.lightStride,e.keys.size);assert.equal(m.instanceCount,e.instances);
  for(let v=0;v<m.vertices;v++){const values=[0,1].flatMap(k=>[0,1,2].map(a=>bytes.readFloatLE(start+m.offsets[k]+(v*3+a)*4))),id=bytes.readFloatLE(start+m.offsets[4]+v*4);assert.equal(id,e.keys.get(values.join(',')));checked++;}
  triangles+=m.count*m.instanceCount/3;
 }
}
assert.equal(triangles,model.meshes.reduce((n,m)=>n+m.p.length/9*m.instances.length,0));
assert.ok(model.areaBuildings.length>=150&&triangles<3000000,'bounded complete scene');
assert.equal(model.cartography.coordinateFrame.render,'east +X / up +Y / south +Z');
for(const a of Object.values(model.cartography.landmarks))for(const b of Object.values(model.cartography.landmarks)){
 assert.equal(Math.sign(a.at[0]-b.at[0]),Math.sign(a.source[0]-b.source[0]));
 if(a!==b)assert.equal(Math.sign(a.at[1]-b.at[1]),-Math.sign(a.source[1]-b.source[1]));
}
for(const id of ['street','sannenzaka'])assert.ok(model.cartography.landmarkPins[id].every(Number.isFinite));
const infoPath=path.join(site,'build-info.json');if(fs.existsSync(infoPath)){
 const info=JSON.parse(fs.readFileSync(infoPath));if(info.modelHash===asset.sourceModelHash)assert.equal(info.lightSamples,offset);
}
const html=fs.readFileSync(path.join(site,'index.html'),'utf8'),app=fs.readFileSync(path.join(site,'src/app.js'),'utf8');
assert.ok(!html.includes('<option value="light">')&&!html.includes('<section class="bottom"'));
assert.ok(!/\blowMemoryIOS\b/.test(app)&&!app.includes('makeStudy()'));
ctx.model=model;
vm.runInContext('const presets='+app.match(/const presets=(\{.*?\});/)[1]+';const canvas={clientWidth:390,clientHeight:700};const copy=p=>JSON.parse(JSON.stringify(p));'+app.match(/function authored\(name\)\{[\s\S]*?\n \}/)[0],ctx);
const framing=vm.runInContext(`(()=>{
 const c=authored('area'),w=canvas.clientWidth,h=canvas.clientHeight,eye=V.add(c.target,[Math.sin(c.yaw)*Math.cos(c.pitch)*100,Math.sin(c.pitch)*100,Math.cos(c.yaw)*Math.cos(c.pitch)*100]);
 const vp=M.mul(M.perspective(2*Math.atan(c.span/200),w/h,.25,250),M.look(eye,c.target));
 const project=v=>{const q=M.point(vp,v);return[(q[0]*.5+.5)*w,(.5-q[1]*.5)*h];};
 const pins=Object.fromEntries(['temple','hokanji','kodaiji','yasaka'].map(k=>[k,project(model.cartography.landmarkPins[k])]));
 const b=model.cartography.framing.bounds.temple,pts=[b.x0,b.x1].flatMap(x=>[b.y0,b.y1].flatMap(y=>[b.z0,b.z1].map(z=>project([x,y,z]))));
 return {camera:c,pins,templeWidth:Math.max(...pts.map(p=>p[0]))-Math.min(...pts.map(p=>p[0]))};
})()`,ctx);
const pinY=Object.values(framing.pins).map(p=>p[1]);
assert.ok(Math.min(...pinY)<700*.45,'opening landmarks must not sit entirely below a large empty sky');
assert.ok(Math.max(...pinY)-Math.min(...pinY)>700*.18,'landmarks must occupy a legible vertical composition');
assert.ok(framing.templeWidth>390*.27,'Kiyomizu must have a prominent opening silhouette');
console.log(JSON.stringify({ok:true,revision:model.revision,checkedPackedLightVertices:checked,lightSamples:offset,triangles,houses:model.areaBuildings.length,trees:model.cartography.trees,bytes:asset.bytes,downloadBytes:asset.compressedBytes,framing}));
