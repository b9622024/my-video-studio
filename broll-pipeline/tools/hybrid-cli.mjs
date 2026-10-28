import path from 'node:path';import {readJSON,safeError,PipelineError} from '../src/common.mjs';
import {approveChatSelection,compileHybrid} from '../src/hybrid.mjs';import {prepareHybridMedia,ingestUserFootage} from '../src/hybrid-media.mjs';
const args=process.argv.slice(2),arg=name=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:undefined;
const dir=path.resolve(arg('project')??'projects/bento-v11');
try{
 let out;
 if(args[0]==='approve-chat'){if(!arg('file'))throw new PipelineError('MISSING_FILE','需要使用者原始回覆與明確選項JSON。');out=await approveChatSelection(dir,await readJSON(arg('file')));}
 else if(args[0]==='prepare-media')out=await prepareHybridMedia(dir);
 else if(args[0]==='compile')out=await compileHybrid(dir);
 else if(args[0]==='ingest-user'){if(!arg('input')||!arg('rights'))throw new PipelineError('MISSING_FILE','需要自有MP4/MOV與權利聲明JSON。');out=await ingestUserFootage(dir,arg('input'),await readJSON(arg('rights')));}
 else throw new PipelineError('USAGE','approve-chat --file | prepare-media | compile | ingest-user --input --rights');
 console.log(JSON.stringify({status:out.status??'ok',project_id:out.project_id??null},null,2));
}catch(e){console.error(JSON.stringify(safeError(e)));process.exitCode=1;}
