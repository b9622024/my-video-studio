import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {readJSON,writeJSON,hash,safeURL,PipelineError} from './common.mjs';import {verifyApproval} from './hybrid.mjs';
const probe=file=>{const p=spawnSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8'});if(p.status!==0)throw new PipelineError('INVALID_VIDEO','素材未通過ffprobe。');return JSON.parse(p.stdout);};
export async function prepareHybridMedia(dir,{fetchImpl=fetch}={}){
 const {approved}=await verifyApproval(dir);const manifest=await readJSON(path.join(dir,'asset-manifest.json'));
 await fs.mkdir(path.join(dir,'media'),{recursive:true});let count=0;
 for(const option of approved.selections){
  if(option.mode==='information_motion_graphics')continue;if(++count>3)throw new PipelineError('MEDIA_CAP','本輪最多三支正式媒體。');
  const file=`media/${option.asset_id}.mp4`,target=path.join(dir,file),partial=target+'.partial';
  const variant=option.variants?.find(v=>v.name==='medium')??option.variants?.find(v=>v.name==='small');
  if(option.mode==='user_provided_footage'){
   if(!option.rights_confirmed||!/^user-input\/user-[a-f0-9]+\.mp4$/.test(option.user_input_path??''))throw new PipelineError('USER_RIGHTS_REQUIRED','自有素材需來源權利聲明。');
   const b=await fs.readFile(path.join(dir,option.user_input_path));if(hash(b)!==option.normalized_sha256)throw new PipelineError('USER_FILE_CHANGED','自有素材已變更，需重新核准。');await fs.writeFile(target,b);
  }else{
   if(!safeURL(variant?.url))throw new PipelineError('INVALID_URL','僅下載官方API回傳網址。');
   const r=await fetchImpl(variant.url,{redirect:'error',signal:AbortSignal.timeout(45000)});
   if(!r.ok){await r.body?.cancel();throw new PipelineError('MEDIA_HTTP_ERROR','下載失敗，停止且不繞過。',{status:r.status});}
   const cap=50*1024*1024;if(Number(r.headers.get('content-length'))>cap){await r.body?.cancel();throw new PipelineError('MEDIA_CAP','超過50MiB。');}
   const h=await fs.open(partial,'w',0o600);let size=0;try{for await(const b of r.body){size+=b.length;if(size>cap)throw new PipelineError('MEDIA_CAP','超過50MiB。');await h.write(b);}}catch(e){await h.close();await fs.rm(partial,{force:true});throw e;}await h.close();await fs.rename(partial,target);
  }
  const meta=probe(target),video=meta.streams.find(s=>s.codec_type==='video');if(!video||Number(meta.format.duration)<option.selected_trim.end)throw new PipelineError('MEDIA_TOO_SHORT','實際素材不足所選區間。');
  const asset={...option,local_path:file,source_sha256:hash(await fs.readFile(target)),actual_duration:Number(meta.format.duration),actual_width:video.width,actual_height:video.height,downloaded_rendition:variant?.name??'user_normalized',downloaded_at:new Date().toISOString()};
  manifest.assets=manifest.assets.filter(a=>a.option_id!==option.option_id);manifest.assets.push(asset);await writeJSON(path.join(dir,'asset-manifest.json'),manifest);
 }
 return {prepared:count};
}
export async function ingestUserFootage(dir,input,rights){
 if(rights?.rights_confirmed!==true||!rights.author||!rights.statement)throw new PipelineError('USER_RIGHTS_REQUIRED','需使用者確認權利、作者及用途。');
 if(!/\.(mp4|mov)$/i.test(input))throw new PipelineError('INVALID_USER_FORMAT','只接受MP4／MOV。');
 if((await fs.stat(input)).size>250*1024*1024)throw new PipelineError('USER_MEDIA_CAP','自有素材上限250MiB。');const bytes=await fs.readFile(input);
 const originalHash=hash(bytes),id='user-'+originalHash.slice(0,20),meta=probe(input);if(!meta.streams.some(s=>s.codec_type==='video')||Number(meta.format.duration)>180)throw new PipelineError('INVALID_USER_VIDEO','需180秒內的有效影片。');
 await fs.mkdir(path.join(dir,'user-input'),{recursive:true});const relative=`user-input/${id}.mp4`,target=path.join(dir,relative);
 const result=spawnSync('ffmpeg',['-v','error','-y','-i',input,'-map','0:v:0','-an','-vf',"scale='min(1920,iw)':-2",'-c:v','libx264','-pix_fmt','yuv420p','-preset','veryfast','-crf','20','-movflags','+faststart',target],{timeout:180000});
 if(result.status!==0)throw new PipelineError('NORMALIZE_FAILED','自有影片正規化失敗。');
 const normalized=probe(target),v=normalized.streams.find(s=>s.codec_type==='video');
 const frames=[];for(const [i,f] of [.15,.5,.85].entries()){const relativeFrame=`user-input/${id}-frame-${i+1}.jpg`;const at=Math.max(0,Number(normalized.format.duration)*f);const shot=spawnSync('ffmpeg',['-v','error','-y','-ss',String(at),'-i',target,'-frames:v','1','-vf','scale=480:-2',path.join(dir,relativeFrame)]);if(shot.status!==0)throw new PipelineError('USER_FRAME_FAILED','自有素材影格擷取失敗。');frames.push({path:relativeFrame,time_seconds:at});}
 const record={asset_id:id,provider:'user',mode:'user_provided_footage',user_input_path:relative,normalized_sha256:hash(await fs.readFile(target)),original_sha256:originalHash,duration:Number(normalized.format.duration),width:v.width,height:v.height,author:rights.author,rights_confirmed:true,rights_statement:rights.statement,license_url:null,source_url:null,review_status:'pending',visual_check:{status:'metadata_only',objects_and_state:false,exact_action_verified:false},notes:['FFmpeg預設依iPhone旋轉metadata正規化；HDR色彩與裁切仍須人工看片。','此紀錄尚未加入候選或核准；須以新候選revision審核。']};
 record.preview={video:relative,poster:frames[1].path,frames,duration:record.duration,sha256:record.normalized_sha256};
 await writeJSON(path.join(dir,'user-input',id+'.json'),record);return record;
}
