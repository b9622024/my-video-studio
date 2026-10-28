import path from 'node:path';
import fs from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia,renderStill} from '@remotion/renderer';

const args=process.argv.slice(2);
const root=process.cwd();
const out=path.resolve(root,'out');
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE ?? '/usr/bin/chromium';
await fs.mkdir(out,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve(root,'src/index.ts'),publicDir:path.resolve(root,'public')});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const common={serveUrl,puppeteerInstance:browser,browserExecutable,logLevel:'error'};
try {
  const composition=await selectComposition({...common,id:args.includes('--B')?'MilkFootageB':'MilkEditorialA'});
  const start=performance.now();
  if(args.includes('--stills')) {
    for(const frame of [0,24,42,60,90,119]){
      const output=path.join(out,`${composition.id}-frame-${String(frame).padStart(3,'0')}.png`);
      await renderStill({...common,composition,frame,output,imageFormat:'png'});
      console.log(`Still ${frame}: ${output}`);
    }
  } else {
    const preview=args.includes('--preview');
    const outputLocation=path.join(out,`${composition.id}-${preview?'preview-540p':'master-1080x1920'}.mp4`);
    await renderMedia({...common,composition,codec:'h264',pixelFormat:'yuv420p',outputLocation,scale:preview?.5:1,crf:preview?22:18,concurrency:2,muted:true,
      onProgress:({progress})=>{if(progress===1) console.log('Render complete');}});
    await fs.writeFile(path.join(out,`${composition.id}-${preview?'preview':'final'}-render.json`),JSON.stringify({composition:composition.id,width:preview?540:1080,height:preview?960:1920,fps:30,durationInFrames:120,codec:'h264',muted:true,elapsedSeconds:(performance.now()-start)/1000},null,2));
    console.log(outputLocation);
  }
} finally {await browser.close({silent:true});}
