import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {readJSON,writeJSON,hash} from '../src/common.mjs';import {classifyVisual,recommendVisuals,approveChatSelection,compileHybrid,validateHybridPlan} from '../src/hybrid.mjs';import {prepareHybridMedia,ingestUserFootage} from '../src/hybrid-media.mjs';
const dir='projects/bento-v11';
test('real reviewed objects can support concepts; mandatory demonstrations cannot use contextual footage',async()=>{
 const plan=await readJSON(dir+'/scene-plan.json'),review=await readJSON(dir+'/review-options.json');
 for(const o of review.options)assert.equal(classifyVisual(plan.scenes.find(s=>s.id===o.scene_id),o),o.match_status);
 const s={...plan.scenes[2],required_evidence:{event_mandatory:true}};const rice=review.options.find(o=>o.option_id==='C1');
 assert.equal(classifyVisual(s,rice),'user_footage_required');assert.equal(classifyVisual(s,{...rice,mode:'exact_action_footage'}),'no_acceptable_visual');
 assert.equal(classifyVisual(s,{...rice,mode:'exact_action_footage',visual_check:{status:'video_reviewed_exact',objects_and_state:true,exact_action_verified:true}}),'exact_match');
 assert.equal(classifyVisual(s,{mode:'user_provided_footage',rights_confirmed:true,visual_check:{objects_and_state:true}}),'user_footage_required');
 assert.equal(classifyVisual(plan.scenes[2],{...rice,visual_check:{status:'metadata_only',objects_and_state:true}}),'no_acceptable_visual');
 validateHybridPlan(await readJSON('projects/bento-v1/scene-plan.json'));
 assert.equal(recommendVisuals(plan.scenes[1],review.options).options[0].option_id,'B1');
 assert.equal(recommendVisuals(s,review.options).status,'user_footage_required');
});
test('approval and all downloads are blocked without explicit current user selections',async()=>{
 await assert.rejects(prepareHybridMedia(dir,{fetchImpl:()=>{throw Error('must never call');}}),e=>e.code==='APPROVAL_REQUIRED');
 await assert.rejects(compileHybrid(dir),e=>e.code==='APPROVAL_REQUIRED');
 await assert.rejects(approveChatSelection(dir,{provenance:'recommendation'}),e=>e.code==='EXPLICIT_APPROVAL_REQUIRED');
 await assert.rejects(fs.access(dir+'/approved-assets.json'));assert.deepEqual((await readJSON(dir+'/edit-timeline.json')).clips,[]);
});
test('real media + explicit TEST-ONLY selection compiles only in isolated project; stale/tamper/final gates reject',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'hybrid-v11-'));
 try{
  for(const name of ['scene-plan.json','review-options.json','asset-manifest.json'])await fs.copyFile(path.join(dir,name),path.join(temp,name));
  const r=await readJSON(temp+'/review-options.json');const req={provenance:'user_explicit',project_id:r.project_id,revision_id:r.revision_id,approval_evidence:{channel:'chat',message:'TEST FIXTURE ONLY; not a user approval of bento assets'},selections:['A1','B1','C1'].map(option_id=>({option_id,scene_id:option_id[0]}))};
  await assert.rejects(approveChatSelection(temp,{...req,revision_id:'old'}));
  const approved=await approveChatSelection(temp,req);await assert.rejects(compileHybrid(temp),e=>e.code==='MISSING_APPROVED_MEDIA');
  await fs.mkdir(temp+'/media');const assets=[];
  for(const o of approved.selections){const bytes=await fs.readFile(path.join(dir,o.preview.video));const file='media/'+o.asset_id+'.mp4';await fs.writeFile(path.join(temp,file),bytes);assets.push({...o,local_path:file,source_sha256:hash(bytes),actual_duration:o.preview.duration});}
  await writeJSON(temp+'/asset-manifest.json',{schema_version:'1.1',project_id:r.project_id,assets});
  const b=await compileHybrid(temp);assert.equal(b.timeline.duration_frames,360);assert.deepEqual(b.timeline.clips.map(c=>c.frames),[[0,120],[120,240],[240,360]]);assert.equal(b.timeline.clips[2].graphic.kind,'portion_concept');
  await assert.rejects(compileHybrid(temp,{dimensions:[1080,1920]}),e=>e.code==='QUALITY_APPROVAL_REQUIRED');
  const modified=structuredClone(approved);modified.selections[0].selected_trim.start=0;await writeJSON(temp+'/approved-assets.json',modified);await assert.rejects(compileHybrid(temp),e=>e.code==='TAMPERED_SELECTION');await writeJSON(temp+'/approved-assets.json',approved);
  await fs.appendFile(path.join(temp,assets[0].local_path),'tamper');await assert.rejects(compileHybrid(temp),e=>e.code==='MEDIA_HASH_MISMATCH');
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
test('different-topic motion data uses the same compiler; numerical comparisons require sources',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'hybrid-other-topic-'));
 try{
  const original=await readJSON(dir+'/scene-plan.json');const s={...original.scenes[0],id:'D',name:'通勤準備',narration:'出門前，依序確認路線與隨身物品。',duration_seconds:5,visual_role:'concept_explanation',required_evidence:{event_mandatory:false},fallback_modes:['information_motion_graphics']};const plan={...original,project_id:'commute-unit-test',scenes:[s],source_script:s.narration};
  const option={option_id:'D1',scene_id:'D',mode:'information_motion_graphics',match_status:'motion_graphics_fallback',layout:'pure_motion',review_status:'pending',graphic:{kind:'process',labels:['路線','物品','出門'],caption:'通勤準備流程'}};
  const review={project_id:plan.project_id,revision_id:'other-topic-test',options:[option]};await writeJSON(temp+'/scene-plan.json',plan);await writeJSON(temp+'/review-options.json',review);await writeJSON(temp+'/asset-manifest.json',{project_id:plan.project_id,assets:[]});
  await approveChatSelection(temp,{provenance:'user_explicit',project_id:plan.project_id,revision_id:review.revision_id,approval_evidence:{channel:'chat',message:'TEST ONLY: second topic, no actual user approval'},selections:[{scene_id:'D',option_id:'D1'}]});
  const b=await compileHybrid(temp);assert.equal(b.timeline.duration_frames,150);assert.equal(b.timeline.clips[0].graphic.labels[0],'路線');
  assert.equal(classifyVisual(s,{...option,graphic:{kind:'comparison',labels:['a','b'],values:[1,2]}}),'no_acceptable_visual');
  assert.equal(classifyVisual(s,{...option,graphic:{kind:'comparison',labels:['a','b'],values:[1,2],source:'test-only measured table'}}),'motion_graphics_fallback');
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
test('user footage requires explicit rights before any file processing',async()=>{
 await assert.rejects(ingestUserFootage(dir,'missing.MOV',{}),e=>e.code==='USER_RIGHTS_REQUIRED');
});
