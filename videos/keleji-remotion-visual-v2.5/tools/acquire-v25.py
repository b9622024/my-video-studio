"""Restore V2.5 trims from verified local sources or the official CDN. No evasion/retry."""
from pathlib import Path
import argparse,json,hashlib,tempfile,urllib.request,urllib.error,subprocess
P=Path(__file__).resolve().parents[1]
URLS={'6535488':'https://videos.pexels.com/video-files/6535488/6535488-uhd_2160_4096_30fps.mp4','11158788':'https://videos.pexels.com/video-files/11158788/11158788-hd_1920_1080_24fps.mp4'}
FILTERS={'v25-pour.mp4':'fps=30,scale=1080:2048:flags=lanczos','v25-compare-left.mp4':'fps=30,crop=1700:2800:350:800,scale=900:1482:flags=lanczos','v25-compare-portion.mp4':'fps=30,scale=1920:1080'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source653');ap.add_argument('--source111');ap.add_argument('--download',action='store_true');args=ap.parse_args();m=json.loads((P/'asset-manifest.json').read_text());sources={s['id']:s for s in m['sources']}
 with tempfile.TemporaryDirectory() as temp:
  paths={k:Path(v) for k,v in [('6535488',args.source653),('11158788',args.source111)] if v}
  for a in m['assets']:
   target=P/a['path']
   if target.exists():
    assert hashlib.sha256(target.read_bytes()).hexdigest()==a['sha256'],'Existing asset changed; preserve/review before replacement'
    continue
   ident=a['source_id']
   if ident not in paths:
    if not args.download:raise SystemExit('Missing licensed production trim. Restore backup or pass local --source653/--source111. Optional --download uses only official CDN and stops on403.')
    paths[ident]=Path(temp)/(ident+'.mp4')
    try:
     with urllib.request.urlopen(URLS[ident]) as response:paths[ident].write_bytes(response.read())
    except urllib.error.HTTPError as e:raise SystemExit(f'Official source HTTP{e.code}; use official manual download or configured API. No bypass or automatic retry.')
   assert hashlib.sha256(paths[ident].read_bytes()).hexdigest()==sources[ident]['sha256'],'Source hash changed; review asset'
   start,end=a['source_seconds'];subprocess.run(['ffmpeg','-v','error','-ss',str(start),'-i',str(paths[ident]),'-t',str(end-start),'-an','-vf',FILTERS[a['id']],'-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart','-n',str(target)],check=True)
 print('V2.5 assets present. Different FFmpeg builds can change derivative hashes; review and record before publishing.')
if __name__=='__main__':main()
