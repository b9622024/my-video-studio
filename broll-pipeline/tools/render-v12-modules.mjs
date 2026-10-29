import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const root=path.resolve('.'),host=path.resolve(process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host'),stage=path.join(root,'.runtime/v12-stage'),out='/workspace/outputs/broll-v12-modules';
await fs.mkdir(path.join(stage,'src'),{recursive:true});await fs.mkdir(out,{recursive:true});
try{await fs.symlink(path.join(host,'node_modules'),path.join(stage,'node_modules'));}catch(e){if(e.code!=='EEXIST')throw e;}
await fs.copyFile('adapters/remotion/v12/MealModules.tsx',path.join(stage,'src/MealModules.tsx'));
if(process.argv.slice(2).some(a=>!['--stills','--clean'].includes(a)))throw Error('Only isolated preview/still tests are authorized by this entrypoint');
const data=JSON.parse(await fs.readFile('projects/modules-v12/modules.json','utf8'));
if(data.stage!=='isolated_module_tests_not_formal_selection'||data.formal_export_created!==false)throw Error('Module test scope required');
await fs.writeFile(path.join(stage,'src/config.json'),JSON.stringify(data));
await fs.writeFile(path.join(stage,'src/index.tsx'),`import React from 'react';import {registerRoot,Composition,AbsoluteFill} from 'remotion';import {MealModule,ModuleSpec} from './MealModules';import config from './config.json';registerRoot(()=> <>{config.modules.map(raw=>{const spec=raw as ModuleSpec;return <React.Fragment key={spec.id}>{[false,true].map(clean=><Composition key={String(clean)} id={spec.id+(clean?'Clean':'')} component={MealModule} defaultProps={{spec,showText:!clean}} width={540} height={960} fps={30} durationInFrames={spec.frames}/>)}<Composition id={spec.id+'HD'} component={MealModule} defaultProps={{spec,showText:true}} width={1080} height={1920} fps={30} durationInFrames={spec.frames}/></React.Fragment>})}</>);`);
const require=createRequire(path.join(host,'package.json'));const{bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:path.join(stage,'src/index.tsx'),publicDir:path.join(root,'.runtime/v12-public')});const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',logLevel:'error'});
try{const common={serveUrl,puppeteerInstance:browser,browserExecutable:'/usr/bin/chromium',logLevel:'error'};
for(const spec of data.modules){const composition=await selectComposition({...common,id:spec.id+(process.argv.includes('--clean')?'Clean':'')});
 if(process.argv.includes('--stills')){
  for(const frame of spec.id==='M3'?[0,40,55,68,85]:[0,30,65])await renderStill({...common,composition,frame,output:path.join(out,`${spec.id}-${frame}.jpg`),imageFormat:'jpeg',jpegQuality:95});
  const plain=await selectComposition({...common,id:spec.id+'Clean'});await renderStill({...common,composition:plain,frame:spec.frames-5,output:path.join(out,`${spec.id}-no-text.jpg`),imageFormat:'jpeg',jpegQuality:95});
  await renderStill({...common,composition:plain,frame:0,output:path.join(stage,'discard.jpg'),imageFormat:'jpeg',jpegQuality:95});await renderStill({...common,composition:plain,frame:spec.frames-5,output:path.join(stage,'repeat.jpg'),imageFormat:'jpeg',jpegQuality:95});if(!(await fs.readFile(path.join(stage,'repeat.jpg'))).equals(await fs.readFile(path.join(out,`${spec.id}-no-text.jpg`))))throw Error('Non-sequential frame determinism failed');
  const hd=await selectComposition({...common,id:spec.id+'HD'});await renderStill({...common,composition:hd,frame:spec.frames-5,output:path.join(out,`${spec.id}-1080-key.jpg`),imageFormat:'jpeg',jpegQuality:95});
 }else await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',imageFormat:'png',crf:18,outputLocation:path.join(out,`${spec.id}${process.argv.includes('--clean')?'-clean-review':''}-540.mp4`),concurrency:2});
 console.log(spec.id+' done');}
}finally{await browser.close({silent:true});}
