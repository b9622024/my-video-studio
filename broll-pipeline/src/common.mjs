import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export class PipelineError extends Error {constructor(code,message,details={}){super(message);this.name='PipelineError';this.code=code;this.details=details;} toJSON(){return {code:this.code,message:this.message,...this.details};}}
export const hash=x=>createHash('sha256').update(x).digest('hex');
export async function readJSON(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw new PipelineError('INVALID_FILE','無法讀取或解析指定JSON。');}}
export async function writeJSON(file,value){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.'+process.pid+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await fs.rename(temp,file);}
export const safeError=e=>e instanceof PipelineError?e.toJSON():{code:'INTERNAL_ERROR',message:'操作失敗；未輸出原始錯誤或含認證網址。'};
export function redact(value,key=process.env.PIXABAY_API_KEY){let s=String(value).replace(/([?&](?:key|api_key|token)=)[^&#\s"']*/gi,'$1[REDACTED]');if(key)s=s.split(key).join('[REDACTED]');return s;}
export function safeURL(value,kind='media'){
 try{const u=new URL(value);const domains=kind==='page'?['pixabay.com','www.pixabay.com']:['cdn.pixabay.com','pixabay.com','www.pixabay.com'];if(u.protocol!=='https:'||!domains.includes(u.hostname)||u.username||u.password)return null;for(const k of u.searchParams.keys())if(/key|token|auth/i.test(k))return null;return u.href;}catch{return null;}
}
export async function withLock(dir,fn){await fs.mkdir(path.dirname(dir),{recursive:true});try{await fs.mkdir(dir);}catch(e){if(e.code==='EEXIST')throw new PipelineError('BUSY','另一個搜尋程序正在執行，請稍後重試。');throw e;}try{return await fn();}finally{await fs.rmdir(dir);}}
export function validatePlan(p){
 if(p.schema_version!=='1.0'||!p.project_id||!Array.isArray(p.scenes)||!p.scenes.length||p.scenes.length>12)throw new PipelineError('INVALID_PLAN','需1–12個場景與project_id。');
 const ids=new Set();for(const s of p.scenes){if(!s.id||ids.has(s.id)||!s.narration||!s.event||!s.viewer_takeaway||!Array.isArray(s.search_queries)||s.search_queries.length>3||!s.search_queries.length||!Number.isFinite(s.duration_seconds)||s.duration_seconds<=0||s.duration_seconds>20)throw new PipelineError('INVALID_PLAN','場景欄位、事件、長度或查詢不完整。');ids.add(s.id);for(const q of s.search_queries)if(typeof q!=='string'||q.length<4||q.length>100)throw new PipelineError('INVALID_PLAN','查詢需4–100字元的動作描述。');}return p;
}
