'use strict';
// Isolated canopy study: preserve all authored architecture and site positions.
// The legacy generator consumes exactly the same random sequence; only tree instances are replaced.
const crypto=require('node:crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports=function(source){
 if(sha(source)!=='638cbe336981a49addd8d189067bcbc0cd8287562937b205602aa85daad28d6d')throw Error('Unexpected v5.3 scene; refusing approximate replacement');
 const begin=source.indexOf(' function tree(x,z,s=1'),end=source.indexOf('\n function pine(',begin);
 if(begin<0||end<begin)throw Error('Cannot locate the reviewed tree generator');
 const original=source.slice(begin,end).replace('function tree(','function legacyTree(');
 const replacement=String.raw`
 // New broadleaf crowns use branching, open asymmetric fans instead of stacked balls.
 const canopyLobe=sph('v54-sculpted-leaf-cushions',14,10,.07),blossomLobe=sph('v54-blossom-sprays',14,10,.045);
 function tree(x,z,s=1,type='green',lod=0){
  const starts=scene.meshes.map(m=>[m,m.instances.length]);
  legacyTree(x,z,s,type,lod); // Preserve random state, planting positions, and the centres exclusion map.
  let state=(Math.imul(Math.round(x*1000),73856093)^Math.imul(Math.round(z*1000),19349663)^Math.round(s*10000))>>>0;
  const R=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const r=(a,b)=>a+(b-a)*R(),y=ground(x,z),bloom=type!=='green',species=R(),ang=r(0,Math.PI*2);
  // Retain a minority of compact broadleaf trees for contrast with spreading crowns.
  if(!bloom&&species<.24)return;
  for(const [m,n]of starts)m.instances.length=n;
  const h=s*r(bloom?2.05:2.25,bloom?2.75:3.15),spread=s*r(bloom?1.0:.9,bloom?1.35:1.15);
  const palettes=type==='pink'?['#efb3c4','#edafc4','#f1c0cb','#e5a7bd']:type==='cream'?['#e6ceaa','#eddabc','#f0dfc4']:['#718b4c','#7d964f','#92a45b','#668245','#829e59'];
  const base=rgb(palettes[Math.floor(R()*palettes.length)]),bark=bloom?'#86674d':'#786347';
  const tint=(v,top=0)=>base.map((c,k)=>clamp(c*v+(bloom?.012:0)+top*(k===2?.006:.014),0,1));
  const lean=[Math.cos(ang)*s*r(.10,.23),Math.sin(ang)*s*r(.10,.23)];
  const p0=[x,y,z],p1=[x+lean[0]*.35,y+h*.36,z+lean[1]*.35],p2=[x+lean[0],y+h*.66,z+lean[1]];
  pole(p0,p1,s*.092,bark,true);pole(p1,p2,s*.064,bark,true);
  // Each species has a different crown habit. Tree locations are still the authored planting, not a tree survey.
  const arms=lod?4:(bloom?5:(species>.74?6:5)),a0=ang;
  for(let k=0;k<arms;k++){
   const a=a0+k*2.399963+r(-.22,.22),leader=k===arms-1;
   const reach=spread*(leader?r(.12,.30):r(.55,.98));
   const elevation=h*(leader?r(.91,1.05):(bloom?r(.63,.83):r(.60,.93)));
   const centre=[x+lean[0]+Math.cos(a)*reach,y+elevation,z+lean[1]+Math.sin(a)*reach];
   const fork=[x+lean[0]*.8+Math.cos(a)*reach*.38,y+elevation*.77,z+lean[1]*.8+Math.sin(a)*reach*.38];
   pole(k%2?p2:p1,fork,s*(leader?.047:.050),bark,true);
   pole(fork,centre,s*.030,bark,true);
   const radius=s*(leader?r(.47,.60):r(.48,.67));
   const canopyRotation=Q.y(a+r(-.3,.3));
   // Low overlapping cushions form an organic cluster with visible voids between major boughs.
   const count=lod?5:7;
   for(let j=0;j<count;j++){
    const aa=j*2.399963+r(-.18,.18),rad=j===0?0:radius*r(.37,.69);
    const cc=[centre[0]+Math.cos(aa)*rad,centre[1]+(j===0?radius*.20:r(-.09,.19)*radius),centre[2]+Math.sin(aa)*rad];
    const rr=radius*(j===0?.71:r(.45,.65));
    const vertical=rr*(bloom?r(.66,.83):r(.86,1.19));
    const colour=tint(r(.96,1.025),j===0?.7:0);
    I(lod?distant:(bloom?blossomLobe:canopyLobe),cc,[rr*r(.92,1.19),vertical,rr*r(.85,1.08)],colour,canopyRotation,4);
    if(!lod&&bloom&&j>1&&j%2===0){
     // Two smaller terminal sprays soften the edge, not a uniform ring of beads.
     const a2=aa+.3,cr=rr*.42,cp=[cc[0]+Math.cos(a2)*rr*.72,cc[1]+rr*.25,cc[2]+Math.sin(a2)*rr*.72];
     I(flower,cp,[cr,cr*.82,cr*.91],tint(1.04,.35),Q.y(a2),4);
    }
   }
  }
  if(!lod){
   // Surface roots follow the slope and disappear under a small mixed ground-cover patch.
   for(let j=0;j<3;j++){
    const a=ang+j*2.13,xx=x+Math.cos(a)*s*.42,zz=z+Math.sin(a)*s*.42;
    pole([x,y+s*.05,z],[xx,ground(xx,zz)+.025,zz],s*.026,bark,true);
    I(tiny,[xx,ground(xx,zz)+s*.09,zz],[s*.17,s*.11,s*.19],rgb('#7c9252'),Q.y(a),4);
   }
  }
 }
`;
 let result=source.slice(0,begin)+original+replacement+source.slice(end);
 result=result.replace("scene.revision='quality-v5.3'","scene.revision='quality-v5.4-study'");
 return result;
};
