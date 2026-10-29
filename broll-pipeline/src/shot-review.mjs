// Evidence-led review only; never exports or mutates the original approved assets.
export function validateShotPlan(plan,sources){
 if(plan.version!=='1.1.3'||plan.status!=='awaiting_shot_and_material_review')throw Error('Review-only proposal required');
 if(plan.formal_render_allowed!==false||plan.formal_selection_changed!==false)throw Error('No automatic formal selection');
 let cursor=0;
 for(const shot of plan.shots){
  const src=sources.sources.find(s=>s.option_id===shot.option_id);
  if(!src)throw Error('Missing source');
  const [a,b]=shot.source,[c,d]=shot.timeline;
  if(![a,b,c,d,shot.speed].every(Number.isFinite)||a<0||b<=a||b>Number(src.probe.format.duration)||c!==cursor||d<=c||shot.speed!==1||Math.abs(b-a-(d-c))>1e-6)throw Error('Invalid source/timeline interval');
  if(shot.climax!==null&&(!Number.isFinite(shot.climax)||shot.climax<a||shot.climax>=b))throw Error('Climax outside source interval');
  if(!shot.start||!shot.action||!shot.end||!shot.limit)throw Error('Visible event and limits required');
  cursor=d;
 }
 if(cursor!==plan.duration_seconds||plan.shots.length<3||plan.shots.length>4)throw Error('Invalid total duration or shot count');
 return true;
}
export function evaluateShotGate(plan,approval,materials){
 const reasons=[];
 if(!approval||approval.provenance!=='user_explicit'||approval.project_id!==plan.project_id||approval.review_sha256!==plan.review_sha256||!plan.review_sha256||!approval.message?.trim()||approval.shot_order_approved!==true)reasons.push('SHOT_DESIGN_APPROVAL_REQUIRED');
 if(approval?.quality_approved!==true)reasons.push('HUMAN_QUALITY_APPROVAL_REQUIRED');
 const valid=materials?.provenance==='user_explicit'&&materials.project_id===plan.project_id&&materials.status==='approved'&&materials.message?.trim()&&Array.isArray(materials.approved_option_ids);
 const missing=plan.required_material_approvals.filter(id=>!valid||!materials.approved_option_ids?.includes(id));
 if(missing.length)reasons.push('MATERIAL_APPROVAL_REQUIRED:'+missing.join(','));
 return {formal_render_allowed:reasons.length===0,reasons};
}
