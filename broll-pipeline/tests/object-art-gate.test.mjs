import assert from 'node:assert/strict';import {evaluateObjectArtGate} from '../src/object-art-gate.mjs';
const r={review_id:'new-art-revision',state_ids:['A','B','C'],motion_assets_ready:false};
const a={provenance:'user_explicit',art_approved:true,review_id:r.review_id,state_ids:['A','B','C'],message:'test fixture only'};
assert.equal(evaluateObjectArtGate(r,null).animation_allowed,false);
assert.equal(evaluateObjectArtGate(r,a).art_approved,true);
assert.equal(evaluateObjectArtGate(r,a).animation_allowed,false); // Art approval alone cannot hide missing interaction assets.
assert.equal(evaluateObjectArtGate({...r,motion_assets_ready:true},{...a,review_id:'old'}).animation_allowed,false);
assert.equal(evaluateObjectArtGate({...r,motion_assets_ready:true},{...a,state_ids:['A','A','C']}).animation_allowed,false);
assert.equal(evaluateObjectArtGate({...r,motion_assets_ready:true},a).animation_allowed,true);
console.log('PASS missing, stale, incomplete art approval and independent motion-readiness gate');
