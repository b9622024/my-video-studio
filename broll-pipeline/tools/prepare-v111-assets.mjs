// Reuse approved A1; C1 image is an explicitly separate review proposal only.
import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';import {hash,safeURL,writeJSON} from '../src/common.mjs';
const source=path.resolve(process.env.V11_PROJECT??'/workspace/broll-v11/broll-pipeline/projects/bento-v11'),target=path.resolve('.runtime/v111-public/assets');await fs.mkdir(target,{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(source,'asset-manifest.json'),'utf8'));const a=manifest.assets.find(a=>a.option_id==='A1'&&a.review_status==='approved');if(!a)throw Error('Approved A1 missing');
const video=path.join(source,a.local_path);if(hash(await fs.readFile(video))!==a.source_sha256)throw Error('A1 source changed');
const still=spawnSync('ffmpeg',['-v','error','-y','-ss','4.95','-i',video,'-frames:v','1',path.join(target,'a1-plate.jpg')]);if(still.status!==0)throw Error('A1 frame extraction failed');
await writeJSON('projects/bento-v111-visual-tests/a1-design-source.json',{option_id:'A1',source_url:a.source_url,author:a.author,license_url:a.license_url,source_sha256:a.source_sha256,frame_time_seconds:4.95,derived_still_sha256:hash(await fs.readFile(path.join(target,'a1-plate.jpg'))),purpose:'same-source vegetable focus, no invented food'});
if(process.argv.includes('--with-c1-proposal')){
 const d=JSON.parse(await fs.readFile(path.join(source,'review-options.json'),'utf8')),c=d.options.find(o=>o.option_id==='C1'),url=c.variants.find(v=>v.name==='large').thumbnail;
 if(!safeURL(url))throw Error('Invalid official image URL');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!r.ok){await r.body?.cancel();throw Error('C1 proposal GET failed; no retry/bypass');}
 const b=Buffer.from(await r.arrayBuffer());if(b.length>5*1024*1024)throw Error('Image cap exceeded');await fs.writeFile(path.join(target,'c1-rice-proposal.jpg'),b);
 await writeJSON('projects/bento-v111-visual-tests/c1-proposal-source.json',{status:'proposal_only_not_approved',option_id:'C1',source_url:c.source_url,author:c.author,license_url:c.license_url,image_url:url,http_status:r.status,sha256:hash(b)});
}
