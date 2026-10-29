"""Read-only native-alpha geometry diagnostics; not a physics or art pass."""
import pathlib,json,math
from PIL import Image
P=pathlib.Path(__file__).resolve().parents[1];project=P/'projects/interaction-v123';s=json.loads((project/'config.json').read_text());samples=json.loads((project/'pose-samples.json').read_text());public=P/'.runtime/v123-public'
def pixels(asset,source_size,anchor,scale,pose):
 im=Image.open(public/asset).convert('RGBA');alpha=im.getchannel('A');px=alpha.load();angle=pose['angle']*math.pi/180;c=math.cos(angle);sn=math.sin(angle);w,h=im.size
 corners=[]
 for x,y in [(0,0),(w,0),(w,h),(0,h)]:
  x=(x-anchor[0])*scale;y=(y-anchor[1])*scale;corners.append((pose['x']+x*c-y*sn,pose['y']+x*sn+y*c))
 x0=max(0,int(min(v[0] for v in corners))-1);x1=min(540,int(max(v[0] for v in corners))+2);y0=max(0,int(min(v[1] for v in corners))-1);y1=min(960,int(max(v[1] for v in corners))+2);result=set()
 for y in range(y0,y1):
  for x in range(x0,x1):
   dx=x+.5-pose['x'];dy=y+.5-pose['y'];ix=int((dx*c+dy*sn)/scale+anchor[0]);iy=int((-dx*sn+dy*c)/scale+anchor[1])
   if 0<=ix<w and 0<=iy<h and px[ix,iy]>=128:result.add((x,y))
 return result
r=s['receiver'];im=Image.open(public/r['asset']);receiver=pixels(r['asset'],list(im.size),[0,0],r['rect'][2]/im.width,{'x':r['rect'][0],'y':r['rect'][1],'angle':0})
checks=[]
for f in [18,27,36,48,60,70,89]:
 poses=samples[f];carrier=pixels(s['carrier']['asset'],s['carrier']['sourceSize'],s['carrier']['anchor'],s['carrier']['scale'],poses['carrier']);payload=pixels(s['payload']['asset'],s['payload']['sourceSize'],s['payload']['anchor'],s['payload']['scale'],poses['payload']);overlap=len(payload&carrier)
 checks.append({'frame':f,'payload_visible_pixels':len(payload),'payload_carrier_overlap_pixels':overlap,'payload_receiver_overlap_pixels':len(payload&receiver),'carrier_receiver_overlap_pixels':len(carrier&receiver),'added_receiver_silhouette_pixels':len(payload-receiver),'payload_projection_over_carrier_fraction':overlap/max(1,len(payload))})
report={'version':'1.2.3','method':'nearest-sampled native alpha >=128 projection; contact aid only, not 3D collision/force or art validation','checks':checks,'receiver_silhouette_pixels':len(receiver),'body_assets_constant':True,'single_payload':True,'human_art_approved':False}
(project/'contact-diagnostics.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(checks,indent=2))
