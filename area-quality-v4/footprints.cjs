'use strict';
// Polygon triangulation retains concave corners instead of replacing footprints by boxes.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2;
function triangulate(input){
 const p=input.map(p=>p.slice());if(Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-7)p.pop();
 for(let i=p.length-1;i>=0;i--)if(p.length>3&&Math.abs(cross(p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]))<1e-9)p.splice(i,1);
 if(area(p)<0)p.reverse();const ids=p.map((_,i)=>i),triangles=[];
 while(ids.length>3){let found=false;for(let j=0;j<ids.length;j++){
  const ia=ids[(j+ids.length-1)%ids.length],ib=ids[j],ic=ids[(j+1)%ids.length],a=p[ia],b=p[ib],c=p[ic];
  if(cross(a,b,c)<=1e-10)continue;
  if(ids.some(k=>k!==ia&&k!==ib&&k!==ic&&cross(a,b,p[k])>=-1e-10&&cross(b,c,p[k])>=-1e-10&&cross(c,a,p[k])>=-1e-10))continue;
  triangles.push([a,b,c]);ids.splice(j,1);found=true;break;
 }if(!found)throw Error('Cannot triangulate footprint');}
 triangles.push(ids.map(i=>p[i]));return{polygon:p,triangles};
}
function compile(data){
 const rejected=[],buildings=[];
 for(const b of data.buildings){try{
  const t=triangulate(b.points),footprintArea=area(t.polygon);
  if(footprintArea<.008)throw Error('footprint too small');
  const trianglesArea=t.triangles.reduce((s,t)=>s+Math.abs(cross(...t))/2,0);
  if(Math.abs(footprintArea-trianglesArea)>1e-6)throw Error('triangulation area mismatch');
  let best=null;
  // Minimum-area oriented rectangle supplies roof axes; walls still use the exact polygon.
  for(let i=0;i<t.polygon.length;i++){
   const a=t.polygon[i],c=t.polygon[(i+1)%t.polygon.length],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(l<1e-8)continue;
   const u=[(c[0]-a[0])/l,(c[1]-a[1])/l],v=[-u[1],u[0]],us=t.polygon.map(p=>p[0]*u[0]+p[1]*u[1]),vs=t.polygon.map(p=>p[0]*v[0]+p[1]*v[1]);
   const loU=Math.min(...us),hiU=Math.max(...us),loV=Math.min(...vs),hiV=Math.max(...vs),score=(hiU-loU)*(hiV-loV);
   if(!best||score<best.score)best={u,v,loU,hiU,loV,hiV,score};
  }
  const center=t.polygon.reduce((s,p)=>[s[0]+p[0]/t.polygon.length,s[1]+p[1]/t.polygon.length],[0,0]);
  const levels=Number.isFinite(b.levels)&&b.levels>0?b.levels:2;
  buildings.push({...b,...t,center,axes:best,footprintArea,levels,height:levels*3/20,heightSource:b.levels?'OSM levels × assumed 3m':'assumed two storeys, 3m/storey',roofSource:'inferred, not surveyed'});
 }catch(e){rejected.push({id:b.id,reason:e.message});}}
 return{...data,buildings,rejected};
}
module.exports={compile,triangulate,area};
