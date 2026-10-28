import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE??'/usr/bin/chromium';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const common={serveUrl,puppeteerInstance:browser,browserExecutable,logLevel:'error'};
try{const composition=await selectComposition({...common,id:'MilkHybridV24'});for(const [frame,suffix] of [[180,'reference'],[359,'end'],[180,'return']])await renderStill({...common,composition,frame,output:`out/v24-seek-${suffix}.png`,imageFormat:'png'});console.log('Captured 180 → 359 → 180');}finally{await browser.close({silent:true});}
