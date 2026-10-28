import fs from 'node:fs/promises';
import path from 'node:path';
import {PipelineError,hash,readJSON,writeJSON,redact,withLock} from './common.mjs';
export const TTL=24*60*60*1000;
const LANGS='cs da de en es fr id it hu nl no pl pt ro sk fi sv tr vi th bg ru el ja ko zh'.split(' ');
const CATS='backgrounds fashion nature science education feelings health people religion places animals industry computer food sports transportation travel buildings business music'.split(' ');
const allowed=new Set(['q','lang','video_type','category','min_width','min_height','safesearch','order','page','per_page']);
export function parameters(input){
 for(const k of Object.keys(input))if(!allowed.has(k))throw new PipelineError('INVALID_PARAMETER','影片搜尋包含不支援的參數。',{parameter:k});
 const p={q:'',lang:'en',video_type:'film',min_width:0,min_height:0,safesearch:true,order:'popular',page:1,per_page:12,...input};
 if(typeof p.q!=='string'||!p.q.trim()||p.q.length>100||!LANGS.includes(p.lang)||!['film','all','animation'].includes(p.video_type)||!['popular','latest'].includes(p.order)||typeof p.safesearch!=='boolean'||(p.category&&!CATS.includes(p.category)))throw new PipelineError('INVALID_PARAMETER','搜尋字串或列舉值不正確。');
 for(const k of ['min_width','min_height','page','per_page'])if(!Number.isInteger(p[k])||p[k]<0)throw new PipelineError('INVALID_PARAMETER','尺寸／分頁必須是非負整數。');
 if(p.page<1||p.page>3||p.per_page<3||p.per_page>20||p.min_width>7680||p.min_height>7680)throw new PipelineError('LOCAL_SEARCH_CAP','本系統每頁3–20項、最多3頁；請縮小查詢。');
 return Object.fromEntries(Object.entries(p).sort(([a],[b])=>a.localeCompare(b)));
}
function positive(s,fallback=0){if(s===null||s===undefined||s==='')return fallback;const n=Number(s);return Number.isFinite(n)&&n>=0?n:fallback;}
export class PixabayClient{
 constructor({key=process.env.PIXABAY_API_KEY,dir=path.resolve('.runtime/pixabay'),fetchImpl=fetch,now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),maxRequestsPerRun=6}={}){this.key=key?.trim();this.dir=dir;this.fetch=fetchImpl;this.now=now;this.sleep=sleep;this.max=Math.min(6,maxRequestsPerRun);this.requests=0;}
 async search(input){const p=parameters(input);if(!this.key)throw new PipelineError('MISSING_API_KEY','後端環境尚未設定PIXABAY_API_KEY；未發出API請求。');
  const cacheFile=path.join(this.dir,'cache',hash(JSON.stringify(p))+'.json');
  return withLock(path.join(this.dir,'request.lock'),async()=>{
   const cached=await readJSON(cacheFile,null);if(cached&&this.now()-cached.fetched_at<TTL)return {...cached.data,_transport:{cache_hit:true,api_requests:0}};
   for(let attempt=0;attempt<2;attempt++){
    let state=await readJSON(path.join(this.dir,'rate.json'),{timestamps:[],daily:{date:'',count:0},blockedUntil:0});const now=this.now();const day=new Date(now).toISOString().slice(0,10);state.timestamps=state.timestamps.filter(t=>now-t<60000);if(state.daily.date!==day)state.daily={date:day,count:0};
    if(this.requests>=this.max||state.timestamps.length>=8||state.daily.count>=60)throw new PipelineError('LOCAL_RATE_LIMIT','已達本輪6次／每分鐘8次／每日60次的保守搜尋上限，請稍後或使用快取。');
    if(state.blockedUntil>now)throw new PipelineError('RATE_LIMIT_COOLDOWN','仍在官方限流冷卻期。',{retry_after_seconds:Math.ceil((state.blockedUntil-now)/1000)});
    state.timestamps.push(now);state.daily.count++;this.requests++;await writeJSON(path.join(this.dir,'rate.json'),state);
    const url=new URL('https://pixabay.com/api/videos/');for(const [k,v] of Object.entries(p))url.searchParams.set(k,String(v));url.searchParams.set('key',this.key);
    let response;try{response=await this.fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});}catch(e){if(attempt===0){await this.sleep(1000);continue;}const code=e?.cause?.code??e?.code;throw new PipelineError(code==='ENOTFOUND'||code==='EAI_AGAIN'?'DNS_ERROR':e?.name==='TimeoutError'?'NETWORK_TIMEOUT':'NETWORK_ERROR','正式代理路徑連線失敗；不代表影片不存在。');}
    const remaining=positive(response.headers.get('X-RateLimit-Remaining'),Infinity),reset=positive(response.headers.get('X-RateLimit-Reset'),60);
    const retryHeader=response.headers.get('Retry-After');const retry=retryHeader?(Number.isFinite(Number(retryHeader))?positive(retryHeader):Math.max(0,(Date.parse(retryHeader)-now)/1000)):0;
    state=await readJSON(path.join(this.dir,'rate.json'),state);state.remote={limit:positive(response.headers.get('X-RateLimit-Limit'),100),remaining:Number.isFinite(remaining)?remaining:null,reset_seconds:reset};
    if(remaining===0||response.status===429)state.blockedUntil=now+Math.max(1,reset,retry)*1000;
    await writeJSON(path.join(this.dir,'rate.json'),state);
    await fs.mkdir(this.dir,{recursive:true});await fs.appendFile(path.join(this.dir,'requests.jsonl'),redact(JSON.stringify({at:new Date(now).toISOString(),endpoint:'https://pixabay.com/api/videos/',parameters:p,status:response.status,attempt,rate:state.remote}),this.key)+'\n',{mode:0o600});
    if(response.status===401)throw new PipelineError('AUTH_401','Pixabay認證失敗；請檢查後端金鑰，未記錄回應原文。');
    if(response.status===403)throw new PipelineError('FORBIDDEN_403','Pixabay或網路存取回傳403；不代表查無影片，停止重試並檢查授權／代理政策。');
    if(response.status===429)throw new PipelineError('HTTP_429','Pixabay限流，已保存冷卻時間並停止本輪搜尋。',{retry_after_seconds:Math.max(reset,retry,1)});
    if(response.status>=500&&attempt===0){await this.sleep(1000);continue;}
    if(!response.ok)throw new PipelineError('API_HTTP_ERROR','Pixabay回傳非成功狀態，已停止。',{status:response.status});
    let data;try{data=await response.json();}catch{throw new PipelineError('INVALID_API_RESPONSE','Pixabay回傳不是有效JSON。');}
    if(!Array.isArray(data.hits))throw new PipelineError('INVALID_API_RESPONSE','Pixabay回傳缺少hits陣列。');
    // Strip unknown fields and any echoed credential before persisting metadata.
    const clean=JSON.parse(redact(JSON.stringify({total:positive(data.total),totalHits:positive(data.totalHits),hits:data.hits.map(h=>({id:h.id,pageURL:h.pageURL,tags:h.tags,duration:h.duration,user:h.user,user_id:h.user_id,type:h.type,videos:h.videos,picture_id:h.picture_id}))}),this.key));
    await writeJSON(cacheFile,JSON.parse(redact(JSON.stringify({fetched_at:now,expires_at:now+TTL,parameters:p,data:clean}),this.key)));return {...clean,_transport:{cache_hit:false,api_requests:attempt+1}};
   }
  });
 }
}
