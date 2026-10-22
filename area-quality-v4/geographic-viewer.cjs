'use strict';
// Presentation uses a conventional right-handed East/Up/South 3D frame.
// Source geometry remains East/North, and is reflected once by the scene builder.
module.exports=({renderer,app,html})=>{
 const exact=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Geographic viewer input: '+a.slice(0,100));return s.replace(a,b);};
 const presets={area:{target:[-11,4,-14],span:60,yaw:Math.PI,pitch:.72},temple:{target:[0,8,0],span:24,yaw:-.52,pitch:.48},hokanji:{target:[-11,5,-10.8],span:10,yaw:-.7,pitch:.5},kodaiji:{target:[-6,4,-18],span:16,yaw:-.4,pitch:.65},yasaka:{target:[-12,4,-26],span:13,yaw:-.5,pitch:.6},street:{target:[-16,3,-12],span:8,yaw:-.3,pitch:.58},corner:{target:[0,8,0],span:17,yaw:-.55,pitch:.4},reverse:{target:[0,8,0],span:24,yaw:2.7,pitch:.6}};
 app=app.replace(/const presets=\{.*?\};/,'const presets='+JSON.stringify(presets)+';');
 app=app.replace(/ const stories=\{[\s\S]*?\n function updateStory.*?\n/,'\n');
 app=app.replaceAll('updateStory(name);','').replaceAll('updateStory(selected);','');
 const authored=`function authored(name){
  const p=copy(presets[name]),w=canvas.clientWidth,h=Math.max(1,canvas.clientHeight),aspect=w/h;
  const framing=model?.cartography?.framing,box=framing?.bounds[name==='corner'||name==='reverse'?'temple':name];
  if(box){p.target=[(box.x0+box.x1)/2,(box.y0+box.y1)/2,(box.z0+box.z1)/2];}
  if(name!=='area'){if(aspect<1.05)p.span*=.76/aspect;return p;}
  // Fit the actual landmark silhouettes and verified water locations, not merely
  // pin centres. Safari's short visual viewport must not cut off the main hall.
  const points=framing?.overview||[];if(!points.length)return p;
  const top=h<500?90:128,bottom=h-42,left=18,right=w-18;
  const project=()=>{const eye=V.add(p.target,[Math.sin(p.yaw)*Math.cos(p.pitch)*100,Math.sin(p.pitch)*100,Math.cos(p.yaw)*Math.cos(p.pitch)*100]);const vp=M.mul(M.perspective(2*Math.atan(p.span/200),aspect,.25,250),M.look(eye,p.target));return points.map(v=>{const q=M.point(vp,v);return[(q[0]*.5+.5)*w,(.5-q[1]*.5)*h];});};
  for(let n=0;n<12;n++){
   const pts=project(),xs=pts.map(v=>v[0]),ys=pts.map(v=>v[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
   const grow=Math.max((x1-x0)/(right-left),(y1-y0)/(bottom-top));p.span*=Math.max(.85,Math.min(1.5,grow))*1.006;
   const dx=((x0+x1)-(left+right))/2*p.span/h,dy=((y0+y1)-(top+bottom))/2*p.span/h;
   p.target[0]+=dx*Math.cos(p.yaw);p.target[2]-=dx*Math.sin(p.yaw);p.target[1]-=dy/Math.max(.3,Math.cos(p.pitch));
  }
  return p;
 }`;
 app=app.replace(/function authored\(name\)\{.*?return p;\}/,authored);
 app=exact(app,"s.el.className='map-spot';","s.el.className='map-spot';s.el.dataset.view=s.id;");
 const labels=` function placeLabel(){if(!renderer||!camera)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,occupied=[],pinData=model.cartography.landmarkPins;
  for(const s of mapSpots){
   s.p=pinData[s.id];const p=M.point(renderer.lastVP,s.p),rawX=(p[0]*.5+.5)*w,rawY=(.5-p[1]*.5)*h;
   const half=Math.max(44,s.el.offsetWidth/2),x=clamp(rawX,half+8,w-half-8);let y=rawY;
   let show=!modal&&(selected==='area'||selected===s.id)&&rawX>-20&&rawX<w+20&&rawY>90&&rawY<h-25&&p[2]>-1&&p[2]<1;
   if(show){for(let n=0;n<4&&occupied.some(o=>Math.abs(o.x-x)<half+o.half+7&&Math.abs(o.y-y)<43);n++)y-=44;show=y>92;}
   s.el.setAttribute('aria-current',String(selected===s.id));s.el.hidden=!show;s.el.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-100%)';if(show)occupied.push({x,y,half});
  }
  $('landmark').classList.remove('shown');
  for(const name of ['鴨川','白川']){
   let el=document.querySelector('[data-water-name="'+name+'"]');if(!el){el=document.createElement('span');el.className='water-label';el.dataset.waterName=name;el.textContent=name;spotLayer.appendChild(el);}
   const points=model.cartography.waterways.channels.filter(r=>r.name===name).flatMap(r=>r.points),wanted=name==='鴨川'?-16:-32;
   const anchor=points.reduce((a,b)=>Math.abs(b[1]-wanted)<Math.abs(a[1]-wanted)?b:a),p=M.point(renderer.lastVP,[anchor[0],2,anchor[1]]),x=(p[0]*.5+.5)*w,y=(.5-p[1]*.5)*h;
   el.hidden=!!modal||selected!=='area'||x<20||x>w-20||y<130||y>h-50;el.style.transform='translate('+Math.round(x)+'px,'+Math.round(y)+'px) translate(-50%,-50%)';
  }
  const centre=M.point(renderer.lastVP,camera.target),north=M.point(renderer.lastVP,V.add(camera.target,[0,0,-10]));
  const dx=(north[0]-centre[0])*w,dy=-(north[1]-centre[1])*h,angle=Math.atan2(dx,-dy)*180/Math.PI;
  $('north-needle').style.transform='rotate('+angle+'deg)';$('compass').dataset.northAngle=String(angle);
  const dirs=['北','北東','東','南東','南','南西','西','北西'],bearing=(-camera.yaw*180/Math.PI%360+360)%360;
  $('orientation').textContent='画面上：'+dirs[Math.round(bearing/45)%8]+' · 右：'+dirs[Math.round((bearing+90)/45)%8];
  $('compass').setAttribute('aria-label','北を上にする。現在の'+$('orientation').textContent);
 }`;
 app=app.replace(/ function placeLabel\(\)\{[\s\S]*?\n \}/,labels);
 app=exact(app,"$('help-open').onclick=() =>openModal('help');","$('compass').onclick=()=>{if(!ready)return;anim=null;camera.yaw=0;request();};$('help-open').onclick=() =>openModal('help');");
 app=exact(app,"get camera(){return camera;}","get camera(){return camera;},get selectedView(){return selected;}");
 app=exact(app,"camera.target[2]=clamp(camera.target[2],-14,54);","camera.target[2]=clamp(camera.target[2],-54,14);");
 const bottom=html.match(/<section class="bottom"[\s\S]*?<\/section>/)?.[0];if(!bottom)throw Error('Missing removable bottom menu');
 const quality=bottom.match(/<button class="quality-pill"[\s\S]*?<\/button>/)?.[0];if(!quality)throw Error('Missing quality settings');
 html=html.replace(bottom,'');
 html=exact(html,'<div class="settings"><label for="quality">',quality+'<div class="settings"><label for="quality">');
 html=exact(html,'<div class="hint" id="hint">','<div id="orientation" aria-live="off">画面上：南 · 右：西</div><button id="compass" aria-label="北を上にする"><span id="north-needle"><b>北</b><i></i></span></button><div class="map-note">位置は地図基準 · 建物・地形は誇張</div><div class="hint" id="hint">');
 html=html.replace('1本指で回転 · 2本指で拡大・移動','名所をタップで拡大 · 1本指で回転');
 html=html.replace('山の高さ・川幅・水辺の形も見やすさのために編集しており、測量地形ではありません。','初期表示は北側から南を見る向きです（画面上が南、右が西）。北の矢印は回転に連動し、押すと北を上にできます。位置は同じ地理座標変換を使用し、建物の大きさと山の高さを誇張しています。川・橋は確認できた地理データだけを使用します。測量地形ではありません。');
 html=html.replace('</style>',`\n/* v4.20: no bottom menu; map and direct landmark pins are the primary UI. */
 .side{bottom:calc(52px + env(safe-area-inset-bottom));right:14px}.side .round{width:42px;height:42px}.tool-caption{font-size:9px}
 #orientation{position:absolute;left:20px;top:99px;z-index:3;font-size:10px;color:#6b7461;background:#fffdf8d9;border-radius:12px;padding:6px 10px;pointer-events:none}
 #compass{position:absolute;top:84px;right:19px;z-index:3;width:43px;height:62px;border-radius:24px;background:#fffdf8e8;box-shadow:0 3px 12px #5d614512}
 #north-needle{display:block;position:absolute;inset:5px 3px;transform-origin:center;pointer-events:none}#north-needle b{position:absolute;top:1px;left:0;right:0;font-size:10px;font-weight:600}#north-needle i{position:absolute;left:13px;top:20px;width:10px;height:25px;background:linear-gradient(#c67882 0 50%,#c9cec3 50%);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
 .map-note{position:absolute;bottom:23px;left:12px;z-index:3;font-size:9px;color:#787c6b;padding:4px 7px;background:#fffdf8cc;border-radius:9px;pointer-events:none}
  .water-label{position:absolute;left:0;top:0;font-size:10px;letter-spacing:.2em;color:#507f89;padding:4px 7px;border-radius:9px;background:#eef9f4cc;pointer-events:none}
 .hint{top:auto;bottom:57px;left:15px;right:75px;justify-content:flex-start}.hint span{font-size:10px;background:#fffdf8d9}.map-spot{min-height:38px}.map-spot[data-view=temple]{font-size:13px;border:1px solid #d98aa0;background:#fffaf6;box-shadow:0 5px 15px #6c4f3b25}#toast{bottom:80px}
 .capture #compass,.capture #orientation,.capture .map-note{display:none}
 @media(max-height:500px){#orientation{top:64px;left:17px;font-size:9px}#compass{top:63px;right:17px;transform:scale(.85);transform-origin:top right}.side{bottom:28px;gap:6px}.side .round{width:36px;height:36px}.hint{display:none}.map-note{bottom:17px;font-size:8px}}
 </style>`);
 if(app.includes('getBoundingClientRect().top-12'))throw Error('Stale bottom menu occlusion');
 return{renderer,app,html};
};
