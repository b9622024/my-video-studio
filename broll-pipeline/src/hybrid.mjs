import fs from 'node:fs/promises';
import path from 'node:path';
import {readJSON,writeJSON,hash,validatePlan,PipelineError} from './common.mjs';
export const MODES=['exact_action_footage','contextual_broll','information_motion_graphics','user_provided_footage'];
const fail=(code,message)=>{throw new PipelineError(code,message);};
// Consumes authored intent and observed evidence, never converts tags into vision.
export function classifyVisual(scene,option){
 const mandatory=scene.required_evidence?.event_mandatory??true;
 if(option.mode==='user_provided_footage')return option.rights_confirmed&&option.visual_check?.objects_and_state&&['frames_reviewed_contextual','frames_reviewed_exact','video_reviewed_exact'].includes(option.visual_check?.status)&&(!mandatory||option.visual_check?.exact_action_verified===true)?(mandatory?'exact_match':'contextual_match'):'user_footage_required';
 if(option.mode==='exact_action_footage')return option.visual_check?.exact_action_verified===true&&option.visual_check?.objects_and_state===true&&['frames_reviewed_exact','video_reviewed_exact'].includes(option.visual_check?.status)?'exact_match':'no_acceptable_visual';
 if(mandatory)return 'user_footage_required';
 if(option.mode==='contextual_broll')return option.visual_check?.objects_and_state===true&&option.visual_check?.status==='frames_reviewed_contextual'?'contextual_match':'no_acceptable_visual';
 if(option.mode==='information_motion_graphics'){
  const g=option.graphic;if(g?.kind==='comparison'&&(!g.source||!Array.isArray(g.values)||g.values.length!==g.labels?.length||!g.values.every(v=>Number.isFinite(v)&&v>=0)))return 'no_acceptable_visual';
  return g&&['portion_concept','category_groups','process','comparison'].includes(g.kind)?'motion_graphics_fallback':'no_acceptable_visual';
 }
 return 'no_acceptable_visual';
}
export function recommendVisuals(scene,options){
 const ranked=options.filter(o=>o.scene_id===scene.id).map(o=>({...o,match_status:classifyVisual(scene,o)})).filter(o=>!['no_acceptable_visual','user_footage_required'].includes(o.match_status));
 const priority=o=>o.match_status==='exact_match'?0:o.mode==='contextual_broll'?(o.graphic?2:1):o.mode==='information_motion_graphics'?3:4;
 ranked.sort((a,b)=>priority(a)-priority(b));const choices=ranked.slice(0,3);
 return {status:choices[0]?.match_status??(scene.fallback_modes?.includes('user_provided_footage')?'user_footage_required':'no_acceptable_visual'),options:choices};
}
export function validateHybridPlan(plan){
 validatePlan(plan);
 if(plan.fps!==30)fail('INVALID_FPS','V1.1輸出固定30fps。');
 for(const s of plan.scenes){
  if(s.fallback_modes&&(!Array.isArray(s.fallback_modes)||!s.fallback_modes.every(m=>MODES.includes(m))))fail('INVALID_MODE','未知替代模式。');
  if(s.required_evidence&&typeof s.required_evidence.event_mandatory!=='boolean')fail('INVALID_EVIDENCE','事件證據需求須明確。');
 }
 return plan;
}
export async function approveChatSelection(dir,request){
 const plan=validateHybridPlan(await readJSON(path.join(dir,'scene-plan.json'))),review=await readJSON(path.join(dir,'review-options.json'));
 if(request.provenance!=='user_explicit'||request.approval_evidence?.channel!=='chat'||typeof request.approval_evidence.message!=='string'||request.approval_evidence.message.trim().length<3)fail('EXPLICIT_APPROVAL_REQUIRED','必須先取得使用者明確選擇並保存原始回覆；不得由推薦自動核准。');
 if(request.project_id!==plan.project_id||request.revision_id!==review.revision_id||!Array.isArray(request.selections)||request.selections.length!==plan.scenes.length)fail('STALE_SELECTION','專案、候選版本或場景選擇不完整。');
 const seen=new Set(),selected=[];
 for(const s of plan.scenes){
  const choices=request.selections.filter(x=>x.scene_id===s.id);if(choices.length!==1)fail('DUPLICATE_SELECTION','每場景必須明確選一項。');
  const o=review.options.find(o=>o.scene_id===s.id&&o.option_id===choices[0].option_id);
  if(!o||seen.has(o.option_id))fail('UNKNOWN_OPTION','候選編號不存在。');seen.add(o.option_id);
  const status=classifyVisual(s,o);if(['no_acceptable_visual','user_footage_required'].includes(status))fail('INSUFFICIENT_EVIDENCE','此候選不能替代本場景所需事件證據。');
  selected.push({...structuredClone(o),match_status:status,review_status:'approved',selection_sha256:hash(JSON.stringify(o)),approved_by:'user',approved_at:new Date().toISOString()});
 }
 const result={schema_version:'1.1',project_id:plan.project_id,revision_id:review.revision_id,plan_sha256:hash(JSON.stringify(plan)),status:'approved',approval_evidence:request.approval_evidence,selections:selected};
 await writeJSON(path.join(dir,'approved-assets.json'),result);return result;
}
export async function verifyApproval(dir){
 const plan=validateHybridPlan(await readJSON(path.join(dir,'scene-plan.json'))),approved=await readJSON(path.join(dir,'approved-assets.json'),null),review=await readJSON(path.join(dir,'review-options.json'));
 if(!approved||approved.status!=='approved'||approved.project_id!==plan.project_id||approved.revision_id!==review.revision_id||approved.plan_sha256!==hash(JSON.stringify(plan)))fail('APPROVAL_REQUIRED','尚無此版本使用者核准，或分鏡已變更。');
 if(approved.selections.length!==plan.scenes.length)fail('INCOMPLETE_SELECTION','缺少場景。');
 for(const s of plan.scenes){
  const matches=approved.selections.filter(a=>a.scene_id===s.id);if(matches.length!==1)fail('INCOMPLETE_SELECTION','每場景必須一項。');
  const a=matches[0],o=review.options.find(o=>o.option_id===a.option_id&&o.scene_id===s.id);
  const copy={...a};for(const k of ['selection_sha256','approved_by','approved_at'])delete copy[k];copy.review_status='pending';
  if(!o||a.review_status!=='approved'||a.selection_sha256!==hash(JSON.stringify(o))||a.selection_sha256!==hash(JSON.stringify(copy)))fail('TAMPERED_SELECTION','已核准資料與候選不一致。');
  if(['no_acceptable_visual','user_footage_required'].includes(classifyVisual(s,a)))fail('INSUFFICIENT_EVIDENCE','事件證據不足。');
 }

 return {plan,approved};
}
export async function compileHybrid(dir,{dimensions=[540,960]}={}){
 const {plan,approved}=await verifyApproval(dir);
 if(![[540,960],[1080,1920]].some(d=>d.every((v,i)=>v===dimensions[i])))fail('INVALID_DIMENSIONS','僅支援540或1080直式輸出。');
 if(dimensions[0]===1080){
  const quality=await readJSON(path.join(dir,'quality-approval.json'),null),preview=await readJSON(path.join(dir,'preview-artifact.json'),null);
  if(!quality||!preview||quality.provenance!=='user_explicit'||!quality.message||quality.revision_id!==approved.revision_id||preview.revision_id!==approved.revision_id||quality.preview_sha256!==preview.sha256||!/^outputs\/preview-540\.mp4$/.test(preview.local_path)||hash(await fs.readFile(path.join(dir,preview.local_path)))!==preview.sha256)fail('QUALITY_APPROVAL_REQUIRED','須先通過這一版預覽的使用者畫面品質驗收。');
 }
 const manifest=await readJSON(path.join(dir,'asset-manifest.json'));let frame=0;const clips=[];
 for(const scene of plan.scenes){
  const o=approved.selections.find(x=>x.scene_id===scene.id),duration=Math.round(scene.duration_seconds*plan.fps);
  const clip={scene_id:scene.id,option_id:o.option_id,mode:o.mode,layout:o.layout,frames:[frame,frame+duration],narration:scene.narration,heading:scene.on_screen_title??null,graphic:o.graphic??null,crop_parameters:o.crop_parameters??null};
  if(o.mode!=='information_motion_graphics'){
   const asset=manifest.assets.find(a=>a.asset_id===o.asset_id&&a.option_id===o.option_id);
   if(!asset?.local_path||!/^media\/[a-zA-Z0-9_-]+\.mp4$/.test(asset.local_path)||!asset.source_sha256||asset.review_status!=='approved')fail('MISSING_APPROVED_MEDIA','正式素材未下載、正規化及驗證。');
   if(['source_url','author','license_url'].some(k=>asset[k]!==o[k]))fail('SOURCE_RECORD_MISMATCH','來源、作者或授權紀錄與核准候選不符。');
   if(hash(await fs.readFile(path.join(dir,asset.local_path)))!==asset.source_sha256)fail('MEDIA_HASH_MISMATCH','媒體已變更。');
   const t=o.selected_trim;if(!t||t.start<0||t.end>asset.actual_duration||t.end-t.start+.001<duration/plan.fps)fail('INVALID_TRIM','使用區間不足，不自動循環。');
   Object.assign(clip,{asset_id:o.asset_id,local_path:asset.local_path,source_sha256:asset.source_sha256,source_seconds:[t.start,t.start+duration/plan.fps],source_url:asset.source_url,author:asset.author,license_url:asset.license_url});
  }
  clips.push(clip);frame+=duration;
 }
 const voice=plan.narration??null;
 if(voice&&(!/^audio\/[a-zA-Z0-9_-]+\.(wav|mp3|m4a)$/.test(voice.local_path)||hash(await fs.readFile(path.join(dir,voice.local_path)))!==voice.sha256))fail('INVALID_NARRATION','真人錄音路徑或hash不符。');
 const timeline={schema_version:'1.1',project_id:plan.project_id,revision_id:approved.revision_id,status:'approved_for_preview',fps:plan.fps,dimensions,duration_frames:frame,clips,narration:voice,captions:plan.captions??[]};
 const bundle={plan,approved,timeline,manifest};await writeJSON(path.join(dir,'edit-timeline.json'),timeline);await writeJSON(path.join(dir,'hybrid-render-input.json'),bundle);return bundle;
}
