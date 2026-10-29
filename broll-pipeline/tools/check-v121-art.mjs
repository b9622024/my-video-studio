import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {evaluateObjectArtGate} from '../src/object-art-gate.mjs';
const dir=path.resolve('projects/m3-v121-art');const review=JSON.parse(await fs.readFile(path.join(dir,'art-review.json'),'utf8'));const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const item of review.artifacts)if(hash(await fs.readFile(path.join(review.artifact_root,item.file)))!==item.sha256)throw Error('Art changed; new review required: '+item.file);
const expected=hash(review.artifacts.map(v=>v.file+':'+v.sha256).sort().join('\n'));if(expected!==review.review_id)throw Error('Review revision mismatch');
let approval=null;try{approval=JSON.parse(await fs.readFile(path.join(dir,'art-approval.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const result=evaluateObjectArtGate(review,approval);console.log(JSON.stringify({artifact_hashes_valid:true,...result},null,2));if(!result.animation_allowed)process.exitCode=2;
