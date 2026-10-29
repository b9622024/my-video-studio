import assert from 'node:assert/strict';import fs from 'node:fs';import {carrierPose,payloadPose,attachedPayload,phaseAt,assertTransferSpec} from '../adapters/remotion/v123/TransferMath.ts';
const s=JSON.parse(fs.readFileSync('projects/interaction-v123/config.json'));const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(let f=0;f<=s.timing.release;f++){const c=carrierPose(f,s),p=payloadPose(f,s),attached=attachedPayload(c,s.payload.attachOffset);assert.ok(distance(p,attached)<1e-9);}
for(const f of [s.timing.enter,s.timing.touch,s.timing.release,s.timing.separate,s.timing.exit])for(const fn of [carrierPose,payloadPose])assert.ok(distance(fn(f-1e-5,s),fn(f+1e-5,s))<1e-3,'Pose jump at boundary');
const rest=payloadPose(s.timing.separate,s);for(let f=s.timing.separate;f<s.frames;f++)assert.deepEqual(payloadPose(f,s),rest);
for(let f=0;f<s.frames;f++){for(const fn of [carrierPose,payloadPose]){const p=fn(f,s);assert.ok(Object.values(p).every(Number.isFinite));if(f)assert.ok(distance(p,fn(f-1,s))<50,'Teleport-sized step');}}
assert.ok(distance(carrierPose(89,s),payloadPose(89,s))>200);assert.equal(phaseAt(89,s),'result');assert.ok(s.carrier.asset.includes('paddle-empty'));assert.notEqual(s.receiver.asset,s.payload.asset);assert.equal(s.food_opacity,1);assert.equal(s.food_scale_changes,false);assert.equal(s.public_use_approved,false);
assertTransferSpec(s);for(const mutate of [x=>x.receiver.contactPoint=[1],x=>x.timing.release=x.timing.touch,x=>x.payload.scale=-1,x=>x.path.exit=[Infinity,0]]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>assertTransferSpec(bad));}
console.log('PASS rigid attachment, continuous handoff, deposited rest, bounded trajectories and separate source identities');
