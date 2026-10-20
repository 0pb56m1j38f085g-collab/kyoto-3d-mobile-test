/* Asset study, not a surveyed map. All buildings, landscape and small props are procedural 3D meshes. */
'use strict';
function makeStudy(){
 const scene=new SceneModel();let seed=624618;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}const range=(a,b)=>a+(b-a)*rnd(),pick=a=>a[Math.floor(rnd()*a.length)];
 const C={wood:'#a57550',woodLight:'#b7865e',woodDark:'#755036',woodShade:'#906240',rail:'#ac794f',paper:'#f5e5c4',roof:'#8f7160',roofSide:'#806454',ridge:'#8b6b53',stone:'#b6b2a2',stoneLight:'#d0ccbb',path:'#dfd3bc',edge:'#cfc2a9',grass:'#91a968',grassLight:'#9caf72',water:'#8ec8cd',green:['#678b40','#829c46','#5d803c','#9bab54','#4e7838','#8c9f4e','#738d43'],pink:['#ed92ae','#f3a7be','#e280a1','#f8b8c8','#f198af'],cream:['#eccc9d','#f1d7ac','#e8c78e'],orange:['#e6a675','#eeb589','#f0c298'],red:'#c77455'};
 function mesh(name){return scene.add(new MeshData(name));}
 const box=mesh('cuboid');const faces=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,1,0],[0,0,-1]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
 for(const [n,u,v] of faces){let p=(a,b)=>V.add(V.mul(n,.5),V.add(V.mul(u,a),V.mul(v,b)));box.quad(p(-.5,-.5),p(.5,-.5),p(.5,.5),p(-.5,.5),n);}
 const bevel=mesh('soft-edged-timber');let grid=[-.5,-.445,.445,.5];
 for(const[n,u,v]of faces){let pt=(a,b)=>{let p=V.add(V.mul(n,.5),V.add(V.mul(u,a),V.mul(v,b))),c=p.map(x=>Math.max(-.445,Math.min(.445,x))),nn=V.unit(V.sub(p,c));return [V.add(c,V.mul(nn,.055)),nn];};for(let i=0;i<3;i++)for(let j=0;j<3;j++){let a=pt(grid[i],grid[j]),b=pt(grid[i+1],grid[j]),c=pt(grid[i+1],grid[j+1]),d=pt(grid[i],grid[j+1]);bevel.tri(a[0],b[0],c[0],a[1],b[1],c[1]);bevel.tri(a[0],c[0],d[0],a[1],c[1],d[1]);}}
 // Rounded masonry with a deeper bevel than the milled wooden members.
 const roundedStone=mesh('hand-shaped-masonry');
 const sg=[-.5,-.34,.34,.5];
 for(const[n,u,v]of faces){
  const pt=(a,b)=>{let p=V.add(V.mul(n,.5),V.add(V.mul(u,a),V.mul(v,b))),c=p.map(x=>Math.max(-.34,Math.min(.34,x))),nn=V.unit(V.sub(p,c));
   let q=V.add(c,V.mul(nn,.16));q[1]+=.014*Math.sin(q[0]*6+q[2]*3);return[q,nn];};
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
   let a=pt(sg[i],sg[j]),b=pt(sg[i+1],sg[j]),c=pt(sg[i+1],sg[j+1]),d=pt(sg[i],sg[j+1]);
   roundedStone.tri(a[0],b[0],c[0],a[1],b[1],c[1]);roundedStone.tri(a[0],c[0],d[0],a[1],c[1],d[1]);
  }
 }
 function makeBall(name,seg,rings){let m=mesh(name),point=(i,j)=>{let a=Math.PI*i/rings,b=2*Math.PI*j/seg;return[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];};for(let i=0;i<rings;i++)for(let j=0;j<seg;j++){let a=point(i,j),b=point(i+1,j),c=point(i+1,j+1),d=point(i,j+1);m.tri(a,b,c,a,b,c);m.tri(a,c,d,a,c,d);}return m;}
 const leafTuft=mesh('sculpted-leaf-tuft');
 function leafPoint(u,v){
  let a=u*Math.PI,b=v*2*Math.PI;
  let ss=Math.max(0,Math.sin(a)),rr=Math.pow(ss,.92)*(1+.035*Math.cos(3*b+.4)*ss*ss);
  return[rr*Math.cos(b),.94*Math.cos(a)+.018*Math.sin(2*b)*ss*ss,rr*Math.sin(b)];
 }
 for(let i=0;i<12;i++)for(let j=0;j<18;j++){
  let u=i/12,uu=(i+1)/12,v=j/18,vv=(j+1)/18;
  const n=(a,b)=>{
   if(a<.00001)return[0,1,0];if(a>.99999)return[0,-1,0];
   let nn=V.unit(V.cross(V.sub(leafPoint(a+.00001,b),leafPoint(a-.00001,b)),V.sub(leafPoint(a,b+.00001),leafPoint(a,b-.00001))));
   let pp=leafPoint(a,b);return V.dot(nn,pp)<0?V.mul(nn,-1):nn;
  };
  leafTuft.tri(leafPoint(u,v),leafPoint(uu,v),leafPoint(uu,vv),n(u,v),n(uu,v),n(uu,vv));
  leafTuft.tri(leafPoint(u,v),leafPoint(uu,vv),leafPoint(u,vv),n(u,v),n(uu,vv),n(u,vv));
 }
 const lowball=makeBall('distant-foliage-lobe',10,7),ball=makeBall('clay-foliage-lobe',16,10),tinyBall=makeBall('little-round-detail',12,8);
 function cylMesh(name,top,seg=12){let m=mesh(name);for(let i=0;i<seg;i++){let a=2*Math.PI*i/seg,b=2*Math.PI*(i+1)/seg,p=(ang,y,r)=>[Math.cos(ang)*r,y,Math.sin(ang)*r],na=V.unit([Math.cos(a),1-top,Math.sin(a)]),nb=V.unit([Math.cos(b),1-top,Math.sin(b)]);m.tri(p(a,-.5,1),p(b,-.5,1),p(b,.5,top),na,nb,nb);m.tri(p(a,-.5,1),p(b,.5,top),p(a,.5,top),na,nb,na);m.tri([0,.5,0],p(a,.5,top),p(b,.5,top),[0,1,0]);m.tri([0,-.5,0],p(b,-.5,1),p(a,-.5,1),[0,-1,0]);}return m;}
 const cyl=cylMesh('round-pole',1),taper=cylMesh('tapered-trunk',.66),cone=mesh('soft-conifer-layer');
 const profile=[[-.5,.66],[-.47,.92],[-.41,1],[-.26,.86],[.02,.59],[.29,.29],[.5,.018]];
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<20;i++){let a=i/20*6.283185,b=(i+1)/20*6.283185,p=(k,ang)=>[profile[k][1]*Math.cos(ang)*(1+.035*Math.cos(ang*5)),profile[k][0],profile[k][1]*Math.sin(ang)*(1+.035*Math.cos(ang*5))],n=(k,ang)=>{let prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+1)];return V.unit([Math.cos(ang),-(next[1]-prev[1])/(next[0]-prev[0]),Math.sin(ang)]);};cone.tri(p(j,a),p(j,b),p(j+1,b),n(j,a),n(j,b),n(j+1,b));cone.tri(p(j,a),p(j+1,b),p(j+1,a),n(j,a),n(j+1,b),n(j+1,a));}

 const inst=(m,p,s,c,q,mat)=>scene.instance(m,p,s,c,q,mat);
 function cube(x,y,z,w,h,d,c=C.wood,r=0,soft=true,mat=0){return inst(mat===3&&soft?roundedStone:((soft&&Math.min(w,h,d)>.079)?bevel:box),[x,y,z],[w,h,d],c,Q.y(r),mat);}
 function orb(x,y,z,rx,ry,rz,c,q){return inst((z<-15||z>28||x>20||x<-23)?lowball:ball,[x,y,z],[rx,ry,rz],c,q||[0,0,0,1],4);}
 function bead(x,y,z,r,c){return inst(tinyBall,[x,y,z],[r,r,r],c);}
 function pole(x,y,z,r,h,c=C.wood){return inst(cyl,[x,y,z],[r,h,r],c,undefined,1);}
 function beam(a,b,w,d=w,c=C.wood,soft=true){let len=Math.hypot(...V.sub(b,a));return inst((soft&&Math.min(w,d)>.079)?bevel:box,V.mul(V.add(a,b),.5),[w,len,d],c,Q.fromY(V.sub(b,a)),1);}
 function tube(a,b,r,c=C.wood){let len=Math.hypot(...V.sub(b,a));return inst(cyl,V.mul(V.add(a,b),.5),[r,len,r],c,Q.fromY(V.sub(b,a)),1);}
 function prism(name,points,low,high,color){let m=mesh(name),n=points.length,top=points.map(p=>[p[0],typeof high==='function'?high(...p):high,p[1]]),bottom=points.map(p=>[p[0],low,p[1]]),center=V.mul(top.reduce((s,p)=>V.add(s,p),[0,0,0]),1/n);for(let i=0;i<n;i++){let j=(i+1)%n;m.tri(center,top[i],top[j],[0,1,0]);m.quad(bottom[i],bottom[j],top[j],top[i],V.unit([top[i][0]+top[j][0]-2*center[0],0,top[i][2]+top[j][2]-2*center[2]]));}inst(m,[0,0,0],[1,1,1],color);return m;}
 const rect=(w,d,b=.4)=>[[-w/2+b,-d/2],[w/2-b,-d/2],[w/2,-d/2+b],[w/2,d/2-b],[w/2-b,d/2],[-w/2+b,d/2],[-w/2,d/2-b],[-w/2,-d/2+b]];
 // Three carefully stepped strips make the miniature's warm wooden plinth.
 cube(0,-.9,0,500,.1,500,'#f9ebda',0,false,8);
 // Height field: a hillside, not a flat grid of trees. Positions are compositional, not geographic.
 function creekDepth(x,z){
  const pts=[[12.7,2.5],[12.4,4.8],[11.1,6.8],[7.2,8.3],[3.5,9.0],[1.0,11.2],[.8,13.2]];
  let best=1e6;for(let k=0;k<pts.length-1;k++){
   let a=pts[k],b=pts[k+1],dx=b[0]-a[0],dz=b[1]-a[1];
   let t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
   best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  }return .26*Math.exp(-Math.pow(best/.78,4));
 }
 function ground(x,z){let h=2.12+8.0*Math.exp(-Math.pow((x-9)/10.2,2)-Math.pow((z+10.8)/5.6,2))+2.2*Math.exp(-Math.pow((x+7.5)/8.0,2)-Math.pow((z+7.4)/5.2,2))+.55*Math.exp(-Math.pow((x+11)/6,2)-Math.pow((z-4)/5,2));h+=4.5*Math.exp(-Math.pow((x-11.0)/11.0,2)-Math.pow((z+16.8)/5.5,2))*Math.min(1,Math.max(0,(-z-6)/5));h+=.12*Math.sin(x*.37)*Math.cos(z*.31);let dis=Math.hypot(Math.max(0,Math.abs(x+7.6)-2.2)/2.7,Math.max(0,Math.abs(z+6.8)-1.4)/2.6),f=Math.max(0,1-dis);let pd=Math.hypot(Math.max(0,Math.abs(x-12.2)-2.45)/1.1,Math.max(0,Math.abs(z+2)-2.3)/1.0),pf=Math.max(0,1-pd);pf=pf*pf*(3-2*pf);h=h*(1-pf)+3.10*pf;h+=1.52*Math.exp(-Math.pow((x-2.0)/7.0,6)-Math.pow((z-2.6)/3.1,6));let result=h+Math.max(0,6.37-h)*f*f*(3-2*f)-creekDepth(x,z);
 let lx=1.6+Math.cos(-.30)*(x-1.6)-Math.sin(-.30)*(z+3.2),lz=-3.2+Math.sin(-.30)*(x-1.6)+Math.cos(-.30)*(z+3.2);
 let bench=Math.max(0,Math.min(1,(6.25-Math.abs(lx-1.6))/.6,(5.00-Math.abs(lz+2.0))/.6));
 result=result*(1-bench)+Math.min(result,5.72)*bench;return result;}
 const terrain=mesh('sculpted-hillside'),nx=180,nz=200,w=88,d=96;
 function gp(ix,iz){let x=-w/2+ix*w/nx-8,z=-d/2+iz*d/nz;return[x,ground(x,z),z];}function gn(p){let e=.08;return V.unit([ground(p[0]-e,p[2])-ground(p[0]+e,p[2]),2*e,ground(p[0],p[2]-e)-ground(p[0],p[2]+e)]);}
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){let a=gp(i,j),b=gp(i+1,j),c=gp(i+1,j+1),dd=gp(i,j+1);terrain.tri(a,dd,c,gn(a),gn(dd),gn(c));terrain.tri(a,c,b,gn(a),gn(c),gn(b));}inst(terrain,[0,0,0],[1,1,1],C.grassLight);
 let skirt=mesh('hillside-cutaway');let edges=[];for(let i=0;i<=nx;i++)edges.push(gp(i,0));for(let j=1;j<=nz;j++)edges.push(gp(nx,j));for(let i=nx-1;i>=0;i--)edges.push(gp(i,nz));for(let j=nz-1;j>0;j--)edges.push(gp(0,j));for(let i=0;i<edges.length;i++){let a=edges[i],b=edges[(i+1)%edges.length];skirt.quad([a[0],.64,a[2]],[b[0],.64,b[2]],b,a,V.unit([a[0]+b[0],0,a[2]+b[2]]));}inst(skirt,[0,0,0],[1,1,1],'#9da66d');
 // Curves for paths, streams and fences; the same control points drive each adjoining detail.
 function cat(points,steps=70){let out=[];for(let j=0;j<steps;j++){let t=j/(steps-1)*(points.length-1),i=Math.min(points.length-2,Math.floor(t)),u=t-i,a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],dd=points[Math.min(points.length-1,i+2)];out.push(b.map((v,k)=>.5*(2*v+(-a[k]+c[k])*u+(2*a[k]-5*v+4*c[k]-dd[k])*u*u+(-a[k]+3*v-3*c[k]+dd[k])*u*u*u)));}return out;}
 function ribbon(name,points,width,color,heightFn=ground,offset=.04){let pts=cat(points,100),m=mesh(name);for(let i=0;i<pts.length-1;i++){let a=pts[i],b=pts[i+1],dir=V.unit([b[0]-a[0],0,b[1]-a[1]]),n=[-dir[2]*width/2,dir[0]*width/2],p=(v,s)=>[v[0]+n[0]*s,heightFn(v[0]+n[0]*s,v[1]+n[1]*s)+offset,v[1]+n[1]*s];m.quad(p(a,-1),p(b,-1),p(b,1),p(a,1),[0,1,0]);}inst(m,[0,0,0],[1,1,1],color,undefined,name.includes('water')?5:3);return pts;}
 const mainWalk=[[-18,9],[-13,9.7],[-8,10.8],[-2,10.6],[4,10.8],[10,10.2],[15,8.3],[17,4],[16,-1],[13.8,-4]];
 ribbon('walk-border',mainWalk,2.0,C.edge);let forepath=ribbon('warm-pale-stone-walk',mainWalk,1.72,C.path,ground,.066);
 let leftWalk=[[-15,9],[-12,5],[-11,1],[-11.6,-3],[-8,-5.2],[-5.7,-6.5]];ribbon('climbing-garden-walk-border',leftWalk,1.7,C.edge);let leftpath=ribbon('climbing-garden-walk',leftWalk,1.4,C.path,ground,.07);
 let middleWalk=[[-8,9.9],[-6.6,7.6],[-3.5,6.0],[1,5.6],[5.2,5.9],[10,6],[14.5,7.8]];ribbon('temple-lower-promenade-border',middleWalk,1.55,C.edge);let middlepath=ribbon('temple-lower-promenade',middleWalk,1.32,C.path,ground,.07);

 // Turn the main hall inside the miniature, rather than turning the entire plinth.
 const templeAngle=-.30,templePivot=[1.6,-3.2];
 function templePoint(p){let x=p[0]-templePivot[0],z=p[2]-templePivot[1];return [templePivot[0]+Math.cos(templeAngle)*x+Math.sin(templeAngle)*z,p[1]-.55,templePivot[1]-Math.sin(templeAngle)*x+Math.cos(templeAngle)*z];}
 const templeStart=new Map(scene.meshes.map(m=>[m,m.instances.length])),templeFootings=[],templeColumns=[],stageFootings=[],stageColumns=[];
 // Main timber temple and the high, open stage.

 const tx=1.6,tz=-3.2,floor=7.2,ww=10.8,dd=6.3;
 const deckZ=1.1,deckD=2.65;
 cube(tx,floor-.19,tz,11.6,.32,7.0,C.wood,0,true,1);cube(tx,floor-.14,deckZ,12.0,.3,deckD,C.woodLight,0,true,1);
 for(let i=0;i<40;i++){let z=-6.7+i*.232;cube(tx,floor+.018,z,11.65,.025,.012,'#ad875e',0,false,1);}
 // Architectural correction v1: distinguish the hall's inner supports from 18 visible stage supports.
 // These are stylized placements, not measured coordinates or a structural engineering drawing.
 const xs=Array.from({length:7},(_,i)=>tx-5.25+i*1.75),coreZs=[-5.7,-3.8,-1.85];
 const stageXs=Array.from({length:6},(_,i)=>tx-4.85+i*1.94),stageZs=[-.25,.95,2.16];
 const zs=[...coreZs,...stageZs];
 for(let x of xs)for(let z of coreZs{let y=ground(x,z);cube(x,y+.06,z,.52,.18,.48,C.stone,0,true,3);templeFootings.push(roundedStone.instances[roundedStone.instances.length-1]);cube(x,(y+floor)/2,z,.205,floor-y,.205,C.woodDark,0,true,1);templeColumns.push(bevel.instances[bevel.instances.length-1]);for(let yy=3.35;yy<floor-.25;yy+=1.15)if(yy>y+.2){cube(x,yy,z,.4,.16,.4,C.woodShade,0,true,1);}}
 // Six by three posts visually identify the projecting stage, independently of the hall frame.
 for(let x of stageXs)for(let z of stageZs){let y=ground(x,z);
  cube(x,y+.06,z,.52,.18,.48,C.stone,0,true,3);stageFootings.push(roundedStone.instances[roundedStone.instances.length-1]);
  cube(x,(y+floor)/2,z,.24,floor-y,.24,C.woodDark,0,true,1);stageColumns.push(bevel.instances[bevel.instances.length-1]);
  for(let yy=3.35;yy<floor-.25;yy+=1.15)if(yy>y+.2)cube(x,yy,z,.43,.17,.43,C.woodShade,0,true,1);
 }
 for(let y of [3.4,4.55,5.7,6.83]){for(let z of zs){cube(tx,y,z,11.2,.19,.2,C.woodShade,0,true,1);}for(let x of xs){cube(x,y,-1.75,.2,.18,8.12,C.woodDark,0,true,1);}}
 // Projecting stage uses its own lateral ties and diagonal bracing.
 for(let j=0;j<stageZs.length;j++)for(let yy of [4.55,5.7,6.83])cube(tx,yy,stageZs[j],10.9,.18,.21,C.woodShade,0,true,1);
 for(let i=0;i<stageXs.length;i++)for(let yy of [4.55,5.7,6.83])cube(stageXs[i],yy,1.03,.18,.16,2.9,C.woodDark,0,true,1);
 for(let i=0;i<stageXs.length-1;i++)for(let j=0;j<stageZs.length;j++){let x=stageXs[i],z=stageZs[j],yy=4.55;if(yy>ground(x,z)+.3)beam([x,yy,z],[stageXs[i+1],yy+1.12,z],.09,.09,C.wood);}
 // Side lattice is visible when rotating the scene.
 for(let k=0;k<zs.length-1;k++)for(let yy of[3.4,4.55,5.7])if(yy>ground(xs[6],zs[k]))beam([xs[6],yy,zs[k]],[xs[6],yy+1.1,zs[k+1]],.12,.11,C.wood);
 cube(tx,8.22,tz-.78,10.02,2.0,4.10,'#624c39',0,false);cube(tx,8.43,-5.85,10.45,1.95,.14,C.paper,0,false);
 // Open veranda, dark recesses and carved eave brackets.
 for(let side of[-1,1]){let z=tz+side*2.62;for(let i=0;i<9;i++){let x=tx-5.12+i*1.28;cube(x,8.27,z,.18,2.1,.2,C.wood,0,true,1);cube(x,9.31,z,.58,.15,.57,C.woodLight,0,true,1);cube(x,9.46,z,.36,.17,.8,C.woodShade,0,true,1);if(i<8){cube(x+.64,7.92,z-.05,1.1,1.3,.07,C.woodDark,0,false);for(let s=0;s<5;s++)cube(x+.15+s*.23,7.95,z+.008,.033,1.1,.08,C.woodLight,0,false,1);}}}
 for(let x of[tx-5.18,tx+5.18])for(let j=0;j<5;j++){let z=tz-2.1+j*1.1;cube(x,8.24,z,.2,2.02,.18,C.wood,0,true,1);cube(x,8.2,z,.11,1.6,.82,C.paper,0,false);for(let k=0;k<4;k++)cube(x+.03,7.58+k*.34,z,.13,.034,.92,C.woodDark,0,false,1);}
 for(let y of[7.24,9.24,9.48]){cube(tx,y,tz,11.08,.2,5.85,C.woodShade,0,true,1);}

 // Rounded veranda columns carry the eaves, in front of the recessed sliding screens.
 for(let k=0;k<9;k++){
  let x=tx-5.02+k*1.255,z=.47;
  pole(x,8.245,z,.111,2.05,C.wood);
  cube(x,7.285,z,.32,.12,.32,C.woodDark,0,true,1);
  cube(x,9.12,z,.43,.14,.37,C.woodLight,0,true,1);
  cube(x,9.255,z,.65,.13,.28,C.woodShade,0,true,1);
  for(let side of[-1,1]){
   beam([x,8.91,z],[x+side*.31,9.185,z],.08,.11,C.woodLight);
   beam([x,9.0,z],[x,9.2,z+side*.33],.072,.105,C.woodShade);
  }
 }
 cube(tx,9.30,.47,10.55,.15,.22,C.woodLight,0,true,1);
 // Four staggered carved rail infills and small joinery pegs at the veranda corners.
 for(let side of[-1,1])for(let j=0;j<6;j++){
  let x=tx+side*5.10,z=-4.8+j*.89;
  pole(x,8.24,z,.103,2.0,C.wood);
  cube(x,9.18,z,.34,.16,.51,C.woodLight,0,true,1);
 }
 // Curving hip roofs. The eave outline rises gently at its corners, not a pyramidal box.
 function roofMesh(name,ratio=.57){let m=mesh(name);function p(u,v,side){let rh=ratio*.5,ext=rh+(.5-rh)*v;let h=Math.pow(Math.max(0,1-v),1.12)+.035*Math.pow(v,6)+.035*Math.pow(Math.abs(u),5)*Math.pow(v,4);if(side===0)return[u*ext,h,.5*v];if(side===1)return[-u*ext,h,-.5*v];if(side===2)return[ext,h,-u*.5*v];return[-ext,h,u*.5*v];}for(let side=0;side<4;side++)for(let i=0;i<20;i++)for(let j=0;j<16;j++){let u=-1+i/10,v=j/16,u2=u+.1,v2=v+1/16;let n=(a,b)=>{let du=V.sub(p(a+.0001,b,side),p(a-.0001,b,side)),dv=V.sub(p(a,b+.0001,side),p(a,b-.0001,side)),nn=V.unit(V.cross(dv,du));return nn[1]<0?V.mul(nn,-1):nn;};let a=p(u,v,side),b=p(u2,v,side),c=p(u2,v2,side),d=p(u,v2,side);m.tri(a,b,c,n(u,v),n(u2,v),n(u2,v2),[u/2+.5,v],[u2/2+.5,v],[u2/2+.5,v2]);m.tri(a,c,d,n(u,v),n(u2,v2),n(u,v2),[u/2+.5,v],[u2/2+.5,v2],[u/2+.5,v2]);}return m;}
 const hip=roofMesh('curved-hip-roof');
 function roof(x,y,z,w,d,h,c=C.roof,r=0,ridge=.57){let q=Q.y(r);inst(hip,[x,y,z],[w,h,d],c,q,2);inst(hip,[x,y-.12,z],[w*.995,h*.995,d*.995],C.woodDark,q,1);
 const tr=(xx,yy,zz)=>[x+Math.cos(r)*xx+Math.sin(r)*zz,y+yy,z-Math.sin(r)*xx+Math.cos(r)*zz];
 tube(tr(-w*.285,h+.02,0),tr(w*.285,h+.02,0),.058,C.ridge);
 for(let s of[-1,1]){let pts=[];for(let i=0;i<=30;i++){let u=-1+2*i/30;pts.push(tr(u*w/2,h*(.035+.035*Math.pow(Math.abs(u),5))-.025,s*d/2));}for(let i=0;i<pts.length-1;i++)beam(pts[i],pts[i+1],.065,.095,C.woodShade);}
 for(let s of[-1,1]){let pts=[];for(let i=0;i<=20;i++){let u=-1+2*i/20;pts.push(tr(s*w/2,h*(.035+.035*Math.pow(Math.abs(u),5))-.025,u*d/2));}for(let i=0;i<pts.length-1;i++)beam(pts[i],pts[i+1],.065,.095,C.woodShade);}
 return hip;}
 
 // Continuous gently swept hip-roof silhouette, following the approved miniature reference.
 function templeRoof(){
  // Two joined roof levels: an upper hipped body and a shallow, projecting lower eave.
  // Both levels have thickness, separate cedar courses and real underside rafters.
  function tier(label,w,d,h,y,rh,baseColor,edgeColor){
   const m=mesh(label+'-surface'),edge=mesh(label+'-fascia');
   const shape=(u,v,side)=>{
    let ext=rh+(.5-rh)*v;
    let hh=Math.pow(Math.max(0,1-v),1.085)+.040*Math.pow(v,7)+.025*Math.pow(Math.abs(u),6)*Math.pow(v,5);
    if(side===0)return[u*ext,hh,.5*v]; if(side===1)return[-u*ext,hh,-.5*v];
    if(side===2)return[ext,hh,-u*.5*v];return[-ext,hh,u*.5*v];
   };
   for(let side=0;side<4;side++){
    for(let i=0;i<36;i++)for(let j=0;j<24;j++){
     let u=-1+i/18,uu=u+1/18,v=j/24,vv=v+1/24;
     const n=(a,b)=>{let q=V.unit(V.cross(V.sub(shape(a,b+.00001,side),shape(a,b-.00001,side)),V.sub(shape(a+.00001,b,side),shape(a-.00001,b,side))));return q[1]<0?V.mul(q,-1):q;};
     let a=shape(u,v,side),b=shape(uu,v,side),c=shape(uu,vv,side),e=shape(u,vv,side);
     m.tri(a,b,c,n(u,v),n(uu,v),n(uu,vv),[u/2+.5,v],[uu/2+.5,v],[uu/2+.5,vv]);
     m.tri(a,c,e,n(u,v),n(uu,vv),n(u,vv),[u/2+.5,v],[uu/2+.5,vv],[u/2+.5,vv]);
    }
    for(let i=0;i<60;i++){
     let u=-1+i/30,uu=u+1/30,a=shape(u,1,side),b=shape(uu,1,side);
     edge.quad(a,b,[b[0],b[1]-.075/h,b[2]],[a[0],a[1]-.075/h,a[2]]);
    }
    // Hairline cedar courses, incorporated in mesh rather than overlaid pixels.
    const cm=mesh(label+'-cedar-courses-'+side);
    for(let row=1;row<68;row++){
     let v=row/68;
     for(let k=0;k<30;k++){
      let u=-1+k/15,uu=u+1/15,eps=.0027;
      const P=(a,b,off)=>{let p=shape(a,b,side);return[p[0],p[1]+off/h,p[2]];};
      cm.quad(P(u,v,.012),P(uu,v,.012),P(uu,v+eps,.004),P(u,v+eps,.004));
     }
    }
    inst(cm,[tx,y,tz],[w,h,d],baseColor,undefined,2);
   }
   inst(m,[tx,y,tz],[w,h,d],baseColor,undefined,2);inst(edge,[tx,y,tz],[w,h,d],edgeColor,undefined,1);
   tube([tx-w*rh-.075,y+h+.027,tz],[tx+w*rh+.075,y+h+.027,tz],.064,'#927057');
   for(let side of[-1,1])for(let j=0;j<58;j++){
    let u=-1+j/29,uu=-1+(j+1)/29,a=shape(u,1,side===1?0:1),b=shape(uu,1,side===1?0:1);
    a=[tx+a[0]*w,y+a[1]*h-.105,tz+a[2]*d];b=[tx+b[0]*w,y+b[1]*h-.105,tz+b[2]*d];
    beam(a,b,.070,.105,edgeColor);
   }
   for(let side of[-1,1])for(let i=0;i<49;i++){
    let x=tx-w*.47+i*w*.94/48,zz=tz+side*d*.47,yy=y+.04*h-.13;
    beam([x,yy,zz],[x,yy+.14,zz-side*.77],.051,.068,'#af8258');
   }
  }
  tier('hondo-lower-eave',13.15,9.00,1.16,9.26,.285,'#826451','#946c47');
  tier('hondo-upper-roof',11.0,7.15,2.76,9.53,.224,'#967966','#876247');
 }
 templeRoof();

 // Projecting front pediments with a closed timber triangle and double eave trim.
 const gable=mesh('projecting-gabled-roof');
 function gP(u,v,side){let x=side*u*.5;return [x,Math.pow(1-u,1.18)+.035*Math.pow(u,6),v*.5];}
 for(let side of[-1,1])for(let i=0;i<18;i++)for(let j=0;j<5;j++){let u=i/18,v=-1+j*.4,a=gP(u,v,side),b=gP(u+1/18,v,side),c=gP(u+1/18,v+.4,side),d=gP(u,v+.4,side),n=V.unit([side*2*1.18*Math.pow(1-u,.18),1,0]);gable.quad(a,b,c,d,n);}
 function frontGable(x,y,z,w,d,h){inst(gable,[x,y,z],[w,h,d],'#8c6c55',undefined,2);let m=mesh('timber-pediment-'+x);m.tri([-w/2,.05*h,d/2],[w/2,.05*h,d/2],[0,h,d/2],[0,0,1]);inst(m,[x,y-.025,z],[1,1,1],C.woodShade);beam([x-w/2,y+.04*h,z+d/2+.02],[x,y+h,z+d/2+.02],.065,.09,C.rail);beam([x+w/2,y+.04*h,z+d/2+.02],[x,y+h,z+d/2+.02],.065,.09,C.rail);cube(x,y+.11,z+d/2+.022,w,.15,.09,C.woodLight);for(let i=-2;i<=2;i++)cube(x+i*w*.12,y+h*.31,z+d/2+.05,.035,h*.37,.03,C.woodLight,0,false);tube([x,y+h+.02,z-d/2],[x,y+h+.02,z+d/2],.05,C.ridge);}
 frontGable(tx,9.05,.67,2.75,2.16,.96);frontGable(tx-4.3,9.22,.23,1.85,1.92,.68);frontGable(tx+4.3,9.22,.23,1.85,1.92,.68);
 function railing(a,b,height=.68,spacing=.55){let dir=V.sub(b,a),length=Math.hypot(...dir),n=Math.ceil(length/spacing);for(let i=0;i<=n;i++){let p=V.add(a,V.mul(dir,i/n));cube(p[0],p[1]+height/2,p[2],.095,height,.095,C.rail);bead(p[0],p[1]+height+.025,p[2],.044,C.woodLight);}beam(V.add(a,[0,height,0]),V.add(b,[0,height,0]),.095,.11,C.rail);beam(V.add(a,[0,height*.40,0]),V.add(b,[0,height*.40,0]),.065,.075,C.woodLight);}
 railing([tx-5.86,floor+.035,2.4],[tx+5.86,floor+.035,2.4],.70,.59);railing([tx-5.86,floor+.035,2.4],[tx-5.86,floor+.035,-5.2],.7);railing([tx+5.86,floor+.035,2.4],[tx+5.86,floor+.035,-5.2],.7);

 for(let m of scene.meshes)for(let j=templeStart.get(m)||0;j<m.instances.length;j++){
  const i=m.instances[j];i.group='main-hall';i.p=templePoint(i.p);i.q=Q.mul(Q.y(templeAngle),i.q);
 }
 // Keep the rotated structure seated on the height field.
 for(let i of templeFootings)i.p[1]=ground(i.p[0],i.p[2])+.06;
 for(let i of [...templeFootings,...stageFootings])i.p[1]=ground(i.p[0],i.p[2])+.06;
 for(let i of [...templeColumns,...stageColumns]){let h0=ground(i.p[0],i.p[2]);i.p[1]=(h0+floor-.55)/2;i.s[1]=Math.max(.12,floor-.55-h0);}
 // Wide access stair beside the main hall, with many individual risers and stone curbs.
 function stairs(a,b,width,n=24){for(let i=0;i<n;i++){let t=(i+.5)/n,p=V.add(a,V.mul(V.sub(b,a),t)),dy=(b[1]-a[1])/n;let len=Math.hypot(b[0]-a[0],b[2]-a[2])/n;let angle=Math.atan2(b[0]-a[0],b[2]-a[2]);let foundation=ground(p[0],p[2])-.05,top=p[1]-.10;if(top>foundation+.12)cube(p[0],(top+foundation)/2,p[2],width*.96,top-foundation,len+.022,'#b8b5a6',angle,false,3);
 if(i%2===0 && top>foundation+.34){
  for(let side of[-1,1])for(let row=0;row<24;row++){
   let yy=foundation+.18+row*.36;if(yy+.15>top)break;
   let off=side*(width*.50+.006),xx=p[0]+Math.cos(angle)*off,zz=p[2]-Math.sin(angle)*off;
   cube(xx,yy,zz,.16,.31,len*1.94,['#c5c1b1','#b6b6a9','#cec9b8','#bbbaa9'][(i+row+4)%4],angle,true,3);
  }
 }
 cube(p[0],p[1]-.04,p[2],width,Math.max(.1,Math.abs(dy)),len+.015,pick(['#c5c2b1','#d6d2bf','#c9c8b5']),angle,true,3);cube(p[0],p[1]+Math.abs(dy)*.48,p[2],width+.04,.045,len*.15,'#e2dfce',angle,true,3);}let d=V.unit([b[0]-a[0],0,b[2]-a[2]]),side=[-d[2]*(width/2+.15),0,d[0]*(width/2+.15)];for(let s of[-1,1]){let aa=V.add(a,V.mul(side,s)),bb=V.add(b,V.mul(side,s));beam(V.add(aa,[0,.12,0]),V.add(bb,[0,.12,0]),.23,.20,C.stoneLight);railing(V.add(aa,[0,.2,0]),V.add(bb,[0,.2,0]),.5,.8);}}
 
 const stairLandings=[[-5.8,ground(-5.8,6.9)+.1,6.9],[-6.9,4.55,4.8],[-6.9,5.98,2.4],templePoint([tx-5.86,floor+.035,1.40])];
 for(let k=0;k<3;k++){let a=stairLandings[k],b=stairLandings[k+1];stairs(a,b,1.23,12);if(k<2)cube(b[0],b[1]-.09,b[2],1.48,.22,.75,C.stoneLight);}

 scene.__anchor=[-9.0,4.5];
 // Small stone terrace and garden in the lower-left foreground.
 let gardenCenter=[-9.0,4.5],gardenY=3.48,gardenPts=Array.from({length:50},(_,i)=>[gardenCenter[0]+Math.cos(i/50*6.283)*3.85,gardenCenter[1]+Math.sin(i/50*6.283)*2.45]);prism('garden-retaining-wall',gardenPts,.8,gardenY,'#a6a395');
 let capPts=gardenPts.map(p=>[gardenCenter[0]+(p[0]-gardenCenter[0])*1.018,gardenCenter[1]+(p[1]-gardenCenter[1])*1.027]);prism('garden-wall-coping',capPts,gardenY-.07,gardenY+.13,'#d2c9ae');
 let turfPts=gardenPts.map(p=>[gardenCenter[0]+(p[0]-gardenCenter[0])*.94,gardenCenter[1]+(p[1]-gardenCenter[1])*.9]);prism('garden-turf',turfPts,gardenY+.11,gardenY+.15,'#a1ae77');
 // Individual, softly faceted masonry instead of a single flat wall texture.
 for(let row=0;row<3;row++)for(let i=0;i<50;i++){let a=(i+(row%2)*.5)/50*Math.PI*2,x=gardenCenter[0]+3.85*Math.cos(a),z=gardenCenter[1]+2.46*Math.sin(a),y=2.16+row*.39;inst(bevel,[x,y,z],[.43,.34,.18],pick(['#a8a79b','#b8b7a9','#c1beb0','#93958a']),Q.y(Math.atan2(-2.46*Math.cos(a),-3.85*Math.sin(a))),3);}
 let gardenLoop=Array.from({length:10},(_,i)=>[gardenCenter[0]+Math.cos(i/9*6.283)*2.8,gardenCenter[1]+Math.sin(i/9*6.283)*1.7]);ribbon('garden-footpath',gardenLoop,.5,'#e3d6ba',()=>gardenY+.16,.025);
 scene.__anchor=null;
 function pavilion(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return pavilionGeometry(...args);}finally{scene.__anchor=prev;}}
 function pavilionGeometry(x,z,s=1,y=ground(x,z),color=C.roof,open=false){cube(x,y+.1,z,3.15*s,.2,2.65*s,C.stoneLight);cube(x,y+.3*s,z,2.75*s,.3*s,2.28*s,C.woodShade,0,true,1);if(!open)cube(x,y+1.08*s,z,2.4*s,1.5*s,1.94*s,C.paper,0,true);for(let side of[-1,1])for(let ix of[-1,0,1]){cube(x+ix*1.12*s,y+1.17*s,z+side*.96*s,.13*s,1.7*s,.13*s,C.woodShade,0,true,1);if(!open&&side===1){cube(x+ix*.65*s,y+1.01*s,z+.987*s,.46*s,.94*s,.05*s,'#695442');for(let j=0;j<3;j++)cube(x+ix*.65*s-.16*s+j*.16*s,y+1.0*s,z+1.027*s,.025*s,.94*s,.03*s,C.woodLight,0,false,1);}}
 cube(x,y+1.94*s,z,2.9*s,.16*s,2.42*s,C.wood,0,true,1);
 for(let side of[-1,1])for(let n=0;n<15;n++){let xx=x+(-1.6+n*3.2/14)*s;beam([xx,y+1.98*s,z+side*1.48*s],[xx,y+2.08*s,z+side*1.06*s],.038*s,.045*s,C.woodLight);}
 for(let n=0;n<9;n++)cube(x+(-1+n*.25)*s,y+.48*s,z+1.16*s,.20*s,.045*s,.42*s,C.woodLight,0,true,1);
 roof(x,y+2.00*s,z,3.7*s,3.18*s,1.15*s,color);for(let ix of[-1.12,1.12])for(let iz of[-.96,.96])cube(x+ix*s,y+1.8*s,z+iz*s,.35*s,.18*s,.40*s,C.woodLight);return y+3.2*s;}
 pavilion(-9,4.5,.59,gardenY+.2,C.roof,true);
 pavilion(-14.6,.25,.86,ground(-14.6,.25), '#947b69');pavilion(-15.1,7.7,.82,ground(-15.1,7.7),'#88725f');pavilion(-2.4,8.2,.72,ground(-2.4,8.2),'#8c7663');pavilion(9.6,7.9,.56,ground(9.6,7.9),'#806d5e');pavilion(16.1,-5.2,.73,ground(16.1,-5.2),'#8d755f');pavilion(-7.8,-6.65,.71,6.7,'#967b63',true);
 // Terrace under the pavilion behind the access stair.
 cube(-7.6,6.52,-6.8,4.4,.30,3.3,'#d4c6a8');
 const pagodaStart=new Map(scene.meshes.map(m=>[m,m.instances.length]));
 // Three-tier tower motif for Kiyomizu-dera precinct. Position remains illustrative, not surveyed.
 const px=12.2,pz=-2.0,py=ground(px,pz)+.13;
 cube(px,py+.005,pz+.35,6.05,.12,5.7,'#d9d1be');
 for(let side of[-1,1])for(let i=0;i<12;i++){let z=pz-2.2+i*.48,x=px+side*3.0;cube(x,py-.24,z,.23,.54,.43,pick(['#b9b7a6','#c6c2af','#aaa99b']),0,true,3);cube(x,py+.066,z,.33,.10,.50,C.stoneLight,0,true,3);}
 cube(px,py+.12,pz,4.8,.25,4.8,C.stoneLight);let top=py+.27;
 for(let k=0;k<3;k++){let w=3.7*Math.pow(.83,k),bodyH=1.44*Math.pow(.965,k);cube(px,top+.1,pz,w*.86,.16,w*.86,C.wood);cube(px,top+.55,pz,w*.76,bodyH,w*.76,C.paper,0,true);for(let side of[-1,1]){for(let j=0;j<5;j++){let a=-w*.32+j*w*.16;cube(px+a,top+.54,pz+side*w*.385,.08,bodyH,.09,C.woodShade,0,true,1);cube(px+side*w*.385,top+.54,pz+a,.09,bodyH,.08,C.woodShade,0,true,1);}cube(px,top+.42,pz+side*w*.39,w*.55,.6,.04,'#665440',0,false);for(let j=0;j<7;j++)cube(px-w*.24+j*w*.08,top+.43,pz+side*w*.42,.026,.59,.035,C.rail,0,false,1);}
 cube(px,top+bodyH,pz,w*.9,.16,w*.9,C.woodShade);
 for(let side of[-1,1])for(let n=0;n<13;n++){let off=(-.53+n*.088)*w;beam([px+off,top+bodyH+.01,pz+side*w*.58],[px+off,top+bodyH+.13,pz+side*w*.40],.039,.05,C.woodLight);beam([px+side*w*.58,top+bodyH+.01,pz+off],[px+side*w*.40,top+bodyH+.13,pz+off],.039,.05,C.woodLight);}
 for(let a of[-1,1])for(let b of[-1,1]){cube(px+a*w*.36,top+bodyH-.11,pz+b*w*.36,w*.19,.10,w*.19,C.rail);cube(px+a*w*.36,top+bodyH-.24,pz+b*w*.36,w*.12,.16,w*.12,C.woodShade);}
 roof(px,top+bodyH+.03,pz,w*1.28,w*1.28,.79*Math.pow(.92,k),k===0?'#79717a':'#81767a');if(k<2){for(let side of[-1,1])railing([px-w*.48,top+.1,pz+side*w*.48],[px+w*.48,top+.1,pz+side*w*.48],.30,.43);}top+=bodyH+.43;
 }
 pole(px,top+.95,pz,.045,2.25,'#b08a46');for(let i=0;i<9;i++)pole(px,top+.14+i*.185,pz,.23-i*.016,.06,'#bf9c54');bead(px,top+2.13,pz,.10,'#d9ba73');

 const pagodaAnchor=[13.4,ground(13.4,6.5)+.13,6.5],ps=.83;
 for(let m of scene.meshes)for(let j=pagodaStart.get(m)||0;j<m.instances.length;j++){
   let o=m.instances[j];o.anchor=[13.4,6.5];let local=[o.p[0]-px,o.p[1]-py,o.p[2]-pz];
   o.p=[pagodaAnchor[0]+local[0]*ps,pagodaAnchor[1]+local[1]*ps,pagodaAnchor[2]+local[2]*ps];o.s=o.s.map(v=>v*ps);
 }
 // Vermilion torii at the woodland approach.
 function torii(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return toriiGeometry(...args);}finally{scene.__anchor=prev;}}
 function toriiGeometry(x,z,s=1){let y=ground(x,z);for(let v of[-1,1]){let xx=x+v*1.2*s;pole(xx,y+1.5*s,z,.15*s,3*s,C.red);pole(xx,y+.17*s,z,.19*s,.33*s,'#776c55');}cube(x,y+2.25*s,z,3.0*s,.2*s,.23*s,'#d29165');let pts=[];for(let i=0;i<=20;i++){let t=-1+2*i/20;pts.push([x+t*1.9*s,y+(3.04+.2*Math.pow(t,4))*s,z]);}for(let i=0;i<20;i++)beam(pts[i],pts[i+1],.24*s,.44*s,'#6f6154');cube(x,y+2.97*s,z,3.65*s,.21*s,.34*s,C.red);cube(x,y+2.63*s,z,.25*s,.58*s,.21*s,C.red);}
 torii(-11.8,-2.8,.95);
 // Stream, stepping stones, a small cascade and a timber footbridge.
 const waterPoints=[[12.7,2.5],[12.4,4.8],[11.1,6.8],[7.2,8.3],[3.5,9.0],[1.0,11.2],[.8,13.2]];
 ribbon('waterbank-pale-stone',waterPoints,1.38,'#d1c8ad',ground,.075);const waterPath=ribbon('watercourse',waterPoints,1.07,C.water,ground,.093);
 // A shallow irregular pond widens the stream at the foot of the garden.
 const pondPts=Array.from({length:38},(_,i)=>{let a=i/38*6.283185,r=1+.08*Math.cos(a*3);return[6.8+Math.cos(a)*2.05*r,8.3+Math.sin(a)*1.15*r];});
 prism('pond-stone-rim',pondPts,.9,(x,z)=>ground(x,z)+.11,'#c8c6a7');
 const poolPts=pondPts.map(p=>[6.8+(p[0]-6.8)*.90,8.3+(p[1]-8.3)*.85]);let pond=prism('garden-pond',poolPts,1.0,(x,z)=>ground(x,z)+.135,C.water);pond.instances[0].mat=5;
 // Waterfall and rocks on the upper right. Its presence is a concept motif, not a real geographic claim.
 let wx=12.56,wz=3.9,wy=ground(wx,wz);
 const falls=mesh('continuous-satin-waterfall');
 const fp=(u,t)=>[wx+u*.46,wy+.12+2.20*(1-t),wz-.29+.48*t+.12*Math.pow(t,4)];
 for(let i=0;i<14;i++)for(let j=0;j<28;j++){let u=-1+i/7,t=j/28;falls.quad(fp(u,t),fp(u+1/7,t),fp(u+1/7,t+1/28),fp(u,t+1/28),[0,.19,.98]);}
 inst(falls,[0,0,0],[1,1,1],'#bce0de',undefined,5);
 for(let side of[-1,1])for(let j=0;j<6;j++){let yy=wy+.25+j*.37,x=wx+side*(.52+range(-.04,.19)),zz=wz-.27+range(-.12,.08);orb(x,yy,zz,range(.30,.42),range(.28,.37),range(.31,.42),pick(['#a9b19b','#bcc0aa','#c5c2ac']));}
 for(let i=0;i<9;i++)orb(wx+range(-.43,.43),wy+.14,wz+.33+range(-.06,.11),range(.11,.18),.045,range(.08,.15),'#d5eae3');
 for(let i=0;i<32;i++){let p=waterPath[Math.floor(range(0,waterPath.length))],a=range(0,6.283),x=p[0]+Math.cos(a)*.78,z=p[1]+Math.sin(a)*.62;orb(x,ground(x,z)+.14,z,range(.13,.3),range(.12,.3),range(.14,.30),pick(['#a9b3a2','#bac2ab','#d3c9b0']));}
 function footbridge(x,z,width=1.25,length=2.4){let y=ground(x,z)+.3;for(let i=0;i<17;i++){let a=-1+i/8,yy=y+.34*(1-a*a);cube(x,yy,z+a*length/2,width,.10,length/17+.013,'#c29967',0,true,1);}for(let side of[-1,1]){let pts=[];for(let i=0;i<13;i++){let a=-1+i/6,yy=y+.34*(1-a*a);if(i%2===0){cube(x+side*width/2,yy+.31,z+a*length/2,.085,.65,.085,C.woodLight);bead(x+side*width/2,yy+.64,z+a*length/2,.062,C.rail);}pts.push([x+side*width/2,yy+.60,z+a*length/2]);}for(let i=0;i<12;i++){beam(pts[i],pts[i+1],.09,.10,C.wood);beam(V.add(pts[i],[0,-.28,0]),V.add(pts[i+1],[0,-.28,0]),.06,.07,C.woodLight);}}}
 footbridge(1.2,11.25,1.65,2.9);footbridge(8.4,8.0,1.25,2.15);
 // A terraced stone garden follows the foot of the stage. The coping and blocks are geometry.
 const terraceLine=[[-4.0,4.15],[-1.8,4.70],[2.0,4.85],[5.8,4.72],[8.0,4.58],[9.2,4.35]];
 const terrace=cat(terraceLine,44);
 for(let i=0;i<terrace.length-1;i++){
  const a=terrace[i],b=terrace[i+1],dx=b[0]-a[0],dz=b[1]-a[1],dist=Math.hypot(dx,dz),xx=(a[0]+b[0])/2,zz=(a[1]+b[1])/2,rot=-Math.atan2(dz,dx),top=ground(xx,zz)+.22,bottom=ground(xx,zz+.72)-.17;
  let height=Math.max(.30,top-bottom);
  cube(xx,(top+bottom)/2,zz,dist+.025,height,.36,'#aca99c',rot,false,3);
  cube(xx,top+.045,zz,dist+.06,.13,.43,'#d3caba',rot,true,3);
  for(let row=0;row<3;row++){
   const yy=bottom+(row+.5)*height/3;
   cube(xx+((row%2)*.10),yy,zz+.195,dist*.96,height*.285,.12,pick(['#b4b4a6','#bebcac','#a9ac9e','#c8c2b2']),rot+range(-.03,.03),true,3);
  }
 }
 // Border planting in clusters; the front path stays visually readable.
 for(let i=0;i<40;i++){
  let t=i/39*(terrace.length-1),pt=terrace[Math.floor(t)],x=pt[0]+range(-.14,.14),z=pt[1]-.29;
  let y=ground(x,z)+.23,ss=range(.13,.26);orb(x,y,z,ss,ss*.7,ss*.8,pick(C.green));
  if(i%5===0)for(let j=0;j<3;j++)orb(x+range(-.16,.16),y+.20,z+range(-.12,.12),.075,.065,.072,pick(C.pink));
 }
 // Additional individual cobbles on the access courtyards, no photographic texture maps.
 function pavers(points,width){let pts=cat(points,60);for(let i=1;i<pts.length-1;i+=2){let a=pts[i],b=pts[i+1],t=V.unit([b[0]-a[0],0,b[1]-a[1]]);for(let j=-1;j<=1;j++){let x=a[0]-t[2]*j*width*.29,z=a[1]+t[0]*j*width*.29;cube(x,ground(x,z)+.083,z,width*.26,.017,.22,pick(['#ded4c1','#d5cebd','#e5d9c4']),Math.atan2(t[0],t[2]),true,3);}}}
 pavers(leftWalk,1.3);
 // Garden rails follow the path, with openings near stairs and pavilions.
 function pathFence(points,width,height=.5){let pts=cat(points,35);for(let i=0;i<pts.length-1;i++){let a=pts[i],b=pts[i+1],d=V.unit([b[0]-a[0],0,b[1]-a[1]]),off=[-d[2]*width,d[0]*width],aa=[a[0]+off[0],ground(a[0]+off[0],a[1]+off[1])+.10,a[1]+off[1]],bb=[b[0]+off[0],ground(b[0]+off[0],b[1]+off[1])+.10,b[1]+off[1]];railing(aa,bb,height,.72);}}
 pathFence([[-3.2,6.0],[1,5.6],[5.2,5.9],[9,6.0]],-.80,.46);pathFence([[12.5,9.1],[15.3,7.1],[16.6,3.7],[16.0,.0]],-.9,.52);
 stairs([16.2,ground(16.2,5.8)+.12,5.8],[15.85,ground(15.85,-2.4)+.12,-2.4],1.02,26);
 // Buildings in a distant, quiet town: varied roofs and footprints instead of a repeated foreground grid.
 function townHouse(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return townHouseGeometry(...args);}finally{scene.__anchor=prev;}}
 function townHouseGeometry(x,z,s,color,rot=0){let y=ground(x,z);cube(x,y+.5*s,z,1.3*s,1.0*s,1.2*s,color,rot,true);roof(x,y+1.0*s,z,1.65*s,1.55*s,.48*s,pick(['#899996','#a4afa3','#ba9e8b','#92a4ad']),rot);for(let d of[-.36,.36])cube(x+d*s,y+.6*s,z+.605*s,.22*s,.37*s,.015,'#a3aca5',rot,false);}
 for(let row=0;row<4;row++)for(let k=0;k<10;k++){let x=-18.3+k*1.03+range(-.13,.13),z=-12.45+row*1.08+range(-.15,.15);townHouse(x,z,range(.52,.85),pick(['#e3d9ba','#e3d3bd','#cad6c4','#e9d9c4','#d5dcd2']),range(-.07,.07));}
 // Five curved petals, modelled as a small solid rosette rather than a painted dot.
 const blossomFloret=mesh('five-curved-petal-blossom');
 for(let pet=0;pet<5;pet++){
  let ang=pet*Math.PI*2/5;
  const P=(u,v,back=false)=>{
    let r=.12+u*.68,width=Math.pow(Math.sin(Math.PI*u),.62)*.255*v;
    let yy=.11*Math.sin(Math.PI*u)-.08*u*u+.10*(1-v*v)*Math.sin(Math.PI*u);
    if(back)yy-=.036;
    return[Math.cos(ang)*r-Math.sin(ang)*width,yy,Math.sin(ang)*r+Math.cos(ang)*width];
  };
  for(let side of[false,true])for(let i=0;i<7;i++)for(let j=0;j<3;j++){
    let u=i/7,uu=(i+1)/7,v=-1+j*2/3,vv=v+2/3;
    blossomFloret.quad(P(u,v,side),P(uu,v,side),P(uu,vv,side),P(u,vv,side));
  }
 }
 // Handcrafted tree families. Each crown is composed of differently sized, overlapping lobes.
 const treeCenters=[];
 function tree(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return treeGeometry(...args);}finally{scene.__anchor=prev;}}
 function treeGeometry(x,z,s=1,family='green',customY){
  if(z>9)s*=.82;else s*=.95;
  const y=customY??ground(x,z),bloom=family!=='green',h=range(1.28,1.85)*s,wide=range(.91,1.21),lean=range(-.2,.2)*s;
  treeCenters.push([x,z]); const phase=range(0,6.283),pal=family==='pink'?C.pink:family==='cream'?C.cream:family==='orange'?C.orange:C.green;
  const base=rgb(pick(pal));
  // Three tapered segments give the trunk a slight natural bend.
  const trunk=[[x,y,z],[x+lean*.12,y+h*.27,z+.03*s],[x+lean*.72,y+h*.56,z-.03*s],[x+lean,y+h*.84,z]];
  for(let ti=0;ti<3;ti++)tube(trunk[ti],trunk[ti+1],(.082-ti*.016)*s,C.woodDark);
  const branches=bloom?6:5;
  for(let k=0;k<branches;k++){
   let a=phase+k*2.399,rr=(k===0?.12:range(.30,.57))*s*wide;
   let bx=x+lean+Math.cos(a)*rr,bz=z+Math.sin(a)*rr*.86,by=y+h+range(-.25,.3)*s;
   tube([x+lean*.6,y+h*.48,z],[bx,by,bz],.035*s,C.woodShade);
   let cr=range(.40,.55)*s;
   let count=bloom?9:6;
   for(let j=0;j<count;j++){
    let t=phase+j*2.39996+(bloom?0:.83*k),rad=j===0?0:cr*.60,ly=j===0?cr*.35:Math.sin(j*1.6)*cr*.25;
    let r=cr*(bloom?range(.48,.68):range(.48,.68)),lift=Math.round(range(-.025,.025)*100)/100,col=base.map(v=>Math.min(.97,Math.max(.04,v+lift)));
    const cx=bx+Math.cos(t)*rad,cy=by+ly,cz=bz+Math.sin(t)*rad*.9;
    if(bloom)orb(cx,cy,cz,r*range(.91,1.18),r*range(.88,1.17),r,col,Q.y(t));
    else inst(leafTuft,[cx,cy,cz],[r*range(.97,1.13),r*range(.94,1.12),r],col,Q.mul(Q.y(t),Q.axis([1,0,0],range(-.12,.12))),4);
    if(bloom&&j%3===1&&z>-13&&z<15){
      for(let f=0;f<3;f++){let a=t+f*2.094,rr=r*.25;
        const pp=[cx+Math.cos(a)*r*.63,cy+r*.72,cz+Math.sin(a)*r*.63],qq=Q.fromY([Math.cos(a)*.50,.85,Math.sin(a)*.50]);
        inst(blossomFloret,pp,[rr*1.43,rr*1.43,rr*1.43],col.map(v=>Math.min(.995,v+.065)),qq,4);
        bead(pp[0],pp[1]+.018,pp[2],rr*.12,'#edc27b');
      }
    }
   }
  }
  if(!bloom && rnd()<.15){ for(let j=0;j<3;j++)orb(x+range(-.4,.4)*s,y+.15*s,z+range(-.4,.4)*s,.24*s,.18*s,.24*s,pick(C.green));}
 }
 function pine(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return pineGeometry(...args);}finally{scene.__anchor=prev;}}
 function pineGeometry(x,z,s=1,customY){let y=customY??ground(x,z);treeCenters.push([x,z]);pole(x,y+1.2*s,z,.085*s,2.4*s,C.woodShade);for(let i=0;i<4;i++)inst(cone,[x,y+(.62+i*.58)*s,z],[(.68-i*.12)*s,1.35*s,(.66-i*.12)*s],pick(['#829662','#98a773','#718757']),Q.y(range(0,6.283)),4);}
 function shrub(x,z,s=.45,customY){let y=customY??ground(x,z);for(let i=0;i<3;i++){let xx=x+(i-1)*s*.36,zz=z+range(-.2,.2)*s;orb(xx,y+.25*s,zz,s*.40,s*.42,s*.42,pick(C.green));}}
 function distTo(points,x,z){let best=1e9;for(let p of points)best=Math.min(best,Math.hypot(p[0]-x,p[1]-z));return best;}
 function isFree(x,z){if(z>9.5&&((x<-6)||(x>11)))return false;if(Math.hypot((x-6.8)/2.35,(z-8.3)/1.5)<1)return false;if(x>-4.4&&x<9.6&&z>3.8&&z<5.3)return false;let lx=templePivot[0]+Math.cos(templeAngle)*(x-templePivot[0])-Math.sin(templeAngle)*(z-templePivot[1]),lz=templePivot[1]+Math.sin(templeAngle)*(x-templePivot[0])+Math.cos(templeAngle)*(z-templePivot[1]);if(lx>-5.2&&lx<8.2&&lz>-7.8&&lz<3.65)return false;if(Math.hypot((x-13.4)*.94,z-6.5)<3.0)return false;if(Math.hypot((x+9)*.65,z-4.5)<3.05)return false;
 for(let[cx,cz,r]of[[-14.6,.25,2.0],[-15.1,7.7,2.0],[-2.4,8.2,1.7],[9.6,7.9,1.2],[16.1,-5.2,2],[-7.8,-6.65,2.1],[-11.8,-2.8,1.7]])if(Math.hypot(x-cx,z-cz)<r)return false;
 if(distTo(forepath,x,z)<1.15||distTo(leftpath,x,z)<1.02||distTo(middlepath,x,z)<.9||distTo(waterPath,x,z)<.80)return false;if(x>-7.9&&x<-5.0&&z>.1&&z<7.5)return false;return true;}
 // Dense overlapping woodland behind the temple.
 for(let i=0;i<1600;i++){let x=range(-7.0,18.7),z=range(-12.8,-5.2);if(!isFree(x,z))continue;if(treeCenters.some(p=>Math.hypot(x-p[0],z-p[1])<.83))continue;let fam=pick(['green','green','green','green','green','pink','pink','pink','cream','orange']),s=range(.55,1.18);if(rnd()<.14)pine(x,z,s);else tree(x,z,s,fam);}
 // Foreground groves are arranged in groups, not rows.
 for(let i=0;i<920;i++){let x=range(-18.7,18.6),z=range(-7,12.6);if(!isFree(x,z))continue;if(treeCenters.some(p=>Math.hypot(x-p[0],z-p[1])<1.05))continue;let s=range(.58,1.03);if(rnd()<.22)pine(x,z,s);else tree(x,z,s,pick(['green','green','green','green','pink','pink','cream','orange']));}
 // Deliberate blossom accents at the stage and garden, with lower crowns preserving the architecture.
 for(let [x,z,s]of[[-4.2,2.7,.72],[-2.8,3.8,.66],[7.5,3.7,.85],[8.8,2.5,.86],[-12.4,5.0,.7],[-10.8,6.0,.63],[5.8,7.6,.68],[16.7,7.7,.65],[-16.9,10.5,.75]])if(isFree(x,z))tree(x,z,s,'pink');

 for(let [x,z,size,family] of[[-4.1,3.35,.75,'pink'],[-2.65,3.62,.58,'cream'],[6.7,3.45,.61,'green'],[7.7,3.18,.71,'pink']])tree(x,z,size,family);
 for(let i=0;i<28;i++){let x=-3.7+i*.36,z=3.20+Math.sin(i*.6)*.2;shrub(x,z,range(.25,.42));if(i%6===0)orb(x,ground(x,z)+.1,z,.22,.14,.18,'#a9af97');}
 for(let i=0;i<190;i++){let x=range(-18.4,18.4),z=range(-12.1,12.5);if(isFree(x,z)&&rnd()<.76)shrub(x,z,range(.25,.63));}
 for(let i=0;i<16;i++){let a=i/16*6.283,x=-9+Math.cos(a)*2.24,z=4.5+Math.sin(a)*1.35;shrub(x,z,range(.32,.46),gardenY+.17);}
 for(let pts of [forepath,leftpath,middlepath])for(let i=2;i<pts.length-2;i+=3){let p=pts[i],d=V.unit([pts[i+1][0]-pts[i-1][0],0,pts[i+1][1]-pts[i-1][1]]),side=rnd()<.5?-1:1,x=p[0]-d[2]*side*1.02,z=p[1]+d[0]*side*1.02;if(!isFree(x,z))continue;orb(x,ground(x,z)+.09,z,range(.13,.22),range(.08,.16),range(.12,.19),pick(['#bebba5','#9ca88b','#c8bea7']));if(rnd()<.4){for(let j=0;j<4;j++){let xx=x+range(-.3,.3),zz=z+range(-.2,.2);bead(xx,ground(xx,zz)+.14,zz,.065,pick(C.pink));}}}
 // Small stone lanterns and benches add a human scale without crowding the screen with labels.
 function lantern(x,z,s=.6,y=ground(x,z)){cube(x,y+.07*s,z,.52*s,.14*s,.52*s,C.stoneLight);pole(x,y+.65*s,z,.10*s,1.05*s,C.stone);cube(x,y+1.15*s,z,.38*s,.33*s,.38*s,C.stoneLight);cube(x,y+1.17*s,z+.2*s,.15*s,.16*s,.018,'#777666',0,false);roof(x,y+1.35*s,z,.68*s,.68*s,.3*s,'#9c9d8d');bead(x,y+1.72*s,z,.08*s,C.stoneLight);}
 for(let[x,z]of[[-13.5,6.1],[-11.8,1.2],[-8.4,9.5],[-3.5,6.8],[4.7,5.05],[10,6.7],[15.7,6.2],[15.0,-4.9]])lantern(x,z,.66);
 function bench(x,z,r=0){let y=ground(x,z);cube(x,y+.43,z,1.15,.12,.39,C.woodLight,r,true,1);for(let s of[-1,1])cube(x+s*.40,y+.20,z,.10,.4,.28,C.woodDark,r,true,1);}
 bench(-10.0,8.4);bench(4.0,6.8);bench(14.5,6.5,Math.PI/2);
 // Tiny visitors are sculptures, not live tracking or simulated crowds.
 function person(x,z,y,angle=0,s=1){
  const shirt=pick(['#648a9b','#d18f7e','#e2d8c0','#a5a48f','#6f8176','#ba9d86','#dbb172']),pants=pick(['#5e6571','#787f79','#908478']),skin='#ceab8a';
  const axis=[Math.cos(angle),-Math.sin(angle)],front=[Math.sin(angle),Math.cos(angle)],stride=range(-.06,.06)*s;
  for(let side of[-1,1]){
   const xx=x+axis[0]*side*.052*s,zz=z+axis[1]*side*.052*s;
   tube([xx,y+.245*s,zz],[xx+front[0]*side*stride,y+.04*s,zz+front[1]*side*stride],.027*s,pants);
   cube(xx+front[0]*side*stride,y+.022*s,zz+front[1]*side*stride,.057*s,.037*s,.10*s,'#575957',angle,true);
  }
  inst(taper,[x,y+.347*s,z],[.112*s,.25*s,.080*s],shirt,Q.y(angle),0);
  bead(x,y+.535*s,z,.087*s,skin);
  inst(tinyBall,[x,y+.588*s,z],[.086*s,.050*s,.082*s],pick(['#6c5440','#54463c','#85745e']));
  for(let side of[-1,1]){let xx=x+axis[0]*side*.122*s,zz=z+axis[1]*side*.122*s;tube([xx,y+.425*s,zz],[xx-front[0]*side*stride,y+.26*s,zz-front[1]*side*stride],.029*s,shirt);bead(xx-front[0]*side*stride,y+.25*s,zz-front[1]*side*stride,.027*s,skin);}
  if(rnd()<.18){let xx=x-front[0]*.10*s,zz=z-front[1]*.10*s;cube(xx,y+.35*s,zz,.13*s,.16*s,.09*s,pick(['#9c7767','#ad9880','#73969c']),angle,true);}
 }
 for(let pts of[forepath,leftpath,middlepath])for(let i=3;i<pts.length-4;i+=Math.floor(range(4,7))){let p=pts[i],x=p[0]+range(-.42,.42),z=p[1]+range(-.33,.33);person(x,z,ground(x,z)+.10,range(0,6.283),range(.89,1.13));if(rnd()<.45)person(x+.28,z+.12,ground(x+.28,z+.12)+.1,range(0,6.283),.91);}
 for(let i=0;i<21;i++){let x=tx-5.0+range(0,10),z=range(.15,1.96);let pp=templePoint([x,floor+.07,z]);person(pp[0],pp[2],pp[1],range(0,6.283)+templeAngle,range(.94,1.12));}
 for(let i=0;i<9;i++){let x=10+range(0,4.3),z=.7+range(0,.32);person(x,z,ground(x,z)+.10,range(0,6.283),range(.88,1.04));}
 // Clay clouds kept in the same model, so rotation still reveals volume.
 function cloud(x,y,z,s){for(let [xx,yy,zz,r]of[[-.8,0,0,.44],[-.22,.08,0,.58],[.20,.40,-.02,.62],[.66,.04,0,.51],[1.0,-.1,.04,.36],[.04,-.14,.12,.53]])orb(x+xx*s,y+yy*s,z+zz*s,r*s,r*s*.73,r*s*.8,'#f7eee1');}

 cloud(-21,13,-23,1.75);cloud(-4,17,-37,2.05);cloud(19,17,-25,1.70);
 // A distant blue ridge is scenery, not reused photographic imagery.
 function ridge(name,z,y,w,h,c){
  let m=mesh(name+'-landform');
  const P=(i,j)=>{let u=i/90,v=j/14,xx=-w/2+u*w;
    let peak=h*(.56+.25*Math.sin(u*31)+.12*Math.cos(u*67));
    return[xx,-.25+(y+peak)*Math.pow(Math.sin(Math.PI*v),.74),z+(v-.5)*22];};
  for(let i=0;i<90;i++)for(let j=0;j<14;j++)m.quad(P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1));
  inst(m,[0,0,0],[1,1,1],c,undefined,6);
 }
 ridge('distant-soft-ridge',-52,4.5,150,5.8,'#acc7d3');ridge('near-soft-ridge',-46,2.1,145,4.0,'#9dbdcc');
 // 03: Built foreground streets with real shopfronts, awnings, tiled roofs and local gardens.
 // This layer is an artistic layout, NOT a claimed reconstruction of Sannenzaka or Yasaka.

 const machiyaRoof=mesh('swept-kirizuma-roof'),tileRidge=mesh('glazed-convex-roof-tile');
 function houseRoofPoint(u,v,side){return[u*.5,Math.pow(Math.max(0,1-v),1.22)+.055*Math.pow(v,6)+.045*Math.pow(Math.abs(u),5)*Math.pow(v,5),side*v*.5];}
 for(let side of[-1,1])for(let i=0;i<20;i++)for(let j=0;j<18;j++){
  const u=-1+i*.1,v=j/18,uu=u+.1,vv=v+1/18,n=(a,b)=>{const dx=V.sub(houseRoofPoint(a+.001,b,side),houseRoofPoint(a-.001,b,side)),dy=V.sub(houseRoofPoint(a,b+.001,side),houseRoofPoint(a,b-.001,side));let nn=V.unit(V.cross(dx,dy));return nn[1]<0?V.mul(nn,-1):nn;};
  machiyaRoof.tri(houseRoofPoint(u,v,side),houseRoofPoint(uu,v,side),houseRoofPoint(uu,vv,side),n(u,v),n(uu,v),n(uu,vv));machiyaRoof.tri(houseRoofPoint(u,v,side),houseRoofPoint(uu,vv,side),houseRoofPoint(u,vv,side),n(u,v),n(uu,vv),n(u,vv));
 }
 function tiledHouseRoof(x,y,z,w,d,h,col){
  inst(machiyaRoof,[x,y,z],[w,h,d],col,undefined,2);
  inst(machiyaRoof,[x,y-.11,z],[w*.998,h,d*.998], '#6b6262',undefined,2);
  // Layered rounded ridge and two subtle sloped end caps.
  tube([x-w*.51,y+h+.045,z],[x+w*.51,y+h+.045,z],.075,'#90858a');
  tube([x-w*.53,y+h+.11,z],[x+w*.53,y+h+.11,z],.050,'#9b9195');
  let cols=Math.round(w/.115);
  for(let side of[-1,1])for(let i=0;i<=cols;i++){
   const u=-1+2*i/cols;
   for(let j=0;j<8;j++){
    let p=houseRoofPoint(u,j/8,side),q=houseRoofPoint(u,(j+1)/8,side);
    beam([x+p[0]*w,y+p[1]*h+.029,z+p[2]*d],[x+q[0]*w,y+q[1]*h+.029,z+q[2]*d],.023,.026,rgb(col).map(v=>Math.min(1,v+.025)),false);
   }
   let t=houseRoofPoint(u,1,side);orb(x+t[0]*w,y+t[1]*h-.023,z+t[2]*d,.027,.038,.039,rgb(col).map(v=>Math.min(1,v+.06)));
  }
  // Brown boarded gable triangles, side openings rather than blank paper boxes.
  for(let side of[-1,1]){
   let m=mesh('roof-end-'+x+'-'+z+'-'+side);m.tri([side*w*.40,0,-d*.37],[side*w*.40,0,d*.37],[side*w*.40,h*.83,0],[side,0,0]);inst(m,[x,y-.04,z],[1,1,1],'#b0875a');
   for(let j=-3;j<=3;j++){
    let zz=j*d*.09,hh=h*(.82-Math.abs(j)*.19);if(hh>0)cube(x+side*w*.405,y+hh/2,z+zz,.025,hh,.022,'#d9b37f',0,false,1);
   }
  }
 }
 function machiya(...args){const prev=scene.__anchor;scene.__anchor=[args[0],args[1]];try{return machiyaGeometry(...args);}finally{scene.__anchor=prev;}}
 function machiyaGeometry(x,z,scale=1,angle=0,variant=0,atY){
  const y=atY??ground(x,z),S=scale, snapshot=new Map(scene.meshes.map(m=>[m,m.instances.length]));
  const wd=(2.44+.14*(variant%3))*S,deep=(2.05+.11*(variant%3))*S,stories=variant%4===0?1:2,H=(stories===1?1.43:1.98)*S;
  const plaster=pick(['#ead4ad','#e8cfa6','#edddbc','#f3e3c1','#e5c59a']),timber=pick(['#a87145','#9c6941','#b88755']);
  const tile=pick(['#71717e','#77777f','#72727b','#80747d','#687680','#877870']);
  cube(x,y+.13*S,z,wd+.25*S,.27*S,deep+.29*S,'#b8b4a4',0,true,3);
  cube(x,y+H/2+.17*S,z,wd,H,deep,plaster,0,true);
  for(let v of[-1,1]){let xx=x+v*wd*.56,zz=z+deep*.50;shrub(xx,zz,.31*S,y+.1*S);}
  for(let zz of[-1,1]){
   for(let i=0;i<5;i++) cube(x-wd*.46+i*wd*.23,y+.18*S+H/2,z+zz*(deep/2+.027*S),.085*S,H,.076*S,timber,0,true,1);
   for(let yy of[.28*S,H*.58,H+.12*S])cube(x,y+yy,z+zz*(deep/2+.055*S),wd+.07*S,.11*S,.10*S,timber,0,true,1);
  }
  for(let side of[-1,1])for(let v of[-1,0,1]){
   cube(x+side*(wd/2+.018*S),y+.18*S+H/2,z+v*deep*.44,.078*S,H,.092*S,timber,0,true,1);
   if(stories>1){cube(x+side*(wd/2+.04*S),y+H*.73,z,.031*S,.48*S,deep*.51,'#9b8263',0,false);for(let j=0;j<6;j++)cube(x+side*(wd/2+.068*S),y+H*.73,z+(-.23+j*.092)*deep,.041*S,.48*S,.023*S,'#d3b280',0,false,1);}
  }
  const front=z+deep/2+.071*S;
  // Ground floor shaded entry and inset glazed shop window.
  cube(x-wd*.25,y+.65*S,front,wd*.30,1.03*S,.055*S,'#634c3a',0,true);
  cube(x+wd*.18,y+.69*S,front,wd*.46,.81*S,.052*S,'#bc9d6a',0,true);
  for(let i=0;i<7;i++)cube(x+wd*.18-wd*.20+i*wd*.067,y+.69*S,front+.04*S,.025*S,.81*S,.04*S,'#9f7549',0,false,1);
  cube(x+wd*.18,y+.66*S,front+.05*S,wd*.46,.032*S,.04*S,timber,0,false,1);
  if(stories>1){
   for(let wx of[-wd*.27,wd*.25]){
    cube(x+wx,y+H*.775,front,.59*S,.56*S,.05*S,'#8f7759',0,true);
    for(let i=0;i<5;i++)cube(x+wx+(-.25+i*.125)*S,y+H*.775,front+.04*S,.025*S,.56*S,.04*S,'#d4ac73',0,false,1);
    cube(x+wx,y+H*.77-.04*S,front+.05*S,.61*S,.029*S,.032*S,timber,0,false,1);
   }
   cube(x,y+H*.57,front+.07*S,wd+.1*S,.11*S,.15*S,timber,0,true,1);
  }
  // Thin, gracefully upturned tiled roof over the house.
  tiledHouseRoof(x,y+H+.16*S,z,wd+.60*S,deep+.64*S,.83*S,tile);
  // Deep projecting eaves create warm, real shadows at street level.
  const az=front+.24*S,ay=y+1.34*S;
  cube(x,ay-.04*S,az,wd+.32*S,.105*S,.76*S,'#775b41',0,true,1);
  for(let j=0;j<22;j++){
   let xx=x-(wd+.38*S)/2+j*(wd+.38*S)/21;
   beam([xx,ay+.14*S,az-.42*S],[xx,ay+.015*S,az+.46*S],.055*S,.077*S,tile);
   bead(xx,ay+.012*S,az+.46*S,.041*S,'#aaa1a1');
  }
  for(let xx of[-wd*.42,wd*.42])beam([x+xx,y+1.12*S,front],[x+xx,ay-.09*S,az+.26*S],.062*S,.065*S,timber);
  // Noren, signs, lanterns, and goods; intentionally no invented store names.
  const fabric=pick(['#ad6661','#67878d','#8d9c76','#dcaa70','#a28987']);
  if(variant%3!==1)for(let j=0;j<3;j++)cube(x-wd*.25+(j-1)*.21*S,y+1.08*S,front+.11*S,.205*S,.26*S,.025*S,fabric,0,true);
  cube(x+wd*.40,y+1.76*S,front+.08*S,.25*S,.79*S,.13*S,'#dcc59a',0,true,1);
  for(let j=0;j<4;j++)cube(x+wd*.4,y+1.98*S-j*.135*S,front+.153*S,.08*S,.019*S,.012*S,timber,0,true,1);
  if(variant%2===0){orb(x-wd*.55,y+1.11*S,front+.16*S,.14*S,.23*S,.14*S,'#d48975');for(let h of[-1,1])pole(x-wd*.55,y+1.11*S+h*.20*S,front+.16*S,.09*S,.06*S,'#87674e');}
  // Planter jars, green clumps, baskets and an entrance stone step.
  cube(x-wd*.26,y+.18*S,front+.25*S,.68*S,.10*S,.35*S,'#d4c8b2',0,true,3);
  for(let side of[-1,1]){
   let ax=x+side*wd*.47,bz=front+.50*S;
   inst(taper,[ax,y+.14*S,bz],[.15*S,.29*S,.15*S],pick(['#a58162','#aea086','#ae7f58']));
   for(let j=0;j<3;j++)orb(ax+(j-1)*.095*S,y+.38*S,bz+Math.sin(j)*.05*S,.105*S,.12*S,.11*S,pick(C.green));
  }
  if(variant%4===0){cube(x+wd*.2,y+.38*S,front+.55*S,.62*S,.13*S,.40*S,'#bc9a6e',0,true,1);for(let j=0;j<5;j++)orb(x+wd*.2+range(-.23,.23)*S,y+.49*S,front+.54*S,.075*S,.067*S,.085*S,pick(C.orange));}
  if(angle)for(let m of scene.meshes)for(let j=snapshot.get(m)||0;j<m.instances.length;j++){
   let v=m.instances[j],dx=v.p[0]-x,dz=v.p[2]-z;v.p[0]=x+Math.cos(angle)*dx+Math.sin(angle)*dz;v.p[2]=z-Math.sin(angle)*dx+Math.cos(angle)*dz;v.q=Q.mul(Q.y(angle),v.q);
  }
 }
 const streetA=[[-23,4],[-17,9],[-12,12],[-7,15],[-1,18],[5,21],[13,28],[18,34]];
 const streetB=[[-23,20],[-15,21],[-9,22],[-3,21],[4,17],[10,14],[20,14]];
 ribbon('shop-street-border',streetA,2.1,'#d5c8ae');ribbon('shop-street-pavement',streetA,1.82,'#dfd3bb',ground,.08);
 ribbon('cross-street-border',streetB,2,'#d5c8ae');ribbon('cross-street-pavement',streetB,1.72,'#e0d5bf',ground,.08);
 const nearHouses=[];
 for(let row of [
  [[-17,12.8,1.08,-.26],[-13.6,14.9,.96,-.38],[-10.3,17.2,1.07,-.40],[-6.6,19.2,.96,-.40],[-2.5,21.8,1.07,-.45],[2.0,24.5,1.15,-.45],[6.4,27.4,1.1,-.4]],
  [[-20.1,10.3,.92,2.60],[-16.9,8.6,.85,2.6],[-12.7,10.1,.92,2.7],[-9.0,12.0,1.04,2.6],[-5.5,13.9,.9,2.6],[-1.8,15.9,.99,2.6],[2.1,17.8,.92,2.5],[6.2,20.0,1.1,2.5],[10.3,23.4,1.04,2.5]],
  [[-21.2,24.8,1.1,.04],[-17.5,25.1,1.12,.09],[-13.7,25.4,1.02,.06],[-9.8,25.4,1.08,.04],[-5.5,27.3,1.15,.04],[-1.4,29.3,1.0,-.12],[3.8,32.9,1.22,.02]],
  [[17.5,11.1,.91,1.6],[17.8,15.1,1.06,1.6],[18.1,19.3,1.09,1.65],[18.4,23.8,1.04,1.65]]
 ])for(let a of row){nearHouses.push(a);machiya(...a,nearHouses.length);}
 // A denser transition between the display garden and the streets.
 for(let [x,z,s,f]of[[-22,9,1.4,'green'],[-20,15,1.2,'pink'],[-16.1,16.5,1.15,'pink'],[-12.3,18.4,1.0,'green'],[-8.3,20.2,1.15,'pink'],[-4.3,22.1,1.4,'cream'],[-18,28,1.25,'pink'],[-12,28,1.2,'green'],[-7,29,1.2,'pink'],[1.5,29,1.3,'pink'],[9.8,18.1,1.1,'pink'],[12.1,21,1.4,'green'],[15,24.2,1.15,'pink'],[14.7,14,1.2,'green'],[-18.5,4.5,1.15,'green']])tree(x,z,s,f);
 // New street life: group visitors on their paths instead of scattered on the lawns.
 for(let road of [streetA,streetB]){
  let pts=cat(road,100);
  for(let i=2;i<98;i+=3){let p=pts[i],x=p[0]+range(-.55,.55),z=p[1]+range(-.45,.45);person(x,z,ground(x,z)+.11,range(0,6.28),range(.96,1.16));if(i%2===0)person(x+.26,z+.09,ground(x+.26,z+.09)+.11,range(0,6.28),1);}
  pavers(road,1.6);
 }
 // Many low, individualized roofs establish the city in the distance. All are geometry.
 for(let row=0;row<14;row++)for(let k=0;k<23;k++){
  let x=-45+k*1.65+range(-.25,.25),z=-36+row*1.54+range(-.22,.22);
  if(z> -13 && x> -20)continue;
  let s=range(.70,1.13),y=ground(x,z),h=range(.7,1.8),w=range(.9,1.6),d=range(.9,1.4),co=pick(['#e6d2b2','#e8d9c6','#dfc3ac','#cbd7bb','#d6dbe1','#e8cbbd']),r=range(-.03,.03);
  cube(x,y+h/2,z,w,h,d,co,r,true);
  if(rnd()<.82)roof(x,y+h,z,w+.23,d+.33,range(.30,.51),pick(['#9a999c','#829aaa','#a2a898','#b59892','#82918e','#aa9f96']),r);
  else cube(x,y+h,z,w+.12,.10,d+.12,'#bac4c3',0,true);
  if(row>3){for(let j=-1;j<=1;j++)cube(x+j*w*.25,y+h*.59,z+d/2+.022,.16,h*.32,.025,'#a2b4b5',0,false);}
 }
 // Woodland frames the east slope and town but leaves routes and silhouettes open.
 for(let k=0;k<310;k++){
  let x=range(19,29),z=range(-27,10);if(rnd()<.30)pine(x,z,range(.72,1.12));else tree(x,z,range(.74,1.13),pick(['green','green','green','pink','cream']));
 }
 for(let j=0;j<75;j++){
  let x=range(-33,-21),z=range(-5,29);if(nearHouses.some(p=>Math.hypot(x-p[0],z-p[1])<2))continue;
  if(rnd()<.18)pine(x,z,range(1,1.35));else tree(x,z,range(.92,1.3),pick(['green','green','pink','pink','cream']));
 }
 // Low flowering plantings glue the architecture to the ground without hiding it.
 for(let i=0;i<95;i++){
  let x=range(-18,18),z=range(-3,12);if(!isFree(x,z))continue;
  const h=ground(x,z);for(let j=0;j<4;j++){let xx=x+range(-.23,.23),zz=z+range(-.22,.22);orb(xx,h+.22,zz,.14,.15,.13,pick(C.green));if(rnd()<.5)orb(xx,h+.38,zz,.06,.06,.06,pick(C.pink));}
 }


 // The city has open lanes, varying directions, roof pitches and a wooded transition.
 for(let k=0;k<145;k++){
  let x=range(-23,14),z=range(-42,-17);if(x>-9&&z>-25)continue;
  if(rnd()<.40){tree(x,z,range(.9,1.25),pick(['green','green','pink','cream']));}
  else {let y=ground(x,z),h=range(.8,1.7),w=range(1.2,2);cube(x,y+h/2,z,w,h,w*.8,pick(['#decbb1','#d9dccb','#e0cfc3']),0,true);roof(x,y+h,z,w+.3,w*.8+.3,.4,pick(['#9a9697','#9ba5ab','#909f9a']));}
 }
 // Dense hillside behind the main hall blends into the blue ridge.
 for(let k=0;k<170;k++){let x=range(-8,27),z=range(-28,-13);if(x<-4&&z<-20)continue;if(rnd()<.2)pine(x,z,range(.8,1.2));else tree(x,z,range(.8,1.20),pick(['green','green','green','pink','cream']));}


 for(let [x,z,sz,f]of[[-3.8,3.9,.82,'pink'],[-1.9,4.0,.92,'cream'],[.1,4.1,.87,'green'],[2.3,4.1,.80,'green'],[4.1,4.1,.85,'pink'],[6.2,3.9,1.02,'pink'],[9.2,2.1,1.05,'green'],[11,-2.1,1.07,'pink'],[12.7,-2.5,1.1,'green']])tree(x,z,sz,f);
 for(let j=0;j<100;j++){
  let x=range(-23,20),z=range(10,30);
  if(nearHouses.some(h=>Math.hypot(x-h[0],z-h[1])<1.8)||distTo(cat(streetA,80),x,z)<1.4||distTo(cat(streetB,80),x,z)<1.25)continue;
  if(rnd()<.70)tree(x,z,range(.86,1.15),pick(['green','green','pink','pink','cream']));else pine(x,z,range(.9,1.2));
 }


 // Low garden groups and a thin margin of stones knit the buildings into the slope.
 for(let [xx,zz]of[[-12.2,6.3],[-4.9,7.2],[4.8,7.1],[10.3,7.9],[-13.8,11.4]]){
   for(let k=0;k<14;k++){
     let a=k*2.4,rr=.24+Math.sqrt(k)*.17,x=xx+Math.cos(a)*rr,z=zz+Math.sin(a)*rr*.72;
     if(distTo(forepath,x,z)<.86||distTo(middlepath,x,z)<.76)continue;
     let sy=ground(x,z),q=.16+.13*rnd();orb(x,sy+q*.5,z,q,q*.6,q*.9,pick(C.green));
     if(k%4===0)orb(x,sy+q*.5+.15,z,.095,.10,.09,pick(C.pink));
   }
 }
 // The lower edge is another part of the town rather than a blank green tabletop.
 for(let row=0;row<2;row++)for(let k=0;k<8;k++){
  let x=-23+k*5.2+(row%2)*1.9,z=32+row*6.0+(k>4?(k-4)*1.4:0);
  machiya(x,z,range(.96,1.16),pick([-.07,.08,-.23]),k+row*8);
 }
 const lowStreet=[[-30,34],[-20,36],[-10,38],[0,39],[14,43],[26,47]];
 ribbon('continuing-neighborhood-road',lowStreet,2.0,'#eadbc1',ground,.065);
 for(let k=0;k<65;k++){
  let x=range(-25,26),z=range(28,44);let near=(z-32)%6;
  if(Math.abs(near)<1.5 && ((x+23)%5.2)<3.3)continue;
  if(distTo(cat(lowStreet,80),x,z)<1.35)continue;
  tree(x,z,range(.95,1.5),pick(['pink','pink','green','green','cream']));
 }
 // A few spires in the distant roofs. These are generic, unlabeled design motifs.
 for(let [x,z]of[[-26,-22],[-16,-34]]){
   let yy=ground(x,z);for(let k=0;k<3;k++){
    let w=1.6*Math.pow(.83,k);cube(x,yy+.35,z,w,.70,w,'#d3b48b',0,true);roof(x,yy+.7,z,w*1.4,w*1.4,.55,'#a8958c');yy+=1.12;
   }pole(x,yy+.5,z,.04,1.2,'#b8a57d');
 }

 scene.named={temple:{target:[1.6,6.2,-.3],span:21.5,yaw:.52,pitch:.42},garden:{target:[-8.5,3.8,4],span:15.5,yaw:.26,pitch:.66},pagoda:{target:[13.4,6.7,6.5],span:18.8,yaw:.37,pitch:.53},whole:{target:[-2.6,5.8,1.8],span:49.0,yaw:.34,pitch:.58},hero:{target:[.5,5.1,5.0],span:39,yaw:.28,pitch:.50},streets:{target:[-2.8,3.8,16],span:28,yaw:.40,pitch:.61}};
 scene.revision='04 — joined roof levels, solid cedar courses, curved petals and multibounce light';scene.referenceSeason='spring';scene.previewMethod='Offline two-level BVH ray tracing; no reference images used as textures';scene.modelNotice='地理・配置は承認画像の構図を検証するための模式表現。観光経路には使えません。';scene.stats.trees=treeCenters.length;

 const sourceInstances=scene.meshes.reduce((n,m)=>n+m.instances.length,0);
 const sourceMain=scene.meshes.reduce((n,m)=>n+m.instances.filter(i=>i.group==='main-hall').length,0);
 const inside=(x,z)=>x>=-11&&x<=13&&z>=-10&&z<=7.5;
 for(const m of scene.meshes){
  const bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
  for(let k=0;k<m.p.length;k+=3){for(let a=0;a<3;a++){bounds[a]=Math.min(bounds[a],m.p[k+a]);bounds[a+3]=Math.max(bounds[a+3],m.p[k+a]);}}
  const localCentre=[(bounds[0]+bounds[3])/2,(bounds[1]+bounds[4])/2,(bounds[2]+bounds[5])/2];
  m.instances=m.instances.filter(i=>{
    if(i.group==='main-hall')return true;
    if(i.anchor)return inside(i.anchor[0],i.anchor[1]);
    if(m.name==='sculpted-hillside')return true;
    if(i.mat===8)return true;
    if(i.mat===6)return true;
    if(m.instances.length===1 && m.name.includes('road'))return false;
    const pp=V.add(i.p,Q.rotate?Q.rotate(localCentre.map((v,k)=>v*i.s[k]),i.q):localCentre.map((v,k)=>v*i.s[k]));
    return inside(pp[0],pp[2]);
  });
 }
 scene.meshes=scene.meshes.filter(m=>m.instances.length);
 const keptMain=scene.meshes.reduce((n,m)=>n+m.instances.filter(i=>i.group==='main-hall').length,0);
 if(keptMain!==sourceMain)throw Error('本堂モデルの保持検証に失敗しました');
 scene.stats={sourceInstances,mainHallInstances:keptMain,patch:'hondo-courtyard',geometryDecimation:false};
 return scene;
}
