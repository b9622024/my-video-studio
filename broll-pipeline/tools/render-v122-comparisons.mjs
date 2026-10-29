import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('.'),host=path.resolve(process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host'),stage=path.join(root,'.runtime/v122-stage'),out='/workspace/outputs/broll-v122-comparison';
if(process.argv.slice(2).some(a=>!['--stills','--variant=A','--variant=B'].includes(a)))throw Error('Only private comparison previews / stills are supported');
await fs.mkdir(path.join(stage,'src'),{recursive:true});await fs.mkdir(out,{recursive:true});
try{await fs.symlink(path.join(host,'node_modules'),path.join(stage,'node_modules'));}catch(e){if(e.code!=='EEXIST')throw e;}
for(const name of ['ComparisonMath.ts','PlateComparisons.tsx'])await fs.copyFile(path.join(root,'adapters/remotion/v122',name),path.join(stage,'src',name));
const spec=JSON.parse(await fs.readFile('projects/comparison-v122/config.json','utf8'));
if(spec.scope!=='private_comparison_research_only'||spec.publication_approved!==false)throw Error('Private test scope required');
await fs.writeFile(path.join(stage,'src/config.json'),JSON.stringify(spec));
await fs.writeFile(path.join(stage,'src/index.tsx'),`import React from 'react';import {registerRoot,Composition} from 'remotion';import {PlateComparison,ComparisonSpec} from './PlateComparisons';import data from './config.json';const spec=data as ComparisonSpec;registerRoot(()=> <>{(['A','B'] as const).map(variant=><React.Fragment key={variant}>{[false,true].map(clean=><Composition key={String(clean)} id={variant+(clean?'Clean':'')} component={PlateComparison} defaultProps={{spec,variant,showLabels:!clean}} width={540} height={960} fps={30} durationInFrames={120}/>)}<Composition id={variant+'Before'} component={PlateComparison} defaultProps={{spec,variant,showLabels:true,legacyArt:true}} width={540} height={960} fps={30} durationInFrames={120}/></React.Fragment>)}</>);`);
const require=createRequire(path.join(host,'package.json'));const{bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:path.join(stage,'src/index.tsx'),publicDir:path.join(root,'.runtime/v122-public')});const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',logLevel:'error'});
try{const common={serveUrl,puppeteerInstance:browser,browserExecutable:'/usr/bin/chromium',logLevel:'error'};
 const chosen=process.argv.find(a=>a.startsWith('--variant='))?.split('=')[1];
 for(const variant of chosen?[chosen]:['A','B']){
  const composition=await selectComposition({...common,id:variant});
  if(process.argv.includes('--stills')){
   const frames=variant==='A'?[0,39,40,60,79,80,119]:[0,18,28,39,54,60,65,75,88,103,119];
   for(const frame of frames)await renderStill({...common,composition,frame,output:path.join(out,`${variant}-${frame}.png`),imageFormat:'png'});
   const clean=await selectComposition({...common,id:variant+'Clean'});
   for(const frame of variant==='A'?[0,20,39,40,60,79,80,100,119]:[0,10,18,39,45,54,75,80,88,103,110,119])await renderStill({...common,composition:clean,frame,output:path.join(out,`${variant}-clean-${frame}.png`),imageFormat:'png'});
   await renderStill({...common,composition:clean,frame:60,output:path.join(stage,'discard.png'),imageFormat:'png'});
   await renderStill({...common,composition:clean,frame:0,output:path.join(stage,'repeat.png'),imageFormat:'png'});
   if(!(await fs.readFile(path.join(stage,'repeat.png'))).equals(await fs.readFile(path.join(out,`${variant}-clean-0.png`))))throw Error('Frame determinism failed');
   const before=await selectComposition({...common,id:variant+'Before'});await renderStill({...common,composition:before,frame:60,output:path.join(out,`${variant}-before-art.png`),imageFormat:'png'});
  }else await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,outputLocation:path.join(out,`${variant}-540.mp4`),concurrency:2});
  console.log(variant+' '+(process.argv.includes('--stills')?'stills':'4-second preview')+' done');
 }
}finally{await browser.close({silent:true});}
