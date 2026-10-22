'use strict';
// Run the production renderer on a tiny deterministic scene. Read the resolved
// colour target, before AO/defocus, to verify actual alpha compositing in both GLs.
module.exports=async function townCompositing(page){
 return page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;left:-1000px;width:64px;height:64px';document.body.append(canvas);
  const scene=new SceneModel();
  for(const [name,z,color,opacity]of[['background',-2,'#b24928',0],['front',0,'#aaaaaa',.64],['rear',-1,'#4466bb',.64],['occluder',1,'#2574ac',0]]){
   const m=scene.add(new MeshData(name));m.quad([-2,-2,0],[2,-2,0],[2,2,0],[-2,2,0],[0,0,1]);
   scene.instance(m,[0,0,z],[1,1,1],color);m.instances[0].townOpacity=opacity;
  }
  const light=new ArrayBuffer(8+16*4),v=new DataView(light);v.setUint32(0,0x4b564c31);v.setUint32(4,16,true);
  const bytes=new Uint8Array(light);for(let i=8;i<bytes.length;i+=4)bytes.set([170,170,170,255],i);
  const r=new Renderer(canvas,scene,{dpr:1,bakedLighting:light}),g=r.gl,camera={target:[0,0,0],span:6,yaw:0,pitch:0};
  const pixel=()=>{r.render(camera,0);g.bindFramebuffer(g.FRAMEBUFFER,r.fb);g.readBuffer(g.COLOR_ATTACHMENT0);const p=new Uint8Array(4);g.readPixels(32,32,1,1,g.RGBA,g.UNSIGNED_BYTE,p);g.bindFramebuffer(g.FRAMEBUFFER,null);return Array.from(p).slice(0,3);};
  const select=names=>{for(const b of r.batches){b.hasTown=['front','rear'].includes(b.name)&&names.includes(b.name);b.hasOpaque=['background','occluder'].includes(b.name)&&names.includes(b.name);}};
  select(['background']);const background=pixel();
  select(['background','front']);const front=pixel();
  select(['background','front','rear']);const layered=pixel();
  r.batches.reverse();const reversed=pixel();r.batches.reverse();
  select(['occluder']);const opaque=pixel();
  select(['background','front','rear','occluder']);const occluded=pixel();
  scene.meshes[1].instances[0].townOpacity=1;r.upload();select(['background','front']);const solid=pixel();
  const expected=solid.map((v,i)=>v*.64+background[i]*.36);
  const maxDelta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
  const result={background,front,layered,reversed,opaque,occluded,solid,expected,
   alphaError:maxDelta(front,expected),rearError:maxDelta(front,layered),orderError:maxDelta(layered,reversed),occlusionError:maxDelta(opaque,occluded),
   gl:g.getError(),baked:r.bakedEnabled,msaa:r.msSamples};
  g.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();return result;
 });
};
