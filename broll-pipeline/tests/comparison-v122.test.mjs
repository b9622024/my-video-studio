import assert from 'node:assert/strict';import fs from 'node:fs';import {cameraAt,stateIndexAt,labelFits} from '../adapters/remotion/v122/ComparisonMath.ts';
const spec=JSON.parse(fs.readFileSync('projects/comparison-v122/config.json'));
const counts=[0,0,0];for(let frame=0;frame<120;frame++)counts[stateIndexAt(frame,3,40)]++;assert.deepEqual(counts,[40,40,40]);
const pick=c=>[c.x,c.y,c.zoom];
for(const [start,end] of [[0,18],[39,54],[75,88],[103,119]]){const first=pick(cameraAt(start,spec.table.cameraKeys));for(let f=start;f<=end;f++)assert.deepEqual(pick(cameraAt(f,spec.table.cameraKeys)),first);}
for(let f=0;f<120;f++){const c=cameraAt(f,spec.table.cameraKeys);assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y)&&c.zoom>=.43&&c.zoom<=.84);}
const end=cameraAt(119,spec.table.cameraKeys);assert.ok(spec.table.objects.every(o=>labelFits(o.center,end,spec.table.plateSize,spec.table.screenCenter)));
assert.equal(labelFits(spec.table.objects[2].center,cameraAt(0,spec.table.cameraKeys),spec.table.plateSize,spec.table.screenCenter),false);
assert.equal(new Set(spec.states.map(s=>s.asset)).size,3);assert.equal(spec.publication_approved,false);
console.log('PASS equal exposure, stationary hold windows, valid camera path, end comparison and unclipped labels');
