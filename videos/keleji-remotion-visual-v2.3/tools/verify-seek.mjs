import path from 'node:path';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill} from '@remotion/renderer';
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE??'/usr/bin/chromium';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable,logLevel:'error'});
const common={serveUrl,puppeteerInstance:browser,browserExecutable,logLevel:'error'};
try {
 const composition=await selectComposition({...common,id:'MilkPourStudy'});
 await renderStill({...common,composition,frame:65,output:'out/seek-reference-065.png',imageFormat:'png'});
 await renderStill({...common,composition,frame:119,output:'out/seek-119.png',imageFormat:'png'});
 await renderStill({...common,composition,frame:65,output:'out/seek-065.png',imageFormat:'png'});
 const hash=async(file)=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
 const matches=(await hash('out/seek-065.png'))===(await hash('out/seek-reference-065.png'));
 await fs.writeFile('out/seek-check.json',JSON.stringify({testedOrder:[65,119,65],frame65ByteIdentical:matches},null,2));
 console.log('Nonsequential seek captured; byte-identical:',matches,'; pixel tolerance is validated by tools/qa_video.py');
}finally{await browser.close({silent:true});}
