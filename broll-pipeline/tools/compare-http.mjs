import {readJSON,writeJSON,safeURL} from '../src/common.mjs';
// One representative source/thumbnail/video; no key and no alternate hosts.
const old=await readJSON('projects/bento-v1/broll-candidates.json');
const c=old.scenes[0].candidates[0],results=[];
for(const [kind,url] of [['source_page',c.source_url],['api_thumbnail',c.thumbnail_url],['api_tiny_video',c.preview_url]]){
 for(const method of ['HEAD','GET']){
  const record={candidate_id:c.candidate_id,kind,method,url,at:new Date().toISOString()};
  try{const r=await fetch(url,{method,redirect:'manual',signal:AbortSignal.timeout(20000)});Object.assign(record,{status:r.status,content_type:r.headers.get('content-type')});if(method==='GET'&&r.ok&&kind==='api_thumbnail'){const b=Buffer.from(await r.arrayBuffer());record.bytes=b.length;}else await r.body?.cancel();
   if(kind==='source_page'&&r.status===301){record.location=r.headers.get('location');const next=new URL(record.location,url).href;if(safeURL(next,'page')){record.canonical_url=next;const final=await fetch(next,{method,redirect:'manual',signal:AbortSignal.timeout(20000)});record.canonical_status=final.status;await final.body?.cancel();}}
  }catch{record.error='network_error';}
  results.push(record);
 }
}
await writeJSON('docs/test-results/v101-http.json',{results,interpretation:'HEAD only diagnoses that endpoint. GET video success is independent from source page or API thumbnail restrictions. Never retry or bypass a GET403.'});
console.log(JSON.stringify(results,null,2));
