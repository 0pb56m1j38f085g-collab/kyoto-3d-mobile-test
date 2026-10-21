/* Mobile device test. No location, backend, analytics, cookies or external resources. */
'use strict';
(()=>{
 const $=id=>document.getElementById(id),canvas=$('scene'),copy=o=>JSON.parse(JSON.stringify(o));
 const params=new URLSearchParams(location.search);if(params.has('capture'))document.body.classList.add('capture');
 const presets={area:{target:[-15,6,22],span:76,yaw:.62,pitch:.49},temple:{target:[1.6,6.2,-.3],span:21.5,yaw:.52,pitch:.42},corner:{target:[2.8,5.55,1.75],span:13.4,yaw:.57,pitch:.34},reverse:{target:[1.8,6.1,-.8],span:22.5,yaw:-.22,pitch:.43}};
 const modes={standard:{dpr:Math.min(devicePixelRatio||1,1.25),ao:.50,focus:1.6},high:{dpr:Math.min(devicePixelRatio||1,1.8),ao:.57,focus:2.0},light:{dpr:Math.min(devicePixelRatio||1,.85),ao:.25,focus:0}};
 const names={standard:'標準',high:'高画質',light:'軽量'};
 let model,renderer,camera,selected='area',quality='standard',ready=false,contextLost=false,anim=null,raf=0,lastDraw=0,pointers=new Map(),previousGesture=null,modal=null,returnFocus=null,tickTimes=[],renderTimes=[],toastTimer,resizeTimer,paused=false;
 let autoLowered=false,lastAdaptiveFrame=0;const started=performance.now();const runtimeErrors=[];
 const touchDevice=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function authored(name){const p=copy(presets[name]);const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);if(aspect<1.05){p.span*=.89/aspect;p.target[1]+=.2;}return p;}
 function hideHint(){$('hint').style.opacity='0';}
 function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
 function fail(message,title='3Dを表示できませんでした。'){ready=false;$('loading').hidden=true;$('error-title').textContent=title;$('error-message').textContent=message;$('error').hidden=false;}
 function errorMessage(e){return e&&e.message?e.message:String(e);}
 function placeLabel(){if(!renderer||!camera)return;let p=M.point(renderer.lastVP,[1.6,14.2,-3.2]);const x=(p[0]*.5+.5)*canvas.clientWidth,y=(.5-p[1]*.5)*canvas.clientHeight;
 const show=selected==='temple'&&!modal&&x>52&&x<canvas.clientWidth-52&&y>130&&y<canvas.clientHeight-165&&p[2]>-1&&p[2]<1;
 $('landmark').classList.toggle('shown',show);$('landmark').style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;}
 function renderFrame(ts){raf=0;if(!ready||paused||contextLost||document.hidden)return;
 if(anim&&ts-lastDraw<32){request();return;}
 let keep=false;
 if(anim){const f=clamp((ts-anim.start)/620,0,1),t=f*f*(3-2*f);for(const k of ['span','yaw','pitch'])camera[k]=anim.from[k]+(anim.to[k]-anim.from[k])*t;camera.target=anim.from.target.map((v,i)=>v+(anim.to.target[i]-v)*t);keep=f<1;if(!keep)anim=null;}
 const t=performance.now();try{renderer.render(camera,0);}catch(e){runtimeErrors.push(errorMessage(e));fail('描画中にエラーが発生しました。再読み込みで復帰するか確認してください。\n'+errorMessage(e));return;}
 renderTimes.push(performance.now()-t);if(renderTimes.length>30)renderTimes.shift();
 if(lastDraw&&ts-lastDraw<250){tickTimes.push(ts-lastDraw);if(tickTimes.length>30)tickTimes.shift();}lastDraw=ts;
 if(!window.__ready){window.__ready=true;$('loading').hidden=true;window.__startupMs=performance.now()-started;}
 placeLabel();
 if(quality==='standard'&&!autoLowered&&renderer.frames>lastAdaptiveFrame+25&&tickTimes.length>=12&&pointers.size){const avg=tickTimes.reduce((a,b)=>a+b,0)/tickTimes.length;if(avg>80){renderer.dpr=Math.max(.8,modes.standard.dpr*.78);autoLowered=true;toast('操作を軽くするため、描画解像度を調整しました。');keep=true;}lastAdaptiveFrame=renderer.frames;}
 if(keep)request();}
 function request(){if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(renderFrame);}
 function view(name,animate=true){if(!ready||!presets[name])return;selected=name;const next=authored(name);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));if(animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches){anim={from:copy(camera),to:next,start:performance.now()};}else{camera=next;anim=null;}request();}
 function zoom(f){if(!ready)return;anim=null;camera.span=clamp(camera.span*f,10,Math.max(45,30/(canvas.clientWidth/canvas.clientHeight)));hideHint();request();}
 function gesture(){const p=[...pointers.values()];if(p.length<2)return null;return{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),a:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)};}
 function pan(dx,dy){const s=camera.span/canvas.clientHeight;camera.target[0]-=dx*s*Math.cos(camera.yaw);camera.target[2]+=dx*s*Math.sin(camera.yaw);camera.target[1]+=dy*s;camera.target[0]=clamp(camera.target[0],-45,18);camera.target[1]=clamp(camera.target[1],2.0,16);camera.target[2]=clamp(camera.target[2],-12,52);}
 canvas.addEventListener('pointerdown',e=>{if(!ready||modal)return;anim=null;hideHint();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);previousGesture=gesture();});
 canvas.addEventListener('pointermove',e=>{if(!ready||!pointers.has(e.pointerId))return;const before=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1){const dx=e.clientX-before.x,dy=e.clientY-before.y;if(e.shiftKey||e.buttons===2){pan(dx,dy);}else{camera.yaw-=dx*.0055;camera.pitch=clamp(camera.pitch+dy*.0035,.22,1.10);}}
 else{const g=gesture();if(previousGesture&&g){camera.span=clamp(camera.span*previousGesture.d/Math.max(g.d,1),10,Math.max(45,30/(canvas.clientWidth/canvas.clientHeight)));let da=g.a-previousGesture.a;if(da>Math.PI)da-=Math.PI*2;if(da< -Math.PI)da+=Math.PI*2;camera.yaw-=da;pan(g.x-previousGesture.x,g.y-previousGesture.y);}previousGesture=g;}request();});
 const end=e=>{pointers.delete(e.pointerId);previousGesture=gesture();};['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,end));
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(e.deltaY*.001));},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('keydown',e=>{if(!ready)return;let handled=true;anim=null;if(e.key==='ArrowLeft')camera.yaw-=.1;else if(e.key==='ArrowRight')camera.yaw+=.1;else if(e.key==='ArrowUp')camera.pitch=clamp(camera.pitch+.06,.22,1.1);else if(e.key==='ArrowDown')camera.pitch=clamp(camera.pitch-.06,.22,1.1);else if(e.key==='+'||e.key==='=')zoom(.9);else if(e.key==='-')zoom(1.1);else if(e.key==='Home')view('temple');else handled=false;if(handled){e.preventDefault();hideHint();request();}});
 function diagnostics(){const r=renderer,dt=tickTimes.length?tickTimes.reduce((a,b)=>a+b,0)/tickTimes.length:0;return[
 'Kyoto 3D device test 01 / bootfix-20261020-01',`表示: ${canvas.clientWidth} × ${canvas.clientHeight} CSS px`,
 `描画: ${canvas.width} × ${canvas.height} px`, `画質: ${names[quality]}${autoLowered?'（解像度自動調整）':''}`,
 `初期表示: ${Math.round(window.__startupMs||0)} ms`,dt?`操作時の描画間隔: 約${Math.round(dt)} ms`:'描画間隔: まだ操作データがありません',
 `三角形: ${r?Math.round(r.scene.stats.triangles).toLocaleString('en-US'):0}`,
 `本堂: ${model?model.stats.mainHallInstances:0} 個の形状インスタンスを保持`,
 `描画フレーム数: ${r?r.frames:0}`,`実行エラー: ${runtimeErrors.length}`,
 'GPS / アクセス解析: 不使用', '自動送信: なし'].join('\n');}
 function openModal(id){returnFocus=document.activeElement;modal=id;anim=null;pointers.clear();previousGesture=null;$(id).hidden=false;$('help-open').setAttribute('aria-expanded',String(id==='help'));if(id==='help')$('diagnostics').textContent=diagnostics();$(id).querySelector('.sheet').focus({preventScroll:true});placeLabel();}
 function closeModal(){if(!modal)return;$(modal).hidden=true;modal=null;$('help-open').setAttribute('aria-expanded','false');if(returnFocus&&returnFocus.focus)returnFocus.focus({preventScroll:true});request();}
 function setQuality(value){if(!modes[value]||!ready)return;quality=value;autoLowered=false;const p=modes[value];renderer.dpr=p.dpr;renderer.ao=p.ao;renderer.focusEffect=p.focus;$('quality').value=value;$('quality-label').textContent=names[value];tickTimes=[];lastAdaptiveFrame=renderer.frames;request();setTimeout(()=>{if(modal==='help')$('diagnostics').textContent=diagnostics();},120);}
 $('help-open').onclick=() =>openModal('help');$('quality-open').onclick=()=>{openModal('help');$('quality').focus({preventScroll:true});};['help-close','help-done','spot-close'].forEach(id=>$(id).onclick=closeModal);$('landmark').onclick=()=>openModal('spot');$('detail-view').onclick=()=>{closeModal();view('corner');};$('quality').onchange=e=>setQuality(e.target.value);
 $('copy-diagnostics').onclick=async()=>{const text=diagnostics();try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);toast('診断情報をコピーしました。');}catch(_){$('diagnostics').textContent=text;toast('診断情報を長押ししてコピーするか、画面を撮影してください。');}};
 ['help','spot'].forEach(id=>$(id).addEventListener('click',e=>{if(e.target===$(id))closeModal();}));
 document.addEventListener('keydown',e=>{if(!modal)return;if(e.key==='Escape'){e.preventDefault();closeModal();return;}if(e.key==='Tab'){const el=$(modal),f=[...el.querySelectorAll('button:not(:disabled),select,[href],input,[tabindex="0"]')].filter(n=>!n.hidden),first=f[0],last=f[f.length-1];if(!first)return;if(e.shiftKey&&(document.activeElement===first||document.activeElement===el.querySelector('.sheet'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('zoom-in').onclick=()=>zoom(.86);$('zoom-out').onclick=()=>zoom(1.16);$('reset').onclick=()=>{closeModal();view('temple');};$('reload').onclick=()=>location.reload();
 window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(ready)view(selected,false);},120);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;anim=null;pointers.clear();previousGesture=null;}else{lastDraw=0;request();}});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;if(raf)cancelAnimationFrame(raf);raf=0;fail('描画用メモリが解放され、3D表示が一時停止しました。復帰しない場合は再読み込みしてください。','3D表示が一時停止しました。');});
 canvas.addEventListener('webglcontextrestored',()=>{try{renderer=new Renderer(canvas,model,{dpr:modes[quality].dpr,shadowSize:2048});renderer.ao=modes[quality].ao;renderer.focusEffect=modes[quality].focus;contextLost=false;ready=true;$('error').hidden=true;request();}catch(e){fail('描画の復帰に失敗しました。再読み込みしてください。');}});
 window.addEventListener('error',e=>{runtimeErrors.push(e.message||'Unknown error');if(!ready)fail('読み込み中にエラーが発生しました。 '+(e.message||''));});
 window.addEventListener('unhandledrejection',e=>{runtimeErrors.push(errorMessage(e.reason));if(!ready)fail(errorMessage(e.reason));});
 setTimeout(()=>{try{if(typeof makeStudy!=='function')throw Error('3Dモデルの読み込みに失敗しました（scene.js）。再読み込みしてください。');const modelStart=performance.now();model=makeStudy();window.__modelMs=performance.now()-modelStart;
 renderer=new Renderer(canvas,model,{dpr:modes.standard.dpr,shadowSize:2048});renderer.ao=modes.standard.ao;renderer.focusEffect=modes.standard.focus;camera=authored(params.get('view')||'area');ready=true;
 window.phoneTest={get camera(){return camera;},get renderer(){return renderer;},get model(){return model;},get ready(){return ready;},get quality(){return quality;},get modal(){return modal;},get errors(){return runtimeErrors.slice();},view,request,setQuality,diagnostics,pause(v){paused=Boolean(v);if(paused&&raf){cancelAnimationFrame(raf);raf=0;}else if(!paused)request();},setCamera(c){anim=null;Object.assign(camera,c);request();}};
 if(params.has('quality'))setQuality(params.get('quality'));if(params.has('view'))view(params.get('view'),false);request();
 }catch(e){runtimeErrors.push(errorMessage(e));fail('3Dの初期化に失敗しました。\n'+errorMessage(e));window.__error=errorMessage(e);}},80);
})();
