import path from 'node:path';
import fs from 'node:fs/promises';
import {searchProject,importReview,compileEdit} from './pipeline.mjs';
import {buildReview} from './review.mjs';
import {downloadApproved} from './download.mjs';
import {serve} from './server.mjs';
import {readJSON,writeJSON,safeError,PipelineError,validatePlan} from './common.mjs';
const args=process.argv.slice(2);const command=args[0];const arg=n=>args.includes('--'+n)?args[args.indexOf('--'+n)+1]:undefined;const dir=path.resolve(arg('project')??'projects/bento-v1');
try{
 let result;
 if(command==='diagnose')result={PIXABAY_API_KEY_loaded:Boolean(process.env.PIXABAY_API_KEY?.trim()),api_endpoint:'https://pixabay.com/api/videos/',node_version:process.version,network_request_made:false};
 else if(command==='validate'){validatePlan(await readJSON(path.join(dir,'scene-plan.json')));result={valid:true};}
 else if(command==='search'){let requests=null;if(arg('requests')){const r=await readJSON(arg('requests'));const p=await readJSON(path.join(dir,'scene-plan.json'));if(r.project_id!==p.project_id||!Array.isArray(r.requests))throw new PipelineError('INVALID_RESEARCH_REQUEST','重新搜尋專案不符。');requests=r.requests;}const r=await searchProject(dir,{requests});result={status:r.status,api_requests:r.api_requests,scenes:r.scenes.map(s=>({scene_id:s.scene_id,candidates:s.candidates.length,status:s.status})),errors:r.errors};}
 else if(command==='review')result={html:await buildReview(dir)};
 else if(command==='import'){if(!arg('file'))throw new PipelineError('MISSING_FILE','請提供--file審核JSON。');const r=await importReview(dir,arg('file'));result={decisions:r.decisions.length,approved:r.decisions.filter(d=>d.status==='approved').length};}
 else if(command==='download')result=await downloadApproved(dir);
 else if(command==='compile'){const r=await compileEdit(dir);result={status:r.status,clips:r.clips.length};}
 else if(command==='serve'){const port=Number(arg('port')??3110);if(!Number.isInteger(port)||port<1024||port>65535)throw new PipelineError('INVALID_PORT','port不合法。');const host=arg('host')??'127.0.0.1';if(!['127.0.0.1','0.0.0.0'].includes(host))throw new PipelineError('INVALID_HOST','僅支援localhost或明確選擇的LAN預覽。');serve(dir,port,host);console.log(JSON.stringify({url:`http://${host}:${port}`,scope:'local preview only; no public deployment'}));}
 else if(command==='scaffold'){if(!arg('script'))throw new PipelineError('MISSING_SCRIPT','請提供--script文字檔。');const text=await fs.readFile(arg('script'),'utf8');result={schema_version:'1.0',project_id:arg('id')??'new-project',title:'待Codex分析',fps:30,source_script:text,analysis_origin:'scaffold_only; Codex semantic authoring required',status:'needs_semantic_analysis',scenes:[]};await writeJSON(path.join(dir,'scene-plan.json'),result);}
 else throw new PipelineError('USAGE','Commands: diagnose, validate, search, review, serve, import --file, download, compile, scaffold --script');
 if(result){console.log(JSON.stringify(result,null,2));if(result.status==='blocked')process.exitCode=2;}
}catch(e){console.error(JSON.stringify(safeError(e),null,2));process.exitCode=1;}
