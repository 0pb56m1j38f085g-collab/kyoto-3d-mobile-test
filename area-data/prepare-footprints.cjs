'use strict';
// Reproducible subset of the already-reviewed OSM snapshot; no live API dependency.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const source=JSON.parse(cp.execFileSync('git',['show','origin/area-higashiyama-osm-v1:area-data/higashiyama-osm-v1.json'],{maxBuffer:20*1024*1024}));
const bounds={minX:-44,maxX:8,minZ:-8,maxZ:52};
const inside=([x,z])=>x>=bounds.minX&&x<=bounds.maxX&&z>=bounds.minZ&&z<=bounds.maxZ;
const buildings=source.buildings.filter(b=>b.points.every(inside));
const roads=source.roads.filter(r=>r.points.some(inside)&&r.tunnel!=='yes');
const customLandmarkIds=[371717416,88108397,105449709,88108386,522959943,191037928,541086536,541086532,653725971,541086534,522959927,542345560,541086527,102164590,102164617];
const data={source:source.source,license:source.license,retrievedAt:source.retrievedAt,origin:source.origin,metresPerUnit:20,bounds,customLandmarkIds,buildings,roads};
fs.writeFileSync(path.join(__dirname,'gion-footprints.json'),JSON.stringify(data));
console.log(JSON.stringify({buildings:buildings.length,roads:roads.length}));
