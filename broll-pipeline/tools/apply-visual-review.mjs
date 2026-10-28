import path from 'node:path';
import fs from 'node:fs/promises';
import {readJSON,writeJSON,hash} from '../src/common.mjs';
import {semanticScreen} from '../src/semantics.mjs';
const dir=path.resolve('projects/bento-v101');
const data=await readJSON(path.join(dir,'broll-candidates.json'));
const audit=await readJSON(path.join(dir,'visual-review.json'));
const plan=await readJSON(path.join(dir,'scene-plan.json'));
for(const row of data.scenes){
 row.excluded_previews=[];
 for(const c of row.screened_candidates){
  c.metadata_screen=semanticScreen(c,plan.scenes.find(s=>s.id===row.scene_id));
  delete c.visual_check;c.visual_verification='metadata_only';c.action_verified=false;
  const v=audit.entries[c.candidate_id];
  if(!c.local_preview||!v)continue;
  // Reading frames is a separate recorded human-assisted step, never tag scoring.
  if(hash(await fs.readFile(path.join(dir,c.local_preview.video)))!==v.evidence_video_sha256)continue;
  let sameFrames=true;for(const f of c.local_preview.frames)if(hash(await fs.readFile(path.join(dir,f.path)))!==v.evidence_frame_sha256?.[f.path])sameFrames=false;
  if(!sameFrames)continue;
  c.visual_check={...v,evidence_frames:c.local_preview.frames};
  c.visual_verification=v.verdict==='excluded'?'frames_reviewed_excluded':'frames_reviewed_needs_human_confirmation';
  c.action_verified=false;c.review_status='pending';
  if(v.verdict==='excluded')row.excluded_previews.push(c);
 }
 row.candidates=row.screened_candidates.filter(c=>c.local_preview&&c.visual_check?.verdict!=='excluded'&&c.metadata_screen.status!=='excluded');
 const exact=row.candidates.filter(c=>c.visual_check?.verdict==='exact_match');
 row.status=exact.length?'awaiting_human_approval':'no_suitable_footage';
 row.notes='no_suitable_footage表示沒有已確認精確動作匹配；保留的近似方案必須人工確認，不強湊三支。';
}
data.status='awaiting_user_quality_acceptance';
data.revision_id=hash(JSON.stringify({generated_at:data.generated_at,scenes:data.scenes}));
await writeJSON(path.join(dir,'broll-candidates.json'),data);
await writeJSON(path.join(dir,'asset-manifest.json'),{schema_version:'1.0',version:'1.0.1',project_id:data.project_id,assets:data.scenes.flatMap(s=>s.candidates),notes:['僅本機低解析度審核預覽；source_sha256仍為null。預覽hash記於local_preview；不能當成正式下載hash。','近似方案未人工核准，不能自動剪輯。']});
console.log(JSON.stringify(data.scenes.map(s=>({scene:s.scene_id,status:s.status,retained:s.candidates.length,excluded_previews:s.excluded_previews.length})),null,2));
