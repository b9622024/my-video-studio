/** Authorized isolated design studies, never an approved 12-second composition. */
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('.'),host=path.resolve(process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host'),stage=path.join(root,'.runtime/v111-stage'),out='/workspace/outputs/broll-v111-visual-tests';
await fs.mkdir(path.join(stage,'src'),{recursive:true});await fs.mkdir(out,{recursive:true});
try{await fs.symlink(path.join(host,'node_modules'),path.join(stage,'node_modules'));}catch(e){if(e.code!=='EEXIST')throw e;}
for(const file of ['EditorialPrimitives.tsx','EditorialVisualTests.tsx'])await fs.copyFile(path.join(root,'adapters/remotion/v111',file),path.join(stage,'src',file));
await fs.writeFile(path.join(stage,'src/index.tsx'),`import React from 'react';import {registerRoot,Composition} from 'remotion';import {EditorialVisualTest} from './EditorialVisualTests';registerRoot(()=> <>{(['B2','C2A','C2B'] as const).map(kind=><React.Fragment key={kind}><Composition id={kind} component={EditorialVisualTest} defaultProps={{kind,showText:true}} width={540} height={960} fps={30} durationInFrames={120}/><Composition id={kind+'Clean'} component={EditorialVisualTest} defaultProps={{kind,showText:false}} width={540} height={960} fps={30} durationInFrames={120}/></React.Fragment>)}</>);`);
const require=createRequire(path.join(host,'package.json'));const {bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:path.join(stage,'src/index.tsx'),publicDir:path.join(root,'.runtime/v111-public')});const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',logLevel:'error'});
try{
 const common={serveUrl,puppeteerInstance:browser,browserExecutable:'/usr/bin/chromium',logLevel:'error'};
 for(const id of ['B2','C2A','C2B']){
  const composition=await selectComposition({...common,id});
  if(process.argv.includes('--stills')){
   for(const frame of [0,55,110])await renderStill({...common,composition,frame,output:path.join(out,`${id}-${frame}.jpg`),imageFormat:'jpeg',jpegQuality:95});
   const plain=await selectComposition({...common,id:id+'Clean'});await renderStill({...common,composition:plain,frame:90,output:path.join(out,`${id}-no-text.jpg`),imageFormat:'jpeg',jpegQuality:95});
   await renderStill({...common,composition:plain,frame:90,output:path.join(stage,`${id}-repeat.jpg`),imageFormat:'jpeg',jpegQuality:95});
   if(!(await fs.readFile(path.join(stage,`${id}-repeat.jpg`))).equals(await fs.readFile(path.join(out,`${id}-no-text.jpg`))))throw Error('Frame determinism failed');
  }else await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',crf:20,outputLocation:path.join(out,`${id}-540.mp4`),concurrency:2});
  console.log(id+' '+(process.argv.includes('--stills')?'stills':'4s preview')+' done');
 }
}finally{await browser.close({silent:true});}
