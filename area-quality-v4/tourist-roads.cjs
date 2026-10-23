'use strict';
// Display selection only. Geographic source files and future routing remain intact.
// Aliases identify verified unnamed OSM sections; they do not replace source names.
module.exports=function selectTouristRoads(historic,east,west){
 const arrival=require('../area-data/gojo-entry-reference.json');
 const sources=new Map([...arrival.roads,...west.roads,...east.roads,...historic.roads].map(r=>[r.id,r]));
 const roads=[],selected=new Set();
 function add(id,label,tier='main',width=1.06,range){
  const r=sources.get(id);if(!r)throw Error('Missing tourist source way '+id);
  if(selected.has(id))throw Error('Duplicate tourist source way '+id);selected.add(id);
  const indices=range||[0,r.points.length-1];
  roads.push({...r,name:label||r.name,sourceName:r.name||null,tier,width,sourcePointRange:indices,
   points:r.points.slice(indices[0],indices[1]+1).map(p=>p.slice())});
 }
 for(const r of historic.roads){
  if(['清水坂','産寧坂','二寧坂','一念坂','八坂通'].includes(r.name))
   add(r.id,r.name,'main',({'清水坂':1.28,'産寧坂':1.06,'二寧坂':.94,'一念坂':.86,'八坂通':1.08})[r.name]);
 }
 add(409367262,'五条坂','main',1.10);
 add(30882780,'ねねの道','main',1.06);
 add(710696944,'八坂の塔・産寧坂の接続','connector',.84);
 add(30882777,'下河原通','connector',.76);
 add(30882781,'ねねの道・下河原通の接続','connector',.68);
 add(84037996,'八坂神社南参道','connector',.72);
 add(527257260,'台所坂','connector',.72);
 // The small OSM way at the north end of Ninenzaka meets this real cross-street.
 add(1569088148,'維新の道（接続区間）','connector',.70);
 // Ishibe-koji bends west to Shimokawara. Exclude the unrelated eastern spur.
 add(526198278,'石塀小路','detail',.48);
 add(179958185,'石塀小路（接続区間）','detail',.48,[0,3]);
 add(179958183,'石塀小路（接続区間）','detail',.48);
 add(527257300,'石塀小路（入口）','detail',.48);
 // Retain the existing Shijo arrival and Hanamikoji axis when panning to Gion.
 // Shirakawa lanes need a separate bank/bridge treatment before that extension.
 add(854442449,'四条通','main',1.12);
 add(27908626,'花見小路','main',.96);
 // One source carriageway communicates the bridge-to-hill axis. It is not a
 // pedestrian route and deliberately omits traffic ramps and the parallel lane.
 for(const r of arrival.roads)add(r.id,'五条通','arrival',1.24);
 return {version:1,roads,omittedWays:[...sources.keys()].filter(id=>!selected.has(id)),
  detailMaxWidth:24,
  policy:'Explicit tourist street selection, with real connecting sections. All retained points are unchanged source vertices; widths and stone patterns are illustrative. Detail lanes appear only when zoomed in. Not a navigation graph.',
  references:['https://souda-kyoto.jp/blog/01072.html','https://www.gion.or.jp/tenkei/情緒漂う石塀小路','https://www.kiyomizudera.or.jp/access/']};
};
