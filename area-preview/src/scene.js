/* Kiyomizu-dera / architectural miniature v5.
 * Procedural, rotatable geometry. No reference-image planes or generated imagery.
 * Architectural composition follows the official inventory (nine by seven bays,
 * hipped bark roof, two frontal wings and an uncovered projecting stage).
 * Dimensions and terrain are authored interpretations, NOT a measured survey.
 */
'use strict';
function makeStudy(){
 const scene=new SceneModel();let seed=401637;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const range=(a,b)=>a+(b-a)*rnd(),pick=a=>a[Math.floor(rnd()*a.length)];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
 const blend=(a,b,t)=>rgb(a).map((v,i)=>v*(1-t)+rgb(b)[i]*t);
 const C={timber:'#8c6447',sunwood:'#b08a60',dark:'#5c4430',floor:'#b39265',rail:'#b4a18a',paper:'#ded6bc',roof:'#8c705b',bark:'#725640',stone:'#b7b9a6',ground:'#a8b77c',greens:['#527341','#6e894a','#829b53','#95a860','#4e7345','#a1b475'],pinks:['#e5a0b5','#efb1c5','#f5c5ce','#e599b2','#f5d0d3'],cream:['#e4c892','#ead3a9','#f0ddbc']};
 const mesh=name=>scene.add(new MeshData(name));
 // Canonical bevelled solids. Reused by thousands of instances.
 function roundedBox(name,b){const m=mesh(name),grid=[-.5,-.5+b,.5-b,.5],faces=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,1,0],[0,0,-1]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
  for(const[n,u,v]of faces){const p=(a,c)=>{const q=V.add(V.mul(n,.5),V.add(V.mul(u,a),V.mul(v,c))),o=q.map(x=>clamp(x,-.5+b,.5-b)),nn=V.unit(V.sub(q,o));return[V.add(o,V.mul(nn,b)),nn];};for(let i=0;i<3;i++)for(let j=0;j<3;j++){const a=p(grid[i],grid[j]),c=p(grid[i+1],grid[j]),d=p(grid[i+1],grid[j+1]),e=p(grid[i],grid[j+1]);m.tri(a[0],c[0],d[0],a[1],c[1],d[1]);m.tri(a[0],d[0],e[0],a[1],d[1],e[1]);}}return m;}
 const timber=roundedBox('rounded-timber',.065),stone=roundedBox('weathered-stone',.16),slab=roundedBox('thin-planks',.022);
 function sph(name,seg,rings,lobes=0){const m=mesh(name),P=(u,v)=>{let a=u*Math.PI,b=v*2*Math.PI,ss=Math.sin(a),r=1+lobes*(Math.sin(3*b+.3)*Math.pow(ss,2)*.6+Math.cos(5*b-a*3)*ss*.35);return[r*ss*Math.cos(b),Math.cos(a)*(1+lobes*.2*Math.sin(b*4)*ss),r*ss*Math.sin(b)];};
  const N=(u,v)=>{if(u<.00001)return[0,1,0];if(u>.99999)return[0,-1,0];let n=V.unit(V.cross(V.sub(P(u+.0001,v),P(u-.0001,v)),V.sub(P(u,v+.0001),P(u,v-.0001))));return V.dot(n,P(u,v))<0?V.mul(n,-1):n;};
  for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){let u=i/rings,v=j/seg,uu=(i+1)/rings,vv=(j+1)/seg;m.tri(P(u,v),P(uu,v),P(uu,vv),N(u,v),N(uu,v),N(uu,vv));m.tri(P(u,v),P(uu,vv),P(u,vv),N(u,v),N(uu,vv),N(u,vv));}return m;}
 const leaf=sph('rounded-foliage',12,8,.11),flower=sph('cherry-blossom-clusters',12,8,.06),largeLeaf=sph('smooth-near-canopy',18,12,.05),largeFlower=sph('smooth-near-blossom-crowns',20,12,.035),tiny=sph('small-rounded-details',8,5,.015),distant=sph('distant-canopy',9,6,.07);
 function cylinder(name,top=1,n=12){let m=mesh(name);for(let k=0;k<n;k++){let a=k*6.283185/n,b=(k+1)*6.283185/n,p=(q,y,r)=>[Math.cos(q)*r,y,Math.sin(q)*r],na=V.unit([Math.cos(a),1-top,Math.sin(a)]),nb=V.unit([Math.cos(b),1-top,Math.sin(b)]);m.tri(p(a,-.5,1),p(b,-.5,1),p(b,.5,top),na,nb,nb);m.tri(p(a,-.5,1),p(b,.5,top),p(a,.5,top),na,nb,na);m.tri([0,.5,0],p(a,.5,top),p(b,.5,top),[0,1,0]);m.tri([0,-.5,0],p(b,-.5,1),p(a,-.5,1),[0,-1,0]);}return m;}
 const round=cylinder('round-columns'),trunk=cylinder('tapered-branches',.63),pineMesh=mesh('cedar-crowns');
 const pp=[[-.5,.83],[-.42,1],[-.25,.84],[.02,.6],[.27,.32],[.5,.025]];
 for(let j=0;j<pp.length-1;j++)for(let k=0;k<12;k++){const p=(i,a)=>[Math.cos(a)*pp[i][1],pp[i][0],Math.sin(a)*pp[i][1]],n=(i,a)=>V.unit([Math.cos(a),.8,Math.sin(a)]),a=k*6.283185/12,b=(k+1)*6.283185/12;pineMesh.tri(p(j,a),p(j,b),p(j+1,b),n(j,a),n(j,b),n(j+1,b));pineMesh.tri(p(j,a),p(j+1,b),p(j+1,a),n(j,a),n(j+1,b),n(j+1,a));}
 let group='landscape';const I=(m,p,s,c,q=[0,0,0,1],mat=0)=>{scene.instance(m,p,s,c,q,mat);const i=m.instances.at(-1);i.group=group;return i;};
 const box=(p,s,c=C.timber,r=0,mat=1)=>I(mat===3?stone:timber,p,s,c,Q.y(r),mat);
 const plate=(p,s,c=C.floor,r=0,mat=1)=>I(slab,p,s,c,Q.y(r),mat);
 const beam=(a,b,w,c=C.timber,d=w)=>I(timber,V.mul(V.add(a,b),.5),[w,Math.hypot(...V.sub(b,a)),d],c,Q.fromY(V.sub(b,a)),1);
 const pole=(a,b,r,c=C.timber,taper=false)=>I(taper?trunk:round,V.mul(V.add(a,b),.5),[r,Math.hypot(...V.sub(b,a)),r],c,Q.fromY(V.sub(b,a)),1);
 const ball=(p,s,c,m=leaf,mat=4)=>I(m,p,s,c,Q.y(range(0,6.28)),mat);
 const polyline=(pts,r,c,mat=1)=>{for(let i=0;i<pts.length-1;i++)pole(pts[i],pts[i+1],r,c);};
 // A continuous wooded escarpment. The main stage stands over the lower slope.
 function ground(x,z){let plateau=5.10*smooth((-z+.9)/6.6);let east=4.3*Math.exp(-Math.pow((x-20)/13,2))*smooth((-z+6)/10);let north=2.7*smooth((-z-11)/17);let v=2.15+plateau+east+north+.15*Math.sin(x*.48)*Math.cos(z*.35);let back=smooth((-z-2.9)/1.8)*smooth((z+10.8)/2.2)*smooth((10.0-Math.abs(x))/1.8);v=v*(1-back)+7.05*back;return v;}
 const terrain=mesh('continuous-wooded-escarpment');const T=(i,j)=>{let x=-62+i*.65,z=-49+j*.65;return[x,ground(x,z),z];};const N=p=>V.unit([ground(p[0]-.06,p[2])-ground(p[0]+.06,p[2]),.12,ground(p[0],p[2]-.06)-ground(p[0],p[2]+.06)]);
 for(let i=0;i<165;i++)for(let j=0;j<135;j++){let a=T(i,j),b=T(i+1,j),c=T(i+1,j+1),d=T(i,j+1);terrain.tri(a,d,c,N(a),N(d),N(c));terrain.tri(a,c,b,N(a),N(c),N(b));}I(terrain,[0,0,0],[1,1,1],'#9cab76',undefined,0);
 const FL=7.7;group='main-hall';
 // Main nine-bay hall: proportions are referenced, not an architectural measurement.
 // No invented central gable: the two projecting wings frame an uncovered stage.
 const cols=Array.from({length:10},(_,i)=>-6.75+i*1.5);
 for(let i=0;i<10;i++)for(let j=0;j<5;j++){let x=cols[i],z=-7.4+j*1.9,y=ground(x,z);box([x,y+.08,z],[.48,.20,.48],C.stone,0,3);pole([x,y+.17,z],[x,FL-.18,z],.135,C.dark);}
 const sx=Array.from({length:6},(_,i)=>-3.65+i*1.46),sz=[1.12,2.85,4.58];
 for(const x of sx)for(const z of sz){let y=ground(x,z);box([x,y+.11,z],[.5,.24,.48],C.stone,range(-.1,.1),3);pole([x,y+.21,z],[x,FL-.12,z],.16,C.dark);for(let h=1.7;h<FL-.25;h+=1.44)if(h>y+.2){box([x,h,z],[.41,.20,.43],C.timber);}}
 for(let h=1.9;h<FL-.20;h+=1.44){for(let z of sz)beam([-4.05,h,z],[4.05,h,z],.19,C.timber,.25);for(let x of sx)beam([x,h,.7],[x,h,5.1],.17,C.dark,.22);}
 // Horizontal nuki ties, not an arbitrary X-brace scaffolding silhouette.
 for(let z of [-6.9,-4.5,-2.1,.45])for(let h=3.3;h<FL;h+=1.44){beam([-7.2,h,z],[7.2,h,z],.21,C.dark,.25);}
 for(const x of cols)for(let h=3.3;h<FL;h+=1.44)beam([x,h,-7.8],[x,h,1.2],.19,C.timber,.25);
 plate([0,FL-.23,-3.35],[14.9,.4,9.1],C.dark);plate([0,FL-.18,3.04],[8.2,.34,3.86],C.sunwood);
 // Individual hinoki floorboards, visible edge, varied but never checkerboard.
 for(let i=0;i<73;i++){let x=-7.27+i*.202;plate([x,FL+.012,-3.36],[.195,.065,9.04],blend('#b69670','#bfa17a',rnd()*.8));}
 for(let i=0;i<42;i++){let x=-4.08+i*.199;plate([x,FL+.016,3.05],[.192,.062,3.86],blend('#b7976b','#c1a67b',rnd()*.6));}
 // Deep inner wall and lattice shutters create genuine parallax through the veranda.
 box([0,FL+1.47,-3.5],[12.85,2.94,5.8],C.dark);
 for(let i=0;i<9;i++){let x=-6+i*1.5;plate([x,FL+1.16,-.45],[1.35,1.96,.08],'#3e3328');for(let j=0;j<7;j++)plate([x-.60+j*.20,FL+1.31,-.36],[.035,1.82,.05],C.sunwood);for(let j=0;j<5;j++)plate([x,FL+.43+j*.41,-.315],[1.32,.028,.05],C.timber);
  // Raised upper shutters (shitomido) under the roof overhang.
  const shutter=plate([x,FL+2.38,.18],[1.38,.065,1.18],'#74583e');shutter.q=Q.axis([1,0,0],.10);
  for(let j=0;j<7;j++)plate([x-.6+j*.20,FL+2.43,.18],[.024,.028,1.16],C.dark);
 }
 // Nine-bay colonnade and bracket sets.
 for(let i=0;i<10;i++){let x=cols[i],z=.70;pole([x,FL+.04,z],[x,FL+2.78,z],.13,C.timber);box([x,FL+.10,z],[.34,.14,.34],C.dark);for(let j=0;j<3;j++){box([x,FL+2.52+j*.14,z],[.45+j*.14,.13,.32+j*.20],j%2?C.sunwood:C.timber);}
  for(let s of[-1,1])beam([x,FL+2.19,z],[x+s*.38,FL+2.60,z],.076,C.sunwood,.105);
  for(let side of[-1,1]){
   box([x+side*.25,FL+2.58,z+.05],[.10,.11,.36],'#8c6749');
   pole([x+side*.24,FL+2.58,z+.22],[x+side*.24,FL+2.58,z+.245],.024,'#b89466');
  }

 }
 for(let h of [FL+.16,FL+2.30,FL+2.76])beam([-7.2,h,.7],[7.2,h,.7],h>FL+2.5?.22:.13,C.timber,.24);
 for(let x of[-3,0,3]){
  pole([x,FL+2.75,.22],[x,FL+2.30,.22],.012,'#5e5541');
  ball([x,FL+2.13,.22],[.10,.17,.10],'#b7a77d',tiny,1);
  box([x,FL+2.30,.22],[.22,.05,.22],'#625540');box([x,FL+1.97,.22],[.18,.05,.18],'#625540');
 }
 for(let s of[-1,1])for(let j=0;j<7;j++){let z=-7.4+j*1.25,x=s*6.72;pole([x,FL,z],[x,FL+2.8,z],.13,C.timber);plate([x,FL+1.2,z],[.09,2.0,1.18],C.paper);for(let t=0;t<5;t++)plate([x+s*.07,FL+.37+t*.42,z],[.04,.035,1.2],C.dark);}
 // Smooth bark-roof surface; all ridges, layered edges and rafter tips are geometry.
 function hip(name,cx,cz,w,d,y,h,ridge=.34,color=C.roof){const m=mesh(name),edge=mesh(name+'-laminated-edge');
  function P(u,t,side,off=0){let x,z;if(side<2){x=u*w*(ridge*(1-t)+.5*t);z=(side===0?1:-1)*d*.5*t;}else{x=(side===2?1:-1)*w*(ridge*(1-t)+.5*t);z=u*d*.5*t;}
   const corner=Math.pow(Math.abs(u),7)*Math.pow(t,5)*.16;
   const profile=h*(1-t)+h*.13*Math.sin(t*Math.PI)-.19*Math.sin(t*Math.PI*.5)+.17*Math.pow(t,8);
   return[cx+x,y+profile+corner+off,cz+z];}
  const normal=(u,t,side)=>{let n=V.unit(V.cross(V.sub(P(u+.0001,t,side),P(u-.0001,t,side)),V.sub(P(u,t+.0001,side),P(u,t-.0001,side))));return n[1]<0?V.mul(n,-1):n;};
  for(let s=0;s<4;s++)for(let i=0;i<48;i++)for(let j=0;j<34;j++){let u=-1+i/24,uu=u+1/24,t=j/34,tt=(j+1)/34;const a=P(u,t,s),b=P(uu,t,s),c=P(uu,tt,s),e=P(u,tt,s);m.tri(a,b,c,normal(u,t,s),normal(uu,t,s),normal(uu,tt,s),[u*w,t*d],[uu*w,t*d],[uu*w,tt*d]);m.tri(a,c,e,normal(u,t,s),normal(uu,tt,s),normal(u,tt,s),[u*w,t*d],[uu*w,tt*d],[u*w,tt*d]);}
  I(m,[0,0,0],[1,1,1],color,undefined,2);
  for(let s=0;s<4;s++)for(let i=0;i<96;i++){let u=-1+i/48,uu=u+1/48,a=P(u,1,s),b=P(uu,1,s);for(let k=0;k<5;k++){let dd=.038*k;edge.quad([a[0],a[1]-dd,a[2]],[b[0],b[1]-dd,b[2]],[b[0],b[1]-dd-.032,b[2]],[a[0],a[1]-dd-.032,a[2]]);}}
  I(edge,[0,0,0],[1,1,1],'#664c3c',undefined,2);
  // Bark courses are shader detail; the layered fascia is physical geometry.
  // Ridge cap and corner hip seams.
  beam([cx-w*ridge-.08,y+h+.035,cz],[cx+w*ridge+.08,y+h+.035,cz],.105,'#68675d',.19);
  for(let i=0;i<Math.floor(w*ridge*2/.18);i++){let x=cx-w*ridge+i*.18;pole([x,y+h+.04,cz-.10],[x,y+h+.04,cz+.1],.043,'#77756b');}
  for(let s=0;s<2;s++)for(let u of[-1,1]){let pts=[];for(let k=0;k<=36;k++)pts.push(P(u,k/36,s,.025));polyline(pts,.027,'#9c7c5a');}
  for(let s=0;s<2;s++)for(let i=0;i<59;i++){let u=-.96+i*1.92/58,a=P(u,1,s,-.23),b=P(u,.88,s,-.25);beam(a,b,.046,C.dark,.075);}
  return P;
 }
 // The high, single hipped main roof. Lower roofs are wings/skirts, not a second floor.
 hip('main-yosemune-roof',0,-3.15,16.0,11.4,FL+2.86,3.70,.345,'#826650');
 // East/west/north mokoshi: independent lower eaves preserve the historic silhouette.
 for(let s of[-1,1]){
  const m=mesh('side-mokoshi-'+s);for(let i=0;i<48;i++)for(let j=0;j<12;j++){let z=-8.7+i*11.2/48,zz=z+11.2/48,t=j/12,tt=(j+1)/12,p=(q,a)=>[s*(6.25+a*2.25),FL+2.72-.75*a+.12*a*a*a,q];m.quad(p(z,t),p(zz,t),p(zz,tt),p(z,tt));}I(m,[0,0,0],[1,1,1],'#806551',undefined,2);
 }
 // Projecting irimoya wings: bowed bargeboards, gold openwork and two levels of rafters.
 function wing(cx,cz,w=3.5,d=5.4){const baseY=FL+2.8,rise=1.35,m=mesh('wing-roof-'+cx),fascia=mesh('wing-fascia-'+cx),xside=w*.5;
  function P(t,z,s,off=0){let x=s*t*xside;let yy=baseY+rise*Math.pow(1-t,1.5)+.18*Math.pow(t,8);return[cx+x,yy+off,cz+z];}
  const N=(t,s)=>V.unit([s*rise*1.5*Math.pow(Math.max(0,1-t),.5)/xside-s*1.44*Math.pow(t,7)/xside,1,0]);
  for(let s of[-1,1])for(let i=0;i<32;i++)for(let j=0;j<18;j++){let t=i/32,tt=(i+1)/32,z=-d/2+j*d/18,zz=z+d/18;m.tri(P(t,z,s),P(tt,z,s),P(tt,zz,s),N(t,s),N(tt,s),N(tt,s),[t*4,z],[tt*4,z],[tt*4,zz]);m.tri(P(t,z,s),P(tt,zz,s),P(t,zz,s),N(t,s),N(tt,s),N(t,s),[t*4,z],[tt*4,zz],[t*4,zz]);}
  I(m,[0,0,0],[1,1,1],'#806650',undefined,2);
  for(let s of[-1,1])for(let i=0;i<48;i++){let t=i/48,tt=(i+1)/48;for(let k=0;k<4;k++){let a=P(t,d/2,s,-k*.037),b=P(tt,d/2,s,-k*.037);fascia.quad(a,b,[b[0],b[1]-.033,b[2]],[a[0],a[1]-.033,a[2]]);}}
  I(fascia,[0,0,0],[1,1,1],'#604b3b',undefined,2);
  // Recessed triangular pediment, with visible curved gable in front.
  const face=mesh('gable-openwork-'+cx);face.tri([cx-w*.40,baseY+.15,cz+d/2-.11],[cx+w*.40,baseY+.15,cz+d/2-.11],[cx,baseY+rise-.16,cz+d/2-.11],[0,0,1]);I(face,[0,0,0],[1,1,1],'#43382a');
  for(let s of[-1,1]){let pts=[];for(let i=0;i<=40;i++)pts.push(P(i/40,d/2+.025,s,-.11));polyline(pts,.04,C.sunwood);for(let k=0;k<3;k++){let x=cx+s*(.15+.28*k),y=baseY+.38+.11*k;ball([x,y,cz+d/2-.06],[.13,.08,.035],'#c4a75c',tiny,1);beam([cx,baseY+.23,cz+d/2-.025],[x,y,cz+d/2-.025],.026,'#b7a067');}}
  beam([cx,baseY+.22,cz+d/2-.03],[cx,baseY+rise-.20,cz+d/2-.03],.07,C.sunwood,.075);
  for(let side of[-1,1]){
   const path=[];for(let k=0;k<22;k++){let t=k/21;path.push([cx+side*(.10+.65*t),baseY+.31+.25*Math.sin(t*Math.PI),cz+d/2-.016]);}polyline(path,.020,'#bd9b51');
   for(let k=1;k<6;k++){let t=k/6,x=cx+side*(.10+.65*t),y=baseY+.31+.25*Math.sin(t*Math.PI),z=cz+d/2+.002;
    for(let j=0;j<2;j++){let p=[x+side*.036,y+.054+j*.04,z],o=ball(p,[.027,.075,.018],j?'#bfa05e':'#cfb375',tiny,1);o.q=Q.axis([0,0,1],side*(.55-j*.5));}
   }
  }
  // Fine gable rafter ends, a hanging pendant, and ridge-end caps.
  for(let side of[-1,1])for(let k=1;k<15;k++){let t=k/15,p=P(t,d/2-.04,side,-.19);pole([p[0],p[1],p[2]],[p[0],p[1]-.08,p[2]],.021,'#ad865f');}
  pole([cx,baseY+rise-.23,cz+d/2+.025],[cx,baseY+rise-.48,cz+d/2+.025],.025,'#b79b65');
  ball([cx,baseY+rise-.43,cz+d/2+.027],[.09,.115,.035],'#b89d61',tiny,1);

  // Small hipped lower eave on the front of each wing.
  const lip=mesh('wing-front-eave-'+cx);for(let i=0;i<36;i++)for(let j=0;j<8;j++){const p=(u,t)=>[cx+u*(w*.5+.22*t),baseY+.18-.44*t+.14*t*t+Math.pow(Math.abs(u),5)*.12,cz+d/2-.60+t*1.12];let u=-1+i/18,uu=u+1/18,t=j/8,tt=(j+1)/8;lip.quad(p(u,t),p(uu,t),p(uu,tt),p(u,tt));}I(lip,[0,0,0],[1,1,1],'#8f7056',undefined,2);
  for(let s of[-1,1])for(let k=0;k<4;k++){let x=cx+s*w*.37,z=cz-d*.36+k*d*.24;pole([x,FL+.04,z],[x,baseY-.15,z],.115,C.timber);box([x,baseY-.1,z],[.49,.19,.42],C.sunwood);}
  plate([cx,FL-.12,cz],[w*.84,.28,d*.91],C.sunwood);
  for(let i=0;i<18;i++)plate([cx-w*.40+i*w*.80/17,FL+.012,cz],[w*.80/18-.008,.06,d*.9],blend('#ab8d67','#bba17b',rnd()*.4));
  beam([cx-w*.48,baseY-.26,cz+d*.44],[cx+w*.48,baseY-.26,cz+d*.44],.16,C.timber,.21);
  beam([cx,baseY+rise+.035,cz-d/2],[cx,baseY+rise+.035,cz+d/2],.09,'#68675d',.16);
  for(let i=0;i<25;i++)pole([cx-.09,baseY+rise+.065,cz-d/2+i*d/24],[cx+.09,baseY+rise+.065,cz-d/2+i*d/24],.032,'#8b8c7d');
 }
 wing(-5.60,1.0,3.7,5.7);wing(5.60,1.0,3.7,5.7);
 function railing(a,b,h=.65){const length=Math.hypot(...V.sub(b,a)),nn=Math.ceil(length/.62);for(let k=0;k<=nn;k++){let p=V.add(a,V.mul(V.sub(b,a),k/nn));box([p[0],p[1]+h*.48,p[2]],[.095,h,.095],C.rail);if(k===0||k===nn||k%4===0){pole([p[0],p[1]+h-.025,p[2]],[p[0],p[1]+h+.08,p[2]],.065,'#6e776d');ball([p[0],p[1]+h+.12,p[2]],[.067,.083,.067],'#788174',tiny,1);ball([p[0],p[1]+h+.19,p[2]],[.034,.046,.034],'#788174',tiny,1);}}
 for(let yy of [h*.19,h*.53,h])beam(V.add(a,[0,yy,0]),V.add(b,[0,yy,0]),yy===h?.105:.065,C.rail,yy===h?.12:.08);}
 railing([-4.10,FL+.03,4.98],[4.10,FL+.03,4.98]);railing([-4.1,FL+.03,4.98],[-4.1,FL+.03,3.62]);railing([4.1,FL+.03,4.98],[4.1,FL+.03,3.62]);
 for(let s of[-1,1]){railing([s*4.1,FL+.03,3.62],[s*7.42,FL+.03,3.62]);railing([s*7.42,FL+.03,3.62],[s*7.42,FL+.03,-7.95]);}
 // West covered approach, kept behind the stage rather than a fictional frontal stair.
 plate([-10.0,FL-.1,-3.7],[5.1,.25,2.1],C.floor);for(let x=-12.3;x<-7.4;x+=.83){pole([x,FL,-2.75],[x,FL+1.9,-2.75],.075,C.timber);pole([x,FL,-4.65],[x,FL+1.9,-4.65],.075,C.timber);}hip('west-approach-roof',-10.0,-3.7,5.7,2.7,FL+1.95,.95,.29,'#8c725e');railing([-12.4,FL,-2.65],[-7.6,FL,-2.65],.57);
 group='landscape';
 // Lower path follows the escarpment; no invented water garden under the stage.
 const pathPoints=[[-32,16],[-25,13],[-20,11],[-14,10],[-8,9.4],[-1,9.2],[6,9.7],[13,10.5],[19,8.2],[24,4],[28,-1]];
 function cat(points){let out=[];for(let i=0;i<points.length-1;i++)for(let k=0;k<12;k++){let t=k/12,p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];out.push([0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t*t+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t*t*t)));}return out;}
 const walk=cat(pathPoints);const distance=(x,z,path=walk)=>{let d=1e9;for(let i=0;i<path.length;i++)d=Math.min(d,Math.hypot(x-path[i][0],z-path[i][1]));return d;};
 function pathMesh(name,points,w,color){let m=mesh(name);for(let i=0;i<points.length-1;i++){let a=points[i],b=points[i+1],dir=V.unit([b[0]-a[0],0,b[1]-a[1]]),p=(q,s)=>[q[0]+dir[2]*s*w/2,ground(q[0]+dir[2]*s*w/2,q[1]-dir[0]*s*w/2)+.05,q[1]-dir[0]*s*w/2];m.quad(p(a,-1),p(b,-1),p(b,1),p(a,1));}I(m,[0,0,0],[1,1,1],color,undefined,3);}
 pathMesh('lower-path-stone-border',walk,2.10,'#a9ab98');pathMesh('lower-path-paving',walk,1.88,'#ded5bd');
 for(let k=0;k<walk.length;k+=2){let [x,z]=walk[k];let p=walk[Math.min(k+1,walk.length-1)],ang=Math.atan2(p[0]-x,p[1]-z);for(let s of[-1,1]){let xx=x+Math.cos(ang)*s*1.0,zz=z-Math.sin(ang)*s*1.0;box([xx,ground(xx,zz)+.08,zz],[.37,.13,.22],pick(['#b4b5a2','#c5c4b0','#bfc0ad']),ang,3);}}
 // West hillside stair has many small treads; its relation is illustrative, not a visitor route.
 const stair=[[-14.4,FL-.06,-4.0],[-15.8,ground(-15.8,7.5)+.08,7.5]],steps=37;
 for(let k=0;k<steps;k++){let a=V.add(stair[0],V.mul(V.sub(stair[1],stair[0]),k/steps)),b=V.add(stair[0],V.mul(V.sub(stair[1],stair[0]),(k+1)/steps)),ang=Math.atan2(b[0]-a[0],b[2]-a[2]);box([a[0],a[1]-.12,a[2]],[1.5,.24,.35],'#c9c7b3',ang,3);for(let s of[-1,1])box([a[0]+s*.86,a[1]-.28,a[2]],[.24,.52,.41],pick(['#aaa995','#b8b6a1']),ang,3);}
 // Rockfall and layered stone, irregular silhouettes rather than masonry wallpaper.
 for(let k=0;k<160;k++){let x=range(-19,22),z=range(-1,8);if(Math.abs(x)<8.4&&z<5.6)continue;let y=ground(x,z),s=range(.14,.48);box([x,y+s*.24,z],[s*1.6,s*.65,s],pick(['#a9ac91','#b7b8a1','#c1bdac']),range(-.5,.5),3);}
 // Ground-cover crown modules. Placement excludes architecture and path corridors.
 const centres=[];function free(x,z){if(x>-8.8&&x<8.8&&z>-9.6&&z<5.7)return false;if(x>-13.5&&x<-7.5&&z>-5.5&&z<-2.3)return false;if(Math.abs(x+15.2)<1.5&&z>-5&&z<8)return false;return distance(x,z)>1.45;}
 function tree(x,z,s=1,type='green',lod=0){
  const y=ground(x,z),h=s*range(2.0,2.65),r=s*range(.94,1.22),palette=type==='pink'?C.pinks:type==='cream'?C.cream:C.greens,isFlower=type!=='green';centres.push([x,z,r]);const offset=range(0,6.28),lean=range(-.12,.12);
  pole([x,y,z],[x+lean,y+h*.78,z],s*.095,'#7b6348',true);
  // A tall, overlapping canopy with an irregular lower silhouette; no flat umbrellas.
  const crowns=[[0,1.04,0,.57]];
  for(let k=0;k<6;k++){const a=k*2.399+offset;crowns.push([Math.cos(a)*r*.50,.87+range(-.035,.045),Math.sin(a)*r*.50,.49]);}
  for(let k=0;k<7;k++){const a=k*2.399+offset+.6;crowns.push([Math.cos(a)*r*.74,.69+range(-.065,.055),Math.sin(a)*r*.74,.43]);}
  for(let k=0;k<crowns.length;k++){const c=crowns[k],p=[x+c[0],y+h*c[1],z+c[2]],sz=s*c[3];if(k%3===0)pole([x+lean,y+h*.44,z],p,s*.032,'#93704e',true);
   const cc=pick(palette);ball(p,[sz*1.02,sz*.87,sz],cc,lod?distant:(isFlower?largeFlower:largeLeaf));
   if(!lod){const n=isFlower?5:3;for(let j=0;j<n;j++){const a=j*2.399+offset+k*.6,xx=p[0]+Math.cos(a)*sz*.68,zz=p[2]+Math.sin(a)*sz*.64,yy=p[1]+sz*range(-.13,.58),rr=sz*range(.42,.55);ball([xx,yy,zz],[rr,rr*.91,rr],pick(palette),isFlower?flower:leaf);}}
  }
  if(!lod)for(let j=0;j<5;j++){let a=j*2.4,xx=x+Math.cos(a)*s*.34,zz=z+Math.sin(a)*s*.34;ball([xx,ground(xx,zz)+s*.10,zz],[s*.23,s*.15,s*.23],pick(C.greens),tiny);}
 }

 function pine(x,z,s){let y=ground(x,z),h=s*3.8;pole([x,y,z],[x,y+h*.91,z],s*.085,'#816449',true);for(let k=0;k<7;k++){let w=s*(1-k*.105)*.72;I(pineMesh,[x,y+.8*s+k*s*.43,z],[w,s*.92,w],C.greens[(k+2)%C.greens.length],Q.y(k*.4),4);}}
 // Authored clusters, not a uniform grid. Stage front remains readable.
 const clusters=[[-12.8,1.8,2.3],[-10.8,6.5,2.6],[-6.7,7.2,2.1],[5.8,7.0,2.0],[10.8,5.3,3.2],[13.2,-1,3.2],[7.6,-11,3],[-6.5,-11.4,2.7],[-19.5,-7,3.1],[20,-13,4.0],[-20,17,3.4],[16,17,3.1]];
 for(let c=0;c<clusters.length;c++){let [cx,cz,rr]=clusters[c];for(let j=0;j<8;j++){let a=j*2.399+c*.4,rad=rr*Math.sqrt(j/8),x=cx+Math.cos(a)*rad,z=cz+Math.sin(a)*rad;if(!free(x,z)||centres.some(p=>Math.hypot(x-p[0],z-p[1])<.72))continue;let s=range(.83,1.25);tree(x,z,s,(j+c)%6<2?'pink':(j+c)%11===0?'cream':'green');}}
 for(let i=0;i<1200;i++){let x=range(-42,40),z=range(-35,24);if(!free(x,z)||centres.some(p=>Math.hypot(x-p[0],z-p[1])<1.5))continue;let lod=z<-7||Math.abs(x)>19,s=range(.9,1.5);if(x>-5.3&&x<5.3&&z>5&&z<8)s*=.40;if(rnd()<.18)pine(x,z,s*.82);else tree(x,z,s,rnd()<.25?'pink':(rnd()<.13?'cream':'green'),lod?1:0);}
 for(let i=0;i<125;i++){let x=range(-25,27),z=range(-5,20);if(!free(x,z))continue;let s=range(.18,.48),y=ground(x,z);for(let j=0;j<4;j++)ball([x+range(-.24,.24),y+s*.4,z+range(-.23,.23)],[s,s*.65,s*.92],pick(C.greens),tiny);}
 // Distant woodland recedes continuously rather than ending at the model patch.
 for(let i=0;i<560;i++){
  let x=range(-30,47),z=range(-48,-14);
  if(centres.some(p=>Math.hypot(x-p[0],z-p[1])<1.65))continue;
  tree(x,z,range(1.0,1.55),rnd()<.16?'pink':'green',1);
 }
 // Fine scattered vegetation on open slopes is sparse near structural supports.
 for(let i=0;i<400;i++){let x=range(-30,29),z=range(-13,24);if(!free(x,z))continue;let y=ground(x,z),s=range(.025,.07);ball([x,y+s*.5,z],[s*1.6,s*.9,s],pick(['#9ba66e','#bcc18a','#b1ba7b']),tiny);}
 // Human-scale figures, no faces or identifying details. Real 3D not billboards.
 const coats=['#a7b0a0','#c59882','#a4bbc0','#d6ba91','#b5a7b5','#687f80','#c4c0ab'];
 function person(x,y,z,s=.62,a=0){const col=pick(coats),skin=pick(['#cda889','#d8b99a','#be9574']);const local=(xx,yy,zz)=>[x+Math.cos(a)*xx+Math.sin(a)*zz,y+yy,z-Math.sin(a)*xx+Math.cos(a)*zz];plate(local(-s*.09,s*.22,0),[s*.10,s*.38,s*.12],'#6c7065',a);plate(local(s*.09,s*.22,.02),[s*.10,s*.38,s*.12],'#676e68',a);box(local(0,s*.54,0),[s*.34,s*.38,s*.21],col,a);ball(local(0,s*.87,0),[s*.12,s*.14,s*.12],skin,tiny,0);for(let side of[-1,1])pole(local(side*s*.23,s*.67,0),local(side*s*.26,s*.38,.035),s*.043,col);if(rnd()<.45){pole(local(0,s*.99,0),local(0,s*1.035,0),s*.18,'#d5c5a2');ball(local(0,s*1.04,0),[s*.11,s*.07,s*.10],'#d8c6a4',tiny,0);}}
 group='visitors';for(let i=0;i<32;i++){let x=range(-3.75,3.75),z=range(1.9,4.7);person(x,FL+.05,z,range(.53,.65),range(-1.5,2));}for(let i=0;i<16;i++)person(range(-6.4,6.4),FL+.05,range(-.2,.9),range(.53,.64),range(-1,3));for(let i=0;i<37;i++){let p=walk[Math.floor(range(2,walk.length-2))],x=p[0]+range(-.47,.47),z=p[1]+range(-.35,.35);person(x,ground(x,z)+.1,z,range(.52,.64),range(-2,3));}

 // --- Higashiyama / Gion area quality pass v2 ---------------------------------
 // Geographic anchors are derived from published coordinates, scaled for this
 // miniature at roughly 20 metres per scene unit. Roads and intermediate
 // footprints remain authored until GIS ingestion; landmark geometry is custom.
 group='higashiyama-area';
 const areaAnchor={kiyomizu:[0,-3],hokanji:[-26.22,16.62],kodaiji:[-17.72,28.84],yasaka:[-29.14,44.59]};
 scene.areaSites={
  scaleMetresPerUnit:20,
  geographicAnchors:{
   kiyomizu:{lat:34.99500,lon:135.78500,local:areaAnchor.kiyomizu},
   hokanji:{lat:34.99855,lon:135.77925,local:areaAnchor.hokanji},
   kodaiji:{lat:35.0007611,lon:135.7811139,local:areaAnchor.kodaiji},
   yasaka:{lat:35.00361,lon:135.77861,local:areaAnchor.yasaka}
  },
  placementAccuracy:'anchor-based landmarks; authored intermediate streets/buildings'
 };
 function areaRoad(name,pts,width=1.05,color='#d8ceb8',edge='#cbbda3'){
  for(let n=0;n<pts.length-1;n++){
   const a=pts[n],b=pts[n+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(len/.72));
   for(let k=0;k<steps;k++){
    const t=(k+.5)/steps,x=a[0]+dx*t,z=a[1]+dz*t,ang=Math.atan2(dx,dz);
    plate([x,ground(x,z)+.052,z],[width+.22,.055,len/steps+.11],edge,ang,0);
    plate([x,ground(x,z)+.082,z],[width,.052,len/steps+.10],color,ang,0);
   }
  }
 }
 function areaStoneWall(a,b,h=.7){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(len/.72)),ang=Math.atan2(dx,dz);
  for(let i=0;i<steps;i++){
   const t=(i+.5)/steps,x=a[0]+dx*t,z=a[1]+dz*t,y=ground(x,z);
   box([x,y+h*.46,z],[.70,h,.42],i%3===0?'#bbb7a7':i%3===1?'#c8c4b6':'#aaa89c',ang+(i%2?-.04:.04),3);
  }
 }
 function areaSteps(a,b,width=1.2,count=10){
  const dx=b[0]-a[0],dz=b[1]-a[1],ang=Math.atan2(dx,dz);
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,x=a[0]+dx*t,z=a[1]+dz*t,y=ground(x,z);
   plate([x,y+.08,z],[width,.11,Math.hypot(dx,dz)/count+.09],'#d5c9b4',ang,3);
  }
 }
 const eastSpine=[[-1,6],[-5,9],[-10,11.5],[-15,13.5],[-20,15.2],areaAnchor.hokanji,[-23.4,22.2],[-20.6,25.5],areaAnchor.kodaiji,[-21.8,35.3],[-25.0,39.6],areaAnchor.yasaka];
 areaRoad('higashiyama-spine',eastSpine,1.20,'#e7dcc8');
 const sannenzaka=[[-5,8.8],[-9,14],[-15.2,18.2],[-20.6,18.5]];
 const ninenzaka=[[-20.6,18.5],[-21.7,22.5],[-20.8,26.8],[-18.0,28.7]];
 const gionLink=[areaAnchor.kodaiji,[-20.5,34],[-24.8,39],areaAnchor.yasaka];
 areaRoad('sannenzaka',sannenzaka,.84,'#dfd1b8');areaRoad('ninenzaka',ninenzaka,.88,'#e2d4ba');areaRoad('gion-link',gionLink,1.08,'#e4d7bd');
 areaSteps([-12.2,15.3],[-15.8,18.4],1.05,11);areaSteps([-20.2,19.3],[-21.5,22.0],1.0,9);
 areaStoneWall([-13.0,12.5],[-20.7,15.1],.55);areaStoneWall([-20.2,23.0],[-18.8,28.0],.62);

 let areaHouseId=0;
 function areaMachiya(x,z,a=0,s=1,tone=0,variant=0){
  const y=ground(x,z),w=(1.58+variant*.08)*s,d=(1.15+(variant%2)*.17)*s,h=(1.28+(variant%3)*.10)*s;
  const wall=['#c9a77d','#b99571','#d0b58f','#b78e6e'][tone%4],trim=['#604a38','#70513d','#594536'][tone%3];
  box([x,y+h*.49,z],[w,h,d],wall,a,1);
  // true pitched miniature roof with layered eave
  hip('machiya-roof-'+areaHouseId,x,z,w*1.18,d*1.18,y+h*.93,.52*s,.26,variant%2?'#75675e':'#817168');
  plate([x,y+h*.26,z],[w*.92,.055,d+.04*s],trim,a,1);
  // front lattice / shop facade
  for(let j=-3;j<=3;j++){
   const xx=j*w*.115;
   plate([x+Math.cos(a)*xx,y+h*.47,z-Math.sin(a)*xx],[.032*s,.78*s,d+.055*s],trim,a,1);
  }
  for(let j=0;j<3;j++)plate([x,y+h*(.26+j*.22),z],[w*.92,.028*s,d+.06*s],trim,a,1);
  // noren / small shop sign
  if(variant%2===0){
   plate([x+Math.cos(a)*w*.24,y+h*.36,z-Math.sin(a)*w*.24],[w*.33,.32*s,d+.08*s],variant%4===0?'#9d6654':'#718b82',a,1);
  }
  // entrance stone and planter
  plate([x+Math.sin(a)*(d*.55),y+.04,z+Math.cos(a)*(d*.55)],[.48*s,.08,.36*s],'#bdb7a7',a,3);
  ball([x+Math.sin(a)*(d*.67)+Math.cos(a)*w*.32,y+.23,z+Math.cos(a)*(d*.67)-Math.sin(a)*w*.32],[.18*s,.24*s,.18*s],pick(C.greens),tiny,4);
  areaHouseId++;
 }
 function ribbonBuildings(pts,spacing=2.25){
  for(let n=0;n<pts.length-1;n++){
   const a=pts[n],b=pts[n+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),nx=-dz/len,nz=dx/len;
   const count=Math.max(1,Math.floor(len/spacing));
   for(let k=0;k<count;k++){
    const t=(k+.55)/count,cx=a[0]+dx*t,cz=a[1]+dz*t;
    for(const side of[-1,1]){
     if(rnd()<.11)continue;
     const off=2.02+range(.08,.62),x=cx+nx*off*side,z=cz+nz*off*side;
     if(Math.hypot(x-areaAnchor.hokanji[0],z-areaAnchor.hokanji[1])<3.5||Math.hypot(x-areaAnchor.kodaiji[0],z-areaAnchor.kodaiji[1])<4.2||Math.hypot(x-areaAnchor.yasaka[0],z-areaAnchor.yasaka[1])<5.0)continue;
     areaMachiya(x,z,ang+range(-.07,.07),range(.82,1.20),n+k+(side>0?1:0),(n*3+k+(side>0?2:0))%4);
    }
   }
  }
 }
 ribbonBuildings(eastSpine,2.45);ribbonBuildings(sannenzaka,2.10);ribbonBuildings(ninenzaka,2.05);ribbonBuildings(gionLink,2.35);

 function hokanjiPagoda(x,z,s=1){
  const y=ground(x,z),wood='#9a694a',deep='#704a36',roof='#625a57';
  for(let k=0;k<5;k++){
   const bodyW=(2.45-k*.18)*s,levelY=y+.54*s+k*.94*s;
   box([x,levelY,z],[bodyW*.58,.82*s,bodyW*.58],wood,0,1);
   // corner posts and balustrade
   for(const sx of[-1,1])for(const sz of[-1,1])pole([x+sx*bodyW*.23,levelY-.33*s,z+sz*bodyW*.23],[x+sx*bodyW*.23,levelY+.34*s,z+sz*bodyW*.23],.045*s,deep);
   hip('hokanji-roof-'+k,x,z,bodyW*1.26,bodyW*1.26,levelY+.35*s,.40*s,.24,roof);
   plate([x,levelY+.18*s,z],[bodyW*.88,.06*s,bodyW*.88],'#b08863',0,1);
  }
  pole([x,y+5.08*s,z],[x,y+6.12*s,z],.05*s,'#927246');
  for(let k=0;k<5;k++)ball([x,y+(6.18+k*.13)*s,z],[.10*s,.08*s,.10*s],'#c09b50',tiny,1);
  areaStoneWall([x-2.4*s,z-2.1*s],[x+2.3*s,z-2.1*s],.48*s);
 }
 hokanjiPagoda(areaAnchor.hokanji[0],areaAnchor.hokanji[1],1.06);

 function templeCompound(x,z,s=1){
  const y=ground(x,z),wood='#966b4d',roof='#72645c';
  // main hall
  box([x,y+.68*s,z],[4.6*s,1.36*s,2.95*s],wood,0,1);
  hip('kodaiji-main-roof',x,z,5.4*s,3.7*s,y+1.30*s,1.10*s,.30,roof);
  // front veranda and columns
  plate([x,y+.18*s,z+1.75*s],[5.0*s,.18*s,1.2*s],'#b58f65',0,1);
  for(let i=-3;i<=3;i++)pole([x+i*.65*s,y+.20*s,z+1.60*s],[x+i*.65*s,y+1.35*s,z+1.60*s],.05*s,'#76513b');
  // smaller side hall
  const sx=x+4.2*s,sz=z-.6*s,sy=ground(sx,sz);
  box([sx,sy+.50*s,sz],[2.5*s,1.0*s,1.85*s],'#a27857',-.08,1);
  hip('kodaiji-side-roof',sx,sz,3.0*s,2.35*s,sy+.95*s,.72*s,.28,'#75655d');
  // stone garden terrace and pond
  areaStoneWall([x-4.0*s,z+2.45*s],[x+5.0*s,z+2.45*s],.50*s);
  plate([x+3.2*s,ground(x+3.2*s,z+1.2*s)+.06,z+1.2*s],[4.8*s,.05*s,2.55*s],'#82b8bd',-.12,5);
  for(let j=0;j<16;j++){
   const a=j*2.399,rr=1.1*s*Math.sqrt((j+.4)/16),px=x+3.2*s+Math.cos(a)*rr,pz=z+1.2*s+Math.sin(a)*rr,py=ground(px,pz);
   ball([px,py+.18*s,pz],[.22*s,.16*s,.22*s],pick(C.greens),tiny,4);
  }
 }
 templeCompound(areaAnchor.kodaiji[0],areaAnchor.kodaiji[1],1.02);

 function areaTorii(x,z,s=1,a=0){
  const y=ground(x,z),c='#c9573f';
  for(const side of[-1,1])pole([x+Math.cos(a)*side*1.18*s,y,z-Math.sin(a)*side*1.18*s],[x+Math.cos(a)*side*1.18*s,y+2.48*s,z-Math.sin(a)*side*1.18*s],.12*s,c);
  const dx=Math.cos(a)*1.62*s,dz=-Math.sin(a)*1.62*s;
  beam([x-dx,y+2.18*s,z-dz],[x+dx,y+2.18*s,z+dz],.14*s,c,.17*s);
  beam([x-dx*1.10,y+2.60*s,z-dz*1.10],[x+dx*1.10,y+2.60*s,z+dz*1.10],.19*s,c,.20*s);
  for(const side of[-1,1])ball([x+Math.cos(a)*side*1.85*s,y+2.60*s,z-Math.sin(a)*side*1.85*s],[.10*s,.10*s,.10*s],'#d48a64',tiny,1);
 }
 areaTorii(areaAnchor.yasaka[0],areaAnchor.yasaka[1]-3.2,1.08,0);
 const yasakaY=ground(areaAnchor.yasaka[0],areaAnchor.yasaka[1]),yasakaX=areaAnchor.yasaka[0],yasakaZ=areaAnchor.yasaka[1];
 // Yasaka main massing with layered shrine details
 box([yasakaX,yasakaY+.78,yasakaZ],[6.2,1.56,3.8],'#b8553e',0,1);
 hip('yasaka-main-roof',yasakaX,yasakaZ,7.05,4.65,yasakaY+1.50,1.18,.29,'#685d57');
 plate([yasakaX,yasakaY+.17,yasakaZ+2.05],[6.4,.18,1.15],'#c48658',0,1);
 for(let i=-4;i<=4;i++){
  pole([yasakaX+i*.68,yasakaY+.18,yasakaZ+1.82],[yasakaX+i*.68,yasakaY+1.45,yasakaZ+1.82],.055,'#c46748');
  box([yasakaX+i*.68,yasakaY+1.48,yasakaZ+1.82],[.28,.12,.34],'#a64f3b',0,1);
 }
 // lanterns around forecourt
 for(const side of[-1,1])for(let i=0;i<6;i++){
  const lx=yasakaX+side*(4.0+i*.15),lz=yasakaZ-2.2+i*.82,ly=ground(lx,lz);
  pole([lx,ly,lz],[lx,ly+.78,lz],.035,'#7f6246');
  box([lx,ly+.92,lz],[.24,.30,.24],'#ead9b6',0,1);
  hip('lantern-cap-'+side+'-'+i,lx,lz,.38,.38,ly+1.05,.16,.20,'#6e5f55');
 }
 // secondary gate structure
 const gy=ground(yasakaX,yasakaZ-5.3);
 box([yasakaX,gy+.56,yasakaZ-5.3],[4.0,1.12,1.35],'#bd5a42',0,1);
 hip('yasaka-gate-roof',yasakaX,yasakaZ-5.3,4.8,2.0,gy+1.05,.62,.28,'#6b5e57');

 // Precinct vegetation with mixed crowns and clearings around roads
 for(const [cx,cz,rad,count] of [[-22,18,5.5,36],[-18,29,6.2,44],[-29,44,7.3,52],[-12,22,5.0,30]]){
  for(let j=0;j<count;j++){
   const aa=j*2.399,rr=rad*Math.sqrt((j+.5)/count),x=cx+Math.cos(aa)*rr,z=cz+Math.sin(aa)*rr;
   if(rnd()<.16)pine(x,z,range(.52,.94));else tree(x,z,range(.58,1.10),rnd()<.30?'pink':rnd()<.08?'cream':'green',j%5?1:0);
  }
 }
 // Additional garden shrubs / stone edges to remove empty gaps
 for(let j=0;j<95;j++){
  const x=range(-34,-8),z=range(12,49);
  if(Math.hypot(x-areaAnchor.hokanji[0],z-areaAnchor.hokanji[1])<2.4||Math.hypot(x-areaAnchor.kodaiji[0],z-areaAnchor.kodaiji[1])<2.9||Math.hypot(x-areaAnchor.yasaka[0],z-areaAnchor.yasaka[1])<3.5)continue;
  if(rnd()<.58)ball([x,ground(x,z)+.17,z],[range(.14,.30),range(.10,.22),range(.14,.30)],pick(C.greens),tiny,4);
 }
 scene.areaQuality='v3-detailed-landmarks-and-streetscape';
 group='distant-context';
 // Distant city is context only, to the west. No generic tower is mislabelled as Yasaka.
 for(let row=0;row<8;row++)for(let k=0;k<15;k++){let x=-66+k*2.3+range(-.25,.25),z=-46+row*2.4+range(-.2,.2);if(x>-30&&z>-29)continue;let y=ground(x,z),h=range(.65,1.65),w=range(1.1,1.65),d=range(.9,1.5);box([x,y+h/2,z],[w,h,d],pick(['#d6d2be','#c4ccbd','#dac9b5','#bbcfce','#d4c5c4']),range(-.05,.05),0);plate([x,y+h+.07,z],[w+.16,.14,d+.18],pick(['#939da1','#9ba4a0','#aaa698']),0,0);}
 // Mountain silhouettes are actual 3D low relief, with atmospheric materials.
 for(let layer=0;layer<3;layer++){const m=mesh('mountain-ridge-'+layer),z=-65-layer*14;for(let i=0;i<70;i++){const x=-100+i*3,xx=x+3,h=a=>8+layer*1.8+3.2*Math.sin(a*.06+layer)*Math.sin(a*.038+layer*.7)+1.5*Math.sin(a*.15+layer);m.quad([x,-1,z],[xx,-1,z],[xx,h(xx),z],[x,h(x),z],[0,0,1]);}I(m,[0,0,0],[1,1,1],pick(['#a6c4c5','#b3ccce','#bfd5d3']),undefined,6);}
 // Three-dimensional soft clouds remain deliberately small and peripheral.
 for(let [x,y,z,s]of[[-29,20,-30,1.4],[21,23,-38,1.6],[-7,24,-50,1.2]])for(let k=0;k<6;k++)ball([x+(k-2)*s*.66,y+Math.sin(k)*s*.13,z],[s*.63,s*(k===2?.51:.31),s*.40],'#fff4e3',distant,7);
 scene.stats={mainHallInstances:scene.meshes.reduce((n,m)=>n+m.instances.filter(i=>i.group==='main-hall').length,0),trees:centres.length,stageSupportCount:18,mainBays:[9,7],surveyed:false};
 scene.revision='area-higashiyama-quality-v3';scene.modelNotice='建築資料を基に制作したミニチュアです。寸法・境内配置は測量モデルではありません。';
 scene.named={area:{target:[-15,6,22],span:76,yaw:.62,pitch:.49},temple:{target:[-1,7.2,-.4],span:29,yaw:.64,pitch:.43},corner:{target:[1.9,8.5,1.4],span:15.7,yaw:.65,pitch:.31},reverse:{target:[-1,7.4,-.4],span:29,yaw:-.54,pitch:.43}};
 scene.meshes=scene.meshes.filter(m=>m.p.length&&m.instances.length);
 return scene;
}
