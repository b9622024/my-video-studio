import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const mode=process.argv[2]??'--stills';
if(!['--stills','--render'].includes(mode)||process.argv.length>3)throw Error('Use --stills or --render');
const root=path.resolve('.'),host=process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host';
const out=process.env.OUTPUT_DIR??'/workspace/outputs/visual-language-v201',stage=path.join(root,'.runtime/v201-stage');
for(const name of ['style-tokens.json','prototypes.json'])await fs.copyFile(path.join(root,'projects/recognizable-v201',name),path.join(root,'adapters/remotion/v201',name));
const files=['Objects.tsx','Prototype.tsx','MotionMath.ts','style-tokens.json','prototypes.json'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHash=sha(Buffer.concat(await Promise.all(files.map(f=>fs.readFile(path.join(root,'adapters/remotion/v201',f))))));
if(mode==='--render'){
 const gate=JSON.parse(await fs.readFile('projects/recognizable-v201/object-recognition-gate.json','utf8'));
 if(gate.source_sha256!==sourceHash||!gate.creator_static_pass||gate.human_test_completed!==false)throw Error('Matching creator object gate required; never claim a human test');
 if(!gate.creator_form_scores||Object.values(gate.creator_form_scores).flatMap(Object.values).some(score=>typeof score!=='number'||score<3))throw Error('Critical creator form score below 3; revise before motion');
 for(const still of gate.reviewed_stills)if(sha(await fs.readFile(path.join(out,still.file)))!==still.sha256)throw Error('Reviewed still changed');
}
await fs.mkdir(stage+'/src',{recursive:true});await fs.mkdir(out,{recursive:true});try{await fs.symlink(host+'/node_modules',stage+'/node_modules')}catch(e){if(e.code!=='EEXIST')throw e}
for(const file of files)await fs.copyFile(path.join(root,'adapters/remotion/v201',file),stage+'/src/'+file);
await fs.writeFile(stage+'/src/index.tsx',`import React from 'react';import{Composition,registerRoot}from'remotion';import{Prototype}from'./Prototype';registerRoot(()=> <>{(['A','B','C'] as const).flatMap(id=>[true,false].map(text=><Composition key={id+text} id={id+(text?'':'-blind')} component={Prototype} defaultProps={{id,text}} width={540} height={960} fps={30} durationInFrames={75}/>))}</>);`);
const require=createRequire(host+'/package.json');const{bundle}=require('@remotion/bundler'),{openBrowser,selectComposition,renderStill,renderMedia}=require('@remotion/renderer');
const serveUrl=await bundle({entryPoint:stage+'/src/index.tsx'}),browser=await openBrowser('chrome',{browserExecutable:process.env.CHROMIUM_PATH??'/usr/bin/chromium'});
try{
 const common={serveUrl,puppeteerInstance:browser,browserExecutable:process.env.CHROMIUM_PATH??'/usr/bin/chromium',logLevel:'error'};
 for(const id of ['A','B','C']){
  const composition=await selectComposition({...common,id:id+'-blind'});
  for(const frame of [0,12,18,25,32,40,48,56,63,74])await renderStill({...common,composition,frame,output:path.join(out,`${id}-${frame}.png`)});
  if(mode==='--render'){
   for(const text of [true,false]){
    const composition=await selectComposition({...common,id:id+(text?'':'-blind')});
    await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709',crf:18,concurrency:2,outputLocation:path.join(out,`${id}${text?'':'-no-text'}-540.mp4`)});
   }
  }
 }
}finally{await browser.close({silent:true})}
await fs.writeFile(path.join(out,'render-receipt.json'),JSON.stringify({source_sha256:sourceHash,mode,frames:75,fps:30,human_approved:false},null,2));
console.log(mode==='--render'?'Six private style-review previews rendered.':'Intermediate frames ready; inspect object gate before rendering.');
