"""Review-only source excerpts; no composition, animation or approved asset export."""
import argparse,hashlib,json,pathlib,subprocess,shutil,zipfile
from PIL import Image,ImageDraw,ImageFont
P=pathlib.Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--a1',required=True);a.add_argument('--b1',required=True);a.add_argument('--c1',required=True);a.add_argument('--out',default='/workspace/outputs/broll-v113-shot-review');args=a.parse_args()
out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
project=P/'projects/bento-v113-shots'
sha=lambda p:hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def run(cmd):return subprocess.check_output(cmd,text=True)
def probe(p):return json.loads(run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','format=duration:stream=width,height,r_frame_rate,codec_name,nb_frames,color_space,color_transfer,color_primaries','-of','json',str(p)]))
def ff(src,start,end,target,vf=None,fps=None):
 cmd=['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(src),'-t',str(end-start),'-an']
 if vf:cmd+=['-vf',vf]
 if fps:cmd+=['-r',str(fps)]
 subprocess.run(cmd+['-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(target)],check=True)
options=json.loads((P/'projects/bento-v11/review-options.json').read_text())['options']
by={o['option_id']:o for o in options}
specs=[('A1',args.a1,1,5,None,[1,3,4.96]),('B1',args.b1,35,40,820,[35,36.8,39.966667]),('C1',args.c1,8,11,850,[8,9.5,10.966667])]
prior_sources=json.loads((P/'projects/bento-v112-design/sources.json').read_text())['sources']
expected={s['option_id']:s['sha256'] for s in prior_sources}
a_manifest=json.loads((P/'projects/bento-v11/asset-manifest.json').read_text())
expected['A1']=next(v['source_sha256'] for v in a_manifest['assets'] if v['option_id']=='A1')
for key,src,*rest in specs:
 if sha(src)!=expected[key]:raise ValueError('Source differs from prior reviewed download: '+key)
sources=[];artifacts=[]
for key,src,start,end,x,times in specs:
 meta=probe(src);option=by[key];s=meta['streams'][0]
 entry={'option_id':key,'source_url':option['source_url'],'author':option['author'],'license_url':option['license_url'],'license_checked_at':option['license_checked_at'],'download_sha256':sha(src),'bytes':pathlib.Path(src).stat().st_size,'probe':meta,'source_interval_seconds':[start,end],'use_status':'existing_A1_approval_unchanged' if key=='A1' else 'candidate_only_requires_explicit_material_approval','original_file_hint':pathlib.Path(src).name,'rendition':'medium' if key=='A1' else 'large','official_media_url':next(v['url'] for v in option['variants'] if v['name']==('medium' if key=='A1' else 'large'))}
 sources.append(entry)
 vf='scale=540:960' if key=='A1' else f'crop=608:1080:{x}:0,scale=540:960'
 target=out/f'{key}-portrait-review.mp4';ff(src,start,end,target,vf)
 files=[target]
 if key!='A1':
  full=out/f'{key}-source-review.mp4';ff(src,start,end,full);files.append(full)
 for f in files:
  q=probe(f);subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
  artifacts.append({'file':f.name,'sha256':sha(f),'bytes':f.stat().st_size,'source_option':key,'probe':q,'decode_errors':0,'review_only':True,'audio':False})
 for i,t in enumerate(times):
  for suffix,filter_ in [('portrait',vf),('source','scale=960:-2')]:
   target=out/f'{key}-{i+1}-{suffix}.jpg'
   subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(src),'-frames:v','1','-vf',filter_,'-q:v','2',str(target)],check=True)
 # Equal-spaced temporal evidence at 5fps, not an objective quality score.
 frames=[]
 for n in range(int((end-start)*5)):
  t=start+n/5;file=out/f'.sample-{key}.jpg'
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(src),'-frames:v','1','-vf','scale=256:144:force_original_aspect_ratio=decrease',str(file)],check=True)
  frames.append((t,Image.open(file).copy()))
 cols=5;sheet=Image.new('RGB',(cols*256,170*((len(frames)+cols-1)//cols)),(240,239,232));d=ImageDraw.Draw(sheet)
 for i,(t,im) in enumerate(frames):
  xx=i%cols*256;yy=i//cols*170;sheet.paste(im,(xx,yy+24));d.text((xx+5,yy+5),f'{key} source {t:.2f}s',fill='#142838')
 sheet.save(out/f'{key}-motion-evidence.jpg',quality=94);(out/f'.sample-{key}.jpg').unlink()
# Sequential portrait keyframes: three shots × start/action/end. No captions on media.
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',21)
sheet=Image.new('RGB',(900,1770),'#f4f0e6');d=ImageDraw.Draw(sheet)
labels={'A1':['餐具接觸餐點','切開過程','切口與餐盤'],'B1':['鍋內聚菜','撈起離開液體','托住蔬菜'],'C1':['白飯近景','原片鏡頭移動','白飯仍為同一份']}
for row,(key,src,start,end,x,times) in enumerate(specs):
 for col,t in enumerate(times):
  im=Image.open(out/f'{key}-{col+1}-portrait.jpg');im=im.resize((270,480));xx=col*300+15;yy=row*590+65;sheet.paste(im,(xx,yy));d.text((xx,yy-52),f'{key} 原片 {t:.2f}s',font=font,fill='#152d40');d.text((xx,yy+486),labels[key][col],font=font,fill='#152d40')
sheet.save(out/'shot-continuity.jpg',quality=95)
(project/'sources.json').write_text(json.dumps({'version':'1.1.3','new_api_requests':0,'sources':sources},ensure_ascii=False,indent=2)+'\n')
(project/'artifacts.json').write_text(json.dumps({'version':'1.1.3','scope':'independent_source_review_clips_not_a_12s_film','artifact_root':str(out),'artifacts':artifacts},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'clips':len(artifacts),'out':str(out),'source_hashes_verified':True}))
