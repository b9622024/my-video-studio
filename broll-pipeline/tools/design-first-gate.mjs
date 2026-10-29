import fs from 'node:fs/promises';import path from 'node:path';import {readJSON,hash} from '../src/common.mjs';import {evaluateDesignGate} from '../src/design-first.mjs';
const args=process.argv.slice(2),at=args.indexOf('--project'),dir=path.resolve(at<0?'projects/bento-v112-design':args[at+1]);
const review=await readJSON(path.join(dir,'design-review.json')),approval=await readJSON(path.join(dir,'design-approval.json'),null);
// Verify the delivered JPEG revision before a future animation job can use approval.
for(const design of review.designs){const file=path.join(review.artifact_root,design.file);if(hash(await fs.readFile(file))!==design.sha256)throw Error('Static board changed; request a new review.');}
let materials=[];const materialAt=args.indexOf('--materials');
if(materialAt>=0){const record=await readJSON(args[materialAt+1]);if(record.project_id!==review.project_id||record.provenance!=='user_explicit'||record.status!=='approved'||!record.message||!Array.isArray(record.approved_option_ids))throw Error('Explicit material-use approval required.');materials=record.approved_option_ids;}
const result=evaluateDesignGate(review,approval,materials);console.log(JSON.stringify(result,null,2));if(!result.render_allowed)process.exitCode=2;
