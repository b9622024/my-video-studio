"""Build unapproved hybrid review data from locally preserved V1.0.1 evidence."""
from pathlib import Path
import json, shutil, hashlib, os
old=Path(os.environ.get('V101_REVIEW_PROJECT','/workspace/broll-v101/broll-pipeline/projects/bento-v101'))
out=Path('projects/bento-v11');(out/'previews').mkdir(parents=True,exist_ok=True)
if (out/'approved-assets.json').exists():raise RuntimeError('Approved project must not be reinitialized; create a new project/version.')
data=json.load(open(old/'broll-candidates.json'));idx={c['candidate_id']:c for r in data['scenes'] for c in r['screened_candidates'] if c.get('local_preview')}
base=json.load(open(old/'scene-plan.json'))
plan={**base,'project_id':'bento-v11','version':'1.1','title':'外食族的便當，怎麼安排比較均衡？','source_script':'外食先看看餐點的組成。配菜也看看蔬菜的搭配。主食份量，依自己的需求調整。','script_provenance':'Codex自行撰寫並依現有候選調整的12秒測試口白；非使用者正式逐字稿。','fps':30,'duration_seconds':12,'stage':'awaiting_user_selection','scenes':[]}
settings=[('A','外食餐點情境','外食先看看餐點的組成。','context_support','看見真實可食用餐點，帶入觀察餐點組成的概念。',['prepared meal'],'prepared edible meal','餐點特寫即可支援概念，不聲稱裝便當。'),('B','蔬菜與配菜','配菜也看看蔬菜的搭配。','context_support','以實際烹調的蔬菜呈現配菜觀察，不聲稱裝盒完成。',['cooked vegetables'],'cooked or being cooked','不要求夾入便當的完整動作；準備蔬菜可支援概念。'),('C','主食份量','主食份量，依自己的需求調整。','concept_explanation','用熟白飯特寫與非量化資訊圖說明觀察與調整。',['cooked rice'],'cooked edible rice','份量是解說概念；無測量不能顯示克數或熱量。')]
for i,(sid,name,narr,role,intent,objects,state,reason) in enumerate(settings):
 s={**base['scenes'][i],'id':sid,'name':name,'narration':narr,'duration_seconds':4,'visual_role':role,'visual_intent':intent,'required_evidence':{'event_mandatory':False,'objects':objects,'object_state':state,'action':None,'context':'meal preparation or everyday dining'},'fallback_modes':['contextual_broll','information_motion_graphics','user_provided_footage'],'fallback_reason':reason,'human_review_required':True,'visual_mode':'contextual_broll','event':'本段為概念輔助，不宣稱實際裝餐／盛飯事件。','required_actions':[],'misleading_risks':['不可將情境畫面當成營養均衡、份量量測、減重成果或人物背書。']}
 s['required_objects']=objects;s['viewer_takeaway']=intent
 s['semantic_requirements']={'primary_objects':objects,'object_state':state,'specific_action':'context support; no exact event claimed','context':'everyday meal or meal preparation','excluded_contexts':['unrelated farming','unmeasured health or nutrition claims'],'negative_patterns':['paddy','agriculture','harvest'],'alternative':reason}
 s['search_queries']=[['prepared meal','lunch food plate'],['cooking vegetables','cooked leafy vegetables'],['cooked white rice','rice meal close up']][i]
 s['animation_refs']=['portion_concept'] if sid=='C' else []
 plan['scenes'].append(s)
options=[]
def footage(sid,num,pid,start,layout,reason,graphic=None):
 c=idx['pixabay-'+str(pid)];lp=c['local_preview']
 for f in [lp['video']]+[f['path'] for f in lp['frames']]:shutil.copy(old/f,out/f)
 options.append({'option_id':sid+str(num),'scene_id':sid,'number':num,'mode':'contextual_broll','match_status':'contextual_match','title':reason,'asset_id':c['asset_id'],'candidate_id':c['candidate_id'],'layout':layout,'reason':reason,'not_claimed':'不聲稱裝便當、盛飯或營養量測事件。','review_status':'pending','action_verified':False,'visual_check':{'status':'frames_reviewed_contextual','basis':'V1.0.1實際影格紀錄；改以概念情境需求評估，仍須使用者核准。','objects_and_state':True,'exact_action_verified':False,'source_review_hash':lp['sha256']},'source_url':c['source_url'],'author':c['author'],'license_url':c['license_url'],'license_checked_at':c['license_checked_at'],'variants':c['variants'],'duration':c['duration'],'width':c['width'],'height':c['height'],'selected_trim':{'start':start,'end':start+4},'crop_parameters':{'aspect_ratio':'9:16','object_position_x':.5,'object_position_y':.5,'verified':False},'preview':lp,'source_sha256':None,'graphic':graphic})
footage('A',1,227128,1,'full_frame','餐盤肉與沙拉：外食情境，不代表均衡已驗證。')
footage('A',2,11623,2,'split_screen','牛肉與白飯特寫，搭配觀察餐點組成提示。',{'kind':'category_groups','labels':['餐點','組成','搭配'],'caption':'先觀察，再選擇'})
footage('B',1,11605,34,'full_frame','實際烹調綠葉菜，作配菜情境，不冒稱放入餐盒。')
options.append({'option_id':'B2','scene_id':'B','number':2,'mode':'information_motion_graphics','match_status':'motion_graphics_fallback','title':'蔬菜與其他配菜的搭配關係圖','layout':'pure_motion','reason':'逐步連結的角色關係圖，不用食物插畫或定量比例。','review_status':'pending','graphic':{'kind':'category_groups','labels':['蔬菜','其他配菜','餐點搭配'],'caption':'種類與搭配概念，不是營養評估'}})
footage('C',1,11626,4,'contextual_annotation','熟白飯特寫＋非量化份量概念圖，沒有盛飯或數字聲稱。',{'kind':'portion_concept','labels':['觀察','依需求','調整'],'caption':'概念示意，沒有建議克數或固定比例'})
options.append({'option_id':'C2','scene_id':'C','number':2,'mode':'information_motion_graphics','match_status':'motion_graphics_fallback','title':'觀察主食份量，再依需求調整','layout':'pure_motion','reason':'抽象範圍帶與游標呈現觀察到調整的過程，不模擬食物、不顯示數字。','review_status':'pending','graphic':{'kind':'portion_concept','labels':['觀察','依需求','調整'],'caption':'概念示意，沒有建議克數或固定比例'}})
revision=hashlib.sha256(json.dumps({'plan':plan,'options':options},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
review={'schema_version':'1.1','project_id':'bento-v11','revision_id':revision,'status':'awaiting_user_selection','options':options,'user_shooting_suggestions':{'A':'自己的餐點或餐盒全景，避免他人臉部與商標。','B':'蔬菜烹調或夾菜，保留工具與食物。','C':'熟白飯與調整份量；未量測不能標克數。'},'reply_format':'例如 A：候選1；B：資訊動畫（B2）；C：候選1。請明確選擇每場景。'}
for name,value in [('scene-plan.json',plan),('review-options.json',review),('asset-manifest.json',{'schema_version':'1.1','project_id':'bento-v11','status':'candidates_only','assets':[o for o in options if 'asset_id' in o],'notes':['source_sha256=null：正式素材尚未核准／下載；preview的hash只驗證審核副本。']}),('edit-timeline.json',{'schema_version':'1.1','project_id':'bento-v11','status':'awaiting_user_selection','fps':30,'duration_frames':360,'dimensions':[540,960],'clips':[],'narration':None,'captions':[]})]:
 (out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
print({'options':len(options),'real_videos':4,'approved_assets_created':False,'new_API_requests':0})
