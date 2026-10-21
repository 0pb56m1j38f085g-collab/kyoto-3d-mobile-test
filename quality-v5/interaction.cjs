'use strict';
// Keep dialogs responsive: do not submit heavy 3D work behind modal settings.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports=function(site){
 const appPath=path.join(site,'src/app.js');let app=fs.readFileSync(appPath,'utf8');
 if(sha(app)!=='4a9aefc98bdba760ea6ba573c7b0ca2182159141e527d8a5073c7c6f75cea3ce')throw Error('Unexpected interaction patch input');
 function edit(a,b){if(app.split(a).length!==2)throw Error('Unexpected interaction fragment: '+a);app=app.replace(a,b);}
 edit('if(!ready||paused||contextLost||document.hidden)return;','if(!ready||paused||modal||contextLost||document.hidden)return;');
 edit('if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(renderFrame);','if(!raf&&!paused&&!modal&&!document.hidden)raf=requestAnimationFrame(renderFrame);');
 edit('modal=id;anim=null;pointers.clear();','modal=id;anim=null;if(raf){cancelAnimationFrame(raf);raf=0;}pointers.clear();');
 edit("$(id).hidden=false;$('help-open')","$(id).hidden=false;$(id).querySelector('.sheet').scrollTop=0;$('help-open')");
 fs.writeFileSync(appPath,app);
 const index=path.join(site,'index.html');let html=fs.readFileSync(index,'utf8');
 html=html.replaceAll('.js?v=quality-v5.3','.js?v=quality-v5.3.1');
 fs.writeFileSync(index,html);
 return Object.fromEntries(['src/renderer.js','src/app.js','index.html'].map(n=>[n,sha(fs.readFileSync(path.join(site,n)))]));
};
