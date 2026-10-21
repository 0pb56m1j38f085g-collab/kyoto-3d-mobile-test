'use strict';
// Quality finish on actual geometry: indexed vertices, native MSAA, and soft studio fill.
// No billboards, generated reference images, or model simplification.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports=function(site){
 const assets={};for(const n of ['src/renderer.js','src/app.js','index.html'])assets[n]=fs.readFileSync(path.join(site,n),'utf8');
 function edit(n,a,b){if(assets[n].split(a).length!==2)throw Error('Unexpected presentation input: '+n+' '+a.slice(0,60));assets[n]=assets[n].replace(a,b);}
 edit('src/renderer.js','indirectLight*1.12+sky*.045','indirectLight*1.18+sky*.095');
 edit('src/renderer.js','vec3 v=normalize(eye-wPosition),h=normalize(lightDirection+v);',`// Fixed, broad frontal fill lets the veranda read without flattening baked contact shadows.
 if(material>.5&&material<1.5){float fill=max(dot(n,normalize(vec3(.15,.30,1.))),0.);lit+=base*vec3(.19,.17,.14)*fill;}
 vec3 v=normalize(eye-wPosition),h=normalize(lightDirection+v);`);
 edit('src/renderer.js','n=fineSurface(n,.0009*course*aa);','n=fineSurface(n,.00055*course*aa);');
 const start=assets['src/renderer.js'].indexOf(' upload(){'),end=assets['src/renderer.js'].indexOf(' setBakedLighting(buffer)');
 if(start<0||end<=start)throw Error('Missing geometry upload implementation');
 const upload=` upload(){const g=this.gl;this.batches=[];let lightOffset=0,totalVertices=0;
 for(const m of this.scene.meshes){if(!m.instances.length||!m.p.length)continue;
  const lights=new Map(),vertexMap=new Map(),positions=[],normals=[],uvs=[],lightIds=[],elements=[];
  for(let vi=0;vi<m.p.length/3;vi++){
   const p=m.p.slice(vi*3,vi*3+3),n=m.n.slice(vi*3,vi*3+3),uv=m.u.slice(vi*2,vi*2+2);
   const lightKey=[...p,...n].map(Math.fround).join(',');if(!lights.has(lightKey))lights.set(lightKey,lights.size);
   const li=lights.get(lightKey),key=li+','+uv.map(Math.fround).join(',');
   if(!vertexMap.has(key)){vertexMap.set(key,positions.length/3);positions.push(...p);normals.push(...n);uvs.push(...uv);lightIds.push(li);}elements.push(vertexMap.get(key));
  }
  const vao=g.createVertexArray();g.bindVertexArray(vao);
  for(const[loc,size,a]of[[0,3,positions],[1,3,normals],[2,2,uvs],[8,1,lightIds]]){const buf=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buf);g.bufferData(g.ARRAY_BUFFER,new Float32Array(a),g.STATIC_DRAW);g.enableVertexAttribArray(loc);g.vertexAttribPointer(loc,size,g.FLOAT,false,0,0);}
  const is32=positions.length/3>65535,indexType=is32?g.UNSIGNED_INT:g.UNSIGNED_SHORT,index=g.createBuffer();g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,index);g.bufferData(g.ELEMENT_ARRAY_BUFFER,is32?new Uint32Array(elements):new Uint16Array(elements),g.STATIC_DRAW);
  const ins=new Float32Array(m.instances.length*15);m.instances.forEach((i,k)=>ins.set([...i.p,...i.s,...i.q,...i.c,i.mat,i.ambient??1],k*15));const ib=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,ib);g.bufferData(g.ARRAY_BUFFER,ins,g.STATIC_DRAW);
  for(const[l,size,offset]of[[3,3,0],[4,3,3],[5,4,6],[6,4,10],[7,1,14]]){g.enableVertexAttribArray(l);g.vertexAttribPointer(l,size,g.FLOAT,false,60,offset*4);g.vertexAttribDivisor(l,1);}
  this.batches.push({vao,count:elements.length,indexType,instances:m.instances.length,name:m.name,lightOffset,lightStride:lights.size,vertices:positions.length/3});lightOffset+=lights.size*m.instances.length;totalVertices+=positions.length/3;
 }
 g.bindVertexArray(null);this.lightSampleCount=lightOffset;this.uploadedUniqueVertices=totalVertices;
 this.scene.stats={...this.scene.stats,triangles:this.batches.reduce((s,b)=>s+b.count*b.instances/3,0),instances:this.batches.reduce((s,b)=>s+b.instances,0),drawCalls:this.batches.length,uploadedUniqueVertices:totalVertices};}
`;
 assets['src/renderer.js']=assets['src/renderer.js'].slice(0,start)+upload+assets['src/renderer.js'].slice(end);
 edit('src/renderer.js','g.drawArraysInstanced(g.TRIANGLES,0,b.count,b.instances);','g.drawElementsInstanced(g.TRIANGLES,b.count,b.indexType,0,b.instances);');
 // The app draws into an offscreen MRT, so canvas antialias alone is insufficient.
 edit('src/renderer.js','g.drawBuffers([g.COLOR_ATTACHMENT0]);g.bindFramebuffer(g.FRAMEBUFFER,null);}',`g.drawBuffers([g.COLOR_ATTACHMENT0]);
 this.msFB=null;this.msSamples=Math.min(g.getParameter(g.MAX_SAMPLES),w*h>1400000?2:4);
 if(this.msSamples>1){const ms=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,ms);
  for(const[point,format]of[[g.COLOR_ATTACHMENT0,g.RGBA8],[g.COLOR_ATTACHMENT1,g.RGBA8],[g.DEPTH_ATTACHMENT,g.DEPTH_COMPONENT24]]){const rb=g.createRenderbuffer();this.msBuffers.push(rb);g.bindRenderbuffer(g.RENDERBUFFER,rb);g.renderbufferStorageMultisample(g.RENDERBUFFER,this.msSamples,format,w,h);g.framebufferRenderbuffer(g.FRAMEBUFFER,point,g.RENDERBUFFER,rb);}
  g.drawBuffers([g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);if(g.checkFramebufferStatus(g.FRAMEBUFFER)===g.FRAMEBUFFER_COMPLETE)this.msFB=ms;else{g.deleteFramebuffer(ms);for(const rb of this.msBuffers)g.deleteRenderbuffer(rb);this.msBuffers=[];this.msSamples=1;}
 }
 g.bindRenderbuffer(g.RENDERBUFFER,null);g.bindFramebuffer(g.FRAMEBUFFER,null);}`);
 edit('src/renderer.js','g.bindFramebuffer(g.FRAMEBUFFER,this.fb);g.viewport(0,0,this.w,this.h);','g.bindFramebuffer(g.FRAMEBUFFER,this.msFB||this.fb);g.viewport(0,0,this.w,this.h);');
 edit('src/renderer.js','g.bindFramebuffer(g.FRAMEBUFFER,this.aoFB);g.disable(g.DEPTH_TEST);',`if(this.msFB){g.bindFramebuffer(g.READ_FRAMEBUFFER,this.msFB);g.bindFramebuffer(g.DRAW_FRAMEBUFFER,this.fb);
 g.readBuffer(g.COLOR_ATTACHMENT0);g.drawBuffers([g.COLOR_ATTACHMENT0]);g.blitFramebuffer(0,0,this.w,this.h,0,0,this.w,this.h,g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT,g.NEAREST);
 g.readBuffer(g.COLOR_ATTACHMENT1);g.drawBuffers([g.NONE,g.COLOR_ATTACHMENT1]);g.blitFramebuffer(0,0,this.w,this.h,0,0,this.w,this.h,g.COLOR_BUFFER_BIT,g.NEAREST);g.drawBuffers([g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);}
 g.bindFramebuffer(g.FRAMEBUFFER,this.aoFB);g.disable(g.DEPTH_TEST);`);
 // A portrait camera retains the entire roof while wasting less screen width.
 edit('src/app.js','p.span*=.84/aspect','p.span*=.78/aspect');
 assets['src/app.js']=assets['src/app.js'].replaceAll('quality-v5.1','quality-v5.3');
 assets['index.html']=assets['index.html'].replaceAll('quality-v5.2','quality-v5.3');
 const output={};for(const[n,s]of Object.entries(assets)){fs.writeFileSync(path.join(site,n),s);output[n]=sha(s);}return output;
};
