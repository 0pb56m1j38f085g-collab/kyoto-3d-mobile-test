'use strict';
const fs=require('node:fs'),path=require('node:path');
const bbox=[34.9935,135.7760,35.0055,135.7880];
const [s,w,n,e]=bbox,lat0=34.995,lon0=135.785,scale=20;
const query='[out:json][timeout:90];(way["highway"]('+s+','+w+','+n+','+e+');way["building"]('+s+','+w+','+n+','+e+'););out body;>;out skel qt;';
const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const project=(lat,lon)=>[(lon-lon0)*111320*Math.cos(lat0*Math.PI/180)/scale,(lat-lat0)*110540/scale];
function dp(points,eps){
 if(points.length<3)return points;
 const a=points[0],b=points[points.length-1],dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz;
 let max=0,idx=0;
 for(let i=1;i<points.length-1;i++){const p=points[i],t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/den)):0,q=[a[0]+dx*t,a[1]+dz*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(d>max){max=d;idx=i;}}
 if(max<=eps)return[a,b];
 const l=dp(points.slice(0,idx+1),eps),r=dp(points.slice(idx),eps);return l.slice(0,-1).concat(r);
}
(async()=>{
 let data=null,lastErr=null;
 for(const url of endpoints){try{const res=await fetch(url,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'kyoto-3d-mobile-test/1.0'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(120000)});if(!res.ok)throw Error(url+' HTTP '+res.status);data=await res.json();break;}catch(e){lastErr=e;console.error(String(e));}}
 if(!data)throw lastErr||Error('Overpass unavailable');
 const nodes=new Map();for(const el of data.elements)if(el.type==='node')nodes.set(el.id,[el.lat,el.lon]);
 const roads=[],buildings=[];
 for(const el of data.elements){if(el.type!=='way'||!el.nodes)continue;const pts=el.nodes.map(id=>nodes.get(id)).filter(Boolean).map(([lat,lon])=>project(lat,lon));if(pts.length<2)continue;
  if(el.tags?.highway){const simple=dp(pts,.08);roads.push({id:el.id,name:el.tags.name||el.tags['name:ja']||null,highway:el.tags.highway,surface:el.tags.surface||null,bridge:el.tags.bridge||null,tunnel:el.tags.tunnel||null,points:simple.map(p=>p.map(v=>+v.toFixed(3)))})}
  if(el.tags?.building&&pts.length>=4){const closed=pts[0][0]===pts.at(-1)[0]&&pts[0][1]===pts.at(-1)[1];const poly=dp(pts,closed?.05:.08);buildings.push({id:el.id,name:el.tags.name||el.tags['name:ja']||null,building:el.tags.building,levels:el.tags['building:levels']?Number(el.tags['building:levels']):null,points:poly.map(p=>p.map(v=>+v.toFixed(3)))})}
 }
 const out={source:'OpenStreetMap contributors / Overpass API',license:'ODbL 1.0',retrievedAt:new Date().toISOString(),bbox,origin:{lat:lat0,lon:lon0},metresPerUnit:scale,roads,buildings,stats:{roads:roads.length,buildings:buildings.length,roadPoints:roads.reduce((n,r)=>n+r.points.length,0),buildingPoints:buildings.reduce((n,b)=>n+b.points.length,0)}};
 const dir=path.resolve('area-data');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'higashiyama-osm-v1.json'),JSON.stringify(out));
 fs.writeFileSync(path.join(dir,'higashiyama-osm-v1-summary.json'),JSON.stringify({source:out.source,license:out.license,retrievedAt:out.retrievedAt,stats:out.stats},null,2));
 console.log(JSON.stringify(out.stats));
})().catch(e=>{console.error(e);process.exitCode=1});