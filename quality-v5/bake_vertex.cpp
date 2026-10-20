// Deterministic CPU lighting baker for the exact instanced model in scene.js.
// Two-level BVH, four-bounce transport and soft area-sun visibility.
// No reference pixels, external images or network requests are used.
#include <algorithm>
#include <array>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>
#include <unordered_map>
#include <cstring>
#include <omp.h>
using std::vector; const float PI=3.14159265359f,INF=1e30f;
struct V {float x=0,y=0,z=0; V(){} V(float a):x(a),y(a),z(a){} V(float a,float b,float c):x(a),y(b),z(c){} float operator[](int a) const{return a==0?x:(a==1?y:z);} float& operator[](int a){return a==0?x:(a==1?y:z);} V operator+(V b)const{return{x+b.x,y+b.y,z+b.z};} V operator-(V b)const{return{x-b.x,y-b.y,z-b.z};} V operator-()const{return{-x,-y,-z};} V operator*(float s)const{return{x*s,y*s,z*s};} V operator*(V b)const{return{x*b.x,y*b.y,z*b.z};} V operator/(V b)const{return{x/b.x,y/b.y,z/b.z};} V operator/(float s)const{return *this*(1/s);} V& operator+=(V b){*this=*this+b;return *this;} };
float dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;} V cross(V a,V b){return{a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x};} float length(V a){return sqrtf(dot(a,a));} V unit(V a){return a/(length(a)+1e-30f);} V vmin(V a,V b){return{std::min(a.x,b.x),std::min(a.y,b.y),std::min(a.z,b.z)};} V vmax(V a,V b){return{std::max(a.x,b.x),std::max(a.y,b.y),std::max(a.z,b.z)};} float clamp(float x,float a=0,float b=1){return std::max(a,std::min(b,x));} V mix(V a,V b,float t){return a*(1-t)+b*t;} float srgb(float v){return v<=.04045f?v/12.92f:powf((v+.055f)/1.055f,2.4f);} V lin(V v){return{srgb(v.x),srgb(v.y),srgb(v.z)};}
struct Q {V v;float w;V rot(V p)const{return p+cross(v,cross(v,p)+p*w)*2;} V unrot(V p)const{return p+cross(-v,cross(-v,p)+p*w)*2;}};
struct Ray {V o,d,iv;Ray(V a,V b):o(a),d(b),iv(1/(fabsf(b.x)<1e-19f?1e-19f:b.x),1/(fabsf(b.y)<1e-19f?1e-19f:b.y),1/(fabsf(b.z)<1e-19f?1e-19f:b.z)){} };
struct Box {V lo=V(INF),hi=V(-INF);void grow(V p){lo=vmin(lo,p);hi=vmax(hi,p);}void grow(const Box&b){lo=vmin(lo,b.lo);hi=vmax(hi,b.hi);} V center()const{return(lo+hi)*.5;}float area()const{V d=vmax(hi-lo,V(0));return 2*(d.x*d.y+d.x*d.z+d.y*d.z);}bool hit(const Ray&r,float tmax,float &near) const {V a=(lo-r.o)*r.iv,b=(hi-r.o)*r.iv,mn=vmin(a,b),mx=vmax(a,b);near=std::max(0.0001f,std::max(mn.x,std::max(mn.y,mn.z)));float far=std::min(tmax,std::min(mx.x,std::min(mx.y,mx.z)));return near<=far;}};
struct Node{Box b;int left=-1,right=-1,start=0,count=0;};
struct BVH {vector<Node> n;vector<int> order; const vector<Box>*boxes;int leaf=4;
 int buildNode(int a,int b){int id=n.size();n.push_back({});Box all,cent;for(int k=a;k<b;k++){all.grow((*boxes)[order[k]]);cent.grow((*boxes)[order[k]].center());}n[id].b=all;if(b-a<=leaf){n[id].start=a;n[id].count=b-a;return id;}
 const int B=12;float best=INF;int axis=-1,split=-1;V sz=cent.hi-cent.lo;
 for(int d=0;d<3;d++){if(sz[d]<1e-6)continue;std::array<Box,B> bb;std::array<int,B> count{};
 auto bin=[&](int k){return std::min(B-1,int(((*boxes)[k].center()[d]-cent.lo[d])/sz[d]*B));};
 for(int k=a;k<b;k++){int i=bin(order[k]);bb[i].grow((*boxes)[order[k]]);count[i]++;}
 std::array<float,B-1>cost;Box l;int nl=0;for(int j=0;j<B-1;j++){l.grow(bb[j]);nl+=count[j];cost[j]=l.area()*nl;}Box rr;int nr=0;for(int j=B-1;j>0;j--){rr.grow(bb[j]);nr+=count[j];float c=cost[j-1]+rr.area()*nr;if(c<best){best=c;axis=d;split=j-1;}} }
 int m=(a+b)/2;if(axis>=0){auto it=std::partition(order.begin()+a,order.begin()+b,[&](int k){return int(((*boxes)[k].center()[axis]-cent.lo[axis])/sz[axis]*B)<=split;});m=it-order.begin();}
 if(m==a||m==b||axis<0){axis=sz.y>sz.x?1:0;if(sz.z>sz[axis])axis=2;m=(a+b)/2;std::nth_element(order.begin()+a,order.begin()+m,order.begin()+b,[&](int i,int j){return(*boxes)[i].center()[axis]<(*boxes)[j].center()[axis];});}
 int l=buildNode(a,m),r=buildNode(m,b);n[id].left=l;n[id].right=r;return id;}
 void build(const vector<Box>&b,int lf=4){boxes=&b;leaf=lf;order.resize(b.size());std::iota(order.begin(),order.end(),0);n.reserve(b.size()*2);if(!b.empty())buildNode(0,b.size());boxes=nullptr;}
};
struct Tri{V a,b,c,na,nb,nc;float uv[6];};struct Geo{std::string name;vector<Tri> ts;BVH tree;Box box;};
struct Instance{int geo,mat;V p,s,c,albedo;Q q;Box box;};
struct Hit{float t=INF,u=0,v=0;int obj=-1,tri=-1;};
struct RNG{uint32_t s;RNG(uint32_t a):s(a?a:1){}uint32_t bits(){s^=s<<13;s^=s>>17;s^=s<<5;return s;}float next(){return(bits()>>8)*(1.f/16777216.f);}};
struct World{vector<Geo>gs;vector<Instance>ins;BVH top;V sunDir=unit(V(-30,48,24));V sunColor=V(1.0,.92,.83)*2.20;float envPower=.62;
 bool triangle(const Tri&t,const Ray&r,Hit&h,int tri,int obj)const{V e1=t.b-t.a,e2=t.c-t.a,p=cross(r.d,e2);float det=dot(e1,p);if(fabsf(det)<1e-10f)return false;float inv=1/det;V d=r.o-t.a;float u=dot(d,p)*inv;if(u<0||u>1)return false;V q=cross(d,e1);float v=dot(r.d,q)*inv;if(v<0||u+v>1)return false;float dist=dot(e2,q)*inv;if(dist<.00012f||dist>=h.t)return false;h.t=dist;h.u=u;h.v=v;h.obj=obj;h.tri=tri;return true;}
 bool geoTrace(int oi,const Ray&r,Hit&h,bool shadow)const{auto&o=ins[oi];Ray l(o.q.unrot(r.o-o.p)/o.s,o.q.unrot(r.d)/o.s);auto&g=gs[o.geo];int stack[128],sp=0;stack[sp++]=0;bool ok=false;
 while(sp){int ni=stack[--sp];auto&n=g.tree.n[ni];float near;if(!n.b.hit(l,h.t,near))continue;if(n.count){for(int k=n.start;k<n.start+n.count;k++){int t=g.tree.order[k];if(triangle(g.ts[t],l,h,t,oi)){ok=true;if(shadow)return true;}}}else{float a,b;bool ha=g.tree.n[n.left].b.hit(l,h.t,a),hb=g.tree.n[n.right].b.hit(l,h.t,b);if(ha&&hb){if(a<b){stack[sp++]=n.right;stack[sp++]=n.left;}else{stack[sp++]=n.left;stack[sp++]=n.right;}}else if(ha)stack[sp++]=n.left;else if(hb)stack[sp++]=n.right;}}return ok;}
 bool trace(const Ray&r,Hit&h,bool shadow=false)const{int stack[128],sp=0;stack[sp++]=0;bool ok=false;while(sp){auto&n=top.n[stack[--sp]];float near;if(!n.b.hit(r,h.t,near))continue;if(n.count){for(int k=n.start;k<n.start+n.count;k++){int oi=top.order[k];if(shadow&&ins[oi].mat==6)continue;if(!ins[oi].box.hit(r,h.t,near))continue;if(geoTrace(oi,r,h,shadow)){ok=true;if(shadow)return true;}}}else{float a,b;bool ha=top.n[n.left].b.hit(r,h.t,a),hb=top.n[n.right].b.hit(r,h.t,b);if(ha&&hb){if(a<b){stack[sp++]=n.right;stack[sp++]=n.left;}else{stack[sp++]=n.left;stack[sp++]=n.right;}}else if(ha)stack[sp++]=n.left;else if(hb)stack[sp++]=n.right;}}return ok;}
 V normal(const Hit&h)const{auto&o=ins[h.obj];auto&t=gs[o.geo].ts[h.tri];return unit(o.q.rot((t.na*(1-h.u-h.v)+t.nb*h.u+t.nc*h.v)/o.s));}
 V env(V d,bool background=false)const{float t=clamp(d.y*.5+.5);if(background){return mix(V(.53,.78,.82),V(.28,.66,.89),clamp(d.y*1.3+.65))*1.15;}return mix(V(.53,.49,.40),V(.66,.82,1),t)*envPower;}
 void read(const std::string&path){std::ifstream f(path,std::ios::binary);char magic[4];f.read(magic,4);uint32_t ng,ni;f.read((char*)&ng,4);f.read((char*)&ni,4);gs.resize(ng);
 for(auto&g:gs){uint32_t l,n;f.read((char*)&l,4);g.name.resize(l);f.read(g.name.data(),l);f.read((char*)&n,4);g.ts.resize(n);static_assert(sizeof(Tri)==96);f.read((char*)g.ts.data(),n*sizeof(Tri));vector<Box>bs(n);for(int i=0;i<n;i++){bs[i].grow(g.ts[i].a);bs[i].grow(g.ts[i].b);bs[i].grow(g.ts[i].c);bs[i].lo=bs[i].lo-V(.00002);bs[i].hi=bs[i].hi+V(.00002);g.box.grow(bs[i]);}g.tree.build(bs);}
 ins.resize(ni);vector<Box>bs(ni);for(auto&o:ins){uint32_t ge,ma;float a[13];f.read((char*)&ge,4);f.read((char*)&ma,4);f.read((char*)a,sizeof(a));o.geo=ge;o.mat=ma;o.p=V(a[0],a[1],a[2]);o.s=V(a[3],a[4],a[5]);o.q={V(a[6],a[7],a[8]),a[9]};o.c=V(a[10],a[11],a[12]);o.albedo=lin(o.c);auto&b=gs[ge].box;for(int k=0;k<8;k++){V p((k&1)?b.hi.x:b.lo.x,(k&2)?b.hi.y:b.lo.y,(k&4)?b.hi.z:b.lo.z);o.box.grow(o.p+o.q.rot(p*o.s));}o.box.lo=o.box.lo-V(.00005);o.box.hi=o.box.hi+V(.00005);bs[&o-ins.data()]=o.box;}
 if(!f)throw std::runtime_error("Truncated scene");top.build(bs,3);std::cerr<<"Loaded "<<ng<<" meshes, "<<ni<<" instances. TLAS "<<top.n.size()<<" nodes\n";}
};
V tangent(V n){return unit(cross(fabsf(n.y)>.95?V(1,0,0):V(0,1,0),n));}
V cosine(V n,RNG&r){float a=r.next()*2*PI,s=sqrtf(r.next());V t=tangent(n),b=cross(n,t);return unit(t*(s*cosf(a))+b*(s*sinf(a))+n*sqrtf(1-s*s));}
V sampleSun(V n,RNG&r){V t=tangent(n),b=cross(n,t);float a=r.next()*2*PI,s=sqrtf(r.next())*.105;return unit(n+t*(cosf(a)*s)+b*(sinf(a)*s));}
V radiance(const World&w,Ray ray,RNG&r){V throughput(1),out(0);float firstT=0;
 for(int depth=0;depth<4;depth++){Hit h;if(!w.trace(ray,h)){out+=throughput*w.env(ray.d,false);break;}const auto&o=w.ins[h.obj];V p=ray.o+ray.d*h.t,n=w.normal(h);if(dot(n,ray.d)>0)n=-n;V alb=o.albedo;const auto&tri=w.gs[o.geo].ts[h.tri];float u=tri.uv[0]*(1-h.u-h.v)+tri.uv[2]*h.u+tri.uv[4]*h.v,v=tri.uv[1]*(1-h.u-h.v)+tri.uv[3]*h.u+tri.uv[5]*h.v;
 if(depth==0)firstT=h.t;
 if(o.mat==6){out+=throughput*mix(w.env(ray.d,true),alb,.36);break;}
 if(o.mat==2){float grain=.99+.01*sinf(v*PI*180+u*2);alb=alb*grain;}
 if(o.mat==1){float grain=.986+.014*sinf(p.y*55+sinf(p.x*24)*1.5+p.z*14);alb=alb*grain;}
 if(o.mat==3){float g=sinf(p.x*50+sinf(p.y*43)+p.z*37);alb=alb*(.98+.02*g);}
 V light=sampleSun(w.sunDir,r);float nl=std::max(0.f,dot(n,light));if(nl>0){Hit sh;sh.t=150;bool oc=w.trace(Ray(p+n*.0008f,light),sh,true);if(!oc){V direct=alb*w.sunColor*nl;V half=unit(light-ray.d);float rough=o.mat==5?.16:(o.mat==2?.47:.7);float exponent=2/(rough*rough*rough*rough)-2;float sp=powf(std::max(0.f,dot(n,half)),exponent);float fres=.025+.975*powf(1-std::max(0.f,dot(half,-ray.d)),5);direct+=w.sunColor*(sp*fres*(exponent+2)/(8*PI)*nl);out+=throughput*direct;}}
 if(o.mat==4&&alb.x<.9){float wrap=std::max(0.f,dot(-n,w.sunDir));if(wrap>.1){Hit sh;sh.t=100;if(!w.trace(Ray(p+n*.08,w.sunDir),sh,true))out+=throughput*alb*w.sunColor*(.055*wrap);}}
 if(depth==3)break;
 float specChance=o.mat==5?.28:.045;V next;
 if(r.next()<specChance){V refl=unit(ray.d-n*(2*dot(n,ray.d)));next=unit(refl+cosine(n,r)*(o.mat==5?.12:.55));if(dot(next,n)<0)next=cosine(n,r);throughput=throughput*(o.mat==5?.68:.62);}else{next=cosine(n,r);throughput=throughput*alb;}
 ray=Ray(p+n*.001f,next);
 if(depth>1){float prob=std::max(throughput.x,std::max(throughput.y,throughput.z));prob=clamp(prob,.10,.95);if(r.next()>prob)break;throughput=throughput/prob;}
 }
 if(firstT>112){float haze=1-expf(-(firstT-112)*.012);out=mix(out,lin(V(.74,.84,.84))*1.05,haze);}
 return out;
}
struct Vertex{V p,n;};
struct Key{std::array<uint32_t,6> a;bool operator==(const Key&o)const{return a==o.a;}};
struct KeyHash{size_t operator()(const Key&k)const{size_t r=1469598103934665603ull;for(auto v:k.a)r=(r^v)*1099511628211ull;return r;}};
Key key(V p,V n){float f[6]={p.x,p.y,p.z,n.x,n.y,n.z};Key k;for(int j=0;j<6;j++){if(f[j]==0)f[j]=0;std::memcpy(&k.a[j],&f[j],4);}return k;}
float radicalInverse(unsigned n){n=(n<<16)|(n>>16);n=((n&0x55555555u)<<1)|((n&0xaaaaaaaau)>>1);n=((n&0x33333333u)<<2)|((n&0xccccccccu)>>2);n=((n&0x0f0f0f0fu)<<4)|((n&0xf0f0f0f0u)>>4);n=((n&0x00ff00ffu)<<8)|((n&0xff00ff00u)>>8);return float(n)*2.3283064365386963e-10f;}
V qmcHemisphere(V n,unsigned k,unsigned count,float rotation){float f=(float(k)+.5f)/float(count),a=2*PI*radicalInverse(k)+rotation;V t=tangent(n),b=cross(n,t);return unit(t*(sqrtf(f)*cosf(a))+b*(sqrtf(f)*sinf(a))+n*sqrtf(1-f));}
V qmcSun(V n,unsigned k,unsigned count){float r=.10f*sqrtf((float(k)+.5f)/float(count)),a=2*PI*radicalInverse(k);V t=tangent(n),b=cross(n,t);return unit(n+t*(r*cosf(a))+b*(r*sinf(a)));}
int main(int argc,char**argv){if(argc<3)return 1;World w;w.read(argv[1]);int samples=argc>3?atoi(argv[3]):96;omp_set_num_threads(std::max(1,std::min(6,omp_get_num_procs())));
 std::vector<std::vector<Vertex>> vertices(w.gs.size());
 for(int m=0;m<(int)w.gs.size();m++){auto& out=vertices[m];std::unordered_map<Key,int,KeyHash> ids;for(const auto&t:w.gs[m].ts){V pp[3]={t.a,t.b,t.c},nn[3]={t.na,t.nb,t.nc};for(int k=0;k<3;k++){Key kk=key(pp[k],nn[k]);if(!ids.count(kk)){ids[kk]=out.size();out.push_back({pp[k],nn[k]});}}}}
 size_t count=0;std::vector<size_t> offset(w.ins.size());for(size_t i=0;i<w.ins.size();i++){offset[i]=count;count+=vertices[w.ins[i].geo].size();}
 std::cerr<<"UNIQUE_LIGHT_SAMPLES "<<count<<" RAW_BYTES "<<count*4<<"\n";std::vector<unsigned char> data(count*4);std::atomic<int>done(0);auto start=std::chrono::steady_clock::now();
 #pragma omp parallel for schedule(dynamic,4)
 for(int i=0;i<(int)w.ins.size();i++){const auto&o=w.ins[i];const auto&vv=vertices[o.geo];for(int j=0;j<(int)vv.size();j++){V value(0);const auto&v=vv[j];V point=o.p+o.q.rot(v.p*o.s),normal=unit(o.q.rot(v.n/o.s));RNG rng(32999u*(i+1)+27u);float rotation=2*PI*radicalInverse(i%1024);float visibility=1.f;
  if(o.mat==6||o.mat>=7){value=V(.5,.6,.7);}else{
   for(int k=0;k<samples;k++){V direction=qmcHemisphere(normal,k,samples,rotation);value+=radiance(w,Ray(point+normal*.012f,direction),rng);}
   visibility=0;for(int k=0;k<16;k++){V direction=qmcSun(w.sunDir,k,16);Hit h;h.t=150;visibility+=w.trace(Ray(point+normal*.008f,direction),h,true)?0.f:1.f;}visibility/=16.f;
   value=value/float(samples);
  }
  size_t idx=(offset[i]+j)*4;for(int k=0;k<3;k++)data[idx+k]=(unsigned char)std::lround(sqrtf(clamp(value[k]/2.25f))*255);data[idx+3]=(unsigned char)std::lround(clamp(visibility)*255);
 }
 int d=++done;if(d%3000==0||d==(int)w.ins.size())std::cerr<<d<<"/"<<w.ins.size()<<" "<<std::chrono::duration<float>(std::chrono::steady_clock::now()-start).count()<<"s\n";
 }
 std::ofstream f(argv[2],std::ios::binary);f.write("KVL1",4);uint32_t ct=count;f.write((char*)&ct,4);f.write((char*)data.data(),data.size());if(!f)return 2;std::cerr<<"VERTEX_BAKE_COMPLETE\n";return 0;
}
