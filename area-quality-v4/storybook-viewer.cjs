'use strict';
module.exports=({renderer,app,html})=>{
 const exact=(s,a,b)=>{if(!s.includes(a))throw Error('Missing storybook viewer input: '+a.slice(0,90));return s.replace(a,b);};
 const cameras={
  area:{target:[-10,-1.0,14],span:51,yaw:-.72,pitch:.64},
  temple:{target:[0,7.6,-1],span:14.5,yaw:2.7,pitch:.50},
  hokanji:{target:[-14.42,4.7,10.81],span:10.8,yaw:2.15,pitch:.52},
  kodaiji:{target:[-5.8,3.8,17.6],span:16,yaw:3.45,pitch:.62},
  yasaka:{target:[-16.2,3.4,25.3],span:15,yaw:2.82,pitch:.60},
  street:{target:[-17,2.8,10.9],span:8.0,yaw:-.18,pitch:.58},
  corner:{target:[.5,4.5,-1.5],span:7.0,yaw:2.65,pitch:.4},
  reverse:{target:[0,4.2,-1],span:10.5,yaw:3.7,pitch:.5}
 };
 app=app.replace(/const presets=\{.*?\};/, 'const presets='+JSON.stringify(cameras)+';');
 app=exact(app,"const portraitScale=name==='area'?.58:","const portraitScale=name==='area'?.55:");
 app=exact(app,'p.span*=portraitScale/aspect;',"p.span*=name==='area'?Math.max(1,portraitScale/aspect):portraitScale/aspect;");
 app=app.replace(/const mapSpots=\[.*?\];/,"const mapSpots=[{id:'temple',name:'清水寺',p:[0,10.8,-1]},{id:'hokanji',name:'八坂の塔',p:[-14.42,9.8,10.81]},{id:'kodaiji',name:'高台寺',p:[-8.74,6.0,16.8]},{id:'yasaka',name:'八坂神社',p:[-16.17,6.0,27]}];");
 app=app.replace('y<canvas.clientHeight-135','y<document.querySelector(".bottom").getBoundingClientRect().top-12');
 app=exact(app,'s.el.hidden=!show;',"s.el.setAttribute('aria-current',String(selected===s.id));s.el.hidden=!show;");
 app=exact(app,'selected=name;const next=', 'selected=name;updateStory(name);const next=');
 app=exact(app,"camera=authored(selected);ready=true;", "camera=authored(selected);ready=true;updateStory(selected);");
 app=exact(app," const mapSpots=",` const stories={
 area:{title:'路地の先に、京都がある。',text:'気になる名所をタップ。町家、庭、坂道へ。'},
 temple:{title:'清水寺 · 舞台と、大きな屋根',text:'舞台を支える木組みと、重なり合う屋根を眺める。'},
 hokanji:{title:'八坂の塔 · 路地の向こうの五重塔',text:'町家の屋根から顔を出す塔。街並みごと楽しむ。'},
 kodaiji:{title:'高台寺 · 庭と建築をたどる',text:'池、庭、建物の間にある余白にも目を向ける。'},
 yasaka:{title:'八坂神社 · 朱色を目印に',text:'門から境内へ。社殿と舞殿、それぞれの姿を眺める。'},
 street:{title:'祇園の町並み · 寄り道の時間',text:'格子、軒先、細い道。名所の間にも見どころを。'}};
 function updateStory(name){const s=stories[name]||stories.area;$('story-title').textContent=s.title;$('story-text').textContent=s.text;}
 const mapSpots=`);
 // The map is explicitly illustrative; it does not expose invented travel times.
 html=html.replaceAll('東山・祇園のミニチュア','京さんぽ · 東山と祇園');
 html=html.replace('KYOTO · HIGASHIYAMA / GION','KYOTO · A LITTLE JOURNEY');
 html=html.replace('<nav class="tabs"', '<div class="story-intro"><span class="story-eyebrow">HIGASHIYAMA / GION</span><h2 id="story-title">路地の先に、京都がある。</h2><p id="story-text">気になる名所をタップ。町家、庭、坂道へ。</p></div><nav class="tabs"');
 html=html.replace('町並みと、寺社をめぐる','縮尺・地形を強調したイラストマップ');
 html=html.replace(/設定を変えても寺社や町家の形状は省略しません。.*?推定が残ります。/,'見やすさを優先して、名所を大きく、町家や植栽を簡略化しています。建物の大きさ・間隔・道幅は現実の縮尺と異なります。道順・所要時間を案内する機能はまだありません。ピンクの植栽はデザイン上の表現で、開花状況を示すものではありません。iPhoneでは軽量表示を使用します。');
 html=html.replace('エリア全体','全体を見る');
 html=html.replace('</style>',`\n:root{--accent:#ca748a}header .brand{background:#fffdf8ed}.hint{top:91px}.bottom{padding:17px 14px 10px;background:#fffdf8f5;border:1px solid #fff;box-shadow:0 10px 45px #76664b19}.story-eyebrow{font-size:8px;letter-spacing:1.8px;color:#9b8c77}.story-intro{padding:0 7px 11px}.story-intro h2{font-size:17px;letter-spacing:.04em;font-weight:600;margin:5px 0;color:#494f42}.story-intro p{font-size:10px;color:#827c6c;margin:0;line-height:1.6}.tabs button{border-radius:13px;font-size:10px;min-height:36px}.tabs button[aria-pressed=true]{background:#f5e4e8;color:#ae5e76}.subrow{margin-top:7px}.side{bottom:calc(244px + env(safe-area-inset-bottom))}.map-spot{font-weight:600;color:#505847;border-color:#fffdf8;padding:8px 12px 8px 24px;box-shadow:0 4px 14px #5b674429}.map-spot:before{background:#d98398}.capture .story-intro{display:none}@media(min-width:800px){.bottom{max-width:740px}.story-intro{padding-bottom:12px}.story-intro h2{font-size:20px}.story-intro p{font-size:12px}.side{bottom:210px}}@media(max-height:600px){.story-intro{display:none}.side{bottom:165px}.hint{display:none}}\n</style>`);
 renderer=exact(renderer,'vec3 sky(vec2 u){return mix(vec3(.968,.955,.91),vec3(.67,.848,.902),smoothstep(.12,1.,u.y));}', 'vec3 sky(vec2 u){return mix(vec3(.970,.951,.916),vec3(.878,.934,.921),smoothstep(.1,1.,u.y));}');
 renderer=renderer.replace('vec3(.76,.85,.86),fog','vec3(.91,.94,.88),fog');
 // Keep the interface quiet and the town in view; controls remain real views,
 // not non-functional route/search affordances copied from the concept artwork.
 html=html.replace('</style>',`\nheader .brand{padding:10px 13px;border-radius:19px}header .brand .eyebrow{font-size:7px;letter-spacing:1.4px}.bottom{padding:12px 12px 9px;border-radius:24px}.story-eyebrow{display:none}.story-intro{padding:0 6px 8px}.story-intro h2{font-size:15px;margin:2px 0 4px}.story-intro p{font-size:10px}.tabs{gap:4px}.tabs button{min-height:40px;background:#f2efe65c}.tabs button[aria-pressed=true]{background:#f8e0e7;color:#b24d6a}.subrow{margin-top:5px}.side{bottom:calc(205px + env(safe-area-inset-bottom))}.map-spot{font-size:11px;padding:8px 12px 8px 28px;box-shadow:0 4px 12px #5d61452b}.map-spot:before{width:12px;height:12px;left:10px;top:10px;border-radius:8px 8px 8px 0;transform:rotate(-45deg);background:radial-gradient(circle at center,#fff 0 2px,#d66e91 2.4px)}.map-spot[aria-current=true]{border-color:#d66e91}@media(max-height:600px){.side{bottom:165px}}\n</style>`);
 renderer=exact(renderer,'aces(lit*.785)','aces(lit*.73)');
 html=html.replace('道順・所要時間を案内する機能はまだありません。','山の高さ・川幅・水辺の形も見やすさのために編集しており、測量地形ではありません。道順・所要時間を案内する機能はまだありません。');
 return{renderer,app,html};
};
