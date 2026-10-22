'use strict';
// Same Float32 geometry, independently decodable/uploadable parts. No LOD.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const MAX_BYTES=2*1024*1024, PAYLOAD_LIMIT=MAX_BYTES-65536;
module.exports=function packMobile(model,site,sourceModelHash){
 const dir=path.join(site,'mobile');fs.mkdirSync(dir,{recursive:true});
 const chunks=[];let pieces=[],meshes=[],offset=0,triangles=0,instances=0,sourceMeshes=0,batches=0,vertices=0;
 const append=a=>{const b=Buffer.from(a.buffer,a.byteOffset,a.byteLength),at=offset;pieces.push(b);offset+=b.length;return at;};
 const flush=()=>{
  if(!meshes.length)return;
  const meta=Buffer.from(JSON.stringify({meshes,sourceModelHash})),header=Buffer.alloc(16+((meta.length+3)&~3));
  header.write('KMP2');header.writeUInt32LE(meta.length,4);header.writeUInt32LE(offset,8);meta.copy(header,16);
  const packed=Buffer.concat([header,...pieces]);if(packed.length>MAX_BYTES)throw Error('Mobile part exceeds 2 MiB');
  const sha256=hash(packed),compressed=zlib.gzipSync(packed,{level:9}),file=sha256.slice(0,24)+'.bin.gz';
  fs.writeFileSync(path.join(dir,file),compressed);
  chunks.push({url:'./mobile/'+file,bytes:packed.length,compressedBytes:compressed.length,sha256});
  pieces=[];meshes=[];offset=0;
 };
 for(const m of model.meshes){
  if(!m.instances.length||!m.p.length)continue;
  const instanceData=new Float32Array(m.instances.length*15);
  m.instances.forEach((i,k)=>instanceData.set([...i.p,...i.s,...i.q,...i.c,i.mat,i.ambient??1],k*15));
  if(instanceData.byteLength+108>PAYLOAD_LIMIT)throw Error('Instance group exceeds mobile part budget: '+m.name);
  let map=new Map(),p=[],n=[],index=[],start=0;
  const finish=()=>{
   if(!index.length)return;
   const positions=new Float32Array(p),normals=new Float32Array(n),indices=new Uint32Array(index);
   // Check every expanded GPU input; splitting must not change order/winding.
   for(let v=0;v<index.length;v++)for(const [a,b]of[[m.p,positions],[m.n,normals]])for(let k=0;k<3;k++){
    if(Math.fround(a[(start+v)*3+k])!==b[index[v]*3+k])throw Error('Mobile geometry differs: '+m.name);
   }
   const size=positions.byteLength+normals.byteLength+indices.byteLength+instanceData.byteLength;
   if(offset+size>PAYLOAD_LIMIT)flush();
   meshes.push({name:m.name,vertices:p.length/3,count:index.length,instanceCount:m.instances.length,
    offsets:[append(positions),append(normals),append(indices),append(instanceData)]});
   batches++;vertices+=p.length/3;start+=index.length;map=new Map();p=[];n=[];index=[];
  };
  for(let t=0;t<m.p.length/3;t+=3){
   // Reserve three new vertices before adding a whole triangle.
   if(index.length&&p.length*8+index.length*4+instanceData.byteLength+108>PAYLOAD_LIMIT)finish();
   for(let v=t;v<t+3;v++){
    const values=[m.p[v*3],m.p[v*3+1],m.p[v*3+2],m.n[v*3],m.n[v*3+1],m.n[v*3+2]].map(Math.fround);
    const key=values.join(',');let i=map.get(key);
    if(i===undefined){i=p.length/3;map.set(key,i);p.push(...values.slice(0,3));n.push(...values.slice(3));}index.push(i);
   }
  }
  finish();triangles+=m.p.length/9*m.instances.length;instances+=m.instances.length;sourceMeshes++;
 }
 flush();
 const bytes=chunks.reduce((s,c)=>s+c.bytes,0),compressedBytes=chunks.reduce((s,c)=>s+c.compressedBytes,0);
 if(bytes>100*1024*1024)throw Error('Mobile total geometry exceeds 100 MiB budget');
 const {meshes:ignored,...metadata}=model;
 const manifest=Buffer.from(JSON.stringify({...metadata,meshes:[],mobilePacked:true,sourceModelHash,mobileChunks:chunks,
  stats:{...metadata.stats,triangles,instances,drawCalls:batches,uploadedUniqueVertices:vertices}}));
 if(manifest.length>MAX_BYTES)throw Error('Mobile manifest exceeds 2 MiB budget');
 const sha256=hash(manifest),file=sha256.slice(0,24)+'.json';fs.writeFileSync(path.join(dir,file),manifest);
 const info={url:'./mobile/'+file,manifestBytes:manifest.length,sha256,revision:model.revision,sourceModelHash,bytes,compressedBytes,
  maxChunkBytes:Math.max(...chunks.map(c=>c.bytes)),maxCompressedChunkBytes:Math.max(...chunks.map(c=>c.compressedBytes)),chunkCount:chunks.length,triangles,instances,meshes:sourceMeshes,batches,
  geometry:'identical Float32 positions, normals, triangle order/winding and instance transforms; no LOD; unused UV omitted'};
 console.log('MOBILE_PACK_VALIDATED',JSON.stringify(info));return info;
};
