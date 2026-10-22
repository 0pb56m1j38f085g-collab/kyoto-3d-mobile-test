'use strict';
// v4.22: one visual quality path on every device, with bounded model transport.
module.exports=({renderer,app,html})=>{
 const exact=(s,a,b)=>{if(!s.includes(a))throw Error('Concept viewer input missing: '+a.slice(0,110));return s.replace(a,b);};
 const cameras={
  area:{target:[-8,5,-24],span:50,yaw:-.15,pitch:.62},
  temple:{target:[0,8,0],span:24,yaw:-.62,pitch:.40},
  hokanji:{target:[-15,5,-11],span:10,yaw:-.7,pitch:.48},
  kodaiji:{target:[-10,4,-18],span:16,yaw:-.65,pitch:.55},
  yasaka:{target:[-17,4,-26],span:13,yaw:-.65,pitch:.52},
  street:{target:[-11.4,3.5,-10.1],span:7,yaw:-.45,pitch:.45},
  sannenzaka:{target:[-11,4,-5.6],span:7,yaw:-.45,pitch:.45},
  corner:{target:[0,8,0],span:17,yaw:-.55,pitch:.35},
  reverse:{target:[0,8,0],span:24,yaw:2.7,pitch:.6}
 };
 app=app.replace(/const presets=\{.*?\};/,'const presets='+JSON.stringify(cameras)+';');
 app=app.replace(/const lowMemoryIOS=.*?;window.__lowMemoryIOS=lowMemoryIOS;/,'const isIOS=isLowMemoryIOS();window.__lowMemoryIOS=false;');
 app=app.replace(/const modes=\{.*?\};/,"const modes={standard:{dpr:Math.min(devicePixelRatio||1,1.5),ao:.32,focus:1.4},high:{dpr:Math.min(devicePixelRatio||1,1.8),ao:.34,focus:1.8}};");
 app=app.replace("const names={standard:'標準',high:'高画質',light:'軽量'};","const names={standard:'標準',high:'高画質'};");
 app=exact(app,"quality=lowMemoryIOS?'light':'standard'","quality='standard'");
 app=exact(app,"if(lowMemoryIOS&&value!=='light'){value='light';toast('この端末では軽量表示を使用します。');}",'');
 app=exact(app,"model=lowMemoryIOS?await loadMobileStudy(__MOBILE_ASSET__):makeStudy();","model=await loadMobileStudy(__MOBILE_ASSET__);");
 app=exact(app,"if(lowMemoryIOS){lightingState='iPhone用軽量照明';delete window.__BAKED_LIGHT_BASE64;}else try{","try{");
 app=app.replaceAll('lowMemory:lowMemoryIOS,shadowSize:lowMemoryIOS?1024:3072,','shadowSize:3072,');
 app=app.replaceAll('if(lowMemoryIOS)await uploadMobileStudy','await uploadMobileStudy');
 app=app.replaceAll('if(lowMemoryIOS)settlePending=true;','if(isIOS)settlePending=true;');
 app=app.replaceAll('(!lowMemoryIOS||!settlePending)','(!isIOS||!settlePending)');
 app=app.replaceAll("if(params.has('quality')&&!lowMemoryIOS)","if(params.has('quality'))");
 app=app.replace(/ if\(quality==='standard'&&!autoLowered[\s\S]*?lastAdaptiveFrame=renderer.frames;\}/,'');
 if(/\blowMemoryIOS\b/.test(app))throw Error('Unexpected remaining iOS quality override');
 renderer=exact(renderer,'this.lightSampleCount=0;this.uploadedUniqueVertices=0;return;','this.lightSampleCount=this.scene.lightSampleCount;this.uploadedUniqueVertices=0;return;');
 renderer=exact(renderer,'[[0,3,m.p],[1,3,m.n]]','[[0,3,m.p],[1,3,m.n],[8,1,m.lightIds]]');
 renderer=exact(renderer,'  g.disableVertexAttribArray(8);g.vertexAttrib1f(8,0);','');
 renderer=exact(renderer,'name:m.name,lightOffset:0,lightStride:0,vertices:m.vertices','name:m.name,lightOffset:m.lightOffset,lightStride:m.lightStride,vertices:m.vertices');
 // Packed models carry the same baker indices and lighting on iPhone and desktop.
 html=exact(html,"if(!isLowMemoryIOS())await script('src/scene.js?v=area-higashiyama-quality-v4.22');",'');
 html=html.replace('<option value="light">軽量</option>','');
 html=html.replaceAll('iPhoneでは軽量表示を使用します。','iPhoneも他の端末と同じ照明・素材で表示します。');
 html=html.replaceAll('京さんぽ · 東山と祇園','京さんぽ · 東山・祇園・山科');
 html=html.replaceAll('KYOTO · A LITTLE JOURNEY','KYOTO · HIGASHIYAMA');
 html=html.replace('初期表示は北側から南を見る向きです（画面上が南、右が西）。','初期表示は南南西側から北北東を見る向きです（北は少し左上、東は右上）。清水寺の舞台と二寧坂の町並みを中心にしています。');
 html=html.replace('画面上：南 · 右：西','画面上：北 · 右：東');
 html=html.replace('名所をタップで拡大 · 1本指で回転','名所をタップで拡大 · 2本指で移動');
 app=app.replace(/const mapSpots=\[.*?\];/,"const mapSpots=[{id:'temple',name:'清水寺'},{id:'hokanji',name:'八坂の塔'},{id:'kodaiji',name:'高台寺'},{id:'yasaka',name:'八坂神社'},{id:'street',name:'二寧坂'},{id:'sannenzaka',name:'産寧坂'}];");
 // Do not move named features to make a composition. Camera framing omits the
 // distant Kamo boundary; the river remains at its real west-side position.
 app=exact(app,'const top=h<500?90:128,bottom=h-42,left=18,right=w-18;','const top=h<500?76:108,bottom=h*.74,left=16,right=w-16;');
 // A displaced badge must keep an explicit leader to the real scene anchor.
 // Prefer suppressing a secondary lane badge to moving it into unrelated sky.
 app=exact(app,'if(show){for(let n=0;n<4&&occupied.some(o=>Math.abs(o.x-x)<half+o.half+7&&Math.abs(o.y-y)<43);n++)y-=44;show=y>92;}',`if(show){
    const clashes=yy=>occupied.some(o=>Math.abs(o.x-x)<half+o.half+5&&Math.abs(o.y-yy)<42);
    const choices=[rawY,rawY-44,rawY+44,rawY-88].filter(yy=>yy>115&&yy<h-55&&!clashes(yy));
    if(choices.length)y=choices[0];else if(s.id==='street'||s.id==='sannenzaka')show=false;
   }
   if(!s.line){s.line=document.createElement('span');s.line.className='pin-leader';s.line.dataset.view=s.id;spotLayer.prepend(s.line);}
   const displaced=Math.hypot(x-rawX,y-rawY)>12;
   s.line.hidden=!show||!displaced;s.line.style.left=rawX+'px';s.line.style.top=rawY+'px';
   s.line.style.width=Math.hypot(x-rawX,y-rawY)+'px';s.line.style.transform='rotate('+Math.atan2(y-rawY,x-rawX)+'rad)';
   s.el.dataset.anchorX=String(rawX);s.el.dataset.anchorY=String(rawY);s.el.dataset.labelX=String(x);s.el.dataset.labelY=String(y);`);
 app=exact(app,'function pan(dx,dy){const s=camera.span/canvas.clientHeight;', 'function pan(dx,dy){const s=camera.span/canvas.clientHeight;');
 app=exact(app,'camera.target[1]+=dy*s;','camera.target[0]+=dy*s*Math.sin(camera.yaw)/Math.max(.35,Math.sin(camera.pitch));camera.target[2]+=dy*s*Math.cos(camera.yaw)/Math.max(.35,Math.sin(camera.pitch));');
 // Quiet framing; the historic lanes and theatre of the stage get the screen.
 html=html.replace('</style>',`\n/* Approved east-area composition: scene first, no lower navigation panel. */
 header .brand{padding:9px 12px}header .brand h1{font-size:13px}header .brand .eyebrow{display:none}#orientation{top:91px;font-size:10px}#compass{top:84px}
 .map-spot{font-size:10px;min-height:28px;padding:6px 9px 6px 25px}.map-spot[data-view=temple]{font-size:12px}
 .map-spot[data-view=street],.map-spot[data-view=sannenzaka]{font-size:10px;background:#fff6ecf2}
 .pin-leader{position:absolute;height:1px;background:#af7f80;transform-origin:left center;pointer-events:none;box-shadow:0 0 1px #fff}.pin-leader::before{content:'';position:absolute;left:-2px;top:-2px;width:5px;height:5px;background:#fff6ee;border:1px solid #b88f88;border-radius:50%}
 .side{right:11px;bottom:calc(48px + env(safe-area-inset-bottom))}.hint{bottom:48px}.map-note{font-size:9px}
 </style>`);
 // Atmospheric haze uses the reflected north coordinate and leaves the foreground crisp.
 renderer=exact(renderer,'smoothstep(35.,90.,length(wPosition.xz-vec2(-16.,22.)))* .32','smoothstep(48.,110.,length(wPosition.xz-vec2(-10.,-18.)))* .12');
 renderer=exact(renderer,'indirectLight*1.20+sky*.125','indirectLight*1.06+sky*.09');
 renderer=exact(renderer,'vec3(1.0,.94,.88)*1.96','vec3(1.0,.91,.79)*2.08');
 return {renderer,app,html};
};
