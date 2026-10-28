import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {safeURL,hash,PipelineError} from './common.mjs';
const MAX=20*1024*1024;
function run(bin,args){const r=spawnSync(bin,args,{encoding:'utf8',timeout:60000,maxBuffer:1024*1024});if(r.status!==0)throw new PipelineError('PREVIEW_PROCESS_FAILED',bin+'無法處理預覽。');return r.stdout;}
export async function fetchPreview(c,dir,{fetchImpl=fetch}={}){
 const variant=c.variants.find(v=>v.name==='tiny')??c.variants.find(v=>v.name==='small');
 if(!variant||!safeURL(variant.url))return {...c,availability:{status:'unavailable',reason:'no_official_small_variant'}};
 const folder=path.join(dir,'previews');await fs.mkdir(folder,{recursive:true});
 const name=c.candidate_id,source=path.join(folder,name+'-source.mp4');
 const record={url:variant.url,variant:variant.name,checked_at:new Date().toISOString(),method:'GET'};
 // HEAD is diagnostic only. A HEAD failure never decides GET availability.
 try{const h=await fetchImpl(variant.url,{method:'HEAD',redirect:'error',signal:AbortSignal.timeout(15000)});record.head_status=h.status;}catch{record.head_status=null;}
 let written=false;
 try{
  const r=await fetchImpl(variant.url,{redirect:'error',signal:AbortSignal.timeout(45000)});record.get_status=r.status;record.content_type=r.headers.get('content-type');
  if(!r.ok){await r.body?.cancel();return {...c,preview_probe:record,availability:{status:'unavailable',http_status:r.status,reason:r.status===403?'GET_403_no_retry':'GET_failed'}};}
  if(!/video\/|application\/octet-stream/i.test(record.content_type??'')){await r.body?.cancel();throw new PipelineError('PREVIEW_CONTENT_TYPE','非影片回應。');}
  if(Number(r.headers.get('content-length'))>MAX){await r.body.cancel();throw new PipelineError('PREVIEW_TOO_LARGE','超過20MiB預覽限制。');}
  const chunks=[];let size=0;for await(const chunk of r.body){size+=chunk.length;if(size>MAX)throw new PipelineError('PREVIEW_TOO_LARGE','超過20MiB預覽限制。');chunks.push(chunk);}
  await fs.writeFile(source,Buffer.concat(chunks),{mode:0o600});written=true;record.bytes=size;
  const info=JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',source]));
  const duration=Number(info.format.duration);if(!Number.isFinite(duration)||duration<=0)throw new PipelineError('PREVIEW_INVALID','影片長度無效。');
  const frames=[];const times=[.15,.5,.85].map(x=>Math.max(0,Math.min(duration-.1,duration*x)));
  for(let i=0;i<times.length;i++){const file=`previews/${name}-frame-${i+1}.jpg`;run('ffmpeg',['-v','error','-y','-ss',String(times[i]),'-i',source,'-frames:v','1','-vf','scale=480:-2',path.join(dir,file)]);frames.push({time_seconds:times[i],path:file});}
  // Full-length low resolution preview preserves the source time coordinates.
  const preview=`previews/${name}.mp4`;run('ffmpeg',['-v','error','-y','-i',source,'-an','-vf',"scale='min(480,iw)':-2",'-c:v','libx264','-preset','veryfast','-crf','29','-movflags','+faststart',path.join(dir,preview)]);
  const bytes=await fs.readFile(path.join(dir,preview));
  return {...c,preview_probe:record,availability:{status:'local_preview_ready',http_status:r.status},local_preview:{video:preview,poster:frames[1].path,frames,duration,sha256:hash(bytes),bytes:bytes.length,source_variant_url:variant.url,source_sha256:hash(await fs.readFile(source)),temporary_review_only:true},visual_verification:'metadata_only',action_verified:false};
 }catch(e){return {...c,preview_probe:record,availability:{status:'unavailable',reason:e instanceof PipelineError?e.code:'GET_or_processing_error'}};}
 finally{if(written)await fs.rm(source,{force:true});}
}
