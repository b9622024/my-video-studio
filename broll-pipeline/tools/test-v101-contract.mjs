// Real downloaded preview and real UI export in an isolated test copy only.
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
import {readJSON,writeJSON,hash} from '../src/common.mjs';
import {importReview,compileEdit,validateReview} from '../src/pipeline.mjs';
import {validateEditInput} from '../src/remotion-contract.mjs';
import {semanticScreen} from '../src/semantics.mjs';
const dir='projects/bento-v101',plan=await readJSON(dir+'/scene-plan.json'),data=await readJSON(dir+'/broll-candidates.json');
// Regression checks use real API results, not invented hits.
const old=await readJSON('projects/bento-v1/broll-candidates.json');
for(const [scene,id] of [['A','pixabay-11613'],['C','pixabay-283431'],['C','pixabay-307864'],['C','pixabay-380106']]){const c=old.scenes.find(s=>s.scene_id===scene).candidates.find(c=>c.candidate_id===id);assert.equal(semanticScreen(c,plan.scenes.find(s=>s.id===scene)).status,'excluded');}
const rice=data.scenes.find(s=>s.scene_id==='C').screened_candidates.find(c=>c.candidate_id==='pixabay-11626');assert.equal(rice.metadata_screen.status,'metadata_only');assert.equal(rice.visual_check.verdict,'excluded');
assert.equal(data.scenes.flatMap(s=>s.candidates).length,1);assert.ok(data.scenes.flatMap(s=>s.screened_candidates).every(c=>c.action_verified===false));
const review=await readJSON('/workspace/outputs/broll-v101-tests/TEST-ONLY-review.json');
validateReview(review,plan,data);
const rejected=structuredClone(data);rejected.scenes.find(s=>s.scene_id==='B').candidates[0].visual_check.verdict='excluded';assert.throws(()=>validateReview(review,plan,rejected));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'broll-v101-contract-'));
try{
 const oneScene={...plan,scenes:plan.scenes.filter(s=>s.id==='B')};
 const c=data.scenes.find(s=>s.scene_id==='B').candidates[0];
 await writeJSON(path.join(temp,'scene-plan.json'),oneScene);await writeJSON(path.join(temp,'broll-candidates.json'),data);
 await writeJSON(path.join(temp,'asset-manifest.json'),{assets:[{...c}]});await writeJSON(path.join(temp,'TEST-ONLY-review.json'),review);
 await importReview(temp,path.join(temp,'TEST-ONLY-review.json'));
 await fs.mkdir(path.join(temp,'media'));const local='media/'+c.asset_id+'.mp4';
 await fs.copyFile(path.join(dir,c.local_preview.video),path.join(temp,local));
 const bytes=await fs.readFile(path.join(temp,local));const manifest=await readJSON(path.join(temp,'asset-manifest.json'));
 Object.assign(manifest.assets[0],{local_path:local,source_sha256:hash(bytes),actual_duration:c.local_preview.duration});await writeJSON(path.join(temp,'asset-manifest.json'),manifest);
 const edit=validateEditInput(await compileEdit(temp));assert.equal(edit.clips[0].scene_id,'B');assert.deepEqual(edit.clips[0].source_seconds,[34,40]);
 await writeJSON('docs/test-results/v101-contract.json',{status:'PASS',real_media:true,real_ui_export:true,test_scope:'Isolated one-scene test copy, automated approval only, no actual production approval or rendering.',existing_contract_accepted:true,semantic_regressions_passed:6,production_timeline_unchanged:true});
 console.log('PASS: real preview + UI JSON -> isolated import/hash/compile -> existing Remotion contract');
}finally{await fs.rm(temp,{recursive:true,force:true});}
