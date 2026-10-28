import path from 'node:path';
import fs from 'node:fs/promises';
import {PixabayClient} from './pixabay.mjs';
import {normalizeHit,probeCandidate,shortlist} from './candidates.mjs';
import {validatePlan,readJSON,writeJSON,safeError,PipelineError,hash} from './common.mjs';
export async function searchProject(dir,{client=new PixabayClient(),probe=probeCandidate,requests=null}={}){
 const plan=validatePlan(await readJSON(path.join(dir,'scene-plan.json')));const result={schema_version:'1.0',project_id:plan.project_id,provider:'pixabay',generated_at:new Date().toISOString(),status:'pending',scenes:[],errors:[],request_budget:6,api_requests:0};
 const previousDataset=await readJSON(path.join(dir,'broll-candidates.json'),null);
 for(const scene of plan.scenes){
  if(requests&&!requests.some(r=>r.scene_id===scene.id)){result.scenes.push(previousDataset?.scenes.find(s=>s.scene_id===scene.id)??{scene_id:scene.id,candidates:[],screened_candidates:[],queries:[],status:'not_requested'});continue;}
  const row={scene_id:scene.id,candidates:[],screened_candidates:[],queries:[],status:'no_suitable_candidates'};const queries=requests?.find(r=>r.scene_id===scene.id)?.queries??scene.search_queries.slice(0,2);
  if(!Array.isArray(queries)||queries.length>2||queries.some(q=>typeof q!=='string'||q.length>100||q.length<4))throw new PipelineError('INVALID_RESEARCH_REQUEST','每場景最多2個4–100字元動作查詢。');
  for(const q of queries){
   if(!requests&&shortlist(row.screened_candidates).length>=2)break;
   try{
    const data=await client.search({q,lang:'en',video_type:'film',safesearch:true,order:'popular',page:1,per_page:12});row.queries.push({q,cache_hit:data._transport.cache_hit,total:data.total,totalHits:data.totalHits});
    const normalized=data.hits.map(h=>normalizeHit(h,scene,plan.project_id,q)).filter(Boolean).filter((c,i,all)=>all.findIndex(x=>x.asset_id===c.asset_id)===i).sort((a,b)=>b.score.total-a.score.total).slice(0,3);
    for(const c of normalized)row.screened_candidates.push(await probe(c));
   }catch(e){const error=safeError(e);result.errors.push({scene_id:scene.id,...error});row.status=error.code;
    // An auth/policy/rate/network failure is not an empty search. Stop the entire run.
    result.scenes.push(row);for(const rest of plan.scenes.slice(result.scenes.length))result.scenes.push({scene_id:rest.id,candidates:[],screened_candidates:[],queries:[],status:'not_attempted_due_to_prior_error'});result.status='blocked';result.api_requests=client.requests;await persist(dir,plan,result);return result;
   }
  }
  row.candidates=shortlist(row.screened_candidates);row.status=row.candidates.length>=2?'ready_for_visual_review':row.candidates.length?'insufficient_candidates':'no_suitable_candidates';result.scenes.push(row);
 }
 result.api_requests=client.requests;result.status=result.scenes.every(s=>s.candidates.length>=2)?'ready_for_visual_review':'needs_more_search';await persist(dir,plan,result);return result;
}
async function persist(dir,plan,result){
 result.revision_id=hash(JSON.stringify({project_id:plan.project_id,generated_at:result.generated_at,scenes:result.scenes}));
 const previous=await readJSON(path.join(dir,'broll-candidates.json'),null);if(previous?.scenes?.some(s=>s.candidates.length))await writeJSON(path.join(dir,'history',Date.now()+'-candidates.json'),previous);
 await writeJSON(path.join(dir,'broll-candidates.json'),result);
 await writeJSON(path.join(dir,'asset-manifest.json'),{schema_version:'1.0',project_id:plan.project_id,provider:'pixabay',legacy_reference:'../../compat/v25/asset-manifest.json',assets:result.scenes.flatMap(s=>s.candidates).map(c=>({...c})),notes:['未下載素材的source_sha256保持null。','所有候選pending；人工核准前不能進入正式剪輯。']});
 await writeJSON(path.join(dir,'api-test-result.json'),{checked_at:result.generated_at,key_loaded:Boolean(process.env.PIXABAY_API_KEY?.trim()),status:result.status,api_requests:result.api_requests,cache_hours:24,errors:result.errors});
}
export function candidateIndex(dataset){return new Map(dataset.scenes.flatMap(s=>[...s.candidates,...(s.excluded_previews??[])].map(c=>[s.scene_id+'::'+c.candidate_id,c])));}
export function validateReview(review,plan,dataset){
 if(review.schema_version!=='1.0'||review.project_id!==plan.project_id||review.candidate_set_id!==dataset.revision_id||!Array.isArray(review.decisions)||!Array.isArray(review.search_again))throw new PipelineError('INVALID_REVIEW','審核專案或資料結構不符。');
 const index=candidateIndex(dataset),seen=new Set(),approvedScenes=new Set();
 for(const d of review.decisions){const key=d.scene_id+'::'+d.candidate_id,c=index.get(key);if(!c||seen.has(key)||!['approved','rejected','pending'].includes(d.status))throw new PipelineError('INVALID_REVIEW','未知、重複候選或狀態不合法。');seen.add(key);
  if(d.status==='approved'){
   if(c.visual_check?.verdict==='excluded'||c.metadata_screen?.status==='excluded'||c.availability?.status==='unavailable')throw new PipelineError('EXCLUDED_CANDIDATE','已排除或無法取得的素材不能核准。');
   const t=d.selected_trim,cp=d.crop_parameters;
   if(approvedScenes.has(d.scene_id)||d.action_verified!==true||d.risk_reviewed!==true||typeof d.actual_action_description!=='string'||d.actual_action_description.trim().length<2||!t||!Number.isFinite(t.start)||!Number.isFinite(t.end)||t.start<0||t.end<=t.start||t.end>c.duration||!cp||cp.verified!==true||cp.aspect_ratio!=='9:16'||![cp.object_position_x,cp.object_position_y].every(v=>Number.isFinite(v)&&v>=0&&v<=1))throw new PipelineError('INVALID_APPROVAL','每場景僅採用一支；須核對動作、風險、裁切及有效起訖。');approvedScenes.add(d.scene_id);
  }
 }
 for(const r of review.search_again)if(!plan.scenes.some(s=>s.id===r.scene_id)||!Array.isArray(r.queries)||r.queries.length<1||r.queries.length>2||r.queries.some(q=>typeof q!=='string'||q.length<4||q.length>100))throw new PipelineError('INVALID_RESEARCH_REQUEST','重新搜尋請求不合法。');
 return review;
}
export async function importReview(dir,file){const plan=validatePlan(await readJSON(path.join(dir,'scene-plan.json'))),data=await readJSON(path.join(dir,'broll-candidates.json')),review=validateReview(await readJSON(file),plan,data);await writeJSON(path.join(dir,'approved-review.json'),review);const manifest=await readJSON(path.join(dir,'asset-manifest.json'));for(const a of manifest.assets){const d=review.decisions.find(x=>x.scene_id===a.scene_id&&x.candidate_id===a.candidate_id);if(d)Object.assign(a,{review_status:d.status,selected_trim:d.selected_trim??null,crop_parameters:d.crop_parameters??a.crop_parameters,actual_action_description:d.actual_action_description??null,action_verified:d.action_verified===true});}await writeJSON(path.join(dir,'asset-manifest.json'),manifest);return review;}
export async function compileEdit(dir,{allowPartial=false}={}){
 const plan=validatePlan(await readJSON(path.join(dir,'scene-plan.json'))),dataset=await readJSON(path.join(dir,'broll-candidates.json')),review=validateReview(await readJSON(path.join(dir,'approved-review.json')),plan,dataset),manifest=await readJSON(path.join(dir,'asset-manifest.json'));const approved=review.decisions.filter(d=>d.status==='approved');
 if(!allowPartial&&plan.scenes.some(s=>!approved.some(d=>d.scene_id===s.id)))throw new PipelineError('UNAPPROVED_SCENES','仍有未核准場景；不產生正式剪輯。');
 const clips=[];let frame=0;for(const scene of plan.scenes){const d=approved.find(x=>x.scene_id===scene.id);const n=Math.round(scene.duration_seconds*plan.fps);if(d){const asset=manifest.assets.find(a=>a.scene_id===d.scene_id&&a.candidate_id===d.candidate_id);if(!asset?.source_sha256||!asset.local_path)throw new PipelineError('MISSING_APPROVED_MEDIA','核准素材尚未下載並驗證SHA-256。');if(asset.review_status!=='approved'||!/^media\/pixabay-\d+\.mp4$/.test(asset.local_path)||!/^[a-f0-9]{64}$/.test(asset.source_sha256))throw new PipelineError('INVALID_APPROVED_MEDIA','素材路徑、審核狀態或雜湊不合法。');let actual;try{actual=hash(await fs.readFile(path.join(dir,asset.local_path)));}catch{throw new PipelineError('MISSING_APPROVED_MEDIA','本機核准素材不存在。');}if(actual!==asset.source_sha256)throw new PipelineError('MEDIA_HASH_MISMATCH','已下載素材已變更，停止剪輯。');if(d.selected_trim.end>asset.actual_duration)throw new PipelineError('INVALID_MEDIA_TRIM','所選區間超過實際媒體長度。');const required=n/plan.fps;if(d.selected_trim.end-d.selected_trim.start+.001<required)throw new PipelineError('TRIM_TOO_SHORT','已選片段短於場景；請縮短場景或重新選片，不自動循環。');clips.push({asset_id:asset.asset_id,scene_id:scene.id,frames:[frame,frame+n],source_seconds:[d.selected_trim.start,d.selected_trim.start+required],selected_trim:d.selected_trim,crop_parameters:d.crop_parameters,local_path:asset.local_path,source_sha256:asset.source_sha256,source_url:asset.source_url,author:asset.author,license_url:asset.license_url,narration:scene.narration,animation_refs:scene.animation_refs??[],subtitle_reference:{text:scene.narration,frames:[frame,frame+n]}});}frame+=n;}
 const edit={schema_version:'1.0',project_id:plan.project_id,composition:'ApprovedBrollInput',fps:plan.fps,dimensions:[1080,1920],duration_frames:frame,status:allowPartial?'partial_validation_only':'approved_for_edit',clips};await writeJSON(path.join(dir,'edit-timeline.json'),edit);await writeJSON(path.join(dir,'remotion-input.json'),edit);return edit;
}
