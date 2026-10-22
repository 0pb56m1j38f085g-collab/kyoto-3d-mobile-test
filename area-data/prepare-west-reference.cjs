'use strict';
// Offline extraction of the public OSM map response. Editor account metadata
// is deliberately discarded. Output is JSON on stdout for review/versioning.
const fs=require('node:fs'),crypto=require('node:crypto');
const bytes=fs.readFileSync(process.argv[2]),xml=bytes.toString('utf8');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const project=([lat,lon])=>[(lon-135.785)*111320*Math.cos(34.995*Math.PI/180)/20,(lat-34.995)*110540/20].map(v=>+v.toFixed(5));
const nodes=new Map();for(const m of xml.matchAll(/<node\b[^>]*>/g)){const a=attrs(m[0]);nodes.set(a.id,[+a.lat,+a.lon]);}
const water=[],bridges=[],buildings=[],roads=[];
for(const m of xml.matchAll(/<way\b[^>]*>[\s\S]*?<\/way>/g)){
 const a=attrs(m[0].slice(0,m[0].indexOf('>')+1)),tags=Object.fromEntries([...m[0].matchAll(/<tag\b[^>]*\/>/g)].map(m=>{const a=attrs(m[0]);return[a.k,a.v];}));
 const ll=[...m[0].matchAll(/<nd ref="(\d+)"/g)].map(m=>nodes.get(m[1]));if(ll.some(p=>!p)||ll.length<2)throw Error('Incomplete OSM way '+a.id);
 const points=ll.map(project),id=+a.id;
 if(tags.waterway&&['鴨川','白川'].includes(tags.name))water.push({id,name:tags.name,waterway:tags.waterway,tunnel:tags.tunnel||null,latlon:ll,points});
 if(tags.bridge==='yes'&&tags['bridge:name']==='四条大橋')bridges.push({id,name:tags['bridge:name'],latlon:ll,points});
 if(tags.highway&&tags.tunnel!=='yes'&&['residential','unclassified','living_street','pedestrian'].includes(tags.highway)&&points.some(p=>p[0]<-44&&p[0]>-68&&p[1]>-8&&p[1]<60))roads.push({id,name:tags.name||null,highway:tags.highway,points});
 if(!tags.building||tags.name||ll.length<4)continue;
 const p=points.slice(0,-1),center=p.reduce((s,p)=>[s[0]+p[0]/(points.length-1),s[1]+p[1]/(points.length-1)],[0,0]);
 const footprintArea=Math.abs(p.reduce((s,a,j)=>{const b=p[(j+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0))/2;
 if(center[0]>=-44||center[0]<-68||center[1]<-8||center[1]>60||footprintArea<.02||footprintArea>2.2)continue;
 let edge=[1,0],length=0;for(let j=0;j<p.length;j++){const b=p[(j+1)%p.length],d=[b[0]-p[j][0],b[1]-p[j][1]],l=Math.hypot(...d);if(l>length){length=l;edge=d.map(v=>v/l);}}
 buildings.push({id,center:center.map(v=>+v.toFixed(5)),footprintArea:+footprintArea.toFixed(5),axes:{u:edge.map(v=>+v.toFixed(5))}});
}
const result={source:'OpenStreetMap API map response / contributors',license:'ODbL-1.0',url:'https://www.openstreetmap.org/api/0.6/map?bbox=135.770,34.993,135.776,35.006',retrievedAt:'2026-10-22',inputSha256:crypto.createHash('sha256').update(bytes).digest('hex'),origin:{lat:34.995,lon:135.785},metresPerUnit:20,axes:'east +X, north +Z',water,bridges,roads,buildings:buildings.sort((a,b)=>(a.id%1009)-(b.id%1009)).slice(0,400),limitations:'OSM reference, not a survey. Town entries retain source polygon centres and an inferred principal edge only, not individual facade geometry. Culverts are retained in metadata but are not rendered as open water.'};
if(!water.some(w=>w.name==='鴨川')||!water.some(w=>w.name==='白川')||bridges.length!==1)throw Error('Missing expected water / bridge reference');
console.log(JSON.stringify(result));
