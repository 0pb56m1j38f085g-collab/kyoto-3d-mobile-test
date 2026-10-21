'use strict';
// Viewer-only finish. Geometry and the validated light-bake layout remain unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports=function finish(site){
 const input={'src/renderer.js':'346f7f8688507e7a000cfcf965e6f6e436a8920641841c807b6060ced84d8bff','src/app.js':'479947687c3d62a387126f787131e245e92686fdeab9f57359983fb331fc2a5c','index.html':'c131f63343b94ddb66f5672dfab115b481dd8435b3ac71a347e228ca02ad26ff'};
 const assets={};for(const[name,digest]of Object.entries(input)){const s=fs.readFileSync(path.join(site,name),'utf8');if(hash(s)!==digest)throw Error('Unexpected finish input '+name);assets[name]=s;}
 function change(name,old,replacement){if(assets[name].split(old).length!==2)throw Error('Non-unique finish replacement: '+name+' '+old.slice(0,70));assets[name]=assets[name].replace(old,replacement);}
 change('src/app.js','target:[-1,7.2,-.4],span:29,yaw:.61,pitch:.37','target:[.7,7.2,-.85],span:30.5,yaw:.61,pitch:.37');
 change('src/renderer.js','out vec3 indirectLight;out float bakedSun;','out vec3 indirectLight;out float bakedSun;out vec3 woodPoint;flat out int woodAxis;');
 change('src/renderer.js','in vec3 indirectLight;in float bakedSun;','in vec3 indirectLight;in float bakedSun;in vec3 woodPoint;flat in int woodAxis;');
 change('src/renderer.js','material=iColor.a;ambientVisibility=iAmbient;uv=aUV;','material=iColor.a;ambientVisibility=iAmbient;uv=aUV;woodPoint=aPosition*iScale;woodAxis=iScale.x>=iScale.y&&iScale.x>=iScale.z?0:(iScale.y>=iScale.z?1:2);');
 change('src/renderer.js','vec3 aces(vec3 x){',`float grainNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 fineSurface(vec3 n,float h){vec3 p=dFdx(wPosition),q=dFdy(wPosition),r1=cross(q,n),r2=cross(n,p);float det=dot(p,r1);if(abs(det)<.0000001)return n;return normalize(n-(r1*dFdx(h)+r2*dFdy(h))/det);}
vec3 aces(vec3 x){`);
 change('src/renderer.js','if(material>1.5&&material<2.5){float freq=44.;float aaWeight=1.-smoothstep(.22,.95,fwidth(wPosition.y)*freq);float course=sin(wPosition.y*freq*6.283);float fleck=hash(floor(wPosition.xz*vec2(80.,5.)));base*=1.+.018*course*aaWeight+.015*(fleck-.5);}',`if(material>1.5&&material<2.5){float layer=wPosition.y*33.+.075*grainNoise(wPosition.xz*1.5);float aa=1.-smoothstep(.22,.95,fwidth(layer));float course=sin(layer*6.283);float fibre=grainNoise(wPosition.xz*vec2(18.,2.));base*=.97+.025*course*aa+.035*fibre;n=fineSurface(n,.0009*course*aa);}`);
 change('src/renderer.js','if(material>.5&&material<1.5){float grain=sin(wPosition.y*180.+sin(wPosition.x*38.)*2.+wPosition.z*19.);base*=.984+.015*grain;}',`if(material>.5&&material<1.5){float along=woodAxis==0?woodPoint.x:(woodAxis==1?woodPoint.y:woodPoint.z);float across=woodAxis==0?woodPoint.y+woodPoint.z*.17:(woodAxis==1?woodPoint.x+woodPoint.z*.17:woodPoint.x+woodPoint.y*.17);float wave=across*120.+grainNoise(vec2(along*.9,across*5.))*1.6;float aa=1.-smoothstep(.25,.95,fwidth(wave));float fibre=sin(wave*6.283)*aa;base*=.958+.045*grainNoise(vec2(along*.65,across*13.))+.017*fibre;}`);
 assets['index.html']=assets['index.html'].replaceAll('?v=quality-v5.1','?v=quality-v5.2');
 const output={};for(const[name,s]of Object.entries(assets)){fs.writeFileSync(path.join(site,name),s);output[name]=hash(s);}return output;
};
if(require.main===module)console.log(JSON.stringify(module.exports(process.argv[2]),null,2));
