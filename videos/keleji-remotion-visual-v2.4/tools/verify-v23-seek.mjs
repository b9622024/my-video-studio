import path from 'node:path';
import fs from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE??'/usr/bin/chromium';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const common={serveUrl,puppeteerInstance:browser,browserExecutable,logLevel:'error'};
try{for(const id of ['MilkEditorialA','MilkFootageB']){const composition=await selectComposition({...common,id});for(const [frame,suffix] of [[60,'reference'],[119,'end'],[60,'return']]){await renderStill({...common,composition,frame,output:`out/${id}-seek-${suffix}.png`,imageFormat:'png'});}console.log(id+': captured 60 → 119 → 60');}}finally{await browser.close({silent:true});}
