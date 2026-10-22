'use strict';
// Compile the SAME Float32 render geometry on the build machine, never on iOS.
// No simplification: indexed vertices retain positions, normals and winding.
// The current shader uses world-space materials, not UVs (guarded in build.cjs).
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
module.exports=function packMobile(model,site,sourceModelHash){
 const pieces=[],meshes=[];let offset=0,triangles=0,instances=0;
 const append=a=>{const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength),at=offset;pieces.push(b);offset+=b.length;return at;};
 for(const m of model.meshes){
  if(!m.instances.length||!m.p.length)continue;
  const map=new Map(),p=[],n=[],index=new Uint32Array(m.p.length/3);
  for(let v=0;v<index.length;v++){
   const values=[m.p[v*3],m.p[v*3+1],m.p[v*3+2],m.n[v*3],m.n[v*3+1],m.n[v*3+2]].map(Math.fround);
   const key=values.join(',');let i=map.get(key);
   if(i===undefined){i=p.length/3;map.set(key,i);p.push(...values.slice(0,3));n.push(...values.slice(3,6));}index[v]=i;
  }
  const positions=new Float32Array(p),normals=new Float32Array(n),instanceData=new Float32Array(m.instances.length*15);
  m.instances.forEach((i,k)=>instanceData.set([...i.p,...i.s,...i.q,...i.c,i.mat,i.ambient??1],k*15));
  // Check every reconstructed attribute against the original GPU input.
  for(let v=0;v<index.length;v++)for(const [a,b,stride]of[[m.p,positions,3],[m.n,normals,3]])for(let k=0;k<stride;k++){
   if(Math.fround(a[v*stride+k])!==b[index[v]*stride+k])throw Error('Mobile geometry differs: '+m.name);
  }
  meshes.push({name:m.name,prepacked:true,vertices:p.length/3,count:index.length,instanceCount:m.instances.length,
   offsets:[append(positions),append(normals),append(index),append(instanceData)]});
  triangles+=index.length/3*m.instances.length;instances+=m.instances.length;
 }
 const {meshes:ignored,...metadata}=model;
 const meta=Buffer.from(JSON.stringify({...metadata,meshes,mobilePacked:true,sourceModelHash}));
 const padded=(meta.length+3)&~3,header=Buffer.alloc(16+padded);header.write('KMP1');header.writeUInt32LE(meta.length,4);header.writeUInt32LE(offset,8);meta.copy(header,16);
 const bytes=header.length+offset;
 // A project budget, NOT a universal Safari memory limit. Fail builds that regress.
 if(bytes>96*1024*1024)throw Error('Mobile packed geometry exceeds 96 MiB budget: '+bytes);
 const packed=Buffer.concat([header,...pieces]),compressed=zlib.gzipSync(packed,{level:9}),digest=hash(packed),file=digest.slice(0,24)+'.bin.gz';
 fs.mkdirSync(path.join(site,'mobile'),{recursive:true});fs.writeFileSync(path.join(site,'mobile',file),compressed);
 const info={url:'./mobile/'+file,bytes,compressedBytes:compressed.length,sha256:digest,revision:model.revision,sourceModelHash,
  triangles,instances,meshes:meshes.length,geometry:'identical Float32 positions, normals, winding and instance transforms; no LOD; unused UV attribute omitted'};
 console.log('MOBILE_PACK_VALIDATED',JSON.stringify(info));return info;
};
