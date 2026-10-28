import path from 'node:path';
import fs from 'node:fs/promises';
import {PixabayClient} from '../src/pixabay.mjs';
import {normalizeHit} from '../src/candidates.mjs';
import {semanticScreen} from '../src/semantics.mjs';
import {fetchPreview} from '../src/local-preview.mjs';
import {readJSON,writeJSON,hash,safeError} from '../src/common.mjs';
const dir=path.resolve('projects/bento-v101');
const plan=await readJSON(path.join(dir,'scene-plan.json'));
const client=new PixabayClient({maxRequestsPerRun:6});
const previous=await readJSON(path.join(dir,'broll-candidates.json'),{scenes:[]});
const result={schema_version:'1.0',version:'1.0.1',project_id:plan.project_id,provider:'pixabay',generated_at:new Date().toISOString(),scenes:[],errors:[]};
let stop=false;
for(const scene of plan.scenes){
 const row={scene_id:scene.id,queries:[],candidates:[],screened_candidates:[],status:'metadata_only',missing_action:scene.semantic_requirements.specific_action,alternative:scene.semantic_requirements.alternative};
 if(!stop)for(const q of scene.search_queries){
  try{
   const data=await client.search({q,lang:'en',video_type:'film',safesearch:true,order:'popular',page:1,per_page:12});
   row.queries.push({q,total:data.total,cache_hit:data._transport.cache_hit});
   for(const h of data.hits){const c=normalizeHit(h,scene,plan.project_id,q);if(!c||row.screened_candidates.some(v=>v.candidate_id===c.candidate_id))continue;
    c.metadata_screen=semanticScreen(c,scene);c.visual_verification='metadata_only';c.score.status='metadata_score_only';row.screened_candidates.push(c);
   }
  }catch(e){result.errors.push({scene_id:scene.id,...safeError(e)});stop=true;break;}
 }
 const shortlist=row.screened_candidates.filter(c=>c.metadata_screen.status!=='excluded').sort((a,b)=>(b.metadata_screen.ranking_hint+b.score.total)-(a.metadata_screen.ranking_hint+a.score.total)).slice(0,2);
 for(const c of shortlist){let old=previous.scenes.flatMap(s=>s.screened_candidates).find(v=>v.candidate_id===c.candidate_id&&v.local_preview);if(old){try{if(hash(await fs.readFile(path.join(dir,old.local_preview.video)))!==old.local_preview.sha256)old=null;else for(const f of old.local_preview.frames)await fs.access(path.join(dir,f.path));}catch{old=null;}}const preview=old?{...c,local_preview:old.local_preview,preview_probe:old.preview_probe,availability:old.availability}:await fetchPreview(c,dir);const i=row.screened_candidates.findIndex(v=>v.candidate_id===c.candidate_id);row.screened_candidates[i]=preview;if(preview.local_preview)row.candidates.push(preview);}
 if(!row.candidates.length)row.status='no_suitable_footage';result.scenes.push(row);
}
result.api_requests=client.requests;result.status=result.errors.length?'partial_search_error':'awaiting_visual_check';
result.revision_id=hash(JSON.stringify(result));
await writeJSON(path.join(dir,'broll-candidates.json'),result);
await writeJSON(path.join(dir,'asset-manifest.json'),{schema_version:'1.0',project_id:plan.project_id,assets:result.scenes.flatMap(s=>s.candidates),notes:['本機低解析度預覽僅供本次私有審核；非正式已核准剪輯素材。']});
await writeJSON(path.join(dir,'edit-timeline.json'),{schema_version:'1.0',project_id:plan.project_id,status:'awaiting_human_approval',clips:[]});
console.log(JSON.stringify({api_requests:result.api_requests,errors:result.errors,scenes:result.scenes.map(s=>({id:s.scene_id,hits:s.screened_candidates.length,excluded:s.screened_candidates.filter(c=>c.metadata_screen.status==='excluded').length,previews:s.candidates.map(c=>({id:c.candidate_id,tags:c.tags,probe:c.preview_probe}))}))},null,2));
