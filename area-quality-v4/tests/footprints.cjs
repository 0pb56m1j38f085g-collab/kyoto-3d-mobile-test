'use strict';
const assert=require('node:assert/strict'),{compile,triangulate,area}=require('../footprints.cjs');
const source=require('../../area-data/gion-footprints.json');
// A concave L must preserve its missing upper-right quadrant in either winding.
for(const polygon of [[[0,0],[2,0],[2,1],[1,1],[1,2],[0,2]],[[0,2],[1,2],[1,1],[2,1],[2,0],[0,0]]]){
 const {triangles}=triangulate(polygon);assert.equal(triangles.reduce((n,t)=>n+Math.abs(area(t)),0),3);
 for(const tri of triangles){const c=tri.reduce((s,p)=>[s[0]+p[0]/3,s[1]+p[1]/3],[0,0]);assert.ok(!(c[0]>1&&c[1]>1));}
}
const result=compile(source);assert.equal(result.buildings.length,1711);assert.equal(result.rejected.length,11);
assert.deepEqual(source.customLandmarkIds,[371717416,88108397,105449709,88108386,522959943,191037928,541086536,541086532,653725971,541086534,522959927,542345560,541086527]);
for(const b of result.buildings){
 const original=source.buildings.find(x=>x.id===b.id);assert.deepEqual(b.points,original.points);
 assert.ok(b.height>0&&Number.isFinite(b.height));assert.ok(b.heightSource&&b.roofSource);
 assert.ok(Math.abs(b.triangles.reduce((n,t)=>n+Math.abs(area(t)),0)-b.footprintArea)<1e-6);
}
console.log('1711 source records retained (1698 polygon buildings + 13 custom landmark references); concave triangulation, winding and height provenance verified');
