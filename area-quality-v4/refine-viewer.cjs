'use strict';
module.exports=({renderer,app,html})=>{
 const replace=(s,a,b,label)=>{if(!s.includes(a))throw Error('Missing v4.20 input: '+label);return s.replace(a,b);};
 // Bound the total iOS drawing area, while avoiding the visibly blurred 0.62x phone canvas.
 app=replace(app,"lowMemoryIOS?.62:.85","lowMemoryIOS?Math.min(.9,Math.sqrt(420000/Math.max(1,innerWidth*innerHeight))):.85",'bounded iOS resolution');
 // A real overview camera with an axis that fits the long district on a portrait display.
 app=replace(app,'area:{target:[-5,5.7,18],span:42,yaw:.58,pitch:.48}',
 'area:{target:[-18,3,29],span:58,yaw:-.58,pitch:.65}', 'area camera');
 app=app.replace("const portraitScale=name==='area'?.42:","const portraitScale=name==='area'?.58:");
 app=app.replace("yasaka:{target:[-29.1,4.7,44.6],span:12.8,yaw:1.85,pitch:.38}","yasaka:{target:[-29.4,2.55,46.8],span:7.8,yaw:2.82,pitch:.72}");
 app=app.replace("hokanji:{target:[-26.2,5.2,16.6],span:12.5,yaw:.58,pitch:.39}","hokanji:{target:[-26.22,3.0,19.65],span:5.8,yaw:2.15,pitch:.54}");
 app=app.replace("street:{target:[-20.3,4.0,22.0],span:12.8,yaw:.78,pitch:.37}","street:{target:[-39.7,2.45,32.8],span:6.2,yaw:-.18,pitch:.66}");
 app=replace(app,"temple:{target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37}","temple:{target:[0,3.05,-.9],span:4.2,yaw:2.7,pitch:.48}",'normalized temple camera');
 app=app.replace("corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31}","corner:{target:[.3,3.15,-1.25],span:2.6,yaw:2.65,pitch:.31}");
 app=app.replace("reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}","reverse:{target:[0,3.05,-.9],span:4.2,yaw:3.7,pitch:.48}");
 app=app.replaceAll(',10,Math.max(150,80/',',3.6,Math.max(150,80/');
 app=app.replace("else if(e.key==='Home')view('temple')","else if(e.key==='Home')view('area')");
 app=app.replace("$('reset').onclick=()=>{closeModal();view('temple');}","$('reset').onclick=()=>{closeModal();view('area');}");
 app=app.replace("'Kiyomizu quality v5'","'東山・祇園 v4.20'");
 app=replace(app,"camera=authored(params.get('view')||'area');ready=true;", "selected=Object.hasOwn(presets,params.get('view'))?params.get('view'):'area';camera=authored(selected);ready=true;$('quality').value=quality;$('quality-label').textContent=names[quality];document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===selected)));if(renderer.bakedMismatch)lightingState='動的照明（照明データ差異）';",'UI initial state');
 app=app.replace('kodaiji:{target:[-17.7,4.9,28.8],span:11.8,yaw:1.15,pitch:.38}','kodaiji:{target:[-15.0,2.05,32.2],span:12.8,yaw:3.45,pitch:.70}');
 // Never allow a query parameter or settings change to silently remove the iPhone memory guard.
 app=replace(app,"function setQuality(value){if(!modes[value]||!ready)return;", "function setQuality(value){if(!modes[value]||!ready)return;if(lowMemoryIOS&&value!=='light'){value='light';toast('この端末では軽量表示を使用します。');}", 'iOS guard');
 // WebKit can keep the previous canvas image after one on-demand draw, even
 // after two compositor ticks and a one-second wait. One final draw resolves it.
 app=replace(app,'const runtimeErrors=[];', 'const runtimeErrors=[];let settlePending=false;', 'bounded WebKit settling state');
 app=replace(app,'function request(){if(!raf', 'function request(){if(lowMemoryIOS)settlePending=true;if(!raf', 'mark final WebKit draw');
 app=replace(app,'if(keep)request();}', 'if(keep)request();else if(settlePending){settlePending=false;if(!raf)raf=requestAnimationFrame(renderFrame);}}', 'one final draw without an idle loop');
 app=replace(app,'if(!window.__ready){', 'if(!window.__ready&&(!lowMemoryIOS||!settlePending)){', 'ready only after final mobile draw');
 // iOS must never construct the full procedural scene or per-vertex string Maps.
 app=replace(app,'model=makeStudy();',"model=lowMemoryIOS?await loadMobileStudy(__MOBILE_ASSET__):makeStudy();",'precompiled mobile manifest');
 app=app.replaceAll('shadowSize:lowMemoryIOS?1024:3072,','lowMemory:lowMemoryIOS,shadowSize:lowMemoryIOS?1024:3072,');
 app=replace(app,"contextLost=true;if(raf)","contextLost=true;renderer?.mobileAbort?.abort();if(raf)",'cancel upload on context loss');
 app=replace(app,"canvas.addEventListener('webglcontextrestored',()=>{try{", "canvas.addEventListener('webglcontextrestored',async()=>{if(!window.phoneTest||renderer?.mobileAbort){fail('描画の準備が中断されました。再読み込みしてください。');return;}try{$('loading').hidden=false;$('error').hidden=true;window.__ready=false;",'async context restore');
 app=app.replaceAll('renderer.ao=modes[quality].ao;',"if(lowMemoryIOS)await uploadMobileStudy(renderer,model,text=>{$('load-message').textContent=text;});renderer.ao=modes[quality].ao;");
 app=replace(app,'`間接照明: ${lightingState}`','`間接照明: ${lightingState}`,model.mobileMemory?`分割読込: ${model.mobileMemory.uploadedChunks} / ${model.mobileMemory.chunkCount}、作業バッファ最大 ${(model.mobileMemory.maxChunkBytes/1048576).toFixed(2)} MiB、形状のCPU保持なし`:"モデル: 端末内生成"','mobile diagnostics');
 renderer=replace(renderer,"antialias:true,alpha:false","antialias:!options.lowMemory,alpha:false",'iOS default antialias memory');
 renderer=replace(renderer,'this.msSamples=Math.min(g.getParameter(g.MAX_SAMPLES),w*h>1400000?2:4);','this.msSamples=this.options.lowMemory?1:Math.min(g.getParameter(g.MAX_SAMPLES),w*h>1400000?2:4);','iOS multisample memory');
 renderer=replace(renderer,'this.batches=[];let lightOffset=0,totalVertices=0;', 'this.batches=[];if(this.scene.mobilePacked){this.lightSampleCount=0;this.uploadedUniqueVertices=0;return;}let lightOffset=0,totalVertices=0;', 'deferred mobile upload');
 renderer=replace(renderer,' upload(){const g=this.gl;',` discardMobileGeometry(){const g=this.gl;for(const b of this.batches){g.deleteVertexArray(b.vao);for(const buffer of b.buffers||[])g.deleteBuffer(buffer);}this.batches=[];}
 uploadPacked(m){const g=this.gl,vao=g.createVertexArray(),buffers=[];g.bindVertexArray(vao);
  for(const[loc,size,a]of[[0,3,m.p],[1,3,m.n]]){const buffer=g.createBuffer();buffers.push(buffer);g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,a,g.STATIC_DRAW);g.enableVertexAttribArray(loc);g.vertexAttribPointer(loc,size,g.FLOAT,false,0,0);}
  g.disableVertexAttribArray(2);g.vertexAttrib2f(2,0,0);
  g.disableVertexAttribArray(8);g.vertexAttrib1f(8,0);
  const index=g.createBuffer();buffers.push(index);g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,index);g.bufferData(g.ELEMENT_ARRAY_BUFFER,m.index,g.STATIC_DRAW);
  const instances=g.createBuffer();buffers.push(instances);g.bindBuffer(g.ARRAY_BUFFER,instances);g.bufferData(g.ARRAY_BUFFER,m.instanceData,g.STATIC_DRAW);
  for(const[l,size,offset]of[[3,3,0],[4,3,3],[5,4,6],[6,4,10],[7,1,14]]){g.enableVertexAttribArray(l);g.vertexAttribPointer(l,size,g.FLOAT,false,60,offset*4);g.vertexAttribDivisor(l,1);}
  this.batches.push({vao,buffers,count:m.count,indexType:g.UNSIGNED_INT,instances:m.instanceCount,name:m.name,lightOffset:0,lightStride:0,vertices:m.vertices});
 }
 upload(){const g=this.gl;`,'bounded typed array upload');
 // A dynamic boot avoids even fetching/parsing the 3.4 MB procedural scene on iOS.
 html=replace(html,'<script src="src/scene.js?v=area-higashiyama-quality-v4.20"></script><script src="src/app.js?v=area-higashiyama-quality-v4.20"></script>',`<script>
 (async()=>{const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('3Dコードを取得できませんでした。'));document.body.appendChild(s);});
 try{if(!isLowMemoryIOS())await script('src/scene.js?v=area-higashiyama-quality-v4.20');await script('src/app.js?v=area-higashiyama-quality-v4.20');}
 catch(e){window.__error=e.message;document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;document.getElementById('error-message').textContent=e.message;document.getElementById('reload').onclick=()=>location.reload();}})();
 </script>`,'mobile conditional boot');
 // Labels attach to the actual 3D world. Selection is available for every district landmark.
 const a=app.indexOf(' function placeLabel(){'),b=app.indexOf(' function renderFrame',a);
 if(a<0||b<0)throw Error('Label replacement boundary missing');
 app=app.slice(0,a)+` const mapSpots=[{id:'temple',name:'清水寺',p:[0,4.2,-.72]},{id:'hokanji',name:'八坂の塔',p:[-26.2235,4.8,19.6565]},{id:'kodaiji',name:'高台寺',p:[-17.11,3.8,31.86]},{id:'yasaka',name:'八坂神社',p:[-29.36,3.5,47.78]}];
 const spotLayer=document.createElement('div');spotLayer.id='map-spots';$('app').appendChild(spotLayer);
 for(const s of mapSpots){s.el=document.createElement('button');s.el.className='map-spot';s.el.textContent=s.name;s.el.setAttribute('aria-label',s.name+'を近くで見る');s.el.onclick=()=>view(s.id);spotLayer.appendChild(s.el);}
 function placeLabel(){if(!renderer||!camera)return;
  const occupied=[];
  for(const s of mapSpots){const p=M.point(renderer.lastVP,s.p),x=(p[0]*.5+.5)*canvas.clientWidth,y=(.5-p[1]*.5)*canvas.clientHeight;
   let show=!modal&&(selected==='area'||selected===s.id)&&x>42&&x<canvas.clientWidth-42&&y>110&&y<canvas.clientHeight-135&&p[2]>-1&&p[2]<1;
   if(show&&occupied.some(o=>Math.abs(o.x-x)<88&&Math.abs(o.y-y)<35))show=false;
   s.el.hidden=!show;s.el.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-100%)';if(show)occupied.push({x,y});
  }
  $('landmark').classList.remove('shown');
 }
`+app.slice(b);
 // The inherited fog was centered on Kiyomizu and washed out every northern landmark.
 // Focus must follow the current district camera, not the old Kiyomizu study.
 // Keep broad overviews readable instead of blurring the entire northern city.
 renderer=replace(renderer,"camera.focus||[1.5,6.1,-1.4]","camera.focus||camera.target",'camera-relative focal plane');
 renderer=replace(renderer,"this.focusEffect??2.5","(this.focusEffect??2.5)*Math.min(1,18/Math.max(1,camera.span))",'bounded overview defocus');
 renderer=replace(renderer,'smoothstep(18.,64.,length(wPosition.xz))* .62','smoothstep(35.,90.,length(wPosition.xz-vec2(-16.,22.)))* .32','district fog origin');
 renderer=replace(renderer,'render(camera,time=0){this.resize();',`render(camera,time=0){this.resize();if(!this.bakedEnabled){const key=[...camera.target,camera.span].map(v=>Math.round(v*20)).join(',');if(key!==this.shadowCameraKey){this.shadowCameraKey=key;const span=Math.min(55,Math.max(3.5,camera.span*.72)),at=camera.target;this.lightVP=M.mul(M.ortho(-span,span,-span,span,1,180),M.look(V.add(at,V.mul(this.light,95)),at));this.shadowDirty=true;}}`,'view-centered dynamic shadows');
 // Previously mismatched baked data left a one-pixel shadow map, making fallback falsely dark.
 renderer=replace(renderer,'this.bakedEnabled=false;return false;',`this.bakedEnabled=false;this.ensureDynamicShadow();return false;`,'real dynamic fallback');
 renderer=replace(renderer,' setBakedLighting(buffer){',` ensureDynamicShadow(){const g=this.gl;const size=Math.min(this.options.shadowSize||2048,g.getParameter(g.MAX_TEXTURE_SIZE));if(this.shadowSize===size)return;g.deleteTexture(this.shadowTex);this.shadowSize=size;this.shadowTex=this.texture(g.DEPTH_COMPONENT24,g.DEPTH_COMPONENT,g.UNSIGNED_INT,size,size);g.bindFramebuffer(g.FRAMEBUFFER,this.shadowFB);g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,this.shadowTex,0);g.bindFramebuffer(g.FRAMEBUFFER,null);this.shadowDirty=true;}
 setBakedLighting(buffer){`,'fallback shadow allocation');
 // Dynamic shadow volume must cover Yasaka and western Gion as well as Kiyomizu.
 renderer=replace(renderer,"this.lightVP=M.mul(M.ortho(-30,30,-28,32,1,150),M.look(V.mul(this.light,76),[0,5,0]));", "this.lightVP=M.mul(M.ortho(-52,52,-45,45,1,180),M.look(V.add([-16,5,22],V.mul(this.light,95)),[-16,5,22]));",'district shadow volume');
 html=html.replaceAll('清水寺のミニチュア','東山・祇園のミニチュア').replaceAll('KYOTO / 3D DEVICE TEST 01','KYOTO · HIGASHIYAMA / GION').replaceAll('東山・祇園 · エリア品質 v4','町並みと、寺社をめぐる');
 html=html.replace('</nav><div class="subrow">','<button data-view="kodaiji" aria-pressed="false">高台寺</button><button data-view="yasaka" aria-pressed="false">八坂神社</button><button data-view="street" aria-pressed="false">祇園の町並み</button></nav><div class="subrow">');
 html=html.replace('スマホで、見た目と操作を確認。','東山・祇園を、自由に散策。');
 html=html.replace('設定を変えても本堂の形状は省略しません。','設定を変えても寺社や町家の形状は省略しません。iPhoneでは軽量表示を使用します。祇園から清水寺周辺まで地図輪郭を参照しています。旧デザインの誇張された外周建物は除去しました。町家の正面は道路との位置関係から推定しており、個別の実測ではありません。清水寺の輪郭対応・屋根・高さ・庭園・地形にも推定が残ります。');
 html=html.replace('立体の建築と、事前計算した光を読み込んでいます。','寺社と町並みの3Dを準備しています。');
 html=html.replace('</style>',`\n.tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}.tabs button{min-height:38px;padding:7px 3px;font-size:11px}.bottom{border-radius:22px}.side{bottom:calc(172px + env(safe-area-inset-bottom))}.hint{top:91px}.hint span{font-size:10px;padding:6px 10px}.map-spot{position:absolute;left:0;top:0;white-space:nowrap;min-height:32px;padding:7px 12px 7px 24px;border-radius:18px;background:#fffdf8f5;box-shadow:0 3px 14px #52483622;font-size:11px;color:#51493e;border:1px solid #fff;pointer-events:auto}.map-spot:before{content:'';position:absolute;left:9px;top:12px;width:7px;height:7px;border-radius:50%;background:#e17d95}.map-spot:after{content:'';position:absolute;left:calc(50% - 4px);bottom:-6px;border:4px solid transparent;border-top-color:#fffdf8}.capture #map-spots{display:none}#map-spots{position:absolute;inset:0;pointer-events:none;z-index:2}header,.bottom,.side{z-index:3}@media(min-width:800px){.bottom{max-width:720px}.tabs{grid-template-columns:repeat(6,minmax(0,1fr))}.side{bottom:130px}}\n</style>`);
 html=html.replace('</noscript>','</noscript><a class="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>').replace('</style>','.map-credit{position:fixed;bottom:1px;left:5px;z-index:4;font-size:8px;color:#626957;background:#fffdf8bb;border-radius:3px;padding:1px 3px}.capture .map-credit{display:none}</style>');
 return {renderer,app,html};
};
