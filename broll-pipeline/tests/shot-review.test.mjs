import assert from 'node:assert/strict';import fs from 'node:fs';import {validateShotPlan,evaluateShotGate} from '../src/shot-review.mjs';
const dir='projects/bento-v113-shots/';const plan=JSON.parse(fs.readFileSync(dir+'shot-plan.json')),sources=JSON.parse(fs.readFileSync(dir+'sources.json'));
assert.equal(validateShotPlan(plan,sources),true);
for(const mutate of [p=>p.shots[1].timeline[0]=3,p=>p.shots[1].source[1]=99,p=>p.shots[2].speed=2,p=>p.shots[1].climax=99]){const p=structuredClone(plan);mutate(p);assert.throws(()=>validateShotPlan(p,sources));}
const p={...plan,review_sha256:'current'};
const a={provenance:'user_explicit',project_id:p.project_id,review_sha256:'current',message:'test fixture only',shot_order_approved:true,quality_approved:true};
const m={provenance:'user_explicit',project_id:p.project_id,status:'approved',message:'test fixture only',approved_option_ids:['B1','C1']};
assert.equal(evaluateShotGate(p,null,null).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,a,null).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,{...a,review_sha256:'old'},m).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,{...a,quality_approved:false},m).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,a,{...m,approved_option_ids:['B1']}).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,a,{...m,approved_option_ids:'B1 C1'}).formal_render_allowed,false);
assert.equal(evaluateShotGate(p,a,m).formal_render_allowed,true);
console.log('PASS source bounds, full 12s timing, event limits, stale and separate approval gates');
