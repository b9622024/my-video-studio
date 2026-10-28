import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readJSON,writeJSON,PipelineError,safeURL,hash,validatePlan} from './common.mjs';
import {validateReview,candidateIndex} from './pipeline.mjs';
export async function downloadApproved(dir,{fetchImpl=fetch,maxFiles=3,maxBytes=50*1024*1024}={}){
 const plan=validatePlan(await readJSON(path.join(dir,'scene-plan.json'))),data=await readJSON(path.join(dir,'broll-candidates.json')),review=validateReview(await readJSON(path.join(dir,'approved-review.json')),plan,data),manifest=await readJSON(path.join(dir,'asset-manifest.json'));const approved=review.decisions.filter(d=>d.status==='approved');if(approved.length>maxFiles)throw new PipelineError('DOWNLOAD_CAP','本輪最多下載3個已核准素材。');
 const index=candidateIndex(data);await fs.mkdir(path.join(dir,'media'),{recursive:true});const fetched=new Map();
 for(const d of approved){const c=index.get(d.scene_id+'::'+d.candidate_id);const rendition=c.variants.find(v=>v.name==='medium')??[...c.variants].sort((a,b)=>b.width*b.height-a.width*a.height)[0];const url=safeURL(rendition?.url);if(!url)throw new PipelineError('INVALID_MEDIA_URL','來源不在官方HTTPS媒體範圍。');
  const relative=`media/${c.asset_id}.mp4`,target=path.join(dir,relative);let digest=fetched.get(c.asset_id);
  if(!digest){
   try{const old=await fs.readFile(target);digest=hash(old);}catch(e){if(e.code!=='ENOENT')throw e;}
   if(!digest){let r;try{r=await fetchImpl(url,{redirect:'error',signal:AbortSignal.timeout(30000)});}catch{throw new PipelineError('DOWNLOAD_NETWORK_ERROR','已核准素材連線失敗；不表示素材不存在。');}
    if(!r.ok)throw new PipelineError(r.status===403?'DOWNLOAD_403':'DOWNLOAD_HTTP_ERROR','官方媒體下載失敗，停止且不繞過。',{status:r.status});
    if(Number(r.headers.get('content-length'))>maxBytes)throw new PipelineError('MEDIA_TOO_LARGE','素材超過本輪50MiB檔案上限。');
    const temp=target+'.partial';let length=0;const handle=await fs.open(temp,'w',0o600);try{for await(const chunk of r.body){length+=chunk.length;if(length>maxBytes)throw new PipelineError('MEDIA_TOO_LARGE','下載超過50MiB，已停止。');await handle.write(chunk);}}catch(e){await handle.close();await fs.rm(temp,{force:true});throw e;}await handle.close();await fs.rename(temp,target);digest=hash(await fs.readFile(target));
   }fetched.set(c.asset_id,digest);
  }
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=width,height,codec_type','-of','json',target],{encoding:'utf8'});if(probe.status!==0)throw new PipelineError('INVALID_MEDIA','下載內容未通過ffprobe，不能進正式剪輯。');let metadata;try{metadata=JSON.parse(probe.stdout);}catch{throw new PipelineError('INVALID_MEDIA','媒體metadata無效。');}const v=metadata.streams.find(v=>v.codec_type==='video');if(!v||Number(metadata.format.duration)<d.selected_trim.end)throw new PipelineError('INVALID_MEDIA_TRIM','實際媒體長度不足選取區間。');
  const a=manifest.assets.find(a=>a.scene_id===d.scene_id&&a.asset_id===c.asset_id);Object.assign(a,{source_sha256:digest,local_path:relative,downloaded_rendition:rendition.name,downloaded_at:new Date().toISOString(),actual_duration:Number(metadata.format.duration),actual_width:v.width,actual_height:v.height,review_status:'approved'});await writeJSON(path.join(dir,'asset-manifest.json'),manifest);
 }
 return {downloaded_assets:fetched.size,approved_decisions:approved.length};
}
