// New art-review checkpoint only; does not invoke or modify any legacy render path.
export function evaluateObjectArtGate(review,approval){
 const reasons=[];
 const matches=approval?.provenance==='user_explicit'&&approval.art_approved===true&&approval.review_id===review.review_id&&typeof approval.message==='string'&&approval.message.trim()&&Array.isArray(approval.state_ids)&&approval.state_ids.length===review.state_ids.length&&new Set(approval.state_ids).size===review.state_ids.length&&review.state_ids.every(id=>approval.state_ids.includes(id));
 if(!matches)reasons.push('EXPLICIT_ART_APPROVAL_REQUIRED_FOR_THIS_REVISION');
 if(review.motion_assets_ready!==true)reasons.push('REGISTERED_MOTION_ASSETS_NOT_READY');
 return {art_approved:Boolean(matches),animation_allowed:reasons.length===0,reasons};
}
