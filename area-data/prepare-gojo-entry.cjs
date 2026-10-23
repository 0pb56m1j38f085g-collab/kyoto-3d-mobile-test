'use strict';
// Offline extraction of the real northern Gojo carriageway and bridge.
// This is display reference, not pedestrian routing; editor metadata is omitted.
const fs=require('node:fs'),crypto=require('node:crypto');
const bytes=fs.readFileSync(process.argv[2]),xml=bytes.toString('utf8');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const project=([lat,lon])=>[(lon-135.785)*111320*Math.cos(34.995*Math.PI/180)/20,(lat-34.995)*110540/20].map(v=>+v.toFixed(5));
const nodes=new Map();for(const m of xml.matchAll(/<node\b[^>]*>/g)){const a=attrs(m[0]);nodes.set(a.id,[+a.lat,+a.lon]);}
const selected=new Set([843908923,27031137,27031164,27031133,275439115,27031142]),roads=[],bridges=[],buildings=[];
for(const m of xml.matchAll(/<way\b[^>]*>[\s\S]*?<\/way>/g)){
 const id=+attrs(m[0].slice(0,m[0].indexOf('>')+1)).id,tags=Object.fromEntries([...m[0].matchAll(/<tag\b[^>]*\/>/g)].map(m=>{const a=attrs(m[0]);return[a.k,a.v];}));
 const nodeIds=[...m[0].matchAll(/<nd ref="(\d+)"/g)].map(m=>+m[1]),ll=nodeIds.map(id=>nodes.get(String(id)));if(ll.some(p=>!p)||ll.length<2)throw Error('Incomplete way '+id);
 const points=ll.map(project);
 if(selected.has(id))roads.push({id,name:tags.name,highway:tags.highway,surface:tags.surface||null,nodeIds,latlon:ll,points});
 if(id===28144474){if(tags['bridge:name']!=='五条大橋')throw Error('Bridge identity changed');bridges.push({id,name:tags['bridge:name'],nodeIds,latlon:ll,points});}
 if(!tags.building||tags.name||ll.length<4)continue;
 const p=points.slice(0,-1),center=p.reduce((s,p)=>[s[0]+p[0]/(points.length-1),s[1]+p[1]/(points.length-1)],[0,0]);
 const footprintArea=Math.abs(p.reduce((s,a,j)=>{const b=p[(j+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
 if(center[0]>-40||center[0]<-86||center[1]<-9||center[1]>12||footprintArea<.02||footprintArea>2.2)continue;
 buildings.push({id,center:center.map(v=>+v.toFixed(5)),footprintArea:+footprintArea.toFixed(5)});
}
if(roads.length!==6||bridges.length!==1)throw Error('Missing Gojo source geometry');
console.log(JSON.stringify({source:'OpenStreetMap / contributors',license:'ODbL-1.0',url:'https://www.openstreetmap.org/api/0.6/map?bbox=135.766,34.993,135.779,34.998',retrievedAt:'2026-10-23',inputSha256:crypto.createHash('sha256').update(bytes).digest('hex'),origin:{lat:34.995,lon:135.785},metresPerUnit:20,axes:'east +X, north +Z',roads,bridges,buildings,limitations:'Northern carriageway retained as a single illustrative street axis, not a pedestrian route. Bridge width and buildings are exaggerated. Original north/south one-way carriageways are not a full traffic model.'}));
