// Metadata can reject obvious conflicts; it cannot verify an action.
export function semanticScreen(candidate, scene) {
 const text=candidate.tags.toLowerCase();
 const words=new Set(text.match(/[a-z]+/g)??[]);
 const rules=scene.semantic_requirements;
 const cookedRice=/rice/.test(text)&&/cooked|boiled|steamed/.test(text);
 const conflicts=rules.negative_patterns.filter(p=>p==='grain'&&cookedRice?false:p==='restaurant'?false:p.includes(' ')?text.includes(p):[...words].some(w=>w===p||w===p+'s'));
 if(scene.id==='A'&&/industrial|cardboard|logistics|boxing|boxer|bird|gifts/.test(text))conflicts.push('non_food_box_context');
 if(scene.id==='A'&&/eating|dining|diner/.test(text)&&!/pack|prepar|container|bento/.test(text))conflicts.push('dining_not_meal_packing');
 if(scene.id==='C'&&/rice fields?|terraces?|rice farming|landscape|paddy/.test(text))conflicts.push('rice_field_not_cooked_rice');
 if(scene.id==='C'&&/dumplings?|parcels/.test(text))conflicts.push('rice_dumpling_recipe_not_scooping_plain_rice');
 const objects=scene.id==='A'?(/lunch|bento|container|meal|box/.test(text)&&/food|meal|lunch|bento/.test(text)):scene.id==='B'?/vegetables?|broccoli|carrots?|salad|cabbage/.test(text):/rice/.test(text);
 const actionHint=/pack|prepar|serv|scoop|placing|putting|cook|chop/.test(text);
 return {stage:'metadata',status:conflicts.length?'excluded':objects?'metadata_only':'excluded',
  reasons:conflicts.length?['排除情境標籤：'+conflicts.join(', ')]:objects?['物件詞可能符合；動作及物件狀態須看影片確認。']:['缺少主要物件相關標籤，保守排除。'],
  conflicts,object_hint:objects,action_hint:actionHint,action_verified:false,
  ranking_hint:(objects?20:0)+(actionHint?10:0)+(scene.id==='C'&&cookedRice?25:0)+(scene.id==='A'&&/bento|lunch box|meal prep|container/.test(text)?30:0)};
}
