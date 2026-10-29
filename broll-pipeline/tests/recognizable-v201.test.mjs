import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire}from'node:module';
const host=process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host',require=createRequire(host+'/package.json'),ts=require('typescript');
const source=fs.readFileSync('adapters/remotion/v201/MotionMath.ts','utf8'),m={exports:{}};new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(m.exports,m);
const {milkState}=m.exports,spec=JSON.parse(fs.readFileSync('projects/recognizable-v201/prototypes.json'));
let previous=Infinity;
for(let f=0;f<75;f++){
 const s=milkState(f,spec.milk,spec.timeline.B);assert.ok(Object.values(s).every(Number.isFinite));
 assert.ok(s.surface<=previous+1e-8,'Liquid may not drop during filling');previous=s.surface;
 assert.ok(s.tail<=s.front,'Tail cannot pass flow front');
 if(f<=25)assert.equal(s.surface,spec.milk.initial_surface_y,'No fill before stream arrives');
 if(f>=52){assert.equal(s.surface,spec.milk.final_surface_y);assert.equal(s.tail,1,'Flow must drain before hold');}
 if(s.surface<spec.milk.initial_surface_y&&f<52)assert.equal(s.front,1,'Filling requires connected stream');
 if(f>=63)assert.deepEqual(s,milkState(74,spec.milk,spec.timeline.B),'Payoff must remain stable');
 if(f>0){const prev=milkState(f-1,spec.milk,spec.timeline.B);assert.ok(Math.abs(s.angle-prev.angle)<15,'No tool angle jump');assert.ok(Math.abs(s.surface-prev.surface)<10,'No liquid teleport');}
}
for(const [id,timeline]of Object.entries(spec.timeline))for(const interval of Object.values(timeline)){assert.ok(interval[1]>interval[0]&&interval[0]>=0&&interval[1]<=75,id+' invalid timeline');}
assert.deepEqual(JSON.parse(fs.readFileSync('adapters/remotion/v201/prototypes.json')),spec,'JSON compilation copy must match');
assert.deepEqual(JSON.parse(fs.readFileSync('adapters/remotion/v201/style-tokens.json')),JSON.parse(fs.readFileSync('projects/recognizable-v201/style-tokens.json')));
console.log('PASS: causal flow, finite/continuous poses, payoff hold, timeline bounds and data sync. No recognition or art approval claimed.');
