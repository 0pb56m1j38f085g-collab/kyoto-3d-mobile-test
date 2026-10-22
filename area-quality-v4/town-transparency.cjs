'use strict';
// Illustrative transparency: one nearest architectural surface per sample.
// Draw opaque scenery, select the nearest town depth/normal, then blend once.
// Rear walls/lattice do not accumulate; order is stable without float targets
// or additional full-size textures. The same MSAA path is used on all devices.
module.exports=({renderer,app,html})=>{
 const replace=(a,b)=>{if(renderer.split(a).length!==2)throw Error('Town renderer anchor: '+a.slice(0,90));renderer=renderer.replace(a,b);};
 replace('layout(location=8) in float aLightIndex;', 'layout(location=8) in float aLightIndex;layout(location=9) in float iTownOpacity;');
 replace('out vec3 wPosition;', 'flat out float townOpacity;out vec3 wPosition;');
 replace('void main(){wPosition=', 'void main(){townOpacity=iTownOpacity;wPosition=');
 replace('in vec3 wPosition;', 'flat in float townOpacity;uniform float townPass;in vec3 wPosition;');
 replace('void main(){vec3 n=normalize(wNormal);', 'void main(){bool town=townOpacity>0.;if((townPass<.5&&town)||(townPass>.5&&!town))discard;vec3 n=normalize(wNormal);');
 replace('outColor=vec4(display,1.);outNormal=vec4(n*.5+.5,1.);', 'if(town){float gray=dot(display,vec3(.2126,.7152,.0722));display=mix(display,vec3(gray),.82);display=mix(display,vec3(.79,.80,.80),.12);}outColor=vec4(display,town?townOpacity:1.);outNormal=vec4(n*.5+.5,town?.2:1.);');
 // Transparent architecture must not cast solid screen-space AO on neighbours.
 replace('float d=texture(depthMap,q.xy).r;vec3 surface=', 'if(texture(normalMap,q.xy).a<.3)continue;float d=texture(depthMap,q.xy).r;vec3 surface=');
 replace('  this.batches.push({vao,buffers,', `  const opacity=g.createBuffer();buffers.push(opacity);g.bindBuffer(g.ARRAY_BUFFER,opacity);g.bufferData(g.ARRAY_BUFFER,m.townOpacity,g.STATIC_DRAW);g.enableVertexAttribArray(9);g.vertexAttribPointer(9,1,g.FLOAT,false,0,0);g.vertexAttribDivisor(9,1);
  const townCount=m.townOpacity.reduce((n,a)=>n+(a>0),0);
  this.batches.push({hasTown:townCount>0,hasOpaque:townCount<m.instanceCount,vao,buffers,`);
 replace('  this.batches.push({vao,count:elements.length,', `  const opacity=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,opacity);g.bufferData(g.ARRAY_BUFFER,new Float32Array(m.instances.map(i=>i.townOpacity||0)),g.STATIC_DRAW);g.enableVertexAttribArray(9);g.vertexAttribPointer(9,1,g.FLOAT,false,0,0);g.vertexAttribDivisor(9,1);
  this.batches.push({hasTown:m.instances.some(i=>i.townOpacity>0),hasOpaque:m.instances.some(i=>!i.townOpacity),vao,count:elements.length,`);
 replace('drawBatches(shadows=false){const g=this.gl;for(const b of this.batches){', `drawBatches(shadows=false,town=false){const g=this.gl;if(!shadows)this.uni(this.program,'townPass',town?1:0);for(const b of this.batches){if(!shadows&&!(town?b.hasTown:b.hasOpaque))continue;`);
 replace('g.enable(g.DEPTH_TEST);g.disable(g.CULL_FACE);g.disable(g.BLEND);', 'g.enable(g.DEPTH_TEST);g.depthMask(true);g.depthFunc(g.LESS);g.disable(g.CULL_FACE);g.disable(g.BLEND);');
 replace('this.drawBatches();\n if(this.msFB)', `this.drawBatches();
 // Keep original instance order: gl_InstanceID indexes the baked-light sample.
 // Mixed person/house meshes are filtered per instance in the fragment shader.
 g.drawBuffers([g.NONE,g.COLOR_ATTACHMENT1]);this.drawBatches(false,true);
 g.drawBuffers([g.COLOR_ATTACHMENT0,g.NONE]);g.depthMask(false);g.depthFunc(g.EQUAL);
 g.enable(g.BLEND);g.blendFuncSeparate(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA,g.ZERO,g.ONE);
 this.drawBatches(false,true);
 g.disable(g.BLEND);g.depthMask(true);g.depthFunc(g.LESS);g.drawBuffers([g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);
 if(this.msFB)`);
 return {renderer,app,html};
};
