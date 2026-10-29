// Static composition approval and material approval are separate gates.
export const DESIGN_CRITERIA=['subject_without_text','subject_prominence','no_fake_objects','no_decoration','visual_hierarchy','not_slide_like','narration_fit'];
export function evaluateDesignGate(review,approval,approvedMaterials=[]){
 const deny=reason=>({animation_planning_allowed:false,render_allowed:false,reasons:[reason]});
 if(!approval||approval.provenance!=='user_explicit'||approval.static_composition_approved!==true||!approval.message?.trim())return deny('STATIC_DESIGN_APPROVAL_REQUIRED');
 if(approval.review_id!==review.review_id)return deny('STALE_STATIC_APPROVAL');
 const requiredScenes=review.required_scenes??['B','C'];
 if(!Array.isArray(approval.selected_design_ids)||approval.selected_design_ids.length!==requiredScenes.length)return deny('CHOOSE_ONE_DESIGN_PER_SCENE');
 const selected=approval.selected_design_ids.map(id=>review.designs.find(d=>d.id===id));
 if(selected.some(d=>!d)||new Set(selected.map(d=>d.scene)).size!==requiredScenes.length||requiredScenes.some(s=>!selected.some(d=>d.scene===s)))return deny('CHOOSE_ONE_DESIGN_PER_SCENE');
 for(const d of selected){
  if(DESIGN_CRITERIA.some(k=>!['self_checked_pending_user','pending_user','human_pass','pass'].includes(d.checks[k]?.status)))return deny('QUALITY_VETO:'+d.id);
  if(!['reviewable','approved_source'].includes(d.material_status))return deny('SUPPLEMENT_MATERIAL_REQUIRED:'+d.id);
 }
 const missing=[...new Set(selected.flatMap(d=>d.required_materials))].filter(id=>!approvedMaterials.includes(id));
 return {animation_planning_allowed:true,render_allowed:missing.length===0,reasons:missing.length?['MATERIAL_APPROVAL_REQUIRED:'+missing.join(',')]:[],selected_design_ids:approval.selected_design_ids};
}
