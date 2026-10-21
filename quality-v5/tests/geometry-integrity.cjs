'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto'),path=require('path');
const dir=path.resolve(__dirname,'../site/src')+'/';
const ctx=vm.createContext({console,performance,Float32Array,Uint16Array,Uint32Array,Map});
for(const file of['renderer.js','scene.js'])vm.runInContext(fs.readFileSync(dir+file,'utf8'),ctx,{filename:file});
const checks=[];function check(name,value,detail){assert.ok(value,name);checks.push({name,passed:true,detail});}
const model=vm.runInContext('makeStudy()',ctx);
check('Updated geometric model loaded',model.revision==='quality-v5.3');
check('Two wing-roof meshes',model.meshes.filter(m=>m.name.startsWith('wing-roof-')).length===2);
check('Main hipped roof exists',model.meshes.some(m=>m.name==='main-yosemune-roof'));
check('Authored stage-support count remains 18',model.stats.stageSupportCount===18);
check('Dimensions are explicitly not surveyed',model.stats.surveyed===false);
let next=1,bound=new Map(),buffers=new Map(),vaos=new Map(),currentVAO=null;
const g={ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,STATIC_DRAW:35044,FLOAT:5126,UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,
 createVertexArray(){const id=next++;vaos.set(id,{});return id;},bindVertexArray(id){currentVAO=id;},
 createBuffer(){const id=next++;return id;},bindBuffer(target,id){bound.set(target,id);if(target===34963&&currentVAO)vaos.get(currentVAO).indices=id;},bufferData(target,array){buffers.set(bound.get(target),array);},
 enableVertexAttribArray(){},vertexAttribPointer(loc,size,type,norm,stride,offset){vaos.get(currentVAO)[loc]={id:bound.get(34962),size,stride,offset};},vertexAttribDivisor(){}
};
const renderer={gl:g,scene:model};vm.runInContext('Renderer.prototype.upload',ctx).call(renderer);
let oldVertices=0,newVertices=0,expectedLights=0;
for(const batch of renderer.batches){const m=model.meshes.find(m=>m.name===batch.name),attrs=vaos.get(batch.vao),indices=buffers.get(attrs.indices),p=buffers.get(attrs[0].id),n=buffers.get(attrs[1].id),uv=buffers.get(attrs[2].id),li=buffers.get(attrs[8].id),lightMap=new Map();
 assert.equal(indices.length,m.p.length/3);oldVertices+=indices.length;newVertices+=p.length/3;
 // Numeric equality deliberately treats signed zero as the same geometric coordinate.
 for(let i=0;i<indices.length;i++){const idx=indices[i];for(let k=0;k<3;k++){assert.ok(p[idx*3+k]===Math.fround(m.p[i*3+k]),'position mismatch');assert.ok(n[idx*3+k]===Math.fround(m.n[i*3+k]),'normal mismatch');}for(let k=0;k<2;k++)assert.ok(uv[idx*2+k]===Math.fround(m.u[i*2+k]),'UV mismatch');
 const key=[...m.p.slice(i*3,i*3+3),...m.n.slice(i*3,i*3+3)].map(Math.fround).join(',');if(!lightMap.has(key))lightMap.set(key,lightMap.size);assert.equal(li[idx],lightMap.get(key));}
 assert.equal(batch.lightOffset,expectedLights);assert.equal(batch.lightStride,lightMap.size);expectedLights+=lightMap.size*m.instances.length;
}
check('Every indexed triangle preserves original positions, normals and UVs',true);
check('Every light index maps to the baked vertex in exactly the same order',expectedLights===3378240,expectedLights);
check('Geometry is not simplified to improve rendering cost',model.stats.triangles===renderer.batches.reduce((n,b)=>n+b.count*b.instances/3,0));
check('Index buffers reduce uploaded vertex data',newVertices<oldVertices,{oldVertices,newVertices,ratio:newVertices/oldVertices});
check('Privacy APIs absent',!fs.readFileSync(dir+'app.js','utf8').match(/navigator\.geolocation|sendBeacon|google-analytics|gtag\(/));
const report={ok:true,revision:model.revision,checks,stats:model.stats,sourceHash:crypto.createHash('sha256').update(fs.readFileSync(dir+'scene.js')).digest('hex')};fs.mkdirSync('quality-test-artifacts',{recursive:true});fs.writeFileSync('quality-test-artifacts/geometry-integrity.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
