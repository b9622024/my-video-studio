// Never invoked before explicit scene selections. V2.5 remains untouched.
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
import {compileHybrid} from '../src/hybrid.mjs';import {writeJSON,hash,PipelineError,safeError} from '../src/common.mjs';
const args=process.argv.slice(2),value=n=>args.includes('--'+n)?args[args.indexOf('--'+n)+1]:undefined;
const root=path.resolve('.'),project=path.resolve(value('project')??'projects/bento-v11'),host=path.resolve(value('host')??'.runtime/v11-host');
const final=args.includes('--final');
try{
 const input=await compileHybrid(project,{dimensions:final?[1080,1920]:[540,960]});
 const require=createRequire(path.join(host,'package.json'));
 const {bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderMedia}=require('@remotion/renderer');
 if(require('remotion/package.json').version!=='4.0.539')throw new PipelineError('HOST_VERSION_MISMATCH','使用V2.5相同4.0.539版本。');
 const stage=path.join(root,'.runtime/hybrid-render');await fs.mkdir(path.join(stage,'src'),{recursive:true});
 await fs.rm(path.join(stage,'node_modules'),{force:true,recursive:true});await fs.symlink(path.join(host,'node_modules'),path.join(stage,'node_modules'));
 await fs.copyFile('adapters/remotion/v11/HybridComposition.tsx',path.join(stage,'src/HybridComposition.tsx'));await writeJSON(path.join(stage,'src/input.json'),input);
 await fs.writeFile(path.join(stage,'src/index.tsx'),`import React from 'react';import {Composition,registerRoot} from 'remotion';import {HybridComposition} from './HybridComposition';import input from './input.json';registerRoot(()=> <Composition id="HybridBroll" component={HybridComposition} defaultProps={{bundle:input as any}} width={${input.timeline.dimensions[0]}} height={${input.timeline.dimensions[1]}} fps={${input.timeline.fps}} durationInFrames={${input.timeline.duration_frames}}/>);`);
 const serveUrl=await bundle({entryPoint:path.join(stage,'src/index.tsx'),publicDir:project});
 const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',logLevel:'error'});
 const relative=final?'outputs/final-1080.mp4':'outputs/preview-540.mp4',output=path.join(project,relative);await fs.mkdir(path.dirname(output),{recursive:true});
 try{const common={serveUrl,puppeteerInstance:browser,browserExecutable:'/usr/bin/chromium',logLevel:'error'};const composition=await selectComposition({...common,id:'HybridBroll'});await renderMedia({...common,composition,codec:'h264',crf:final?18:23,outputLocation:output,pixelFormat:'yuv420p',concurrency:2});}finally{await browser.close({silent:true});}
 const artifact={revision_id:input.approved.revision_id,local_path:relative,sha256:hash(await fs.readFile(output)),dimensions:input.timeline.dimensions,fps:30,stage:final?'final_output_pending_verification':'preview_pending_user_quality_review'};
 await writeJSON(path.join(project,final?'final-artifact.json':'preview-artifact.json'),artifact);console.log(JSON.stringify(artifact,null,2));
}catch(e){console.error(JSON.stringify(safeError(e)));process.exitCode=1;}
