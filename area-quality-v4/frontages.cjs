'use strict';
// A road-facing elevation is inferred, never an observed shop entrance. Keep the
// source polygon intact and reject rays through the same or adjacent buildings.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function inside(p,poly){let yes=false;for(let j=0,k=poly.length-1;j<poly.length;k=j++){
 const a=poly[j],b=poly[k];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;}
function closest(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],den=dx*dx+dz*dz,t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/den)):0;return[a[0]+dx*t,a[1]+dz*t];}
function crosses(a,b,c,d){
 const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b),eps=1e-10;
 const on=(p,q,r)=>Math.abs(cross(p,q,r))<eps&&r[0]>=Math.min(p[0],q[0])-eps&&r[0]<=Math.max(p[0],q[0])+eps&&r[1]>=Math.min(p[1],q[1])-eps&&r[1]<=Math.max(p[1],q[1])+eps;
 return(abC*abD<0&&cdA*cdB<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
function blocked(a,b,buildings){return buildings.some(q=>inside(a,q.polygon)||inside(b,q.polygon)||q.polygon.some((p,j)=>crosses(a,b,p,q.polygon[(j+1)%q.polygon.length])));}
function roadWidth(r){return ['primary','secondary','tertiary'].includes(r.highway)?.45:['residential','unclassified'].includes(r.highway)?.22:.10;}
function inferFrontage(building,roads,buildings){
 const p=building.polygon,candidates=[];
 for(let edge=0;edge<p.length;edge++){
  const a=p[edge],b=p[(edge+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.12)continue;
  const n=[(b[1]-a[1])/len,-(b[0]-a[0])/len],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  for(const r of roads)for(let j=1;j<r.points.length;j++){
   const q=closest(mid,r.points[j-1],r.points[j]),dist=Math.hypot(q[0]-mid[0],q[1]-mid[1]);
   if(dist<.025||dist>.8)continue;
   const facing=((q[0]-mid[0])*n[0]+(q[1]-mid[1])*n[1])/dist;
   if(facing<.65)continue;
   candidates.push({edge,len,dist,facing,roadId:r.id,roadPoint:q,roadHalfWidth:roadWidth(r)/2,normal:n,score:dist/(.5+.5*facing),mid});
  }
 }
 candidates.sort((a,b)=>a.score-b.score||a.roadId-b.roadId||a.edge-b.edge);
 for(const c of candidates){
  const a=p[c.edge],b=p[(c.edge+1)%p.length],n=c.normal;
  // All three frontage samples must have a clear outward route. Midpoint-only
  // checks accept party walls and narrow gaps at the corners of concave plots.
  if([.15,.5,.85].some(t=>{
   const start=[a[0]+(b[0]-a[0])*t+n[0]*.004,a[1]+(b[1]-a[1])*t+n[1]*.004];
   return blocked(start,c.roadPoint,buildings);
  }))continue;
  const clearance=Math.max(0,c.dist*c.facing-c.roadHalfWidth-.025);
  const canopyDepth=Math.min(.035,clearance);
  const canopyClear=canopyDepth>.008&&[.05,.5,.95].every(t=>{
   const start=[a[0]+(b[0]-a[0])*t+n[0]*.004,a[1]+(b[1]-a[1])*t+n[1]*.004];
   return !blocked(start,[start[0]+n[0]*canopyDepth,start[1]+n[1]*canopyDepth],buildings);
  });
  const {mid,score,...result}=c;
  return{...result,canopyDepth:canopyClear?canopyDepth:0,method:'outward road ray, three frontage samples, building exclusion; inferred not surveyed'};
 }
 return null;
}
function assignFrontages(buildings,roads){
 // Spatially bound expensive visibility checks; no dependence on random state.
 const bounds=buildings.map(b=>({b,minX:Math.min(...b.polygon.map(p=>p[0])),maxX:Math.max(...b.polygon.map(p=>p[0])),minZ:Math.min(...b.polygon.map(p=>p[1])),maxZ:Math.max(...b.polygon.map(p=>p[1]))}));
 for(const b of buildings){
  const xs=b.polygon.map(p=>p[0]),zs=b.polygon.map(p=>p[1]),loX=Math.min(...xs)-.85,hiX=Math.max(...xs)+.85,loZ=Math.min(...zs)-.85,hiZ=Math.max(...zs)+.85;
  const nearBuildings=bounds.filter(q=>q.maxX>=loX&&q.minX<=hiX&&q.maxZ>=loZ&&q.minZ<=hiZ).map(q=>q.b);
  const nearRoads=roads.filter(r=>r.points.some((p,j)=>j&&Math.max(p[0],r.points[j-1][0])>=loX&&Math.min(p[0],r.points[j-1][0])<=hiX&&Math.max(p[1],r.points[j-1][1])>=loZ&&Math.min(p[1],r.points[j-1][1])<=hiZ));
  b.frontage=inferFrontage(b,nearRoads,nearBuildings);
 }
 return buildings;
}
module.exports={inside,closest,blocked,roadWidth,inferFrontage,assignFrontages};
